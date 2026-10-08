import Image from '@theme/IdealImage';

# Codex CLI - 細緻成本追蹤 {#codex-cli---granular-cost-tracking}

使用 LiteLLM proxy 依客戶或標籤追蹤 Codex CLI 使用情況。這可讓您為計費、預算與分析進行細緻的成本歸因。

## 運作方式 {#how-it-works}

Codex 會從 `~/.codex/config.toml` 讀取其組態。`[model_providers.<id>]` 區塊接受 `http_headers`（靜態值）與 `env_http_headers`（Codex 啟動時從環境變數讀取的值），而 Codex 會將這兩者附加到它送往 `base_url` 的每一個請求。這是 Claude Code 的 `ANTHROPIC_CUSTOM_HEADERS` 在 Codex 中的對應：把 LiteLLM 追蹤標頭放在那裡，每一次 `/v1/responses` 呼叫就會連同該客戶或那些標籤一起記錄到支出記錄中。

## 為何要設定客戶標頭 {#why-set-a-customer-header}

Codex 沒有可將最終使用者放進請求本文中的設定，因此若沒有標頭，其支出只會歸因於虛擬金鑰，而不會有其他資訊。在 `config.toml` 中放入一個標頭，就能讓每個請求都有一個最終使用者，並且讓每位客戶的預算、Logs 頁面的 End User 篩選器，以及 `/customer/info` 都能正常運作。標頭會先於任何請求本文欄位被檢查，因此您在此設定的值永遠優先。

## 選項 1：依客戶追蹤 {#option-1-track-by-customer}

用這個方式將成本歸因到特定客戶或最終使用者。`x-litellm-customer-id` 與 `x-litellm-end-user-id` 都會成為支出列的最終使用者。

```toml
model = "gpt-5.3-codex"
model_provider = "litellm"

[model_providers.litellm]
name = "LiteLLM"
base_url = "http://localhost:4000/v1"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
http_headers = { "x-litellm-end-user-id" = "alice" }
```

## 選項 2：依標籤追蹤 {#option-2-track-by-tags}

用這個方式將成本歸因到專案、成本中心或環境。傳入以逗號分隔的標籤，可單獨使用，或與同一提供者區塊中的客戶標頭一起使用。

```toml
[model_providers.litellm]
http_headers = { "x-litellm-customer-id" = "carol", "x-litellm-tags" = "project:onboarding,team:platform" }
```

## 選項 3：來自環境變數的每位開發者值 {#option-3-per-developer-value-from-an-environment-variable}

共用的 `config.toml` 無法硬編碼每位開發者的 id。`env_http_headers` 改為指定一個環境變數，因此檔案在各台機器上保持一致，而每位開發者在啟動 Codex 前都會執行 `export LITELLM_END_USER_ID=alice`。當該變數未設定或為空時，Codex 會省略該標頭。

```toml
[model_providers.litellm]
env_http_headers = { "x-litellm-end-user-id" = "LITELLM_END_USER_ID" }
```

## 選項 4：自訂標頭名稱 {#option-4-custom-header-name}

如果您的開發者已經帶有身分標頭，請在 proxy `config.yaml` 中的 `general_settings` 下為其命名，並使用 `user_header_name`，LiteLLM 也會將該標頭視為客戶 id。[客戶 id 優先順序表](../proxy/customers.md#1-make-llm-api-call-w-customer-id) 將 `user_header_mappings` 列為定義此類標頭的較新方式。

```yaml
general_settings:
  user_header_name: x-okta-user
```

```toml
[model_providers.litellm]
env_http_headers = { "x-okta-user" = "CODEX_OKTA_USER" }
```

## 快速開始 {#quick-start}

### 1. 設定並執行 Codex {#1-configure-and-run-codex}

將選項 1 的提供者區塊加入 `~/.codex/config.toml`，接著匯出您的 LiteLLM 金鑰並啟動 Codex。

```bash
export LITELLM_API_KEY=sk-<your-api-key>
codex
```

現在所有請求都會依該最終使用者 `alice` 進行追蹤。每一次 Codex 回合會發出兩個 `/v1/responses` 呼叫，而兩者都會被歸因，因此一個回合會顯示為兩筆支出列。

### 2. 在 LiteLLM UI 中檢視使用情況 {#2-view-usage-in-litellm-ui}

前往 LiteLLM UI 中的 **Logs** 分頁（`http://localhost:4000/ui/?page=logs`）。End User 欄會顯示每一筆 Codex 列上的標頭值，而 Tags 欄則會連同 LiteLLM 自行新增的 `User-Agent: codex-tui` 標籤一起顯示您的 `x-litellm-tags` 條目。

<Image img={require('../../img/codex_customer_tracking_logs.png')} />

開啟 **Filters** 並選取一個最終使用者，即可只查看該開發者的請求。點選某個請求可查看詳細資訊，包括模型、`aresponses` 呼叫類型與成本。

### 3. 查詢每位客戶的支出 {#3-query-spend-per-customer}

相同的列也可透過 API 取得。[`/customer/info?end_user_id=alice`](../proxy/customers.md#2-get-customer-spend) 會回傳該客戶的總支出，而 Enterprise [`/global/spend/report`](../proxy/cost_tracking.md#-enterprise-generate-spend-reports) 端點搭配 `group_by=customer` 可將支出依客戶與日期細分。

## 支援的標頭 {#supported-headers}

| 標頭 | 說明 |
|--------|-------------|
| `x-litellm-customer-id` | 依客戶/最終使用者 ID 追蹤 |
| `x-litellm-end-user-id` | 替代的客戶 ID 標頭 |
| `x-litellm-tags` | 用於成本歸因的逗號分隔標籤 |
| 由 `user_header_name` 命名的標頭 | 在 proxy 上設定的自訂客戶 ID 標頭 |

## 相關內容 {#related}

- [Claude Code - 細緻成本追蹤](./claude_code_customer_tracking.md)
- [將 Codex CLI 連接到 LiteLLM](../proxy/client_setup/codex_cli.md)
- [客戶預算](../proxy/customers.md)
- [標籤預算](../proxy/tag_budgets.md)
- [為程式設計工具追蹤使用量](./cost_tracking_coding.md)
