---
title: "v1.101.2 - Bedrock Invoke 串流與終端使用者預算重設"
slug: "v1-101-2"
date: 2026-09-24T00:17:20
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
docker.litellm.ai/berriai/litellm:1.101.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.101.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.101.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.101.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.101.2` 是在 [`v1.101.1`](/release_notes/v1.101.1/v1-101-1) 之上的修補版本。它可防止 Bedrock Invoke 上的 `/v1/messages` 串流停滯，並修正大型共享預算的終端使用者預算重設問題。沒有設定變更。Docker 映像與 PyPI 套件皆由 [`ccb327f`](https://github.com/BerriAI/litellm/commit/ccb327f032c69754445763dbec669a5d2517630c) 建置

## Bedrock Invoke 在 /v1/messages 上的串流不再停滯 {#bedrock-invoke-streams-on-v1messages-no-longer-stall}

Bedrock Invoke 上的 `/v1/messages` 會將上游位元組保留在 1024 位元組緩衝區中，因此當 Bedrock 在串流中途暫停時，完整事件就會卡在其中。Claude Code 在模型寫入大型檔案時會顯示無聲串流。現在 Bedrock 位元組會直接通過，與 chat completions 的 Bedrock 路徑先前的運作方式相同

## 大型共享終端使用者預算再次重設 {#large-shared-end-user-budgets-reset-again}

超過約 32,700 位客戶的共享終端使用者預算從未重設，因為重設作業在一個語句中列出每個客戶 id，而 PostgreSQL 拒絕了它，因此那些客戶一直處於封鎖狀態。現在終端使用者會依其預算連結重設，因此語句大小會隨預算數量而非客戶數量變化

### 有什麼變更 {#whats-changed}

- fix(bedrock): 讓 /v1/messages Invoke 位元組以串流方式通過，而不是將它們保留在 1024 位元組分塊器中 - [PR #42607](https://github.com/BerriAI/litellm/pull/42607)
- fix(reset_budget_job): 依預算連結重設終端使用者，而非依使用者 id - [PR #40639](https://github.com/BerriAI/litellm/pull/40639)

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.101.1...v1.101.2
