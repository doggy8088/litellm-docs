---
slug: gemini-4-argon
title: "Gemini 4 Argon API 定價與 LiteLLM 上的 Day 0 支援"
date: 2026-10-13T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "Gemini 4 Argon 在 11 月 30 日前，每 1M 輸入 token 為 $2.00、每 1M 輸出 token 為 $10.00。LiteLLM 在 AI Studio 與 Google Cloud 上提供 Day 0 支援。"
card_title: "Gemini 4 Argon"
card_summary: "Google 的新旗艦：DeepSWE v1.1 達 77.9%，1M 上下文，思考等級，11 月 30 日前每 1M token 為 $2 / $10。"
image: ./hero.png
tags: [gemini, gemini 4, gemini-4-argon, pricing, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GeminiArgonHero from './Hero';

export const Hero = GeminiArgonHero;

LiteLLM 現在於 Day 0 支援 [Gemini 4 Argon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/)。透過 LiteLLM AI Gateway，在 Google AI Studio 與 Gemini Enterprise Agent Platform（前身為 Vertex AI）上使用它。支出、速率限制與記錄都集中在一處。

{/* truncate */}

## Gemini 4 Argon 定價 {#gemini-4-argon-pricing}

Google AI Studio 上的上市價格，每 1M token，至 2026 年 11 月 30 日止：

- **輸入：** $2.00 / MTok
- **輸出：** $10.00 / MTok。思考 token 以輸出計費。
- **快取讀取：** $0.10 / MTok。Argon 僅支援隱式快取。
- **Batch 與 Flex：** 輸入與輸出 5 折

2026 年 12 月 1 日，這些價格翻倍為輸入 $4.00、輸出 $20.00、快取讀取 $0.20。

每個提供者的價格：https://models.litellm.ai/models

## Gemini 4 Argon 的新功能 {#whats-new-in-gemini-4-argon}

- **DeepSWE v1.1 達 77.9%**，由 Google 提供
- **1M token 上下文窗口**，輸入與輸出合計。Google 將每個請求上限設為 32,768 個輸出 token（串流時為 65,536），而 LiteLLM 會為您延續超過該上限
- **思考等級 low、medium 與 high。**Argon 不支援 `thinking_budget`。

## 透過 LiteLLM 使用 Gemini 4 Argon {#use-gemini-4-argon-with-litellm}

無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，並點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用於 `v1.76.0` 及以上版本。

<Tabs>
<TabItem value="ai-studio" label="Google AI Studio">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-4-argon
    litellm_params:
      model: gemini/gemini-4-argon
      api_key: os.environ/GEMINI_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.107.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-4-argon
    litellm_params:
      model: vertex_ai/gemini-4-argon
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: global
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e VERTEX_PROJECT=$VERTEX_PROJECT \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/credentials.json:/app/credentials.json \
  ghcr.io/berriai/litellm:v1.107.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "gemini-4-argon",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ],
  "reasoning_effort": "high"
}'
```

LiteLLM 將 `reasoning_effort` 作為其 `thinking_level` 傳送給 Argon。

## 長輸出 {#long-outputs}

從 `v1.107.0-dev.3` 起，將 `max_tokens` 設定為高於 Google 的每請求上限，LiteLLM 就會持續進行。當 Google 以 `continuationToken` 結束一個請求時，LiteLLM 會帶著該 token 再次傳送請求，直到答案完成或 `max_tokens` 用完為止。這適用於 Google AI Studio 與 Gemini Enterprise Agent Platform 上 `/chat/completions`、`/v1/messages` 與 `/v1/responses` 的一元與串流呼叫。`n` 大於 1 的請求只會傳送一次，`max_tokens` 不是整數的請求也是如此，未設定 `LITELLM_GEMINI_DEFAULT_MAX_OUTPUT_TOKENS` 時沒有 `max_tokens` 的請求亦然。

- **沒有 `max_tokens` 的請求：**從 `v1.108.0` 起，將環境變數 `LITELLM_GEMINI_DEFAULT_MAX_OUTPUT_TOKENS` 設定為一個整數，未傳送輸出上限的 Gemini chat completion、text completion 或 Responses API 請求就會取得該預算，無論是透過 proxy 或 Python SDK。`/v1/messages` 需要 `max_tokens`，因此該環境變數在那裡永不適用。LiteLLM 將預算上限設為成本對照表中該模型的 `max_output_tokens`，或部署自身的 `model_info.max_output_tokens`（當後者較低時），因為 Gemini Enterprise Agent Platform 對於超出模型範圍的值會回應 400。它不會給予成本對照表中缺少的模型、或在其中列為聊天模型以外類型的模型（例如圖像模型）預設值，也不會給予其成本對照表條目在 `supported_output_modalities` 中未包含文字的聊天模型（例如 Lyria 音樂模型）、`modalities` 要求文字以外內容的請求、`extra_body` 欄位含有 snake_case `generation_config` 的請求、以 `continuation_token` 恢復的請求、在 `gemini/` 或 `vertex_ai/` 模型上 Google 原生的 `/v1beta/models/{model}:generateContent` 路由，或 Gemini Enterprise Agent Platform 批次作業。請求本身已帶有的任何輸出上限優先，例如它自己的 `max_tokens`、`max_completion_tokens` 或 `max_output_tokens`，或部署的 `litellm_params.max_tokens`。零、負數或非整數的值視為未設定。在不回傳 `continuationToken` 的模型上，該預算就是一個普通的輸出上限。
- **選擇預算：**它也會限制能在一個請求內完成的答案，因此低於模型自身每請求上限的值（Gemini 4 Argon 上為 32,768，串流時為 65,536）會讓答案更早被截斷。思考 token 也會計入其中，因此在思考模型上，過低的值可能讓答案幾乎沒有或完全沒有空間。它限制的是輸出 token，而不是成本，因為傳送給 Google 的每個請求都會再次傳送提示與目前為止的答案，並將它們計為提示 token。從未設定 `max_tokens` 的用戶端現在會等待完整的答案。數值很大時，非串流請求可能跑超過用戶端自身的逾時（OpenAI SDK 中為 600 秒），而 SDK 隨後會重試，LiteLLM 則繼續運行並對它已放棄的請求計費，因此請串流長答案，或給用戶端 **Timeouts** 項目所述的空間。
- **使用量**會跨請求加總，因此成本與支出與 Google 的帳單相符。第一個請求的提示計數會保留為多請求答案上的 `usage.prompt_tokens_details.initial_prompt_tokens`。
- **被截斷的答案**在 `/chat/completions` 上以 `finish_reason: "length"` 結束，並回傳 `provider_specific_fields.continuation_token`。帶著該 `"continuation_token"` 與更高的 `max_tokens` 再次傳送請求即可延續它，因為 Google 會跨整個答案計算 `max_tokens`。
- **中斷的串流**以錯誤結束。LiteLLM 尚未從 Google 的串流中途恢復 token 重新接續它。
- **逾時：**傳送給 Google 的每個請求都在部署的 `timeout` 下運行，未設定時為 600 秒。達到 32,768 上限的非串流請求大約需要 10 分鐘，因此請在提供長答案的部署上設定 `timeout: 1200`，並給您的用戶端容納完整答案的空間。

## FAQ {#faq}

### Gemini 4 Argon 的費用是多少？ {#how-much-does-gemini-4-argon-cost}

至 2026 年 11 月 30 日止，每 1M 輸入 token 為 $2.00、每 1M 輸出 token 為 $10.00。12 月 1 日，價格改為 $4.00 與 $20.00。快取讀取在此之前每 1M token 為 $0.10。

### Gemini 4 Argon 的上下文窗口是多少？ {#what-is-the-context-window-of-gemini-4-argon}

1,048,576 個 token，輸入與輸出合計。Google 每個請求最多回傳 32,768 個輸出 token（串流時為 65,536），而從 `v1.107.0-dev.3` 起，LiteLLM 會跨請求延續，直到 `max_tokens` 用完為止。

### 如何以 OpenAI 相容的 API 呼叫 Gemini 4 Argon？ {#how-do-i-call-gemini-4-argon-with-an-openai-compatible-api}

將 `gemini/gemini-4-argon` 加入您的 LiteLLM 設定。然後向 proxy 傳送一個標準的 `/chat/completions` 請求，並帶 `"model": "gemini-4-argon"`。

## 回饋 {#feedback}

問題與回饋請至 [GitHub discussion #46238](https://github.com/BerriAI/litellm/discussions/46238)。

## 參考資料 {#references}

- `gemini/gemini-4-argon` 的 LiteLLM 定價：[PR #46227](https://github.com/BerriAI/litellm/pull/46227)
- LiteLLM 對 Gemini 4 的長輸出支援：[PR #46240](https://github.com/BerriAI/litellm/pull/46240)
- LiteLLM 對 Gemini 的預設輸出預算：[PR #47542](https://github.com/BerriAI/litellm/pull/47542)
- Google：[Gemini 4 Argon 公告](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/)、[模型頁面](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon) 與 [定價](https://ai.google.dev/gemini-api/docs/pricing)
