import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Eden AI {#eden-ai}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| Description | Eden AI 是一個 AI 閘道：只要一組 API 金鑰和一張帳單，即可使用來自 30+ 個提供者的 1000+ 個 LLM（OpenAI、Anthropic、Google、Mistral、DeepSeek、xAI、Amazon Bedrock、Azure 等），且每個請求的實際成本都會在回應中回報。 |
| LiteLLM 上的提供者路由 | `edenai/` |
| 提供者文件連結 | [Eden AI 文件 ↗](https://www.edenai.co/docs) |
| 基礎 URL | `https://api.edenai.run/v3` |
| 支援的操作 | [`/chat/completions`](#usage---litellm-python-sdk), [`/responses`](#usage---responses-api), [`/v1/messages`](#usage---anthropic-messages-api), [`/embeddings`](#usage---embeddings), [`/audio/transcriptions`](#usage---audio-transcription-and-speech), [`/audio/speech`](#usage---audio-transcription-and-speech), [`/images/generations`](#usage---image-generation), [`/videos`](#usage---video-generation) |

<br />
<br />

https://www.edenai.co/docs

**我們支援所有 Eden AI 聊天模型，只要在送出 completion 請求時將 `edenai/` 作為前綴即可**

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key
```

金鑰是在 Eden AI 儀表板的 https://app.edenai.run 下的 Settings、API Keys 中建立。

## 選用變數 {#optional-variables}

```python showLineNumbers title="Environment Variables"
os.environ["EDENAI_API_BASE"] = "https://api.eu.edenai.run/v3"  # EU endpoint, same key. Default is https://api.edenai.run/v3
```

EU 端點接受相同的 API 金鑰，但只提供託管於 EU 的目錄子集，因此在預設主機上可用的模型 id（包括本頁的 `openai/gpt-mini-latest` 和 `anthropic/claude-sonnet-latest` 範例）在那裡可能不存在。切換之前，請先查看 https://api.eu.edenai.run/v3/models 以確認 EU 主機提供的 id。

## 模型名稱 {#model-names}

Eden AI 的 model ids 為 `provider/model`，例如 `openai/gpt-mini-latest`、`anthropic/claude-sonnet-latest` 或 `google/gemini-3.7-flash`。加入 `edenai/` 前綴後，LiteLLM 只會移除該前綴，因此 `edenai/openai/gpt-mini-latest` 會以 `openai/gpt-mini-latest` 傳送到 Eden AI。單純的模型名稱（例如 `edenai/mistral-small-latest`）也可以：此時 Eden AI 會選擇提供該模型的賣方（提供者路由）。Eden AI 自己的穩定別名，也就是帶有 `alias_of` 的目錄項目，例如 `openai/gpt-mini-latest`，只有在加上其供應商前綴時才會解析。地區變體會保留其後綴，如 `edenai/vertex/gemini-3.7-flash@eu`。

目錄可公開取得於 [https://app.edenai.run/models](https://app.edenai.run/models)。從 LiteLLM 來看，`litellm.get_valid_models(custom_llm_provider="edenai", check_provider_endpoint=True)` 會回傳套用 `edenai/` 前綴後的相同清單。

## 透過單一部署路由所有 Eden AI 模型 {#route-every-eden-ai-model-through-one-deployment}

代理可透過萬用字元部署公開整個目錄。啟用 `check_provider_endpoint` 後，`/v1/models` 會在 `edenai/` 前綴下列出來自 `https://api.edenai.run/v3/models` 的所有模型，而對其中任何一個模型的請求，例如 `edenai/mistral/mistral-small-latest`，都會經由此部署路由。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: edenai/*
    litellm_params:
      model: edenai/*
      api_key: os.environ/EDENAI_API_KEY

litellm_settings:
  check_provider_endpoint: true
```

## 成本追蹤 {#cost-tracking}

每個 Eden AI 回應都會回報該請求的 USD 成本，並已計入任何帳戶折扣；LiteLLM 會將該數字記錄為該請求的支出，而不是價格映射估算。對於 chat completion 串流，成本會在最後的 usage 區塊到達。LiteLLM 一律會向 Eden AI 索取該區塊，且只有在您設定 `stream_options={"include_usage": True}` 時才會將其轉發給您的用戶端，因此串流用戶端會看到與其預期完全一致的 OpenAI 行為。

| 端點 | 非串流 | 串流 |
|-------|-------|-------|
| `/chat/completions` | Eden AI 的 `cost` | Eden AI 的 `cost`，來自最後的 usage 區塊 |
| `/responses` | Eden AI 的 `cost` | Eden AI 的 `cost`，來自 `usage.cost`，位於 `response.completed` 事件上 |
| `/v1/messages` | Eden AI 的 `cost` | 價格映射估算，除非您註冊模型價格，否則為 0：Eden AI 不會在 Messages 串流中回報成本 |
| `/embeddings` | Eden AI 的 `cost` | 不串流 |
| `/audio/transcriptions` | Eden AI 的 `cost`，適用於 JSON 格式；對於 `text`、`srt` 和 `vtt`，則是根據片段持續時間得出的價格映射估算，而 Eden AI 會在沒有成本的情況下回傳這些格式 | 不串流 |
| `/audio/speech` | Eden AI 的 `cost`，來自 `x-edenai-cost` 回應標頭 | 不串流 |
| `/images/generations` | Eden AI 的 `cost` | 不串流 |
| `/videos` | create 呼叫時為 0，這是 Eden AI 在工作佇列中時回報的值；工作完成後，結算後的成本會出現在工作狀態中，形式為 `usage.provider_reported_cost_usd`。若要改為在 create 呼叫時即按估算金額計費，請註冊模型的每秒價格 | 不串流 |

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Eden AI Non-streaming Completion"
import os
from litellm import completion

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(
    model="edenai/openai/gpt-mini-latest",
    messages=messages,
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Eden AI Streaming Completion"
import os
from litellm import completion

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

messages = [{"content": "Write a short story about AI", "role": "user"}]

response = completion(
    model="edenai/anthropic/claude-sonnet-latest",
    messages=messages,
    stream=True,
    stream_options={"include_usage": True},
)

for chunk in response:
    print(chunk)
```

### Eden AI 參數：備援與路由 {#eden-ai-parameters-fallbacks-and-routing}

Eden AI 除了 OpenAI 的欄位集合之外，還接受幾個欄位。`fallbacks` 會在主要模型失敗時依序列出最多三個 `provider/model` id 供嘗試，而 `routing` 則用來為單純模型名稱引導提供者路由（`sort` 為 `cost`、`speed`、`latency` 或 `exact`，且 `allowed_providers` 會限制賣方）。請透過 `extra_body` 傳遞它們：

```python showLineNumbers title="Eden AI fallbacks and routing"
import os
from litellm import completion

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

response = completion(
    model="edenai/gpt-5-mini",
    messages=[{"content": "Hello, how are you?", "role": "user"}],
    extra_body={
        "fallbacks": ["anthropic/claude-sonnet-latest"],
        "routing": {"sort": "latency", "allowed_providers": ["openai", "azure"]},
    },
)

print(response)
```

## 使用方式 - Responses API {#usage---responses-api}

Eden AI 為其目錄中的每個模型在 `/v3/responses` 提供 OpenAI 的 Responses API，LiteLLM 則會原生將 `litellm.responses` 和代理的 `/v1/responses` 路由至此，而不是透過 chat completions 來模擬。具狀態功能（`previous_response_id`、`store`、擷取或刪除回應）只有在賣方原生支援 Responses API 時才能運作，而目前這表示 OpenAI 模型；其他賣方會以無狀態方式回應。

```python showLineNumbers title="Eden AI Responses API"
import os
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

response = litellm.responses(
    model="edenai/openai/gpt-mini-latest",
    input="Hello, how are you?",
    max_output_tokens=200,
)

print(response.output_text)

stream = litellm.responses(
    model="edenai/anthropic/claude-sonnet-latest",
    input="Write a short story about AI",
    stream=True,
)

for event in stream:
    print(event)
```

`fallbacks` 和 `routing` 在這裡也會經由 `extra_body`。

## 使用方式 - Anthropic Messages API {#usage---anthropic-messages-api}

Eden AI 為其目錄中的每個模型（包括 OpenAI 和 Google 模型）在 `/v3/v1/messages` 提供 Anthropic 的 Messages API，而 LiteLLM 會將 `litellm.anthropic.messages` 請求和代理的 `/v1/messages` 原樣轉送至該處，因此 `system` 區塊以及 `cache_control`、`thinking` 和工具結果都會與您的用戶端送出時完全一致地送達 Eden AI。Eden AI 的 `fallbacks` 和 `routing` 欄位不能透過這條路由送出。

```python showLineNumbers title="Eden AI Anthropic Messages API"
import os
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

response = await litellm.anthropic.messages.acreate(
    model="edenai/anthropic/claude-sonnet-latest",
    max_tokens=200,
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response["content"][0]["text"])
```

## 使用方式 - Embeddings {#usage---embeddings}

Eden AI 為其目錄中的每個 embedding 模型（OpenAI、Google、Cohere、Mistral、Amazon 等）在 `/v3/embeddings` 提供 OpenAI 的 embeddings API。`dimensions`、`encoding_format` 和 `user` 會原樣通過；Eden AI 自己的欄位，例如 `metadata`，則會透過 `extra_body` 通過。

```python showLineNumbers title="Eden AI Embeddings"
import os
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

response = litellm.embedding(
    model="edenai/openai/text-embedding-3-small",
    input=["Hello, how are you?", "Fine, thanks"],
    dimensions=256,
)

print(len(response.data[0]["embedding"]))
print(response._hidden_params["response_cost"])  # the cost Eden AI reported
```

## 使用方式 - Audio（轉錄與語音） {#usage---audio-transcription-and-speech}

Eden AI 在 `/v3/audio/transcriptions` 提供 OpenAI 的語音轉文字 API，並在 `/v3/audio/speech` 提供文字轉語音 API。轉錄需要一般的 multipart 上傳以及 `language`、`prompt`、`response_format`、`temperature` 和 `timestamp_granularities`；語音則需要 `voice`、`response_format`、`speed` 和 `instructions`。兩者都會回報 Eden AI 的成本：轉錄在 body 中，語音則在 `x-edenai-cost` 回應標頭中，因為 body 本身就是音訊。

```python showLineNumbers title="Eden AI Audio"
import os
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

speech = litellm.speech(
    model="edenai/openai/tts-1",
    input="Hello, how are you?",
    voice="alloy",
    response_format="mp3",
)
speech.stream_to_file("hello.mp3")

with open("hello.mp3", "rb") as audio:
    transcript = litellm.transcription(
        model="edenai/openai/whisper-1",
        file=audio,
        language="en",
    )

print(transcript.text)
```

## 使用方式 - Image Generation {#usage---image-generation}

Eden AI 透過 `/v3/images/generations` 提供 OpenAI 的圖片生成 API，適用於其目錄中的每一個圖片模型（OpenAI、Google、Amazon、Stability 等更多）。圖片會根據供應商以 `b64_json` 或託管的 `url` 形式回傳，並在回應中帶有 Eden AI 的成本。

```python showLineNumbers title="Eden AI Image Generation"
import base64
import os
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

response = litellm.image_generation(
    model="edenai/openai/gpt-image-1-mini",
    prompt="A watercolor lighthouse at dawn",
    size="1024x1024",
    quality="low",
)

image = response.data[0]
if image.b64_json:
    with open("lighthouse.png", "wb") as f:
        f.write(base64.b64decode(image.b64_json))
else:
    print(image.url)
```

## 用法 - 影片生成 {#usage---video-generation}

Eden AI 透過 `/v3/videos` 提供 OpenAI 的影片 API，適用於其目錄中的每一個影片模型（OpenAI、Google、Amazon、MiniMax、Pixverse 等更多）。工作會建立、輪詢並透過 LiteLLM 的影片函式下載；LiteLLM 回傳的 id 會自行將後續請求路由回 Eden AI。`seconds` 和 `size` 會原樣通過，參考圖片會透過 `input_reference` 以檔案或 `{"image_url": ...}` / `{"file_id": ...}` 形式通過，而 Eden AI 自己的 `seed`、`provider_params`、`webhook_receiver` 和 `user_webhook_parameters` 會直接傳遞給 Eden AI 進行驗證。OpenAI 的 `characters` 和 `user` 也會一併轉送，而在 Eden AI 支援之前，對這些項目會回應 422。

```python showLineNumbers title="Eden AI Video Generation"
import os
import time
import litellm

os.environ["EDENAI_API_KEY"] = ""  # your Eden AI API key

job = litellm.video_generation(
    model="edenai/pruna/p-video",
    prompt="A red ball rolling across a wooden table",
    seconds="4",
    size="1280x720",
)

while job.status not in ("completed", "failed"):
    time.sleep(5)
    job = litellm.video_status(video_id=job.id)

print(job.status, job.usage)  # usage carries Eden AI's settled cost as provider_reported_cost_usd
with open("ball.mp4", "wb") as f:
    f.write(litellm.video_content(video_id=job.id))
```

## 用法 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-mini-latest
    litellm_params:
      model: edenai/openai/gpt-mini-latest
      api_key: os.environ/EDENAI_API_KEY
  - model_name: claude-sonnet
    litellm_params:
      model: edenai/anthropic/claude-sonnet-latest
      api_key: os.environ/EDENAI_API_KEY
  - model_name: gemini-flash-eu
    litellm_params:
      model: edenai/vertex/gemini-3.7-flash
      api_key: os.environ/EDENAI_API_KEY
      api_base: https://api.eu.edenai.run/v3
  - model_name: text-embedding-3-small
    litellm_params:
      model: edenai/openai/text-embedding-3-small
      api_key: os.environ/EDENAI_API_KEY
  - model_name: whisper-1
    litellm_params:
      model: edenai/openai/whisper-1
      api_key: os.environ/EDENAI_API_KEY
  - model_name: tts-1
    litellm_params:
      model: edenai/openai/tts-1
      api_key: os.environ/EDENAI_API_KEY
  - model_name: gpt-image-1-mini
    litellm_params:
      model: edenai/openai/gpt-image-1-mini
      api_key: os.environ/EDENAI_API_KEY
  - model_name: p-video
    litellm_params:
      model: edenai/pruna/p-video
      api_key: os.environ/EDENAI_API_KEY
```

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Eden AI via Proxy"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key",      # Your proxy API key
)

response = client.chat.completions.create(
    model="gpt-mini-latest",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Eden AI via Proxy - LiteLLM SDK"
import litellm

response = litellm.completion(
    model="litellm_proxy/gpt-mini-latest",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key",
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Eden AI via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "gpt-mini-latest",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
</Tabs>

Proxy 的 `x-litellm-response-cost` 回應標頭與支出記錄會帶有 Eden AI 針對該請求回報的成本。

相同的部署同時提供 `/v1/responses` 和 `/v1/messages`：

```bash showLineNumbers title="Eden AI via Proxy - Responses API"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "gpt-mini-latest",
    "input": "Hello, how are you?"
  }'
```

```bash showLineNumbers title="Eden AI via Proxy - Anthropic Messages API"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-proxy-api-key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet",
    "max_tokens": 200,
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

嵌入、音訊和圖片的運作方式相同，使用 OpenAI 路由：

```bash showLineNumbers title="Eden AI via Proxy - Embeddings, Audio, Images"
curl http://localhost:4000/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{"model": "text-embedding-3-small", "input": "Hello, how are you?"}'

curl http://localhost:4000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{"model": "tts-1", "input": "Hello, how are you?", "voice": "alloy"}' \
  --output hello.mp3

curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer your-proxy-api-key" \
  -F model=whisper-1 \
  -F file=@hello.mp3

curl http://localhost:4000/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{"model": "gpt-image-1-mini", "prompt": "A watercolor lighthouse at dawn", "size": "1024x1024", "quality": "low"}'
```

影片工作使用 OpenAI 影片路由：在 `/v1/videos` 建立，在 `/v1/videos/{id}` 輪詢直到 `status` 為 `completed`，然後下載 `/v1/videos/{id}/content`：

```bash showLineNumbers title="Eden AI via Proxy - Videos"
curl http://localhost:4000/v1/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{"model": "p-video", "prompt": "A red ball rolling across a wooden table", "seconds": "4", "size": "1280x720"}'

curl http://localhost:4000/v1/videos/<id from the create response> \
  -H "Authorization: Bearer your-proxy-api-key"

curl http://localhost:4000/v1/videos/<id from the create response>/content \
  -H "Authorization: Bearer your-proxy-api-key" \
  --output ball.mp4
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Eden AI 接受完整的 OpenAI chat completions 參數集合：`temperature`、`top_p`、`max_tokens`、`max_completion_tokens`、`n`、`stop`、`seed`、`stream`、`stream_options`、`tools`、`tool_choice`、`parallel_tool_calls`、`response_format`、`reasoning_effort`、`logprobs`、`top_logprobs`、`frequency_penalty`、`presence_penalty`、`logit_bias`、`web_search_options`、`modalities`、`audio`、`prediction` 和 `service_tier`。特定提供者的參數會透過 `extra_body` 傳遞，而 Eden AI 會將其傳給底層提供者。
