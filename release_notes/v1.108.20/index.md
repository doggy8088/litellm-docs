---
title: "LiteLLM v1.108.20（LTS）修正已取消 Responses 計費與 GET /audit"
description: "已取消的 OpenAI 與 Azure Responses 串流改按提供者的用量計費，稽核記錄在團隊或金鑰更新後不再回傳 500。"
slug: "v1-108-20"
date: 2026-11-27T21:36:11
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

`v1.108.20` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤一律指向最新的 LTS 版本，因此請拉取 `docker.litellm.ai/berriai/litellm:lts` 以保持在最新的 LTS 修補版本。請參閱 [LTS 試點](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.20
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.20
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.20`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.20) 與完整的 [releases 頁面](https://github.com/BerriAI/litellm/releases)。

`v1.108.20` 是接在 [`v1.108.19`](/release_notes/v1.108.19/v1-108-19) 之上的修補版本。沒有新的資料庫遷移。`v1.108.20` 標籤指向 [`5c65758`](https://github.com/BerriAI/litellm/commit/5c65758917e58473aefff2af03b897a510dec164)。

### 變更內容 {#whats-changed}

- **Anthropic：**修正非字串 `tool_call_id` 的工具訊息傳到 Anthropic 而未回傳 400 的問題，此問題自 v1.108.19 起存在 - [PR #54736](https://github.com/BerriAI/litellm/pull/54736)
- **Responses API：**修正已取消的 OpenAI 與 Azure `/v1/responses` 串流計費為零或僅為估算值、而非提供者用量的問題 - [PR #54755](https://github.com/BerriAI/litellm/pull/54755) 與 [PR #54772](https://github.com/BerriAI/litellm/pull/54772)
- **金鑰、團隊與驗證：**修正團隊或金鑰更新後 `GET /audit` 回傳 500 的問題，包含升級前儲存的資料列 - [PR #50929](https://github.com/BerriAI/litellm/pull/50929) 與 [PR #53305](https://github.com/BerriAI/litellm/pull/53305)

稽核記錄的變更已回移至 [PR #53262](https://github.com/BerriAI/litellm/pull/53262)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.19...v1.108.20
