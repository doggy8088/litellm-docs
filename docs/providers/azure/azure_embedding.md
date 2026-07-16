import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure OpenAI Embeddings {#azure-openai-embeddings}

### API 金鑰 {#api-keys}
這可以設定為環境變數，或作為 **傳遞給 litellm.embedding() 的參數**
```python
import os
os.environ['AZURE_API_KEY'] = 
os.environ['AZURE_API_BASE'] = 
os.environ['AZURE_API_VERSION'] = 
```

### 用法 {#usage}
```python
from litellm import embedding
response = embedding(
    model="azure/<your deployment name>",
    input=["good morning from litellm"],
    api_key=api_key,
    api_base=api_base,
    api_version=api_version,
)
print(response)
```

| 模型名稱           | 函式呼叫                               |
|----------------------|---------------------------------------------|
| text-embedding-ada-002 | `embedding(model="azure/<your deployment name>", input=input)` |

感謝 [Mikko](https://www.linkedin.com/in/mikkolehtimaki/) 協助整合

## **用法 - LiteLLM Proxy Server** {#usage---litellm-proxy-server}

以下說明如何使用 LiteLLM Proxy Server 呼叫 Azure OpenAI 模型

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export AZURE_API_KEY=""
```

### 2. 啟動 proxy  {#2-start-the-proxy}

```yaml
model_list:
  - model_name: text-embedding-ada-002
    litellm_params:
      model: azure/my-deployment-name
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      api_key: os.environ/AZURE_API_KEY # The `os.environ/` prefix tells litellm to read this from the env.
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl 請求">

```shell
curl --location 'http://0.0.0.0:4000/embeddings' \
  --header 'Content-Type: application/json' \
  --data ' {
  "model": "text-embedding-ada-002",
  "input": ["write a litellm poem"]
  }'
```
</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

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
</Tabs>
