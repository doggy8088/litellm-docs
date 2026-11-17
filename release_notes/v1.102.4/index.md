---
title: "LiteLLM v1.102.4 修復 chat 轉 Responses 橋接上的支出重複計算"
description: "修復對 openai/responses 模型的大型非串流 chat 請求支出被記錄兩次的問題，讓金鑰、團隊與每日支出符合實際成本。"
slug: "v1-102-4"
date: 2026-10-08T07:49:06
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
docker.litellm.ai/berriai/litellm:1.102.4
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.102.4
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.102.4`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.102.4) 以及完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.102.4` 是建立在 [`v1.102.3`](/release_notes/v1.102.3/v1-102-3) 之上的修補版本。它修復了大型非串流 chat 請求的支出被記錄兩次的問題。沒有新的資料庫遷移或破壞性變更。`v1.102.4` 標籤指向 [`0de9a17`](https://github.com/BerriAI/litellm/commit/0de9a178571aaaf3c96a56816e9c4734e977a315)

## Chat 轉 Responses 橋接上的支出只記錄一次 {#spend-logged-once-on-the-chat-to-responses-bridge}

自 `v1.102.0` 起，對 `openai/responses/*` 模型的大型非串流 `/v1/chat/completions` 請求會被記錄兩次。該請求在記錄頁面上顯示為兩列，而金鑰、團隊與每日支出都增加了實際成本的兩倍

- 一個請求現在只會排入恰好一筆成功記錄，且記錄的結果是提供者自身的回應
- 串流請求與成功處理常式本身維持不變

### 有什麼變更 {#whats-changed}

- 讓 chat 轉 Responses 橋接上的大型非串流請求支出只記錄一次 - [PR #44508](https://github.com/BerriAI/litellm/pull/44508)，於 [PR #45215](https://github.com/BerriAI/litellm/pull/45215) 中回移

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.102.3...v1.102.4
