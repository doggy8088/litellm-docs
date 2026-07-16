---
title: "v1.80.11-stable - Google Interactions API"
slug: "v1-80-11"
date: 2025-12-20T10:00:00
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

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.80.11-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.11
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **Gemini 3 Flash Preview** - [支援 Google 的 Gemini 3 Flash Preview 與推理能力的第 0 天支援](../../docs/providers/gemini)
- **Stability AI Image Generation** - [Stability AI 影像生成與編輯的新提供者](../../docs/providers/stability)
- **LiteLLM Content Filter** - [內建防護欄，可偵測有害內容、偏見與 PII，並支援影像](../../docs/proxy/guardrails/litellm_content_filter)
- **New Provider: Venice.ai** - 透過 providers.json 支援 Venice.ai API
- **Unified Skills API** - [Skills API 可跨 Anthropic、Vertex、Azure 與 Bedrock 運作](../../docs/skills)
- **Azure Sentinel Logging** - [Azure Sentinel 的新記錄整合](../../docs/observability/azure_sentinel)
- **Guardrails Load Balancing** - [在多個防護欄提供者之間進行負載平衡](../../docs/proxy/guardrails)
- **Email Budget Alerts** - [當達到預算時傳送電子郵件通知](../../docs/proxy/email)
- **Cloudzero Integration on UI** - 直接在 UI 上設定您的 Cloudzero 整合

---

### UI 上的 Cloudzero 整合 {#cloudzero-integration-on-ui}

<Image
img={require('../../img/ui_cloudzero.png')}
style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

使用者現在可以直接在 UI 上設定他們的 Cloudzero 整合。

---
### 效能：LiteLLM SDK 的記憶體使用量與匯入延遲降低 50% {#performance-50-reduction-in-memory-usage-and-import-latency-for-the-litellm-sdk}

我們已完全重新架構 `litellm.__init__.py`，將耗費資源的匯入延後到實際需要時才執行，為 **109 個元件** 實作了延遲載入。

此重構包含 **41 個提供者設定類別**、**40 個工具函式**、快取實作（Redis、DualCache、InMemoryCache）、HTTP 處理器、記錄、型別，以及其他耗費資源的相依性。像 tiktoken 和 boto3 這類大型函式庫現在改為按需載入，而不是在匯入時就預先載入。

這使 LiteLLM 對於伺服器無狀態函式、Lambda 部署與容器化環境特別有利，因為冷啟動時間與記憶體占用都很重要。

---

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（5 個新提供者） {#new-providers-5-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | ------------------- | ----------- |
| [Stability AI](../../docs/providers/stability) | `/images/generations`, `/images/edits` | Stable Diffusion 3、SD3.5、影像編輯與生成 |
| Venice.ai | `/chat/completions`, `/messages`, `/responses` | 透過 providers.json 的 Venice.ai API 整合 |
| [Pydantic AI Agents](../../docs/providers/pydantic_ai_agent) | `/a2a` | 用於 A2A 協定工作流程的 Pydantic AI 代理程式 |
| [VertexAI Agent Engine](../../docs/providers/vertex_ai_agent_engine) | `/a2a` | 適用於 agentic 工作流程的 Google Vertex AI Agent Engine |
| [LinkUp Search](../../docs/search/linkup) | `/search` | LinkUp 網頁搜尋 API 整合 |

### 新 LLM API 端點（2 個新端點） {#new-llm-api-endpoints-2-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| -------- | ------ | ----------- | ------------- |
| `/interactions` | POST | 用於對話式 AI 的 Google Interactions API | [文件](../../docs/interactions) |
| `/search` | POST | 具 reranker 的 RAG Search API | [文件](../../docs/search/index) |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（55+ 個新模型） {#new-model-support-55-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Gemini | `gemini/gemini-3-flash-preview` | 1M | $0.50 | $3.00 | 推理、視覺、音訊、影片、PDF |
| Vertex AI | `vertex_ai/gemini-3-flash-preview` | 1M | $0.50 | $3.00 | 推理、視覺、音訊、影片、PDF |
| Azure AI | `azure_ai/deepseek-v3.2` | 164K | $0.58 | $1.68 | 推理、函式呼叫、快取 |
| Azure AI | `azure_ai/cohere-rerank-v4.0-pro` | 32K | $0.0025/query | - | Rerank |
| Azure AI | `azure_ai/cohere-rerank-v4.0-fast` | 32K | $0.002/query | - | Rerank |
| OpenRouter | `openrouter/openai/gpt-5.2` | 400K | $1.75 | $14.00 | 推理、視覺、快取 |
| OpenRouter | `openrouter/openai/gpt-5.2-pro` | 400K | $21.00 | $168.00 | 推理、視覺 |
| OpenRouter | `openrouter/mistralai/devstral-2512` | 262K | $0.15 | $0.60 | 函式呼叫 |
| OpenRouter | `openrouter/mistralai/ministral-3b-2512` | 131K | $0.10 | $0.10 | 函式呼叫、視覺 |
| OpenRouter | `openrouter/mistralai/ministral-8b-2512` | 262K | $0.15 | $0.15 | 函式呼叫、視覺 |
| OpenRouter | `openrouter/mistralai/ministral-14b-2512` | 262K | $0.20 | $0.20 | 函式呼叫、視覺 |
| OpenRouter | `openrouter/mistralai/mistral-large-2512` | 262K | $0.50 | $1.50 | 函式呼叫、視覺 |
| OpenAI | `gpt-4o-transcribe-diarize` | 16K | $6.00/audio | - | 含 diarization 的音訊轉錄 |
| OpenAI | `gpt-image-1.5-2025-12-16` | - | 多種 | 多種 | 影像生成 |
| Stability | `stability/sd3-large` | - | - | $0.065/image | 影像生成 |
| Stability | `stability/sd3.5-large` | - | - | $0.065/image | 影像生成 |
| Stability | `stability/stable-image-ultra` | - | - | $0.08/image | 影像生成 |
| Stability | `stability/inpaint` | - | - | $0.005/image | 影像編輯 |
| Stability | `stability/outpaint` | - | - | $0.004/image | 影像編輯 |
| Bedrock | `stability.stable-conservative-upscale-v1:0` | - | - | $0.40/image | 影像放大 |
| Bedrock | `stability.stable-creative-upscale-v1:0` | - | - | $0.60/image | 影像放大 |
| Vertex AI | `vertex_ai/deepseek-ai/deepseek-ocr-maas` | - | $0.30 | $1.20 | OCR |
| LinkUp | `linkup/search` | - | $5.87/1K queries | - | 網頁搜尋 |
| LinkUp | `linkup/search-deep` | - | $58.67/1K queries | - | 深層網路搜尋 |
| GitHub Copilot | 20+ models | 多種 | - | - | 聊天補全 |

#### 功能 {#features}

- **[Gemini](../../docs/providers/gemini)**
    - 新增 Gemini 3 Flash Preview Day 0 支援，包含 reasoning - [PR #18135](https://github.com/BerriAI/litellm/pull/18135)
    - 在批次 embeddings 中支援 extra_headers - [PR #18004](https://github.com/BerriAI/litellm/pull/18004)
    - 產生圖片時傳遞 token 使用量 - [PR #17987](https://github.com/BerriAI/litellm/pull/17987)
    - 圖片編輯請求改用 JSON，而非 form-data - [PR #18012](https://github.com/BerriAI/litellm/pull/18012)
    - 修正 web search 請求計數 - [PR #17921](https://github.com/BerriAI/litellm/pull/17921)
- **[Anthropic](../../docs/providers/anthropic)**
    - 根據 model 使用動態 max_tokens - [PR #17900](https://github.com/BerriAI/litellm/pull/17900)
    - 將 claude-3-7-sonnet 的 max_tokens 預設修正為 64K - [PR #17979](https://github.com/BerriAI/litellm/pull/17979)
    - 新增與 OpenAI 相容、支援 modify_params=True 的 API - [PR #17106](https://github.com/BerriAI/litellm/pull/17106)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 Gemini 3 Flash Preview 支援 - [PR #18164](https://github.com/BerriAI/litellm/pull/18164)
    - 新增 gemini-3-flash-preview 的 reasoning 支援 - [PR #18175](https://github.com/BerriAI/litellm/pull/18175)
    - 修正圖片編輯憑證來源 - [PR #18121](https://github.com/BerriAI/litellm/pull/18121)
    - 對自訂端點將憑證傳遞給 PredictionServiceClient - [PR #17757](https://github.com/BerriAI/litellm/pull/17757)
    - 修正文字 + base64 圖片組合的多模態 embeddings - [PR #18172](https://github.com/BerriAI/litellm/pull/18172)
    - 新增 DeepSeek model 的 OCR 支援 - [PR #17971](https://github.com/BerriAI/litellm/pull/17971)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 新增 Azure Cohere 4 reranking models - [PR #17961](https://github.com/BerriAI/litellm/pull/17961)
    - 新增 Azure DeepSeek V3.2 版本 - [PR #18019](https://github.com/BerriAI/litellm/pull/18019)
    - 在 get_provider_chat_config 中，針對 Claude models 回傳 AzureAnthropicConfig - [PR #18086](https://github.com/BerriAI/litellm/pull/18086)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 新增 Fireworks AI models 的 reasoning 參數支援 - [PR #17967](https://github.com/BerriAI/litellm/pull/17967)
- **[Bedrock](../../docs/providers/bedrock)**
    - 在 get_bedrock_model_id 中新增 Qwen 2 和 Qwen 3 - [PR #18100](https://github.com/BerriAI/litellm/pull/18100)
    - 路由至 bedrock 時移除 ttl 欄位 - [PR #18049](https://github.com/BerriAI/litellm/pull/18049)
    - 新增 Bedrock Stability 圖片編輯 models - [PR #18254](https://github.com/BerriAI/litellm/pull/18254)
- **[Perplexity](../../docs/providers/perplexity)**
    - 使用 API 提供的成本，而非手動計算 - [PR #17887](https://github.com/BerriAI/litellm/pull/17887)
- **[OpenAI](../../docs/providers/openai)**
    - 為音訊轉錄新增 diarize model - [PR #18117](https://github.com/BerriAI/litellm/pull/18117)
    - 在 model cost map 中新增 gpt-image-1.5-2025-12-16 - [PR #18107](https://github.com/BerriAI/litellm/pull/18107)
    - 修正 gpt-image-1 model 的成本計算 - [PR #17966](https://github.com/BerriAI/litellm/pull/17966)
- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 新增 github_copilot model 資訊 - [PR #17858](https://github.com/BerriAI/litellm/pull/17858)
- **[自訂 LLM](../../docs/providers/custom_llm_server)**
    - 新增 image_edit 與 aimage_edit 支援 - [PR #17999](https://github.com/BerriAI/litellm/pull/17999)

### 錯誤修正 {#bug-fixes}

- **[Gemini](../../docs/providers/gemini)**
    - 修正 Vertex AI 上 Gemini 3 Flash 的定價 - [PR #18202](https://github.com/BerriAI/litellm/pull/18202)
    - 為 gemini-2.5-flash-image models 新增 output_cost_per_image_token - [PR #18156](https://github.com/BerriAI/litellm/pull/18156)
    - 修正 OBJECT 類型的 properties 應為非空 - [PR #18237](https://github.com/BerriAI/litellm/pull/18237)
- **[Qwen](../../docs/providers/fireworks_ai)**
    - 新增 qwen3-embedding-8b 每 token 輸入價格 - [PR #18018](https://github.com/BerriAI/litellm/pull/18018)
- **一般**
    - 修正圖片 URL 處理 - [PR #18139](https://github.com/BerriAI/litellm/pull/18139)
    - 在 Image Processing 中支援附帶查詢參數的 Signed URLs - [PR #17976](https://github.com/BerriAI/litellm/pull/17976)
    - 將 encoding_format 設為 none，而不是省略 - [PR #18042](https://github.com/BerriAI/litellm/pull/18042)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增提供者特定工具支援 - [PR #17980](https://github.com/BerriAI/litellm/pull/17980)
    - 新增自訂標頭支援 - [PR #18036](https://github.com/BerriAI/litellm/pull/18036)
    - 修正 completion bridge 中的 tool calls 轉換 - [PR #18226](https://github.com/BerriAI/litellm/pull/18226)
    - 對工具結果使用含 input_text 的列表格式 - [PR #18257](https://github.com/BerriAI/litellm/pull/18257)
    - 在背景模式中新增成本追蹤 - [PR #18236](https://github.com/BerriAI/litellm/pull/18236)
    - 修正 Claude code responses API bridge 錯誤 - [PR #18194](https://github.com/BerriAI/litellm/pull/18194)
- **[Chat Completions API](../../docs/completion/input)**
    - 新增 agent skills 支援 - [PR #18031](https://github.com/BerriAI/litellm/pull/18031)
- **[Skills API](../../docs/skills)**
    - 統一的 Skills API 可跨 Anthropic、Vertex、Azure、Bedrock 運作 - [PR #18232](https://github.com/BerriAI/litellm/pull/18232)
- **[Search API](../../docs/search/index)**
    - 新增具 rerankers 的 RAG Search API - [PR #18217](https://github.com/BerriAI/litellm/pull/18217)
- **[Interactions API](../../docs/interactions)**
    - 在 SDK 與 AI Gateway 上新增 Google Interactions API - [PR #18079](https://github.com/BerriAI/litellm/pull/18079), [PR #18081](https://github.com/BerriAI/litellm/pull/18081)
- **[Image Edit API](../../docs/image_edits)**
    - 新增 drop_params 支援並修正 Vertex AI 設定 - [PR #18077](https://github.com/BerriAI/litellm/pull/18077)
- **一般**
    - 略過為 Vertex AI 新增 beta 標頭，因其不支援 - [PR #18037](https://github.com/BerriAI/litellm/pull/18037)
    - 修正 managed files 端點 - [PR #18046](https://github.com/BerriAI/litellm/pull/18046)
    - 在 proxy 中允許非 Azure 提供者使用 base_model - [PR #18038](https://github.com/BerriAI/litellm/pull/18038)

#### 錯誤 {#bugs}

- **一般**
    - 修正 guardrail translation 中的 basemodel 匯入 - [PR #17977](https://github.com/BerriAI/litellm/pull/17977)
    - 修正 No module named 'fastapi' 錯誤 - [PR #18239](https://github.com/BerriAI/litellm/pull/18239)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 為 credentials table 新增 master key 旋轉 - [PR #17952](https://github.com/BerriAI/litellm/pull/17952)
    - 修正 tag 管理以保留 litellm_params 中的加密欄位 - [PR #17484](https://github.com/BerriAI/litellm/pull/17484)
    - 修正 key 刪除與重新產生權限 - [PR #18214](https://github.com/BerriAI/litellm/pull/18214)
- **模型 + 端點**
    - 在 UI 中新增 Models Conditional Rendering - [PR #18071](https://github.com/BerriAI/litellm/pull/18071)
    - 在 UI 中新增 Wildcard Model 的 Health Check Model - [PR #18269](https://github.com/BerriAI/litellm/pull/18269)
    - 自動解析 Vector Store Embedding Model 設定 - [PR #18167](https://github.com/BerriAI/litellm/pull/18167)
- **向量儲存**
    - 新增 Milvus Vector Store UI 支援 - [PR #18030](https://github.com/BerriAI/litellm/pull/18030)
    - 在 Team Update 中持久化 Vector Store 設定 - [PR #18274](https://github.com/BerriAI/litellm/pull/18274)
- **記錄與支出**
    - 在 Logs 中新增 LiteLLM Overhead - [PR #18033](https://github.com/BerriAI/litellm/pull/18033)
    - 在 Logs UI 中顯示 LiteLLM Overhead - [PR #18034](https://github.com/BerriAI/litellm/pull/18034)
    - 在 Usage Page 將 Team ID 解析為 Team Alias - [PR #18275](https://github.com/BerriAI/litellm/pull/18275)
    - 修正 Usage Page Top Key View 按鈕可見性 - [PR #18203](https://github.com/BerriAI/litellm/pull/18203)
- **SSO 與健康狀態**
    - 新增 SSO Readiness Health Check - [PR #18078](https://github.com/BerriAI/litellm/pull/18078)
    - 修正 /health/test_connection 以解析如 /chat/completions 的環境變數 - [PR #17752](https://github.com/BerriAI/litellm/pull/17752)
- **CloudZero**
    - 新增 CloudZero Cost Tracking UI - [PR #18163](https://github.com/BerriAI/litellm/pull/18163)
    - 新增刪除 CloudZero Settings 路由與 UI - [PR #18168](https://github.com/BerriAI/litellm/pull/18168), [PR #18170](https://github.com/BerriAI/litellm/pull/18170)
- **一般**
    - 更新非 root Docker 的 UI 路徑處理 - [PR #17989](https://github.com/BerriAI/litellm/pull/17989)

#### 錯誤 {#bugs-1}

- **UI 修正**
    - 修正登入頁面 Failed To Parse JSON Error - [PR #18159](https://github.com/BerriAI/litellm/pull/18159)
    - 修正 new user 路由的 user_id 衝突處理 - [PR #17559](https://github.com/BerriAI/litellm/pull/17559)
    - 修正 Callback Environment Variables 大小寫 - [PR #17912](https://github.com/BerriAI/litellm/pull/17912)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Azure Sentinel](../../docs/observability/azure_sentinel)**
    - 新增 Azure Sentinel Logger 整合 - [PR #18146](https://github.com/BerriAI/litellm/pull/18146)
- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 新增擷取自訂標籤頂層中繼資料 - [PR #18087](https://github.com/BerriAI/litellm/pull/18087)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 log_failure_event 無法運作 - [PR #18234](https://github.com/BerriAI/litellm/pull/18234)
- **[Arize Phoenix](../../docs/observability/phoenix_integration)**
    - 修正巢狀 spans - [PR #18102](https://github.com/BerriAI/litellm/pull/18102)
- **一般**
    - 將 extra_headers 變更為 additional_headers - [PR #17950](https://github.com/BerriAI/litellm/pull/17950)

### 防護欄 {#guardrails}

- **[LiteLLM 內容過濾器](../../docs/proxy/guardrails/litellm_content_filter)**
    - 新增針對有害內容、偏見等的內建防護欄 - [PR #18029](https://github.com/BerriAI/litellm/pull/18029)
    - 新增支援對圖片執行內容過濾 - [PR #18044](https://github.com/BerriAI/litellm/pull/18044)
    - 新增對 Brazil PII 欄位的支援 - [PR #18076](https://github.com/BerriAI/litellm/pull/18076)
    - 新增可設定的內容過濾防護欄選項 - [PR #18007](https://github.com/BerriAI/litellm/pull/18007)
- **[Guardrails API](../../docs/adding_provider/generic_guardrail_api)**
    - 支援在 `/chat/completions`、`/v1/responses`、`/v1/messages` 上進行 LLM 工具呼叫回應檢查 - [PR #17619](https://github.com/BerriAI/litellm/pull/17619)
    - 新增 guardrails 負載平衡 - [PR #18181](https://github.com/BerriAI/litellm/pull/18181)
    - 修正 passthrough endpoint 的 guardrails - [PR #18109](https://github.com/BerriAI/litellm/pull/18109)
    - 為 pass-through endpoints 上的 guardrails 新增標頭到 metadata - [PR #17992](https://github.com/BerriAI/litellm/pull/17992)
    - 修正 OpenRouter models 上 guardrail 的各種問題 - [PR #18085](https://github.com/BerriAI/litellm/pull/18085)
- **[Lakera](../../docs/proxy/guardrails/lakera_ai)**
    - 為 Lakera 新增監控模式 - [PR #18084](https://github.com/BerriAI/litellm/pull/18084)
- **[Pillar Security](../../docs/proxy/guardrails/pillar_security)**
    - 新增遮罩支援與 MCP 呼叫支援 - [PR #17959](https://github.com/BerriAI/litellm/pull/17959)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 新增對 Bedrock 圖片 guardrails 的支援 - [PR #18115](https://github.com/BerriAI/litellm/pull/18115)
    - Guardrails 封鎖動作優先於遮罩 - [PR #17968](https://github.com/BerriAI/litellm/pull/17968)

### 秘密管理器 {#secret-managers}

- **[HashiCorp Vault](../../docs/secret_managers/hashicorp_vault)**
    - 新增可設定 Vault mount 的文件 - [PR #18082](https://github.com/BerriAI/litellm/pull/18082)
    - 新增每團隊 Vault 設定 - [PR #18150](https://github.com/BerriAI/litellm/pull/18150)
- **UI**
    - 在團隊管理 UI 中新增秘密管理器設定控制項 - [PR #18149](https://github.com/BerriAI/litellm/pull/18149)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **電子郵件預算警示** - 當達到預算時傳送電子郵件通知 - [PR #17995](https://github.com/BerriAI/litellm/pull/17995)

---

## MCP 閘道 {#mcp-gateway}

- **驗證標頭傳遞** - 新增 MCP 驗證標頭傳遞 - [PR #17963](https://github.com/BerriAI/litellm/pull/17963)
- **修正 deepcopy 錯誤** - 修正處理請求時的 MCP 工具呼叫 deepcopy 錯誤 - [PR #18010](https://github.com/BerriAI/litellm/pull/18010)
- **修正 list tool** - 修正沒有資料庫連線時 MCP list_tools 無法運作的問題 - [PR #18161](https://github.com/BerriAI/litellm/pull/18161)

---

## 代理程式閘道 (A2A) {#agent-gateway-a2a}

- **新提供者：Agent Gateway** - 新增對 pydantic ai agents 的支援 - [PR #18013](https://github.com/BerriAI/litellm/pull/18013)
- **VertexAI Agent Engine** - 新增 Vertex AI Agent Engine 提供者 - [PR #18014](https://github.com/BerriAI/litellm/pull/18014)
- **修正模型擷取** - 修正 get_model_from_request() 以從 Vertex AI passthrough URLs 擷取 model ID - [PR #18097](https://github.com/BerriAI/litellm/pull/18097)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **延遲匯入** - 使用按屬性延遲匯入並擷取共用常數 - [PR #17994](https://github.com/BerriAI/litellm/pull/17994)
- **延遲載入 HTTP 處理器** - 延遲載入 http handlers - [PR #17997](https://github.com/BerriAI/litellm/pull/17997)
- **延遲載入快取** - 延遲載入快取 - [PR #18001](https://github.com/BerriAI/litellm/pull/18001)
- **延遲載入類型** - 延遲載入 bedrock types、.types.utils、GuardrailItem - [PR #18053](https://github.com/BerriAI/litellm/pull/18053), [PR #18054](https://github.com/BerriAI/litellm/pull/18054), [PR #18072](https://github.com/BerriAI/litellm/pull/18072)
- **延遲載入設定** - 延遲載入 41 個設定類別 - [PR #18267](https://github.com/BerriAI/litellm/pull/18267)
- **延遲載入用戶端裝飾器** - 延遲載入大型用戶端裝飾器匯入 - [PR #18064](https://github.com/BerriAI/litellm/pull/18064)
- **Prisma 建置時間** - 在建置時而非執行時下載 Prisma binaries，以供安全受限環境使用 - [PR #17695](https://github.com/BerriAI/litellm/pull/17695)
- **Docker Alpine** - 為 ARM64 音訊處理在 Alpine image 中新增 libsndfile - [PR #18092](https://github.com/BerriAI/litellm/pull/18092)
- **安全性** - 防止 LiteLLM API key 在 /health endpoint 失敗時外洩 - [PR #18133](https://github.com/BerriAI/litellm/pull/18133)

---

## 文件更新 {#documentation-updates}

- **SAP 文件** - 更新 SAP 文件 - [PR #17974](https://github.com/BerriAI/litellm/pull/17974)
- **Pydantic AI Agents** - 新增關於在 LiteLLM A2A gateway 中使用 pydantic ai agents 的文件 - [PR #18026](https://github.com/BerriAI/litellm/pull/18026)
- **Vertex AI Agent Engine** - 新增 Vertex AI Agent Engine 文件 - [PR #18027](https://github.com/BerriAI/litellm/pull/18027)
- **Router 順序** - 新增 router order 參數文件 - [PR #18045](https://github.com/BerriAI/litellm/pull/18045)
- **秘密管理器設定** - 改善秘密管理器設定文件 - [PR #18235](https://github.com/BerriAI/litellm/pull/18235)
- **Gemini 3 Flash** - 在 Gemini 3 Flash 部落格中新增版本需求 - [PR #18227](https://github.com/BerriAI/litellm/pull/18227)
- **README** - 擴充 Responses API 區段並更新 endpoints - [PR #17354](https://github.com/BerriAI/litellm/pull/17354)
- **Amazon Nova** - 在側邊欄和支援模型中新增 Amazon Nova - [PR #18220](https://github.com/BerriAI/litellm/pull/18220)
- **Benchmarks** - 在 benchmarks 文件中新增基礎設施建議 - [PR #18264](https://github.com/BerriAI/litellm/pull/18264)
- **損壞的連結** - 修正損壞連結的更正 - [PR #18104](https://github.com/BerriAI/litellm/pull/18104)
- **README 修正** - 各種 README 改進 - [PR #18206](https://github.com/BerriAI/litellm/pull/18206)

---

## 基礎設施 / CI/CD {#infrastructure--cicd}

- **PR 範本** - 新增 LiteLLM 團隊 PR 範本與 CI/CD 規則 - [PR #17983](https://github.com/BerriAI/litellm/pull/17983), [PR #17985](https://github.com/BerriAI/litellm/pull/17985)
- **Issue 標記** - 透過元件下拉選單和更多提供者關鍵字改善 issue 標記 - [PR #17957](https://github.com/BerriAI/litellm/pull/17957)
- **PR 範本清理** - 移除 PR 範本中多餘欄位 - [PR #17956](https://github.com/BerriAI/litellm/pull/17956)
- **相依套件** - 將 altcha-lib 從 1.3.0 升級到 1.4.1 - [PR #18017](https://github.com/BerriAI/litellm/pull/18017)

---

## 新貢獻者 {#new-contributors}

* @dongbin-lunark 在 [PR #17757](https://github.com/BerriAI/litellm/pull/17757) 中完成了第一次貢獻
* @qdrddr 在 [PR #18004](https://github.com/BerriAI/litellm/pull/18004) 中完成了第一次貢獻
* @donicrosby 在 [PR #17962](https://github.com/BerriAI/litellm/pull/17962) 中完成了第一次貢獻
* @NicolaivdSmagt 在 [PR #17992](https://github.com/BerriAI/litellm/pull/17992) 中完成了第一次貢獻
* @Reapor-Yurnero 在 [PR #18085](https://github.com/BerriAI/litellm/pull/18085) 中完成了第一次貢獻
* @jk-f5 在 [PR #18086](https://github.com/BerriAI/litellm/pull/18086) 中完成了第一次貢獻
* @castrapel 在 [PR #18077](https://github.com/BerriAI/litellm/pull/18077) 中完成了第一次貢獻
* @dtikhonov 在 [PR #17484](https://github.com/BerriAI/litellm/pull/17484) 中完成了第一次貢獻
* @opleonnn 在 [PR #18175](https://github.com/BerriAI/litellm/pull/18175) 中完成了第一次貢獻
* @eurogig 在 [PR #18084](https://github.com/BerriAI/litellm/pull/18084) 中完成了第一次貢獻

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上檢視完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.80.10-nightly...v1.80.11)**
