import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Lambda AI {#lambda-ai}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Lambda AI 透過其雲端 GPU 基礎架構提供多種開源語言模型的存取，並針對大規模推論進行最佳化。 |
| LiteLLM 提供者路由 | `lambda_ai/` |
| 提供者文件連結 | [Lambda AI API 文件 ↗](https://docs.lambda.ai/api) |
| Base URL | `https://api.lambda.ai/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

https://docs.lambda.ai/api

**我們支援所有 Lambda AI 模型，只要在傳送 completion 請求時將 `lambda_ai/` 設為前綴即可**

## 可用模型 {#available-models}

Lambda AI 提供多樣化的先進開源模型選擇：

### 大型語言模型 {#large-language-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/llama3.3-70b-instruct-fp8` | Llama 3.3 70B，採用 FP8 量化 | 8,192 tokens |
| `lambda_ai/llama3.1-405b-instruct-fp8` | Llama 3.1 405B，採用 FP8 量化 | 8,192 tokens |
| `lambda_ai/llama3.1-70b-instruct-fp8` | Llama 3.1 70B，採用 FP8 量化 | 8,192 tokens |
| `lambda_ai/llama3.1-8b-instruct` | Llama 3.1 8B 指令微調 | 8,192 tokens |
| `lambda_ai/llama3.1-nemotron-70b-instruct-fp8` | Llama 3.1 Nemotron 70B | 8,192 tokens |

### DeepSeek 模型 {#deepseek-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/deepseek-llama3.3-70b` | DeepSeek Llama 3.3 70B | 8,192 tokens |
| `lambda_ai/deepseek-r1-0528` | DeepSeek R1 0528 | 8,192 tokens |
| `lambda_ai/deepseek-r1-671b` | DeepSeek R1 671B | 8,192 tokens |
| `lambda_ai/deepseek-v3-0324` | DeepSeek V3 0324 | 8,192 tokens |

### Hermes 模型 {#hermes-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/hermes3-405b` | Hermes 3 405B | 8,192 tokens |
| `lambda_ai/hermes3-70b` | Hermes 3 70B | 8,192 tokens |
| `lambda_ai/hermes3-8b` | Hermes 3 8B | 8,192 tokens |

### 程式碼模型 {#coding-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/qwen25-coder-32b-instruct` | Qwen 2.5 Coder 32B | 8,192 tokens |
| `lambda_ai/qwen3-32b-fp8` | Qwen 3 32B with FP8 | 8,192 tokens |

### 視覺模型 {#vision-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/llama3.2-11b-vision-instruct` | Llama 3.2 11B，具備視覺能力 | 8,192 tokens |

### 特殊化模型 {#specialized-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `lambda_ai/llama-4-maverick-17b-128e-instruct-fp8` | Llama 4 Maverick，具備 128k context | 131,072 tokens |
| `lambda_ai/llama-4-scout-17b-16e-instruct` | Llama 4 Scout，具備 16k context | 16,384 tokens |
| `lambda_ai/lfm-40b` | LFM 40B 模型 | 8,192 tokens |
| `lambda_ai/lfm-7b` | LFM 7B 模型 | 8,192 tokens |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["LAMBDA_API_KEY"] = ""  # your Lambda AI API key
```

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Lambda AI Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LAMBDA_API_KEY"] = ""  # your Lambda AI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Lambda AI call
response = completion(
    model="lambda_ai/llama3.1-8b-instruct", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Lambda AI Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LAMBDA_API_KEY"] = ""  # your Lambda AI API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# Lambda AI call with streaming
response = completion(
    model="lambda_ai/llama3.1-70b-instruct-fp8", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 視覺／多模態支援 {#visionmultimodal-support}

Llama 3.2 Vision 模型支援圖片輸入：

```python showLineNumbers title="Lambda AI Vision/Multimodal"
import os
import litellm
from litellm import completion

os.environ["LAMBDA_API_KEY"] = ""  # your Lambda AI API key

messages = [{
    "role": "user",
    "content": [
        {
            "type": "text",
            "text": "What's in this image?"
        },
        {
            "type": "image_url",
            "image_url": {
                "url": "https://example.com/image.jpg"
            }
        }
    ]
}]

# Lambda AI vision model call
response = completion(
    model="lambda_ai/llama3.2-11b-vision-instruct",
    messages=messages
)

print(response)
```

### 函式呼叫 {#function-calling}

Lambda AI 模型支援 function calling：

```python showLineNumbers title="Lambda AI Function Calling"
import os
import litellm
from litellm import completion

os.environ["LAMBDA_API_KEY"] = ""  # your Lambda AI API key

# Define tools
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA"
                }
            },
            "required": ["location"]
        }
    }
}]

messages = [{"role": "user", "content": "What's the weather in Boston?"}]

# Lambda AI call with function calling
response = completion(
    model="lambda_ai/hermes3-70b",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: llama-8b
    litellm_params:
      model: lambda_ai/llama3.1-8b-instruct
      api_key: os.environ/LAMBDA_API_KEY
  - model_name: deepseek-70b
    litellm_params:
      model: lambda_ai/deepseek-llama3.3-70b
      api_key: os.environ/LAMBDA_API_KEY
  - model_name: hermes-405b
    litellm_params:
      model: lambda_ai/hermes3-405b
      api_key: os.environ/LAMBDA_API_KEY
  - model_name: qwen-coder
    litellm_params:
      model: lambda_ai/qwen25-coder-32b-instruct
      api_key: os.environ/LAMBDA_API_KEY
```

## 自訂 API Base {#custom-api-base}

如果您需要使用自訂 API base URL：

```python showLineNumbers title="Custom API Base"
import os
import litellm
from litellm import completion

# Using environment variable
os.environ["LAMBDA_API_BASE"] = "https://custom.lambda-api.com/v1"
os.environ["LAMBDA_API_KEY"] = ""  # your API key

# Or pass directly
response = completion(
    model="lambda_ai/llama3.1-8b-instruct",
    messages=[{"content": "Hello!", "role": "user"}],
    api_base="https://custom.lambda-api.com/v1",
    api_key="your-api-key"
)
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

由於 Lambda AI 與 OpenAI 完全相容，因此支援所有標準 OpenAI 參數：

- `temperature`
- `max_tokens`
- `top_p`
- `frequency_penalty`
- `presence_penalty`
- `stop`
- `n`
- `stream`
- `tools`
- `tool_choice`
- `response_format`
- `seed`
- `user`
- `logit_bias`

含參數的範例：

```python showLineNumbers title="Lambda AI with Parameters"
response = completion(
    model="lambda_ai/hermes3-405b",
    messages=[{"content": "Explain quantum computing", "role": "user"}],
    temperature=0.7,
    max_tokens=500,
    top_p=0.9,
    frequency_penalty=0.2,
    presence_penalty=0.1
)
```
