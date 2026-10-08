---
title: "v1.104.0 - Claude Opus 5.5、GPT-6、Master Key 強制執行與 Team 路由控制"
slug: "v1-104-0"
date: 2026-10-03T00:00:00
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
docker.litellm.ai/berriai/litellm:1.104.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.104.0
```

</TabItem>
</Tabs>

這些說明涵蓋自 `v1.103.0` 以來的所有變更。rc.1 之後加入到發佈分支的變更（包含 rc.2）列在 [納入 v1.104.0-rc.1 截點之後的內容](#included-after-the-v11040-rc1-cut)

先列出面向客戶的變更。測試、CI 與內部變更列在底部。

:::danger[重大變更]

這些重點說明涵蓋與 `v1.103.0`（前一個穩定版）不同的使用者可見行為。

**代理程式現在會拒絕使用未設定、空白或公開已知的 master key 啟動。** 沒有 `LITELLM_MASTER_KEY`、為空，或是已知不安全值的部署，會在升級後停止開機。啟動錯誤會指出不良金鑰的來源，並列出可產生安全金鑰的指令。如果資料庫中保存著使用舊金鑰加密的值，請也設定 `LITELLM_MIGRATE_FROM_MASTER_KEY`，使下一次啟動時重新加密這些值。若要在本機沙箱中保留舊行為，請設定 `LITELLM_DANGEROUSLY_PERMIT_WEAK_OR_UNSET_MASTER_KEY=true` 或 `general_settings.dangerously_permit_weak_or_unset_master_key: true`。請參閱 [PR #42019](https://github.com/BerriAI/litellm/pull/42019)、[PR #42011](https://github.com/BerriAI/litellm/pull/42011)

**用罄的預算現在會回傳 HTTP 422，而不是 429。** 用戶端不再將已耗盡的預算視為可重試的速率限制。真正的 rpm/tpm 限制仍會回傳 429。設定 `litellm_settings.budget_exceeded_status_code: 429` 可保留舊狀態碼。請參閱 [PR #42097](https://github.com/BerriAI/litellm/pull/42097)

**stdio MCP 伺服器預設為關閉。** 既有的 stdio 伺服器仍會列出，但永遠不會啟動，而新的伺服器會遭到拒絕。在代理程式的環境中（不是 `config.yaml` 或資料庫）設定 `LITELLM_ENABLE_MCP_STDIO=true`，然後重新啟動即可繼續使用。請參閱 [PR #44066](https://github.com/BerriAI/litellm/pull/44066)

**當資料庫設定在啟動時失敗時，代理程式會直接結束**，而不是在過時的 schema 上提供服務。設定 `ENFORCE_PRISMA_MIGRATION_CHECK=false` 可保留舊行為。請參閱 [PR #44206](https://github.com/BerriAI/litellm/pull/44206)

**從 `v1.103.0` 或更早版本升級時：Admin UI 與 `lite` CLI 使用者需要重新登入**（`lite login`），因為 session token 使用了新格式。請先完成滾動升級，再要求使用者重新登入。請參閱 [`9fa1a64`](https://github.com/BerriAI/litellm/commit/9fa1a641119dd0d4fe43e93622eae5f482ceb63f)

:::

:::warning 從 `v1.102.x` 或更早版本升級

來自 `v1.103.0` 的兩個 `LiteLLM_SpendLogs` 索引 migration 現在已成為 no-op。請在交易之外自行線上建立索引：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_api_key_startTime_idx" ON "LiteLLM_SpendLogs"("api_key", "startTime");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LiteLLM_SpendLogs_litellm_call_id_idx" ON "LiteLLM_SpendLogs"("litellm_call_id");
```

:::

## 重點摘要 {#key-highlights}

- **首日支援全新前沿模型**：Anthropic、Bedrock、Vertex AI 與 Azure AI 上的 Claude Opus 5.5，以及 OpenAI、Bedrock 與 Azure Foundry 上的 GPT-6 Sol 和 GPT-6 Luna，總計新增 331 個目錄項目
- **新的提供者與路由**：Eden AI 與 Nadir 提供者、TinyFish、fal.ai queue 與 OpenRouter decisions pass-through 路由、Bedrock 原生 Responses API 上的 OpenAI 模型，以及 Bedrock Mantle 原生 Messages API 上的 Claude
- **閘道強化**：代理程式拒絕弱或缺失的 master key，儀表板登入新增遭外洩密碼偵測與強制重設密碼，登出時會撤銷 session，資料庫故障期間驗證會 fail closed，且 stdio MCP 伺服器預設關閉
- **路由控制**：群組範圍優先順序路由、可依時間區間的 team 部署保留、跨 conversation API 的原生 compact-to-fit、Auto Router 的 JEV 分類器，以及可設定的提供者 affinity 標頭
- **Admin UI**：LiteAdmin 助理、提示快取節省、內部使用者節省與 Auto Router 使用量，以及 Capability 與 Fuse v2 路由預測

## 納入 v1.104.0-rc.1 截點之後的內容 {#included-after-the-v11040-rc1-cut}

- stdio MCP 伺服器預設關閉 - [PR #44066](https://github.com/BerriAI/litellm/pull/44066)
- 啟動在資料庫設定失敗時結束，以及 `LiteLLM_SpendLogs` 索引 migration 不再建立任何內容 - [PR #44206](https://github.com/BerriAI/litellm/pull/44206)、[PR #44397](https://github.com/BerriAI/litellm/pull/44397)
- 新的 UI 與 CLI session token 格式（rc.2）- [`9fa1a64`](https://github.com/BerriAI/litellm/commit/9fa1a641119dd0d4fe43e93622eae5f482ceb63f)
- 將 pass-through 端點退回到其 `v1.103.0` 之前的處理方式 - [PR #43962](https://github.com/BerriAI/litellm/pull/43962)
- 修正針對在另一個 worker 上建立的模型之請求突發導致的 400 `Invalid model name` - [PR #44277](https://github.com/BerriAI/litellm/pull/44277)
- 當另一個 pod 已經恢復該列時，多 pod migration 會重試 P3009 - [PR #44283](https://github.com/BerriAI/litellm/pull/44283)
- 相依性升級：`pyjwt`、`oauthlib`、`urllib3`、`tornado`、`gitpython`、`pypdf`、`litellm-proxy-extras` 0.4.102.post1 - [PR #44216](https://github.com/BerriAI/litellm/pull/44216)、[PR #44224](https://github.com/BerriAI/litellm/pull/44224)、[PR #44304](https://github.com/BerriAI/litellm/pull/44304)

## 新增提供者與端點 {#new-providers-and-endpoints}

### 新增提供者（2 個新提供者） {#new-providers-2-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [Eden AI](../../docs/providers/edenai) | `/v1/chat/completions`、`/v1/responses`、`/v1/messages`、`/v1/embeddings`、audio、images、`/v1/videos` | Eden AI 在聊天、嵌入、音訊、影像與影片模型上的統一 API |
| [Nadir](../../docs/providers/nadir) | `/v1/chat/completions` | Nadir 的 `nadir/auto` router，並將 Nadir 回報的成本記錄為回應成本 |

### 擴充的提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做什麼 |
| --- | --- | --- |
| [TinyFish](../../docs/pass_through/tinyfish) | `/tinyfish/*` | 透過具備逐步計費的 pass-through 路由執行 TinyFish Agent API 自動化 |
| [fal.ai](../../docs/providers/fal_ai) | `/fal_ai/*` | 透過具備支出追蹤的 pass-through 路由提交並輪詢 fal queue 工作 |
| [OpenRouter](../../docs/providers/openrouter) | `/openrouter/alpha/decisions` | 透過 pass-through 路由連線到 OpenRouter 的 decisions API |
| [Amazon Bedrock](../../docs/providers/bedrock) | `/v1/responses` | 在 bedrock-runtime 的原生 Responses API 上提供 OpenAI 模型 |
| [Bedrock Mantle](../../docs/providers/bedrock_mantle) | `/v1/messages` | 在 Mantle 的原生 Anthropic Messages API 上提供 Claude 模型 |
| [Vertex AI](../../docs/providers/vertex_batch) | `/v1/files`、`/v1/batches` | 提交原生 Vertex batch JSONL，並進行成本追蹤 |

## 新增模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（331 個新模型） {#new-model-support-331-new-models}

數量代表新的目錄識別碼，包括別名與區域變體。以下價格為此版本隨附的 USD 值；執行階段重新載入 pricing-map 可更新它們。輸入與輸出欄位顯示基礎 token 費率；長上下文、快取、image-token 與其他專用費率取決於模型

| 提供者 | Model | Context Window | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 / 特殊定價 |
| --- | --- | --- | --- | --- | --- |
| Amazon Bedrock | `anthropic.claude-mythos-5-1` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `anthropic.claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-fable-5` | 1,000,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-mythos-preview` | 1,000,000 | $27.5 | $137.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `apac.anthropic.claude-opus-4-7` | 1,000,000 | $5.5 | $27.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-opus-4-8` | 1,000,000 | $5.5 | $27.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-opus-5` | 1,000,000 | $5.5 | $27.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-sonnet-4-6` | 1,000,000 | $3.3 | $16.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `apac.anthropic.claude-sonnet-5` | 1,000,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `au.anthropic.claude-fable-5` | 1,000,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `au.anthropic.claude-mythos-preview` | 1,000,000 | $27.5 | $137.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `au.anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/ap-northeast-1/qwen.qwen3-next-80b-a3b` | 128,000 | $0.18 | $1.45 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/ap-south-1/qwen.qwen3-next-80b-a3b` | 128,000 | $0.18 | $1.41 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/ap-southeast-2/qwen.qwen3-next-80b-a3b` | 128,000 | $0.1545 | $1.236 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/eu-west-1/qwen.qwen3-next-80b-a3b` | 128,000 | $0.18 | $1.41 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/eu-west-2/nvidia.nemotron-super-3-120b` | 256,000 | $0.23 | $1.01 | 聊天；推理；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/eu-west-2/qwen.qwen3-next-80b-a3b` | 128,000 | $0.23 | $1.86 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/sa-east-1/qwen.qwen3-next-80b-a3b` | 128,000 | $0.18 | $1.45 | 聊天；工具呼叫；結構化輸出 |
| Amazon Bedrock | `bedrock/us-gov-east-1/anthropic.claude-opus-5-5` | 1,000,000 | $4.8 | $24 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `bedrock/us-gov-west-1/anthropic.claude-opus-5-5` | 1,000,000 | $4.8 | $24 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `deepseek.r1-v1:0` | 128,000 | $1.35 | $5.4 | 聊天；推理 |
| Amazon Bedrock | `eu.anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-mythos-5-1` | 1,000,000 | $10 | $50 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.anthropic.claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `global.moonshotai.kimi-k3` | 1,000,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `global.openai.gpt-5.4` | 1,000,000 | $2.5 | $15 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `global.openai.gpt-5.5` | 1,000,000 | $5 | $30 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `global.openai.gpt-6-luna` | 1,050,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `global.openai.gpt-6-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `jp.anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `mistral.pixtral-large-2502-v1:0` | 128,000 | $2 | $6 | 聊天；工具呼叫 |
| Amazon Bedrock | `moonshotai.kimi-k3` | 1,000,000 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `openai.gpt-6-luna` | 1,050,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `openai.gpt-6-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us-gov.anthropic.claude-opus-5-5` | 1,000,000 | $4.8 | $24 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-mythos-5` | 1,000,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-mythos-5-1` | 1,000,000 | $11 | $55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.anthropic.claude-mythos-preview` | 1,000,000 | $27.5 | $137.5 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us.anthropic.claude-opus-5-5` | 1,000,000 | $4.4 | $22 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Amazon Bedrock | `us.moonshotai.kimi-k3` | 1,000,000 | $3.3 | $16.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Amazon Bedrock | `us.openai.gpt-5.4` | 1,000,000 | $2.75 | $16.5 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `us.openai.gpt-5.5` | 1,000,000 | $5.5 | $33 | 聊天；推理；視覺；工具呼叫 |
| Amazon Bedrock | `us.openai.gpt-6-luna` | 1,050,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Amazon Bedrock | `us.openai.gpt-6-sol` | 1,050,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Anthropic | `claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/Cohere-command-a-plus-05-2026` | 128,000 | $0.8 | $3.2 | 聊天；推理；工具呼叫 |
| Azure AI | `azure_ai/FW-DeepSeek-V4-Flash` | 1,000,000 | $0.15 | $0.31 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/FW-DeepSeek-V4.1-Flash` | 1,000,000 | $0.375 | $1.5 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/FW-GLM-5.3` | 1,048,576 | $1.75 | $5.5 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/FW-GLM-5.3-Flash` | 1,048,576 | $0.188 | $0.625 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/FW-GPT-OSS-120B` | 131,072 | $0.165 | $0.66 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Azure AI | `azure_ai/MAI-Image-2.5-Pro` | - | $5 | - | 圖像生成 |
| Azure AI | `azure_ai/MAI-Image-2.6` | - | $5 | - | 圖像生成 |
| Azure AI | `azure_ai/MAI-Image-2.6-Flash` | - | $1.75 | - | 圖像生成 |
| Azure AI | `azure_ai/claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Azure AI | `azure_ai/deepseek-v4.1-flash` | 1,000,000 | $0.375 | $1.5 | 聊天；推理；工具呼叫；提示快取 |
| Azure AI | `azure_ai/gpt-6-luna` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/gpt-6-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure AI | `azure_ai/gpt-image-2` | - | $5 | - | 圖像生成；視覺 |
| Azure AI | `azure_ai/mistral-medium-3-5` | 128,000 | $1.5 | $7.5 | 聊天；視覺；結構化輸出 |

| Azure AI | `azure_ai/muse-spark-1.3` | 1,048,576 | $1.25 | $4.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Azure OpenAI | `azure/eu/gpt-6-luna` | 922,000 | $0.12 | $0.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/eu/gpt-6-sol` | 922,000 | $2.4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-6-luna` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-6-luna-2026-09-22` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-6-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-6-sol-2026-09-22` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/gpt-audio` | 128,000 | $2.5 | $10 | 聊天；工具呼叫 |
| Azure OpenAI | `azure/gpt-audio-1.5` | 128,000 | $2.5 | $10 | 聊天；工具呼叫 |
| Azure OpenAI | `azure/gpt-live-1` | - | - | - | 即時；工具呼叫；音訊輸入；`input_cost_per_second`: $0.00083333 |
| Azure OpenAI | `azure/gpt-live-transcribe` | 32,000 | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.00028333 |
| Azure OpenAI | `azure/gpt-realtime` | 32,000 | $4 | $16 | 即時；工具呼叫；音訊輸入 |
| Azure OpenAI | `azure/gpt-realtime-1.5` | 32,000 | $4 | $16 | 即時；工具呼叫；音訊輸入 |
| Azure OpenAI | `azure/gpt-realtime-translate` | 32,000 | - | - | 即時；音訊輸入；`input_cost_per_second`: $0.00056667 |
| Azure OpenAI | `azure/gpt-transcribe` | - | - | - | 轉錄；音訊輸入；`input_cost_per_second`: $0.000075 |
| Azure OpenAI | `azure/us/gpt-6-luna` | 922,000 | $0.11 | $0.55 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Azure OpenAI | `azure/us/gpt-6-sol` | 922,000 | $2.2 | $11 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4-Flash-0731` | 1,048,576 | $0.13 | $0.26 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4-Pro` | 1,048,576 | $1.74 | $3.48 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4-Pro-0813` | 1,048,576 | $1.32 | $3.96 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.3 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/moonshotai/Kimi-K2.6` | 262,000 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/moonshotai/Kimi-K2.7-Code` | 262,000 | $0.95 | $4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/moonshotai/Kimi-K3` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B` | 202,800 | $0.6 | $2.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/thinkingmachines/inkling` | 1,048,576 | $1 | $4.05 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/thinkingmachines/inkling-small` | 1,048,576 | $0.5 | $1.2 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/zai-org/GLM-5.2` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/zai-org/GLM-5.2-Fast` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/zai-org/GLM-5.3-Fast` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Baseten | `baseten/zai-org/GLM-5.3-Flash` | 1,048,576 | $0.15 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/anthropic.claude-haiku-4-5` | 200,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Bedrock Mantle | `bedrock_mantle/deepseek.v3.1` | 128,000 | $0.58 | $1.68 | 聊天；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/moonshotai.kimi-k2-thinking` | 256,000 | $0.6 | $2.5 | 聊天；推理；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-6-luna` | 1,050,000 | $0.11 | $0.55 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/openai.gpt-6-sol` | 1,050,000 | $2.2 | $11 | 回應；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-235b-a22b-2507` | 256,000 | $0.22 | $0.88 | 聊天；推理；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-32b` | 32,000 | $0.15 | $0.6 | 聊天；推理；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-coder-30b-a3b-instruct` | 256,000 | $0.15 | $0.6 | 聊天；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-coder-480b-a35b-instruct` | 128,000 | $0.45 | $1.8 | 聊天；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-next-80b-a3b-instruct` | 256,000 | $0.14 | $1.2 | 聊天；推理；工具呼叫 |
| Bedrock Mantle | `bedrock_mantle/qwen.qwen3-vl-235b-a22b-instruct` | 256,000 | $0.53 | $2.66 | 聊天；視覺；工具呼叫 |
| Cohere | `c4ai-aya-expanse-32b` | 128,000 | $0.5 | $1.5 | 聊天 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/models/ember-1` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/deepseek-v4p1-flash-us` | 1,048,576 | $0.45 | $1.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-5p3-flash-us` | 1,048,576 | $0.225 | $0.75 | 聊天；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/accounts/fireworks/routers/glm-5p3-us` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/deepseek-v4-pro-0813` | 1,048,576 | $1.32 | $3.96 | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/deepseek-v4p1-flash-us` | 1,048,576 | $0.45 | $1.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| Fireworks AI | `fireworks_ai/glm-5p3` | 1,048,576 | $1.4 | $4.4 | 聊天；推理；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/glm-5p3-flash` | 1,048,576 | $0.15 | $0.5 | 聊天；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/glm-5p3-flash-us` | 1,048,576 | $0.225 | $0.75 | 聊天；視覺；工具呼叫；結構化輸出 |
| Fireworks AI | `fireworks_ai/glm-5p3-us` | 1,048,576 | $2.1 | $6.6 | 聊天；推理；工具呼叫；結構化輸出 |
| Gemini | `gemini/deep-research-max-preview-04-2026` | 131,072 | $2 | $12 | 聊天；視覺；網頁搜尋 |
| Gemini | `gemini/deep-research-preview-04-2026` | 131,072 | $2 | $12 | 聊天；視覺；網頁搜尋 |
| Gemini | `gemini/gemini-3.8-flash-lite-tts` | 8,192 | $0.5 | $6 | 語音 |
| Gemini | `gemini/gemini-3.8-flash-tts` | 8,192 | $0.5 | $9 | 語音 |
| Gemini | `gemini/lyria-realtime-exp` | 1,048,576 | $0 | $0 | 聊天 |
| Groq | `groq/llama-guard-3-8b` | 8,192 | $0.2 | $0.2 | 聊天 |
| Nebius | `nebius/deepseek-ai/DeepSeek-V4.1-Flash` | 1,048,576 | $0.3 | $1.2 | 聊天；視覺 |
| OpenAI | `gpt-6-luna` | 922,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenAI | `gpt-6-sol` | 922,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋；電腦使用 |
| OpenRouter | `openrouter/aion-labs/aion-3.5` | 262,144 | $3 | $6 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/aion-labs/aion-3.5-mini` | 262,144 | $0.7 | $1.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/anthropic/claude-opus-5.5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/anthropic/claude-opus-5.5:batch` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/cohere/command-a-plus` | 192,000 | $0.3 | $1.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |

| OpenRouter | `openrouter/deepseek/deepseek-v4.1-flash:batch` | 1,048,576 | $0.112 | $0.336 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/fireworks/ember-1` | 1,048,576 | $3 | $15 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/nex-agi/nex-n2.5-mini` | 262,144 | $0.025 | $0.1 | 聊天；推理；視覺；提示快取；結構化輸出 |
| OpenRouter | `openrouter/nex-agi/nex-n2.5-pro` | 262,144 | $0.075 | $0.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/openai/gpt-6-luna` | 1,050,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-luna-pro` | 1,050,000 | $0.1 | $0.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-luna-pro:batch` | 1,050,000 | $0.05 | $0.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-luna:batch` | 1,050,000 | $0.05 | $0.25 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-sol` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-sol-pro` | 1,050,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-sol-pro:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-6-sol:batch` | 1,050,000 | $1 | $5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/openai/gpt-oss-20b:batch` | 131,072 | $0.024 | $0.112 | 聊天；推理；工具呼叫；結構化輸出 |
| OpenRouter | `openrouter/perceptron/perceptron-mk1.5` | 36,864 | $0.15 | $1.5 | 聊天；推理；視覺；工具呼叫；結構化輸出；音訊輸入；影片輸入 |
| OpenRouter | `openrouter/qwen/qwen3.8-max-prime` | 1,000,000 | $4 | $12 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；影片輸入 |
| OpenRouter | `openrouter/qwen/qwen3.8-omni-flash` | 1,000,000 | $0.15 | $0.47 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| OpenRouter | `openrouter/stealth/space-bunny-alpha` | 1,000,000 | $0 | $0 | 聊天；推理；視覺；工具呼叫；影片輸入 |
| OpenRouter | `openrouter/typesafe/jev-1.13` | 32,000 | $0.042 | $0 | 評估 |
| OpenRouter | `openrouter/upstage/solar-mini4` | 524,288 | $0.05 | $0.2 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| OpenRouter | `openrouter/x-ai/grok-4.7` | 500,000 | $1.6 | $4.8 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；網頁搜尋 |
| OpenRouter | `openrouter/xiaomi/mimo-v2.6-flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| OpenRouter | `openrouter/xiaomi/mimo-v2.6-pro` | 1,048,576 | $0.435 | $0.87 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| OpenRouter | `openrouter/xiaomi/mimo-v2.6-pro-ultraspeed` | 1,048,576 | $4.35 | $8.7 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入 |
| OpenRouter | `openrouter/z-ai/glm-5.3-prime` | 1,000,000 | $2.8 | $8.8 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Together AI | `together_ai/together/Tev1-4B-experimental` | 32,768 | $0.042 | $0 | 聊天 |
| Vertex AI | `gemini-3.8-flash-cyber` | 1,048,576 | $1.5 | $7.5 | 聊天；推理；視覺；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入 |
| Vertex AI | `vertex_ai/chirp_2` | - | - | - | 轉錄；`input_cost_per_second`: $0.00026667 |
| Vertex AI | `vertex_ai/claude-opus-5-5` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-opus-5-5@default` | 1,000,000 | $4 | $20 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/gemini-2.0-flash` | - | $0.15 | $0.6 | 聊天 |
| Vertex AI | `vertex_ai/gemini-2.0-flash-lite` | - | $0.075 | $0.3 | 聊天 |
| Vertex AI | `vertex_ai/gemini-2.5-flash-tts` | - | $0.5 | $10 | 語音 |
| Vertex AI | `vertex_ai/gemini-2.5-pro-tts` | - | $1 | $20 | 語音 |
| Vertex AI | `vertex_ai/gemini-3.8-flash-cyber` | 1,048,576 | $1.5 | $7.5 | 聊天；推理；視覺；提示快取；結構化輸出；PDF 輸入；音訊輸入；影片輸入 |
| Vertex AI | `vertex_ai/gemini-3.8-live` | 131,072 | $0.75 | $4.5 | 即時；視覺；工具呼叫；網頁搜尋；音訊輸入 |
| Vertex AI | `vertex_ai/gemini-omni-1.1-flash-preview` | 57,920 | $1.5 | $9 | 聊天；推理；視覺；影片輸入 |
| Vertex AI | `vertex_ai/meta/llama-3.3-70b-instruct-maas` | 128,000 | $0.72 | $0.72 | 聊天；工具呼叫 |
| Vertex AI | `vertex_ai/virtual-try-on-001` | - | - | - | 影像生成；`output_cost_per_image`: $0.06 |
| Vertex AI | `vertex_ai/zai-org/glm-5.2-maas` | 1,000,000 | $1.4 | $4.4 | 聊天；推理；工具呼叫；提示快取；結構化輸出 |
| Weights & Biases | `wandb/deepseek-ai/DeepSeek-V4.1-Flash` | 1,049,000 | $0.2 | $0.65 | 聊天；推理；視覺；提示快取 |
| Weights & Biases | `wandb/google/gemma-4-26B-A4B-it` | 262,000 | $0.1 | $0.3 | 聊天；推理；視覺；工具呼叫；提示快取 |
| Xiaomi MiMo | `xiaomi_mimo/mimo-v2.6-flash` | 1,048,576 | $0.14 | $0.28 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入；影片輸入 |
| Xiaomi MiMo | `xiaomi_mimo/mimo-v2.6-pro` | 1,048,576 | $0.435 | $0.87 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；音訊輸入；影片輸入 |
| fal.ai | `fal_ai/bytedance/seedance-2.0/image-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.3034；`output_cost_per_second_480p`: $0.1346；`output_cost_per_second_720p`: $0.3034 |
| fal.ai | `fal_ai/bytedance/seedance-2.0/reference-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.3034；`output_cost_per_second_480p`: $0.1346；`output_cost_per_second_720p`: $0.3034 |
| fal.ai | `fal_ai/bytedance/seedance-2.0/text-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.3034；`output_cost_per_second_480p`: $0.1346；`output_cost_per_second_720p`: $0.3034 |
| fal.ai | `fal_ai/bytedance/seedance-2.5/image-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.473；`output_cost_per_second_480p`: $0.2205；`output_cost_per_second_720p`: $0.473 |
| fal.ai | `fal_ai/bytedance/seedance-2.5/reference-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.473；`output_cost_per_second_480p`: $0.2205；`output_cost_per_second_720p`: $0.473 |
| fal.ai | `fal_ai/bytedance/seedance-2.5/text-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.473；`output_cost_per_second_480p`: $0.2205；`output_cost_per_second_720p`: $0.473 |
| fal.ai | `fal_ai/fal-ai/flux-lora-depth` | - | - | - | 影像生成；`output_cost_per_image`: $0.035；`output_cost_per_pixel`: $0.00000003 |
| fal.ai | `fal_ai/fal-ai/flux/dev` | - | - | - | 影像生成；`output_cost_per_image`: $0.025；`output_cost_per_pixel`: $0.00000002 |
| fal.ai | `fal_ai/fal-ai/moondream3-preview/query` | - | $0.4 | $3.5 | 聊天；推理；視覺 |
| fal.ai | `fal_ai/fal-ai/nano-banana-2` | - | - | - | 影像生成；`output_cost_per_image`: $0.08；`output_cost_per_image_0.5K`: $0.06；`output_cost_per_image_1K`: $0.08 |
| fal.ai | `fal_ai/fal-ai/nano-banana-pro` | - | - | - | 影像生成；`output_cost_per_image`: $0.15；`output_cost_per_image_1K`: $0.15；`output_cost_per_image_2K`: $0.15 |
| fal.ai | `fal_ai/fal-ai/trellis` | - | - | - | 影像生成；`output_cost_per_image`: $0.02 |
| fal.ai | `fal_ai/fal-ai/trellis-2` | - | - | - | 影像生成；`output_cost_per_image`: $0.3；`output_cost_per_image_512`: $0.25；`output_cost_per_image_1024`: $0.3 |
| fal.ai | `fal_ai/high/1024-x-1024/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05268 |
| fal.ai | `fal_ai/high/1024-x-1024/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05268 |
| fal.ai | `fal_ai/high/1024-x-1024/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05268 |
| fal.ai | `fal_ai/high/1024-x-1024/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05268 |
| fal.ai | `fal_ai/high/1024-x-1536/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.04116 |
| fal.ai | `fal_ai/high/1024-x-1536/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.04116 |

| fal.ai | `fal_ai/high/1024-x-1536/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.04116 |
| fal.ai | `fal_ai/high/1024-x-1536/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.04116 |
| fal.ai | `fal_ai/high/1024-x-768/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/high/1024-x-768/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/high/1024-x-768/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/high/1024-x-768/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/high/1920-x-1080/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0396 |
| fal.ai | `fal_ai/high/1920-x-1080/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0396 |
| fal.ai | `fal_ai/high/1920-x-1080/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0396 |
| fal.ai | `fal_ai/high/1920-x-1080/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0396 |
| fal.ai | `fal_ai/high/2560-x-1440/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05529 |
| fal.ai | `fal_ai/high/2560-x-1440/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05529 |
| fal.ai | `fal_ai/high/2560-x-1440/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05529 |
| fal.ai | `fal_ai/high/2560-x-1440/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.05529 |
| fal.ai | `fal_ai/high/3840-x-2160/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.10008 |
| fal.ai | `fal_ai/high/3840-x-2160/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.10008 |
| fal.ai | `fal_ai/high/3840-x-2160/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.10008 |
| fal.ai | `fal_ai/high/3840-x-2160/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.10008 |
| fal.ai | `fal_ai/low/1024-x-1024/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00588 |
| fal.ai | `fal_ai/low/1024-x-1024/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00588 |
| fal.ai | `fal_ai/low/1024-x-1024/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00588 |
| fal.ai | `fal_ai/low/1024-x-1024/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00588 |
| fal.ai | `fal_ai/low/1024-x-1536/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00474 |
| fal.ai | `fal_ai/low/1024-x-1536/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00474 |
| fal.ai | `fal_ai/low/1024-x-1536/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00474 |
| fal.ai | `fal_ai/low/1024-x-1536/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00474 |
| fal.ai | `fal_ai/low/1024-x-768/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00402 |
| fal.ai | `fal_ai/low/1024-x-768/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00402 |
| fal.ai | `fal_ai/low/1024-x-768/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00402 |
| fal.ai | `fal_ai/low/1024-x-768/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00402 |
| fal.ai | `fal_ai/low/1920-x-1080/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00441 |
| fal.ai | `fal_ai/low/1920-x-1080/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00441 |
| fal.ai | `fal_ai/low/1920-x-1080/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00441 |
| fal.ai | `fal_ai/low/1920-x-1080/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00441 |
| fal.ai | `fal_ai/low/2560-x-1440/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00615 |
| fal.ai | `fal_ai/low/2560-x-1440/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00615 |
| fal.ai | `fal_ai/low/2560-x-1440/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00615 |
| fal.ai | `fal_ai/low/2560-x-1440/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00615 |
| fal.ai | `fal_ai/low/3840-x-2160/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01113 |
| fal.ai | `fal_ai/low/3840-x-2160/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01113 |
| fal.ai | `fal_ai/low/3840-x-2160/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01113 |
| fal.ai | `fal_ai/low/3840-x-2160/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01113 |
| fal.ai | `fal_ai/max/1024-x-1024/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.21072 |
| fal.ai | `fal_ai/max/1024-x-1024/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.21072 |
| fal.ai | `fal_ai/max/1024-x-1024/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.21072 |
| fal.ai | `fal_ai/max/1024-x-1024/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.21072 |
| fal.ai | `fal_ai/max/1024-x-1536/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.16464 |
| fal.ai | `fal_ai/max/1024-x-1536/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.16464 |
| fal.ai | `fal_ai/max/1024-x-1536/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.16464 |
| fal.ai | `fal_ai/max/1024-x-1536/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.16464 |
| fal.ai | `fal_ai/max/1024-x-768/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.14445 |
| fal.ai | `fal_ai/max/1024-x-768/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.14445 |
| fal.ai | `fal_ai/max/1024-x-768/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.14445 |
| fal.ai | `fal_ai/max/1024-x-768/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.14445 |
| fal.ai | `fal_ai/max/1920-x-1080/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1584 |
| fal.ai | `fal_ai/max/1920-x-1080/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1584 |
| fal.ai | `fal_ai/max/1920-x-1080/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1584 |
| fal.ai | `fal_ai/max/1920-x-1080/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1584 |
| fal.ai | `fal_ai/max/2560-x-1440/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.2211 |
| fal.ai | `fal_ai/max/2560-x-1440/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.2211 |
| fal.ai | `fal_ai/max/2560-x-1440/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.2211 |
| fal.ai | `fal_ai/max/2560-x-1440/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.2211 |
| fal.ai | `fal_ai/max/3840-x-2160/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.40026 |
| fal.ai | `fal_ai/max/3840-x-2160/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.40026 |
| fal.ai | `fal_ai/max/3840-x-2160/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.40026 |
| fal.ai | `fal_ai/max/3840-x-2160/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.40026 |
| fal.ai | `fal_ai/medium/1024-x-1024/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01317 |
| fal.ai | `fal_ai/medium/1024-x-1024/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01317 |
| fal.ai | `fal_ai/medium/1024-x-1024/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01317 |
| fal.ai | `fal_ai/medium/1024-x-1024/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01317 |
| fal.ai | `fal_ai/medium/1024-x-1536/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1024-x-1536/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1024-x-1536/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1024-x-1536/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |

| fal.ai | `fal_ai/medium/1024-x-768/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00903 |
| fal.ai | `fal_ai/medium/1024-x-768/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00903 |
| fal.ai | `fal_ai/medium/1024-x-768/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00903 |
| fal.ai | `fal_ai/medium/1024-x-768/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.00903 |
| fal.ai | `fal_ai/medium/1920-x-1080/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1920-x-1080/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1920-x-1080/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/1920-x-1080/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01029 |
| fal.ai | `fal_ai/medium/2560-x-1440/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01434 |
| fal.ai | `fal_ai/medium/2560-x-1440/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01434 |
| fal.ai | `fal_ai/medium/2560-x-1440/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01434 |
| fal.ai | `fal_ai/medium/2560-x-1440/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.01434 |
| fal.ai | `fal_ai/medium/3840-x-2160/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.02595 |
| fal.ai | `fal_ai/medium/3840-x-2160/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.02595 |
| fal.ai | `fal_ai/medium/3840-x-2160/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.02595 |
| fal.ai | `fal_ai/medium/3840-x-2160/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.02595 |
| fal.ai | `fal_ai/minimax/h3/reference-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.13；`output_cost_per_second_480p`: $0.05；`output_cost_per_second_768p`: $0.06 |
| fal.ai | `fal_ai/minimax/h3/text-to-video` | - | - | - | 影片生成；`output_cost_per_second`: $0.13；`output_cost_per_second_480p`: $0.05；`output_cost_per_second_768p`: $0.06 |
| fal.ai | `fal_ai/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.03612 |
| fal.ai | `fal_ai/xhigh/1024-x-1024/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09366 |
| fal.ai | `fal_ai/xhigh/1024-x-1024/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09366 |
| fal.ai | `fal_ai/xhigh/1024-x-1024/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09366 |
| fal.ai | `fal_ai/xhigh/1024-x-1024/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09366 |
| fal.ai | `fal_ai/xhigh/1024-x-1536/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07377 |
| fal.ai | `fal_ai/xhigh/1024-x-1536/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07377 |
| fal.ai | `fal_ai/xhigh/1024-x-1536/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07377 |
| fal.ai | `fal_ai/xhigh/1024-x-1536/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07377 |
| fal.ai | `fal_ai/xhigh/1024-x-768/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0642 |
| fal.ai | `fal_ai/xhigh/1024-x-768/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0642 |
| fal.ai | `fal_ai/xhigh/1024-x-768/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0642 |
| fal.ai | `fal_ai/xhigh/1024-x-768/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.0642 |
| fal.ai | `fal_ai/xhigh/1920-x-1080/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07041 |
| fal.ai | `fal_ai/xhigh/1920-x-1080/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07041 |
| fal.ai | `fal_ai/xhigh/1920-x-1080/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07041 |
| fal.ai | `fal_ai/xhigh/1920-x-1080/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.07041 |
| fal.ai | `fal_ai/xhigh/2560-x-1440/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09828 |
| fal.ai | `fal_ai/xhigh/2560-x-1440/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09828 |
| fal.ai | `fal_ai/xhigh/2560-x-1440/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09828 |
| fal.ai | `fal_ai/xhigh/2560-x-1440/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.09828 |
| fal.ai | `fal_ai/xhigh/3840-x-2160/openai/gpt-image-2.5/flare/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1779 |
| fal.ai | `fal_ai/xhigh/3840-x-2160/openai/gpt-image-2.5/flare/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1779 |
| fal.ai | `fal_ai/xhigh/3840-x-2160/openai/gpt-image-2.5/sunburst/edit` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1779 |
| fal.ai | `fal_ai/xhigh/3840-x-2160/openai/gpt-image-2.5/sunburst/text-to-image` | - | - | - | 影像生成；視覺；`output_cost_per_image`: $0.1779 |
| xAI | `xai/grok-4.20-0309` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-0309` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-latest` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-latest-non-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-latest-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-non-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-beta-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-0304` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-0304-non-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-0304-reasoning` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-latest` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-non-reasoning-latest` | 1,000,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-experimental-beta-reasoning-latest` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent-beta-latest` | 1,000,000 | $1.25 | $2.5 | 回應；推理；視覺；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent-experimental-beta-0304` | 1,000,000 | $1.25 | $2.5 | 回應；推理；視覺；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-multi-agent-experimental-beta-latest` | 1,000,000 | $1.25 | $2.5 | 回應；推理；視覺；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-non-reasoning-gv2` | 1,000,000 | $1.25 | $2.5 | 聊天；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.20-reasoning-gv2` | 1,000,000 | $1.25 | $2.5 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |
| xAI | `xai/grok-4.7` | 500,000 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；網頁搜尋 |

#### 更新後的定價（73 個模型） {#updated-pricing-73-models}

| 提供者 / 模型 | 已變更的 token 價格（USD 每 100 萬個 token） |
| --- | --- |
| `anthropic.claude-mythos-preview` | 輸入：$0 到 $27.5；輸出：$0 到 $137.5；快取讀取：未設定到 $2.75；快取寫入：未設定到 $34.375 |
| `azure/eu/gpt-5.6` | 輸入：$5.5 到 $4.4；輸出：$33 到 $22；快取讀取：$0.55 到 $0.44；快取寫入：$6.875 到 $5.5 |
| `azure/gpt-5.6` | 輸入：$5 到 $4；輸出：$30 到 $20；快取讀取：$0.5 到 $0.4；快取寫入：$6.25 到 $5 |
| `azure/us/gpt-5.6` | 輸入：$5.5 到 $4.4；輸出：$33 到 $22；快取讀取：$0.55 到 $0.44；快取寫入：$6.875 到 $5.5 |
| `baseten/openai/gpt-oss-120b` | 快取讀取：未設定到 $0.1 |
| `baseten/zai-org/GLM-4.7` | 快取讀取：未設定到 $0.12 |
| `bedrock/eu-west-3/mistral.mistral-large-2402-v1:0` | 輸入：$10.4 到 $5.2；輸出：$31.2 到 $15.6 |
| `bedrock/us-east-1/mistral.mistral-large-2402-v1:0` | 輸入：$8 到 $4；輸出：$24 到 $12 |
| `bedrock/us-west-2/mistral.mistral-large-2402-v1:0` | 輸入：$8 到 $4；輸出：$24 到 $12 |
| `bedrock_mantle/openai.gpt-daybreak-blue-5.6-sol` | 輸入：$5.5 到 $4.4；輸出：$33 到 $22；快取讀取：$0.55 到 $0.44；快取寫入：$6.875 到 $5.5 |
| `cohere.command-text-v14` | 輸入：$1.5 到 $1 |
| `deepseek/deepseek-coder` | 快取讀取：未設定到 $0.014 |
| `deepseek/deepseek-r1` | 快取讀取：未設定到 $0.14 |
| `deepseek/deepseek-v3.2` | 快取讀取：未設定到 $0.028 |
| `eu.anthropic.claude-opus-4-5-20251101-v1:0` | 輸入：$5 到 $5.5；輸出：$25 到 $27.5；快取讀取：$0.5 到 $0.55；快取寫入：$6.25 到 $6.875 |
| `fireworks_ai/accounts/fireworks/models/minimax-m2p7` | 輸入：$0.3 到未設定；輸出：$1.2 到未設定；快取讀取：$0.06 到未設定 |
| `fireworks_ai/accounts/fireworks/routers/kimi-k3-us` | 輸入：$3.3 到 $4.5；輸出：$16.5 到 $22.5；快取讀取：$0.33 到 $0.45 |
| `fireworks_ai/kimi-k3-us` | 輸入：$3.3 到 $4.5；輸出：$16.5 到 $22.5；快取讀取：$0.33 到 $0.45 |
| `gemini-2.5-flash-image` | 快取讀取：$0.03 到未設定 |
| `gemini-3-pro-image-preview` | 快取讀取：未設定到 $0.2 |
| `gemini-3.1-flash-image-preview` | 快取讀取：未設定到 $0.05 |
| `gemini-live-2.5-flash-preview-native-audio-09-2025` | 快取讀取：$0.075 到未設定 |
| `gemini/gemini-live-2.5-flash-preview-native-audio-09-2025` | 快取讀取：$0.075 到未設定 |
| `gemini/gemini-robotics-er-2-streaming-preview` | 輸入：$2 到 $1；輸出：$10 到 $5 |
| `mistral.mistral-large-2402-v1:0` | 輸入：$8 到 $4；輸出：$24 到 $12 |
| `openrouter/deepseek/deepseek-r1` | 快取讀取：未設定到 $0.14 |
| `openrouter/deepseek/deepseek-v3.2-exp` | 快取讀取：未設定到 $0.02 |
| `openrouter/deepseek/deepseek-v4-flash` | 輸入：$0.03724 到 $0.049；輸出：$0.07448 到 $0.098；快取讀取：$0.007448 到 $0.0098 |
| `openrouter/deepseek/deepseek-v4-flash-0731` | 輸入：$0.04 到 $0.03；輸出：$0.08 到 $0.32 |
| `openrouter/deepseek/deepseek-v4-flash-vision-exp` | 輸入：$0.2156 到 $0.22；輸出：$0.6468 到 $0.66；快取讀取：$0.00686 到 $0.007 |
| `openrouter/deepseek/deepseek-v4-pro` | 輸入：$0.422298 到 $0.844944；輸出：$0.844596 到 $1.689888；快取讀取：$0.035192 到 $0.070412 |
| `openrouter/deepseek/deepseek-v4-pro-0813` | 輸入：$0.57816 到 $0.462；輸出：$1.73448 到 $1.386；快取讀取：$0.018396 到 $0.0154 |
| `openrouter/meta/muse-glimmer-30b` | 輸入：$0.35 到 $0.3；輸出：$1.5 到 $1.2 |
| `openrouter/minimax/minimax-m2` | 輸入：$0.255 到 $0.3；輸出：$1.02 到 $1.2 |
| `openrouter/mistralai/mistral-large-2512` | 輸入：$0.55 到 $0.5；輸出：$1.65 到 $1.5；快取讀取：$0.055 到 $0.05 |
| `openrouter/moonshotai/kimi-k2.7-code` | 輸入：$0.7062 到 $0.6562；輸出：$3.21 到 $3.3 |
| `openrouter/moonshotai/kimi-k3` | 輸入：$1.7 到 $3；輸出：$8.5 到 $15；快取讀取：$0.17 到 $0.3 |
| `openrouter/moonshotai/kimi-k3:batch` | 輸入：$3 到 $2.28；輸出：$15 到 $11.4；快取讀取：$0.3 到 $0.228 |
| `openrouter/nvidia/nemotron-3-nano-30b-a3b` | 輸入：$0.06 到 $0.05；輸出：$0.24 到 $0.2 |
| `openrouter/nvidia/nemotron-3.5-lightning` | 輸入：$0.07 到 $0.08 |
| `openrouter/openai/gpt-oss-120b:batch` | 輸入：$0.15 到 $0.0296；輸出：$0.6 到 $0.136 |
| `openrouter/openai/gpt-oss-20b` | 輸入：$0.03 到 $0.018；輸出：$0.13 到 $0.09 |
| `openrouter/qwen/qwen3-30b-a3b-instruct-2507` | 輸入：$0.04815 到 $0.1；輸出：$0.19305 到 $0.3 |
| `openrouter/qwen/qwen3-next-80b-a3b-instruct` | 輸入：$0.09 到 $0.1 |
| `openrouter/qwen/qwen3.6-27b` | 輸入：$0.3 到 $0.32；輸出：$2 到 $2.7；快取讀取：$0.03 到 $0.15 |
| `openrouter/qwen/qwen3.6-35b-a3b` | 輸入：$0.1 到 $0.15；輸出：$0.9 到 $1 |
| `openrouter/z-ai/glm-5.2` | 輸入：$0.5544 到 $0.6496；輸出：$1.7424 到 $2.0416；快取讀取：$0.10296 到 $0.12064 |
| `openrouter/z-ai/glm-5.3` | 輸入：$0.896 到 $1.4；輸出：$2.816 到 $4.4；快取讀取：$0.1664 到 $0.26 |
| `openrouter/z-ai/glm-5.3-flash` | 輸入：$0.09 到 $0.045；輸出：$0.3 到 $0.6；快取讀取：$0.018 到 $0.0285 |
| `openrouter/z-ai/glm-5.3-flash:batch` | 輸入：$0.075 到 $0.06；輸出：$0.25 到 $0.2；快取讀取：$0.015 到 $0.012 |
| `openrouter/z-ai/glm-5.3-flashx` | 快取讀取：$0.075 到 $0.09 |
| `openrouter/z-ai/glm-5.3:batch` | 輸入：$0.7 到 $0.45；輸出：$2.2 到 $2；快取讀取：$0.13 到 $0.1 |
| `openrouter/~anthropic/claude-opus-latest` | 輸入：$5 到 $4；輸出：$25 到 $20；快取讀取：$0.5 到 $0.2；快取寫入：$6.25 到 $5 |
| `openrouter/~deepseek/deepseek-flash-latest` | 輸入：$0.13 到 $0.3；輸出：$0.52 到 $1.2；快取讀取：$0.0026 到 $0.006 |
| `openrouter/~deepseek/deepseek-pro-latest` | 輸入：$0.57816 到 $1.32；輸出：$1.73448 到 $3.96；快取讀取：$0.018396 到 $0.044 |
| `openrouter/~deepseek/deepseek-v4-flash-latest` | 輸出：$0.08 到 $0.64 |
| `openrouter/~moonshotai/kimi-latest` | 輸入：$1.7 到 $3；輸出：$8.5 到 $15；快取讀取：$0.17 到 $0.3 |
| `openrouter/~openai/gpt-luna-latest` | 輸入：$0.2 到 $0.1；輸出：$1.2 到 $0.5；快取讀取：$0.02 到 $0.01；快取寫入：$0.25 到 $0.125 |
| `openrouter/~x-ai/grok-latest` | 輸入：$2 到 $1.6；輸出：$6 到 $4.8；快取讀取：$0.5 到 $0.4 |
| `openrouter/~z-ai/glm-flash-latest` | 輸入：$0.075 到 $0.15；輸出：$0.25 到 $0.5；快取讀取：$0.015 到 $0.05 |
| `openrouter/~z-ai/glm-latest` | 輸入：$0.8442 到 $0.6538；輸出：$2.6532 到 $2.0548；快取讀取：$0.15678 到 $0.12142 |
| `together_ai/Qwen/Qwen3.7-Max` | 輸入：$2.5 到 $1.5；輸出：$7.5 到 $4.5；快取讀取：$0.5 到 $0.3 |
| `together_ai/Qwen/Qwen3.8-Flash` | 輸入：$0.15 到 $0.09；輸出：$0.47 到 $0.282 |
| `vertex_ai/deepseek-ai/deepseek-v3.1-maas` | 快取讀取：未設定到 $0.06 |
| `vertex_ai/deepseek-ai/deepseek-v3.2-maas` | 快取讀取：未設定到 $0.056 |
| `vertex_ai/gemini-2.5-flash-image` | 快取讀取：$0.03 到未設定 |
| `vertex_ai/gemini-3-pro-image-preview` | 快取讀取：未設定到 $0.2 |
| `vertex_ai/gemini-3.1-flash-image-preview` | 快取讀取：未設定到 $0.05 |
| `vertex_ai/google/gemma-4-26b-a4b-it-maas` | 快取讀取：未設定到 $0.015 |
| `vertex_ai/minimaxai/minimax-m2-maas` | 快取讀取：未設定到 $0.03 |
| `vertex_ai/moonshotai/kimi-k2-thinking-maas` | 快取讀取：未設定到 $0.06 |
| `vertex_ai/qwen/qwen3-coder-480b-a35b-instruct-maas` | 快取讀取：未設定到 $0.022 |
| `vertex_ai/zai-org/glm-4.7-maas` | 快取讀取：未設定到 $0.06 |

登錄檔也更新了 630 個更多條目的能力旗標、上下文/輸出限制、非 token 費率，以及棄用日期

<details>
<summary>已移除的目錄項目（275）</summary>

`1024-x-1024/dall-e-2`, `256-x-256/dall-e-2`, `512-x-512/dall-e-2`, `amazon.nova-sonic-v1:0`, `anthropic.claude-3-haiku-20240307-v1:0`, `anthropic.claude-3-sonnet-20240229-v1:0`, `apac.anthropic.claude-3-5-sonnet-20240620-v1:0`, `apac.anthropic.claude-3-5-sonnet-20241022-v2:0`, `apac.anthropic.claude-3-haiku-20240307-v1:0`, `apac.anthropic.claude-3-sonnet-20240229-v1:0`, `azure/eu/o1-preview-2024-09-12`, `azure/global/gpt-5.1-chat`, `azure/gpt-3.5-turbo-0125`, `azure/gpt-35-turbo-0125`, `azure/gpt-35-turbo-1106`, `azure/gpt-5-chat-latest`, `azure/gpt-5.1-chat-2025-11-13`, `azure/gpt-5.2-chat-2025-12-11`, `azure/o1-preview`, `azure/o1-preview-2024-09-12`, `azure/us/o1-preview-2024-09-12`, `azure_ai/Llama-3.2-11B-Vision-Instruct`, `azure_ai/Llama-3.2-90B-Vision-Instruct`, `azure_ai/MAI-Image-2e`, `azure_ai/Meta-Llama-3.1-405B-Instruct`, `azure_ai/Meta-Llama-3.1-8B-Instruct`, `azure_ai/claude-opus-4-1`, `azure_ai/cohere-rerank-v3.5`, `azure_ai/global/grok-3`, `azure_ai/global/grok-3-mini`, `azure_ai/mistral-document-ai-2505`, `bedrock/us-gov-east-1/anthropic.claude-3-5-sonnet-20240620-v1:0`, `bedrock/us-gov-east-1/anthropic.claude-3-haiku-20240307-v1:0`, `bedrock/us-gov-west-1/anthropic.claude-3-5-sonnet-20240620-v1:0`, `bedrock/us-gov-west-1/anthropic.claude-3-7-sonnet-20250219-v1:0`, `bedrock/us-gov-west-1/anthropic.claude-3-haiku-20240307-v1:0`, `cerebras/zai-glm-4.6`, `cerebras/zai-glm-4.7`, `chatgpt-4o-latest`, `claude-3-7-sonnet-20250219`, `claude-3-haiku-20240307`, `claude-3-opus-20240229`, `claude-4-opus-20250514`, `claude-4-sonnet-20250514`, `claude-opus-4-1`, `claude-opus-4-1-20250805`, `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, `codex-mini-latest`, `cohere.command-r-plus-v1:0`, `cohere.command-r-v1:0`, `command`, `command-light`, `command-r`, `command-r-plus`, `dall-e-2`, `dall-e-3`, `databricks/databricks-claude-3-7-sonnet`, `databricks/databricks-gpt-5-1-codex-max`, `databricks/databricks-gpt-5-1-codex-mini`, `databricks/databricks-gpt-5-2-codex`, `databricks/databricks-llama-2-70b-chat`, `databricks/databricks-meta-llama-3-1-405b-instruct`, `databricks/databricks-meta-llama-3-70b-instruct`, `databricks/databricks-mixtral-8x7b-instruct`, `databricks/databricks-mpt-30b-instruct`, `databricks/databricks-mpt-7b-instruct`, `deepinfra/google/gemini-2.0-flash-001`, `embed-english-light-v2.0`, `embed-english-v2.0`, `embed-multilingual-v2.0`, `eu.anthropic.claude-3-haiku-20240307-v1:0`, `eu.anthropic.claude-3-sonnet-20240229-v1:0`, `fireworks_ai/deepseek-v4-pro`, `fireworks_ai/minimax-m2p7`, `friendliai/LGAI-EXAONE/K-EXAONE-2.0-750B-A37B`, `gemini-2.0-flash`, `gemini-2.0-flash-001`, `gemini-2.0-flash-lite`, `gemini-2.0-flash-lite-001`, `gemini-2.5-flash-lite-preview-06-17`, `gemini-3-pro-preview`, `gemini/gemini-1.5-flash`, `gemini/gemini-2.0-flash`, `gemini/gemini-2.0-flash-001`, `gemini/gemini-2.0-flash-lite`, `gemini/gemini-2.0-flash-lite-001`, `gemini/gemini-2.5-flash-lite-preview-06-17`, `gemini/gemini-2.5-flash-lite-preview-09-2025`, `gemini/gemini-2.5-flash-preview-09-2025`, `gemini/gemini-3-pro-preview`, `gemini/gemini-robotics-er-1.5-preview`, `gemini/gemini-robotics-er-1.6-preview`, `gemini/imagen-3.0-generate-002`, `gemini/imagen-4.0-fast-generate-001`, `gemini/imagen-4.0-generate-001`, `gemini/imagen-4.0-ultra-generate-001`, `gemini/veo-2.0-generate-001`, `gpt-4-0125-preview`, `gpt-4-0314`, `gpt-4-turbo-preview`, `gpt-4o-audio-preview`, `gpt-4o-mini-audio-preview`, `gpt-4o-mini-realtime-preview`, `gpt-4o-mini-search-preview-2025-03-11`, `gpt-4o-mini-tts-2025-03-20`, `gpt-4o-realtime-preview`, `gpt-4o-realtime-preview-2024-12-17`, `gpt-4o-realtime-preview-2025-06-03`, `gpt-4o-search-preview-2025-03-11`, `gpt-audio-mini-2025-10-06`, `gpt-realtime-mini-2025-10-06`, `groq/gemma-7b-it`, `groq/llama-3.1-8b-instant`, `groq/llama-3.3-70b-versatile`, `groq/meta-llama/llama-4-maverick-17b-128e-instruct`, `groq/meta-llama/llama-4-scout-17b-16e-instruct`, `groq/meta-llama/llama-guard-4-12b`, `groq/moonshotai/kimi-k2-instruct-0905`, `groq/playai-tts`, `groq/qwen/qwen3-32b`, `groq/qwen/qwen3.6-27b`, `hd/1024-x-1024/dall-e-3`, `hd/1024-x-1792/dall-e-3`, `hd/1792-x-1024/dall-e-3`, `mistral/codestral-2405`, `mistral/devstral-2512`, `mistral/devstral-medium-2507`, `mistral/devstral-small-2505`, `mistral/devstral-small-2507`, `mistral/labs-devstral-small-2512`, `mistral/magistral-medium-1-2-2509`, `mistral/magistral-medium-2506`, `mistral/magistral-medium-2509`, `mistral/magistral-small-1-2-2509`, `mistral/magistral-small-2506`, `mistral/mistral-large-2402`, `mistral/mistral-large-2407`, `mistral/mistral-large-2411`, `mistral/mistral-medium-2312`, `mistral/mistral-medium-2505`, `mistral/mistral-medium-2508`, `mistral/mistral-medium-3-1-2508`, `mistral/mistral-ocr-2505-completion`, `mistral/mistral-small-3-2-2506`, `mistral/open-codestral-mamba`, `mistral/open-mistral-7b`, `mistral/open-mistral-nemo-2407`, `mistral/open-mixtral-8x22b`, `mistral/open-mixtral-8x7b`, `mistral/pixtral-12b-2409`, `mistral/pixtral-large-2411`, `moonshot/kimi-k2-0711-preview`, `moonshot/kimi-k2-0905-preview`, `moonshot/kimi-k2-thinking`, `moonshot/kimi-k2-thinking-turbo`, `moonshot/kimi-k2-turbo-preview`, `moonshot/kimi-latest`, `moonshot/kimi-latest-128k`, `moonshot/kimi-latest-32k`, `moonshot/kimi-latest-8k`, `moonshot/kimi-thinking-preview`, `moonshot/moonshot-v1-128k-0430`, `moonshot/moonshot-v1-32k-0430`, `moonshot/moonshot-v1-8k-0430`, `o3-deep-research-2025-06-26`, `o4-mini-deep-research-2025-06-26`, `openrouter/anthropic/claude-opus-4`, `openrouter/deepseek/deepseek-v4-flash-0731:batch`, `openrouter/deepseek/deepseek-v4-flash-0731:free`, `openrouter/deepseek/deepseek-v4-flash-vision-exp:batch`, `openrouter/deepseek/deepseek-v4-pro-0813:batch`, `openrouter/google/gemini-2.0-flash-001`, `openrouter/kwaipilot/kat-coder-pro-v2`, `openrouter/meta/muse-glimmer-30b:batch`, `openrouter/minimax/minimax-m3:batch`, `openrouter/qwen/qwen3.5-9b:batch`, `openrouter/qwen/qwen3.8-2.4t-a95b:batch`, `openrouter/stealth/union-alpha`, `openrouter/thinkingmachines/inkling:batch`, `openrouter/z-ai/glm-5.2:batch`, `rerank-english-v2.0`, `rerank-multilingual-v2.0`, `sambanova/DeepSeek-R1-Distill-Llama-70B`, `sambanova/DeepSeek-V3-0324`, `sambanova/Llama-4-Scout-17B-16E-Instruct`, `sambanova/Meta-Llama-3.1-405B-Instruct`, `sambanova/Meta-Llama-3.1-8B-Instruct`, `sambanova/Meta-Llama-3.2-1B-Instruct`, `sambanova/Meta-Llama-3.2-3B-Instruct`, `sambanova/Meta-Llama-Guard-3-8B`, `sambanova/QwQ-32B`, `sambanova/Qwen2-Audio-7B-Instruct`, `sambanova/Qwen3-32B`, `scaleway/google/gemma-3-27b-it`, `scaleway/hcompany/holo2-30b-a3b`, `scaleway/mistralai/devstral-2-123b-instruct-2512`, `scaleway/mistralai/voxtral-small-24b-2507`, `standard/1024-x-1024/dall-e-3`, `standard/1024-x-1792/dall-e-3`, `standard/1792-x-1024/dall-e-3`, `text-moderation-007`, `text-moderation-latest`, `text-moderation-stable`, `together_ai/Qwen/Qwen3-235B-A22B-Instruct-2507-tput`, `together_ai/Qwen/Qwen3-235B-A22B-Thinking-2507`, `together_ai/Qwen/Qwen3-235B-A22B-fp8-tput`, `together_ai/deepseek-ai/DeepSeek-R1`, `together_ai/deepseek-ai/DeepSeek-R1-0528-tput`, `together_ai/deepseek-ai/DeepSeek-V4-Pro`, `together_ai/google/gemma-3n-E4B-it`, `together_ai/intfloat/multilingual-e5-large-instruct`, `together_ai/meta-llama/Llama-3.2-3B-Instruct-Turbo`, `together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo-Free`, `together_ai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`, `together_ai/meta-llama/Llama-Guard-4-12B`, `together_ai/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo`, `together_ai/moonshotai/Kimi-K2-Instruct-0905`, `together_ai/moonshotai/Kimi-K2.5`, `together_ai/pearl-ai/gemma-4-31b-it`, `together_ai/thinkingmachines/Inkling-Small`, `us-gov.anthropic.claude-3-haiku-20240307-v1:0`, `us.amazon.nova-premier-v1:0`, `us.anthropic.claude-3-haiku-20240307-v1:0`, `us.anthropic.claude-3-sonnet-20240229-v1:0`, `vercel_ai_gateway/google/gemini-2.0-flash`, `vercel_ai_gateway/google/gemini-2.0-flash-lite`, `vertex_ai/claude-3-7-sonnet@20250219`, `vertex_ai/claude-opus-4`, `vertex_ai/claude-opus-4-1`, `vertex_ai/claude-opus-4-1@20250805`, `vertex_ai/claude-opus-4@20250514`, `vertex_ai/claude-sonnet-4`, `vertex_ai/claude-sonnet-4@20250514`, `vertex_ai/gemini-3.1-flash-live-preview`, `vertex_ai/gemini-robotics-er-2`, `vertex_ai/imagegeneration@006`, `vertex_ai/imagen-3.0-capability-001`, `vertex_ai/imagen-3.0-fast-generate-001`, `vertex_ai/imagen-3.0-generate-001`, `vertex_ai/imagen-3.0-generate-002`, `vertex_ai/imagen-4.0-fast-generate-001`, `vertex_ai/imagen-4.0-generate-001`, `vertex_ai/imagen-4.0-ultra-generate-001`, `wandb/MiniMaxAI/MiniMax-M2.5`, `wandb/Qwen/Qwen3-235B-A22B-Instruct-2507`, `wandb/Qwen/Qwen3-235B-A22B-Thinking-2507`, `wandb/Qwen/Qwen3-Coder-480B-A35B-Instruct`, `wandb/deepseek-ai/DeepSeek-R1-0528`, `wandb/deepseek-ai/DeepSeek-V3-0324`, `wandb/meta-llama/Llama-4-Scout-17B-16E-Instruct`, `wandb/microsoft/Phi-4-mini-instruct`, `wandb/moonshotai/Kimi-K2-Instruct`, `wandb/zai-org/GLM-4.5`, `xai/grok-3`, `xai/grok-3-beta`, `xai/grok-3-fast-beta`, `xai/grok-3-fast-latest`, `xai/grok-3-latest`, `xai/grok-3-mini`, `xai/grok-3-mini-beta`, `xai/grok-3-mini-fast`, `xai/grok-3-mini-fast-beta`, `xai/grok-3-mini-fast-latest`, `xai/grok-3-mini-latest`, `xai/grok-4`, `xai/grok-4-0709`, `xai/grok-4-1-fast`, `xai/grok-4-1-fast-non-reasoning`, `xai/grok-4-1-fast-non-reasoning-latest`, `xai/grok-4-1-fast-reasoning`, `xai/grok-4-1-fast-reasoning-latest`, `xai/grok-4-fast-non-reasoning`, `xai/grok-4-fast-reasoning`, `xai/grok-4-latest`

</details>

### 新增提供者 {#new-providers}

- 新增 Nadir intelligent-router 提供者（nadir/auto）- [PR #33227](https://github.com/BerriAI/litellm/pull/33227)
- 在 chat、Responses、Messages、embeddings、audio、images 與 video 中新增 Eden AI 提供者 - [PR #41101](https://github.com/BerriAI/litellm/pull/41101)

### Amazon Bedrock {#amazon-bedrock}

- 移除 AWS 端點會拒絕的 body 參數 - [PR #31203](https://github.com/BerriAI/litellm/pull/31203)
- 在 converse reasoning models 上移除不支援的 sampling 參數 - [PR #39834](https://github.com/BerriAI/litellm/pull/39834)
- 在批次輸入與輸出資料設定中送出 s3BucketOwner - [PR #42262](https://github.com/BerriAI/litellm/pull/42262)
- 新增 us.moonshotai.kimi-k3 定價並補齊全域 Kimi K3 項目 - [PR #42271](https://github.com/BerriAI/litellm/pull/42271)
- 在 Claude platform messages 路徑上原樣轉送 anthropic-beta 標頭 - [PR #42275](https://github.com/BerriAI/litellm/pull/42275)
- 將批次 S3 憑證排除於 chat 請求與 debug 記錄之外 - [PR #42312](https://github.com/BerriAI/litellm/pull/42312)
- 使用 s3_access_key_id 和 s3_secret_access_key 為批次 S3 請求簽章 - [PR #42342](https://github.com/BerriAI/litellm/pull/42342)
- 新增裸露的 moonshotai.kimi-k3 成本對應項目 - [PR #42363](https://github.com/BerriAI/litellm/pull/42363)
- 在 bedrock/mantle 路由的 anthropic-beta 標頭中送出所有 Mantle beta - [PR #42376](https://github.com/BerriAI/litellm/pull/42376)
- 依據基礎模型列為 bedrock/mantle/&lt;model&gt; 部署定價 - [PR #42402](https://github.com/BerriAI/litellm/pull/42402)
- 將空白的 AWS_S3_\* 環境變數視為批次作業未設定 - [PR #42528](https://github.com/BerriAI/litellm/pull/42528)
- 新增 Claude Opus 5.5 定價與能力 - [PR #42588](https://github.com/BerriAI/litellm/pull/42588)
- 在 Claude Opus 4.7 與 4.8 Converse 上將 json_schema 作為強制工具送出 - [PR #42644](https://github.com/BerriAI/litellm/pull/42644)
- 在 Invoke 串流中遵守 stream_chunk_size - [PR #42686](https://github.com/BerriAI/litellm/pull/42686)
- 將未對應的 openai 系列模型 ID 路由至 converse - [PR #42713](https://github.com/BerriAI/litellm/pull/42713)
- 新增 gpt-6-sol 與 gpt-6-luna 模型定價 - [PR #42746](https://github.com/BerriAI/litellm/pull/42746)
- 在 bedrock-runtime 的原生 Responses API 上提供 OpenAI models（#38489 的內部複本） - [PR #42767](https://github.com/BerriAI/litellm/pull/42767)
- 新增裸露的 openai.gpt-6-sol 與 openai.gpt-6-luna 成本對應列 - [PR #42798](https://github.com/BerriAI/litellm/pull/42798)
- 新增來自提供者同步的 17 筆 aws-bedrock 成本對應列 - [PR #42852](https://github.com/BerriAI/litellm/pull/42852)
- 新增 gpt-5.4 與 gpt-5.5 的美國與全域 inference profile 定價 - [PR #42941](https://github.com/BerriAI/litellm/pull/42941)
- 為 gpt-5.4 與 gpt-5.5 推算全域 cris 定價 - [PR #42971](https://github.com/BerriAI/litellm/pull/42971)
- 以即時相同的方式對應 Anthropic 批次列參數 - [PR #43087](https://github.com/BerriAI/litellm/pull/43087)

### Anthropic {#anthropic}

- 在原生 /v1/messages 上原樣轉送 safeguards 與 anthropic-beta - [PR #42152](https://github.com/BerriAI/litellm/pull/42152)
- 在 /v1/messages 上將 Claude Code safeguards 與 dangerous-tool-use beta 轉送至 Bedrock Invoke 和 Vertex - [PR #42288](https://github.com/BerriAI/litellm/pull/42288)
- 對於仍使用 chat completions 的目標，讓 reasoning_effort 保持為字串 - [PR #42401](https://github.com/BerriAI/litellm/pull/42401)
- 當 content list 含有裸露字串時，回傳 400 而非 500 - [PR #42420](https://github.com/BerriAI/litellm/pull/42420)
- 新增 Claude Opus 5.5 - [PR #42489](https://github.com/BerriAI/litellm/pull/42489)
- 在 chat completions 中保留已重播前綴的位元組穩定性，以維持 preserved thinking - [PR #42630](https://github.com/BerriAI/litellm/pull/42630)
- 在非 Anthropic Messages 橋接中保留 MCP 工具回應 - [PR #42783](https://github.com/BerriAI/litellm/pull/42783)

### Azure {#azure}

- 將帶有 reasoning 的 gpt-5.4+ function tools 橋接至 Foundry Responses API - [PR #42041](https://github.com/BerriAI/litellm/pull/42041)
- 傳遞 asyncio.CancelledError，而不是拋出 500 - [PR #42295](https://github.com/BerriAI/litellm/pull/42295)
- 從 Azure model list 新增 gpt-audio 與 gpt-realtime 別名列 - [PR #42981](https://github.com/BerriAI/litellm/pull/42981)
- 依據 retirement schedule 更新 gpt-audio-mini 與 gpt-5-chat 的淘汰日期 - [PR #43017](https://github.com/BerriAI/litellm/pull/43017)

### Bedrock Mantle {#bedrock-mantle}

- 在 Mantle 的原生 Anthropic Messages API 上提供 Claude models 的 /v1/messages - [PR #42049](https://github.com/BerriAI/litellm/pull/42049)

### fal.ai {#falai}

- 透過 fal queue API 新增 Seedance 2.5 / 2.0 影片生成 - [PR #41980](https://github.com/BerriAI/litellm/pull/41980)
- 新增 gpt-image-2.5 flare/sunburst、flux/dev 與影像編輯 - [PR #42095](https://github.com/BerriAI/litellm/pull/42095)
- 依據 fal 回傳的尺寸為影像定價 - [PR #42282](https://github.com/BerriAI/litellm/pull/42282)
- 新增 MiniMax H3 文生影片與參考轉影片 - [PR #42286](https://github.com/BerriAI/litellm/pull/42286)
- 將 fal 錯誤顯示在影片狀態與內容中，而不是 completed 與 generic 500 - [PR #42306](https://github.com/BerriAI/litellm/pull/42306)
- 新增 flux-lora-depth 影像編輯與 moondream3 chat completions - [PR #42334](https://github.com/BerriAI/litellm/pull/42334)
- 依據最近的列為非標準影像尺寸定價，並遵守 dump 選項 - [PR #42336](https://github.com/BerriAI/litellm/pull/42336)
- 新增僅 queue 的 /fal_ai 透傳路由並附帶支出追蹤 - [PR #42360](https://github.com/BerriAI/litellm/pull/42360)
- 處理 minimax h3 影片的 seconds=auto 與過大尺寸 - [PR #42504](https://github.com/BerriAI/litellm/pull/42504)
- 將 /fal_ai queue gate 與定價器對齊並標準化 resolution 類型 - [PR #42505](https://github.com/BerriAI/litellm/pull/42505)
- 在影片結果探測時重用狀態用戶端與標頭 - [PR #42511](https://github.com/BerriAI/litellm/pull/42511)
- 在影像生成中遵守全域 api_base，並以 400 拒絕非字串 reasoning_effort - [PR #42512](https://github.com/BerriAI/litellm/pull/42512)
- 依解析度為 nano-banana-2 與 nano-banana-pro 影像生成定價 - [PR #43101](https://github.com/BerriAI/litellm/pull/43101)

### Fireworks AI {#fireworks-ai}

- 路由 firerouter 短名稱，並以路由後模型的費率計費透傳鏈路 - [PR #42814](https://github.com/BerriAI/litellm/pull/42814)

### Gemini and Vertex AI {#gemini-and-vertex-ai}

- 將 response schema 與 tool 參數透過 generateContent adapter 傳遞 - [PR #42067](https://github.com/BerriAI/litellm/pull/42067)
- 簡化 model version 檢查 - [PR #42465](https://github.com/BerriAI/litellm/pull/42465)
- 新增 gemini-3.8-flash-tts 與 gemini-3.8-flash-lite-tts 價格 - [PR #42752](https://github.com/BerriAI/litellm/pull/42752)
- 原生批次 JSONL 透傳並追蹤成本 - [PR #42810](https://github.com/BerriAI/litellm/pull/42810)
- 新增已淘汰的 claude 3 與 jamba 1.5 partner models 的淘汰日期 - [PR #42867](https://github.com/BerriAI/litellm/pull/42867)
- 新增 gemini-3.8-flash-cyber 定價 - [PR #42879](https://github.com/BerriAI/litellm/pull/42879)
- 在 Vertex 回報 outputInfo 之前，讓 batch output_file_id 保持為 null - [PR #43030](https://github.com/BerriAI/litellm/pull/43030)
- 透過 Responses-to-Chat 橋接將 /v1/responses 批次列轉換 - [PR #43042](https://github.com/BerriAI/litellm/pull/43042)
- 在 200 :predict 回應中顯示 Gemma 容器自身的錯誤 - [PR #43075](https://github.com/BerriAI/litellm/pull/43075)
- 停止在 Gemma 與 Llama 路由上宣傳僅限 OpenAI platform 的參數 - [PR #43079](https://github.com/BerriAI/litellm/pull/43079)
- 從 search_api vector store 命中項目回傳 chunk content、extractive text 與 structData - [PR #43100](https://github.com/BerriAI/litellm/pull/43100)

### GitHub Copilot and ChatGPT {#github-copilot-and-chatgpt}

- 在不執行登入流程的情況下，回應 github_copilot 與 chatgpt 的 get_api_base - [PR #42602](https://github.com/BerriAI/litellm/pull/42602)

### Ollama {#ollama}

- 無需 Pillow 即可傳送 PNG 與 JPEG 影像 - [PR #41979](https://github.com/BerriAI/litellm/pull/41979)
- 在非串流 completions 上讀取 JSON thinking 欄位 - [PR #42838](https://github.com/BerriAI/litellm/pull/42838)

### OpenAI {#openai}

- 透過 Responses 橋接轉送非 enum 的 reasoning_effort，而不是將其捨棄 - [PR #42452](https://github.com/BerriAI/litellm/pull/42452)
- 新增 GPT-6 Sol 與 GPT-6 Luna - [PR #42515](https://github.com/BerriAI/litellm/pull/42515)

### OpenRouter {#openrouter}

- 為 typesafe/jev-1.13 定價，並新增 openrouter decisions 透傳 - [PR #42301](https://github.com/BerriAI/litellm/pull/42301)
- 從成本對應表移除已淘汰的 stealth/union-alpha model - [PR #42386](https://github.com/BerriAI/litellm/pull/42386)

### Qianwen AI Platform {#qianwen-ai-platform}

- 將中國大陸品牌重新命名為 Qianwen AI Platform - [PR #42284](https://github.com/BerriAI/litellm/pull/42284)

### Together AI {#together-ai}

- 依據 Together 淘汰歷史回填 deprecation_date - [PR #43135](https://github.com/BerriAI/litellm/pull/43135)

### xAI {#xai}

- 在成本對應表新增 grok-4.7 - [PR #42264](https://github.com/BerriAI/litellm/pull/42264)
- 接受 max_completion_tokens 作為支援的參數 - [PR #42353](https://github.com/BerriAI/litellm/pull/42353)

### Xiaomi MiMo {#xiaomi-mimo}

- 新增具即時 e2e 覆蓋的 mimo-v2.6-pro 與 mimo-v2.6-flash 成本對應列 - [PR #42362](https://github.com/BerriAI/litellm/pull/42362)

### Model catalog and pricing {#model-catalog-and-pricing}

- **新與更新的型錄列**
    - 新增 MAI-Image-2.5-Pro 定價，修正 Fireworks/Together 項目，整合已驗證的開放登錄 PR，新增 Groq 淘汰與 Bedrock 區域性 Qwen3 Next 定價 - [PR #34941](https://github.com/BerriAI/litellm/pull/34941)
    - 新增 xai grok-4.20 別名與來自 /v1/language-models 的圖片 token 價格 - [PR #42384](https://github.com/BerriAI/litellm/pull/42384)
    - 為 Vertex AI 和 Azure AI 新增 Claude Opus 5.5 - [PR #42599](https://github.com/BerriAI/litellm/pull/42599)
    - 新增 openrouter/aion-labs/aion-3.5-mini 定價 - [PR #42743](https://github.com/BerriAI/litellm/pull/42743)
    - 新增 gpt-6-sol 與 gpt-6-luna 的 Azure Foundry 定價 - [PR #42747](https://github.com/BerriAI/litellm/pull/42747)
    - 新增 openrouter/stealth/space-bunny-alpha - [PR #42759](https://github.com/BerriAI/litellm/pull/42759)
    - 新增 baseten/zai-org/GLM-5.3-Fast 定價 - [PR #42764](https://github.com/BerriAI/litellm/pull/42764)
    - 新增 together_ai/together/Tev1-4B-experimental - [PR #42807](https://github.com/BerriAI/litellm/pull/42807)
    - 新增 gemini 預覽別名與 deep research 04-2026 列 - [PR #42833](https://github.com/BerriAI/litellm/pull/42833)
    - 依據模型文件新增 openai chat-latest、codex 與 deep-research 列 - [PR #42834](https://github.com/BerriAI/litellm/pull/42834)
    - 新增 vertex ai llama 3.3 70b、veo 2/3、virtual try-on 與 2.5 tts 列 - [PR #42837](https://github.com/BerriAI/litellm/pull/42837)
    - 從 OpenRouter models API 新增 openrouter/openai/gpt-oss-120b:batch - [PR #42847](https://github.com/BerriAI/litellm/pull/42847)
    - 新增繼承自 lyria-3.5 的 gemini lyria-realtime-exp 列 - [PR #42848](https://github.com/BerriAI/litellm/pull/42848)
    - 新增 39 個依 Together models API 定價的 together_ai chat 列 - [PR #42851](https://github.com/BerriAI/litellm/pull/42851)
    - 新增已退役的 azure gpt-5 chat 與 o1-preview data zone 列 - [PR #42878](https://github.com/BerriAI/litellm/pull/42878)
    - 新增 vertex_ai/gemini-3.8-live - [PR #42891](https://github.com/BerriAI/litellm/pull/42891)
    - 新增 wandb DeepSeek-V4.1-Flash 與 gemma-4-26B-A4B-it - [PR #42924](https://github.com/BerriAI/litellm/pull/42924)
    - 新增 azure realtime、audio 與 partner model 列 - [PR #42954](https://github.com/BerriAI/litellm/pull/42954)
    - 同步 azure models，新增 MAI-Image-2.6、deepseek-v4.1-flash、muse-spark-1.3 - [PR #42970](https://github.com/BerriAI/litellm/pull/42970)
    - 對 azure/eu/gpt-6-astra 新增 supports_reasoning - [PR #42989](https://github.com/BerriAI/litellm/pull/42989)
    - 新增 fireworks glm-5p3 僅限美國的列與 kimi-k3-us 優先價格 - [PR #43092](https://github.com/BerriAI/litellm/pull/43092)
    - 新增 fireworks deepseek-v4p1-flash 僅限美國的列 - [PR #43097](https://github.com/BerriAI/litellm/pull/43097)
- **價格修正**
    - 登錄稽核 2026-09-22，整合開放定價 PR - [PR #42543](https://github.com/BerriAI/litellm/pull/42543)
    - 移除 Gemini Live 預覽項目中的未發布快取費率 - [PR #42651](https://github.com/BerriAI/litellm/pull/42651)
    - 將 bedrock_mantle/openai.gpt-daybreak-blue-5.6-sol 與其 Bedrock model card 對齊 - [PR #42672](https://github.com/BerriAI/litellm/pull/42672)
    - 將區域性 Bedrock Mistral Large 24.02 金鑰與 AWS 定價頁面對齊 - [PR #42684](https://github.com/BerriAI/litellm/pull/42684)
    - 登錄稽核 2026-09-23，區域內 Bedrock Claude 價格 - [PR #42779](https://github.com/BerriAI/litellm/pull/42779)
    - 從 models API 同步 openrouter 價格 - [PR #42832](https://github.com/BerriAI/litellm/pull/42832)
    - 以 Global SKU 為 Bedrock 裸露 Claude ids 定價（aws-bedrock sync）- [PR #42875](https://github.com/BerriAI/litellm/pull/42875)
    - 更正 gemini robotics er 2 preview 音訊輸入價格 - [PR #42877](https://github.com/BerriAI/litellm/pull/42877)
    - 將 openrouter deepseek-v4-flash-0731 輸出價格減半 - [PR #42881](https://github.com/BerriAI/litellm/pull/42881)
    - 將 fireworks kimi k3 us 定價更正為已發布費率 - [PR #42884](https://github.com/BerriAI/litellm/pull/42884)
    - 同步 openrouter 價格並新增 fireworks ember-1 - [PR #42889](https://github.com/BerriAI/litellm/pull/42889)
    - bedrock mantle gpt-5.4 與 gpt-5.5 的來源與 chat completions 端點 - [PR #42890](https://github.com/BerriAI/litellm/pull/42890)
    - bedrock mantle gpt-5.6 luna、sol、terra 與 grok-4.6 的來源 - [PR #42898](https://github.com/BerriAI/litellm/pull/42898)
    - 更新 openrouter kimi-k2.7-code 輸入價格 - [PR #42932](https://github.com/BerriAI/litellm/pull/42932)
    - 同步 vertex-ai 列（gemma 4 maas 快取價格、chirp_2）- [PR #42942](https://github.com/BerriAI/litellm/pull/42942)
    - 退役日期、chatgpt reasoning 旗標、bing 定價、bedrock mantle 與 mythos、azure gpt-5.6 別名、anthropic 批次費率、新的 nebius、openrouter 與 xai 列 - [PR #42951](https://github.com/BerriAI/litellm/pull/42951)
    - 同步 deepseek v4 與 glm-5.3 的 openrouter 價格 - [PR #42952](https://github.com/BerriAI/litellm/pull/42952)
    - 為 vertex gemini-3.8-flash-cyber 新增批次價格 - [PR #42953](https://github.com/BerriAI/litellm/pull/42953)
    - 同步 openrouter deepseek-v4-pro 價格 - [PR #42956](https://github.com/BerriAI/litellm/pull/42956)
    - 同步 openrouter deepseek-v4-pro 價格 - [PR #42964](https://github.com/BerriAI/litellm/pull/42964)
    - 同步 openrouter deepseek-v4-pro 價格 - [PR #42969](https://github.com/BerriAI/litellm/pull/42969)
    - 同步 openrouter deepseek v4 flash、v4 pro 與 v4.1 flash 價格 - [PR #42974](https://github.com/BerriAI/litellm/pull/42974)
    - 同步 openrouter deepseek-v4-pro 價格 - [PR #42978](https://github.com/BerriAI/litellm/pull/42978)
    - 為 gemini flash 列新增 vertex ai 優先音訊輸入價格 - [PR #42980](https://github.com/BerriAI/litellm/pull/42980)
    - 將 openrouter deepseek-v4-pro 的快取命中價格與 cache read 對齊 - [PR #42985](https://github.com/BerriAI/litellm/pull/42985)
    - 移除 openrouter deepseek-v4-pro 中過時的 cache_hit 欄位 - [PR #42994](https://github.com/BerriAI/litellm/pull/42994)
    - 為 gemini image 預覽列新增 vertex cache read、batch 與 200k 以上價格 - [PR #42995](https://github.com/BerriAI/litellm/pull/42995)
    - 為 vertex gemini-omni-1.1-flash 新增影片與 reasoning 輸出價格 - [PR #43036](https://github.com/BerriAI/litellm/pull/43036)
    - 移除 vertex gemini-2.5-flash-image 的優先輸入價格 - [PR #43050](https://github.com/BerriAI/litellm/pull/43050)
    - 為 gemini-3-pro-image-preview 新增 vertex 優先價格，並為 gemini-embedding-001 新增批次價格 - [PR #43069](https://github.com/BerriAI/litellm/pull/43069)
    - 為 gemini 3.8 live 列新增影片輸入價格 - [PR #43073](https://github.com/BerriAI/litellm/pull/43073)
    - 移除 vertex gemini-2.5-flash-image 的 cache read 價格 - [PR #43078](https://github.com/BerriAI/litellm/pull/43078)
    - 同步 openrouter deepseek v4 與 glm-5.3-flash 價格，新增 mistral-large-2512 - [PR #43090](https://github.com/BerriAI/litellm/pull/43090)
    - 從 Gemini API pricing page 同步 gemini 優先、flex 與影片 token 價格 - [PR #43091](https://github.com/BerriAI/litellm/pull/43091)
    - 從 Gemini API pricing page 新增 gemini tts 批次輸出價格 - [PR #43103](https://github.com/BerriAI/litellm/pull/43103)
    - 從定價頁面新增 openai 快取圖片輸入價格 - [PR #43143](https://github.com/BerriAI/litellm/pull/43143)
- **淘汰與退役日期**
    - 新增 azure_ai gpt-image-2 與 groq llama-guard-3-8b 淘汰日期 - [PR #42738](https://github.com/BerriAI/litellm/pull/42738)
    - 依據 Anthropic deprecations page 為 claude-mythos-preview 新增 deprecation_date - [PR #42845](https://github.com/BerriAI/litellm/pull/42845)
    - 將 sora-2-pro 停用日期新增至 sora-2-pro-high-res 列 - [PR #42846](https://github.com/BerriAI/litellm/pull/42846)
    - 新增 fireworks 對 kimi k2.6 fast、kimi k2.7 code fast 與 glm 5.2 fast us 的淘汰日期 - [PR #42849](https://github.com/BerriAI/litellm/pull/42849)
    - 將 2026 年 6 月 1 日退役日期新增至 vertex_ai gemini-2.0-flash 列 - [PR #42850](https://github.com/BerriAI/litellm/pull/42850)
    - 新增 fireworks 對 glm 5.2 fast serverless 列的淘汰日期 - [PR #42866](https://github.com/BerriAI/litellm/pull/42866)
    - 為 gpt-5-chat-latest 與 gpt-5-chat 新增 openai 淘汰日期 - [PR #42872](https://github.com/BerriAI/litellm/pull/42872)
    - 新增 azure gpt-4o-mini-transcribe 與 gpt-4o-mini-tts 淘汰日期 - [PR #42873](https://github.com/BerriAI/litellm/pull/42873)
    - 新增 fireworks 對 glm 5.2、kimi k2.6、kimi k2.7 code、deepseek v4 與 muse glimmer 列的 2026-09-25 淘汰日期 - [PR #42874](https://github.com/BerriAI/litellm/pull/42874)
    - 從 Vertex model lifecycle pages 同步 vertex-ai 淘汰日期 - [PR #42882](https://github.com/BerriAI/litellm/pull/42882)
    - 新增 azure gpt-realtime-mini 淘汰日期 - [PR #42883](https://github.com/BerriAI/litellm/pull/42883)
    - 新增 azure gpt-realtime-mini-2025-10-06 淘汰日期 - [PR #42885](https://github.com/BerriAI/litellm/pull/42885)
    - 新增 azure 對 gpt-6 與 gpt-realtime-whisper 的淘汰日期 - [PR #42897](https://github.com/BerriAI/litellm/pull/42897)
    - 新增 azure 對區域性 gpt-6 列的淘汰日期 - [PR #42933](https://github.com/BerriAI/litellm/pull/42933)
    - 更新 azure gpt-4.1-nano 與 gpt-4o-2024-05-13 退役日期 - [PR #42947](https://github.com/BerriAI/litellm/pull/42947)
    - 以較晚的 azure 淘汰日期套用於 gpt-4.1-nano、gpt-4o-transcribe 與 gpt-realtime-2.1 - [PR #42986](https://github.com/BerriAI/litellm/pull/42986)
    - 將 Vertex 停用日期新增至 gemini-2.5-flash-native-audio - [PR #43024](https://github.com/BerriAI/litellm/pull/43024)
    - 從 Models API 為五個 realtime 與 transcribe 列新增 azure 淘汰日期 - [PR #43037](https://github.com/BerriAI/litellm/pull/43037)
    - 將 azure gpt-realtime-2.1-mini 淘汰日期移至較晚的 Models API 日期 - [PR #43058](https://github.com/BerriAI/litellm/pull/43058)

- 從 deprecations 頁面新增 openai 淘汰日期 - [PR #43102](https://github.com/BerriAI/litellm/pull/43102)
    - 從 retired Foundry models 頁面新增 azure 退役日期 - [PR #43104](https://github.com/BerriAI/litellm/pull/43104)
    - 從 openai deprecations 頁面新增 computer-use-preview 淘汰日期 - [PR #43116](https://github.com/BerriAI/litellm/pull/43116)
    - 為 command-r-plus 和 gpt-4 新增 azure 退役日期 - [PR #43117](https://github.com/BerriAI/litellm/pull/43117)
    - 為 gpt-oss-20b 和 gemma-4-31B-it 新增 together-ai 淘汰日期 - [PR #43127](https://github.com/BerriAI/litellm/pull/43127)
- **移除與清理**
    - 移除已超過淘汰日期的模型 - [PR #42435](https://github.com/BerriAI/litellm/pull/42435)
    - 移除由提供者同步標記為已退役的模型 - [PR #42521](https://github.com/BerriAI/litellm/pull/42521)
    - 從價格映射中移除重複的 cache_read_input_token_cost_batches 鍵 - [PR #42623](https://github.com/BerriAI/litellm/pull/42623)
- **自動化提供者價格同步**（78 個 PR：OpenRouter 51、AWS Bedrock 11、OpenAI 3、Baseten 3、Vertex AI 3、Azure 2、Google Gemini 2、Together AI 1、Fireworks AI 1、xAI 1）
    - [PR #42077](https://github.com/BerriAI/litellm/pull/42077), [PR #42082](https://github.com/BerriAI/litellm/pull/42082), [PR #42089](https://github.com/BerriAI/litellm/pull/42089), [PR #42092](https://github.com/BerriAI/litellm/pull/42092), [PR #42096](https://github.com/BerriAI/litellm/pull/42096), [PR #42154](https://github.com/BerriAI/litellm/pull/42154), [PR #42155](https://github.com/BerriAI/litellm/pull/42155), [PR #42157](https://github.com/BerriAI/litellm/pull/42157), [PR #42162](https://github.com/BerriAI/litellm/pull/42162), [PR #42163](https://github.com/BerriAI/litellm/pull/42163), [PR #42164](https://github.com/BerriAI/litellm/pull/42164), [PR #42166](https://github.com/BerriAI/litellm/pull/42166), [PR #42168](https://github.com/BerriAI/litellm/pull/42168), [PR #42169](https://github.com/BerriAI/litellm/pull/42169), [PR #42175](https://github.com/BerriAI/litellm/pull/42175), [PR #42178](https://github.com/BerriAI/litellm/pull/42178), [PR #42179](https://github.com/BerriAI/litellm/pull/42179), [PR #42182](https://github.com/BerriAI/litellm/pull/42182), [PR #42184](https://github.com/BerriAI/litellm/pull/42184), [PR #42187](https://github.com/BerriAI/litellm/pull/42187), [PR #42192](https://github.com/BerriAI/litellm/pull/42192), [PR #42227](https://github.com/BerriAI/litellm/pull/42227), [PR #42234](https://github.com/BerriAI/litellm/pull/42234), [PR #42240](https://github.com/BerriAI/litellm/pull/42240), [PR #42243](https://github.com/BerriAI/litellm/pull/42243), [PR #42246](https://github.com/BerriAI/litellm/pull/42246), [PR #42249](https://github.com/BerriAI/litellm/pull/42249), [PR #42250](https://github.com/BerriAI/litellm/pull/42250), [PR #42251](https://github.com/BerriAI/litellm/pull/42251), [PR #42253](https://github.com/BerriAI/litellm/pull/42253), [PR #42254](https://github.com/BerriAI/litellm/pull/42254), [PR #42258](https://github.com/BerriAI/litellm/pull/42258), [PR #42261](https://github.com/BerriAI/litellm/pull/42261), [PR #42265](https://github.com/BerriAI/litellm/pull/42265), [PR #42269](https://github.com/BerriAI/litellm/pull/42269), [PR #42270](https://github.com/BerriAI/litellm/pull/42270), [PR #42279](https://github.com/BerriAI/litellm/pull/42279), [PR #42280](https://github.com/BerriAI/litellm/pull/42280), [PR #42289](https://github.com/BerriAI/litellm/pull/42289), [PR #42290](https://github.com/BerriAI/litellm/pull/42290), [PR #42297](https://github.com/BerriAI/litellm/pull/42297), [PR #42298](https://github.com/BerriAI/litellm/pull/42298), [PR #42305](https://github.com/BerriAI/litellm/pull/42305), [PR #42320](https://github.com/BerriAI/litellm/pull/42320), [PR #42333](https://github.com/BerriAI/litellm/pull/42333), [PR #42337](https://github.com/BerriAI/litellm/pull/42337), [PR #42338](https://github.com/BerriAI/litellm/pull/42338), [PR #42349](https://github.com/BerriAI/litellm/pull/42349), [PR #42357](https://github.com/BerriAI/litellm/pull/42357), [PR #42365](https://github.com/BerriAI/litellm/pull/42365), [PR #42371](https://github.com/BerriAI/litellm/pull/42371), [PR #42377](https://github.com/BerriAI/litellm/pull/42377), [PR #42381](https://github.com/BerriAI/litellm/pull/42381), [PR #42407](https://github.com/BerriAI/litellm/pull/42407), [PR #42418](https://github.com/BerriAI/litellm/pull/42418), [PR #42438](https://github.com/BerriAI/litellm/pull/42438), [PR #42485](https://github.com/BerriAI/litellm/pull/42485), [PR #42500](https://github.com/BerriAI/litellm/pull/42500), [PR #42501](https://github.com/BerriAI/litellm/pull/42501), [PR #42502](https://github.com/BerriAI/litellm/pull/42502), [PR #42557](https://github.com/BerriAI/litellm/pull/42557), [PR #42558](https://github.com/BerriAI/litellm/pull/42558), [PR #42577](https://github.com/BerriAI/litellm/pull/42577), [PR #42578](https://github.com/BerriAI/litellm/pull/42578), [PR #42589](https://github.com/BerriAI/litellm/pull/42589), [PR #42590](https://github.com/BerriAI/litellm/pull/42590), [PR #42591](https://github.com/BerriAI/litellm/pull/42591), [PR #42592](https://github.com/BerriAI/litellm/pull/42592), [PR #42632](https://github.com/BerriAI/litellm/pull/42632), [PR #42642](https://github.com/BerriAI/litellm/pull/42642), [PR #42648](https://github.com/BerriAI/litellm/pull/42648), [PR #42673](https://github.com/BerriAI/litellm/pull/42673), [PR #42677](https://github.com/BerriAI/litellm/pull/42677), [PR #42680](https://github.com/BerriAI/litellm/pull/42680), [PR #42685](https://github.com/BerriAI/litellm/pull/42685), [PR #42756](https://github.com/BerriAI/litellm/pull/42756), [PR #42771](https://github.com/BerriAI/litellm/pull/42771), [PR #42806](https://github.com/BerriAI/litellm/pull/42806)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 在 MCP 自動執行回合中串流單一生命週期 - [PR #40121](https://github.com/BerriAI/litellm/pull/40121)
- 停止 agentic 後續追蹤將請求參數傳遞兩次 - [PR #41560](https://github.com/BerriAI/litellm/pull/41560)
- 在 guardrail 回寫時就地修補 custom_tool_call_output - [PR #41561](https://github.com/BerriAI/litellm/pull/41561)
- 在 chat completion 橋接層中傳遞 safety_identifier - [PR #42193](https://github.com/BerriAI/litellm/pull/42193)
- 在單一位置建立後續 kwargs，避免任何執行器重複請求參數 - [PR #42307](https://github.com/BerriAI/litellm/pull/42307)
- 移除 client_metadata，並為 Databricks 僅聊天模型合併系統訊息 - [PR #42390](https://github.com/BerriAI/litellm/pull/42390)

### Agents and Agent-to-Agent {#agents-and-agent-to-agent}

- 將存取群組附加到 agents，並對模型、MCP servers 和 agent 呼叫強制套用 - [PR #41634](https://github.com/BerriAI/litellm/pull/41634)
- 為 Bedrock AgentCore 串流請求傳送 message/stream - [PR #42239](https://github.com/BerriAI/litellm/pull/42239)
- 新增可選的每個 agent kill switch webhook - [PR #42841](https://github.com/BerriAI/litellm/pull/42841)

### OCR {#ocr}

- 移除 Python OCR 執行路徑，並要求使用 Rust 路由 - [PR #43081](https://github.com/BerriAI/litellm/pull/43081)

### Realtime and Audio {#realtime-and-audio}

- 將上游握手拒絕呈現為錯誤事件與 policy close - [PR #42388](https://github.com/BerriAI/litellm/pull/42388)

### Vector Stores and Search {#vector-stores-and-search}

- 保留在設定中定義的 vector stores 列表，並維持唯讀 - [PR #42574](https://github.com/BerriAI/litellm/pull/42574)

### Pass-through endpoints {#pass-through-endpoints}

- 新增具每步計費的 TinyFish Agent API passthrough - [PR #41099](https://github.com/BerriAI/litellm/pull/41099)
- 記錄上游 4xx/5xx 錯誤本文，並將其帶入 failure hook - [PR #42695](https://github.com/BerriAI/litellm/pull/42695)

### 一般 {#general}

- 停止 /utils/transform_request 呼叫提供者並阻塞事件迴圈 - [PR #33954](https://github.com/BerriAI/litellm/pull/33954)
- 在未對應的內部錯誤中預先填入 GitHub issue 連結 - [PR #42065](https://github.com/BerriAI/litellm/pull/42065)
- 在串流用量中保留明確的 provider prompt_tokens=0 或 completion_tokens=0 - [PR #42323](https://github.com/BerriAI/litellm/pull/42323)
- 讓稍後的用量事件將過時的快取計數歸零（#40736）- [PR #42330](https://github.com/BerriAI/litellm/pull/42330)
- 在 JSON 錯誤本文中可選擇加入 litellm_call_id - [PR #42391](https://github.com/BerriAI/litellm/pull/42391)
- 在錯誤報告連結中新增 stream 和 safe config 旗標 - [PR #42428](https://github.com/BerriAI/litellm/pull/42428)
- 阻止巢狀 additional_drop_params 項目導致 openai-compatible 呼叫當機 - [PR #42492](https://github.com/BerriAI/litellm/pull/42492)
- 將 blocked-address 修復指向 litellm_settings - [PR #42508](https://github.com/BerriAI/litellm/pull/42508)
- 隔離 async_post_call_success_deployment_hook 中的回呼錯誤 - [PR #42535](https://github.com/BerriAI/litellm/pull/42535)
- 修復 CircleCI 在 main 上捕捉到的七項回歸 - [PR #42640](https://github.com/BerriAI/litellm/pull/42640)
- 停止 stream_chunk_size 傳入 provider request bodies - [PR #42664](https://github.com/BerriAI/litellm/pull/42664)

## 管理端點 / UI {#management-endpoints--ui}

### Admin UI {#admin-ui}

- 在沒有自身預算的金鑰上顯示擁有者的使用者預算 - [PR #38220](https://github.com/BerriAI/litellm/pull/38220)
- 新增含最新發行變更記錄統計資料的升級橫幅 - [PR #40429](https://github.com/BerriAI/litellm/pull/40429)
- 讓 Create Key 使用者選擇器可依 user_id 搜尋使用者，而不僅是 email - [PR #41687](https://github.com/BerriAI/litellm/pull/41687)
- 新增內部使用者節省金額與 auto-router 使用量 - [PR #42026](https://github.com/BerriAI/litellm/pull/42026)
- 顯示 prompt caching 請求與淨節省金額 - [PR #42055](https://github.com/BerriAI/litellm/pull/42055)
- 顯示 Capability 與 FUSE v2 路由預測 - [PR #42057](https://github.com/BerriAI/litellm/pull/42057)
- 讓剩餘複雜度 router 進階設定可見 - [PR #42293](https://github.com/BerriAI/litellm/pull/42293)
- 在團隊使用量匯出中新增每位使用者的明細 - [PR #42367](https://github.com/BerriAI/litellm/pull/42367)
- 將提醒標記重新命名為 Ignore Custom Tags - [PR #42370](https://github.com/BerriAI/litellm/pull/42370)
- 新增原生 LiteAdmin 助理 - [PR #42443](https://github.com/BerriAI/litellm/pull/42443)
- 在請求記錄中新增 span 類型篩選器 - [PR #42491](https://github.com/BerriAI/litellm/pull/42491)
- 簡化 auto-router 設定並釐清功能限制 - [PR #42625](https://github.com/BerriAI/litellm/pull/42625)
- 每頁顯示十筆 prompt caching 請求 - [PR #42638](https://github.com/BerriAI/litellm/pull/42638)
- 在 auto-router 預設中優先使用原生提供者 - [PR #42639](https://github.com/BerriAI/litellm/pull/42639)
- 讓每位使用者的 MCP 憑證在設定後仍可更新與清除 - [PR #42652](https://github.com/BerriAI/litellm/pull/42652)
- 儲存時保留未變動的已儲存 auto-router 布林值與提醒標記大小寫 - [PR #42703](https://github.com/BerriAI/litellm/pull/42703)
- 在 Playground 中隱藏 LiteAdmin，並新增管理員偏好設定 - [PR #42755](https://github.com/BerriAI/litellm/pull/42755)
- 將稽核記錄詳細資訊抽屜加寬且可調整大小 - [PR #42808](https://github.com/BerriAI/litellm/pull/42808)
- 當團隊預設變更時，提供重設自訂成員預算的功能 - [PR #42835](https://github.com/BerriAI/litellm/pull/42835)
- 設定 prompt caching 請求每頁列數 - [PR #42842](https://github.com/BerriAI/litellm/pull/42842)
- 說明未回填金鑰的生命週期支出並提供回填腳本 - [PR #42967](https://github.com/BerriAI/litellm/pull/42967)
- 停止跟隨串流中的 token，新增跳至底部按鈕 - [PR #42968](https://github.com/BerriAI/litellm/pull/42968)
- 在 models 頁面的團隊深入檢視中替代理員傳遞 is_proxy_admin - [PR #43003](https://github.com/BerriAI/litellm/pull/43003)
- 依模型群組分組成本最佳化快取外洩 - [PR #43008](https://github.com/BerriAI/litellm/pull/43008)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 在金鑰更新時使已快取的物件權限失效 - [PR #36719](https://github.com/BerriAI/litellm/pull/36719)
- 接受 token_id 作為明文金鑰的替代方案 - [PR #39578](https://github.com/BerriAI/litellm/pull/39578)
- 驗證金鑰 MCP 授權時，將團隊統一存取群組的 MCP 伺服器納入計數 - [PR #41231](https://github.com/BerriAI/litellm/pull/41231)
- 將使用者自身預算作為 UI 工作階段個人金鑰的上限 - [PR #41588](https://github.com/BerriAI/litellm/pull/41588)
- 顯示成員是否遵循團隊預設預算，並允許重設為該預算 - [PR #41906](https://github.com/BerriAI/litellm/pull/41906)
- 若 master key 未設定、為空，或已公開為已知，則拒絕啟動 - [PR #42019](https://github.com/BerriAI/litellm/pull/42019)
- 當團隊成員查詢遇到資料庫中斷時，採取失敗封閉 - [PR #42036](https://github.com/BerriAI/litellm/pull/42036)
- 拒絕已停用的 JWT 使用者並重新整理快取狀態 - [PR #42064](https://github.com/BerriAI/litellm/pull/42064)
- 已遭入侵密碼偵測、自助式變更密碼與強制重設密碼 - [PR #42278](https://github.com/BerriAI/litellm/pull/42278)
- 當 SCIM 或 /user/delete 移除使用者時，清除已快取的使用者資料列 - [PR #42315](https://github.com/BerriAI/litellm/pull/42315)
- 當 JWT 單團隊備援或精簡編輯器成員讀取遇到資料庫中斷時，採取失敗封閉 - [PR #42344](https://github.com/BerriAI/litellm/pull/42344)
- 讓 jwt team_allowed_routes 路徑授予 auth=true 轉遞 - [PR #42346](https://github.com/BerriAI/litellm/pull/42346)
- 將使用者讀取中的資料庫中斷以 503 no_db_connection 顯示 - [PR #42399](https://github.com/BerriAI/litellm/pull/42399)
- 當呼叫者的使用者讀取遇到資料庫中斷時，在管理路由上回應 503 no_db_connection - [PR #42410](https://github.com/BerriAI/litellm/pull/42410)
- 強制套用 general_settings 中的 disable_custom_api_keys - [PR #42437](https://github.com/BerriAI/litellm/pull/42437)
- 為級聯與別名金鑰刪除寫入已刪除金鑰稽核記錄 - [PR #42446](https://github.com/BerriAI/litellm/pull/42446)
- 在登出與變更密碼時撤銷 UI 工作階段 token - [PR #42463](https://github.com/BerriAI/litellm/pull/42463)
- 為金鑰建立、更新與重新產生提供可設定的 key_alias_pattern - [PR #42553](https://github.com/BerriAI/litellm/pull/42553)
- 啟用後讓團隊管理員可更新成員金鑰預算 - [PR #42555](https://github.com/BerriAI/litellm/pull/42555)
- 以與團隊別名相同的方式授權金鑰模型別名 - [PR #43049](https://github.com/BerriAI/litellm/pull/43049)

### Proxy 設定 {#proxy-configuration}

- 當設定讀取未回傳 model_list 時，保留以設定定義的部署 - [PR #41505](https://github.com/BerriAI/litellm/pull/41505)
- 讀取時回報警示、UI 與 router 設定的來源 - [PR #41788](https://github.com/BerriAI/litellm/pull/41788)
- 移除模型儲存時回傳的 cost-map 中繼資料 - [PR #41944](https://github.com/BerriAI/litellm/pull/41944)
- 從 SDK、proxy CLI 與設定中移除失效的 telemetry 標記 - [PR #42071](https://github.com/BerriAI/litellm/pull/42071)
- 新增 GET /utils/model_info 以查找未註冊模型的 cost map 資訊 - [PR #42121](https://github.com/BerriAI/litellm/pull/42121)
- 當 model editor 選取 None 時，解除已儲存的憑證連結 - [PR #42291](https://github.com/BerriAI/litellm/pull/42291)
- 只限管理員的 /debug/report，共用錯誤回報環境 - [PR #42440](https://github.com/BerriAI/litellm/pull/42440)
- 絕不在錯誤回報中渲染含憑證的設定鍵 - [PR #42493](https://github.com/BerriAI/litellm/pull/42493)
- 讓 lazy OpenAPI snapshot 在每個 Python 版本上都完全相同 - [PR #42519](https://github.com/BerriAI/litellm/pull/42519)
- 只有在模型憑證名稱變更時才驗證它 - [PR #42701](https://github.com/BerriAI/litellm/pull/42701)
- 在 OpenAPI 中為 Responses API 文件化請求主體與回應 schema - [PR #42802](https://github.com/BerriAI/litellm/pull/42802)
- 在模型清單端點上遵循 model_info.discoverable - [PR #42825](https://github.com/BerriAI/litellm/pull/42825)
- 在 GET /v1/models 中列出金鑰與團隊模型別名 - [PR #42908](https://github.com/BerriAI/litellm/pull/42908)
- 讓回呼可依呼叫者篩選模型清單路由 - [PR #43027](https://github.com/BerriAI/litellm/pull/43027)

### CLI 與 coding agents {#cli-and-coding-agents}

- 新增 --validate_config 乾跑標記 - [PR #41705](https://github.com/BerriAI/litellm/pull/41705)
- 在設定期間保留較新的已安裝狀態行 - [PR #42356](https://github.com/BerriAI/litellm/pull/42356)
- 以 script 風格啟動時只匯入一次 proxy_server - [PR #42584](https://github.com/BerriAI/litellm/pull/42584)

### 部署 {#deployment}

- 當停用 HPA 時，在元件化部署上渲染固定的 replicaCount - [PR #42207](https://github.com/BerriAI/litellm/pull/42207)
- 新增一個從產品儲存庫提供的快速入門 compose 檔案 - [PR #42326](https://github.com/BerriAI/litellm/pull/42326)
- 在 gateway allowlist 上公開 /api/event_logging/batch - [PR #42572](https://github.com/BerriAI/litellm/pull/42572)
- 將 wolfi-base digest 升級以取得 glibc 2.44-r6 - [PR #42643](https://github.com/BerriAI/litellm/pull/42643)

### Terraform {#terraform}

- 在 litellm_key 上公開 server_metadata，以便可看見未宣告的中繼資料 - [PR #42453](https://github.com/BerriAI/litellm/pull/42453)
- 為 litellm_model resource 與模型資料來源新增 display_name - [PR #42987](https://github.com/BerriAI/litellm/pull/42987)

## AI 整合 {#ai-integrations}

### 防護欄 {#guardrails}

- 在 n&gt;1 串流上分開掃描每個 choice 的 tool-call 引數，並記錄重寫被捨棄的原因 - [PR #40986](https://github.com/BerriAI/litellm/pull/40986)
- Straiker 防護欄支援 v3 平台 API (/api/v3/detect) - [PR #41880](https://github.com/BerriAI/litellm/pull/41880)
- 新增預設備援政策附件 - [PR #42119](https://github.com/BerriAI/litellm/pull/42119)
- 選用啟用 include_guardrail_response 時，會在回應中傳回 guardrail_information - [PR #42327](https://github.com/BerriAI/litellm/pull/42327)
- 在串流 /v1/messages 輸出中遮罩 PII - [PR #42351](https://github.com/BerriAI/litellm/pull/42351)
- 在 /v1/videos 上執行附加於金鑰的防護欄 - [PR #42354](https://github.com/BerriAI/litellm/pull/42354)
- 當 Presidio 遮罩回應時，將遮罩後的輸出儲存在支出記錄中 - [PR #42441](https://github.com/BerriAI/litellm/pull/42441)
- 當子政策條件未命中時，保留繼承的父層防護欄 - [PR #42548](https://github.com/BerriAI/litellm/pull/42548)
- 將 keys 與 teams 上的 disable_global_guardrails 限制給 proxy 管理員 - [PR #42699](https://github.com/BerriAI/litellm/pull/42699)
- 將非 Anthropic 原始 SSE 以未緩衝方式透過 post_call hook 串流傳遞 - [PR #42777](https://github.com/BerriAI/litellm/pull/42777)
- 在 cache 命中時的 post_call 防護欄拒絕上保留部署標籤 - [PR #42780](https://github.com/BerriAI/litellm/pull/42780)
- 當第一個上游讀取為 keepalive、無資料的 ping，或分割的 utf8 字元時，遮罩串流 /v1/messages 輸出 - [PR #43023](https://github.com/BerriAI/litellm/pull/43023)

### 記錄與可觀測性 {#logging-and-observability}

- 將 sdk callback 遷移至 langfuse v4。Docker 映像現在隨附 `langfuse>=4.7,<5`。如果您自行安裝 SDK，請從 `langfuse` 2.x 或 3.x 升級，logger 現在會在啟動時拒絕這些版本。traces 會透過 Langfuse 的 OpenTelemetry (OTLP) 擷取，因此自架的 Langfuse 伺服器必須接受 OTLP，而 trace ids 與 span 巢狀結構也與 v2 整合不同 - [PR #36741](https://github.com/BerriAI/litellm/pull/36741)
- 將產生的記錄檔名稱中的冒號替換掉 - [PR #40452](https://github.com/BerriAI/litellm/pull/40452)
- 在 pre_call_hook 拒絕時標註 provider 和 model_info - [PR #41077](https://github.com/BerriAI/litellm/pull/41077)
- 限制每次 flush 的並行 S3 上傳數量，並新增可選用的 JSONL 批次檔 - [PR #41258](https://github.com/BerriAI/litellm/pull/41258)
- 將攔截到的搜尋保留在父請求的 session 和 trace 中 - [PR #41711](https://github.com/BerriAI/litellm/pull/41711)
- 在 error_information 中新增 normalized_error 叢集鍵值 - [PR #41715](https://github.com/BerriAI/litellm/pull/41715)
- 在 OTLP HTTP exporters 中遵循 SSL_CERT_FILE 和 ssl_verify - [PR #42106](https://github.com/BerriAI/litellm/pull/42106)
- 在初始化 logger 之前套用資料庫儲存的 callback 去識別化設定 - [PR #42122](https://github.com/BerriAI/litellm/pull/42122)
- 將 OCR 頁面 markdown 對應到生成回應 - [PR #42267](https://github.com/BerriAI/litellm/pull/42267)
- 在單一 flush 視窗內傳遞每一個不同的警示 - [PR #42314](https://github.com/BerriAI/litellm/pull/42314)
- 讓 flush() 能在事件迴圈變更時繼續運作 - [PR #42355](https://github.com/BerriAI/litellm/pull/42355)
- Arize AX callback 的每個團隊成功與錯誤取樣率 - [PR #42383](https://github.com/BerriAI/litellm/pull/42383)
- 以其內部回應為依據計價終端 Responses 串流事件 - [PR #42385](https://github.com/BerriAI/litellm/pull/42385)
- 將 completions、images、speech、transcription 和 moderation 輸出對應到 Langfuse generation 輸出 - [PR #42394](https://github.com/BerriAI/litellm/pull/42394)
- 使用 default=str 的 Json.dumps，讓無法序列化的中繼資料不會讓批次 flush 當掉 - [PR #42424](https://github.com/BerriAI/litellm/pull/42424)
- 透過兩條 OpenTelemetry 線路上的 Logs API 記錄 GenAI exception event - [PR #42431](https://github.com/BerriAI/litellm/pull/42431)
- 將 rerank 和 search 輸出，以及 OCR、image edit 和 search 輸入對應到 Langfuse generation - [PR #42444](https://github.com/BerriAI/litellm/pull/42444)
- 將文字 completions 的 choice 欄位保留在合成訊息旁邊 - [PR #42537](https://github.com/BerriAI/litellm/pull/42537)
- 重播已核准的 pre-call guardrail 快照 - [PR #42774](https://github.com/BerriAI/litellm/pull/42774)
- 線性掃描超出預算的措辭，避免精心構造的錯誤訊息卡住 proxy - [PR #42778](https://github.com/BerriAI/litellm/pull/42778)
- 將 provider 回應標頭傳遞給每個端點的 callbacks - [PR #42824](https://github.com/BerriAI/litellm/pull/42824)
- 將 post-response service spans 建立在其自己的 trace 中，並連結到該請求 - [PR #42826](https://github.com/BerriAI/litellm/pull/42826)
- 在 deployment request 和 rate limit metrics 中新增 model_group 標籤 - [PR #42966](https://github.com/BerriAI/litellm/pull/42966)
- 先上傳最新事件，預設丟棄終端失敗與一小時前的重試，並可選擇啟用自適應並行 - [PR #43022](https://github.com/BerriAI/litellm/pull/43022)

### Secret Managers {#secret-managers}

- 還原排定刪除的 secret，而不是讓 CreateSecret 失敗 - [PR #42454](https://github.com/BerriAI/litellm/pull/42454)
- 透過原生 Rust 後端進行 secret 解析 - [PR #42619](https://github.com/BerriAI/litellm/pull/42619)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 遵循 image generation 的 deployment 計價 - [PR #39311](https://github.com/BerriAI/litellm/pull/39311)
- 以 OpenAI 長上下文批次層級計費超過 272K 的 batch prompts - [PR #39861](https://github.com/BerriAI/litellm/pull/39861)
- 將 CLI 工作階段支出歸屬到每位使用者的 cli-session 別名，而不是雜湊後的 session token - [PR #40541](https://github.com/BerriAI/litellm/pull/40541)
- 在可計費請求上發出 $0 成本警告並計數 - [PR #42345](https://github.com/BerriAI/litellm/pull/42345)
- 對每個 provider 的 chat completions 遵循每秒自訂計價 - [PR #42403](https://github.com/BerriAI/litellm/pull/42403)
- 對沒有計價資料列的 model，從 /spend/calculate 回傳 400 - [PR #42497](https://github.com/BerriAI/litellm/pull/42497)
- 進行 LiteLLM 支出與 OpenAI 帳單之間的擷取率檢查 - [PR #43044](https://github.com/BerriAI/litellm/pull/43044)
- 將 deployment 的計價覆寫套用到 realtime sessions - [PR #43114](https://github.com/BerriAI/litellm/pull/43114)

### 預算 {#budgets}

- 在請求進行中延長 budget reservation counter 的 TTL - [PR #40322](https://github.com/BerriAI/litellm/pull/40322)
- 對 JEV 測試 routing 強制執行 virtual key 預算 - [PR #41879](https://github.com/BerriAI/litellm/pull/41879)
- 將 BudgetExceededError 改為回傳 422 而非 429 - [PR #42097](https://github.com/BerriAI/litellm/pull/42097)
- 在請求結束時釋放未被領取的 budget reservations - [PR #42304](https://github.com/BerriAI/litellm/pull/42304)
- 在同步讀取前等待 budget redis pipeline（#32618 的內部複本） - [PR #43125](https://github.com/BerriAI/litellm/pull/43125)

### 速率限制 {#rate-limiting}

- 強制套用設定在 tag objects 上的 tpm_limit 和 rpm_limit - [PR #41807](https://github.com/BerriAI/litellm/pull/41807)
- 在 model_group_alias 與其目標之間共享 model rate-limit bucket - [PR #42516](https://github.com/BerriAI/litellm/pull/42516)

## MCP 閘道 {#mcp-gateway}

### MCP 閘道 {#mcp-gateway-1}

- 處理分割的 UTF-8 routing 預覽 - [PR #34919](https://github.com/BerriAI/litellm/pull/34919)
- 對 prompt 和資源探索進行分頁 - [PR #39189](https://github.com/BerriAI/litellm/pull/39189)
- 在 admin api credential 去識別化中保留 oauth scopes - [PR #39805](https://github.com/BerriAI/litellm/pull/39805)
- 在重新整理之間保持 server 清單穩定 - [PR #41074](https://github.com/BerriAI/litellm/pull/41074)
- 套用 post-call 重寫時不保留過時的結構化輸出 - [PR #41530](https://github.com/BerriAI/litellm/pull/41530)
- 當 worker 尚未服務 tools/list 時，Tools/call 不再回傳 404 - [PR #42072](https://github.com/BerriAI/litellm/pull/42072)
- 說明缺少的公開 client 相依性 - [PR #42148](https://github.com/BerriAI/litellm/pull/42148)
- 讓以設定檔定義的 server 保持唯讀 - [PR #42299](https://github.com/BerriAI/litellm/pull/42299)
- 還原舊版 SSE 與受限的取消清理 - [PR #42382](https://github.com/BerriAI/litellm/pull/42382)
- 將 agent key 的 tools 上限限制為發起使用者和團隊可呼叫的範圍 - [PR #42478](https://github.com/BerriAI/litellm/pull/42478)
- 保留發現歸屬並清理 logging 標頭 - [PR #42541](https://github.com/BerriAI/litellm/pull/42541)
- 在 DCR bridge 驗證中保留憑證權限 - [PR #42563](https://github.com/BerriAI/litellm/pull/42563)
- 拒絕配置允許清單之外的來源 - [PR #42649](https://github.com/BerriAI/litellm/pull/42649)
- 對沒有 subject token 的 REST token-exchange tool calls 回傳 401 challenge - [PR #42782](https://github.com/BerriAI/litellm/pull/42782)
- 在 REST oauth_delegate tool calls 中轉送呼叫者的 bearer - [PR #42787](https://github.com/BerriAI/litellm/pull/42787)
- 在被 guardrail 阻擋的 REST 呼叫上保留工具歸屬 - [PR #42790](https://github.com/BerriAI/litellm/pull/42790)
- 拒絕重複的 MCP server 名稱和別名 - [PR #42791](https://github.com/BerriAI/litellm/pull/42791)
- 允許 ["\*"] 萬用字元在 mcp_tool_permissions 中授予目前與未來所有 tools - [PR #43108](https://github.com/BerriAI/litellm/pull/43108)

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

### 自動路由器與 model routing {#auto-router-and-model-routing}

- 新增可設定的 provider affinity 標頭對應 - [PR #41033](https://github.com/BerriAI/litellm/pull/41033)
- 讓 context-window 升級成為可選功能 - [PR #41872](https://github.com/BerriAI/litellm/pull/41872)
- 在 LLM classifier 旁新增 JEV classifier - [PR #41886](https://github.com/BerriAI/litellm/pull/41886)
- 新增 NotFoundErrorRetries，讓 retry policy 能鎖定 404 retries - [PR #42045](https://github.com/BerriAI/litellm/pull/42045)
- 跳過背景 response cost poll 的 404 冷卻時間 - [PR #42046](https://github.com/BerriAI/litellm/pull/42046)
- 在取得 batch 時標記 model_group，讓 batch tokens 可歸屬（#38499 的內部複本） - [PR #42062](https://github.com/BerriAI/litellm/pull/42062)
- 跨 conversation APIs 的原生 compact-to-fit - [PR #42074](https://github.com/BerriAI/litellm/pull/42074)
- 在 breakpoint 移動時保留 prompt caching 的 affinity - [PR #42080](https://github.com/BerriAI/litellm/pull/42080)
- 設定 heuristic v2 成功門檻 - [PR #42252](https://github.com/BerriAI/litellm/pull/42252)
- 在中途串流失敗後，逐一走訪備援清單中的每個項目 - [PR #42283](https://github.com/BerriAI/litellm/pull/42283)
- 新增群組範圍優先路由策略 - [PR #42378](https://github.com/BerriAI/litellm/pull/42378)
- 透過 model_info.access_windows 讓團隊可依時間區間預留 deployments - [PR #42398](https://github.com/BerriAI/litellm/pull/42398)
- 在拋出的錯誤中以白話說明備援結果 - [PR #42509](https://github.com/BerriAI/litellm/pull/42509)
- 當加密內容來源沒有邊界同儕時，從同層來源提供 Responses turns - [PR #43015](https://github.com/BerriAI/litellm/pull/43015)
- 針對由萬用字元 deployments 服務的裸 model groups，比對帶有 provider 前綴的備援鍵值 - [PR #43062](https://github.com/BerriAI/litellm/pull/43062)
- 在中途備援時遵循 disable_fallbacks - [PR #43111](https://github.com/BerriAI/litellm/pull/43111)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 使用 IAM 憑證提供者驗證同步叢集 - [PR #40204](https://github.com/BerriAI/litellm/pull/40204)
- 協調 v2 遷移啟動並確認容器復原 - [PR #40932](https://github.com/BerriAI/litellm/pull/40932)
- 在關閉時取消 spend-log 清理時記錄中止結果 - [PR #41213](https://github.com/BerriAI/litellm/pull/41213)
- 在建立啟動檢視之前等待 spend-log 資料表 - [PR #41974](https://github.com/BerriAI/litellm/pull/41974)
- 停止從 Redis 緩衝區重新傳送無法重送的 spend 批次 - [PR #41994](https://github.com/BerriAI/litellm/pull/41994)
- 將重新排入佇列的 spend log 暫存在 Redis 中，使其在 DB 中斷期間的 pod 重新啟動後仍可保留 - [PR #42022](https://github.com/BerriAI/litellm/pull/42022)
- 預設使用 v2 遷移解析器 - [PR #42105](https://github.com/BerriAI/litellm/pull/42105)
- 在背景發布 auth 快取失效通知，避免卡住的協調 Redis 阻塞使用者更新 - [PR #42534](https://github.com/BerriAI/litellm/pull/42534)
- 在 litellm CLI 中遵循 DATABASE_DISABLE_PREPARED_STATEMENTS - [PR #42556](https://github.com/BerriAI/litellm/pull/42556)
- 讓 embedding 快取命中與請求輸入保持一致 - [PR #42571](https://github.com/BerriAI/litellm/pull/42571)
- 在關閉取消 flush 時保留進行中的每日 spend 批次 - [PR #42593](https://github.com/BerriAI/litellm/pull/42593)
- 讓暫存的 DB 查詢在期限到達時失敗，並在其停滯時切換就緒狀態 - [PR #42654](https://github.com/BerriAI/litellm/pull/42654)
- 不要重新排入已提交且已送往 postgres 的每日 spend 批次 - [PR #42786](https://github.com/BerriAI/litellm/pull/42786)
- 將 user_api_key_cache_max_size 套用至 key object 分區 - [PR #42796](https://github.com/BerriAI/litellm/pull/42796)
- 在同步快取命中記錄中標記 provider，以便回應 spend log 記錄 provider - [PR #42830](https://github.com/BerriAI/litellm/pull/42830)

### 原生 Rust 執行階段（可選） {#native-rust-runtime-opt-in}

- 以可選啟用的 Rust 分派保留 Python 預設值 - [PR #42174](https://github.com/BerriAI/litellm/pull/42174)
- 新增原生磁碟快取後端 - [PR #42311](https://github.com/BerriAI/litellm/pull/42311)
- 新增原生 S3 快取後端 - [PR #42313](https://github.com/BerriAI/litellm/pull/42313)
- 新增原生 Valkey 語意快取後端 - [PR #42316](https://github.com/BerriAI/litellm/pull/42316)
- 以 Redis 拓樸原生提供 RedisClusterCache - [PR #42317](https://github.com/BerriAI/litellm/pull/42317)
- 以 Rust 原生提供 Redis Semantic 快取 - [PR #42319](https://github.com/BerriAI/litellm/pull/42319)
- 原生 Azure Blob 回應快取後端 - [PR #42321](https://github.com/BerriAI/litellm/pull/42321)
- 以 Rust 原生提供 QdrantSemanticCache - [PR #42324](https://github.com/BerriAI/litellm/pull/42324)
- 新增原生 GCS object-store 快取後端 - [PR #42325](https://github.com/BerriAI/litellm/pull/42325)
- 使快取 crates 與 Python 對齊並連接每個原生後端 - [PR #42530](https://github.com/BerriAI/litellm/pull/42530)
- 透過 Rust 診斷處理器分派 Python 記錄 - [PR #42616](https://github.com/BerriAI/litellm/pull/42616)
- 在橋接邊界上的原生同步與非同步串流加上 x-litellm-rust 標記 - [PR #42758](https://github.com/BerriAI/litellm/pull/42758)
- 原生建構 Anthropic Messages 請求 - [PR #42982](https://github.com/BerriAI/litellm/pull/42982)
- 透過 Python 從 Rust 路由讀取 secrets，並使用 NO_PYTHON 宣告僅限 Rust 的路由 - [PR #43057](https://github.com/BerriAI/litellm/pull/43057)
- 將上游回應標頭傳遞給原生 Messages 串流 - [PR #43178](https://github.com/BerriAI/litellm/pull/43178)
- 遍歷並釋放保留的標頭 dict - [PR #43274](https://github.com/BerriAI/litellm/pull/43274)

## 文件更新 {#documentation-updates}

### 文件 {#documentation}

- 停止在已發布的設定檔與範例中宣傳一個公開已知的弱 master-key 值 - [PR #42011](https://github.com/BerriAI/litellm/pull/42011)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 184 個 PR 變更了測試、CI、貢獻者工具、發布封裝，或尚未接入使用者可見路徑的 Rust 執行階段支架。它們本身不會變更 proxy 或 SDK 行為

<details>
<summary>測試（108）</summary>

- 將自訂的 endpoints_client 替換為提供者 SDK 用戶端 - [PR #34358](https://github.com/BerriAI/litellm/pull/34358)
- 斷言已計入快取價格的 vertex grok 列需宣告 supports_prompt_caching - [PR #41526](https://github.com/BerriAI/litellm/pull/41526)
- 涵蓋 actor 邊與萬用字元模型 - [PR #41769](https://github.com/BerriAI/litellm/pull/41769)
- 涵蓋儀表板表單流程 - [PR #41773](https://github.com/BerriAI/litellm/pull/41773)
- 涵蓋 chat 與 responses 註冊表缺口 - [PR #41794](https://github.com/BerriAI/litellm/pull/41794)
- 涵蓋舊版最低 TPM 選擇 - [PR #41795](https://github.com/BerriAI/litellm/pull/41795)
- 成本測試工具中的端點、明細元件與失敗支援 - [PR #41999](https://github.com/BerriAI/litellm/pull/41999)
- embeddings、rerank、completions 與 moderations 成本案例 - [PR #42020](https://github.com/BerriAI/litellm/pull/42020)
- 音訊、圖片與按單位成本案例 - [PR #42024](https://github.com/BerriAI/litellm/pull/42024)
- passthrough 路由成本案例 - [PR #42028](https://github.com/BerriAI/litellm/pull/42028)
- 定價維度與提供者回報的成本案例 - [PR #42035](https://github.com/BerriAI/litellm/pull/42035)
- 還原有範圍的執行與憑證隔離迴歸問題 - [PR #42050](https://github.com/BerriAI/litellm/pull/42050)
- 還原 MCP OAuth 順暢路徑涵蓋範圍（LIT-3467） - [PR #42051](https://github.com/BerriAI/litellm/pull/42051)
- 提供者 wire 成本案例 - [PR #42052](https://github.com/BerriAI/litellm/pull/42052)
- 代理行為成本案例 - [PR #42060](https://github.com/BerriAI/litellm/pull/42060)
- 將 autorouter 估算鍵加入 GCS pub/sub spend-log golden - [PR #42061](https://github.com/BerriAI/litellm/pull/42061)
- 批次與即時成本案例 - [PR #42066](https://github.com/BerriAI/litellm/pull/42066)
- 將第 6 階段提供者單元測試移至 tests/unit - [PR #42107](https://github.com/BerriAI/litellm/pull/42107)
- 將 wave 1 第 2 階段舊版單元測試移至 tests/unit - [PR #42108](https://github.com/BerriAI/litellm/pull/42108)
- 將第 5 階段提供者單元測試移至 tests/unit - [PR #42109](https://github.com/BerriAI/litellm/pull/42109)
- 將 bedrock、baseten 與 base_llm 批次測試移至 tests/unit - [PR #42110](https://github.com/BerriAI/litellm/pull/42110)
- 將 wave 1 第 8 階段舊版 llm 測試移至 tests/unit - [PR #42112](https://github.com/BerriAI/litellm/pull/42112)
- 在匯入時封鎖外部 socket，並新增 socket policy 迴歸測試 - [PR #42113](https://github.com/BerriAI/litellm/pull/42113)
- 將第 7 階段提供者單元測試移至 tests/unit - [PR #42114](https://github.com/BerriAI/litellm/pull/42114)
- 將 nvidia、oci、ocr、oobabooga 與 openai 舊版測試移至 tests/unit - [PR #42115](https://github.com/BerriAI/litellm/pull/42115)
- 將第 9 階段舊版 llm 提供者測試移至 tests/unit - [PR #42117](https://github.com/BerriAI/litellm/pull/42117)
- 遷移 wave 1 第 3 階段 anthropic、apiserpent、azure 與 azure_ai 舊版測試 - [PR #42118](https://github.com/BerriAI/litellm/pull/42118)
- 以真實 master key 啟動統一的 Google proxy fixture - [PR #42120](https://github.com/BerriAI/litellm/pull/42120)
- 將 wave 1 第 1 階段舊版測試移至 tests/unit - [PR #42123](https://github.com/BerriAI/litellm/pull/42123)
- 修正 fuzzy picker、breached-password HIBP 與 MCP stdio timeout 測試的不穩定性（rolling deflake 2026-09-22） - [PR #42125](https://github.com/BerriAI/litellm/pull/42125)
- 將 openai、openai_like 與 openrouter 舊版測試移至 tests/unit - [PR #42128](https://github.com/BerriAI/litellm/pull/42128)
- 將第 16 階段舊版測試移至 tests/unit - [PR #42131](https://github.com/BerriAI/litellm/pull/42131)
- 將第 14 階段 wave 2 提供者測試移至 tests/unit - [PR #42132](https://github.com/BerriAI/litellm/pull/42132)
- 讓每個 tests/unit 目錄都成為套件，使 pytest 蒐集具唯一性 - [PR #42135](https://github.com/BerriAI/litellm/pull/42135)
- 將第 15 階段舊版測試移至 tests/unit - [PR #42136](https://github.com/BerriAI/litellm/pull/42136)
- 將第 12 階段舊版 llm 提供者測試移至 tests/unit - [PR #42137](https://github.com/BerriAI/litellm/pull/42137)
- 將舊版提供者測試移至 tests/unit（wave 2，第 13 階段） - [PR #42145](https://github.com/BerriAI/litellm/pull/42145)
- 將 a2a_protocol 舊版測試移至 tests/unit（wave 3 第 17 階段） - [PR #42160](https://github.com/BerriAI/litellm/pull/42160)
- 涵蓋從一版到另一版的升級路徑 - [PR #42294](https://github.com/BerriAI/litellm/pull/42294)
- 修正過時的 budget-status 與 bad-database-url 斷言 - [PR #42339](https://github.com/BerriAI/litellm/pull/42339)
- 新增 chat、messages 與 responses 的對話矩陣 - [PR #42359](https://github.com/BerriAI/litellm/pull/42359)
- 在 unknown-agent 測試之間隔離 agent read-through singleton - [PR #42389](https://github.com/BerriAI/litellm/pull/42389)
- 將 Xiaomi MiMo 涵蓋範圍從 live e2e 移至 providers wire 分片 - [PR #42395](https://github.com/BerriAI/litellm/pull/42395)
- 在成本套件中串接一個由 proxy 發出的 previous_response_id - [PR #42396](https://github.com/BerriAI/litellm/pull/42396)
- 將 MCP Tools 分頁與上游自身的 tools/list 進行比對 - [PR #42397](https://github.com/BerriAI/litellm/pull/42397)
- 讓 bedrock 收集器與 secret scan 時序測試具決定性 - [PR #42405](https://github.com/BerriAI/litellm/pull/42405)
- 斷言 cooldown 在 1 秒 Redis 讀取間隔內抵達同層 replica - [PR #42422](https://github.com/BerriAI/litellm/pull/42422)
- 讓 detailed-timing receive-anchor 測試與時區無關 - [PR #42429](https://github.com/BerriAI/litellm/pull/42429)
- 為每個 ui settings 端點測試提供全新的 settings store - [PR #42430](https://github.com/BerriAI/litellm/pull/42430)
- 新增 HashiCorp Vault 與 CyberArk Conjur 的 secret manager 通道 - [PR #42503](https://github.com/BerriAI/litellm/pull/42503)
- 讓 memory cell 單獨執行於共享堆疊上 - [PR #42518](https://github.com/BerriAI/litellm/pull/42518)
- 將 unified_google_tests 移至 gemini-3.5-flash-lite - [PR #42520](https://github.com/BerriAI/litellm/pull/42520)
- 移除路由分派斷言，直接測試 bridge - [PR #42536](https://github.com/BerriAI/litellm/pull/42536)
- 一次請求在每個介面上產生相同的 spend - [PR #42540](https://github.com/BerriAI/litellm/pull/42540)
- 防止洩漏的 cassette patch，並讓注入式傳輸的嵌入測試免受影響 - [PR #42542](https://github.com/BerriAI/litellm/pull/42542)
- 在任何流量到來之前，將每個 worker 維持在閒置 RSS 預算內 - [PR #42552](https://github.com/BerriAI/litellm/pull/42552)
- 在 migrate deploy timeout 測試中將 zombie grandchild 視為已消失 - [PR #42570](https://github.com/BerriAI/litellm/pull/42570)
- 讓兩個 proxy-infra 測試彼此不依賴同層測試狀態 - [PR #42581](https://github.com/BerriAI/litellm/pull/42581)
- 將單元測試指向仍在成本映射中的 model ids - [PR #42606](https://github.com/BerriAI/litellm/pull/42606)
- 在 price-map schema 檢查中接受按尺寸區分的圖片成本鍵 - [PR #42612](https://github.com/BerriAI/litellm/pull/42612)
- 將 image-generation deployment 價格測試指向一筆即時的 gemini 列 - [PR #42615](https://github.com/BerriAI/litellm/pull/42615)
- 將僅 CircleCI 的套件指向仍在成本映射中的模型 - [PR #42617](https://github.com/BerriAI/litellm/pull/42617)
- 八月提供者翻譯與串流錯誤的迴歸測試 - [PR #42621](https://github.com/BerriAI/litellm/pull/42621)
- 八月成本追蹤與預算錯誤的迴歸測試 - [PR #42622](https://github.com/BerriAI/litellm/pull/42622)
- 移除舊版 InvalidStatusCode 測試並鎖定 websockets 匯入版本 - [PR #42624](https://github.com/BerriAI/litellm/pull/42624)
- 容忍五個完整套件 cell 中的提供者端不穩定 - [PR #42628](https://github.com/BerriAI/litellm/pull/42628)
- 將 Azure 圖片成本測試重新指向 gpt-image-2 - [PR #42631](https://github.com/BerriAI/litellm/pull/42631)
- 在失敗回呼迴歸測試中，將 post-success hook 錯誤從 guardrail 拋出 - [PR #42646](https://github.com/BerriAI/litellm/pull/42646)
- 允許略過的節點並移除分片上限 - [PR #42687](https://github.com/BerriAI/litellm/pull/42687)
- 將讀取複本路由測試工具加入 CircleCI 整合套件 - [PR #42692](https://github.com/BerriAI/litellm/pull/42692)
- 七月提供者翻譯、路由與串流錯誤的迴歸測試 - [PR #42693](https://github.com/BerriAI/litellm/pull/42693)
- 七月成本追蹤、預算與 spend 錯誤的迴歸測試 - [PR #42694](https://github.com/BerriAI/litellm/pull/42694)
- 以專屬 mcp 分片與 proxy 涵蓋成果物新增第 1 波 MCP gateway 涵蓋範圍 - [PR #42711](https://github.com/BerriAI/litellm/pull/42711)
- 將阻擋 OCR 回呼建模為 guardrail，以便其 raise 得以傳播 - [PR #42775](https://github.com/BerriAI/litellm/pull/42775)
- v3 平台 relay 的決定性整合稽核 - [PR #42781](https://github.com/BerriAI/litellm/pull/42781)
- 涵蓋客戶回報的 cache key、cache_control、bedrock request id、responses schema、scim 與 tag budget 合約 - [PR #42785](https://github.com/BerriAI/litellm/pull/42785)
- 斷言 /v1/responses usage 回報 Anthropic system cache 先寫入再讀取 - [PR #42855](https://github.com/BerriAI/litellm/pull/42855)
- 斷言 /v1/models 回報 max_input_tokens 與 max_output_tokens - [PR #42858](https://github.com/BerriAI/litellm/pull/42858)
- 涵蓋每個 key 的 tag rpm 限制與 tag budget_duration 重設 - [PR #42859](https://github.com/BerriAI/litellm/pull/42859)
- malformed token limits 與 callback_settings 形狀的邊界情況矩陣 - [PR #42895](https://github.com/BerriAI/litellm/pull/42895)
- 在搬移前，先將鍵值從舊版 proxy、enterprise 與 mcp 單元測試中移除 - [PR #42901](https://github.com/BerriAI/litellm/pull/42901)
- 斷言傳送至 Ollama 的圖片，而非透過 response 將其回傳 - [PR #42905](https://github.com/BerriAI/litellm/pull/42905)
- 阻止一個 comprehension 變數遮蔽 body() 輔助函式 - [PR #42906](https://github.com/BerriAI/litellm/pull/42906)
- 在不進行 coverage tracing 的情況下執行 files peak-memory 防護 - [PR #42914](https://github.com/BerriAI/litellm/pull/42914)

- 修補 store-model-in-db MCP 測試中的 create_mcp_server_if_identifier_free - [PR #42916](https://github.com/BerriAI/litellm/pull/42916)
- 在共用的 owned_redis 輔助工具上執行 cache-hit redis 當機測試 - [PR #42925](https://github.com/BerriAI/litellm/pull/42925)
- 為登出規格建立各自的管理員工作階段 - [PR #42930](https://github.com/BerriAI/litellm/pull/42930)
- 將 otel 成本寫入視為連結的根追蹤 - [PR #42931](https://github.com/BerriAI/litellm/pull/42931)
- 在共用的管理員工作階段中隱藏 LiteAdmin 按鈕 - [PR #43033](https://github.com/BerriAI/litellm/pull/43033)
- 從 /v1/responses 上的 Codex 風格標頭固定終端使用者與標籤歸因 - [PR #43093](https://github.com/BerriAI/litellm/pull/43093)
- 以服務帳戶金鑰透過原生 id 涵蓋 Azure code_interpreter 容器檔案 - [PR #43122](https://github.com/BerriAI/litellm/pull/43122)
- 重新組織 core crate 測試並拆分 cache 與 OCR 測試套件 - [PR #43177](https://github.com/BerriAI/litellm/pull/43177)
- 為 Claude Code、Codex 和 opencode 提供代理程式用戶端 - [PR #43181](https://github.com/BerriAI/litellm/pull/43181)
- 將 tests/test_litellm 根目錄與小型樹狀目錄移至 tests/unit - [PR #43186](https://github.com/BerriAI/litellm/pull/43186)
- 將 tests/test_litellm/llms 移至 tests/unit/llms - [PR #43191](https://github.com/BerriAI/litellm/pull/43191)
- 將 tests/test_litellm integrations 與 secret_managers 移至 tests/unit - [PR #43194](https://github.com/BerriAI/litellm/pull/43194)
- 將 tests/test_litellm core utils、routing、responses、caching 與 rust_bridge 移至 tests/unit - [PR #43199](https://github.com/BerriAI/litellm/pull/43199)
- 在 test_unit_shard_missing_paths 中移除重複的 UNIT_FLAG 鍵值 - [PR #43212](https://github.com/BerriAI/litellm/pull/43212)
- 阻止 CI 測試下載 tokenizer 檔案與圖片 - [PR #43257](https://github.com/BerriAI/litellm/pull/43257)
- 修正在排程 CircleCI 上變紅的過時與狀態洩漏測試 - [PR #43266](https://github.com/BerriAI/litellm/pull/43266)
- 完成 tests/test_litellm 的非 proxy 部分 - [PR #43281](https://github.com/BerriAI/litellm/pull/43281)
- 將 langfuse callbacks-in-db 覆蓋範圍移植到本機 harness - [PR #43282](https://github.com/BerriAI/litellm/pull/43282)
- 在獨立的暫存資料庫上執行 Langfuse DB-callback 測試 - [PR #43288](https://github.com/BerriAI/litellm/pull/43288)
- 將 management proxy fixture 的範圍限定在其套件內，使其 spend monitor 不會與 spend 測試競態 - [PR #43302](https://github.com/BerriAI/litellm/pull/43302)
- 只斷言 litellm 擁有的 batch 行為，並將空白 S3 env 固定移至整合測試 - [PR #43321](https://github.com/BerriAI/litellm/pull/43321)
- 在 rc/1.104.0 上將 batch cleanup 遺留項目回報為單純的 UserWarning - [PR #43406](https://github.com/BerriAI/litellm/pull/43406)
- 在 CI 擁有 LangSmith key 之前，略過 rc/1.104.0 上的 LangSmith batch serialization e2e - [PR #43418](https://github.com/BerriAI/litellm/pull/43418)
- 在 rc/1.104.0 上阻止測試模組將自身目錄放入 sys.path - [PR #43420](https://github.com/BerriAI/litellm/pull/43420)

</details>

<details>
<summary>CI (27)</summary>

- 將 tests/unit 串接進 CircleCI，並持續讓 GHA shard 保持綠燈 - [PR #42103](https://github.com/BerriAI/litellm/pull/42103)
- 在 budget ratchet 中豁免已退役的 test-quality 規則 - [PR #42116](https://github.com/BerriAI/litellm/pull/42116)
- 修正 stage-mirror batch 的紅燈並保留已去識別化的 pytest 記錄檔 - [PR #42143](https://github.com/BerriAI/litellm/pull/42143)
- 讓安裝 smoke test 能以無 key 的 proxy 設定啟動 - [PR #42296](https://github.com/BerriAI/litellm/pull/42296)
- 對未變動 cost map 的 PR 略過 cost map 檔案檢查 - [PR #42406](https://github.com/BerriAI/litellm/pull/42406)
- 只在 GitHub Actions 下列印 add-mask 行 - [PR #42423](https://github.com/BerriAI/litellm/pull/42423)
- 在遞迴偵測器中將 _render_json 加入允許清單 - [PR #42442](https://github.com/BerriAI/litellm/pull/42442)
- 將憑證、cost map 與 UI 登入請求路由到控制平面 - [PR #42506](https://github.com/BerriAI/litellm/pull/42506)
- 移除無用的 misc shard 路徑，並以警告略過缺失的路徑 - [PR #42603](https://github.com/BerriAI/litellm/pull/42603)
- 將 compat-matrix 填充器從 GCE VM 移至 Render cron job - [PR #42608](https://github.com/BerriAI/litellm/pull/42608)
- 關閉在其連結議題上被合併修正取代的開啟中 pull request - [PR #42609](https://github.com/BerriAI/litellm/pull/42609)
- 移除未使用的 create-release 工作流程 - [PR #42696](https://github.com/BerriAI/litellm/pull/42696)
- 新增 merge smoke 檢查工作流程，包含僅回送 harness 與 11 個精選案例 - [PR #42709](https://github.com/BerriAI/litellm/pull/42709)
- 移除 litellm_internal_staging 與 litellm_oss_staging 參照，main 是唯一的 trunk - [PR #42745](https://github.com/BerriAI/litellm/pull/42745)
- 新增僅測試 CircleCI pipeline，包含涵蓋率與文件驗證 - [PR #42773](https://github.com/BerriAI/litellm/pull/42773)
- 修正 litellm-tests 單元工作（sysmon、失敗時 codecov、env -i allowlist、selection errors、reruns 參數） - [PR #42900](https://github.com/BerriAI/litellm/pull/42900)
- 將 caching、proxy-extras、gateway 與 enterprise 測試移至 tests/unit，並從 litellm-tests 執行 - [PR #42902](https://github.com/BerriAI/litellm/pull/42902)
- 將 tests/proxy_unit_tests 移至 tests/unit/proxy，並從 litellm-tests 執行 proxy-db shard - [PR #42903](https://github.com/BerriAI/litellm/pull/42903)
- 將與提供者無關的 MCP 測試移至 tests/unit，並從 litellm-tests 執行 mcp-integration - [PR #42904](https://github.com/BerriAI/litellm/pull/42904)
- 逐次解析並安裝 Claude Code CLI - [PR #43038](https://github.com/BerriAI/litellm/pull/43038)
- 在 Claude Code PR-gate resolver 中略過未發佈的 npm 版本 - [PR #43053](https://github.com/BerriAI/litellm/pull/43053)
- 在 lint 工作中執行 claude_code harness 單元測試樹 - [PR #43077](https://github.com/BerriAI/litellm/pull/43077)
- 每週五太平洋時間凌晨 3 點從 main 切出 rc/&lt;X.Y.0&gt; - [PR #43121](https://github.com/BerriAI/litellm/pull/43121)
- 在舊版 GHA shard 中的每個事件上執行已遷移的單元選取 - [PR #43182](https://github.com/BerriAI/litellm/pull/43182)
- 從 CircleCI 的 litellm-main 工作流程中移除 main 與 litellm_\* 分支篩選器 - [PR #43272](https://github.com/BerriAI/litellm/pull/43272)
- 停止陳舊的 CI 紅燈、讓單元測試脫離主機環境、重試 CyberArk 政策衝突 - [PR #43294](https://github.com/BerriAI/litellm/pull/43294)
- 在不放寬測試隔離的情況下縮短 CircleCI wall time - [PR #43347](https://github.com/BerriAI/litellm/pull/43347)

</details>

<details>
<summary>程式碼品質與貢獻者工具 (16)</summary>

- 移除 169 個後端檔案中的 1,173 個 Any 錯誤 - [PR #40251](https://github.com/BerriAI/litellm/pull/40251)
- 定義 unit、integration 與 e2e 的層級合約 - [PR #42099](https://github.com/BerriAI/litellm/pull/42099)
- 以已驗證的型別取代 30 個檔案中的 Any - [PR #42127](https://github.com/BerriAI/litellm/pull/42127)
- 以已驗證的型別取代 32 個檔案中的 Any - [PR #42220](https://github.com/BerriAI/litellm/pull/42220)
- 萃取明確的 operation context 與 dispatch - [PR #42292](https://github.com/BerriAI/litellm/pull/42292)
- 將 comprehensions 限制為最多一個 for 與一個 if 子句（LIT014） - [PR #42650](https://github.com/BerriAI/litellm/pull/42650)
- 清除過去 24 小時的新技術債（rolling，2026-09-06 到 2026-09-24） - [PR #42710](https://github.com/BerriAI/litellm/pull/42710)
- 以已驗證的型別取代 5 個檔案中的 Any - [PR #42722](https://github.com/BerriAI/litellm/pull/42722)
- 新增 LIT013，標記會抑制任何內容的 \*-ok suppressions，並移除 240 個過時項目 - [PR #42793](https://github.com/BerriAI/litellm/pull/42793)
- 從 PR 內文移除空白區段並收緊 User Flow - [PR #42794](https://github.com/BerriAI/litellm/pull/42794)
- 將 pull request 範本簡化為簡明英文問題 - [PR #42813](https://github.com/BerriAI/litellm/pull/42813)
- 還原完整的 pull request 範本（還原 #42813） - [PR #42828](https://github.com/BerriAI/litellm/pull/42828)
- 將 litellm 擁有的 kwargs 宣告為具型別的物件，並從其欄位衍生清單 - [PR #42843](https://github.com/BerriAI/litellm/pull/42843)
- 以已驗證的型別取代 13 個檔案中的 Any - [PR #42937](https://github.com/BerriAI/litellm/pull/42937)
- 在 PR 範本中要求 UI 前後對照截圖與有意的 UX 變更說明 - [PR #43021](https://github.com/BerriAI/litellm/pull/43021)
- 將 harness 測試自 no-unit-tests 硬性規則中切出 - [PR #43076](https://github.com/BerriAI/litellm/pull/43076)

</details>

<details>
<summary>Rust runtime 內部機制 (29)</summary>

- 拆分 token 計數器後端 - [PR #42165](https://github.com/BerriAI/litellm/pull/42165)
- 新增型別化密鑰管理器與共享驗證配接器 - [PR #42173](https://github.com/BerriAI/litellm/pull/42173)
- 為 Python 對等性建立快取基礎 - [PR #42196](https://github.com/BerriAI/litellm/pull/42196)
- 在原生邊界保留 Python 設定語意 - [PR #42300](https://github.com/BerriAI/litellm/pull/42300)
- 新增 CyberArk Conjur 密鑰管理器後端 - [PR #42303](https://github.com/BerriAI/litellm/pull/42303)
- 新增 HashiCorp Vault 密鑰管理器 crate - [PR #42308](https://github.com/BerriAI/litellm/pull/42308)
- 新增 Azure Key Vault 密鑰管理器後端 - [PR #42309](https://github.com/BerriAI/litellm/pull/42309)
- 新增快取與密鑰遷移基礎 - [PR #42328](https://github.com/BerriAI/litellm/pull/42328)
- 在原生 stub 中宣告 _CacheTestHandle.valkey_semantic - [PR #42364](https://github.com/BerriAI/litellm/pull/42364)
- 合併後保留原生 Redis 語意綁定與 Qdrant 批次寫入 - [PR #42379](https://github.com/BerriAI/litellm/pull/42379)
- 對齊密鑰管理器操作內容 - [PR #42480](https://github.com/BerriAI/litellm/pull/42480)
- 新增用於 Python 資料格式的 python-compat crate - [PR #42510](https://github.com/BerriAI/litellm/pull/42510)
- 新增獨立成本計算器 - [PR #42604](https://github.com/BerriAI/litellm/pull/42604)
- 新增不可變模型型錄 crate - [PR #42605](https://github.com/BerriAI/litellm/pull/42605)
- 新增受保護的原生 response-cache 解析器基礎 - [PR #42769](https://github.com/BerriAI/litellm/pull/42769)
- 新增原生 dispatch 基礎 - [PR #42799](https://github.com/BerriAI/litellm/pull/42799)
- 將原生 dispatch 基礎擴展到 chat completions、responses 和 messages - [PR #42805](https://github.com/BerriAI/litellm/pull/42805)
- 在 ModelInfo 上宣告 above_32k 成本欄位 - [PR #42856](https://github.com/BerriAI/litellm/pull/42856)
- 將 tests.rs 檔案內聯或移至 tests/ 下，並移除 autotests = false - [PR #43028](https://github.com/BerriAI/litellm/pull/43028)
- 將主機 coroutine 抽出為其自己的 crate - [PR #43129](https://github.com/BerriAI/litellm/pull/43129)
- 新增 Rust registry 驗證 - [PR #43136](https://github.com/BerriAI/litellm/pull/43136)
- 以 tokio-util codecs 取代 Framer trait - [PR #43193](https://github.com/BerriAI/litellm/pull/43193)
- 發放一個擁有的 Client，並透過 pool 路由所有提供者 - [PR #43245](https://github.com/BerriAI/litellm/pull/43245)
- 將憑證繼承與 SDK 限制移入 driver preflight - [PR #43259](https://github.com/BerriAI/litellm/pull/43259)
- 保留巢狀的選用匯入失敗 - [PR #43265](https://github.com/BerriAI/litellm/pull/43265)
- 將 anthropic messages 自 experimental_pass_through 中提升出去 - [PR #43269](https://github.com/BerriAI/litellm/pull/43269)
- 為 gateway 準備推論與驗證基礎 - [PR #43287](https://github.com/BerriAI/litellm/pull/43287)
- 新增 config、router 和 gateway crates - [PR #43289](https://github.com/BerriAI/litellm/pull/43289)
- 擴充 logging 與測試涵蓋範圍，涵蓋 gateway 和 Anthropic messages - [PR #43295](https://github.com/BerriAI/litellm/pull/43295)

</details>

<details>
<summary>發行與封裝 (4)</summary>

- 提升 litellm-enterprise 0.1.69 -&gt; 0.1.70、litellm-proxy-extras 0.4.100 -&gt; 0.4.101、litellm 1.103.0 -&gt; 1.104.0 - [PR #42633](https://github.com/BerriAI/litellm/pull/42633)
- 提升 litellm-enterprise 0.1.70 -&gt; 0.1.71、litellm-proxy-extras 0.4.101 -&gt; 0.4.102 - [PR #43120](https://github.com/BerriAI/litellm/pull/43120)
- 重新建置 rc/1.104.0 的 Admin UI bundle - [PR #43372](https://github.com/BerriAI/litellm/pull/43372)
- 從 rc/1.104.0 移除 top-N key 上限、其後續項目，以及每日全域支出彙總程式碼 - [PR #43385](https://github.com/BerriAI/litellm/pull/43385)

</details>

### 依擁有權區域彙整 PR {#pr-roll-up-by-ownership-area}

rc.1 中面向客戶的 PR：**447**。測試、CI 與內部 PR：**184**。總計：**631**

- 模型與提供者：236
- 其他（測試、CI、內部）：184
- 效能：47
- 驗證與管理：43
- LLM API 端點：25
- 記錄：24
- UI：24
- MCP：18
- 支出 / 預算 / 速率限制：15
- 防護欄：12
- 密鑰管理器：2
- 文件：1

## 新貢獻者 {#new-contributors}

- [@ahamedshaik16](https://github.com/ahamedshaik16) 在 [PR #42966](https://github.com/BerriAI/litellm/pull/42966) 做出了他們的第一次貢獻
- [@chopratejas](https://github.com/chopratejas) 在 [PR #41560](https://github.com/BerriAI/litellm/pull/41560) 做出了他們的第一次貢獻
- [@doramirdor](https://github.com/doramirdor) 在 [PR #33227](https://github.com/BerriAI/litellm/pull/33227) 做出了他們的第一次貢獻
- [@kerry-berri](https://github.com/kerry-berri) 在 [PR #40429](https://github.com/BerriAI/litellm/pull/40429) 做出了他們的第一次貢獻
- [@kumarpriyanshu09](https://github.com/kumarpriyanshu09) 在 [PR #41526](https://github.com/BerriAI/litellm/pull/41526) 做出了他們的第一次貢獻
- [@patel-26meet](https://github.com/patel-26meet) 在 [PR #39311](https://github.com/BerriAI/litellm/pull/39311) 做出了他們的第一次貢獻
- [@Pawan-Shahane](https://github.com/Pawan-Shahane) 在 [PR #41979](https://github.com/BerriAI/litellm/pull/41979) 做出了他們的第一次貢獻
- [@philschmid](https://github.com/philschmid) 在 [PR #42465](https://github.com/BerriAI/litellm/pull/42465) 做出了他們的第一次貢獻
- [@PhimmStraiker](https://github.com/PhimmStraiker) 在 [PR #41880](https://github.com/BerriAI/litellm/pull/41880) 做出了他們的第一次貢獻
- [@SiluPanda](https://github.com/SiluPanda) 在 [PR #40204](https://github.com/BerriAI/litellm/pull/40204) 做出了他們的第一次貢獻
- [@togear](https://github.com/togear) 在 [PR #41033](https://github.com/BerriAI/litellm/pull/41033) 做出了他們的第一次貢獻
- [@Zechereh](https://github.com/Zechereh) 在 [PR #41099](https://github.com/BerriAI/litellm/pull/41099) 做出了他們的第一次貢獻

## 完整變更紀錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.103.0...v1.104.0
