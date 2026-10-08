---
slug: gpt_6_1_sol
title: "Day 0 支援：GPT-6.1 Sol"
date: 2026-09-29T12:00:00
image: /img/litellm_gpt_6_1_sol_announcement.png
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM 對 GPT-6.1 Sol 的 Day 0 支援，快取輸入價格只有 GPT-6 Sol 的一半。"
tags: [openai, gpt-6, gpt-6.1-sol, completion, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x GPT-6.1 Sol](/img/litellm_gpt_6_1_sol_announcement.png)

LiteLLM 現在支援 [GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/)。您可以使用與其他所有 OpenAI 模型相同的設定，透過 LiteLLM AI Gateway 將流量路由到它。

{/* truncate */}

GPT-6.1 Sol 是 GPT-6 Sol 的升級版，輸入與輸出價格維持每 100 萬 token 分別為 $2 和 $10，且快取輸入價格減半至 $0.10。根據 OpenAI，這個模型在 DeepSWE v1.1 上可媲美 GPT-6 Astra，成本約為五分之一；在 Terminal-Bench Science 上，每個任務平均為 $5.47，而 Opus 5.5 則為 $23.21。

:::note
**不需要升級圖片。** 定價已在 [PR #43738](https://github.com/BerriAI/litellm/pull/43738) 中上線；請在 Admin UI 中按下 **Reload Model Cost Map**（或 `POST /reload/model_cost_map`）以載入，適用於 `v1.76.0` 及以上版本。
:::

## 使用方式 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-6.1-sol
    litellm_params:
      model: openai/gpt-6.1-sol
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:main-latest \
  --config /app/config.yaml
```

**3. 測試它**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6.1-sol",
    "messages": [
      {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ],
    "reasoning_effort": "high"
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-6.1-sol",
    messages=[
        {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ],
    reasoning_effort="high",
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 定價 {#pricing}

每 100 萬 token（USD），短上下文（≤272K token）／長上下文（>272K token）。

| 模型 | 輸入 | 快取輸入 | 快取寫入 | 輸出 |
|-------|-------|--------------|-------------|--------|
| `gpt-6.1-sol` | $2.00 / $4.00 | $0.10 / $0.20 | $2.50 / $5.00 | $10.00 / $15.00 |

Batch 和 Flex 的費率為上述一半，Fast mode 則為兩倍；LiteLLM 會從同一個 cost map 列追蹤所有費率。

## 備註 {#notes}

OpenAI 目前僅在 Responses API 上提供此模型的工具呼叫。LiteLLM 會為您將帶有 tools 的 `/chat/completions` 請求橋接為 `/v1/responses`，因此現有的工具呼叫程式碼仍可正常運作。

Reasoning effort 的範圍從 `low` 到 `max`，預設為 `medium`。不同於 GPT-6 Sol，`none` 不受支援，因此此模型無法使用 `temperature`。

## 回饋 {#feedback}

透過 LiteLLM 執行 GPT-6.1 Sol 時遇到非預期情況嗎？請到 [GitHub discussion #43742](https://github.com/BerriAI/litellm/discussions/43742) 分享。
