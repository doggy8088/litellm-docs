---
slug: gpt_6_astra
title: "第 0 天支援：GPT-6 Astra"
date: 2026-09-03T11:00:00
image: /img/litellm_gpt_6_astra_announcement.png
authors:
  - misbah
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM 對 OpenAI 的 GPT-6 Astra 提供第 0 天支援，包含定價、推理參數與 Responses API 橋接。"
tags: [openai, gpt-6, gpt-6-astra, completion, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x GPT-6 Astra](/img/litellm_gpt_6_astra_announcement.png)

LiteLLM 現在支援 `gpt-6-astra`，OpenAI 的下一個主要模型。您可以透過 LiteLLM AI Gateway，使用與其他 OpenAI 模型相同的設定將流量路由到它。

{/* truncate */}

Astra 是 GPT-6 名稱下的第一個模型，而 OpenAI 自己的[研究文章](https://openai.com/index/ten-advances-in-mathematics-and-theoretical-computer-science/)預覽了它為數學與理論電腦科學中的十個未解問題產生經機器驗證的證明。它在 FrontierMath Tier 4 取得 98%、在 ARC-AGI 3 取得 99.9%、在 ExploitBench 取得 100%，具備 1,050,000 token 的上下文視窗、128K 最大輸出、2026 年 4 月 30 日的知識截止時間，以及文字與圖片輸入。透過 API，它的行為類似 GPT-5 推理系列：`max_completion_tokens` 而不是 `max_tokens`，`reasoning_effort` 最多到 `xhigh`，推理開啟時沒有 `temperature`，具備提示快取，以及 272K 輸入 token 以上的長上下文定價級距。

:::note
**成本追蹤可在您目前執行的版本上運作。** 在管理介面中按下 **重新載入模型成本映射** 按鈕（或 `POST /reload/model_cost_map`）即可從 GitHub 取得 `gpt-6-astra` 定價。此功能適用於 `v1.76.0` 及以上版本。

**參數處理需要下一個版本。** LiteLLM 中的 GPT-5 推理分類器只比對 `gpt-5*` 名稱，因此在舊版中，`gpt-6-astra` 請求會保持 `max_tokens` 和 `temperature` 為送出時的原樣，而 OpenAI 會拒絕它們。將其擴充以支援 GPT-6 的修正已在 `main` 上，並會在本週六的 release candidate 中推出；在您升級之前，請自行傳送 `max_completion_tokens`，並讓 `temperature` 保持未設定。
:::

## 用法 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-6-astra
    litellm_params:
      model: openai/gpt-6-astra
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
    "model": "gpt-6-astra",
    "messages": [
      {"role": "user", "content": "Prove that there are infinitely many primes."}
    ],
    "reasoning_effort": "high"
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-6-astra",
    messages=[
        {"role": "user", "content": "Prove that there are infinitely many primes."}
    ],
    reasoning_effort="high",
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## Responses API {#responses-api}

對於代理式與多輪工作流程，請使用 `/v1/responses` 以在各輪之間保留推理狀態。將函式工具與啟用中的推理結合的 `litellm.completion()` 呼叫，會自動橋接到 `/v1/responses`，就像 GPT-5.4 及更新版本一樣。

```bash
curl -X POST "http://0.0.0.0:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-6-astra",
    "input": "Plan and write a Python script that scrapes a webpage and summarizes it.",
    "reasoning": {"effort": "high"}
  }'
```

## 定價 {#pricing}

價格以每 100 萬 token（USD）計算，並以短上下文（≤272K tokens）/ 長上下文（>272K tokens）顯示。

| 模型 | 輸入 | 快取輸入 | 快取寫入 | 輸出 |
|-------|-------|--------------|-------------|--------|
| `gpt-6-astra` | $10.00 / $20.00 | $1.00 / $2.00 | $12.50 / $25.00 | $50.00 / $75.00 |

`flex` 服務級別按標準費率的一半計費，而 `priority` 則為兩倍，且同時適用於短與長上下文級距；Batch API 的計費則為標準輸入與輸出費率的一半。在請求中傳入 `service_tier`，LiteLLM 便會選取相符費率。Fast mode 的費用為適用費率的 2 倍，但速度最高可提升至 2.5 倍。

## 備註 {#notes}

- `gpt-6-astra` 在 Chat Completions 中接受 `reasoning_effort` 值 `low`、`medium`、`high` 和 `xhigh`，另在 Responses API 中接受 `max`；`none` 和 `minimal` 會被拒絕，因此 `temperature` 無法與其一起使用。
- 可用性正透過 API 逐步推出；請在您的 OpenAI 帳戶中確認模型存取權限。
- 請參閱 [OpenAI 提供者文件](/docs/providers/openai) 以取得完整參數參考。

## 回饋 {#feedback}

透過 LiteLLM 執行 GPT-6 Astra 時遇到意料之外的情況嗎？請在 [GitHub 討論 #39633](https://github.com/BerriAI/litellm/discussions/39633) 分享。
