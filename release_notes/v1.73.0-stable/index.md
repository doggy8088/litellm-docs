---
title: "v1.73.0-stable - 為新使用者設定預設團隊"
slug: "v1-73-0-stable"
date: 2025-06-21T10:00:00
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


:::warning

## 已知問題 {#known-issues}

`non-root` docker 映像有一個已知問題，UI 無法載入。若您使用 `non-root` docker 映像，我們建議在升級到此版本前先等待。我們會為此發布修補程式。

:::

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:v1.73.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.73.0.post1
```

</TabItem>
</Tabs>

## TLDR {#tldr}

* **為什麼要升級**
    - 使用者管理：為新使用者設定預設團隊 - 讓所有使用者都能獲得 $10 API 金鑰供探索使用。
    - Passthrough Endpoints v2：為 passthrough endpoints 提供更強化的子路由與自訂成本追蹤支援。
    - 健康檢查儀表板：新增用於監控模型健康狀態與狀態的前端 UI。
* **誰應該閱讀**
    - 使用 **Passthrough Endpoints** 的團隊
    - 在 LiteLLM 上使用 **使用者管理** 的團隊
    - 使用模型的 **健康檢查儀表板** 的團隊
    - 在 LiteLLM 上使用 **Claude Code** 的團隊
* **升級風險**
    - **低**
        - 現有功能沒有重大破壞性變更。
- **重大變更**
    - `User Agent` 將在 LiteLLM UI 的 Logs 頁面自動被追蹤為標籤。這表示對於所有 LLM 請求，您會在 logs page 中看到 `User Agent` 標籤。

---

## 重點摘要 {#key-highlights}

### 為新使用者設定預設團隊 {#set-default-team-for-new-users}

<Image img={require('../../img/default_teams_product_ss.jpg')}/>

<br/>

v1.73.0 新增了將新使用者指派給預設團隊的能力。這讓在貴公司內啟用 LLM 實驗變得容易得多，同時也**確保探索支出的追蹤正確。**
 
這對 **Proxy 管理員** 的意義：
- 設定每位團隊成員的最高預算：這會設定個人在團隊內可花費的最高金額。 
- 為新使用者設定預設團隊：當新使用者透過 SSO / invitation link 登入時，會自動加入此團隊。 

這對 **開發者** 的意義： 
- 跨團隊檢視模型：您現在可以前往 `Models + Endpoints`，查看您在所有所屬團隊中可存取的模型。 
- 安全的建立金鑰彈出視窗：如果您除了某個團隊之外沒有任何模型存取權限（預設行為），系統現在會提示您在 Create Key modal 中選擇團隊。這解決了新使用者在 onboarding 到 proxy 時常見的混淆點。 

[開始使用](https://docs.litellm.ai/docs/tutorials/default_team_self_serve)

### 直通端點 v2 {#passthrough-endpoints-v2}

<Image img={require('../../img/release_notes/v2_pt.png')}/>

<br/>

此版本新增了為 passthrough endpoints 加入計費與完整 URL 轉送的支援。 

先前，您只能對應簡單的端點，但現在您可以只加入 `/bria`，所有子路由都會自動轉送——例如，`/bria/v1/text-to-image/base/model` 和 `/bria/v1/enhance_image` 都會以相同的路徑結構轉送到目標 URL。

這表示您作為 Proxy 管理員，可以導入 Bria API 和 Mistral OCR 等第三方端點、設定每次請求的成本，並讓您的開發者存取完整的 API 功能。

[深入了解 Passthrough Endpoints](../../docs/proxy/pass_through)

### v2 健康檢查  {#v2-health-checks}

<Image img={require('../../img/release_notes/v2_health.png')}/>

<br/>

此版本支援 Proxy 管理員選擇要執行健康檢查的特定模型，並在各自的檢查完成後立即看到健康狀態，以及上次檢查時間。

這讓 Proxy 管理員能夠立即找出哪些特定模型處於異常狀態，並檢視完整的錯誤堆疊追蹤，以便更快排除問題。

---

## 新增 / 更新的模型 {#new--updated-models}

### 定價 / Context Window 更新 {#pricing--context-window-updates}

| 提供者    | 模型                                  | 上下文視窗 | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 類型 |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | ---- |
| Google VertexAI | `vertex_ai/imagen-4` | N/A | 圖像生成 | 圖像生成 | 新增 |
| Google VertexAI | `vertex_ai/imagen-4-preview` | N/A | 圖像生成 | 圖像生成 | 新增 |
| Gemini | `gemini-2.5-pro` | 2M | $1.25 | $5.00 | 新增 |
| Gemini | `gemini-2.5-flash-lite` | 1M | $0.075 | $0.30 | 新增 |
| OpenRouter | 各種模型 | 已更新 | 已更新 | 已更新 | 已更新 |
| Azure | `azure/o3` | 200k | $2.00 | $8.00 | 已更新 |
| Azure | `azure/o3-pro` | 200k | $2.00 | $8.00 | 已更新 |
| Azure OpenAI | Azure Codex Models | 各種 | 各種 | 各種 | 新增 |

### 已更新的模型 {#updated-models}

#### 功能 {#features}
- **[Azure](../../docs/providers/azure)**
    - 支援新的 /v1 preview Azure OpenAI API - [PR](https://github.com/BerriAI/litellm/pull/11934), [開始使用](../../docs/providers/azure/azure_responses#azure-codex-models)
    - 新增 Azure Codex Models 支援 - [PR](https://github.com/BerriAI/litellm/pull/11934), [開始使用](../../docs/providers/azure/azure_responses#azure-codex-models)
    - 讓 Azure AD scope 可設定 - [PR](https://github.com/BerriAI/litellm/pull/11621)
    - 處理更多 GPT 自訂命名模式 - [PR](https://github.com/BerriAI/litellm/pull/11914)
    - 更新 o3 定價以符合 OpenAI 定價 - [PR](https://github.com/BerriAI/litellm/pull/11937)
- **[VertexAI](../../docs/providers/vertex)**
    - 新增 Vertex Imagen-4 模型 - [PR](https://github.com/BerriAI/litellm/pull/11767), [開始使用](../../docs/providers/vertex_image)
    - Anthropic 串流 passthrough 成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11734)
- **[Gemini](../../docs/providers/gemini)**
    - 透過 `/v1/speech` endpoint 提供可運作的 Gemini TTS 支援 - [PR](https://github.com/BerriAI/litellm/pull/11832)
    - 修正 gemini 2.5 flash 設定 - [PR](https://github.com/BerriAI/litellm/pull/11830)
    - 新增缺少的 `flash-2.5-flash-lite` 模型並修正定價 - [PR](https://github.com/BerriAI/litellm/pull/11901)
    - 將所有 gemini-2.5 模型標記為支援 PDF 輸入 - [PR](https://github.com/BerriAI/litellm/pull/11907)
    - 新增具有 reasoning 支援的 `gemini-2.5-pro` - [PR](https://github.com/BerriAI/litellm/pull/11927)
- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 不再強制需要 AWS 憑證 - [PR](https://github.com/BerriAI/litellm/pull/11765)
    - 為 APAC 區域新增 AWS Bedrock profiles - [PR](https://github.com/BerriAI/litellm/pull/11883)
    - 修正 AWS Bedrock Claude tool call index - [PR](https://github.com/BerriAI/litellm/pull/11842)
    - 處理帶有 `qs:..` 前綴的 base64 檔案資料 - [PR](https://github.com/BerriAI/litellm/pull/11908)
    - 將 Mistral Small 新增至 BEDROCK_CONVERSE_MODELS - [PR](https://github.com/BerriAI/litellm/pull/11760)
- **[Mistral](../../docs/providers/mistral)**
    - 強化 Mistral API，支援平行工具呼叫 - [PR](https://github.com/BerriAI/litellm/pull/11770)
- **[Meta Llama API](../../docs/providers/meta_llama)**
    - 啟用 meta_llama 模型的工具呼叫 - [PR](https://github.com/BerriAI/litellm/pull/11895)
- **[Volcengine](../../docs/providers/volcengine)**
    - 新增 thinking 參數支援 - [PR](https://github.com/BerriAI/litellm/pull/11914)

#### 錯誤 {#bugs}

- **[VertexAI](../../docs/providers/vertex)**
    - 處理 promptTokensDetails 中缺少的 tokenCount - [PR](https://github.com/BerriAI/litellm/pull/11896)
    - 修正 vertex AI claude thinking 參數 - [PR](https://github.com/BerriAI/litellm/pull/11796)
- **[Gemini](../../docs/providers/gemini)**
    - 修正 responses API 的 web search 錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11894), [開始使用](../../docs/completion/web_search#responses-litellmresponses)
- **[Custom LLM](../../docs/providers/custom_llm_server)**
    - 設定 anthropic 自訂 LLM 提供者屬性 - [PR](https://github.com/BerriAI/litellm/pull/11907)
- **[Anthropic](../../docs/providers/anthropic)**
    - 更新 anthropic 套件版本 - [PR](https://github.com/BerriAI/litellm/pull/11851)
- **[Ollama](../../docs/providers/ollama)**
    - 更新 ollama_embeddings 以支援同步 API - [PR](https://github.com/BerriAI/litellm/pull/11746)
    - 修正 response_format 無法運作的問題 - [PR](https://github.com/BerriAI/litellm/pull/11880)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}
- **[Responses API](../../docs/response_api)**
    - 首次支援 OpenAI 可重複使用提示詞 Responses API - [PR](https://github.com/BerriAI/litellm/pull/11782), [開始使用](../../docs/providers/openai/responses_api#reusable-prompts)
    - 支援在 Completion-to-Responses 橋接中傳遞圖片 URL - [PR](https://github.com/BerriAI/litellm/pull/11833)
- **[MCP 閘道](../../docs/mcp)**
    - 在建立／編輯組織時新增允許的 MCP - [PR](https://github.com/BerriAI/litellm/pull/11893), [開始使用](../../docs/mcp#-mcp-permission-management)
    - 允許使用驗證標頭連線至 MCP - [PR](https://github.com/BerriAI/litellm/pull/11891), [開始使用](../../docs/mcp#using-your-mcp-with-client-side-credentials)
- **[Speech API](../../docs/speech)**
    - 透過 OpenAI 的 `/v1/speech` 端點提供可運作的 Gemini TTS 支援 - [PR](https://github.com/BerriAI/litellm/pull/11832)
- **[Passthrough Endpoints](../../docs/proxy/pass_through)**
    - 新增 passthrough endpoints 的子路由支援 - [PR](https://github.com/BerriAI/litellm/pull/11827)
    - 支援為每個 passthrough 請求設定自訂成本 - [PR](https://github.com/BerriAI/litellm/pull/11870)
    - 確保在 LiteLLM Proxy 上會追蹤 passthrough 請求的「請求」 - [PR](https://github.com/BerriAI/litellm/pull/11873)
    - 在 UI 上新增 V2 Passthrough endpoints - [PR](https://github.com/BerriAI/litellm/pull/11905)
    - 在 UI 中將 passthrough endpoints 移至 Models + Endpoints 底下 - [PR](https://github.com/BerriAI/litellm/pull/11871)
    - 新增 passthrough endpoints 的 QA 改進 - [PR](https://github.com/BerriAI/litellm/pull/11909), [PR](https://github.com/BerriAI/litellm/pull/11939)
- **[Models API](../../docs/completion/model_alias)**
    - 允許 `/models` 針對自訂萬用字元前綴回傳正確的 models - [PR](https://github.com/BerriAI/litellm/pull/11784)

#### 錯誤 {#bugs-1}

- **[Messages API](../../docs/anthropic_unified)**
    - 修正 `/v1/messages` 端點在 vertex_ai-anthropic models 上一律使用 us-central1 的問題 - [PR](https://github.com/BerriAI/litellm/pull/11831)
    - 修正 `/v1/messages` 和 `/moderations` 的 model_group 追蹤 - [PR](https://github.com/BerriAI/litellm/pull/11933)
    - 使用 Claude Code 時，修正透過 `/v1/messages` API 的成本追蹤與記錄 - [PR](https://github.com/BerriAI/litellm/pull/11928)
- **[MCP 閘道](../../docs/mcp)**
    - 修正使用在 config.yaml 中定義的 MCP - [PR](https://github.com/BerriAI/litellm/pull/11824)
- **[Chat Completion API](../../docs/completion/input)**
    - 允許在 acompletion 中將 dict 作為 tool_choice 引數 - [PR](https://github.com/BerriAI/litellm/pull/11860)
- **[Passthrough Endpoints](../../docs/pass_through/langfuse)**
    - 不要在 Langfuse 上記錄對 Langfuse passthrough 的請求 - [PR](https://github.com/BerriAI/litellm/pull/11768)

---

## 支出追蹤 {#spend-tracking}

#### 功能 {#features-2}
- **[User Agent Tracking](../../docs/proxy/cost_tracking)**
    - 自動依使用者代理程式追蹤支出（可為 Claude Code 提供成本追蹤） - [PR](https://github.com/BerriAI/litellm/pull/11781)
    - 在支出記錄 payload 中新增使用者代理程式標籤 - [PR](https://github.com/BerriAI/litellm/pull/11872)
- **[Tag Management](../../docs/proxy/cost_tracking)**
    - 支援在標籤管理中新增公開 model 名稱 - [PR](https://github.com/BerriAI/litellm/pull/11908)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-3}
- **測試金鑰頁面**
    - 允許在測試金鑰頁面上測試 `/v1/messages` - [PR](https://github.com/BerriAI/litellm/pull/11930)
- **[SSO](../../docs/proxy/sso)**
    - 允許傳遞額外標頭 - [PR](https://github.com/BerriAI/litellm/pull/11781)
- **[JWT Auth](../../docs/proxy/jwt_auth)**
    - 正確回傳使用者電子郵件 - [PR](https://github.com/BerriAI/litellm/pull/11783)
- **[Model Management](../../docs/proxy/model_management)**
    - 允許編輯既有 model 的 model access group - [PR](https://github.com/BerriAI/litellm/pull/11783)
- **[Team Management](../../docs/proxy/team_management)**
    - 允許為新使用者設定預設 team - [PR](https://github.com/BerriAI/litellm/pull/11874), [PR](https://github.com/BerriAI/litellm/pull/11877)
    - 修正預設 team 設定 - [PR](https://github.com/BerriAI/litellm/pull/11887)
- **[SCIM](../../docs/proxy/scim)**
    - 為 SCIM 上既有使用者新增錯誤處理 - [PR](https://github.com/BerriAI/litellm/pull/11862)
    - 為使用者新增 SCIM PATCH 與 PUT 操作 - [PR](https://github.com/BerriAI/litellm/pull/11863)
- **健康檢查儀表板**
    - 實作健康檢查後端 API 與儲存功能 - [PR](https://github.com/BerriAI/litellm/pull/11852)
    - 將 LiteLLM_HealthCheckTable 新增至資料庫 schema - [PR](https://github.com/BerriAI/litellm/pull/11677)
    - 實作健康檢查前端 UI 元件與儀表板整合 - [PR](https://github.com/BerriAI/litellm/pull/11679)
    - 為健康檢查回應新增成功 modal - [PR](https://github.com/BerriAI/litellm/pull/11899)
    - 修正健康檢查表格中可點擊的 model ID - [PR](https://github.com/BerriAI/litellm/pull/11898)
    - 修正健康檢查 UI 表格設計 - [PR](https://github.com/BerriAI/litellm/pull/11897)

---

## 記錄 / 防護欄整合 {#logging--guardrails-integrations}

#### 錯誤 {#bugs-2}
- **[Prometheus](../../docs/observability/prometheus)**
    - 修正使用 prometheus metrics 設定的錯誤 - [PR](https://github.com/BerriAI/litellm/pull/11779)

---

## 安全性與可靠性 {#security--reliability}

#### 安全性修正 {#security-fixes}
- **[Documentation Security](../../docs)**
    - 文件安全性修正 - [PR](https://github.com/BerriAI/litellm/pull/11776)
    - 為 UI + Docs 資料夾新增 Trivy 安全性掃描 - 移除所有漏洞 - [PR](https://github.com/BerriAI/litellm/pull/11778)

#### 可靠性改善 {#reliability-improvements}
- **[Dependencies](../../docs)**
    - 修正 aiohttp 版本需求 - [PR](https://github.com/BerriAI/litellm/pull/11777)
    - 在 UI dashboard 中將 next 從 14.2.26 升級到 14.2.30 - [PR](https://github.com/BerriAI/litellm/pull/11720)
- **[Networking](../../docs)**
    - 允許使用 CA Bundles - [PR](https://github.com/BerriAI/litellm/pull/11906)
    - 新增 GCP 與 AWS 之間的 workload identity federation - [PR](https://github.com/BerriAI/litellm/pull/10210)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-4}
- **[Deployment](../../docs/proxy/deploy)**
    - 為 Kubernetes 新增 deployment 註解 - [PR](https://github.com/BerriAI/litellm/pull/11849)
    - 在指令中新增 ciphers 並傳遞給 proxy 的 hypercorn - [PR](https://github.com/BerriAI/litellm/pull/11916)
- **[Custom Root Path](../../docs/proxy/deploy)**
    - 修正在自訂 root path 載入 UI 的問題 - [PR](https://github.com/BerriAI/litellm/pull/11912)
- **[SDK Improvements](../../docs/proxy/reliability)**
    - LiteLLM SDK / Proxy 改進（不要在 client 端轉換 message） - [PR](https://github.com/BerriAI/litellm/pull/11908)

#### 錯誤 {#bugs-3}
- **[Observability](../../docs/observability)**
    - 修正 observability 的 boto3 tracer 包裝 - [PR](https://github.com/BerriAI/litellm/pull/11869)

---

## 新貢獻者 {#new-contributors}
* @kjoth 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11621)
* @shagunb-acn 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11760)
* @MadsRC 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11765)
* @Abiji-2020 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11746)
* @salzubi401 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11803)
* @orolega 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11826)
* @X4tar 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11796)
* @karen-veigas 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11858)
* @Shankyg 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11859)
* @pascallim 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/10210)
* @lgruen-vcgs 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11883)
* @rinormaloku 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11851)
* @InvisibleMan1306 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11849)
* @ervwalter 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11937)
* @ThakeeNathees 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11880)
* @jnhyperion 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11842)
* @Jannchie 首次做出貢獻，見 [PR](https://github.com/BerriAI/litellm/pull/11860)

---

## 示範執行個體 {#demo-instance}

這裡有一個示範執行個體可用來測試變更：

- 執行個體：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/compare/v1.72.6-stable...v1.73.0.rc) {#git-diffhttpsgithubcomberriailitellmcomparev1726-stablev1730rc}
