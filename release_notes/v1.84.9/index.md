---
title: "v1.84.9 - Anthropic 快取控制上限"
slug: "v1-84-9"
date: 2026-06-16T18:19:59
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
docker.litellm.ai/berriai/litellm:1.84.9
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.84.9
```

</TabItem>
</Tabs>

`v1.84.9` 是 [`v1.84.8`](/release_notes/v1.84.8/v1-84-8) 之上的修補版本。它將 Anthropic `cache_control` 注入上限設為 4 個區塊的 API 限制，因此當符合條件的區塊超過時，提示快取請求不會再失敗。

### 有哪些變更 {#whats-changed}

- fix(integrations): 將 Anthropic cache_control 注入上限設為 4 個區塊 - [PR #30480](https://github.com/BerriAI/litellm/pull/30480)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.84.8...v1.84.9
