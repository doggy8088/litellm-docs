import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Deepgram {#deepgram}

LiteLLM 支援 Deepgram 的 `/listen` 端點。

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Deepgram 的語音 AI 平台提供語音轉文字、文字轉語音，以及語言理解的 API。 |
| LiteLLM 上的提供者路由 | `deepgram/` |
| 提供者文件 | [Deepgram ↗](https://developers.deepgram.com/docs/introduction) |
| 支援的 OpenAI 端點 | `/audio/transcriptions` |

## 快速開始 {#quick-start}

```python
from litellm import transcription
import os 

# set api keys 
os.environ["DEEPGRAM_API_KEY"] = ""
audio_file = open("/path/to/audio.mp3", "rb")

response = transcription(model="deepgram/nova-2", file=audio_file)

print(f"response: {response}")
```

## LiteLLM Proxy 使用方式 {#litellm-proxy-usage}

### 將模型加入設定  {#add-model-to-config}

1. 將模型加入 config.yaml

```yaml
model_list:
- model_name: nova-2
  litellm_params:
    model: deepgram/nova-2
    api_key: os.environ/DEEPGRAM_API_KEY
  model_info:
    mode: audio_transcription
    
general_settings:
  master_key: sk-1234
```

### 啟動 proxy  {#start-proxy}

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

### 測試 {#test}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
--header 'Authorization: Bearer sk-1234' \
--form 'file=@"/Users/krrishdholakia/Downloads/gettysburg.wav"' \
--form 'model="nova-2"'
```

</TabItem>
<TabItem value="openai" label="OpenAI">

```python
from openai import OpenAI
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)


audio_file = open("speech.mp3", "rb")
transcript = client.audio.transcriptions.create(
  model="nova-2",
  file=audio_file
)
```
</TabItem>
</Tabs>
