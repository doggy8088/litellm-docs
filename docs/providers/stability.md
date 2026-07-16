# Stability AI {#stability-ai}
https://stability.ai/

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Stability AI 會為圖像、影片、音訊與 3D 生成建立開放 AI 模型。以 Stable Diffusion 聞名。 |
| LiteLLM 上的提供者路由 | `stability/` |
| 提供者文件連結 | [Stability AI API ↗](https://platform.stability.ai/docs/api-reference) |
| 支援的操作 | [`/images/generations`](#image-generation), [`/images/edits`](#image-editing) |

LiteLLM 支援透過 Stability AI REST API（不是透過 Bedrock）進行 Stability AI 圖像生成請求。

## API 金鑰 {#api-key}

```python
# env variable
os.environ['STABILITY_API_KEY'] = "your-api-key"
```

請從 [Stability AI Platform](https://platform.stability.ai/) 取得您的 API 金鑰。

## 圖像生成 {#image-generation}

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Stability AI image generation call
response = image_generation(
    model="stability/sd3.5-large",
    prompt="A beautiful sunset over a calm ocean",
)
print(response)
```

### 使用方式 - LiteLLM Proxy 伺服器 {#usage---litellm-proxy-server}

#### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: sd3
    litellm_params:
      model: stability/sd3.5-large
      api_key: os.environ/STABILITY_API_KEY
    model_info:
      mode: image_generation

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 proxy {#2-start-the-proxy}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 測試它 {#3-test-it}

```bash showLineNumbers
curl --location 'http://0.0.0.0:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "sd3",
    "prompt": "A beautiful sunset over a calm ocean"
}'
```

### 進階使用方式 - 搭配額外參數 {#advanced-usage---with-additional-parameters}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

response = image_generation(
    model="stability/sd3.5-large",
    prompt="A beautiful sunset over a calm ocean",
    size="1792x1024",  # Maps to aspect_ratio 16:9
    negative_prompt="blurry, low quality",  # Stability-specific
    seed=12345,  # For reproducibility
)
print(response)
```

### 支援的參數 {#supported-parameters}

Stability AI 支援以下 OpenAI 相容參數：

| 參數 | 型別 | 說明 | 範例 |
|-----------|------|-------------|---------|
| `size` | string | 圖像尺寸（對應到 aspect_ratio） | `"1024x1024"` |
| `n` | integer | 圖像數量（注意：Stability 每次請求只回傳 1 張） | `1` |
| `response_format` | string | 回應格式（僅 Stability 的 `b64_json`） | `"b64_json"` |

### 尺寸到長寬比對應 {#size-to-aspect-ratio-mapping}

`size` 參數會自動對應到 Stability 的 `aspect_ratio`：

| OpenAI 尺寸 | Stability 長寬比 |
|-------------|----------------------|
| `1024x1024` | `1:1` |
| `1792x1024` | `16:9` |
| `1024x1792` | `9:16` |
| `512x512` | `1:1` |
| `256x256` | `1:1` |

### 使用 Stability 特定參數 {#using-stability-specific-parameters}

您可以在請求中直接傳遞 Stability AI 專屬參數：

```python showLineNumbers
from litellm import image_generation
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

response = image_generation(
    model="stability/sd3.5-large",
    prompt="A beautiful sunset over a calm ocean",
    # Stability-specific parameters
    negative_prompt="blurry, watermark, text",
    aspect_ratio="16:9",  # Use directly instead of size
    seed=42,
    output_format="png",  # png, jpeg, or webp
)
print(response)
```

### 支援的圖像生成模型 {#supported-image-generation-models}

| 模型名稱 | 函式呼叫 | 說明 |
|------------|---------------|-------------|
| sd3 | `image_generation(model="stability/sd3", ...)` | Stable Diffusion 3 |
| sd3-large | `image_generation(model="stability/sd3-large", ...)` | SD3 Large |
| sd3-large-turbo | `image_generation(model="stability/sd3-large-turbo", ...)` | SD3 Large Turbo（較快） |
| sd3-medium | `image_generation(model="stability/sd3-medium", ...)` | SD3 Medium |
| sd3.5-large | `image_generation(model="stability/sd3.5-large", ...)` | SD 3.5 Large（建議） |
| sd3.5-large-turbo | `image_generation(model="stability/sd3.5-large-turbo", ...)` | SD 3.5 Large Turbo |
| sd3.5-medium | `image_generation(model="stability/sd3.5-medium", ...)` | SD 3.5 Medium |
| stable-image-ultra | `image_generation(model="stability/stable-image-ultra", ...)` | Stable Image Ultra |
| stable-image-core | `image_generation(model="stability/stable-image-core", ...)` | Stable Image Core |

如需更多可用模型與功能的詳細資訊，請參閱：https://platform.stability.ai/docs/api-reference

## 回應格式 {#response-format}

Stability AI 會以 base64 格式回傳圖像。回應與 OpenAI 相容：

```python
{
    "created": 1234567890,
    "data": [
        {
            "b64_json": "iVBORw0KGgo..."  # Base64 encoded image
        }
    ]
}
```

## 圖像編輯 {#image-editing}

Stability AI 支援各種圖像編輯操作，包括 inpainting、upscaling、outpainting、背景移除等。

:::info 選用參數
**重要：** 不同的 Stability 模型有不同的參數需求：
- 有些模型不需要 `prompt`（例如：upscaling、背景移除）
- `style-transfer` 模型使用 `init_image` 和 `style_image`，而不是 `image`
- `outpaint` 模型需要數值參數（`left`、`right`、`up`、`down`）
LiteLLM 會自動為您處理這些差異。
:::

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk-1}

#### Inpainting（使用遮罩編輯） {#inpainting-edit-with-mask}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Inpainting - edit specific areas using a mask
response = image_edit(
    model="stability/stable-image-inpaint-v1:0",
    image=open("original_image.png", "rb"),
    mask=open("mask_image.png", "rb"), 
    prompt="Add a beautiful sunset in the masked area",
    size="1024x1024",
)
print(response)
```

#### 圖像放大 {#image-upscaling}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Conservative upscaling - preserves details
response = image_edit(
    model="stability/stable-conservative-upscale-v1:0",
    image=open("low_res_image.png", "rb"),
    prompt="Upscale this image while preserving details",
)

# Creative upscaling - adds creative details
response = image_edit(
    model="stability/stable-creative-upscale-v1:0",
    image=open("low_res_image.png", "rb"),
    prompt="Upscale and enhance with creative details",
    creativity=0.3,  # 0-0.35, higher = more creative
)

# Fast upscaling - quick upscaling (no prompt needed)
response = image_edit(
    model="stability/stable-fast-upscale-v1:0",
    image=open("low_res_image.png", "rb"),
    # No prompt required for fast upscale
)
print(response)
```

#### 圖像外擴 {#image-outpainting}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Extend image beyond its borders
response = image_edit(
    model="stability/stable-outpaint-v1:0",
    image=open("original_image.png", "rb"),
    prompt="Extend this landscape with mountains",
    left=100,   # Pixels to extend on the left
    right=100,  # Pixels to extend on the right
    up=50,      # Pixels to extend on top
    down=50,    # Pixels to extend on bottom
)
print(response)
```

#### 背景移除 {#background-removal}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Remove background from image
response = image_edit(
    model="stability/stable-image-remove-background-v1:0",
    image=open("portrait.png", "rb"),
    # No prompt required for fast upscale
)
print(response)
```

#### 搜尋並取代 {#search-and-replace}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Search and replace objects in image
response = image_edit(
    model="stability/stable-image-search-replace-v1:0",
    image=open("scene.png", "rb"),
    prompt="A red sports car",
    search_prompt="blue sedan",  # What to replace
)

# Search and recolor
response = image_edit(
    model="stability/stable-image-search-recolor-v1:0",
    image=open("scene.png", "rb"),
    prompt="Make it golden yellow",
    select_prompt="the car",  # What to recolor
)
print(response)
```

#### 圖像控制（草圖/結構） {#image-control-sketchstructure}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Control with sketch
response = image_edit(
    model="stability/stable-image-control-sketch-v1:0",
    image=open("sketch.png", "rb"),
    prompt="Turn this sketch into a realistic photo",
    control_strength=0.7,  # 0-1, higher = more control
)

# Control with structure
response = image_edit(
    model="stability/stable-image-control-structure-v1:0",
    image=open("structure_reference.png", "rb"),
    prompt="Generate image following this structure",
    control_strength=0.7,
)
print(response)
```

#### 擦除物件 {#erase-objects}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Erase objects from image
response = image_edit(
    model="stability/stable-image-erase-object-v1:0",
    image=open("scene.png", "rb"),
    mask=open("object_mask.png", "rb"),  # Mask the object to erase
    # No prompt needed
)
print(response)
```
#### 風格轉換 {#style-transfer}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Transfer style from one image to another
# Note: Uses init_image (via image param) and style_image
response = image_edit(
    model="stability/stable-style-transfer-v1:0",
    image=open("content_image.png", "rb"),  # Maps to init_image
    style_image=open("style_reference.png", "rb"),  # Style to apply
    fidelity=0.5,  # 0-1, balance between content and style
    # No prompt needed
)

print(response)

### Supported Image Edit Models

| Model Name | Function Call | Description |
|------------|---------------|-------------|
| stable-image-inpaint-v1:0 | `image_edit(model="stability/stable-image-inpaint-v1:0", ...)` | Inpainting with mask |
| stable-conservative-upscale-v1:0 | `image_edit(model="stability/stable-conservative-upscale-v1:0", ...)` | Conservative upscaling |
| stable-creative-upscale-v1:0 | `image_edit(model="stability/stable-creative-upscale-v1:0", ...)` | Creative upscaling |
| stable-fast-upscale-v1:0 | `image_edit(model="stability/stable-fast-upscale-v1:0", ...)` | Fast upscaling |
| stable-outpaint-v1:0 | `image_edit(model="stability/stable-outpaint-v1:0", ...)` | Extend image borders |
| stable-image-remove-background-v1:0 | `image_edit(model="stability/stable-image-remove-background-v1:0", ...)` | Remove background |
| stable-image-search-replace-v1:0 | `image_edit(model="stability/stable-image-search-replace-v1:0", ...)` | Search and replace objects |
| stable-image-search-recolor-v1:0 | `image_edit(model="stability/stable-image-search-recolor-v1:0", ...)` | Search and recolor |
| stable-image-control-sketch-v1:0 | `image_edit(model="stability/stable-image-control-sketch-v1:0", ...)` | Control with sketch |
| stable-image-control-structure-v1:0 | `image_edit(model="stability/stable-image-control-structure-v1:0", ...)` | Control with structure |
| stable-image-erase-object-v1:0 | `image_edit(model="stability/stable-image-erase-object-v1:0", ...)` | Erase objects |
| stable-image-style-guide-v1:0 | `image_edit(model="stability/stable-image-style-guide-v1:0", ...)` | Apply style guide |
| stable-style-transfer-v1:0 | `image_edit(model="stability/stable-style-transfer-v1:0", ...)` | Transfer style |

### Usage - LiteLLM Proxy Server

#### 1. Setup config.yaml

```yaml showLineNumbers
model_list:
  - model_name: stability-inpaint
    litellm_params:
      model: stability/stable-image-inpaint-v1:0
      api_key: os.environ/STABILITY_API_KEY
    model_info:
      mode: image_edit

  - model_name: stability-upscale
    litellm_params:
      model: stability/stable-conservative-upscale-v1:0
      api_key: os.environ/STABILITY_API_KEY
    model_info:
      mode: image_edit

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 proxy {#2-start-the-proxy-1}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 測試它 {#3-test-it-1}

```bash showLineNumbers
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer sk-1234" \
  -F "model=stability-inpaint" \
  -F "image=@original_image.png" \
  -F "mask=@mask_image.png" \
  -F "prompt=Add a beautiful garden in the masked area"
```

## AWS Bedrock（Stability） {#aws-bedrock-stability}

LiteLLM 也支援透過 AWS Bedrock 使用 Stability AI 模型。如果您已經在使用 AWS 基礎架構，這會很有用。

### 使用方式 - Bedrock Stability {#usage---bedrock-stability}

```python showLineNumbers
from litellm import image_edit
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-key"
os.environ["AWS_REGION_NAME"] = "us-east-1"

# Bedrock Stability inpainting
response = image_edit(
    model="bedrock/us.stability.stable-image-inpaint-v1:0",
    image=open("original_image.png", "rb"),
    mask=open("mask_image.png", "rb"),
    prompt="Add flowers in the masked area",
)
print(response)
```
# 無需提示詞的快速放大 {#fast-upscale-without-prompt}
response = image_edit(
    model="bedrock/stability.stable-fast-upscale-v1:0",
    image=open("low_res_image.png", "rb"),
)

# 使用數值參數進行外擴 {#outpaint-with-numeric-parameters}
response = image_edit(
    model="bedrock/stability.stable-outpaint-v1:0",
    image=open("original_image.png", "rb"),
    left=100,   # 自動轉換為 int
    right=100,
    up=50,
    down=50,
)

print(response)

### 支援的 Bedrock Stability 模型 {#supported-bedrock-stability-models}

所有 Stability AI 圖像編輯模型都可透過 Bedrock 使用，並帶有 `bedrock/` 前綴：

| 直接 API 模型 | Bedrock 模型 | 說明 |
|------------------|---------------|-------------|
| stability/stable-image-inpaint-v1:0 | bedrock/us.stability.stable-image-inpaint-v1:0 | Inpainting |
| stability/stable-conservative-upscale-v1:0 | bedrock/stability.stable-conservative-upscale-v1:0 | 保守式放大 |
| stability/stable-creative-upscale-v1:0 | bedrock/stability.stable-creative-upscale-v1:0 | 創意式放大 |
| stability/stable-fast-upscale-v1:0 | bedrock/stability.stable-fast-upscale-v1:0 | 快速放大 |
| stability/stable-outpaint-v1:0 | bedrock/stability.stable-outpaint-v1:0 | 外擴 |
| stability/stable-image-remove-background-v1:0 | bedrock/stability.stable-image-remove-background-v1:0 | 移除背景 |
| stability/stable-image-search-replace-v1:0 | bedrock/stability.stable-image-search-replace-v1:0 | 搜尋並取代 |
| stability/stable-image-search-recolor-v1:0 | bedrock/stability.stable-image-search-recolor-v1:0 | 搜尋並重新著色 |
| stability/stable-image-control-sketch-v1:0 | bedrock/stability.stable-image-control-sketch-v1:0 | 使用草圖控制 |
| stability/stable-image-control-structure-v1:0 | bedrock/stability.stable-image-control-structure-v1:0 | 使用結構控制 |
| stability/stable-image-erase-object-v1:0 | bedrock/stability.stable-image-erase-object-v1:0 | 擦除物件 |

**注意：** Bedrock 模型 ID 可能會使用 `us.stability.*` 或 `stability.*` 前綴，視區域與模型而定。

## 比較路由 {#comparing-routes}

LiteLLM 透過兩種路由支援 Stability AI 模型：

| 路由 | 提供者 | 使用情境 | 圖像生成 | 圖像編輯 |
|-------|----------|----------|------------------|---------------|
| `stability/` | Stability AI Direct API | 直接存取、所有最新模型 | ✅ | ✅ |
| `bedrock/stability.*` | AWS Bedrock | AWS 整合、企業功能 | ✅ | ✅ |

直接 API 存取請使用 `stability/`。如果您已經在使用 AWS Bedrock，請使用 `bedrock/stability.*`。
