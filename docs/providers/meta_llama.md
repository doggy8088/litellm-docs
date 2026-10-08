import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Meta Llama {#meta-llama}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Meta 的 Llama API 提供對 Meta 大型語言模型系列的存取。 |
| LiteLLM 上的提供者路由 | `meta_llama/` |
| 支援的端點 | `/chat/completions`, `/completions`, `/responses` |
| API 參考 | [Llama API 參考 ↗](https://llama.developer.meta.com?utm_source=partner-litellm&utm_medium=website) |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["LLAMA_API_KEY"] = ""  # your Meta Llama API key
```

## 支援的模型 {#supported-models}

:::info
此處列出的所有模型 https://llama.developer.meta.com/docs/models/ 都受支援。我們積極維護模型清單、token 視窗等資訊。[在這裡](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。

:::

| 模型 ID | 輸入上下文長度 | 輸出上下文長度 | 輸入模態 | 輸出模態 |
| --- | --- | --- | --- | --- |
| `Llama-4-Scout-17B-16E-Instruct-FP8` | 128k | 4028 | 文字、圖片 | 文字 |
| `Llama-4-Maverick-17B-128E-Instruct-FP8` | 128k | 4028 | 文字、圖片 | 文字 |
| `Llama-3.3-70B-Instruct` | 128k | 4028 | 文字 | 文字 |
| `Llama-3.3-8B-Instruct` | 128k | 4028 | 文字 | 文字 |

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Meta Llama Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LLAMA_API_KEY"] = ""  # your Meta Llama API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Meta Llama call
response = completion(model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8", messages=messages)
```

### 串流 {#streaming}

```python showLineNumbers title="Meta Llama Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["LLAMA_API_KEY"] = ""  # your Meta Llama API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Meta Llama call with streaming
response = completion(
    model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Meta Llama Function Calling"
import os
import litellm
from litellm import completion

os.environ["LLAMA_API_KEY"] = ""  # your Meta Llama API key

messages = [{"content": "What's the weather like in San Francisco?", "role": "user"}]

# Define the function
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
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

# Meta Llama call with function calling
response = completion(
    model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response.choices[0].message.tool_calls)
```

### 工具使用 {#tool-use}

```python showLineNumbers title="Meta Llama Tool Use"
import os
import litellm
from litellm import completion

os.environ["LLAMA_API_KEY"] = ""  # your Meta Llama API key

messages = [{"content": "Create a chart showing the population growth of New York City from 2010 to 2020", "role": "user"}]

# Define the tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "create_chart",
            "description": "Create a chart with the provided data",
            "parameters": {
                "type": "object",
                "properties": {
                    "chart_type": {
                        "type": "string",
                        "enum": ["bar", "line", "pie", "scatter"],
                        "description": "The type of chart to create"
                    },
                    "title": {
                        "type": "string",
                        "description": "The title of the chart"
                    },
                    "data": {
                        "type": "object",
                        "description": "The data to plot in the chart"
                    }
                },
                "required": ["chart_type", "title", "data"]
            }
        }
    }
]

# Meta Llama call with tool use
response = completion(
    model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response.choices[0].message.content)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請將下列內容新增至您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: meta_llama/Llama-3.3-70B-Instruct
    litellm_params:
      model: meta_llama/Llama-3.3-70B-Instruct
      api_key: os.environ/LLAMA_API_KEY

  - model_name: meta_llama/Llama-3.3-8B-Instruct
    litellm_params:
      model: meta_llama/Llama-3.3-8B-Instruct
      api_key: os.environ/LLAMA_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Meta Llama via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=[{"role": "user", "content": "Write a short poem about AI."}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Meta Llama via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="meta_llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Meta Llama via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/meta_llama/Llama-3.3-70B-Instruct",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Meta Llama via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/meta_llama/Llama-3.3-70B-Instruct",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
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

```bash showLineNumbers title="Meta Llama via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "meta_llama/Llama-3.3-70B-Instruct",
    "messages": [{"role": "user", "content": "Write a short poem about AI."}]
  }'
```

```bash showLineNumbers title="Meta Llama via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "meta_llama/Llama-3.3-70B-Instruct",
    "messages": [{"role": "user", "content": "Write a short poem about AI."}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需關於使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。
