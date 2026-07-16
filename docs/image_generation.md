import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 影像生成 {#image-generations}

## 總覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 適用於所有支援的模型 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 終端使用者追蹤 | ✅ | |
| 備援 | ✅ | 可於支援的模型之間運作 |
| 負載平衡 | ✅ | 可於支援的模型之間運作 |
| 防護欄 | ✅ | 套用於輸入提示詞（僅限非串流） |
| 支援的提供者 | OpenAI, Azure, Google AI Studio, Vertex AI, AWS Bedrock, Black Forest Labs, Recraft, OpenRouter, Xinference, Nscale | |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers
from litellm import image_generation
import os 

# set api keys 
os.environ["OPENAI_API_KEY"] = ""

response = image_generation(prompt="A cute baby sea otter", model="dall-e-3")

print(f"response: {response}")
```

### LiteLLM Proxy {#litellm-proxy}

### 設定 config.yaml  {#setup-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: gpt-image-1 ### RECEIVED MODEL NAME ###
    litellm_params: # all params accepted by litellm.image_generation()
      model: azure/gpt-image-1 ### MODEL NAME sent to `litellm.image_generation()` ###
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: "os.environ/AZURE_API_KEY_EU" # does os.getenv("AZURE_API_KEY_EU")

```

### 啟動 proxy  {#start-proxy}

```bash showLineNumbers
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

### 測試  {#test}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl -X POST 'http://0.0.0.0:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gpt-image-1",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
}'
```

</TabItem>
<TabItem value="openai" label="OpenAI">

```python showLineNumbers
from openai import OpenAI
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)


image = client.images.generate(
    prompt="A cute baby sea otter",
    model="dall-e-3",
)

print(image)
```
</TabItem>
</Tabs>

## `litellm.image_generation()` 的輸入參數 {#input-params-for-litellmimage_generation}

:::info

任何非 openai 參數都會被視為特定於提供者的參數，並作為 kwargs 在請求主體中傳送給提供者。

[**查看保留參數**](https://github.com/BerriAI/litellm/blob/2f5f85cb52f36448d1f8bbfbd3b8af8167d0c4c8/litellm/main.py#L4082)
:::

### 必填欄位 {#required-fields}

- `prompt`: *string* - 期望影像的文字描述。  

### LiteLLM 選用欄位 {#optional-litellm-fields}

    model: Optional[str] = None,
    n: Optional[int] = None,
    quality: Optional[str] = None,
    response_format: Optional[str] = None,
    size: Optional[str] = None,
    style: Optional[str] = None,
    user: Optional[str] = None,
    timeout=600,  # 預設為 10 分鐘
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    api_version: Optional[str] = None,
    litellm_logging_obj=None,
    custom_llm_provider=None,

- `model`: *string (optional)* 用於影像生成的模型。預設為 openai/gpt-image-1

- `n`: *int (optional)* 要生成的影像數量。必須介於 1 到 10 之間。對於 dall-e-3，只支援 n=1。

- `quality`: *string (optional)* 將生成的影像品質。
  *   `auto`（預設值）會自動為指定的模型選擇最佳品質。
  *   `high`、`medium` 和 `low` 支援 `gpt-image-1`。
  *   `hd` 和 `standard` 支援 `dall-e-3`。
  *   `standard` 是 `dall-e-2` 的唯一選項。
  
- `response_format`: *string (optional)* 生成的影像回傳格式。必須是 url 或 b64_json 其中之一。

- `size`: *string (optional)* 生成的影像尺寸。必須是 `1024x1024`、`1536x1024`（橫向）、`1024x1536`（直向），或 `auto`（預設值，適用於 `gpt-image-1`）；對於 `256x256`、`512x512` 或 `1024x1024` 其中之一，適用於 `dall-e-2`；以及對於 `1024x1024`、`1792x1024` 或 `1024x1792` 其中之一，適用於 `dall-e-3`。

- `timeout`: *integer* - 等待 API 回應的最長時間（秒）。預設為 600 秒（10 分鐘）。

- `user`: *string (optional)* 代表您終端使用者的唯一識別碼， 

- `api_base`: *string (optional)* - 您要用來呼叫模型的 api 端點

- `api_version`: *string (optional)* - （Azure 專用）此次呼叫的 api 版本；在 Azure 上使用 dall-e-3 時為必要

- `api_key`: *string (optional)* - 用於驗證與授權請求的 API 金鑰。若未提供，將使用預設 API 金鑰。

- `api_type`: *string (optional)* - 要使用的 API 類型。

### `litellm.image_generation()` 的輸出 {#output-from-litellmimage_generation}

```json

{
    "created": 1703658209,
    "data": [{
        'b64_json': None, 
        'revised_prompt': 'Adorable baby sea otter with a coat of thick brown fur, playfully swimming in blue ocean waters. Its curious, bright eyes gleam as it is surfaced above water, tiny paws held close to its chest, as it playfully spins in the gentle waves under the soft rays of a setting sun.', 
        'url': 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-ikDc4ex8NB5ZzfTf8m5WYVB7/user-JpwZsbIXubBZvan3Y3GchiiB/img-dpa3g5LmkTrotY6M93dMYrdE.png?st=2023-12-27T05%3A23%3A29Z&se=2023-12-27T07%3A23%3A29Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2023-12-26T13%3A22%3A56Z&ske=2023-12-27T13%3A22%3A56Z&sks=b&skv=2021-08-06&sig=hUuQjYLS%2BvtsDdffEAp2gwewjC8b3ilggvkd9hgY6Uw%3D'
    }],
    "usage": {'prompt_tokens': 0, 'completion_tokens': 0, 'total_tokens': 0}
}
```

## OpenAI 影像生成模型 {#openai-image-generation-models}

### 用法 {#usage}
```python showLineNumbers
from litellm import image_generation
import os
os.environ['OPENAI_API_KEY'] = ""
response = image_generation(model='gpt-image-1', prompt="cute baby otter")
```

| 模型名稱           | 函式呼叫                               | 必要 OS 變數                |
|----------------------|---------------------------------------------|--------------------------------------|
| gpt-image-1 | `image_generation(model='gpt-image-1', prompt="cute baby otter")` | `os.environ['OPENAI_API_KEY']`       |
| dall-e-3 | `image_generation(model='dall-e-3', prompt="cute baby otter")` | `os.environ['OPENAI_API_KEY']`       |
| dall-e-2 | `image_generation(model='dall-e-2', prompt="cute baby otter")` | `os.environ['OPENAI_API_KEY']`       |

## Azure OpenAI 影像生成模型 {#azure-openai-image-generation-models}

### API 金鑰 {#api-keys}
這可以設為環境變數，或作為 **params 傳入 litellm.image_generation()**
```python showLineNumbers
import os
os.environ['AZURE_API_KEY'] = 
os.environ['AZURE_API_BASE'] = 
os.environ['AZURE_API_VERSION'] = 
```

### 用法 {#usage-1}
```python showLineNumbers
from litellm import embedding
response = embedding(
    model="azure/<your deployment name>",
    prompt="cute baby otter",
    api_key=api_key,
    api_base=api_base,
    api_version=api_version,
)
print(response)
```

| 模型名稱           | 函式呼叫                               |
|----------------------|---------------------------------------------|
| gpt-image-1 | `image_generation(model="azure/<your deployment name>", prompt="cute baby otter")` |
| dall-e-3 | `image_generation(model="azure/<your deployment name>", prompt="cute baby otter")` |
| dall-e-2 | `image_generation(model="azure/<your deployment name>", prompt="cute baby otter")` |

## Xinference 影像生成模型 {#xinference-image-generation-models}

請將此用於託管在 Xinference 上的 Stable Diffusion 模型

#### 用法 {#usage-2}

請參閱 LiteLLM 與 Xinference 的用法 [這裡](./providers/xinference.md#image-generation)

## Recraft 影像生成模型 {#recraft-image-generation-models}

請將此用於使用 Recraft 的 AI 驅動設計與影像生成

#### 用法 {#usage-3}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

response = image_generation(
    model="recraft/recraftv3",
    prompt="A beautiful sunset over a calm ocean",
)
print(response)
```

請參閱 LiteLLM 與 Recraft 的用法 [這裡](./providers/recraft.md#image-generation)

## OpenRouter 影像生成模型 {#openrouter-image-generation-models}

請將此用於透過 OpenRouter 提供的影像生成模型（例如：Google Gemini 影像生成模型）

#### 用法 {#usage-4}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['OPENROUTER_API_KEY'] = "your-api-key"

response = image_generation(
    model="openrouter/google/gemini-2.5-flash-image",
    prompt="A beautiful sunset over a calm ocean",
    size="1024x1024",
    quality="high",
)
print(response)
```

## OpenAI 相容影像生成模型 {#openai-compatible-image-generation-models}
請將此用於在 OpenAI 相容伺服器上呼叫 `/image_generation` 端點，例如 https://github.com/xorbitsai/inference

**注意：請為模型加上 `openai/` 前綴，以便 litellm 知道要路由到 OpenAI**

### 用法 {#usage-5}
```python showLineNumbers
from litellm import image_generation
response = image_generation(
  model = "openai/<your-llm-name>",     # add `openai/` prefix to model so litellm knows to route to OpenAI
  api_base="http://0.0.0.0:8000/"       # set API Base of your Custom OpenAI Endpoint
  prompt="cute baby otter"
)
```

## Bedrock - Stable Diffusion {#bedrock---stable-diffusion}
請將此用於 bedrock 上的 stable diffusion

### 用法 {#usage-6}
```python showLineNumbers
import os
from litellm import image_generation

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

response = image_generation(
            prompt="A cute baby sea otter",
            model="bedrock/stability.stable-diffusion-xl-v0",
        )
print(f"response: {response}")
```

## VertexAI - 影像生成模型 {#vertexai---image-generation-models}

### 用法  {#usage-7}

請將此用於 VertexAI 上的影像生成模型

```python showLineNumbers
response = litellm.image_generation(
    prompt="An olympic size swimming pool",
    model="vertex_ai/imagegeneration@006",
    vertex_ai_project="adroit-crow-413218",
    vertex_ai_location="us-central1",
)
print(f"response: {response}")
```

## 支援的提供者 {#supported-providers}

#### ⚡️請在 [models.litellm.ai](https://models.litellm.ai/) 查看所有支援的模型與提供者 {#️see-all-supported-models-and-providers-at-modelslitellmaihttpsmodelslitellmai}

| 提供者 | 文件連結 |
|----------|-------------------|
| OpenAI | [OpenAI 影像生成 →](./providers/openai) |
| Azure OpenAI | [Azure OpenAI 影像生成 →](./providers/azure/azure) |
| Google AI Studio | [Google AI Studio 影像生成 →](./providers/google_ai_studio/image_gen) |
| Vertex AI | [Vertex AI 影像生成 →](./providers/vertex_image) |
| AWS Bedrock | [Bedrock 影像生成 →](./providers/bedrock) |
| Recraft | [Recraft 影像生成 →](./providers/recraft#image-generation) |
| OpenRouter | [OpenRouter 影像生成 →](./providers/openrouter#image-generation) |
| Xinference | [Xinference 影像生成 →](./providers/xinference#image-generation) |
| Nscale | [Nscale 影像生成 →](./providers/nscale#image-generation) |
