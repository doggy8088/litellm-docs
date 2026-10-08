---
slug: grok_4_7
title: "第 0 天支援：Grok 4.7"
date: 2026-09-21T10:00:00
image: ./hero.png
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM 對 Grok 4.7 的第 0 天支援，價格與 Grok 4.6 相同。"
tags: [xai, grok, grok-4.7, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 與 Grok 4.7](./hero.png)

LiteLLM 在第 0 天支援 `grok-4.7`，可在 `/chat/completions` 和 `/responses` 上使用。它維持 Grok 4.6 的價格、限制與功能。

{/* truncate */}

SpaceXAI（前稱 xAI）打造了 4.7，並表示這個模型在自我檢查與維持長上下文方面更好。與 Grok 4.6 相比，Terminal-Bench 4.0 從 20.3% 提升到 38.0%，EEBench 則從 53.0% 提升到 64.0%。

## 定價 {#pricing}

每 100 萬 token：輸入 $2.00、快取 $0.50、輸出 $6.00，與 Grok 4.6 完全相同。超過 20 萬輸入 token 後，每個費率都會加倍，變成 $4.00、$1.00 和 $12.00，因此長上下文請求的成本是標題所示的兩倍。

## 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion

response = completion(
    model="xai/grok-4.7",
    messages=[{"role": "user", "content": "Refactor this migration script."}],
    reasoning_effort="xhigh",  # low | medium | high (default) | xhigh
)

print(response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml
model_list:
  - model_name: grok-4.7
    litellm_params:
      model: xai/grok-4.7
      api_key: os.environ/XAI_API_KEY

  - model_name: grok-4.7-openrouter
    litellm_params:
      model: openrouter/x-ai/grok-4.7
      api_key: os.environ/OPENROUTER_API_KEY
```

</TabItem>
</Tabs>

定價已收錄於 [PR #42264](https://github.com/BerriAI/litellm/pull/42264)。請在 Admin UI 中按一下 **Reload Model Cost Map**，或在 `POST /reload/model_cost_map` 中執行，以便在無需重新部署的情況下於 `v1.76.0` 及以上版本套用。

## 回饋 {#feedback}

透過 LiteLLM 執行 Grok 4.7 時遇到非預期情況嗎？請在 [GitHub discussion #42287](https://github.com/BerriAI/litellm/discussions/42287) 分享。
