---
title: "LiteLLM v1.108.3 (LTS) 修正 Bedrock api_base 與大型 MCP 工具結果"
description: "修正 api_base 為空的 Bedrock 部署、超過 1 MiB 的 MCP 工具結果，以及執行兩次的模型層級 post_call 防護欄。"
slug: "v1-108-3"
date: 2026-11-07T22:29:58
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

:::tip

`v1.108.3` 是 1.108 LTS 產品線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e LITELLM_MASTER_KEY=sk-<paste-a-long-random-key> \
-e DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname> \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.108.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.3
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

`v1.108.3` 是建立在 [`v1.108.2`](/release_notes/v1.108.2/v1-108-2) 之上的修補版本。沒有新的資料庫 migration。`v1.108.3` 標籤指向 [`b7d579f`](https://github.com/BerriAI/litellm/commit/b7d579fab2818968322ef96e5b8e98dc8178fafc)。

### 變更內容 {#whats-changed}

- **AWS Bedrock：** 修正 `api_base: ""` 的 Bedrock 部署上每個請求都失敗（回應 500 或 400）的問題 - [PR #50449](https://github.com/BerriAI/litellm/pull/50449)
- **MCP：** 修正超過 1 MiB 的工具結果以 `SSE stream ended without a response` 失敗的問題，該問題自 v1.103.0 起存在 - [PR #47034](https://github.com/BerriAI/litellm/pull/47034)
- **防護欄：** 修正模型層級 `post_call` 防護欄將每個回應檢查兩次、並呼叫審核提供者兩次的問題 - [PR #50463](https://github.com/BerriAI/litellm/pull/50463)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.2...v1.108.3
