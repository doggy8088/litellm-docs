---
title: "v1.72.0-stable"
slug: "v1-72-0-stable"
date: 2025-05-31T10:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://media.licdn.com/dms/image/v2/D4D03AQGrlsJ3aqpHmQ/profile-displayphoto-shrink_400_400/B4DZSAzgP7HYAg-/0/1737327772964?e=1749686400&v=beta&t=Hkl3U8Ps0VtvNxX0BNNq24b4dtX5wQaPFp6oiKCIHD8
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
docker run
-e STORE_MODEL_IN_DB=True
-p 4000:4000
docker.litellm.ai/berriai/litellm:main-v1.72.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.72.0
```
</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

LiteLLM v1.72.0-stable.rc 現已上線。以下是此版本的主要亮點：

- **Vector Store 權限**：在 Key、Team 與 Organization 層級控管 Vector Store 存取。
- **支援 Rate Limiting Sliding Window**：透過跨分鐘的請求追蹤，提升 Key/Team/User rate limits 的準確度。
- **預設使用 Aiohttp Transport**：Aiohttp transport 現在是 LiteLLM 網路請求的預設 transport。這可讓每個 instance 的 RPS 提升 2 倍，且 median latency 額外增加 40ms。
- **Bedrock Agents**：使用 `/chat/completions`、`/response` endpoints 呼叫 Bedrock Agents。
- **Anthropic File API**：透過 LiteLLM，使用 Claude-4 在 Anthropic 上上傳並分析 CSV 檔案。
- **Prometheus**：預設情況下，end users（`end_user`）將不再被追蹤。現在在 Prometheus 上追蹤 end_users 改為 opt-in。這樣做是為了避免來自 `/metrics` 的回應變得過大。[閱讀更多](../../docs/proxy/prometheus#tracking-end_user-on-prometheus)

---

## Vector Store 權限 {#vector-store-permissions}

此版本新增支援在 LiteLLM 上依 Keys、Teams、Organizations（實體）管理 vector stores 的權限。當請求嘗試查詢 vector store 時，若請求實體缺少適當權限，LiteLLM 會將其阻擋。

這非常適合需要存取受限資料、且不希望所有人都能使用的情境。

接下來一週，我們計劃為 MCP Servers 新增權限管理。

---
## 預設使用 Aiohttp Transport {#aiohttp-transport-used-by-default}

Aiohttp transport 現在是 LiteLLM 網路請求的預設 transport。這可讓每個 instance 的 RPS 提升 2 倍，且 median latency 額外增加 40ms。這已在 LiteLLM Cloud 上上線一週，並經過 alpha users 一週的測試。

如果您遇到任何問題，可以透過以下方式停用 aiohttp transport：

**在 LiteLLM Proxy 上**

在環境變數中設定 `DISABLE_AIOHTTP_TRANSPORT=True`。 

```yaml showLineNumbers title="Environment Variable"
export DISABLE_AIOHTTP_TRANSPORT="True"
```

**在 LiteLLM Python SDK 上**

設定 `disable_aiohttp_transport=True` 以停用 aiohttp transport。 

```python showLineNumbers title="Python SDK"
import litellm

litellm.disable_aiohttp_transport = True # default is False, enable this to disable aiohttp transport
result = litellm.completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello, world!"}],
)
print(result)
```

---

## 新模型 / 更新模型 {#new-models--updated-models}

- **[Bedrock](../../docs/providers/bedrock)**
    - 支援 Bedrock Converse 的影片功能 - [PR](https://github.com/BerriAI/litellm/pull/11166)
    - 將 InvokeAgents 支援作為 /chat/completions 路由 - [PR](https://github.com/BerriAI/litellm/pull/11239), [開始使用](../../docs/providers/bedrock_agents)
    - AI21 Jamba 模型相容性修正 - [PR](https://github.com/BerriAI/litellm/pull/11233)
    - 修正 Claude with thinking 的重複 maxTokens 參數 - [PR](https://github.com/BerriAI/litellm/pull/11181)
- **[Gemini（Google AI Studio + Vertex AI）](https://docs.litellm.ai/docs/providers/gemini)**
    - 使用 `parallel_tool_calls` 參數支援平行工具呼叫 - [PR](https://github.com/BerriAI/litellm/pull/11125)
    - 所有 Gemini 模型現在都支援平行 function calling - [PR](https://github.com/BerriAI/litellm/pull/11225)
- **[VertexAI](../../docs/providers/vertex)**
    - codeExecution 工具支援與 anyOf 處理 - [PR](https://github.com/BerriAI/litellm/pull/11195)
    - Vertex AI Anthropic 支援 /v1/messages - [PR](https://github.com/BerriAI/litellm/pull/11246)
    - Thinking、global regions 與平行工具呼叫改進 - [PR](https://github.com/BerriAI/litellm/pull/11194)
    - Web Search 支援 [PR](https://github.com/BerriAI/litellm/commit/06484f6e5a7a2f4e45c490266782ed28b51b7db6)
- **[Anthropic](../../docs/providers/anthropic)**
    - 支援串流中的 Thinking blocks - [PR](https://github.com/BerriAI/litellm/pull/11194)
    - 在 passthrough 上支援 form-data 的 Files API - [PR](https://github.com/BerriAI/litellm/pull/11256)
    - 支援 /chat/completion 的 File ID - [PR](https://github.com/BerriAI/litellm/pull/11256)
- **[xAI](../../docs/providers/xai)**
    - Web Search 支援 [PR](https://github.com/BerriAI/litellm/commit/06484f6e5a7a2f4e45c490266782ed28b51b7db6)
- **[Google AI Studio](../../docs/providers/gemini)**
    - Web Search 支援 [PR](https://github.com/BerriAI/litellm/commit/06484f6e5a7a2f4e45c490266782ed28b51b7db6)
- **[Mistral](../../docs/providers/mistral)**
    - 更新 mistral-medium 價格與 context sizes - [PR](https://github.com/BerriAI/litellm/pull/10729)
- **[Ollama](../../docs/providers/ollama)**
    - 串流中的工具呼叫解析 - [PR](https://github.com/BerriAI/litellm/pull/11171)
- **[Cohere](../../docs/providers/cohere)**
    - 對調 Cohere 與 Cohere Chat provider 的位置 - [PR](https://github.com/BerriAI/litellm/pull/11173)
- **[Nebius AI Studio](../../docs/providers/nebius)**
    - 新的 provider 整合 - [PR](https://github.com/BerriAI/litellm/pull/11143)

## LLM API 端點 {#llm-api-endpoints}

- **[Image Edits API](../../docs/image_generation)**
    - Azure 支援 /v1/images/edits - [PR](https://github.com/BerriAI/litellm/pull/11160)
    - image edits endpoint 的成本追蹤（OpenAI、Azure）- [PR](https://github.com/BerriAI/litellm/pull/11186)
- **[Completions API](../../docs/completion/chat)**
    - /v1/completions 上的 Codestral latency overhead 追蹤 - [PR](https://github.com/BerriAI/litellm/pull/10879)
- **[Audio Transcriptions API](../../docs/audio/speech)**
    - 無日期的 GPT-4o mini audio preview 定價 - [PR](https://github.com/BerriAI/litellm/pull/11207)
    - 音訊轉錄支援非預設參數 - [PR](https://github.com/BerriAI/litellm/pull/11212)
- **[Responses API](../../docs/response_api)**
    - 使用 Non-OpenAI models 的 session 管理修正 - [PR](https://github.com/BerriAI/litellm/pull/11254)

## 管理端點 / UI {#management-endpoints--ui}

- **向量儲存**
    - LiteLLM Keys、Teams 與 Organizations 的權限管理 - [PR](https://github.com/BerriAI/litellm/pull/11213)
    - Vector store 權限的 UI 顯示 - [PR](https://github.com/BerriAI/litellm/pull/11277)
    - Vector store 存取控制強制執行 - [PR](https://github.com/BerriAI/litellm/pull/11281)
    - Object permissions 修正與 QA 改進 - [PR](https://github.com/BerriAI/litellm/pull/11291)
- **團隊**
    - 未選擇 models 時顯示「All proxy models」- [PR](https://github.com/BerriAI/litellm/pull/11187)
    - 移除多餘的 teamInfo 呼叫，改用既有的 teamsList - [PR](https://github.com/BerriAI/litellm/pull/11051)
    - 改進 Keys、Teams 與 Org 頁面的 model tags 顯示 - [PR](https://github.com/BerriAI/litellm/pull/11022)
- **SSO/SCIM**
    - UI 顯示 SCIM token 的錯誤修正 - [PR](https://github.com/BerriAI/litellm/pull/11220)
- **一般 UI**
    - 修正「UI Session Expired. Logging out」- [PR](https://github.com/BerriAI/litellm/pull/11279)
    - 支援將 /sso/key/generate 轉送至 server root path URL - [PR](https://github.com/BerriAI/litellm/pull/11165)

## Logging / Guardrails 整合 {#logging--guardrails-integrations}

#### 記錄 {#logging}
- **[Prometheus](../../docs/proxy/prometheus)**
    - 預設情況下，end users 將不再在 Prometheus 上被追蹤。現在在 prometheus 上追蹤 end_users 改為 opt-in。 [PR](https://github.com/BerriAI/litellm/pull/11192)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 效能改進：修正「Max langfuse clients reached」問題 - [PR](https://github.com/BerriAI/litellm/pull/11285)
- **[Helicone](../../docs/observability/helicone_integration)**
    - 支援 Base URL - [PR](https://github.com/BerriAI/litellm/pull/11211)
- **[Sentry](../../docs/proxy/logging#sentry)**
    - 新增 sentry sample rate 設定 - [PR](https://github.com/BerriAI/litellm/pull/10283)

#### 防護欄 {#guardrails}
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 支援 bedrock post guard 的串流 - [PR](https://github.com/BerriAI/litellm/pull/11247)
    - Auth 參數持久化修正 - [PR](https://github.com/BerriAI/litellm/pull/11270)
- **[Pangea Guardrails](../../docs/proxy/guardrails/pangea)**
    - 在 Guardrails hook 中新增 Pangea provider - [PR](https://github.com/BerriAI/litellm/pull/10775)

## 效能 / 可靠性改進 {#performance--reliability-improvements}
- **aiohttp Transport**
    - 處理 aiohttp.ClientPayloadError - [PR](https://github.com/BerriAI/litellm/pull/11162)
    - SSL 驗證設定支援 - [PR](https://github.com/BerriAI/litellm/pull/11162)
    - 為了穩定性回退至 httpx==0.27.0 - [PR](https://github.com/BerriAI/litellm/pull/11146)
- **請求限制**
    - 平行請求限制器 v2 的 sliding window 邏輯 - [PR](https://github.com/BerriAI/litellm/pull/11283)

## 錯誤修正 {#bug-fixes}

- **LLM API 修正**
    - 在 get_available_deployment 呼叫中新增缺少的 request_kwargs - [PR](https://github.com/BerriAI/litellm/pull/11202)
    - 修正呼叫 Azure O-series models - [PR](https://github.com/BerriAI/litellm/pull/11212)
    - 支援透過 additional_drop_params 捨棄非 OpenAI 參數 - [PR](https://github.com/BerriAI/litellm/pull/11246)
    - 修正 frequency_penalty 到 repeat_penalty 參數對應 - [PR](https://github.com/BerriAI/litellm/pull/11284)
    - 修正字串輸入的 embedding 快取命中 - [PR](https://github.com/BerriAI/litellm/pull/11211)
- **一般**
    - OIDC 提供者改善與 audience 錯誤修正 - [PR](https://github.com/BerriAI/litellm/pull/10054)
    - 移除 AZURE_CREDENTIAL 上的 AzureCredentialType 限制 - [PR](https://github.com/BerriAI/litellm/pull/11272)
    - 防止敏感金鑰外洩至 Langfuse - [PR](https://github.com/BerriAI/litellm/pull/11165)
    - 修正 healthcheck 測試在 curl 未包含於映像檔時仍使用 curl 的問題 - [PR](https://github.com/BerriAI/litellm/pull/9737)

## 新貢獻者 {#new-contributors}
* [@agajdosi](https://github.com/agajdosi) 在 [#9737](https://github.com/BerriAI/litellm/pull/9737) 完成首次貢獻
* [@ketangangal](https://github.com/ketangangal) 在 [#11161](https://github.com/BerriAI/litellm/pull/11161) 完成首次貢獻
* [@Aktsvigun](https://github.com/Aktsvigun) 在 [#11143](https://github.com/BerriAI/litellm/pull/11143) 完成首次貢獻
* [@ryanmeans](https://github.com/ryanmeans) 在 [#10775](https://github.com/BerriAI/litellm/pull/10775) 完成首次貢獻
* [@nikoizs](https://github.com/nikoizs) 在 [#10054](https://github.com/BerriAI/litellm/pull/10054) 完成首次貢獻
* [@Nitro963](https://github.com/Nitro963) 在 [#11202](https://github.com/BerriAI/litellm/pull/11202) 完成首次貢獻
* [@Jacobh2](https://github.com/Jacobh2) 在 [#11207](https://github.com/BerriAI/litellm/pull/11207) 完成首次貢獻
* [@regismesquita](https://github.com/regismesquita) 在 [#10729](https://github.com/BerriAI/litellm/pull/10729) 完成首次貢獻
* [@Vinnie-Singleton-NN](https://github.com/Vinnie-Singleton-NN) 在 [#10283](https://github.com/BerriAI/litellm/pull/10283) 完成首次貢獻
* [@trashhalo](https://github.com/trashhalo) 在 [#11219](https://github.com/BerriAI/litellm/pull/11219) 完成首次貢獻
* [@VigneshwarRajasekaran](https://github.com/VigneshwarRajasekaran) 在 [#11223](https://github.com/BerriAI/litellm/pull/11223) 完成首次貢獻
* [@AnilAren](https://github.com/AnilAren) 在 [#11233](https://github.com/BerriAI/litellm/pull/11233) 完成首次貢獻
* [@fadil4u](https://github.com/fadil4u) 在 [#11242](https://github.com/BerriAI/litellm/pull/11242) 完成首次貢獻
* [@whitfin](https://github.com/whitfin) 在 [#11279](https://github.com/BerriAI/litellm/pull/11279) 完成首次貢獻
* [@hcoona](https://github.com/hcoona) 在 [#11272](https://github.com/BerriAI/litellm/pull/11272) 完成首次貢獻
* [@keyute](https://github.com/keyute) 在 [#11173](https://github.com/BerriAI/litellm/pull/11173) 完成首次貢獻
* [@emmanuel-ferdman](https://github.com/emmanuel-ferdman) 在 [#11230](https://github.com/BerriAI/litellm/pull/11230) 完成首次貢獻

## 示範執行個體 {#demo-instance}

這裡有一個可用來測試變更的示範執行個體：

- 執行個體：https://demo.litellm.ai/
- 登入憑證：
    - 使用者名稱：admin
    - 密碼：sk-1234

## [Git Diff](https://github.com/BerriAI/litellm/releases) {#git-diffhttpsgithubcomberriailitellmreleases}
