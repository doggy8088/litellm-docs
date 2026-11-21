---
title: 透過 WebRTC 使用 Realtime 語音
sidebar_label: /realtime - WebRTC 支援
description: 透過 LiteLLM 代理以 WebRTC 將瀏覽器或行動應用程式連線到 OpenAI 與 Azure Realtime 模型，使用短期權杖，讓您的提供者金鑰與 LiteLLM 金鑰留在伺服器上。
keywords:
  [
    WebRTC,
    Realtime API,
    用戶端密鑰,
    瀏覽器語音代理程式,
    LiteLLM 代理,
    OpenAI,
    Azure,
  ]
---

{/* keep-version-note */}

使用 WebRTC 將瀏覽器或行動應用程式中的麥克風連線到 Realtime 模型。您的應用程式向 LiteLLM 代理索取短期權杖，瀏覽器再使用該權杖開始通話。提供者金鑰永遠不會到達瀏覽器，音訊則在瀏覽器與 OpenAI 或 Azure 之間流動，不經過代理。

若您的伺服器已持有 LiteLLM 金鑰，請改用 [WebSocket 路由](/docs/realtime)。若要使用 `gpt-realtime-translate`，請使用[翻譯路由](/docs/realtime_translation#translate-microphone-audio-in-a-browser-or-mobile-app)。若要使用 `gpt-live-1`，請使用 [GPT-Live](/docs/live_sessions)，代理僅以 WebSocket 提供該服務。[語音總覽](/docs/voice)比較了每一種路由。

:::warning WebRTC 通話不會出現在支出記錄中
LiteLLM 會在核發權杖時檢查虛擬金鑰、其預算與其模型存取權。通話接通後，音訊與用量會在瀏覽器與提供者之間直接往來，因此 LiteLLM 不會為該通話寫入支出記錄，也不會將其費用計入該金鑰、團隊或使用者。防護欄看不到音訊。當工作階段必須計入預算時，請使用 [WebSocket 路由](/docs/realtime)。
:::

## 運作方式 {#how-it-works}

代理處理兩次 HTTP 請求，然後退出通話。

```
Browser                  LiteLLM Proxy              OpenAI/Azure
  |                           |                          |
  |-- POST client_secrets --->|-- POST client_secrets -->|
  |<-- encrypted token -------|<-- ek_... ---------------|
  |-- POST calls [SDP+token] ->|-- POST calls ----------->|
  |<-- SDP answer ------------|<-- SDP answer -----------|
  |===== audio, browser to provider =====================>|
```

LiteLLM 傳回的權杖是提供者的暫時金鑰，與 LiteLLM 選擇的部署一同加密。只有代理能讀取它，而且它只適用於代理的 `/v1/realtime/calls` 路由。

## 開始之前 {#before-you-start}

您需要正在執行的 LiteLLM 代理、LiteLLM 虛擬金鑰，以及 OpenAI 或 Azure 的 Realtime 模型部署。請透過 HTTPS 或從 `localhost` 提供擷取麥克風的頁面，因為瀏覽器會在其他位置封鎖麥克風存取。

## 1. 將模型加入設定 {#1-add-the-model-to-config}

```yaml
model_list:
  - model_name: gpt-realtime
    litellm_params:
      model: openai/gpt-realtime-2.1
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```

若使用 Azure，請設定 `model: azure/gpt-realtime-2.1`，並附上您資源的 `api_key` 與 `api_base`，若您的資源需要 `api_version`，也一併設定。

```bash
litellm --config /path/to/config.yaml
```

## 2. 在伺服器上取得權杖 {#2-get-a-token-on-your-server}

請從您的後端呼叫 `POST /v1/realtime/client_secrets`，並附上 LiteLLM 金鑰與設定中的 `model_name`。請勿從瀏覽器呼叫它，因為那會把 LiteLLM 金鑰放進用戶端程式碼。

```bash
curl -X POST http://localhost:4000/v1/realtime/client_secrets \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-realtime"}'
```

回應會在 `value` 中提供權杖，並在 `expires_at` 中提供其到期時間。請將 `value` 傳給瀏覽器。權杖會在 10 分鐘後到期，因此請在每次通話前立即索取。

## 3. 在瀏覽器中開始通話 {#3-start-the-call-in-the-browser}

建立 `RTCPeerConnection`，加入麥克風音軌與名為 `oai-events` 的資料通道，並將 SDP offer 傳送到 `POST /v1/realtime/calls`。請使用步驟 2 的權杖進行驗證，並傳送 `Content-Type: application/sdp`。請勿傳送 `model`，因為權杖已帶有路由資訊。

```javascript
// token: the `value` your backend got from /v1/realtime/client_secrets
const pc = new RTCPeerConnection();
const audio = document.createElement("audio");
audio.autoplay = true;
pc.ontrack = (e) => (audio.srcObject = e.streams[0]);

const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(ms.getTracks()[0]);
const dc = pc.createDataChannel("oai-events");

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpRes = await fetch("http://localhost:4000/v1/realtime/calls", {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/sdp" },
  body: offer.sdp,
});
await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

dc.onopen = () =>
  dc.send(JSON.stringify({ type: "session.update", session: { type: "realtime", instructions: "..." } }));
dc.onmessage = (e) => console.log(JSON.parse(e.data).type);
```

請在資料通道上傳送 `session.update` 與其他用戶端事件，並從中讀取伺服器事件。

## 4. 檢查是否正常運作 {#4-check-that-it-works}

`/v1/realtime/calls` 會傳回 `201`，並以 SDP answer 作為回應主體。在 `setRemoteDescription` 之後，資料通道會開啟，主控台會記錄每個伺服器事件的類型。請說話，您會聽到模型回應，並在它完成回覆時看到 `response.done`。

若 `/v1/realtime/calls` 傳回 `401` 與 `Invalid or expired token`，表示該請求使用了 LiteLLM 金鑰或來自另一個代理的權杖。請傳送來自 `client_secrets` 的 `value`。若它傳回 `401` 與 `Token has expired`，表示權杖已超過 10 分鐘，因此請在建立 offer 之前立即索取新的權杖。

若 `client_secrets` 傳回 `401` 或 `403`，表示 LiteLLM 金鑰無效、超出預算，或無權使用該模型。

若通話已接通但您聽不到任何聲音，請檢查頁面是否取得麥克風權限、`pc.ontrack` 是否將串流附加到具有 `autoplay` 的音訊元素，以及您的網路是否允許 WebRTC 流量連往提供者。

在 Azure 上，任一路徑傳回的 `404` 或版本錯誤，通常表示 `litellm_params` 中的 `api_base` 或 `api_version` 與資源不符。
