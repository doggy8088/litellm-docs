import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Lemonade {#lemonade}

[Lemonade Server](https://lemonade-server.ai/) 是一個與 OpenAI 相容的本地語言模型推論提供者，針對 AMD GPU 與 NPU 進行最佳化。`lemonade` litellm 提供者支援標準 chat completions，並與 OpenAI API 完全相容。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 適用於本地與雲端語言模型推論的 OpenAI 相容 AI 提供者 |
| LiteLLM 上的提供者路由 | `lemonade/`（將此前綴加到模型名稱前，例如 `lemonade/your-model-name`） |
| 提供者的 API 端點 | http://localhost:8000/api/v1（預設） |
| 支援的端點 | `/chat/completions` |

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Lemonade 完全與 OpenAI 相容，並支援以下參數：

```
"repeat_penalty"
"functions"
"logit_bias"
"max_tokens"
"max_completion_tokens"
"presence_penalty"
"stop"
"temperature"
"top_p"
"top_k"
"response_format"
"tools"
```


## API 金鑰設定 {#api-key-setup}

Lemonade 可搭配自訂 API URL 進行設定，且不需要嚴格的 API 金鑰驗證。設定 `LEMONADE_API_BASE` 環境變數即可修改 base URL。

## 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

# Optional: Set custom API base. Useful if your lemonade server is on
# a different port
os.environ['LEMONADE_API_BASE'] = "http://localhost:8000/api/v1"

response = completion(
    model="lemonade/your-model-name",
    messages=[
       {"role": "user", "content": "Hello from LiteLLM!"}
   ],
)
print(response)
```

## 串流 {#streaming}

```python
from litellm import completion
import os

# Optional: Set custom API base. Useful if your lemonade server is on
# a different port
os.environ['LEMONADE_API_BASE'] = "http://localhost:8000/api/v1"

response = completion(
    model="lemonade/your-model-name",
    messages=[
       {"role": "user", "content": "Write a short story"}
   ],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content, end='', flush=True)
```

## 進階用法 {#advanced-usage}

### 自訂參數 {#custom-parameters}

Lemonade 支援標準 OpenAI 設定之外的其他參數：

```python
from litellm import completion

response = completion(
    model="lemonade/your-model-name",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    temperature=0.7,
    max_tokens=500,
    top_p=0.9,
    top_k=50,
    repeat_penalty=1.1,
    stop=["Human:", "AI:"]
)
print(response)
```

### 函式呼叫 {#function-calling}

Lemonade 支援與 OpenAI 相容的函式呼叫：

```python
from litellm import completion

functions = [
    {
        "name": "get_weather",
        "description": "Get current weather information",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state"
                }
            },
            "required": ["location"]
        }
    }
]

response = completion(
    model="lemonade/your-model-name",
    messages=[{"role": "user", "content": "What's the weather in San Francisco?"}],
    tools=[{"type": "function", "function": f} for f in functions],
    tool_choice="auto"
)
print(response)
```

### 回應格式 {#response-format}

Lemonade 支援使用回應格式的結構化輸出：

```python
from litellm import completion
import json

# Define schema in response_format
response = completion(
    model="lemonade/Qwen3-Coder-30B-A3B-Instruct-GGUF",
    messages=[{"role": "user", "content": "Generate JSON data for a person with their name, age, and city."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "person",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"},
                    "city": {"type": "string"}
                },
                "required": ["name", "age"]
            }
        }
    }
)

print(f"Model: {response.model}")
print(f"JSON Output:")
json_data = json.loads(response.choices[0].message.content)
print(json.dumps(json_data, indent=2))
```

## 可用模型 {#available-models}

Lemonade 會透過查詢 `/models` 端點自動驗證可用模型。您可以以程式方式檢查可用模型：

```python
import httpx

api_base = "http://localhost:8000"  # or your custom base
response = httpx.get(f"{api_base}/api/v1/models")
models = response.json()
print("Available models:", [model['id'] for model in models.get('data', [])])
```

## 支援 {#support}

如需更多關於 Lemonade 的資訊，請前往 [Lemonade 網站](https://lemonade-server.ai/) 或 [Lemonade 儲存庫](https://github.com/lemonade-sdk/lemonade)。

</TabItem>
</Tabs>
