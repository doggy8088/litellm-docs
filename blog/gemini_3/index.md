---
slug: gemini_3
title: "LiteLLM 上的 DAY 0 支援：Gemini 3"
date: 2025-11-19T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "使用 gemini-3-pro-preview 搭配 LiteLLM Proxy 和 SDK 的常見問題與最佳做法。"
tags: [gemini, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info

本指南涵蓋使用 `gemini-3-pro-preview` 搭配 LiteLLM Proxy 和 SDK 的常見問題與最佳做法。

:::

{/* truncate */}

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="Python SDK">

```python
from litellm import completion
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "Hello!"}],
    reasoning_effort="low"
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 加入至 config.yaml：**

```yaml
model_list:
  - model_name: gemini-3-pro-preview
    litellm_params:
      model: gemini/gemini-3-pro-preview
      api_key: os.environ/GEMINI_API_KEY
```

**2. 啟動 proxy：**

```bash
litellm --config /path/to/config.yaml
```

**3. 發送請求：**

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [{"role": "user", "content": "Hello!"}],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

## 支援的端點 {#supported-endpoints}

LiteLLM 提供 Gemini 3 Pro Preview 的**完整端對端支援**，適用於：

- ✅ `/v1/chat/completions` - OpenAI 相容的 chat completions 端點
- ✅ `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- ✅ [`/v1/messages`](../../docs/anthropic_unified) - Anthropic 相容的 messages 端點
- ✅ `/v1/generateContent` – [Google Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini#rest) 相容端點（程式碼請見：`client.models.generate_content(...)`）

所有端點都支援：
- 串流與非串流回應
- 搭配 thought signatures 的函式呼叫
- 多輪對話
- 所有 Gemini 3 特有功能

## 思維簽章 {#thought-signatures}

#### 什麼是 Thought Signatures？ {#what-are-thought-signatures}

Thought signatures 是模型內部推理過程的加密表示。它們對於在多輪對話中維持脈絡至關重要，尤其是在使用函式呼叫時。

#### Thought Signatures 如何運作 {#how-thought-signatures-work}

1. **自動擷取**：當 Gemini 3 傳回函式呼叫時，LiteLLM 會自動從回應中擷取 `thought_signature`
2. **儲存**：Thought signatures 會儲存在工具呼叫的 `provider_specific_fields.thought_signature` 中
3. **自動保留**：當您在對話歷史中加入 assistant 的訊息時，LiteLLM 會自動保留並將 thought signatures 傳回 Gemini

## 範例：多輪函式呼叫 {#example-multi-turn-function-calling}

#### 搭配 Thought Signatures 的串流 {#streaming-with-thought-signatures}

使用 `stream_chunk_builder()` 的串流模式時，thought signatures 現在會自動保留：

<Tabs>
<TabItem value="streaming" label="Streaming SDK">

```python
import os
import litellm
from litellm import completion

os.environ["GEMINI_API_KEY"] = "your-api-key"

MODEL = "gemini/gemini-3-pro-preview"

messages = [
    {"role": "system", "content": "You are a helpful assistant. Use the calculate tool."},
    {"role": "user", "content": "What is 2+2?"},
]

tools = [{
    "type": "function",
    "function": {
        "name": "calculate",
        "description": "Calculate a mathematical expression",
        "parameters": {
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"],
        },
    },
}]

print("Step 1: Sending request with stream=True...")
response = completion(
    model=MODEL,
    messages=messages,
    stream=True,
    tools=tools,
    reasoning_effort="low"
)

# Collect all chunks
chunks = []
for part in response:
    chunks.append(part)

# Reconstruct message using stream_chunk_builder
# Thought signatures are now preserved automatically!
full_response = litellm.stream_chunk_builder(chunks, messages=messages)
print(f"Full response: {full_response}")

assistant_msg = full_response.choices[0].message

# ✅ Thought signature is now preserved in provider_specific_fields
if assistant_msg.tool_calls and assistant_msg.tool_calls[0].provider_specific_fields:
    thought_sig = assistant_msg.tool_calls[0].provider_specific_fields.get("thought_signature")
    print(f"Thought signature preserved: {thought_sig is not None}")

# Append assistant message (includes thought signatures automatically)
messages.append(assistant_msg)

# Mock tool execution
messages.append({
    "role": "tool",
    "content": "4",
    "tool_call_id": assistant_msg.tool_calls[0].id
})

print("\nStep 2: Sending tool result back to model...")
response_2 = completion(
    model=MODEL,
    messages=messages,
    stream=True,
    tools=tools,
    reasoning_effort="low"
)

for part in response_2:
    if part.choices[0].delta.content:
        print(part.choices[0].delta.content, end="")
print()  # New line
```

**重點：**
- ✅ `stream_chunk_builder()` 現在會保留 `provider_specific_fields`，包含 thought signatures
- ✅ 在將 `assistant_msg` 附加到對話歷史時，thought signatures 會自動包含在內
- ✅ 多輪對話可與串流無縫運作

</TabItem>
<TabItem value="sdk" label="Non-Streaming SDK">

```python
from openai import OpenAI
import json

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000")

# Define tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    }
]

# Step 1: Initial request
messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]

response = client.chat.completions.create(
    model="gemini-3-pro-preview",
    messages=messages,
    tools=tools,
    reasoning_effort="low"
)

# Step 2: Append assistant message (thought signatures automatically preserved)
messages.append(response.choices[0].message)

# Step 3: Execute tool and append result
for tool_call in response.choices[0].message.tool_calls:
    if tool_call.function.name == "get_weather":
        result = {"temperature": 30, "unit": "celsius"}
        messages.append({
            "role": "tool",
            "content": json.dumps(result),
            "tool_call_id": tool_call.id
        })

# Step 4: Follow-up request (thought signatures automatically included)
response2 = client.chat.completions.create(
    model="gemini-3-pro-preview",
    messages=messages,
    tools=tools,
    reasoning_effort="low"
)

print(response2.choices[0].message.content)
```

**重點：**
- ✅ Thought signatures 會自動從 `response.choices[0].message.tool_calls[].provider_specific_fields.thought_signature` 擷取
- ✅ 當您將 `response.choices[0].message` 附加到對話歷史時，thought signatures 會自動保留
- ✅ 您不需要手動擷取或管理 thought signatures

</TabItem>
<TabItem value="proxy" label="cURL">

```bash
# Step 1: Initial request
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [
      {"role": "user", "content": "What'\''s the weather in Tokyo?"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the current weather",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {"type": "string"}
            },
            "required": ["location"]
          }
        }
      }
    ],
    "reasoning_effort": "low"
  }'
```

**回應包含 thought signature：**

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"location\": \"Tokyo\"}"
        },
        "provider_specific_fields": {
          "thought_signature": "CpcHAdHtim9+q4rstcbvQC0ic4x1/vqQlCJWgE+UZ6dTLYGHMMBkF/AxqL5UmP6SY46uYC8t4BTFiXG5zkw6EMJ..."
        }
      }]
    }
  }]
}
```

```bash
# Step 2: Follow-up request (include assistant message with thought signature)
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [
      {"role": "user", "content": "What'\''s the weather in Tokyo?"},
      {
        "role": "assistant",
        "content": null,
        "tool_calls": [{
          "id": "call_abc123",
          "type": "function",
          "function": {
            "name": "get_weather",
            "arguments": "{\"location\": \"Tokyo\"}"
          },
          "provider_specific_fields": {
            "thought_signature": "CpcHAdHtim9+q4rstcbvQC0ic4x1/vqQlCJWgE+UZ6dTLYGHMMBkF/AxqL5UmP6SY46uYC8t4BTFiXG5zkw6EMJ..."
          }
        }]
      },
      {
        "role": "tool",
        "content": "{\"temperature\": 30, \"unit\": \"celsius\"}",
        "tool_call_id": "call_abc123"
      }
    ],
    "tools": [...],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

#### 關於 Thought Signatures 的重要注意事項 {#important-notes-on-thought-signatures}

1. **自動處理**：LiteLLM 會自動擷取並保留 thought signatures。您不需要手動管理它們。

2. **平行函式呼叫**：當模型進行平行函式呼叫時，只有**第一個函式呼叫**具有 thought signature。

3. **序列式函式呼叫**：在多步驟函式呼叫中，每一步的第一個函式呼叫都會有其自己的 thought signature，且必須予以保留。

4. **維持脈絡所必需**：Thought signatures 對維持推理脈絡至關重要。沒有它們，模型可能會失去先前推理的脈絡。

## 對話歷史：從非 Gemini-3 模型切換 {#conversation-history-switching-from-non-gemini-3-models}

#### 常見問題：從非 Gemini-3 模型切換到 Gemini-3 會破壞對話歷史嗎？ {#common-question-will-switching-from-a-non-gemini-3-model-to-gemini-3-break-conversation-history}

**答案：不會！** LiteLLM 會在需要時自動加入假的 thought signatures 來處理這個情況。

#### 運作方式 {#how-it-works}

當您從不使用 thought signatures 的模型（例如 `gemini-2.5-flash`）切換到 Gemini 3 時，LiteLLM 會：

1. **偵測缺少的簽章**：找出沒有 thought signatures 的含工具呼叫 assistant 訊息
2. **加入假簽章**：自動注入假的 thought signature（`skip_thought_signature_validator`）以確保相容性
3. **維持對話流程**：您的對話歷史可持續無縫運作

#### 範例：在對話中途切換模型 {#example-switching-models-mid-conversation}

<Tabs>
<TabItem value="sdk" label="Python SDK">

```python
from openai import OpenAI

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000")

# Step 1: Start with gemini-2.5-flash (no thought signatures)
messages = [{"role": "user", "content": "What's the weather?"}]

response1 = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=messages,
    tools=[...],
    reasoning_effort="low"
)

# Append assistant message (no tool call thought signature from gemini-2.5-flash)
messages.append(response1.choices[0].message)

# Step 2: Switch to gemini-3-pro-preview
# LiteLLM automatically adds dummy thought signature to the previous assistant message
response2 = client.chat.completions.create(
    model="gemini-3-pro-preview",  # 👈 Switched model
    messages=messages,  # 👈 Same conversation history
    tools=[...],
    reasoning_effort="low"
)

# ✅ Works seamlessly! No errors, no breaking changes
print(response2.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="cURL">

```bash
# Step 1: Start with gemini-2.5-flash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "What'\''s the weather?"}],
    "tools": [...],
    "reasoning_effort": "low"
  }'

# Step 2: Switch to gemini-3-pro-preview with same conversation history
# LiteLLM automatically handles the missing thought signature
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",  # 👈 Switched model
    "messages": [
      {"role": "user", "content": "What'\''s the weather?"},
      {
        "role": "assistant",
        "tool_calls": [...]  # 👈 No thought_signature from gemini-2.5-flash
      }
    ],
    "tools": [...],
    "reasoning_effort": "low"
  }'
# ✅ Works! LiteLLM adds dummy signature automatically
```

</TabItem>
</Tabs>

#### 假簽章詳情 {#dummy-signature-details}

使用的假簽章是：`base64("skip_thought_signature_validator")`

這是 Google 建議用來處理來自不支援 thought signatures 的模型之對話歷史的方法。它可讓 Gemini 3：
- 接受對話歷史而不產生驗證錯誤
- 無縫延續對話
- 在模型切換之間維持脈絡

## Thinking Level 參數 {#thinking-level-parameter}

#### `reasoning_effort` 如何對應到 `thinking_level` {#how-reasoning_effort-maps-to-thinking_level}

對於 Gemini 3 Pro Preview，LiteLLM 會自動將 `reasoning_effort` 對應到新的 `thinking_level` 參數：

| `reasoning_effort` | `thinking_level` | 備註 |
|-------------------|------------------|-------|
| `"minimal"` | `"low"` | 對應到低 thinking level |
| `"low"` | `"low"` | 多數使用情境的預設值 |
| `"medium"` | `"high"` | 目前尚未提供中等，對應到高 |
| `"high"` | `"high"` | 最大推理深度 |
| `"disable"` | `"low"` | Gemini 3 無法完全關閉 thinking |
| `"none"` | `"low"` | Gemini 3 無法完全關閉 thinking |

#### 預設行為 {#default-behavior}
LiteLLM 在您省略 `thinking_level` 時**不會**設定 `reasoning_effort`。Gemini API 會套用其**原生預設值**，與直接呼叫 Google 的結果一致。

### 使用範例 {#example-usage}

<Tabs>
<TabItem value="sdk" label="Python SDK">

```python
from litellm import completion

# Low thinking level (faster, lower cost)
response = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "What's the weather?"}],
    reasoning_effort="low"  # Maps to thinking_level="low"
)

# High thinking level (deeper reasoning, higher cost)
response = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "Solve this complex math problem step by step."}],
    reasoning_effort="high"  # Maps to thinking_level="high"
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

```bash
# Low thinking level
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [{"role": "user", "content": "What'\''s the weather?"}],
    "reasoning_effort": "low"
  }'

# High thinking level
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [{"role": "user", "content": "Solve this complex problem."}],
    "reasoning_effort": "high"
  }'
```

</TabItem>
</Tabs>

## 重要注意事項 {#important-notes}

1. **Gemini 3 無法停用 Thinking**：與 Gemini 2.5 模型不同，Gemini 3 無法完全停用 thinking。即使您設定 `reasoning_effort="none"` 或 `"disable"`，也會對應到 `thinking_level="low"`。

2. **Temperature 建議**：對於 Gemini 3 模型，LiteLLM 預設將 `temperature` 設為 `1.0`，並強烈建議維持此預設值。設定 `temperature < 1.0` 可能導致：
   - 無限迴圈
   - 推理效能下降
   - 複雜任務失敗

3. **Thinking 預設值來自 API**：如果您省略 `reasoning_effort`，LiteLLM **不會** 覆寫 `thinking_level`。當您想要可預測的成本或延遲輪廓時，請設定 `reasoning_effort` 或原生 thinking 參數（例如 `reasoning_effort="low"` 以獲得較輕量的推理）。

## 成本追蹤：Prompt 快取與上下文視窗 {#cost-tracking-prompt-caching--context-window}

LiteLLM 為 Gemini 3 Pro Preview 提供完整的成本追蹤，包括對 prompt 快取以及依上下文視窗大小分級定價的支援。

### Prompt 快取成本追蹤 {#prompt-caching-cost-tracking}

Gemini 3 支援 prompt 快取，讓您能快取經常使用的 prompt 前綴以降低成本。LiteLLM 會自動追蹤並計算以下項目的成本：

- **快取命中權杖**：從快取讀取的權杖（以較低費率計費）
- **快取建立權杖**：寫入快取的權杖（一次性成本）
- **文字權杖**：正常處理的一般提示詞權杖

#### 運作方式 {#how-it-works-1}

LiteLLM 會從使用量物件中的 `prompt_tokens_details` 欄位擷取快取資訊：

```python
{
  "usage": {
    "prompt_tokens": 50000,
    "completion_tokens": 1000,
    "total_tokens": 51000,
    "prompt_tokens_details": {
      "cached_tokens": 30000,  # Cache hit tokens
      "cache_creation_tokens": 5000,  # Tokens written to cache
      "text_tokens": 15000  # Regular processed tokens
    }
  }
}
```

### 上下文視窗分層定價 {#context-window-tiered-pricing}

Gemini 3 Pro Preview 最多支援 1M 個上下文權杖，當您的提示詞超過 200k 權杖時，會自動套用分層定價。

#### 自動層級偵測 {#automatic-tier-detection}

LiteLLM 會自動偵測您的提示詞何時超過 200k 權杖門檻，並套用適當的分層定價：

```python
from litellm import completion_cost

# Example: Small prompt (< 200k tokens)
response_small = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "Hello!"}]
)
# Uses base pricing: $0.000002/input token, $0.000012/output token

# Example: Large prompt (> 200k tokens)
response_large = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "..." * 250000}]  # 250k tokens
)
# Automatically uses tiered pricing: $0.000004/input token, $0.000018/output token
```

#### 成本明細 {#cost-breakdown}

成本計算包含：

1. **文字處理成本**：以基礎或分層費率處理的一般權杖
2. **快取讀取成本**：以折扣費率讀取的快取權杖
3. **快取建立成本**：將權杖寫入快取的一次性成本（若高於 200k，則套用分層費率）
4. **輸出成本**：以基礎或分層費率產生的權杖

### 範例：檢視成本明細 {#example-viewing-cost-breakdown}

您可以使用 LiteLLM 的成本追蹤來檢視詳細成本明細：

```python
from litellm import completion, completion_cost

response = completion(
    model="gemini/gemini-3-pro-preview",
    messages=[{"role": "user", "content": "Explain prompt caching"}],
    caching=True  # Enable prompt caching
)

# Get total cost
total_cost = completion_cost(completion_response=response)
print(f"Total cost: ${total_cost:.6f}")

# Access usage details
usage = response.usage
print(f"Prompt tokens: {usage.prompt_tokens}")
print(f"Completion tokens: {usage.completion_tokens}")

# Access caching details
if usage.prompt_tokens_details:
    print(f"Cache hit tokens: {usage.prompt_tokens_details.cached_tokens}")
    print(f"Cache creation tokens: {usage.prompt_tokens_details.cache_creation_tokens}")
    print(f"Text tokens: {usage.prompt_tokens_details.text_tokens}")
```

### 成本最佳化提示 {#cost-optimization-tips}

1. **使用提示詞快取**：對於重複的提示詞前綴，啟用快取可將快取部分的成本最多降低 90%
2. **監控上下文大小**：請留意超過 200k 權杖的提示詞會使用分層定價（輸入 2 倍，輸出 1.5 倍）
3. **快取管理**：快取建立權杖在寫入快取時只收費一次，之後的讀取便宜得多
4. **追蹤使用量**：使用 LiteLLM 內建的成本追蹤來監控不同權杖類型的支出

### 與 LiteLLM Proxy 整合 {#integration-with-litellm-proxy}

使用 LiteLLM Proxy 時，所有成本追蹤都會自動記錄，並可透過以下方式取得：

- **使用量記錄**：proxy 記錄中的詳細權杖與成本明細
- **預算管理**：根據實際使用量設定預算與警示
- **分析儀表板**：依權杖類型檢視成本趨勢與明細

```yaml
# config.yaml
model_list:
  - model_name: gemini-3-pro-preview
    litellm_params:
      model: gemini/gemini-3-pro-preview
      api_key: os.environ/GEMINI_API_KEY

litellm_settings:
  # Enable detailed cost tracking
  success_callback: ["langfuse"]  # or your preferred logging service
```

## 與 Claude Code CLI 搭配使用 {#using-with-claude-code-cli}

您可以將 `gemini-3-pro-preview` 與 **Claude Code CLI**（Anthropic 的命令列介面）搭配使用。這讓您能以 Claude Code 的原生語法與工作流程使用 Gemini 3 Pro Preview。

### 設定 {#setup}

**1. 將 Gemini 3 Pro Preview 新增至您的 `config.yaml`：**

```yaml
model_list:
  - model_name: gemini-3-pro-preview
    litellm_params:
      model: gemini/gemini-3-pro-preview
      api_key: os.environ/GEMINI_API_KEY

litellm_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

**2. 設定環境變數：**

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export LITELLM_MASTER_KEY="sk-1234567890"  # Generate a secure key
```

**3. 啟動 LiteLLM Proxy：**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**4. 設定 Claude Code 使用 LiteLLM Proxy：**

```bash
export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"
export ANTHROPIC_AUTH_TOKEN="$LITELLM_MASTER_KEY"
```

**5. 使用 Claude Code 搭配 Gemini 3 Pro Preview：**

```bash
# Claude Code will use gemini-3-pro-preview from your LiteLLM proxy
claude --model gemini-3-pro-preview

```

### 範例用法 {#example-usage-1}

設定完成後，您就可以使用 Claude Code 的原生介面與 Gemini 3 Pro Preview 互動：

```bash
$ claude --model gemini-3-pro-preview
> Explain how thought signatures work in multi-turn conversations.

# Gemini 3 Pro Preview responds through Claude Code interface
```

### 好處 {#benefits}

- ✅ **原生 Claude Code 體驗**：使用 Gemini 3 Pro Preview 搭配 Claude Code 熟悉的 CLI 介面
- ✅ **統一驗證**：透過 LiteLLM proxy，所有模型共用單一 API 金鑰
- ✅ **成本追蹤**：所有使用量都透過 LiteLLM 集中記錄追蹤
- ✅ **無縫模型切換**：可輕鬆在 Claude 與 Gemini 模型之間切換
- ✅ **完整功能支援**：所有 Gemini 3 功能（thought signatures、function calling 等）都可透過 Claude Code 運作

### 疑難排解 {#troubleshooting}

**Claude Code 找不到模型：**
- 請確認 Claude Code 中的模型名稱完全相符：`gemini-3-pro-preview`
- 驗證您的 proxy 是否正在執行：`curl http://0.0.0.0:4000/health`
- 檢查 `ANTHROPIC_BASE_URL` 是否指向您的 LiteLLM proxy

**驗證錯誤：**
- 驗證 `ANTHROPIC_AUTH_TOKEN` 是否與您的 LiteLLM master key 相符
- 請確認 `GEMINI_API_KEY` 已正確設定
- 檢查 LiteLLM proxy 記錄以取得詳細錯誤訊息

## Responses API 支援 {#responses-api-support}

LiteLLM 完全支援 Gemini 3 Pro Preview 的 OpenAI Responses API，包括串流與非串流模式。Responses API 提供了一種結構化方式來處理含 function calling 的多輪對話，而 LiteLLM 會自動在整段對話中保留 thought signatures。

### 範例：將 Responses API 與 Gemini 3 搭配使用 {#example-using-responses-api-with-gemini-3}

<Tabs>
<TabItem value="sdk" label="非串流">

```python
from openai import OpenAI
import json

client = OpenAI()

# 1. Define a list of callable tools for the model
tools = [
    {
        "type": "function",
        "name": "get_horoscope",
        "description": "Get today's horoscope for an astrological sign.",
        "parameters": {
            "type": "object",
            "properties": {
                "sign": {
                    "type": "string",
                    "description": "An astrological sign like Taurus or Aquarius",
                },
            },
            "required": ["sign"],
        },
    },
]

def get_horoscope(sign):
    return f"{sign}: Next Tuesday you will befriend a baby otter."

# Create a running input list we will add to over time
input_list = [
    {"role": "user", "content": "What is my horoscope? I am an Aquarius."}
]

# 2. Prompt the model with tools defined
response = client.responses.create(
    model="gemini-3-pro-preview",
    tools=tools,
    input=input_list,
)

# Save function call outputs for subsequent requests
input_list += response.output

for item in response.output:
    if item.type == "function_call":
        if item.name == "get_horoscope":
            # 3. Execute the function logic for get_horoscope
            horoscope = get_horoscope(json.loads(item.arguments))
            
            # 4. Provide function call results to the model
            input_list.append({
                "type": "function_call_output",
                "call_id": item.call_id,
                "output": json.dumps({
                  "horoscope": horoscope
                })
            })

print("Final input:")
print(input_list)

response = client.responses.create(
    model="gemini-3-pro-preview",
    instructions="Respond only with a horoscope generated by a tool.",
    tools=tools,
    input=input_list,
)

# 5. The model should be able to give a response!
print("Final output:")
print(response.model_dump_json(indent=2))
print("\n" + response.output_text)
```

**重點：**
- ✅ thought signatures 會在 function calls 中自動保留
- ✅ 可無縫支援多輪對話
- ✅ 完整支援所有 Gemini 3 特定功能

</TabItem>
<TabItem value="streaming" label="串流">

```python
from openai import OpenAI
import json

client = OpenAI()

tools = [
    {
        "type": "function",
        "name": "get_horoscope",
        "description": "Get today's horoscope for an astrological sign.",
        "parameters": {
            "type": "object",
            "properties": {
                "sign": {
                    "type": "string",
                    "description": "An astrological sign like Taurus or Aquarius",
                },
            },
            "required": ["sign"],
        },
    },
]

def get_horoscope(sign):
    return f"{sign}: Next Tuesday you will befriend a baby otter."

input_list = [
    {"role": "user", "content": "What is my horoscope? I am an Aquarius."}
]

# Streaming mode
response = client.responses.create(
    model="gemini-3-pro-preview",
    tools=tools,
    input=input_list,
    stream=True,
)

# Collect all chunks
chunks = []
for chunk in response:
    chunks.append(chunk)
    # Process streaming chunks as they arrive
    print(chunk)

# Thought signatures are automatically preserved in streaming mode
```

**重點：**
- ✅ 完整支援串流模式
- ✅ thought signatures 在串流區塊之間保留
- ✅ 即時處理 function calls 與 responses

</TabItem>
</Tabs>

### Responses API 好處 {#responses-api-benefits}

- ✅ **結構化輸出**：Responses API 為處理 function calls 與多輪對話提供清楚結構
- ✅ **Thought Signature 保留**：LiteLLM 會在串流與非串流模式中自動保留 thought signatures
- ✅ **無縫整合**：可與現有 OpenAI SDK 模式搭配使用
- ✅ **完整功能支援**：所有 Gemini 3 功能（thought signatures、function calling、reasoning）都完整支援

## 最佳實務 {#best-practices}

#### 1. 在對話歷史中一律包含 Thought Signatures {#1-always-include-thought-signatures-in-conversation-history}

在建立含 function calling 的多輪對話時：

✅ **請這樣做：**
```python
# Append the full assistant message (includes thought signatures)
messages.append(response.choices[0].message)
```

❌ **不要這樣做：**
```python
# Don't manually construct assistant messages without thought signatures
messages.append({
    "role": "assistant",
    "tool_calls": [...]  # Missing thought signatures!
})
```

#### 2. 使用適當的思考層級 {#2-use-appropriate-thinking-levels}

- **`reasoning_effort="low"`**：適用於簡單查詢、快速回應、成本最佳化
- **`reasoning_effort="high"`**：適用於需要深度推理的複雜問題

#### 3. 將 Temperature 保持在預設值 {#3-keep-temperature-at-default}

對於 Gemini 3 模型，請一律使用 `temperature=1.0`（預設值）。較低的 temperature 可能會造成問題。

#### 4. 順暢處理模型切換 {#4-handle-model-switches-gracefully}

當從非 Gemini-3 切換到 Gemini-3 時：
- ✅ LiteLLM 會自動處理缺少的 thought signatures
- ✅ 不需要手動介入
- ✅ 對話歷史會無縫延續

## 疑難排解 {#troubleshooting-1}

#### 問題：缺少 Thought Signatures {#issue-missing-thought-signatures}

**症狀**：在對話歷史中包含 assistant 訊息時發生錯誤

**解決方案**：請確保您附加的是回應中的完整 assistant 訊息：
```python
messages.append(response.choices[0].message)  # ✅ Includes thought signatures
```

#### 問題：切換模型時對話中斷 {#issue-conversation-breaks-when-switching-models}

**症狀**：從 gemini-2.5-flash 切換到 gemini-3-pro-preview 時發生錯誤

**解決方案**：這應該會自動運作！LiteLLM 會加入虛擬 signatures。若看到錯誤，請確認您使用的是最新版 LiteLLM。

#### 問題：無限迴圈或效能不佳 {#issue-infinite-loops-or-poor-performance}

**症狀**：模型卡住或產生不佳結果

**解決方案**：
- 請確認 `temperature=1.0`（Gemini 3 的預設值）
- 檢查 `reasoning_effort` 是否設定適當
- 驗證您使用的是正確的模型名稱：`gemini/gemini-3-pro-preview`

## 其他資源 {#additional-resources}

- [Gemini 提供者文件](../../docs/providers/gemini)
- [Thought Signatures 指南](../../docs/providers/gemini#thought-signatures)
- [Reasoning Content 文件](../../docs/reasoning_content)
- [Function Calling 指南](../../docs/completion/function_call)
