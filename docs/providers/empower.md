# Empower {#empower}
LiteLLM 支援 Empower 上的所有模型。 

## API 金鑰 {#api-keys}

```python 
import os 
os.environ["EMPOWER_API_KEY"] = "your-api-key"
```
## 使用範例 {#example-usage}

```python
from litellm import completion 
import os

os.environ["EMPOWER_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Write me a poem about the blue sky"}]

response = completion(model="empower/empower-functions", messages=messages)
print(response)
```

## 使用範例 - 串流 {#example-usage---streaming}
```python
from litellm import completion 
import os

os.environ["EMPOWER_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Write me a poem about the blue sky"}]

response = completion(model="empower/empower-functions", messages=messages, streaming=True)
for chunk in response:
    print(chunk['choices'][0]['delta'])

```

## 使用範例 - 自動工具呼叫 {#example-usage---automatic-tool-calling}

```python
from litellm import completion 
import os

os.environ["EMPOWER_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}]
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        },
    }
]

response = completion(
    model="empower/empower-functions-small",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
)
print("\nLLM Response:\n", response)
```

## Empower 模型 {#empower-models}
liteLLM 支援對 https://empower.dev/ 上所有模型的 `non-streaming` 與 `streaming` 請求

Empower 使用範例 - 注意：liteLLM 支援部署在 Empower 上的所有模型

### Empower LLMs - 自動工具使用模型 {#empower-llms---automatic-tool-using-models}
| 模型名稱                        | 函式呼叫                                                          | 必要的 OS 變數           |
|-----------------------------------|------------------------------------------------------------------------|---------------------------------|
| empower/empower-functions  | `completion('empower/empower-functions', messages)`            | `os.environ['TOGETHERAI_API_KEY']` |
| empower/empower-functions-small  | `completion('empower/empower-functions-small', messages)`            | `os.environ['TOGETHERAI_API_KEY']` |
