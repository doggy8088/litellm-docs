import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Hyperbolic {#hyperbolic}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Hyperbolic 讓您以傳統雲端成本的一小部分，存取最新模型，並提供相容 OpenAI 的 LLM、圖像生成等 API。 |
| LiteLLM 提供者路由 | `hyperbolic/` |
| 提供者文件連結 | [Hyperbolic 文件 ↗](https://docs.hyperbolic.xyz) |
| Base URL | `https://api.hyperbolic.xyz/v1` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

https://docs.hyperbolic.xyz

**我們支援所有 Hyperbolic 模型；在送出 completion 請求時，只要將 `hyperbolic/` 設為前綴即可**

## 可用模型 {#available-models}

### 語言模型 {#language-models}

| 模型 | 說明 | 上下文視窗 | Pricing per 1M tokens |
|-------|-------------|----------------|----------------------|
| `hyperbolic/deepseek-ai/DeepSeek-V3` | DeepSeek V3 - 快速且高效率 | 131,072 tokens | $0.25 |
| `hyperbolic/deepseek-ai/DeepSeek-V3-0324` | DeepSeek V3 2024 年 3 月版本 | 131,072 tokens | $0.25 |
| `hyperbolic/deepseek-ai/DeepSeek-R1` | DeepSeek R1 - 推理模型 | 131,072 tokens | $2.00 |
| `hyperbolic/deepseek-ai/DeepSeek-R1-0528` | DeepSeek R1 2028 年 5 月版本 | 131,072 tokens | $0.25 |
| `hyperbolic/Qwen/Qwen2.5-72B-Instruct` | Qwen 2.5 72B Instruct | 131,072 tokens | $0.40 |
| `hyperbolic/Qwen/Qwen2.5-Coder-32B-Instruct` | 用於程式碼生成的 Qwen 2.5 Coder 32B | 131,072 tokens | $0.20 |
| `hyperbolic/Qwen/Qwen3-235B-A22B` | Qwen 3 235B A22B 變體 | 131,072 tokens | $2.00 |
| `hyperbolic/Qwen/QwQ-32B` | Qwen QwQ 32B | 131,072 tokens | $0.20 |
| `hyperbolic/meta-llama/Llama-3.3-70B-Instruct` | Llama 3.3 70B Instruct | 131,072 tokens | $0.80 |
| `hyperbolic/meta-llama/Meta-Llama-3.1-405B-Instruct` | Llama 3.1 405B Instruct | 131,072 tokens | $5.00 |
| `hyperbolic/moonshotai/Kimi-K2-Instruct` | Kimi K2 Instruct | 131,072 tokens | $2.00 |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["HYPERBOLIC_API_KEY"] = ""  # your Hyperbolic API key
```

從 [Hyperbolic 儀表板](https://app.hyperbolic.ai) 取得您的 API 金鑰。

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Hyperbolic Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["HYPERBOLIC_API_KEY"] = ""  # your Hyperbolic API key

messages = [{"content": "What is the capital of France?", "role": "user"}]

# Hyperbolic call
response = completion(
    model="hyperbolic/Qwen/Qwen2.5-72B-Instruct", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Hyperbolic Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["HYPERBOLIC_API_KEY"] = ""  # your Hyperbolic API key

messages = [{"content": "Write a short poem about AI", "role": "user"}]

# Hyperbolic call with streaming
response = completion(
    model="hyperbolic/deepseek-ai/DeepSeek-V3", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Hyperbolic Function Calling"
import os
import litellm
from litellm import completion

os.environ["HYPERBOLIC_API_KEY"] = ""  # your Hyperbolic API key

tools = [
    {
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
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"]
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = completion(
    model="hyperbolic/deepseek-ai/DeepSeek-V3",
    messages=[{"role": "user", "content": "What's the weather like in New York?"}],
    tools=tools,
    tool_choice="auto"
)

print(response)
```

## 用法 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: deepseek-fast
    litellm_params:
      model: hyperbolic/deepseek-ai/DeepSeek-V3
      api_key: os.environ/HYPERBOLIC_API_KEY

  - model_name: qwen-coder
    litellm_params:
      model: hyperbolic/Qwen/Qwen2.5-Coder-32B-Instruct
      api_key: os.environ/HYPERBOLIC_API_KEY

  - model_name: deepseek-reasoning
    litellm_params:
      model: hyperbolic/deepseek-ai/DeepSeek-R1
      api_key: os.environ/HYPERBOLIC_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Hyperbolic via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="deepseek-fast",
    messages=[{"role": "user", "content": "Explain quantum computing in simple terms"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Hyperbolic via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="qwen-coder",
    messages=[{"role": "user", "content": "Write a Python function to sort a list"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Hyperbolic via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/deepseek-fast",
    messages=[{"role": "user", "content": "What are the benefits of renewable energy?"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Hyperbolic via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/qwen-coder",
    messages=[{"role": "user", "content": "Implement a binary search algorithm"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key",
    stream=True
)

for chunk in response:
    if hasattr(chunk.choices[0], 'delta') and chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Hyperbolic via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "deepseek-fast",
    "messages": [{"role": "user", "content": "What is machine learning?"}]
  }'
```

```bash showLineNumbers title="Hyperbolic via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "qwen-coder",
    "messages": [{"role": "user", "content": "Write a REST API in Python"}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需更詳細的 LiteLLM Proxy 使用資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Hyperbolic 支援以下與 OpenAI 相容的參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `messages` | array | **必要**。包含 'role' 和 'content' 的訊息物件陣列 |
| `model` | string | **必要**。模型 ID（例如 deepseek-ai/DeepSeek-V3、Qwen/Qwen2.5-72B-Instruct） |
| `stream` | boolean | 選用。啟用串流回應 |
| `temperature` | float | 選用。採樣溫度（0.0 到 2.0） |
| `top_p` | float | 選用。核採樣參數 |
| `max_tokens` | integer | 選用。要生成的最大 token 數 |
| `frequency_penalty` | float | 選用。對高頻 token 進行懲罰 |
| `presence_penalty` | float | 選用。根據存在與否對 token 進行懲罰 |
| `stop` | string/array | 選用。停止序列 |
| `n` | integer | 選用。要生成的 completion 數量 |
| `tools` | array | 選用。可用工具/函式清單 |
| `tool_choice` | string/object | 選用。控制工具/函式呼叫 |
| `response_format` | object | 選用。回應格式規格 |
| `seed` | integer | 選用。用於重現性的隨機種子 |
| `user` | string | 選用。使用者識別碼 |

## 進階用法 {#advanced-usage}

### 自訂 API Base {#custom-api-base}

如果您使用的是自訂 Hyperbolic 部署：

```python showLineNumbers title="Custom API Base"
import litellm

response = litellm.completion(
    model="hyperbolic/deepseek-ai/DeepSeek-V3",
    messages=[{"role": "user", "content": "Hello"}],
    api_base="https://your-custom-hyperbolic-endpoint.com/v1",
    api_key="your-api-key"
)
```

### 速率限制 {#rate-limits}

Hyperbolic 提供不同方案：
- **Basic**：每分鐘 60 次請求（RPM）
- **Pro**：600 RPM
- **Enterprise**：自訂限制

## 定價 {#pricing}

Hyperbolic 提供具競爭力的按用量付費定價，沒有隱藏費用或長期承諾。每百萬 token 的具體價格請參閱上方模型表。

### 精度選項 {#precision-options}
- **BF16**：最佳精度與效能，適合對準確性要求嚴格的任務
- **FP8**：針對效率與速度最佳化，適合在較低成本下追求高吞吐量的應用

## 其他資源 {#additional-resources}

- [Hyperbolic 官方文件](https://docs.hyperbolic.xyz)
- [Hyperbolic 儀表板](https://app.hyperbolic.ai)
- [API 參考](https://docs.hyperbolic.xyz/docs/rest-api)
