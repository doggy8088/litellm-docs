---
title: Claude Code - 內容管理
sidebar_label: Claude Code - 內容管理
---

# Claude Code - 內容管理 {#claude-code---context-management}

LiteLLM 原生支援 Anthropic 的 `context_management` beta，涵蓋 **所有提供者** - 不只是 Anthropic。

當您將請求傳送到 `/v1/messages`（或透過 `litellm.anthropic.messages.*`）並附帶 `context_management` 規格時，LiteLLM 會依請求路由位置以兩種方式之一處理：

| 路由路徑 | context_management 的套用方式 |
|---|---|
| **Anthropic API** | 傳遞至 Anthropic 伺服器，由其原生套用編輯 |
| **OpenAI Responses API**（例如 `gpt-5.x-*`） | 傳遞過去；由 Responses API 處理 |
| **任何其他提供者**（OpenAI、xAI、Gemini、Azure、Bedrock non-Anthropic、…） | **閘道內 polyfill** - LiteLLM 在轉送前先對訊息陣列套用編輯 |

此 polyfill 的意思是，您只要撰寫一次 Claude Code 工具迴圈，像平常一樣傳入 `context_management`，就能在代理後方的模型為何者時都正常運作。

## 支援的編輯類型 {#supported-edit-types}

| 編輯類型 | 狀態 | 功能 |
|---|---|---|
| `clear_tool_uses_20250919` | ✅ **支援** | 當觸發門檻達成時，從對話歷史中清除舊的 `tool_result` 內容，只保留最新的 `N` 工具結果 |
| `clear_thinking_20251015` | ❌ 即將推出 | 從歷史中清除 extended-thinking 區塊 |
| `compact_20260112` | ✅ **支援** | 摘要編輯 - LiteLLM 會呼叫已設定的摘要模型，將摘要注入為 system 前綴，並在回應中回傳 `compaction` 區塊 |

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
│  │  Anthropic / Bedrock │   │  Any other provider    │  │
│  │  Anthropic / OpenAI  │   │  (OpenAI, xAI, Gemini, │  │
│  │  Responses API       │   │   Azure, …)            │  │
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
│     (without context_    │                               │
│      management key)     │                               │
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

```python
"trigger": {"type": "tool_uses", "value": 10}   # activate after 10 tool calls
```

### 透過代理（curl） {#via-the-proxy-curl}

```bash
curl -X POST http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "gpt-5.4-mini",
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

`compact_20260112` 編輯類型會在輸入 token 數超過門檻時，摘要對話歷史。LiteLLM 的 polyfill 讓這項功能可在**任何提供者**上運作，不只是 Anthropic。

### 設定 - 設定摘要模型 {#setup---configure-a-summary-model}

此 polyfill 會呼叫另一個已設定的模型來產生摘要。請在代理設定檔中將 `context_management_summary_model` 加入 `general_settings`：

```yaml
# proxy_server_config.yaml
general_settings:
  context_management_summary_model: claude-sonnet-4-5   # any model alias in your model_list
```

若未設定此項，polyfill 不會執行任何動作，並會回傳 `applied_edits[0].error: "summary_model_not_configured"`。

### 用法 {#usage-1}

```python
import litellm

response = await litellm.anthropic.messages.acreate(
    model="gpt-5.4-mini",          # any non-Anthropic provider
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
    "model": "gpt-5.4-mini",
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

**階段 A — 切出既有的壓縮區塊**

如果訊息歷史中已包含 `compaction` 區塊（來自前一次壓縮輪次），則會捨棄該區塊之前的所有內容，並將其摘要文字前置到 system 提示中。這可確保先前脈絡會延續下去。

**階段 B — 門檻檢查**

LiteLLM 會計算（切片後）訊息歷史的有效輸入 tokens。如果低於或等於觸發門檻，請求會立即轉送，不會進行摘要呼叫。

**階段 C — 摘要（僅在超過門檻時）**

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

當壓縮觸發時，回應會包含 `context_management.applied_edits` 與前置到 `content` 的 `compaction` 區塊：

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
  "model": "gpt-5.4-mini",
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
| `trigger.type` | 否 | `"input_tokens"` | `"input_tokens"` 或 `"tool_uses"` |
| `trigger.value` | 否 | `100000` | 門檻；當目前值**超過**此值時，編輯會觸發 |
| `keep.type` | 否 | `"tool_uses"` | 必須為 `"tool_uses"` |
| `keep.value` | 否 | `3` | 要保留的最近工具結果數量 |
| `clear_at_least` | 接受 | - | 請求中接受但被 polyfill 忽略（v0） |
| `exclude_tools` | 接受 | - | 請求中接受但被 polyfill 忽略（v0） |
| `clear_tool_inputs` | 接受 | - | 請求中接受但被 polyfill 忽略（v0） |

> **硬性下限：** 不論 `keep` 為何，LiteLLM 的 polyfill 絕不會清除最近一次完成的 `tool_result` - 也就是模型即將回覆的那一次。

## 回應 {#responses}

### 非串流 {#non-streaming}

當至少有一個編輯觸發時，回應會包含 `context_management` 欄位：

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "Based on the latest weather data..."}],
  "model": "gpt-5.4-mini",
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
data: {"type":"message_start","message":{"id":"msg_01...","type":"message","role":"assistant","content":[],"model":"gpt-5.4-mini","stop_reason":null,"usage":{"input_tokens":620,"output_tokens":0}}}

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

### 代理全域 - `drop_params: true` {#proxy-wide---drop_params-true}

當 `drop_params: true` 設定於代理設定中（或作為 litellm 設定傳入）時，LiteLLM 會靜默地從任何請求中移除 `context_management`，而不是執行 polyfill：

```yaml
# proxy_server_config.yaml
litellm_settings:
  drop_params: true
```

或者在呼叫時：

```python
import litellm
litellm.drop_params = True
```

當您有全域 `drop_params` 政策要抑制不支援的參數時，這很有用 - 內容管理會被視為其他任何不支援的參數一樣，會被捨棄，而不是進行 polyfill。

## 提供者支援矩陣 {#provider-support-matrix}

| 提供者 | `clear_tool_uses_20250919` | `compact_20260112` |
|---|---|---|
| `anthropic/*` | 原生透傳 | 原生透傳 |
| `bedrock/anthropic.*` | 原生透傳 | 原生透傳 |
| `openai/*` (Responses API) | 原生透傳 | 原生透傳 |
| `openai/*` (chat completions) | Polyfill | Polyfill |
| `azure/*` | Polyfill | Polyfill |
| `xai/*` | Polyfill | Polyfill |
| `gemini/*` | Polyfill | Polyfill |
| `vertex_ai/*` | Polyfill | Polyfill |
| 其他所有提供者 | Polyfill | Polyfill |

## 附註 {#notes}

- **`compact_20260112` 需要設定 `context_management_summary_model`** 於 `general_settings` 中。若未設定，編輯會被確認，但不會執行壓縮。
- **Token 計數** 用於 polyfill 閾值檢查時使用 `litellm.token_counter`（未知模型則回退至 tiktoken `cl100k_base`）。
- **`clear_tool_uses_20250919`** 會保留訊息陣列結構：相同的訊息數量、相同的角色順序。只有匹配訊息中的 `tool_result.content` 會被替換為 `"[Cleared by context management]"`。
- **`compact_20260112`** 會將整個先前歷史壓縮為單一的 system 前綴摘要 + 最後一個使用者問題。回應中的 `compaction` 區塊會將摘要文字提供給 Claude Code 用戶端，以便在下一輪延續。
- `compact_20260112` 觸發的 50,000 token 最低值由 proxy 強制執行；較低值的請求會以 HTTP 400 拒絕。
