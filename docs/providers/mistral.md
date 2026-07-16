import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Mistral AI API {#mistral-ai-api}
https://docs.mistral.ai/api/

## API 金鑰 {#api-key}
```python
# env variable
os.environ['MISTRAL_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = ""
response = completion(
    model="mistral/mistral-tiny", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = ""
response = completion(
    model="mistral/mistral-tiny", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```


## 搭配 LiteLLM Proxy 使用  {#usage-with-litellm-proxy}

### 1. 在 config.yaml 中設定 Mistral 模型 {#1-set-mistral-models-on-configyaml}

```yaml
model_list:
  - model_name: mistral-small-latest
    litellm_params:
      model: mistral/mistral-small-latest
      api_key: "os.environ/MISTRAL_API_KEY" # ensure you have `MISTRAL_API_KEY` in your .env
```

### 2. 啟動 Proxy  {#2-start-proxy}

```
litellm --config config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "mistral-small-latest",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(model="mistral-small-latest", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="langchain" label="Langchain">

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000", # set openai_api_base to the LiteLLM Proxy
    model = "mistral-small-latest",
    temperature=0.1
)

messages = [
    SystemMessage(
        content="You are a helpful assistant that im using to make a test request to."
    ),
    HumanMessage(
        content="test from litellm. tell me why it's amazing in 1 sentence"
    ),
]
response = chat(messages)

print(response)
```
</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

:::info
此處列出的所有模型 https://docs.mistral.ai/platform/endpoints 都支援。我們持續維護模型清單、定價、token 視窗等資訊。[請見此處](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。

:::

| 模型名稱     | 函式呼叫                                                | 推理支援 |
|----------------|--------------------------------------------------------------|-------------------|
| Mistral Small  | `completion(model="mistral/mistral-small-latest", messages)` | 否 |
| Mistral Medium | `completion(model="mistral/mistral-medium-latest", messages)`| 否 |
| Mistral Large 2  | `completion(model="mistral/mistral-large-2407", messages)` | 否 |
| Mistral Large Latest  | `completion(model="mistral/mistral-large-latest", messages)` | 否 |
| **Magistral Small**  | `completion(model="mistral/magistral-small-2506", messages)` | 是 |
| **Magistral Medium** | `completion(model="mistral/magistral-medium-2506", messages)`| 是 |
| Mistral 7B     | `completion(model="mistral/open-mistral-7b", messages)`      | 否 |
| Mixtral 8x7B   | `completion(model="mistral/open-mixtral-8x7b", messages)`    | 否 |
| Mixtral 8x22B  | `completion(model="mistral/open-mixtral-8x22b", messages)`   | 否 |
| Codestral      | `completion(model="mistral/codestral-latest", messages)`     | 否 |
| Mistral NeMo      | `completion(model="mistral/open-mistral-nemo", messages)`     | 否 |
| Mistral NeMo 2407      | `completion(model="mistral/open-mistral-nemo-2407", messages)`     | 否 |
| Codestral Mamba      | `completion(model="mistral/open-codestral-mamba", messages)`     | 否 |
| Codestral Mamba    | `completion(model="mistral/codestral-mamba-latest"", messages)`     | 否 |

## 函式呼叫 {#function-calling}

```python
from litellm import completion

# set env
os.environ["MISTRAL_API_KEY"] = "your-api-key"

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
    model="mistral/mistral-large-latest",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)
# Add any assertions, here to check response args
print(response)
assert isinstance(response.choices[0].message.tool_calls[0].function.name, str)
assert isinstance(
    response.choices[0].message.tool_calls[0].function.arguments, str
)
```

## 推理 {#reasoning}

Mistral 不直接支援推理，而是建議在其 magistral 模型中使用特定的 [system prompt](https://docs.mistral.ai/capabilities/reasoning/)。設定 `reasoning_effort` 參數後，LiteLLM 會將 system prompt 前置到請求中。 

如果已提供現有的 system message，LiteLLM 會將兩者以 system messages 清單形式傳送（您可以透過啟用 `litellm._turn_on_debug()` 來驗證）。

### 支援的模型 {#supported-models-1}

| 模型名稱     | 函式呼叫                                                |
|----------------|--------------------------------------------------------------|
| Magistral Small  | `completion(model="mistral/magistral-small-2506", messages)` |
| Magistral Medium | `completion(model="mistral/magistral-medium-2506", messages)`|

### 使用 Reasoning Effort {#using-reasoning-effort}

`reasoning_effort` 參數可控制模型在推理上投入的努力程度。搭配 magistral 模型使用時。

```python
from litellm import completion
import os

os.environ['MISTRAL_API_KEY'] = "your-api-key"

response = completion(
    model="mistral/magistral-medium-2506",
    messages=[
        {"role": "user", "content": "What is 15 multiplied by 7?"}
    ],
    reasoning_effort="medium"  # Options: "low", "medium", "high"
)

print(response)
```

### System Message 範例 {#example-with-system-message}

如果您已經有 system message，LiteLLM 會將推理指示前置：

```python
response = completion(
    model="mistral/magistral-medium-2506",
    messages=[
        {"role": "system", "content": "You are a helpful math tutor."},
        {"role": "user", "content": "Explain how to solve quadratic equations."}
    ],
    reasoning_effort="high"
)

# The system message becomes:
# "When solving problems, think step-by-step in <think> tags before providing your final answer...
#  
#  You are a helpful math tutor."
```

### 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy-1}

您也可以透過 LiteLLM proxy 使用推理功能：

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
      "model": "magistral-medium-2506",
      "messages": [
        {
          "role": "user",
          "content": "What is the square root of 144? Show your reasoning."
        }
      ],
      "reasoning_effort": "medium"
    }'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="magistral-medium-2506", 
    messages=[
        {
            "role": "user",
            "content": "Calculate the area of a circle with radius 5. Show your work."
        }
    ],
    reasoning_effort="high"
)

print(response)
```
</TabItem>
</Tabs>

### 重要注意事項 {#important-notes}

- **模型相容性**：推理參數僅適用於 magistral 模型
- **回溯相容性**：非 magistral 模型會忽略推理參數並正常運作

## 音訊轉錄 {#audio-transcription}

透過 `litellm.transcription()` 使用 Mistral 的 Voxtral 模型進行音訊轉錄。

### SDK 用法 {#sdk-usage}

```python
from litellm import transcription
import os

os.environ["MISTRAL_API_KEY"] = ""

audio_file = open("path/to/audio.wav", "rb")

response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
)

print(response.text)
```

### 含可選參數 {#with-optional-parameters}

```python
response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
    language="en",
    temperature=0.0,
    response_format="json",
)
```

### Mistral 專屬參數 {#mistral-specific-parameters}

Mistral 除了相容 OpenAI 的參數之外，還支援其他額外參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `diarize` | `bool` | 啟用說話者分離 |

```python
response = transcription(
    model="mistral/voxtral-mini-latest",
    file=audio_file,
    diarize=True,
)
```

### 搭配 LiteLLM Proxy 使用 {#usage-with-litellm-proxy-2}

```yaml
model_list:
  - model_name: voxtral
    litellm_params:
      model: mistral/voxtral-mini-latest
      api_key: os.environ/MISTRAL_API_KEY
    model_info:
      mode: audio_transcription
```

```bash
litellm --config /path/to/config.yaml
```

```bash
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
--header 'Authorization: Bearer sk-1234' \
--form 'file=@"audio.wav"' \
--form 'model="voxtral"'
```

## 範例用法 - 嵌入 {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['MISTRAL_API_KEY'] = ""
response = embedding(
    model="mistral/mistral-embed",
    input=["good morning from litellm"],
)
print(response)
```


## 支援的模型 {#supported-models-2}
此處列出的所有模型 https://docs.mistral.ai/platform/endpoints 都支援

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Mistral Embeddings | `embedding(model="mistral/mistral-embed", input)` |
