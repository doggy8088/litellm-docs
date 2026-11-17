import Image from '@theme/IdealImage';

# Azure PTU 固定成本歸屬 {#azure-ptu-flat-cost-attribution}

Azure 預置輸送量是依保留容量按小時計費，不是依每個 token 計費。擁有自己 PTU 部署的團隊，無論只送出一個請求還是送出一百萬個請求，都會支付該小時費率，因此 LiteLLM 的按 token 成本追蹤不會顯示與帳單相符的內容。PTU 固定成本歸屬可修正這個不一致：您告訴 LiteLLM 一個部署保留了多少容量以及每小時成本是多少，之後每日工作就會將該成本歸屬給擁有的團隊。

PTU 部署只會依其保留容量本身計費。LiteLLM 不會為它儲存任何按 token 定價，因此該容量處理的流量不會在固定成本之外再額外收費。

一個部署也可以依 PTU 拆分給多個團隊。每個團隊的份額會成為 proxy 強制執行的每分鐘上限，固定成本會依份額歸屬，而使用量會在其 token 旁回報每個團隊消耗的 PTU-hours。請參閱 [在團隊之間共享部署](#share-a-deployment-across-teams)

## 啟用它 {#enable-it}

此功能預設為關閉，除非您明確啟用，否則不會生效：

```bash
export LITELLM_ENABLE_PTU_COST_ATTRIBUTION=True
```

未設定此變數時，不會排程每日工作，模型端點會拒絕 PTU 設定，使用量讀取路徑會回報零固定成本，而且 PTU 輸入欄位會在模型表單中保持隱藏。

已設定的 secret manager 也可以保存該變數。當 proxy 會向 secret manager 要求它時（如同它對其他設定所做的一樣），secret manager 的值會優先於環境，且每分鐘最多讀取一次。只有在未諮詢任何 secret manager 時，才由環境決定。

## 設定部署 {#configure-a-deployment}

PTU 設定位於該部署的 `model_info` 上。在 Admin UI 中，開啟 Models + Endpoints，選取該部署，然後編輯其設定。PTU 輸入欄位位於按 token 成本的正下方，而 LiteLLM 會為您將其維持為零：

<Image img={require('../../img/ptu_configure_model.png')} />

透過 `POST /model/new` 也可同樣設定：

```bash
curl -X POST http://localhost:4000/model/new \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model_name": "gpt-4o-ptu",
    "litellm_params": {
      "model": "azure/<your-deployment-name>",
      "api_key": "os.environ/AZURE_API_KEY",
      "api_base": "os.environ/AZURE_API_BASE"
    },
    "model_info": {
      "team_id": "<the owning team id>",
      "ptu_count": 100,
      "cost_per_ptu_per_hour": 0.02,
      "ptu_effective_from": "2026-01-01T00:00:00Z"
    }
  }'
```

或在 `config.yaml` 中：

```yaml
model_list:
  - model_name: gpt-4o-ptu
    litellm_params:
      model: azure/<your-deployment-name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      id: gpt-4o-ptu-team-a
      team_id: <the owning team id>
      ptu_count: 100
      cost_per_ptu_per_hour: 0.02
      ptu_effective_from: "2026-01-01T00:00:00Z"
```

`model_info.id` 是這種方式宣告的部署所必需的，且 proxy 若缺少它就會拒絕載入，並在啟動記錄中指出該部署。若不特別指定，其 id 會由模型名稱與解析後的 `litellm_params` 推導而來，因此輪替憑證會產生新的身分，並且保留容量會以該身分再次收費，而之後不會有任何內容將其撤銷。任何穩定字串都可使用，且必須在您的部署之間唯一

若要升級一個已經累積成本的既有保留，請將 `id` 設為它目前使用的 id，而不是新的名稱，否則已寫入的費用會保留在舊身分下，而新的身分會從旁開始。啟動拒絕訊息會引用那個目前的 id，因此您可以直接複製它

`team_id` 是這些容量的計費對象，因此沒有它的宣告不會累積任何費用

| 欄位 | 必填 | 意義 |
| --- | --- | --- |
| `id` | 在 `config.yaml` 中 | 該部署的穩定身分。透過 API 或 UI 不需要，因為系統會為您儲存一個 |
| `team_id` | 兩者擇一 | 容量所屬的團隊，當一個團隊擁有整個部署時 |
| `ptu_shares` | 兩者擇一 | 團隊 id 對應整數 PTU，總和為 `ptu_count`，當多個團隊共享它時 |
| `ptu_count` | 是 | 保留的預置輸送量單位數，必須是整數 |
| `cost_per_ptu_per_hour` | 是 | 您合約中每單位的每小時費率 |
| `ptu_effective_from` | 是 | 保留開始累積費用的時間 |
| `ptu_effective_to` | 否 | 停止的時間。若為開放式保留，請保持未設定 |
| `base_model` | 上限需要 | 當部署名稱不是 Azure 模型名稱時的 Azure 模型名稱，例如 `gpt-4.1` |

`ptu_count` 與 `cost_per_ptu_per_hour` 必須同時設定，且 `ptu_effective_from` 是必要的，因為固定成本從那一刻開始累積。若沒有它，今天設定的部署會為它尚未存在的那些天數計費。

請從您的 Azure 合約而非標價表取得 `cost_per_ptu_per_hour`；PTU 費率是協商而定，且會因區域與承諾期間而異。

## 在團隊之間共享部署 {#share-a-deployment-across-teams}

一個保留 50 個 PTU 並讓兩個團隊使用的部門，只需以 PTU 為單位宣告一次拆分，在 `model_info.ptu_shares` 中取代 `team_id`：

```bash
curl -X POST http://localhost:4000/model/new \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model_name": "gpt-4.1-ptu",
    "litellm_params": {
      "model": "azure/<your-deployment-name>",
      "api_key": "os.environ/AZURE_API_KEY",
      "api_base": "os.environ/AZURE_API_BASE"
    },
    "model_info": {
      "base_model": "gpt-4.1",
      "ptu_count": 50,
      "cost_per_ptu_per_hour": 1.0,
      "ptu_effective_from": "2026-01-01T00:00:00Z",
      "ptu_shares": {"<team a id>": 30, "<team b id>": 20}
    }
  }'
```

或在 `config.yaml` 中：

```yaml
model_list:
  - model_name: gpt-4.1-ptu
    litellm_params:
      model: azure/<your-deployment-name>
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      id: gpt-4.1-ptu-shared
      base_model: gpt-4.1
      ptu_count: 50
      cost_per_ptu_per_hour: 1.0
      ptu_effective_from: "2026-01-01T00:00:00Z"
      ptu_shares:
        <team a id>: 30
        <team b id>: 20
```

`ptu_shares` 與 `team_id` 不能同時設定，且份額總和必須正好等於 `ptu_count`，以整數 PTU 計算。留下未歸屬容量，或發出超過保留量的拆分，會被 `POST /model/new` 以 400 拒絕，並說明已分配了多少 PTU；沒有 `ptu_count` 與 `cost_per_ptu_per_hour` 的拆分也會被拒絕，因為它沒有可加總的對象，也沒有可彙總的固定成本。在 `config.yaml` 中，同一個條目會在 proxy 載入其模型時被捨棄，無論 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION` 是否設定：啟動記錄會指出部署與原因，proxy 會在沒有它的情況下啟動，而對該模型名稱的請求會得到 400，且沒有健康的部署。透過 API 時，拆分中的每個團隊都必須已經存在：`POST /model/new` 與 `PATCH /model/{model_id}/update` 會以 400 拒絕指名未知團隊的拆分並指出該團隊，如同它們拒絕未知的 `team_id` 一樣

已經透過 `team_id` 由一個團隊擁有的部署，不會被 `PATCH` 切換為 `ptu_shares`：`team_id` 資料列是團隊範圍的，具有內部路由名稱與該團隊模型清單中的一個條目，而共享資料列則是 proxy 全域的，因此該 patch 會以相同的 400 被拒絕。若要拆分它，請刪除該部署，並以 `ptu_shares` 與相同的 `model_info.id` 重新註冊，這樣可保留已以該 id 寫入的固定成本資料列

共享部署會保留其公開模型名稱，並持續出現在模型清單中，但 proxy 只會將它提供給 `ptu_shares` 中指名的團隊。來自任何其他團隊的金鑰、沒有團隊的金鑰，以及 master key，在它上面都會得到 400，無論 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION` 是否設定，因為已宣告的拆分是一條存取規則；上限、成本拆分與下方的 PTU-hours 則需要該旗標：

```
Deployment gpt-4.1-ptu is reserved for the teams holding a PTU share of it
```

持有份額的團隊只會由它持有份額的部署提供服務。同一個模型名稱下的開放部署會服務未持有任何份額的團隊，因此團隊的上限與其 PTU-hours 只計算其保留所服務的流量。若要將團隊超出其份額的溢出流量送到按用量付費容量，請使用 Azure 的溢出目標，如 [溢出請求](#spillover-requests) 所述，而不是在共享部署旁放一個開放部署。

在持有份額期間，指名於 `ptu_shares` 的團隊不能被刪除。`POST /team/delete`、刪除擁有此類團隊之組織的 `DELETE /organization/delete`，以及 SCIM 的 `DELETE /scim/v2/Groups/{id}`，在份額移轉到另一個團隊之前，都會以 400 回應並指出該部署，因為被刪除的團隊會持續為沒人能使用的 PTU 被計費。組織刪除會在移除任何東西之前先檢查，因此被拒絕的呼叫會讓每個團隊都保持原狀。

### 每個份額都是一個每分鐘上限 {#each-share-is-a-per-minute-ceiling}

Azure 以正規化 token／分鐘來衡量預置部署的大小：未快取的輸入 token 全額計算，快取輸入依模型的快取比率計算（GPT-6 家族為十分之一，其餘為零），輸出 token 則依模型的輸出對輸入比率加權，再除以該模型每 PTU 的輸入 TPM。LiteLLM 隨附該表，讀自 [Azure 的預置輸送量大小規劃頁面](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/provisioned-throughput-sizing#deployment-parameters-and-throughput-values-by-model)，並將每個份額轉換為相同單位的每分鐘上限：

```
team ceiling per minute = share x input TPM per PTU for the model
tokens charged per request = uncached input + cached input x cached ratio + output x output ratio
```

團隊 A 的 30 個 gpt-4.1 PTU（每 PTU 3,000 輸入 TPM，輸出以 4 倍計算）是每分鐘 90,000 個正規化 token。每個請求在呼叫前會以這些單位保留其輸入加上其輸出預算（`max_tokens`，若未設定則為 proxy 的輸出下限，其大小設定為永遠不超過份額的四分之一），並在回應回報使用量時結算，因此一波並行請求合起來也無法超過份額。第一個超過它的請求會得到帶有 `retry-after` 標頭的 429，而團隊 B 的 20 個 PTU 不受影響：

```
Rate limit exceeded for model_per_team_ptu: <team a id>:gpt-4.1-ptu. Limit type: tokens. Current limit: 90000, Remaining: 0. Limit resets at: ...
```

一個永遠放不進去的請求，例如其 `max_tokens` 本身就超過份額在一分鐘內允許的量，會改得到 400，因為再空的一分鐘也容不下它，而 `retry-after` 只會讓用戶端重試它。大的輸出預算需要大的份額：gpt-5.4 與 gpt-5.4-mini 的輸出以 6 倍計算，因此光是 `max_tokens: 32000` 就是 192,000 個正規化 token，需要超過 80 個 gpt-5.4 PTU 的份額，或 24 個 gpt-5.4-mini PTU。

當份額較小時，沒有 `max_tokens` 的請求會被寫入一個。當以輸出 token 計算的份額（上限除以輸出比率）低於 4,096 時，proxy 會將 `max_tokens` 送為 1,024 或其四分之一，取較小者，這與它在任何那麼小的 `tpm_limit` 下寫入的上限相同，而較長的回覆會以 `finish_reason: length` 停止。3 個 gpt-5.4-mini PTU 將未設上限的回覆限制在 987 個輸出 token，1 個 gpt-5.4 PTU 則是 100。送出自己的 `max_tokens` 的用戶端永遠不會被改寫，因此在小份額上需要長回覆的團隊會自行設定它。

此上限與團隊的 `model_tpm_limit` 位於相同的每分鐘視窗，因此它的讀取與重設方式與您已設定的限制相同，而且它除了 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION` 之外不需要任何東西。大小規劃資料列會先以 `model_info.base_model` 查找，再以 `litellm_params` 中的模型查找，因為 Azure 部署名稱是任意的。共享部署，或為單一團隊保留的 Azure 部署，若其模型沒有對應的資料列，會在啟動時記錄警告、不設定上限，也不回報 PTU-hours；請將 `base_model` 設為 Azure 模型名稱以修正它。在另一個提供者上為單一團隊保留的部署只會餵入固定成本彙總，該彙總不需要大小規劃，因此不會被警告

請求無論以何種方式指名共享部署，都會計入其團隊的上限：模型群組、`model_group_alias`、路由群組、部署的 `model_info.id`、其提供者模型，或 router 用來提供它的萬用字元模式，例如 `ptu-*`。萬用字元名稱只會計入 router 提供它的那個模式，也就是與它最符合的最具體模式，因此由開放的 `*` 路由提供的請求永遠不會扣抵份額，而未持有份額的團隊，在共享模式符合的名稱上會得到 400，即使 `*` 也符合它也一樣。

此上限會在 proxy 路由請求之前，針對請求指名的模型檢查。備援跳轉進入共享群組不會被它檢查，透過 `/azure` pass-through 路由的呼叫也不會，該路由不執行任何速率限制檢查，其 token 也不計入上限。橫跨多個模型群組中共享部署的路由群組，會將其所有流量計入其中一個群組，也就是模型清單中的第一個，因此請讓每個路由群組只包含一個共享模型群組。

透過 `team_id` 由一個團隊擁有的部署不會得到上限，因為該團隊已經擁有它的全部，但其使用量確實會回報 PTU-hours

## 成本如何計算 {#how-the-cost-is-calculated}

工作會在 UTC 00:15 執行，並為前一天寫入每個團隊與模型的一列：

```
flat cost = ptu_count x cost_per_ptu_per_hour x hours active that day
```

以 `ptu_shares` 拆分的部署則會改為每個團隊寫入一列，每列以該團隊的份額取代 `ptu_count`：50 個 PTU 中以每 PTU-hour $1 計算的 30 與 20，一整天分別是 $720 與 $480，而該部署的 $1,200 不會落在其他任何人身上。有效時數是該日與保留視窗的重疊，因此一個從中午開始的保留在第一天會累積 12 小時，之後每天累積 24 小時。這些資料列會寫入 `LiteLLM_DailyTeamSpend`，鍵值為保留的 `__ptu_flat_cost__`，以將固定成本與針對實際 API 金鑰記錄的每次請求支出分開。

若保留在工作第一次看到它之前就已開始，也會一併補算：補算程序會將每個已過去的日子重新計價回 `ptu_effective_from`，最多 91 天。因此，一個今天設定且起始時間回填的部署，會在第一次執行時累積其整個視窗的費用。工作已計價的某一天，在份額之後於團隊之間移轉時會保留其資料列，因此接手份額的團隊只會被收取移轉後計價的日子，永遠不會被收取前一位持有者已支付的日子。寫入失敗的那一天，不會為它的任何團隊寫入，而下一次補算程序會為它們全部計價。此工作會依它執行當下的份額拆分某一天，因此在一天當中移轉的份額，會以新的拆分對整天計費。

固定成本不計入團隊或金鑰的預算。保留容量本來就已支付，因此團隊不會因使用其所保留的容量而耗盡預算。

## 溢出請求 {#spillover-requests}

當 PTU 部署已滿時，Azure 可以將超出的流量送到您設定為溢出目標的按用量付費部署，並依 token 對這些請求計費。LiteLLM 也採用相同方式：帶有 `x-ms-is-spilled-over: true` 的回應會依所提供模型的標準費率計價，而 PTU 處理的請求則維持零成本。無論哪種情況，每小時固定成本都不變

溢出的請求會在支出記錄中以中繼資料標記，因此您可以在 Logs 頁面上將它們區分開來：

```json
"azure_spillover": {"from_deployment": "<your-deployment-name>"}
```

這需要設定 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION`，以及所提供模型的定價對應項（如果部署名稱不相符，請設定 `base_model`）。若少了其中任一項，溢出的請求仍會以零成本記錄

## 讀回成本 {#read-the-cost-back}

`/team/daily/activity` 會回報每日 `flat_cost` 與區間 `total_flat_cost`，並附上一般的按 token `spend`，以及在 token 旁的 `ptu_hours`：在每一天、在每個 PTU 模型群組與其下的 API 金鑰上，以及作為區間的 `total_ptu_hours`。PTU-hours 是團隊的 prompt、快取與 completion token 透過該模型的大小規劃資料列換算而來，因此團隊可以將其消耗量與其保留量比較。某一天的 token 只會由 `ptu_effective_from` 到 `ptu_effective_to` 視窗涵蓋該日的保留來計算大小，因此在保留開始前或結束後的使用量不會讀到 PTU-hours。`breakdown.entities` 下每個團隊的資料列會將 `ptu_hours` 保持為 0，因為該列沒有可供計算大小的模型群組，因此請從只指名該團隊的請求讀取單一團隊的 PTU-hours：

```bash
curl -s "http://localhost:4000/team/daily/activity?team_ids=<team-id>&start_date=2026-01-01&end_date=2026-01-31" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" | jq '{
    total_spend: .metadata.total_spend,
    total_flat_cost: .metadata.total_flat_cost,
    total_ptu_hours: .metadata.total_ptu_hours,
    gpt41_ptu_hours: [.results[].breakdown.model_groups["gpt-4.1-ptu"].metrics.ptu_hours]
  }'
```

Admin UI 中的 Usage 頁面會在 Team Usage 下顯示相同數字，將固定成本與請求成本分開繪圖，並為視窗內有消耗的團隊顯示 PTU Hours 區塊，而且 CSV 匯出也會包含它們：

<Image img={require('../../img/ptu_usage_flat_cost.png')} />

## 不得設定的費率 {#rates-you-must-not-set}

LiteLLM 會拒絕 PTU 部署上的按 token、按秒或快取費率，並指出它拒絕的欄位。傳送 `0`、全零表格，或完全不提供值都會被接受：

```
A PTU deployment bills by reserved capacity, so input_cost_per_token cannot be charged on top
of it. Send 0 or no value, or remove ptu_count and cost_per_ptu_per_hour to bill per token.
```

當您新增 PTU 設定時，若部署上已儲存了費率，系統會將其歸零而不是拒絕，因此在功能啟用前已定價的部署會在下次儲存時自動修正。移除 `ptu_count` 與 `cost_per_ptu_per_hour` 會釋放這些歸零設定，而部署會恢復為按 token 計費。

網路搜尋費率的處理方式也相同。請注意，xAI 模型無論如何都會依其清單價格按每次搜尋呼叫計費，因為其定價讀取器會忽略零費率。

## 限制 {#limitations}

舊版 `POST /model/update` 不會執行上述規則，因此透過它設定的 PTU 部署會持續按 token 計費，且永遠不會累積固定成本。請改用 `POST /model/new`、`PATCH /model/{model_id}/update`、Admin UI，或 `config.yaml`

單獨使用的 Python `Router` 會在註冊時將按 token 定價歸零，但 proxy 之外沒有任何機制會排程每日工作，因此那裡不會累積固定成本

PTU-hours 只會在團隊活動上回報。每個金鑰、每個使用者與每個標籤的活動路由，其資料列目前不帶模型群組，因此都不回報

以別名、路由群組、其部署 id 或其提供者模型指名共享部署的請求，會落在以該名稱為鍵的使用量資料列中。在單一團隊的頁面上，該列會以該團隊在該名稱背後被提供服務的部署來計算大小，先是它的共享部署，永遠不會是為另一個團隊保留的部署，因此它的 PTU-hours 與指名模型群組的請求計算方式相同，而在某個名稱上沒有份額的團隊，或在另一個團隊的保留旁由開放部署提供服務的團隊，在該名稱上讀不到 PTU-hours。橫跨多個或所有團隊的頁面，會以該名稱背後第一個被保留的部署來計算該列的大小

與共享部署位於同一個模型群組的未共享部署，會計入團隊在該群組上的上限與 PTU-hours，而混合模型的群組，在單一團隊的頁面上會以該團隊持有份額的部署來計算大小，在橫跨團隊的頁面上則以其第一個被保留部署的資料列計算。請讓共享部署獨自位於一個模型群組中

`ptu_shares` 透過 `POST /model/new`、`PATCH /model/{model_id}/update` 或 `config.yaml` 編輯；Admin UI 中的模型表單尚沒有份額編輯器
