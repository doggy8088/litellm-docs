---
title: "透過 LiteLLM 使用 QwenCloud API (Qwen)：設定"
sidebar_label: "QwenCloud 與 Qianwen AI Platform（Qwen models）"
description: "透過 LiteLLM 從 Python SDK 或 AI Gateway 在 QwenCloud 或 Qianwen AI Platform 上呼叫 Qwen 模型：chat、串流、嵌入、rerank 與圖片輸出。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# QwenCloud 與 Qianwen AI Platform（Qwen models） {#qwencloud-and-qianwen-ai-platform-qwen-models}

Alibaba 已將其模型平台品牌（DashScope、Bailian、Model Studio）在中國大陸以外整合為 [QwenCloud](https://www.qwencloud.com/)，並在中國大陸整合為 [Qianwen AI Platform](https://www.qianwenai.com/)。LiteLLM 透過現有的 DashScope 實作來路由這兩個品牌，而舊版的 `dashscope/` 前綴仍可作為別名使用

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Alibaba 的 Qwen 模型平台，透過相容於 OpenAI 的 API 提供服務 |
| LiteLLM 上的提供者路由 | `qwencloud/`（國際版）、`qwen_ai_platform/`（中國大陸）、`dashscope/`（舊別名） |
| 提供者文件連結 | [QwenCloud 文件](https://docs.qwencloud.com/developer-guides/getting-started/introduction)、[Qianwen AI Platform 文件](https://platform.qianwenai.com/docs/developer-guides/getting-started/first-api-call) |
| 支援的操作 | `/chat/completions`、`/embeddings`、`/rerank`、`/images/generations` |

這些路由支援隨用隨付 API 金鑰。LiteLLM 尚未對 Token Plan 與 Coding Plan 端點進行對應（追蹤於 [issue #36150](https://github.com/BerriAI/litellm/issues/36150)）

## QwenCloud（國際版） {#qwencloud-international}

在中國大陸以外使用 `qwencloud/` 前綴

| 設定 | 值 |
|-------|-------|
| 前綴 | `qwencloud/` |
| 預設 API base | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| rerank 端點 | `https://dashscope-intl.aliyuncs.com/compatible-api/v1/reranks` |
| 圖像生成端點 | `https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| 影片生成主機 | `https://dashscope-intl.aliyuncs.com` |
| API 金鑰環境變數 | `QWENCLOUD_API_KEY`（會回退至 `DASHSCOPE_API_KEY`） |
| base URL 覆寫 | `QWENCLOUD_API_BASE`、`QWENCLOUD_API_BASE_RERANK`、`QWENCLOUD_API_BASE_IMAGE`、`QWENCLOUD_API_BASE_VIDEO` |

## Qianwen AI Platform（中國大陸） {#qianwen-ai-platform-mainland-china}

在中國大陸使用 `qwen_ai_platform/` 前綴。它會連到大陸主機上的相同路徑

| 設定 | 值 |
|-------|-------|
| 前綴 | `qwen_ai_platform/` |
| 預設 API base | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| rerank 端點 | `https://dashscope.aliyuncs.com/compatible-api/v1/reranks` |
| 圖像生成端點 | `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| 影片生成主機 | `https://dashscope.aliyuncs.com` |
| API 金鑰環境變數 | `QWEN_AI_PLATFORM_API_KEY`（會回退至 `DASHSCOPE_API_KEY`） |
| base URL 覆寫 | `QWEN_AI_PLATFORM_API_BASE`、`QWEN_AI_PLATFORM_API_BASE_RERANK`、`QWEN_AI_PLATFORM_API_BASE_IMAGE`、`QWEN_AI_PLATFORM_API_BASE_VIDEO` |

## API 金鑰 {#api-key}

```python showLineNumbers title="Environment Variables"
import os

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"
```

在中國大陸則請改用 `QWEN_AI_PLATFORM_API_KEY`。當各自的金鑰未設定時，兩個前綴也都會讀取 `DASHSCOPE_API_KEY`，因此現有的 DashScope 憑證可直接使用，無需變更

## 模型 {#models}

兩個前綴都接受 DashScope 目錄中的任何模型，例如 `qwencloud/qwen-max`、`qwencloud/qwen-flash`、`qwencloud/qwen-image-3.0` 或 `qwen_ai_platform/qwen-plus`。請參閱 [DashScope 頁面](./dashscope) 以查看模型清單

## 用法 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 聊天補全 {#chat-completions}

```python showLineNumbers title="QwenCloud Chat Completion"
import os
from litellm import completion

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = completion(
    model="qwencloud/qwen-max",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

### 串流 {#streaming}

```python showLineNumbers title="QwenCloud Streaming Chat Completion"
import os
from litellm import completion

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = completion(
    model="qwencloud/qwen-flash",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True,
)

for chunk in response:
    print(chunk)
```

### 嵌入 {#embedding}

```python showLineNumbers title="QwenCloud Embedding"
import os
from litellm import embedding

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = embedding(
    model="qwencloud/text-embedding-v4",
    input=["hello from litellm"],
)

print(response.data[0]["embedding"][:5])
```

### Rerank {#rerank}

```python showLineNumbers title="QwenCloud Rerank"
import os
from litellm import rerank

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = rerank(
    model="qwencloud/gte-rerank-v2",
    query="What is the capital of France?",
    documents=["Paris is the capital of France", "Berlin is the capital of Germany"],
)

print(response.results)
```

### 圖像生成 {#image-generation}

```python showLineNumbers title="QwenCloud Image Generation"
import os
from litellm import image_generation

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

response = image_generation(
    model="qwencloud/qwen-image-3.0",
    prompt="A cup of coffee on a wooden table",
)

print(response.data[0].url)
```

### 影片生成 {#video-generation}

影片生成在 DashScope task API 上以非同步任務方式執行。`video_generation` 會立即回傳 job id；持續輪詢 `video_status` 直到其回報 `completed`，再以 `video_content` 下載 mp4。

```python showLineNumbers title="QwenCloud Video Generation"
import os
import time
from litellm import video_content, video_generation, video_status

os.environ["QWENCLOUD_API_KEY"] = "your-api-key"

video = video_generation(
    model="qwencloud/wan3.0-video",
    prompt="A paper boat drifting down a rain-soaked city gutter",
    seconds="5",
    size="1280x720",
)

while video.status not in ("completed", "failed"):
    time.sleep(20)
    video = video_status(video_id=video.id)

with open("video.mp4", "wb") as f:
    f.write(video_content(video_id=video.id))
```

支援的模型為 `wan3.0-video`、`wan3.0-video-prime`、`wan2.7-t2v`、`wan2.7-i2v`、`wan2.7-r2v`、`happyhorse-1.1-t2v`、`happyhorse-1.1-i2v`、`happyhorse-1.1-r2v`、`happyhorse-1.0-t2v`、`happyhorse-1.0-i2v` 與 `happyhorse-1.0-r2v`，可搭配 `qwencloud/`、`qwen_ai_platform/` 與 `dashscope/` 任一前綴。每個前綴依其預設主機所服務地區的價目表計價。價格取決於前綴而非主機，因此透過 `DASHSCOPE_API_BASE` 或 `DASHSCOPE_API_BASE_VIDEO` 送往國際主機的 `dashscope/` 影片，仍按中國大陸費率計費。國際主機請使用 `qwencloud/` 前綴，或以 [自訂定價](../proxy/custom_pricing) 設定您自己的價格。

`seconds` 設定以整數秒為單位的時長。`size` 會從 16:9、9:16、1:1、4:3 與 3:4 中挑選最接近的長寬比，並依其較短邊決定計費的解析度級別：小於 600 px 為 480P、小於 900 px 為 720P、更大者為 1080P。Wan 2.7 與 HappyHorse 1.0 僅提供 720P 與 1080P，因此落在 480P 級別的 `size` 在這些模型上會被拒絕。若要使用模型支援的其他比例，例如 Wan 3.0 的 21:9，請直接傳入 `ratio`。未指定 `size` 時，任務以 1080P 執行並計費；未指定 `seconds` 時，任務長度為 5 秒。litellm 僅對其有定價的影片模型對應 `size`，因此在其他任何 DashScope 影片模型上，傳入 `size` 會得到 400 回應，該模型自身的尺寸欄位應改放在 `parameters` 內。格式錯誤的 `seconds` 或 `size`，或模型未提供的解析度，會得到 400 回應，除非在全域、部署或請求上設定了 `drop_params`，此時該值會被捨棄並套用 DashScope 的預設值。圖生影片與參考生影片模型透過 `input_reference` 傳入圖片，可為 URL 或檔案（已開啟的檔案、bytes 或 `pathlib.Path`）。

DashScope 欄位 `resolution`、`ratio`、`audio`、`seed`、`negative_prompt`、`prompt_extend`、`watermark` 與 `media` 可放在請求的最上層。其他任何 DashScope 請求欄位，例如 `shot_type`，應放在 `parameters` 物件內，該物件會按原樣送往 DashScope。從 OpenAI SDK 傳入時，請使用 `extra_body={"parameters": {"shot_type": "multi"}}`。型別錯誤的 `duration`、`seed`、`audio`、`prompt_extend`、`watermark`、`resolution` 或 `ratio`，或超出 0 至 2147483647 範圍的 `seed`，會得到 400 回應，除非設定了 `drop_params`；否則 DashScope 會在建立任務並計費後才讓任務失敗。智慧時長（`duration: -1`）與影片輸入（`media` 中的 `reference_video` 項目）會被拒絕，因為 litellm 在任務建立時即對影片計費，而當時尚無法得知其計費長度。輪詢 DashScope 已不認識的 task id（id 在 24 小時後過期，且僅存在於建立它的地區）會得到 400 回應。DashScope 沒有 list、delete 或 remix 端點。

若要在 proxy 上提供這些模型，請在部署上設定 `mode: video_generation`，並呼叫 `/v1/videos`：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: wan3-video
    litellm_params:
      model: qwencloud/wan3.0-video
      api_key: os.environ/QWENCLOUD_API_KEY
    model_info:
      mode: video_generation
```

```bash showLineNumbers title="Video generation via Proxy - cURL"
curl http://localhost:4000/v1/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "wan3-video",
    "prompt": "A paper boat drifting down a rain-soaked city gutter",
    "seconds": "5",
    "size": "1280x720"
  }'

curl http://localhost:4000/v1/videos/$VIDEO_ID \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl http://localhost:4000/v1/videos/$VIDEO_ID/content \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -o video.mp4
```

## 用法 - LiteLLM Proxy {#usage---litellm-proxy}

將模型加入您的 LiteLLM Proxy 設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: qwen-max
    litellm_params:
      model: qwencloud/qwen-max
      api_key: os.environ/QWENCLOUD_API_KEY
  - model_name: qwen-plus-cn
    litellm_params:
      model: qwen_ai_platform/qwen-plus
      api_key: os.environ/QWEN_AI_PLATFORM_API_KEY
```

啟動 proxy：

```bash showLineNumbers title="Start LiteLLM Proxy"
export QWENCLOUD_API_KEY="your-api-key"
litellm --config config.yaml --port 4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="QwenCloud via Proxy - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-key",
)

response = client.chat.completions.create(
    model="qwen-max",
    messages=[{"role": "user", "content": "hello from litellm"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="QwenCloud via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

</TabItem>
</Tabs>

## 與 DashScope 的向後相容性 {#backward-compatibility-with-dashscope}

`dashscope/` 前綴、`DASHSCOPE_API_KEY`、`DASHSCOPE_API_BASE`，以及所有既有的 DashScope 設定都可維持不變地繼續運作。`qwencloud/` 與 `qwen_ai_platform/` 是同一實作上的別名，因此不需要遷移：您可在適合時切換前綴，或完全不切換
