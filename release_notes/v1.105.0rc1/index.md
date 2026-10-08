---
title: "1.105.0rc1 - Claude Sonnet 5.5, GPT-6.1 Sol, litellm.agent(), Lens 與 Agent Traces"
slug: "v1-105-0-rc-1"
date: 2026-10-03T16:48:15
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
docker.litellm.ai/berriai/litellm:1.105.0-rc.1
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.105.0rc1
```

</TabItem>
</Tabs>

已發佈的 GitHub 標籤是 `v1.105.0-rc.1`。這些說明會將其與 `v1.104.0-rc.1` 比較，也就是從 `main` 截出的上一個 release candidate。已回補到 `rc/1.104.0` 且已隨 `v1.104.0` 發佈的變更不包含在內

面向客戶的變更排在前面。測試、CI 和內部變更列在底部

:::danger[重大變更]

這些提示說明與 `v1.104.0`（最新穩定版）不同的使用者面向行為

**`ENFORCE_PRISMA_MIGRATION_CHECK=false` 現在會被忽略**，因此遷移失敗的 proxy 將不會啟動。這可避免新版本在過時的資料庫 schema 上提供流量並導致請求失敗。請參閱 [`v1.104.0` 重大變更](/release_notes/v1.104.0/v1-104-0) 和 [PR #44141](https://github.com/BerriAI/litellm/pull/44141)

**Bedrock GPT-5.6、GPT-6 和 GPT-6.1 從 Converse 移至原生 Chat Completions**，因此回應 id、`service_tier` 和 reasoning 欄位的結構會變更。請使用 `bedrock/converse/<model>` 以維持在 Converse。請參閱 [PR #44307](https://github.com/BerriAI/litellm/pull/44307)

**`/sso/debug/*` 會回傳 404，除非 `ENABLE_SSO_DEBUG=true`。**請參閱 [PR #43150](https://github.com/BerriAI/litellm/pull/43150)

:::

## 重點摘要 {#key-highlights}

- **第一天就支援新模型**：Claude Sonnet 5.5 跨 Anthropic、Bedrock、Bedrock Mantle、Vertex AI、Azure AI、OpenRouter 和 Perplexity，GPT-6.1 Sol 跨 OpenAI、Azure、Bedrock 和 OpenRouter，以及 Grok 4.7 on Bedrock 和 Vertex AI，共 78 個新的目錄項目
- **新的提供者與路由**：Prism、Sail 和 Cortecs 提供者，原生 xAI batches 與 files，Fireworks router models，以及以原生 Chat Completions 提供的 Bedrock GPT-5.6+
- **`litellm.agent()`**：透過 SDK 在 AI 閘道中執行 Claude Code、Codex、OpenCode 和 Deep Agents
- **Lens 與 Agent Traces**：OTLP trace ingestion 儲存在 ClickHouse 中並帶有對應支出，針對 traces 的範圍化 SQL、類聊天的執行檢視，以及由獨立 worker 執行的 Lens（Beta）調查
- **代理程式身分**：使用 Entra ID 身分註冊代理程式、驗證委派請求並強制執行權威代理程式權限
- **更快速的大規模 proxy**：單一 request-scoped Redis pipeline 用於 auth、spend、rate-limit 與 routing reads，buffered responses 使用 gzip，以及 usage pages 會從伺服器分頁載入 keys，而不是把每個 key 都載入瀏覽器

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新的提供者（3 個新提供者） {#new-providers-3-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| --- | --- | --- |
| [Prism](../../docs/providers/prism) | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 將 Prism inference 作為 OpenAI 相容的提供者，目錄中包含 DeepSeek V4 Flash 與 V4.1 Flash |
| Sail | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 12 個 Sail 模型，其中 `service_tier` 對應到 Sail 的 completion window，並按該 window 的價格計費，包括新的 `balanced` 等級 |
| Cortecs | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | Cortecs，一個 EU LLM router，作為 OpenAI 相容的提供者 |

### 擴充提供者端點支援 {#expanded-provider-endpoint-support}

| 提供者 | 端點 | 您可以做什麼 |
| --- | --- | --- |
| [xAI](../../docs/providers/xai) | `/v1/files`, `/v1/batches` | 執行原生 xAI batches 與 files |
| [Amazon Bedrock](../../docs/providers/bedrock) | `/v1/chat/completions` | 在 bedrock-runtime 的原生 Chat Completions 上提供 GPT-5.6、GPT-6 和 GPT-6.1，並提供 gpt-oss 和 Grok 的 `chat_completions/` opt-in |
| [Fireworks AI](../../docs/providers/fireworks_ai) | `/v1/chat/completions` | 路由至並列出 `auto`、`auto-instant` 和 `firerouter` routers |

## 新模型／更新模型 {#new-models--updated-models}

#### 新增模型支援（78 個新模型） {#new-model-support-78-new-models}

數量代表與 `v1.104.0` 相比新增的目錄識別碼，包括別名與區域變體。下方價格為本版本隨附的數值，以 USD 計；執行階段的 pricing-map 重新載入可更新它們。輸入與輸出欄位顯示基礎 token 費率；長上下文、快取、image-token 與其他特殊費率取決於模型

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100萬 tokens） | 輸出（$/100萬 tokens） | 功能 / 特殊定價 |
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
| Azure AI | `azure_ai/mistral-ocr-2505` | - | - | - | OCR；`ocr_cost_per_page`：$0.001 |
| Azure AI | `azure_ai/mistral-ocr-2512` | - | - | - | OCR；`ocr_cost_per_page`：$0.002 |
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
| OpenAI | `gpt-4o-mini-tts-2025-03-20` | - | $0.6 | $10 | 語音；`output_cost_per_second`：$0.00025 |
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
| Together AI | `together_ai/meta-llama/Meta-Llama-3.1-8B` | 16,384 | $0.2 | $0.2 | 完成 |
| Vertex AI | `vertex_ai/claude-sonnet-5-5` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/claude-sonnet-5-5@default` | 1,000,000 | $2 | $10 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出；PDF 輸入；電腦使用 |
| Vertex AI | `vertex_ai/gemini-3.8-flash-lite-tts` | 8,192 | $0.5 | $6 | 語音 |
| Vertex AI | `vertex_ai/gemini-3.8-flash-tts` | 8,192 | $0.5 | $9 | 語音 |
| Vertex AI | `vertex_ai/xai/grok-4.7` | 524,288 | $2 | $6 | 聊天；推理；視覺；工具呼叫；提示快取；結構化輸出 |

| Voyage AI | `voyage/rerank-1` | 8,000 | $0.05 | $0 | 重新排序 |
| Voyage AI | `voyage/rerank-lite-1` | 4,000 | $0.02 | $0 | 重新排序 |
| Voyage AI | `voyage/voyage-large-2-instruct` | 16,000 | $0.12 | $0 | 嵌入 |

#### 更新定價（59 個模型） {#updated-pricing-59-models}

| 提供者 / 模型 | 變更後的 token 價格（每 100 萬 token，USD） |
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
| `openrouter/openai/gpt-oss-120b` | 輸入：$0.15 到 $0.037；輸出：$0.6 到 $0.17；快取讀取：$0.075 到未設定 |
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

此登錄檔也會更新另外 244 筆項目的能力旗標、context/output 限制、非 token 費率，以及停用日期

<details>
<summary>已移除的目錄項目 (1)</summary>

`azure_ai/muse-spark-1.3`

</details>

### 新的提供者 {#new-providers}

- 新增 Prism 提供者 - [PR #41961](https://github.com/BerriAI/litellm/pull/41961)
- 新增 Sail 作為提供者，並將 service_tier 對應至其 completion window - [PR #42840](https://github.com/BerriAI/litellm/pull/42840)
- 新增 Cortecs 作為 OpenAI 相容提供者 - [PR #43872](https://github.com/BerriAI/litellm/pull/43872)

### Amazon Bedrock {#amazon-bedrock}

- 將 converse-stream 200 解析為沒有事件時，顯示為 502，而不是空白輪次 - [PR #43213](https://github.com/BerriAI/litellm/pull/43213)
- 在無法處理的圖片錯誤中保留提供者狀態碼 - [PR #43416](https://github.com/BerriAI/litellm/pull/43416)
- 新增 xai grok-4.7 定價並同步 llama、mistral large 2407 和 minimax m2.5 價格 - [PR #43623](https://github.com/BerriAI/litellm/pull/43623)
- 為 claude opus 5.5 和 sonnet 5.5 新增 bedrock_mantle 列 - [PR #43647](https://github.com/BerriAI/litellm/pull/43647)
- 新增 openai gpt-6.1-sol 全域與基礎列 - [PR #43758](https://github.com/BerriAI/litellm/pull/43758)
- 新增 openai.gpt-6.1-sol 美國 geo cris 和 Mantle 列 - [PR #43763](https://github.com/BerriAI/litellm/pull/43763)
- 在訊息中新增輸出設定的 beta 標頭 - [PR #43778](https://github.com/BerriAI/litellm/pull/43778)
- 將 gpt-6.1-sol 最大輸出 tokens 設為 131072 - [PR #43782](https://github.com/BerriAI/litellm/pull/43782)
- 保留適用的 beta 標頭 - [PR #43829](https://github.com/BerriAI/litellm/pull/43829)
- 為 thinking 顯示更新新增 beta 標頭 - [PR #43832](https://github.com/BerriAI/litellm/pull/43832)
- 為對話中途的工具變更新增 beta - [PR #43833](https://github.com/BerriAI/litellm/pull/43833)
- 接受沒有 content key 的 Converse 訊息 - [PR #43936](https://github.com/BerriAI/litellm/pull/43936)
- 預設原生提供 gpt-5.6+ chat completions，並為 gpt-oss 和 grok 提供 chat_completions/ 選用啟用 - [PR #44307](https://github.com/BerriAI/litellm/pull/44307)

### Anthropic {#anthropic}

- 丟棄 thinking 文字為空的 thinking blocks，不只是缺少簽章 - [PR #38049](https://github.com/BerriAI/litellm/pull/38049)
- 當 extra_body 隱藏直接用戶端標記時，將預設快取點向下 - [PR #43341](https://github.com/BerriAI/litellm/pull/43341)
- 將每輪控制 beta 傳送到 Azure AI Foundry - [PR #43415](https://github.com/BerriAI/litellm/pull/43415)
- 新增 claude-sonnet-5-5 模型定價 - [PR #43586](https://github.com/BerriAI/litellm/pull/43586)
- 更正 Claude Sonnet 5.5 功能與提供者金鑰 - [PR #43587](https://github.com/BerriAI/litellm/pull/43587)
- 將 dangerous-tool-use beta 傳送到 Azure AI Foundry - [PR #43934](https://github.com/BerriAI/litellm/pull/43934)
- 保留 thinking 顯示更新 beta - [PR #43969](https://github.com/BerriAI/litellm/pull/43969)

### Fireworks AI {#fireworks-ai}

- 路由並列出 auto、auto-instant 和 firerouter 路由器 - [PR #43641](https://github.com/BerriAI/litellm/pull/43641)

### Gemini 與 Vertex AI {#gemini-and-vertex-ai}

- 停止在 partner-model completion 中匯入 vertexai SDK - [PR #42274](https://github.com/BerriAI/litellm/pull/42274)
- 在憑證解析中保留舊版 bucket_name，並新增 GCS_BATCH_BUCKET_NAME 環境變數 - [PR #42803](https://github.com/BerriAI/litellm/pull/42803)
- 讓 Gemma 假串流可與已追蹤的 Responses 搭配運作 - [PR #43147](https://github.com/BerriAI/litellm/pull/43147)
- 將 seed 傳送到 Gemini API，而不是拒絕它 - [PR #43197](https://github.com/BerriAI/litellm/pull/43197)
- 在驗證 context caching 最小 tokens 時納入 tools - [PR #43319](https://github.com/BerriAI/litellm/pull/43319)
- 在 completion adapter 中保留 proxy_server_request - [PR #43536](https://github.com/BerriAI/litellm/pull/43536)
- 將每輪控制 beta 傳送給每則訊息的 output_config - [PR #43558](https://github.com/BerriAI/litellm/pull/43558)

### OpenAI {#openai}

- 將微調與自訂 gpt-5-chat 別名排除於 gpt-5 reasoning 路徑之外 - [PR #43185](https://github.com/BerriAI/litellm/pull/43185)
- 從定價頁面新增 openai gpt-6.1-sol - [PR #43738](https://github.com/BerriAI/litellm/pull/43738)
- 從定價頁面新增 openai gpt-6-astra ultrafast 層級價格 - [PR #43745](https://github.com/BerriAI/litellm/pull/43745)

### xAI {#xai}

- 新增原生 xAI batches 和 files 支援 - [PR #42812](https://github.com/BerriAI/litellm/pull/42812)

### 託管 vLLM {#hosted-vllm}

- 在重播的 assistant 訊息上保留 reasoning_content - [PR #43599](https://github.com/BerriAI/litellm/pull/43599)

### 模型目錄與定價 {#model-catalog-and-pricing}

- 同步 openrouter 價格並新增 perceptron-mk1.5 - [PR #43246](https://github.com/BerriAI/litellm/pull/43246)
- 新增 fireworks 僅限美國的 deepseek v4.1 flash priority 價格 - [PR #43247](https://github.com/BerriAI/litellm/pull/43247)
- 將 typesafe/jev-router 新增到成本對應表 - [PR #43248](https://github.com/BerriAI/litellm/pull/43248)
- 為 muse glimmer 30b 和 deepseek v4 flash vision exp 新增 fireworks priority 價格 - [PR #43252](https://github.com/BerriAI/litellm/pull/43252)
- 更正 fireworks_ai deepseek-v4p1-flash 定價 - [PR #43253](https://github.com/BerriAI/litellm/pull/43253)
- 登錄檢查 2026-09-26、MAI-Image-2.5-Flash 價格、Databricks Claude Opus 5.5、Azure Foundry 淘汰日期 - [PR #43254](https://github.com/BerriAI/litellm/pull/43254)
- 移除重複的 openrouter/perceptron/perceptron-mk1.5 項目 - [PR #43273](https://github.com/BerriAI/litellm/pull/43273)
- 依價格 API 值為 fireworks deepseek v4.1 flash 定價 - [PR #43311](https://github.com/BerriAI/litellm/pull/43311)
- 讓 OpenRouter、Together、Cohere 和 Azure AI 登錄值與官方來源同步 - [PR #43337](https://github.com/BerriAI/litellm/pull/43337)
- 更正 azure gpt-4o-mini tts、transcribe、別名與 MAI-Image-2.5 價格 - [PR #43357](https://github.com/BerriAI/litellm/pull/43357)
- 同步 deepseek、minimax、qwen 和 glm 列的 openrouter 價格 - [PR #43384](https://github.com/BerriAI/litellm/pull/43384)
- 從 openrouter deepseek-v4-pro-0813 移除過時的 cache hit 欄位 - [PR #43389](https://github.com/BerriAI/litellm/pull/43389)
- 依 Azure 定價頁面更新 azure_ai/grok-4.6 輸入價格 - [PR #43440](https://github.com/BerriAI/litellm/pull/43440)
- 新增 azure_ai/MAI-Cyber-1-Flash - [PR #43446](https://github.com/BerriAI/litellm/pull/43446)
- 從 models API 同步 openrouter 價格 - [PR #43506](https://github.com/BerriAI/litellm/pull/43506)
- 為 together_ai Salesforce/Llama-Rank-V1 新增 deprecation_date - [PR #43507](https://github.com/BerriAI/litellm/pull/43507)
- 將 together_ai gpt-oss-20b 和 gemma-4-31B-it deprecation_date 設為 2026-09-15 - [PR #43509](https://github.com/BerriAI/litellm/pull/43509)
- 新增 mistral OCR 定價與 azure 最大輸出限制 - [PR #43530](https://github.com/BerriAI/litellm/pull/43530)
- 登錄檢查 2026-09-28、openai deep-research 關閉日期、azure deepseek v4.1 flash 直接價格、vertex gemini 3.8 live avatar 價格、移除 azure_ai/muse-spark-1.3 - [PR #43566](https://github.com/BerriAI/litellm/pull/43566)
- 為 anthropic claude-sonnet-5-5 新增 web search 標記與模型頁面來源 - [PR #43584](https://github.com/BerriAI/litellm/pull/43584)
- 新增工具呼叫與 reasoning 標記，修正 nebius DeepSeek-V4.1-Flash 的最大輸出 - [PR #43588](https://github.com/BerriAI/litellm/pull/43588)
- 採用 deepseek-v4-flash-0731 和 v3.2-speciale 的 azure 限制 - [PR #43597](https://github.com/BerriAI/litellm/pull/43597)
- 讓 Azure、Bedrock、Copilot、Gemini、Groq、OpenAI 和 OpenRouter 項目與官方文件一致 - [PR #43598](https://github.com/BerriAI/litellm/pull/43598)
- 將 Vertex batch cache 價格新增至 vertex_ai/claude-sonnet-5-5 - [PR #43602](https://github.com/BerriAI/litellm/pull/43602)
- 新增 baseten DeepSeek-V4.1-Flash-Fast - [PR #43735](https://github.com/BerriAI/litellm/pull/43735)
- 將 fireworks up-to-4b 大小層級調降為定價頁面價格 - [PR #43740](https://github.com/BerriAI/litellm/pull/43740)
- 新增 azure 與 openrouter gpt-6.1-sol 列 - [PR #43744](https://github.com/BerriAI/litellm/pull/43744)
- 採用 models-sold-directly 的 azure context 限制 - [PR #43759](https://github.com/BerriAI/litellm/pull/43759)
- 為兩個 together_ai nvidia 列新增 deprecation_date - [PR #43809](https://github.com/BerriAI/litellm/pull/43809)
- 為 ember-1、nemotron 和 glm 5.3 美國列新增 fireworks priority 價格 - [PR #43811](https://github.com/BerriAI/litellm/pull/43811)
- 新增 Gemini Veo、Mistral 與 Azure Claude 4.5 的 deprecation 日期 - [PR #43857](https://github.com/BerriAI/litellm/pull/43857)
- 從定價頁面新增 openai gpt-image-2.5 batch 價格 - [PR #43869](https://github.com/BerriAI/litellm/pull/43869)
- 新增 vertex_ai gemini-3.8 flash tts 列 - [PR #43876](https://github.com/BerriAI/litellm/pull/43876)
- 為 anthropic claude-sonnet-4-5 新增 deprecation 日期 - [PR #43898](https://github.com/BerriAI/litellm/pull/43898)
- 新增 perplexity、openrouter、voyage 和 nebius 模型並修正登錄中繼資料 - [PR #43907](https://github.com/BerriAI/litellm/pull/43907)
- 將 baseten DeepSeek-V4.1-Flash 最大輸出提高到 262144 - [PR #43916](https://github.com/BerriAI/litellm/pull/43916)
- 從 prices api 新增 fireworks inkling priority 價格 - [PR #43949](https://github.com/BerriAI/litellm/pull/43949)
- 從 models API 同步 openrouter 價格 - [PR #43950](https://github.com/BerriAI/litellm/pull/43950)
- 將 GLM-5.3-Flash 的 supports_vision 設為 true - [PR #43951](https://github.com/BerriAI/litellm/pull/43951)
- 將 fireworks deepseek v4.1 flash 重新定價為 2026-10-01 定價更新 - [PR #44024](https://github.com/BerriAI/litellm/pull/44024)
- 新增 vertex_ai/xai/grok-4.7 定價 - [PR #44059](https://github.com/BerriAI/litellm/pull/44059)
- 還原較晚的 azure Models API 淘汰日期並為 gpt-6.1-sol 設定日期 - [PR #44072](https://github.com/BerriAI/litellm/pull/44072)
- 從 models API 同步 openrouter 價格 - [PR #44105](https://github.com/BerriAI/litellm/pull/44105)
- 根據 Azure 已淘汰模型頁面新增 azure_ai deprecation 日期 - [PR #44142](https://github.com/BerriAI/litellm/pull/44142)
- 採用 Azure 排程中的 azure_ai claude-sonnet-4-5 淘汰日期 - [PR #44145](https://github.com/BerriAI/litellm/pull/44145)

## LLM API 端點 {#llm-api-endpoints}

### Responses API {#responses-api}

- 將 guardrail 預呼叫阻擋以帶有型別化輸出項目的 SSE 傳送 - [PR #42507](https://github.com/BerriAI/litellm/pull/42507)
- 在輸出前的 stream 中斷時改為備援，讓截斷的 stream 失敗，並遵守 request_timeout - [PR #43133](https://github.com/BerriAI/litellm/pull/43133)
- 在 response.completed frame 之前記錄串流化 /v1/responses 容器擁有權 - [PR #43140](https://github.com/BerriAI/litellm/pull/43140)
- 將 Responses 生命週期事件延後到輸出之後，以便輸出前的備援只宣告一個回應 - [PR #43238](https://github.com/BerriAI/litellm/pull/43238)
- 在迭代迴圈上執行 stream 失敗與成功的 hooks，而不是阻塞它 - [PR #43270](https://github.com/BerriAI/litellm/pull/43270)
- 在串流 /v1/responses 上發出推理項目，以供僅簽章思考使用 - [PR #43414](https://github.com/BerriAI/litellm/pull/43414)

### Anthropic Messages API {#anthropic-messages-api}

- 在 /v1/messages stream 失敗時傳送真正的錯誤事件 - [PR #41826](https://github.com/BerriAI/litellm/pull/41826)
- 將 Responses bridge stream 失敗顯示為 Anthropic 錯誤事件 - [PR #43126](https://github.com/BerriAI/litellm/pull/43126)
- 將 `litellm.llms.anthropic.experimental_pass_through` 套件重新命名為 `pass_through` - [PR #43329](https://github.com/BerriAI/litellm/pull/43329)
- 當沒有備援能接手時，實時串流 /v1/messages 生命週期 frame - [PR #43600](https://github.com/BerriAI/litellm/pull/43600)

### 代理程式與 Agent-to-Agent {#agents-and-agent-to-agent}

- 新增 identity 儲存與驗證合約 - [PR #43720](https://github.com/BerriAI/litellm/pull/43720)
- 強制執行權威 agent 權限 - [PR #43721](https://github.com/BerriAI/litellm/pull/43721)
- 驗證 Entra identity 與委派請求 - [PR #43722](https://github.com/BerriAI/litellm/pull/43722)
- 新增 identity 註冊與儀表板控制 - [PR #43723](https://github.com/BerriAI/litellm/pull/43723)

### `litellm.agent()`（SDK） {#litellmagent-sdk}

- 新增 `litellm.agent()`，透過 AI gateway 執行 Claude Code、Codex、OpenCode 與 Deep Agents - [PR #43885](https://github.com/BerriAI/litellm/pull/43885)

### 向量儲存與 RAG {#vector-stores-and-rag}

- 在 /v1/rag/query 強制執行 key/team vector_stores allowlist - [PR #43953](https://github.com/BerriAI/litellm/pull/43953)

### 音訊 {#audio}

- 尊重 Groq Whisper 的 base_url 別名，並將其回報為 api base - [PR #43917](https://github.com/BerriAI/litellm/pull/43917)

### 直通端點 {#pass-through-endpoints}

- 從 websocket passthrough 移除呼叫端憑證 - [PR #43855](https://github.com/BerriAI/litellm/pull/43855)
- 透過 router 轉送 Azure passthrough body model groups - [PR #43896](https://github.com/BerriAI/litellm/pull/43896)
- 在 token 限制下保留 decision request bodies - [PR #43920](https://github.com/BerriAI/litellm/pull/43920)

### 一般 {#general}

- 透過建構方式讓 `_litellm_*` kwargs 不進入提供者 request body - [PR #43221](https://github.com/BerriAI/litellm/pull/43221)
- 在任何提供者呼叫前，只驗證一次 stream_chunk_size - [PR #43222](https://github.com/BerriAI/litellm/pull/43222)
- 讓提交的 body 不出現在 422 驗證錯誤中 - [PR #43231](https://github.com/BerriAI/litellm/pull/43231)
- 修復串接的 JSON tool call arguments - [PR #43260](https://github.com/BerriAI/litellm/pull/43260)
- 計算 Gemini function_declarations tools - [PR #43417](https://github.com/BerriAI/litellm/pull/43417)
- 適當分類 internal param，以避免洩漏到 request 中 - [PR #43783](https://github.com/BerriAI/litellm/pull/43783)
- 讓 silent_model 不出現在 embedding 提供者請求中 - [PR #44064](https://github.com/BerriAI/litellm/pull/44064)

## 管理端點／UI {#management-endpoints--ui}

### 管理員 UI {#admin-ui}

- 讓所有表格中的金額與數量欄位靠右對齊 - [PR #37889](https://github.com/BerriAI/litellm/pull/37889)
- 將 access group MCP 與 agent 選取顯示為可換行的 chip - [PR #41228](https://github.com/BerriAI/litellm/pull/41228)
- 在 Logs 搜尋、表格與抽屜中顯示 x-litellm-call-id - [PR #42436](https://github.com/BerriAI/litellm/pull/42436)
- 在 Tag Management 頁面依名稱與描述篩選標籤 - [PR #42949](https://github.com/BerriAI/litellm/pull/42949)
- 將 All Models 分頁重新命名為 Deployed Models，並將模型篩選器改為 All Proxy Models - [PR #43638](https://github.com/BerriAI/litellm/pull/43638)
- 新增 model leaderboard 頁面 - [PR #43649](https://github.com/BerriAI/litellm/pull/43649)
- 顯示擁有發現 tool 之 key 的使用者 - [PR #43892](https://github.com/BerriAI/litellm/pull/43892)
- 採用全新的 LiteLLM 標誌與單字母標誌 - [PR #43913](https://github.com/BerriAI/litellm/pull/43913)
- 從 Cost Optimization 導覽項目移除 Beta 徽章 - [PR #43967](https://github.com/BerriAI/litellm/pull/43967)
- 為 model leaderboard 加上獨特的獎盃圖示 - [PR #44036](https://github.com/BerriAI/litellm/pull/44036)
- 在 model leaderboard 上顯示每日 token 總數 - [PR #44044](https://github.com/BerriAI/litellm/pull/44044)
- 在儲存負載中排除未設定的 callback select params - [PR #44213](https://github.com/BerriAI/litellm/pull/44213)
- 縮小側邊欄標誌，避免它比頁面標題更搶眼 - [PR #44247](https://github.com/BerriAI/litellm/pull/44247)

### 使用量與分析 {#usage-and-analytics}

- 匯總後的每日活動端點預設回傳 `breakdown.api_keys` 中前 100 個 key（總數不變）；將 `api_key_limit` 設為最多 1000 - [PR #43398](https://github.com/BerriAI/litellm/pull/43398)
- 為所有 usage 實體提供有界的每日活動路由（aggregated、search、model_top_keys、export、cache_leakage_keys） - [PR #43408](https://github.com/BerriAI/litellm/pull/43408)
- Usage 頁面改用有界的每日活動路由，而不是在用戶端儲存所有 key - [PR #43409](https://github.com/BerriAI/litellm/pull/43409)
- 從每日花費恢復 session key 擁有者，以便進行 usage 歸因 - [PR #43642](https://github.com/BerriAI/litellm/pull/43642)
- 透過每個 key 兩筆 spend log row 查找雜湊後的 key 名稱 - [PR #43656](https://github.com/BerriAI/litellm/pull/43656)
- 為 gateway 花費與合併後 PR 提供原生 ROI 計算器 - [PR #43669](https://github.com/BerriAI/litellm/pull/43669)
- 將已完成的 batch cost row 歸因到每日活動中的 /batches - [PR #43870](https://github.com/BerriAI/litellm/pull/43870)
- 排除 entity ids 時保留 NULL entity ids - [PR #44139](https://github.com/BerriAI/litellm/pull/44139)
- 拒絕非標準格式的每日活動日期 - [PR #44143](https://github.com/BerriAI/litellm/pull/44143)

### 金鑰、團隊與驗證 {#keys-teams-and-authentication}

- 無需每個成員的 transaction fan-out 即可刪除大型 team - [PR #42998](https://github.com/BerriAI/litellm/pull/42998)
- 在過期 key 驗證失敗時記錄 key 擁有者 identity - [PR #43105](https://github.com/BerriAI/litellm/pull/43105)
- 以 ENABLE_SSO_DEBUG 為條件保護 /sso/debug 路由，預設關閉 - [PR #43150](https://github.com/BerriAI/litellm/pull/43150)
- 登入時將 SSO 顯示名稱儲存為 user_alias - [PR #44065](https://github.com/BerriAI/litellm/pull/44065)

### Proxy 組態 {#proxy-configuration}

- 新增 LITELLM_DISABLE_LAZY_ROUTES，以在啟動時註冊可選 router - [PR #43911](https://github.com/BerriAI/litellm/pull/43911)

### CLI 與程式碼代理程式 {#cli-and-coding-agents}

- 重用已儲存的 agent 設定並新增重新設定 - [PR #43392](https://github.com/BerriAI/litellm/pull/43392)

### 部署 {#deployment}

- 將 wheel 路徑維持在 Windows MAX_PATH 之下，以供 Store Python 使用 - [PR #43903](https://github.com/BerriAI/litellm/pull/43903)
- 從 non-root 映像中移除無作用的 PROXY_EXTRAS_SOURCE 切換 - [PR #44097](https://github.com/BerriAI/litellm/pull/44097)
- 當資料庫設定在啟動時失敗時，一律結束 - [PR #44141](https://github.com/BerriAI/litellm/pull/44141)

### Terraform {#terraform}

- 在 unified_access_group 建立中接受 2xx 狀態碼 - [PR #42461](https://github.com/BerriAI/litellm/pull/42461)

## AI 整合 {#ai-integrations}

### Lens 與代理程式追蹤 {#lens-and-agent-traces}

- 新增 Rust 儲存基礎架構 - [PR #43819](https://github.com/BerriAI/litellm/pull/43819)
- 以獨立 worker 分析 agent 活動 - [PR #43889](https://github.com/BerriAI/litellm/pull/43889)
- Logs 中的 agent traces 分頁，附時間軸與 otel 設定指南 - [PR #43891](https://github.com/BerriAI/litellm/pull/43891)
- 修正 ClickHouse rollup 分割、dedupe key 與保留期限變更 - [PR #43901](https://github.com/BerriAI/litellm/pull/43901)
- 將 OTLP ingestion 移植到目前的 trace 基礎架構 - [PR #43915](https://github.com/BerriAI/litellm/pull/43915)
- 自動將 spend 儲存在 ClickHouse 中 - [PR #43928](https://github.com/BerriAI/litellm/pull/43928)
- 調查 sampled traces 並保留 batch 結果 - [PR #43942](https://github.com/BerriAI/litellm/pull/43942)
- agent traces 以側邊抽屜開啟，並顯示類 chat 的 run 檢視 - [PR #43972](https://github.com/BerriAI/litellm/pull/43972)
- 改善 trace ingestion 與 trace 詳細資訊 - [PR #43975](https://github.com/BerriAI/litellm/pull/43975)
- 透過 virtual key 追蹤 worker spend - [PR #43989](https://github.com/BerriAI/litellm/pull/43989)
- 重新命名 Lens 內部結構，並將其 API 從 `/engine` 移至 `/lens` - [PR #44034](https://github.com/BerriAI/litellm/pull/44034)
- 注入 tracing receiver 與存取 context - [PR #44035](https://github.com/BerriAI/litellm/pull/44035)
- 將 traces 與設定移入 Lens - [PR #44068](https://github.com/BerriAI/litellm/pull/44068)
- 以 Rust 標準化 agent spans - [PR #44071](https://github.com/BerriAI/litellm/pull/44071)
- 新增範圍限定的 SQL 查詢與感知 schema 的說明 - [PR #44085](https://github.com/BerriAI/litellm/pull/44085)
- 簡化設定與調查工作流程 - [PR #44089](https://github.com/BerriAI/litellm/pull/44089)
- 在 tracing 設定中新增 test trace、tracing key 與 otel endpoints - [PR #44090](https://github.com/BerriAI/litellm/pull/44090)
- 將 lens trace services 標示為 agents - [PR #44116](https://github.com/BerriAI/litellm/pull/44116)
- 僅在保留期限變更時重新計算 ClickHouse TTL 資訊 - [PR #44117](https://github.com/BerriAI/litellm/pull/44117)

### 防護欄 {#guardrails}

- 在每種請求形式上遵循 experimental_use_latest_role_message_only - [PR #42447](https://github.com/BerriAI/litellm/pull/42447)
- 啟用明確的 PANW MCP 輸出掃描 - [PR #43109](https://github.com/BerriAI/litellm/pull/43109)
- 在每個 HTTP 防護欄中遵循 litellm_params.timeout - [PR #43134](https://github.com/BerriAI/litellm/pull/43134)
- 將 agent 365 修正為生產端點，並以錯誤層級記錄選擇加入的 fail_open - [PR #43189](https://github.com/BerriAI/litellm/pull/43189)
- 使用請求的 pre-call 防護欄掃描擷取到的 vector store chunks - [PR #43271](https://github.com/BerriAI/litellm/pull/43271)
- 在自訂程式碼 http_request 中封鎖私人目的地，並限制防護欄執行時間 - [PR #43280](https://github.com/BerriAI/litellm/pull/43280)
- 保留 Presidio 輸出選擇與還原 - [PR #43401](https://github.com/BerriAI/litellm/pull/43401)
- 使用防護欄掃描並遮罩最上層指示 - [PR #43629](https://github.com/BerriAI/litellm/pull/43629)
- 將設定的 gateway_name 從 noma_v2 傳送到 Noma - [PR #43678](https://github.com/BerriAI/litellm/pull/43678)
- 將請求對話與工具呼叫傳送到 post-call 監控器 - [PR #43770](https://github.com/BerriAI/litellm/pull/43770)
- 在 Azure Prompt Shield 中掃描 Responses API 輸入 - [PR #43786](https://github.com/BerriAI/litellm/pull/43786)
- 將未知的 straiker api_version 視為未設定，而不是略過防護欄 - [PR #43956](https://github.com/BerriAI/litellm/pull/43956)
- 在 Azure Text Moderation 中掃描 Responses API 輸入 - [PR #43965](https://github.com/BerriAI/litellm/pull/43965)
- 將 Straiker `sk_agt_` 金鑰路由到 v3，並在缺少 verdict 時採取封閉失敗 - [PR #44011](https://github.com/BerriAI/litellm/pull/44011)
- 還原 Azure 防護欄 get_user_prompt 派發並允許記錄 - [PR #44067](https://github.com/BerriAI/litellm/pull/44067)

### 記錄與可觀測性 {#logging-and-observability}

- 新增 Databricks Zerobus 追蹤記錄回呼 - [PR #42013](https://github.com/BerriAI/litellm/pull/42013)
- 保持 DataLakeServiceClient 存活直到其 TTL 到期 - [PR #43082](https://github.com/BerriAI/litellm/pull/43082)
- 清理物件 repr 與巢狀區域變數中的 PII 和 secrets，新增 SENTRY_SEND_DEFAULT_PII 選擇加入 - [PR #43123](https://github.com/BerriAI/litellm/pull/43123)
- 保持 team 回呼憑證不進入已儲存的請求主體 - [PR #43217](https://github.com/BerriAI/litellm/pull/43217)
- 當 proxy 設定中設為 turn_off_message_logging 時，遮罩 raw_request - [PR #43219](https://github.com/BerriAI/litellm/pull/43219)
- 依請求階段分離 post-response service spans，並依 operation 命名 redis spans - [PR #43237](https://github.com/BerriAI/litellm/pull/43237)
- tenant 目的地上的 datastore spans 使用 Excluded_services 退出選項 - [PR #43278](https://github.com/BerriAI/litellm/pull/43278)
- 為 OpenTelemetry v2 新增 SigNoz 預設設定 - [PR #43296](https://github.com/BerriAI/litellm/pull/43296)
- 使用 x-api-key 將 spans 傳送到 app.langtrace.ai/api/trace - [PR #43322](https://github.com/BerriAI/litellm/pull/43322)
- 在 langfuse usage_details 中傳送 cache 與 reasoning tokens - [PR #43553](https://github.com/BerriAI/litellm/pull/43553)
- 保持請求主體憑證不進入已儲存的 spend-log 請求 - [PR #43635](https://github.com/BerriAI/litellm/pull/43635)
- 為每小時 S3 資料夾新增 s3_partition_granularity 選項 - [PR #43748](https://github.com/BerriAI/litellm/pull/43748)
- 在 OTel v2 下，於 otel 旁註冊 UI 設定的 arize 回呼 - [PR #43906](https://github.com/BerriAI/litellm/pull/43906)
- 命名 Data Lake 物件時不使用 base64 padding 或斜線 - [PR #43914](https://github.com/BerriAI/litellm/pull/43914)
- 在已儲存的 spend logs 中保持工具負載與 logprobs 不被遮罩 - [PR #44075](https://github.com/BerriAI/litellm/pull/44075)
- 容忍非 dict 的 callback_settings.otel，並忽略裸露的 EXCLUDED_SERVICES 環境變數 - [PR #44086](https://github.com/BerriAI/litellm/pull/44086)
- 避免讓客戶端 call ids 共用同一個 Data Lake 檔案 - [PR #44099](https://github.com/BerriAI/litellm/pull/44099)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

### 成本追蹤 {#cost-tracking}

- 保持已提供的 service_tier 在串流區塊與 spend rows 中 - [PR #42870](https://github.com/BerriAI/litellm/pull/42870)
- 在 spend logs 中記錄請求是否使用了客戶端轉送的 Anthropic OAuth token - [PR #43063](https://github.com/BerriAI/litellm/pull/43063)
- 以新的 cost_per_second 欄位，對 chat 按秒計價只計一次 - [PR #43614](https://github.com/BerriAI/litellm/pull/43614)
- 停止將 optional_params 複製到回應 hidden params - [PR #43637](https://github.com/BerriAI/litellm/pull/43637)
- 以 ultrafast 長上下文費率計費超過 272k 的 ultrafast prompts - [PR #43764](https://github.com/BerriAI/litellm/pull/43764)
- 對自訂價格的 deployments 以目錄費率計費 service tiers - [PR #43890](https://github.com/BerriAI/litellm/pull/43890)

### 預算 {#budgets}

- 在每個 API 介面上計算提供者預算支出 - [PR #38172](https://github.com/BerriAI/litellm/pull/38172)
- 依團隊成員預算的設定百分比寄送電子郵件警示 - [PR #42665](https://github.com/BerriAI/litellm/pull/42665)
- 在零成本預算述詞中解析 model_group_alias - [PR #43512](https://github.com/BerriAI/litellm/pull/43512)

### 速率限制 {#rate-limiting}

- 新增 fail_closed_rate_limit_enforcement，當 Redis rate limit 計數器無法存取時，以 503 拒絕請求 - [PR #43251](https://github.com/BerriAI/litellm/pull/43251)

## MCP 閘道 {#mcp-gateway}

- 在工具介面間共用相容性認知的結果轉換 - [PR #43089](https://github.com/BerriAI/litellm/pull/43089)
- 將 Microsoft 365（Graph）server 新增至 MCP 目錄 - [PR #43099](https://github.com/BerriAI/litellm/pull/43099)
- 設定 protocol versions 與 capability discovery - [PR #43169](https://github.com/BerriAI/litellm/pull/43169)
- 回報可達性而不使用已儲存的憑證 - [PR #43240](https://github.com/BerriAI/litellm/pull/43240)
- 對齊 hub 發布狀態與控制項 - [PR #43241](https://github.com/BerriAI/litellm/pull/43241)
- 採用共用的 server 解析與呼叫者授權 - [PR #43263](https://github.com/BerriAI/litellm/pull/43263)
- 掃描並釘選上游工具描述 - [PR #43283](https://github.com/BerriAI/litellm/pull/43283)
- 將 OpenAPI 清單限制在精確的 server prefix，並在 server 儲存時移除上游 OAuth metadata - [PR #43608](https://github.com/BerriAI/litellm/pull/43608)
- 在 key、team 與 MCP server 儲存後維持 MCP permissions 可見 - [PR #43810](https://github.com/BerriAI/litellm/pull/43810)
- 解析非 admin keys 與 dashboard sessions 的團隊授予 toolsets - [PR #43908](https://github.com/BerriAI/litellm/pull/43908)

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

### Auto Router 與模型路由 {#auto-router-and-model-routing}

- 從周圍散文中解析 classifier verdict，而不是落到預設 tier - [PR #43215](https://github.com/BerriAI/litellm/pull/43215)
- 選擇加入 prompt-cache 成本路由 - [PR #43232](https://github.com/BerriAI/litellm/pull/43232)
- 在一次 Redis 往返中取得冷卻狀態與用量計數器 - [PR #43320](https://github.com/BerriAI/litellm/pull/43320)
- 一致地比較歷史與新節省 - [PR #43348](https://github.com/BerriAI/litellm/pull/43348)
- 將 Claude Code 背景工作階段繫結到其自動路由器 - [PR #43767](https://github.com/BerriAI/litellm/pull/43767)
- 移除 pinned deployment 無法解密的加密 reasoning - [PR #43781](https://github.com/BerriAI/litellm/pull/43781)
- 將每次請求的路由讀取放在 context variables 上，而不是公開方法 kwargs - [PR #43814](https://github.com/BerriAI/litellm/pull/43814)
- 在路由預先擷取中遵守冷卻讀取間隔 - [PR #43815](https://github.com/BerriAI/litellm/pull/43815)
- 顯示歷史節省的實際與基準支出 - [PR #44057](https://github.com/BerriAI/litellm/pull/44057)

### 快取、資料庫與執行階段 {#caching-database-and-runtime}

- 新增 maximum_daily_tag_spend_retention_period 清理設定 - [PR #39221](https://github.com/BerriAI/litellm/pull/39221)
- 讓 SpendLogToolIndex 擁有自己的清理預算份額，並記錄每次執行摘要 - [PR #41768](https://github.com/BerriAI/litellm/pull/41768)
- 透過節點層級的 pub/sub client 在 Redis Cluster 上傳播 auth 快取失效 - [PR #43110](https://github.com/BerriAI/litellm/pull/43110)
- 在 admission 與 post-call accounting 之間維持一個 spend counter batch - [PR #43369](https://github.com/BerriAI/litellm/pull/43369)
- 一個以請求為範圍的 Redis pipeline，用於 auth、spend、rate-limit 與 routing 讀取 - [PR #43407](https://github.com/BerriAI/litellm/pull/43407)
- 透過 async wrapper 執行 aresponses，使 cache 只讀取一次 - [PR #43769](https://github.com/BerriAI/litellm/pull/43769)
- 透過請求 Redis pipeline 重新整理 auth 管理物件 - [PR #43776](https://github.com/BerriAI/litellm/pull/43776)
- 每個 backend 一個 post-call Redis pipeline，用於 spend、rate-limit、routing 與 response-cache 寫入 - [PR #43779](https://github.com/BerriAI/litellm/pull/43779)
- 在 migration job 中建置 SpendLogs indexes，而不是在 migrations 中建置 - [PR #43948](https://github.com/BerriAI/litellm/pull/43948)
- 立即將 response-cache SET 寫入 Redis，而不是在 post-call batch 上寫入 - [PR #43973](https://github.com/BerriAI/litellm/pull/43973)
- 為接受 gzip 的用戶端壓縮緩衝回應 - [PR #44052](https://github.com/BerriAI/litellm/pull/44052)
- 限制 partitioned SpendLogs index 建置的鎖定等待時間 - [PR #44109](https://github.com/BerriAI/litellm/pull/44109)
- 當 migration job 建置 indexes 時，交給 libpq root cert，而不是 Prisma 的 sslcert - [PR #44203](https://github.com/BerriAI/litellm/pull/44203)

### 依賴項更新 {#dependency-updates}

- 升級 pyjwt、moment 與 brace-expansion 以通過 osv-scan - [PR #43792](https://github.com/BerriAI/litellm/pull/43792)
- 升級 oauthlib 至 4.0.0 以通過 osv-scan - [PR #43899](https://github.com/BerriAI/litellm/pull/43899)
- 升級 gitpython 與 tornado，將 diskcache osv ignore 延長至 11 月 1 日 - [PR #43961](https://github.com/BerriAI/litellm/pull/43961)
- 將 pypdf 從 6.16.2 升級至 6.19.0 - [PR #44033](https://github.com/BerriAI/litellm/pull/44033)

## 文件更新 {#documentation-updates}

- 將讀者導向安全公告郵寄清單註冊頁面 - [PR #43713](https://github.com/BerriAI/litellm/pull/43713)

## 測試、CI 與內部變更 {#tests-ci-and-internal-changes}

這 98 個 PR 變更了測試、CI、貢獻者工具、發佈封裝，或尚未接到使用者可見路徑的 Rust 執行階段支架。它們本身不會變更 proxy 或 SDK 行為

<details>
<summary>測試 (48)</summary>

- 為 e2e 套件加入逐測試 metadata 型別 - [PR #42044](https://github.com/BerriAI/litellm/pull/42044)
- 記錄每個 e2e 測試的步驟，從 ProxyClient 開始 - [PR #42393](https://github.com/BerriAI/litellm/pull/42393)
- 從 litellm 套件位置解析空白 S3 gateway repo 根目錄 - [PR #42911](https://github.com/BerriAI/litellm/pull/42911)
- 透過正式版 AsyncHTTPHandler 固定 async 5xx 重試 - [PR #43080](https://github.com/BerriAI/litellm/pull/43080)
- 將測試移入啟用中的 CI 選擇 - [PR #43235](https://github.com/BerriAI/litellm/pull/43235)
- 在每個管理路由中固定 team-admin 狀態碼矩陣 - [PR #43249](https://github.com/BerriAI/litellm/pull/43249)
- 固定伺服器解析與授權行為 - [PR #43261](https://github.com/BerriAI/litellm/pull/43261)
- 將 canary 套件中的每個含憑證參數分類 - [PR #43298](https://github.com/BerriAI/litellm/pull/43298)
- 憑證 canary 套件測試架構 - [PR #43300](https://github.com/BerriAI/litellm/pull/43300)
- 掃描 proxy 記錄、指標、Datadog intake 與 Logs drawer 中的憑證 canary - [PR #43306](https://github.com/BerriAI/litellm/pull/43306)
- 請求路徑憑證 canary 槽位 D1-D4 - [PR #43307](https://github.com/BerriAI/litellm/pull/43307)
- MCP 與直通憑證的憑證 canary 槽位 - [PR #43308](https://github.com/BerriAI/litellm/pull/43308)
- 已儲存設定的憑證 canary 槽位 - [PR #43309](https://github.com/BerriAI/litellm/pull/43309)
- 在每個 logging callback 測試後清空 logging worker，避免後續測試繼承其事件 - [PR #43344](https://github.com/BerriAI/litellm/pull/43344)
- 停止 VCR 記錄與回放測試自身的 localhost upstream - [PR #43346](https://github.com/BerriAI/litellm/pull/43346)
- 將 /v1/messages 合約分組到 tests/integration/messages_endpoint 下 - [PR #43352](https://github.com/BerriAI/litellm/pull/43352)
- 移除字串子片段防護 test_default_api_base - [PR #43355](https://github.com/BerriAI/litellm/pull/43355)
- 以擷取的 Claude Code 請求為基礎建立原生 /v1/messages reasoning 整合測試 - [PR #43361](https://github.com/BerriAI/litellm/pull/43361)
- 從 control plane replicas 讀回管理路由 - [PR #43373](https://github.com/BerriAI/litellm/pull/43373)
- 斷言 Gemma responses 串流實際回報的用量 - [PR #43422](https://github.com/BerriAI/litellm/pull/43422)
- 在 wheel 檢查中強制執行共用 upstream 錯誤合約 - [PR #43520](https://github.com/BerriAI/litellm/pull/43520)
- 在 team-admin 矩陣中固定 org-admin 狀態碼 - [PR #43592](https://github.com/BerriAI/litellm/pull/43592)
- 回呼憑證 canary 槽位 C1-C3 與 D5 - [PR #43630](https://github.com/BerriAI/litellm/pull/43630)
- 更新已淘汰的 OpenAI tool-call models - [PR #43676](https://github.com/BerriAI/litellm/pull/43676)
- 接受繼承 Converse routing 的區域別名 - [PR #43785](https://github.com/BerriAI/litellm/pull/43785)
- 修復 MCP Responses 與 budget fixtures - [PR #43788](https://github.com/BerriAI/litellm/pull/43788)
- 在記錄 shadow callbacks 之前，先讓共用 logging worker 穩定下來 - [PR #43847](https://github.com/BerriAI/litellm/pull/43847)
- 修復 completion、SAIL 與 spend-log fixtures - [PR #43902](https://github.com/BerriAI/litellm/pull/43902)
- 在 auth 測試中失敗的 live call 後還原 AWS 環境變數 - [PR #43921](https://github.com/BerriAI/litellm/pull/43921)
- 更新具資格的已淘汰 OpenAI fixtures - [PR #43938](https://github.com/BerriAI/litellm/pull/43938)
- 在 proxy_server 測試中限定 user_api_key_auth 覆寫範圍 - [PR #43952](https://github.com/BerriAI/litellm/pull/43952)
- 修復過時測試並移動已淘汰的 OpenAI text-completion fixtures - [PR #43958](https://github.com/BerriAI/litellm/pull/43958)
- 修復過時測試與不穩定的 CI 基礎架構 - [PR #43983](https://github.com/BerriAI/litellm/pull/43983)
- 將 DB 與 Redis 支援的 proxy 測試移入 tests/integration - [PR #43996](https://github.com/BerriAI/litellm/pull/43996)
- 將 auth、hooks、policy_engine 與 client 測試移入 tests/unit/proxy - [PR #43998](https://github.com/BerriAI/litellm/pull/43998)
- 將 management_endpoints、management_helpers 與 guardrails 測試移入 tests/unit/proxy - [PR #44003](https://github.com/BerriAI/litellm/pull/44003)
- 將 utils、agent_endpoints 與 endpoint 測試移入 tests/unit/proxy - [PR #44006](https://github.com/BerriAI/litellm/pull/44006)
- 注入 HIBP client 與 MCP 迴圈時鐘，讓兩個後端測試停止不穩定 - [PR #44007](https://github.com/BerriAI/litellm/pull/44007)
- 將 proxy_server、_experimental 與 db 測試移入 tests/unit/proxy - [PR #44012](https://github.com/BerriAI/litellm/pull/44012)
- 將 middleware、spend_tracking、pass_through、common_utils 與 root proxy 測試移入 tests/unit/proxy - [PR #44015](https://github.com/BerriAI/litellm/pull/44015)
- 刪除舊版 proxy 測試樹，並依 glob 分片 tests/unit/proxy - [PR #44018](https://github.com/BerriAI/litellm/pull/44018)
- 對同步呼叫仍可使用的 Sail 視窗進行計費 - [PR #44058](https://github.com/BerriAI/litellm/pull/44058)
- 在沒有資料庫 URL 的情況下執行 db push timeout hint 測試 - [PR #44073](https://github.com/BerriAI/litellm/pull/44073)
- 將 1ms timeout 的 deployment 排除在提供者快取之外 - [PR #44082](https://github.com/BerriAI/litellm/pull/44082)
- 將 live-provider 舊版測試移入 tests/e2e - [PR #44120](https://github.com/BerriAI/litellm/pull/44120)
- 將舊版 proxy、router 與 Redis 測試移入 tests/integration - [PR #44128](https://github.com/BerriAI/litellm/pull/44128)
- 斷言已儲存的 Straiker api_version v1 與 `sk_agt_` 金鑰會路由到 v3 - [PR #44153](https://github.com/BerriAI/litellm/pull/44153)
- 修復在排程的 main CI 上為紅色的過時與污染性測試 - [PR #44229](https://github.com/BerriAI/litellm/pull/44229)

</details>

<details>
<summary>CI (3)</summary>

- 當出現新的未受限 SQL IN 清單時失敗，並新增 Prisma 分塊 helper - [PR #42629](https://github.com/BerriAI/litellm/pull/42629)
- 將每週發佈週期與 Linear releases 同步 - [PR #43636](https://github.com/BerriAI/litellm/pull/43636)
- 對照本機 Redis 測試 Redis 行為並輸出簡短 traceback - [PR #44062](https://github.com/BerriAI/litellm/pull/44062)

</details>

<details>
<summary>程式碼品質與貢獻者工具 (19)</summary>

- 每日清理新鮮技術債，滾動 PR (2026-09-25) - [PR #43151](https://github.com/BerriAI/litellm/pull/43151)
- 新增共用伺服器解析器且不變更呼叫端 - [PR #43262](https://github.com/BerriAI/litellm/pull/43262)
- 在 5 個檔案中以已驗證型別取代 Any - [PR #43304](https://github.com/BerriAI/litellm/pull/43304)
- 僅在 P0 回歸時加入 backport-stable 標籤 - [PR #43351](https://github.com/BerriAI/litellm/pull/43351)
- 以 TeamAccess.allows 回應每次團隊存取檢查 - [PR #43364](https://github.com/BerriAI/litellm/pull/43364)
- 整併 hub 發佈判定條件 - [PR #43394](https://github.com/BerriAI/litellm/pull/43394)
- 清理 2026-09-27 的新鮮技術債 - [PR #43538](https://github.com/BerriAI/litellm/pull/43538)
- 在 8 個檔案中以已驗證型別取代 Any - [PR #43551](https://github.com/BerriAI/litellm/pull/43551)
- 移除 UI、migration 與 CODEOWNERS 的自有擁有者 - [PR #43653](https://github.com/BerriAI/litellm/pull/43653)
- 清理 2026-09-28 的新鮮技術債 - [PR #43674](https://github.com/BerriAI/litellm/pull/43674)
- 在 7 個檔案中以已驗證型別取代 Any - [PR #43704](https://github.com/BerriAI/litellm/pull/43704)
- 清理 2026-09-29 的新鮮技術債 - [PR #43830](https://github.com/BerriAI/litellm/pull/43830)
- 在 7 個檔案中以已驗證型別取代 Any - [PR #43844](https://github.com/BerriAI/litellm/pull/43844)
- 移除 LIT002 可變建構規則 - [PR #43971](https://github.com/BerriAI/litellm/pull/43971)
- 清理 2026-09-30 的新鮮技術債 - [PR #43993](https://github.com/BerriAI/litellm/pull/43993)
- 將 mcp_server 測試參照指向 tests/unit/proxy - [PR #44055](https://github.com/BerriAI/litellm/pull/44055)
- 移除未使用的 pytest-postgresql 開發相依套件 - [PR #44056](https://github.com/BerriAI/litellm/pull/44056)
- 拆分 KeyActivityPanel 條件鏈，以使 lint 預算回到上限以下 - [PR #44114](https://github.com/BerriAI/litellm/pull/44114)
- 移除橫幅註解、重述註解與死掉的 in_loop_thread - [PR #44161](https://github.com/BerriAI/litellm/pull/44161)

</details>

<details>
<summary>Rust 執行階段內部元件 (22)</summary>

- 新增 openai_like chat 設定基礎 - [PR #43379](https://github.com/BerriAI/litellm/pull/43379)
- 在各 crate 之間共享 anthropic 類型、請求輔助函式與串流合約 - [PR #43426](https://github.com/BerriAI/litellm/pull/43426)
- 擴充 gateway 組態解析 - [PR #43460](https://github.com/BerriAI/litellm/pull/43460)
- 在以 route 擁有的 inference 之間共享呼叫生命週期 - [PR #43461](https://github.com/BerriAI/litellm/pull/43461)
- 新增 HTTP host driver - [PR #43462](https://github.com/BerriAI/litellm/pull/43462)
- 在 gateway inference 中使用共享執行 - [PR #43463](https://github.com/BerriAI/litellm/pull/43463)
- 支援 HTTP Responses API - [PR #43464](https://github.com/BerriAI/litellm/pull/43464)
- 將 Python inference bindings 連接至共享 routes - [PR #43465](https://github.com/BerriAI/litellm/pull/43465)
- 新增結構化 route 生命週期追蹤 - [PR #43466](https://github.com/BerriAI/litellm/pull/43466)
- 分離 gateway 驗證與授權 - [PR #43467](https://github.com/BerriAI/litellm/pull/43467)
- 新增虛擬金鑰儲存合約 - [PR #43468](https://github.com/BerriAI/litellm/pull/43468)
- 新增 gateway UI 登入與工作階段 - [PR #43469](https://github.com/BerriAI/litellm/pull/43469)
- 新增 MCP gateway - [PR #43470](https://github.com/BerriAI/litellm/pull/43470)
- 封裝 gateway container - [PR #43471](https://github.com/BerriAI/litellm/pull/43471)
- 新增 litellm-db 與 litellm-db-testing workspace 腳手架 - [PR #43504](https://github.com/BerriAI/litellm/pull/43504)
- 移除 delivery routing 抽象層 - [PR #43514](https://github.com/BerriAI/litellm/pull/43514)
- 集中化 host 執行與 compose callbacks - [PR #43515](https://github.com/BerriAI/litellm/pull/43515)
- 透過明確的 cache 物件選擇 Rust 快取 - [PR #43601](https://github.com/BerriAI/litellm/pull/43601)
- 協調 Messages route 執行 - [PR #43719](https://github.com/BerriAI/litellm/pull/43719)
- 新增共享 llms wire type derives - [PR #43730](https://github.com/BerriAI/litellm/pull/43730)
- 集中化 Python bridge 執行包裝器 - [PR #43871](https://github.com/BerriAI/litellm/pull/43871)
- 使用共享 migrate! 巨集嵌入 migration 資料夾 - [PR #44104](https://github.com/BerriAI/litellm/pull/44104)

</details>

<details>
<summary>未釋出變更的回復（2）</summary>

- 回復超出 top-N key 上限的 server-side Team Usage 匯出，該功能從未在穩定版中發布 - [PR #43376](https://github.com/BerriAI/litellm/pull/43376)
- 回復 Team usage 檢視中超出 top-N 的 team key 搜尋，該功能從未在穩定版中發布 - [PR #43377](https://github.com/BerriAI/litellm/pull/43377)

</details>

<details>
<summary>發布與封裝（4）</summary>

- 升級 litellm-enterprise 0.1.71 -&gt; 0.1.72、litellm-proxy-extras 0.4.102 -&gt; 0.4.103、litellm 1.104.0 -&gt; 1.105.0 - [PR #43789](https://github.com/BerriAI/litellm/pull/43789)
- 升級 litellm-enterprise 0.1.72 -&gt; 0.1.73、litellm-proxy-extras 0.4.103 -&gt; 0.4.104 - [PR #44126](https://github.com/BerriAI/litellm/pull/44126)
- 升級 litellm-proxy-extras 0.4.104 -&gt; 0.4.105 - [PR #44235](https://github.com/BerriAI/litellm/pull/44235)
- 重新建置 rc/1.105.0 上的 Admin UI bundle - [PR #44386](https://github.com/BerriAI/litellm/pull/44386)

</details>

### 依擁有區域的 PR 彙總 {#pr-roll-up-by-ownership-area}

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

- [@4refael](https://github.com/4refael) 在 [PR #41826](https://github.com/BerriAI/litellm/pull/41826) 完成首次貢獻
- [@agustin18](https://github.com/agustin18) 在 [PR #43319](https://github.com/BerriAI/litellm/pull/43319) 完成首次貢獻
- [@ankit373](https://github.com/ankit373) 在 [PR #43553](https://github.com/BerriAI/litellm/pull/43553) 完成首次貢獻
- [@daqiangganjun](https://github.com/daqiangganjun) 在 [PR #38172](https://github.com/BerriAI/litellm/pull/38172) 完成首次貢獻
- [@DeviaVir](https://github.com/DeviaVir) 在 [PR #43558](https://github.com/BerriAI/litellm/pull/43558) 完成首次貢獻
- [@fedaeho](https://github.com/fedaeho) 在 [PR #43512](https://github.com/BerriAI/litellm/pull/43512) 完成首次貢獻
- [@Flexomatic81](https://github.com/Flexomatic81) 在 [PR #43588](https://github.com/BerriAI/litellm/pull/43588) 完成首次貢獻
- [@galovics](https://github.com/galovics) 在 [PR #42949](https://github.com/BerriAI/litellm/pull/42949) 完成首次貢獻
- [@hsm207](https://github.com/hsm207) 在 [PR #43536](https://github.com/BerriAI/litellm/pull/43536) 完成首次貢獻
- [@shoemoney](https://github.com/shoemoney) 在 [PR #38049](https://github.com/BerriAI/litellm/pull/38049) 完成首次貢獻
- [@shrey-berri](https://github.com/shrey-berri) 在 [PR #43221](https://github.com/BerriAI/litellm/pull/43221) 完成首次貢獻
- [@stewartpark](https://github.com/stewartpark) 在 [PR #43147](https://github.com/BerriAI/litellm/pull/43147) 完成首次貢獻
- [@YaseenBashaT](https://github.com/YaseenBashaT) 在 [PR #43197](https://github.com/BerriAI/litellm/pull/43197) 完成首次貢獻

## 完整更新記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.104.0-rc.1...v1.105.0-rc.1
