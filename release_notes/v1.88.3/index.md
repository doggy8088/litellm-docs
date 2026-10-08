---
title: "v1.88.3 - 防護欄輪詢與 Hook 修正"
slug: "v1-88-3"
date: 2026-06-17T12:44:42
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
docker.litellm.ai/berriai/litellm:1.88.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.3
```

</TabItem>
</Tabs>

`v1.88.3` 是基於 [`v1.88.2`](/release_notes/v1.88.2/v1-88-2) 的修補版本。此版本修正了兩個防護欄回歸問題：以資料庫為後端的防護欄在每次輪詢時都會重新初始化，以及模型層級防護欄的 pre-call hook 會執行不只一次。

### 變更內容 {#whats-changed}

- fix(guardrails): 不要在每次輪詢時重新初始化 DB 防護欄 - [PR #30542](https://github.com/BerriAI/litellm/pull/30542)
- fix(guardrails): 針對模型層級防護欄執行一次 `pre_call` hook - [PR #30543](https://github.com/BerriAI/litellm/pull/30543)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.2...v1.88.3
