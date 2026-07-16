import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Meta 模型 API {#meta-model-api}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Meta 的 Model API 可存取 Meta 的 Muse Spark 系列推理模型。 |
| LiteLLM 上的提供者路由 | `meta/` |
| 支援的端點 | `/chat/completions`, `/responses`, `/v1/messages` |
| API 參考 | [Meta Model API 參考 ↗](https://dev.meta.ai/docs) |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["META_API_KEY"] = ""  # your Meta Model API key
```

請求預設會送至 `https://api.meta.ai/v1`。設定 `META_API_BASE` 以覆寫 API 基底位址。

## 支援的模型 {#supported-models}

:::info
我們會持續維護模型、價格、token 視窗等清單。[請見此處](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。
:::

| 模型 ID | 輸入上下文長度 | 輸入多模態 | 輸出多模態 |
| --- | --- | --- | --- |
| `muse-spark-1.1` | 1M | 文字、圖片、影片、PDF | 文字 |

`muse-spark-1.1` 支援 function calling、parallel function calling、structured outputs、prompt caching、web search grounding，以及透過 `reasoning_effort`（`"minimal"` 到 `"xhigh"`）進行 reasoning。

此 API 也原生公開 Anthropic Messages 格式，因此 LiteLLM 會將 `/v1/messages` 請求未經翻譯地轉送至 `https://api.meta.ai/v1/messages`，並保留 Anthropic 專屬功能，例如 thinking blocks。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Meta Model API Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(model="meta/muse-spark-1.1", messages=messages)
```

### 串流 {#streaming}

```python showLineNumbers title="Meta Model API Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 推理努力程度 {#reasoning-effort}

`muse-spark-1.1` 接受 `reasoning_effort` 值 `"minimal"`、`"low"`、`"medium"`、`"high"`，以及 `"xhigh"`。

```python showLineNumbers title="Meta Model API Reasoning Effort"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "What is 15% of 2840?", "role": "user"}]

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    reasoning_effort="xhigh"
)

print(response.choices[0].message.content)
print(response.usage.completion_tokens_details.reasoning_tokens)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Meta Model API Function Calling"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "What's the weather like in San Francisco?", "role": "user"}]

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

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response.choices[0].message.tool_calls)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請將以下內容加入您的 LiteLLM Proxy 設定文件：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: muse-spark-1.1
    litellm_params:
      model: meta/muse-spark-1.1
      api_key: os.environ/META_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Meta Model API via Proxy - Non-streaming"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

response = client.chat.completions.create(
    model="muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    reasoning_effort="minimal"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Meta Model API via Proxy - Streaming"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

response = client.chat.completions.create(
    model="muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Meta Model API via Proxy - LiteLLM SDK"
import litellm

response = litellm.completion(
    model="litellm_proxy/muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Meta Model API via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "muse-spark-1.1",
    "messages": [{"role": "user", "content": "Write a short poem about AI."}],
    "reasoning_effort": "minimal"
  }'
```

</TabItem>
</Tabs>

### Anthropic 訊息 API {#anthropic-messages-api}

Proxy 的 `/v1/messages` 路由會將 `meta/` 模型的請求轉送至 Meta 原生相容 Anthropic 的端點，且不經翻譯。

```bash showLineNumbers title="Meta Model API via Proxy - /v1/messages"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "muse-spark-1.1",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": "Write a short poem about AI."}]
  }'
```
