import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure Responses API {#azure-responses-api}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure OpenAI Responses API |
| `custom_llm_provider` 在 LiteLLM 上 | `azure/` |
| 支援的操作 | `/v1/responses`|
| Azure OpenAI Responses API | [Azure OpenAI Responses API ↗](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses?tabs=python-secure) |
| 成本追蹤、記錄支援 | ✅ LiteLLM 會記錄、追蹤 Responses API 請求的成本 |
| 支援的 OpenAI 參數 | ✅ 支援所有 OpenAI 參數，[請見此處](https://github.com/BerriAI/litellm/blob/0717369ae6969882d149933da48eeb8ab0e691bd/litellm/llms/openai/responses/transformation.py#L23) |

## 用法 {#usage}

## 建立模型回應 {#create-a-model-response}

<Tabs>
<TabItem value="litellm-sdk" label="LiteLLM SDK">

#### 非串流 {#non-streaming}

```python showLineNumbers title="Azure Responses API"
import litellm

# Non-streaming response
response = litellm.responses(
    model="azure/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100,
    api_key=os.getenv("AZURE_RESPONSES_OPENAI_API_KEY"),
    api_base="https://litellm8397336933.openai.azure.com/",
    api_version="2023-03-15-preview",
)

print(response)
```

#### 串流 {#streaming}
```python showLineNumbers title="Azure Responses API"
import litellm

# Streaming response
response = litellm.responses(
    model="azure/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True,
    api_key=os.getenv("AZURE_RESPONSES_OPENAI_API_KEY"),
    api_base="https://litellm8397336933.openai.azure.com/",
    api_version="2023-03-15-preview",
)

for event in response:
    print(event)
```

</TabItem>
<TabItem value="proxy" label="使用 LiteLLM Proxy 的 OpenAI SDK">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="Azure Responses API"
model_list:
  - model_name: o1-pro
    litellm_params:
      model: azure/o1-pro
      api_key: os.environ/AZURE_RESPONSES_OPENAI_API_KEY
      api_base: https://litellm8397336933.openai.azure.com/
      api_version: 2023-03-15-preview
```

啟動您的 LiteLLM proxy：
```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

接著使用指向您 proxy 的 OpenAI SDK：

#### 非串流 {#non-streaming-1}
```python showLineNumbers
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-1}
```python showLineNumbers
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>
</Tabs>

## Azure Codex 模型 {#azure-codex-models}

Codex 模型使用 Azure 的新 [/v1/preview API](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-lifecycle?tabs=key#next-generation-api)，可持續存取最新功能，且無需每月更新 `api-version`。 

**當您設定 `api_version="preview"` 時，LiteLLM 會將您的請求傳送到 `/v1/preview` 端點。**

<Tabs>
<TabItem value="litellm-sdk" label="LiteLLM SDK">

#### 非串流 {#non-streaming-2}

```python showLineNumbers title="Azure Codex Models"
import litellm

# Non-streaming response with Codex models
response = litellm.responses(
    model="azure/codex-mini",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100,
    api_key=os.getenv("AZURE_RESPONSES_OPENAI_API_KEY"),
    api_base="https://litellm8397336933.openai.azure.com",
    api_version="preview", # 👈 key difference
)

print(response)
```

#### 串流 {#streaming-2}
```python showLineNumbers title="Azure Codex Models"
import litellm

# Streaming response with Codex models
response = litellm.responses(
    model="azure/codex-mini",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True,
    api_key=os.getenv("AZURE_RESPONSES_OPENAI_API_KEY"),
    api_base="https://litellm8397336933.openai.azure.com",
    api_version="preview", # 👈 key difference
)

for event in response:
    print(event)
```

</TabItem>
<TabItem value="proxy" label="使用 LiteLLM Proxy 的 OpenAI SDK">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="Azure Codex Models"
model_list:
  - model_name: codex-mini
    litellm_params:
      model: azure/codex-mini
      api_key: os.environ/AZURE_RESPONSES_OPENAI_API_KEY
      api_base: https://litellm8397336933.openai.azure.com
      api_version: preview # 👈 key difference
```

啟動您的 LiteLLM proxy：
```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

接著使用指向您 proxy 的 OpenAI SDK：

#### 非串流 {#non-streaming-3}
```python showLineNumbers
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="codex-mini",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-3}
```python showLineNumbers
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="codex-mini",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>
</Tabs>

## 透過 `/chat/completions` 呼叫 {#calling-via-chatcompletions}

您也可以透過 `/chat/completions` 端點呼叫 Azure Responses API。

<Tabs>
<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers
from litellm import completion
import os 

os.environ["AZURE_API_BASE"] = "https://my-azure-endpoint.openai.azure.com/"
os.environ["AZURE_API_VERSION"] = "2023-03-15-preview"
os.environ["AZURE_API_KEY"] = "my-api-key"

response = completion(
    model="azure/responses/my-custom-o1-pro",
    messages=[{"role": "user", "content": "Hello world"}],
)

print(response)
```
</TabItem>
<TabItem value="proxy" label="使用 LiteLLM Proxy 的 OpenAI SDK">

1. 設定 config.yaml

```yaml showLineNumbers
model_list:
  - model_name: my-custom-o1-pro
    litellm_params:
      model: azure/responses/my-custom-o1-pro
      api_key: os.environ/AZURE_API_KEY
      api_base: https://my-azure-endpoint.openai.azure.com/
      api_version: 2023-03-15-preview
```

2. 啟動 LiteLLM proxy
```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試看看！

```bash
curl http://localhost:4000/v1/chat/completions \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "my-custom-o1-pro",
    "messages": [{"role": "user", "content": "Hello world"}]
  }'
```
</TabItem>
</Tabs>
