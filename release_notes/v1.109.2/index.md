---
title: "LiteLLM v1.109.2 新增 Gemini 批次並修正 429 重試時的 OOM"
description: "在 /v1/batches 上新增 Gemini 批次，在 proxy 讀取請求主體前拒絕超限的金鑰，並修正 TLS 終止後方的 SSO 登入。"
slug: "v1-109-2"
date: 2026-11-19T02:37:12
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
docker.litellm.ai/berriai/litellm:1.109.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.109.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.109.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.109.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.109.2` 是接在 [`v1.109.1`](/release_notes/v1.109.1/v1-109-1) 之上的修補版本。沒有新的資料庫遷移。`v1.109.2` 標籤指向 [`fa6d80e`](https://github.com/BerriAI/litellm/commit/fa6d80e77770e862fa0e8799c123f909c0f25982)。

:::danger Breaking Changes

- **部署：**將 UI 映像上的 exec 探測從 `curl` 改為 `wget`，因為該映像不再內含 `curl` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)

:::

### 變更內容 {#whats-changed}

- **OpenAI：**修正 GPT-6.2 提示詞快取：系統提示詞傳送至 `/v1/chat/completions` 或 `/v1/messages` 並將 `store` 設為 `false` 時無法快取 - [PR #52599](https://github.com/BerriAI/litellm/pull/52599), [PR #52694](https://github.com/BerriAI/litellm/pull/52694)
- **Vertex AI 與 Gemini：**在 `/v1/batches` 上新增 Gemini 批次，可透過 `/v1/files` 下載輸出並追蹤支出 - [PR #51032](https://github.com/BerriAI/litellm/pull/51032)
- **Vertex AI 與 Gemini：**修正透過 `/gemini` 建立的 Gemini 批次記錄支出為 $0、模型為 `unknown` 的問題 - [PR #51279](https://github.com/BerriAI/litellm/pull/51279)
- **Vertex AI 與 Gemini：**修正 `reasoning_effort: "xhigh"` 在 `gemini-4-hydrogen` 上回傳 400 的問題，並新增其定價 - [PR #52060](https://github.com/BerriAI/litellm/pull/52060)
- **其他提供者：**修正 Perplexity 計費在回應沒有 `usage.cost` 時，以完整輸入費率計收快取的提示詞 token - [PR #51669](https://github.com/BerriAI/litellm/pull/51669)
- **其他提供者：**修正 `/fal_ai` 透傳價格檢查漏掉以 `/requests/..` 傳送或路徑中含有編碼 `?` 的提交 - [PR #51671](https://github.com/BerriAI/litellm/pull/51671)
- **嵌入、影像與音訊：**修正自訂影像處理器收不到 `n`、`size`、`quality`、`response_format`、`user` 或 `mask` 的問題 - [PR #52051](https://github.com/BerriAI/litellm/pull/52051)
- **批次與檔案：**修正檔案擁有權檢查無法比對同一提供者檔案 id 的其他拼法，例如 `files%2F<id>` - [PR #51498](https://github.com/BerriAI/litellm/pull/51498)
- **路由與備援：**修正串流的 `/v1/responses` 呼叫在產生任何輸出前失敗時，跳過同一模型群組重試的問題 - [PR #51953](https://github.com/BerriAI/litellm/pull/51953), [PR #52461](https://github.com/BerriAI/litellm/pull/52461)
- **金鑰、團隊與驗證：**修正遭封鎖或超限的金鑰重試大型請求時造成記憶體不足而重新啟動的問題，現在會在讀取主體前拒絕 - [PR #51428](https://github.com/BerriAI/litellm/pull/51428), [PR #51525](https://github.com/BerriAI/litellm/pull/51525), [PR #51675](https://github.com/BerriAI/litellm/pull/51675), [PR #52169](https://github.com/BerriAI/litellm/pull/52169)
- **金鑰、團隊與驗證：**修正使用 `1month`、`7days` 或 `2weeks` 等較長單位拼法的預算在每天午夜重設的問題 - [PR #51672](https://github.com/BerriAI/litellm/pull/51672)
- **金鑰、團隊與驗證：**修正自動加入預設團隊或獲派 `default_team_member_models` 的使用者，其團隊成員支出自 v1.95.0 起從未重設的問題 - [PR #51728](https://github.com/BerriAI/litellm/pull/51728), [PR #51960](https://github.com/BerriAI/litellm/pull/51960)
- **管理 UI：**修正資料庫查詢金鑰、使用者或團隊詳細資料失敗時，用量頁面回傳 500 的問題 - [PR #50253](https://github.com/BerriAI/litellm/pull/50253)
- **管理 UI：**修正 User Usage 上 Spend Per User 卡片未顯示任何使用者的問題 - [PR #49464](https://github.com/BerriAI/litellm/pull/49464)
- **管理 UI：**修正 Login with SSO 在 TLS 終止後方重新導向至 `http://` 的問題，此問題自 v1.108.0 起存在 - [PR #52213](https://github.com/BerriAI/litellm/pull/52213)
- **部署：**將 UI 映像改為 slim nginx，移除 `curl` 但保留 `wget` 與 `nc` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)
- **部署：**將 filelock、oauthlib、opentelemetry、dnspython、tornado、next、soupsieve 與 msal-node 更新至較新版本 - [PR #51712](https://github.com/BerriAI/litellm/pull/51712), [PR #52322](https://github.com/BerriAI/litellm/pull/52322), [PR #52420](https://github.com/BerriAI/litellm/pull/52420)
- **其他：**將 `/health` 錯誤改為不再包含 Python 堆疊追蹤，堆疊追蹤仍會保留在 proxy 記錄中（使用 `--detailed_debug`） - [PR #52005](https://github.com/BerriAI/litellm/pull/52005)

這些變更已回移至 [PR #51044](https://github.com/BerriAI/litellm/pull/51044)、[PR #52243](https://github.com/BerriAI/litellm/pull/52243)、[PR #52310](https://github.com/BerriAI/litellm/pull/52310)、[PR #52418](https://github.com/BerriAI/litellm/pull/52418)、[PR #52561](https://github.com/BerriAI/litellm/pull/52561)、[PR #52664](https://github.com/BerriAI/litellm/pull/52664)、[PR #52684](https://github.com/BerriAI/litellm/pull/52684) 與 [PR #52707](https://github.com/BerriAI/litellm/pull/52707)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.109.1...v1.109.2
