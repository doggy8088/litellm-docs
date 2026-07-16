import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure AI 圖像生成（Black Forest Labs - Flux） {#azure-ai-image-generation-black-forest-labs---flux}

Azure AI 使用來自 Black Forest Labs 的 FLUX 模型，提供強大的圖像生成能力，可根據文字描述建立高品質圖片。

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Azure AI Image Generation 使用 FLUX 模型，從文字描述生成高品質圖片。 |
| LiteLLM 上的提供者路由 | `azure_ai/` |
| 提供者文件 | [Azure AI FLUX 模型 ↗](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/black-forest-labs-flux-1-kontext-pro-and-flux1-1-pro-now-available-in-azure-ai-f/4434659) |
| 支援的操作 | [`/images/generations`](#image-generation), [`/images/edits`](#image-editing) |

## 設定 {#setup}

### API 金鑰與 Base URL {#api-key--base-url}

```python showLineNumbers
# Set your Azure AI API credentials
import os
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"  # e.g., https://your-endpoint.eastus2.inference.ai.azure.com/
```

請從 [Azure AI Studio](https://ai.azure.com/) 取得您的 API 金鑰與端點。

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 每張圖片成本 |
|------------|-------------|----------------|
| `azure_ai/FLUX-1.1-pro` | 最新的 FLUX 1.1 Pro 模型，適用於高品質圖片生成 | $0.04 |
| `azure_ai/FLUX.1-Kontext-pro` | 具有增強情境理解能力的 FLUX 1 Kontext Pro 模型 | $0.04 |
| `azure_ai/flux.2-pro` | 下一代圖片生成用的 FLUX 2 Pro 模型 | $0.04 |

## 圖像生成 {#image-generation}

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

```python showLineNumbers title="Basic Image Generation"
import litellm
import os

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"

# Generate a single image
response = litellm.image_generation(
    model="azure_ai/FLUX.1-Kontext-pro",
    prompt="A cute baby sea otter swimming in crystal clear water",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"]
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="flux11" label="FLUX 1.1 Pro">

```python showLineNumbers title="FLUX 1.1 Pro Image Generation"
import litellm
import os

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"

# Generate image with FLUX 1.1 Pro
response = litellm.image_generation(
    model="azure_ai/FLUX-1.1-pro",
    prompt="A futuristic cityscape at night with neon lights and flying cars",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"]
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="flux2" label="FLUX 2 Pro">

```python showLineNumbers title="FLUX 2 Pro Image Generation"
import litellm
import os

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"  # e.g., https://litellm-ci-cd-prod.services.ai.azure.com

# Generate image with FLUX 2 Pro
response = litellm.image_generation(
    model="azure_ai/flux.2-pro",
    prompt="A photograph of a red fox in an autumn forest",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"],
    api_version="preview",
    size="1024x1024",
    n=1
)

print(response.data[0].b64_json)  # FLUX 2 returns base64 encoded images
```

</TabItem>

<TabItem value="async" label="非同步用法">

```python showLineNumbers title="Async Image Generation"
import litellm
import asyncio
import os

async def generate_image():
    # Set your API credentials
    os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
    os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"
    
    # Generate image asynchronously
    response = await litellm.aimage_generation(
        model="azure_ai/FLUX.1-Kontext-pro",
        prompt="A beautiful sunset over mountains with vibrant colors",
        api_base=os.environ["AZURE_AI_API_BASE"],
        api_key=os.environ["AZURE_AI_API_KEY"],
        n=1,
    )
    
    print(response.data[0].url)
    return response

# Run the async function
asyncio.run(generate_image())
```

</TabItem>

<TabItem value="advanced" label="進階參數">

```python showLineNumbers title="Advanced Image Generation with Parameters"
import litellm
import os

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"

# Generate image with additional parameters
response = litellm.image_generation(
    model="azure_ai/FLUX-1.1-pro",
    prompt="A majestic dragon soaring over a medieval castle at dawn",
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"],
    n=1,
    size="1024x1024",
    quality="standard"
)

for image in response.data:
    print(f"Generated image URL: {image.url}")
```

</TabItem>
</Tabs>

### 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Azure AI Image Generation Configuration"
model_list:
  - model_name: azure-flux-kontext
    litellm_params:
      model: azure_ai/FLUX.1-Kontext-pro
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
    model_info:
      mode: image_generation
  
  - model_name: azure-flux-11-pro
    litellm_params:
      model: azure_ai/FLUX-1.1-pro
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
    model_info:
      mode: image_generation

  - model_name: azure-flux-2-pro
    litellm_params:
      model: azure_ai/flux.2-pro
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
      api_version: preview
    model_info:
      mode: image_generation

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 LiteLLM Proxy Server {#2-start-litellm-proxy-server}

```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 使用 OpenAI Python SDK 發出請求 {#3-make-requests-with-openai-python-sdk}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Azure AI Image Generation via Proxy - OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="sk-1234"                  # Your proxy API key
)

# Generate image with FLUX Kontext Pro
response = client.images.generate(
    model="azure-flux-kontext",
    prompt="A serene Japanese garden with cherry blossoms and a peaceful pond",
    n=1,
    size="1024x1024"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Azure AI Image Generation via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.image_generation(
    model="litellm_proxy/azure-flux-11-pro",
    prompt="A cyberpunk warrior in a neon-lit alleyway",
    api_base="http://localhost:4000",
    api_key="sk-1234"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Azure AI Image Generation via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "azure-flux-kontext",
    "prompt": "A cozy coffee shop interior with warm lighting and rustic wooden furniture",
    "n": 1,
    "size": "1024x1024"
}'
```

</TabItem>
</Tabs>

## 圖像編輯 {#image-editing}

FLUX 2 Pro 支援圖像編輯，方法是傳入輸入圖片，以及描述所需修改內容的提示詞。

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk-1}

<Tabs>
<TabItem value="basic-edit" label="基本圖像編輯">

```python showLineNumbers title="Basic Image Editing with FLUX 2 Pro"
import litellm
import os

# Set your API credentials
os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"  # e.g., https://litellm-ci-cd-prod.services.ai.azure.com

# Edit an existing image
response = litellm.image_edit(
    model="azure_ai/flux.2-pro",
    prompt="Add a red hat to the subject",
    image=open("input_image.png", "rb"),
    api_base=os.environ["AZURE_AI_API_BASE"],
    api_key=os.environ["AZURE_AI_API_KEY"],
    api_version="preview",
)

print(response.data[0].b64_json)  # FLUX 2 returns base64 encoded images
```

</TabItem>

<TabItem value="async-edit" label="非同步圖像編輯">

```python showLineNumbers title="Async Image Editing"
import litellm
import asyncio
import os

async def edit_image():
    os.environ["AZURE_AI_API_KEY"] = "your-api-key-here"
    os.environ["AZURE_AI_API_BASE"] = "your-azure-ai-endpoint"
    
    response = await litellm.aimage_edit(
        model="azure_ai/flux.2-pro",
        prompt="Change the background to a sunset beach",
        image=open("input_image.png", "rb"),
        api_base=os.environ["AZURE_AI_API_BASE"],
        api_key=os.environ["AZURE_AI_API_KEY"],
        api_version="preview",
    )
    
    return response

asyncio.run(edit_image())
```

</TabItem>
</Tabs>

### 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server-1}

<Tabs>
<TabItem value="curl-edit" label="cURL">

```bash showLineNumbers title="Image Edit via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/edits' \
--header 'Authorization: Bearer sk-1234' \
--form 'model="azure-flux-2-pro"' \
--form 'prompt="Add sunglasses to the person"' \
--form 'image=@"input_image.png"'
```

</TabItem>

<TabItem value="openai-sdk-edit" label="OpenAI SDK">

```python showLineNumbers title="Image Edit via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

response = client.images.edit(
    model="azure-flux-2-pro",
    prompt="Make the sky more dramatic with storm clouds",
    image=open("input_image.png", "rb"),
)

print(response.data[0].b64_json)
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

Azure AI Image Generation 支援以下與 OpenAI 相容的參數：

| 參數 | 類型 | 說明 | 預設值 | 範例 |
|-----------|------|-------------|---------|---------|
| `prompt` | string | 要生成的圖片文字描述 | 必填 | `"A sunset over the ocean"` |
| `model` | string | 要用於生成的 FLUX 模型 | 必填 | `"azure_ai/FLUX.1-Kontext-pro"` |
| `n` | integer | 要生成的圖片數量（1-4） | `1` | `2` |
| `size` | string | 圖片尺寸 | `"1024x1024"` | `"512x512"`, `"1024x1024"` |
| `api_base` | string | 您的 Azure AI 端點 URL | 必填 | `"https://your-endpoint.eastus2.inference.ai.azure.com/"` |
| `api_key` | string | 您的 Azure AI API 金鑰 | 必填 | 環境變數或直接值 |

## 快速開始 {#getting-started}

1. 在 [Azure AI Studio](https://ai.azure.com/) 建立帳戶
2. 在您的 Azure AI Studio 工作區部署 FLUX 模型
3. 從部署詳細資料取得您的 API 金鑰與端點
4. 設定您的 `AZURE_AI_API_KEY` 與 `AZURE_AI_API_BASE` 環境變數
5. 開始使用 LiteLLM 生成圖片

## 其他資源 {#additional-resources}

- [Azure AI Studio 文件](https://docs.microsoft.com/en-us/azure/ai-services/)
- [FLUX 模型公告](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/black-forest-labs-flux-1-kontext-pro-and-flux1-1-pro-now-available-in-azure-ai-f/4434659)
