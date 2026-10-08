---
title: "v1.91.4 - Docker 遷移資產與 Prisma 內建封裝"
slug: "v1-91-4"
date: 2026-07-18T19:14:34
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
docker.litellm.ai/berriai/litellm:1.91.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.91.4
```

</TabItem>
</Tabs>

`v1.91.4` 是建立於 [`v1.91.3`](/release_notes/v1.91.3/v1-91-3) 之上的修補版本。此版本將兩項 Docker 修正回溯移植至 1.91.x 分支。第一項修正恢復了執行階段映像檔中的 `/app/litellm-proxy-extras` 原始碼目錄，讓將 `prisma migrate deploy` 指向該路徑的下游遷移作業能再次正常套用遷移，而不會在沒有結構描述的情況下靜默成功。第二項修正將 prisma CLI 與引擎預先封裝於固定路徑 `/opt/prisma`（所有執行階段 uid 皆可讀取），使全新資料庫遷移在 Kubernetes `runAsUser`、`docker --user` 以及其他無網路連線的非 root 部署環境下皆能正常運作。此版本亦包含映像檔鎖定檔中 mcp 與 soupsieve 的例行相依套件維護更新。

### 變更內容 {#whats-changed}

- fix(docker): 恢復執行階段映像檔中的 litellm-proxy-extras 原始碼目錄 - [PR #33592](https://github.com/BerriAI/litellm/pull/33592)
- fix(docker): 將 prisma CLI 與引擎封裝於固定路徑，使任何 uid 在離線環境下皆可執行全新資料庫遷移 - [PR #33853](https://github.com/BerriAI/litellm/pull/33853)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.91.3...v1.91.4
