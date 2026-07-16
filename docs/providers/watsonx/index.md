import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# IBM watsonx.ai {#ibm-watsonxai}

LiteLLM 支援所有 IBM [watsonx.ai](https://watsonx.ai/) 基礎模型與 embeddings。

## 環境變數 {#environment-variables}
```python
os.environ["WATSONX_URL"] = ""  # (required) Base URL of your WatsonX instance
# (required) either one of the following:
os.environ["WATSONX_APIKEY"] = "" # IBM cloud API key
os.environ["WATSONX_TOKEN"] = "" # IAM auth token
# optional - can also be passed as params to completion() or embedding()
os.environ["WATSONX_PROJECT_ID"] = "" # Project ID of your WatsonX instance
os.environ["WATSONX_DEPLOYMENT_SPACE_ID"] = "" # ID of your deployment space to use deployed models
os.environ["WATSONX_ZENAPIKEY"] = "" # Zen API key (use for long-term api token)
```

請參閱[此處](https://cloud.ibm.com/apidocs/watsonx-ai#api-authentication)以了解更多關於如何取得存取權杖以驗證 watsonx.ai 的資訊。

## 使用方式 {#usage}

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/liteLLM_IBM_Watsonx.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

```python showLineNumbers title="Chat Completion"
import os
from litellm import completion

os.environ["WATSONX_URL"] = ""
os.environ["WATSONX_APIKEY"] = ""

response = completion(
  model="watsonx/meta-llama/llama-3-1-8b-instruct",
  messages=[{ "content": "what is your favorite colour?","role": "user"}],
  project_id="<my-project-id>"
)
```

## 使用方式 - 串流 {#usage---streaming}
```python showLineNumbers title="Streaming"
import os
from litellm import completion

os.environ["WATSONX_URL"] = ""
os.environ["WATSONX_APIKEY"] = ""
os.environ["WATSONX_PROJECT_ID"] = ""

response = completion(
  model="watsonx/meta-llama/llama-3-1-8b-instruct",
  messages=[{ "content": "what is your favorite colour?","role": "user"}],
  stream=True
)
for chunk in response:
  print(chunk)
```

## 使用方式 - 部署空間中的模型 {#usage---models-in-deployment-spaces}

部署到部署空間中的模型（例如：調校後模型）可使用 `deployment/<deployment_id>` 格式來呼叫。

```python showLineNumbers title="Deployment Space"
import litellm

response = litellm.completion(
    model="watsonx/deployment/<deployment_id>",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
    space_id="<deployment_space_id>"
)
```

## 使用方式 - Embeddings {#usage---embeddings}

```python showLineNumbers title="Embeddings"
from litellm import embedding

response = embedding(
    model="watsonx/ibm/slate-30m-english-rtrvr",
    input=["What is the capital of France?"],
    project_id="<my-project-id>"
)
```

## LiteLLM Proxy 使用方式  {#litellm-proxy-usage}

### 1. 將金鑰儲存在您的環境中 {#1-save-keys-in-your-environment}

```bash
export WATSONX_URL=""
export WATSONX_APIKEY=""
export WATSONX_PROJECT_ID=""
```

### 2. 啟動 proxy  {#2-start-the-proxy}

<Tabs>
<TabItem value="cli" label="CLI">

```bash
$ litellm --model watsonx/meta-llama/llama-3-8b-instruct
```

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: llama-3-8b
    litellm_params:
      model: watsonx/meta-llama/llama-3-8b-instruct
      api_key: "os.environ/WATSONX_API_KEY"
```
</TabItem>
</Tabs>

### 3. 測試它 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
      "model": "llama-3-8b",
      "messages": [
        {
          "role": "user",
          "content": "what is your favorite colour?"
        }
      ]
    }'
```
</TabItem>
<TabItem value="openai" label="OpenAI SDK">

```python showLineNumbers
import openai

client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="llama-3-8b", 
    messages=[{"role": "user", "content": "what is your favorite colour?"}]
)
print(response)
```
</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

| 模型名稱                         | 指令                                                                                  |
|------------------------------------|------------------------------------------------------------------------------------------|
| Llama 3.1 8B Instruct              | `completion(model="watsonx/meta-llama/llama-3-1-8b-instruct", messages=messages)`        |
| Llama 2 70B Chat                   | `completion(model="watsonx/meta-llama/llama-2-70b-chat", messages=messages)`             |
| Granite 13B Chat V2                | `completion(model="watsonx/ibm/granite-13b-chat-v2", messages=messages)`                 |
| Mixtral 8X7B Instruct              | `completion(model="watsonx/ibm-mistralai/mixtral-8x7b-instruct-v01-q", messages=messages)` |

如需所有可用模型，請參閱 [watsonx.ai 文件](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html?context=wx)。

## 支援的 Embedding 模型 {#supported-embedding-models}

| 模型名稱 | 函式呼叫                                                          |
|------------|------------------------------------------------------------------------|
| Slate 30m  | `embedding(model="watsonx/ibm/slate-30m-english-rtrvr", input=input)`  |
| Slate 125m | `embedding(model="watsonx/ibm/slate-125m-english-rtrvr", input=input)` |

如需所有可用的 embedding 模型，請參閱 [watsonx.ai embedding 文件](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models-embed.html?context=wx)。

## 進階 {#advanced}

### 使用 Zen API 金鑰 {#using-zen-api-key}

您可以使用 Zen API 金鑰進行長期驗證，而不是產生 IAM token。請將其作為環境變數或參數傳入：

```python
import os
from litellm import completion

# Option 1: Set as environment variable
os.environ["WATSONX_ZENAPIKEY"] = "your-zen-api-key"

response = completion(
    model="watsonx/ibm/granite-13b-chat-v2",
    messages=[{"content": "What is your favorite color?", "role": "user"}],
    project_id="your-project-id"
)

# Option 2: Pass as parameter
response = completion(
    model="watsonx/ibm/granite-13b-chat-v2",
    messages=[{"content": "What is your favorite color?", "role": "user"}],
    zen_api_key="your-zen-api-key",
    project_id="your-project-id"
)
```

**透過 OpenAI client 搭配 LiteLLM Proxy 使用：**

```python
import openai

client = openai.OpenAI(
    api_key="sk-1234",  # LiteLLM proxy key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="watsonx/ibm/granite-3-3-8b-instruct",
    messages=[{"role": "user", "content": "What is your favorite color?"}],
    max_tokens=2048,
    extra_body={
        "project_id": "your-project-id",
        "zen_api_key": "your-zen-api-key"
    }
)
```

請參閱 [IBM 文件](https://www.ibm.com/docs/en/watsonx/w-and-w/2.2.0?topic=keys-generating-zenapikey-authorization-tokens)以了解更多關於產生 Zen API 金鑰的資訊。
