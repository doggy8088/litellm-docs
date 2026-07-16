import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Fal AI {#fal-ai}

Fal AI 提供快速、可擴充的頂尖影像生成模型存取，包括 FLUX、Stable Diffusion、Imagen 等。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Fal AI 提供最佳化基礎架構，可大規模、低延遲地執行影像生成模型。 |
| LiteLLM 上的提供者路由 | `fal_ai/` |
| 提供者文件 | [Fal AI 文件 ↗](https://fal.ai/models) |
| 支援的操作 | [`/images/generations`](#image-generation) |

## 設定 {#setup}

### API 金鑰 {#api-key}

```python showLineNumbers
import os

# Set your Fal AI API key
os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"
```

從 [fal.ai](https://fal.ai/) 取得您的 API 金鑰。

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 文件 |
|------------|-------------|---------------|
| `fal_ai/fal-ai/flux-pro/v1.1` | FLUX Pro v1.1 - 平衡速度與品質 | [文件 ↗](https://fal.ai/models/fal-ai/flux-pro/v1.1) |
| `fal_ai/flux/schnell` | Flux Schnell - 低延遲生成，支援 `image_size` | [文件 ↗](https://fal.ai/models/fal-ai/flux/schnell) |
| `fal_ai/fal-ai/bytedance/seedream/v3/text-to-image` | ByteDance Seedream v3 - 具備 `image_size` 控制的文字轉圖像 | [文件 ↗](https://fal.ai/models/fal-ai/bytedance/seedream/v3/text-to-image) |
| `fal_ai/fal-ai/bytedance/dreamina/v3.1/text-to-image` | ByteDance Dreamina v3.1 - 具備 `image_size` 控制的文字轉圖像 | [文件 ↗](https://fal.ai/models/fal-ai/bytedance/dreamina/v3.1/text-to-image) |
| `fal_ai/fal-ai/flux-pro/v1.1-ultra` | FLUX Pro v1.1 Ultra - 高品質影像生成 | [文件 ↗](https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra) |
| `fal_ai/fal-ai/imagen4/preview` | Google 的 Imagen 4 - 最高品質模型 | [文件 ↗](https://fal.ai/models/fal-ai/imagen4/preview) |
| `fal_ai/fal-ai/recraft/v3/text-to-image` | Recraft v3 - 多種風格選項 | [文件 ↗](https://fal.ai/models/fal-ai/recraft/v3/text-to-image) |
| `fal_ai/fal-ai/ideogram/v3` | Ideogram v3 - 以字母設計為核心的創意模型（Balanced：$0.06/張） | [文件 ↗](https://fal.ai/models/fal-ai/ideogram/v3) |
| `fal_ai/fal-ai/stable-diffusion-v35-medium` | Stable Diffusion v3.5 Medium | [文件 ↗](https://fal.ai/models/fal-ai/stable-diffusion-v35-medium) |
| `fal_ai/bria/text-to-image/3.2` | Bria 3.2 - 商用級生成 | [文件 ↗](https://fal.ai/models/bria/text-to-image/3.2) |

## 影像生成 {#image-generation}

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

```python showLineNumbers title="Basic Image Generation"
import litellm
import os

# Set your API key
os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"

# Generate an image
response = litellm.image_generation(
    model="fal_ai/fal-ai/flux-pro/v1.1-ultra",
    prompt="A serene mountain landscape at sunset with vibrant colors"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="imagen4" label="Imagen 4">

```python showLineNumbers title="Google Imagen 4 Generation"
import litellm
import os

os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"

# Generate with Imagen 4
response = litellm.image_generation(
    model="fal_ai/fal-ai/imagen4/preview",
    prompt="A vintage 1960s kitchen with flour package on countertop",
    aspect_ratio="16:9",
    num_images=1
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="recraft" label="Recraft v3">

```python showLineNumbers title="Recraft v3 with Style"
import litellm
import os

os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"

# Generate with specific style
response = litellm.image_generation(
    model="fal_ai/fal-ai/recraft/v3/text-to-image",
    prompt="A red panda eating bamboo",
    style="realistic_image",
    image_size="landscape_4_3"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="async" label="非同步用法">

```python showLineNumbers title="Async Image Generation"
import litellm
import asyncio
import os

async def generate_image():
    os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"
    
    response = await litellm.aimage_generation(
        model="fal_ai/fal-ai/stable-diffusion-v35-medium",
        prompt="A cyberpunk cityscape with neon lights",
        guidance_scale=7.5,
        num_inference_steps=50
    )
    
    print(response.data[0].url)
    return response

asyncio.run(generate_image())
```

</TabItem>

<TabItem value="advanced" label="進階參數">

```python showLineNumbers title="Advanced FLUX Pro Generation"
import litellm
import os

os.environ["FAL_AI_API_KEY"] = "your-fal-api-key"

# Generate with advanced parameters
response = litellm.image_generation(
    model="fal_ai/fal-ai/flux-pro/v1.1-ultra",
    prompt="A majestic dragon soaring over mountains",
    n=2,
    size="1792x1024",  # Maps to aspect_ratio="16:9"
    seed=42,
    safety_tolerance="2",
    enhance_prompt=True
)

for image in response.data:
    print(f"Generated image: {image.url}")
```

</TabItem>
</Tabs>

### 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Fal AI Image Generation Configuration"
model_list:
  - model_name: flux-ultra
    litellm_params:
      model: fal_ai/fal-ai/flux-pro/v1.1-ultra
      api_key: os.environ/FAL_AI_API_KEY
    model_info:
      mode: image_generation
  
  - model_name: imagen4
    litellm_params:
      model: fal_ai/fal-ai/imagen4/preview
      api_key: os.environ/FAL_AI_API_KEY
    model_info:
      mode: image_generation
  
  - model_name: stable-diffusion
    litellm_params:
      model: fal_ai/fal-ai/stable-diffusion-v35-medium
      api_key: os.environ/FAL_AI_API_KEY
    model_info:
      mode: image_generation

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 LiteLLM Proxy Server {#2-start-litellm-proxy-server}

```bash showLineNumbers title="Start Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 發送請求 {#3-make-requests}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Generate via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

response = client.images.generate(
    model="flux-ultra",
    prompt="A beautiful sunset over the ocean",
    n=1,
    size="1024x1024"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Generate via Proxy - LiteLLM SDK"
import litellm

response = litellm.image_generation(
    model="litellm_proxy/imagen4",
    prompt="A cozy coffee shop interior",
    api_base="http://localhost:4000",
    api_key="sk-1234"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Generate via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "stable-diffusion",
    "prompt": "A serene Japanese garden with cherry blossoms",
    "n": 1,
    "size": "1024x1024"
}'
```

</TabItem>
</Tabs>

## 使用模型專屬參數 {#using-model-specific-parameters}

LiteLLM 會將任何額外參數直接轉送至 Fal AI API。您可以在請求中傳遞模型專屬參數，這些參數會被送往 Fal AI。

```python showLineNumbers title="Pass Model-Specific Parameters"
import litellm

# Any parameters beyond the standard ones are forwarded to Fal AI
response = litellm.image_generation(
    model="fal_ai/fal-ai/flux-pro/v1.1-ultra",
    prompt="A beautiful sunset",
    # Model-specific Fal AI parameters
    aspect_ratio="16:9",
    safety_tolerance="2",
    enhance_prompt=True,
    seed=42
)
```

各模型支援的完整參數清單，請參閱：
- [FLUX Pro v1.1-ultra 參數 ↗](https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra/api)
- [Imagen 4 參數 ↗](https://fal.ai/models/fal-ai/imagen4/preview/api)
- [Recraft v3 參數 ↗](https://fal.ai/models/fal-ai/recraft/v3/text-to-image/api)
- [Stable Diffusion v3.5 參數 ↗](https://fal.ai/models/fal-ai/stable-diffusion-v35-medium/api)
- [Bria 3.2 參數 ↗](https://fal.ai/models/bria/text-to-image/3.2/api)

## 支援的參數 {#supported-parameters}

適用於所有模型的標準 OpenAI 相容參數：

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `prompt` | string | 所需影像的文字描述 | 必填 |
| `model` | string | 要使用的 Fal AI 模型 | 必填 |
| `n` | integer | 要生成的影像數量（1-4） | `1` |
| `size` | string | 影像尺寸（對應至模型專屬格式） | 模型預設值 |
| `api_key` | string | 您的 Fal AI API 金鑰 | 環境變數 |

## 快速開始 {#getting-started}

1. 在 [fal.ai](https://fal.ai/) 註冊
2. 從您的帳號設定取得 API 金鑰
3. 設定 `FAL_AI_API_KEY` 環境變數
4. 從 [Fal AI 模型圖庫](https://fal.ai/models) 選擇模型
5. 開始使用 LiteLLM 生成影像

## 其他資源 {#additional-resources}

- [Fal AI 文件](https://fal.ai/docs)
- [模型圖庫](https://fal.ai/models)
- [API 參考](https://fal.ai/docs/api-reference)
- [價格](https://fal.ai/pricing)
