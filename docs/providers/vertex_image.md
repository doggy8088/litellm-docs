# Vertex AI 圖片生成 {#vertex-ai-image-generation}

Vertex AI 支援兩種類型的圖片生成：

1. **Gemini 圖片生成模型**（Nano Banana 🍌）- 使用 `generateContent` API 進行對話式圖片生成
2. **Imagen 模型** - 使用 `predict` API 進行傳統圖片生成

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Vertex AI 圖片生成同時支援 Gemini 圖片生成模型 |
| LiteLLM 上的提供者路由 | `vertex_ai/` |
| 提供者文件 | [Google Cloud Vertex AI Image Generation ↗](https://cloud.google.com/vertex-ai/docs/generative-ai/image/generate-images) |
| Gemini Image Generation 文件 | [Gemini Image Generation ↗](https://ai.google.dev/gemini-api/docs/image-generation) |

## 快速開始 {#quick-start}

### Gemini 圖片生成模型 {#gemini-image-generation-models}

Gemini 圖片生成模型支援具備以下功能的對話式圖片建立：
- 文字轉圖片生成
- 圖片編輯（文字 + 圖片 → 圖片）
- 多輪圖片精修
- 高擬真文字渲染
- 最高 4K 解析度（Gemini 3 Pro）

```python showLineNumbers title="Gemini 2.5 Flash Image"
import litellm

# Generate a single image
response = await litellm.aimage_generation(
    prompt="A nano banana dish in a fancy restaurant with a Gemini theme",
    model="vertex_ai/gemini-2.5-flash-image",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
    n=1,
    size="1024x1024",
)

print(response.data[0].b64_json)  # Gemini returns base64 images
```

```python showLineNumbers title="Gemini 3 Pro Image Preview (4K output)"
import litellm

# Generate high-resolution image
response = await litellm.aimage_generation(
    prompt="Da Vinci style anatomical sketch of a dissected Monarch butterfly",
    model="vertex_ai/gemini-3-pro-image-preview",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
    n=1,
    size="1024x1024",
    # Optional: specify image size for Gemini 3 Pro
    # imageSize="4K",  # Options: "1K", "2K", "4K"
)

print(response.data[0].b64_json)
```

### Google 搜尋 Grounding {#google-search-grounding}

Gemini 圖片模型（例如 `gemini-3.1-flash-image-preview`、`gemini-3-pro-image-preview`）支援在 `/v1/images/generations` 上使用 Google 搜尋。LiteLLM 會將 `web_search_options` 或 OpenAI 風格的 `web_search` 工具對應到 Gemini 的 `googleSearch` 工具，並套用到底層的 `generateContent` 請求。

```python showLineNumbers title="Image generation with Google Search"
import litellm

response = await litellm.aimage_generation(
    prompt="Generate an image of the latest iPhone design",
    model="vertex_ai/gemini-3.1-flash-image-preview",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
    web_search_options={},
)

print(response.data[0].b64_json)
```

```python showLineNumbers title="Using OpenAI-style web_search tool"
import litellm

response = await litellm.aimage_generation(
    prompt="Generate an image of the latest iPhone design",
    model="vertex_ai/gemini-3.1-flash-image-preview",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
    tools=[{"type": "web_search"}],
)
```

透過 LiteLLM Proxy（`/v1/images/generations`）：

```bash showLineNumbers title="Proxy request with web_search_options"
curl -X POST 'http://localhost:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gemini-3.1-flash-image-preview",
    "prompt": "Generate an image of the latest iPhone design",
    "web_search_options": {}
}'
```

### 傳遞 imageConfig（Gemini 模型） {#passing-imageconfig-gemini-models}

Gemini 圖片生成模型支援完整的 [`ImageConfig`](https://cloud.google.com/vertex-ai/docs/reference/rpc/google.cloud.aiplatform.v1#imageconfig) 物件。請將其作為任何 `/v1/images/generations` 請求上的 `imageConfig` 傳入，LiteLLM 會將所有欄位原封不動轉送至 `generationConfig.imageConfig`。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `aspectRatio` | string | `"1:1"`、`"16:9"`、`"9:16"`、`"4:3"`、`"3:4"`、`"4:5"`、`"5:4"`、`"2:3"`、`"3:2"`、`"21:9"` |
| `imageSize` | string | `"1K"`、`"2K"`、`"4K"`（Gemini 3 Pro 及更新版本支援） |
| `personGeneration` | string | `"DONT_ALLOW"`、`"ALLOW_ADULT"`、`"ALLOW_ALL"` |
| `imageOutputOptions` | object | `{"mimeType": "image/jpeg"\|"image/png"\|"image/webp", "compressionQuality": 0–100}` |

```python showLineNumbers title="Passing imageConfig via Python SDK"
import litellm

response = await litellm.aimage_generation(
    model="vertex_ai/gemini-3.1-flash-image",
    prompt="A nano banana on a desk",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
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
```

```bash showLineNumbers title="Passing imageConfig via Proxy"
curl -X POST 'http://localhost:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "gemini-3.1-flash-image",
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

您也可以使用扁平參數作為 `aspectRatio` 和 `imageSize` 的簡寫：

```python showLineNumbers title="Flat param shorthand"
response = await litellm.aimage_generation(
    model="vertex_ai/gemini-3.1-flash-image",
    prompt="A nano banana on a desk",
    aspect_ratio="16:9",   # or aspectRatio="16:9"
    image_size="2K",       # or imageSize="2K"
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
)
```

扁平參數（`aspect_ratio`、`image_size`、`aspectRatio`、`imageSize`）在兩者同時存在時，會覆蓋 `imageConfig` 內的相同鍵值。

### Imagen 模型 {#imagen-models}

```python showLineNumbers title="Imagen Image Generation"
import litellm

# Generate a single image
response = await litellm.aimage_generation(
    prompt="An olympic size swimming pool with crystal clear water and modern architecture",
    model="vertex_ai/imagen-4.0-generate-001",
    vertex_ai_project="your-project-id",
    vertex_ai_location="us-central1",
    n=1,
    size="1024x1024",
)

print(response.data[0].b64_json)  # Imagen also returns base64 images
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Vertex AI Image Generation Configuration"
model_list:
  - model_name: vertex-imagen
    litellm_params:
      model: vertex_ai/imagen-4.0-generate-001
      vertex_ai_project: "your-project-id"
      vertex_ai_location: "us-central1"
      vertex_ai_credentials: "path/to/service-account.json"  # Optional if using environment auth
```

#### 2. 啟動 LiteLLM Proxy Server {#2-start-litellm-proxy-server}

```bash title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 使用 OpenAI Python SDK 發出請求 {#3-make-requests-with-openai-python-sdk}

```python showLineNumbers title="Basic Image Generation via Proxy"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"      # Your proxy API key
)

# Generate image
response = client.images.generate(
    model="vertex-imagen",
    prompt="An olympic size swimming pool with crystal clear water and modern architecture",
)

print(response.data[0].url)
```

## 支援的模型 {#supported-models}

### Gemini 圖片生成模型 {#gemini-image-generation-models-1}

- `vertex_ai/gemini-2.5-flash-image` - 快速且高效的圖片生成（1024px 解析度）
- `vertex_ai/gemini-3.1-flash-image-preview` - 具備 Google 搜尋 grounding 的快速圖片生成
- `vertex_ai/gemini-3-pro-image-preview` - 進階模型，具備 4K 輸出、Google 搜尋 grounding 與思考模式
- `vertex_ai/gemini-2.0-flash-preview-image` - 預覽模型
- `vertex_ai/gemini-2.5-flash-image-preview` - 預覽模型

### Imagen 模型 {#imagen-models-1}

- `vertex_ai/imagegeneration@006` - 傳統 Imagen 模型
- `vertex_ai/imagen-4.0-generate-001` - 最新 Imagen 模型
- `vertex_ai/imagen-3.0-generate-001` - Imagen 3.0 模型

:::tip

**我們支援所有 Vertex AI 圖片生成模型，只要在傳送 litellm 請求時將 `model=vertex_ai/<any-model-on-vertex_ai>` 設為前綴即可**

:::

如需完整且最新的支援模型清單，請前往：[https://models.litellm.ai/](https://models.litellm.ai/)
