---
title: "v1.90.5 - Docker Migration Assets 已恢復"
slug: "v1-90-5"
date: 2026-07-16T15:38:03
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
docker.litellm.ai/berriai/litellm:1.90.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.5
```

</TabItem>
</Tabs>

`v1.90.5` 是建立在 [`v1.90.4`](/release_notes/v1.90.4/v1-90-4) 之上的修補版本。它會將所有三個已發佈 Docker 映像在執行階段中的 `litellm-proxy-extras` 來源資料夾（Prisma schema 及其 migrations 目錄）還原。從 `v1.90.0` 到 `v1.90.4` 的映像移除了 `/app/litellm-proxy-extras`，這導致那些在部署前自行對該路徑下提供的 schema 與 migrations 執行 migration job 的部署失效；而且這個問題可能是無聲的，因為 `prisma migrate deploy` 指向一個沒有相鄰 migrations 目錄的 schema 時，會直接以 0 結束而不會套用任何內容。現在這些映像已與 `v1.89.x` 及更早版本所包含的內容一致。

### 變更內容 {#whats-changed}

- fix(docker): 在執行階段映像中還原 litellm-proxy-extras 原始目錄 - [PR #33592](https://github.com/BerriAI/litellm/pull/33592)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.4...v1.90.5
