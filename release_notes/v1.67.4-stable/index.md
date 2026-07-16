---
title: v1.67.4-stable - 改良的使用者管理
slug: v1.67.4-stable
date: 2025-04-26T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

tags: ["responses_api", "ui_improvements", "security", "session_management"]
hide_table_of_contents: false
---
import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.67.4-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.67.4.post1
```
</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **改良的使用者管理**：此版本可跨使用者、金鑰、團隊與模型進行搜尋與篩選。
- **Responses API 負載平衡**：跨提供者區域路由請求，並確保工作階段延續性。 
- **UI 工作階段記錄**：將多個傳送至 LiteLLM 的請求分組為一個工作階段。 

## 改良的使用者管理 {#improved-user-management}

<Image img={require('../../img/release_notes/ui_search_users.png')}/>
<br/>

此版本讓您更容易在 LiteLLM 上管理使用者和金鑰。您現在可以跨使用者、金鑰、團隊與模型進行搜尋和篩選，並更輕鬆地控制使用者設定。

新功能包括：

- 可依電子郵件、ID、角色或團隊搜尋使用者。
- 在同一處查看使用者的所有模型、團隊和金鑰。
- 直接在 Users Tab 中變更使用者角色和模型存取權限。

這些變更可幫助您在 LiteLLM 上花更少時間進行使用者設定與管理。

## Responses API 負載平衡 {#responses-api-load-balancing}

<Image img={require('../../img/release_notes/ui_responses_lb.png')}/>
<br/>

此版本為 Responses API 引入負載平衡，可讓您跨提供者區域路由請求並確保工作階段延續性。運作方式如下：

- 如果提供了 `previous_response_id`，LiteLLM 會將請求路由到產生前一個回應的原始部署，確保工作階段延續性。
- 如果未提供 `previous_response_id`，LiteLLM 會在可用部署之間對請求進行負載平衡。

[閱讀更多](https://docs.litellm.ai/docs/response_api#load-balancing-with-session-continuity)

## UI 工作階段記錄 {#ui-session-logs}

<Image img={require('../../img/ui_session_logs.png')}/>
<br/>

此版本可讓您將傳送至 LiteLLM proxy 的請求分組為一個工作階段。如果您在請求中指定 litellm_session_id，LiteLLM 會自動將同一工作階段中的所有記錄分組。這讓您能夠輕鬆追蹤每個工作階段的使用量與請求內容。 

[閱讀更多](https://docs.litellm.ai/docs/proxy/ui_logs_sessions)

## 新模型 / 已更新模型 {#new-models--updated-models}

- **OpenAI**
    1. 新增 `gpt-image-1` 成本追蹤 [開始使用](https://docs.litellm.ai/docs/image_generation)
    2. 錯誤修正：在未指定 quality 時，為 gpt-image-1 新增成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/10247)
- **Azure**
    1. 修正傳遞至 Azure 中 whisper 的 timestamp granularities [開始使用](https://docs.litellm.ai/docs/audio_transcription)
    2. 新增 azure/gpt-image-1 定價 [開始使用](https://docs.litellm.ai/docs/image_generation), [PR](https://github.com/BerriAI/litellm/pull/10327)
    3. 為 `azure/computer-use-preview`、`azure/gpt-4o-audio-preview-2024-12-17`、`azure/gpt-4o-mini-audio-preview-2024-12-17` 新增成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/10178)
- **Bedrock**
    1. 新增對 model="arn:.."（Bedrock application inference profile models）時所有相容 Bedrock 參數的支援 [開始使用](https://docs.litellm.ai/docs/providers/bedrock#bedrock-application-inference-profile), [PR](https://github.com/BerriAI/litellm/pull/10256)
    2. 修正錯誤的 system prompt 轉換 [PR](https://github.com/BerriAI/litellm/pull/10120)
- **VertexAI / Google AI Studio**
    1. 允許為 `gemini-2.5-flash` 設定 `budget_tokens=0` [開始使用](https://docs.litellm.ai/docs/providers/gemini#usage---thinking--reasoning_content),[PR](https://github.com/BerriAI/litellm/pull/10198)
    2. 確保回傳的 `usage` 包含 thinking token 使用量 [PR](https://github.com/BerriAI/litellm/pull/10198)
    3. 新增 `gemini-2.5-pro-preview-03-25` 的成本追蹤 [PR](https://github.com/BerriAI/litellm/pull/10178)
- **Cohere**
    1. 新增對 cohere command-a-03-2025 的支援 [開始使用](https://docs.litellm.ai/docs/providers/cohere), [PR](https://github.com/BerriAI/litellm/pull/10295)
- **SageMaker**
    1. 新增對 max_completion_tokens 參數的支援 [開始使用](https://docs.litellm.ai/docs/providers/sagemaker), [PR](https://github.com/BerriAI/litellm/pull/10300)
- **Responses API**
    1. 新增對 GET 和 DELETE 操作的支援 - `/v1/responses/{response_id}` [開始使用](../../docs/response_api)
    2. 為所有支援的模型新增工作階段管理支援 [PR](https://github.com/BerriAI/litellm/pull/10321)
    3. 新增路由親和性，以在工作階段內維持模型一致性 [開始使用](https://docs.litellm.ai/docs/response_api#load-balancing-with-routing-affinity), [PR](https://github.com/BerriAI/litellm/pull/10193)

## 支出追蹤改進 {#spend-tracking-improvements}

- **錯誤修正**：修正支出追蹤錯誤，確保預設的 litellm 參數不會在記憶體中被修改 [PR](https://github.com/BerriAI/litellm/pull/10167)
- **棄用日期**：為 Azure、VertexAI 模型新增棄用日期 [PR](https://github.com/BerriAI/litellm/pull/10308)

## 管理端點 / UI {#management-endpoints--ui}

#### 使用者 {#users}
- **篩選與搜尋**： 
  - 依 user_id、role、team、sso_id 篩選使用者 
  - 依電子郵件搜尋使用者

  <br/>

  <Image img={require('../../img/release_notes/user_filters.png')}/>

- **使用者資訊面板**：新增一個使用者資訊窗格 [PR](https://github.com/BerriAI/litellm/pull/10213)
  - 檢視與使用者相關聯的團隊、金鑰、模型 
  - 編輯使用者角色、模型權限 

#### 團隊 {#teams}
- **篩選與搜尋**： 
    - 依 Organization、Team ID 篩選團隊 [PR](https://github.com/BerriAI/litellm/pull/10324)
    - 依 Team Name 搜尋團隊 [PR](https://github.com/BerriAI/litellm/pull/10324)

  <br/>

  <Image img={require('../../img/release_notes/team_filters.png')}/>

#### 金鑰 {#keys}
- **金鑰管理**： 
  - 支援依 key hash 進行交叉篩選與篩選 [PR](https://github.com/BerriAI/litellm/pull/10322)
  - 修正重設篩選條件時的金鑰別名重設問題 [PR](https://github.com/BerriAI/litellm/pull/10099)
  - 修正建立金鑰時的表格渲染問題 [PR](https://github.com/BerriAI/litellm/pull/10224)

#### UI 記錄頁面 {#ui-logs-page}

- **工作階段記錄**：新增 UI 工作階段記錄 [開始使用](https://docs.litellm.ai/docs/proxy/ui_logs_sessions)

#### UI 驗證與安全性 {#ui-authentication--security}
- **必須驗證**：現在所有儀表板頁面都需要驗證 [PR](https://github.com/BerriAI/litellm/pull/10229)
- **SSO 修正**：修正 SSO 使用者登入無效權杖錯誤 [PR](https://github.com/BerriAI/litellm/pull/10298)
- [BETA] **加密權杖**：將 UI 轉為使用加密權杖 [PR](https://github.com/BerriAI/litellm/pull/10302)
- **權杖到期**：支援透過重新導向至登入頁面來重新整理權杖（修正過期權杖會顯示空白頁面的問題） [PR](https://github.com/BerriAI/litellm/pull/10250)

#### UI 一般修正 {#ui-general-fixes}
- **修正 UI 閃爍**：處理儀表板中的 UI 閃爍問題 [PR](https://github.com/BerriAI/litellm/pull/10261)
- **改良術語**：改善 Keys 和 Tools 頁面上的載入與無資料狀態 [PR](https://github.com/BerriAI/litellm/pull/10253)
- **Azure 模型支援**：修正編輯 Azure 公開模型名稱以及在建立後變更模型名稱的問題 [PR](https://github.com/BerriAI/litellm/pull/10249)
- **團隊模型選擇器**：修正團隊模型選擇的錯誤 [PR](https://github.com/BerriAI/litellm/pull/10171)

## 記錄 / 防護欄整合 {#logging--guardrail-integrations}

- **Datadog**：
    1. 修正 Datadog LLM 可觀測性記錄 [開始使用](https://docs.litellm.ai/docs/proxy/logging#datadog), [PR](https://github.com/BerriAI/litellm/pull/10206)
- **Prometheus / Grafana**： 
    1. 啟用 LiteLLM Grafana Template 上的資料來源選擇 [開始使用](https://docs.litellm.ai/docs/proxy/prometheus#-litellm-maintained-grafana-dashboards-), [PR](https://github.com/BerriAI/litellm/pull/10257)
- **AgentOps**： 
    1. 新增 AgentOps 整合 [開始使用](https://docs.litellm.ai/docs/observability/agentops_integration), [PR](https://github.com/BerriAI/litellm/pull/9685)
- **Arize**： 
    1. 新增 Arize 與 Phoenix 整合缺少的屬性 [開始使用](https://docs.litellm.ai/docs/observability/arize_integration), [PR](https://github.com/BerriAI/litellm/pull/10215)

## 一般 Proxy 改進 {#general-proxy-improvements}

- **快取**：修正快取計算 cache key 時未將 `thinking` 或 `reasoning_effort` 納入考量的問題 [PR](https://github.com/BerriAI/litellm/pull/10140)
- **模型群組**：修正使用者在 model_info 中設定 model_group 時的處理問題 [PR](https://github.com/BerriAI/litellm/pull/10191)
- **透傳端點**：確保 `PassthroughStandardLoggingPayload` 會連同 method、URL、request/response body 一併記錄 [PR](https://github.com/BerriAI/litellm/pull/10194)
- **修正 SQL 注入**：修正 spend_management_endpoints.py 中潛在的 SQL injection 漏洞 [PR](https://github.com/BerriAI/litellm/pull/9878)

## Helm {#helm}

- 修正 migration job 上的 serviceAccountName [PR](https://github.com/BerriAI/litellm/pull/10258)

## 完整變更記錄 {#full-changelog}

完整的變更清單可於 [GitHub release notes](https://github.com/BerriAI/litellm/compare/v1.67.0-stable...v1.67.4-stable) 中找到。
