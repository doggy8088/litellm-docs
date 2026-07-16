# /videos {#videos}

| 功能 | 支援 | 
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅（完整請求/回應記錄） |
備援 | ✅（在受支援的模型之間） |
| 負載平衡 | ✅ |
| 防護欄支援 | ✅ 內容審核與安全檢查 |
| 代理伺服器支援 | ✅ 與虛擬金鑰的完整代理整合 |
| 支出管理 | ✅ 預算追蹤與速率限制 |
| 支援的提供者 | `openai`, `azure`, `gemini`, `vertex_ai`, `runwayml` |

:::tip

LiteLLM 遵循 [OpenAI 影片生成 API 規範](https://platform.openai.com/docs/guides/video-generation)

:::

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}
### 快速開始  {#quick-start}

```python
from litellm import video_generation, video_status, video_content
import os
import time

os.environ["OPENAI_API_KEY"] = "sk-.."

# Generate video
response = video_generation(
    model="openai/sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    seconds="8",
    size="720x1280"
)

print(f"Video ID: {response.id}")
print(f"Initial Status: {response.status}")

# Check status until video is ready
while True:
    status_response = video_status(
        video_id=response.id
    )
    
    print(f"Current Status: {status_response.status}")
    
    if status_response.status == "completed":
        break
    elif status_response.status == "failed":
        print("Video generation failed")
        break
    
    time.sleep(10)  # Wait 10 seconds before checking again

# Download video content when ready
video_bytes = video_content(
    video_id=response.id
)

# Save to file
with open("generated_video.mp4", "wb") as f:
    f.write(video_bytes)
```

### 非同步使用  {#async-usage}

```python
from litellm import avideo_generation, avideo_status, avideo_content
import os, asyncio

os.environ["OPENAI_API_KEY"] = "sk-.."

async def test_async_video(): 
    response = await avideo_generation(
        model="openai/sora-2",
        prompt="A cat playing with a ball of yarn in a sunny garden",
        seconds="8",
        size="720x1280"
    )
    
    print(f"Video ID: {response.id}")
    print(f"Initial Status: {response.status}")
    
    # Check status until video is ready
    while True:
        status_response = await avideo_status(
            video_id=response.id
        )
        
        print(f"Current Status: {status_response.status}")
        
        if status_response.status == "completed":
            break
        elif status_response.status == "failed":
            print("Video generation failed")
            break
        
        await asyncio.sleep(10)  # Wait 10 seconds before checking again
    
    # Download video content when ready
    video_bytes = await avideo_content(
        video_id=response.id
    )
    
    # Save to file
    with open("generated_video.mp4", "wb") as f:
        f.write(video_bytes)

asyncio.run(test_async_video())
```

### 影片狀態檢查 {#video-status-checking}

```python
from litellm import video_status

status_response = video_status(
    video_id="video_1234567890"
)

print(f"Video Status: {status_response.status}")
print(f"Created At: {status_response.created_at}")
print(f"Model: {status_response.model}")
```

### 列出影片 {#list-videos}

若要列出影片，您需要指定提供者，因為沒有可供解碼的 video_id：

```python
from litellm import video_list

# List videos from OpenAI
videos = video_list(custom_llm_provider="openai")

for video in videos:
    print(f"Video ID: {video['id']}")
```

### 使用參考圖片進行影片生成 {#video-generation-with-reference-image}

```python
from litellm import video_generation

# Video generation with reference image
response = video_generation(
    model="openai/sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    input_reference=open("path/to/image.jpg", "rb"),  # Reference image as file object
    seconds="8",
    size="720x1280"
)

print(f"Video ID: {response.id}")
```

### 影片重混（影片編輯） {#video-remix-video-editing}

```python
from litellm import video_remix

# Video remix with reference image
response = video_remix(
    model="openai/sora-2",
    prompt="Make the cat jump higher",
    input_reference=open("path/to/image.jpg", "rb"),  # Reference image as file object
    seconds="8"
)

print(f"Video ID: {response.id}")
```

### 可選參數 {#optional-parameters}

```python
response = video_generation(
    model="openai/sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    seconds="8",                    # Video duration in seconds
    size="720x1280",               # Video dimensions
    input_reference=open("path/to/image.jpg", "rb"),  # Reference image as file object
    user="user_123"                # User identifier for tracking
)
```

### Azure 影片生成 {#azure-video-generation}

```python
from litellm import video_generation
import os

os.environ["AZURE_OPENAI_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_OPENAI_API_BASE"] = "https://your-resource.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-02-15-preview"

response = video_generation(
    model="azure/sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    seconds="8",
    size="720x1280"
)

print(f"Video ID: {response.id}")
```

## **LiteLLM Proxy 使用方式** {#litellm-proxy-usage}

LiteLLM 提供與 OpenAI API 相容的影片端點，以完成完整的影片生成工作流程：

- `/videos` - 生成新影片
- `/videos/remix` - 使用參考圖片編輯現有影片  
- `/videos/status` - 檢查影片生成狀態
- `/videos/retrieval` - 下載已完成的影片

**設定**

將以下內容加入您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: sora-2
    litellm_params:
      model: openai/sora-2
      api_key: os.environ/OPENAI_API_KEY
  - model_name: azure-sora-2
    litellm_params:
      model: azure/sora-2
      api_key: os.environ/AZURE_OPENAI_API_KEY
      api_base: os.environ/AZURE_OPENAI_API_BASE
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
curl --location 'http://localhost:4000/v1/videos/{video_id}' \
--header 'x-litellm-api-key: sk-1234'
```

測試影片擷取請求

```bash
curl --location 'http://localhost:4000/v1/videos/{video_id}/content' \
--header 'x-litellm-api-key: sk-1234' \
--output video.mp4
```

測試影片重混請求

```bash
curl --location --request POST 'http://localhost:4000/v1/videos/{video_id}/remix' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--data '{
    "prompt": "New remix instructions"
}'
```

測試影片列表請求（需要 custom_llm_provider）

```bash
# Note: video_list requires custom_llm_provider since there's no video_id to decode from
curl --location 'http://localhost:4000/v1/videos?custom_llm_provider=openai' \
--header 'x-litellm-api-key: sk-1234'

# Or using header
curl --location 'http://localhost:4000/v1/videos' \
--header 'x-litellm-api-key: sk-1234' \
--header 'custom-llm-provider: azure'
```

### 角色、編輯與延伸端點 {#character-edit-and-extension-endpoints}

LiteLLM proxy 也支援以下與 OpenAI 相容的影片路由：

- `POST /v1/videos/characters`
- `GET /v1/videos/characters/{character_id}`
- `POST /v1/videos/edits`
- `POST /v1/videos/extensions`

#### 路由行為（`target_model_names`、已編碼 ID 與提供者覆寫） {#routing-behavior-target_model_names-encoded-ids-and-provider-overrides}

- `POST /v1/videos/characters` 支援像 `target_model_names` 這樣的 `POST /v1/videos`。
- 在建立角色時提供 `target_model_names` 時，LiteLLM 會以路由中繼資料編碼回傳的 `character_id`。
- `GET /v1/videos/characters/{character_id}` 可直接接受已編碼的角色 ID。LiteLLM 會在內部解碼該 ID，並使用正確的模型/提供者中繼資料進行路由。
- `POST /v1/videos/edits` 和 `POST /v1/videos/extensions` 同時支援：
  - 純文字 `video.id`
  - LiteLLM 回傳的已編碼 `video.id` 值
- `custom_llm_provider` 可使用與其他 proxy 端點相同的模式提供：
  - 標頭：`custom-llm-provider`
  - 查詢：`?custom_llm_provider=...`
  - 主體：`custom_llm_provider`（或適用時的 `extra_body.custom_llm_provider`）

#### 使用 `target_model_names` 建立角色 {#character-create-with-target_model_names}

```bash
curl --location 'http://localhost:4000/v1/videos/characters' \
--header 'Authorization: Bearer sk-1234' \
-F 'name=hero' \
-F 'target_model_names=gpt-4' \
-F 'video=@/path/to/character.mp4'
```

範例回應（已編碼 `id`）：

```json
{
  "id": "character_...",
  "object": "character",
  "created_at": 1712697600,
  "name": "hero"
}
```

#### 使用已編碼 `character_id` 取得角色 {#get-character-using-encoded-character_id}

```bash
curl --location 'http://localhost:4000/v1/videos/characters/character_...' \
--header 'Authorization: Bearer sk-1234'
```

#### 使用已編碼 `video.id` 進行影片編輯 {#video-edit-with-encoded-videoid}

```bash
curl --location 'http://localhost:4000/v1/videos/edits' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "prompt": "Make this brighter",
  "video": { "id": "video_..." }
}'
```

#### 以來自 `extra_body` 的提供者覆寫進行影片延伸 {#video-extension-with-provider-override-from-extra_body}

```bash
curl --location 'http://localhost:4000/v1/videos/extensions' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
  "prompt": "Continue this scene",
  "seconds": "4",
  "video": { "id": "video_..." },
  "extra_body": { "custom_llm_provider": "openai" }
}'
```

測試 Azure 影片生成請求

```bash
curl http://localhost:4000/v1/videos \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "azure-sora-2",
    "prompt": "A cat playing with a ball of yarn in a sunny garden",
    "seconds": "8",
    "size": "720x1280"
  }'
```

## **搭配 LiteLLM Proxy 使用 OpenAI Client** {#using-openai-client-with-litellm-proxy}

您可以使用標準的 OpenAI Python client 與 LiteLLM 的影片端點互動。這提供了熟悉的介面，同時運用 LiteLLM 的提供者抽象與 proxy 功能。

### 設定 {#setup}

首先，設定您的 OpenAI client 指向您的 LiteLLM proxy：

```python
from openai import OpenAI

# Point the OpenAI client to your LiteLLM proxy
client = OpenAI(
    api_key="sk-1234",  # Your LiteLLM proxy API key
    base_url="http://localhost:4000/v1"  # Your LiteLLM proxy URL
)
```

### 影片生成 {#video-generation}

使用 OpenAI client 介面生成新影片：

```python
# Basic video generation
response = client.videos.create(
    model="sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    seconds=8,
    size="720x1280"
)

print(f"Video ID: {response.id}")
print(f"Status: {response.status}")
```

### 使用參考圖片進行影片生成 {#video-generation-with-reference-image-1}

使用參考圖片建立影片：

```python
# Video generation with reference image
response = client.videos.create(
    model="sora-2",
    prompt="Add clouds to the video",
    seconds=4,
    input_reference=open("/path/to/your/image.jpg", "rb")
)

print(f"Video ID: {response.id}")
print(f"Status: {response.status}")
```

### 影片狀態檢查 {#video-status-checking-1}

檢查影片生成的狀態：

```python
# Check video status
status_response = client.videos.retrieve(
    video_id="video_6900378779308191a7359266e59b53fc01cd6bbd27a70763"
)

print(f"Status: {status_response.status}")
print(f"Progress: {status_response.progress}%")

# Poll until completion
import time

while status_response.status not in ["completed", "failed"]:
    time.sleep(10)  # Wait 10 seconds
    status_response = client.videos.retrieve(
        video_id="video_6900378779308191a7359266e59b53fc01cd6bbd27a70763"
    )
    print(f"Current status: {status_response.status}")
```

### 列出影片 {#list-videos-1}

取得您的影片清單：

```python
# List all videos
videos = client.videos.list()

for video in videos.data:
    print(f"Video ID: {video.id}, Status: {video.status}")
```

### 下載影片內容 {#download-video-content}

下載已完成的影片：

```python
# Download video content
response = client.videos.download_content(
    video_id="video_68fa2938848c8190bb718f977503aba6092ab18d68938fed"
)

# Save the video to file
with open("generated_video.mp4", "wb") as f:
    f.write(response.content)

print("Video downloaded successfully!")
```

### 影片重混（編輯） {#video-remix-editing}

使用新的指令編輯現有影片：

```python
# Remix/edit an existing video
response = client.videos.remix(
    video_id="video_68fa2574bdd88190873a8af06a370ff407094ddbc4bbb91b",
    prompt="Slow the cloud movement",
    seconds=8
)

print(f"Remix Video ID: {response.id}")
print(f"Status: {response.status}")
```

### 完整工作流程範例 {#complete-workflow-example}

以下是顯示完整影片生成工作流程的完整範例：

```python
from openai import OpenAI
import time

# Initialize client
client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000/v1"
)

# 1. Generate video
print("Generating video...")
response = client.videos.create(
    model="sora-2",
    prompt="A serene lake with mountains in the background",
    seconds=8,
    size="1280x720"
)

video_id = response.id
print(f"Video generation started. ID: {video_id}")

# 2. Poll for completion
print("Waiting for video to complete...")
while True:
    status = client.videos.retrieve(video_id=video_id)
    print(f"Status: {status.status}")
    
    if status.status == "completed":
        print("Video generation completed!")
        break
    elif status.status == "failed":
        print("Video generation failed!")
        break
    
    time.sleep(10)

# 3. Download video
if status.status == "completed":
    print("Downloading video...")
    video_content = client.videos.download_content(video_id=video_id)
    
    with open(f"video_{video_id}.mp4", "wb") as f:
        f.write(video_content.content)
    
    print("Video saved successfully!")

# 4. Optional: Remix the video
print("Creating a remix...")
remix_response = client.videos.remix(
    video_id=video_id,
    prompt="Add gentle ripples to the lake surface"
)

print(f"Remix started. ID: {remix_response.id}")
```

## **請求/回應格式** {#requestresponse-format}

:::info

LiteLLM 遵循 **OpenAI 影片生成 API 規範**。 

請參閱 [官方 OpenAI 影片生成文件](https://platform.openai.com/docs/guides/video-generation) 以取得完整 विवरण。

:::

### 請求範例 {#example-request}

```python
{
    "model": "openai/sora-2",
    "prompt": "A cat playing with a ball of yarn in a sunny garden",
    "seconds": "8",
    "size": "720x1280",
    "user": "user_123"
}
```

### 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | 是 | 要使用的影片生成模型（例如，`"openai/sora-2"`） |
| `prompt` | string | 是 | 所需影片的文字描述 |
| `seconds` | string | 否 | 影片長度（秒）（例如，「8」、「16」） |
| `size` | string | 否 | 影片尺寸（例如，「720x1280」、「1280x720」） |
| `input_reference` | file object | 否 | 用於影片生成或編輯的參考圖片（生成與重混皆適用） |
| `user` | string | 否 | 用於追蹤的使用者識別碼 |
| `video_id` | string | 是（狀態/擷取） | 用於狀態檢查或擷取的影片 ID |

#### 影片生成請求範例 {#video-generation-request-example}

**用於影片生成：**
```json
{
  "model": "sora-2",
  "prompt": "A cat playing with a ball of yarn in a sunny garden",
  "seconds": "8",
  "size": "720x1280"
}
```

**用於帶有參考圖片的影片生成：**
```python
{
  "model": "sora-2",
  "prompt": "A cat playing with a ball of yarn in a sunny garden",
  "input_reference": open("path/to/image.jpg", "rb"),  # File object
  "seconds": "8",
  "size": "720x1280"
}
```

**用於影片狀態檢查：**
```json
{
  "video_id": "video_1234567890",
  "model": "sora-2"
}
```

**用於影片擷取：**
```json
{
  "video_id": "video_1234567890",
  "model": "sora-2"
}
```

### 回應格式 {#response-format}

回應遵循 OpenAI 的影片生成格式，結構如下：

```json
{
    "id": "video_6900378779308191a7359266e59b53fc01cd6bbd27a70763",
    "object": "video",
    "status": "queued",
    "created_at": 1761621895,
    "completed_at": null,
    "expires_at": null,
    "error": null,
    "progress": 0,
    "remixed_from_video_id": null,
    "seconds": "4",
    "size": "720x1280",
    "model": "sora-2",
    "usage": {
        "duration_seconds": 4.0
    }
}
```

#### 回應欄位 {#response-fields}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `id` | string | 影片的唯一識別碼 |
| `object` | string | 影片回應一律為 `"video"` |
| `status` | string | 影片處理狀態（`"queued"`、`"processing"`、`"completed"`） |
| `created_at` | integer | 建立影片時的 Unix 時間戳記 |
| `model` | string | 用於影片生成的模型 |
| `size` | string | 影片尺寸 |
| `seconds` | string | 影片長度（秒） |
| `usage` | object | Token 使用量與持續時間資訊 |

## **支援的提供者** {#supported-providers}

| 提供者    | 使用方式連結      |
|-------------|--------------------|
| OpenAI      |   [使用方式](providers/openai/videos)  |
| Azure       |   [使用方式](providers/azure/videos)   |
| Gemini       |   [使用方式](providers/gemini/videos)   |
| Vertex AI   |   [使用方式](providers/vertex_ai/videos) |
| RunwayML    |   [使用方式](providers/runwayml/videos) |
