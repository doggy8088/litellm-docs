---
title: "LiteLLM v1.108.13 (LTS) 修正 Unix-socket Postgres 啟動與 GPT-6.2 快取"
description: "使用 Unix-socket Postgres（例如 Cloud SQL）的 proxy 可再次啟動，且 GPT-6.2 與 Claude Code 請求可保留提示詞快取。"
slug: "v1-108-13"
date: 2026-11-20T03:59:55
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

`v1.108.13` 是 1.108 LTS 線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.13
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.13
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.13`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.13) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.13` 是接在 [`v1.108.12`](/release_notes/v1.108.12/v1-108-12) 之上的修補版本。沒有新的資料庫遷移。`v1.108.13` 標籤指向 [`7af0eac`](https://github.com/BerriAI/litellm/commit/7af0eac1d15d661c690d41e554bcc749e4ec41bb)。

### 變更內容 {#whats-changed}

- **Messages API：**修正 Claude Code 輪替的計費標頭破壞提示詞快取，並在非 Anthropic 模型上膨脹輸入 token 的問題 - [PR #52922](https://github.com/BerriAI/litellm/pull/52922)
- **快取：**修正 GPT-6.2 系統提示詞在 `/v1/chat/completions` 與 `/v1/messages` 上，除非 `store: false` 否則無法使用提示詞快取的問題 - [PR #52906](https://github.com/BerriAI/litellm/pull/52906)
- **金鑰、團隊與驗證：**修正未設定 `jwt_issuer` 的 JWT 金鑰對應在設定 `litellm_jwtauth.issuers` 時需 5 分鐘才生效的問題，此問題自 v1.103.0 起存在 - [PR #52350](https://github.com/BerriAI/litellm/pull/52350)
- **金鑰、團隊與驗證：**修正 `/key/info` 讓沒有使用者的金鑰可透過雜湊或別名讀取其他無使用者的金鑰的問題 - [PR #52838](https://github.com/BerriAI/litellm/pull/52838) 與 [PR #52925](https://github.com/BerriAI/litellm/pull/52925)
- **部署：**修正 proxy 在 Unix-socket Postgres（例如 Cloud SQL）上無法啟動的問題，遷移鎖定會撥號至 `localhost:5432` - [PR #52797](https://github.com/BerriAI/litellm/pull/52797)

這些變更已回移至 [PR #52713](https://github.com/BerriAI/litellm/pull/52713)、[PR #52819](https://github.com/BerriAI/litellm/pull/52819)、[PR #52907](https://github.com/BerriAI/litellm/pull/52907) 與 [PR #52919](https://github.com/BerriAI/litellm/pull/52919)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.12...v1.108.13
