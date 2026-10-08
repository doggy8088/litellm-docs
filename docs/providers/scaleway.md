# Scaleway {#scaleway}
LiteLLM 支援 Scaleway Generative APIs 上所有可用的 [模型 ↗](https://www.scaleway.com/en/docs/generative-apis/reference-content/supported-models/)。 

## 與 LiteLLM Python SDK 搭配使用 {#usage-with-litellm-python-sdk}

```python
import os
from litellm import completion 

os.environ["SCW_SECRET_KEY"] = "your-scaleway-secret-key"

messages = [{"role": "user", "content": "Write a short poem"}]
response = completion(model="scaleway/qwen3-235b-a22b-instruct-2507", messages=messages)
print(response)
```

## 與 LiteLLM Proxy 搭配使用  {#usage-with-litellm-proxy}

### 1. 在 config.yaml 中設定 Scaleway 模型 {#1-set-scaleway-models-in-configyaml}

```yaml
model_list:
  - model_name: scaleway-model
    litellm_params:
      model: scaleway/qwen3-235b-a22b-instruct-2507
      api_key: "os.environ/SCW_SECRET_KEY" # ensure you have `SCW_SECRET_KEY` in your .env
```

### 2. 啟動 proxy  {#2-start-proxy}

```bash
litellm --config config.yaml
```

### 3. 查詢 proxy  {#3-query-proxy}

假設 proxy 正在 [http://localhost:4000](http://localhost:4000) 上執行：
```bash
curl http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LITELLM_MASTER_KEY" \
  -d '{
    "model": "scaleway-model",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Write a short poem"
      }
    ]
  }'
```
`-H "Authorization: Bearer YOUR_LITELLM_MASTER_KEY" ` 僅在您已設定 LiteLLM master key 時才需要

## 支援的功能 {#supported-features}

Scaleway 提供者支援 [Generative APIs 參考文件 ↗](https://www.scaleway.com/en/developers/api/generative-apis/) 中的所有功能，例如串流、結構化輸出和工具呼叫。

## 音訊轉錄 {#audio-transcription}

Scaleway 的 `/audio/transcriptions` 端點與 OpenAI 相容，並可搭配 Whisper 模型使用。

### Python SDK {#python-sdk}

```python
import os
from litellm import transcription

os.environ["SCW_SECRET_KEY"] = "your-scaleway-secret-key"

with open("speech.mp3", "rb") as audio_file:
    response = transcription(
        model="scaleway/whisper-large-v3",
        file=audio_file,
    )
print(response.text)
```

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: scaleway-whisper
    litellm_params:
      model: scaleway/whisper-large-v3
      api_key: "os.environ/SCW_SECRET_KEY"
```

### Proxy 請求 {#proxy-request}

```bash
curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer YOUR_LITELLM_MASTER_KEY" \
  -F model="scaleway-whisper" \
  -F file="@speech.mp3"
```

支援的選用參數：`language`、`prompt`、`response_format`、`temperature`、`timestamp_granularities`。
