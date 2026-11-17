---
title: "在 Python 中透過 LiteLLM 使用 OpenRouter API"
sidebar_label: "OpenRouter"
description: "呼叫任何 OpenRouter 模型、傳入 transforms 與 route、嵌入文字、以 Gemini 圖片模型建立或編輯圖片，並透過 proxy 存取 Jev 決策模型。"
---

# OpenRouter {#openrouter}
LiteLLM 支援來自 [OpenRouter](https://openrouter.ai/docs) 的所有文字／聊天／視覺／嵌入模型

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/89a6b5fbb26b632ef0faf633b0d3cf317d73deaa/cookbook/LiteLLM_OpenRouter.ipynb">
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
LiteLLM 支援所有 OpenRouter 模型，傳送 `model=openrouter/<your-openrouter-model>` 即可將其送至 open router。請在 [這裡](https://openrouter.ai/models) 查看所有 openrouter 模型

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

## 決策（Jev） {#decisions-jev}

OpenRouter 在其 Decisions API（`POST https://openrouter.ai/api/alpha/decisions`）上提供 TypeSafe 的 Jev 決策模型，並在 `/chat/completions` 上拒絕這些模型。LiteLLM proxy 可透過兩種方式存取該 API。

### 透過 `/v1/systemone` 與 `/v1/decisions` {#through-v1systemone-and-v1decisions}

將模型以 `openrouter/` 前綴加入您的 `model_list`。該模型便會像其他部署一樣經過 router，因此具備負載平衡、備援與各部署專屬的金鑰，您也可以在 [`/v1/systemone`](../decisions.md#v1systemone) 上以 System One 格式呼叫它，或在 [`/v1/decisions`](../decisions.md#v1decisions) 上以 OpenAI Decisions 格式呼叫。

```yaml showLineNumbers
model_list:
  - model_name: jev
    litellm_params:
      model: openrouter/typesafe/jev-1.14
      api_key: os.environ/OPENROUTER_API_KEY
```

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "jev",
  "state": "The sky is blue on a clear day.",
  "questions": {"blue": {"type": "noul", "instructions": "Is the sky described as blue?"}}
}'
```

自 v1.104.3 起，花費為 OpenRouter 回傳的 `usage.cost`。LiteLLM 會將其放在 `x-litellm-response-cost` 標頭中回傳，並寫入花費記錄。較早的版本沒有 `jev-1.14` 的定價，`v1.105.0-rc.3` 與 `v1.106.0` dev 版本也不讀取 `usage.cost`。格式與支援的功能請參閱[決策](../decisions.md)。

### 透過 `/openrouter` pass-through {#through-the-openrouter-pass-through}

`/openrouter/{path}` 會將請求本文按原樣送往 OpenRouter。它送出的金鑰來自 `model_list` 中第一個設定了 `use_in_pass_through: true` 且持有金鑰的 OpenRouter 部署（`openrouter/` 模型或 `custom_llm_provider: openrouter`），金鑰可為其 `api_key` 或其 `litellm_credential_name` 所指的金鑰；若沒有任何部署符合，則來自 `OPENROUTER_API_KEY`。請求一律送往 `OPENROUTER_API_BASE`，不會送往該部署的 `api_base`。當您已有 OpenRouter Decisions 請求本文且不需要路由時，請使用此方式。此功能存在於 v1.104.0 及之後版本，以及 v1.101.1、v1.102.1 與這兩條線的後續修補版本，但不存在於任何 v1.103 版本。

路徑是相對於 `https://openrouter.ai/api`，即去掉尾端 `/v1` 的 `OPENROUTER_API_BASE`。因此 Decisions API 為 `/openrouter/alpha/decisions`。請勿在路徑中加入 `/api`，因為 `/openrouter/api/alpha/decisions` 會被送往 `https://openrouter.ai/api/api/alpha/decisions`，OpenRouter 會以 404 回應。

帶有 `models` 清單的虛擬金鑰，必須將 `typesafe/jev-1.14`（請求本文中的模型名稱）列入該清單，才能呼叫 pass-through。僅有 `model_list` 別名（例如 `jev`）並不足夠，呼叫會得到 403。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/openrouter/alpha/decisions' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "typesafe/jev-1.14",
  "state": "The sky is blue on a clear day.",
  "questions": {"blue": {"type": "noul", "instructions": "Is the sky described as blue?"}}
}'
```

回應

```json
{
  "model": "typesafe/jev-1.14-20261014",
  "answers": {"blue": {"type": "noul", "noul": 0.99}},
  "usage": {"input_tokens": 282, "output_tokens": 20, "cost": 0.000011844},
  "id": "gen-dec-1792543634-CgEHGExRXfbzgBwKxiWf",
  "provider": "TypeSafe"
}
```

LiteLLM 會以 OpenRouter 回傳的版本化模型名稱記錄每次 `/alpha/decisions` 呼叫，例如 `openrouter/typesafe/jev-1.14-20261014`。自 v1.104.3 起，花費為回應中的 `usage.cost`，較早的版本沒有 `jev-1.14` 的定價。`v1.105.0` 的 dev 版本與 release candidate 以及 `v1.106.0` 的 dev 版本也不讀取 `usage.cost`。對其他 `/openrouter` 路徑（例如 `/openrouter/v1/chat/completions`）的呼叫會被轉送，但記錄的花費為 $0，因此預算不會將其計入。
