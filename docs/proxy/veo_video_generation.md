import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Google AI Studio 的 Veo 影片生成 {#veo-video-generation-with-google-ai-studio}

透過 LiteLLM 的轉送端點，使用 Google 的 Veo 模型生成影片。

## 快速開始 {#quick-start}

LiteLLM 讓您能透過轉送路由使用 Google AI Studio 的 Veo 影片生成 API，且無需任何設定。

### 1. 將 Google AI Studio API 金鑰加入您的環境  {#1-add-google-ai-studio-api-key-to-your-environment}

```bash
export GEMINI_API_KEY="your_google_ai_studio_api_key"
```

### 2. 啟動 LiteLLM Proxy  {#2-start-litellm-proxy}

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

### 3. 生成影片 {#3-generate-video}

<Tabs>
<TabItem value="python" label="Python">

```python
import requests
import time
import json

# Configuration
BASE_URL = "http://localhost:4000/gemini/v1beta"
API_KEY = "anything"  # Use "anything" as the key

headers = {
    "x-goog-api-key": API_KEY,
    "Content-Type": "application/json"
}

# Step 1: Initiate video generation
def generate_video(prompt):
    url = f"{BASE_URL}/models/veo-3.0-generate-preview:predictLongRunning"
    payload = {
        "instances": [{
            "prompt": prompt
        }]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    return data.get("name")  # Operation name

# Step 2: Poll for completion
def wait_for_completion(operation_name):
    operation_url = f"{BASE_URL}/{operation_name}"
    
    while True:
        response = requests.get(operation_url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("done", False):
            # Extract video URI
            video_uri = data["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
            return video_uri
        
        time.sleep(10)  # Wait 10 seconds before next poll

# Step 3: Download video
def download_video(video_uri, filename="generated_video.mp4"):
    # Replace Google URL with LiteLLM proxy URL
    litellm_url = video_uri.replace(
        "https://generativelanguage.googleapis.com/v1beta", 
        BASE_URL
    )
    
    response = requests.get(litellm_url, headers=headers, stream=True)
    response.raise_for_status()
    
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    
    return filename

# Complete workflow
prompt = "A cat playing with a ball of yarn in a sunny garden"

print("Generating video...")
operation_name = generate_video(prompt)

print("Waiting for completion...")
video_uri = wait_for_completion(operation_name)

print("Downloading video...")
filename = download_video(video_uri)

print(f"Video saved as: {filename}")
```

</TabItem>

<TabItem value="curl" label="Curl">

```bash
# Step 1: Initiate video generation
curl -X POST "http://localhost:4000/gemini/v1beta/models/veo-3.0-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: anything" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "prompt": "A cat playing with a ball of yarn in a sunny garden"
    }]
  }'

# Response will include operation name:
# {"name": "operations/generate_12345"}

# Step 2: Poll for completion
curl -X GET "http://localhost:4000/gemini/v1beta/operations/generate_12345" \
  -H "x-goog-api-key: anything"

# Step 3: Download video (when done=true)
curl -X GET "http://localhost:4000/gemini/v1beta/files/VIDEO_ID:download?alt=media" \
  -H "x-goog-api-key: anything" \
  --output generated_video.mp4
```

</TabItem>
</Tabs>

## 完整範例 {#complete-example}

如需含錯誤處理與記錄的完整可運作範例，請參閱我們的 [Veo Video Generation Cookbook](https://github.com/BerriAI/litellm/blob/main/cookbook/veo_video_generation.py)。

## 運作方式 {#how-it-works}

1. **影片生成請求**：將提示傳送至 Veo 的 `predictLongRunning` 端點
2. **作業輪詢**：監控長時間執行的作業直到完成
3. **檔案下載**：透過 LiteLLM 的轉送下載生成的影片，並自動處理重新導向

LiteLLM 會處理：
- ✅ 與 Google AI Studio 的驗證
- ✅ 請求路由與代理
- ✅ 檔案下載的自動重新導向處理

## 設定選項 {#configuration-options}

### 環境變數 {#environment-variables}

```bash
export GEMINI_API_KEY="your_google_ai_studio_api_key"
```
