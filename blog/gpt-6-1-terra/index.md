---
slug: gpt-6-1-terra
title: "LiteLLM 對 GPT-6.1 Terra 的 API 定價與 Day 0 支援"
date: 2026-10-26T12:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "GPT-6.1 Terra 每 1M 輸入 token 為 $1、每 1M 輸出 token 為 $5，是 GPT-6.1 Sol 的半價。LiteLLM 提供 Day 0 支援。"
card_title: "GPT-6.1 Terra"
card_summary: "價格為 GPT-6.1 Sol 的一半，每 1M token 為 $1 / $5，Terminal-Bench 4.0 達 50.3%，1.05M context。"
image: ./hero.png
tags: [openai, gpt-6.1, gpt-6.1-terra, pricing, day 0 support]
hide_table_of_contents: false
---

import Head from '@docusaurus/Head';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GptTerraHero from './Hero';

<Head>
  <meta property="og:video" content="https://docs.litellm.ai/img/blog/gpt-6-1-terra/hero.mp4" />
  <meta property="og:video:secure_url" content="https://docs.litellm.ai/img/blog/gpt-6-1-terra/hero.mp4" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />
</Head>

export const Hero = GptTerraHero;

LiteLLM 現在已於 Day 0 支援 [GPT-6.1 Terra](https://openai.com/index/introducing-gpt-6-1-terra/)。透過 LiteLLM AI Gateway 使用它，設定方式與其他所有 OpenAI 模型相同。花費、速率限制與記錄都集中在一處。

{/* truncate */}

## GPT-6.1 Terra 定價 {#gpt-61-terra-pricing}

- **輸入：** $1.00 / MTok，輸入 token 超過 272K 時為 $2.00 / MTok
- **輸出：** $5.00 / MTok，輸入 token 超過 272K 時為 $7.50 / MTok
- **快取讀取：** $0.05 / MTok，輸入 token 超過 272K 時為 $0.10 / MTok
- **Batch 與 Flex：** 5 折。Fast 模式價格為 2 倍。

依 OpenAI 所述，這些價格比 GPT-5.6 Terra 與 GPT-6.1 Sol 的價格低 50%。

| 模型 | 輸入 / MTok | 輸出 / MTok |
|---|---|---|
| **GPT-6.1 Terra** | **$1.00** | **$5.00** |
| GPT-6.1 Sol | $2.00 | $10.00 |
| GPT-5.6 Terra | $2.00 | $12.00 |

所有提供者的價格：https://models.litellm.ai/models

## GPT-6.1 Terra 的新功能 {#whats-new-in-gpt-61-terra}

- **Terminal-Bench 4.0 達 50.3%**（最高 effort 下），是 GPT-5.6 Terra 21.5% 的兩倍以上，依 OpenAI 所述
- **更少的事實錯誤：** 在 OpenAI 容易誘發錯誤的 prompt 上以低 effort 執行時，錯誤率從 53.6% 降至 16.7%
- **Reasoning effort 從 `none` 到 `max`**，預設為 `medium`
- **1.05M token 的 context window**（922K 輸入），輸出最多 128K token

## 透過 LiteLLM 使用 GPT-6.1 Terra {#use-gpt-61-terra-with-litellm}

無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-6.1-terra
    litellm_params:
      model: openai/gpt-6.1-terra
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 Proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.106.2 \
  --config /app/config.yaml
```

**3. 測試**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6.1-terra",
    "messages": [
      {"role": "user", "content": "Read this invoice and list the line items."}
    ],
    "reasoning_effort": "low"
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-6.1-terra",
    messages=[
        {"role": "user", "content": "Read this invoice and list the line items."}
    ],
    reasoning_effort="low",
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

OpenAI 透過 Responses API 為這個模型提供 tool calling。當 reasoning 開啟時，LiteLLM 會替您將帶有 tools 的 `/chat/completions` 請求傳送至 `/v1/responses`。

## FAQ {#faq}

### GPT-6.1 Terra 的價格是多少？ {#how-much-does-gpt-61-terra-cost}

每 1M 輸入 token 為 $1.00、每 1M 輸出 token 為 $5.00。快取讀取每 1M token 為 $0.05。輸入 token 超過 272K 時，價格為 $2.00、$7.50 與 $0.10。

### GPT-6.1 Terra 的 context window 是多少？ {#what-is-the-context-window-of-gpt-61-terra}

1,050,000 個 token，輸入最多 922,000 個 token，輸出最多 128,000 個 token。

### 如何以 OpenAI 相容的 API 呼叫 GPT-6.1 Terra？ {#how-do-i-call-gpt-61-terra-with-an-openai-compatible-api}

將 `openai/gpt-6.1-terra` 加入您的 LiteLLM 設定。接著對 Proxy 傳送標準的 `/chat/completions` 請求，並將 `"model"` 設為 `"gpt-6.1-terra"`。

## 意見回饋 {#feedback}

問題與意見請至 [GitHub discussion #48443](https://github.com/BerriAI/litellm/discussions/48443)。

## 參考資料 {#references}

- `gpt-6.1-terra` 的 LiteLLM 定價：[PR #48429](https://github.com/BerriAI/litellm/pull/48429)
