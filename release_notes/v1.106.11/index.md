---
title: "LiteLLM v1.110.1、v1.111.0rc2 與 v1.106.11 修正 GPT-6.2 提示快取"
description: "GPT-6.2 再次為將 store 設為 false 的 Chat Completions 與 Messages 請求快取系統提示，因此重複提示的成本更低。"
slug: "v1-106-11"
date: 2026-11-19T06:34:51
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
docker.litellm.ai/berriai/litellm:1.106.11
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.11
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.11`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.11) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.106.11` 是建立在 [`v1.106.10`](/release_notes/v1.106.10/v1-106-10) 之上的修補版發行。沒有新的資料庫遷移。`v1.106.11` 標籤指向 [`c6ad936`](https://github.com/BerriAI/litellm/commit/c6ad936242c32ae8c30de62e754c8a4904db04c3)。

### 變更內容 {#whats-changed}

- **OpenAI:** 修正 GPT-6.2 提示快取，適用於傳送至 `/v1/chat/completions` 或 `/v1/messages` 且 `store: false` 的系統提示 - [PR #52599](https://github.com/BerriAI/litellm/pull/52599) 與 [PR #52694](https://github.com/BerriAI/litellm/pull/52694)

此變更已回補至 [PR #52665](https://github.com/BerriAI/litellm/pull/52665)、[PR #52698](https://github.com/BerriAI/litellm/pull/52698) 與 [PR #52738](https://github.com/BerriAI/litellm/pull/52738)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.10...v1.106.11
