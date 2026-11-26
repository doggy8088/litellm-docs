---
title: "透過 LiteLLM 使用 Gnani 語音轉文字"
sidebar_label: "Gnani"
description: "使用 Gnani Prisma v3.0 與 v2.5 轉錄音訊：透過 litellm.transcription()、LiteLLM AI 閘道上與 OpenAI 相容的 /audio/transcriptions 端點，或即時透過 /v1/realtime WebSocket。"
---

# Gnani {#gnani}

<SinceVersion v="1.112.0" />

LiteLLM 支援 Gnani 的 Prisma REST 語音轉文字 API，可處理單一最長 30 秒的錄音，Proxy 也會透過與 OpenAI 相容的 `/v1/realtime` WebSocket 將即時音訊串流至 Gnani（[見下文](#realtime-transcription)）。

| 屬性 | 詳細內容 |
|-------|-------|
| 說明 | Gnani 的 Prisma 模型可轉錄印度語系與英語語音，包括混合語言音訊。 |
| LiteLLM 上的提供者路由 | `gnani/` |
| 支援的模型 | `gnani/prisma-v3.0`、`gnani/prisma-v2.5` |
| 提供者文件 | [Gnani REST 參考 ↗](https://docs.gnani.ai/api/STT/speech-to-text) |
| 支援的 OpenAI 端點 | `/audio/transcriptions`、`/realtime`（僅轉錄，Proxy） |

Gnani 接受 WAV、MP3、OGG、FLAC、AAC 與 M4A。上傳時請保留正確的副檔名，因為 Gnani 會依檔名選擇解碼器。對於記憶體中的壓縮音訊，請傳入例如 `("clip.mp3", audio_bytes)` 的元組。

請將 `GNANI_API_KEY` 設為您的 Gnani 金鑰，或傳入 `api_key`。若要使用不同的提供者主機，請設定 `GNANI_API_BASE` 或傳入 `api_base`。LiteLLM 會在其後附加 `/stt/v3`，預設主機為 `https://api.vachana.ai`。

## 快速開始 {#quick-start}

```python
import asyncio
import os
from pathlib import Path

import litellm

os.environ["GNANI_API_KEY"] = ""

audio = Path("lecture.wav")
result = litellm.transcription(model="gnani/prisma-v3.0", file=audio)
print(result.text)

result_v25 = litellm.transcription(model="gnani/prisma-v2.5", file=audio, language="hi")
print(result_v25.text)


async def transcribe():
    result = await litellm.atranscription(
        model="gnani/prisma-v3.0",
        file=audio,
        language="hi,en",
        format="codemix",
        keyterms=["fractions"],
    )
    print(result.text)


asyncio.run(transcribe())
```

## LiteLLM Proxy 用法 {#litellm-proxy-usage}

請將以下內容儲存為 `config.yaml`，設定 `GNANI_API_KEY` 與 `LITELLM_MASTER_KEY`，再以 `litellm --config config.yaml` 啟動 Proxy。

```yaml
model_list:
  - model_name: gnani-prisma-v3
    litellm_params:
      model: gnani/prisma-v3.0
      api_key: os.environ/GNANI_API_KEY
    model_info:
      mode: audio_transcription
  - model_name: gnani-prisma-v2-5
    litellm_params:
      model: gnani/prisma-v2.5
      api_key: os.environ/GNANI_API_KEY
      language: hi
    model_info:
      mode: audio_transcription

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

Prisma v2.5 需要恰好一種語言，因此請在其部署上設定 `language`。未傳入 `language` 的請求會使用該設定，而 Proxy 的 `/health` 檢查也需要它才能呼叫模型。

使用 curl 傳送錄音。

```bash
curl http://localhost:4000/v1/audio/transcriptions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -F model=gnani-prisma-v3 \
  -F file=@lecture.wav
```

或使用 OpenAI SDK。多部分（multipart）用戶端會將陣列以 JSON 字串傳送。

```python
import os
from pathlib import Path

from openai import OpenAI

client = OpenAI(base_url="http://localhost:4000/v1", api_key=os.environ["LITELLM_MASTER_KEY"])
result = client.audio.transcriptions.create(
    model="gnani-prisma-v3",
    file=Path("lecture.wav"),
    extra_body={"format": "codemix", "keyterms": '["fractions"]'},
)
print(result.text)
```

## 參數與回應 {#parameters-and-response}

在 v3.0 上，省略 `language` 可自動偵測語言，或提供一至四個以逗號分隔的提示，例如 `en`、`hi-IN` 或 `hi,en`。在 v2.5 上，請傳入恰好一種語言，例如 `hi` 或 `en-IN`。Gnani 自身的 `language_code` 欄位也可以使用，且優先於 `language`。OpenAI 的 `languages` 清單也可以使用，因此 `languages=["hi", "en"]` 會傳送 `hi-IN,en-IN`。它優先於 `language`，包括部署預設的 `language`，而 `language_code` 優先於兩者。LiteLLM 會將兩個字母的代碼視為其印度地區設定傳送，因此 `hi` 會變成 `hi-IN`，並會修正地區代碼的大小寫，因此 `hi-in` 會變成 `hi-IN`。其他 `gnani/` 模型名稱，例如較新的 Prisma 版本，會使用 v3.0 的參數。

兩個模型都會回傳帶有 `text` 欄位的 JSON。當 Gnani 回報這些資訊時，回應還會包含 `language`（偵測到的語言代碼）、`request_id`，以及 `truncated`；當 Gnani 只轉錄了部分音訊時，`truncated` 為 `true`。成功的無聲片段可能回傳空字串。

兩個模型都接受 `format=transcribe`（使用慣用的數字格式）與 `format=verbatim`（使用口語形式）。Prisma v3.0 還接受 `codemix`（混合文字）與 `transliterate`（拉丁文字）。省略 `format` 即可使用提供者的預設值。OpenAI 另外的 `response_format` 只接受 `json`。

Prisma v3.0 接受最多 200 個 `keyterms`、最多 1,600 個字元的 `topic`、`previous_text`（它會使用最後 600 個字元），以及一至四個 `speaker_names`。在 v3.0 上，LiteLLM 會將 OpenAI 的 `prompt` 以 `previous_text` 傳送，除非您同時傳入 `previous_text`。若要在 v2.5 上加強特定詞彙，請傳入 `bias_list=["Prisma"]` 與 `bias_score=1.5`。OpenAI 的 `keywords` 清單在 v3.0 上會變成 `keyterms`，在 v2.5 上會變成 `bias_list`，除非您同時傳入該欄位。在 v2.5 上，若您未提供 `bias_score`，LiteLLM 會補上 Gnani 建議的 `bias_score` 1.0，因為沒有分數時 Gnani 不會加強任何詞彙。v2.5 只會加強由字母組成的單一詞彙，因此像 `HDFC Bank` 或 `COVID-19` 這類關鍵字在該處會得到 400，而 `drop_params` 會改為捨棄這些關鍵字。片語請使用 v3.0。在 v3.0 上，您傳入的 `bias_list` 優先於 `keywords`，因為 Gnani 會優先使用 `keyterms` 而非 `bias_list`。若要在 v2.5 上以目標文字顯示數字，請使用 `format="transcribe"` 與 `itn_native_numerals=True`。請參閱 [Prisma v3.0 模型指南](https://docs.gnani.ai/api/STT/models/prisma-v3) 與 [Prisma v2.5 模型指南](https://docs.gnani.ai/api/STT/models/prisma-v2-5)。

兩個模型都支援尋找與取代。請傳入 `enable_substitution=True` 以及最多十條規則的 `substitution_map`，例如 `[{"patterns": ["maths"], "replacement": "mathematics"}]`。Gnani 會驗證音訊與內容長度限制，LiteLLM 會將其錯誤回傳給呼叫者。LiteLLM 會將它不認識的其他選項（例如 Gnani 日後新增的選項）以表單欄位傳送給 Gnani。開啟快取時，Gnani 自身的選項（例如 `format`、`language_code` 與 `keyterms`）只有在 `litellm_settings` 下設定了 `enable_caching_on_provider_specific_optional_params: true` 時，才會成為快取鍵的一部分；因此當同一段音訊以不同選項傳送時，請設定它。

若要追蹤請求，請在 SDK 呼叫或部署的 `litellm_params` 中，於 `extra_headers` 設定 `X-API-Request-ID`。LiteLLM 會將 `extra_headers` 以 HTTP 標頭傳送給 Gnani，而 Gnani 會將該 ID 以 `request_id` 回傳。LiteLLM 一律會將已設定的金鑰以 `X-API-Key-ID` 傳送，並捨棄 `extra_headers` 中的任何 `X-API-Key-ID`，不論大小寫。數字或布林值（例如 YAML 中的 `1`）會以文字傳送。

```yaml
model_list:
  - model_name: gnani-prisma-v3
    litellm_params:
      model: gnani/prisma-v3.0
      api_key: os.environ/GNANI_API_KEY
      extra_headers:
        X-API-Request-ID: support-desk-7
    model_info:
      mode: audio_transcription
```

接著，對 `gnani-prisma-v3` 的轉錄請求會在 `text` 旁回傳 `"request_id": "support-desk-7"`。

## 限制 {#limitations}

這些限制適用於 REST 轉錄。Prisma REST 沒有逐字時間戳記、說話者分離或串流。若要使用即時音訊，請參閱[即時轉錄](#realtime-transcription)。OpenAI 的 `temperature`、`timestamp_granularities`、`chunking_strategy`、`include`、`known_speaker_names`、`known_speaker_references` 與 `stream=True` 在此沒有對應項目，`prompt` 在 v2.5 上也一樣，因此 LiteLLM 會對它們回傳 400。對於所選模型不接受的 Gnani 選項（例如 v2.5 上的 `topic`），它同樣會回傳 400。若要改為捨棄它們，請在 SDK 中傳入 `drop_params=True`，或在 Proxy 的 `litellm_settings` 下設定 `drop_params: true`。

Gnani 會限制一個帳號可同時執行的請求數，並對重疊的請求回應 429。測試使用的帳號一次只執行一個請求，且同一帳號下的金鑰共用此上限。Proxy 預設會對 429 重試兩次，測試中足以涵蓋三個重疊請求。若要處理更多平行流量，請提高 `router_settings` 下的 `num_retries`。SDK 函式 `litellm.transcription` 與 `litellm.atranscription` 不會重試，因此會傳送重疊請求的 SDK 程式碼應在已設定 `num_retries` 的 `litellm.Router` 上呼叫 `atranscription`。

```python
import asyncio
import os

import litellm

router = litellm.Router(
    model_list=[
        {
            "model_name": "gnani-prisma-v3",
            "litellm_params": {"model": "gnani/prisma-v3.0", "api_key": os.environ["GNANI_API_KEY"]},
        }
    ],
    num_retries=4,
)


async def main() -> None:
    results = await asyncio.gather(
        *(router.atranscription(model="gnani-prisma-v3", file=open("lecture.wav", "rb")) for _ in range(3))
    )
    print([result.text for result in results])


asyncio.run(main())
```

Gnani 在 LiteLLM 模型成本對照表中沒有已公布的每秒費率，因此在您將合約費率以 `input_cost_per_second` 設定於部署的 `litellm_params` 之前，花費會顯示為零。LiteLLM 會將其乘以上傳錄音的長度，該長度是以 `soundfile` 套件讀取。`pip install 'litellm[proxy]'` 包含它，但一般的 `pip install litellm` 沒有，因此若要計算 SDK 花費，請安裝 `soundfile`。LiteLLM 無法讀取 AAC 與 M4A 上傳檔案，或內含 FLAC 音訊的 OGG 檔案的長度，因此這些請求仍會計費為零。在花費為零期間，金鑰與團隊預算不會限制 Gnani 流量。

```yaml
model_list:
  - model_name: gnani-prisma-v3
    litellm_params:
      model: gnani/prisma-v3.0
      api_key: os.environ/GNANI_API_KEY
      input_cost_per_second: 0.0001
    model_info:
      mode: audio_transcription
```

## 即時轉錄 {#realtime-transcription}

<SinceVersion v="1.113.0" />

Proxy 透過與 OpenAI 相容的 `/v1/realtime` WebSocket，為即時音訊提供 Prisma v3.0 與 v2.5。用戶端使用 OpenAI Realtime 轉錄協定。LiteLLM 會接收音訊並轉交給 Gnani 的串流 API。Gnani 會執行 VAD（語音活動偵測）來判斷每段話語的結束位置，因此每段話語都會有各自的最終逐字稿。

### 1. 將模型加入您的設定 {#1-add-the-model-to-your-config}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gnani-prisma
    litellm_params:
      model: gnani/prisma-v3.0
      api_key: os.environ/GNANI_API_KEY
      input_cost_per_second: 0.0001

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

`api_key` 會退回使用 `GNANI_API_KEY`。`api_base` 會退回使用 `GNANI_API_BASE`，再退回使用 `https://api.vachana.ai`。它必須是 `https://` 或 `wss://` 網址（LiteLLM 會將金鑰放入 WebSocket 交握中）。LiteLLM 會透過 `wss://` 連線，並在路徑後附加 `/stt/v3/stream`。請在部署的 `extra_headers` 中設定 Gnani 連線選項（例如 `format`、`x-idle-timeout-sec`）。

成本對照表中沒有 Gnani 的價格，因此請將您的合約費率設為 `input_cost_per_second`，以便追蹤花費並執行金鑰與團隊預算。

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 2. 轉錄一段錄音 {#2-transcribe-a-recording}

請在查詢字串中使用 `intent=transcription` 連線。此範例會讀取一個 24kHz 單聲道 PCM16 WAV 檔案，並輸出它的第一份最終逐字稿。

```python
import asyncio
import base64
import os
import wave

from openai import AsyncOpenAI


async def transcribe(path):
    async with AsyncOpenAI(base_url="http://localhost:4000/v1", api_key=os.environ["LITELLM_API_KEY"]) as client:
        async with client.realtime.connect(model="gnani-prisma", extra_query={"intent": "transcription"}) as ws:
            await ws.session.update(session={
                "type": "transcription",
                "audio": {"input": {"transcription": {"model": "gnani-prisma", "language": "en"}}},
            })
            with wave.open(path, "rb") as audio:
                assert (audio.getframerate(), audio.getnchannels(), audio.getsampwidth()) == (24000, 1, 2)
                while chunk := audio.readframes(768):
                    await ws.input_audio_buffer.append(audio=base64.b64encode(chunk).decode())
            await ws.input_audio_buffer.commit()
            async for event in ws:
                if event.type == "error":
                    raise RuntimeError(event.error.message)
                if event.type == "conversation.item.input_audio_transcription.completed":
                    print(event.transcript)
                    return


asyncio.run(transcribe("speech.wav"))
```

### 3. 設定工作階段 {#3-configure-the-session}

| 欄位 | 規則 |
| --- | --- |
| `format` | `type` 必須是單聲道的 `audio/pcm`。`rate` 必須是 `8000`、`16000`、`24000`、`44100` 或 `48000`，省略時為 24 kHz。LiteLLM 會將音訊重新取樣為 Gnani 預期的 16 kHz。 |
| `transcription.language` | 一種語言，例如 `hi` 或 `en-IN`；在 Prisma v3.0 上可使用 `indic-auto` 偵測語言，這也是預設值。Prisma v2.5 在第一次附加音訊之前需要一種明確的語言。以逗號分隔的清單會被拒絕。 |
| `turn_detection` | 省略，或 `{"type": "server_vad"}`。Gnani 的伺服器端 VAD 採用固定設定，因此 `threshold`、`prefix_padding_ms`、`silence_duration_ms`、其他任何輪次偵測類型與 `turn_detection: null` 都會被拒絕。 |
| `transcription.prompt` | 會被拒絕。 |

若在部署上設定了 [`drop_params`](/docs/completion/drop_params)，LiteLLM 會捨棄被拒絕的設定並保留 Gnani 的伺服器端 VAD。被拒絕的 `session.update` 會回傳一個 `error` 事件，且工作階段會保持開啟，讓用戶端可以傳送修正後的更新。

### 4. 串流音訊 {#4-stream-audio}

`input_audio_buffer.append` 會以工作階段的取樣率傳送 base64 編碼的單聲道 PCM16 音訊（每次附加最多 4 秒音訊）。Gnani 需要即時音訊，因此 LiteLLM 會以即時方式轉發。請在音訊進來時逐一傳送每次附加（即使錄音傳送得比即時更快，傳到 Gnani 仍需要它本身的長度）。

`input_audio_buffer.commit` 會立即終止目前的話語。自上次逐字稿以來沒有語音的 commit（例如發生在 Gnani 已經自行終止話語之後，或發生在只有靜音的區段上）不會產生任何回覆，因此在這種情況下請勿等待 `input_audio_buffer.committed`。所有其他用戶端事件（包括 `input_audio_buffer.clear` 與 `response.create`）都會產生一個 `error` 事件，且工作階段會保持開啟。

### 5. 讀取逐字稿 {#5-read-transcripts}

| 事件 | 欄位 | 時機 |
| --- | --- | --- |
| `session.created` | `session.type: transcription` | Gnani 已接受連線 |
| `session.updated` | 生效的設定，相同的 `session.id` | Gnani 已接受您的 `session.update` |
| `input_audio_buffer.speech_started` | `item_id` | Gnani 偵測到語音 |
| `input_audio_buffer.speech_stopped` | `item_id` | 在話語的逐字稿之前 |
| `input_audio_buffer.committed` | `item_id`、`previous_item_id` | 在話語的逐字稿之前 |
| `conversation.item.input_audio_transcription.completed` | `item_id`、`transcript`、`usage: {"type": "duration", "seconds": 4.032}`、`detected_language_code`（Gnani 回報時） | 每段話語的最終逐字稿 |
| `error` | `error.message` | Gnani 或 LiteLLM 拒絕了一個事件 |

四個話語事件都帶有一個 `item_id`。`usage.seconds` 是話語的長度，話語之間的靜音會隨下一份逐字稿或工作階段關閉時一併計費。

### 工作階段限制 {#session-limits}

Gnani 會在 15 分鐘後，或在 60 秒未偵測到語音後關閉工作階段。若要變更閒置上限，請在部署的 `extra_headers` 中設定 `x-idle-timeout-sec`（5 至 900）。LiteLLM 不會自動重新開啟已關閉的工作階段，因此您需要開啟新的工作階段，並從上一段已完成的說話內容繼續。

```yaml
model_list:
  - model_name: gnani-prisma
    litellm_params:
      model: gnani/prisma-v3.0
      api_key: os.environ/GNANI_API_KEY
      input_cost_per_second: 0.0001
      extra_headers:
        x-idle-timeout-sec: "300"
```

`gnani-prisma` 上的工作階段在沒有任何語音的情況下最多可保持開啟 5 分鐘。

在 Python 3.13 及以上版本，重新取樣器需要 `audioop-lts` 套件，執行 `pip install 'litellm[proxy]'` 即可安裝。{/* keep-python-version */}
