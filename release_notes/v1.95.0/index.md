---
title: "v1.95.0 - Claude Opus 5, MCP Gateway DCR & Rust /v1/messages"
slug: "v1-95-0"
date: 2026-08-01T00:00:00
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
docker.litellm.ai/berriai/litellm:1.95.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.95.0
```

</TabItem>
</Tabs>

:::danger[重大變更]

**團隊金鑰不再套用使用者預算。** 這回復了 [PR #32005](https://github.com/BerriAI/litellm/pull/32005) 的變更；該變更隨 `v1.94.0` 發布，並使使用者的個人 `max_budget` 疊加在團隊與團隊成員預算之上。團隊金鑰現在只會套用團隊預算，而隨之引入的 `skip_user_budget_on_team_key` opt-out 已移除；現在在 `general_settings` 中保留它不會產生任何作用。如果您為了恢復舊行為而加入該旗標，可以將其移除。請參閱 [PR #35271](https://github.com/BerriAI/litellm/pull/35271)。

:::

## 重點摘要 {#key-highlights}

- **Claude Opus 5 首日即全面提供** - 這款新的 1M context Opus 同步登陸 Anthropic、Amazon Bedrock（包括 `us`、`eu`、`au`、`jp` 和 `global` inference profiles）、Google Vertex AI，以及 Azure AI Foundry，並在 cost map 中記錄 adaptive thinking、xhigh reasoning effort、computer use、PDF input 和 prompt caching。
- **Gemini 3.6 Flash 與 Gemini 3.5 Flash Lite** - 於 Google AI Studio 和 Vertex AI 首日即提供定價，分別為每 1M tokens $1.50/$7.50 與 $0.30/$2.50。
- **MCP gateway 擴展為真正的前門** - 一個永遠啟用的 aggregate DCR discovery endpoint、僅限識別身分的 session tokens、上游 OAuth 路徑上的 RFC 8707 resource indicators、Anthropic `/v1/messages` API 上的 MCP server 支援，以及不再依賴 Chat UI 旗標的獨立 `/connect` route。
- **Rust gateway 接手 `/v1/messages`** - 原生 Anthropic Messages 現在透過 `LITELLM_RUST` 後方的 axum gateway 路由，並新增 Responses API WebSockets surface 的 1:1 移植、`litellm-core` 中的 BaseAWSLLM 憑證解析與 SigV4，以及透過 Python-to-Rust bridge 的 Bedrock 音訊轉錄。
- **管理 UI 的 SAML 2.0 SSO** - 與既有 OIDC flow 並行的第二條企業 SSO 路徑。
- **儀表板完成其 shadcn 與 DataTable 移轉** - 約二十個路由遷移到 shadcn 與共用的可組合 DataTable，並在 Organization Settings 與 Create Organization 背後新增 react-hook-form 與 zod 表單基礎架構。
- **預算重設變得正確** - 可設定的每天 `budget_reset_time`、不再無聲無息地降為 daily 的 word-form `budget_duration` 值，以及修復 `budget_reset_at` 留為 NULL 的使用者與團隊。
- **針對每位終端使用者的提供者層級濫用控制** - 透過 `overwrite_user_with_key_hash`，LiteLLM 解析傳入請求背後的身分，將解析後的虛擬金鑰雜湊寫入傳出的 `user` 參數，並將其轉送給提供者。接著，提供者便可在單一使用者層級而非整個組織層級進行封鎖或速率限制。請參閱 [PR #34417](https://github.com/BerriAI/litellm/pull/34417)。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新增模型支援（16 個新的定價項目） {#new-model-support-16-new-pricing-entries}

| 提供者 | 模型 | Context Window | 輸入 ($/1M tokens) | 輸出 ($/1M tokens) | 功能 |
| --- | --- | --- | --- | --- | --- |
| Anthropic | `claude-opus-5` | 1M | $5.00 | $25.00 | Reasoning（adaptive + xhigh）、vision、computer use、function calling、PDF input、prompt caching、native structured output |
| Amazon Bedrock | `anthropic.claude-opus-5` | 1M | $5.00 | $25.00 | Reasoning（adaptive + xhigh）、vision、computer use、function calling、PDF input、prompt caching、parallel tool use config |
| Amazon Bedrock | `global.anthropic.claude-opus-5` | 1M | $5.00 | $25.00 | 同上 |
| Amazon Bedrock | `us.anthropic.claude-opus-5` | 1M | $5.50 | $27.50 | 同上 |
| Amazon Bedrock | `eu.anthropic.claude-opus-5` | 1M | $5.50 | $27.50 | 同上 |
| Amazon Bedrock | `au.anthropic.claude-opus-5` | 1M | $5.50 | $27.50 | 同上 |
| Amazon Bedrock | `jp.anthropic.claude-opus-5` | 1M | $5.50 | $27.50 | 同上 |
| Google Vertex AI | `vertex_ai/claude-opus-5` | 1M | $5.00 | $25.00 | Reasoning（adaptive + xhigh）、vision、computer use、function calling、PDF input、prompt caching |
| Google Vertex AI | `vertex_ai/claude-opus-5@default` | 1M | $5.00 | $25.00 | 同上 |
| Azure AI Foundry | `azure_ai/claude-opus-5` | 1M | $5.00 | $25.00 | Reasoning（adaptive + xhigh）、vision、computer use、function calling、PDF input、prompt caching |
| Google AI Studio | `gemini/gemini-3.6-flash` | 1.05M | $1.50 | $7.50 | Reasoning、vision、audio input、video input、PDF input、web search、URL context、prompt caching |
| Google AI Studio | `gemini/gemini-3.5-flash-lite` | 1.05M | $0.30 | $2.50 | Reasoning、vision、audio input、video input、PDF input、web search、URL context、prompt caching |
| Google Vertex AI | `gemini-3.6-flash` | 1.05M | $1.50 | $7.50 | 同上 |
| Google Vertex AI | `vertex_ai/gemini-3.6-flash` | 1.05M | $1.50 | $7.50 | 同上 |
| Google Vertex AI | `gemini-3.5-flash-lite` | 1.05M | $0.30 | $2.50 | 同上 |
| Google Vertex AI | `vertex_ai/gemini-3.5-flash-lite` | 1.05M | $0.30 | $2.50 | 同上 |

除了新的項目之外，此版本也將 `azure_ai/claude-opus-4-6`、`claude-opus-4-7` 與 `claude-opus-4-8` 的宣告 context window 從 200K 提升至 1M，將 DeepSeek V4 `flash` 與 `pro` 系列標記為 reasoning 模型，並記錄 Vertex AI 與 Azure AI 上 Claude Fable 5、Sonnet 5 和 Opus 4.8 項目的 `supports_mid_conversation_system`。沒有移除任何定價項目。

#### 功能 {#features}

- **[Anthropic](../../docs/providers/anthropic)**
    - 新增 Claude Opus 5 - [PR #34518](https://github.com/BerriAI/litellm/pull/34518)
- **[Google AI Studio / Vertex AI](../../docs/providers/vertex)**
    - `gemini-3.6-flash` 與 `gemini-3.5-flash-lite` 的首日定價 - [PR #34106](https://github.com/BerriAI/litellm/pull/34106)

### 錯誤修正 {#bug-fixes}

- **[Anthropic](../../docs/providers/anthropic)**
    - 僅在請求尚未攜帶 `cache_control` 時才注入該值 - [PR #33886](https://github.com/BerriAI/litellm/pull/33886)
    - 從 `output_format` schema 移除 `uniqueItems` 以及其他不支援的陣列與物件限制 - [PR #34313](https://github.com/BerriAI/litellm/pull/34313)
    - 移除 Anthropic 拒絕的其餘 `output_format` schema 關鍵字 - [PR #34319](https://github.com/BerriAI/litellm/pull/34319)
- **[Amazon Bedrock](../../docs/providers/bedrock)**
    - 將 Codex `additional_tools` input items 提升到 Bedrock Mantle 上層的 `tools` - [PR #33228](https://github.com/BerriAI/litellm/pull/33228)
- **[Google Vertex AI](../../docs/providers/vertex)**
    - 以增量方式解析累積的 Gemini stream JSON，讓多值 payload 不再卡住 stream - [PR #34320](https://github.com/BerriAI/litellm/pull/34320)
    - 處理 Vertex AI batch 回應中的明確 `outputInfo: null` - [PR #34473](https://github.com/BerriAI/litellm/pull/34473)
- **[Azure AI Foundry](../../docs/providers/azure_ai)**
    - 在 Foundry 上宣告 Claude Opus 4.6 及更新版本的 1M context window - [PR #34556](https://github.com/BerriAI/litellm/pull/34556)
- **[Fireworks AI](../../docs/providers/fireworks_ai)**
    - 還原 `application/json` Content-Type header，修正 415 回應 - [PR #33929](https://github.com/BerriAI/litellm/pull/33929)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Responses API](../../docs/response_api)**
    - OpenAI Responses API WebSockets 介面的 1:1 移植到 `litellm-rust` - [PR #33849](https://github.com/BerriAI/litellm/pull/33849)
- **[Anthropic `/v1/messages`](../../docs/anthropic_unified)**
    - 將原生 Anthropic `/messages` 經由 Rust 路由到 `LITELLM_RUST` 環境變數後方 - [PR #33848](https://github.com/BerriAI/litellm/pull/33848)
    - 在 axum gateway 上公開 Anthropic Messages 路由 - [PR #33880](https://github.com/BerriAI/litellm/pull/33880)
- **[Batches](../../docs/batches)**
    - 將 `bedrock_tags` 轉送到 `CreateModelInvocationJob` 以處理批次作業 - [PR #33733](https://github.com/BerriAI/litellm/pull/33733)
- **一般**
    - 為 Codex user agents 自動啟用 `drop_params` - [PR #34068](https://github.com/BerriAI/litellm/pull/34068)

#### 錯誤修正 {#bugs}

- **[Responses API](../../docs/response_api)**
    - 透過 prompt hooks 保留 reasoning 內容 - [PR #33422](https://github.com/BerriAI/litellm/pull/33422)
    - 每個 stream 保持一個 chat completion id，且一律串流已完成的回應 - [PR #34539](https://github.com/BerriAI/litellm/pull/34539)
    - 從 `stream_options` 移除 `include_usage`，而不是丟棄整個參數 - [PR #34549](https://github.com/BerriAI/litellm/pull/34549)
- **[Anthropic `/v1/messages`](../../docs/anthropic_unified)**
    - 為 Claude on Vertex AI 和 Azure 提供具模型感知的對話中系統處理 - [PR #33807](https://github.com/BerriAI/litellm/pull/33807)
    - 將 agentic-hook `/messages` 請求在所有串流模式下路由回 Python - [PR #34126](https://github.com/BerriAI/litellm/pull/34126)
    - 回填非串流 Bedrock Mantle `/v1/messages` 回應的用量 - [PR #34446](https://github.com/BerriAI/litellm/pull/34446)
- **[Batches](../../docs/batches)**
    - 以 `unified_object_id` 游標分頁管理式批次清單 - [PR #34192](https://github.com/BerriAI/litellm/pull/34192)
    - 在派送前先透過擁有權檢查，將受管理的統一 `input_file_id` 解析為儲存 URL - [PR #34474](https://github.com/BerriAI/litellm/pull/34474)
    - 讓 managed-file 解析具備加總式行為，恢復對缺少列與查詢錯誤的 fallback - [PR #34584](https://github.com/BerriAI/litellm/pull/34584)
- **即時**
    - 在連線時發出 Nova Sonic `session.created` 事件，並在 `session.updated` 時發出 `session.update` - [PR #34133](https://github.com/BerriAI/litellm/pull/34133)
    - 為 Nova Sonic realtime 安裝 `bedrock-realtime` 額外套件 - [PR #34426](https://github.com/BerriAI/litellm/pull/34426)
- **A2A**
    - 在 agent cards 中接受像 `0.3.0` 這類的 semver `protocolVersion` 值 - [PR #34154](https://github.com/BerriAI/litellm/pull/34154)
    - 允許可選的 `securityScheme` 欄位，讓 `/public/agent_hub` 不再發生 500 錯誤 - [PR #33897](https://github.com/BerriAI/litellm/pull/33897)
    - 透過 gateway 元件路由 `/a2a` - [PR #34958](https://github.com/BerriAI/litellm/pull/34958)
- **一般**
    - 對未附帶 messages 送出的 chat completions 回傳 400，而不是 500 - [PR #34547](https://github.com/BerriAI/litellm/pull/34547)
    - 將 `queued` 新增至 Interaction 狀態列舉 - [PR #34135](https://github.com/BerriAI/litellm/pull/34135)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **驗證與 SSO**
    - 供管理 UI 使用的 SAML 2.0 SSO - [PR #31429](https://github.com/BerriAI/litellm/pull/31429)
    - 透過 `overwrite_user_with_key_hash` 以金鑰雜湊標記外送的 `user` 參數 - [PR #34417](https://github.com/BerriAI/litellm/pull/34417)
- **組織**
    - RESTful `PATCH /v2/organization/{organization_id}` - [PR #32350](https://github.com/BerriAI/litellm/pull/32350)
    - 在 react-hook-form 和 zod 上重建 Organization Settings，並採用 dirty-field PATCH - [PR #34324](https://github.com/BerriAI/litellm/pull/34324)
    - 將 Create Organization 表單遷移到 shadcn 和 react-hook-form - [PR #34552](https://github.com/BerriAI/litellm/pull/34552)
- **虛擬金鑰**
    - 可直接從 key info page 封鎖與解除封鎖一個 key - [PR #34116](https://github.com/BerriAI/litellm/pull/34116)
    - 透過 `?key=` 查詢參數深度連結 virtual key 詳細資料檢視 - [PR #34591](https://github.com/BerriAI/litellm/pull/34591)
    - 在 key info 與 keys table 中顯示 key 的 `budget_reset_at` - [PR #34113](https://github.com/BerriAI/litellm/pull/34113)
- **模型 + 端點**
    - 為每個 Models + Endpoints 分頁提供各自的路徑 - [PR #34327](https://github.com/BerriAI/litellm/pull/34327)
    - 擷取共用的分頁路由輔助函式，並將其套用於 Models + Endpoints - [PR #34435](https://github.com/BerriAI/litellm/pull/34435)
    - 讓 DB config-reload 間隔可從 `config.yaml` 與 Admin UI 進行設定 - [PR #34130](https://github.com/BerriAI/litellm/pull/34130)
- **Shared DataTable migration**
    - Credentials、available teams、memory、audit logs、organizations、以及 agents 資料表 - [PR #34053](https://github.com/BerriAI/litellm/pull/34053), [PR #34070](https://github.com/BerriAI/litellm/pull/34070), [PR #34079](https://github.com/BerriAI/litellm/pull/34079), [PR #34080](https://github.com/BerriAI/litellm/pull/34080), [PR #34081](https://github.com/BerriAI/litellm/pull/34081), [PR #34089](https://github.com/BerriAI/litellm/pull/34089)
    - Tool Policies、users and model health checks、request logs、models and endpoints，以及 routing groups 資料表 - [PR #34176](https://github.com/BerriAI/litellm/pull/34176), [PR #34182](https://github.com/BerriAI/litellm/pull/34182), [PR #34343](https://github.com/BerriAI/litellm/pull/34343), [PR #34363](https://github.com/BerriAI/litellm/pull/34363), [PR #34571](https://github.com/BerriAI/litellm/pull/34571)
    - 在共用 DataTable 上控制列選取 - [PR #34167](https://github.com/BerriAI/litellm/pull/34167)
- **shadcn migration**
    - api-reference、prompts list、transform-request、old-usage、search-tools、agents、memory、以及 workflow runs - [PR #34263](https://github.com/BerriAI/litellm/pull/34263), [PR #34289](https://github.com/BerriAI/litellm/pull/34289), [PR #34303](https://github.com/BerriAI/litellm/pull/34303), [PR #34304](https://github.com/BerriAI/litellm/pull/34304), [PR #34323](https://github.com/BerriAI/litellm/pull/34323), [PR #34365](https://github.com/BerriAI/litellm/pull/34365), [PR #34366](https://github.com/BerriAI/litellm/pull/34366), [PR #34370](https://github.com/BerriAI/litellm/pull/34370)
    - mcp-servers、tag-management、tool-policies、logging-and-alerts、caching、policies、budgets、skills、ui-theme、access-groups、以及 vector-stores - [PR #34469](https://github.com/BerriAI/litellm/pull/34469), [PR #34468](https://github.com/BerriAI/litellm/pull/34468), [PR #34465](https://github.com/BerriAI/litellm/pull/34465), [PR #34466](https://github.com/BerriAI/litellm/pull/34466)
    - react-hook-form 和 zod 表單基礎架構 - [PR #34170](https://github.com/BerriAI/litellm/pull/34170)
    - 將內嵌 provider logo 查詢，以及 MCP、callback、guardrail、SSO、與 search-tool logo 移到共用的 Logo 元件上 - [PR #34141](https://github.com/BerriAI/litellm/pull/34141), [PR #34169](https://github.com/BerriAI/litellm/pull/34169)
- **Typed management API**
    - 為 `PATCH /team/{team_id}` 請求本文加上型別 - [PR #34195](https://github.com/BerriAI/litellm/pull/34195)
    - 從產生的 schema 推導 dashboard `object_permission` 型別 - [PR #34454](https://github.com/BerriAI/litellm/pull/34454)

#### 錯誤修正 {#bugs-1}

- **SCIM**
    - 使用 `members_with_roles` 作為群組成員資格的唯一事實來源 - [PR #34162](https://github.com/BerriAI/litellm/pull/34162)
    - 從團隊的 `members_with_roles` 中修剪已刪除的使用者 - [PR #34180](https://github.com/BerriAI/litellm/pull/34180)
    - 當省略 `value` 時，從篩選後的 PATCH 路徑解析成員資格 id - [PR #34181](https://github.com/BerriAI/litellm/pull/34181)
    - 同步團隊名冊，並在現有使用者 email upsert 時去重團隊 - [PR #34183](https://github.com/BerriAI/litellm/pull/34183)
- **團隊與使用者**
    - 將新增團隊成員改為具原子性，避免並行新增遺失成員 - [PR #34185](https://github.com/BerriAI/litellm/pull/34185)
    - 在新增團隊成員時恢復具原子性的使用者 upsert - [PR #34457](https://github.com/BerriAI/litellm/pull/34457)
    - 將 JWT 預設團隊路由到 memberships，而不是 create payload - [PR #33082](https://github.com/BerriAI/litellm/pull/33082)
    - 在 JWT 驗證時將 `user_email` 填入 `UserAPIKeyAuth` - [PR #34174](https://github.com/BerriAI/litellm/pull/34174)
    - 在預設使用者設定中驗證預設團隊值 - [PR #34815](https://github.com/BerriAI/litellm/pull/34815)
- **組態與憑證**
    - 防止透過具有 URL 值的模型目的地與備援洩露提供者金鑰 - [PR #34189](https://github.com/BerriAI/litellm/pull/34189)
    - 停止 `save_config` 將 `environment_variables` 快照到 DB 中 - [PR #34119](https://github.com/BerriAI/litellm/pull/34119)
    - 在金鑰更新稽核記錄 `object_id` 中將呼叫端提供的金鑰雜湊化 - [PR #34632](https://github.com/BerriAI/litellm/pull/34632)
    - 顯示作為 process env vars 提供的 SSO 與 SMTP 設定 - [PR #33576](https://github.com/BerriAI/litellm/pull/33576)
    - 反映 `REDIS_*` env 快取設定，並停止 UI 覆寫已儲存的密碼 - [PR #34160](https://github.com/BerriAI/litellm/pull/34160)
- **CLI**
    - `lite autoroute up` 的穩定連接埠與持久化 master key - [PR #34026](https://github.com/BerriAI/litellm/pull/34026)
    - 透過 `/v1/models` 探索模型，讓僅有 AI-API 金鑰也能用於 autoroute - [PR #34259](https://github.com/BerriAI/litellm/pull/34259)
- **儀表板**
    - 依 request id 跨頁面與日期尋找記錄 - [PR #31743](https://github.com/BerriAI/litellm/pull/31743)
    - 在記錄頁面上限定並約束 End User 篩選器 - [PR #34579](https://github.com/BerriAI/litellm/pull/34579)
    - 將金鑰持續時間輸入欄繫結到單一 `Form.Item`，使預先填入的到期時間可提交 - [PR #34521](https://github.com/BerriAI/litellm/pull/34521)
    - 停止在 fetchClient middleware 中將含 body 的請求複製到 stream uploads - [PR #34122](https://github.com/BerriAI/litellm/pull/34122)
    - 區分回應快取與提供者 prompt 快取 - [PR #34138](https://github.com/BerriAI/litellm/pull/34138)
    - 讓實體使用量分頁與其面板對齊 - [PR #34573](https://github.com/BerriAI/litellm/pull/34573)
    - 為 Active 金鑰狀態徽章新增工具提示 - [PR #34109](https://github.com/BerriAI/litellm/pull/34109)
    - 恢復 Add MCP Server 對話框尺寸與標題間距，並使 MCP Servers 分頁符合 dashboard line 分頁模式 - [PR #34679](https://github.com/BerriAI/litellm/pull/34679), [PR #34685](https://github.com/BerriAI/litellm/pull/34685)
    - 置中垂直工具列分隔線，並在 models 表格的 team 下拉選單中截斷過長的團隊名稱 - [PR #34684](https://github.com/BerriAI/litellm/pull/34684), [PR #34689](https://github.com/BerriAI/litellm/pull/34689)
    - 從 nginx image 而非 SPA fallback 提供 `/ui/assets`，並將提供者 logo 打包為靜態匯入 - [PR #34066](https://github.com/BerriAI/litellm/pull/34066), [PR #34125](https://github.com/BerriAI/litellm/pull/34125), [PR #34163](https://github.com/BerriAI/litellm/pull/34163)
    - 將 Models + Endpoints 分頁恢復為記憶體內路由，同時保留 `?model` drill-in - [PR #34629](https://github.com/BerriAI/litellm/pull/34629)
    - 將一般登入導向 keys dashboard，並將 MCP consent 傳送至 `/ui/connect` - [PR #35523](https://github.com/BerriAI/litellm/pull/35523)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[OpenTelemetry](../../docs/observability/opentelemetry_integration)**
    - 將 MCP tool call 保持在同一個 trace 中，並以其自身 request 作為錨點 - [PR #34537](https://github.com/BerriAI/litellm/pull/34537)
    - 將 MCP tool failure 標記在承載它的 request 上 - [PR #34551](https://github.com/BerriAI/litellm/pull/34551)
- **[Langfuse](../../docs/observability/langfuse_integration)**
    - 為 otel 回呼傳送 v4 ingestion header - [PR #33907](https://github.com/BerriAI/litellm/pull/33907)
- **[Prometheus](../../docs/proxy/prometheus)**
    - 填入 OpenAI 風格使用量的快取寫入 token 指標 - [PR #34803](https://github.com/BerriAI/litellm/pull/34803)
- **一般**
    - 記錄上游目標在 passthrough 路由上回報的成本與使用量 - [PR #34590](https://github.com/BerriAI/litellm/pull/34590)
    - 將記錄的 End User 篩選器移至 `/management/v1` - [PR #34691](https://github.com/BerriAI/litellm/pull/34691)
    - 將每個金鑰的回呼設定從已記錄的中繼資料中清理掉 - [PR #32583](https://github.com/BerriAI/litellm/pull/32583)
    - 在 callback 去重中比對完全相同的 class，使自訂子類別不再阻擋內建記錄器 - [PR #34804](https://github.com/BerriAI/litellm/pull/34804)
    - 停止將同步 `failure_handler` 與 `async_failure_handler` 同時排程 - [PR #34306](https://github.com/BerriAI/litellm/pull/34306)
    - 顯示來自 env-var 的主題與 logging-callback 設定，並移除誤導性的 `os.environ` 工具提示 - [PR #34156](https://github.com/BerriAI/litellm/pull/34156), [PR #34305](https://github.com/BerriAI/litellm/pull/34305)

### 防護欄 {#guardrails}

- **[一般](../../docs/proxy/guardrails/quick_start)**
    - 為每個 session 的增量掃描新增 `only_scan_new_messages` - [PR #33278](https://github.com/BerriAI/litellm/pull/33278)
    - 為並行 `pre_call` 與 `post_call` 防護欄新增 `run_in_parallel` opt-in - [PR #33770](https://github.com/BerriAI/litellm/pull/33770)
    - 將 DeepKeep 新增為自訂防護欄 - [PR #33844](https://github.com/BerriAI/litellm/pull/33844)
    - 在 `pre_call_hook` 之前合併模型層級防護欄 - [PR #29654](https://github.com/BerriAI/litellm/pull/29654)
    - 將所有 4xx `HTTPException` 防護欄封鎖分類為已介入 - [PR #33821](https://github.com/BerriAI/litellm/pull/33821)
    - 停止在 passthrough 上將無作用的防護欄回報為已套用 - [PR #34411](https://github.com/BerriAI/litellm/pull/34411)
    - 當呼叫端送出自己的中繼資料時，保留 spend logs 中的防護欄資訊 - [PR #34458](https://github.com/BerriAI/litellm/pull/34458)
    - 在 `llm_as_a_judge` 中透過 lazy Router lookup 解析 `judge_model` 憑證 - [PR #34509](https://github.com/BerriAI/litellm/pull/34509)
- **[Model Armor](../../docs/proxy/guardrails/model_armor)**
    - 預設清理錯誤詳細資料 - [PR #33908](https://github.com/BerriAI/litellm/pull/33908)
    - 在 `post_call` 回應處理器中處理 `None` 中繼資料 - [PR #34405](https://github.com/BerriAI/litellm/pull/34405)
- **Compresr / Headroom**
    - 在 Anthropic 流量的 headroom 防護欄中壓縮 content-parts 訊息 - [PR #34586](https://github.com/BerriAI/litellm/pull/34586)
    - 當壓縮服務省略 `tokens_saved` 時推導之 - [PR #34578](https://github.com/BerriAI/litellm/pull/34578)
    - 在 compresr write-back 中保留 `cache_control` 斷點 - [PR #34660](https://github.com/BerriAI/litellm/pull/34660)
- **Straiker**
    - 新增 `/v1/messages` 支援 - [PR #34548](https://github.com/BerriAI/litellm/pull/34548)
- **[Bedrock Guardrails](../../docs/proxy/guardrails/bedrock)**
    - 停止將過期的 Google OIDC tokens 回放到 STS 以進行防護欄驗證 - [PR #34637](https://github.com/BerriAI/litellm/pull/34637)
- **儀表板**
    - 當只有一個群組有項目時，隱藏防護欄群組標題 - [PR #33885](https://github.com/BerriAI/litellm/pull/33885)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **預算**
    - 可設定 `budget_reset_time` 為一天 - [PR #31007](https://github.com/BerriAI/litellm/pull/31007)
    - 將 `budget_reset_at` 為 NULL 的使用者與團隊重設 - [PR #33623](https://github.com/BerriAI/litellm/pull/33623)
    - 修正字詞形式的 `budget_duration`，使其不再悄悄每天重設 - [PR #34250](https://github.com/BerriAI/litellm/pull/34250)
    - 對可重設的 proxy 預算資料列強制全域 `max_budget`，以便遵守 `budget_duration` - [PR #33732](https://github.com/BerriAI/litellm/pull/33732)
    - 當 JWT upsert 建立 `budget_duration` 時設定 `budget_reset_at` - [PR #34050](https://github.com/BerriAI/litellm/pull/34050)
    - 在 `fail_closed_budget_enforcement` 下拒絕失敗的原子預算保留 - [PR #34429](https://github.com/BerriAI/litellm/pull/34429)
    - 停止在團隊金鑰上強制套用使用者預算，回復 `v1.94.0` 中發布的階層變更 - [PR #35271](https://github.com/BerriAI/litellm/pull/35271)
    - 處理具 tz-aware 的 `temp_budget_expiry`、對快取命中金鑰套用 `temp_budget_increase`，並在不變更 token 的情況下推導增加量 - [PR #33840](https://github.com/BerriAI/litellm/pull/33840), [PR #33841](https://github.com/BerriAI/litellm/pull/33841), [PR #34121](https://github.com/BerriAI/litellm/pull/34121)
    - 將儀表板工作階段預算預設值提高到 $1，並可在設定與 Admin UI 中設定 - [PR #34146](https://github.com/BerriAI/litellm/pull/34146)
- **[成本追蹤](../../docs/proxy/cost_tracking)**
    - 將 OpenAI `cache_write_tokens` 對應到提示快取建立計費 - [PR #34046](https://github.com/BerriAI/litellm/pull/34046)
    - 在每日支出彙總中追蹤提示壓縮節省的 token - [PR #33810](https://github.com/BerriAI/litellm/pull/33810)
    - 為未使用 `org_id` 發行的團隊連結憑證歸屬組織支出 - [PR #34577](https://github.com/BerriAI/litellm/pull/34577)
    - 為 Bedrock Mantle Responses API 在 `drop_params` 上設定不支援的 `service_tier` 防護 - [PR #34058](https://github.com/BerriAI/litellm/pull/34058)
    - 將 `/spend/logs/v2` `page_size` 上限提高到 1000 - [PR #33994](https://github.com/BerriAI/litellm/pull/33994)
- **成本最佳化頁面**
    - 新增依工具支出與快取洩漏檢視 - [PR #33978](https://github.com/BerriAI/litellm/pull/33978)
    - 新增設定分頁 - [PR #33899](https://github.com/BerriAI/litellm/pull/33899)
    - 在左側導覽中將成本最佳化標示為 beta - [PR #34984](https://github.com/BerriAI/litellm/pull/34984)
    - 將節省曲線錨定在 $0 的範圍起點，並將 methodology Collapse 改為 shadcn HoverCard - [PR #34453](https://github.com/BerriAI/litellm/pull/34453), [PR #34598](https://github.com/BerriAI/litellm/pull/34598)
    - 在較窄寬度下讓快取洩漏時間範圍選擇器維持 inline，並讓日期選擇器置於右側 - [PR #34439](https://github.com/BerriAI/litellm/pull/34439), [PR #34885](https://github.com/BerriAI/litellm/pull/34885)
- **工具支出**
    - 每日彙總工具支出，而非掃描 SpendLogs - [PR #34675](https://github.com/BerriAI/litellm/pull/34675)
    - 將 `/v1/tool/spend` 視窗上限設為 30 天，並限制每次 SpendLogs 讀取的範圍 - [PR #34582](https://github.com/BerriAI/litellm/pull/34582)
- **儀表板**
    - 停止在非預算儲存時讓金鑰編輯表單回傳 403 - [PR #34112](https://github.com/BerriAI/litellm/pull/34112)

## MCP Gateway {#mcp-gateway}

- **[動態用戶端註冊](../../docs/mcp)**
    - 一律啟用的整合 gateway DCR 探索入口 - [PR #33174](https://github.com/BerriAI/litellm/pull/33174)
    - gateway DCR 入口僅使用身分的工作階段 token - [PR #33182](https://github.com/BerriAI/litellm/pull/33182)
    - 讓 gateway DCR 工作階段 bearer 以整合 `/mcp` 範圍加入 - [PR #33190](https://github.com/BerriAI/litellm/pull/33190)
    - 回傳 DCR 用戶端自己的 `redirect_uris`，以停止 `/callback` 自我重新導向迴圈 - [PR #33756](https://github.com/BerriAI/litellm/pull/33756)
    - 當 passthrough authorize 沒有 `client_id` 時，改為使用暫時性 DCR mint - [PR #33884](https://github.com/BerriAI/litellm/pull/33884)
- **OAuth**
    - 在上游 OAuth 流程上傳送 RFC 8707 resource indicators - [PR #34265](https://github.com/BerriAI/litellm/pull/34265)
    - 將 `client_credentials`（M2M）移至 v2 resolver arm - [PR #32259](https://github.com/BerriAI/litellm/pull/32259)
    - 刪除無法到達的 v1 OBO handler，並以 v2 resolver 控制 REST OAuth - [PR #34407](https://github.com/BerriAI/litellm/pull/34407)
    - 讓管理員釘選的 issuer 為沒有 url 的伺服器驅動 OAuth 探索 - [PR #34065](https://github.com/BerriAI/litellm/pull/34065)
    - 為設定錯誤的伺服器 url 記錄可採取行動的 OAuth 探索失敗 - [PR #34225](https://github.com/BerriAI/litellm/pull/34225)
    - 在 SSO 登入時儲存企業 IdP 身分斷言，以供 EMA egress 使用 - [PR #34072](https://github.com/BerriAI/litellm/pull/34072)
    - MCP OAuth 的獨立 `/connect` 路由，與 Chat UI 開關解耦 - [PR #34334](https://github.com/BerriAI/litellm/pull/34334)
- **伺服器與工具**
    - 在 Anthropic `/v1/messages` API 上支援 MCP 伺服器 - [PR #33631](https://github.com/BerriAI/litellm/pull/33631)
    - 將 Google Sheets、Drive、Calendar 和 Docs 新增至 OpenAPI registry，並將 Drive 移至官方的 streamable HTTP MCP server - [PR #34059](https://github.com/BerriAI/litellm/pull/34059), [PR #34322](https://github.com/BerriAI/litellm/pull/34322)
    - 將解析後的 OAuth 憑證附加到 OpenAPI `spec_path` 工具請求 - [PR #34063](https://github.com/BerriAI/litellm/pull/34063)
    - 停止在工具請求 403 中洩漏上游伺服器憑證 - [PR #34340](https://github.com/BerriAI/litellm/pull/34340)
    - 直接使用 toolset 資料列中儲存的工具名稱 - [PR #34559](https://github.com/BerriAI/litellm/pull/34559)
    - 儲存編輯時保留金鑰的 MCP toolsets - [PR #34452](https://github.com/BerriAI/litellm/pull/34452)
    - 將 exception-tree walker 整併為單一共用的 faults traversal - [PR #33183](https://github.com/BerriAI/litellm/pull/33183)

## 效能 / 負載平衡 / 可靠性改進 {#performance--loadbalancing--reliability-improvements}

- **Rust 核心**
    - 將 `BaseAWSLLM` 驗證、憑證解析與 SigV4 移植到 `litellm-core` 作為基礎提供者 - [PR #33888](https://github.com/BerriAI/litellm/pull/33888)
    - 透過 Python-to-Rust 橋接，以 Rust 核心處理 Bedrock 音訊轉錄 - [PR #33990](https://github.com/BerriAI/litellm/pull/33990)
    - 尊重 Azure `/messages` 已預先計算的 Entra ID 驗證 - [PR #34107](https://github.com/BerriAI/litellm/pull/34107)
- **串流與核心**
    - 直接建立每個區塊的 `Delta`，而不是 `setattr`/`delattr` 的反覆變動 - [PR #33992](https://github.com/BerriAI/litellm/pull/33992)
    - 對已宣告欄位採用 `SafeAttributeModel.__delattr__` 快速路徑 - [PR #33993](https://github.com/BerriAI/litellm/pull/33993)
    - 讓 SageMaker 串流事件在到達時立即轉送，以縮短 TTFT - [PR #34338](https://github.com/BerriAI/litellm/pull/34338)
- **路由器**
    - 從路由器設定編輯備援鏈 - [PR #32841](https://github.com/BerriAI/litellm/pull/32841)
    - 針對複雜度路由器的回應模型欄位提供 `return_raw_model_name` 切換 - [PR #33875](https://github.com/BerriAI/litellm/pull/33875)
    - 當自動路由器服務了請求時，在記錄抽屜與工作階段側邊欄中顯示 - [PR #34434](https://github.com/BerriAI/litellm/pull/34434)
    - 不要在 advisor 子呼叫失敗時讓父部署進入冷卻 - [PR #33792](https://github.com/BerriAI/litellm/pull/33792)
    - 停止自訂 `model_info` 洩漏到共用後端成本地圖鍵，並將能力旗標傳遞給它 - [PR #34041](https://github.com/BerriAI/litellm/pull/34041), [PR #34047](https://github.com/BerriAI/litellm/pull/34047)
    - 尊重請求層級的 `num_retries` 優先於 `litellm_settings.num_retries`，並停止將每個部署的 `num_retries` 作為提供者 `max_retries` 重複計算 - [PR #34124](https://github.com/BerriAI/litellm/pull/34124), [PR #34129](https://github.com/BerriAI/litellm/pull/34129)
    - 當部署被取代或刪除時，釋放預先路由策略槽位 - [PR #34564](https://github.com/BerriAI/litellm/pull/34564)
    - 將格式錯誤的成本地圖 token 限制在 `/v1/models` 上視為不存在 - [PR #33903](https://github.com/BerriAI/litellm/pull/33903)
- **Proxy 可靠性**
    - 讓記憶體與磁碟快取遞增具備原子性 - [PR #34013](https://github.com/BerriAI/litellm/pull/34013)
    - 在不需要 `enable_redis_auth_cache` 的情況下，讓 CLI SSO 登入工作階段可跨 worker 共用 - [PR #33261](https://github.com/BerriAI/litellm/pull/33261)
    - 避免在規劃中的 RDS IAM 輪替期間發生資料庫中斷 - [PR #34749](https://github.com/BerriAI/litellm/pull/34749)
    - 停止 `litellm/proxy` 在 `sys.path` 上遮蔽已安裝套件 - [PR #34656](https://github.com/BerriAI/litellm/pull/34656)
    - 在 `/opt/prisma` 建置非 root 的 prisma engines，讓任何 uid 都能離線執行 migration - [PR #34325](https://github.com/BerriAI/litellm/pull/34325)
    - 將明確的 Python 版本請求傳遞給 `uv tool install` - [PR #34750](https://github.com/BerriAI/litellm/pull/34750)
- **依賴項與建置**
    - 將 `litellm-rust` 工作區遷移至 Rust edition 2024 - [PR #33940](https://github.com/BerriAI/litellm/pull/33940)
    - 針對 gitpython、pypdf、pyasn1、js-yaml、brace-expansion、postcss、sharp 和 Next.js 進行 advisory-clear 升級 - [PR #34056](https://github.com/BerriAI/litellm/pull/34056), [PR #34148](https://github.com/BerriAI/litellm/pull/34148), [PR #34168](https://github.com/BerriAI/litellm/pull/34168), [PR #34193](https://github.com/BerriAI/litellm/pull/34193), [PR #34329](https://github.com/BerriAI/litellm/pull/34329), [PR #34634](https://github.com/BerriAI/litellm/pull/34634), [PR #34798](https://github.com/BerriAI/litellm/pull/34798)

## 文件更新 {#documentation-updates}

- 在 PR 範本中新增 TLDR 區段 - [PR #34203](https://github.com/BerriAI/litellm/pull/34203)
- 在 issue 範本中要求使用編號的重現步驟清單 - [PR #34207](https://github.com/BerriAI/litellm/pull/34207)

### 依擁有權區域彙總 PR {#pr-roll-up-by-ownership-area}

依擁有權區域的 PR（總計：294）

- UI：55
- 其他（CI / chore / tests / build / version bumps）：46
- 支出 / 預算 / 速率限制：34
- LLM API 端點：31
- MCP：29
- 驗證與管理：28
- 效能：22
- 防護欄：19
- 記錄：14
- 模型與提供者：14
- 文件：2

## 端到端測試 {#end-to-end-testing}

我們正大力投入端到端測試，以減少回歸並讓 LiteLLM 在每次發佈中更穩定。每個版本都會經過一個即時測試套件，該套件會在真實已部署的 proxy 上執行並連接真實的提供者端點，而不是使用 mock，因此我們驗證的行為就是您在正式環境中得到的行為。

這個版本新增了 62 個測試 PR，是迄今為止單一版本對測試套件的最大投資。新的涵蓋範圍包括 live A2A 代理程式、`/v1/images/edits`、`/openai` 與 `/vllm` 聊天直通成本記錄、憑證支援的 `/v1/messages`、透過 Rust 橋接的 Azure AI Foundry 與 Anthropic `/v1/messages`、在建立金鑰時的 MCP access-group 工具選擇、透過聊天 completions 驅動的真實 Linear OAuth MCP、跨個人、團隊與團隊成員金鑰的預算與速率限制重設，以及針對真實提供者的每週 session-anomaly 負載測試。Admin UI Playwright 套件已移至 `tests/e2e/ui`，而一系列強化 PR 則移除了控制平面寫入與資料平面同步延遲之間的跨套件競態。

## 新貢獻者 {#new-contributors}

- @lyb0307 在 [PR #33228](https://github.com/BerriAI/litellm/pull/33228) 中完成首次貢獻
- @jyeung-r7 在 [PR #33623](https://github.com/BerriAI/litellm/pull/33623) 中完成首次貢獻
- @vineetpuranik 在 [PR #33940](https://github.com/BerriAI/litellm/pull/33940) 中完成首次貢獻

## 完整變更記錄 {#full-changelog}

https://github.com/BerriAI/litellm/compare/v1.94.0...v1.95.0
