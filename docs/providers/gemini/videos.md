import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 影片生成 (Veo) {#gemini-video-generation-veo}

LiteLLM 透過統一的 API 介面支援 Google 的 Veo 影片生成模型。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Google 的 Veo AI 影片生成模型 |
| LiteLLM 上的提供者路由 | `gemini/` |
| 支援的模型 | Veo 3.0 / 3.1 預覽版與正式版 ID（見下表），包括 **Veo 3.1 Lite** |
| 成本追蹤 | ✅ 依時長計價；目錄中列出的情況下，另有可選的 **依解析度** 分級（例如 720p 與 1080p） |
| 記錄支援 | ✅ 完整的請求/回應記錄 |
| Proxy 伺服器支援 | ✅ 與虛擬金鑰的完整 proxy 整合 |
| 支出管理 | ✅ 預算追蹤與速率限制 |
| 提供者文件連結 | [Google Veo 文件 ↗](https://ai.google.dev/gemini-api/docs/video) |

## 快速開始 {#quick-start}

### 所需 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["GEMINI_API_KEY"] = "your-google-api-key"
# OR
os.environ["GOOGLE_API_KEY"] = "your-google-api-key"
```

### 基本用法 {#basic-usage}

```python
from litellm import video_generation, video_status, video_content
import os
import time

os.environ["GEMINI_API_KEY"] = "your-google-api-key"

# Step 1: Generate video
response = video_generation(
    model="gemini/veo-3.0-generate-preview",
    prompt="A cat playing with a ball of yarn in a sunny garden"
)

print(f"Video ID: {response.id}")
print(f"Initial Status: {response.status}")  # "processing"

# Step 2: Poll for completion
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

# Step 3: Download video content
video_bytes = video_content(
    video_id=response.id
)

# Save to file
with open("generated_video.mp4", "wb") as f:
    f.write(video_bytes)

print("Video downloaded successfully!")
```

## 支援的模型 {#supported-models}

| 模型名稱 | 說明 | 最長時長 | 狀態 |
|------------|-------------|--------------|--------|
| veo-3.0-generate-preview | Veo 3.0 影片生成 | 8 秒 | 預覽版 |
| veo-3.1-generate-preview | Veo 3.1 影片生成 | 8 秒 | 預覽版 |
| veo-3.1-lite-generate-preview | Veo 3.1 **Lite**（成本更有效率；[Gemini 定價](https://ai.google.dev/gemini-api/docs/video)） | 依 Google 文件 | 預覽版 |
| veo-3.1-fast-generate-preview / `…-001` | 較快 / 正式版變體 | 依 Google 文件 | 預覽版 / GA |
| veo-3.1-generate-001 | Veo 3.1 正式版 | 依 Google 文件 | GA |

請使用帶有 `gemini/` 前綴的完整 LiteLLM 模型 id（例如 `gemini/veo-3.1-lite-generate-preview`）。

## 影片生成參數 {#video-generation-parameters}

LiteLLM 會自動將 OpenAI 風格參數對應為 Veo 的格式：

| OpenAI 參數 | Veo 參數 | 說明 | 範例 |
|------------------|---------------|-------------|---------|
| `prompt` | `prompt` | 影片的文字描述 | "A cat playing" |
| `size` | `aspectRatio`，且在適用時為 **`resolution`** | 標準寬高會對應到橫向/直向 **並且** 對應 API 的 `720p` 或 `1080p` | 見下方 |
| `seconds` | `durationSeconds` | 以秒為單位的時長 | "8" → 8 |
| `input_reference` | `image` | 要動畫化的參考圖片 | 檔案物件或路徑 |
| `model` | `model` | 要使用的模型 | "gemini/veo-3.0-generate-preview" |

### `size` 與輸出解析度 {#size-and-output-resolution}

當您傳入 **標準 `size`** 字串時，LiteLLM 會同時設定：

- **長寬比**（`16:9` 或 `9:16`）——與之前相同。
- **輸出解析度**（`720p` 或 `1080p`）在預設值可明確由高度判定時，會以此請求正確的 Veo 分級，而無需額外欄位。

| `size` | 長寬比 | 傳送至 Veo 的解析度 |
|--------|----------------|-------------------------|
| `1280x720`, `720x1280` | `16:9` / `9:16` | `720p` |
| `1920x1080`, `1080x1920` | `16:9` / `9:16` | `1080p` |

其他 `size` 值仍會對應到長寬比（若未知則預設為 `16:9`）；除非您自行設定，否則解析度會由 **Google 的預設值** 決定。

您也可以傳入 Veo 的 **`resolution`**（例如透過 `extra_body`），如果您需要一個不符合上述預設的明確值。如果您自行設定 `resolution`，它會優先於從 `size` 推斷出的值。

### 尺寸到長寬比（參考） {#size-to-aspect-ratio-reference}

- `"1280x720"`, `"1920x1080"` → `"16:9"`（橫向）
- `"720x1280"`, `"1080x1920"` → `"9:16"`（直向）

### 支援的 Veo 參數 {#supported-veo-parameters}

根據 Veo 的 API：
- **prompt**（必填）：可包含可選音訊提示的文字描述
- **aspectRatio**：`"16:9"`（預設）或 `"9:16"`
- **resolution**：`"720p"`（預設）或 `"1080p"`（僅 Veo 3.1，且僅支援 16:9 長寬比）
- **durationSeconds**：影片長度（多數模型最長 8 秒）
- **image**：用於動畫化的參考圖片
- **negativePrompt**：要從影片中排除的內容（Veo 3.1）
- **referenceImages**：風格與內容參考（僅 Veo 3.1）

## 完整工作流程範例 {#complete-workflow-example}

```python
import litellm
import time

def generate_and_download_veo_video(
    prompt: str, 
    output_file: str = "video.mp4",
    size: str = "1280x720",
    seconds: str = "8"
):
    """
    Complete workflow for Veo video generation.
    
    Args:
        prompt: Text description of the video
        output_file: Where to save the video
        size: Video dimensions (e.g., "1280x720" for 16:9)
        seconds: Duration in seconds
        
    Returns:
        bool: True if successful
    """
    print(f"🎬 Generating video: {prompt}")
    
    # Step 1: Initiate generation
    response = litellm.video_generation(
        model="gemini/veo-3.0-generate-preview",
        prompt=prompt,
        size=size,      # Maps to aspectRatio
        seconds=seconds  # Maps to durationSeconds
    )
    
    video_id = response.id
    print(f"✓ Video generation started (ID: {video_id})")
    
    # Step 2: Wait for completion
    max_wait_time = 600  # 10 minutes
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        status_response = litellm.video_status(video_id=video_id)
        
        if status_response.status == "completed":
            print("✓ Video generation completed!")
            break
        elif status_response.status == "failed":
            print("✗ Video generation failed")
            return False
        
        print(f"⏳ Status: {status_response.status}")
        time.sleep(10)
    else:
        print("✗ Timeout waiting for video generation")
        return False
    
    # Step 3: Download video
    print("⬇️  Downloading video...")
    video_bytes = litellm.video_content(video_id=video_id)
    
    with open(output_file, "wb") as f:
        f.write(video_bytes)
    
    print(f"✓ Video saved to {output_file}")
    return True

# Use it
generate_and_download_veo_video(
    prompt="A serene lake at sunset with mountains in the background",
    output_file="sunset_lake.mp4"
)
```

## 非同步用法 {#async-usage}

```python
from litellm import avideo_generation, avideo_status, avideo_content
import asyncio

async def async_video_workflow():
    # Generate video
    response = await avideo_generation(
        model="gemini/veo-3.0-generate-preview",
        prompt="A cat playing with a ball of yarn"
    )
    
    # Poll for completion
    while True:
        status = await avideo_status(video_id=response.id)
        if status.status == "completed":
            break
        await asyncio.sleep(10)
    
    # Download content
    video_bytes = await avideo_content(video_id=response.id)
    
    with open("video.mp4", "wb") as f:
        f.write(video_bytes)

# Run it
asyncio.run(async_video_workflow())
```

## LiteLLM Proxy 用法 {#litellm-proxy-usage}

### 設定 {#configuration}

將 Veo 模型新增至您的 `config.yaml`：

```yaml
model_list:
  - model_name: veo-3
    litellm_params:
      model: gemini/veo-3.0-generate-preview
      api_key: os.environ/GEMINI_API_KEY
```

啟動 proxy：

```bash
litellm --config config.yaml
# Server running on http://0.0.0.0:4000
```

### 發送請求 {#making-requests}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
# Step 1: Generate video
curl --location 'http://0.0.0.0:4000/v1/videos' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "veo-3",
    "prompt": "A cat playing with a ball of yarn in a sunny garden"
}'

# Response: {"id": "gemini::operations/generate_12345::...", "status": "processing", ...}

# Step 2: Check status
curl --location 'http://localhost:4000/v1/videos/{video_id}' \
--header 'x-litellm-api-key: sk-1234'

# Step 3: Download video (when status is "completed")
curl --location 'http://localhost:4000/v1/videos/{video_id}/content' \
--header 'x-litellm-api-key: sk-1234' \
--output video.mp4
```

</TabItem>
<TabItem value="python" label="Python SDK">

```python
import litellm

litellm.api_base = "http://0.0.0.0:4000"
litellm.api_key = "sk-1234"

# Generate video
response = litellm.video_generation(
    model="veo-3",
    prompt="A cat playing with a ball of yarn in a sunny garden"
)

# Check status
import time
while True:
    status = litellm.video_status(video_id=response.id)
    if status.status == "completed":
        break
    time.sleep(10)

# Download video
video_bytes = litellm.video_content(video_id=response.id)
with open("video.mp4", "wb") as f:
    f.write(video_bytes)
```

</TabItem>
</Tabs>

## 成本追蹤與支出 {#cost-tracking-and-spend}

LiteLLM 會根據以下項目估算 **影片支出**：

1. **生成片段計費的時長**（秒），以及  
2. LiteLLM 模型目錄中該模型的 **每秒價格**（在適用時與 [Google 的 Gemini API 影片定價](https://ai.google.dev/gemini-api/docs/video) 一致）。

某些模型對 **720p** 與 **1080p** 收取 **不同的每秒費率**。當您使用上述標準 `size` 預設值（或明確設定 `resolution`）時，LiteLLM 會使用相符的分級，讓 **proxy 支出、記錄與預算** 與您請求的解析度一致。

LiteLLM 會自動追蹤 Veo 影片生成的成本：

```python
response = litellm.video_generation(
    model="gemini/veo-3.0-generate-preview",
    prompt="A beautiful sunset"
)

# Cost is calculated based on video duration
# Veo pricing: ~$0.10 per second (estimated)
# Default video duration: ~5 seconds
# Estimated cost: ~$0.50
```

## 與 OpenAI 影片 API 的差異 {#differences-from-openai-video-api}

| 功能 | OpenAI (Sora) | Gemini (Veo) |
|---------|---------------|--------------|
| 參考圖片 | ✅ 支援 | ❌ 不支援 |
| 尺寸 / 維度 | ✅ 支援 | ✅ 透過 `size` → 長寬比 + `720p`/`1080p`（若有預設）支援 |
| 時長（`seconds`） | ✅ 支援 | ✅ 支援（對應到 `durationSeconds`；限制依 Google 文件） |
| 影片重混 / 編輯 | ✅ 支援 | ❌ 不支援 |
| 影片清單 | ✅ 支援 | ❌ 不支援 |
| 以提示詞為基礎的生成 | ✅ 支援 | ✅ 支援 |
| 非同步操作 | ✅ 支援 | ✅ 支援 |

## 錯誤處理 {#error-handling}

```python
from litellm import video_generation, video_status, video_content
from litellm.exceptions import APIError, Timeout

try:
    response = video_generation(
        model="gemini/veo-3.0-generate-preview",
        prompt="A beautiful landscape"
    )
    
    # Poll with timeout
    max_attempts = 60  # 10 minutes (60 * 10s)
    for attempt in range(max_attempts):
        status = video_status(video_id=response.id)
        
        if status.status == "completed":
            video_bytes = video_content(video_id=response.id)
            with open("video.mp4", "wb") as f:
                f.write(video_bytes)
            break
        elif status.status == "failed":
            raise APIError("Video generation failed")
        
        time.sleep(10)
    else:
        raise Timeout("Video generation timed out")
        
except APIError as e:
    print(f"API Error: {e}")
except Timeout as e:
    print(f"Timeout: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## 最佳實務 {#best-practices}

1. **一律輪詢完成狀態**：Veo 影片生成是非同步的，可能需要幾分鐘
2. **設定合理的逾時**：請為影片生成預留至少 5-10 分鐘
3. **優雅處理失敗**：檢查 `failed` 狀態並實作重試邏輯
4. **使用描述性提示詞**：更詳細的提示詞通常會產生更好的結果
5. **儲存影片 ID**：儲存作業 ID/影片 ID，以便應用程式重新啟動後可繼續輪詢

## 疑難排解 {#troubleshooting}

### 影片生成逾時 {#video-generation-times-out}

```python
# Increase polling timeout
max_wait_time = 900  # 15 minutes instead of 10
```

### 下載時找不到影片 {#video-not-found-when-downloading}

```python
# Make sure video is completed before downloading
status = video_status(video_id=video_id)
if status.status != "completed":
    print("Video not ready yet!")
```

### API 金鑰錯誤 {#api-key-errors}

```python
# Verify your API key is set
import os
print(os.environ.get("GEMINI_API_KEY"))

# Or pass it explicitly
response = video_generation(
    model="gemini/veo-3.0-generate-preview",
    prompt="...",
    api_key="your-api-key-here"
)
```

## 另請參閱 {#see-also}

- [OpenAI 影片生成](../openai/videos.md)
- [Azure 影片生成](../azure/videos.md)
- [Vertex AI 影片生成](../vertex_ai/videos.md)
- [影片生成 API 參考](/docs/videos)
- [Veo 直通端點](/docs/pass_through/google_ai_studio#example-4-video-generation-with-veo)
