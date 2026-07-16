---
slug: claude_sonnet_4_6
title: "第 0 天支援：Claude Sonnet 4.6"
date: 2026-02-17T10:00:00
authors:
  - ishaan-alt
  - krrish
description: "LiteLLM AI Gateway 對 Claude Sonnet 4.6 的第 0 天支援 - 可跨 Anthropic、Azure、Vertex AI 和 Bedrock 使用。"
tags: [anthropic, claude, sonnet 4.6]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現已在第 0 天支援 Claude Sonnet 4.6。可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用。

{/* truncate */}

## Docker 映像檔 {#docker-image}

```bash
docker pull ghcr.io/berriai/litellm:v1.81.3-stable.sonnet-4-6
```

## 使用方式 - Anthropic {#usage---anthropic}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: anthropic/claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.81.3-stable.sonnet-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>

<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="anthropic/claude-sonnet-4-6",
    messages=[{"role": "user", "content": "what llm are you"}]
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 使用方式 - Azure {#usage---azure}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: azure_ai/claude-sonnet-4-6
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
  ghcr.io/berriai/litellm:v1.81.3-stable.sonnet-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>

<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="azure_ai/claude-sonnet-4-6",
    api_key="your-azure-api-key",
    api_base="https://<resource>.services.ai.azure.com",
    messages=[{"role": "user", "content": "what llm are you"}]
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 使用方式 - Vertex AI {#usage---vertex-ai}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: vertex_ai/claude-sonnet-4-6
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
  ghcr.io/berriai/litellm:v1.81.3-stable.sonnet-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>

<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="vertex_ai/claude-sonnet-4-6",
    vertex_project="your-project-id",
    vertex_location="us-east5",
    messages=[{"role": "user", "content": "what llm are you"}]
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 使用方式 - Bedrock {#usage---bedrock}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-4-6
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-4-6-v1
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
  ghcr.io/berriai/litellm:v1.81.3-stable.sonnet-4-6 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-4-6",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

</TabItem>

<TabItem value="sdk" label="LiteLLM SDK">

```python
from litellm import completion

response = completion(
    model="bedrock/anthropic.claude-sonnet-4-6-v1",
    aws_access_key_id="your-access-key",
    aws_secret_access_key="your-secret-key",
    aws_region_name="us-east-1",
    messages=[{"role": "user", "content": "what llm are you"}]
)
print(response.choices[0].message.content)
```

</TabItem>
</Tabs>
