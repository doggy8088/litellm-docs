---
title: "v1.74.15-stable"
slug: "v1-74-15"
date: 2025-08-02T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.74.15-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.74.15.post2
```

</TabItem>
</Tabs>

---

## 主要亮點 {#key-highlights}

- **使用者代理活動追蹤** - 追蹤每個程式碼工具的使用量。
- **提示管理** - 使用 Git-Ops 風格的提示管理與提示範本。
- **MCP 閘道：防護欄** - 支援在 MCP 伺服器上使用防護欄。
- **Google AI Studio Imagen4** - 支援在 Google AI Studio 上使用 Imagen4 模型。

---

## 使用者代理活動追蹤 {#user-agent-activity-tracking}

<Image 
  img={require('../../img/agent_1.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

此版本新增對 Claude Code、Roo Code、Gemini CLI 等 AI 驅動程式碼工具使用量與成本追蹤的支援，透過 LiteLLM 即可進行。現在您可以追蹤每個程式碼工具的 LLM 成本、總使用 token 數，以及 DAU/WAU/MAU。

這對想要追蹤其如何協助開發者生產力的中央 AI 平台團隊非常有幫助。 

[閱讀更多](https://docs.litellm.ai/docs/tutorials/cost_tracking_coding)

---

## 提示管理 {#prompt-management}

<br/>

[閱讀更多](../../docs/proxy/prompt_management)

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者    | 模型                                  | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | Cost per Image |
| ----------- | -------------------------------------- | -------------- | ------------------- | -------------------- | -------------- |
| OpenRouter | `openrouter/x-ai/grok-4` | 256k | $3 | $15 | N/A |
| Google AI Studio | `gemini/imagen-4.0-generate-001` | N/A | N/A | N/A | $0.04 |
| Google AI Studio | `gemini/imagen-4.0-ultra-generate-001` | N/A | N/A | N/A | $0.06 |
| Google AI Studio | `gemini/imagen-4.0-fast-generate-001` | N/A | N/A | N/A | $0.02 |
| Google AI Studio | `gemini/imagen-3.0-generate-002` | N/A | N/A | N/A | $0.04 |
| Google AI Studio | `gemini/imagen-3.0-generate-001` | N/A | N/A | N/A | $0.04 |
| Google AI Studio | `gemini/imagen-3.0-fast-generate-001` | N/A | N/A | N/A | $0.02 |

#### 功能 {#features}

- **[Google AI Studio](../../docs/providers/gemini)**
    - 新增 Google AI Studio Imagen4 模型系列支援 - [PR #13065](https://github.com/BerriAI/litellm/pull/13065), [開始使用](../../docs/providers/google_ai_studio/image_gen)
- **[Azure OpenAI](../../docs/providers/azure/azure)**
    - Azure `api_version="preview"` 支援 - [PR #13072](https://github.com/BerriAI/litellm/pull/13072), [開始使用](../../docs/providers/azure/azure#setting-api-version)
    - 支援受密碼保護的憑證檔案 - [PR #12995](https://github.com/BerriAI/litellm/pull/12995), [開始使用](../../docs/providers/azure/azure#authentication)
- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 透過 Anthropic `/v1/messages` 進行成本追蹤 - [PR #13072](https://github.com/BerriAI/litellm/pull/13072)
    - 支援 computer use - [PR #13150](https://github.com/BerriAI/litellm/pull/13150)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 Grok4 模型支援 - [PR #13018](https://github.com/BerriAI/litellm/pull/13018)
- **[Anthropic](../../docs/providers/anthropic)**
    - 自動快取控制注入 - 改善支援負索引的 cache_control_injection_points - [PR #13187](https://github.com/BerriAI/litellm/pull/13187), [開始使用](../../docs/tutorials/prompt_caching)
    - 支援中途備援並追蹤 token 使用量 - [PR #13149](https://github.com/BerriAI/litellm/pull/13149), [PR #13170](https://github.com/BerriAI/litellm/pull/13170)
- **[Perplexity](../../docs/providers/perplexity)**
    - 支援引用註解 - [PR #13225](https://github.com/BerriAI/litellm/pull/13225)

#### 錯誤修正 {#bugs}

- **[Gemini](../../docs/providers/gemini)**
    - 修正 merge_reasoning_content_in_choices 參數問題 - [PR #13066](https://github.com/BerriAI/litellm/pull/13066), [開始使用](../../docs/tutorials/openweb_ui#render-thinking-content-on-open-webui)
    - 新增支援在 Google AI Studio 使用 `GOOGLE_API_KEY` 環境變數 - [PR #12507](https://github.com/BerriAI/litellm/pull/12507)
- **[vLLM/OpenAI-like](../../docs/providers/vllm)**
    - 修正 embeddings 缺少 extra_headers 支援的問題 - [PR #13198](https://github.com/BerriAI/litellm/pull/13198)

---

## LLM API 端點 {#llm-api-endpoints}

#### 錯誤修正 {#bugs-1}

- **[/generateContent](../../docs/generateContent)**
    - 支援在 generateContent 路由中的 query_params 用於 API 金鑰設定 - [PR #13100](https://github.com/BerriAI/litellm/pull/13100)
    - 確保在 LiteLLM 上使用 /generateContent 時，google ai studio 的驗證使用 "x-goog-api-key" - [PR #13098](https://github.com/BerriAI/litellm/pull/13098)
    - 確保 tool calling 在 generateContent 上如預期運作 - [PR #13189](https://github.com/BerriAI/litellm/pull/13189)
- **[/vertex_ai (Passthrough)](../../docs/pass_through/vertex_ai)**
    - 確保多模態 embedding 回應正確記錄 - [PR #13050](https://github.com/BerriAI/litellm/pull/13050)

---

## [MCP 閘道](../../docs/mcp) {#mcp-gatewaydocsmcp}

#### 功能 {#features-1}

- **健康檢查改善**
    - 新增 MCP 伺服器的健康檢查端點 - [PR #13106](https://github.com/BerriAI/litellm/pull/13106)
- **防護欄整合**
    - 新增請求前與請求中回呼初始化 - [PR #13067](https://github.com/BerriAI/litellm/pull/13067)
    - 將請求前與請求中回呼移至 ProxyLogging - [PR #13109](https://github.com/BerriAI/litellm/pull/13109)
    - MCP 請求前與請求中防護欄實作 - [PR #13188](https://github.com/BerriAI/litellm/pull/13188)
- **協定與標頭支援**
    - 新增協定標頭支援 - [PR #13062](https://github.com/BerriAI/litellm/pull/13062)
- **URL 與命名空間**
    - 改善內部/Kubernetes URL 的 MCP 伺服器 URL 驗證 - [PR #13099](https://github.com/BerriAI/litellm/pull/13099)

#### 錯誤修正 {#bugs-2}

- **UI**
    - 修正 MCP 工具的捲動問題 - [PR #13015](https://github.com/BerriAI/litellm/pull/13015)
    - 修正 MCP 用戶端清單失敗問題 - [PR #13114](https://github.com/BerriAI/litellm/pull/13114)

[閱讀更多](../../docs/mcp)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **使用分析**
    - 新增使用者代理活動追蹤分頁 - [PR #13146](https://github.com/BerriAI/litellm/pull/13146)
    - 新增每位使用者的每日使用分析 - [PR #13147](https://github.com/BerriAI/litellm/pull/13147)
    - 預設使用圖表日期範圍設為最近 7 天 - [PR #12917](https://github.com/BerriAI/litellm/pull/12917)
    - 新增進階日期範圍選擇器元件 - [PR #13141](https://github.com/BerriAI/litellm/pull/13141), [PR #13221](https://github.com/BerriAI/litellm/pull/13221)
    - 在選擇日期後於使用成本圖表上顯示載入器 - [PR #13113](https://github.com/BerriAI/litellm/pull/13113)
- **模型**
    - 在 UI 上新增 Voyage、Jinai、Deepinfra 和 VolcEngine 提供者 - [PR #13131](https://github.com/BerriAI/litellm/pull/13131)
    - 在 UI 上新增 Sagemaker - [PR #13117](https://github.com/BerriAI/litellm/pull/13117)
    - 在 `/v1/models` 和 `/model_group/info` 端點保留模型順序 - [PR #13178](https://github.com/BerriAI/litellm/pull/13178)

- **金鑰管理**
    - 在 UI 中正確解析用於金鑰生成的 JSON 選項 - [PR #12989](https://github.com/BerriAI/litellm/pull/12989)
- **驗證**
    - **JWT 欄位**  
        - 為所有 JWT 欄位新增點號表示法支援 - [PR #13013](https://github.com/BerriAI/litellm/pull/13013)

#### 錯誤修正 {#bugs-3}

- **權限**
    - 修正組織的物件權限 - [PR #13142](https://github.com/BerriAI/litellm/pull/13142)
    - 修正 team v2 清單安全性檢查 - [PR #13094](https://github.com/BerriAI/litellm/pull/13094)
- **模型**
    - 修正模型更新時的模型重新載入 - [PR #13216](https://github.com/BerriAI/litellm/pull/13216)
- **路由器設定**
    - 修正 UI 中備援模型的顯示問題 - [PR #13191](https://github.com/BerriAI/litellm/pull/13191)
    - 修正自訂值的萬用字元模型名稱處理 - [PR #13116](https://github.com/BerriAI/litellm/pull/13116)
    - 修正備援刪除功能 - [PR #12606](https://github.com/BerriAI/litellm/pull/12606)

---

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

#### 功能 {#features-3}

- **[MLFlow](../../docs/proxy/logging#mlflow)**
    - 允許為 MLFlow 記錄請求新增標籤 - [PR #13108](https://github.com/BerriAI/litellm/pull/13108)
- **[Langfuse OTEL](../../docs/proxy/logging#langfuse)**
    - 為 Langfuse OpenTelemetry 整合新增完整的中繼資料支援 - [PR #12956](https://github.com/BerriAI/litellm/pull/12956)
- **[Datadog LLM Observability](../../docs/proxy/logging#datadog)**
    - 允許針對特定記錄整合隱藏訊息/回應內容 - [PR #13158](https://github.com/BerriAI/litellm/pull/13158)

#### 錯誤修正 {#bugs-4}

- **API 金鑰記錄**
    - 修正 API 金鑰被不當記錄 - [PR #12978](https://github.com/BerriAI/litellm/pull/12978)
- **MCP 花費追蹤**
    - 為花費表中的 MCP 命名空間工具名稱設定預設值 - [PR #12894](https://github.com/BerriAI/litellm/pull/12894)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

#### 功能 {#features-4}

- **背景健康檢查**
    - 允許為特定部署停用背景健康檢查 - [PR #13186](https://github.com/BerriAI/litellm/pull/13186)
- **資料庫連線管理**
    - 確保過時的 Prisma client 能正確中斷資料庫連線 - [PR #13140](https://github.com/BerriAI/litellm/pull/13140)
- **Jitter 改進**
    - 修正 jitter 計算（應該是相加而不是相乘） - [PR #12901](https://github.com/BerriAI/litellm/pull/12901)

#### 錯誤 {#bugs-5}

- **Anthropic 串流**
    - Anthropic 串流回應一律使用 choice index=0 - [PR #12666](https://github.com/BerriAI/litellm/pull/12666)
- **自訂驗證**
    - 正確向上拋出自訂例外 - [PR #13093](https://github.com/BerriAI/litellm/pull/13093)
- **OTEL 與受管理檔案**
    - 修正 OTEL 整合使用受管理檔案的問題 - [PR #13171](https://github.com/BerriAI/litellm/pull/13171)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

#### 功能 {#features-5}

- **資料庫遷移**
    - 預設改為使用 use_prisma_migrate - [PR #13117](https://github.com/BerriAI/litellm/pull/13117)
    - 在驗證檢查時解析僅限團隊的模型 - [PR #13117](https://github.com/BerriAI/litellm/pull/13117)
- **基礎架構**
    - 放寬 MCP Python 版本限制 - [PR #13102](https://github.com/BerriAI/litellm/pull/13102)
    - 將 build_and_test 遷移到 CI/CD Postgres DB - [PR #13166](https://github.com/BerriAI/litellm/pull/13166)
- **Helm 圖表**
    - 允許 Helm hooks 用於遷移工作 - [PR #13174](https://github.com/BerriAI/litellm/pull/13174)
    - 修正 Helm 遷移工作 schema 更新 - [PR #12809](https://github.com/BerriAI/litellm/pull/12809)

#### 錯誤 {#bugs-6}

- **Docker**
    - 移除 docker-compose 中過時的 `version` 屬性 - [PR #13172](https://github.com/BerriAI/litellm/pull/13172)
    - 為非 root Dockerfile 的 runtime 階段加入 openssl - [PR #13168](https://github.com/BerriAI/litellm/pull/13168)
- **資料庫設定**
    - 修正透過環境變數設定的 DB config - [PR #13111](https://github.com/BerriAI/litellm/pull/13111)
- **記錄**
    - 抑制 httpx 記錄 - [PR #13217](https://github.com/BerriAI/litellm/pull/13217)
- **Token 計數**
    - 在 token counter 中忽略像 prefix 這類不支援的 keys - [PR #11954](https://github.com/BerriAI/litellm/pull/11954)
---

## 新貢獻者 {#new-contributors}
* @5731la 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12989
* @restato 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12980
* @strickvl 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12956
* @Ne0-1 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12995
* @maxrabin 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13079
* @lvuna 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12894
* @Maximgitman 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12666
* @pathikrit 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12901
* @huetterma 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12809
* @betterthanbreakfast 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13029
* @phosae 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12606
* @sahusiddharth 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12507
* @Amit-kr26 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/11954
* @kowyo 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13172
* @AnandKhinvasara 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13187
* @unique-jakub 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13174
* @tyumentsev4 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13134
* @aayush-malviya-acquia 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/12978
* @kankute-sameer 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13225
* @AlexanderYastrebov 完成了他們的第一次貢獻於 https://github.com/BerriAI/litellm/pull/13178

## **[完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.74.9-stable...v1.74.15.rc)** {#full-changeloghttpsgithubcomberriailitellmcomparev1749-stablev17415rc}
