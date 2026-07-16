---
slug: realtime_webrtc_http_endpoints
title: "即時 WebRTC HTTP 端點"
date: 2026-03-12T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "使用 LiteLLM proxy 透過 HTTP 路由 OpenAI 風格的 WebRTC 即時通訊：client_secrets 與 SDP 交換。"
tags: [realtime, webrtc, proxy, openai]
hide_table_of_contents: false
---

import WebRTCTester from '@site/src/components/WebRTCTester';

從瀏覽器／行動用戶端透過 WebRTC 連線到 Realtime API。LiteLLM 負責驗證與金鑰管理。

{/* truncate */}

## 運作方式 {#how-it-works}

![WebRTC 流程：瀏覽器、LiteLLM Proxy 與 OpenAI/Azure](../../img/webrtc_flow.png)

**產生暫時性 token 的流程**

![暫時性 token 流程：瀏覽器請求 token、LiteLLM 從 OpenAI 取得正式 token、回傳加密 token](../../img/ephemeral_token.png)

## Proxy 設定 {#proxy-setup}

```yaml
model_list:
  - model_name: gpt-4o-realtime
    litellm_params:
      model: openai/gpt-4o-realtime-preview-2024-12-17
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: realtime
```

**Azure：**使用 `model: azure/gpt-4o-realtime-preview`、`api_key`、`api_base`。

```bash
litellm --config /path/to/config.yaml
```

## 線上試用 {#try-it-live}

<WebRTCTester />

## 用戶端使用方式 {#client-usage}

**1. 取得 token** - 使用 LiteLLM API 金鑰與 `{ model }` 進行 `POST /v1/realtime/client_secrets`。

**2. WebRTC 握手** - 建立 `RTCPeerConnection`、加入麥克風 track、建立資料通道 `oai-events`、使用 `Authorization: Bearer <encrypted_token>` 與 `Content-Type: application/sdp` 將 SDP offer 傳送至 `POST /v1/realtime/calls`。

**3. 事件** - 使用資料通道處理 `session.update` 與其他事件。

<details>
<summary>完整程式碼範例</summary>

```javascript
// 1. Token
const r = await fetch("http://proxy:4000/v1/realtime/client_secrets", {
  method: "POST",
  headers: { "Authorization": "Bearer sk-litellm-key", "Content-Type": "application/json" },
  body: JSON.stringify({ model: "gpt-4o-realtime" }),
});
const { client_secret } = await r.json();
const token = client_secret.value;

// 2. WebRTC
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

// 3. Events
dc.send(JSON.stringify({ type: "session.update", session: { instructions: "..." } }));
```

</details>

## 常見問題 {#faq}

**Q: 如果我收到 401 Token expired 錯誤，該怎麼辦？**  
A: token 的有效期很短。請在建立 WebRTC offer 前立即取得新的 token。

**Q: `/v1/realtime/calls` 應該使用哪把金鑰？**  
A: 請使用 `client_secrets` 的**加密 token**，不要使用原始 API 金鑰。

**Q: 呼叫時我應該傳入 `model` 參數嗎？**  
A: 不需要，加密 token 已經編碼了所有路由資訊，包括模型。

**Q: 我要如何解決 Azure `api-version` 錯誤？**  
A: 在 `litellm_params` 中設定正確的 `api_version`（或透過 `AZURE_API_VERSION` 環境變數），並搭配正確的 `api_base` 與部署值。

**Q: 如果我沒有音訊，該怎麼辦？**  
A: 請確認您已授予麥克風權限，確保 `pc.ontrack` 會將音訊元素設為啟用 `autoplay`，檢查網路／防火牆是否允許 WebRTC 流量，並查看瀏覽器主控台中的 ICE 或 SDP 錯誤。
