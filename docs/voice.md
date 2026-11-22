---
title: 語音與即時音訊
sidebar_label: 語音（即時）
description: 透過 LiteLLM 代理使用虛擬金鑰、預算與支出追蹤，執行即時語音代理、即時轉錄與即時語音翻譯。涵蓋 GPT-Live、Realtime API、gpt-live-transcribe 與 gpt-realtime-translate。
keywords:
  [
    語音,
    即時語音,
    語音代理程式,
    語音對語音,
    GPT-Live,
    gpt-live-1,
    gpt-realtime,
    gpt-live-transcribe,
    gpt-realtime-translate,
    WebRTC,
    WebSocket,
  ]
---

# 語音與即時音訊 {#voice-and-realtime-audio}

{/* keep-version-note */}

在您的應用程式與語音模型之間放上 LiteLLM。您的應用程式使用 LiteLLM 虛擬金鑰連線到代理，代理再使用提供者金鑰連線到提供者。您可以在同一個地方控制語音工作階段的模型存取、預算與支出。

本頁協助您為模型選擇路由、執行第一個工作階段，並找到各項任務的對應頁面。

## 選擇路由 {#pick-a-route}

語音模型分為四個家族。每個家族在代理上都有自己的路由，而一個家族的模型無法在另一個家族的路由上執行。

| 您想要 | 模型 | 代理上的路由 | 提供者 |
| --- | --- | --- | --- |
| [進行有回合與工具的語音對話](/docs/realtime) | `gpt-realtime-2.1` 與其他 Realtime 模型 | `WS /v1/realtime` | OpenAI、Azure、xAI、Gemini、Vertex AI、Bedrock |
| [進行全雙工語音對話](/docs/live_sessions) | `gpt-live-1` | `WS /v1/live/sessions` | OpenAI、Azure |
| [將即時語音轉成文字](/docs/realtime#live-transcription-with-gpt-live-transcribe) | `gpt-live-transcribe` | `WS /v1/realtime?intent=transcription` | OpenAI、Azure |
| [翻譯即時語音](/docs/realtime_translation) | `gpt-realtime-translate` | `WS /v1/realtime/translations` | OpenAI、Azure |

每項任務都會連結到其設定指南。

`gpt-live-transcribe` 名稱中有「live」，但它執行於 Realtime 路由。請只將 `gpt-live-1` 傳送到 `/v1/live/sessions`。

不需要即時工作階段的音訊，請使用 [`/audio/transcriptions`](/docs/audio_transcription) 轉錄檔案，並使用 [`/audio/speech`](/docs/text_to_speech) 產生語音。

## 選擇傳輸方式 {#pick-a-transport}

| 您的音訊來自 | 使用 | 原因 |
| --- | --- | --- |
| 您的伺服器，例如電話通話或媒體串流 | WebSocket | 您的伺服器持有 LiteLLM 金鑰並傳送音訊 |
| 瀏覽器或行動應用程式中的麥克風 | [WebRTC](/docs/proxy/realtime_webrtc) | 瀏覽器取得短期權杖，音訊直接送往提供者，不經過代理 |

WebRTC 適用於 OpenAI 與 Azure 上的 Realtime 模型、`gpt-live-transcribe` 與 `gpt-realtime-translate`。`gpt-live-1` 有自己的 [WebRTC 路由](/docs/live_sessions#start-a-session-from-a-browser-over-webrtc)。LiteLLM 會對 WebRTC 通話計費，並將其計入預算。翻譯 WebRTC 通話會依通話進行的時間計費。

## 執行第一個工作階段 {#run-a-first-session}

本範例會在 OpenAI 上啟動 Realtime 工作階段，並以文字印出模型的回覆。您需要已安裝 LiteLLM 代理與 OpenAI API 金鑰。

1. 將以下內容儲存為 `config.yaml`：

    ```yaml
    model_list:
      - model_name: gpt-realtime
        litellm_params:
          model: openai/gpt-realtime-2.1
          api_key: os.environ/OPENAI_API_KEY
        model_info:
          mode: realtime

    general_settings:
      master_key: os.environ/LITELLM_MASTER_KEY
    ```

2. 啟動代理。`LITELLM_MASTER_KEY` 是您為代理選擇的管理員金鑰，必須以 `sk-` 開頭。

    ```bash
    export OPENAI_API_KEY="<your OpenAI key>"
    export LITELLM_MASTER_KEY="sk-<a long random string>"
    litellm --config config.yaml
    ```

3. 在第二個終端機中，將以下內容儲存為 `voice_test.py`：

    ```python
    import asyncio
    import json
    import os

    import websockets

    URL = "ws://0.0.0.0:4000/v1/realtime?model=gpt-realtime"


    async def main() -> None:
        headers = {"Authorization": f"Bearer {os.environ['LITELLM_API_KEY']}"}
        async with websockets.connect(URL, additional_headers=headers) as ws:
            session = {"type": "realtime", "output_modalities": ["text"]}
            await ws.send(json.dumps({"type": "session.update", "session": session}))
            await ws.send(
                json.dumps(
                    {
                        "type": "conversation.item.create",
                        "item": {
                            "type": "message",
                            "role": "user",
                            "content": [{"type": "input_text", "text": "Say hello in five words."}],
                        },
                    }
                )
            )
            await ws.send(json.dumps({"type": "response.create"}))
            async for message in ws:
                event = json.loads(message)
                if event["type"] == "response.output_text.delta":
                    print(event["delta"], end="", flush=True)
                if event["type"] in ("response.done", "error"):
                    print()
                    break


    asyncio.run(main())
    ```

4. 使用您的代理金鑰執行它：

    ```bash
    pip install websockets
    export LITELLM_API_KEY="$LITELLM_MASTER_KEY"
    python voice_test.py
    ```

此指令稿會印出模型的一句簡短問候，例如 `Hello there, my friend, hello.`

若 WebSocket 以 HTTP 403 關閉，表示代理拒絕了該金鑰。請檢查 `LITELLM_API_KEY` 是否與 `LITELLM_MASTER_KEY` 相符，或是否為可呼叫 `gpt-realtime` 的虛擬金鑰。

若要傳送與接收音訊，請依照 [Realtime 指南](/docs/realtime)操作。若要使用瀏覽器麥克風，請依照 [WebRTC 指南](/docs/proxy/realtime_webrtc)操作。

## 代理為語音工作階段做什麼 {#what-the-proxy-does-for-a-voice-session}

代理會在開啟工作階段之前檢查虛擬金鑰及其模型存取權，並拒絕超出預算的金鑰。工作階段期間，它會以提供者自身的格式將提供者事件傳遞給您的用戶端。結束時，它會將工作階段的費用寫入支出記錄，並計入該金鑰、團隊與使用者的支出。

計費方式依模型家族而定。LiteLLM 會依提供者回報的 token 用量向 Realtime 模型計費，並依每秒音訊向 `gpt-live-1`、`gpt-live-transcribe` 與 `gpt-realtime-translate` 計費。

您可以在同一個 `model_name` 下列出多個部署，以在 OpenAI 與 Azure 之間對 Realtime 工作階段進行負載平衡。

[Realtime 防護欄](/docs/proxy/guardrails/realtime_guardrails)會在 `/v1/realtime` 工作階段上執行。它們不會在 GPT-Live 或翻譯工作階段上執行，而當防護欄適用於這些工作階段時，LiteLLM 會將其關閉。

## 提供者指南 {#provider-guides}

OpenAI 與 Azure 的設定位於 [Realtime](/docs/realtime) 頁面，包括 Azure GA 與 beta 通訊協定。這些提供者各有自己的頁面：

- [xAI Grok Voice](/docs/providers/xai_realtime)
- [Google AI Studio Gemini Live](/docs/providers/google_ai_studio/realtime)
- [Vertex AI Gemini Live](/docs/providers/vertex_realtime)
- [Vertex AI Chirp 轉錄](/docs/providers/vertex_transcription#chirp-realtime-transcription)
- [Bedrock Nova Sonic](/docs/providers/bedrock_realtime_with_audio)
- [Meta Muse Voice 轉錄](/docs/providers/meta#muse-voice-realtime-transcription)
