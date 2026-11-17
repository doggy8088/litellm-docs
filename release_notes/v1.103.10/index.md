---
title: "LiteLLM v1.106.5、v1.105.6、v1.104.8 與 v1.103.10 精簡被拒請求的失敗記錄"
description: "被拒請求的失敗記錄只保留核心請求欄位，且 GCS 記錄器使用 proxy 上設定的 bucket。"
slug: "v1-103-10"
date: 2026-10-27T19:55:55
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
docker.litellm.ai/berriai/litellm:1.103.10
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.10
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.103.10`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.10) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.103.10` 是建立在 [`v1.103.9`](/release_notes/v1.103.9/v1-103-9) 之上的修補版本。它變更了被拒請求的失敗記錄所攜帶的內容，以及 `stable/1.103.x` 上 GCS 記錄器挑選 bucket 的方式。沒有新的資料庫遷移。`v1.103.10` 標籤指向 [`b3287e3`](https://github.com/BerriAI/litellm/commit/b3287e3972c7aeb5c8015878a9b035caadf71fb9)

### 有什麼變更 {#whats-changed}

- 被拒請求的失敗記錄只保留核心請求欄位、`tags` 與防護欄詳細資訊 - [PR #48599](https://github.com/BerriAI/litellm/pull/48599)
- GCS 記錄器使用 proxy 上設定的 bucket 與憑證 - [PR #48599](https://github.com/BerriAI/litellm/pull/48599)

此變更與版本提升於 [PR #48602](https://github.com/BerriAI/litellm/pull/48602) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.9...v1.103.10
