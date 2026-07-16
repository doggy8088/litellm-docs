---
title: v1.68.0-stable
slug: v1.68.0-stable
date: 2025-05-03T10:00:00
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
docker.litellm.ai/berriai/litellm:main-v1.68.0-stable
```
</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.68.0.post1
```
</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

LiteLLM v1.68.0-stable 即將上線。以下是此版本的重點摘要：

- **Bedrock Knowledge Base**：現在您可以透過 `/chat/completion` 或 `/responses` API，使用所有 LiteLLM 模型查詢您的 Bedrock Knowledge Base。
- **速率限制**：此版本帶來跨多個執行個體的精確速率限制，在高流量下將溢出請求降至最多 10 個額外請求。
- **Meta Llama API**：新增對 Meta Llama API 的支援 [開始使用](https://docs.litellm.ai/docs/providers/meta_llama)
- **LlamaFile**：新增對 LlamaFile 的支援 [開始使用](https://docs.litellm.ai/docs/providers/llamafile)

## Bedrock Knowledge Base（向量儲存） {#bedrock-knowledge-base-vector-store}

<Image img={require('../../img/release_notes/bedrock_kb.png')}/>
<br/>

此版本新增 LiteLLM 對 Bedrock 向量儲存（知識庫）的支援。透過此更新，您可以：

- 在 OpenAI /chat/completions 規格中，搭配所有 LiteLLM 支援的模型使用 Bedrock 向量儲存。
- 透過 LiteLLM UI 或 API 檢視所有可用的向量儲存。
- 將向量儲存設定為特定模型永遠啟用。
- 在 LiteLLM Logs 中追蹤向量儲存使用情況。

下一個版本中，我們規劃讓您可以為向量儲存設定 key、user、team、org 權限。

[在此閱讀更多](https://docs.litellm.ai/docs/completion/knowledgebase)

## 速率限制 {#rate-limiting}

<Image img={require('../../img/multi_instance_rate_limiting.png')}/>
<br/>

此版本帶來跨 key/user/team 的精確多執行個體速率限制。以下概述主要工程變更：

- **變更**：執行個體現在會遞增快取值，而不是直接設定它。為了避免每次請求都呼叫 Redis，這會每 0.01 秒同步一次。
- **準確性**：在測試中，我們在高流量（100 RPS，3 個執行個體）下看到的最大超出預期為 10 個請求，而目前則為 189 個請求的溢出
- **效能**：我們的負載測試顯示，在高流量下可將中位數回應時間降低 100ms

目前此功能受功能旗標控制，我們計劃在下週將其設為預設值。若要今天啟用，請加入以下環境變數：

```
export LITELLM_RATE_LIMIT_ACCURACY=true
```

[在此閱讀更多](../../docs/proxy/users#beta-multi-instance-rate-limiting) 

## 新模型 / 更新模型 {#new-models--updated-models}
- **Gemini ([VertexAI](https://docs.litellm.ai/docs/providers/vertex#usage-with-litellm-proxy-server) + [Google AI Studio](https://docs.litellm.ai/docs/providers/gemini))**
    - 處理更多 json schema - openapi schema 轉換邊界情況 [PR](https://github.com/BerriAI/litellm/pull/10351)
    - 工具呼叫 - 在 gemini 工具呼叫回應中回傳 ‘finish_reason=“tool_calls”’ [PR](https://github.com/BerriAI/litellm/pull/10485)
- **[VertexAI](../../docs/providers/vertex#metallama-api)**
    - Meta/llama-4 模型支援 [PR](https://github.com/BerriAI/litellm/pull/10492)
    - Meta/llama3 - 在 content 中處理工具呼叫結果 [PR](https://github.com/BerriAI/litellm/pull/10492)
    - Meta/* - 在工具呼叫回應中回傳 ‘finish_reason=“tool_calls”’ [PR](https://github.com/BerriAI/litellm/pull/10492)
- **[Bedrock](../../docs/providers/bedrock#litellm-proxy-usage)**
    - [圖片生成](../../docs/providers/bedrock#image-generation) - 支援新的 ‘stable-image-core’ 模型 - [PR](https://github.com/BerriAI/litellm/pull/10351)
    - [Knowledge Bases](../../docs/completion/knowledgebase) - 支援將 Bedrock knowledge bases 與 `/chat/completions` 搭配使用 [PR](https://github.com/BerriAI/litellm/pull/10413)
    - [Anthropic](../../docs/providers/bedrock#litellm-proxy-usage) - 為 claude-3.7-bedrock 模型新增 ‘supports_pdf_input’ [PR](https://github.com/BerriAI/litellm/pull/9917), [開始使用](../../docs/completion/document_understanding#checking-if-a-model-supports-pdf-input)
- **[OpenAI](../../docs/providers/openai)**
    - 除了 OPENAI_API_BASE 之外，也支援 OPENAI_BASE_URL [PR](https://github.com/BerriAI/litellm/pull/10423)
    - 正確重新拋出 504 逾時錯誤 [PR](https://github.com/BerriAI/litellm/pull/10462)
    - 原生 Gpt-4o-mini-tts 支援 [PR](https://github.com/BerriAI/litellm/pull/10462)
- 🆕 **[Meta Llama API](../../docs/providers/meta_llama)** 提供者 [PR](https://github.com/BerriAI/litellm/pull/10451)
- 🆕 **[LlamaFile](../../docs/providers/llamafile)** 提供者 [PR](https://github.com/BerriAI/litellm/pull/10482)

## LLM API 端點 {#llm-api-endpoints}
- **[回應 API](../../docs/response_api)** 
    - 修正處理多輪對話 session 的問題 [PR](https://github.com/BerriAI/litellm/pull/10415)
- **[嵌入向量](../../docs/embedding/supported_embedding)**
    - 快取修正 - [PR](https://github.com/BerriAI/litellm/pull/10424)
        - 處理 str -> list 快取
        - 在快取命中時回傳使用量 token
        - 在部分快取命中時合併使用量 token 
- 🆕 **[Vector Stores](../../docs/completion/knowledgebase)**
    - 允許定義 Vector Store 設定 - [PR](https://github.com/BerriAI/litellm/pull/10448)
    - 當使用向量儲存時，為請求新增新的 StandardLoggingPayload 欄位 - [PR](https://github.com/BerriAI/litellm/pull/10509)
    - 在 LiteLLM Logs 頁面顯示向量儲存 / KB 請求 - [PR](https://github.com/BerriAI/litellm/pull/10514)
    - 允許在 OpenAI API 規格中搭配 tools 使用向量儲存 - [PR](https://github.com/BerriAI/litellm/pull/10516)
- **[MCP](../../docs/mcp)**
    - 確保非管理員 virtual keys 可存取 /mcp 路由 - [PR](https://github.com/BerriAI/litellm/pull/10473)
      
      **注意：** 目前所有 Virtual Keys 都能存取 MCP 端點。我們正在開發一項功能，讓您可以依 key/team/user/org 限制 MCP 存取。請追蹤 [這裡](https://github.com/BerriAI/litellm/discussions/9891) 以取得更新。
- **審核**
    - 新增對 `/moderations` API 的 logging callback 支援 - [PR](https://github.com/BerriAI/litellm/pull/10390)

## 支出追蹤 / 預算改進 {#spend-tracking--budget-improvements}
- **[OpenAI](../../docs/providers/openai)**
    - [computer-use-preview](../../docs/providers/openai/responses_api#computer-use) 成本追蹤 / 定價 [PR](https://github.com/BerriAI/litellm/pull/10422)
    - [gpt-4o-mini-tts](../../docs/providers/openai/text_to_speech) 輸入成本追蹤 - [PR](https://github.com/BerriAI/litellm/pull/10462)
- **[Fireworks AI](../../docs/providers/fireworks_ai)** - 定價更新 - 新的 `0-4b` 模型定價級距 + llama4 模型定價
- **[預算](../../docs/proxy/users#set-budgets)**
    - [預算重設](../../docs/proxy/users#reset-budgets) 現在會在日／週／月開始時發生 - [PR](https://github.com/BerriAI/litellm/pull/10333)
    - 在 Key 超過門檻時觸發 [Soft Budget Alerts](../../docs/proxy/alerting#soft-budget-alerts-for-virtual-keys) - [PR](https://github.com/BerriAI/litellm/pull/10491)
- **[Token 計數](../../docs/completion/token_usage#3-token_counter)**
    - 重寫 token_counter() 函式以防止 token 計數不足 - [PR](https://github.com/BerriAI/litellm/pull/10409)

## 管理端點 / UI {#management-endpoints--ui}
- **虛擬金鑰**
    - 修正 key alias 的篩選 - [PR](https://github.com/BerriAI/litellm/pull/10455)
    - 支援對 keys 的全域篩選 - [PR](https://github.com/BerriAI/litellm/pull/10455)
    - 分頁 - 修正點擊表格上的上一頁／下一頁按鈕 - [PR](https://github.com/BerriAI/litellm/pull/10528)
- **模型**
    - Triton - 支援在 UI 上新增 model/provider - [PR](https://github.com/BerriAI/litellm/pull/10456)
    - VertexAI - 修正使用可重複使用憑證新增 vertex models - [PR](https://github.com/BerriAI/litellm/pull/10528)
    - LLM Credentials - 顯示現有憑證以便輕鬆編輯 - [PR](https://github.com/BerriAI/litellm/pull/10519)
- **團隊**
    - 允許將 team 重新指派給其他 org - [PR](https://github.com/BerriAI/litellm/pull/10527)
- **組織**
    - 修正表格上顯示 org 預算 - [PR](https://github.com/BerriAI/litellm/pull/10528)

## Logging / 防護欄整合 {#logging--guardrail-integrations}
- **[Langsmith](../../docs/observability/langsmith_integration)**
    - 遵守 [langsmith_batch_size](../../docs/observability/langsmith_integration#local-testing---control-batch-size) 參數 - [PR](https://github.com/BerriAI/litellm/pull/10411)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}
- **[Redis](../../docs/proxy/caching)**
    - 確保所有 redis 佇列都會定期清空，這修正了在使用請求標籤時 redis 佇列大小會無限成長的問題 - [PR](https://github.com/BerriAI/litellm/pull/10393)
- **[速率限制](../../docs/proxy/users#set-rate-limit)**
    - [多執行個體速率限制](../../docs/proxy/users#beta-multi-instance-rate-limiting) 支援跨 keys/teams/users/customers - [PR](https://github.com/BerriAI/litellm/pull/10458), [PR](https://github.com/BerriAI/litellm/pull/10497), [PR](https://github.com/BerriAI/litellm/pull/10500)
- **[Azure OpenAI OIDC](../../docs/providers/azure#entra-id---use-azure_ad_token)**
    - 允許在 [OIDC Auth](../../docs/providers/azure#entra-id---use-azure_ad_token) 中使用 litellm 定義的參數 - [PR](https://github.com/BerriAI/litellm/pull/10394)

## 一般 Proxy 改善 {#general-proxy-improvements}
- **安全性**
    - 允許[封鎖網路爬蟲](../../docs/proxy/enterprise#blocking-web-crawlers) - [PR](https://github.com/BerriAI/litellm/pull/10420)
- **驗證**
    - 預設支援 [`x-litellm-api-key` 標頭參數](../../docs/pass_through/vertex_ai#use-with-virtual-keys)，這修正了前一個版本中的問題，也就是在 vertex ai passthrough 請求上沒有使用 `x-litellm-api-key` - [PR](https://github.com/BerriAI/litellm/pull/10392)
    - 允許達到最大預算的 key 呼叫非 llm API 端點 - [PR](https://github.com/BerriAI/litellm/pull/10392)
- 🆕 **[Python 用戶端程式庫](../../docs/proxy/management_cli) 用於 LiteLLM Proxy 管理端點**
    - 初始 PR - [PR](https://github.com/BerriAI/litellm/pull/10445)
    - 支援執行 HTTP 請求 - [PR](https://github.com/BerriAI/litellm/pull/10452)
- **相依性**
    - 在 Windows 不再需要 uvloop - [PR](https://github.com/BerriAI/litellm/pull/10483)
