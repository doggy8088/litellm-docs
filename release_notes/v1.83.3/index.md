---
title: "v1.83.3-stable - MCP 工具集與技能市集"
slug: "v1-83-3-stable"
date: 2026-04-04T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Ryan Crabbe
    title: Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/ryan-crabbe-0b9687214
    image_url: https://github.com/ryan-crabbe.png
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
  - name: Shivam Rawat
    title: Forward Deployed Engineer, LiteLLM
    url: https://linkedin.com/in/shivam-rawat-482937318
    image_url: https://github.com/shivamrawat1.png
hide_table_of_contents: false
---

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:main-v1.83.3-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.83.3
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **MCP 工具集** — [從一或多個 MCP 伺服器建立具範圍權限的精選工具子集，並可透過 UI 或 API 管理](../../docs/mcp)
- **技能市集** — [瀏覽、安裝並發布來自自架市集的 Claude Code 技能——可跨 Anthropic、Vertex AI、Azure 與 Bedrock 使用](../../docs/skills_gateway)
- **防護欄備援** — [設定 `on_error` 行為，讓防護欄失敗時能優雅降級，而不是阻擋請求](../../docs/proxy/guardrails)
- **團隊自備防護欄** — [團隊現在可直接從 UI 的團隊設定附加與管理自己的防護欄](../../docs/proxy/guardrails)

---

### 技能市集 {#skills-marketplace}

技能市集為團隊提供一個自架目錄，用於探索、安裝與發布 Claude Code 技能。技能可在 Anthropic、Vertex AI、Azure 與 Bedrock 之間移植——因此只要發布一次，透過閘道路由到的任何地方都可使用。

![技能市集](../../img/release_notes/skills_marketplace.png)

[開始使用](../../docs/skills_gateway)

### 防護欄備援 {#guardrail-fallbacks}

![防護欄備援](../../img/release_notes/guardrail_fallbacks.png)

防護欄流程現在支援可選的 `on_error` 行為。當防護欄檢查失敗或發生錯誤時，您可以將流程設定為優雅地備援——記錄失敗並繼續請求——而不是回傳硬性 500 給呼叫端。這對於非關鍵防護欄特別有用，因為此時可用性比強制執行更重要。

[開始使用](../../docs/proxy/guardrails/policy_flow_builder)

### 團隊自備防護欄 {#team-bring-your-own-guardrails}

團隊現在可直接從團隊管理 UI 附加防護欄。管理員在專案或 Proxy 層級設定可用的防護欄，各團隊則選擇哪些套用到其流量——不需要變更設定檔或重新啟動 Proxy。這也在專案建立／編輯流程中加入專案層級防護欄支援。

### MCP 工具集 {#mcp-toolsets}

MCP 工具集讓 AI 平台管理員能從一或多個 MCP 伺服器建立精選工具子集，並以範圍權限指派給團隊與金鑰。您不必授與整個 MCP 伺服器的存取權，現在可以將特定工具打包成具名稱的工具集——精確控制每個團隊或 API 金鑰可呼叫哪些工具。工具集可透過 UI（新的 Toolsets 分頁）與 API 完整管理，並可與 Responses API 和 Playground 無縫搭配使用。

![MCP 工具集](../../img/release_notes/mcp_toolsets.jpeg)

[開始使用](../../docs/mcp)

---

## 新模型／更新模型 {#new-models--updated-models}

#### 新模型支援（60 個新模型） {#new-model-support-60-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.4-mini` | 272K | $0.75 | $4.50 | 聊天、快取讀取、flex/batch/priority 等級 |
| OpenAI | `gpt-5.4-nano` | 272K | $0.20 | - | 聊天、flex/batch 等級 |
| OpenAI | `gpt-4-0314` | 8K | $30.00 | $60.00 | 重新加入的舊版項目（停用日期 2026-03-26） |
| Azure OpenAI | `azure/gpt-5.4-mini` | 1.05M | $0.75 | $4.50 | 聊天完成、快取讀取 |
| Azure OpenAI | `azure/gpt-5.4-nano` | - | - | - | 聊天完成 |
| AWS Bedrock | `us.amazon.nova-canvas-v1:0` | 2.6K | - | $0.06 / image | Nova Canvas 圖片編輯支援 |
| AWS Bedrock | `nvidia.nemotron-super-3-120b` | 256K | $0.15 | $0.65 | 函式呼叫、推理、系統訊息 |
| AWS Bedrock | `minimax.minimax-m2.5`（12 個區域） | 1M | $0.30 | $1.20 | 函式呼叫、推理、系統訊息 |
| AWS Bedrock | `zai.glm-5` | 200K | $1.00 | $3.20 | 函式呼叫、推理 |
| AWS Bedrock | `bedrock/us-gov-{east,west}-1/anthropic.claude-haiku-4-5-20251001-v1:0` | 200K | $1.20 | $6.00 | GovCloud Claude Haiku 4.5 |
| Vertex AI | `vertex_ai/claude-haiku-4-5` | 200K | $1.00 | $5.00 | 聊天、建立／讀取快取 |
| Gemini | `gemini-3.1-flash-live-preview` / `gemini/gemini-3.1-flash-live-preview` | 131K | $0.75 | - | 即時音訊／影片／圖片／文字 |
| Gemini | `gemini/lyria-3-pro-preview`、`gemini/lyria-3-clip-preview` | 131K | - | - | 音樂生成預覽 |
| xAI | `xai/grok-4.20-beta-0309-reasoning` | 2M | $2.00 | $6.00 | 函式呼叫、推理 |
| xAI | `xai/grok-4.20-beta-0309-non-reasoning` | 2M | - | - | 函式呼叫 |
| xAI | `xai/grok-4.20-multi-agent-beta-0309` | 2M | - | - | 多代理程式預覽 |
| OCI GenAI | `oci/cohere.command-a-reasoning-08-2025`、`oci/cohere.command-a-vision-07-2025`、`oci/cohere.command-a-translate-08-2025`、`oci/cohere.command-r-08-2024`、`oci/cohere.command-r-plus-08-2024` | 256K | $1.56 | $1.56 | OCI 上的 Cohere 聊天系列 |
| OCI GenAI | `oci/meta.llama-3.1-70b-instruct`、`oci/meta.llama-3.2-11b-vision-instruct`、`oci/meta.llama-3.3-70b-instruct-fp8-dynamic` | 視情況而定 | 視情況而定 | 視情況而定 | OCI 上的 Llama 聊天系列 |
| OCI GenAI | `oci/xai.grok-4-fast`、`oci/xai.grok-4.1-fast`、`oci/xai.grok-4.20`、`oci/xai.grok-4.20-multi-agent`、`oci/xai.grok-code-fast-1` | 131K | $3.00 | $15.00 | OCI 上的 Grok 系列 |
| OCI GenAI | `oci/google.gemini-2.5-pro`、`oci/google.gemini-2.5-flash`、`oci/google.gemini-2.5-flash-lite` | 1M+ | $1.25 | $10.00 | OCI 上的 Gemini 系列 |
| OCI GenAI | `oci/cohere.embed-english-v3.0`、`oci/cohere.embed-english-light-v3.0`、`oci/cohere.embed-multilingual-v3.0`、`oci/cohere.embed-multilingual-light-v3.0`、`oci/cohere.embed-english-image-v3.0`、`oci/cohere.embed-english-light-image-v3.0`、`oci/cohere.embed-multilingual-light-image-v3.0`、`oci/cohere.embed-v4.0` | 視情況而定 | 視情況而定 | - | OCI 上的 Embeddings |
| Volcengine | `volcengine/doubao-seed-2-0-pro-260215`、`doubao-seed-2-0-lite-260215`、`doubao-seed-2-0-mini-260215`、`doubao-seed-2-0-code-preview-260215` | 256K | - | - | Doubao Seed 2.0 系列 |

#### 功能 {#features}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 新增 Nova Canvas 圖片編輯支援 - [PR #24869](https://github.com/BerriAI/litellm/pull/24869), [PR #25110](https://github.com/BerriAI/litellm/pull/25110)
    - 新增 `nvidia.nemotron-super-3-120b` 項目與 Bedrock 模型目錄更新 - [PR #24588](https://github.com/BerriAI/litellm/pull/24588), [PR #24645](https://github.com/BerriAI/litellm/pull/24645)
    - 新增 MiniMax M2.5 跨區域項目 - 成本對應表新增
    - 新增 `zai.glm-5` 定價項目
    - 改善 Claude 相容串流路徑的快取使用曝光 - [PR #24850](https://github.com/BerriAI/litellm/pull/24850)
    - 修正 Bedrock JSON 模式的結構化輸出成本追蹤 - [PR #23794](https://github.com/BerriAI/litellm/pull/23794)
    - 為 AgentCore A2A 原生代理程式保留 JSON-RPC 封套 - [PR #25092](https://github.com/BerriAI/litellm/pull/25092)
    - 修正 Bedrock Anthropic 檔案／文件處理 - [PR #25047](https://github.com/BerriAI/litellm/pull/25047), [PR #25050](https://github.com/BerriAI/litellm/pull/25050)
    - 修正自訂端點的 Bedrock count-tokens - [PR #24199](https://github.com/BerriAI/litellm/pull/24199)

- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 對 base64 資料 URL 跳過 `#transform=inline` - [PR #23818](https://github.com/BerriAI/litellm/pull/23818)

- **[DeepInfra](../../docs/providers/deepinfra)**
    - 模擬 DeepInfra completion 測試，以避免實際 API 呼叫 - [PR #24805](https://github.com/BerriAI/litellm/pull/24805)

- **[WatsonX](../../docs/providers/watsonx)**
    - 修正 WatsonX 測試因缺少 env vars 而在 CI 中失敗 - [PR #24814](https://github.com/BerriAI/litellm/pull/24814)

- **[Snowflake Cortex](../../docs/providers/snowflake)**
    - 將 Snowflake 模擬測試移至單元測試目錄 - [PR #24822](https://github.com/BerriAI/litellm/pull/24822)

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 Responses API 中顯示 Anthropic 工具回傳結果 - [PR #23784](https://github.com/BerriAI/litellm/pull/23784)
    - 支援驗證權杖與自訂 `api_base` - [PR #24140](https://github.com/BerriAI/litellm/pull/24140)
    - 保留 beta 標頭順序 - [PR #23715](https://github.com/BerriAI/litellm/pull/23715)
    - 支援 Anthropic 文件／檔案訊息區塊的 Cache-control - [PR #23906](https://github.com/BerriAI/litellm/pull/23906), [PR #23911](https://github.com/BerriAI/litellm/pull/23911)
    - 對 Anthropic 拒絕的 finish_reason 進行對應 - [PR #23899](https://github.com/BerriAI/litellm/pull/23899)
    - 工具設定的 Cache-control - [PR #24076](https://github.com/BerriAI/litellm/pull/24076)
    - 移除 Opus/Sonnet 4.6 的 200K 定價項目 - [PR #24689](https://github.com/BerriAI/litellm/pull/24689)

- **[OpenAI](../../docs/providers/openai)**
    - 以 flex/batch/priority 級別新增 `gpt-5.4-mini` / `gpt-5.4-nano` - [PR #23958](https://github.com/BerriAI/litellm/pull/23958)
    - 還原帶有淘汰中繼資料的 `gpt-4-0314` 成本項目 - [PR #23753](https://github.com/BerriAI/litellm/pull/23753)
    - Chat completions 中的 OpenAI reasoning 項目 - [PR #24690](https://github.com/BerriAI/litellm/pull/24690)

- **[Google Vertex AI](../../docs/providers/vertex)**
    - 新增 `vertex_ai/claude-haiku-4-5` 定價項目 - [PR #25151](https://github.com/BerriAI/litellm/pull/25151)
    - Vertex `count_tokens` 位置覆寫 - [PR #23907](https://github.com/BerriAI/litellm/pull/23907)
    - Vertex 取消 batch 端點 - [PR #23957](https://github.com/BerriAI/litellm/pull/23957)
    - Vertex PAYGO 教學 - [PR #24009](https://github.com/BerriAI/litellm/pull/24009)
    - 修正 Vertex AI batch - [PR #23718](https://github.com/BerriAI/litellm/pull/23718)
    - DeepSeek v3.2 Vertex 區域對應 - [PR #23864](https://github.com/BerriAI/litellm/pull/23864)

- **[Google Gemini](../../docs/providers/gemini)**
    - 新增 `gemini-3.1-flash-live-preview` 模型 - [PR #24665](https://github.com/BerriAI/litellm/pull/24665)
    - 新增 Lyria 3 Pro / Clip 預覽項目 + 文件 - [PR #24610](https://github.com/BerriAI/litellm/pull/24610)
    - 標準化 Gemini retrieve-file URL - [PR #24662](https://github.com/BerriAI/litellm/pull/24662)
    - 具備自訂 `api_base` 的 Gemini context caching - [PR #23928](https://github.com/BerriAI/litellm/pull/23928)
    - 嚴格的 `additional_properties` 清理 - [PR #24072](https://github.com/BerriAI/litellm/pull/24072)
    - Gemini 上下文循環 - [PR #24073](https://github.com/BerriAI/litellm/pull/24073)

- **[Azure OpenAI](../../docs/providers/azure)**
    - 新增 `azure/gpt-5.4-mini` / `azure/gpt-5.4-nano` 定價 - model catalog
    - 提升 proxy Azure API 版本 - [PR #24120](https://github.com/BerriAI/litellm/pull/24120)
    - Azure fine-tuning 修正 - [PR #24687](https://github.com/BerriAI/litellm/pull/24687)
    - Azure gpt-5.4 Responses API 路由修正 - [PR #23926](https://github.com/BerriAI/litellm/pull/23926)
    - Azure AI 註解 - [PR #23939](https://github.com/BerriAI/litellm/pull/23939)

- **[xAI](../../docs/providers/xai)**
    - 新增 Grok 4.20 reasoning / non-reasoning / multi-agent 預覽項目 - cost map

- **[OCI GenAI](../../docs/providers/oci)**
    - 原生 embeddings 支援與擴充的 chat + embedding 模型目錄 - [PR #24887](https://github.com/BerriAI/litellm/pull/24887), [PR #25151](https://github.com/BerriAI/litellm/pull/25151)

- **[Volcengine](../../docs/providers/volcengine)**
    - 新增 Doubao Seed 2.0 pro/lite/mini/code-preview 項目 - cost map

- **[Mistral](../../docs/providers/mistral)**
    - 修正 Mistral diarize segments 回應 - [PR #23925](https://github.com/BerriAI/litellm/pull/23925)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 移除 OpenRouter 萬用字元路由的前綴 - [PR #24603](https://github.com/BerriAI/litellm/pull/24603)

- **[Deepgram](../../docs/providers/deepgram)**
    - 回復有問題的每秒成本變更 - [PR #24297](https://github.com/BerriAI/litellm/pull/24297)

- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 當 Copilot 模型不支援時，直接略過 web search - [PR #24143](https://github.com/BerriAI/litellm/pull/24143)

- **[Snowflake Cortex](../../docs/providers/snowflake)**
    - 測試衝突解決與可靠性修正 - release window 之間的 merges

- **[Quora / Poe](../../docs/providers/poe)**
    - 修正缺少 content-part added 事件 - [PR #24445](https://github.com/BerriAI/litellm/pull/24445)

### 錯誤修正 {#bug-fixes}

- **一般**
    - 修正 `gpt-5.4` 定價中繼資料 - [PR #24748](https://github.com/BerriAI/litellm/pull/24748)
    - 修正 gov 定價測試與 Bedrock 模型測試後續項目 - [PR #24931](https://github.com/BerriAI/litellm/pull/24931), [PR #24947](https://github.com/BerriAI/litellm/pull/24947), [PR #25022](https://github.com/BerriAI/litellm/pull/25022)
    - 修正 thinking blocks 的 null 處理 - [PR #24070](https://github.com/BerriAI/litellm/pull/24070)
    - 空內容時的串流 tool-call finish reason - [PR #23895](https://github.com/BerriAI/litellm/pull/23895)
    - 確保轉換路徑中的角色交替 - [PR #24015](https://github.com/BerriAI/litellm/pull/24015)
    - File → input_file 對應修正 - [PR #23618](https://github.com/BerriAI/litellm/pull/23618)
    - File-search 模擬對齊 - [PR #23969](https://github.com/BerriAI/litellm/pull/23969)
    - 保留最終串流屬性 - [PR #23530](https://github.com/BerriAI/litellm/pull/23530)
    - 串流中繼資料隱藏參數 - [PR #24220](https://github.com/BerriAI/litellm/pull/24220)
    - 提升 LLM 重複訊息偵測效能 - [PR #18120](https://github.com/BerriAI/litellm/pull/18120)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - 支援 File Search — 第 1 階段原生轉送與第 2 階段非 OpenAI 模型的模擬備援 - [PR #23969](https://github.com/BerriAI/litellm/pull/23969)
    - Responses API 的提示詞管理支援 - [PR #23999](https://github.com/BerriAI/litellm/pull/23999)
    - 跨模型版本的加密內容 affinity - [PR #23854](https://github.com/BerriAI/litellm/pull/23854), [PR #24110](https://github.com/BerriAI/litellm/pull/24110)
    - 在 chat completions 中往返 Responses API `reasoning_items` - [PR #24690](https://github.com/BerriAI/litellm/pull/24690)
    - 為非 OpenAI 模型發出 `content_part.added` 串流事件 - [PR #24445](https://github.com/BerriAI/litellm/pull/24445)
    - 將 Anthropic 程式碼執行結果顯示為 `code_interpreter_call` - [PR #23784](https://github.com/BerriAI/litellm/pull/23784)
    - 在路由至 OpenAI Responses API 時保留 Anthropic `thinking.summary` - [PR #21441](https://github.com/BerriAI/litellm/pull/21441)
    - 自動將 Azure `gpt-5.4+` 工具 + reasoning 路由至 Responses API - [PR #23926](https://github.com/BerriAI/litellm/pull/23926)
    - 保留 Azure AI Foundry Agents 回應中的註解 - [PR #23939](https://github.com/BerriAI/litellm/pull/23939)
    - API 參考路徑路由更新 - [PR #24155](https://github.com/BerriAI/litellm/pull/24155)
    - 將 Chat Completion `file` 類型對應至 Responses API `input_file` - [PR #23618](https://github.com/BerriAI/litellm/pull/23618)
    - 在 Responses→Completions 轉換中將 `file_url` 對應為 `file_id` - [PR #24874](https://github.com/BerriAI/litellm/pull/24874)

- **[Batch API](../../docs/batches)**
    - 支援 Vertex AI batch 取消 - [PR #23957](https://github.com/BerriAI/litellm/pull/23957)

- **Token 計數**
    - Bedrock：遵循 `api_base` 與 `aws_bedrock_runtime_endpoint` - [PR #24199](https://github.com/BerriAI/litellm/pull/24199)
    - Vertex：Claude 遵循 `vertex_count_tokens_location` - [PR #23907](https://github.com/BerriAI/litellm/pull/23907)

- **[Audio / Transcription API](../../docs/audio_transcription)**
    - Mistral：在轉錄回應中保留 diarization segments - [PR #23925](https://github.com/BerriAI/litellm/pull/23925)

- **[Embeddings API](../../docs/embedding/supported_embedding)**
    - Gemini：將 `task_type` 轉為 Gemini API 使用的 camelCase `taskType` - [PR #24191](https://github.com/BerriAI/litellm/pull/24191)

- **[Video Generation](../../docs/video_generation)**
    - 全新的可重用影片角色端點（create / edit / extension / get），採 router-first 路由 - [PR #23737](https://github.com/BerriAI/litellm/pull/23737)

- **[Search API](../../docs/search)**
    - 支援自架 Firecrawl 回應格式 - [PR #24866](https://github.com/BerriAI/litellm/pull/24866)

- **[A2A / MCP Gateway API](../../docs/mcp)**
    - 為 AgentCore A2A-native agents 保留 JSON-RPC 信封 - [PR #25092](https://github.com/BerriAI/litellm/pull/25092)

- **[Pass-Through Endpoints](../../docs/pass_through/intro)**
    - 在 experimental passthrough 中支援 `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` 環境變數與自訂 `api_base` - [PR #24140](https://github.com/BerriAI/litellm/pull/24140)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 在 Responses API 串流備援路徑中使用真正的 `request_data` - [PR #23910](https://github.com/BerriAI/litellm/pull/23910)
    - 修正 Responses API 成本計算 - [PR #24080](https://github.com/BerriAI/litellm/pull/24080)

- **[穿透式端點](../../docs/pass_through/intro)**
    - 允許非管理員使用者透過驗證存取穿透式子路徑路由 - [PR #24079](https://github.com/BerriAI/litellm/pull/24079)
    - 防止穿透式端點失敗產生重複的回呼記錄 - [PR #23509](https://github.com/BerriAI/litellm/pull/23509)

- **一般**
    - 僅限 Proxy 的失敗呼叫類型處理 - [PR #24050](https://github.com/BerriAI/litellm/pull/24050)
    - 一般 API model-group 記錄修正 - [PR #24044](https://github.com/BerriAI/litellm/pull/24044)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰**
    - 在 `/key/list` 上對 `user_id` 和 `key_alias` 進行子字串搜尋 - [PR #24746](https://github.com/BerriAI/litellm/pull/24746), [PR #24751](https://github.com/BerriAI/litellm/pull/24751)
    - 將 `team_id` 篩選器連接到 key 別名下拉選單 - [PR #25114](https://github.com/BerriAI/litellm/pull/25114), [PR #25119](https://github.com/BerriAI/litellm/pull/25119)
    - 允許在 `/key/update` 中使用雜湊後的 `token_id` - [PR #24969](https://github.com/BerriAI/litellm/pull/24969)
    - 在 `/key/update` 與批次更新 hook 路徑上強制套用 key 參數上限 - [PR #25103](https://github.com/BerriAI/litellm/pull/25103), [PR #25110](https://github.com/BerriAI/litellm/pull/25110)
    - 修正建立 key 標籤下拉選單 - [PR #24273](https://github.com/BerriAI/litellm/pull/24273)
    - 修正 key 更新 404 - [PR #24063](https://github.com/BerriAI/litellm/pull/24063)
    - 修正 key 管理員權限提升 - [PR #23781](https://github.com/BerriAI/litellm/pull/23781)
    - key 端點驗證強化 - [PR #23977](https://github.com/BerriAI/litellm/pull/23977)
    - 停用自訂 API 金鑰旗標 - [PR #23812](https://github.com/BerriAI/litellm/pull/23812)
    - 在 key 更新時略過別名重新驗證 - [PR #23798](https://github.com/BerriAI/litellm/pull/23798)
    - 修正內部使用者的無效 key - [PR #23795](https://github.com/BerriAI/litellm/pull/23795)
    - 排程 key 輪替作業執行的分散式鎖定 - [PR #23364](https://github.com/BerriAI/litellm/pull/23364), [PR #23834](https://github.com/BerriAI/litellm/pull/23834), [PR #25150](https://github.com/BerriAI/litellm/pull/25150)

- **團隊 + 組織**
    - 在團隊端點與 UI 中解析存取群組 models / MCP servers / agents - [PR #25027](https://github.com/BerriAI/litellm/pull/25027), [PR #25119](https://github.com/BerriAI/litellm/pull/25119)
    - 允許從團隊設定變更團隊組織 - [PR #25095](https://github.com/BerriAI/litellm/pull/25095)
    - 團隊編輯 / 資訊檢視中的每個 model 速率限制 - [PR #25144](https://github.com/BerriAI/litellm/pull/25144), [PR #25156](https://github.com/BerriAI/litellm/pull/25156)
    - 修正因不支援的 Prisma JSON path 篩選器導致的團隊 model 更新 500 - [PR #25152](https://github.com/BerriAI/litellm/pull/25152)
    - 團隊 model-group 名稱路由修正 - [PR #24688](https://github.com/BerriAI/litellm/pull/24688)
    - 現代化團隊表格 - [PR #24189](https://github.com/BerriAI/litellm/pull/24189)
    - 建立時的團隊成員預算期間 - [PR #23484](https://github.com/BerriAI/litellm/pull/23484)
    - 將缺少的 `team_member_budget_duration` 參數加入 `new_team` docstring - [PR #24243](https://github.com/BerriAI/litellm/pull/24243)
    - 修正團隊表格重新整理、無限下拉選單與左側導覽列遷移 - [PR #24342](https://github.com/BerriAI/litellm/pull/24342)

- **使用量 + 分析**
    - 使用量頁面篩選中的分頁式團隊搜尋 - [PR #25107](https://github.com/BerriAI/litellm/pull/25107)
    - 匯出使用量顯示正確性改用 entity key - [PR #25153](https://github.com/BerriAI/litellm/pull/25153)
    - 彙總活動 entity 拆解 - [PR #23471](https://github.com/BerriAI/litellm/pull/23471)
    - CSV 匯出修正 - [PR #23819](https://github.com/BerriAI/litellm/pull/23819)
    - 稽核記錄 S3 匯出 - [PR #23167](https://github.com/BerriAI/litellm/pull/23167)
    - 稽核記錄匯出 UI - [PR #24486](https://github.com/BerriAI/litellm/pull/24486)

- **模型 + 提供者**
    - 在 UI model 清單中包含存取群組 models - [PR #24743](https://github.com/BerriAI/litellm/pull/24743)
    - 在提供者表單中顯示 Azure Entra ID 認證欄位 - [PR #25137](https://github.com/BerriAI/litellm/pull/25137)
    - 編輯 model 時不要注入 `vector_store_ids: []` - [PR #25133](https://github.com/BerriAI/litellm/pull/25133)

- **防護欄 UI**
    - 專案建立 / 編輯流程中的專案層級 guardrails - [PR #25100](https://github.com/BerriAI/litellm/pull/25100)
    - Proxy 中的專案層級 guardrails 支援 - [PR #25087](https://github.com/BerriAI/litellm/pull/25087)
    - 允許從 UI 新增團隊 guardrails - [PR #25038](https://github.com/BerriAI/litellm/pull/25038)

- **MCP 工具集 UI**
    - 為具範圍權限的策展 MCP tool 子集新增 Toolsets 分頁 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)

- **驗證 / SSO**
    - 修正 SSO return-to 驗證 - [PR #24475](https://github.com/BerriAI/litellm/pull/24475)
    - 修正 JWT 角色對應 - [PR #24701](https://github.com/BerriAI/litellm/pull/24701)
    - JWT `none` 防護強化 - [PR #24706](https://github.com/BerriAI/litellm/pull/24706)
    - JWT 對 Virtual Key 對應文件 - [PR #24882](https://github.com/BerriAI/litellm/pull/24882)
    - 移除登入星號顯示 - [PR #24318](https://github.com/BerriAI/litellm/pull/24318)
    - 點擊時複製 `user_id` - [PR #24315](https://github.com/BerriAI/litellm/pull/24315)
    - 修正預設使用者權限未與 UI 同步 - [PR #23666](https://github.com/BerriAI/litellm/pull/23666)

- **UI 清理 / 遷移**
    - 將 Tremor Text/Badge 遷移到 antd Tag 與原生 spans - [PR #24750](https://github.com/BerriAI/litellm/pull/24750)
    - 將預設使用者設定遷移到 antd - [PR #23787](https://github.com/BerriAI/litellm/pull/23787)
    - 將 route preview 從 Tremor 遷移到 antd - [PR #24485](https://github.com/BerriAI/litellm/pull/24485)
    - 將 antd message 遷移到 context API - [PR #24192](https://github.com/BerriAI/litellm/pull/24192)
    - 擷取 `useChatHistory` hook - [PR #24172](https://github.com/BerriAI/litellm/pull/24172)
    - 左側導覽外部圖示 - [PR #24069](https://github.com/BerriAI/litellm/pull/24069)
    - UI 的 Vitest 覆蓋率 - [PR #24144](https://github.com/BerriAI/litellm/pull/24144)

#### 錯誤 {#bugs-1}

- 修正當後端篩選器回傳零列時，logs 頁面仍顯示未篩選結果 - [PR #24745](https://github.com/BerriAI/litellm/pull/24745)
- 修正 UI logs 篩選器 - [PR #23792](https://github.com/BerriAI/litellm/pull/23792)
- 修正編輯預算流程 - [PR #24711](https://github.com/BerriAI/litellm/pull/24711)
- 修正批次更新 - [PR #24708](https://github.com/BerriAI/litellm/pull/24708)
- 修正使用者快取失效 - [PR #24717](https://github.com/BerriAI/litellm/pull/24717)
- 修正 guardrail mode type 當機 - [PR #24035](https://github.com/BerriAI/litellm/pull/24035)
- 清理 Proxy 輸入 - [PR #24624](https://github.com/BerriAI/litellm/pull/24624)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 Langfuse 使用中繼資料 - [PR #24043](https://github.com/BerriAI/litellm/pull/24043)
    - 修正 Langfuse OTEL traceparent 傳遞 - [PR #24048](https://github.com/BerriAI/litellm/pull/24048)
    - 重新套用 Langfuse key 洩漏修正 - [PR #22188](https://github.com/BerriAI/litellm/pull/22188), revert [PR #23868](https://github.com/BerriAI/litellm/pull/23868)

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 組織預算指標 - [PR #24449](https://github.com/BerriAI/litellm/pull/24449)
    - Prometheus 支出中繼資料 - [PR #24434](https://github.com/BerriAI/litellm/pull/24434)

- **一般**
    - 透過單一更新函式集中管理 logging kwarg 更新 - [PR #23659](https://github.com/BerriAI/litellm/pull/23659)
    - 修正 customLogger 未初始化時失敗回呼被靜默略過 - [PR #24826](https://github.com/BerriAI/litellm/pull/24826)
    - 消除串流 `guardrail_information` 記錄中的競態條件 - [PR #24592](https://github.com/BerriAI/litellm/pull/24592)
    - 在失敗請求支出記錄中使用實際的 `start_time` - [PR #24906](https://github.com/BerriAI/litellm/pull/24906)
    - 強化認證去識別化，並停止記錄原始敏感驗證值 - [PR #25151](https://github.com/BerriAI/litellm/pull/25151), [PR #24305](https://github.com/BerriAI/litellm/pull/24305)
    - 依 `user_id` 篩選中繼資料 - [PR #24661](https://github.com/BerriAI/litellm/pull/24661)
    - 批次指標改進 - [PR #24691](https://github.com/BerriAI/litellm/pull/24691)
    - 在串流中篩選中繼資料隱藏參數 - [PR #24220](https://github.com/BerriAI/litellm/pull/24220)
    - 共用 aiohttp session 自動復原 - [PR #23808](https://github.com/BerriAI/litellm/pull/23808)
    - 延後 guardrail 記錄 v2 - [PR #24135](https://github.com/BerriAI/litellm/pull/24135)

### 防護欄 {#guardrails}

- 註冊 DynamoAI 防護欄初始化器與列舉項目 - [PR #23752](https://github.com/BerriAI/litellm/pull/23752)
- 擷取防護欄處理器中的輔助方法以修正 PLR0915 - [PR #24802](https://github.com/BerriAI/litellm/pull/24802)
- 為防護欄管線失敗新增可選的 `on_error` 備援 - [PR #24831](https://github.com/BerriAI/litellm/pull/24831), [PR #25150](https://github.com/BerriAI/litellm/pull/25150)
- 允許團隊從團隊設定附加／管理自己的防護欄 - [PR #25038](https://github.com/BerriAI/litellm/pull/25038)
- 在建立／編輯流程中加入專案層級的防護欄設定 - [PR #25100](https://github.com/BerriAI/litellm/pull/25100)
- 對 Model Armor 串流封鎖回傳 HTTP 400（而非 500）- [PR #24693](https://github.com/BerriAI/litellm/pull/24693)
- 延遲防護欄記錄 v2 - [PR #24135](https://github.com/BerriAI/litellm/pull/24135)
- 消除串流 `guardrail_information` 記錄中的競態條件 - [PR #24592](https://github.com/BerriAI/litellm/pull/24592)
- 非串流 post-call 的模型層級防護欄 - [PR #23774](https://github.com/BerriAI/litellm/pull/23774)
- 防護欄 post-call 記錄修正 - [PR #23910](https://github.com/BerriAI/litellm/pull/23910)
- 缺少防護欄文件 - [PR #24083](https://github.com/BerriAI/litellm/pull/24083)

### 提示管理 {#prompt-management}

- CRUD + UI 流程中的提示（`development/staging/production`）環境與使用者追蹤 - [PR #24855](https://github.com/BerriAI/litellm/pull/24855), [PR #25110](https://github.com/BerriAI/litellm/pull/25110)
- 提示到回應整合 - [PR #23999](https://github.com/BerriAI/litellm/pull/23999)

### 密鑰管理器 {#secret-managers}

- 此版本沒有新增任何密鑰管理器提供者。

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- 強制執行成本對應表中未直接存在之模型的預算 - [PR #24949](https://github.com/BerriAI/litellm/pull/24949)
- 團隊設定／資訊 UI 中的每個模型速率限制 - [PR #25144](https://github.com/BerriAI/litellm/pull/25144), [PR #25156](https://github.com/BerriAI/litellm/pull/25156)
- Prometheus 組織預算指標 - [PR #24449](https://github.com/BerriAI/litellm/pull/24449)
- Prometheus 支出中繼資料 - [PR #24434](https://github.com/BerriAI/litellm/pull/24434)
- 修正未版本化的 Vertex Claude Haiku 定價項目，以避免 `$0.00` 帳務 - [PR #25151](https://github.com/BerriAI/litellm/pull/25151)
- 修正預算／支出計數器 - [PR #24682](https://github.com/BerriAI/litellm/pull/24682)
- 支出記錄中的專案 ID 追蹤 - [PR #24432](https://github.com/BerriAI/litellm/pull/24432)
- 動態速率限制預先速率限制背景重新整理 - [PR #24106](https://github.com/BerriAI/litellm/pull/24106)
- Point72 限制變更 - [PR #24088](https://github.com/BerriAI/litellm/pull/24088)
- 路由器中的模型層級親和性 - [PR #24110](https://github.com/BerriAI/litellm/pull/24110)

## MCP 閘道 {#mcp-gateway}

- 引入 **MCP Toolsets**，包含 DB 類型、CRUD API、範圍化權限與 UI 管理分頁 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 在 Responses API 與可串流 MCP 路徑中正確解析 toolset 名稱並強制執行 toolset 存取 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 將 toolset 權限快取切換為共享快取路徑，並改善快取失效行為 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 允許 JWT 驗證用於 `/v1/mcp/server/*` 子路徑 - [PR #24698](https://github.com/BerriAI/litellm/pull/24698), [PR #25113](https://github.com/BerriAI/litellm/pull/25113)
- 為 MCP SigV4 驗證新增 STS AssumeRole 支援 - [PR #25151](https://github.com/BerriAI/litellm/pull/25151)
- 標籤查詢修正 + MCP 中繼資料支援 cherry-pick - [PR #25145](https://github.com/BerriAI/litellm/pull/25145)
- MCP REST M2M OAuth2 流程 - [PR #23468](https://github.com/BerriAI/litellm/pull/23468)
- 將 MCP SDK 升級至 1.26.0 - [PR #24179](https://github.com/BerriAI/litellm/pull/24179)
- 還原 schema sync migration 移除的 MCP 伺服器欄位 - [PR #24078](https://github.com/BerriAI/litellm/pull/24078)

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

- 為多 proxy 工作程序管理新增控制平面 - [PR #24217](https://github.com/BerriAI/litellm/pull/24217)
- 透過 `--enforce_prisma_migration_check` 將 DB migration 失敗退出設為可選 - [PR #23675](https://github.com/BerriAI/litellm/pull/23675)
- 在使用 batch completions 時回傳所選模型（而非以逗號分隔的清單） - [PR #24753](https://github.com/BerriAI/litellm/pull/24753)
- 修正 Responses 轉換、支出追蹤與 PagerDuty 中的 mypy 型別錯誤 - [PR #24803](https://github.com/BerriAI/litellm/pull/24803)
- 修正健康檢查篩選器測試導致的路由器程式碼涵蓋率 CI 失敗 - [PR #24812](https://github.com/BerriAI/litellm/pull/24812)
- 將路由器健康檢查失敗與冷卻行為以及暫時性 429/408 處理整合 - [PR #24988](https://github.com/BerriAI/litellm/pull/24988), [PR #25150](https://github.com/BerriAI/litellm/pull/25150)
- 為金鑰輪替工作執行新增分散式鎖定 - [PR #23364](https://github.com/BerriAI/litellm/pull/23364), [PR #23834](https://github.com/BerriAI/litellm/pull/23834), [PR #25150](https://github.com/BerriAI/litellm/pull/25150)
- 透過決定性分組、隔離修正、過時別名控制與依順序備援來提升團隊路由可靠性 - [PR #25148](https://github.com/BerriAI/litellm/pull/25148), [PR #25154](https://github.com/BerriAI/litellm/pull/25154)
- 每次非同步 Redis 叢集連線重新產生 GCP IAM token（修正 token TTL 失敗） - [PR #24426](https://github.com/BerriAI/litellm/pull/24426), [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 以有界佇列使用強化 proxy 伺服器可靠性 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 啟動時自動 schema sync - [PR #24705](https://github.com/BerriAI/litellm/pull/24705)
- 重新連線時終止孤兒 Prisma 引擎 - [PR #24149](https://github.com/BerriAI/litellm/pull/24149)
- 使用動態 DB URL - [PR #24827](https://github.com/BerriAI/litellm/pull/24827)
- migration 修正 - [PR #24105](https://github.com/BerriAI/litellm/pull/24105)

## 文件更新 {#documentation-updates}

- MCP 零信任驗證指南 - [PR #23918](https://github.com/BerriAI/litellm/pull/23918)
- 第 1 週上線檢查清單 - [PR #25083](https://github.com/BerriAI/litellm/pull/25083)
- 從 `test_exceptions` 移除 `NLP_CLOUD_API_KEY` 要求 - [PR #24756](https://github.com/BerriAI/litellm/pull/24756)
- 在 `test_gemini` 中將 `gemini-2.0-flash` 更新為 `gemini-2.5-flash` - [PR #24817](https://github.com/BerriAI/litellm/pull/24817)
- HA 控制平面圖表清晰度 + 行動版渲染更新 - [PR #24747](https://github.com/BerriAI/litellm/pull/24747)
- 在組態參考與範例中說明 `default_team_params` - [PR #25032](https://github.com/BerriAI/litellm/pull/25032)
- JWT 到 Virtual Key 對應指南 - [PR #24882](https://github.com/BerriAI/litellm/pull/24882)
- MCP Toolsets 文件與側邊欄更新 - [PR #25155](https://github.com/BerriAI/litellm/pull/25155)
- 安全性文件更新與 4 月硬化部落格 - [PR #24867](https://github.com/BerriAI/litellm/pull/24867), [PR #24868](https://github.com/BerriAI/litellm/pull/24868), [PR #24871](https://github.com/BerriAI/litellm/pull/24871), [PR #25102](https://github.com/BerriAI/litellm/pull/25102)
- 安全事件部落格 - [PR #24537](https://github.com/BerriAI/litellm/pull/24537)
- 安全 townhall 部落格 - [PR #24692](https://github.com/BerriAI/litellm/pull/24692)
- WebRTC 部落格 - [PR #23547](https://github.com/BerriAI/litellm/pull/23547)
- Vanta 公告 - [PR #24800](https://github.com/BerriAI/litellm/pull/24800)
- 提示快取 Gemini 支援文件 - [PR #24222](https://github.com/BerriAI/litellm/pull/24222)
- OpenCode／reasoningSummary 文件 - [PR #24468](https://github.com/BerriAI/litellm/pull/24468)
- Thinking summary 文件 - [PR #22823](https://github.com/BerriAI/litellm/pull/22823)
- v0 文件貢獻 - [PR #24023](https://github.com/BerriAI/litellm/pull/24023)
- 部落格文章 RSS 更新 - [PR #23791](https://github.com/BerriAI/litellm/pull/23791)
- 一般文件清理 + townhall 公告 - [PR #24839](https://github.com/BerriAI/litellm/pull/24839), [PR #25021](https://github.com/BerriAI/litellm/pull/25021), [PR #25026](https://github.com/BerriAI/litellm/pull/25026)

## 基礎架構／安全性備註 {#infrastructure--security-notes}

- 最佳化 CI 管線 - [PR #23721](https://github.com/BerriAI/litellm/pull/23721)
- 將 zizmor 加入 CI/CD - [PR #24663](https://github.com/BerriAI/litellm/pull/24663)
- 移除 `.claude/settings.json` 並透過 semgrep 阻止重新加入 - [PR #24584](https://github.com/BerriAI/litellm/pull/24584)
- 強化 npm 與 Docker 供應鏈工作流程以及發行管線檢查 - [PR #24838](https://github.com/BerriAI/litellm/pull/24838), [PR #24877](https://github.com/BerriAI/litellm/pull/24877), [PR #24881](https://github.com/BerriAI/litellm/pull/24881), [PR #24905](https://github.com/BerriAI/litellm/pull/24905), [PR #24951](https://github.com/BerriAI/litellm/pull/24951), [PR #25023](https://github.com/BerriAI/litellm/pull/25023), [PR #25034](https://github.com/BerriAI/litellm/pull/25034), [PR #25036](https://github.com/BerriAI/litellm/pull/25036), [PR #25037](https://github.com/BerriAI/litellm/pull/25037), [PR #25136](https://github.com/BerriAI/litellm/pull/25136), [PR #25158](https://github.com/BerriAI/litellm/pull/25158)
- 解決 CodeQL/安全性工作流程問題並修正損壞的 action SHA 參照 - [PR #24815](https://github.com/BerriAI/litellm/pull/24815), [PR #24880](https://github.com/BerriAI/litellm/pull/24880), [PR #24697](https://github.com/BerriAI/litellm/pull/24697)
- 鎖定 axios 與工具版本 - [PR #24829](https://github.com/BerriAI/litellm/pull/24829), [PR #24594](https://github.com/BerriAI/litellm/pull/24594), [PR #24607](https://github.com/BerriAI/litellm/pull/24607), [PR #24525](https://github.com/BerriAI/litellm/pull/24525), [PR #24696](https://github.com/BerriAI/litellm/pull/24696)
- 在 GHA matrix 工作流程中重新加入 Codecov 回報 - [PR #24804](https://github.com/BerriAI/litellm/pull/24804), [PR #24815](https://github.com/BerriAI/litellm/pull/24815)
- 修正(docker)：在非 root 執行階段映像中載入 enterprise hooks - [PR #24917](https://github.com/BerriAI/litellm/pull/24917), [PR #25037](https://github.com/BerriAI/litellm/pull/25037)
- OSSF scorecard 工作流程 - [PR #24792](https://github.com/BerriAI/litellm/pull/24792)
- 在 forks 上略過排程的工作流程 - [PR #24460](https://github.com/BerriAI/litellm/pull/24460)
- CI/CD 改進 - [PR #24839](https://github.com/BerriAI/litellm/pull/24839), [PR #24837](https://github.com/BerriAI/litellm/pull/24837), [PR #24740](https://github.com/BerriAI/litellm/pull/24740), [PR #24741](https://github.com/BerriAI/litellm/pull/24741), [PR #24742](https://github.com/BerriAI/litellm/pull/24742), [PR #24754](https://github.com/BerriAI/litellm/pull/24754)
- 移除 neon CLI 相依性 - [PR #24951](https://github.com/BerriAI/litellm/pull/24951)
- 工作流程刪除 - [PR #24541](https://github.com/BerriAI/litellm/pull/24541)
- 發佈至 PyPI 遷移 - [PR #24654](https://github.com/BerriAI/litellm/pull/24654)
- Poetry lock / content-hash 檢查 - [PR #24082](https://github.com/BerriAI/litellm/pull/24082), [PR #24159](https://github.com/BerriAI/litellm/pull/24159)
- 對 14 個檔案套用 Black 格式化 - [PR #24532](https://github.com/BerriAI/litellm/pull/24532), [PR #24092](https://github.com/BerriAI/litellm/pull/24092), [PR #24153](https://github.com/BerriAI/litellm/pull/24153), [PR #24167](https://github.com/BerriAI/litellm/pull/24167), [PR #24173](https://github.com/BerriAI/litellm/pull/24173), [PR #24187](https://github.com/BerriAI/litellm/pull/24187)
- 修正 lint 問題 - [PR #24932](https://github.com/BerriAI/litellm/pull/24932)
- 版本升級至 1.83.0 - [PR #24840](https://github.com/BerriAI/litellm/pull/24840)
- 測試清理與可靠性修正 - [PR #24755](https://github.com/BerriAI/litellm/pull/24755), [PR #24820](https://github.com/BerriAI/litellm/pull/24820), [PR #24824](https://github.com/BerriAI/litellm/pull/24824), [PR #24258](https://github.com/BerriAI/litellm/pull/24258)
- 授權金鑰環境處理 - [PR #24168](https://github.com/BerriAI/litellm/pull/24168)
- 從 repo 移除電話號碼 - [PR #24587](https://github.com/BerriAI/litellm/pull/24587)

## 新貢獻者 {#new-contributors}

* @voidborne-d 首次貢獻於 https://github.com/BerriAI/litellm/pull/23808
* @vanhtuan0409 首次貢獻於 https://github.com/BerriAI/litellm/pull/24078
* @devin-petersohn 首次貢獻於 https://github.com/BerriAI/litellm/pull/24140
* @benlangfeld 首次貢獻於 https://github.com/BerriAI/litellm/pull/24413
* @J-Byron 首次貢獻於 https://github.com/BerriAI/litellm/pull/24449
* @jaydns 首次貢獻於 https://github.com/BerriAI/litellm/pull/24823
* @stuxf 首次貢獻於 https://github.com/BerriAI/litellm/pull/24838
* @clfhhc 首次貢獻於 https://github.com/BerriAI/litellm/pull/24932

**完整變更記錄**：https://github.com/BerriAI/litellm/compare/v1.82.3-stable...v1.83.3-stable

---

## 04/04/2026 {#04042026}

* 新模型 / 已更新模型：59
* LLM API 端點：28
* 管理端點 / UI：61
* 記錄 / 防護欄 / 提示詞管理整合：30
* 支出追蹤、預算與速率限制：11
* MCP Gateway：8
* 效能 / 負載平衡 / 可靠性改進：17
* 文件更新：24
* 基礎架構 / 安全性：50
