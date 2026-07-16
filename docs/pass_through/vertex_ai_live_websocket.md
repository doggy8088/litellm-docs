# Vertex AI Live API WebSocket 直通 {#vertex-ai-live-api-websocket-passthrough}

LiteLLM 現在支援 Vertex AI Live API 的 WebSocket 直通，讓您能與 Gemini 模型進行即時雙向通訊。

## 總覽 {#overview}

Vertex AI Live API WebSocket 直通可讓您：
- 透過 LiteLLM proxy 連線至 Vertex AI Live API
- 使用既有的 Vertex AI 驗證方法
- 雙向透過所有 WebSocket 訊息
- 支援文字、音訊、影片與多模態互動
- 自動追蹤所有使用類型的成本

## 設定 {#configuration}

### 環境變數 {#environment-variables}

請設定以下環境變數以進行 Vertex AI 驗證：

```bash
# Required
DEFAULT_VERTEXAI_PROJECT=your-project-id
DEFAULT_VERTEXAI_LOCATION=us-central1

# Optional - use one of these for authentication
DEFAULT_GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR run: gcloud auth application-default login
```

### 設定檔 {#configuration-file}

或者，請在您的 `config.yaml` 中設定：

```yaml
litellm_settings:
  default_vertex_config:
    vertex_project: "your-project-id"
    vertex_location: "us-central1"
    vertex_credentials: "os.environ/GOOGLE_APPLICATION_CREDENTIALS"
```

## 用法 {#usage}

### WebSocket 端點 {#websocket-endpoints}

- `ws://your-proxy-host/v1/vertex-ai/live`
- `ws://your-proxy-host/vertex-ai/live`

### 查詢參數 {#query-parameters}

- `project_id`（選用）：Google Cloud 專案 ID（可在設定中指定）
- `location`（選用）：Vertex AI 位置（可在設定中指定，預設：us-central1）

### 連線範例 {#example-connection}

```javascript
// If project_id and location are set in config, you can connect without query params
const ws = new WebSocket('ws://localhost:4000/v1/vertex-ai/live');

// Or specify them explicitly
const ws = new WebSocket('ws://localhost:4000/v1/vertex-ai/live?project_id=your-project-id&location=us-central1');
```

## 成本追蹤 {#cost-tracking}

WebSocket 直通會根據 [Vertex AI 定價](https://cloud.google.com/vertex-ai/generative-ai/pricing#model-optimizer-pricing) 自動追蹤所有使用類型的成本：

### 支援的成本追蹤 {#supported-cost-tracking}

- **文字**：依模型而定，按字元計費或按 token 計費
- **音訊**：音訊輸入/輸出的每秒計費
- **影片**：影片輸入的每秒計費
- **圖片**：圖片輸入的每張計費

### 成本計算 {#cost-calculation}

成本計算方式與 LiteLLM 中其他 Vertex AI 模型相同：
- Gemini 模型使用 `cost_per_character`
- 合作夥伴模型（Claude、Llama 等）使用 `cost_per_token`
- 適用時包含音訊、影片與圖片成本

### 成本記錄 {#cost-logging}

成本會自動記錄到：
- LiteLLM proxy 記錄
- 資料庫（若已設定）
- 支出追蹤系統
- 管理儀表板

記錄輸出範例：
```
Vertex AI Live WebSocket session cost: $0.001234 (input: $0.000800, output: $0.000434) tokens: 150, characters: 1200, duration: 45.2s
```

## API 參考 {#api-reference}

### 設定訊息 {#setup-message}

請先傳送此訊息以初始化工作階段：

```json
{
  "setup": {
    "model": "projects/your-project-id/locations/us-central1/publishers/google/models/gemini-2.0-flash-live-preview-04-09",
    "generation_config": {
      "response_modalities": ["TEXT"]
    }
  }
}
```

### 文字輸入 {#text-input}

```json
{
  "client_content": {
    "turns": [
      {
        "role": "user",
        "parts": [{"text": "Hello! How are you?"}]
      }
    ],
    "turn_complete": true
  }
}
```

### 音訊輸入 {#audio-input}

```json
{
  "realtime_input": {
    "media_chunks": [
      {
        "data": "base64-encoded-audio-data",
        "mime_type": "audio/pcm"
      }
    ]
  }
}
```

## 支援的功能 {#supported-features}

### 回應模態 {#response-modalities}

- **TEXT**：文字回應
- **AUDIO**：具備語音合成的音訊回應

### 工具 {#tools}

- **函式呼叫**：定義並使用自訂函式
- **程式碼執行**：執行 Python 程式碼
- **Google 搜尋**：搜尋網路
- **語音活動偵測**：偵測使用者何時正在說話

### 進階功能 {#advanced-features}

- **音訊轉錄**：轉錄輸入與輸出音訊
- **主動式音訊**：模型僅在相關時回應
- **情感對話**：理解情緒表達

## 範例 {#examples}

### Python 用戶端 {#python-client}

```python
import asyncio
import json
import websockets

async def chat_with_gemini():
    uri = "ws://localhost:4000/v1/vertex-ai/live?project_id=your-project-id"
    
    async with websockets.connect(uri) as websocket:
        # Setup
        setup = {
            "setup": {
                "model": "projects/your-project-id/locations/us-central1/publishers/google/models/gemini-2.0-flash-live-preview-04-09",
                "generation_config": {"response_modalities": ["TEXT"]}
            }
        }
        await websocket.send(json.dumps(setup))
        
        # Wait for setup response
        response = await websocket.recv()
        print(f"Setup: {response}")
        
        # Send message
        message = {
            "client_content": {
                "turns": [{"role": "user", "parts": [{"text": "Hello!"}]}],
                "turn_complete": True
            }
        }
        await websocket.send(json.dumps(message))
        
        # Receive response
        async for response in websocket:
            print(f"Response: {response}")
            # Check if turn is complete
            data = json.loads(response)
            if data.get("serverContent", {}).get("turnComplete"):
                break

asyncio.run(chat_with_gemini())
```

### JavaScript 用戶端 {#javascript-client}

```javascript
const ws = new WebSocket('ws://localhost:4000/v1/vertex-ai/live?project_id=your-project-id');

ws.onopen = function() {
    // Send setup
    const setup = {
        setup: {
            model: "projects/your-project-id/locations/us-central1/publishers/google/models/gemini-2.0-flash-live-preview-04-09",
            generation_config: { response_modalities: ["TEXT"] }
        }
    };
    ws.send(JSON.stringify(setup));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    // Check if setup is complete
    if (data.setupComplete) {
        // Send a message
        const message = {
            client_content: {
                turns: [{ role: "user", parts: [{ text: "Hello!" }] }],
                turn_complete: true
            }
        };
        ws.send(JSON.stringify(message));
    }
};
```

## 錯誤處理 {#error-handling}

WebSocket 連線可能會以這些代碼關閉：

- `4001`：未設定 Vertex AI 憑證
- `4002`：未提供專案 ID
- `1011`：內部伺服器錯誤

## 驗證 {#authentication}

WebSocket 直通使用與其他 LiteLLM 端點相同的驗證方式：

1. **API Key**：傳遞 `Authorization: Bearer your-api-key` 標頭
2. **Vertex AI 憑證**：設定環境變數或設定檔

## 限制 {#limitations}

- 需要已啟用 Vertex AI API 的有效 Google Cloud 專案
- WebSocket 連線在伺服器重新啟動後不會保持持續
- 速率限制會依據您的 Google Cloud 配額套用

## 疑難排解 {#troubleshooting}

### 常見問題 {#common-issues}

1. **驗證錯誤**：請確保 Vertex AI 憑證已正確設定
2. **找不到專案**：請確認專案 ID 存在且已啟用 Vertex AI
3. **連線被拒**：請檢查 LiteLLM proxy 伺服器是否正在執行

### 除錯模式 {#debug-mode}

啟用除錯記錄以查看詳細的連線資訊：

```bash
export LITELLM_LOG=DEBUG
```

## 相關文件 {#related-documentation}

- [Vertex AI Live API 參考](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)
- [LiteLLM Proxy 設定](../proxy/)
- [Vertex AI 直通端點](./vertex_ai.md)
