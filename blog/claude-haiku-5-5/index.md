---
slug: claude-haiku-5-5
title: "Claude Haiku 5.5 API 定價與 LiteLLM 的 Day 0 支援"
date: 2026-10-07T10:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "Claude Haiku 5.5 每 1M 輸入 token 為 $0.10、每 1M 輸出 token 為 $0.50。LiteLLM 在 Day 0 即於 Anthropic、AWS、Google Cloud 與 Azure 上支援。"
card_title: "Claude Haiku 5.5"
card_summary: "在短提示上比 Haiku 4.5 便宜 90%，1M 上下文，OSWorld 2.1 達 72.4%，每 1M token $0.10 / $0.50。"
image: /img/litellm_claude_haiku_5_5_announcement.png
tags: [anthropic, claude, claude haiku, haiku 5.5, pricing, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM 上的 Claude Haiku 5.5](/img/litellm_claude_haiku_5_5_announcement.png)

LiteLLM 現在於 Day 0 支援 [Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5)。透過 LiteLLM AI Gateway 在 Anthropic、Bedrock、Gemini Enterprise Agent Platform 與 Azure 上使用它，並在同一個地方管理支出、速率限制與記錄。

{/* truncate */}

## Claude Haiku 5.5 定價 {#claude-haiku-55-pricing}

- **輸入：** 提示最高 100K token 時 $0.10 / MTok，超過則為 $0.50 / MTok
- **輸出：** $0.50 / MTok，超過 100K 則為 $2.50 / MTok
- **快取讀取：** $0.01 / MTok，超過 100K 則為 $0.05 / MTok
- **批次：** 輸入與輸出 5 折

所有提供者的價格：https://models.litellm.ai/models

## Claude Haiku 5.5 的新功能 {#whats-new-in-claude-haiku-55}

- 對於最高 100K token 的提示，**比 Haiku 4.5 便宜 90%**，且根據 Anthropic 的說法，平均執行成本約低 75%
- **OSWorld 2.1 達 72.4%**，高於 Haiku 4.5 的 15.7%
- **1M token 上下文**，輸出 token 最高達 128K

## 透過 LiteLLM 使用 Claude Haiku 5.5 {#use-claude-haiku-55-with-litellm}

定價已透過 [PR #45108](https://github.com/BerriAI/litellm/pull/45108) 加入。無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，並點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用於 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-haiku-5-5
    litellm_params:
      model: anthropic/claude-haiku-5-5
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.104.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-haiku-5-5
    litellm_params:
      model: bedrock/global.anthropic.claude-haiku-5-5
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

:::note
`global.` 可以從任何 AWS 商業區域提供請求。若要將請求保持在單一地理區域內，請換上地理推論設定檔，例如 `bedrock/us.anthropic.claude-haiku-5-5`（該模型的 AWS 模型卡列出了它擁有的設定檔），其成本高 10%。LiteLLM 會追蹤兩者的成本。在較舊的映像上，這需要遠端成本對照表，LiteLLM 會在啟動時載入它，除非設定了 `LITELLM_LOCAL_MODEL_COST_MAP`。
:::

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.104.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-haiku-5-5
    litellm_params:
      model: vertex_ai/claude-haiku-5-5
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
  ghcr.io/berriai/litellm:v1.104.0 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="azure" label="Azure">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-haiku-5-5
    litellm_params:
      model: azure_ai/claude-haiku-5-5
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
  ghcr.io/berriai/litellm:v1.104.0 \
  --config /app/config.yaml
```

</TabItem>
</Tabs>

**3. 測試看看！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-haiku-5-5",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

## FAQ {#faq}

### Claude Haiku 5.5 的價格是多少？ {#how-much-does-claude-haiku-55-cost}

對於最高 100K token 的提示，每 1M 輸入 token $0.10、每 1M 輸出 token $0.50；超過則為 $0.50 與 $2.50。快取讀取每 1M token $0.01。

### Claude Haiku 5.5 的上下文視窗有多大？ {#what-is-the-context-window-of-claude-haiku-55}

1M token，每個請求的輸出 token 最高達 128K。

### 如何以與 OpenAI 相容的 API 呼叫 Claude Haiku 5.5？ {#how-do-i-call-claude-haiku-55-with-an-openai-compatible-api}

將 `anthropic/claude-haiku-5-5` 加入您的 LiteLLM 設定，然後向 proxy 發送標準的 `/chat/completions` 請求，並將 `"model": "claude-haiku-5-5"` 帶入。

## 意見回饋 {#feedback}

問題與意見回饋請至 [GitHub discussion #45133](https://github.com/BerriAI/litellm/discussions/45133)。
