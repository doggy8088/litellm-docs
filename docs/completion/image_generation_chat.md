import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 聊天完成、Responses API 中的圖片生成 {#image-generation-in-chat-completions-responses-api}

本指南說明如何在使用 `chat/completions` 時生成圖片。注意－如果您希望在 Responses API 上使用此功能，請在此處提出功能請求 [這裡](https://github.com/BerriAI/litellm/issues/new)。

:::info

需要 LiteLLM v1.76.1+

:::

支援的提供者：
- Google AI Studio (`gemini`)
- Vertex AI (`vertex_ai/`)

對於支援在聊天完成期間進行圖片生成的模型，LiteLLM 會將 `images` 回應標準化到 assistant 訊息中。

```python title="Example response from litellm"
"message": {
    ...
    "content": "Here's the image you requested:",
    "images": [
        {
            "image_url": {
                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                "detail": "auto"
            },
            "index": 0,
            "type": "image_url"
        }
    ]
}
```

## 快速開始  {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Image generation with chat completion"
from litellm import completion
import os 

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = completion(
    model="gemini/gemini-2.5-flash-image-preview",
    messages=[
        {"role": "user", "content": "Generate an image of a banana wearing a costume that says LiteLLM"}
    ],
)

print(response.choices[0].message.content)  # Text response
print(response.choices[0].message.images)   # List of image objects
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-image-gen
    litellm_params:
      model: gemini/gemini-2.5-flash-image-preview
      api_key: os.environ/GEMINI_API_KEY
```

2. 執行 proxy 伺服器

```bash showLineNumbers title="Start the proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！

```bash showLineNumbers title="Make request"
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gemini-image-gen",
    "messages": [
      {
        "role": "user",
        "content": "Generate an image of a banana wearing a costume that says LiteLLM"
      }
    ]
  }'
```

</TabItem>
</Tabs>

**預期回應**

```bash
{
    "id": "chatcmpl-3b66124d79a708e10c603496b363574c",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "Here's the image you requested:",
                "role": "assistant",
                "images": [
                    {
                        "image_url": {
                            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
                            "detail": "auto"
                        },
                        "index": 0,
                        "type": "image_url"
                    }
                ]
            }
        }
    ],
    "created": 1723323084,
    "model": "gemini/gemini-2.5-flash-image-preview",
    "object": "chat.completion",
    "usage": {
        "completion_tokens": 12,
        "prompt_tokens": 16,
        "total_tokens": 28
    }
}
```

## 串流支援 {#streaming-support}

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Streaming image generation"
from litellm import completion
import os 

os.environ["GEMINI_API_KEY"] = "your-api-key"

response = completion(
    model="gemini/gemini-2.5-flash-image-preview",
    messages=[
        {"role": "user", "content": "Generate an image of a banana wearing a costume that says LiteLLM"}
    ],
    stream=True,
)

for chunk in response:
    if hasattr(chunk.choices[0].delta, "images") and chunk.choices[0].delta.images is not None:
        print("Generated image:", chunk.choices[0].delta.images[0]["image_url"]["url"])
        break
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash showLineNumbers title="Streaming request"
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gemini-image-gen",
    "messages": [
      {
        "role": "user",
        "content": "Generate an image of a banana wearing a costume that says LiteLLM"
      }
    ],
    "stream": true
  }'
```

</TabItem>
</Tabs>

**預期串流回應**

```bash
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1723323084,"model":"gemini/gemini-2.5-flash-image-preview","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1723323084,"model":"gemini/gemini-2.5-flash-image-preview","choices":[{"index":0,"delta":{"content":"Here's the image you requested:"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1723323084,"model":"gemini/gemini-2.5-flash-image-preview","choices":[{"index":0,"delta":{"images":[{"image_url":{"url":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...","detail":"auto"},"index":0,"type":"image_url"}]},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1723323084,"model":"gemini/gemini-2.5-flash-image-preview","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## 非同步支援 {#async-support}

```python showLineNumbers title="Async image generation"
from litellm import acompletion
import asyncio
import os 

os.environ["GEMINI_API_KEY"] = "your-api-key"

async def generate_image():
    response = await acompletion(
        model="gemini/gemini-2.5-flash-image-preview",
        messages=[
            {"role": "user", "content": "Generate an image of a banana wearing a costume that says LiteLLM"}
        ],
    )
    
    print(response.choices[0].message.content)  # Text response
    print(response.choices[0].message.images)   # List of image objects

    return response

# Run the async function
asyncio.run(generate_image())
```

## 支援的模型 {#supported-models}

| 提供者 | 模型 | 
|----------|--------|
| Google AI Studio | `gemini/gemini-2.0-flash-preview-image-generation`, `gemini/gemini-2.5-flash-image-preview`, `gemini/gemini-3-pro-image-preview` |
| Vertex AI | `vertex_ai/gemini-2.0-flash-preview-image-generation`, `vertex_ai/gemini-2.5-flash-image-preview`, `vertex_ai/gemini-3-pro-image-preview` |

## 規格 {#spec}

回應中的 `images` 欄位遵循以下結構：

```python
"images": [
    {
        "image_url": {
            "url": "data:image/png;base64,<base64_encoded_image>",
            "detail": "auto"
        },
        "index": 0,
        "type": "image_url"
    }
]
```

- `images` - List[ImageURLListItem]：生成圖片的陣列
  - `image_url` - ImageURLObject：圖片資料容器
    - `url` - str：以 data URI 格式編碼的 Base64 圖片資料
    - `detail` - str：圖片詳細程度（生成的圖片一律為 "auto"）
  - `index` - int：回應中圖片的索引
  - `type` - str：類型識別碼（一律為 "image_url"）

圖片會以 Base64 編碼的 data URI 回傳，可直接用於 HTML `<img>` 標籤，或儲存為檔案。
