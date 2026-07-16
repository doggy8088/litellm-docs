---
slug: gemini_3_1_flash_lite_preview
title: "DAY 0 支援：LiteLLM 上的 Gemini 3.1 Flash Lite Preview"
date: 2026-03-03T08:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "在 LiteLLM Proxy 和 SDK 上使用 Gemini 3.1 Flash Lite Preview 的指南，具備 day 0 支援。"
tags: [gemini, day 0 support, llms, supernova]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 3.1 Flash Lite Preview 第 0 天支援  {#gemini-31-flash-lite-preview-day-0-support}

LiteLLM 現在完整支援 `gemini-3.1-flash-lite-preview`，具備完整的 day 0 支援！

:::note
如果您只想進行成本追蹤，您目前的 Litellm 版本不需要任何變更。但如果您想使用隨之推出的新功能，例如 thinking levels，則需要使用 v1.80.8-stable.1 或以上版本。
:::

{/* truncate */}

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-v1.80.8-stable.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==v1.80.8-stable.1
```

</TabItem>
</Tabs>

## 新功能 {#whats-new}

支援全部四種 thinking levels：
- **MINIMAL**：極速回應，推理最少
- **LOW**：簡單的指令遵循
- **MEDIUM**：適合複雜任務的平衡推理
- **HIGH**：最大推理深度（動態）

---

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

**基本用法**

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3.1-flash-lite-preview",
    messages=[{"role": "user", "content": "Extract key entities from this text: ..."}],
)

print(response.choices[0].message.content)
```

**搭配 Thinking Levels**

```python
from litellm import completion

# Use MEDIUM thinking for complex reasoning tasks
response = completion(
    model="gemini/gemini-3.1-flash-lite-preview",
    messages=[{"role": "user", "content": "Analyze this dataset and identify patterns"}],
    reasoning_effort="medium",  # low, medium , high
)

print(response.choices[0].message.content)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: gemini-3.1-flash-lite
    litellm_params:
      model: gemini/gemini-3.1-flash-lite-preview
      api_key: os.environ/GEMINI_API_KEY
  
  # Or use Vertex AI
  - model_name: vertex-gemini-3.1-flash-lite
    litellm_params:
      model: vertex_ai/gemini-3.1-flash-lite-preview
      vertex_project: your-project-id
      vertex_location: us-central1
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 發出請求**

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR-LITELLM-KEY>" \
  -d '{
    "model": "gemini-3.1-flash-lite",
    "messages": [{"role": "user", "content": "Extract structured data from this text"}],
    "reasoning_effort": "low"
  }'
```

</TabItem>
</Tabs>

---

## 支援的端點 {#supported-endpoints}

LiteLLM 在以下平台上為 Gemini 3.1 Flash Lite Preview 提供 **完整端到端支援**：

- ✅ `/v1/chat/completions` - 相容 OpenAI chat completions 的端點
- ✅ `/v1/responses` - 相容 OpenAI Responses API 的端點（串流與非串流）
- ✅ [`/v1/messages`](../../docs/anthropic_unified) - 相容 Anthropic messages 的端點
- ✅ `/v1/generateContent` – [Google Gemini API](../../docs/generateContent) 相容的端點 

所有端點都支援：
- 串流與非串流回應
- 具備 thought signatures 的函式呼叫
- 多輪對話
- 所有 Gemini 3 專屬功能（thinking levels、thought signatures）
- 完整多模態支援（文字、圖片、音訊、影片）

---

## Gemini 3.1 的 `reasoning_effort` 對應 {#reasoning_effort-mapping-for-gemini-31}

LiteLLM 會自動將 OpenAI 的 `reasoning_effort` 參數對應到 Gemini 的 `thinkingLevel`：

| reasoning_effort | thinking_level | 使用情境 |
|------------------|----------------|----------|
| `minimal` | `minimal` | 極速回應、簡單查詢 |
| `low` | `low` | 基本指令遵循 |
| `medium` | `medium` | 適用於中等複雜度的平衡推理 |
| `high` | `high` | 最大推理深度、複雜問題 |
| `disable` | `minimal` | 停用延伸推理 |
| `none` | `minimal` | 不進行延伸推理 |
