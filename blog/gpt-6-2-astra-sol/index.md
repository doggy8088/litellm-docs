---
slug: gpt-6-2-astra-sol
title: "LiteLLM 對 GPT-6.2 Astra 與 GPT-6.2 Sol 的 API 定價與 Day 0 支援"
date: 2026-11-17T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "GPT-6.2 Astra 每 1M 輸入 token 為 $8、每 1M 輸出 token 為 $40，比 GPT-6 Astra 低 20%。GPT-6.2 Sol 維持 $2 / $10。LiteLLM 提供 Day 0 支援。"
card_title: "GPT-6.2 Astra 與 Sol"
card_summary: "Astra 降至每 1M token $8 / $40，Sol 維持 $2 / $10，兩者皆為 1.05M 上下文視窗。"
image: ./hero.png
tags: [openai, gpt-6.2, gpt-6.2-astra, gpt-6.2-sol, pricing, day 0 support]
hide_table_of_contents: false
---

import Head from '@docusaurus/Head';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GptAstraSolHero from './Hero';

<Head>
  <meta property="og:video" content="https://docs.litellm.ai/img/blog/gpt-6-2-astra-sol/hero.mp4" />
  <meta property="og:video:secure_url" content="https://docs.litellm.ai/img/blog/gpt-6-2-astra-sol/hero.mp4" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />
</Head>

export const Hero = GptAstraSolHero;

LiteLLM 現在已於 Day 0 支援 [GPT-6.2 Astra 與 GPT-6.2 Sol](https://openai.com/index/introducing-gpt-6-2-astra-sol/)。OpenAI 將 Astra 的價格調降 20%，並表示它在 Agents' Last Exam 上比 GPT-6 Astra 高出 5.2 分。Sol 維持原價，在 FrontierCode 2.0 上與 Astra 的差距在 0.5 分以內。透過 LiteLLM AI Gateway 使用兩者，設定方式與其他所有 OpenAI 模型相同。花費、速率限制與記錄都集中在一處。

{/* truncate */}

## GPT-6.2 Astra 與 GPT-6.2 Sol 定價 {#gpt-62-astra-and-gpt-62-sol-pricing}

GPT-6.2 Astra 每 1M token 的價格：

- **輸入：** $8.00 / MTok，輸入 token 超過 272K 時為 $16.00 / MTok
- **輸出：** $40.00 / MTok，輸入 token 超過 272K 時為 $60.00 / MTok
- **快取讀取：** $0.40 / MTok，輸入 token 超過 272K 時為 $0.80 / MTok
- **快取寫入：** 30 分鐘 $10.00 / MTok，12 小時 $20.00 / MTok

GPT-6.2 Sol 每 1M token 的價格：

- **輸入：** $2.00 / MTok，輸入 token 超過 272K 時為 $4.00 / MTok
- **輸出：** $10.00 / MTok，輸入 token 超過 272K 時為 $15.00 / MTok
- **快取讀取：** $0.10 / MTok，輸入 token 超過 272K 時為 $0.20 / MTok
- **快取寫入：** 30 分鐘 $2.50 / MTok，12 小時 $5.00 / MTok

兩個模型皆適用 Batch 5 折，Fast 模式價格為 2 倍。GPT-6.2 Astra 的輸入與輸出比 GPT-6 Astra 便宜 20%，快取輸入便宜 60%。Sol 的價格與 GPT-6.1 Sol 相同。

定價詳情：https://models.litellm.ai/models/gpt-6.2-astra 與 https://models.litellm.ai/models/gpt-6.2-sol

## 透過 LiteLLM 使用 GPT-6.2 Astra 與 GPT-6.2 Sol {#use-gpt-62-astra-and-gpt-62-sol-with-litellm}

無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-6.2-astra
    litellm_params:
      model: openai/gpt-6.2-astra
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-6.2-sol
    litellm_params:
      model: openai/gpt-6.2-sol
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.109.1 \
  --config /app/config.yaml
```

**3. 測試它**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6.2-astra",
    "messages": [
      {"role": "user", "content": "Plan the migration of this service to a new database."}
    ],
    "reasoning_effort": "medium"
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-6.2-sol",
    messages=[
        {"role": "user", "content": "Plan the migration of this service to a new database."}
    ],
    reasoning_effort="medium",
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

OpenAI 透過 Responses API 為這些模型提供 tool calling。LiteLLM 會替您將帶有 tools 的 `/chat/completions` 請求傳送至 `/v1/responses`。

## 常見問題 {#faq}

### GPT-6.2 Astra 的價格是多少？ {#how-much-does-gpt-62-astra-cost}

每 1M 輸入 token 為 $8.00、每 1M 輸出 token 為 $40.00。快取讀取每 1M token 為 $0.40。輸入 token 超過 272K 時，價格為 $16.00、$60.00 與 $0.80。

### GPT-6.2 Sol 的價格是多少？ {#how-much-does-gpt-62-sol-cost}

每 1M 輸入 token 為 $2.00、每 1M 輸出 token 為 $10.00，與 GPT-6.1 Sol 相同。快取讀取每 1M token 為 $0.10。

### GPT-6.2 Astra 是否比 GPT-6 Astra 便宜？ {#is-gpt-62-astra-cheaper-than-gpt-6-astra}

是的。GPT-6 Astra 每 1M token 的費用為 $10 / $50，GPT-6.2 Astra 為 $8 / $40。快取輸入便宜 60%。

### 我應該使用 GPT-6.2 Astra 還是 GPT-6.2 Sol？ {#should-i-use-gpt-62-astra-or-gpt-62-sol}

OpenAI 表示 Sol 在 FrontierCode 2.0 上與 Astra 的差距在 0.5 分以內，費用約為五分之一。Astra 在長時間代理任務上領先，在 Agents' Last Exam 上比 GPT-6 Astra 高出 5.2 分。請將兩者都放入您的設定中，並依任務路由。

### GPT-6.2 Astra 與 GPT-6.2 Sol 的上下文視窗有多大？ {#what-is-the-context-window-of-gpt-62-astra-and-gpt-62-sol}

兩者皆為 1,050,000 個 token，輸入最多 922,000 個 token，輸出最多 128,000 個 token。

### GPT-6.2 模型接受哪些 reasoning effort 值？ {#which-reasoning-effort-values-do-the-gpt-62-models-accept}

OpenAI 會在 GPT-6.2 Astra 與 GPT-6.2 Sol 上拒絕 `none` 與 `minimal`，並建議從 `medium` 開始。`temperature`、`top_p` 與 `logprobs` 也不支援。

### 如何透過 OpenAI 相容 API 呼叫 GPT-6.2 Astra？ {#how-do-i-call-gpt-62-astra-with-an-openai-compatible-api}

將 `openai/gpt-6.2-astra` 加入您的 LiteLLM 設定。然後向 proxy 傳送標準的 `/chat/completions` 請求，並將 `"model"` 設為 `"gpt-6.2-astra"`。

## 意見回饋 {#feedback}

問題與意見回饋請至 [GitHub discussion #52347](https://github.com/BerriAI/litellm/discussions/52347)。

## 參考資料 {#references}

- `openai/gpt-6.2-astra` 與 `openai/gpt-6.2-sol` 的 LiteLLM 定價：[PR #52316](https://github.com/BerriAI/litellm/pull/52316)
- `azure/gpt-6.2-astra` 與 `azure/gpt-6.2-sol` 的 LiteLLM 定價：[PR #52293](https://github.com/BerriAI/litellm/pull/52293)
- OpenAI：[GPT-6.2 Astra 與 GPT-6.2 Sol 公告](https://openai.com/index/introducing-gpt-6-2-astra-sol/)
