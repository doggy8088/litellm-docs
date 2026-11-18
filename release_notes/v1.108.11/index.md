---
title: "LiteLLM v1.108.11 (LTS) 修正 429 重試時的 OOM 與 TLS 後方的 SSO"
description: "Proxy 在讀取請求主體前即拒絕遭封鎖與超限的金鑰，SSO 登入在 TLS 終止後方也可再次運作。"
slug: "v1-108-11"
date: 2026-11-17T22:29:13
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

`v1.108.11` 是 1.108 LTS 線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.11
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.11
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.11`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.11) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.11` 是接在 [`v1.108.10`](/release_notes/v1.108.10/v1-108-10) 之上的修補版本。沒有新的資料庫遷移。`v1.108.11` 標籤指向 [`c50d78d`](https://github.com/BerriAI/litellm/commit/c50d78dfb2387d04c443d2ffec7a665e9c28f4fb)。

:::danger Breaking Changes

- **金鑰、團隊與驗證：**請由 proxy 管理員設定團隊模型上的 `os.environ/` 值，因為團隊管理員現在會收到 403 - [PR #51874](https://github.com/BerriAI/litellm/pull/51874)
- **部署：**將 UI 映像上的 exec 探測從 `curl` 改為 `wget`，因為該映像不再內含 `curl` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)

:::

### 變更內容 {#whats-changed}

- **Azure：**修正將 `reasoning_effort` 傳送至 `azure_ai` 上的 DeepSeek V4 Flash 與 Pro 時回傳 400 的問題 - [PR #52070](https://github.com/BerriAI/litellm/pull/52070)
- **AWS Bedrock：**修正系統與助理訊息中的 `guarded_text` 部分遭丟棄、而未由防護欄檢查的問題 - [PR #51776](https://github.com/BerriAI/litellm/pull/51776)
- **AWS Bedrock：**修正 `/v1/messages` 上已中止的 Invoke 串流仍在上游繼續產生計費輸出 token 的問題 - [PR #52210](https://github.com/BerriAI/litellm/pull/52210)
- **Vertex AI 與 Gemini：**修正聊天記錄中有引數為 null 或遭截斷的較早工具呼叫時回傳 500 的問題 - [PR #50020](https://github.com/BerriAI/litellm/pull/50020)
- **Vertex AI 與 Gemini：**修正將 `reasoning_effort: "xhigh"` 傳送至 `gemini-4-hydrogen` 時回傳 400 的問題 - [PR #52060](https://github.com/BerriAI/litellm/pull/52060)
- **其他提供者：**修正 Cohere 嵌入忽略 `COHERE_API_BASE`、一律呼叫 api.cohere.ai 的問題 - [PR #52194](https://github.com/BerriAI/litellm/pull/52194)
- **其他提供者：**修正 OpenRouter 串流在 `finish_reason: stop` 之後傳送空 choice、導致嚴格用戶端出錯的問題 - [PR #52200](https://github.com/BerriAI/litellm/pull/52200)
- **聊天補全：**修正 LiteLLM 自身的 MCP 與 `fake_stream` 參數進入提供者請求主體、造成 400 的問題 - [PR #52225](https://github.com/BerriAI/litellm/pull/52225)
- **Responses API：**修正 `allowed_openai_params` 為字串或 tuple 時，`/v1/responses` 回傳 500 的問題 - [PR #52203](https://github.com/BerriAI/litellm/pull/52203)
- **Messages API：**修正串流 thinking 區塊結束時缺少 `signature_delta`、導致用戶端在下一個工具步驟丟棄它們的問題 - [PR #52117](https://github.com/BerriAI/litellm/pull/52117)
- **嵌入、影像與音訊：**修正自訂影像處理器收不到 `n`、`size`、`quality` 與其他 OpenAI 影像參數的問題 - [PR #52051](https://github.com/BerriAI/litellm/pull/52051)
- **金鑰、團隊與驗證：**變更團隊模型寫入方式，僅 proxy 管理員可設定 `os.environ/` 值，團隊管理員現在會收到 403 - [PR #51874](https://github.com/BerriAI/litellm/pull/51874)
- **管理 UI：**修正 SSO 登入繞經 `/sso/key/generate/`、在 TLS 終止後方重新導向至 `http://` 的問題，此問題自 v1.108.0 起存在 - [PR #52213](https://github.com/BerriAI/litellm/pull/52213)
- **部署：**將 UI 映像改為 slim nginx，移除 `curl` 但保留 `wget` 與 `nc` - [PR #52298](https://github.com/BerriAI/litellm/pull/52298)
- **SDK：**修正 `LITELLM_RUST=true` 時，輸入為 dict 子類別的有效 Messages 與 OCR 請求失敗的問題 - [PR #51812](https://github.com/BerriAI/litellm/pull/51812)
- **效能：**修正用戶端以大型請求主體重試 429 時，proxy Pod 記憶體耗盡的問題 - [PR #51428](https://github.com/BerriAI/litellm/pull/51428)
- **其他：**為在 `custom_provider_map` 註冊的自訂提供者新增原生 `generateContent` 支援 - [PR #51083](https://github.com/BerriAI/litellm/pull/51083)

這些變更已回移至 [PR #51982](https://github.com/BerriAI/litellm/pull/51982)、[PR #52074](https://github.com/BerriAI/litellm/pull/52074)、[PR #52155](https://github.com/BerriAI/litellm/pull/52155)、[PR #52201](https://github.com/BerriAI/litellm/pull/52201)、[PR #52233](https://github.com/BerriAI/litellm/pull/52233)、[PR #52248](https://github.com/BerriAI/litellm/pull/52248)、[PR #52306](https://github.com/BerriAI/litellm/pull/52306) 與 [PR #52312](https://github.com/BerriAI/litellm/pull/52312)。

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.10...v1.108.11
