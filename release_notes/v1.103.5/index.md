---
title: "LiteLLM v1.103.5 修復 GPT-5.4 及更新版本上 chat completions 的工具呼叫"
description: "修復 GPT-5.4 及更新版本上 chat completions 的工具呼叫。工具呼叫會留在 choices[0] 上，且回覆中的每個呼叫都有自己的索引。"
slug: "v1-103-5"
date: 2026-10-17T17:02:19
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
docker.litellm.ai/berriai/litellm:1.103.5
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.5
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.5`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.5) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.5` 是建立在 [`v1.103.4`](/release_notes/v1.103.4/v1-103-4) 之上的修補版本。它修復了 LiteLLM 將 Responses API 回覆轉回 chat completion 的方式，這會影響 GPT-5.4 及更新版本以及 `responses/` 部署上帶有工具的 `/chat/completions` 呼叫。`v1.103.5` 標籤指向 [`dec1691`](https://github.com/BerriAI/litellm/commit/dec1691c90c7bf4417f7b7d956ab4b65f10728b5)

### 有什麼變更 {#whats-changed}

- 工具呼叫不再落在個別的 `choices[1]` 上，因此只讀取 `choices[0]` 的代理程式會再次執行它們 - [PR #46099](https://github.com/BerriAI/litellm/pull/46099)
- 一個非串流回覆中的多個工具呼叫現在各自擁有自己的 `index`，而不是全部都是 0 - [PR #46109](https://github.com/BerriAI/litellm/pull/46109)

這兩項修復於 [PR #46949](https://github.com/BerriAI/litellm/pull/46949) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.4...v1.103.5
