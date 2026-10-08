# v1/messages → /responses 參數對照 {#v1messages--responses-parameter-mapping}

當您向 `/v1/messages` 傳送針對 OpenAI 或 Azure 模型的請求時，LiteLLM 會在內部透過 OpenAI Responses API 路由。此頁面 دقیق說明每個參數在雙向之間如何轉換。

轉換邏輯位於 `litellm/llms/anthropic/experimental_pass_through/responses_adapters/transformation.py`。

## 請求：Anthropic → Responses API {#request-anthropic--responses-api}

### 頂層參數 {#top-level-parameters}

| Anthropic (`/v1/messages`) | Responses API | 備註 |
|---|---|---|
| `model` | `model` | 原樣傳遞 |
| `messages` | `input` | 結構化轉換 — 請參閱下方的 messages 區段 |
| `system` （字串） | `instructions` | 以純字串傳遞 |
| `system` （content blocks 清單） | `instructions` | 文字區塊會以 `\n` 串接；非文字區塊會被忽略 |
| `max_tokens` | `max_output_tokens` | 重新命名 |
| `temperature` | `temperature` | 原樣傳遞 |
| `top_p` | `top_p` | 原樣傳遞 |
| `tools` | `tools` | 格式轉換 — 請參閱下方的 tools 區段 |
| `tool_choice` | `tool_choice` | 型別重新對應 — 請參閱下方的 tool_choice 區段 |
| `thinking` | `reasoning` | 預算 token 會對應到 effort level — 請參閱下方的 thinking 區段 |
| `output_format` 或 `output_config.format` | `text` | 包裝為 `{"format": {"type": "json_schema", "name": "structured_output", "schema": ..., "strict": ...}}`。`strict` 會從請求的 `strict` flag 複製而來，並預設為 `false`，因此具有可選屬性的 schema 會直接傳遞；將 `strict: true` 設為開啟 OpenAI strict mode，該模式要求 `required` 中的每個屬性都必須存在 |
| `context_management` | `context_management` | 從 Anthropic dict 轉換為 OpenAI array 格式 — 請參閱下方的 context_management 區段 |
| `metadata.user_id` | `user` | 從 metadata 物件擷取，並截斷為 64 個字元 |
| `metadata.user_id` | `prompt_cache_key` | 相同的值，截斷為 64 個字元（OpenAI 的 key 限制），因此同一位使用者的請求會持續命中相同的 prompt cache。當 `user_id` 為空或 null 時不會設定。請求本文中送出的 `prompt_cache_key` 會優先於衍生出的值 |
| `stop_sequences` | ❌ 未對應 | 會被靜默捨棄 |
| `top_k` | ❌ 未對應 | 會被靜默捨棄 |
| `speed` | ❌ 未對應 | 僅用於在原生路徑上設定 Anthropic beta headers |

chat-completions 路徑（`litellm_settings.use_chat_completions_url_for_anthropic_messages: true`，以及所有非 OpenAI 提供者）會從 `metadata.user_id` 推導出相同的兩個參數，但有兩個差異：`user` 會不經截斷直接傳遞，而 `prompt_cache_key` 只會在目標提供者支援的參數包含它時才會設定。OpenAI、Azure OpenAI 及其他相容 OpenAI 的提供者都會支援；Gemini、Vertex AI、Bedrock 和 Anthropic 則不支援。`litellm_proxy/` 部署（前方有一個 LiteLLM proxy 的另一個 proxy）永遠不會取得衍生出的 key，因為下游 proxy 的真實提供者未知，而且除非在那裡設定 `drop_params`，否則會拒絕它。

### messages 如何轉換 {#how-messages-get-converted}

每個 Anthropic message 都會展開為一個或多個 Responses API input item。關鍵差異在於 `tool_result` 和 `tool_use` 區塊會成為 input 陣列中的**頂層項目**，而不是巢狀在 message 內。

| Anthropic message | Responses API input item |
|---|---|
| `user` role, string content | `{"type": "message", "role": "user", "content": [{"type": "input_text", "text": "..."}]}` |
| `user` role, `{"type": "text"}` block | 位於 user message 內的 `{"type": "input_text", "text": "..."}` |
| `user` role, `{"type": "image", "source": {"type": "base64"}}` | 位於 user message 內的 `{"type": "input_image", "image_url": "data:<media_type>;base64,<data>"}` |
| `user` role, `{"type": "image", "source": {"type": "url"}}` | 位於 user message 內的 `{"type": "input_image", "image_url": "<url>"}` |
| `user` role, `{"type": "tool_result"}` block | 頂層 `{"type": "function_call_output", "call_id": "...", "output": "..."}` — 完全從 message 中取出 |
| `assistant` role, string content | `{"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": "..."}]}` |
| `assistant` role, `{"type": "text"}` block | 位於 assistant message 內的 `{"type": "output_text", "text": "..."}` |
| `assistant` role, `{"type": "tool_use"}` block | 頂層 `{"type": "function_call", "call_id": "<id>", "name": "...", "arguments": "<JSON string>"}` — 完全從 message 中取出 |
| `assistant` role, `{"type": "thinking"}` block | 位於 assistant message 內的 `{"type": "output_text", "text": "<thinking text>"}` |

### tools {#tools}

| Anthropic tool | Responses API tool |
|---|---|
| 任何 `type` 以 `"web_search"` 或 `name == "web_search"` 開頭的 tool | `{"type": "web_search_preview"}` |
| 其他所有 tools | `{"type": "function", "name": "...", "description": "...", "parameters": <input_schema>}` |

### tool_choice {#tool_choice}

| Anthropic `tool_choice.type` | Responses API `tool_choice` |
|---|---|
| `"auto"` | `{"type": "auto"}` |
| `"any"` | `{"type": "required"}` |
| `"tool"` | `{"type": "function", "name": "<tool name>"}` |

### thinking → reasoning {#thinking--reasoning}

`budget_tokens` 值會對應到字串 effort 等級。`summary` 一律設為 `"detailed"`。

| `thinking.budget_tokens` | `reasoning.effort` |
|---|---|
| >= 10000 | `"high"` |
| >= 5000 | `"medium"` |
| >= 2000 | `"low"` |
| < 2000 | `"minimal"` |

如果 `thinking.type` 不是 `"enabled"` 以外的任何值，則完全不會傳送 `reasoning` 欄位。

### context_management {#context_management}

Anthropic 使用帶有 `edits` 陣列的巢狀 dict。OpenAI 使用扁平的 compaction objects 陣列。

```
Anthropic input:
{
  "edits": [
    {
      "type": "compact_20260112",
      "trigger": {"type": "input_tokens", "value": 150000}
    }
  ]
}

Responses API output:
[
  {"type": "compaction", "compact_threshold": 150000}
]
```

## 回應：Responses API → Anthropic {#response-responses-api--anthropic}

當 Responses API 回覆返回時，LiteLLM 會將其轉換為 Anthropic `AnthropicMessagesResponse`。

| Responses API 欄位 | Anthropic 回應欄位 | 備註 |
|---|---|---|
| `response.id` | `id` | |
| `response.model` | `model` | 若缺少則回退至 `"unknown-model"` |
| `ResponseReasoningItem` — `summary[*].text` | `content` 區塊 `{"type": "thinking", "thinking": "..."}` | 每個非空的 summary text 都會成為 thinking 區塊 |
| `ResponseOutputMessage` — `content[*]` where `type == "output_text"` | `content` 區塊 `{"type": "text", "text": "..."}` | |
| `ResponseFunctionToolCall` — `{call_id, name, arguments}` | `content` 區塊 `{"type": "tool_use", "id": "...", "name": "...", "input": {...}}` | `arguments` 會重新以 JSON 解析回 dict |
| 輸出中存在的任何 `function_call` | `stop_reason: "tool_use"` | |
| `response.status == "incomplete"` | `stop_reason: "max_tokens"` | 優先於預設值 |
| 其他全部 | `stop_reason: "end_turn"` | 預設值 |
| `response.usage.input_tokens` | `usage.input_tokens` | |
| `response.usage.output_tokens` | `usage.output_tokens` | |
| *(hardcoded)* | `type: "message"` | 一律設定 |
| *(hardcoded)* | `role: "assistant"` | 一律設定 |
| *(hardcoded)* | `stop_sequence: null` | 在此路徑上一律為 null |
