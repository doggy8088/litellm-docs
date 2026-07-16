import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI（文字完成） {#openai-text-completion}

LiteLLM 支援 OpenAI 文字完成模型

### 必要的 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 用法 {#usage}
```python
import os 
from litellm import completion

os.environ["OPENAI_API_KEY"] = "your-api-key"

# openai call
response = completion(
    model = "gpt-3.5-turbo-instruct", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 OpenAI 模型

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export OPENAI_API_KEY=""
```

### 2. 啟動 proxy  {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo                          # The `openai/` prefix will call openai.chat.completions.create
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-3.5-turbo-instruct
    litellm_params:
      model: text-completion-openai/gpt-3.5-turbo-instruct # The `text-completion-openai/` prefix will call openai.completions.create
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="config-*" label="config.yaml - 代理所有 OpenAI 模型">

使用此方式可用一組 API 金鑰加入所有 openai 模型。**警告：這不會進行負載平衡**
這表示對 `gpt-4`、`gpt-3.5-turbo` 、`gpt-4-turbo-preview` 的請求都會經由此路由

```yaml
model_list:
  - model_name: "*"             # all requests where model not in your config go to this deployment
    litellm_params:
      model: openai/*           # set `openai/` to use the openai route
      api_key: os.environ/OPENAI_API_KEY
```
</TabItem>
<TabItem value="cli" label="CLI">

```bash
$ litellm --model gpt-3.5-turbo-instruct

# Server running on http://0.0.0.0:4000
```
</TabItem>

</Tabs>

### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "gpt-3.5-turbo-instruct",
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
response = client.chat.completions.create(model="gpt-3.5-turbo-instruct", messages = [
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
    model = "gpt-3.5-turbo-instruct",
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

## OpenAI 文字完成模型 / Instruct 模型 {#openai-text-completion-models--instruct-models}

| 模型名稱          | 函式呼叫                                      |
|---------------------|----------------------------------------------------|
| gpt-3.5-turbo-instruct | `response = completion(model="gpt-3.5-turbo-instruct", messages=messages)` |
| gpt-3.5-turbo-instruct-0914 | `response = completion(model="gpt-3.5-turbo-instruct-0914", messages=messages)` |
| text-davinci-003    | `response = completion(model="text-davinci-003", messages=messages)` |
| ada-001             | `response = completion(model="ada-001", messages=messages)` |
| curie-001           | `response = completion(model="curie-001", messages=messages)` |
| babbage-001         | `response = completion(model="babbage-001", messages=messages)` |
| babbage-002         | `response = completion(model="babbage-002", messages=messages)` |
| davinci-002         | `response = completion(model="davinci-002", messages=messages)` |
