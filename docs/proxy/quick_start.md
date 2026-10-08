import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CLI - 快速開始 {#cli---quick-start}

透過 CLI 快速設定 LiteLLM Proxy。

LiteLLM Server（LLM 閘道）管理：

* **統一介面**：以 OpenAI `ChatCompletions` 與 `Completions` 格式呼叫 100+ 個 LLM [Huggingface/Bedrock/TogetherAI/etc.](/docs/proxy/quick_start#supported-llms)
* **成本追蹤**：驗證、花費追蹤與預算 [虛擬金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys)
* **負載平衡**：在同一模型的多個模型 + 部署之間進行 - LiteLLM proxy 在負載測試期間可處理 1.5k+ requests/second。

```shell
$ uv tool install 'litellm[proxy]'
```

:::warning[最低 Python 版本]
LiteLLM 1.84.0 及更新版本需要 Python {{python_min_version}} 或更高版本（`requires-python >={{python_min_version}}`）。`uv tool install` 會透過自動佈建相容的 Python 為您處理這件事。單純的 `pip install 'litellm[proxy]'` 不會；在較舊的解譯器上，pip 會默默解析到最後一個其 `requires-python` 仍允許它的版本（先前下限為 1.83.9），且不會報錯。如果您意外鎖定到舊版本，請檢查 `python --version` 並升級到 {{python_min_version}}+（或使用 uv），然後重新安裝
:::

## 快速入門 - LiteLLM Proxy CLI {#quick-start---litellm-proxy-cli}

執行以下指令以啟動 litellm proxy
```shell
$ litellm --model huggingface/bigcode/starcoder

#INFO: Proxy running on http://0.0.0.0:4000
```


:::info

如果您需要詳細的 debug 記錄，請使用 `--detailed_debug`

```shell
$ litellm --model huggingface/bigcode/starcoder --detailed_debug
```
:::

### 測試 {#test}
在新的 shell 中執行，這會發出一個 `openai.chat.completions` 請求。請確保您使用的是 openai v1.0.0+
```shell
litellm --test
```

這現在會自動將任何對 gpt-3.5-turbo 的請求路由到託管於 huggingface inference endpoints 的 bigcode starcoder。

### 支援的 LLMs {#supported-llms}
LiteLLM 支援的所有 LLM 都支援在 Proxy 上。查看所有 [支援的 llms](https://docs.litellm.ai/docs/providers)
<Tabs>
<TabItem value="bedrock" label="AWS Bedrock">

```shell
$ export AWS_ACCESS_KEY_ID=
$ export AWS_REGION_NAME=
$ export AWS_SECRET_ACCESS_KEY=
```

```shell
$ litellm --model bedrock/us.anthropic.{{anthropic}}
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
$ litellm --model {{openai_small}}
```
</TabItem>
<TabItem value="ollama" label="Ollama">

```
$ litellm --model ollama/<ollama-model-name>
```

</TabItem>
<TabItem value="openai-proxy" label="OpenAI Compatible Endpoint">

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
$ litellm --model vertex_ai/{{gemini_flash}}
```
</TabItem>

<TabItem value="huggingface" label="Huggingface (TGI) Deployed">

```shell
$ export HUGGINGFACE_API_KEY=my-api-key #[OPTIONAL]
```
```shell
$ litellm --model huggingface/<your model name> --api_base <your-api-base> # e.g. http://0.0.0.0:3000
```

</TabItem>
<TabItem value="huggingface-local" label="Huggingface (TGI) Local">

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
$ litellm --model {{anthropic}}
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

<TabItem value="gemini" label="Gemini (Google AI Studio)">

```shell
$ export GEMINI_API_KEY=my-gemini-key
```
```shell
$ litellm --model gemini/{{gemini_flash}}
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

## 快速入門 - LiteLLM Proxy + Config.yaml {#quick-start---litellm-proxy--configyaml}
此設定可讓您建立模型清單並設定 `api_base`、`max_tokens`（所有 litellm 參數）。更多設定細節請見 [這裡](https://docs.litellm.ai/docs/proxy/configs)

### 建立 LiteLLM Proxy 的設定 {#create-a-config-for-litellm-proxy}
設定範例

```yaml
model_list: 
  - model_name: {{openai_small}} # user-facing model alias
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: azure/<your-deployment-name>
      api_base: <your-azure-api-endpoint>
      api_key: <your-azure-api-key>
  - model_name: {{openai_small}}
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
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "{{openai_small}}",
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
response = client.chat.completions.create(model="{{openai_small}}", messages = [
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
    model = "{{openai_small}}",
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

這**不建議**。會有重複邏輯，因為 proxy 也會使用該 sdk，這可能導致未預期的錯誤。 

```python
from litellm import completion 

response = completion(
    model="openai/{{openai_small}}", 
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
    model="{{anthropic}}",
)
print(message.content)
```

</TabItem>

</Tabs>

[**更多資訊**](./configs.md)

## 📖 Proxy 端點 - [Swagger 文件](https://docs.litellm.ai/api-reference/) {#-proxy-endpoints---swagger-docs}
- POST `/chat/completions` - 聊天完成端點，用於呼叫 100+ 個 LLM
- POST `/completions` - 完成端點
- POST `/embeddings` - 用於 Azure、OpenAI、Huggingface 端點的嵌入端點
- GET `/models` - 伺服器上可用的模型
- POST `/key/generate` - 產生可存取 proxy 的金鑰

## Proxy 除錯  {#debugging-proxy}

在正常運作期間發生的事件
```shell
litellm --model {{openai_small}} --debug
```

詳細資訊
```shell
litellm --model {{openai_small}} --detailed_debug
```

### 使用環境變數設定除錯層級 {#set-debug-level-using-env-variables}

在正常運作期間發生的事件
```shell
export LITELLM_LOG=INFO
```

詳細資訊
```shell
export LITELLM_LOG=DEBUG
```

僅錯誤
```shell
export LITELLM_LOG=ERROR
```

`LITELLM_LOG` 必須是有效的 Python logging level（`DEBUG`、`INFO`、`WARNING`、`ERROR`、`CRITICAL`）。將其設為 `None` 會使 `import litellm` 失敗。
