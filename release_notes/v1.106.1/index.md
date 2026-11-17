---
title: "LiteLLM v1.106.1 修正 count_tokens、MCP 工具呼叫與 thinking 區塊"
description: "帶來 v1.104.4 的 token 計數修正，在單一伺服器範圍內路由裸 MCP 工具名稱，並讓代理程式上下文不進入 vector store 中繼資料。"
slug: "v1-106-1"
date: 2026-10-20T18:58:28
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
docker.litellm.ai/berriai/litellm:1.106.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.106.1
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.106.1`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.106.1) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

`v1.106.1` 是建立在 [`v1.106.0`](/release_notes/v1.106.0/v1-106-0) 之上的修補版本。它將 `main` 的六個修正以及隨 `v1.104.4` 發佈的 token 計數修正回移到 `stable/1.106.x`，因此從 `v1.104.4` 升級可保留這些修正。沒有新的資料庫 migration。`v1.106.1` 標籤指向 [`978b4d1`](https://github.com/BerriAI/litellm/commit/978b4d1e4e91cdaaab2e16fbd02d855439e143c1)

## 重點摘要 {#key-highlights}

- **來自 `v1.104.4` 的 token 計數**：針對 OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以與 `/v1/messages` 推論相同的方式轉換，且計數回應會說明數字的來源
- **裸 MCP 工具名稱**：在單一伺服器範圍內以裸工具名稱發出的 `tools/call` 會前往該伺服器，因此冷副本不再回應 `Tool not found`
- **乾淨的 vector store 中繼資料**：透過代理程式建立的 vector store 只會將呼叫者的 `metadata` 傳送給提供者，因此後續的中繼資料更新不再以 400 失敗

## 新增模型 / 更新模型 {#new-models--updated-models}

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - `/v1/messages` 請求不再丟棄文字為空但已設定 `signature` 的 thinking 區塊。只有空白且未簽署的區塊才會被移除 - [PR #41362](https://github.com/BerriAI/litellm/pull/41362)
    - Chat completions 會保留文字為空的已簽署 thinking 區塊，且只在缺少簽章時才丟棄 thinking 區塊。設定 `prefix_mismatch_behavior: error` 的 `/v1/messages` 請求現在會收到綁定不符的 400 回應，而不是以移除 thinking 的方式重試。Anthropic、Azure AI 與 Bedrock Invoke 設定在重建 `thinking` 時會保留 `thinking.block_binding` - [PR #46342](https://github.com/BerriAI/litellm/pull/46342)

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤 {#bugs}

- **Token counting**
    - 針對 OpenAI 與 Gemini 模型的 Anthropic 格式計數請求，會以與 `/v1/messages` 推論相同的方式轉換
    - 計數回應帶有 `litellm_count_source`，其值為 `provider`、`token_count_model` 或 `local_estimate`。當提供者計數失敗且本機計數已開啟時，回應為標示為 `local_estimate` 的本機估計
    - 新的 `model_info` 設定 `token_count_framing` 與 `token_count_model` 可調整單一部署的計數。當計數模型回應時，回應也會帶有 `litellm_count_model`
    - 隨附的成本對照表為部分模型新增 `token_count_framing` 與 `token_count_tokenizer` 值
    - 這些修正來自 [PR #47389](https://github.com/BerriAI/litellm/pull/47389)，而 [PR #47446](https://github.com/BerriAI/litellm/pull/47446) 與 [PR #47454](https://github.com/BerriAI/litellm/pull/47454) 讓先前的 Google `countTokens` 請求形狀以及 prompt 加 messages 輸入維持原有運作
- **[Responses API](../../docs/response_api) bridge**
    - 橋接到 `/responses` 的 chat completion 會將每個 Responses 訊息項目放在各自的 choice 中，因此 `[message, message, function_call]` 回覆會把工具呼叫放在 `choices[1]`。訊息文字、註解、推理與工具呼叫現在會併入單一 `choices[0]`，且當存在任何工具呼叫時，`finish_reason` 為 `tool_calls` - [PR #46099](https://github.com/BerriAI/litellm/pull/46099)
- **Vector Stores**
    - 透過代理程式建立的 vector store 會以代理程式上下文填滿全部 16 個 OpenAI 中繼資料欄位，因此後續每次中繼資料更新都以 HTTP 400 失敗，且呼叫者的金鑰（例如 `endpoint`）會被覆寫。建立與更新現在會將呼叫者的 `metadata` 原封不動傳送給提供者，而記錄、標籤與限制仍能看到代理程式上下文。選用的 `db_scripts/strip_vector_store_internal_metadata.py` 指令稿可從此版本之前建立的 store 中移除 LiteLLM 的金鑰 - [PR #47021](https://github.com/BerriAI/litellm/pull/47021)

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤 {#bugs-1}

- 團隊金鑰可以讀取與取消自己團隊的批次，並下載完成的結果。相同的模型檢查也適用於 file、fine-tuning、vector store、character 與 video id - [PR #47067](https://github.com/BerriAI/litellm/pull/47067)

## MCP 閘道 {#mcp-gateway}

- 自 `v1.103.0` 起，在 `/{server_name}/mcp` 上以裸工具名稱發出的 `tools/call`，或在 `x-mcp-servers` 中只有一台伺服器的 `tools/call`，會在冷副本上回傳 `Tool not found`。範圍恰好限定於一台伺服器的請求，現在會將裸名稱路由到該伺服器；而兩個伺服器共用的裸名稱會前往路徑所指名的伺服器 - [PR #46225](https://github.com/BerriAI/litellm/pull/46225)

所有這些修正與版本提升都在 [PR #47517](https://github.com/BerriAI/litellm/pull/47517) 中回移

### 依負責領域彙總的 PR {#pr-roll-up-by-ownership-area}

- LLM API 端點：5
- 模型與提供者：2
- 驗證與管理：1
- MCP：1

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.106.0...v1.106.1
