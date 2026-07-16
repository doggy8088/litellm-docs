---
title: "v1.86.0 - 加權路由備援、原生 Web 搜尋引用與 OTel 標準追蹤"
slug: "v1-86-0"
date: 2026-05-16T00:00:00
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
docker.litellm.ai/berriai/litellm:1.86.0
```

</TabItem>
<TabItem value="pip" label="Pip">

```bash
pip install litellm==1.86.0
```

</TabItem>
</Tabs>

## 主要亮點 {#key-highlights}

- **加權路由備援** — 當部署失敗時，路由器現在會在 *不同* 的部署上重試相同的模型群組（例如另一個 Azure 區域），同時首次選擇仍會遵守已設定的權重，並由路由器層級旗標控制。
- **Anthropic 用戶端的原生 web-search 引用** — LiteLLM 現在會輸出原生 `web_search_tool_result` 區塊，讓 Claude Desktop / Cowork 能正確呈現 web-search 引用。
- **符合 OTel 標準的 server span 屬性** — proxy 的 SERVER span 現在包含 `http.response.status_code`、`http.route`、`url.path` 與 `litellm.preprocessing.duration_ms`，並提供實驗性 OTEL GenAI 語意慣例的選用開關。
- **元件化部署** — 可附加的骨架與 Helm chart，可將單體 proxy 拆分為可獨立擴充的 `gateway`、`backend` 與 `ui` 服務。
- **修正重大 rate-limit 迴歸問題** — v3 limiter 會將內部保留金鑰洩漏到上游提供者本文中，導致帶有 `tpm_limit` / `rpm_limit` 設定的 *所有* virtual key 都失效。

## Claude Code 相容性涵蓋範圍 {#claude-code-compatibility-coverage}

我們擴充了 LiteLLM 每日自動測試的 Claude Code 功能集合，並在 [Claude Code 相容性文件](https://docs.litellm.ai/docs/claude_code_compatibility) 中新增「已知問題」區段，讓客戶能在進入正式環境前，先看到哪些組合是紅燈，以及原因。

這是對客戶針對穩定性與迴歸問題回饋的直接回應。此矩陣由嚴謹的端對端測試套件支撐，會直接命中真實提供者端點，不使用模擬。該套件每天重新執行，文件會呈現最新的 LiteLLM 穩定版對上最新的 Claude Code 版本。

<Image img={require('../../img/release_notes/claude_code_compat_matrix.png')} style={{ width: '800px', height: 'auto' }} />

今日涵蓋率在 Anthropic、Bedrock Invoke、Bedrock Converse、Vertex AI 與 Azure Foundry 間達到 76%。接下來一週，我們計畫將其提升到 90%。很快地，同一套測試也會用來把關 PR：任何由綠轉紅的格子都會使檢查失敗並阻止合併到 staging，讓會破壞 Claude Code 的程式碼更難進入下一版發布。

## 新模型 / 已更新模型 {#new-models--updated-models}

#### 新模型支援 {#new-model-support}

| 提供者 | 模型 | 上下文視窗 | 輸入（$/百萬 tokens） | 輸出（$/百萬 tokens） | 功能 |
| --- | --- | --- | --- | --- | --- |
| Bedrock | `jp.anthropic.claude-sonnet-4-6` | 1,000,000 | $3.30 | $16.50 | Prompt 快取、reasoning、vision、function calling、PDF input、computer use |
| Azure AI | `azure_ai/gpt-5.4` | 1,050,000 | $2.50 | $15.00 | Reasoning、vision、web search、function calling、prompt 快取、service tier |
| Azure AI | `azure_ai/gpt-5.4-pro` | 1,050,000 | $30.00 | $180.00 | Responses-mode、reasoning、vision、web search、prompt 快取 |
| Azure AI | `azure_ai/gpt-5.4-mini` | 400,000 | $0.75 | $4.50 | Reasoning、vision、web search、function calling、prompt 快取 |
| Azure AI | `azure_ai/gpt-5.4-nano` | 400,000 | $0.20 | $1.25 | Reasoning、vision、web search、function calling、prompt 快取 |

每個 Azure AI GPT-5.4 模型也隨附一個帶日期的 snapshot 別名（`gpt-5.4-2026-03-05`、`gpt-5.4-pro-2026-03-05`、`gpt-5.4-mini-2026-03-17`、`gpt-5.4-nano-2026-03-17`）— 總計 9 筆 catalog 項目。所有 GPT-5.4 項目都包含分級（`>272k`）與優先價格。

#### 功能 {#features}

- **[Azure AI](https://docs.litellm.ai/docs/providers/azure_ai)**
    - 新增 Azure AI Foundry GPT-5.4 模型中繼資料（gpt-5.4 / pro / mini / nano + 帶日期別名） - [PR #28030](https://github.com/BerriAI/litellm/pull/28030)
- **[Bedrock](https://docs.litellm.ai/docs/providers/bedrock)**
    - 為 `claude-sonnet-4-6` 新增 `jp.` 跨區域推論設定檔 - [PR #27976](https://github.com/BerriAI/litellm/pull/27976)

#### 錯誤修正 {#bug-fixes}

- **[Bedrock](https://docs.litellm.ai/docs/providers/bedrock)**
    - bedrock-mantle：為 Mantle（Claude Mythos Preview）端點使用 `/anthropic/v1/messages` 路徑——`/v1/messages` 先前對每個 Mantle 請求都回 404 - [PR #27976](https://github.com/BerriAI/litellm/pull/27976)

## LLM API 端點 {#llm-api-endpoints}

#### 功能 {#features-1}

- **Anthropic Messages API（`/v1/messages`）**
    - 為 Anthropic 用戶端（Claude Desktop / Cowork citations）輸出原生 `web_search_tool_result` 區塊 - [PR #27886](https://github.com/BerriAI/litellm/pull/27886)
- **[向量儲存](https://docs.litellm.ai/docs/vector_stores)**
    - 修正未設定 completion model 時的 vector store retrieve/list/update/delete；並在這些路由上將 URL query 參數合併進 request data - [PR #27929](https://github.com/BerriAI/litellm/pull/27929)

#### 錯誤 {#bugs}

- **[批次 API](https://docs.litellm.ai/docs/batches)**
    - Managed batches：在 `CheckBatchCost` poller 中將原始提供者 `output_file_id` 轉換為 managed ID，讓 `GET /files/{id}/content` 能正確解析路由 - [PR #27984](https://github.com/BerriAI/litellm/pull/27984)

## 管理端點 / UI {#management-endpoints--ui}

#### 錯誤 {#bugs-1}

- **驗證 / OAuth**
    - 在 OAuth 設定中允許 allowlist 的 redirect URI - [PR #27761](https://github.com/BerriAI/litellm/pull/27761)
- **設定**
    - 讓 `/config/update` 環境變數加密具備冪等性（修正重複更新時的雙重加密）＋端點層級迴歸測試 - [PR #28022](https://github.com/BerriAI/litellm/pull/28022)
- **模型 + 端點**
    - 在 `/v2/model/info` 中依顯示名稱對 BYOK 模型排序 - [PR #28079](https://github.com/BerriAI/litellm/pull/28079)

## AI 整合 {#ai-integrations}

#### 記錄 {#logging}

- **[OpenTelemetry](https://docs.litellm.ai/docs/proxy/logging#opentelemetry)**
    - proxy 的 SERVER span 採用 OTel 標準屬性：`http.response.status_code`、`http.route`、`url.path`、`litellm.preprocessing.duration_ms` - [PR #28040](https://github.com/BerriAI/litellm/pull/28040)
    - 在成功的 SERVER span 上設定 `http.response.status_code`（不僅限於錯誤 span） - [PR #28090](https://github.com/BerriAI/litellm/pull/28090)
    - 對實驗性 OTEL GenAI 語意慣例（`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`）提供選用支援；預設行為維持不變 - [PR #27418](https://github.com/BerriAI/litellm/pull/27418)

#### 防護欄 {#guardrails}

- **[Lasso](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)**
    - 為 LassoGuardrail 新增 tool-calling 支援（將 `tool_calls` / `role=tool` 擴展為 Lasso `tool_use` / `tool_result` 區塊；映射工具定義） - [PR #27648](https://github.com/BerriAI/litellm/pull/27648)
- **[CrowdStrike AIDR](https://docs.litellm.ai/docs/proxy/guardrails/quick_start)**
    - 改善 CrowdStrike AIDR 輸入處理 - [PR #26658](https://github.com/BerriAI/litellm/pull/26658)

#### 密鑰管理器 {#secret-managers}

- **一般**
    - 在執行階段匯入 `get_secret`，以避免 import-time 的排序錯誤 - [PR #28014](https://github.com/BerriAI/litellm/pull/28014)

## 支出追蹤、預算與速率限制 {#spend-tracking-budgets-and-rate-limiting}

- **速率限制** — 停止 v3 limiter 將內部保留金鑰（`_litellm_rate_limit_descriptors`、`_litellm_tpm_reserved_*`）洩漏到上游提供者本文中；此迴歸問題讓帶有 `tpm_limit`/`rpm_limit` 的 **所有** virtual key 都失效 - [PR #27913](https://github.com/BerriAI/litellm/pull/27913)
- **預算** — 強化預算欄位驗證，並在使用者自我更新／金鑰生成路徑上新增缺少的授權檢查 - [PR #27897](https://github.com/BerriAI/litellm/pull/27897)
- **成本追蹤** — 修正已完成 Vertex AI 批次作業的零成本／零用量問題（檔案內容在 #25627 之後現已為 OpenAI 樣式；舊程式碼讀取過時的 `usageMetadata.*`） - [PR #27912](https://github.com/BerriAI/litellm/pull/27912)

## MCP 閘道 {#mcp-gateway}

- 針對**內部**（`available_on_public_internet: false`）oauth2 互動式 MCP 伺服器提供 Delegate-auth PKCE 規避——與公開伺服器相同的匿名 PKCE 路徑；`client_credentials` 排除條件維持不變 - [PR #27977](https://github.com/BerriAI/litellm/pull/27977)
- 在 `GET /v1/mcp/server` 清單 API 中公開 `delegate_auth_to_upstream`（`_build_mcp_server_table` 會將其移除，因此儀表板總是顯示 `false`） - [PR #27936](https://github.com/BerriAI/litellm/pull/27936)

## 效能 / 負載平衡 / 可靠性改善 {#performance--loadbalancing--reliability-improvements}

- **加權路由故障切換** — 發生失敗時，在不同部署上重試相同的模型群組，同時初始選擇會尊重已設定的權重；透過路由器層級的旗標控制 - [PR #27980](https://github.com/BerriAI/litellm/pull/27980)
- **Chat-completions 快速路徑** — 快取一次回呼能力，而不是每個請求都重新掃描 `litellm.callbacks`；當沒有回呼需要它時，略過 streaming-iterator 包裝 - [PR #27858](https://github.com/BerriAI/litellm/pull/27858)
- **元件化部署** — 附加式 `gateway/`、`backend/`、`ui/` Dockerfiles + Helm chart（每個元件各自有 Deployment/Service/HPA，不變更現有模組） - [PR #27557](https://github.com/BerriAI/litellm/pull/27557)
- **Terraform stacks** — 用於部署元件化 gateway 的 AWS ECS + GCP Cloud Run stacks - [PR #27673](https://github.com/BerriAI/litellm/pull/27673)

## 一般 Proxy 改善 {#general-proxy-improvements}

測試、CI 與建置硬化：

- VCR 快取可觀測性：分類快取判定、偵測即時請求、顯示成本洩漏、彙總 xdist worker 統計；Bedrock hostname / RFC1918 修正 - [PR #27795](https://github.com/BerriAI/litellm/pull/27795)
- reasoning-effort grid e2e 回歸測試套件（狀態依 exception `status_code` 分類）；Fireworks / Gemini 測試改為 mock，而非即時測試 - [PR #28036](https://github.com/BerriAI/litellm/pull/28036)
- 在 CI 測試與設定中現代化模型參照 - [PR #27856](https://github.com/BerriAI/litellm/pull/27856)
- Codecov：旗標上傳、啟用 carryforward、修補涵蓋率缺口；`--cov=./litellm` 路徑解析 - [PR #28028](https://github.com/BerriAI/litellm/pull/28028), [PR #27960](https://github.com/BerriAI/litellm/pull/27960)
- mutmut：啟用 `mutate_only_covered_lines` 以符合 CI 預算 - [PR #27910](https://github.com/BerriAI/litellm/pull/27910)
- 移除未使用的 GitHub Actions workflows 與孤立檔案 - [PR #27957](https://github.com/BerriAI/litellm/pull/27957)
- 在每個檔案的 `@tremor/react` `vi.mock` 中保留全域 Button/Tooltip mock（UI tests） - [PR #27958](https://github.com/BerriAI/litellm/pull/27958)
- 將 `run_server` CLI tests 與 Prisma DB 設定流程分離 - [PR #28029](https://github.com/BerriAI/litellm/pull/28029)
- 依據 Interaction schema 驗證回應欄位 - [PR #28037](https://github.com/BerriAI/litellm/pull/28037)
- 修正 `test_gemini_image_size_limit_exceeded` 的不穩定性 - [PR #28039](https://github.com/BerriAI/litellm/pull/28039)
- 在 `uv.lock` 中釘選 `openai==2.33.0` - [PR #28088](https://github.com/BerriAI/litellm/pull/28088)

## 新貢獻者 {#new-contributors}

- @vladpolevoi 完成了他們的第一次貢獻於 [#27648](https://github.com/BerriAI/litellm/pull/27648)

**完整變更記錄**: https://github.com/BerriAI/litellm/compare/v1.85.0...v1.86.0

---

## 05/16/2026 (`v1.86.0`) {#05162026-v1860}

* 新模型 / 已更新模型：2
* LLM API 端點：3
* 管理端點 / UI：3
* AI 整合（記錄 / 防護欄 / 密鑰管理員）：6
* 花費追蹤、預算與速率限制：3
* MCP 閘道：3
* 效能 / 負載平衡 / 可靠性改善：4
* 一般 Proxy 改善（測試 / CI / 建置）：12
* 文件更新：0

總計：36 個 PR
