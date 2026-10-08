---
slug: muse_spark_1_3
title: "Day 0 支援：Meta Muse Spark 1.3"
date: 2026-09-02T18:00:00
draft: false
authors:
  - misbah
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM 對 Meta Muse Spark 1.3 的 Day 0 支援，並提供標準與貢獻者方案的成本追蹤。"
image: ./hero.png
tags: [meta, muse-spark-1.3, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Muse Spark 1.3](./hero.png)

# Muse Spark 1.3 Day 0 支援 {#muse-spark-13-day-0-support}

LiteLLM 現在透過 Meta Model API 上的 `meta/` 路由，於 Day 0 提供 `muse-spark-1.3` 與 `muse-spark-1.3-contributor`。Meta 今天在 Muse Code 與 Model API 中推出 1.3，針對長期代理式與程式撰寫工作進行調校，並在內部回報相較於 1.2，大約少了 20% 的工具呼叫與 25% 的 token。

{/* truncate */}

## 定價 {#pricing}

標準定價與 1.2 相同。

| 每 1M tokens | 標準 | 貢獻者 |
|---|---|---|
| 輸入 | $1.25 | $0.10 |
| 輸出 | $4.25 | $0.20 |
| 快取輸入 | $0.15 | $0.002 |

貢獻者方案在輸入上便宜 12.5 倍、在輸出上便宜 21 倍，且沒有結束日期。速率限制也不同：貢獻者方案為 100 RPM，標準方案為 3,000 RPM，且是按團隊而非按金鑰強制執行。網頁搜尋 grounding 在兩者皆以每 1,000 次查詢 $2.50 計費。

## 快速入門 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="meta/muse-spark-1.3",
    messages=[{"role": "user", "content": "Summarize this article in 3 bullet points."}],
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: muse-spark-1.3
    litellm_params:
      model: meta/muse-spark-1.3
      api_key: os.environ/META_API_KEY

  # Cheaper tier, but Meta may train on your prompts and completions
  - model_name: muse-spark-1.3-contributor
    litellm_params:
      model: meta/muse-spark-1.3-contributor
      api_key: os.environ/META_API_KEY
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 發送請求**

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "muse-spark-1.3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

</TabItem>
</Tabs>

## 推理、多模態與音訊 {#reasoning-modalities-and-audio}

Muse Spark 1.3 是一個推理模型。LiteLLM 以 OpenAI 格式傳遞 `reasoning_effort`，可接受 `minimal`、`low`、`medium`、`high` 與 `xhigh`。Meta 的公告提到較高的「max reasoning」模式，但目前尚未提供，因此 `xhigh` 是目前的上限。推理 token 會以輸出 token 計費。

文字、圖片、影片與 PDF 輸入的運作方式與 1.2 相同，涵蓋 `/v1/chat/completions`、`/v1/responses`，以及 [`/v1/messages`](/docs/anthropic_unified)，並具有 1,048,576-token 的上下文視窗。

## 回饋 {#feedback}

透過 LiteLLM 執行 Muse Spark 1.3 時遇到意料之外的情況嗎？請在 [GitHub discussions](https://github.com/BerriAI/litellm/discussions/39439) 分享。
