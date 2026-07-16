import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure Sentinel {#azure-sentinel}

<Image img={require('../../img/sentinel.png')} />

LiteLLM 支援透過 Azure Monitor Logs Ingestion API 記錄到 Azure Sentinel。Azure Sentinel 使用 Log Analytics 工作區進行資料儲存，因此傳送到工作區的記錄可在 Sentinel 中用於安全性監控與分析。

## Azure Sentinel 整合 {#azure-sentinel-integration}

| 功能 | 詳細資訊 |
|---------|---------|
| **記錄內容** | [StandardLoggingPayload](../proxy/logging_spec) |
| **事件** | 成功 + 失敗 |
| **產品連結** | [Azure Sentinel](https://learn.microsoft.com/en-us/azure/sentinel/overview) |
| **API 參考** | [Logs Ingestion API](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview) |

我們將使用 `--config` 來設定 `litellm.callbacks = ["azure_sentinel"]`，這會將所有成功與失敗的 LLM 呼叫記錄到 Azure Sentinel。

**步驟 1**：建立 `config.yaml` 檔案並設定 `litellm_settings`：`callbacks`

```yaml showLineNumbers title="config.yaml"
model_list:
 - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
litellm_settings:
  callbacks: ["azure_sentinel"] # logs llm success + failure logs to Azure Sentinel
```

**步驟 2**：設定 Azure 資源

在使用 Logs Ingestion API 之前，您需要在 Azure 中設定以下項目：

1. **建立 Log Analytics 工作區**（如果您還沒有）
2. **在您的 Log Analytics 工作區中建立自訂資料表**（例如，`LiteLLM_CL`）
3. **建立資料收集規則（DCR）**，包含：
   - 與您的資料結構相符的串流宣告
   - 將資料對應至您的自訂資料表的轉換
   - 已授予您的應用程式註冊存取權
4. 在 Microsoft Entra ID（Azure AD）中**註冊應用程式**，包含：
   - Client ID
   - Client Secret
   - 寫入 DCR 的權限

如需詳細的設定說明，請參閱 [Microsoft 關於 Logs Ingestion API 的文件](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview)。

**步驟 3**：設定必要的環境變數

使用您的 Azure 認證設定以下環境變數：

```shell showLineNumbers title="Environment Variables"
# Required: Data Collection Rule (DCR) configuration
AZURE_SENTINEL_DCR_IMMUTABLE_ID="dcr-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # DCR Immutable ID from Azure portal
AZURE_SENTINEL_STREAM_NAME="Custom-LiteLLM_CL_CL"                    # Stream name from your DCR
AZURE_SENTINEL_ENDPOINT="https://your-dcr-endpoint.eastus-1.ingest.monitor.azure.com"  # DCR logs ingestion endpoint (NOT the DCE endpoint)

# Required: OAuth2 Authentication (App Registration)
AZURE_SENTINEL_TENANT_ID="your-tenant-id"                            # Azure Tenant ID
AZURE_SENTINEL_CLIENT_ID="your-client-id"                            # Application (client) ID
AZURE_SENTINEL_CLIENT_SECRET="your-client-secret"                    # Client secret value

```

**注意**：`AZURE_SENTINEL_ENDPOINT` 應該是 DCR 的 logs ingestion endpoint（可在 DCR Overview 頁面找到），**不是** Data Collection Endpoint（DCE）。DCR endpoint 會與您特定的 DCR 關聯，外觀如下：`https://your-dcr-endpoint.{region}-1.ingest.monitor.azure.com`

**步驟 4**：啟動 proxy 並發出測試請求

啟動 proxy

```shell showLineNumbers title="Start Proxy"
litellm --config config.yaml --debug
```

測試請求

```shell showLineNumbers title="Test Request"
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "what llm are you"
        }
    ],
    "metadata": {
        "your-custom-metadata": "custom-field",
    }
}'
```

**步驟 5**：在 Azure Sentinel 中檢視記錄

1. 前往 Azure portal 中的 Azure Sentinel 工作區
2. 進入「Logs」並查詢您的自訂資料表（例如，`LiteLLM_CL`）
3. 執行如下查詢：

```kusto showLineNumbers title="KQL Query"
LiteLLM_CL
| where TimeGenerated > ago(1h)
| project TimeGenerated, model, status, total_tokens, response_cost
| order by TimeGenerated desc
```

您應該會在 Azure Workspace 中看到以下記錄。

<Image img={require('../../img/sentinel.png')} />

## 環境變數 {#environment-variables}

| 環境變數 | 說明 | 預設值 | 必填 |
|---------------------|-------------|---------------|----------|
| `AZURE_SENTINEL_DCR_IMMUTABLE_ID` | Data Collection Rule (DCR) 不可變 ID | 無 | ✅ 是 |
| `AZURE_SENTINEL_ENDPOINT` | DCR logs ingestion endpoint URL（來自 DCR Overview 頁面） | 無 | ✅ 是 |
| `AZURE_SENTINEL_STREAM_NAME` | 來自 DCR 的串流名稱（例如，"Custom-LiteLLM_CL_CL"） | "Custom-LiteLLM" | ❌ 否 |
| `AZURE_SENTINEL_TENANT_ID` | 用於 OAuth2 驗證的 Azure Tenant ID | 無（回退至 `AZURE_TENANT_ID`） | ✅ 是 |
| `AZURE_SENTINEL_CLIENT_ID` | 用於 OAuth2 驗證的 Application（client）ID | 無（回退至 `AZURE_CLIENT_ID`） | ✅ 是 |
| `AZURE_SENTINEL_CLIENT_SECRET` | 用於 OAuth2 驗證的 Client secret | 無（回退至 `AZURE_CLIENT_SECRET`） | ✅ 是 |

## 運作方式 {#how-it-works}

Azure Sentinel 整合使用 [Azure Monitor Logs Ingestion API](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview) 將記錄傳送到您的 Log Analytics 工作區。此整合：

- 使用 OAuth2 client credentials flow 搭配您的應用程式註冊進行驗證
- 將記錄傳送到 Data Collection Rule (DCR) endpoint
- 批次處理記錄以提升傳輸效率
- 以 [StandardLoggingPayload](../proxy/logging_spec) 格式傳送記錄
- 自動處理成功與失敗事件
- 快取 OAuth2 token 並自動重新整理

傳送到 Log Analytics 工作區的記錄會自動在 Azure Sentinel 中可用，以進行安全性監控、威脅偵測與分析。

## Azure Sentinel 設定指南 {#azure-sentinel-setup-guide}

依照此逐步指南，使用 LiteLLM 設定 Azure Sentinel。

### 步驟 1：建立 Log Analytics 工作區 {#step-1-create-a-log-analytics-workspace}

1. 前往 [https://portal.azure.com/#home](https://portal.azure.com/#home)

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/5659f6f5-a166-4b26-a991-73352274e3bb/ascreenshot.jpeg?tl_px=0,210&br_px=2618,1673&force_format=jpeg&q=100&width=1120.0)

2. 搜尋「Log Analytics workspaces」並點選「Create」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/a827ba10-a391-486a-a36a-51816c6255de/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=21,106)

3. 為您的工作區輸入名稱（例如，「litellm-sentinel-prod」）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/943458f1-fd4c-47dd-a273-ea5a04734ed9/ascreenshot.jpeg?tl_px=0,420&br_px=2618,1884&force_format=jpeg&q=100&width=1120.0)

4. 點選「Review + Create」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/c54828fb-f895-4eb7-b810-cacf437617bd/ascreenshot.jpeg?tl_px=0,420&br_px=2618,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=40,564)

### 步驟 2：建立自訂資料表 {#step-2-create-a-custom-table}

1. 前往您的 Log Analytics 工作區並點選「Tables」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/72d65f70-75c0-471f-95e9-947c72e173cc/ascreenshot.jpeg?tl_px=0,142&br_px=2618,1605&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=330,277)

2. 點選「Create」→「New custom log (Direct Ingest)」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/863ad29b-2c3a-4b7c-9a6b-36d3a76c9f32/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=526,146)

3. 輸入資料表名稱（例如，「LITELLM_PROD_CL」）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/ef2f1c52-aa36-46a1-91e6-9bd868891b15/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0)

### 步驟 3：建立資料收集規則（DCR） {#step-3-create-a-data-collection-rule-dcr}

1. 點選「Create a new data collection rule」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/f2abc0d3-8be8-4057-9290-946d10cfd183/ascreenshot.jpeg?tl_px=0,420&br_px=2618,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=264,404)

2. 為 DCR 輸入名稱（例如，「litellm-prod」）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/79bbebdc-e4d9-46ff-a270-1930619050a1/ascreenshot.jpeg?tl_px=0,8&br_px=2618,1471&force_format=jpeg&q=100&width=1120.0)

3. 選取 Data Collection Endpoint

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/f3112e9a-551e-415c-a7f9-55aad801bc8a/ascreenshot.jpeg?tl_px=0,420&br_px=2618,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=332,480)

4. 上傳用於結構描述的範例 JSON 檔案（使用 [example_standard_logging_payload.json](https://github.com/BerriAI/litellm/blob/main/litellm/integrations/azure_sentinel/example_standard_logging_payload.json) 檔案）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/703c0762-840a-4f1f-a60f-876dc24b7a03/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=518,272)

5. 點選「Next」，然後點選「Create」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/0bca0200-5c64-4fbd-8061-9308aa6656b8/ascreenshot.jpeg?tl_px=0,420&br_px=2618,1884&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=128,560)

### 步驟 4：取得 DCR 不可變 ID 與 Logs Ingestion Endpoint {#step-4-get-the-dcr-immutable-id-and-logs-ingestion-endpoint}

1. 前往「Data Collection Rules」並選取您的 DCR

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/11c06a0d-584f-4d22-b36e-9c338d43812c/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=94,258)

2. 複製 **DCR 不可變 ID**（以 `dcr-` 開頭）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/cd0ad69a-4d95-4b6a-9533-7720908ba809/ascreenshot.jpeg?tl_px=1160,92&br_px=2618,907&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=530,277)

3. 複製 **Logs Ingestion Endpoint** URL

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/3d3752ed-08ea-4490-8c98-a97d33947ea7/ascreenshot.jpeg?tl_px=1160,464&br_px=2618,1279&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=532,277)

### 步驟 5：取得串流名稱 {#step-5-get-the-stream-name}

1. 在 DCR 中點選「JSON View」

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/fd8a5504-4769-4f23-983e-520f256ee308/ascreenshot.jpeg?tl_px=1160,0&br_px=2618,814&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=965,257)

2. 在 `streamDeclarations` 區段中找到 **Stream Name**（例如，「Custom-LITELLM_PROD_CL_CL」）

![](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-17/a4052b32-2028-4d12-8930-bfcdf6f47652/ascreenshot.jpeg?tl_px=405,270&br_px=2115,1225&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=523,277)

### 步驟 6：註冊應用程式並授予權限 {#step-6-register-an-app-and-grant-permissions}

1. 前往 **Microsoft Entra ID** → **App registrations** → **New registration**
2. 建立新的應用程式並記下 **Client ID** 與 **Tenant ID**
3. 前往 **Certificates & secrets** → 建立新的 client secret 並複製 **Secret Value**
4. 返回您的 DCR → **Access Control (IAM)** → **Add role assignment**
5. 將 **"Monitoring Metrics Publisher"** 角色指派給您的應用程式註冊

### 摘要：各值的查找位置 {#summary-where-to-find-each-value}

| 環境變數 | 查找位置 |
|---------------------|------------------|
| `AZURE_SENTINEL_DCR_IMMUTABLE_ID` | DCR Overview 頁面 → Immutable ID（以 `dcr-` 開頭） |
| `AZURE_SENTINEL_ENDPOINT` | DCR Overview 頁面 → Logs Ingestion Endpoint |
| `AZURE_SENTINEL_STREAM_NAME` | DCR JSON View → `streamDeclarations` 區段 |
| `AZURE_SENTINEL_TENANT_ID` | App Registration → Overview → Directory (tenant) ID |
| `AZURE_SENTINEL_CLIENT_ID` | App Registration → Overview → Application (client) ID |
| `AZURE_SENTINEL_CLIENT_SECRET` | App Registration → Certificates & secrets → Secret Value |

如需更多詳細資訊，請參閱 [Microsoft Logs Ingestion API 文件](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview)。
