---
slug: gemini_3_1_pro
title: "DAY 0 支援：LiteLLM 上的 Gemini 3.1 Pro"
date: 2026-02-19T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "在 LiteLLM Proxy 和 SDK 上使用 Gemini 3.1 Pro 並提供 day 0 支援的指南。"
tags: [gemini, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 3.1 Pro Day 0 支援  {#gemini-31-pro-day-0-support}

LiteLLM 現在支援 `gemini-3.1-pro-preview` 以及所有隨之而來的新 API 變更。

{/* truncate */}

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-v1.81.9-stable.gemini.3.1-pro
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==v1.81.9-stable.gemini.3.1-pro
```

</TabItem>
</Tabs>

## 新增內容 {#whats-new}

### 1. 新的思考層級：`thinkingLevel`，支援 MINIMAL 與 MEDIUM {#1-new-thinking-levels-thinkinglevel-with-minimal--medium}

Gemini 3.1 Pro 新增對 **medium** 思考層級的支援

LiteLLM 會自動將 OpenAI `reasoning_effort` 參數映射到 Gemini 的 `thinkingLevel`，因此您可以使用熟悉的 `reasoning_effort` 值（`minimal`、`low`、`medium`、`high`），而無需變更程式碼！

---
## Gemini 3+ 的支援端點 {#supported-endpoints}

LiteLLM 為 Gemini 3.1 Pro 提供 **完整端到端支援**，涵蓋：

- ✅ `/v1/chat/completions` - OpenAI 相容的聊天 completions 端點
- ✅ `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- ✅ [`/v1/messages`](../../docs/anthropic_unified) - Anthropic 相容的 messages 端點
- ✅ `/v1/generateContent` – [Google Gemini API](../../docs/generateContent) 相容端點 

所有端點都支援：
- 串流與非串流回應
- 具備 thought signatures 的函式呼叫
- 多輪對話
- 所有 Gemini 3 專屬功能
- 將提供者特定的 thinking 相關參數轉換為 thinkingLevel

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

**使用 MEDIUM 思考的基本用法（新）**

```python
from litellm import completion

# No need to make any changes to your code as we map openai reasoning param to thinkingLevel
response = completion(
    model="gemini/gemini-3.1-pro-preview",
    messages=[{"role": "user", "content": "Solve this complex math problem: 25 * 4 + 10"}],
    reasoning_effort="medium",  # NEW: MEDIUM thinking level
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.1-pro-preview
    litellm_params:
      model: gemini/gemini-3.1-pro-preview
      api_key: os.environ/GEMINI_API_KEY
  - model_name: vertex-gemini-3.1-pro-preview
    litellm_params:
      model: vertex_ai/gemini-3.1-pro-preview
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 使用 MEDIUM thinking 呼叫**

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.1-pro-preview",
    "messages": [{"role": "user", "content": "Complex reasoning task"}],
    "reasoning_effort": "medium"
  }'
```

</TabItem>
</Tabs>

---

## `reasoning_effort` 映射表：適用於 Gemini 3+ {#reasoning_effort-mapping-for-gemini-3}

| reasoning_effort | thinking_level | 
|------------------|----------------|
| `minimal` | `minimal` |
| `low` | `low` |
| `medium` | `medium` |
| `high` | `high` |
| `disable` | `minimal` |
| `none` | `minimal` |
