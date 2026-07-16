# RunwayML - 影片生成 {#runwayml---video-generation}

LiteLLM 支援 RunwayML 的 Gen-4 影片生成 API，讓您可以從文字提示與圖片生成影片。

## 快速開始 {#quick-start}

```python showLineNumbers title="Basic Video Generation"
from litellm import video_generation
import os

os.environ["RUNWAYML_API_KEY"] = "your-api-key"

# Generate video from text and image
response = video_generation(
    model="runwayml/gen4_turbo",
    prompt="A high quality demo video of litellm ai gateway",
    input_reference="https://media.licdn.com/dms/image/v2/D4D0BAQFqOrIAJEgtLw/company-logo_200_200/company-logo_200_200/0/1714076049190/berri_ai_logo?e=2147483647&v=beta&t=7tG_KRZZ4MPGc7Iin79PcFcrpvf5Hu6rBM4ptHGU1DY",
    seconds=5,
    size="1280x720"
)

print(f"Video ID: {response.id}")
print(f"Status: {response.status}")
```

## 驗證 {#authentication}

設定您的 RunwayML API 金鑰：

```python showLineNumbers title="Set API Key"
import os

os.environ["RUNWAYML_API_KEY"] = "your-api-key"
```

## 支援的參數 {#supported-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | 是 | 要使用的模型（例如 `runwayml/gen4_turbo`） |
| `prompt` | string | 是 | 影片的文字描述 |
| `input_reference` | string/file | 是 | 參考圖片的 URL 或檔案路徑 |
| `seconds` | int | 否 | 影片長度（5 或 10 秒） |
| `size` | string | 否 | 影片尺寸（`1280x720` 或 `720x1280`）。也可使用 `ratio` 格式（`1280:720`） |

## 完整工作流程 {#complete-workflow}

```python showLineNumbers title="Complete Video Generation Workflow"
from litellm import video_generation, video_status, video_content
import os
import time

os.environ["RUNWAYML_API_KEY"] = "your-api-key"

# 1. Generate video
response = video_generation(
    model="runwayml/gen4_turbo",
    prompt="A high quality demo video of litellm ai gateway",
    input_reference="https://media.licdn.com/dms/image/v2/D4D0BAQFqOrIAJEgtLw/company-logo_200_200/company-logo_200_200/0/1714076049190/berri_ai_logo?e=2147483647&v=beta&t=7tG_KRZZ4MPGc7Iin79PcFcrpvf5Hu6rBM4ptHGU1DY",
    seconds=5,
    size="1280x720"
)

video_id = response.id
print(f"Video generation started: {video_id}")

# 2. Check status until completed
while True:
    status_response = video_status(video_id=video_id)
    print(f"Status: {status_response.status}")
    
    if status_response.status == "completed":
        print("Video generation completed!")
        break
    elif status_response.status == "failed":
        print("Video generation failed")
        break
    
    time.sleep(10)  # Wait 10 seconds before checking again

# 3. Download video content
video_bytes = video_content(video_id=video_id)

# 4. Save to file
with open("generated_video.mp4", "wb") as f:
    f.write(video_bytes)

print("Video saved successfully!")
```

## 非同步使用 {#async-usage}

```python showLineNumbers title="Async Video Generation"
from litellm import avideo_generation, avideo_status, avideo_content
import os
import asyncio

os.environ["RUNWAYML_API_KEY"] = "your-api-key"

async def generate_video():
    # Generate video
    response = await avideo_generation(
        model="runwayml/gen4_turbo",
        prompt="A serene lake with mountains in the background",
        input_reference="https://example.com/lake.jpg",
        seconds=5,
        size="1280x720"
    )
    
    video_id = response.id
    print(f"Video generation started: {video_id}")
    
    # Poll for completion
    while True:
        status_response = await avideo_status(video_id=video_id)
        print(f"Status: {status_response.status}")
        
        if status_response.status == "completed":
            break
        elif status_response.status == "failed":
            print("Video generation failed")
            return
        
        await asyncio.sleep(10)
    
    # Download video
    video_bytes = await avideo_content(video_id=video_id)
    
    # Save to file
    with open("generated_video.mp4", "wb") as f:
        f.write(video_bytes)
    
    print("Video saved successfully!")

asyncio.run(generate_video())
```

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

將 RunwayML 新增至您的 proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gen4-turbo
    litellm_params:
      model: runwayml/gen4_turbo
      api_key: os.environ/RUNWAYML_API_KEY
```

啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

透過 proxy 生成影片：

```bash showLineNumbers title="Proxy Request"
curl --location 'http://localhost:4000/v1/videos' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: sk-1234' \
--data '{
    "model": "runwayml/gen4_turbo",
    "prompt": "A high quality demo video of litellm ai gateway",
    "input_reference": "https://media.licdn.com/dms/image/v2/D4D0BAQFqOrIAJEgtLw/company-logo_200_200/company-logo_200_200/0/1714076049190/berri_ai_logo?e=2147483647&v=beta&t=7tG_KRZZ4MPGc7Iin79PcFcrpvf5Hu6rBM4ptHGU1DY",
    "ratio": "1280:720"
}'
```

檢查影片狀態：

```bash showLineNumbers title="Check Status"
curl --location 'http://localhost:4000/v1/videos/{video_id}' \
--header 'x-litellm-api-key: sk-1234'
```

下載影片內容：

```bash showLineNumbers title="Download Video"
curl --location 'http://localhost:4000/v1/videos/{video_id}/content' \
--header 'x-litellm-api-key: sk-1234' \
--output video.mp4
```

## 支援的模型 {#supported-models}

| 模型 | 說明 | 長度 | 長寬比 |
|-------|-------------|----------|---------------|
| `runwayml/gen4_turbo` | 快速影片生成 | 5-10 秒 | 1280x720, 720x1280 |

## 錯誤處理 {#error-handling}

```python showLineNumbers title="Error Handling"
from litellm import video_generation, video_status
import time

try:
    response = video_generation(
        model="runwayml/gen4_turbo",
        prompt="A scenic mountain view",
        input_reference="https://example.com/mountain.jpg",
        seconds=5
    )
    
    # Poll for completion
    max_attempts = 60  # 10 minutes max
    attempts = 0
    
    while attempts < max_attempts:
        status_response = video_status(video_id=response.id)
        
        if status_response.status == "completed":
            print("Video generation completed!")
            break
        elif status_response.status == "failed":
            error = status_response.error or {}
            print(f"Video generation failed: {error.get('message', 'Unknown error')}")
            break
        
        time.sleep(10)
        attempts += 1
    
    if attempts >= max_attempts:
        print("Video generation timed out")
        
except Exception as e:
    print(f"Error: {str(e)}")
```

## 成本追蹤 {#cost-tracking}

LiteLLM 會自動追蹤 RunwayML 影片生成成本：

```python showLineNumbers title="Cost Tracking"
from litellm import video_generation, completion_cost

response = video_generation(
    model="runwayml/gen4_turbo",
    prompt="A high quality demo video of litellm ai gateway",
    input_reference="https://media.licdn.com/dms/image/v2/D4D0BAQFqOrIAJEgtLw/company-logo_200_200/company-logo_200_200/0/1714076049190/berri_ai_logo?e=2147483647&v=beta&t=7tG_KRZZ4MPGc7Iin79PcFcrpvf5Hu6rBM4ptHGU1DY",
    seconds=5,
    size="1280x720"
)

# Calculate cost
cost = completion_cost(completion_response=response)
print(f"Video generation cost: ${cost}")
```

## API 參考 {#api-reference}

如需完整 API 詳情，請參閱 LiteLLM 所遵循的 [OpenAI Video Generation API specification](https://platform.openai.com/docs/guides/video-generation)。

## 支援的功能 {#supported-features}

| 功能 | 支援 |
|---------|-----------|
| 影片生成 | ✅ |
| 圖片轉影片 | ✅ |
| 狀態檢查 | ✅ |
| 內容下載 | ✅ |
| 成本追蹤 | ✅ |
| 記錄 | ✅ |
| 備援 | ✅ |
| 負載平衡 | ✅ |
