---
slug: gemini-4-hydrogen
title: "LiteLLM 對 Gemini 4 Hydrogen 的 API 定價與 Day 0 支援"
date: 2026-11-12T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "Gemini 4 Hydrogen 每 1M 輸入 token 為 $1.50、每 1M 輸出 token 為 $7.50，在其 1M context window 內價格一致。LiteLLM 在 AI Studio 與 Google Cloud 上提供 Day 0 支援。"
card_title: "Gemini 4 Hydrogen"
card_summary: "Google 快速的代理程式模型，在 AA Intelligence Index 上領先 Argon，每 1M token 為 $1.50 / $7.50。"
image: ./hero.png
tags: [gemini, gemini 4, gemini-4-hydrogen, pricing, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GeminiHydrogenHero from './Hero';

export const Hero = GeminiHydrogenHero;

LiteLLM 現在已於 Day 0 支援 [Gemini 4 Hydrogen](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/)。Google 將 Hydrogen 打造為用於程式開發與代理程式工作流程的快速日常模型，它在 Artificial Analysis Intelligence Index 上得到 51 分，Gemini 4 Argon 則為 50 分。透過 LiteLLM AI Gateway 在 Google AI Studio 與 Gemini Enterprise Agent Platform（原 Vertex AI）上使用它，並將花費、速率限制與記錄集中在一處管理。

{/* truncate */}

## Gemini 4 Hydrogen 定價 {#gemini-4-hydrogen-pricing}

每 1M token 的價格，在完整的 1M token context window 內皆相同：

- **輸入：** $1.50 / MTok
- **輸出：** $7.50 / MTok。Thinking token 以輸出計費。
- **快取讀取：** $0.075 / MTok。Hydrogen 僅支援隱含快取。
- **Batch 與 Flex：** 輸入 $0.75、輸出 $3.75
- **Priority：** 輸入 $2.70、輸出 $13.50

Gemini 4 Argon 與 Gemini 4 Carbon 在 11 月 30 日前為 $2.00 / $10.00，自 12 月 1 日起為 $4.00 / $20.00，因此 Hydrogen 是價格最低的 Gemini 4 模型。在 Gemini Enterprise Agent Platform 上，區域端點的價格比 `global` 高 10%。

定價詳情：https://models.litellm.ai/models/gemini-4-hydrogen

## 透過 LiteLLM 使用 Gemini 4 Hydrogen {#use-gemini-4-hydrogen-with-litellm}

無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="ai-studio" label="Google AI Studio">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-4-hydrogen
    litellm_params:
      model: gemini/gemini-4-hydrogen
      api_key: os.environ/GEMINI_API_KEY
```

**2. 啟動 Proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.106.2 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-4-hydrogen
    litellm_params:
      model: vertex_ai/gemini-4-hydrogen
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: global
```

**2. 啟動 Proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e VERTEX_PROJECT=$VERTEX_PROJECT \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/credentials.json:/app/credentials.json \
  ghcr.io/berriai/litellm:v1.106.2 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_KEY" \
--data '{
  "model": "gemini-4-hydrogen",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ],
  "reasoning_effort": "medium"
}'
```

LiteLLM 會將 `reasoning_effort` 作為 Hydrogen 的 `thinking_level` 傳送。

## FAQ {#faq}

### Gemini 4 Hydrogen 的價格是多少？ {#how-much-does-gemini-4-hydrogen-cost}

每 1M 輸入 token 為 $1.50、每 1M 輸出 token 為 $7.50，長 prompt 不另收費。Batch 與 Flex 的價格減半。

### Gemini 4 Hydrogen 比 Gemini 4 Argon 便宜嗎？ {#is-gemini-4-hydrogen-cheaper-than-gemini-4-argon}

是的。Hydrogen 每 1M token 為 $1.50 / $7.50。Argon 與 Carbon 在 11 月 30 日前為 $2.00 / $10.00，自 12 月 1 日起為 $4.00 / $20.00。

### Gemini 4 Hydrogen 在 Google AI Studio 上免費嗎？ {#is-gemini-4-hydrogen-free-on-google-ai-studio}

是的。Google AI Studio 在 Standard 分頁列出 Hydrogen 的免費層級。Google Search grounding 僅限付費層級。

### Gemini 4 Hydrogen 的 context window 是多少？ {#what-is-the-context-window-of-gemini-4-hydrogen}

輸入、thinking 與輸出合計 1,048,576 個 token。Google 每個同步請求最多回傳 65,536 個輸出 token，而 LiteLLM 會以與 Argon 相同的方式[接續超過該上限的輸出](../gemini-4-argon/index.md#long-outputs)。

### Gemini 4 Hydrogen 支援哪些 thinking 等級？ {#which-thinking-levels-does-gemini-4-hydrogen-support}

`low`、`medium`、`high` 與 `xhigh`，預設為 `high`。透過 `reasoning_effort` 設定 `low`、`medium` 或 `high`。透過 `reasoning_effort` 支援 `xhigh` 一事追蹤於 [PR #47086](https://github.com/BerriAI/litellm/pull/47086)。

### 如何從 Gemini 3.8 Flash 切換到 Gemini 4 Hydrogen？ {#how-do-i-switch-from-gemini-38-flash-to-gemini-4-hydrogen}

將設定中的 `gemini/gemini-3.8-flash` 改為 `gemini/gemini-4-hydrogen`。Google 表示 Hydrogen 完成任務的速度是 3.8 Flash 的 2.5 倍。

### Gemini 4 Hydrogen 支援 context caching 嗎？ {#does-gemini-4-hydrogen-support-context-caching}

僅支援隱含快取，自 4,096 個 prompt token 起。不支援明確快取。

### Gemini 4 Hydrogen 上的 Google Search grounding 是免費的嗎？ {#is-google-search-grounding-free-on-gemini-4-hydrogen}

每月前 5,000 次查詢免費，與 Gemini 3 及更新的模型共用，之後每 1,000 次查詢 $14。Google Maps grounding 的額度與價格相同。

### 如何以 OpenAI 相容的 API 呼叫 Gemini 4 Hydrogen？ {#how-do-i-call-gemini-4-hydrogen-with-an-openai-compatible-api}

將 `gemini/gemini-4-hydrogen` 加入您的 LiteLLM 設定。接著對 Proxy 傳送標準的 `/chat/completions` 請求，並將 `"model"` 設為 `"gemini-4-hydrogen"`。

## 意見回饋 {#feedback}

問題與意見請至 [GitHub discussion #51436](https://github.com/BerriAI/litellm/discussions/51436)。

## 參考資料 {#references}

- Gemini 4 Hydrogen 的 LiteLLM 模型頁面，包含所有提供者的價格：[models.litellm.ai/models/gemini-4-hydrogen](https://models.litellm.ai/models/gemini-4-hydrogen)
- `gemini/gemini-4-hydrogen` 的 LiteLLM 定價：[PR #51423](https://github.com/BerriAI/litellm/pull/51423)
- `vertex_ai/gemini-4-hydrogen` 的 LiteLLM 定價：[PR #51432](https://github.com/BerriAI/litellm/pull/51432)
- Google：[Gemini 4 Hydrogen 發表](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/)、[模型頁面](https://aistudio.google.com/docs/models/gemini-4-hydrogen)、[最新消息](https://aistudio.google.com/docs/whats-new-gemini-4-hydrogen)與[定價](https://aistudio.google.com/docs/pricing)
