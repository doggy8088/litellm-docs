import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI 影片生成（Veo） {#vertex-ai-video-generation-veo}

LiteLLM 支援 Vertex AI 的 Veo 影片生成模型，使用統一的 OpenAI 影片 API 介面。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Google Cloud Vertex AI Veo 影片生成模型 |
| LiteLLM 上的提供者路由 | `vertex_ai/` |
| 支援的模型 | `veo-2.0-generate-001`, `veo-3.0-generate-001`, `veo-3.0-fast-generate-001`, `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`, `veo-3.1-lite-generate-001` |
| 成本追蹤 | ✅ 依持續時間計價，並在 Google 定價的 720p 與 1080p 等級採用對應費率（Veo 3.1 Lite） |
| 記錄支援 | ✅ 完整的請求／回應記錄 |
| 代理伺服器支援 | ✅ 與虛擬金鑰完整整合 |
| 支出管理 | ✅ 預算追蹤與速率限制 |
| 提供者文件連結 | [Vertex AI Veo 文件 ↗](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation) |

## 快速開始 {#quick-start}

### 必要的環境設定 {#required-environment-setup}

```python
import json
import os

os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

# Option 1: Point to a service account file
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/service_account.json"

# Option 2: Store the service account JSON directly
with open("/path/to/service_account.json", "r", encoding="utf-8") as f:
    os.environ["VERTEXAI_CREDENTIALS"] = f.read()
```

### 基本使用方式 {#basic-usage}

```python
from litellm import video_generation, video_status, video_content
import json
import os
import time

with open("/path/to/service_account.json", "r", encoding="utf-8") as f:
    vertex_credentials = f.read()

response = video_generation(
    model="vertex_ai/veo-3.0-generate-001",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    vertex_project="your-gcp-project-id",
    vertex_location="us-central1",
    vertex_credentials=vertex_credentials,
    seconds="8",
    size="1280x720",
)

print(f"Video ID: {response.id}")
print(f"Initial Status: {response.status}")

# Poll for completion
while True:
    status = video_status(
        video_id=response.id,
        vertex_project="your-gcp-project-id",
        vertex_location="us-central1",
        vertex_credentials=vertex_credentials,
    )

    print(f"Current Status: {status.status}")

    if status.status == "completed":
        break
    if status.status == "failed":
        raise RuntimeError("Video generation failed")

    time.sleep(10)

# Download the rendered video
video_bytes = video_content(
    video_id=response.id,
    vertex_project="your-gcp-project-id",
    vertex_location="us-central1",
    vertex_credentials=vertex_credentials,
)

with open("generated_video.mp4", "wb") as f:
    f.write(video_bytes)
```

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 最長持續時間 | 狀態 |
|------------|-------------|--------------|--------|
| veo-2.0-generate-001 | Veo 2.0 影片生成 | 5 秒 | GA |
| veo-3.0-generate-001 | Veo 3.0 高品質 | 8 秒 | GA |
| veo-3.0-fast-generate-001 | Veo 3.0 快速生成 | 8 秒 | GA |
| veo-3.1-generate-preview | Veo 3.1 高品質 | 10 秒 | Preview |
| veo-3.1-fast-generate-preview | Veo 3.1 快速 | 10 秒 | Preview |
| veo-3.1-lite-generate-001 | Veo 3.1 Lite，最低成本等級，720p 或 1080p 輸出 | 8 秒 | Preview |

Veo 3.1 Lite 依輸出秒數計價，720p 每秒 $0.05、1080p 每秒 $0.08；除非請求指定 1080p，否則 Veo 會輸出 720p。請參閱 [Size to Resolution Mapping](#size-to-resolution-mapping)，了解如何透過 OpenAI `size` 參數請求 1080p。

## 影片生成參數 {#video-generation-parameters}

LiteLLM 會自動將 OpenAI 風格的參數轉換為 Veo 的 API 格式：

| OpenAI 參數 | Vertex AI 參數 | 說明 | 範例 |
|------------------|---------------------|-------------|---------|
| `prompt` | `instances[].prompt` | 影片的文字描述 | "A cat playing" |
| `size` | `parameters.aspectRatio`, plus `parameters.resolution` on models with a 1080p price tier | 轉換為 `16:9` 或 `9:16`，且在依解析度計價的模型上轉換為 `720p` 或 `1080p` | "1920x1080" → `16:9` and `1080p` |
| `seconds` | `parameters.durationSeconds` | 秒數長度 | "8" → `8` |
| `input_reference` | `instances[].image` | 用於動畫的參考圖片 | `open("image.jpg", "rb")` |
| 提供者專屬參數 | `extra_body` | 轉送至 Vertex API | `{"negativePrompt": "blurry"}` |

### 尺寸到長寬比對應 {#size-to-aspect-ratio-mapping}

- `1280x720`, `1920x1080` → `16:9`
- `720x1280`, `1080x1920` → `9:16`
- 未知尺寸預設為 `16:9`

### 大小到解析度對應 {#size-to-resolution-mapping}

Veo 會從自己的 `resolution` 參數決定輸出解析度，而不是從長寬比決定，因此只設定 `1920x1080` 的 `aspectRatio` 請求，仍會以 720p 回傳。對於 LiteLLM 定價中包含獨立 1080p 費率的模型（目前 `veo-3.1-lite-generate-001`），LiteLLM 也會根據 `size` 推斷 `resolution`：

| `size` | 傳送的 `aspectRatio` | 傳送的 `resolution` |
|--------|--------------------|-------------------|
| `1280x720` | `16:9` | `720p` |
| `720x1280` | `9:16` | `720p` |
| `1920x1080` | `16:9` | `1080p` |
| `1080x1920` | `9:16` | `1080p` |

任何其他 `size` 值都只會對應到長寬比，並讓解析度維持 Veo 的預設值。不含 1080p 費率的模型（Veo 2.0、Veo 3.0，以及其他 Veo 3.1 變體）永遠不會推斷出 `resolution`，因此其請求不會變更。若您自行傳入 `resolution`，不論是作為頂層參數或放在 `extra_body` 中，都會優先於從 `size` 推斷出的值。

```bash
curl --location 'http://0.0.0.0:4000/v1/videos' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
  "model": "veo-3.1-lite-generate-001",
  "prompt": "A slow aerial shot of a lighthouse at sunrise",
  "seconds": "8",
  "size": "1920x1080"
}'
```

回應 `usage` 會回報所請求的解析度，而支出記錄會以該等級為該剪輯定價：

```json
{"duration_seconds": 8.0, "video_resolution": "1080p"}
```

因此，一段 8 秒的 Veo 3.1 Lite 影片在 `1280x720` 下費用為 $0.40，在 `1920x1080` 下費用為 $0.64。

## 非同步使用方式 {#async-usage}

```python
from litellm import avideo_generation, avideo_status, avideo_content
import asyncio
import json

with open("/path/to/service_account.json", "r", encoding="utf-8") as f:
    vertex_credentials = f.read()


async def workflow():
    response = await avideo_generation(
        model="vertex_ai/veo-3.1-generate-preview",
        prompt="Slow motion water droplets splashing into a pool",
        seconds="10",
        vertex_project="your-gcp-project-id",
        vertex_location="us-central1",
        vertex_credentials=vertex_credentials,
    )

    while True:
        status = await avideo_status(
            video_id=response.id,
            vertex_project="your-gcp-project-id",
            vertex_location="us-central1",
            vertex_credentials=vertex_credentials,
        )

        if status.status == "completed":
            break
        if status.status == "failed":
            raise RuntimeError("Video generation failed")

        await asyncio.sleep(10)

    video_bytes = await avideo_content(
        video_id=response.id,
        vertex_project="your-gcp-project-id",
        vertex_location="us-central1",
        vertex_credentials=vertex_credentials,
    )

    with open("veo_water.mp4", "wb") as f:
        f.write(video_bytes)

asyncio.run(workflow())
```

## LiteLLM 代理使用方式 {#litellm-proxy-usage}

將 Veo 模型加入您的 `config.yaml`：

```yaml
model_list:
  - model_name: veo-3
    litellm_params:
      model: vertex_ai/veo-3.0-generate-001
      vertex_project: os.environ/VERTEXAI_PROJECT
      vertex_location: os.environ/VERTEXAI_LOCATION
      vertex_credentials: os.environ/VERTEXAI_CREDENTIALS
```

啟動代理並發出請求：

<Tabs>
<TabItem value="curl" label="Curl">

```bash
# Step 1: Generate video
curl --location 'http://0.0.0.0:4000/videos' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
  "model": "veo-3",
  "prompt": "Aerial shot over a futuristic city at sunrise",
  "seconds": "8"
}'

# Step 2: Poll status
curl --location 'http://localhost:4000/v1/videos/{video_id}' \
--header 'x-litellm-api-key: sk-<your-litellm-api-key>'

# Step 3: Download video
curl --location 'http://localhost:4000/v1/videos/{video_id}/content' \
--header 'x-litellm-api-key: sk-<your-litellm-api-key>' \
--output video.mp4
```

</TabItem>
<TabItem value="python" label="Python SDK">

```python
import litellm

litellm.api_base = "http://0.0.0.0:4000"
litellm.api_key = "sk-<your-litellm-api-key>"

response = litellm.video_generation(
    model="veo-3",
    prompt="Aerial shot over a futuristic city at sunrise",
)

status = litellm.video_status(video_id=response.id)
while status.status not in ["completed", "failed"]:
    status = litellm.video_status(video_id=response.id)

if status.status == "completed":
    content = litellm.video_content(video_id=response.id)
    with open("veo_city.mp4", "wb") as f:
        f.write(content)
```

</TabItem>
</Tabs>

## 成本追蹤 {#cost-tracking}

LiteLLM 會記錄 Veo 回傳的期間，讓您可以套用依期間計費。

```python
with open("/path/to/service_account.json", "r", encoding="utf-8") as f:
    vertex_credentials = f.read()

response = video_generation(
    model="vertex_ai/veo-2.0-generate-001",
    prompt="Flowers blooming in fast forward",
    seconds="5",
    vertex_project="your-gcp-project-id",
    vertex_location="us-central1",
    vertex_credentials=vertex_credentials,
)

print(response.usage)  # {"duration_seconds": 5.0}
```

對於依解析度計價的模型，`usage` 也會帶有 `video_resolution`（`720p` 或 `1080p`），且成本會使用該等級的每秒費率，如 [Size to Resolution Mapping](#size-to-resolution-mapping) 所示。

## 疑難排解 {#troubleshooting}

- **`vertex_project is required`**：設定 `VERTEXAI_PROJECT` 環境變數，或在請求中傳入 `vertex_project`。
- **`Permission denied`**：請確認服務帳戶具有 `Vertex AI User` 角色，且已啟用正確的區域。
- **影片卡在 `processing`**：Veo 作業屬於長時間執行。請持續每 10–15 秒輪詢一次，最長約 10 分鐘。

## 另請參見 {#see-also}

- [OpenAI 影片生成](../openai/videos.md)
- [Azure 影片生成](../azure/videos.md)
- [Gemini 影片生成](../gemini/videos.md)
- [影片生成 API 參考](/docs/videos)
