import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /realtime {#realtime}

使用這個來在 Azure + OpenAI + xAI 等之間進行負載平衡。 

支援的提供者：
- OpenAI
- Azure
- xAI ([查看完整文件](/docs/providers/xai_realtime))
- Google AI Studio (Gemini)
- Vertex AI
- Bedrock

## 代理程式用法 {#proxy-usage}

### 將模型加入設定檔  {#add-model-to-config}

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml
model_list:
  - model_name: openai-gpt-4o-realtime-audio
    litellm_params:
      model: openai/gpt-4o-realtime-preview-2024-10-01
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```
</TabItem>
<TabItem value="openai+azure" label="OpenAI + Azure">

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o-realtime-preview
      api_key: os.environ/AZURE_SWEDEN_API_KEY
      api_base: os.environ/AZURE_SWEDEN_API_BASE

  - model_name: openai-gpt-4o-realtime-audio
    litellm_params:
      model: openai/gpt-4o-realtime-preview-2024-10-01
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
<TabItem value="xai" label="xAI Grok 語音代理程式">

```yaml
model_list:
  - model_name: grok-voice-agent
    litellm_params:
      model: xai/grok-voice-latest
      api_key: os.environ/XAI_API_KEY
    model_info:
      mode: realtime
```

**[查看完整 xAI Realtime 文件 →](/docs/providers/xai_realtime)**

</TabItem>
</Tabs>

### 啟動代理程式  {#start-proxy}

```bash
litellm --config /path/to/config.yaml 

# RUNNING on http://0.0.0.0:8000
```

### 測試  {#test}

使用 node 執行這個腳本 - `node test.js`

```js
// test.js
const WebSocket = require("ws");

const url = "ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-4o-realtime-audio";
// const url = "wss://my-azure-endpoint.openai.azure.com/openai/realtime?api-version=2024-10-01-preview&deployment=gpt-4o-realtime-preview";
const ws = new WebSocket(url, {
    headers: {
        "api-key": `sk-1234`,
        "OpenAI-Beta": "realtime=v1",
    },
});

ws.on("open", function open() {
    console.log("Connected to server.");
    ws.send(JSON.stringify({
        type: "response.create",
        response: {
            modalities: ["text"],
            instructions: "Please assist the user.",
        }
    }));
});

ws.on("message", function incoming(message) {
    console.log(JSON.parse(message.toString()));
});

ws.on("error", function handleError(error) {
    console.error("Error: ", error);
});
```

## 防護欄 {#guardrails}

您可以將 [LiteLLM 防護欄](https://docs.litellm.ai/docs/proxy/guardrails/quick_start) 套用到即時工作階段。

### 在金鑰或團隊上設定防護欄 {#set-guardrails-on-a-key-or-team}

最簡單的正式環境設定方式——將防護欄附加到虛擬金鑰或團隊上，讓它們自動套用，且無需任何用戶端端的變更。

請參閱 [虛擬金鑰 → 防護欄](https://docs.litellm.ai/docs/proxy/virtual_keys#guardrails) 和 [團隊 → 防護欄](https://docs.litellm.ai/docs/proxy/team_budgets)。

### 動態傳遞防護欄（方便測試） {#pass-guardrails-dynamically-easy-testing}

在開啟 WebSocket 時，將 `guardrails` 作為查詢參數傳入。
適合在不修改金鑰／團隊設定的情況下測試防護欄。

```js
// node test.js
const WebSocket = require("ws");

const guardrails = ["your-guardrail-name"]; // comma-separated list
const url = `ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-4o-realtime-audio&guardrails=${guardrails.join(",")}`;

const ws = new WebSocket(url, {
    headers: {
        "Authorization": "Bearer sk-1234",
    },
});

ws.on("open", function open() {
    console.log("Connected — guardrails active:", guardrails);
});

ws.on("message", function incoming(message) {
    const data = JSON.parse(message);
    if (data.type === "error") {
        // Guardrail block is sent as an error event before the connection closes
        console.error("Guardrail error:", data.error.message);
    }
});

ws.on("close", function close(code, reason) {
    console.log("Closed:", code, reason.toString());
    // code 1011 = blocked by guardrail at pre_call
});
```

或者使用 Python：

```python
import asyncio
import websockets

async def main():
    url = "ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-4o-realtime-audio&guardrails=your-guardrail-name"
    async with websockets.connect(
        url,
        additional_headers={"Authorization": "Bearer sk-1234"},
    ) as ws:
        print("Connected — guardrail active")
        async for msg in ws:
            import json
            data = json.loads(msg)
            if data["type"] == "error":
                print("Guardrail blocked:", data["error"]["message"])
                break

asyncio.run(main())
```

當防護欄封鎖請求時，代理程式會透過 WebSocket 傳送一個 `error` 事件，然後關閉連線：

```json
{
    "type": "error",
    "error": {
        "type": "guardrail_error",
        "message": "Guardrail blocked this request: <reason>"
    }
}
```

## 記錄 {#logging}

為避免請求被丟棄，LiteLLM 預設只會記錄這些事件類型：

- `session.created`
- `response.create`
- `response.done`

您可以在設定檔中設定 `logged_real_time_event_types` 參數來覆寫這個行為。例如：

```yaml
litellm_settings:
  logged_real_time_event_types: "*" # Log all events
  ## OR ## 
  logged_real_time_event_types: ["session.created", "response.create", "response.done"] # Log only these event types
```
