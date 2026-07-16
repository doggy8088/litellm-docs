import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Inception {#inception}

## 總覽 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Inception 提供 Mercury 系列的 diffusion LLM（dLLMs）。此 API 與 OpenAI 相容。 |
| LiteLLM 上的提供者路由 | `inception/`（chat）、`text-completion-inception/`（fill-in-the-middle） |
| 提供者文件連結 | [Inception Platform Documentation ↗](https://docs.inceptionlabs.ai/) |
| 基底 URL | `https://api.inceptionlabs.ai/v1` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk)、[`/fim/completions`](#fill-in-the-middle-fim) |

<br />
<br />

## 可用模型 {#available-models}

| 模型 | 說明 | 上下文視窗 |
|-------|-------------|----------------|
| `inception/mercury-2` | 快速推理聊天模型；支援工具呼叫與結構化輸出 | 128,000 tokens |
| `text-completion-inception/mercury-edit-2` | 用於 fill-in-the-middle（FIM）自動完成的程式碼模型 | 32,000 tokens |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Inception Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Inception call
response = completion(
    model="inception/mercury-2",
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Inception Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

# Inception call with streaming
response = completion(
    model="inception/mercury-2",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 推理努力與推理摘要 {#reasoning-effort-and-reasoning-summary}

Mercury 提供一個 `reasoning_effort` 控制項，並具備 Inception 專屬的 `instant` 值，可用於近即時回應；同時也提供標準的 `low`、`medium` 與 `high`。設定 `reasoning_summary=True` 以接收模型在回應中的推理摘要。

```python showLineNumbers title="Inception Reasoning"
import os
from litellm import completion

os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key

response = completion(
    model="inception/mercury-2",
    messages=[{"role": "user", "content": "If a bat and ball cost $1.10 and the bat is $1 more than the ball, how much is the ball?"}],
    reasoning_effort="high",
    reasoning_summary=True,
)

print(response.choices[0].message.content)
print(response.reasoning_summary)  # {"content": "...", "status": "complete"}
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Inception Function Calling"
import os
from litellm import completion

os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key

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
    model="inception/mercury-2",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response)
```

### 中間填補（FIM） {#fill-in-the-middle-fim}

`mercury-edit-2` 透過 Inception 的 `/v1/fim/completions` 端點提供程式碼自動完成。搭配 `text_completion` 與 `text-completion-inception/` 路由使用，並傳入一個 `prompt`（前綴）以及可選的 `suffix`。

```python showLineNumbers title="Inception FIM"
import os
from litellm import text_completion

os.environ["INCEPTION_API_KEY"] = ""  # your Inception API key

response = text_completion(
    model="text-completion-inception/mercury-edit-2",
    prompt="def add(a, b):\n    return ",
    suffix="\n",
    max_tokens=64,
)

print(response.choices[0].text)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: mercury-2
    litellm_params:
      model: inception/mercury-2
      api_key: os.environ/INCEPTION_API_KEY
  - model_name: mercury-edit-2
    litellm_params:
      model: text-completion-inception/mercury-edit-2
      api_key: os.environ/INCEPTION_API_KEY
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

- `max_tokens`
- `max_completion_tokens`
- `temperature`
- `stop`
- `tools`
- `tool_choice`
- `stream`
- `stream_options`
- `response_format`

## Inception 專屬參數 {#inception-specific-parameters}

這些參數會轉送到 Inception chat API：

- `reasoning_effort` (`instant` | `low` | `medium` | `high`)
- `reasoning_summary`（bool）— 傳回模型推理摘要
- `reasoning_summary_wait`（bool）— 在傳回前等待摘要完成
- `diffusing`（bool）— 串流中間去噪步驟
- `realtime`（bool）— 針對最低延遲進行最佳化
