---
slug: gpt_6_sol_luna
title: "Day 0 支援：GPT-6 Sol 與 GPT-6 Luna"
date: 2026-09-22T12:00:00
image: /img/litellm_gpt_6_sol_luna_announcement.png
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM 對 GPT-6 Sol 與 GPT-6 Luna 的 Day 0 支援，價格僅為其 GPT-5.6 對應模型的一半。"
tags: [openai, gpt-6, gpt-6-sol, gpt-6-luna, completion, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x GPT-6 Sol 和 Luna](/img/litellm_gpt_6_sol_luna_announcement.png)

LiteLLM 現在支援 [GPT-6 Sol 與 GPT-6 Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/)。您可以透過 LiteLLM AI Gateway，使用與其他所有 OpenAI 模型相同的設定，將流量路由到它們。

{/* truncate */}

Sol 和 Luna 加入了 GPT-6 Astra，採用相同方法訓練，並以適合大規模工作負載的價格提供。`gpt-6-sol` 適合複雜的程式碼撰寫與 agentic 工作流程，價格為每 1M tokens 輸入 $2、輸出 $10，`gpt-6-luna` 則是高流量級距，價格為 $0.10 和 $0.50。OpenAI 將兩者定價為其 GPT-5.6 對應模型目前費率的一半。依 OpenAI 所述，`xhigh` 的 Sol 在 AutomationBench 上以每個任務 $0.27 的成本取得 33.2%，在 DeepSWE v1.1 上以 `max` 取得 68.8%；而 Luna 在 DeepSWE 上可達 66.6%。兩者皆保有 1,050,000 個 token 的上下文視窗，其中 922K 為輸入、128K 為輸出，支援文字與圖片輸入，並可將 reasoning effort 從 `none` 執行至 `max`，預設為 `medium`。沒有 GPT-6 Terra；Astra 仍是最高階型號。

:::note
**無須升級圖片。** LiteLLM 已將 GPT-6 名稱視為 GPT-5 請求家族，因此 `max_completion_tokens` 與 reasoning 參數可在從 `v1.101.0` 起的任何版本上處理。定價已登錄於 [PR #42515](https://github.com/BerriAI/litellm/pull/42515)；請在管理介面中按下 **重新載入模型成本對照表**（或 `POST /reload/model_cost_map`）以取得它，適用於 `v1.76.0` 及以上版本。
:::

## 使用方式 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-6-sol
    litellm_params:
      model: openai/gpt-6-sol
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-6-luna
    litellm_params:
      model: openai/gpt-6-luna
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

**3. 測試**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6-sol",
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
    model="openai/gpt-6-sol",
    messages=[
        {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ],
    reasoning_effort="high",
)

print(response.choices[0].message.content)
```

```python
# gpt-6-luna for focused, high-volume work
response = completion(
    model="openai/gpt-6-luna",
    messages=[
        {"role": "user", "content": "Classify this ticket as bug, feature, or question."}
    ],
    reasoning_effort="none",
    temperature=0,
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## Responses API {#responses-api}

對於 agentic 與多輪工作流程，請使用 `/v1/responses` 以在各輪之間保留 reasoning 狀態。

```bash
curl -X POST "http://0.0.0.0:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6-sol",
    "input": "Plan and write a Python script that scrapes a webpage and summarizes it."
  }'
```

## 定價 {#pricing}

價格以每 1M tokens（USD）計算，並以短上下文（≤272K tokens）/ 長上下文（>272K tokens）顯示。

| Model | Input | Cached input | Cache write | Output |
|-------|-------|--------------|-------------|--------|
| `gpt-6-sol` | $2.00 / $4.00 | $0.20 / $0.40 | $2.50 / $5.00 | $10.00 / $15.00 |
| `gpt-6-luna` | $0.10 / $0.20 | $0.01 / $0.02 | $0.125 / $0.25 | $0.50 / $0.75 |

Flex 與 Batch 的費率為上述一半，Priority 則為兩倍；LiteLLM 會從同一個成本對照表列追蹤所有費率。

## 備註 {#notes}

`temperature` 僅在 reasoning 關閉時適用，因此請連同 `reasoning_effort="none"` 一併送出，如上方 Luna 範例所示。若未提供，LiteLLM 會丟棄或拒絕該參數，因為預設 effort 為 `medium`。

這兩個模型都支援 OpenAI 明確的 prompt cache breakpoint，LiteLLM 會在 `/chat/completions`、`/responses` 與 `/v1/messages` 上直接轉送；請參閱 [prompt caching](/docs/completion/prompt_caching)。OpenAI 也表示，在對話中途變更 reasoning effort 或 tools 不再會破壞 cache，若您將不同 effort 等級路由到同一個 deployment，這點就很重要。

## 回饋 {#feedback}

透過 LiteLLM 執行 GPT-6 Sol 或 Luna 時遇到意料之外的問題？請在 [GitHub discussion #42523](https://github.com/BerriAI/litellm/discussions/42523) 分享。
