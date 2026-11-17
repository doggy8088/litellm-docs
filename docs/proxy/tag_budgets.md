import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 設定標籤預算 {#setting-tag-budgets}

使用標籤追蹤支出並為您的 API 請求設定預算。標籤可讓您跨不同成本中心、專案與部門分類並監控成本。

## 前置條件 {#pre-requisites}

- 您必須先設定 Postgres 資料庫（例如 Supabase、Neon 等）

## 什麼是標籤？ {#what-are-tags}

標籤是您可以附加到 LLM 請求上的標記，用於依類別追蹤並限制支出。 

**常見使用情境：**
- **成本中心追蹤**：將 LLM 成本分配給特定部門或業務單位（例如「engineering」、「marketing」、「customer-support」）
- **專案式預算管理**：為不同專案或計畫設定預算（例如「project-alpha」、「chatbot-v2」）
- **客戶歸屬**：追蹤每位客戶或用戶端的支出（例如「customer-acme」、「customer-techcorp」）
- **功能監控**：監控特定功能的成本（例如「feature-chat」、「feature-summarization」）

標籤可在每次請求時設定（在 `metadata` 中或透過 `x-litellm-tags`），也可附加到虛擬金鑰，讓每個使用該金鑰的請求自動繼承該標籤及其預算限制，或[從請求的 `baggage` 標頭對應而來](#map-baggage-values-to-tags)。

## 設定標籤預算 {#setting-tag-budgets-1}

### 1. 建立具有預算的標籤 {#1-create-a-tag-with-budget}

建立一個標籤來代表成本中心、專案或任何預算類別。設定 `max_budget`（可使用 $ 金額）與 `budget_duration`（預算重設的頻率）。

**範例：** 為您的工程部門建立一個每月 500 美元預算的標籤

#### API {#api}

建立新標籤並設定 `max_budget` 與 `budget_duration`

```shell
curl -X POST 'http://0.0.0.0:4000/tag/new' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
            "name": "engineering", 
            "description": "Engineering department cost center",
            "max_budget": 500.0, 
            "budget_duration": "30d",
            "rpm_limit": 100,
            "tpm_limit": 100000
        }' 
```

**請求本文參數：**

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `name` | string | 是 | 標籤的唯一名稱（例如，成本中心名稱） |
| `description` | string | 否 | 此標籤追蹤內容的說明 |
| `models` | list[string] | 否 | 將標籤限制為特定模型 |
| `max_budget` | float | 否 | USD 的最大預算 |
| `budget_duration` | string | 否 | 預算重設頻率（例如「30d」、「1d」） |
| `soft_budget` | float | 否 | 用於警示的軟性預算上限 |
| `rpm_limit` | int | 否 | 允許此標籤在所有金鑰與團隊中的每分鐘最大請求數 |
| `tpm_limit` | int | 否 | 允許此標籤在所有金鑰與團隊中的每分鐘最大 token 數 |

**回應：**

```json
{
  "name": "engineering",
  "description": "Engineering department cost center",
  "max_budget": 500.0,
  "budget_duration": "30d",
  "budget_reset_at": "2025-11-10T00:00:00Z",
  "created_at": "2025-10-11T00:00:00Z"
}  
```

#### LiteLLM 管理介面 {#litellm-admin-ui}

前往 **標籤管理** 頁面並點擊 **建立新標籤**。填入標籤詳細資料並設定您的預算：

<Image 
  img={require('../../img/tag_budget1.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br />

**`budget_duration` 的可用值：**

| `budget_duration` | 預算將於何時重設 |
| --- | --- |
| `budget_duration="1s"` | 每 1 秒 |
| `budget_duration="1m"` | 每 1 分鐘 |
| `budget_duration="1h"` | 每 1 小時 |
| `budget_duration="1d"` | 每 1 天 |
| `budget_duration="7d"` | 每 1 週 |
| `budget_duration="30d"` | 每 1 個月 |

### 2. 將標籤附加到 API 金鑰（建議） {#2-attach-the-tag-to-an-api-key-recommended}

在建立或更新虛擬金鑰時附加標籤。每個使用該金鑰發出的請求都會自動繼承該標籤，而且閘道會強制執行該標籤的預算，**無須**用戶端在每個請求中傳遞 `metadata.tags`。

#### API {#api-1}

在 `tags` 或 `/key/generate` 上使用頂層的 `/key/update` 欄位：

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
            "tags": ["engineering"]
        }'
```

您也可以在金鑰 `metadata` 下設定標籤：

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
            "metadata": {
              "tags": ["engineering"]
            }
        }'
```

#### LiteLLM 管理介面 {#litellm-admin-ui-1}

前往 **Virtual Keys** → **Create Key**（或編輯現有金鑰），並在 **Tags** 欄位中選取標籤。

<Image
  img={require('../../img/add_tag_in_key_creation.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

### 3. 在您的請求中使用標籤（選用） {#3-use-the-tag-in-your-requests-optional}

如果您未將標籤附加到 API 金鑰，請在每個請求的 `metadata` 欄位中新增標籤（或透過 `x-litellm-tags` 標頭，請參閱［請求標籤］(request_tags.md)）：

<Tabs>

<TabItem value="openai" label="OpenAI SDK">

```python
import openai

client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",  # Your LiteLLM proxy key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "Hello"}],
    extra_body={
        "metadata": {
            "tags": ["engineering"]
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="cURL">

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "model": "{{openai_large}}",
           "messages": [{"role": "user", "content": "Hello"}],
           "metadata": {
               "tags": ["engineering"]
           }
         }'
```

</TabItem>

</Tabs>

### 4. 進行測試 {#4-test-it}

使用第 2 步的虛擬金鑰發出請求，直到超出標籤預算。若標籤已在金鑰上，您**不需要**傳遞 `metadata.tags`：

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H 'Authorization: Bearer sk-your-key-with-engineering-tag' \
     -H 'Content-Type: application/json' \
     -d '{
           "model": "{{openai_large}}",
           "messages": [{"role": "user", "content": "Hello"}]
         }'
```

如果您略過第 2 步，請改為在請求本文中加入標籤：

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "model": "{{openai_large}}",
           "messages": [{"role": "user", "content": "Hello"}],
           "metadata": {
               "tags": ["engineering"]
           }
         }'
```

**當預算超過時，請求會以 HTTP 422 被拒絕：**

```json
{
  "error": {
    "message": "Budget has been exceeded! Tag=engineering Current cost: 505.50, Max budget: 500.0",
    "type": "budget_exceeded",
    "param": null,
    "code": "422"
  }
}
```

## 將 Baggage 值對應到標籤 {#map-baggage-values-to-tags}

<SinceVersion v="1.109.0" />

請求可以從 W3C `baggage` 標頭取得其標籤，OpenTelemetry 使用該標頭在服務之間傳遞上下文。`general_settings.request_tag_mappings` 中的每條規則會讀取一個 baggage 金鑰，並為請求加上一個標籤，因此已經會送出像 `baggage: service=<value>` 這類值的服務，不必在每次呼叫時都設定 `metadata.tags`，就能擁有自己的標籤。無論該標籤是否有預算，支出都會記在對應出的標籤上，而標籤預算用罄時，會在呼叫提供者之前以 HTTP 422 拒絕請求，與任何其他標籤相同。

```yaml title="config.yaml"
general_settings:
  request_tag_mappings:
    - key: service
      value: support_bot
      tag: support
    - key: service
      tag_prefix: "app:"
      required: true
      require_budgeted_tag: true
```

採用此設定時，`service=support_bot` 會加上標籤 `support`，而任何其他值（例如 `service=checkout`）會加上 `app:checkout`。對於同一個金鑰，精確的 `value` 規則永遠優先於 `tag_prefix` 規則。第二條規則設定了 `require_budgeted_tag`，因此請先依照[步驟 1](#1-create-a-tag-with-budget)建立帶有 `max_budget` 的 `app:checkout`。接著隨請求送出 baggage 標頭：

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -H 'baggage: service=checkout' \
     -d '{
           "model": "{{openai_large}}",
           "messages": [{"role": "user", "content": "Hello"}]
         }'
```

該請求會記在 `app:checkout` 上，且支出記錄會在 `request_tags` 中，將對應出的標籤列在金鑰、團隊、部署與用戶端標籤之後。

**規則欄位：**

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| `key` | 是 | 要讀取的 baggage 金鑰，例如 `service` |
| `value` | 與 `tag` 搭配 | 要比對的精確 baggage 值 |
| `tag` | 與 `value` 搭配 | 當 `value` 符合時加上的標籤 |
| `tag_prefix` | 不搭配 `value` | 符合任何值，並加上 `<tag_prefix><value>` |
| `required` | 否 | 拒絕沒有對應值的請求。預設 `false` |
| `require_budgeted_tag` | 否 | 拒絕沒有 `max_budget` 的對應標籤。預設 `false` |

一條規則可設定 `value` 與 `tag`，或單獨設定 `tag_prefix`。每個金鑰可針對每個精確值各有一條規則，外加一條 `tag_prefix` 規則；若設定重複了其中任一條，proxy 會拒絕該設定。`header` 預設為 `baggage`，這也是它唯一允許的值。未設定 `required` 時，baggage 未對應出任何內容的請求不會取得對應標籤，並照常通過。

### 必要對應 {#required-mappings}

當某個金鑰的任一規則設定了 `required: true` 時，若請求的 baggage 未帶有該金鑰、帶有該金鑰多次，或帶有該金鑰的任何規則都未對應的值，請求會在呼叫提供者之前收到 HTTP 400：

```json
{
  "error": {
    "message": "Missing, invalid or unmapped baggage value for service",
    "type": "bad_request_error",
    "param": null,
    "code": "400"
  }
}
```

這適用於每個受對應的請求，包括檔案上傳與 Admin UI playground，因此這些呼叫者也需要提供 baggage 值。必要規則也會關閉 WebSocket 推論。Realtime、Responses WebSocket、Live 與 pass-through WebSocket 連線對每個金鑰都會收到 HTTP 403，因為這些連線無法將標籤帶入其支出記錄。若兩者都需要，請從未設定必要規則的 proxy 提供 WebSocket 流量。

### 要求對應標籤必須有預算 {#require-a-budget-on-the-mapped-tag}

設定 `require_budgeted_tag: true` 時，對應出的標籤必須已存在且帶有 `max_budget`。否則請求會收到 HTTP 400，訊息為 `Mapped tag app:checkout requires an existing tag budget`，且不會有任何內容送往提供者。當 proxy 無法從資料庫讀取標籤預算時，請求改收到 HTTP 503。開啟 `allow_requests_on_db_unavailable` 時，請求會在未檢查對應標籤的情況下通過，與資料庫中斷期間的其他標籤預算檢查相同。

### 在流量開始後建立的預算 {#budgets-created-after-traffic-starts}

proxy 從第一個帶有對應標籤的請求起就開始計算該標籤的支出，即使該標籤尚不存在。以 `/tag/new` 建立標籤會重置其支出計數器，因此稍後新增的預算只計算預算存在之後寫入的支出，不含先前的支出。建立標籤時仍在 proxy 資料庫寫入批次中等待的支出，可能會進入新預算；而在沒有 Redis 的情況下，只有處理 `/tag/new` 的 worker 會重置其計數器。

### 對應的適用範圍 {#what-mappings-apply-to}

對應適用於 LLM API 路由上的 POST 請求，例如 `/chat/completions`、`/v1/responses` 與 `/v1/messages`、A2A 代理程式路由，以及已註冊的 pass-through 端點。這包括後續呼叫，例如 `POST /v1/batches/{batch_id}/cancel` 與 `POST /v1/responses/{response_id}/cancel`，因此在 `required` 規則下它們也需要 baggage，而 `GET` 讀取則永遠不需要。Token 計算、模型清單、請求預覽、MCP 路由、`/v1/indexes` 與 `/v1/memory` 會被略過，因此 `required` 規則不會拒絕它們，且其支出不帶對應標籤。

實驗性的 `/queue/chat/completions` 路由與 `/chat/completions` 以相同方式對應，因此 `required` 規則會拒絕缺少 baggage 金鑰的佇列呼叫，而標籤預算用罄時會以 HTTP 422 拒絕它。較早版本會略過它。<SinceVersion v="1.111.0" />

另有少數路由因已知缺口而以相同方式略過對應。這些是 `/v1/evals` 路由，以及以未以 [pass-through 路由](../pass_through/intro) 名稱開頭的提供者前綴送出的批次與檔案請求，例如 `/litellm_proxy/v1/batches`、`/hosted_vllm/v1/files` 或 `/xai/v1/batches`。以其開頭的前綴，例如 `/openai/`、`/azure/`、`/vertex_ai/`、`/bedrock/` 或 `/openai_like/`，則會被對應。`/v1/batches` 與 `/v1/files` 也會被對應。它們從請求中選取提供者，例如上傳時的 `target_model_names`、`custom-llm-provider` 標頭或 `custom_llm_provider` 欄位，而當請求未指定任何提供者時，會送往 OpenAI。

背景 `/v1/responses` 呼叫會保留建立它的請求所對應的標籤，因此它完成時計費的支出會記在該標籤上，即使後續的讀取未送出 baggage。輸入檔案以 `target_model_names` 上傳的批次，也會以相同方式保留批次建立請求的標籤。當提供者執行該批次時，其支出由 [batch cost poller](./managed_batches#observability) 寫入，該 poller 每 `proxy_batch_polling_interval` 秒執行一次（預設為一小時），每次最多處理 `MAX_OBJECTS_PER_POLL_CYCLE` 個批次，因此標籤預算會在批次完成一段時間後才看到該筆支出。輸入檔案未以 `target_model_names` 上傳的 OpenAI 批次，會在擷取它的 `GET /v1/batches/{batch_id}` 呼叫上計費，且該支出不帶對應標籤。

對應標籤僅用於支出追蹤與預算。它們永遠不會在 `enable_tag_filtering` 下選取部署、附加標籤範圍的政策，或挑選標籤模式的防護欄，除非呼叫者、金鑰、團隊或專案本身已帶有相同的標籤。`reject_clientside_metadata_tags` 不會阻擋對應標籤，因為它們是由管理員設定的。不過，用戶端仍可自行選擇 baggage 值，因此任何金鑰都能送出另一個服務的值並花用該標籤的預算，而 `tag_prefix` 規則可讓呼叫者挑選該前綴下的任何標籤。請使用精確的 `value` 規則或 `require_budgeted_tag`，將呼叫者限制在您建立的標籤上。

Baggage 會以 OpenTelemetry 的方式解碼。百分比編碼的值會被解碼，而單獨的 `+` 會被讀作空格，因此字面上的加號請送出 `%2B`。`;` 之後的屬性以及 `=` 周圍的空格會被忽略，而帶有控制字元（例如 `%00`）的值不會對應出任何標籤。

您也可以在 Admin UI 中編輯這些規則。開啟 Settings 區段中的 **路由器設定**，接著切換到 **一般** 分頁，並使用 `request_tag_mappings` 列。來自 `config.yaml` 的規則會在該處以唯讀方式顯示。

此設定需要 `opentelemetry-api` 套件。Docker 映像已包含它，而以 pip 安裝 `litellm[proxy]` 時，也需要另外 `pip install opentelemetry-api`。


## 設定標籤速率限制 {#setting-tag-rate-limits}

在標籤上設定 `rpm_limit` 與 `tpm_limit`，即可限制該標籤每分鐘的請求數與 token 數。此限制會套用到標籤本身，因此使用量會在所有傳送該標籤的金鑰與團隊之間共享，無論標籤是透過請求 `metadata.tags`、`x-litellm-tags` 標頭，或金鑰附加的標籤傳入。這與金鑰中繼資料內每個金鑰 `tag_rpm_limit` 對應表不同，後者會獨立計量每個金鑰在某標籤下的請求。

標籤上的速率限制由 v3 平行請求限制器強制執行。一旦某標籤超過其限制，任何帶有該標籤的請求都會以 HTTP 429 被拒絕，並附帶類似 `Rate limit exceeded for tag: engineering. Limit type: requests. Current limit: 100` 的訊息。`rpm_limit` 會在接納時計算每個請求，而 `tpm_limit` 則會在呼叫完成後依據請求的實際 token 使用量計費，因此可能會先接納一個請求，等使用量落定後下一個請求才被拒絕。

建立一個具有速率限制的標籤：

```shell
curl -X POST 'http://0.0.0.0:4000/tag/new' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
            "name": "engineering",
            "rpm_limit": 100,
            "tpm_limit": 100000
        }'
```

更新既有標籤的速率限制：

```shell
curl -X POST 'http://0.0.0.0:4000/tag/update' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
            "name": "engineering",
            "rpm_limit": 200,
            "tpm_limit": 200000
        }'
```

#### LiteLLM 管理介面 {#litellm-admin-ui-2}

前往 **標籤管理** 頁面，點擊 **建立新標籤**（或開啟一個標籤並點擊 **編輯標籤**），展開 **預算與速率限制**，並填入 **TPM 限制** 與 **RPM 限制**。兩者都接受 0 以上的整數。清除欄位並儲存，會從標籤移除該限制。

<Image 
  img={require('../../img/tag_budget1.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

## 管理標籤 {#managing-tags}

### 檢視標籤資訊 {#view-tag-information}

取得特定標籤的資訊：

```shell
curl -X POST 'http://0.0.0.0:4000/tag/info' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "names": ["engineering", "marketing"]
         }'
```

**回應：**

```json
{
  "engineering": {
    "name": "engineering",
    "description": "Engineering department cost center",
    "spend": 245.50,
    "max_budget": 500.0,
    "budget_duration": "30d",
    "budget_reset_at": "2025-11-10T00:00:00Z",
    "created_at": "2025-10-11T00:00:00Z",
    "updated_at": "2025-10-11T12:30:00Z"
  },
  "marketing": {
    "name": "marketing",
    "description": "Marketing department cost center",
    "spend": 89.20,
    "max_budget": 300.0,
    "budget_duration": "30d",
    "budget_reset_at": "2025-11-10T00:00:00Z",
    "created_at": "2025-10-11T00:00:00Z",
    "updated_at": "2025-10-11T12:30:00Z"
  }
}
```

### 更新標籤預算 {#update-tag-budget}

更新既有標籤的預算：

```shell
curl -X POST 'http://0.0.0.0:4000/tag/update' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "name": "engineering",
           "max_budget": 750.0,
           "budget_duration": "30d"
         }'
```

### 刪除標籤 {#delete-tag}

```shell
curl -X POST 'http://0.0.0.0:4000/tag/delete' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "name": "engineering"
         }'
```

## 每個請求可使用多個標籤 {#multiple-tags-per-request}

您可以將多個標籤套用到單一請求，以同時追蹤不同維度的成本。例如，同時追蹤成本中心與特定專案：

```python
response = client.chat.completions.create(
    model="{{openai_large}}",
    messages=[{"role": "user", "content": "Hello"}],
    extra_body={
        "metadata": {
            "tags": ["engineering", "project-alpha", "customer-acme"]
        }
    }
)
```

```shell
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
     -H "Authorization: Bearer $LITELLM_API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
           "model": "{{openai_large}}",
           "messages": [{"role": "user", "content": "Hello"}],
           "metadata": {
               "tags": ["engineering", "project-alpha", "customer-acme"]
           }
         }'
```

**預算強制執行：** 若任何標籤超出其預算，請求將被拒絕。
