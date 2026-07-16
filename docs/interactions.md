import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /interactions {#interactions}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 記錄 | ✅ | 可跨所有整合運作 |
| 串流 | ✅ | |
| 負載平衡 | ✅ | 介於受支援的模型之間 |
| 支援的 LLM 提供者 | **所有 LiteLLM 支援的 CHAT COMPLETION 提供者** | `openai`, `anthropic`, `bedrock`, `vertex_ai`, `gemini`, `azure`, `azure_ai` 等。 |

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}

### 快速開始 {#quick-start}

```python showLineNumbers title="Create Interaction"
from litellm import create_interaction
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = create_interaction(
    model="gemini/gemini-2.5-flash",
    input="Tell me a short joke about programming."
)

print(response.outputs[-1].text)
```

### 非同步使用方式 {#async-usage}

```python showLineNumbers title="Async Create Interaction"
from litellm import acreate_interaction
import os
import asyncio

os.environ["GEMINI_API_KEY"] = "your-api-key"

async def main():
    response = await acreate_interaction(
        model="gemini/gemini-2.5-flash",
        input="Tell me a short joke about programming."
    )
    print(response.outputs[-1].text)

asyncio.run(main())
```

### 串流 {#streaming}

```python showLineNumbers title="Streaming Interaction"
from litellm import create_interaction
import os

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = create_interaction(
    model="gemini/gemini-2.5-flash",
    input="Write a 3 paragraph story about a robot.",
    stream=True
)

for chunk in response:
    print(chunk)
```

## **LiteLLM AI Gateway（Proxy）使用方式** {#litellm-ai-gateway-proxy-usage}

### 設定 {#setup}

將以下內容加入您的 litellm proxy config.yaml：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-flash
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GEMINI_API_KEY
```

啟動 litellm：

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 測試請求 {#test-request}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Create Interaction"
curl -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini/gemini-2.5-flash",
    "input": "Tell me a short joke about programming."
  }'
```

**串流：**

```bash showLineNumbers title="Streaming Interaction"
curl -N -X POST "http://localhost:4000/v1beta/interactions" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini/gemini-2.5-flash",
    "input": "Write a 3 paragraph story about a robot.",
    "stream": true
  }'
```

**取得互動：**

```bash showLineNumbers title="Get Interaction by ID"
curl "http://localhost:4000/v1beta/interactions/{interaction_id}" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>

<TabItem value="google-sdk" label="Google GenAI SDK">

將 Google GenAI SDK 指向 LiteLLM Proxy：

```python showLineNumbers title="Google GenAI SDK with LiteLLM Proxy"
from google import genai

# Point SDK to LiteLLM Proxy
client = genai.Client(
    api_key="sk-1234",  # Your LiteLLM API key
    http_options={"base_url": "http://localhost:4000"},
)

# Create an interaction
interaction = client.interactions.create(
    model="gemini/gemini-2.5-flash",
    input="Tell me a short joke about programming."
)

print(interaction.outputs[-1].text)
```

**串流：**

```python showLineNumbers title="Google GenAI SDK Streaming"
from google import genai

client = genai.Client(
    api_key="sk-1234",  # Your LiteLLM API key
    http_options={"base_url": "http://localhost:4000"},
)

for chunk in client.interactions.create_stream(
    model="gemini/gemini-2.5-flash",
    input="Write a story about space exploration.",
):
    print(chunk)
```

</TabItem>
</Tabs>

## **請求/回應格式** {#requestresponse-format}

### 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | Yes | 要使用的模型（例如：`gemini/gemini-2.5-flash`） |
| `input` | string | Yes | 互動的輸入文字 |
| `stream` | boolean | No | 啟用串流回應 |
| `tools` | array | No | 模型可用的工具 |
| `system_instruction` | string | No | 模型的系統指示 |
| `generation_config` | object | No | 生成設定 |
| `previous_interaction_id` | string | No | 前一個互動的 ID，用於內容脈絡 |

### 回應格式 {#response-format}

```json
{
  "id": "interaction_abc123",
  "object": "interaction",
  "model": "gemini-2.5-flash",
  "status": "completed",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-01-15T10:30:05Z",
  "role": "model",
  "outputs": [
    {
      "type": "text",
      "text": "Why do programmers prefer dark mode? Because light attracts bugs!"
    }
  ],
  "usage": {
    "total_input_tokens": 10,
    "total_output_tokens": 15,
    "total_tokens": 25
  }
}
```

## **呼叫非 Interactions API 端點（`/interactions` 到 `/responses` 橋接）** {#calling-non-interactions-api-endpoints-interactions-to-responses-bridge}

LiteLLM 讓您可以透過連到 LiteLLM 的 `/responses` 端點的橋接，呼叫非 Interactions API 模型。這對於呼叫 OpenAI、Anthropic，以及其他原生不支援 Interactions API 的提供者很有用。

#### Python SDK 使用方式 {#python-sdk-usage}

```python showLineNumbers title="SDK Usage"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# Non-streaming interaction
response = litellm.interactions.create(
    model="gpt-4o",
    input="Tell me a short joke about programming."
)

print(response.outputs[-1].text)
```

#### LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

**設定組態：**

```yaml showLineNumbers title="Example Configuration"
model_list:
- model_name: openai-model
  litellm_params:
    model: gpt-4o
    api_key: os.environ/OPENAI_API_KEY
```

**啟動 Proxy：**

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**發送請求：**

```bash showLineNumbers title="non-Interactions API Model Request"
curl http://localhost:4000/v1beta/interactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "openai-model",
    "input": "Tell me a short joke about programming."
  }'
```

## **支援的提供者** {#supported-providers}

| 提供者 | 使用方式連結 |
|----------|---------------|
| Google AI Studio | [使用方式](#quick-start) |
| 其他所有 LiteLLM 提供者 | [橋接使用方式](#calling-non-interactions-api-endpoints-interactions-to-responses-bridge) |
