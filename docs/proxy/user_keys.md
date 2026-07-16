import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Langchain, OpenAI SDK, LlamaIndex, Instructor, Curl 範例 {#langchain-openai-sdk-llamaindex-instructor-curl-examples}

LiteLLM Proxy 是 **與 OpenAI 相容**，並支援：
* /chat/completions 
* /embeddings
* /completions 
* /image/generations 
* /moderations 
* /audio/transcriptions
* /audio/speech
* [Assistants API 端點](https://docs.litellm.ai/docs/assistants)
* [Batches API 端點](https://docs.litellm.ai/docs/batches)
* [Fine-Tuning API 端點](https://docs.litellm.ai/docs/fine_tuning)

LiteLLM Proxy 是 **與 Azure OpenAI 相容**：
* /chat/completions
* /completions
* /embeddings 

LiteLLM Proxy 是 **與 Anthropic 相容**： 
* /messages 

LiteLLM Proxy 是 **與 Vertex AI 相容**：
- [支援所有 Vertex 端點](../vertex_ai)

本文件涵蓋：

*   /chat/completion
*   /embedding

這些是**選定的範例**。LiteLLM Proxy 是**與 OpenAI 相容**的，適用於任何呼叫 OpenAI 的專案。只要變更 `base_url`、`api_key` 和 `model` 即可。

如需傳遞特定提供者的引數，請[前往此處](https://docs.litellm.ai/docs/completion/provider_specific_params#proxy-usage)

如需捨棄不支援的參數（例如：bedrock 搭配 librechat 時的 frequency_penalty），請[前往此處](https://docs.litellm.ai/docs/completion/drop_params#openai-proxy-usage)

:::info

**所有支援的模型都會將輸入、輸出與例外對應為 OpenAI 格式**

:::

如何將請求傳送至 proxy、傳遞中繼資料、允許使用者傳入自己的 OpenAI API 金鑰

## `/chat/completions` {#chatcompletions}

### 請求格式 {#request-format}

<Tabs>

<TabItem value="openai" label="OpenAI Python v1.0.0+">

將您想傳遞的 `extra_body={"metadata": { }}` 設定為 `metadata`

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ # pass in any provider-specific param, if not supported by openai, https://docs.litellm.ai/docs/completion/input#provider-specific-params
        "metadata": { # 👈 use for logging additional params (e.g. to langfuse)
            "generation_name": "ishaan-generation-openai-client",
            "generation_id": "openai-client-gen-id22",
            "trace_id": "openai-client-trace-id22",
            "trace_user_id": "openai-client-user-id2"
        }
    }
)

print(response)
```
</TabItem>
<TabItem value="litellm_sdk" label="LiteLLM Python SDK">

[**👉 前往此處**](../providers/litellm_proxy#send-all-sdk-requests-to-litellm-proxy)

</TabItem>
<TabItem value="azureopenai" label="AzureOpenAI Python">

將您想傳遞的 `extra_body={"metadata": { }}` 設定為 `metadata`

```python
import openai
client = openai.AzureOpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={ # pass in any provider-specific param, if not supported by openai, https://docs.litellm.ai/docs/completion/input#provider-specific-params
        "metadata": { # 👈 use for logging additional params (e.g. to langfuse)
            "generation_name": "ishaan-generation-openai-client",
            "generation_id": "openai-client-gen-id22",
            "trace_id": "openai-client-trace-id22",
            "trace_user_id": "openai-client-user-id2"
        }
    }
)

print(response)
```
</TabItem>
<TabItem value="LlamaIndex" label="LlamaIndex">

```python
import os, dotenv

from llama_index.llms import AzureOpenAI
from llama_index.embeddings import AzureOpenAIEmbedding
from llama_index import VectorStoreIndex, SimpleDirectoryReader, ServiceContext

llm = AzureOpenAI(
    engine="azure-gpt-3.5",               # model_name on litellm proxy
    temperature=0.0,
    azure_endpoint="http://0.0.0.0:4000", # litellm proxy endpoint
    api_key="sk-1234",                    # litellm proxy API Key
    api_version="2023-07-01-preview",
)

embed_model = AzureOpenAIEmbedding(
    deployment_name="azure-embedding-model",
    azure_endpoint="http://0.0.0.0:4000",
    api_key="sk-1234",
    api_version="2023-07-01-preview",
)


documents = SimpleDirectoryReader("llama_index_data").load_data()
service_context = ServiceContext.from_defaults(llm=llm, embed_model=embed_model)
index = VectorStoreIndex.from_documents(documents, service_context=service_context)

query_engine = index.as_query_engine()
response = query_engine.query("What did the author do growing up?")
print(response)

```
</TabItem>

<TabItem value="Curl" label="Curl Request">

將 `metadata` 作為請求主體的一部分傳入

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "metadata": {
        "generation_name": "ishaan-test-generation",
        "generation_id": "gen-id22",
        "trace_id": "trace-id22",
        "trace_user_id": "user-id2"
    }
}'
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
import os 

os.environ["OPENAI_API_KEY"] = "anything"

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    model = "gpt-3.5-turbo",
    temperature=0.1,
    extra_body={
        "metadata": {
            "generation_name": "ishaan-generation-langchain-client",
            "generation_id": "langchain-client-gen-id22",
            "trace_id": "langchain-client-trace-id22",
            "trace_user_id": "langchain-client-user-id2"
        }
    }
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
<TabItem value="langchain js" label="Langchain JS">

```js
import { ChatOpenAI } from "@langchain/openai";


const model = new ChatOpenAI({
  modelName: "gpt-4",
  openAIApiKey: "sk-1234",
  modelKwargs: {"metadata": "hello world"} // 👈 PASS Additional params here
}, {
  basePath: "http://0.0.0.0:4000",
});

const message = await model.invoke("Hi there!");

console.log(message);

```

</TabItem>
<TabItem value="openai JS" label="OpenAI JS">

```js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "sk-1234", // This is the default and can be omitted
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Say this is a test' }],
    model: 'gpt-3.5-turbo',
  }, {"metadata": {
            "generation_name": "ishaan-generation-openaijs-client",
            "generation_id": "openaijs-client-gen-id22",
            "trace_id": "openaijs-client-trace-id22",
            "trace_user_id": "openaijs-client-user-id2"
        }});
}

main();

```

</TabItem>

<TabItem value="anthropic-py" label="Anthropic Python SDK">

```python
import os

from anthropic import Anthropic

client = Anthropic(
    base_url="http://localhost:4000", # proxy endpoint
    api_key="sk-test-proxy-key-123", # litellm proxy virtual key (example)
)

message = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude",
        }
    ],
    model="claude-3-opus-20240229",
)
print(message.content)
```

</TabItem>

<TabItem value="mistral-py" label="Mistral Python SDK">

```python
import os
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage


client = MistralClient(api_key="sk-1234", endpoint="http://0.0.0.0:4000")
chat_response = client.chat(
    model="mistral-small-latest",
    messages=[
        {"role": "user", "content": "this is a test request, write a short poem"}
    ],
)
print(chat_response.choices[0].message.content)
```

</TabItem>

<TabItem value="instructor" label="Instructor">

```python
from openai import OpenAI
import instructor
from pydantic import BaseModel

my_proxy_api_key = "" # e.g. sk-1234 - LITELLM KEY
my_proxy_base_url = "" # e.g. http://0.0.0.0:4000 - LITELLM PROXY BASE URL

# This enables response_model keyword
# from client.chat.completions.create
## WORKS ACROSS OPENAI/ANTHROPIC/VERTEXAI/ETC. - all LITELLM SUPPORTED MODELS!
client = instructor.from_openai(OpenAI(api_key=my_proxy_api_key, base_url=my_proxy_base_url))

class UserDetail(BaseModel):
    name: str
    age: int

user = client.chat.completions.create(
    model="gemini-pro-flash",
    response_model=UserDetail,
    messages=[
        {"role": "user", "content": "Extract Jason is 25 years old"},
    ]
)

assert isinstance(user, UserDetail)
assert user.name == "Jason"
assert user.age == 25
```
</TabItem>
</Tabs>

## 使用標籤進行分類與追蹤 {#using-tags-for-categorization-and-tracking}

標籤可讓您分類、篩選並追蹤您的 LLM 請求。將標籤加入中繼資料，以便更好地組織與分析。

<Tabs>
<TabItem value="openai-python" label="OpenAI Python">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}],
    extra_body={
        "metadata": {
            "tags": ["production", "customer-support", "urgent"],
            "generation_name": "support-bot",
            "trace_user_id": "user-123"
        }
    }
)
```

</TabItem>

<TabItem value="langchain-python" label="LangChain Python">

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

chat = ChatOpenAI(
    openai_api_base="http://0.0.0.0:4000",
    model="gpt-4o",
    extra_body={
        "metadata": {
            "tags": ["langchain-integration", "content-gen"],
            "trace_user_id": "user-456"
        }
    }
)

response = chat.invoke([HumanMessage(content="Generate a blog post")])
```

</TabItem>

<TabItem value="curl" label="Curl">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "metadata": {
        "tags": ["api-test", "development"],
        "trace_user_id": "test-user"
    }
}'
```

</TabItem>

<TabItem value="openai-js" label="OpenAI JS">

```js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: "sk-1234",
  baseURL: "http://0.0.0.0:4000"
});

async function main() {
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'gpt-3.5-turbo',
    metadata: {
      tags: ["javascript-client", "api-test"],
      trace_user_id: "js-user-789"
    }
  });
}
```

</TabItem>
</Tabs>

### 標籤的優點 {#tag-benefits}

- **成本追蹤**：依專案／團隊／功能監控支出
- **分析**：在記錄與儀表板中依標籤篩選請求  
- **路由**：使用標籤進行條件式模型路由
- **除錯**：以分類過的請求更容易排查問題

### 回應格式 {#response-format}

```json
{
  "id": "chatcmpl-8c5qbGTILZa1S4CK3b31yj5N40hFN",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "As an AI language model, I do not have a physical form or personal preferences. However, I am programmed to assist with various topics and provide information on a wide range of subjects. Is there something specific you would like assistance with?",
        "role": "assistant"
      }
    }
  ],
  "created": 1704089632,
  "model": "gpt-35-turbo",
  "object": "chat.completion",
  "system_fingerprint": null,
  "usage": {
    "completion_tokens": 47,
    "prompt_tokens": 12,
    "total_tokens": 59
  },
  "_response_ms": 1753.426
}

```

### **串流** {#streaming}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $OPTIONAL_YOUR_PROXY_KEY" \
-d '{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "user",
      "content": "this is a test request, write a short poem"
    }
  ],
  "stream": true
}'
```
</TabItem>
<TabItem value="sdk" label="SDK">

```python 
from openai import OpenAI
client = OpenAI(
    api_key="sk-1234", # [OPTIONAL] set if you set one on proxy, else set ""
    base_url="http://0.0.0.0:4000",
)

messages = [{"role": "user", "content": "this is a test request, write a short poem"}]
completion = client.chat.completions.create(
  model="gpt-4o",
  messages=messages,
  stream=True
)

print(completion)

```
</TabItem>
</Tabs>

### 函式呼叫  {#function-calling}

這裡有一些透過 proxy 進行函式呼叫的範例。 

您可以將 proxy 用於**任何**與 openai 相容的專案進行函式呼叫。 

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $OPTIONAL_YOUR_PROXY_KEY" \
-d '{
  "model": "gpt-4-turbo",
  "messages": [
    {
      "role": "user",
      "content": "What'\''s the weather like in Boston today?"
    }
  ],
  "tools": [
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
              "description": "The city and state, e.g. San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"]
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}'
```
</TabItem>
<TabItem value="sdk" label="SDK">

```python 
from openai import OpenAI
client = OpenAI(
    api_key="sk-1234", # [OPTIONAL] set if you set one on proxy, else set ""
    base_url="http://0.0.0.0:4000",
)

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
    }
  }
]
messages = [{"role": "user", "content": "What's the weather like in Boston today?"}]
completion = client.chat.completions.create(
  model="gpt-4o", # use 'model_name' from config.yaml
  messages=messages,
  tools=tools,
  tool_choice="auto"
)

print(completion)

```
</TabItem>
</Tabs>

## `/embeddings` {#embeddings}

### 請求格式 {#request-format-1}
所有支援的模型都會將輸入、輸出與例外對應為 OpenAI 格式

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
import openai
from openai import OpenAI

# set base_url to your proxy server
# set api_key to send to proxy server
client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

response = client.embeddings.create(
    input=["hello from litellm"],
    model="text-embedding-ada-002"
)

print(response)

```
</TabItem>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/embeddings' \
  --header 'Content-Type: application/json' \
  --data ' {
  "model": "text-embedding-ada-002",
  "input": ["write a litellm poem"]
  }'
```
</TabItem>

<TabItem value="langchain-embedding" label="Langchain Embeddings">

```python
from langchain.embeddings import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="sagemaker-embeddings", openai_api_base="http://0.0.0.0:4000", openai_api_key="temp-key")


text = "This is a test document."

query_result = embeddings.embed_query(text)

print(f"SAGEMAKER EMBEDDINGS")
print(query_result[:5])

embeddings = OpenAIEmbeddings(model="bedrock-embeddings", openai_api_base="http://0.0.0.0:4000", openai_api_key="temp-key")

text = "This is a test document."

query_result = embeddings.embed_query(text)

print(f"BEDROCK EMBEDDINGS")
print(query_result[:5])

embeddings = OpenAIEmbeddings(model="bedrock-titan-embeddings", openai_api_base="http://0.0.0.0:4000", openai_api_key="temp-key")

text = "This is a test document."

query_result = embeddings.embed_query(text)

print(f"TITAN EMBEDDINGS")
print(query_result[:5])
```
</TabItem>
</Tabs>

### 回應格式 {#response-format-1}

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        0.0023064255,
        -0.009327292,
        .... 
        -0.0028842222,
      ],
      "index": 0
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}

```

## `/moderations` {#moderations}

### 請求格式 {#request-format-2}
所有支援的模型都會將輸入、輸出與例外對應為 OpenAI 格式

<Tabs>
<TabItem value="openai" label="OpenAI Python v1.0.0+">

```python
import openai
from openai import OpenAI

# set base_url to your proxy server
# set api_key to send to proxy server
client = OpenAI(api_key="<proxy-api-key>", base_url="http://0.0.0.0:4000")

response = client.moderations.create(
    input="hello from litellm",
    model="text-moderation-stable"
)

print(response)

```
</TabItem>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/moderations' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer sk-1234' \
    --data '{"input": "Sample text goes here", "model": "text-moderation-stable"}'
```
</TabItem>
</Tabs>

### 回應格式 {#response-format-2}

```json
{
  "id": "modr-8sFEN22QCziALOfWTa77TodNLgHwA",
  "model": "text-moderation-007",
  "results": [
    {
      "categories": {
        "harassment": false,
        "harassment/threatening": false,
        "hate": false,
        "hate/threatening": false,
        "self-harm": false,
        "self-harm/instructions": false,
        "self-harm/intent": false,
        "sexual": false,
        "sexual/minors": false,
        "violence": false,
        "violence/graphic": false
      },
      "category_scores": {
        "harassment": 0.000019947197870351374,
        "harassment/threatening": 5.5971017900446896e-6,
        "hate": 0.000028560316422954202,
        "hate/threatening": 2.2631787999216613e-8,
        "self-harm": 2.9121162015144364e-7,
        "self-harm/instructions": 9.314219084899378e-8,
        "self-harm/intent": 8.093739012338119e-8,
        "sexual": 0.00004414955765241757,
        "sexual/minors": 0.0000156943697220413,
        "violence": 0.00022354527027346194,
        "violence/graphic": 8.804164281173144e-6
      },
      "flagged": false
    }
  ]
}
```


## 與 OpenAI 相容的專案搭配使用 {#using-with-openai-compatible-projects}
將 `base_url` 設定為 LiteLLM Proxy 伺服器

<Tabs>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="gpt-3.5-turbo", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
])

print(response)

```
</TabItem>
<TabItem value="librechat" label="LibreChat">

#### 啟動 LiteLLM proxy {#start-the-litellm-proxy}
```shell
litellm --model gpt-3.5-turbo

#INFO: Proxy running on http://0.0.0.0:4000
```

#### 1. 複製 repo {#1-clone-the-repo}

```shell
git clone https://github.com/danny-avila/LibreChat.git
```


#### 2. 修改 Librechat 的 `docker-compose.yml` {#2-modify-librechats-docker-composeyml}
LiteLLM Proxy 執行於 `4000` 連接埠，請將下方的 `4000` 設定為 proxy
```yaml
OPENAI_REVERSE_PROXY=http://host.docker.internal:4000/v1/chat/completions
```

#### 3. 在 Librechat 的 `.env` 中儲存假的 OpenAI 金鑰  {#3-save-fake-openai-key-in-librechats-env}

將 Librechat 的 `.env.example` 複製到 `.env`，並覆寫預設的 OPENAI_API_KEY（預設情況下需要使用者提供金鑰）。
```env
OPENAI_API_KEY=sk-1234
```

#### 4. 執行 LibreChat：  {#4-run-librechat}
```shell
docker compose up
```
</TabItem>

<TabItem value="continue-dev" label="ContinueDev">

Continue-Dev 將 ChatGPT 帶入 VSCode。請參閱[如何在此安裝](https://continue.dev/docs/quickstart)。

在 [config.py](https://continue.dev/docs/reference/Models/openai) 中，將此設定為您的預設模型。
```python
  default=OpenAI(
      api_key="IGNORED",
      model="fake-model-name",
      context_length=2048, # customize if needed for your model
      api_base="http://localhost:4000" # your proxy server url
  ),
```

本教學感謝 [@vividfog](https://github.com/ollama/ollama/issues/305#issuecomment-1751848077)。
</TabItem>

<TabItem value="aider" label="Aider">

```shell
$ uv add aider 

$ aider --openai-api-base http://0.0.0.0:4000 --openai-api-key fake-key
```
</TabItem>
<TabItem value="autogen" label="AutoGen">

```python
uv add pyautogen
```

```python
from autogen import AssistantAgent, UserProxyAgent, oai
config_list=[
    {
        "model": "my-fake-model",
        "api_base": "http://localhost:4000",  #litellm compatible endpoint
        "api_type": "open_ai",
        "api_key": "NULL", # just a placeholder
    }
]

response = oai.Completion.create(config_list=config_list, prompt="Hi")
print(response) # works fine

llm_config={
    "config_list": config_list,
}

assistant = AssistantAgent("assistant", llm_config=llm_config)
user_proxy = UserProxyAgent("user_proxy")
user_proxy.initiate_chat(assistant, message="Plot a chart of META and TESLA stock price change YTD.", config_list=config_list)
```

本教學感謝 [@victordibia](https://github.com/microsoft/autogen/issues/45#issuecomment-1749921972)。
</TabItem>

<TabItem value="guidance" label="guidance">
一種用於控制大型語言模型的 guidance 語言。
https://github.com/guidance-ai/guidance

**注意：** Guidance 會傳送額外參數，例如 `stop_sequences`，如果某些模型不支援，可能會導致失敗。 

**修正方式**：使用 `--drop_params` 旗標啟動您的 proxy

```shell
litellm --model ollama/codellama --temperature 0.3 --max_tokens 2048 --drop_params
```

```python
import guidance

# set api_base to your proxy
# set api_key to anything
gpt4 = guidance.llms.OpenAI("gpt-4", api_base="http://0.0.0.0:4000", api_key="anything")

experts = guidance('''
{{#system~}}
You are a helpful and terse assistant.
{{~/system}}

{{#user~}}
I want a response to the following question:
{{query}}
Name 3 world-class experts (past or present) who would be great at answering this?
Don't answer the question yet.
{{~/user}}

{{#assistant~}}
{{gen 'expert_names' temperature=0 max_tokens=300}}
{{~/assistant}}
''', llm=gpt4)

result = experts(query='How can I be more productive?')
print(result)
```
</TabItem>
</Tabs>

## 與 Vertex、Boto3、Anthropic SDK 搭配使用（原生格式） {#using-with-vertex-boto3-anthropic-sdk-native-format}

👉 **[以下是在原生格式中將 litellm proxy 與 Vertex、boto3、Anthropic SDK 搭配使用的方法](../pass_through/vertex_ai.md)**

## 進階 {#advanced}

### （BETA）批次完成 - 傳遞多個模型 {#beta-batch-completions---pass-multiple-models}

當您想對 N 個模型送出 1 個請求時，請使用此功能

#### 預期的請求格式 {#expected-request-format}

將 model 以逗號分隔的模型字串傳入。範例 `"model"="llama3,gpt-3.5-turbo"`

同一個請求會傳送到 [litellm proxy config.yaml](https://docs.litellm.ai/docs/proxy/configs) 上的下列模型群組
- `model_name="llama3"`
- `model_name="gpt-3.5-turbo"` 

<Tabs>

<TabItem value="openai-py" label="OpenAI Python SDK">

```python
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
    model="gpt-3.5-turbo,llama3",
    messages=[
        {"role": "user", "content": "this is a test request, write a short poem"}
    ],
)

print(response)
```


#### 預期的回應格式 {#expected-response-format}

當 `model` 以清單形式傳入時，會取得回應清單

```python
[
    ChatCompletion(
        id='chatcmpl-9NoYhS2G0fswot0b6QpoQgmRQMaIf',
        choices=[
            Choice(
                finish_reason='stop',
                index=0,
                logprobs=None,
                message=ChatCompletionMessage(
                    content='In the depths of my soul, a spark ignites\nA light that shines so pure and bright\nIt dances and leaps, refusing to die\nA flame of hope that reaches the sky\n\nIt warms my heart and fills me with bliss\nA reminder that in darkness, there is light to kiss\nSo I hold onto this fire, this guiding light\nAnd let it lead me through the darkest night.',
                    role='assistant',
                    function_call=None,
                    tool_calls=None
                )
            )
        ],
        created=1715462919,
        model='gpt-3.5-turbo-0125',
        object='chat.completion',
        system_fingerprint=None,
        usage=CompletionUsage(
            completion_tokens=83,
            prompt_tokens=17,
            total_tokens=100
        )
    ),
    ChatCompletion(
        id='chatcmpl-4ac3e982-da4e-486d-bddb-ed1d5cb9c03c',
        choices=[
            Choice(
                finish_reason='stop',
                index=0,
                logprobs=None,
                message=ChatCompletionMessage(
                    content="A test request, and I'm delighted!\nHere's a short poem, just for you:\n\nMoonbeams dance upon the sea,\nA path of light, for you to see.\nThe stars up high, a twinkling show,\nA night of wonder, for all to know.\n\nThe world is quiet, save the night,\nA peaceful hush, a gentle light.\nThe world is full, of beauty rare,\nA treasure trove, beyond compare.\n\nI hope you enjoyed this little test,\nA poem born, of whimsy and jest.\nLet me know, if there's anything else!",
                    role='assistant',
                    function_call=None,
                    tool_calls=None
                )
            )
        ],
        created=1715462919,
        model='groq/llama3-8b-8192',
        object='chat.completion',
        system_fingerprint='fp_a2c8d063cb',
        usage=CompletionUsage(
            completion_tokens=120,
            prompt_tokens=20,
            total_tokens=140
        )
    )
]
```


</TabItem>

<TabItem value="curl" label="Curl">

```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "llama3,gpt-3.5-turbo",
    "max_tokens": 10,
    "user": "litellm2",
    "messages": [
        {
        "role": "user",
        "content": "is litellm getting better"
        }
    ]
}'
```


#### 預期的回應格式 {#expected-response-format-1}

當 `model` 以清單形式傳入時，會取得回應清單

```json
[
  {
    "id": "chatcmpl-3dbd5dd8-7c82-4ca3-bf1f-7c26f497cf2b",
    "choices": [
      {
        "finish_reason": "length",
        "index": 0,
        "message": {
          "content": "The Elder Scrolls IV: Oblivion!\n\nReleased",
          "role": "assistant"
        }
      }
    ],
    "created": 1715459876,
    "model": "groq/llama3-8b-8192",
    "object": "chat.completion",
    "system_fingerprint": "fp_179b0f92c9",
    "usage": {
      "completion_tokens": 10,
      "prompt_tokens": 12,
      "total_tokens": 22
    }
  },
  {
    "id": "chatcmpl-9NnldUfFLmVquFHSX4yAtjCw8PGei",
    "choices": [
      {
        "finish_reason": "length",
        "index": 0,
        "message": {
          "content": "TES4 could refer to The Elder Scrolls IV:",
          "role": "assistant"
        }
      }
    ],
    "created": 1715459877,
    "model": "gpt-3.5-turbo-0125",
    "object": "chat.completion",
    "system_fingerprint": null,
    "usage": {
      "completion_tokens": 10,
      "prompt_tokens": 9,
      "total_tokens": 19
    }
  }
]
```


</TabItem>
</Tabs>
