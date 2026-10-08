# 錯誤參考 {#error-reference}

透過 LiteLLM AI Gateway 的每個失敗請求都會回傳相容 OpenAI 的 JSON 錯誤主體與 HTTP 狀態碼。本頁是閱讀這些內容的參考：有效負載包含什麼、哪些錯誤來自閘道而非上游提供者、每個狀態碼與錯誤類型的意義，以及當備援鏈用盡目標時閘道會回傳什麼

如果您只需要快速的提供者與閘道判別規則，請參閱 [診斷錯誤](/docs/proxy/error_diagnosis)。關於 Python SDK 的例外類別與各提供者對應表，請參閱 [例外對應](/docs/exception_mapping)

## 錯誤有效負載 {#the-error-payload}

傳送到 LLM API 路由（`/chat/completions`、`/completions`、`/embeddings`、`/responses`，以及其他 OpenAI 形狀的端點）的失敗請求，會回傳單一頂層的 `error` 物件：

```json
{
  "error": {
    "message": "litellm.RateLimitError: RateLimitError: OpenAIException - Rate limit reached for {{openai_small}} in organization org-abc on requests per min (RPM): Limit 3, Used 3.",
    "type": "throttling_error",
    "param": null,
    "code": "429"
  }
}
```

| 欄位 | 類型 | 說明 |
|---|---|---|
| `error.message` | string | 人類可讀的描述。對於提供者失敗，這是完整的 LiteLLM 例外字串，其中同時嵌入 LiteLLM 例外名稱與提供者例外名稱。這是您用來解析並歸因錯誤的欄位 |
| `error.type` | string or null | 粗略分類。源自閘道的錯誤會帶有 LiteLLM 特定值，例如 `budget_exceeded` 或 `key_model_access_denied`；源自提供者的錯誤則會帶有 OpenAI 風格值，例如 `throttling_error` 或 `invalid_request_error`，且常常是 `null`。請將此視為提示，而非主要訊號 |
| `error.param` | string or null | 若閘道能識別出有問題的請求參數，則會填入。缺少必要欄位時設為 `messages`，模型存取遭拒時設為 `model`，虛擬金鑰問題時設為 `key` |
| `error.code` | string | 幾乎總是 HTTP 狀態碼字串（`"429"`，而非 `429`）。對某些提供者錯誤而言，它反而是提供者自己的錯誤代碼字串，例如 `"invalid_api_key"` 或 `"context_length_exceeded"` |
| `error.provider_specific_fields` | object | 選用。僅當提供者回傳值得保留的結構化細節時才會出現，最值得注意的是 Azure OpenAI 的 `innererror` 內容過濾器分解。請參閱 [例外對應](/docs/exception_mapping#accessing-provider-specific-error-details) |

有三種形狀與上述不同，值得留意

閘道內部未處理的例外會回傳刻意精簡的主體，不含 `param` 或 `code`，因此不會將內部細節洩漏給呼叫端：

```json
{"error": {"message": "Internal server error", "type": "internal_server_error"}}
```

請求不存在的路由會在 LiteLLM 看見之前就被網頁框架拒絕，並回傳框架自己的形狀，而不是 `error` 封套。收到這種回應通常表示路徑錯誤或基礎 URL 錯誤，而非閘道故障：

```json
{"detail": "Not Found"}
```

`/v1/management/*` 端點是獨立的 API 表面，會回傳帶有 `application/problem+json` 內容類型與 `type`、`title`、`status`、`detail` 成員的 [RFC 9457 問題詳細資訊](https://www.rfc-editor.org/rfc/rfc9457)，而不是 `error` 封套。此處文件中的 LLM API 路由不受影響

相對地，格式錯誤的主體會被正規化為標準封套。無法解析的 JSON 會回傳 400，且 `error.param` 設為 `request_body`；而格式正確但欄位型別錯誤的主體會回傳 400，且 `type` 設為 `invalid_request_error`

:::note

`error.code` 是字串，不是整數。這與 [OpenAI Python 函式庫的錯誤物件](https://github.com/openai/openai-python/blob/main/src/openai/types/shared/error_object.py) 相符，因此以 OpenAI SDK 撰寫的用戶端可無須修改而反序列化 LiteLLM 錯誤。請與 `"429"` 比較，或直接讀取 HTTP 狀態列

:::

## 回應標頭 {#response-headers}

失敗回應上的標頭會帶有 JSON 主體沒有的診斷內容

| 標頭 | 出現時機 | 說明 |
|---|---|---|
| `x-litellm-call-id` | 驗證成功後的任何失敗 | 此請求的關聯 ID。這是您在支援單中應引用、以及在記錄中搜尋的值；它將 HTTP 回應與閘道的記錄行、spend-log 列與 OpenTelemetry trace 連結在一起。驗證失敗時不會出現，因為在指派呼叫 ID 之前就已被拒絕 |
| `retry-after` | 閘道速率限制與路由器冷卻期 | 等待秒數。請參閱下方關於其出現所代表意涵的註記 |
| `rate_limit_type` | 閘道速率限制 | 哪個維度超標：`requests`、`tokens` 或 `concurrent_requests` |
| `reset_at` | 閘道速率限制 | 超出視窗重設的 UTC 時間戳記 |
| `x-litellm-key-rpm-limit`、`x-litellm-key-max-budget`、`x-litellm-key-spend` | 驗證後的大多數失敗 | 呼叫用金鑰的已設定上限與目前支出，因此您可以確認是否真的是金鑰本身的限制 |
| `x-litellm-timeout` | 已到達部署的請求失敗 | 該次呼叫生效中的逾時值（以秒計） |

只有成功回應才會出現三類標頭，因此不要以它們來建立失敗處理：`llm_provider-*`（上游自身的回應標頭，連同前綴原樣轉送）、`x-ratelimit-*`（上游的速率限制計數器）、以及 `x-litellm-attempted-retries` / `x-litellm-attempted-fallbacks`（成功所花的重試次數與備援跳轉次數）

:::tip

`retry-after` 是強烈的歧義消除訊號。閘道會在自己的速率限制與冷卻期上設定它，且不會將提供者的 `retry-after` 轉送到錯誤回應。因此，帶有 `retry-after` 的 429 是閘道的限制；沒有它的 429 則是提供者的限制

:::

## 是閘道還是提供者？ {#is-it-the-gateway-or-the-provider}

閘道會包裝每個上游失敗，並在 `error.message` 中標示兩層。請由外而內閱讀：

```
litellm.RateLimitError: RateLimitError: OpenAIException - Rate limit reached ...
^^^^^^^^^^^^^^^^^^^^^^                  ^^^^^^^^^^^^^^^
LiteLLM's normalized class              the provider that actually failed
```

出現 `<Provider>Exception` 權杖表示請求已離開閘道、到達提供者，且被提供者拒絕。若沒有該權杖，則表示閘道在呼叫提供者之前或取代呼叫提供者時，就已自行拒絕請求

| 回應中的訊號 | 來源 |
|---|---|
| `message` 包含 `OpenAIException`、`AnthropicException`、`AzureException`、`BedrockException`、`VertexAIException`，或任何其他 `<Provider>Exception` | 上游提供者 |
| `message` 不包含提供者名稱，且 `type` 是 LiteLLM 值，例如 `budget_exceeded`、`expired_key`、`token_not_found_in_db`、`key_model_access_denied` | LiteLLM 閘道 |
| `message` 以 `No deployments available for selected model` 或 `There are no healthy deployments for this model` 開頭 | LiteLLM 閘道（路由） |
| 帶有 `retry-after`、`rate_limit_type` 或 `reset_at` 標頭的 429 | LiteLLM 閘道（速率限制） |
| 沒有這些標頭的 429 | 上游提供者 |

範例一，閘道來源。虛擬金鑰上限低於其累積支出，因此在任何提供者被呼叫之前，請求就被拒絕：

```json
{
  "error": {
    "message": "Budget has been exceeded! Key=analytics-team (sk-...W8TA) Current cost: 0.06, Max budget: 0.05",
    "type": "budget_exceeded",
    "param": null,
    "code": "429"
  }
}
```

範例二，提供者來源。相同的 429 狀態，但訊息指出了提供者，且有效負載不帶有任何閘道的速率限制標頭：

```json
{
  "error": {
    "message": "litellm.RateLimitError: RateLimitError: OpenAIException - Rate limit reached for {{openai_small}} in organization org-abc on requests per min (RPM): Limit 3, Used 3.",
    "type": "throttling_error",
    "param": null,
    "code": "429"
  }
}
```

## HTTP 狀態碼 {#http-status-codes}

閘道回傳底層失敗的狀態碼，而不是一律壓成 500。對提供者失敗而言，這是提供者自己的狀態；對閘道失敗而言，則是閘道所選擇的狀態

| 狀態 | 典型來源 | 意義 | 重試？ |
|---|---|---|---|
| 400 | 兩者皆可 | 請求格式錯誤、未知模型名稱、超出 context window，或內容政策違規。閘道端的 400 會在 `error.param` 中標出缺少的參數 | 否，請修正請求 |
| 401 | 兩者皆可 | 閘道：虛擬金鑰未知或已過期。提供者：為該 deployment 設定的憑證被拒絕 | 否 |
| 403 | 閘道 | 該金鑰、團隊、使用者或組織未被允許使用所請求的模型、工具或 vector store | 否 |
| 404 | 兩者皆可 | 所請求的模型或路由不存在 | 否 |
| 408 | 兩者皆可 | 呼叫已超過目前生效的逾時時間。訊息會同時回報設定的逾時與已經過的時間 | 是，搭配 backoff |
| 422 | 提供者 | 提供者接受了請求的結構，但無法處理其內容 | 否 |
| 429 | 兩者皆可 | 已超出速率限制或預算。請參見下方的 [這是哪一種 429？](#which-429-is-this) | 是，並遵守 `retry-after` |
| 499 | 用戶端 | 用戶端已中斷連線，上游呼叫已取消 | 不適用 |
| 500 | 兩者皆可 | 閘道：未處理的內部錯誤。提供者：提供者端錯誤，包括連往提供者時的網路失敗，會顯示為 `InternalServerError ... Connection error.` | 是，搭配 backoff |
| 503 | 提供者 | 提供者回報自身不可用或過載 | 是，搭配 backoff |

關於 500 與 503 的說明。從未抵達提供者的連線（DNS 失敗、連線遭拒、錯誤的 `api_base`）會回報為 500，並在訊息中顯示 `Connection error.`，而不是 502 或 503。503 表示提供者有回應，並告知您它不可用

## 閘道錯誤類型 {#gateway-error-types}

這些 `error.type` 值由閘道本身產生。看到其中之一代表失敗過程中沒有涉及提供者

| `error.type` | 狀態 | 原因 | 該怎麼做 |
|---|---|---|---|
| `token_not_found_in_db` | 401 | 虛擬金鑰不存在 | 以 `/key/generate` 發出金鑰 |
| `expired_key` | 401 | 該金鑰的 `expires` 時間戳記已過 | 發出新金鑰，或使用 `/key/update` 延長這個金鑰 |
| `auth_error` | 401 | 一般性驗證失敗，包括 JWT 驗證失敗 | 檢查憑證，以及 JWT 驗證時的 issuer 設定 |
| `auth_provider_unavailable` | 503 | 驗證請求所需的身分提供者，例如其 JWKS 端點，不可連線 | 檢查至身分提供者的網路可達性 |
| `key_model_access_denied` | 403 | 該金鑰的 `models` 清單未包含所請求的模型 | 將模型加入金鑰，或呼叫 `/v1/models` 以查看該金鑰可使用哪些項目 |
| `team_model_access_denied`, `user_model_access_denied`, `org_model_access_denied`, `project_model_access_denied` | 403 | 同樣的限制套用在團隊、使用者、組織或專案層級 | 在該類型所命名的物件上授與存取權 |
| `tool_access_denied` | 403 | 所請求的工具不在該金鑰或團隊的 allowed-tools 清單中 | 將工具加入允許清單 |
| `key_vector_store_access_denied`, `team_vector_store_access_denied`, `user_vector_store_access_denied`, `org_vector_store_access_denied` | 401 | 呼叫者不得使用所請求的 vector store | 將該 store 加入該類型所命名物件上的 `object_permission.vector_stores` |
| `team_member_permission_error` | 401 | 呼叫者缺少執行此管理動作所需的 team-member 權限 | 請 team admin 執行，或授與該權限 |
| `key_search_tool_access_denied`, `team_search_tool_access_denied`, `user_search_tool_access_denied` | 403 | `search_tool_deny_by_default` 已啟用，且該類型所命名的金鑰、團隊或使用者未授與所請求的 search tool | 將工具加入該類型所命名物件上的 `object_permission.search_tools` |
| `budget_exceeded` | 429 | 已達到金鑰、團隊、使用者或每工作階段的支出上限。訊息會回報目前花費與最高預算 | 提高預算，或等待預算視窗重設 |
| `throttling_error` | 429 | 已超出 RPM、TPM 或最大平行請求上限。也用於提供者 429，因此請檢查標頭以區分 | 使用 `retry-after` 進行 back off |
| `invalid_request_error` | 400 | 必要參數遺失或格式錯誤。`error.param` 會指出其名稱 | 修正請求主體 |
| `bad_request_error` | 400 | 一般性的閘道端請求拒絕 | 閱讀訊息 |
| `not_found_error` | 404 | 所參照的物件不存在 | 檢查 id |
| `no_db_connection` | 503 | 端點需要資料庫，而閘道無法連到它 | 檢查 `DATABASE_URL` 與資料庫健康狀態 |
| `internal_server_error` | 500 | 未處理的閘道例外 | 檢查閘道記錄中相符的 `x-litellm-call-id` |

目前路由失敗不會設定明顯的 `error.type`；請改以訊息前綴識別

| 訊息前綴 | 狀態 | 原因 |
|---|---|---|
| `No deployments available for selected model` | 429 | 模型群組中的每個 deployment 在重複失敗後都進入冷卻期。訊息會列出正在冷卻的 deployment ids 與剩餘秒數 |
| `There are no healthy deployments for this model` | 400 | 該模型群組沒有任何可處理此請求的 deployment |
| `Not allowed to access model due to tags configuration` | 401 | 基於標籤的路由將此呼叫者的每個 deployment 都排除在外 |
| `No deployments available - crossed budget` | 429 | 基於提供者預算的路由已耗盡每個候選 deployment 的預算 |

## 這是哪一種 429？ {#which-429-is-this}

429 是閘道與提供者都大量使用的唯一狀態，因此值得單獨檢查。請依照下列順序檢視回應

閘道速率限制會設定 `retry-after`、`rate_limit_type` 和 `reset_at`，其訊息會指出觸發的限制：

```json
{
  "error": {
    "message": "Rate limit exceeded for api_key: b2f139a7... Limit type: requests. Current limit: 1, Remaining: 0. Limit resets at: 2026-08-27 00:15:18 UTC",
    "type": "throttling_error",
    "param": null,
    "code": "429"
  }
}
```

閘道預算上限會將 `type` 設為 `budget_exceeded`，並回報相對於上限的支出。路由冷卻會設定 `retry-after`，並以 `No deployments available for selected model` 開頭。任何其他訊息中帶有 `<Provider>Exception` 的情況，都是提供者自己的節流，而且閘道在回傳前已用盡其設定的重試與備援

從 Python SDK 來看，這個分類不需要解析字串即可取得。每個 `litellm.RateLimitError` 都帶有來自 `RateLimitErrorCategory` 的 `category` 屬性，以及來自 `RateLimitType` 的 `rate_limit_type` 屬性：

```python showLineNumbers
import litellm
from litellm.exceptions import RateLimitErrorCategory

try:
    response = litellm.completion(model="{{openai_small}}", messages=[{"role": "user", "content": "hi"}])
except litellm.RateLimitError as e:
    if e.category == RateLimitErrorCategory.LITELLM_RATE_LIMIT:
        print(f"LiteLLM's own limiter: {e.rate_limit_type}")
    elif e.category == RateLimitErrorCategory.VENDOR_RATE_LIMIT:
        print("the upstream provider throttled us")
```

`category` 是 `litellm_rate_limit`、`vendor_rate_limit`、`litellm_batch_rate_limit` 或 `vendor_batch_rate_limit` 其中之一。`rate_limit_type` 是 `requests`、`tokens`、`concurrent_requests`、`budget` 或 `max_iterations` 其中之一。兩者也都會寫入 `StandardLoggingPayload.error_information`，因此自訂回呼與 metrics pipeline 可以在不解析自由文字的情況下，依原因區分 429

## 重試與備援 {#retries-and-fallbacks}

在閘道回傳錯誤之前，會先依模型群組所設定的重試與備援政策進行處理。重試會再次嘗試同一個模型群組；備援會切換到不同的模型群組。設定請參見 [備援（提供者故障轉移）](/docs/proxy/reliability)

**當整條鏈都失敗時，閘道會重新拋出原始例外。** 您收到的狀態碼、`error.type` 與 `error.code` 會是 *第一個* 模型群組失敗的結果，而不是最後一個備援的結果。某個群組的主模型以 500 失敗，而其備援以 503 失敗，則回傳 500。

之後訊息會附加備援嘗試歷史。以下方範例來看：主 `mock-500` 以 `InternalServerError` 失敗，`Available Model Group Fallbacks` 顯示嘗試過的鏈，`Error doing the fallback` 則回報最後一跳傳回的內容

```json
{
  "error": {
    "message": "litellm.InternalServerError: InternalServerError: OpenAIException - The server had an error while processing your request. Sorry about that!. Received Model Group=mock-500\nAvailable Model Group Fallbacks=['mock-503']\nError doing the fallback: litellm.ServiceUnavailableError: ServiceUnavailableError: OpenAIException - The engine is currently overloaded, please try again later.No fallback model group found for original model_group=mock-503. Fallbacks=[{'mock-500': ['mock-503']}]",
    "type": null,
    "param": null,
    "code": "500"
  }
}
```

這個設計有三個重點

`No fallback model group found for original model_group=<name>` 表示該群組未設定任何備援，因此主錯誤會原樣回傳。這本身不是失敗；而是閘道在說明為什麼沒有進行故障轉移

備援詳細資訊是由 `litellm.expose_router_debug_in_errors` 附加的，且預設為啟用。將其設為 `False` 可從回傳給呼叫者的訊息中移除路由細節，包括已設定的備援目標名稱。重試次數則會另外附加，並顯示為 `LiteLLM Retried: 2 times, LiteLLM Max Retries: 2`

成功的備援在回應本文中是不可見的，正常情況下會是 200。請從 `x-litellm-attempted-fallbacks` 標頭偵測，並讀取 `x-litellm-model-group` 以取得實際處理該請求的群組。這些標頭只會在成功時存在，因此失敗的鏈結必須從 `error.message` 或閘道記錄重建

## 串流錯誤 {#streaming-errors}

串流請求會依失敗發生的時間，以兩種方式之一失敗，且您的用戶端必須同時處理兩者

在第一個區塊之前失敗，與非串流失敗無法區分。回應會是 HTTP 錯誤狀態，並帶有一般的 JSON `error` 本文，而且不會開啟串流：

```
HTTP/1.1 500 Internal Server Error
content-type: application/json

{"error":{"message":"litellm.InternalServerError: InternalServerError: OpenAIException - ...","type":null,"param":null,"code":"500"}}
```

在串流開始之後失敗，無法變更狀態碼，因為那時已經是 200。閘道會將錯誤以最終 SSE 事件送出，並承載相同的 `error` 物件：

```
HTTP/1.1 200 OK
content-type: text/event-stream

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"Hel"}}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"lo"}}]}

data: {"error": {"message": "litellm.APIConnectionError: APIConnectionError: OpenAIException - The server had an error while processing your request. Sorry about that!", "type": null, "param": null, "code": "500"}}
```

在將任何 SSE 負載視為區塊之前，請檢查每個 SSE 負載是否包含 `error` 鍵。只檢查 HTTP 狀態的用戶端，會把串流中途失敗記錄成成功，但完成內容不完整

## 例外參考 {#exception-reference}

Python SDK 會拋出型別化例外，且這些例外繼承自對應的 OpenAI 例外類別，因此既有的 OpenAI 錯誤處理可直接沿用。完整表格（包含每個提供者可拋出的例外）請見 [例外對應](/docs/exception_mapping)。摘要如下：

| 狀態 | 例外 | 備註 |
|---|---|---|
| 400 | `BadRequestError` | |
| 400 | `ContextWindowExceededError` | `BadRequestError` 的子類別；可啟用上下文視窗備援 |
| 400 | `ContentPolicyViolationError` | `BadRequestError` 的子類別；可啟用內容政策備援 |
| 400 | `UnsupportedParamsError` | `BadRequestError` 的子類別 |
| 401 | `AuthenticationError` | |
| 403 | `PermissionDeniedError` | |
| 404 | `NotFoundError` | 針對未知模型名稱拋出 |
| 408 | `Timeout` | |
| 422 | `UnprocessableEntityError` | |
| 429 | `RateLimitError` | 包含 `category` 和 `rate_limit_type` |
| 429 | `BudgetExceededError` | 閘道預算上限；包含 `current_cost` 和 `max_budget` |
| 500 | `APIConnectionError` | 任何未對應錯誤的基準情況 |
| 500 | `APIError` | |
| 503 | `ServiceUnavailableError` | |
| >=500 | `InternalServerError` | 任何未對應的 500 類提供者回應 |

每個 LiteLLM 例外都帶有 `status_code`、`message` 和 `llm_provider`，以及在提供者提供結構化細節時的 `provider_specific_fields`

## 重現這些錯誤 {#reproducing-these-errors}

您不需要有故障的提供者來測試錯誤處理。將部署指向回傳您想測試之狀態的本機 HTTP 伺服器，然後透過閘道呼叫它

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: always-429
    litellm_params:
      model: openai/fail-429
      api_base: http://127.0.0.1:8199/v1
      api_key: sk-mock
  - model_name: unreachable
    litellm_params:
      model: openai/anything
      api_base: http://127.0.0.1:9/v1
      api_key: sk-mock
```

上方的 `unreachable` 部署完全不需要模擬伺服器；port 9 會拒絕連線，這可直接重現 500 `Connection error.` 路徑。若要重現閘道端錯誤，請用您想觸發的限制建立金鑰，然後透過它呼叫：

```bash showLineNumbers
# 403 key_model_access_denied
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key_alias": "restricted", "models": ["{{openai_small}}"]}'

# 429 throttling_error, on the second call within the same minute
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key_alias": "capped", "rpm_limit": 1}'

# 429 budget_exceeded, once accrued spend passes the cap
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key_alias": "tiny-budget", "max_budget": 0.05}'
```

若要測試備援耗盡，請將一個永遠失敗的模型群組設為另一個的備援，然後呼叫主要項目。請參閱 [備援（提供者故障移轉）](/docs/proxy/reliability)

## 回報問題 {#reporting-a-problem}

請提供失敗回應中的 `x-litellm-call-id`。它是閘道記錄、spend-log 資料列、該請求的 OpenTelemetry trace，以及 Admin UI 的 Logs 頁面之間的連結鍵，也是最快取得答案的方式

除了它之外，還請提供完整的 `error` 物件、HTTP 狀態、回應標頭，以及您請求的 `model`。如果訊息中包含 `<Provider>Exception`，請先查看提供者自己的狀態頁面；是閘道回報了失敗，但不是它造成的

只印出 `str(e)`（`Error code: 400 - {...}`）的用戶端會漏掉標頭，因此也可以把 id 寫入錯誤本文。設定 `general_settings.include_call_id_in_error_body: true` 後，閘道寫出的每個 JSON 錯誤都會在本文中帶有與標頭相同的值。預設為關閉，因此在您開啟之前，錯誤本文會與現有內容逐位元組保持相同

```yaml
general_settings:
  include_call_id_in_error_body: true
```

在 OpenAI 形狀的路由（`/v1/chat/completions`、`/v1/responses`，包含串流首個區塊錯誤）以及 `/v1/messages` 上，id 會位於 `error` 物件內，而這正是 OpenAI SDK 保留為 `e.body` 的部分：

```json
{"error": {"message": "Invalid model name passed in model=gpt-nope", "type": "invalid_request_error", "param": "model", "code": "400", "litellm_call_id": "019b2c4d-e5f6-7890-abcd-ef1234567890"}}
```

```json
{"type": "error", "error": {"type": "invalid_request_error", "message": "Invalid model name passed in model=gpt-nope", "litellm_call_id": "019b2c4d-e5f6-7890-abcd-ef1234567890"}}
```

直通路由會轉送提供者自己的錯誤本文，因此會在頂層加上 id，而提供者的 `error` 物件則維持原樣：

```json
{"type": "error", "error": {"type": "not_found_error", "message": "model: claude-nope"}, "litellm_call_id": "019b2c4d-e5f6-7890-abcd-ef1234567890"}
```

此設定只會在閘道已於 JSON 本文上設定 `x-litellm-call-id` 標頭的位置加入 id，因此 422 請求驗證錯誤、在 id 存在之前就被拒絕的驗證失敗、串流中途到達的錯誤，以及非 JSON 的直通本文都不會改變

若要查看閘道向上游送出的確切請求，請以 `--detailed_debug` 重新啟動，或設定 `LITELLM_LOG=DEBUG`，或將 `"litellm_request_debug": true` 加到單一請求本文中。請參閱 [除錯](/docs/proxy/debugging)
