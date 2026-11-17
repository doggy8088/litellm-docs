---
title: "LiteLLM v1.106.8 修正部分 FLAC 檔案的轉錄成本"
description: "沒有 sample count 的 FLAC 檔案轉錄成本正確，且逐秒轉錄依提供者回報的 usage.seconds 計費。"
slug: "v1-106-8"
date: 2026-11-11T03:23:36
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
docker.litellm.ai/berriai/litellm:1.106.8
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.8
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.8`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.8) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.106.8` 是建立在 [`v1.106.7`](/release_notes/v1.106.7/v1-106-7) 之上的修補版本。沒有新的資料庫 migration。`v1.106.8` 標籤指向 [`3b9baf4`](https://github.com/BerriAI/litellm/commit/3b9baf435ebb668efacf0062f991cc00106f89a2)。

### 變更內容 {#whats-changed}

- **成本追蹤與定價：** 修正部分 FLAC 檔案不正確的轉錄成本，該問題可能使金鑰超出其預算 - [PR #50842](https://github.com/BerriAI/litellm/pull/50842)
- **成本追蹤與定價：** 逐秒轉錄改依提供者回報的 `usage.seconds` 計費，而非量測到的長度 - [PR #50727](https://github.com/BerriAI/litellm/pull/50727)

這些變更與版本提升在 [PR #50861](https://github.com/BerriAI/litellm/pull/50861) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.7...v1.106.8
