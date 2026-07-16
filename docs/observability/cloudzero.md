import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CloudZero {#cloudzero}

LiteLLM 提供與 CloudZero 的 AnyCost API 整合，讓您可以將 LLM 使用資料匯出到 CloudZero 進行成本追蹤分析。

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | 將 LiteLLM 使用資料匯出到 CloudZero AnyCost API，以進行成本追蹤與分析 |
| callback name | `cloudzero`|
| 支援的操作 | • 自動每小時資料匯出<br/>• 手動資料匯出<br/>• 乾跑測試<br/>• 成本與 token 使用追蹤 |
| 資料格式 | 具備正確資源標記的 CloudZero Billing Format (CBF) |
| 匯出頻率 | 每小時（可透過 `CLOUDZERO_EXPORT_INTERVAL_MINUTES` 設定） |

## 環境變數 {#environment-variables}

| 變數 | 必填 | 說明 | 範例 |
|----------|------|-------------|---------|
| `CLOUDZERO_API_KEY` | 是 | 您的 CloudZero API 金鑰 | `cz_api_xxxxxxxxxx` |
| `CLOUDZERO_CONNECTION_ID` | 是 | 用於資料提交的 CloudZero 連線 ID | `conn_xxxxxxxxxx` |
| `CLOUDZERO_TIMEZONE` | 否 | 用於日期處理的時區（預設：UTC） | `America/New_York` |
| `CLOUDZERO_EXPORT_INTERVAL_MINUTES` | 否 | 以分鐘為單位的匯出頻率（預設：60） | `60` |

## 設定 {#setup}

### 端到端影片導覽 {#end-to-end-video-walkthrough}
此影片會逐步說明如何設定 LiteLLM 與 CloudZero 整合，並在 CloudZero 中檢視 LiteLLM 匯出的使用資料。

<iframe width="840" height="500" src="https://www.loom.com/embed/59b57593183f4cc3b1c05a2dd3277f92" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

### 步驟 1：設定環境變數 {#step-1-configure-environment-variables}

在您的環境中設定 CloudZero 憑證：

```bash
export CLOUDZERO_API_KEY="cz_api_xxxxxxxxxx"
export CLOUDZERO_CONNECTION_ID="conn_xxxxxxxxxx"
export CLOUDZERO_TIMEZONE="UTC"  # Optional, defaults to UTC
```

### 步驟 2：啟用 CloudZero 整合 {#step-2-enable-cloudzero-integration}

將 CloudZero callback 加入您的 LiteLLM 設定 YAML 檔案：

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx

litellm_settings:
  callbacks: ["cloudzero"]  # Enable CloudZero integration
```

### 步驟 3：啟動 LiteLLM Proxy {#step-3-start-litellm-proxy}

使用以下設定啟動您的 LiteLLM proxy：

```bash
litellm --config /path/to/config.yaml
```

## 在 UI 上設定 {#setup-on-ui}

1\. 點選「Settings」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/5ac36280-c688-41a3-8d0e-23e19c6a470b/ascreenshot.jpeg?tl_px=0,332&br_px=1308,1064&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=119,444)

2\. 點選「Logging & Alerts」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/13f76b09-e0c4-4738-ba05-2d5111c6ad3e/ascreenshot.jpeg?tl_px=0,332&br_px=1308,1064&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=58,507)

3\. 點選「CloudZero Cost Tracking」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/f96cc1e5-7bc0-4d7c-9aeb-5cbbec549b12/ascreenshot.jpeg?tl_px=0,0&br_px=1308,731&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=389,56)

4\. 點選「Add CloudZero Integration」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/04fbc748-0e6f-43bb-8a57-dd2e83dbfcb5/ascreenshot.jpeg?tl_px=0,90&br_px=1308,821&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=616,277)

5\. 輸入您的 CloudZero API 金鑰。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/080e82f1-f94f-4ed7-8014-e495380336f3/ascreenshot.jpeg?tl_px=0,0&br_px=1308,731&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=506,129)

6\. 輸入您的 CloudZero 連線 ID。

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/af417aa2-67a8-4dee-a014-84b1892dc07e/ascreenshot.jpeg?tl_px=0,0&br_px=1308,731&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=488,213)

7\. 點選「Create」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/647e672f-9a4a-4754-a7b0-abf1397abad4/ascreenshot.jpeg?tl_px=0,88&br_px=1308,819&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=711,277)

8\. 使用「Run Dry Run Simulation」測試您的負載

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/7447cbe0-3450-4be5-bdc4-37fb8280aa58/ascreenshot.jpeg?tl_px=0,125&br_px=1308,856&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=334,277)

10\. 點選「Export Data Now」以匯出到 CLoudZero

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-22/7be9bd48-6e27-4c68-bc75-946f3ab593d9/ascreenshot.jpeg?tl_px=0,130&br_px=1308,861&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=518,277)

## 測試您的設定 {#testing-your-setup}

### 乾跑匯出 {#dry-run-export}

呼叫乾跑端點，以在不將資料傳送到 CloudZero 的情況下測試您的 CloudZero 設定。此端點不會將任何資料傳送到 CloudZero，但會回傳將被匯出的資料。

```bash
curl -X POST "http://localhost:4000/cloudzero/dry-run" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "limit": 10
  }' | jq
```

**預期回應：**
```json
{
  "message": "CloudZero dry run export completed successfully.",
  "status": "success",
  "dry_run_data": {
    "usage_data": [...],
    "cbf_data": [...],
    "summary": {
      "total_cost": 0.05,
      "total_tokens": 1250,
      "total_records": 10
    }
  }
}
```

### 手動匯出 {#manual-export}

呼叫匯出端點，立即將資料傳送到 CloudZero。我們建議設定較小的 `limit` 來測試匯出。這只會將最後 10 筆記錄匯出到 CloudZero。注意：Cloudzero 可能需要最多 15 分鐘來處理已匯出的資料。

```bash
curl -X POST "http://localhost:4000/cloudzero/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "limit": 10
  }' | jq
```

**預期回應：**
```json
{
  "message": "CloudZero export completed successfully",
  "status": "success"
}
```

## 資料匯出詳細資訊 {#data-export-details}

### 自動匯出排程 {#automatic-export-schedule}

- **頻率**：每 60 分鐘一次（可透過 `CLOUDZERO_EXPORT_INTERVAL_MINUTES` 設定）
- **資料處理**：LiteLLM 會自動每小時處理並匯出使用資料
- **CloudZero 處理**：CloudZero 通常需要 10-15 分鐘來處理來自 LiteLLM 的資料

### 資料格式 {#data-format}

LiteLLM 以 CloudZero Billing Format (CBF) 匯出資料，結構如下：

```json
{
  "time/usage_start": "2024-01-15T14:00:00Z",
  "cost/cost": 0.002,
  "usage/amount": 150,
  "usage/units": "tokens",
  "resource/id": "czrn:litellm:openai:cross-region:team-123:llm-usage:gpt-4o",
  "resource/service": "litellm",
  "resource/account": "team-123",
  "resource/region": "cross-region",
  "resource/usage_family": "llm-usage",
  "resource/tag:provider": "openai",
  "resource/tag:model": "gpt-4o",
  "resource/tag:prompt_tokens": "100",
  "resource/tag:completion_tokens": "50"
}
```

### 資源標記 {#resource-tagging}

LiteLLM 會自動建立完整的資源標記，以進行成本歸因：

- **提供者標記**：`openai`、`anthropic`、`azure` 等
- **模型標記**：特定模型名稱，例如 `gpt-4o`、`claude-3-sonnet`
- **團隊/使用者標記**：用於成本分配的團隊 ID 與使用者 ID
- **Token 明細**：分別追蹤 prompt 與 completion tokens
- **使用指標**：每個請求消耗的總 token 數

## 進階設定 {#advanced-configuration}

### 自訂匯出頻率 {#custom-export-frequency}

變更匯出頻率（不建議低於 60 分鐘）：

```bash
export CLOUDZERO_EXPORT_INTERVAL_MINUTES=120  # Export every 2 hours
```

### 自訂時間範圍匯出 {#custom-time-range-export}

匯出特定時間範圍的資料：

```bash
curl -X POST "http://localhost:4000/cloudzero/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "start_time_utc": "2024-01-15T00:00:00Z",
    "end_time_utc": "2024-01-15T23:59:59Z",
    "operation": "replace_hourly"
  }' | jq
```

## 疑難排解 {#troubleshooting}

### 常見問題 {#common-issues}

1. **缺少憑證錯誤**
   ```
   CloudZero configuration missing. Please set CLOUDZERO_API_KEY and CLOUDZERO_CONNECTION_ID environment variables.
   ```
   **解決方案**：請確保已設定兩個環境變數，且值有效。

2. **連線問題**
   - 確認您的 CloudZero API 金鑰有效
   - 檢查連線 ID 是否存在於您的 CloudZero 帳戶中
   - 確保您的 proxy 可透過網際網路存取 CloudZero 的 API

3. **CloudZero 中沒有資料**
   - CloudZero 可能需要 10-15 分鐘來處理資料
   - 檢查您的 LiteLLM proxy 是否正在產生使用資料
   - 使用乾跑端點確認資料格式是否正確

## 相關連結 {#related-links}

- [CloudZero 文件](https://docs.cloudzero.com/)
- [CloudZero AnyCost API](https://docs.cloudzero.com/reference/anycost-api)
