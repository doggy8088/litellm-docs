import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Focus 匯出（實驗性） {#focus-export-experimental}

:::caution 實驗性功能
Focus 格式匯出目前仍在積極開發中，現階段視為實驗性功能。
介面、schema 對應與設定選項可能會隨著我們根據使用者回饋持續調整而變更。
請將此整合視為預覽版，並回報任何問題或建議，協助我們穩定並改善此工作流程。
:::

LiteLLM 可以將用量資料以 [FinOps FOCUS 格式](https://focus.finops.org/focus-specification/v1-2/) 輸出，並將產物（例如 Parquet 檔案）推送到 Amazon S3 或 Google Cloud Storage 等目的地。這可讓下游成本分析工具直接從 LiteLLM 擷取標準化資料集。

LiteLLM 目前在輸出此資料集時符合 FinOps FOCUS v1.2 規格。

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|----------|---------|
| 目的地 | 以 FOCUS 格式將 LiteLLM 用量資料匯出到受管理儲存空間（S3、GCS） |
| 回呼名稱 | `focus` |
| 支援的操作 | 自動排程匯出 |
| 資料格式 | FOCUS 標準化資料集（Parquet 或 CSV） |

## 環境變數 {#environment-variables}

### 通用設定 {#common-settings}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `FOCUS_PROVIDER` | 否 | 目的地提供者。`s3`、`gcs`、`vantage` 其中之一。預設為 `s3`。 |
| `FOCUS_FORMAT` | 否 | 輸出格式。`parquet`、`csv` 其中之一。預設為 `parquet`。 |
| `FOCUS_FREQUENCY` | 否 | 匯出頻率。正式環境請優先使用 `hourly` 或 `daily`；`interval` 適用於短暫的測試迴圈。預設為 `hourly`。 |
| `FOCUS_CRON_OFFSET` | 否 | 用於每小時/每日 cron 觸發器的分鐘偏移量。預設為 `5`。 |
| `FOCUS_INTERVAL_SECONDS` | 否 | `FOCUS_FREQUENCY="interval"` 時的間隔（秒）。 |
| `FOCUS_PREFIX` | 否 | 物件 key 前綴/資料夾。預設為 `focus_exports`。 |

### S3 目的地 {#s3-destination}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `FOCUS_S3_BUCKET_NAME` | 是 | 匯出檔案的目的地 bucket。 |
| `FOCUS_S3_REGION_NAME` | 否 | 該 bucket 的 AWS 區域。 |
| `FOCUS_S3_ENDPOINT_URL` | 否 | 自訂端點（適用於相容 S3 的儲存空間）。 |
| `FOCUS_S3_ACCESS_KEY` | 是 | 上傳用的 AWS access key。 |
| `FOCUS_S3_SECRET_KEY` | 是 | 上傳用的 AWS secret key。 |
| `FOCUS_S3_SESSION_TOKEN` | 否 | 若使用暫時性憑證，則為 AWS session token。 |

### GCS 目的地 {#gcs-destination}

| 變數 | 必填 | 說明 |
|----------|----------|-------------|
| `FOCUS_GCS_BUCKET_NAME` | 是 | 匯出檔案的目的地 GCS bucket。 |
| `FOCUS_GCS_PATH_SERVICE_ACCOUNT` | 否 | service account JSON key 檔案的路徑。若未設定，則回退至 Application Default Credentials (ADC)。 |

## 透過 Config 設定 {#setup-via-config}

### 設定環境變數 {#configure-environment-variables}

<Tabs>
<TabItem value="s3" label="S3">

```bash
export FOCUS_PROVIDER="s3"
export FOCUS_PREFIX="focus_exports"
export FOCUS_S3_BUCKET_NAME="my-litellm-focus-bucket"
export FOCUS_S3_REGION_NAME="us-east-1"
export FOCUS_S3_ACCESS_KEY="AKIA..."
export FOCUS_S3_SECRET_KEY="..."
```

</TabItem>
<TabItem value="gcs" label="GCS">

```bash
export FOCUS_PROVIDER="gcs"
export FOCUS_PREFIX="focus_exports"
export FOCUS_GCS_BUCKET_NAME="my-litellm-focus-bucket"

# Optional: path to service account JSON. Omit to use Application Default Credentials.
export FOCUS_GCS_PATH_SERVICE_ACCOUNT="/path/to/service-account.json"
```

service account（或 ADC 主體）需要在目的地 bucket 上具有 `storage.objects.create` 權限（`roles/storage.objectCreator` 或更高）。

</TabItem>
</Tabs>

### 更新 LiteLLM 設定 {#update-litellm-config}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-your-key

litellm_settings:
  callbacks: ["focus"]
```

### 啟動 proxy {#start-the-proxy}

```bash
litellm --config /path/to/config.yaml
```

啟動期間，LiteLLM 會註冊 Focus 記錄器，以及一個會依照設定頻率執行的背景工作。

## 規劃中的增強功能 {#planned-enhancements}
- 在目前的以設定為基礎的設定之外，新增「在 UI 上設定」流程。
- 新增 Azure Blob 到目的地選項。

## 相關連結 {#related-links}

- [Focus](https://focus.finops.org/)
