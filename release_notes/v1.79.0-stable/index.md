---
title: "v1.79.0-stable - 搜尋 API"
slug: "v1-79-0"
date: 2025-10-26T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.79.0-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.79.0
```

</TabItem>
</Tabs>

---

## 重大變更 {#major-changes}

- **Cohere models 現在預設會路由至 Cohere v2 API** - [PR #15722](https://github.com/BerriAI/litellm/pull/15722)

---

## 主要亮點 {#key-highlights}

- **搜尋 API** - 原生 `/v1/search` 端點，支援 Perplexity、Tavily、Parallel AI、Exa AI、DataforSEO 和 Google PSE，並具備成本追蹤
- **向量儲存** - 透過 LiteLLM 將 Vertex AI Search API 整合為向量儲存，並支援 passthrough 端點
- **防護欄擴充** - 透過統一的 `apply_guardrails` 函式，將防護欄套用至 Responses API、Image Gen、Text completions、Audio transcriptions、Audio Speech、Rerank 和 Anthropic Messages API
- **新的防護欄提供者** - 支援 Gray Swan、Dynamo AI、IBM Guardrails、Lasso Security v3 和 Bedrock Guardrail 的 apply_guardrail 端點
- **影片生成 API** - 原生支援 OpenAI Sora-2 和 Azure Sora-2（Pro、Pro-High-Res），並支援成本追蹤與記錄
- **Azure AI Speech (TTS)** - 原生 Azure AI Speech 整合，支援標準與 HD 聲音的成本追蹤

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100萬 tokens） | 輸出（$/100萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Bedrock | `anthropic.claude-3-7-sonnet-20240620-v1:0` | 200K | $3.60 | $18.00 | Chat、reasoning、vision、function calling、prompt caching、computer use |
| Bedrock GovCloud | `us-gov-west-1/anthropic.claude-3-7-sonnet-20250219-v1:0` | 200K | $3.60 | $18.00 | Chat、reasoning、vision、function calling、prompt caching、computer use |
| Vertex AI | `mistral-medium-3` | 128K | $0.40 | $2.00 | Chat、function calling、tool choice |
| Vertex AI | `codestral-2` | 128K | $0.30 | $0.90 | Chat、function calling、tool choice |
| Bedrock | `amazon.titan-image-generator-v1` | - | - | - | 影像生成 - $0.008/影像、$0.01/進階影像 |
| Bedrock | `amazon.titan-image-generator-v2` | - | - | - | 影像生成 - $0.008/影像、$0.01/進階影像 |
| OpenAI | `sora-2` | - | - | - | 影片生成 - $0.10/影片/秒 |
| Azure | `sora-2` | - | - | - | 影片生成 - $0.10/影片/秒 |
| Azure | `sora-2-pro` | - | - | - | 影片生成 - $0.30/影片/秒 |
| Azure | `sora-2-pro-high-res` | - | - | - | 影片生成 - $0.50/影片/秒 |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 cache_control 錯誤地套用到所有內容項目，而不是只套用到最後一個項目 - [PR #15699](https://github.com/BerriAI/litellm/pull/15699)
    - 將 anthropic-beta 標頭轉送至 Bedrock、VertexAI - [PR #15700](https://github.com/BerriAI/litellm/pull/15700)
    - 變更 max_tokens 值以符合 claude sonnet 的 max_output_tokens - [PR #15715](https://github.com/BerriAI/litellm/pull/15715)

- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 AWS us-gov-west-1 Claude 3.7 Sonnet 成本 - [PR #15775](https://github.com/BerriAI/litellm/pull/15775)
    - 修正 govcloud 中 sonnet 3.7 的日期 - [PR #15800](https://github.com/BerriAI/litellm/pull/15800)
    - 在健康檢查中使用正確的 bedrock 模型名稱 - [PR #15808](https://github.com/BerriAI/litellm/pull/15808)
    - 支援 Bedrock Cohere Embed v1 中的 embeddings_by_type 回應格式 - [PR #15707](https://github.com/BerriAI/litellm/pull/15707)
    - 新增 titan 影像生成並支援成本追蹤 - [PR #15916](https://github.com/BerriAI/litellm/pull/15916)

- **[Gemini](../../docs/providers/gemini)**
    - 為 gemini-2.5-flash-image 新增 imageConfig 參數 - [PR #15530](https://github.com/BerriAI/litellm/pull/15530)
    - 取代已棄用的 gemini-1.5-pro-preview-0514 - [PR #15852](https://github.com/BerriAI/litellm/pull/15852)
    - 更新 vertex ai gemini 成本 - [PR #15911](https://github.com/BerriAI/litellm/pull/15911)

- **[Ollama](../../docs/providers/ollama)**
    - 當 reasoning effort 為 minimal/none/disable 時，將 'think' 設為 False - [PR #15763](https://github.com/BerriAI/litellm/pull/15763)
    - 處理解析 ollama chunk 錯誤 - [PR #15717](https://github.com/BerriAI/litellm/pull/15717)

- **[Vertex AI](../../docs/providers/vertex)**
    - 在 vertex 新增 mistral medium 3 和 Codestral 2 - [PR #15887](https://github.com/BerriAI/litellm/pull/15887)

- **[Databricks](../../docs/providers/databricks)**
    - 允許在 Databricks 上將 prompt caching 用於 Anthropic Claude - [PR #15801](https://github.com/BerriAI/litellm/pull/15801)

- **[Azure](../../docs/providers/azure)**
    - 新增 Azure AVA TTS 整合 - [PR #15749](https://github.com/BerriAI/litellm/pull/15749)
    - 新增 Azure AVA（Speech AI）成本追蹤 - [PR #15754](https://github.com/BerriAI/litellm/pull/15754)
    - Azure AI Speech - 確保 `voice` 從 request body 對應至 SSML body，允許傳送 `role` 和 `style` - [PR #15810](https://github.com/BerriAI/litellm/pull/15810)
    - 新增 Azure 對影片生成功能（Sora-2）的支援 - [PR #15901](https://github.com/BerriAI/litellm/pull/15901)

- **[OpenAI](../../docs/providers/openai)**
    - OpenAI 影片重構 - [PR #15900](https://github.com/BerriAI/litellm/pull/15900)

- **一般**
    - 從 custom-llm-provider 標頭讀取 - [PR #15528](https://github.com/BerriAI/litellm/pull/15528)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 為 response 端點新增 gpt 4.1 定價 - [PR #15593](https://github.com/BerriAI/litellm/pull/15593)
    - 修正 gemini 的 responses api 中不正確的 status 值 - [PR #15753](https://github.com/BerriAI/litellm/pull/15753)
    - 簡化 gpt-5-codex 的 reasoning item 處理 - [PR #15815](https://github.com/BerriAI/litellm/pull/15815)
    - 當 OpenAI Responses API 回傳巢狀錯誤結構時出現 ErrorEvent ValidationError - [PR #15804](https://github.com/BerriAI/litellm/pull/15804)
    - 修正 reasoning item ID 自動生成導致加密內容驗證錯誤 - [PR #15782](https://github.com/BerriAI/litellm/pull/15782)
    - 支援 metadata 中的 tags - [PR #15867](https://github.com/BerriAI/litellm/pull/15867)
    - 安全性：防止 User A 在 response.id 外洩時擷取 User B 的 response - [PR #15757](https://github.com/BerriAI/litellm/pull/15757)

- **[Batch API](../../docs/batch_api)**
    - 為 list batches 新增前置與後置呼叫 - [PR #15673](https://github.com/BerriAI/litellm/pull/15673)
    - 新增負責呼叫 precall 的函式 - [PR #15636](https://github.com/BerriAI/litellm/pull/15636)
    - 修正「User default_user_id does not have access to the object」在物件不在 db 中時的問題 - [PR #15873](https://github.com/BerriAI/litellm/pull/15873)

- **[OCR API](../../docs/ocr)**
    - 將 Azure AI - OCR 新增至文件 - [PR #15768](https://github.com/BerriAI/litellm/pull/15768)
    - 為 OCR 模型新增 mode + 健康檢查支援 - [PR #15767](https://github.com/BerriAI/litellm/pull/15767)

- **[Search API](../../docs/search_api)**
    - 為 Web Search - Perplexity API 新增 def search() APIs - [PR #15769](https://github.com/BerriAI/litellm/pull/15769)
    - 新增 Tavily Search API - [PR #15770](https://github.com/BerriAI/litellm/pull/15770)
    - 新增 Parallel AI - Search API - [PR #15772](https://github.com/BerriAI/litellm/pull/15772)
    - 將 EXA AI Search API 新增至 LiteLLM - [PR #15774](https://github.com/BerriAI/litellm/pull/15774)
    - 在 LiteLLM Gateway 新增 /search 端點 - [PR #15780](https://github.com/BerriAI/litellm/pull/15780)
    - 新增 DataforSEO Search API - [PR #15817](https://github.com/BerriAI/litellm/pull/15817)
    - 新增 Google PSE Search Provider - [PR #15816](https://github.com/BerriAI/litellm/pull/15816)
    - 為 Search API 請求新增成本追蹤 - Google PSE、Tavily、Parallel AI、Exa AI - [PR #15821](https://github.com/BerriAI/litellm/pull/15821)
    - 後端：允許將已設定的 Search API 儲存在 DB 中 - [PR #15862](https://github.com/BerriAI/litellm/pull/15862)
    - Exa Search API - 確保請求參數傳送至 Exa AI - [PR #15855](https://github.com/BerriAI/litellm/pull/15855)

- **[向量儲存](../../docs/vector_stores)**
    - 透過 LiteLLM 支援 Vertex AI Search API 作為向量儲存 - [PR #15781](https://github.com/BerriAI/litellm/pull/15781)
    - Azure AI - Search 向量儲存 - [PR #15873](https://github.com/BerriAI/litellm/pull/15873)
    - VertexAI Search 向量儲存 - 支援 passthrough endpoint + 向量儲存搜尋成本追蹤支援 - [PR #15824](https://github.com/BerriAI/litellm/pull/15824)
    - 如果 managed object 找不到，不要拋出錯誤 - [PR #15873](https://github.com/BerriAI/litellm/pull/15873)
    - 在 UI 顯示 config.yaml 向量儲存 - [PR #15873](https://github.com/BerriAI/litellm/pull/15873)
    - 搜尋支出成本追蹤 - [PR #15859](https://github.com/BerriAI/litellm/pull/15859)

- **[Images API](../../docs/image_generation)**
    - 將使用者定義的 headers 和 extra_headers 傳遞給 image-edit 呼叫 - [PR #15811](https://github.com/BerriAI/litellm/pull/15811)

- **[Video Generation API](../../docs/video_generation)**
    - 新增 Azure 對影片生成功能的支援（Sora-2、Sora-2-Pro、Sora-2-Pro-High-Res） - [PR #15901](https://github.com/BerriAI/litellm/pull/15901)
    - OpenAI 影片生成重構（Sora-2） - [PR #15900](https://github.com/BerriAI/litellm/pull/15900)

- **[Bedrock /invoke](../../docs/bedrock_invoke)**
    - 修正：由於缺少 metadata，/bedrock passthrough 的 Hooks 無法運作 - [PR #15849](https://github.com/BerriAI/litellm/pull/15849)

- **[Realtime API](../../docs/realtime_api)**
    - 修正：OpenAI Realtime API 整合因 websockets.exceptions.PayloadTooBig 錯誤而失敗 - [PR #15751](https://github.com/BerriAI/litellm/pull/15751)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **直接轉送**
    - 在 UI 上為 passthrough endpoints 設定驗證 - [PR #15778](https://github.com/BerriAI/litellm/pull/15778)
    - 修正 pass-through endpoint 預算強制執行錯誤 - [PR #15805](https://github.com/BerriAI/litellm/pull/15805)

- **組織**
    - 允許 org admins 在 UI 上建立 teams - [PR #15924](https://github.com/BerriAI/litellm/pull/15924)

- **搜尋工具**
    - UI - Search Tools，允許在 UI 上新增 search tools + 測試搜尋 - [PR #15871](https://github.com/BerriAI/litellm/pull/15871)
    - UI - 新增搜尋提供者的 logos - [PR #15872](https://github.com/BerriAI/litellm/pull/15872)

- **一般**
    - 修正自訂 server root path 的路由 - [PR #15701](https://github.com/BerriAI/litellm/pull/15701)

---

## 記錄 / 防護欄 / 提示管理整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[OpenTelemetry](../../docs/proxy/logging#opentelemetry)**
    - 修正 OpenTelemetry 記錄功能 - [PR #15645](https://github.com/BerriAI/litellm/pull/15645)
    - 修正 headers 未正確分割的問題 - [PR #15916](https://github.com/BerriAI/litellm/pull/15916)

- **[Sentry](../../docs/proxy/logging#sentry)**
    - 為 Sentry 整合新增 SENTRY_ENVIRONMENT 設定 - [PR #15760](https://github.com/BerriAI/litellm/pull/15760)

- **[Helicone](../../docs/proxy/logging#helicone)**
    - 透過從 metadata 移除 OpenTelemetry span，修正 Helicone 記錄中的 JSON 序列化錯誤 - [PR #15728](https://github.com/BerriAI/litellm/pull/15728)

- **[MLFlow](../../docs/proxy/logging#mlflow)**
    - 修正 MLFlow tags - 若 request_tag 含有冒號，將 request_tags 拆分為 (key, val) - [PR #15914](https://github.com/BerriAI/litellm/pull/15914)

- **一般**
    - 將 configured_cold_storage_logger 重新命名為 cold_storage_custom_logger - [PR #15798](https://github.com/BerriAI/litellm/pull/15798)

#### 防護欄 {#guardrails}

- **[Gray Swan](../../docs/proxy/guardrails)**
    - 新增 GraySwan Guardrails 支援 - [PR #15756](https://github.com/BerriAI/litellm/pull/15756)
    - 將 GraySwan 重新命名為 Gray Swan - [PR #15771](https://github.com/BerriAI/litellm/pull/15771)

- **[Dynamo AI](../../docs/proxy/guardrails)**
    - 新防護欄 - Dynamo AI Guardrail - [PR #15920](https://github.com/BerriAI/litellm/pull/15920)

- **[IBM Guardrails](../../docs/proxy/guardrails)**
    - IBM Guardrails 整合 - [PR #15924](https://github.com/BerriAI/litellm/pull/15924)

- **[Lasso Security](../../docs/proxy/guardrails)**
    - 新增 v3 API 支援 - [PR #12452](https://github.com/BerriAI/litellm/pull/12452)
    - 修正 lasso 匯入設定、測試金鑰的 redis cluster hash tags - [PR #15917](https://github.com/BerriAI/litellm/pull/15917)

- **[Bedrock Guardrails](../../docs/proxy/guardrails)**
    - 實作 Bedrock Guardrail apply_guardrail endpoint 支援 - [PR #15892](https://github.com/BerriAI/litellm/pull/15892)

- **一般**
    - Guardrails - 透過統一的 `apply_guardrails` function 支援 Responses API、Image Gen、Text completions、Audio transcriptions、Audio Speech、Rerank、Anthropic Messages API - [PR #15706](https://github.com/BerriAI/litellm/pull/15706)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **速率限制**
    - 在 priority_reservation 中支援絕對 RPM/TPM - [PR #15813](https://github.com/BerriAI/litellm/pull/15813)
    - 組織層級 tpm/rpm 限制 + 指派到組織時的 Team tpm/rpm 驗證 - [PR #15549](https://github.com/BerriAI/litellm/pull/15549)

---

## MCP 閘道 {#mcp-gateway}

- **OAuth**
    - MCP Tool Call 的驗證標頭修正 - [PR #15736](https://github.com/BerriAI/litellm/pull/15736)
    - 在 OAuth 授權端點新增 response_type + PKCE 參數 - [PR #15720](https://github.com/BerriAI/litellm/pull/15720)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **資料庫**
    - 將 deadlocks 的發生率降到最低 - [PR #15281](https://github.com/BerriAI/litellm/pull/15281)

- **Redis**
    - 將 max_connections 設定套用到 Redis async client - [PR #15797](https://github.com/BerriAI/litellm/pull/15797)

- **快取**
    - 新增 `enable_caching_on_provider_specific_optional_params` 設定的文件 - [PR #15885](https://github.com/BerriAI/litellm/pull/15885)

---

## 文件更新 {#documentation-updates}

- **Provider 文件**
    - 更新 worker 建議 - [PR #15702](https://github.com/BerriAI/litellm/pull/15702)
    - 修正 json mode 文件中的錯誤 request body - [PR #15729](https://github.com/BerriAI/litellm/pull/15729)
    - 在文件中新增細節 - [PR #15721](https://github.com/BerriAI/litellm/pull/15721)
    - 在 openai 文件中新增 responses api - [PR #15866](https://github.com/BerriAI/litellm/pull/15866)
    - 新增 OpenAI responses api - [PR #15868](https://github.com/BerriAI/litellm/pull/15868)

---

## 新貢獻者 {#new-contributors}

* @tlecomte 首次貢獻於 [PR #15528](https://github.com/BerriAI/litellm/pull/15528)
* @tomhaynes 首次貢獻於 [PR #15645](https://github.com/BerriAI/litellm/pull/15645)
* @talalryz 首次貢獻於 [PR #15720](https://github.com/BerriAI/litellm/pull/15720)
* @1vinodsingh1 首次貢獻於 [PR #15736](https://github.com/BerriAI/litellm/pull/15736)
* @nuernber 首次貢獻於 [PR #15775](https://github.com/BerriAI/litellm/pull/15775)
* @Thomas-Mildner 首次貢獻於 [PR #15760](https://github.com/BerriAI/litellm/pull/15760)
* @javiergarciapleo 首次貢獻於 [PR #15721](https://github.com/BerriAI/litellm/pull/15721)
* @lshgdut 首次貢獻於 [PR #15717](https://github.com/BerriAI/litellm/pull/15717)
* @kk-wangjifeng 首次貢獻於 [PR #15530](https://github.com/BerriAI/litellm/pull/15530)
* @anthonyivn2 首次貢獻於 [PR #15801](https://github.com/BerriAI/litellm/pull/15801)
* @romanglo 首次貢獻於 [PR #15707](https://github.com/BerriAI/litellm/pull/15707)
* @mythral 首次貢獻於 [PR #15859](https://github.com/BerriAI/litellm/pull/15859)
* @mubashirosmani 首次貢獻於 [PR #15866](https://github.com/BerriAI/litellm/pull/15866)
* @CAFxX 首次貢獻於 [PR #15281](https://github.com/BerriAI/litellm/pull/15281)
* @reflection 首次貢獻於 [PR #15914](https://github.com/BerriAI/litellm/pull/15914)
* @shadielfares 首次貢獻於 [PR #15917](https://github.com/BerriAI/litellm/pull/15917)

---

## PR 數量摘要 {#pr-count-summary}

### 10/26/2025 {#10262025}
* 新模型 / 更新模型：20
* LLM API 端點：29
* 管理端點 / UI：5
* 記錄 / 防護欄 / 提示管理整合：10
* 支出追蹤、預算與速率限制：2
* MCP Gateway：2
* 效能 / 負載平衡 / 可靠性改進：3
* 文件更新：5

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上查看完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.78.5-stable...v1.79.0-stable)**
