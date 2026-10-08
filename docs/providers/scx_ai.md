import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SCX.ai {#scxai}

## 總覽 {#overview}

| Property | Details |
|-------|-------|
| Description | SCX.ai 是一個澳洲主權 AI 平台，透過 OpenAI 相容的 API 提供開放模型，並部署於使用再生能源供電的基礎架構上。 |
| Provider Route on LiteLLM | `scx-ai/` |
| Link to Provider Doc | [SCX.ai 文件 ↗](https://scx.ai) |
| Base URL | `https://api.scx.ai/v1` |
| Supported Operations | [`/chat/completions`](#usage---litellm-python-sdk) |

<br />
<br />

**我們支援所有 SCX.ai 聊天模型；在傳送 completion 請求時，只要將 `scx-ai/` 設為前綴即可**

## 可用模型 {#available-models}

| Model | Description | Context Window | Max Output |
|-------|-------------|----------------|------------|
| `scx-ai/GLM-5.2` | Z.ai GLM-5.2，適用於長期代理程式編碼的 753B 稀疏 MoE | 1,048,576 tokens | 131,072 tokens |
| `scx-ai/Qwen3.8-Max` | Alibaba Qwen3.8 Max，支援文字與圖片輸入的 2.4T 稀疏 MoE | 1,000,000 tokens | 131,072 tokens |

兩個模型都支援推理、函式呼叫、JSON 模式與 JSON schema 輸出。`scx-ai/Qwen3.8-Max` 另外也接受圖片輸入。Prompt 快取會自動套用於兩者，且快取命中會回報於 `usage.prompt_tokens_details.cached_tokens`，並以快取輸入費率計費。

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="SCX.ai Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# SCX.ai call
response = completion(
    model="scx-ai/GLM-5.2",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="SCX.ai Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# SCX.ai call with streaming
response = completion(
    model="scx-ai/GLM-5.2",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="SCX.ai Function Calling"
import os
import litellm
from litellm import completion

os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key

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
                    "description": "The city, e.g. Sydney"
                }
            },
            "required": ["city"]
        }
    }
}]

messages = [{"role": "user", "content": "What's the weather in Sydney?"}]

response = completion(
    model="scx-ai/GLM-5.2",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

### 結構化輸出 {#structured-output}

```python showLineNumbers title="SCX.ai JSON Schema Output"
import os
from litellm import completion

os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key

response = completion(
    model="scx-ai/GLM-5.2",
    messages=[{"role": "user", "content": "The city is Sydney"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "city",
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

`scx-ai/Qwen3.8-Max` 支援圖片輸入。圖片每一邊至少必須為 10 像素。

```python showLineNumbers title="SCX.ai Image Input"
import os
from litellm import completion

os.environ["SCX_API_KEY"] = ""  # your SCX.ai API key

response = completion(
    model="scx-ai/Qwen3.8-Max",
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

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: glm-5.2
    litellm_params:
      model: scx-ai/GLM-5.2
      api_key: os.environ/SCX_API_KEY
  - model_name: qwen3.8-max
    litellm_params:
      model: scx-ai/Qwen3.8-Max
      api_key: os.environ/SCX_API_KEY
```

## 自訂 API Base {#custom-api-base}

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["SCX_API_BASE"] = "https://custom.scx.ai/v1"
os.environ["SCX_API_KEY"] = ""  # your API key

response = completion(
    model="scx-ai/GLM-5.2",
    messages=[{"content": "Hello!", "role": "user"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="scx-ai/GLM-5.2",
    messages=[{"content": "Hello!", "role": "user"}],
    api_base="https://custom.scx.ai/v1",
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
- `logit_bias`
- `logprobs`
- `top_logprobs`

`max_completion_tokens` 會以上游形式傳送為 `max_tokens`。SCX.ai 接受介於 `[0.0, 2.0)` 範圍內的 `temperature`，並拒絕 `2.0` 本身，因此 LiteLLM 會將任何更高的值限制為 `1.99`。
