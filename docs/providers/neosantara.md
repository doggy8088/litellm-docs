---
title: "搭配 LiteLLM AI Gateway 使用 Neosantara API"
sidebar_label: "Neosantara"
description: "在 Neosantara 上呼叫 Gemini 3.1 Flash Lite 與 GLM-4.7 Flash，透過 completion() 或 responses() 使用工具呼叫、推理強度與自訂 token 定價。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Neosantara {#neosantara}

## 概觀 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Neosantara 提供與 OpenAI 相容的 API，支援聊天完成與 Responses API。 |
| LiteLLM 上的提供者路由 | `neosantara/` |
| 提供者文件連結 | [Neosantara ↗](https://docs.neosantara.xyz) |
| 基礎 URL | `https://api.neosantara.xyz/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#responses-api), [function calling](#function-calling) |

<br />
<br />

**我們透過 LiteLLM 中的 `neosantara/` 前綴支援 Neosantara 模型。**

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["NEOSANTARA_API_KEY"] = ""  # your Neosantara API key
```

免費層級的 Neosantara 帳戶可以呼叫 `gemini-3.1-flash-lite`，本頁的範例即使用此模型。某些模型（例如 `gemini-3.5-flash`）在帳戶存入點數之前，會回應 403 `insufficient_tier`。

您可以使用以下方式覆寫預設的基礎 URL：

```python showLineNumbers title="Optional Base URL Override"
os.environ["NEOSANTARA_API_BASE"] = "https://api.neosantara.xyz/v1"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Neosantara Non-streaming Completion"
import os
from litellm import completion

os.environ["NEOSANTARA_API_KEY"] = ""

response = completion(
    model="neosantara/gemini-3.1-flash-lite",
    messages=[{"role": "user", "content": "Hello from LiteLLM"}],
    max_tokens=64,
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="Neosantara Streaming Completion"
import os
from litellm import completion

os.environ["NEOSANTARA_API_KEY"] = ""

response = completion(
    model="neosantara/gemini-3.1-flash-lite",
    messages=[{"role": "user", "content": "Write a one-line poem about Jakarta"}],
    max_tokens=64,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

## 函式呼叫 {#function-calling}

### 聊天完成 {#chat-completions}

函式呼叫可透過 `completion()` 在 Neosantara 上運作。視模型而定，LiteLLM 可能要求您在此提供者路由上明確允許 OpenAI 參數。

```python showLineNumbers title="Neosantara Function Calling via completion()"
import os
from litellm import completion

os.environ["NEOSANTARA_API_KEY"] = ""

response = completion(
    model="neosantara/gemini-3.1-flash-lite",
    messages=[{"role": "user", "content": "What is the weather in Jakarta? Use the tool."}],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather by city name",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string"}
                    },
                    "required": ["city"]
                }
            }
        }
    ],
    tool_choice="auto",
    allowed_openai_params=["tools", "tool_choice"],
    max_tokens=128,
)

print(response.choices[0].message.tool_calls)
```

## Responses API {#responses-api}

Neosantara 也支援 LiteLLM 的 `responses()` 介面。

```python showLineNumbers title="Neosantara Responses API"
import os
from litellm import responses

os.environ["NEOSANTARA_API_KEY"] = ""

response = responses(
    model="neosantara/gemini-3.1-flash-lite",
    input="Reply with exactly: pong",
    max_output_tokens=8,
)

print(response.output_text)
```

### Responses API 工具呼叫 {#responses-api-tool-calling}

函式呼叫也可透過 `responses()` 運作：

```python showLineNumbers title="Neosantara Function Calling via responses()"
import os
from litellm import responses

os.environ["NEOSANTARA_API_KEY"] = ""

response = responses(
    model="neosantara/gemini-3.1-flash-lite",
    input="What is the weather in Jakarta? Use the tool.",
    tools=[
        {
            "type": "function",
            "name": "get_weather",
            "description": "Get weather by city name",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"]
            }
        }
    ],
    max_output_tokens=128,
)

print(response.output)
```

## 參數相容性 {#parameter-compatibility}

LiteLLM 會自動將 `max_completion_tokens` 對應至 Neosantara 的 `max_tokens`。

```python showLineNumbers title="Neosantara max_completion_tokens Compatibility"
import os
from litellm import completion

os.environ["NEOSANTARA_API_KEY"] = ""

response = completion(
    model="neosantara/gemini-3.1-flash-lite",
    messages=[{"role": "user", "content": "Summarize LiteLLM in one sentence"}],
    max_completion_tokens=64,
)

print(response.choices[0].message.content)
```

## 推理強度 {#reasoning-effort}

LiteLLM 可以將 `reasoning_effort` 傳遞給 Neosantara，但與 `completion()` 上的工具呼叫一樣，您應在此提供者路由上明確允許該參數。

```python showLineNumbers title="Neosantara reasoning_effort"
import os
from litellm import completion

os.environ["NEOSANTARA_API_KEY"] = ""

response = completion(
    model="neosantara/gemini-3.1-flash-lite",
    messages=[{"role": "user", "content": "Reply with exactly: reasoned"}],
    reasoning_effort="high",
    allowed_openai_params=["reasoning_effort"],
    max_tokens=8,
)

print(response.choices[0].message.content)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: neosantara-gemini-flash-lite
    litellm_params:
      model: neosantara/gemini-3.1-flash-lite
      api_key: os.environ/NEOSANTARA_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
export NEOSANTARA_API_KEY="your-neosantara-api-key"
export LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY:-sk-$(openssl rand -hex 16)}"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

在另一個終端機中，將 `LITELLM_MASTER_KEY` 設為上方印出的金鑰，然後呼叫 proxy：

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Neosantara via Proxy - OpenAI SDK"
import os
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key=os.environ["LITELLM_MASTER_KEY"],
)

response = client.chat.completions.create(
    model="neosantara-gemini-flash-lite",
    messages=[{"role": "user", "content": "Say hello from the proxy"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Neosantara via Proxy - LiteLLM SDK"
import os
import litellm

response = litellm.completion(
    model="litellm_proxy/neosantara-gemini-flash-lite",
    messages=[{"role": "user", "content": "Say hello from the proxy"}],
    api_base="http://localhost:4000",
    api_key=os.environ["LITELLM_MASTER_KEY"],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Neosantara via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "neosantara-gemini-flash-lite",
    "messages": [{"role": "user", "content": "Say hello from the proxy"}]
  }'
```

```bash showLineNumbers title="Neosantara via Proxy - Responses API"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "neosantara-gemini-flash-lite",
    "input": "Reply with exactly: pong"
  }'
```

</TabItem>
</Tabs>

### Proxy 上的工具與 reasoning_effort {#tools-and-reasoning_effort-on-the-proxy}

視模型而定，proxy 可能對 `tools`、`tool_choice`、`parallel_tool_calls` 或 `reasoning_effort` 回應 400 `UnsupportedParamsError`，例如 `glm-4.7-flash` 就是如此。請在部署上允許這些參數，方式與 `allowed_openai_params` 在 `completion()` 上的運作相同：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: neosantara-glm-flash
    litellm_params:
      model: neosantara/glm-4.7-flash
      api_key: os.environ/NEOSANTARA_API_KEY
      allowed_openai_params: ["tools", "tool_choice", "parallel_tool_calls", "reasoning_effort"]
```

### Proxy 上的支出追蹤 {#spend-tracking-on-the-proxy}

Neosantara 模型不在 LiteLLM 的模型成本對照表中，因此 proxy 為它們記錄的支出為 $0，金鑰或團隊預算永遠不會變動。若要追蹤支出，請在 `litellm_params` 中設定 `input_cost_per_token` 與 `output_cost_per_token`，如[自訂定價](../proxy/custom_pricing)所示。兩者皆以每 token 的美元計價，因此請將 Neosantara 每百萬 token 的價格除以 1,000,000。

## 注意事項 {#notes}

- 透過 LiteLLM 呼叫 Neosantara 時，請使用 `neosantara/` 模型前綴。
- 預設的認證環境變數為 `NEOSANTARA_API_KEY`。
- `NEOSANTARA_API_BASE` 可用來讓 LiteLLM 指向自訂的 Neosantara 相容基礎 URL。
- `max_completion_tokens` 會自動對應至 `max_tokens`。
- 在 `completion()` 與 proxy 上，`tools`、`tool_choice`、`parallel_tool_calls` 與 `reasoning_effort` 可能需要 `allowed_openai_params`，LiteLLM 才會將它們傳遞出去。
