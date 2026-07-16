---
title: "v1.78.0-stable - MCP Gateway: 依團隊、金鑰控制工具存取"
slug: "v1-78-0"
date: 2025-10-11T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.78.0-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.78.0.post1
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **MCP Gateway - 依團隊、金鑰控制工具存取** - 依團隊/金鑰控制 MCP 工具存取。
- **效能改善** - p99 延遲降低 70%
- **GPT-5 Pro 與 GPT-Image-1-Mini** - OpenAI 的 GPT-5 Pro（400K context）與 gpt-image-1-mini 圖像生成的 Day 0 支援
- **EnkryptAI Guardrails** - 新的內容審核防護欄整合
- **基於標籤的預算** - 支援根據請求標籤設定預算

---

### MCP Gateway - 依團隊、金鑰控制工具存取 {#mcp-gateway---control-tool-access-by-team-key}

<Image 
  img={require('../../img/release_notes/tool_control.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

Proxy 管理員現在可以依團隊或金鑰控制 MCP 工具存取。這讓您能輕鬆為不同團隊授予同一個 MCP 伺服器中工具的選擇性存取權。

例如，您現在可以讓 Engineering 團隊存取 `list_repositories`、`create_issue` 和 `search_code` 工具，而 Sales 則只可存取 `search_code` 和 `close_issue` 工具。

這讓 Proxy 管理員更容易管理 MCP 工具存取。

[開始使用](../../docs/mcp_control#set-allowed-tools-for-a-key-team-or-organization)

---

## 效能 - p99 延遲降低 70% {#performance---70-lower-p99-latency}

<Image img={require('../../img/release_notes/1_78_0_perf.png')}  style={{ width: '800px', height: 'auto' }} />

<br/>

此版本將 LiteLLM AI Gateway 的 p99 延遲降低了 70%，使其在低延遲使用情境中表現更佳。

這些提升來自兩項關鍵增強：

**可靠的工作階段**

新增對 aiohttp 共用工作階段的支援。shared_session 參數現在會在所有請求中一致使用，啟用連線池化。

**更快的路由**

新的 `model_name_to_deployment_indices` 雜湊對映取代了 `_get_all_deployments()` 中的 O(n) 清單掃描，改以 O(1) 雜湊查找，提升路由效能與擴充性。

因此，各延遲百分位的效能都有所提升：

- **中位數延遲：** 110 ms → **100 ms**（−9.1%）
- **p95 延遲：** 440 ms → **150 ms**（−65.9%）
- **p99 延遲：** 810 ms → **240 ms**（−70.4%）
- **平均延遲：** 310 ms → **111.73 ms**（−64.0%）

### **測試設定** {#test-setup}

**Locust**

- **並發使用者：** 1,000
- **漸進增加：** 500

**系統規格**

- **使用了資料庫**
- **CPU：** 4 vCPUs
- **記憶體：** 8 GB RAM
- **LiteLLM Workers：** 4
- **Instances**: 4

**組態 (config.yaml)**

查看完整組態： [gist.github.com/AlexsanderHamir/config.yaml](https://gist.github.com/AlexsanderHamir/53f7d554a5d2afcf2c4edb5b6be68ff4)

**負載腳本 (no_cache_hits.py)**

查看完整負載測試腳本： [gist.github.com/AlexsanderHamir/no_cache_hits.py](https://gist.github.com/AlexsanderHamir/42c33d7a4dc7a57f56a78b560dee3a42)

---

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5-pro` | 400K | $15.00 | $120.00 | Responses API、reasoning、vision、function calling、prompt caching、web search |
| OpenAI | `gpt-5-pro-2025-10-06` | 400K | $15.00 | $120.00 | Responses API、reasoning、vision、function calling、prompt caching、web search |
| OpenAI | `gpt-image-1-mini` | - | $2.00/img | - | 圖像生成與編輯 |
| OpenAI | `gpt-realtime-mini` | 128K | $0.60 | $2.40 | 即時音訊、function calling |
| Azure AI | `azure_ai/Phi-4-mini-reasoning` | 131K | $0.08 | $0.32 | 函式呼叫 |
| Azure AI | `azure_ai/Phi-4-reasoning` | 32K | $0.125 | $0.50 | Function calling、reasoning |
| Azure AI | `azure_ai/MAI-DS-R1` | 128K | $1.35 | $5.40 | Reasoning、function calling |
| Bedrock | `au.anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.30 | $16.50 | 聊天、reasoning、vision、function calling、prompt caching |
| Bedrock | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | 200K | $3.00 | $15.00 | 聊天、reasoning、vision、function calling、prompt caching |
| Bedrock | `global.anthropic.claude-sonnet-4-20250514-v1:0` | 1M | $3.00 | $15.00 | 聊天、reasoning、vision、function calling、prompt caching |
| Bedrock | `cohere.embed-v4:0` | 128K | $0.12 | - | 嵌入、支援圖像輸入 |
| OCI | `oci/cohere.command-latest` | 128K | $1.56 | $1.56 | 函式呼叫 |
| OCI | `oci/cohere.command-a-03-2025` | 256K | $1.56 | $1.56 | 函式呼叫 |
| OCI | `oci/cohere.command-plus-latest` | 128K | $1.56 | $1.56 | 函式呼叫 |
| Together AI | `together_ai/moonshotai/Kimi-K2-Instruct-0905` | 262K | $1.00 | $3.00 | 函式呼叫 |
| Together AI | `together_ai/Qwen/Qwen3-Next-80B-A3B-Instruct` | 262K | $0.15 | $1.50 | 函式呼叫 |
| Together AI | `together_ai/Qwen/Qwen3-Next-80B-A3B-Thinking` | 262K | $0.15 | $1.50 | 函式呼叫 |
| Vertex AI | MedGemma models | 視情況而定 | 視情況而定 | 視情況而定 | 於自訂端點上的醫療導向 Gemma 模型 |
| Watson X | 27 new foundation models | 視情況而定 | 視情況而定 | 視情況而定 | Granite、Llama、Mistral 系列 |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增 GPT-5 Pro 模型設定與文件 - [PR #15258](https://github.com/BerriAI/litellm/pull/15258)
    - 為 GPT-5 的不支援參數新增 stop 參數 - [PR #15244](https://github.com/BerriAI/litellm/pull/15244)
    - Day 0 支援，新增 gpt-image-1-mini - [PR #15259](https://github.com/BerriAI/litellm/pull/15259)
    - 新增 gpt-realtime-mini 支援 - [PR #15283](https://github.com/BerriAI/litellm/pull/15283)
    - 將 gpt-5-pro-2025-10-06 新增至 model costs - [PR #15344](https://github.com/BerriAI/litellm/pull/15344)
    - 最小修正：使用 temperature!=1 呼叫時，gpt5 models 不應進入冷卻期 - [PR #15330](https://github.com/BerriAI/litellm/pull/15330)

- **[Snowflake Cortex](../../docs/providers/snowflake)**
    - 為 Snowflake Cortex REST API 新增 function calling 支援 - [PR #15221](https://github.com/BerriAI/litellm/pull/15221)

- **[Gemini](../../docs/providers/gemini)**
    - 修正 Proxy 模式中 Gemini/Vertex AI 提供者的標頭轉送 - [PR #15231](https://github.com/BerriAI/litellm/pull/15231)

- **[Azure](../../docs/providers/azure)**
    - 從不支援的 azure models 移除 stop 參數 - [PR #15229](https://github.com/BerriAI/litellm/pull/15229)
    - 修正(azure/responses)：從 azure 呼叫中移除無效的 status 參數 - [PR #15253](https://github.com/BerriAI/litellm/pull/15253)
    - 新增具定價詳細資訊的 Azure AI models - [PR #15387](https://github.com/BerriAI/litellm/pull/15387)
    - AzureAD 預設認證 - 根據環境選擇認證類型 - [PR #14470](https://github.com/BerriAI/litellm/pull/14470)

- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 Global Cross-Region Inference - [PR #15210](https://github.com/BerriAI/litellm/pull/15210)
    - 新增 AWS Bedrock 的 Cohere Embed v4 支援 - [PR #15298](https://github.com/BerriAI/litellm/pull/15298)
    - 修正(bedrock)：在 prompt_tokens 計算中包含 cacheWriteInputTokens - [PR #15292](https://github.com/BerriAI/litellm/pull/15292)
    - 為 Claude Sonnet 4.5 新增 Bedrock AU Cross-Region Inference - [PR #15402](https://github.com/BerriAI/litellm/pull/15402)
    - Converse → /v1/messages 串流不會處理 Claude models 的平行工具呼叫 - [PR #15315](https://github.com/BerriAI/litellm/pull/15315)

- **[Vertex AI](../../docs/providers/vertex)**
    - 實作 Vertex AI 提供者的 Context Caching - [PR #15226](https://github.com/BerriAI/litellm/pull/15226)
    - 支援自訂端點上的 Vertex AI Gemma Models - [PR #15397](https://github.com/BerriAI/litellm/pull/15397)
    - VertexAI - 支援 gemma 模型系列（自訂端點） - [PR #15419](https://github.com/BerriAI/litellm/pull/15419)
    - VertexAI Gemma 模型系列串流支援 + 新增 MedGemma - [PR #15427](https://github.com/BerriAI/litellm/pull/15427)

- **[OCI](../../docs/providers/oci)**
    - 新增支援工具呼叫與串流能力的 OCI Cohere - [PR #15365](https://github.com/BerriAI/litellm/pull/15365)

- **[Watson X](../../docs/providers/watsonx)**
    - 將 Watson X foundation model 定義新增至 model_prices_and_context_window.json - [PR #15219](https://github.com/BerriAI/litellm/pull/15219)
    - Watsonx - 為 openai/gpt-oss 模型系列套用正確的提示詞範本 - [PR #15341](https://github.com/BerriAI/litellm/pull/15341)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 修正 - (openrouter)：將 cache_control 移至 claude/gemini 的內容區塊 - [PR #15345](https://github.com/BerriAI/litellm/pull/15345)
    - 修正 - 讓 OpenRouter 的 cache_control 只套用到最後一個內容區塊 - [PR #15395](https://github.com/BerriAI/litellm/pull/15395)

- **[Together AI](../../docs/providers/togetherai)**
    - 新增 together 模型 - [PR #15383](https://github.com/BerriAI/litellm/pull/15383)

### 錯誤修正 {#bug-fixes}

- **一般**
    - 錯誤修正：gpt-5-chat-latest 的 max_input_tokens 值不正確 - [PR #15116](https://github.com/BerriAI/litellm/pull/15116)
    - 修正 reasoning 回應 ID - [PR #15265](https://github.com/BerriAI/litellm/pull/15265)
    - 修正解析 assistant 訊息的問題 - [PR #15320](https://github.com/BerriAI/litellm/pull/15320)
    - 修正基於 litellm_param 的計費 - [PR #15336](https://github.com/BerriAI/litellm/pull/15336)
    - 修正 lint 錯誤 - [PR #15406](https://github.com/BerriAI/litellm/pull/15406)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增 response api 串流圖片生成的串流支援 - [PR #15269](https://github.com/BerriAI/litellm/pull/15269)
    - 為 litellm_proxy 提供者新增原生 Responses API 支援 - [PR #15347](https://github.com/BerriAI/litellm/pull/15347)
    - 暫時放寬 ResponsesAPIResponse 解析，以支援自訂後端（例如 vLLM）- [PR #15362](https://github.com/BerriAI/litellm/pull/15362)

- **[Files API](../../docs/files_api)**
    - Feat(files): 為檔案操作新增 @client 裝飾器 - [PR #15339](https://github.com/BerriAI/litellm/pull/15339)

- **[/generateContent](../../docs/providers/gemini)**
    - 透過實際串流回應來修正 gemini cli - [PR #15264](https://github.com/BerriAI/litellm/pull/15264)

- **[Azure Passthrough](../../docs/pass_through/azure)**
    - Azure - 支援搭配 router 模型的 passthrough - [PR #15240](https://github.com/BerriAI/litellm/pull/15240)

#### 錯誤 {#bugs}

- **一般**
    - 修正快取命中時未回傳 x-litellm-cache-key 標頭的問題 - [PR #15348](https://github.com/BerriAI/litellm/pull/15348)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **Proxy CLI 驗證**
    - Proxy CLI - 不要將現有金鑰儲存在 URL 中，改為儲存在 state 參數中 - [PR #15290](https://github.com/BerriAI/litellm/pull/15290)

- **模型 + 端點**
    - 讓 PATCH `/model/{model_id}/update` 與 POST `/model/new` 一致地處理 `team_id` - [PR #15297](https://github.com/BerriAI/litellm/pull/15297)
    - 功能：在 UI 中新增 Infinity 作為提供者 - [PR #15285](https://github.com/BerriAI/litellm/pull/15285)
    - 修正：當設定檔包含 router_settings.model_group_alias 時，模型 + 端點頁面當機 - [PR #15308](https://github.com/BerriAI/litellm/pull/15308)
    - 模型與端點初始重構 - [PR #15435](https://github.com/BerriAI/litellm/pull/15435)
    - Litellm UI API 參考頁面更新 - [PR #15438](https://github.com/BerriAI/litellm/pull/15438)

- **團隊**
    - 團隊頁面：團隊表格新增「您的角色」欄位 - [PR #15384](https://github.com/BerriAI/litellm/pull/15384)
    - LiteLLM 儀表板團隊 UI 重構 - [PR #15418](https://github.com/BerriAI/litellm/pull/15418)

- **UI 基礎架構**
    - 新增 prettier 以自動格式化前端 - [PR #15215](https://github.com/BerriAI/litellm/pull/15215)
    - 在 UI 的 npm run dev 指令中加入 turbopack，以便在開發期間更快建置 - [PR #15250](https://github.com/BerriAI/litellm/pull/15250)
    - (效能) 修正：以精簡的 key aliases 端點取代臃腫的 key list 呼叫 - [PR #15252](https://github.com/BerriAI/litellm/pull/15252)
    - 可能修正了過期 cookie 造成的 UI 異常閃動問題 - [PR #15309](https://github.com/BerriAI/litellm/pull/15309)
    - LiteLLM UI 重構基礎架構 - [PR #15236](https://github.com/BerriAI/litellm/pull/15236)
    - 強制移除 UI 中未使用的 imports - [PR #15416](https://github.com/BerriAI/litellm/pull/15416)
    - 修正：使用量頁面 >> 模型活動 >> 每日花費圖表：在高花費數值時 y 軸裁切 - [PR #15389](https://github.com/BerriAI/litellm/pull/15389)
    - 更新 guardrail 提供者標誌 - [PR #15421](https://github.com/BerriAI/litellm/pull/15421)

- **管理設定**
    - 修正：路由設定即使顯示成功訊息仍未更新 - [PR #15249](https://github.com/BerriAI/litellm/pull/15249)
    - 修正：當 DB 中的值為空時，防止 DB 意外覆蓋設定檔值 - [PR #15340](https://github.com/BerriAI/litellm/pull/15340)

- **SSO**
    - SSO - 支援 EntraID 應用程式角色 - [PR #15351](https://github.com/BerriAI/litellm/pull/15351)

---

## 記錄 / 防護欄 / 提示管理整合 {#logging--guardrail--prompt-management-integrations}

#### 功能 {#features-3}

- **[PostHog](../../docs/observability/posthog)**
    - 功能：每個請求的 posthog API 金鑰 - [PR #15379](https://github.com/BerriAI/litellm/pull/15379)

#### 防護欄 {#guardrails}

- **[EnkryptAI](../../docs/proxy/guardrails)**
    - 在 LiteLLM 上新增 EnkryptAI Guardrails - [PR #15390](https://github.com/BerriAI/litellm/pull/15390)

---

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **標籤管理**
    - 標籤管理 - 新增設定基於標籤預算的支援 - [PR #15433](https://github.com/BerriAI/litellm/pull/15433)

- **動態速率限制器 v3**
    - QA/修正 - 動態速率限制器 v3 - 最終 QA - [PR #15311](https://github.com/BerriAI/litellm/pull/15311)
    - 修正動態速率限制器 v3 - 插入 litellm_model_saturation - [PR #15394](https://github.com/BerriAI/litellm/pull/15394)

- **共享健康檢查**
    - 在各 Pod 間實作共享健康檢查狀態 - [PR #15380](https://github.com/BerriAI/litellm/pull/15380)

---

## MCP 閘道 {#mcp-gateway}

- **工具控制**
    - MCP Gateway - UI - 為 Key、Teams 選擇允許的工具 - [PR #15241](https://github.com/BerriAI/litellm/pull/15241)
    - MCP Gateway - 後端 - 允許依團隊/key 儲存允許的工具 - [PR #15243](https://github.com/BerriAI/litellm/pull/15243)
    - MCP Gateway - 細粒度資料庫物件儲存控制 - [PR #15255](https://github.com/BerriAI/litellm/pull/15255)
    - MCP Gateway - Litellm mcp 修正團隊控制 - [PR #15304](https://github.com/BerriAI/litellm/pull/15304)
    - MCP Gateway - QA/修正 - 確保 Team/Key 層級強制執行可用於 MCP - [PR #15305](https://github.com/BerriAI/litellm/pull/15305)
    - 功能：在 /v1/mcp/server/health 端點回應中包含 server_name - [PR #15431](https://github.com/BerriAI/litellm/pull/15431)

- **OpenAPI 整合**
    - MCP - 支援將 OpenAPI 規格轉換為 MCP servers - [PR #15343](https://github.com/BerriAI/litellm/pull/15343)
    - MCP - 指定每個工具允許的參數 - [PR #15346](https://github.com/BerriAI/litellm/pull/15346)

- **設定**
    - MCP - 支援設定 CA_BUNDLE_PATH - [PR #15253](https://github.com/BerriAI/litellm/pull/15253)
    - 修正：確保 MCP client 在工具呼叫期間保持開啟 - [PR #15391](https://github.com/BerriAI/litellm/pull/15391)
    - 移除 migration.sql 中硬編碼的 "public" schema - [PR #15363](https://github.com/BerriAI/litellm/pull/15363)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由器最佳化**
    - 修正 - Router：為 O(1) deployment 查找新增 model_name 索引 - [PR #15113](https://github.com/BerriAI/litellm/pull/15113)
    - 重構 Utils：從 client 中擷取內部函式 - [PR #15234](https://github.com/BerriAI/litellm/pull/15234)
    - 修正 Networking：移除限制 - [PR #15302](https://github.com/BerriAI/litellm/pull/15302)

- **工作階段管理**
    - 修正 - 工作階段未共享 - [PR #15388](https://github.com/BerriAI/litellm/pull/15388)
    - 修正：移除 hot path 中的 panic - [PR #15396](https://github.com/BerriAI/litellm/pull/15396)
    - 修正 - 共享工作階段解析與使用問題 - [PR #15440](https://github.com/BerriAI/litellm/pull/15440)
    - 修正：處理已關閉的 aiohttp sessions - [PR #15442](https://github.com/BerriAI/litellm/pull/15442)
    - 修正：在重新建立 aiohttp sessions 時防止工作階段洩漏 - [PR #15443](https://github.com/BerriAI/litellm/pull/15443)

- **SSL/TLS 效能**
    - 效能：使用優先 cipher 最佳化 SSL/TLS handshake 效能 - [PR #15398](https://github.com/BerriAI/litellm/pull/15398)

- **相依套件**
    - 將 tenacity 版本升級至 8.5.0 - [PR #15303](https://github.com/BerriAI/litellm/pull/15303)

- **資料遮罩**
    - 修正 - SensitiveDataMasker 會將列表轉換為字串 - [PR #15420](https://github.com/BerriAI/litellm/pull/15420)

---

## 一般 AI Gateway 改進 {#general-ai-gateway-improvements}

#### 安全性 {#security}

- **一般**
    - 修正：在啟用 redact_user_api_key_info 時遮蓋 AWS 憑證 - [PR #15321](https://github.com/BerriAI/litellm/pull/15321)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 更新文件：效能更新 - [PR #15211](https://github.com/BerriAI/litellm/pull/15211)
    - 新增 W&B Inference 文件 - [PR #15278](https://github.com/BerriAI/litellm/pull/15278)

- **部署**
    - 刪除會導致基於 `config.yaml` 的啟動失敗的 docker-compose 有問題註解 - [PR #15425](https://github.com/BerriAI/litellm/pull/15425)

---

## 新貢獻者 {#new-contributors}

* @Gal-bloch 做出了他們的首次貢獻，見 [PR #15219](https://github.com/BerriAI/litellm/pull/15219)
* @lcfyi 做出了他們的首次貢獻，見 [PR #15315](https://github.com/BerriAI/litellm/pull/15315)
* @ashengstd 做出了他們的首次貢獻，見 [PR #15362](https://github.com/BerriAI/litellm/pull/15362)
* @vkolehmainen 做出了他們的首次貢獻，見 [PR #15363](https://github.com/BerriAI/litellm/pull/15363)
* @jlan-nl 做出了他們的首次貢獻，見 [PR #15330](https://github.com/BerriAI/litellm/pull/15330)
* @BCook98 做出了他們的首次貢獻，見 [PR #15402](https://github.com/BerriAI/litellm/pull/15402)
* @PabloGmz96 做出了他們的首次貢獻，見 [PR #15425](https://github.com/BerriAI/litellm/pull/15425)

---

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.77.7.rc.1...v1.78.0.rc.1)** {#full-changeloghttpsgithubcomberriailitellmcomparev1777rc1v1780rc1}
