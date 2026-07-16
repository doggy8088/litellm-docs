---
title: "v1.85.3 - 可觀測性、預算與速率限制修正"
slug: "v1-85-3"
date: 2026-06-01T19:02:53
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
docker.litellm.ai/berriai/litellm:1.85.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.85.3
```

</TabItem>
</Tabs>

`v1.85.3` 是建立在 [`v1.85.2`](/release_notes/v1.85.2/v1-85-2) 之上的修補版發行。它挑選性納入了重複 Claude Code 追蹤、Bearer 前綴雜湊、預算重設寫入，以及速率限制器和提供者請求內文中兩項旗標洩漏修正。

### 變更內容 {#whats-changed}

- fix(logging): 停止重複的 Claude Code traces（#29089 的內部複本） - [PR #29311](https://github.com/BerriAI/litellm/pull/29311)
- fix(proxy): 在 safe-hash helper 中將 Bearer 前綴標準化 - [PR #29343](https://github.com/BerriAI/litellm/pull/29343)
- fix(budget): reset_budget 只會寫入 `{spend, budget_reset_at}`，且不再預先將計數器歸零 - [PR #29358](https://github.com/BerriAI/litellm/pull/29358)
- fix(rate-limit): 阻止 v3 limiter 將內部 stash 洩漏到提供者的本文 - [PR #27913](https://github.com/BerriAI/litellm/pull/27913)
- fix(proxy): 阻止 `use_chat_completions_api` 標記洩漏到提供者請求本文 - [PR #29447](https://github.com/BerriAI/litellm/pull/29447)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.85.2...v1.85.3
