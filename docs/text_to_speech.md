import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /audio/speech {#audiospeech}

## 總覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 可與所有支援的模型搭配使用 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 端使用者追蹤 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 防護欄 | ✅ | 套用於輸入文字（僅限非串流） |
| 支援的提供者 | OpenAI, Azure OpenAI, Vertex AI, AWS Polly, ElevenLabs , MiniMax |

## **LiteLLM Python SDK 使用方式** {#litellm-python-sdk-usage}
### 快速開始  {#quick-start}

```python
from pathlib import Path
from litellm import speech
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

speech_file_path = Path(__file__).parent / "speech.mp3"
response = speech(
        model="openai/tts-1",
        voice="alloy",
        input="the quick brown fox jumped over the lazy dogs",
    )
response.stream_to_file(speech_file_path)
```

### 非同步使用方式  {#async-usage}

```python
from litellm import aspeech
from pathlib import Path
import os, asyncio

os.environ["OPENAI_API_KEY"] = "sk-.."

async def test_async_speech(): 
    speech_file_path = Path(__file__).parent / "speech.mp3"
    response = await aspeech(
            model="openai/tts-1",
            voice="alloy",
            input="the quick brown fox jumped over the lazy dogs",
            api_base=None,
            api_key=None,
            organization=None,
            project=None,
            max_retries=1,
            timeout=600,
            client=None,
            optional_params={},
        )
    response.stream_to_file(speech_file_path)

asyncio.run(test_async_speech())
```

## **LiteLLM Proxy 使用方式** {#litellm-proxy-usage}

LiteLLM 提供一個與 openai 相容的 `/audio/speech` 端點，用於文字轉語音請求。

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

**設定**

```bash
- model_name: tts
  litellm_params:
    model: openai/tts-1
    api_key: os.environ/OPENAI_API_KEY
```

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```
## **支援的提供者** {#supported-providers}

| 提供者    | 使用方式連結      |
|-------------|--------------------|
| OpenAI      |   [使用方式](#quick-start)                 |
| Azure OpenAI|   [使用方式](../docs/providers/azure#azure-text-to-speech-tts)                 |
| Azure AI Speech Service (AVA)|   [使用方式](../docs/providers/azure_ai_speech)                 |
| AWS Polly   |   [使用方式](#aws-polly-text-to-speech)                 |
| Vertex AI   |   [使用方式](../docs/providers/vertex#text-to-speech-apis)                 |
| Gemini      |   [使用方式](#gemini-text-to-speech)                 |
| ElevenLabs  |   [使用方式](../docs/providers/elevenlabs#text-to-speech-tts)                 |
| MiniMax     |   [使用方式](../docs/providers/minimax#minimax---text-to-speech)                 |

## `/audio/speech` 到 `/chat/completions` 橋接 {#audiospeech-to-chatcompletions-bridge}

LiteLLM 讓您可以使用 `/chat/completions` 模型透過 `/audio/speech` 端點來產生語音。這對於像 Gemini 的已啟用 TTS 的模型特別有用，這類模型只能透過 `/chat/completions` 存取。

### Gemini 文字轉語音 {#gemini-text-to-speech}

#### Python SDK 使用方式 {#python-sdk-usage}

```python showLineNumbers title="Gemini Text-to-Speech SDK Usage"
import litellm
import os

# Set your Gemini API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

def test_audio_speech_gemini():
    result = litellm.speech(
        model="gemini/gemini-2.5-flash-preview-tts",
        input="the quick brown fox jumped over the lazy dogs",
        api_key=os.getenv("GEMINI_API_KEY"),
    )
    
    # Save to file
    from pathlib import Path
    speech_file_path = Path(__file__).parent / "gemini_speech.mp3"
    result.stream_to_file(speech_file_path)
    print(f"Audio saved to {speech_file_path}")

test_audio_speech_gemini()
```

#### 非同步使用方式 {#async-usage-1}

```python showLineNumbers title="Gemini Text-to-Speech Async Usage"
import litellm
import asyncio
import os
from pathlib import Path

os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

async def test_async_gemini_speech():
    speech_file_path = Path(__file__).parent / "gemini_speech.mp3"
    response = await litellm.aspeech(
        model="gemini/gemini-2.5-flash-preview-tts",
        input="the quick brown fox jumped over the lazy dogs",
        api_key=os.getenv("GEMINI_API_KEY"),
    )
    response.stream_to_file(speech_file_path)
    print(f"Audio saved to {speech_file_path}")

asyncio.run(test_async_gemini_speech())
```

#### LiteLLM Proxy 使用方式 {#litellm-proxy-usage-1}

**設定組態：**

```yaml showLineNumbers title="Gemini Proxy Configuration"
model_list:
- model_name: gemini-tts
  litellm_params:
    model: gemini/gemini-2.5-flash-preview-tts
    api_key: os.environ/GEMINI_API_KEY
```

**啟動 Proxy：**

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**送出請求：**

```bash showLineNumbers title="Gemini TTS Request"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-tts",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "alloy"
  }' \
  --output gemini_speech.mp3
```

### Vertex AI 文字轉語音 {#vertex-ai-text-to-speech}

#### Python SDK 使用方式 {#python-sdk-usage-1}

```python showLineNumbers title="Vertex AI Text-to-Speech SDK Usage"
import litellm
import os
from pathlib import Path

# Set your Google credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/service-account.json"

def test_audio_speech_vertex():
    result = litellm.speech(
        model="vertex_ai/gemini-2.5-flash-preview-tts",
        input="the quick brown fox jumped over the lazy dogs",
    )
    
    # Save to file
    speech_file_path = Path(__file__).parent / "vertex_speech.mp3"
    result.stream_to_file(speech_file_path)
    print(f"Audio saved to {speech_file_path}")

test_audio_speech_vertex()
```

#### LiteLLM Proxy 使用方式 {#litellm-proxy-usage-2}

**設定組態：**

```yaml showLineNumbers title="Vertex AI Proxy Configuration"
model_list:
- model_name: vertex-tts
  litellm_params:
    model: vertex_ai/gemini-2.5-flash-preview-tts
    vertex_project: your-project-id
    vertex_location: us-central1
```

**送出請求：**

```bash showLineNumbers title="Vertex AI TTS Request"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-tts",
    "input": "The quick brown fox jumped over the lazy dog.",
    "voice": "en-US-Wavenet-D"
  }' \
  --output vertex_speech.mp3
```

### AWS Polly 文字轉語音 {#aws-polly-text-to-speech}

AWS Polly 提供神經式與標準文字轉語音引擎，支援多種語音與語言。

請參閱 [AWS Polly 提供者文件](../docs/providers/aws_polly) 以取得詳細的使用範例。

## ✨ Enterprise LiteLLM Proxy - 設定最大請求檔案大小  {#-enterprise-litellm-proxy---set-max-request-file-size}

當您想要限制送往 `audio/transcriptions` 的請求檔案大小時，請使用此功能

```yaml
- model_name: whisper
  litellm_params:
    model: whisper-1
    api_key: sk-*******
    max_file_size_mb: 0.00001 # 👈 max file size in MB  (Set this intentionally very small for testing)
  model_info:
    mode: audio_transcription
```

使用有效檔案送出測試請求
```shell
curl --location 'http://localhost:4000/v1/audio/transcriptions' \
--header 'Authorization: Bearer sk-1234' \
--form 'file=@"/Users/ishaanjaffer/Github/litellm/tests/gettysburg.wav"' \
--form 'model="whisper"'
```


預期會看到以下回應 

```shell
{"error":{"message":"File size is too large. Please check your file size. Passed file size: 0.7392807006835938 MB. Max file size: 0.0001 MB","type":"bad_request","param":"file","code":500}}%  
```
