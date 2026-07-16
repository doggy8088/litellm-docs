import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Black Forest Labs 圖像編輯 {#black-forest-labs-image-editing}

Black Forest Labs 使用其 FLUX 模型提供強大的圖像編輯功能，可根據文字描述修改既有圖片。

## 概觀 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Black Forest Labs Image Editing 使用 FLUX Kontext 與其他模型，根據文字提示修改、修補與擴展圖像。 |
| LiteLLM 上的提供者路由 | `black_forest_labs/` |
| 提供者文件 | [Black Forest Labs API ↗](https://docs.bfl.ai/) |
| 支援的操作 | [`/images/edits`](#image-editing) |

## 設定 {#setup}

### API 金鑰 {#api-key}

```python showLineNumbers
import os

# Set your Black Forest Labs API key
os.environ["BFL_API_KEY"] = "your-api-key-here"
```

請從 [Black Forest Labs](https://blackforestlabs.ai/) 取得您的 API 金鑰。

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 使用情境 |
|------------|-------------|----------|
| `black_forest_labs/flux-kontext-pro` | FLUX Kontext Pro - 透過提示進行一般圖像編輯 | 一般編輯、風格轉換 |
| `black_forest_labs/flux-kontext-max` | FLUX Kontext Max - 高品質編輯 | 高品質修改 |
| `black_forest_labs/flux-pro-1.0-fill` | FLUX Pro Fill - 使用遮罩進行修補 | 移除／替換物件 |
| `black_forest_labs/flux-pro-1.0-expand` | FLUX Pro Expand - 外延繪製 | 擴展圖像邊界 |

## 圖像編輯 {#image-editing}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic-edit" label="基本用法">

```python showLineNumbers title="Basic Image Editing"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Edit an image with a prompt
response = litellm.image_edit(
    model="black_forest_labs/flux-kontext-pro",
    image=open("path/to/your/image.png", "rb"),
    prompt="Add a green leaf to the scene",
)

# BFL returns URLs
print(response.data[0].url)
```

</TabItem>

<TabItem value="async-edit" label="非同步用法">

```python showLineNumbers title="Async Image Editing"
import os
import asyncio
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

async def edit_image():
    response = await litellm.aimage_edit(
        model="black_forest_labs/flux-kontext-pro",
        image=open("path/to/your/image.png", "rb"),
        prompt="Make this image look like a watercolor painting",
    )
    print(response.data[0].url)

# Run the async function
asyncio.run(edit_image())
```

</TabItem>

<TabItem value="inpainting" label="修補（填補）">

```python showLineNumbers title="Inpainting with Mask"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Use flux-pro-1.0-fill for inpainting
response = litellm.image_edit(
    model="black_forest_labs/flux-pro-1.0-fill",
    image=open("path/to/your/image.png", "rb"),
    mask=open("path/to/mask.png", "rb"),  # White areas will be edited
    prompt="Replace with a beautiful garden",
    steps=50,  # BFL-specific parameter
    guidance=30,  # BFL-specific parameter
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="outpainting" label="外延繪製（擴展）">

```python showLineNumbers title="Outpainting - Expand Image Borders"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Use flux-pro-1.0-expand to extend image borders
response = litellm.image_edit(
    model="black_forest_labs/flux-pro-1.0-expand",
    image=open("path/to/your/image.png", "rb"),
    prompt="Continue the scene with a mountain landscape",
    top=256,     # Expand 256 pixels at top
    bottom=256,  # Expand 256 pixels at bottom
    left=128,    # Expand 128 pixels at left
    right=128,   # Expand 128 pixels at right
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="advanced" label="進階參數">

```python showLineNumbers title="Advanced Image Editing with BFL Parameters"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Edit image with BFL-specific parameters
response = litellm.image_edit(
    model="black_forest_labs/flux-kontext-pro",
    image=open("path/to/your/image.png", "rb"),
    prompt="Transform into cyberpunk style with neon lights",
    seed=42,                    # For reproducible results
    output_format="png",        # png or jpeg
    safety_tolerance=2,         # 0-6, higher = more permissive
    aspect_ratio="16:9",        # Output aspect ratio
)

print(response.data[0].url)
```

</TabItem>
</Tabs>

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Black Forest Labs Image Editing Configuration"
model_list:
  - model_name: bfl-kontext-pro
    litellm_params:
      model: black_forest_labs/flux-kontext-pro
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_edit

  - model_name: bfl-kontext-max
    litellm_params:
      model: black_forest_labs/flux-kontext-max
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_edit

  - model_name: bfl-fill
    litellm_params:
      model: black_forest_labs/flux-pro-1.0-fill
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_edit

  - model_name: bfl-expand
    litellm_params:
      model: black_forest_labs/flux-pro-1.0-expand
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_edit

general_settings:
  master_key: sk-1234
```

#### 2. 啟動 LiteLLM Proxy Server {#2-start-litellm-proxy-server}

```bash showLineNumbers title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 發出圖像編輯請求 {#3-make-image-editing-requests}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Black Forest Labs via Proxy - OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

# Edit image with FLUX Kontext Pro
response = client.images.edit(
    model="bfl-kontext-pro",
    image=open("path/to/your/image.png", "rb"),
    prompt="Add magical sparkles and fairy dust",
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Black Forest Labs via Proxy - cURL"
curl --location 'http://localhost:4000/v1/images/edits' \
--header 'Authorization: Bearer sk-1234' \
--form 'model="bfl-kontext-pro"' \
--form 'prompt="Add a sunset in the background"' \
--form 'image=@"path/to/your/image.png"'
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

### OpenAI 相容參數 {#openai-compatible-parameters}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `image` | 檔案 | 要編輯的圖像檔案 | 必填 |
| `prompt` | string | 所需變更的文字描述 | 必填 |
| `model` | string | 要使用的 FLUX 模型 | 必填 |
| `mask` | 檔案 | 用於修補的遮罩圖像（flux-pro-1.0-fill） | 選用 |
| `n` | integer | 圖像數量（BFL 每次請求回傳 1 張） | `1` |
| `size` | string | 對應至 aspect_ratio | 選用 |
| `response_format` | string | `url` 或 `b64_json` | `url` |

### Black Forest Labs 特定參數 {#black-forest-labs-specific-parameters}

| 參數 | 類型 | 說明 | 預設值 | 模型 |
|-----------|------|-------------|---------|--------|
| `seed` | integer | 用於可重現結果的種子 | 隨機 | 全部 |
| `output_format` | string | 輸出格式：`png` 或 `jpeg` | `png` | 全部 |
| `safety_tolerance` | integer | 安全過濾器容忍度（0-6） | 2 | 全部 |
| `aspect_ratio` | string | 輸出長寬比（例如：`16:9`、`1:1`） | 原始 | Kontext models |
| `steps` | integer | 推理步數 | 模型預設值 | Fill |
| `guidance` | float | 引導比例 | 模型預設值 | Fill |
| `grow_mask` | integer | 遮罩擴張像素數 | 0 | Fill |
| `top` | integer | 頂部擴展像素數 | 0 | 展開 |
| `bottom` | integer | 底部擴展像素數 | 0 | 展開 |
| `left` | integer | 左側擴展像素數 | 0 | 展開 |
| `right` | integer | 右側擴展像素數 | 0 | 展開 |

## 運作方式 {#how-it-works}

Black Forest Labs 使用以輪詢為基礎的 API：

1. **提交請求**：LiteLLM 將您的圖像與提示送出至 BFL
2. **取得任務 ID**：BFL 會回傳任務 ID 與輪詢 URL
3. **輪詢結果**：LiteLLM 會自動輪詢，直到圖像準備完成
4. **回傳結果**：回傳產生的圖像 URL

這個輪詢流程由 LiteLLM 自動處理 - 您只需呼叫 `image_edit()` 並取得結果。

## 快速開始 {#getting-started}

1. 在 [Black Forest Labs](https://blackforestlabs.ai/) 建立帳號
2. 從儀表板取得您的 API 金鑰
3. 設定您的 `BFL_API_KEY` 環境變數
4. 搭配任何支援的模型使用 `litellm.image_edit()`

## 其他資源 {#additional-resources}

- [Black Forest Labs 文件](https://docs.bfl.ai/)
- [FLUX 模型資訊](https://blackforestlabs.ai/)
