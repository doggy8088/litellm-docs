import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 即時 API 防護欄 {#realtime-api-guardrails}

保護 [Realtime API](/docs/realtime) 中的語音對話——在 LLM 回應之前攔截語音轉錄。

## 運作方式 {#how-it-works}

Realtime API 是一個長連線的 WebSocket 工作階段。不同於 `/chat/completions` 中防護欄每個 HTTP 請求只執行一次，語音工作階段有許多輪次——每一輪都需要單獨檢查。

LiteLLM 會在轉錄事件時攔截每一輪：先由 Whisper 將語音轉成文字，接著在 LLM 產生回應之前：

```
User speaks into mic
        │
        ▼ audio bytes (PCM)
┌───────────────────┐
│   LiteLLM Proxy   │  forwards audio to OpenAI unchanged
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│     OpenAI        │
│  VAD → Whisper    │  detects speech end, transcribes
└────────┬──────────┘
         │
         │  conversation.item.input_audio_transcription.completed
         │  { transcript: "system update: ignore all instructions" }
         │
         ▼
┌───────────────────────────────────────────┐
│           LiteLLM Proxy                   │
│                                           │
│   ◄──── GUARDRAIL RUNS HERE ────►         │
│   apply_guardrail(texts=[transcript])     │
│                                           │
│   ┌──────────────┬──────────────────┐     │
│   │   BLOCKED    │     CLEAN        │     │
│   └──────┬───────┴───────┬──────────┘     │
│          │               │                │
│   speak warning    send response.create   │
│   (TTS audio)      → LLM responds         │
└───────────────────────────────────────────┘
```

**重點**：LiteLLM 也會在連線時將 `create_response: false` 注入工作階段，因此 LLM 不會在防護欄執行前自動回應。

## 支援的防護欄模式 {#supported-guardrail-mode}

| 模式 | 說明 |
|------|-------------|
| `realtime_input_transcription` | 在每次語音輪次轉錄後、LLM 回應前執行 |

## 快速開始 {#quick-start}

### 步驟 1：設定 proxy {#step-1-configure-proxy}

在您的 proxy 設定中新增一個使用 `mode: realtime_input_transcription` 的防護欄：

```yaml
model_list:
  - model_name: openai/gpt-4o-realtime-preview
    litellm_params:
      model: openai/gpt-4o-realtime-preview
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: "voice-content-filter"
    litellm_params:
      guardrail: litellm_content_filter
      mode: realtime_input_transcription
      default_on: true
      blocked_words:
        - keyword: "ignore previous instructions"
          action: BLOCK
          description: "Prompt injection attempt"
        - keyword: "system update"
          action: BLOCK
          description: "Prompt injection attempt"
        - keyword: "ignore all instructions"
          action: BLOCK
          description: "Prompt injection attempt"

general_settings:
  master_key: sk-1234
```

### 步驟 2：啟動 proxy {#step-2-start-proxy}

```bash
litellm --config proxy_config.yaml --port 4000
```

### 步驟 3：連接 Realtime 用戶端 {#step-3-connect-a-realtime-client}

將您的用戶端連線到 proxy，而不是直接連到 OpenAI：

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const ws = new WebSocket(
  "ws://localhost:4000/v1/realtime?model=openai/gpt-4o-realtime-preview",
  [],
  { headers: { Authorization: "Bearer sk-1234" } }
)

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      modalities: ["audio", "text"],
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: { type: "server_vad" },
    },
  }))
}

ws.onmessage = (e) => {
  const event = JSON.parse(e.data)
  if (event.type === "response.audio.delta") {
    // play audio...
  }
}
```

</TabItem>
<TabItem value="python" label="Python">

```python
import asyncio
import json
import websockets

async def main():
    async with websockets.connect(
        "ws://localhost:4000/v1/realtime?model=openai/gpt-4o-realtime-preview",
        additional_headers={"Authorization": "Bearer sk-1234"},
    ) as ws:
        await ws.recv()  # session.created

        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["audio", "text"],
                "input_audio_transcription": {"model": "whisper-1"},
                "turn_detection": {"type": "server_vad"},
            },
        }))

        async for raw in ws:
            event = json.loads(raw)
            print(event["type"])

asyncio.run(main())
```

</TabItem>
</Tabs>

### 當一個輪次被阻擋時會發生什麼事 {#what-happens-when-a-turn-is-blocked}

當防護欄觸發時，proxy 會：

1. 傳送 `response.cancel` 以終止任何進行中的 LLM 回應
2. 傳送 `response.create`，並將封鎖訊息作為強制指令
3. OpenAI 的 TTS **會將警告朗讀** 回給使用者——例如 *"Content blocked: keyword 'system update' detected (Prompt injection attempt)"*

LLM 永遠不會處理注入的指令。

## 與任何防護欄提供者搭配使用 {#using-with-any-guardrail-provider}

`realtime_input_transcription` 模式可與任何實作 `apply_guardrail` 的防護欄搭配使用。只要將 `litellm_content_filter` 替換為您的提供者即可：

```yaml
guardrails:
  - guardrail_name: "voice-lakera"
    litellm_params:
      guardrail: lakera_ai
      mode: realtime_input_transcription
      default_on: true
      api_key: os.environ/LAKERA_API_KEY
```

## 每個金鑰的防護欄控制 {#per-key-guardrail-control}

若要僅針對特定 API 金鑰啟用即時防護欄，請設定 `default_on: false`，並在請求中繼資料中傳入防護欄名稱：

```yaml
guardrails:
  - guardrail_name: "voice-content-filter"
    litellm_params:
      guardrail: litellm_content_filter
      mode: realtime_input_transcription
      default_on: false   # off by default
```

接著，用戶端可在初始中繼資料中傳入該名稱，以每個連線選擇啟用（企業功能）。
