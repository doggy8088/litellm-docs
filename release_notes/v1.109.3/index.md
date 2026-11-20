---
title: "LiteLLM v1.109.3 與 v1.106.12 修正已儲存請求的 GPT-6.2 快取"
description: "GPT-6.2 會在 store 開啟或未設定的 Chat Completions 與 Messages 請求上快取系統提示詞，且無使用者的金鑰不再讀取彼此的金鑰資訊。"
slug: "v1-109-3"
date: 2026-11-20T03:58:13
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
docker.litellm.ai/berriai/litellm:1.109.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.109.3
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.109.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.109.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.109.3` 是接在 [`v1.109.2`](/release_notes/v1.109.2/v1-109-2) 之上的修補版本。沒有新的資料庫遷移。`v1.109.3` 標籤指向 [`37c2769`](https://github.com/BerriAI/litellm/commit/37c2769946f19d7075fe08e4da3c64b87ddc68ae)。

### 變更內容 {#whats-changed}

- **快取：**修正 GPT-6.2 系統提示詞在 `/v1/chat/completions` 與 `/v1/messages` 上，除非 `store: false` 否則無法使用提示詞快取的問題 - [PR #52906](https://github.com/BerriAI/litellm/pull/52906)
- **金鑰、團隊與驗證：**修正未設定 `jwt_issuer` 的 JWT 金鑰對應在設定 `litellm_jwtauth.issuers` 時需 5 分鐘才生效的問題，此問題自 v1.103.0 起存在 - [PR #52350](https://github.com/BerriAI/litellm/pull/52350)
- **金鑰、團隊與驗證：**修正 `/key/info` 讓沒有使用者的金鑰可透過雜湊或別名讀取其他無使用者的金鑰的問題 - [PR #52838](https://github.com/BerriAI/litellm/pull/52838) 與 [PR #52925](https://github.com/BerriAI/litellm/pull/52925)
- **部署：**將 filelock 改為 4.2.4、soupsieve 改為 4.1，以與 main 一致 - [PR #52937](https://github.com/BerriAI/litellm/pull/52937)
- **部署：**將 Docker 映像改為較新的 Wolfi 基底映像 - [PR #53008](https://github.com/BerriAI/litellm/pull/53008)

這些變更已回移至 [PR #52712](https://github.com/BerriAI/litellm/pull/52712)、[PR #52929](https://github.com/BerriAI/litellm/pull/52929) 與 [PR #52937](https://github.com/BerriAI/litellm/pull/52937)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.109.2...v1.109.3
