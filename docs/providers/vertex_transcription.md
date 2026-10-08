import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex AI 音訊轉錄 {#vertex-ai-audio-transcription}

| Property | Details |
|-------|-------|
| 說明 | 透過 OpenAI `/v1/audio/transcriptions` 端點在 Vertex AI 上使用 Gemini 語音轉文字，以及透過 `/v1/realtime` 使用 Chirp 串流語音轉文字 |
| LiteLLM 上的提供者路由 | `vertex_ai/gemini-3.5-transcribe-preview`（批次），`vertex_ai/chirp_3`（即時，[請見下方](#chirp-realtime-transcription)） |
| 支援的 OpenAI 參數 | `language`、`response_format`（`json`、`text`） |

Vertex AI 上的 Gemini 轉錄模型由 `global` 位置提供服務，而在未設定 `vertex_location` 時，LiteLLM 預設會使用該位置。如果您設定了區域位置（在 config、`litellm.vertex_location`，或 `VERTEXAI_LOCATION` / `VERTEX_LOCATION` 環境變數中），該值將優先，且當模型在該區域不可用時，Vertex 會回傳 404，因此這些模型請固定使用 `vertex_location: global`。

偏好使用 API 金鑰而非 GCP service account？同一個模型也可透過 [Google AI Studio](./gemini.md#audio-transcription-speech-to-text) 以 `gemini/gemini-3.5-transcribe` 使用。

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Gemini Transcribe Quick Start"
from litellm import transcription

audio_file = open("speech.wav", "rb")
response = transcription(
    model="vertex_ai/gemini-3.5-transcribe-preview",
    file=audio_file,
    language="en",
    vertex_project="your-project-id",
    vertex_credentials="/path/to/service_account.json",
)
print(response.text)
```

### LiteLLM AI 閘道 {#litellm-ai-gateway}

**1. 設定 config.yaml**

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-transcribe
    litellm_params:
      model: vertex_ai/gemini-3.5-transcribe-preview
      vertex_project: "your-project-id"
      vertex_credentials: "/path/to/service_account.json"
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml
```

**3. 發送請求**

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Gemini Transcribe Quick Start"
curl http://0.0.0.0:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -F file=@speech.wav \
  -F model=gemini-transcribe \
  -F language=en
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Gemini Transcribe Quick Start"
import openai

client = openai.OpenAI(api_key="sk-<your-litellm-api-key>", base_url="http://0.0.0.0:4000")

audio_file = open("speech.wav", "rb")
response = client.audio.transcriptions.create(
    model="gemini-transcribe",
    file=audio_file,
    language="en",
)
print(response.text)
```

</TabItem>
</Tabs>

## 支援的參數 {#supported-params}

`language` 接受兩字母代碼或 BCP-47 標記，並在送往 Gemini 之前正規化為 BCP-47。`response_format` 支援 `json`（預設）與 `text`；Vertex AI 上的 Gemini 轉錄不回傳字詞時間戳記，因此 `verbose_json`、`srt` 與 `vtt` 會被拒絕並回傳 400，除非設定了 `drop_params`，此時它們會被捨棄並回傳純文字轉錄。

## 用量與成本追蹤 {#usage-and-cost-tracking}

Vertex AI 會回報依模態分割的 token 用量，而 LiteLLM 會分別追蹤音訊輸入 token 與文字輸出 token，因此支出記錄與 `x-litellm-response-cost` 標頭會反映 Google 公布的每 token 音訊轉錄定價。

## Chirp 即時轉錄 {#chirp-realtime-transcription}

LiteLLM 透過 proxy 的相容 OpenAI `/v1/realtime` 端點提供 Google Cloud Speech-to-Text Chirp 模型服務。用戶端使用 OpenAI Realtime 轉錄協定；LiteLLM 會透過 gRPC 將其 PCM16 音訊串流到 Speech-to-Text v2 `StreamingRecognize`，並將 Google 的中間與最終結果映射回 OpenAI 事件。[Python 範例](#example-openai-sdk-client)如下，是使用 OpenAI SDK 的完整按住說話工作階段

### 1. 安裝 Speech-to-Text 用戶端 {#1-install-the-speech-to-text-client}

串流使用 `google-cloud-speech`，該套件由 `stt-vertex-chirp` 額外安裝。官方 Docker 映像已經包含它

```bash showLineNumbers title="Install the extra"
pip install 'litellm[stt-vertex-chirp]'
```

若沒有它，第一個工作階段會以 `google-cloud-speech is not installed` 失敗

### 2. 將模型加入您的 config {#2-add-the-model-to-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: chirp-3
    litellm_params:
      model: vertex_ai/chirp_3
      vertex_project: "your-project-id"
      vertex_location: us
      vertex_credentials: "/path/to/service_account.json"
```

`vertex_credentials` 會回退到 `VERTEXAI_CREDENTIALS` 環境變數；`vertex_project` 與 `vertex_location` 會回退到 `litellm.vertex_project` 和 `litellm.vertex_location`，再回退到 `VERTEXAI_PROJECT` 和 `VERTEXAI_LOCATION`。位置預設為 `us`，並選取區域端點 `<location>-speech.googleapis.com`（`speech.googleapis.com` 用於 `global`），因此請選擇 Speech-to-Text 提供該模型的位置。`api_base` 為選用，且只會使用其主機。Chirp 部署不支援即時健康檢查：請使用 `mode: audio_transcription` 來進行健康檢查，這會透過同一個部署所提供的批次 `/v1/audio/transcriptions` 端點

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml
```

### 3. 連線 {#3-connect}

```text
ws://localhost:4000/v1/realtime?model=chirp-3&intent=transcription
```

使用 `Authorization: Bearer <proxy key>` 進行驗證。`model` 是您 config 中的 `model_name`，且為必填；單獨使用 `intent=transcription` 會路由到 proxy 的預設 OpenAI 轉錄模型。`intent=transcription` 會將工作階段設為僅轉錄，並將 `session.update` 中命名的任何模型固定為您被授權使用的模型

LiteLLM 會在 socket 一接受時立即發出帶有 `object: realtime.transcription_session` 的 `session.created`。它包含預設值：模型 `chirp_3`、單聲道 `audio/pcm`、24000 Hz、伺服器 VAD，以及無語言

### 4. 設定工作階段 {#4-configure-the-session}

送出一個 `session.update`（或 `transcription_session.update`）。LiteLLM 會以 `session.updated` 回應，回傳正規化後的工作階段，而之後任何更新都會被忽略。在更新之前送出的音訊會被緩衝並在之後重播，因此您可以立即開始串流

```json showLineNumbers title="session.update"
{
  "type": "session.update",
  "session": {
    "type": "transcription",
    "audio": {
      "input": {
        "format": {"type": "audio/pcm", "rate": 24000, "channels": 1},
        "transcription": {"model": "chirp_3", "language": "en"},
        "turn_detection": {"type": "server_vad"}
      }
    }
  }
}
```

| 欄位 | 規則 |
| --- | --- |
| `type` | `transcription`、`realtime` 或省略。其他任何值都會被拒絕。 |
| `format` | `type` 必須是 `audio/pcm`（或 `pcm16`），`rate` 為從 `8000` 到 `48000` 的任一整數，若存在，`channels` 必須是 `1`。省略則表示單聲道 24 kHz。 |
| `transcription.model` | 選用。搭配 `intent=transcription` 時，proxy 會將其替換為您被授權的模型；若未提供，則僅接受 `chirp_3` 或 `vertex_ai/chirp_3`。 |
| `transcription.language` | 選用的 BCP-47 標記。常見語言的裸兩字母代碼會展開為其預設地區（`en` 會變成 `en-US`、`pt` 會變成 `pt-BR`、`zh` 會變成 `zh-CN`）；其他值會照原樣送出。省略表示由 Google 偵測語言。 |
| `turn_detection` | 選擇模式（如下表）。除 `server_vad` 之外的任何 `type` 都會被拒絕；沒有 `type` 的物件表示伺服器 VAD。 |
| 其他 `transcription` 鍵 | 會被忽略，並記錄一行除錯記錄。 |
| Beta 版配置 | 接受 `input_audio_format: "pcm16"` 加上頂層 `input_audio_transcription` 與 `turn_detection`，以 24 kHz。不要在一次更新中混用這兩種配置。 |

| | 按住說話 | 伺服器 VAD |
| --- | --- | --- |
| `turn_detection` | `null` | 省略，或 `{"type": "server_vad"}` |
| 輪次邊界 | 每次提交一輪；您決定何時結束 | Google 偵測語句；每個語句都有自己的 `item_id` |
| 語音事件 | 無 | 每個語句周圍的 `input_audio_buffer.speech_started` 與 `speech_stopped` |
| 結束輪次 | `input_audio_buffer.commit`（或 `input_audio_buffer.end`）會結束輪次並產生 `completed`；下一個 `append` 會開始新的輪次 | 語句會自行完成；`commit` 或 `end` 會完成目前進行中的輪次 |

無效的 `session.update`（錯誤的編碼、聲道數、取樣率、工作階段類型、輪次偵測類型或不同模型）會以代碼 `1006` 關閉連線，且不會有 `error` 事件；原因會在除錯層級記錄為 `Error in client ack messages: ...`。無效的 base64 或 append 中奇數個 PCM 位元組也會以相同方式關閉

### 5. 串流音訊 {#5-stream-audio}

`input_audio_buffer.append` 會以設定的速率承載 base64 單聲道 PCM16。每個事件沒有大小限制；LiteLLM 會將音訊拆分為最多 25 KB 的 gRPC 請求，並在它們到達時直接轉送，不進行節流，因此檔案可比即時更快送出。`input_audio_buffer.clear` 會捨棄進行中的輪次，包括已送出的音訊與尚未完成的文字，且不會有任何事件。其他所有用戶端事件，包括 `response.create`，都會被丟棄

Google 會限制單次串流請求可執行的時間，因此 LiteLLM 會在某個串流開啟 240 秒後切換到新的串流。切換前會等到下一次語音停頓（Google 的語音活動結束），且最晚會在 280 秒時切換。按下即說模式的一次回合會跨越切換：目前為止的文字會保留，而在您的 `commit` 之後的 `completed` 會將整個回合保留在單一 `item_id` 中。使用伺服器 VAD 時，Google 會在舊串流關閉時完成截至當時已送出的音訊，因此在強制切換時仍在進行中的語句（從 240 到 280 秒的持續語音）會分成兩段，並以兩個 `item_id` 完成。計費秒數會跨串流累計

### 6. 讀取轉錄內容 {#6-read-transcripts}

| 事件 | 欄位 | 時機 |
| --- | --- | --- |
| `session.created` | `session.object: realtime.transcription_session`，預設工作階段 | 連線時 |
| `session.updated` | 標準化後的工作階段：沒有 `channels`，`model` 為 `chirp_3`，`language` 作為 BCP-47 標記（`en` 會變成 `en-US`）或不存在 | LiteLLM 接受您的 `session.update` 後 |
| `input_audio_buffer.speech_started` | `item_id` | 僅伺服器 VAD：Google 偵測到語音，或一回合的第一段轉錄文字到達時 |
| `conversation.item.input_audio_transcription.delta` | `item_id`、`content_index: 0`、`delta` | 自該回合前一個 delta 以來新增的字詞，包含中間結果 |
| `input_audio_buffer.speech_stopped` | `item_id` | 僅伺服器 VAD：Google 偵測到語句結束，或該回合完成時 |
| `conversation.item.input_audio_transcription.completed` | `item_id`、`content_index: 0`、`transcript`；當 Google 自前一個 `completed` 以來的音訊計費時則為 `usage: {"type": "duration", "seconds": 18.0}` | 伺服器 VAD：每個最終結果，包含持續語音期間的強制串流切換。按下即說：在 `commit` 或 `end` 之後 |
| `error` | `error.type: server_error`；`error.message` 為 `upstream websocket closed with code 1011: Google Speech-to-Text streaming failed: ...` | Google 的串流失敗；代理程式隨後以代碼 `1011` 關閉 |

delta 會逐字計算，忽略大小寫和標點，因此當 Google 修正先前的字詞時，delta 會從該字詞重新開始。請取自 `completed.transcript` 的最終文字，也就是 Google 的最終結果及其標點，而不是將各個 delta 串接。回合會以 `item_id` 進行關聯。工作階段在最後一個 `completed` 之後仍保持開啟，直到您關閉為止；代理程式只會在 Google 失敗後自行關閉

### 定價與用量 {#pricing-and-usage}

Chirp 依音訊秒數計費（模型成本對照表中的 `input_cost_per_second`）。`usage.seconds` 是 Google 自前一個 `completed` 以來計費的音訊，包含靜音，因此可能超過語句長度。在最後一個 `completed` 事件之後計費的音訊，例如尾端靜音，會在工作階段關閉時記錄為成本

除非關閉訊息記錄，否則轉錄內容會儲存在支出記錄的訊息中

### 防護欄 {#guardrails}

帶有 `mode: realtime_input_transcription` 的防護欄會在每個完成的轉錄上執行；請參閱[即時防護欄](/docs/proxy/guardrails/realtime_guardrails)。`completed` 事件會在防護欄執行前送達用戶端，而 delta 不會被檢查。可使用 `guardrails=name1,name2` 查詢參數，為每個連線選擇防護欄

:::warning
若設定了 `realtime_input_transcription` 防護欄，LiteLLM 會在工作階段設定前，將用戶端的 `turn_detection: null` 改寫為 `{"create_response": false}`，因此按下即說用戶端會以伺服器 VAD 模式執行：語句會自行完成，而 `input_audio_buffer.commit` 只會完成目前進行中的回合。伺服器 VAD 用戶端不受影響
:::

### OpenAI SDK 用戶端範例 {#example-openai-sdk-client}

按下即說：使用 OpenAI SDK 連線、完成設定，以 100 ms 區塊串流一個單聲道 PCM16 WAV 檔、提交，然後讀取事件直到最終轉錄內容到達

```python showLineNumbers title="Chirp push to talk client"
import asyncio
import base64
import wave

import os

from openai import AsyncOpenAI

client = AsyncOpenAI(base_url="http://localhost:4000/v1", api_key=os.environ["LITELLM_API_KEY"])


def pcm_chunks(path, chunk_ms=100):
    with wave.open(path) as w:
        rate, frames = w.getframerate(), w.readframes(w.getnframes())
    step = rate * 2 * chunk_ms // 1000
    return rate, [frames[i : i + step] for i in range(0, len(frames), step)]


async def main():
    rate, chunks = pcm_chunks("speech.wav")
    async with client.realtime.connect(model="chirp-3", extra_query={"intent": "transcription"}) as conn:
        await conn.session.update(
            session={
                "type": "transcription",
                "audio": {
                    "input": {
                        "format": {"type": "audio/pcm", "rate": rate},
                        "transcription": {"model": "chirp-3", "language": "en"},
                        "turn_detection": None,
                    }
                },
            }
        )
        for chunk in chunks:
            await conn.input_audio_buffer.append(audio=base64.b64encode(chunk).decode())
            await asyncio.sleep(0.1)
        await conn.input_audio_buffer.commit()
        async for event in conn:
            if event.type == "conversation.item.input_audio_transcription.delta":
                print(event.delta, end="", flush=True)
            elif event.type == "conversation.item.input_audio_transcription.completed":
                print(f"\n{event.transcript} ({event.usage.seconds} s)")
                break
            elif event.type == "error":
                print(event.error.message)
                break
            else:
                print(event.type)


asyncio.run(main())
```

```text
session.created
session.updated
what is the weather in Paris
What is the weather in Paris? (2.4 s)
```

對於伺服器 VAD，請改送 `"turn_detection": {"type": "server_vad"}`，而不是 `None`，並在麥克風開啟期間持續讀取事件：每個偵測到的語句都會連同自己的 `item_id` 一起到達並自行完成，而 `input_audio_buffer.commit` 會完成目前進行中的內容
