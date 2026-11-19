---
title: "LiteLLM v1.108.12 (LTS) 修正 GPT-6.2 快取與 Foundry 模型路由器"
description: "GPT-6.2 會再次為將 store 設為 false 的請求快取系統提示詞，Foundry 模型路由器也能在 /v1/responses 與 /v1/responses/compact 上運作。"
slug: "v1-108-12"
date: 2026-11-19T06:46:46
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

`v1.108.12` 是 1.108 LTS 線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.12
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.12
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.12`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.12) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.12` 是接在 [`v1.108.11`](/release_notes/v1.108.11/v1-108-11) 之上的修補版本。沒有新的資料庫遷移。`v1.108.12` 標籤指向 [`5f1b6e4`](https://github.com/BerriAI/litellm/commit/5f1b6e4cca27c46f55dc33282447772891ef2f6f)。

### 變更內容 {#whats-changed}

- **OpenAI：**修正 GPT-6.2 提示詞快取：系統提示詞傳送至 `/v1/chat/completions` 或 `/v1/messages` 並將 `store` 設為 `false` 時無法快取 - [PR #52599](https://github.com/BerriAI/litellm/pull/52599), [PR #52694](https://github.com/BerriAI/litellm/pull/52694)
- **Azure：**修正 Foundry `/openai/v1` 基底上的 `azure_ai/model_router` 在 `/v1/responses` 與 `/v1/responses/compact` 上失敗的問題 - [PR #52474](https://github.com/BerriAI/litellm/pull/52474)
- **Vertex AI 與 Gemini：**修正 Vertex 批次檔案中一個 `json_schema` 資料列導致其他每個資料列失敗的問題 - [PR #51790](https://github.com/BerriAI/litellm/pull/51790)
- **Messages API：**修正防護欄看到超過 64 個字元的工具名稱時，`/v1/messages` 回傳 400 `Tool reference '<name>' not found` 的問題 - [PR #47434](https://github.com/BerriAI/litellm/pull/47434)
- **Messages API：**修正 `/v1/messages` 上的 OpenAI 模型在呼叫方關閉串流後仍繼續向上游串流的問題 - [PR #52144](https://github.com/BerriAI/litellm/pull/52144)
- **防護欄：**修正 `tool_policy` 在遭封鎖的工具名稱超過 64 個字元時放行 `/v1/messages` 請求的問題 - [PR #52717](https://github.com/BerriAI/litellm/pull/52717)

這些變更已回移至 [PR #52476](https://github.com/BerriAI/litellm/pull/52476)、[PR #52621](https://github.com/BerriAI/litellm/pull/52621)、[PR #52666](https://github.com/BerriAI/litellm/pull/52666)、[PR #52725](https://github.com/BerriAI/litellm/pull/52725) 與 [PR #52739](https://github.com/BerriAI/litellm/pull/52739)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.11...v1.108.12
