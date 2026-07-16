import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vantage {#vantage}

LiteLLM 可以將 proxy 支出資料匯出至 [Vantage](https://vantage.sh)，並以 [FOCUS 1.2](https://focus.finops.org/) 格式的成本報表呈現。這讓您能在 Vantage 儀表板中，將 LLM 支出與雲端基礎架構成本一併視覺化。

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 目的地 | 將 LiteLLM 使用資料匯出至 Vantage Custom Provider |
| 資料格式 | FOCUS CSV（由 LiteLLM 支出資料自動轉換） |
| 支援的操作 | 手動匯出、自動排程匯出（每小時/每日/固定間隔） |
| 驗證 | Vantage API 金鑰 + Custom Provider token |

## 必要條件 {#prerequisites}

您需要從 [Vantage 主控台](https://console.vantage.sh) 取得兩組憑證：

1. **API Key** — 前往 **Settings → API Access Tokens** → 建立具備 **Write** 範圍的 token。該 token 會像 `vntg_tkn_...`。
2. **Custom Provider Token** — 前往 **Settings → Integrations** → 建立 **Custom Provider** 整合 → 複製 Provider ID（看起來像 `accss_crdntl_...`）。

## 透過 API 設定 {#setup-via-api}

建議的設定方式是使用 proxy 管理端點。不需要變更設定檔。

### 1. 初始化憑證 {#1-initialize-credentials}

```bash
curl -X POST http://localhost:4000/vantage/init \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "vntg_tkn_YOUR_VANTAGE_API_KEY",
    "integration_token": "accss_crdntl_YOUR_PROVIDER_TOKEN"
  }'
```

憑證會加密後儲存在 proxy 資料庫中。

### 2. 預覽資料（dry run） {#2-preview-data-dry-run}

```bash
curl -X POST http://localhost:4000/vantage/dry-run \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

這會回傳經 FOCUS 轉換的資料，但不會向 Vantage 傳送任何內容。可用來驗證管線是否正常運作，並檢視資料對應。

### 3. 匯出至 Vantage {#3-export-to-vantage}

```bash
curl -X POST http://localhost:4000/vantage/export \
  -H "Authorization: Bearer $LITELLM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

選用參數：
- `limit` — 要匯出的最大記錄數
- `start_time_utc` / `end_time_utc` — 依時間範圍篩選（必須同時提供）

### 4. 在 Vantage 中驗證 {#4-verify-in-vantage}

前往 **Settings → Integrations → 您的 Custom Provider → Import Costs** 分頁查看已上傳的 CSV。當狀態從「Importing and Processing」變更為「Stable」後，成本會顯示在 **Cost Reporting → All Resources** 中。

## 透過環境變數設定 {#setup-via-environment-variables}

若要自動排程匯出，請透過環境變數與 proxy 設定進行設定：

### 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `VANTAGE_API_KEY` | 是 | Vantage API 存取權杖 |
| `VANTAGE_INTEGRATION_TOKEN` | 是 | 來自 Vantage 儀表板的 Custom Provider token |
| `VANTAGE_BASE_URL` | 否 | API URL 覆寫（預設：`https://api.vantage.sh`） |
| `VANTAGE_EXPORT_FREQUENCY` | 否 | `hourly`（預設）、`daily`，或 `interval` |
| `VANTAGE_EXPORT_INTERVAL_SECONDS` | 否 | 當頻率為 `interval` 時，兩次匯出之間的秒數 |

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-your-key

litellm_settings:
  callbacks: ["vantage"]
```

```bash
export VANTAGE_API_KEY="vntg_tkn_..."
export VANTAGE_INTEGRATION_TOKEN="accss_crdntl_..."
litellm --config /path/to/config.yaml
```

proxy 會註冊一個背景工作，依照設定的排程匯出資料。

## API 端點 {#api-endpoints}

所有端點都需要管理員驗證。

| 方法 | 端點 | 說明 |
|--------|----------|-------------|
| `POST` | `/vantage/init` | 儲存 Vantage 憑證（已加密） |
| `GET` | `/vantage/settings` | 檢視目前設定（憑證已遮罩） |
| `PUT` | `/vantage/settings` | 更新憑證或 base URL |
| `POST` | `/vantage/dry-run` | 預覽 FOCUS 資料而不上傳 |
| `POST` | `/vantage/export` | 將成本資料上傳至 Vantage |
| `DELETE` | `/vantage/delete` | 移除憑證並停止排程匯出 |

## FOCUS 欄位對應 {#focus-field-mapping}

LiteLLM 支出資料會轉換為 FOCUS 1.2 schema：

| LiteLLM 欄位 | FOCUS 欄位 | 說明 |
|---------------|-------------|-------------|
| `spend` | BilledCost, EffectiveCost | 使用成本 |
| `model` | ChargeDescription, ResourceId | 模型識別碼 |
| `model_group` | ServiceName | 模型群組 / 部署 |
| `custom_llm_provider` | ProviderName, PublisherName | 提供者（openai、anthropic 等） |
| `api_key` | BillingAccountId | 雜湊化的 API 金鑰 |
| `api_key_alias` | BillingAccountName | 可讀的金鑰別名 |
| `team_id` | SubAccountId | 團隊識別碼 |
| `team_alias` | SubAccountName | 團隊名稱 |
| `organization_id` | Tags | 組織識別碼（從 API 金鑰或團隊解析而來） |
| `organization_alias` | Tags | 組織顯示名稱 |

其他中繼資料（`user_id`、`user_email`、`model`、`model_group` 等）也會以 JSON 形式包含在 `Tags` 欄位中。

## 上傳限制 {#upload-limits}

Vantage 會強制每次上傳的限制。LiteLLM 會自動處理這些限制：

- **10,000 列**／每次上傳 — 大型匯出會分割為多個批次
- **2 MB**／每次上傳 — 過大的批次會再依大小分割
- **不支援的欄位** 會在上傳前移除

## 相關連結 {#related-links}

- [Vantage](https://vantage.sh)
- [Vantage Custom Providers](https://docs.vantage.sh/connecting_custom_providers)
- [FOCUS Specification](https://focus.finops.org/)
- [Focus Export (S3/Parquet)](./focus.md)
