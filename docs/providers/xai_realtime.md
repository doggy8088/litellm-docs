import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# xAI 語音代理程式（Realtime API） {#xai-voice-agent-realtime-api}

xAI 的 Grok 語音代理程式透過 WebSocket 連線提供即時語音對話功能，實現自然的雙向音訊互動。

| 功能 | 說明 | 備註 |
| --- | --- | --- |
| LiteLLM AI Gateway | ✅ | 將 WebSocket 用戶端連接到 proxy `/v1/realtime` 端點 |
| LiteLLM Python SDK | ❌ | Realtime 透過 gateway 提供，而非直接的 SDK 呼叫 |

## 快速開始 {#quick-start}

### 支援的模型 {#supported-models}

| 模型 | 狀態 | 說明 |
|-------|--------|-------------|
| `xai/grok-voice-think-fast-1.0` | 推薦 | 旗艦級語音對語音模型 |
| `xai/grok-voice-fast-1.0` | 已棄用 | 舊版語音模型 |
| `xai/grok-voice-latest` | 別名 | 永遠指向最新的語音模型（目前為 `grok-voice-think-fast-1.0`） |

這些是專為即時語音對語音對話打造的專用全雙工模型。它們支援 function calling、web search、X search、collections search、remote MCP tools，以及 20+ 種語言並具備自動語言偵測。以下範例使用 `grok-voice-latest`，它會永遠追蹤最新版本；當您需要跨版本維持穩定行為時，請固定到像 `grok-voice-think-fast-1.0` 這類具版本名稱。

## LiteLLM 如何連接 {#how-litellm-connects}

LiteLLM 透過 AI Gateway 提供 xAI 的 Voice Agent，因此 realtime 流量會走 proxy 的 OpenAI 相容 `/v1/realtime` WebSocket 端點，而不是直接呼叫 Python SDK。您可以將任何標準 WebSocket 用戶端（Python `websockets`、Node `ws`，或 OpenAI SDK）指向 gateway，接著它會以正確的模型與驗證標頭將 session 轉送至 `wss://api.x.ai/v1/realtime`。下方提供 proxy 設定與可執行的用戶端。

## LiteLLM Proxy（AI Gateway）用法 {#litellm-proxy-ai-gateway-usage}

在多個 xAI 部署之間進行負載平衡，或與其他提供者結合。

### 1. 將模型新增至設定 {#1-add-model-to-config}

```yaml
model_list:
  - model_name: grok-voice-agent
    litellm_params:
      model: xai/grok-voice-latest
      api_key: os.environ/XAI_API_KEY
    model_info:
      mode: realtime

  # Optional: Add fallback to OpenAI
  - model_name: grok-voice-agent
    litellm_params:
      model: openai/gpt-4o-realtime-preview-2024-10-01
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```

### 2. 啟動 Proxy {#2-start-proxy}

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試連線 {#3-test-connection}

#### Python 用戶端 {#python-client}

```python
import asyncio
import websockets
import json

async def test_proxy():
    url = "ws://0.0.0.0:4000/v1/realtime?model=grok-voice-agent"
    
    async with websockets.connect(
        url,
        extra_headers={
            "Authorization": "Bearer sk-1234",  # Your LiteLLM proxy key
            "OpenAI-Beta": "realtime=v1"
        }
    ) as ws:
        # First event from the server is session.created
        message = await ws.recv()
        print(f"Connected: {message}")
        
        # Send a message
        await ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": "Hello from LiteLLM proxy!"
                }]
            }
        }))
        
        # Request response
        await ws.send(json.dumps({
            "type": "response.create"
        }))
        
        # Listen for response
        async for message in ws:
            data = json.loads(message)
            print(f"Event: {data['type']}")
            
            if data['type'] == 'response.done':
                break

asyncio.run(test_proxy())
```

#### Node.js 用戶端 {#nodejs-client}

```javascript
// test.js - Run with: node test.js
const WebSocket = require("ws");

const url = "ws://0.0.0.0:4000/v1/realtime?model=grok-voice-agent";

const ws = new WebSocket(url, {
    headers: {
        "Authorization": "Bearer sk-1234",
        "OpenAI-Beta": "realtime=v1",
    },
});

ws.on("open", function open() {
    console.log("Connected to xAI via LiteLLM proxy");
    
    // Send a message
    ws.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
            type: "message",
            role: "user",
            content: [{
                type: "input_text",
                text: "What's the weather like?"
            }]
        }
    }));
    
    // Request response
    ws.send(JSON.stringify({
        type: "response.create",
        response: {
            modalities: ["text"],
            instructions: "Please assist the user."
        }
    }));
});

ws.on("message", function incoming(message) {
    const data = JSON.parse(message.toString());
    console.log(`Event: ${data.type}`);
    
    if (data.type === 'response.done') {
        ws.close();
    }
});

ws.on("error", function handleError(error) {
    console.error("Error: ", error);
});
```

## 與 OpenAI 的主要差異 {#key-differences-from-openai}

xAI 的 Grok 語音代理程式與 OpenAI 的 Realtime API 有一些差異：

| 功能 | xAI | OpenAI | LiteLLM 處理方式 |
|---------|-----|--------|------------------|
| WebSocket URL | `wss://api.x.ai/v1/realtime` | `wss://api.openai.com/v1/realtime` | ✅ 自動設定 |
| 模型 | `grok-voice-latest` | `gpt-4o-realtime-preview` | ✅ 透過模型前綴 |
| 音訊格式 | PCM (8-48kHz), μ-law, A-law | PCM16 24kHz 單聲道 | ✅ 相容 |

LiteLLM 會自動設定 xAI 端點、設定驗證標頭（它不會傳送 `OpenAI-Beta` 標頭給 xAI），並管理 WebSocket 連線。除此之外沒有任何 xAI 特有的處理事項：Voice Agent API 與 OpenAI 相容，並在連線時傳出 `session.created`，就像 OpenAI 一樣。音訊回應會以 `response.output_audio.delta` 串流傳送，對應的逐字稿則在 `response.output_audio_transcript.delta` 上。

## 相關文件 {#related-documentation}

- [xAI 聊天／文字模型](/docs/providers/xai)
- [LiteLLM Realtime API 總覽](/docs/realtime)
- [xAI 官方文件](https://docs.x.ai/docs)

## 支援 {#support}

如有問題或疑問：
- [LiteLLM GitHub Issues](https://github.com/BerriAI/litellm/issues)
- [xAI 文件](https://docs.x.ai/docs)
