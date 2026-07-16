import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Crusoe {#crusoe}

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Crusoe Cloud 為開源大型語言模型提供 GPU 加速推論，並針對效能與成本效率進行最佳化。 |
| LiteLLM 提供者路由 | `crusoe/` |
| 提供者文件連結 | [Crusoe Managed Inference 文件 ↗](https://docs.crusoecloud.com/managed-inference/overview/index.html) |
| Base URL | `https://managed-inference-api-proxy.crusoecloud.com/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

**我們支援所有 Crusoe 模型，只要在送出 completion 請求時將 `crusoe/` 設為前綴**

## 可用模型 {#available-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `crusoe/deepseek-ai/DeepSeek-R1-0528` | DeepSeek R1 推理模型（2025 年 5 月） | 163,840 tokens |
| `crusoe/deepseek-ai/DeepSeek-V3-0324` | DeepSeek V3 聊天模型（2025 年 3 月） | 163,840 tokens |
| `crusoe/google/gemma-3-12b-it` | Google Gemma 3 12B 指令微調 | 131,072 tokens |
| `crusoe/meta-llama/Llama-3.3-70B-Instruct` | Llama 3.3 70B 指令微調 | 131,072 tokens |
| `crusoe/moonshotai/Kimi-K2-Thinking` | Kimi K2 延伸思考模型 | 262,144 tokens |
| `crusoe/openai/gpt-oss-120b` | OpenAI 120B 開源模型 | 131,072 tokens |
| `crusoe/Qwen/Qwen3-235B-A22B-Instruct-2507` | Qwen3 235B MoE 指令微調 | 262,144 tokens |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key
```

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Crusoe Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Crusoe call
response = completion(
    model="crusoe/meta-llama/Llama-3.3-70B-Instruct",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Crusoe Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# Crusoe call with streaming
response = completion(
    model="crusoe/meta-llama/Llama-3.3-70B-Instruct",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Crusoe Function Calling"
import os
import litellm
from litellm import completion

os.environ["CRUSOE_API_KEY"] = ""  # your Crusoe API key

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

response = completion(
    model="crusoe/meta-llama/Llama-3.3-70B-Instruct",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: llama-3.3-70b
    litellm_params:
      model: crusoe/meta-llama/Llama-3.3-70B-Instruct
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: deepseek-r1
    litellm_params:
      model: crusoe/deepseek-ai/DeepSeek-R1-0528
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: deepseek-v3
    litellm_params:
      model: crusoe/deepseek-ai/DeepSeek-V3-0324
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: qwen3-235b
    litellm_params:
      model: crusoe/Qwen/Qwen3-235B-A22B-Instruct-2507
      api_key: os.environ/CRUSOE_API_KEY
  - model_name: kimi-k2
    litellm_params:
      model: crusoe/moonshotai/Kimi-K2-Thinking
      api_key: os.environ/CRUSOE_API_KEY
```

## 自訂 API Base {#custom-api-base}

**選項 1：環境變數**

```python showLineNumbers title="Custom API Base via env var"
import os
from litellm import completion

os.environ["CRUSOE_API_BASE"] = "https://custom.crusoecloud.com/v1"
os.environ["CRUSOE_API_KEY"] = ""  # your API key

response = completion(
    model="crusoe/meta-llama/Llama-3.3-70B-Instruct",
    messages=[{"content": "Hello!", "role": "user"}],
)
```

**選項 2：直接傳入**

```python showLineNumbers title="Custom API Base via parameter"
from litellm import completion

response = completion(
    model="crusoe/meta-llama/Llama-3.3-70B-Instruct",
    messages=[{"content": "Hello!", "role": "user"}],
    api_base="https://custom.crusoecloud.com/v1",
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
- `tools`
- `tool_choice`
- `response_format`
- `seed`
- `user`
- `logit_bias`
- `logprobs`
- `top_logprobs`
