import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Google AI Studio 圖像生成 {#google-ai-studio-image-generation}

Google AI Studio 提供強大的圖像生成功能，使用 Google 的 Imagen 模型，根據文字描述建立高品質圖像。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Google AI Studio 圖像生成使用 Google 的 Imagen 模型，根據文字描述生成高品質圖像。 |
| LiteLLM 上的提供者路由 | `gemini/` |
| 提供者文件 | [Google AI Studio 圖像生成 ↗](https://ai.google.dev/gemini-api/docs/imagen) |
| 支援的操作 | [`/images/generations`](#image-generation) |

## 設定 {#setup}

### API 金鑰 {#api-key}

```python showLineNumbers
# Set your Google AI Studio API key
import os
os.environ["GEMINI_API_KEY"] = "your-api-key-here"
```

請從 [Google AI Studio](https://aistudio.google.com/app/apikey) 取得您的 API 金鑰。

## 圖像生成 {#image-generation}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

```python showLineNumbers title="Basic Image Generation"
import litellm
import os

# Set your API key
os.environ["GEMINI_API_KEY"] = "your-api-key-here"

# Generate a single image
response = litellm.image_generation(
    model="gemini/imagen-4.0-generate-001",
    prompt="A cute baby sea otter swimming in crystal clear water"
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
    # Set your API key
    os.environ["GEMINI_API_KEY"] = "your-api-key-here"
    
    # Generate image asynchronously
    response = await litellm.aimage_generation(
        model="gemini/imagen-4.0-generate-001",
        prompt="A beautiful sunset over mountains with vibrant colors",
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

# Set your API key
os.environ["GEMINI_API_KEY"] = "your-api-key-here"

# Generate image with additional parameters
response = litellm.image_generation(
    model="gemini/imagen-4.0-generate-001",
    prompt="A futuristic cityscape at night with neon lights",
    n=1,
    size="1024x1024",
    quality="standard",
    response_format="url"
)

for image in response.data:
    print(f"Generated image URL: {image.url}")
```

</TabItem>
</Tabs>

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Google AI Studio Image Generation Configuration"
model_list:
  - model_name: google-imagen
    litellm_params:
      model: gemini/imagen-4.0-generate-001
      api_key: os.environ/GEMINI_API_KEY
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

```python showLineNumbers title="Google AI Studio Image Generation via Proxy - OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="sk-1234"                  # Your proxy API key
)

# Generate image
response = client.images.generate(
    model="google-imagen",
    prompt="A majestic eagle soaring over snow-capped mountains",
    n=1,
    size="1024x1024"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Google AI Studio Image Generation via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.image_generation(
    model="litellm_proxy/google-imagen",
    prompt="A serene Japanese garden with cherry blossoms",
    api_base="http://localhost:4000",
    api_key="sk-1234"
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Google AI Studio Image Generation via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "google-imagen",
    "prompt": "A cozy coffee shop interior with warm lighting",
    "n": 1,
    "size": "1024x1024"
}'
```

</TabItem>
</Tabs>

## Gemini 圖像模型 {#gemini-image-models}

Gemini 圖像模型（例如 `gemini-3.1-flash-image-preview`、`gemini-3-pro-image-preview`）使用 `generateContent` API，並回傳 base64 圖像。它們也支援 `/v1/images/generations` 上的**Google Search grounding**。

```python showLineNumbers title="Gemini image generation with Google Search"
import litellm
import os

os.environ["GEMINI_API_KEY"] = "your-api-key-here"

response = litellm.image_generation(
    model="gemini/gemini-3.1-flash-image-preview",
    prompt="Generate an image of the latest iPhone design",
    web_search_options={},
)

print(response.data[0].b64_json)
```

```bash showLineNumbers title="Proxy request with web_search_options"
curl --location 'http://localhost:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "gemini-3.1-flash-image-preview",
    "prompt": "Generate an image of the latest iPhone design",
    "web_search_options": {}
}'
```

您也可以傳遞 `tools=[{"type": "web_search"}]` 或原生 `tools=[{"googleSearch": {}}]`。

### 傳遞 imageConfig {#passing-imageconfig}

Gemini 圖像模型接受完整的 `imageConfig` 物件。所有欄位都會直接對應到基礎 `generateContent` 請求中的 `generationConfig.imageConfig`。

```python showLineNumbers title="imageConfig with all fields"
import litellm
import os

os.environ["GEMINI_API_KEY"] = "your-api-key-here"

response = litellm.image_generation(
    model="gemini/gemini-3.1-flash-image-preview",
    prompt="A nano banana on a desk",
    imageConfig={
        "aspectRatio": "16:9",
        "imageSize": "2K",
        "personGeneration": "DONT_ALLOW",
        "imageOutputOptions": {
            "mimeType": "image/jpeg",
            "compressionQuality": 85,
        },
    },
)

print(response.data[0].b64_json)
```

```bash showLineNumbers title="imageConfig via Proxy"
curl --location 'http://localhost:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "gemini-3.1-flash-image-preview",
    "prompt": "A nano banana on a desk",
    "imageConfig": {
        "aspectRatio": "16:9",
        "imageSize": "2K",
        "personGeneration": "DONT_ALLOW",
        "imageOutputOptions": {
            "mimeType": "image/jpeg",
            "compressionQuality": 85
        }
    }
}'
```

## 支援的參數 {#supported-parameters}

Google AI Studio 圖像生成支援以下與 OpenAI 相容的參數：

| 參數 | 類型 | 說明 | 預設值 | 範例 |
|-----------|------|-------------|---------|---------|
| `prompt` | string | 要生成之圖像的文字描述 | 必填 | `"A sunset over the ocean"` |
| `model` | string | 用於生成的模型 | 必填 | `"gemini/imagen-4.0-generate-001"` |
| `n` | integer | 要生成的圖像數量（1-4） | `1` | `2` |
| `size` | string | 圖像尺寸 | `"1024x1024"` | `"512x512"`、`"1024x1024"` |
| `web_search_options` | object | 啟用 Google Search grounding（僅限 Gemini 圖像模型） | - | `{}` |
| `tools` | array | 傳遞 `{"type": "web_search"}` 或 `{"googleSearch": {}}`（僅限 Gemini 圖像模型） | - | `[{"type": "web_search"}]` |
| `imageConfig` | object | 完整的 [ImageConfig](https://cloud.google.com/vertex-ai/docs/reference/rpc/google.cloud.aiplatform.v1#imageconfig) 物件（僅限 Gemini 圖像模型）。欄位：`aspectRatio`、`imageSize`、`personGeneration`、`imageOutputOptions` | - | `{"aspectRatio": "16:9", "imageSize": "2K"}` |

1. 在 [Google AI Studio](https://aistudio.google.com/) 建立帳戶
2. 從 [API Keys 區段](https://aistudio.google.com/app/apikey) 產生 API 金鑰
3. 設定您的 `GEMINI_API_KEY` 環境變數
4. 開始使用 LiteLLM 生成圖像

## 其他資源 {#additional-resources}

- [Google AI Studio 文件](https://ai.google.dev/gemini-api/docs)
- [Imagen 模型概覽](https://ai.google.dev/gemini-api/docs/imagen)
- [LiteLLM 圖像生成指南](../../completion/image_generation)
