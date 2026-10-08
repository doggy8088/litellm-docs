---
slug: claude_fable_5_1
title: "Day 0 支援：Claude Fable 5.1"
date: 2026-09-01T10:00:00
authors:
  - misbah
  - mateo
  - krrish
  - ishaan-alt
description: "LiteLLM AI Gateway 對 Claude Fable 5.1 的 Day 0 支援，並自首次請求起追蹤 0.025x 的快取讀取價格。"
image: /img/litellm_claude_fable_5_1_announcement.png
tags: [anthropic, claude, fable 5.1, day 0 support]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![LiteLLM x Claude Fable 5.1](/img/litellm_claude_fable_5_1_announcement.png)

LiteLLM 支援 [Claude Fable 5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1) 的 Day 0，上線於 Anthropic、Bedrock、Gemini Enterprise Agent Platform 和 Azure，並將花費、速率限制、備援與記錄集中於一處。

{/* truncate */}

## Fable 5.1 的新功能 {#whats-new-in-fable-51}

定價、1M-token 上下文視窗、128K 輸出上限，以及持續啟用的自適應思考，都沿用自 Fable 5。改變的部分如下，依照對 gateway 的成本影響排序：

- **快取讀取費用降至 $0.25 / MTok，低於原本的 $1.00。** 這是 0.025x 的基礎輸入價格，而其他所有 Claude 模型皆為 0.1x。LiteLLM 會從 cost map 讀取此費率；若沒有此費率，則回退為基礎輸入，會造成 40 倍高估。
- **強制 tool use 會回傳 400。** Thinking 一直啟用，而強制呼叫會跳過它。LiteLLM 會將 OpenAI 的 `tool_choice: "required"` 對應到 Anthropic 的 `any`，因此在 Fable 5 上可運作的請求，到了這裡會在不變更的情況下失敗。若要取得 schema-valid 的 JSON，請將 `auto` 與 `strict: true` 一起使用，或在提示中指定工具名稱以強制呼叫。
- **Thinking blocks 會綁定到撰寫它們的模型。** Fable 5.1 會讀取較早模型的 blocks；但沒有任何模型能讀取它自己的 blocks。
- **編輯較早的回合會使 thinking blocks 失效。** 在對話進行中重建 `system` 或 `tools` 會回傳 `The block is bound to a different conversation`；此情況適用於自 2026 年 8 月 31 日起建立的帳戶。
- **Effort 可透過每則訊息進行調整**，位於 `mid-conversation-output-config-2026-07-01` beta header 之後，不會使 prompt cache 失效。

Anthropic 的 [新功能頁面](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1) 提供基準測試與功能提升。

## 用法 {#usage}

<Tabs>
<TabItem value="anthropic" label="Anthropic">

```yaml
model_list:
  - model_name: claude-fable-5-1
    litellm_params:
      model: anthropic/claude-fable-5-1
      api_key: os.environ/ANTHROPIC_API_KEY
```

</TabItem>
<TabItem value="bedrock" label="Bedrock">

```yaml
model_list:
  - model_name: claude-fable-5-1
    litellm_params:
      model: bedrock/converse/us.anthropic.claude-fable-5-1
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

Bedrock 透過 inference profiles 提供它。`us.` 與 `eu.` 會帶有 10% 的區域加價，`global.` 則維持基礎價格。

</TabItem>
<TabItem value="gemini-enterprise" label="Gemini Enterprise Agent Platform">

```yaml
model_list:
  - model_name: claude-fable-5-1
    litellm_params:
      model: vertex_ai/claude-fable-5-1
      vertex_project: os.environ/VERTEX_PROJECT
      vertex_location: global
```

Google 已將 Vertex AI 更名為 Gemini Enterprise Agent Platform；LiteLLM 的前綴仍然是 `vertex_ai/`。釘選區域會比全球區域高 10%，LiteLLM 會套用此加價。

</TabItem>
<TabItem value="azure" label="Azure">

```yaml
model_list:
  - model_name: claude-fable-5-1
    litellm_params:
      model: azure_ai/claude-fable-5-1
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE  # https://<resource>.services.ai.azure.com
```

</TabItem>
</Tabs>

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data '{
  "model": "claude-fable-5-1",
  "messages": [{"role": "user", "content": "what llm are you"}],
  "reasoning_effort": "xhigh"
}'
```

`reasoning_effort` 對應到 adaptive thinking，這是 Fable 5.1 唯一接受的模式。固定預算、assistant prefill，以及非預設的 `temperature` 或 `top_p` 會回傳 400。傳入 `output_config: {"effort": "max"}` 可取得完整階層 [Fable 5 uses](/blog/claude_fable_5)。

## 回饋 {#feedback}

遇到意料之外的情況嗎？請在 [GitHub 討論 #39163](https://github.com/BerriAI/litellm/discussions/39163) 分享。
