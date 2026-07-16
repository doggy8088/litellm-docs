# Vertex AI Gemini Live - 即時 API {#vertex-ai-gemini-live---realtime-api}

透過 LiteLLM 的統一 `/realtime` 端點使用 Vertex AI 的 Gemini Live API（BidiGenerateContent），其採用 OpenAI Realtime 通訊協定。

| 功能 | 支援 |
|---------|-----------|
| Proxy (`/realtime`) | ✅ |
| 語音輸入 / 語音輸出 | ✅ |
| 文字輸入 / 文字輸出 | ✅ |
| 伺服器端 VAD | ✅ |
| 輸出轉錄 | ✅ |

## 設定 {#setup}

### 1. 驗證 {#1-auth}

LiteLLM 使用您的 Google Cloud 認證（OAuth2 Bearer token），而不是 API key。

```bash
gcloud auth application-default login
```

或者設定 service-account 金鑰檔案：

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa-key.json
```

### 2. Proxy 設定 {#2-proxy-config}

```yaml
model_list:
  - model_name: vertex-gemini-live
    litellm_params:
      model: vertex_ai/gemini-2.0-flash-live-001
      vertex_project: your-gcp-project-id
      vertex_location: us-east4   # or any supported region, or "global"

general_settings:
  master_key: sk-your-key
```

### 3. 啟動 Proxy {#3-start-the-proxy}

```bash
litellm --config config.yaml --port 4000
```

## 使用方式 {#usage}

### Python（websockets） {#python-websockets}

```python
import asyncio
import json
import websockets

PROXY_URL = "ws://localhost:4000/realtime?model=vertex-gemini-live"
API_KEY = "sk-your-key"

async def main():
    async with websockets.connect(
        PROXY_URL,
        additional_headers={"api-key": API_KEY},
    ) as ws:
        # Wait for session.created
        event = json.loads(await ws.recv())
        print(f"session.created: {event['session']['id']}")

        # Send a text message
        await ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "Say hello in one sentence."}],
            },
        }))

        # Collect the response
        async for raw in ws:
            ev = json.loads(raw)
            t = ev.get("type", "")
            if t == "response.text.delta":
                print(ev.get("delta", ""), end="", flush=True)
            elif t == "response.done":
                print("\n[done]")
                break

asyncio.run(main())
```

### Node.js {#nodejs}

```js
const WebSocket = require("ws");

const ws = new WebSocket(
  "ws://localhost:4000/realtime?model=vertex-gemini-live",
  { headers: { "api-key": "sk-your-key" } }
);

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "Say hello." }],
    },
  }));
});

ws.on("message", (data) => {
  const ev = JSON.parse(data);
  if (ev.type === "response.text.delta") process.stdout.write(ev.delta);
  if (ev.type === "response.done") ws.close();
});
```

### OpenAI SDK（Python） {#openai-sdk-python}

```python
import asyncio
from openai import AsyncOpenAI

client = AsyncOpenAI(
    base_url="http://localhost:4000",
    api_key="sk-your-key",
)

async def main():
    async with client.beta.realtime.connect(
        model="vertex-gemini-live"
    ) as conn:
        await conn.session.update(session={"modalities": ["text"]})

        await conn.conversation.item.create(
            item={
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "Say hello."}],
            }
        )

        async for event in conn:
            if event.type == "response.text.delta":
                print(event.delta, end="", flush=True)
            elif event.type == "response.done":
                print()
                break

asyncio.run(main())
```

## 語音輸入 / 語音輸出 {#voice-in--voice-out}

完整的語音範例請參閱 [`voice_realtime_test.py`](https://github.com/BerriAI/litellm/blob/main/voice_realtime_test.py)。

音訊的關鍵設定：
- 麥克風輸入：**16 kHz** PCM16 (`audio/pcm;rate=16000`)
- 喇叭輸出：**24 kHz** PCM16（Vertex AI 會以 24 kHz 回傳音訊）
- 預設啟用伺服器端 VAD，靜音閾值為 800 ms

```python
# session.update with server VAD — the proxy ignores this for Vertex AI
# because VAD is already configured in the initial setup message.
await ws.send(json.dumps({
    "type": "session.update",
    "session": {
        "modalities": ["audio"],
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 800},
    },
}))
```

## 工具呼叫 {#tool-calling}

```python
import asyncio
import json
import websockets

PROXY_URL = "ws://localhost:4000/v1/realtime?model=vertex-gemini-live"

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "unit": {"type": "string", "enum": ["fahrenheit", "celsius"]},
                },
                "required": ["location"],
            },
        },
    }
]


def get_weather(location: str, unit: str = "fahrenheit") -> dict:
    return {
        "location": location,
        "temperature": 72 if unit == "fahrenheit" else 22,
        "unit": unit,
        "conditions": "sunny",
    }


TOOL_FUNCTIONS = {"get_weather": get_weather}


async def main():
    async with websockets.connect(
        PROXY_URL,
        additional_headers={
            "Authorization": "Bearer sk-1234",
            "X-Serverless-Authorization": "Bearer sk-1234",
        },
    ) as ws:
        _ = json.loads(await ws.recv())  # session.created

        # Required for tool calling: send tools in session.update
        await ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "instructions": "Use get_weather for weather questions.",
                        "modalities": ["audio"],
                        "tools": TOOLS,
                    },
                }
            )
        )

        await ws.send(
            json.dumps(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": "What's the weather in San Francisco?"}
                        ],
                    },
                }
            )
        )
        await ws.send(json.dumps({"type": "response.create"}))

        async for raw in ws:
            ev = json.loads(raw)
            t = ev.get("type", "")

            if t == "response.text.delta":
                print(ev.get("delta", ""), end="", flush=True)
            elif t == "response.function_call_arguments.done":
                fn_name = ev.get("name", "")
                call_id = ev.get("call_id", "")
                args = json.loads(ev.get("arguments", "{}"))
                result = TOOL_FUNCTIONS[fn_name](**args)

                await ws.send(
                    json.dumps(
                        {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps(result),
                            },
                        }
                    )
                )
                await ws.send(json.dumps({"type": "response.create"}))
            elif t == "response.done":
                print("\n[done]")
                break
            elif t == "error":
                print(ev)
                break


if __name__ == "__main__":
    asyncio.run(main())
```

### 設定 + 執行 {#config--run}

```yaml
model_list:
  - model_name: vertex-gemini-live
    litellm_params:
      model: vertex_ai/gemini-live-2.5-flash-native-audio
      vertex_project: your-gcp-project-id
      vertex_location: us-central1

litellm_settings:
  # Required for tool calling with Gemini/Vertex Live:
  # defer setup until client sends session.update (with tools)
  gemini_live_defer_setup: true
```

```bash
litellm --config config.yaml --port 4000
python test_realtime_tool_calling.py
```

## 支援的 OpenAI Realtime 事件 {#supported-openai-realtime-events}

**用戶端 → Proxy（→ Vertex AI）**

| OpenAI 事件 | 備註 |
|---|---|
| `input_audio_buffer.append` | 轉送為 `realtime_input.audio` |
| `conversation.item.create` | 轉送為 `realtime_input.text` |
| `session.update` | 靜默忽略 — Vertex AI 不支援會話中途重新設定 |
| `response.create` | 靜默忽略 — Vertex AI 會在每個回合後自動回應 |

**Vertex AI → Proxy（→ 用戶端）**

| 發出的 OpenAI 事件 | Vertex AI 來源 |
|---|---|
| `session.created` | 在 `setupComplete` 後合成 |
| `response.text.delta` | `serverContent.modelTurn.parts[].text` |
| `response.audio.delta` | `serverContent.modelTurn.parts[].inlineData` |
| `response.audio_transcript.delta` | `serverContent.outputTranscription.text` |
| `conversation.item.input_audio_transcription.completed` | `serverContent.inputTranscription.text` |
| `response.done` | `serverContent.turnComplete` |

## 限制 {#limitations}

- `session.update` 不會被轉送（Vertex AI 每個連線只接受一則設定訊息）。
- 音訊轉錄需要在初始設定中設定 `outputAudioTranscription: {}`（LiteLLM 會自動完成）。

## 注意事項 {#precaution}

- 工具呼叫取決於搭配 `tools` 的 `session.update`。
- 如果您略過 `session.update`，就不會觸發工具呼叫。
- 為了向後相容，`gemini_live_defer_setup` 預設為 `false`。
