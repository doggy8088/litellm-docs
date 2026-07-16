---
title: "v1.74.7-stable"
slug: "v1-74-7"
date: 2025-07-19T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaffer
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
docker.litellm.ai/berriai/litellm:v1.74.7-stable.patch.1
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.74.7.post2
```

</TabItem>
</Tabs>

---

## 主要亮點  {#key-highlights}

- **向量儲存** - 支援 Vertex RAG Engine、PG Vector、OpenAI 與 Azure OpenAI Vector Stores。
- **大量編輯使用者** - 在 UI 上大量編輯使用者。
- **健康檢查改進** - 避免在高流量期間不必要的 pod 重新啟動。
- **新的 LLM 提供者** - 新增 Moonshot AI 與 Vercel v0 提供者支援。

---

## 向量儲存 API {#vector-stores-api}

<Image img={require('../../img/release_notes/vector_stores.png')} />

此版本新增支援可將 VertexAI RAG Engine、PG Vector、Bedrock Knowledge Bases 與 OpenAI Vector Stores 與 LiteLLM 搭配使用。

這非常適合需要搭配 LLM 使用外部知識來源的使用案例。

這為 LiteLLM 使用者帶來以下優點：

**Proxy 管理員優點：**
- 細粒度存取控制：決定哪些 Keys 與 Teams 可以存取特定的 Vector Stores
- 跨所有向量儲存作業的完整使用追蹤與監控

**開發者優點：**
- 用於查詢向量儲存並將其與 LLM API 請求搭配使用的簡單、統一介面
- 在所有受支援的向量儲存提供者之間提供一致的 API 體驗

[開始使用](../../docs/completion/knowledgebase)

---

## 大量編輯使用者 {#bulk-editing-users}

<Image img={require('../../img/bulk_edit_graphic.png')} />

v1.74.7-stable 在 UI 中引入大量編輯使用者。這對以下情境很有用：
- 將所有現有使用者授予預設團隊（對於控管存取權／依團隊追蹤支出很有用）
- 控管現有使用者的個人模型存取權

[閱讀更多](https://docs.litellm.ai/docs/proxy/ui/bulk_edit_users)

---

## 健康檢查伺服器 {#health-check-server}

<Image alt="分離式健康應用程式架構" img={require('../../img/separate_health_app_architecture.png')} style={{ borderRadius: '8px', marginBottom: '1em', maxWidth: '100%' }} />

此版本帶來可靠性改進，可避免在高流量期間不必要的 pod 重新啟動。先前，當主要 LiteLLM 應用程式忙於處理流量時，即使 pod 狀態正常，健康端點仍會逾時。
 
從此版本開始，您可以在具備專用埠的隔離程序上執行健康端點。這可確保即使主要 LiteLLM 應用程式處於高負載狀態，存活與就緒探測仍能保持回應。

[閱讀更多](https://docs.litellm.ai/docs/proxy/prod#10-use-a-separate-health-check-app)

---

## 新模型／更新模型 {#new-models--updated-models}

#### 定價／上下文視窗更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- |
| Azure AI | `azure_ai/grok-3` | 131k | $3.30 | $16.50 |
| Azure AI | `azure_ai/global/grok-3` | 131k | $3.00 | $15.00 |
| Azure AI | `azure_ai/global/grok-3-mini` | 131k | $0.25 | $1.27 |
| Azure AI | `azure_ai/grok-3-mini` | 131k | $0.275 | $1.38 |
| Azure AI | `azure_ai/jais-30b-chat` | 8k | $3200 | $9710 |
| Groq | `groq/moonshotai-kimi-k2-instruct` | 131k | $1.00 | $3.00 |
| AI21 | `jamba-large-1.7` | 256k | $2.00 | $8.00 |
| AI21 | `jamba-mini-1.7` | 256k | $0.20 | $0.40 |
| Together.ai | `together_ai/moonshotai/Kimi-K2-Instruct` | 131k | $1.00 | $3.00 |
| v0 | `v0/v0-1.0-md` | 128k | $3.00 | $15.00 |
| v0 | `v0/v0-1.5-md` | 128k | $3.00 | $15.00 |
| v0 | `v0/v0-1.5-lg` | 512k | $15.00 | $75.00 |
| Moonshot | `moonshot/moonshot-v1-8k` | 8k | $0.20 | $2.00 |
| Moonshot | `moonshot/moonshot-v1-32k` | 32k | $1.00 | $3.00 |
| Moonshot | `moonshot/moonshot-v1-128k` | 131k | $2.00 | $5.00 |
| Moonshot | `moonshot/moonshot-v1-auto` | 131k | $2.00 | $5.00 |
| Moonshot | `moonshot/kimi-k2-0711-preview` | 131k | $0.60 | $2.50 |
| Moonshot | `moonshot/moonshot-v1-32k-0430` | 32k | $1.00 | $3.00 |
| Moonshot | `moonshot/moonshot-v1-128k-0430` | 131k | $2.00 | $5.00 |
| Moonshot | `moonshot/moonshot-v1-8k-0430` | 8k | $0.20 | $2.00 |
| Moonshot | `moonshot/kimi-latest` | 131k | $2.00 | $5.00 |
| Moonshot | `moonshot/kimi-latest-8k` | 8k | $0.20 | $2.00 |
| Moonshot | `moonshot/kimi-latest-32k` | 32k | $1.00 | $3.00 |
| Moonshot | `moonshot/kimi-latest-128k` | 131k | $2.00 | $5.00 |
| Moonshot | `moonshot/kimi-thinking-preview` | 131k | $30.00 | $30.00 |
| Moonshot | `moonshot/moonshot-v1-8k-vision-preview` | 8k | $0.20 | $2.00 |
| Moonshot | `moonshot/moonshot-v1-32k-vision-preview` | 32k | $1.00 | $3.00 |
| Moonshot | `moonshot/moonshot-v1-128k-vision-preview` | 131k | $2.00 | $5.00 |

#### 功能 {#features}

- **[🆕 Moonshot API (Kimi)](../../docs/providers/moonshot)**
    - 用於存取 Kimi 模型的新 LLM API 整合 - [PR #12592](https://github.com/BerriAI/litellm/pull/12592), [開始使用](../../docs/providers/moonshot)
- **[🆕 v0 提供者](../../docs/providers/v0)**
    - 針對 v0.dev 的新提供者整合 - [PR #12751](https://github.com/BerriAI/litellm/pull/12751), [開始使用](../../docs/providers/v0)
- **[OpenAI](../../docs/providers/openai)**
    - 將 OpenAI DeepResearch 模型與 `litellm.completion`（`/chat/completions`）搭配使用 - [PR #12627](https://github.com/BerriAI/litellm/pull/12627) **需要文件**
- **[Azure OpenAI](../../docs/providers/azure_openai)**
    - 將 Azure OpenAI DeepResearch 模型與 `litellm.completion`（`/chat/completions`）搭配使用 - [PR #12627](https://github.com/BerriAI/litellm/pull/12627) **需要文件**
    - 新增 `response_format` 對 openai gpt-4.1 模型的支援 - [PR #12745](https://github.com/BerriAI/litellm/pull/12745)
- **[Anthropic](../../docs/providers/anthropic)**
    - 支援工具快取控制 - [PR #12668](https://github.com/BerriAI/litellm/pull/12668)
- **[Bedrock](../../docs/providers/bedrock)**
    - 支援 Claude 4 /invoke 路由 - [PR #12599](https://github.com/BerriAI/litellm/pull/12599), [開始使用](../../docs/providers/bedrock)
    - 支援應用程式推論設定檔工具選擇 - [PR #12599](https://github.com/BerriAI/litellm/pull/12599)
- **[Gemini](../../docs/providers/gemini)**
    - 為上下文快取新增自訂 TTL 支援 - [PR #12541](https://github.com/BerriAI/litellm/pull/12541)
    - 修正 Gemini 2.x 模型的隱式快取成本計算 - [PR #12585](https://github.com/BerriAI/litellm/pull/12585)
- **[VertexAI](../../docs/providers/vertex)**
    - 新增 Vertex AI RAG Engine 支援（與 OpenAI 相容 `/vector_stores` API 搭配使用）- [PR #12752](https://github.com/BerriAI/litellm/pull/12595), [開始使用](../../docs/completion/knowledgebase)
- **[vLLM](../../docs/providers/vllm)**
    - 新增使用 Rerank 端點與 vLLM 搭配使用的支援 - [PR #12738](https://github.com/BerriAI/litellm/pull/12738), [開始使用](../../docs/providers/vllm#rerank)
- **[AI21](../../docs/providers/ai21)**
    - 新增 ai21/jamba-1.7 模型系列定價 - [PR #12593](https://github.com/BerriAI/litellm/pull/12593), [開始使用](../../docs/providers/ai21)
- **[Together.ai](../../docs/providers/together_ai)**
    - [新模型] 新增 together_ai/moonshotai/Kimi-K2-Instruct - [PR #12645](https://github.com/BerriAI/litellm/pull/12645), [開始使用](../../docs/providers/together_ai)
- **[Groq](../../docs/providers/groq)**
    - 新增 groq/moonshotai-kimi-k2-instruct 模型組態 - [PR #12648](https://github.com/BerriAI/litellm/pull/12648), [開始使用](../../docs/providers/groq)
- **[Github Copilot](../../docs/providers/github_copilot)**
    - 將 GH Copilot 的 System prompts 改為 assistant prompts - [PR #12742](https://github.com/BerriAI/litellm/pull/12742), [開始使用](../../docs/providers/github_copilot)

#### 錯誤 {#bugs}
- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 streaming + response_format + tools 錯誤 - [PR #12463](https://github.com/BerriAI/litellm/pull/12463)
- **[XAI](../../docs/providers/xai)**
    - grok-4 不支援 `stop` 參數 - [PR #12646](https://github.com/BerriAI/litellm/pull/12646)
- **[AWS](../../docs/providers/bedrock)**
    - AWS Bedrock 的角色鏈結與 web 驗證 - [PR #12607](https://github.com/BerriAI/litellm/pull/12607)
- **[VertexAI](../../docs/providers/vertex)**
    - 將 project_id 新增至快取憑證 - [PR #12661](https://github.com/BerriAI/litellm/pull/12661)
- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 [PR #12619](https://github.com/BerriAI/litellm/pull/12619) 中 bedrock nova micro 與 nova lite 的上下文視窗資訊

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}
- **[/chat/completions](../../docs/completion/input)** 
    - 在 trim_messages 的輸出中包含工具呼叫 - [PR #11517](https://github.com/BerriAI/litellm/pull/11517)
- **[/v1/vector_stores](../../docs/vector_stores/search)**
    - 新的相容於 OpenAI 的向量儲存端點 - [PR #12699](https://github.com/BerriAI/litellm/pull/12699), [開始使用](../../docs/vector_stores/search)
    - 向量儲存搜尋端點 - [PR #12749](https://github.com/BerriAI/litellm/pull/12749), [開始使用](../../docs/vector_stores/search)
    - 支援使用 PG Vector 作為向量儲存 - [PR #12667](https://github.com/BerriAI/litellm/pull/12667), [開始使用](../../docs/completion/knowledgebase)
- **[/streamGenerateContent](../../docs/generateContent)**
    - 非 gemini 模型支援 - [PR #12647](https://github.com/BerriAI/litellm/pull/12647)

#### 錯誤 {#bugs-1}
- **[/vector_stores](../../docs/vector_stores/search)**
    - 傳入 `tools` 時，Knowledge Base Call 會回傳錯誤 - [PR #12628](https://github.com/BerriAI/litellm/pull/12628)

---

## [MCP Gateway](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-2}
- **[存取群組](../../docs/mcp#grouping-mcps-access-groups)**
    - 允許透過 litellm proxy config.yaml 新增 MCP access groups - [PR #12654](https://github.com/BerriAI/litellm/pull/12654)
    - 從 key 的存取清單列出工具 - [PR #12657](https://github.com/BerriAI/litellm/pull/12657)
- **[命名空間](../../docs/mcp#mcp-namespacing)**
    - 以 URL 為基礎的命名空間，以更好地區隔 - [PR #12658](https://github.com/BerriAI/litellm/pull/12658)
    - 讓 MCP_TOOL_PREFIX_SEPARATOR 可從 env 設定 - [PR #12603](https://github.com/BerriAI/litellm/pull/12603)
- **[閘道功能](../../docs/mcp#mcp-gateway-features)**
    - 在使用 /responses 時，允許 MCP 與所有 LLM APIs（VertexAI、Gemini、Groq 等）搭配使用 - [PR #12546](https://github.com/BerriAI/litellm/pull/12546)

#### 錯誤 {#bugs-2}
    - 修正更新 key/team 時更新物件權限 - [PR #12701](https://github.com/BerriAI/litellm/pull/12701)
    - 在 proxy 的可用路由清單中包含 /mcp - [PR #12612](https://github.com/BerriAI/litellm/pull/12612)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}
- **金鑰**
    - 改進重新產生 Key 狀態管理 - [PR #12729](https://github.com/BerriAI/litellm/pull/12729)
- **模型**
    - 萬用字元模型篩選支援 - [PR #12597](https://github.com/BerriAI/litellm/pull/12597)
    - 修正 UI 上處理僅團隊模型的問題 - [PR #12632](https://github.com/BerriAI/litellm/pull/12632)
- **用量頁面**
    - 修正 Spend per Tag 圖表上 Y 軸標籤重疊 - [PR #12754](https://github.com/BerriAI/litellm/pull/12754)
- **團隊**
    - 允許設定自訂 key 期間 + 顯示 key 建立統計資料 - [PR #12722](https://github.com/BerriAI/litellm/pull/12722)
    - 讓團隊管理員可更新成員角色 - [PR #12629](https://github.com/BerriAI/litellm/pull/12629)
- **使用者**
    - 新的 `/user/bulk_update` 端點 - [PR #12720](https://github.com/BerriAI/litellm/pull/12720)
- **記錄頁面**
    - 在 UI Logs Page 新增 `end_user` 篩選器 - [PR #12663](https://github.com/BerriAI/litellm/pull/12663)
- **MCP 伺服器**
    - 複製 MCP Server 名稱功能 - [PR #12760](https://github.com/BerriAI/litellm/pull/12760)
- **向量儲存庫**
    - UI 支援點選進入 Vector Stores - [PR #12741](https://github.com/BerriAI/litellm/pull/12741)
    - 允許透過 UI 新增 Vertex RAG Engine、OpenAI、Azure - [PR #12752](https://github.com/BerriAI/litellm/pull/12752)
- **一般**
    - 為所有 ID（Key、Team、Organization、MCP Server）新增點擊即複製 - [PR #12615](https://github.com/BerriAI/litellm/pull/12615)
- **[SCIM](../../docs/proxy/scim)**
    - 新增 GET /ServiceProviderConfig 端點 - [PR #12664](https://github.com/BerriAI/litellm/pull/12664)

#### 錯誤 {#bugs-3}
- **團隊**
    - 建立新 team 時，確保正確加入 user id - [PR #12719](https://github.com/BerriAI/litellm/pull/12719)
    - 修正 UI 上處理僅團隊模型的問題 - [PR #12632](https://github.com/BerriAI/litellm/pull/12632)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-4}
- **[Google Cloud Model Armor](../../docs/proxy/guardrails/google_cloud_model_armor)**
    - 新的防護欄整合 - [PR #12492](https://github.com/BerriAI/litellm/pull/12492)
- **[Bedrock 防護欄](../../docs/proxy/guardrails/bedrock)**
    - 允許停用對 'BLOCKED' 動作的例外 - [PR #12693](https://github.com/BerriAI/litellm/pull/12693)
- **[Guardrails AI](../../docs/proxy/guardrails/guardrails_ai)**
    - 支援以 `llmOutput` 為基礎的防護欄作為 pre-call hooks - [PR #12674](https://github.com/BerriAI/litellm/pull/12674)
- **[DataDog LLM 可觀測性](../../docs/proxy/logging#datadog)**
    - 新增根據所使用的 LLM Endpoint 追蹤正確 span type 的支援 - [PR #12652](https://github.com/BerriAI/litellm/pull/12652)
- **[自訂記錄](../../docs/proxy/logging)**
    - 允許從 S3 或 GCS Bucket 讀取自訂 logger python scripts - [PR #12623](https://github.com/BerriAI/litellm/pull/12623)

#### 錯誤 {#bugs-4}
- **[一般記錄](../../docs/proxy/logging)**
    - cache_hits 上的 StandardLoggingPayload 應追蹤自訂 llm provider - [PR #12652](https://github.com/BerriAI/litellm/pull/12652)
- **[S3 Buckets](../../docs/proxy/logging#s3-buckets)**
    - 與 guardrails 一起使用時，S3 v2 log uploader 會當掉 - [PR #12733](https://github.com/BerriAI/litellm/pull/12733)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-5}
- **健康檢查**
    - 為 liveness probes 分離的 health app - [PR #12669](https://github.com/BerriAI/litellm/pull/12669)
    - 位於獨立連接埠的 health check app - [PR #12718](https://github.com/BerriAI/litellm/pull/12718)
- **快取**
    - 新增 Azure Blob cache 支援 - [PR #12587](https://github.com/BerriAI/litellm/pull/12587)
- **路由器**
    - 在 lowest_latency 策略中處理 completion tokens 為零時的 ZeroDivisionError - [PR #12734](https://github.com/BerriAI/litellm/pull/12734)

#### 錯誤 {#bugs-5}
- **資料庫**
    - 對 managed object table 使用 upsert，以避免 UniqueViolationError - [PR #11795](https://github.com/BerriAI/litellm/pull/11795)
    - 重構以支援 helm hook 的 use_prisma_migrate - [PR #12600](https://github.com/BerriAI/litellm/pull/12600)
- **快取**
    - 修正：embedding response models 的 redis 快取 - [PR #12750](https://github.com/BerriAI/litellm/pull/12750)

---

## Helm Chart {#helm-chart}

- DB Migration Hook：重構以支援 use_prisma_migrate - for helm hook [PR](https://github.com/BerriAI/litellm/pull/12600)
- 在 Helm migrations job 中新增 envVars 與 extraEnvVars 支援 - [PR #12591](https://github.com/BerriAI/litellm/pull/12591)

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-6}
- **控制平面 + 資料平面架構**
    - Control Plane + Data Plane 支援 - [PR #12601](https://github.com/BerriAI/litellm/pull/12601)
- **Proxy CLI**
    - 在 CLI 新增 "keys import" 命令 - [PR #12620](https://github.com/BerriAI/litellm/pull/12620)
- **Swagger 文件**
    - 為 LiteLLM /chat/completions、/embeddings、/responses 新增 swagger 文件 - [PR #12618](https://github.com/BerriAI/litellm/pull/12618)
- **相依套件**
    - 將 rich 版本從 ==13.7.1 放寬為 >=13.7.1 - [PR #12704](https://github.com/BerriAI/litellm/pull/12704)

#### 錯誤 {#bugs-6}

- 預設啟用 verbose log 的修正 - [PR #12596](https://github.com/BerriAI/litellm/pull/12596)

- 新增在 request body 中停用 callbacks 的支援 - [PR #12762](https://github.com/BerriAI/litellm/pull/12762)
- 處理 spend tracking metadata JSON 序列化中的循環參照 - [PR #12643](https://github.com/BerriAI/litellm/pull/12643)

---

## 新貢獻者 {#new-contributors}
* @AntonioKL 首次貢獻於 https://github.com/BerriAI/litellm/pull/12591
* @marcelodiaz558 首次貢獻於 https://github.com/BerriAI/litellm/pull/12541
* @dmcaulay 首次貢獻於 https://github.com/BerriAI/litellm/pull/12463
* @demoray 首次貢獻於 https://github.com/BerriAI/litellm/pull/12587
* @staeiou 首次貢獻於 https://github.com/BerriAI/litellm/pull/12631
* @stefanc-ai2 首次貢獻於 https://github.com/BerriAI/litellm/pull/12622
* @RichardoC 首次貢獻於 https://github.com/BerriAI/litellm/pull/12607
* @yeahyung 首次貢獻於 https://github.com/BerriAI/litellm/pull/11795
* @mnguyen96 首次貢獻於 https://github.com/BerriAI/litellm/pull/12619
* @rgambee 首次貢獻於 https://github.com/BerriAI/litellm/pull/11517
* @jvanmelckebeke 首次貢獻於 https://github.com/BerriAI/litellm/pull/12725
* @jlaurendi 首次貢獻於 https://github.com/BerriAI/litellm/pull/12704
* @doublerr 首次貢獻於 https://github.com/BerriAI/litellm/pull/12661

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.74.3-stable...v1.74.7-stable)** {#full-changeloghttpsgithubcomberriailitellmcomparev1743-stablev1747-stable}
