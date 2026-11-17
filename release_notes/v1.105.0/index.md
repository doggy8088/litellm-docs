---
title: "LiteLLM v1.105.0 新增 Claude Sonnet 5.5、Decisions API 與 litellm.agent()"
description: "第一天即新增 Claude Sonnet 5.5、在 /v1/decisions 與 /v1/systemone 上的 Decisions API，以及透過閘道供程式設計代理程式使用的 litellm.agent()。"
slug: "v1-105-0"
date: 2026-10-11T00:00:00
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
docker.litellm.ai/berriai/litellm:1.105.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.0
```

</TabItem>
</Tabs>

此版本已發佈為 [`ghcr.io/berriai/litellm:v1.105.0`](https://github.com/BerriAI/litellm/pkgs/container/litellm)。請參閱 [GitHub release](https://github.com/BerriAI/litellm/releases/tag/v1.105.0) 與完整的 [releases page](https://github.com/BerriAI/litellm/releases).

這些說明涵蓋自 `v1.104.0` 以來的所有內容。在 rc.1 之後加入發行線的變更，包括 rc.2、rc.3 以及在穩定標籤之前合併的 Decisions 後續項目，列於 [v1.105.0-rc.1 定版後納入的變更](#included-after-the-v11050-rc1-cut) 之下

先列出面向客戶的變更。測試、CI 與內部變更列在底部。

:::danger[重大變更]

這些提示涵蓋與上一個穩定版本 `v1.104.0` 不同的使用者行為

**`ENFORCE_PRISMA_MIGRATION_CHECK=false` 現在會被忽略**，因此 migration 失敗的代理程式將無法啟動。這可避免新版本在過時的資料庫 schema 上提供流量並使請求失敗。請參閱 [`v1.104.0` 重大變更](/release_notes/v1.104.0/v1-104-0) 與 [PR #44141](https://github.com/BerriAI/litellm/pull/44141)

**Bedrock GPT-5.6、GPT-6 與 GPT-6.1 從 Converse 改為原生 Chat Completions**，因此回應 id、`service_tier` 與推理欄位的形狀會改變。使用 `bedrock/converse/<model>` 可留在 Converse。請參閱 [PR #44307](https://github.com/BerriAI/litellm/pull/44307)

**除非 `ENABLE_SSO_DEBUG=true`，否則 `/sso/debug/*` 回傳 404。**請參閱 [PR #43150](https://github.com/BerriAI/litellm/pull/43150)

**從 `v1.104.2` 升級：將 `safety_identifier` 傳送給 OpenAI 以外提供者的 Decisions 請求現在回傳 400**，而不是以 200 回應並靜默丟棄識別碼。這涵蓋 `/v1/decisions`、`/v1/systemone` 與 `litellm.decisions()` 上的 Perplexity、TypeSafe、OpenRouter、Strands Decider 與 Cloudflare。在部署上、`litellm_settings` 之下、請求主體中或 `litellm.drop_params` 上設定 `drop_params: true` 可保留舊行為。`/v1/systemone` 請求也會以呼叫類型 `asystemone` 記錄，而不是 `adecisions`。請參閱 [PR #44955](https://github.com/BerriAI/litellm/pull/44955) 與 [PR #45846](https://github.com/BerriAI/litellm/pull/45846)

:::

## 重點摘要 {#key-highlights}

- **第一天即有新模型**：Claude Sonnet 5.5 涵蓋 Anthropic、Bedrock、Bedrock Mantle、Vertex AI、Azure AI、OpenRouter 與 Perplexity，GPT-6.1 Sol 涵蓋 OpenAI、Azure、Bedrock 與 OpenRouter，以及 Bedrock 與 Vertex AI 上的 Grok 4.7，包含在 78 個新目錄條目之中
- **新提供者與路由**：Prism、Sail 與 Cortecs 提供者、原生 xAI 批次與檔案、Fireworks 路由器模型，以及在原生 Chat Completions 上提供的 Bedrock GPT-5.6+
- **Decisions API**：決策模型在 `/v1/decisions`（OpenAI 格式）與 `/v1/systemone`（System One 格式）上回答有型別的是/否、選擇與分數問題，涵蓋 OpenAI、Perplexity、TypeSafe、OpenRouter、Cloudflare、Strands Decider、hosted vLLM 與 Azure AI Microsoft-Decision-1，並帶有決策模型防護欄，以及將已接入的決策模型作為 Auto Router 分類器
- **`litellm.agent()`**：從 SDK 透過 AI 閘道執行 Claude Code、Codex、OpenCode 與 Deep Agents
- **Lens 與 Agent Traces**：OTLP 追蹤擷取儲存在 ClickHouse 中並配對支出、可對追蹤執行範圍限定的 SQL、聊天式執行檢視，以及由獨立 worker 執行的 Lens（Beta）調查
- **代理程式身分**：以 Entra ID 身分註冊代理程式、驗證委派請求，並強制執行權威性的代理程式權限
- **大規模下更快的代理程式**：單一請求範圍的 Redis pipeline 處理驗證、支出、速率限制與路由讀取、為緩衝回應提供 gzip，以及從伺服器分頁金鑰而非將每個金鑰載入瀏覽器的用量頁面

## v1.105.0-rc.1 定版後納入的變更 {#included-after-the-v11050-rc1-cut}

- `/v1/decisions` 與 `/v1/systemone` 上的 Decisions API，帶有 OpenAI、Perplexity、TypeSafe、OpenRouter、Cloudflare 與 Strands Decider 提供者（rc.3） - [PR #45189](https://github.com/BerriAI/litellm/pull/45189)
- Decisions 後續項目：hosted vLLM 與 Azure AI Microsoft-Decision-1 提供者、在 AgentCore runtime ARN 上的 Strands Decider、`litellm.systemone()`、依 `usage.cost` 的 OpenRouter 計費、在不支援處拒絕 `safety_identifier`，以及在 Add Model 表單中的 TypeSafe 與 Strands Decider - [PR #45905](https://github.com/BerriAI/litellm/pull/45905)
- 帶有 Admin UI 流程的決策模型防護欄 - [PR #45894](https://github.com/BerriAI/litellm/pull/45894)
- 挑選已接入決策模型作為其分類器的 Auto Router 設定 - [PR #45915](https://github.com/BerriAI/litellm/pull/45915)
- pgbouncer 1.26.0，讓 Docker 映像再次能建置，以及鎖定的相依性更新（rc.2） - [PR #45013](https://github.com/BerriAI/litellm/pull/45013)、[PR #44803](https://github.com/BerriAI/litellm/pull/44803)
- 為穩定標籤重建的 Admin UI 套件 - [PR #45927](https://github.com/BerriAI/litellm/pull/45927)

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（3 個新提供者） {#new-providers-3-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [Prism](../../docs/providers/prism) | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | Prism 推論，作為 OpenAI 相容提供者，目錄中有 DeepSeek V4 Flash 與 V4.1 Flash |
| Sail | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 12 個 Sail 模型，`service_tier` 對應到 Sail 的完成視窗，並以該視窗的價格計費，包括新的 `balanced` 層級 |
| Cortecs | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | Cortecs，一個歐盟 LLM 路由器，作為 OpenAI 相容提供者 |

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做的事 |
| --- | --- | --- |
| [xAI](../../docs/providers/xai) | `/v1/files`, `/v1/batches` | 執行原生 xAI 批次與檔案 |
| [Amazon Bedrock](../../docs/providers/bedrock) | `/v1/chat/completions` | 在 bedrock-runtime 的原生 Chat Completions 上提供 GPT-5.6、GPT-6 與 GPT-6.1，並為 gpt-oss 與 Grok 提供 `chat_completions/` 選用方式 |
| [Fireworks AI](../../docs/providers/fireworks_ai) | `/v1/chat/completions` | 路由到並列出 `auto`、`auto-instant` 與 `firerouter` 路由器 |

## Decisions API {#decisions-api}

代理程式現在提供決策模型，它們回答關於輸入的有型別問題（是/否述詞、選擇與分數）。請求會經過一般的金鑰、預算、支出追蹤與防護欄。請參閱 [Decisions 文件](../../docs/decisions)

- **兩種請求格式**
    - `POST /v1/decisions` 與 `POST /decisions` 採用 OpenAI 的 Decisions API 格式：`input` 加上 `questions` 清單，以 `answers` 清單與 OpenAI 風格的 `usage` 回應
    - `POST /v1/systemone` 與 `POST /systemone` 採用 System One 格式：`state` 加上具名的 `questions` 對應表，以依問題名稱為鍵的 `answers` 對應表回應
    - 兩條路由在代理程式內部共用一種格式，因此任何 Decisions 模型都能在任一路由上呼叫
- **提供者**：`openai/`（`gpt-6-luna`）、`perplexity/`、`typesafe/`、`openrouter/`、`cloudflare/clef` 與 `cloudflare/clef-flash`、用於 Microsoft-Decision-1 的 `azure_ai/`，以及自架的 `strands_decider/` 與 `hosted_vllm/`（兩者都需要 `api_base`）。`api_base` 為 AgentCore runtime ARN 的 `strands_decider/` 部署會呼叫 `InvokeAgentRuntime`，以部署的 `aws_*` 憑證簽署
- **SDK**：`litellm.decisions()` 採用 OpenAI 格式，新的 `litellm.systemone()` 採用 System One 格式。`litellm.decisions(state=...)` 仍可運作，並警告其已棄用、改用 `litellm.systemone()`
- **OpenAI**：影像、多訊息輸入、`safety_identifier`、名稱與拒絕會在 `/v1/decisions` 上透傳。提供者以與其他 OpenAI 呼叫相同的順序讀取 `litellm.api_key`、`litellm.openai_key`、`litellm.api_base`、`OPENAI_BASE_URL` 與 `OPENAI_API_BASE`。其他提供者對 `safety_identifier` 回傳 400，除非 `drop_params` 將其丟棄
- **任何上游呼叫之前的驗證**：缺少 `state`、格式錯誤的問題、超過 128 個問題、單一選項的問題或非 JSON 的主體都會回傳 400。傳送給只接受文字的提供者的影像輸入會回傳明確的 400
- **支出追蹤**：依成本對照表的逐 token 定價，快取與快取寫入輸入 token 以各自費率計費。OpenRouter 呼叫（包括 `/openrouter/alpha/decisions` 透傳）依 OpenRouter 在 `usage.cost` 中回報的成本計費
- **健康檢查**：`/health` 以單一問題的 Decisions 呼叫探測 `mode: evaluation` 部署，且 `health_check_params` 可覆寫其 `state` 與 `questions`
- **防護欄**：當呼叫者設定 `include_guardrail_response` 時，OpenAI 格式回應會包含 `guardrail_information`。新的 `decision_model` 防護欄以管理員撰寫的是/否問題篩查訊息與工具呼叫引數，每個問題設定為在其閾值以上封鎖或記錄，並從 Admin UI 與 Guardrail Garden 設定
- **Auto Router**：新的路由器可使用已接入的決策模型部署作為其分類器，且現有的路由器設定保持運作
- **Admin UI 與文件**：TypeSafe 與 Strands Decider 在 Add Model 提供者清單中，且 Swagger UI 描述了兩條路由
- **透傳**：位於 `/v1/decisions` 的現有 `pass_through_endpoints` 條目繼續回應該路徑，而 `/decisions` 提供原生路由

#### 新增 Decisions 模型支援（7 個新模型） {#new-decisions-model-support-7-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens）| 輸出（$/1M tokens）|
| --- | --- | --- | --- | --- |
| Perplexity | `perplexity/pplx-decider-v1-27b` | 262K | $0.04 | $0.00 |
| Cloudflare | `cloudflare/clef` | 65K | $0.24 | $0.00 |
| Cloudflare | `cloudflare/clef-flash` | 65K | $0.09 | $0.00 |
| Cloudflare | `cloudflare/@cf/cloudflare/clef` | 65K | $0.24 | $0.00 |
| Cloudflare | `cloudflare/@cf/cloudflare/clef-flash` | 65K | $0.09 | $0.00 |
| Azure AI | `azure_ai/Microsoft-Decision-1` | - | $0.042 | $0.00 |
| Strands Decider | `strands_decider/strands-decider-2B-hobson-v19` | - | $0.00（自架） | $0.00 |

現有的 `gpt-6-luna` 條目現在將 `/v1/decisions` 列為其支援端點之一。這些模型不計入下方的 78 個

- 新增統一的 `/v1/decisions` 端點、在 `/v1/systemone` 提供 System One 格式，並新增 OpenAI 作為 Decisions 提供者 - [PR #44236](https://github.com/BerriAI/litellm/pull/44236)、[PR #45184](https://github.com/BerriAI/litellm/pull/45184)、[PR #45214](https://github.com/BerriAI/litellm/pull/45214)，回移於 [PR #45189](https://github.com/BerriAI/litellm/pull/45189)
- 透過各提供者設定與共用 HTTP 處理器分派 Decisions - [PR #45129](https://github.com/BerriAI/litellm/pull/45129)、[PR #45130](https://github.com/BerriAI/litellm/pull/45130)、[PR #45442](https://github.com/BerriAI/litellm/pull/45442)
- 新增 hosted vLLM 與 Azure AI Microsoft-Decision-1 提供者 - [PR #45501](https://github.com/BerriAI/litellm/pull/45501)、[PR #45639](https://github.com/BerriAI/litellm/pull/45639)、[PR #45673](https://github.com/BerriAI/litellm/pull/45673)、[PR #45717](https://github.com/BerriAI/litellm/pull/45717)
- 在 AgentCore runtime ARN 上呼叫 Strands Decider - [PR #45678](https://github.com/BerriAI/litellm/pull/45678)
- 新增 `litellm.systemone()`，並讓 `litellm.decisions()` 維持 OpenAI 格式 - [PR #45846](https://github.com/BerriAI/litellm/pull/45846)
- 在無法接受的提供者上拒絕 `safety_identifier`，除非 `drop_params` 將其丟棄 - [PR #44955](https://github.com/BerriAI/litellm/pull/44955)
- 依 `usage.cost` 為 OpenRouter Decisions 與 Decisions 透傳計費 - [PR #45640](https://github.com/BerriAI/litellm/pull/45640)
- 將 TypeSafe 與 Strands Decider 加入 Add Model 提供者清單，並在 Swagger UI 中描述兩條路由 - [PR #45335](https://github.com/BerriAI/litellm/pull/45335)、[PR #45838](https://github.com/BerriAI/litellm/pull/45838)
- 新增帶有 Admin UI 流程的決策模型防護欄 - [PR #45663](https://github.com/BerriAI/litellm/pull/45663)，回移於 [PR #45894](https://github.com/BerriAI/litellm/pull/45894)
- 挑選已接入的決策模型作為 Auto Router 分類器 - [PR #45913](https://github.com/BerriAI/litellm/pull/45913)，回移於 [PR #45915](https://github.com/BerriAI/litellm/pull/45915)

rc.1 之後的 Decisions 後續項目一起回移於 [PR #45905](https://github.com/BerriAI/litellm/pull/45905)

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（78 個新模型） {#new-model-support-78-new-models}

計數代表與 `v1.104.0` 相比的新目錄識別碼，包括別名與區域變體。下方價格為此版本隨附的值，以美元計；執行階段的定價對照表重新載入可更新它們。輸入與輸出欄顯示基本 token 費率；長上下文、快取、影像 token 與其他特殊費率依模型而定

| 提供者 | 模型 | 上下文視窗 | 輸入（$/1M tokens）| 輸出（$/1M tokens）| 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `anthropic.claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `au.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-sonnet-5-5` | 1,000,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-sonnet-5-5` | 1,000,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `eu.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.openai.gpt-6.1-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `global.xai.grok-4.7` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `jp.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `openai.gpt-6.1-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us-gov.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.openai.gpt-6.1-sol` | 1,050,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us.xai.grok-4.7` | 500,000 | $2.2 | $6.6 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `xai.grok-4.7` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫 |
| Anthropic | `claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/MAI-Cyber-1-Flash` | 256,000 | $0.6 | $3.5 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/gpt-6.1-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/mistral-ocr-2505` | - | - | - | OCR；`ocr_cost_per_page`: $0.001 |
| Azure AI | `azure_ai/mistral-ocr-2512` | - | - | - | OCR；`ocr_cost_per_page`: $0.002 |
| Azure OpenAI | `azure/gpt-6.1-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-6.1-sol-2026-09-29` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4.1-Flash-Fast` | 1,048,576 | $0.6 | $2.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bedrock Mantle | `bedrock_mantle/anthropic.claude-sonnet-5-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-6.1-sol` | 1,050,000 | $2.2 | $11 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/anthropic.claude-opus-5-5` | 1,000,000 | $4.8 | $24 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bedrock Mantle | `bedrock_mantle/us-gov-west-1/anthropic.claude-sonnet-5-5` | 1,000,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Databricks | `databricks/databricks-claude-opus-5-5` | 1,000,000 | $4.00001 | $19.99998 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/auto` | - | - | - | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/auto-instant` | - | - | - | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/firerouter` | - | - | - | 聊天；推理；工具呼叫；結構化輸出 |
| Nebius | `nebius/Qwen/Qwen3.8-27B` | 262,144 | $0.45 | $3 | 聊天；推理；工具呼叫 |
| OpenAI | `gpt-4o-mini-tts-2025-03-20` | - | $0.6 | $10 | 語音；`output_cost_per_second`: $0.00025 |
| OpenAI | `gpt-6.1-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenRouter | `openrouter/anthropic/claude-sonnet-5.5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-sonnet-5.5:batch` | 1,000,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/apodex/apodex-1.1-mini:free` | 262,144 | $0 | $0 | 聊天；推理；工具呼叫；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-6.1-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6.1-sol-pro` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6.1-sol-pro:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6.1-sol:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/typesafe/jev-router` | 1,000,000 | $0 | $0 | 聊天；推理；視覺；工具呼叫；結構化輸出；PDF 輸入；音訊輸入 |
| OpenRouter | `openrouter/unbiased/pareto-26.10-preview` | 1,048,576 | $0.8 | $3.2 | 聊天；視覺；工具呼叫；提示快取 |
| Perplexity | `perplexity/anthropic/claude-fable-5-1` | - | $10 | $50 | 回應 |
| Perplexity | `perplexity/anthropic/claude-opus-5-5` | - | $4 | $20 | 回應 |
| Perplexity | `perplexity/anthropic/claude-sonnet-5-5` | - | $2 | $10 | 回應；工具呼叫；網頁搜尋 |
| Perplexity | `perplexity/google/gemini-3.8-flash` | - | $0.75 | $3.75 | 回應 |
| Perplexity | `perplexity/openai/gpt-6-luna` | - | $0.1 | $0.5 | 回應 |
| Perplexity | `perplexity/openai/gpt-6-sol` | - | $2 | $10 | 回應 |
| Perplexity | `perplexity/openai/gpt-6.1-sol` | - | $2 | $10 | 回應 |
| Perplexity | `perplexity/xai/grok-4.7` | - | $2 | $6 | 回應 |
| Prism | `prism/deepseek-v4-flash` | 1,000,000 | $0.17 | $0.21 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Prism | `prism/deepseek-v4.1-flash` | 1,000,000 | $0.17 | $0.63 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/Qwen/Qwen3.6-35B-A3B` | 262,144 | $0.05 | $0.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/deepseek-ai/DeepSeek-V4-Flash-0731` | 1,048,576 | $0.09 | $0.18 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/deepseek-ai/DeepSeek-V4-Pro-0813` | 1,048,576 | $0.92 | $2.77 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.15 | $0.6 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/google/gemma-4-12B-it` | 16,384 | $0.3 | $2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/google/gemma-4-31B-it` | 256,000 | $0.4 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/moonshotai/Kimi-K2.6` | 262,144 | $1 | $4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/moonshotai/Kimi-K3` | 1,048,576 | $2.5 | $12.5 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/nvidia/Gemma-4-31B-IT-NVFP4` | 262,144 | $0.14 | $0.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/openai/gpt-oss-120b` | 131,072 | $0.06 | $0.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/zai-org/GLM-5.3` | 1,048,576 | $0.98 | $3.08 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Sail | `sail/zai-org/GLM-5.3-Flash` | 1,048,576 | $0.11 | $0.35 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/Salesforce/Llama-Rank-V1` | 8,192 | $0.1 | $0 | 重新排序 |
| Together AI | `together_ai/meta-llama/Meta-Llama-3.1-8B` | 16,384 | $0.2 | $0.2 | 補全 |
| Vertex AI | `vertex_ai/claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-sonnet-5-5@default` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/gemini-3.8-flash-lite-tts` | 8,192 | $0.5 | $6 | 語音 |
| Vertex AI | `vertex_ai/gemini-3.8-flash-tts` | 8,192 | $0.5 | $9 | 語音 |
| Vertex AI | `vertex_ai/xai/grok-4.7` | 524,288 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Voyage AI | `voyage/rerank-1` | 8,000 | $0.05 | $0 | 重新排序 |
| Voyage AI | `voyage/rerank-lite-1` | 4,000 | $0.02 | $0 | 重新排序 |
| Voyage AI | `voyage/voyage-large-2-instruct` | 16,000 | $0.12 | $0 | 嵌入 |

#### 更新後的定價（59 個模型） {#updated-pricing-59-models}

| 提供者 / 模型 | 變更的 token 價格（每 1M tokens 的美元）|
| --- | --- |
| `azure/eu/gpt-6-astra` | 輸入：$11 到 $12；輸出：$55 到 $60；快取讀取：$1.1 到 $1.2；快取寫入：$13.75 到 $15 |
| `azure/gpt-4o-mini` | 輸入：$0.165 到 $0.15；輸出：$0.66 到 $0.6 |
| `azure/gpt-4o-mini-tts` | 輸入：$2.5 到 $0.6 |
| `azure_ai/deepseek-v4.1-flash` | 輸入：$0.375 到 $0.3；輸出：$1.5 到 $1.2；快取讀取：$0.008 到 $0.006 |
| `azure_ai/grok-4.6` | 輸入：$2 到 $1.25 |
| `bedrock/ap-southeast-2/minimax.minimax-m2.5` | 輸入：$0.309 到 $0.31；輸出：$1.236 到 $1.24 |
| `fireworks-ai-up-to-4b` | 輸入：$0.2 到 $0.1；輸出：$0.2 到 $0.1 |
| `fireworks_ai/accounts/fireworks/models/deepseek-v4p1-flash` | 輸入：$0.22 到 $0.3；輸出：$0.66 到 $1.2；快取讀取：$0.007 到 $0.006 |
| `fireworks_ai/deepseek-v4p1-flash` | 輸入：$0.22 到 $0.3；輸出：$0.66 到 $1.2；快取讀取：$0.007 到 $0.006 |
| `github_copilot/claude-haiku-4.5` | 輸入：未設定 到 $1；輸出：未設定 到 $5；快取讀取：未設定 到 $0.1；快取寫入：未設定 到 $1.25 |
| `github_copilot/claude-sonnet-4` | 輸入：未設定 到 $3；輸出：未設定 到 $15；快取讀取：未設定 到 $0.3；快取寫入：未設定 到 $3.75 |
| `github_copilot/gpt-5-mini` | 輸入：未設定 到 $0.25；輸出：未設定 到 $2；快取讀取：未設定 到 $0.025 |
| `github_copilot/gpt-5.3-codex` | 輸入：未設定 到 $1.75；輸出：未設定 到 $14；快取讀取：未設定 到 $0.175 |
| `meta.llama3-1-405b-instruct-v1:0` | 輸入：$5.32 到 $2.4；輸出：$16 到 $2.4 |
| `meta.llama3-1-70b-instruct-v1:0` | 輸入：$0.99 到 $0.72；輸出：$0.99 到 $0.72 |
| `meta.llama3-2-11b-instruct-v1:0` | 輸入：$0.35 到 $0.16；輸出：$0.35 到 $0.16 |
| `meta.llama3-2-90b-instruct-v1:0` | 輸入：$2 到 $0.72；輸出：$2 到 $0.72 |
| `mistral.mistral-large-2407-v1:0` | 輸入：$3 到 $2；輸出：$9 到 $6 |
| `moonshotai.kimi-k3` | 輸入：$3 到 $3.3；輸出：$15 到 $16.5；快取讀取：$0.3 到 $0.33；快取寫入：$3.75 到 $4.125 |
| `openrouter/deepseek/deepseek-chat` | 輸入：$0.32 到 $0.2574；輸出：$0.89 到 $1.0287 |
| `openrouter/deepseek/deepseek-chat-v3-0324` | 輸入：$0.25 到 $0.29；輸出：$1 到 $1.14；快取讀取：未設定 到 $0.11 |
| `openrouter/deepseek/deepseek-v3.1-terminus` | 輸入：$0.27 到 $0.3 |
| `openrouter/deepseek/deepseek-v3.2` | 輸入：$0.269 到 $0.28；輸出：$0.4 到 $0.42；快取讀取：$0.1345 到 $0.028 |
| `openrouter/deepseek/deepseek-v4-flash` | 輸入：$0.049 到 $0.04186；輸出：$0.098 到 $0.08372；快取讀取：$0.0098 到 $0.008372 |
| `openrouter/deepseek/deepseek-v4-flash-0731` | 輸入：$0.03 到 $0.0108；輸出：$0.32 到 $1.28；快取讀取：$0.016 到 $0.0108 |
| `openrouter/deepseek/deepseek-v4-flash-vision-exp` | 輸入：$0.22 到 $0.2156；輸出：$0.66 到 $0.6468；快取讀取：$0.007 到 $0.00686 |
| `openrouter/deepseek/deepseek-v4-pro` | 輸入：$0.844944 到 $0.2088；輸出：$1.689888 到 $0.4176；快取讀取：$0.070412 到 $0.0174 |
| `openrouter/deepseek/deepseek-v4-pro-0813` | 輸入：$0.462 到 $1.32；輸出：$1.386 到 $3.96；快取讀取：$0.0154 到 $0.044 |
| `openrouter/deepseek/deepseek-v4.1-flash` | 輸入：$0.3 到 $0.03；輸出：$1.2 到 $0.5；快取讀取：$0.006 到 $0.01 |
| `openrouter/google/gemma-4-26b-a4b-it` | 輸入：$0.09 到 $0.0765；輸出：$0.3 到 $0.255；快取讀取：$0.05 到 $0.0425 |
| `openrouter/inclusionai/ling-3.0-flash-vl` | 輸入：$0.06 到 $0.021；輸出：$0.18 到 $0.0616；快取讀取：$0.012 到 $0.0042 |
| `openrouter/meta/muse-glimmer-30b` | 輸入：$0.3 到 $0.35；輸出：$1.2 到 $1.5 |
| `openrouter/minimax/minimax-m1` | 輸入：$0.4 到 $0.55 |
| `openrouter/minimax/minimax-m2.7` | 輸入：$0.3 到 $0.21；輸出：$1.2 到 $0.84；快取讀取：$0.06 到 $0.042 |
| `openrouter/moonshotai/kimi-k2.6` | 輸入：$0.95 到 $0.43415；輸出：$4 到 $1.828；快取讀取：$0.16 到 $0.07312 |
| `openrouter/moonshotai/kimi-k2.7-code` | 輸入：$0.6562 到 $0.6712；輸出：$3.3 到 $3.35 |
| `openrouter/moonshotai/kimi-k3` | 輸入：$3 到 $0.4357；輸出：$15 到 $10；快取讀取：$0.3 到 $0.4357 |
| `openrouter/nvidia/nemotron-3.5-lightning` | 輸入：$0.08 到 $0.0595；輸出：$0.2 到 $0.17；快取讀取：$0.04 到 $0.02975 |
| `openrouter/openai/gpt-5.6-sol-pro` | 輸入：$2 到 $4；輸出：$10 到 $20；快取讀取：$0.2 到 $0.4；快取寫入：$2.5 到 $5 |
| `openrouter/openai/gpt-oss-120b` | 輸入：$0.15 到 $0.037；輸出：$0.6 到 $0.17；快取讀取：$0.075 到 未設定 |
| `openrouter/openai/gpt-oss-20b` | 快取讀取：$0.03 到 $0.009 |
| `openrouter/prism-ml/ternary-bonsai-2-27b` | 快取讀取：未設定 到 $0.0375 |
| `openrouter/qwen/qwen3-30b-a3b-instruct-2507` | 輸入：$0.1 到 $0.04815；輸出：$0.3 到 $0.19305 |
| `openrouter/qwen/qwen3-vl-30b-a3b-instruct` | 輸入：$0.13 到 $0.15；輸出：$0.52 到 $0.6 |
| `openrouter/qwen/qwen3.5-35b-a3b` | 輸入：$0.3125 到 $0.1625；輸出：$1.25 到 $1.3 |
| `openrouter/qwen/qwen3.6-27b` | 輸出：$2.7 到 $3.2 |
| `openrouter/x-ai/grok-4.7` | 輸入：$1.6 到 $2；輸出：$4.8 到 $6；快取讀取：$0.4 到 $0.5 |
| `openrouter/z-ai/glm-4.6v` | 快取讀取：$0.055 到 $0.05 |
| `openrouter/z-ai/glm-4.7` | 輸入：$0.4 到 $0.6；輸出：$1.75 到 $2.2；快取讀取：$0.08 到 $0.11 |
| `openrouter/z-ai/glm-5.1` | 輸入：$0.966 到 $0.9646；輸出：$3.036 到 $3.0316；快取讀取：$0.1794 到 $0.17914 |
| `openrouter/z-ai/glm-5.2` | 輸入：$0.6496 到 $0.41；輸出：$2.0416 到 $3.99；快取讀取：$0.12064 到 $0.26 |
| `openrouter/z-ai/glm-5.3` | 輸入：$1.4 到 $0.2219；輸出：$4.4 到 $3.39；快取讀取：$0.26 到 $0.1775 |
| `openrouter/z-ai/glm-5.3-flash` | 輸入：$0.045 到 $0.15；輸出：$0.6 到 $0.5；快取讀取：$0.0285 到 $0.03 |
| `openrouter/~x-ai/grok-latest` | 輸入：$1.6 到 $2；輸出：$4.8 到 $6；快取讀取：$0.4 到 $0.5 |
| `perplexity/openai/gpt-5.6-sol` | 輸入：$5 到 $4；輸出：$30 到 $20；快取讀取：$0.5 到 $0.4 |
| `us.meta.llama3-1-405b-instruct-v1:0` | 輸入：$5.32 到 $2.4；輸出：$16 到 $2.4 |
| `us.meta.llama3-1-70b-instruct-v1:0` | 輸入：$0.99 到 $0.72；輸出：$0.99 到 $0.72 |
| `us.meta.llama3-2-11b-instruct-v1:0` | 輸入：$0.35 到 $0.16；輸出：$0.35 到 $0.16 |
| `us.meta.llama3-2-90b-instruct-v1:0` | 輸入：$2 到 $0.72；輸出：$2 到 $0.72 |

登錄表還更新了另外 244 個條目的能力旗標、上下文/輸出限制、非 token 費率與棄用日期

<details>
<summary>已移除的目錄項目（1）</summary>

`azure_ai/muse-spark-1.3`

</details>

### 新提供者 {#new-providers}

- 新增 Prism 提供者 - [PR #41961](https://github.com/BerriAI/litellm/pull/41961)
- 新增 Sail 作為提供者，service_tier 對應到其完成視窗 - [PR #42840](https://github.com/BerriAI/litellm/pull/42840)
- 新增 Cortecs 作為 OpenAI 相容提供者 - [PR #43872](https://github.com/BerriAI/litellm/pull/43872)

### Amazon Bedrock {#amazon-bedrock}

- 將解碼後沒有事件的 converse-stream 200 呈現為 502，而非空回合 - [PR #43213](https://github.com/BerriAI/litellm/pull/43213)
- 在無法處理的影像錯誤上保留提供者狀態碼 - [PR #43416](https://github.com/BerriAI/litellm/pull/43416)
- 新增 xai grok-4.7 定價，並同步 llama、mistral large 2407 與 minimax m2.5 價格 - [PR #43623](https://github.com/BerriAI/litellm/pull/43623)
- 為 claude opus 5.5 與 sonnet 5.5 新增 bedrock_mantle 資料列 - [PR #43647](https://github.com/BerriAI/litellm/pull/43647)
- 新增 openai gpt-6.1-sol 全球與基本資料列 - [PR #43758](https://github.com/BerriAI/litellm/pull/43758)
- 新增 openai.gpt-6.1-sol us geo cris 與 Mantle 資料列 - [PR #43763](https://github.com/BerriAI/litellm/pull/43763)
- 為訊息中的 output config 新增 beta 標頭 - [PR #43778](https://github.com/BerriAI/litellm/pull/43778)
- 將 gpt-6.1-sol 最大輸出 token 設為 131072 - [PR #43782](https://github.com/BerriAI/litellm/pull/43782)
- 保留適用的 beta 標頭 - [PR #43829](https://github.com/BerriAI/litellm/pull/43829)
- 為 thinking 顯示更新新增 beta 標頭 - [PR #43832](https://github.com/BerriAI/litellm/pull/43832)
- 為對話中途工具變更新增 beta - [PR #43833](https://github.com/BerriAI/litellm/pull/43833)
- 接受沒有 content 鍵的 Converse 訊息 - [PR #43936](https://github.com/BerriAI/litellm/pull/43936)
- 預設原生提供 gpt-5.6+ chat completions，並為 gpt-oss 與 grok 提供 chat_completions/ 選用方式 - [PR #44307](https://github.com/BerriAI/litellm/pull/44307)

### Anthropic {#anthropic}

- 丟棄 thinking 文字為空（不只是缺少簽章）的 thinking 區塊 - [PR #38049](https://github.com/BerriAI/litellm/pull/38049)
- 當 extra_body 隱藏直接的用戶端標記時，停用預設快取點 - [PR #43341](https://github.com/BerriAI/litellm/pull/43341)
- 將 per-turn-control beta 轉送到 Azure AI Foundry - [PR #43415](https://github.com/BerriAI/litellm/pull/43415)
- 新增 claude-sonnet-5-5 模型定價 - [PR #43586](https://github.com/BerriAI/litellm/pull/43586)
- 修正 Claude Sonnet 5.5 能力與提供者鍵 - [PR #43587](https://github.com/BerriAI/litellm/pull/43587)
- 將 dangerous-tool-use beta 轉送到 Azure AI Foundry - [PR #43934](https://github.com/BerriAI/litellm/pull/43934)
- 保留 thinking 顯示更新 beta - [PR #43969](https://github.com/BerriAI/litellm/pull/43969)

### Fireworks AI {#fireworks-ai}

- 路由並列出 auto、auto-instant 與 firerouter 路由器 - [PR #43641](https://github.com/BerriAI/litellm/pull/43641)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 在夥伴模型 completion 中停止匯入 vertexai SDK - [PR #42274](https://github.com/BerriAI/litellm/pull/42274)
- 在憑證解析中保留舊版 bucket_name，並新增 GCS_BATCH_BUCKET_NAME 環境變數 - [PR #42803](https://github.com/BerriAI/litellm/pull/42803)
- 讓 Gemma 假串流能與追蹤的 Responses 運作 - [PR #43147](https://github.com/BerriAI/litellm/pull/43147)
- 將 seed 轉送到 Gemini API，而非拒絕它 - [PR #43197](https://github.com/BerriAI/litellm/pull/43197)
- 在驗證上下文快取最小 token 時將工具納入考量 - [PR #43319](https://github.com/BerriAI/litellm/pull/43319)
- 在 completion 適配器中保留 proxy_server_request - [PR #43536](https://github.com/BerriAI/litellm/pull/43536)
- 為每訊息 output_config 轉送 per-turn-control beta - [PR #43558](https://github.com/BerriAI/litellm/pull/43558)

### OpenAI {#openai}

- 將微調與自訂 gpt-5-chat 別名排除在 gpt-5 推理路徑之外 - [PR #43185](https://github.com/BerriAI/litellm/pull/43185)
- 依定價頁新增 openai gpt-6.1-sol - [PR #43738](https://github.com/BerriAI/litellm/pull/43738)
- 依定價頁新增 openai gpt-6-astra ultrafast 層級價格 - [PR #43745](https://github.com/BerriAI/litellm/pull/43745)

### xAI {#xai}

- 新增原生 xAI 批次與檔案支援 - [PR #42812](https://github.com/BerriAI/litellm/pull/42812)

### Hosted vLLM {#hosted-vllm}

- 在重播的 assistant 訊息上保留 reasoning_content - [PR #43599](https://github.com/BerriAI/litellm/pull/43599)

### 模型目錄與定價 {#model-catalog-and-pricing}

- 同步 openrouter 價格並新增 perceptron-mk1.5 - [PR #43246](https://github.com/BerriAI/litellm/pull/43246)
- 新增 fireworks 僅限美國的 deepseek v4.1 flash 優先價格 - [PR #43247](https://github.com/BerriAI/litellm/pull/43247)
- 將 typesafe/jev-router 加入成本對照表 - [PR #43248](https://github.com/BerriAI/litellm/pull/43248)
- 為 muse glimmer 30b 與 deepseek v4 flash vision exp 新增 fireworks 優先價格 - [PR #43252](https://github.com/BerriAI/litellm/pull/43252)
- 修正 fireworks_ai deepseek-v4p1-flash 定價 - [PR #43253](https://github.com/BerriAI/litellm/pull/43253)
- 登錄表稽核 2026-09-26、MAI-Image-2.5-Flash 價格、Databricks Claude Opus 5.5、Azure Foundry 淘汰日期 - [PR #43254](https://github.com/BerriAI/litellm/pull/43254)
- 移除重複的 openrouter/perceptron/perceptron-mk1.5 條目 - [PR #43273](https://github.com/BerriAI/litellm/pull/43273)
- 以 prices api 值為 fireworks deepseek v4.1 flash 定價 - [PR #43311](https://github.com/BerriAI/litellm/pull/43311)
- 以官方來源同步 OpenRouter、Together、Cohere 與 Azure AI 登錄值 - [PR #43337](https://github.com/BerriAI/litellm/pull/43337)
- 修正 azure gpt-4o-mini tts、transcribe、alias 與 MAI-Image-2.5 價格 - [PR #43357](https://github.com/BerriAI/litellm/pull/43357)
- 同步 deepseek、minimax、qwen 與 glm 資料列的 openrouter 價格 - [PR #43384](https://github.com/BerriAI/litellm/pull/43384)
- 從 openrouter deepseek-v4-pro-0813 丟棄過時的快取命中欄位 - [PR #43389](https://github.com/BerriAI/litellm/pull/43389)
- 依 Azure 定價頁更新 azure_ai/grok-4.6 輸入價格 - [PR #43440](https://github.com/BerriAI/litellm/pull/43440)
- 新增 azure_ai/MAI-Cyber-1-Flash - [PR #43446](https://github.com/BerriAI/litellm/pull/43446)
- 從 models API 同步 openrouter 價格 - [PR #43506](https://github.com/BerriAI/litellm/pull/43506)
- 為 together_ai Salesforce/Llama-Rank-V1 新增 deprecation_date - [PR #43507](https://github.com/BerriAI/litellm/pull/43507)
- 將 together_ai gpt-oss-20b 與 gemma-4-31B-it 的 deprecation_date 設為 2026-09-15 - [PR #43509](https://github.com/BerriAI/litellm/pull/43509)
- 新增 mistral ocr 定價與 azure 最大輸出限制 - [PR #43530](https://github.com/BerriAI/litellm/pull/43530)
- 登錄表稽核 2026-09-28、openai deep-research 關閉日期、azure deepseek v4.1 flash 直接價格、vertex gemini 3.8 live avatar 價格、丟棄 azure_ai/muse-spark-1.3 - [PR #43566](https://github.com/BerriAI/litellm/pull/43566)
- 為 anthropic claude-sonnet-5-5 新增網頁搜尋旗標與模型頁來源 - [PR #43584](https://github.com/BerriAI/litellm/pull/43584)
- 新增工具呼叫與推理旗標，修正 nebius DeepSeek-V4.1-Flash 的最大輸出 - [PR #43588](https://github.com/BerriAI/litellm/pull/43588)
- 採用 deepseek-v4-flash-0731 與 v3.2-speciale 的 azure 限制 - [PR #43597](https://github.com/BerriAI/litellm/pull/43597)
- 讓 Azure、Bedrock、Copilot、Gemini、Groq、OpenAI 與 OpenRouter 條目與官方文件一致 - [PR #43598](https://github.com/BerriAI/litellm/pull/43598)
- 為 vertex_ai/claude-sonnet-5-5 新增 Vertex 批次快取價格 - [PR #43602](https://github.com/BerriAI/litellm/pull/43602)
- 新增 baseten DeepSeek-V4.1-Flash-Fast - [PR #43735](https://github.com/BerriAI/litellm/pull/43735)
- 將 fireworks up-to-4b 大小層級降至定價頁價格 - [PR #43740](https://github.com/BerriAI/litellm/pull/43740)
- 新增 azure 與 openrouter gpt-6.1-sol 資料列 - [PR #43744](https://github.com/BerriAI/litellm/pull/43744)
- 從 models-sold-directly 採用 azure 上下文限制 - [PR #43759](https://github.com/BerriAI/litellm/pull/43759)
- 為兩個 together_ai nvidia 資料列新增 deprecation_date - [PR #43809](https://github.com/BerriAI/litellm/pull/43809)
- 為 ember-1、nemotron 與 glm 5.3 us 資料列新增 fireworks 優先價格 - [PR #43811](https://github.com/BerriAI/litellm/pull/43811)
- 新增 Gemini Veo、Mistral 與 Azure Claude 4.5 棄用日期 - [PR #43857](https://github.com/BerriAI/litellm/pull/43857)
- 依定價頁新增 openai gpt-image-2.5 批次價格 - [PR #43869](https://github.com/BerriAI/litellm/pull/43869)
- 新增 vertex_ai gemini-3.8 flash tts 資料列 - [PR #43876](https://github.com/BerriAI/litellm/pull/43876)
- 新增 anthropic claude-sonnet-4-5 棄用日期 - [PR #43898](https://github.com/BerriAI/litellm/pull/43898)
- 新增 perplexity、openrouter、voyage 與 nebius 模型，並修正登錄中繼資料 - [PR #43907](https://github.com/BerriAI/litellm/pull/43907)
- 將 baseten DeepSeek-V4.1-Flash 最大輸出提高到 262144 - [PR #43916](https://github.com/BerriAI/litellm/pull/43916)
- 依 prices api 新增 fireworks inkling 優先價格 - [PR #43949](https://github.com/BerriAI/litellm/pull/43949)
- 從 models API 同步 openrouter 價格 - [PR #43950](https://github.com/BerriAI/litellm/pull/43950)
- 在 GLM-5.3-Flash 上設定 supports_vision 為 true - [PR #43951](https://github.com/BerriAI/litellm/pull/43951)
- 依 2026-10-01 定價更新重新定價 fireworks deepseek v4.1 flash - [PR #44024](https://github.com/BerriAI/litellm/pull/44024)
- 新增 vertex_ai/xai/grok-4.7 定價 - [PR #44059](https://github.com/BerriAI/litellm/pull/44059)
- 還原較晚的 azure Models API 淘汰日期，並為 gpt-6.1-sol 標註日期 - [PR #44072](https://github.com/BerriAI/litellm/pull/44072)
- 從 models API 同步 openrouter 價格 - [PR #44105](https://github.com/BerriAI/litellm/pull/44105)
- 依 Azure 已淘汰模型頁新增 azure_ai 棄用日期 - [PR #44142](https://github.com/BerriAI/litellm/pull/44142)
- 從 Azure 時程採用 azure_ai claude-sonnet-4-5 淘汰日期 - [PR #44145](https://github.com/BerriAI/litellm/pull/44145)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 以 SSE 串流防護欄呼叫前封鎖，並帶有型別的輸出項目 - [PR #42507](https://github.com/BerriAI/litellm/pull/42507)
- 在輸出前串流中斷時備援、讓遭截斷的串流失敗、遵循 request_timeout - [PR #43133](https://github.com/BerriAI/litellm/pull/43133)
- 在 response.completed 影格之前記錄串流 /v1/responses 容器擁有權 - [PR #43140](https://github.com/BerriAI/litellm/pull/43140)
- 保留 Responses 生命週期事件直到輸出，讓輸出前備援只宣告一個回應 - [PR #43238](https://github.com/BerriAI/litellm/pull/43238)
- 在迭代迴圈上執行串流失敗與成功 hooks，而非封鎖它 - [PR #43270](https://github.com/BerriAI/litellm/pull/43270)
- 在串流 /v1/responses 上為僅簽章的 thinking 發出 reasoning 項目 - [PR #43414](https://github.com/BerriAI/litellm/pull/43414)

### Anthropic Messages API {#anthropic-messages-api}

- 當 /v1/messages 串流失敗時傳送真正的錯誤事件 - [PR #41826](https://github.com/BerriAI/litellm/pull/41826)
- 將 Responses 橋接串流失敗呈現為 Anthropic 錯誤事件 - [PR #43126](https://github.com/BerriAI/litellm/pull/43126)
- 將 `litellm.llms.anthropic.experimental_pass_through` 套件重新命名為 `pass_through` - [PR #43329](https://github.com/BerriAI/litellm/pull/43329)
- 當沒有備援可接手時，即時串流 /v1/messages 生命週期影格 - [PR #43600](https://github.com/BerriAI/litellm/pull/43600)

### 代理程式與代理程式對代理程式 {#agents-and-agent-to-agent}

- 新增身分儲存與驗證合約 - [PR #43720](https://github.com/BerriAI/litellm/pull/43720)
- 強制執行權威性的代理程式權限 - [PR #43721](https://github.com/BerriAI/litellm/pull/43721)
- 驗證 Entra 身分與委派請求 - [PR #43722](https://github.com/BerriAI/litellm/pull/43722)
- 新增身分註冊與儀表板控制 - [PR #43723](https://github.com/BerriAI/litellm/pull/43723)

### `litellm.agent()` (SDK) {#litellmagent-sdk}

- 新增 `litellm.agent()`，透過 AI 閘道執行 Claude Code、Codex、OpenCode 與 Deep Agents - [PR #43885](https://github.com/BerriAI/litellm/pull/43885)

### Vector Stores 與 RAG {#vector-stores-and-rag}

- 在 /v1/rag/query 上強制執行金鑰/團隊 vector_stores 允許清單 - [PR #43953](https://github.com/BerriAI/litellm/pull/43953)

### 音訊 {#audio}

- 遵循 Groq Whisper 的 base_url 別名，並將其回報為 api base - [PR #43917](https://github.com/BerriAI/litellm/pull/43917)

### 透傳端點 {#pass-through-endpoints}

- 從 websocket 透傳中移除呼叫者憑證 - [PR #43855](https://github.com/BerriAI/litellm/pull/43855)
- 透過路由器轉送 Azure 透傳主體模型群組 - [PR #43896](https://github.com/BerriAI/litellm/pull/43896)
- 在 token 限制下保留決策請求主體 - [PR #43920](https://github.com/BerriAI/litellm/pull/43920)

### 一般 {#general}

- 以構造方式讓 `_litellm_*` kwargs 不進入提供者請求主體 - [PR #43221](https://github.com/BerriAI/litellm/pull/43221)
- 在任何提供者呼叫之前，一次驗證 stream_chunk_size - [PR #43222](https://github.com/BerriAI/litellm/pull/43222)
- 讓提交的主體不出現於 422 驗證錯誤中 - [PR #43231](https://github.com/BerriAI/litellm/pull/43231)
- 搶救串接的 JSON 工具呼叫引數 - [PR #43260](https://github.com/BerriAI/litellm/pull/43260)
- 計數 Gemini function_declarations 工具 - [PR #43417](https://github.com/BerriAI/litellm/pull/43417)
- 適當分類內部參數，防止洩漏到請求中 - [PR #43783](https://github.com/BerriAI/litellm/pull/43783)
- 讓 silent_model 不進入嵌入提供者請求 - [PR #44064](https://github.com/BerriAI/litellm/pull/44064)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

- 在各表格中將金額與計數欄靠右對齊 - [PR #37889](https://github.com/BerriAI/litellm/pull/37889)
- 將存取群組 MCP 與代理程式選取呈現為可換行的 chips - [PR #41228](https://github.com/BerriAI/litellm/pull/41228)
- 在 Logs 搜尋、表格與抽屜中呈現 x-litellm-call-id - [PR #42436](https://github.com/BerriAI/litellm/pull/42436)
- 在 Tag Management 頁面上依名稱與說明篩選標籤 - [PR #42949](https://github.com/BerriAI/litellm/pull/42949)
- 將 All Models 頁籤重新命名為 Deployed Models，模型篩選器重新命名為 All Proxy Models - [PR #43638](https://github.com/BerriAI/litellm/pull/43638)
- 新增模型排行榜頁面 - [PR #43649](https://github.com/BerriAI/litellm/pull/43649)
- 顯示擁有發現工具之金鑰的使用者 - [PR #43892](https://github.com/BerriAI/litellm/pull/43892)
- 採用新的 LiteLLM 標誌與字母標誌 - [PR #43913](https://github.com/BerriAI/litellm/pull/43913)
- 從 Cost Optimization 導覽項目移除 Beta 徽章 - [PR #43967](https://github.com/BerriAI/litellm/pull/43967)
- 為模型排行榜提供獨特的獎盃圖示 - [PR #44036](https://github.com/BerriAI/litellm/pull/44036)
- 在模型排行榜上顯示每日 token 總計 - [PR #44044](https://github.com/BerriAI/litellm/pull/44044)
- 讓未設定的回呼選取參數不進入儲存 payload - [PR #44213](https://github.com/BerriAI/litellm/pull/44213)
- 縮小側欄標誌，讓它不再壓過頁面標題 - [PR #44247](https://github.com/BerriAI/litellm/pull/44247)

### 用量與分析 {#usage-and-analytics}

- 彙總每日活動端點預設回傳 `breakdown.api_keys` 中的前 100 個金鑰（總計不變）；將 `api_key_limit` 設為最多 1000 - [PR #43398](https://github.com/BerriAI/litellm/pull/43398)
- 為所有用量實體提供有界的每日活動路由（aggregated、search、model_top_keys、export、cache_leakage_keys） - [PR #43408](https://github.com/BerriAI/litellm/pull/43408)
- 用量頁面使用有界的每日活動路由，而非在用戶端儲存所有金鑰 - [PR #43409](https://github.com/BerriAI/litellm/pull/43409)
- 從每日支出復原工作階段金鑰擁有者，用於用量歸屬 - [PR #43642](https://github.com/BerriAI/litellm/pull/43642)
- 以每個金鑰兩筆支出記錄資料列查詢雜湊金鑰名稱 - [PR #43656](https://github.com/BerriAI/litellm/pull/43656)
- 新增原生 ROI 計算器，比較閘道支出與已合併 PR - [PR #43669](https://github.com/BerriAI/litellm/pull/43669)
- 在每日活動中將已完成的批次成本資料列歸屬到 /batches - [PR #43870](https://github.com/BerriAI/litellm/pull/43870)
- 排除實體 id 時保留 NULL 實體 id - [PR #44139](https://github.com/BerriAI/litellm/pull/44139)
- 拒絕非標準格式的每日活動日期 - [PR #44143](https://github.com/BerriAI/litellm/pull/44143)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 刪除大型團隊，無需逐成員的交易 fan-out - [PR #42998](https://github.com/BerriAI/litellm/pull/42998)
- 在過期金鑰驗證失敗時記錄金鑰擁有者身分 - [PR #43105](https://github.com/BerriAI/litellm/pull/43105)
- 將 /sso/debug 路由置於 ENABLE_SSO_DEBUG 之後，預設關閉 - [PR #43150](https://github.com/BerriAI/litellm/pull/43150)
- 登入時將 SSO 顯示名稱持久化為 user_alias - [PR #44065](https://github.com/BerriAI/litellm/pull/44065)

### 代理程式設定 {#proxy-configuration}

- 新增 LITELLM_DISABLE_LAZY_ROUTES，在啟動時註冊選用路由器 - [PR #43911](https://github.com/BerriAI/litellm/pull/43911)

### CLI 與程式設計代理程式 {#cli-and-coding-agents}

- 重用已儲存的代理程式設定並新增 reconfigure - [PR #43392](https://github.com/BerriAI/litellm/pull/43392)

### 部署 {#deployment}

- 為 Store Python 讓 wheel 路徑保持在 Windows MAX_PATH 之下 - [PR #43903](https://github.com/BerriAI/litellm/pull/43903)
- 從 non-root 映像丟棄無作用的 PROXY_EXTRAS_SOURCE 開關 - [PR #44097](https://github.com/BerriAI/litellm/pull/44097)
- 當資料庫設定在啟動時失敗，必定結束 - [PR #44141](https://github.com/BerriAI/litellm/pull/44141)

### Terraform {#terraform}

- 在 unified_access_group create 中接受 2xx 狀態碼 - [PR #42461](https://github.com/BerriAI/litellm/pull/42461)

## AI 整合 {#ai-integrations}

### Lens 與 Agent Traces {#lens-and-agent-traces}

- 新增 Rust 儲存基礎 - [PR #43819](https://github.com/BerriAI/litellm/pull/43819)
- 以獨立 worker 分析代理程式活動 - [PR #43889](https://github.com/BerriAI/litellm/pull/43889)
- Logs 上的 Agent traces 頁籤，帶有時間軸與 otel 設定指南 - [PR #43891](https://github.com/BerriAI/litellm/pull/43891)
- 修正 ClickHouse rollup 分割、去重鍵與保留變更 - [PR #43901](https://github.com/BerriAI/litellm/pull/43901)
- 將 OTLP 擷取移植到目前的追蹤基礎 - [PR #43915](https://github.com/BerriAI/litellm/pull/43915)
- 自動將支出儲存在 ClickHouse 中 - [PR #43928](https://github.com/BerriAI/litellm/pull/43928)
- 調查取樣的追蹤並保留批次結果 - [PR #43942](https://github.com/BerriAI/litellm/pull/43942)
- Agent traces 在側邊抽屜中開啟，帶有聊天式執行檢視 - [PR #43972](https://github.com/BerriAI/litellm/pull/43972)
- 改善追蹤擷取與追蹤詳細資訊 - [PR #43975](https://github.com/BerriAI/litellm/pull/43975)
- 透過虛擬金鑰追蹤 worker 支出 - [PR #43989](https://github.com/BerriAI/litellm/pull/43989)
- 重新命名 Lens 內部，並將其 API 從 `/engine` 移至 `/lens` - [PR #44034](https://github.com/BerriAI/litellm/pull/44034)
- 注入追蹤接收器與存取上下文 - [PR #44035](https://github.com/BerriAI/litellm/pull/44035)
- 將追蹤與設定移入 Lens - [PR #44068](https://github.com/BerriAI/litellm/pull/44068)
- 在 Rust 中正規化代理程式 spans - [PR #44071](https://github.com/BerriAI/litellm/pull/44071)
- 新增範圍限定的 SQL 查詢與 schema 感知的說明 - [PR #44085](https://github.com/BerriAI/litellm/pull/44085)
- 簡化設定與調查工作流程 - [PR #44089](https://github.com/BerriAI/litellm/pull/44089)
- 將 test trace、tracing key 與 otel 端點加入追蹤設定 - [PR #44090](https://github.com/BerriAI/litellm/pull/44090)
- 將 lens 追蹤服務標示為代理程式 - [PR #44116](https://github.com/BerriAI/litellm/pull/44116)
- 僅在保留變更時重新計算 ClickHouse TTL 資訊 - [PR #44117](https://github.com/BerriAI/litellm/pull/44117)

### 防護欄 {#guardrails}

- 在每種請求形狀上遵循 experimental_use_latest_role_message_only - [PR #42447](https://github.com/BerriAI/litellm/pull/42447)
- 啟用明確的 PANW MCP 輸出掃描 - [PR #43109](https://github.com/BerriAI/litellm/pull/43109)
- 在每個 HTTP 防護欄中遵循 litellm_params.timeout - [PR #43134](https://github.com/BerriAI/litellm/pull/43134)
- 將 agent 365 修正到正式端點，並以錯誤等級記錄選用的 fail_open - [PR #43189](https://github.com/BerriAI/litellm/pull/43189)
- 以請求的呼叫前防護欄掃描擷取的向量儲存區塊 - [PR #43271](https://github.com/BerriAI/litellm/pull/43271)
- 封鎖自訂程式碼 http_request 中的私人目的地，並限制防護欄執行時間 - [PR #43280](https://github.com/BerriAI/litellm/pull/43280)
- 保留 Presidio 輸出選取與還原 - [PR #43401](https://github.com/BerriAI/litellm/pull/43401)
- 以防護欄掃描並遮罩頂層指令 - [PR #43629](https://github.com/BerriAI/litellm/pull/43629)
- 從 noma_v2 將設定的 gateway_name 傳送到 Noma - [PR #43678](https://github.com/BerriAI/litellm/pull/43678)
- 將請求對話與工具呼叫傳送到呼叫後監控 - [PR #43770](https://github.com/BerriAI/litellm/pull/43770)
- 在 Azure Prompt Shield 中掃描 Responses API 輸入 - [PR #43786](https://github.com/BerriAI/litellm/pull/43786)
- 將未知的 straiker api_version 視為未設定，而非跳過防護欄 - [PR #43956](https://github.com/BerriAI/litellm/pull/43956)
- 在 Azure Text Moderation 中掃描 Responses API 輸入 - [PR #43965](https://github.com/BerriAI/litellm/pull/43965)
- 將 Straiker `sk_agt_` 金鑰路由到 v3，並在缺少判定時 fail closed - [PR #44011](https://github.com/BerriAI/litellm/pull/44011)
- 還原 Azure 防護欄 get_user_prompt 分派並允許記錄 - [PR #44067](https://github.com/BerriAI/litellm/pull/44067)

### 記錄與可觀測性 {#logging-and-observability}

- 新增 Databricks Zerobus 追蹤記錄回呼 - [PR #42013](https://github.com/BerriAI/litellm/pull/42013)
- 讓 DataLakeServiceClient 保持存活直到其 TTL 到期 - [PR #43082](https://github.com/BerriAI/litellm/pull/43082)
- 清除物件 repr 與巢狀 locals 內的 PII 與機密，新增 SENTRY_SEND_DEFAULT_PII 選用設定 - [PR #43123](https://github.com/BerriAI/litellm/pull/43123)
- 讓團隊回呼憑證不進入儲存的請求主體 - [PR #43217](https://github.com/BerriAI/litellm/pull/43217)
- 當代理程式設定中設定 turn_off_message_logging 時，遮蔽 raw_request - [PR #43219](https://github.com/BerriAI/litellm/pull/43219)
- 依請求階段分離回應後服務 spans，依操作命名 redis spans - [PR #43237](https://github.com/BerriAI/litellm/pull/43237)
- 為租戶目的地上的 datastore spans 提供 Excluded_services 退出選項 - [PR #43278](https://github.com/BerriAI/litellm/pull/43278)
- 為 OpenTelemetry v2 新增 SigNoz 預設 - [PR #43296](https://github.com/BerriAI/litellm/pull/43296)
- 以 x-api-key 將 spans 傳送到 app.langtrace.ai/api/trace - [PR #43322](https://github.com/BerriAI/litellm/pull/43322)
- 在 langfuse usage_details 中傳送快取與推理 token - [PR #43553](https://github.com/BerriAI/litellm/pull/43553)
- 讓請求主體憑證不進入儲存的支出記錄請求 - [PR #43635](https://github.com/BerriAI/litellm/pull/43635)
- 為每小時 S3 資料夾新增 s3_partition_granularity 選項 - [PR #43748](https://github.com/BerriAI/litellm/pull/43748)
- 在 OTel v2 下，於 otel 旁註冊 UI 設定的 arize 回呼 - [PR #43906](https://github.com/BerriAI/litellm/pull/43906)
- 以不帶 base64 padding 或斜線的方式命名 Data Lake 物件 - [PR #43914](https://github.com/BerriAI/litellm/pull/43914)
- 在儲存的支出記錄中讓工具 payload 與 logprobs 不被遮罩 - [PR #44075](https://github.com/BerriAI/litellm/pull/44075)
- 容忍非 dict 的 callback_settings.otel，並忽略裸 EXCLUDED_SERVICES 環境變數 - [PR #44086](https://github.com/BerriAI/litellm/pull/44086)
- 讓用戶端呼叫 id 不共用同一個 Data Lake 檔案 - [PR #44099](https://github.com/BerriAI/litellm/pull/44099)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 在串流區塊與支出資料列上保留提供的 service_tier - [PR #42870](https://github.com/BerriAI/litellm/pull/42870)
- 在支出記錄中記錄請求是否使用了用戶端轉送的 Anthropic OAuth token - [PR #43063](https://github.com/BerriAI/litellm/pull/43063)
- 以新的 cost_per_second 欄位為 chat 逐秒定價計費一次 - [PR #43614](https://github.com/BerriAI/litellm/pull/43614)
- 停止將 optional_params 複製到回應隱藏參數 - [PR #43637](https://github.com/BerriAI/litellm/pull/43637)
- 以 ultrafast 長上下文費率為超過 272k 的 ultrafast 提示計費 - [PR #43764](https://github.com/BerriAI/litellm/pull/43764)
- 為自訂定價部署以目錄費率為服務層級計費 - [PR #43890](https://github.com/BerriAI/litellm/pull/43890)

### 預算 {#budgets}

- 在每個 API 介面上計入提供者預算支出 - [PR #38172](https://github.com/BerriAI/litellm/pull/38172)
- 在團隊成員預算的設定百分比以電子郵件警示 - [PR #42665](https://github.com/BerriAI/litellm/pull/42665)
- 在零成本預算述詞中解析 model_group_alias - [PR #43512](https://github.com/BerriAI/litellm/pull/43512)

### 速率限制 {#rate-limiting}

- 新增 fail_closed_rate_limit_enforcement，在 Redis 速率限制計數器無法連線時以 503 拒絕請求 - [PR #43251](https://github.com/BerriAI/litellm/pull/43251)

## MCP 閘道 {#mcp-gateway}

- 在各工具介面間共用相容性感知的結果轉換 - [PR #43089](https://github.com/BerriAI/litellm/pull/43089)
- 將 Microsoft 365 (Graph) 伺服器加入 MCP 目錄 - [PR #43099](https://github.com/BerriAI/litellm/pull/43099)
- 設定通訊協定版本與能力探索 - [PR #43169](https://github.com/BerriAI/litellm/pull/43169)
- 在沒有儲存憑證的情況下回報可達性 - [PR #43240](https://github.com/BerriAI/litellm/pull/43240)
- 讓 hub 發佈狀態與控制一致 - [PR #43241](https://github.com/BerriAI/litellm/pull/43241)
- 採用共用的伺服器解析與呼叫者授權 - [PR #43263](https://github.com/BerriAI/litellm/pull/43263)
- 掃描並釘選上游工具說明 - [PR #43283](https://github.com/BerriAI/litellm/pull/43283)
- 將 OpenAPI 清單限定於確切的伺服器前綴，並在儲存伺服器時丟棄上游 OAuth 中繼資料 - [PR #43608](https://github.com/BerriAI/litellm/pull/43608)
- 在金鑰、團隊與 MCP 伺服器儲存後保持 MCP 權限可見 - [PR #43810](https://github.com/BerriAI/litellm/pull/43810)
- 為非管理員金鑰與儀表板工作階段解析團隊授予的工具集 - [PR #43908](https://github.com/BerriAI/litellm/pull/43908)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

### Auto Router 與模型路由 {#auto-router-and-model-routing}

- 從周圍文字中解析分類器判定，而非退回預設層級 - [PR #43215](https://github.com/BerriAI/litellm/pull/43215)
- 選用提示快取成本路由 - [PR #43232](https://github.com/BerriAI/litellm/pull/43232)
- 在一次 Redis 往返中取得冷卻狀態與用量計數器 - [PR #43320](https://github.com/BerriAI/litellm/pull/43320)
- 一致地比較歷史與新的節省 - [PR #43348](https://github.com/BerriAI/litellm/pull/43348)
- 將 Claude Code 背景工作階段綁定到其 auto-router - [PR #43767](https://github.com/BerriAI/litellm/pull/43767)
- 移除釘選部署無法解密的加密推理 - [PR #43781](https://github.com/BerriAI/litellm/pull/43781)
- 以上下文變數承載逐請求路由讀取，而非公開方法 kwargs - [PR #43814](https://github.com/BerriAI/litellm/pull/43814)
- 在路由預取中遵循冷卻讀取間隔 - [PR #43815](https://github.com/BerriAI/litellm/pull/43815)
- 為歷史節省顯示實際與基準支出 - [PR #44057](https://github.com/BerriAI/litellm/pull/44057)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 新增 maximum_daily_tag_spend_retention_period 清理設定 - [PR #39221](https://github.com/BerriAI/litellm/pull/39221)
- 給 SpendLogToolIndex 其專屬的清理預算份額，並記錄每次執行的摘要 - [PR #41768](https://github.com/BerriAI/litellm/pull/41768)
- 透過節點層級 pub/sub 用戶端在 Redis Cluster 上傳播驗證快取失效 - [PR #43110](https://github.com/BerriAI/litellm/pull/43110)
- 在准入與呼叫後會計之間保持單一支出計數器批次 - [PR #43369](https://github.com/BerriAI/litellm/pull/43369)
- 單一請求範圍的 Redis pipeline，處理驗證、支出、速率限制與路由讀取 - [PR #43407](https://github.com/BerriAI/litellm/pull/43407)
- 透過非同步包裝器執行 aresponses，讓快取只讀取一次 - [PR #43769](https://github.com/BerriAI/litellm/pull/43769)
- 透過請求 Redis pipeline 重新整理驗證管理物件 - [PR #43776](https://github.com/BerriAI/litellm/pull/43776)
- 每個後端一個呼叫後 Redis pipeline，處理支出、速率限制、路由與回應快取寫入 - [PR #43779](https://github.com/BerriAI/litellm/pull/43779)
- 在 migration 工作中建置 SpendLogs 索引，而非在 migrations 中 - [PR #43948](https://github.com/BerriAI/litellm/pull/43948)
- 立即將回應快取 SET 寫入 Redis，而非在呼叫後批次中 - [PR #43973](https://github.com/BerriAI/litellm/pull/43973)
- 為接受的用戶端 gzip 緩衝回應 - [PR #44052](https://github.com/BerriAI/litellm/pull/44052)
- 限制分割 SpendLogs 索引建置的鎖定等待 - [PR #44109](https://github.com/BerriAI/litellm/pull/44109)
- 當 migration 工作建置索引時，將根憑證而非 Prisma 的 sslcert 交給 libpq - [PR #44203](https://github.com/BerriAI/litellm/pull/44203)

### 相依性更新 {#dependency-updates}

- 提升 pyjwt、moment 與 brace-expansion 以清除 osv-scan - [PR #43792](https://github.com/BerriAI/litellm/pull/43792)
- 將 oauthlib 提升到 4.0.0 以清除 osv-scan - [PR #43899](https://github.com/BerriAI/litellm/pull/43899)
- 提升 gitpython 與 tornado，將 diskcache osv 忽略延長到 11 月 1 日 - [PR #43961](https://github.com/BerriAI/litellm/pull/43961)
- 將 pypdf 從 6.16.2 提升到 6.19.0 - [PR #44033](https://github.com/BerriAI/litellm/pull/44033)

## 文件更新 {#documentation-updates}

- 引導讀者訂閱安全公告郵寄清單 - [PR #43713](https://github.com/BerriAI/litellm/pull/43713)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 98 個 PR 變更測試、CI、貢獻者工具、發行封裝，或尚未接入使用者路徑的 Rust runtime scaffolding。它們本身不會改變代理程式或 SDK 行為

<details>
<summary>測試（48）</summary>

- 為 e2e 套件提供有型別的逐測試中繼資料 - [PR #42044](https://github.com/BerriAI/litellm/pull/42044)
- 記錄每個 e2e 測試的步驟，從 ProxyClient 開始 - [PR #42393](https://github.com/BerriAI/litellm/pull/42393)
- 從 litellm 套件位置解析 blank-S3 閘道 repo 根目錄 - [PR #42911](https://github.com/BerriAI/litellm/pull/42911)
- 透過正式 AsyncHTTPHandler 釘選非同步 5xx 重試 - [PR #43080](https://github.com/BerriAI/litellm/pull/43080)
- 將測試移入啟用的 CI 選取 - [PR #43235](https://github.com/BerriAI/litellm/pull/43235)
- 在每個管理路由上釘選 team-admin 狀態碼矩陣 - [PR #43249](https://github.com/BerriAI/litellm/pull/43249)
- 釘選伺服器解析與授權行為 - [PR #43261](https://github.com/BerriAI/litellm/pull/43261)
- 為 canary 套件分類每個帶憑證的參數 - [PR #43298](https://github.com/BerriAI/litellm/pull/43298)
- 憑證 canary 套件 harness - [PR #43300](https://github.com/BerriAI/litellm/pull/43300)
- 掃描代理程式記錄、指標、Datadog intake 與 Logs 抽屜中的憑證 canaries - [PR #43306](https://github.com/BerriAI/litellm/pull/43306)
- 請求路徑憑證 canary 槽位 D1-D4 - [PR #43307](https://github.com/BerriAI/litellm/pull/43307)
- MCP 與透傳憑證的憑證 canary 槽位 - [PR #43308](https://github.com/BerriAI/litellm/pull/43308)
- 已儲存設定的憑證 canary 槽位 - [PR #43309](https://github.com/BerriAI/litellm/pull/43309)
- 在每個記錄回呼測試後排空記錄 worker，讓後續測試不繼承其事件 - [PR #43344](https://github.com/BerriAI/litellm/pull/43344)
- 停止 VCR 錄製與重播測試自身的 localhost 上游 - [PR #43346](https://github.com/BerriAI/litellm/pull/43346)
- 將 /v1/messages 合約歸類到 tests/integration/messages_endpoint 之下 - [PR #43352](https://github.com/BerriAI/litellm/pull/43352)
- 移除子字串防護 test_default_api_base - [PR #43355](https://github.com/BerriAI/litellm/pull/43355)
- 建構於擷取的 Claude Code 請求之上的原生 /v1/messages 推理整合測試 - [PR #43361](https://github.com/BerriAI/litellm/pull/43361)
- 從控制平面複本讀回管理路由 - [PR #43373](https://github.com/BerriAI/litellm/pull/43373)
- 斷言 Gemma responses 串流實際回報的用量 - [PR #43422](https://github.com/BerriAI/litellm/pull/43422)
- 在 wheel 檢查中強制執行共用的上游錯誤合約 - [PR #43520](https://github.com/BerriAI/litellm/pull/43520)
- 在 team-admin 矩陣中釘選 org-admin 狀態碼 - [PR #43592](https://github.com/BerriAI/litellm/pull/43592)
- 回呼憑證 canary 槽位 C1-C3 與 D5 - [PR #43630](https://github.com/BerriAI/litellm/pull/43630)
- 重新整理已淘汰的 OpenAI 工具呼叫模型 - [PR #43676](https://github.com/BerriAI/litellm/pull/43676)
- 接受繼承 Converse 路由的區域別名 - [PR #43785](https://github.com/BerriAI/litellm/pull/43785)
- 修復 MCP Responses 與預算 fixtures - [PR #43788](https://github.com/BerriAI/litellm/pull/43788)
- 在記錄 shadow 回呼之前讓共用記錄 worker 穩定 - [PR #43847](https://github.com/BerriAI/litellm/pull/43847)
- 修復 completion、SAIL 與支出記錄 fixtures - [PR #43902](https://github.com/BerriAI/litellm/pull/43902)
- 在驗證測試中即時呼叫失敗後還原 AWS 環境 - [PR #43921](https://github.com/BerriAI/litellm/pull/43921)
- 重新整理合格的已淘汰 OpenAI fixtures - [PR #43938](https://github.com/BerriAI/litellm/pull/43938)
- 在 proxy_server 測試中限定 user_api_key_auth 覆寫範圍 - [PR #43952](https://github.com/BerriAI/litellm/pull/43952)
- 修復過時測試並移動已淘汰的 OpenAI 文字補全 fixtures - [PR #43958](https://github.com/BerriAI/litellm/pull/43958)
- 修復過時測試與不穩定的 CI 基礎設施 - [PR #43983](https://github.com/BerriAI/litellm/pull/43983)
- 將 DB 與 Redis 支援的代理程式測試遷移到 tests/integration - [PR #43996](https://github.com/BerriAI/litellm/pull/43996)
- 將 auth、hooks、policy_engine 與 client 測試移入 tests/unit/proxy - [PR #43998](https://github.com/BerriAI/litellm/pull/43998)
- 將 management_endpoints、management_helpers 與 guardrails 測試移入 tests/unit/proxy - [PR #44003](https://github.com/BerriAI/litellm/pull/44003)
- 將 utils、agent_endpoints 與 endpoint 測試移入 tests/unit/proxy - [PR #44006](https://github.com/BerriAI/litellm/pull/44006)
- 注入 HIBP 用戶端與 MCP 迴圈時鐘，讓兩個後端測試不再不穩定 - [PR #44007](https://github.com/BerriAI/litellm/pull/44007)
- 將 proxy_server、_experimental 與 db 測試移入 tests/unit/proxy - [PR #44012](https://github.com/BerriAI/litellm/pull/44012)
- 將 middleware、spend_tracking、pass_through、common_utils 與根代理程式測試移入 tests/unit/proxy - [PR #44015](https://github.com/BerriAI/litellm/pull/44015)
- 刪除舊版代理程式測試樹，並依 glob 分片 tests/unit/proxy - [PR #44018](https://github.com/BerriAI/litellm/pull/44018)
- 為同步呼叫仍可使用的 Sail 視窗計費 - [PR #44058](https://github.com/BerriAI/litellm/pull/44058)
- 在沒有資料庫 URL 的情況下執行 db push 逾時提示測試 - [PR #44073](https://github.com/BerriAI/litellm/pull/44073)
- 讓 1ms 逾時部署不進入提供者快取 - [PR #44082](https://github.com/BerriAI/litellm/pull/44082)
- 將即時提供者舊版測試移入 tests/e2e - [PR #44120](https://github.com/BerriAI/litellm/pull/44120)
- 將舊版代理程式、路由器與 Redis 測試移入 tests/integration - [PR #44128](https://github.com/BerriAI/litellm/pull/44128)
- 斷言已儲存的 Straiker api_version v1 搭配 `sk_agt_` 金鑰會路由到 v3 - [PR #44153](https://github.com/BerriAI/litellm/pull/44153)
- 修復在排程 main CI 上失敗的過時與污染測試 - [PR #44229](https://github.com/BerriAI/litellm/pull/44229)

</details>

<details>
<summary>CI (3)</summary>

- 對新的無界 SQL IN 清單失敗，並新增 Prisma 分塊輔助工具 - [PR #42629](https://github.com/BerriAI/litellm/pull/42629)
- 將每週發行週期與 Linear releases 同步 - [PR #43636](https://github.com/BerriAI/litellm/pull/43636)
- 對本機 Redis 測試 Redis 行為，並列印簡短 tracebacks - [PR #44062](https://github.com/BerriAI/litellm/pull/44062)

</details>

<details>
<summary>程式碼品質與貢獻者工具 (19)</summary>

- 每日新技術債清理，滾動 PR（2026-09-25） - [PR #43151](https://github.com/BerriAI/litellm/pull/43151)
- 新增共用伺服器解析器，不變更呼叫者 - [PR #43262](https://github.com/BerriAI/litellm/pull/43262)
- 在 5 個檔案中以已驗證型別取代 Any - [PR #43304](https://github.com/BerriAI/litellm/pull/43304)
- 僅為 P0 迴歸新增 backport-stable 標籤 - [PR #43351](https://github.com/BerriAI/litellm/pull/43351)
- 以 TeamAccess.allows 回答每個團隊存取檢查 - [PR #43364](https://github.com/BerriAI/litellm/pull/43364)
- 整合 hub 發佈述詞 - [PR #43394](https://github.com/BerriAI/litellm/pull/43394)
- 清理 2026-09-27 的新技術債 - [PR #43538](https://github.com/BerriAI/litellm/pull/43538)
- 在 8 個檔案中以已驗證型別取代 Any - [PR #43551](https://github.com/BerriAI/litellm/pull/43551)
- 丟棄 UI、migration 與 CODEOWNERS 自我擁有者 - [PR #43653](https://github.com/BerriAI/litellm/pull/43653)
- 清理 2026-09-28 的新技術債 - [PR #43674](https://github.com/BerriAI/litellm/pull/43674)
- 在 7 個檔案中以已驗證型別取代 Any - [PR #43704](https://github.com/BerriAI/litellm/pull/43704)
- 清理 2026-09-29 的新技術債 - [PR #43830](https://github.com/BerriAI/litellm/pull/43830)
- 在 7 個檔案中以已驗證型別取代 Any - [PR #43844](https://github.com/BerriAI/litellm/pull/43844)
- 移除 LIT002 可變構造規則 - [PR #43971](https://github.com/BerriAI/litellm/pull/43971)
- 清理 2026-09-30 的新技術債 - [PR #43993](https://github.com/BerriAI/litellm/pull/43993)
- 將 mcp_server 測試參照指向 tests/unit/proxy - [PR #44055](https://github.com/BerriAI/litellm/pull/44055)
- 丟棄未使用的 pytest-postgresql 開發相依性 - [PR #44056](https://github.com/BerriAI/litellm/pull/44056)
- 拆分 KeyActivityPanel 條件鏈，讓 lint 預算回到上限之下 - [PR #44114](https://github.com/BerriAI/litellm/pull/44114)
- 移除橫幅註解、重述註解與無用的 in_loop_thread - [PR #44161](https://github.com/BerriAI/litellm/pull/44161)

</details>

<details>
<summary>Rust runtime 內部機制 (22)</summary>

- 新增 openai_like chat 設定基礎 - [PR #43379](https://github.com/BerriAI/litellm/pull/43379)
- 在各 crates 間共用 anthropic 型別、請求輔助工具與串流合約 - [PR #43426](https://github.com/BerriAI/litellm/pull/43426)
- 擴充閘道設定解析 - [PR #43460](https://github.com/BerriAI/litellm/pull/43460)
- 在路由擁有的推論間共用呼叫生命週期 - [PR #43461](https://github.com/BerriAI/litellm/pull/43461)
- 新增 HTTP host 驅動程式 - [PR #43462](https://github.com/BerriAI/litellm/pull/43462)
- 在閘道推論中使用共用執行 - [PR #43463](https://github.com/BerriAI/litellm/pull/43463)
- 支援 HTTP Responses API - [PR #43464](https://github.com/BerriAI/litellm/pull/43464)
- 將 Python 推論綁定連接到共用路由 - [PR #43465](https://github.com/BerriAI/litellm/pull/43465)
- 新增結構化路由生命週期追蹤 - [PR #43466](https://github.com/BerriAI/litellm/pull/43466)
- 分離閘道驗證與授權 - [PR #43467](https://github.com/BerriAI/litellm/pull/43467)
- 新增虛擬金鑰儲存合約 - [PR #43468](https://github.com/BerriAI/litellm/pull/43468)
- 新增閘道 UI 登入與工作階段 - [PR #43469](https://github.com/BerriAI/litellm/pull/43469)
- 新增 MCP 閘道 - [PR #43470](https://github.com/BerriAI/litellm/pull/43470)
- 封裝閘道容器 - [PR #43471](https://github.com/BerriAI/litellm/pull/43471)
- 新增 litellm-db 與 litellm-db-testing 工作區 scaffolding - [PR #43504](https://github.com/BerriAI/litellm/pull/43504)
- 移除傳遞路由抽象 - [PR #43514](https://github.com/BerriAI/litellm/pull/43514)
- 集中 host 執行並組合回呼 - [PR #43515](https://github.com/BerriAI/litellm/pull/43515)
- 透過明確的快取物件選取 Rust 快取 - [PR #43601](https://github.com/BerriAI/litellm/pull/43601)
- 編排 Messages 路由執行 - [PR #43719](https://github.com/BerriAI/litellm/pull/43719)
- 新增共用 llms wire 型別 derives - [PR #43730](https://github.com/BerriAI/litellm/pull/43730)
- 集中 Python 橋接執行包裝器 - [PR #43871](https://github.com/BerriAI/litellm/pull/43871)
- 以共用的 migrate! 巨集嵌入 migration 資料夾 - [PR #44104](https://github.com/BerriAI/litellm/pull/44104)

</details>

<details>
<summary>未發行變更的還原 (2)</summary>

- 還原伺服器端 Team Usage 匯出中超出 top-N 金鑰上限的部分，該功能從未在穩定版本中發佈 - [PR #43376](https://github.com/BerriAI/litellm/pull/43376)
- 還原 Team 用量檢視中超出 top-N 的團隊金鑰搜尋，該功能從未在穩定版本中發佈 - [PR #43377](https://github.com/BerriAI/litellm/pull/43377)

</details>

<details>
<summary>發行與封裝 (4)</summary>

- 提升 litellm-enterprise 0.1.71 -&gt; 0.1.72、litellm-proxy-extras 0.4.102 -&gt; 0.4.103、litellm 1.104.0 -&gt; 1.105.0 - [PR #43789](https://github.com/BerriAI/litellm/pull/43789)
- 提升 litellm-enterprise 0.1.72 -&gt; 0.1.73、litellm-proxy-extras 0.4.103 -&gt; 0.4.104 - [PR #44126](https://github.com/BerriAI/litellm/pull/44126)
- 提升 litellm-proxy-extras 0.4.104 -&gt; 0.4.105 - [PR #44235](https://github.com/BerriAI/litellm/pull/44235)
- 在 rc/1.105.0 上重建 Admin UI 套件 - [PR #44386](https://github.com/BerriAI/litellm/pull/44386)

</details>

### 依擁有權區域彙整 PR {#pr-roll-up-by-ownership-area}

rc.1 中面向客戶的 PR：**238**。測試、CI 與內部 PR：**98**。總計：**336**

- 模型與提供者：81
- 記錄與追蹤：36
- LLM API 端點：27
- 效能：26
- 驗證與管理：19
- 防護欄：15
- UI：13
- MCP：10
- 支出 / 預算 / 速率限制：10
- 文件：1

## 新貢獻者 {#new-contributors}

- [@4refael](https://github.com/4refael) 在 [PR #41826](https://github.com/BerriAI/litellm/pull/41826) 做出了他們的第一次貢獻
- [@agustin18](https://github.com/agustin18) 在 [PR #43319](https://github.com/BerriAI/litellm/pull/43319) 做出了他們的第一次貢獻
- [@ankit373](https://github.com/ankit373) 在 [PR #43553](https://github.com/BerriAI/litellm/pull/43553) 做出了他們的第一次貢獻
- [@daqiangganjun](https://github.com/daqiangganjun) 在 [PR #38172](https://github.com/BerriAI/litellm/pull/38172) 做出了他們的第一次貢獻
- [@DeviaVir](https://github.com/DeviaVir) 在 [PR #43558](https://github.com/BerriAI/litellm/pull/43558) 做出了他們的第一次貢獻
- [@fedaeho](https://github.com/fedaeho) 在 [PR #43512](https://github.com/BerriAI/litellm/pull/43512) 做出了他們的第一次貢獻
- [@Flexomatic81](https://github.com/Flexomatic81) 在 [PR #43588](https://github.com/BerriAI/litellm/pull/43588) 做出了他們的第一次貢獻
- [@galovics](https://github.com/galovics) 在 [PR #42949](https://github.com/BerriAI/litellm/pull/42949) 做出了他們的第一次貢獻
- [@hsm207](https://github.com/hsm207) 在 [PR #43536](https://github.com/BerriAI/litellm/pull/43536) 做出了他們的第一次貢獻
- [@shoemoney](https://github.com/shoemoney) 在 [PR #38049](https://github.com/BerriAI/litellm/pull/38049) 做出了他們的第一次貢獻
- [@shrey-berri](https://github.com/shrey-berri) 在 [PR #43221](https://github.com/BerriAI/litellm/pull/43221) 做出了他們的第一次貢獻
- [@stewartpark](https://github.com/stewartpark) 在 [PR #43147](https://github.com/BerriAI/litellm/pull/43147) 做出了他們的第一次貢獻
- [@YaseenBashaT](https://github.com/YaseenBashaT) 在 [PR #43197](https://github.com/BerriAI/litellm/pull/43197) 做出了他們的第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.0...v1.105.0
