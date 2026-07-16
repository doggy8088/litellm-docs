# Recraft {#recraft}
https://www.recraft.ai/

## 概述 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Recraft 是一款由 AI 驅動的設計工具，可生成高品質圖像，並能精準控制風格與內容。 |
| LiteLLM 提供者路由 | `recraft/` |
| 提供者文件連結 | [Recraft ↗](https://www.recraft.ai/docs) |
| 支援的操作 | [`/images/generations`](#image-generation), [`/images/edits`](#image-edit) |

LiteLLM 支援 Recraft 圖像生成與圖像編輯呼叫。

## API 基底、金鑰 {#api-base-key}
```python
# env variable
os.environ['RECRAFT_API_KEY'] = "your-api-key"
os.environ['RECRAFT_API_BASE'] = "https://external.api.recraft.ai"  # [optional] 
```

## 圖像生成 {#image-generation}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

```python showLineNumbers
from litellm import image_generation
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

# recraft image generation call
response = image_generation(
    model="recraft/recraftv3",
    prompt="A beautiful sunset over a calm ocean",
)
print(response)
```

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

#### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: recraft-v3
    litellm_params:
      model: recraft/recraftv3
      api_key: os.environ/RECRAFT_API_KEY
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

#### 3. 測試 {#3-test-it}

```bash showLineNumbers
curl --location 'http://0.0.0.0:4000/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "recraft-v3",
    "prompt": "A beautiful sunset over a calm ocean",
}'
```

### 進階用法 - 使用額外參數 {#advanced-usage---with-additional-parameters}

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

### 支援的參數 {#supported-parameters}

Recraft 支援以下相容 OpenAI 的參數：

| 參數 | 類型 | 說明 | 範例 |
|-----------|------|-------------|---------|
| `n` | integer | 要生成的圖像數量 (1-4) | `1` |
| `response_format` | string | 回應格式 (`url` 或 `b64_json`) | `"url"` |
| `size` | string | 圖像尺寸 | `"1024x1024"` |
| `style` | string | 圖像風格／藝術指導方向 | `"realistic"` |

### 使用非 OpenAI 參數 {#using-non-openai-parameters}

如果您想傳遞 OpenAI 不支援的參數，可以將它們放入請求本文中，LiteLLM 會自動將其路由至 recraft。

在這個範例中，我們會在 recraft 圖像生成呼叫中傳遞 `style_id` 參數。

**使用 LiteLLM Python SDK**

```python showLineNumbers
from litellm import image_generation
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

response = image_generation(
    model="recraft/recraftv3",
    prompt="A beautiful sunset over a calm ocean",
    style_id="your-style-id",
)
```

**使用 LiteLLM Proxy Server + OpenAI Python SDK**

```python showLineNumbers
from openai import OpenAI
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

client = OpenAI(api_key=os.environ['RECRAFT_API_KEY'])

response = client.images.generate(
    model="recraft/recraftv3",
    prompt="A beautiful sunset over a calm ocean",
    extra_body={
        "style_id": "your-style-id",
    },
)
print(response)
```

### 支援的圖像生成模型 {#supported-image-generation-models}

**注意：LiteLLM 支援所有 recraft 模型** 只要以 `recraft/<model_name>` 傳入模型名稱，litellm 就會將其路由至 recraft。

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| recraftv3 | `image_generation(model="recraft/recraftv3", prompt="...")` |
| recraftv2 | `image_generation(model="recraft/recraftv2", prompt="...")` |

如需可用模型與功能的更多詳細資訊，請參閱：https://www.recraft.ai/docs

## 圖像編輯 {#image-edit}

### 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk-1}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

# Open the image file
with open("reference_image.png", "rb") as image_file:
    # recraft image edit call
    response = image_edit(
        model="recraft/recraftv3",
        prompt="Create a studio ghibli style image that combines all the reference images. Make sure the person looks like a CTO.",
        image=image_file,
    )
print(response)
```

### 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server-1}

#### 1. 設定 config.yaml {#1-setup-configyaml-1}

```yaml showLineNumbers
model_list:
  - model_name: recraft-v3
    litellm_params:
      model: recraft/recraftv3
      api_key: os.environ/RECRAFT_API_KEY
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

#### 3. 測試 {#3-test-it-1}

```bash showLineNumbers
curl --location 'http://0.0.0.0:4000/v1/images/edits' \
--header 'Authorization: Bearer sk-1234' \
--form 'model="recraft-v3"' \
--form 'prompt="Create a studio ghibli style image that combines all the reference images. Make sure the person looks like a CTO."' \
--form 'image=@"reference_image.png"'
```

### 進階用法 - 使用額外參數 {#advanced-usage---with-additional-parameters-1}

```python showLineNumbers
from litellm import image_edit
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

with open("reference_image.png", "rb") as image_file:
    response = image_edit(
        model="recraft/recraftv3",
        prompt="Create a studio ghibli style image",
        image=image_file,
        n=2,  # Generate 2 variations
        response_format="url",  # Return URLs instead of base64
        style="realistic_image",  # Set artistic style
        strength=0.5  # Control transformation strength (0-1)
    )
print(response)
```

### 支援的圖像編輯參數 {#supported-image-edit-parameters}

Recraft 支援以下用於圖像編輯的相容 OpenAI 參數：

| 參數 | 類型 | 說明 | 預設值 | 範例 |
|-----------|------|-------------|---------|---------|
| `n` | integer | 要生成的圖像數量 (1-4) | `1` | `2` |
| `response_format` | string | 回應格式 (`url` 或 `b64_json`) | `"url"` | `"b64_json"` |
| `style` | string | 圖像風格／藝術指導方向 | - | `"realistic_image"` |
| `strength` | float | 控制圖像轉換的程度 (0.0-1.0) | `0.2` | `0.5` |

### 使用非 OpenAI 參數 {#using-non-openai-parameters-1}

您可以在請求中加入 Recraft 專屬參數，這些參數不屬於 OpenAI API：

**使用 LiteLLM Python SDK**

```python showLineNumbers
from litellm import image_edit
import os

os.environ['RECRAFT_API_KEY'] = "your-api-key"

with open("reference_image.png", "rb") as image_file:
    response = image_edit(
        model="recraft/recraftv3",
        prompt="Create a studio ghibli style image",
        image=image_file,
        style_id="your-style-id",  # Recraft-specific parameter
        strength=0.7
    )
```

**使用 LiteLLM Proxy Server + OpenAI Python SDK**

```python showLineNumbers
from openai import OpenAI
import os

client = OpenAI(
    api_key="sk-1234",  # your LiteLLM proxy master key
    base_url="http://0.0.0.0:4000"  # your LiteLLM proxy URL
)

with open("reference_image.png", "rb") as image_file:
    response = client.images.edit(
        model="recraft-v3",
        prompt="Create a studio ghibli style image",
        image=image_file,
        extra_body={
            "style_id": "your-style-id",
            "strength": 0.7
        }
    )
print(response)
```

### 支援的圖像編輯模型 {#supported-image-edit-models}

**注意：LiteLLM 支援所有 recraft 模型** 只要以 `recraft/<model_name>` 傳入模型名稱，litellm 就會將其路由至 recraft。

| 模型名稱 | 函式呼叫 |
|------------|---------------|
| recraftv3 | `image_edit(model="recraft/recraftv3", ...)` |

## API 金鑰設定 {#api-key-setup}

請從 [Recraft 的網站](https://www.recraft.ai/) 取得您的 API 金鑰，並將其設為環境變數：

```bash
export RECRAFT_API_KEY="your-api-key"
```
