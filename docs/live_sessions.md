---
title: 使用 gpt-live-1 的 GPT-Live API
sidebar_label: /live/sessions
description: 透過 LiteLLM 代理在 /v1/live/sessions 上，以 gpt-live-1 在 OpenAI 與 Azure 上執行 GPT-Live 語音工作階段，搭配虛擬金鑰、模型存取、預算，以及每秒音訊的支出。
keywords:
  [
    GPT-Live,
    gpt-live-1,
    OpenAI Live API,
    即時工作階段,
    語音代理程式,
    語音轉語音,
    WebSocket 語音 API,
  ]
---

# GPT-Live（`/v1/live/sessions`） {#gpt-live-v1livesessions}

GPT-Live 是 OpenAI 的全雙工語音 API。它的模型，例如 `gpt-live-1`，會在同一個工作階段中同時聆聽與說話。它與 [Realtime API](/docs/realtime) 是不同的協定，因此 `/v1/realtime` 用戶端無法使用 GPT-Live 模型。

## 我需要哪條語音路由 {#which-voice-route-do-i-need}

模型名稱看起來很像，但每個系列都有自己的路由。

| 模型 | 用途 | 代理上的路由 | 文件 |
| --- | --- | --- | --- |
| `gpt-live-1` | 全雙工語音對話 | `WS /v1/live/sessions`，或 [WebRTC](#start-a-session-from-a-browser-over-webrtc) | [GPT-Live](/docs/live_sessions) |
| `gpt-realtime` 與其他 Realtime 模型 | 有輪次與工具的語音或文字對話 | `WS /v1/realtime`，或 [WebRTC](/docs/proxy/realtime_webrtc) | [Realtime](/docs/realtime) |
| `gpt-live-transcribe` | 即時語音轉文字 | `WS /v1/realtime?intent=transcription` | [即時轉錄](/docs/realtime#live-transcription-with-gpt-live-transcribe) |
| `gpt-realtime-translate` | 即時語音翻譯 | `WS /v1/realtime/translations` | [即時翻譯](/docs/realtime_translation) |

`gpt-live-transcribe` 的名稱中有 "live"，但它不是 GPT-Live 模型。它在 Realtime 路由上執行。

<SinceVersion v="1.107.0" /> LiteLLM 自 `v1.107.0-rc.1` 起在 `/v1/live/sessions` 上提供 GPT-Live 模型。OpenAI 會以 `invalid_model` 拒絕在 `/v1/realtime` 上的 Live 模型，因此請改用下方的路由。

## 將模型加入設定 {#add-the-model-to-config}

```yaml
model_list:
  - model_name: gpt-live-1
    litellm_params:
      model: openai/gpt-live-1
      api_key: os.environ/OPENAI_API_KEY
```

若使用 Azure，請將部署指向您的 Azure 資源：

```yaml
model_list:
  - model_name: azure-gpt-live-1
    litellm_params:
      model: azure/gpt-live-1
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE
```

<SinceVersion v="1.112.0" /> LiteLLM 提供 Azure GPT-Live 部署。較早的版本會以一個 `error` 事件回應 Azure 部署，說明 `OpenAI Live sessions require the openai provider`。LiteLLM 會在 `api-key` 標頭中傳送 `api_key`。部署沒有金鑰時，它會從 `azure_ad_token` 或您已在其他 Azure 模型上使用的 Entra 設定，傳送 Microsoft Entra token 作為 bearer token。

即時工作階段支援 `openai` 與 `azure` 提供者。在另一個提供者的部署上的工作階段會收到一個 `error` 事件，並以代碼 1011 關閉工作階段。LiteLLM 會連到 OpenAI 的 `api_base` 主機上的 `/v1/live/sessions`，以及 Azure 的 `/openai/v1/live/sessions`。它會捨棄 `api_base` 中的任何路徑，因此路徑前綴後面的 `api_base` 無法運作。

## 連線 {#connect}

使用 LiteLLM 虛擬金鑰，對代理上的 `/v1/live/sessions` 開啟 WebSocket。`/live/sessions` 與 `/openai/v1/live/sessions` 也能使用。第一則訊息必須是 `session.start`，而它的 `session.model` 是您設定中的 `model_name`。LiteLLM 會從該訊息取得模型，並忽略 `?model=` 查詢參數。它會換入部署的模型，連到 OpenAI 的 `/v1/live/sessions`，然後在兩個方向上原樣傳遞每一個事件。

將 `base_url` 指向代理時，OpenAI Python SDK 會代您完成這一切。`client.live` 需要 `openai` 3.12.0 或更新版本，因此請以 `pip install -U "openai[realtime]>=3.12.0"` 安裝或升級：

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

傳送音訊之前，請先等待 `session.started`。請以 base64 chunk 的形式，在 `session.input_audio.append` 事件中傳送音訊，並從 `session.output_audio.delta` 事件讀取模型的音訊。完整事件清單請參閱 OpenAI 的 [GPT-Live 指南](https://developers.openai.com/api/docs/guides/live)與 [WebSocket 指南](https://developers.openai.com/api/docs/guides/voice-websockets?api=live)。

## 從瀏覽器以 WebRTC 啟動工作階段 {#start-a-session-from-a-browser-over-webrtc}

當音訊來自瀏覽器或行動應用程式中的麥克風時，請使用 WebRTC。您的伺服器會將瀏覽器的 SDP offer 與其 LiteLLM 金鑰一起傳送到代理，音訊接著會在瀏覽器與 OpenAI 或 Azure 之間流動，不經過代理。

```bash
curl -X POST https://litellm-domain/v1/live/sessions \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session": {"model": "gpt-live-1"}, "transport": {"type": "webrtc", "sdp": "<SDP offer from the browser>"}}'
```

代理會傳回 `201`，並在 `transport.sdp` 中附上 SDP answer，以及一個 `session.id`。請將 answer 傳給瀏覽器中的 `setRemoteDescription`。`transport.type` 不是 `webrtc` 時會得到 `400`。

`session.id` 是只有代理能讀取的 token。您的伺服器可以用它加入工作階段，接收每一個工作階段事件，並傳送 `session.close` 等事件：

```
wss://litellm-domain/v1/live/sessions/{session.id}/attach
```

請使用建立該工作階段的 LiteLLM 金鑰連線。其他金鑰會讓 socket 以代碼 1008 關閉，並顯示 `Unknown session`。

LiteLLM 對 WebRTC 工作階段的計費方式與 WebSocket 工作階段相同。代理會以自己的連線加入每個工作階段，讀取提供者回報的秒數；無法加入的工作階段會得到 `503` 且不會啟動。[WebRTC 指南](/docs/proxy/realtime_webrtc#billing-and-limits)涵蓋速率限制、重新連線，以及同樣適用於此處的 `meter_webrtc_calls` 設定。

## 驗證與錯誤 {#auth-and-errors}

LiteLLM 會在 WebSocket 開啟時檢查虛擬金鑰。它會先從 `Authorization: Bearer <key>` 標頭讀取金鑰，再從 `api-key` 標頭讀取，然後從無法設定標頭的用戶端所用的 `openai-insecure-api-key.<key>` WebSocket subprotocol 讀取。從瀏覽器傳送的金鑰，任何使用該頁面的人都能讀取，因此請只給該金鑰該頁面需要的模型與預算。缺少或無效的金鑰，或超出總預算（`max_budget`）的金鑰，會得到 HTTP 403，而 WebSocket 永遠不會開啟。

`session.start` 之後，LiteLLM 會執行需要模型的檢查，例如金鑰是否可以呼叫 `session.model`，以及每個模型的預算（`model_max_budget`）。檢查失敗時，LiteLLM 會傳送一個帶有以下其中一個代碼的 `error` 事件，並以代碼 1008 關閉工作階段：

| 代碼 | 原因 |
| --- | --- |
| `model_not_allowed` | 金鑰不可以呼叫該模型 |
| `session_not_allowed` | 另一項檢查失敗，例如每個模型的預算已用完 |
| `invalid_session_start` | 第一則訊息不是 `session.start` |

30 秒內沒有收到第一則訊息時，LiteLLM 也會傳送 `invalid_session_start`。如果金鑰可以呼叫該模型，但您設定中的 `model_name` 都不相符，LiteLLM 會傳送一個類型為 `server_error` 的 `error` 事件，並以代碼 1011 關閉工作階段。

金鑰的速率限制（例如 `rpm_limit`）也會在 `session.start` 之後檢查。超出限制的工作階段會收到一個類型為 `guardrail_error` 的 `error` 事件，其訊息以 `429` 開頭，而工作階段會以代碼 1011 關閉。沒有 Redis 時，每個代理 worker 會各自計數，因此有多個 worker 的代理放行的 session 可能比限制還多。

## 支出追蹤 {#spend-tracking}

若要結束工作階段，請傳送 `session.close` 並等待帶有最終 `usage` 的 `session.closed`。LiteLLM 會依 OpenAI 回報的 `usage.seconds`，以模型的 `input_cost_per_second` 向工作階段收費。也就是您在 `litellm_params` 中設定的部署自己的 `input_cost_per_second`，否則就是模型成本對照中的值。例如，一個 6 秒音訊的工作階段，費用是 `input_cost_per_second` 的 6 倍。用戶端在未傳送 `session.close` 的情況下中斷 socket 時，LiteLLM 會自行向 OpenAI 傳送 `session.close`，並仍依 OpenAI 的 `session.closed` 中的 `usage.seconds` 收費。工作階段結束時若沒有收到 OpenAI 的 `session.closed`，例如與 OpenAI 的連線中斷，或用戶端中斷後 5 秒內 OpenAI 沒有傳送，LiteLLM 會以最後回報的 `usage.seconds` 與工作階段開啟時間兩者中較大者收費。

工作階段把工作交給 Responses 模型時，OpenAI 會傳送 `response.event` 事件，而 LiteLLM 會以該模型的 token 價格，加上每個已完成回應的 token。模型成本對照中缺少的模型，其 token 會加上 $0。LiteLLM 只加 token 費用，因此網路搜尋等工具的費用不會計費。

全部費用會計入工作階段的支出記錄與金鑰的支出，因此金鑰預算的適用方式與 `/v1/realtime` 上相同。LiteLLM 會在工作階段開始時檢查預算，並在工作階段結束時加上費用，因此一個很長的工作階段可能花費超過預算。該金鑰或模型上的後續工作階段接著會被拒絕。

## 限制 {#limits}

防護欄不會在 Live 工作階段上執行。當 `pre_call`、`post_call` 或 `realtime_input_transcription` 防護欄適用於該工作階段時，LiteLLM 會傳送一個說明 `Guardrails are not supported on OpenAI Live sessions` 的 `error` 事件，並以代碼 1011 關閉工作階段。這包含附加到金鑰的防護欄，以及 `default_on: true` 的防護欄，因此其中一種模式下的 `default_on` 防護欄會關閉代理上的每一個 Live 工作階段。其他模式的防護欄，例如 `during_call`，以及 `guardrails` 查詢參數不會關閉工作階段，而工作階段會在沒有它們的情況下執行。

LiteLLM 會在 WebSocket 路由上，以及以 `POST /v1/live/sessions` 建立的 WebRTC 工作階段上檢查與計費 Live 工作階段。`/v1/live/sessions/{session_id}/` 下的呼叫控制路由（例如 `hangup` 與 `accept`），在代理上沒有 Live 路由。`/openai/v1/live/sessions` 上的 [OpenAI pass-through](/docs/pass_through/openai_passthrough) 會把請求當作一般 pass-through 呼叫轉發給 OpenAI，而 LiteLLM 不會把它們當作 Live 工作階段計費，因此它們的使用永遠不會計入金鑰支出或預算。代理管理員可以將金鑰的 `allowed_routes` 設為 `["/v1/live/sessions"]`，讓金鑰留在 Live 路由上。
