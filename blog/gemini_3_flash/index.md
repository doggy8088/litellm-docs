---
slug: gemini_3_flash
title: "LiteLLM 上的 DAY 0 支援：Gemini 3 Flash"
date: 2025-12-17T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "在 LiteLLM Proxy 與 SDK 上使用具備 day 0 支援的 Gemini 3 Flash 之指南。"
tags: [gemini, day 0 support, llms]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 3 Flash Day 0 支援  {#gemini-3-flash-day-0-support}

LiteLLM 現在支援 `gemini-3-flash-preview` 以及其所有新的 API 變更。

:::note
如果您只想要成本追蹤，您目前的 Litellm 版本不需要任何變更。但如果您想要支援隨之推出的新功能，例如 thinking levels，則需要使用 v1.80.8-stable.1 或以上版本。
:::

{/* truncate */}

## 部署這個版本 {#deploy-this-version}

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
pip install litellm==1.80.8.post1
```

</TabItem>
</Tabs>

## 新功能 {#whats-new}

### 1. 新的 Thinking Levels：`thinkingLevel` 搭配 MINIMAL 與 MEDIUM {#1-new-thinking-levels-thinkinglevel-with-minimal--medium}

Gemini 3 Flash 透過 `thinkingLevel` 而非 `thinkingBudget`，引入了更細緻的 thinking 控制。
- **MINIMAL**：超輕量 thinking，適合快速回應
- **MEDIUM**：平衡 thinking，適合複雜推理  
- **HIGH**：最高推理深度

LiteLLM 會自動將 OpenAI 的 `reasoning_effort` 參數對應到 Gemini 的 `thinkingLevel`，因此您可以使用熟悉的 `reasoning_effort` 值（`minimal`、`low`、`medium`、`high`），而無需變更程式碼！

### 2. 思考簽章 {#2-thought-signatures}

如同 `gemini-3-pro`，這個模型也為工具呼叫包含 thought signatures。LiteLLM 會在內部處理 signature 的擷取與嵌入。[深入了解 thought signatures](../gemini_3/index.md#thought-signatures)。

**邊界情況處理**：如果請求中缺少 thought signatures，LiteLLM 會加入一個虛擬 signature，確保 API 呼叫不會中斷

---
## 支援的端點 {#supported-endpoints}

LiteLLM 提供 Gemini 3 Flash 的**完整端到端支援**，適用於：

- ✅ `/v1/chat/completions` - OpenAI 相容的 chat completions 端點
- ✅ `/v1/responses` - OpenAI Responses API 端點（串流與非串流）
- ✅ [`/v1/messages`](../../docs/anthropic_unified) - Anthropic 相容的 messages 端點
- ✅ `/v1/generateContent` – [Google Gemini API](../../docs/generateContent) 相容端點 
所有端點都支援：
- 串流與非串流回應
- 具備 thought signatures 的函式呼叫
- 多輪對話
- 所有 Gemini 3 特有功能
- 將提供者特定的 thinking 相關參數轉換為 thinkingLevel

## 快速開始 {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

**使用 MEDIUM thinking 的基本用法（新增）**

```python
from litellm import completion

# No need to make any changes to your code as we map openai reasoning param to thinkingLevel
response = completion(
    model="gemini/gemini-3-flash-preview",
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
  - model_name: gemini-3-flash
    litellm_params:
      model: gemini/gemini-3-flash-preview
      api_key: os.environ/GEMINI_API_KEY
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
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Complex reasoning task"}],
    "reasoning_effort": "medium"
  }'
``'

</TabItem>
</Tabs>

---

## All `reasoning_effort` Levels

<Tabs>
<TabItem value="minimal" label="MINIMAL">

**Ultra-fast, minimal reasoning**

```python
from litellm import completion

response = completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "What's 2+2?"}],
    reasoning_effort="minimal",
)
```

</TabItem>

<TabItem value="low" label="LOW">

**簡單的指令遵循**

```python
response = completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "Write a haiku about coding"}],
    reasoning_effort="low",
)
```

</TabItem>

<TabItem value="medium" label="MEDIUM (NEW)">

**適用於複雜任務的平衡推理** ✨

```python
response = completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "Analyze this dataset and find patterns"}],
    reasoning_effort="medium",  # NEW!
)
```

</TabItem>

<TabItem value="high" label="HIGH">

**最高推理深度**

```python
response = completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "Prove this mathematical theorem"}],
    reasoning_effort="high",
)
```

</TabItem>
</Tabs>

---

## 主要功能 {#key-features}

✅ **Thinking Levels**：MINIMAL、LOW、MEDIUM、HIGH  
✅ **Thought Signatures**：使用唯一識別碼追蹤推理  
✅ **無縫整合**：可與現有的 OpenAI 相容用戶端搭配使用  
✅ **向後相容**：Gemini 2.5 模型持續使用 `thinkingBudget`  

---

## 安裝 {#installation}

```bash
pip install litellm --upgrade
```

```python
import litellm
from litellm import completion

response = completion(
    model="gemini/gemini-3-flash-preview",
    messages=[{"role": "user", "content": "Your question here"}],
    reasoning_effort="medium",  # Use MEDIUM thinking
)
print(response)
```

:::note
如果透過 vertex_ai 使用此模型，請將 location 保持為 global，因為目前這是唯一支援的 location。
:::

## Gemini 3+ 的 `reasoning_effort` 對應 {#reasoning_effort-mapping-for-gemini-3}

| reasoning_effort | thinking_level | 
|------------------|----------------|
| `minimal` | `minimal` |
| `low` | `low` |
| `medium` | `medium` |
| `high` | `high` |
| `disable` | `minimal` |
| `none` | `minimal` |
