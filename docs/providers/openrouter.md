# OpenRouter {#openrouter}
LiteLLM 支援來自 [OpenRouter](https://openrouter.ai/docs) 的所有文字／聊天／視覺／嵌入模型

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_OpenRouter.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

## 用法 {#usage}
```python
import os
from litellm import completion

os.environ["OPENROUTER_API_KEY"] = ""
os.environ["OPENROUTER_API_BASE"] = "" # [OPTIONAL] defaults to https://openrouter.ai/api/v1
os.environ["OR_SITE_URL"] = "" # [OPTIONAL]
os.environ["OR_APP_NAME"] = "" # [OPTIONAL]

response = completion(
            model="openrouter/google/palm-2-chat-bison",
            messages=messages,
        )
```

## 使用環境變數進行設定 {#configuration-with-environment-variables}

對於正式環境，您可以使用環境變數動態設定 base_url：

```python
import os
from litellm import completion

# Configure with environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")

# Set environment for LiteLLM
os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY
os.environ["OPENROUTER_API_BASE"] = OPENROUTER_BASE_URL

response = completion(
    model="openrouter/google/palm-2-chat-bison",
    messages=messages,
    base_url=OPENROUTER_BASE_URL  # Explicitly pass base_url for clarity
)
```

這種做法在管理不同環境（dev、staging、production）之間的設定時提供更高的彈性，也讓在自架與雲端端點之間切換更容易。

## OpenRouter 補全文本模型 {#openrouter-completion-models}
🚨 LiteLLM 支援所有 OpenRouter 模型，傳送 `model=openrouter/<your-openrouter-model>` 即可將其送至 open router。請在 [這裡](https://openrouter.ai/models) 查看所有 openrouter 模型

| 模型名稱                | 函式呼叫                                       |
|---------------------------|-----------------------------------------------------|
| openrouter/openai/gpt-3.5-turbo | `completion('openrouter/openai/gpt-3.5-turbo', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/openai/gpt-3.5-turbo-16k | `completion('openrouter/openai/gpt-3.5-turbo-16k', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/openai/gpt-4    | `completion('openrouter/openai/gpt-4', messages)`       | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/openai/gpt-4-32k | `completion('openrouter/openai/gpt-4-32k', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/anthropic/claude-2 | `completion('openrouter/anthropic/claude-2', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/anthropic/claude-instant-v1 | `completion('openrouter/anthropic/claude-instant-v1', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/google/palm-2-chat-bison | `completion('openrouter/google/palm-2-chat-bison', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/google/palm-2-codechat-bison | `completion('openrouter/google/palm-2-codechat-bison', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/meta-llama/llama-2-13b-chat | `completion('openrouter/meta-llama/llama-2-13b-chat', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |
| openrouter/meta-llama/llama-2-70b-chat | `completion('openrouter/meta-llama/llama-2-70b-chat', messages)` | `os.environ['OR_SITE_URL']`,`os.environ['OR_APP_NAME']`,`os.environ['OPENROUTER_API_KEY']` |

## 傳遞 OpenRouter 參數 - transforms, models, route {#passing-openrouter-params---transforms-models-route}
將 `transforms`、`models`、`route` 作為引數傳遞給 `litellm.completion()`

```python
import os
from litellm import completion

os.environ["OPENROUTER_API_KEY"] = ""

response = completion(
            model="openrouter/google/palm-2-chat-bison",
            messages=messages,
            transforms = [""],
            route= ""
        )
```

## 嵌入 {#embedding}

```python
from litellm import embedding
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

response = embedding(
    model="openrouter/openai/text-embedding-3-small",
    input=["good morning from litellm", "this is another item"],
)
print(response)
```

## 圖片生成 {#image-generation}

OpenRouter 透過 Google Gemini 圖片生成模型等特定模型支援圖片生成。LiteLLM 會將標準圖片生成請求轉換為 OpenRouter 的聊天補全格式。

### 支援的參數 {#supported-parameters}

- `size`：對應至 OpenRouter 的 `aspect_ratio` 格式
  - `1024x1024` → `1:1`（正方形）
  - `1536x1024` → `3:2`（橫向）
  - `1024x1536` → `2:3`（直向）
  - `1792x1024` → `16:9`（寬幅橫向）
  - `1024x1792` → `9:16`（高幅直向）

- `quality`：對應至 OpenRouter 的 `image_size` 格式（Gemini 模型）
  - `low` 或 `standard` → `1K`
  - `medium` → `2K`
  - `high` 或 `hd` → `4K`

- `n`：要生成的圖片數量

### 用法 {#usage-1}

```python
from litellm import image_generation
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

# Basic image generation
response = image_generation(
    model="openrouter/google/gemini-2.5-flash-image",
    prompt="A beautiful sunset over a calm ocean",
)
print(response)
```

### 進階用法與參數 {#advanced-usage-with-parameters}

```python
from litellm import image_generation
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

# Generate high-quality landscape image
response = image_generation(
    model="openrouter/google/gemini-2.5-flash-image",
    prompt="A serene mountain landscape with a lake",
    size="1536x1024",  # Landscape format
    quality="high",     # High quality (4K)
)

# Access the generated image
image_data = response.data[0]
if image_data.b64_json:
    # Base64 encoded image
    print(f"Generated base64 image: {image_data.b64_json[:50]}...")
elif image_data.url:
    # Image URL
    print(f"Generated image URL: {image_data.url}")
```

### 使用 OpenRouter 特定參數 {#using-openrouter-specific-parameters}

您也可以直接使用 `image_config` 傳遞 OpenRouter 特定參數：

```python
from litellm import image_generation
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

response = image_generation(
    model="openrouter/google/gemini-2.5-flash-image",
    prompt="A futuristic cityscape at night",
    image_config={
        "aspect_ratio": "16:9",  # OpenRouter native format
        "image_size": "4K"       # OpenRouter native format
    }
)
print(response)
```

### 回應格式 {#response-format}

回應遵循標準的 LiteLLM ImageResponse 格式：

```python
{
    "created": 1703658209,
    "data": [{
        "b64_json": "iVBORw0KGgoAAAANSUhEUgAA...",  # Base64 encoded image
        "url": None,
        "revised_prompt": None
    }],
    "usage": {
        "input_tokens": 10,
        "output_tokens": 1290,
        "total_tokens": 1300
    }
}
```

### 成本追蹤 {#cost-tracking}

OpenRouter 會在回應中提供成本資訊，LiteLLM 會自動追蹤：

```python
response = image_generation(
    model="openrouter/google/gemini-2.5-flash-image",
    prompt="A cute baby sea otter",
)

# Cost is available in the response metadata
print(f"Request cost: ${response._hidden_params['additional_headers']['llm_provider-x-litellm-response-cost']}")
```

## 圖片編輯 {#image-edit}

OpenRouter 透過 Google Gemini 圖片模型等特定模型支援圖片編輯。LiteLLM 會將圖片編輯請求路由到 OpenRouter 的 chat completions 端點，來源圖片會以 base64 資料 URL 傳送，並附帶 `modalities: ["image", "text"]`。

### 支援的模型 {#supported-models}

| 模型 | 說明 |
|-------|-------------|
| `openrouter/google/gemini-2.5-flash-image` | 具備圖片編輯功能的 Gemini 2.5 Flash |

請參閱 [OpenRouter 的模型清單](https://openrouter.ai/models?modality=image) 以查看所有可用的圖片模型。

### 支援的參數 {#supported-parameters-1}

| 參數 | OpenRouter 對應 | 備註 |
|-----------|--------------------|-------|
| `size` | `image_config.aspect_ratio` | `1024x1024` → `1:1`、`1536x1024` → `3:2`、`1024x1536` → `2:3`、`1792x1024` → `16:9`、`1024x1792` → `9:16` |
| `quality` | `image_config.image_size` | `low`/`standard` → `1K`、`medium` → `2K`、`high`/`hd` → `4K` |
| `n` | `n` | 圖片數量 |

:::note
`quality=high`（4K）僅支援 `google/gemini-3-pro-image-preview` 和 `google/gemini-3.1-flash-image-preview`。`google/gemini-2.5-flash-image` 模型最高支援 `medium`（2K）。
:::

### 用法 {#usage-2}

```python
from litellm import image_edit
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

# Basic image edit
response = image_edit(
    model="openrouter/google/gemini-2.5-flash-image",
    image=open("original_image.png", "rb"),
    prompt="Make the sky a vibrant purple sunset",
)

print(response)
```

### 進階用法與參數 {#advanced-usage-with-parameters-1}

```python
from litellm import image_edit
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

# Edit with size and quality parameters
response = image_edit(
    model="openrouter/google/gemini-2.5-flash-image",
    image=open("photo.png", "rb"),
    prompt="Add northern lights to the sky",
    size="1536x1024",   # Maps to aspect_ratio 3:2
    quality="high",      # Maps to image_size 4K
)

# Access the edited image
image_data = response.data[0]
if image_data.b64_json:
    import base64
    with open("edited.png", "wb") as f:
        f.write(base64.b64decode(image_data.b64_json))
```

### 多張圖片編輯 {#multiple-images-edit}

```python
from litellm import image_edit
import os

os.environ["OPENROUTER_API_KEY"] = "your-api-key"

response = image_edit(
    model="openrouter/google/gemini-2.5-flash-image",
    image=[
        open("scene.png", "rb"),
        open("style_reference.png", "rb"),
    ],
    prompt="Blend the reference style into the scene",
)

print(response)
```
