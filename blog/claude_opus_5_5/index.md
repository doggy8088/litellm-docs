---
slug: claude_opus_5_5
title: "Day 0 支援：Claude Opus 5.5"
date: 2026-09-22T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "LiteLLM AI Gateway 對 Claude Opus 5.5 的 Day 0 支援。可透過 Anthropic、Bedrock、Gemini Enterprise Agent Platform 和 Azure 使用。"
image: /img/litellm_claude_opus_5_5_announcement.png
tags: [anthropic, claude, opus 5.5, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Claude Opus 5.5](/img/litellm_claude_opus_5_5_announcement.png)

LiteLLM 現在已在 Day 0 支援 [Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)。可透過 LiteLLM AI Gateway，跨 Anthropic、Bedrock、Gemini Enterprise Agent Platform 和 Azure 使用。以您既有的 OpenAI 相容請求直接呼叫，並在同一處追蹤支出、速率限制與記錄。

{/* truncate */}

## Opus 5.5 有哪些新內容 {#whats-new-in-opus-55}

主要變更（[來自 Anthropic 的詳細資訊](https://www.anthropic.com/claude-opus-5-5)）：

- **比 Opus 5 便宜 20%：** 輸入 $4 / MTok、輸出 $20 / MTok，低於原本的 $5 和 $25
- **更便宜的快取讀取：** $0.20 / MTok，5 分鐘寫入為 $5，1 小時寫入為 $8
- **更強的 agentic coding：** Terminal-Bench 4.0 為 66.4%，OSWorld 2.0 為 81.8%
- **更快且更精簡：** Anthropic 回報輸出速度快超過 30%，且每項任務使用更少 token
- **Thinking 一律開啟：** effort 是唯一控制項，且其預設為 `medium`
- **快速模式：** 約為基礎價格的 2 倍，低於 Opus 5 的 $10 / $50

Context window 與最大輸出量維持與 Opus 5 相同，分別為 1M 與 128K。

## 啟用 Opus 5.5 {#enabling-opus-55}

定價已登錄於 [PR #42489](https://github.com/BerriAI/litellm/pull/42489)，而且大多數 proxy 完全不需要升級。在預設的遠端成本對應表上，請在 UI 中開啟 **Models + Endpoints** 底下的 **Price Data** 分頁，然後點擊 **Reload Price Data**（或由您作為 proxy 管理員 `POST /reload/model_cost_map`），適用於任何 `v1.76.0` 或更新版本。

例外的是 `LITELLM_LOCAL_MODEL_COST_MAP=true`，它會將成本對應表寫入映像檔中，讓其無法透過 Reload 按鈕更新。此路徑需要在 #42489 合併之後建立的映像檔。

## 使用方式 {#usage}

請從下方選擇您的提供者。每個分頁都會為該提供者設定 `claude-opus-5-5`；之後您送出的請求在各處都相同。

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5-5
    litellm_params:
      model: anthropic/claude-opus-5-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.103.0-rc.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5-5
    litellm_params:
      model: bedrock/anthropic.claude-opus-5-5
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
  ghcr.io/berriai/litellm:v1.103.0-rc.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5-5
    litellm_params:
      model: vertex_ai/claude-opus-5-5
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
  ghcr.io/berriai/litellm:v1.103.0-rc.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="azure" label="Azure">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5-5
    litellm_params:
      model: azure_ai/claude-opus-5-5
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
  ghcr.io/berriai/litellm:v1.103.0-rc.1 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試它！**

不論您上方設定的是哪個提供者，請求都相同：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-5-5",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

## 快速模式 {#fast-mode}

:::info
快速模式**僅支援 Anthropic 提供者**（`anthropic/claude-opus-5-5`）。此功能不支援 Bedrock、Gemini Enterprise Agent Platform 或 Azure，且無法與 Batch API 一起使用。
:::

Opus 5.5 搭配 `speed: "fast"` 執行更快，計費為輸入 $8 / MTok、輸出 $40 / MTok，是標準費率的 2 倍，並低於 Opus 5 的 $10 / $50。LiteLLM 會自動加入 `fast-mode-2026-02-01` beta 標頭，並在成本計算中自動計入加價。

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-5-5",
  "messages": [
    {
      "role": "user",
      "content": "Refactor this module..."
    }
  ],
  "max_tokens": 4096,
  "speed": "fast"
}'
```

## 值得知道 {#worth-knowing}

**強制工具使用會回傳 400。** 啟用 `drop_params` 時，LiteLLM 會將 `tool_choice` 降級為 `auto` 並記錄警告，因此該呼叫會成功，而模型可自由選擇不呼叫您的工具。

**Thinking 無法停用，且現在預設的 effort 為 `medium`**，而 Opus 5 的預設為 `high`，因此從未設定 effort 的請求，其思考量會比以前少。

**Thinking 區塊與模型綁定。** 只有 Fable 5.1 和 Mythos 5.1 會讀取 Opus 5.5 的區塊，因此備援到 Sonnet 或 Haiku 時，這些輪次不會使用推理。

## 回饋 {#feedback}

透過 LiteLLM 執行 Claude Opus 5.5 時遇到意料之外的情況嗎？請在 [GitHub 討論 #42494](https://github.com/BerriAI/litellm/discussions/42494) 分享。
