import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /realtime {#realtime}

使用這個來在 Azure + OpenAI + xAI 等之間進行負載平衡。

支援的提供者：
- OpenAI
- Azure
- xAI ([查看完整文件](/docs/providers/xai_realtime))
- Google AI Studio（Gemini）
- Vertex AI
- Vertex AI Chirp，僅限轉錄 ([查看完整文件](/docs/providers/vertex_transcription#chirp-realtime-transcription))
- Bedrock
- Meta Muse Voice，僅限轉錄 ([查看完整文件](/docs/providers/meta#muse-voice-realtime-transcription))
- OpenAI Live 模型，例如 `gpt-live-1`，使用其專屬的 `/v1/live/sessions` 路由（[查看完整文件](/docs/live_sessions)）
- 使用 `gpt-live-transcribe` 在 OpenAI 與 Azure 上進行即時轉錄（[見下文](#live-transcription-with-gpt-live-transcribe)）
- 使用 `gpt-realtime-translate` 的即時語音翻譯（OpenAI 與 Azure），使用其專屬的 `/v1/realtime/translations` 路由（[查看完整文件](/docs/realtime_translation)）

## 代理程式用法 {#proxy-usage}

### 將模型加入設定檔  {#add-model-to-config}

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml
model_list:
  - model_name: openai-gpt-realtime
    litellm_params:
      model: openai/gpt-realtime-2.1
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```
</TabItem>
<TabItem value="openai+azure" label="OpenAI + Azure">

```yaml
model_list:
  - model_name: azure-gpt-realtime
    litellm_params:
      model: azure/gpt-realtime-2.1
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
    model_info:
      mode: realtime

  - model_name: openai-gpt-realtime
    litellm_params:
      model: openai/gpt-realtime-2.1
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

# RUNNING on http://0.0.0.0:4000
```

### 測試  {#test}

使用 node 執行這個腳本 - `node test.js`

```js
// test.js
const WebSocket = require("ws");

const url = "ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-realtime";
// const url = "wss://my-azure-endpoint.openai.azure.com/openai/v1/realtime?model=gpt-realtime-2.1";
const ws = new WebSocket(url, {
    headers: {
        "api-key": `sk-<your-litellm-api-key>`,
    },
});

ws.on("open", function open() {
    console.log("Connected to server.");
    ws.send(JSON.stringify({
        type: "response.create",
        response: {
            output_modalities: ["text"],
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

## OpenAI Live 工作階段（`gpt-live-1`） {#openai-live-sessions-gpt-live-1}

GPT-Live 模型（例如 `gpt-live-1`）不會在 `/v1/realtime` 上執行。它們有自己的路由 `/v1/live/sessions` 與自己的頁面。請參閱 [GPT-Live](/docs/live_sessions)。

## 使用 `gpt-live-transcribe` 進行即時轉錄 {#live-transcription-with-gpt-live-transcribe}

`gpt-live-transcribe` 會將串流進來的音訊即時轉成文字。它以轉錄工作階段的形式在 Realtime 路由上執行，OpenAI 與 Azure 皆適用。它不是 GPT-Live 模型，因此不使用 `/v1/live/sessions`。

```yaml
model_list:
  - model_name: gpt-live-transcribe
    litellm_params:
      model: openai/gpt-live-transcribe
      api_key: os.environ/OPENAI_API_KEY
  - model_name: azure-live-transcribe
    litellm_params:
      model: azure/gpt-live-transcribe
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
```

請使用查詢字串中的 `intent=transcription` 連線到 `/v1/realtime`。若沒有它，LiteLLM 會開啟對話工作階段，而提供者會拒絕轉錄模型的交握。

```python
import asyncio
import base64
import json
import os

import websockets

URL = "ws://0.0.0.0:4000/v1/realtime?model=gpt-live-transcribe&intent=transcription"


async def main() -> None:
    headers = {"Authorization": f"Bearer {os.environ['LITELLM_API_KEY']}"}
    async with websockets.connect(URL, additional_headers=headers) as ws:
        await ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "type": "transcription",
                        "audio": {
                            "input": {
                                "format": {"type": "audio/pcm", "rate": 24000},
                                "transcription": {"model": "gpt-live-transcribe"},
                            }
                        },
                    },
                }
            )
        )
        with open("speech.pcm", "rb") as f:
            pcm = f.read()
        for start in range(0, len(pcm), 4800):
            chunk = base64.b64encode(pcm[start : start + 4800]).decode()
            await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": chunk}))
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))

        async for message in ws:
            event = json.loads(message)
            if event["type"] == "conversation.item.input_audio_transcription.delta":
                print(event["delta"], end="", flush=True)
            if event["type"] in ("conversation.item.input_audio_transcription.completed", "error"):
                break


asyncio.run(main())
```

`speech.pcm` 是 16 位元單聲道 PCM，取樣率 24 kHz。文字會透過 `conversation.item.input_audio_transcription.delta` 事件送達，而 `completed` 事件帶有完整逐字稿。

若要使用瀏覽器，請以 `POST /v1/realtime/client_secrets` 建立短期權杖，並將 `session.type` 設為 `transcription`，再依照 [WebRTC 指南](/docs/proxy/realtime_webrtc)操作。`gpt-live-transcribe` 無法在 `/v1/audio/transcriptions` 上運作，該路由用於將檔案上傳至 `gpt-4o-transcribe` 等模型。

## Azure：GA 與 beta 即時通訊協定 {#azure-ga-vs-beta-realtime-protocol}

Azure 提供兩個即時上游。GA 端點（`/openai/v1/realtime?model=<deployment>`）使用 GA 事件結構（`session.type`、`output_modalities`、巢狀 `audio`），而較舊的 beta 端點（`/openai/realtime?api-version=2024-10-01-preview&deployment=<deployment>`）使用 beta 結構（`modalities`、`voice`、扁平音訊格式）。將 GA 形狀的 `session.update` 傳送至 beta 端點會失敗，並出現 `Unknown parameter: 'session.type'`

LiteLLM 會依據用戶端連線選擇上游。傳送 `OpenAI-Beta: realtime=v1` 標頭的用戶端（openai SDK 的 `client.beta.realtime.connect`）會橋接到 beta 端點。沒有該標頭的用戶端（openai SDK 的 `client.realtime.connect`，以及大多數語音代理程式框架）會橋接到 GA 端點。轉錄工作階段（`intent=transcription`）一律使用 GA

<SinceVersion v="1.110.0" /> Azure 僅在 GA 上提供的模型（例如 `gpt-realtime-2.1`）同樣使用 GA，LiteLLM 會將 beta 用戶端的事件橋接至 GA 端點。LiteLLM 會依 `model` 中的部署名稱辨識這些模型；若部署使用自訂名稱，則依 `base_model` 辨識。部署名稱如 `azure/my-realtime-prod`、實際執行 `gpt-realtime-2.1` 時，需在 `litellm_params` 中設定 `base_model: azure/gpt-realtime-2.1` 或 `realtime_protocol: GA`。若兩者皆未設定，LiteLLM 會將 beta 用戶端送往 beta 端點，而 Azure 會以 `realtime_beta_access_required` 關閉工作階段

```python
import os

from openai import AsyncOpenAI

client = AsyncOpenAI(base_url="http://0.0.0.0:4000", api_key=os.environ["LITELLM_API_KEY"])

async with client.realtime.connect(model="azure-gpt-realtime") as connection:
    await connection.session.update(
        session={"type": "realtime", "output_modalities": ["audio"], "instructions": "Please assist the user."}
    )
    async for event in connection:
        print(event.type)
        if event.type == "session.updated":
            break
```

若要固定某個協定，不論用戶端傳送什麼，都可在部署上設定 `realtime_protocol`，或在 Proxy 的環境中設定 `LITELLM_AZURE_REALTIME_PROTOCOL`。部署設定的優先順序高於環境變數，而兩者都高於用戶端標頭。即時健康檢查（`/health` 在 `mode: realtime` 部署上，以及 Admin UI 的 Test Connect）沒有可讀取的用戶端標頭，因此會探測 GA 端點，除非其中一項已將協定固定

```yaml
model_list:
  - model_name: azure-gpt-realtime
    litellm_params:
      model: azure/gpt-realtime-2.1
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
      realtime_protocol: GA
```

```bash
export LITELLM_AZURE_REALTIME_PROTOCOL=GA
```

`beta` 是另一個可用的值。在 beta 端點上的 `gpt-realtime-2.1` 工作階段會被 Azure 以 `realtime_beta_access_required` 關閉，因此請勿為它指定 `beta`。

## 防護欄 {#guardrails}

您可以將 [LiteLLM 防護欄](https://docs.litellm.ai/docs/proxy/guardrails/quick_start) 套用到即時工作階段。

### 在金鑰或團隊上設定防護欄 {#set-guardrails-on-a-key-or-team}

最簡單的正式環境設定：將防護欄附加到虛擬金鑰或團隊，如此它們就會自動套用，無需任何用戶端端變更。

請參閱 [虛擬金鑰 → 防護欄](https://docs.litellm.ai/docs/proxy/virtual_keys#guardrails) 和 [團隊 → 防護欄](https://docs.litellm.ai/docs/proxy/team_budgets)。

### 動態傳遞防護欄（方便測試） {#pass-guardrails-dynamically-easy-testing}

在開啟 WebSocket 時，將 `guardrails` 作為查詢參數傳入。
適合在不修改金鑰／團隊設定的情況下測試防護欄。

```js
// node test.js
const WebSocket = require("ws");

const guardrails = ["your-guardrail-name"]; // comma-separated list
const url = `ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-realtime&guardrails=${guardrails.join(",")}`;

const ws = new WebSocket(url, {
    headers: {
        "Authorization": "Bearer sk-<your-litellm-api-key>",
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
    url = "ws://0.0.0.0:4000/v1/realtime?model=openai-gpt-realtime&guardrails=your-guardrail-name"
    async with websockets.connect(
        url,
        additional_headers={"Authorization": "Bearer sk-<your-litellm-api-key>"},
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
