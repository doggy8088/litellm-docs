---
title: "LiteLLM v1.110.1、v1.111.0rc2 與 v1.106.11 修正 GPT-6.2 提示詞快取"
description: "GPT-6.2 會再次為將 store 設為 false 的 Chat Completions 與 Messages 請求快取系統提示詞，因此重複的提示詞成本較低。"
slug: "v1-111-0-rc-2"
date: 2026-11-19T05:39:25
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
docker.litellm.ai/berriai/litellm:1.111.0-rc.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.111.0rc2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.111.0-rc.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.111.0-rc.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.111.0rc2` 是接在 [`v1.111.0rc1`](/release_notes/v1.111.0rc1/v1-111-0-rc-1) 之上的發佈候選版。沒有新的資料庫遷移。`v1.111.0-rc.2` 標籤指向 [`e527244`](https://github.com/BerriAI/litellm/commit/e527244920133c7ed97b45dc5b0bf6f18e7b524c)。

### 變更內容 {#whats-changed}

- **OpenAI：**修正 GPT-6.2 提示詞快取：系統提示詞傳送至 `/v1/chat/completions` 或 `/v1/messages` 並將 `store` 設為 `false` 時無法快取 - [PR #52599](https://github.com/BerriAI/litellm/pull/52599), [PR #52694](https://github.com/BerriAI/litellm/pull/52694)

此變更已透過 [PR #52657](https://github.com/BerriAI/litellm/pull/52657) 回移。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.111.0-rc.1...v1.111.0-rc.2
