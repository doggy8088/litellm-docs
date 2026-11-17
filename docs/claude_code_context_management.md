---
title: Claude Code - 內容管理
sidebar_label: Claude Code - 內容管理
---

# Claude Code - 內容管理 {#claude-code---context-management}

LiteLLM 在 Anthropic 與許多其他提供者上支援 Anthropic 的 `context_management` beta。當提供者沒有原生支援時，會由**閘道內 polyfill** 套用編輯。

當您將請求傳送到 `/v1/messages`（或透過 `litellm.anthropic.messages.*`）並附帶 `context_management` 規格時，LiteLLM 會依請求路由位置以下列方式之一處理：

| 路由路徑 | context_management 的套用方式 |
|---|---|
| **Anthropic API**，以及 Bedrock Invoke、Vertex AI、Azure AI 與 Databricks 上的 Claude | 傳遞至提供者，由其原生套用編輯。在 Azure AI 上，LiteLLM 會捨棄 `compact-2026-01-12` beta 標頭，因此 Azure 對 `compact_20260112` 回應 400 |
| **OpenAI Responses API**（`openai/*` 模型，以及少數其他提供者的 Responses 專用部署，例如 `perplexity/perplexity/sonar`） | `compact_20260112` 會成為 Responses API 的原生壓縮。所有其他編輯，例如 `clear_tool_uses_20250919`，會在**閘道內 polyfill** 中執行 |
| **LiteLLM 透過其自有 `/v1/messages` 端點呼叫的其他提供者**（DeepSeek、Tencent、MiniMax、BigModel、EdenAI、DashScope 的 Anthropic 端點、GitHub Copilot 與 Bedrock Mantle 上的 Claude、…） | 照原樣傳遞。LiteLLM 不執行 polyfill，也不檢查編輯，因此由提供者決定如何處理它們 |
| **任何其他提供者**（OpenAI chat completions、xAI、Gemini、Azure、Bedrock Converse、Bedrock non-Anthropic、…） | **閘道內 polyfill** - LiteLLM 在轉送前先對訊息陣列套用編輯 |

Databricks 上的 Claude <SinceVersion v="1.109.0" /> 會針對名稱以 `databricks-claude-` 或 `system.ai.claude-` 開頭的端點傳遞過去。其他任何 Databricks 端點名稱則執行 polyfill。DashScope 的 Anthropic 端點 <SinceVersion v="1.109.0" /> 在部署的 `api_base` 指向它時會傳遞過去。`model_info.supported_endpoints` 列出 `/v1/messages` 的部署，無論其提供者為何，都會照原樣傳遞。

在 `openai/*` 模型上，`clear_tool_uses_20250919` 會在閘道中於 `/v1/messages` 與 `/v1/messages/count_tokens` <SinceVersion v="1.109.0" /> 上執行，因此計數會與 `/v1/messages` 傳送的歷史一致。較早版本會在此路徑上捨棄該編輯，且不發出警告。

帶有 `stop_sequences` 的 `openai/*` 請求會改走 chat completions，兩種編輯都會在 polyfill 中執行。當 proxy 以 `LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES=true` 執行時，每個 `openai/*` 請求也是如此。

在 polyfill 執行的情況下，您只要撰寫一次 Claude Code 工具迴圈，像平常一樣傳入 `context_management`，無論代理後方的模型為何都能正常運作。

## 支援的編輯類型 {#supported-edit-types}

| 編輯類型 | 狀態 | 功能 |
|---|---|---|
| `clear_tool_uses_20250919` | ✅ **支援** | 當觸發門檻達成時，從對話歷史中清除舊的 `tool_result` 內容，只保留最新的 `N` 工具結果 |
| `clear_thinking_20251015` | ❌ 即將推出 | 從歷史中清除 extended-thinking 區塊 |
| `compact_20260112` | ✅ **支援** | 摘要編輯 - LiteLLM 會呼叫已設定的摘要模型，將摘要注入為 system 前綴，並在回應中回傳 `compaction` 區塊。在 OpenAI Responses API 路徑上，改由 OpenAI 執行壓縮 |

## 運作方式 {#how-it-works}

```
Claude Code client
        │
        │  POST /v1/messages  { context_management: { edits: [...] } }
        ▼
┌─────────────────────────────────────────────────────────┐
│                    LiteLLM Proxy                        │
│                                                         │
│  1. Detect routing target                               │
│                                                         │
│  ┌──────────────────────┐   ┌────────────────────────┐  │
│  │  Anthropic and other │   │  Any other provider    │  │
│  │  native /v1/messages │   │  (OpenAI, xAI, Gemini, │  │
│  │  endpoints           │   │   Azure, …)            │  │
│  │                      │   │                        │  │
│  │  Pass context_mgmt   │   │  In-gateway polyfill:  │  │
│  │  spec through as-is  │   │                        │  │
│  │  (server applies it) │   │  clear_tool_uses:      │  │
│  └──────────┬───────────┘   │  • Count input tokens  │  │
│             │               │  • Check trigger       │  │
│             │               │  • Clear old results   │  │
│             │               │  • Keep N most recent  │  │
│             │               │                        │  │
│             │               │  compact_20260112:     │  │
│             │               │  • Slice at compaction │  │
│             │               │    block (if present)  │  │
│             │               │  • Check token trigger │  │
│             │               │  • Call summary model  │  │
│             │               │  • Inject summary as   │  │
│             │               │    system prefix       │  │
│             │               └──────────┬─────────────┘  │
│             │                          │                 │
│             └────────────┬─────────────┘                 │
│                          │                               │
│  2. Forward to provider  │                               │
│     (polyfill path drops │                               │
│      context_management) │                               │
└──────────────────────────┼──────────────────────────────┘
                           ▼
                    Upstream model
                           │
                    Response + usage
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  LiteLLM attaches applied_edits to response             │
│  { context_management: { applied_edits: [...] } }       │
│  (compact also prepends a compaction block to content)  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Claude Code client
```

在 OpenAI Responses API 路徑上，LiteLLM 會將 `compact_20260112` 作為 Responses API 自身的壓縮設定傳送給 OpenAI，而其他每個編輯都會走右側分支。

## 用法 {#usage}

### 基本請求 {#basic-request}

```python
import litellm

response = await litellm.anthropic.messages.acreate(
    model="xai/grok-4",          # any provider
    max_tokens=1024,
    messages=[...],              # your multi-turn tool history
    tools=[{"name": "get_weather", "description": "...", "input_schema": {...}}],
    context_management={
        "edits": [
            {
                "type": "clear_tool_uses_20250919",
                "trigger": {
                    "type": "input_tokens",
                    "value": 80000          # activate when history exceeds 80k tokens
                },
                "keep": {
                    "type": "tool_uses",
                    "value": 3              # keep the 3 most-recent tool results
                }
            }
        ]
    }
)
```

您也可以改以工具使用次數而非 tokens 來觸發：

```python nolint
"trigger": {"type": "tool_uses", "value": 10}   # activate after 10 tool calls
```

### 透過代理（curl） {#via-the-proxy-curl}

```bash
curl -X POST http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_small}}",
    "max_tokens": 1024,
    "messages": [...],
    "tools": [...],
    "context_management": {
      "edits": [
        {
          "type": "clear_tool_uses_20250919",
          "trigger": {"type": "input_tokens", "value": 80000},
          "keep":    {"type": "tool_uses",    "value": 3}
        }
      ]
    }
  }'
```

---

## `compact_20260112` - 對話壓縮 {#compact_20260112---conversation-compaction}

`compact_20260112` 編輯類型會在輸入 token 數超過門檻時，摘要對話歷史。LiteLLM 的 polyfill 讓這項功能可在每個執行 polyfill 的提供者上運作，不只是 Anthropic。

在 OpenAI Responses API 路徑上，LiteLLM 只將 `trigger.value` 傳送給 OpenAI，作為 Responses API 的 `compact_threshold`，並由 OpenAI 自行壓縮對話。OpenAI 對低於 1,000 的 `trigger.value` 回應 400。若沒有 `trigger.value`，OpenAI 會使用自己的預設門檻，而不是 `150000`。LiteLLM 在此路徑上的回應沒有 `compaction` 區塊，因此用戶端在下一個請求會再次傳送完整歷史，OpenAI 也會再次將其壓縮。摘要模型、`instructions`、50,000 token 最低值，以及下方的 `compaction` 區塊與 `applied_edits`，只適用於 polyfill 執行的情況。

### 設定 - 設定摘要模型 {#setup---configure-a-summary-model}

此 polyfill 會呼叫另一個已設定的模型來產生摘要。請在代理設定檔中將 `context_management_summary_model` 加入 `general_settings`：

```yaml
# proxy_server_config.yaml
general_settings:
  context_management_summary_model: {{anthropic}}   # any model alias in your model_list
```

若未設定此項，polyfill 不會執行任何動作，並會回傳 `applied_edits[0].error: "summary_model_not_configured"`。

### 用法 {#usage-1}

```python
import litellm

response = await litellm.anthropic.messages.acreate(
    model="gemini/{{gemini_flash}}",   # any provider that runs the polyfill
    max_tokens=1024,
    messages=[...],                # multi-turn history
    context_management={
        "edits": [
            {
                "type": "compact_20260112",
                "trigger": {
                    "type": "input_tokens",
                    "value": 80000          # compact when history exceeds 80k tokens
                }
            }
        ]
    }
)
```

### 透過代理（curl） {#via-the-proxy-curl-1}

```bash
curl -X POST http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{gemini_flash}}",
    "max_tokens": 1024,
    "messages": [...],
    "context_management": {
      "edits": [
        {
          "type": "compact_20260112",
          "trigger": {"type": "input_tokens", "value": 80000}
        }
      ]
    }
  }'
```

### 運作方式（3 個階段） {#how-it-works-3-phases}

**階段 A：切分現有的壓縮區塊**

如果訊息歷史中已包含 `compaction` 區塊（來自前一次壓縮輪次），則會捨棄該區塊之前的所有內容，並將其摘要文字前置到 system 提示中。這可確保先前脈絡會延續下去。

**階段 B：閾值檢查**

LiteLLM 會計算（切分後）訊息歷史記錄的有效輸入 token 數。如果低於或等於觸發閾值，請求會立即轉送，不會發出摘要呼叫。

**階段 C：摘要（僅在超過閾值時）**

LiteLLM 會以完整對話歷史和摘要提示詞呼叫已設定的 `context_management_summary_model`。摘要會：
- 在下游模型呼叫的 system 訊息中，作為 `"Previous conversation summary: ..."` 前綴注入
- 以 `compaction` 內容區塊形式回傳，並前置到回應 `content` 陣列，讓 Claude Code 用戶端可維持滾動式壓縮狀態

### 自訂摘要提示詞 {#custom-summarization-prompt}

您可以透過 `instructions` 欄位覆寫預設的摘要指示：

```python
context_management={
    "edits": [
        {
            "type": "compact_20260112",
            "trigger": {"type": "input_tokens", "value": 80000},
            "instructions": "Summarize the key decisions made and open questions. Wrap in <summary></summary> tags."
        }
    ]
}
```

摘要文字必須以 `<summary>...</summary>` 標籤包住。若模型回傳的文字沒有這些標籤，`applied_edits[0].error: "summary_extraction_failed"` 會被設為 true，並會轉送原始（未壓縮的）對話。

### `compact_20260112` - 參數 {#compact_20260112---knobs}

| 欄位 | 必填 | 預設值 | 說明 |
|---|---|---|---|
| `trigger.type` | 否 | `"input_tokens"` | 僅支援 `"input_tokens"`；其他值會退回並顯示警告 |
| `trigger.value` | 否 | `150000` | token 門檻。必須 ≥ 50,000，否則請求會以 400 拒絕 |
| `instructions` | 否 | Anthropic 預設提示詞 | 自訂摘要提示詞；必須指示模型將輸出包在 `<summary>` 標籤中 |
| `pause_after_compaction` | 接受 | - | 請求中接受但忽略（警告會記錄於 `applied_edits`） |

### `compact_20260112` - 回應 {#compact_20260112---response}

當壓縮觸發時，回應會包含 `context_management.applied_edits` 與前置到 `compaction` 的 `content` 區塊：

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "compaction",
      "content": "The user is building a Python CLI tool. We have implemented the argument parser and file reader. Next step is to add the output formatter."
    },
    {"type": "text", "text": "Sure, here's the output formatter..."}
  ],
  "model": "{{gemini_flash}}",
  "stop_reason": "end_turn",
  "usage": {"input_tokens": 420, "output_tokens": 120},
  "context_management": {
    "applied_edits": [
      {
        "type": "compact_20260112",
        "summary_input_tokens": 8400,
        "summary_output_tokens": 210
      }
    ]
  }
}
```

若未達觸發條件，`context_management` 會**不存在**，且不會前置任何 `compaction` 區塊。

### 錯誤處理 {#error-handling}

此 polyfill 採盡力而為策略。若摘要呼叫失敗或未回傳可解析的摘要，則會原樣轉送原始對話，並將 `applied_edits[0].error` 設定為：

| `error` 值 | 原因 |
|---|---|
| `"summary_model_not_configured"` | `context_management_summary_model` 未在 `general_settings` 中設定 |
| `"summary_call_failed"` | 摘要模型呼叫拋出例外 |
| `"summary_extraction_failed"` | 摘要模型回應不含 `<summary>...</summary>` 區塊 |

### 用戶端端壓縮區塊（無 `context_management` 編輯） {#client-side-compaction-blocks-no-context_management-edit}

如果請求**未**包含 `compact_20260112` 編輯，但訊息歷史中已包含 `compaction` 區塊（例如來自先前 Claude Code 用戶端端壓縮），LiteLLM 會自動套用僅切片轉送：先前摘要會移到 system 前綴，而只將最新的使用者問題傳送到下游。不會進行摘要模型呼叫。

---

## `clear_tool_uses_20250919` - 參數 {#clear_tool_uses_20250919---knobs}

| 欄位 | 必填 | 預設值 | 說明 |
|---|---|---|---|
| `trigger` | 否 | `{"type": "input_tokens", "value": 100000}` | 必須是物件 |
| `trigger.type` | 否 | `"input_tokens"` | `"input_tokens"` 或 `"tool_uses"` |
| `trigger.value` | 否 | `100000` | 門檻；當目前值**超過**此值時，編輯會觸發 |
| `keep` | 否 | `{"type": "tool_uses", "value": 3}` | 必須是物件 |
| `keep.type` | 否 | `"tool_uses"` | 必須為 `"tool_uses"` |
| `keep.value` | 否 | `3` | 要保留的最近工具結果數量 |
| `clear_at_least.type` | 否 | - | 必須為 `"input_tokens"` |
| `clear_at_least.value` | 否 | - | 以批次清除舊的工具使用，每個批次至少釋放這麼多 tokens |
| `exclude_tools` | 否 | - | 其使用永遠不會被清除的工具名稱 |
| `clear_tool_inputs` | 否 | `false` | `true`，或工具名稱清單，用以一併清空每個被清除 `tool_use` 的 `input` |

> **硬性下限：** 不論 `keep` 為何，LiteLLM 的 polyfill 絕不會清除最近一次完成的 `tool_result` - 也就是模型即將回覆的那一次。

`clear_at_least`、`exclude_tools` 與 `clear_tool_inputs` 可以正常運作 <SinceVersion v="1.109.0" />。較早版本會接受它們並將其忽略。

此 polyfill 接受某些 Anthropic API 會以 400 回答的值，因此請只傳送表格中的值。它會將 `null` 的 `trigger` 或 `keep` 視為未提供，並為任何其他 `trigger.type` 計算輸入 tokens。不是整數的 `trigger.value`，對 `input_tokens` 觸發會使用 `100000`，且永遠不會觸發 `tool_uses` 觸發。任何其他 `keep.type`，或不是非負整數的 `keep.value`，都會保留 3 個工具結果。值為 `true` 時計為 1。

此 polyfill 以下列方式處理 `clear_at_least`、`exclude_tools`、小型結果與格式錯誤的欄位：

- **批次。** 使用 `clear_at_least` 時，舊的工具使用會由最舊開始分批清除。每個批次至少釋放 `clear_at_least.value` 個 tokens，計算時包含被清除的結果，以及以 `litellm.token_counter` 計算的被清除輸入。不完整的批次會等待後續的請求，因此中間的請求會傳送相同的歷史，並持續命中 prompt 快取。
- **被排除的工具。** `exclude_tools` 中工具的使用永遠不會被清除，也不計入 `keep`、`tool_uses` 觸發或批次。
- **小型結果。** 結果為 1 到 46 bytes 文字 的工具使用會被跳過，除非 `clear_tool_inputs` 涵蓋該工具。
- **格式錯誤的值。** 格式錯誤的欄位，例如 `exclude_tools: "memory"`，或不是物件的 `trigger` 或 `keep` <SinceVersion v="1.109.0" />，會取得一個指明編輯與欄位的 HTTP 400，例如 `context_management.edits.0.clear_tool_uses_20250919.trigger: Input should be an object`。使用 `drop_params: true`（Claude Code 與 Codex 請求預設即取得此設定）時，LiteLLM 會改為只捨棄該欄位、使用其預設值，並仍套用該編輯與其他編輯。

## 回應 {#responses}

### 非串流 {#non-streaming}

當至少有一個編輯觸發時，回應會包含 `context_management` 欄位：

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Based on the latest weather data..."}],
  "model": "{{openai_small}}",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 620,
    "output_tokens": 45
  },
  "context_management": {
    "applied_edits": [
      {
        "type": "clear_tool_uses_20250919",
        "cleared_tool_uses": 3,
        "cleared_input_tokens": 8240
      }
    ]
  }
}
```

若未達觸發條件（context 仍然很小），`context_management` 會**不存在**於回應中。

### 串流 {#streaming}

`context_management.applied_edits` 欄位會包含在最終的 `message_delta` SSE 事件中：

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01...","type":"message","role":"assistant","content":[],"model":"{{openai_small}}","stop_reason":null,"usage":{"input_tokens":620,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Based on"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" the latest weather data..."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {
  "type": "message_delta",
  "delta": {"stop_reason": "end_turn", "stop_sequence": null},
  "usage": {"output_tokens": 45},
  "context_management": {
    "applied_edits": [
      {
        "type": "clear_tool_uses_20250919",
        "cleared_tool_uses": 3,
        "cleared_input_tokens": 8240
      }
    ]
  }
}

event: message_stop
data: {"type":"message_stop"}
```

## 停用內容管理 {#disabling-context-management}

### 每個請求 - 省略該欄位 {#per-request---omit-the-field}

只要不要在請求主體中包含 `context_management`。

### 逐模型 - `additional_drop_params` {#per-model---additional_drop_params}

若要讓某個模型不套用 polyfill，請在該模型的 `additional_drop_params` 中列出 `context_management`。LiteLLM 會在傳送給該模型的請求中靜默移除 `context_management`，而不是執行 polyfill：

```yaml
# proxy_server_config.yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      additional_drop_params: ["context_management"]
```

或者在呼叫時：

```python
import litellm
litellm.completion(..., additional_drop_params=["context_management"])
```

`drop_params: true` 不會停用 polyfill。`context_management` 是 LiteLLM 支援的參數（在原生 `/v1/messages` 端點上傳遞過去，在其他地方由 polyfill 提供），因此 `drop_params` 會保留它。在 polyfill 執行的 `clear_tool_uses_20250919` 編輯內部，`drop_params` 只會捨棄格式錯誤的欄位，例如不是物件的 `trigger` 或 `keep`，而編輯會以它們的預設值執行。在傳遞路由上，編輯會照原樣送至提供者，因此 Anthropic 仍會以自己的 400 回答格式錯誤的欄位。

來自 Claude Code 與 Codex 的請求（依其 user agent 辨識）預設會取得 `drop_params: true`。自行設定 `drop_params` 的請求，或在 proxy 設定中設定 `litellm_settings.drop_params: false`，會關閉此行為。因此在這一頁上，Claude Code 與 Codex 會取得捨棄行為，而其他用戶端會取得 400。請參閱 [Claude Code 與 Codex 在 proxy 上](/docs/completion/drop_params#claude-code-and-codex-on-the-proxy)。

`text` 不是字串的 `tool_result` 文字部分，在執行 polyfill 的 `/v1/messages` 請求上，以及每個 `/v1/messages/count_tokens` 請求上（無論有無編輯），都會取得 HTTP 400 <SinceVersion v="1.109.0" />。當 LiteLLM 將計數傳送給 Claude 時，例如在 Vertex AI 與 Azure AI 上，400 來自 Claude。使用 `drop_params: true` 時，LiteLLM 會改為在任何編輯執行之前捨棄該文字部分。

## 提供者支援矩陣 {#provider-support-matrix}

| 提供者 | `clear_tool_uses_20250919` | `compact_20260112` |
|---|---|---|
| `anthropic/*` | 原生透傳 | 原生透傳 |
| `bedrock/anthropic.*` (Invoke) | 原生透傳 | 原生透傳 |
| `bedrock/converse/*` | Polyfill | Polyfill |
| `openai/*` (Responses API，在 `/v1/messages` 上為預設) | Polyfill | 由 OpenAI 壓縮，不回傳 `compaction` 區塊 |
| `openai/*` (chat completions) | Polyfill | Polyfill |
| `azure/*` | Polyfill | Polyfill |
| `xai/*` | Polyfill | Polyfill |
| `gemini/*` | Polyfill | Polyfill |
| `vertex_ai/*` 上的 Claude，以及 `databricks/*`（`databricks-claude-*`、`system.ai.claude-*`）上的 Claude | 原生透傳 | 原生透傳 |
| `azure_ai/*` 上的 Claude | 原生透傳 | Azure 回應 400，因為 LiteLLM 捨棄了 beta 標頭 |
| `vertex_ai/*`（其他模型） | Polyfill | Polyfill |
| `deepseek/*`、`tencent/*`、`minimax/*`、DashScope Anthropic 端點上的 `dashscope/*`，以及其他具有原生 `/v1/messages` 端點的提供者 | 照原樣傳遞 | 照原樣傳遞 |
| DashScope OpenAI 相容端點上的 `dashscope/*` | Polyfill | Polyfill |
| 其他所有沒有原生 `/v1/messages` 端點的提供者 | Polyfill | Polyfill |

## 附註 {#notes}

- **`compact_20260112` 需要設定 `context_management_summary_model`** 於 `general_settings` 中，在每個 polyfill 執行的地方皆然。若未設定，編輯會被確認，但不會執行壓縮。
- **Token 計數** 用於 polyfill 閾值檢查時使用 `litellm.token_counter`（未知模型則回退至 tiktoken `cl100k_base`）。
- **`clear_tool_uses_20250919`** 會保留訊息陣列結構：相同的訊息數量、相同的角色順序。只有匹配訊息中的 `tool_result.content` 會被替換為 `"[Cleared by context management]"`，且當 `clear_tool_inputs` 涵蓋該工具時，這些使用的 `tool_use.input` 會被清空。
- **`compact_20260112`** 在 polyfill 執行時，會將整個先前歷史壓縮為單一的 system 前綴摘要 + 最後一個使用者問題。回應中的 `compaction` 區塊會將摘要文字提供給 Claude Code 用戶端，以便在下一輪延續。
- `compact_20260112` 觸發的 50,000 token 最低值在每個 polyfill 執行的地方都由 proxy 強制執行；較低值的請求會以 HTTP 400 拒絕。
