import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Black Forest Labs 圖像生成 {#black-forest-labs-image-generation}

Black Forest Labs 使用其 FLUX 模型提供最先進的文字轉圖像生成。

## 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | 用於高品質文字轉圖像生成的 Black Forest Labs FLUX 模型 |
| LiteLLM 上的提供者路由 | `black_forest_labs/` |
| 提供者文件 | [Black Forest Labs API ↗](https://docs.bfl.ai/) |
| 支援的操作 | [`/images/generations`](#image-generation) |

## 設定 {#setup}

### API 金鑰 {#api-key}

```python showLineNumbers
import os

# Set your Black Forest Labs API key
os.environ["BFL_API_KEY"] = "your-api-key-here"
```

請從 [Black Forest Labs](https://blackforestlabs.ai/) 取得您的 API 金鑰。

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 價格 |
|------------|-------------|-------|
| `black_forest_labs/flux-pro-1.1` | 快速且可靠的標準生成 | $0.04/張圖片 |
| `black_forest_labs/flux-pro-1.1-ultra` | 超高解析度（最高 4MP） | $0.06/張圖片 |
| `black_forest_labs/flux-dev` | 開發／開源變體 | $0.025/張圖片 |
| `black_forest_labs/flux-pro` | 原始 pro 模型 | $0.05/張圖片 |

## 圖像生成 {#image-generation}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

```python showLineNumbers title="Basic Image Generation"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Generate an image
response = litellm.image_generation(
    model="black_forest_labs/flux-pro-1.1",
    prompt="A beautiful sunset over the ocean with sailing boats",
)

# BFL returns URLs
print(response.data[0].url)
```

</TabItem>

<TabItem value="async" label="非同步用法">

```python showLineNumbers title="Async Image Generation"
import os
import asyncio
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

async def generate_image():
    response = await litellm.aimage_generation(
        model="black_forest_labs/flux-pro-1.1",
        prompt="A futuristic city skyline at night",
    )
    print(response.data[0].url)

# Run the async function
asyncio.run(generate_image())
```

</TabItem>

<TabItem value="size" label="自訂尺寸">

```python showLineNumbers title="Image Generation with Custom Size"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Generate with specific dimensions
response = litellm.image_generation(
    model="black_forest_labs/flux-pro-1.1",
    prompt="A majestic mountain landscape",
    size="1792x1024",  # Maps to width/height
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="ultra" label="超高解析度">

```python showLineNumbers title="Ultra High Resolution with flux-pro-1.1-ultra"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Generate ultra high-resolution image
response = litellm.image_generation(
    model="black_forest_labs/flux-pro-1.1-ultra",
    prompt="Detailed portrait of a fantasy character",
    size="2048x2048",    # Up to 4MP supported
    quality="hd",        # Maps to raw=True for natural look
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="advanced" label="進階參數">

```python showLineNumbers title="Advanced Image Generation with BFL Parameters"
import os
import litellm

# Set your API key
os.environ["BFL_API_KEY"] = "your-api-key-here"

# Generate with BFL-specific parameters
response = litellm.image_generation(
    model="black_forest_labs/flux-pro-1.1",
    prompt="A cute orange cat sitting on a windowsill",
    seed=42,                    # For reproducible results
    output_format="png",        # png or jpeg
    safety_tolerance=2,         # 0-6, higher = more permissive
    prompt_upsampling=True,     # Enhance prompt for better results
)

print(response.data[0].url)
```

</TabItem>
</Tabs>

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定您的 config.yaml {#1-configure-your-configyaml}

```yaml showLineNumbers title="Black Forest Labs Image Generation Configuration"
model_list:
  - model_name: flux-pro
    litellm_params:
      model: black_forest_labs/flux-pro-1.1
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_generation

  - model_name: flux-ultra
    litellm_params:
      model: black_forest_labs/flux-pro-1.1-ultra
      api_key: os.environ/BFL_API_KEY
    model_info:
      mode: image_generation

  - model_name: flux-dev
    litellm_params:
      model: black_forest_labs/flux-dev
      api_key: os.environ/BFL_API_KEY
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

#### 3. 發出圖像生成請求 {#3-make-image-generation-requests}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Black Forest Labs via Proxy - OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

# Generate image with FLUX Pro
response = client.images.generate(
    model="flux-pro",
    prompt="A beautiful garden with colorful flowers",
    size="1024x1024",
)

print(response.data[0].url)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Black Forest Labs via Proxy - cURL"
curl -X POST 'http://localhost:4000/v1/images/generations' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{
    "model": "flux-pro",
    "prompt": "A beautiful garden with colorful flowers",
    "size": "1024x1024"
  }'
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-parameters}

### OpenAI 相容參數 {#openai-compatible-parameters}

| 參數 | 類型 | 說明 | 對應 |
|-----------|------|-------------|---------|
| `prompt` | string | 要生成的圖像文字描述 | 直接對應 |
| `model` | string | 要使用的 FLUX 模型 | 直接對應 |
| `size` | string | 圖像尺寸（例如，`1024x1024`） | 對應到 `width` 和 `height` |
| `n` | integer | 圖像數量（僅 ultra 模型，最多 4 張） | 對應到 `num_images` |
| `quality` | string | 用於營造自然外觀的 `hd` | ultra 時對應到 `raw=True` |
| `response_format` | string | `url` 或 `b64_json` | 直接對應 |

### Black Forest Labs 特定參數 {#black-forest-labs-specific-parameters}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `width` | integer | 圖像寬度（256-1920，16 的倍數） | 1024 |
| `height` | integer | 圖像高度（256-1920，16 的倍數） | 1024 |
| `aspect_ratio` | string | 寬度／高度的替代選項（例如，`16:9`、`1:1`） | - |
| `seed` | integer | 用於重現結果的種子 | 隨機 |
| `output_format` | string | 輸出格式：`png` 或 `jpeg` | `png` |
| `safety_tolerance` | integer | 安全過濾器容忍度（0-6，越高 = 越寬鬆） | 2 |
| `prompt_upsampling` | boolean | 增強提示詞以獲得更好結果 | `false` |

### Ultra 模型特定參數 {#ultra-model-specific-parameters}

| 參數 | 類型 | 說明 | 預設值 |
|-----------|------|-------------|---------|
| `raw` | boolean | 更原始的模式，呈現更自然、較少人工感的外觀 | `false` |
| `num_images` | integer | 要生成的圖像數量（1-4） | 1 |

## 運作方式 {#how-it-works}

Black Forest Labs 使用輪詢式 API：

1. **提交請求**：LiteLLM 將您的提示詞傳送到 BFL
2. **取得任務 ID**：BFL 回傳任務 ID 和輪詢 URL
3. **輪詢結果**：LiteLLM 自動輪詢直到圖像就緒
4. **回傳結果**：回傳生成的圖像 URL

此輪詢由 LiteLLM 自動處理——您只需呼叫 `image_generation()` 並取得結果。

## 開始使用 {#getting-started}

1. 在 [Black Forest Labs](https://blackforestlabs.ai/) 建立帳號
2. 從儀表板取得您的 API 金鑰
3. 設定您的 `BFL_API_KEY` 環境變數
4. 搭配任何支援的模型使用 `litellm.image_generation()`

## 其他資源 {#additional-resources}

- [Black Forest Labs 文件](https://docs.bfl.ai/)
- [Black Forest Labs 圖像編輯](./black_forest_labs_img_edit.md) - 用於編輯現有圖像
- [FLUX 模型資訊](https://blackforestlabs.ai/)
