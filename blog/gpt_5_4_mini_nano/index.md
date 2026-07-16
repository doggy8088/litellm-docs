---
slug: gpt_5_4_mini_nano
title: "首日支援：GPT-5.4-mini 與 GPT-5.4-nano"
date: 2026-03-17T10:00:00
authors:
  - name: Sameer Kankute
    title: SWE @ LiteLLM (LLM Translation)
    url: https://www.linkedin.com/in/sameer-kankute/
    image_url: https://pbs.twimg.com/profile_images/2001352686994907136/ONgNuSk5_400x400.jpg
  - name: Krrish Dholakia
    title: "CEO, LiteLLM"
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: "CTO, LiteLLM"
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
description: "LiteLLM 中對 GPT-5.4-mini 與 GPT-5.4-nano 模型的支援"
tags: [openai, gpt-5.4-mini, gpt-5.4-nano, completion]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現已支援 GPT-5.4-mini 與 GPT-5.4-nano——適合簡單完成與高吞吐量工作負載的高成本效益模型。

:::note
如果您使用的是 **v1.82.3-stable** 或以上版本，則不需要任何更新即可使用這些模型。
:::

## 使用方式 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-5.4-mini
    litellm_params:
      model: openai/gpt-5.4-mini
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-5.4-nano
    litellm_params:
      model: openai/gpt-5.4-nano
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試**

```bash
# GPT-5.4-mini
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.4-mini",
    "messages": [{"role": "user", "content": "What is the capital of France?"}]
  }'

# GPT-5.4-nano
curl -X POST "http://localhost:4000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.4-nano",
    "messages": [{"role": "user", "content": "What is 2 + 2?"}]
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

# GPT-5.4-mini
response = completion(
    model="openai/gpt-5.4-mini",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
)
print(response.choices[0].message.content)

# GPT-5.4-nano
response = completion(
    model="openai/gpt-5.4-nano",
    messages=[{"role": "user", "content": "What is 2 + 2?"}],
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 注意事項 {#notes}

- 這兩個模型都支援函式呼叫、視覺與工具使用——請參閱 [OpenAI 提供者文件](../../docs/providers/openai) 以了解進階用法。
- GPT-5.4-nano 是簡單工作最具成本效益的選項；GPT-5.4-mini 則在速度與能力之間取得平衡。
