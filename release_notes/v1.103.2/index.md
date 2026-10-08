---
title: "v1.103.2 - Claude Code 自動模式、CLI 工作階段支出與轉送修正"
slug: "v1-103-2"
date: 2026-10-01T06:37:00
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
docker.litellm.ai/berriai/litellm:1.103.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.103.2
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.103.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 的形式發布。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.103.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

:::info 升級

相較於 [`v1.103.1`](/release_notes/v1.103.1/v1-103-1)，沒有新增資料庫遷移或破壞性變更。如果您是從 `v1.103.0` 或更早版本升級，請先閱讀 `v1.103.1` notes 中的破壞性變更：Admin UI 與 `lite` CLI 使用者在升級後需要再次登入，且從 `v1.102.x` 或更早版本升級會在 `LiteLLM_SpendLogs` 上新增索引

:::

:::warning `lite` CLI 使用者必須重新登入

適用於您是從早於 `v1.103.1` 的版本升級的情況。升級 proxy 後，每位 `lite` CLI 使用者都必須再次執行 `lite login`。在此之前，CLI 會持續傳送舊的 session token，而其對 proxy 的請求會失敗

:::

`v1.103.2` 是在 [`v1.103.1`](https://github.com/BerriAI/litellm/releases/tag/v1.103.1) 之上的修補版本。它將 Claude Code 自動模式透過 gateway 帶入，將 CLI 工作階段支出歸屬給其背後的使用者，並恢復 `v1.103.0` 所變更的 pass-through endpoint 處理方式。`v1.103.2` 標籤指向 [`f69b210`](https://github.com/BerriAI/litellm/commit/f69b2103dfc0f7a41f65555fd66df05274584e5a)

## Claude Code 自動模式可透過閘道運作 {#claude-code-auto-mode-works-through-the-gateway}

Claude Code 自動模式會在 `safeguards` 上送出 `/v1/messages` 欄位，並預期在回覆中收到 `safeguard_results`。較早的版本會丟失該欄位，因此 `/status` 會顯示 `Auto mode server: Disabled`，而且每次工具呼叫都會回退到用戶端分類器

proxy 現在會在原生 Anthropic `/v1/messages` 上原樣轉送 `safeguards` 與 `anthropic-beta`，並將 `safeguards` 加上 `dangerous-tool-use-2026-09-03` beta 轉送到 Bedrock Invoke 與 Vertex AI。Azure AI Foundry 也獲得相同的 passthrough；只要請求帶有 `safeguards`，就會一併加入 beta，因為 Foundry 若沒有它就會拒絕 `safeguards`

## CLI 工作階段支出已歸因於使用者 {#cli-session-spend-is-attributed-to-the-user}

來自 `litellm-proxy login` 工作階段的支出會在 `/user/daily/activity/aggregated` 中以一個 64 字元雜湊顯示，並附帶 `null` `key_alias` 與 `user_email`。在繁忙的日子裡，這些雜湊的名稱查詢也可能碰到 statement timeout 而沒有任何回傳

新的 CLI 工作階段支出現在會記錄在每位使用者的 `cli-session-<user_id>` alias 下。升級前寫入的雜湊會從每日支出列中找回其擁有者，而 key name 查詢每個 key 最多只會讀取兩列支出記錄，因此在大型支出表上不再會逾時

## 通過端點已回到 `v1.103.0` 前的處理方式 {#pass-through-endpoints-are-back-to-their-pre-v11030-handling}

在 `STORE_MODEL_IN_DB=true` 下，`v1.103.0` 讓 config file 擁有 `general_settings.pass_through_endpoints`。這破壞了三件事：帶有 `forward_headers: true` 的 config pass-through 不再轉送 `Authorization`，在 config 宣告任何 pass-through 後，於 Admin UI 中建立、更新或刪除 pass-through 會遭到拒絕，而 `os.environ/` 目標會在未解析的情況下送往上游並回傳 500

config 與 DB pass-through 會再次在每次 DB sync 與 config reload 時合併，在 Admin UI 中儲存的 pass-through 會立刻開始與 config 中的項目並行提供服務，而轉送的 headers 會原樣送達後端。如果您的 config 宣告了 pass-through，DB 中儲存在其他路徑的任何 pass-through 會在升級後重新開始提供服務，就如同 `v1.103.0` 之前一樣

### 有哪些變更 {#whats-changed}

- fix(anthropic): 在原生 /v1/messages 上原樣轉送 safeguards 與 anthropic-beta - [PR #42152](https://github.com/BerriAI/litellm/pull/42152)
- fix(anthropic): 在 /v1/messages 上將 Claude Code safeguards 與 dangerous-tool-use beta 轉送到 Bedrock Invoke 與 Vertex - [PR #42288](https://github.com/BerriAI/litellm/pull/42288)
- fix(anthropic): 將 dangerous-tool-use beta 轉送到 Azure AI Foundry - [`44115c5`](https://github.com/BerriAI/litellm/commit/44115c5f2b914e562b91823390bbc26f0c93867d)
- fix(azure_ai): 當 Foundry 收到 safeguards 時，加入 dangerous-tool-use beta - [`3b00260`](https://github.com/BerriAI/litellm/commit/3b00260b869bcc56d099c4d867e26a9b88ca3f0a)
- fix(spend): 將 CLI 工作階段支出歸屬到每位使用者的 cli-session alias，而不是雜湊後的 session token - [PR #40541](https://github.com/BerriAI/litellm/pull/40541)
- fix(proxy): 從每日支出中還原 session key 擁有者以進行使用量歸屬 - [PR #43642](https://github.com/BerriAI/litellm/pull/43642)
- fix(proxy): 以每個 key 兩列支出記錄來查詢雜湊 key 名稱 - [PR #43656](https://github.com/BerriAI/litellm/pull/43656)
- fix(proxy): 恢復 config-wins 之前的 pass-through endpoint 處理方式 - [PR #43962](https://github.com/BerriAI/litellm/pull/43962)
- chore(release): 將 litellm-enterprise 0.1.69 -> 0.1.69.post1 提升至 stable/1.103.x - [`fe87252`](https://github.com/BerriAI/litellm/commit/fe872527f135acd6f0935e6554623b0ec9f95f22)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.1...v1.103.2
