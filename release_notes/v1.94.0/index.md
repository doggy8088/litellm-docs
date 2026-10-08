---
title: "v1.94.0 - 路由器外掛程式、MCP 用戶端持有憑證與共享 DataTable UI"
slug: "v1-94-0"
date: 2026-07-28T00:00:00
authors:
  - name: Krrish Dholakia
    title: CEO, LiteLLM
    url: https://www.linkedin.com/in/krish-d/
    image_url: https://pbs.twimg.com/profile_images/1298587542745358340/DZv3Oj-h_400x400.jpg
  - name: Ishaan Jaff
    title: CTO, LiteLLM
    url: https://www.linkedin.com/in/reffajnaahsi/
    image_url: https://pbs.twimg.com/profile_images/1613813310264340481/lz54oEiB_400x400.jpg
  - name: Yuneng Jiang
    title: Senior Full Stack Engineer, LiteLLM
    url: https://www.linkedin.com/in/yuneng-david-jiang-455676139/
    image_url: https://avatars.githubusercontent.com/u/171294688?v=4
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## 部署此版本 {#deploy-this-version}

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.94.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.94.0
```

</TabItem>
</Tabs>

:::danger[已知問題 - 已在 v1.94.1 修正]

**使用者的個人 `max_budget` 會套用在其團隊金鑰上，這可能會讓他們無法登入 Admin UI。** 請升級至 [`v1.94.1`](/release_notes/v1.94.1/v1-94-1)。

當使用者的個人支出超過其自身預算時，即使團隊預算仍有剩餘，其團隊金鑰也會回傳 `429 ExceededBudget`。此檢查也會在管理路由上執行，而且 Admin UI 工作階段權杖是以團隊為範圍，因此受影響使用者看到的儀表板會是空白。

`v1.94.1` 會還原此行為並移除 `general_settings.skip_user_budget_on_team_key` 退出選項；如果您有設定，請將其從設定中移除。

:::

:::danger[破壞性變更]

**`timeout`、`stream_timeout` 和 `request_timeout` 在 `litellm_params` 中現在會強制套用到 `/v1/messages` 流量。** 較早版本會對 Anthropic Messages API 請求靜默忽略這些值，而這些請求一律以 600 秒的用戶端預設值執行。現在這些值會生效；對於串流請求，`stream_timeout` 會限制串流任兩個區塊之間的等待時間，而不只是在第一個 token 之前。先前沒有影響的低值，例如 `stream_timeout: 30`，現在會讓長時間執行的 Claude 串流在回應途中因 `ReadTimeout: Timeout on reading data from socket` 而失敗。升級前，請先檢查您的 Anthropic 與 Bedrock Claude 部署中的這些值。請參閱 [PR #33418](https://github.com/BerriAI/litellm/pull/33418)。

:::

## 重點摘要 {#key-highlights}

- **路由器外掛程式管線與 Auto-Router v2** - 新增可從 proxy YAML 設定解析的 `Router(plugins=[...])` 擴充點，以及 soft-floor 自適應模式、可選用（現為預設）的 session affinity、多模型 tier 隨機挑選，還有供複雜度路由器使用的使用者觸發升級關鍵字。
- **MCP 用戶端持有憑證成熟化** - 針對 `dcr_bridge` `oauth_delegate` DCR 用戶端的互動式 SSO 登入、用戶端持有的 refresh envelopes、在 token 端點鑄造的 gateway-bound envelopes、以 issuer 為錨點的 OAuth discovery（RFC 8414 §3.3）以避免授權伺服器 mix-up，以及 MCP egress 的 ID-JAG 支援。
- **Cost Optimization 頁面（beta）** - 新的儀表板介面，包含 Usage、Prompt Compression、Autorouter 與 Prompt Caching 標籤頁，依 driver 拆分的節省金額、按工具分類的支出，以及估算未快取輸入在 prompt caching 下原可節省多少的 cache leakage 卡片。
- **共享 DataTable 儀表板遷移** - Virtual Keys、Teams、Guardrails、Tags、Vector Stores、Prompts、Skills、AI Hub、MCP Toolsets 與 Policy Attachments 全部移至共享的可組合 DataTable。
- **支援 Python 3.14** - `requires-python` 上限移至 `<3.15`，pyo3 提升至 0.29 以便原生 Rust bridge 能編譯，且 redisvl / pypdf / openapi-core 在 3.14 上解除封鎖。
- **每個模型的 prompt cache 最低值** - `prompt_cache_min_tokens` 現已記錄在 Anthropic 與 Bedrock Claude 成本對映項目中，而路由器會解析每個模型實際的最低值，而非固定的 1024。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（5 筆新定價項目） {#new-model-support-5-new-pricing-entries}

| 提供者 | 模型 | Context Window | 輸入（每 100 萬 tokens 美元） | 輸出（每 100 萬 tokens 美元） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Google AI Studio | `gemini/gemini-omni-flash-preview` | 1.05M | $1.50 | $9.00（影片輸出 $17.50） | Reasoning、vision、audio input、video input/output |
| Google Vertex AI | `gemini-omni-flash-preview` | 1.05M | $1.50 | $9.00（影片輸出 $17.50） | Reasoning、vision、audio input、video input/output |
| Amazon Bedrock (Mantle) | `bedrock_mantle/openai.gpt-5.6-sol` | 272K | $5.50 | $33.00 | Reasoning、vision、function calling、prompt caching、Responses API |
| Amazon Bedrock (Mantle) | `bedrock_mantle/openai.gpt-5.6-terra` | 272K | $2.75 | $16.50 | Reasoning、vision、function calling、prompt caching、Responses API |
| Amazon Bedrock (Mantle) | `bedrock_mantle/openai.gpt-5.6-luna` | 272K | $1.10 | $6.60 | Reasoning、vision、function calling、prompt caching、Responses API |

除了新的項目之外，此版本也記錄了 Anthropic 與 Bedrock Claude 系列的 `prompt_cache_min_tokens`（依模型為 512-4096），將 `gpt-realtime` 系列標記為 `mode: realtime` 而非 `chat`，將 Gemini 圖像生成模型標記為非 reasoning，並修正 Fireworks `glm-5p2` prompt-cache 讀取價格。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增 `enable_anthropic_prompt_caching` 以自動注入 `cache_control` - [PR #33573](https://github.com/BerriAI/litellm/pull/33573)
    - 當模型宣告支援原生輸出能力時，使用該能力 - [PR #33235](https://github.com/BerriAI/litellm/pull/33235)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 將 GPT-5.6 `sol` / `terra` / `luna` 加入 Bedrock Mantle 成本對映 - [PR #33412](https://github.com/BerriAI/litellm/pull/33412)
    - 在 Bedrock Mantle 上將 `xai.grok-4.3` 導向 `/openai/v1` frontier 路徑 - [PR #33027](https://github.com/BerriAI/litellm/pull/33027)
    - 將 `bedrock_tags` 轉送至 `CreateModelInvocationJob` 以用於批次工作 - [PR #33733](https://github.com/BerriAI/litellm/pull/33733)
- **[Google AI Studio / Vertex AI](../../docs/providers/vertex)**
    - 新增具有影片輸出 token 定價的 `gemini-omni-flash-preview` - [PR #33274](https://github.com/BerriAI/litellm/pull/33274)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 將 LiteLLM session id 對應至 `x-session-affinity` 標頭以供 prompt caching 使用 - [PR #33717](https://github.com/BerriAI/litellm/pull/33717)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 在 Responses 串流配接器中精確一次發出 `message_start` - [PR #32667](https://github.com/BerriAI/litellm/pull/32667)
    - 針對 Chat Completions 與 Bedrock Converse，轉換 pre-4.6 模型的原始 adaptive thinking - [PR #32944](https://github.com/BerriAI/litellm/pull/32944)
    - 在 pass-through 中為 pre-4.6 模型降級 adaptive thinking 時，移除不相容的 `temperature` 參數 - [PR #33244](https://github.com/BerriAI/litellm/pull/33244)
    - 阻止 combined thinking-plus-signature 串流區塊造成 500 錯誤 - [PR #33505](https://github.com/BerriAI/litellm/pull/33505)
    - 針對來自 Bedrock 與 Vertex 的缺少 thinking-signature 錯誤進行自我修復 - [PR #33719](https://github.com/BerriAI/litellm/pull/33719)
    - 在 Anthropic 配接器中移除空的 `content_block_delta` 事件 - [PR #33315](https://github.com/BerriAI/litellm/pull/33315)
    - 遵循 messages 請求逾時 - [PR #33418](https://github.com/BerriAI/litellm/pull/33418)
    - 在 CLI 中解除對 `lite autoroute` proxy 依賴、adaptive thinking，以及 thinking-plus-signature 串流的阻塞 - [PR #33507](https://github.com/BerriAI/litellm/pull/33507)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 在 `Usage` 中顯示 Gemini grounding `toolUsePromptTokenCount` - [PR #33533](https://github.com/BerriAI/litellm/pull/33533)
    - 將 Google Search grounding token 排除在輸入 token 計費之外 - [PR #33742](https://github.com/BerriAI/litellm/pull/33742)
    - 將 Gemini 圖像生成模型標記為 `supports_reasoning: false` - [PR #32836](https://github.com/BerriAI/litellm/pull/32836)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 將 AWS 憑證 kwargs 轉送到 `litellm_params`，以便 responses 橋接保留 WIF 驗證 - [PR #32956](https://github.com/BerriAI/litellm/pull/32956)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 以 `cache_read` 費率計費 prompt-cache 命中 - [PR #33714](https://github.com/BerriAI/litellm/pull/33714)
    - 將 `glm-5p2` prompt-cache 讀取價格更正為 $0.14/1M - [PR #33796](https://github.com/BerriAI/litellm/pull/33796)
    - 還原 `Content-Type: application/json` 請求標頭，讓呼叫不再以 415 失敗 - [PR #33929](https://github.com/BerriAI/litellm/pull/33929)
- **[OpenAI](../../docs/providers/openai)**
    - 將僅支援 realtime 的 `gpt-realtime` 模型標記為 `mode: realtime` - [PR #33728](https://github.com/BerriAI/litellm/pull/33728)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **一般**
    - 新增一個 `x-litellm-model-name` 回應標頭，攜帶部署模型字串 - [PR #33698](https://github.com/BerriAI/litellm/pull/33698)

#### 錯誤 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 從最終回應延續 MCP gateway tool turns，並顯示失敗 - [PR #33025](https://github.com/BerriAI/litellm/pull/33025)
    - 將 `max_output_tokens` 限制在 API 最低值以下 - [PR #33098](https://github.com/BerriAI/litellm/pull/33098)
    - 在 Responses API 上攔截 web search - [PR #33129](https://github.com/BerriAI/litellm/pull/33129)
- **[Pass-through](/docs/pass_through/intro)**
    - 停止將純 `predict` / `search` 路徑分類為 Vertex - [PR #33658](https://github.com/BerriAI/litellm/pull/33658)
    - 停止在強制驗證的 pass-through 路由上，將上游 `model` body 欄位視為 LiteLLM 模型 - [PR #33710](https://github.com/BerriAI/litellm/pull/33710)
- **一般**
    - 顯示上游連線重設，而不是空的 200 串流 - [PR #33222](https://github.com/BerriAI/litellm/pull/33222)
    - 從 cost map 而不是 `Router.get_model_group_info` 取得 `/v1/models` token 限制 - [PR #33721](https://github.com/BerriAI/litellm/pull/33721)
    - 在 `/v1/models` 上，將格式錯誤的已設定 token 限制視為不存在 - [PR #33864](https://github.com/BerriAI/litellm/pull/33864)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **UI（共用 DataTable 遷移）**
    - 以共用 DataTable 重新建置 Virtual Keys 與 Teams 表格 - [PR #32991](https://github.com/BerriAI/litellm/pull/32991), [PR #33128](https://github.com/BerriAI/litellm/pull/33128)
    - 將 guardrails、tags 與 policy attachments 表格遷移到共用 DataTable - [PR #33303](https://github.com/BerriAI/litellm/pull/33303), [PR #33314](https://github.com/BerriAI/litellm/pull/33314), [PR #33827](https://github.com/BerriAI/litellm/pull/33827)
    - 遷移 vector stores、prompts 與 skills 表格，以及另外五個簡單表格 - [PR #33343](https://github.com/BerriAI/litellm/pull/33343), [PR #33548](https://github.com/BerriAI/litellm/pull/33548)
    - 遷移 AI Hub、public hub 與 MCP Toolsets 表格 - [PR #33629](https://github.com/BerriAI/litellm/pull/33629)
- **UI（成本最佳化）**
    - 在 Cost Optimization 頁面新增按工具支出與快取洩漏檢視 - [PR #33978](https://github.com/BerriAI/litellm/pull/33978)
    - 新增 Usage、Prompt Compression、Autorouter 與 Prompt Caching 設定分頁 - [PR #33899](https://github.com/BerriAI/litellm/pull/33899)
    - 在左側導覽列中將 Cost Optimization 標示為 beta - [PR #34984](https://github.com/BerriAI/litellm/pull/34984)
- **UI**
    - 將端點使用量圖表轉換為 shadcn/recharts - [PR #32723](https://github.com/BerriAI/litellm/pull/32723)
    - 採用 `openapi-react-query` (`$api`) 並轉換 `useCustomers` - [PR #32949](https://github.com/BerriAI/litellm/pull/32949)
    - 為 complexity auto router 提供可用的 Test Connection，並在 Auto-Router v2 中提供 adaptive routing 設定 - [PR #32950](https://github.com/BerriAI/litellm/pull/32950), [PR #33146](https://github.com/BerriAI/litellm/pull/33146)
    - 為 semantic auto router 要求 embedding model - [PR #33313](https://github.com/BerriAI/litellm/pull/33313)
    - 從 Admin UI 設定 Anthropic automatic prompt caching - [PR #33581](https://github.com/BerriAI/litellm/pull/33581)
    - 在 usage cards 中顯示精確的授權到期日期 - [PR #33478](https://github.com/BerriAI/litellm/pull/33478)
    - 將 Caching 從 Experimental 移至 Developer Tools - [PR #33432](https://github.com/BerriAI/litellm/pull/33432)
    - 新增可重複使用的 `BetaBadge`，並將其用於 Projects 側邊欄項目 - [PR #33449](https://github.com/BerriAI/litellm/pull/33449)
    - 在聊天 UI 中新增僅限目前使用者的個人 Logs 檢視 - [PR #33829](https://github.com/BerriAI/litellm/pull/33829)
    - 將 Create Key 與 Create Team CTA 左對齊 - [PR #33248](https://github.com/BerriAI/litellm/pull/33248)
    - 將 Add/Edit credential 對話框整併為一個 `CredentialModal` - [PR #32572](https://github.com/BerriAI/litellm/pull/32572)
    - 在保留共用 `mcp_tools` 介面的同時，將 mcp-servers 檢視放在同一處 - [PR #32968](https://github.com/BerriAI/litellm/pull/32968)
    - 在共用 `DEBOUNCE_WAIT_MS` 常數後方標準化 debounce 等待時間，並將 value 與 callback debounces 遷移到 react-pacer - [PR #33040](https://github.com/BerriAI/litellm/pull/33040), [PR #33042](https://github.com/BerriAI/litellm/pull/33042), [PR #33043](https://github.com/BerriAI/litellm/pull/33043), [PR #33041](https://github.com/BerriAI/litellm/pull/33041)
    - 移除未掛載的 `UsageIndicator` 與 Hide Usage Indicator 標記 - [PR #33482](https://github.com/BerriAI/litellm/pull/33482)
- **Auth 與管理**
    - 擷取並來回保留 SCIM entitlements 與 roles 使用者屬性 - [PR #33587](https://github.com/BerriAI/litellm/pull/33587)
    - 新增 `disable_auto_add_proxy_admin_to_teams` 標記 - [PR #33563](https://github.com/BerriAI/litellm/pull/33563)
    - 新增 `lite up` / `lite down`，以便透過 proxy 以 ambient 方式路由 Claude Code - [PR #33231](https://github.com/BerriAI/litellm/pull/33231)

#### 錯誤 {#bugs-1}

- **UI（成本優化）**
    - 將 cache leakage time range picker 在較窄寬度下維持為 inline - [PR #34439](https://github.com/BerriAI/litellm/pull/34439), [PR #34885](https://github.com/BerriAI/litellm/pull/34885)
    - 將 savings chart 錨定在 $0 的 range start，並把 savings methodology 移到每個卡片的資訊彈出視窗中 - [PR #34994](https://github.com/BerriAI/litellm/pull/34994)
    - 新增缺少的頁面說明 - [PR #34967](https://github.com/BerriAI/litellm/pull/34967)
- **UI**
    - 修正 Virtual Keys redesign review 的細節問題 - [PR #33112](https://github.com/BerriAI/litellm/pull/33112)
    - 從 page-content wrappers 移除 `w-full`，以消除 32px 的水平溢出 - [PR #33118](https://github.com/BerriAI/litellm/pull/33118)
    - 使用 shadcn `ScrollArea` 呈現側邊欄捲動條 - [PR #33124](https://github.com/BerriAI/litellm/pull/33124)
    - 在團隊建立後顯示並允許編輯 team model aliases - [PR #33047](https://github.com/BerriAI/litellm/pull/33047)
    - 在 BYOK credential save 與 workflow-run fetches 中遵守 `litellm_key_header_name` - [PR #33103](https://github.com/BerriAI/litellm/pull/33103)
    - 停止在憑證編輯時保留遮罩後的 API 金鑰 - [PR #33797](https://github.com/BerriAI/litellm/pull/33797)
    - 在 render 時解析 chat routes，以便在 `server_root_path` 下導覽可正常運作 - [PR #33446](https://github.com/BerriAI/litellm/pull/33446)
    - 透過硬式導覽前往帶有尾端斜線的 `/ui/login/` - [PR #33561](https://github.com/BerriAI/litellm/pull/33561)
    - 讓管理員在 policy attachment form 中看到所有團隊 - [PR #33628](https://github.com/BerriAI/litellm/pull/33628)
    - 從 dashboard 左側導覽中移除 Chat 項目 - [PR #33647](https://github.com/BerriAI/litellm/pull/33647)
    - 將 tag deletion 移轉至共用的 `DeleteResourceModal` - [PR #33795](https://github.com/BerriAI/litellm/pull/33795)
    - 停止將 complexity-router pseudo-model 傳送到 `/health/test_connection` - [PR #33498](https://github.com/BerriAI/litellm/pull/33498)
    - 從 complexity 分頁下拉選單中篩除 embedding models，要求所有 tier，並進行 inline 驗證 - [PR #32978](https://github.com/BerriAI/litellm/pull/32978)
- **驗證與管理**
    - 將 master key 導向團隊範圍的模型 - [PR #32926](https://github.com/BerriAI/litellm/pull/32926)
    - 防止未識別的模型命名空間透過 provider wildcard keys 滲入 - [PR #32979](https://github.com/BerriAI/litellm/pull/32979)
    - 保留 `key_type`，讓 UI 顯示正確的 key scope，而不是 "All Proxy Models" - [PR #33115](https://github.com/BerriAI/litellm/pull/33115)
    - 強制自訂 key 最小長度，並在 `key_name` 中遮罩過短的 keys - [PR #33462](https://github.com/BerriAI/litellm/pull/33462)
    - 在擷取 SSO service principal 群組指派時，分頁讀取所有頁面 - [PR #33149](https://github.com/BerriAI/litellm/pull/33149)
    - 將 JWT enterprise gate 限定於實際的 JWT - [PR #33296](https://github.com/BerriAI/litellm/pull/33296)
    - 停止對 CLI login tokens 強制套用 UI session budget - [PR #33312](https://github.com/BerriAI/litellm/pull/33312)
    - 當 CLI 與 proxy 版本不一致時，顯示可採取行動的 CLI SSO 錯誤 - [PR #33309](https://github.com/BerriAI/litellm/pull/33309)
    - 為 vector store files 解析 team wildcard credentials - [PR #33649](https://github.com/BerriAI/litellm/pull/33649)
    - 將 CLI 輸出限制為僅 ASCII，以免當機於舊版 Windows 主控台 - [PR #33465](https://github.com/BerriAI/litellm/pull/33465)
    - 在 workers 之間共享 CLI SSO login sessions，且不使用 `enable_redis_auth_cache` - [PR #33261](https://github.com/BerriAI/litellm/pull/33261)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 為企業部署提供基於推送的 OTLP billable-request 計量 - [PR #31592](https://github.com/BerriAI/litellm/pull/31592)
    - 還原 v2 failure spans 上的 proxy-level `error.*` 屬性 - [PR #33664](https://github.com/BerriAI/litellm/pull/33664)
- **[Langfuse](../../docs/observability/langfuse_integration)**
    - 根據 key 與 team-level 的動態 Langfuse credentials 建立每個請求的 OTLP exporter - [PR #32437](https://github.com/BerriAI/litellm/pull/32437)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 公開影片長度與圖片數量的消耗指標 - [PR #33138](https://github.com/BerriAI/litellm/pull/33138)
    - 讀取 v3 rate limiter 的剩餘值，供 per-key model gauges 使用 - [PR #33119](https://github.com/BerriAI/litellm/pull/33119)
- **[S3](../../docs/proxy/logging#s3-buckets)**
    - 清理 response-id 衍生的 object key 檔名中的斜線 - [PR #33271](https://github.com/BerriAI/litellm/pull/33271)
- **一般**
    - 將使用者與團隊層級的 spend 和 budget 新增至 `StandardLoggingPayload` metadata - [PR #33459](https://github.com/BerriAI/litellm/pull/33459)
    - 將結構化 budget 欄位新增至 budget rejection failure logs - [PR #33460](https://github.com/BerriAI/litellm/pull/33460)
    - 保留 `get_combined_callback_list` 中的 callback 順序 - [PR #33005](https://github.com/BerriAI/litellm/pull/33005)
    - 將 async `anthropic_messages` 與 `generate_content` 分類為 async - [PR #33589](https://github.com/BerriAI/litellm/pull/33589)
    - 為自訂 callback 遮罩 async complete streaming response - [PR #33106](https://github.com/BerriAI/litellm/pull/33106)
    - 在 spend logs 中遮罩 assistant tool call arguments - [PR #33111](https://github.com/BerriAI/litellm/pull/33111)
    - 絕不在 key insertion debug output 中記錄原始 virtual keys - [PR #33268](https://github.com/BerriAI/litellm/pull/33268)

### 防護欄 {#guardrails}

- **[Straiker](/docs/proxy/guardrails/quick_start)**
    - 新增 Straiker 防護欄整合 - [PR #33781](https://github.com/BerriAI/litellm/pull/33781)
- **[Compresr](/docs/proxy/guardrails/quick_start)**
    - 新增用於具查詢感知內容壓縮的 Compresr 防護欄 - [PR #33295](https://github.com/BerriAI/litellm/pull/33295)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 新增無需資源的 `InvokeGuardrailChecks` 僅偵測模式 - [PR #33299](https://github.com/BerriAI/litellm/pull/33299)
- **[Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 透過 `skip_unscannable_attachments` 還原參考附件，並移除附件數量上限 - [PR #33554](https://github.com/BerriAI/litellm/pull/33554)
    - 在 `None` 回應處理中處理 `post_call` metadata - [PR #34405](https://github.com/BerriAI/litellm/pull/34405)
- **[Lasso](/docs/proxy/guardrails/quick_start)**
    - 傳送 `source.type` 以供 Used By 歸因 - [PR #33090](https://github.com/BerriAI/litellm/pull/33090)
- **[LLM Guard](/docs/proxy/guardrails/quick_start)**
    - 將 moderation API 傳回的已清理 prompt 套用至請求 - [PR #33331](https://github.com/BerriAI/litellm/pull/33331)
- **一般**
    - 在 `generic_guardrail_api` 中進行串流文字轉換 - [PR #33110](https://github.com/BerriAI/litellm/pull/33110)
    - 在 `POST /guardrails/apply_guardrail` 上傳遞可選 metadata - [PR #33067](https://github.com/BerriAI/litellm/pull/33067)
    - 在 deployment hook 執行 `apply_guardrail`-style 的模型層級 `pre_call` 防護欄 - [PR #33136](https://github.com/BerriAI/litellm/pull/33136)
    - 在 Guardrail Monitor 中顯示以 YAML 定義的防護欄 - [PR #32853](https://github.com/BerriAI/litellm/pull/32853)
    - 在共用內容 helpers 中逐一處理 `custom_tool_call_output` 項目 - [PR #32969](https://github.com/BerriAI/litellm/pull/32969)
    - 在 xecguard logging hook 中使用 `StandardLoggingGuardrailInformation`，並在記錄前清理掃描結果 - [PR #32911](https://github.com/BerriAI/litellm/pull/32911), [PR #32935](https://github.com/BerriAI/litellm/pull/32935)
    - 移除 singulr 模組中多餘的 docstring，以保持一致 - [PR #33800](https://github.com/BerriAI/litellm/pull/33800)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預算**
    - 在讀取時以及保留時，對團隊金鑰強制執行使用者預算，並提供 UI 排除選項 - [PR #32005](https://github.com/BerriAI/litellm/pull/32005)
    - 在設定載入時將 `default_internal_user_params.max_budget` 轉換為 float - [PR #32434](https://github.com/BerriAI/litellm/pull/32434)
    - 將 `temp_budget_increase` 套用於快取命中的金鑰，處理具時區資訊的 `temp_budget_expiry`，並在不變更 token 的情況下推導增量 - [PR #33841](https://github.com/BerriAI/litellm/pull/33841), [PR #33840](https://github.com/BerriAI/litellm/pull/33840), [PR #34121](https://github.com/BerriAI/litellm/pull/34121)
- **速率限制**
    - 將 `max_parallel_requests` 強制作為每個 slot 的並行度指標 - [PR #32441](https://github.com/BerriAI/litellm/pull/32441)
- **成本追蹤**
    - 對 OpenRouter 串流使用提供者回報的使用成本 - [PR #32255](https://github.com/BerriAI/litellm/pull/32255)
    - 追蹤未受管理的 Bedrock 批次成本，並將此旗標泛化 - [PR #32315](https://github.com/BerriAI/litellm/pull/32315)
    - 在支出記錄中追蹤未驗證的直通請求 - [PR #32410](https://github.com/BerriAI/litellm/pull/32410)
    - 追蹤 `/v1/rag/query` 的 LLM completion 使用量與支出 - [PR #32438](https://github.com/BerriAI/litellm/pull/32438)
    - 當用戶端在串流中途中斷連線時，計費部分串流支出 - [PR #33736](https://github.com/BerriAI/litellm/pull/33736)
    - 移除支出更新路徑中使用 `None` 金鑰的無用使用者快取查找 - [PR #33555](https://github.com/BerriAI/litellm/pull/33555)
    - 改為每日彙總工具支出，而非掃描 `SpendLogs`，並將 `/v1/tool/spend` 視窗限制為 30 天，且每次 `SpendLogs` 讀取都加上界限 - [PR #34675](https://github.com/BerriAI/litellm/pull/34675), [PR #34582](https://github.com/BerriAI/litellm/pull/34582)
    - 在每日支出彙總中追蹤 prompt 壓縮節省的 token - [PR #33810](https://github.com/BerriAI/litellm/pull/33810)
    - 針對未使用 `org_id` 建立的、與團隊關聯的憑證，歸屬組織支出 - [PR #34577](https://github.com/BerriAI/litellm/pull/34577)

## MCP 閘道 {#mcp-gateway}

- **用戶端轉送的憑證 (`dcr_bridge` / `oauth_delegate`)**
    - 為 `dcr_bridge` `oauth_delegate` DCR 用戶端提供互動式 SSO 登入 - [PR #32946](https://github.com/BerriAI/litellm/pull/32946)
    - 在 token 端點建立繫結至閘道的封套，並為此流程新增由用戶端持有的 refresh 封套 - [PR #32828](https://github.com/BerriAI/litellm/pull/32828), [PR #32980](https://github.com/BerriAI/litellm/pull/32980)
    - 將 `dcr_bridge` token 流程抽出到 `bridge_token_flow.py` - [PR #33141](https://github.com/BerriAI/litellm/pull/33141)
    - 將 `config.yaml` DCR 用戶端持久化到伺服器範圍的儲存，以便 refresh 在 token 到期後仍可存續 - [PR #33768](https://github.com/BerriAI/litellm/pull/33768)
    - 將被拒絕的 delegate-auth 上游 token 以連線時的 401 顯示，並回傳上游 OAuth token 與 DCR 拒絕，而非一般性的 500 - [PR #32741](https://github.com/BerriAI/litellm/pull/32741), [PR #33113](https://github.com/BerriAI/litellm/pull/33113)
    - 讓預先 401 的 OAuth challenge 決策符合模式感知 - [PR #33586](https://github.com/BerriAI/litellm/pull/33586)
- **OAuth 與身分識別**
    - 以 issuer 為錨點的 OAuth discovery（RFC 8414 §3.3）以避免 authorization-server mix-up - [PR #33450](https://github.com/BerriAI/litellm/pull/33450)
    - 新增 ID-JAG（identity assertion authorization grant）支援以供 MCP egress 使用 - [PR #31516](https://github.com/BerriAI/litellm/pull/31516)
    - 持久化已探索的 OAuth 端點，並在重新探索失敗時保留最後已知的良好集合 - [PR #33286](https://github.com/BerriAI/litellm/pull/33286)
    - 當 `authorization_url` 手動設定時，探索缺少的 OAuth scopes 與 `token_url` - [PR #33317](https://github.com/BerriAI/litellm/pull/33317)
    - 將每位使用者的 OAuth token 快取 TTL 上限設為 token 本身的生命週期 - [PR #33346](https://github.com/BerriAI/litellm/pull/33346)
- **工具與權限**
    - 彙總 `tools/list` 的每個伺服器結果，以及如實呈現的單一伺服器 REST 狀態 - [PR #33153](https://github.com/BerriAI/litellm/pull/33153)
    - 在共用權限原語中擴充工具集授權，使 `tools/call` 能遵守這些授權 - [PR #33612](https://github.com/BerriAI/litellm/pull/33612)
    - 將語意過濾器啟動索引中缺少的已驗證請求時間工具建立索引 - [PR #33318](https://github.com/BerriAI/litellm/pull/33318)
    - 當語意過濾器縮減工具時，保留 MCP 參照完整不變 - [PR #33584](https://github.com/BerriAI/litellm/pull/33584)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **路由**
    - 新增 `Router(plugins=[...])` routing-plugin 管線，從 proxy YAML 設定解析 auto-router routing plugins，並從已安裝套件解析 `router_settings.plugins` dotted paths - [PR #32972](https://github.com/BerriAI/litellm/pull/32972), [PR #33251](https://github.com/BerriAI/litellm/pull/33251), [PR #33644](https://github.com/BerriAI/litellm/pull/33644)
    - 為 complexity router 提供 soft-floor adaptive 模式與 random-pick multi-model tiers - [PR #32947](https://github.com/BerriAI/litellm/pull/32947), [PR #32967](https://github.com/BerriAI/litellm/pull/32967)
    - 讓 complexity router 可選擇使用 session affinity，之後預設啟用，並將 session id 由 Anthropic `metadata.user_id` 衍生 - [PR #33126](https://github.com/BerriAI/litellm/pull/33126), [PR #33500](https://github.com/BerriAI/litellm/pull/33500), [PR #33723](https://github.com/BerriAI/litellm/pull/33723)
    - 使用者觸發的升級關鍵字，以及在設定精靈中的每個 tier 語意關鍵字提示 - [PR #33656](https://github.com/BerriAI/litellm/pull/33656), [PR #33508](https://github.com/BerriAI/litellm/pull/33508)
    - 尊重來自 key/team `router_settings` 的每個請求 `routing_strategy`，並套用 team/key `enable_tag_filtering` 以標記路由 - [PR #33429](https://github.com/BerriAI/litellm/pull/33429), [PR #33436](https://github.com/BerriAI/litellm/pull/33436)
    - 針對共享的 `model_name` 進行具標籤感知的預路由策略選擇 - [PR #33691](https://github.com/BerriAI/litellm/pull/33691)
    - 改為依每個模型解析 prompt cache 最低值，而非固定 1024 - [PR #33637](https://github.com/BerriAI/litellm/pull/33637)
    - 對 Responses API 輸入強制執行 context-window 請求前檢查 - [PR #33706](https://github.com/BerriAI/litellm/pull/33706)
    - 修正 Responses API `tool_choice` 結構，並在 auto router 中傳遞別名 `litellm_params` - [PR #32974](https://github.com/BerriAI/litellm/pull/32974)
    - 當 metadata 不存在時，從 `_classifier_call_metadata` 回傳空字典 - [PR #33452](https://github.com/BerriAI/litellm/pull/33452)
    - 將 `model_info` 成本值轉型為 float 於 `_set_model_group_info` 中 - [PR #33556](https://github.com/BerriAI/litellm/pull/33556)
- **可靠性**
    - 透過 Rust 在 `rust:true` 後方路由 Azure Anthropic `/messages` - [PR #33616](https://github.com/BerriAI/litellm/pull/33616)
    - 停止在請求結束後繼續固定大型請求負載 - [PR #33455](https://github.com/BerriAI/litellm/pull/33455)
    - 停止將過時的 auth 快取重新發布到 Redis，以便金鑰更新可在複本之間傳播 - [PR #33565](https://github.com/BerriAI/litellm/pull/33565)
    - 建立 async Redis 連線池時，尊重 `ssl` 值，而非只看金鑰是否存在 - [PR #32590](https://github.com/BerriAI/litellm/pull/32590)
    - 當 worker 死亡時，回收孤立的 Prisma query-engine 行程 - [PR #33424](https://github.com/BerriAI/litellm/pull/33424)
- **部署**
    - 在元件化 Helm chart 中新增每個元件的 `PodDisruptionBudget` 與 `topologySpreadConstraints` - [PR #33430](https://github.com/BerriAI/litellm/pull/33430)
    - 將 Prisma CLI 與 engines 烘焙到固定路徑，使全新資料庫 migrations 可在離線狀態下對任何 uid 運作 - [PR #33853](https://github.com/BerriAI/litellm/pull/33853)
    - 在執行階段映像中還原 `litellm-proxy-extras` source dir - [PR #33592](https://github.com/BerriAI/litellm/pull/33592)
    - 更新有標記的依賴套件：pypdf、pyasn1、gitpython，以及 dashboard 的 next、postcss、sharp、js-yaml 和 brace-expansion - [PR #34640](https://github.com/BerriAI/litellm/pull/34640)

## 文件更新 {#documentation-updates}

- 在 PR 範本中新增 QA runbook 區段 - [PR #32965](https://github.com/BerriAI/litellm/pull/32965)
- 新增 router plugin 參考目錄 - [PR #33746](https://github.com/BerriAI/litellm/pull/33746)
- 讓 e2e 的 skip 與 fail 文件與 hard-fail 合約一致，並限定 no-unit-tests 規則的範圍 - [PR #33755](https://github.com/BerriAI/litellm/pull/33755)
- 為 litellm-rust 新增提供者程式碼標準與提供者抽象標準，並在 agent 規則中要求官方 Rust Style Guide - [PR #33833](https://github.com/BerriAI/litellm/pull/33833), [PR #33865](https://github.com/BerriAI/litellm/pull/33865), [PR #33867](https://github.com/BerriAI/litellm/pull/33867)

### 依所有權區域彙整的 PR {#pr-roll-up-by-ownership-area}

依所有權區域分類的 PR（總計：263）

- 其他（CI / chore / tests / build / version bumps）：76
- UI：48
- 效能 / 路由 / 可靠性：26
- 模型與提供者：23
- MCP：17
- 支出 / 預算 / 速率限制：16
- 防護欄：15
- 驗證與管理：14
- 記錄：13
- LLM API 端點：9
- 文件：6

## 端到端測試 {#end-to-end-testing}

我們正大力投入端到端測試，以減少迴歸並讓 LiteLLM 每次發佈都更加穩定。現在每個版本都會透過一套即時測試套件來驗證，該套件會對真實部署的 proxy 執行，並呼叫真實的提供者端點，而非模擬，因此我們驗證的行為就是您在正式環境中會得到的行為。我們的目標是在本週達到 95% 的涵蓋率，並在未來持續維持這個標準，讓更少的迴歸進入發佈版。

這次執行是針對 v1.94.0 release candidate，花了大約 58 分鐘，在一個涵蓋 Anthropic、Azure、Azure OpenAI、Amazon Bedrock（Converse 和 Invoke）、Google Vertex AI 以及 OpenAI 的即時閘道上執行了 264 項測試。

| 結果 | 數量 |
| --- | --- |
| 通過 | 263 |
| 失敗 | 1 |

涵蓋範圍包括存取控制、批次、Claude Code 介面（串流與非串流訊息、工具使用、視覺、思考、prompt caching、結構化輸出、PDF 輸入，以及網頁搜尋）、Realtime API、embeddings、rerank、影像生成、OCR、Responses API 與 `/v1/messages`、登入 Datadog、OpenTelemetry 與 Prometheus、金鑰／團隊／使用者／組織管理、MCP gateway、預算、速率限制、支出追蹤，以及路由。依據我們的內部涵蓋率登錄，這套測試目前覆蓋了 43.0% 的已追蹤儲存格（168/391），其中配額管理已達 95.0%，而核心 LLM 端點達到 72.4%。

唯一的失敗，`test_sustains_throughput_slo_under_load`，是一個負載生成情境，刻意將 proxy 推到超過其設定的吞吐量上限。這與功能正確性無關，且預期會在該流量下觸發。

完整執行報告附在這裡：[v1.94.0rc1 e2e 報告](pathname:///e2e-reports/v1-94-0-rc-1-e2e-report.log)。

## 新貢獻者 {#new-contributors}

- @Napuh 在 [PR #32667](https://github.com/BerriAI/litellm/pull/32667) 中完成了首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.93.0...v1.94.0
