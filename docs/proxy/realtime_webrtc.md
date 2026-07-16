# /realtime - WebRTC 支援 {#realtime---webrtc-support}

透過 WebRTC 從瀏覽器/行動用戶端連線到 Realtime API。LiteLLM 處理驗證；音訊直接串流到 OpenAI/Azure。

**提供者：** OpenAI · Azure

:::info **WebRTC 與 WebSocket**
- **WebSocket** (`/v1/realtime`) — 伺服器對伺服器
- **WebRTC** (`/v1/realtime/client_secrets` + `/v1/realtime/calls`) — 瀏覽器/行動裝置，延遲較低
:::

## 運作方式 {#how-it-works}

LiteLLM 核發權杖並轉送 SDP；音訊不會經過代理。

```
Browser                  LiteLLM Proxy              OpenAI/Azure
  |                           |                          |
  |-- POST client_secrets --->|-- POST sessions -------->|
  |<-- encrypted_token -------|<-- ek_... ---------------|
  |-- POST calls [SDP+token] ->|-- POST calls ----------->|
  |<-- SDP answer ------------|<-- SDP answer -----------|
  |===== audio P2P direct ===============================>|
```

## 代理設定 {#proxy-setup}

```yaml
model_list:
  - model_name: gpt-4o-realtime
    litellm_params:
      model: openai/gpt-4o-realtime-preview-2024-12-17
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```

**Azure：** `model: azure/gpt-4o-realtime-preview`、`api_key`、`api_base`。

```bash
litellm --config /path/to/config.yaml
```

## 用戶端使用方式 {#client-usage}

1. **權杖** — `POST /v1/realtime/client_secrets`，使用 LiteLLM 金鑰與 `{ model }`。
2. **WebRTC** — 建立 `RTCPeerConnection`，加入麥克風、資料通道 `oai-events`，將 SDP offer 傳送至 `POST /v1/realtime/calls`，並附上 `Authorization: Bearer <token>`、`Content-Type: application/sdp`。
3. **事件** — 使用資料通道處理 `session.update` 與其他事件。

```javascript
const r = await fetch("http://proxy:4000/v1/realtime/client_secrets", {
  method: "POST",
  headers: { "Authorization": "Bearer sk-litellm-key", "Content-Type": "application/json" },
  body: JSON.stringify({ model: "gpt-4o-realtime" }),
});
const token = (await r.json()).client_secret.value;

const pc = new RTCPeerConnection();
const audio = document.createElement("audio");
audio.autoplay = true;
pc.ontrack = (e) => (audio.srcObject = e.streams[0]);
const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(ms.getTracks()[0]);
const dc = pc.createDataChannel("oai-events");
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpRes = await fetch("http://proxy:4000/v1/realtime/calls", {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/sdp" },
  body: offer.sdp,
});
await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

dc.send(JSON.stringify({ type: "session.update", session: { instructions: "..." } }));
```

## 常見問題 {#faq}

- **401 權杖已過期** — 在建立 WebRTC offer 之前立即取得新的權杖。
- **`/calls` 要用哪個金鑰？** — 使用來自 `client_secrets` 的加密權杖，不是原始金鑰。
- **要傳入 `model` 嗎？** — 不需要。權杖會編碼路由。
- **Azure `api-version`** — 在 `litellm_params` 中設定 `api_version`，並使用正確的 `api_base`。
- **沒有音訊** — 允許麥克風；確認 `pc.ontrack` 設定自動播放音訊；檢查防火牆/WebRTC；檢視主控台。
