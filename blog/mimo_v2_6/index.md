---
slug: mimo_v2_6
title: "Day 0 支援：Xiaomi MiMo V2.6"
date: 2026-09-22T10:00:00
image: ./hero.png
authors:
  - misbah
  - mateo
description: "LiteLLM 對 Xiaomi MiMo V2.6 Pro 和 Flash 的 Day 0 支援，首次以原生路由計價。"
tags: [xiaomi, mimo, mimo-v2.6, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Xiaomi MiMo V2.6](./hero.png)

LiteLLM 在 Day 0 支援 `mimo-v2.6-pro` 和 `mimo-v2.6-flash`，並首次在 Xiaomi 的自家端點上為兩者計價。

{/* truncate */}

## 定價 {#pricing}

每 100 萬 token，Pro 的輸入為 $0.435、輸出為 $0.87；Flash 則為 $0.14 和 $0.28。V2.6 的價格與 V2.5 相同；Xiaomi 維持費率不變並提升了模型。

Pro 的快取輸入讀取費用為 $0.0036，約為其輸入費率的 121 分之 1，而同一成本圖中的多數提供者會收取十分之一。快取寫入目前免費。

## 思考預設為開啟 {#thinking-is-on-by-default}

除非另行告知，所有 V2.6 模型都會推理，而 Xiaomi 透過 `thinking.type` 而非 `reasoning_effort` 來控制這點。LiteLLM 將 `xiaomi_mimo` 視為 OpenAI 相容的提供者，目前尚未為它對應 `thinking`，因此請使用 `allowed_openai_params=["thinking"]` 明確傳遞。

在多輪工具呼叫中，前一次 assistant 回合的 `reasoning_content` 必須在下一個請求中一併送回，否則 API 會回傳 400。

## 使用方式 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="xiaomi_mimo/mimo-v2.6-pro",
    messages=[{"role": "user", "content": "Refactor this migration script."}],
    thinking={"type": "disabled"},          # on by default
    allowed_openai_params=["thinking"],
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml
model_list:
  - model_name: mimo-v2.6-pro
    litellm_params:
      model: xiaomi_mimo/mimo-v2.6-pro
      api_key: os.environ/XIAOMI_MIMO_API_KEY
      allowed_openai_params: ["thinking"]

  - model_name: mimo-v2.6-flash
    litellm_params:
      model: xiaomi_mimo/mimo-v2.6-flash
      api_key: os.environ/XIAOMI_MIMO_API_KEY
```

</TabItem>
</Tabs>

請在 Admin UI 中點選 **重新載入模型成本映射**，或 `POST /reload/model_cost_map`，即可在不重新部署 `v1.76.0` 及以上版本的情況下套用這些列。

## 如果您使用的是 V2.5 {#if-you-are-on-v25}

Xiaomi 將於 2026 年 10 月 21 日北京時間 10:00 淘汰 `mimo-v2.5-pro` 和 `mimo-v2.5`。

## 回饋 {#feedback}

透過 LiteLLM 執行 MiMo V2.6 時遇到意料之外的情況嗎？請在 {/* TODO: link the discussion once posted */} [GitHub 討論區](https://github.com/BerriAI/litellm/discussions) 分享。
