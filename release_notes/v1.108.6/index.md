---
title: "LiteLLM v1.108.6 (LTS) 修復負數花費與 Gemini 圖片編輯成本"
description: "多 pod 部署在排程預算重設後花費維持正確，Gemini 圖片編輯改依 token 計費，模型路由拒絕 Azure body 欄位。"
slug: "v1-108-6"
date: 2026-11-12T01:12:23
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

:::tip

`v1.108.6` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可維持在最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.108.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.6
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.108.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.6) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.6` 是 [`v1.108.5`](/release_notes/v1.108.5/v1-108-5) 之上的修補版本。沒有新的資料庫 migration。`v1.108.6` 標籤指向 [`65781e1`](https://github.com/BerriAI/litellm/commit/65781e15922f3a7c33b8f991adf56c11d26d0a60)。

:::danger 重大變更

- **金鑰、團隊與驗證：** 將 `tenant_id`、`client_id`、`client_secret`、`azure_username`、`azure_password` 與 `azure_scope` 請求標籤移入 `metadata` - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦包含於 [`v1.106.9`](/release_notes/v1.106.9/v1-106-9)

:::

### 變更內容 {#whats-changed}

- **OpenAI：** 修復未帶 `reasoning_effort` 的 gpt-5.4 與 gpt-5.5 函式工具呼叫被橋接到 `/v1/responses` 的問題 - [PR #50968](https://github.com/BerriAI/litellm/pull/50968)
- **Vertex AI and Gemini：** 修復 Gemini 圖片編輯以每張圖片固定價格而非依 token 計費的問題 - [PR #51038](https://github.com/BerriAI/litellm/pull/51038)
- **Chat completions：** 修復傳送 `allowed_tools` 工具選擇的 chat 與橋接 `/v1/responses` 呼叫回應 400 的問題 - [PR #50726](https://github.com/BerriAI/litellm/pull/50726)
- **MCP：** 修復 Slack 與 GitHub MCP 重新連線在提供者與 Connect 頁面之間循環的問題，此問題自 v1.107.0 起出現 - [PR #51045](https://github.com/BerriAI/litellm/pull/51045)
- **防護欄：** 變更 Zscaler AI Guard，請求時只掃描最新的使用者訊息，不再掃描整個對話 - [PR #50139](https://github.com/BerriAI/litellm/pull/50139)
- **成本追蹤與定價：** 修復資料庫在金鑰、使用者或團隊詳細資料查詢期間中斷時，使用量路由回應 500 的問題 - [PR #50253](https://github.com/BerriAI/litellm/pull/50253)
- **金鑰、團隊與驗證：** 修復多 pod 部署在排程預算重設後，金鑰、使用者與團隊花費變成負數的問題，此問題自 v1.103.0 起出現 - [PR #51120](https://github.com/BerriAI/litellm/pull/51120)
- **金鑰、團隊與驗證：** 變更模型與 pass-through 路由，拒絕 body 中的 `client_id`、`client_secret`、`tenant_id` 與 Azure 登入欄位 - [PR #51254](https://github.com/BerriAI/litellm/pull/51254)，亦包含於 [`v1.106.9`](/release_notes/v1.106.9/v1-106-9)
- **Admin UI：** 修復 `/user/daily/activity/aggregated` 上 Spend Per User 卡片空白且缺少每位使用者資料的問題 - [PR #51043](https://github.com/BerriAI/litellm/pull/51043)

這些變更的回移 PR 為 [PR #50435](https://github.com/BerriAI/litellm/pull/50435)、[PR #51064](https://github.com/BerriAI/litellm/pull/51064)、[PR #51122](https://github.com/BerriAI/litellm/pull/51122)、[PR #51229](https://github.com/BerriAI/litellm/pull/51229)、[PR #51240](https://github.com/BerriAI/litellm/pull/51240) 與 [PR #51260](https://github.com/BerriAI/litellm/pull/51260)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.5...v1.108.6
