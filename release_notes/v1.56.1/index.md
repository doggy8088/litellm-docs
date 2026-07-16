---
title: v1.56.1
slug: v1.56.1
date: 2024-12-27T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [key management, budgets/rate limits, logging, guardrails]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

# v1.56.1 {#v1561}

`key management`, `budgets/rate limits`, `logging`, `guardrails`

:::info

在此取得 LiteLLM Enterprise 7 天免費試用 [here](https://litellm.ai/#trial)。

**不需要來電**

:::

## ✨ 預算 / 費率限制層級 {#-budget--rate-limit-tiers}

定義具有速率限制的層級。將它們指派給金鑰。 

可用於在大量金鑰之間控管存取與預算。

**[從這裡開始](https://docs.litellm.ai/docs/proxy/rate_limit_tiers)**

```bash
curl -L -X POST 'http://0.0.0.0:4000/budget/new' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "budget_id": "high-usage-tier",
    "model_max_budget": {
        "gpt-4o": {"rpm_limit": 1000000}
    }
}'
```


## OTEL 錯誤修正 {#otel-bug-fix}

LiteLLM 先前會對 litellm_request span 重複記錄。這個問題現在已修正。

[相關 PR](https://github.com/BerriAI/litellm/pull/7435)

## 微調端點記錄  {#logging-for-finetuning-endpoints}

現在所有記錄提供者（例如 Datadog）都可取得微調請求的記錄。 

每個請求記錄的內容：

- file_id
- finetuning_job_id
- 任何金鑰／團隊中繼資料

**從這裡開始：**
- [設定微調](https://docs.litellm.ai/docs/fine_tuning)
- [設定記錄](https://docs.litellm.ai/docs/proxy/logging#datadog)

## 防護欄的動態參數  {#dynamic-params-for-guardrails}

現在您可以在每個請求中為防護欄設定自訂參數（例如成功閾值）。

[請參閱 guardrails 規格以取得更多詳細資訊](https://docs.litellm.ai/docs/proxy/guardrails/custom_guardrail#-pass-additional-parameters-to-guardrail)
