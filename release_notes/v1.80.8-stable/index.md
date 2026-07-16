---
title: "v1.80.8-stable - 推出 A2A Agent Gateway"
slug: "v1-80-8"
date: 2025-12-06T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.80.8-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.8
```

</TabItem>
</Tabs>

---

## 重點摘要 {#key-highlights}

- **Agent Gateway (A2A)** - [透過 AI Gateway 呼叫代理程式，並具備請求/回應記錄與存取控制](../../docs/a2a)
- **Guardrails API v2** - [支援串流、結構化訊息與工具呼叫檢查的通用防護欄 API](../../docs/adding_provider/generic_guardrail_api)
- **客戶（終端使用者）用量 UI** - [直接在儀表板中追蹤並視覺化終端使用者支出](../../docs/proxy/customer_usage)
- **vLLM Batch + Files API** - [支援 vLLM 部署的 batch 與 files API](../../docs/batches)
- **Teams 的動態速率限制** - [在 team 層級啟用動態速率限制與優先保留](../../docs/proxy/team_budgets)
- **Google Cloud Chirp3 HD** - [具備 Chirp3 HD 語音的新文字轉語音提供者](../../docs/text_to_speech)

---

### 代理程式閘道（A2A） {#agent-gateway-a2a}

<Image 
  img={require('../../img/a2a_gateway.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

此版本為 LiteLLM 引入 **A2A Agent Gateway**，讓您能以與 LLM API 相同的控制，呼叫並管理 A2A 代理程式。

身為 **LiteLLM Gateway 管理員**，您現在可以執行以下操作：
    - **請求/回應記錄** - 每次代理程式呼叫都會記錄到 Logs 頁面，並完整追蹤請求與回應。
    - **存取控制** - 控制哪些 Team/Key 可存取哪些代理程式。

身為開發者，您可以繼續使用 A2A SDK，您只需要將您的 `A2AClient` 指向 LiteLLM proxy URL 和您的 API 金鑰。

**可與 A2A SDK 搭配使用：**

```python
from a2a.client import A2AClient

client = A2AClient(
    base_url="http://localhost:4000",  # Your LiteLLM proxy
    api_key="sk-1234"                   # LiteLLM API key
)

response = client.send_message(
    agent_id="my-agent",
    message="What's the status of my order?"
)
```

在此開始使用 Agent Gateway：[Agent Gateway 文件](../../docs/a2a)

---

### 客戶（終端使用者）用量 UI {#customer-end-user-usage-ui}

<Image
img={require('../../img/customer_usage.png')}
style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

使用者現在可以依客戶篩選用量統計，提供與 team 和組織相同的細粒度篩選能力。

**詳細資訊：**

- 依客戶 ID 篩選用量分析、支出記錄與活動指標
- 在既有的 team 與使用者層級篩選之外，檢視客戶層級的明細
- 在所有用量與分析檢視中提供一致的篩選體驗

---

## 新提供者與端點 {#new-providers-and-endpoints}

### 新提供者（5 個新提供者） {#new-providers-5-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | ------------------- | ----------- |
| **[Z.AI (Zhipu AI)](../../docs/providers/zai)** | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 內建支援 Zhipu AI GLM 模型 |
| **[RAGFlow](../../docs/providers/ragflow)** | `/v1/chat/completions`, `/v1/responses`, `/v1/messages`, `/v1/vector_stores` | 支援向量儲存的 RAG 型 chat completions |
| **[PublicAI](../../docs/providers/publicai)** | `/v1/chat/completions`, `/v1/responses`, `/v1/messages` | 透過 JSON 設定的 OpenAI 相容提供者 |
| **[Google Cloud Chirp3 HD](../../docs/text_to_speech)** | `/v1/audio/speech`, `/v1/audio/speech/stream` | 使用 Google Cloud Chirp3 HD 語音的文字轉語音 |

### 新 LLM API 端點（2 個新端點） {#new-llm-api-endpoints-2-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| -------- | ------ | ----------- | ------------- |
| `/v1/agents/invoke` | POST | 透過 AI Gateway 呼叫 A2A 代理程式 | [Agent Gateway](../../docs/a2a) |
| `/cursor/chat/completions` | POST | Cursor BYOK 端點 - 接受 Responses API 輸入，回傳 Chat Completions 輸出 | [Cursor 整合](../../docs/tutorials/cursor_integration) |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（33 個新模型） {#new-model-support-33-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.1-codex-max` | 400K | $1.25 | $10.00 | 推理、視覺、PDF 輸入、responses API |
| Azure | `azure/gpt-5.1-codex-max` | 400K | $1.25 | $10.00 | 推理、視覺、PDF 輸入、responses API |
| Anthropic | `claude-opus-4-5` | 200K | $5.00 | $25.00 | 電腦使用、推理、視覺 |
| Bedrock | `global.anthropic.claude-opus-4-5-20251101-v1:0` | 200K | $5.00 | $25.00 | 電腦使用、推理、視覺 |
| Bedrock | `amazon.nova-2-lite-v1:0` | 1M | $0.30 | $2.50 | 推理、視覺、影片、PDF 輸入 |
| Bedrock | `amazon.titan-image-generator-v2:0` | - | - | $0.008/image | 圖片生成 |
| Fireworks | `fireworks_ai/deepseek-v3p2` | 164K | $1.20 | $1.20 | 函式呼叫、回應結構 |
| Fireworks | `fireworks_ai/kimi-k2-instruct-0905` | 262K | $0.60 | $2.50 | 函式呼叫、回應結構 |
| DeepSeek | `deepseek/deepseek-v3.2` | 164K | $0.28 | $0.40 | 推理、函式呼叫 |
| Mistral | `mistral/mistral-large-3` | 256K | $0.50 | $1.50 | 函式呼叫、視覺 |
| Azure AI | `azure_ai/mistral-large-3` | 256K | $0.50 | $1.50 | 函式呼叫、視覺 |
| Moonshot | `moonshot/kimi-k2-0905-preview` | 262K | $0.60 | $2.50 | 函式呼叫、網頁搜尋 |
| Moonshot | `moonshot/kimi-k2-turbo-preview` | 262K | $1.15 | $8.00 | 函式呼叫、網頁搜尋 |
| Moonshot | `moonshot/kimi-k2-thinking-turbo` | 262K | $1.15 | $8.00 | 函式呼叫、網頁搜尋 |
| OpenRouter | `openrouter/deepseek/deepseek-v3.2` | 164K | $0.28 | $0.40 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-haiku-4-5` | 200K | $1.00 | $5.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-opus-4` | 200K | $15.00 | $75.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-opus-4-1` | 200K | $15.00 | $75.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-opus-4-5` | 200K | $5.00 | $25.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-sonnet-4` | 200K | $3.00 | $15.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-claude-sonnet-4-1` | 200K | $3.00 | $15.00 | 推理、函式呼叫 |
| Databricks | `databricks/databricks-gemini-2-5-flash` | 1M | $0.30 | $2.50 | 函式呼叫 |
| Databricks | `databricks/databricks-gemini-2-5-pro` | 1M | $1.25 | $10.00 | 函式呼叫 |
| Databricks | `databricks/databricks-gpt-5` | 400K | $1.25 | $10.00 | 函式呼叫 |
| Databricks | `databricks/databricks-gpt-5-1` | 400K | $1.25 | $10.00 | 函式呼叫 |
| Databricks | `databricks/databricks-gpt-5-mini` | 400K | $0.25 | $2.00 | 函式呼叫 |
| Databricks | `databricks/databricks-gpt-5-nano` | 400K | $0.05 | $0.40 | 函式呼叫 |
| Vertex AI | `vertex_ai/chirp` | - | $30.00/1M chars | - | 文字轉語音（Chirp3 HD） |
| Z.AI | `zai/glm-4.6` | 200K | $0.60 | $2.20 | 函式呼叫 |
| Z.AI | `zai/glm-4.5` | 128K | $0.60 | $2.20 | 函式呼叫 |
| Z.AI | `zai/glm-4.5v` | 128K | $0.60 | $1.80 | 函式呼叫、視覺 |
| Z.AI | `zai/glm-4.5-flash` | 128K | Free | Free | 函式呼叫 |
| Vertex AI | `vertex_ai/bge-large-en-v1.5` | - | - | - | BGE Embeddings |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增 `gpt-5.1-codex-max` 模型定價與設定 - [PR #17541](https://github.com/BerriAI/litellm/pull/17541)
    - 為 gpt-5.1-codex-max 新增 xhigh 推理等級 - [PR #17585](https://github.com/BerriAI/litellm/pull/17585)
    - 為空白 LLM 端點回應新增清楚的錯誤訊息 - [PR #17445](https://github.com/BerriAI/litellm/pull/17445)

- **[Azure OpenAI](../../docs/providers/azure/azure)**
    - 允許 Azure gpt-5.1 模型使用 reasoning_effort='none' - [PR #17311](https://github.com/BerriAI/litellm/pull/17311)

- **[Anthropic](../../docs/providers/anthropic)**
    - 將 `claude-opus-4-5` 別名新增至定價資料 - [PR #17313](https://github.com/BerriAI/litellm/pull/17313)
    - 解析 opus 4.5 的 `<budget:thinking>` 區塊 - [PR #17534](https://github.com/BerriAI/litellm/pull/17534)
    - 更新已審核的新 Anthropic 功能 - [PR #17142](https://github.com/BerriAI/litellm/pull/17142)
    - 略過 Anthropic 系統訊息中的空白文字區塊 - [PR #17442](https://github.com/BerriAI/litellm/pull/17442)

- **[Bedrock](../../docs/providers/bedrock)**
    - 新增 Nova embedding 支援 - [PR #17253](https://github.com/BerriAI/litellm/pull/17253)
    - 新增對 Bedrock Qwen 2 匯入模型的支援 - [PR #17461](https://github.com/BerriAI/litellm/pull/17461)
    - Bedrock OpenAI 模型支援 - [PR #17368](https://github.com/BerriAI/litellm/pull/17368)
    - 新增 Bedrock 批次的檔案內容下載支援 - [PR #17470](https://github.com/BerriAI/litellm/pull/17470)
    - 讓 Bedrock API 中的串流區塊大小可設定 - [PR #17357](https://github.com/BerriAI/litellm/pull/17357)
    - 新增 Bedrock 實驗性最新使用者篩選 - [PR #17282](https://github.com/BerriAI/litellm/pull/17282)
    - 處理 Cohere v4 embed 回應字典格式 - [PR #17220](https://github.com/BerriAI/litellm/pull/17220)
    - 移除 Bedrock 中不相容的 beta 標頭 - [PR #17301](https://github.com/BerriAI/litellm/pull/17301)
    - 新增 Global Opus 4.5 Bedrock 端點的模型價格與詳細資訊 - [PR #17380](https://github.com/BerriAI/litellm/pull/17380)

- **[Gemini (Google AI Studio + Vertex AI)](../../docs/providers/gemini)**
    - 改善 Gemini 模型的影像生成處理 - [PR #17292](https://github.com/BerriAI/litellm/pull/17292)
    - 修正 reasoning_content 在串流回應中顯示重複內容 - [PR #17266](https://github.com/BerriAI/litellm/pull/17266)
    - 處理第一個有效區塊之後的部分 JSON 區塊 - [PR #17496](https://github.com/BerriAI/litellm/pull/17496)
    - 修正 Gemini 3 最後一個區塊的 thinking 區塊 - [PR #17403](https://github.com/BerriAI/litellm/pull/17403)
    - 修正 Gemini image_tokens 在成本計算中被視為文字 tokens - [PR #17554](https://github.com/BerriAI/litellm/pull/17554)
    - 確保 media resolution 只適用於 Gemini 3 模型 - [PR #17137](https://github.com/BerriAI/litellm/pull/17137)

- **[Vertex AI](../../docs/providers/vertex)**
    - 在 /speech 新增 Google Cloud Chirp3 HD 支援 - [PR #17391](https://github.com/BerriAI/litellm/pull/17391)
    - 新增 BGE Embeddings 支援 - [PR #17362](https://github.com/BerriAI/litellm/pull/17362)
    - 處理 Vertex AI 影像生成端點的全域位置 - [PR #17255](https://github.com/BerriAI/litellm/pull/17255)
    - 新增 Google Private API Endpoint 至 Vertex AI 欄位 - [PR #17382](https://github.com/BerriAI/litellm/pull/17382)

- **[Z.AI (Zhipu AI)](../../docs/providers/zai)**
    - 將 Z.AI 新增為內建提供者 - [PR #17307](https://github.com/BerriAI/litellm/pull/17307)

- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 新增 Embedding API 支援 - [PR #17278](https://github.com/BerriAI/litellm/pull/17278)
    - 在多輪對話的 reasoning 項目中保留 encrypted_content - [PR #17130](https://github.com/BerriAI/litellm/pull/17130)

- **[Databricks](../../docs/providers/databricks)**
    - 更新 Databricks 模型定價並新增新模型 - [PR #17277](https://github.com/BerriAI/litellm/pull/17277)

- **[OVHcloud](../../docs/providers/ovhcloud)**
    - 新增 OVHcloud 的語音轉錄支援 - [PR #17305](https://github.com/BerriAI/litellm/pull/17305)

- **[Mistral](../../docs/providers/mistral)**
    - 新增 Mistral Large 3 模型支援 - [PR #17547](https://github.com/BerriAI/litellm/pull/17547)

- **[Moonshot](../../docs/providers/moonshot)**
    - 修正缺少的 Moonshot turbo 模型並修正不正確的定價 - [PR #17432](https://github.com/BerriAI/litellm/pull/17432)

- **[Together AI](../../docs/providers/togetherai)**
    - 新增 Together AI 的 context window 例外對應 - [PR #17284](https://github.com/BerriAI/litellm/pull/17284)

- **[WatsonX](../../docs/providers/watsonx/index)**
    - 允許動態傳入 zen_api_key - [PR #16655](https://github.com/BerriAI/litellm/pull/16655)
    - 修正 Watsonx Audio Transcription API - [PR #17326](https://github.com/BerriAI/litellm/pull/17326)
    - 修正音訊轉錄，不要在 request headers 中強制指定 content type - [PR #17546](https://github.com/BerriAI/litellm/pull/17546)

- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 新增模型 `fireworks_ai/kimi-k2-instruct-0905` - [PR #17328](https://github.com/BerriAI/litellm/pull/17328)
    - 新增 `fireworks/deepseek-v3p2` - [PR #17395](https://github.com/BerriAI/litellm/pull/17395)

- **[DeepSeek](../../docs/providers/deepseek)**
    - 支援具備 Reasoning 的 Deepseek 3.2 - [PR #17384](https://github.com/BerriAI/litellm/pull/17384)

- **[Nova Lite 2](../../docs/providers/bedrock)**
    - 新增搭配 reasoningConfig 的 Nova Lite 2 reasoning 支援 - [PR #17371](https://github.com/BerriAI/litellm/pull/17371)

- **[Ollama](../../docs/providers/ollama)**
    - 修正 ollama.com 的驗證無法運作 - [PR #17191](https://github.com/BerriAI/litellm/pull/17191)

- **[Groq](../../docs/providers/groq)**
    - 在使用 json_tool_call workaround 之前修正 supports_response_schema - [PR #17438](https://github.com/BerriAI/litellm/pull/17438)

- **[vLLM](../../docs/providers/vllm)**
    - 修正空白回應 + vLLM 串流 - [PR #17516](https://github.com/BerriAI/litellm/pull/17516)

- **[Azure AI](../../docs/providers/azure_ai)**
    - 將 Anthropic 提供者遷移到 Azure AI - [PR #17202](https://github.com/BerriAI/litellm/pull/17202)
    - 修正 Azure OpenAI realtime models 的 GA 路徑 - [PR #17260](https://github.com/BerriAI/litellm/pull/17260)

- **[Bedrock TwelveLabs](../../docs/providers/bedrock#twelvelabs-pegasus---video-understanding)**
    - 新增 TwelveLabs Pegasus 影片理解支援 - [PR #17193](https://github.com/BerriAI/litellm/pull/17193)

### 錯誤修正 {#bug-fixes}

- **[Bedrock](../../docs/providers/bedrock)**
    - 修正 messages API bedrock invoke 中的 extra_headers - [PR #17271](https://github.com/BerriAI/litellm/pull/17271)
    - 修正 model map 中的 Bedrock 模型 - [PR #17419](https://github.com/BerriAI/litellm/pull/17419)
    - 讓 Bedrock converse messages 如預期地遵守 modify_params - [PR #17427](https://github.com/BerriAI/litellm/pull/17427)
    - 修正 Bedrock 匯入的 Qwen 模型的 Anthropic beta 標頭 - [PR #17467](https://github.com/BerriAI/litellm/pull/17467)
    - 保留 Bedrock 中 OpenAI 提供者來自 JSON 回應的 usage - [PR #17589](https://github.com/BerriAI/litellm/pull/17589)

- **[SambaNova](../../docs/providers/sambanova)**
    - 修正使用 SambaNova 模型時 acompletion 會拋出錯誤 - [PR #17217](https://github.com/BerriAI/litellm/pull/17217)

- **一般**
    - 修正 request body 中 metadata 為 null 時的 AttributeError - [PR #17306](https://github.com/BerriAI/litellm/pull/17306)
    - 修正 malformed request 的 500 錯誤 - [PR #17291](https://github.com/BerriAI/litellm/pull/17291)
    - 尊重標頭中的自訂 LLM 提供者 - [PR #17290](https://github.com/BerriAI/litellm/pull/17290)
    - 將 streaming_handler 中已棄用的 .dict() 改為 .model_dump() - [PR #17359](https://github.com/BerriAI/litellm/pull/17359)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 新增 responses API 的成本追蹤 - [PR #17258](https://github.com/BerriAI/litellm/pull/17258)
    - 將 responses API 的 output_tokens_details 對應到 completion_tokens_details - [PR #17458](https://github.com/BerriAI/litellm/pull/17458)
    - 新增 Responses API 的影像生成支援 - [PR #16586](https://github.com/BerriAI/litellm/pull/16586)

- **[Batch API](../../docs/batches)**
    - 新增 vLLM batch+files API 支援 - [PR #15823](https://github.com/BerriAI/litellm/pull/15823)
    - 修正可選參數的預設值 - [PR #17434](https://github.com/BerriAI/litellm/pull/17434)
    - 將 status 參數新增為 FileObject 的可選項 - [PR #17431](https://github.com/BerriAI/litellm/pull/17431)

- **[Video Generation API](../../docs/videos)**
    - 新增 Veo 的 passthrough 成本追蹤 - [PR #17296](https://github.com/BerriAI/litellm/pull/17296)

- **[OCR API](../../docs/ocr)**
    - 將缺少的 OCR 與 aOCR 新增至 CallTypes enum - [PR #17435](https://github.com/BerriAI/litellm/pull/17435)

- **一般**
    - 支援僅路由到支援 websearch 的部署 - [PR #17500](https://github.com/BerriAI/litellm/pull/17500)

#### 錯誤 {#bugs}

- **一般**
    - 修正串流錯誤驗證 - [PR #17242](https://github.com/BerriAI/litellm/pull/17242)
    - 為 delta 中空白 tool_calls 新增長度驗證 - [PR #17523](https://github.com/BerriAI/litellm/pull/17523)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **新登入頁面**
    - 新登入頁面 UI - [PR #17443](https://github.com/BerriAI/litellm/pull/17443)
    - 重構 /login 路由 - [PR #17379](https://github.com/BerriAI/litellm/pull/17379)
    - 在 UI Config 新增 auto_redirect_to_sso - [PR #17399](https://github.com/BerriAI/litellm/pull/17399)
    - 在新登入頁面新增自動重新導向至 SSO - [PR #17451](https://github.com/BerriAI/litellm/pull/17451)

- **Customer（終端使用者）Usage**
    - Customer（終端使用者）Usage 功能 - [PR #17498](https://github.com/BerriAI/litellm/pull/17498)
    - 客戶使用量 UI - [PR #17506](https://github.com/BerriAI/litellm/pull/17506)
    - 為 Customer Usage 新增資訊橫幅 - [PR #17598](https://github.com/BerriAI/litellm/pull/17598)

- **虛擬金鑰**
    - 在 UI 中標準化 API Key 與 Virtual Key 的稱呼 - [PR #17325](https://github.com/BerriAI/litellm/pull/17325)
    - 在內部使用者表格新增 User Alias 欄位 - [PR #17321](https://github.com/BerriAI/litellm/pull/17321)
    - 刪除憑證增強功能 - [PR #17317](https://github.com/BerriAI/litellm/pull/17317)

- **模型 + 端點**
    - 在編輯憑證對話框中顯示所有憑證值 - [PR #17397](https://github.com/BerriAI/litellm/pull/17397)
    - 變更編輯團隊顯示的模型以符合建立團隊 - [PR #17394](https://github.com/BerriAI/litellm/pull/17394)
    - 在比較介面中支援圖片 - [PR #17562](https://github.com/BerriAI/litellm/pull/17562)

- **回呼**
    - 在 UI 上顯示所有回呼 - [PR #16335](https://github.com/BerriAI/litellm/pull/16335)
    - 憑證改用 React Query - [PR #17465](https://github.com/BerriAI/litellm/pull/17465)

- **管理路由**
    - 允許管理員檢視者存取全域標籤使用量 - [PR #17501](https://github.com/BerriAI/litellm/pull/17501)
    - 允許非 proxy 管理員（SCIM）使用萬用字元路由 - [PR #17178](https://github.com/BerriAI/litellm/pull/17178)
    - 當 /user/info 找不到使用者時回傳 404 - [PR #16850](https://github.com/BerriAI/litellm/pull/16850)

- **OCI 組態**
    - 透過 UI 啟用 Oracle Cloud Infrastructure 組態 - [PR #17159](https://github.com/BerriAI/litellm/pull/17159)

#### 錯誤 {#bugs-1}

- **UI 修正**
    - 修正 Request 與 Response 面板的 JSONViewer - [PR #17233](https://github.com/BerriAI/litellm/pull/17233)
    - 在編輯設定中新增按鈕載入狀態 - [PR #17236](https://github.com/BerriAI/litellm/pull/17236)
    - 修正多項文字、按鈕狀態與測試變更 - [PR #17237](https://github.com/BerriAI/litellm/pull/17237)
    - 修正備援在 API 回應前立即刪除的問題 - [PR #17238](https://github.com/BerriAI/litellm/pull/17238)
    - 移除功能旗標 - [PR #17240](https://github.com/BerriAI/litellm/pull/17240)
    - 修正在 Azure passthrough 的 UI 中中繼資料標籤與模型名稱顯示 - [PR #17258](https://github.com/BerriAI/litellm/pull/17258)
    - 變更 Vertex 欄位周邊的標示 - [PR #17383](https://github.com/BerriAI/litellm/pull/17383)
    - 在側邊欄展開時移除第二個捲軸 + tooltip z index - [PR #17436](https://github.com/BerriAI/litellm/pull/17436)
    - 修正編輯成員資格對話框中的 Select - [PR #17524](https://github.com/BerriAI/litellm/pull/17524)
    - 變更 useAuthorized Hook 以重新導向至新的登入頁面 - [PR #17553](https://github.com/BerriAI/litellm/pull/17553)

- **SSO**
    - 修正通用 SSO 提供者 - [PR #17227](https://github.com/BerriAI/litellm/pull/17227)
    - 清除所有使用者的 SSO 整合 - [PR #17287](https://github.com/BerriAI/litellm/pull/17287)
    - 修正 SSO 使用者未加入 Entra 同步團隊的問題 - [PR #17331](https://github.com/BerriAI/litellm/pull/17331)

- **Auth / JWT**
    - JWT Auth - 允許使用一般 OIDC flow 搭配 user info endpoints - [PR #17324](https://github.com/BerriAI/litellm/pull/17324)
    - 修正 litellm user auth 未通過的問題 - [PR #17342](https://github.com/BerriAI/litellm/pull/17342)
    - 在 JWT auth 中新增其他路由 - [PR #17345](https://github.com/BerriAI/litellm/pull/17345)
    - 修正新的 org team 對 org 的驗證 - [PR #17333](https://github.com/BerriAI/litellm/pull/17333)
    - 修正 litellm_enterprise，確保已匯入的路由存在 - [PR #17337](https://github.com/BerriAI/litellm/pull/17337)
    - 使用 organization.members 取代已棄用的 organization 欄位 - [PR #17557](https://github.com/BerriAI/litellm/pull/17557)

- **組織／團隊**
    - 修正未強制執行 organization 最大預算的問題 - [PR #17334](https://github.com/BerriAI/litellm/pull/17334)
    - 修正預算更新以允許 null max_budget - [PR #17545](https://github.com/BerriAI/litellm/pull/17545)

---

## AI 整合（2 個新整合） {#ai-integrations-2-new-integrations}

### 記錄（1 個新整合） {#logging-1-new-integration}

#### 新整合 {#new-integration}

- **[Weave](../../docs/proxy/logging)**
    - 基本 Weave OTEL 整合 - [PR #17439](https://github.com/BerriAI/litellm/pull/17439)

#### 改進與修正 {#improvements--fixes}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 修正安裝 ddtrace 時 Datadog 回呼回歸問題 - [PR #17393](https://github.com/BerriAI/litellm/pull/17393)

- **[Arize Phoenix](../../docs/observability/arize_integration)**
    - 修正乾淨的 arize-phoenix traces - [PR #16611](https://github.com/BerriAI/litellm/pull/16611)

- **[MLflow](../../docs/proxy/logging#mlflow)**
    - 修正 Anthropic passthrough 的 MLflow 串流 spans - [PR #17288](https://github.com/BerriAI/litellm/pull/17288)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 Langfuse logger 測試 mock 設定 - [PR #17591](https://github.com/BerriAI/litellm/pull/17591)

- **一般**
    - 改進記錄回呼中的 PII 去識別處理 - [PR #17207](https://github.com/BerriAI/litellm/pull/17207)

### 防護欄（1 個新整合） {#guardrails-1-new-integration}

#### 新整合 {#new-integration-1}

- **[Generic Guardrail API](../../docs/adding_provider/generic_guardrail_api)**
    - Generic Guardrail API - 允許防護欄提供者無需向 repo 提交 PR 就能為 LiteLLM 新增 INSTANT 支援 - [PR #17175](https://github.com/BerriAI/litellm/pull/17175)
    - Guardrails API V2 - 使用者 API 金鑰中繼資料、session id、指定輸入類型（request/response）、圖片支援 - [PR #17338](https://github.com/BerriAI/litellm/pull/17338)
    - Guardrails API - 新增串流支援 - [PR #17400](https://github.com/BerriAI/litellm/pull/17400)
    - Guardrails API - 支援在 OpenAI `/chat/completions`、OpenAI `/responses`、Anthropic `/v1/messages` 上進行工具呼叫檢查 - [PR #17459](https://github.com/BerriAI/litellm/pull/17459)
    - Guardrails API - 新的 `structured_messages` 參數 - [PR #17518](https://github.com/BerriAI/litellm/pull/17518)
    - 正確將 v1/messages 呼叫對應到 anthropic unified guardrail - [PR #17424](https://github.com/BerriAI/litellm/pull/17424)
    - 支援 unified guardrails 的 during_call 事件類型 - [PR #17514](https://github.com/BerriAI/litellm/pull/17514)

#### 改進與修正 {#improvements--fixes-1}

- **[Noma Guardrail](../../docs/proxy/guardrails/noma_security)**
    - 重構 Noma guardrail 以使用共用的 Responses 轉換並包含系統指示 - [PR #17315](https://github.com/BerriAI/litellm/pull/17315)

- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 處理 guardrails 中空內容與錯誤 dict 回應 - [PR #17489](https://github.com/BerriAI/litellm/pull/17489)
    - 修正 Presidio guardrail 測試 TypeError 與授權 base64 解碼錯誤 - [PR #17538](https://github.com/BerriAI/litellm/pull/17538)

- **[Tool Permissions](../../docs/proxy/guardrails/tool_permission)**
    - 為 tool-permission 新增基於 regex 的 tool_name/tool_type 匹配 - [PR #17164](https://github.com/BerriAI/litellm/pull/17164)
    - 為工具權限防護欄文件新增圖片 - [PR #17322](https://github.com/BerriAI/litellm/pull/17322)

- **[AIM Guardrails](../../docs/proxy/guardrails/aim_security)**
    - 修正 AIM guardrail 測試 - [PR #17499](https://github.com/BerriAI/litellm/pull/17499)

- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 修正 Bedrock Guardrail 縮排與匯入 - [PR #17378](https://github.com/BerriAI/litellm/pull/17378)

- **一般 Guardrails**
    - 將內容過濾器中所有符合的關鍵字遮罩 - [PR #17521](https://github.com/BerriAI/litellm/pull/17521)
    - 確保 request_data 中保留 guardrail 中繼資料 - [PR #17593](https://github.com/BerriAI/litellm/pull/17593)
    - 修正 apply_guardrail 方法並改善測試隔離性 - [PR #17555](https://github.com/BerriAI/litellm/pull/17555)

### 密鑰管理器 {#secret-managers}

- **[CyberArk](../../docs/secret_managers/cyberark)**
    - 允許將 SSL verify 設為 false - [PR #17433](https://github.com/BerriAI/litellm/pull/17433)

- **一般**
    - 讓 email 與 secret manager 操作在 key management hooks 中彼此獨立 - [PR #17551](https://github.com/BerriAI/litellm/pull/17551)

---

## 花費追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **速率限制**
    - 搭配 /messages 的平行請求限制器 - [PR #17426](https://github.com/BerriAI/litellm/pull/17426)
    - 允許在團隊上使用動態速率限制/優先順序保留 - [PR #17061](https://github.com/BerriAI/litellm/pull/17061)
    - 動態速率限制器 - 修正 token 計數增減 1 而非實際數量 + Redis TTL - [PR #17558](https://github.com/BerriAI/litellm/pull/17558)

- **花費記錄**
    - 廢除 `spend/logs` 並新增 `spend/logs/v2` - [PR #17167](https://github.com/BerriAI/litellm/pull/17167)
    - 最佳化 SpendLogs 查詢，以使用時間戳記篩選來利用索引 - [PR #17504](https://github.com/BerriAI/litellm/pull/17504)

- **強制使用者參數**
    - 強制支援將 enforce_user_param 套用到 OpenAI post endpoints - [PR #17407](https://github.com/BerriAI/litellm/pull/17407)

---

## MCP 閘道 {#mcp-gateway}

- **MCP 組態**
    - 移除 MCP 伺服器端點的 URL 格式驗證 - [PR #17270](https://github.com/BerriAI/litellm/pull/17270)
    - 在 MCP 錯誤訊息中新增堆疊追蹤 - [PR #17269](https://github.com/BerriAI/litellm/pull/17269)

- **MCP 工具結果**
    - 在 CallToolResult 中保留工具中繼資料 - [PR #17561](https://github.com/BerriAI/litellm/pull/17561)

---

## 代理程式閘道（A2A） {#agent-gateway-a2a-1}

- **代理程式呼叫**
    - 允許透過 AI Gateway 呼叫代理程式 - [PR #17440](https://github.com/BerriAI/litellm/pull/17440)
    - 允許在「Logs」頁面追蹤 request/response - [PR #17449](https://github.com/BerriAI/litellm/pull/17449)

- **代理程式存取控制**
    - 依 key、team 強制允許的 agents + 在後端新增 agent 存取群組 - [PR #17502](https://github.com/BerriAI/litellm/pull/17502)

- **代理程式閘道 UI**
    - 允許在 UI 上測試 agents - [PR #17455](https://github.com/BerriAI/litellm/pull/17455)
    - 依 key、team 設定允許的 agents - [PR #17511](https://github.com/BerriAI/litellm/pull/17511)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **音訊/語音效能**
    - 透過使用 `shared_sessions` 修正 `/audio/speech` 效能 - [PR #16739](https://github.com/BerriAI/litellm/pull/16739)

- **記憶體最佳化**
    - 防止 aiohttp 連線池中的記憶體洩漏 - [PR #17388](https://github.com/BerriAI/litellm/pull/17388)
    - 延遲載入 utils 以減少記憶體用量 + 匯入時間 - [PR #17171](https://github.com/BerriAI/litellm/pull/17171)

- **資料庫**
    - 更新預設資料庫連線數量 - [PR #17353](https://github.com/BerriAI/litellm/pull/17353)
    - 更新預設 proxy_batch_write_at 數量 - [PR #17355](https://github.com/BerriAI/litellm/pull/17355)
    - 為 db 新增背景健康檢查 - [PR #17528](https://github.com/BerriAI/litellm/pull/17528)

- **Proxy 快取**
    - 修正 aiohttp transport 中請求之間的 proxy 快取 - [PR #17122](https://github.com/BerriAI/litellm/pull/17122)

- **工作階段管理**
    - 修正工作階段一致性，將 Lasso API version 從原始碼中移出 - [PR #17316](https://github.com/BerriAI/litellm/pull/17316)
    - 有條件地將 enable_cleanup_closed 傳遞給 aiohttp TCPConnector - [PR #17367](https://github.com/BerriAI/litellm/pull/17367)

- **向量儲存**
    - 修正向量儲存組態同步失敗 - [PR #17525](https://github.com/BerriAI/litellm/pull/17525)

---

## 文件更新 {#documentation-updates}

- **提供者文件**
    - 為 Claude 模型新增 Azure AI Foundry 文件 - [PR #17104](https://github.com/BerriAI/litellm/pull/17104)
    - 記錄 GitHub Copilot 的 responses 和 embedding API - [PR #17456](https://github.com/BerriAI/litellm/pull/17456)
    - 將 gpt-5.1-codex-max 新增至 OpenAI 提供者文件 - [PR #17602](https://github.com/BerriAI/litellm/pull/17602)
    - 更新 Phoenix 整合說明 - [PR #17373](https://github.com/BerriAI/litellm/pull/17373)

- **指南**
    - 新增如何除錯 gateway error 與 provider error 的指南 - [PR #17387](https://github.com/BerriAI/litellm/pull/17387)
    - Agent Gateway 文件 - [PR #17454](https://github.com/BerriAI/litellm/pull/17454)
    - A2A 權限管理文件 - [PR #17515](https://github.com/BerriAI/litellm/pull/17515)
    - 更新文件以連結 agent hub - [PR #17462](https://github.com/BerriAI/litellm/pull/17462)

- **專案**
    - 將 Google ADK 和 Harbor 新增至專案 - [PR #17352](https://github.com/BerriAI/litellm/pull/17352)
    - 將 Microsoft Agent Lightning 新增至專案 - [PR #17422](https://github.com/BerriAI/litellm/pull/17422)

- **清理**
    - 清理：移除孤兒文件頁面和 Docusaurus 樣板檔案 - [PR #17356](https://github.com/BerriAI/litellm/pull/17356)
    - 從文件中移除 `source .env` - [PR #17466](https://github.com/BerriAI/litellm/pull/17466)

---

## 基礎架構 / CI/CD {#infrastructure--cicd}

- **Helm Chart**
    - 新增僅入口點標籤 - [PR #17348](https://github.com/BerriAI/litellm/pull/17348)

- **Docker**
    - 為 Dockerfile.non_root 中的 apk 套件安裝新增重試邏輯 - [PR #17596](https://github.com/BerriAI/litellm/pull/17596)
    - Chainguard 修正 - [PR #17406](https://github.com/BerriAI/litellm/pull/17406)

- **OpenAPI 結構描述**
    - 重構 add_schema_to_components，將定義移至 components/schemas - [PR #17389](https://github.com/BerriAI/litellm/pull/17389)

- **安全性**
    - 修正安全性漏洞：將 mdast-util-to-hast 更新至 13.2.1 - [PR #17601](https://github.com/BerriAI/litellm/pull/17601)
    - 將 jws 從 3.2.2 升級至 3.2.3 - [PR #17494](https://github.com/BerriAI/litellm/pull/17494)

---

## 新貢獻者 {#new-contributors}

* @weichiet 完成了他們的第一次貢獻於 [PR #17242](https://github.com/BerriAI/litellm/pull/17242)
* @AndyForest 完成了他們的第一次貢獻於 [PR #17220](https://github.com/BerriAI/litellm/pull/17220)
* @omkar806 完成了他們的第一次貢獻於 [PR #17217](https://github.com/BerriAI/litellm/pull/17217)
* @v0rtex20k 完成了他們的第一次貢獻於 [PR #17178](https://github.com/BerriAI/litellm/pull/17178)
* @hxomer 完成了他們的第一次貢獻於 [PR #17207](https://github.com/BerriAI/litellm/pull/17207)
* @orgersh92 完成了他們的第一次貢獻於 [PR #17316](https://github.com/BerriAI/litellm/pull/17316)
* @dannykopping 完成了他們的第一次貢獻於 [PR #17313](https://github.com/BerriAI/litellm/pull/17313)
* @rioiart 完成了他們的第一次貢獻於 [PR #17333](https://github.com/BerriAI/litellm/pull/17333)
* @codgician 完成了他們的第一次貢獻於 [PR #17278](https://github.com/BerriAI/litellm/pull/17278)
* @epistoteles 完成了他們的第一次貢獻於 [PR #17277](https://github.com/BerriAI/litellm/pull/17277)
* @kothamah 完成了他們的第一次貢獻於 [PR #17368](https://github.com/BerriAI/litellm/pull/17368)
* @flozonn 完成了他們的第一次貢獻於 [PR #17371](https://github.com/BerriAI/litellm/pull/17371)
* @richardmcsong 完成了他們的第一次貢獻於 [PR #17389](https://github.com/BerriAI/litellm/pull/17389)
* @matt-greathouse 完成了他們的第一次貢獻於 [PR #17384](https://github.com/BerriAI/litellm/pull/17384)
* @mossbanay 完成了他們的第一次貢獻於 [PR #17380](https://github.com/BerriAI/litellm/pull/17380)
* @mhielpos-asapp 完成了他們的第一次貢獻於 [PR #17376](https://github.com/BerriAI/litellm/pull/17376)
* @Joilence 完成了他們的第一次貢獻於 [PR #17367](https://github.com/BerriAI/litellm/pull/17367)
* @deepaktammali 完成了他們的第一次貢獻於 [PR #17357](https://github.com/BerriAI/litellm/pull/17357)
* @axiomofjoy 完成了他們的第一次貢獻於 [PR #16611](https://github.com/BerriAI/litellm/pull/16611)
* @DevajMody 完成了他們的第一次貢獻於 [PR #17445](https://github.com/BerriAI/litellm/pull/17445)
* @andrewtruong 完成了他們的第一次貢獻於 [PR #17439](https://github.com/BerriAI/litellm/pull/17439)
* @AnasAbdelR 完成了他們的第一次貢獻於 [PR #17490](https://github.com/BerriAI/litellm/pull/17490)
* @dominicfeliton 完成了他們的第一次貢獻於 [PR #17516](https://github.com/BerriAI/litellm/pull/17516)
* @kristianmitk 完成了他們的第一次貢獻於 [PR #17504](https://github.com/BerriAI/litellm/pull/17504)
* @rgshr 完成了他們的第一次貢獻於 [PR #17130](https://github.com/BerriAI/litellm/pull/17130)
* @dominicfallows 完成了他們的第一次貢獻於 [PR #17489](https://github.com/BerriAI/litellm/pull/17489)
* @irfansofyana 完成了他們的第一次貢獻於 [PR #17467](https://github.com/BerriAI/litellm/pull/17467)
* @GusBricker 完成了他們的第一次貢獻於 [PR #17191](https://github.com/BerriAI/litellm/pull/17191)
* @OlivverX 完成了他們的第一次貢獻於 [PR #17255](https://github.com/BerriAI/litellm/pull/17255)
* @withsmilo 完成了他們的第一次貢獻於 [PR #17585](https://github.com/BerriAI/litellm/pull/17585)

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上檢視完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.80.7-nightly...v1.80.8)**
