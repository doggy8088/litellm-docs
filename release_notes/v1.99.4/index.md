---
title: "v1.99.4 - 最終使用者預算重設與 GPT-6 請求對應"
slug: "v1-99-4"
date: 2026-09-25T06:20:00
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
docker.litellm.ai/berriai/litellm:1.99.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.99.4
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.99.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub 發行版](https://github.com/BerriAI/litellm/releases/tag/v1.99.4) 與完整的 [發行版頁面](https://github.com/BerriAI/litellm/releases)

`v1.99.4` 是在 [`v1.99.3`](/release_notes/v1.99.3/v1-99-3) 之上的修補版。它修正了最終使用者預算重設，並將 GPT-6 模型名稱對應到 GPT-5 請求系列。沒有新的資料庫遷移或破壞性變更。`v1.99.4` 標籤指向 [`b6f084f`](https://github.com/BerriAI/litellm/commit/b6f084fc486707527d86458ec4ba07ced7942953)

## 最終使用者預算重設 {#end-user-budget-resets}

一個共享預算若有超過約 32,700 名最終使用者，重設就永遠不會執行，因為重設工作在單一語句中列出每位最終使用者的 id，而 Postgres 拒絕了它，所以那些最終使用者一直被封鎖。現在，該工作會依據最終使用者與其預算的連結來重設。重設也會將記憶體與 Redis 中快取的最終使用者支出計數器歸零，因此每個複本上的請求會在視窗一過期就開始收到 429，而不是等到快取過期後才會

## GPT-6 模型名稱使用 GPT-5 請求系列 {#gpt-6-model-names-use-the-gpt-5-request-family}

OpenAI 與 Azure 設定現在會將 `gpt-6` 模型名稱視為 `gpt-5`，因此它們會使用相同的請求參數處理方式。lockfile 也更新了 anyio、gitpython 和 soupsieve

### 變更內容 {#whats-changed}

- fix: 在 OpenAI 與 Azure 設定中將 gpt-6 名稱視為 gpt-5 請求系列 - [PR #39631](https://github.com/BerriAI/litellm/pull/39631)
- fix(proxy): 在預算重設時使最終使用者支出計數器與快取失效 - [PR #39729](https://github.com/BerriAI/litellm/pull/39729)
- fix(reset_budget_job): 依據預算連結而非使用者 id 重設最終使用者 - [PR #40639](https://github.com/BerriAI/litellm/pull/40639)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.99.3...v1.99.4
