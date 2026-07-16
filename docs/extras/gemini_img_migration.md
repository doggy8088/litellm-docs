# Gemini 圖片生成遷移指南 {#gemini-image-generation-migration-guide}

## 此變更會影響誰？ {#who-is-impacted-by-this-change}

使用以下模型與 /chat/completions 的任何人：
- `gemini/gemini-2.0-flash-exp-image-generation`
- `vertex_ai/gemini-2.0-flash-exp-image-generation`

## 重要變更 {#key-change}

:::info
從 v1.77.0 起，LiteLLM 會在 `response.choices[0].message.images` 中回傳圖片清單，而不是在 `response.choices[0].message.image` 中回傳單一圖片。
:::

Gemini 模型現在支援透過 chat completions 進行圖片生成。圖片會以含有 base64 資料 URL 的 `response.choices[0].message.images` 回傳。

## 變更前後 {#before-and-after}

### 變更前 {#before}
```python
from litellm import completion

response = completion(
    model="gemini/gemini-2.0-flash-exp-image-generation",
    messages=[{"role": "user", "content": "Generate an image of a cat"}],
    modalities=["image", "text"],
)


base_64_image_data = response.choices[0].message.content
```

### 變更後   {#after}
```python
from litellm import completion

response = completion(
    model="gemini/gemini-2.0-flash-exp-image-generation",
    messages=[{"role": "user", "content": "Generate an image of a cat"}],
    modalities=["image", "text"],
)

# Image is now available in the response
image_url = response.choices[0].message.images[0]["image_url"]["url"]  # "data:image/png;base64,..."
```

### 為什麼會有這個變更？ {#why-the-change}

因為較新的 `gemini-2.5-flash-image-preview` 模型會在同一個回應中同時傳送文字與圖片回應。此介面可讓開發者明確存取回應中的圖片或文字元件。以前，開發者必須在訊息內容中搜尋模型生成的圖片。

**為什麼從 `image` 變更為 `images`？**
這是為了與 OpenRouter API 保持一致，確保在可行時使用簡單且廣為人知的介面。

## 使用方式 {#usage}

### 使用 Python SDK {#using-the-python-sdk}

**重要變更：**
```diff
# Before
-- base_64_image_data = response.choices[0].message.content

# After
++ image_url = response.choices[0].message.images[0]["image_url"]["url"]
```

#### 基本圖片生成 {#basic-image-generation}

```python
from litellm import completion
import os

# Set your API key
os.environ["GEMINI_API_KEY"] = "your-api-key"

# Generate an image
response = completion(
    model="gemini/gemini-2.0-flash-exp-image-generation",
    messages=[{"role": "user", "content": "Generate an image of a cat"}],
    modalities=["image", "text"],
)

# Access the generated image
print(response.choices[0].message.content)  # Text response (if any)
print(response.choices[0].message.images[0])    # Image data
```

#### 回應格式 {#response-format}

圖片會在 `message.images` 欄位中回傳：

```python
{
    "image_url": {
        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "detail": "auto"
    },
    "index": 0,
    "type": "image_url"
}
```

### 使用 LiteLLM Proxy Server {#using-the-litellm-proxy-server}

**重要變更：**
```diff
# Before
-- "content": "base64-image-data..."

# After  
++ "images": [{
++   "image_url": {
++     "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
++     "detail": "auto"
++   },
++   "index": 0,
++   "type": "image_url"
++ }]
```

#### 設定 {#configuration-setup}

1. **在 `config.yaml` 中設定您的模型：**

```yaml
model_list:
  - model_name: gemini-image-gen
    litellm_params:
      model: gemini/gemini-2.0-flash-exp-image-generation
      api_key: os.environ/GEMINI_API_KEY
  - model_name: vertex-image-gen  
    litellm_params:
      model: vertex_ai/gemini-2.5-flash-image-preview
      vertex_project: your-project-id
      vertex_location: us-central1

general_settings:
  master_key: sk-1234  # Your proxy API key
```

2. **啟動 proxy server：**

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 發送請求 {#making-requests}

**使用 OpenAI SDK：**

```python
from openai import OpenAI

# Point to your proxy server
client = OpenAI(
    api_key="sk-1234",  # Your proxy API key
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="gemini-image-gen",
    messages=[{"role": "user", "content": "Generate an image of a cat"}],
    extra_body={"modalities": ["image", "text"]}
)

# Access the generated image
print(response.choices[0].message.content)  # Text response (if any)
print(response.choices[0].message.image)    # Image data
```

**使用 curl：**

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "model": "gemini-image-gen",
  "messages": [
    {
      "role": "user",
      "content": "Generate an image of a cat"
    }
  ],
  "modalities": ["image", "text"]
}'
```

**來自 proxy 的回應格式：**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1704089632,
  "model": "gemini-image-gen",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's an image of a cat for you!",
        "images": [{
          "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
          "detail": "auto"
        }
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```
