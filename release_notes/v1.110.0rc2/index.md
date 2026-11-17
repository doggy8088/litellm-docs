---
title: "LiteLLM v1.109.1 與 v1.110.0rc2 拒絕 body 中的 Azure 登入欄位"
description: "模型與 pass-through 路由拒絕請求 body 中的 client_id、client_secret、tenant_id 與 Azure 登入欄位，請將這些標籤移入 metadata。"
slug: "v1-110-0-rc-2"
date: 2026-11-12T02:53:14
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
docker.litellm.ai/berriai/litellm:1.110.0-rc.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.0rc2
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.110.0-rc.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.0-rc.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

發佈的 GitHub 標籤為 `v1.110.0-rc.2`。本說明將其與 `v1.110.0-rc.1`（`rc/1.110.0` 上的前一個候選版本）比較。這是一個小型 rc 修補版本，只有一個變更回移到 rc 分支，其餘皆與 `v1.110.0-rc.1` 相同；完整的 1.110 系列請參閱其 [release notes](/release_notes/v1.110.0rc1/v1-110-0-rc-1)。沒有新的資料庫 migration。`v1.110.0-rc.2` 標籤指向 [`bf3cb0c`](https://github.com/BerriAI/litellm/commit/bf3cb0cd7bd46310142940a88d2cc32912c1bb66)。

:::danger 重大變更

- **金鑰、團隊與驗證：** 將 `tenant_id`、`client_id`、`client_secret`、`azure_username`、`azure_password` 與 `azure_scope` 請求標籤移入 `metadata` - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦包含於 [`v1.106.9`](/release_notes/v1.106.9/v1-106-9)、[`v1.108.6`](/release_notes/v1.108.6/v1-108-6) 與 [`v1.109.1`](/release_notes/v1.109.1/v1-109-1)

:::

### 變更內容 {#whats-changed}

- **金鑰、團隊與驗證：** 變更模型與 pass-through 路由，拒絕 body 中的 `client_id`、`client_secret`、`tenant_id` 與 Azure 登入欄位 - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦包含於 [`v1.106.9`](/release_notes/v1.106.9/v1-106-9)、[`v1.108.6`](/release_notes/v1.108.6/v1-108-6) 與 [`v1.109.1`](/release_notes/v1.109.1/v1-109-1)

此變更已透過 [PR #51263](https://github.com/BerriAI/litellm/pull/51263) 回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.0-rc.1...v1.110.0-rc.2
