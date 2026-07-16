---
title: v1.67.0-stable - SCIM 整合
slug: v1.67.0-stable
date: 2025-04-19T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
  - name: Ishaan Jaffer
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg

tags: ["sso", "unified_file_id", "cost_tracking", "security"]
hide_table_of_contents: false
---
import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 主要亮點 {#key-highlights}

- **SCIM 整合**：可讓身分提供者（Okta、Azure AD、OneLogin 等）自動化使用者與團隊（群組）的佈建、更新與停用
- **依團隊與標籤的用量追蹤**：您現在可以在 1M+ spend logs 中查看依團隊與標籤區分的用量與支出。
- **統一的 Responses API**：支援透過 OpenAI 新的 Responses API 呼叫 Anthropic、Gemini、Groq 等。

讓我們開始深入了解。

## SCIM 整合 {#scim-integration}

<Image img={require('../../img/scim_integration.png')}/>

此版本為 LiteLLM 新增 SCIM 支援。這可讓您的 SSO 提供者（Okta、Azure AD 等）自動在 LiteLLM 上建立／刪除使用者、團隊與成員關係。這表示當您在 SSO 提供者中移除某個團隊時，SSO 提供者會自動刪除 LiteLLM 上對應的團隊。 

[閱讀更多](../../docs/tutorials/scim_litellm)
## 依團隊與標籤的用量追蹤 {#team-and-tag-based-usage-tracking}

<Image img={require('../../img/release_notes/new_team_usage_highlight.jpg')}/>

此版本改善了 1m+ spend logs 的依團隊與標籤用量追蹤，讓您更容易在正式環境監控 LLM API 支出。這包含：

- 檢視依 **每日支出** 的團隊 + 標籤
- 在團隊內檢視依 **金鑰的用量 / 支出**
- 檢視依 **多個標籤的支出**
- 允許 **內部使用者** 檢視其所屬團隊的支出

[閱讀更多](#management-endpoints--ui)

## 統一的 Responses API {#unified-responses-api}

此版本可讓您透過 LiteLLM 上的 POST /v1/responses 端點呼叫 Azure OpenAI、Anthropic、AWS Bedrock 與 Google Vertex AI 模型。這表示您現在可以搭配自己的模型使用 [OpenAI Codex](https://docs.litellm.ai/docs/tutorials/openai_codex) 等熱門工具。 

<Image img={require('../../img/release_notes/unified_responses_api_rn.png')}/>

[閱讀更多](https://docs.litellm.ai/docs/response_api)

## 新模型／更新模型 {#new-models--updated-models}

- **OpenAI**
    1. gpt-4.1、gpt-4.1-mini、gpt-4.1-nano、o3、o3-mini、o4-mini 定價 - [開始使用](../../docs/providers/openai#usage)、[PR](https://github.com/BerriAI/litellm/pull/9990)
    2. o4 - 正確將 o4 對應到 openai o_series model
- **Azure AI**
    1. Phi-4 輸出每 token 成本修正 - [PR](https://github.com/BerriAI/litellm/pull/9880)
    2. Responses API 支援 [開始使用](../../docs/providers/azure#azure-responses-api)、[PR](https://github.com/BerriAI/litellm/pull/10116)
- **Anthropic**
    1. 遮罩訊息 thinking 支援 - [開始使用](../../docs/providers/anthropic#usage---thinking--reasoning_content)、[PR](https://github.com/BerriAI/litellm/pull/10129)
- **Cohere**
    1. `/v2/chat` Passthrough 端點支援與成本追蹤 - [開始使用](../../docs/pass_through/cohere)、[PR](https://github.com/BerriAI/litellm/pull/9997)
- **Azure**
    1. 支援 azure tenant_id/client_id 環境變數 - [開始使用](../../docs/providers/azure#entra-id---use-tenant_id-client_id-client_secret)、[PR](https://github.com/BerriAI/litellm/pull/9993)
    2. 修正 2025+ api versions 的 response_format 檢查 - [PR](https://github.com/BerriAI/litellm/pull/9993)
    3. 新增 gpt-4.1、gpt-4.1-mini、gpt-4.1-nano、o3、o3-mini、o4-mini 定價
- **VLLM**
    1. Files - 支援 VLLM 影片 URL 的 'file' 訊息類型 - [開始使用](../../docs/providers/vllm#send-video-url-to-vllm)、[PR](https://github.com/BerriAI/litellm/pull/10129)
    2. Passthrough - 新的 `/vllm/` passthrough 端點支援 [開始使用](../../docs/pass_through/vllm)、[PR](https://github.com/BerriAI/litellm/pull/10002)
- **Mistral**
    1. 新的 `/mistral` passthrough 端點支援 [開始使用](../../docs/pass_through/mistral)、[PR](https://github.com/BerriAI/litellm/pull/10002)
- **AWS**
    1. 新的已對應 bedrock regions - [PR](https://github.com/BerriAI/litellm/pull/9430)
- **VertexAI / Google AI Studio**
    1. Gemini - 回應格式 - 透過指定 propertyOrdering 保留 google gemini 與 vertex 的 schema 欄位順序 - [開始使用](../../docs/providers/vertex#json-schema)、[PR](https://github.com/BerriAI/litellm/pull/9828)
    2. Gemini-2.5-flash - 回傳推理內容 [Google AI Studio](../../docs/providers/gemini#usage---thinking--reasoning_content)、[Vertex AI](../../docs/providers/vertex#thinking--reasoning_content)
    3. Gemini-2.5-flash - 定價 + 模型資訊 [PR](https://github.com/BerriAI/litellm/pull/10125)
    4. Passthrough - 新的 `/vertex_ai/discovery` 路由 - 可呼叫 AgentBuilder API 路由 [開始使用](../../docs/pass_through/vertex_ai#supported-api-endpoints)、[PR](https://github.com/BerriAI/litellm/pull/10084)
- **Fireworks AI**
    1. 在 `tool_calls` 欄位回傳 tool calling 回應（fireworks 會錯誤地將其以 content 中的 json 字串回傳） [PR](https://github.com/BerriAI/litellm/pull/10130)
- **Triton**
    1. 移除從 `/generate` 呼叫中固定移除 bad_words / stop words - [開始使用](../../docs/providers/triton-inference-server#triton-generate---chat-completion)、[PR](https://github.com/BerriAI/litellm/pull/10163)
- **其他**
    1. 支援 Responses API 上所有 litellm 提供者（可搭配 Codex 使用） - [開始使用](../../docs/tutorials/openai_codex)、[PR](https://github.com/BerriAI/litellm/pull/10132)
    2. 修正串流回應中合併多個 tool call 的問題 - [開始使用](../../docs/completion/stream#helper-function)、[PR](https://github.com/BerriAI/litellm/pull/10040)

## 支出追蹤改善 {#spend-tracking-improvements}

- **成本控制** - 在提示中注入快取控制點以降低成本 [開始使用](../../docs/tutorials/prompt_caching)、[PR](https://github.com/BerriAI/litellm/pull/10000)
- **支出標籤** - 標頭中的支出標籤 - 即使未啟用基於標籤的路由，也支援 x-litellm-tags [開始使用](../../docs/proxy/request_headers#litellm-headers)、[PR](https://github.com/BerriAI/litellm/pull/10000)
- **Gemini-2.5-flash** - 支援推理 token 的成本計算 [PR](https://github.com/BerriAI/litellm/pull/10141)

## 管理端點／UI {#management-endpoints--ui}
- **使用者**
    1. 在使用者頁面顯示 created_at 與 updated_at - [PR](https://github.com/BerriAI/litellm/pull/10033)
- **虛擬金鑰**
    1. 依金鑰別名篩選 - https://github.com/BerriAI/litellm/pull/10085
- **用量分頁**

    1. 依團隊的用量
        
        - 用於彙總團隊用量記錄的新 `LiteLLM_DailyTeamSpend` Table - [PR](https://github.com/BerriAI/litellm/pull/10039)
        
        - 新的依團隊用量儀表板 + 新 `/team/daily/activity` API - [PR](https://github.com/BerriAI/litellm/pull/10081)
        - 在 /team/daily/activity API 回傳團隊別名 - [PR](https://github.com/BerriAI/litellm/pull/10157)
        - 允許內部使用者檢視其所屬團隊的支出 - [PR](https://github.com/BerriAI/litellm/pull/10157)
        - 允許檢視依團隊分類的前幾個金鑰 - [PR](https://github.com/BerriAI/litellm/pull/10157)

        <Image img={require('../../img/release_notes/new_team_usage.png')}/>

    2. 依標籤的用量
        - 用於彙總標籤用量記錄的新 `LiteLLM_DailyTagSpend` Table - [PR](https://github.com/BerriAI/litellm/pull/10071)
        - 限制僅供 Proxy 管理員使用 - [PR](https://github.com/BerriAI/litellm/pull/10157)
        - 允許檢視依標籤分類的前幾個金鑰
        - 在 `/tag/list` API 回傳請求中傳入的標籤（亦即動態標籤） - [PR](https://github.com/BerriAI/litellm/pull/10157)
        <Image img={require('../../img/release_notes/new_tag_usage.png')}/>
    3. 在每日使用者、團隊、標籤資料表中追蹤提示快取指標 - [PR](https://github.com/BerriAI/litellm/pull/10029)
    4. 顯示依金鑰的用量（在所有總覽、團隊與標籤用量儀表板上） - [PR](https://github.com/BerriAI/litellm/pull/10157)
    5. 以新的用量分頁取代舊用量
- **模型**
    1. 讓欄位可調整大小／可隱藏 - [PR](https://github.com/BerriAI/litellm/pull/10119)
- **API Playground**
    1. 允許內部使用者呼叫 api playground - [PR](https://github.com/BerriAI/litellm/pull/10157)
- **SCIM**
    1. 為團隊與使用者管理新增 LiteLLM SCIM 整合 - [開始使用](../../docs/tutorials/scim_litellm)、[PR](https://github.com/BerriAI/litellm/pull/10072)

## 記錄／防護欄整合 {#logging--guardrail-integrations}
- **GCS**
    1. 修正使用環境變數 GCS_PROJECT_ID 的 gcs pub sub 記錄 - [開始使用](../../docs/observability/gcs_bucket_integration#usage)、[PR](https://github.com/BerriAI/litellm/pull/10042)
- **AIM**
    1. 在 pre 與 post-hooks 呼叫中，將 litellm call id 傳遞到 Aim 防護欄 - [開始使用](../../docs/proxy/guardrails/aim_security)、[PR](https://github.com/BerriAI/litellm/pull/10021)
- **Azure Blob 儲存體**
    1. 確保在高吞吐量情境下記錄可正常運作 - [開始使用](../../docs/proxy/logging#azure-blob-storage)、[PR](https://github.com/BerriAI/litellm/pull/9962)

## 一般 Proxy 改善 {#general-proxy-improvements}

- **支援透過環境變數設定 `litellm.modify_params`** [PR](https://github.com/BerriAI/litellm/pull/9964)
- **模型探索** - 在呼叫 proxy 的 `/v1/models` 端點時，檢查提供者的 `/models` 端點 - [開始使用](../../docs/proxy/model_discovery)、[PR](https://github.com/BerriAI/litellm/pull/9958)
- **`/utils/token_counter`** - 修正從 db models 取得自訂 tokenizer - [開始使用](../../docs/proxy/configs#set-custom-tokenizer)、[PR](https://github.com/BerriAI/litellm/pull/10047)
- **Prisma migrate** - 處理 db table 中既有欄位 - [PR](https://github.com/BerriAI/litellm/pull/10138)
