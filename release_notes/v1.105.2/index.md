---
title: "LiteLLM v1.105.2 修正 count_tokens、橋接工具呼叫與 thinking 區塊"
description: "帶來 v1.104.4 的 token 計數修正，讓橋接工具呼叫保持在 choices[0]，並在 Anthropic 請求上保留已簽署的空 thinking 區塊。"
slug: "v1-105-2"
date: 2026-10-20T18:14:48
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
docker.litellm.ai/berriai/litellm:1.105.2
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.2
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.105.2`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.105.2) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.105.2` 是建立在 [`v1.105.1`](/release_notes/v1.105.1/v1-105-1) 之上的修補版本。它將 `main` 的七個修正以及隨 `v1.104.4` 發佈的 token 計數修正回移到 `stable/1.105.x`，因此從 `v1.104.4` 升級可保留這些修正。沒有新的資料庫 migration。`v1.105.2` 標籤指向 [`fc43640`](https://github.com/BerriAI/litellm/commit/fc436409e8c7ac2d59495424bf76080794e7842c)

## 重點摘要 {#key-highlights}

- **來自 `v1.104.4` 的 token 計數**：針對 OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以與 `/v1/messages` 推論相同的方式轉換，且計數回應會說明數字的來源
- **`choices[0]` 上的工具呼叫**：橋接到 `/responses` 的 chat completion 會在單一 choice 中回傳其文字、推理與工具呼叫，因此只讀取 `choices[0]` 的代理程式也能執行工具
- **已簽署的空 thinking 區塊**：`/v1/messages` 與 chat completions 會保留有簽章但沒有文字的 thinking 區塊，因此重播的回合能保留其推理

## 新增模型 / 更新模型 {#new-models--updated-models}

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - `/v1/messages` 請求不再丟棄文字為空但已設定 `signature` 的 thinking 區塊。只有空白且未簽署的區塊才會被移除 - [PR #41362](https://github.com/BerriAI/litellm/pull/41362)
    - Chat completions 會保留文字為空的已簽署 thinking 區塊，且只在缺少簽章時才丟棄 thinking 區塊。設定 `prefix_mismatch_behavior: error` 的 `/v1/messages` 請求現在會收到綁定不符的 400 回應，而不是以移除 thinking 的方式重試。Anthropic、Azure AI 與 Bedrock Invoke 設定在重建 `thinking` 時會保留 `thinking.block_binding` - [PR #46342](https://github.com/BerriAI/litellm/pull/46342)

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤 {#bugs}

- **Token counting**
    - Vertex AI 合作夥伴模型（例如 Vertex AI 上的 Claude）會將系統提示與工具計入計數
    - 針對 OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以與 `/v1/messages` 推論相同的方式轉換
    - 計數回應帶有 `litellm_count_source`，其值為 `provider`、`token_count_model` 或 `local_estimate`。當提供者計數失敗且本機計數已開啟時，回應為標示為 `local_estimate` 的本機估計
    - 新的 `model_info` 設定 `token_count_framing` 與 `token_count_model` 可調整單一部署的計數。當計數模型回應時，回應也會帶有 `litellm_count_model`
    - 隨附的成本對照表為部分模型新增 `token_count_framing` 與 `token_count_tokenizer` 值
    - 這些修正來自 [PR #47389](https://github.com/BerriAI/litellm/pull/47389)，而 [PR #47446](https://github.com/BerriAI/litellm/pull/47446) 與 [PR #47454](https://github.com/BerriAI/litellm/pull/47454) 讓先前的 Google `countTokens` 請求形狀以及 prompt 加 messages 輸入維持原有運作
- **[Responses API](../../docs/response_api) bridge**
    - 橋接到 `/responses` 的 chat completion 會將每個 Responses 訊息項目放在各自的 choice 中，因此 `[message, message, function_call]` 回覆會把工具呼叫放在 `choices[1]`。訊息文字、註解、推理與工具呼叫現在會併入單一 `choices[0]`，且當存在任何工具呼叫時，`finish_reason` 為 `tool_calls` - [PR #44346](https://github.com/BerriAI/litellm/pull/44346)、[PR #46099](https://github.com/BerriAI/litellm/pull/46099)

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤 {#bugs-1}

- 團隊金鑰可以讀取與取消自己團隊的批次，並下載完成的結果。相同的模型檢查也適用於 file、fine-tuning、vector store、character 與 video id - [PR #47067](https://github.com/BerriAI/litellm/pull/47067)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 透過模型別名傳送的串流 chat completions 現在以部署的模型定價，而非別名，與非串流請求相同。指向沒有定價之部署的別名，現在在串流請求上計費 $0，與同一個請求在不串流時的計費一致 - [PR #44341](https://github.com/BerriAI/litellm/pull/44341)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- 在模型新增後立即湧入的請求不再收到 400 `Invalid model name`。等待 registry 鎖定的請求，現在會在另一個 worker 已載入該模型時直接使用它，而不是消耗共用的重新同步預算 - [PR #44277](https://github.com/BerriAI/litellm/pull/44277)

所有這些修正與版本提升都在 [PR #47519](https://github.com/BerriAI/litellm/pull/47519) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- LLM API 端點：5
- 模型與提供者：2
- 驗證與管理：1
- 支出 / 預算 / 速率限制：1
- 效能：1

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.105.1...v1.105.2
