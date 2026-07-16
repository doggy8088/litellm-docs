---
slug: gpt_5_4
title: "第 0 天支援：GPT-5.4"
date: 2026-03-05T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "LiteLLM 中對 GPT-5.4 模型的支援"
tags: [openai, gpt-5.4, completion]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在完整支援 GPT-5.4！

{/* truncate */}

## Docker 映像 {#docker-image}

```bash
docker pull ghcr.io/berriai/litellm:v1.81.14-stable.gpt-5.4_patch
```

## 使用方式 {#usage}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gpt-5.4
    litellm_params:
      model: openai/gpt-5.4
      api_key: os.environ/OPENAI_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.81.14-stable.gpt-5.4_patch \
  --config /app/config.yaml
```

**3. 測試它**

```bash
curl -X POST "http://0.0.0.0:4000/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "gpt-5.4",
    "messages": [
      {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ]
  }'
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="openai/gpt-5.4",
    messages=[
        {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ],
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 注意事項 {#notes}

- 重新啟動您的容器，以取得此模型的成本追蹤。
- 使用 `/responses` 以獲得更好的模型效能。
- GPT-5.4 支援 reasoning、function calling、vision 和 tool-use — 請參閱 [OpenAI provider 文件](../../docs/providers/openai) 以了解進階用法。
