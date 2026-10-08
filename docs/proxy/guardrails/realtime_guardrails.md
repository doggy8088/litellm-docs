import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 即時 API 防護欄 {#realtime-api-guardrails}

透過在 LLM 回應之前攔截語音轉錄內容，來保護 [Realtime API](/docs/realtime) 中的語音對話。

## 運作方式 {#how-it-works}

Realtime API 是一個長時間存在的 WebSocket 連線。不同於 `/chat/completions` 中防護欄每個 HTTP 請求只會執行一次，語音工作階段有多個輪次，而且每一輪都需要單獨檢查。

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
  master_key: os.environ/LITELLM_MASTER_KEY
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
  { headers: { Authorization: "Bearer sk-<your-litellm-api-key>" } }
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
        additional_headers={"Authorization": "Bearer sk-<your-litellm-api-key>"},
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
3. OpenAI 的 TTS **會將警告朗讀** 回給使用者，例如 *"Content blocked: keyword 'system update' detected (Prompt injection attempt)"*

LLM 永遠不會處理注入的指令。

## 與其他防護欄提供者一起使用 {#using-with-other-guardrail-providers}

此 proxy 會透過提供者的 `apply_guardrail` 方法執行即時防護欄，但防護欄只有在其 `get_supported_event_hooks()` 中列出了該 hook 時，才能設定為 `mode: realtime_input_transcription`。目前只有 `litellm_content_filter` 宣告了這一點。在另一個提供者上設定該模式（例如僅支援 `pre_call`、`during_call` 和 `post_call` 的 `lakera_v2`）會在 proxy 啟動時驗證失敗：proxy 會記錄錯誤（`Skipping guardrail ... proxy is starting WITHOUT this guardrail`），並在沒有該防護欄的情況下啟動，因此即時工作階段會在未受保護的狀態下執行。設定 `LITELLM_STRICT_GUARDRAIL_MODES=false` 會將記錄降級為警告，但此模式仍不支援該防護欄。

若要為自訂防護欄新增即時支援，請在其 `get_supported_event_hooks()` 中加入 `GuardrailEventHooks.realtime_input_transcription`，並實作 `apply_guardrail`。

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
