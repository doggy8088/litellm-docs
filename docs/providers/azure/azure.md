import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure OpenAI {#azure-openai}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure OpenAI Service 提供 REST API 存取 OpenAI 強大的語言模型，包括 o1、o1-mini、GPT-5、GPT-4o、GPT-4o mini、GPT-4 Turbo with Vision、GPT-4、GPT-3.5-Turbo，以及 Embeddings 模型系列。也透過 Azure Foundry 支援 Claude 模型。 |
| LiteLLM 提供者路由 | `azure/`, [`azure/o_series/`](#o-series-models), [`azure/gpt5_series/`](#gpt-5-models), [`azure/claude-*`](./azure_anthropic)（透過 Azure Foundry 的 Claude 模型） |
| 支援的操作 | [`/chat/completions`](#azure-openai-chat-completion-models), [`/responses`](./azure_responses), [`/completions`](#azure-instruct-models), [`/embeddings`](./azure_embedding), [`/audio/speech`](azure_speech), [`/audio/transcriptions`](../../audio_transcription), `/fine_tuning`, [`/batches`](#azure-batches-api), `/files`, [`/images`](../../image_generation#azure-openai-image-generation-models), [`/anthropic/v1/messages`](./azure_anthropic) |
| 提供者文件連結 | [Azure OpenAI ↗](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview), [Azure Foundry Claude ↗](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-claude)

## API 金鑰、參數 {#api-keys-params}
api_key、api_base、api_version 等可以直接傳遞給 `litellm.completion` - 請參見此處，或將其設為 `litellm.api_key` 參數，請參見此處
```python
import os
os.environ["AZURE_API_KEY"] = "" # "my-azure-api-key"
os.environ["AZURE_API_BASE"] = "" # "https://example-endpoint.openai.azure.com"
os.environ["AZURE_API_VERSION"] = "" # "2023-05-15"

# optional
os.environ["AZURE_AD_TOKEN"] = ""
os.environ["AZURE_API_TYPE"] = ""
```

:::info Azure Foundry Claude Models

Azure 也透過 Azure Foundry 支援 Claude 模型。請使用 `azure/claude-*` 模型名稱（例如 `azure/claude-sonnet-4-5`）並搭配 Azure 驗證。詳情請參見 [Azure Anthropic 文件](./azure_anthropic)。

:::

## **使用方式 - LiteLLM Python SDK** {#usage---litellm-python-sdk}
<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_Azure_OpenAI.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

### Completion - 使用 .env 變數 {#completion---using-env-variables}

```python
from litellm import completion

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

# azure call
response = completion(
    model = "azure/<your_deployment_name>", 
    messages = [{ "content": "Hello, how are you?","role": "user"}]
)
```

### Completion - 使用 api_key、api_base、api_version {#completion---using-api_key-api_base-api_version}

```python
import litellm

# azure call
response = litellm.completion(
    model = "azure/<your deployment name>",             # model = azure/<your deployment name> 
    api_base = "",                                      # azure api base
    api_version = "",                                   # azure api version
    api_key = "",                                       # azure api key
    messages = [{"role": "user", "content": "good morning"}],
)
```

### Completion - 使用 azure_ad_token、api_base、api_version {#completion---using-azure_ad_token-api_base-api_version}

```python
import litellm

# azure call
response = litellm.completion(
    model = "azure/<your deployment name>",             # model = azure/<your deployment name> 
    api_base = "",                                      # azure api base
    api_version = "",                                   # azure api version
    azure_ad_token="", 									# azure_ad_token 
    messages = [{"role": "user", "content": "good morning"}],
)
```


## **使用方式 - LiteLLM Proxy Server** {#usage---litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Azure OpenAI 模型

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export AZURE_API_KEY=""
```

### 2. 啟動 proxy  {#2-start-the-proxy}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      api_key: os.environ/AZURE_API_KEY # The `os.environ/` prefix tells litellm to read this from the env.
```

### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

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
</Tabs>

### 設定 API 版本 {#setting-api-version}

您可以透過以下方式在 proxy config.yaml 中設定 Azure OpenAI 的 `api_version`

#### 選項 1：每個模型的設定 {#option-1-per-model-configuration}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/my-gpt4-deployment
      api_base: https://your-resource.openai.azure.com/
      api_version: "2024-08-01-preview"  # Set version per model
      api_key: os.environ/AZURE_API_KEY
```


## Azure OpenAI Chat Completion 模型 {#azure-openai-chat-completion-models}

:::tip

**我們支援所有 Azure 模型，只要在送出 litellm 請求時將 `model=azure/<your deployment name>` 設為前綴即可**

:::

| 模型名稱       | 函式呼叫                          |
|------------------|----------------------------------------|
| o1-mini | `response = completion(model="azure/<your deployment name>", messages=messages)` |
| o1-preview | `response = completion(model="azure/<your deployment name>", messages=messages)` |
| gpt-5 | `response = completion(model="azure/<your deployment name>", messages=messages)` |
| gpt-4o-mini            | `completion('azure/<your deployment name>', messages)`         |
| gpt-4o            | `completion('azure/<your deployment name>', messages)`         |
| gpt-4            | `completion('azure/<your deployment name>', messages)`         |
| gpt-4-0314            | `completion('azure/<your deployment name>', messages)`         | 
| gpt-4-0613            | `completion('azure/<your deployment name>', messages)`         |
| gpt-4-32k            | `completion('azure/<your deployment name>', messages)`         | 
| gpt-4-32k-0314            | `completion('azure/<your deployment name>', messages)`         |
| gpt-4-32k-0613            | `completion('azure/<your deployment name>', messages)`         | 
| gpt-4-1106-preview            | `completion('azure/<your deployment name>', messages)`         | 
| gpt-4-0125-preview            | `completion('azure/<your deployment name>', messages)`         | 
| gpt-3.5-turbo    | `completion('azure/<your deployment name>', messages)` |
| gpt-3.5-turbo-0301    | `completion('azure/<your deployment name>', messages)` |
| gpt-3.5-turbo-0613    | `completion('azure/<your deployment name>', messages)` |
| gpt-3.5-turbo-16k    | `completion('azure/<your deployment name>', messages)` |
| gpt-3.5-turbo-16k-0613    | `completion('azure/<your deployment name>', messages)`

## Azure OpenAI Vision 模型  {#azure-openai-vision-models}
| 模型名稱            | 函式呼叫                                                   |
|-----------------------|-----------------------------------------------------------------|
| gpt-4-vision   | `completion(model="azure/<your deployment name>", messages=messages)` |
| gpt-4o            | `completion('azure/<your deployment name>', messages)`         |

#### 使用方式 {#usage}
```python
import os 
from litellm import completion

os.environ["AZURE_API_KEY"] = "your-api-key"

# azure call
response = completion(
    model = "azure/<your deployment name>", 
    messages=[
        {
            "role": "user",
            "content": [
                            {
                                "type": "text",
                                "text": "What’s in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                "url": "https://awsmp-logos.s3.amazonaws.com/seller-xw5kijmvmzasy/c233c9ade2ccb5491072ae232c814942.png"
                                }
                            }
                        ]
        }
    ],
)

```

#### 使用方式 - 搭配 Azure Vision 增強功能 {#usage---with-azure-vision-enhancements}

注意：**Azure 需要將 `base_url` 設定為 `/extensions`** 

範例 
```python
base_url=https://gpt-4-vision-resource.openai.azure.com/openai/deployments/gpt-4-vision/extensions
# base_url="{azure_endpoint}/openai/deployments/{azure_deployment}/extensions"
```

**使用方式**
```python
import os 
from litellm import completion

os.environ["AZURE_API_KEY"] = "your-api-key"

# azure call
response = completion(
            model="azure/gpt-4-vision",
            timeout=5,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Whats in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "https://avatars.githubusercontent.com/u/29436595?v=4"
                            },
                        },
                    ],
                }
            ],
            base_url="https://gpt-4-vision-resource.openai.azure.com/openai/deployments/gpt-4-vision/extensions",
            api_key=os.getenv("AZURE_VISION_API_KEY"),
            enhancements={"ocr": {"enabled": True}, "grounding": {"enabled": True}},
            dataSources=[
                {
                    "type": "AzureComputerVision",
                    "parameters": {
                        "endpoint": "https://gpt-4-vision-enhancement.cognitiveservices.azure.com/",
                        "key": os.environ["AZURE_VISION_ENHANCE_KEY"],
                    },
                }
            ],
)
```

## O-Series 模型 {#o-series-models}

LiteLLM 支援 Azure OpenAI O-Series 模型。 

LiteLLM 會將任何模型名稱中包含 `o1` 或 `o3` 的部署名稱，路由到 O-Series [轉換](https://github.com/BerriAI/litellm/blob/91ed05df2962b8eee8492374b048d27cc144d08c/litellm/llms/azure/chat/o1_transformation.py#L4) 邏輯。

若要明確設定，請將 `model` 設為 `azure/o_series/<your-deployment-name>`。

**自動路由**

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

litellm.completion(model="azure/my-o3-deployment", messages=[{"role": "user", "content": "Hello, world!"}]) # 👈 Note: 'o3' in the deployment name
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: o3-mini
    litellm_params:
      model: azure/o3-model
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
```

</TabItem>
</Tabs>

**明確路由**

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

litellm.completion(model="azure/o_series/my-random-deployment-name", messages=[{"role": "user", "content": "Hello, world!"}]) # 👈 Note: 'o_series/' in the deployment name
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: o3-mini
    litellm_params:
      model: azure/o_series/my-random-deployment-name
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
```
</TabItem>
</Tabs>

## GPT-5 模型 {#gpt-5-models}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure OpenAI GPT-5 models |
| LiteLLM 提供者路由 | `azure/gpt5_series/<custom-name>` or `azure/gpt-5-deployment-name` |

LiteLLM 支援以下兩種方式使用 Azure GPT-5 模型：
1. 明確路由：`model = azure/gpt5_series/<deployment-name>`。在此情況下，導入 litellm 的模型格式為 `model=azure/gpt5_series/<deployment-name>`。
2. 推斷路由（如果 azure 部署名稱中包含 `gpt-5`）：`model = azure/gpt-5-mini`。在此情況下，導入 litellm 的模型格式為 `model=azure/gpt-5-mini`。

#### 明確路由 {#explicit-routing}
請使用 `azure/gpt5_series/<deployment-name>` 進行明確的 GPT-5 模型路由。 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

response = litellm.completion(
    model="azure/gpt5_series/my-gpt-5-deployment",
    messages=[{"role": "user", "content": "Hello, world!"}]
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-5
    litellm_params:
      model: azure/gpt5_series/my-gpt-5-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
```

</TabItem>
</Tabs>

#### 推斷路由（部署名稱中包含 gpt-5） {#inferred-routing-gpt-5-in-the-deployment-name}
如果您的 Azure 部署名稱包含 `gpt-5`，LiteLLM 會自動將其辨識為 GPT-5 模型。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

# Deployment name contains 'gpt-5' - automatically inferred
response = litellm.completion(
    model="azure/my-gpt-5-deployment", 
    messages=[{"role": "user", "content": "Hello, world!"}]
)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```yaml
model_list:
  - model_name: gpt-5-mini
    litellm_params:
      model: azure/my-gpt-5-deployment  # deployment name contains 'gpt-5'
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
```

</TabItem>
</Tabs>

## Azure 音訊模型 {#azure-audio-model}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

response = completion(
    model="azure/azure-openai-4o-audio",
    messages=[
      {
        "role": "user",
        "content": "I want to try out speech to speech"
      }
    ],
    modalities=["text","audio"],
    audio={"voice": "alloy", "format": "wav"}
)

print(response)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: azure-openai-4o-audio
    litellm_params:
      model: azure/azure-openai-4o-audio
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: os.environ/AZURE_API_VERSION
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-openai-4o-audio",
    "messages": [{"role": "user", "content": "I want to try out speech to speech"}],
    "modalities": ["text","audio"],
    "audio": {"voice": "alloy", "format": "wav"}
  }'
```


</TabItem>
</Tabs>

## Azure Instruct 模型 {#azure-instruct-models}

請使用 `model="azure_text/<your-deployment>"`

| 模型名稱          | 函式呼叫                                      |
|---------------------|----------------------------------------------------|
| gpt-3.5-turbo-instruct | `response = completion(model="azure_text/<your deployment name>", messages=messages)` |
| gpt-3.5-turbo-instruct-0914 | `response = completion(model="azure_text/<your deployment name>", messages=messages)` |

```python
import litellm

## set ENV variables
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

response = litellm.completion(
    model="azure_text/<your-deployment-name",
    messages=[{"role": "user", "content": "What is the weather like in Boston?"}]
)

print(response)
```

## **驗證** {#authentication}

### Entra ID - 使用 `azure_ad_token` {#entra-id---use-azure_ad_token}

這是一個關於如何使用 Azure Active Directory Tokens - Microsoft Entra ID 來進行 `litellm.completion()` 呼叫的操作說明。  
> **注意：** 您可以遵循下方相同步驟，使用 Azure Active Directory Tokens 搭配 LiteLLM 來處理所有其他 Azure 端點（例如 chat、embeddings、image、audio 等）。

Step 1 - 下載 Azure CLI 
安裝說明： https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
```shell
brew update && brew install azure-cli
```
步驟 2 - 使用 `az` 登入
```shell
az login --output table
```

步驟 3 - 產生 azure ad token
```shell
az account get-access-token --resource https://cognitiveservices.azure.com
```

在這個步驟中，您應該會看到已產生一個 `accessToken`
```shell
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSIsImtpZCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSJ9",
  "expiresOn": "2023-11-14 15:50:46.000000",
  "expires_on": 1700005846,
  "subscription": "db38de1f-4bb3..",
  "tenant": "bdfd79b3-8401-47..",
  "tokenType": "Bearer"
}
```

步驟 4 - 使用 Azure AD token 進行 litellm.completion 請求

設定 `azure_ad_token` = `accessToken`（來自步驟 3）或設定 `os.environ['AZURE_AD_TOKEN']`

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = litellm.completion(
    model = "azure/<your deployment name>",             # model = azure/<your deployment name> 
    api_base = "",                                      # azure api base
    api_version = "",                                   # azure api version
    azure_ad_token="", 									# your accessToken from step 3 
    messages = [{"role": "user", "content": "good morning"}],
)

```

</TabItem>
<TabItem value="proxy" label="PROXY config.yaml">

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      azure_ad_token: os.environ/AZURE_AD_TOKEN
```

</TabItem>
</Tabs>

### Entra ID - 使用 tenant_id、client_id、client_secret {#entra-id---use-tenant_id-client_id-client_secret}

以下是將 `tenant_id`、`client_id`、`client_secret` 設定到您的 litellm proxy `config.yaml` 的範例
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      client_secret: os.environ/AZURE_CLIENT_SECRET
      azure_scope: os.environ/AZURE_SCOPE  # defaults to "https://cognitiveservices.azure.com/.default"
```

測試它

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

使用 `tenant_id`、`client_id`、`client_secret` 搭配 LiteLLM Proxy Server 的示範影片

<iframe width="840" height="500" src="https://www.loom.com/embed/70d3f219ee7f4e5d84778b7f17bba506?sid=04b8ff29-485f-4cb8-929e-6b392722f36d" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

### Entra ID - 使用 client_id、username、password {#entra-id---use-client_id-username-password}

以下是將 `client_id`、`azure_username`、`azure_password` 設定到您的 litellm proxy `config.yaml` 的範例
```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      client_id: os.environ/AZURE_CLIENT_ID
      azure_username: os.environ/AZURE_USERNAME
      azure_password: os.environ/AZURE_PASSWORD
      azure_scope: os.environ/AZURE_SCOPE  # defaults to "https://cognitiveservices.azure.com/.default"
```

測試它

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


### Azure AD 權杖重新整理 - `DefaultAzureCredential` {#azure-ad-token-refresh---defaultazurecredential}

如果您想在請求上使用 Azure `DefaultAzureCredential` 進行驗證，請使用此項。`DefaultAzureCredential` 會自動從多個來源探索並使用可用的 Azure 憑證。

<Tabs>
<TabItem value="sdk" label="SDK">

**選項 1：明確指定 DefaultAzureCredential（建議）**
```python
from litellm import completion
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

# DefaultAzureCredential automatically discovers credentials from:
# - Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
# - Managed Identity (AKS, Azure VMs, etc.)
# - Azure CLI credentials
# - And other Azure identity sources
token_provider = get_bearer_token_provider(DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default")

response = completion(
    model = "azure/<your deployment name>",             # model = azure/<your deployment name> 
    api_base = "",                                      # azure api base
    api_version = "",                                   # azure api version
    azure_ad_token_provider=token_provider,
    messages = [{"role": "user", "content": "good morning"}],
)
```

**選項 2：LiteLLM 自動回退到 DefaultAzureCredential**
```python
import litellm

# Enable automatic fallback to DefaultAzureCredential
litellm.enable_azure_ad_token_refresh = True

response = litellm.completion(
    model = "azure/<your deployment name>",
    api_base = "",
    api_version = "",
    messages = [{"role": "user", "content": "good morning"}],
)
```

</TabItem>
<TabItem value="proxy" label="PROXY config.yaml">

**情境 1：使用環境變數（傳統方式）**

1. 新增相關的環境變數

```bash
export AZURE_TENANT_ID=""
export AZURE_CLIENT_ID=""
export AZURE_CLIENT_SECRET=""
```

2. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/your-deployment-name
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/

litellm_settings:
    enable_azure_ad_token_refresh: true # 👈 KEY CHANGE
```

**情境 2：受控身分識別（AKS、Azure VM）- 不需要硬編碼憑證**

非常適合 AKS 叢集、Azure VM，或其他 Azure 會自動注入憑證的受控環境。

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/your-deployment-name
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/

litellm_settings:
    enable_azure_ad_token_refresh: true # 👈 KEY CHANGE
```

**情境 3：Azure CLI 驗證**

如果您是透過 `az login` 完成驗證，則不需要額外設定：

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/your-deployment-name
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/

litellm_settings:
    enable_azure_ad_token_refresh: true # 👈 KEY CHANGE
```

3. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

**運作方式**： 
- LiteLLM 會先嘗試 Service Principal 驗證（如果可用環境變數）
- 如果失敗，會自動回退到 `DefaultAzureCredential`
- `DefaultAzureCredential` 會使用 Managed Identity、Azure CLI 憑證，或其他可用的 Azure 身分來源
- 這樣就不需要在 AKS 之類的受控環境中硬編碼憑證

</TabItem>
</Tabs>

## **Azure Batches API** {#azure-batches-api}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure OpenAI Batches API |
| LiteLLM 上的 `custom_llm_provider` | `azure/` |
| 支援的操作 | `/v1/batches`、`/v1/files` |
| Azure OpenAI Batches API | [Azure OpenAI Batches API ↗](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/batch) |
| 成本追蹤、記錄支援 | ✅ LiteLLM 會記錄、追蹤 Batch API 請求的成本 |

### 快速開始 {#quick-start}

只要將 azure 環境變數加入您的環境中即可。 

```bash
export AZURE_API_KEY=""
export AZURE_API_BASE=""
```

<Tabs>
<TabItem value="proxy" label="LiteLLM PROXY Server">

**1. 上傳檔案**

<Tabs>
<TabItem value="sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize the client
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-api-key"
)

batch_input_file = client.files.create(
    file=open("mydata.jsonl", "rb"),
    purpose="batch",
    extra_headers={"custom-llm-provider": "azure"}
)
file_id = batch_input_file.id
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer sk-1234" \
    -F purpose="batch" \
    -F file="@mydata.jsonl"
```

</TabItem>
</Tabs>

**檔案格式範例**
```json
{"custom_id": "task-0", "method": "POST", "url": "/chat/completions", "body": {"model": "REPLACE-WITH-MODEL-DEPLOYMENT-NAME", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "When was Microsoft founded?"}]}}
{"custom_id": "task-1", "method": "POST", "url": "/chat/completions", "body": {"model": "REPLACE-WITH-MODEL-DEPLOYMENT-NAME", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "When was the first XBOX released?"}]}}
{"custom_id": "task-2", "method": "POST", "url": "/chat/completions", "body": {"model": "REPLACE-WITH-MODEL-DEPLOYMENT-NAME", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "What is Altair Basic?"}]}}
```

**2. 建立 Batch 請求**

<Tabs>
<TabItem value="sdk" label="OpenAI Python SDK">

```python
batch = client.batches.create( # re use client from above
    input_file_id=file_id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"description": "My batch job"},
    extra_headers={"custom-llm-provider": "azure"}
)
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```
</TabItem>
</Tabs>

**3. 取得 Batch**

<Tabs>
<TabItem value="sdk" label="OpenAI Python SDK">

```python
retrieved_batch = client.batches.retrieve(
    batch.id,
    extra_headers={"custom-llm-provider": "azure"}
)
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/batches/batch_abc123 \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
```

</TabItem>
</Tabs>

**4. 取消 Batch**

<Tabs>
<TabItem value="sdk" label="OpenAI Python SDK">

```python
cancelled_batch = client.batches.cancel(
    batch.id,
    extra_headers={"custom-llm-provider": "azure"}
)
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/batches/batch_abc123/cancel \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST
```

</TabItem>
</Tabs>

**5. 列出 Batch**

<Tabs>
<TabItem value="sdk" label="OpenAI Python SDK">

```python
client.batches.list(extra_headers={"custom-llm-provider": "azure"})
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/batches?limit=2 \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json"
```
</TabItem>
</Tabs>
</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

**1. 建立用於 Batch Completion 的檔案**

```python
from litellm
import os 

os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""

file_name = "azure_batch_completions.jsonl"
_current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(_current_dir, file_name)
file_obj = await litellm.acreate_file(
    file=open(file_path, "rb"),
    purpose="batch",
    custom_llm_provider="azure",
)
print("Response from creating file=", file_obj)
```

**2. 建立 Batch 請求**

```python
create_batch_response = await litellm.acreate_batch(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id=batch_input_file_id,
    custom_llm_provider="azure",
    metadata={"key1": "value1", "key2": "value2"},
)

print("response from litellm.create_batch=", create_batch_response)
```

**3. 取得 Batch 和檔案內容**

```python
retrieved_batch = await litellm.aretrieve_batch(
    batch_id=create_batch_response.id, 
    custom_llm_provider="azure"
)
print("retrieved batch=", retrieved_batch)

# Get file content
file_content = await litellm.afile_content(
    file_id=batch_input_file_id, 
    custom_llm_provider="azure"
)
print("file content = ", file_content)
```

**4. 列出 Batch**

```python
list_batches_response = litellm.list_batches(
    custom_llm_provider="azure", 
    limit=2
)
print("list_batches_response=", list_batches_response)
```

</TabItem>
</Tabs>

### [健康檢查 Azure Batch models](../../proxy/health.md#batch-models-azure-only) {#health-check-azure-batch-modelsproxyhealthmdbatch-models-azure-only}

### [BETA] 對多個 Azure 部署進行負載平衡 {#beta-loadbalance-multiple-azure-deployments}
在您的 config.yaml 中，設定 `enable_loadbalancing_on_batch_endpoints: true`

```yaml
model_list:
  - model_name: "batch-gpt-4o-mini"
    litellm_params:
      model: "azure/gpt-4o-mini"
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      mode: batch

litellm_settings:
  enable_loadbalancing_on_batch_endpoints: true # 👈 KEY CHANGE
```

注意：這可在 `{PROXY_BASE_URL}/v1/files` 和 `{PROXY_BASE_URL}/v1/batches` 上運作。
注意：回應為 OpenAI 格式。 

1. 上傳檔案 

只要在您的 .jsonl 中設定 `model: batch-gpt-4o-mini` 即可。

```bash
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer sk-1234" \
    -F purpose="batch" \
    -F file="@mydata.jsonl"
```

**檔案範例**

注意：`model` 應該是您的 azure 部署名稱。

```json
{"custom_id": "task-0", "method": "POST", "url": "/chat/completions", "body": {"model": "batch-gpt-4o-mini", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "When was Microsoft founded?"}]}}
{"custom_id": "task-1", "method": "POST", "url": "/chat/completions", "body": {"model": "batch-gpt-4o-mini", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "When was the first XBOX released?"}]}}
{"custom_id": "task-2", "method": "POST", "url": "/chat/completions", "body": {"model": "batch-gpt-4o-mini", "messages": [{"role": "system", "content": "You are an AI assistant that helps people find information."}, {"role": "user", "content": "What is Altair Basic?"}]}}
```

預期回應（相容 OpenAI）

```bash
{"id":"file-f0be81f654454113a922da60acb0eea6",...}
```

2. 建立 batch 

```bash
curl http://0.0.0.0:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-f0be81f654454113a922da60acb0eea6",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h",
    "model: "batch-gpt-4o-mini"
  }'
```

預期回應： 

```bash
{"id":"batch_94e43f0a-d805-477d-adf9-bbb9c50910ed",...}
```

3. 取得 batch 

```bash
curl http://0.0.0.0:4000/v1/batches/batch_94e43f0a-d805-477d-adf9-bbb9c50910ed \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
```


預期回應： 

```
{"id":"batch_94e43f0a-d805-477d-adf9-bbb9c50910ed",...}
```

4. 列出 batch

```bash
curl http://0.0.0.0:4000/v1/batches?limit=2 \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json"
```

預期回應：

```bash
{"data":[{"id":"batch_R3V...}
```

## 進階 {#advanced}
### Azure API 負載平衡 {#azure-api-load-balancing}

如果您要在多個 Azure/OpenAI 部署之間進行負載平衡，請使用此項。 

`Router` 會透過選擇低於速率限制且已使用 token 數量最少的部署，來避免請求失敗。 

在正式環境中，[Router 會連接到 Redis 快取](#redis-queue) 以追蹤多個部署之間的使用量。

#### 快速開始 {#quick-start-1}

```python
uv add litellm
```

```python
from litellm import Router

model_list = [{ # list of model deployments 
	"model_name": "gpt-3.5-turbo", # openai model name 
	"litellm_params": { # params for litellm completion/embedding call 
		"model": "azure/chatgpt-v-2", 
		"api_key": os.getenv("AZURE_API_KEY"),
		"api_version": os.getenv("AZURE_API_VERSION"),
		"api_base": os.getenv("AZURE_API_BASE")
	},
	"tpm": 240000,
	"rpm": 1800
}, {
    "model_name": "gpt-3.5-turbo", # openai model name 
	"litellm_params": { # params for litellm completion/embedding call 
		"model": "azure/chatgpt-functioncalling", 
		"api_key": os.getenv("AZURE_API_KEY"),
		"api_version": os.getenv("AZURE_API_VERSION"),
		"api_base": os.getenv("AZURE_API_BASE")
	},
	"tpm": 240000,
	"rpm": 1800
}, {
    "model_name": "gpt-3.5-turbo", # openai model name 
	"litellm_params": { # params for litellm completion/embedding call 
		"model": "gpt-3.5-turbo", 
		"api_key": os.getenv("OPENAI_API_KEY"),
	},
	"tpm": 1000000,
	"rpm": 9000
}]

router = Router(model_list=model_list)

# openai.chat.completions.create replacement
response = router.completion(model="gpt-3.5-turbo", 
				messages=[{"role": "user", "content": "Hey, how's it going?"}]

print(response)
```

#### Redis 佇列 {#redis-queue}

```python
router = Router(model_list=model_list, 
                redis_host=os.getenv("REDIS_HOST"), 
                redis_password=os.getenv("REDIS_PASSWORD"), 
                redis_port=os.getenv("REDIS_PORT"))

print(response)
```


### 工具呼叫 / Function Calling {#tool-calling--function-calling}

請參閱 litellm 平行 function calling 的詳細逐步說明 [這裡](https://docs.litellm.ai/docs/completion/function_call)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
# set Azure env variables
import os
import litellm
import json

os.environ['AZURE_API_KEY'] = "" # litellm reads AZURE_API_KEY from .env and sends the request
os.environ['AZURE_API_BASE'] = "https://openai-gpt-4-test-v-1.openai.azure.com/"
os.environ['AZURE_API_VERSION'] = "2023-07-01-preview"

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

response = litellm.completion(
    model="azure/chatgpt-functioncalling", # model = azure/<your-azure-deployment-name>
    messages=[{"role": "user", "content": "What's the weather like in San Francisco, Tokyo, and Paris?"}],
    tools=tools,
    tool_choice="auto",  # auto is default, but we'll be explicit
)
print("\nLLM Response1:\n", response)
response_message = response.choices[0].message
tool_calls = response.choices[0].message.tool_calls
print("\nTool Choice:\n", tool_calls)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: azure-gpt-3.5
    litellm_params:
      model: azure/chatgpt-functioncalling
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
```

2. 啟動 proxy

```bash
litellm --config config.yaml
```

3. 測試它

```bash
curl -L -X POST 'http://localhost:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "azure-gpt-3.5",
    "messages": [
        {
            "role": "user",
            "content": "Hey, how'\''s it going? Thinking long and hard before replying - what is the meaning of the world and life itself"
        }
    ]
}'
```


</TabItem>
</Tabs>
### Azure OpenAI 模型的支出追蹤（PROXY） {#spend-tracking-for-azure-openai-models-proxy}

設定 base model 以進行成本追蹤 azure image-gen 呼叫

#### 影像生成  {#image-generation}

```yaml
model_list: 
  - model_name: dall-e-3
    litellm_params:
        model: azure/dall-e-3-test
        api_version: 2023-06-01-preview
        api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
        api_key: os.environ/AZURE_API_KEY
        base_model: dall-e-3 # 👈 set dall-e-3 as base model
    model_info:
        mode: image_generation
```

#### 聊天完成 / Embeddings {#chat-completions--embeddings}

**問題**：當使用 `azure/gpt-4-1106-preview` 時，Azure 會在回應中回傳 `gpt-4`。這會導致成本追蹤不準確

**解決方案** ✅：在您的 config 中設定 `base_model`，讓 litellm 使用正確的模型來計算 azure 成本

從[這裡](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)取得 base model 名稱

含有 `base_model` 的範例設定
```yaml
model_list:
  - model_name: azure-gpt-3.5
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
    model_info:
      base_model: azure/gpt-4-1106-preview
```
