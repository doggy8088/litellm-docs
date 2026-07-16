---
slug: claude_fable_5
title: "第 0 天支援：Claude Fable 5"
date: 2026-06-10T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM AI Gateway 提供 Claude Fable 5 的第 0 天支援。可在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用。"
tags: [anthropic, claude, fable 5, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 與 Claude Fable 5](/img/litellm_claude_fable_5_announcement.png)

LiteLLM 現已在第 0 天支援 [Claude Fable 5](https://www.anthropic.com/news/claude-fable-5-mythos-5)。可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用。以您已在使用的相同 OpenAI 相容請求呼叫它，並在單一位置追蹤支出、速率限制與記錄。

{/* truncate */}

## Fable 5 有哪些新內容 {#whats-new-in-fable-5}

Fable 5 是 Anthropic 首個公開提供的 Mythos 級模型，定價為 Opus 4.8 的 2 倍。對於透過閘道執行它的團隊，有幾個亮點：

- **前沿能力，如今公開。** Anthropic 表示，Fable 5 在幾乎所有測試基準上都達到最新水準，且即使在中等推理力度下，仍是 Cognition 前沿程式設計基準中得分最高的前沿模型之一。([Anthropic 的詳細資訊](https://www.anthropic.com/news/claude-fable-5-mythos-5))
- **專為長時間運作工作而設計。** 100 萬 token 的上下文視窗與最高 128K 輸出 token，能在長時間跨度的代理式任務中維持涵蓋數百萬 token 的專注力。
- **僅支援自適應思考。** Fable 5 會自行決定思考深度。您可透過 `reasoning_effort` 或 `output_config.effort` 針對每個請求加以控制；固定思考預算、`temperature`、`top_p` 與 assistant 訊息 prefill 皆不受此模型支援。
- **輸入 $10 / MTok、輸出 $50 / MTok**，提示快取為 $1.00 / MTok（讀取）與 $12.50 / MTok（寫入）。在 Bedrock 上，`us.` 與 `eu.` 推論設定檔會收取一般 10% 區域溢價，而 `global.` 則維持基本價格；LiteLLM 會自動追蹤每個變體。
- **您可能會注意到的一種備援。** 對於標記為網路安全與生物學的請求（依 Anthropic 所述，占會話數少於 5%），回應會改由 Opus 4.8 提供。
- **一個閘道，涵蓋所有面向。** 視覺、PDF 輸入、電腦使用、工具呼叫、提示快取、自適應思考與結構化輸出，全都可在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用，並具備統一的支出追蹤、記錄與備援。

## 啟用前：提供者選擇加入 {#before-you-flip-it-on-provider-opt-ins}

Fable 5 在某些雲端上需要選擇加入資料分享；提示會與 Anthropic 共用，並保留最多 30 天。

- **Bedrock**：將您帳戶的資料保留模式設為 `provider_data_share`，並透過推論設定檔（`us.`、`eu.` 或 `global.` 前綴）呼叫；不支援直接以模型 ID 呼叫。
- **Vertex AI**：為您的專案啟用 Anthropic 資料分享，並在 Model Garden 中接受 Fable 5 條款。
- **Azure AI Foundry**：建立 `claude-fable-5` 部署；某些訂閱上的模型 TPM 配額計量器會從 0 開始，因此您可能需要先提出配額請求。

## 啟用 Fable 5 {#enabling-fable-5}

Fable 5 隨 **`v1.89.0-rc.2`** 映像檔（以及之後的每個版本）一起發布。取得方式取決於您的 proxy 從哪裡讀取定價：

- **預設（遠端成本對映）：不需要升級。** 在 LiteLLM UI 中，開啟 **Models + Endpoints** 下的 **Price Data** 分頁，然後按一下 **Reload Price Data**（或由 proxy 管理員執行 `POST /reload/model_cost_map`）。這會一次重新抓取 LiteLLM 成本對映中的最新定價**並且**重新註冊提供者路由，因此即使您使用的是較舊的 proxy 版本，`claude-fable-5` 也能在 Anthropic、Azure、Vertex AI 與 Bedrock 上使用。
- **正在執行 `LITELLM_LOCAL_MODEL_COST_MAP=true`？** 成本對映已內建於映像檔中，因此 Reload 按鈕無法連到它。請拉取 `v1.89.0-rc.2` 或更新版本，以取得隨附的 Fable 5 中繼資料：

  ```bash
  docker pull ghcr.io/berriai/litellm:v1.89.0-rc.2
  ```

## 使用方式 - Anthropic {#usage---anthropic}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-fable-5
    litellm_params:
      model: anthropic/claude-fable-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.89.0-rc.2 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
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
  - model_name: claude-fable-5
    litellm_params:
      model: azure_ai/claude-fable-5
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
  ghcr.io/berriai/litellm:v1.89.0-rc.2 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
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
  - model_name: claude-fable-5
    litellm_params:
      model: vertex_ai/claude-fable-5
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
  ghcr.io/berriai/litellm:v1.89.0-rc.2 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
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

:::note
Bedrock 僅透過推論設定檔提供 Fable 5，因此模型 ID 必須帶有 `us.`、`eu.` 或 `global.` 前綴。直接呼叫裸的 `anthropic.claude-fable-5` 模型 ID 會傳回驗證錯誤。
:::

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-fable-5
    litellm_params:
      model: bedrock/converse/us.anthropic.claude-fable-5
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
  ghcr.io/berriai/litellm:v1.89.0-rc.2 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
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
當將 `reasoning_effort` 與 Claude Fable 5 搭配使用時，所有值都會對應到 `thinking: {type: "adaptive"}`。Fable 5 僅支援自適應思考；透過 `thinking: {type: "enabled", budget_tokens: ...}` 指定的明確預算會被 Anthropic API 以 400 錯誤拒絕。若要控制思考深度，請將自適應思考與 `output_config.effort` 搭配使用（請見下方的 [努力等級](#effort-levels)），而非固定預算。
:::

<Tabs>
<TabItem value="completions" label="/chat/completions">

LiteLLM 透過 `reasoning_effort` 參數支援自適應思考：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
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

使用 `thinking` 參數搭配 `type: "adaptive"` 以啟用自適應思考模式：

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-fable-5",
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

Claude Fable 5 支援完整的努力等級階梯：`low`、`medium`、`high`（預設）、`xhigh` 與 `max`。這些可讓您更細緻地控制模型對任務套用多少推理。請透過 `output_config` 參數傳遞努力等級。

在 Bedrock 上，`output_config.effort` 最高僅到 `xhigh`；其他提供者可接受完整階梯，最高至 `max`。

<Tabs>
<TabItem value="completions" label="/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "output_config": {
    "effort": "max"
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
    model="claude-fable-5",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    extra_body={"output_config": {"effort": "max"}}
)
```

**使用 LiteLLM SDK：**

```python
from litellm import completion

response = completion(
    model="anthropic/claude-fable-5",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    output_config={"effort": "max"},
)
```

您可以將 `reasoning_effort` 與 `output_config` 搭配使用，以更細緻地控制模型行為。

</TabItem>
<TabItem value="messages" label="/v1/messages">

```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'x-api-key: sk-12345' \
--header 'content-type: application/json' \
--data '{
    "model": "claude-fable-5",
    "max_tokens": 4096,
    "messages": [
        {
            "role": "user",
            "content": "Explain quantum computing"
        }
    ],
    "output_config": {
        "effort": "max"
    }
}'
```

</TabItem>
</Tabs>

**努力等級指南：**

| 努力等級 | 適用時機 |
|--------|-------------|
| `low` | 適合簡單查詢、格式化與分類的短而快速回應 |
| `medium` | 適合日常問答與輕度推理的平衡取捨 |
| `high`（預設） | 複雜推理、程式碼生成、分析 |
| `xhigh` | 多步驟數學、深度研究與代理式規劃等困難問題 |
| `max` | 需要不考量延遲、追求最大推理深度的最難任務（Bedrock 不提供） |
