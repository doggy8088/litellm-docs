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
- OpenAI Live 模型，例如 `gpt-live-1`，使用其專屬的 `/v1/live/sessions` 路由（[見下文](#openai-live-sessions-gpt-live-1)）
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

<SinceVersion v="1.107.0" /> OpenAI Live 模型（例如 `gpt-live-1`）使用其專屬的 WebSocket 通訊協定，LiteLLM 在 `/v1/live/sessions` 上提供這些模型，首次出現於 `v1.107.0-rc.1`。OpenAI 會以 `invalid_model` 拒絕在 `/v1/realtime` 上使用 Live 模型，因此 `/v1/realtime` 用戶端無法使用 `gpt-live-1`。請改用下方的路由。

### 將模型加入設定檔 {#add-the-model-to-config}

```yaml
model_list:
  - model_name: gpt-live-1
    litellm_params:
      model: openai/gpt-live-1
      api_key: os.environ/OPENAI_API_KEY
```

Live 工作階段僅支援 `openai` 提供者。在其他提供者的部署（例如 `azure/gpt-live-1`）上建立的工作階段，會收到一個 `error` 事件，內容為 `OpenAI Live sessions require the openai provider`，且工作階段會以代碼 1011 關閉。LiteLLM 會連線至 `api_base` 所指定主機上的 `/v1/live/sessions`，並捨棄其中的任何路徑，因此位於路徑前綴之後的 `api_base` 無法運作。

### 連線 {#connect}

使用 LiteLLM 虛擬金鑰，在 proxy 上開啟通往 `/v1/live/sessions` 的 WebSocket。`/live/sessions` 與 `/openai/v1/live/sessions` 也可以使用。第一則訊息必須是 `session.start`，其 `session.model` 為您設定中的 `model_name`。LiteLLM 會從該訊息取得模型，並忽略 `?model=` 查詢參數。它會換入部署的模型，連線至 OpenAI 的 `/v1/live/sessions`，然後在兩個方向上原封不動地傳遞每個事件。

將 `base_url` 指向 proxy 時，OpenAI Python SDK 會完成上述所有操作。`client.live` 需要 `openai` 3.12.0 或更新版本，請使用 `pip install -U "openai[realtime]>=3.12.0"` 安裝或升級：

```python
import asyncio
import os

from openai import AsyncOpenAI

client = AsyncOpenAI(base_url="http://0.0.0.0:4000/v1", api_key=os.environ["LITELLM_API_KEY"])


async def main() -> None:
    async with client.live.connect() as connection:
        await connection.send({"type": "session.start", "session": {"model": "gpt-live-1"}})
        async for event in connection:
            print(event.type)
            if event.type == "session.started":
                await connection.send({"type": "session.close"})
            if event.type in ("session.closed", "error"):
                break


asyncio.run(main())
```

傳送音訊前，請先等待 `session.started`。以 base64 區塊的形式，在 `session.input_audio.append` 事件中傳送音訊，並從 `session.output_audio.delta` 事件讀取模型的音訊。完整事件清單請參閱 OpenAI 的 [GPT-Live 指南](https://developers.openai.com/api/docs/guides/live) 與 [WebSocket 指南](https://developers.openai.com/api/docs/guides/voice-websockets?api=live)。

### 驗證與錯誤 {#auth-and-errors}

LiteLLM 會在 WebSocket 開啟時檢查虛擬金鑰。它先從 `Authorization: Bearer <key>` 標頭讀取金鑰，再從 `api-key` 標頭讀取，最後從 `openai-insecure-api-key.<key>` WebSocket 子通訊協定讀取（供無法設定標頭的用戶端使用）。從瀏覽器傳送的金鑰可被任何使用該頁面的人讀取，因此請只給予該金鑰頁面所需的模型與預算。缺少金鑰、金鑰無效，或金鑰超過其總預算（`max_budget`）時，會收到 HTTP 403，且 WebSocket 不會開啟。

在 `session.start` 之後，LiteLLM 會執行需要模型的檢查，例如金鑰是否可呼叫 `session.model`，以及每模型預算（`model_max_budget`）。檢查失敗時，LiteLLM 會傳送帶有下列其中一個代碼的 `error` 事件，並以代碼 1008 關閉工作階段：

| 代碼 | 原因 |
| --- | --- |
| `model_not_allowed` | 金鑰不可呼叫該模型 |
| `session_not_allowed` | 其他檢查失敗，例如每模型預算已用盡 |
| `invalid_session_start` | 第一則訊息不是 `session.start` |

若 30 秒內未收到第一則訊息，LiteLLM 也會傳送 `invalid_session_start`。若金鑰可呼叫該模型，但您設定中的 `model_name` 都不符合，LiteLLM 會傳送類型為 `server_error` 的 `error` 事件，並以代碼 1011 關閉工作階段。

金鑰的速率限制（例如 `rpm_limit`）也會在 `session.start` 之後檢查。超過限制的工作階段會收到類型為 `guardrail_error` 的 `error` 事件，其訊息以 `429` 開頭，且工作階段會以代碼 1011 關閉。若未使用 Redis，每個 proxy worker 會各自計數，因此具有多個 worker 的 proxy 可能放行超過限制的工作階段。

### 用量追蹤 {#spend-tracking}

若要結束工作階段，請傳送 `session.close` 並等待 `session.closed`，其中帶有最終的 `usage`。LiteLLM 會依據 OpenAI 回報的 `usage.seconds`，以模型的 `input_cost_per_second` 對工作階段計費。若您在 `litellm_params` 中設定了部署自身的 `input_cost_per_second`，則使用該值，否則使用模型成本對照表中的值。例如，一個有 6 秒音訊的工作階段，費用為 `input_cost_per_second` 的 6 倍。若用戶端未傳送 `session.close` 就中斷 socket，LiteLLM 會自行向 OpenAI 傳送 `session.close`，並仍依 OpenAI 的 `session.closed` 中的 `usage.seconds` 計費。當工作階段結束時未收到 OpenAI 的 `session.closed`（例如與 OpenAI 的連線中斷，或用戶端中斷後 5 秒內 OpenAI 未傳送），LiteLLM 會以最後回報的 `usage.seconds` 與工作階段開啟時間兩者中較大者計費。

當工作階段將工作交給 Responses 模型時，OpenAI 會傳送 `response.event` 事件，LiteLLM 會以該模型的 token 價格加上每個已完成回應的 token。若某個模型不在 LiteLLM 的模型成本對照表中，其 token 費用為 $0。LiteLLM 只計算 token 費用，因此網路搜尋等工具的費用不會被計費。

全部費用會記入工作階段的用量記錄與金鑰的用量，因此金鑰預算的套用方式與 `/v1/realtime` 相同。LiteLLM 會在工作階段開始時檢查預算，並在工作階段結束時加上費用，因此一個長時間的工作階段可能花費超過預算。之後該金鑰或模型的工作階段將被拒絕。

### 限制 {#limits}

防護欄不會在 Live 工作階段上執行。當 `pre_call`、`post_call` 或 `realtime_input_transcription` 防護欄適用於工作階段時，LiteLLM 會傳送一個 `error` 事件，內容為 `Guardrails are not supported on OpenAI Live sessions`，並以代碼 1011 關閉工作階段。這包括附加在金鑰上的防護欄，以及 `default_on: true` 的防護欄，因此這些模式中 `default_on` 的防護欄會關閉 proxy 上的每個 Live 工作階段。其他模式的防護欄（例如 `during_call`）以及 `guardrails` 查詢參數不會關閉工作階段，工作階段會在沒有它們的情況下執行。

LiteLLM 只在 WebSocket 路由上檢查 Live 工作階段並計費。WebRTC 工作階段建立（`POST /v1/live/sessions`）以及 `/v1/live/sessions/{session_id}/` 下的通話控制路由（例如 `hangup` 與 `accept`），在 proxy 上沒有 Live 路由。`/openai/v1/live/sessions` 上的 [OpenAI 透通傳遞](/docs/pass_through/openai_passthrough) 會將它們以一般透通呼叫的形式轉送至 OpenAI，LiteLLM 不會將其計為 Live 工作階段，因此其使用不會計入金鑰用量或預算。Proxy 管理員可以將金鑰的 `allowed_routes` 設為 `["/v1/live/sessions"]`，讓金鑰只能使用 Live WebSocket 路由。

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
