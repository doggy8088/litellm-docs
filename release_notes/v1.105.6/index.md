---
title: "LiteLLM v1.106.5、v1.105.6、v1.104.8 與 v1.103.10 精簡遭拒請求的失敗記錄"
description: "遭拒請求的失敗記錄只保留核心請求欄位，且 GCS 記錄器使用代理程式上設定的 bucket。"
slug: "v1-105-6"
date: 2026-10-27T19:58:22
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
docker.litellm.ai/berriai/litellm:1.105.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.6
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.105.6`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.105.6) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::warning 已知的效能回歸

與 `v1.104.x` 相比，`v1.105.6` 在用戶端傳送 `Accept-Encoding: gzip` 時有已知的效能回歸；大多數 HTTP 用戶端與 OpenAI SDK 都預設傳送此標頭。代理程式會在事件迴圈上對 500 位元組以上的非串流回應進行 gzip 壓縮，這會拖慢這些請求以及同一個 worker 上的其他所有請求，包括串流與 MCP 請求。

請改升級至隨附修正的 [`v1.105.7`](/release_notes/v1.105.7/v1-105-7)。此修正在 [PR #48679](https://github.com/BerriAI/litellm/pull/48679) 中回移。

:::

`v1.105.6` 是建立在 [`v1.105.5`](/release_notes/v1.105.5/v1-105-5) 之上的修補版本。它變更遭拒請求的失敗記錄所攜帶的內容，以及 GCS 記錄器在 `stable/1.105.x` 上選取 bucket 的方式。沒有新的資料庫 migration。`v1.105.6` 標籤指向 [`3a05120`](https://github.com/BerriAI/litellm/commit/3a05120f107575d215730006c1e8299e33862aaa)

### 變更內容 {#whats-changed}

- 遭拒請求的失敗記錄只保留核心請求欄位、`tags` 與防護欄詳細資訊 - [PR #48599](https://github.com/BerriAI/litellm/pull/48599)
- GCS 記錄器使用代理程式上設定的 bucket 與憑證 - [PR #48599](https://github.com/BerriAI/litellm/pull/48599)

此變更與版本提升在 [PR #48604](https://github.com/BerriAI/litellm/pull/48604) 中回移

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.105.5...v1.105.6
