import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Novita AI {#novita-ai}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Novita AI 是一個 AI 雲端平台，協助開發者透過簡單的 API 輕鬆部署 AI 模型，並以價格實惠且可靠的 GPU 雲端基礎架構為後盾。LiteLLM 支援來自 [Novita AI](https://novita.ai/models/llm?utm_source=github_litellm&utm_medium=github_readme&utm_campaign=github_link) 的所有模型 |
| LiteLLM 上的提供者路由 | `novita/` |
| 提供者文件 | [Novita AI 文件 ↗](https://novita.ai/docs/guides/introduction) |
| 提供者的 API 端點 | https://api.novita.ai/v3/openai |
| 支援的 OpenAI 端點 | `/chat/completions`, `/completions` |

<br />

## API 金鑰 {#api-keys}

在[這裡](https://novita.ai/settings/key-management)取得您的 API 金鑰
```python
import os
os.environ["NOVITA_API_KEY"] = "your-api-key"
```

## 支援的 OpenAI 參數 {#supported-openai-params}
- max_tokens
- stream
- stream_options
- n
- seed
- frequency_penalty
- presence_penalty
- repetition_penalty
- stop
- temperature
- top_p
- top_k
- min_p
- logit_bias
- logprobs
- top_logprobs
- tools
- response_format
- separate_reasoning

## 範例用法 {#sample-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion
os.environ["NOVITA_API_KEY"] = ""

response = completion(
    model="novita/deepseek/deepseek-r1-turbo",
    messages=[{"role": "user", "content": "List 5 popular cookie recipes."}]
)

content = response.get('choices', [{}])[0].get('message', {}).get('content')
print(content)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至 config.yaml
```yaml
model_list:
  - model_name: deepseek-r1-turbo
    litellm_params:
      model: novita/deepseek/deepseek-r1-turbo
      api_key: os.environ/NOVITA_API_KEY
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 發送請求！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk_sujEQQEjTRxGUiMLN3TJh2KadRX4pw2TLWRoIKeoYZ0' \
-d '{
  "model": "deepseek-r1-turbo",
  "messages": [
      {"role": "user", "content": "List 5 popular cookie recipes."}
  ]
}
'
```

</TabItem>
</Tabs>

## 工具呼叫 {#tool-calling}

```python
from litellm import completion
import os
# set env
os.environ["NOVITA_API_KEY"] = ""

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
messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]

response = completion(
    model="novita/deepseek/deepseek-r1-turbo",
    messages=messages,
    tools=tools,
)
# Add any assertions, here to check response args
print(response)
assert isinstance(response.choices[0].message.tool_calls[0].function.name, str)
assert isinstance(
    response.choices[0].message.tool_calls[0].function.arguments, str
)

```

## JSON 模式 {#json-mode}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion 
import json 
import os 

os.environ['NOVITA_API_KEY'] = ""

messages = [
    {
        "role": "user",
        "content": "List 5 popular cookie recipes."
    }
]

completion(
    model="novita/deepseek/deepseek-r1-turbo", 
    messages=messages, 
    response_format={"type": "json_object"} # 👈 KEY CHANGE
)

print(json.loads(completion.choices[0].message.content))
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將模型新增至 config.yaml
```yaml
model_list:
  - model_name: deepseek-r1-turbo
    litellm_params:
      model: novita/deepseek/deepseek-r1-turbo
      api_key: os.environ/NOVITA_API_KEY
```

2. 啟動 Proxy 

```
$ litellm --config /path/to/config.yaml
```

3. 發送請求！

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "deepseek-r1-turbo",
  "messages": [
      {"role": "user", "content": "List 5 popular cookie recipes."}
  ],
  "response_format": {"type": "json_object"}
}
'
```

</TabItem>
</Tabs>

## 聊天模型 {#chat-models}

🚨 LiteLLM 支援所有 Novita AI 模型，請送出 `model=novita/<your-novita-model>` 以將其傳送至 Novita AI。請在[這裡](https://novita.ai/models/llm?utm_source=github_litellm&utm_medium=github_readme&utm_campaign=github_link)查看所有 Novita AI 模型

| 模型名稱                | 函式呼叫                                       |
|---------------------------|-----------------------------------------------------|
| novita/deepseek/deepseek-r1-turbo | `completion('novita/deepseek/deepseek-r1-turbo', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/deepseek/deepseek-v3-turbo | `completion('novita/deepseek/deepseek-v3-turbo', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/deepseek/deepseek-v3-0324 | `completion('novita/deepseek/deepseek-v3-0324', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen3-235b-a22b-fp8 | `completion('novita/qwen/qwen/qwen3-235b-a22b-fp8', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen3-30b-a3b-fp8 | `completion('novita/qwen/qwen3-30b-a3b-fp8', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen/qwen3-32b-fp8 | `completion('novita/qwen/qwen3-32b-fp8', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen3-30b-a3b-fp8 | `completion('novita/qwen/qwen3-30b-a3b-fp8', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/qwen/qwen2.5-vl-72b-instruct | `completion('novita/qwen/qwen2.5-vl-72b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-4-maverick-17b-128e-instruct-fp8 | `completion('novita/meta-llama/llama-4-maverick-17b-128e-instruct-fp8', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.3-70b-instruct | `completion('novita/meta-llama/llama-3.3-70b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-8b-instruct | `completion('novita/meta-llama/llama-3.1-8b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-8b-instruct-max | `completion('novita/meta-llama/llama-3.1-8b-instruct-max', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/meta-llama/llama-3.1-70b-instruct | `completion('novita/meta-llama/llama-3.1-70b-instruct', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/gryphe/mythomax-l2-13b | `completion('novita/gryphe/mythomax-l2-13b', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/google/gemma-3-27b-it | `completion('novita/google/gemma-3-27b-it', messages)` | `os.environ['NOVITA_API_KEY']` |
| novita/mistralai/mistral-nemo | `completion('novita/mistralai/mistral-nemo', messages)` | `os.environ['NOVITA_API_KEY']` |
