---
title: "v1.90.6 - Prisma 為非 root migrations 烘焙"
slug: "v1-90-6"
date: 2026-07-19T02:09:06
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
docker.litellm.ai/berriai/litellm:1.90.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.90.6
```

</TabItem>
</Tabs>

`v1.90.6` 是建立在 [`v1.90.5`](/release_notes/v1.90.5/v1-90-5) 之上的修補程式發行版本。`v1.90.5` 將 `litellm-proxy-extras` source folder 還原到 runtime images，這個版本則讓那些 migration 資產可由任何帳號使用：prisma CLI 及其 engines 現在已烘焙在 `/opt/prisma`，這是一個每個 runtime uid 都能讀取的固定路徑。以非 root 使用者執行的部署，例如 kubernetes `runAsUser` 和 `docker --user`，先前會讓 prisma 退回為將其 engines 下載到一個無法寫入的 home directory，因此在沒有對外網路存取的主機上，新的資料庫 migration 會失敗。現在 migrations 可在任何 uid 下離線執行。此版本也在 image lockfile 中帶來對 mcp、pypdf、pydantic-settings、python-multipart 與 starlette 的例行相依性維護更新。

### 有哪些變更 {#whats-changed}

- fix(docker): 將 prisma CLI 和 engines 烘焙到固定路徑，以便 fresh-DB migrations 可在離線狀態下由任何 uid 運作 - [PR #33853](https://github.com/BerriAI/litellm/pull/33853)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.90.5...v1.90.6
