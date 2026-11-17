---
title: "LiteLLM 的 FOCUS 成本匯出：S3 與 GCS"
sidebar_label: "Focus 匯出（實驗性）"
description: "以 FinOps FOCUS 格式將 LiteLLM AI 閘道使用量匯出到 S3 或 GCS 儲存桶，透過環境變數與 config.yaml 設定（實驗性）。"
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Focus 匯出（實驗性） {#focus-export-experimental}

:::warning[實驗性功能]
Focus Format 匯出目前正在積極開發中，且現階段被視為實驗性功能。
介面、schema 對應，以及設定選項可能會隨著我們根據使用者回饋持續迭代而變更。
請將此整合視為預覽版本，並回報任何問題或建議，協助我們穩定並改進此工作流程。
:::

LiteLLM 可以將用量資料以 [FinOps FOCUS 格式](https://focus.finops.org/) 輸出，並將產物（例如 Parquet 檔案）推送到 Amazon S3 或 Google Cloud Storage 等目的地。這可讓下游成本分析工具直接從 LiteLLM 擷取標準化資料集。

實驗性匯出遵循 [FOCUS 1.5 發行候選版 Cost and Usage 資料集](https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS_Spec/tree/v1.5-cr/specification/datasets/cost_and_usage)。

## 匯出欄位與請求計量 {#export-columns-and-request-meter}

`ServiceProviderName` 與 `HostProviderName` 取代 `ProviderName` 與 `PublisherName`。兩者都包含 LiteLLM 提供者名稱。`InvoiceIssuerName` 仍可使用。

`PrincipalId` 用來識別使用者。`CredentialId` 包含已儲存的雜湊 API 金鑰，而非用於驗證的金鑰。`RequesterDetails` 是一個 JSON 陣列：存在使用者 ID 時包含 Principal 項目，存在憑證 ID 時包含 Credential 項目。已知的使用者電子郵件與金鑰別名會提供描述性屬性；未知的屬性則會省略。當兩個 ID 都不存在時，該欄位為 null。

每一列代表一個每日、每個金鑰／模型的請求計量。資料列不會依權杖方向或快取動作拆分，因為每日支出彙總會合併這些成本。`PricingQuantity` 與 `ConsumedQuantity` 都包含請求次數；`PricingUnit` 與 `ConsumedUnit` 皆為 `Requests`。

`SkuId` 是 LiteLLM 定義的穩定識別碼，格式為 `provider/model`。`SkuPriceId` 會加上 `/requests`，用來識別合併後的請求計量，而非個別權杖價格。這些 ID 不包含帳戶識別碼或價格金額；若提供者或模型未知，則為 null。`SkuPriceDetails` 是一個 JSON 物件，包含 FOCUS 定義的 `ModelId` 屬性，設定為該模型。當 `SkuPriceId` 為 null 時，它也是 null，且不包含 `TokenDirection` 或 `TokenCacheAction`。

Vantage 目的地會在上傳前移除其支援允許清單以外的欄位，包括 SKU 與請求者詳細資料欄位。

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
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
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
