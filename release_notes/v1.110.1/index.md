---
title: "LiteLLM v1.110.1、v1.111.0rc2 與 v1.106.11 修正 GPT-6.2 提示詞快取"
description: "GPT-6.2 會再次為將 store 設為 false 的 Chat Completions 與 Messages 請求快取系統提示詞，因此重複的提示詞成本較低。"
slug: "v1-110-1"
date: 2026-11-19T03:47:43
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
docker.litellm.ai/berriai/litellm:1.110.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.110.1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.110.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.110.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.110.1` 是接在 [`v1.110.0`](/release_notes/v1.110.0/v1-110-0) 之上的修補版本。沒有新的資料庫遷移。`v1.110.1` 標籤指向 [`47b394b`](https://github.com/BerriAI/litellm/commit/47b394ba1b5bbe7f4b3f119a95b56957f4a32fad)。

:::danger Breaking Changes

- **部署：**將 UI 映像上的 exec 探測從 `curl` 改為 `wget`，因為該映像不再內含 `curl` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)

:::

### 變更內容 {#whats-changed}

- **OpenAI：**修正 GPT-6.2 提示詞快取：系統提示詞傳送至 `/v1/chat/completions` 或 `/v1/messages` 並將 `store` 設為 `false` 時無法快取 - [PR #52599](https://github.com/BerriAI/litellm/pull/52599), [PR #52694](https://github.com/BerriAI/litellm/pull/52694)
- **部署：**將 UI 映像改為 slim nginx，移除 `curl` 但保留 `wget` 與 `nc` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)
- **部署：**將 Docker 映像改為較新的 Wolfi 基底映像 - [PR #52749](https://github.com/BerriAI/litellm/pull/52749)

這些變更已回移至 [PR #52595](https://github.com/BerriAI/litellm/pull/52595) 與 [PR #52658](https://github.com/BerriAI/litellm/pull/52658)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.110.0...v1.110.1
