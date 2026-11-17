---
title: "透過 LiteLLM 使用 Volcano Engine (Volcengine) API"
sidebar_label: "Volcano Engine (Volcengine)"
description: "透過 LiteLLM 呼叫 Volcano Engine (Volcengine) chat 端點、以 Doubao embedding 模型嵌入文字，並以非同步任務產生 Doubao-Seedance 影片。"
---

# Volcano Engine（Volcengine） {#volcano-engine-volcengine}
https://www.volcengine.com/docs/82379/1263482

:::tip

**我們支援所有 Volcengine 模型，包括 Chat 和 Embeddings，送出 litellm 請求時只要將 `model=volcengine/<any-model-on-volcengine>` 作為前綴即可**

:::

## API 金鑰 {#api-key}
```python
# env variable
os.environ['VOLCENGINE_API_KEY']
# or
os.environ['ARK_API_KEY']
```

## 使用範例 {#sample-usage}
```python
from litellm import completion
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = completion(
    model="volcengine/<OUR_ENDPOINT_ID>",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    temperature=0.2,        # optional
    top_p=0.9,              # optional
    frequency_penalty=0.1,  # optional
    presence_penalty=0.1,   # optional
    max_tokens=10,          # optional
    stop=["\n\n"],          # optional
)
print(response)
```

## 使用範例 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = completion(
    model="volcengine/<OUR_ENDPOINT_ID>",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today in Fahrenheit?",
        }
    ],
    stream=True,
    temperature=0.2,        # optional
    top_p=0.9,              # optional
    frequency_penalty=0.1,  # optional
    presence_penalty=0.1,   # optional
    max_tokens=10,          # optional
    stop=["\n\n"],          # optional
)

for chunk in response:
    print(chunk)
```

## 使用範例 - 嵌入 {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['VOLCENGINE_API_KEY'] = ""
response = embedding(
    model="volcengine/doubao-embedding-text-240715",
    input=["hello world", "good morning"]
)
print(response)
```

### 支援的嵌入模型 {#supported-embedding-models}
- `doubao-embedding-large`（2048 維）
- `doubao-embedding-large-text-250515`（2048 維）
- `doubao-embedding-large-text-240915`（4096 維）
- `doubao-embedding`（2560 維） 
- `doubao-embedding-text-240715`（2560 維）

### 嵌入參數 {#embedding-parameters}
```python
from litellm import embedding

response = embedding(
    model="volcengine/doubao-embedding-text-240715",
    input=["sample text"],
    encoding_format="float",  # optional: "float" (default), "base64"
    user="user-123",          # optional: user identifier for tracking
)
```

## 支援的模型 - 支援所有 Volcengine 模型！ {#supported-models---all-volcengine-models-supported}
我們支援所有 `volcengine` 模型，包含 chat completions 與 embeddings：
- **Chat 模型**：在送出 completion 請求時，將 `volcengine/<OUR_ENDPOINT_ID>` 設為前綴
- **Embedding 模型**：使用上方列出的特定模型名稱（例如：`volcengine/doubao-embedding-text-240715`）

## 使用範例 - LiteLLM Proxy {#sample-usage---litellm-proxy}

### Config.yaml 設定 {#configyaml-setting}

```yaml
model_list:
  # Chat model
  - model_name: volcengine-model
    litellm_params:
      model: volcengine/<OUR_ENDPOINT_ID>
      api_key: os.environ/VOLCENGINE_API_KEY
  # Embedding model
  - model_name: volcengine-embedding
    litellm_params:
      model: volcengine/doubao-embedding-text-240715
      api_key: os.environ/VOLCENGINE_API_KEY
```

### 送出請求 {#send-request}

#### 聊天完成 {#chat-completion}
```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "volcengine-model",
    "messages": [
        {
        "role": "user",
        "content": "here is my api key. openai_api_key=sk-<your-api-key>"
        }
    ]
}'
```

#### 嵌入 {#embedding}
```shell
curl --location 'http://localhost:4000/embeddings' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "volcengine-embedding",
    "input": ["hello world", "good morning"]
}'
```

## 影片生成 {#video-generation}

<SinceVersion v="1.108.0" />

Doubao-Seedance 模型在 Ark 的內容生成 API 上以非同步任務執行。`video_generation` 會立即回傳一個排隊中的影片 id，`video_status` 會回報 `queued`、`in_progress`、`completed`、`failed` 或 `cancelled`，而 `video_content` 會在任務成功後，從 Ark 回傳的簽名 URL 下載 mp4。在此之前下載會得到 400。

```python showLineNumbers title="Volcengine Video Generation"
import os
import time
from litellm import video_content, video_generation, video_status

os.environ["ARK_API_KEY"] = "your-api-key"

video = video_generation(
    model="volcengine/doubao-seedance-2-5-260628",
    prompt="A red fox running through fresh snow",
    seconds="4",
    size="854x480",
)

while video.status not in ("completed", "failed", "cancelled"):
    time.sleep(20)
    video = video_status(video_id=video.id)

if video.status == "completed":
    with open("video.mp4", "wb") as f:
        f.write(video_content(video_id=video.id))
```

這四個模型依解析度等級定價：

| 模型 | 解析度等級 |
|-------|------------------|
| `volcengine/doubao-seedance-2-5-260628` | 480p, 720p, 1080p |
| `volcengine/doubao-seedance-2-0-260128` | 480p, 720p, 1080p, 4k |
| `volcengine/doubao-seedance-2-0-fast-260128` | 480p, 720p |
| `volcengine/doubao-seedance-2-0-mini-260615` | 480p, 720p |

Ark 依解析度等級與比例渲染的是一個固定畫面，而不是您要求的像素，因此 `size` 挑選的是其 16:9 畫面像素數最接近的那個等級，其中 960x960 與 1280x720 都算 720p，比例則挑選最接近的 `16:9`、`9:16`、`4:3`、`3:4`、`1:1` 與 `21:9`，其中 854x480 是 16:9。有定價的模型在既沒有 `size` 也沒有 `resolution` 時以 720p 執行；而模型沒有定價的 `resolution`（例如 fast 等級的 1080p）會回傳 400，除非 `drop_params` 已開啟。輪詢會回報 Ark 將為所要求等級渲染的畫面。

Ark 在任務完成時才計費，LiteLLM 則在任務建立時就對影片計費，因此每次建立都帶有一個長度與一個等級，其成本在事前即已知。`seconds` 設定長度；省略 `seconds` 時會送出 OpenAI 的預設值 4 秒，而不是 Ark 自己的預設行為（由 Ark 為您挑選長度）；`seconds="-1"`，也就是 Ark 挑選的長度，會回傳 400。費用會在建立時依所傳送等級的每秒費率記錄。

`input_reference` 接受第一幀畫面，可以是 URL，或是 `Path`、已開啟的檔案、bytes 或 `(filename, file, content_type)` tuple（LiteLLM 會讀取並以 base64 data URL 內嵌），以及 OpenAI 的 `{"image_url": "..."}` 物件。純字串一律以 URL 形式送給 Ark 由其自行抓取，即使它看起來像本機路徑。在整段影片中都會保留的參考素材應改放 `content`，每個素材一個項目，並標明它在 Ark 中扮演的角色；呼叫端提供的 `content` 陣列優先於 `input_reference`。`ep-` 端點 id 本身沒有價格，因此會保留您送出的任何 `resolution`，並在部署設定了 `model_info.base_model` 時採用某個模型的等級。

以下請求會回傳 400，而不會送達 Ark：

- `content` 中的文字項目，因為 `prompt` 是輸入防護欄唯一會掃描的文字。請將文字移入 `prompt`，或傳入 `drop_params` 以照原樣送出
- 影片輸入，涵蓋編輯、延伸、remix 以及 `content` 中的 `reference_video` 項目，因為 Ark 對帶有影片輸入的任務以較低的每 token 費率計費，而該費率在建立時未知
- `frames`，因為 Ark 會依長度計算幀數
- `characters`、`image` 或任何其他 LiteLLM 不會送給 Ark 的欄位，除非 `drop_params` 已開啟

`user` 會以 Ark 的 `safety_identifier` 送出。影片呼叫會讀取 `VOLCENGINE_API_BASE` 或 `ARK_API_BASE`，並去除其中其他介面的路徑，因此同一個 base 可同時服務 chat、embedding 與影片。將 `api_base` 指向 `https://ark.ap-southeast.bytepluses.com/api/v3` 即可在 BytePlus ModelArk 上執行 `dreamina-*` id。這些 id 在成本對照表中沒有價格，因此在部署設定自己的價格或在 `model_info` 中設定 `base_model` 之前，會以 $0 計費並略過預算。

若要在 proxy 上提供這些模型，請加入一個部署並呼叫 `/v1/videos`：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: seedance
    litellm_params:
      model: volcengine/doubao-seedance-2-5-260628
      api_key: os.environ/ARK_API_KEY
```

```bash showLineNumbers title="Video generation via Proxy - cURL"
curl http://localhost:4000/v1/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "seedance",
    "prompt": "A red fox running through fresh snow",
    "seconds": "4",
    "size": "854x480"
  }'

curl http://localhost:4000/v1/videos/$VIDEO_ID \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl http://localhost:4000/v1/videos/$VIDEO_ID/content \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -o video.mp4
```

成本對照表將這些模型標記為 `video_generation`，因此對某個部署進行 proxy 健康檢查會建立一支真正的 4 秒影片，Ark 會對此計費。開啟 `background_health_checks` 時，請在該部署的 `model_info` 中設定 `disable_background_health_check: true`。

若要列出帳戶的任務，請呼叫 `litellm.video_list(custom_llm_provider="volcengine")`。Ark 以頁碼而非游標分頁，因此後續頁面來自 `extra_query={"page_num": N}`，且 `has_more` 永遠為 `false`。這份清單涵蓋 Ark 帳戶上的每個任務；在 proxy 上，`GET /v1/videos?custom_llm_provider=volcengine` 只提供第一頁。
