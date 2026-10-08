---
title: "v1.87.4 - 防護欄與記錄修正"
slug: "v1-87-4"
date: 2026-06-20T14:44:03
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
docker.litellm.ai/berriai/litellm:1.87.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.87.4
```

</TabItem>
</Tabs>

`v1.87.4` 是建置在 [`v1.87.3`](/release_notes/v1.87.3/v1-87-3) 之上的修補版發行。它回補了防護欄正確性修正（模型層級防護欄只會執行一次 pre_call hook、每次輪詢不重新初始化 DB、AIM 封鎖請求時回傳 400 而非 500），限制 Anthropic cache-control 注入，並修正跨 Datadog 批次處理、passthrough 重複，以及 Claude Code traces 的多個記錄問題。

### 有哪些變更 {#whats-changed}

- fix(datadog): 將過大的批次在 413 時拆分，而不是永遠重新排入佇列 - [PR #29444](https://github.com/BerriAI/litellm/pull/29444)
- fix: 停止 use_chat_completions_api 標記滲入提供者請求本文 - [PR #29447](https://github.com/BerriAI/litellm/pull/29447)
- fix: 重複的 Claude Code traces - [PR #29311](https://github.com/BerriAI/litellm/pull/29311)
- fix: passthrough 端點重複記錄 - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)
- fix(integrations): 將 Anthropic cache_control 注入上限設為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)
- fix(guardrails): model-level 防護欄的 pre_call hook 只執行一次 - [PR #30543](https://github.com/BerriAI/litellm/pull/30543)
- fix(guardrails): 停止在每次輪詢時重新初始化 DB 防護欄 - [PR #30542](https://github.com/BerriAI/litellm/pull/30542)
- fix(guardrails): 當 AIM 封鎖請求時回傳 400 而不是 500 - [PR #30573](https://github.com/BerriAI/litellm/pull/30573)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.87.3...v1.87.4
