import Image from '@theme/IdealImage';

# Azure PTU 固定成本歸屬 {#azure-ptu-flat-cost-attribution}

Azure 預置輸送量是依保留容量按小時計費，不是依每個 token 計費。擁有自己 PTU 部署的團隊，無論只送出一個請求還是送出一百萬個請求，都會支付該小時費率，因此 LiteLLM 的按 token 成本追蹤不會顯示與帳單相符的內容。PTU 固定成本歸屬可修正這個不一致：您告訴 LiteLLM 一個部署保留了多少容量以及每小時成本是多少，之後每日工作就會將該成本歸屬給擁有的團隊。

PTU 部署只會依其保留容量本身計費。LiteLLM 不會為它儲存任何按 token 定價，因此該容量處理的流量不會在固定成本之外再額外收費。

## 啟用它 {#enable-it}

此功能預設為關閉，除非您明確啟用，否則不會生效：

```bash
export LITELLM_ENABLE_PTU_COST_ATTRIBUTION=True
```

未設定此變數時，不會排程每日工作，模型端點會拒絕 PTU 設定，使用量讀取路徑會回報零固定成本，而且 PTU 輸入欄位會在模型表單中保持隱藏。

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
| `team_id` | 是 | 容量所屬的團隊。一個部署對應一個團隊 |
| `ptu_count` | 是 | 保留的預置輸送量單位數 |
| `cost_per_ptu_per_hour` | 是 | 您合約中每單位的每小時費率 |
| `ptu_effective_from` | 是 | 保留開始累積費用的時間 |
| `ptu_effective_to` | 否 | 停止的時間。若為開放式保留，請保持未設定 |

`ptu_count` 與 `cost_per_ptu_per_hour` 必須同時設定，且 `ptu_effective_from` 是必要的，因為固定成本從那一刻開始累積。若沒有它，今天設定的部署會為它尚未存在的那些天數計費。

請從您的 Azure 合約而非標價表取得 `cost_per_ptu_per_hour`；PTU 費率是協商而定，且會因區域與承諾期間而異。

## 成本如何計算 {#how-the-cost-is-calculated}

工作會在 UTC 00:15 執行，並為前一天寫入每個團隊與模型的一列：

```
flat cost = ptu_count x cost_per_ptu_per_hour x hours active that day
```

有效時數是該日與保留視窗的重疊，因此一個從中午開始的保留在第一天會累積 12 小時，之後每天累積 24 小時。這些資料列會寫入 `LiteLLM_DailyTeamSpend`，鍵值為保留的 `__ptu_flat_cost__`，以將固定成本與針對實際 API 金鑰記錄的每次請求支出分開。

若保留在工作第一次看到它之前就已開始，也會一併補算：補算程序會將每個已過去的日子重新計價回 `ptu_effective_from`，最多 91 天。因此，一個今天設定且起始時間回填的部署，會在第一次執行時累積其整個視窗的費用

固定成本不計入團隊或金鑰的預算。保留容量本來就已支付，因此團隊不會因使用其所保留的容量而耗盡預算。

## 溢出請求 {#spillover-requests}

當 PTU 部署已滿時，Azure 可以將超出的流量送到您設定為溢出目標的按用量付費部署，並依 token 對這些請求計費。LiteLLM 也採用相同方式：帶有 `x-ms-is-spilled-over: true` 的回應會依所提供模型的標準費率計價，而 PTU 處理的請求則維持零成本。無論哪種情況，每小時固定成本都不變

溢出的請求會在支出記錄中以中繼資料標記，因此您可以在 Logs 頁面上將它們區分開來：

```json
"azure_spillover": {"from_deployment": "<your-deployment-name>"}
```

這需要設定 `LITELLM_ENABLE_PTU_COST_ATTRIBUTION`，以及所提供模型的定價對應項（如果部署名稱不相符，請設定 `base_model`）。若少了其中任一項，溢出的請求仍會以零成本記錄

## 讀回成本 {#read-the-cost-back}

`/team/daily/activity` 會回報每日 `flat_cost` 與區間 `total_flat_cost`，並附上一般的按 token `spend`：

```bash
curl -s "http://localhost:4000/team/daily/activity?team_ids=<team-id>&start_date=2026-01-01&end_date=2026-01-31" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" | jq '{
    total_spend: .metadata.total_spend,
    total_flat_cost: .metadata.total_flat_cost
  }'
```

Admin UI 中的 Usage 頁面會在 Team Usage 下顯示相同數字，將固定成本與請求成本分開繪圖，而且 CSV 匯出也會包含它們：

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
