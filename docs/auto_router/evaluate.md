---
title: 評估您的流量
sidebar_label: 評估您的流量
description: 在切換前，以 shadow 評估在實際流量上判斷路由器相對於您目前模型的表現，然後在使用量分頁與每次請求中查看它節省了多少。
---

import NavigationCards from '@site/src/components/NavigationCards';

公開基準測試衡量的是他人的提示。這裡有兩個功能衡量您的提示：在切換前進行的 **shadow 評估**，以及切換後的 **節省帳務**。

## Shadow 評估 {#shadow-evaluations}

![Shadow 評估結果卡片](../../blog/autorouter_shadow_evaluations/results_card.png)

- **取樣** 單一金鑰、團隊或使用者的部分即時流量。
- **透過路由器複製** 每個取樣的請求。shadow 回應永遠不會送達用戶端。
- **以盲測方式判定**：由 LLM 比較路由器的答案與目前模型提供的答案。
- **執行** 最長 30 天（預設 7 天），或直到每個目標自己的 shadow 與判定支出達到 `max_budget`（預設 $10，最高 $10,000）。`max_turns` 已不再接受。
- **在同一個作業中比較** 多個路由器設定，且使用相同的取樣流量，因此階層對應表與分類器選擇會在任何變更之前定案。
- 在我們自己的流量上：**88.1%** 與目前模型相符或更好，143 個判定回合，$1.55 的判定支出。

<NavigationCards
columns={2}
items={[
  {
    title: "Shadow 評估：在您自己的正式流量上測試 Auto-Router",
    description: "設定作業、回合與持續時間的預設值、選擇判定器、閱讀結果卡片。",
    to: "/blog/auto-router-shadow-evaluations",
  },
  {
    title: "依內容大小與模態進行路由",
    description: "多設定 shadow 作業，以及金鑰、團隊和使用者目標。",
    to: "/blog/auto-router-more-routing-configurations",
  },
]}
/>

## 選擇性評分標準等級 {#optional-rubric-grades}

偏好表示哪一個回應較好，即使兩個回應都很差。評分標準作業還會依您的標準，以固定的 1 到 5 分制為每個回應評分。舉例來說，勝者評為 2 分、敗者評為 1 分，仍表示兩個回應都很差。等級為 `(5, 5)` 的平手表示兩個回應都符合標準。等級是判定器給出的估計值，並不保證正確。

:::note 可用性

這些端點需要包含 [評分標準評分支援](https://github.com/BerriAI/litellm/pull/52321) 的 proxy 建置版本。請先確認您部署的建置版本包含此變更，再使用這些範例。此功能預設為停用。

:::

### 啟用評分標準作業 {#enable-rubric-jobs}

在設定 `LITELLM_SHADOW_EVAL_RUBRIC_ENABLED=true` 之前，請先升級所有共用資料庫的 API 與取樣 worker。請透過您的部署環境將此設定套用到每個 worker，然後重新啟動或重新部署這些 worker。

```bash
export LITELLM_SHADOW_EVAL_RUBRIC_ENABLED=true
```

一般的 proxy 結構描述遷移會為作業的評分標準與評分標準版本，以及每個受評估配對的實際與 shadow 等級，新增可為空的欄位。它不會重寫現有資料列，也不會為先前的嘗試加上等級。現有的僅偏好作業及其結果承載保持不變。僅執行遷移並不會啟用評分標準評分。

:::warning 先升級每個 worker

舊版 worker 會忽略此功能旗標，並將評分標準作業視為僅偏好作業。它們可以記錄沒有等級的成功判定。在仍有舊版 worker 共用資料庫時，請勿啟用評分標準作業。

:::

### 開始評分標準作業 {#start-a-rubric-job}

請使用 proxy 管理員憑證建立作業。請求接受與 `POST /auto_router/shadow_eval/start` 相同的目標、路由器、取樣百分比、持續時間與預算設定，外加一個必填的 `rubric`。請提供至多 4,000 個字元的非空白純文字。每個作業會儲存自己的評分標準，且該作業的評分標準在作業期間保持固定。

此範例以現有團隊與已設定的 auto-router 為目標。請將 `LITELLM_ADMIN_KEY` 設為您的管理員憑證，`TEAM_ID` 設為該團隊的 ID，`ROUTER_NAME` 設為 auto-router 的模型名稱。它使用 `curl` 與 `jq`。

```bash
export PROXY_BASE_URL=http://localhost:4000

JOB_ID=$(
  jq -n \
    --arg team_id "$TEAM_ID" \
    --arg router_name "$ROUTER_NAME" \
    '{team_ids: [$team_id], router_name: $router_name,
      shadow_percentage: 10, max_budget: 1, duration_days: 1,
      rubric: "Answer the question correctly and directly in at most three sentences."}' |
  curl --fail-with-body --silent --show-error \
    "$PROXY_BASE_URL/auto_router/shadow_eval/rubric/start" \
    -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
    -H 'Content-Type: application/json' \
    --data-binary @- |
  jq -er '.job_id'
)
```

成功的請求會回傳 HTTP 201，並附上作業 ID、評分標準與評分契約版本。功能旗標關閉時，建立會回傳 HTTP 400；評分標準為空白或過大時，回傳 HTTP 422。沒有評分標準路由的舊版 proxy 會回傳 HTTP 404。將 `rubric` 欄位傳送至原本的開始路由，並不會建立評分標準作業。

請繼續使用團隊現有的憑證傳送一般請求。預設的正向會取樣未使用受評估路由器的請求，並透過該路由器複製它們。呼叫方仍只會收到實際回應。除非您設定 `judge_model`，否則評分標準作業會使用現有的預設判定器。

### 讀取並解讀等級 {#read-and-interpret-grades}

```bash
curl --fail-with-body --silent --show-error \
  "$PROXY_BASE_URL/auto_router/shadow_eval/$JOB_ID/rubric_results" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY"
```

等級端點允許 proxy 管理員與管理員檢視者使用。它會回傳整體與每個路由器分支的聯合等級分布。此示範回應包含三個已評分的比較，其中一個是兩個回應都未通過評分標準的情況。

```json
{
  "job_id": "example-job-id",
  "rubric": "Answer the question correctly and directly in at most three sentences.",
  "rubric_version": 1,
  "overall": {
    "group": "all",
    "graded_count": 3,
    "ungraded_count": 0,
    "grade_distribution": [
      {"real_grade": 1, "shadow_grade": 1, "turn_count": 1},
      {"real_grade": 5, "shadow_grade": 5, "turn_count": 2}
    ]
  },
  "by_router": [
    {
      "group": "your-auto-router",
      "graded_count": 3,
      "ungraded_count": 0,
      "grade_distribution": [
        {"real_grade": 1, "shadow_grade": 1, "turn_count": 1},
        {"real_grade": 5, "shadow_grade": 5, "turn_count": 2}
      ]
    }
  ]
}
```

| 等級 | 對照作業評分標準的意義 |
| --- | --- |
| 1 | 未符合標準 |
| 2 | 符合少數標準 |
| 3 | 符合約一半標準 |
| 4 | 符合多數標準 |
| 5 | 完全符合標準 |

`real_grade` 始終描述呼叫方收到的回應。`shadow_grade` 描述複製的回應，包含反向作業。判定器看到的是隨機化的 A/B 標籤，這些標籤會在等級儲存前對應回來。等級相同時，仍可能有偏好的回應。

`graded_count` 計算同時有兩個等級的比較。`ungraded_count` 計算沒有兩個等級的成功偏好判定，例如由舊版 worker 寫入的結果。這些資料列會排除在 `grade_distribution` 之外，絕不會被視為零分或低分。對於有多個路由器的作業，整體計數包含每個請求與每個路由器分支的一次比較。請使用 `by_router` 比較各分支。

請透過現有的 `GET /auto_router/shadow_eval/{job_id}` 端點讀取偏好、信心摘要與評估錯誤。無效或缺失的等級會使整個評分標準判定無效，並產生一筆已記錄的評估錯誤，而不是成功的僅偏好判定。等級必須是 1 到 5 的 JSON 整數。字串、布林值、浮點數與超出範圍的值都會被拒絕。錯誤的嘗試會排除在等級分布之外。等級端點對僅偏好作業會回傳 HTTP 404。

### 回退前先停止作業 {#stop-jobs-before-rollback}

在啟動任何不支援評分標準的 worker 之前，請先在所有已升級的 worker 上停用此功能，停止每個執行中的評分標準作業，並完成或排空其進行中的評估。套用此旗標需要重新啟動或重新部署。您可以使用管理員憑證，透過現有端點停止每個作業。

```bash
curl --fail-with-body --silent --show-error -X POST \
  "$PROXY_BASE_URL/auto_router/shadow_eval/$JOB_ID/stop" \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY"
```

請先排空或停止已升級的 worker，再啟動舊版 worker。僅等待約 10 秒的作業快取到期，並不能保證進行中的評估已經完成。單靠功能旗標無法保護回退，因為舊版 worker 會忽略它。評分標準作業無法在降級至不支援評分標準的版本時不中斷地繼續執行。

## 在您自己的提示上評估 JEV {#evaluate-jev-on-your-own-prompts}

先從 [Test Routing](/docs/auto_router/setup#jev-classifier-typesafe-ai) 開始檢查階層選擇，然後使用 shadow 評估來比較實際回應。與您的階層標籤相符的分類器，並不能證明所選模型的回應表現良好。請先固定您的評分標準與標籤，再將 JEV 與另一個分類器比較，並將分歧與正確性分開報告

[JEV 基準](/blog/jev-auto-router-benchmark) 量測的是在人工建立的合成案例上的分類器延遲與依註冊表定價的分類器成本。若要評估某個部署，請納入分類器支出、下游 completions、已啟用時的 embeddings，以及 shadow/judge 請求。請記錄備援率與 p95 延遲，以及成功請求的平均值

JEV 會記錄一個透過父請求 metadata 歸因的獨立 `typesafe/<model>` 分類器呼叫。其 `classifier_cost` 也會在成功的 JEV 路由決策中一併帶入，並在回報的路由器節省中扣除。該 metadata 已描述了已另外記錄的分類器費用：在加總支出列時，請勿再次計入。若缺少使用量或缺少註冊表項目，分類器成本便無法得知，而取消也不能證明提供者未收費

## 切換後的節省 {#savings-after-you-switch}

![Cost Optimization 中的 Auto-Router 使用量分頁](../../blog/autorouter_spend_visibility/auto-router-usage-tab.png)

- **每次請求：** 路由器選了什麼、原因是什麼，以及同一請求若使用在最困難已設定階層中的最昂貴模型會花多少。扣除任何分類器呼叫後的差額會標記在請求上。
- **彙總：** 到每日支出表中，因此會依金鑰、團隊、標籤與組織顯示。
- **使用量分頁：** 預估總節省、sessions 與 turns、依回合類型區分的提示快取命中率。30 天視窗、超過 40 萬個 sessions 的讀取時間為 38 ms。
- **分類器成本：** 當有記錄分類器成本時，會在 `x-litellm-classifier-cost` 標頭中回傳每次請求的成本，包括成功的 JEV 分類。
- **誠實基準：** 對持續中的回合，以溫熱快取定價；切換後若有新的快取寫入，會計入節省的反面，因此單一請求可能顯示為負值。公式與所有呈現處：[Reported savings](/docs/proxy/auto_routing#reported-savings)。

<NavigationCards
columns={2}
items={[
  {
    title: "AutoRouter：輕鬆掌握您的節省",
    description: "使用量分頁、每次請求的分類器成本，以及針對您自己的部署的預設比對。",
    to: "/blog/auto-router-spend-visibility",
  },
  {
    title: "決策記錄",
    description: "每個路由決策一行可供 grep 的紀錄：原因、階層、分數、訊號、路由模型。",
    to: "/docs/proxy/auto_routing#decision-log",
  },
]}
/>

## 讀取單一決策 {#reading-a-single-decision}

- 記錄中每個已路由請求都會以 routing-decision 卡片開頭：階層、原因（包含 `jev_classifier`），以及提供服務的模型
- Add Model 表單中的 Test Routing 會顯示相同卡片，因此某個出乎意料的正式環境決策，可以用相同提示在表單中重現。
