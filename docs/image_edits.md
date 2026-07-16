import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /images/edits {#imagesedits}

LiteLLM 提供影像編輯功能，對應到 OpenAI 的 `/images/edits` API 端點。現在支援單張與多張影像編輯。

| 功能 | 支援 | 備註 |
|---------|-----------|--------|
| 成本追蹤 | ✅ | 適用於所有支援的模型 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 支援的操作 | 建立影像編輯 | 支援單張與多張影像 |
| 支援的 LiteLLM SDK 版本 | 1.63.8+ | Gemini 支援需要 1.79.3+ |
| 支援的 LiteLLM Proxy 版本 | 1.71.1+ | Gemini 支援需要 1.79.3+ |
| 支援的 LLM 提供者 | **OpenAI**, **Gemini (Google AI Studio)**, **Vertex AI**, **OpenRouter**, **Stability AI**, **AWS Bedrock (Stability)**, **Black Forest Labs** | Gemini 支援新的 `gemini-2.5-flash-image` 系列。Vertex AI 同時支援 Gemini 與 Imagen 模型。OpenRouter 透過 chat completions 路由影像編輯。Stability AI 與 Bedrock Stability 支援各種影像編輯操作。Black Forest Labs 支援 FLUX Kontext 模型。 |

 #### ⚡️請參閱 [models.litellm.ai](https://models.litellm.ai/) 以查看所有支援的模型與提供者

## 使用方式 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="openai" label="OpenAI">

#### 基本影像編輯 {#basic-image-edit}
```python showLineNumbers title="OpenAI Image Edit"
import litellm

# Edit an image with a prompt
response = litellm.image_edit(
    model="gpt-image-1",
    image=open("original_image.png", "rb"),
    prompt="Add a red hat to the person in the image",
    n=1,
    size="1024x1024"
)

print(response)
```

#### 多張影像編輯 {#multiple-images-edit}
```python showLineNumbers title="OpenAI Multiple Images Edit"
import litellm

# Edit multiple images with a prompt
response = litellm.image_edit(
    model="gpt-image-1",
    image=[
        open("image1.png", "rb"),
        open("image2.png", "rb"),
        open("image3.png", "rb")
    ],
    prompt="Apply vintage filter to all images",
    n=1,
    size="1024x1024"
)

print(response)
```

#### 含遮罩的影像編輯 {#image-edit-with-mask}
```python showLineNumbers title="OpenAI Image Edit with Mask"
import litellm

# Edit an image with a mask to specify the area to edit
response = litellm.image_edit(
    model="gpt-image-1",
    image=open("original_image.png", "rb"),
    mask=open("mask_image.png", "rb"),  # Transparent areas will be edited
    prompt="Replace the background with a beach scene",
    n=2,
    size="512x512",
    response_format="url"
)

print(response)
```

#### 非同步影像編輯 {#async-image-edit}
```python showLineNumbers title="Async OpenAI Image Edit"
import litellm
import asyncio

async def edit_image():
    response = await litellm.aimage_edit(
        model="gpt-image-1",
        image=open("original_image.png", "rb"),
        prompt="Make the image look like a painting",
        n=1,
        size="1024x1024",
        response_format="b64_json"
    )
    return response

# Run the async function
response = asyncio.run(edit_image())
print(response)
```

#### 非同步多張影像編輯 {#async-multiple-images-edit}
```python showLineNumbers title="Async OpenAI Multiple Images Edit"
import litellm
import asyncio

async def edit_multiple_images():
    response = await litellm.aimage_edit(
        model="gpt-image-1",
        image=[
            open("portrait1.png", "rb"),
            open("portrait2.png", "rb")
        ],
        prompt="Add professional lighting to the portraits",
        n=1,
        size="1024x1024",
        response_format="url"
    )
    return response

# Run the async function
response = asyncio.run(edit_multiple_images())
print(response)
```

#### 含自訂參數的影像編輯 {#image-edit-with-custom-parameters}
```python showLineNumbers title="OpenAI Image Edit with Custom Parameters"
import litellm

# Edit image with additional parameters
response = litellm.image_edit(
    model="gpt-image-1",
    image=open("portrait.png", "rb"),
    prompt="Add sunglasses and a smile",
    n=3,
    size="1024x1024",
    response_format="url",
    user="user-123",
    timeout=60,
    extra_headers={"Custom-Header": "value"}
)

print(f"Generated {len(response.data)} image variations")
for i, image_data in enumerate(response.data):
    print(f"Image {i+1}: {image_data.url}")
```

</TabItem>

<TabItem value="gemini" label="Gemini">

#### 基本影像編輯 {#basic-image-edit-gemini-tab}
```python showLineNumbers title="Gemini Image Edit"
import base64
import os
from litellm import image_edit

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = image_edit(
    model="gemini/gemini-2.5-flash-image",
    image=open("original_image.png", "rb"),
    prompt="Add aurora borealis to the night sky",
    size="1792x1024",  # mapped to aspectRatio=16:9 for Gemini
)

edited_image_bytes = base64.b64decode(response.data[0].b64_json)
with open("edited_image.png", "wb") as f:
    f.write(edited_image_bytes)
```

#### 多張影像編輯 {#multiple-images-edit-1}
```python showLineNumbers title="Gemini Multiple Images Edit"
import base64
import os
from litellm import image_edit

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = image_edit(
    model="gemini/gemini-2.5-flash-image",
    image=[
        open("scene.png", "rb"),
        open("style_reference.png", "rb"),
    ],
    prompt="Blend the reference style into the scene while keeping the subject sharp.",
)

for idx, image_obj in enumerate(response.data):
    with open(f"gemini_edit_{idx}.png", "wb") as f:
        f.write(base64.b64decode(image_obj.b64_json))
```

</TabItem>

<TabItem value="bfl" label="Black Forest Labs">

#### 基本影像編輯 {#basic-image-edit-1}
```python showLineNumbers title="Black Forest Labs Image Edit"
import os
import litellm

os.environ["BFL_API_KEY"] = "your-api-key"

response = litellm.image_edit(
    model="black_forest_labs/flux-kontext-pro",
    image=open("original_image.png", "rb"),
    prompt="Add a green leaf to the scene",
)

print(response.data[0].url)
```

#### 以遮罩進行局部重繪 {#inpainting-with-mask}
```python showLineNumbers title="Black Forest Labs Inpainting"
import os
import litellm

os.environ["BFL_API_KEY"] = "your-api-key"

# Use flux-pro-1.0-fill for inpainting
response = litellm.image_edit(
    model="black_forest_labs/flux-pro-1.0-fill",
    image=open("original_image.png", "rb"),
    mask=open("mask_image.png", "rb"),
    prompt="Replace with a garden",
)

print(response.data[0].url)
```

#### 影像外延（擴展） {#outpainting-expand}
```python showLineNumbers title="Black Forest Labs Outpainting"
import os
import litellm

os.environ["BFL_API_KEY"] = "your-api-key"

# Use flux-pro-1.0-expand to extend image borders
response = litellm.image_edit(
    model="black_forest_labs/flux-pro-1.0-expand",
    image=open("original_image.png", "rb"),
    prompt="Continue the scene with mountains",
    top=256,
    bottom=256,
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="vertex_ai" label="Vertex AI">

#### 基本影像編輯（Gemini） {#basic-image-edit-gemini}
```python showLineNumbers title="Vertex AI Gemini Image Edit"
import os
import litellm

# Set Vertex AI credentials
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/service-account.json"

response = litellm.image_edit(
    model="vertex_ai/gemini-2.5-flash",
    image=open("original_image.png", "rb"),
    prompt="Add neon lights in the background",
    size="1024x1024",
)

print(response)
```

#### 使用 Imagen 的影像編輯（支援遮罩） {#image-edit-with-imagen-supports-masks}
```python showLineNumbers title="Vertex AI Imagen Image Edit"
import os
import litellm

# Set Vertex AI credentials
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/service-account.json"

# Imagen supports mask for inpainting
response = litellm.image_edit(
    model="vertex_ai/imagen-3.0-capability-001",
    image=open("original_image.png", "rb"),
    mask=open("mask_image.png", "rb"),  # Optional: for inpainting
    prompt="Turn this into watercolor style scenery",
    n=2,  # Number of variations
    size="1024x1024",
)

print(response)
```

</TabItem>

<TabItem value="openrouter" label="OpenRouter">

#### 基本影像編輯 {#basic-image-edit-2}
```python showLineNumbers title="OpenRouter Image Edit"
import os
from litellm import image_edit

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

response = image_edit(
    model="openrouter/google/gemini-2.5-flash-image",
    image=open("original_image.png", "rb"),
    prompt="Add aurora borealis to the night sky",
)

print(response)
```

#### 多張影像編輯 {#multiple-images-edit-2}
```python showLineNumbers title="OpenRouter Multiple Images Edit"
import os
from litellm import image_edit

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

response = image_edit(
    model="openrouter/google/gemini-2.5-flash-image",
    image=[
        open("scene.png", "rb"),
        open("style_reference.png", "rb"),
    ],
    prompt="Blend the reference style into the scene",
    size="1536x1024",   # mapped to aspect_ratio 3:2
    quality="high",      # mapped to image_size 4K
)

print(response)
```

</TabItem>
</Tabs>

### 搭配 OpenAI SDK 的 LiteLLM Proxy {#litellm-proxy-with-openai-sdk}

<Tabs>
<TabItem value="openai" label="OpenAI">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="OpenAI Proxy Configuration"
model_list:
  - model_name: gpt-image-1
    litellm_params:
      model: gpt-image-1
      api_key: os.environ/OPENAI_API_KEY
```

啟動 LiteLLM proxy server：

```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 透過 Proxy 進行基本影像編輯 {#basic-image-edit-via-proxy}
```python showLineNumbers title="OpenAI Proxy Image Edit"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Edit an image
response = client.images.edit(
    model="gpt-image-1",
    image=open("original_image.png", "rb"),
    prompt="Add a red hat to the person in the image",
    n=1,
    size="1024x1024"
)

print(response)
```

#### cURL 範例 {#curl-example}
```bash showLineNumbers title="cURL Image Edit Request"
curl -X POST "http://localhost:4000/v1/images/edits" \
  -H "Authorization: Bearer your-api-key" \
  -F "model=gpt-image-1" \
  -F "image=@original_image.png" \
  -F "mask=@mask_image.png" \
  -F "prompt=Add a beautiful sunset in the background" \
  -F "n=1" \
  -F "size=1024x1024" \
  -F "response_format=url"
```

#### cURL 多張影像範例 {#curl-multiple-images-example}
```bash showLineNumbers title="cURL Multiple Images Edit Request"
curl -X POST "http://localhost:4000/v1/images/edits" \
  -H "Authorization: Bearer your-api-key" \
  -F "model=gpt-image-1" \
  -F "image=@image1.png" \
  -F "image=@image2.png" \
  -F "image=@image3.png" \
  -F "prompt=Apply artistic filter to all images" \
  -F "n=1" \
  -F "size=1024x1024" \
  -F "response_format=url"
```

```

</TabItem>

<TabItem value="gemini" label="Gemini">

1. Add the Gemini image edit model to your `config.yaml`:
```yaml showLineNumbers title="Gemini Proxy Configuration"
model_list:
  - model_name: gemini-image-edit
    litellm_params:
      model: gemini/gemini-2.5-flash-image
      api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 LiteLLM proxy server：
```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml
```

3. 發送影像編輯請求（Gemini 回應僅限 base64）：
```bash showLineNumbers title="Gemini Proxy Image Edit"
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -F "model=gemini-image-edit" \
  -F "image=@original_image.png" \
  -F "prompt=Add a warm golden-hour glow to the scene" \
  -F "size=1024x1024"
```

</TabItem>

<TabItem value="bfl" label="Black Forest Labs">

1. 將 Black Forest Labs 影像編輯模型加入您的 `config.yaml`：
```yaml showLineNumbers title="Black Forest Labs Proxy Configuration"
model_list:
  - model_name: bfl-kontext-pro
    litellm_params:
      model: black_forest_labs/flux-kontext-pro
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_edit
```

2. 啟動 LiteLLM proxy server：
```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml
```

3. 發送影像編輯請求：
```bash showLineNumbers title="Black Forest Labs Proxy Image Edit"
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -F "model=bfl-kontext-pro" \
  -F "image=@original_image.png" \
  -F "prompt=Add a sunset in the background"
```

</TabItem>

<TabItem value="vertex_ai" label="Vertex AI">

1. 將 Vertex AI 影像編輯模型加入您的 `config.yaml`：
```yaml showLineNumbers title="Vertex AI Proxy Configuration"
model_list:
  - model_name: vertex-gemini-image-edit
    litellm_params:
      model: vertex_ai/gemini-2.5-flash
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: os.environ/VERTEXAI_LOCATION
      vertex_credentials: os.environ/GOOGLE_APPLICATION_CREDENTIALS

  - model_name: vertex-imagen-image-edit
    litellm_params:
      model: vertex_ai/imagen-3.0-capability-001
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: os.environ/VERTEXAI_LOCATION
      vertex_credentials: os.environ/GOOGLE_APPLICATION_CREDENTIALS
```

2. 啟動 LiteLLM proxy server：
```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml
```

3. 發送影像編輯請求：
```bash showLineNumbers title="Vertex AI Gemini Proxy Image Edit"
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -F "model=vertex-gemini-image-edit" \
  -F "image=@original_image.png" \
  -F "prompt=Add neon lights in the background" \
  -F "size=1024x1024"
```

4. 使用遮罩的 Imagen 影像編輯：
```bash showLineNumbers title="Vertex AI Imagen Proxy Image Edit with Mask"
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -F "model=vertex-imagen-image-edit" \
  -F "image=@original_image.png" \
  -F "mask=@mask_image.png" \
  -F "prompt=Turn this into watercolor style scenery" \
  -F "n=2" \
  -F "size=1024x1024"
```

</TabItem>

<TabItem value="openrouter" label="OpenRouter">

1. 將 OpenRouter 影像編輯模型加入您的 `config.yaml`：
```yaml showLineNumbers title="OpenRouter Proxy Configuration"
model_list:
  - model_name: openrouter-image-edit
    litellm_params:
      model: openrouter/google/gemini-2.5-flash-image
      api_key: os.environ/OPENROUTER_API_KEY
```

2. 啟動 LiteLLM proxy server：
```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml
```

3. 發送影像編輯請求：
```bash showLineNumbers title="OpenRouter Proxy Image Edit"
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -F "model=openrouter-image-edit" \
  -F "image=@original_image.png" \
  -F "prompt=Make the sky a vibrant purple sunset" \
  -F "size=1024x1024"
```

</TabItem>
</Tabs>

## 支援的影像編輯參數 {#supported-image-edit-parameters}

| 參數 | 類型 | 描述 | 必填 |
|-----------|------|-------------|----------|
| `image` | `FileTypes` | 要編輯的影像。必須是有效的 PNG 檔案，小於 4MB，且為正方形。 | ✅ |
| `prompt` | `str` | 所需影像編輯的文字描述。 | ✅ |
| `model` | `str` | 用於影像編輯的模型 | 選填（預設為 `dall-e-2`） |
| `mask` | `str` | 另一張影像，其完全透明的區域表示原始影像應被編輯的位置。必須是有效的 PNG 檔案，小於 4MB，且尺寸與 `image` 相同。 | 選填 |
| `n` | `int` | 要產生的影像數量。必須介於 1 到 10 之間。 | 選填（預設為 1） |
| `size` | `str` | 生成影像的尺寸。必須為 `256x256`、`512x512` 或 `1024x1024` 之一。 | 選填（預設為 `1024x1024`） |
| `response_format` | `str` | 回傳生成影像的格式。必須為 `url` 或 `b64_json` 之一。 | 選填（預設為 `url`） |
| `user` | `str` | 代表您的終端使用者的唯一識別碼。 | 選填 |

## 回應格式 {#response-format}

回應遵循 OpenAI Images API 格式：

```python showLineNumbers title="Image Edit Response Structure"
{
    "created": 1677649800,
    "data": [
        {
            "url": "https://example.com/edited_image_1.png"
        },
        {
            "url": "https://example.com/edited_image_2.png"
        }
    ]
}
```

對於 `b64_json` 格式：
```python showLineNumbers title="Base64 Response Structure"
{
    "created": 1677649800,
    "data": [
        {
            "b64_json": "iVBORw0KGgoAAAANSUhEUgAA..."
        }
    ]
}
```
