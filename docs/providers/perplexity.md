import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Perplexity AI（pplx-api） {#perplexity-ai-pplx-api}
https://www.perplexity.ai

## API 金鑰 {#api-key}
```python
# env variable
os.environ['PERPLEXITYAI_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['PERPLEXITYAI_API_KEY'] = ""
response = completion(
    model="perplexity/sonar-pro", 
    messages=messages
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['PERPLEXITYAI_API_KEY'] = ""
response = completion(
    model="perplexity/sonar-pro", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 推理努力 {#reasoning-effort}

需要 v1.72.6+

:::info

請參閱 LiteLLM 推理完整指南 [這裡](../reasoning_content)

:::

您可以透過設定 `reasoning_effort` 參數來設定推理努力。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ['PERPLEXITYAI_API_KEY'] = ""
response = completion(
    model="perplexity/sonar-reasoning", 
    messages=messages,
    reasoning_effort="high"
)
print(response)
```
</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: perplexity-sonar-reasoning-model
    litellm_params:
        model: perplexity/sonar-reasoning
        api_key: os.environ/PERPLEXITYAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！ 

如果已[設定](../proxy/virtual_keys)，請將 `anything` 替換為您的 LiteLLM Proxy 虛擬金鑰。

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer anything" \
  -d '{
    "model": "perplexity-sonar-reasoning-model",
    "messages": [{"role": "user", "content": "Who won the World Cup in 2022?"}],
    "reasoning_effort": "high"
  }'
```

</TabItem>
</Tabs>

## 支援的模型 {#supported-models}
此處列出的所有 https://docs.perplexity.ai/docs/model-cards 模型都受支援。 只要執行 `model=perplexity/<model-name>` 即可。

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| sonar-deep-research | `completion(model="perplexity/sonar-deep-research", messages)` | 
| sonar-reasoning-pro | `completion(model="perplexity/sonar-reasoning-pro", messages)` | 
| sonar-reasoning | `completion(model="perplexity/sonar-reasoning", messages)` | 
| sonar-pro | `completion(model="perplexity/sonar-pro", messages)` | 
| sonar | `completion(model="perplexity/sonar", messages)` | 
| r1-1776 | `completion(model="perplexity/r1-1776", messages)` | 

## 代理程式 API（Responses API） {#agent-api-responses-api}

需要 v1.72.6+

### 使用預設值 {#using-presets}

預設值為特定使用案例提供最佳化的預設設定。從預設值開始可快速完成設定：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

# Using the pro-search preset
response = responses(
    model="perplexity/preset/pro-search",
    input="What are the latest developments in AI?",
    custom_llm_provider="perplexity",
)

print(response.output)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: perplexity-pro-search
    litellm_params:
        model: perplexity/preset/pro-search
        api_key: os.environ/PERPLEXITY_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試看看！

```bash
curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer anything" \
  -d '{
    "model": "perplexity-pro-search",
    "input": "What are the latest developments in AI?"
  }'
```

</TabItem>
</Tabs>

### 使用第三方模型 {#using-third-party-models}

透過 Perplexity 的統一 API 存取來自 OpenAI、Anthropic、Google、xAI 及其他提供者的模型：

<Tabs>
<TabItem value="openai" label="OpenAI">

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/openai/gpt-5.2",
    input="Explain quantum computing in simple terms",
    custom_llm_provider="perplexity",
    max_output_tokens=500,
)

print(response.output)
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/anthropic/claude-sonnet-4-5",
    input="Write a short story about a robot learning to paint",
    custom_llm_provider="perplexity",
    max_output_tokens=500,
)

print(response.output)
```

</TabItem>
<TabItem value="google" label="Google">

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/google/gemini-2.5-flash",
    input="Explain the concept of neural networks",
    custom_llm_provider="perplexity",
    max_output_tokens=500,
)

print(response.output)
```

</TabItem>
<TabItem value="xai" label="xAI">

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/xai/grok-4-1-fast-non-reasoning",
    input="What makes a good AI assistant?",
    custom_llm_provider="perplexity",
    max_output_tokens=500,
)

print(response.output)
```

</TabItem>
</Tabs>

### 網頁搜尋工具 {#web-search-tool}

啟用網頁搜尋功能以存取即時資訊：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/openai/gpt-5.2",
    input="What's the weather in San Francisco today?",
    custom_llm_provider="perplexity",
    tools=[{"type": "web_search"}],
    instructions="You have access to a web_search tool. Use it for questions about current events.",
)

print(response.output)
```

### 函式呼叫 {#function-calling}

Agent API 支援自訂函式工具。請原封不動地傳遞函式工具：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/openai/gpt-5.2",
    input="What's the weather in San Francisco?",
    custom_llm_provider="perplexity",
    tools=[
        {"type": "web_search"},
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather for a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"},
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                    },
                },
            },
        },
    ],
    instructions="Use tools when appropriate.",
)

print(response.output)
```

### 結構化輸出 {#structured-outputs}

透過 `text` 參數請求 JSON schema 結構化輸出：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/preset/pro-search",
    input="Extract key facts about the Eiffel Tower",
    custom_llm_provider="perplexity",
    text={
        "format": {
            "type": "json_schema",
            "name": "facts",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "height_meters": {"type": "number"},
                    "year_built": {"type": "integer"},
                },
                "required": ["name", "height_meters", "year_built"],
            },
            "strict": True,
        }
    },
)

print(response.output)
```


### 推理努力（Responses API） {#reasoning-effort-responses-api}

控制具備推理能力模型的推理努力等級：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/openai/gpt-5.2",
    input="Solve this complex problem step by step",
    custom_llm_provider="perplexity",
    reasoning={"effort": "high"},  # Options: low, medium, high
    max_output_tokens=1000,
)

print(response.output)
```

### 多輪對話 {#multi-turn-conversations}

使用訊息陣列進行具備上下文的多輪對話：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/anthropic/claude-sonnet-4-5",
    input=[
        {"type": "message", "role": "system", "content": "You are a helpful assistant."},
        {"type": "message", "role": "user", "content": "What are the latest AI developments?"},
    ],
    custom_llm_provider="perplexity",
    instructions="Provide detailed, well-researched answers.",
    max_output_tokens=800,
)

print(response.output)
```

### 串流回應 {#streaming-responses}

串流回應以即時輸出：

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

response = responses(
    model="perplexity/openai/gpt-5.2",
    input="Tell me a story about space exploration",
    custom_llm_provider="perplexity",
    stream=True,
    max_output_tokens=500,
)

for chunk in response:
    if hasattr(chunk, 'type'):
        if chunk.type == "response.output_text.delta":
            print(chunk.delta, end="", flush=True)
```

### 支援的第三方模型 {#supported-third-party-models}

| 提供者 | 模型名稱 | 函式呼叫 |
|----------|------------|---------------|
| OpenAI | gpt-5.2 | `responses(model="perplexity/openai/gpt-5.2", ...)` |
| OpenAI | gpt-5.1 | `responses(model="perplexity/openai/gpt-5.1", ...)` |
| OpenAI | gpt-5-mini | `responses(model="perplexity/openai/gpt-5-mini", ...)` |
| Anthropic | claude-opus-4-6 | `responses(model="perplexity/anthropic/claude-opus-4-6", ...)` |
| Anthropic | claude-opus-4-5 | `responses(model="perplexity/anthropic/claude-opus-4-5", ...)` |
| Anthropic | claude-sonnet-4-5 | `responses(model="perplexity/anthropic/claude-sonnet-4-5", ...)` |
| Anthropic | claude-haiku-4-5 | `responses(model="perplexity/anthropic/claude-haiku-4-5", ...)` |
| Google | gemini-3-pro-preview | `responses(model="perplexity/google/gemini-3-pro-preview", ...)` |
| Google | gemini-3-flash-preview | `responses(model="perplexity/google/gemini-3-flash-preview", ...)` |
| Google | gemini-2.5-pro | `responses(model="perplexity/google/gemini-2.5-pro", ...)` |
| Google | gemini-2.5-flash | `responses(model="perplexity/google/gemini-2.5-flash", ...)` |
| xAI | grok-4-1-fast-non-reasoning | `responses(model="perplexity/xai/grok-4-1-fast-non-reasoning", ...)` |
| Perplexity | sonar | `responses(model="perplexity/perplexity/sonar", ...)` |

### 可用預設值 {#available-presets}

| 預設名稱 | 函式呼叫 |
|-------------|---------------|
| fast-search | `responses(model="perplexity/preset/fast-search", ...)` |
| pro-search | `responses(model="perplexity/preset/pro-search", ...)` |
| deep-research | `responses(model="perplexity/preset/deep-research", ...)` |
| advanced-deep-research | `responses(model="perplexity/preset/advanced-deep-research", ...)` |

### 完整範例 {#complete-example}

```python
from litellm import responses
import os

os.environ['PERPLEXITY_API_KEY'] = ""

# Comprehensive example with multiple features
response = responses(
    model="perplexity/openai/gpt-5.2",
    input="Research the latest developments in quantum computing and provide sources",
    custom_llm_provider="perplexity",
    tools=[
        {"type": "web_search"},
        {"type": "fetch_url"}
    ],
    instructions="Use web_search to find relevant information and fetch_url to retrieve detailed content from sources. Provide citations for all claims.",
    max_output_tokens=1000,
    temperature=0.7,
)

print(f"Response ID: {response.id}")
print(f"Model: {response.model}")
print(f"Status: {response.status}")
print(f"Output: {response.output}")
print(f"Usage: {response.usage}")
```

:::info

如需更多關於傳遞特定提供者參數的資訊，請[前往這裡](../completion/provider_specific_params.md)
:::
