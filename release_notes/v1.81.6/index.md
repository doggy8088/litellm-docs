---
title: "[Preview] v1.81.6 - 使用 Tool Call Tracing 的 Logs v2"
slug: "v1-81-6"
date: 2026-01-31T00:00:00
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

:::danger 已知問題 - CPU 使用量

此版本存在已知的 CPU 使用量問題。此問題已在 [v1.81.9-stable](./v1-81-9) 中修正。

**我們建議改用 v1.81.9-stable。**

:::

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:main-v1.81.6
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.81.6
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

帶有 Tool Call Tracing 的 Logs View v2 - 重新設計的 logs 介面，具備側邊面板、結構化工具視覺化，以及錯誤訊息搜尋，可更快速除錯。

讓我們開始。

### 帶有 Tool Call Tracing 的 Logs View v2 {#logs-view-v2-with-tool-call-tracing}

此版本透過 LiteLLM 重新設計的 Logs View v2 引入完整的 tool call tracing，讓開發者能在正式環境中無縫除錯並監控 AI 代理程式工作流程。

這表示您現在可以導入像是追蹤複雜的多步驟代理程式互動、除錯工具執行失敗，以及監控 MCP server 呼叫等使用案例，同時透過語法高亮保有請求/回應 payload 的完整可見性。

開發者可以透過 LiteLLM 的 UI 存取新的 Logs View，以結構化格式檢視 tool call、依錯誤訊息或請求模式搜尋 logs，並透過可摺疊的側邊面板檢視跨 session 關聯代理程式活動。

{/* TODO: Add image from Slack (group_7219.png) - save as logs_v2_tool_tracing.png */}
{/* <Image img={require('../../img/release_notes/logs_v2_tool_tracing.png')} style={{ maxWidth: '800px', width: '100%' }} /> */}

[開始使用](../../docs/proxy/ui_logs)

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/100 萬 tokens) | 輸出 ($/100 萬 tokens) | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| AWS Bedrock | `amazon.nova-2-pro-preview-20251202-v1:0` | 1M | $2.19 | $17.50 | Chat completions、vision、video、PDF、function calling、prompt caching、reasoning |
| Google Vertex AI | `gemini-robotics-er-1.5-preview` | 1M | $0.30 | $2.50 | Chat completions、multimodal（文字、圖片、影片、音訊）、function calling、reasoning |
| OpenRouter | `openrouter/xiaomi/mimo-v2-flash` | 262K | $0.09 | $0.29 | Chat completions、function calling、reasoning |
| OpenRouter | `openrouter/moonshotai/kimi-k2.5` | - | - | - | 聊天補全 |
| OpenRouter | `openrouter/z-ai/glm-4.7` | 202K | $0.40 | $1.50 | Chat completions、vision、function calling、reasoning |

#### 功能 {#features}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - Messages API Bedrock Converse 快取與 PDF 支援 - [PR #19785](https://github.com/BerriAI/litellm/pull/19785)
    - 將 advanced-tool-use 轉換為 Claude Opus 4.5 的 Bedrock 專用標頭 - [PR #19841](https://github.com/BerriAI/litellm/pull/19841)
    - 支援 Sonnet 4.5 的 tool search 標頭轉換 - [PR #19871](https://github.com/BerriAI/litellm/pull/19871)
    - 為 AWS Bedrock Invoke API 過濾不支援的 beta 標頭 - [PR #19877](https://github.com/BerriAI/litellm/pull/19877)
    - Nova grounding 改進 - [PR #19598](https://github.com/BerriAI/litellm/pull/19598), [PR #20159](https://github.com/BerriAI/litellm/pull/20159)

- **[Anthropic](../../docs/providers/anthropic)**
    - 移除 tool_result 內容中明確的 cache_control null - [PR #19919](https://github.com/BerriAI/litellm/pull/19919)
    - 修正工具處理 - [PR #19805](https://github.com/BerriAI/litellm/pull/19805)

- **[Google Gemini / Vertex AI](../../docs/providers/gemini)**
    - 新增 Gemini Robotics-ER 1.5 預覽支援 - [PR #19845](https://github.com/BerriAI/litellm/pull/19845)
    - 支援在 GoogleAIStudioFilesHandle 中檔案擷取 - [PR #20018](https://github.com/BerriAI/litellm/pull/20018)
    - 新增 /delete 端點支援 - [PR #20055](https://github.com/BerriAI/litellm/pull/20055)
    - 將 custom_llm_provider 新增為 gemini 翻譯 - [PR #19988](https://github.com/BerriAI/litellm/pull/19988)
    - 從 text_tokens 扣除隱含的快取 tokens，以正確計算成本 - [PR #19775](https://github.com/BerriAI/litellm/pull/19775)
    - 移除 vertex ai 不支援的 prompt-caching-scope-2026-01-05 標頭 - [PR #20058](https://github.com/BerriAI/litellm/pull/20058)
    - 為 anthropic gemini 快取翻譯新增停用旗標 - [PR #20052](https://github.com/BerriAI/litellm/pull/20052)
    - 對 Vertex AI 上的 Anthropic，將工具訊息中的圖片 URL 轉為 base64 - [PR #19896](https://github.com/BerriAI/litellm/pull/19896)

- **[xAI](../../docs/providers/xai)**
    - 新增 grok reasoning 內容支援 - [PR #19850](https://github.com/BerriAI/litellm/pull/19850)
    - 為 Responses API 新增 websearch 參數支援 - [PR #19915](https://github.com/BerriAI/litellm/pull/19915)
    - 當存在 web search options 時，新增將 xai chat completions 路由至 responses 的功能 - [PR #20051](https://github.com/BerriAI/litellm/pull/20051)
    - 修正快取 token 成本計算 - [PR #19772](https://github.com/BerriAI/litellm/pull/19772)

- **[Azure OpenAI](../../docs/providers/azure)**
    - 使用通用成本計算器計算音訊 token 定價 - [PR #19771](https://github.com/BerriAI/litellm/pull/19771)
    - 允許 Azure GPT-5 chat models 使用 tool_choice - [PR #19813](https://github.com/BerriAI/litellm/pull/19813)
    - 將 gpt-5.2-codex mode 設為 Azure 和 OpenRouter 的 responses - [PR #19770](https://github.com/BerriAI/litellm/pull/19770)

- **[OpenAI](../../docs/providers/openai)**
    - 修正 gpt-5.2-codex 的 max_input_tokens - [PR #20009](https://github.com/BerriAI/litellm/pull/20009)
    - 修正 gpt-image-1.5 成本計算未包含輸出圖片 tokens 的問題 - [PR #19515](https://github.com/BerriAI/litellm/pull/19515)

- **[Hosted VLLM](../../docs/providers/vllm)**
    - 在 anthropic_messages() 和 .completion() 中支援 thinking 參數 - [PR #19787](https://github.com/BerriAI/litellm/pull/19787)
    - 透過 base_llm_http_handler 路由以支援 ssl_verify - [PR #19893](https://github.com/BerriAI/litellm/pull/19893)
    - 修正 vllm embedding 格式 - [PR #20056](https://github.com/BerriAI/litellm/pull/20056)

- **[OCI GenAI](../../docs/providers/oci)**
    - 將 imageUrl 序列化為 OCI GenAI API 的物件 - [PR #19661](https://github.com/BerriAI/litellm/pull/19661)

- **[Volcengine](../../docs/providers/volcano)**
    - 為 volcengine models 新增 context（deepseek-v3-2、glm-4-7、kimi-k2-thinking）- [PR #19335](https://github.com/BerriAI/litellm/pull/19335)

- **[中文提供者](../../docs/providers/)**
    - 為 MiniMax、GLM、Xiaomi 新增 prompt caching 與 reasoning 支援 - [PR #19924](https://github.com/BerriAI/litellm/pull/19924)

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 新增 embeddings 支援 - [PR #19660](https://github.com/BerriAI/litellm/pull/19660)

### 錯誤修正 {#bug-fixes}

- **[Google](../../docs/providers/gemini)**
    - 修正 gemini-robotics-er-1.5-preview 項目 - [PR #19974](https://github.com/BerriAI/litellm/pull/19974)

- **一般**
    - 修正 output_tokens_details.reasoning_tokens 為 None - [PR #19914](https://github.com/BerriAI/litellm/pull/19914)
    - 修正 stream_chunk_builder 以保留串流片段中的圖片 - [PR #19654](https://github.com/BerriAI/litellm/pull/19654)
    - 修正 image edit 中的 aspectRatio 對應 - [PR #20053](https://github.com/BerriAI/litellm/pull/20053)
    - 在 Azure AI 成本計算器中處理未知模型 - [PR #20150](https://github.com/BerriAI/litellm/pull/20150)

- **[GigaChat](../../docs/providers/gigachat)**
    - 確保 function content 是有效的 JSON - [PR #19232](https://github.com/BerriAI/litellm/pull/19232)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Messages API (/messages)](../../docs/mcp)**
    - 新增 LiteLLM x Claude Agent SDK 整合 - [PR #20035](https://github.com/BerriAI/litellm/pull/20035)

- **[A2A / MCP Gateway API (/a2a, /mcp)](../../docs/mcp)**
    - 新增 A2A agent 基於標頭的 context 傳播支援 - [PR #19504](https://github.com/BerriAI/litellm/pull/19504)
    - 啟用 MCP tool calls 的進度通知 - [PR #19809](https://github.com/BerriAI/litellm/pull/19809)
    - 修正對非標準 MCP URL 模式的支援 - [PR #19738](https://github.com/BerriAI/litellm/pull/19738)
    - 為舊版 A2A card 格式（/.well-known/agent.json）新增向後相容性 - [PR #19949](https://github.com/BerriAI/litellm/pull/19949)
    - 為 /interactions 端點新增 agent 參數支援 - [PR #19866](https://github.com/BerriAI/litellm/pull/19866)

- **[Responses API (/responses)](../../docs/response_api)**
    - 修正 provider-specific params 的 custom_llm_provider - [PR #19798](https://github.com/BerriAI/litellm/pull/19798)
    - 在 ResponseAPILoggingUtils 中將 input tokens details 擷取為 dict - [PR #20046](https://github.com/BerriAI/litellm/pull/20046)

- **[Batch API (/batches)](../../docs/batches)**
    - 修正 /batches 以回傳編碼後的 ID（來自受管理物件表） - [PR #19040](https://github.com/BerriAI/litellm/pull/19040)
    - 修正 Batch 與 File 使用者層級權限 - [PR #19981](https://github.com/BerriAI/litellm/pull/19981)
    - 在 retrieve_batch 呼叫類型中新增成本追蹤與用量物件 - [PR #19986](https://github.com/BerriAI/litellm/pull/19986)

- **[Embeddings API (/embeddings)](../../docs/embedding/supported_embedding)**
    - 新增支援的輸入格式文件 - [PR #20073](https://github.com/BerriAI/litellm/pull/20073)

- **[RAG API (/rag/ingest, /vector_store)](../../docs/rag_ingest)**
    - 為 /rag/ingest API 新增 UI - 上傳文件、pdf 等以建立 vector store - [PR #19822](https://github.com/BerriAI/litellm/pull/19822)
    - 新增使用 S3 Vectors 作為 Vector Store 提供者的支援 - [PR #19888](https://github.com/BerriAI/litellm/pull/19888)
    - 在 /vector_store/search API + 建立 UI 中新增 s3_vectors 作為提供者 + PDF 支援 - [PR #19895](https://github.com/BerriAI/litellm/pull/19895)
    - 為 Vector Stores 新增使用者與團隊的權限管理 - [PR #19972](https://github.com/BerriAI/litellm/pull/19972)
    - 啟用 RAG 查詢管線中的 completions 路由器支援 - [PR #19550](https://github.com/BerriAI/litellm/pull/19550)

- **[Search API (/search)](../../docs/search)**
    - 新增 /list 端點以列出路由器中存在的搜尋工具 - [PR #19969](https://github.com/BerriAI/litellm/pull/19969)
    - 修正 router search tools v2 整合 - [PR #19840](https://github.com/BerriAI/litellm/pull/19840)

- **[Passthrough Endpoints (/\{provider\}_passthrough)](../../docs/pass_through/intro)**
    - 為 OpenAI passthrough 請求新增 /openai_passthrough 路由 - [PR #19989](https://github.com/BerriAI/litellm/pull/19989)
    - 新增透過環境變數設定 role_mappings 的支援 - [PR #19498](https://github.com/BerriAI/litellm/pull/19498)
    - 新增 Vertex AI LLM 憑證敏感關鍵字「vertex_credentials」以供遮罩 - [PR #19551](https://github.com/BerriAI/litellm/pull/19551)
    - 修正回應中避免洩漏帶有提供者前綴的模型名稱 - [PR #19943](https://github.com/BerriAI/litellm/pull/19943)
    - 修正 Google Vertex generateContent 模型名稱中斜線的 proxy 支援 - [PR #19737](https://github.com/BerriAI/litellm/pull/19737), [PR #19753](https://github.com/BerriAI/litellm/pull/19753)
    - 支援 Vertex AI passthrough URLs 中帶有斜線的模型名稱 - [PR #19944](https://github.com/BerriAI/litellm/pull/19944)
    - 修正 router 模型在 Vertex AI passthroughs 中的回歸問題 - [PR #19967](https://github.com/BerriAI/litellm/pull/19967)
    - 為 Vertex AI passthrough 模型名稱新增回歸測試 - [PR #19855](https://github.com/BerriAI/litellm/pull/19855)

#### 錯誤 {#bugs}

- **一般**
    - 修正 token 計算並重構 - [PR #19696](https://github.com/BerriAI/litellm/pull/19696)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **Proxy CLI 驗證**
    - 透過環境變數新增可設定的 CLI JWT 到期時間 - [PR #19780](https://github.com/BerriAI/litellm/pull/19780)
    - 修正團隊 cli 驗證流程 - [PR #19666](https://github.com/BerriAI/litellm/pull/19666)

- **虛擬金鑰**
    - UI：表格值自動截斷 - [PR #19718](https://github.com/BerriAI/litellm/pull/19718)
    - 修正建立金鑰：到期金鑰輸入持續時間 - [PR #19807](https://github.com/BerriAI/litellm/pull/19807)
    - 批次更新金鑰端點 - [PR #19886](https://github.com/BerriAI/litellm/pull/19886)

- **記錄檢視**
    - **具有側邊面板與改善 UX 的 v2 記錄檢視** - [PR #20091](https://github.com/BerriAI/litellm/pull/20091)
    - 在記錄檢視中渲染「Tools」的新檢視 - [PR #20093](https://github.com/BerriAI/litellm/pull/20093)
    - 新增請求/回應的漂亮列印檢視 - [PR #20096](https://github.com/BerriAI/litellm/pull/20096)
    - 在 Spend Logs 端點中新增 error_message 搜尋 - [PR #19960](https://github.com/BerriAI/litellm/pull/19960)
    - UI：在 ui spend logs 中新增錯誤訊息搜尋 - [PR #19963](https://github.com/BerriAI/litellm/pull/19963)
    - Spend Logs：設定視窗 - [PR #19918](https://github.com/BerriAI/litellm/pull/19918)
    - 修正 Spend Logs metadata 中的 error_code - [PR #20015](https://github.com/BerriAI/litellm/pull/20015)
    - Spend Logs：顯示目前儲存區與保留狀態 - [PR #20017](https://github.com/BerriAI/litellm/pull/20017)
    - 允許動態設定 store_prompts_in_spend_logs - [PR #19913](https://github.com/BerriAI/litellm/pull/19913)
    - [文件：UI Spend Logs 設定](../../docs/proxy/ui_spend_log_settings) - [PR #20197](https://github.com/BerriAI/litellm/pull/20197)

- **模型 + 端點**
    - 為 /v2/model/info 新增 sortBy 與 sortOrder 參數 - [PR #19903](https://github.com/BerriAI/litellm/pull/19903)
    - 修正 /v2/model/info 的排序 - [PR #19971](https://github.com/BerriAI/litellm/pull/19971)
    - UI：模型頁面伺服器排序 - [PR #19908](https://github.com/BerriAI/litellm/pull/19908)

- **用量與分析**
    - UI：用量匯出：依團隊與金鑰分類 - [PR #19953](https://github.com/BerriAI/litellm/pull/19953)
    - UI：用量：每個金鑰的模型分類 - [PR #20039](https://github.com/BerriAI/litellm/pull/20039)

- **UI 改善**
    - UI：允許管理員控制左側導覽列中可見的頁面 - [PR #19907](https://github.com/BerriAI/litellm/pull/19907)
    - UI：為開發環境新增明/暗模式切換 - [PR #19804](https://github.com/BerriAI/litellm/pull/19804)
    - UI：暗色模式：刪除資源視窗 - [PR #20098](https://github.com/BerriAI/litellm/pull/20098)
    - UI：表格：可重用的表格排序元件 - [PR #19970](https://github.com/BerriAI/litellm/pull/19970)
    - UI：新徽章圓點渲染 - [PR #20024](https://github.com/BerriAI/litellm/pull/20024)
    - UI：回饋提示：隱藏提示的選項 - [PR #19831](https://github.com/BerriAI/litellm/pull/19831)
    - UI：導覽列：固定預設 Logo + 界定 Logo 方框 - [PR #20092](https://github.com/BerriAI/litellm/pull/20092)
    - UI：導覽列：使用者下拉選單 - [PR #20095](https://github.com/BerriAI/litellm/pull/20095)
    - 將預設金鑰類型從 'Default' 變更為 'LLM API' - [PR #19516](https://github.com/BerriAI/litellm/pull/19516)

- **團隊與使用者管理**
    - 修正 /team/member_add 使用者電子郵件與 ID 驗證 - [PR #19814](https://github.com/BerriAI/litellm/pull/19814)
    - 修正 SSO 電子郵件大小寫敏感性 - [PR #19799](https://github.com/BerriAI/litellm/pull/19799)
    - UI：內部使用者：批次新增 - [PR #19721](https://github.com/BerriAI/litellm/pull/19721)

- **AI Gateway 功能**
    - 新增在不記錄的情況下執行靜默 LLM 呼叫的支援 - [PR #19544](https://github.com/BerriAI/litellm/pull/19544)
    - UI：修正 MCP 工具說明以顯示以逗號分隔的字串 - [PR #20101](https://github.com/BerriAI/litellm/pull/20101)

#### 錯誤 {#bugs-1}

- 修正備援期間的模型名稱 - [PR #20177](https://github.com/BerriAI/litellm/pull/20177)
- 修正已定義回呼物件時的健康端點 - [PR #20182](https://github.com/BerriAI/litellm/pull/20182)
- 修正無法將使用者最大預算重設為無限 - [PR #19796](https://github.com/BerriAI/litellm/pull/19796)
- 修正非 ASCII 字元的密碼比對 - [PR #19568](https://github.com/BerriAI/litellm/pull/19568)
- 修正 DISABLE_ADMIN_ENDPOINTS 的錯誤訊息 - [PR #19861](https://github.com/BerriAI/litellm/pull/19861)
- 在編輯 guardrail 時避免清除內容過濾規則 - [PR #19671](https://github.com/BerriAI/litellm/pull/19671)
- 修正 Prompt Studio 歷史記錄以載入工具與系統訊息 - [PR #19920](https://github.com/BerriAI/litellm/pull/19920)
- 將 WATSONX_ZENAPIKEY 新增至 WatsonX 憑證 - [PR #20086](https://github.com/BerriAI/litellm/pull/20086)
- UI：Vector Store：允許選取依設定定義的模型 - [PR #20031](https://github.com/BerriAI/litellm/pull/20031)

## 記錄 / 防護欄 / 提示管理整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 新增代理程式支援以進行 LLM 可觀測性 - [PR #19574](https://github.com/BerriAI/litellm/pull/19574)
    - 新增 datadog 成本管理支援並修正啟動回呼問題 - [PR #19584](https://github.com/BerriAI/litellm/pull/19584)
    - 將 datadog_llm_observability 新增至 /health/services 允許清單 - [PR #19952](https://github.com/BerriAI/litellm/pull/19952)
    - 在要求 DD_API_KEY/DD_SITE 前先檢查代理程式模式 - [PR #20156](https://github.com/BerriAI/litellm/pull/20156)

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 將 JWT 驗證 metadata 傳遞至 OTEL spans - [PR #19627](https://github.com/BerriAI/litellm/pull/19627)
    - 修正動態標頭路徑中的執行緒洩漏 - [PR #19946](https://github.com/BerriAI/litellm/pull/19946)

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 新增回呼與標籤 - [PR #19708](https://github.com/BerriAI/litellm/pull/19708)
    - 在指標中新增 clientip 與 user agent - [PR #19717](https://github.com/BerriAI/litellm/pull/19717)
    - 新增 tpm-rpm 限制指標 - [PR #19725](https://github.com/BerriAI/litellm/pull/19725)
    - 在指標中新增 model_id 標籤 - [PR #19678](https://github.com/BerriAI/litellm/pull/19678)
    - 在記錄中安全處理 None metadata - [PR #19691](https://github.com/BerriAI/litellm/pull/19691)
    - 透過避免 REGISTRY.collect() 解決 router_settings 在 DB 中時的高 CPU 問題 - [PR #20087](https://github.com/BerriAI/litellm/pull/20087)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 為 Langfuse、Langfuse Otel 與其他 Otel 提供者新增 litellm_callback_logging_failures_metric - [PR #19636](https://github.com/BerriAI/litellm/pull/19636)

- **一般記錄**
    - 使用 CustomLogger.async_post_call_success_hook 的回傳值 - [PR #19670](https://github.com/BerriAI/litellm/pull/19670)
    - 將 async_post_call_response_headers_hook 新增至 CustomLogger - [PR #20083](https://github.com/BerriAI/litellm/pull/20083)
    - 新增 mock client factory 模式，並為 PostHog、Helicone 和 Braintrust 整合提供 mock 支援 - [PR #19707](https://github.com/BerriAI/litellm/pull/19707)

#### 防護欄 {#guardrails}

- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 重用 HTTP 連線以防止效能下降 - [PR #19964](https://github.com/BerriAI/litellm/pull/19964)

- **Onyx**
    - 為 onyx 防護欄新增逾時 - [PR #19731](https://github.com/BerriAI/litellm/pull/19731)

- **一般**
    - 新增防護欄 model 參數功能 - [PR #19619](https://github.com/BerriAI/litellm/pull/19619)
    - 修正具備串流回應 regex 的防護欄問題 - [PR #19901](https://github.com/BerriAI/litellm/pull/19901)
    - 移除防護欄監控的企業版需求（文件） - [PR #19833](https://github.com/BerriAI/litellm/pull/19833)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 新增事件驅動的全域支出查詢協調，以防止快取驚群 - [PR #20030](https://github.com/BerriAI/litellm/pull/20030)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **修正 DB 中 router_settings 時的高 CPU 使用率** - 透過避免在 PrometheusServicesLogger 中呼叫 REGISTRY.collect() - [PR #20087](https://github.com/BerriAI/litellm/pull/20087)
- **在 Presidio 中重用 HTTP 連線** - 以防止效能下降 - [PR #19964](https://github.com/BerriAI/litellm/pull/19964)
- **全域支出查詢的事件驅動協調** - 防止快取驚群 - [PR #20030](https://github.com/BerriAI/litellm/pull/20030)
- 修正遞迴 Pydantic 驗證問題 - [PR #19531](https://github.com/BerriAI/litellm/pull/19531)
- 將參數處理重構為輔助函式以減少程式碼膨脹 - [PR #19720](https://github.com/BerriAI/litellm/pull/19720)
- 最佳化 logo 取得並解決 MCP 匯入阻礙 - [PR #19719](https://github.com/BerriAI/litellm/pull/19719)
- 使用非同步 HTTP 用戶端改善 logo 下載效能 - [PR #20155](https://github.com/BerriAI/litellm/pull/20155)
- 修正伺服器 root path 設定 - [PR #19790](https://github.com/BerriAI/litellm/pull/19790)
- 重構：將 transport context 建立擷取到獨立方法中 - [PR #19794](https://github.com/BerriAI/litellm/pull/19794)
- 新增 native_background_mode 設定，以針對特定模型覆寫 polling_via_cache - [PR #19899](https://github.com/BerriAI/litellm/pull/19899)
- 在匯入時初始化 tiktoken 環境，以啟用離線使用 - [PR #19882](https://github.com/BerriAI/litellm/pull/19882)
- 在延遲載入中使用本機快取改善 tiktoken 效能 - [PR #19774](https://github.com/BerriAI/litellm/pull/19774)
- 修正聊天完成請求中的逾時錯誤，使其能在失敗回呼中正確回報 - [PR #19842](https://github.com/BerriAI/litellm/pull/19842)
- 修正 NUM_RETRIES 的環境變數型別處理 - [PR #19507](https://github.com/BerriAI/litellm/pull/19507)
- 在 silent experiment kwargs 中使用 safe_deep_copy 以防止變動 - [PR #20170](https://github.com/BerriAI/litellm/pull/20170)
- 透過在所有其他 policy type 之後檢查 BadRequestError 來改善錯誤處理 - [PR #19878](https://github.com/BerriAI/litellm/pull/19878)

## 資料庫變更 {#database-changes}

### Schema 更新 {#schema-updates}

| 資料表 | 變更類型 | 說明 | PR | 移轉 |
| ----- | ----------- | ----------- | -- | --------- |
| `LiteLLM_ManagedVectorStoresTable` | 新增欄位 | 新增 `team_id` 和 `user_id` 欄位用於權限管理 | [PR #19972](https://github.com/BerriAI/litellm/pull/19972) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260131150814_add_team_user_to_vector_stores/migration.sql) |

### Migration 改善 {#migration-improvements}

- 修正 Docker：為 Prisma 產生使用正確的 schema path - [PR #19631](https://github.com/BerriAI/litellm/pull/19631)
- 解決 setup_database 中的「relation does not exist」migration 錯誤 - [PR #19281](https://github.com/BerriAI/litellm/pull/19281)
- 修正 migration 問題並改善 Docker image 穩定性 - [PR #19843](https://github.com/BerriAI/litellm/pull/19843)
- 在非 root Docker container 中以 nobody 使用者執行 Prisma generate 以提升安全性 - [PR #20000](https://github.com/BerriAI/litellm/pull/20000)
- 將 litellm-proxy-extras 版本升級至 0.4.28 - [PR #20166](https://github.com/BerriAI/litellm/pull/20166)

## 文件更新 {#documentation-updates}

- **[新增 Claude Agents SDK x LiteLLM 指南](../../docs/mcp)** - [PR #20036](https://github.com/BerriAI/litellm/pull/20036)
- **[新增食譜：將 Claude Agent SDK + MCP 與 LiteLLM 搭配使用](https://github.com/BerriAI/litellm/tree/main/cookbook)** - [PR #20081](https://github.com/BerriAI/litellm/pull/20081)
- 修正文件中的 A2A Python SDK URL - [PR #19832](https://github.com/BerriAI/litellm/pull/19832)
- **[新增 Sarvam 使用文件](../../docs/providers/sarvam)** - [PR #19844](https://github.com/BerriAI/litellm/pull/19844)
- **[新增 embeddings 的支援輸入格式](../../docs/embedding/supported_embedding)** - [PR #20073](https://github.com/BerriAI/litellm/pull/20073)
- **[UI 支出記錄設定文件](../../docs/proxy/ui_spend_log_settings)** - [PR #20197](https://github.com/BerriAI/litellm/pull/20197)
- 在 README 的 OSS 採用者清單中新增 OpenAI Agents SDK - [PR #19820](https://github.com/BerriAI/litellm/pull/19820)
- 更新文件：移除防護欄監控的企業版需求 - [PR #19833](https://github.com/BerriAI/litellm/pull/19833)
- 新增缺少的環境變數文件 - [PR #20138](https://github.com/BerriAI/litellm/pull/20138)
- 改善文件 blog index 頁面 - [PR #20188](https://github.com/BerriAI/litellm/pull/20188)

## 基礎架構 / 測試改善 {#infrastructure--testing-improvements}

- 為 Router.get_valid_args 新增測試涵蓋並改善程式碼涵蓋率回報 - [PR #19797](https://github.com/BerriAI/litellm/pull/19797)
- 將 model cost map 驗證新增為 CI job - [PR #19993](https://github.com/BerriAI/litellm/pull/19993)
- 新增 Realtime API 基準測試 - [PR #20074](https://github.com/BerriAI/litellm/pull/20074)
- 在社群 helm chart 中新增 Init Containers 支援 - [PR #19816](https://github.com/BerriAI/litellm/pull/19816)
- 將 libsndfile 新增至主 Dockerfile 以支援 ARM64 音訊處理 - [PR #19776](https://github.com/BerriAI/litellm/pull/19776)

## 新貢獻者 {#new-contributors}

* @ruanjf 首次貢獻於 https://github.com/BerriAI/litellm/pull/19551
* @moh-dev-stack 首次貢獻於 https://github.com/BerriAI/litellm/pull/19507
* @formorter 首次貢獻於 https://github.com/BerriAI/litellm/pull/19498
* @priyam-that 首次貢獻於 https://github.com/BerriAI/litellm/pull/19516
* @marcosgriselli 首次貢獻於 https://github.com/BerriAI/litellm/pull/19550
* @natimofeev 首次貢獻於 https://github.com/BerriAI/litellm/pull/19232
* @zifeo 首次貢獻於 https://github.com/BerriAI/litellm/pull/19805
* @pragyasardana 首次貢獻於 https://github.com/BerriAI/litellm/pull/19816
* @ryewilson 首次貢獻於 https://github.com/BerriAI/litellm/pull/19833
* @lizhen921 首次貢獻於 https://github.com/BerriAI/litellm/pull/19919
* @boarder7395 首次貢獻於 https://github.com/BerriAI/litellm/pull/19666
* @rushilchugh01 首次貢獻於 https://github.com/BerriAI/litellm/pull/19938
* @cfchase 首次貢獻於 https://github.com/BerriAI/litellm/pull/19893
* @ayim 首次貢獻於 https://github.com/BerriAI/litellm/pull/19872
* @varunsripad123 首次貢獻於 https://github.com/BerriAI/litellm/pull/20018
* @nht1206 首次貢獻於 https://github.com/BerriAI/litellm/pull/20046
* @genga6 首次貢獻於 https://github.com/BerriAI/litellm/pull/20009

**完整變更記錄**： https://github.com/BerriAI/litellm/compare/v1.81.3.rc...v1.81.6
