# 請求標頭 {#request-headers}

LiteLLM 支援的特殊標頭。

## 標頭轉送 {#header-forwarding}

預設情況下，LiteLLM 不會將用戶端標頭轉送到 LLM 提供者 API。不過，您可以針對特定模型群組選擇性啟用標頭轉送。[深入瞭解如何設定標頭轉送](./forward_client_headers.md)。

## LiteLLM 標頭 {#litellm-headers}

`x-litellm-timeout` Optional[float]：請求的逾時時間（秒）。

`x-litellm-stream-timeout` Optional[float]：取得回應第一個區塊的逾時時間（秒）（僅適用於串流請求）。[示範影片](https://www.loom.com/share/8da67e4845ce431a98c901d4e45db0e5)

`x-litellm-enable-message-redaction`: Optional[bool]：不要將訊息內容記錄到記錄整合中。只追蹤支出。[深入瞭解](./logging#redact-messages-response-content)

`x-litellm-tags`: Optional[str]：以逗號分隔的標籤清單（例如 `tag1,tag2,tag3`），用於[依標籤路由](./tag_routing) **或** [支出追蹤](./enterprise.md#tracking-spend-for-custom-tags)。

`x-litellm-num-retries`: Optional[int]：請求的重試次數。

`x-litellm-spend-logs-metadata`: Optional[str]：包含要納入支出記錄的自訂中繼資料之 JSON 字串。範例：`{"user_id": "12345", "project_id": "proj_abc", "request_type": "chat_completion"}`。[深入瞭解](./cost_tracking)

`x-litellm-customer-id`: Optional[str]：用於傳遞客戶／終端使用者 ID 的標準標頭。始終會檢查，無需任何設定。[深入瞭解](./customers)

`x-litellm-end-user-id`: Optional[str]：用於傳遞客戶／終端使用者 ID 的標準標頭。始終會檢查，無需任何設定。[深入瞭解](./customers)

## Anthropic 標頭 {#anthropic-headers}

`anthropic-version` Optional[str]：要使用的 Anthropic API 版本。  
`anthropic-beta` Optional[str]：要使用的 Anthropic API beta 版本。
    - 對於 `/v1/messages` 端點，這將一律把標頭轉送到基礎模型。
    - 對於 `/chat/completions` 端點，只有在模型已於 `forward_client_headers_to_llm_api` 中設定時才會轉送。[深入瞭解](./forward_client_headers.md)

## OpenAI 標頭 {#openai-headers}

`openai-organization` Optional[str]：OpenAI API 要使用的組織。（目前需要透過 `general_settings::forward_openai_org_id: true` 啟用）

## 自訂標頭 {#custom-headers}

當模型已在 `forward_client_headers_to_llm_api` 中設定時，開頭為 `x-` 的自訂標頭可轉送至 LLM 提供者 API。[深入瞭解標頭轉送設定](./forward_client_headers.md)。
