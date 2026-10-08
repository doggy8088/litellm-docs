---
slug: claude_sonnet_5_5
title: "Day 0 支援：Claude Sonnet 5.5"
date: 2026-09-28T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM AI Gateway 對 Claude Sonnet 5.5 的 Day 0 支援。可透過 Anthropic、Bedrock、Gemini Enterprise Agent Platform 和 Azure 使用。"
image: /img/litellm_claude_sonnet_5_5_announcement.png
tags: [anthropic, claude, sonnet 5.5, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Claude Sonnet 5.5](/img/litellm_claude_sonnet_5_5_announcement.png)

LiteLLM 現在在 Day 0 支援 [Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5)。可透過 LiteLLM AI Gateway，在 Anthropic、Bedrock、Gemini Enterprise Agent Platform 和 Azure 上使用，並將支出、速率限制與記錄集中管理。

{/* truncate */}

## Sonnet 5.5 有哪些新內容 {#whats-new-in-sonnet-55}

- **與 Sonnet 5 同價：** 輸入 $2 / MTok、輸出 $10 / MTok、快取讀取 $0.20 / MTok
- **速度快 30% 以上**，且每個工作最多可節省 30%，依 Anthropic 所述
- **Terminal-Bench 4.0 達 70.6%**，高於 Sonnet 5 的 10.3%
- **100 萬 token 上下文**，輸出最多可達 128K tokens

## 啟用 Sonnet 5.5 {#enabling-sonnet-55}

定價已登錄於 [PR #43586](https://github.com/BerriAI/litellm/pull/43586)。無須升級：在 UI 中打開 **Models + Endpoints** 下的 **Price Data**，然後按一下 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用於 `v1.76.0` 及以上版本。

## 使用方式 {#usage}

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5-5
    litellm_params:
      model: anthropic/claude-sonnet-5-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.103.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5-5
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-5-5
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

:::note
若要進行跨區域路由，請使用像 `bedrock/converse/us.anthropic.claude-sonnet-5-5` 這類區域性推論設定檔。區域性設定檔會加收 10% 的溢價，而 `global.` 仍維持基本價格；LiteLLM 會追蹤各個變體。
:::

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.103.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5-5
    litellm_params:
      model: vertex_ai/claude-sonnet-5-5
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: global
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e VERTEX_PROJECT=$VERTEX_PROJECT \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/credentials.json:/app/credentials.json \
  ghcr.io/berriai/litellm:v1.103.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="azure" label="Azure">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5-5
    litellm_params:
      model: azure_ai/claude-sonnet-5-5
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
  ghcr.io/berriai/litellm:v1.103.0 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 進行測試！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-5-5",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

## 需要知道的事 {#worth-knowing}

**強制工具使用會回傳 400。** 請使用 `tool_choice: "auto"`，並在提示詞中說明該工具何時適用。

**`thinking: {"type": "disabled"}` 會回傳 400。** Anthropic 的替代方案是 `between_tools`；請參閱他們的 [遷移指南](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide)。

## 回饋 {#feedback}

透過 LiteLLM 執行 Claude Sonnet 5.5 時遇到非預期情況嗎？請在 [GitHub 討論 #43590](https://github.com/BerriAI/litellm/discussions/43590) 分享。
