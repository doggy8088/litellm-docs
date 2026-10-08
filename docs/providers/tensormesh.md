import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Tensormesh {#tensormesh}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Tensormesh 提供具備 OpenAI 相容 API 的無伺服器 AI 推論。 |
| LiteLLM 提供者路由 | `tensormesh/` |
| 提供者文件連結 | [Tensormesh 文件](https://docs.tensormesh.ai) |
| Default Base URL | `https://serverless.tensormesh.ai/v1` |
| 支援的操作 | `/chat/completions`、`/completions`、`/responses`、`/messages`，透過 LiteLLM 的 Anthropic Messages 適配器 |

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"
```

## 模型 {#models}

列出無伺服器型錄中的可用模型：

```bash showLineNumbers title="List Tensormesh Models"
curl https://serverless.tensormesh.ai/v1/models
```

使用型錄 id 與 `tensormesh/` 路由，例如 `tensormesh/openai/gpt-oss-120b`、`tensormesh/MiniMaxAI/MiniMax-M2.5` 或 `tensormesh/deepseek-ai/DeepSeek-V4-Flash`。

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completions}

```python showLineNumbers title="Tensormesh Chat Completion"
import os
from litellm import completion

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = completion(
    model="tensormesh/<your-model-name>",
    messages=[{"role": "user", "content": "Say hello in one sentence."}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="Tensormesh Streaming Chat Completion"
import os
from litellm import completion

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = completion(
    model="tensormesh/<your-model-name>",
    messages=[{"role": "user", "content": "Write a short poem about inference."}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 工具呼叫 {#tool-calling}

```python showLineNumbers title="Tensormesh Tool Calling"
import os
from litellm import completion

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string", "description": "City name"}},
                "required": ["city"],
            },
        },
    }
]

response = completion(
    model="tensormesh/<your-model-name>",
    messages=[{"role": "user", "content": "What is the weather in San Francisco?"}],
    tools=tools,
    tool_choice="auto",
)

print(response.choices[0].message.tool_calls)
```

每個工具函式都必須包含非空的 `description`；Tensormesh 會拒絕沒有它的工具定義。

### 推理 {#reasoning}

Tensormesh 推理模型（例如 DeepSeek-V4-Flash、Qwen3.5-397B、Qwen3.6-27B、GLM-5.1、MiniMax-M2.5、Kimi-K2.6，以及 gpt-oss 模型）透過 vLLM chat-template 控制項提供 thinking 模式。將 thinking 切換（`thinking` 或 `enable_thinking`）與 `reasoning_effort` 配對，並透過 `extra_body` 傳遞。模型會以 `reasoning_content` 回傳其思路鏈。

```python showLineNumbers title="Tensormesh Reasoning"
import os
from litellm import completion

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = completion(
    model="tensormesh/deepseek-ai/DeepSeek-V4-Flash",
    messages=[{"role": "user", "content": "If a train travels 60 miles in 1.5 hours, what is its average speed?"}],
    extra_body={"chat_template_kwargs": {"thinking": True, "reasoning_effort": "high"}},
)

print(response.choices[0].message.reasoning_content)
print(response.choices[0].message.content)
```

### 文字補全 {#text-completions}

```python showLineNumbers title="Tensormesh Text Completion"
import os
from litellm import text_completion

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = text_completion(
    model="tensormesh/<your-model-name>",
    prompt="Complete this sentence: Fast inference matters because",
    max_tokens=32,
)

print(response.choices[0].text)
```

### 回應 API {#responses-api}

```python showLineNumbers title="Tensormesh Responses API"
import os
import litellm

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = litellm.responses(
    model="tensormesh/<your-model-name>",
    input="Say hello in one sentence.",
)

print(response)
```

## 用法 - LiteLLM Proxy {#usage---litellm-proxy}

將 Tensormesh 加入您的 LiteLLM Proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: tensormesh-chat
    litellm_params:
      model: tensormesh/<your-model-name>
      api_key: os.environ/TENSORMESH_INFERENCE_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export TENSORMESH_INFERENCE_API_KEY="your-api-key"
export LITELLM_MASTER_KEY="sk-local-tensormesh"
litellm --config config.yaml --port 4000

# RUNNING on http://0.0.0.0:4000
```

對 LiteLLM Proxy 的請求必須使用 `Authorization: Bearer $LITELLM_MASTER_KEY` 中的 proxy key。`TENSORMESH_INFERENCE_API_KEY` 只會在 LiteLLM 呼叫 Tensormesh upstream 時使用。

若要進行基本啟動檢查，請使用 `/health/liveliness` 或 `/health/readiness`。`/health` endpoint 已通過驗證，並可能執行模型檢查。

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Tensormesh via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-local-tensormesh",
)

response = client.chat.completions.create(
    model="tensormesh-chat",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Tensormesh via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -d '{
    "model": "tensormesh-chat",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

## Anthropic Messages 相容性 {#anthropic-messages-compatibility}

LiteLLM 可將 Anthropic Messages 格式的請求轉譯為 Tensormesh chat completions。在 Python SDK 中，請使用 Anthropic Messages facade：

```python showLineNumbers title="Anthropic Messages through LiteLLM SDK"
import os
import litellm

os.environ["TENSORMESH_INFERENCE_API_KEY"] = "your-api-key"

response = litellm.anthropic.messages.create(
    model="tensormesh/<your-model-name>",
    max_tokens=128,
    messages=[{"role": "user", "content": "Say hello in one sentence."}],
)

print(response["content"][0]["text"])
```

對於 HTTP 用戶端，LiteLLM Proxy 會公開 Anthropic 相容的 `/v1/messages` endpoint，並將 upstream 請求路由至 Tensormesh chat completions。請在請求主體中的 `model` 設為 proxy `model_name`。

```bash showLineNumbers title="Anthropic Messages through LiteLLM Proxy"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "tensormesh-chat",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "Say hello in one sentence."}]
  }'
```

SDK facade 與 Proxy `/v1/messages` endpoint 都使用 LiteLLM 的 Anthropic Messages 適配器。Tensormesh 在 upstream 接收 OpenAI 相容的 chat completion 請求。

## 成本追蹤 {#cost-tracking}

Tensormesh 無伺服器模型已註冊於 LiteLLM 的模型成本對照表，因此 LiteLLM 會自動計算每次請求的支出。在 proxy 上，成本會回傳於 `x-litellm-response-cost` 回應標頭中，並記錄於支出記錄。快取的輸入 token 以零計費。

## 常見參數 {#common-parameters}

以下是建議先使用的常見參數。其他參數取決於模型，應針對目標 Tensormesh 模型進行驗證。

| Endpoint | Common parameters |
|----------|-------------------|
| `/chat/completions` | `messages`、`max_tokens`、`max_completion_tokens`、`temperature`、`top_p`、`stream`、`stop`、`tools`、`tool_choice`、`response_format`、`extra_body`、`extra_headers` |
| `/completions` | `prompt`、`max_tokens`、`temperature`、`top_p`、`stream`、`stop` |
| `/responses` | `input`、`max_output_tokens`、`temperature`、`top_p`、`stream`、`tools`、`tool_choice`、`text`、`extra_headers` |
| `/messages` | `messages`、`max_tokens`、`temperature`、`top_p`、`stream`、`tools`、`tool_choice`、`extra_headers` |

對於 chat completions，LiteLLM 接受 `max_completion_tokens`，並將其對應到 Tensormesh 的 `max_tokens`。

## 附註 {#notes}

- 直接 LiteLLM SDK 呼叫請使用 `model="tensormesh/<your-model-name>"`。
- 預設的無伺服器 base URL 為 `https://serverless.tensormesh.ai/v1`。
- 推理控制項（`thinking`/`enable_thinking` 與 `reasoning_effort`）會透過 `extra_body.chat_template_kwargs` 傳遞，並在具備推理能力的模型上會被支援。
