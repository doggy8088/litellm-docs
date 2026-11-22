---
title: 使用 gpt-realtime-translate 的即時翻譯 API
sidebar_label: /realtime/translations
description: 透過單一 LiteLLM proxy，使用 OpenAI gpt-realtime-translate 與 Azure OpenAI 進行即時語音對語音翻譯，支援 WebSocket 或 WebRTC，並提供虛擬金鑰、預算，以及每秒音訊的費用計算。
keywords:
  [
    即時翻譯,
    即時翻譯 API,
    語音對語音翻譯,
    語音翻譯 API,
    gpt-realtime-translate,
    OpenAI 即時翻譯,
    Azure OpenAI 即時翻譯,
    WebRTC 翻譯,
    即時字幕,
  ]
faq:
  - question: 什麼是 gpt-realtime-translate？
    answer: "`gpt-realtime-translate` 是 OpenAI 的即時語音翻譯模型。它接收連續的音訊串流，並以短暫延遲將翻譯以音訊和文字形式回傳。它可在 OpenAI 與 Azure OpenAI 上使用。"
  - question: 即時翻譯的費用是多少？
    answer: 截至 2026 年 11 月，`gpt-realtime-translate` 每秒輸入音訊的費用為 $0.000567。換算後約為每分鐘 $0.034，或每小時 $2.04，OpenAI 與 Azure 皆同。LiteLLM 會將此費用加入金鑰、團隊與使用者的用量。
  - question: 我可以在 Azure OpenAI 上使用 gpt-realtime-translate 嗎？
    answer: 可以。將 `model` 設為 `azure/gpt-realtime-translate`，並加上您的 `api_base` 與 `api_key`。若您的部署有不同的名稱，請在 `model_info` 中加入 `base_model` `azure/gpt-realtime-translate`。
  - question: 即時翻譯應該使用 WebSocket 還是 WebRTC？
    answer: 當您的伺服器持有音訊時（例如檔案、電話通話或媒體伺服器），請使用 WebSocket。瀏覽器或行動應用程式中的麥克風請使用 WebRTC，因為瀏覽器不會取得您的 LiteLLM 金鑰。
  - question: 即時翻譯與 Realtime API 有何不同？
    answer: "`/v1/realtime` 上的 Realtime API 是一場對話，模型會回答每個問題。`/v1/realtime/translations` 上的即時翻譯則是一位即時口譯員。它沒有回合、提示或工具。"
  - question: 我可以對即時翻譯使用防護欄嗎？
    answer: 不可以。防護欄無法讀取翻譯後的音訊。當 `pre_call`、`post_call` 或 `realtime_input_transcription` 防護欄適用於翻譯工作階段時，LiteLLM 會停止該工作階段。若防護欄將 `default_on` 設為 `true`，請在建立金鑰時將 `disable_global_guardrails` 設為 `true`，讓它可以使用翻譯。此設定是 Enterprise 功能。
  - question: 為什麼我的翻譯工作階段在音訊停止後就關閉？
    answer: Azure 會在約 10 秒沒有輸入後關閉翻譯工作階段。音訊結束時請傳送 `session.close`。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import RealtimeTranslationFlow from '@site/src/components/RealtimeTranslationFlow';

# 即時翻譯 {#realtime-translation}

<SinceVersion v="1.110.0" />

即時翻譯會在說話者說話的同時，將語音從一種語言轉換為另一種語言。您的應用程式會在說話者說話時傳送音訊。模型 `gpt-realtime-translate` 會以短暫延遲將翻譯以音訊和文字形式回傳。LiteLLM 在 `/v1/realtime/translations` 上為 OpenAI、Azure 與 `azure_ai` 提供此服務。

## 這是什麼 {#what-it-is}

翻譯工作階段就像一位即時口譯員。您只需設定一次目標語言，並傳送連續的音訊串流。模型會以目標語言回傳相同的話語。工作階段沒有回合、提示、工具或 `response.create` 事件。

即時翻譯適用於即時字幕、即時配音、不同語言使用者之間的通話與會議，以及面向多國使用者的語音應用程式。對於速度不重要的錄製檔案，[`/audio/transcriptions`](/docs/audio_transcription) 與 [`/audio/speech`](/docs/text_to_speech) 的費用較低。

## 運作方式 {#how-it-works}

選擇一個步驟，或讓圖表播放。

<RealtimeTranslationFlow />

工作階段開始時，LiteLLM 會檢查您的 LiteLLM 金鑰並選擇一個部署。工作階段期間，LiteLLM 會將每個事件原封不動地傳送到另一端。工作階段結束時，LiteLLM 會將費用加入金鑰、團隊與使用者的用量。

## 設定 proxy {#set-up-the-proxy}

這兩個步驟只需執行一次。本頁的所有使用案例都使用此設定。

### 1. 將模型加入您的設定 {#1-add-the-model-to-your-config}

<Tabs>
<TabItem value="openai" label="OpenAI">

```yaml
model_list:
  - model_name: translation
    litellm_params:
      model: openai/gpt-realtime-translate
      api_key: os.environ/OPENAI_API_KEY
```

</TabItem>
<TabItem value="azure" label="Azure">

```yaml
model_list:
  - model_name: translation
    litellm_params:
      model: azure/gpt-realtime-translate
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
```

若您的 Azure 部署有不同的名稱，請設定 `model: azure/<deployment-name>`，並在 `model_info` 中加入 `base_model: azure/gpt-realtime-translate`。LiteLLM 便會使用正確的價格與通訊協定。

</TabItem>
</Tabs>

用戶端會在 `?model=` 查詢參數中傳送 `model_name`。若用戶端未傳送 `model`，LiteLLM 會使用 `model_name` `gpt-realtime-translate`。

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

## 選擇您的使用案例 {#pick-your-use-case}

| 您想要 | 連線方式 | 前往 |
| --- | --- | --- |
| 翻譯錄製的音訊檔案，或試用此模型 | WebSocket，從指令稿 | [翻譯音訊檔案](#translate-an-audio-file) |
| 翻譯您的伺服器取得的即時音訊，例如電話通話或媒體串流 | WebSocket，從您的伺服器 | [在伺服器應用程式中翻譯即時音訊](#translate-live-audio-in-a-server-app) |
| 翻譯瀏覽器或行動應用程式中的麥克風音訊 | WebRTC，從裝置 | [在瀏覽器或行動應用程式中翻譯麥克風音訊](#translate-microphone-audio-in-a-browser-or-mobile-app) |

## 翻譯音訊檔案 {#translate-an-audio-file}

用此方式試用模型，或翻譯錄製的檔案。請使用 LiteLLM 儲存庫中的指令稿 [`cookbook/gpt_realtime_translate.py`](https://github.com/BerriAI/litellm/blob/89a6b5fbb26b632ef0faf633b0d3cf317d73deaa/cookbook/gpt_realtime_translate.py)。該指令稿會以錄製語音的速度，透過 proxy 傳送 WAV 檔案。它會在翻譯文字回傳時顯示出來，並將翻譯後的語音寫入 `translated.wav`。

```bash
pip install websockets
export LITELLM_API_KEY=sk-<your-litellm-api-key>   # a LiteLLM virtual key
curl -sO https://raw.githubusercontent.com/BerriAI/litellm/89a6b5fbb26b632ef0faf633b0d3cf317d73deaa/cookbook/gpt_realtime_translate.py

python gpt_realtime_translate.py speech.wav \
  --base-url http://localhost:4000 \
  --model translation \
  --target-language fr
```

輸入必須是 24 kHz 的單聲道 16 位元 PCM WAV 檔案。若要將其他音訊檔案轉換為此格式，請使用 `ffmpeg`：

```bash
ffmpeg -i input.mp3 -ac 1 -ar 24000 -sample_fmt s16 speech.wav
```

## 在伺服器應用程式中翻譯即時音訊 {#translate-live-audio-in-a-server-app}

當您的伺服器取得音訊時（例如來自電話通話、媒體伺服器或即時串流），請使用此方式。您的伺服器持有 LiteLLM 金鑰。所有 WebSocket 用戶端都可運作。此 Python 範例使用 [`websockets`](https://websockets.readthedocs.io/) 函式庫，並展示完整的通訊協定：

```python
import asyncio
import base64
import json
import os

import websockets

URL = "ws://localhost:4000/v1/realtime/translations?model=translation"
CHUNK = 4800  # 100 ms of 24 kHz mono PCM16


async def translate(pcm: bytes, language: str = "fr") -> None:
    headers = {"Authorization": f"Bearer {os.environ['LITELLM_API_KEY']}"}
    async with websockets.connect(URL, additional_headers=headers) as ws:
        # 1. Set the target language and wait until the session accepts it
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {"audio": {"output": {"language": language}}},
        }))
        while json.loads(await ws.recv())["type"] != "session.updated":
            pass

        async def send_audio() -> None:
            # 2. Stream audio at real-time speed, then close the session
            for i in range(0, len(pcm), CHUNK):
                chunk = pcm[i : i + CHUNK]
                await ws.send(json.dumps({
                    "type": "session.input_audio_buffer.append",
                    "audio": base64.b64encode(chunk).decode(),
                }))
                await asyncio.sleep(len(chunk) / 48_000)
            await ws.send(json.dumps({"type": "session.close"}))

        sender = asyncio.create_task(send_audio())
        # 3. Read translated text (and audio) until the session closes
        async for raw in ws:
            event = json.loads(raw)
            if event["type"] == "session.output_transcript.delta":
                print(event["delta"], end="", flush=True)
            elif event["type"] == "session.output_audio.delta":
                pass  # base64 PCM16: play it or write it to a file
            elif event["type"] in ("session.closed", "error"):
                print("\n", event)
                break
        await sender
```

不帶 `/v1` 的路由 `/realtime/translations` 也可以使用。若 proxy 使用 TLS，請使用 `wss://`。

## 在瀏覽器或行動應用程式中翻譯麥克風音訊 {#translate-microphone-audio-in-a-browser-or-mobile-app}

當音訊來自瀏覽器或行動應用程式中的麥克風時，請使用 WebRTC。瀏覽器不會取得您的 LiteLLM 金鑰，音訊會直接在瀏覽器與提供者之間傳輸。流程與 [即時 WebRTC](/docs/proxy/realtime_webrtc) 相同，但在翻譯路由上進行。

**步驟 1。** 在您的伺服器上，使用您的 LiteLLM 金鑰取得短期 token。在同一個請求中設定目標語言：

```bash
curl -X POST http://localhost:4000/v1/realtime/translations/client_secrets \
  -H "Authorization: Bearer sk-<your-litellm-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"model": "translation", "session": {"audio": {"output": {"language": "fr"}}}}'
```

回應中的 `value` 就是 token。只有 LiteLLM 可以解密它。

**步驟 2。** 在瀏覽器中，使用 token 傳送 SDP offer：

```javascript
const pc = new RTCPeerConnection();
const player = document.createElement("audio");
player.autoplay = true;
pc.ontrack = (e) => (player.srcObject = e.streams[0]); // translated speech
const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(mic.getTracks()[0]);

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
const res = await fetch("http://localhost:4000/v1/realtime/translations/calls", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/sdp" },
  body: offer.sdp,
});
await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
```

來自 `/v1/realtime/translations/client_secrets` 的 token 只能在 `/v1/realtime/translations/calls` 上使用。若您將 `"type": "translation"` 傳送至 `/v1/realtime/client_secrets`，LiteLLM 會回傳 400。

## 參考 {#reference}

本節提供路由、事件、費用規則與防護欄規則。

### 路由 {#routes}

| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/v1/realtime/translations?model=<model_name>` | WebSocket | 使用 LiteLLM 金鑰的翻譯工作階段 |
| `/v1/realtime/translations/client_secrets` | POST | 取得 WebRTC 用的短期 token |
| `/v1/realtime/translations/calls` | POST | 將 WebRTC SDP offer 轉換為 SDP answer |

這三個路由也都可以在不帶 `/v1` 前綴的情況下使用。

### 事件 {#events}

| 來源 | 事件 | 功能 |
| --- | --- | --- |
| 您的應用程式 | `session.update` | 在 `session.audio.output.language` 中設定目標語言 |
| 您的應用程式 | `session.input_audio_buffer.append` | 傳送一個 base64 PCM16 音訊區塊 |
| 您的應用程式 | `session.close` | 停止工作階段並請求最終用量 |
| 模型 | `session.created`, `session.updated` | 確認工作階段及其設定 |
| 模型 | `session.output_audio.delta` | 一個翻譯後語音區塊，base64 PCM16 |
| 模型 | `session.output_transcript.delta` | 一個翻譯後文字區塊 |
| 模型 | `session.input_transcript.delta` | 一個說話者語言的文字區塊 |
| 模型 | `session.closed` | 工作階段已停止。包含 `usage` |
| 模型 | `error` | 發生失敗。工作階段可能會關閉 |

LiteLLM 不會變更這些事件。所有欄位請參閱 OpenAI 的 [即時翻譯指南](https://developers.openai.com/api/docs/guides/realtime-translation)。

### 用量追蹤 {#spend-tracking}

LiteLLM 會以模型的 `input_cost_per_second`，對每秒輸入音訊計費。截至 2026 年 11 月，`gpt-realtime-translate` 在 OpenAI 與 Azure 上約為每分鐘 $0.034。請參閱 models.litellm.ai 上的 [gpt-realtime-translate 價格與限制](https://models.litellm.ai/models/gpt-realtime-translate)。費用會記入用量記錄以及金鑰、團隊與使用者的用量，因此預算的套用方式與其他呼叫相同。

秒數來自 `session.closed` 中的 `usage.input_seconds`。若提供者未傳送此值，LiteLLM 會計算您的用戶端傳送的音訊秒數。因此，請務必傳送 `session.close` 並等待 `session.closed`。只收到 error 事件的工作階段（例如來自未知模型），會被記錄為失敗，LiteLLM 不會對其計費。

在 WebRTC 上，音訊不會經過代理。代理會以自己的連線加入每通電話，並從加入的那一刻起到通話結束為止，按秒計費。代理無法加入的通話會收到 `503`，且不會開始。關於重新連線與 `meter_webrtc_calls` 設定，請參閱[計費與限制](/docs/proxy/realtime_webrtc#billing-and-limits)。

若要使用不同的價格，請在部署上設定 `input_cost_per_second`：

```yaml
model_list:
  - model_name: translation
    litellm_params:
      model: openai/gpt-realtime-translate
      api_key: os.environ/OPENAI_API_KEY
      input_cost_per_second: 0.0005
```

### 防護欄 {#guardrails}

防護欄無法讀取翻譯後的音訊。因此，當 `pre_call`、`post_call` 或 `realtime_input_transcription` 防護欄適用於翻譯工作階段時，LiteLLM 會停止該工作階段。WebSocket 會以代碼 1008 關閉，WebRTC 路由則回傳 400。

這些模式中 `default_on: true` 的防護欄會停止 proxy 上所有金鑰的翻譯。若要讓金鑰使用翻譯，請在建立金鑰或其團隊時設定 `disable_global_guardrails: true`。此設定是 [Enterprise](/docs/enterprise) 功能，且只會關閉 `default_on` 防護欄。由金鑰或團隊附加的防護欄，或請求中指名的防護欄，仍會停止翻譯。`during_call` 模式的防護欄，以及帶有 [`stream_scope: non_streaming`](/docs/proxy/guardrails/quick_start#run-on-streaming-or-non-streaming-requests-only-with-stream_scope) 的 `post_call` 防護欄，不會停止翻譯。

其他即時工作階段的防護欄，請參閱 [即時防護欄](/docs/proxy/guardrails/realtime_guardrails)。

## 疑難排解 {#troubleshooting}

| 問題 | 原因 | 修正方式 |
| --- | --- | --- |
| 工作階段在音訊停止約 10 秒後關閉 | Azure 會在沒有輸入時關閉翻譯工作階段 | 音訊結束時傳送 `session.close`。Cookbook 指令稿會加上 1.5 秒的靜音，讓模型能完成最後一句話。 |
| 交握以 403 失敗 | 金鑰缺失、無效、超過預算，或無法使用該模型 | 比較金鑰的 `models` 與您設定中的 `model_name` |
| WebSocket 立即以 1008 關閉 | 有防護欄適用於工作階段 | 請參閱 [防護欄](#guardrails) |
| 錯誤表示不支援該提供者 | 翻譯僅能在 OpenAI 與 Azure 上運作，以及透過 WebSocket 的 `azure_ai` | 使用這些提供者之一的部署 |
| 翻譯不清晰，或沒有聲音 | 音訊不是 24 kHz 單聲道 PCM16 | 傳送音訊前，先變更取樣率與格式 |

## 常見問題 {#faq}

{/* Keep these answers the same as the faq list in the front matter. */}

### 什麼是 gpt-realtime-translate？ {#what-is-gpt-realtime-translate}

`gpt-realtime-translate` 是 OpenAI 的即時語音翻譯模型。它接收連續的音訊串流，並以短暫延遲將翻譯以音訊和文字形式回傳。它可在 OpenAI 與 Azure OpenAI 上使用。

### 即時翻譯的費用是多少？ {#how-much-does-realtime-translation-cost}

截至 2026 年 11 月，`gpt-realtime-translate` 每秒輸入音訊的費用為 $0.000567。換算後約為每分鐘 $0.034，或每小時 $2.04，OpenAI 與 Azure 皆同。LiteLLM 會將此費用加入金鑰、團隊與使用者的用量。

### 我可以在 Azure OpenAI 上使用 gpt-realtime-translate 嗎？ {#can-i-use-gpt-realtime-translate-on-azure-openai}

可以。將 `model` 設為 `azure/gpt-realtime-translate`，並加上您的 `api_base` 與 `api_key`。若您的部署有不同的名稱，請在 `model_info` 中加入 `base_model` `azure/gpt-realtime-translate`。

### 即時翻譯應該使用 WebSocket 還是 WebRTC？ {#do-i-use-websocket-or-webrtc-for-realtime-translation}

當您的伺服器持有音訊時（例如檔案、電話通話或媒體伺服器），請使用 WebSocket。瀏覽器或行動應用程式中的麥克風請使用 WebRTC，因為瀏覽器不會取得您的 LiteLLM 金鑰。

### 即時翻譯與 Realtime API 有何不同？ {#how-is-realtime-translation-different-from-the-realtime-api}

`/v1/realtime` 上的 Realtime API 是一場對話，模型會回答每個問題。`/v1/realtime/translations` 上的即時翻譯則是一位即時口譯員。它沒有回合、提示或工具。

### 我可以對即時翻譯使用防護欄嗎？ {#can-i-use-guardrails-with-realtime-translation}

不可以。防護欄無法讀取翻譯後的音訊。當 `pre_call`、`post_call` 或 `realtime_input_transcription` 防護欄適用於翻譯工作階段時，LiteLLM 會停止該工作階段。若防護欄將 `default_on` 設為 `true`，請在建立金鑰時將 `disable_global_guardrails` 設為 `true`，讓它可以使用翻譯。此設定是 Enterprise 功能。

### 為什麼我的翻譯工作階段在音訊停止後就關閉？ {#why-does-my-translation-session-close-after-the-audio-stops}

Azure 會在約 10 秒沒有輸入後關閉翻譯工作階段。音訊結束時請傳送 `session.close`。
