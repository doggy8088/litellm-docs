---
title: "LiteLLM v1.104.9 與 v1.103.11 加快 Logs 檢視中的請求查詢"
description: "建置某些安裝在遷移後缺少的支出記錄索引，讓 Logs 檢視的查詢保持快速，並改善副本同時啟動時的啟動行為。"
slug: "v1-103-11"
date: 2026-11-10T20:24:40
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
docker.litellm.ai/berriai/litellm:1.103.11
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.11
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.11`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.11) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.103.11` 是建立在 [`v1.103.10`](/release_notes/v1.103.10/v1-103-10) 之上的修補版本。沒有新的資料庫遷移。兩個 `LiteLLM_SpendLogs` 索引遷移維持為 no-op，而索引現在會在遷移執行後建置。遷移作業會建置它們，而自行執行遷移的 proxy 會在開始提供服務後於背景建置它們。`v1.103.11` 標籤指向 [`6061a83`](https://github.com/BerriAI/litellm/commit/6061a83a2774e1f22f9b4cbdcff8058b328084aa)。

### 有什麼變更 {#whats-changed}

- **記錄與可觀測性：** 透過在遷移後建置任何缺少的索引，改善大型支出記錄表格上 Logs 檢視的請求查詢 - [PR #43948](https://github.com/BerriAI/litellm/pull/43948)、[PR #44109](https://github.com/BerriAI/litellm/pull/44109)、[PR #44203](https://github.com/BerriAI/litellm/pull/44203)、[PR #46131](https://github.com/BerriAI/litellm/pull/46131)
- **部署：** 改善多個副本同時對同一個資料庫啟動時的啟動可靠性 - [PR #40932](https://github.com/BerriAI/litellm/pull/40932)、[PR #44283](https://github.com/BerriAI/litellm/pull/44283)

這些變更於 [PR #50856](https://github.com/BerriAI/litellm/pull/50856) 中回移，版本提升則在 [PR #50984](https://github.com/BerriAI/litellm/pull/50984) 中。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.10...v1.103.11
