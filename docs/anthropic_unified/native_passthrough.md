# OpenAI 相容提供者的原生 /v1/messages 轉送 {#native-v1messages-passthrough-for-openai-compatible-providers}

本頁涵蓋 `model_info.supported_endpoints` 啟用選項中 `/v1/messages` 的一半。同一個欄位也能讓某個部署啟用原生 `/v1/responses`，請參閱 [原生 /v1/responses 轉送](../response_api_native_passthrough.md)。這兩個啟用選項彼此獨立：若伺服器同時提供兩者，請兩者都列出

當某個部署的提供者沒有原生 Anthropic Messages 支援時，LiteLLM 會將每個 `/v1/messages` 請求轉換為該提供者自己的 API：`openai/` 部署會透過 OpenAI Responses API（請參閱 [參數對應](./messages_to_responses_mapping.md)），其餘都會透過 `/v1/chat/completions`。這種轉換只會保留目標 API 能表達的內容：`cache_control` 區塊會被捨棄，`thinking` 會對應到提供者自己的推理參數，而其他僅限 Anthropic 的請求細節則會被近似處理或遺失

許多 OpenAI 相容伺服器（自架 vLLM、推理中樞、具有 Anthropic 相容端點的模型供應商）也原生提供 Anthropic Messages API。對於這些伺服器，您可以選擇讓某個部署直接轉送 Anthropic payload 而不做轉換。 <SinceVersion v="1.92.0" />

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

| 部署 `model` | 啟用後的 `/v1/messages` | 未啟用時的 `/v1/messages` |
|---|---|---|
| `openai/<model>` | 原生轉送 | 透過 Responses API 轉換 |
| `custom_openai/<model>` 以及其他未內建 Anthropic Messages 支援的 OpenAI 相容提供者 | 原生轉送 | 透過 `/v1/chat/completions` 轉換 |

## 原生 `/v1/responses` 轉送 {#native-v1responses-passthrough}

`/v1/responses` 啟用選項有其專屬頁面：[OpenAI 相容提供者的原生 /v1/responses 轉送](../response_api_native_passthrough.md)
