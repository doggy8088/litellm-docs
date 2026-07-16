import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Microsoft Purview 防護欄 {#microsoft-purview-guardrail}

LiteLLM 支援透過 [Microsoft Graph `processContent` API](https://learn.microsoft.com/en-us/graph/api/dataSecurityAndGovernance-processContent) 的 [Microsoft Purview](https://learn.microsoft.com/en-us/purview/purview) DLP 政策。

## 支援的模式 {#supported-modes}

| 模式 | 功能 |
|------|-------------|
| `pre_call` | 在 LLM 請求前，將使用者提示詞與 DLP 政策比對。若有 `restrictAccess/block` 政策動作觸發，則封鎖。 |
| `post_call` | 將 LLM 回應與 DLP 政策比對。若有 `restrictAccess/block` 政策動作觸發，則封鎖。 |
| `logging_only` | 將提示詞與回應都傳送到 Purview 以供稽核。絕不封鎖請求。 |

## 先決條件 {#prerequisites}

1. **一個 Entra 應用程式註冊**，並具備以下 Microsoft Graph 應用程式權限：
   - `InformationProtectionPolicy.Read.All`
   - `ProtectionScopes.Compute.User`
   - `Content.Process.User`

2. **Microsoft Purview 中的一項 DLP 政策**，將您應用程式註冊的 `client_id` 作為受保護應用程式。若沒有啟用中的政策，API 回應中的 `policyActions` 永遠會是空的。

3. **Entra 使用者物件 ID** — 每個請求都必須帶有終端使用者的 Entra 物件 ID（不是使用者名稱或電子郵件）。當無法解析出使用者 ID 時，防護欄會略過 DLP 檢查並記錄警告。

## 快速開始 {#quick-start}

### 1. 在 Entra 中註冊您的應用程式 {#1-register-your-app-in-entra}

```bash
# Create app registration and note the appId (client_id) and tenantId
az ad app create --display-name "LiteLLM-Purview"
az ad sp create --id <appId>

# Create a client secret
az ad app credential reset --id <appId> --append
```

在 Azure 入口網站的 **App registrations → API permissions** 下授與上述權限，然後按 **Grant admin consent**。

### 2. 在 `config.yaml` 中定義防護欄 {#2-define-the-guardrail-in-configyaml}

<Tabs>
<TabItem value="pre_call" label="pre_call">

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: purview-prompt-dlp
    litellm_params:
      guardrail: microsoft_purview
      mode: pre_call
      api_key: os.environ/AZURE_CLIENT_SECRET   # client_secret
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      default_on: true
```

</TabItem>
<TabItem value="post_call" label="post_call">

```yaml
guardrails:
  - guardrail_name: purview-response-dlp
    litellm_params:
      guardrail: microsoft_purview
      mode: post_call
      api_key: os.environ/AZURE_CLIENT_SECRET
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      default_on: true
```

</TabItem>
<TabItem value="logging_only" label="logging_only (audit)">

```yaml
guardrails:
  - guardrail_name: purview-audit
    litellm_params:
      guardrail: microsoft_purview
      mode: logging_only
      api_key: os.environ/AZURE_CLIENT_SECRET
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      default_on: true
```

</TabItem>
</Tabs>

### 3. 啟動 LiteLLM Gateway {#3-start-litellm-gateway}

```shell
litellm --config config.yaml --detailed_debug
```

### 4. 測試請求 {#4-test-request}

在 `metadata` 中傳入終端使用者的 Entra 物件 ID：

```shell
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello, what is the capital of France?"}],
    "metadata": {"user_id": "<entra-user-object-id>"}
  }'
```

**當 DLP 政策封鎖請求時**，LiteLLM 會回傳：

```json
{
  "error": {
    "status_code": 400,
    "message": {
      "error": "Microsoft Purview DLP: Content blocked by policy",
      "activity": "uploadText"
    }
  }
}
```

## 支援的參數 {#supported-params}

| 參數 | 類型 | 必填 | 說明 |
|-------|------|----------|-------------|
| `guardrail` | `str` | 是 | 必須是 `"microsoft_purview"` |
| `mode` | `str` | 是 | `pre_call`、`post_call`，或 `logging_only` |
| `api_key` | `str` | 是 | Entra 應用程式 client secret（可使用 `os.environ/VAR`） |
| `tenant_id` | `str` | 是 | Entra 租用戶 ID |
| `client_id` | `str` | 是 | Entra 應用程式註冊 client ID（在 Purview 中也作為受保護應用程式識別碼使用） |
| `default_on` | `bool` | 否 | 讓此防護欄套用於每個請求。預設值：`false` |
| `purview_app_name` | `str` | 否 | 在 `processContent` 中回報給 Purview 的應用程式名稱。預設值：`"LiteLLM"` |
| `user_id_field` | `str` | 否 | 僅在沒有更強的身分存在時才使用的中繼資料欄位（請見使用者 ID 解析）。預設值：`"user_id"` |

## 使用者 ID 解析 {#user-id-resolution}

用於 Purview `protectionScopes` / `processContent` 的 Entra 物件 ID 會依照**信任順序**（最強優先）解析，因此用戶端不能透過設定 `metadata[user_id_field]` 來覆寫已驗證的 LiteLLM 使用者：

1. `user_api_key_dict.user_id` — 與 LiteLLM API 金鑰繫結的使用者
2. `user_api_key_dict.end_user_id` — 該金鑰上的終端使用者
3. `metadata["user_api_key_user_id"]` — 閘道從金鑰注入的值（若有）
4. `metadata[user_id_field]` — 呼叫端提供（例如預設 `metadata["user_id"]`）；僅在上述皆未設定時使用

如果這些都無法解析出值，DLP 檢查就會**略過**，並記錄警告。

**僅記錄** 回呼使用相同順序，透過 proxy 中繼資料（`litellm_params.metadata`）。

## 依請求啟用 {#enabling-per-request}

當 `default_on: false` 時，您可以針對個別請求選擇啟用或停用：

```shell
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}],
    "guardrails": ["purview-prompt-dlp"],
    "metadata": {"user_id": "<entra-user-object-id>"}
  }'
```

## 運作方式 {#how-it-works}

1. **Token 取得** — 防護欄使用 OAuth2 client credentials grant 取得 Microsoft Graph bearer token。Token 會快取到到期前 60 秒。

2. **保護範圍計算** — 在每次 DLP 檢查前，防護欄會呼叫 `protectionScopes/compute` 來取得代表目前政策狀態的 ETag。結果會依使用者快取 1 小時（依 Microsoft 的建議）。如果 `processContent` 回應表示政策已變更（`protectionScopeState: modified`），則會使快取失效。

3. **內容評估** — 防護欄會呼叫 `processContent`，並帶入文字以及 `activityMetadata.activity` 的 `uploadText`（提示詞）或 `downloadText`（回應）。**Chat**（`/v1/chat/completions`）：pre-call 會串接**每個**訊息中的字串內容（所有角色）；post-call 會在 `n > 1` 時，使用**每個**聊天選項中的 assistant `message.content`。**傳統 text completions**（`/v1/completions`）：pre-call 會使用 `prompt` 欄位（字串或字串清單；僅 token-id 的提示詞會被略過）；post-call 會使用**每個** `TextChoices` 項目中的 `text`。

4. **封鎖決策** — 如果任何 `policyActions` 項目的 `@odata.type` 包含 `restrictAccessAction` 和 `restrictionAction: "block"`，防護欄會拋出 HTTP 400。

5. **稽核記錄** — 在所有模式下，防護欄結果都會記錄到 `metadata.standard_logging_guardrail_information`，並流向已設定的可觀測性後端（Langfuse、Datadog、OTEL 等）。

## 延伸閱讀 {#further-reading}

- [Microsoft Graph processContent API](https://learn.microsoft.com/en-us/graph/api/dataSecurityAndGovernance-processContent)
- [Microsoft Purview DLP 概觀](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp)
- [依 API 金鑰控制防護欄](./quick_start#-control-guardrails-per-api-key)
