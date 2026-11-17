---
title: "LiteLLM v1.106.9 轉送 ChatGPT 登入並拒絕 Azure 主體欄位"
description: "Codex 與 Pi 以個別金鑰透過閘道轉送自己的 ChatGPT 登入，且模型路由拒絕請求主體中的 Azure 登入欄位。"
slug: "v1-106-9"
date: 2026-11-12T01:06:15
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
docker.litellm.ai/berriai/litellm:1.106.9
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.9
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.9`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.9) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.106.9` 是建立在 [`v1.106.8`](/release_notes/v1.106.8/v1-106-8) 之上的修補版本。沒有新的資料庫 migration。`v1.106.9` 標籤指向 [`36742a0`](https://github.com/BerriAI/litellm/commit/36742a02ea378ba89c6b0c5833092914a66d1b18)。

:::danger 重大變更

- **金鑰、團隊與驗證：** 將 `tenant_id`、`client_id`、`client_secret`、`azure_username`、`azure_password` 與 `azure_scope` 請求標籤移入 `metadata` - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦見於 [`v1.108.6`](/release_notes/v1.108.6/v1-108-6) 與 [`v1.109.1`](/release_notes/v1.109.1/v1-109-1)

:::

### 變更內容 {#whats-changed}

- **OpenAI：** 新增以個別金鑰透過閘道轉送來自 Codex 或 Pi 的用戶端自有 ChatGPT 登入 - [PR #41522](https://github.com/BerriAI/litellm/pull/41522)
- **金鑰、團隊與驗證：** 變更模型與 pass-through 路由，拒絕主體中的 `client_id`、`client_secret`、`tenant_id` 與 Azure 登入欄位 - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦見於 [`v1.108.6`](/release_notes/v1.108.6/v1-108-6) 與 [`v1.109.1`](/release_notes/v1.109.1/v1-109-1)

這些變更在 [PR #49888](https://github.com/BerriAI/litellm/pull/49888) 與 [PR #51261](https://github.com/BerriAI/litellm/pull/51261) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.8...v1.106.9
