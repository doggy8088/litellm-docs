---
title: "v1.80.15-stable - Manus API 支援"
slug: "v1-80-15"
date: 2026-01-10T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.80.15-stable.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.15
```

</TabItem>
</Tabs>

---

## 重點亮點 {#key-highlights}

- **Manus API 支援** - [為 /responses 和 GET /responses 端點新增 Manus API 的提供者支援](../../docs/providers/manus)
- **MiniMax 提供者** - [完整支援 MiniMax chat completions、TTS，以及 Anthropic 原生端點](../../docs/providers/minimax)
- **AWS Polly TTS** - [使用 AWS Polly API 的新 TTS 提供者](../../docs/providers/aws_polly)
- **SSO 角色對應** - 直接在 UI 中為 SSO 提供者設定角色對應
- **成本估算器** - 用於估算多個模型與請求成本的新 UI 工具
- **MCP 全域模式** - [全域設定 MCP 伺服器並具備可見性控制](../../docs/mcp)
- **Interactions API 橋接** - [使用 Interactions API 搭配所有 LiteLLM 提供者](../../docs/interactions)
- **RAG 查詢端點** - [用於檢索增強生成的新 RAG Search/Query 端點](../../docs/search/index)
- **UI 使用量 - 端點活動** - [使用者現在可在 UI 中看到端點活動指標](../../docs/proxy/endpoint_activity)
- **50% 額外負擔降低** - LiteLLM 現在向 LLM 提供者發送的請求量增加 2.5 倍

---

## 效能 - 50% 額外負擔降低 {#performance---50-overhead-reduction}

LiteLLM 現在透過以 O(1) 字典查找取代依序的 if/elif 鏈來解析提供者設定，使其向 LLM 提供者發送 2.5 倍更多請求（快 92.7%）。這項最佳化影響很大，因為它會在 client decorator 內執行，而該 decorator 會在送往 proxy server 的每個 HTTP request 上被呼叫。

### 之前 {#before}

> **注意：** 這裡看起來較差的提供者指標其實是好事——表示請求在 LiteLLM 內停留的時間更少。

```
============================================================
Fake LLM Provider Stats (When called by LiteLLM)
============================================================
Total Time:            0.56s
Requests/Second:       10746.68

Latency Statistics (seconds):
   Mean:               0.2039s
   Median (p50):       0.2310s
   Min:                0.0323s
   Max:                0.3928s
   Std Dev:            0.1166s
   p95:                0.3574s
   p99:                0.3748s

Status Codes:
   200: 6000
```

### 之後 {#after}

```
============================================================
Fake LLM Provider Stats (When called by LiteLLM)
============================================================
Total Time:            1.42s
Requests/Second:       4224.49

Latency Statistics (seconds):
   Mean:               0.5300s
   Median (p50):       0.5871s
   Min:                0.0885s
   Max:                1.0482s
   Std Dev:            0.3065s
   p95:                0.9750s
   p99:                1.0444s

Status Codes:
   200: 6000
```

> 這些基準測試會在本機使用輕量級 LLM 提供者執行 LiteLLM，以消除網路延遲，隔離內部額外負擔與瓶頸，讓我們能專注於在單一執行個體上降低純粹的 LiteLLM 額外負擔。

---

### UI 使用量 - 端點活動 {#ui-usage---endpoint-activity}

<Image
img={require('../../img/ui_endpoint_activity.png')}
style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

使用者現在可在 UI 中看到端點活動指標。

---

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（11 個新提供者） {#new-providers-11-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | ------------------- | ----------- |
| [Manus](../../docs/providers/manus) | `/responses` | 用於 agentic workflows 的 Manus API |
| [Manus](../../docs/providers/manus) | `GET /responses` | 用於擷取回應的 Manus API |
| [Manus](../../docs/providers/manus) | `/files` | 用於檔案管理的 Manus API |
| [MiniMax](../../docs/providers/minimax) | `/chat/completions` | MiniMax chat completions |
| [MiniMax](../../docs/providers/minimax) | `/audio/speech` | MiniMax text-to-speech |
| [AWS Polly](../../docs/providers/aws_polly) | `/audio/speech` | AWS Polly text-to-speech API |
| [GigaChat](../../docs/providers/gigachat) | `/chat/completions` | 適用於俄文 AI 的 GigaChat 提供者 |
| [LlamaGate](../../docs/providers/llamagate) | `/chat/completions` | LlamaGate chat completions |
| [LlamaGate](../../docs/providers/llamagate) | `/embeddings` | LlamaGate embeddings |
| [Abliteration AI](../../docs/providers/abliteration) | `/chat/completions` | Abliteration.ai 提供者支援 |
| [Bedrock](../../docs/providers/bedrock) | `/v1/messages/count_tokens` | 作為 token 計數新提供者的 Bedrock |

### 新的 LLM API 端點（3 個新端點） {#new-llm-api-endpoints-3-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| -------- | ------ | ----------- | ------------- |
| `/responses/compact` | POST | 精簡回應 API 端點 | [文件](../../docs/response_api) |
| `/rag/query` | POST | RAG Search/Query 端點 | [文件](../../docs/search/index) |
| `/containers/{id}/files` | POST | 將檔案上傳至容器 | [文件](../../docs/container_files) |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（100+ 個新模型） {#new-model-support-100-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| Azure | `azure/gpt-5.2` | 400K | $1.75 | $14.00 | Reasoning、vision、cache |
| Azure | `azure/gpt-5.2-chat` | 128K | $1.75 | $14.00 | Reasoning、vision |
| Azure | `azure/gpt-5.2-pro` | 400K | $21.00 | $168.00 | Reasoning、vision、web search |
| Azure | `azure/gpt-image-1.5` | - | 以 token 為基準 | 以 token 為基準 | 圖像生成/編輯 |
| Azure AI | `azure_ai/gpt-oss-120b` | 131K | $0.15 | $0.60 | 函式呼叫 |
| Azure AI | `azure_ai/flux.2-pro` | - | - | $0.04/圖像 | 圖像生成 |
| Azure AI | `azure_ai/deepseek-v3.2` | 164K | $0.58 | $1.68 | Reasoning、函式呼叫 |
| Bedrock | `amazon.nova-2-multimodal-embeddings-v1:0` | 8K | $0.135 | - | 多模態 embeddings |
| Bedrock | `writer.palmyra-x4-v1:0` | 128K | $2.50 | $10.00 | 函式呼叫、PDF |
| Bedrock | `writer.palmyra-x5-v1:0` | 1M | $0.60 | $6.00 | 函式呼叫、PDF |
| Bedrock | `moonshot.kimi-k2-v1:0` | - | - | - | Kimi K2 model |
| Cerebras | `cerebras/zai-glm-4.6` | 128K | $2.25 | $2.75 | Reasoning、函式呼叫 |
| GigaChat | `gigachat/GigaChat-2-Lite` | - | - | - | 聊天回應生成 |
| GigaChat | `gigachat/GigaChat-2-Max` | - | - | - | 聊天回應生成 |
| GigaChat | `gigachat/GigaChat-2-Pro` | - | - | - | 聊天回應生成 |
| Gemini | `gemini/veo-3.1-generate-001` | - | - | - | 影片生成 |
| Gemini | `gemini/veo-3.1-fast-generate-001` | - | - | - | 影片生成 |
| GitHub Copilot | 25+ models | 多種 | - | - | 聊天回應生成 |
| LlamaGate | 15+ models | 多種 | - | - | 聊天、vision、embeddings |
| MiniMax | `minimax/abab7-chat-preview` | - | - | - | 聊天回應生成 |
| Novita | 80+ models | 多種 | 多種 | 多種 | 聊天、vision、embeddings |
| OpenRouter | `openrouter/google/gemini-3-flash-preview` | - | - | - | 聊天回應生成 |
| Together AI | Multiple models | 多種 | 多種 | 多種 | 支援 response schema |
| Vertex AI | `vertex_ai/zai-glm-4.7` | - | - | - | 支援 GLM 4.7 |

#### 功能 {#features}

- **[Gemini](../../docs/providers/gemini)**
    - 在聊天完成中新增 image tokens - [PR #18327](https://github.com/BerriAI/litellm/pull/18327)
    - 在影像生成中新增 usage 物件 - [PR #18328](https://github.com/BerriAI/litellm/pull/18328)
    - 透過 tool call id 新增 thought signature 支援 - [PR #18574](https://github.com/BerriAI/litellm/pull/18374)
    - 為非 tool call 請求新增 thought signature - [PR #18581](https://github.com/BerriAI/litellm/pull/18581)
    - 保留系統指示 - [PR #18585](https://github.com/BerriAI/litellm/pull/18585)
    - 修正工具回應中的 Gemini 3 影像 - [PR #18190](https://github.com/BerriAI/litellm/pull/18190)
    - 支援 google_search 工具參數使用 snake_case - [PR #18451](https://github.com/BerriAI/litellm/pull/18451)
    - Google GenAI adapter inline data 支援 - [PR #18477](https://github.com/BerriAI/litellm/pull/18477)
    - 為已停用的 Google 模型新增 deprecation_date - [PR #18550](https://github.com/BerriAI/litellm/pull/18550)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增集中式 get_vertex_base_url() 輔助函式，以支援全域位置 - [PR #18410](https://github.com/BerriAI/litellm/pull/18410)
    - 將影像 URL 轉換為 Vertex AI Anthropic 的 base64 - [PR #18497](https://github.com/BerriAI/litellm/pull/18497)
    - 依 API 規格為每種工具類型分別建立 Tool 物件 - [PR #18514](https://github.com/BerriAI/litellm/pull/18514)
    - 在 VertexGeminiConfig 新增 thought_signatures - [PR #18853](https://github.com/BerriAI/litellm/pull/18853)
    - 新增對 Vertex AI API 金鑰的支援 - [PR #18806](https://github.com/BerriAI/litellm/pull/18806)
    - 新增 zai glm-4.7 模型支援 - [PR #18782](https://github.com/BerriAI/litellm/pull/18782)
- **[Azure](../../docs/providers/azure/azure)**
    - 將 Azure gpt-image-1.5 定價新增至成本對照表 - [PR #18347](https://github.com/BerriAI/litellm/pull/18347)
    - 新增 azure/gpt-5.2-chat 模型 - [PR #18361](https://github.com/BerriAI/litellm/pull/18361)
    - 新增透過 Azure AD token 進行影像生成的支援 - [PR #18413](https://github.com/BerriAI/litellm/pull/18413)
    - 新增 Azure OpenAI GPT-5.2 模型的 logprobs 支援 - [PR #18856](https://github.com/BerriAI/litellm/pull/18856)
    - 新增 Azure BFL Flux 2 模型，用於影像生成與編輯 - [PR #18764](https://github.com/BerriAI/litellm/pull/18764), [PR #18766](https://github.com/BerriAI/litellm/pull/18766)
- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 Bedrock Kimi K2 模型支援 - [PR #18797](https://github.com/BerriAI/litellm/pull/18797)
    - 在 bedrock passthrough 中新增對 model id 的支援 - [PR #18800](https://github.com/BerriAI/litellm/pull/18800)
    - 修正 Bedrock 提供者的 Nova 模型偵測 - [PR #18250](https://github.com/BerriAI/litellm/pull/18250)
    - 在從 OpenAI 格式轉換時，確保 toolUse.input 一律為 dict - [PR #18414](https://github.com/BerriAI/litellm/pull/18414)
- **[Databricks](../../docs/providers/databricks)**
    - 新增強化的驗證、安全功能，以及自訂 user-agent 支援 - [PR #18349](https://github.com/BerriAI/litellm/pull/18349)
- **[MiniMax](../../docs/providers/minimax)**
    - 新增 MiniMax 聊天完成支援 - [PR #18380](https://github.com/BerriAI/litellm/pull/18380)
    - 新增 MiniMax 的 Anthropic 原生端點支援 - [PR #18377](https://github.com/BerriAI/litellm/pull/18377)
    - 新增 MiniMax TTS 支援 - [PR #18334](https://github.com/BerriAI/litellm/pull/18334)
    - 在 UI 儀表板新增 MiniMax 提供者支援 - [PR #18496](https://github.com/BerriAI/litellm/pull/18496)
- **[Together AI](../../docs/providers/togetherai)**
    - 將 supports_response_schema 新增至所有支援的 Together AI 模型 - [PR #18368](https://github.com/BerriAI/litellm/pull/18368)
- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 OpenRouter embeddings API 支援 - [PR #18391](https://github.com/BerriAI/litellm/pull/18391)
- **[Anthropic](../../docs/providers/anthropic)**
    - 傳遞 server_tool_use 與 tool_search_tool_result 區塊 - [PR #18770](https://github.com/BerriAI/litellm/pull/18770)
    - 為影像工具呼叫結果新增 Anthropic 快取控制選項 - [PR #18674](https://github.com/BerriAI/litellm/pull/18674)
- **[Ollama](../../docs/providers/ollama)**
    - 為 ollama embedding 新增 dimensions - [PR #18536](https://github.com/BerriAI/litellm/pull/18536)
    - 從 Ollama 的 data URLs 擷取純 base64 資料 - [PR #18465](https://github.com/BerriAI/litellm/pull/18465)
- **[Watsonx](../../docs/providers/watsonx/index)**
    - 新增 Watsonx fields 支援 - [PR #18569](https://github.com/BerriAI/litellm/pull/18569)
    - 修正 Watsonx Audio Transcription - filter model field - [PR #18810](https://github.com/BerriAI/litellm/pull/18810)
- **[SAP](../../docs/providers/sap)**
    - 在 proxy UI 中為 list 新增 SAP creds - [PR #18375](https://github.com/BerriAI/litellm/pull/18375)
    - 傳遞 allowed_openai_params 中的額外參數 - [PR #18432](https://github.com/BerriAI/litellm/pull/18432)
    - 為 SAP AI Core Tracking 新增 client header - [PR #18714](https://github.com/BerriAI/litellm/pull/18714)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 修正 deepseek-v3p2 定價 - [PR #18483](https://github.com/BerriAI/litellm/pull/18483)
- **[ZAI](../../docs/providers/zai)**
    - 新增具推理支援的 GLM-4.7 模型 - [PR #18476](https://github.com/BerriAI/litellm/pull/18476)
- **[Codestral](../../docs/providers/codestral)**
    - 正確路由 codestral chat 與 FIM 端點 - [PR #18467](https://github.com/BerriAI/litellm/pull/18467)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 修正透過 azure_ai 存取 messages API 時的驗證錯誤 - [PR #18500](https://github.com/BerriAI/litellm/pull/18500)

#### 新的提供者支援 {#new-provider-support}

- **[AWS Polly](../../docs/providers/aws_polly)** - 新增 AWS Polly 的 TTS API - [PR #18326](https://github.com/BerriAI/litellm/pull/18326)
- **[GigaChat](../../docs/providers/gigachat)** - 新增 GigaChat 提供者支援 - [PR #18564](https://github.com/BerriAI/litellm/pull/18564)
- **[LlamaGate](../../docs/providers/llamagate)** - 將 LlamaGate 新增為新的提供者 - [PR #18673](https://github.com/BerriAI/litellm/pull/18673)
- **[Abliteration AI](../../docs/providers/abliteration)** - 新增 abliteration.ai 提供者 - [PR #18678](https://github.com/BerriAI/litellm/pull/18678)
- **[Manus](../../docs/providers/manus)** - 在 /responses、GET /responses 上新增 Manus API 支援 - [PR #18804](https://github.com/BerriAI/litellm/pull/18804)
- **5 AI Providers via openai_like** - 使用 openai_like 新增 5 個 AI 提供者 - [PR #18362](https://github.com/BerriAI/litellm/pull/18362)

### 錯誤修正 {#bug-fixes}

- **[Gemini](../../docs/providers/gemini)**
    - 正確攔截超出 context window 的錯誤 - [PR #18283](https://github.com/BerriAI/litellm/pull/18283)
    - 移除 prompt caching 標頭，因為支援已移除 - [PR #18579](https://github.com/BerriAI/litellm/pull/18579)
    - 修正含音訊檔案 id 的 generate content 請求 - [PR #18745](https://github.com/BerriAI/litellm/pull/18745)
    - 修正 google_genai streaming adapter 的提供者處理 - [PR #18845](https://github.com/BerriAI/litellm/pull/18845)
- **[Groq](../../docs/providers/groq)**
    - 移除已棄用的 Groq 模型並更新模型登錄 - [PR #18062](https://github.com/BerriAI/litellm/pull/18062)
- **[Vertex AI](../../docs/providers/vertex)**
    - 處理 Vertex AI count tokens 端點不支援的區域 - [PR #18665](https://github.com/BerriAI/litellm/pull/18665)
- **一般**
    - 修正影像 embedding 請求的 request body - [PR #18336](https://github.com/BerriAI/litellm/pull/18336)
    - 修正在串流同時包含文字與 tool_calls 時遺失 tool_calls 的問題 - [PR #18316](https://github.com/BerriAI/litellm/pull/18316)
    - 為 gpt-image-1.5 新增 all resolution - [PR #18586](https://github.com/BerriAI/litellm/pull/18586)
    - 修正使用 token-based pricing 計算 gpt-image-1 成本 - [PR #17906](https://github.com/BerriAI/litellm/pull/17906)
    - 修正 response_format 滲漏至 extra_body - [PR #18859](https://github.com/BerriAI/litellm/pull/18859)
    - 將 max_tokens 與 max_output_tokens 對齊以保持一致性 - [PR #18820](https://github.com/BerriAI/litellm/pull/18820)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增精簡端點 (v1/responses/compact) - [PR #18697](https://github.com/BerriAI/litellm/pull/18697)
    - 支援更多串流回呼 hooks - [PR #18513](https://github.com/BerriAI/litellm/pull/18513)
    - 新增 reasoning effort 到 summary 參數的對應 - [PR #18635](https://github.com/BerriAI/litellm/pull/18635)
    - 在 ResponsesAPIResponse 新增 output_text 屬性 - [PR #18491](https://github.com/BerriAI/litellm/pull/18491)
    - 在 completions responses API bridge 新增 annotations - [PR #18754](https://github.com/BerriAI/litellm/pull/18754)
- **[Interactions API](../../docs/interactions)**
    - 允許使用所有 LiteLLM 提供者（interactions -> responses API bridge）- [PR #18373](https://github.com/BerriAI/litellm/pull/18373)
- **[RAG Search API](../../docs/search/index)**
    - 新增 RAG Search/Query 端點 - [PR #18376](https://github.com/BerriAI/litellm/pull/18376)
- **[CountTokens API](../../docs/anthropic_count_tokens)**
    - 將 Bedrock 新增為 `/v1/messages/count_tokens` 的新提供者 - [PR #18858](https://github.com/BerriAI/litellm/pull/18858)
- **[Generate Content](../../docs/providers/gemini)**
    - 在 LLM 路由中新增 generate content - [PR #18405](https://github.com/BerriAI/litellm/pull/18405)
- **一般**
    - 啟用 async_post_call_failure_hook 以轉換錯誤回應 - [PR #18348](https://github.com/BerriAI/litellm/pull/18348)
    - 若 total_tokens 缺少但可計算，則手動計算 - [PR #18445](https://github.com/BerriAI/litellm/pull/18445)
    - 當透過 UI 傳入時，將自訂 llm provider 新增至 get_llm_provider - [PR #18638](https://github.com/BerriAI/litellm/pull/18638)

#### 錯誤 {#bugs}

- **一般**
    - 處理回應轉換中的空錯誤物件 - [PR #18493](https://github.com/BerriAI/litellm/pull/18493)
    - 在串流模式中保留用戶端錯誤狀態碼 - [PR #18698](https://github.com/BerriAI/litellm/pull/18698)
    - 初始串流錯誤時回傳 json 錯誤回應，而非 SSE 格式 - [PR #18757](https://github.com/BerriAI/litellm/pull/18757)
    - 修正 generateContent 請求中自訂 api base 的驗證標頭 - [PR #18637](https://github.com/BerriAI/litellm/pull/18637)
    - Tool 內容對 Deepinfra 應為字串 - [PR #18739](https://github.com/BerriAI/litellm/pull/18739)
    - 修正傳入的回應物件中不完整的用量資訊 - [PR #18799](https://github.com/BerriAI/litellm/pull/18799)
    - 將模型名稱統一為提供者定義的名稱 - [PR #18573](https://github.com/BerriAI/litellm/pull/18573)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **SSO 組態**
    - 新增 SSO 角色對應功能 - [PR #18090](https://github.com/BerriAI/litellm/pull/18090)
    - 新增 SSO 設定頁面 - [PR #18600](https://github.com/BerriAI/litellm/pull/18600)
    - 允許新增 SSO 的角色對應 - [PR #18593](https://github.com/BerriAI/litellm/pull/18593)
    - SSO 設定頁面新增角色對應 - [PR #18677](https://github.com/BerriAI/litellm/pull/18677)
    - SSO 設定載入狀態 + 淘汰舊版 SSO 流程 - [PR #18617](https://github.com/BerriAI/litellm/pull/18617)
- **虛擬金鑰**
    - 允許刪除金鑰到期時間 - [PR #18278](https://github.com/BerriAI/litellm/pull/18278)
    - 為 /key/list 新增可選查詢參數 "expand" - [PR #18502](https://github.com/BerriAI/litellm/pull/18502)
    - 金鑰表格載入骨架 - [PR #18527](https://github.com/BerriAI/litellm/pull/18527)
    - 允許調整金鑰表格欄寬 - [PR #18424](https://github.com/BerriAI/litellm/pull/18424)
    - 虛擬金鑰表格跨頁載入狀態 - [PR #18619](https://github.com/BerriAI/litellm/pull/18619)
    - 金鑰與團隊路由設定 - [PR #18790](https://github.com/BerriAI/litellm/pull/18790)
    - 允許在金鑰與團隊中使用 router_settings - [PR #18675](https://github.com/BerriAI/litellm/pull/18675)
    - 使用 timedelta 在 generate 時計算金鑰到期時間 - [PR #18666](https://github.com/BerriAI/litellm/pull/18666)
- **模型 + 端點**
    - 為團隊管理員新增模型清除流程 - [PR #18532](https://github.com/BerriAI/litellm/pull/18532)
    - 模型頁面載入狀態 - [PR #18574](https://github.com/BerriAI/litellm/pull/18574)
    - 模型頁面模型提供者選擇效能 - [PR #18425](https://github.com/BerriAI/litellm/pull/18425)
    - 模型頁面排序會排序整個集合 - [PR #18420](https://github.com/BerriAI/litellm/pull/18420)
    - 重構模型中樞頁面 - [PR #18568](https://github.com/BerriAI/litellm/pull/18568)
    - 在 UI 上新增請求提供者表單 - [PR #18704](https://github.com/BerriAI/litellm/pull/18704)
- **組織與團隊**
    - 允許組織管理員查看組織分頁 - [PR #18400](https://github.com/BerriAI/litellm/pull/18400)
    - 在團隊表格中解析組織別名 - [PR #18401](https://github.com/BerriAI/litellm/pull/18401)
    - 在組織資訊檢視中解析團隊別名 - [PR #18404](https://github.com/BerriAI/litellm/pull/18404)
    - 允許組織管理員查看其組織資訊 - [PR #18417](https://github.com/BerriAI/litellm/pull/18417)
    - 允許在 /team/update 中編輯 team_member_budget_duration - [PR #18735](https://github.com/BerriAI/litellm/pull/18735)
    - 可重複使用的 Duration 選擇器 + 團隊更新成員預算期間 - [PR #18736](https://github.com/BerriAI/litellm/pull/18736)
- **用量與支出**
    - 在支出記錄上新增錯誤代碼篩選 - [PR #18359](https://github.com/BerriAI/litellm/pull/18359)
    - 在 UI 上新增錯誤代碼篩選 - [PR #18366](https://github.com/BerriAI/litellm/pull/18366)
    - 用量頁面使用者最大預算修正 - [PR #18555](https://github.com/BerriAI/litellm/pull/18555)
    - 為 Daily Activity Tables 新增端點 - [PR #18729](https://github.com/BerriAI/litellm/pull/18729)
    - 用量中的端點活動 - [PR #18798](https://github.com/BerriAI/litellm/pull/18798)
- **成本估算器**
    - 為 AI Gateway 新增成本估算器 - [PR #18643](https://github.com/BerriAI/litellm/pull/18643)
    - 新增跨請求估算成本的檢視 - [PR #18645](https://github.com/BerriAI/litellm/pull/18645)
    - 允許在成本估算器中選取多個模型 - [PR #18653](https://github.com/BerriAI/litellm/pull/18653)
- **CloudZero**
    - 改善 CloudZero 的建立與刪除路徑 - [PR #18263](https://github.com/BerriAI/litellm/pull/18263)
    - 新增 CloudZero UI 文件 - [PR #18350](https://github.com/BerriAI/litellm/pull/18350)
- **Playground**
    - 在 Playground 的 completions 新增 MCP 測試支援 - [PR #18440](https://github.com/BerriAI/litellm/pull/18440)
    - 為 playground 新增可選取的 MCP servers - [PR #18578](https://github.com/BerriAI/litellm/pull/18578)
    - 為 Playground 新增自訂 proxy base URL 支援 - [PR #18661](https://github.com/BerriAI/litellm/pull/18661)
- **一般 UI**
    - UI 樣式改進與修正 - [PR #18310](https://github.com/BerriAI/litellm/pull/18310)
    - 為功能亮點新增可重複使用的「新增」徽章元件 - [PR #18537](https://github.com/BerriAI/litellm/pull/18537)
    - 隱藏新增徽章 - [PR #18547](https://github.com/BerriAI/litellm/pull/18547)
    - 將預算頁面改為分頁 - [PR #18576](https://github.com/BerriAI/litellm/pull/18576)
    - 點擊標誌會導向正確的 URL - [PR #18575](https://github.com/BerriAI/litellm/pull/18575)
    - 新增設定 meta URLs 的 UI 支援 - [PR #18580](https://github.com/BerriAI/litellm/pull/18580)
    - 登入時使先前的 UI 工作階段權杖失效 - [PR #18557](https://github.com/BerriAI/litellm/pull/18557)
    - 新增授權端點 - [PR #18311](https://github.com/BerriAI/litellm/pull/18311)
    - Router Fields 端點 + Router Fields 的 React Query - [PR #18880](https://github.com/BerriAI/litellm/pull/18880)

#### 錯誤 {#bugs-1}

- **UI 修正**
    - 修正金鑰建立 MCP 設定表單意外送出 - [PR #18355](https://github.com/BerriAI/litellm/pull/18355)
    - 修正開發環境中 UI 消失 - [PR #18399](https://github.com/BerriAI/litellm/pull/18399)
    - 修正停用管理 UI 標記 - [PR #18397](https://github.com/BerriAI/litellm/pull/18397)
    - 從模型頁面移除模型分析 - [PR #18552](https://github.com/BerriAI/litellm/pull/18552)
    - 新增連結時從實用連結移除對話框 - [PR #18602](https://github.com/BerriAI/litellm/pull/18602)
    - SSO 編輯對話框在提供者變更時清除角色對應值 - [PR #18680](https://github.com/BerriAI/litellm/pull/18680)
    - UI 登入大小寫敏感性修正 - [PR #18877](https://github.com/BerriAI/litellm/pull/18877)
- **API 修正**
    - 修正使用者邀請與金鑰產生電子郵件通知邏輯 - [PR #18524](https://github.com/BerriAI/litellm/pull/18524)
    - 標準化 Proxy Config 回呼 - [PR #18775](https://github.com/BerriAI/litellm/pull/18775)
    - 在未設定模型時回傳空資料陣列，而非 500 - [PR #18556](https://github.com/BerriAI/litellm/pull/18556)
    - 強制執行組織層級最大預算 - [PR #18813](https://github.com/BerriAI/litellm/pull/18813)

---

## AI 整合 {#ai-integrations}

### 新整合（4 個新整合） {#new-integrations-4-new-integrations}

| 整合 | 類型 | 說明 |
| ----------- | ---- | ----------- |
| [Focus](../../docs/observability/focus) | 記錄 | 支援 Focus 匯出以供可觀測性使用 - [PR #18802](https://github.com/BerriAI/litellm/pull/18802) |
| [SigNoz](../../docs/observability/signoz) | 記錄 | SigNoz 用於可觀測性的整合 - [PR #18726](https://github.com/BerriAI/litellm/pull/18726) |
| [Qualifire](../../docs/proxy/guardrails/qualifire) | 防護欄 | Qualifire 防護欄與評估 webhook - [PR #18594](https://github.com/BerriAI/litellm/pull/18594) |
| [Levo AI](../../docs/observability/levo_integration) | 防護欄 | Levo AI 用於安全性的整合 - [PR #18529](https://github.com/BerriAI/litellm/pull/18529) |

### 記錄 {#logging}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 當缺少 parent_id 時修正 span kind 備援 - [PR #18418](https://github.com/BerriAI/litellm/pull/18418)
- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 將 Gemini cached_tokens 對應到 Langfuse cache_read_input_tokens - [PR #18614](https://github.com/BerriAI/litellm/pull/18614)
- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 將 prometheus 指標名稱與 DEFINED_PROMETHEUS_METRICS 對齊 - [PR #18463](https://github.com/BerriAI/litellm/pull/18463)
    - 為請求佇列時間與防護欄新增 Prometheus 指標 - [PR #17973](https://github.com/BerriAI/litellm/pull/17973)
    - 新增快取命中、未命中與 token 的快取指標 - [PR #18755](https://github.com/BerriAI/litellm/pull/18755)
    - 略過無效 API 金鑰請求的指標 - [PR #18788](https://github.com/BerriAI/litellm/pull/18788)
- **[Braintrust](../../docs/proxy/logging#braintrust)**
    - 在非同步記錄中傳遞 span_attributes，並略過非 root spans 的標籤 - [PR #18409](https://github.com/BerriAI/litellm/pull/18409)
- **[CloudZero](../../docs/proxy/logging#cloudzero)**
    - 將使用者電子郵件加入 CloudZero - [PR #18584](https://github.com/BerriAI/litellm/pull/18584)
- **[OpenTelemetry](../../docs/proxy/logging#opentelemetry)**
    - 使用已設定的 opentelemetry providers - [PR #18279](https://github.com/BerriAI/litellm/pull/18279)
    - 防止 LiteLLM 關閉外部 OTEL spans - [PR #18553](https://github.com/BerriAI/litellm/pull/18553)
    - 允許為 OpenTelemetry service name 設定 arize project name - [PR #18738](https://github.com/BerriAI/litellm/pull/18738)
- **[LangSmith](../../docs/proxy/logging#langsmith)**
    - 新增支援帶有 tenant ID 的 LangSmith 組織範圍 API 金鑰 - [PR #18623](https://github.com/BerriAI/litellm/pull/18623)
- **[Generic API Logger](../../docs/proxy/logging#generic-api-logger)**
    - 為 GenericAPILogger 新增 log_format 選項 - [PR #18587](https://github.com/BerriAI/litellm/pull/18587)

### 防護欄 {#guardrails}

- **[內容篩選器](../../docs/proxy/guardrails/litellm_content_filter)**
    - 新增內容篩選器記錄頁面 - [PR #18335](https://github.com/BerriAI/litellm/pull/18335)
    - 記錄 guardrail 的實際事件類型 - [PR #18489](https://github.com/BerriAI/litellm/pull/18489)
- **[Qualifire](../../docs/proxy/guardrails/qualifire)**
    - 新增 Qualifire eval webhook - [PR #18836](https://github.com/BerriAI/litellm/pull/18836)
- **[Lasso Security](../../docs/proxy/guardrails/lasso_security)**
    - 新增 Lasso guardrail API 文件 - [PR #18652](https://github.com/BerriAI/litellm/pull/18652)
- **[Noma Security](../../docs/proxy/guardrails/noma_security)**
    - 新增 Noma 的 MCP guardrail 支援 - [PR #18668](https://github.com/BerriAI/litellm/pull/18668)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 移除多餘的 Bedrock guardrail 區塊處理 - [PR #18634](https://github.com/BerriAI/litellm/pull/18634)
- **一般**
    - 一般 guardrail API 更新 - [PR #18647](https://github.com/BerriAI/litellm/pull/18647)
    - 防止因大小寫敏感的工具權限 guardrail 驗證導致 proxy 啟動失敗 - [PR #18662](https://github.com/BerriAI/litellm/pull/18662)
    - 將大小寫正規化擴展到所有 guardrail 類型 - [PR #18664](https://github.com/BerriAI/litellm/pull/18664)
    - 修正統一 guardrail 中的 MCP 處理 - [PR #18630](https://github.com/BerriAI/litellm/pull/18630)
    - 修正 guardrail precallhook 的 embeddings calltype - [PR #18740](https://github.com/BerriAI/litellm/pull/18740)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **Platform Fee / Margins** - 新增對 Platform Fee / Margins 的支援 - [PR #18427](https://github.com/BerriAI/litellm/pull/18427)
- **負預算驗證** - 新增負預算驗證 - [PR #18583](https://github.com/BerriAI/litellm/pull/18583)
- **成本計算修正**
    - 修正 reasoning_tokens 在沒有 text_tokens 時的成本計算 - [PR #18607](https://github.com/BerriAI/litellm/pull/18607)
    - 修正背景成本追蹤測試 - [PR #18588](https://github.com/BerriAI/litellm/pull/18588)
- **標籤路由** - 支援在 ANY 與 ALL 之間切換標籤比對 - [PR #18776](https://github.com/BerriAI/litellm/pull/18776)

---

## MCP 閘道 {#mcp-gateway}

- **MCP 全域模式** - 新增 MCP 全域模式 - [PR #18639](https://github.com/BerriAI/litellm/pull/18639)
- **MCP 伺服器可見性** - 新增可設定的 MCP 伺服器可見性 - [PR #18681](https://github.com/BerriAI/litellm/pull/18681)
- **MCP 登錄** - 新增 MCP 登錄 - [PR #18850](https://github.com/BerriAI/litellm/pull/18850)
- **MCP Stdio 標頭** - 支援 MCP stdio 標頭環境變數覆寫 - [PR #18324](https://github.com/BerriAI/litellm/pull/18324)
- **平行工具擷取** - 來自多個 MCP 伺服器的工具擷取平行化 - [PR #18627](https://github.com/BerriAI/litellm/pull/18627)
- **最佳化 MCP 伺服器列表** - 為最佳化列表分離健康檢查 - [PR #18530](https://github.com/BerriAI/litellm/pull/18530)
- **驗證改進**
    - MCP 連線測試端點需要驗證 - [PR #18290](https://github.com/BerriAI/litellm/pull/18290)
    - 修正 MCP 閘道 OAuth2 驗證問題與 ClosedResourceError - [PR #18281](https://github.com/BerriAI/litellm/pull/18281)
- **錯誤修正**
    - 修正 MCP 伺服器健康狀態回報 - [PR #18443](https://github.com/BerriAI/litellm/pull/18443)
    - 修正 OpenAPI 到 MCP 工具的轉換 - [PR #18597](https://github.com/BerriAI/litellm/pull/18597)
    - 移除 exec() 使用並為安全性處理無效的 OpenAPI 參數名稱 - [PR #18480](https://github.com/BerriAI/litellm/pull/18480)
    - 修正在同時使用多個伺服器時的 MCP 錯誤 - [PR #18855](https://github.com/BerriAI/litellm/pull/18855)
- **將 MCP 擷取邏輯遷移至 React Query** - [PR #18352](https://github.com/BerriAI/litellm/pull/18352)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **92.7% 更快的提供者設定查找** - LiteLLM 現在對 LLM 提供者施加 2.5 倍壓力 - [PR #18867](https://github.com/BerriAI/litellm/pull/18867)
- **延遲載入改善**
    - 以註冊表模式整併延遲匯入處理器 - [PR #18389](https://github.com/BerriAI/litellm/pull/18389)
    - 完成所有 180+ 個 LLM 設定類別的延遲載入遷移 - [PR #18392](https://github.com/BerriAI/litellm/pull/18392)
    - 延遲載入其他元件（類型、回呼、公用程式） - [PR #18396](https://github.com/BerriAI/litellm/pull/18396)
    - 為 get_llm_provider 新增延遲載入 - [PR #18591](https://github.com/BerriAI/litellm/pull/18591)
    - 延遲載入大型音訊函式庫與記錄器 - [PR #18592](https://github.com/BerriAI/litellm/pull/18592)
    - 在 litellm/utils.py 中延遲載入 9 個大型匯入 - [PR #18595](https://github.com/BerriAI/litellm/pull/18595)
    - 延遲載入大型匯入以改善匯入時間與記憶體使用 - [PR #18610](https://github.com/BerriAI/litellm/pull/18610)
    - 為提供者設定、模型資訊類別、串流處理器實作延遲載入 - [PR #18611](https://github.com/BerriAI/litellm/pull/18611)
    - 延遲載入 15 個額外匯入 - [PR #18613](https://github.com/BerriAI/litellm/pull/18613)
    - 延遲載入 15+ 個未使用匯入 - [PR #18616](https://github.com/BerriAI/litellm/pull/18616)
    - 延遲載入 DatadogLLMObsInitParams - [PR #18658](https://github.com/BerriAI/litellm/pull/18658)
    - 將 utils.py 的延遲匯入遷移至註冊表模式 - [PR #18657](https://github.com/BerriAI/litellm/pull/18657)
    - 延遲載入 get_llm_provider 與 remove_index_from_tool_calls - [PR #18608](https://github.com/BerriAI/litellm/pull/18608)
- **路由器改善**
    - 在啟動時驗證 routing_strategy，以在發生錯誤時快速失敗並提供有幫助的錯誤訊息 - [PR #18624](https://github.com/BerriAI/litellm/pull/18624)
    - 修正重試邏輯中的 num_retries 追蹤 - [PR #18712](https://github.com/BerriAI/litellm/pull/18712)
    - 改善具有多重憑證的萬用字元路由之錯誤訊息與驗證 - [PR #18629](https://github.com/BerriAI/litellm/pull/18629)
- **記憶體改善**
    - 新增記憶體模式偵測測試並修正不良記憶體模式 - [PR #18589](https://github.com/BerriAI/litellm/pull/18589)
    - 在記憶體測試中新增無界資料結構偵測 - [PR #18590](https://github.com/BerriAI/litellm/pull/18590)
    - 新增具 CI 整合的記憶體洩漏偵測測試 - [PR #18881](https://github.com/BerriAI/litellm/pull/18881)
- **資料庫**
    - 為 LOWER(user_email) 新增 idx，以加快重複電子郵件檢查 - [PR #18828](https://github.com/BerriAI/litellm/pull/18828)
    - 預先刷新 RDS IAM token，以防止 15 分鐘連線失敗 - [PR #18795](https://github.com/BerriAI/litellm/pull/18795)
    - 說明 database_connection_pool_limit 是按每個 worker 套用 - [PR #18780](https://github.com/BerriAI/litellm/pull/18780)
    - 使 base_connection_pool_limit 預設值保持相同 - [PR #18721](https://github.com/BerriAI/litellm/pull/18721)
- **Docker**
    - 為資料庫 Docker 映像檔新增 libsndfile，以進行音訊處理 - [PR #18612](https://github.com/BerriAI/litellm/pull/18612)
    - 新增 line_profiler 支援以進行效能分析並修正 Windows CRLF 問題 - [PR #18773](https://github.com/BerriAI/litellm/pull/18773)
- **Helm**
    - 為 Helm charts 新增生命週期支援 - [PR #18517](https://github.com/BerriAI/litellm/pull/18517)
- **驗證**
    - 新增 Kubernetes ServiceAccount JWT 驗證支援 - [PR #18055](https://github.com/BerriAI/litellm/pull/18055)
    - 使用 async anthropic client 以避免事件迴圈阻塞 - [PR #18435](https://github.com/BerriAI/litellm/pull/18435)
- **記錄工作者**
    - 在 multiprocessing 中處理事件迴圈變更 - [PR #18423](https://github.com/BerriAI/litellm/pull/18423)
- **安全性**
    - 防止逾期金鑰明文洩漏於錯誤回應中 - [PR #18860](https://github.com/BerriAI/litellm/pull/18860)
    - 在模型資訊中遮罩額外標頭密鑰 - [PR #18822](https://github.com/BerriAI/litellm/pull/18822)
    - 防止 request_tags 中重複的 User-Agent 標籤 - [PR #18723](https://github.com/BerriAI/litellm/pull/18723)
    - 正確使用 litellm api keys - [PR #18832](https://github.com/BerriAI/litellm/pull/18832)
- **其他**
    - 移除 main.py 中的重複匯入 - [PR #18406](https://github.com/BerriAI/litellm/pull/18406)
    - 新增 LITELLM_DISABLE_LAZY_LOADING 環境變數以修正 VCR cassette 建立問題 - [PR #18725](https://github.com/BerriAI/litellm/pull/18725)
    - 將 xiaomi_mimo 新增至 LlmProviders enum 以修正路由器支援 - [PR #18819](https://github.com/BerriAI/litellm/pull/18819)
    - 允許在舊版 Python 上使用目前的 grpcio 進行安裝 - [PR #18473](https://github.com/BerriAI/litellm/pull/18473)
    - 為 boto3 clients 新增自訂 CA 憑證 - [PR #18852](https://github.com/BerriAI/litellm/pull/18852)
    - 修正 bedrock_cache、metadata 與 max_model_budget - [PR #18872](https://github.com/BerriAI/litellm/pull/18872)
    - 修正 LiteLLM SDK embeddings 標頭缺少欄位 - [PR #18844](https://github.com/BerriAI/litellm/pull/18844)
    - 將自動 reasoning 摘要包含功能置於 feat flag 之後 - [PR #18688](https://github.com/BerriAI/litellm/pull/18688)
    - turn_off_message_logging 不會在 proxy_server_request 欄位中遮蔽 request messages - [PR #18897](https://github.com/BerriAI/litellm/pull/18897)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 將 MiniMax 文件更新為正確格式 - [PR #18403](https://github.com/BerriAI/litellm/pull/18403)
    - 新增 5 個 AI 提供者的文件 - [PR #18388](https://github.com/BerriAI/litellm/pull/18388)
    - 修正 gpt-5-mini 的 reasoning_effort 支援值 - [PR #18346](https://github.com/BerriAI/litellm/pull/18346)
    - 修正 Anthropic 頁面中的 PDF 文件不一致問題 - [PR #18816](https://github.com/BerriAI/litellm/pull/18816)
    - 更新 OpenRouter 文件以包含 embedding 支援 - [PR #18874](https://github.com/BerriAI/litellm/pull/18874)
    - 在文件中新增 LITELLM_REASONING_AUTO_SUMMARY - [PR #18705](https://github.com/BerriAI/litellm/pull/18705)
- **MCP 文件**
    - Agentcore MCP 伺服器文件 - [PR #18603](https://github.com/BerriAI/litellm/pull/18603)
    - 在總覽中提及 MCP prompt/resources 類型 - [PR #18669](https://github.com/BerriAI/litellm/pull/18669)
    - 新增 Focus 文件 - [PR #18837](https://github.com/BerriAI/litellm/pull/18837)
- **防護欄文件**
    - Qualifire 文件熱修正 - [PR #18724](https://github.com/BerriAI/litellm/pull/18724)
- **基礎架構文件**
    - IAM Roles Anywhere 文件 - [PR #18559](https://github.com/BerriAI/litellm/pull/18559)
    - 修正 proxy 設定文件中的格式 - [PR #18498](https://github.com/BerriAI/litellm/pull/18498)
    - 修正 proxy 模式缺少 GCS 快取文件的問題 - [PR #13328](https://github.com/BerriAI/litellm/pull/13328)
    - 修正如何執行 cloudzero sql - [PR #18841](https://github.com/BerriAI/litellm/pull/18841)
- **一般**
    - LiteLLM 採用者區段 - [PR #18605](https://github.com/BerriAI/litellm/pull/18605)
    - 移除關於設定 litellm.callbacks 的多餘註解 - [PR #18711](https://github.com/BerriAI/litellm/pull/18711)
    - 透過移除空格，將標題更新為 Markdown 粗體 - [PR #18846](https://github.com/BerriAI/litellm/pull/18846)
    - Manus 文件 - 新提供者 - [PR #18817](https://github.com/BerriAI/litellm/pull/18817)

---

## 新增貢獻者 {#new-contributors}

* @prasadkona 首次貢獻於 [PR #18349](https://github.com/BerriAI/litellm/pull/18349)
* @lucasrothman 首次貢獻於 [PR #18283](https://github.com/BerriAI/litellm/pull/18283)
* @aggeentik 首次貢獻於 [PR #18317](https://github.com/BerriAI/litellm/pull/18317)
* @mihidumh 首次貢獻於 [PR #18361](https://github.com/BerriAI/litellm/pull/18361)
* @Prazeina 首次貢獻於 [PR #18498](https://github.com/BerriAI/litellm/pull/18498)
* @systec-dk 首次貢獻於 [PR #18500](https://github.com/BerriAI/litellm/pull/18500)
* @xuan07t2 首次貢獻於 [PR #18514](https://github.com/BerriAI/litellm/pull/18514)
* @RensDimmendaal 首次貢獻於 [PR #18190](https://github.com/BerriAI/litellm/pull/18190)
* @yurekami 首次貢獻於 [PR #18483](https://github.com/BerriAI/litellm/pull/18483)
* @agertz7 首次貢獻於 [PR #18556](https://github.com/BerriAI/litellm/pull/18556)
* @yudelevi 首次貢獻於 [PR #18550](https://github.com/BerriAI/litellm/pull/18550)
* @smallp 首次貢獻於 [PR #18536](https://github.com/BerriAI/litellm/pull/18536)
* @kevinpauer 首次貢獻於 [PR #18569](https://github.com/BerriAI/litellm/pull/18569)
* @cansakiroglu 首次貢獻於 [PR #18517](https://github.com/BerriAI/litellm/pull/18517)
* @dee-walia20 首次貢獻於 [PR #18432](https://github.com/BerriAI/litellm/pull/18432)
* @luxinfeng 首次貢獻於 [PR #18477](https://github.com/BerriAI/litellm/pull/18477)
* @cantalupo555 首次貢獻於 [PR #18476](https://github.com/BerriAI/litellm/pull/18476)
* @andersk 首次貢獻於 [PR #18473](https://github.com/BerriAI/litellm/pull/18473)
* @majiayu000 首次貢獻於 [PR #18467](https://github.com/BerriAI/litellm/pull/18467)
* @amangupta-20 首次貢獻於 [PR #18529](https://github.com/BerriAI/litellm/pull/18529)
* @hamzaq453 首次貢獻於 [PR #18480](https://github.com/BerriAI/litellm/pull/18480)
* @ktsaou 首次貢獻於 [PR #18627](https://github.com/BerriAI/litellm/pull/18627)
* @FlibbertyGibbitz 首次貢獻於 [PR #18624](https://github.com/BerriAI/litellm/pull/18624)
* @drorIvry 首次貢獻於 [PR #18594](https://github.com/BerriAI/litellm/pull/18594)
* @urainshah 首次貢獻於 [PR #18524](https://github.com/BerriAI/litellm/pull/18524)
* @mangabits 首次貢獻於 [PR #18279](https://github.com/BerriAI/litellm/pull/18279)
* @0717376 首次貢獻於 [PR #18564](https://github.com/BerriAI/litellm/pull/18564)
* @nmgarza5 首次貢獻於 [PR #17330](https://github.com/BerriAI/litellm/pull/17330)
* @wileykestner 首次貢獻於 [PR #18445](https://github.com/BerriAI/litellm/pull/18445)
* @minijeong-log 首次貢獻於 [PR #14440](https://github.com/BerriAI/litellm/pull/14440)
* @Isaac4real 首次貢獻於 [PR #18710](https://github.com/BerriAI/litellm/pull/18710)
* @marukaz 首次貢獻於 [PR #18711](https://github.com/BerriAI/litellm/pull/18711)
* @rohitravirane 首次貢獻於 [PR #18712](https://github.com/BerriAI/litellm/pull/18712)
* @lizzzcai 首次貢獻於 [PR #18714](https://github.com/BerriAI/litellm/pull/18714)
* @hkd987 首次貢獻於 [PR #18673](https://github.com/BerriAI/litellm/pull/18673)
* @Mr-Pepe 首次貢獻於 [PR #18674](https://github.com/BerriAI/litellm/pull/18674)
* @gkarthi-signoz 首次貢獻於 [PR #18726](https://github.com/BerriAI/litellm/pull/18726)
* @Tianduo16 首次貢獻於 [PR #18723](https://github.com/BerriAI/litellm/pull/18723)
* @wilsonjr 首次貢獻於 [PR #18721](https://github.com/BerriAI/litellm/pull/18721)
* @abliteration-ai 首次貢獻於 [PR #18678](https://github.com/BerriAI/litellm/pull/18678)
* @danialkhan02 首次貢獻於 [PR #18770](https://github.com/BerriAI/litellm/pull/18770)
* @ihower 首次貢獻於 [PR #18409](https://github.com/BerriAI/litellm/pull/18409)
* @elkkhan 首次貢獻於 [PR #18391](https://github.com/BerriAI/litellm/pull/18391)
* @runixer 首次貢獻於 [PR #18435](https://github.com/BerriAI/litellm/pull/18435)
* @choby-shun 首次貢獻於 [PR #18776](https://github.com/BerriAI/litellm/pull/18776)
* @jutaz 首次貢獻於 [PR #18853](https://github.com/BerriAI/litellm/pull/18853)
* @sjmatta 首次貢獻於 [PR #18250](https://github.com/BerriAI/litellm/pull/18250)
* @andres-ortizl 首次貢獻於 [PR #18856](https://github.com/BerriAI/litellm/pull/18856)
* @gauthiermartin 首次貢獻於 [PR #18844](https://github.com/BerriAI/litellm/pull/18844)
* @mel2oo 首次貢獻於 [PR #18845](https://github.com/BerriAI/litellm/pull/18845)
* @DominikHallab 首次貢獻於 [PR #18846](https://github.com/BerriAI/litellm/pull/18846)
* @ji-chuan-che 首次貢獻於 [PR #18540](https://github.com/BerriAI/litellm/pull/18540)
* @raghav-stripe 首次貢獻於 [PR #18858](https://github.com/BerriAI/litellm/pull/18858)
* @akraines 首次貢獻於 [PR #18629](https://github.com/BerriAI/litellm/pull/18629)
* @otaviofbrito 首次貢獻於 [PR #18665](https://github.com/BerriAI/litellm/pull/18665)
* @chetanchoudhary-sumo 首次貢獻於 [PR #18587](https://github.com/BerriAI/litellm/pull/18587)
* @pascalwhoop 首次貢獻於 [PR #13328](https://github.com/BerriAI/litellm/pull/13328)
* @orgersh92 首次貢獻於 [PR #18652](https://github.com/BerriAI/litellm/pull/18652)
* @DevajMody 首次貢獻於 [PR #18497](https://github.com/BerriAI/litellm/pull/18497)
* @matt-greathouse 首次貢獻於 [PR #18247](https://github.com/BerriAI/litellm/pull/18247)
* @emerzon 首次貢獻於 [PR #18290](https://github.com/BerriAI/litellm/pull/18290)
* @Eric84626 首次貢獻於 [PR #18281](https://github.com/BerriAI/litellm/pull/18281)
* @LukasdeBoer 首次貢獻於 [PR #18055](https://github.com/BerriAI/litellm/pull/18055)
* @LingXuanYin 首次貢獻於 [PR #18513](https://github.com/BerriAI/litellm/pull/18513)
* @krisxia0506 首次貢獻於 [PR #18698](https://github.com/BerriAI/litellm/pull/18698)
* @LouisShark 首次貢獻於 [PR #18414](https://github.com/BerriAI/litellm/pull/18414)

---

## 完整變更紀錄 {#full-changelog}

**[在 GitHub 上查看完整變更紀錄](https://github.com/BerriAI/litellm/compare/v1.80.11.rc.1...v1.80.15-stable.1)**
