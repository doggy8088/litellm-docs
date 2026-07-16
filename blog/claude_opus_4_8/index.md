---
slug: claude_opus_4_8
title: "Day 0 支援：Claude Opus 4.8"
date: 2026-05-28T10:00:00
authors:
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM AI Gateway 對 Claude Opus 4.8 的 Day 0 支援。可透過 Anthropic、Azure、Vertex AI 和 Bedrock 使用。"
tags: [anthropic, claude, opus 4.8, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

LiteLLM 現在在 Day 0 支援 [Claude Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8)。可透過 LiteLLM AI Gateway 在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用。您可以用既有的 OpenAI 相容請求來呼叫它，並在同一處追蹤支出、速率限制與記錄。

{/* truncate */}

## Opus 4.8 的新功能 {#whats-new-in-opus-48}

Opus 4.8 在 Opus 4.7 的基礎上，於程式撰寫、代理式與推理基準測試上都有提升，且採用**相同價格**。對於透過閘道執行的團隊，有幾項重點：

- **更銳利、更誠實的代理。** Anthropic 表示，Opus 4.8 對於自己撰寫的程式碼缺陷未加提及就放過的機率，大約比 Opus 4.7 **低 4 倍**，也更可能標示不確定性，而不是做出缺乏依據的主張。當模型在您的 proxy 後方驅動多步驟工具呼叫時，這種可靠性會進一步放大。([Anthropic 的詳細說明](https://www.anthropic.com/news/claude-opus-4-8))
- **每個請求都有完整的努力階梯。** `low`、`medium`、`high`（預設）、`xhigh` 和 `max`。可將推理強度**調高**以處理困難、長時間執行的代理式工作，或**調低**以取得快速、低成本的回應。可透過 `reasoning_effort` 或 `output_config` 逐次呼叫設定。
- **工作中途的系統訊息。** Messages API 現在接受 `system` 項目*位於* `messages` 陣列內，因此代理可在執行途中更新其指令、權限或 token 預算，而不會破壞提示快取，並且會直接透過 LiteLLM 的 `/v1/messages` passthrough 傳遞。
- **與 Opus 4.7 相同的每 token 價格。** 輸入為 $5 / MTok、輸出為 $25 / MTok，提示快取為 $0.50 / MTok（讀取）與 $6.25 / MTok（寫入）。更好的結果，價格不變。
- **100 萬 token 的 context**，最高 128K 輸出 token。
- **一個 gateway，涵蓋所有介面。** Vision、PDF 輸入、computer use、tool calling、提示快取、自適應思考與結構化輸出，皆可在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用，並具備整合的支出追蹤、記錄與備援。

## 啟用 Opus 4.8 {#enabling-opus-48}

Opus 4.8 隨 nightly **`v1.88.0-dev.1`** image（以及其後每個版本）推出。您如何取得它，取決於您的 proxy 讀取價格資料的來源：

- **預設（遠端成本映射）：不需要升級。** 在 LiteLLM UI 中，開啟 **Models + Endpoints** 下的 **Price Data** 分頁，然後按一下 **Reload Price Data**（或者，作為 proxy 管理員，`POST /reload/model_cost_map`）。這會一次重新擷取 LiteLLM 成本映射中的最新價格**並且**重新註冊提供者路由，因此即使您使用的是較舊的 proxy 版本，`claude-opus-4-8` 也能在 Anthropic、Azure、Vertex AI 和 Bedrock 上使用。
- **正在執行 `LITELLM_LOCAL_MODEL_COST_MAP=true`？** 成本映射已內建於 image 中，因此 Reload 按鈕無法連到它。請拉取 `v1.88.0-dev.1` 或更新版本，以取得隨附的 Opus 4.8 中繼資料：

  ```bash
  docker pull ghcr.io/berriai/litellm:v1.88.0-dev.1
  ```

## 用法 - Anthropic {#usage---anthropic}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-8
    litellm_params:
      model: anthropic/claude-opus-4-8
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.88.0-dev.1 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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

## 用法 - Azure {#usage---azure}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-8
    litellm_params:
      model: azure_ai/claude-opus-4-8
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
  ghcr.io/berriai/litellm:v1.88.0-dev.1 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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

## 用法 - Vertex AI {#usage---vertex-ai}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-8
    litellm_params:
      model: vertex_ai/claude-opus-4-8
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
  ghcr.io/berriai/litellm:v1.88.0-dev.1 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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

## 用法 - Bedrock {#usage---bedrock}

<Tabs>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-opus-4-8
    litellm_params:
      model: bedrock/anthropic.claude-opus-4-8
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
  ghcr.io/berriai/litellm:v1.88.0-dev.1 \
  --config /app/config.yaml
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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
當使用 `reasoning_effort` 搭配 Claude Opus 4.8 時，所有值（`low`、`medium`、`high`、`xhigh`、`max`）都會對應到 `thinking: {type: "adaptive"}`。Opus 4.8 只支援自適應思考；透過 `thinking: {type: "enabled", budget_tokens: ...}` 指定明確預算會被 Anthropic API 以 400 錯誤拒絕。若要控制思考深度，請將自適應思考與 `output_config.effort` 搭配使用（請參見下方的 [努力等級](#effort-levels)），而不是使用固定預算。
:::

<Tabs>
<TabItem value="completions" label="/chat/completions">

LiteLLM 透過 `reasoning_effort` 參數支援自適應思考：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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
    "model": "claude-opus-4-8",
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

Claude Opus 4.8 支援五種努力等級：`low`、`medium`、`high`（預設）、`xhigh` 和 `max`。這些等級可讓您更細緻地控制模型在任務上應用多少推理。請透過 `output_config` 參數傳入努力等級。

Opus 4.8 支援完整的努力階梯。`xhigh`（隨 Opus 4.7 推出）與 `max`（在 Opus 4.6 和 4.7 亦可使用）皆可用。

<Tabs>
<TabItem value="completions" label="/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-opus-4-8",
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
    model="claude-opus-4-8",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    extra_body={"output_config": {"effort": "max"}}
)
```

**使用 LiteLLM SDK：**

```python
from litellm import completion

response = completion(
    model="anthropic/claude-opus-4-8",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    output_config={"effort": "max"},
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
    "model": "claude-opus-4-8",
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

| 努力等級 | 使用時機 |
|--------|-------------|
| `low` | 適用於簡單查詢、格式化與分類的短且快速回應 |
| `medium` | 日常 Q&A 與輕量推理的平衡取捨 |
| `high`（預設） | 複雜推理、程式碼生成、分析 |
| `xhigh` | 多步驟數學、深入研究與代理式規劃等困難問題 |
| `max` | 您希望不計延遲、取得最大推理深度的最困難任務 |
