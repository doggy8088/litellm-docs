---
title: "透過 LiteLLM 使用 Gnani 語音轉文字"
sidebar_label: "Gnani"
description: "使用 Gnani Prisma v3.0 與 v2.5 轉錄音訊：透過 litellm.transcription()，或 LiteLLM AI 閘道上與 OpenAI 相容的 /audio/transcriptions 端點。"
---

# Gnani {#gnani}

<SinceVersion v="1.112.0" />

LiteLLM 支援 Gnani 的 Prisma REST 語音轉文字 API，可處理單一最長 30 秒的錄音。

| 屬性 | 詳細內容 |
|-------|-------|
| 說明 | Gnani 的 Prisma 模型可轉錄印度語系與英語語音，包括混合語言音訊。 |
| LiteLLM 上的提供者路由 | `gnani/` |
| 支援的模型 | `gnani/prisma-v3.0`、`gnani/prisma-v2.5` |
| 提供者文件 | [Gnani REST 參考 ↗](https://docs.gnani.ai/api/STT/speech-to-text) |
| 支援的 OpenAI 端點 | `/audio/transcriptions` |

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

此整合涵蓋 REST 轉錄。Prisma REST 沒有逐字時間戳記、說話者分離或串流。OpenAI 的 `temperature`、`timestamp_granularities`、`chunking_strategy`、`include`、`known_speaker_names`、`known_speaker_references` 與 `stream=True` 在此沒有對應項目，`prompt` 在 v2.5 上也一樣，因此 LiteLLM 會對它們回傳 400。對於所選模型不接受的 Gnani 選項（例如 v2.5 上的 `topic`），它同樣會回傳 400。若要改為捨棄它們，請在 SDK 中傳入 `drop_params=True`，或在 Proxy 的 `litellm_settings` 下設定 `drop_params: true`。

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
