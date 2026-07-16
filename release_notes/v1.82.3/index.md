---
title: "v1.82.3 - Nebius AI、gpt-5.4、Gemini 3.x、FLUX Kontext，以及 116 個新模型"
slug: "v1-82-3"
date: 2026-03-16T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-1.82.3-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.82.3
```

</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

- **Nebius AI — 新提供者** — [透過 Nebius AI 雲端可用的 30 個模型，涵蓋 DeepSeek、Qwen、Llama、Mistral、NVIDIA 與 BAAI](../../docs/providers/nebius) - [PR #22614](https://github.com/BerriAI/litellm/pull/22614)
- **OpenAI gpt-5.4 / gpt-5.4-pro — 第 0 天** — 在 OpenAI 與 Azure 上完整支援 `gpt-5.4`（1M context，$2.50/$15.00）以及 `gpt-5.4-pro`（$30.00/$180.00）的定價與路由
- **Gemini 3.x 模型** — `gemini-3-flash-preview`、`gemini-3.1-pro-preview`、`gemini-3.1-flash-image-preview`、以及 `gemini-embedding-2-preview` 已加入 Google AI 與 Vertex AI 的成本對照表
- **FLUX Kontext 影像編輯** — `flux-kontext-pro` 和 `flux-kontext-max` 已加入 Black Forest Labs，另包含 `flux-pro-1.0-fill` 和 `flux-pro-1.0-expand` 用於 inpainting 與 outpainting
- **116 個新模型、132 個已棄用模型清理完成** — 主要模型對照表更新，包括 Mistral Magistral、Dashscope Qwen3 VL、透過 Azure AI 的 xAI Grok、ZAI GLM-5、Serper Search；移除 OpenAI GPT-3.5/GPT-4 舊版變體、Gemini 1.5，以及 Vertex AI PaLM2
- **SageMaker Nova 提供者** — [Amazon Nova 模型在 SageMaker 上的新 `sagemaker_nova` 提供者](../../docs/providers/aws_sagemaker) - [PR #21542](https://github.com/BerriAI/litellm/pull/21542)
- **Hashicorp Vault 密鑰管理員** — 由 Hashicorp Vault 驅動的設定覆寫後端，並提供完整 UI 來管理來自 vault 的憑證 - [PR #22939](https://github.com/BerriAI/litellm/pull/22939), [PR #23036](https://github.com/BerriAI/litellm/pull/23036)
- **Responses API WebSocket 串流** — Responses API 的即時 WebSocket 串流，包含所有提供者的支援 - [PR #22559](https://github.com/BerriAI/litellm/pull/22559), [PR #22771](https://github.com/BerriAI/litellm/pull/22771)
- **Org Admin RBAC 擴充** — Org Admin 現在可以存取團隊管理端點、檢視並邀請內部使用者，以及管理團隊成員資格，而不需要全域管理員角色 - [PR #23085](https://github.com/BerriAI/litellm/pull/23085), [PR #23080](https://github.com/BerriAI/litellm/pull/23080)
- **防護欄模式預設值與基於標籤的模式** — 全域設定預設的防護欄模式清單，並在基於標籤的防護欄設定中指定模式清單 - [PR #22676](https://github.com/BerriAI/litellm/pull/22676), [PR #23020](https://github.com/BerriAI/litellm/pull/23020)
- **記錄中的機密遮罩** — 所有 proxy 記錄輸出中的 API 金鑰、token 與憑證會自動遮罩。預設啟用；可透過 `LITELLM_DISABLE_REDACT_SECRETS=true` 停用 - [PR #23668](https://github.com/BerriAI/litellm/pull/23668)
- **串流穩定性修正** — 修正 `RuntimeError: Cannot send a request, as the client has been closed.` 在 production 中約 1 小時後當機的嚴重問題 - [PR #22926](https://github.com/BerriAI/litellm/pull/22926)

---

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（7 個新提供者） {#new-providers-7-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | --------------------------- | ----------- |
| [Nebius AI](../../docs/providers/nebius) (`nebius/`) | `/chat/completions`, `/embeddings` | 以 EU 為 ভিত্ত的 AI 雲端，提供 30+ 個開放模型——DeepSeek、Qwen3、Llama 3.1/3.3、NVIDIA Nemotron、BAAI embeddings |
| [ZAI](../../docs/providers/zai) (`zai/`) | `/chat/completions` | 透過 ZAI 雲端提供的 ZhipuAI GLM-5 模型 |
| [Black Forest Labs](../../docs/providers/black_forest_labs) (`black_forest_labs/`) | `/images/generations`, `/images/edits` | FLUX 影像生成與編輯——Kontext Pro/Max、Pro 1.0 Fill/Expand |
| [Serper](../../docs/providers/serper) (`serper/`) | `/search` | 透過 Serper API 進行網頁搜尋 |
| [SageMaker Nova](../../docs/providers/aws_sagemaker) (`sagemaker_nova/`) | `/chat/completions` | 透過 SageMaker 端點提供 Amazon Nova 模型 |
| [Google Search API](../../docs/providers/google_search) (`google_search/`) | `/search` | Google Search API 整合 - [PR #22752](https://github.com/BerriAI/litellm/pull/22752) |
| [Bedrock Mantle](../../docs/providers/bedrock) (`bedrock_mantle/`) | `/chat/completions` | 透過 Mantle 使用 Amazon Bedrock——Bedrock 模型的替代驗證與路由路徑 - [PR #22866](https://github.com/BerriAI/litellm/pull/22866) |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（116 個新模型） {#new-model-support-116-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.4` | 1.05M | $2.50 | $15.00 | chat, vision, tools, reasoning |
| OpenAI | `gpt-5.4-pro` | 1.05M | $30.00 | $180.00 | responses, vision, tools, reasoning |
| OpenAI | `gpt-5.3-chat-latest` | 128K | $1.75 | $14.00 | chat, vision, tools, reasoning |
| Azure OpenAI | `azure/gpt-5.4` | 1.05M | $2.50 | $15.00 | chat, vision, tools, reasoning |
| Azure OpenAI | `azure/gpt-5.4-pro` | 1.05M | $30.00 | $180.00 | responses, vision, tools, reasoning |
| Azure OpenAI | `azure/gpt-5.3-chat` | 128K | $1.75 | $14.00 | chat, vision, tools, reasoning |
| Google Gemini | `gemini/gemini-3-flash-preview` | 1M | $0.50 | $3.00 | chat, vision, tools, reasoning |
| Google Gemini | `gemini/gemini-3.1-pro-preview` | 1M | $2.00 | $12.00 | chat, vision, tools, reasoning |
| Google Gemini | `gemini/gemini-3.1-flash-image-preview` | 65K | $0.25 | $1.50 | image generation, vision |
| Google Gemini | `gemini/gemini-3.1-flash-lite-preview` | - | - | - | 聊天 |
| Google Gemini | `gemini/gemini-3-pro-image-preview` | - | - | - | 影像生成 |
| Google Gemini | `gemini/gemini-embedding-2-preview` | 8K | $0.20 | - | 嵌入 |
| Google Vertex AI | `vertex_ai/gemini-3-flash-preview` | - | - | - | 聊天 |
| Google Vertex AI | `vertex_ai/gemini-3.1-pro-preview` | - | - | - | 聊天 |
| Google Vertex AI | `vertex_ai/gemini-3.1-flash-lite-preview` | - | - | - | 聊天 |
| Google Vertex AI | `vertex_ai/gemini-embedding-2-preview` | - | $0.20 | - | 嵌入 |
| Mistral | `mistral/magistral-medium-1-2-2509` | 40K | $2.00 | $5.00 | chat, tools, reasoning |
| Mistral | `mistral/magistral-small-1-2-2509` | 40K | $0.50 | $1.50 | chat, tools, reasoning |
| Mistral | `mistral/mistral-large-2512` | 262K | $0.50 | $1.50 | chat, vision, tools |
| Mistral | `mistral/mistral-medium-3-1-2508` | - | - | - | 聊天 |
| Mistral | `mistral/mistral-small-3-2-2506` | - | - | - | 聊天 |
| Mistral | `mistral/ministral-3-3b-2512` | - | - | - | 聊天 |
| Mistral | `mistral/ministral-3-8b-2512` | - | - | - | 聊天 |
| Mistral | `mistral/ministral-3-14b-2512` | - | - | - | 聊天 |
| Black Forest Labs | `black_forest_labs/flux-kontext-pro` | - | - | - | 圖像編輯 |
| Black Forest Labs | `black_forest_labs/flux-kontext-max` | - | - | - | 圖像編輯 |
| Black Forest Labs | `black_forest_labs/flux-pro-1.0-fill` | - | - | - | 圖像編輯（inpaint） |
| Black Forest Labs | `black_forest_labs/flux-pro-1.0-expand` | - | - | - | 圖像編輯（outpaint） |
| Black Forest Labs | `black_forest_labs/flux-pro-1.1` | - | - | - | 圖像生成 |
| Black Forest Labs | `black_forest_labs/flux-pro-1.1-ultra` | - | - | - | 圖像生成 |
| Black Forest Labs | `black_forest_labs/flux-dev` | - | - | - | 圖像生成 |
| Black Forest Labs | `black_forest_labs/flux-pro` | - | - | - | 圖像生成 |
| Azure AI | `azure_ai/grok-4-1-fast-non-reasoning` | 131K | $0.20 | $0.50 | chat, tools |
| Azure AI | `azure_ai/grok-4-1-fast-reasoning` | 131K | $0.20 | $0.50 | chat, tools, reasoning |
| Azure AI | `azure_ai/mistral-document-ai-2512` | - | - | - | OCR |
| Dashscope | `dashscope/qwen3-next-80b-a3b-instruct` | 262K | $0.15 | $1.20 | 聊天 |
| Dashscope | `dashscope/qwen3-next-80b-a3b-thinking` | 262K | $0.15 | $1.20 | chat, reasoning |
| Dashscope | `dashscope/qwen3-vl-235b-a22b-instruct` | 131K | $0.40 | $1.60 | chat, vision |
| Dashscope | `dashscope/qwen3-vl-235b-a22b-thinking` | 131K | $0.40 | $4.00 | chat, vision, reasoning |
| Dashscope | `dashscope/qwen3-vl-32b-instruct` | 131K | $0.16 | $0.64 | chat, vision |
| Dashscope | `dashscope/qwen3-vl-32b-thinking` | 131K | $0.16 | $2.87 | chat, vision, reasoning |
| Dashscope | `dashscope/qwen3-vl-plus` | 260K | - | - | chat, vision |
| Dashscope | `dashscope/qwen3.5-plus` | 992K | - | - | 聊天 |
| Dashscope | `dashscope/qwen3-max-2026-01-23` | 258K | - | - | 聊天 |
| Nebius AI | `nebius/deepseek-ai/DeepSeek-R1` | 128K | $0.80 | $2.40 | chat, reasoning |
| Nebius AI | `nebius/deepseek-ai/DeepSeek-R1-0528` | 164K | $0.80 | $2.40 | chat, reasoning |
| Nebius AI | `nebius/deepseek-ai/DeepSeek-V3` | 128K | $0.50 | $1.50 | 聊天 |
| Nebius AI | `nebius/deepseek-ai/DeepSeek-V3-0324` | 128K | $0.50 | $1.50 | 聊天 |
| Nebius AI | `nebius/deepseek-ai/DeepSeek-R1-Distill-Llama-70B` | 128K | $0.25 | $0.75 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen3-235B-A22B` | 262K | $0.20 | $0.60 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen3-32B` | 32K | $0.10 | $0.30 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen3-30B-A3B` | 32K | $0.10 | $0.30 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen3-14B` | 32K | $0.08 | $0.24 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen3-4B` | 32K | $0.08 | $0.24 | 聊天 |
| Nebius AI | `nebius/Qwen/QwQ-32B` | 32K | $0.15 | $0.45 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen2.5-72B-Instruct` | 128K | $0.13 | $0.40 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen2.5-32B-Instruct` | 128K | $0.06 | $0.20 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen2.5-VL-72B-Instruct` | 131K | $0.13 | $0.40 | chat, vision |
| Nebius AI | `nebius/Qwen/Qwen2-VL-72B-Instruct` | 131K | $0.13 | $0.40 | chat, vision |
| Nebius AI | `nebius/Qwen/Qwen2-VL-7B-Instruct` | 131K | $0.02 | $0.06 | chat, vision |
| Nebius AI | `nebius/meta-llama/Meta-Llama-3.1-405B-Instruct` | 128K | $1.00 | $3.00 | 聊天 |
| Nebius AI | `nebius/meta-llama/Meta-Llama-3.1-70B-Instruct` | 128K | $0.13 | $0.40 | 聊天 |
| Nebius AI | `nebius/meta-llama/Meta-Llama-3.1-8B-Instruct` | 128K | $0.02 | $0.06 | 聊天 |
| Nebius AI | `nebius/meta-llama/Llama-3.3-70B-Instruct` | 128K | $0.13 | $0.40 | 聊天 |
| Nebius AI | `nebius/meta-llama/Llama-Guard-3-8B` | 128K | $0.02 | $0.06 | 聊天 |
| Nebius AI | `nebius/nvidia/Llama-3.1-Nemotron-Ultra-253B-v1` | 128K | $0.60 | $1.80 | 聊天 |
| Nebius AI | `nebius/nvidia/Llama-3.3-Nemotron-Super-49B-v1` | 131K | $0.10 | $0.40 | 聊天 |
| Nebius AI | `nebius/NousResearch/Hermes-3-Llama-3.1-405B` | 128K | $1.00 | $3.00 | 聊天 |
| Nebius AI | `nebius/google/gemma-3-27b-it` | 128K | $0.06 | $0.20 | 聊天 |
| Nebius AI | `nebius/mistralai/Mistral-Nemo-Instruct-2407` | 128K | $0.04 | $0.12 | 聊天 |
| Nebius AI | `nebius/Qwen/Qwen2.5-Coder-7B` | 32K | $0.01 | $0.03 | 聊天 |
| Nebius AI | `nebius/BAAI/bge-en-icl` | 32K | $0.01 | - | 嵌入 |
| Nebius AI | `nebius/BAAI/bge-multilingual-gemma2` | 8K | $0.01 | - | 嵌入 |
| Nebius AI | `nebius/intfloat/e5-mistral-7b-instruct` | 32K | $0.01 | - | 嵌入 |
| AWS Bedrock | `mistral.devstral-2-123b` | 256K | $0.40 | $2.00 | chat, tools |
| AWS Bedrock | `zai.glm-4.7-flash` | 200K | $0.07 | $0.40 | chat, tools, reasoning |
| ZAI | `zai/glm-5` | 200K | $1.00 | $3.20 | chat, tools, reasoning |
| ZAI | `zai/glm-5-code` | 200K | $1.20 | $5.00 | chat, tools, reasoning |
| OpenRouter | `openrouter/anthropic/claude-sonnet-4.6` | - | - | - | 聊天 |
| OpenRouter | `openrouter/google/gemini-3.1-pro-preview` | - | - | - | 聊天 |
| OpenRouter | `openrouter/openai/gpt-5.1-codex-max` | - | - | - | 聊天 |
| OpenRouter | `openrouter/qwen/qwen3-coder-plus` | - | - | - | 聊天 |
| OpenRouter | `openrouter/qwen/qwen3.5-*` (5 models) | - | - | - | 聊天 |
| OpenRouter | `openrouter/z-ai/glm-5` | - | - | - | 聊天 |
| Together AI | `together_ai/Qwen/Qwen3.5-397B-A17B` | - | - | - | 聊天 |
| Perplexity | `perplexity/pplx-embed-v1-0.6b` | 32K | $0.00 | - | 嵌入 |
| Perplexity | `perplexity/pplx-embed-v1-4b` | 32K | $0.03 | - | 嵌入 |
| Serper | `serper/search` | - | - | - | 搜尋 |

#### 更新的模型 {#updated-models}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 將 `cache_read_input_token_cost` 和 `cache_creation_input_token_cost` 新增至 Bedrock 託管的 Anthropic 模型（`claude-3-opus`、`claude-3-sonnet`、`claude-3-haiku`，以及 APAC/EU 變體）— 現在會追蹤 prompt caching 以進行成本估算
    - 將 `apac.anthropic.claude-sonnet-4-6` 重新命名為 `au.anthropic.claude-sonnet-4-6`，以反映正確的區域識別碼

- **[Azure OpenAI](../../docs/providers/azure)**
    - 將 `supports_none_reasoning_effort` 新增至所有 `gpt-5.1-chat`、`gpt-5.1-codex` 和 `gpt-5.4` 變體（全域、EU、標準部署）— 允許傳入 `reasoning_effort: null` 以停用 reasoning

- **[Azure OpenAI](../../docs/providers/azure)** — 移除已淘汰的模型
    - 移除 `azure/gpt-35-turbo-0301`（已於 2025-02-13 淘汰）
    - 移除 `azure/gpt-35-turbo-0613`（已於 2025-02-13 淘汰）

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - OpenAI 與 Azure 上 `gpt-5.4` 和 `gpt-5.4-pro` 的 Day 0 支援

- **[Google Gemini](../../docs/providers/gemini)**
    - 新增 Gemini 3.x 模型成本對應項目 — `gemini-3-flash-preview`、`gemini-3.1-pro-preview`、`gemini-3.1-flash-lite-preview`、`gemini-3-pro-image-preview`、`gemini-embedding-2-preview`
    - 將 Gemini 2.0 Flash 和 Flash Lite 重新新增至成本對應（採用更新後的定價）

- **[Google Vertex AI](../../docs/providers/vertex)**
    - 將 `gemini-3-flash-preview`、`gemini-3.1-flash-lite-preview`、`gemini-flash-experimental` 和 `gemini-embedding-2-preview` 新增至 Vertex AI 模型成本對應

- **[Mistral](../../docs/providers/mistral)**
    - 新增 Magistral 推理模型 (`magistral-medium-1-2-2509`, `magistral-small-1-2-2509`)
    - 新增 `mistral-large-2512`、`mistral-medium-3-1-2508`、`mistral-small-3-2-2506`、`ministral-3-*` 變體

- **[Dashscope / Qwen](../../docs/providers/dashscope)**
    - 新增 Qwen3 VL 多模態模型 (`qwen3-vl-235b`, `qwen3-vl-32b` — instruct 與 thinking 變體)
    - 新增 `qwen3-next-80b-a3b`（instruct + thinking）、`qwen3.5-plus`、`qwen3-max-2026-01-23`

- **[Black Forest Labs](../../docs/providers/black_forest_labs)**
    - 新增 FLUX Kontext 圖像編輯模型 (`flux-kontext-pro`, `flux-kontext-max`)
    - 新增 FLUX Pro 1.0 Fill（inpainting）與 Expand（outpainting）
    - 新增 `flux-pro-1.1`、`flux-pro-1.1-ultra`、`flux-dev`、`flux-pro`

- **[Azure AI](../../docs/providers/azure_ai)**
    - 透過 Azure AI Foundry 新增 xAI Grok 模型 (`grok-4-1-fast-non-reasoning`, `grok-4-1-fast-reasoning`)
    - 新增 Mistral Document AI (`mistral-document-ai-2512`) — OCR 模式

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 新增 `mistral.devstral-2-123b`（256K context、工具）
    - 透過 Bedrock Converse 新增 `zai.glm-4.7-flash`（200K context、工具、reasoning）

- **[SageMaker](../../docs/providers/aws_sagemaker)**
    - 為 SageMaker 上的 Amazon Nova 模型新增 `sagemaker_nova` 提供者 - [PR #21542](https://github.com/BerriAI/litellm/pull/21542)

#### 已棄用 / 已移除模型 {#deprecated--removed-models}

**OpenAI** — 從 cost map 移除舊版模型：
- `gpt-3.5-turbo-0301`、`gpt-3.5-turbo-0613`、`gpt-3.5-turbo-16k-0613`
- `gpt-4-0314`、`gpt-4-32k`、`gpt-4-32k-0314`、`gpt-4-32k-0613`、`gpt-4-1106-vision-preview`、`gpt-4-vision-preview`
- `gpt-4.5-preview`、`gpt-4.5-preview-2025-02-27`
- `gpt-4o-audio-preview-2024-10-01`、`gpt-4o-realtime-preview-2024-10-01`
- `o1-mini`、`o1-mini-2024-09-12`、`o1-preview`、`o1-preview-2024-09-12`

**Google Gemini** — 移除 Gemini 1.5 與舊版 2.0 變體：
- 所有 `gemini-1.5-*` 變體（flash、flash-8b、pro，以及附日期版本）
- `gemini-2.0-flash-exp`、`gemini-2.0-pro-exp-02-05`、`gemini-2.5-flash-preview-04-17`、`gemini-2.5-flash-preview-05-20`

**Google Vertex AI** — 移除 PaLM 2 / 舊版模型：
- 所有 `chat-bison`、`text-bison`、`codechat-bison`、`code-bison`、`code-gecko` 變體
- Gemini 1.0 Pro、1.5 Flash/Pro、2.0 Flash experimental，以及 preview 變體

**Perplexity** — 移除舊版 Llama-sonar 模型：
- `llama-3.1-sonar-huge-128k-online`、`llama-3.1-sonar-large/small-128k-chat/online`

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 在背景串流中處理 `response.failed`、`response.incomplete` 與 `response.cancelled` 終止事件類型 — 先前僅處理 `response.completed` - [PR #23492](https://github.com/BerriAI/litellm/pull/23492)
    - Responses API 的 WebSocket 串流支援 — 透過 WebSocket 為所有提供者進行即時串流 - [PR #22559](https://github.com/BerriAI/litellm/pull/22559), [PR #22771](https://github.com/BerriAI/litellm/pull/22771)
    - 用於即時音訊/視訊通訊的 WebRTC 支援 - [PR #23446](https://github.com/BerriAI/litellm/pull/23446)
    - OpenAI 相容 JSON 提供者的 Responses API 支援（`openai_like`）- [PR #21398](https://github.com/BerriAI/litellm/pull/21398)
    - 自動將使用工具與 reasoning 的 `gpt-5.4+` 請求路由至 Responses API - [PR #23577](https://github.com/BerriAI/litellm/pull/23577)

- **[Anthropic Files API](../../docs/providers/anthropic)**
    - 完整支援 Anthropic Files API — 上傳、擷取、列出與刪除檔案；在訊息中使用檔案參照 - [PR #16594](https://github.com/BerriAI/litellm/pull/16594)

- **[Mistral](../../docs/providers/mistral)**
    - Voxtral 音訊轉錄支援 — 透過 Mistral 進行音訊轉錄的 `mistral/voxtral-mini-*` 與 `mistral/voxtral-*` - [PR #22801](https://github.com/BerriAI/litellm/pull/22801)

- **[OpenAI](../../docs/providers/openai)**
    - `litellm.acount_tokens()` public API — 具備完整 OpenAI 提供者支援的非同步 token 計數 - [PR #22809](https://github.com/BerriAI/litellm/pull/22809)
    - 將 `reasoning_effort` dict 正規化為字串以供 chat completion API 使用 - [PR #22981](https://github.com/BerriAI/litellm/pull/22981)

- **[OpenRouter](../../docs/providers/openrouter)**
    - OpenRouter 模型的圖像編輯支援 - [PR #22403](https://github.com/BerriAI/litellm/pull/22403)

- **[Google Gemini](../../docs/providers/gemini)**
    - Gemini 3 — 當省略 `reasoning_effort` 時，不再注入預設 `thinking_level`（與 Gemini API 一致；Flash 可能預設為 `high`，而非舊的 `minimal`）— [Gemini 3 blog](../../blog/gemini_3)

- **[Google Vertex AI](../../docs/providers/vertex)**
    - `completion_tokens_details` 中的 VIDEO 模態 token 使用量追蹤 - [PR #22550](https://github.com/BerriAI/litellm/pull/22550)

- **Images API**
    - 圖像編輯 API 的 `input_fidelity` 參數 - [PR #23201](https://github.com/BerriAI/litellm/pull/23201)

- **一般**
    - 每個請求的 `enable_json_schema_validation` 標記，用於執行緒安全的 JSON schema 驗證 - [PR #21233](https://github.com/BerriAI/litellm/pull/21233)
    - 模型 cost 別名擴充 — 在 cost map 中定義會繼承父模型定價的別名 - [PR #23314](https://github.com/BerriAI/litellm/pull/23314), [PR #23457](https://github.com/BerriAI/litellm/pull/23457)
    - Files API 的萬用字元模型支援 - [PR #22740](https://github.com/BerriAI/litellm/pull/22740)

#### 問題修正 {#bugs}

- **[Anthropic](../../docs/providers/anthropic)**
    - 當 guardrails 將工具轉換為 Anthropic Messages API 格式時，保留原生工具格式（web_search、bash、tool_search 等）- [PR #23526](https://github.com/BerriAI/litellm/pull/23526)
    - 在 `_map_tool_helper` 中強制工具輸入 schema 的 `type: "object"` — 修正嚴格 schema 提供者的工具呼叫失敗 - [PR #23103](https://github.com/BerriAI/litellm/pull/23103)
    - 依 `tool_call_id` 對 `tool_result` 訊息去重 — 防止多輪對話中的重複工具結果錯誤 - [PR #23104](https://github.com/BerriAI/litellm/pull/23104)
    - 將 `reasoning_effort` 對應至 `output_config`，用於 Claude 4.6 模型 - [PR #22220](https://github.com/BerriAI/litellm/pull/22220)

- **[Google Gemini](../../docs/providers/gemini)**
    - 修正工具呼叫的串流 `finish_reason` — 原本錯誤地回傳 `null` 而非 `tool_calls` - [PR #21577](https://github.com/BerriAI/litellm/pull/21577)
    - 在 Gemini 2.0+ 中保留 JSON Schema 裡的 `$ref` — schema 參照原本會被移除，導致結構化輸出失敗 - [PR #21597](https://github.com/BerriAI/litellm/pull/21597)
    - 處理 Gemini 3.1 模型的 `reasoning_effort` `minimal` 參數 - [PR #22920](https://github.com/BerriAI/litellm/pull/22920)

- **[Google Vertex AI](../../docs/providers/vertex)**
    - 在圖像生成中傳遞原生 Gemini `imageConfig` 參數 - [PR #21585](https://github.com/BerriAI/litellm/pull/21585)
    - 防止在串流中 `finish_reason` 先於內容區塊抵達時造成內容截斷 - [PR #22692](https://github.com/BerriAI/litellm/pull/22692)
    - 在合併至 Gemini request body 前，移除 `extra_body` 中 LiteLLM 內部金鑰 - [PR #23131](https://github.com/BerriAI/litellm/pull/23131)
    - 從所有 Vertex AI 請求中移除不支援的 `output_config` 參數 - [PR #22884](https://github.com/BerriAI/litellm/pull/22884)
    - 跳過 Gemini 2.0+ 工具參數的 schema 轉換 — 避免破壞原生 Gemini schema 處理 - [PR #23265](https://github.com/BerriAI/litellm/pull/23265)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 當提供者前綴與模型名稱相符時，針對原生模型重複截斷的模式化修正 - [PR #22320](https://github.com/BerriAI/litellm/pull/22320)
    - 當未設定 `stream_options` 時，在串流回應中使用提供者回報的使用量 - [PR #21592](https://github.com/BerriAI/litellm/pull/21592)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 從 `bedrock/{region}/{model}` 路徑格式擷取 region 與 model ID - [PR #22546](https://github.com/BerriAI/litellm/pull/22546)
    - 在 Bedrock 與 Azure AI 上為 Anthropic 訊息移除 `scope` 中的 `cache_control` - [PR #22867](https://github.com/BerriAI/litellm/pull/22867)
    - 在 Responses API 回應中填入 `completion_tokens_details` - [PR #23243](https://github.com/BerriAI/litellm/pull/23243)

- **[Azure AI](../../docs/providers/azure_ai)**
    - 在 Document Intelligence OCR 中從環境變數解析 `api_base` - [PR #21581](https://github.com/BerriAI/litellm/pull/21581)

- **[Moonshot / Kimi](../../docs/providers/openai_compatible)**
    - 為 Moonshot Kimi 推理模型自動填入 `reasoning_content` - [PR #23580](https://github.com/BerriAI/litellm/pull/23580)
    - 在 Moonshot 的多模態訊息中保留 `image_url` 區塊 - [PR #21595](https://github.com/BerriAI/litellm/pull/21595)

- **[HuggingFace](../../docs/providers/huggingface)**
    - 將 `extra_headers` 傳遞至 HuggingFace embedding API - [PR #23525](https://github.com/BerriAI/litellm/pull/23525)

- **Token 計數／成本**
    - 修正 `count_tokens`，使其在 token 計數 API 請求中包含系統提示與工具 - [PR #22301](https://github.com/BerriAI/litellm/pull/22301)
    - 將所有自訂定價欄位傳遞給 `register_model`，適用於 `completion()` 和 `embedding()` - [PR #22552](https://github.com/BerriAI/litellm/pull/22552)

- **工具 / Function Calling**
    - 優雅地修復工具呼叫引數中的截斷 JSON——可防止格式不正確的工具回應造成當機 - [PR #22503](https://github.com/BerriAI/litellm/pull/22503)
    - 修正函式呼叫在串流中未發出 `finish_reason` 的 `output_item.done` - [PR #22553](https://github.com/BerriAI/litellm/pull/22553)
    - 在多次 web 搜尋時保留 thinking 區塊順序 - [PR #23093](https://github.com/BerriAI/litellm/pull/23093)

- **一般**
    - 標準化各提供者之間的 `content_filtered` 結束原因 - [PR #23564](https://github.com/BerriAI/litellm/pull/23564)
    - 統一所有提供者的 `finish_reason` 對應為 OpenAI 相容值 - [PR #22138](https://github.com/BerriAI/litellm/pull/22138)
    - 修正 `/v1/messages` 與 `/v1/responses` 部署上的自訂成本追蹤 - [PR #23647](https://github.com/BerriAI/litellm/pull/23647)
    - 修正當 `router_model_id` 沒有定價資料時的每次請求自訂定價——現在會回退至模型名稱
    - 修正批次清單在完成後仍顯示過時的 `validating` 狀態 - [PR #22982](https://github.com/BerriAI/litellm/pull/22982)
    - 修正當缺少 `model_id` 時，批次擷取回傳原始 `output_file_id` - [PR #23194](https://github.com/BerriAI/litellm/pull/23194)
    - 在使用 `x-litellm-model` 標頭時對 batch IDs 進行編碼 - [PR #22653](https://github.com/BerriAI/litellm/pull/22653)
    - 在 gpt-oss 提供者的串流 Delta 中將 `reasoning` 對應為 `reasoning_content` - [PR #22803](https://github.com/BerriAI/litellm/pull/22803)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 在建立／編輯金鑰表單中新增 Organization 下拉選單——`organization_id` 現在是 Key Ownership 中的一級欄位 - [PR #23595](https://github.com/BerriAI/litellm/pull/23595)
    - 允許在 `/key/update` 上設定 `organization_id`——金鑰可在建立後被指派或移至不同的組織 - [PR #23557](https://github.com/BerriAI/litellm/pull/23557)
    - 透過 UI 手動重設虛擬金鑰的支出——管理員可依需求將金鑰支出歸零 - [PR #22715](https://github.com/BerriAI/litellm/pull/22715)
    - BYOK（Bring Your Own Key）——用戶端提供者 API 金鑰優先於 Anthropic `/v1/messages` 的代理金鑰 - [PR #22964](https://github.com/BerriAI/litellm/pull/22964)
    - 可透過 `LITELLM_UI_SESSION_DURATION` 環境變數設定 UI 登入工作階段持續時間 - [PR #22182](https://github.com/BerriAI/litellm/pull/22182)
    - 透過 config.yaml 中的 `auto_redirect_ui_login_to_sso: true` 自動將 UI 登入重新導向至 SSO - [PR #23367](https://github.com/BerriAI/litellm/pull/23367)

- **存取控制（RBAC）**
    - Organization 管理員現在可存取團隊管理端點——`/team/new`、`/team/update`、`/team/delete`、`/team/member_add`、`/team/member_delete` - [PR #23085](https://github.com/BerriAI/litellm/pull/23085), [PR #23095](https://github.com/BerriAI/litellm/pull/23095)
    - Organization 管理員可檢視並邀請內部使用者——無需全域管理員角色即可進行完整的使用者管理 - [PR #23080](https://github.com/BerriAI/litellm/pull/23080)
    - 允許 Admin Viewers 存取 Audit Logs——唯讀管理員角色現在包含稽核記錄存取權 - [PR #23419](https://github.com/BerriAI/litellm/pull/23419)
    - 向量儲存與代理程式的 RBAC——為向量儲存與代理程式資源提供金鑰／團隊層級存取控制 - [PR #22858](https://github.com/BerriAI/litellm/pull/22858)
    - 使用者篩選範圍（`scope_user_search_to_org`）現在改為 opt-in——先前預設開啟，導致非預期的限制 - [PR #23057](https://github.com/BerriAI/litellm/pull/23057)

- **向量儲存**
    - 向量儲存管理端點——透過 `/v1/vector_stores/*` 擷取、列出、更新與刪除向量儲存 - [PR #23435](https://github.com/BerriAI/litellm/pull/23435)

- **團隊**
    - 團隊的批次到期設定——為所有團隊金鑰設定預設到期時間長度 - [PR #22705](https://github.com/BerriAI/litellm/pull/22705)
    - Team Admin 可重設金鑰支出 - [PR #22725](https://github.com/BerriAI/litellm/pull/22725)

- **內部使用者**
    - 直接從 Internal Users 資訊頁面新增／移除團隊成員資格——包含可搜尋的下拉選單與角色選擇器；不再需要逐一前往各團隊 - [PR #23638](https://github.com/BerriAI/litellm/pull/23638)

- **模型**
    - 透過 UI 將知識庫附加至模型 - [PR #22656](https://github.com/BerriAI/litellm/pull/22656)

- **預設團隊設定**
    - 將頁面現代化為 antd（與應用程式其他部分一致） - [PR #23614](https://github.com/BerriAI/litellm/pull/23614)
    - 修正：預設團隊參數（budget、duration、tpm、rpm、permissions）現在可正確套用於 `/team/new` - [PR #23614](https://github.com/BerriAI/litellm/pull/23614)
    - 修正：設定可在代理重啟之間保留（`default_team_params` 已新增至 `LITELLM_SETTINGS_SAFE_DB_OVERRIDES`）- [PR #23614](https://github.com/BerriAI/litellm/pull/23614)
    - 修正：解決 `_update_litellm_setting` 中的競態條件，`get_config()` 可能會覆寫新儲存的值 - [PR #23614](https://github.com/BerriAI/litellm/pull/23614)

- **用量**
    - 自動分頁每日支出資料——所有實體檢視（團隊、組織、客戶、標籤、代理程式、使用者）都會逐頁擷取，圖表會在每一頁後更新 - [PR #23622](https://github.com/BerriAI/litellm/pull/23622)

- **模型 / 成本**
    - UI 中的 Azure Model Router 成本明細——顯示來自 `hidden_params` 的各子模型 `additional_costs` 於 `CostBreakdownViewer` - [PR #23550](https://github.com/BerriAI/litellm/pull/23550)

- **使用者管理**
    - 新的 `/user/info/v2` 端點——相較於現有會導致大型安裝出現記憶體與穩定性問題的 god 端點，這是具範圍限制且支援分頁的替代方案 - [PR #23437](https://github.com/BerriAI/litellm/pull/23437)

#### 錯誤修正 {#bugs-1}

- 修正 Tag list 端點因無效的 Prisma `group_by` kwargs 而回傳 500 - [PR #23606](https://github.com/BerriAI/litellm/pull/23606)
- 修正 Team Admin 在啟用 `scope_user_search_to_org` 時存取 `/user/filter/ui` 會出現 403 - [PR #23671](https://github.com/BerriAI/litellm/pull/23671)
- 修正 Public Model Hub 在儲存後未顯示 config-defined 模型 - [PR #23501](https://github.com/BerriAI/litellm/pull/23501)
- 修正 fallback 彈出視窗模型下拉選單的 z-index 問題 - [PR #23516](https://github.com/BerriAI/litellm/pull/23516)
- 修正 org/team 金鑰限制檢查中對 `/key/update` 的重複計算錯誤
- 修正邀請連結允許同一連結多次重設密碼 - [PR #22462](https://github.com/BerriAI/litellm/pull/22462)
- 修正未設定 `duration` 時未套用金鑰到期預設持續時間 - [PR #22956](https://github.com/BerriAI/litellm/pull/22956)
- 修正所有代理模型在建立金鑰時未包含模型存取群組 - [PR #23236](https://github.com/BerriAI/litellm/pull/23236)
- 修正 admin viewers 無法看見所有組織 - [PR #22940](https://github.com/BerriAI/litellm/pull/22940)
- 修正 Audit Logs UI：新增伺服器端分頁、篩選與抽屜檢視 - [PR #22476](https://github.com/BerriAI/litellm/pull/22476)
- 修正團隊檢視中的虛擬金鑰未正確套用團隊篩選條件 - [PR #23065](https://github.com/BerriAI/litellm/pull/23065)
- 修正團隊到期強制執行驗證 - [PR #22728](https://github.com/BerriAI/litellm/pull/22728)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Helicone](../../docs/observability/helicone_integration)**
    - 將 Gemini 與 Vertex AI 支援新增至 HeliconeLogger——將 Gemini 與 Vertex AI 請求透過正確的 Helicone 提供者 URL 進行路由 - [PR #19288](https://github.com/BerriAI/litellm/pull/19288)
    - 修正 Vertex AI Gemini 模型的正確提供者 URL - [PR #22603](https://github.com/BerriAI/litellm/pull/22603)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正失敗路徑 kwargs 不一致導致失敗請求的追蹤被捨棄 - [PR #22390](https://github.com/BerriAI/litellm/pull/22390)

- **[Vantage](https://vantage.sh)**
    - 為 FOCUS 1.2 CSV 匯出新增 Vantage 整合——將 LiteLLM proxy 支出資料匯出為 FinOps Open Cost & Usage Specification 報表，並使用具時間區間的檔名以防止覆寫 - [PR #23333](https://github.com/BerriAI/litellm/pull/23333)

- **一般**
    - 修正 silent metrics 競態條件，導致實驗之間的 metric 衝突 - [PR #23542](https://github.com/BerriAI/litellm/pull/23542)

### 防護欄 {#guardrails}

- **防護欄模式預設清單** — 在未指定每個請求的模式時，設定全域套用的預設防護欄模式清單 - [PR #22676](https://github.com/BerriAI/litellm/pull/22676)
- **基於標籤的防護欄模式清單** — 在基於標籤的防護欄設定中指定模式清單，而非單一模式 - [PR #23020](https://github.com/BerriAI/litellm/pull/23020)
- **修正 presidio PII 權杖外洩** — Presidio 中 Anthropic 處理程序導致權杖回應中 PII 資料外洩的邊界情況 - [PR #22627](https://github.com/BerriAI/litellm/pull/22627)
- **修正 OTEL 孤兒防護欄追蹤** — OpenTelemetry 防護欄追蹤中的 span 重複與回應 ID 遺失 - [PR #23001](https://github.com/BerriAI/litellm/pull/23001)

### 提示管理 {#prompt-management}

本版本沒有重大提示管理變更。

### 密鑰管理器 {#secret-managers}

- **[Hashicorp Vault](../../docs/secret_managers)** — 完整的 Hashicorp Vault 整合，作為設定覆寫後端 — 在 Vault 中定義的密鑰會在啟動時擷取並覆寫 `config.yaml` 值。包含管理來自 Vault 的憑證之 UI 支援 - [PR #22939](https://github.com/BerriAI/litellm/pull/22939), [PR #23036](https://github.com/BerriAI/litellm/pull/23036)

---

## MCP 閘道 {#mcp-gateway}

#### 功能 {#features-3}

- **MCP 伺服器的權杖驗證** — 針對每個 MCP 伺服器設定 `auth_type: "bearer"`，讓工具呼叫需要以權杖為基礎的驗證 - [PR #23260](https://github.com/BerriAI/litellm/pull/23260)
- **團隊範圍的 MCP 伺服器篩選** — 在團隊下建立的金鑰只能看到該團隊可用的 MCP 伺服器 - [PR #23323](https://github.com/BerriAI/litellm/pull/23323)
- **UI 中的每台伺服器健康重新檢查** — 可對單一 MCP 伺服器觸發健康檢查，而不需重新載入所有伺服器 - [PR #23328](https://github.com/BerriAI/litellm/pull/23328)

#### 錯誤 {#bugs-2}

- 修正 MCP 伺服器 URL 與工具管理問題，導致工具探索失敗 - [PR #22751](https://github.com/BerriAI/litellm/pull/22751)
- 修正刪除伺服器時觸發 MCP 伺服器健康檢查的問題 - [PR #23063](https://github.com/BerriAI/litellm/pull/23063)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **修正與預算連結的金鑰從未重設支出** — 與預算物件連結的金鑰未在設定的重設間隔重設支出 - [PR #20688](https://github.com/BerriAI/litellm/pull/20688)
- **彈性定價支援** — 為提供動態定價層級的提供者在成本對照表中新增 `flex_pricing` 欄位 - [PR #22992](https://github.com/BerriAI/litellm/pull/22992)
- **修正支出記錄清理** — 解決支出記錄清理工作中的鎖定追蹤、整數保留與跳過記錄層級問題 - [PR #22687](https://github.com/BerriAI/litellm/pull/22687)
- **修正 WebSearch 支出記錄去重** — 啟用 thinking 時 WebSearch 攔截失敗；已一併修正支出記錄去重 - [PR #22679](https://github.com/BerriAI/litellm/pull/22679)
- **修正請求沒有 API 金鑰時的 TypeError** — 當請求中沒有 API 金鑰時，支出追蹤會拋出未處理的例外 - [PR #23363](https://github.com/BerriAI/litellm/pull/23363)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **修正約 1 小時後的串流當機** — `LLMClientCache._remove_key()` 不再對已被淘汰的 HTTP/SDK 用戶端呼叫 `close()`/`aclose()`。在 1 小時 TTL 到期後，進行中的請求會因 `RuntimeError: Cannot send a request, as the client has been closed.` 而當機。現在清理僅會在關機時透過 `close_litellm_async_clients()` 執行 - [PR #22926](https://github.com/BerriAI/litellm/pull/22926)
- **修正大型安裝上的 OOM / Prisma 連線遺失** — 在具有 336K+ 佇列回應列的執行個體上，無界限的受管理物件輪詢會在約 60～70 分鐘後耗盡 Prisma 連線 - [PR #23472](https://github.com/BerriAI/litellm/pull/23472)
- **集中記錄 kwarg 更新** — 根因修正，將所有記錄更新遷移至單一函式，消除跨記錄路徑的 kwarg 不一致 - [PR #23659](https://github.com/BerriAI/litellm/pull/23659)
- **修正非 root 離線容器的 tiktoken 快取** — tiktoken 快取現在可在以非 root 使用者執行的離線環境中正確運作 - [PR #23498](https://github.com/BerriAI/litellm/pull/23498)
- **當 Redis transaction buffer 沒有 Redis 時阻止 proxy 啟動** — 防止在 `use_redis_transaction_buffer: true` 設定但未連線 Redis 時發生靜默資料遺失 - [PR #23019](https://github.com/BerriAI/litellm/pull/23019)
- **修正 `InFlightRequestsMiddleware` 當機** — middleware 中未定義的 kwargs 會導致請求失敗 - [PR #22523](https://github.com/BerriAI/litellm/pull/22523)
- **修正 `BaseModelResponseIterator` 在非字串串流區塊上的當機** — 當提供者回傳非字串區塊資料時，串流會當機 - [PR #23497](https://github.com/BerriAI/litellm/pull/23497)
- **修正 `SERVER_ROOT_PATH` 前置詞處理** — 在檢查對應的透傳路由前先移除前置詞，以防止雙重前置詞問題 - [PR #23414](https://github.com/BerriAI/litellm/pull/23414)
- **新增 CodSpeed 持續效能基準測試** — 在 CI 上自動追蹤效能回歸 - [PR #23676](https://github.com/BerriAI/litellm/pull/23676)

---

## 安全性 {#security}

- **在 proxy 記錄中遮罩密鑰** — 為所有 LiteLLM 記錄器新增 `SecretRedactionFilter`，可從記錄訊息、格式化引數、例外回溯與額外欄位中清除 API 金鑰、權杖與憑證。預設啟用；可透過 `LITELLM_DISABLE_REDACT_SECRETS=true` 關閉 - [PR #23668](https://github.com/BerriAI/litellm/pull/23668), [PR #23667](https://github.com/BerriAI/litellm/pull/23667)
- **將 PyJWT 升級至 `^2.12.0`** — 修補 `^2.10.1` 的安全漏洞 - [PR #23678](https://github.com/BerriAI/litellm/pull/23678)
- **將 `tar` 升級至 7.5.11，將 `tornado` 升級至 6.5.5** — 修補相依套件傳遞依賴中的 CVE - [PR #23602](https://github.com/BerriAI/litellm/pull/23602)

---

## 資料庫 / Proxy 作業 {#database--proxy-operations}

- **修正既有執行個體上的 Prisma migrate deploy** — 解決遷移復原邏輯中的多個錯誤：P3018 等冪錯誤處理器中缺少 return，以及 `_roll_back_migration` 中未處理的例外，導致即使復原成功後仍出現靜默失敗 - [PR #23655](https://github.com/BerriAI/litellm/pull/23655)
- **讓 DB 遷移失敗退出改為可選** — 預設下 proxy 不再因 `prisma migrate deploy` 失敗而退出；可透過 `--enforce_prisma_migration_check` 啟用 - [PR #23675](https://github.com/BerriAI/litellm/pull/23675)

---

## 文件更新 {#documentation-updates}

- 新增 Anthropic `/v1/messages` → `/responses` 參數對應參考 - [PR #22893](https://github.com/BerriAI/litellm/pull/22893)
- 更新 Okta SSO 文件與自訂 SSO handler 範例 - [PR #22786](https://github.com/BerriAI/litellm/pull/22786)
- 在環境變數參考中新增 `LITELLM_MAX_BUDGET_PER_SESSION_TTL` - [PR #23186](https://github.com/BerriAI/litellm/pull/23186)
- 在 `CLAUDE.md` 中新增 DB 查詢效能指南 - [PR #23196](https://github.com/BerriAI/litellm/pull/23196)
- 新增 Gemini Vertex AI PayGo/priority 成本追蹤文件 - [PR #22948](https://github.com/BerriAI/litellm/pull/22948)

---

## 新貢獻者 {#new-contributors}

* @ryanh-ai 在 [PR #21542](https://github.com/BerriAI/litellm/pull/21542) 中完成首次貢獻
* @ryan-crabbe 在 [PR #23668](https://github.com/BerriAI/litellm/pull/23668) 中完成首次貢獻
* @Jah-yee 在 [PR #23525](https://github.com/BerriAI/litellm/pull/23525) 中完成首次貢獻
* @gambletan 在 [PR #23516](https://github.com/BerriAI/litellm/pull/23516) 中完成首次貢獻
* @awais786 在 [PR #23183](https://github.com/BerriAI/litellm/pull/23183) 中完成首次貢獻
* @pradyyadav 在 [PR #23580](https://github.com/BerriAI/litellm/pull/23580) 中完成首次貢獻
* @xianzongxie-stripe 在 [PR #23492](https://github.com/BerriAI/litellm/pull/23492) 中完成首次貢獻
* @Harshit28j 在 [PR #23333](https://github.com/BerriAI/litellm/pull/23333) 中完成首次貢獻
* @codspeed-hq[bot] 在 [PR #23676](https://github.com/BerriAI/litellm/pull/23676) 中完成首次貢獻

---

## 差異摘要 {#diff-summary}

## 03/16/2026 {#03162026}
* 新增提供者：7
* 新增模型 / 更新模型：116 個新增、132 個移除
* LLM API 端點：37
* 管理端點 / UI：31
* AI 整合：8
* MCP 閘道：5
* 支出追蹤、預算與速率限制：5
* 效能 / 負載平衡 / 可靠性改善：9
* 安全性：3
* 資料庫 / Proxy 作業：2
* 文件更新：5

---

## 完整變更記錄 {#full-changelog}
[v1.82.0-stable...v1.82.3-stable](https://github.com/BerriAI/litellm/compare/v1.82.0-stable...v1.82.3-stable)
