---
title: "[Preview] v1.80.10.rc.1 - Agent Gateway: Azure Foundry & Bedrock AgentCore"
slug: "v1-80-10"
date: 2025-12-13T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.80.10.rc.1
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.80.10
```

</TabItem>
</Tabs>

---

## 重點摘要 {#key-highlights}

- **具成本追蹤的 Agent (A2A) 閘道** - [依每次查詢、每個 token 定價追蹤 agent 成本，並在儀表板中查看 agent 用量](../../docs/a2a_cost_tracking)
- **2 個新的 Agent 提供者** - [LangGraph Agents](../../docs/providers/langgraph) 與 [Azure AI Foundry Agents](../../docs/providers/azure_ai_agents)，適用於 agentic 工作流程
- **新的提供者：SAP Gen AI Hub** - [完整支援 SAP Generative AI Hub 與聊天補全](../../docs/providers/sap)
- **新的 Bedrock Writer Models** - 在 Bedrock 上新增 Palmyra-X4 與 Palmyra-X5 模型
- **OpenAI GPT-5.2 Models** - 完整支援 GPT-5.2、GPT-5.2-pro 以及具推理支援的 Azure GPT-5.2 模型
- **227 個新的 Fireworks AI Models** - Fireworks AI 平台的完整模型涵蓋
- **/chat/completions 的 MCP 支援** - [直接透過 chat completions 端點使用 MCP 伺服器](../../docs/mcp)
- **效能改進** - 記憶體洩漏減少 50%

---

### Agent 閘道 - 4 個新的 Agent 提供者 {#agent-gateway---4-new-agent-providers}

<Image
img={require('../../img/a2a_gateway2.png')}
style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br/>

此版本新增對下列提供者的 agents 支援：
- **LangGraph Agents** - 部署與管理以 LangGraph 為基礎的 agents
- **Azure AI Foundry Agents** - Azure 上的企業 agent 部署
- **Bedrock AgentCore** - AWS Bedrock agent 整合
- **A2A Agents** - 支援 Agent-to-Agent 協定

AI Gateway 管理員現在可以從這些提供者中新增 agents，開發者則可透過使用 A2A 協定的統一介面來呼叫它們。

對於所有透過 AI Gateway 執行的 agent 請求，LiteLLM 會自動追蹤請求/回應記錄、成本與 token 用量。 

### Agent (A2A) 用量 UI {#agent-a2a-usage-ui}

<Image
img={require('../../img/agent_usage.png')}
style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

使用者現在可以依 agent 篩選用量統計，提供與團隊、組織和客戶相同的細緻篩選功能。

**詳細資訊：**

- 依 agent ID 篩選用量分析、支出記錄與活動指標
- 以每個 agent 為基礎查看明細
- 在所有用量與分析檢視中提供一致的篩選體驗

---

## 新的提供者與端點 {#new-providers-and-endpoints}

### 新的提供者（5 個新提供者） {#new-providers-5-new-providers}

| 提供者 | 支援的 LiteLLM 端點 | 說明 |
| -------- | ------------------- | ----------- |
| [SAP Gen AI Hub](../../docs/providers/sap) | `/chat/completions`, `/messages`, `/responses` | 企業 AI 的 SAP Generative AI Hub 整合 |
| [LangGraph](../../docs/providers/langgraph) | `/chat/completions`, `/messages`, `/responses`, `/a2a` | 用於 agentic 工作流程的 LangGraph agents |
| [Azure AI Foundry Agents](../../docs/providers/azure_ai_agents) | `/chat/completions`, `/messages`, `/responses`, `/a2a` | 用於企業 agent 部署的 Azure AI Foundry Agents |
| [Voyage AI Rerank](../../docs/providers/voyage) | `/rerank` | Voyage AI rerank 模型支援 |
| [Fireworks AI Rerank](../../docs/providers/fireworks_ai) | `/rerank` | Fireworks AI rerank 端點支援 |

### 新的 LLM API 端點（4 個新端點） {#new-llm-api-endpoints-4-new-endpoints}

| 端點 | 方法 | 說明 | 文件 |
| -------- | ------ | ----------- | ------------- |
| `/containers/{id}/files` | GET | 列出容器中的檔案 | [文件](../../docs/container_files) |
| `/containers/{id}/files/{file_id}` | GET | 取得容器檔案中繼資料 | [文件](../../docs/container_files) |
| `/containers/{id}/files/{file_id}` | DELETE | 從容器中刪除檔案 | [文件](../../docs/container_files) |
| `/containers/{id}/files/{file_id}/content` | GET | 取得容器檔案內容 | [文件](../../docs/container_files) |

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（270+ 個新模型） {#new-model-support-270-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.2` | 400K | $1.75 | $14.00 | 推理、vision、PDF、快取 |
| OpenAI | `gpt-5.2-pro` | 400K | $21.00 | $168.00 | 推理、web search、vision |
| Azure | `azure/gpt-5.2` | 400K | $1.75 | $14.00 | 推理、vision、PDF、快取 |
| Azure | `azure/gpt-5.2-pro` | 400K | $21.00 | $168.00 | 推理、web search |
| Bedrock | `us.writer.palmyra-x4-v1:0` | 128K | $2.50 | $10.00 | 函式呼叫、PDF 輸入 |
| Bedrock | `us.writer.palmyra-x5-v1:0` | 1M | $0.60 | $6.00 | 函式呼叫、PDF 輸入 |
| Bedrock | `eu.anthropic.claude-opus-4-5-20251101-v1:0` | 200K | $5.00 | $25.00 | 推理、電腦使用、vision |
| Bedrock | `google.gemma-3-12b-it` | 128K | $0.10 | $0.30 | 音訊輸入 |
| Bedrock | `moonshot.kimi-k2-thinking` | 128K | $0.60 | $2.50 | 推理 |
| Bedrock | `nvidia.nemotron-nano-12b-v2` | 128K | $0.20 | $0.60 | 視覺 |
| Bedrock | `qwen.qwen3-next-80b-a3b` | 128K | $0.15 | $1.20 | 函式呼叫 |
| Vertex AI | `vertex_ai/deepseek-ai/deepseek-v3.2-maas` | 164K | $0.56 | $1.68 | 推理、快取 |
| Mistral | `mistral/codestral-2508` | 256K | $0.30 | $0.90 | 函式呼叫 |
| Mistral | `mistral/devstral-2512` | 256K | $0.40 | $2.00 | 函式呼叫 |
| Mistral | `mistral/labs-devstral-small-2512` | 256K | $0.10 | $0.30 | 函式呼叫 |
| Cerebras | `cerebras/zai-glm-4.6` | 128K | - | - | 聊天補全 |
| NVIDIA NIM | `nvidia_nim/ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2` | - | 免費 | 免費 | Rerank |
| Voyage | `voyage/rerank-2.5` | 32K | $0.05/1K tokens | - | Rerank |
| Fireworks AI | 227 個新模型 | 各種 | 各種 | 各種 | 完整模型目錄 |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 新增對 OpenAI GPT-5.2 模型的支援，並支援 reasoning_effort='xhigh' - [PR #17836](https://github.com/BerriAI/litellm/pull/17836), [PR #17875](https://github.com/BerriAI/litellm/pull/17875)
    - 為 responses API 模型加入 'user' 參數 - [PR #17648](https://github.com/BerriAI/litellm/pull/17648)
    - 為文字 completions 使用最佳化的 async HTTP client - [PR #17831](https://github.com/BerriAI/litellm/pull/17831)
- **[Azure](../../docs/providers/azure)**
    - 新增 Azure GPT-5.2 模型支援 - [PR #17866](https://github.com/BerriAI/litellm/pull/17866)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 修正 Azure AI Anthropic api-key 標頭與 passthrough 成本計算 - [PR #17656](https://github.com/BerriAI/litellm/pull/17656)
    - 移除 Azure AI Anthropic 請求中不支援的參數 - [PR #17822](https://github.com/BerriAI/litellm/pull/17822)
- **[Anthropic](../../docs/providers/anthropic)**
    - 防止相同 tool 的重複 tool_result 區塊 - [PR #17632](https://github.com/BerriAI/litellm/pull/17632)
    - 處理串流回應中的部分 JSON 區塊 - [PR #17493](https://github.com/BerriAI/litellm/pull/17493)
    - 在多輪對話中保留 server_tool_use 與 web_search_tool_result - [PR #17746](https://github.com/BerriAI/litellm/pull/17746)
    - 在多輪對話的串流中擷取 web_search_tool_result - [PR #17798](https://github.com/BerriAI/litellm/pull/17798)
    - 新增 retrieve batches 與 retrieve file content 支援 - [PR #17700](https://github.com/BerriAI/litellm/pull/17700)
- **[Bedrock](../../docs/providers/bedrock)**
    - 將新的 Bedrock OSS 模型加入模型清單 - [PR #17638](https://github.com/BerriAI/litellm/pull/17638)
    - 新增 Bedrock Writer 模型（Palmyra-X4、Palmyra-X5） - [PR #17685](https://github.com/BerriAI/litellm/pull/17685)
    - 新增 EU Claude Opus 4.5 模型 - [PR #17897](https://github.com/BerriAI/litellm/pull/17897)
    - 為 Converse API 新增 serviceTier 支援 - [PR #17810](https://github.com/BerriAI/litellm/pull/17810)
    - 修正 Bedrock embeddings 使用自訂 API 時的標頭轉送 - [PR #17872](https://github.com/BerriAI/litellm/pull/17872)
- **[Gemini](../../docs/providers/gemini)**
    - 新增對 Gemini 電腦使用的支援 - [PR #17756](https://github.com/BerriAI/litellm/pull/17756)
    - 處理 context window 錯誤 - [PR #17751](https://github.com/BerriAI/litellm/pull/17751)
    - 為 Gemini TTS 的 GenerationConfig 新增 speechConfig - [PR #17851](https://github.com/BerriAI/litellm/pull/17851)
- **[Vertex AI](../../docs/providers/vertex)**
    - 新增 DeepSeek-V3.2 模型支援 - [PR #17770](https://github.com/BerriAI/litellm/pull/17770)
    - 在 generate content 請求中保留 systemInstructions - [PR #17803](https://github.com/BerriAI/litellm/pull/17803)
- **[Mistral](../../docs/providers/mistral)**
    - 新增 Codestral 2508、Devstral 2512 模型 - [PR #17801](https://github.com/BerriAI/litellm/pull/17801)
- **[Cerebras](../../docs/providers/cerebras)**
    - 新增 zai-glm-4.6 模型支援 - [PR #17683](https://github.com/BerriAI/litellm/pull/17683)
    - 修正未被辨識的 context window 錯誤 - [PR #17587](https://github.com/BerriAI/litellm/pull/17587)
- **[DeepSeek](../../docs/providers/deepseek)**
    - 新增對 thinking 與 reasoning_effort 參數的原生支援 - [PR #17712](https://github.com/BerriAI/litellm/pull/17712)
- **[NVIDIA NIM Rerank](../../docs/providers/nvidia_nim_rerank)**
    - 新增 llama-3.2-nv-rerankqa-1b-v2 rerank 模型 - [PR #17670](https://github.com/BerriAI/litellm/pull/17670)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 新增 227 個 Fireworks AI 模型 - [PR #17692](https://github.com/BerriAI/litellm/pull/17692)
- **[Dashscope](../../docs/providers/dashscope)**
    - 修正預設 base_url 錯誤 - [PR #17584](https://github.com/BerriAI/litellm/pull/17584)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 Anthropic 轉換為 OpenAI 時缺少內容的問題 - [PR #17693](https://github.com/BerriAI/litellm/pull/17693)
    - 當輸入中只有 tool_calls 時避免發生錯誤 - [PR #17753](https://github.com/BerriAI/litellm/pull/17753)
- **[Azure](../../docs/providers/azure)**
    - 修正 Azure 的 video id 編碼錯誤 - [PR #17708](https://github.com/BerriAI/litellm/pull/17708)
- **[Azure AI](../../docs/providers/azure_ai)**
    - 修正 model map 中 azure_ai 的 LLM 提供者 - [PR #17805](https://github.com/BerriAI/litellm/pull/17805)
- **[Watsonx](../../docs/providers/watsonx)**
    - 修正 Watsonx Audio Transcription 只將支援的參數傳送到 API - [PR #17840](https://github.com/BerriAI/litellm/pull/17840)
- **[路由器](../../docs/routing)**
    - 在 completion 請求中處理 tools=None - [PR #17684](https://github.com/BerriAI/litellm/pull/17684)
    - 為錯誤率冷卻期新增最小請求門檻 - [PR #17464](https://github.com/BerriAI/litellm/pull/17464)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 在 responses usage 物件中新增用量詳細資訊 - [PR #17641](https://github.com/BerriAI/litellm/pull/17641)
    - 修正 response API 輪詢錯誤 - [PR #17654](https://github.com/BerriAI/litellm/pull/17654)
    - 修正文字 + tool_calls 時串流的 tool_calls 被捨棄的問題 - [PR #17652](https://github.com/BerriAI/litellm/pull/17652)
    - 將 Responses API 的 tool results 中的影像內容進行轉換 - [PR #17799](https://github.com/BerriAI/litellm/pull/17799)
    - 修正 responses api 未對 api keys 套用 tpm rate limits 的問題 - [PR #17707](https://github.com/BerriAI/litellm/pull/17707)
- **[Containers API](../../docs/containers)**
    - 允許使用 LIST，透過 custom-llm-provider 建立 Containers - [PR #17740](https://github.com/BerriAI/litellm/pull/17740)
    - 新增 container API 檔案管理 + UI 介面 - [PR #17745](https://github.com/BerriAI/litellm/pull/17745)
- **[Rerank API](../../docs/rerank)**
    - 新增在 /rerank 端點轉送用戶端標頭的支援 - [PR #17873](https://github.com/BerriAI/litellm/pull/17873)
- **[Files API](../../docs/files_endpoints)**
    - 為 Files 端點新增 expires_after 參數支援 - [PR #17860](https://github.com/BerriAI/litellm/pull/17860)
- **[Video API](../../docs/videos)**
    - 所有 videos APIs 使用 litellm 參數 - [PR #17732](https://github.com/BerriAI/litellm/pull/17732)
    - 尊重 videos content db 憑證 - [PR #17771](https://github.com/BerriAI/litellm/pull/17771)
- **[Embeddings API](../../docs/proxy/embedding)**
    - 修正 embeddings 的 token array 輸入解碼處理 - [PR #17468](https://github.com/BerriAI/litellm/pull/17468)
- **[Chat Completions API](../../docs/completion/input)**
    - 新增 v0 target storage 支援 - 將檔案儲存在 Azure AI storage，並與 chat completions API 搭配使用 - [PR #17758](https://github.com/BerriAI/litellm/pull/17758)
- **[generateContent API](../../docs/providers/gemini)**
    - 支援 Gemini generateContent 端點中含有斜線的模型名稱 - [PR #17743](https://github.com/BerriAI/litellm/pull/17743)
- **一般**
    - 使用音訊內容進行快取 - [PR #17651](https://github.com/BerriAI/litellm/pull/17651)
    - 呼叫 GET responses API 時回傳 403 例外 - [PR #17629](https://github.com/BerriAI/litellm/pull/17629)
    - 為 additional_drop_params 新增巢狀欄位移除支援 - [PR #17711](https://github.com/BerriAI/litellm/pull/17711)
    - Async post_call_streaming_iterator_hook 現在可正確迭代 async generators - [PR #17626](https://github.com/BerriAI/litellm/pull/17626)

#### 錯誤 {#bugs}

- **一般**
    - 修正 is_cached_message 中對字串內容的處理 - [PR #17853](https://github.com/BerriAI/litellm/pull/17853)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **UI 設定**
    - 為 UI 設定新增 Get 與 Update 後端路由 - [PR #17689](https://github.com/BerriAI/litellm/pull/17689)
    - UI 設定頁面實作 - [PR #17697](https://github.com/BerriAI/litellm/pull/17697)
    - 確保 Model 頁面遵循 UI 設定 - [PR #17804](https://github.com/BerriAI/litellm/pull/17804)
    - 將所有 Proxy Models 新增至預設使用者設定 - [PR #17902](https://github.com/BerriAI/litellm/pull/17902)
- **Agent 與 Usage UI**
    - 每日 Agent 使用量後端 - [PR #17781](https://github.com/BerriAI/litellm/pull/17781)
    - Agent 使用量 UI - [PR #17797](https://github.com/BerriAI/litellm/pull/17797)
    - 在 UI 上新增 agent 成本追蹤 - [PR #17899](https://github.com/BerriAI/litellm/pull/17899)
    - Agent 使用量新徽章 - [PR #17883](https://github.com/BerriAI/litellm/pull/17883)
    - 用於篩選的 Usage Entity 標籤 - [PR #17896](https://github.com/BerriAI/litellm/pull/17896)
    - Agent 使用量頁面小修正 - [PR #17901](https://github.com/BerriAI/litellm/pull/17901)
    - Usage 頁面檢視選擇元件 - [PR #17854](https://github.com/BerriAI/litellm/pull/17854)
    - Usage 頁面元件重構 - [PR #17848](https://github.com/BerriAI/litellm/pull/17848)
- **Logs 與 Spend**
    - 增強 logs 檢視中的 spend 分析 - [PR #17623](https://github.com/BerriAI/litellm/pull/17623)
    - 為使用者管理新增使用者資訊刪除對話框 - [PR #17625](https://github.com/BerriAI/litellm/pull/17625)
    - 在 logs 檢視中顯示請求與回應詳細資訊 - [PR #17928](https://github.com/BerriAI/litellm/pull/17928)
- **虛擬金鑰**
    - 修正 x-litellm-key-spend 標頭更新 - [PR #17864](https://github.com/BerriAI/litellm/pull/17864)
- **Models 與 Endpoints**
    - Model Hub 有用連結重新排列 - [PR #17859](https://github.com/BerriAI/litellm/pull/17859)
    - Create Team Model 下拉式選單遵循組織的 Models - [PR #17834](https://github.com/BerriAI/litellm/pull/17834)
- **SSO 與 Auth**
    - 當 SSO 提供者角色變更時，允許 upsert 使用者角色 - [PR #17754](https://github.com/BerriAI/litellm/pull/17754)
    - 允許從通用 SSO 提供者（Keycloak）擷取角色 - [PR #17787](https://github.com/BerriAI/litellm/pull/17787)
    - JWT Auth - 允許從請求標頭選取 team_id - [PR #17884](https://github.com/BerriAI/litellm/pull/17884)
    - 在 SSO 更新時，從 Config Table 移除 SSO 設定值 - [PR #17668](https://github.com/BerriAI/litellm/pull/17668)
- **團隊**
    - 將 team 附加至 org table - [PR #17832](https://github.com/BerriAI/litellm/pull/17832)
    - 在驗證時公開 team 別名 - [PR #17725](https://github.com/BerriAI/litellm/pull/17725)
- **MCP Server 管理**
    - 將 extra_headers 和 allowed_tools 新增至 UpdateMCPServerRequest - [PR #17940](https://github.com/BerriAI/litellm/pull/17940)
- **通知**
    - 在通知上顯示進度，並在滑鼠懸停時暫停 - [PR #17942](https://github.com/BerriAI/litellm/pull/17942)
- **一般**
    - 當文件不在根路徑時，允許 Root Path 重新導向 - [PR #16843](https://github.com/BerriAI/litellm/pull/16843)
    - 在左上角 logo 旁顯示 UI 版本號碼 - [PR #17891](https://github.com/BerriAI/litellm/pull/17891)
    - 以正確分類與根目錄上的 agents 重新組織左側導覽 - [PR #17890](https://github.com/BerriAI/litellm/pull/17890)
    - UI Playground - 允許在 model 選擇器下拉式選單中使用自訂 model 名稱 - [PR #17892](https://github.com/BerriAI/litellm/pull/17892)

#### 錯誤 {#bugs-1}

- **UI 修正**
    - 修正連結 + 舊登入頁面淘汰訊息 - [PR #17624](https://github.com/BerriAI/litellm/pull/17624)
    - Chat UI Endpoint Selector 的篩選 - [PR #17567](https://github.com/BerriAI/litellm/pull/17567)
    - SCIM v2 中的競態條件處理 - [PR #17513](https://github.com/BerriAI/litellm/pull/17513)
    - 將 /litellm_model_cost_map 設為公開 - [PR #16795](https://github.com/BerriAI/litellm/pull/16795)
    - UI 上的自訂回呼 - [PR #17522](https://github.com/BerriAI/litellm/pull/17522)
    - 為非 root Docker 加入可由使用者寫入的目錄以供 Logo 使用 - [PR #17180](https://github.com/BerriAI/litellm/pull/17180)
    - 交換 URL 輸入與顯示名稱輸入欄位 - [PR #17682](https://github.com/BerriAI/litellm/pull/17682)
    - 將淘汰橫幅改為僅在 /sso/key/generate 顯示 - [PR #17681](https://github.com/BerriAI/litellm/pull/17681)
    - 將憑證加密變更為僅影響 db 憑證 - [PR #17741](https://github.com/BerriAI/litellm/pull/17741)
- **Auth 與 Routes**
    - 對未授權路由回傳 403，而非 503 - [PR #17723](https://github.com/BerriAI/litellm/pull/17723)
    - AI Gateway Auth - 允許對公開路由使用萬用字元樣式 - [PR #17686](https://github.com/BerriAI/litellm/pull/17686)

---

## AI 整合 {#ai-integrations}

### 新增整合（4 個新增整合） {#new-integrations-4-new-integrations}

| 整合 | 類型 | 說明 |
| ----------- | ---- | ----------- |
| [SumoLogic](../../docs/proxy/logging#sumologic) | Logging | SumoLogic 的原生 webhook 整合 - [PR #17630](https://github.com/BerriAI/litellm/pull/17630) |
| [Arize Phoenix](../../docs/proxy/arize_phoenix_prompts) | Prompt Management | Arize Phoenix OSS prompt 管理整合 - [PR #17750](https://github.com/BerriAI/litellm/pull/17750) |
| [Sendgrid](../../docs/proxy/email) | Email | Sendgrid 電子郵件通知整合 - [PR #17775](https://github.com/BerriAI/litellm/pull/17775) |
| [Onyx](../../docs/proxy/guardrails/onyx_security) | Guardrails | Onyx guardrail hooks 整合 - [PR #16591](https://github.com/BerriAI/litellm/pull/16591) |

### 記錄 {#logging}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 傳遞 Langfuse trace_id - [PR #17669](https://github.com/BerriAI/litellm/pull/17669)
    - 在 Langfuse logging 中優先使用標準 trace id - [PR #17791](https://github.com/BerriAI/litellm/pull/17791)
    - 在 Langfuse passthrough 中將查詢參數移至 create_pass_through_route 呼叫 - [PR #17660](https://github.com/BerriAI/litellm/pull/17660)
    - 新增自訂遮罩函式支援 - [PR #17826](https://github.com/BerriAI/litellm/pull/17826)
- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 將 'exception_status' 新增至 prometheus logger - [PR #17847](https://github.com/BerriAI/litellm/pull/17847)
- **[OpenTelemetry](../../docs/proxy/logging#otel)**
    - 將延遲指標（TTFT、TPOT、Total Generation Time）新增至 OTEL payload - [PR #17888](https://github.com/BerriAI/litellm/pull/17888)
- **一般**
    - 為非同步 logging 新增透過 cache 功能輪詢 - [PR #16862](https://github.com/BerriAI/litellm/pull/16862)

### 防護欄 {#guardrails}

- **[HiddenLayer](../../docs/proxy/guardrails/hiddenlayer)**
    - 新增 HiddenLayer Guardrail Hooks - [PR #17728](https://github.com/BerriAI/litellm/pull/17728)
- **[Pillar Security](../../docs/proxy/guardrails/pillar_security)**
    - 在監控期間為 Pillar Security guardrail 新增可選擇加入的證據結果 - [PR #17812](https://github.com/BerriAI/litellm/pull/17812)
- **[PANW Prisma AIRS](../../docs/proxy/guardrails/panw_prisma_airs)**
    - 新增可設定 fail-open、timeout 與 app_user 追蹤 - [PR #17785](https://github.com/BerriAI/litellm/pull/17785)
- **[Presidio](../../docs/proxy/guardrails/pii_masking_v2)**
    - 為 Presidio PII masking 新增可設定的信心分數閾值與範圍支援 - [PR #17817](https://github.com/BerriAI/litellm/pull/17817)
- **[LiteLLM Content Filter](../../docs/proxy/guardrails/litellm_content_filter)**
    - 遮罩所有 regex 模式比對，而不只是第一個 - [PR #17727](https://github.com/BerriAI/litellm/pull/17727)
- **[Regex Guardrails](../../docs/proxy/guardrails/secret_detection)**
    - 為 guardrails 新增增強型 regex 模式比對 - [PR #17915](https://github.com/BerriAI/litellm/pull/17915)
- **[Gray Swan Guardrail](../../docs/proxy/guardrails/grayswan)**
    - 為模型回應新增 passthrough 模式 - [PR #17102](https://github.com/BerriAI/litellm/pull/17102)

### 提示管理 {#prompt-management}

- **一般**
    - 用於整合 prompt 管理提供者的新 API - [PR #17829](https://github.com/BerriAI/litellm/pull/17829)

---

## Spend Tracking、Budgets 與 Rate Limiting {#spend-tracking-budgets-and-rate-limiting}

- **Service Tier Pricing** - 從 OpenAI flex pricing 的 response/usage 中擷取 service_tier - [PR #17748](https://github.com/BerriAI/litellm/pull/17748)
- **Agent Cost Tracking** - 在 SpendLogs 中追蹤 agent_id - [PR #17795](https://github.com/BerriAI/litellm/pull/17795)
- **Tag Activity** - 去重 /tag/daily/activity metadata - [PR #16764](https://github.com/BerriAI/litellm/pull/16764)
- **Rate Limiting** - 動態 Rate Limiter - 允許為記憶體快取指定 ttl - [PR #17679](https://github.com/BerriAI/litellm/pull/17679)

---

## MCP 閘道 {#mcp-gateway}

- **Chat Completions Integration** - 新增在 /chat/completions 使用 MCPs 的支援 - [PR #17747](https://github.com/BerriAI/litellm/pull/17747)
- **UI Session Permissions** - 修正真實 teams 之間的 UI session MCP 權限 - [PR #17620](https://github.com/BerriAI/litellm/pull/17620)
- **OAuth Callback** - 修正 MCP OAuth callback 路由與 URL 處理 - [PR #17789](https://github.com/BerriAI/litellm/pull/17789)
- **Tool Name Prefix** - 修正 MCP tool 名稱前綴 - [PR #17908](https://github.com/BerriAI/litellm/pull/17908)

---

## 代理程式閘道（A2A） {#agent-gateway-a2a}

- **每次查詢成本** - 為代理程式呼叫新增每次查詢成本 - [PR #17774](https://github.com/BerriAI/litellm/pull/17774)
- **Token 計數** - 新增非串流與串流的 token 計數 - [PR #17779](https://github.com/BerriAI/litellm/pull/17779)
- **每個 Token 成本** - 為 A2A 新增每個 token 定價 - [PR #17780](https://github.com/BerriAI/litellm/pull/17780)
- **LangGraph 提供者** - 為 Agent Gateway 新增 LangGraph 提供者 - [PR #17783](https://github.com/BerriAI/litellm/pull/17783)
- **Bedrock 與 LangGraph 代理程式** - 允許將 Bedrock AgentCore、LangGraph 代理程式與 A2A Gateway 一起使用 - [PR #17786](https://github.com/BerriAI/litellm/pull/17786)
- **代理程式管理** - 允許新增 LangGraph、Bedrock Agent Core 代理程式 - [PR #17802](https://github.com/BerriAI/litellm/pull/17802)
- **Azure Foundry 代理程式** - 新增 Azure AI Foundry 代理程式支援 - [PR #17845](https://github.com/BerriAI/litellm/pull/17845)
- **Azure Foundry UI** - 允許在 UI 上新增 Azure Foundry 代理程式 - [PR #17909](https://github.com/BerriAI/litellm/pull/17909)
- **Azure Foundry 修正** - 確保 Azure Foundry 代理程式正常運作 - [PR #17943](https://github.com/BerriAI/litellm/pull/17943)

---

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **記憶體洩漏修正** - 將記憶體洩漏減半 - [PR #17784](https://github.com/BerriAI/litellm/pull/17784)
- **Spend Logs 記憶體** - 降低 spend_logs 的記憶體累積 - [PR #17742](https://github.com/BerriAI/litellm/pull/17742)
- **路由器最佳化** - 將 time.perf_counter() 替換為 time.time() - [PR #17881](https://github.com/BerriAI/litellm/pull/17881)
- **過濾內部參數** - 在備援程式碼中過濾內部參數 - [PR #17941](https://github.com/BerriAI/litellm/pull/17941)
- **Gunicorn 建議** - 使用 max_requests_before_restart 時，建議使用 Gunicorn 而非 uvicorn - [PR #17788](https://github.com/BerriAI/litellm/pull/17788)
- **Pydantic 警告** - 降低 PydanticDeprecatedSince20 警告 - [PR #17657](https://github.com/BerriAI/litellm/pull/17657)
- **Python 3.14 支援** - 透過 grpcio 版本限制新增 Python 3.14 支援 - [PR #17666](https://github.com/BerriAI/litellm/pull/17666)
- **OpenAI 套件** - 將 openai 套件升級至 2.9.0 - [PR #17818](https://github.com/BerriAI/litellm/pull/17818)

---

## 文件更新 {#documentation-updates}

- **貢獻** - 更新複製指示，建議先 fork - [PR #17637](https://github.com/BerriAI/litellm/pull/17637)
- **開始使用** - 改善開始使用頁面與 SDK 文件結構 - [PR #17614](https://github.com/BerriAI/litellm/pull/17614)
- **JSON 模式** - 更清楚說明如何取得 Pydantic 模型輸出 - [PR #17671](https://github.com/BerriAI/litellm/pull/17671)
- **drop_params** - 更新 litellm 關於 drop_params 的文件 - [PR #17658](https://github.com/BerriAI/litellm/pull/17658)
- **環境變數** - 補充缺漏的環境變數文件並修正錯誤型別 - [PR #17649](https://github.com/BerriAI/litellm/pull/17649)
- **SumoLogic** - 新增 SumoLogic 整合文件 - [PR #17647](https://github.com/BerriAI/litellm/pull/17647)
- **SAP Gen AI** - 新增 SAP Gen AI 提供者文件 - [PR #17667](https://github.com/BerriAI/litellm/pull/17667)
- **驗證** - 新增驗證註解 - [PR #17733](https://github.com/BerriAI/litellm/pull/17733)
- **已知問題** - 在 1.80.5-stable 文件中新增已知問題 - [PR #17738](https://github.com/BerriAI/litellm/pull/17738)
- **支援的端點** - 修正支援的端點頁面 - [PR #17710](https://github.com/BerriAI/litellm/pull/17710)
- **Token 計數** - 文件化 token 計數端點 - [PR #17772](https://github.com/BerriAI/litellm/pull/17772)
- **概觀** - 透過表格讓 litellm proxy 與 SDK 的差異在概觀中更清楚 - [PR #17790](https://github.com/BerriAI/litellm/pull/17790)
- **容器 API** - 新增 containers files API 與 LiteLLM 上的 code interpreter 文件 - [PR #17749](https://github.com/BerriAI/litellm/pull/17749)
- **目標儲存** - 新增目標儲存文件 - [PR #17882](https://github.com/BerriAI/litellm/pull/17882)
- **代理程式使用** - 代理程式使用文件 - [PR #17931](https://github.com/BerriAI/litellm/pull/17931), [PR #17932](https://github.com/BerriAI/litellm/pull/17932), [PR #17934](https://github.com/BerriAI/litellm/pull/17934)
- **Cursor 整合** - Cursor 整合文件 - [PR #17855](https://github.com/BerriAI/litellm/pull/17855), [PR #17939](https://github.com/BerriAI/litellm/pull/17939)
- **A2A 成本追蹤** - A2A 成本追蹤文件 - [PR #17913](https://github.com/BerriAI/litellm/pull/17913)
- **Azure Search** - 更新 azure search 文件 - [PR #17726](https://github.com/BerriAI/litellm/pull/17726)
- **Milvus 用戶端** - 修正 milvus 用戶端文件 - [PR #17736](https://github.com/BerriAI/litellm/pull/17736)
- **串流記錄** - 移除串流記錄文件 - [PR #17739](https://github.com/BerriAI/litellm/pull/17739)
- **整合文件** - 更新整合文件位置 - [PR #17644](https://github.com/BerriAI/litellm/pull/17644)
- **連結** - 更新 mistral 與 anthropic 的文件連結 - [PR #17852](https://github.com/BerriAI/litellm/pull/17852)
- **社群** - 新增社群文件連結 - [PR #17734](https://github.com/BerriAI/litellm/pull/17734)
- **定價** - 更新 global.anthropic.claude-haiku-4-5-20251001-v1:0 的定價 - [PR #17703](https://github.com/BerriAI/litellm/pull/17703)
- **gpt-image-1-mini** - 更正 gpt-image-1-mini 的模型類型 - [PR #17635](https://github.com/BerriAI/litellm/pull/17635)

---

## 基礎架構 / 部署 {#infrastructure--deployment}

- **Docker** - 在 docker-compose.yml 中的 healthcheck 改用 python 而非 wget - [PR #17646](https://github.com/BerriAI/litellm/pull/17646)
- **Helm Chart** - 為 Helm chart 部署新增 extraResources 支援 - [PR #17627](https://github.com/BerriAI/litellm/pull/17627)
- **Helm 版本控制** - 為 helm chart 版本新增 semver prerelease 後綴 - [PR #17678](https://github.com/BerriAI/litellm/pull/17678)
- **資料庫結構** - 為目標儲存功能在 schema.prisma 中新增 storage_backend 與 storage_url 欄位 - [PR #17936](https://github.com/BerriAI/litellm/pull/17936)

---

## 新貢獻者 {#new-contributors}

* @xianzongxie-stripe 在 [PR #16862](https://github.com/BerriAI/litellm/pull/16862) 完成了首次貢獻
* @krisxia0506 在 [PR #17637](https://github.com/BerriAI/litellm/pull/17637) 完成了首次貢獻
* @chetanchoudhary-sumo 在 [PR #17630](https://github.com/BerriAI/litellm/pull/17630) 完成了首次貢獻
* @kevinmarx 在 [PR #17632](https://github.com/BerriAI/litellm/pull/17632) 完成了首次貢獻
* @expruc 在 [PR #17627](https://github.com/BerriAI/litellm/pull/17627) 完成了首次貢獻
* @rcII 在 [PR #17626](https://github.com/BerriAI/litellm/pull/17626) 完成了首次貢獻
* @tamirkiviti13 在 [PR #16591](https://github.com/BerriAI/litellm/pull/16591) 完成了首次貢獻
* @Eric84626 在 [PR #17629](https://github.com/BerriAI/litellm/pull/17629) 完成了首次貢獻
* @vasilisazayka 在 [PR #16053](https://github.com/BerriAI/litellm/pull/16053) 完成了首次貢獻
* @juliettech13 在 [PR #17663](https://github.com/BerriAI/litellm/pull/17663) 完成了首次貢獻
* @jason-nance 在 [PR #17660](https://github.com/BerriAI/litellm/pull/17660) 完成了首次貢獻
* @yisding 在 [PR #17671](https://github.com/BerriAI/litellm/pull/17671) 完成了首次貢獻
* @emilsvennesson 在 [PR #17656](https://github.com/BerriAI/litellm/pull/17656) 完成了首次貢獻
* @kumekay 在 [PR #17646](https://github.com/BerriAI/litellm/pull/17646) 完成了首次貢獻
* @chenzhaofei01 在 [PR #17584](https://github.com/BerriAI/litellm/pull/17584) 完成了首次貢獻
* @shivamrawat1 在 [PR #17733](https://github.com/BerriAI/litellm/pull/17733) 完成了首次貢獻
* @ephrimstanley 在 [PR #17723](https://github.com/BerriAI/litellm/pull/17723) 完成了首次貢獻
* @hwittenborn 在 [PR #17743](https://github.com/BerriAI/litellm/pull/17743) 完成了首次貢獻
* @peterkc 在 [PR #17727](https://github.com/BerriAI/litellm/pull/17727) 完成了首次貢獻
* @saisurya237 在 [PR #17725](https://github.com/BerriAI/litellm/pull/17725) 完成了首次貢獻
* @Ashton-Sidhu 在 [PR #17728](https://github.com/BerriAI/litellm/pull/17728) 完成了首次貢獻
* @CyrusTC 在 [PR #17810](https://github.com/BerriAI/litellm/pull/17810) 完成了首次貢獻
* @jichmi 在 [PR #17703](https://github.com/BerriAI/litellm/pull/17703) 完成了首次貢獻
* @ryan-crabbe 在 [PR #17852](https://github.com/BerriAI/litellm/pull/17852) 完成了首次貢獻
* @nlineback 在 [PR #17851](https://github.com/BerriAI/litellm/pull/17851) 完成了首次貢獻
* @butnarurazvan 在 [PR #17468](https://github.com/BerriAI/litellm/pull/17468) 完成了首次貢獻
* @yoshi-p27 在 [PR #17915](https://github.com/BerriAI/litellm/pull/17915) 完成了首次貢獻

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上查看完整變更記錄](https://github.com/BerriAI/litellm/compare/v1.80.8.rc.1...v1.80.10)**
