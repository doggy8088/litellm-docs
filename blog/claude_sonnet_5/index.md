---
slug: claude_sonnet_5
title: "第 0 天支援：Claude Sonnet 5"
date: 2026-06-30T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM AI Gateway 上對 Claude Sonnet 5 的第 0 天支援。可透過 Anthropic、Azure、Vertex AI 與 Bedrock 使用。"
tags: [anthropic, claude, sonnet 5, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 與 Claude Sonnet 5](/img/litellm_claude_sonnet_5_announcement.png)

LiteLLM 現已於第 0 天支援 [Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5)。可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用。以您已在使用的相同 OpenAI 相容請求呼叫它，並在同一處追蹤支出、速率限制與記錄。

{/* truncate */}

## Sonnet 5 有什麼新功能 {#whats-new-in-sonnet-5}

Sonnet 5 是目前最具 agentic 特性的 Sonnet 模型，效能接近 Opus 4.8，但價格僅為其一小部分。對於透過 gateway 執行它的團隊，幾項特點特別突出：

- **Opus 級品質，Sonnet 價格。** Anthropic 表示，Sonnet 5 的表現接近 Opus 4.8，但成本低得多，且在推理、工具使用、程式撰寫與知識工作方面，比 Sonnet 4.6 有顯著提升。([Anthropic 的詳細資訊](https://www.anthropic.com/news/claude-sonnet-5))
- **為執行代理程式而打造。** 它會規劃、驅動瀏覽器與終端機等工具、 автономously 運作，並在未被要求時自行檢查輸出，在早期 Sonnet 模型會停下的地方完成複雜任務。Anthropic 強調其在 BrowseComp（agentic 搜尋）與 OSWorld-Verified（電腦使用）上的提升。
- **僅支援自適應思考。** Sonnet 5 會自行決定要思考多深入。您可透過 `reasoning_effort` 或 `output_config.effort` 針對每個請求加以調整；模型不支援固定思考預算、`temperature`、`top_p` 與 assistant 訊息預填。
- **輸入 $3 / MTok、輸出 $15 / MTok**，prompt caching 為 $0.30 / MTok（讀取）與 $3.75 / MTok（寫入）。Anthropic 目前提供至 2026 年 8 月 31 日的導入期價格：輸入 $2 / MTok、輸出 $10 / MTok。在 Bedrock 上，`us.`、`eu.`、`au.` 與 `jp.` inference profiles 會有一般 10% 區域加價，而 `global.` 則維持基礎價格；LiteLLM 會自動追蹤每個變體。
- **100 萬 token 內容長度**，最多 128K 輸出 token。
- **一個 gateway，涵蓋所有介面。** 視覺、PDF 輸入、電腦使用、工具呼叫、prompt caching、自適應思考與結構化輸出，皆可在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用，並具備統一的支出追蹤、記錄與備援。

## 啟用 Sonnet 5 {#enabling-sonnet-5}

Sonnet 5 內建於 **`v1.92.0-dev.1`** 映像檔（以及之後的每個版本）中。如何取得它，取決於您的 proxy 從哪裡讀取定價：

- **預設（遠端 cost map）：無需升級。** 在 LiteLLM UI 中，開啟 **Models + Endpoints** 下的 **Price Data** 分頁，然後點擊 **Reload Price Data**（或作為 proxy 管理員，`POST /reload/model_cost_map`）。這會一次重新擷取 LiteLLM cost map 中的最新定價，**並且**重新註冊提供者路由，因此 `claude-sonnet-5` 可在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用，即使您使用的是較舊的 proxy 版本。
- **正在執行 `LITELLM_LOCAL_MODEL_COST_MAP=true`？** cost map 已內建於映像檔中，因此 Reload 按鈕無法存取它。請拉取 `v1.92.0-dev.1` 或更新版本，以取得內建的 Sonnet 5 中繼資料：

  ```bash
  docker pull ghcr.io/berriai/litellm:v1.92.0-dev.1
  ```

## 使用方式 {#usage}

請在下方選擇您的提供者。每個分頁都會為該提供者設定 `claude-sonnet-5`；您之後送出的請求在各處都相同。

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.92.0-dev.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="azure" label="Azure">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5
    litellm_params:
      model: azure_ai/claude-sonnet-5
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
  ghcr.io/berriai/litellm:v1.92.0-dev.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="vertex" label="Vertex AI">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5
    litellm_params:
      model: vertex_ai/claude-sonnet-5
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
  ghcr.io/berriai/litellm:v1.92.0-dev.1 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-sonnet-5
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-5
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

:::note
若要進行跨區域 routing，請將 model ID 改為區域 inference profile（`us.`、`eu.`、`au.` 或 `jp.` 前綴），例如 `bedrock/converse/us.anthropic.claude-sonnet-5`。這些會有 10% 的區域加價；`global.` profile 則維持基礎價格。LiteLLM 會自動追蹤每個變體的成本。
:::

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.92.0-dev.1 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試它！**

無論您上方設定的是哪個提供者，請求都相同：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-sonnet-5",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```
