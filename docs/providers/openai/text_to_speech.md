import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenAI - 文字轉語音 {#openai---text-to-speech}

## 總覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 適用於所有支援的模型 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 防護欄 | ✅ | 套用於輸入文字 |
| 支援的模型 | tts-1, tts-1-hd, gpt-4o-mini-tts | |

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

## 支援的模型  {#supported-models}

| 模型 | 範例 |
|-------|-------------|
| tts-1 | speech(model="tts-1", voice="alloy", input="Hello, world!") |
| tts-1-hd | speech(model="tts-1-hd", voice="alloy", input="Hello, world!") |
| gpt-4o-mini-tts | speech(model="gpt-4o-mini-tts", voice="alloy", input="Hello, world!") |

## ✨ Enterprise LiteLLM Proxy - 設定最大請求檔案大小  {#-enterprise-litellm-proxy---set-max-request-file-size}

當您想限制傳送至 `audio/transcriptions` 的請求檔案大小時，請使用此設定

```yaml
- model_name: whisper
  litellm_params:
    model: whisper-1
    api_key: sk-*******
    max_file_size_mb: 0.00001 # 👈 max file size in MB  (Set this intentionally very small for testing)
  model_info:
    mode: audio_transcription
```

使用有效檔案進行測試請求
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
