---
title: "v1.82.0 - 即時防護欄、專案管理，以及 10+ 項效能最佳化"
slug: "v1-82-0"
date: 2026-02-28T00:00:00
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

## 使用此版本進行部署 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-1.82.0-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.82.0
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **即時 API 防護欄** — [完整支援 `/v1/realtime` WebSocket 工作階段，包含請求前/後強制執行、語音轉錄掛鉤、工作階段終止政策，以及 Vertex AI Gemini Live 支援](../../docs/proxy/guardrails) - [PR #22152](https://github.com/BerriAI/litellm/pull/22152), [PR #22153](https://github.com/BerriAI/litellm/pull/22153), [PR #22161](https://github.com/BerriAI/litellm/pull/22161), [PR #22165](https://github.com/BerriAI/litellm/pull/22165)
- **專案管理** — [全新的 Projects UI，具備完整 CRUD、專案範圍虛擬金鑰，以及管理員自願啟用切換—依專案組織團隊與金鑰](../../docs/proxy/ui_store_model_db_setting) - [PR #22315](https://github.com/BerriAI/litellm/pull/22315), [PR #22360](https://github.com/BerriAI/litellm/pull/22360), [PR #22373](https://github.com/BerriAI/litellm/pull/22373), [PR #22412](https://github.com/BerriAI/litellm/pull/22412)
- **防護欄生態系擴展** — [Noma v2、Lakera v2 後置呼叫、Singapore 法規政策（PDPA + MAS）、就業歧視阻擋器、程式碼執行阻擋器、防護欄政策版本控管，以及正式環境監控](../../docs/proxy/guardrails) - [PR #21400](https://github.com/BerriAI/litellm/pull/21400), [PR #21783](https://github.com/BerriAI/litellm/pull/21783), [PR #21948](https://github.com/BerriAI/litellm/pull/21948)
- **OpenAI Codex 5.3 — 第 0 天** — [OpenAI 與 Azure 上的完整支援 `gpt-5.3-codex`，以及 `gpt-audio-1.5` 和 `gpt-realtime-1.5` 模型涵蓋範圍](../../docs/providers/openai) - [PR #22035](https://github.com/BerriAI/litellm/pull/22035)
- **10+ 項效能最佳化** — 串流 hot path 修正、Redis pipeline 批次處理、資料庫任務批次處理、ModelResponse 初始化跳過，以及路由快取改進—降低每次請求的延遲與 CPU
- **`/v1/messages` → `/responses` 路由** — 預設情況下，`/v1/messages` 請求現在會路由至 [Responses API](../../docs/response_api)，適用於 OpenAI/Azure 模型

:::danger v1/messages routing change
此版本開始預設將 `/v1/messages` 請求路由至 `/responses` API。若要停用並繼續使用 chat/completions，請在您的設定中設為 `LITELLM_USE_CHAT_COMPLETIONS_URL_FOR_ANTHROPIC_MESSAGES=true` 或 `litellm_settings.use_chat_completions_url_for_anthropic_messages: true`。
:::

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（20 個新模型） {#new-model-support-20-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（每 100 萬 tokens / 美元） | 輸出（每 100 萬 tokens / 美元） | 功能 |
| -------- | ----- | -------------- | ------------------- | -------------------- | -------- |
| OpenAI | `gpt-5.3-codex` | 272K | $1.75 | $14.00 | 推理、程式撰寫 |
| Azure OpenAI | `azure/gpt-5.3-codex` | 272K | $1.75 | $14.00 | Azure 部署 |
| OpenAI | `gpt-audio-1.5` | 128K | $2.50 | $10.00 | 音訊模型 |
| Azure OpenAI | `azure/gpt-audio-1.5-2026-02-23` | 128K | $2.50 | $10.00 | 音訊模型 |
| OpenAI | `gpt-realtime-1.5` | 32K | $4.00 | $16.00 | 即時模型 |
| Azure OpenAI | `azure/gpt-realtime-1.5-2026-02-23` | 32K | $4.00 | $16.00 | 即時模型 |
| Groq | `groq/openai/gpt-oss-safeguard-20b` | 131K | $0.075 | $0.30 | 防護欄推論 |
| Google Vertex AI | `vertex_ai/gemini-3.1-flash-image-preview` | - | - | - | 圖片生成 |
| Perplexity | `perplexity/perplexity/sonar` | - | - | - | Sonar 搜尋 |
| Perplexity | `perplexity/openai/gpt-5.1` | - | - | - | 代管路由 |
| Perplexity | `perplexity/openai/gpt-5-mini` | - | - | - | 代管路由 |
| Perplexity | `perplexity/google/gemini-2.5-flash` | - | - | - | 代管路由 |
| Perplexity | `perplexity/google/gemini-2.5-pro` | - | - | - | 代管路由 |
| Perplexity | `perplexity/google/gemini-3-flash-preview` | - | - | - | 代管路由 |
| Perplexity | `perplexity/google/gemini-3-pro-preview` | - | - | - | 代管路由 |
| Perplexity | `perplexity/anthropic/claude-haiku-4-5` | - | - | - | 代管路由 |
| Perplexity | `perplexity/anthropic/claude-sonnet-4-5` | - | - | - | 代管路由 |
| Perplexity | `perplexity/anthropic/claude-opus-4-5` | - | - | - | 代管路由 |
| Perplexity | `perplexity/anthropic/claude-opus-4-6` | - | - | - | 代管路由 |
| Perplexity | `perplexity/xai/grok-4-1-fast-non-reasoning` | - | - | - | 代管路由 |

#### 功能 {#features}

- **[OpenAI](../../docs/providers/openai)**
    - OpenAI 與 Azure 的 `gpt-5.3-codex` 第 0 天支援 - [PR #22035](https://github.com/BerriAI/litellm/pull/22035)
    - 新增 `gpt-audio-1.5` 模型成本對應 - [PR #22303](https://github.com/BerriAI/litellm/pull/22303)
    - 新增 `gpt-realtime-1.5` 模型成本對應 - [PR #22304](https://github.com/BerriAI/litellm/pull/22304)
    - 將 `audio` 新增為支援的 OpenAI 參數 - [PR #22092](https://github.com/BerriAI/litellm/pull/22092)
    - 新增 `prompt_cache_key` 與 `prompt_cache_retention` 支援 - [PR #20397](https://github.com/BerriAI/litellm/pull/20397)

- **[Azure OpenAI](../../docs/providers/azure)**
    - 新的 Azure OpenAI 模型 2026-02-25 - [PR #22114](https://github.com/BerriAI/litellm/pull/22114)

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增 v1 Anthropic Responses API 轉換 - [PR #22087](https://github.com/BerriAI/litellm/pull/22087)
    - 清理 `tool_use` ID 於 `convert_to_anthropic_tool_invoke` 中 - [PR #21964](https://github.com/BerriAI/litellm/pull/21964)
    - 修正模型萬用字元存取問題 - [PR #21917](https://github.com/BerriAI/litellm/pull/21917)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 為 OpenAI 相容的 Bedrock 匯入模型編碼模型 ARN - [PR #21701](https://github.com/BerriAI/litellm/pull/21701)
    - 在角色假設中支援可選的區域性 STS 端點 - [PR #21640](https://github.com/BerriAI/litellm/pull/21640)
    - 原生結構化輸出 API 支援 - [PR #21222](https://github.com/BerriAI/litellm/pull/21222)

- **[Google Vertex AI](../../docs/providers/vertex)**
    - 將 `gemini-3.1-flash-image-preview` 新增至模型成本對應 - [PR #22223](https://github.com/BerriAI/litellm/pull/22223)
    - 為 Vertex AI 提供者啟用 `context-1m-2025-08-07` beta 標頭 - [PR #21867](https://github.com/BerriAI/litellm/pull/21867)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 將 OpenRouter 原生模型新增至模型成本對應 - [PR #20520](https://github.com/BerriAI/litellm/pull/20520)
    - 將 OpenRouter Opus 4.6 新增至模型對應 - [PR #20525](https://github.com/BerriAI/litellm/pull/20525)

- **[Mistral](../../docs/providers/mistral)**
    - 調整 `mistral-small-2503` 每個 token 的輸入/輸出成本 - [PR #22097](https://github.com/BerriAI/litellm/pull/22097)

- **[Groq](../../docs/providers/groq)**
    - 新增 `groq/openai/gpt-oss-safeguard-20b` 模型定價 - [PR #21951](https://github.com/BerriAI/litellm/pull/21951)

- **[AI/ML](../../docs/providers/aiml)**
    - 更新 AIML 模型定價 - [PR #22139](https://github.com/BerriAI/litellm/pull/22139)

- **[Ollama](../../docs/providers/ollama)**
    - 將 `api_base` 傳遞至 `get_model_info` + 優雅備援 - [PR #21970](https://github.com/BerriAI/litellm/pull/21970)

- **[PublicAI](../../docs/providers/openai)**
    - 修正 PublicAI Apertus 模型的函式呼叫 - [PR #21582](https://github.com/BerriAI/litellm/pull/21582)

- **[xAI](../../docs/providers/xai)**
    - 為 `grok-2-vision-1212` 和 `grok-3-mini` 模型新增淘汰日期 - [PR #20102](https://github.com/BerriAI/litellm/pull/20102)

- **一般**
    - 轉送提供者的驗證標頭 - [PR #22070](https://github.com/BerriAI/litellm/pull/22070)
    - 將 camelCase 的 `thinking` 參數鍵正規化為 snake_case - [PR #21762](https://github.com/BerriAI/litellm/pull/21762)
    - 允許非 text-embedding-3 OpenAI 模型透傳 `dimensions` 參數 - [PR #22144](https://github.com/BerriAI/litellm/pull/22144)

### 錯誤修正 {#bug-fixes}

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 修正 `parallel_tool_calls` 的 converse 處理 - [PR #22267](https://github.com/BerriAI/litellm/pull/22267)
    - 還原 `parallel_tool_calls` 在 `map_openai_params` 中的對應 - [PR #22333](https://github.com/BerriAI/litellm/pull/22333)
    - 更正 Converse API 批次模型的 `modelInput` 格式 - [PR #21656](https://github.com/BerriAI/litellm/pull/21656)
    - 防止 `create_file` S3 金鑰出現雙重 UUID - [PR #21650](https://github.com/BerriAI/litellm/pull/21650)
    - 在與真實工具混用時過濾內部 `json_tool_call` - [PR #21107](https://github.com/BerriAI/litellm/pull/21107)
    - 將 timeout 參數傳遞給 Bedrock rerank HTTP 用戶端 - [PR #22021](https://github.com/BerriAI/litellm/pull/22021)

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 anthropic fast 和 `inference_geo` 的 model cost map - [PR #21904](https://github.com/BerriAI/litellm/pull/21904)

- **[影像生成](../../docs/image_generation)**
    - 將 `extra_headers` 傳遞至上游影像生成 - [PR #22026](https://github.com/BerriAI/litellm/pull/22026)
    - 在 `OpenAIChatCompletionAssistantMessage` 中新增 `ChatCompletionImageObject` - [PR #22155](https://github.com/BerriAI/litellm/pull/22155)

- **一般**
    - 保留伺服器端呼叫工具的轉送 - [PR #22260](https://github.com/BerriAI/litellm/pull/22260)
    - 修正來自 UI 路徑的 free model 處理 - [PR #22258](https://github.com/BerriAI/litellm/pull/22258)
    - 修正對應中的 `None` TypeError - [PR #22080](https://github.com/BerriAI/litellm/pull/22080)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[即時 API](../../docs/response_api)**
    - 支援 `/v1/realtime` WebSocket 端點的防護欄 - [PR #22152](https://github.com/BerriAI/litellm/pull/22152)
    - 透過統一的 `/realtime` 端點支援 Vertex AI Gemini Live - [PR #22153](https://github.com/BerriAI/litellm/pull/22153)
    - 在 realtime WebSocket 上以 `pre_call`/`post_call` 模式套用防護欄 - [PR #22161](https://github.com/BerriAI/litellm/pull/22161)
    - `end_session_after_n_fails` + 端點設定精靈步驟 - [PR #22165](https://github.com/BerriAI/litellm/pull/22165)
    - 語音轉錄的防護欄回呼 - [PR #21976](https://github.com/BerriAI/litellm/pull/21976)
    - 修正 Gemini/Vertex AI 和 `provider_config` realtime 工作階段未觸發防護欄的問題 - [PR #22168](https://github.com/BerriAI/litellm/pull/22168)
    - 新增記錄、支出追蹤支援 + 工具追蹤 - [PR #22105](https://github.com/BerriAI/litellm/pull/22105)

- **[影片生成](../../docs/video_generation)**
    - 在影片內容下載中新增 `variant` 參數 - [PR #21955](https://github.com/BerriAI/litellm/pull/21955)
    - 將 `api_key` 從 `litellm_params` 傳遞至影片 remix 處理常式 - [PR #21965](https://github.com/BerriAI/litellm/pull/21965)
    - 套用來自部署 `model_info` 的自訂影片定價 - [PR #21923](https://github.com/BerriAI/litellm/pull/21923)
    - 修正 videos API 中影像與參數的傳遞 - [PR #22170](https://github.com/BerriAI/litellm/pull/22170)

- **[OCR](../../docs/providers/openai#ocr--document-understanding)**
    - 為 OCR 啟用本機檔案支援 - [PR #22133](https://github.com/BerriAI/litellm/pull/22133)

- **[網頁搜尋 / 工具呼叫](../../docs/completion/input)**
    - 保留 agentic loop 後續訊息中的 thinking 區塊 - [PR #21604](https://github.com/BerriAI/litellm/pull/21604)

- **一般**
    - 新增可設定的 chunk 處理時間上限 - [PR #22209](https://github.com/BerriAI/litellm/pull/22209)
    - 為串流請求發出 `x-litellm-overhead-duration-ms` 標頭 - [PR #22027](https://github.com/BerriAI/litellm/pull/22027)

#### 錯誤 {#bugs}

- **一般**
    - 修正 realtime websocket 呼叫上的 mypy attr-defined 錯誤 - [PR #22202](https://github.com/BerriAI/litellm/pull/22202)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **專案**
    - 新增 Projects 頁面，包含列表與建立流程 - [PR #22315](https://github.com/BerriAI/litellm/pull/22315)
    - 新增 Project Details 頁面與編輯 modal - [PR #22360](https://github.com/BerriAI/litellm/pull/22360)
    - 在 key 建立/編輯時新增 project keys 表格與 project 下拉選單 - [PR #22373](https://github.com/BerriAI/litellm/pull/22373)
    - 在 Projects 表格新增刪除 project 動作 - [PR #22412](https://github.com/BerriAI/litellm/pull/22412)
    - 在 Admin Settings 新增 Projects Opt-In 切換 - [PR #22416](https://github.com/BerriAI/litellm/pull/22416)
    - 在 `/project/list` 回應中包含 `created_at` 和 `updated_at` - [PR #22323](https://github.com/BerriAI/litellm/pull/22323)
    - 在 project 中新增標籤 - [PR #22216](https://github.com/BerriAI/litellm/pull/22216)

- **虛擬金鑰 + 存取群組**
    - 為 Access Group CRUD 流程新增雙向 team/key 同步 - [PR #22253](https://github.com/BerriAI/litellm/pull/22253)
    - 在 `/key/aliases` 新增分頁與搜尋以避免 OOM - [PR #22137](https://github.com/BerriAI/litellm/pull/22137)
    - 在 UI 中新增分頁式 key 別名選擇器 - [PR #22157](https://github.com/BerriAI/litellm/pull/22157)
    - 為 key list 端點新增 `project_id` 與 `access_group_id` 篩選器 - [PR #22356](https://github.com/BerriAI/litellm/pull/22356)
    - 新增 KeyInfoHeader 元件 - [PR #22047](https://github.com/BerriAI/litellm/pull/22047)
    - 將 Edit Settings 限制為 key 擁有者可用 - [PR #21985](https://github.com/BerriAI/litellm/pull/21985)
    - 修正來自 env/UI 的 virtual key 寬限期 - [PR #20321](https://github.com/BerriAI/litellm/pull/20321)

- **代理程式**
    - 將 virtual keys 指派給 agents - [PR #22045](https://github.com/BerriAI/litellm/pull/22045)
    - 將 tools 指派給 agents - [PR #22064](https://github.com/BerriAI/litellm/pull/22064)
    - 確保內部使用者無法建立 agents（RBAC 強制執行）- [PR #22329](https://github.com/BerriAI/litellm/pull/22329)

- **Proxy 驗證 / SSO**
    - OIDC discovery URLs、roles 陣列處理，以及點記法錯誤提示 - [PR #22336](https://github.com/BerriAI/litellm/pull/22336)
    - 為系統使用者新增 PROXY_ADMIN 角色以進行金鑰輪換 - [PR #21896](https://github.com/BerriAI/litellm/pull/21896)

- **用量 / 支出記錄**
    - 在用量頁面新增使用者篩選 - [PR #22059](https://github.com/BerriAI/litellm/pull/22059)
    - 允許使用 AI 來理解用量模式 - [PR #22042](https://github.com/BerriAI/litellm/pull/22042)
    - 使用後端 `request_duration_ms`，並讓 Duration 在 Logs 中可排序 - [PR #22122](https://github.com/BerriAI/litellm/pull/22122)
    - 在 SpendLogs 新增 `request_duration_ms` - [PR #22066](https://github.com/BerriAI/litellm/pull/22066)
    - 以 key/team 中繼資料豐富失敗支出記錄 - [PR #22049](https://github.com/BerriAI/litellm/pull/22049)
    - 在 Anthropic 格式工具的記錄中顯示實際工具名稱 - [PR #22048](https://github.com/BerriAI/litellm/pull/22048)

- **模型 + 端點**
    - 在 ModelHub 顯示 proxy URL - [PR #21660](https://github.com/BerriAI/litellm/pull/21660)
    - 新增 `/public/endpoints` 以支援提供者端點 - [PR #22248](https://github.com/BerriAI/litellm/pull/22248)

- **UI 改進**
    - 新增自訂 favicon 支援 - [PR #21653](https://github.com/BerriAI/litellm/pull/21653)
    - 在 Navbar 新增 Blog 下拉選單 - [PR #21859](https://github.com/BerriAI/litellm/pull/21859)
    - 為詳細 debug 模式新增 UI 橫幅警告 - [PR #21527](https://github.com/BerriAI/litellm/pull/21527)
    - 讓 MCP Server 建立流程的 auth 值變為選填 - [PR #22119](https://github.com/BerriAI/litellm/pull/22119)
    - Tool policies：自動發現 tools + 政策強制執行防護欄 - [PR #22041](https://github.com/BerriAI/litellm/pull/22041)

- **健康檢查**
    - 新增 health check 最大 tokens 設定 - [PR #22299](https://github.com/BerriAI/litellm/pull/22299)
    - 使用 `health_check_concurrency` 限制並行 health checks - [PR #20584](https://github.com/BerriAI/litellm/pull/20584)
    - 修正 health check `model_id` 篩選 - [PR #21071](https://github.com/BerriAI/litellm/pull/21071)

#### 錯誤 {#bugs-1}

- 為 `/user/info` 中的管理員使用者填入 `user_id` 和 `user_info` - [PR #22239](https://github.com/BerriAI/litellm/pull/22239)
- 修正 virtual keys 分頁在篩選時的過期總數 - [PR #22222](https://github.com/BerriAI/litellm/pull/22222)
- 修正預設 preset 下 Spend Update Queue 聚合永遠不會觸發的問題 - [PR #21963](https://github.com/BerriAI/litellm/pull/21963)
- 修正 timezone 設定查找，並以 `ZoneInfo` 取代硬編碼的時區對照表 - [PR #21754](https://github.com/BerriAI/litellm/pull/21754)
- 修正自訂驗證預算問題 - [PR #22164](https://github.com/BerriAI/litellm/pull/22164)
- 修正缺少的 OAuth session state - [PR #21992](https://github.com/BerriAI/litellm/pull/21992)
- 修正 UI 上 OpenAPI Spec 的 Transport Type - [PR #22005](https://github.com/BerriAI/litellm/pull/22005)
- 修正 Claude Code plugin schema - [PR #22271](https://github.com/BerriAI/litellm/pull/22271)
- 為 `LiteLLM_ClaudeCodePluginTable` 新增缺少的 migration - [PR #22335](https://github.com/BerriAI/litellm/pull/22335)
- 在建立 access group 時只標記所選部署 - [PR #21655](https://github.com/BerriAI/litellm/pull/21655)
- CheckBatchCost 的狀態管理修正 - [PR #21921](https://github.com/BerriAI/litellm/pull/21921)
- 移除 ToolPolicies 中重複的 antd import - [PR #22107](https://github.com/BerriAI/litellm/pull/22107)

---

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[DataDog](../../docs/proxy/logging#datadog)**
    - 新增在 DataDog 中追蹤 metrics 的能力 - [PR #22103](https://github.com/BerriAI/litellm/pull/22103)
    - 將 LiteLLM call IDs 與 DataDog APM spans 進行關聯 - [PR #22219](https://github.com/BerriAI/litellm/pull/22219)
    - 修正 TTS metric 發送問題 - [PR #20632](https://github.com/BerriAI/litellm/pull/20632)

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 在 `litellm_proxy_total_requests_metric` 上新增可選用的 `stream` 標籤 - [PR #22023](https://github.com/BerriAI/litellm/pull/22023)
    - 修正 Prometheus metrics 中的 team `+Inf` 預算 - [PR #22243](https://github.com/BerriAI/litellm/pull/22243)

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正 Langfuse OTEL trace 問題 - [PR #21309](https://github.com/BerriAI/litellm/pull/21309)

- **[Arize Phoenix](../../docs/observability/arize_phoenix)**
    - 修正與 OTEL 回呼共存時的巢狀追蹤 - [PR #22169](https://github.com/BerriAI/litellm/pull/22169)

- **[Slack](../../docs/proxy/alerting)**
    - 為 Slack 警示類型新增可選的摘要模式 - [PR #21683](https://github.com/BerriAI/litellm/pull/21683)

- **一般**
    - 修正 Gemini 記錄中缺少 trace ID 的問題 - [PR #22077](https://github.com/BerriAI/litellm/pull/22077)
    - 將 `cache_read_input_tokens` 從 `prompt_tokens_details` 填入 OpenAI/Azure - [PR #22090](https://github.com/BerriAI/litellm/pull/22090)

### 防護欄 {#guardrails}

- **[Noma](../../docs/proxy/guardrails)**
    - 基於自訂防護欄框架的 Noma 防護欄 v2 - [PR #21400](https://github.com/BerriAI/litellm/pull/21400)

- **[LakeraAI](../../docs/proxy/guardrails)**
    - 新增 Lakera v2 請後回呼，並修正 PII 遮罩 - [PR #21783](https://github.com/BerriAI/litellm/pull/21783)

- **[Presidio](../../docs/proxy/guardrails)**
    - 修正 Presidio 串流與誤判問題 - [PR #21949](https://github.com/BerriAI/litellm/pull/21949)
    - 修正 Presidio 串流 v3 的可靠性改進 - [PR #22283](https://github.com/BerriAI/litellm/pull/22283)
    - 防止 Presidio 在非 JSON 回應上當機 - [PR #22084](https://github.com/BerriAI/litellm/pull/22084)

- **內建防護欄**
    - 封鎖程式碼執行防護欄，避免代理程式執行程式碼 - [PR #22154](https://github.com/BerriAI/litellm/pull/22154)
    - 針對 5 種受保護類別的就業歧視主題封鎖器 - [PR #21962](https://github.com/BerriAI/litellm/pull/21962)
    - 理賠代理程式防護欄（5 類別 + 政策範本） - [PR #22113](https://github.com/BerriAI/litellm/pull/22113)
    - 新的程式碼執行評估資料集 - [PR #22065](https://github.com/BerriAI/litellm/pull/22065)
    - 工具政策：自動探索工具 + 政策強制執行 - [PR #22041](https://github.com/BerriAI/litellm/pull/22041)

- **政策範本**
    - 新加坡防護欄政策（PDPA + MAS AI 風險管理） - [PR #21948](https://github.com/BerriAI/litellm/pull/21948)
    - 為 SG 防護欄政策 ID 加上國家代碼前綴 - [PR #21974](https://github.com/BerriAI/litellm/pull/21974)
    - 防護欄政策版本控制 - [PR #21862](https://github.com/BerriAI/litellm/pull/21862)

- **防護欄監控**
    - Guardrail Monitor — 衡量正式環境中的防護欄可靠性 - [PR #21944](https://github.com/BerriAI/litellm/pull/21944)

- **安全性**
    - 修正自訂程式碼防護欄中的未驗證 RCE 與沙箱逃逸問題 - [PR #22095](https://github.com/BerriAI/litellm/pull/22095)

### 提示管理 {#prompt-management}

此版本沒有重大提示管理變更。

### 密鑰管理器 {#secret-managers}

此版本沒有重大密鑰管理器變更。

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **Gemini/Vertex AI 的優先 PayGo 成本追蹤** - [PR #21909](https://github.com/BerriAI/litellm/pull/21909)
- **將 `request_duration_ms` 新增至 SpendLogs**，以便進行每個請求的延遲追蹤 - [PR #22066](https://github.com/BerriAI/litellm/pull/22066)
- **將 `in_flight_requests` 指標新增至 `/health/backlog` + Prometheus** - [PR #22319](https://github.com/BerriAI/litellm/pull/22319)
- **以 key/team 中繼資料豐富失敗支出記錄** - [PR #22049](https://github.com/BerriAI/litellm/pull/22049)
- **新增支出追蹤生命週期記錄**，用於偵錯支出流程 - [PR #22029](https://github.com/BerriAI/litellm/pull/22029)
- **修正預算時區設定查找**，並以 `ZoneInfo` 取代硬編碼時區對應表 - [PR #21754](https://github.com/BerriAI/litellm/pull/21754)
- **修正 Spend Update Queue 聚合** 在預設預設集下從未觸發的問題 - [PR #21963](https://github.com/BerriAI/litellm/pull/21963)
- **避免在 `SpendUpdateQueue` 聚合中變更呼叫端擁有的 dict** - [PR #21742](https://github.com/BerriAI/litellm/pull/21742)
- **最佳化舊 spendlog 刪除** cron 工作 - [PR #21930](https://github.com/BerriAI/litellm/pull/21930)
- **健康檢查最大 token** 設定 - [PR #22299](https://github.com/BerriAI/litellm/pull/22299)

---

## MCP 閘道 {#mcp-gateway}

- **將 MCP 驗證標頭** 從請求內容傳遞到 `/v1/responses` 和 `/chat/completions` 的工具擷取 - [PR #22291](https://github.com/BerriAI/litellm/pull/22291)
- **將 `available_on_public_internet` 預設為 true**，以維持 MCP 伺服器行為一致性 - [PR #22331](https://github.com/BerriAI/litellm/pull/22331)
- **清楚的錯誤訊息**，適用於 IP 過濾／沒有可用工具 - [PR #22142](https://github.com/BerriAI/litellm/pull/22142)
- **移除過時的 `mcp-session-id` 標頭**，以防止跨代理工作程序出現 400 錯誤 - [PR #21417](https://github.com/BerriAI/litellm/pull/21417)
- **略過 MCP 的健康檢查**，適用於穿透式 token 驗證 - [PR #21982](https://github.com/BerriAI/litellm/pull/21982)
- **修正缺少的 OAuth session state** - [PR #21992](https://github.com/BerriAI/litellm/pull/21992)
- **修正 UI 上 OpenAPI 規格的傳輸類型** - [PR #22005](https://github.com/BerriAI/litellm/pull/22005)
- **新增 e2e 測試**，驗證無狀態 StreamableHTTP 行為 - [PR #22033](https://github.com/BerriAI/litellm/pull/22033)

---

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

**串流與熱路徑**

- 串流延遲改善 — 4 項針對性的熱路徑修正 - [PR #22346](https://github.com/BerriAI/litellm/pull/22346)
- 在 `ModelResponse.__init__` 中略過一次性 `Usage()` 建構 - [PR #21611](https://github.com/BerriAI/litellm/pull/21611)
- 使用 `startswith` 最佳化 `is_model_o_series_model` - [PR #21690](https://github.com/BerriAI/litellm/pull/21690)
- 使用快取的 `_safe_get_request_headers` 取代每次請求建構 - [PR #21430](https://github.com/BerriAI/litellm/pull/21430)
- 為串流請求發出 `x-litellm-overhead-duration-ms` 標頭 - [PR #22027](https://github.com/BerriAI/litellm/pull/22027)

**資料庫與 Redis**

- 將 11 次 `create_task()` 呼叫批次化合併為 `update_database()` 中的 1 次 - [PR #22028](https://github.com/BerriAI/litellm/pull/22028)
- 批次寫入的 Redis pipeline 支出更新 - [PR #22044](https://github.com/BerriAI/litellm/pull/22044)
- 從 prisma-query-engine 僵死程序中復原 - [PR #21899](https://github.com/BerriAI/litellm/pull/21899)
- 最佳化舊 spendlog 刪除 cron 工作 - [PR #21930](https://github.com/BerriAI/litellm/pull/21930)

**路由與快取**

- 為 `_cached_get_model_group_info` 新增快取失效 - [PR #20376](https://github.com/BerriAI/litellm/pull/20376)
- 移除會終止使用中的 httpx 用戶端的快取清除 close - [PR #22247](https://github.com/BerriAI/litellm/pull/22247)
- 將背景工作參考儲存在 `LLMClientCache._remove_key` 中，以避免未等待的 coroutine 警告 - [PR #22143](https://github.com/BerriAI/litellm/pull/22143)
- 在計算佇列時間前修正 `ensure_arrival_time` 設定 - [PR #21918](https://github.com/BerriAI/litellm/pull/21918)

**連線管理**

- 僅在需要時於 aiohttp 上設定 `enable_cleanup_closed` - [PR #21897](https://github.com/BerriAI/litellm/pull/21897)
- gunicorn workers 的 Prometheus child_exit 清理 - [PR #22324](https://github.com/BerriAI/litellm/pull/22324)
- Prometheus 多程序清理 - [PR #22221](https://github.com/BerriAI/litellm/pull/22221)
- 使用 `health_check_concurrency` 限制並行健康檢查 - [PR #20584](https://github.com/BerriAI/litellm/pull/20584)
- 將 `get_config` 失敗與模型同步迴圈隔離 - [PR #22224](https://github.com/BerriAI/litellm/pull/22224)

**其他**

- 語意快取：支援可設定的向量維度 - [PR #21649](https://github.com/BerriAI/litellm/pull/21649)
- 從設定環境變數中遵循 `MAX_STRING_LENGTH_PROMPT_IN_DB` - [PR #22106](https://github.com/BerriAI/litellm/pull/22106)
- 強化 `MidStreamFallbackError`，以保留原始狀態碼與屬性 - [PR #22225](https://github.com/BerriAI/litellm/pull/22225)
- 用於測試的網路模擬工具 - [PR #21942](https://github.com/BerriAI/litellm/pull/21942)
- 為 streaming_handler 中的 iterator protocol 方法新增缺少的回傳型別註記 - [PR #21750](https://github.com/BerriAI/litellm/pull/21750)

---

## 安全性 {#security}

- 修正 OS 層級函式庫與 NPM 傳遞相依性中的重大／高風險 CVE - [PR #22008](https://github.com/BerriAI/litellm/pull/22008)
- 修正自訂程式碼防護欄中的未驗證 RCE 與沙箱逃逸問題 - [PR #22095](https://github.com/BerriAI/litellm/pull/22095)
- 移除被 secret scanner 標記的硬編碼 base64 字串 - [PR #22125](https://github.com/BerriAI/litellm/pull/22125)

---

## 文件更新 {#documentation-updates}

- 新增含 LiteLLM Proxy 的 OpenAI Agents SDK 教學 - [PR #21221](https://github.com/BerriAI/litellm/pull/21221)
- 新增 OpenClaw 整合教學 - [PR #21605](https://github.com/BerriAI/litellm/pull/21605)
- 新增 Google GenAI SDK 教學（JS 與 Python） - [PR #21885](https://github.com/BerriAI/litellm/pull/21885)
- 新增 Gollem Go 代理程式框架食譜範例 - [PR #21747](https://github.com/BerriAI/litellm/pull/21747)
- 以 Universal-3 Pro、Speech Understanding 和 LLM Gateway 更新 AssemblyAI 文件 - [PR #21130](https://github.com/BerriAI/litellm/pull/21130)
- 新增 `store_model_in_db` 版本文件 - [PR #21863](https://github.com/BerriAI/litellm/pull/21863)
- 新增憑證使用追蹤文件 - [PR #22112](https://github.com/BerriAI/litellm/pull/22112)
- 新增 proxy 請求標籤文件 - [PR #22129](https://github.com/BerriAI/litellm/pull/22129)
- 為 `/mcp` 端點 URL 新增尾端斜線 - [PR #20509](https://github.com/BerriAI/litellm/pull/20509)
- 為 UI 貢獻指南新增 PR 前檢查清單 - [PR #21886](https://github.com/BerriAI/litellm/pull/21886)
- 在文件中以模擬金鑰取代 Azure OpenAI 金鑰 - [PR #21997](https://github.com/BerriAI/litellm/pull/21997)
- 在 v1.81.14 版本說明中新增效能與可靠性區段 - [PR #21950](https://github.com/BerriAI/litellm/pull/21950)
- 更新 v1.81.12-stable 版本說明以指向 stable.1 - [PR #22036](https://github.com/BerriAI/litellm/pull/22036)
- 在 v1.81.14 版本說明中新增安全性漏洞掃描報告 - [PR #22385](https://github.com/BerriAI/litellm/pull/22385)

---

## 新貢獻者 {#new-contributors}

* @janfrederickk 在 [PR #21660](https://github.com/BerriAI/litellm/pull/21660) 做出了他們的首次貢獻
* @hztBUAA 在 [PR #21656](https://github.com/BerriAI/litellm/pull/21656) 做出了他們的首次貢獻
* @LeeJuOh 在 [PR #21754](https://github.com/BerriAI/litellm/pull/21754) 做出了他們的首次貢獻
* @WhoisMonesh 在 [PR #21750](https://github.com/BerriAI/litellm/pull/21750) 做出了他們的首次貢獻
* @trevorprater 在 [PR #21747](https://github.com/BerriAI/litellm/pull/21747) 做出了他們的首次貢獻
* @edwiniac 在 [PR #21870](https://github.com/BerriAI/litellm/pull/21870) 做出了他們的首次貢獻
* @stakeswky 在 [PR #21867](https://github.com/BerriAI/litellm/pull/21867) 做出了他們的首次貢獻
* @ta-stripe 在 [PR #21701](https://github.com/BerriAI/litellm/pull/21701) 做出了他們的首次貢獻
* @ron-zhong 在 [PR #21948](https://github.com/BerriAI/litellm/pull/21948) 做出了他們的首次貢獻
* @Arindam200 在 [PR #21221](https://github.com/BerriAI/litellm/pull/21221) 做出了他們的首次貢獻
* @Canvinus 在 [PR #21964](https://github.com/BerriAI/litellm/pull/21964) 做出了他們的首次貢獻
* @nicolopignatelli 在 [PR #21951](https://github.com/BerriAI/litellm/pull/21951) 做出了他們的首次貢獻
* @MarshHawk 在 [PR #20584](https://github.com/BerriAI/litellm/pull/20584) 做出了他們的首次貢獻
* @gavksingh 在 [PR #22106](https://github.com/BerriAI/litellm/pull/22106) 做出了他們的首次貢獻
* @roni-frantchi 在 [PR #22090](https://github.com/BerriAI/litellm/pull/22090) 做出了他們的首次貢獻
* @noahnistler 在 [PR #22133](https://github.com/BerriAI/litellm/pull/22133) 做出了他們的首次貢獻
* @dylan-duan-aai 在 [PR #21130](https://github.com/BerriAI/litellm/pull/21130) 做出了他們的首次貢獻
* @rasmi 在 [PR #22322](https://github.com/BerriAI/litellm/pull/22322) 做出了他們的首次貢獻

---

## 差異摘要 {#diff-summary}

## 02/28/2026 {#02282026}
* 新模型 / 更新模型：26
* LLM API 端點：14
* 管理端點 / UI：38
* AI 整合：25
* 支出追蹤、預算與速率限制：10
* MCP Gateway：8
* 效能 / 負載平衡 / 可靠性改善：22
* 安全性：3
* 文件更新：14

---

## 完整變更記錄 {#full-changelog}
[v1.81.14.rc.1...v1.82.0](https://github.com/BerriAI/litellm/compare/v1.81.14.rc.1...v1.82.0)
