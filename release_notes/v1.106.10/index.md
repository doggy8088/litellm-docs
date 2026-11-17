---
title: "LiteLLM v1.106.10 修正 Google MCP 伺服器重複要求登入的問題"
description: "Google MCP 伺服器在存取權杖過期時不再要求使用者重新登入，使用者可保持與其 Google MCP 工具的連線。"
slug: "v1-106-10"
date: 2026-11-14T00:34:35
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
docker.litellm.ai/berriai/litellm:1.106.10
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.10
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.10`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.10) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.106.10` 是建立在 [`v1.106.9`](/release_notes/v1.106.9/v1-106-9) 之上的修補版本。沒有新的資料庫 migration。`v1.106.10` 標籤指向 [`87aa6f7`](https://github.com/BerriAI/litellm/commit/87aa6f772d3969f5a07023e2a0af917d709861d5)。

### 變更內容 {#whats-changed}

- **MCP：** 修正 Google MCP 伺服器在存取權杖過期時要求使用者重新登入的問題 - [PR #41197](https://github.com/BerriAI/litellm/pull/41197)

此變更在 [PR #51731](https://github.com/BerriAI/litellm/pull/51731) 中回移。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.9...v1.106.10
