---
slug: claude_opus_4_7
title: "Day 0 支援：Claude Opus 4.7"
date: 2026-04-16T10:00:00
authors:
  - sameer
  - ishaan-alt
  - krrish
description: "Claude Opus 4.7 在 LiteLLM AI Gateway 上的 Day 0 支援 - 可跨 Anthropic、Azure、Vertex AI 和 Bedrock 使用。"
tags: [anthropic, claude, opus 4.7]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在已在 Day 0 支援 [Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)。可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用。

{/* truncate */}

## Docker 映像檔 {#docker-image}

```bash
docker pull ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.83.3-stable.opus-4.7
```

## 使用方式 - Anthropic {#usage---anthropic}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-7
    litellm_params:
      model: anthropic/claude-opus-4-7
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.83.3-stable.opus-4.7 \
  --config /app/config.yaml
```

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 使用方式 - Azure {#usage---azure}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-7
    litellm_params:
      model: azure_ai/claude-opus-4-7
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE  # https://<resource>.services.ai.azure.com
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AZURE_AI_API_KEY=$AZURE_AI_API_KEY \
  -e AZURE_AI_API_BASE=$AZURE_AI_API_BASE \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.83.3-stable.opus-4.7 \
  --config /app/config.yaml
```

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 使用方式 - Vertex AI {#usage---vertex-ai}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-7
    litellm_params:
      model: vertex_ai/claude-opus-4-7
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: us-east5
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e VERTEX_PROJECT=$VERTEX_PROJECT \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/credentials.json:/app/credentials.json \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.83.3-stable.opus-4.7 \
  --config /app/config.yaml
```

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 使用方式 - Bedrock {#usage---bedrock}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-7
    litellm_params:
      model: bedrock/anthropic.claude-opus-4-7
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:litellm_stable_release_branch-v1.83.3-stable.opus-4.7 \
  --config /app/config.yaml
```

**3. 測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>
</Tabs>

## 進階功能 {#advanced-features}

### 自適應思考 {#adaptive-thinking}

:::note
當使用 `reasoning_effort` 搭配 Claude Opus 4.7 時，所有值（`low`、`medium`、`high`、`xhigh`、`max`）都會映射為 `thinking: {type: "adaptive"}`。Opus 4.7 僅支援自適應思考；透過 `thinking: {type: "enabled", budget_tokens: ...}` 指定明確預算會被 Anthropic API 以 400 錯誤拒絕。若要控制思考深度，請將自適應思考與 `output_config.effort` 搭配使用（請參閱下方的 [努力等級](#effort-levels)），而不是固定預算。
:::

<Tabs>
<TabItem value="completions" label="/chat/completions">

LiteLLM 透過 `reasoning_effort` 參數支援自適應思考：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "Solve this complex problem: What is the optimal strategy for..."
    }
  ],
  "reasoning_effort": "high"
}'
```

</TabItem>
<TabItem value="messages" label="/v1/messages">

搭配 `type: "adaptive"` 使用 `thinking` 參數，以啟用自適應思考模式：

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-7",
    "max_tokens": 16000,
    "thinking": {
        "type": "adaptive"
    },
    "messages": [
        {
            "role": "user",
            "content": "Explain why the sum of two even numbers is always even."
        }
    ]
}'
```

</TabItem>
</Tabs>

### 努力等級 {#effort-levels}

Claude Opus 4.7 支援五種努力等級：`low`、`medium`、`high`（預設）、`xhigh`，以及 `max`。這些等級可讓您更細緻地控制模型在任務中套用多少推理。請透過 `output_config` 參數傳遞努力等級。

`xhigh` 是 Opus 4.7 新增的努力等級，位於 `high` 之上，是程式碼撰寫與 agentic 工作的建議起點。`max` 位於 `xhigh` 之上，代表最高能力；請保留給真正前沿的問題，因為在大多數工作負載上，它會增加大量 token 成本，但品質提升相對有限。

<Tabs>
<TabItem value="completions" label="/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-7",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "output_config": {
    "effort": "xhigh"
  }
}'
```

**使用 OpenAI SDK：**

```python
import openai

client = openai.OpenAI(
    api_key="your-litellm-key",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-opus-4-7",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    extra_body={"output_config": {"effort": "xhigh"}}
)
```

**使用 LiteLLM SDK：**

```python
from litellm import completion

response = completion(
    model="anthropic/claude-opus-4-7",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    output_config={"effort": "xhigh"},
)
```

您可以將 `reasoning_effort` 與 `output_config` 結合使用，以更細緻地控制模型行為。

</TabItem>
<TabItem value="messages" label="/v1/messages">

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-4-7",
    "max_tokens": 4096,
    "messages": [
        {
            "role": "user",
            "content": "Explain quantum computing"
        }
    ],
    "output_config": {
        "effort": "xhigh"
    }
}'
```

</TabItem>
</Tabs>

**努力等級指南：**

| 努力等級 | 使用時機 |
|--------|-------------|
| `low` | 短而快速的回應 — 簡單查詢、格式化、分類 |
| `medium` | 日常 Q&A 與輕度推理的平衡取捨 |
| `high`（預設）| 複雜推理、程式碼生成、分析 |
| `xhigh` | 最困難的問題 — 多步驟數學、深入研究、agentic 規劃 |
