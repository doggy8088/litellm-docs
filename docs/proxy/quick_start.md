import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CLI - 快速開始 {#cli---quick-start}

透過 CLI 快速設定 LiteLLM Proxy。 

LiteLLM Server（LLM 閘道）管理：

* **統一介面**：以 OpenAI `ChatCompletions` 與 `Completions` 格式呼叫 100+ 個 LLM [Huggingface/Bedrock/TogetherAI/etc.](#other-supported-models)
* **成本追蹤**：驗證、支出追蹤與預算 [Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys)
* **負載平衡**：[多個模型](#multiple-models---quick-start) + [相同模型的多個部署](#multiple-instances-of-1-model) 之間 - LiteLLM proxy 在負載測試期間可處理每秒 1.5k+ 個請求。

```shell
$ uv tool install 'litellm[proxy]'
```

## 快速開始 - LiteLLM Proxy CLI {#quick-start---litellm-proxy-cli}

執行以下命令以啟動 litellm proxy
```shell
$ litellm --model huggingface/bigcode/starcoder

#INFO: Proxy running on http://0.0.0.0:4000
```


:::info

若您需要詳細的除錯記錄，請使用 `--detailed_debug` 

```shell
$ litellm --model huggingface/bigcode/starcoder --detailed_debug
:::

### Test
In a new shell, run, this will make an `openai.chat.completions` request. Ensure you're using openai v1.0.0+
```shell
litellm --test
```

這現在會自動將所有對 gpt-3.5-turbo 的請求路由到託管於 huggingface inference endpoints 的 bigcode starcoder。 

### 支援的 LLM {#supported-llms}
LiteLLM 支援的所有 LLM 都支援在 Proxy 上使用。查看所有[支援的 llms](https://docs.litellm.ai/docs/providers)
<Tabs>
<TabItem value="bedrock" label="AWS Bedrock">

```shell
$ export AWS_ACCESS_KEY_ID=
$ export AWS_REGION_NAME=
$ export AWS_SECRET_ACCESS_KEY=
```

```shell
$ litellm --model bedrock/anthropic.claude-v2
```
</TabItem>
<TabItem value="azure" label="Azure OpenAI">

```shell
$ export AZURE_API_KEY=my-api-key
$ export AZURE_API_BASE=my-api-base
```
```
$ litellm --model azure/my-deployment-name
```

</TabItem>
<TabItem value="openai" label="OpenAI">

```shell
$ export OPENAI_API_KEY=my-api-key
```

```shell
$ litellm --model gpt-3.5-turbo
```
</TabItem>
<TabItem value="ollama" label="Ollama">

```
$ litellm --model ollama/<ollama-model-name>
```

</TabItem>
<TabItem value="openai-proxy" label="OpenAI 相容端點">

```shell
$ export OPENAI_API_KEY=my-api-key
```

```shell
$ litellm --model openai/<your model name> --api_base <your-api-base> # e.g. http://0.0.0.0:3000
```
</TabItem>

<TabItem value="vertex-ai" label="Vertex AI [Gemini]">

```shell
$ export VERTEX_PROJECT="hardy-project"
$ export VERTEX_LOCATION="us-west"
```

```shell
$ litellm --model vertex_ai/gemini-pro
```
</TabItem>

<TabItem value="huggingface" label="已部署的 Huggingface (TGI)">

```shell
$ export HUGGINGFACE_API_KEY=my-api-key #[OPTIONAL]
```
```shell
$ litellm --model huggingface/<your model name> --api_base <your-api-base> # e.g. http://0.0.0.0:3000
```

</TabItem>
<TabItem value="huggingface-local" label="本機 Huggingface (TGI)">

```shell
$ litellm --model huggingface/<your model name> --api_base http://0.0.0.0:8001
```

</TabItem>
<TabItem value="aws-sagemaker" label="AWS Sagemaker">

```shell
export AWS_ACCESS_KEY_ID=
export AWS_REGION_NAME=
export AWS_SECRET_ACCESS_KEY=
```

```shell
$ litellm --model sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b
```

</TabItem>
<TabItem value="anthropic" label="Anthropic">

```shell
$ export ANTHROPIC_API_KEY=my-api-key
```
```shell
$ litellm --model claude-instant-1
```

</TabItem>
<TabItem value="vllm-local" label="VLLM">
假設您是在本機執行 vllm

```shell
$ litellm --model vllm/facebook/opt-125m
```
</TabItem>
<TabItem value="together_ai" label="TogetherAI">

```shell
$ export TOGETHERAI_API_KEY=my-api-key
```
```shell
$ litellm --model together_ai/lmsys/vicuna-13b-v1.5-16k
```

</TabItem>

<TabItem value="replicate" label="Replicate">

```shell
$ export REPLICATE_API_KEY=my-api-key
```
```shell
$ litellm \
  --model replicate/meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3
```

</TabItem>

<TabItem value="petals" label="Petals">

```shell
$ litellm --model petals/meta-llama/Llama-2-70b-chat-hf
```

</TabItem>

<TabItem value="palm" label="Palm">

```shell
$ export PALM_API_KEY=my-palm-key
```
```shell
$ litellm --model palm/chat-bison
```

</TabItem>

<TabItem value="ai21" label="AI21">

```shell
$ export AI21_API_KEY=my-api-key
```

```shell
$ litellm --model j2-light
```

</TabItem>

<TabItem value="cohere" label="Cohere">

```shell
$ export COHERE_API_KEY=my-api-key
```

```shell
$ litellm --model command-nightly
```

</TabItem>

</Tabs>

## 快速開始 - LiteLLM Proxy + Config.yaml {#quick-start---litellm-proxy--configyaml}
此設定讓您可以建立模型清單並設定 `api_base`、`max_tokens`（所有 litellm 參數）。關於設定的更多詳細資訊請見[這裡](https://docs.litellm.ai/docs/proxy/configs)

### 為 LiteLLM Proxy 建立設定 {#create-a-config-for-litellm-proxy}
設定範例

```yaml
model_list: 
  - model_name: gpt-3.5-turbo # user-facing model alias
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: azure/<your-deployment-name>
      api_base: <your-azure-api-endpoint>
      api_key: <your-azure-api-key>
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-turbo-small-ca
      api_base: https://my-endpoint-canada-berri992.openai.azure.com/
      api_key: <your-azure-api-key>
  - model_name: vllm-model
    litellm_params:
      model: openai/<your-model-name>
      api_base: <your-vllm-api-base> # e.g. http://0.0.0.0:3000/v1
      api_key: <your-vllm-api-key|none>
```

### 使用設定執行 proxy {#run-proxy-with-config}

```shell
litellm --config your_config.yaml
```


## 使用 LiteLLM Proxy - Curl 請求、OpenAI 套件、Langchain {#using-litellm-proxy---curl-request-openai-package-langchain}

:::info
LiteLLM 與多個 SDK 相容 - 包括 OpenAI SDK、Anthropic SDK、Mistral SDK、LLamaIndex、Langchain（Js、Python）

[更多範例請見這裡](user_keys)
:::

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "gpt-3.5-turbo",
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
response = client.chat.completions.create(model="gpt-3.5-turbo", messages = [
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
    model = "gpt-3.5-turbo",
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
<TabItem value="litellm" label="LiteLLM SDK">

這**不建議**。由於 proxy 也會使用此 SDK，因此存在重複邏輯，這可能導致非預期錯誤。 

```python
from litellm import completion 

response = completion(
    model="openai/gpt-3.5-turbo", 
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ], 
    api_key="anything", 
    base_url="http://0.0.0.0:4000"
    )

print(response)

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

</Tabs>

[**更多資訊**](./configs.md)

## 📖 Proxy 端點 - [Swagger 文件](https://litellm-api.up.railway.app/) {#-proxy-endpoints---swagger-docshttpslitellm-apiuprailwayapp}
- POST `/chat/completions` - 呼叫 100+ 個 LLM 的聊天完成端點
- POST `/completions` - 完成端點
- POST `/embeddings` - Azure、OpenAI、Huggingface 端點的嵌入端點
- GET `/models` - 伺服器上的可用模型
- POST `/key/generate` - 產生用於存取 proxy 的金鑰

## 除錯 Proxy  {#debugging-proxy}

正常運作期間發生的事件
```shell
litellm --model gpt-3.5-turbo --debug
```

詳細資訊
```shell
litellm --model gpt-3.5-turbo --detailed_debug
```

### 使用環境變數設定除錯等級 {#set-debug-level-using-env-variables}

正常運作期間發生的事件
```shell
export LITELLM_LOG=INFO
```

詳細資訊
```shell
export LITELLM_LOG=DEBUG
```

沒有記錄
```shell
export LITELLM_LOG=None
```
