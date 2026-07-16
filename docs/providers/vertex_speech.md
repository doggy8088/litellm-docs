import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI 文字轉語音 {#vertex-ai-text-to-speech}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | 具備 Chirp3 HD 聲音與 Gemini TTS 的 Google Cloud 文字轉語音 |
| LiteLLM 上的提供者路由 | `vertex_ai/chirp`（Chirp）、`vertex_ai/gemini-*-tts`（Gemini） |

## Chirp3 HD 聲音 {#chirp3-hd-voices}

具備高品質 Chirp3 HD 聲音的 Google Cloud Text-to-Speech API。

### 快速開始 {#quick-start}

#### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Chirp3 Quick Start"
from litellm import speech
from pathlib import Path

speech_file_path = Path(__file__).parent / "speech.mp3"
response = speech(
    model="vertex_ai/chirp",
    voice="alloy",  # OpenAI voice name - automatically mapped
    input="Hello, this is Vertex AI Text to Speech",
    vertex_project="your-project-id",
    vertex_location="us-central1",
)
response.stream_to_file(speech_file_path)
```

#### LiteLLM AI 閘道 {#litellm-ai-gateway}

**1. 設定 config.yaml**

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: vertex-tts
    litellm_params:
      model: vertex_ai/chirp
      vertex_project: "your-project-id"
      vertex_location: "us-central1"
      vertex_credentials: "/path/to/service_account.json"
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml
```

**3. 發出請求**

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Chirp3 Quick Start"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-tts",
    "voice": "alloy",
    "input": "Hello, this is Vertex AI Text to Speech"
  }' \
  --output speech.mp3
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Chirp3 Quick Start"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.audio.speech.create(
    model="vertex-tts",
    voice="alloy",
    input="Hello, this is Vertex AI Text to Speech",
)
response.stream_to_file("speech.mp3")
```

</TabItem>
</Tabs>

### 聲音對應 {#voice-mapping}

LiteLLM 會將 OpenAI 聲音名稱對應到 Google Cloud 聲音。您可以直接使用 OpenAI 聲音或 Google Cloud 聲音。

| OpenAI Voice | Google Cloud Voice |
|-------------|-------------------|
| `alloy` | en-US-Studio-O |
| `echo` | en-US-Studio-M |
| `fable` | en-GB-Studio-B |
| `onyx` | en-US-Wavenet-D |
| `nova` | en-US-Studio-O |
| `shimmer` | en-US-Wavenet-F |

### 直接使用 Google Cloud 聲音 {#using-google-cloud-voices-directly}

#### LiteLLM Python SDK {#litellm-python-sdk-1}

```python showLineNumbers title="Chirp3 HD Voice"
from litellm import speech

# Pass Chirp3 HD voice name directly
response = speech(
    model="vertex_ai/chirp",
    voice="en-US-Chirp3-HD-Charon",
    input="Hello with a Chirp3 HD voice",
    vertex_project="your-project-id",
)
response.stream_to_file("speech.mp3")
```

```python showLineNumbers title="Voice as Dict (Multilingual)"
from litellm import speech

# Pass as dict for full control over language and voice
response = speech(
    model="vertex_ai/chirp",
    voice={
        "languageCode": "de-DE",
        "name": "de-DE-Chirp3-HD-Charon",
    },
    input="Hallo, dies ist ein Test",
    vertex_project="your-project-id",
)
response.stream_to_file("speech.mp3")
```

#### LiteLLM AI 閘道 {#litellm-ai-gateway-1}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Chirp3 HD Voice"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-tts",
    "voice": "en-US-Chirp3-HD-Charon",
    "input": "Hello with a Chirp3 HD voice"
  }' \
  --output speech.mp3
```

```bash showLineNumbers title="Voice as Dict (Multilingual)"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-tts",
    "voice": {"languageCode": "de-DE", "name": "de-DE-Chirp3-HD-Charon"},
    "input": "Hallo, dies ist ein Test"
  }' \
  --output speech.mp3
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Chirp3 HD Voice"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.audio.speech.create(
    model="vertex-tts",
    voice="en-US-Chirp3-HD-Charon",
    input="Hello with a Chirp3 HD voice",
)
response.stream_to_file("speech.mp3")
```

```python showLineNumbers title="Voice as Dict (Multilingual)"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.audio.speech.create(
    model="vertex-tts",
    voice={"languageCode": "de-DE", "name": "de-DE-Chirp3-HD-Charon"},
    input="Hallo, dies ist ein Test",
)
response.stream_to_file("speech.mp3")
```

</TabItem>
</Tabs>

瀏覽可用聲音：[Google Cloud Text-to-Speech Console](https://console.cloud.google.com/vertex-ai/generative/speech/text-to-speech)

### 傳遞原始 SSML {#passing-raw-ssml}

當您的輸入包含 `<speak>` 標籤時，LiteLLM 會自動偵測 SSML，並原樣傳遞。

#### LiteLLM Python SDK {#litellm-python-sdk-2}

```python showLineNumbers title="SSML Input"
from litellm import speech

ssml = """
<speak>
    <p>Hello, world!</p>
    <p>This is a test of the <break strength="medium" /> text-to-speech API.</p>
</speak>
"""

response = speech(
    model="vertex_ai/chirp",
    voice="en-US-Studio-O",
    input=ssml,  # Auto-detected as SSML
    vertex_project="your-project-id",
)
response.stream_to_file("speech.mp3")
```

```python showLineNumbers title="Force SSML Mode"
from litellm import speech

# Force SSML mode with use_ssml=True
response = speech(
    model="vertex_ai/chirp",
    voice="en-US-Studio-O",
    input="<speak><prosody rate='slow'>Speaking slowly</prosody></speak>",
    use_ssml=True,
    vertex_project="your-project-id",
)
response.stream_to_file("speech.mp3")
```

#### LiteLLM AI 閘道 {#litellm-ai-gateway-2}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="SSML Input"
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vertex-tts",
    "voice": "en-US-Studio-O",
    "input": "<speak><p>Hello!</p><break time=\"500ms\"/><p>How are you?</p></speak>"
  }' \
  --output speech.mp3
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="SSML Input"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

ssml = """<speak><p>Hello!</p><break time="500ms"/><p>How are you?</p></speak>"""

response = client.audio.speech.create(
    model="vertex-tts",
    voice="en-US-Studio-O",
    input=ssml,
)
response.stream_to_file("speech.mp3")
```

</TabItem>
</Tabs>

### 支援的參數 {#supported-parameters}

| 參數 | 說明 | Values |
|-----------|-------------|--------|
| `voice` | 聲音選擇 | OpenAI voice、Google Cloud voice 名稱，或 dict |
| `input` | 要轉換的文字 | 純文字或 SSML |
| `speed` | 說話速度 | 0.25 到 4.0（預設：1.0） |
| `response_format` | 音訊格式 | `mp3`、`opus`、`wav`、`pcm`、`flac` |
| `use_ssml` | 強制 SSML 模式 | `True` / `False` |

### 非同步用法 {#async-usage}

```python showLineNumbers title="Async Speech Generation"
import asyncio
from litellm import aspeech

async def main():
    response = await aspeech(
        model="vertex_ai/chirp",
        voice="alloy",
        input="Hello from async",
        vertex_project="your-project-id",
    )
    response.stream_to_file("speech.mp3")

asyncio.run(main())
```

---

## Gemini TTS {#gemini-tts}

具備音訊輸出能力的 Gemini 模型，使用 chat completions API。

:::warning
**限制：**
- 僅支援 `pcm16` 音訊格式
- 尚不支援串流
- 必須設定 `modalities: ["audio"]`
- 透過 LiteLLM Proxy 使用時，必須在請求主體中包含 `"allowed_openai_params": ["audio", "modalities"]`，以啟用音訊參數
:::

### 快速開始 {#quick-start-1}

#### LiteLLM Python SDK {#litellm-python-sdk-3}

```python showLineNumbers title="Gemini TTS Quick Start"
from litellm import completion
import json

# Load credentials
with open('path/to/service_account.json', 'r') as file:
    vertex_credentials = json.dumps(json.load(file))

response = completion(
    model="vertex_ai/gemini-2.5-flash-preview-tts",
    messages=[{"role": "user", "content": "Say hello in a friendly voice"}],
    modalities=["audio"],
    audio={
        "voice": "Kore",
        "format": "pcm16"
    },
    vertex_credentials=vertex_credentials
)
print(response)
```

#### LiteLLM AI 閘道 {#litellm-ai-gateway-3}

**1. 設定 config.yaml**

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-tts
    litellm_params:
      model: vertex_ai/gemini-2.5-flash-preview-tts
      vertex_project: "your-project-id"
      vertex_location: "us-central1"
      vertex_credentials: "/path/to/service_account.json"
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml
```

**3. 發出請求**

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Gemini TTS Request"
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gemini-tts",
    "messages": [{"role": "user", "content": "Say hello in a friendly voice"}],
    "modalities": ["audio"],
    "audio": {"voice": "Kore", "format": "pcm16"},
    "allowed_openai_params": ["audio", "modalities"]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Gemini TTS Request"
import openai

client = openai.OpenAI(api_key="sk-1234", base_url="http://0.0.0.0:4000")

response = client.chat.completions.create(
    model="gemini-tts",
    messages=[{"role": "user", "content": "Say hello in a friendly voice"}],
    modalities=["audio"],
    audio={"voice": "Kore", "format": "pcm16"},
    extra_body={"allowed_openai_params": ["audio", "modalities"]}
)
print(response)
```

</TabItem>
</Tabs>

### 支援的模型 {#supported-models}

- `vertex_ai/gemini-2.5-flash-preview-tts`
- `vertex_ai/gemini-2.5-pro-preview-tts`

可用聲音請參見 [Gemini TTS 文件](https://ai.google.dev/gemini-api/docs/speech-generation)。

### 進階用法 {#advanced-usage}

```python showLineNumbers title="Gemini TTS with System Prompt"
from litellm import completion

response = completion(
    model="vertex_ai/gemini-2.5-pro-preview-tts",
    messages=[
        {"role": "system", "content": "You are a helpful assistant that speaks clearly."},
        {"role": "user", "content": "Explain quantum computing in simple terms"}
    ],
    modalities=["audio"],
    audio={"voice": "Charon", "format": "pcm16"},
    temperature=0.7,
    max_tokens=150,
    vertex_credentials=vertex_credentials
)
```
