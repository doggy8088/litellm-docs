---
title: "v1.81.9 - 控制哪些 MCP 伺服器會公開到網際網路"
slug: "v1-81-9"
date: 2026-02-07T00:00:00
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

:::info 穩定版發行分支

對於每個穩定版發行，我們現在會維護一個專用分支，版本格式為 `litellm_stable_release_branch_x_xx_xx`。

這樣可以更容易在 day 0 模型發布時進行修補。

**v1.81.9 的分支：** [litellm_stable_release_branch_1_81_9](https://github.com/BerriAI/litellm/tree/litellm_stable_release_branch_1_81_9)

:::

## 部署此版本 {#deploy-this-version}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

<Tabs>
<TabItem value="docker" label="Docker">

``` showLineNumbers title="docker run litellm"
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
ghcr.io/berriai/litellm:main-v1.81.9-stable
```

</TabItem>
<TabItem value="pip" label="Pip">

``` showLineNumbers title="pip install litellm"
pip install litellm==1.81.9
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **Claude Opus 4.6** - [Anthropic、AWS Bedrock、Azure AI 與 Vertex AI 的完整支援，具備自適應思考與 100 萬上下文視窗](../../blog/claude_opus_4_6)
- **A2A Agent Gateway** - [透過標準 `/chat/completions` API 呼叫已註冊的 A2A（Agent-to-Agent）代理程式](../../docs/a2a_invoking_agents)
- **將 MCP 伺服器公開到公用網際網路** - [針對面向網際網路的部署，以公用/私用可見性與基於 IP 的存取控制來啟動 MCP 伺服器](../../docs/mcp_public_internet)
- **UI 團隊軟預算警示** - [為團隊設定軟預算，當支出超過門檻時接收電子郵件警示——且不會封鎖請求](../../docs/proxy/ui_team_soft_budget_alerts)
- **效能最佳化** - 多項效能改進，包括 Prometheus CPU 降低約 40%、LRU 快取，以及最佳化的記錄路徑
- **LiteLLM Observatory** - [自動化 24 小時負載測試](../../blog/litellm-observatory)
- **針對回呼密集型部署，請求處理速度提升 30%** - [回呼密集型部署的效能改進][PR #20354](https://github.com/BerriAI/litellm/pull/20354)

---

## 針對回呼密集型部署，請求處理速度提升 30% {#30-faster-request-processing-for-callback-heavy-deployments}

如果您使用像 Langfuse、Datadog 或 Prometheus 這類的記錄回呼，每個請求原本都會承擔不必要的成本：三個迴圈會在每次請求時重新排序您的回呼，即使回呼清單根本沒有變更。您設定的回呼越多，浪費的時間就越多。我們已將這項工作從每次請求改為在啟動時只執行一次。對於使用預設回呼集合的部署，這可讓請求設定速度提升約 30%。對於設定了許多回呼的部署，改善幅度甚至更大。

---

## LiteLLM 觀測台 {#litellm-observatory}

LiteLLM Observatory 是我們建立的一套長時間執行的版本驗證系統，用來在回歸問題到達使用者之前將其攔截。這套系統設計為可擴充——您可以新增測試、設定模型與失敗門檻，並針對任何部署排入執行佇列。我們的目標是透過這些測試達成 LiteLLM 功能 100% 的覆蓋率。我們會在每次發行前，針對正式環境部署執行 24 小時負載測試，找出像資源生命週期錯誤、OOM，以及只有在持續負載下才會出現的 CPU 回歸等問題。

---

## 公開網際網路上的 MCP 伺服器 {#mcp-servers-on-the-public-internet}

這次發行透過加入公用/私用可見性與基於 IP 的存取控制，讓您能安全地將 MCP 伺服器公開到公用網際網路。您現在可以執行面向網際網路的 MCP 服務，同時限制可信任網路的存取，並將內部工具保留為私有。

[開始使用](../../docs/mcp_public_internet)

<Image
img={require('../../img/release_notes/mcp_internet.png')}
style={{ maxWidth: '900px', width: '100%' }}
/>

## UI 團隊軟預算警示 {#ui-team-soft-budget-alerts}

為任何團隊設定軟預算，當支出超過門檻時即可接收電子郵件警示——且不會封鎖任何請求。可直接從 Admin UI 設定門檻與警示電子郵件，無需重新啟動 proxy。

[開始使用](../../docs/proxy/ui_team_soft_budget_alerts)

<Image
img={require('../../img/ui_team_soft_budget_alerts.png')}
style={{ maxWidth: '900px', width: '100%' }}
/>

讓我們深入了解。

---

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（13 個新模型） {#new-model-support-13-new-models}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/100 萬 tokens） | 輸出（$/100 萬 tokens） |
| -------- | ----- | -------------- | ------------------- | -------------------- |
| Anthropic | `claude-opus-4-6` | 100 萬 | $5.00 | $25.00 |
| AWS Bedrock | `anthropic.claude-opus-4-6-v1` | 100 萬 | $5.00 | $25.00 |
| Azure AI | `azure_ai/claude-opus-4-6` | 20 萬 | $5.00 | $25.00 |
| Vertex AI | `vertex_ai/claude-opus-4-6` | 100 萬 | $5.00 | $25.00 |
| Google Gemini | `gemini/deep-research-pro-preview-12-2025` | 65K | $2.00 | $12.00 |
| Vertex AI | `vertex_ai/deep-research-pro-preview-12-2025` | 65K | $2.00 | $12.00 |
| Moonshot | `moonshot/kimi-k2.5` | 262K | $0.60 | $3.00 |
| OpenRouter | `openrouter/qwen/qwen3-235b-a22b-2507` | 262K | $0.07 | $0.10 |
| OpenRouter | `openrouter/qwen/qwen3-235b-a22b-thinking-2507` | 262K | $0.11 | $0.60 |
| Together AI | `together_ai/zai-org/GLM-4.7` | 20 萬 | $0.45 | $2.00 |
| Together AI | `together_ai/moonshotai/Kimi-K2.5` | 25.6 萬 | $0.50 | $2.80 |
| ElevenLabs | `elevenlabs/eleven_v3` | - | $0.18/1K 字元 | - |
| ElevenLabs | `elevenlabs/eleven_multilingual_v2` | - | $0.18/1K 字元 | - |

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 全面支援 Claude Opus 4.6，並在所有區域（us、eu、apac、au）提供自適應思考 - [PR #20506](https://github.com/BerriAI/litellm/pull/20506), [PR #20508](https://github.com/BerriAI/litellm/pull/20508), [PR #20514](https://github.com/BerriAI/litellm/pull/20514), [PR #20551](https://github.com/BerriAI/litellm/pull/20551)
    - 將推理內容對應到 anthropic thinking block（串流 + 非串流）- [PR #20254](https://github.com/BerriAI/litellm/pull/20254)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 為長上下文模型新增 1 小時分層快取成本 - [PR #20214](https://github.com/BerriAI/litellm/pull/20214)
    - 支援 Bedrock Claude 4.5 模型的 prompt caching 中 TTL（1h）欄位 - [PR #20338](https://github.com/BerriAI/litellm/pull/20338)
    - 新增 Nova Sonic speech-to-speech 模型支援 - [PR #20244](https://github.com/BerriAI/litellm/pull/20244)
    - 修正 Converse API 的空白 assistant 訊息 - [PR #20390](https://github.com/BerriAI/litellm/pull/20390)
    - 修正內容被封鎖的處理 - [PR #20606](https://github.com/BerriAI/litellm/pull/20606)

- **[Google Gemini / Vertex AI](../../docs/providers/gemini)**
    - 新增 Gemini Deep Research 模型支援 - [PR #20406](https://github.com/BerriAI/litellm/pull/20406)
    - 修正 Vertex AI Gemini 串流 content_filter 處理 - [PR #20105](https://github.com/BerriAI/litellm/pull/20105)
    - 允許在 Vertex AI/Gemini 模型中使用 OpenAI 風格的工具，適用於 `web_search` - [PR #20280](https://github.com/BerriAI/litellm/pull/20280)
    - 修正 Gemini 與 Vertex AI 模型的 `supports_native_streaming` - [PR #20408](https://github.com/BerriAI/litellm/pull/20408)
    - 為檔案 ID 中的 responses tools 新增對應 - [PR #20402](https://github.com/BerriAI/litellm/pull/20402)

- **[Cohere](../../docs/providers/cohere)**
    - 支援 Cohere embed v4 的 `dimensions` 參數 - [PR #20235](https://github.com/BerriAI/litellm/pull/20235)

- **[Cerebras](../../docs/providers/cerebras)**
    - 為 GPT OSS Cerebras 新增 reasoning 參數支援 - [PR #20258](https://github.com/BerriAI/litellm/pull/20258)

- **[Moonshot](../../docs/providers/moonshot)**
    - 新增 Kimi K2.5 模型條目 - [PR #20273](https://github.com/BerriAI/litellm/pull/20273)

- **[OpenRouter](../../docs/providers/openrouter)**
    - 新增 Qwen3-235B 模型 - [PR #20455](https://github.com/BerriAI/litellm/pull/20455)

- **[Together AI](../../docs/providers/togetherai)**
    - 新增 GLM-4.7 與 Kimi-K2.5 模型 - [PR #20319](https://github.com/BerriAI/litellm/pull/20319)

- **[ElevenLabs](../../docs/providers/elevenlabs)**
    - 新增 `eleven_v3` 與 `eleven_multilingual_v2` TTS 模型 - [PR #20522](https://github.com/BerriAI/litellm/pull/20522)

- **[Vercel AI Gateway](../../docs/providers/vercel_ai_gateway)**
    - 為模型新增缺少的 capability 標記 - [PR #20276](https://github.com/BerriAI/litellm/pull/20276)

- **[GitHub Copilot](../../docs/providers/github_copilot)**
    - 修正 system prompts 被丟棄的問題，並自動新增必要的 Copilot 標頭 - [PR #20113](https://github.com/BerriAI/litellm/pull/20113)

- **[GigaChat](../../docs/providers/gigachat)**
    - 修正 GigaChat 提供者連續 user 訊息錯誤合併的問題 - [PR #20341](https://github.com/BerriAI/litellm/pull/20341)

- **[xAI](../../docs/providers/xai_realtime)**
    - 新增 xAI `/realtime` API 支援 - 可與 LiveKit SDK 搭配使用 - [PR #20381](https://github.com/BerriAI/litellm/pull/20381)

- **[OpenAI](../../docs/providers/openai)**
    - 新增 `gpt-5-search-api` 模型與文件說明澄清 - [PR #20512](https://github.com/BerriAI/litellm/pull/20512)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 修正 `provider_specific_fields` 的額外輸入不被允許錯誤 - [PR #20334](https://github.com/BerriAI/litellm/pull/20334)

- **[AWS Bedrock](../../docs/providers/bedrock)**
    - 修正：Managed Batches 在列出與取消批次時的狀態管理不一致 - [PR #20331](https://github.com/BerriAI/litellm/pull/20331)

- **[OpenAI Embeddings](../../docs/providers/openai)**
    - 修正 `open_ai_embedding_models` 使其 `custom_llm_provider` 為 None - [PR #20253](https://github.com/BerriAI/litellm/pull/20253)

---

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Messages API](../../docs/providers/anthropic)**
    - 過濾非 Anthropic 提供者不支援的 Claude Code beta 標頭 - [PR #20578](https://github.com/BerriAI/litellm/pull/20578)
    - 修正使用非 Anthropic 提供者時 `anthropic.messages.acreate()` 的回應格式不一致 - [PR #20442](https://github.com/BerriAI/litellm/pull/20442)
    - 修正 `/api/event_logging/batch` 端點上的 404，該問題導致 Claude Code「找不到路由」錯誤 - [PR #20504](https://github.com/BerriAI/litellm/pull/20504)

- **[A2A Agent Gateway](../../docs/a2a)**
    - 允許透過 LiteLLM `/chat/completions` API 呼叫 A2A 代理程式 - [PR #20358](https://github.com/BerriAI/litellm/pull/20358)
    - 搭配 `/chat/completions` 使用 A2A 註冊的代理程式 - [PR #20362](https://github.com/BerriAI/litellm/pull/20362)
    - 修正以 localhost／內部 URL 部署的 A2A 代理程式在其 agent card 中的問題 - [PR #20604](https://github.com/BerriAI/litellm/pull/20604)

- **[Files API](../../docs/providers/gemini)**
    - 新增透過 file_id 進行刪除與 GET 的 Gemini 支援 - [PR #20329](https://github.com/BerriAI/litellm/pull/20329)

- **一般**
    - 新增 User-Agent 自訂支援 - [PR #19881](https://github.com/BerriAI/litellm/pull/19881)
    - 修正使用每請求路由時找不到搜尋工具 - [PR #19818](https://github.com/BerriAI/litellm/pull/19818)
    - 在 chat 中轉送額外標頭 - [PR #20386](https://github.com/BerriAI/litellm/pull/20386)

---

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **SSO 設定**
    - SSO 設定團隊對應 - [PR #20111](https://github.com/BerriAI/litellm/pull/20111)
    - UI - SSO：新增團隊對應 - [PR #20299](https://github.com/BerriAI/litellm/pull/20299)
    - 從 JWT access token 擷取使用者角色，以相容 Keycloak - [PR #20591](https://github.com/BerriAI/litellm/pull/20591)

- **驗證 / SDK**
    - 新增 `proxy_auth`，用於 SDK 中的 OAuth2/JWT token 自動管理 - [PR #20238](https://github.com/BerriAI/litellm/pull/20238)

- **虛擬金鑰**
    - Key `reset_spend` 端點 - [PR #20305](https://github.com/BerriAI/litellm/pull/20305)
    - UI - Keys：Key 資訊與編輯頁面的允許路由 - [PR #20369](https://github.com/BerriAI/litellm/pull/20369)
    - 新增 Key 資訊端點物件權限資料 - [PR #20407](https://github.com/BerriAI/litellm/pull/20407)
    - Keys 與 Teams 路由設定 + 允許覆寫路由設定 - [PR #20205](https://github.com/BerriAI/litellm/pull/20205)

- **團隊與預算**
    - 將 `soft_budget` 新增至 Team Table + 建立／更新端點 - [PR #20530](https://github.com/BerriAI/litellm/pull/20530)
    - 團隊軟預算電子郵件警示 - [PR #20553](https://github.com/BerriAI/litellm/pull/20553)
    - UI - Team Settings：軟預算 + 警示電子郵件 - [PR #20634](https://github.com/BerriAI/litellm/pull/20634)
    - UI - User Budget 頁面：無限預算核取方塊 - [PR #20380](https://github.com/BerriAI/litellm/pull/20380)
    - `/user/update` 允許 `max_budget` 重設 - [PR #20375](https://github.com/BerriAI/litellm/pull/20375)

- **UI 改進**
    - 預設 Team Settings：遷移為使用可重複使用的 Model Select - [PR #20310](https://github.com/BerriAI/litellm/pull/20310)
    - Navbar：隱藏社群互動按鈕的選項 - [PR #20308](https://github.com/BerriAI/litellm/pull/20308)
    - 在 Models 健康頁面顯示團隊別名 - [PR #20359](https://github.com/BerriAI/litellm/pull/20359)
    - Admin Settings：為公開 AI Hub 新增驗證選項 - [PR #20444](https://github.com/BerriAI/litellm/pull/20444)
    - 依使用者時區調整每日支出日期篩選 - [PR #20472](https://github.com/BerriAI/litellm/pull/20472)

- **SCIM**
    - 新增 SCIM 資源探索的 base `/scim/v2` 端點 - [PR #20301](https://github.com/BerriAI/litellm/pull/20301)

- **Proxy CLI**
    - RDS IAM 驗證的 CLI 參數 - [PR #20437](https://github.com/BerriAI/litellm/pull/20437)

#### 錯誤 {#bugs}

- 修正：移除 UI 登入時不必要的 key 封鎖，該問題曾阻止存取 - [PR #20210](https://github.com/BerriAI/litellm/pull/20210)
- UI - Team Settings：停用全域防護欄持續性 - [PR #20307](https://github.com/BerriAI/litellm/pull/20307)
- UI - Model Info 頁面：修正輸入與輸出標籤 - [PR #20462](https://github.com/BerriAI/litellm/pull/20462)
- UI - Model 頁面：較小螢幕上的欄寬調整 - [PR #20599](https://github.com/BerriAI/litellm/pull/20599)
- 修正 `/key/list` `user_id` 空字串邊界情況 - [PR #20623](https://github.com/BerriAI/litellm/pull/20623)
- 新增模型、代理程式與 MCP hub 資料的陣列型別檢查，以防止 UI 當機 - [PR #20469](https://github.com/BerriAI/litellm/pull/20469)
- 修正每日表格上的唯一約束 + 更新失敗時的記錄 - [PR #20394](https://github.com/BerriAI/litellm/pull/20394)

---

## 記錄 / 防護欄 / Prompt Management 整合 {#logging--guardrail--prompt-management-integrations}

#### 錯誤修正（3 項修正） {#bug-fixes-3-fixes}

- **[Langfuse](../../docs/proxy/logging#langfuse)**
    - 修正當 spans 包含 null 屬性時，Langfuse OTEL trace 匯出失敗 - [PR #20382](https://github.com/BerriAI/litellm/pull/20382)

- **[Prometheus](../../docs/proxy/logging#prometheus)**
    - 修正不正確的失敗指標標籤，導致錯誤率計數失準 - [PR #20152](https://github.com/BerriAI/litellm/pull/20152)

- **[Slack Alerts](../../docs/proxy/alerting)**
    - 修正某些預算門檻設定下 Slack 警示傳送失敗 - [PR #20257](https://github.com/BerriAI/litellm/pull/20257)

#### 防護欄（7 項更新） {#guardrails-7-updates}

- **自訂程式碼防護欄**
    - 為自訂程式碼防護欄新增 HTTP 支援 + MCP 的統一防護欄 + 代理程式防護欄支援 - [PR #20619](https://github.com/BerriAI/litellm/pull/20619)
    - 自訂程式碼防護欄 UI Playground - [PR #20377](https://github.com/BerriAI/litellm/pull/20377)

- **團隊自帶防護欄**
    - 實作以團隊為基礎的隔離防護欄管理 - [PR #20318](https://github.com/BerriAI/litellm/pull/20318)

- **[OpenAI Moderations](../../docs/apply_guardrail)**
    - 確保 OpenAI Moderations Guard 可與 OpenAI Embeddings 一起運作 - [PR #20523](https://github.com/BerriAI/litellm/pull/20523)

- **[GraySwan / Cygnal](../../docs/apply_guardrail)**
    - 修正 GraySwan 的 fail-open，並將 metadata 傳遞給 Cygnal API 端點 - [PR #19837](https://github.com/BerriAI/litellm/pull/19837)

- **一般**
    - 在防護欄輸入前檢查 `model_response_choices` - [PR #19784](https://github.com/BerriAI/litellm/pull/19784)
    - 保留防護欄取樣區塊中的串流內容 - [PR #20027](https://github.com/BerriAI/litellm/pull/20027)

---

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **支援 0 成本模型** - 允許內部／免費方案模型項目為零成本 - [PR #20249](https://github.com/BerriAI/litellm/pull/20249)

---

## MCP Gateway（9 項更新） {#mcp-gateway-9-updates}

- **MCP 語意篩選** - 使用語意相似度篩選 MCP 工具，以減少 LLM 請求的工具膨脹 - [PR #20296](https://github.com/BerriAI/litellm/pull/20296), [PR #20316](https://github.com/BerriAI/litellm/pull/20316)
- **UI - MCP 語意篩選** - 新增 UI 上 MCP 語意篩選設定支援 - [PR #20454](https://github.com/BerriAI/litellm/pull/20454)
- **MCP 基於 IP 的存取控制** - 以 IP 為基礎的限制，將 MCP 伺服器設為可在網際網路上使用的私有／公開 - [PR #20607](https://github.com/BerriAI/litellm/pull/20607), [PR #20620](https://github.com/BerriAI/litellm/pull/20620)
- **修正 MCP「Session not found」錯誤**，於 VSCode 重新連線時發生 - [PR #20298](https://github.com/BerriAI/litellm/pull/20298)
- **修正 OAuth2 'Capabilities: none' 錯誤**，適用於上游 MCP 伺服器 - [PR #20602](https://github.com/BerriAI/litellm/pull/20602)
- **將設定中定義的搜尋工具納入** `/search_tools/list` - [PR #20371](https://github.com/BerriAI/litellm/pull/20371)
- **UI - 搜尋工具**：顯示設定中定義的搜尋工具 - [PR #20436](https://github.com/BerriAI/litellm/pull/20436)
- **確保使用 JWT Auth 時 MCP 權限會被強制執行** - [PR #20383](https://github.com/BerriAI/litellm/pull/20383)
- **修正 `gcs_bucket_name` 未被正確傳遞**，適用於 MCP 伺服器儲存設定 - [PR #20491](https://github.com/BerriAI/litellm/pull/20491)

---

## 效能 / 負載平衡 / 可靠性改進（14 項改進） {#performance--loadbalancing--reliability-improvements-14-improvements}

- **Prometheus 約降低 40% CPU** - 平行化 budget metrics、修正快取錯誤、降低 CPU 使用量 - [PR #20544](https://github.com/BerriAI/litellm/pull/20544)
- **透過還原 httpx client 快取來防止已關閉 client 錯誤** - [PR #20025](https://github.com/BerriAI/litellm/pull/20025)
- **在未設定任何 models 或 search tools 時避免不必要的 Router 建立** - [PR #20661](https://github.com/BerriAI/litellm/pull/20661)
- **使用 `CallTypes` 快取並減少查詢來最佳化 `wrapper_async`** - [PR #20204](https://github.com/BerriAI/litellm/pull/20204)
- **在模組層級快取 `_get_relevant_args_to_use_for_logging()`** - [PR #20077](https://github.com/BerriAI/litellm/pull/20077)
- **`normalize_request_route` 的 LRU 快取** - [PR #19812](https://github.com/BerriAI/litellm/pull/19812)
- **使用集合交集最佳化 `get_standard_logging_metadata`** - [PR #19685](https://github.com/BerriAI/litellm/pull/19685)
- **`completion_cost` 中針對未使用功能的提早退出防護** - [PR #20020](https://github.com/BerriAI/litellm/pull/20020)
- **使用稀疏 kwargs 擷取來最佳化 `get_litellm_params`** - [PR #19884](https://github.com/BerriAI/litellm/pull/19884)
- **保護 debug log f-strings** 並移除多餘的 dict 複製 - [PR #19961](https://github.com/BerriAI/litellm/pull/19961)
- **以 frozenset 查找取代 enum 建構** - [PR #20302](https://github.com/BerriAI/litellm/pull/20302)
- **保護 `update_environment_variables` 中的 debug f-string** - [PR #20360](https://github.com/BerriAI/litellm/pull/20360)
- **當 budget 查詢失敗時發出警告**，以顯示無聲的快取遺漏 - [PR #20545](https://github.com/BerriAI/litellm/pull/20545)
- **為每個 request 新增 INFO 等級的 session 重用記錄**，以提升可觀測性 - [PR #20597](https://github.com/BerriAI/litellm/pull/20597)

---

## 資料庫變更 {#database-changes}

### 結構描述更新 {#schema-updates}

| 資料表 | 變更類型 | 說明 | PR | 移轉 |
| ----- | ----------- | ----------- | -- | --------- |
| `LiteLLM_TeamTable` | 新增欄位 | 新增 `allow_team_guardrail_config` 布林欄位，用於 team-based guardrail 隔離 | [PR #20318](https://github.com/BerriAI/litellm/pull/20318) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260205091235_allow_team_guardrail_config/migration.sql) |
| `LiteLLM_DeletedTeamTable` | 新增欄位 | 新增 `allow_team_guardrail_config` 布林欄位 | [PR #20318](https://github.com/BerriAI/litellm/pull/20318) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260205091235_allow_team_guardrail_config/migration.sql) |
| `LiteLLM_TeamTable` | 新增欄位 | 新增 `soft_budget`（double precision），用於 soft budget alerting | [PR #20530](https://github.com/BerriAI/litellm/pull/20530) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260205144610_add_soft_budget_to_team_table/migration.sql) |
| `LiteLLM_DeletedTeamTable` | 新增欄位 | 新增 `soft_budget`（double precision） | [PR #20653](https://github.com/BerriAI/litellm/pull/20653) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260207110613_add_soft_budget_to_deleted_teams_table/migration.sql) |
| `LiteLLM_MCPServerTable` | 新增欄位 | 新增 `available_on_public_internet` 布林欄位，用於 MCP 以 IP 為基礎的存取控制 | [PR #20607](https://github.com/BerriAI/litellm/pull/20607) | [Migration](https://github.com/BerriAI/litellm/blob/main/litellm-proxy-extras/litellm_proxy_extras/migrations/20260207093506_add_available_on_public_internet_to_mcp_servers/migration.sql) |

---

## 文件更新（14 項更新） {#documentation-updates-14-updates}

- 新增設定與驗證 LITELLM_LICENSE 的 FAQ - [PR #20284](https://github.com/BerriAI/litellm/pull/20284)
- 模型請求標籤文件 - [PR #20290](https://github.com/BerriAI/litellm/pull/20290)
- 新增 Prisma migration 疑難排解指南 - [PR #20300](https://github.com/BerriAI/litellm/pull/20300)
- MCP Semantic Filtering 文件 - [PR #20316](https://github.com/BerriAI/litellm/pull/20316)
- 將 CopilotKit SDK 文件新增為支援的 agents SDK - [PR #20396](https://github.com/BerriAI/litellm/pull/20396)
- 新增 Nova Sonic 文件 - [PR #20320](https://github.com/BerriAI/litellm/pull/20320)
- 更新 Vertex AI Text to Speech 文件，顯示音訊的使用方式 - [PR #20255](https://github.com/BerriAI/litellm/pull/20255)
- 透過逐步說明改善 Okta SSO 設定指南 - [PR #20353](https://github.com/BerriAI/litellm/pull/20353)
- Langfuse 文件更新 - [PR #20443](https://github.com/BerriAI/litellm/pull/20443)
- 公開網際網路上的 MCP 暴露文件 - [PR #20626](https://github.com/BerriAI/litellm/pull/20626)
- 新增部落格文章：Achieving Sub-Millisecond Proxy Overhead - [PR #20309](https://github.com/BerriAI/litellm/pull/20309)
- 新增關於 litellm-observatory 的部落格文章 - [PR #20622](https://github.com/BerriAI/litellm/pull/20622)
- 使用 adaptive thinking 更新 Opus 4.6 部落格 - [PR #20637](https://github.com/BerriAI/litellm/pull/20637)
- `gpt-5-search-api` 文件釐清 - [PR #20512](https://github.com/BerriAI/litellm/pull/20512)

---

## 新貢獻者 {#new-contributors}
* @Quentin-M 在 [PR #19818](https://github.com/BerriAI/litellm/pull/19818) 中首次貢獻
* @amirzaushnizer 在 [PR #20235](https://github.com/BerriAI/litellm/pull/20235) 中首次貢獻
* @cscguochang 在 [PR #20214](https://github.com/BerriAI/litellm/pull/20214) 中首次貢獻
* @krauckbot 在 [PR #20273](https://github.com/BerriAI/litellm/pull/20273) 中首次貢獻
* @agrattan0820 在 [PR #19784](https://github.com/BerriAI/litellm/pull/19784) 中首次貢獻
* @nina-hu 在 [PR #20472](https://github.com/BerriAI/litellm/pull/20472) 中首次貢獻
* @swayambhu94 在 [PR #20469](https://github.com/BerriAI/litellm/pull/20469) 中首次貢獻
* @ssadedin 在 [PR #20566](https://github.com/BerriAI/litellm/pull/20566) 中首次貢獻

---

## 完整變更紀錄 {#full-changelog}
[v1.81.6-nightly...v1.81.9](https://github.com/BerriAI/litellm/compare/v1.81.6-nightly...v1.81.9)
