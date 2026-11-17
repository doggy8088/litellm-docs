---
title: "LiteLLM v1.106.4、v1.105.5、v1.104.7 與 v1.103.9 更新映像基礎層"
description: "Docker 映像移至較新的基礎映像，讓映像掃描不再標記映像未使用的套件。"
slug: "v1-103-9"
date: 2026-10-25T08:57:32
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

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.103.9
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.9
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.9`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.9) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.9` 是建立在 [`v1.103.8`](/release_notes/v1.103.8/v1-103-8) 之上的修補版本。它將 `stable/1.103.x` 上的 Docker 映像移至較新的基礎映像。沒有新的資料庫遷移。`v1.103.9` 標籤指向 [`58daf87`](https://github.com/BerriAI/litellm/commit/58daf875b74091a6bfd1fd59f18f1e4dcd356bc5)

### 有什麼變更 {#whats-changed}

- Docker 映像移至較新的基礎映像，讓映像掃描不再標記 brotli 1.2.0、emSign ECC Root CA - G3，以及映像從未安裝的 repo 鎖定檔套件 - [PR #48281](https://github.com/BerriAI/litellm/pull/48281)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.8...v1.103.9
