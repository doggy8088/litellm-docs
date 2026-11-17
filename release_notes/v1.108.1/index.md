---
title: "LiteLLM v1.108.1 (LTS) 修正 Bedrock 防護欄計費與路由器冷卻"
description: "對原生 Bedrock 防護欄 trace 與 Gemini 音訊層級計費，並在 allowed_fails 下讓單一部署保持就緒。字串備援目標會使啟動停止。"
slug: "v1-108-1"
date: 2026-11-05T23:42:04
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

`v1.108.1` 是 1.108 LTS 產品線上的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可保持在最新的 LTS 修補版。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.108.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

:::danger 重大變更

**字串備援目標現在會使代理程式無法啟動。** 以字串撰寫的目標（例如 `fallbacks: [{"gpt-4": "gpt-3.5"}]` 或 `default_fallbacks: gpt-3.5`）從未路由到該備援。代理程式現在會在啟動時結束，並顯示指出修正方式的訊息。請在升級前將目標寫成清單形式，例如 `fallbacks: [{"gpt-4": ["gpt-3.5"]}]` 或 `default_fallbacks: ["gpt-3.5"]`。請參閱 [PR #48943](https://github.com/BerriAI/litellm/pull/48943)。

:::

`v1.108.1` 是建立在 [`v1.108.0`](/release_notes/v1.108.0/v1-108-0) 之上的修補版本。沒有新的資料庫 migration。`v1.108.1` 標籤指向 [`93f52b5`](https://github.com/BerriAI/litellm/commit/93f52b591ee2c91617a8c6975f047f4ad722d7e3)。

### 變更內容 {#whats-changed}

- **OpenAI：** 改進 chat completions，讓長提示在請求傳送前不再佔住事件迴圈 - [PR #46967](https://github.com/BerriAI/litellm/pull/46967)
- **AWS Bedrock：** 修正 `bedrock/claude_platform/*` 呼叫記錄 $0 支出的問題，現在依其自身的成本對照表資料列定價 - [PR #48150](https://github.com/BerriAI/litellm/pull/48150)
- **AWS Bedrock：** 將原生 `guardrailConfig` trace 用量加入支出、預算與 `x-litellm-response-cost` - [PR #48278](https://github.com/BerriAI/litellm/pull/48278)、[PR #48923](https://github.com/BerriAI/litellm/pull/48923)
- **Vertex AI 與 Gemini：** 修正 Gemini 音訊輸入與快取音訊在 flex、priority 與 batch 上以標準費率計費的問題 - [PR #48086](https://github.com/BerriAI/litellm/pull/48086)
- **Vertex AI 與 Gemini：** 補上缺少的 Vertex AI 音訊、長上下文 flex 與 priority 影像價格，並移除 Google 只提供最早日期的退役日期 - [PR #49964](https://github.com/BerriAI/litellm/pull/49964)
- **其他提供者：** 修正 `/watsonx/*` pass-through 忽略 `use_in_pass_through` 部署的問題。只有非團隊範圍的部署才提供其憑證 - [PR #49462](https://github.com/BerriAI/litellm/pull/49462)、[PR #50217](https://github.com/BerriAI/litellm/pull/50217)
- **Chat completions：** 修正串流用量丟棄快取與推理 token 詳細資訊的問題，該問題使快取 token 以完整輸入費率計費 - [PR #36678](https://github.com/BerriAI/litellm/pull/36678)
- **嵌入、影像與音訊：** 為在 `custom_provider_map` 中註冊的自訂提供者新增 `/v1/videos` 支援 - [PR #49785](https://github.com/BerriAI/litellm/pull/49785)
- **批次與檔案：** 修正未受管理的 `gs://` 批次透過第一個具有相同基礎模型的部署（而非建立它們的部署）讀取與計費的問題 - [PR #49301](https://github.com/BerriAI/litellm/pull/49301)
- **Token 計數：** 修正 Anthropic token 計數在 `search_result` 區塊上回傳 500 的問題。不支援的區塊現在回傳 400 - [PR #48699](https://github.com/BerriAI/litellm/pull/48699)
- **路由與備援：** 修正路由器在沒有備援時，依 `allowed_fails` 將群組的唯一部署停用的問題 - [PR #48644](https://github.com/BerriAI/litellm/pull/48644)、[PR #48913](https://github.com/BerriAI/litellm/pull/48913)
- **路由與備援：** 字串備援目標改為在路由器啟動時遭到拒絕，並顯示指出清單形式的訊息 - [PR #48943](https://github.com/BerriAI/litellm/pull/48943)
- **記錄與可觀測性：** 修正備援重試保留失敗嘗試的第一個 token 時間的問題，該問題會記錄負的完成時間並使以延遲為基礎的路由停滯 - [PR #47541](https://github.com/BerriAI/litellm/pull/47541)
- **Admin UI：** 修正 `/team/spend/by_user` 與 Admin UI 支出記錄讀取在 UI 放棄後仍在 Postgres 中繼續執行的問題。它們現在會在 30 秒後取消 - [PR #49922](https://github.com/BerriAI/litellm/pull/49922)、[PR #49965](https://github.com/BerriAI/litellm/pull/49965)
- **效能：** 修正遭逐出的 SDK 用戶端讓 aiohttp 工作階段保持開啟，以及逐出後串流以 `Connection closed` 失敗的問題 - [PR #48650](https://github.com/BerriAI/litellm/pull/48650)、[PR #48920](https://github.com/BerriAI/litellm/pull/48920)、[PR #48877](https://github.com/BerriAI/litellm/pull/48877)
- **效能：** 工具探索改為在 Redis 中緩衝，並在每次排清時寫入一次 `LiteLLM_ToolTable`，因此 Tools 頁面上的 `call_count` 現在會計數工具呼叫 - [PR #48089](https://github.com/BerriAI/litellm/pull/48089)
- **其他：** 修正用戶端在主體上傳期間中斷連線時被記錄為失敗或成功呼叫的問題。代理程式現在以 499 結束該請求 - [PR #48640](https://github.com/BerriAI/litellm/pull/48640)

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.0...v1.108.1
