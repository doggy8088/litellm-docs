import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ElevenLabs {#elevenlabs}

ElevenLabs 提供高品質的 AI 語音技術，包括透過其轉錄 API 提供的語音轉文字功能。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | ElevenLabs 提供先進的 AI 語音技術，具備語音轉文字轉錄與文字轉語音功能，支援多種語言與說話者分離。 |
| LiteLLM 上的提供者路由 | `elevenlabs/` |
| 提供者文件 | [ElevenLabs API ↗](https://elevenlabs.io/docs/api-reference) |
| 支援的端點 | `/audio/transcriptions`, `/audio/speech` |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

```python showLineNumbers title="Basic audio transcription with ElevenLabs"
import litellm

# Transcribe audio file
with open("audio.mp3", "rb") as audio_file:
    response = litellm.transcription(
        model="elevenlabs/scribe_v1",
        file=audio_file,
        api_key="your-elevenlabs-api-key"  # or set ELEVENLABS_API_KEY env var
    )

print(response.text)
```

</TabItem>

<TabItem value="advanced" label="進階功能">

```python showLineNumbers title="Audio transcription with advanced features"
import litellm

# Transcribe with speaker diarization and language specification
with open("audio.wav", "rb") as audio_file:
    response = litellm.transcription(
        model="elevenlabs/scribe_v1",
        file=audio_file,
        language="en",           # Language hint (maps to language_code)
        temperature=0.3,         # Control randomness in transcription
        diarize=True,           # Enable speaker diarization
        api_key="your-elevenlabs-api-key"
    )

print(f"Transcription: {response.text}")
print(f"Language: {response.language}")

# Access word-level timestamps if available
if hasattr(response, 'words') and response.words:
    for word_info in response.words:
        print(f"Word: {word_info['word']}, Start: {word_info['start']}, End: {word_info['end']}")
```

</TabItem>

<TabItem value="async" label="非同步用法">

```python showLineNumbers title="Async audio transcription"
import litellm
import asyncio

async def transcribe_audio():
    with open("audio.mp3", "rb") as audio_file:
        response = await litellm.atranscription(
            model="elevenlabs/scribe_v1",
            file=audio_file,
            api_key="your-elevenlabs-api-key"
        )
    
    return response.text

# Run async transcription
result = asyncio.run(transcribe_audio())
print(result)
```

</TabItem>
</Tabs>

### LiteLLM Proxy {#litellm-proxy}

#### 1. 設定您的 proxy {#1-configure-your-proxy}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml showLineNumbers title="ElevenLabs configuration in config.yaml"
model_list:
  - model_name: elevenlabs-transcription
    litellm_params:
      model: elevenlabs/scribe_v1
      api_key: os.environ/ELEVENLABS_API_KEY

general_settings:
  master_key: your-master-key
```

</TabItem>

<TabItem value="env-vars" label="環境變數">

```bash showLineNumbers title="Required environment variables"
export ELEVENLABS_API_KEY="your-elevenlabs-api-key"
export LITELLM_MASTER_KEY="your-master-key"
```

</TabItem>
</Tabs>

#### 2. 啟動 proxy {#2-start-the-proxy}

```bash showLineNumbers title="Start LiteLLM proxy server"
litellm --config config.yaml

# Proxy will be available at http://localhost:4000
```

#### 3. 發出轉錄請求 {#3-make-transcription-requests}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Audio transcription with curl"
curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@audio.mp3" \
  -F model="elevenlabs-transcription" \
  -F language="en" \
  -F temperature="0.3"
```

</TabItem>

<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Using OpenAI SDK with LiteLLM proxy"
from openai import OpenAI

# Initialize client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

# Transcribe audio file
with open("audio.mp3", "rb") as audio_file:
    response = client.audio.transcriptions.create(
        model="elevenlabs-transcription",
        file=audio_file,
        language="en",
        temperature=0.3,
        # ElevenLabs-specific parameters
        diarize=True,
        speaker_boost=True,
        custom_vocabulary="technical,AI,machine learning"
    )

print(response.text)
```

</TabItem>

<TabItem value="javascript" label="JavaScript/Node.js">

```javascript showLineNumbers title="Audio transcription with JavaScript"
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  baseURL: 'http://localhost:4000',
  apiKey: 'your-litellm-api-key'
});

async function transcribeAudio() {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream('audio.mp3'),
    model: 'elevenlabs-transcription',
    language: 'en',
    temperature: 0.3,
    diarize: true,
    speaker_boost: true
  });

  console.log(response.text);
}

transcribeAudio();
```

</TabItem>
</Tabs>

## 回應格式 {#response-format}

ElevenLabs 會以 OpenAI 相容格式回傳轉錄回應：

```json showLineNumbers title="Example transcription response"
{
  "text": "Hello, this is a sample transcription with multiple speakers.",
  "task": "transcribe",
  "language": "en",
  "words": [
    {
      "word": "Hello",
      "start": 0.0,
      "end": 0.5
    },
    {
      "word": "this",
      "start": 0.5,
      "end": 0.8
    }
  ]
}
```

### 常見問題 {#common-issues}

1. **無效的 API 金鑰**：請確保 `ELEVENLABS_API_KEY` 已正確設定

---

## 文字轉語音（TTS） {#text-to-speech-tts}

ElevenLabs 透過其 TTS API 提供高品質的文字轉語音功能，支援多種聲音、語言與音訊格式。

### 概覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | 使用 ElevenLabs 的進階 TTS 模型將文字轉換為自然發聲的語音 |
| LiteLLM 上的提供者路由 | `elevenlabs/` |
| 支援的操作 | `/audio/speech` |
| 提供者文件連結 | [ElevenLabs TTS API ↗](https://elevenlabs.io/docs/api-reference/text-to-speech) |

### 支援的模型 {#supported-models}

| 模型 | 路由 | 說明 |
|-------|-------|-------------|
| Eleven v3 | `elevenlabs/eleven_v3` | 最具表現力的模型。支援 70+ 種語言，並可透過 audio tags 支援音效與停頓。 |
| Eleven Multilingual v2 | `elevenlabs/eleven_multilingual_v2` | 預設 TTS 模型。支援 29 種語言，穩定且可用於正式環境。 |

### 快速開始 {#quick-start-1}

#### LiteLLM Python SDK {#litellm-python-sdk-1}

```python showLineNumbers title="ElevenLabs Text-to-Speech with SDK"
import litellm
import os

os.environ["ELEVENLABS_API_KEY"] = "your-elevenlabs-api-key"

# Basic usage with voice mapping
audio = litellm.speech(
    model="elevenlabs/eleven_multilingual_v2",
    input="Testing ElevenLabs speech from LiteLLM.",
    voice="alloy",  # Maps to ElevenLabs voice ID automatically
)

# Save audio to file
with open("test_output.mp3", "wb") as f:
    f.write(audio.read())
```

#### 使用帶有 Audio Tags 的 Eleven v3 {#using-eleven-v3-with-audio-tags}

Eleven v3 支援 [audio tags](https://elevenlabs.io/docs/overview/capabilities/text-to-speech#audio-tags)，可直接在文字中加入音效與停頓：

```python showLineNumbers title="Eleven v3 with audio tags"
import litellm
import os

os.environ["ELEVENLABS_API_KEY"] = "your-elevenlabs-api-key"

audio = litellm.speech(
    model="elevenlabs/eleven_v3",
    input='Welcome back. <sfx>applause</sfx> Today we have a special guest. <pause duration="1.5s"/> Let me introduce them.',
    voice="alloy",
)

with open("eleven_v3_output.mp3", "wb") as f:
    f.write(audio.read())
```

#### 進階用法：覆寫參數與 ElevenLabs 專屬功能 {#advanced-usage-overriding-parameters-and-elevenlabs-specific-features}

```python showLineNumbers title="Advanced TTS with custom parameters"
import litellm
import os

os.environ["ELEVENLABS_API_KEY"] = "your-elevenlabs-api-key"

# Example showing parameter overriding and ElevenLabs-specific parameters
audio = litellm.speech(
    model="elevenlabs/eleven_multilingual_v2",
    input="Testing ElevenLabs speech from LiteLLM.",
    voice="alloy",  # Can use mapped voice name or raw ElevenLabs voice_id
    response_format="pcm",  # Maps to ElevenLabs output_format
    speed=1.1,  # Maps to voice_settings.speed
    # ElevenLabs-specific parameters - passed directly to API
    pronunciation_dictionary_locators=[
        {"pronunciation_dictionary_id": "dict_123", "version_id": "v1"}
    ],
    model_id="eleven_multilingual_v2",  # Override model if needed
)

# Save audio to file
with open("test_output.mp3", "wb") as f:
    f.write(audio.read())
```

### 聲音對應 {#voice-mapping}

LiteLLM 會自動將常見的 OpenAI 聲音名稱對應到 ElevenLabs 的聲音 ID：

| OpenAI 聲音 | ElevenLabs 聲音 ID | 說明 |
|--------------|---------------------|-------------|
| `alloy` | `21m00Tcm4TlvDq8ikWAM` | Rachel - 中性且平衡 |
| `amber` | `5Q0t7uMcjvnagumLfvZi` | Paul - 溫暖且友善 |
| `ash` | `AZnzlk1XvdvUeBnXmlld` | Domi - 有活力 |
| `august` | `D38z5RcWu1voky8WS1ja` | Fin - 專業 |
| `blue` | `2EiwWnXFnvU5JabPnv8n` | Clyde - 深沉且權威 |
| `coral` | `9BWtsMINqrJLrRacOk9x` | Aria - 富有表現力 |
| `lily` | `EXAVITQu4vr4xnSDxMaL` | Sarah - 友善 |
| `onyx` | `29vD33N1CtxCmqQRPOHJ` | Drew - 強而有力 |
| `sage` | `CwhRBWXzGAHq8TQ4Fs17` | Roger - 平靜 |
| `verse` | `CYw3kZ02Hs0563khs1Fj` | Dave - 對話式 |

**使用自訂聲音 ID**：您也可以直接傳入任何 ElevenLabs 的聲音 ID。如果聲音名稱不在對應表中，LiteLLM 會原樣使用：

```python showLineNumbers title="Using custom ElevenLabs voice ID"
audio = litellm.speech(
    model="elevenlabs/eleven_multilingual_v2",
    input="Testing with a custom voice.",
    voice="21m00Tcm4TlvDq8ikWAM",  # Direct ElevenLabs voice ID
)
```

### 回應格式對應 {#response-format-mapping}

LiteLLM 會將 OpenAI 的回應格式對應到 ElevenLabs 的輸出格式：

| OpenAI 格式 | ElevenLabs 格式 |
|---------------|-------------------|
| `mp3` | `mp3_44100_128` |
| `pcm` | `pcm_44100` |
| `opus` | `opus_48000_128` |

您也可以直接使用 `output_format` 參數傳入 ElevenLabs 專屬的輸出格式。

### 支援的參數 {#supported-parameters}

```python showLineNumbers title="All Supported Parameters"
audio = litellm.speech(
    model="elevenlabs/eleven_multilingual_v2",  # Required
    input="Text to convert to speech",           # Required
    voice="alloy",                               # Required: Voice selection (mapped or raw ID)
    response_format="mp3",                      # Optional: Audio format (mp3, pcm, opus)
    speed=1.0,                                  # Optional: Speech speed (maps to voice_settings.speed)
    # ElevenLabs-specific parameters (passed directly):
    model_id="eleven_multilingual_v2",           # Optional: Override model
    voice_settings={                             # Optional: Voice customization
        "stability": 0.5,
        "similarity_boost": 0.75,
        "speed": 1.0
    },
    pronunciation_dictionary_locators=[         # Optional: Custom pronunciation
           {"pronunciation_dictionary_id": "dict_123", "version_id": "v1"}
    ],
)
```

### LiteLLM Proxy {#litellm-proxy-1}

#### 1. 設定您的 proxy {#1-configure-your-proxy-1}

```yaml showLineNumbers title="ElevenLabs TTS configuration in config.yaml"
model_list:
  - model_name: elevenlabs-tts
    litellm_params:
      model: elevenlabs/eleven_multilingual_v2
      api_key: os.environ/ELEVENLABS_API_KEY

general_settings:
  master_key: your-master-key
```

#### 2. 發出 TTS 請求 {#2-make-tts-requests}

##### 簡單用法（OpenAI 參數） {#simple-usage-openai-parameters}

您可以使用標準的 OpenAI 相容參數，而無需任何提供者專屬設定：

```bash showLineNumbers title="Simple TTS request with curl"
curl http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "elevenlabs-tts",
    "input": "Testing ElevenLabs speech via the LiteLLM proxy.",
    "voice": "alloy",
    "response_format": "mp3"
  }' \
  --output speech.mp3
```

```python showLineNumbers title="Simple TTS with OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

response = client.audio.speech.create(
    model="elevenlabs-tts",
    input="Testing ElevenLabs speech via the LiteLLM proxy.",
    voice="alloy",
    response_format="mp3"
)

# Save audio
with open("speech.mp3", "wb") as f:
    f.write(response.content)
```

##### 進階用法（ElevenLabs 專屬參數） {#advanced-usage-elevenlabs-specific-parameters}

**注意**：使用 proxy 時，提供者專屬參數（例如 `pronunciation_dictionary_locators`、`voice_settings` 等）必須傳入 `extra_body` 欄位。

```bash showLineNumbers title="Advanced TTS request with curl"
curl http://localhost:4000/v1/audio/speech \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "elevenlabs-tts",
    "input": "Testing ElevenLabs speech via the LiteLLM proxy.",
    "voice": "alloy",
    "response_format": "pcm",
    "extra_body": {
      "pronunciation_dictionary_locators": [
          {"pronunciation_dictionary_id": "dict_123", "version_id": "v1"}
      ],
      "voice_settings": {
        "speed": 1.1,
        "stability": 0.5,
        "similarity_boost": 0.75
      }
    }
  }' \
  --output speech.mp3
```

```python showLineNumbers title="Advanced TTS with OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

response = client.audio.speech.create(
    model="elevenlabs-tts",
    input="Testing ElevenLabs speech via the LiteLLM proxy.",
    voice="alloy",
    response_format="pcm",
    extra_body={
        "pronunciation_dictionary_locators": [
               {"pronunciation_dictionary_id": "dict_123", "version_id": "v1"}
        ],
        "voice_settings": {
            "speed": 1.1,
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
)

# Save audio
with open("speech.mp3", "wb") as f:
    f.write(response.content)
```
