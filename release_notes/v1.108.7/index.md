---
title: "LiteLLM v1.108.7 (LTS) 新增 Gemini 批次與 Bedrock 圖片搜尋"
description: "在 /v1/batches 新增 Gemini 批次、Bedrock 圖片搜尋與 Azure AI Foundry 上的 gpt-image 編輯。橋接時傳送 Responses 專用欄位需要 drop_params。"
slug: "v1-108-7"
date: 2026-11-12T20:27:30
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

`v1.108.7` 是 1.108 LTS 系列的修補版本。`lts` 映像標籤永遠指向最新的 LTS 版本，因此拉取 `docker.litellm.ai/berriai/litellm:lts` 即可維持在最新的 LTS 修補版本。請參閱 [LTS pilot](/docs/enterprise/lts_pilot)。

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
docker.litellm.ai/berriai/litellm:1.108.7
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.108.7
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.108.7`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.108.7) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)。

`v1.108.7` 是 [`v1.108.6`](/release_notes/v1.108.6/v1-108-6) 之上的修補版本。沒有新的資料庫 migration。`v1.108.7` 標籤指向 [`1b769ce`](https://github.com/BerriAI/litellm/commit/1b769ce7d8627ab70460cdef92cfa549a1b1ea40)。

:::danger 重大變更

- **Responses API：** 設定 `drop_params: true`，或停止將 `max_tool_calls` 等 Responses 專用欄位傳送給透過 chat completions 橋接的提供者 - [PR #48655](https://github.com/BerriAI/litellm/pull/48655)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)

:::

### 變更內容 {#whats-changed}

- **Azure：** 新增 Azure AI Foundry 部署上的 gpt-image 編輯，包含使用自訂名稱的部署 - [PR #49650](https://github.com/BerriAI/litellm/pull/49650)
- **AWS Bedrock：** 新增以 `query_image` 在 Bedrock 知識庫進行圖片搜尋，結果包含圖片命中項目 - [PR #51062](https://github.com/BerriAI/litellm/pull/51062)
- **Vertex AI and Gemini：** 修復 Gemini 圖片呼叫以錯誤費率計算文字、thinking 與 Vertex Priority token 的問題 - [PR #51017](https://github.com/BerriAI/litellm/pull/51017)
- **Vertex AI and Gemini：** 修復 `/gemini` 的 `batchGenerateContent` 批次記錄為 $0 且模型為 `unknown`、未向呼叫金鑰收費的問題 - [PR #51279](https://github.com/BerriAI/litellm/pull/51279)
- **其他提供者：** 修復 Baseten 模型的 `reasoning_effort` 被丟棄或拒絕的問題 - [PR #40152](https://github.com/BerriAI/litellm/pull/40152)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)
- **其他提供者：** 修復 `baseten/*` 列出已退役的部署 ID 而非目前 Baseten Model API 的問題 - [PR #46945](https://github.com/BerriAI/litellm/pull/46945)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)
- **Responses API：** 修復橋接 `/v1/responses` 串流事件的 `sequence_number` 缺失或重複的問題 - [PR #44944](https://github.com/BerriAI/litellm/pull/44944)
- **Responses API：** 修復串流 MCP 後續追蹤只保留最新一輪工具呼叫、導致模型重複工具呼叫的問題 - [PR #47698](https://github.com/BerriAI/litellm/pull/47698)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)
- **Responses API：** 修復 `previous_response_id` 鏈包含失敗回合時，Bedrock 回應 400 的問題 - [PR #48647](https://github.com/BerriAI/litellm/pull/48647)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)
- **Responses API：** 變更 `max_tool_calls` 等 Responses 專用欄位，在橋接提供者上未開啟 `drop_params` 時回應 400 - [PR #48655](https://github.com/BerriAI/litellm/pull/48655)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)
- **批次與檔案：** 在 `/v1/batches` 新增 Gemini 批次，支援透過 `/v1/files` 下載輸出並追蹤花費 - [PR #51032](https://github.com/BerriAI/litellm/pull/51032)
- **路由與備援：** 修復混合模型群組上的 Decisions 呼叫命中 Bedrock 部署並回應 400 的問題 - [PR #48175](https://github.com/BerriAI/litellm/pull/48175)，亦包含於 [`v1.109.0`](/release_notes/v1.109.0/v1-109-0)

這些變更的回移 PR 為 [PR #51262](https://github.com/BerriAI/litellm/pull/51262)、[PR #51266](https://github.com/BerriAI/litellm/pull/51266)、[PR #51271](https://github.com/BerriAI/litellm/pull/51271) 與 [PR #51340](https://github.com/BerriAI/litellm/pull/51340)。

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.6...v1.108.7
