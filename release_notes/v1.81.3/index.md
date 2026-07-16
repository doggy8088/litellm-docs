---
title: "v1.81.3 - 效能 - CPU 使用量降低 25%"
slug: "v1-81-3"
date: 2026-01-26T10:00:00
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
docker.litellm.ai/berriai/litellm:v1.81.3-stable
```

</TabItem>

<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.81.3.rc.2
```

</TabItem>
</Tabs>

---

## 新模型 / 已更新模型 {#new-models--updated-models}

### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） | 淘汰日期 |
| -------- | ----- | -------------- | ------------------- | -------------------- | ---------------- |
| OpenAI | `gpt-audio`, `gpt-audio-2025-08-28` | 128K | $32/100 萬 audio tokens, $2.5/100 萬 text tokens | $64/100 萬 audio tokens, $10/100 萬 text tokens | - | 
| OpenAI | `gpt-audio-mini`, `gpt-audio-mini-2025-08-28` | 128K | $10/100 萬 audio tokens, $0.6/100 萬 text tokens | $20/100 萬 audio tokens, $2.4/100 萬 text tokens | - |
| Deepinfra, Vertex AI, Google AI Studio, OpenRouter, Vercel AI Gateway | `gemini-2.0-flash-001`, `gemini-2.0-flash` |  - | - | - | 2026-03-31 |
| Groq | `openai/gpt-oss-120b` | 131K | 0.075/100 萬 cache read | 0.6/100 萬 output tokens | - |
| Groq | `groq/openai/gpt-oss-20b` | 131K | 0.0375/100 萬 cache read, $0.075/100 萬 text tokens | 0.3/100 萬 output tokens | - |
| Vertex AI | `gemini-2.5-computer-use-preview-10-2025` | 128K |  $1.25 | $10 | - |
| Azure AI | `claude-haiku-4-5` | $1.25/100 萬 cache read, $2/100 萬 cache read above 1 hr, $0.1/100 萬 text tokens | $5/100 萬 output tokens | - |
| Azure AI | `claude-sonnet-4-5` | $3.75/100 萬 cache read, $6/100 萬 cache read above 1 hr, $3/100 萬 text tokens | $15/100 萬 output tokens | - |
| Azure AI | `claude-opus-4-5` | $6.25/100 萬 cache read, $10/100 萬 cache read above 1 hr, $0.5/100 萬 text tokens | $25/100 萬 output tokens | - |
| Azure AI | `claude-opus-4-1` | $18.75/100 萬 cache read, $30/100 萬 cache read above 1 hr, $1.5/100 萬 text tokens | $75/100 萬 output tokens | - |

### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - 將 gpt-audio 和 gpt-audio-mini 模型加入定價 - [PR #19509](https://github.com/BerriAI/litellm/pull/19509)
    - 修正 gpt-4o-audio-preview 模型的 audio token 成本 - [PR #19500](https://github.com/BerriAI/litellm/pull/19500)
    - 依照 openai 規格限制 stop sequence（確保與 JetBrains IDE 相容）- [PR #19562](https://github.com/BerriAI/litellm/pull/19562)

- **[VertexAI](../../docs/providers/vertex)**
    - 文件 - Google Workload Identity Federation（WIF）支援 - [PR #19320](https://github.com/BerriAI/litellm/pull/19320)

- **[Agentcore](../../docs/providers/bedrock_agentcore)**
    - 修正 AWS Bedrock AgentCore 的串流問題，回應會在第一個 chunk 後停止，特別影響啟用 OAuth 的 agent - [PR #17141](https://github.com/BerriAI/litellm/pull/17141)

- **[Chatgpt](../../docs/providers/chatgpt)**
    - 新增透過 LiteLLM 呼叫 chatgpt 訂閱的支援 - [PR #19030](https://github.com/BerriAI/litellm/pull/19030)
    - 新增 chatgpt 訂閱提供者的 responses API bridge 支援 - [PR #19030](https://github.com/BerriAI/litellm/pull/19030)

- **[Bedrock](../../docs/providers/bedrock)**
    - 支援透過 v1/messages 的 bedrock invoke 輸出格式 - [PR #19560](https://github.com/BerriAI/litellm/pull/19560)
    
- **[Azure](../../docs/providers/azure/azure)**
    - 新增 Azure OpenAI v1 API 支援 - [PR #19313](https://github.com/BerriAI/litellm/pull/19313)
    - 保留 images 的 content_policy_violation 詳細資訊 - [PR #19372](https://github.com/BerriAI/litellm/pull/19372)
    - 支援 Responses API 的 OpenAI 格式巢狀工具定義 - [PR #19526](https://github.com/BerriAI/litellm/pull/19526)

- **Gemini([Vertex AI](../../docs/providers/vertex), [Google AI Studio](../../docs/providers/gemini))**
    - 對 Gemini 2.0+ 模型使用 responseJsonSchema - [PR #19314](https://github.com/BerriAI/litellm/pull/19314)

- **[Volcengine](../../docs/providers/volcano)**
    - 支援 Volcengine responses api - [PR #18508](https://github.com/BerriAI/litellm/pull/18508)

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增透過 LiteLLM 呼叫 Claude Code Max 訂閱的支援 - [PR #19453](https://github.com/BerriAI/litellm/pull/19453)
    - 為 /v1/messages、Anthropic API、Azure Anthropic API、Bedrock Converse 新增結構化輸出 - [PR #19545](https://github.com/BerriAI/litellm/pull/19545)

- **[Brave Search](../../docs/search/brave)**
    - 新的搜尋提供者 - [PR #19433](https://github.com/BerriAI/litellm/pull/19433)

- **Sarvam ai**
    - 新增對新 sarvam 模型的支援 - [PR #19479](https://github.com/BerriAI/litellm/pull/19479)

- **[GMI](../../docs/providers/gmi)**
    - 新增 GMI Cloud 提供者支援 - [PR #19376](https://github.com/BerriAI/litellm/pull/19376)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 anthopic-beta sent client side 被覆寫而不是附加的問題 - [PR #19343](https://github.com/BerriAI/litellm/pull/19343)
    - 從 Anthropic 的 output_format API 的 JSON schema 中篩除不支援的欄位 - [PR #19482](https://github.com/BerriAI/litellm/pull/19482)

- **[Bedrock](../../docs/providers/bedrock)**
    - 透過 /image_edits endpoint 暴露 stability models，並確保正確的 request 轉換 - [PR #19323](https://github.com/BerriAI/litellm/pull/19323)
    - Claude Code x Bedrock Invoke 在 advanced-tool-use-2025-11-20 下失敗 - [PR #19373](https://github.com/BerriAI/litellm/pull/19373)
    - 去除 assistant 歷史中的重複 tool calls - [PR #19324](https://github.com/BerriAI/litellm/pull/19324)
    - 修正：更正 us.anthropic.claude-opus-4-5 區域內定價 - [PR #19310](https://github.com/BerriAI/litellm/pull/19310)
    - 修正使用 Claude 4 透過 bedrock invoke 時的 request 驗證錯誤 - [PR #19381](https://github.com/BerriAI/litellm/pull/19381)
    - 處理 Claude 4 模型搭配 tool calls 的 thinking - [PR #19506](https://github.com/BerriAI/litellm/pull/19506)
    - 修正 tool calls 的串流 choice index - [PR #19506](https://github.com/BerriAI/litellm/pull/19506)

- **[Ollama](../../docs/providers/ollama)**
    - 修正因改良訊息擷取而導致的 tool call 錯誤 - [PR #19369](https://github.com/BerriAI/litellm/pull/19369)

- **[VertexAI](../../docs/providers/vertex)**
    - 在 request 傳送至 vertex 前移除可選的 vertex_count_tokens_location 參數 - [PR #19359](https://github.com/BerriAI/litellm/pull/19359)

- **Gemini([Vertex AI](../../docs/providers/vertex), [Google AI Studio](../../docs/providers/gemini))**
    - 在使用 Gemini video understanding 時，支援為每個 video file 設定 media_resolution 和 fps 參數 - [PR #19273](https://github.com/BerriAI/litellm/pull/19273)
    - 處理來自 OpenAI Agents SDK 的 reasoning_effort 字典 - [PR #19419](https://github.com/BerriAI/litellm/pull/19419)
    - 在 tool results 中新增 file content 支援 - [PR #19416](https://github.com/BerriAI/litellm/pull/19416)

- **[Azure](../../docs/providers/azure_ai)**
    - 修正 Anthropic 模型的 Azure AI 成本 - [PR #19530](https://github.com/BerriAI/litellm/pull/19530)

- **[Giga Chat](../../docs/providers/gigachat)**
    - 新增 tool choice 對應 - [PR #19645](https://github.com/BerriAI/litellm/pull/19645)
---

## AI API 端點（LLMs、MCP、Agents） {#ai-api-endpoints-llms-mcp-agents}

### 功能 {#features-1}

- **[Files API](../../docs/files_endpoints)**
    - 當 load_balancing 為 True 時新增受管理檔案支援 - [PR #19338](https://github.com/BerriAI/litellm/pull/19338)

- **[Claude Plugin Marketplace](../../docs/tutorials/claude_code_plugin_marketplace)**
    - 新增自架的 Claude Code Plugin Marketplace - [PR #19378](https://github.com/BerriAI/litellm/pull/19378)

- **[MCP](../../docs/mcp)**
    - 新增 MCP Protocol 版本 2025-11-25 支援 - [PR #19379](https://github.com/BerriAI/litellm/pull/19379)
    - 將 MCP tool calls 與工具清單記錄到 LiteLLM Spend Logs 表格中，以便更容易除錯 - [PR #19469](https://github.com/BerriAI/litellm/pull/19469)

- **[Vertex AI](../../docs/providers/vertex)**
    - 確保預設只會將 anthropic betas 向下傳遞至 LLM API - [PR #19542](https://github.com/BerriAI/litellm/pull/19542)
    - 允許覆寫，以支援將傳入標頭向下傳遞至目標 - [PR #19524](https://github.com/BerriAI/litellm/pull/19524)

- **[Chat/Completions](../../docs/completion/input)**
    - 將 MCP tools 回應新增到 chat completions - [PR #19552](https://github.com/BerriAI/litellm/pull/19552)
    - 將自訂 vertex ai finish reasons 新增到輸出中 - [PR #19558](https://github.com/BerriAI/litellm/pull/19558)
    - 在串流期間，於 /chat/completions 中於模型輸出前回傳 MCP 執行結果 - [PR #19623](https://github.com/BerriAI/litellm/pull/19623)

### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 修正 MCP 串流工具執行期間重複訊息的問題 - [PR #19317](https://github.com/BerriAI/litellm/pull/19317)
    - 修正將 OpenAI 的 Responses API 與 stream=True 及 tool_choice 類型為 allowed_tools（OpenAI 原生參數）一起使用時的 pickle 錯誤 - [PR #17205](https://github.com/BerriAI/litellm/pull/17205)
    - 為非-openai 模型串流 tool call 事件 - [PR #19368](https://github.com/BerriAI/litellm/pull/19368)
    - 在 responses bridge 中保留 gemini 的工具輸出順序 - [PR #19360](https://github.com/BerriAI/litellm/pull/19360)
    - 新增 ID 快取以防止 ID 不匹配的 text-start 與 text-delta - [PR #19390](https://github.com/BerriAI/litellm/pull/19390)
    - 為非-openai 模型包含 output_item、reasoning_summary_Text_done 和 reasoning_summary_part_done 事件 - [PR #19472](https://github.com/BerriAI/litellm/pull/19472) 

- **[Chat/Completions](../../docs/completion/input)**
    - 修正：drop_params 未能為非-OpenAI 提供者移除 prompt_cache_key - [PR #19346](https://github.com/BerriAI/litellm/pull/19346)

- **[Realtime API](../../docs/realtime)**
    - 為 ws:// WebSocket 連線停用 SSL - [PR #19345](https://github.com/BerriAI/litellm/pull/19345)

- **[Generate Content](../../docs/generateContent)**
    - 當從用戶端呼叫 google genai/vertex 端點時，記錄實際的使用者輸入 - [PR #19156](https://github.com/BerriAI/litellm/pull/19156)

- **[/messages/count_tokens Anthropic Token Counting](../../docs/anthropic_count_tokens)**
    - 確保其可用於 Anthropic、AI Gateway 上的 Azure AI Anthropic - [PR #19432](https://github.com/BerriAI/litellm/pull/19432)

- **[MCP](../../docs/mcp)**
    - 將 static_headers 傳遞給 MCP 伺服器 - [PR #19366](https://github.com/BerriAI/litellm/pull/19366)

- **[Batch API](../../docs/batches)**
    - 修正：batch 的 generation config 為空 - [PR #19556](https://github.com/BerriAI/litellm/pull/19556)

- **[Pass Through Endpoints](../../docs/proxy/pass_through)**
    - 一律重新更新 registry - [PR #19420](https://github.com/BerriAI/litellm/pull/19420)
---

## 管理端點 / UI {#management-endpoints--ui}

### 功能 {#features-2}

- **成本估算器**
    - 修正模型下拉選單 - [PR #19529](https://github.com/BerriAI/litellm/pull/19529)

- **Claude Code 外掛**
    - 允許透過 UI 新增 Claude Code Plugins - [PR #19387](https://github.com/BerriAI/litellm/pull/19387)

- **防護欄**
    - 全新的政策管理 UI - [PR #19668](https://github.com/BerriAI/litellm/pull/19668)
    - 允許在金鑰/團隊上新增政策 + 在資訊面板中檢視 - [PR #19688](https://github.com/BerriAI/litellm/pull/19688)

- **一般**
    - 遵循自訂驗證標頭覆寫 - [PR #19276](https://github.com/BerriAI/litellm/pull/19276)

- **Playground**
    - 填入自訂 API Base 的按鈕 - [PR #19440](https://github.com/BerriAI/litellm/pull/19440)
    - 在 play ground 顯示 mcp 輸出 - [PR #19553](https://github.com/BerriAI/litellm/pull/19553)

- **模型**
    - 對 /v2/models/info 分頁 - [PR #19521](https://github.com/BerriAI/litellm/pull/19521)
    - 所有模型分頁標籤分頁 - [PR #19525](https://github.com/BerriAI/litellm/pull/19525)
    - 為 /models 新增可選的 scope 參數 - [PR #19539](https://github.com/BerriAI/litellm/pull/19539)
    - 模型搜尋 - [PR #19622](https://github.com/BerriAI/litellm/pull/19622)
    - 依 Model ID 與 Team ID 篩選 - [PR #19713](https://github.com/BerriAI/litellm/pull/19713)

- **MCP 伺服器**
    - MCP Tools 分頁重設為總覽 - [PR #19468](https://github.com/BerriAI/litellm/pull/19468)

- **組織**
    - 防止 org admin 建立具有 proxy_admin 權限的新使用者 - [PR #19296](https://github.com/BerriAI/litellm/pull/19296)
    - 編輯頁面：可重複使用的模型選擇器 - [PR #19601](https://github.com/BerriAI/litellm/pull/19601)

- **團隊**
    - 可重複使用的模型選擇器 - [PR #19543](https://github.com/BerriAI/litellm/pull/19543)
    - [修正] 具有所有 Proxy Models 的 Organization 的 Team 更新 - [PR #19604](https://github.com/BerriAI/litellm/pull/19604)

- **記錄**
    - 在支出記錄表格中包含工具參數 - [PR #19640](https://github.com/BerriAI/litellm/pull/19640)

- **備援 / 負載平衡**
    - 全新的備援對話框 - [PR #19673](https://github.com/BerriAI/litellm/pull/19673)
    - 依 team/key 設定備援/負載平衡 - [PR #19686](https://github.com/BerriAI/litellm/pull/19686)

### 錯誤修正 {#bugs-1}

- **Playground**
    - 增加 playground Compare 檢視中的模型選擇器寬度 - [PR #19423](https://github.com/BerriAI/litellm/pull/19423)

- **虛擬金鑰**
    - 排序顯示錯誤項目 - [PR #19534](https://github.com/BerriAI/litellm/pull/19534)

- **一般**
    - 當設定 SERVER_ROOT_PATH 時 UI 發生 404 錯誤 - [PR #19467](https://github.com/BerriAI/litellm/pull/19467)
    - JWT 過期時重新導向至 ui/login - [PR #19687](https://github.com/BerriAI/litellm/pull/19687)

- **SSO**
    - 修正現有使用者的 SSO 使用者角色未更新 - [PR #19621](https://github.com/BerriAI/litellm/pull/19621)

- **防護欄**
    - 確保在編輯與模式切換時防護欄模式會保留 - [PR #19265](https://github.com/BerriAI/litellm/pull/19265)
---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **一般記錄**
    - 防止列印重複的 StandardLoggingPayload 記錄 - [PR #19325](https://github.com/BerriAI/litellm/pull/19325)
    - 修正：啟用 json_logs 時記錄重複 - [PR #19705](https://github.com/BerriAI/litellm/pull/19705)
- **Langfuse OTEL**
    - 忽略服務記錄並修正 callback 覆寫 - [PR #19298](https://github.com/BerriAI/litellm/pull/19298)
- **Langfuse**
    - 傳送 litellm_trace_id - [PR #19528](https://github.com/BerriAI/litellm/pull/19528)
    - 新增 Langfuse mock 模式，以便在不呼叫 API 的情況下進行測試 - [PR #19676](https://github.com/BerriAI/litellm/pull/19676)
- **GCS 儲存桶**
    - 防止因 API 呼叫過慢導致無界限的佇列成長 - [PR #19297](https://github.com/BerriAI/litellm/pull/19297)
    - 新增 GCS mock 模式，以便在不呼叫 API 的情況下進行測試 - [PR #19683](https://github.com/BerriAI/litellm/pull/19683)
- **Responses API 記錄**
    - 修正 pydantic 序列化錯誤 - [PR #19486](https://github.com/BerriAI/litellm/pull/19486)
- **Arize Phoenix**
    - 將 openinference span kinds 新增至 arize phoenix - [PR #19267](https://github.com/BerriAI/litellm/pull/19267)
- **Prometheus**
    - 新增用於使用者數與團隊數的 prometheus 指標 - [PR #19520](https://github.com/BerriAI/litellm/pull/19520)

### 防護欄 {#guardrails}

- **Bedrock 防護欄**
    - 確保 post_call 防護欄檢查 input+output - [PR #19151](https://github.com/BerriAI/litellm/pull/19151)
- **Prompt Security**
    - 修正 prompt-security 的防護欄實作 - [PR #19374](https://github.com/BerriAI/litellm/pull/19374)
- **Presidio**
    - 修正在背景執行緒（logging_hook）中執行時 Presidio Guardrail 的當機問題 - [PR #19714](https://github.com/BerriAI/litellm/pull/19714)
- **Pillar Security**
    - 將 Pillar Security 遷移至 Generic Guardrail API - [PR #19364](https://github.com/BerriAI/litellm/pull/19364)
- **政策引擎**
    - 全新的 LiteLLM Policy engine - 建立政策以管理防護欄、條件 - 依 Key、Team 設定權限 - [PR #19612](https://github.com/BerriAI/litellm/pull/19612)
- **一般**
    - 為防護欄模式與動作新增不區分大小寫支援 - [PR #19480](https://github.com/BerriAI/litellm/pull/19480)

### Prompt 管理 {#prompt-management}

- **一般**
    - 修正使用正確 ID 查詢與刪除 prompt 資訊 - [PR #19358](https://github.com/BerriAI/litellm/pull/19358)

### 秘密管理員 {#secret-manager}

- **AWS Secret Manager**
    - 確保自動輪替會更新既有的 AWS secret，而不是建立新的 - [PR #19455](https://github.com/BerriAI/litellm/pull/19455)
- **Hashicorp Vault**
    - 確保金鑰輪替可與 Vault 搭配運作 - [PR #19634](https://github.com/BerriAI/litellm/pull/19634)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **定價更新**
    - 新增 openai/dall-e 基礎定價項目 - [PR #19133](https://github.com/BerriAI/litellm/pull/19133)
    - 在 ModelInfoBase 中新增 `input_cost_per_video_per_second` - [PR #19398](https://github.com/BerriAI/litellm/pull/19398)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **一般**
    - 修正 proxy utils 中的日期溢位／除以零問題 - [PR #19527](https://github.com/BerriAI/litellm/pull/19527)
    - 修正當 health-check 於獨立程序執行時，SIGTERM 下進行中的請求終止問題 - [PR #19427](https://github.com/BerriAI/litellm/pull/19427)
    - 修正 Pass through routes 以配合 server root path - [PR #19383](https://github.com/BerriAI/litellm/pull/19383)
    - 修正 stop iteration 的記錄錯誤 - [PR #19649](https://github.com/BerriAI/litellm/pull/19649)
    - 防止重試 4xx 用戶端錯誤 - [PR #19275](https://github.com/BerriAI/litellm/pull/19275)
    - 為 health check 的設定錯誤新增更好的錯誤處理 - [PR #19441](https://github.com/BerriAI/litellm/pull/19441)

- **路由器**
    - 修正 Azure RPM 計算公式 - [PR #19513](https://github.com/BerriAI/litellm/pull/19513)
    - 將排程器請求佇列持久化到 redis - [PR #19304](https://github.com/BerriAI/litellm/pull/19304)
    - 在由 DB 觸發的初始化期間將 search_tools 傳遞給 Router - [PR #19388](https://github.com/BerriAI/litellm/pull/19388)
    - 修正 PromptCachingCache，以正確處理 cache_control 是字串內容同層鍵的訊息 - [PR #19266](https://github.com/BerriAI/litellm/pull/19266)

- **記憶體洩漏/OOM**
    - 防止 tool schemas 中巢狀 $defs 造成 OOM - [PR #19112](https://github.com/BerriAI/litellm/pull/19112)
    - 修正：Presidio、OpenAI 與 Gemini 中的 HTTP 用戶端記憶體洩漏 - [PR #19190](https://github.com/BerriAI/litellm/pull/19190)

- **非 root**
    - 修正 non root 環境的 supervisor logfile 和 pidfile - [PR #17267](https://github.com/BerriAI/litellm/pull/17267)
    - 解決 non-root images 中的唯讀檔案系統錯誤 - [PR #19449](https://github.com/BerriAI/litellm/pull/19449)

- **Dockerfile**
    - Redis Semantic Caching - 在 requirements.txt 中新增缺少的 redisvl 依賴項 - [PR #19417](https://github.com/BerriAI/litellm/pull/19417)
    - 提升 OTEL 版本以支援 a2a 相依性 - 由 @Harshit28j 在 #18991 中解決 Microsoft Agents 的 modulenotfounderror

- **DB**
    - 處理 rolling deployments 期間的 PostgreSQL cached plan errors - [PR #19424](https://github.com/BerriAI/litellm/pull/19424)

- **逾時**
    - 修正：total timeout 未被遵守 - [PR #19389](https://github.com/BerriAI/litellm/pull/19389)

- **SDK**
    - 將欄位存在性檢查加入型別類別，以避免屬性錯誤 - [PR #18321](https://github.com/BerriAI/litellm/pull/18321)
    - 新增 google-cloud-aiplatform 作為可選依賴項，並提供清楚的錯誤訊息 - [PR #19437](https://github.com/BerriAI/litellm/pull/19437)
    - 將 grpc 依賴項設為可選 - [PR #19447](https://github.com/BerriAI/litellm/pull/19447)
    - 新增對重試政策的支援 - [PR #19645](https://github.com/BerriAI/litellm/pull/19645)

- **效能**
    - 透過減少 pre-call processing time，將 chat_completion latency 降低約 21% - [PR #19535](https://github.com/BerriAI/litellm/pull/19535)
    - 以 O(1) index check 最佳化 strip_trailing_slash - [PR #19679](https://github.com/BerriAI/litellm/pull/19679)
    - 以 set intersection 最佳化 use_custom_pricing_for_model - [PR #19677](https://github.com/BerriAI/litellm/pull/19677)
    - perf: 對非萬用字元模型略過 pattern_router.route() - [PR #19664](https://github.com/BerriAI/litellm/pull/19664)
    - perf: 為 get_model_info 新增 LRU caching，以加快成本查詢速度 - [PR #19606](https://github.com/BerriAI/litellm/pull/19606)

---

## 一般 Proxy 改進 {#general-proxy-improvements}

### 文件改進 {#doc-improvements}
    - 新增透過 LiteLLM 將 MCP 新增到 Cursor 的教學 - [PR #19317](https://github.com/BerriAI/litellm/pull/19317)
    - 在 Vertex AI pass-through 文件中將 vertex_region 修正為 vertex_location - [PR #19380](https://github.com/BerriAI/litellm/pull/19380)
    - 釐清 json file 中 Gemini 與 Vertex AI model prefix - [PR #19443](https://github.com/BerriAI/litellm/pull/19443)
    - 更新 Claude Code integration guides - [PR #19415](https://github.com/BerriAI/litellm/pull/19415)
    - 調整 opencode 教學 - [PR #19605](https://github.com/BerriAI/litellm/pull/19605)
    - 新增 spend-queue-troubleshooting 文件 - [PR #19659](https://github.com/BerriAI/litellm/pull/19659)
    - docs：為 managed files 新增 litellm-enterprise requirement - [PR #19689](https://github.com/BerriAI/litellm/pull/19689)

### Helm {#helm}
    - 在 helm chart 中新增對 keda 的支援 - [PR #19337](https://github.com/BerriAI/litellm/pull/19337)
    - 將 Helm chart version 與 LiteLLM release version 同步 - [PR #19438](https://github.com/BerriAI/litellm/pull/19438)
    - 在 values.yaml 中啟用 PreStop hook 設定 - [PR #19613](https://github.com/BerriAI/litellm/pull/19613)

### 一般 {#general}
    - 新增健康檢查腳本與平行執行支援 - [PR #19295](https://github.com/BerriAI/litellm/pull/19295)

---

## 新貢獻者 {#new-contributors}

* @dushyantzz 的首次貢獻出現在 [PR #19158](https://github.com/BerriAI/litellm/pull/19158)
* @obod-mpw 的首次貢獻出現在 [PR #19133](https://github.com/BerriAI/litellm/pull/19133)
* @msexxeta 的首次貢獻出現在 [PR #19030](https://github.com/BerriAI/litellm/pull/19030)
* @rsicart 的首次貢獻出現在 [PR #19337](https://github.com/BerriAI/litellm/pull/19337)
* @cluebbehusen 的首次貢獻出現在 [PR #19311](https://github.com/BerriAI/litellm/pull/19311)
* @Lucky-Lodhi2004 的首次貢獻出現在 [PR #19315](https://github.com/BerriAI/litellm/pull/19315)
* @binbandit 的首次貢獻出現在 [PR #19324](https://github.com/BerriAI/litellm/pull/19324)
* @flex-myeonghyeon 的首次貢獻出現在 [PR #19381](https://github.com/BerriAI/litellm/pull/19381)
* @Lrakotoson 的首次貢獻出現在 [PR #18321](https://github.com/BerriAI/litellm/pull/18321)
* @bensi94 的首次貢獻出現在 [PR #18787](https://github.com/BerriAI/litellm/pull/18787)
* @victorigualada 的首次貢獻出現在 [PR #19368](https://github.com/BerriAI/litellm/pull/19368)
* @VedantMadane 的首次貢獻出現在 #19266
* @stiyyagura0901 的首次貢獻出現在 #19276
* @kamilio 的首次貢獻出現在 [PR #19447](https://github.com/BerriAI/litellm/pull/19447)
* @jonathansampson 的首次貢獻出現在 [PR #19433](https://github.com/BerriAI/litellm/pull/19433)
* @rynecarbone 的首次貢獻出現在 [PR #19416](https://github.com/BerriAI/litellm/pull/19416)
* @jayy-77 的首次貢獻出現在 #19366
* @davida-ps 的首次貢獻出現在 [PR #19374](https://github.com/BerriAI/litellm/pull/19374)
* @joaodinissf 的首次貢獻出現在 [PR #19506](https://github.com/BerriAI/litellm/pull/19506)
* @ecao310 的首次貢獻出現在 [PR #19520](https://github.com/BerriAI/litellm/pull/19520)
* @mpcusack-altos 的首次貢獻出現在 [PR #19577](https://github.com/BerriAI/litellm/pull/19577)
* @milan-berri 的首次貢獻出現在 [PR #19602](https://github.com/BerriAI/litellm/pull/19602)
* @xqe2011 的首次貢獻出現在 #19621

---

## 完整變更記錄 {#full-changelog}

**[在 GitHub 上檢視完整變更記錄](https://github.com/BerriAI/litellm/releases/tag/v1.81.3.rc)**
