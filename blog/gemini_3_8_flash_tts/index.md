---
slug: gemini_3_8_flash_tts
title: "第 0 天支援：Gemini 3.8 Flash TTS 與 Flash-Lite TTS"
date: 2026-09-23T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM 的 /v1/audio/speech 對 Gemini 3.8 Flash TTS 與 Flash-Lite TTS 的第 0 天支援，並追蹤至 2026 年的上市定價。"
image: ./hero.png
tags: [gemini, gemini-3.8-flash-tts, text to speech, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Gemini 3.8 Flash TTS 與 Flash-Lite TTS](./hero.png)

LiteLLM 透過 `/v1/audio/speech`，在 Google AI Studio（`gemini/`）第 0 天支援 `gemini-3.8-flash-tts` 與 `gemini-3.8-flash-lite-tts`。兩者皆為正式可用，並取代 3.1 Flash TTS 預覽版。

{/* truncate */}

[根據 Google](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/)，Flash TTS 專為遊戲、有聲書和 Podcast 等創意工作而打造，而 Flash-Lite TTS 則是更便宜的級別，適合大量配音與語音代理程式。兩者皆使用超過 2,000 種預先建置的聲音，且 Flash TTS 支援 130 種語言並具備自動偵測功能。

:::note
**不需要升級 Docker 映像。** 兩個模型都會透過 LiteLLM 現有的 Gemini 語音路徑進行路由，因此任何較新的版本都可用於推論。若要進行成本追蹤，請在 Admin UI 中按下 **Reload Model Cost Map** 按鈕（或 `POST /reload/model_cost_map`），以從 [PR #42752](https://github.com/BerriAI/litellm/pull/42752) 讀取定價，適用於 `v1.76.0` 及以上版本。
:::

## 上市定價 {#launch-pricing}

兩個模型的上市促銷定價皆適用至 2026 年 12 月 31 日，並自 2027 年 1 月 1 日起適用 Google 的標準定價。LiteLLM 會以上市費率追蹤成本。

Flash TTS 為每 100 萬個文字輸入 token 0.50 美元、每 100 萬個音訊輸出 token 9.00 美元，而 Flash-Lite TTS 為 0.50 美元與 6.00 美元。Batch 與 Flex 的費率為這些價格的一半，Priority 則為 1.8 倍。作為比較，3.1 Flash TTS 預覽版的輸入為 1.00 美元、輸出為 20.00 美元。

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm

response = litellm.speech(
    model="gemini/gemini-3.8-flash-tts",
    input="Welcome back. Your order shipped this morning.",
    voice="Kore",
)

response.stream_to_file("welcome.wav")
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.8-flash-tts
    litellm_params:
      model: gemini/gemini-3.8-flash-tts
      api_key: os.environ/GEMINI_API_KEY
  - model_name: gemini-3.8-flash-lite-tts
    litellm_params:
      model: gemini/gemini-3.8-flash-lite-tts
      api_key: os.environ/GEMINI_API_KEY
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試**

```bash
curl http://0.0.0.0:4000/v1/audio/speech \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3.8-flash-tts",
    "input": "Welcome back. Your order shipped this morning.",
    "voice": "Kore"
  }' \
  --output welcome.wav
```

</TabItem>
</Tabs>

## 注意事項 {#notes}

輸入上限為每次請求 8,192 個 token，輸出上限為 16,384 個 token，因此請將像有聲書章節這類長篇稿件拆分成多次呼叫。請在 `voice` 中以名稱傳入預先建置的聲音；請參閱 Google 的 [speech generation guide](https://ai.google.dev/gemini-api/docs/speech-generation) 取得清單。

## 回饋 {#feedback}

透過 LiteLLM 執行 Gemini 3.8 TTS 並遇到意料之外的情況嗎？請在 [GitHub discussion #42776](https://github.com/BerriAI/litellm/discussions/42776) 分享。
