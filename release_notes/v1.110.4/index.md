---
title: "LiteLLM v1.110.4 與 v1.109.5 加快受限終端使用者重新整理速度"
description: "受限終端使用者重新整理不再掃描整個終端使用者資料表，獨立 UI 映像也升級至 nginx 1.31.10 與 zlib 1.4。"
slug: "v1-110-4"
date: 2026-11-25T00:30:03
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
docker.litellm.ai/berriai/litellm:1.110.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.4
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.110.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.4) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

`v1.110.4` 是接在 [`v1.110.3`](/release_notes/v1.110.3/v1-110-3) 之上的修補版本。沒有新的資料庫遷移。遷移執行後會建立部分 `LiteLLM_EndUserTable_restricted_idx` 索引，且不會阻擋寫入。遷移任務會建立該索引，而自行執行遷移的 Proxy 則會在開始提供服務後於背景建立。`v1.110.4` 標籤指向 [`92f4055`](https://github.com/BerriAI/litellm/commit/92f40556109b96aba18581d0737c48c4f94c9c3a)。

### 變更內容 {#whats-changed}

- **部署：**修正獨立 UI 映像搭載過時的 nginx 與 zlib 的問題，現為 nginx 1.31.10 與 zlib 1.4 - [PR #54150](https://github.com/BerriAI/litellm/pull/54150)
- **效能：**改善終端使用者限制重新整理，改為僅讀取受限的客戶，而非整個終端使用者資料表 - [PR #51772](https://github.com/BerriAI/litellm/pull/51772)

這些變更已回移至 [PR #54069](https://github.com/BerriAI/litellm/pull/54069)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.3...v1.110.4
