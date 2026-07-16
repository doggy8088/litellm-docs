---
title: "v1.79.3-stable - 內建 AI Gateway 防護欄"
slug: "v1-79-3"
date: 2025-11-08T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.79.3-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.79.3.rc.1
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **LiteLLM 自訂防護欄** - 具備 UI 設定支援的內建防護欄
- **效能改善** - `/responses` API 延遲中位數降低 19×
- **Veo3 影片生成（Vertex AI + Google AI Studio）** - 使用 OpenAI Video API 搭配 Vertex AI 與 Google AI Studio Veo3 模型來生成影片

---

### AI Gateway 上的內建防護欄 {#built-in-guardrails-on-ai-gateway}

<Image 
  img={require('../../img/release_notes/built_in_guard.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

此版本為 LiteLLM AI Gateway 引入內建防護欄，讓您無須依賴外部防護欄 API 即可強制執行保護措施。

- **封鎖關鍵字** - 封鎖已知的敏感關鍵字，例如 "litellm"、"python" 等。
- **模式偵測** - 封鎖已知的敏感模式，例如電子郵件、社會安全號碼、API 金鑰等。
- **自訂 Regex 模式** - 為您的特定使用情境定義自訂 regex 模式。

請在 [此處](https://docs.litellm.ai/docs/proxy/guardrails/litellm_content_filter) 開始使用 AI Gateway 的內建防護欄。

---

### 效能 – `/responses` 19× 更低的延遲中位數 {#performance--responses-19-lower-median-latency}

此更新透過整合我們用於連線處理的內部網路管理，顯著改善了 `/responses` 延遲，消除了每次請求的初始化額外負擔。

#### 結果 {#results}

| 指標 | 之前 | 之後 | 改善 |
|--------|--------|-------|-------------|
| 延遲中位數 | 3,600 ms | **190 ms** | **−95%（快約 19×）** |
| p95 延遲 | 4,300 ms | **280 ms** | −93% |
| p99 延遲 | 4,600 ms | **590 ms** | −87% |
| 平均延遲 | 3,571 ms | **208 ms** | −94% |
| RPS | 231 | **1,059** | +358% |

#### 測試設定 {#test-setup}

| 類別 | 規格 |
|----------|---------------|
| **負載測試** | Locust：1,000 個並發使用者，500 個逐步升載 |
| **系統** | 4 vCPUs、8 GB RAM、4 個 workers、4 個 instances |
| **資料庫** | PostgreSQL（未使用 Redis） |
| **設定** | [config.yaml](https://gist.github.com/AlexsanderHamir/550791675fd752befcac6a9e44024652) |
| **負載腳本** | [no_cache_hits.py](https://gist.github.com/AlexsanderHamir/99d673bf74cdd81fd39f59fa9048f2e8) |

---

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Azure | `azure/gpt-5-pro` | 272K | $15.00 | $120.00 | Responses API、reasoning、vision、PDF input |
| Azure | `azure/gpt-image-1-mini` | - | - | - | 影像生成 - 依像素定價 |
| Azure | `azure/container` | - | - | - | Container API - $0.03/session |
| OpenAI | `openai/container` | - | - | - | Container API - $0.03/session |
| Cohere | `cohere/embed-v4.0` | 128K | $0.12 | - | 支援圖片輸入的 embeddings |
| Gemini | `gemini/gemini-live-2.5-flash-preview-native-audio-09-2025` | 1M | $0.30 | $2.00 | 原生 audio、vision、web search |
| Vertex AI | `vertex_ai/minimaxai/minimax-m2-maas` | 196K | $0.30 | $1.20 | Function calling、tool choice |
| NVIDIA | `nvidia/nemotron-nano-9b-v2` | - | - | - | 聊天補全 |

#### OCR 模型 {#ocr-models}

| 提供者 | 模型 | 每頁成本 | 功能 |
| -------- | ----- | ------------- | -------- |
| Azure AI | `azure_ai/doc-intelligence/prebuilt-read` | $0.0015 | 文件閱讀 |
| Azure AI | `azure_ai/doc-intelligence/prebuilt-layout` | $0.01 | 版面分析 |
| Azure AI | `azure_ai/doc-intelligence/prebuilt-document` | $0.01 | 文件處理 |
| Vertex AI | `vertex_ai/mistral-ocr-2505` | $0.0005 | OCR 處理 |

#### 搜尋模型 {#search-models}

| 提供者 | 模型 | 定價 | 功能 |
| -------- | ----- | ------- | -------- |
| Firecrawl | `firecrawl/search` | 分級：$0.00166-$0.0166/查詢 | 每次查詢 10-100 筆結果 |
| SearXNG | `searxng/search` | 免費 | 開源 metasearch |

#### 功能 {#features}

- **[Azure](../../docs/providers/azure)**
    - 新增 Azure GPT-5-Pro Responses API 支援與 reasoning 功能 - [PR #16235](https://github.com/BerriAI/litellm/pull/16235)
    - 新增 Azure 的 gpt-image-1-mini 定價與品質等級（low/medium/high） - [PR #16182](https://github.com/BerriAI/litellm/pull/16182)
    - 新增在 Azure OpenAI 發生 exceptions 時回傳 Azure Content Policy 錯誤資訊的支援 - [PR #16231](https://github.com/BerriAI/litellm/pull/16231)
    - 修正 Azure GPT-5 錯誤路由至 O-series 設定（不支援 temperature 參數） - [PR #16246](https://github.com/BerriAI/litellm/pull/16246)
    - 修正 Azure 不接受額外的 body 參數 - [PR #16116](https://github.com/BerriAI/litellm/pull/16116)
    - 修正 Azure DALL-E-3 健康檢查的內容政策違規問題，改用安全的預設提示詞 - [PR #16329](https://github.com/BerriAI/litellm/pull/16329)

- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 AWS Bedrock Converse API 中空白 assistant 訊息的處理，以避免 400 Bad Request 錯誤 - [PR #15850](https://github.com/BerriAI/litellm/pull/15850)
    - 修正：從 Bedrock InvokeModel request body 中過濾 AWS 驗證參數 - [PR #16315](https://github.com/BerriAI/litellm/pull/16315)
    - 修正 Bedrock proxy 在 file content 中新增 name，當使用 cache_control 時會造成失敗 - [PR #16275](https://github.com/BerriAI/litellm/pull/16275)
    - 修正 global.anthropic.claude-haiku-4-5-20251001-v1:0 的 supports_reasoning 標記並更新定價 - [PR #16263](https://github.com/BerriAI/litellm/pull/16263)

- **[Gemini（Google AI Studio + Vertex AI）](../../docs/providers/gemini)**
    - 在 model map 中新增 gemini live audio model 成本 - [PR #16183](https://github.com/BerriAI/litellm/pull/16183)
    - 修正 Gemini parallel tool calls 的翻譯問題 - [PR #16194](https://github.com/BerriAI/litellm/pull/16194)
    - 修正：透過 x-goog-api-key header 搭配自訂 api_base 傳送 Gemini API key - [PR #16085](https://github.com/BerriAI/litellm/pull/16085)
    - 修正 image_config.aspect_ratio 對 gemini-2.5-flash-image 無效的問題 - [PR #15999](https://github.com/BerriAI/litellm/pull/15999)
    - 修正 Gemini minimal reasoning 環境變數覆寫導致 thoughts 停用的問題 - [PR #16347](https://github.com/BerriAI/litellm/pull/16347)
    - 修正 gemini-2.5-flash 的 cache_read_input_token_cost - [PR #16354](https://github.com/BerriAI/litellm/pull/16354)

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 VertexAI 的 Anthropic token 計數 - [PR #16171](https://github.com/BerriAI/litellm/pull/16171)
    - 修正 anthropic-adapter：正確將 Anthropic 影像格式轉換為 OpenAI - [PR #16202](https://github.com/BerriAI/litellm/pull/16202)
    - 在 Databricks 上為 Claude 啟用自動化提示快取訊息格式 - [PR #16200](https://github.com/BerriAI/litellm/pull/16200)
    - 新增對 Anthropic Memory Tool 的支援 - [PR #16115](https://github.com/BerriAI/litellm/pull/16115)
    - 傳遞模型資訊的 cache 建立/讀取 token 成本，以修正 Anthropic 長上下文成本計算 - [PR #16376](https://github.com/BerriAI/litellm/pull/16376)

- **[Vertex AI](../../docs/providers/vertex_ai)**
    - 新增 Vertex MiniMAX m2 模型支援 - [PR #16373](https://github.com/BerriAI/litellm/pull/16373)
    - 正確將 429 Resource Exhausted 對應至 RateLimitError - [PR #16363](https://github.com/BerriAI/litellm/pull/16363)
    - 新增 `vertex_credentials` 對 `litellm.rerank()` 的支援，用於 Vertex AI - [PR #16266](https://github.com/BerriAI/litellm/pull/16266)

- **[Databricks](../../docs/providers/databricks)**
    - 修正 databricks streaming - [PR #16368](https://github.com/BerriAI/litellm/pull/16368)

- **[Deepgram](../../docs/providers/deepgram)**
    - 在請求需要時回傳 diarized transcript - [PR #16133](https://github.com/BerriAI/litellm/pull/16133)

- **[Fireworks](../../docs/providers/fireworks_ai)**
    - 將 Fireworks audio endpoints 更新為新的 `api.fireworks.ai` domains - [PR #16346](https://github.com/BerriAI/litellm/pull/16346)

- **[Cohere](../../docs/providers/cohere)**
    - 新增 cohere embed-v4.0 模型支援 - [PR #16358](https://github.com/BerriAI/litellm/pull/16358)

- **[Watsonx](../../docs/providers/watsonx)**
    - 支援 `reasoning_effort` 用於 watsonx chat models - [PR #16261](https://github.com/BerriAI/litellm/pull/16261)

- **[OpenAI](../../docs/providers/openai)**
    - 移除 reasoning_effort 轉換中的自動摘要 - [PR #16210](https://github.com/BerriAI/litellm/pull/16210)

- **[XAI](../../docs/providers/xai)**
    - 移除 Grok 4 Models 的 Reasoning Effort 參數 - [PR #16265](https://github.com/BerriAI/litellm/pull/16265)

- **[Hosted VLLM](../../docs/providers/vllm)**
    - 修正 HostedVLLMRerankConfig 不會被使用 - [PR #16352](https://github.com/BerriAI/litellm/pull/16352)

#### 新增提供者支援 {#new-provider-support}

- **[Bedrock Agentcore](../../docs/providers/bedrock)**
    - 在 LiteLLM Python SDK 和 LiteLLM AI Gateway 中新增 Bedrock Agentcore 作為提供者 - [PR #16252](https://github.com/BerriAI/litellm/pull/16252)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[OCR API](../../docs/ocr)**
    - 新增 VertexAI OCR 提供者支援 + 成本追蹤 - [PR #16216](https://github.com/BerriAI/litellm/pull/16216)
    - 新增 Azure AI Doc Intelligence OCR 支援 - [PR #16219](https://github.com/BerriAI/litellm/pull/16219)

- **[Search API](../../docs/search)**
    - 新增支援分級定價的 firecrawl search API - [PR #16257](https://github.com/BerriAI/litellm/pull/16257)
    - 新增 searxng search API 提供者 - [PR #16259](https://github.com/BerriAI/litellm/pull/16259)

- **[Responses API](../../docs/response_api)**
    - 支援 langfuse otel 中的 responses API 串流 - [PR #16153](https://github.com/BerriAI/litellm/pull/16153)
    - 在 Responses API 請求中將 extra_body 參數傳遞給提供者 - [PR #16320](https://github.com/BerriAI/litellm/pull/16320)

- **[Container API](../../docs/container_api)**
    - 新增 E2E Container API 支援 - [PR #16136](https://github.com/BerriAI/litellm/pull/16136)
    - 更新 container 文件，使其與其他文件類似 - [PR #16327](https://github.com/BerriAI/litellm/pull/16327)

- **[Video Generation API](../../docs/video_generation)**
    - 新增 Vertex 和 Gemini Videos API，並支援成本追蹤 + UI 支援 - [PR #16323](https://github.com/BerriAI/litellm/pull/16323)
    - 新增 `custom_llm_provider` 對影片端點（非生成）的支援 - [PR #16121](https://github.com/BerriAI/litellm/pull/16121)

- **[Audio API](../../docs/audio)**
    - 新增 gpt-4o-transcribe 成本追蹤 - [PR #16412](https://github.com/BerriAI/litellm/pull/16412)

- **[Vector Stores](../../docs/vector_stores)**
    - Milvus - 支援搜尋向量儲存 + 在 passthrough 上支援 multipart form data - [PR #16035](https://github.com/BerriAI/litellm/pull/16035)
    - Azure AI Vector Stores - 支援「virtual」索引 + 在 passthrough API 上建立向量儲存 - [PR #16160](https://github.com/BerriAI/litellm/pull/16160)
    - Milvus - Passthrough API 支援 - 新增透過 passthrough API 建立 + 讀取向量儲存的支援 - [PR #16170](https://github.com/BerriAI/litellm/pull/16170)

- **[Embeddings API](../../docs/embedding/supported_embedding)**
    - 在 embeddings 端點中使用有效的 CallTypes enum 值 - [PR #16328](https://github.com/BerriAI/litellm/pull/16328)

- **[Rerank API](../../docs/rerank)**
    - 在通用成本計算器中將分級定價一般化 - [PR #16150](https://github.com/BerriAI/litellm/pull/16150)

#### 錯誤修正 {#bugs}

- **一般**
    - 修正在串流模式下，當 n>1 且有工具呼叫時，index 欄位未填入 - [PR #15962](https://github.com/BerriAI/litellm/pull/15962)
    - 在 litellm_params 中傳遞 aws_region_name - [PR #16321](https://github.com/BerriAI/litellm/pull/16321)
    - 新增 `retry-after` 標頭支援，用於錯誤 `502`、`503`、`504` - [PR #16288](https://github.com/BerriAI/litellm/pull/16288)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - UI - 刪除團隊成員時增加摩擦 - [PR #16167](https://github.com/BerriAI/litellm/pull/16167)
    - UI - Litellm 測試金鑰音訊支援 - [PR #16251](https://github.com/BerriAI/litellm/pull/16251)
    - UI - 測試金鑰頁面恢復模型為單選 - [PR #16390](https://github.com/BerriAI/litellm/pull/16390)

- **模型 + 端點**
    - UI - 新增模型既有憑證改善 - [PR #16166](https://github.com/BerriAI/litellm/pull/16166)
    - UI - 新增 Azure AD Token 欄位，且 Azure API Key 為選用 - [PR #16331](https://github.com/BerriAI/litellm/pull/16331)
    - UI - 修正模型建立流程中 vLLM 的標籤 - [PR #16285](https://github.com/BerriAI/litellm/pull/16285)
    - UI - 在團隊模型表格中包含模型存取群組模型 - [PR #16298](https://github.com/BerriAI/litellm/pull/16298)
    - 修正 /model_group/info 對 SSO 使用者回傳完整模型清單 - [PR #16296](https://github.com/BerriAI/litellm/pull/16296)
    - 修正 Litellm 非 root docker Model Hub 表格 - [PR #16282](https://github.com/BerriAI/litellm/pull/16282)

- **防護欄**
    - UI - 修正防護欄實體無法被選取且未顯示的回歸問題 - [PR #16165](https://github.com/BerriAI/litellm/pull/16165)
    - UI - 防護欄資訊頁顯示 PII 設定 - [PR #16164](https://github.com/BerriAI/litellm/pull/16164)
    - 將 guardrail_information 變更為 list 類型 - [PR #16127](https://github.com/BerriAI/litellm/pull/16127)
    - UI - LiteLLM 防護欄 - 確保您可以看到 PII Patterns 的 UI 友善名稱 - [PR #16382](https://github.com/BerriAI/litellm/pull/16382)
    - UI - 防護欄 - LiteLLM 內容過濾器，允許檢視/編輯內容過濾器設定 - [PR #16383](https://github.com/BerriAI/litellm/pull/16383)
    - UI - 防護欄 - 允許透過 UI 更新防護欄。確保 litellm_params 實際上會在記憶體中更新 - [PR #16384](https://github.com/BerriAI/litellm/pull/16384)

- **SSO 設定**
    - 支援 ui sso 上的點號表示法 - [PR #16135](https://github.com/BerriAI/litellm/pull/16135)
    - UI - 防止 sso proxy base url 輸入中出現尾端斜線 - [PR #16244](https://github.com/BerriAI/litellm/pull/16244)
    - UI - SSO Proxy Base URL 輸入驗證並移除標準化 / - [PR #16332](https://github.com/BerriAI/litellm/pull/16332)
    - UI - 在建立流程中顯示 SSO 建立錯誤 - [PR #16369](https://github.com/BerriAI/litellm/pull/16369)

- **使用情況與分析**
    - UI - 標記使用情況頂部模型表格檢視與標籤修正 - [PR #16249](https://github.com/BerriAI/litellm/pull/16249)
    - UI - Litellm 使用日期選擇器 - [PR #16264](https://github.com/BerriAI/litellm/pull/16264)

- **快取設定**
    - UI - 快取設定 Redis 新增語意快取設定 - [PR #16398](https://github.com/BerriAI/litellm/pull/16398)

#### 錯誤修正 {#bugs-1}

- **一般**
    - UI - 移除 embedding models 請求中的 encoding_format - [PR #16367](https://github.com/BerriAI/litellm/pull/16367)
    - UI - 還原測試金鑰多模型選擇的變更 - [PR #16372](https://github.com/BerriAI/litellm/pull/16372)
    - UI - 各種小問題 - [PR #16406](https://github.com/BerriAI/litellm/pull/16406)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 langfuse 快取 token 的輸入 token 邏輯 - [PR #16203](https://github.com/BerriAI/litellm/pull/16203)

- **[Opik](../../docs/proxy/logging#opik)**
    - 修正錯誤：無法正確附加到既有 trace，並進行重構 - [PR #15529](https://github.com/BerriAI/litellm/pull/15529)

- **[S3](../../docs/proxy/logging#s3)**
    - S3 logger，新增在使用 minio logger 時對 ssl_verify 的支援 - [PR #16211](https://github.com/BerriAI/litellm/pull/16211)
    - 移除 s3 中的 base64 - [PR #16157](https://github.com/BerriAI/litellm/pull/16157)
    - 新增允許以 Key 為基礎的前綴到 s3 path - [PR #16237](https://github.com/BerriAI/litellm/pull/16237)
    - 新增 Prometheus 指標以追蹤 S3 中的 callback 記錄失敗 - [PR #16209](https://github.com/BerriAI/litellm/pull/16209)

- **[OpenTelemetry](../../docs/proxy/logging#opentelemetry)**
    - OTEL - 在 OTEL Logger 上記錄成本明細 - [PR #16334](https://github.com/BerriAI/litellm/pull/16334)

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 新增對 `datadog` callback 的 DD Agent Host 支援 - [PR #16379](https://github.com/BerriAI/litellm/pull/16379)

### 防護欄 {#guardrails}

- **[Noma](../../docs/proxy/guardrails)**
    - 還原 Noma 套用防護欄實作 - [PR #16214](https://github.com/BerriAI/litellm/pull/16214)
    - Litellm noma 防護欄支援圖片 - [PR #16199](https://github.com/BerriAI/litellm/pull/16199)

- **[PANW Prisma AIRS](../../docs/proxy/guardrails)**
    - PANW prisma airs 防護欄去重與增強的工作階段追蹤 - [PR #16273](https://github.com/BerriAI/litellm/pull/16273)

- **[LiteLLM 自訂防護欄](../../docs/proxy/guardrails)**
    - 新增 LiteLLM Gateway 內建防護欄 - [PR #16338](https://github.com/BerriAI/litellm/pull/16338)
    - UI - 允許設定 LiteLLM Custom Guardrail - [PR #16339](https://github.com/BerriAI/litellm/pull/16339)
    - 錯誤修正：Content Filter Guard - [PR #16414](https://github.com/BerriAI/litellm/pull/16414)

### 密鑰管理員 {#secret-managers}

- **[CyberArk](../../docs/secret_managers)**
    - 新增 CyberArk Secrets Manager 整合 - [PR #16278](https://github.com/BerriAI/litellm/pull/16278)
    - Cyber Ark - 新增金鑰輪替支援 - [PR #16289](https://github.com/BerriAI/litellm/pull/16289)

- **[HashiCorp Vault](../../docs/secret_managers)**
    - 為 HashiCorp Vault 新增可設定的 mount 名稱與 path 前綴 - [PR #16253](https://github.com/BerriAI/litellm/pull/16253)
    - Secret Manager - Hashicorp，新增透過 approle 驗證 - [PR #16374](https://github.com/BerriAI/litellm/pull/16374)

- **[AWS Secrets Manager](../../docs/secret_managers)**
    - 為 aws secrets manager 新增 tags 與 descriptions 支援 - [PR #16224](https://github.com/BerriAI/litellm/pull/16224)

- **[自訂密鑰管理器](../../docs/secret_managers)**
    - 新增 Custom Secret Manager - 允許使用者定義並撰寫自訂密鑰管理員 - [PR #16297](https://github.com/BerriAI/litellm/pull/16297)

- **一般**
    - 電子郵件通知 - 確保使用者收到金鑰輪替電子郵件 - [PR #16292](https://github.com/BerriAI/litellm/pull/16292)
    - 修正 sts boto3 的 ssl 驗證 - [PR #16313](https://github.com/BerriAI/litellm/pull/16313)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤**
    - 修正 OpenAI Responses API 串流測試的 usage 欄位名稱與成本計算 - [PR #16236](https://github.com/BerriAI/litellm/pull/16236)

---

## MCP 閘道 {#mcp-gateway}

- **組態**
    - 設定靜態 mcp 標頭 - [PR #16179](https://github.com/BerriAI/litellm/pull/16179)
    - 將 mcp 憑證持久化至資料庫 - [PR #16308](https://github.com/BerriAI/litellm/pull/16308)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **記憶體洩漏修正**
    - 解決由 Pydantic 2.11+ 棄用警告造成的記憶體累積 - [PR #16110](https://github.com/BerriAI/litellm/pull/16110)

- **工作階段管理**
    - 為 responses API 新增 shared_session 支援 - [PR #16260](https://github.com/BerriAI/litellm/pull/16260)

- **錯誤處理**
    - 在串流期間優雅處理連線已關閉錯誤 - [PR #16294](https://github.com/BerriAI/litellm/pull/16294)
    - 處理每日支出排序鍵中的 None 值 - [PR #16245](https://github.com/BerriAI/litellm/pull/16245)

- **組態**
    - 移除快取控制注入索引的最小驗證 - [PR #16149](https://github.com/BerriAI/litellm/pull/16149)
    - 改善清除邏輯 - 僅移除未訪問的端點 - [PR #16400](https://github.com/BerriAI/litellm/pull/16400)

- **Redis**
    - 處理來自 AWS ElastiCache Valkey 的浮點數 redis_version - [PR #16207](https://github.com/BerriAI/litellm/pull/16207)

- **Hook**
    - 在 during_call_hook 中新增平行執行處理 - [PR #16279](https://github.com/BerriAI/litellm/pull/16279)

- **基礎架構**
    - 為 prisma 安裝執行階段 node - [PR #16410](https://github.com/BerriAI/litellm/pull/16410)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 文件 - v1.79.1 - [PR #16163](https://github.com/BerriAI/litellm/pull/16163)
    - 修正 model_management.md 上的損壞連結 - [PR #16217](https://github.com/BerriAI/litellm/pull/16217)
    - 修正圖像生成回應格式 - 使用 'images' 陣列而非 'image' 物件 - [PR #16378](https://github.com/BerriAI/litellm/pull/16378)

- **一般文件**
    - 新增正式環境的最低資源需求 - [PR #16146](https://github.com/BerriAI/litellm/pull/16146)
    - 新增與其他 AI 閘道的基準比較 - [PR #16248](https://github.com/BerriAI/litellm/pull/16248)
    - LiteLLM 內容過濾防護欄文件 - [PR #16413](https://github.com/BerriAI/litellm/pull/16413)
    - 修正 orginal 一詞的拼字錯誤 - [PR #16255](https://github.com/BerriAI/litellm/pull/16255)

- **安全性**
    - 移除 tornado 測試檔案（包含 test.key），修正 Python 3.13 安全性問題 - [PR #16342](https://github.com/BerriAI/litellm/pull/16342)

---

## 新貢獻者 {#new-contributors}

* @steve-gore-snapdocs 在 [PR #16149](https://github.com/BerriAI/litellm/pull/16149) 做出了他們的首次貢獻
* @timbmg 在 [PR #16120](https://github.com/BerriAI/litellm/pull/16120) 做出了他們的首次貢獻
* @Nivg 在 [PR #16202](https://github.com/BerriAI/litellm/pull/16202) 做出了他們的首次貢獻
* @pablobgar 在 [PR #16194](https://github.com/BerriAI/litellm/pull/16194) 做出了他們的首次貢獻
* @AlanPonnachan 在 [PR #16150](https://github.com/BerriAI/litellm/pull/16150) 做出了他們的首次貢獻
* @Chesars 在 [PR #16236](https://github.com/BerriAI/litellm/pull/16236) 做出了他們的首次貢獻
* @bowenliang123 在 [PR #16255](https://github.com/BerriAI/litellm/pull/16255) 做出了他們的首次貢獻
* @dean-zavad 在 [PR #16199](https://github.com/BerriAI/litellm/pull/16199) 做出了他們的首次貢獻
* @alexkuzmik 在 [PR #15529](https://github.com/BerriAI/litellm/pull/15529) 做出了他們的首次貢獻
* @Granine 在 [PR #16281](https://github.com/BerriAI/litellm/pull/16281) 做出了他們的首次貢獻
* @Oodapow 在 [PR #16279](https://github.com/BerriAI/litellm/pull/16279) 做出了他們的首次貢獻
* @jgoodyear 在 [PR #16275](https://github.com/BerriAI/litellm/pull/16275) 做出了他們的首次貢獻
* @Qanpi 在 [PR #16321](https://github.com/BerriAI/litellm/pull/16321) 做出了他們的首次貢獻
* @ShimonMimoun 在 [PR #16313](https://github.com/BerriAI/litellm/pull/16313) 做出了他們的首次貢獻
* @andriykislitsyn 在 [PR #16288](https://github.com/BerriAI/litellm/pull/16288) 做出了他們的首次貢獻
* @reckless-huang 在 [PR #16263](https://github.com/BerriAI/litellm/pull/16263) 做出了他們的首次貢獻
* @chenmoneygithub 在 [PR #16368](https://github.com/BerriAI/litellm/pull/16368) 做出了他們的首次貢獻
* @stembe-digitalex 在 [PR #16354](https://github.com/BerriAI/litellm/pull/16354) 做出了他們的首次貢獻
* @jfcherng 在 [PR #16352](https://github.com/BerriAI/litellm/pull/16352) 做出了他們的首次貢獻
* @xingyaoww 在 [PR #16246](https://github.com/BerriAI/litellm/pull/16246) 做出了他們的首次貢獻
* @emerzon 在 [PR #16373](https://github.com/BerriAI/litellm/pull/16373) 做出了他們的首次貢獻
* @wwwillchen 在 [PR #16376](https://github.com/BerriAI/litellm/pull/16376) 做出了他們的首次貢獻
* @fabriciojoc 在 [PR #16203](https://github.com/BerriAI/litellm/pull/16203) 做出了他們的首次貢獻
* @jroberts2600 在 [PR #16273](https://github.com/BerriAI/litellm/pull/16273) 做出了他們的首次貢獻

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上查看完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.79.1-nightly...v1.79.2.rc.1)**
