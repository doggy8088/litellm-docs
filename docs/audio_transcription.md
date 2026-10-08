import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /audio/transcriptions {#audiotranscriptions}

## 總覽  {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 可與所有支援的模型搭配運作 |
| 記錄 | ✅ | 可跨所有整合搭配運作 |
| 終端使用者追蹤 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 防護欄 | ✅ | 套用至輸出的轉錄文字（僅限非串流） |
| 支援的提供者 | `openai`, `azure`, `vertex_ai`, `gemini`, `deepgram`, `groq`, `fireworks_ai`, `ovhcloud`, `mistral` | |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Python SDK Example"
from litellm import transcription
import os 

# set api keys 
os.environ["OPENAI_API_KEY"] = ""
audio_file = open("/path/to/audio.mp3", "rb")

response = transcription(model="whisper", file=audio_file)

print(f"response: {response}")
```

### LiteLLM Proxy {#litellm-proxy}

### 將模型加入設定  {#add-model-to-config}

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml showLineNumbers title="OpenAI Configuration"
model_list:
- model_name: whisper
  litellm_params:
    model: whisper-1
    api_key: os.environ/OPENAI_API_KEY
  model_info:
    mode: audio_transcription
    
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```
</TabItem>
<TabItem value="openai+azure" label="OpenAI + Azure">

```yaml showLineNumbers title="OpenAI + Azure Configuration"
model_list:
- model_name: whisper
  litellm_params:
    model: whisper-1
    api_key: os.environ/OPENAI_API_KEY
  model_info:
    mode: audio_transcription
- model_name: whisper
  litellm_params:
    model: azure/azure-whisper
    api_version: 2024-02-15-preview
    api_base: os.environ/AZURE_EUROPE_API_BASE
    api_key: os.environ/AZURE_EUROPE_API_KEY
  model_info:
    mode: audio_transcription

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

</TabItem>
</Tabs>

### 啟動 Proxy  {#start-proxy}

```bash showLineNumbers title="Start Proxy Server"
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

### 測試  {#test}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Test with cURL"
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--form 'file=@"/Users/krrishdholakia/Downloads/gettysburg.wav"' \
--form 'model="whisper"'
```

</TabItem>
<TabItem value="openai" label="OpenAI Python SDK">

```python showLineNumbers title="Test with OpenAI Python SDK"
from openai import OpenAI
client = openai.OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)


audio_file = open("speech.mp3", "rb")
transcript = client.audio.transcriptions.create(
  model="whisper",
  file=audio_file
)
```
</TabItem>
</Tabs>

## 支援的提供者 {#supported-providers}

- OpenAI
- Azure
- [Fireworks AI](./providers/fireworks_ai.md#audio-transcription)
- [Groq](./providers/groq.md#speech-to-text---whisper)
- [Deepgram](./providers/deepgram.md)
- [Google AI Studio (Gemini)](./providers/gemini.md#audio-transcription-speech-to-text)
- [Mistral (Voxtral)](./providers/mistral.md#audio-transcription)
- [OVHcloud AI Endpoints](./providers/ovhcloud.md)

---

## 備援 {#fallbacks}

您可以為音訊轉錄設定備援，讓系統在主要模型失敗時自動改用不同模型重試。

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Test with cURL and Fallbacks"
curl --location 'http://0.0.0.0:4000/v1/audio/transcriptions' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--form 'file=@"gettysburg.wav"' \
--form 'model="groq/whisper-large-v3"' \
--form 'fallbacks[]="openai/whisper-1"'
```

</TabItem>
<TabItem value="openai" label="OpenAI Python SDK">

```python showLineNumbers title="Test with OpenAI Python SDK and Fallbacks"
from openai import OpenAI
client = OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://0.0.0.0:4000"
)

audio_file = open("gettysburg.wav", "rb")
transcript = client.audio.transcriptions.create(
    model="groq/whisper-large-v3",
    file=audio_file,
    extra_body={
        "fallbacks": ["openai/whisper-1"]
    }
)
```
</TabItem>
</Tabs>

### 測試備援 {#testing-fallbacks}

:::warning[Proxy 請求已棄用]
自 LiteLLM Proxy v1.85.0 起，`mock_testing_fallbacks` 會從傳入的 Proxy 請求中移除，且不再產生任何影響。它僅仍支援用於測試中的直接 `litellm.Router` 呼叫。
:::

若要透過 Proxy 驗證音訊轉錄備援，請在非正式環境中觸發實際的提供者錯誤，並以備援設定送出一般請求。
