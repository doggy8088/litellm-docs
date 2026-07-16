# Mavvrik {#mavvrik}

LiteLLM 可將 proxy 的支出資料匯出至 [Mavvrik](https://mavvrik.ai)，作為 [FOCUS 1.2](https://focus.finops.org/) 格式的成本報表。這讓您能在 Mavvrik 成本管理平台中追蹤並分析 LLM 支出。

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 目的地 | 透過簽署的 URL 上傳，將 LiteLLM 使用資料匯出至 Mavvrik |
| 資料格式 | FOCUS CSV（gzip 壓縮，從 LiteLLM 支出資料自動轉換） |
| 支援的操作 | 自動每日匯出 |
| 驗證 | Mavvrik API 金鑰 + 連線 ID |

## 必要條件 {#prerequisites}

您需要從 Mavvrik 帳戶取得以下資訊：

1. **API Key** — 可在 Mavvrik 儀表板的 Settings 中取得。
2. **API Endpoint** — 您的租戶專屬 API URL，例如 `https://api.mavvrik.ai/<tenant_id>`。
3. **Connection ID** — 在您的 Mavvrik 帳戶中設定的 AI 成本連線 ID。

## 設定 {#setup}

### 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `MAVVRIK_API_KEY` | 是 | Mavvrik API 金鑰 |
| `MAVVRIK_API_ENDPOINT` | 是 | 租戶 API endpoint，例如 `https://api.mavvrik.ai/<tenant_id>` |
| `MAVVRIK_CONNECTION_ID` | 是 | AI 成本連線識別碼 |
| `MAVVRIK_FOCUS_MAX_ROWS` | 否 | 每日匯出的最大列數（預設：500000）。高流量部署可提高此值。 |

:::info 僅支援每日匯出
僅支援 `daily` 頻率。Mavvrik 擷取協定會為每個日曆日期（`metrics/YYYY-MM-DD`）儲存一個檔案。每小時或固定間隔匯出會在同一天內彼此覆寫，導致資料不完整。
:::

### Proxy 設定 {#proxy-config}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-your-key

litellm_settings:
  callbacks: ["mavvrik"]
```

```bash
export MAVVRIK_API_KEY="<your-api-key>"
export MAVVRIK_API_ENDPOINT="https://api.mavvrik.ai/<tenant_id>"
export MAVVRIK_CONNECTION_ID="<connection-id>"
litellm --config /path/to/config.yaml
```

proxy 會註冊一個背景工作，於每日一次匯出 FOCUS 格式的支出資料。

## 運作方式 {#how-it-works}

每個每日匯出週期：

1. 向 Mavvrik 後端註冊連接器（`POST /metrics/agent/ai/{connection_id}`）
2. 針對匯出日期請求 GCS 簽署上傳 URL（`GET /metrics/agent/ai/{connection_id}/upload-url`）
3. 透過簽署的 URL 將 gzip 壓縮的 FOCUS CSV 上傳至 GCS

重新執行相同日期的匯出會覆寫先前檔案——匯出具備 idempotent。匯出每日上限為 `MAVVRIK_FOCUS_MAX_ROWS` 列（預設 500k），以限制記憶體用量。

## FOCUS 欄位對應 {#focus-field-mapping}

LiteLLM 支出資料會在上傳前轉換為 FOCUS 1.2 結構描述：

| LiteLLM 欄位 | FOCUS 欄位 | 說明 |
|---------------|-------------|-------------|
| `spend` | BilledCost, EffectiveCost | 使用成本 |
| `model` | ChargeDescription, ResourceId | 模型識別碼 |
| `model_group` | ServiceName | 模型群組 / 部署 |
| `custom_llm_provider` | ProviderName, PublisherName | 提供者（openai、anthropic 等） |
| `api_key` | BillingAccountId | 雜湊 API 金鑰 |
| `api_key_alias` | BillingAccountName | 可供人閱讀的金鑰別名 |
| `team_id` | SubAccountId | 團隊識別碼 |
| `team_alias` | SubAccountName | 團隊名稱 |

其他中繼資料（user_id、model_group 等）會以 JSON 形式包含在 `Tags` 欄位中。

## 相關連結 {#related-links}

- [Mavvrik](https://mavvrik.ai)
- [FOCUS 規格](https://focus.finops.org/)
- [Focus 匯出（S3/GCS）](./focus.md)
