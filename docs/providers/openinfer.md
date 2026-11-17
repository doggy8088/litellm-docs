---
title: "搭配 LiteLLM 的 OpenInfer API：Python SDK 與 Gateway"
sidebar_label: "OpenInfer"
description: "呼叫 GLM-5.3-Flash、Qwen3.5 27B 等 OpenInfer Cloud 模型，支援串流、原生 Responses 與 Anthropic Messages 端點，以及花費追蹤。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenInfer {#openinfer}

<SinceVersion v="1.107.0" />

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | OpenInfer Cloud 是託管的 OpenAI 相容推論 API。 |
| LiteLLM 上的提供者路由 | `openinfer/` |
| 提供者文件連結 | [OpenInfer ↗](https://openinfer.ai/) |
| 基礎 URL | `https://api.openinfer.ai/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#responses-api), [`/messages`](#anthropic-messages-api) |

<br />
<br />

https://openinfer.ai/

**我們支援所有 OpenInfer 聊天模型，傳送 completion 請求時只需將 `openinfer/` 設為前綴**

OpenInfer 聊天模型 ID 使用 `@oi/` 前綴。LiteLLM 型錄的鍵為 `openinfer/@oi/...`，因此 `@oi/` 前綴會被轉送至 API。

## 可用模型 {#available-models}

| 模型 | 內容視窗 |
|-------|----------------|
| `openinfer/@oi/GLM-5.3-Flash` | 393,216 |
| `openinfer/@oi/Qwen3.5-27B` | 32,768 |
| `openinfer/@oi/Qwen3.5-9B` | 100,000 |

這些是 OpenInfer 有公布價格的模型，因此 LiteLLM 會追蹤它們的花費。OpenInfer 對請求的限制僅有內容視窗，因此提示與輸出 token 的總和必須能放入其中。

任何其他 OpenInfer 聊天模型也可以搭配 `openinfer/` 前綴使用，但在加入價格之前，LiteLLM 會將其花費記錄為 $0。LiteLLM 會將工具呼叫傳送給每個 OpenInfer 模型；對於它提供但不支援工具的模型（例如 `@oi/Gemma-4-31B-It`），OpenInfer 會回應 400。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["OPENINFER_API_KEY"] = ""  # your OpenInfer API key
```

從 [OpenInfer 主控台](https://console.openinfer.ai/register) 取得 API 金鑰。

您可以用以下方式覆寫基礎 URL：

```
os.environ["OPENINFER_API_BASE"] = "https://api.openinfer.ai/v1"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="OpenInfer Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["OPENINFER_API_KEY"] = ""  # your OpenInfer API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# OpenInfer call
response = completion(
    model="openinfer/@oi/Qwen3.5-27B",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="OpenInfer Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["OPENINFER_API_KEY"] = ""  # your OpenInfer API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# OpenInfer call with streaming
response = completion(
    model="openinfer/@oi/Qwen3.5-27B",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### Responses API {#responses-api}

LiteLLM 會將 `/responses` 呼叫傳送至 OpenInfer 自己的 `/v1/responses` 端點。

```python showLineNumbers title="OpenInfer Responses API"
import os
import litellm

os.environ["OPENINFER_API_KEY"] = ""  # your OpenInfer API key

response = litellm.responses(
    model="openinfer/@oi/Qwen3.5-27B",
    input="Name three primary colors"
)

print(response.output[0].content[0].text)
```

### Anthropic Messages API {#anthropic-messages-api}

LiteLLM 會將 `/messages` 呼叫傳送至 OpenInfer 自己的 `/v1/messages` 端點。

```python showLineNumbers title="OpenInfer Messages API"
import asyncio
import os
import litellm

os.environ["OPENINFER_API_KEY"] = ""  # your OpenInfer API key

async def main():
    response = await litellm.anthropic.messages.acreate(
        model="openinfer/@oi/Qwen3.5-27B",
        messages=[{"role": "user", "content": "Name three primary colors"}],
        max_tokens=200
    )
    print(response["content"])

asyncio.run(main())
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: oi-qwen
    litellm_params:
      model: openinfer/@oi/Qwen3.5-27B
      api_key: os.environ/OPENINFER_API_KEY

  - model_name: oi-glm
    litellm_params:
      model: openinfer/@oi/GLM-5.3-Flash
      api_key: os.environ/OPENINFER_API_KEY
      api_base: os.environ/OPENINFER_API_BASE  # optional
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
export LITELLM_MASTER_KEY="sk-$(openssl rand -hex 32)"
printf 'Local proxy key: %s\n' "$LITELLM_MASTER_KEY"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

在另一個終端機中，將 `LITELLM_API_KEY` 設為上方印出的金鑰，然後呼叫 proxy：

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="OpenInfer via Proxy - Non-streaming"
import os
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",       # Your proxy URL
    api_key=os.environ["LITELLM_API_KEY"]   # The proxy key printed at startup
)

# Non-streaming response
response = client.chat.completions.create(
    model="oi-qwen",
    messages=[{"role": "user", "content": "hello from litellm"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="OpenInfer via Proxy - Streaming"
import os
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",       # Your proxy URL
    api_key=os.environ["LITELLM_API_KEY"]   # The proxy key printed at startup
)

# Streaming response
response = client.chat.completions.create(
    model="oi-glm",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="OpenInfer via Proxy - LiteLLM SDK"
import os
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/oi-qwen",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key=os.environ["LITELLM_API_KEY"]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="OpenInfer via Proxy - LiteLLM SDK Streaming"
import os
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/oi-glm",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key=os.environ["LITELLM_API_KEY"],
    stream=True
)

for chunk in response:
    if hasattr(chunk.choices[0], 'delta') and chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="OpenInfer via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "oi-qwen",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="OpenInfer via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "oi-glm",
    "messages": [{"role": "user", "content": "hello from litellm"}],
    "stream": true
  }'
```

```bash showLineNumbers title="OpenInfer via Proxy - cURL Responses API"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "oi-qwen",
    "input": "hello from litellm"
  }'
```

```bash showLineNumbers title="OpenInfer via Proxy - cURL Messages API"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "oi-qwen",
    "max_tokens": 200,
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。
