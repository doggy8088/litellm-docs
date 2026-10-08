# OpenAI 相容提供者的原生 /v1/messages 與 /v1/responses 轉送 {#native-v1messages-and-v1responses-passthrough-for-openai-compatible-providers}

當某個部署的提供者沒有原生 Anthropic Messages 支援時，LiteLLM 會將每個 `/v1/messages` 請求轉換為該提供者自己的 API：`openai/` 部署會透過 OpenAI Responses API（請參閱 [參數對應](./messages_to_responses_mapping.md)），其餘都會透過 `/v1/chat/completions`。這種轉換只會保留目標 API 能表達的內容：`cache_control` 區塊會被捨棄，`thinking` 會對應到提供者自己的推理參數，而其他僅限 Anthropic 的請求細節則會被近似處理或遺失

許多 OpenAI 相容伺服器（自架 vLLM、推理中樞、具有 Anthropic 相容端點的模型供應商）也原生提供 Anthropic Messages API。對於這些伺服器，您可以選擇讓某個部署直接轉送 Anthropic payload 而不做轉換。自 v1.92.0 起提供

## 啟用 `supported_endpoints` {#opt-in-with-supported_endpoints}

將 `/v1/messages` 加入部署上的 `model_info.supported_endpoints`：

```yaml
model_list:
  - model_name: my-open-model
    litellm_params:
      model: openai/some-open-model
      api_base: https://inference.example.com/v1
      api_key: os.environ/EXAMPLE_API_KEY
    model_info:
      supported_endpoints: ["/v1/chat/completions", "/v1/messages"]
```

啟用後，對 proxy 的 `/v1/messages` 的請求會以 POST 送到 `{api_base}/v1/messages`，Anthropic body 會維持不變，但 `cache_control` 除外（如下所示）。`/v1` 尾端的 `api_base` 會先被移除，因此 `https://inference.example.com/v1` 與 `https://inference.example.com` 都會解析為 `https://inference.example.com/v1/messages`。LiteLLM 會送出 `Authorization: Bearer <api_key>`，除非請求已經帶有 `Authorization` 或 `x-api-key` 標頭，預設 `anthropic-version` 為 `2023-06-01`，並轉送 `anthropic-beta` 標頭，包括呼叫端送出的標頭，以及 LiteLLM 為內容管理等功能新增的標頭。串流與回應解析的運作方式與原生 Anthropic 部署相同

未啟用時，部署會維持先前行為，且請求會被轉換。對同一部署的 `/v1/chat/completions` 呼叫則不受影響

## `cache_control` 會被縮減為可攜核心 {#cache_control-is-reduced-to-its-portable-core}

嚴格實作的 Messages API 會拒絕僅限 Anthropic 的 `cache_control` 擴充，例如 `ttl` 與 `cache_control.ttl: 1h is not supported`；而像 Claude Code 這類用戶端，只要啟用 1h prompt 快取，就會在每個 prompt 區塊送出 `{"type": "ephemeral", "ttl": "1h"}`。因此預設情況下，轉送 body 中的每個 `cache_control` 都會被縮減為 `{"type": "ephemeral"}`，包含請求層級、system 區塊、tools、message content 區塊，以及 `tool_result` content。像 `tool_use.input` 和 tool `input_schema` 這類應用程式資料絕不會被動到

當上游支援 `ttl` 時，請在 `model_info` 中使用 `cache_control_ttl: true` 保留它：

```yaml
model_list:
  - model_name: my-open-model
    litellm_params:
      model: openai/some-open-model
      api_base: https://inference.example.com/v1
      api_key: os.environ/EXAMPLE_API_KEY
    model_info:
      supported_endpoints: ["/v1/chat/completions", "/v1/messages"]
      cache_control_ttl: true
```

內建支援 Anthropic Messages 的提供者部署（`anthropic/`、`bedrock/`、`vertex_ai/`，以及其他）會維持以原樣轉送 `cache_control`

使用請求中的 Anthropic 專屬功能來測試它：

```bash
curl http://0.0.0.0:4000/v1/messages \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "my-open-model",
    "max_tokens": 64,
    "system": [{"type": "text", "text": "You are concise", "cache_control": {"type": "ephemeral"}}],
    "messages": [{"role": "user", "content": "Say hi in three words"}]
  }'
```

回應會以提供者原生的 Anthropic 形狀返回，包括其自己的 `usage` 欄位，例如 `cache_creation_input_tokens` 和 `cache_read_input_tokens`

這個啟用選項只對 LiteLLM 原本會轉換的提供者有影響，例如 `openai/` 和 `custom_openai/` 部署。內建支援 Anthropic Messages 的提供者（`anthropic/`、`bedrock/`、`vertex_ai/`，以及其他）已經原生轉送，會忽略它

## 原生 `/v1/responses` 轉送 {#native-v1responses-passthrough}

其 `litellm_params.model` 以前綴 `openai/` 的部署，已經會原生將 `/v1/responses` 傳送到 `{api_base}/responses`。像 `custom_openai/` 這類通用 OpenAI 相容部署沒有自己的 Responses API 設定，因此預設下 LiteLLM 會透過 `/v1/chat/completions` 將 `/v1/responses` 進行橋接：輸入會轉換成 messages，chat completion 會再轉回 Responses 物件，而僅限 Responses 的請求欄位則會被近似處理或捨棄。當伺服器本身提供 `/responses` 時，請將 `/v1/responses` 加入 `model_info.supported_endpoints`，以不經轉換地轉送請求。自 v1.102.0 起提供

```yaml
model_list:
  - model_name: my-open-model
    litellm_params:
      model: custom_openai/some-open-model
      api_base: https://inference.example.com/v1
      api_key: os.environ/EXAMPLE_API_KEY
    model_info:
      supported_endpoints: ["/v1/chat/completions", "/v1/responses"]
```

啟用後，對 proxy 的 `/v1/responses` 的請求會以 POST 送到 `{api_base}/responses`（此處為 `https://inference.example.com/v1/responses`），且無論是串流或非串流請求都會帶著 `Authorization: Bearer <api_key>`。`mode: responses` 在 `model_info` 中的部署也會以相同方式運作。未啟用時，部署會繼續透過 `/v1/chat/completions` 進行橋接，而對該部署的 `/v1/chat/completions` 呼叫則不受影響。`/v1/messages` 與 `/v1/responses` 啟用選項彼此獨立：若伺服器同時提供兩者，請兩者都列出

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "my-open-model", "input": "Say hi in three words"}'
```

### 無狀態後端上的 `previous_response_id` {#previous_response_id-on-stateless-backends}

原生路徑會將 `previous_response_id` 以原樣轉送給後端，因此由後端負責解析。沒有儲存回應的 OpenAI 相容伺服器會拒絕它，通常回傳 400，而該錯誤會原樣回傳給呼叫端。對於這類後端，請在每一輪都於 `input` 中送出完整對話歷史，或者關閉啟用選項並使用帶有 `store_prompts_in_spend_logs: true` 的橋接路徑，這樣可讓 LiteLLM 從自己的支出記錄中解析 `previous_response_id`

| 部署 `model` | 啟用後的 `/v1/messages` | 未啟用時的 `/v1/messages` | 啟用後的 `/v1/responses` | 未啟用時的 `/v1/responses` |
|---|---|---|---|---|
| `openai/<model>` | 原生轉送 | 透過 Responses API 轉換 | 原生 | 原生 |
| `custom_openai/<model>` | 原生轉送 | 透過 `/v1/chat/completions` 轉換 | 原生轉送 | 透過 `/v1/chat/completions` 橋接 |

有些具名的 OpenAI 相容提供者（例如 `hosted_vllm/`）本身就提供 Responses API 支援，也會在未啟用時原生傳送 `/v1/responses`。請查看該提供者的頁面。
