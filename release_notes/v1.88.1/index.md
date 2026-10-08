---
title: "v1.88.1 - 相依性升級"
slug: "v1-88-1"
date: 2026-06-08T17:23:56
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
docker.litellm.ai/berriai/litellm:1.88.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.1
```

</TabItem>
</Tabs>

`v1.88.1` 是建立在 [`v1.88.0`](/release_notes/v1.88.0/v1-88-0) 之上的修補版發行。它升級了 PyJWT 與 `ws` 覆寫，以清除 1.88 系列上的相依性安全公告。

### 有哪些變更 {#whats-changed}

- build(deps): 將 PyJWT 升級至 2.13.0，並將 `ws` 覆寫升級至 8.20.1 - [PR #29987](https://github.com/BerriAI/litellm/pull/29987)

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.88.0...v1.88.1
