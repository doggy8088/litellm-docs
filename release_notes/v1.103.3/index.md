---
title: "v1.103.3 - 更安全的資料庫遷移、串流別名支出與依賴套件更新"
slug: "v1-103-3"
date: 2026-10-03T23:33:00
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
docker.litellm.ai/berriai/litellm:1.103.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.3
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.103.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.3) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::danger Breaking Changes

**當啟動時資料庫設定失敗時，proxy 會結束**，而不是在過時的 schema 上提供服務。設定 `ENFORCE_PRISMA_MIGRATION_CHECK=false` 可維持舊行為。請參閱 [PR #44205](https://github.com/BerriAI/litellm/pull/44205)

:::

:::warning 從 `v1.102.x` 或更早版本升級

來自 `v1.103.0` 的兩個 `LiteLLM_SpendLogs` 索引遷移現在已不執行任何操作。請在交易之外自行線上建立索引：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_api_key_startTime_idx" ON "LiteLLM_SpendLogs"("api_key", "startTime");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_litellm_call_id_idx" ON "LiteLLM_SpendLogs"("litellm_call_id");
```

:::

`v1.103.3` 是建立在 [`v1.103.2`](https://github.com/BerriAI/litellm/releases/tag/v1.103.2) 之上的修補程式版本。啟動時在資料庫設定失敗時會結束，`LiteLLM_SpendLogs` 索引遷移不再建置任何內容，透過別名的串流請求會正確計費，而基礎映像與若干依賴套件已升級。`v1.103.3` 標籤指向 [`ecae261`](https://github.com/BerriAI/litellm/commit/ecae261b100cdf6bcb1d024ae69e4efa4a891be0)

## 錯誤修正 {#bug-fixes}

透過像 `claude-opus-4.6` 這樣的帶點別名進行串流聊天完成時會記錄 $0 支出，因為定價查詢的是別名而不是部署的模型。現在串流請求會根據部署的模型計價，與非串流請求相同，而已記錄的串流回應仍會顯示別名。指向沒有定價的部署之別名，在串流請求中現在也會記錄 $0，與非串流行為一致。請參閱 [PR #44341](https://github.com/BerriAI/litellm/pull/44341)

從 Responses API 橋接過來的聊天回覆會把工具呼叫放在另一個 `choices[1]` 中，因此只讀取 `choices[0]` 的應用程式從未執行工具。`choices[0]` 現在會透過 `finish_reason: "tool_calls"` 同時包含文字與工具呼叫。請參閱 [PR #44346](https://github.com/BerriAI/litellm/pull/44346)

### 變更內容 {#whats-changed}

- 啟動時在資料庫設定失敗時會結束，且 `LiteLLM_SpendLogs` 索引遷移不再建置任何內容 - [PR #44205](https://github.com/BerriAI/litellm/pull/44205), [PR #44286](https://github.com/BerriAI/litellm/pull/44286)
- fix(proxy): 將用戶端別名標記到每個串流區塊的副本上，讓定價能看到部署模型 - [PR #44341](https://github.com/BerriAI/litellm/pull/44341)
- fix(responses): 將橋接的工具呼叫合併到與文字相同的 choice 中 - [PR #44346](https://github.com/BerriAI/litellm/pull/44346)
- 將 wolfi-base digest 升級，以納入 glibc 2.44-r6 - [PR #42643](https://github.com/BerriAI/litellm/pull/42643)
- 依賴套件升級：`pyjwt`、`pypdf`、`tornado`、`urllib3`、`gitpython`、`litellm-proxy-extras` 0.4.100.post1 - [PR #44352](https://github.com/BerriAI/litellm/pull/44352), [PR #44225](https://github.com/BerriAI/litellm/pull/44225)
- test(e2e): 將 Together 的結構化輸出與文字完成測試移到仍會回應的模型 - [PR #44437](https://github.com/BerriAI/litellm/pull/44437)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.2...v1.103.3
