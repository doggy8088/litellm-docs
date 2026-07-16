import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Fireworks AI {#fireworks-ai}

:::info
**我們支援所有 Fireworks AI 模型，只要在傳送 completion 請求時將 `fireworks_ai/` 設為前綴即可**
:::

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 用於建置可上線、複合式 AI 系統的最快且最有效率的推論引擎。 |
| LiteLLM 提供者路由 | `fireworks_ai/` |
| 提供者文件 | [Fireworks AI ↗](https://docs.fireworks.ai/getting-started/introduction) |
| 支援的 OpenAI 端點 | `/chat/completions`, `/embeddings`, `/completions`, `/audio/transcriptions`, `/rerank` |

## 概覽 {#overview}

本指南說明如何將 LiteLLM 與 Fireworks AI 整合。您可以透過三種主要方式連接到 Fireworks AI：

1. <b> 使用 Fireworks AI 無伺服器模型 </b> – 可輕鬆連接到由 Fireworks 管理的模型。
2. <b> 連接到您自己的 Fireworks 帳戶中的模型 </b> – 存取託管於您 Fireworks 帳戶內的模型。
3. <b> 透過直接路由部署連接 </b> – 以更彈性、可自訂的方式連接到特定 Fireworks 執行個體。

## API 金鑰 {#api-key}
```python
# env variable
os.environ['FIREWORKS_AI_API_KEY']
```

## 範例用法 - 無伺服器模型 {#sample-usage---serverless-models}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/accounts/fireworks/models/llama-v3-70b-instruct", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 無伺服器模型 - 串流 {#sample-usage---serverless-models---streaming}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/accounts/fireworks/models/llama-v3-70b-instruct", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 範例用法 - 您自己的 Fireworks 帳戶中的模型  {#sample-usage----models-in-your-own-fireworks-account}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = ""
response = completion(
    model="fireworks_ai/accounts/fireworks/models/YOUR_MODEL_ID", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 直接路由部署 {#sample-usage---direct-route-deployment}
```python
from litellm import completion
import os

os.environ['FIREWORKS_AI_API_KEY'] = "YOUR_DIRECT_API_KEY"
response = completion(
    model="fireworks_ai/accounts/fireworks/models/qwen2p5-coder-7b#accounts/gitlab/deployments/2fb7764c", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
   api_base="https://gitlab-2fb7764c.direct.fireworks.ai/v1"
)
print(response)
```

> **注意：** 以上內容適用於聊天介面；如果您想使用文字 completion 介面，則為 model="text-completion-openai/accounts/fireworks/models/qwen2p5-coder-7b#accounts/gitlab/deployments/2fb7764c"

## 搭配 LiteLLM Proxy 使用  {#usage-with-litellm-proxy}

### 1. 在 config.yaml 中設定 Fireworks AI 模型 {#1-set-fireworks-ai-models-on-configyaml}

```yaml
model_list:
  - model_name: fireworks-llama-v3-70b-instruct
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/llama-v3-70b-instruct
      api_key: "os.environ/FIREWORKS_AI_API_KEY"
```

### 2. 啟動 Proxy  {#2-start-proxy}

```
litellm --config config.yaml
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "fireworks-llama-v3-70b-instruct",
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

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="fireworks-llama-v3-70b-instruct", messages = [
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
    model = "fireworks-llama-v3-70b-instruct",
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

## 文件內嵌  {#document-inlining}

LiteLLM 支援 Fireworks AI 模型的文件內嵌。這對於不是視覺模型、但仍需要解析文件/圖片等內容的模型很有用。

如果模型不是視覺模型，LiteLLM 會將 `#transform=inline` 加到 image_url 的網址中。[**查看程式碼**](https://github.com/BerriAI/litellm/blob/1ae9d45798bdaf8450f2dfdec703369f3d2212b7/litellm/llms/fireworks_ai/chat/transformation.py#L114)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"
os.environ["FIREWORKS_AI_API_BASE"] = "https://audio-prod.api.fireworks.ai/v1"

completion = litellm.completion(
    model="fireworks_ai/accounts/fireworks/models/llama-v3p3-70b-instruct",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://storage.googleapis.com/fireworks-public/test/sample_resume.pdf"
                    },
                },
                {
                    "type": "text",
                    "text": "What are the candidate's BA and MBA GPAs?",
                },
            ],
        }
    ],
)
print(completion)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: llama-v3p3-70b-instruct
    litellm_params:
      model: fireworks_ai/accounts/fireworks/models/llama-v3p3-70b-instruct
      api_key: os.environ/FIREWORKS_AI_API_KEY
    #   api_base: os.environ/FIREWORKS_AI_API_BASE [OPTIONAL], defaults to "https://api.fireworks.ai/inference/v1"
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl -L -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_API_KEY' \
-d '{"model": "llama-v3p3-70b-instruct", 
    "messages": [        
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://storage.googleapis.com/fireworks-public/test/sample_resume.pdf"
                    },
                },
                {
                    "type": "text",
                    "text": "What are the candidate's BA and MBA GPAs?",
                },
            ],
        }
    ]}'
```

</TabItem>
</Tabs>

### 停用自動新增 {#disable-auto-add}

如果您想停用自動將 `#transform=inline` 加到 image_url 的網址中，可以在 `FireworksAIConfig` 類別中將 `auto_add_transform_inline` 設為 `False`。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
litellm.disable_add_transform_inline_image_block = True
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
litellm_settings:
    disable_add_transform_inline_image_block: true
```

</TabItem>
</Tabs>

## 推理努力 {#reasoning-effort}

`reasoning_effort` 參數支援於部分 Fireworks AI 模型。支援的模型包括：

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"

response = completion(
    model="fireworks_ai/accounts/fireworks/models/qwen3-8b",
    messages=[
        {"role": "user", "content": "What is the capital of France?"}
    ],
    reasoning_effort="low",
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "fireworks_ai/accounts/fireworks/models/qwen3-8b",
    "messages": [
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

## 支援的模型 - 支援所有 Fireworks AI 模型！ {#supported-models---all-fireworks-ai-models-supported}

:::info
我們支援所有 Fireworks AI 模型，只要在傳送 completion 請求時將 `fireworks_ai/` 設為前綴即可
:::

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| llama-v3p2-1b-instruct | `completion(model="fireworks_ai/llama-v3p2-1b-instruct", messages)` |
| llama-v3p2-3b-instruct | `completion(model="fireworks_ai/llama-v3p2-3b-instruct", messages)` |
| llama-v3p2-11b-vision-instruct | `completion(model="fireworks_ai/llama-v3p2-11b-vision-instruct", messages)` |
| llama-v3p2-90b-vision-instruct | `completion(model="fireworks_ai/llama-v3p2-90b-vision-instruct", messages)` |
| mixtral-8x7b-instruct | `completion(model="fireworks_ai/mixtral-8x7b-instruct", messages)` | 
| firefunction-v1 | `completion(model="fireworks_ai/firefunction-v1", messages)` |
| llama-v2-70b-chat | `completion(model="fireworks_ai/llama-v2-70b-chat", messages)` |  

## 支援的嵌入模型 {#supported-embedding-models}

:::info
我們支援所有 Fireworks AI 模型，只要在傳送 embedding 請求時將 `fireworks_ai/` 設為前綴即可
:::

| 模型名稱            | 函式呼叫                                                   |
|-----------------------|-----------------------------------------------------------------|
| fireworks_ai/nomic-ai/nomic-embed-text-v1.5 | `response = litellm.embedding(model="fireworks_ai/nomic-ai/nomic-embed-text-v1.5", input=input_text)` |
| fireworks_ai/nomic-ai/nomic-embed-text-v1 | `response = litellm.embedding(model="fireworks_ai/nomic-ai/nomic-embed-text-v1", input=input_text)` |
| fireworks_ai/WhereIsAI/UAE-Large-V1 | `response = litellm.embedding(model="fireworks_ai/WhereIsAI/UAE-Large-V1", input=input_text)` |
| fireworks_ai/thenlper/gte-large | `response = litellm.embedding(model="fireworks_ai/thenlper/gte-large", input=input_text)` |
| fireworks_ai/thenlper/gte-base | `response = litellm.embedding(model="fireworks_ai/thenlper/gte-base", input=input_text)` |

## 音訊轉錄 {#audio-transcription}

### 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import transcription
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"
os.environ["FIREWORKS_AI_API_BASE"] = "https://audio-prod.api.fireworks.ai/v1"

response = transcription(
    model="fireworks_ai/whisper-v3",
    audio=audio_file,
)
```

[在 `.transcription` 中傳入 API 金鑰/API Base](../set_keys.md#passing-args-to-completion)

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: whisper-v3
    litellm_params:
      model: fireworks_ai/whisper-v3
      api_base: https://audio-prod.api.fireworks.ai/v1
      api_key: os.environ/FIREWORKS_API_KEY
    model_info:
      mode: audio_transcription
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/audio/transcriptions' \
-H 'Authorization: Bearer sk-1234' \
-F 'file=@"/Users/krrishdholakia/Downloads/gettysburg.wav"' \
-F 'model="whisper-v3"' \
-F 'response_format="verbose_json"' \
```

</TabItem>
</Tabs>

## 重新排序 {#rerank}

### 快速開始 {#quick-start-1}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["FIREWORKS_AI_API_KEY"] = "YOUR_API_KEY"

query = "What is the capital of France?"
documents = [
    "Paris is the capital and largest city of France, home to the Eiffel Tower and the Louvre Museum.",
    "France is a country in Western Europe known for its wine, cuisine, and rich history.",
    "The weather in Europe varies significantly between northern and southern regions.",
    "Python is a popular programming language used for web development and data science.",
]

response = rerank(
    model="fireworks_ai/fireworks/qwen3-reranker-8b",
    query=query,
    documents=documents,
    top_n=3,
    return_documents=True,
)
print(response)
```

[在 `.rerank` 中傳入 API 金鑰/API Base](../set_keys.md#passing-args-to-completion)

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: qwen3-reranker-8b
    litellm_params:
      model: fireworks_ai/fireworks/qwen3-reranker-8b
      api_key: os.environ/FIREWORKS_API_KEY
    model_info:
      mode: rerank
```

2. 啟動 Proxy

```
litellm --config config.yaml
```

3. 測試

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-reranker-8b",
    "query": "What is the capital of France?",
    "documents": [
        "Paris is the capital and largest city of France, home to the Eiffel Tower and the Louvre Museum.",
        "France is a country in Western Europe known for its wine, cuisine, and rich history.",
        "The weather in Europe varies significantly between northern and southern regions.",
        "Python is a popular programming language used for web development and data science."
    ],
    "top_n": 3,
    "return_documents": true
  }'
```

</TabItem>
</Tabs>

### 支援的模型 {#supported-models}

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| fireworks/qwen3-reranker-8b | `rerank(model="fireworks_ai/fireworks/qwen3-reranker-8b", query=query, documents=documents)` |
