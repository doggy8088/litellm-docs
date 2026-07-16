---
slug: gemini_3_5_flash
title: "DAY 0 支援：LiteLLM 上的 Gemini 3.5 Flash"
date: 2026-05-19T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "在 LiteLLM Proxy 和 SDK 中使用 Gemini 3.5 Flash 的指南，提供 day 0 支援。"
tags: [gemini, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 3.5 Flash Day 0 支援  {#gemini-35-flash-day-0-support}

LiteLLM 現在完整支援 `gemini-3.5-flash`，並提供 day 0 支援！

:::note
如果您只需要成本追蹤，您目前的 LiteLLM 版本無需變更。但如果您想支援此版本新增的功能——thinking levels、strict function-call IDs 和 thought signatures——請使用 `v1.87.0-dev.1` 或以上版本。
:::

{/* truncate */}

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:v1.87.0-dev.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.87.0.dev1
```

</TabItem>
</Tabs>

## 新功能 {#whats-new}

### 1. 最小 thinking level {#1-minimal-thinking-level}

Gemini 3.5 Flash 支援新的「Minimal」層級。LiteLLM 會將 OpenAI `reasoning_effort` 對應到 Gemini 的 `thinkingLevel`——請使用 `reasoning_effort="minimal"`。
<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.5-flash",
    messages=[{"role": "user", "content": "What's 2+2?"}],
    reasoning_effort="minimal",
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.5-flash",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "reasoning_effort": "minimal"
  }'
```

</TabItem>
</Tabs>

| `reasoning_effort` | `thinkingLevel` |
|--------------------|-----------------|
| `minimal` | `minimal` |

### 2. 嚴格函式呼叫 {#2-strict-function-calling}

Gemini 3.5+ 要求每個 `functionResponse` 都必須包含與來源 `id` 相同的 `functionCall`，以及相符的函式名稱。LiteLLM 會透過標準 OpenAI 欄位進行往返轉換：assistant 訊息上的 `tool_calls[].id`，以及 tool 結果上的相同值 `tool_call_id`。

**工具呼叫迴圈如何運作**

**步驟 1：使用者提交會觸發工具呼叫的查詢**

傳送使用者訊息與您的工具定義。模型會回應 `tool_calls`——請儲存第一個工具呼叫中的 **`id`**（它可能看起來像 `5x450f94__thought__<signature>`；請在下一個請求中原封不動地傳回）。

```bash
curl -sS http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.5-flash",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather in Tokyo right now?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get current weather for a city",
          "parameters": {
            "type": "object",
            "properties": {
              "city": { "type": "string" }
            },
            "required": ["city"]
          }
        }
      }
    ]
  }' | tee /tmp/gemini_tool_step1.json | jq .
```

從回應中複製工具呼叫 ID：

```bash
TOOL_CALL_ID=$(jq -r '.choices[0].message.tool_calls[0].id' /tmp/gemini_tool_step1.json)
echo "$TOOL_CALL_ID"
# e.g. 5x450f94__thought__EvACCu0CAQw51sdR...
```

**步驟 2：執行您的工具，然後使用相同的 `tool_call_id` 傳送結果**

在本地執行 `get_weather`，然後以完整訊息歷史再次呼叫 proxy。將 **`tool_call_id`** 設為步驟 1 中精確的 **`id`**——LiteLLM 會將其用作 Gemini `functionResponse.id`。

```bash
# Result from your local get_weather("Tokyo") call
WEATHER_RESULT='{"temp_c": 18, "condition": "clear"}'

curl -sS http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d "$(jq -n \
    --arg id "$TOOL_CALL_ID" \
    --arg content "$WEATHER_RESULT" \
    '{
      model: "gemini-3.5-flash",
      messages: [
        {role: "user", content: "What is the weather in Tokyo right now?"},
        {
          role: "assistant",
          content: null,
          tool_calls: [{
            id: $id,
            type: "function",
            function: {name: "get_weather", arguments: "{\"city\": \"Tokyo\"}"}
          }]
        },
        {role: "tool", tool_call_id: $id, content: $content}
      ],
      tools: [{
        type: "function",
        function: {
          name: "get_weather",
          description: "Get current weather for a city",
          parameters: {
            type: "object",
            properties: {city: {type: "string"}},
            required: ["city"]
          }
        }
      }]
    }')" | jq .
```

assistant `tool_calls` 項目上的 **`id`** 與 `role: tool` 訊息上的 **`tool_call_id`** 必須一致。函式 **名稱** 必須與工具定義（`get_weather`）相符。

**步驟 3：模型產生最終答案**

LiteLLM 會將相符的 `id` 和 `name` 傳送到 Gemini `functionResponse` 部分。接著模型會回傳一則包含天氣摘要的正常 assistant 訊息。

### 3. 採樣參數（`temperature`、`top_p`、`top_k`） {#3-sampling-parameters-temperature-top_p-top_k}

Google 已建議在 Gemini 3.5+ 中逐步停用 `temperature`、`top_p` 與 `top_k`，並改以 **system instructions** 來控制採樣行為。這些參數目前仍可使用，但未來可能會在 API 版本中移除。

LiteLLM 採用相同的指引：當您在 Gemini 3+ 模型上傳遞 `temperature`、`top_p` 或 `top_k` 時，您會在記錄中看到一則淘汰警告，建議改用基於 system instruction 的採樣方式。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.5-flash",
    messages=[{"role": "user", "content": "Summarize this article in 3 bullet points."}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.5-flash
    litellm_params:
      model: gemini/gemini-3.5-flash
      api_key: os.environ/GEMINI_API_KEY

  # Or use Vertex AI
  - model_name: vertex-gemini-3.5-flash
    litellm_params:
      model: vertex_ai/gemini-3.5-flash
      vertex_project: your-project-id
      vertex_location: us-central1
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 發送請求**

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.5-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

</TabItem>
</Tabs>

## 支援的端點 {#supported-endpoints}

LiteLLM 為 Gemini 3.5 Flash 提供 **完整端到端支援**，適用於：

- ✅ `/v1/chat/completions` - OpenAI 相容的 chat completions 端點
- ✅ `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- ✅ [`/v1/messages`](../../docs/anthropic_unified) - Anthropic 相容的 messages 端點
- ✅ `/v1/generateContent` – [Google Gemini API](../../docs/generateContent) 相容端點 

所有端點都支援：
- 串流與非串流回應
- 具備 thought signatures 的函式呼叫
- 多輪對話
- 所有 Gemini 3 特定功能（thinking levels、thought signatures）
- 完整的多模態支援（文字、圖片、音訊、影片）
