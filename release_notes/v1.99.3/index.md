---
title: "v1.99.3 - Claude Code 自動模式與 TypeSafe Jev 透傳"
slug: "v1-99-3"
date: 2026-09-23T07:10:00
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
docker.litellm.ai/berriai/litellm:1.99.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.99.3
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.99.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.99.3) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.99.3` 是在 [`v1.99.2`](/release_notes/v1.99.2/v1-99-2) 之上的修補版本。它透過閘道帶來 Claude Code 自動模式，並新增 TypeSafe Jev 透傳。沒有新的資料庫遷移或破壞性變更。`v1.99.3` 標記指向 [`16923e0`](https://github.com/BerriAI/litellm/commit/16923e0e18005a8c4bd4e54b93aab7908e3a44a7)

## Claude Code 自動模式可透過閘道運作 {#claude-code-auto-mode-works-through-the-gateway}

Claude Code 自動模式會在 `safeguards` 上傳送 `/v1/messages` 欄位，並在回覆中預期 `safeguard_results`。較早的版本會捨棄該欄位，因此 `/status` 會顯示 `Auto mode server: Disabled`，而且每次工具呼叫都會退回到用戶端端的分類器

現在，proxy 會在原生 Anthropic `/v1/messages` 上原封不動地轉送 `safeguards` 與 `anthropic-beta`，並將 `safeguards` 加上 `dangerous-tool-use-2026-09-03` beta 轉送到 Bedrock Invoke 與 Vertex AI

## TypeSafe Jev 透傳 {#typesafe-jev-passthrough}

設定 `TYPESAFE_API_KEY` 後，proxy 會將 `/typesafe/*` 請求轉送至 TypeSafe、記錄它們，並追蹤其花費。會為 `typesafe/jev-latest`、`typesafe/jev-preview` 和 `typesafe/jev-1.13.0` 新增定價項目

### 有哪些變更 {#whats-changed}

- fix(anthropic): 在原生 /v1/messages 上原封不動地轉送 safeguards 與 anthropic-beta - [`9f6a6f8`](https://github.com/BerriAI/litellm/commit/9f6a6f89f1752f861c72a54330b955b128219312)
- fix(anthropic): 在 /v1/messages 上將 Claude Code safeguards 與 dangerous-tool-use beta 轉送到 Bedrock Invoke 和 Vertex - [`a631bf7`](https://github.com/BerriAI/litellm/commit/a631bf730a6a544eced982374aea0ebc6cbb0271)
- feat(typesafe): 新增具有記錄與成本追蹤的 TypeSafe Jev 透傳 - [`7d1db43`](https://github.com/BerriAI/litellm/commit/7d1db43c6883bf4ad61806547b64eef13aa36010)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.99.1...v1.99.3
