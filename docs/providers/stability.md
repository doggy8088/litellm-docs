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
  master_key: os.environ/LITELLM_MASTER_KEY
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
--header "Authorization: Bearer $LITELLM_API_KEY" \
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

:::info[可選參數]
**重要：** 不同的 Stability 模型有不同的參數需求：
- 有些模型不需要 `prompt`（例如：放大、背景移除）
- `outpaint` 模型接受數值型的 `left` 與 `right` 像素數。LiteLLM 不會轉送 `up` 或 `down`，這些是 Stability 用於垂直 outpainting 的欄位，因此目前只有水平 outpainting 可透過 `stability/` 使用
- 目前無法透過 `stability/` 使用 Style Transfer：`stability/style-transfer` 會解析為 Style Guide 端點（`/v2beta/stable-image/control/style`），且輸入一律會以 `image` 傳送，而 Stability 的 Style Transfer 端點需要 `init_image`
:::

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk-1}

#### Inpainting（使用遮罩編輯） {#inpainting-edit-with-mask}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Inpainting - edit specific areas using a mask
response = image_edit(
    model="stability/inpaint",
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
    model="stability/conservative",
    image=open("low_res_image.png", "rb"),
    prompt="Upscale this image while preserving details",
)

# Creative upscaling - adds creative details
response = image_edit(
    model="stability/creative",
    image=open("low_res_image.png", "rb"),
    prompt="Upscale and enhance with creative details",
    creativity=0.3,  # 0-0.35, higher = more creative
)

# Fast upscaling - quick upscaling (no prompt needed)
response = image_edit(
    model="stability/fast",
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
    model="stability/outpaint",
    image=open("original_image.png", "rb"),
    prompt="Extend this landscape with mountains",
    left=100,   # Pixels to extend on the left
    right=100,  # Pixels to extend on the right
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
    model="stability/remove-background",
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
    model="stability/search-and-replace",
    image=open("scene.png", "rb"),
    prompt="A red sports car",
    search_prompt="blue sedan",  # What to replace
)

# Search and recolor
response = image_edit(
    model="stability/search-and-recolor",
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
    model="stability/sketch",
    image=open("sketch.png", "rb"),
    prompt="Turn this sketch into a realistic photo",
    control_strength=0.7,  # 0-1, higher = more control
)

# Control with structure
response = image_edit(
    model="stability/structure",
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
    model="stability/erase",
    image=open("scene.png", "rb"),
    mask=open("object_mask.png", "rb"),  # Mask the object to erase
    # No prompt needed
)
print(response)
```

#### Style Guide {#style-guide}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['STABILITY_API_KEY'] = "your-api-key"

# Generate a new image in the style of a reference image
response = image_edit(
    model="stability/style",
    image=open("style_reference.png", "rb"),  # Style reference
    prompt="A lighthouse on a cliff at sunset",
)

print(response)
```

### 支援的影像編輯模型 {#supported-image-edit-models}

| 模型名稱 | 函式呼叫 | 說明 |
|------------|---------------|-------------|
| inpaint | `image_edit(model="stability/inpaint", ...)` | 使用遮罩進行 inpainting |
| conservative | `image_edit(model="stability/conservative", ...)` | 保守式放大 |
| creative | `image_edit(model="stability/creative", ...)` | 創意式放大 |
| fast | `image_edit(model="stability/fast", ...)` | 快速放大 |
| outpaint | `image_edit(model="stability/outpaint", ...)` | 延伸影像邊界 |
| remove-background | `image_edit(model="stability/remove-background", ...)` | 移除背景 |
| search-and-replace | `image_edit(model="stability/search-and-replace", ...)` | 搜尋並取代物件 |
| search-and-recolor | `image_edit(model="stability/search-and-recolor", ...)` | 搜尋並重新著色 |
| sketch | `image_edit(model="stability/sketch", ...)` | 以草圖控制 |
| structure | `image_edit(model="stability/structure", ...)` | 以結構控制 |
| erase | `image_edit(model="stability/erase", ...)` | 擦除物件 |
| style | `image_edit(model="stability/style", ...)` | 套用風格指南 |

### 使用方式 - LiteLLM Proxy 伺服器 {#usage---litellm-proxy-server-1}

#### 1. 設定 config.yaml {#1-setup-configyaml-1}

```yaml showLineNumbers
model_list:
  - model_name: stability-inpaint
    litellm_params:
      model: stability/inpaint
      api_key: os.environ/STABILITY_API_KEY
    model_info:
      mode: image_edit

  - model_name: stability-upscale
    litellm_params:
      model: stability/conservative
      api_key: os.environ/STABILITY_API_KEY
    model_info:
      mode: image_edit

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

#### 2. 啟動 proxy {#2-start-the-proxy-1}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 測試它 {#3-test-it-1}

```bash showLineNumbers
curl -X POST "http://0.0.0.0:4000/v1/images/edits" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -F "model=stability-inpaint" \
  -F "image=@original_image.png" \
  -F "mask=@mask_image.png" \
  -F "prompt=Add a beautiful garden in the masked area"
```

## AWS Bedrock（Stability） {#aws-bedrock-stability}

LiteLLM 也支援透過 AWS Bedrock 使用 Stability AI 模型。如果您已經在使用 AWS 基礎架構，這會很有幫助。

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

# Fast upscale without prompt
response = image_edit(
    model="bedrock/stability.stable-fast-upscale-v1:0",
    image=open("low_res_image.png", "rb"),
)

# Outpaint with numeric parameters
response = image_edit(
    model="bedrock/stability.stable-outpaint-v1:0",
    image=open("original_image.png", "rb"),
    left=100,   # Automatically converted to int
    right=100,
    up=50,
    down=50,
)

print(response)
```

### 支援的 Bedrock Stability 模型 {#supported-bedrock-stability-models}

所有 Stability AI 影像編輯模型都可透過帶有 `bedrock/` 前綴的 Bedrock 使用：

| 直接 API 模型 | Bedrock 模型 | 說明 |
|------------------|---------------|-------------|
| stability/inpaint | bedrock/us.stability.stable-image-inpaint-v1:0 | Inpainting |
| stability/conservative | bedrock/stability.stable-conservative-upscale-v1:0 | 保守式放大 |
| stability/creative | bedrock/stability.stable-creative-upscale-v1:0 | 創意式放大 |
| stability/fast | bedrock/stability.stable-fast-upscale-v1:0 | 快速放大 |
| stability/outpaint | bedrock/stability.stable-outpaint-v1:0 | Outpainting |
| stability/remove-background | bedrock/stability.stable-image-remove-background-v1:0 | 移除背景 |
| stability/search-and-replace | bedrock/stability.stable-image-search-replace-v1:0 | 搜尋並取代 |
| stability/search-and-recolor | bedrock/stability.stable-image-search-recolor-v1:0 | 搜尋並重新著色 |
| stability/sketch | bedrock/stability.stable-image-control-sketch-v1:0 | 以草圖控制 |
| stability/structure | bedrock/stability.stable-image-control-structure-v1:0 | 以結構控制 |
| stability/erase | bedrock/stability.stable-image-erase-object-v1:0 | 擦除物件 |

**注意：** Bedrock 模型 ID 可能會使用 `us.stability.*` 或 `stability.*` 前綴，視區域與模型而定。

## 比較路由 {#comparing-routes}

LiteLLM 透過兩種路由支援 Stability AI 模型：

| 路由 | 提供者 | 使用情境 | 影像生成 | 影像編輯 |
|-------|----------|----------|------------------|---------------|
| `stability/` | Stability AI Direct API | 直接存取，所有最新模型 | ✅ | ✅ |
| `bedrock/stability.*` | AWS Bedrock | AWS 整合，企業功能 | ✅ | ✅ |

若要直接使用 API 存取，請使用 `stability/`。如果您已經在使用 AWS Bedrock，請使用 `bedrock/stability.*`。
