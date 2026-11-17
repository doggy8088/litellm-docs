---
title: "LiteLLM v1.104.1、v1.103.4 與 v1.102.3 將 pgbouncer 更新至 1.26.0"
description: "將 pgbouncer 更新至 1.26.0，使映像能以 OpenSSL 4.0 建置，並更新 langgraph-sdk、mako、werkzeug 與管理介面的 next 套件。"
slug: "v1-102-3"
date: 2026-10-07T18:50:10
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
docker.litellm.ai/berriai/litellm:1.102.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.102.3
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.102.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.102.3) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.102.3` 是建立在 [`v1.102.2`](/release_notes/v1.102.2/v1-102-2) 之上的修補版本。它更新鎖定版的 Python 與管理介面相依套件、wolfi-base 映像摘要，以及 Docker 映像內附的 pgbouncer。沒有新的資料庫遷移或破壞性變更。`v1.102.3` 標籤指向 [`d174b05`](https://github.com/BerriAI/litellm/commit/d174b05cd104bcb1434eb083c44fbe4d466eaa37)

## pgbouncer 1.26.0 {#pgbouncer-1260}

Docker 映像會從原始碼建置 pgbouncer。Wolfi 的 `openssl-dev` 套件現在安裝 OpenSSL 4.0，而 pgbouncer 1.25.2 無法以其編譯，因此本系列的映像建置停止運作。內附的 pgbouncer 現在為 1.26.0，與 `main` 提供的版本相同，能以 OpenSSL 4.0 建置並執行

## 相依套件更新 {#dependency-updates}

- Python：`fsspec` 2026.4.0 至 2026.6.0、`gitpython` 3.1.61 至 3.1.62、`langgraph-sdk` 0.4.2 至 0.4.4、`mako` 1.3.12 至 1.4.2、`multidict` 6.7.1 至 6.9.1、`oauthlib` 3.3.1 至 4.0.0、`pyjwt` 2.13.0 至 2.15.0、`pypdf` 6.16.2 至 6.19.0、`tornado` 6.5.8 至 6.5.9、`urllib3` 2.7.0 至 2.8.0 以及 `werkzeug` 3.1.8 至 3.1.9
- 管理介面：`next` 16.3.3 至 16.3.6、`moment` 2.30.1 至 2.31.0 以及 `brace-expansion` 5.0.9 至 5.0.12，連同隨之而來的傳遞性鎖定檔更新
- 基礎映像：wolfi-base 摘要向前推進，以取得 glibc 2.44-r6

### 有什麼變更 {#whats-changed}

- 更新鎖定版 Python 與管理介面相依套件 - [PR #44775](https://github.com/BerriAI/litellm/pull/44775)
- 提升 wolfi-base 摘要以取得 glibc 2.44-r6 - [PR #44805](https://github.com/BerriAI/litellm/pull/44805)
- 將內附的 pgbouncer 提升至 1.26.0 - [PR #45010](https://github.com/BerriAI/litellm/pull/45010)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.102.2...v1.102.3
