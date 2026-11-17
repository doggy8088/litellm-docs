---
title: "LiteLLM v1.104.9 與 v1.103.11 加快 Logs 檢視中的請求查詢"
description: "建立部分安裝在 migration 後缺少的支出記錄索引，讓 Logs 檢視在大型支出記錄表上的請求查詢保持快速。"
slug: "v1-104-9"
date: 2026-11-10T20:29:03
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
docker.litellm.ai/berriai/litellm:1.104.9
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.9
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.104.9`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.104.9) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.104.9` 是建立在 [`v1.104.8`](/release_notes/v1.104.8/v1-104-8) 之上的修補版本。沒有新的資料庫 migration。兩個 `LiteLLM_SpendLogs` 索引 migration 維持 no-op，索引現在改於 migration 執行後建立。migration 工作會建立這些索引；自行執行 migration 的代理程式則會在開始提供服務後於背景建立。`v1.104.9` 標籤指向 [`8aa2ffb`](https://github.com/BerriAI/litellm/commit/8aa2ffb6377e35b7e5e5c3a091f8bc944e006a4a)。

### 變更內容 {#whats-changed}

- **記錄與可觀測性：** 透過在 migration 後建立任何缺少的索引，改善大型支出記錄表上 Logs 檢視的請求查詢 - [PR #43948](https://github.com/BerriAI/litellm/pull/43948)、[PR #44109](https://github.com/BerriAI/litellm/pull/44109)、[PR #44203](https://github.com/BerriAI/litellm/pull/44203)

這些變更在 [PR #50823](https://github.com/BerriAI/litellm/pull/50823) 中回移，版本提升則在 [PR #50985](https://github.com/BerriAI/litellm/pull/50985) 中。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.8...v1.104.9
