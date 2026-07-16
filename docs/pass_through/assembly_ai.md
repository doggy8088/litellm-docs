# AssemblyAI {#assemblyai}

AssemblyAI 的穿透端點 - 以原生格式（不轉換）呼叫 AssemblyAI 端點。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 適用於所有整合 |
| 記錄 | ✅ | 適用於所有整合 |

支援 **所有** AssemblyAI 端點

[**查看所有 AssemblyAI 端點**](https://www.assemblyai.com/docs/api-reference)

## 支援的路由 {#supported-routes}

| AssemblyAI 服務 | LiteLLM 路由 | AssemblyAI 基礎 URL |
|-------------------|---------------|---------------------|
| 語音轉文字（US） | `/assemblyai/*` | `api.assemblyai.com` |
| 語音轉文字（EU） | `/eu.assemblyai/*` | `eu.api.assemblyai.com` |

## 快速開始 {#quick-start}

讓我們呼叫 AssemblyAI 的 [`/v2/transcripts` 端點](https://www.assemblyai.com/docs/api-reference/transcripts)

1. 將 AssemblyAI API 金鑰加入您的環境

```bash
export ASSEMBLYAI_API_KEY=""
```

2. 啟動 LiteLLM Proxy

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 測試看看！

讓我們呼叫 AssemblyAI 的 [`/v2/transcripts` 端點](https://www.assemblyai.com/docs/api-reference/transcripts)。包含已註解掉、可切換啟用的 [語音理解](https://www.assemblyai.com/docs/speech-understanding) 功能。

```python
import assemblyai as aai

aai.settings.base_url = "http://0.0.0.0:4000/assemblyai" # <your-proxy-base-url>/assemblyai
aai.settings.api_key = "Bearer sk-1234" # Bearer <your-virtual-key>

# Use a publicly-accessible URL
audio_file = "https://assembly.ai/wildfires.mp3"

# Or use a local file:
# audio_file = "./example.mp3"

config = aai.TranscriptionConfig(
    speech_models=["universal-3-pro", "universal-2"],
    language_detection=True,
    speaker_labels=True,
    # Speech understanding features
    # sentiment_analysis=True,
    # entity_detection=True,
    # auto_chapters=True,
    # summarization=True,
    # summary_type=aai.SummarizationType.bullets,
    # redact_pii=True,
    # content_safety=True,
)

transcript = aai.Transcriber().transcribe(audio_file, config=config)

if transcript.status == aai.TranscriptStatus.error:
    raise RuntimeError(f"Transcription failed: {transcript.error}")

print(f"\nFull Transcript:\n\n{transcript.text}")

# Optionally print speaker diarization results
# for utterance in transcript.utterances:
#     print(f"Speaker {utterance.speaker}: {utterance.text}")
```

4. [使用 Universal-3 Pro 進行提示](https://www.assemblyai.com/docs/speech-to-text/prompting)（選用）

```python
import assemblyai as aai

aai.settings.base_url = "http://0.0.0.0:4000/assemblyai" # <your-proxy-base-url>/assemblyai
aai.settings.api_key = "Bearer sk-1234" # Bearer <your-virtual-key>

audio_file = "https://assemblyaiassets.com/audios/verbatim.mp3"

config = aai.TranscriptionConfig(
    speech_models=["universal-3-pro", "universal-2"],
    language_detection=True,
    prompt="Produce a transcript suitable for conversational analysis. Every disfluency is meaningful data. Include: fillers (um, uh, er, ah, hmm, mhm, like, you know, I mean), repetitions (I I, the the), restarts (I was- I went), stutters (th-that, b-but, no-not), and informal speech (gonna, wanna, gotta)",
)

transcript = aai.Transcriber().transcribe(audio_file, config)

print(transcript.text)
```

## 呼叫 AssemblyAI EU 端點 {#calling-assemblyai-eu-endpoints}

如果您想將請求傳送到 AssemblyAI EU 端點，可以透過將 `LITELLM_PROXY_BASE_URL` 設定為 `<your-proxy-base-url>/eu.assemblyai` 來達成

```python
import assemblyai as aai

aai.settings.base_url = "http://0.0.0.0:4000/eu.assemblyai" # <your-proxy-base-url>/eu.assemblyai
aai.settings.api_key = "Bearer sk-1234" # Bearer <your-virtual-key>

# Use a publicly-accessible URL
audio_file = "https://assembly.ai/wildfires.mp3"

# Or use a local file:
# audio_file = "./path/to/file.mp3"

transcriber = aai.Transcriber()
transcript = transcriber.transcribe(audio_file)
print(transcript)
print(transcript.id)
```

## LLM Gateway {#llm-gateway}

將 AssemblyAI 的 [LLM Gateway](https://www.assemblyai.com/docs/llm-gateway) 作為相容 OpenAI 的提供者來使用——一個統一的 API，適用於 Claude、GPT 與 Gemini 模型，完整支援 LiteLLM 記錄、防護欄與成本追蹤。

[**查看可用模型**](https://www.assemblyai.com/docs/llm-gateway#available-models)

### 使用方式 {#usage}

#### LiteLLM Python SDK {#litellm-python-sdk}

```python
import litellm
import os

os.environ["ASSEMBLYAI_API_KEY"] = "your-assemblyai-api-key"

response = litellm.completion(
    model="assemblyai/claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "What is the capital of France?"}]
)

print(response.choices[0].message.content)
```

#### LiteLLM Proxy {#litellm-proxy}

1. 設定

```yaml
model_list:
  - model_name: assemblyai/*
    litellm_params:
      model: assemblyai/*
      api_key: os.environ/ASSEMBLYAI_API_KEY
```

2. 啟動 proxy

```bash
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試看看！

```python
import requests

headers = {
    "authorization": "Bearer sk-1234"  # Bearer <your-virtual-key>
}

response = requests.post(
    "http://0.0.0.0:4000/v1/chat/completions",
    headers=headers,
    json={
        "model": "assemblyai/claude-sonnet-4-5-20250929",
        "messages": [
            {"role": "user", "content": "What is the capital of France?"}
        ],
        "max_tokens": 1000
    }
)

result = response.json()
print(result["choices"][0]["message"]["content"])
```
