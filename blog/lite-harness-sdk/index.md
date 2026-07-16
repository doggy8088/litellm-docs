---
slug: lite-harness-sdk
title: "LiteLLM Labs：宣布 Lite-Harness SDK — Claude Code、Codex 與 Pi AI 的統一 API"
date: 2026-06-02T09:00:00
authors:
  - krrish
  - ishaan-alt
description: "一個 SDK。只要更改字串即可在 Claude Code、Codex 與 Pi AI 之間切換。可搭配 LiteLLM AI Gateway 使用，提供金鑰、預算、記錄與備援。"
tags: [litellm-labs, product, agents, sdk, ai-gateway]
hide_table_of_contents: true
---

Harness 是提供者鎖定的下一個前沿。LiteLLM 的設計初衷是讓模型提供者之間能夠輕鬆切換。然而，隨著模型越來越飽和，下一個競爭領域就會變成 harness 與受管理的代理程式。為了讓您更容易在 harness 層切換提供者，我們推出 Lite-Harness SDK。這是一個簡單的 TypeScript+Python SDK，讓開發者能像切換模型一樣切換 harness。

它以統一的 Claude Agents SDK 規格公開各種 harness。這表示，如果您是用 Claude Agents SDK 撰寫應用程式，並且想試試其他 harness（Pi AI、Hermes、Codex、OpenCode），就可以在不重寫程式碼的情況下完成。

目前支援 3 種 harness——Claude Code、Codex 和 Pi AI。如果您希望我們新增其他 harness，請在[這裡](https://github.com/LiteLLM-Labs/lite-harness/issues)提出 issue。

運作方式如下：

**TypeScript 範例**

```ts
import { query } from "@lite-harness/sdk";

const prompt = "Fix the failing test";

// Claude Code harness
for await (const message of query({
  prompt,
  options: { harness: "claude-code", model: "claude-opus-4-8" },
})) {
  console.log(message);
}

// Codex harness
for await (const message of query({
  prompt,
  options: { harness: "codex", model: "gpt-5.5" },
})) {
  console.log(message);
}
```

**Python 範例**

```python
from lite_harness import query, AgentOptions

prompt = "Fix the failing test"

# Claude Code harness
async for message in query(
    prompt=prompt,
    options=AgentOptions(harness="claude-code", model="claude-opus-4-8"),
):
    print(message)

# Codex harness
async for message in query(
    prompt=prompt,
    options=AgentOptions(harness="codex", model="gpt-5.5"),
):
    print(message)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

Lite-Harness 支援透過 LiteLLM AI Gateway 代理 harness。這可讓模型切換、成本控制和記錄更容易。

請透過設定兩個環境變數，將 Lite-Harness 指向您的 gateway：

```bash
export LITELLM_API_BASE=https://litellm.your-company.com/v1
export LITELLM_API_KEY=sk-litellm-...
```

接著如常呼叫——每個底層模型請求都會經由 gateway 路由：

```python
from lite_harness import query, AgentOptions

prompt = "Fix the failing test"

# Claude Code harness
async for message in query(
    prompt=prompt,
    options=AgentOptions(harness="claude-code", model="claude-opus-4-8"),
):
    print(message)

# Codex harness
async for message in query(
    prompt=prompt,
    options=AgentOptions(harness="codex", model="gpt-5.5"),
):
    print(message)
```

---

### 常見問題 {#frequently-asked-questions}

### 我一定要使用 LiteLLM AI Gateway 嗎？ {#do-i-have-to-use-the-litellm-ai-gateway}

不需要。`lite-harness` 可獨立運作——只要將它指向使用原生金鑰的提供者 API。對於希望集中管理金鑰、預算、備援，以及跨所有模型呼叫的單一稽核記錄的團隊，AI Gateway 整合是可選的。

### 切換 harness 會改變代理程式行為嗎？ {#does-swapping-harnesses-change-agent-behavior}

會——這正是重點。每個 harness 都保有其原生迴圈、工具呼叫語義與提示格式。`lite-harness` 只是統一您「呼叫」它們的方式，而不是它們內部的運作方式。請用相同的提示在三者上執行，看看哪個組合最能完成任務。

### 這已準備好投入正式環境了嗎？  {#is-this-ready-for-production}

`lite-harness` 是一個早期、實驗性的專案。目前處於公開 beta。歡迎加入我們的[discord](https://discord.gg/Nkxw3rm3EE)，協助我們依照您的偏好來設計它。

### 這在 LiteLLM OSS 中可用嗎？ {#is-this-available-in-litellm-oss}

可以。`lite-harness` 採 MIT 授權，位於 [github.com/LiteLLM-Labs/lite-harness](https://github.com/LiteLLM-Labs/lite-harness)。[LiteLLM Enterprise](https://litellm.ai/enterprise) 在其搭配的 AI Gateway 之上，提供 SSO/SCIM、air-gapped 部署、24/7 SLA，以及進階防護欄。

## 建議閱讀 {#recommended-reading}

- [LiteLLM AI Gateway — 完整功能總覽](https://docs.litellm.ai/docs/simple_proxy)
- [LiteLLM 受管理代理程式平台 — Alpha](https://docs.litellm.ai/blog/agent-platform-alpha)
- [跨 100+ LLM 提供者的負載平衡與路由](https://docs.litellm.ai/docs/routing)
