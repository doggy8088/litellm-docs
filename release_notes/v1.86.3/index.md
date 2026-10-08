---
title: "v1.86.3 - Gemini 3.5 Flash 第 0 天與待處理分支回補"
slug: "v1-86-3"
date: 2026-06-02T17:31:21
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
docker.litellm.ai/berriai/litellm:1.86.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.3
```

</TabItem>
</Tabs>

`v1.86.3` 是建立在 [`v1.86.2`](/release_notes/v1.86.2/v1-86-2) 之上的修補版發布。它彌補了 1.84 與 1.85 分支之間的差距：Vertex AI 與 Google AI Studio 上 Gemini 3.5 Flash 的第 0 天支援，以及配套的 Vertex 工具呼叫修正、Redis 消費計數器種子初始化，以及可觀測性、預算與旗標外洩修正。

### 變更內容 {#whats-changed}

- feat: Vertex AI 與 Google AI Studio 上 Gemini 3.5 Flash 的第 0 天支援 - [PR #28268](https://github.com/BerriAI/litellm/pull/28268)
- fix(vertex): 在 Gemini 3.5+ 工具輪次中省略 function_call `id`（與 #28268 搭配）- [PR #28324](https://github.com/BerriAI/litellm/pull/28324)
- fix(spend): 使用 `SET NX` 初始化 Redis 消費計數器，因此並行 pod 不再重複種子初始化 - [PR #27854](https://github.com/BerriAI/litellm/pull/27854)
- fix(logging): 停止重複的 Claude Code trace，外加 `_build_passthrough_logging_result` 輔助函式 - [PR #29311](https://github.com/BerriAI/litellm/pull/29311)
- fix(proxy): 在 safe-hash 輔助函式中標準化 Bearer 前綴 - [PR #29343](https://github.com/BerriAI/litellm/pull/29343)
- fix(budget): reset_budget 只寫入 `{spend, budget_reset_at}` - [PR #29358](https://github.com/BerriAI/litellm/pull/29358)
- fix(proxy): 防止 `use_chat_completions_api` 旗標外洩到提供者請求本文中 - [PR #29447](https://github.com/BerriAI/litellm/pull/29447)

## 完整更新紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.86.2...v1.86.3
