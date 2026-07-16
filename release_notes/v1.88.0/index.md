---
title: "v1.88.0 - Claude Opus 4.8, MCP 存取群組授權與型別化 OpenTelemetry"
slug: "v1-88-0"
date: 2026-06-04T18:45:10
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

## 部署此版本 {#deploy-this-version}

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="docker" label="Docker">

```bash
docker run \
-e STORE_MODEL_IN_DB=True \
-p 4000:4000 \
docker.litellm.ai/berriai/litellm:1.88.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.88.0
```

</TabItem>
</Tabs>

## 重點摘要 {#key-highlights}

`v1.88.0` 是穩定版，已從 `v1.88.0` 發行候選版升級而來。

- **Claude Opus 4.8** 已在 Anthropic、Bedrock（包含 `global` / `us` / `eu` / `au` 區域路由）、Azure AI 與 Vertex 上支援，具備 1M token 上下文、自適應思考與 `output_config` goal mode。
- **MCP 存取群組授權** 已端到端重新設計：金鑰與團隊存取群組現在會解析到 MCP 伺服器，授權採加總式並支援選擇性成員指派，且用戶端可透過具狀態或無狀態的 session 依 session id 路由。
- **型別化 OpenTelemetry instrumentation** 推出與 semconv 對齊的 span 模型，會在 inference spans 上攜帶 `team_metadata`、`http.route` 與模型名稱。
- **串流在每個 chunk 上約便宜 30%**，適用於 Anthropic 與 Bedrock 的 hot path。
- **Agent-to-agent (A2A)** 新增 well-known agent-card discovery 與 LangGraph Platform mode。

## 新模型 / 更新模型 {#new-models--updated-models}

#### 新模型支援（Claude Opus 4.8，涵蓋 9 個提供者路由） {#new-model-support-claude-opus-48-across-9-provider-routes}

| 提供者 | 模型 | 上下文視窗 | 輸入（每 1M tokens 美元） | 輸出（每 1M tokens 美元） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Anthropic | `claude-opus-4-8` | 1,000,000 | $5.00 | $25.00 | Vision、function calling、prompt caching、reasoning（adaptive + max/xhigh effort）、PDF input、computer use、response schema、tool choice、output_config |
| Vertex AI | `vertex_ai/claude-opus-4-8` | 1,000,000 | $5.00 | $25.00 | 與 Anthropic direct 相同 |
| Azure AI | `azure_ai/claude-opus-4-8` | 200,000 | $5.00 | $25.00 | 與 Anthropic direct 相同 |
| Bedrock | `anthropic.claude-opus-4-8`（+ `global.` / `us.` / `eu.` / `au.` routes） | 1,000,000 | $5.00 | $25.00 | 相同，另加原生結構化輸出 |

另外，針對既有 Claude 目錄項目進行 reasoning-effort 標誌清理：移除不支援的 `supports_minimal_reasoning_effort`、統一 `supports_max_reasoning_effort`，並在 Bedrock 項目新增 `bedrock_output_config_effort_ceiling`（`high` / `xhigh` / `max`）欄位 - [PR #29238](https://github.com/BerriAI/litellm/pull/29238)。

#### 功能 {#features}

- **[Anthropic](https://docs.litellm.ai/docs/providers/anthropic)**
    - 新增 Claude Opus 4.8 並清理過時的 reasoning-effort 標誌 - [PR #29238](https://github.com/BerriAI/litellm/pull/29238)
- **[Bedrock](https://docs.litellm.ai/docs/providers/bedrock)**
    - 透過 `output_config` 在 Bedrock Opus 上啟用 Claude Code goal mode - [PR #28898](https://github.com/BerriAI/litellm/pull/28898)
    - 支援工具搜尋結果與聊天註解 - [PR #29120](https://github.com/BerriAI/litellm/pull/29120)

#### 錯誤修正 {#bug-fixes}

- **[Anthropic](https://docs.litellm.ai/docs/providers/anthropic)**
    - 停止為 Sonnet/Opus 4.6 上的 Claude Code 注入不支援的 `output_config.effort=xhigh` - [PR #29304](https://github.com/BerriAI/litellm/pull/29304)
- **[Vertex AI](https://docs.litellm.ai/docs/providers/vertex)**
    - 為會拒絕 `output_config.effort` 的 Vertex Claude 模型移除它（Haiku 4.5） - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)
- **[Bedrock](https://docs.litellm.ai/docs/providers/bedrock)**
    - 對齊 `toolUse` / `toolSpec` 名稱並允許連字號 - [PR #28874](https://github.com/BerriAI/litellm/pull/28874)
- **[Azure](https://docs.litellm.ai/docs/providers/azure)**
    - 在 v1 OpenAI client 路徑中保留 AD token refresh - [PR #28627](https://github.com/BerriAI/litellm/pull/28627)
- **[OpenAI](https://docs.litellm.ai/docs/providers/openai)**
    - 修正模型名稱上的雙重 provider-prefix 錯誤 - [PR #28661](https://github.com/BerriAI/litellm/pull/28661)
- **一般**
    - 填充萬用字元模型探索憑證 - [PR #28284](https://github.com/BerriAI/litellm/pull/28284)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **[Realtime API](https://docs.litellm.ai/docs/realtime)**
    - Gemini 與 Vertex AI live API 的工具呼叫 - [PR #26590](https://github.com/BerriAI/litellm/pull/26590)
- **[A2A](https://docs.litellm.ai/docs/a2a)**
    - well-known agent-card discovery 與 LangGraph Platform mode - [PR #28860](https://github.com/BerriAI/litellm/pull/28860)
- **內容管理**
    - `compact_20260112` polyfill，讓非 Anthropic 提供者取得 context compaction - [PR #28868](https://github.com/BerriAI/litellm/pull/28868)
- **影片**
    - Vertex Veo 影片編輯，在 video handlers 中使用 DB 憑證 - [PR #29098](https://github.com/BerriAI/litellm/pull/29098)
- **透傳**
    - 將 `passthrough_managed_object_ids` 延伸至 Azure - [PR #29160](https://github.com/BerriAI/litellm/pull/29160)

#### 錯誤 {#bugs}

- **[Realtime API](https://docs.litellm.ai/docs/realtime)**
    - 傳送 TEXT frames 與有效的 guardrail `session.update` - [PR #28848](https://github.com/BerriAI/litellm/pull/28848)
- **[Moderations](https://docs.litellm.ai/docs/moderation)**
    - 將串流標誌傳遞至統一 dispatcher - [PR #27324](https://github.com/BerriAI/litellm/pull/27324)
- **[Batches](https://docs.litellm.ai/docs/batches)**
    - 從 OpenAI batch metadata 移除 LiteLLM policy tracking - [PR #28425](https://github.com/BerriAI/litellm/pull/28425)
    - 將已移除的 batch `body.model` 映射回 proxy alias 以供授權 - [PR #29264](https://github.com/BerriAI/litellm/pull/29264)
- **向量儲存**
    - 將向量儲存索引的建立/刪除限制為 proxy 管理員 - [PR #29202](https://github.com/BerriAI/litellm/pull/29202)
- **影片**
    - 解決授權用的託管影片模型 ids - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- **透傳**
    - Bedrock Knowledge Base 透傳：保留 SigV4 標頭與已簽署的 request body - [PR #27526](https://github.com/BerriAI/litellm/pull/27526)
    - 強制 `allowed_passthrough_routes` 用於 `auth=true` 透傳 - [PR #29256](https://github.com/BerriAI/litellm/pull/29256)
    - 去重透傳端點記錄 - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)
    - 當設定 `SERVER_ROOT_PATH` 時，讓透傳 registry routes 的 bare-to-bare 相符，修正透傳 404 - [PR #29658](https://github.com/BerriAI/litellm/pull/29658)

## 管理端點 / UI {#management-endpoints--ui}

#### 功能 {#features-2}

- **虛擬金鑰與團隊**
    - 在 `keys_count` 上公開 `/v2/team/list`，並連接 UI Resources 徽章 - [PR #28502](https://github.com/BerriAI/litellm/pull/28502)
    - 允許團隊成員在組織範圍團隊上建立金鑰 - [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
    - 讓 UI 與 CLI session tokens 不計入團隊金鑰預算上限，並加強防護，使自訂 `default_key_generate_params` 無法重新套用這些限制 - [PR #29612](https://github.com/BerriAI/litellm/pull/29612), [PR #29639](https://github.com/BerriAI/litellm/pull/29639)
    - 記錄 service-account 金鑰的擁有權，外加 Prisma JSON 序列化修正 - [PR #28990](https://github.com/BerriAI/litellm/pull/28990)
- **部署**
    - Helm：拆分 gateway、backend 與 UI 的每個元件 ServiceAccounts - [PR #28712](https://github.com/BerriAI/litellm/pull/28712)
    - Enterprise：供自架 Resend 傳送使用的 `RESEND_FROM_EMAIL` - [PR #28830](https://github.com/BerriAI/litellm/pull/28830)

#### 錯誤 {#bugs-1}

- **虛擬金鑰與團隊**
    - 在 `team_model_add` / `team_model_delete` 上重新整理團隊快取 - [PR #28683](https://github.com/BerriAI/litellm/pull/28683)
    - 在 `_cache_team_object` 寫入時，讓 `team_alias` 快取保持同步 - [PR #28737](https://github.com/BerriAI/litellm/pull/28737)
    - 修正 spend-logs v2 路由權限 - [PR #28705](https://github.com/BerriAI/litellm/pull/28705)
    - 在 safe-hash helper 中標準化 Bearer 前綴 - [PR #29343](https://github.com/BerriAI/litellm/pull/29343)
- **介面**
    - 允許清除萬用字元模型上的自訂定價 - [PR #28719](https://github.com/BerriAI/litellm/pull/28719)
    - 停止 `vertex_ai-anthropic_models` 洩漏到 Anthropic 下拉選單中 - [PR #28723](https://github.com/BerriAI/litellm/pull/28723)
    - 將 API Reference 路由回查詢參數頁面 - [PR #28726](https://github.com/BerriAI/litellm/pull/28726)
    - 在金鑰總覽上顯示 `max_budget` 的小數點後 2 位精度 - [PR #28809](https://github.com/BerriAI/litellm/pull/28809)
    - 解決開發與 proxy origin 之間的登出重新導向迴圈 - [PR #29360](https://github.com/BerriAI/litellm/pull/29360)
    - 內部重構：將驗證狀態抽出至 `AuthContext`，移除已無用的 App Router 支架 - [PR #28910](https://github.com/BerriAI/litellm/pull/28910), [PR #28891](https://github.com/BerriAI/litellm/pull/28891)

## AI 整合 {#ai-integrations}

### 記錄 {#logging}

- **[DataDog](https://docs.litellm.ai/docs/proxy/logging#datadog)**
    - 排空成本管理佇列，並新增一個可選加入的 FinOps 標籤允許清單 - [PR #28487](https://github.com/BerriAI/litellm/pull/28487)
- **Galileo**
    - 支援代管的 v2 spans API 與字串輸出擷取 - [PR #28771](https://github.com/BerriAI/litellm/pull/28771)
- **[OpenTelemetry](https://docs.litellm.ai/docs/proxy/logging#opentelemetry)**
    - 型別化、與 semconv 對齊的 instrumentation - [PR #28909](https://github.com/BerriAI/litellm/pull/28909)
    - 將 `team_metadata`、`http.route` 與模型名稱加入 inference spans - [PR #29319](https://github.com/BerriAI/litellm/pull/29319)
    - 在 management-endpoint 成功時匯出 SERVER span，而不帶 `http_request` - [PR #28794](https://github.com/BerriAI/litellm/pull/28794)
    - 將 pass-through 成功 spans 連結到 SERVER root span - [PR #29315](https://github.com/BerriAI/litellm/pull/29315)
- **一般**
    - 從其自身的 body snapshot 中排除 `proxy_server_request` - [PR #28618](https://github.com/BerriAI/litellm/pull/28618)
    - 修正重複的 Claude Code traces - [PR #29311](https://github.com/BerriAI/litellm/pull/29311)

### 防護欄 {#guardrails}

- **一般**
    - 對 LiteLLM 內容過濾封鎖回傳 HTTP 400 - [PR #28418](https://github.com/BerriAI/litellm/pull/28418)
    - 將 `apply_guardrail` 接入 proxy 記錄回呼 - [PR #28970](https://github.com/BerriAI/litellm/pull/28970)
    - 在金鑰上持久化 `disable_global_guardrails` - [PR #29233](https://github.com/BerriAI/litellm/pull/29233)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **成本追蹤** — [OpenAI](https://docs.litellm.ai/docs/providers/openai) 針對 EU/US 資料駐留的區域處理成本上調 - [PR #28626](https://github.com/BerriAI/litellm/pull/28626)
- **速率限制** — 將無 `max_tokens` 的 TPM 下限上限設為已設定的最小限制（v3 limiter） - [PR #28805](https://github.com/BerriAI/litellm/pull/28805)
- **預算** — 強制套用金鑰層級標籤的標籤預算 - [PR #29108](https://github.com/BerriAI/litellm/pull/29108)
- **預算** — 強制套用動態新增模型的部署預算 - [PR #29273](https://github.com/BerriAI/litellm/pull/29273)
- **預算** — `reset_budget` 只會寫入 `{spend, budget_reset_at}`，並停止在前置階段將計數器歸零 - [PR #29358](https://github.com/BerriAI/litellm/pull/29358)

## MCP 閘道 {#mcp-gateway}

- **工作階段路由** — 透過 session-id 路由支援無狀態與有狀態用戶端 - [PR #26857](https://github.com/BerriAI/litellm/pull/26857)
- **存取群組** — 具備可選成員指派的加成式金鑰存取群組授權 - [PR #29313](https://github.com/BerriAI/litellm/pull/29313)
- **存取群組** — 將團隊 `access_group_ids` 解析至 MCP servers - [PR #28997](https://github.com/BerriAI/litellm/pull/28997)
- **存取群組** — 將金鑰 `access_group_ids` 解析至 MCP servers（未設門檻） - [PR #29195](https://github.com/BerriAI/litellm/pull/29195)
- **存取群組** — 將金鑰存取群組聯集擴充至 MCP servers - [PR #28890](https://github.com/BerriAI/litellm/pull/28890)
- **探索** — 允許 `llm_api_routes` 虛擬金鑰列出 MCP servers - [PR #28442](https://github.com/BerriAI/litellm/pull/28442)
- **Server CRUD** — 在 `GET /v1/mcp/server` 清單回應中保留 `source_url` - [PR #29249](https://github.com/BerriAI/litellm/pull/29249)
- **Server CRUD** — 在 `PUT /v1/mcp/server` 部分更新中保留省略欄位 - [PR #29253](https://github.com/BerriAI/litellm/pull/29253)
- **虛擬金鑰** — 在儲存金鑰時忽略過時的 ids - [PR #29128](https://github.com/BerriAI/litellm/pull/29128)

## 效能／負載平衡／可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **串流熱路徑** — 在 Anthropic 與 Bedrock 串流路徑上，每個 chunk 的額外負擔降低約 30% - [PR #28720](https://github.com/BerriAI/litellm/pull/28720)
- **Docker** — 在元件化 builders 中使用系統 Node，並重試 `apk add` - [PR #28888](https://github.com/BerriAI/litellm/pull/28888)
- **相依套件** — 例行的相依套件升級，包括一項 Starlette bad-host 修正 - [PR #29208](https://github.com/BerriAI/litellm/pull/29208), [PR #29373](https://github.com/BerriAI/litellm/pull/29373)

## 文件更新 {#documentation-updates}

- 手寫的 `CLAUDE.md`；移除 `AGENTS.md` 並將 `GEMINI.md` 指向它 - [PR #29252](https://github.com/BerriAI/litellm/pull/29252)
- 代理程式指引：在寫入新的第三方名稱前先要求同意 - [PR #28908](https://github.com/BerriAI/litellm/pull/28908)
- Cookbook：在 gollem 範例中將 Go directive 升級至 1.26.3 - [PR #29234](https://github.com/BerriAI/litellm/pull/29234)

## 一般 Proxy 改進 {#general-proxy-improvements}

測試、CI 與建置強化：

- 跨角色與流程的 UI e2e 覆蓋範圍 — Team-BYOK add-model、Router fallback、MCP add-server、AI Hub make-public、Team Admin、Internal User / Viewer、logout 與 navbar identity - [PR #29068](https://github.com/BerriAI/litellm/pull/29068), [PR #29069](https://github.com/BerriAI/litellm/pull/29069), [PR #29070](https://github.com/BerriAI/litellm/pull/29070), [PR #29071](https://github.com/BerriAI/litellm/pull/29071), [PR #29072](https://github.com/BerriAI/litellm/pull/29072), [PR #29074](https://github.com/BerriAI/litellm/pull/29074), [PR #29075](https://github.com/BerriAI/litellm/pull/29075), [PR #29076](https://github.com/BerriAI/litellm/pull/29076), [PR #29077](https://github.com/BerriAI/litellm/pull/29077), [PR #29080](https://github.com/BerriAI/litellm/pull/29080), [PR #29083](https://github.com/BerriAI/litellm/pull/29083), [PR #28652](https://github.com/BerriAI/litellm/pull/28652)
- 穿透式 `SERVER_ROOT_PATH` login-redirect trailing-slash e2e - [PR #29369](https://github.com/BerriAI/litellm/pull/29369)
- `proxy_server.py` 的行為鎖定 harnesses - [PR #28827](https://github.com/BerriAI/litellm/pull/28827), [PR #29309](https://github.com/BerriAI/litellm/pull/29309)
- 用於 VCR 的可重現 Redis cassette replay 與即時 Google OAuth token minting - [PR #28826](https://github.com/BerriAI/litellm/pull/28826), [PR #29229](https://github.com/BerriAI/litellm/pull/29229)
- 覆蓋跨提供者路由的 Claude Opus 4.8 reasoning-effort grid test - [PR #29327](https://github.com/BerriAI/litellm/pull/29327)
- Bedrock CI 帳號搬移與還原 - [PR #28728](https://github.com/BerriAI/litellm/pull/28728), [PR #29326](https://github.com/BerriAI/litellm/pull/29326), [PR #29245](https://github.com/BerriAI/litellm/pull/29245)
- 維持 `litellm_internal_staging` 綠燈 - [PR #29344](https://github.com/BerriAI/litellm/pull/29344)
- 使用 `trailingSlash: true` 重新產生 admin-ui 靜態匯出 - [PR #28112](https://github.com/BerriAI/litellm/pull/28112)

### 依所有權區域彙整 PR {#pr-roll-up-by-ownership-area}

依所有權區域分類的 PR（總計：97）
  - 其他（CI / tests / build hardening）：23
  - UI / 驗證與管理：18
  - LLM API 端點：15
  - MCP：9
  - 模型與提供者：9
  - 記錄：8
  - 支出／預算／速率限制：5
  - 效能：4
  - 文件：3
  - 防護欄：3

## 發行候選版本變更記錄（rc.1 → rc.2 → rc.3） {#release-candidate-changelog-rc1--rc2--rc3}

上方幾乎全部都已在 **rc.1** 中發布。後續候選版本是透過 cherry-pick 切出的少量、針對性修補。

**rc.2** 新增了六項修正：

- 解析用於驗證的代管 video model ids - [PR #29545](https://github.com/BerriAI/litellm/pull/29545)
- 允許團隊成員在 org-scoped teams 上建立金鑰 - [PR #29310](https://github.com/BerriAI/litellm/pull/29310)
- 為 Vertex Claude Haiku 4.5 移除 `output_config.effort` - [PR #29585](https://github.com/BerriAI/litellm/pull/29585)
- 去重 pass-through 端點記錄 - [PR #29598](https://github.com/BerriAI/litellm/pull/29598)
- 讓 UI/CLI session tokens 豁免於團隊金鑰預算上限 - [PR #29612](https://github.com/BerriAI/litellm/pull/29612)
- 強化該豁免以對抗自訂 `default_key_generate_params` - [PR #29639](https://github.com/BerriAI/litellm/pull/29639)

**rc.3** 新增了一項修正：

- 當 `SERVER_ROOT_PATH` 已設定時，將 pass-through registry routes 配對為 bare-to-bare，修正 pass-through 404 - [PR #29658](https://github.com/BerriAI/litellm/pull/29658)

## 新貢獻者 {#new-contributors}

此版本沒有新增貢獻者；全部 11 位作者都是回歸貢獻者。

**完整變更記錄**：https://github.com/BerriAI/litellm/compare/v1.87.0...v1.88.0

---

## 06/04/2026 (`v1.88.0`) {#06042026-v1880}

* 新模型 / 更新後的模型：9
* LLM API 端點：15
* 管理端點 / UI：18
* AI 整合（記錄 / 防護欄）：11
* 支出追蹤、預算與速率限制：5
* MCP 閘道：9
* 效能 / 負載平衡 / 可靠性改善：4
* 一般 Proxy 改善（測試 / CI / 建置）：23
* 文件更新：3

總計：97 個 PR
