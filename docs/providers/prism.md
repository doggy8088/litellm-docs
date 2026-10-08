import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Prism {#prism}

## 概覽 {#overview}

| Property | Details |
|-------|-------|
| Description | Prism Inference 透過 OpenAI Chat Completions、OpenAI Responses 與 Anthropic Messages APIs 提供開放權重模型，輸入與輸出皆零資料保留。 |
| Provider Route on LiteLLM | `prism/` |
| Link to Provider Doc | [Prism 文件 ↗](https://docs.prisminference.com) |
| Base URL | `https://api.prisminference.com/v1` |
| Supported Operations | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#responses-api), [`/messages`](#anthropic-messages-api) |

<br />
<br />

**我們支援所有 Prism 模型，傳送請求時只要將 `prism/` 設為前綴即可**

## 可用模型 {#available-models}

| Model | Description | Context Window | Max Output |
|-------|-------------|----------------|------------|
| `prism/deepseek-v4.1-flash` | DeepSeek-V4.1-Flash，現行一代，適用於程式設計、視覺、推理與工具使用迴圈；可接受文字與圖片輸入 | 1,000,000 tokens | 384,000 tokens |
| `prism/deepseek-v4-flash` | DeepSeek-V4-Flash，純文字模型，適合快速程式設計與工具迴圈 | 1,000,000 tokens | 384,000 tokens |

這兩個模型都支援推理、函式呼叫、JSON 模式與 JSON schema 輸出，LiteLLM 也會隨附其定價（輸入、輸出與快取輸入），因此開箱即可追蹤支出。Prism 在 `GET https://api.prisminference.com/v1/models` 的型錄列出更多模型（例如 `glm-5.3` 與 `kimi-k3`）；任何一個都可搭配 `prism/` 前綴使用，但若要追蹤那些模型的支出，您需要傳入 `input_cost_per_token` 與 `output_cost_per_token` 到 `litellm_params`，直到它們被加入 LiteLLM 的模型成本對照表。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["PRISM_API_KEY"] = ""  # your Prism API key
```

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Prism Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Prism call
response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Prism Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# Prism call with streaming
response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Prism Function Calling"
import os
import litellm
from litellm import completion

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The city, e.g. San Francisco"
                }
            },
            "required": ["city"]
        }
    }
}]

messages = [{"role": "user", "content": "What's the weather in San Francisco?"}]

response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

### 結構化輸出 {#structured-output}

```python showLineNumbers title="Prism JSON Schema Output"
import os
from litellm import completion

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "The city is San Francisco"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "city",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
                "additionalProperties": False,
            },
        },
    },
)

print(response)
```

### 視覺 {#vision}

圖片輸入支援於 `prism/deepseek-v4.1-flash`。

```python showLineNumbers title="Prism Image Input"
import os
from litellm import completion

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What colour fills this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/image.png"}},
        ],
    }],
)

print(response)
```

### Responses API {#responses-api}

Prism 原生提供 OpenAI Responses API，因此 `litellm.responses` 會將請求直接送至 `https://api.prisminference.com/v1/responses`。

```python showLineNumbers title="Prism Responses API"
import os
import litellm

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

response = litellm.responses(
    model="prism/deepseek-v4.1-flash",
    input="Say hello",
)

print(response.output_text)
```

### Anthropic Messages API {#anthropic-messages-api}

Prism 也原生提供 Anthropic Messages API，因此 `litellm.anthropic.messages.acreate` 會將請求直接送至 `https://api.prisminference.com/v1/messages`。

```python showLineNumbers title="Prism Anthropic Messages API"
import asyncio
import os
import litellm

os.environ["PRISM_API_KEY"] = ""  # your Prism API key

async def main():
    response = await litellm.anthropic.messages.acreate(
        model="prism/deepseek-v4.1-flash",
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=64,
    )
    print(response["content"][0]["text"])

asyncio.run(main())
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: deepseek-v4.1-flash
    litellm_params:
      model: prism/deepseek-v4.1-flash
      api_key: os.environ/PRISM_API_KEY
  - model_name: deepseek-v4-flash
    litellm_params:
      model: prism/deepseek-v4-flash
      api_key: os.environ/PRISM_API_KEY
```

以這種方式設定的部署會在 proxy 上提供全部三個端點：`/v1/chat/completions`、`/v1/responses` 與 `/v1/messages`。

<Tabs>
<TabItem value="chat" label="Chat Completions">

```bash showLineNumbers title="curl"
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4.1-flash",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
<TabItem value="responses" label="Responses">

```bash showLineNumbers title="curl"
curl http://0.0.0.0:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4.1-flash",
    "input": "Hello, how are you?"
  }'
```

</TabItem>
<TabItem value="messages" label="Messages">

```bash showLineNumbers title="curl"
curl http://0.0.0.0:4000/v1/messages \
  -H "x-api-key: $LITELLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4.1-flash",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
</Tabs>

## 自訂 API Base {#custom-api-base}

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["PRISM_API_BASE"] = "https://custom.prisminference.example/v1"
os.environ["PRISM_API_KEY"] = ""  # your API key

response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=[{"content": "Hello!", "role": "user"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="prism/deepseek-v4.1-flash",
    messages=[{"content": "Hello!", "role": "user"}],
    api_base="https://custom.prisminference.example/v1",
    api_key="your-api-key",
)
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

- `temperature`
- `max_tokens`
- `max_completion_tokens`
- `top_p`
- `frequency_penalty`
- `presence_penalty`
- `stop`
- `n`
- `stream`
- `stream_options`
- `tools`
- `tool_choice`
- `response_format`
- `seed`
- `logprobs`
- `top_logprobs`
