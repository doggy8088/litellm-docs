---
title: "v1.84.1 - Gemini 3.5 Flash 與可靠性修正"
slug: "v1-84-1"
date: 2026-05-20T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.84.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.1
```

</TabItem>
</Tabs>

`v1.84.1` 是建構於 [`v1.84.0`](/release_notes/v1.84.0/v1-84-0) 之上的修補版本。它新增了 Gemini 3.5 Flash 的 day-0 支援，並推出兩項可靠性修正——跨叢集支出準確性與 Vertex AI 工具呼叫。

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援（1 個新模型） {#new-model-support-1-new-model}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Gemini / Vertex AI | `gemini/gemini-3.5-flash`, `vertex_ai/gemini-3.5-flash` | 1M | $1.50 | $9.00 | 推理、視覺、音訊輸入、PDF 輸入、prompt caching、web search、function calling、response schema |

#### 功能 {#features}

- **[Gemini](../../docs/providers/gemini)** / **[Vertex AI](../../docs/providers/vertex)**
    - Gemini 3.5 Flash 在 Google AI Studio 與 Vertex AI 上皆提供 day-0 支援 - [PR #28268](https://github.com/BerriAI/litellm/pull/28268)

### 錯誤修正 {#bug-fixes}

- **[Vertex AI](../../docs/providers/vertex)**
    - 在 Vertex Gemini 3.5+ 工具回合中省略 `function_call` / `function_response` `id`，修正 HTTP 400 `Unknown name "id"` 錯誤。Google AI Studio（`gemini` 提供者）在 Gemini 3.5+ 上仍會轉送 `id`，以便嚴格的工具呼叫比對 - [PR #28324](https://github.com/BerriAI/litellm/pull/28324)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 透過 `SET NX` 而不是 `INCRBYFLOAT` 來初始化 Redis 支出計數器，以防止跨叢集重複初始化。在多叢集部署中，這過去會導致團隊 `spend` 在 Redis 快取遺失 / TTL 到期後跳升到約為 pod 數量的 Nx，進而觸發錯誤的「Budget Crossed」警示 - [PR #27854](https://github.com/BerriAI/litellm/pull/27854)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.0...v1.84.1
