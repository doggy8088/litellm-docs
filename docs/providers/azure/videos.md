import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure 影片生成 {#azure-video-generation}

LiteLLM 支援 Azure OpenAI 的影片生成模型，包括 Sora，並提供完整的端到端整合。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Azure OpenAI 的影片生成模型，包括 Sora-2 |
| LiteLLM 提供者路由 | `azure/` |
| 支援的模型 | `sora-2` |
| Cost Tracking | ✅ 依時長計價（$0.10/秒） |
| Logging Support | ✅ 完整的請求/回應記錄 |
| Guardrails Support | ✅ 內容審核與安全檢查 |
| Proxy Server Support | ✅ 與虛擬金鑰的完整代理整合 |
| Spend Management | ✅ 預算追蹤與速率限制 |
| 提供者文件連結 | [Azure OpenAI Video Generation ↗](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/video-generation) |

## 快速開始 {#quick-start}

### 必要的 API 金鑰 {#required-api-keys}

```python
import os 
os.environ["AZURE_OPENAI_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_OPENAI_API_BASE"] = "https://your-resource.openai.azure.com/"
```

### 基本用法 {#basic-usage}

```python
from litellm import video_generation, video_status, video_content
import os
import time

os.environ["AZURE_OPENAI_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_OPENAI_API_BASE"] = "https://your-resource.openai.azure.com/"

# Generate video
response = video_generation(
    model="azure/sora-2",
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

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

以下說明如何搭配 LiteLLM Proxy Server 呼叫 Azure 影片生成模型

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export AZURE_OPENAI_API_KEY="your-azure-api-key"
export AZURE_OPENAI_API_BASE="https://your-resource.openai.azure.com/"
```

### 2. 啟動 proxy  {#2-start-the-proxy}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml
model_list:
  - model_name: azure-sora-2
    litellm_params:
      model: azure/sora-2
      api_key: os.environ/AZURE_OPENAI_API_KEY
      api_base: os.environ/AZURE_OPENAI_API_BASE
```

</TabItem>
<TabItem value="cli" label="CLI">

```bash
$ litellm --model azure/sora-2

# Server running on http://0.0.0.0:4000
```

</TabItem>

</Tabs>

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="Curl" label="Curl Request">

```shell
curl --location 'http://0.0.0.0:4000/videos/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "azure-sora-2",
    "prompt": "A cat playing with a ball of yarn in a sunny garden",
    "seconds": "8",
    "size": "720x1280"
}'
```

</TabItem>
<TabItem value="openai" label="OpenAI v1.0.0+">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.videos.create(
    model="azure-sora-2",
    prompt="A cat playing with a ball of yarn in a sunny garden",
    seconds=8,
    size="720x1280"
)

print(response)
```

</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

| 模型名稱 | 
|------------|
| sora-2 | 
|sora-2-pro |
|sora-2-pro-high-res|

## 記錄與可觀測性 {#logging--observability}

### 請求/回應記錄 {#requestresponse-logging}

所有影片生成請求都會自動記錄以下內容：

- **請求詳細資訊**：prompt、model、duration、size
- **回應詳細資訊**：video ID、status、creation time
- **成本追蹤**：依時長計價計算
- **效能指標**：請求延遲、處理時間

### 記錄提供者 {#logging-providers}

影片生成可與所有 LiteLLM 記錄提供者搭配使用：

- **Datadog**：即時監控與警示
- **Helicone**：請求追蹤與除錯
- **LangSmith**：LangChain 整合與追蹤
- **自訂 webhook**：將記錄傳送到您自己的端點

**範例：啟用 Datadog 記錄**

```yaml
general_settings:
  alerting: ["datadog"]
  datadog_api_key: os.environ/DATADOG_API_KEY
```


## 影片生成參數 {#video-generation-parameters}

- `prompt`（必填）：所需影片的文字描述
- `model`（選填）：要使用的模型，預設為 "azure/sora-2"
- `seconds`（選填）：影片長度（秒），例如 "8"、"16"
- `size`（選填）：影片尺寸，例如 "720x1280"、"1280x720"
- `input_reference`（選填）：供影片編輯使用的參考圖片
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
        model="azure/sora-2",
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

## 影片重混（影片編輯） {#video-remix-video-editing}

```python
# Video editing with reference image
response = litellm.video_remix(
    video_id="video_456",
    prompt="Make the cat jump higher",
    input_reference=open("path/to/image.jpg", "rb"),  # Reference image as file object
    seconds="8"
)

print(f"Video ID: {response.id}")
```

## 錯誤處理 {#error-handling}

```python
from litellm.exceptions import BadRequestError, AuthenticationError

try:
    response = video_generation(
        prompt="A cat playing with a ball of yarn",
        model="azure/sora-2"
    )
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except BadRequestError as e:
    print(f"Bad request: {e}")
```
