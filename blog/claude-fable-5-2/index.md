---
slug: claude-fable-5-2
title: "Claude Fable 5.2 API 定價與 LiteLLM 的 Day 0 支援"
date: 2026-11-09T18:00:00
authors:
  - misbah
  - mateo
  - kerry
description: "Claude Fable 5.2 每 1M 輸入 token 為 $8、每 1M 輸出 token 為 $40，較 Fable 5.1 低 20%。LiteLLM 在 Day 0 即支援。"
card_title: "Claude Fable 5.2"
card_summary: "每 1M token $8 / $40，較 Fable 5.1 低 20%，快取讀取 $0.20。1M 上下文、適應性思考、預設 effort 為 high。"
image: ./hero.png
tags: [anthropic, claude, claude fable, fable 5.2, pricing, day 0 support]
hide_table_of_contents: false
---

import Head from '@docusaurus/Head';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ClaudeFableHero from './Hero';

<Head>
  <meta property="og:video" content="https://docs.litellm.ai/img/blog/claude-fable-5-2/hero.mp4" />
  <meta property="og:video:secure_url" content="https://docs.litellm.ai/img/blog/claude-fable-5-2/hero.mp4" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1280" />
  <meta property="og:video:height" content="720" />
</Head>

export const Hero = ClaudeFableHero;

LiteLLM 現在於 Day 0 支援 [Claude Fable 5.2](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2)。透過 LiteLLM AI Gateway 呼叫它，並在同一個地方追蹤支出、速率限制與記錄。

{/* truncate */}

## Claude Fable 5.2 定價 {#claude-fable-52-pricing}

- **輸入：** $8.00 / MTok
- **輸出：** $40.00 / MTok
- **快取讀取：** $0.20 / MTok
- **快取寫入：** 5 分鐘 $10.00 / MTok，1 小時 $16.00 / MTok
- **批次：** 輸入 $4.00 / MTok，輸出 $20.00 / MTok

輸入與輸出都比 Claude Fable 5.1 便宜 20%。

| 模型 | 輸入 / MTok | 輸出 / MTok | 快取讀取 / MTok |
|---|---|---|---|
| **Claude Fable 5.2** | **$8.00** | **$40.00** | **$0.20** |
| Claude Fable 5.1 | $10.00 | $50.00 | $0.25 |
| Claude Opus 5.5 | $4.00 | $20.00 | $0.20 |

所有提供者的價格：https://models.litellm.ai/models

## Claude Fable 5.2 的新功能 {#whats-new-in-claude-fable-52}

- **比 Fable 5.1 便宜 20%**（輸入與輸出），快取讀取從 $0.25 降至 $0.20
- **1M token 上下文視窗**，輸出 token 最高達 128K
- **適應性思考永遠開啟**，有從 `low` 到 `max` 的五個 effort 等級，預設為 `high`
- **快速模式**可在 Claude API 上使用，輸入 $16 / MTok、輸出 $80 / MTok

## 透過 LiteLLM 使用 Claude Fable 5.2 {#use-claude-fable-52-with-litellm}

定價已透過 [PR #50715](https://github.com/BerriAI/litellm/pull/50715) 加入。無需升級：在 UI 的 **Models + Endpoints** 下開啟 **Price Data**，並點擊 **Reload Price Data**（或 `POST /reload/model_cost_map`），適用於 `v1.76.0` 以上版本。

<Tabs>
<TabItem value="anthropic" label="Anthropic">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-fable-5-2
    litellm_params:
      model: anthropic/claude-fable-5-2
      api_key: os.environ/ANTHROPIC_API_KEY
```

**2. 啟動 proxy**

```bash
docker run -d \
  -p 4000:4000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/config.yaml:/app/config.yaml \
  ghcr.io/berriai/litellm:v1.106.2 \
  --config /app/config.yaml
```

</TabItem>
<TabItem value="claude-platform-aws" label="Claude Platform on AWS">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-fable-5-2
    litellm_params:
      model: bedrock/claude_platform/claude-fable-5-2
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
  ghcr.io/berriai/litellm:v1.106.2 \
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
  "model": "claude-fable-5-2",
  "messages": [
    {
      "role": "user",
      "content": "what llm are you"
    }
  ]
}'
```

Anthropic 也在 Amazon Bedrock 上以 `anthropic.claude-fable-5-2` 提供 Fable 5.2，並在 Google Cloud 與 Microsoft Foundry 中以 `claude-fable-5-2` 提供。這些路由的成本對照表條目正在 [PR #50713](https://github.com/BerriAI/litellm/pull/50713) 與 [PR #50707](https://github.com/BerriAI/litellm/pull/50707) 中處理；在其中之一合併之前，這些路由上的請求在閘道中以 $0 計費。

## FAQ {#faq}

### Claude Fable 5.2 的價格是多少？ {#how-much-does-claude-fable-52-cost}

每 1M 輸入 token $8，每 1M 輸出 token $40。快取讀取每 1M token $0.20，批次請求為 $4 與 $20。

### Claude Fable 5.2 比 Fable 5.1 便宜嗎？ {#is-claude-fable-52-cheaper-than-fable-51}

是的，輸入與輸出都便宜 20%。Fable 5.1 每 1M token 為 $10 與 $50。

### Claude Fable 5.2 的上下文視窗有多大？ {#what-is-the-context-window-of-claude-fable-52}

1M token，每個請求的輸出 token 最高達 128K。

### 如何以與 OpenAI 相容的 API 呼叫 Claude Fable 5.2？ {#how-do-i-call-claude-fable-52-with-an-openai-compatible-api}

將 `anthropic/claude-fable-5-2` 加入您的 LiteLLM 設定，然後向 proxy 發送標準的 `/chat/completions` 請求，並將 `"model": "claude-fable-5-2"` 帶入。

### 哪些模型可以讀取 Claude Fable 5.2 的思考區塊？ {#which-models-can-read-claude-fable-52-thinking-blocks}

只有 Fable 5.2 與 Mythos 5.2。備援切換到它時會保留對話的推理；備援從它切離時則會捨棄，包括 Opus 5.5 與 Fable 5.1。

### 為什麼 Claude Fable 5.2 會傳回 "The block is bound to a different conversation"？ {#why-does-claude-fable-52-return-the-block-is-bound-to-a-different-conversation}

在思考區塊之後編輯 `system`、`tools` 或先前的訊息會觸發前綴檢查，而該檢查現在適用於每個帳戶。

### Claude Fable 5.2 支援 `computer_20251124` 工具嗎？ {#does-claude-fable-52-support-the-computer_20251124-tool}

不支援。請使用 `computer_toolset_20260801`；較早的工具除了 Bedrock 之外都會傳回 400。

### 我可以在 Claude Fable 5.2 上強制進行工具呼叫嗎？ {#can-i-force-a-tool-call-on-claude-fable-52}

不行，`tool_choice` 為 `any` 或 `tool` 會傳回 400。LiteLLM 會將 `tool_choice: "required"` 對應到 `any`，因此請將它保持在 `auto` 並使用 `strict: true`。

## 意見回饋 {#feedback}

問題與意見回饋請至 [GitHub discussions](https://github.com/BerriAI/litellm/discussions)。
