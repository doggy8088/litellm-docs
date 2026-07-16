import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 結構化輸出（JSON 模式） {#structured-outputs-json-mode}

## 快速開始  {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os 

os.environ["OPENAI_API_KEY"] = ""

response = completion(
  model="gpt-4o-mini",
  response_format={ "type": "json_object" },
  messages=[
    {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
    {"role": "user", "content": "Who won the world series in 2020?"}
  ]
)
print(response.choices[0].message.content)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "response_format": { "type": "json_object" },
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant designed to output JSON."
      },
      {
        "role": "user",
        "content": "Who won the world series in 2020?"
      }
    ]
  }'
```
</TabItem>
</Tabs>

## 檢查模型支援  {#check-model-support}

### 1. 檢查模型是否支援 `response_format` {#1-check-if-model-supports-response_format}

呼叫 `litellm.get_supported_openai_params` 以檢查模型/提供者是否支援 `response_format`。 

```python
from litellm import get_supported_openai_params

params = get_supported_openai_params(model="anthropic.claude-3", custom_llm_provider="bedrock")

assert "response_format" in params
```

### 2. 檢查模型是否支援 `json_schema` {#2-check-if-model-supports-json_schema}

這用於檢查您是否可以傳入 
- `response_format={ "type": "json_schema", "json_schema": … , "strict": true }`
- `response_format=<Pydantic Model>`

```python
from litellm import supports_response_schema

assert supports_response_schema(model="gemini-1.5-pro-preview-0215", custom_llm_provider="bedrock")
```

請參閱 [model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 以取得完整的模型清單及其對 `response_schema` 的支援情況。

## 傳入 'json_schema'  {#pass-in-json_schema}

若要使用結構化輸出，只需指定

```
response_format: { "type": "json_schema", "json_schema": … , "strict": true }
```

適用於：
- OpenAI 模型 
- Azure OpenAI 模型
- xAI 模型（Grok-2 或更新版本）
- Google AI Studio - Gemini 模型
- Vertex AI 模型（Gemini + Anthropic）
- Bedrock 模型
- Anthropic API 模型
- Groq 模型
- Ollama 模型
- Databricks 模型

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion 
from pydantic import BaseModel

# add to env var 
os.environ["OPENAI_API_KEY"] = ""

messages = [{"role": "user", "content": "List 5 important events in the XIX century"}]

class CalendarEvent(BaseModel):
  name: str
  date: str
  participants: list[str]

class EventsList(BaseModel):
    events: list[CalendarEvent]

resp = completion(
    model="gpt-4o-2024-08-06",
    messages=messages,
    response_format=EventsList
)

print("Received={}".format(resp))

events_list = EventsList.model_validate_json(resp.choices[0].message.content)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 將 openai model 加入 config.yaml

```yaml
model_list:
  - model_name: "gpt-4o"
    litellm_params:
      model: "gpt-4o-2024-08-06"
```

2. 使用 config.yaml 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 使用 OpenAI SDK / Curl 呼叫！

只要將 openai sdk 中的 'base_url' 取代掉，即可針對 openai 模型以 'json_schema' 呼叫 proxy

**OpenAI SDK**
```python
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI(
    api_key="anything", # 👈 PROXY KEY (can be anything, if master_key not set)
    base_url="http://0.0.0.0:4000" # 👈 PROXY BASE URL
)

class Step(BaseModel):
    explanation: str
    output: str

class MathReasoning(BaseModel):
    steps: list[Step]
    final_answer: str

completion = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful math tutor. Guide the user through the solution step by step."},
        {"role": "user", "content": "how can I solve 8x + 7 = -23"}
    ],
    response_format=MathReasoning,
)

math_reasoning = completion.choices[0].message.parsed
```

**Curl**

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful math tutor. Guide the user through the solution step by step."
      },
      {
        "role": "user",
        "content": "how can I solve 8x + 7 = -23"
      }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "math_reasoning",
        "schema": {
          "type": "object",
          "properties": {
            "steps": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "explanation": { "type": "string" },
                  "output": { "type": "string" }
                },
                "required": ["explanation", "output"],
                "additionalProperties": false
              }
            },
            "final_answer": { "type": "string" }
          },
          "required": ["steps", "final_answer"],
          "additionalProperties": false
        },
        "strict": true
      }
    }
  }'
```

</TabItem>
</Tabs>

## 驗證 JSON Schema  {#validate-json-schema}

並非所有 vertex 模型都支援將 json_schema 傳給它們（例如 `gemini-1.5-flash`）。為了解決這個問題，LiteLLM 支援在用戶端對 json schema 進行驗證。 

```
litellm.enable_json_schema_validation=True
```
如果已設定 `litellm.enable_json_schema_validation=True`，LiteLLM 將使用 `jsonvalidator` 驗證 json 回應。 

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/671d8ac496b6229970c7f2a3bdedd6cb84f0746b/litellm/litellm_core_utils/json_validation_rule.py#L4)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
# !gcloud auth application-default login - run this to add vertex credentials to your env
import litellm, os
from litellm import completion 
from pydantic import BaseModel 


messages=[
        {"role": "system", "content": "Extract the event information."},
        {"role": "user", "content": "Alice and Bob are going to a science fair on Friday."},
    ]

litellm.enable_json_schema_validation = True
litellm.set_verbose = True # see the raw request made by litellm

class CalendarEvent(BaseModel):
  name: str
  date: str
  participants: list[str]

resp = completion(
    model="gemini/gemini-1.5-pro",
    messages=messages,
    response_format=CalendarEvent,
)

print("Received={}".format(resp))
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 建立 config.yaml
```yaml
model_list:
  - model_name: "gemini-1.5-flash"
    litellm_params:
      model: "gemini/gemini-1.5-flash"
      api_key: os.environ/GEMINI_API_KEY

litellm_settings:
  enable_json_schema_validation: True
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "gemini-1.5-flash",
    "messages": [
        {"role": "system", "content": "Extract the event information."},
        {"role": "user", "content": "Alice and Bob are going to a science fair on Friday."},
    ],
    "response_format": { 
        "type": "json_schema",
        "json_schema": {
          "name": "math_reasoning",
          "schema": {
            "type": "object",
            "properties": {
              "steps": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "explanation": { "type": "string" },
                    "output": { "type": "string" }
                  },
                  "required": ["explanation", "output"],
                  "additionalProperties": false
                }
              },
              "final_answer": { "type": "string" }
            },
            "required": ["steps", "final_answer"],
            "additionalProperties": false
          },
          "strict": true
        }
    },
  }'
```

</TabItem>
</Tabs>

## Gemini - 原生 JSON Schema 格式（Gemini 2.0+） {#gemini---native-json-schema-format-gemini-20}

Gemini 2.0+ 模型會自動使用原生 `responseJsonSchema` 參數，這可提供與標準 JSON Schema 格式更好的相容性。

### 優點（Gemini 2.0+）： {#benefits-gemini-20}
- 標準 JSON Schema 格式（較小寫的型別，例如 `string`、`object`）
- 支援 `additionalProperties: false`，以進行更嚴格的驗證
- 與 Pydantic 的 `model_json_schema()` 更相容
- 不需要 `propertyOrdering`

### 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
from pydantic import BaseModel

class UserInfo(BaseModel):
    name: str
    age: int

response = completion(
    model="gemini/gemini-2.0-flash",
    messages=[{"role": "user", "content": "Extract: John is 25 years old"}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "user_info",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"}
                },
                "required": ["name", "age"],
                "additionalProperties": False  # Supported on Gemini 2.0+
            }
        }
    }
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [
        {"role": "user", "content": "Extract: John is 25 years old"}
    ],
    "response_format": {
        "type": "json_schema",
        "json_schema": {
            "name": "user_info",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"}
                },
                "required": ["name", "age"],
                "additionalProperties": false
            }
        }
    }
  }'
```

</TabItem>
</Tabs>

### 模型行為 {#model-behavior}

| 模型 | 使用的格式 | `additionalProperties` 支援 |
|-------|-------------|-------------------------------|
| Gemini 2.0+ | `responseJsonSchema`（JSON Schema） | ✅ 是 |
| Gemini 1.5 | `responseSchema`（OpenAPI） | ❌ 否 |

LiteLLM 會根據模型版本自動選取適當的格式。
