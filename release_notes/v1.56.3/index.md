---
title: v1.56.3
slug: v1.56.3
date: 2024-12-28T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGiM7ZrUwqu_Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1675971026692?e=1741824000&v=beta&t=eQnRdXPJo4eiINWTZARoYTfqh064pgZ-E21pQTSy8jc
tags: [guardrails, logging, virtual key management, new models]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

`guardrails`, `logging`, `virtual key management`, `new models`

:::info

在此可免費試用 LiteLLM Enterprise 7 天 [這裡](https://litellm.ai/#trial)。

**無需致電**

:::

## 新功能 {#new-features}

### ✨ 記錄防護欄追蹤 {#-log-guardrail-traces}

追蹤防護欄失敗率，以及防護欄是否失控並導致請求失敗。 [從這裡開始](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)

#### 已追蹤的防護欄成功 {#traced-guardrail-success}

<Image img={require('../../img/gd_success.png')} />

#### 已追蹤的防護欄失敗 {#traced-guardrail-failure}

<Image img={require('../../img/gd_fail.png')} />

### `/guardrails/list`  {#guardrailslist}

`/guardrails/list` 可讓用戶端檢視可用的防護欄 + 支援的防護欄參數

```shell
curl -X GET 'http://0.0.0.0:4000/guardrails/list'
```

預期回應

```json
{
    "guardrails": [
        {
        "guardrail_name": "aporia-post-guard",
        "guardrail_info": {
            "params": [
            {
                "name": "toxicity_score",
                "type": "float",
                "description": "Score between 0-1 indicating content toxicity level"
            },
            {
                "name": "pii_detection",
                "type": "boolean"
            }
            ]
        }
        }
    ]
}
```


### ✨ 搭配 Mock LLM 的防護欄 {#-guardrails-with-mock-llm}

傳送 `mock_response` 來測試防護欄，無需進行 LLM 請求。更多關於 `mock_response` 的資訊 [請見這裡](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-npnwjPQciVRok5yNZgKmFQ" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan@berri.ai"}
    ],
    "mock_response": "This is a mock response",
    "guardrails": ["aporia-pre-guard", "aporia-post-guard"]
  }'
```


### 將金鑰指派給使用者 {#assign-keys-to-users}

您現在可以透過 Proxy UI 將金鑰指派給使用者

<Image img={require('../../img/ui_key.png')} />

## 新模型 {#new-models}

- `openrouter/openai/o1`
- `vertex_ai/mistral-large@2411`

## 修正 {#fixes}

- 修正 `vertex_ai/` mistral 模型定價：https://github.com/BerriAI/litellm/pull/7345
- logs 中 aspeech 請求類型缺少 model_group 欄位 https://github.com/BerriAI/litellm/pull/7392
