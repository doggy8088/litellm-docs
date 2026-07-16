import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI 影片生成 {#openai-video-generation}

LiteLLM 支援 OpenAI 的影片生成模型，包括 Sora。

## 快速入門 {#quick-start}

### 所需 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 基本用法 {#basic-usage}

```python
from litellm import video_generation, video_content
import os

os.environ["OPENAI_API_KEY"] = "your-api-key"

# Generate a video
response = video_generation(
    prompt="A cat playing with a ball of yarn in a sunny garden",
    model="sora-2",
    seconds="8",
    size="720x1280"
)

print(f"Video ID: {response.id}")
print(f"Status: {response.status}")

# Download video content when ready
video_bytes = video_content(
    video_id=response.id,
)

# Save to file
with open("generated_video.mp4", "wb") as f:
    f.write(video_bytes)
```

## **LiteLLM Proxy 用法** {#litellm-proxy-usage}

LiteLLM 提供與 OpenAI API 相容的影片端點，涵蓋完整的影片生成工作流程：

- `/videos/generations` - 生成新影片
- `/videos/remix` - 使用參考圖片編輯既有影片  
- `/videos/status` - 檢查影片生成狀態
- `/videos/retrieval` - 下載完成的影片

**設定**

將以下內容加入您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: sora-2
    litellm_params:
      model: openai/sora-2
      api_key: os.environ/OPENAI_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

測試影片生成請求

```bash
curl --location 'http://localhost:4000/v1/videos' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--data '{
    "model": "sora-2",
    "prompt": "A beautiful sunset over the ocean"
}'
```

測試影片狀態請求

```bash
# Using custom-llm-provider header
curl --location 'http://localhost:4000/v1/videos/video_id' \
--header 'Accept: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--header 'custom-llm-provider: openai'
```

測試影片擷取請求

```bash
# Using custom-llm-provider header
curl --location 'http://localhost:4000/v1/videos/video_id/content' \
--header 'Accept: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--header 'custom-llm-provider: openai' \
--output video.mp4

# Or using query parameter
curl --location 'http://localhost:4000/v1/videos/video_id/content?custom_llm_provider=openai' \
--header 'Accept: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--output video.mp4
```

測試影片 remix 請求

```bash
# Using custom_llm_provider in request body
curl --location --request POST 'http://localhost:4000/v1/videos/video_id/remix' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--data '{
    "prompt": "New remix instructions",
    "custom_llm_provider": "openai"
}'

# Or using custom-llm-provider header
curl --location --request POST 'http://localhost:4000/v1/videos/video_id/remix' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--header 'custom-llm-provider: openai' \
--data '{
    "prompt": "New remix instructions"
}'
```

### Character、Edit 與 Extension 路由 {#character-edit-and-extension-routes}

LiteLLM proxy 支援的 OpenAI 影片路由：

- `POST /v1/videos/characters`
- `GET /v1/videos/characters/{character_id}`
- `POST /v1/videos/edits`
- `POST /v1/videos/extensions`

#### `target_model_names` 在建立 character 時的支援 {#target_model_names-support-on-character-creation}

`POST /v1/videos/characters` 支援 `target_model_names`，用於基於模型的路由（與 video create 的行為相同）。

```bash
curl --location 'http://localhost:4000/v1/videos/characters' \
--header 'Authorization: Bearer sk-1234' \
-F 'name=hero' \
-F 'target_model_names=gpt-4' \
-F 'video=@/path/to/character.mp4'
```

當使用 `target_model_names` 時，LiteLLM 會回傳一個已編碼的 character ID：

```json
{
  "id": "character_...",
  "object": "character",
  "created_at": 1712697600,
  "name": "hero"
}
```

在 get 時直接使用該已編碼 ID：

```bash
curl --location 'http://localhost:4000/v1/videos/characters/character_...' \
--header 'Authorization: Bearer sk-1234'
```

#### edit/extension 的已編碼與未編碼影片 ID {#encoded-and-non-encoded-video-ids-for-editextension}

這兩個路由都接受純文字或已編碼的 `video.id`：

- `POST /v1/videos/edits`
- `POST /v1/videos/extensions`

```bash
curl --location 'http://localhost:4000/v1/videos/edits' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "prompt": "Make this brighter",
  "video": { "id": "video_..." }
}'
```

```bash
curl --location 'http://localhost:4000/v1/videos/extensions' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "prompt": "Continue this scene",
  "seconds": "4",
  "video": { "id": "video_..." }
}'
```

#### `custom_llm_provider` 輸入來源 {#custom_llm_provider-input-sources}

對於這些路由，`custom_llm_provider` 可透過以下方式提供：

- 標頭：`custom-llm-provider`
- 查詢：`?custom_llm_provider=...`
- 主體：`custom_llm_provider`（以及 `extra_body.custom_llm_provider`，若支援）

測試 OpenAI 影片生成請求

```bash
curl http://localhost:4000/v1/videos \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-2",
    "prompt": "A cat playing with a ball of yarn in a sunny garden",
    "seconds": "8",
    "size": "720x1280"
  }'
```


## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 最長持續時間 | 支援尺寸 |
|------------|-------------|--------------|-----------------|
| sora-2 | OpenAI 最新的影片生成模型 | 8 秒 | 720x1280, 1280x720 |

## 影片生成參數 {#video-generation-parameters}

- `prompt`（必填）：所需影片的文字描述
- `model`（選填）：要使用的模型，預設為 "sora-2"
- `seconds`（選填）：影片長度（秒）（例如："8"、"16"）
- `size`（選填）：影片尺寸（例如："720x1280"、"1280x720"）
- `input_reference`（選填）：用於影片編輯的參考圖片
- `user`（選填）：用於追蹤的使用者識別碼

## 影片內容擷取 {#video-content-retrieval}

```python
# Download video content
video_bytes = video_content(
    video_id="video_1234567890"
)

# Save to file
with open("video.mp4", "wb") as f:
    f.write(video_bytes)
```

## 完整工作流程 {#complete-workflow}

```python
import litellm
import time

def generate_and_download_video(prompt):
    # Step 1: Generate video
    response = litellm.video_generation(
        prompt=prompt,
        model="sora-2",
        seconds="8",
        size="720x1280"
    )
    
    video_id = response.id
    print(f"Video ID: {video_id}")
    
    # Step 2: Wait for processing (in practice, poll status)
    time.sleep(30)
    
    # Step 3: Download video
    video_bytes = litellm.video_content(
        video_id=video_id
    )
    
    # Step 4: Save to file
    with open(f"video_{video_id}.mp4", "wb") as f:
        f.write(video_bytes)
    
    return f"video_{video_id}.mp4"

# Usage
video_file = generate_and_download_video(
    "A cat playing with a ball of yarn in a sunny garden"
)
```


## 使用參考圖片進行影片編輯 {#video-editing-with-reference-images}

```python
# Video editing with reference image
response = litellm.video_generation(
    prompt="Make the cat jump higher",
    input_reference=open("path/to/image.jpg", "rb"),  # Reference image
    model="sora-2",
    seconds="8"
)

print(f"Video ID: {response.id}")
```

## 錯誤處理 {#error-handling}

```python
from litellm.exceptions import BadRequestError, AuthenticationError

try:
    response = video_generation(
        prompt="A cat playing with a ball of yarn"
    )
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except BadRequestError as e:
    print(f"Bad request: {e}")
```
