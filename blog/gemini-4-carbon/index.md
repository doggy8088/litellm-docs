---
slug: gemini-4-carbon
title: "LiteLLM 對 Gemini 4 Carbon 的 API 定價與 Day 0 支援"
date: 2026-11-10T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "Gemini 4 Carbon 在 11 月 30 日前每 1M 輸入 token 為 $2.00、每 1M 輸出 token 為 $10.00，與 Gemini 4 Argon 相同。LiteLLM 在 AI Studio 與 Google Cloud 上提供 Day 0 支援。"
card_title: "Gemini 4 Carbon"
card_summary: "Google 最強的推理模型，11 月 30 日前價格與 Argon 相同，每 1M token 為 $2 / $10。1M context、thinking 等級。"
image: ./hero.png
tags: [gemini, gemini 4, gemini-4-carbon, pricing, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GeminiCarbonHero from './Hero';

export const Hero = GeminiCarbonHero;

LiteLLM 現在已於 Day 0 支援 [Gemini 4 Carbon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/)。透過 LiteLLM AI Gateway 在 Google AI Studio 與 Gemini Enterprise Agent Platform（原 Vertex AI）上使用它，並將花費、速率限制與記錄集中在一處管理。

{/* truncate */}

## Gemini 4 Carbon 定價 {#gemini-4-carbon-pricing}

每 1M token 的上市價格，至 2026 年 11 月 30 日止：

- **輸入：** $2.00 / MTok
- **輸出：** $10.00 / MTok。Thinking token 以輸出計費。
- **快取讀取：** $0.10 / MTok。Carbon 僅支援隱含快取。
- **Batch 與 Flex：** 輸入 $1.00、輸出 $5.00
- **Priority：** 輸入 $3.60、輸出 $18.00

2026 年 12 月 1 日起，這些價格調漲一倍，成為輸入 $4.00、輸出 $20.00、快取讀取 $0.20。在 Gemini Enterprise Agent Platform 上，區域端點的價格比 `global` 高 10%。

所有提供者的價格：https://models.litellm.ai/models/gemini-4-carbon

## 透過 LiteLLM 使用 Gemini 4 Carbon {#use-gemini-4-carbon-with-litellm}

無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="ai-studio" label="Google AI Studio">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-4-carbon
    litellm_params:
      model: gemini/gemini-4-carbon
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
  - model_name: gemini-4-carbon
    litellm_params:
      model: vertex_ai/gemini-4-carbon
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
  "model": "gemini-4-carbon",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ],
  "reasoning_effort": "low"
}'
```

LiteLLM 會將 `reasoning_effort` 作為 Carbon 的 `thinking_level` 傳送。

## FAQ {#faq}

### Gemini 4 Carbon 的價格是多少？ {#how-much-does-gemini-4-carbon-cost}

至 2026 年 11 月 30 日止，每 1M 輸入 token 為 $2.00、每 1M 輸出 token 為 $10.00，與 Gemini 4 Argon 相同。12 月 1 日起，價格調整為 $4.00 與 $20.00。

### Gemini 4 Carbon 的定價與 Gemini 4 Argon 相同嗎？ {#is-gemini-4-carbon-priced-the-same-as-gemini-4-argon}

是的。兩者在 11 月 30 日前皆為每 1M token $2.00 / $10.00，自 12 月 1 日起為 $4.00 / $20.00。

### Gemini 4 Carbon 的 context window 是多少？ {#what-is-the-context-window-of-gemini-4-carbon}

輸入、thinking 與輸出合計 1,048,576 個 token。Google 每個同步請求最多回傳 65,536 個輸出 token，而 LiteLLM 會以與 Argon 相同的方式[接續超過該上限的輸出](../gemini-4-argon/index.md#long-outputs)。

### Gemini 4 Carbon 支援哪些 thinking 等級？ {#which-thinking-levels-does-gemini-4-carbon-support}

`low`、`medium` 與 `high`，預設為 `medium`。透過 `reasoning_effort` 設定。

### Gemini 4 Carbon 支援 context caching 嗎？ {#does-gemini-4-carbon-support-context-caching}

僅支援隱含快取，自 4,096 個 prompt token 起。不支援明確快取。

### Gemini 4 Carbon 上的 Google Search grounding 是免費的嗎？ {#is-google-search-grounding-free-on-gemini-4-carbon}

每月前 5,000 次查詢免費，與 Gemini 3 及更新的模型共用，之後每 1,000 次查詢 $14。LiteLLM 自 [PR #50951](https://github.com/BerriAI/litellm/pull/50951) 起追蹤這個共用額度。

### 如何以 OpenAI 相容的 API 呼叫 Gemini 4 Carbon？ {#how-do-i-call-gemini-4-carbon-with-an-openai-compatible-api}

將 `gemini/gemini-4-carbon` 加入您的 LiteLLM 設定。接著對 Proxy 傳送標準的 `/chat/completions` 請求，並將 `"model"` 設為 `"gemini-4-carbon"`。

## 意見回饋 {#feedback}

問題與意見請至 [GitHub discussion #50970](https://github.com/BerriAI/litellm/discussions/50970)。

## 參考資料 {#references}

- Gemini 4 Carbon 的 LiteLLM 模型頁面，包含所有提供者的價格：[models.litellm.ai/models/gemini-4-carbon](https://models.litellm.ai/models/gemini-4-carbon)
- `gemini/gemini-4-carbon` 的 LiteLLM 定價：[PR #50931](https://github.com/BerriAI/litellm/pull/50931)
- `vertex_ai/gemini-4-carbon` 的 LiteLLM 定價：[PR #50942](https://github.com/BerriAI/litellm/pull/50942)
- Google：[Gemini 4 Carbon 發表](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/)、[模型頁面](https://aistudio.google.com/docs/models/gemini-4-carbon)、[最新消息](https://aistudio.google.com/docs/whats-new-gemini-4-carbon)與[定價](https://aistudio.google.com/docs/pricing)
