---
title: "v1.100.3 - GPT-6 請求處理與終端使用者預算重設"
slug: "v1-100-3"
date: 2026-09-25T06:21:39
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
docker.litellm.ai/berriai/litellm:1.100.3
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.100.3
```

</TabItem>
</Tabs>

此版本已發布為 [`ghcr.io/berriai/litellm:v1.100.3`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub 發行版](https://github.com/BerriAI/litellm/releases/tag/v1.100.3) 與完整的 [發行版頁面](https://github.com/BerriAI/litellm/releases)

`v1.100.3` 是在 [`v1.100.2`](/release_notes/v1.100.2/v1-100-2) 之上的修補版版本。它讓 GPT-6 模型採用與 GPT-5 相同的請求處理方式，修正終端使用者預算重設可能讓客戶卡住的兩種情況，並更新數個鎖定的相依套件。沒有任何組態變更。Docker 映像與 PyPI 套件皆由 [`385266c`](https://github.com/BerriAI/litellm/commit/385266c14d6a4cb069751fd3525692e0a760ec57) 建置

## GPT-6 模型採用 GPT-5 請求處理 {#gpt-6-models-get-gpt-5-request-handling}

像 `gpt-6-astra` 這類 GPT-6 名稱無法通過任何 GPT-5 檢查，因此被視為一般聊天模型。Chat completions 會在 `reasoning_effort`、`max_tokens` 與函式工具上回傳 400，而 Responses 與 Messages 路由則會轉送 `temperature`，這會被 OpenAI 拒絕。現在有一個 helper 同時符合 GPT-5 與 GPT-6 的名稱，仍會排除 `gpt-5-chat`，而 OpenAI chat、OpenAI Responses 以及兩種 Azure 組態都會使用它

## 終端使用者預算重設可在所有地方生效 {#end-user-budget-resets-take-effect-everywhere}

終端使用者預算重設會將資料庫中的支出歸零，但不會清除快取中的支出計數器，而且只有執行重設的 worker 會逐出其快取的終端使用者物件。請求在視窗重置後仍會持續收到 429，直到所有快取都過期為止。現在重設會將記憶體與 Redis 中的計數器歸零，並逐出快取的終端使用者，而強制執行會在快取計數器看起來過期時檢查資料庫支出

一個共享的終端使用者預算若超過約 32,700 位客戶就無法重設，因為重設工作會在單一語句中列出每個客戶 id，而 PostgreSQL 拒絕了該語句，因此那些客戶一直處於被封鎖狀態。現在終端使用者會依據其預算連結進行重設，因此語句大小會隨預算數量而非客戶數量變動

## 相依套件 {#dependencies}

鎖定檔將 anyio 更新為 4.14.2、gitpython 更新為 3.1.60、pypdf 更新為 6.16.1、soupsieve 更新為 2.9，並將 tornado 更新為 6.5.8。未變更任何宣告的相依套件範圍

### 變更內容 {#whats-changed}

- fix: 將 gpt-6 名稱在 OpenAI 與 Azure 組態中視為 gpt-5 請求家族 - [PR #39631](https://github.com/BerriAI/litellm/pull/39631)
- fix(proxy): 在預算重設時使終端使用者支出計數器與快取失效 - [PR #39729](https://github.com/BerriAI/litellm/pull/39729)
- fix(reset_budget_job): 依據預算連結重設終端使用者，而不是依據 user id - [PR #40639](https://github.com/BerriAI/litellm/pull/40639)
- chore(deps): 在鎖定檔中更新 anyio、gitpython、pypdf、soupsieve 與 tornado - [PR #43132](https://github.com/BerriAI/litellm/pull/43132)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.100.2...v1.100.3
