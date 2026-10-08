import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Meta 模型 API {#meta-model-api}

| 屬性 | 詳細資訊 |
|-------|-------|
| 描述 | Meta 的 Model API 提供對 Muse Spark 推理模型與 Muse Voice 轉錄的存取。 |
| LiteLLM 上的提供者路由 | `meta/` |
| 支援的端點 | `/chat/completions`, `/responses`, `/v1/messages`, `/v1/realtime` |
| 開發者入口網站 | [Meta Model API ↗](https://dev.meta.ai/) |
| 語音轉文字參考 | [Muse Voice 轉錄 ↗](https://dev.meta.ai/docs/speech-to-text) |

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["META_API_KEY"] = ""  # your Meta Model API key
```

Chat、Responses 和 Messages 請求預設會送到 `https://api.meta.ai/v1`；設定 `META_API_BASE` 可覆寫該 base。Muse Voice realtime 使用相同的 `META_API_KEY` 並連線到 `wss://api.meta.ai/v1/asr/realtime`；請參閱 [Muse Voice Realtime Transcription](#muse-voice-realtime-transcription) 了解如何將其指向其他位置。

## 支援的模型 {#supported-models}

:::info
我們會持續維護模型、價格、token 視窗等清單。[請見此處](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。
:::

| Model ID | 輸入上下文長度 | 輸入模態 | 輸出模態 |
| --- | --- | --- | --- |
| `muse-spark-1.1` | 1M | 文字、圖片、影片、PDF | 文字 |
| `muse-voice-transcribe-1.0` | N/A | 音訊 | 文字 |

`muse-spark-1.1` 支援 function calling、parallel function calling、structured outputs、prompt caching、web search grounding，以及透過 `reasoning_effort`（`"minimal"` 到 `"xhigh"`）進行 reasoning。

`muse-voice-transcribe-1.0` 是一個透過 proxy 的 `/v1/realtime` WebSocket 提供的即時語音轉文字模型，按音訊秒數計費。它僅支援即時：不支援 `/v1/audio/transcriptions` 及其他批次或檔案轉錄端點。

此 API 也原生公開 Anthropic Messages 格式，因此 LiteLLM 會將 `/v1/messages` 請求未經翻譯地轉送至 `https://api.meta.ai/v1/messages`，並保留 Anthropic 專屬功能，例如 thinking blocks。

## Muse Voice Realtime Transcription {#muse-voice-realtime-transcription}

LiteLLM 透過 proxy 相容 OpenAI 的 `/v1/realtime` 端點提供 Muse Voice。用戶端使用 OpenAI Realtime 轉錄協定；LiteLLM 會將其 PCM16 音訊以二進位框架串流到 `wss://api.meta.ai/v1/asr/realtime`，並將 Muse 的轉錄框架映射回 OpenAI 事件。下方的 [Python 範例](#example-python-client) 是一個完整的 push to talk 工作階段。

### 1. 將模型加入您的設定 {#1-add-the-model-to-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: muse-voice-transcribe
    litellm_params:
      model: meta/muse-voice-transcribe-1.0
      api_key: os.environ/META_API_KEY
```

`api_key` 會備援到 `META_API_KEY`。`api_base` 為選用項目，且必須是絕對的 `wss://` 或 `https://` URL；LiteLLM 會保留其主機與埠，並以 `/v1/asr/realtime` 取代路徑。`http://`、`ws://`、內嵌憑證與 URL 片段會被拒絕，而 `META_API_BASE` 會在 realtime 工作階段中被忽略。

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 2. 連線 {#2-connect}

```text
ws://localhost:4000/v1/realtime?model=muse-voice-transcribe&intent=transcription
```

使用 `Authorization: Bearer <proxy key>` 驗證。`model` 是您設定中的 `model_name`，且為必要；僅有 `intent=transcription` 會路由到 proxy 的預設 OpenAI 轉錄模型。`intent=transcription` 會將工作階段設為僅轉錄，並將 `session.update` 中命名的任何模型鎖定為您獲授權使用的模型。

LiteLLM 在連線到 Meta 後、Muse 握手之前，會發出帶有 `object: realtime.transcription_session` 的 `session.created`。

### 3. 設定工作階段 {#3-configure-the-session}

送出一個 `session.update`（或 `transcription_session.update`）。Muse 的確認會以 `session.updated` 傳回，之後任何更新都會被忽略。在 `session.updated` 之前送出的音訊會被緩衝並重播，因此您可以立即開始串流。

```json showLineNumbers title="session.update"
{
  "type": "session.update",
  "session": {
    "type": "transcription",
    "audio": {
      "input": {
        "format": {"type": "audio/pcm", "rate": 24000, "channels": 1},
        "transcription": {"model": "meta/muse-voice-transcribe-1.0", "language": "en"},
        "turn_detection": null
      }
    }
  }
}
```

| 欄位 | 規則 |
| --- | --- |
| `format` | `type` 必須是 `audio/pcm`，`rate` 必須是 `16000` 或 `24000`，`channels` 必須是 `1`。若省略則代表單聲道 24 kHz。 |
| `transcription.model` | 選用。搭配 `intent=transcription` 時，proxy 會以 `muse-voice-transcribe-1.0` 取代；若沒有它，則只接受 `muse-voice-transcribe-1.0` 或 `meta/muse-voice-transcribe-1.0`。 |
| `transcription.language` | 對某一語言的選用偏好，可用名稱或 ISO 639 代碼。會忽略地區尾碼，因此 `en-US`、`zh-Hans` 和 `pt-BR` 都可運作。 |
| `turn_detection` | 選擇模式（如下表）。除 `server_vad` 之外的任何 `type` 都會被拒絕；沒有 `type` 的物件代表 server VAD。 |
| 其他任何內容 | 會在 proxy 記錄中以警告方式丟棄。 |
| Beta 版佈局 | 接受 `input_audio_format: "pcm16"` 加上 `input_audio_transcription`，採 24 kHz。請勿在單一更新中混用兩種佈局。 |

支援的語言：Arabic、Bengali、Dutch、English、French、German、Hebrew、Hindi、Indonesian、Italian、Japanese、Kannada、Korean、Malay、Mandarin Chinese、Marathi、Polish、Portuguese、Spanish、Tagalog、Tamil、Telugu、Thai、Turkish 和 Vietnamese。

| | Push to talk | Server VAD |
| --- | --- | --- |
| `turn_detection` | `null` | omitted，或 `{"type": "server_vad"}` |
| Turn 邊界 | 每個工作階段一個 turn；由您決定何時結束 | Muse 偵測到語句；每個都會取得自己的 `item_id` |
| 結束 turn | `input_audio_buffer.commit` 會 flush 緩衝音訊並結束 Muse 串流 | `input_audio_buffer.commit` 只會 flush；完成時請送出 `input_audio_buffer.end` |

無效的 `session.update`（錯誤的取樣率、聲道數、turn 偵測類型或語言）會以代碼 `1006` 關閉連線，且不會有 `error` 事件；原因會以 debug 等級記錄為 `Error in client ack messages: ...`。設定之後的協定違規，例如 append 超過四秒、無效的 base64 或奇數個 PCM 位元組，會以相同方式關閉。

### 4. 串流音訊 {#4-stream-audio}

`input_audio_buffer.append` 會以設定的速率傳送 base64 單聲道 PCM16，每個事件最多四秒。LiteLLM 會將音訊重新封裝為 80 ms 的二進位框架，並即時節流傳送給 Muse。`input_audio_buffer.clear` 會丟棄 LiteLLM 仍持有的部分框架；已送至 Muse 的音訊無法召回。其他所有用戶端事件，包括 `response.create`，都會被丟棄。

Server VAD 需要音訊持續即時到達。暫停時請串流靜音，並在完成時送出 `input_audio_buffer.end`（LiteLLM 事件，不屬於 OpenAI 協定）。如果用戶端只是停止送出，Meta 會以代碼 `1008`（`Ingress below real-time`）關閉，proxy 會將其轉送為 `error` 事件，接著是 `1008` 關閉。

### 5. 讀取轉錄 {#5-read-transcripts}

| 事件 | 欄位 | 時機 |
| --- | --- | --- |
| `session.created` | `session.object: realtime.transcription_session` | 連線時，在 Muse 握手之前 |
| `session.updated` | 標準化的工作階段：沒有 `channels`，`model` 是 `muse-voice-transcribe-1.0`，`language` 是完整名稱（`en` 變成 `English`） | Muse 接受您的 `session.update` 後 |
| `input_audio_buffer.speech_started` | `item_id` | Muse 偵測到一個 turn 的開始 |
| `conversation.item.input_audio_transcription.delta` | `item_id`、`content_index: 0`、`delta` | 部分轉錄文字 |
| `input_audio_buffer.speech_stopped` | `item_id` | Muse 偵測到一個 turn 的結束 |
| `conversation.item.input_audio_transcription.completed` | `item_id`、`content_index: 0`、`transcript`；當 Muse 自前一個 `completed` 之後處理了新音訊時，`usage: {"type": "duration", "seconds": 1.36}` | 該 turn 的最終轉錄 |
| `error` | `error.type: server_error`；`error.message` 是 `Meta Muse realtime transcription failed`，或在非 1000 關閉前出現 `upstream websocket closed with code <N>: <reason>` | Muse 回報失敗或異常關閉 |

turn 可能重疊，並以 `item_id` 進行關聯。當 Muse 沒有更多段落時，會以代碼 `1000` 關閉，通常原因是 `No more transcript segments`，proxy 會轉送該關閉。

### 定價與用量 {#pricing-and-usage}

Muse Voice 按輸入音訊秒數計費（模型成本對照表中的 `input_cost_per_second`）。`usage.seconds` 是 Muse 自上一個計費點以來處理過的音訊，包含靜音，因此可能超過語句長度。在最後一個 `completed` 事件之後的音訊，例如尾端靜音，會在工作階段關閉時計費。

轉錄內容會儲存在支出記錄的 messages 中，除非已關閉訊息記錄。proxy 記錄不會保留轉錄文字，只有被防護欄阻擋的轉錄前 80 個字元會以 warning 等級記錄。

### 防護欄 {#guardrails}

帶有 `mode: realtime_input_transcription` 的防護欄會在每個完成的轉錄上執行；請參閱[即時防護欄](/docs/proxy/guardrails/realtime_guardrails)。`completed` 事件會在防護欄執行前先送達用戶端，而且不會檢查增量內容。封鎖會送出帶有 `type: guardrail_violation` 和 `code: content_policy_violation` 的 `error` 事件；`on_violation: end_session` 也會以代碼 `1000` 關閉 socket。

可透過 `guardrails=name1,name2` 查詢參數為每個連線選擇防護欄。

:::warning
啟用 `realtime_input_transcription` 防護欄時，LiteLLM 會在 Muse 看見之前，將用戶端的 `turn_detection: null` 改寫為 `{"create_response": false}`，因此按下說話用戶端會以伺服器 VAD 模式執行：`input_audio_buffer.commit` 不再結束串流，而停止串流的用戶端會以代碼 `1008` 中斷連線。伺服器 VAD 用戶端不受影響。
:::

### Python 用戶端範例 {#example-python-client}

按下說話：完成設定，以 100 ms 分段串流單聲道 PCM16 WAV 檔案，提交，然後讀取事件直到 proxy 關閉 socket。

```python showLineNumbers title="Muse Voice push to talk client"
import asyncio
import base64
import json
import wave

import os
import websockets

URL = "ws://localhost:4000/v1/realtime?model=muse-voice-transcribe&intent=transcription"
HEADERS = {"Authorization": f'Bearer {os.environ["LITELLM_API_KEY"]}'}


def pcm_chunks(path, chunk_ms=100):
    with wave.open(path) as w:  # mono PCM16 at 16 kHz or 24 kHz
        rate, frames = w.getframerate(), w.readframes(w.getnframes())
    step = rate * 2 * chunk_ms // 1000
    return rate, [frames[i : i + step] for i in range(0, len(frames), step)]


async def main():
    rate, chunks = pcm_chunks("question.wav")
    async with websockets.connect(URL, additional_headers=HEADERS) as ws:
        print(json.loads(await ws.recv())["type"])  # session.created
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "type": "transcription",
                "audio": {
                    "input": {
                        "format": {"type": "audio/pcm", "rate": rate},
                        "transcription": {"model": "meta/muse-voice-transcribe-1.0"},
                        "turn_detection": None,
                    }
                },
            },
        }))
        print(json.loads(await ws.recv())["type"])  # session.updated
        for chunk in chunks:
            await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": base64.b64encode(chunk).decode()}))
            await asyncio.sleep(0.1)
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        try:
            while True:
                event = json.loads(await ws.recv())
                if event["type"] == "conversation.item.input_audio_transcription.delta":
                    print(event["delta"], end="", flush=True)
                elif event["type"] == "conversation.item.input_audio_transcription.completed":
                    seconds = event.get("usage", {}).get("seconds")  # absent when Muse reported no new audio
                    print(f"\n{event['transcript']} ({seconds} s)")
        except websockets.exceptions.ConnectionClosedOK:
            pass  # close code 1000: no more transcript segments


asyncio.run(main())
```

```text
session.created
session.updated
What is the weather in Paris?
What is the weather in Paris? (1.36 s)
```

對於伺服器 VAD，請傳送 `"turn_detection": {"type": "server_vad"}` 而不是 `None`，在麥克風開啟期間持續串流（包括靜音），最後以 `{"type": "input_audio_buffer.end"}` 結束。每個偵測到的語句都會連同其各自的 `item_id` 一併送達。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Meta Model API Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(model="meta/muse-spark-1.1", messages=messages)
```

### 串流 {#streaming}

```python showLineNumbers title="Meta Model API Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 推理努力程度 {#reasoning-effort}

`muse-spark-1.1` 接受 `reasoning_effort` 值 `"minimal"`、`"low"`、`"medium"`、`"high"`，以及 `"xhigh"`。

```python showLineNumbers title="Meta Model API Reasoning Effort"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "What is 15% of 2840?", "role": "user"}]

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    reasoning_effort="xhigh"
)

print(response.choices[0].message.content)
print(response.usage.completion_tokens_details.reasoning_tokens)
```

### 函式呼叫 {#function-calling}

```python showLineNumbers title="Meta Model API Function Calling"
import os
import litellm
from litellm import completion

os.environ["META_API_KEY"] = ""  # your Meta Model API key

messages = [{"content": "What's the weather like in San Francisco?", "role": "user"}]

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"]
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = completion(
    model="meta/muse-spark-1.1",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

print(response.choices[0].message.tool_calls)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請將以下內容加入您的 LiteLLM Proxy 設定文件：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: muse-spark-1.1
    litellm_params:
      model: meta/muse-spark-1.1
      api_key: os.environ/META_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Meta Model API via Proxy - Non-streaming"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

response = client.chat.completions.create(
    model="muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    reasoning_effort="minimal"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Meta Model API via Proxy - Streaming"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

response = client.chat.completions.create(
    model="muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Meta Model API via Proxy - LiteLLM SDK"
import litellm

response = litellm.completion(
    model="litellm_proxy/muse-spark-1.1",
    messages=[{"role": "user", "content": "Write a short poem about AI."}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Meta Model API via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "muse-spark-1.1",
    "messages": [{"role": "user", "content": "Write a short poem about AI."}],
    "reasoning_effort": "minimal"
  }'
```

</TabItem>
</Tabs>

### Anthropic 訊息 API {#anthropic-messages-api}

Proxy 的 `/v1/messages` 路由會將 `meta/` 模型的請求轉送至 Meta 原生相容 Anthropic 的端點，且不經翻譯。

```bash showLineNumbers title="Meta Model API via Proxy - /v1/messages"
curl http://localhost:4000/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "muse-spark-1.1",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": "Write a short poem about AI."}]
  }'
```
