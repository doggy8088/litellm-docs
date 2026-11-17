---
sidebar_label: "重試、備援與冷卻"
description: "LiteLLM Router 如何以重試、備援、順序備援、加權容錯移轉、串流復原與冷卻處理失敗。"
---

# 重試、備援與冷卻 {#retries-fallbacks-and-cooldowns}

{/* keep-version-note */}

router 有三種處理失敗的工具，每一種的作用範圍都不同。重試會再次嘗試同一個模型群組，而新的挑選可能
落在不同的部署上。備援會將請求移到不同的模型群組。冷卻會讓一個部署在幾秒內退出每一次挑選、退出每一個
請求。

![在每個模型群組內，策略挑選一個部署。策略在 gpt-4o 中挑中 D1，它回傳 429 並冷卻；重試在同一個群組中
挑中 D3，它也回傳 429；然後請求備援到 opus，策略在那裡挑中 D5，它向 router 回傳 200](../img/reliability-1.svg)

每一個決策都會讀取關於失敗的三個事實：它的種類（速率限制、上下文視窗、內容原則、驗證、找不到、逾時……）、
它的狀態碼與它的 `Retry-After`。router 從提供者的例外取得這些，並僅憑它們做決定。

router 是唯一的重試迴圈。它在提供者呼叫上將 `max_retries` 設為 0，因此提供者 SDK 與 HTTP 用戶端
都不會自行重試，而且每次重試都可以挑選不同的部署。

## 重試 {#retries}

重試迴圈會執行第一次嘗試。當該次嘗試失敗時，router 會算出這個請求能得到多少次重試、判斷這次失敗是否
值得重試、等待，然後再次迴圈。

![重試迴圈：防護欄介入會立即放棄，否則 router 會算出重試次數、檢查失敗、睡眠、再次選取並略過失敗的部署，
然後回傳、迴圈，或將失敗交給備援遍歷](../img/reliability-2.svg)

在這些情況下，失敗不值得重試。

- 設定了 `context_window_fallbacks` 時的上下文視窗錯誤，或設定了 `content_policy_fallbacks` 時的
  內容原則錯誤，因為備援會比同一個模型的另一個部署做得更好
- 401、403、408、409 與 429 以外的 4xx 狀態
- 找不到錯誤
- 沒有健康的部署剩下、且存在備援時的速率限制
- 只有單一部署的群組中的驗證或權限錯誤
- 沒有健康的部署剩下時的任何失敗

當群組有多個部署且有些仍然健康時，等待時間為零，因為下一次嘗試可以去別的地方。否則 router 會遵循
提供者的 `Retry-After`，最多一分鐘。沒有 `Retry-After` 時，它會從 0.5 秒起指數退避，最高到 8 秒，
永遠不低於 router 的 `retry_after`，並加上最多 0.75 秒的抖動。

### 重試原則 {#retry-policies}

`retry_policy` 設定每種失敗種類的重試次數。例如，速率限制比重試逾時更多次。`model_group_retry_policy`
則對每個模型群組做同樣的事。

```python
Router(
    model_list=...,
    retry_policy={"RateLimitErrorRetries": 3, "TimeoutErrorRetries": 1, "ContentPolicyViolationErrorRetries": 0},
    model_group_retry_policy={"gpt-4o": {"RateLimitErrorRetries": 5}},
)
```

原則中針對該失敗種類的計數會勝過 `num_retries`，除非請求本身以 `num_retries=0` 關閉了重試。

## 備援 {#fallbacks}

當重試迴圈放棄時，router 會選擇接下來要去哪裡。

![重試用盡後 router 要去哪裡：在 disable_fallbacks 或防護欄時拋出，否則是群組內的下一個順序、加權容錯移轉，
然後依失敗種類是上下文視窗、內容原則或一般備援](../img/reliability-3.svg)

每個備援清單都是一個由單鍵 dict 組成的清單，每個 dict 將一個模型群組對應到一個要依序嘗試的模型群組
清單，例如 `fallbacks=[{"gpt-4o": ["claude-sonnet", "gpt-4o-mini"]}]`。目標也可以是一個 dict，
例如 `{"model": "gpt-4o-mini", "temperature": 0}`，它的其他鍵會覆寫該跳的請求參數。
`default_fallbacks=["gpt-4o-mini"]` 會成為萬用項目 `{"*": ["gpt-4o-mini"]}`。router 會先查詢正在
服務的群組，然後查詢請求所要求的群組，因此備援目標自己的備援會在下一跳套用。這些清單來自 router 的
引數，或者當 router 沒有設定任何清單時，來自動態快照中的處理程序設定。請求也可以攜帶自己的
`fallbacks`，它對該請求優先。

備援遍歷會依序處理每個目標。在另一個模型群組中的目標之前，它會執行 `fallback_access_check`（這個
呼叫者是否可以使用該群組）與 `fallback_budget_check`，它們使用 proxy 的金鑰與團隊資料。它會略過這個
請求已經嘗試過的目標，然後對該目標再次執行整個重試迴圈，而該目標可以再進一步備援。深度計數器會在
`max_fallbacks`（預設 5，或 `ROUTER_MAX_FALLBACKS` 環境變數）處停止遍歷。每一跳都會以一個
`Fallback` 路由事件回報，帶有它的來源、目標、順序、深度與層級。

![依序進行的一次備援：模型 A 在三次嘗試後以 503 失敗，備援檢查允許群組 B，B 以 200 回答](../img/reliability-4.svg)

在 `fallbacks=[{"A": ["B"]}]`、`context_window_fallbacks=[{"A": ["A-long"]}]` 與
`num_retries=2` 之下，來自 A 的 503 會在 A 內重試兩次，然後請求去 B，並在 B 內有它自己的兩次重試。
來自 A 的上下文視窗錯誤完全不會被重試，因為存在上下文視窗備援。請求會直接去 A-long。

### 順序備援 {#order-fallbacks}

當一個模型群組的部署使用多個 `order` 時，失敗會先在同一個群組內沿著順序往下走，然後才離開群組。在
`order: 1` 的 PTU 部署與 `order: 2` 的隨用隨付部署之下，PTU 層級上的 429 會將請求送到同一個群組
中的隨用隨付，然後才送到該群組已設定的備援。每個順序層級都有它自己的重試迴圈。上下文視窗或內容原則
錯誤會略過順序遍歷，因為同一個模型的較低優先順序部署會以相同方式失敗。

### 加權容錯移轉 {#weighted-failover}

在 `enable_weighted_failover` 與 `simple-shuffle` 之下，失敗的部署會被排除，router 會在任何已設定
的備援執行之前，先在該群組其餘未冷卻的部署中重新挑選。這會將失敗部署的流量依其權重分散到它健康的
同儕上，而不是將它送到另一個群組。上下文視窗與內容原則錯誤基於上述相同的原因，會略過加權容錯移轉。

## 串流 {#streams}

串流的嘗試在提供者開啟串流的那一刻就成功了，但它在呼叫者讀取時仍可能失敗。router 會包裝它回傳的每一個
串流。當串流在呼叫者收到任何內容之前中斷時，router 會以同一個群組內的重試或下一個備援接手，就好像該次
嘗試一開始就失敗了一樣。一旦內容已到達呼叫者，重試會重複輸出，因此串流會失敗，除非設定了
`enable_mid_stream_fallback_continuation`。在該設定之下，在純助理文字之後中斷的聊天完成串流，會在
支援助理預填的備援部署上接續：router 將目前為止的文字作為預填送出，因此新的部署會接著繼續而不是從頭
開始，而呼叫者看到一個回應。已經發出工具呼叫、思考區塊、音訊或圖片，或受限輸出（例如 JSON 模式）的
串流，永遠不會被接續。沒有符合資格的部署時，會拋出原始錯誤。

![串流中斷時會發生什麼：在任何內容之前，router 會重試或備援；在文字之後且開啟接續時，它會以預填在備援
部署上接續；否則它會向呼叫者拋出](../img/reliability-5.svg)

## 冷卻 {#cooldowns}

冷卻是路由快取中的一個鍵 `deployment:{id}:cooldown`，其 TTL 等於冷卻時間。當該鍵存在時，冷卻篩選器
會在共用該 Redis 的每一個處理程序上，將該部署從每一次挑選中移除。當 TTL 到期時，該部署就單純地再次
符合資格。沒有探測請求，也不會在成功時提早重設。

失敗處理常式決定一次失敗是否讓部署冷卻。它會執行兩項檢查：先針對失敗本身，然後針對部署最近的歷史。
查詢回應 id、影片或背景輪詢所得到的 404，永遠不會計入部署，因為它對部署的健康狀態什麼都沒說。

![部署上的一次失敗如何導致冷卻：略過與計數檢查，然後是 allowed_fails 計數器或最近 60 秒的錯誤率規則](../img/reliability-6.svg)

冷卻時間來自第一個有設定的來源：部署自己的 `cooldown_time`，然後是提供者的 `Retry-After`，然後是
router 的 `cooldown_time`，其預設值為 5 秒。當部署被冷卻時，冷卻警示與指標會從 `CooldownSet`
路由事件觸發。

### Allowed fails {#allowed-fails}

`allowed_fails` 讓部署在冷卻之前先失敗幾次。每個被計入的失敗都會遞增
`deployment:{id}:allowed_fails`，它會隨冷卻時間到期，而部署會在計數超過限制時冷卻。
`allowed_fails_policy` 依失敗種類設定限制，例如容忍幾次逾時，但在第一次驗證錯誤時就冷卻。

```python
Router(
    model_list=...,
    allowed_fails_policy={"TimeoutErrorAllowedFails": 5, "AuthenticationErrorAllowedFails": 0, "RateLimitErrorAllowedFails": 2},
)
```

部署可以在 `model_info` 中設定自己的 `allowed_fails` 或 `allowed_fails_policy`，該設定會勝過
router 的。全 router 的 `allowed_fails` 只有在它被明確設定或變更自預設值時才參與，因此從未提及它的
router 會使用下方的錯誤率規則。

有兩個細節很容易被忽略。第一，錯誤率規則的成功與失敗計數只保存在記憶體中，依每個處理程序，TTL 為
60 秒，因此在機群上，每個 worker 都依它自己看到的流量判斷一個部署。`allowed_fails` 計數器與冷卻鍵
在設定 Redis 時住在 Redis 中，因此它們適用於整個機群。第二，孤單的部署預設會受到保護，不受錯誤率
規則影響，因為讓群組唯一的部署冷卻，會使該群組的每個請求都失敗。

當每個候選都被冷卻時，挑選會拋出 `RouterRateLimitError`，並帶有距離最快結束的冷卻還剩的時間，
而備援遍歷會像處理任何速率限制一樣處理它。`enable_health_check_routing` 搭配 allowed fails 原則
會改變這一點：當每個候選都被冷卻時，router 會無論如何挑選其中一個，而不是拋出。
