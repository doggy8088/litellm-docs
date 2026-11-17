---
title: "LiteLLM v1.106.4、v1.105.5、v1.104.7 與 v1.103.9 更新映像基礎層"
description: "修正遠端模型成本對照表無法連線時的啟動崩潰，並將 Docker 映像移至較新的基礎映像。"
slug: "v1-104-7"
date: 2026-10-25T09:12:15
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
docker.litellm.ai/berriai/litellm:1.104.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.7
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.104.7`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.7) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.104.7` 是建立在 [`v1.104.6`](/release_notes/v1.104.6/v1-104-6) 之上的修補版本。它修正遠端模型成本對照表無法連線時的啟動崩潰，並在 `stable/1.104.x` 上將 Docker 映像移至較新的基礎映像。沒有新的資料庫 migration。`v1.104.7` 標籤指向 [`f2a3d34`](https://github.com/BerriAI/litellm/commit/f2a3d34a6d66867abc667a124981642263ed4f4d)

### 變更內容 {#whats-changed}

- 代理程式無法連線到遠端模型成本對照表時，不再偶爾於啟動時以 `ImportError` 結束。此問題始於 `v1.104.0` - [PR #46711](https://github.com/BerriAI/litellm/pull/46711)
- Docker 映像移至較新的基礎映像，因此映像掃描不再標記 brotli 1.2.0、emSign ECC Root CA - G3，以及映像從未安裝的 repo lockfile 套件 - [PR #48280](https://github.com/BerriAI/litellm/pull/48280)

啟動修正與版本提升在 [PR #48293](https://github.com/BerriAI/litellm/pull/48293) 中回移

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.6...v1.104.7
