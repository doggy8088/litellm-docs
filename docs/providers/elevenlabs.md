---
title: "ElevenLabs Speech API 與 LiteLLM：STT 與 TTS"
sidebar_label: "ElevenLabs"
description: "從 Python SDK 或 AI Gateway 使用 ElevenLabs Scribe 轉錄音訊，並以 Eleven v3 或 Multilingual v2 生成語音，支援 OpenAI 語音對應。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ElevenLabs {#elevenlabs}

ElevenLabs 提供高品質的 AI 語音技術，包括透過其轉錄 API 提供的語音轉文字功能。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | ElevenLabs 提供先進的 AI 語音技術，具備語音轉文字轉錄與文字轉語音功能，支援多種語言與說話者分離。 |
| LiteLLM 上的提供者路由 | `elevenlabs/` |
| 提供者文件 | [ElevenLabs API ↗](https://elevenlabs.io/docs/api-reference) |
| 支援的端點 | `/audio/transcriptions`, `/audio/speech`, `/v1/realtime` |

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

## 即時轉錄（Scribe v2 Realtime） {#realtime-transcription-scribe-v2-realtime}

<SinceVersion v="1.113.0" />

LiteLLM 透過代理與 OpenAI 相容的 `/v1/realtime` WebSocket 提供 `scribe_v2_realtime`。用戶端使用 OpenAI Realtime 轉錄協定；LiteLLM 會在用戶端第一次傳送 `session.update` 後，開啟 ElevenLabs 即時語音轉文字 socket、轉發音訊，並把 ElevenLabs 的轉錄結果對應回 OpenAI 事件。此模型僅供即時使用；檔案轉錄請在 `/audio/transcriptions` 上使用 `scribe_v2`。

### 1. 把模型加入設定 {#1-add-the-model-to-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: scribe-realtime
    litellm_params:
      model: elevenlabs/scribe_v2_realtime
      api_key: os.environ/ELEVENLABS_API_KEY
      # optional ElevenLabs settings
      keyterms: ["LiteLLM", "Scribe"]
      no_verbatim: true
      vad_silence_threshold_secs: 1.2
```

`api_key` 會退回使用 `ELEVENLABS_API_KEY`，且只會在 `xi-api-key` 標頭中傳送。`api_base` 是選用的，會退回使用 `ELEVENLABS_API_BASE`；請把它設定為區域主機，例如 `https://api.eu.residency.elevenlabs.io`。它必須是絕對的 `https://` 或 `wss://` URL；LiteLLM 會保留它的主機與連接埠，並把路徑換成 `/v1/speech-to-text/realtime`。內嵌的憑證與 URL 片段會被拒絕。

這些選用的 `litellm_params` 會成為 ElevenLabs 工作階段設定。無效的值會在任何內容傳送到 ElevenLabs 之前就讓工作階段失敗。

| 設定 | 類型 | 效果 |
| --- | --- | --- |
| `keyterms` | list of strings | 使辨識偏向這些詞彙 |
| `secondary_languages` | list of ISO language codes | 預期會出現的其他語言 |
| `no_verbatim` | bool | 移除填充詞與不流暢的語音 |
| `filter_background_audio` | bool | 抑制背景音訊 |
| `vad_threshold` | number, at least 0 | 語音活動偵測閾值 |
| `vad_silence_threshold_secs` | number, at least 0 | 結束 VAD 片段的靜音長度 |
| `min_speech_duration_ms` | integer, at least 0 | 計入的最短語音 |
| `min_silence_duration_ms` | integer, at least 0 | 計入的最短靜音 |
| `enable_logging` | bool | `false` 會開啟 ElevenLabs 零保留模式，ElevenLabs 僅限企業帳號使用此模式 |

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 2. 連線 {#2-connect}

```text
ws://localhost:4000/v1/realtime?model=scribe-realtime
```

請使用 `Authorization: Bearer <proxy key>` 進行驗證。LiteLLM 會立即傳送帶有預設設定（24 kHz PCM、伺服器 VAD）的 `session.created`；此時尚未傳送任何內容到 ElevenLabs。

### 3. 設定工作階段 {#3-configure-the-session}

請傳送一次 `session.update`（或 `transcription_session.update`）。LiteLLM 會以這些設定開啟 ElevenLabs 工作階段，並在 ElevenLabs 接受後傳送帶有相同工作階段 id 的 `session.updated`。之後的更新會被忽略。在 `session.updated` 之前傳送的音訊會被緩衝並重播，因此您可以立即開始串流。如果一直沒有收到 `session.update`，而緩衝區已滿（200 則訊息或 10 MB），之後的音訊會被捨棄，直到更新到達為止。

```json showLineNumbers title="session.update"
{
  "type": "session.update",
  "session": {
    "type": "transcription",
    "audio": {
      "input": {
        "format": {"type": "audio/pcm", "rate": 24000},
        "turn_detection": {"type": "server_vad"},
        "transcription": {"model": "scribe_v2_realtime", "language": "en"}
      }
    }
  }
}
```

| 欄位 | 規則 |
| --- | --- |
| `format` | `type` 必須是 `audio/pcm`，`channels` 必須是 `1`。`rate` 必須是 `8000`、`16000`、`22050`、`24000`、`44100` 或 `48000`；省略時代表 24 kHz。 |
| `transcription.model` | 選用。只有 `scribe_v2_realtime` 或 `elevenlabs/scribe_v2_realtime` 會被接受。其他任何值（包括代理別名）都會被拒絕，或在設定 [`drop_params`](/docs/completion/drop_params) 時被忽略。 |
| `transcription.language` | 選用的 ISO 639-1 或 ISO 639-3 代碼。區域後綴會被捨棄，因此 `en-US` 會變成 `en`。 |
| `turn_detection` | 省略或 `{"type": "server_vad"}` 選用 ElevenLabs VAD 提交；`null` 選用手動提交。其他任何 `type` 都會被拒絕，或在設定 [`drop_params`](/docs/completion/drop_params) 時退回伺服器 VAD。 |
| Beta layout | `input_audio_format: "pcm16"` 加上 `input_audio_transcription` 在 24 kHz 下會被接受。 |

無效的 `session.update`（格式、速率、模型、語言或 turn detection 類型錯誤）會收到一個 `invalid_request_error` 類型的 `error` 事件，其中會指明問題，接著連線會關閉。設定完成後傳送無效的音訊（例如無效的 base64 或奇數個 PCM 位元組）也會以相同方式關閉。

### 4. 串流音訊 {#4-stream-audio}

`input_audio_buffer.append` 承載以設定速率編碼的 base64 單聲道 PCM16。LiteLLM 會把它以 ElevenLabs `input_audio_chunk` 訊息轉發，並把較大的 append 切成至多 32000 位元組的區塊。`input_audio_buffer.commit` 與 `input_audio_buffer.end` 會提交自上次提交以來傳送的音訊（任一模式皆然）。沒有新音訊的提交不會被轉發，因為 ElevenLabs 收到空提交會關閉工作階段。ElevenLabs 收到新音訊少於 0.3 秒的提交也會關閉工作階段，因此 LiteLLM 會把較短的提交或清除以靜音補足到 0.3 秒，而該靜音會像其他音訊一樣計費。音訊中沒有語音的提交仍會收到 `completed` 事件，轉錄結果為空。`input_audio_buffer.clear` 會提交待處理的音訊並捨棄該片段的轉錄結果，因此下一個 `completed` 事件只涵蓋清除後傳送的音訊。每次清除只捨棄自己片段的轉錄結果，即使較早提交的轉錄結果尚未到達。被清除的音訊仍會計費。ElevenLabs 回應被清除的片段後，如果該片段已經收到 `speech_started`，LiteLLM 會傳送 `input_audio_buffer.speech_stopped`，接著傳送 `input_audio_buffer.cleared`。自上次提交以來沒有新音訊的清除不會傳送任何內容。其他所有用戶端事件（包括 `response.create`）都會被捨棄。

使用伺服器 VAD 時，ElevenLabs 會在停頓 `vad_silence_threshold_secs` 後提交片段，因此請即時持續串流音訊（包含靜音），或傳送 `input_audio_buffer.commit` 立即提交。

### 5. 讀取轉錄結果 {#5-read-transcripts}

| 事件 | 欄位 | 時機 |
| --- | --- | --- |
| `session.created` | `session.type: transcription`，預設 24 kHz 伺服器 VAD 設定 | 連線時 |
| `session.updated` | 生效的設定，相同的 `session.id` | ElevenLabs 接受您的 `session.update` 後 |
| `input_audio_buffer.speech_started` | `item_id` | 片段的第一份部分轉錄結果 |
| `conversation.item.input_audio_transcription.delta` | `item_id`, `content_index: 0`, `delta` | 新確認的詞彙，以及提交時該片段的其餘部分 |
| `input_audio_buffer.speech_stopped` | `item_id` | 片段已提交或已清除 |
| `conversation.item.input_audio_transcription.completed` | `item_id`, `content_index: 0`, `transcript`, `usage: {"type": "duration", "seconds": 7.57}` | 片段的最終轉錄結果 |
| `input_audio_buffer.cleared` | | ElevenLabs 回應了 `input_audio_buffer.clear` 所提交的片段 |
| `error` | `error.type`, `error.message: ElevenLabs realtime transcription failed: <type>` | ElevenLabs 回報錯誤，例如 `auth_error` 或 `quota_exceeded` |

ElevenLabs 會持續修正每份部分轉錄結果的最後一個詞，因此 delta 只有在較晚的部分結果確認某個詞之後才會攜帶它。提交片段時，LiteLLM 會在 `speech_stopped` 之前把轉錄結果的其餘部分以最後一個 delta 傳送，因此一個片段的 delta 加總起來就是它的 `completed` 轉錄結果。對於沒有空格的文字（例如中文與日文），以及最後一個詞沒有空格的文字（例如夾雜英文單字的日文），delta 會攜帶兩個部分結果一致的字元，減去最後一個字元與任何結尾標點符號，因為 ElevenLabs 經常修正這些部分。如果 ElevenLabs 修正了 delta 已經攜帶的文字，之後的 delta 會從相同的詞或字元位置繼續，因此合併後的 delta 可能在被修正的詞上與 `completed` 不同。改變詞數的修正（例如 `twenty five` 變成 `$25`）可能讓下一個 delta 跳過或重複一個詞。`completed` 轉錄結果是該片段的權威文字。

對於用戶端造成的錯誤（`auth_error`、`quota_exceeded`、`rate_limited`、`invalid_request`、`input_error`、`commit_throttled`、`unaccepted_terms`、`queue_overflow`、`session_time_limit_exceeded`、`chunk_size_exceeded` 與 `insufficient_audio_activity`），`error.type` 是 `invalid_request_error`；其他所有 ElevenLabs 錯誤則為 `server_error`。ElevenLabs 會在每次錯誤後關閉工作階段。無效的 ElevenLabs 金鑰會以帶有 `auth_error` 的 `error` 事件到達，接著正常關閉，且該工作階段會被記錄為失敗而非成功。如果 LiteLLM 完全無法開啟 ElevenLabs socket（網路失敗、逾時，或交握遭到 HTTP 拒絕），代理會以代碼 `1011` 關閉用戶端連線，原因例如 `ElevenLabs realtime connection failed (HTTP 403)`。

### 健康檢查 {#health-checks}

`scribe_v2_realtime` 的健康檢查會以部署的設定開啟 ElevenLabs 即時 socket 並等待 `session_started`，不傳送音訊，因此不產生費用。金鑰被拒絕或 socket 先行關閉時，會以 ElevenLabs 錯誤（例如 `ElevenLabs realtime transcription failed: auth_error`）把部署標示為不健康。

### 計價與用量 {#pricing-and-usage}

Scribe v2 Realtime 按輸入音訊的秒數計費（模型成本對應中的 `input_cost_per_second`）。`usage.seconds` 是自上一個 `completed` 事件以來，LiteLLM 傳送給 ElevenLabs 的音訊（含靜音）。最後一個 `completed` 事件之後的音訊會在工作階段關閉時計費。部署設定 `keyterms` 時，每秒還會按 keyterm prompting 附加費率計費，即模型成本對應中的 `elevenlabs/scribe_v2_realtime/keyterms`。部署自訂定價只會取代基本費率，附加費率一律來自成本對應。

### Python 用戶端範例 {#example-python-client}

伺服器 VAD：設定工作階段、即時以 100 毫秒區塊串流單聲道 PCM16 WAV 檔案、加入靜音讓 ElevenLabs 提交，然後印出轉錄事件。

```python showLineNumbers title="Scribe v2 Realtime client"
import asyncio
import base64
import json
import os
import wave

import websockets

URL = "ws://localhost:4000/v1/realtime?model=scribe-realtime"
HEADERS = {"Authorization": f'Bearer {os.environ["LITELLM_API_KEY"]}'}


async def main():
    with wave.open("speech.wav") as w:  # mono PCM16
        rate, audio = w.getframerate(), w.readframes(w.getnframes())
    step = rate * 2 // 10
    async with websockets.connect(URL, additional_headers=HEADERS) as ws:
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "type": "transcription",
                "audio": {"input": {
                    "format": {"type": "audio/pcm", "rate": rate},
                    "turn_detection": {"type": "server_vad"},
                    "transcription": {"model": "scribe_v2_realtime"},
                }},
            },
        }))

        async def send_audio():
            for i in range(0, len(audio), step):
                chunk = base64.b64encode(audio[i : i + step]).decode()
                await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": chunk}))
                await asyncio.sleep(0.1)
            silence = base64.b64encode(b"\x00\x00" * rate * 3).decode()
            await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": silence}))

        sender = asyncio.create_task(send_audio())
        async for raw in ws:
            event = json.loads(raw)
            if event["type"].endswith(".delta"):
                print(event["delta"], end="", flush=True)
            elif event["type"].endswith(".completed"):
                print("\n" + event["transcript"], event.get("usage"))
                break
            elif event["type"] == "error":
                print(event["error"])
                break
        sender.cancel()


asyncio.run(main())
```

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
