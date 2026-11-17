---
title: "LiteLLM v1.105.1 修正 SpendLogs 資料列與每日模型用量寫入"
description: "以批次寫入每日模型用量修正遭丟棄的 SpendLogs 資料列，並讓 chat 到 Responses 橋接上的大型請求只記錄一次支出。"
slug: "v1-105-1"
date: 2026-10-14T04:33:53
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Kerry Lu
    title: Software Engineer, LiteLLM
    url: https://github.com/kerrylu-berri
    image_url: https://github.com/kerrylu-berri.png
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
docker.litellm.ai/berriai/litellm:1.105.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.105.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.105.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.105.1` 是建立在 [`v1.105.0`](/release_notes/v1.105.0/v1-105-0) 之上的修補版本。它將兩個支出追蹤修正從 `main` 回移到 `stable/1.105.x`。沒有新的資料庫 migration，也沒有重大變更。`v1.105.1` 標籤指向 [`d665dc1`](https://github.com/BerriAI/litellm/commit/d665dc1a6315847fcad6cc2c1264ceb47c06abce)

## 重點摘要 {#key-highlights}

- **批次模型用量寫入**：模型排行榜彙總不再於每個請求都 upsert `LiteLLM_DailyModelUsage`，消除了大量流量集中於單一模型時丟棄 SpendLogs 資料列的資料列鎖定競爭
- **Responses 橋接上的單一支出記錄**：透過 chat 到 Responses 橋接傳送的 256 KiB 以上非串流請求，只記錄一次支出而非兩次

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 隨 `v1.105.0` 模型排行榜加入的每日模型用量彙總，會為每個請求寫入一次 `LiteLLM_DailyModelUsage` upsert。當單一模型的請求率很高時，這些 upsert 會爭奪同一資料列並佔用 Prisma 連線，導致部分 SpendLogs 資料列從未寫入。彙總資料列現在會在記憶體中排隊，並由既有的支出記錄排清工作批次寫入。請參閱 [PR #44243](https://github.com/BerriAI/litellm/pull/44243)
- chat 到 Responses 橋接上訊息為 256 KiB 以上的非串流請求，會執行兩次非同步成功記錄，寫入兩筆 SpendLogs 資料列，並將金鑰、團隊與每日支出重複計算兩次。兩個處理常式現在會在同一個記錄物件上依序執行，若第一個已完成記錄，第二個會跳過。請參閱 [PR #44508](https://github.com/BerriAI/litellm/pull/44508)

兩個修正與版本提升在 [PR #46313](https://github.com/BerriAI/litellm/pull/46313) 中一併回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- 支出 / 預算 / 速率限制：2

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.105.0...v1.105.1
