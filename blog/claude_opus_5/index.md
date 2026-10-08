---
slug: claude_opus_5
title: "Day 0 支援：Claude Opus 5"
date: 2026-07-24T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM AI Gateway 上對 Claude Opus 5 的 Day 0 支援。可透過 Anthropic、Azure、Vertex AI 與 Bedrock 使用。"
image: /img/litellm_claude_opus_5_announcement.png
tags: [anthropic, claude, opus 5, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Claude Opus 5](/img/litellm_claude_opus_5_announcement.png)

LiteLLM 現已在 Day 0 支援 [Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)。可透過 LiteLLM AI Gateway，在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用。使用您已在用的相同 OpenAI 相容請求來呼叫，並在同一處追蹤支出、速率限制與記錄。

{/* truncate */}

## Opus 5 的新功能 {#whats-new-in-opus-5}

主要變更（[Anthropic 的詳細資訊](https://www.anthropic.com/news/claude-opus-5)）：

- **更強的程式碼代理程式：** 在大型重構、除錯、多檔案功能，以及不留占位內容地完成端到端工作方面更強
- **更好的自我驗證：** 更主動檢查並迭代自身工作
- **更好的視覺與產出物：** 改進的截圖 → 網站、圖表與文件、試算表，以及投影片簡報
- **與 Opus 4.8 相同的基礎 API 價格：** 輸入 $5 / MTok、輸出 $25 / MTok
- **預設啟用思考**
- **快速模式：** 約快 2.5 倍，但費用為 2 倍

## 在您從 Opus 4.8 切換之前 {#before-you-switch-from-opus-48}

此切換並非免費。Priority Tier 和 web fetch 在 Opus 5 上都已移除，因此請分別規劃這些容量與工具。Opus 5 的資安分類器也可能直接拒絕請求，回傳 `stop_reason: "refusal"` 與 `stop_details` 中的類別；這值得明確處理，或透過 LiteLLM [備援](/docs/proxy/reliability) 繞開。

取樣參數（`temperature`、`top_p`、`top_k`）、固定的思考預算，以及 assistant message prefill 仍不受支援，與 Opus 4.8 相同。Anthropic 的 [Opus 5 遷移指南](https://platform.claude.com/docs/en/about-claude/models/migration-guide) 提供完整的相容性清單。

## 啟用 Opus 5 {#enabling-opus-5}

Opus 5 已隨 **`v1.95.0-dev.3`** 映像檔釋出，今天稍晚會提供，但多數 proxy 根本不需要升級。在預設的遠端成本地圖上，打開 UI 中 **Models + Endpoints** 下方的 **Price Data** 分頁，然後按一下 **Reload Price Data**（或身為 proxy 管理員執行 `POST /reload/model_cost_map`）。這會一次重新抓取定價並重新註冊提供者路由，因此即使在舊版上，`claude-opus-5` 也能在 Anthropic、Azure、Vertex AI 與 Bedrock 上可用。

例外是 `LITELLM_LOCAL_MODEL_COST_MAP=true`，它會將成本地圖內建到映像檔中，讓它無法被 Reload 按鈕觸及。請升級到 `v1.95.0-dev.3` 或更新版本，以取得隨附的 Opus 5 中繼資料：

```bash
docker pull ghcr.io/berriai/litellm:v1.95.0-dev.3
```

## 使用方式 {#usage}

請在下方選擇您的提供者。每個分頁都會為該提供者設定 `claude-opus-5`；之後您送出的請求在各處都相同。

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.95.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="azure" label="Azure">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5
    litellm_params:
      model: azure_ai/claude-opus-5
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
  ghcr.io/berriai/litellm:v1.95.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="vertex" label="Vertex AI">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5
    litellm_params:
      model: vertex_ai/claude-opus-5
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
  ghcr.io/berriai/litellm:v1.95.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-5
    litellm_params:
      model: bedrock/anthropic.claude-opus-5
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

:::note
若要進行跨區域路由，請將模型 ID 改為區域推論設定檔（`us.`、`eu.`、`au.`，或 `jp.` 前綴），例如 `bedrock/converse/us.anthropic.claude-opus-5`。這些會額外收取 10% 的區域加價；`global.` 設定檔維持基礎價格。LiteLLM 會自動追蹤每個變體的成本。
:::

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.95.0-dev.3 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試看看！**

無論您在上方設定的是哪個提供者，請求都相同：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-5",
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
快速模式**僅支援 Anthropic 提供者**（`anthropic/claude-opus-5`）。此模式不適用於 Azure AI、Vertex AI 或 Bedrock，且不能與 Batch API 搭配使用。
:::

Opus 5 在 `speed: "fast"` 下大約快 2.5 倍，計費為輸入 $10 / MTok、輸出 $50 / MTok（為標準費率的 2 倍，相較於 Opus 4.6 的 6 倍加價已降低）。LiteLLM 會加上 `fast-mode-2026-02-01` 測試版標頭，並自動在成本計算中追蹤這項加價。

<Tabs>
<TabItem value="completions" label="/v1/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-5",
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

</TabItem>
<TabItem value="messages" label="/v1/messages">

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header "x-api-key: $LITELLM_API_KEY" \
--header 'content-type: application/json' \
--data '{
    "model": "claude-opus-5",
    "max_tokens": 4096,
    "speed": "fast",
    "messages": [
        {
            "role": "user",
            "content": "Refactor this module..."
        }
    ]
}'
```

</TabItem>
<TabItem value="responses" label="/v1/responses">

Responses API 上的快速模式即將推出。`speed` 參數目前尚未在 `/v1/responses` 上轉發，因此在該處的請求會以標準速度與價格執行，直到支援上線。

</TabItem>
</Tabs>

## 回饋 {#feedback}

透過 LiteLLM 執行 Opus 5 時遇到意料之外的情況嗎？請在 [GitHub 討論 #34517](https://github.com/BerriAI/litellm/discussions/34517) 分享。
