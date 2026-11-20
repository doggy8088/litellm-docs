---
title: "LiteLLM v1.109.3 與 v1.106.12 修正已儲存請求的 GPT-6.2 快取"
description: "GPT-6.2 會在 store 開啟或未設定的 Chat Completions 與 Messages 請求上快取系統提示詞，且無使用者的金鑰不再讀取彼此的金鑰資訊。"
slug: "v1-106-12"
date: 2026-11-20T05:51:21
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
docker.litellm.ai/berriai/litellm:1.106.12
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.12
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.12`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.12) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.106.12` 是接在 [`v1.106.11`](/release_notes/v1.106.11/v1-106-11) 之上的修補版本。沒有新的資料庫遷移。`v1.106.12` 標籤指向 [`c6dd3dd`](https://github.com/BerriAI/litellm/commit/c6dd3dd3288dc52c24f2ecf028a3ab9bc8057854)。

### 變更內容 {#whats-changed}

- **快取：**修正 GPT-6.2 系統提示詞在 `/v1/chat/completions` 與 `/v1/messages` 上，除非 `store: false` 否則無法使用提示詞快取的問題 - [PR #52906](https://github.com/BerriAI/litellm/pull/52906)
- **金鑰、團隊與驗證：**修正 `/key/info` 讓沒有使用者的金鑰可透過雜湊或別名讀取其他無使用者的金鑰的問題 - [PR #52838](https://github.com/BerriAI/litellm/pull/52838) 與 [PR #52925](https://github.com/BerriAI/litellm/pull/52925)
- **部署：**將 dnspython、tornado、filelock、soupsieve 與 opentelemetry 更新至較新版本 - [PR #52936](https://github.com/BerriAI/litellm/pull/52936) 與 [PR #53032](https://github.com/BerriAI/litellm/pull/53032)
- **部署：**將 Docker 映像改為較新的 Wolfi 基底映像 - [PR #53033](https://github.com/BerriAI/litellm/pull/53033)

這些變更已回移至 [PR #52924](https://github.com/BerriAI/litellm/pull/52924) 與 [PR #52936](https://github.com/BerriAI/litellm/pull/52936)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.11...v1.106.12
