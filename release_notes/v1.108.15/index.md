---
title: "LiteLLM v1.108.15 (LTS) 新增 ResetData 並修正 Cohere v2 聊天參數"
description: "ResetData 成為新的提供者，Cohere v2 聊天接受 tool_choice、reasoning_effort 與 json_schema，Groq 與 Meta 轉錄開始記錄花費。"
slug: "v1-108-15"
date: 2026-11-21T21:34:14
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

`v1.108.15` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.15
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.15
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.15`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.15) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

:::danger[重大變更]

**在無金鑰的 JSON 設定部署上設定 `api_key` 或提供者的金鑰環境變數，否則現在會收到 401。**請參閱 [PR #50819](https://github.com/BerriAI/litellm/pull/50819)。

:::

`v1.108.15` 是 [`v1.108.14`](/release_notes/v1.108.14/v1-108-14) 之上的修補版本。沒有新的資料庫遷移。`v1.108.15` 標籤指向 [`43d4823`](https://github.com/BerriAI/litellm/commit/43d48236dc67b1a48629a85c4b727e2f088fc344)。

### 變更內容 {#whats-changed}

- **其他提供者：**新增 ResetData 提供者，並修正 Groq 與 Meta 轉錄花費為 $0 的問題 - [PR #50819](https://github.com/BerriAI/litellm/pull/50819)
- **其他提供者：**修正 Cohere v2 串流工具呼叫以單一空白區塊送達的問題 - [PR #47794](https://github.com/BerriAI/litellm/pull/47794)
- **其他提供者：**修正 Cohere v2 聊天忽略 `tool_choice`，並對 `reasoning_effort` 與 `json_schema` `response_format` 回傳 400 的問題 - [PR #50834](https://github.com/BerriAI/litellm/pull/50834)

這些變更已回溯移植於 [PR #51851](https://github.com/BerriAI/litellm/pull/51851) 與 [PR #53314](https://github.com/BerriAI/litellm/pull/53314)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.14...v1.108.15
