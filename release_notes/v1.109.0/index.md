---
title: "LiteLLM v1.109.0 新增 11 個提供者、Codex 工具搜尋與每日限制"
description: "新增 11 個提供者、重新設計的 Playground、Codex 工具搜尋與部署每日限制。停滯或中止的串流現在會明顯地失敗。"
slug: "v1-109-0"
date: 2026-11-11T00:56:51
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
docker.litellm.ai/berriai/litellm:1.109.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.109.0
```

</TabItem>
</Tabs>

此版本以 [`ghcr.io/berriai/litellm:v1.109.0`](https://github.com/BerriAI/litellm/pkgs/container/litellm) 形式發佈。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.109.0) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases)

本說明涵蓋自 [`v1.108.0`](/release_notes/v1.108.0/v1-108-0) 以來的所有變更。在 `v1.109.0-rc.1` 截點之後加入發佈分支的變更只有六個測試修復，列在 [測試、CI 與內部變更](#tests-ci-and-internal-changes) 之下

先列出面向客戶的變更。測試、CI 與內部變更列在底部

:::danger 重大變更

這些重點說明涵蓋與 [`v1.108.0`](/release_notes/v1.108.0/v1-108-0)（前一個穩定版）不同的使用者可見行為

**disk 快取後端已移除。** 帶有 `cache_params.type: disk` 的設定現在會讓代理程式在啟動時停止。請改用 `local` 或 `redis`，並預期快取為冷狀態。請參閱 [PR #48114](https://github.com/BerriAI/litellm/pull/48114)

**帶有字串備援目標的代理程式設定不再能啟動。** 這些目標從未實際路由；請依啟動錯誤所示，將目標寫成清單形式。請參閱 [PR #48943](https://github.com/BerriAI/litellm/pull/48943)

**直接 `helm install` `litellm-helm` 不再隨附 `gpt-3.5-turbo` 與 `fake-openai-endpoint` 佔位模型。** 請在 `proxy_config.model_list` 之下或從 Admin UI 新增模型。請參閱 [PR #47056](https://github.com/BerriAI/litellm/pull/47056)

**中途失敗的串流現在會明顯地失敗。** 停滯的串流回應 408 `litellm.Timeout` 而非 500 `APIConnectionError`；以 `abort` 完成原因結束的串流回應 500 而非正常停止；傳送了內容卻從未傳送完成原因的串流會以錯誤形式送達用戶端並記錄為失敗。重試、冷卻、警示與備援現在都適用於這些串流。請參閱 [PR #47198](https://github.com/BerriAI/litellm/pull/47198)、[PR #48328](https://github.com/BerriAI/litellm/pull/48328)、[PR #47665](https://github.com/BerriAI/litellm/pull/47665)

**以 `stream_options.include_usage` 請求的串流回應，現在以 `choices` 為空清單的 usage chunk 結尾，與 OpenAI 一致。** 最後一個 chunk 以往帶有 `"choices": [{"index": 0, "delta": {}}]`。在每個 chunk 上讀取 `chunk.choices[0]` 的程式碼或自訂 `async_post_call_streaming_iterator_hook` 會在該 chunk 上引發 `IndexError`，因此請先檢查 `if chunk.choices:`，與 OpenAI SDK 的做法相同。LiteLLM 自行加入的 usage（透過代理程式注入、`always_include_stream_usage` 或部署與路由器 `stream_options`）維持先前的形狀。請參閱 [PR #47109](https://github.com/BerriAI/litellm/pull/47109)

**帶有 `invalid_request_error` body 的 OpenAI 相容 401 與 404 回應，現在引發 `AuthenticationError` 與 `NotFoundError`，而非 `BadRequestError`。** 請更新針對這些錯誤捕捉 `BadRequestError` 的程式碼與重試政策。請參閱 [PR #32537](https://github.com/BerriAI/litellm/pull/32537)

**未傳送 `max_tokens` 的 Claude 請求現在會要求多得多的輸出。** 成本對應表中缺少的 Anthropic 模型會得到 `max_tokens: 128000` 而非 4096。設定 `DEFAULT_ANTHROPIC_CHAT_MAX_TOKENS=4096` 可保留舊值。Bedrock Invoke 與 Mantle Claude 傳送部署的 `model_info.max_output_tokens` 或模型對應的限制而非 4096，這會佔用更多 Bedrock 每分鐘 token 配額，因此忙碌的帳號可能看到更多 429。傳送 `max_tokens` 可保留舊的佔用量。請參閱 [PR #48502](https://github.com/BerriAI/litellm/pull/48502)、[PR #49692](https://github.com/BerriAI/litellm/pull/49692)

**在 `litellm_settings` 之下設定 `drop_params: false` 時，帶有不受支援設定的 Claude Code 與 Codex 請求現在會像其他用戶端一樣回應 400。** 設定 `drop_params: true` 可繼續丟棄這些設定。請參閱 [PR #49058](https://github.com/BerriAI/litellm/pull/49058)

**`enable_pre_call_checks: true` 不再於部署的每分鐘計數達到 `rpm` 時停止選取該部署。** 在 `router_settings` 中加入 `optional_pre_call_checks: ["enforce_model_rate_limits"]` 可保留硬性上限。請參閱 [PR #48873](https://github.com/BerriAI/litellm/pull/48873)

**MCP 存取在兩種情況下變得更嚴格。** 在 `extra_headers` 中帶有 `Authorization` 的 `none` 或 `bearer_token` MCP 伺服器不再收到呼叫者的 LiteLLM 金鑰；請在 `x-litellm-api-key` 中傳送 LiteLLM 驗證，以繼續轉送另一個上游 `Authorization`。團隊上的管理員憑證（例如管理員的團隊金鑰、CLI 登入或 JWT）現在只能取得該團隊的 MCP 伺服器與工具集，而儀表板與 master key 仍可看到全部。請參閱 [PR #46932](https://github.com/BerriAI/litellm/pull/46932)、[PR #49161](https://github.com/BerriAI/litellm/pull/49161)

**舊規則格式的自訂成本對應表會遺失未對應 Claude ID 的備援資訊。** 預設的遠端對應表或隨附的備份不受影響，但如果您固定或覆寫了 2026 年 7 月之前的對應表，請在升級前改用目前的副本。請參閱 [PR #48737](https://github.com/BerriAI/litellm/pull/48737)

**部署自身的 `model_id` 現在優先於請求 body 中的 `model_id`。** 用戶端不再能將固定了 SageMaker 推論元件、Bedrock 模型 ID 或 ARN，或 SageMaker `X-Amzn-SageMaker-Inference-Component` 標頭的部署改成不同的值。若要允許用戶端重新選擇，`model_id` 必須列在該部署的 `configurable_clientside_auth_params` 中，因為 `allow_client_side_credentials` 不會選擇加入。請參閱 [PR #49045](https://github.com/BerriAI/litellm/pull/49045) 與 [Clientside LLM Credentials](/docs/proxy/clientside_auth#let-clients-choose-a-deployments-model_id)

:::

## 重點摘要 {#key-highlights}

- **新提供者**：ai&、CLF AI Gateway、StreamLake、OpenInfer、ZeroGPU、Hostinger Router、OpenCode Go、Refuseless、BigModel 與 Kyma API，外加 Nace Drex 與 LM Studio 決策模型，總計 311 個新目錄項目
- **新端點與媒體**：`/v1/extraction` 搭配 Cloudflare Clairic、`/deepgram/v1/speak` 上的 Deepgram 串流文字轉語音、A2A `message/stream`、Amazon OpenSearch k-NN 向量儲存、Doubao-Seedance 影片，以及 DashScope 圖片編輯與語音
- **Admin UI 與 Chat**：重新設計的 Playground，帶有逐請求的路由、防護欄與成本檢查器；Chat 中的檔案附件與 Deep research；可分享的 Usage 連結與雙模型 Auto Router 設定
- **程式設計代理程式**：Codex 透過工具搜尋探索 MCP 工具；Claude Code 閘道列出模型，並讓您在 CLI 登入時選取團隊；Codex 與 Pi 可透過閘道保留自己的 ChatGPT 訂閱
- **限制與預算**：部署 `rpd` 與 `tpd` 每日限制、Responses WebSocket 回合計入部署與金鑰限制，以及 W3C `baggage` 值對應到花費標籤
- **可靠性**：停滯、中止或未帶完成原因結束的串流現在會明顯地失敗；花費彙總與回呼在關閉時排空；開啟 Redis 時 `/model/new` 立即在每個 worker 上生效

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（11 個新提供者） {#new-providers-11-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| ai& | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `aiand/` 之下的 OpenAI 相容提供者，讀取 `AIAND_API_KEY` |
| CLF AI Gateway | `/v1/chat/completions` | `clf_ai_gateway/` 之下的 OpenAI 相容提供者，讀取 `CLF_AI_GATEWAY_API_KEY` |
| StreamLake | `/v1/chat/completions` | `streamlake/` 之下的 OpenAI 相容提供者 |
| OpenInfer | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `openinfer/` 之下的 OpenAI 相容提供者 |
| ZeroGPU | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `zerogpu/` 之下的 OpenAI 相容提供者 |
| Hostinger Router | `/v1/chat/completions`, `/v1/responses`, `/v1/messages`, `/v1/embeddings` | `hostinger_router/` 之下的 OpenAI 相容提供者 |
| Nace | `/v1/decisions` | Drex 模型的 Decisions 提供者，列在 Add Model 表單中 |
| OpenCode Go | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 依目錄中繼資料為每個模型選取上游 API 的提供者，帶有已發佈的 Go 價格 |
| Refuseless | `/v1/chat/completions`, `/v1/responses` | `refuseless/` 之下的 OpenAI 相容提供者，帶有五個已定價模型 |
| BigModel | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | `bigmodel/` 之下的 Z.AI 系列提供者，讀取 `BIGMODEL_API_KEY` |
| Kyma API | `/v1/chat/completions` | `kyma/` 之下的 OpenAI 相容提供者，依 Kyma 回報的 `usage.cost` 計費 |

### 新增 LLM API 端點（3 個新端點） {#new-llm-api-endpoints-3-new-endpoints}

| 端點 | 方法 | 說明 |
| --- | --- | --- |
| `/v1/extraction` | POST | 透過 `cloudflare/clairic` 以 Cloudflare Clairic 從輸入中擷取具型別的 `fields`，也可作為 `/extraction`、`litellm.extraction` 與 `litellm.aextraction` 使用 |
| `/deepgram/v1/speak` | WebSocket | 以 LiteLLM 金鑰串流 Deepgram 文字轉語音，依字元計費，也在 `/deepgram/speak` 提供 |
| `/a2a/{agent_id}/message/stream` | POST | 串流 A2A 代理程式的 `message/stream` 回應，也在 `/v1/a2a/{agent_id}/message/stream` 提供 |

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（311 個新模型） {#new-model-support-311-new-models}

數量代表相較於 `v1.108.0` 的新目錄識別碼，包括別名與區域變體。價格為此版本隨附的值（USD），執行階段重新載入 pricing-map 可更新它們。沒有列被移除

<details>
<summary>全部 311 個新目錄項目</summary>

| 提供者 | Model | Context Window | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Abliteration | `abliteration/abliterated-model` | 262,144 | $1 | $3 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Abliteration | `abliteration/abliterated-model-large` | 1,000,000 | $3 | $5 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Abliteration | `abliteration/abliterated-model-large-flash` | 1,048,576 | $1 | $2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Abliteration | `abliteration/abliterated-model-large-v2` | 1,000,000 | $3 | $5 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| AIAND | `aiand/deepseek-ai/deepseek-v4-flash` | 1,048,576 | $0.15 | $0.25 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/deepseek-ai/deepseek-v4-pro` | 1,048,576 | $1 | $2.5 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/deepseek-ai/deepseek-v4.1-flash` | 1,048,576 | $0.3 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/deepseek-ai/deepseek-v4.1-flash-1017` | 1,048,576 | $0.3 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/google/gemma-4-31b-it` | 262,144 | $0.2 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/meta/muse-spark-open` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/moonshotai/kimi-k2.7-code` | 262,144 | $0.75 | $3.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/moonshotai/kimi-k3` | 1,048,576 | $3 | $12.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/motif-technologies/motif-3` | 262,144 | $0.5 | $2 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/openai/gpt-oss-120b` | 131,072 | $0.15 | $0.6 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/qwen/qwen3.6-27b` | 262,144 | $0.32 | $3.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/qwen/qwen3.8-27b` | 262,144 | $0.4 | $3 | 聊天；推理；視覺；工具呼叫；提示快取 |
| AIAND | `aiand/zai-org/glm-5.2` | 1,048,576 | $1 | $4 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/zai-org/glm-5.3` | 1,048,576 | $1 | $4 | 聊天；推理；工具呼叫；提示快取 |
| AIAND | `aiand/zai-org/glm-5.3-flash` | 1,048,550 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `bedrock/ap-northeast-1/mistral.voxtral-mini-3b-2507` | 32,768 | $0.05 | $0.05 | 聊天；音訊輸入 |
| Amazon Bedrock | `bedrock/ap-northeast-1/mistral.voxtral-small-24b-2507` | 32,768 | $0.12 | $0.36 | 聊天；音訊輸入 |
| Amazon Bedrock | `bedrock/ap-southeast-2/mistral.voxtral-mini-3b-2507` | 32,768 | $0.0412 | $0.0412 | 聊天；音訊輸入 |
| Amazon Bedrock | `bedrock/ap-southeast-2/mistral.voxtral-small-24b-2507` | 32,768 | $0.103 | $0.309 | 聊天；音訊輸入 |
| Amazon Bedrock | `bedrock/claude_platform/claude-fable-5` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-fable-5-1` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-haiku-4-5` | 200,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-4-5` | 200,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-4-6` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-4-7` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-4-8` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-5` | 1,000,000 | $5 | $25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-sonnet-4-5` | 200,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-sonnet-4-6` | 1,000,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-sonnet-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/claude_platform/claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Amazon Bedrock | `bedrock/eu-west-2/mistral.voxtral-mini-3b-2507` | 32,768 | $0.06 | $0.06 | 聊天；音訊輸入 |
| Amazon Bedrock | `bedrock/eu-west-2/mistral.voxtral-small-24b-2507` | 32,768 | $0.16 | $0.47 | 聊天；音訊輸入 |
| Amazon Bedrock | `global.openai.gpt-6.1-terra` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us.openai.gpt-6.1-terra` | 922,000 | $1.1 | $5.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock Mantle | `bedrock_mantle/openai.gpt-6.1-terra` | 922,000 | $1.1 | $5.5 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure | `azure/apac/gpt-6.1-terra` | 922,000 | $1.2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure | `azure/eu/gpt-6.1-terra` | 922,000 | $1.2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure | `azure/gpt-6.1-terra` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure | `azure/us/gpt-6.1-terra` | 922,000 | $1.1 | $5.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/gpt-6.1-terra` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/MAI-Code-1.1-Flash` | 256,000 | $0.2 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Baseten | `baseten/decision-models/baseten-elephant-9b-latest` | 16,384 | $0.035 | $0 | 決策；視覺 |
| Baseten | `baseten/decision-models/baseten-joey-2b-latest` | 16,384 | $0.01 | $0 | 決策；視覺 |
| Baseten | `baseten/decision-models/baseten-mammoth-27b-latest` | 16,384 | $0.1 | $0 | 決策；視覺 |
| BigModel | `bigmodel/glm-5.3` | 1,000,000 | $1.142857 | $4 | 聊天；推理；工具呼叫；提示快取 |
| BigModel | `bigmodel/glm-5.3-flash` | 1,000,000 | $0.114286 | $0.4 | 聊天；推理；視覺；工具呼叫；提示快取；影片輸入 |
| BigModel | `bigmodel/glm-5.3-flashx` | 1,000,000 | $0.285714 | $1 | 聊天；推理；視覺；工具呼叫；提示快取；影片輸入 |
| Cerebras | `cerebras/llama-3.1-70b` | 128,000 | $0.6 | $0.6 | 聊天；工具呼叫 |
| Cerebras | `cerebras/llama-3.1-8b` | 128,000 | $0.1 | $0.1 | 聊天；工具呼叫 |
| ChatGPT | `chatgpt/gpt-6-astra-law` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| ChatGPT | `chatgpt/gpt-6-rosalind` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| ChatGPT | `chatgpt/gpt-6.1-terra` | 922,000 | - | - | 回應；推理；視覺；工具呼叫；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/deepseek-v4-flash` | 1,048,576 | $0.176 | $0.528 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/deepseek-v4-pro` | 1,048,576 | $0.528 | $1.584 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/deepseek-v4.1-flash` | 1,048,576 | $0.12 | $0.48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/glm-4.7-flash` | 131,072 | $0.024 | $0.16 | 聊天；推理；工具呼叫；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/glm-5.2` | 262,144 | $0.56 | $1.76 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/glm-5.3` | 1,048,576 | $0.56 | $1.76 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/glm-5.3-flash` | 1,048,576 | $0.06 | $0.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/kimi-k2.6` | 262,144 | $0.38 | $1.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/kimi-k2.7-code` | 262,144 | $0.38 | $1.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| CLF AI Gateway | `clf_ai_gateway/qwen3.8-27b` | 262,144 | $0.18 | $1.28 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Cohere | `rerank-v5.0-fast` | 32,768 | $0.02 | $0 | 重新排名 |
| Cohere | `rerank-v5.0-pro` | 32,768 | $0.05 | $0 | 重新排名 |
| DashScope | `dashscope/qwen-audio-3.0-tts-flash` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.000015 |
| DashScope | `dashscope/qwen-audio-3.0-tts-plus` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00002 |
| DashScope | `dashscope/qwen-audio-3.1-tts-flash` | - | $0.23 | $1.87 | 文字轉語音 |
| DashScope | `dashscope/qwen-audio-3.1-tts-plus` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00003 |
| DashScope | `dashscope/qwen3-tts-flash` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00001 |
| Databricks | `databricks/databricks-claude-haiku-5-5` | 1,000,000 | $0.10003 | $0.50001 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-claude-sonnet-5-5` | 1,000,000 | $1.99997 | $9.99999 | 聊天；推理；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-deepseek-v4-1-flash` | 1,000,000 | $0.30002 | $1.20001 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-deepseek-v4-1-flash-1017` | 1,000,000 | $0.30002 | $1.20001 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gemini-2-5-flash-lite` | 1,048,576 | $0.12502 | $0.50001 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入；影片輸入；`input_cost_per_audio_token`: $0.00000037 |
| Databricks | `databricks/databricks-gemini-3-1-flash-lite-image` | 65,536 | $0.31248 | $1.87502 | 聊天；視覺 |
| Databricks | `databricks/databricks-gemini-4-argon` | 1,048,576 | $2.49998 | $12.49997 | 聊天；推理；視覺；工具呼叫；提示快取；音訊輸入；影片輸入 |
| Databricks | `databricks/databricks-gpt-5-4-pro` | 922,000 | $29.99997 | $180.0001 | 回應；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-6-1-sol` | 922,000 | $1.99997 | $9.99999 | 回應；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-6-1-terra` | 922,000 | $1.00002 | $5.00003 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-6-astra` | 922,000 | $9.99999 | $50.00002 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-6-luna` | 922,000 | $0.10003 | $0.50001 | 回應；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-6-sol` | 922,000 | $1.99997 | $9.99999 | 回應；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-gpt-image-1` | - | $5.00003 | - | 影像生成 |
| Databricks | `databricks/databricks-gpt-image-1-5` | - | $5.00003 | $9.99999 | 影像生成；視覺；PDF 輸入 |
| Databricks | `databricks/databricks-gpt-image-1-mini` | - | $1.99997 | - | 影像生成 |
| Databricks | `databricks/databricks-gpt-image-2` | - | $5.00003 | - | 影像生成；視覺；PDF 輸入 |
| Databricks | `databricks/databricks-grok-4-7` | 500,000 | $2.49998 | $7.50001 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-kimi-k2-7` | 262,144 | $0.94997 | $4.00001 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Databricks | `databricks/databricks-typesafeai-jev-1-14-0` | - | $0.042 | $0 | 評估；視覺 |
| Deepgram | `deepgram/aura` | - | - | - | `input_cost_per_character`: $0.000015 |
| Deepgram | `deepgram/aura-2` | - | - | - | `input_cost_per_character`: $0.00003 |
| ElevenLabs | `elevenlabs/eleven_flash_v2` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| ElevenLabs | `elevenlabs/eleven_flash_v2_5` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| ElevenLabs | `elevenlabs/eleven_turbo_v2` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| ElevenLabs | `elevenlabs/eleven_turbo_v2_5` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| ElevenLabs | `elevenlabs/eleven_v3_conversational` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| ElevenLabs | `elevenlabs/eleven_v4` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00008 |
| ElevenLabs | `elevenlabs/eleven_v4_turbo` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.00004 |
| EU JEV | `eu_jev/eu-jeff-1.0.0` | 32,768 | $0.0415 | $0 | 評估 |
| EU JEV | `eu_jev/eu-jeff-latest` | 32,768 | $0.0415 | $0 | 評估 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/rune` | 262,144 | $0.042 | $0 | 決策 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/ultramarine-1-flash-us` | 1,048,576 | $0.225 | $0.75 | 聊天；視覺；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-1017-spot` | 1,048,576 | $0.21 | $0.84 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-spot` | 1,048,576 | $0.21 | $0.84 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-5p3-spot` | 1,048,576 | $0.98 | $3.08 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/kimi-k3-spot` | 1,048,576 | $2.1 | $10.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/spot-deepseek-v4-flash` | 1,048,576 | $0.105 | $0.21 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| GitHub Copilot | `github_copilot/gpt-6.1-terra` | 922,000 | $1 | $5 | 回應；推理；視覺；工具呼叫；結構化輸出 |
| Hostinger Router | `hostinger_router/claude-sonnet-5` | 1,000,000 | $2.64 | $13.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Hostinger Router | `hostinger_router/gpt-5.2` | 272,000 | $2.1 | $16.8 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Hostinger Router | `hostinger_router/text-embedding-3-large` | 8,191 | $0.1716 | $0 | 嵌入 |
| Hostinger Router | `hostinger_router/text-embedding-3-small` | 8,191 | $0.03 | $0 | 嵌入 |
| Kyma | `kyma/claude-fable-5` | 1,000,000 | $13.5 | $67.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-fable-5.1` | 1,000,000 | $13.5 | $67.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-haiku-4-5` | 200,000 | $1.35 | $6.75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/claude-haiku-5.5` | 1,000,000 | $0.135 | $0.675 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-opus-4-7` | 1,000,000 | $6.75 | $33.75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/claude-opus-5` | 1,000,000 | $6.75 | $33.75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-opus-5.5` | 1,000,000 | $5.4 | $27 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-sonnet-4-6` | 1,000,000 | $4.05 | $20.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/claude-sonnet-5` | 1,000,000 | $2.7 | $13.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/claude-sonnet-5.5` | 1,000,000 | $2.7 | $13.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/deepseek-r1` | 64,000 | $0.7425 | $2.957 | 聊天；推理；工具呼叫；結構化輸出 |
| Kyma | `kyma/deepseek-v3` | 160,000 | $0.518 | $0.7571 | 聊天；推理；工具呼叫；結構化輸出 |
| Kyma | `kyma/deepseek-v4-flash` | 1,000,000 | $0.123 | $0.2458 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/deepseek-v4-flash-vision-exp` | 1,048,576 | $0.3892 | $1.168 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/deepseek-v4.1-flash` | 1,048,576 | $0.27 | $0.81 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/gemini-3-flash` | 1,048,576 | $0.675 | $4.05 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gemini-3.1-pro` | 1,048,576 | $2.7 | $16.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gemini-3.5-flash` | 1,048,576 | $2.025 | $12.15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gemini-3.5-flash-lite` | 1,048,576 | $0.405 | $3.375 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gemini-3.6-flash` | 1,048,576 | $1.013 | $5.063 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Kyma | `kyma/gemini-3.7-flash` | 1,048,576 | $2.026 | $10.126 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gemini-3.8-flash` | 1,048,576 | $2.026 | $10.126 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gemini-4-argon` | 1,048,576 | $5.4 | $27 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gemma-4-31b` | 128,000 | $0.1642 | $0.4689 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-4.5-air` | 131,072 | $0.1797 | $1.175 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-4.7-flash` | 203,000 | $0.081 | $0.54 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-5.1` | 203,000 | $1.89 | $5.94 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-5.2` | 1,000,000 | $0.9029 | $3.083 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-5.3` | 1,310,720 | $1.178 | $3.702 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/glm-5.3-flash` | 1,310,720 | $0.172 | $0.5733 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gpt-5.6-luna` | 1,050,000 | $0.2944 | $1.767 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-5.6-luna-pro` | 1,050,000 | $0.2703 | $1.621 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-5.6-sol` | 1,050,000 | $5.4 | $27 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-5.6-sol-pro` | 1,050,000 | $5.4 | $27 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-5.6-terra` | 1,050,000 | $2.7 | $16.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gpt-5.6-terra-pro` | 1,050,000 | $2.7 | $16.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-6-astra` | 1,050,000 | $13.5 | $67.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/gpt-6-luna` | 1,050,000 | $0.1639 | $0.8195 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-6.1-sol` | 1,050,000 | $2.7 | $13.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/gpt-oss-120b` | 128,000 | $0.0473 | $0.2303 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/grok-4.20` | 2,000,000 | $1.763 | $3.528 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/grok-4.20-multi-agent` | 2,000,000 | $1.767 | $3.534 | 聊天；推理；視覺；結構化輸出；PDF 輸入 |
| Kyma | `kyma/grok-4.3` | 1,000,000 | $1.92 | $3.838 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/grok-4.5` | 500,000 | $2.73 | $8.189 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/grok-4.6` | 500,000 | $2.758 | $8.274 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/grok-4.7` | 500,000 | $2.16 | $6.48 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入 |
| Kyma | `kyma/grok-build` | 256,000 | $1.389 | $2.777 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/hy3` | 262,144 | $0.1594 | $0.6576 | 聊天；推理；工具呼叫；結構化輸出 |
| Kyma | `kyma/hy4-preview` | 1,048,576 | $1.1259 | $3.3764 | 聊天；推理；工具呼叫；結構化輸出 |
| Kyma | `kyma/kimi-k2.6` | 262,144 | $0.5909 | $2.758 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/kimi-k2.7-code` | 262,144 | $1.009 | $4.774 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/kimi-k3` | 1,048,576 | $3.052 | $15.258 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/kimi-k3.1-pro` | 1,048,576 | $2.7 | $13.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/llama-3.3-70b` | 128,000 | $0.135 | $0.432 | 聊天；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/llama-4-maverick` | 1,048,576 | $0.3344 | $1.337 | 聊天；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/mimo-v2.5` | 1,050,000 | $0.1859 | $0.3718 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/mimo-v2.6-flash` | 1,050,000 | $0.189 | $0.378 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/mimo-v2.6-pro` | 1,050,000 | $0.5805 | $1.1745 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/minimax-m2.5` | 196,608 | $0.4188 | $1.675 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/minimax-m2.7` | 204,800 | $0.405 | $1.62 | 聊天；推理；工具呼叫；結構化輸出 |
| Kyma | `kyma/minimax-m3` | 1,048,576 | $0.3956 | $1.582 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/minimax-m3.1-flash` | 1,048,576 | $0.2025 | $0.81 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/muse-glimmer-30b` | 131,072 | $0.4554 | $1.821 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/muse-spark-1.1` | 1,048,576 | $1.542 | $5.243 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/muse-spark-1.2` | 1,048,576 | $1.773 | $6.025 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/muse-spark-1.3` | 1,048,576 | $1.688 | $5.738 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/muse-spark-open` | 1,048,576 | $1.688 | $5.738 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/muse-wonder` | 1,048,576 | $5.4 | $27 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入 |
| Kyma | `kyma/nemotron-3-ultra-550b` | 1,000,000 | $0.675 | $3.375 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/nemotron-3.5-super-vl` | 1,048,576 | $0.081 | $0.4725 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3-32b` | 32,768 | $0.108 | $0.378 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3-coder` | 131,072 | $0.3546 | $1.612 | 聊天；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3.6-plus` | 1,000,000 | $0.4388 | $2.633 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3.7-max` | 1,000,000 | $2.071 | $6.207 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3.7-plus` | 1,000,000 | $0.4325 | $1.731 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen-3.8-max` | 1,000,000 | $2.228 | $6.684 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen3.7-flash` | 1,000,000 | $0.0435 | $0.1886 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/qwen3.8-27b` | 1,000,000 | $0.3826 | $2.732 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Kyma | `kyma/qwen3.8-flash` | 1,000,000 | $0.2045 | $0.641 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/sonar` | 127,072 | $1.35 | $1.35 | 聊天；視覺；提示快取 |
| Kyma | `kyma/sonar-pro` | 200,000 | $4.05 | $20.25 | 聊天；視覺；提示快取 |
| Kyma | `kyma/step-3.7-flash` | 256,000 | $0.2229 | $1.282 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Kyma | `kyma/step-5-preview` | 1,048,576 | $1.35 | $3.645 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Mistral | `mistral/deepseek-v4-1-flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Mistral | `mistral/voxtral-mini-transcribe-3` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00005833 |
| Mistral | `mistral/voxtral-mini-transcribe-3-0` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00005833 |
| Mistral | `mistral/voxtral-mini-transcribe-realtime-3` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00013333 |
| Mistral | `mistral/voxtral-mini-transcribe-realtime-3-0` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00013333 |
| Mistral | `mistral/voxtral-mini-tts-3` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.000013 |
| Mistral | `mistral/voxtral-mini-tts-3-0` | - | - | - | 文字轉語音；`input_cost_per_character`: $0.000013 |
| Mistral | `mistral/voxtral-small-transcribe-3` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00006667 |
| Mistral | `mistral/voxtral-small-transcribe-3-0` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00006667 |
| Mistral | `mistral/zai-glm-5-3-flash` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Moonshot | `moonshot/kimi-k3.1-pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-dsv41flash` | 1,048,576 | $0.12 | $0.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-dsv41flash-1017` | 1,048,576 | $0.12 | $0.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-dsv41flash-abliterated` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-dsv4flash` | 1,048,576 | $0.141953 | $0.399625 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-glm53-744b` | 1,048,576 | $1.19 | $6 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-glm53flash` | 1,048,576 | $0.2 | $0.7 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-kimik3` | 1,048,576 | $2.5 | $14 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Morph | `morph/morph-kimik3-fast` | 1,048,576 | $6 | $22.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenAI | `gpt-6-astra-law` | 922,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenAI | `gpt-6-rosalind` | 922,000 | $15 | $75 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenAI | `gpt-6.1-terra` | 922,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenCode Go | `opencode_go/beam-free` | 1,048,576 | $0 | $0 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/claude-haiku-5-5` | 1,000,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/deepseek-v4-pro` | 1,000,000 | $1.32 | $3.96 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/deepseek-v4.1-flash` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/gemini-4-argon` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/glm-5.2` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/glm-5.3` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/glm-5.3-flash` | 1,000,000 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/gpt-5.6-luna` | 922,000 | $0.2 | $1.2 | 回應；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/gpt-6-luna` | 922,000 | $0.1 | $0.5 | 回應；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/grok-4.7` | 500,000 | $2 | $6 | 回應；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/hy3` | 192,000 | $0.14 | $0.58 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/hy4-preview` | 1,024,000 | $0.834 | $2.501 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/kimi-k2.7-code` | 262,144 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/kimi-k3` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/kimi-k3.1-pro` | 1,048,576 | $2 | $10 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/longcat-2.0` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/longcat-2.5-preview-free` | 1,000,000 | $0 | $0 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/mimo-v2.5` | 1,000,000 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/mimo-v2.5-pro` | 1,048,576 | $0.435 | $0.87 | 聊天；推理；工具呼叫 |
| OpenCode Go | `opencode_go/mimo-v2.6-flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/mimo-v2.6-pro` | 1,048,576 | $0.435 | $0.87 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/minimax-m3` | 1,000,000 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/minimax-m3.1-flash` | 1,000,000 | $0.15 | $0.6 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/muse-spark-1.2-contributor` | 1,048,576 | $0.1 | $0.2 | 回應；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/muse-spark-1.3-contributor` | 1,048,576 | $0.1 | $0.2 | 回應；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/qwen3.7-plus` | 1,000,000 | $0.4 | $1.6 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/qwen3.8-flash` | 1,000,000 | $0.15 | $0.47 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/qwen3.8-max` | 1,000,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫 |
| OpenCode Go | `opencode_go/step-5-preview` | 1,000,000 | $1 | $2.7 | 聊天；推理；視覺；工具呼叫 |
| Refuseless | `refuseless/deepseek-v4.1-flash-abliterated` | 1,048,576 | $0.14 | $0.5 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Refuseless | `refuseless/deepseek-v4.1-flash-fast` | 1,048,576 | $0.05 | $0.15 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Refuseless | `refuseless/glm-5.3-abliterated` | 1,048,576 | $1 | $2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Refuseless | `refuseless/glm-5.3-flash-abliterated` | 1,048,576 | $0.12 | $0.5 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Refuseless | `refuseless/minimax-m3.1-flash` | 1,048,576 | $0.05 | $0.25 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Soniox | `soniox/stt-rt-preview` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| Soniox | `soniox/stt-rt-preview-v2` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| Soniox | `soniox/stt-rt-v3` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| Soniox | `soniox/stt-rt-v3-preview` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| Soniox | `soniox/stt-rt-v4` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| Soniox | `soniox/stt-rt-v5` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00003333 |
| StreamLake | `streamlake/deepseek-r1` | 98,304 | $0.571 | $2.286 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/DeepSeek-V3` | 56,000 | $0.286 | $1.143 | 聊天；工具呼叫；提示快取 |
| StreamLake | `streamlake/deepseek-v3.1` | 98,304 | $0.571 | $1.714 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/deepseek-v4-flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/deepseek-v4-flash-0731` | 1,048,576 | $0.44 | $1.32 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| StreamLake | `streamlake/deepseek-v4-pro` | 1,048,576 | $1.74 | $3.48 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/DeepSeek-V4-Pro-0813` | 1,048,566 | $1.32 | $3.96 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| StreamLake | `streamlake/deepseek-v4.1-flash-1017` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/deepseek-v4.1-flash-260910` | 1,048,568 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/glm-5` | 202,752 | $1 | $3.2 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/glm-5.1` | 202,752 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/glm-5.2` | 1,048,566 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/GLM-5.3` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| StreamLake | `streamlake/GLM-5.3-Flash` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| StreamLake | `streamlake/Kimi-K2-Instruct-0905` | 224,000 | $0.571 | $2.286 | 聊天；工具呼叫；提示快取 |
| StreamLake | `streamlake/kimi-k2.6` | 262,144 | $0.95 | $4 | 聊天；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/kimi-k2.7-code` | 262,144 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/mimo-v2.6-flash` | - | $0.14 | $0.28 | 聊天；視覺；提示快取 |
| StreamLake | `streamlake/mimo-v2.6-pro` | - | $0.435 | $0.87 | 聊天；視覺；提示快取 |
| StreamLake | `streamlake/minimax-m2.5` | 196,608 | $0.3 | $1.2 | 聊天；推理；工具呼叫；提示快取 |
| StreamLake | `streamlake/minimax-m3` | 1,000,000 | $0.6 | $2.4 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/qwen3.5-397b-a17b` | 258,048 | $0.6 | $3.6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/qwen3.6-27b` | 229,376 | $0.6 | $3.6 | 聊天；視覺；工具呼叫 |
| StreamLake | `streamlake/qwen3.6-35b-a3b` | 229,376 | $0.375 | $2.25 | 聊天；視覺；工具呼叫 |
| StreamLake | `streamlake/qwen3.8-2.4t-a95b` | 983,616 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取 |
| StreamLake | `streamlake/qwen3.8-27b` | 983,616 | $0.5 | $3 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Tencent TokenHub | `tencent/seedream-image-v5.0-flash` | - | - | - | 影像生成；`output_cost_per_image`: $0.018 |
| Tencent TokenHub | `tencent/seedream-image-v5.0-lite` | - | - | - | 影像生成；`output_cost_per_image`: $0.035 |
| Tencent TokenHub | `tencent/seedream-image-v5.0-pro` | - | - | - | 影像生成；`output_cost_per_image`: $0.09 |
| Together AI | `together_ai/MiniMaxAI/MiniMax-M3.1-Flash` | 1,048,576 | $0.15 | $0.6 | 聊天；提示快取 |
| Weights and Biases | `wandb/reflection/Beam-1.0-501B-A23B` | 1,049,000 | $1 | $3 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Weights and Biases | `wandb/zai-org/GLM-5.3` | 1,049,000 | $1.2 | $4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Z.AI | `zai/glm-5v-turbo` | 200,000 | $1.2 | $4 | 聊天；推理；視覺；工具呼叫；提示快取 |
| ZeroGPU | `zerogpu/deepseek-v4.1-flash` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/glm-5.3-flash` | 1,048,576 | $0.1 | $0.35 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/gpt-4.1-mini` | 1,047,576 | $0.4 | $1.6 | 聊天；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/gpt-5.4-nano` | 272,000 | $0.2 | $1.25 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/gpt-5.6-luna` | 272,000 | $0.2 | $1.2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/gpt-6-luna` | 272,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| ZeroGPU | `zerogpu/gpt-oss-120b` | 128,000 | $0.15 | $0.6 | 聊天；推理；工具呼叫；結構化輸出 |
| ZeroGPU | `zerogpu/LFM2.5-1.2B-Instruct` | 32,768 | $0.02 | $0.05 | 聊天 |
| ZeroGPU | `zerogpu/LFM2.5-1.2B-Thinking` | 32,768 | $0.02 | $0.05 | 聊天 |
| ZeroGPU | `zerogpu/llama-3.1-8b-instruct-fast` | 131,072 | $0.15 | $0.28 | 聊天；工具呼叫；結構化輸出 |
| ZeroGPU | `zerogpu/llama-3.2-3b-instruct-fast` | 131,072 | $0.05 | $0.3 | 聊天 |
| ZeroGPU | `zerogpu/qwen3-30b-a3b-fp8` | 32,768 | $0.1 | $0.45 | 聊天；推理；工具呼叫；結構化輸出 |
| ZeroGPU | `zerogpu/qwen3.6-35b-a3b` | 262,144 | $0.2 | $1.5 | 聊天；推理；視覺；工具呼叫；結構化輸出 |

</details>

### 新增提供者 {#new-providers}

- 新增 ai& 為 `aiand/` 前綴之下的 OpenAI 相容提供者，讀取 `AIAND_API_KEY`，列在 Add Model 表單中，帶有已定價模型與原生 `/v1/responses` 和 `/v1/messages` - [PR #38958](https://github.com/BerriAI/litellm/pull/38958)
- 新增 CLF AI Gateway 為 `clf_ai_gateway/` 前綴之下的 OpenAI 相容提供者，讀取 `CLF_AI_GATEWAY_API_KEY`，列在 Add Model 表單中，帶有十個已定價模型 - [PR #39324](https://github.com/BerriAI/litellm/pull/39324)
- 新增 StreamLake 為 `streamlake/` 前綴之下的 OpenAI 相容提供者，帶有 26 個已定價模型，可從設定或 Add Model 頁面新增 - [PR #41006](https://github.com/BerriAI/litellm/pull/41006)
- 新增 OpenInfer 為 `openinfer/` 前綴之下的 OpenAI 相容提供者，帶有已定價模型與原生 `/v1/responses` 和 `/v1/messages` - [PR #41034](https://github.com/BerriAI/litellm/pull/41034)
- 新增 ZeroGPU 為 `zerogpu/` 前綴之下的 OpenAI 相容提供者，帶有 13 個已定價模型、原生 `/v1/responses` 與 Add Model 項目 - [PR #43874](https://github.com/BerriAI/litellm/pull/43874)
- 新增 Hostinger Router 為 `hostinger_router/` 前綴之下的 OpenAI 相容提供者，支援 chat、responses、messages 與 embeddings，價格來自 Hostinger 的公開目錄 - [PR #44863](https://github.com/BerriAI/litellm/pull/44863)
- 新增帶有花費追蹤的 eu/jev decision API pass-through，使呼叫在模型存取檢查與每分鐘請求限制之下使用虛擬金鑰，並被記錄與計價 - [PR #46875](https://github.com/BerriAI/litellm/pull/46875)
- 新增 OpenCode Go 為提供者，可在 chat completions、Responses 與 Messages 之間為每個模型選取正確的上游 API，帶有已發佈的 Go 價格與即時模型探索 - [PR #48140](https://github.com/BerriAI/litellm/pull/48140)
- 新增 Refuseless 為 `refuseless/` 前綴之下的 OpenAI 相容提供者，帶有 Chat Completions 與原生 `/v1/responses` 路由和五個已定價模型 - [PR #48497](https://github.com/BerriAI/litellm/pull/48497)
- 在 `bigmodel/` 前綴之下新增 BigModel，支援 Chat Completions、Responses 與 Anthropic Messages，讀取 `BIGMODEL_API_KEY`，帶有 GLM-5.3、Flash 與 FlashX 定價和 Admin UI 憑證表單 - [PR #48563](https://github.com/BerriAI/litellm/pull/48563)
- 新增 Kyma API 為 `kyma/` 前綴之下的 OpenAI 相容提供者，依 Kyma 回報的 `usage.cost` 計費，以 83 個目錄列作為備援價格，並在呼叫 Kyma 之前拒絕圖片與音訊路由 - [Commit cd42694](https://github.com/BerriAI/litellm/commit/cd42694b48e30ab74ba6e24e83aabf4b40c041b5)

### Decisions 提供者 {#decisions-providers}

- 新增 Nace Drex 為 Decisions 提供者，列在 Add Model 表單中，帶有 Drex 模型與決策模型連線測試 - [PR #46523](https://github.com/BerriAI/litellm/pull/46523)
- 支援 `azure_ai` Microsoft-Decision-1 在 `/v1/decisions` 與 `/v1/systemone` 上使用 Entra ID 驗證，不再需要 API 金鑰 - [PR #46539](https://github.com/BerriAI/litellm/pull/46539)
- 未定價的回傳 TypeSafe 版本改依請求模型的費率計費而非 $0，且格式錯誤的 System One 回覆以 500 指出缺失或為 null 的 `answers` 欄位 - [PR #47508](https://github.com/BerriAI/litellm/pull/47508)
- 移除單一 System One 請求可攜帶的問題數量上限 - [Commit 1e6dc81](https://github.com/BerriAI/litellm/commit/1e6dc8176929b065fbb77dcbbf3416c3068fad04)
- 將 `gpt-6-luna` Decisions 快取費率設為標準的快取與 30 分鐘寫入費率，使快取讀取以每 100 萬個 token 0.01 USD 計費 - [PR #48066](https://github.com/BerriAI/litellm/pull/48066)
- 原生 Decisions 呼叫缺少的 token 使用量與 SDK 成本維持未知，不再回報零 token 與 $0 成本 - [PR #48261](https://github.com/BerriAI/litellm/pull/48261)
- 在 Decisions 路由與 SDK 呼叫上新增 LM Studio 決策模型，透過 LM Studio 的原生 System One 端點，帶有可選的 bearer 驗證 - [PR #48448](https://github.com/BerriAI/litellm/pull/48448)
- 將 `/v1/decisions` 與 `/v1/systemone` 請求傳送到自訂後端的 `base_url`，不再回傳誤導性的驗證錯誤 - [PR #48505](https://github.com/BerriAI/litellm/pull/48505)
- Decisions 回應中缺少的 choice 與 score 機率維持缺失，同時保留明確的 `0.0` 值 - [PR #48524](https://github.com/BerriAI/litellm/pull/48524)
- 在 `transform_decisions_response` 中處理來自 Decisions 提供者的無效 JSON body，不再引發未處理的 `ValidationError` - [PR #48662](https://github.com/BerriAI/litellm/pull/48662)
- 在 Decisions 端點與 Python SDK 上支援 Ollama 決策模型，無需 hosted-vLLM 的因應做法，並在花費記錄中將兩個 Ollama 前綴都保留為提供者 - [PR #48871](https://github.com/BerriAI/litellm/pull/48871)

### ai& {#ai}

- 在 Admin UI 中以名稱與標誌顯示 ai&，在退役日期將已退役的 ai& 模型從 `aiand/*` 清單與健康檢查中移除，並為 `deepseek-v4.1-flash-1017` 與 `meta/muse-spark-open` 定價 - [PR #49158](https://github.com/BerriAI/litellm/pull/49158)

### Amazon Bedrock {#amazon-bedrock}

- 從 Bedrock Voxtral 轉錄中省略 system prompt 並回報其 token 使用量，使 `/v1/audio/transcriptions` 不再回應 400，花費也不再是 $0 - [PR #41565](https://github.com/BerriAI/litellm/pull/41565)
- 將沒有 Invoke 提供者的 Bedrock 模型 ID 路由到 Converse，使成本對應表中缺少的模型不再回應 404 `Unknown provider=None` - [PR #43290](https://github.com/BerriAI/litellm/pull/43290)
- 將 Converse 上 Kimi K3 的 `maxTokens` 提高到 Bedrock 的最小值 16，使 Claude Code 以 `max_tokens: 1` 進行的 `/model` 檢查不再回應 400 - [PR #43875](https://github.com/BerriAI/litellm/pull/43875)
- 從不帶 `safeguards` 的 Bedrock Invoke 請求中丟棄 `dangerous-tool-use-2026-09-03` beta，使 Claude Code 自動模式不再得到 400 `invalid beta flag` - [PR #44471](https://github.com/BerriAI/litellm/pull/44471)
- 格式錯誤的 Bedrock 批次 JSONL 輸入改回應指出錯誤行的 400，而非帶有原始 Python 錯誤的 500 - [PR #45992](https://github.com/BerriAI/litellm/pull/45992)
- 停止 `mode: chat` 或 `mode: responses` 的 Mantle 部署改寫其同層部署的路由，使每個部署自身的 `model_info.mode` 決定使用 Chat Completions 或 Responses API - [PR #46263](https://github.com/BerriAI/litellm/pull/46263)
- 在假串流上保留 reasoning、thinking 區塊與 `reasoning_tokens`，並讓 JSON 模式假串流以 `stop` 結束，而非在沒有工具呼叫時以 `finish_reason="tool_calls"` 結束 - [PR #46863](https://github.com/BerriAI/litellm/pull/46863)
- 在 Bedrock Haiku 5.5 與 Sonnet 5.5 上使用原生結構化輸出，並停止 Fable 5 的 JSON schema 請求與 Sonnet 4.6 的 `minimum` 類限制出現的 400 - [PR #46870](https://github.com/BerriAI/litellm/pull/46870)
- 在 Bedrock Opus 4.8 與 Sonnet 5 上先傳送原生結構化輸出，使 `json_schema` 請求保留其 reasoning，並在 Bedrock 拒絕原生請求時以 json 工具重試一次 - [PR #47100](https://github.com/BerriAI/litellm/pull/47100)
- 將 Bedrock、us-gov 與 Bedrock Mantle 的 gpt-oss 列標記為 `supports_vision: false`，使 auto router 的 `modality_routing` 將圖片請求傳送到視覺層級，而非得到 Bedrock 400 - [PR #48149](https://github.com/BerriAI/litellm/pull/48149)
- `bedrock/claude_platform/<model>` 呼叫改依其自身的成本對應表列以 Claude API 費率計價，使 Claude Platform on AWS 請求不再記錄 $0 花費 - [PR #48150](https://github.com/BerriAI/litellm/pull/48150)
- 依 Bedrock 模型卡為 `amazon.nova-2-5-sonic` 與 `amazon.nova-2-sonic-v1:0` 設定 context window 與最大輸出限制 - [PR #48247](https://github.com/BerriAI/litellm/pull/48247)
- 將 `global.openai.gpt-6.1-terra` 與 `us.openai.gpt-6.1-terra` Bedrock 推論設定檔加入成本對應表 - [PR #48441](https://github.com/BerriAI/litellm/pull/48441)
- 將 Bedrock OpenAI GPT 列的 `max_input_tokens` 修正為 922000，並為兩個 `bedrock_mantle` 的 `claude-opus-5-5` 列加入 `token_count_model` - [PR #48479](https://github.com/BerriAI/litellm/pull/48479)
- 為三個 Mantle 原生 Claude 模型加入 `token_count_model`，使其 token 計算在允許的區域中執行 - [PR #48682](https://github.com/BerriAI/litellm/pull/48682)
- 當 Bedrock 拒絕 strict 工具 schema 且 `drop_params` 開啟時，改為不帶 `strict` 重試，而非回傳 400 - [Commit a0c490e](https://github.com/BerriAI/litellm/commit/a0c490ea5471c8ef2c09b26e0ea744fe1de9961a)
- 將 `bedrock/<region>/<embedding model>` 以裸模型 ID 路由到該區域並依該區域的價格計費，使 AWS 不再以 `The provided model identifier is invalid` 拒絕 - [PR #49072](https://github.com/BerriAI/litellm/pull/49072)
- 為 Bedrock 區域列補上已發佈但缺失的 Priority、Batch 與 Flex 價格，使分層請求依 AWS 的費率計費，而非備援到 Standard - [PR #49113](https://github.com/BerriAI/litellm/pull/49113)
- 將 `bedrock_mantle/openai.gpt-5.6-cyber` 的限制與支援端點與其 Bedrock 模型卡對齊 - [PR #49350](https://github.com/BerriAI/litellm/pull/49350)
- 還原 `eu.anthropic.claude-haiku-4-5-20251001-v1:0` 成本對應表列，使 EU Bedrock 呼叫依 EU 價格計費，精確名稱查詢也恢復運作 - [PR #49375](https://github.com/BerriAI/litellm/pull/49375)
- 將兩個 GovCloud West Llama 3 列的最大輸出 token 提高到其模型卡上的 8K - [PR #49543](https://github.com/BerriAI/litellm/pull/49543)
- Bedrock Invoke 與 Mantle Claude 的 `max_tokens` 預設改為部署的 `model_info.max_output_tokens`，其次是對應的模型限制，使長回答不再被截斷在 4096，Haiku 4.5 也不再回應 400 - [PR #49692](https://github.com/BerriAI/litellm/pull/49692)

### Anthropic {#anthropic}

- 停止在帶有工具呼叫或非文字區塊的 Claude assistant 回合中加入 `[System: ...]` 佔位內容，使模型不再將其回響出來 - [PR #34822](https://github.com/BerriAI/litellm/pull/34822)
- 當請求使用 compaction、thinking display 與 tool change beta 時，為 `vertex_ai` 與 `azure_ai` 上的 Claude 加入這些 beta，使這些請求不再回應 400 - [PR #44747](https://github.com/BerriAI/litellm/pull/44747)
- 在 `/v1/chat/completions` 上將 PDF `image_url` 內容以文件區塊傳送給 Claude（包含以額外 content type 參數提供的 PDF），而非 Anthropic 與 Vertex AI 會以 400 拒絕的圖片區塊 - [PR #46984](https://github.com/BerriAI/litellm/pull/46984)
- 修復 Claude `json_schema` 回答丟棄只列在 `required` 中的金鑰、回來時只解開一半、跳脫非 ASCII 文字，或在截斷的串流上遺失結尾大括號的問題 - [PR #47478](https://github.com/BerriAI/litellm/pull/47478)
- 在每條 Claude 路由的 assistant 訊息中保留 `redacted_thinking` 內容項目，使 Claude 收到它，Bedrock Converse 也不再因區塊重複而回應 400 - [PR #47489](https://github.com/BerriAI/litellm/pull/47489)
- 將成本對應表中缺少的 Anthropic 模型的備援 `max_tokens` 從 4096 提高到 128000，`DEFAULT_ANTHROPIC_CHAT_MAX_TOKENS` 仍可覆寫它 - [PR #48502](https://github.com/BerriAI/litellm/pull/48502)
- 從 `claude-opus-4-7` 移除 `supports_speed`，使 `drop_params` 丟棄 `speed`，請求得以通過，而非在快速模式移除後得到 Anthropic 的 400 - [PR #48764](https://github.com/BerriAI/litellm/pull/48764)
- 當傳送 `thinking.block_binding` 或設為 `updates` 的 `display` 時加入 thinking beta，並在 `drop_params` 之下丟棄其他受 beta 控管的 body 欄位（例如 `clear_at`），使呼叫不再得到 Anthropic 的 400 - [PR #48793](https://github.com/BerriAI/litellm/pull/48793)
- 將 Anthropic 的 `model_context_window_exceeded` 停止原因對應到 chat 上的 `length` 與 Responses 上的 `incomplete`，而非回報正常的 `stop` - [PR #48874](https://github.com/BerriAI/litellm/pull/48874)
- 將 Claude 的 `pause_turn` 對應到 chat 上的 `length`，在 `message.refusal`、`delta.refusal` 與 Responses 的 `refusal` 部分中回傳拒絕的說明，並允許重新傳送暫停的回合 - [PR #49192](https://github.com/BerriAI/litellm/pull/49192)
- 當傳送給 Claude 的 `role` 或工具呼叫 ID 不是字串時，回應指出錯誤欄位的 400，而非 500 `unhashable type` 錯誤 - [PR #49237](https://github.com/BerriAI/litellm/pull/49237)

### Azure {#azure}

- 透過傳送文字部分而非單一扁平字串，在 Foundry chat completions 上保留 OpenAI 提示快取中斷點，使明確快取模式能快取重複內容 - [PR #45299](https://github.com/BerriAI/litellm/pull/45299)
- 將 Azure `/v1/responses` 路由繞過日期固定的 `api_version`、在 `azure_ai` 上計算 Grok reasoning token、在 `register_model` 後重新整理提供者集合，並停止在 `gpt-6.1-sol` 上宣傳 `reasoning_effort: none` - [PR #46377](https://github.com/BerriAI/litellm/pull/46377)
- 在 Responses 路徑上重用快取的 Entra token 提供者，使 Azure Responses 呼叫不再於每個請求取得新 token 並阻塞代理程式的事件迴圈 - [PR #46421](https://github.com/BerriAI/litellm/pull/46421)
- 無論部署名稱為何，都為非串流 `azure_ai` 呼叫計算 Grok reasoning token，而非在名稱不含 grok 時少計費 - [PR #46969](https://github.com/BerriAI/litellm/pull/46969)
- 快取 Azure Entra 使用者名稱與密碼、Bing grounding 與 OIDC 備援 token 提供者，並在事件迴圈之外取得 token，使呼叫不再每次付出阻塞式 AAD 往返的代價 - [PR #47348](https://github.com/BerriAI/litellm/pull/47348)
- 將 `azure_ai/MAI-Code-1.1-Flash` 加入成本對應表，帶有來自 Azure 的輸入、快取輸入與輸出價格 - [PR #47779](https://github.com/BerriAI/litellm/pull/47779)
- 從 `azure_ai` chat 的工具訊息中丟棄 `tool_reference` 部分，使路由到 Foundry 上非 Claude 模型的 Claude Code 工作階段在 ToolSearch 執行後不再以 400 失敗 - [PR #48032](https://github.com/BerriAI/litellm/pull/48032)
- 將 `thinking-binding-controls-2026-08-01` beta 標頭轉送給 Azure AI Foundry 上的 Claude，使 `/v1/messages` 上的 `thinking.block_binding` 不再回應 400 - [PR #48033](https://github.com/BerriAI/litellm/pull/48033)
- 接受 Azure `/v1/responses` 部署的明確 v1 base URL - [Commit 96abce8](https://github.com/BerriAI/litellm/commit/96abce842b9e90a51c1c7e44f297379d9f9f072d)
- 將 `azure/gpt-chat-latest`、`azure/us/gpt-chat-latest` 與 `azure_ai/gpt-chat-latest` 的 `max_input_tokens` 設為 128000（從 272000 下調），以符合 Azure 模型頁面 - [PR #48252](https://github.com/BerriAI/litellm/pull/48252)
- 將 `azure_ai/Microsoft-Decision-1` 的 `max_input_tokens` 設為 32768 - [PR #48434](https://github.com/BerriAI/litellm/pull/48434)
- 在兩個日期版 Azure 音訊模型上宣告音訊輸入與輸出支援，使模型中繼資料不再回傳 null 音訊能力 - [PR #48475](https://github.com/BerriAI/litellm/pull/48475)
- 在 `/openai/v1/decisions` 新增 `azure/` Decisions 支援，未設定 API 金鑰時使用帶有可重新整理 token 提供者的 Entra 憑證，並保持 Azure API 金鑰可用 - [PR #48529](https://github.com/BerriAI/litellm/pull/48529)
- 將 Azure 的 `context_length_exceeded` 錯誤代碼對應到 `ContextWindowExceededError`，使 `context_window_fallbacks` 能為 chat completions、Responses 與 embeddings 執行 - [PR #48616](https://github.com/BerriAI/litellm/pull/48616)
- 在一波 Azure 請求之間，每個 worker 共用一次 Entra token 請求，而非在冷啟動時與 token 最後五分鐘內每個請求各取得一次 - [PR #48769](https://github.com/BerriAI/litellm/pull/48769)
- 為未版本化的 `azure/o3`、`azure/o4-mini`、`azure/o3-mini`、`azure/gpt-4o` 與 `azure/gpt-4o-mini` 列加入 Batch API 價格，使這些別名上的批次呼叫不再依標準費率計費 - [PR #49182](https://github.com/BerriAI/litellm/pull/49182)

### Baseten {#baseten}

- 將 `reasoning_effort` 轉送給 Baseten Model API，而非丟棄或引發錯誤，使呼叫者能控制 Kimi K3、DeepSeek V4、GLM 與 gpt-oss 的思考投入 - [PR #40152](https://github.com/BerriAI/litellm/pull/40152)
- 從成本對應表列出 `baseten/*` 目前的 Baseten Model API 並遵循 `check_provider_endpoint: true`，而非三個已退役的 2023 年部署 ID - [PR #46945](https://github.com/BerriAI/litellm/pull/46945)
- 將 `baseten/reflection/Beam-1.0` 價格下調為每 100 萬個 token 輸入 0.40 USD、輸出 1.20 USD、快取輸入 0.04 USD，以符合 Baseten models API - [PR #47784](https://github.com/BerriAI/litellm/pull/47784)
- 新增 `baseten/decision-models/baseten-elephant-9b-latest` 與 `baseten/decision-models/baseten-mammoth-27b-latest` Decisions 模型，輸入為 $0 - [PR #48453](https://github.com/BerriAI/litellm/pull/48453)
- 將 `baseten-elephant-9b-latest` 與 `baseten-mammoth-27b-latest` 決策模型改依其已發佈的輸入費率計價，而非 $0 - [PR #48849](https://github.com/BerriAI/litellm/pull/48849)
- 新增 `baseten/decision-models/baseten-joey-2b-latest`，處於 `decisions` 模式，帶有 16384 個輸入 token、視覺支援、每 100 萬個輸入 token 0.01 USD 且不收輸出費用 - [PR #49123](https://github.com/BerriAI/litellm/pull/49123)

### Cerebras {#cerebras}

- 新增 `cerebras/llama-3.1-8b` 與 `cerebras/llama-3.1-70b` 帶連字號的模型名稱，使兩種拼法都能得到成本追蹤 - [PR #48158](https://github.com/BerriAI/litellm/pull/48158)

### ChatGPT {#chatgpt}

- 透過閘道轉送用戶端自己的 ChatGPT 訂閱，使 Codex 與 Pi 在使用另一個閘道金鑰的同時保留其 ChatGPT 登入，帳號互相隔離且 token 永不保存 - [PR #41522](https://github.com/BerriAI/litellm/pull/41522)
- 使用穩定的 `prompt_cache_key` 作為上游 ChatGPT 工作階段 ID，使重複回合重用同一個工作階段與其提示快取 - [PR #42014](https://github.com/BerriAI/litellm/pull/42014)
- 為圖片生成轉送呼叫者的 ChatGPT 登入與工作區，使 Codex 圖片請求在呼叫者已提供憑證時不再要求互動式驗證 - [PR #48522](https://github.com/BerriAI/litellm/pull/48522)
- 將具型別的 `system` 輸入項目以 `developer` 傳送給 Codex 後端，使 ChatGPT 訂閱模型不再以 `400 System messages are not allowed` 失敗 - [PR #48668](https://github.com/BerriAI/litellm/pull/48668)

### Cloudflare {#cloudflare}

- 澄清 Cloudflare chat 端點警告，說明 chat 改寫以 `/ai/v1` 為目標，而 Decisions 模型仍使用 `/ai/run/{model}` - [PR #48265](https://github.com/BerriAI/litellm/pull/48265)

### Cohere {#cohere}

- 將字串 `stop` 以單一項目的 `stop_sequences` 清單傳送給 Cohere chat 與 v2 chat，符合 Cohere API 的預期，而非轉送裸字串 - [PR #47091](https://github.com/BerriAI/litellm/pull/47091)
- 從 Cohere v2 的 `tool-call-start` 與 `tool-call-delta` chunk 發出帶有 id、名稱與引數的串流工具呼叫，使 `cohere/command-a-plus-05-2026` 等模型上的代理程式能在開啟 `stream` 時使用工具 - [PR #47794](https://github.com/BerriAI/litellm/pull/47794)

### DashScope {#dashscope}

- 明確的 Qwen 快取命中依其自身的 `explicit_cache_read_input_token_cost` 計費，明確快取寫入為 `qwen3.7-max` 以 125% 計費，而非每個命中都依隱含費率計價 - [PR #45567](https://github.com/BerriAI/litellm/pull/45567)
- 從單一網域憑證衍生 OpenAI、Anthropic 與原生 DashScope base，並將 `/v1/messages` 傳送到 DashScope 根或 `/apps/anthropic` base 的原生 API，而非回傳 404 - [PR #47812](https://github.com/BerriAI/litellm/pull/47812)
- 在 `/v1/images/edits` 新增 DashScope 圖片編輯、在 `/v1/audio/speech` 新增文字轉語音，帶有 Qwen 圖片與 TTS 定價，並在每個提供者上依部署自身的圖片價格計算圖片編輯費用 - [PR #48998](https://github.com/BerriAI/litellm/pull/48998)

### Databricks {#databricks}

- 為 `/v1/messages` 上的 Databricks Claude 呼叫工作區的原生 Messages 路由，使 `safeguard_results` 能到達自動模式，拒絕 `safeguards` 的平台在 `drop_params` 之下也不再回應 400 - [PR #46091](https://github.com/BerriAI/litellm/pull/46091)
- 將 Databricks Claude 的 `json_schema` 回答以文字串流，而非內部的 `json_tool_call` 工具呼叫，帶有有效的 JSON 並以 `stop` 作為完成原因 - [PR #47424](https://github.com/BerriAI/litellm/pull/47424)
- 為 decisions 請求重用 Databricks OAuth M2M token 交換，使帶有 OAuth 憑證且沒有靜態金鑰的 `/v1/decisions` 不再回傳 401 - [PR #48527](https://github.com/BerriAI/litellm/pull/48527)
- 將 `databricks/databricks-openjev-qwen35-4b` 定價為每 100 萬個輸入 token 0.6 DBU，使 `/v1/decisions` 與 `/v1/systemone` 呼叫不再記錄 $0 花費 - [PR #48694](https://github.com/BerriAI/litellm/pull/48694)
- 將 Databricks 成本對應表列與定價頁面同步，新增 19 個缺失的端點、長上下文費率與 `databricks-typesafeai-jev-1-14-0`，並修復 21 個過時價格 - [PR #48884](https://github.com/BerriAI/litellm/pull/48884)
- 為 31 個 Databricks 成本對應表列加入 priority 逐 token 價格，使 priority 請求不再依標準費率計費 - [PR #48891](https://github.com/BerriAI/litellm/pull/48891)
- 為 `databricks-deepseek-v4-flash-0731`（2026-11-05）、`databricks-deepseek-v4-pro-0813`（2026-10-30）與 `databricks-inkling` 在成本對應表中加入退役日期 - [PR #49124](https://github.com/BerriAI/litellm/pull/49124)

### DeepSeek {#deepseek}

- 將 `reasoning_effort` 傳遞給 DeepSeek，而非默默使用提供者預設值，明確的 `thinking` 設定仍優先 - [PR #38736](https://github.com/BerriAI/litellm/pull/38736)
- 在 `/v1/messages` 上將 Anthropic 標頭轉送給 DeepSeek，使上傳圖片的請求不再以缺少標頭錯誤失敗 - [PR #46959](https://github.com/BerriAI/litellm/pull/46959)
- 新增 DeepSeek 為 `/v1/search` 提供者，帶有 `search_provider: deepseek`，讀取 `DEEPSEEK_API_KEY`，定價為每次查詢 0.00075 USD，組合查詢超過 DeepSeek 的 128 字元上限時回應 400 - [PR #47401](https://github.com/BerriAI/litellm/pull/47401)

### Fireworks AI {#fireworks-ai}

- 再次將 `fireworks_ai/minimax-m3` 標記為視覺模型，使圖片請求不再回應 400 - [PR #43390](https://github.com/BerriAI/litellm/pull/43390)
- 為 `fireworks_ai/accounts/fireworks/models/muse-spark-open` 加入 priority 層級價格與 reasoning 旗標 - [PR #47785](https://github.com/BerriAI/litellm/pull/47785)
- 從其基礎模型為五個 Fireworks spot router 列補上 `max_output_tokens`、reasoning、response schema 與 tool choice 支援以及 `deprecation_date` - [PR #48858](https://github.com/BerriAI/litellm/pull/48858)
- 新增 `fireworks_ai/accounts/fireworks/models/ultramarine-1-flash-us`，每 100 萬個 token 輸入 0.225 USD、輸出 0.75 USD，帶有 1048576 個 token 的 context，並為 DeepSeek V4 Flash 標準列標註日期 - [PR #49146](https://github.com/BerriAI/litellm/pull/49146)

### FriendliAI {#friendliai}

- 從傳送給 FriendliAI 的訊息中丟棄 `thinking_blocks`、`reasoning_items` 與 `provider_specific_fields`，使工具呼叫後的 Claude Code 回合不再失敗 - [PR #45092](https://github.com/BerriAI/litellm/pull/45092)

### Gemini and Vertex AI {#gemini-and-vertex-ai}

- 在 Vertex AI 與 AI Studio 上新增 Gemini 3.1 Flash TTS，帶有雙講者語音，並透過 Google Cloud Text-to-Speech 從 Vertex 傳送 mp3、opus、alaw 與 mulaw 語音 - [PR #31915](https://github.com/BerriAI/litellm/pull/31915)
- Gemini 3 取樣淘汰通知改為每個模型每個 worker 記錄一次，而非在每個請求以 WARNING 記錄 - [PR #40868](https://github.com/BerriAI/litellm/pull/40868)
- 每次 Gemini TTS `/v1/audio/speech` 請求只呼叫 Google 一次並記錄其 token 與成本，使花費記錄不再顯示 0 個 token，回呼也不再觸發兩次 - [PR #44551](https://github.com/BerriAI/litellm/pull/44551)
- 將 context cache 清單與建立呼叫傳送到自訂 `api_base` 之下的 `cachedContents` 集合，使 Gemini 與 Vertex AI 快取能透過閘道運作 - [PR #44783](https://github.com/BerriAI/litellm/pull/44783)
- 將整數列舉以帶有字串值的 INTEGER 傳送給 Gemini 3 與更新版本，而非丟棄，使工具參數維持在列出的值之內 - [PR #44908](https://github.com/BerriAI/litellm/pull/44908)
- 重用已知的 Vertex AI 與 Gemini context cache 直到 `expireTime` 前不久，而非在每個請求列出所有 `cachedContents` 或為並行請求建立重複項目 - [PR #46857](https://github.com/BerriAI/litellm/pull/46857)
- 只有在文字含有獨立的 `403` 時才將 Vertex 錯誤對應到 403，使請求 ID 含有 `4039` 的 429 維持為速率限制，重試繼續運作 - [PR #47134](https://github.com/BerriAI/litellm/pull/47134)
- 新增 `LITELLM_GEMINI_DEFAULT_MAX_OUTPUT_TOKENS`，為沒有限制的文字請求設定輸出預算，上限為成本對應表的 `max_output_tokens` - [PR #47542](https://github.com/BerriAI/litellm/pull/47542)
- 在 Gemini 與 Vertex AI 上遵循 `supports_sampling_params`，並標記 Gemini 3.6 Flash、3.5 Flash-Lite 與更新版本，使 `temperature`、`top_p` 與 `top_k` 回應 400，除非設定了 `drop_params` - [PR #47645](https://github.com/BerriAI/litellm/pull/47645)
- 新增可選的 `thought_signature_in_tool_call_id: false`，讓 Gemini 工具呼叫 ID 保持簡短，並將 thought signature 移到 `provider_specific_fields`，供限制 ID 長度的用戶端使用 - [PR #47692](https://github.com/BerriAI/litellm/pull/47692)
- 為已退役的 `vertex_ai/veo-2.0-generate-001` 加入 `deprecation_date` 2026-06-30 - [PR #47847](https://github.com/BerriAI/litellm/pull/47847)
- 為 `vertex_ai/meta/llama-4-scout-17b-128e-instruct-maas` 與 `vertex_ai/meta/llama-4-maverick-17b-16e-instruct-maas` 加入 Batch 費率，使 Vertex 批次工作不再依隨需費率計費 - [PR #48085](https://github.com/BerriAI/litellm/pull/48085)
- `gemini-2.5-flash-native-audio-preview-12-2025` 的影片輸入改依每 100 萬個 token $3 的音訊與影片費率計費，而非文字費率 - [PR #48248](https://github.com/BerriAI/litellm/pull/48248)
- 將圖片工具結果以較舊的支援格式傳送給 Gemini 2.5，使其不再被拒絕，同時為 Gemini 3 與更新版本保留巢狀媒體 - [PR #48428](https://github.com/BerriAI/litellm/pull/48428)
- 在 Vertex AI rerank 請求之間重用 Google 憑證，而非在每次呼叫時重新載入並重新整理 - [PR #48430](https://github.com/BerriAI/litellm/pull/48430)
- 將共用的 Vertex AI 憑證快取上限設為既有的 LRU 大小限制，而非無限期保留每組憑證與專案配對 - [PR #48442](https://github.com/BerriAI/litellm/pull/48442)
- 在 Vertex AI 生成與編輯時，將請求的圖片大小對應到支援的長寬比，並傳送對應的解析度給 Gemini，而非默默產生方形圖片 - [PR #48463](https://github.com/BerriAI/litellm/pull/48463)
- 讓 Vertex AI Claude `/v1/messages` 驗證離開事件迴圈，使緩慢的 Google 憑證請求不再拖住健康檢查與鄰近請求 - [PR #48523](https://github.com/BerriAI/litellm/pull/48523)
- 保留 Gemini 附加在 grounded 段落上的每個網路來源作為註解，包含非網路來源排在前面時，而非只保留第一個 - [PR #48745](https://github.com/BerriAI/litellm/pull/48745)
- Vertex AI Claude 的 `labels` 改在 `X-Vertex-AI-Labels` 標頭中傳送，而非請求 body，使帶有 `labels` 的呼叫不再以 400 失敗 - [PR #48753](https://github.com/BerriAI/litellm/pull/48753)
- 讀取 Google `countTokens` 與 `generateContent` 中重複欄位的單一物件、`null` 與 null 項目寫法，使 Vertex AI 接受的 body 不再回應 400 - [PR #48771](https://github.com/BerriAI/litellm/pull/48771)
- 為 `gemini-2.5-pro` 與 `gemini-3.1-pro-preview` 加入 200k token 以上的 Vertex AI Batch 價格，並為 Gemini 圖片模型加入 Batch 圖片輸出 token 價格 - [PR #48945](https://github.com/BerriAI/litellm/pull/48945)
- 在 `gemini/gemini-4-argon`、`gemini/gemini-3.8-flash`、`gemini/gemini-3.5-flash-lite` 與 `gemini/gemini-3-flash-preview`（Gemini computer use 文件列出的模型）上標記 `supports_computer_use` - [PR #49252](https://github.com/BerriAI/litellm/pull/49252)
- 為 `gemini/gemini-nano-banana-2.1` 與 `gemini/gemini-3.1-flash-lite-image` 加入 Batch 圖片輸出價格（`output_cost_per_image_token_batches`），使批次圖片生成不再依 Standard 費率計費 - [PR #49317](https://github.com/BerriAI/litellm/pull/49317)
- 為 `gemini/gemini-2.5-flash-image` 加入 Batch、Flex 與 Priority 文字輸出價格，使這些層級的文字與 thinking 輸出不再依 Standard 費率計費 - [PR #49358](https://github.com/BerriAI/litellm/pull/49358)

### GitHub Copilot {#github-copilot}

- 將格式錯誤的 `api-key.json` 視同缺失，使登入保存一組新金鑰，而非每個 Copilot 請求都以剖析錯誤失敗 - [PR #44723](https://github.com/BerriAI/litellm/pull/44723)
- 在每位使用者的 Copilot 憑證上新增可選的 `github_copilot_host`，使 GHE.com 使用者能透過 device flow 與 token 交換連線 - [PR #47610](https://github.com/BerriAI/litellm/pull/47610)
- 為 `github_copilot/claude-opus-4.8-fast` 加入 2026-11-16 淘汰日期 - [PR #48251](https://github.com/BerriAI/litellm/pull/48251)
- 新增 `github_copilot/gpt-6.1-terra`，並將 Copilot gpt-6 列的 `max_input_tokens` 提高到 922000 - [PR #48450](https://github.com/BerriAI/litellm/pull/48450)

### Groq {#groq}

- 從送出的歷史中移除僅供回應的 reasoning，使重播串流的 Groq reasoning 回覆在下一個回合不再回傳 HTTP 400 - [PR #48268](https://github.com/BerriAI/litellm/pull/48268)

### Mistral {#mistral}

- 將 `prompt_cache_key` 轉送給 `*.mistral.ai` 主機，並將 `reasoning_effort` 物件以其 level 傳送，而非回應 400 與 500 - [PR #47432](https://github.com/BerriAI/litellm/pull/47432)
- 將 `mistral/zai-glm-5-3-flash` 加入成本對應表，使呼叫被計費而非記錄為 $0，`reasoning_effort` 也不再以 400 被拒絕 - [PR #48270](https://github.com/BerriAI/litellm/pull/48270)
- 對支援 reasoning 的模型，將先前 assistant 回合的 reasoning 以 `content` 中的 thinking chunk 重播給 Mistral，其餘模型則繼續丟棄 - [Commit 7abff3d](https://github.com/BerriAI/litellm/commit/7abff3dd63893f372818bcc91d5e1e48fae6afa5)
- 在上市促銷結束後，將 Mistral Large 4 定價為其定價：每 100 萬個 token 輸入 $1.36、快取輸入 $0.14、輸出 $4.18 - [PR #48825](https://github.com/BerriAI/litellm/pull/48825)
- 新增 `mistral/deepseek-v4-1-flash-1017` 成本對應表列，使 LiteLLM 能為 Mistral 提供的 DeepSeek V4.1 Flash 1017 定價 - [PR #48879](https://github.com/BerriAI/litellm/pull/48879)

### Morph {#morph}

- 在 Morph 開放權重 chat 模型上接受工具、結構化輸出與 reasoning 控制，並新增八個帶有快取輸入定價的 Morph 模型 - [PR #48676](https://github.com/BerriAI/litellm/pull/48676)

### NVIDIA Riva {#nvidia-riva}

- 為 Riva 部署新增僅限管理員的 `riva_offline: true`，將整個緩衝區透過 `offline_recognize` 傳送，使 Parakeet TDT 與 Whisper 等僅離線模型不再以 `INVALID_ARGUMENT` 失敗 - [PR #41021](https://github.com/BerriAI/litellm/pull/41021)

### OCI {#oci}

- 合併 OCI Gemini 請求開頭的 system 訊息，使應用程式加入較晚的摘要或記憶訊息時，先前的 system 指示不再被丟棄 - [PR #49458](https://github.com/BerriAI/litellm/pull/49458)

### Ollama {#ollama}

- 在 `ollama_chat` 請求中轉送 assistant 的 `tool_calls[].id`，使 Ollama Cloud 上的 MiniMax 能將工具結果對應到其呼叫，而非回報工具什麼都沒回傳 - [PR #49278](https://github.com/BerriAI/litellm/pull/49278)
- 讓 Ollama 能力與定價查詢保持在本機，使其不再聯絡環境中設定的無關伺服器 - [PR #49727](https://github.com/BerriAI/litellm/pull/49727)

### OpenAI {#openai}

- 在每條 `openai/` 路由（包含批次、assistants 與 realtime）上遵循逐部署的 workload identity，使無金鑰的聯合部署不再要求靜態金鑰 - [PR #39966](https://github.com/BerriAI/litellm/pull/39966)
- 將 `gpt-*transcribe` 模型路由到 GPT 音訊轉錄設定，使 `gpt-transcribe` 無需 `response_format` 即可運作，並依 OpenAI 的 `usage.seconds` 計費 - [PR #44021](https://github.com/BerriAI/litellm/pull/44021)
- 在非串流的 `aiohttp_openai` 回應上轉送提供者的 `service_tier`，而非丟棄 - [PR #47263](https://github.com/BerriAI/litellm/pull/47263)
- 當 `drop_params` 丟棄模型對應表未啟用的 GPT-5 reasoning effort 時，記錄指出模型、level 與修復方式的警告，涵蓋 chat、`/v1/messages`、`/v1/responses` 與 Bedrock - [PR #47761](https://github.com/BerriAI/litellm/pull/47761)
- 將 OpenAI 的 `context_length_exceeded` 錯誤對應到 `ContextWindowExceededError`，而非 `BadRequestError` - [PR #47954](https://github.com/BerriAI/litellm/pull/47954)
- 從 OpenAI 定價頁面加入 `gpt-5.6-cyber` 的 12 小時快取寫入費率 - [PR #48246](https://github.com/BerriAI/litellm/pull/48246)
- 將 `gpt-6.1-terra` 加入成本對應表，價格來自 OpenAI 定價頁面，包含 12 小時批次快取寫入費率 - [PR #48429](https://github.com/BerriAI/litellm/pull/48429)
- 從 OpenAI 定價頁面將 OpenAI Batch 與 Ultrafast 12 小時快取寫入費率加入成本對應表 - [PR #48433](https://github.com/BerriAI/litellm/pull/48433)
- 從 `gpt-5-nano` 與 `gpt-5-nano-2025-08-07` 移除 `input_cost_per_token_priority` 價格，使 `/model/info` 不再顯示比標準高 50 倍的 priority 輸入價格 - [PR #48763](https://github.com/BerriAI/litellm/pull/48763)
- 將 `gpt-6-rosalind` 加入成本對應表，價格來自 OpenAI 定價頁面 - [PR #49268](https://github.com/BerriAI/litellm/pull/49268)
- 將 `gpt-6-astra-law` 加入成本對應表，價格來自 OpenAI 定價頁面 - [PR #49444](https://github.com/BerriAI/litellm/pull/49444)

### OpenCode {#opencode}

- 當呼叫者提供穩定的 conversation ID 時，在 chat completions、Responses 與原生 Messages 上自動將 `x-opencode-session` 傳送給 OpenCode Go - [PR #48121](https://github.com/BerriAI/litellm/pull/48121)

### OpenRouter {#openrouter}

- 當 `check_provider_endpoint` 開啟時，在 `/v1/models` 上為 `openrouter/*` 列出 OpenRouter 的即時 chat 目錄，使 `lite pi` 不再因清單空白而拒絕啟動 - [PR #48820](https://github.com/BerriAI/litellm/pull/48820)

### Perplexity {#perplexity}

- 轉送 Perplexity 搜尋選項（例如 recency、日期與語言篩選），而非丟棄，並將提供者的驗證錯誤回傳給呼叫者 - [PR #49344](https://github.com/BerriAI/litellm/pull/49344)

### SageMaker {#sagemaker}

- 無論 payload 部分如何切分，都剖析每個串流的 SageMaker 記錄，並引發容器錯誤，而非將失敗的串流以正常 200 停止結束 - [PR #47495](https://github.com/BerriAI/litellm/pull/47495)
- 讓部署固定的 `model_id`（例如 SageMaker 推論元件）優先於請求 body 與路由器預設值，並讓 `configurable_clientside_auth_params` 選擇加入用戶端選擇 - [PR #49045](https://github.com/BerriAI/litellm/pull/49045)

### Tencent {#tencent}

- 透過 TokenHub 自身的圖片端點，為 Tencent 提供者新增 Seedream 5.0 pro、flash 與 lite 圖片生成與編輯，花費來自 TokenHub 的 token 計數 - [PR #48735](https://github.com/BerriAI/litellm/pull/48735)

### Together AI {#together-ai}

- 將 Together AI Qwen3.7-Max 定價為每 100 萬個 token 輸入 1.50 USD、快取輸入 0.30 USD、輸出 4.50 USD，使其不再比 Together 已發佈的價格高 67% 計費 - [PR #49125](https://github.com/BerriAI/litellm/pull/49125)
- 只有當萬用字元別名（例如 `together_ai/*`）解析到真實的 Together 模型時，才在 `/v1/models` 上列出該 Together AI ID，並從成本對應表讀取 Together 的模型清單 - [PR #49152](https://github.com/BerriAI/litellm/pull/49152)
- 為 `together_ai/Qwen/Qwen3.8-2.4T-A95B` 加入 2026-11-04 的 `deprecation_date`，來自 Together 的排程淘汰表 - [PR #49542](https://github.com/BerriAI/litellm/pull/49542)

### vLLM {#vllm}

- 在兩條 `/vllm` 路由上都將 pass-through 金鑰以 `Authorization: Bearer` 傳送，並停止 `/v1` base 呼叫 `/v1/v1/...`，使以 `--api-key` 啟動的伺服器不再回應 401 - [PR #46861](https://github.com/BerriAI/litellm/pull/46861)
- 在 `hosted_vllm` 決策部署上接受圖片並傳給 vLLM 的 `/v1/systemone` `images` 欄位，而非以 400 拒絕 - [PR #48621](https://github.com/BerriAI/litellm/pull/48621)
- 在 `hosted_vllm` 上接受 vLLM production-stack 路由器的檔案與批次物件，補上缺失的 `object` 欄位，並將 `pending` 與 `running` 對應到 `validating` 與 `in_progress`，使上傳與批次不再回應 500 - [PR #49068](https://github.com/BerriAI/litellm/pull/49068)

### xAI {#xai}

- 將原生 xAI X Search 加入 Search API 與 WebSearch 攔截，將引用 URL 作為搜尋結果回傳，並記錄 xAI 回報的費用（包含 token 與工具使用量） - [PR #48677](https://github.com/BerriAI/litellm/pull/48677)

### Z.AI {#zai}

- 在 `zai/*` 模型上接受 `response_format` 與 `max_completion_tokens`，並新增 `zai/glm-5v-turbo` 定價（包含快取輸入） - [PR #48335](https://github.com/BerriAI/litellm/pull/48335)

### 模型型錄與定價 {#model-catalog-and-pricing}

- 在啟動時、於 `POST /reload/model_cost_map` 以及排程重新載入時讀取 `LITELLM_MODEL_COST_MAP_URL` 的 `s3://` URI，而非以 `UnsupportedProtocol` 失敗並依隨附的對應表計價 - [PR #46972](https://github.com/BerriAI/litellm/pull/46972)
- 新增 Mistral Voxtral 3、ElevenLabs 語音與 Together `MiniMaxAI/MiniMax-M3.1-Flash` 列，將 ElevenLabs v3 與 Multilingual v2 設為每 1K 字元 0.08 USD，並為 `azure_ai/Phi-4*` 退役標註日期 - [PR #47623](https://github.com/BerriAI/litellm/pull/47623)
- 將 `wandb/reflection/Beam-1.0-501B-A23B` 與 `wandb/zai-org/GLM-5.3` 加入成本對應表，價格來自 CoreWeave Forge Serverless Inference 頁面 - [PR #47690](https://github.com/BerriAI/litellm/pull/47690)
- 在一輪滾動式成本對應表稽核中，新增提供者退役日期、修復 Azure AI Claude Sonnet 5.5 快取讀取價格、Azure 網頁搜尋依 Bing 費率計費，並加入 Fireworks spot router - [PR #48188](https://github.com/BerriAI/litellm/pull/48188)
- 從成本對應表移除舊有的 `max_tokens` 欄位，改用 `max_input_tokens` 與 `max_output_tokens`，而 `/model/info` 仍回傳 `max_tokens` - [PR #48471](https://github.com/BerriAI/litellm/pull/48471)
- 為四個 `abliteration/` chat 模型定價，帶有快取讀取費率與能力，並保留 `reasoning_effort` 而非丟棄 - [PR #48498](https://github.com/BerriAI/litellm/pull/48498)
- 從 `gemini-3.1-flash-lite-image` 與 `vertex_ai/gemini-3.1-flash-lite-image` 移除 `2027-06-28` 的 `deprecation_date`，因為 Google 只發佈下限日期 - [PR #48587](https://github.com/BerriAI/litellm/pull/48587)
- 從成本對應表產生 `provider_endpoints_support.json`，使 `/public/endpoints` 與 models.litellm.ai/providers 只在有可用模型時顯示端點 - [PR #48619](https://github.com/BerriAI/litellm/pull/48619)
- 為 Together 在該日期從 serverless 移除的兩個 `together_ai` 模型加入 `2026-11-06` 的 `deprecation_date` - [PR #48651](https://github.com/BerriAI/litellm/pull/48651)
- 在備援規則中停止讀取舊有的 `extends` 與混合規則成本對應表格式，使舊格式自訂對應表上未對應的 Claude ID 遺失備援路由與模型資訊 - [PR #48737](https://github.com/BerriAI/litellm/pull/48737)
- 將三個 Refuseless 模型（包含 `refuseless/glm-5.3-abliterated`）的輸入、輸出與快取讀取價格下調到提供者的新定價 - [PR #48844](https://github.com/BerriAI/litellm/pull/48844)
- 將 Gemini 長提示 Batch 費率與 Azure GPT-6 Astra 長上下文 Flex 費率加入成本對應表，使這些請求不再備援到錯誤的費率 - [PR #49114](https://github.com/BerriAI/litellm/pull/49114)
- 將 `wandb/zai-org/GLM-5.2` 的 `max_input_tokens` 設為 262000（CoreWeave 列出的 context），而非 1049000 - [PR #49148](https://github.com/BerriAI/litellm/pull/49148)
- 新增 Deepgram 文字轉語音價格：`deepgram/aura` 每 1,000 字元 0.015 USD、`deepgram/aura-2` 每 1,000 字元 0.030 USD - [PR #49280](https://github.com/BerriAI/litellm/pull/49280)
- 在 15 個 Vertex AI 與 Gemini 列上標記 `supports_computer_use`，並新增 Cohere `rerank-v5.0-pro` 與 `rerank-v5.0-fast` 列，使這些查詢不再失敗 - [PR #49297](https://github.com/BerriAI/litellm/pull/49297)
- 將 W&B DeepSeek V3.1 與 Llama 3.1 8B 列的 `max_input_tokens` 設為 128K，以符合 CoreWeave Forge serverless inference 頁面 - [PR #49616](https://github.com/BerriAI/litellm/pull/49616)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 記錄並計費傳送到 `/cursor/chat/completions` 的 Responses 風格 body，並停止在 `metadata` 中將代理程式的金鑰雜湊、別名與呼叫者 IP 傳送給 OpenAI - [PR #30277](https://github.com/BerriAI/litellm/pull/30277)
- 在串流 `/v1/responses` 事件的巢狀 `response.model` 中回報請求的模型，而非後端部署名稱 - [PR #46662](https://github.com/BerriAI/litellm/pull/46662)
- 在 `/v1/responses` 上將 Anthropic compaction 區塊以 `compaction` 輸出項目往返（包含串流），並將重播的 `compaction` 項目傳回 Claude，使長工作階段保留其摘要 - [PR #46754](https://github.com/BerriAI/litellm/pull/46754)
- 在每個 Responses WebSocket 回合執行 `pre_call` 防護欄，並為每個回合分別計算其防護欄成本，而非只檢查第一個 frame 一次並在後續回合重複計算其記錄 - [PR #47013](https://github.com/BerriAI/litellm/pull/47013)
- 以推論傳送請求的方式計算 `/v1/responses/input_tokens`：Claude 透過橋接，OpenAI 則轉送呼叫者的 body，使函式工具不再失敗，OpenAI 錯誤也原樣回傳 - [PR #47363](https://github.com/BerriAI/litellm/pull/47363)
- 遵循 `max_agentic_loops` 作為 `/v1/responses` 上串流 MCP 自動執行的回合上限，預設維持 5，且仍忽略請求 body 中傳送的任何值 - [PR #47688](https://github.com/BerriAI/litellm/pull/47688)
- 在串流 `/v1/responses` 呼叫的後續輸入中保留每個先前的 MCP 工具呼叫與結果，使多步驟工具鏈不再重複工具並撞上回合上限 - [PR #47698](https://github.com/BerriAI/litellm/pull/47698)
- 在 `/v1/responses` 上原樣重播沒有 `action` 的 `web_search_call` 輸入項目，使 Codex 與 Azure 對話的後續回合不再以 500 失敗 - [PR #48417](https://github.com/BerriAI/litellm/pull/48417)
- 在 Responses 與 Gemini 轉換之間保留工具結果與 assistant 歷史中的音訊、PDF 與圖片內容，而非丟棄 - [PR #48484](https://github.com/BerriAI/litellm/pull/48484)
- 從 `previous_response_id` 重建工作階段時略過失敗的花費記錄回合，使一次失敗的重試不再讓 Bedrock 上每個後續重試回應 400 - [PR #48647](https://github.com/BerriAI/litellm/pull/48647)
- 當提供者省略 `logprobs` 時，在 Responses 串流中保留具型別的文字部分，使讀取 `event.part.text` 不再引發 `AttributeError` - [PR #48686](https://github.com/BerriAI/litellm/pull/48686)
- 將 `/v1/responses` 上的頂層 `moderation` 參數轉送給 OpenAI，而非丟棄，使審核結果或 OpenAI 的 400 能到達呼叫者 - [PR #48708](https://github.com/BerriAI/litellm/pull/48708)
- 在金鑰與團隊的防護欄與政策之上，執行 Responses WebSocket frame 選取的防護欄與政策，並修復帶有設定的防護欄遇到另一個防護欄清單時的 500 - [PR #48725](https://github.com/BerriAI/litellm/pull/48725)
- 在 `/v1/responses` 上於完成前串流每個引用批次，帶有連續的註解索引，使串流用戶端不再遺漏出現在最終回答中的引用 - [PR #48747](https://github.com/BerriAI/litellm/pull/48747)
- 從 Responses 輸出與 `input` 項目中丟棄為 null 的 `created_by`，使重播 `/v1/responses/compact` 結果不再得到 OpenAI 的 400 `Unknown parameter: 'input[1].created_by'` - [PR #48783](https://github.com/BerriAI/litellm/pull/48783)
- 在背景 OpenAI `/v1/responses` 串流上，於 OpenAI 傳送時立即傳遞 `response.created`、`queued` 與 `in_progress`，使提早停止讀取的用戶端仍能取消或取回該次執行 - [PR #48817](https://github.com/BerriAI/litellm/pull/48817)
- 在 OpenAI、Azure 與 Azure AI Foundry 上取回背景回應時轉送 `stream` 與 `starting_after`，使用戶端能恢復中斷的事件串流並取得遺漏的事件 - [PR #48819](https://github.com/BerriAI/litellm/pull/48819)
- 將空的 `function_call_output` 以空工具結果傳送給 Anthropic 與 Gemini，而非模型會讀作結果的序列化 JSON - [PR #48845](https://github.com/BerriAI/litellm/pull/48845)
- 在 OpenAI、Azure 與 Azure AI 的 `/v1/responses/compact` 上游請求中排除 `metadata` 與 `user`，並將 Azure compaction 傳送到 v1 路由，使呼叫不再得到 400 或 500 - [PR #48876](https://github.com/BerriAI/litellm/pull/48876)
- 在 Codex 模型清單中為 Claude 路由宣傳工具搜尋，並翻譯 Codex 用戶端的 `tool_search` 請求與結果，使 Codex 探索 MCP 工具，而非預先載入每個 schema - [PR #48972](https://github.com/BerriAI/litellm/pull/48972)
- 當 Codex 的工具清單在回合之間重複時，每個工具只傳送一次並使用最新副本，使切換到 Bedrock 上 GPT 的 Codex 工作階段不再因重複工具錯誤而失敗 - [PR #49006](https://github.com/BerriAI/litellm/pull/49006)
- 在來自 `litellm_proxy/` 模型的 `litellm.responses()` 錯誤上保留代理程式的錯誤 body、代碼與類型，並在 chat 與 Responses 上透過鏈式代理程式傳遞下游代理程式經遮罩的 `provider_specific_fields` - [PR #49073](https://github.com/BerriAI/litellm/pull/49073)
- 只有在 `drop_params` 開啟時才合併 Codex 在回合之間重複的工具清單，否則原樣傳送請求，使刻意重複的工具定義不再被丟棄 - [PR #49112](https://github.com/BerriAI/litellm/pull/49112)

### 透過 Responses API 橋接的 Chat Completions {#chat-completions-over-the-responses-api-bridge}

- 將型錄中缺少的 `chatgpt/` 模型透過 Responses 橋接路由，使其不再在 Chat Completions 上回傳 404 - [PR #48244](https://github.com/BerriAI/litellm/pull/48244)
- 拒絕或丟棄 chat completions 橋接無法翻譯的 Responses 參數（例如 `max_tool_calls`），使 Bedrock Claude 不再回應 400，`drop_params` 也能運作 - [PR #48655](https://github.com/BerriAI/litellm/pull/48655)
- 當 chat completions 橋接到 Responses API 時傳送完整的 `reasoning_effort` dict，並在 `drop_params` 之下只丟棄被拒絕的 effort - [Commit 9675c13](https://github.com/BerriAI/litellm/commit/9675c13cb02b2e183deb04b0ae912ed85b20f1e2)
- 為 `openai` 提供者在下一個 chat 回合依順序重播原始 Responses 項目（帶有其 `phase` 與邊界），而非合併成單一訊息 - [PR #48912](https://github.com/BerriAI/litellm/pull/48912)
- 將 Responses 請求橋接到 chat completions 時轉送文字 `verbosity`（包含已儲存的工具搜尋後續追蹤），而非默默丟棄 - [PR #49049](https://github.com/BerriAI/litellm/pull/49049)
- 在 Azure、ChatGPT、Azure AI 與 GitHub Copilot 的 Responses 橋接上以相同方式傳送帶有 `mode` 與 `context` 的 dict `reasoning_effort`，使 Azure 上的 pro reasoning 不再以標準模式執行與計費 - [PR #49082](https://github.com/BerriAI/litellm/pull/49082)

### Anthropic Messages API {#anthropic-messages-api}

- 為 web search 攔截串流原生的 `server_tool_use` 與 `web_search_tool_result` 區塊，使 Claude Code 能計算其搜尋次數，並在重新串流的回覆上保留 `caller`、經遮罩的 thinking `data` 與引用 - [PR #40967](https://github.com/BerriAI/litellm/pull/40967)
- 在短路 web search 之前，去除 Claude Code 的 `Perform a web search for the query:` 前綴，使搜尋提供者得到使用者真正的查詢 - [PR #43458](https://github.com/BerriAI/litellm/pull/43458)
- 在合成的 `message_delta` 事件中攜帶 `safeguard_results` 與 `stop_details`，使自動模式下的 Claude Code 在呼叫後防護欄改寫串流的 `/v1/messages` 回覆時，保留其伺服器判定 - [PR #46096](https://github.com/BerriAI/litellm/pull/46096)
- 在 `/v1/messages` 到非 Anthropic 模型的 `clear_tool_uses_20250919` polyfill 中遵循 `clear_at_least`、`exclude_tools` 與 `clear_tool_inputs`，並對格式錯誤的欄位像 Anthropic API 一樣回應 400 - [PR #47123](https://github.com/BerriAI/litellm/pull/47123)
- 將 `/v1/messages` 的 PDF 文件以 chat `file` 部分傳送給 OpenAI 形狀的提供者，使 Azure OpenAI 不再回應 400，並在 `azure_ai/`、Vertex 夥伴模型、OCI、GigaChat、SAP 與 OpenRouter 上處理 - [PR #47166](https://github.com/BerriAI/litellm/pull/47166)
- 對 `/v1/messages` 與 count_tokens 上為 null 或數字的 `tool_result` 文字回應指出錯誤欄位的 400，而非在 OpenAI 模型上回應 500，並在 `drop_params` 之下丟棄該區塊 - [PR #47347](https://github.com/BerriAI/litellm/pull/47347)
- 當防護欄改寫 `/v1/messages` 請求時保留超過 64 個字元的工具名稱，使 Bedrock 不再回應 400 `Tool reference '<name>' not found in available tools` - [PR #47434](https://github.com/BerriAI/litellm/pull/47434)
- 在 LiteLLM 補上 context management 的 `/v1/messages` 路由上，將 system prompt 計入 `clear_tool_uses_20250919` 的 `input_tokens` 觸發門檻（如同 Anthropic 的 API），並停止其列在 `compact_20260112` 之前時的 500 - [PR #47857](https://github.com/BerriAI/litellm/pull/47857)
- 在閘道中為 `/v1/messages` 上的 OpenAI 模型與 count tokens 執行 `clear_tool_uses_20250919` 編輯，使舊的工具結果被清除，而非默默丟棄 - [PR #47861](https://github.com/BerriAI/litellm/pull/47861)
- 在原生 Anthropic Messages 回應中包含為 null 的 `stop_sequence`（包含串流） - [Commit e5cedbb](https://github.com/BerriAI/litellm/commit/e5cedbb861e6023e992a927de8b838b32156e918)
- 當 `/v1/messages` 串流在第一個 token 之前被取消時，關閉上游請求，而非讓它保持開啟 - [PR #48220](https://github.com/BerriAI/litellm/pull/48220)
- 在 `/claude_code_gateway` 之下加入缺失的模型清單路由，使以它為 base URL 的 Claude 用戶端在模型探索時不再得到 404 - [PR #48221](https://github.com/BerriAI/litellm/pull/48221)
- 遵循傳送給 OpenAI chat 模型的 `/v1/messages` 的 `stop_sequences`，將帶有非空停止清單的請求透過會轉送 `stop` 的 Chat Completions 路由 - [PR #48534](https://github.com/BerriAI/litellm/pull/48534)
- 在 `/v1/messages` 上將 Claude 部署的 `anthropic-beta` 與用戶端的合併，而非取代，使管理員啟用的 beta（例如 1M context）能到達 Claude Code 使用者 - [PR #48594](https://github.com/BerriAI/litellm/pull/48594)
- 在透過 `hosted_vllm` 等 Chat Completions 後端提供的 `/v1/messages` 串流的第一個 `message_start` 中估算提示大小，而非永遠傳送 0 - [PR #48618](https://github.com/BerriAI/litellm/pull/48618)
- 讓透過 Chat Completions 後端的 `/v1/messages` 串流開頭提示使用量估算改為選擇加入，使預設維持 0，直到提供者真正的使用量到達 - [PR #48633](https://github.com/BerriAI/litellm/pull/48633)
- 將呼叫者的 `anthropic-version` 放在 Vertex AI Claude `/v1/messages` body 中，而非標頭，使 anthropic Python SDK 2.x 不再得到 400 - [PR #48814](https://github.com/BerriAI/litellm/pull/48814)
- 在 `drop_params` 之下，從 `/v1/messages` 與 `count_tokens` 工具定義中丟棄不符合規格的 `custom` 物件，並將布林值 `custom.defer_loading` 移到 Claude 的頂層 `defer_loading` 旗標 - [PR #48893](https://github.com/BerriAI/litellm/pull/48893)
- 將 `/v1/messages` 上的防護欄阻擋以正常的 Anthropic 事件序列串流，使 Anthropic SDK 顯示防護欄的訊息而非崩潰，並為被阻擋的回應加入 `x-litellm-call-id` - [PR #49010](https://github.com/BerriAI/litellm/pull/49010)
- 在 `/v1/messages` 上將每個簽署的 Mistral thinking chunk 以 `thinking_delta` 串流，並在區塊結束時傳送簽章一次，使 Claude Code 顯示完整的想法，而非只有第一個字 - [PR #49059](https://github.com/BerriAI/litellm/pull/49059)
- 當 Claude 在 Bedrock invoke、Bedrock mantle 與 Anthropic 上拒絕 strict 工具限制時，在 `drop_params` 之下不帶 `strict` 重試 `/v1/messages` 一次並發出警告，而非回應 400 - [PR #49102](https://github.com/BerriAI/litellm/pull/49102)
- 當 body 的 `content` 為 null 或缺失時，在純 Anthropic 部署上為 `/v1/messages` 回傳上游的 200，而非 500 - [PR #49356](https://github.com/BerriAI/litellm/pull/49356)

### 計算 token {#count-tokens}

- 為帶有 compaction 區塊的 Anthropic 歷史計算 token 並轉送 `context_management` 編輯，使 `/v1/messages/count_tokens` 不再回應 400 - [PR #44784](https://github.com/BerriAI/litellm/pull/44784)
- 依 DeepSeek V4 與 Qwen3.5 的 chat 範本呈現方式，為其在 `/v1/messages/count_tokens` 上計算工具，而非比計費的輸入 token 低算 6% 到 80% - [PR #47173](https://github.com/BerriAI/litellm/pull/47173)
- 以 DeepSeek 自己的 tokenizer 計算 DeepSeek V3 與 V4 文字，使 `/v1/messages/count_tokens` 落在計費 token 的 2.5% 以內，而非誤差 3% 到 98% - [PR #47353](https://github.com/BerriAI/litellm/pull/47353)
- 依 OpenAI 與 Azure 模型的計費方式計算 PDF 頁面，使 `count_tokens` 不再將 PDF 高算約 12 倍，且僅 Azure 的 chat 模型使用 `o200k_base` - [PR #47554](https://github.com/BerriAI/litellm/pull/47554)
- 每次 token 計算呼叫記錄一行 INFO，帶有 `litellm_call_id`、`request_model`、`input_tokens` 與 `status_code`，成功與失敗皆然 - [PR #47657](https://github.com/BerriAI/litellm/pull/47657)
- 在 `token_counter` 中以高細節圖塊計算方式計算可讀的內嵌 `auto` 圖片（包含 768 像素以下的圖片），且不發出 HTTP 請求 - [PR #48526](https://github.com/BerriAI/litellm/pull/48526)
- 在本機計算的模型上計算 Anthropic 搜尋結果（包含工具結果內的），並對不受支援的內容區塊回傳 400 而非 500 - [PR #48699](https://github.com/BerriAI/litellm/pull/48699)
- 以 `o200k_base` 計算比 tiktoken 表格更新的 OpenAI 模型，並在選取編碼前去除 `openai/` 與 `azure/` 前綴 - [Commit 5eb1042](https://github.com/BerriAI/litellm/commit/5eb1042bbf57f19d0d698b5c7b67b133000fbf5f)
- 當部署沒有設定的金鑰時，以 Claude 訂閱呼叫者轉送的 token 計算 token，而非回應 401 - [Commit e2d78b6](https://github.com/BerriAI/litellm/commit/e2d78b69cd8b8e51569c9334eda6dd2aa491b002)
- 在計算只帶有 OpenAI Responses 內建工具（例如 `mcp`）的 Claude 請求之前先回應 400，並在 `/utils/token_counter` 中翻譯 `tool_search` 與 `namespace` 工具 - [PR #48798](https://github.com/BerriAI/litellm/pull/48798)
- 當成本對應表的 Bedrock 計算模型回應 400、404、401 或 403 時，保留框架化的本機估算，而管理員設定的 `token_count_model` 則保留其錯誤 - [Commit ff5bf48](https://github.com/BerriAI/litellm/commit/ff5bf4826dab9ee145de96966488cbd195a1063a)
- 當後續下載失敗時保留已載入的 Hugging Face tokenizer，並每 60 秒在背景重試（由 `HUGGINGFACE_TOKENIZER_LOAD_RETRY_SECONDS` 設定），使 token 計算立即回應 - [PR #48916](https://github.com/BerriAI/litellm/pull/48916)

### 提示快取 {#prompt-caching}

- 為 OpenAI 相容提供者從副本中去除 `cache_control`，而非編輯呼叫者的請求，使 Claude 備援保留其快取提示，並在 `drop_params` 之下修剪到最新的 4 個 - [PR #35602](https://github.com/BerriAI/litellm/pull/35602)
- 從部署的提供者前綴選取 chat 提示快取格式，使 `azure_ai/` 部署不再因 `AZURE_AI_API_BASE` 而遺失 `prompt_cache_options` - [PR #45295](https://github.com/BerriAI/litellm/pull/45295)
- 在 `drop_params` 之下，於 `/v1/responses`、`/v1/messages` 與 `/v1/responses/compact` 丟棄格式錯誤的 `prompt_cache_breakpoint`，使 OpenAI 不再回應 400 - [PR #45330](https://github.com/BerriAI/litellm/pull/45330)
- 以工具與 `/v1/messages` system prompt 作為提示快取親和性的鍵，使工具或清單 system prompt 上的快取中斷點寫入查詢能找到的 pin - [PR #46411](https://github.com/BerriAI/litellm/pull/46411)
- 將 `prompt_cache_retention` 傳送給 OpenAI，而非默默丟棄，使 24 小時提示快取生效 - [PR #47480](https://github.com/BerriAI/litellm/pull/47480)
- 在 `prompt_caching` 親和性鍵中略過非 dict 的 `tools` 項目，使提供者的 400 被回傳，而非代理程式 500 或 Python 錯誤訊息 - [PR #47565](https://github.com/BerriAI/litellm/pull/47565)
- 停止計算被丟棄的未回應伺服器工具呼叫上的快取標記，使有空位時 system prompt 保留其 `cache_control` 中斷點 - [PR #49468](https://github.com/BerriAI/litellm/pull/49468)

### Realtime {#realtime}

- 將 Gemini 與 Vertex Live 設定與第一個內容一起傳送，該設定由每個先前的 `session.update` 建立，使指示與工具在 `/v1/realtime` 上到達模型 - [PR #39864](https://github.com/BerriAI/litellm/pull/39864)
- 讀取 OpenAI realtime 健康檢查中的第一個事件，使 API 金鑰錯誤或缺失的部署回報不健康，而非健康 - [PR #41233](https://github.com/BerriAI/litellm/pull/41233)
- 在 `/v1/realtime` 上新增 Soniox 即時語音轉文字，帶有 OpenAI 轉錄事件，並依金鑰、預算與花費追蹤 - [PR #44822](https://github.com/BerriAI/litellm/pull/44822)
- 當轉錄防護欄停用自動回應時保留 `turn_detection.type`，使 OpenAI GA 不再拒絕工作階段或在防護欄執行前回應 - [PR #44939](https://github.com/BerriAI/litellm/pull/44939)
- 將 Azure WebRTC `/v1/realtime/client_secrets` 與呼叫路由到不帶 `api-version` 的 GA `/openai/v1/realtime` API，使 token 鑄造不再回應 404，SDP 交換也不再以 "Invalid or expired token" 失敗 - [PR #47316](https://github.com/BerriAI/litellm/pull/47316)

### 批次與檔案 {#batches-and-files}

- 讓代理程式管理員金鑰再次在 `GET /files/{id}/content` 上讀取原始 `gs://` 與 `s3://` 檔案 ID，其他金鑰回應 403，使未受管理的 Vertex 批次流程能運作 - [PR #40621](https://github.com/BerriAI/litellm/pull/40621)
- 透過受管理的批次路由以 Anthropic Messages 列執行 Vertex AI 上的 Claude，並回傳已定價的 OpenAI 批次列，而非在批次建立時 404 - [PR #45715](https://github.com/BerriAI/litellm/pull/45715)
- 從以 `target_model_names` 上傳的檔案建立微調工作時，傳送路由部署自身的檔案 ID，而非 OpenAI 會以 400 拒絕的閘道檔案 ID - [PR #46552](https://github.com/BerriAI/litellm/pull/46552)
- 當部署設定了 `aws_bedrock_control_plane_endpoint` 時，將 Bedrock 批次的建立、取回與取消傳送到該端點，使私有端點與鎖定的 VPC 設定能執行批次 - [PR #47260](https://github.com/BerriAI/litellm/pull/47260)
- 將批次建立路由到混合 Azure 模型群組中的 `mode: batch` 部署，使其不再回應 400 `invalid_deployment_type`，並在 `/model_group/info` 上列出 `supported_endpoints` - [PR #47376](https://github.com/BerriAI/litellm/pull/47376)
- 在 `require_managed_files` 之下，將提供者與模型檔案清單限定為呼叫者自身與團隊受管理的檔案（非管理員），並支援 `limit`、`after`、`after_id` 與 `before_id` 分頁 - [PR #47682](https://github.com/BerriAI/litellm/pull/47682)
- 在批次建立、取回與儲存列上，於 OpenAI 的批次使用量欄位旁回傳真正的提示與完成 token 計數，使 responses 端點批次不再顯示零 token - [PR #47740](https://github.com/BerriAI/litellm/pull/47740)
- 釋放 7 天後從未計費的批次輸入檔案，將每次輪詢在新舊批次之間分配，並在 14 天後停止輪詢未完成的批次，使檔案刪除與新批次輪詢不再停滯 - [PR #48752](https://github.com/BerriAI/litellm/pull/48752)

### 向量儲存 {#vector-stores}

- 為 Vertex AI Search 向量儲存搜尋使用 HTTP/2 用戶端與快取的 OAuth token，使一波搜尋在每個 worker 共用一條 Google 連線 - [PR #40631](https://github.com/BerriAI/litellm/pull/40631)
- 在 `/rag/ingest` 與 `/rag/query` 上使用團隊自己的 OpenAI 部署，讓檢視者與團隊 JWT 使用 /rag 路由，並為失敗的擷取回傳真正的狀態，而非 200 - [PR #45497](https://github.com/BerriAI/litellm/pull/45497)
- 將團隊金鑰向量儲存搜尋路由到該儲存提供者的團隊模型，而非團隊的第一個模型與 `Vector store search is not supported` 錯誤 - [PR #46894](https://github.com/BerriAI/litellm/pull/46894)
- 新增 Amazon OpenSearch k-NN 索引作為向量儲存提供者，從設定或 Admin UI 註冊，使搜尋與 `file_search` 以 SigV4 簽署的查詢從中回答，而非 500 - [PR #47759](https://github.com/BerriAI/litellm/pull/47759)
- 在取回、更新與刪除時，將 Azure 向量儲存 ID 放在 `api-version` 查詢之前，使這些呼叫不再回傳 404 - [PR #48224](https://github.com/BerriAI/litellm/pull/48224)
- 當未載入向量儲存註冊表時，在 Responses、chat、messages、pass-through 與直接儲存路由上強制執行團隊與金鑰的 Allowed Vector Stores，其他儲存回應 401 - [PR #48915](https://github.com/BerriAI/litellm/pull/48915)

### Pass-through 端點 {#pass-through-endpoints}

- 在 `/bedrock` pass-through 路由上套用 `bedrock_request_metadata_fields`，使 AWS SDK 流量記錄金鑰、團隊與組織，並忽略請求 body 中傳送的 `user_api_key_*` 值 - [PR #47040](https://github.com/BerriAI/litellm/pull/47040)
- 新增 `general_settings.vertex_ai_pass_through_drop_anthropic_betas`，在 `/vertex_ai/*` 與 `/vertex-ai/*` 上移除選定的 `anthropic-beta` 值，使 Vertex Claude 呼叫不再因它拒絕的 beta 而回應 400 - [PR #47185](https://github.com/BerriAI/litellm/pull/47185)
- 在 `/bedrock` pass-through 的 converse 與 invoke 路由上套用 Bedrock 模型的 `guardrailConfig`，使呼叫者不再能略過或換掉管理員的防護欄 - [PR #47429](https://github.com/BerriAI/litellm/pull/47429)
- 讓 pass-through 上游以 `x-litellm-upstream-model` 回應標頭命名請求的模型，使沒有 body `model` 的花費不再落到 `unknown` 之下 - [PR #48275](https://github.com/BerriAI/litellm/pull/48275)
- 在 `/openai` 與 `/openai_passthrough` 的 agents、vaults 與 ChatKit 路徑上轉送用戶端的 `OpenAI-Beta` 標頭（前兩者預設為 `agents=v1`），使 Agents API 不再以 400 `invalid_beta` 失敗 - [PR #49009](https://github.com/BerriAI/litellm/pull/49009)
- 在失敗的 Gemini 與 Vertex pass-through 呼叫上記錄 URL 的模型與宣告的提供者，使花費記錄與指標不再顯示空白模型或缺失的提供者 - [PR #49075](https://github.com/BerriAI/litellm/pull/49075)
- 在 Bedrock pass-through 路由上使用 Bedrock 請求中繼資料中的 `sessionId`、`threadId` 或 `conversationId` 作為工作階段 ID，使被標記的回合共用一個工作階段，而非各自擁有 - [PR #49193](https://github.com/BerriAI/litellm/pull/49193)
- 新增 `/deepgram/v1/speak` 與 `/deepgram/speak` WebSocket 路由，供 Deepgram 串流文字轉語音，依語音生成的費率逐字元計費，並拒絕在成本對應表中沒有價格的語音 - [PR #49282](https://github.com/BerriAI/litellm/pull/49282)
- 將有效的 `metadata.user_id`（最多 255 個字元）轉送到 `/anthropic/v1/messages` 與自訂 pass-through 路由上的 Anthropic Messages，使 Claude Code 的工作階段與裝置 ID 能到達 Anthropic - [PR #49333](https://github.com/BerriAI/litellm/pull/49333)
- 在 `/openai` pass-through 路由上記錄 OpenAI Decisions 呼叫的 token 計數與成本，使金鑰與團隊預算變動，而非記錄 $0 - [PR #49392](https://github.com/BerriAI/litellm/pull/49392)
- 從帶有 `use_in_pass_through: true` 的 watsonx 部署讀取 `/watsonx/{endpoint}` 的 `api_key` 與 `api_base`，而非只有 `WATSONX_API_KEY` 與 `WATSONX_API_BASE` - [PR #49462](https://github.com/BerriAI/litellm/pull/49462)
- 將 Deepgram `/listen` 未定價模型的拒絕放入 WebSocket 關閉 frame 中，使呼叫者得到原因，而非沒有原因的 1006 關閉 - [PR #49502](https://github.com/BerriAI/litellm/pull/49502)

### 代理程式與 Agent-to-Agent {#agents-and-agent-to-agent}

- 透過專案 Responses API 以名稱存取 Microsoft Foundry 代理程式，在 `azure_ai/agents/<name>` 上使用 `agent_reference`，涵蓋 chat completions、Messages 與 A2A，而傳統的 `asst_...` ID 維持舊路由 - [PR #47717](https://github.com/BerriAI/litellm/pull/47717)
- 在建立與互動時接受 Google 目前的 Managed Agents 欄位 `id`、`system_instruction` 與 `agent_config`，並將 `name` 與 `instructions` 保留為別名 - [PR #48750](https://github.com/BerriAI/litellm/pull/48750)
- 在 `/a2a` 傳送與串流上，將 LangGraph 與 Databricks 等 completion-bridge 代理程式以其自身價格在 `a2a_agent/<agent name>` 之下計費，而非傳送為 $0、串流沒有列 - [PR #49150](https://github.com/BerriAI/litellm/pull/49150)
- 提供 `POST /a2a/{agent_id}/message/stream` 及其 `/v1` 別名，而非回傳 404，並由防護欄掃描串流的 chunk - [PR #49471](https://github.com/BerriAI/litellm/pull/49471)
- 在每個 hop 上將 A2A 代理程式的 `litellm_params.api_key` 以 `Authorization: Bearer <key>` 傳送，而非默默以未驗證狀態呼叫代理程式 - [PR #49474](https://github.com/BerriAI/litellm/pull/49474)
- 在 `/a2a/{agent}` POST 路由上將代理程式的拒絕以帶有 `error.code` `-32000` 的 JSON-RPC 錯誤回答，使嚴格的 A2A 用戶端能讀取原因，HTTP 狀態碼維持不變 - [PR #49476](https://github.com/BerriAI/litellm/pull/49476)
- 在 `GET /v1/agents` 與 `GET /v1/agents/{agent_id}` 的代理程式卡片中，向非管理員呼叫者顯示代理程式 URL，而非儲存的後端 URL - [PR #49483](https://github.com/BerriAI/litellm/pull/49483)
- 將空的 `agent_search_embedding_model` 或 `skill_search_embedding_model` 視為未設定，使搜尋回傳 400 "not configured" 錯誤，而非令人困惑的 503 - [PR #49485](https://github.com/BerriAI/litellm/pull/49485)

### 圖片、音訊與影片 {#images-audio-and-video}

- 在代理程式影片 ID 中保留模型，使狀態、內容、remix、編輯與擴展呼叫能解析逐模型的金鑰，並到達建立該影片的部署 - [PR #44614](https://github.com/BerriAI/litellm/pull/44614)
- 在 `/v1/videos` 上為 `volcengine/` 模型新增 Doubao-Seedance 影片生成，帶有逐解析度定價，而非回答不支援影片 - [PR #46156](https://github.com/BerriAI/litellm/pull/46156)
- 從裸模型名稱讀取 Polly 引擎，使 `aws_polly/standard`、`aws_polly/long-form` 與 `aws_polly/generative` 不再以 `neural` 送出 - [PR #47963](https://github.com/BerriAI/litellm/pull/47963)
- 當提供者無法轉錄音訊時，回傳帶有提供者與模型名稱的 400 而非 500，同時路由器仍嘗試另一個部署或備援 - [PR #47971](https://github.com/BerriAI/litellm/pull/47971)
- 將 ElevenLabs 文字轉語音的 `response_format` 值 `wav` 與 `pcm` 對應到 24kHz 的 `wav_24000` 與 `pcm_24000` 格式，使其在每個帳號層級都能運作，而非回傳 403 - [PR #48455](https://github.com/BerriAI/litellm/pull/48455)
- 移除 dall-e-2 與 dall-e-3 程式碼路徑，使不帶模型的 `litellm.image_generation(prompt=...)` 在本機引發 400，而非以 dall-e-2 呼叫 OpenAI - [PR #48703](https://github.com/BerriAI/litellm/pull/48703)
- 在 OpenAI 相容提供者上遵循圖片生成的明確 `max_retries`，並將重試留給代理程式上的 Router，使單一請求不再倍增上游生成次數 - [PR #48705](https://github.com/BerriAI/litellm/pull/48705)
- 對沒有圖片的非同步 BFL 圖片編輯回傳 HTTP 400 `No image provided`，而非 HTTP 500 - [PR #48872](https://github.com/BerriAI/litellm/pull/48872)
- 在 `/v1/images/generations` 上套用金鑰與團隊的 `router_settings`（備援、重試、逾時、`model_group_alias`），使失敗的主要圖片模型使用金鑰設定的備援 - [PR #49286](https://github.com/BerriAI/litellm/pull/49286)

### Embeddings 與 rerank {#embeddings-and-rerank}

- 新增可選的 `model_info.max_embedding_batch_size`，限制每個 `/v1/embeddings` 請求的輸入數量，路由到能接受該批次的部署，沒有部署能接受時回應 400 - [PR #44574](https://github.com/BerriAI/litellm/pull/44574)
- 在同步與非同步呼叫中轉送 Gemini 與 Vertex AI embed-content embeddings 請求的逾時，而非永遠使用 300 秒預設值 - [PR #48690](https://github.com/BerriAI/litellm/pull/48690)
- 停止在 Hugging Face TEI rerank 上強制 `truncate=false`，改為傳遞 `truncate`，使以 `--auto-truncate` 啟動的伺服器不再以 413 讓長文件失敗 - [PR #48706](https://github.com/BerriAI/litellm/pull/48706)
- 在 Ollama embeddings 上轉送設定的憑證、自訂標頭與請求的逾時，使受保護的 Ollama 伺服器不再回傳 401 - [PR #48707](https://github.com/BerriAI/litellm/pull/48707)

### SDK {#sdk}

- 將 prompt 範本中的 `initial_prompt_value` 與 `final_prompt_value` 視為可選，使省略它們的範本不再讓每個請求以 500 失敗 - [PR #39762](https://github.com/BerriAI/litellm/pull/39762)
- 透過 `Harness.PI` 與 `PiOptions` 為 `litellm.agent()` 新增 pi harness，使 pi 將其模型呼叫透過 AI Gateway 路由 - [PR #45467](https://github.com/BerriAI/litellm/pull/45467)
- 在不匯入代理程式處理常式的情況下決定 MCP 閘道路由，使 `responses()`、`completion()`、帶有工具的 Anthropic `messages` 與 `chatgpt/` 模型在基礎 SDK 安裝上不再以 `No module named 'mcp'` 失敗 - [PR #45961](https://github.com/BerriAI/litellm/pull/45961)
- 修復 Palm 退役錯誤訊息中 decommissioned 的拼字錯誤 - [PR #46171](https://github.com/BerriAI/litellm/pull/46171)
- 將 `PWD` 設為本機沙箱命令的工作目錄，使透過 `litellm.agent()` 的 OpenCode 能在沙箱資料夾中運作，並在另一個資料夾恢復工作階段 - [PR #47530](https://github.com/BerriAI/litellm/pull/47530)
- 在同步、非同步與串流 completion 呼叫中遵循 `mock_response=""`，而非將請求傳送給提供者 - [PR #48266](https://github.com/BerriAI/litellm/pull/48266)
- 在 OpenAI 與 Azure 錯誤的 `e.response` 上保留上游狀態、標頭與 body，使 `e.response.text` 與 `e.response.json()` 能在 `openai/`、`azure/`、`azure_text/` 與 `litellm_proxy/` 模型上運作 - [PR #49079](https://github.com/BerriAI/litellm/pull/49079)
- 新增 `litellm.guardrails.apply`，從 SDK 叫用設定的閘道防護欄並取得其原生發現，且不產生 completion - [PR #49469](https://github.com/BerriAI/litellm/pull/49469)

### 一般 {#general}

- 當 OpenAI 相容提供者以 `invalid_request_error` body 回應時，401 引發 `AuthenticationError`、404 引發 `NotFoundError`，而非 `BadRequestError` - [PR #32537](https://github.com/BerriAI/litellm/pull/32537)
- 將上游 `logprobs` 轉換為 LiteLLM 自己的類型，使帶有 `logprobs` 的串流透過 OpenAI 相容提供者時以其完成 chunk 結束，而非 500 錯誤 frame - [PR #33549](https://github.com/BerriAI/litellm/pull/33549)
- 在 web search 後續請求上保留提供者前綴，使 Bedrock Mantle 與 OpenRouter 組織模型不再以 `LLM Provider NOT provided` 失敗或到達錯誤的提供者 - [PR #38885](https://github.com/BerriAI/litellm/pull/38885)
- 重建串流文字 completion 時保留 `finish_reason` 與提供者使用量，使 `prompt_tokens` 不再讀作 0，`choices` 為空的 usage 尾段也不再引發 `IndexError` - [PR #44349](https://github.com/BerriAI/litellm/pull/44349)
- 在每個提供者與路由上套用每個部署的 `reasoning_effort_levels`，將 effort 與 thinking 預算四捨五入到宣告的 level，並讓 `azure_ai` 接受宣告的 `reasoning_effort` - [PR #46601](https://github.com/BerriAI/litellm/pull/46601)
- 在非串流 chat 上為 `bedrock_mantle/` 與其他 OpenAI 類提供者回傳上游回應標頭（包含 `llm_provider-x-amzn-requestid`），如同串流已有的做法 - [PR #46928](https://github.com/BerriAI/litellm/pull/46928)
- 將缺失或為 null 的 choice index 記錄為 choice 零，使 llama-swap 類後端的進度 chunk 不再以代理程式錯誤結束串流 - [PR #46947](https://github.com/BerriAI/litellm/pull/46947)
- 當防護欄在串流中途阻擋時，以錯誤事件與 `data: [DONE]` 結束 chat completions 串流，並以 `response.failed` 結束 `/v1/responses` 串流，而非切斷連線 - [PR #46953](https://github.com/BerriAI/litellm/pull/46953)
- 當呼叫者設定了 `include_usage` 時，像 OpenAI 一樣以 `choices: []` 傳送串流的 `include_usage` chunk，使 LangChain.js 等嚴格用戶端不再重複計算使用量 - [PR #47109](https://github.com/BerriAI/litellm/pull/47109)
- 將 httpx 串流讀取逾時對應到 chat、messages 與 responses 上的 `litellm.Timeout`（408），並讓停滯的 `/v1/responses` 串流以代碼 `request_timeout` 失敗，而非空的 `server_error` - [PR #47198](https://github.com/BerriAI/litellm/pull/47198)
- 在驗證讀取之前解碼 `zstd` 與 `gzip` 請求 body，使壓縮請求不再以 400 `Invalid JSON` 失敗，超過大小限制時為 413、負載下為 503 - [PR #47418](https://github.com/BerriAI/litellm/pull/47418)
- 在 Exa 搜尋結果上回傳 `highlights`、`highlight_scores` 與 `score`，並將 Exa 的回應封套作為 `provider_metadata`，使 `costDollars` 與 `requestId` 到達呼叫者 - [PR #47423](https://github.com/BerriAI/litellm/pull/47423)
- 新增 `/v1/extraction` 與 `litellm.extraction`，支援 Cloudflare Clairic，接收具型別的 `fields`，只以每 100 萬個輸入 token 0.10 USD 計費 - [PR #47473](https://github.com/BerriAI/litellm/pull/47473)
- 以單一斜線連接 `api_base` 與路由，使以 `/` 結尾的 `api_base` 不再傳送 `//` 並從 Envoy 與 Mistral 得到 404 - [PR #47535](https://github.com/BerriAI/litellm/pull/47535)
- 讓沒有完成原因就結束的串流失敗，而非回報正常完成，並記錄為失敗而非成功 - [PR #47665](https://github.com/BerriAI/litellm/pull/47665)
- 將 `litellm_received_at` 攜帶到植入的 `litellm_metadata` 儲存區，使帶有防護欄的 chat 請求上的 `x-litellm-overhead-duration-ms` 計入驗證與呼叫前工作 - [PR #47790](https://github.com/BerriAI/litellm/pull/47790)
- 精確比對 SSE `[DONE]` 標記，使引數中含有 `[DONE]` 的串流工具呼叫不再被丟棄，用戶端得到 `tool_calls` 而非普通停止 - [PR #47832](https://github.com/BerriAI/litellm/pull/47832)
- 除非呼叫者要求，否則從串流文字 completion 中省略 usage - [Commit e14d2fd](https://github.com/BerriAI/litellm/commit/e14d2fdc38f7272b5b50c67c0bdefa2830aff268)
- 在提供者逾時錯誤中指出逾時階段與觸發的確切限制，而非回報 `after None seconds` 並永遠歸咎於連線 - [PR #48250](https://github.com/BerriAI/litellm/pull/48250)
- 當串流 chat completion 回報 `abort` 完成原因時引發 500，而非以正常停止結束，使既有的重試與備援處理能執行 - [PR #48328](https://github.com/BerriAI/litellm/pull/48328)
- 對僅物件 API 路由上的非物件 JSON body 回傳清楚的 400，而非讓請求剖析或驗證錯誤處理崩潰 - [PR #48438](https://github.com/BerriAI/litellm/pull/48438)
- 從 `/v1/search` 回傳 Tavily 的 `raw_content`、`score`、`favicon`、`answer`、`images` 與 `request_id`，而非只有每個結果的標題、url 與摘錄 - [PR #48684](https://github.com/BerriAI/litellm/pull/48684)
- 只以 CR 與 LF 切分串流的 SSE 行，並保持合併的 `<think>` 標籤平衡，使含有 U+2028 的文字不再讓 Gemini 或 Vertex AI 串流提前截斷、沒有更多內容或使用量 - [Commit d06b889](https://github.com/BerriAI/litellm/commit/d06b889d413237881e3dc27486e4345dd7aa18f9)
- 對 SGLang 的總 token 溢位 400 引發 `ContextWindowExceededError`，使 `context_window_fallbacks` 能為 SGLang 部署觸發 - [PR #48837](https://github.com/BerriAI/litellm/pull/48837)
- 對 `supports_mid_conversation_system: false` 的模型，將較晚的 developer 訊息移入開頭的 system 訊息，使 Qwen3.5 與 Qwen3.8 不再回應 400 `System message must be at the beginning` - [PR #48897](https://github.com/BerriAI/litellm/pull/48897)
- 在 `/ocr` 上支援 Azure Document Intelligence 的 `outputContentFormat=markdown`，並以每頁的切片填入 `pages[].markdown`，而非永遠回傳純文字 - [PR #48926](https://github.com/BerriAI/litellm/pull/48926)
- 當 `drop_params` 丟棄請求的 reasoning level 時，記錄一行帶有參數、值、模型與原因的 WARNING，並讓 fal 遵循全域 `drop_params`，而非回應 400 - [PR #48933](https://github.com/BerriAI/litellm/pull/48933)
- 從各自的 chunk 重建 `n` 大於 1 的 chat 串流的每個 choice，使 `tool_permission` 檢查每個 choice，花費記錄保留每個 choice 而非只有第一個 - [PR #49002](https://github.com/BerriAI/litellm/pull/49002)
- 讓 Decisions 部署自身的 `supports_audio_input` 與 `supports_video_input` 旗標優先於成本對應表，使未列出的模型不再對每個片段回應 400，負載平衡群組也會略過會拒絕片段的部署 - [PR #49207](https://github.com/BerriAI/litellm/pull/49207)
- 當上游回報 `stop` 時，以 `finish_reason` `tool_calls` 結束 OpenAI 相容工具呼叫串流，與非串流回應一致，使用戶端執行工具 - [PR #49388](https://github.com/BerriAI/litellm/pull/49388)
- 停止 `POST /v1/moderations` 在清單 `input` 時回傳 500 `'str' object has no attribute 'get'` - [PR #49454](https://github.com/BerriAI/litellm/pull/49454)
- 在 OpenRouter 路由串流中回報回答的模型而非 `auto`，包含最終使用量 chunk 與快取重播 - [PR #49498](https://github.com/BerriAI/litellm/pull/49498)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

#### 防護欄與政策 {#guardrails-and-policies}

- 為防護欄詳細頁面新增刪除按鈕，與表格列的刪除流程共用，現在帶有輸入名稱確認與仍在使用該防護欄之項目的警告 - [PR #45893](https://github.com/BerriAI/litellm/pull/45893)
- 當選取主題時，讓 Guardrail Garden 精靈的 Next、Previous 與 Cancel 按鈕保持在對話框內，使防護欄建立能完成 - [PR #48688](https://github.com/BerriAI/litellm/pull/48688)

#### Home and LiteAdmin {#home-and-liteadmin}

- 將閘道與使用量助理統一為 Aria Agent，在浮動彈出視窗中開啟，帶有建議問題，並可從 Usage 頁面到達 - [Commit f0f1540](https://github.com/BerriAI/litellm/commit/f0f15404d5d29334d658a65d7dbb1d29183291bf)
- 為 Aria 新增使用量圖表與回答的 PDF 匯出 - [Commit e476697](https://github.com/BerriAI/litellm/commit/e4766973a0466e2cdb99ad243aac0081d2bce83b)
- 在 Aria 模型選取器內顯示 No available models，而非在編寫器上方顯示另一個橫幅 - [PR #48223](https://github.com/BerriAI/litellm/pull/48223)
- 將 Aria 啟動器從右下角浮動按鈕移到儀表板標頭的 Docs 旁邊，使其不再遮住 Logs 分頁 - [PR #48454](https://github.com/BerriAI/litellm/pull/48454)
- 將 Aria Agent 頭像隨 Admin UI 一起打包，使 UI 不是從代理程式的 `/ui` 掛載提供時，不再顯示損壞的圖片 - [PR #48890](https://github.com/BerriAI/litellm/pull/48890)

#### 記錄 {#logs}

- 當 Logs 表格、Usage 總計與 Caching 圖表的擷取出錯時，顯示帶有 Retry 的失敗狀態，而非空白頁面 - [PR #47671](https://github.com/BerriAI/litellm/pull/47671)
- 讓虛擬金鑰與記錄詳細資料中的複製圖示在瀏覽器 Clipboard API 不可用時也能運作，並顯示成功或錯誤 toast，而非默默失敗 - [PR #48425](https://github.com/BerriAI/litellm/pull/48425)
- 將花費記錄詳細 URL 中的請求 ID 進行百分比編碼，使 ID 中含有 `#`、`?` 或 `%` 的 Logs 列能顯示其請求與回應，並以相同方式修復 `lite debug claude` - [PR #48630](https://github.com/BerriAI/litellm/pull/48630)

#### Models + Endpoints {#models--endpoints}

- 在模型頁面上顯示 Kubernetes pods 卡片，由新的 `GET /model/{model_id}/kubernetes_pods` 支援，列出服務主機、就緒 pod 數量與 pod IP - [PR #44666](https://github.com/BerriAI/litellm/pull/44666)
- 為 Add Model 與模型編輯表單新增 1 小時快取寫入成本欄位，使 UI 定價的 Claude 部署以管理員的費率計算 1 小時快取寫入，而非成本對應表預設值 - [PR #46830](https://github.com/BerriAI/litellm/pull/46830)
- 在模型編輯表單上以 "Enter a price of 0 or more" 拒絕負數價格，而非將其保存為負的逐 token 成本 - [PR #46978](https://github.com/BerriAI/litellm/pull/46978)
- 在模型中心、`/public/v1/model_hub` 與 `/public/model_hub` 上顯示每個模型群組最新的健康檢查，而非排序在最後的任何儲存檢查 - [PR #47552](https://github.com/BerriAI/litellm/pull/47552)
- 讓端點表單中的 pass-through 標頭改為可選，並對所有使用者預設開啟驗證開關且從儲存的值顯示 - [PR #48081](https://github.com/BerriAI/litellm/pull/48081)
- 將 Auto Router 建立簡化為從最新部署家族建議的兩個模型，帶有 Cheapest 與 Best quality 替代選項，分類器設定移至 Advanced 之下 - [PR #48451](https://github.com/BerriAI/litellm/pull/48451)
- 刪除在 LiteLLM Params JSON 編輯器中移除的金鑰，使其在重新整理後維持移除，並停止未儲存的預設值將已刪除的旗標放回儲存 - [PR #48456](https://github.com/BerriAI/litellm/pull/48456)
- 為 Model Group Alias 表格新增可排序的 Alias Name 與 Target Model Group 標頭，帶有固定的別名與依使用者保存在瀏覽器中的持續顯示順序 - [PR #48500](https://github.com/BerriAI/litellm/pull/48500)
- 在 Simple Auto Router 設定中提供與 Advanced 設定相同的已部署模型，使 ChatGPT Responses 模型不再從 Everyday 與 Hard tasks 選取器中消失 - [PR #48851](https://github.com/BerriAI/litellm/pull/48851)
- 將 Meta Model API 加入 Add Model 提供者下拉選單，使 `meta/muse-spark-1.1` 等模型能從 UI 上線 - [PR #49314](https://github.com/BerriAI/litellm/pull/49314)
- 還原 Add Credential 中的 Z.AI API Key 與 API Base 欄位，並讓 Z.AI 能在 Add Model 中選取 - [PR #49325](https://github.com/BerriAI/litellm/pull/49325)
- 在 Add Auto Router 對話框中，為 `anthropic/claude-*` 萬用字元列出的 Claude 模型建議 Auto Router 範本，而非將每個 Claude 模型都稱為缺失 - [PR #49331](https://github.com/BerriAI/litellm/pull/49331)

#### Playground and Decisions {#playground-and-decisions}

- 以預設為 `true` 的 `enable_chat_ui` 預設開啟 Chat UI，使 Chat 顯示在檢視切換器中，管理員無需先找到開關 - [PR #46918](https://github.com/BerriAI/litellm/pull/46918)
- 重新設計 Playground chat，圍繞單一編寫器與檢查器面板，逐回覆顯示路由、防護欄、速度與成本，其他選項移入 Settings 彈出視窗 - [PR #46934](https://github.com/BerriAI/litellm/pull/46934)
- 當端點能力已宣告時，在 Decisions Playground 選取器中顯示同時提供 chat 與 decisions 的模型 - [PR #48504](https://github.com/BerriAI/litellm/pull/48504)
- 透過處理 `response.reasoning_text.delta` 與 `response.reasoning_summary_text.delta`，在 Playground 中為 `/v1/responses` 顯示 reasoning，而非只有已移除的 `response.reasoning.delta` 事件 - [PR #48850](https://github.com/BerriAI/litellm/pull/48850)
- 在瀏覽器關閉後恢復 Chat 回覆，涵蓋文字 chat 與 MCP 工具執行（當 Redis 支援的背景回應開啟時），並在 UI Settings 中帶有 `Continue chats in the background` 開關 - [PR #49461](https://github.com/BerriAI/litellm/pull/49461)
- 為 Chat Tools 選單新增 Deep research，在背景研究網路並回傳帶有可點擊引用與已保存來源的報告 - [PR #49508](https://github.com/BerriAI/litellm/pull/49508)
- 將 Chat 首頁標題與編寫器佔位文字改為描述一般聊天，開啟 Deep research 時使用研究措辭 - [PR #49531](https://github.com/BerriAI/litellm/pull/49531)

#### 設定 {#settings}

- 新增 General Settings 開關，將萬用字元路由包含在模型清單中，用戶端仍可依請求覆寫 - [PR #47979](https://github.com/BerriAI/litellm/pull/47979)
- 在 Router Settings 一般設定中為 String 設定顯示文字輸入（包含已保存的保留期間與清理逾時），而非空白的值儲存格 - [PR #48431](https://github.com/BerriAI/litellm/pull/48431)

#### 團隊、使用者與存取群組 {#teams-users-and-access-groups}

- 在 Your Teams 上顯示呼叫者在每個團隊的花費與成員預算，`/v2/team/list` 回傳 `caller_membership`，使身在多個團隊的使用者不再逐一開啟每個 My User 分頁 - [PR #45674](https://github.com/BerriAI/litellm/pull/45674)
- 對未設定的預算重設期間顯示 `Never resets` 而非 `n/a`，並在空白期間會讓儲存值維持不變的地方，將空白選項標示為 `Keep current` 或 `No change` - [PR #47065](https://github.com/BerriAI/litellm/pull/47065)
- 在團隊逐模型速率限制與預算選取器中提供存取群組模型，以及模型清單為空的團隊的所有模型，而非只有 `no-default-models` - [PR #47630](https://github.com/BerriAI/litellm/pull/47630)
- 在分頁之前，對所有符合的使用者排序每個 Users 表格資料欄（包含別名、預算、更新日期、SSO、狀態與金鑰數量） - [PR #48105](https://github.com/BerriAI/litellm/pull/48105)
- 排序每個 Organizations 表格資料欄，包含預算、成員、模型與分開的 TPM 和 RPM 限制 - [PR #48106](https://github.com/BerriAI/litellm/pull/48106)
- 在分頁之前，對所有符合的團隊排序每個 Teams 表格資料欄，包含預算、速率限制、組織名稱與成員、模型和金鑰數量 - [PR #48109](https://github.com/BerriAI/litellm/pull/48109)
- 讓 Bulk Invite Users 中的 Download CSV Template 按鈕下載帶有範例列的 `bulk_users_template.csv`，而非沒有作用 - [PR #48199](https://github.com/BerriAI/litellm/pull/48199)
- 在團隊 Members 表格與 My User 分頁上顯示預算期間日期範圍（例如 Oct 1 - Nov 1, 2026），而非 Current Cycle Spend - [PR #48488](https://github.com/BerriAI/litellm/pull/48488)
- 在保存預算等無關設定時保留團隊的模型存取，並在團隊編輯器中將不受限制的團隊顯示為 All Proxy Models - [PR #49258](https://github.com/BerriAI/litellm/pull/49258)

#### 使用量 {#usage}

- 將 Usage 檢視、分頁、日期與篩選保留在 URL 中，在 Internal Users 上新增 View usage 動作，並新增 Copy Share Link 按鈕 - [PR #43425](https://github.com/BerriAI/litellm/pull/43425)
- 在 Usage 上將 ChatGPT 訂閱請求標記為 Included in subscription，並新增一張卡片，分別記錄每個帳號的月費（與計量花費分開） - [PR #44772](https://github.com/BerriAI/litellm/pull/44772)
- 在 Usage 頁面上檢查使用者與團隊成員的用戶端使用量 - [Commit e41d375](https://github.com/BerriAI/litellm/commit/e41d3751692f9564676c279afa098cba34c534d0)
- 讓管理員在 UI Settings 中選擇 Usage 頁面的預設時間範圍，未設定時維持七天預設，並遵循分享連結中的範圍 - [PR #48207](https://github.com/BerriAI/litellm/pull/48207)
- 移除已淘汰的 Old Usage 頁面與其 Experimental 側邊欄項目，並將舊的 `?page=usage` 書籤傳送到 `/ui/usage` 的目前 Usage 頁面 - [PR #49284](https://github.com/BerriAI/litellm/pull/49284)

#### 虛擬金鑰 {#virtual-keys}

- 從 `org_id` 預填金鑰編輯表單中的 Organization 選取器，使從 Virtual Keys 清單或代理程式頁面開啟的金鑰不再顯示 All Organizations - [PR #39535](https://github.com/BerriAI/litellm/pull/39535)
- 在 Save your Key 彈出視窗中顯示帶有 Copy URL 按鈕的閘道 URL，以及 Claude Code 與 Codex 的可收合 Agent instructions 卡片 - [PR #47199](https://github.com/BerriAI/litellm/pull/47199)
- 在分頁之前，對所有符合的金鑰依到期、最後活動、預算重設、生命週期花費與 token 或請求限制排序虛擬金鑰 - [PR #48074](https://github.com/BerriAI/litellm/pull/48074)
- 當到期欄位空白時，在金鑰編輯與重新產生請求中排除 `duration`，使帶有上限 `duration` 的代理程式不再以 `Invalid duration format` 拒絕 - [PR #48634](https://github.com/BerriAI/litellm/pull/48634)

#### 一般 {#general-1}

- 在修補版本的升級通知中計算整個次要系列，使 v1.105.1 不再讀作 0 個新功能，舊修補版本上的管理員也能看到升級帶來的一切 - [PR #46942](https://github.com/BerriAI/litellm/pull/46942)
- 新增 `LITELLM_UI_USE_SI_TERMINOLOGY`，在 Admin UI 中以 SI 取代 AI，於 `/.well-known/litellm-ui-config` 上公開，而傳送給模型的提示保持 AI - [PR #47440](https://github.com/BerriAI/litellm/pull/47440)
- 重新建置儀表板 bundle，從其編譯檔案中移除已退役的範例 master key，使複製的片段不再帶有它 - [PR #47612](https://github.com/BerriAI/litellm/pull/47612)
- 從文件變更記錄而非 GitHub 的最新版本取得升級通知的版本與連結，使鈴鐺只提供有已發佈變更記錄頁面的版本 - [PR #47998](https://github.com/BerriAI/litellm/pull/47998)
- 新增 Moyai Chat 工作區，帶有內嵌的 Model Hub、圖片與使用量指標 - [Commit ca64a3b](https://github.com/BerriAI/litellm/commit/ca64a3bef2ee0c6430f338c6967288d998ed7f7e)
- 在 Chat 的後續請求之間保留 MCP 工具結果 - [Commit 6292f21](https://github.com/BerriAI/litellm/commit/6292f217a31d3e4a1841f70dc6b848ba6b8e6d02)
- 讓 Chat 附加 PDF、文字與程式碼、Word 與 Excel 檔案，每則訊息最多四個、每個 10 MB，並在重新載入後保留 - [PR #48137](https://github.com/BerriAI/litellm/pull/48137)
- 停止在 Admin UI 中提交 Chat 訊息時，向託管服務傳送另一個遙測請求 - [PR #48225](https://github.com/BerriAI/litellm/pull/48225)
- 當搜尋工具測試器的搜尋被拒絕時，在 toast 中顯示代理程式的錯誤訊息，而非顯示 0 個結果與 No results found - [PR #48478](https://github.com/BerriAI/litellm/pull/48478)
- 為金鑰、團隊、使用者與組織的 Spend 磚塊新增工具提示，顯示預算期間、最大預算、重設間隔與目前花費，並為以預算期間建立的組織排程重設 - [PR #48487](https://github.com/BerriAI/litellm/pull/48487)
- 在深色模式的 Connect 與 Chat 中顯示設定的深色標誌，支援私有伺服器圖片，並在 Chat 側邊欄與行動抽屜中顯示組織品牌 - [PR #48532](https://github.com/BerriAI/litellm/pull/48532)
- 當 SI 用語開啟時，讓 XecGuard 與 Airia 供應商名稱與複製的代理程式指示保持 AI 措辭，而非顯示 "XecGuard SI" 與 "SI gateway" - [PR #48670](https://github.com/BerriAI/litellm/pull/48670)
- 透過共用的 shadcn `Kbd` 元件在整個 Admin UI 中呈現鍵盤快速鍵提示，使小圖示在每個頁面上看起來一致 - [PR #48885](https://github.com/BerriAI/litellm/pull/48885)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 在 `/team/block` 與 `/team/unblock` 上重新整理快取的團隊，並透過 Redis 通知其他代理程式，使被封鎖的團隊金鑰停止運作，解除封鎖的則恢復，無需等待快取到期 - [PR #35643](https://github.com/BerriAI/litellm/pull/35643)
- 在代理程式伺服器、驗證、花費與金鑰健康錯誤上，將狀態的錯誤 `type` 與缺失的 `param` 以 JSON `null` 傳送，而非字串 "None" - [PR #39540](https://github.com/BerriAI/litellm/pull/39540)
- 將 `/key/generate` 與 `/v1/batches` 等共用處理常式路由的錯誤，4xx 標示為 `invalid_request_error`，代理程式 401 或 403 標示為 `auth_error`，而非 `internal_server_error` - [PR #39555](https://github.com/BerriAI/litellm/pull/39555)
- 將 `default_key_generate_params.allowed_routes` 套用到新產生的金鑰，包含 UI AI APIs 金鑰 - [PR #41236](https://github.com/BerriAI/litellm/pull/41236)
- 允許 `/key/update` 為沒有專案的金鑰指派專案，而非回應 400 `Project reassignment is not supported` - [PR #41700](https://github.com/BerriAI/litellm/pull/41700)
- 列出 `vertex_ai/*` 授權之下的每個已定價 Vertex 家族，並在列出的 ID 中保留 `meta/` 等 publisher 段，使每個列出的 ID 都可呼叫 - [PR #41959](https://github.com/BerriAI/litellm/pull/41959)
- 在非預期的資料庫失敗時，從 `/key/info` 回傳一般錯誤，而非在 500 body 中放原始資料庫驅動詳細資料，並在伺服器上記錄完整例外 - [PR #46190](https://github.com/BerriAI/litellm/pull/46190)
- 當 `personal_key_model_access_from_teams` 開啟時，讓個人金鑰從擁有者的團隊繼承 MCP 伺服器、MCP 工具與代理程式存取，而非列不出 MCP 伺服器卻能到達每個代理程式 - [PR #46293](https://github.com/BerriAI/litellm/pull/46293)
- 透過協調 Redis 將已刪除的金鑰從每個 worker 的驗證快取中逐出，使 `/key/delete` 停止其他 worker 在 TTL 之前繼續提供該金鑰 - [PR #47609](https://github.com/BerriAI/litellm/pull/47609)
- 在 `/key/update` 上像 `max_budget` 一樣控管 `budget_duration` 與 `budget_id` 的變更，使金鑰擁有者與團隊成員得到 403，而非縮短重設期間或移到更大的預算層級 - [PR #47681](https://github.com/BerriAI/litellm/pull/47681)
- 讓 `typesafe/*` 允許清單涵蓋帶有已定價 Jev 模型 ID 的 `/typesafe` 呼叫，使 `jev-latest` 不再得到 403，並在設定了 TypeSafe 金鑰時，於 Admin UI 模型選取器中列出 `typesafe/*` 與 Jev 模型 - [PR #47697](https://github.com/BerriAI/litellm/pull/47697)
- 將 LiteAdmin MCP 路由檢查與閘道既有的存取規則對齊 - [PR #48080](https://github.com/BerriAI/litellm/pull/48080)
- 停止為 Admin UI 搜尋查詢佔位儀表板團隊，使搜尋不再 404，並在 `search_tool_deny_by_default` 之下將非管理員儀表板使用者限定在其被授權的工具 - [PR #48464](https://github.com/BerriAI/litellm/pull/48464)
- 將例行的代理程式驗證 401 拒絕記錄為一行不帶 traceback 的 WARNING，使 ERROR 記錄只顯示驗證內部真正的崩潰 - [PR #48613](https://github.com/BerriAI/litellm/pull/48613)
- 當 `/key/generate` 或 `/user/new` 在沒有 Enterprise 授權時設定 `get_spend_routes`，回傳指出該授權的 403，而非裸 500 - [PR #48623](https://github.com/BerriAI/litellm/pull/48623)
- 將管理與健康路由的 400 與 404 拒絕標示為 `invalid_request_error` 而非 `auth_error`，並在資料庫中斷與容錯移轉時回應 503 - [PR #48739](https://github.com/BerriAI/litellm/pull/48739)
- 當 `PATCH /credentials/{name}` 收到祕密的遮罩回讀值時，保留儲存的祕密，而非將遮罩保存為金鑰並弄壞該憑證上的每個模型 - [PR #48950](https://github.com/BerriAI/litellm/pull/48950)
- 在 Claude Code 閘道的 Complete CLI Login 頁面上顯示團隊下拉選單，並為選取的團隊核發工作階段，對開發者不在其中的團隊以 400 拒絕 - [PR #49001](https://github.com/BerriAI/litellm/pull/49001)
- 讓 `lite login`、`--pkce` 預選與 Claude Code 閘道下拉選單的團隊清單維持使用者記錄中的順序，並在使用者建立、群組同步、SCIM 與 JWT 同步時依傳送順序加入團隊 - [PR #49033](https://github.com/BerriAI/litellm/pull/49033)
- 以與 chat 相同的模型檢查限定 `/health` 的範圍，使萬用字元金鑰看到它們能呼叫的模型，團隊金鑰不再看到或探測其團隊禁止的模型 - [PR #49155](https://github.com/BerriAI/litellm/pull/49155)

### SSO and SCIM {#sso-and-scim}

- 將 SCIM PATCH 企業擴充屬性（例如 `department` 與 `costCenter`）儲存在 `metadata.scim_enterprise` 中，而非默默丟棄，並對類型錯誤的企業值回應 400 - [PR #46738](https://github.com/BerriAI/litellm/pull/46738)
- 透過團隊刪除的批次路徑刪除 SCIM 群組，使其成員資格與成員的團隊金鑰被移除，而非保持啟用 - [PR #47544](https://github.com/BerriAI/litellm/pull/47544)
- 在免費 SSO 上，於建立第六位可計費使用者的帳號之前就拒絕，而既有使用者仍能登入，不會被鎖在外面 - [PR #48097](https://github.com/BerriAI/litellm/pull/48097)
- 當 `team_id_upsert` 與 `enable_jwt_auth` 設定時，在 UI SSO 登入時建立 `team_id_jwt_field` 團隊，再將使用者加入，與 API JWT 路徑已有的做法一致 - [PR #49256](https://github.com/BerriAI/litellm/pull/49256)

### 模型管理 {#model-management}

- 在 Model Hub 上顯示管理員定義的 `model_info.custom_tags` 與 `model_info.custom_metadata`，在模型群組的部署之間合併，使生命週期與容量資訊不再被丟棄 - [PR #46064](https://github.com/BerriAI/litellm/pull/46064)
- 將 `cloudflare/@cf/*` 等部分萬用字元與去除前綴的模型 ID 比對，使 `/v1/models` 與 `/model/info` 列出真正的模型，萬用字元之上的別名 ID 也能被呼叫 - [PR #46390](https://github.com/BerriAI/litellm/pull/46390)
- 保存傳送給 `POST /model/update` 的 `model_info` 欄位，而非丟棄，使 Terraform 的 `base_model` 變更不再回傳 200 卻什麼都不做 - [PR #46902](https://github.com/BerriAI/litellm/pull/46902)
- 在 `/health` 探測中要求 OpenAI 與 Azure 音訊 chat 模型輸出音訊，使 `gpt-audio` 部署不再因 400 顯示不健康 - [PR #47730](https://github.com/BerriAI/litellm/pull/47730)
- 當 Redis 開啟時，透過 `/model/new` 新增的模型在寫入後立即在每個 worker 上生效，而非最多 16 秒後，並在存取群組編輯時只改寫有變更的部署 - [PR #49034](https://github.com/BerriAI/litellm/pull/49034)
- 在提供者全域模型之前，先探測部分萬用字元（例如 `databricks/databricks-claude-*`）提供的兩個最便宜的成本對應表 chat 模型，使其健康列回報部署提供的模型 - [PR #49060](https://github.com/BerriAI/litellm/pull/49060)
- 讓帶有已保存存取時段的模型能被編輯而不出現 HTTP 500，保留時段，除非管理員取代或清除 - [PR #49316](https://github.com/BerriAI/litellm/pull/49316)

### 使用量與分析 {#usage-and-analytics}

- 將客戶清單路由分頁，預設每頁 50 位客戶，大小從 1 到 100，並讓 Usage 客戶篩選能搜尋並載入更多客戶 - [PR #48700](https://github.com/BerriAI/litellm/pull/48700)

### 代理程式設定 {#proxy-configuration}

- 新增 `general_settings.return_wildcard_routes` 設定，預設在 `/v1/models` 中顯示萬用字元路由，請求參數仍可覆寫 - [PR #43624](https://github.com/BerriAI/litellm/pull/43624)
- 當 `--num_workers`、`NUM_WORKERS` 或 `DEFAULT_NUM_WORKERS_LITELLM_PROXY` 大於 1 且 uvicorn 為 0.50.0 或更新版本時，讓每個 worker 以 `--reload` 執行，在每次保存時重新啟動整個池，而非備援到單一 worker - [PR #45909](https://github.com/BerriAI/litellm/pull/45909)
- 依列修訂在每個 worker 上取消設定已移除的儲存環境變數，使被移除的提供者金鑰停止提供流量，無需重新啟動每個 pod - [PR #46709](https://github.com/BerriAI/litellm/pull/46709)
- 記錄一行開機 WARNING，指出每個取代了程序環境中已設定值的設定 `environment_variables` 金鑰，且不印出其值 - [PR #47165](https://github.com/BerriAI/litellm/pull/47165)
- 讓 `enforce_project_model_quota` 接受 `default`、`providers` 與 `models` 項目，指出每個提供者或模型需要哪些 `rpm` 與 `tpm` 限制，`[]` 表示豁免，並在 400 中指出每個模型缺失的限制 - [PR #47693](https://github.com/BerriAI/litellm/pull/47693)
- 新增 `suppress_startup_output`（或 `LITELLM_SUPPRESS_STARTUP_OUTPUT=true`），關閉啟動橫幅、模型清單與 Search Tools 清單，並在 stdout 不是彩色終端時去除顏色代碼 - [PR #47708](https://github.com/BerriAI/litellm/pull/47708)
- 新增 `LITELLM_DISABLE_LATEST_RELEASE_CHECK=true`，讓 `/get/latest_release_info` 不發出任何對外請求就回傳 `null`，供鎖定的網路使用 - [PR #48065](https://github.com/BerriAI/litellm/pull/48065)
- 新增 `LITELLM_OFFLINE_MODE=true`，停止 LiteLLM 自行發出的目錄、版本、遭外洩密碼與 tokenizer 擷取，改用隨附的副本 - [PR #48096](https://github.com/BerriAI/litellm/pull/48096)
- 將傳送給 `/config/field/update` 的布林設定儲存為真正的 `true` 或 `false`，而非 "true" 或 "yes" 等文字，使代理程式不再將顯示為開啟的開關視為關閉 - [PR #48595](https://github.com/BerriAI/litellm/pull/48595)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- 從小型 `litellm_cli` 套件啟動 `lite` 與 `litellm-proxy`，不初始化 litellm SDK，使每個命令不再於 1 vCPU VM 上付出約 4.6 秒的匯入時間 - [PR #46803](https://github.com/BerriAI/litellm/pull/46803)
- 新增 `lite claude --subscription` 與 `--no-subscription`，將 Claude Code 的 claude.ai 登入保留在 `Authorization` 中，並在 `x-litellm-api-key` 中傳送 LiteLLM 金鑰 - [PR #47385](https://github.com/BerriAI/litellm/pull/47385)
- 從 `lite pi` 傳送 pi 的 `x-session-id` 標頭，使 pi 工作階段在記錄中分組，並以工作階段親和性黏在單一部署上 - [PR #47700](https://github.com/BerriAI/litellm/pull/47700)
- 讓代理程式決定 `lite login` token 何時到期，使 `lite auth print-token` 與 `lite whoami` 不再於 24 小時後將其視為到期，Claude Code 也能繼續運作 - [PR #47712](https://github.com/BerriAI/litellm/pull/47712)
- 新增 `litellm-setup` 代理程式技能，將 Claude Code 等程式設計代理程式從零帶到在 uv 或 Docker 上執行的代理程式，並將 repo 的貢獻者技能從一般使用者安裝中隱藏 - [PR #47731](https://github.com/BerriAI/litellm/pull/47731)
- 以 `lite codex --subscription` 保留 ChatGPT 登入，只在 `x-litellm-api-key` 標頭中傳送 LiteLLM 金鑰，並新增 `codex_subscription` `lite config` 金鑰以預設開啟 - [Commit 295d79f](https://github.com/BerriAI/litellm/commit/295d79fc7d9f935165e07c66e150a8579d511d4c)
- 為 `lite codex` 提供 Codex 已知模型的別名該模型的目錄項目，使 Codex 保留工具搜尋，並停止在每個回合傳送每個 MCP 工具定義 - [PR #48894](https://github.com/BerriAI/litellm/pull/48894)
- 在 `lite pi`、`lite opencode` 與 `lite codex` 中提供每個模型群組來自 `/model_group/info` 的 reasoning level，並在 `/v1/models?client_version=...` 的 Codex 目錄中加入相同的 level - [PR #48949](https://github.com/BerriAI/litellm/pull/48949)
- 新增 `general_settings.claude_code_marketplace_auth_required`，將 Claude Code 市集放在 LiteLLM 金鑰標頭之後並清空公開技能中心，並在兩條路由的 500 上回傳固定訊息 - [PR #48980](https://github.com/BerriAI/litellm/pull/48980)
- 為 Claude Code 與 Codex 請求遵循 `litellm_settings.drop_params: false`，使不受支援的設定像其他用戶端一樣回應 400，而非默默丟棄並回傳 200 - [PR #49058](https://github.com/BerriAI/litellm/pull/49058)

### Terraform {#terraform}

- 透過 `image_tag` 將 AWS Terraform 模組的元件映像預設為模組發佈標籤，而非為每個模組版本部署過時的 `v1.86.0-dev` 映像 - [PR #46960](https://github.com/BerriAI/litellm/pull/46960)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 為 PANW Prisma AIRS 防護欄新增可選的 `include_masked_response_on_block` 設定，在阻擋回應的 400 body 中回傳 AIRS 的 `response_masked_data` - [PR #46219](https://github.com/BerriAI/litellm/pull/46219)
- 在 `generic_guardrail_api` 中接受 Gemini 原生工具，新增可選的 `forward_messages_as_sent`，並在 fail-open 記錄行中指出錯誤類型，使逾時不再讀作連線被拒 - [PR #46338](https://github.com/BerriAI/litellm/pull/46338)
- 為 `generic_guardrail_api` 防護欄新增可選的 `num_retries` 設定（0 到 5），使連線後遺失的檢查在新的連線上重試，而非讓請求失敗 - [PR #46965](https://github.com/BerriAI/litellm/pull/46965)
- 合併重疊的 Presidio 實體範圍，使 `output_parse_pii: true` 不再損壞 `<PHONE_NUMBER_3>` 等編號的 PII token，並回傳使用者的原始值 - [PR #47024](https://github.com/BerriAI/litellm/pull/47024)
- 以 `hide-secrets` 防護欄遮罩工具結果、工具輸入、工具呼叫引數、`system` 與 `instructions` 中的祕密（該防護欄過去只掃描訊息文字），並記住乾淨的文字，使重新傳送的工具歷史只掃描一次 - [PR #47122](https://github.com/BerriAI/litellm/pull/47122)
- 允許通用防護欄 API 上的 `pre_mcp_call`、`during_mcp_call` 與 `post_mcp_call` 模式，使以該方式設定的防護欄附加到 MCP 工具呼叫，而非在啟動時被丟棄 - [PR #48060](https://github.com/BerriAI/litellm/pull/48060)
- 新增 Reco 作為原生 `pre_call` 防護欄，在啟動時驗證 `reco_tenant_id`，並透過 `fail_on_error: true` 預設 fail closed - [PR #48243](https://github.com/BerriAI/litellm/pull/48243)
- 將 LiteLLM 植入的 `litellm_metadata` 從 pass-through 路由上的文字防護欄掃描中排除，使金鑰雜湊、使用者電子郵件、團隊與花費欄位不再作為提示文字傳送 - [PR #48276](https://github.com/BerriAI/litellm/pull/48276)
- 讓 `hide-secrets` 遵循 `skip_tool_message_in_guardrail`，使旗標開啟時工具結果原樣到達模型，而工具呼叫引數、使用者文字與 system 提示仍被遮罩 - [PR #48689](https://github.com/BerriAI/litellm/pull/48689)
- 在讀取 `texts` 的防護欄中掃描 `/v1/responses` 工具結果，並將編輯寫回 `output`，如同 chat completions 已有的做法 - [PR #48827](https://github.com/BerriAI/litellm/pull/48827)
- 在 `google_text_moderation` 中略過 `/v1/embeddings` 輸入，使 embeddings 請求不再因 `stocks` 或 `mortgage` 等無害詞彙被 400 阻擋 - [PR #48934](https://github.com/BerriAI/litellm/pull/48934)
- 讓 `lakera_v2` 上的 `on_flagged: block` 對僅 PII 的偵測回傳 400 而非遮罩並允許，並新增 `on_flagged: mask` 以保留遮罩並允許的行為 - [PR #48944](https://github.com/BerriAI/litellm/pull/48944)
- 為 Bedrock 防護欄新增可選的 `streaming_scan_in_background`，使取樣的串流掃描在 chunk 繼續流動時執行，被標記的掃描在下一個 chunk 之前結束串流 - [PR #48952](https://github.com/BerriAI/litellm/pull/48952)
- 當串流結束時，在 `post_call` 防護欄之下掃描並改寫串流的 `/v1/completions`，使遮罩的詞彙以遮罩形式回傳，被阻擋的詞彙不再回傳 200 - [PR #49035](https://github.com/BerriAI/litellm/pull/49035)
- 當 `/v1/messages` 串流以上游錯誤結束時保留該錯誤，使 `tool_permission` 不再以自己的 400 取代它，Presidio 也會遮罩這些串流 - [PR #49088](https://github.com/BerriAI/litellm/pull/49088)
- 在 Headroom 壓縮與擷取請求上傳送不透明的租戶範圍 `x-headroom-affinity` 標頭，使兩者到達同一個 pod，擷取不再錯過其本機快取 - [PR #49255](https://github.com/BerriAI/litellm/pull/49255)
- 以 Ovalix 防護欄掃描附加檔案、工具呼叫與工具結果，並將沒有使用者的請求以 actor `unknown` 傳送，使其維持 Ovalix 強制 - [PR #49309](https://github.com/BerriAI/litellm/pull/49309)
- 為 `/guardrails/apply_guardrail` 新增 `response_format` 選項，回傳設定之防護欄的原生結構化發現，省略時保留 `response_text` 回應 - [PR #49460](https://github.com/BerriAI/litellm/pull/49460)
- 新增 Bedrock 防護欄 `outputScope` 設定，使 `FULL` 回傳未偵測到的評估（例如正面的 grounding 分數） - [PR #49470](https://github.com/BerriAI/litellm/pull/49470)

### 記錄與可觀測性 {#logging-and-observability}

#### Arize {#arize}

- 依追蹤 ID 的 SHA-256 為每個團隊決定 Arize 取樣，使每個 pod 與 worker 保留或丟棄相同的追蹤 - [PR #47468](https://github.com/BerriAI/litellm/pull/47468)

#### Langfuse {#langfuse}

- 在 OTEL v2 上將金鑰、使用者、終端使用者、團隊與組織身分作為 `langfuse.observation.metadata` 與 `langfuse.trace.metadata` 傳送，使 Langfuse 能依其篩選 generations - [PR #42697](https://github.com/BerriAI/litellm/pull/42697)
- 為 LiteLLM 啟動的 `langfuse_otel` 追蹤設定追蹤層級的名稱、輸入、輸出與標籤，除非呼叫者已設定名稱，否則命名為 `litellm-{call_type}` - [PR #42705](https://github.com/BerriAI/litellm/pull/42705)
- 從 `langfuse_otel` 傳送 LiteLLM 的 completion 開始時間作為 `langfuse.observation.completion_start_time`，使 Langfuse 顯示第一個 token 的時間，包含串流的 `/v1/messages`、原生 Gemini、Interactions 與 A2A 呼叫 - [PR #45597](https://github.com/BerriAI/litellm/pull/45597)
- 在 OTel v2 上將使用者、標籤與工作階段傳送到金鑰與團隊的 Langfuse 目的地（無需全域 Langfuse 金鑰），並停止重複的 generation 或孤立 span - [PR #48718](https://github.com/BerriAI/litellm/pull/48718)

#### OpenTelemetry {#opentelemetry}

- 在 OTel V1 與 V2 span 上以 `litellm.cache_hit` 旗標回報零成本的快取命中，並為 V2 快取命中發出 LLM 呼叫 span - [PR #43604](https://github.com/BerriAI/litellm/pull/43604)
- 將錯誤文字放在每個失敗 OTel span 的狀態上，使 Langfuse 與 Phoenix 顯示它，而非空白的 ERROR 訊息 - [PR #44185](https://github.com/BerriAI/litellm/pull/44185)
- 當價格查詢失敗時省略 span 成本而非傳送 0，使 Arize 與 Langfuse 能區分未定價的呼叫與免費的呼叫 - [PR #44187](https://github.com/BerriAI/litellm/pull/44187)
- 在 OTel GenAI semconv 或 OTel v2 之下，將設定的 `pass_through_endpoints` 路由的 span 與持續時間指標標示為 `litellm.passthrough` 而非 `chat`，使其離開 chat 圖表 - [PR #48675](https://github.com/BerriAI/litellm/pull/48675)
- 對 `/model/info` 等被排除的請求，在 OTel v2 上抑制驗證與資料庫 span，而非匯出孤立追蹤 - [PR #48720](https://github.com/BerriAI/litellm/pull/48720)
- 只有在設定了 `OTEL_EXPORTER=console` 時才將 OTel v2 span 印到 stdout，使提示不再與 Langfuse、Arize 或金鑰與團隊目的地一起出現在容器記錄中 - [PR #48723](https://github.com/BerriAI/litellm/pull/48723)
- 結束 `/v1/models` 與 `GET /v1/models/{model_id}` 的請求 span，使模型清單呼叫依 `traceparent` 出現在呼叫者的追蹤中 - [PR #49141](https://github.com/BerriAI/litellm/pull/49141)

#### Prometheus {#prometheus}

- 在 Prometheus 中將成功的備援請求計入呼叫者請求的模型之下，使依原始模型篩選能找到它們 - [PR #45555](https://github.com/BerriAI/litellm/pull/45555)
- 再次將提供者端的 401 計入 `litellm_deployment_failure_responses` 與 `litellm_deployment_state`，使提供者金鑰被輪替或撤銷的部署不再看起來健康 - [PR #46668](https://github.com/BerriAI/litellm/pull/46668)
- 在入列、彙總與資料庫刷新後，將記憶體內的花費更新佇列大小回報為數值的 Prometheus 樣本 - [PR #46956](https://github.com/BerriAI/litellm/pull/46956)
- 再次從 `12.0` 與 `856.5` 等小數標頭設定剩餘速率限制 gauge，只略過標頭值無法讀作數字的 gauge - [PR #47039](https://github.com/BerriAI/litellm/pull/47039)
- 當 Prometheus 開啟時，在啟動後將 `/metrics` 保留在後端，而非回應 404 - [PR #47129](https://github.com/BerriAI/litellm/pull/47129)
- 將部署失敗指標標示為請求被路由到之部署的提供者，而非 `api_provider=None`，涵蓋 embeddings、原生 `/v1/responses`、原生 `/v1/messages`、速率限制與不受支援參數的失敗 - [PR #47384](https://github.com/BerriAI/litellm/pull/47384)

#### S3 {#s3}

- 對串流的 `/v1/messages` 呼叫執行舊版 `success_callback: ["s3"]`，使每個串流呼叫像非串流呼叫一樣將物件寫入 bucket - [PR #47156](https://github.com/BerriAI/litellm/pull/47156)

#### 一般 {#general-2}

- 從 Logging Callbacks 頁面刪除在 `callbacks` 或 `failure_callback` 之下設定的回呼，而非對 `success_callback` 之外的任何項目回應 404 - [PR #42740](https://github.com/BerriAI/litellm/pull/42740)
- 當訊息記錄關閉時，在請求與回應記錄、花費記錄請求 body 與回呼負載中遮蔽 Responses `instructions` - [PR #43315](https://github.com/BerriAI/litellm/pull/43315)
- 當 `json_logs` 開啟時，將每個代理程式啟動行作為 JSON 記錄紀錄發出，包含 uvicorn 或 granian 產生的 worker 的橫幅、模型清單與通知 - [PR #47035](https://github.com/BerriAI/litellm/pull/47035)
- 在串流中途失敗的警示中回報部署設定的 `api_base`、模型群組、金鑰名稱與團隊，而非沒有上下文的 `https://api.openai.com` - [PR #47045](https://github.com/BerriAI/litellm/pull/47045)
- 對失敗的語音、轉錄、影像、OCR 與搜尋呼叫以及代理程式拒絕的請求，每次非同步呼叫只觸發一個 `CustomLogger` 失敗 hook，而非同步與非同步兩個 hook 都觸發 - [PR #47124](https://github.com/BerriAI/litellm/pull/47124)
- 當 `json_logs` 開啟且設定了 `LITELLM_LOG` 時，保留根記錄器的 INFO 行，使自訂回呼與第三方程式庫的 INFO 記錄不再被丟棄 - [PR #47175](https://github.com/BerriAI/litellm/pull/47175)
- 為已完成的批次傳遞設定的成功回呼，並在遮蔽開啟時保留回應 ID、模型、使用量與成本 - [PR #47192](https://github.com/BerriAI/litellm/pull/47192)
- 將計費的背景 Responses 成本傳送給建立金鑰與團隊的記錄器，包含遮蔽 - [PR #47506](https://github.com/BerriAI/litellm/pull/47506)
- 在花費記錄與回呼負載中以 `is_silent_experiment` 標記鏡像的 `silent_model` 呼叫，只由路由器設定，使用戶端在 metadata 中傳送的旗標不再標記某一列 - [PR #48888](https://github.com/BerriAI/litellm/pull/48888)
- 停止 `--detailed_debug` 錯誤記錄行將終端切換為粗體紅色而不重設，使後續記錄行不再保持紅色 - [PR #48966](https://github.com/BerriAI/litellm/pull/48966)
- 只在請求 body 進入代理程式與離開前往提供者之處，在 `--detailed_debug` 之下印出它，並刪除沒有內容的逐請求記錄行 - [PR #48973](https://github.com/BerriAI/litellm/pull/48973)
- 記錄路由器拒絕的影像生成請求，使部署限制不再在失敗記錄中留下缺口 - [PR #49349](https://github.com/BerriAI/litellm/pull/49349)
- 記錄在分發前被拒絕的 A2A 呼叫（例如被禁止或未知的代理程式），帶有呼叫者與目標代理程式 - [PR #49492](https://github.com/BerriAI/litellm/pull/49492)

### 祕密管理工具 {#secret-managers}

- 在每次呼叫時解析管理員設定之 `api_key` 中的 `oidc/file/` 與 `oidc/env/` 參照，使輪替的 token 能運作，模型不再回應 401 `Invalid API Key` - [PR #47341](https://github.com/BerriAI/litellm/pull/47341)
- 依每個請求將 `api_key: oidc/google/<audience>` 解析為該 audience 的 Google ID token，使 `hosted_vllm` 與其他 OpenAI 相容模型不再回應 401 - [PR #47703](https://github.com/BerriAI/litellm/pull/47703)

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 當串流的最後一個 chunk 以普通 dict 攜帶使用量時，保留快取與 reasoning token 數量，使這些串流不再以每個輸入 token 都是新鮮的來定價 - [PR #36678](https://github.com/BerriAI/litellm/pull/36678)
- 在原生 Anthropic `/v1/messages` 上依部署的每秒費率計費，而非逐 token 價格 - [PR #42417](https://github.com/BerriAI/litellm/pull/42417)
- 在用戶端的回應 ID 之下記錄並計費 `/v1/responses` 上非串流 MCP 自動執行的兩次模型呼叫，並對 Anthropic 等橋接提供者回應 200 而非 400 - [PR #43667](https://github.com/BerriAI/litellm/pull/43667)
- 還原後端不傳送使用量之串流的 token 估計，使花費記錄、預算與 TPM 限制不再記錄 0 個 token 與 $0 - [PR #44230](https://github.com/BerriAI/litellm/pull/44230)
- 以區域 10% 加成與部署的位置為串流的 Vertex AI pass-through 呼叫定價，使其與非串流呼叫計費相同 - [PR #44795](https://github.com/BerriAI/litellm/pull/44795)
- 在沒有 `stream_options` 的串流 `/v1/completions` 上要求使用量，使花費遵循提供者的數量而非計算的文字 - [PR #45366](https://github.com/BerriAI/litellm/pull/45366)
- 讓背景互動帳單在崩潰、延遲重啟以及逐模型 `api_key` 或 Vertex AI 專案部署之下保持，並讓請求的標籤保留在另一個 replica 寫入的帳單上 - [PR #45743](https://github.com/BerriAI/litellm/pull/45743)
- 停止在 OpenAI pass-through 上將 `GET /responses/{id}`、`input_tokens`、`input_items` 與 `DELETE /responses/{id}` 計費為 Responses 呼叫，並停止其 ERROR 記錄行 - [PR #47171](https://github.com/BerriAI/litellm/pull/47171)
- 以各自的 `tavily/search-advanced` 與 `linkup/search-deep` 價格計費 Tavily `search_depth: "advanced"` 與 Linkup `depth: "deep"` 搜尋，而非基本費率 - [PR #47411](https://github.com/BerriAI/litellm/pull/47411)
- 在一列花費上計費 chat completions MCP 自動執行的兩次模型呼叫，使該列與 `usage` 及 `x-litellm-response-cost` 一致 - [PR #47422](https://github.com/BerriAI/litellm/pull/47422)
- 在一列花費上計費串流 `/v1/responses` MCP 自動執行的每一輪，並在最終的 `response.completed` 使用量中加總所有模型呼叫 - [PR #47445](https://github.com/BerriAI/litellm/pull/47445)
- 依回應模型的價格列計費 `base_model` 部署（例如 `azure/eu/o3` 與 `azure/eu/o4-mini`），而非 $0 - [PR #47497](https://github.com/BerriAI/litellm/pull/47497)
- 在兩個回呼註冊表中註冊一個共用的計費記錄器，使請求不再被計算兩次 - [PR #47510](https://github.com/BerriAI/litellm/pull/47510)
- 當 Responses 串流中途失敗時，從提示與串流文字計費部分使用量，並將失敗的橋接 `/v1/messages` 串流回報給代理程式 - [PR #47537](https://github.com/BerriAI/litellm/pull/47537)
- 新增 `model_info.pricing_provider`，以另一個提供者的成本對應表列為部署定價，使其在 `custom_llm_provider: openai` 之下不再計費 $0 - [PR #47620](https://github.com/BerriAI/litellm/pull/47620)
- 透過先交出緩衝的 aiohttp 位元組，計費串流在連線中斷前傳送的使用量，使被切斷的 `/v1/messages` 嘗試記錄其 `message_start` token 而非 0 - [PR #47838](https://github.com/BerriAI/litellm/pull/47838)
- 以 Flex、Priority 與 Batch 費率計費 Gemini 音訊輸入與快取音訊，而非 Standard 費率 - [PR #48086](https://github.com/BerriAI/litellm/pull/48086)
- 在 Responses API 上以其專屬的 `cache_creation_input_token_cost_above_12hr` 費率計費 OpenAI 12 小時提示快取寫入，而非 30 分鐘寫入費率 - [PR #48088](https://github.com/BerriAI/litellm/pull/48088)
- 以呼叫時設定的 `input_cost_per_token` 與 `output_cost_per_token` 計費 `litellm.responses()` 與 `litellm.aresponses()`，而非成本對應表價格或不計費 - [PR #48119](https://github.com/BerriAI/litellm/pull/48119)
- 依 OpenCode 在回應上回報的成本計費 `opencode_go/*` 請求（包含串流與原生 `/v1/messages`），而非 $0 或靜態價格列 - [PR #48254](https://github.com/BerriAI/litellm/pull/48254)
- 以批次 12 小時費率計費回報 12 小時快取寫入的 OpenAI 批次請求，並在成本對應表中接受 12 小時批次與 ultrafast 快取寫入欄位 - [PR #48259](https://github.com/BerriAI/litellm/pull/48259)
- 在花費與 `x-litellm-response-cost` 中將 Bedrock 原生 `guardrailConfig` 追蹤使用量計費為防護欄成本，並在 `/v1/messages` 上套用部署的 `guardrailConfig` - [PR #48278](https://github.com/BerriAI/litellm/pull/48278)
- 讓僅資料庫部署的自訂定價在 Price Data Reload 後保持，使原生 `/v1/messages` 請求不再在重啟前記錄 $0 花費 - [PR #48486](https://github.com/BerriAI/litellm/pull/48486)
- 當代理程式從 OpenAI 格式串流重建使用量時，將原生 Claude 網頁搜尋費用包含在串流回應的成本中 - [PR #48528](https://github.com/BerriAI/litellm/pull/48528)
- 以其 token 價格計費 NaN 或無限的提供者成本，並將任何其他非有限成本記錄為 $0，使一個壞成本不再阻擋每日花費寫入或回應 500 - [PR #48829](https://github.com/BerriAI/litellm/pull/48829)
- 在一列花費上計費自動執行 MCP 工具之串流 chat completions 請求的兩次模型呼叫，最後的使用量 chunk 與其一致，而非只計費一次呼叫 - [PR #48899](https://github.com/BerriAI/litellm/pull/48899)
- 當回應指出未定價的模型時，依請求模型的費率計費，使以顯示名稱回答的 Fireworks 呼叫不再記錄 $0 - [PR #48900](https://github.com/BerriAI/litellm/pull/48900)
- 當 SDK 呼叫共用同一個 `metadata=` dict 時，每次呼叫只計費其自身的原生 Bedrock 防護欄追蹤，而非加上所有先前呼叫的防護欄單位 - [PR #48923](https://github.com/BerriAI/litellm/pull/48923)
- 在普通與串流的 chat 與 Responses 呼叫上計費 OpenAI 相容閘道回報的數值 `usage.cost`，除非部署設定了自己的 `input_cost_per_token`、`output_cost_per_token` 或 `base_model` - [PR #48953](https://github.com/BerriAI/litellm/pull/48953)
- 將 LiteLLM 的帳單放在 chat 與 Responses 串流最後一個使用量 frame 的 `usage.cost` 中，使其與花費列及 `x-litellm-response-cost` 一致，而非上游的數字 - [PR #48955](https://github.com/BerriAI/litellm/pull/48955)
- 依 `billed_units` 為 Foundry `/v1/embed` 與 `/v2/embed` 中繼以及 `/cohere/v2/embed` 上的原生 Cohere embed 呼叫定價，並以成本對應表的影像價格計費直接的 Cohere 影像嵌入，而非 $0 - [PR #48978](https://github.com/BerriAI/litellm/pull/48978)
- 在回應標頭傳送之前，將同步請求的成本定案一次，使標頭、花費記錄、彙總與預算計數器一致，已完成的提供者使用量也能在呼叫後 hook 失敗與取消時保留 - [PR #48993](https://github.com/BerriAI/litellm/pull/48993)
- 在 `model_info` 中定價的 Vertex AI 部署上，依每次請求計費 Claude 網頁搜尋，並以成本對應表搜尋價格計費僅 token 的 Claude 部署，Vertex Sonnet 4.5 與 Haiku 4.5 有 0.01 USD 的列 - [PR #49160](https://github.com/BerriAI/litellm/pull/49160)
- 對 `completion_cost(stream_chunk_builder(chunks))` 以及透過 chat 橋接提供的串流 `/v1/responses` 呼叫的 `usage.cost`，只套用一次設定的利潤，而非兩次 - [PR #49254](https://github.com/BerriAI/litellm/pull/49254)
- 在批次快取、語音與 Perplexity 搜尋成本計算中保留明確的零價格，只在價格未設定時備援，而未定價的語音仍會引發錯誤 - [PR #49294](https://github.com/BerriAI/litellm/pull/49294)
- 透過建立它的部署為未受管理的 `gs://` Vertex 批次計費，使共用同一個基礎模型的第二個部署上的批次得到花費列而非沒有 - [PR #49301](https://github.com/BerriAI/litellm/pull/49301)
- 依成本對應表費率比例，在輸入與輸出之間拆分提供者回報的 `usage.cost` 總額，而非全部記為輸出成本、輸入為 0 - [PR #49357](https://github.com/BerriAI/litellm/pull/49357)
- 逐 token 為透過 Responses 橋接提供的串流 `/v1/messages` 請求定價，利潤或折扣只套用一次，而非將輸入成本記為 0、全部金額記為輸出成本 - [PR #49365](https://github.com/BerriAI/litellm/pull/49365)

### 花費記錄與每日彙總 {#spend-logs-and-daily-rollups}

- 預設在花費記錄 metadata 中保留 `user_api_key_user_email`，使請求記錄顯示內部使用者的電子郵件，而非不透明的 SSO ID - [PR #41150](https://github.com/BerriAI/litellm/pull/41150)
- 當 `request_correlation_in_logs` 開啟時，在每條路由上使用呼叫者的 `litellm_session_id` 或 `metadata.session_id` 作為花費記錄的 `session_id` - [PR #44199](https://github.com/BerriAI/litellm/pull/44199)
- 當路由器因每個部署都在冷卻而回應 429 時，在失敗列的 `error_cooldown_deployments` 中列出冷卻的部署，每個帶有其 `model_id` 與 `api_base` - [PR #47120](https://github.com/BerriAI/litellm/pull/47120)
- 當 Redis `RPUSH` 失敗時，將已排空的每日標籤花費放回記憶體佇列，使下一個 tick 重試，而非遺失該 tick 的標籤花費 - [PR #47307](https://github.com/BerriAI/litellm/pull/47307)
- 從路由器的快取模型資訊讀取部署定價以計算節省，而非為每個每日彙總列深層複製 - [PR #47400](https://github.com/BerriAI/litellm/pull/47400)
- 新增 `maximum_spend_logs_size`、`maximum_spend_logs_cleanup_target_size` 與 `maximum_spend_logs_size_check_interval`，在表格超過大小限制後刪除最舊的花費記錄列 - [PR #47450](https://github.com/BerriAI/litellm/pull/47450)
- 當以大小為基礎的花費記錄清理搭配 `use_spend_logs_partitioning` 執行時，先刪除最舊的日期分割區，使磁碟空間一次回收，並在執行摘要中回報 `partitions_dropped` - [PR #47451](https://github.com/BerriAI/litellm/pull/47451)
- 每個 pod 一次只執行一輪花費記錄清理（無論有無 Redis），使年齡工作與大小工作不再同時刪除 - [PR #47500](https://github.com/BerriAI/litellm/pull/47500)
- 當花費記錄大小清理發現重設的表格統計時執行 `ANALYZE` 並保留其可回收數量，使該輪執行而非略過或過度刪除 - [PR #47501](https://github.com/BerriAI/litellm/pull/47501)
- 忽略失敗嘗試遺留的第一個 token 時間，使重試的請求停止記錄負的完成時間（該時間曾讓以延遲為基礎的路由丟棄群組） - [PR #47541](https://github.com/BerriAI/litellm/pull/47541)
- 在 `/v1beta/interactions` 上記錄 `spend_logs_metadata`，而非在花費記錄中留為 `null` - [PR #47848](https://github.com/BerriAI/litellm/pull/47848)
- 在關閉時排空逐請求的金鑰、團隊、使用者與每日彙總，並以請求 ID 記錄其失敗，使 pod 回收不再丟棄花費記錄已落地的請求之彙總 - [PR #48131](https://github.com/BerriAI/litellm/pull/48131)
- 新增可選的 `general_settings.disable_pre_routing_error_logs`，略過在路由前被拒絕之請求（例如無效金鑰或超過預算）的零花費失敗列 - [PR #48239](https://github.com/BerriAI/litellm/pull/48239)
- 不分大小寫比對 `extra_spend_tag_headers`，使 `X-Org-Id` 等項目產生花費標籤，而非默默從花費記錄中缺失 - [PR #48620](https://github.com/BerriAI/litellm/pull/48620)
- 從使用者、團隊與組織每日活動端點回傳每個防護欄與每個 API 金鑰的每日防護欄成本，位於模型與提供者明細旁邊 - [PR #48702](https://github.com/BerriAI/litellm/pull/48702)
- 在每日活動報告、深入檢視與匯出中，在備援 bucket 標籤之下包含沒有模型或金鑰的花費與請求數量，使明細加總等於總計 - [PR #48925](https://github.com/BerriAI/litellm/pull/48925)
- 在 SIGTERM 時刷新標籤花費佇列，並在關閉預算內等待已排入的成功回呼，使重啟不再遺失進行中請求的標籤列與 SpendLogs 列 - [PR #48988](https://github.com/BerriAI/litellm/pull/48988)
- 新增可選的持久使用量擷取，將使用量事件與傳遞清單分批、有界地緩衝工作，並在關閉期限內排空，非串流前景請求可選擇提交確認 - [PR #49133](https://github.com/BerriAI/litellm/pull/49133)
- 將 OpenRouter 的頂層 `provider` 記錄為記錄負載隱藏參數與花費記錄 metadata 中的 `upstream_provider`，涵蓋串流與非串流 chat completions - [PR #49287](https://github.com/BerriAI/litellm/pull/49287)
- 在花費記錄中保留 rerank token 使用量，包含提供者回報的總計與零數量，而非丟棄 - [PR #49308](https://github.com/BerriAI/litellm/pull/49308)

### 預算 {#budgets}

- 新增可選的 `general_settings.self_serve_budget_policy`，使金鑰擁有者能透過 `/key/update` 在 `lower_only` 或 `ceiling` 模式下變更自己金鑰的 `max_budget` 與 `budget_limits` - [PR #44763](https://github.com/BerriAI/litellm/pull/44763)
- 以 `general_settings.request_tag_mappings` 將 W3C `baggage` 值對應到標籤，使花費與預算依每個進入點追蹤，用盡的標籤預算在提供者呼叫前拒絕請求 - [PR #47358](https://github.com/BerriAI/litellm/pull/47358)
- 將計費的背景 Responses 花費計入建立金鑰的專案及其在金鑰、層級、團隊與使用者上的逐模型預算 - [PR #47504](https://github.com/BerriAI/litellm/pull/47504)
- 在建立與編輯預算對話框中顯示花費限制與速率限制（沒有收合區段），使輸入的每個欄位都被保存 - [PR #47662](https://github.com/BerriAI/litellm/pull/47662)
- 在 `model_max_budget` 中強制 `claude-opus*` 等模型家族模式與存取群組項目，每個項目共用一個計數器，並在 `/key/info` 上顯示家族總計 - [PR #47722](https://github.com/BerriAI/litellm/pull/47722)
- 提高帶有成本之失敗花費列的即時預算計數器，使串流中途斷裂的金鑰立即被拒絕，而非等到下一次計數器修復之後 - [PR #47741](https://github.com/BerriAI/litellm/pull/47741)
- 依重設期間排序預算，比較經過時間，使 `1h`、`7d` 與 `30d` 在分頁之前於所有符合的預算中正確排序 - [PR #48107](https://github.com/BerriAI/litellm/pull/48107)
- 在 Members 分頁與團隊 API 上，將團隊成員的 `total_spend` 回報為至少其目前週期花費，並在 Budget Reset 欄中顯示下一次重設時間 - [PR #48260](https://github.com/BerriAI/litellm/pull/48260)
- 當 `/team/member_update` 為繼承團隊預設的成員設定臨時預算增加時，保留團隊重設排程，使其花費持續重設，清除增加後仍有預算 - [PR #48495](https://github.com/BerriAI/litellm/pull/48495)
- 在 `/v1/messages` 上計算 Anthropic 風格的 `tool_choice` 而不出現 `KeyError`，使預算保留停止收取完整輸入上下文，小型終端使用者預算停止讓並行請求失敗 - [PR #48624](https://github.com/BerriAI/litellm/pull/48624)
- 將 `max_end_user_budget_id` 套用到快取金鑰上沒有列的終端使用者，使新的終端使用者在每個請求上都得到預設預算的限制，而非只有第一個 - [PR #48704](https://github.com/BerriAI/litellm/pull/48704)
- 從終端使用者連結的預算，在虛擬金鑰、master key 與 JWT 上強制其逐模型預算 `model_max_budget`，使其無法再超支 - [PR #48815](https://github.com/BerriAI/litellm/pull/48815)
- 停止為 `BudgetExceededError` 傳送 `llm_exceptions` 警示，使得到 422 的超預算金鑰不再在每個請求上引發高嚴重性 LLM 失敗警示 - [PR #49290](https://github.com/BerriAI/litellm/pull/49290)
- 在金鑰或團隊成員預算用盡後，讓模型探索以及呼叫者的金鑰與使用者資訊維持運作 - [PR #49463](https://github.com/BerriAI/litellm/pull/49463)

### 速率限制 {#rate-limiting}

- 將原生 Responses WebSocket 上的每個 `response.create` 回合計入其部署的預算、TPM 與 RPM，並以 429 frame 拒絕超限的回合，而非只檢查第一個回合 - [PR #45727](https://github.com/BerriAI/litellm/pull/45727)
- 在建立金鑰、使用者、團隊、預算與客戶時，以 422 拒絕負數的 RPM 與 TPM 限制，而非保存會讓每個請求回傳 429 的限制 - [PR #48444](https://github.com/BerriAI/litellm/pull/48444)
- 當 SSE keepalive 開啟時，在串流完成後釋放 `max_parallel_requests` 槽位，使限制為 3 的金鑰不再在第四個連續請求時回傳 429 - [PR #48452](https://github.com/BerriAI/litellm/pull/48452)
- 當合成串流（例如串流網頁搜尋）完成時，釋放虛擬金鑰並行槽位，使連續請求停止耗盡限制 - [PR #48628](https://github.com/BerriAI/litellm/pull/48628)
- 在 Chat、Responses 與 Anthropic 內容形狀的合併 TPM 保留中計算圖片與音訊，並停止將編碼的 Responses 工具圖片計為文字 - [PR #48865](https://github.com/BerriAI/litellm/pull/48865)
- 新增由 `enforce_model_rate_limits` 強制的部署 `rpd` 與 `tpd` 每日限制，使花完每日配額的部署備援到群組中的下一個，直到 UTC 午夜 - [PR #48875](https://github.com/BerriAI/litellm/pull/48875)
- 在 `litellm_params` 中新增 `daily_reset_time`（UTC 的 `HH:MM`），選擇部署的 `rpd` 與 `tpd` 每日限制何時重新開始，而非永遠在 UTC 午夜重設 - [PR #48957](https://github.com/BerriAI/litellm/pull/48957)
- 對沒有 `max_tokens` 的請求，最多保留 `otpm` 的四分之一，並在每次呼叫後將 token 計數器與實際使用量核對，使模型最大值超過其 `otpm` 的部署不再對每個這類請求回應 429 - [PR #49054](https://github.com/BerriAI/litellm/pull/49054)
- 在每個 Responses WebSocket 回合檢查並計算部署的 `itpm` 與 `otpm`，達到限制時以 429 錯誤 frame 回應，並讓限制器的金鑰不進入提供者 metadata - [PR #49069](https://github.com/BerriAI/litellm/pull/49069)
- 將每個原生 `/v1/responses` WebSocket 回合計入金鑰與標籤的 `tpm_limit`，對沒有剩餘 token 的回合回傳 429，使 Codex 工作階段停止超支 - [PR #49257](https://github.com/BerriAI/litellm/pull/49257)

## MCP 閘道 {#mcp-gateway}

### 驗證與 OAuth {#auth-and-oauth}

- 停止對每種驗證類型（而非只有 OAuth pass-through）將呼叫者的 LiteLLM 虛擬金鑰轉送到上游 MCP 伺服器（當 `Authorization` 在 `extra_headers` 中時） - [PR #46932](https://github.com/BerriAI/litellm/pull/46932)
- 讓 `proxy_admin_viewer` 儲存自己的 MCP OAuth token、BYOK 金鑰、環境變數與 OAuth 用戶端註冊，而非在每次自我範圍的 MCP 憑證寫入時得到 403 - [PR #46994](https://github.com/BerriAI/litellm/pull/46994)
- 封裝 `litellm_cp_return_to` cookie，使 AWS WAF 等邊緣防火牆停止在本機程式設計代理程式的 MCP OAuth 登入回呼上回應 403 - [PR #47595](https://github.com/BerriAI/litellm/pull/47595)
- 在 `/mcp-rest/tools/list` 與 `/mcp` tools/list 上，列出沒有共用 token 之逐使用者驗證 MCP 伺服器的工具，使用者不再看到空白型錄，而工具呼叫仍需要自己的 token - [PR #47677](https://github.com/BerriAI/litellm/pull/47677)
- 為 MCP toolset URL 公告有效的 OAuth 資源 metadata，使 Codex 與 Claude Code 能登入 - [PR #48474](https://github.com/BerriAI/litellm/pull/48474)
- 在 MCP 閘道授權開始時、讀取連線流程時與同意完成時，要求有效的瀏覽器工作階段，使已登出工作階段的 UI cookie 無法再鑄造閘道 token - [PR #48494](https://github.com/BerriAI/litellm/pull/48494)
- 將沒有選取 MCP 伺服器的管理員團隊金鑰，以及團隊上管理員的 CLI 登入或 JWT，限定在該團隊的 MCP 伺服器與 toolset，並對只指出被拒 toolset 的 LLM 請求回應 403 - [PR #49161](https://github.com/BerriAI/litellm/pull/49161)

### 速率限制與防護欄 {#rate-limits-and-guardrails}

- 在上游執行之前拒絕呼叫被探索防護欄隱藏的 MCP 工具，包含沒有事先列出就進行的呼叫 - [PR #48669](https://github.com/BerriAI/litellm/pull/48669)

### 通訊協定與型錄 {#protocol-and-catalog}

- 將 `LITELLM_MCP_TOOL_LISTING_TIMEOUT` 套用到每個上游伺服器的分頁 `tools/list`，使一個卡住的 MCP 伺服器不再讓統一的 `/mcp` 清單延遲約 70 秒 - [PR #46513](https://github.com/BerriAI/litellm/pull/46513)
- 在 `tools/list` 上對上游 429 重試最多 3 次，當每個範圍內伺服器都失敗時回傳 JSON-RPC 錯誤 `-32603`，而非 200 與空白工具清單 - [PR #46649](https://github.com/BerriAI/litellm/pull/46649)
- 升級到 MCP SDK 2.3.0，並將每個事件的 SSE 大小上限提高到 64 MiB，使大型 MCP 工具結果停止透過閘道失敗 - [PR #47034](https://github.com/BerriAI/litellm/pull/47034)
- 當失敗的 POST 關閉 MCP 工作階段時，呈現上游 HTTP 狀態，使被速率限制的交握得到 429 重試，而非 `internal` 失敗 - [PR #47569](https://github.com/BerriAI/litellm/pull/47569)
- 在授權完成後立即傳送 MCP 工具呼叫回應標頭，而非等待約 15 秒的第一個 SSE 事件 - [PR #47897](https://github.com/BerriAI/litellm/pull/47897)
- 當型錄重新整理時，在 `/toolset/{name}/mcp` 上保留選取的 toolset，使被授予多個 toolset 的金鑰不再看到全部的工具 - [PR #48095](https://github.com/BerriAI/litellm/pull/48095)
- 對過大的 MCP 工具型錄回傳 HTTP 502，帶有每個事件的位元組限制與分頁 `tools/list` 的提示，並在彙總清單中保留健康伺服器的工具 - [PR #48424](https://github.com/BerriAI/litellm/pull/48424)
- 依需求載入已淘汰的 MCP 輔助套件別名，使舊版匯入在沒有安裝可選 MCP 閘道相依性時也能運作 - [PR #48615](https://github.com/BerriAI/litellm/pull/48615)
- 在從 URL 與本機檔案產生 MCP 工具時接受 YAML OpenAPI 文件，而非以 JSON 剖析錯誤失敗 - [PR #48622](https://github.com/BerriAI/litellm/pull/48622)
- 拒絕呼叫同時列在 `allowed_tools` 與 `disallowed_tools` 中的 MCP 工具，與其在探索中的缺席一致，並在啟動時警告重疊的 YAML 項目 - [PR #48625](https://github.com/BerriAI/litellm/pull/48625)
- 將 MCP SDK 請求拒絕（例如未知方法與無效參數）記錄為 `MCP: request_rejected` 之下的零成本失敗，帶有呼叫者的歸屬，並在初始化後讓持久 HTTP 工作階段保持存活 - [PR #49184](https://github.com/BerriAI/litellm/pull/49184)

### Admin MCP 與 UI {#admin-mcp-and-ui}

- 當 MCP 健康檢查因 HTTP 錯誤失敗時，記錄清理過的上游交換，使 `/v1/mcp/server/health` 失敗顯示上游狀態與 body - [PR #44125](https://github.com/BerriAI/litellm/pull/44125)
- 當 `use_redis_transaction_buffer` 開啟時，在每個 pod 上刷新工具探索佇列，使 Tool Policies 頁面與 `GET /v1/tool/list` 顯示探索到的工具 - [PR #47653](https://github.com/BerriAI/litellm/pull/47653)
- 在 MCP toolset 編輯器中跨伺服器搜尋工具並一次新增或移除多個，保留來自已停機或已刪除伺服器的已保存工具 - [PR #48601](https://github.com/BerriAI/litellm/pull/48601)
- 在 MCP 伺服器建立與編輯表單中提供 `Authorization (raw header)` 驗證類型，供需要 `ApiKey <key>` 等 scheme 的上游使用 - [PR #48629](https://github.com/BerriAI/litellm/pull/48629)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

### Auto Router 與模型路由 {#auto-router-and-model-routing}

- 讓親和性 pin 略過本次請求已失敗的部署，使加權容錯移轉與重試使用同群組中的健康部署，而非跨群組備援 - [PR #32309](https://github.com/BerriAI/litellm/pull/32309)
- 新增可選的 `router_settings.enable_mid_stream_fallback_continuation`，使在回答中途被切斷的 chat 串流，在支援 prefill 的備援上以部分回答繼續，而非以截斷結束 - [PR #41127](https://github.com/BerriAI/litellm/pull/41127)
- 新增可選的 `kubernetes_pod_discovery: true`，使 Router 將 headless service 的 `api_base` 解析為就緒的 pod IP 並在它們之間輪詢 - [PR #44342](https://github.com/BerriAI/litellm/pull/44342)
- 將帶有工作階段 ID 的請求 pin 到一個探索到的 Kubernetes pod，使 vLLM 的逐 pod 前綴快取在多回合工作階段中被重用 - [PR #44393](https://github.com/BerriAI/litellm/pull/44393)
- 透過各自的記錄副本記錄每次失敗的串流 `/v1/messages` 嘗試，使重試與備援記錄正確的使用量、成本與部署，而非混合嘗試 - [PR #45194](https://github.com/BerriAI/litellm/pull/45194)
- 當路由器設定透過 `POST /fallback` 或 `/config/update` 在執行階段更新時，在每個 worker 上套用 `content_policy_fallbacks` - [PR #45428](https://github.com/BerriAI/litellm/pull/45428)
- 當 `allowed_fails` 明確設為 3 時計算失敗，並停止找不到部署的備援流量冷卻健康的備援部署 - [PR #46183](https://github.com/BerriAI/litellm/pull/46183)
- 讓管理員在非 chat 部署上設定 `model_info.enforce_supported_endpoints: true`，使 chat 請求在任何提供者呼叫之前略過它，並備援或回應 400 - [PR #46257](https://github.com/BerriAI/litellm/pull/46257)
- 以請求逾時而非 `stream_timeout` 限制假串流呼叫，使沒有串流提供的緩慢 Bedrock 回答不再被切斷，而即時串流保留 `stream_timeout` - [PR #47162](https://github.com/BerriAI/litellm/pull/47162)
- 將金鑰與團隊的 `router_settings` 套用到 hook、用戶端憑證、逗號批次與 `user_config` 請求，並停止將 `router_settings_override` 傳送給提供者，使這些請求保留重試、備援與逾時 - [PR #47257](https://github.com/BerriAI/litellm/pull/47257)
- 每個部署只解析一次其是否追蹤使用量限制，而非每個請求都解析，每個路由請求節省約 0.2 ms 的 CPU - [PR #47393](https://github.com/BerriAI/litellm/pull/47393)
- 一旦設定了 `tag_routing_prefix`，只依帶前綴的呼叫者標籤路由，而金鑰、團隊與專案標籤仍能路由，使 `user_id:234` 等花費標籤不再得到 401 - [PR #47428](https://github.com/BerriAI/litellm/pull/47428)
- 將 `router_settings.default_priority` 請求排入佇列一次，將 `priority` 0 視為真正的優先順序，並對非整數的 `priority` 回應 400，而非在每個 chat 請求上回應 500 - [PR #47498](https://github.com/BerriAI/litellm/pull/47498)
- 在路由器提供的 chat 與文字 completions 以及 `/queue/chat/completions` 上，接受來自 `x-litellm-priority` 標頭的請求優先順序，優先於 body 的 `priority` - [PR #47618](https://github.com/BerriAI/litellm/pull/47618)
- 在沒有 assistant prefill 的情況下，於備援模型上繼續被切斷的 `/v1/responses` 串流，方法是將部分回覆作為歷史加上一個使用者回合傳送，而非回傳主要模型的 `server_error` - [PR #47672](https://github.com/BerriAI/litellm/pull/47672)
- 讓 `Router` 部署查詢等待並行的刪除、upsert 或新增，使共用的 `Router` 不再引發 `IndexError` 或回傳相鄰的部署 - [PR #47680](https://github.com/BerriAI/litellm/pull/47680)
- 將原生 Responses 延遲正規化為每個輸出 token 的秒數，使以延遲為基礎的路由以相同單位比較原生與橋接部署 - [PR #47727](https://github.com/BerriAI/litellm/pull/47727)
- 當 `enable_pre_call_checks` 開啟時，對 chat 與 `/v1/responses` 上的圖片請求略過宣告 `supports_vision: false` 的部署，使混合群組停止回傳提供者 400 - [PR #48152](https://github.com/BerriAI/litellm/pull/48152)
- 只將 `/v1/decisions` 呼叫路由到提供者支援 Decisions 的部署，使混合 OpenAI 與 Bedrock 的群組不再將呼叫傳送到 Bedrock 並回應 400 - [PR #48175](https://github.com/BerriAI/litellm/pull/48175)
- 新增可選的路由器設定，在成功容錯移轉後讓工作階段保持在其替代部署上，而非保持 pin 在原始部署 - [PR #48206](https://github.com/BerriAI/litellm/pull/48206)
- 在以延遲為基礎的路由中忽略負數與 NaN 延遲樣本，使一個壞樣本不再讓整個模型群組回傳 500 - [PR #48216](https://github.com/BerriAI/litellm/pull/48216)
- 預設在每種路由策略上，對圖片請求略過宣告 `supports_vision: false` 的部署，並在 chat completion 錯誤中加入 `x-litellm-model-id` - [PR #48241](https://github.com/BerriAI/litellm/pull/48241)
- 讓模型群組的標籤 fail-open 選擇透過親和性與冷卻篩選保持，使 pin 到沒有自己旗標之部署的 Responses API 續接不再讓標籤授權失敗 - [PR #48470](https://github.com/BerriAI/litellm/pull/48470)
- 停止用盡的轉送 Claude 訂閱將共用模型置入冷卻並阻擋其他呼叫者 - [PR #48485](https://github.com/BerriAI/litellm/pull/48485)
- 在同模式的全代理程式萬用字元之前，先提供團隊自己的萬用字元部署（例如 BYOK `openrouter/*`），使團隊憑證被使用，花費停止落在共用金鑰上 - [PR #48490](https://github.com/BerriAI/litellm/pull/48490)
- 為 Codex 壓縮請求保留持有的 `user_turn` 路由，使合成的摘要回合不再重新執行分類器並將工作階段移到另一個模型 - [PR #48627](https://github.com/BerriAI/litellm/pull/48627)
- 為複雜度路由新增可選的 Respect caller budget 模式，透過重新路由與快取感知的成本估計，保留呼叫者較小的輸出限制而非路由模型的上限 - [PR #48632](https://github.com/BerriAI/litellm/pull/48632)
- 在路由器 `allowed_fails` 之下，讓沒有備援的單一部署保持在輪替中，使呼叫到達提供者，而非在 `cooldown_time` 期間回應 429 "No deployments available" - [PR #48644](https://github.com/BerriAI/litellm/pull/48644)
- 讓工作階段層級 pin 在代理程式 worker 之間保持一致，使相同的工具續接在請求於 worker 之間移動時保留最新的工作階段層級 - [PR #48645](https://github.com/BerriAI/litellm/pull/48645)
- 在 `user_turn` 模式下給予子代理程式自己的層級 pin，使子代理程式的新問題不再取代父層級 - [PR #48701](https://github.com/BerriAI/litellm/pull/48701)
- 在 JEV auto router 連線中解析環境支援的憑證與 URL，而非默默備援到啟發式路由，並要求新的參照具有 proxy-admin 權限 - [PR #48717](https://github.com/BerriAI/litellm/pull/48717)
- 從 `enable_pre_call_checks` 中移除部署 `rpm` 篩選，使 `rpm` 與 `tpm` 是路由權重，除非設定了 `enforce_model_rate_limits` - [PR #48873](https://github.com/BerriAI/litellm/pull/48873)
- 當 `fallbacks` 或 `default_fallbacks` 使用字串目標時，再次冷卻失敗的部署，而非默默略過冷卻 - [PR #48913](https://github.com/BerriAI/litellm/pull/48913)
- 在 `Router` 初始化時，以顯示清單形式的 `TypeError` 拒絕裸字串備援目標（例如 `fallbacks: [{gpt-4: gpt-3.5}]` 或 `default_fallbacks: gpt-3.5`），而非默默永遠不路由到它 - [PR #48943](https://github.com/BerriAI/litellm/pull/48943)
- 從自訂 Python 分類器的層級到模型對應推斷路由名稱，並在這些名稱的預設模型備援執行時遵循 plan-mode 下限 - [PR #48987](https://github.com/BerriAI/litellm/pull/48987)
- 在 `POST /fallback` 與 `DELETE /fallback/{model}` 上從資料庫讀取儲存的路由器設定，使過時的快取不再丟棄先前的備援規則，設定檔設定也停止被複製到儲存的列中 - [PR #48999](https://github.com/BerriAI/litellm/pull/48999)
- 當串流請求在任何輸出到達用戶端之前遇到上下文視窗錯誤時，嘗試設定的上下文視窗備援，而非回傳錯誤 - [PR #49293](https://github.com/BerriAI/litellm/pull/49293)
- 依提供者的輸入限制為完整的 Decisions 分類器請求編列預算，並修剪過大輸入的頭尾，而非默默備援到啟發式路由，並記錄修剪與備援原因 - [PR #49306](https://github.com/BerriAI/litellm/pull/49306)
- 停止路由的審核與 embeddings 請求在圖片偵測期間以 500 失敗，並讓格式錯誤的 Messages 請求到達提供者既有的 400 - [PR #49371](https://github.com/BerriAI/litellm/pull/49371)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 讓串流的 `/v1/responses` 與 WebSocket 記錄工作保持存活，並在關閉時最多等待 5 秒，使重啟不再丟棄您的回呼仍在寫入的記錄 - [PR #31074](https://github.com/BerriAI/litellm/pull/31074)
- 在串流快取命中時重播 reasoning、引用與音訊，並像即時串流一樣依序傳送 reasoning、文字、工具呼叫 - [PR #32096](https://github.com/BerriAI/litellm/pull/32096)
- 在 Redis 訂閱重新連線後立即重新同步代理程式設定，使 worker 不再保持過時直到下一次輪詢 - [PR #43313](https://github.com/BerriAI/litellm/pull/43313)
- 在 uvicorn 的 ping 執行緒啟動後，於每個產生的 worker 內載入 LiteLLM，使緩慢主機上的多 worker 代理程式不再因 `Child process died` 崩潰循環 - [PR #45039](https://github.com/BerriAI/litellm/pull/45039)
- 從全域回呼清單中移除被丟棄之 Router 的策略選取器與呼叫前檢查，使後續請求不再從已消失的路由器複製處理常式 - [PR #45795](https://github.com/BerriAI/litellm/pull/45795)
- 只在設定了 Redis 快取時，才將 Redis 預算增量排入佇列，使沒有 Redis 的 pod 停止以每個有預算請求約 185 位元組的速度增長記憶體 - [PR #46831](https://github.com/BerriAI/litellm/pull/46831)
- 在串流緩衝回應時每 50 ms 將事件迴圈交還一次，使一個長串流不再讓 worker 上的其他請求停滯最多 0.6 秒 - [PR #46925](https://github.com/BerriAI/litellm/pull/46925)
- 透過 `client.post` 傳送 OpenAI chat completions，使 SDK 的逐訊息參數遍歷停止占用事件迴圈（在 100 萬個 token 時約 300 ms） - [PR #46967](https://github.com/BerriAI/litellm/pull/46967)
- 透過為每個普通 chunk 只建立一次 delta，減少 OpenAI 相容串流上的逐 chunk pydantic 來回 - [PR #47030](https://github.com/BerriAI/litellm/pull/47030)
- 當 `LITELLM_MODEL_COST_MAP_URL` 不是可剖析的 URL 時，備援到隨附的成本對應表，而非以 `ValueError` 讓 `import litellm` 與代理程式啟動崩潰 - [PR #47133](https://github.com/BerriAI/litellm/pull/47133)
- 在代理程式啟動後執行一次 `gc.freeze()`，使第 2 代垃圾回收停止重新遍歷啟動物件並讓每個進行中的請求暫停 0.6 到 0.8 秒 - [PR #47137](https://github.com/BerriAI/litellm/pull/47137)
- 在 `/v1/messages`、`/v1/responses`、檔案、批次、向量儲存庫與即時上，將 Bedrock AWS 區域與祕密查詢移出事件迴圈，使遠端 Vault 不再讓 worker 上的其他請求停滯 - [PR #47331](https://github.com/BerriAI/litellm/pull/47331)
- 在 worker 執行緒上建立 OpenAPI schema 並重用呈現的 body，使冷的 `/openapi.json` 不再讓 worker 上的健康檢查與管理呼叫停滯約 6 秒 - [PR #47352](https://github.com/BerriAI/litellm/pull/47352)
- 記住失敗的 HuggingFace tokenizer 下載 5 分鐘，使 llama-3、llama-2 與 cohere 的 token 計數停止重試並為每個請求增加約 23 秒 - [PR #47586](https://github.com/BerriAI/litellm/pull/47586)
- 在代理程式失敗處理常式中轉送 `dispatched_call_type`，使壞金鑰、失敗的自訂驗證或提供者錯誤回傳其真正的 401、4xx 或 5xx，而非一般的 `TypeError` - [PR #47815](https://github.com/BerriAI/litellm/pull/47815)
- 在 Redis 中緩衝工具探索，並在每次排空時以一條陳述式在自己的鎖上寫入 `LiteLLM_ToolTable`，使 `call_count` 計算真正的工具呼叫而非刷新週期 - [PR #48089](https://github.com/BerriAI/litellm/pull/48089)
- 移除磁碟快取後端與 `diskcache` 相依性，使 `cache_params.type: disk` 設定在啟動時以錯誤停止，並列出支援的快取類型 - [PR #48114](https://github.com/BerriAI/litellm/pull/48114)
- 在第一個待處理 migration 執行之前，對照既有列檢查它們並以具名報告拒絕，並新增 `litellm --check_migrations_against_existing_data` 在不套用任何東西的情況下執行相同檢查 - [PR #48493](https://github.com/BerriAI/litellm/pull/48493)
- 當用戶端在 body 上傳期間中斷連線時，以 499 中止請求，而非將 body 視為 `{}` 並記錄缺失 `messages` 的失敗 - [PR #48640](https://github.com/BerriAI/litellm/pull/48640)
- 當被逐出的 OpenAI 或 Azure SDK 用戶端被垃圾回收時，關閉其 aiohttp 工作階段，使 aiohttp 停止記錄 `Unclosed client session` - [PR #48650](https://github.com/BerriAI/litellm/pull/48650)
- 在 `import litellm` 時要求編譯的 `_native` 擴充功能，使損壞的安裝在匯入時失敗，而非在 fork 安全與例外對應關閉的情況下執行 - [PR #48852](https://github.com/BerriAI/litellm/pull/48852)
- 以逐迴圈 token 而非 `id(loop)` 作為快取非同步用戶端的鍵，使新的事件迴圈不再得到已回收迴圈的用戶端 - [PR #48877](https://github.com/BerriAI/litellm/pull/48877)
- 依 Postgres 在 migration 前索引檢查中儲存的位元組計算 btree 項目大小，使重複的 `api_key` 超過 2704 位元組不再阻擋啟動 - [PR #48911](https://github.com/BerriAI/litellm/pull/48911)
- 從該呼叫之路由器的 metadata 讀取回應快取鍵的 `model_group` 與 `caching_groups`，而非呼叫者的 `metadata`，使請求無法再填入另一個模型群組的快取項目 - [PR #48917](https://github.com/BerriAI/litellm/pull/48917)
- 讓 aiohttp 工作階段保持開啟，直到回應串流讀取完成，使用戶端在串流中途被丟棄不再以 `httpx.ReadError: Connection closed` 結束它 - [PR #48920](https://github.com/BerriAI/litellm/pull/48920)
- 停止在待處理 migration 之前於啟動時計算列數，並讓 `litellm --check_migrations_against_existing_data` 成為每個待處理 migration 的回滾試執行，回報 Postgres 自己的錯誤或所花時間 - [PR #48961](https://github.com/BerriAI/litellm/pull/48961)
- 停止在每個普通 OpenAI 或 Azure 串流 chunk 上於 pydantic 中引發並捕捉約十幾個 AttributeError，將 Azure 串流上每個 chunk 的代理程式 CPU 降低約 5% - [PR #49166](https://github.com/BerriAI/litellm/pull/49166)
- 對沒有 data URI 標記的記錄訊息文字略過 base64 圖片掃描，並將小型負載內嵌複製，使沒有圖片的請求在記錄上花費更少時間 - [PR #49228](https://github.com/BerriAI/litellm/pull/49228)
- 在每次輪詢時從 Redis 讀取優先順序排程器的共用佇列，使過期的已死亡 replica 項目停止阻擋等待者，直到它們以 408 逾時 - [PR #49387](https://github.com/BerriAI/litellm/pull/49387)
- 當 aiohttp 請求為連線槽位排隊時，以目的地、等待時間與連接器限制發出警告，使 pool 逾時能與緩慢的上游區分 - [PR #49499](https://github.com/BerriAI/litellm/pull/49499)

### Docker 與 Helm {#docker-and-helm}

- 停止 `litellm-helm` chart 預設加入佔位的 `gpt-3.5-turbo` 與 `fake-openai-endpoint` 模型，使資料庫管理的安裝不再列出假模型，或在同名模型上得到 401 - [PR #47056](https://github.com/BerriAI/litellm/pull/47056)
- 在 Helm chart 中將額外的 ingress 路徑路由到自訂 Service，帶有明確的 Service 名稱與數字或具名連接埠，同時保留元件別名與內建路由 - [PR #48674](https://github.com/BerriAI/litellm/pull/48674)

### 相依性更新 {#dependency-updates}

- 在 lock 檔案中將 aiohttp 從 3.14.3 升級到 3.14.5、yarl 從 1.23.0 升級到 1.25.1 - [PR #47369](https://github.com/BerriAI/litellm/pull/47369)
- 要求 `anyio>=4.14.0,<5.0`，使安裝不再保留可能在無人持有的鎖上卡住下一個呼叫者的舊版 anyio - [PR #47378](https://github.com/BerriAI/litellm/pull/47378)
- 允許在 Python 3.15 上安裝 LiteLLM - [PR #48359](https://github.com/BerriAI/litellm/pull/48359)
- 在兩個套件 manifest 中允許 `filelock` 4.x，使使用 LiteLLM 的專案能安裝較新的 filelock 版本而沒有相依性衝突 - [PR #49137](https://github.com/BerriAI/litellm/pull/49137)
- 在代理程式映像 lockfile 中將 `pyasn1` 升級到 0.6.5、`pypdf` 升級到 6.21.4，並在儀表板與 VS Code 擴充功能中將僅開發用的 `minimatch` 升級到 11.0.2 - [PR #49362](https://github.com/BerriAI/litellm/pull/49362)

## 文件更新 {#documentation-updates}

- 說明哪些複雜度路由器設定適用於加權啟發式、哪些適用於 heuristic v2 - [PR #48666](https://github.com/BerriAI/litellm/pull/48666)
- 從 README 的 Contributing 區段連結 LiteLLM OSS Champions 計畫 - [PR #48734](https://github.com/BerriAI/litellm/pull/48734)
- 將 README 連結到 Python SDK 頁面，並新增可收合的 Auto Routing 區段，帶有 Python 與閘道範例 - [PR #48986](https://github.com/BerriAI/litellm/pull/48986)
- 在 OpenAPI 參考中描述每日活動防護欄花費欄位與 `api_key` 篩選，包含 `unattributed` 與 `raw:` 前綴 - [PR #49236](https://github.com/BerriAI/litellm/pull/49236)
- 以目前的文件頁面取代回傳 404 的過時 `docs/proxy/enterprise` 連結 - [PR #49491](https://github.com/BerriAI/litellm/pull/49491)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 235 項變更涉及測試、CI、貢獻者工具、重構、尚未接入使用者路徑的 Rust 執行階段鷹架，或發佈簿記。它們本身不改變代理程式或 SDK 的行為。列為 commit 的變更沒有公開 PR。

<details>
<summary>整合與 e2e 測試（99）</summary>

- 在 perf 套件中以共用的 5 RPS 流量驗證資料庫升級 - [PR #46802](https://github.com/BerriAI/litellm/pull/46802)
- 在跨模型中階翻譯測試中新增 Sonnet 5.5 與 Gemini Vertex AI 列 - [PR #46896](https://github.com/BerriAI/litellm/pull/46896)
- 從在 main 上通過的整合測試中移除 BUG 略過 - [PR #46937](https://github.com/BerriAI/litellm/pull/46937)
- 在 perf 案例中將每個等待的 Postgres 陳述式上限設為每個請求 0.5 次呼叫 - [PR #46944](https://github.com/BerriAI/litellm/pull/46944)
- 在 perf 套件中測量以 SpendLog 為基礎的 Admin UI 查詢延遲 - [PR #46955](https://github.com/BerriAI/litellm/pull/46955)
- 在 perf 案例中將每個背景 Postgres 陳述式上限設為每個請求 0.9 次呼叫 - [PR #46957](https://github.com/BerriAI/litellm/pull/46957)
- 讓 event_loop_stalls perf 案例在未列入允許清單的閘道事件迴圈占用超過 100 ms 時失敗 - [PR #46974](https://github.com/BerriAI/litellm/pull/46974)
- 將沒有收集到任何東西的整合分片測試檔案回報為 pytest 收集錯誤，而非讓 xdist 崩潰 - [PR #47075](https://github.com/BerriAI/litellm/pull/47075)
- 在 `event_loop_stalls` e2e 案例中，將每個事件迴圈占用歸入能容納它的最長 gc 遍歷 - [PR #47089](https://github.com/BerriAI/litellm/pull/47089)
- 在 `usage.speed` 欄位之後重新擷取 Anthropic Claude 翻譯測試基準 - [PR #47116](https://github.com/BerriAI/litellm/pull/47116)
- 在 `usage.speed` 欄位之後重新擷取 Azure AI Claude 翻譯測試基準 - [PR #47117](https://github.com/BerriAI/litellm/pull/47117)
- 將 `event_loop_stalls` e2e 案例中的請求處理常式 bucket 上限設為 2 次占用 - [PR #47128](https://github.com/BerriAI/litellm/pull/47128)
- 在跨模型翻譯測試的 Anthropic 使用量合約中允許 `speed` - [PR #47130](https://github.com/BerriAI/litellm/pull/47130)
- 在翻譯整合測試中新增 `claude-haiku-5-5` Vertex AI 案例 - [PR #47136](https://github.com/BerriAI/litellm/pull/47136)
- 從現在通過的 2 個整合測試中移除過時的 BUG 略過 - [PR #47142](https://github.com/BerriAI/litellm/pull/47142)
- 在 e2e `get_text_external` 輔助函式中接受文字旁邊的 JSON，使 pod 記錄錯誤讀作 Kubernetes Status - [PR #47150](https://github.com/BerriAI/litellm/pull/47150)
- 以整合測試取代即時的 MCP OAuth e2e 測試 - [PR #47154](https://github.com/BerriAI/litellm/pull/47154)
- 預設為每個自有整合代理程式提供私有資料庫與 Redis - [PR #47213](https://github.com/BerriAI/litellm/pull/47213)
- 讓 perf 讀取 API 案例與儀表板今天傳送的請求對齊 - [PR #47243](https://github.com/BerriAI/litellm/pull/47243)
- 在整合測試中依值查詢自有快取鍵並清理掃描模型 - [PR #47255](https://github.com/BerriAI/litellm/pull/47255)
- 停止指令碼上游上的 `GET /__observations` 排空其請求記錄 - [PR #47256](https://github.com/BerriAI/litellm/pull/47256)
- 在多 worker 自有代理程式上，等待每個 worker 在 `Scenario.model` 中列出新模型 - [PR #47277](https://github.com/BerriAI/litellm/pull/47277)
- 在跨模型翻譯測試中新增 Sonnet 5.5 Bedrock Converse 與 Gemini 直接列 - [PR #47328](https://github.com/BerriAI/litellm/pull/47328)
- 在整合測試中，從自有代理程式自己的資料庫讀取自有代理程式的花費與代理程式列 - [PR #47333](https://github.com/BerriAI/litellm/pull/47333)
- 從現在通過的 3 個整合測試中移除過時的 BUG 略過 - [PR #47364](https://github.com/BerriAI/litellm/pull/47364)
- 在 arize v2 整合測試中，預期串流 Responses 事件中的請求模型 - [PR #47407](https://github.com/BerriAI/litellm/pull/47407)
- 在 UI e2e 規格中，從 Save your Key 對話框自身的 `pre` 讀取虛擬金鑰 - [PR #47408](https://github.com/BerriAI/litellm/pull/47408)
- 以 Microsoft 登入檢查 SSO 登入移除，使整合測試不需要公開網際網路存取 - [PR #47409](https://github.com/BerriAI/litellm/pull/47409)
- 在託管 vLLM 線路測試中，從提供它們的代理程式讀取串流停滯花費列 - [PR #47410](https://github.com/BerriAI/litellm/pull/47410)
- 在整合測試中等待每個 worker 回報 websocket 工作階段上限，而非睡覺等待 - [PR #47412](https://github.com/BerriAI/litellm/pull/47412)
- 在資料庫升級 perf 測試中比較閘道 pod 而非 worker pid，使其停止以 Gateway workers restarted 失敗 - [PR #47425](https://github.com/BerriAI/litellm/pull/47425)
- 在一分鐘熱身後讀取 perf 記憶體基線，使輕量案例停止回報負增長 - [PR #47455](https://github.com/BerriAI/litellm/pull/47455)
- 在整合測試中，從提供它們的代理程式讀取路由器冷卻失敗列 - [PR #47457](https://github.com/BerriAI/litellm/pull/47457)
- 在 perf 案例中控管閘道額外負擔標頭、Redis 延遲與 Postgres 負載 - [PR #47472](https://github.com/BerriAI/litellm/pull/47472)
- 在 1TB SpendLogs 還原 perf 通道上，以無頭瀏覽器測量 Admin UI 旅程延遲 - [PR #47486](https://github.com/BerriAI/litellm/pull/47486)
- 從 v1.103.0 到 v1.106.0 的 124 次通道執行設定七個新的 perf 上限 - [PR #47527](https://github.com/BerriAI/litellm/pull/47527)
- 在三個搜尋整合測試中預期 Exa 搜尋封套的 `provider_metadata` - [PR #47572](https://github.com/BerriAI/litellm/pull/47572)
- 將每個 perf 上限設為通道中位數的 1.2 倍，使小型退化讓通道變紅 - [PR #47590](https://github.com/BerriAI/litellm/pull/47590)
- 以 `_metadata_deployment` 建立 Mantle count_tokens 線路測試部署 - [PR #47592](https://github.com/BerriAI/litellm/pull/47592)
- 在 Mantle count_tokens 線路測試中呼叫 `_fallback_deployment`，清除三個未定義名稱的 lint 錯誤 - [PR #47593](https://github.com/BerriAI/litellm/pull/47593)
- 從在 main 上通過的音訊轉錄輸入費率計費測試中移除 BUG 略過 - [PR #47603](https://github.com/BerriAI/litellm/pull/47603)
- 將小型 perf 案例的 `postgres_max_background_statement_per_request` 上限降到 0.9 - [PR #47616](https://github.com/BerriAI/litellm/pull/47616)
- 依每個 UI 旅程 perf 樣本記錄資料請求狀態，並以實際時鐘預算為每個旅程設上限 - [PR #47622](https://github.com/BerriAI/litellm/pull/47622)
- 讓 UI 旅程 perf 夾具能在由已發佈 migrations 映像升級的還原上執行 - [PR #47628](https://github.com/BerriAI/litellm/pull/47628)
- 為每個 perf 指標發出前幾名貢獻者明細屬性 - [PR #47632](https://github.com/BerriAI/litellm/pull/47632)
- 以其 API 回應標記 UI 旅程 perf 樣本，而非 `/ui/` 之下的 Next.js 預擷取 - [PR #47650](https://github.com/BerriAI/litellm/pull/47650)
- 記錄 Admin UI perf 旅程查詢之每個表格的列數與大小 - [PR #47683](https://github.com/BerriAI/litellm/pull/47683)
- 將資料庫升級執行的 perf 列與升級時間作為 JUnit 屬性發出 - [PR #47696](https://github.com/BerriAI/litellm/pull/47696)
- 將 `event_loop_stalls` 占用次數作為 `perf_` JUnit 屬性發出 - [PR #47706](https://github.com/BerriAI/litellm/pull/47706)
- 在 `event_loop_stalls` perf 案例中將 anyio `TaskHandle._run_coro` 列入允許清單 - [PR #47746](https://github.com/BerriAI/litellm/pull/47746)
- 在 2 rps 下新增 chat completions、Responses 與 Messages 的直接與橋接 perf 案例 - [PR #47752](https://github.com/BerriAI/litellm/pull/47752)
- 將逐位置秒數、違規位置與最長占用作為 `event_loop_stalls` 明細發出 - [PR #47757](https://github.com/BerriAI/litellm/pull/47757)
- 將 perf 負載案例逐步提高，直到 pod 跟不上，並為 `sustained_rps` 設下限 - [PR #47758](https://github.com/BerriAI/litellm/pull/47758)
- 新增整合測試，驗證團隊的萬用字元部署在其金鑰上先於全代理程式萬用字元提供服務 - [PR #48501](https://github.com/BerriAI/litellm/pull/48501)
- 移除四個釘住實作細節的不穩定 Admin UI e2e 檢查，並新增 shadcn 測試規則 - [PR #48663](https://github.com/BerriAI/litellm/pull/48663)
- 新增整合測試，取消真正的本機沙箱執行並檢查其子程序已消失 - [PR #48751](https://github.com/BerriAI/litellm/pull/48751)
- 以代理程式整合測試涵蓋 Gemini 預設輸出預算與長解碼請求 body - [PR #48758](https://github.com/BerriAI/litellm/pull/48758)
- 以真正的代理程式整合測試涵蓋 gzip 與 zstd 壓縮的請求 body - [PR #48766](https://github.com/BerriAI/litellm/pull/48766)
- 以整合測試涵蓋在第一個 chunk 後失敗的 SageMaker 串流 - [Commit 000d4f6](https://github.com/BerriAI/litellm/commit/000d4f6bb3c8d3cf0e2bb9540a61ccd77ffcd5b9)
- 以帶有壓縮項目的測試涵蓋 Responses 請求的失敗花費列 token 數量 - [PR #48774](https://github.com/BerriAI/litellm/pull/48774)
- 以整合測試涵蓋 Decisions 格式錯誤的回覆與回傳版本的定價 - [PR #48777](https://github.com/BerriAI/litellm/pull/48777)
- 以整合測試涵蓋在 Anthropic、Bedrock、Vertex AI 與 Azure AI 路由上重播的 Claude thinking 區塊 - [PR #48782](https://github.com/BerriAI/litellm/pull/48782)
- 以整合測試涵蓋 pass-through 路由與 UI 保存上的 baggage 標籤對應 - [PR #48784](https://github.com/BerriAI/litellm/pull/48784)
- 以花費列測試涵蓋沒有使用量區塊之 DeepSeek V4 串流的 token 估計 - [Commit 6ba77b7](https://github.com/BerriAI/litellm/commit/6ba77b7013666c5b16ddc369c88f926b6318f486)
- 以整合測試涵蓋 Azure、Vertex 與 Bedrock 上共用的 api_base URL 連接 - [PR #48786](https://github.com/BerriAI/litellm/pull/48786)
- 以整合測試涵蓋背景回應的逐模型預算 - [PR #48787](https://github.com/BerriAI/litellm/pull/48787)
- 以整合測試涵蓋 `s3://` 與 `gs://` ID 的檔案 ID 存取檢查 - [PR #48788](https://github.com/BerriAI/litellm/pull/48788)
- 以整合測試涵蓋 SCIM 群組刪除與並行團隊刪除 - [PR #48791](https://github.com/BerriAI/litellm/pull/48791)
- 以整合測試涵蓋混合模型群組上的批次路由與端點清單 - [PR #48792](https://github.com/BerriAI/litellm/pull/48792)
- 以整合測試涵蓋透過代理程式與 SDK 的 `silent_model` 影子流量 - [PR #48794](https://github.com/BerriAI/litellm/pull/48794)
- 以串流、拒絕與錯誤整合測試涵蓋優先順序佇列路由 - [PR #48799](https://github.com/BerriAI/litellm/pull/48799)
- 以真正的代理程式測試涵蓋記住的 HuggingFace tokenizer 下載失敗 - [PR #48800](https://github.com/BerriAI/litellm/pull/48800)
- 以對自有 gRPC 伺服器的整合測試涵蓋 Nvidia Riva 提供者 - [PR #48801](https://github.com/BerriAI/litellm/pull/48801)
- 以整合測試涵蓋 Anthropic `json_schema` 邊界案例 - [PR #48803](https://github.com/BerriAI/litellm/pull/48803)
- 以真正的代理程式整合測試涵蓋冷的 `/openapi.json` 建置 - [PR #48804](https://github.com/BerriAI/litellm/pull/48804)
- 以整合測試涵蓋後續呼叫在每次重試都失敗時的 MCP 自動執行計費 - [PR #48821](https://github.com/BerriAI/litellm/pull/48821)
- 以單元與線路測試涵蓋有根據之 Gemini 段落的每個網頁來源 - [PR #48861](https://github.com/BerriAI/litellm/pull/48861)
- 以真正的代理程式整合測試涵蓋 Cloudflare Clairic 擷取端點 - [PR #48898](https://github.com/BerriAI/litellm/pull/48898)
- 以整合測試涵蓋串流 Responses MCP 自動執行計費 - [PR #48902](https://github.com/BerriAI/litellm/pull/48902)
- 以整合測試涵蓋跨路由的 `reasoning_effort_levels` 四捨五入 - [PR #48910](https://github.com/BerriAI/litellm/pull/48910)
- 新增全域代理程式花費計數器與金鑰預算強制的整合測試 - [PR #48918](https://github.com/BerriAI/litellm/pull/48918)
- 新增背景回應計費傳送到建立者 Langfuse 專案的整合單元 - [PR #48919](https://github.com/BerriAI/litellm/pull/48919)
- 在 SDK 冷卻整合案例中，於 Router 初始化後設定字串備援目標 - [PR #48954](https://github.com/BerriAI/litellm/pull/48954)
- 在整合測試中，將 signoz、otel 對話 ID 與 series cap 代理程式夾具限定在其模組 - [Commit 42d2909](https://github.com/BerriAI/litellm/commit/42d29092105f3f1b618a2375e15743a703b3d077)
- 更新 149 個被近期產品變更弄過時的整合測試 - [PR #49143](https://github.com/BerriAI/litellm/pull/49143)
- 以整合測試涵蓋 `/v1/messages` 上的 Bedrock Claude 提示快取 - [PR #49265](https://github.com/BerriAI/litellm/pull/49265)
- 修復因測試順序、競態與刻意變更的行為而失敗的整合測試 - [PR #49310](https://github.com/BerriAI/litellm/pull/49310)
- 為分類器預算欄位更新 Databricks auto-router 整合測試 - [PR #49382](https://github.com/BerriAI/litellm/pull/49382)
- 在 MCP 整合測試 peer 中取消中斷連線的 HTTP 工具處理常式 - [PR #49436](https://github.com/BerriAI/litellm/pull/49436)
- 在路由器並行整合測試中，於擁有它的檔案中追蹤部署索引鎖 - [PR #49520](https://github.com/BerriAI/litellm/pull/49520)
- 在翻譯整合測試中，當 Anthropic `json_schema` 串流被切斷時預期 EOF 錯誤 frame - [PR #49521](https://github.com/BerriAI/litellm/pull/49521)
- 將 Sail、Weave 與 Presidio e2e 測試移到整合測試 - [PR #49533](https://github.com/BerriAI/litellm/pull/49533)
- 從 e2e 階段鏡像設定中刪除未使用的 `arize_phoenix` 回呼 - [PR #49538](https://github.com/BerriAI/litellm/pull/49538)
- 以對指令碼代理程式的整合測試取代第三方代理程式 A2A e2e 測試 - [PR #49541](https://github.com/BerriAI/litellm/pull/49541)
- 給予每個 kill-burst 自己的提示，使快取的控制回覆無法替代延遲的流量 - [PR #50569](https://github.com/BerriAI/litellm/pull/50569)
- 將 Together reasoning 重播 e2e 測試重新釘到 `MiniMax-M3.1-Flash` - [PR #50601](https://github.com/BerriAI/litellm/pull/50601)
- 從 Gemini 長解碼測試中刪除空字串 `n` 案例 - [PR #50795](https://github.com/BerriAI/litellm/pull/50795)
- 在層級 pin 批次測試之前清空共用用戶端快取 - [PR #50849](https://github.com/BerriAI/litellm/pull/50849)
- 在混合能力 MCP 訂閱測試中為 OAuth metadata 查詢設上限 - [PR #50849](https://github.com/BerriAI/litellm/pull/50849)

</details>

<details>
<summary>Rust 核心（35）</summary>

- 新增對等測試，執行原生與 Python Responses 呼叫並比較 - [PR #46567](https://github.com/BerriAI/litellm/pull/46567)
- 為原生 Responses 使用的 LiteLLM 回應 ID 新增 Rust 編解碼器 - [PR #46572](https://github.com/BerriAI/litellm/pull/46572)
- 在 Rust 橋接型錄中偵測僅 Python 的功能，而非臨時在 Rust 中拒絕 - [PR #46714](https://github.com/BerriAI/litellm/pull/46714)
- 在 Rust 橋接型錄中決定原生路由，並刪除舊的路由述詞 - [PR #46750](https://github.com/BerriAI/litellm/pull/46750)
- 將分發測試移入 Rust 測試套件，並更新 Rust 工作流程路徑篩選 - [PR #46926](https://github.com/BerriAI/litellm/pull/46926)
- 將 `inference-transcription` 準備階段併入其處理常式 - [PR #47214](https://github.com/BerriAI/litellm/pull/47214)
- 將 `inference-responses` 準備階段併入其處理常式 - [PR #47215](https://github.com/BerriAI/litellm/pull/47215)
- 將 `inference-ocr` 準備階段併入其處理常式 - [PR #47216](https://github.com/BerriAI/litellm/pull/47216)
- 將 `inference-messages` 準備階段併入其處理常式 - [PR #47217](https://github.com/BerriAI/litellm/pull/47217)
- 將 `inference-chat` 準備階段併入其處理常式 - [PR #47218](https://github.com/BerriAI/litellm/pull/47218)
- 將 Rust inference crate 的 `RouteError` 重新命名為 `Error` - [PR #47771](https://github.com/BerriAI/litellm/pull/47771)
- 將一個具型別的拒絕從 Rust 核心傳遞到每個宿主，使被拒絕的 SDK 呼叫備援到 Python - [PR #47772](https://github.com/BerriAI/litellm/pull/47772)
- 為 Rust WebSocket 連線遵循 SSL 驗證、CA 套件、用戶端憑證與代理 - [PR #47968](https://github.com/BerriAI/litellm/pull/47968)
- 將 Rust reqwest 升級到 0.13，並從共用的對外 pool 為 MCP 提供用戶端 - [PR #48039](https://github.com/BerriAI/litellm/pull/48039)
- 將 Rust 對外請求建立為普通的 `reqwest::Request` - [PR #48041](https://github.com/BerriAI/litellm/pull/48041)
- 在 litellm-rust 全面採用一套錯誤紀律，帶有來源鏈與共用的 `Report` - [PR #48042](https://github.com/BerriAI/litellm/pull/48042)
- 為 Rust db crate 新增具型別的 `find_end_user` 資料庫查詢基礎 - [PR #48214](https://github.com/BerriAI/litellm/pull/48214)
- 為 Rust db crate 新增具型別的金鑰花費更新查詢 - [PR #48217](https://github.com/BerriAI/litellm/pull/48217)
- 為 Rust db crate 新增具型別的使用者花費更新查詢 - [PR #48229](https://github.com/BerriAI/litellm/pull/48229)
- 為 Rust db crate 新增具型別的團隊花費更新查詢 - [PR #48230](https://github.com/BerriAI/litellm/pull/48230)
- 為 Rust db crate 新增具型別的終端使用者花費 upsert 查詢 - [PR #48231](https://github.com/BerriAI/litellm/pull/48231)
- 為 Rust db crate 新增交易範圍的團隊鎖查詢 - [PR #48232](https://github.com/BerriAI/litellm/pull/48232)
- 為 Rust db crate 新增具型別的團隊成員花費 upsert 查詢 - [PR #48233](https://github.com/BerriAI/litellm/pull/48233)
- 為 Rust db crate 新增具型別的花費記錄插入查詢 - [PR #48234](https://github.com/BerriAI/litellm/pull/48234)
- 為 Rust db crate 新增具型別的每日使用者花費 upsert 查詢 - [PR #48235](https://github.com/BerriAI/litellm/pull/48235)
- 為 Rust db crate 新增具型別的每日團隊花費 upsert 查詢 - [PR #48236](https://github.com/BerriAI/litellm/pull/48236)
- 為 Rust db crate 新增具型別的每日終端使用者花費 upsert 查詢 - [PR #48237](https://github.com/BerriAI/litellm/pull/48237)
- 將獨立的 Redis 用戶端與 Redis 測試夾具 crate 加入 Rust 工作區 - [PR #48269](https://github.com/BerriAI/litellm/pull/48269)
- 在 Rust Redis 用戶端中支援 Redis Cluster - [PR #48271](https://github.com/BerriAI/litellm/pull/48271)
- 在 Rust Redis 用戶端中以逐操作錯誤執行 Lua 指令碼與 pipeline - [PR #48273](https://github.com/BerriAI/litellm/pull/48273)
- 新增斷路器 crate，並以它保護 Rust Redis 用戶端 - [PR #48277](https://github.com/BerriAI/litellm/pull/48277)
- 從 config.yaml 與環境設定建立 Rust 閘道 Redis 用戶端 - [PR #48284](https://github.com/BerriAI/litellm/pull/48284)
- 新增 Rust 模型型錄，剖析、降低並驗證成本對應表為具型別的價格 - [PR #48853](https://github.com/BerriAI/litellm/pull/48853)
- 將成本對應表隨原生擴充功能一起提供 - [PR #48907](https://github.com/BerriAI/litellm/pull/48907)
- 將 `SecretValue` 抽出為自己的 crate，並以它包裝 Redis 憑證 - [PR #49186](https://github.com/BerriAI/litellm/pull/49186)

</details>

<details>
<summary>CI 與發佈工具（26）</summary>

- 將 Rust 擴充功能建置快取在其自己的 Docker 階段中，使僅 Python 的變更略過重新編譯 - [PR #47033](https://github.com/BerriAI/litellm/pull/47033)
- 刪除模型價格 JSON schema 檔案及其成本對應表防護允許 - [PR #47079](https://github.com/BerriAI/litellm/pull/47079)
- 將 litellm-enterprise 升級到 0.1.78、litellm-proxy-extras 升級到 0.4.110 - [PR #47228](https://github.com/BerriAI/litellm/pull/47228)
- 讓 MCP SDK1 peer 保持在 mcp 1.x，並在 CI 中為大小清理測試表格關閉 autovacuum - [PR #47651](https://github.com/BerriAI/litellm/pull/47651)
- 將 litellm 升級到 1.108.0、litellm-enterprise 升級到 0.1.79、litellm-proxy-extras 升級到 0.4.111 - [PR #47668](https://github.com/BerriAI/litellm/pull/47668)
- 升級 langgraph 與 tornado，並新增帶日期的掃描忽略以清除 osv-scan 與 image-scan - [PR #48302](https://github.com/BerriAI/litellm/pull/48302)
- 從 uv 設定中移除過期的 boto3、botocore 與 grpcio 發佈截止 - [PR #48447](https://github.com/BerriAI/litellm/pull/48447)
- 從 uv 設定中刪除過期的 certifi、mlflow 與 pypdf 發佈截止 - [PR #48461](https://github.com/BerriAI/litellm/pull/48461)
- 移除 Together AI 與每週成本對應表同步工作流程及其指令碼與測試 - [PR #48473](https://github.com/BerriAI/litellm/pull/48473)
- 新增 Spend logs 防護 CI 檢查，在 `LiteLLM_SpendLogs` schema 與 migration 變更時需要擁有者核准 - [PR #48518](https://github.com/BerriAI/litellm/pull/48518)
- 在 main 上將 `litellm` 升級到 1.109.0、`litellm-enterprise` 升級到 0.1.80 - [PR #48673](https://github.com/BerriAI/litellm/pull/48673)
- 在不安裝 litellm 專案的情況下執行花費記錄與成本對應表防護檢查，將每個從數分鐘縮短到數秒 - [PR #48683](https://github.com/BerriAI/litellm/pull/48683)
- 從目前的 main 為 1.109.0 重新建置已提交的 Admin UI bundle - [PR #48692](https://github.com/BerriAI/litellm/pull/48692)
- 讓花費記錄防護核准在後續的 COMMENTED 審查後保持 - [PR #48901](https://github.com/BerriAI/litellm/pull/48901)
- 要求花費記錄防護核准涵蓋 head 的花費記錄行 - [PR #48904](https://github.com/BerriAI/litellm/pull/48904)
- 在花費記錄防護中標記模型 LiteLLM_SpendLogs 內的任何 schema.prisma 變更 - [PR #48905](https://github.com/BerriAI/litellm/pull/48905)
- 在 CI 中透過 Rust 模型型錄載入來檢查成本對應表 - [PR #48908](https://github.com/BerriAI/litellm/pull/48908)
- 只在 pull_request_target 事件上執行花費記錄防護，並在核准後手動重新執行 - [PR #48941](https://github.com/BerriAI/litellm/pull/48941)
- 以 `--no-ignores` 執行 zizmor，並將花費記錄與成本對應表防護移到 pull_request 觸發 - [PR #48947](https://github.com/BerriAI/litellm/pull/48947)
- 在每個可能改變 OpenAPI 規格的變更上，執行儀表板 API 型別與 Terraform 端點檢查 - [PR #49022](https://github.com/BerriAI/litellm/pull/49022)
- 從目標分支的目前 tip（而非過時的 `base.sha`）測量 lint、單元測試與防護 PR 檢查 - [PR #49078](https://github.com/BerriAI/litellm/pull/49078)
- 在 CI 中以 sccache 快取 Rust 編譯 - [PR #49117](https://github.com/BerriAI/litellm/pull/49117)
- 在 OpenAPI 文件閘門匯入其代理程式之前，先建置基礎 checkout 的原生擴充功能 - [PR #49136](https://github.com/BerriAI/litellm/pull/49136)
- 將 litellm-enterprise 升級到 0.1.81、litellm-proxy-extras 升級到 0.4.112 - [PR #49149](https://github.com/BerriAI/litellm/pull/49149)
- 在 CircleCI 工作中透過 HTTPS 複製公開 repo，使 main 工作停止在 checkout 時失敗 - [PR #49394](https://github.com/BerriAI/litellm/pull/49394)
- 在週一凌晨 3 點 PT（而非週五）切出每週 rc 分支 - [PR #49472](https://github.com/BerriAI/litellm/pull/49472)

</details>

<details>
<summary>重構與型別（25）</summary>

- 在 6 個檔案中以已證明的型別取代 `Any` - [PR #47268](https://github.com/BerriAI/litellm/pull/47268)
- 在 15 個檔案中以已證明的型別取代 `Any`，並以嚴格的 pydantic 適配器驗證無型別的 JSON - [PR #47509](https://github.com/BerriAI/litellm/pull/47509)
- 清除 431 個檔案中 1181 個 basedpyright `Any` 錯誤 - [PR #47789](https://github.com/BerriAI/litellm/pull/47789)
- 在 50 個檔案中以已證明的型別取代 `Any` - [PR #47818](https://github.com/BerriAI/litellm/pull/47818)
- 將 `delete_nested_value` 擴大為 `Mapping`，並刪除兩個未使用的 `Span` 別名 - [PR #48001](https://github.com/BerriAI/litellm/pull/48001)
- 為代理程式提供一個生命週期擁有者，負責資料庫連線與背景工作，在啟動失敗與關閉時關閉 - [PR #48506](https://github.com/BerriAI/litellm/pull/48506)
- 透過逐儲存庫相依性植入資料庫儲存庫，從橫幅路由開始 - [PR #48507](https://github.com/BerriAI/litellm/pull/48507)
- 將模型版本轉換檔案重新命名為家族名稱，不改變類別或函式名稱 - [PR #48509](https://github.com/BerriAI/litellm/pull/48509)
- 將 `llms/anthropic/pass_through` 重新命名為 `llms/anthropic/messages`，並為舊路徑保留匯入墊片 - [PR #48510](https://github.com/BerriAI/litellm/pull/48510)
- 將 MCP 伺服器與用戶端移出實驗路徑，並為舊匯入保留已淘汰的墊片 - [PR #48513](https://github.com/BerriAI/litellm/pull/48513)
- 透過其自己的儲存庫相依性植入部署警告延後儲存 - [PR #48592](https://github.com/BerriAI/litellm/pull/48592)
- 從 migration 前列檢查的補救措施中，刪除花費記錄 `api_key` 特殊案例 - [PR #48636](https://github.com/BerriAI/litellm/pull/48636)
- 圍起 `Router` 表面並記錄 router-core 邊界 - [PR #48839](https://github.com/BerriAI/litellm/pull/48839)
- 新增路由器進入點，並將舊成員保留為已淘汰的 mixin - [PR #48840](https://github.com/BerriAI/litellm/pull/48840)
- 將路由器呼叫者移到進入點上，並反轉代理程式匯入 - [PR #48847](https://github.com/BerriAI/litellm/pull/48847)
- 在 28 個檔案中以已證明的型別取代 `Any` - [Commit f89b9c6](https://github.com/BerriAI/litellm/commit/f89b9c61504801fcc99e40e37af532bb38bbfa30)
- 在 21 個檔案中以已證明的型別取代 `Any` - [PR #48921](https://github.com/BerriAI/litellm/pull/48921)
- 在快取、代理程式路由、整合與型別的 14 個檔案中以已證明的型別取代 `Any` - [PR #48928](https://github.com/BerriAI/litellm/pull/48928)
- 透過具型別的儲存庫植入閘道活動，而非全域 Prisma 用戶端 - [PR #49116](https://github.com/BerriAI/litellm/pull/49116)
- 透過 `RoutingContext` 路由路由器家族，並關閉路由器之外使用的表面 - [PR #49118](https://github.com/BerriAI/litellm/pull/49118)
- 在 `RouterCore` 之後抽出 `PythonCore`，並將設定傳遞給路由器 - [PR #49119](https://github.com/BerriAI/litellm/pull/49119)
- 為 Admin UI 新增 i18next 管線，並將 Workflows 頁面移到其上，沒有可見變更 - [PR #49144](https://github.com/BerriAI/litellm/pull/49144)
- 將 Policies、Tool Policies 與 Guardrails Monitor 頁面文字移到 i18n 訊息上，畫面沒有變更 - [PR #49343](https://github.com/BerriAI/litellm/pull/49343)
- 還原 RoutingContext 重構為直接呼叫者變更的四個路由器輔助行為 - [PR #49395](https://github.com/BerriAI/litellm/pull/49395)
- 從 Admin UI 的 `networking.tsx` 中移除 17 個未使用的 API 呼叫 - [PR #49507](https://github.com/BerriAI/litellm/pull/49507)

</details>

<details>
<summary>單元測試（17）</summary>

- 以早期關閉與單一失敗記錄的測試，涵蓋卡在一個重複 chunk 上的串流 - [PR #38753](https://github.com/BerriAI/litellm/pull/38753)
- 在串流 JSON 排空測試中以峰值配置設界，而非時間比例 - [PR #43370](https://github.com/BerriAI/litellm/pull/43370)
- 讓外部 asyncio 工作噪音不進入預算限制器記錄擷取測試 - [PR #43375](https://github.com/BerriAI/litellm/pull/43375)
- 釘住 `api_version` 永遠不會在微調呼叫上到達 OpenAI 用戶端 - [PR #44995](https://github.com/BerriAI/litellm/pull/44995)
- 讓單元測試中的 unix socket 路徑保持在 macOS AF_UNIX 限制之下 - [PR #45040](https://github.com/BerriAI/litellm/pull/45040)
- 以 `Final` 標註 Baseten 單元測試的區域變數 - [PR #47205](https://github.com/BerriAI/litellm/pull/47205)
- 新增單元案例，在先前變更加入的驗證檢查被削弱時失敗 - [PR #47420](https://github.com/BerriAI/litellm/pull/47420)
- 停止圖片編輯單元測試將回應圖片寫入磁碟 - [PR #47463](https://github.com/BerriAI/litellm/pull/47463)
- 在執行階段註冊單元測試中隔離模型成本對應表，並在每個測試後還原 - [PR #47559](https://github.com/BerriAI/litellm/pull/47559)
- 在跨模型翻譯測試中新增 Sonnet 5.5 Anthropic 直接列 - [PR #47566](https://github.com/BerriAI/litellm/pull/47566)
- 從 Bedrock Vault 查詢迴歸測試中移除兩秒的時間相依性 - [PR #47597](https://github.com/BerriAI/litellm/pull/47597)
- 釘住串流 `/v1/messages` MCP 自動執行後的 `max_parallel_requests` 槽位釋放 - [PR #47788](https://github.com/BerriAI/litellm/pull/47788)
- 從隨附的快照讀取 Interactions 規格，並每天對即時版本進行金絲雀測試 - [PR #48002](https://github.com/BerriAI/litellm/pull/48002)
- 讓自訂 tokenizer 卸載測試檢查載入器執行緒，而非依賴時間 - [PR #48458](https://github.com/BerriAI/litellm/pull/48458)
- 透過以 `console_default=True` 建立提供者，修復六個 OTel Langfuse 目的地測試 - [PR #49129](https://github.com/BerriAI/litellm/pull/49129)
- 為 JSON 累加器排空測試與已武裝的路由預擷取測試去抖動 - [PR #49505](https://github.com/BerriAI/litellm/pull/49505)
- 在 Vertex AI 提示快取範圍測試中讀取隨附的 beta 標頭設定 - [PR #50849](https://github.com/BerriAI/litellm/pull/50849)

</details>

<details>
<summary>貢獻者工具（14）</summary>

- 為 Python SDK 與代理程式新增 ADR，並在 `CONTRIBUTING.md` 中新增提供者區段 - [PR #36668](https://github.com/BerriAI/litellm/pull/36668)
- 刪除 Conventional Branches pre-push hook，改用 `litellm_` 分支前綴 - [PR #44951](https://github.com/BerriAI/litellm/pull/44951)
- 將目錄規則保留在巢狀 `AGENTS.md` 中，並說明 CircleCI 擁有 `tests/integration` - [PR #46796](https://github.com/BerriAI/litellm/pull/46796)
- 在 `.github/CODEOWNERS` 中為 `helm/` 與 `terraform/` 新增程式碼擁有者 - [PR #47452](https://github.com/BerriAI/litellm/pull/47452)
- 以簡短的普通描述引導 PR 範本，並收合其他區段 - [PR #47594](https://github.com/BerriAI/litellm/pull/47594)
- 說明單元測試時鐘規則，允許附帶的生產時鐘讀取 - [PR #47604](https://github.com/BerriAI/litellm/pull/47604)
- 從 PR 範本中移除 Description 標題 - [PR #47631](https://github.com/BerriAI/litellm/pull/47631)
- 為模型成本對應表檔案新增程式碼擁有者 - [PR #48101](https://github.com/BerriAI/litellm/pull/48101)
- 在嚴格的 ruff 閘門中新增 Google 慣例 docstring 規則 - [PR #48245](https://github.com/BerriAI/litellm/pull/48245)
- 在儲存庫代理程式技能中記錄增量資料庫存取 migration - [PR #48476](https://github.com/BerriAI/litellm/pull/48476)
- 在 PR 範本與 AGENTS.md 中，允許機械性 PR 以專注的證明取代即時 e2e 測試 - [PR #49031](https://github.com/BerriAI/litellm/pull/49031)
- 在 Rust 模型型錄文件中說明 meter、band、channel 與 When - [PR #49447](https://github.com/BerriAI/litellm/pull/49447)
- 在 PR 範本中新增手寫的 1 到 3 句描述區段 - [PR #49475](https://github.com/BerriAI/litellm/pull/49475)
- 在 PR 範本中，將代理程式起草的 PR 摘要佔位文字包裝在 `<make-me-human-readable>` 標籤中 - [PR #49494](https://github.com/BerriAI/litellm/pull/49494)

</details>

<details>
<summary>其他內部（11）</summary>

- 改寫過時的 `completion_cost` docstring，並修復其未對應模型錯誤中的拼字錯誤 - [PR #47022](https://github.com/BerriAI/litellm/pull/47022)
- 新增花費記錄儲存探測與可回收位元組計數（後來的以大小為基礎的清理以此為基礎），尚無呼叫者 - [PR #47449](https://github.com/BerriAI/litellm/pull/47449)
- 將小寫的政策檔案重新命名為 OSS 工具尋找的慣例大寫名稱，並使用專案聯絡地址 - [PR #47581](https://github.com/BerriAI/litellm/pull/47581)
- 在 `vscode-extension` 中將 `vite` 從 8.3.0 升級到 8.3.4，該套件只有測試執行器使用 - [PR #47627](https://github.com/BerriAI/litellm/pull/47627)
- 在 Chat 檢視切換器中辨識開發預覽工作區 - [Commit f6b2086](https://github.com/BerriAI/litellm/commit/f6b20865020026612e05fb51ba8e993fc91d9486)
- 新增會計合約、定價快照與兩個分類帳表格，代理程式尚未使用 - [PR #48862](https://github.com/BerriAI/litellm/pull/48862)
- 新增持久會計事件分類帳寫入器，隨其待處理傳遞一起提交事件 - [PR #48883](https://github.com/BerriAI/litellm/pull/48883)
- 在 OpenAI Responses 壓縮路徑上呼叫重新命名的 `drops_params` 輔助函式 - [PR #49030](https://github.com/BerriAI/litellm/pull/49030)
- 為持久使用量擷取新增有界的交易持久性 - [PR #49190](https://github.com/BerriAI/litellm/pull/49190)
- 讓 WebSocket pass-through 中繼透過可選的計量器，為來自用戶端文字的工作階段計費 - [PR #49281](https://github.com/BerriAI/litellm/pull/49281)
- 移除 `DEFAULT_A2A_AGENT_TIMEOUT` 上錯誤的 10 分鐘註解 - [PR #49465](https://github.com/BerriAI/litellm/pull/49465)

</details>

<details>
<summary>成本計算測試（8）</summary>

- 在成本計算測試中涵蓋未定價的提供者 slug 與明確的零費率 - [PR #42467](https://github.com/BerriAI/litellm/pull/42467)
- 為 gpt-5.6-terra、gemini-4-argon 與 gemini-3.1-pro-preview 新增第 1 層成本追蹤案例 - [PR #46931](https://github.com/BerriAI/litellm/pull/46931)
- 在成本測試套件中，以 reasoning 價格計費 vertex gemini-3.8-flash reasoning token - [PR #46939](https://github.com/BerriAI/litellm/pull/46939)
- 重新鍵入 Vertex Gemini 成本案例，新增 Bedrock Mantle GPT 與 Claude Opus 5.5 案例，並刪除僅套件的價格欄位 - [PR #46962](https://github.com/BerriAI/litellm/pull/46962)
- 新增第 1 層成本追蹤案例，並將儲存的使用量形狀與即時回覆同步 - [PR #47141](https://github.com/BerriAI/litellm/pull/47141)
- 在成本測試中新增 Vertex Claude Haiku 5.5 長上下文案例，以及 GPT 與 Gemini 3.8 Flash 橋接段 - [PR #47342](https://github.com/BerriAI/litellm/pull/47342)
- 執行 azure_ai Claude 橋接成本配對，並新增 Anthropic 使用量速度與 Vertex Gemini 音訊優先價格案例 - [PR #47582](https://github.com/BerriAI/litellm/pull/47582)
- 在成本整合案例中，預期 Cohere rerank-v4 的 `prompt_tokens` 來自 `billed_units.total_tokens` - [PR #49455](https://github.com/BerriAI/litellm/pull/49455)

</details>

<details>
<summary>在此版本內被取代（2）</summary>

- 在請求 body 中讓 64 位元範圍之外的 JSON 整數保持精確，包含使用金鑰或團隊模型別名的請求，而非將其四捨五入為浮點數 - [PR #48213](https://github.com/BerriAI/litellm/pull/48213)
- 還原大型整數請求剖析，使大型 JSON 整數可能再次被四捨五入 - [PR #48289](https://github.com/BerriAI/litellm/pull/48289)

</details>

### 依所屬領域的 PR 彙總 {#pr-roll-up-by-ownership-area}

面向客戶的變更：**700**。測試、CI 與內部變更：**237**。總計：**937**

- 其他（測試、CI、內部）：237
- 模型與提供者：185
- LLM API 端點：162
- 花費 / 預算 / 速率限制：82
- 效能：76
- UI：62
- 驗證與管理：52
- 記錄與追蹤：32
- MCP：23
- 防護欄：19
- 文件：5
- 祕密管理工具：2

## 新貢獻者 {#new-contributors}

- [@16niraj](https://github.com/16niraj) 在 [PR #48662](https://github.com/BerriAI/litellm/pull/48662) 完成首次貢獻
- [@abhishekacharya200](https://github.com/abhishekacharya200) 在 [PR #45992](https://github.com/BerriAI/litellm/pull/45992) 完成首次貢獻
- [@aidanasingh](https://github.com/aidanasingh) 在 [PR #32309](https://github.com/BerriAI/litellm/pull/32309) 完成首次貢獻
- [@AJ-ing](https://github.com/AJ-ing) 在 [PR #41034](https://github.com/BerriAI/litellm/pull/41034) 完成首次貢獻
- [@albertoperdomo2](https://github.com/albertoperdomo2) 在 [PR #46662](https://github.com/BerriAI/litellm/pull/46662) 完成首次貢獻
- [@algirdasci](https://github.com/algirdasci) 在 [PR #44863](https://github.com/BerriAI/litellm/pull/44863) 完成首次貢獻
- [@AlonSoko](https://github.com/AlonSoko) 在 [PR #47123](https://github.com/BerriAI/litellm/pull/47123) 完成首次貢獻
- [@alvcol](https://github.com/alvcol) 在 [PR #46861](https://github.com/BerriAI/litellm/pull/46861) 完成首次貢獻
- [@amaan-ai20](https://github.com/amaan-ai20) 在 [PR #43874](https://github.com/BerriAI/litellm/pull/43874) 完成首次貢獻
- [@axelray-dev](https://github.com/axelray-dev) 在 [PR #44471](https://github.com/BerriAI/litellm/pull/44471) 完成首次貢獻
- [@bap1106](https://github.com/bap1106) 在 [PR #39324](https://github.com/BerriAI/litellm/pull/39324) 完成首次貢獻
- [@businessarshgoyal](https://github.com/businessarshgoyal) 在 [PR #38753](https://github.com/BerriAI/litellm/pull/38753) 完成首次貢獻
- [@david-koh](https://github.com/david-koh) 在 [PR #41565](https://github.com/BerriAI/litellm/pull/41565) 完成首次貢獻
- [@deepanshupal](https://github.com/deepanshupal) 在 [PR #44199](https://github.com/BerriAI/litellm/pull/44199) 完成首次貢獻
- [@devanshc777](https://github.com/devanshc777) 在 [PR #47897](https://github.com/BerriAI/litellm/pull/47897) 完成首次貢獻
- [@DewellNaa](https://github.com/DewellNaa) 在 [PR #48335](https://github.com/BerriAI/litellm/pull/48335) 完成首次貢獻
- [@discobot](https://github.com/discobot) 在 [PR #30277](https://github.com/BerriAI/litellm/pull/30277) 完成首次貢獻
- [@dkrisman](https://github.com/dkrisman) 在 [PR #40967](https://github.com/BerriAI/litellm/pull/40967) 完成首次貢獻
- [@eduardopessin](https://github.com/eduardopessin) 在 [PR #42467](https://github.com/BerriAI/litellm/pull/42467) 完成首次貢獻
- [@edujuan](https://github.com/edujuan) 在 [PR #46875](https://github.com/BerriAI/litellm/pull/46875) 完成首次貢獻
- [@ekpog200](https://github.com/ekpog200) 在 [PR #44614](https://github.com/BerriAI/litellm/pull/44614) 完成首次貢獻
- [@fabioAntGit](https://github.com/fabioAntGit) 在 [PR #45467](https://github.com/BerriAI/litellm/pull/45467) 完成首次貢獻
- [@Gopal3746](https://github.com/Gopal3746) 在 [PR #45715](https://github.com/BerriAI/litellm/pull/45715) 完成首次貢獻
- [@hamzashah-dev](https://github.com/hamzashah-dev) 在 [PR #35643](https://github.com/BerriAI/litellm/pull/35643) 完成首次貢獻
- [@HardMax71](https://github.com/HardMax71) 在 [PR #44185](https://github.com/BerriAI/litellm/pull/44185) 完成首次貢獻
- [@Hazelhof](https://github.com/Hazelhof) 在 [PR #38736](https://github.com/BerriAI/litellm/pull/38736) 完成首次貢獻
- [@hgnnmnn](https://github.com/hgnnmnn) 在 [PR #48199](https://github.com/BerriAI/litellm/pull/48199) 完成首次貢獻
- [@igorborgest](https://github.com/igorborgest) 在 [PR #47848](https://github.com/BerriAI/litellm/pull/47848) 完成首次貢獻
- [@irvallensar](https://github.com/irvallensar) 在 [PR #44021](https://github.com/BerriAI/litellm/pull/44021) 完成首次貢獻
- [@ishaan-j-berri](https://github.com/ishaan-j-berri) 在 [PR #48137](https://github.com/BerriAI/litellm/pull/48137) 完成首次貢獻
- [@islomjon-aiand](https://github.com/islomjon-aiand) 在 [PR #38958](https://github.com/BerriAI/litellm/pull/38958) 完成首次貢獻
- [@jeevan1098](https://github.com/jeevan1098) 在 [PR #48213](https://github.com/BerriAI/litellm/pull/48213) 完成首次貢獻
- [@jesus-berri](https://github.com/jesus-berri) 在 [PR #43425](https://github.com/BerriAI/litellm/pull/43425) 完成首次貢獻
- [@jhoblitt](https://github.com/jhoblitt) 在 [PR #48060](https://github.com/BerriAI/litellm/pull/48060) 完成首次貢獻
- [@jodok](https://github.com/jodok) 在 [PR #48448](https://github.com/BerriAI/litellm/pull/48448) 完成首次貢獻
- [@jorik](https://github.com/jorik) 在 [PR #46421](https://github.com/BerriAI/litellm/pull/46421) 完成首次貢獻
- [@joshdabosh](https://github.com/joshdabosh) 在 [PR #45092](https://github.com/BerriAI/litellm/pull/45092) 完成首次貢獻
- [@justinfx](https://github.com/justinfx) 在 [PR #44763](https://github.com/BerriAI/litellm/pull/44763) 完成首次貢獻
- [@lets-order-some-fries](https://github.com/lets-order-some-fries) 在 [PR #36678](https://github.com/BerriAI/litellm/pull/36678) 完成首次貢獻
- [@limdeng](https://github.com/limdeng) 在 [PR #45567](https://github.com/BerriAI/litellm/pull/45567) 完成首次貢獻
- [@MaximeBOUDIER](https://github.com/MaximeBOUDIER) 在 [PR #46902](https://github.com/BerriAI/litellm/pull/46902) 完成首次貢獻
- [@mdevhurt1](https://github.com/mdevhurt1) 在 [PR #39762](https://github.com/BerriAI/litellm/pull/39762) 完成首次貢獻
- [@MFJG-dev](https://github.com/MFJG-dev) 在 [PR #45961](https://github.com/BerriAI/litellm/pull/45961) 完成首次貢獻
- [@mika-lt](https://github.com/mika-lt) 在 [PR #48799](https://github.com/BerriAI/litellm/pull/48799) 完成首次貢獻
- [@Mrun25](https://github.com/Mrun25) 在 [PR #46390](https://github.com/BerriAI/litellm/pull/46390) 完成首次貢獻
- [@ninglinLiu](https://github.com/ninglinLiu) 在 [PR #46171](https://github.com/BerriAI/litellm/pull/46171) 完成首次貢獻
- [@norkelbyte](https://github.com/norkelbyte) 在 [PR #48737](https://github.com/BerriAI/litellm/pull/48737) 完成首次貢獻
- [@occ](https://github.com/occ) 在 [PR #42014](https://github.com/BerriAI/litellm/pull/42014) 完成首次貢獻
- [@ondraz](https://github.com/ondraz) 在 [PR #46857](https://github.com/BerriAI/litellm/pull/46857) 完成首次貢獻
- [@otiscuilei](https://github.com/otiscuilei) 在 [PR #32537](https://github.com/BerriAI/litellm/pull/32537) 完成首次貢獻
- [@paveln83](https://github.com/paveln83) 在 [PR #48803](https://github.com/BerriAI/litellm/pull/48803) 完成首次貢獻
- [@pcbeingused333](https://github.com/pcbeingused333) 在 [PR #44795](https://github.com/BerriAI/litellm/pull/44795) 完成首次貢獻
- [@pfolex](https://github.com/pfolex) 在 [PR #48158](https://github.com/BerriAI/litellm/pull/48158) 完成首次貢獻
- [@prassu017](https://github.com/prassu017) 在 [PR #48417](https://github.com/BerriAI/litellm/pull/48417) 完成首次貢獻
- [@Pyhroff](https://github.com/Pyhroff) 在 [PR #47091](https://github.com/BerriAI/litellm/pull/47091) 完成首次貢獻
- [@quietjules](https://github.com/quietjules) 在 [PR #48801](https://github.com/BerriAI/litellm/pull/48801) 完成首次貢獻
- [@roywei](https://github.com/roywei) 在 [PR #44349](https://github.com/BerriAI/litellm/pull/44349) 完成首次貢獻
- [@selimfedakar](https://github.com/selimfedakar) 在 [PR #48845](https://github.com/BerriAI/litellm/pull/48845) 完成首次貢獻
- [@setouchi-h](https://github.com/setouchi-h) 在 [PR #45795](https://github.com/BerriAI/litellm/pull/45795) 完成首次貢獻
- [@sidhunt](https://github.com/sidhunt) 在 [PR #43290](https://github.com/BerriAI/litellm/pull/43290) 完成首次貢獻
- [@SilverMarcs](https://github.com/SilverMarcs) 在 [PR #48745](https://github.com/BerriAI/litellm/pull/48745) 完成首次貢獻
- [@simonp9](https://github.com/simonp9) 在 [PR #48800](https://github.com/BerriAI/litellm/pull/48800) 完成首次貢獻
- [@tavren27](https://github.com/tavren27) 在 [PR #48725](https://github.com/BerriAI/litellm/pull/48725) 完成首次貢獻
- [@tbartik](https://github.com/tbartik) 在 [PR #34822](https://github.com/BerriAI/litellm/pull/34822) 完成首次貢獻
- [@TemoSulava](https://github.com/TemoSulava) 在 [PR #47263](https://github.com/BerriAI/litellm/pull/47263) 完成首次貢獻
- [@tessellark](https://github.com/tessellark) 在 [PR #48735](https://github.com/BerriAI/litellm/pull/48735) 完成首次貢獻
- [@ucfjoe](https://github.com/ucfjoe) 在 [PR #40152](https://github.com/BerriAI/litellm/pull/40152) 完成首次貢獻
- [@vanrajsinh650](https://github.com/vanrajsinh650) 在 [PR #46190](https://github.com/BerriAI/litellm/pull/46190) 完成首次貢獻
- [@vanshsingh3711-wq](https://github.com/vanshsingh3711-wq) 在 [PR #44551](https://github.com/BerriAI/litellm/pull/44551) 完成首次貢獻
- [@VincentG1234](https://github.com/VincentG1234) 在 [PR #44574](https://github.com/BerriAI/litellm/pull/44574) 完成首次貢獻
- [@ZHOUKAILIAN](https://github.com/ZHOUKAILIAN) 在 [PR #41006](https://github.com/BerriAI/litellm/pull/41006) 完成首次貢獻
- [@zoveki](https://github.com/zoveki) 在 [PR #48734](https://github.com/BerriAI/litellm/pull/48734) 完成首次貢獻
- [@zuraiz-anjum](https://github.com/zuraiz-anjum) 在 [PR #44230](https://github.com/BerriAI/litellm/pull/44230) 完成首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.108.0...v1.109.0
