# 請求標頭 {#request-headers}

LiteLLM 支援的特殊標頭。

## 標頭轉送 {#header-forwarding}

預設情況下，LiteLLM 不會將用戶端標頭轉送到 LLM 提供者 API。不過，您可以針對特定模型群組選擇性啟用標頭轉送。[深入瞭解如何設定標頭轉送](./forward_client_headers.md)。

## LiteLLM 標頭 {#litellm-headers}

`x-litellm-timeout` Optional[float]：請求的逾時時間（秒）。

`x-litellm-stream-timeout` Optional[float]：取得回應第一個區塊的逾時時間（秒）（僅適用於串流請求）。[示範影片](https://www.loom.com/share/8da67e4845ce431a98c901d4e45db0e5)

`x-litellm-enable-message-redaction`: Optional[bool]：不要將訊息內容記錄到記錄整合中。只追蹤支出。[深入瞭解](./logging#redact-messages-response-content)

`x-litellm-tags`: Optional[str]：以逗號分隔的標籤清單（例如 `tag1,tag2,tag3`），用於[依標籤路由](./tag_routing) **或** [支出追蹤](/docs/proxy/cost_tracking#custom-tags)。

`x-litellm-num-retries`: Optional[int]: 此請求的重試次數。此設定的優先順序高於請求本文中的 `num_retries`、部署的 `litellm_params`，以及 `litellm_settings`。 [了解更多](../routing#where-num_retries-can-be-set-and-which-one-wins)

`x-litellm-keepalive-seconds`: Optional[float]: 在串流無訊號達這麼多秒後送出一個 SSE `: ping` 註解框架，以便透過負載平衡器逾時維持看似閒置的連線存活。受部署的 `allow_client_keepalive_override` 設定影響；若部署尚未啟用此功能，則不會生效。 [了解更多](./timeout#keepalive-pings-for-idle-streaming-connections)

`x-litellm-spend-logs-metadata`: Optional[str]：包含要納入支出記錄的自訂中繼資料之 JSON 字串。範例：`{"user_id": "12345", "project_id": "proj_abc", "request_type": "chat_completion"}`。[深入瞭解](./cost_tracking)

`x-litellm-customer-id`: Optional[str]：用於傳遞客戶／終端使用者 ID 的標準標頭。始終會檢查，無需任何設定。[深入瞭解](./customers)

`x-litellm-end-user-id`: Optional[str]：用於傳遞客戶／終端使用者 ID 的標準標頭。始終會檢查，無需任何設定。[深入瞭解](./customers)

`x-litellm-trace-id` Optional[str]: 用於關聯屬於同一段對話或代理程式流程的所有 LLM 請求的穩定 id。此值會儲存在 `session_id` 資料表的 `LiteLLM_SpendLogs` 欄位，以及請求中繼資料（`trace_id` 與 `session_id`）中，並會傳遞至巢狀的 MCP 工具請求與 A2A 代理程式請求，因此內部 LLM 請求會共用相同的 session id。三個標頭中的最高優先順序。

`x-litellm-session-id` Optional[str]: 與 `x-litellm-trace-id` 行為相同。當 `x-litellm-trace-id` 不存在時使用。這兩個標頭可互換，並會設定相同的 chain id。

`x-<vendor>-session-id` Optional[str]: 備援模式。任何符合 `x-<vendor>-session-id` 的標頭（例如 `x-claude-code-session-id`）在沒有任何明確的 LiteLLM 標頭時，會自動被偵測為 session id。此值必須看起來像 session id：英數字元、連字號或底線，且至少 8 個字元長。

LiteLLM 會依固定優先順序解析 session id：先是 `x-litellm-trace-id`，接著是 `x-litellm-session-id`，然後是任何 `x-<vendor>-session-id` 標頭。第一個符合者勝出，而解析出的值會成為在整個請求以及它所觸發的任何巢狀 MCP 或 A2A 請求中共用的 chain id。

### Session 關聯範例 {#session-correlation-example}

送出兩個具有相同 `x-litellm-trace-id` 值的 chat completion 請求，將它們分組為同一個 session：

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-trace-id: my-conversation-123" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "Hello, who won the world cup in 2022?"}]
  }'

curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-trace-id: my-conversation-123" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [{"role": "user", "content": "And who was the top scorer?"}]
  }'
```

所有共用該值的請求，都可以透過依 session id 查詢支出記錄找到，或在 Admin UI 的 logs 頁面中透過 session 分組找到。

## Anthropic 標頭 {#anthropic-headers}

`anthropic-version` Optional[str]：要使用的 Anthropic API 版本。  
`anthropic-beta` Optional[str]：要使用的 Anthropic API beta 版本。
    - 對於 `/v1/messages` 端點，這將一律把標頭轉送到基礎模型。
    - 對於 `/chat/completions` 端點，只有在模型已於 `forward_client_headers_to_llm_api` 中設定時才會轉送。[深入瞭解](./forward_client_headers.md)

## OpenAI 標頭 {#openai-headers}

`openai-organization` Optional[str]：OpenAI API 要使用的組織。（目前需要透過 `general_settings::forward_openai_org_id: true` 啟用）

## 自訂標頭 {#custom-headers}

當模型已在 `x-` 中設定時，開頭為 `forward_client_headers_to_llm_api` 的自訂標頭可轉送至 LLM 提供者 API。[深入瞭解標頭轉送設定](./forward_client_headers.md)。
