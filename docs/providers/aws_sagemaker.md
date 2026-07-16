import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem'

# AWS Sagemaker {#aws-sagemaker}
LiteLLM 支援所有 Sagemaker Huggingface Jumpstart 模型

:::tip

**我們支援所有 Sagemaker 模型，只要在傳送 litellm 請求時將 `model=sagemaker/<any-model-on-sagemaker>` 設為前綴即可**

:::

### API 金鑰 {#api-keys}
```python
os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""
```

### 使用方式 {#usage}
```python
import os 
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
            model="sagemaker/<your-endpoint-name>", 
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            temperature=0.2,
            max_tokens=80
        )
```

### 使用方式 - 串流 {#usage---streaming}
Sagemaker 目前不支援串流 - LiteLLM 會透過回傳回應字串的分段來模擬串流

```python
import os 
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
            model="sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b", 
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            temperature=0.2,
            max_tokens=80,
            stream=True,
        )
for chunk in response:
    print(chunk)
```


## **LiteLLM Proxy 使用方式** {#litellm-proxy-usage}

以下是如何透過 LiteLLM Proxy Server 呼叫 Sagemaker

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: jumpstart-model
    litellm_params:
      model: sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614
      aws_access_key_id: os.environ/CUSTOM_AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/CUSTOM_AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/CUSTOM_AWS_REGION_NAME
```

所有可能的驗證參數： 

```
aws_access_key_id: Optional[str],
aws_secret_access_key: Optional[str],
aws_session_token: Optional[str],
aws_region_name: Optional[str],
aws_session_name: Optional[str],
aws_profile_name: Optional[str],
aws_role_name: Optional[str],
aws_web_identity_token: Optional[str],
```

### 2. 啟動 proxy  {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml
```
### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "jumpstart-model",
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

response = client.chat.completions.create(model="jumpstart-model", messages = [
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
    model = "jumpstart-model",
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

## 設定 temperature、top p 等。 {#set-temperature-top-p-etc}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  temperature=0.7,
  top_p=1
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: jumpstart-model
    litellm_params:
      model: sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614
      temperature: <your-temp>
      top_p: <your-top-p>
```

**在請求中設定**

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="jumpstart-model", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7,
top_p=1
)

print(response)

```

</TabItem>
</Tabs>

## **允許為 Sagemaker 設定 temperature=0** {#allow-setting-temperature0-for-sagemaker}

預設情況下，當 `temperature=0` 傳送到 LiteLLM 的請求中時，LiteLLM 會將其四捨五入為 `temperature=0.1`，因為當 `temperature=0` 時，Sagemaker 會讓大多數請求失敗

如果您想為您的模型傳送 `temperature=0`，以下是設定方式（由於 Sagemaker 可以代管任何類型的模型，某些模型允許零溫度）

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  temperature=0,
  aws_sagemaker_allow_zero_temp=True,
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定 `aws_sagemaker_allow_zero_temp`**

```yaml
model_list:
  - model_name: jumpstart-model
    litellm_params:
      model: sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614
      aws_sagemaker_allow_zero_temp: true
```

**在請求中設定 `temperature=0`**

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="jumpstart-model", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0,
)

print(response)

```

</TabItem>
</Tabs>

## 傳遞提供者專屬參數  {#pass-provider-specific-params}

如果您傳遞一個非 OpenAI 參數給 litellm，我們會假設它是提供者專屬參數，並將其作為請求主體中的 kwarg 傳送。[查看更多](../completion/input.md#provider-specific-params)

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
  model="sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  top_k=1 # 👈 PROVIDER-SPECIFIC PARAM
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: jumpstart-model
    litellm_params:
      model: sagemaker/jumpstart-dft-hf-textgeneration1-mp-20240815-185614
      top_k: 1 # 👈 PROVIDER-SPECIFIC PARAM
```

**在請求中設定**

```python

import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(model="jumpstart-model", messages = [
    {
        "role": "user",
        "content": "this is a test request, write a short poem"
    }
],
temperature=0.7,
extra_body={
    top_k=1 # 👈 PROVIDER-SPECIFIC PARAM
}
)

print(response)

```

</TabItem>
</Tabs>

### 傳入推論元件名稱 {#passing-inference-component-name}

如果您的端點上有多個模型，您需要指定各個模型名稱，請透過 `model_id` 進行。  

```python
import os 
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
            model="sagemaker/<your-endpoint-name>", 
            model_id="<your-model-name",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            temperature=0.2,
            max_tokens=80
        )
```

### 將憑證作為參數傳入 - Completion() {#passing-credentials-as-parameters---completion}
將 AWS 憑證作為參數傳遞給 litellm.completion
```python
import os 
from litellm import completion

response = completion(
            model="sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b",
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            aws_access_key_id="",
            aws_secret_access_key="",
            aws_region_name="",
)
```

### 套用 Prompt 範本 {#applying-prompt-templates}
若要為您的 sagemaker 部署套用正確的 prompt 範本，也請傳入其 hf 模型名稱。 

```python
import os 
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
            model="sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b", 
            messages=messages,
            temperature=0.2,
            max_tokens=80,
            hf_model_name="meta-llama/Llama-2-7b",
        )
```

您也可以傳入您自己的[自訂 prompt 範本](../completion/prompt_formatting.md#format-prompt-yourself)

## Sagemaker 訊息 API {#sagemaker-messages-api}

使用路由 `sagemaker_chat/*` 來路由至 Sagemaker Messages API

```
model: sagemaker_chat/<your-endpoint-name>
```

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
import litellm
from litellm import completion

litellm.set_verbose = True # 👈 SEE RAW REQUEST

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = completion(
            model="sagemaker_chat/<your-endpoint-name>", 
            messages=[{ "content": "Hello, how are you?","role": "user"}],
            temperature=0.2,
            max_tokens=80
        )
```

</TabItem>
<TabItem value="proxy" label="PROXY">

#### 1. 設定 config.yaml  {#1-setup-configyaml-1}

```yaml
model_list:
  - model_name: "sagemaker-model"
    litellm_params:
      model: "sagemaker_chat/jumpstart-dft-hf-textgeneration1-mp-20240815-185614"
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

#### 2. 啟動 proxy  {#2-start-the-proxy-1}

```bash
litellm --config /path/to/config.yaml
```
#### 3. 測試 {#3-test-it-1}

```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data ' {
      "model": "sagemaker-model",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```

[**👉 查看 OpenAI SDK/Langchain/Llamaindex/etc. 範例**](../proxy/user_keys.md#chatcompletions)

</TabItem>
</Tabs>

## Completion 模型  {#completion-models}

:::tip

**我們支援所有 Sagemaker 模型，只要在傳送 litellm 請求時將 `model=sagemaker/<any-model-on-sagemaker>` 設為前綴即可**

:::

以下是使用 LiteLLM 搭配 sagemaker 模型的範例 

| 模型名稱                    | 函式呼叫                                                                                       |
|-------------------------------|-------------------------------------------------------------------------------------------|
| 您的自訂 Huggingface 模型               | `completion(model='sagemaker/<your-deployment-name>', messages=messages)`        | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`      
| Meta Llama 2 7B               | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b', messages=messages)`        | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |
| Meta Llama 2 7B（聊天/微調）  | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b-f', messages=messages)`      | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |
| Meta Llama 2 13B              | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-13b', messages=messages)`       | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |
| Meta Llama 2 13B（聊天/微調） | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-13b-f', messages=messages)`     | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |
| Meta Llama 2 70B              | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-70b', messages=messages)`       | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |
| Meta Llama 2 70B（聊天/微調） | `completion(model='sagemaker/jumpstart-dft-meta-textgeneration-llama-2-70b-b-f', messages=messages)`   | `os.environ['AWS_ACCESS_KEY_ID']`, `os.environ['AWS_SECRET_ACCESS_KEY']`, `os.environ['AWS_REGION_NAME']`              |

## Embedding 模型 {#embedding-models}

LiteLLM 支援所有 Sagemaker Jumpstart Huggingface Embedding 模型。以下是呼叫方式： 

```python
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = litellm.embedding(model="sagemaker/<your-deployment-name>", input=["good morning from litellm", "this is another item"])
print(f"response: {response}")
```


## SageMaker 上的 Nova 模型 {#nova-models-on-sagemaker}

LiteLLM 支援部署在 SageMaker Inference 即時端點上的 Amazon Nova 模型（Nova Micro、Nova Lite、Nova 2 Lite）。這些自訂/微調的 Nova 模型使用與 OpenAI 相容的 API 格式。

**參考：** [AWS Blog - Amazon SageMaker Inference for Custom Amazon Nova Models](https://aws.amazon.com/blogs/aws/announcing-amazon-sagemaker-inference-for-custom-amazon-nova-models/)

### 使用方式 {#usage-1}

請使用 `sagemaker_nova/` 前綴加上您的 SageMaker 端點名稱：

```python
import litellm
import os

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = "us-east-1"

# Basic chat completion
response = litellm.completion(
    model="sagemaker_nova/my-nova-endpoint",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    temperature=0.7,
    max_tokens=512,
)
print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python
response = litellm.completion(
    model="sagemaker_nova/my-nova-endpoint",
    messages=[{"role": "user", "content": "Write a short poem"}],
    stream=True,
    stream_options={"include_usage": True},
)
for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### 多模態（圖片） {#multimodal-images}

SageMaker 上的 Nova 模型支援使用 base64 data URI 的圖片輸入：

```python
response = litellm.completion(
    model="sagemaker_nova/my-nova-endpoint",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
            ]
        }
    ],
)
```

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: nova-micro
    litellm_params:
      model: sagemaker_nova/my-nova-micro-endpoint
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

### 支援的參數 {#supported-parameters}

支援所有標準 OpenAI 參數，另外還有以下 Nova 專屬參數：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `top_k` | integer | 限制 token 選擇為最可能的前 K 個 token |
| `reasoning_effort` | `"low"` \| `"high"` | 推理努力等級（僅限 Nova 2 Lite 自訂模型） |
| `allowed_token_ids` | array[int] | 限制輸出為指定的 token ID |
| `truncate_prompt_tokens` | integer | 若提示超出限制，將其截斷為 N 個 token |

```python
response = litellm.completion(
    model="sagemaker_nova/my-nova-endpoint",
    messages=[{"role": "user", "content": "Think step by step: what is 2+2?"}],
    top_k=40,
    reasoning_effort="low",
    logprobs=True,
    top_logprobs=2,
)
```
