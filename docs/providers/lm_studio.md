import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LM Studio {#lm-studio}

https://lmstudio.ai/docs/basics/server

:::tip

**我們支援所有 LM Studio 模型，送出 litellm 請求時只需將 `model=lm_studio/<any-model-on-lmstudio>` 設為前綴**

:::

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 探索、下載並執行本機 LLM。 |
| LiteLLM 上的提供者路由 | `lm_studio/` |
| 提供者文件 | [LM Studio ↗](https://lmstudio.ai/docs/api/openai-api) |
| 支援的 OpenAI 端點 | `/chat/completions`, `/embeddings`, `/completions` |

## API 金鑰 {#api-key}
```python
# env variable
os.environ['LM_STUDIO_API_BASE']
os.environ['LM_STUDIO_API_KEY'] # optional, default is empty
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['LM_STUDIO_API_BASE'] = ""

response = completion(
    model="lm_studio/llama-3-8b-instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ]
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['LM_STUDIO_API_KEY'] = ""
response = completion(
    model="lm_studio/llama-3-8b-instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    stream=True,
)

for chunk in response:
    print(chunk)
```


## 與 LiteLLM Proxy Server 搭配使用 {#usage-with-litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 LM Studio 模型

1. 修改 config.yaml 

  ```yaml
  model_list:
    - model_name: my-model
      litellm_params:
        model: lm_studio/<your-model-name>  # add lm_studio/ prefix to route as LM Studio provider
        api_key: api-key                 # api key to send your model
  ```


2. 啟動 proxy 

  ```bash
  $ litellm --config /path/to/config.yaml
  ```

3. 向 LiteLLM Proxy Server 送出請求

  <Tabs>

  <TabItem value="openai" label="OpenAI Python v1.0.0+">

  ```python
  import openai
  client = openai.OpenAI(
      api_key="sk-1234",             # pass litellm proxy key, if you're using virtual keys
      base_url="http://0.0.0.0:4000" # litellm-proxy-base url
  )

  response = client.chat.completions.create(
      model="my-model",
      messages = [
          {
              "role": "user",
              "content": "what llm are you"
          }
      ],
  )

  print(response)
  ```
  </TabItem>

  <TabItem value="curl" label="curl">

  ```shell
  curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
      "model": "my-model",
      "messages": [
          {
          "role": "user",
          "content": "what llm are you"
          }
      ],
  }'
  ```
  </TabItem>

  </Tabs>

## 支援的參數 {#supported-parameters}

請參閱[支援的參數](../completion/input.md#translated-openai-params)。

## 嵌入 {#embedding}

```python
from litellm import embedding
import os 

os.environ['LM_STUDIO_API_BASE'] = "http://localhost:8000"
response = embedding(
    model="lm_studio/jina-embeddings-v3",
    input=["Hello world"],
)
print(response)
```


## 結構化輸出 {#structured-output}

LM Studio 透過 JSON Schema 支援結構化輸出。您可以使用 `response_format` 傳入 pydantic 模型或原始 schema。
LiteLLM 會將 schema 以 `{ "type": "json_schema", "json_schema": {"schema": <your schema>} }` 送出。

```python
from pydantic import BaseModel
from litellm import completion

class Book(BaseModel):
    title: str
    author: str
    year: int

response = completion(
    model="lm_studio/llama-3-8b-instruct",
    messages=[{"role": "user", "content": "Tell me about The Hobbit"}],
    response_format=Book,
)
print(response.choices[0].message.content)
```
