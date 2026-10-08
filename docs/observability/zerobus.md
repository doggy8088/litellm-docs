import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ZerobusArchitecture from '@site/src/components/ZerobusArchitecture';

# Databricks Zerobus {#databricks-zerobus}

將 LiteLLM Gateway 的請求記錄傳送至使用 Databricks Zerobus Ingest 的 Unity Catalog Delta 表。可在 Databricks 中與您現有的企業資料一起查詢模型使用量、延遲、成本與請求中繼資料。

這份快速入門會將既有的 LiteLLM Gateway 部署連接到 Databricks。建立目的地資料表、設定服務主體驗證、啟用整合，並驗證使用 LiteLLM 虛擬金鑰發出的請求。您可以透過部署的 YAML 組態或 LiteLLM 管理 UI 來設定此整合。

<ZerobusArchitecture />

LiteLLM 會緩衝記錄，並使用 OAuth 用戶端憑證將 JSON 批次傳送至 Zerobus REST API。預設的清空間隔為 10 秒；當佇列達到 100 列時會提早清空。

## 開始之前 {#before-you-begin}

您需要一個既有的 LiteLLM Gateway 部署、其 HTTPS URL，以及用於設定記錄的管理員存取權。閘道必須已經有可正常運作的模型，且您需要一把獲授權呼叫該模型的 LiteLLM 虛擬金鑰。閘道的雲端環境必須允許對 Databricks 工作區與 Zerobus 端點進行對外 HTTPS 連線。

您也需要一個已啟用 Unity Catalog 的 Databricks 工作區，且位於 [支援的 Zerobus 區域](https://docs.databricks.com/aws/en/resources/feature-region-support#ingestion-availability)，以及供受管理 Delta 表使用的 catalog 和 schema，並可存取 SQL warehouse 或 notebook 運算資源。Databricks 管理員必須能夠建立服務主體並授予目的地的存取權。

您的 Databricks 使用者也需要 `USE CATALOG`、`USE SCHEMA` 和 `SELECT` 才能執行驗證查詢。這些讀取者權限與擷取主體的授權是分開的。

若要透過管理 UI 設定整合，您的部署必須已連接 PostgreSQL 且已啟用 `general_settings.store_model_in_db: true`。請使用組織已設定的驗證方式登入，並具備 proxy 管理員存取權。

範例使用 `my_catalog.my_schema.litellm_traces`。請在所有出現處將 `my_catalog` 和 `my_schema` 替換為您現有的 catalog 與 schema。螢幕截圖顯示的是一個使用 Databricks 託管模型的範例工作區。Zerobus 記錄同樣適用於其他受支援的模型提供者。請使用您自己的工作區 URL、ID、區域與服務主體憑證。

## 1. 準備閘道存取權 {#1-prepare-gateway-access}

向您的平台管理員取得閘道的 HTTPS 基礎 URL 與 [虛擬金鑰](https://docs.litellm.ai/docs/proxy/virtual_keys)。如果您負責管理金鑰，請在已部署的管理 UI 中開啟 **Virtual Keys → + Create New Key**，選取適當的團隊與允許的模型，並依組織需求建立具備預算與到期時間的金鑰。

在您要送出驗證請求的環境中，設定部署 URL 與虛擬金鑰：

```bash
export LITELLM_BASE_URL="https://litellm.example.com"
export LITELLM_API_KEY="<your-litellm-virtual-key>"
```

請將範例網域替換為您已部署的閘道 URL，且不要加上結尾斜線或 `/v1` 尾碼。請記下此金鑰可存取的既有模型別名；您會在步驟 6 使用它。虛擬金鑰用於向 LiteLLM 驗證請求。下方建立的 Databricks 服務主體則用於驗證從閘道傳送到 Databricks 的記錄。

## 2. 識別您的 Databricks 端點 {#2-identify-your-databricks-endpoints}

開啟目的地 Databricks 工作區。從位址列複製基礎 URL，排除路徑、查詢參數與片段。數值型 `o=` 參數會識別工作區。請在工作區切換器或 Databricks 帳戶主控台中找到其區域。請參閱 [Databricks 端點探索](https://docs.databricks.com/aws/en/ingestion/zerobus-ingest#get-your-workspace-url-and-zerobus-ingest-endpoint)。

| 值 | 範例格式 |
| --- | --- |
| 工作區 URL | `https://dbc-xxxxxxxx-xxxx.cloud.databricks.com` |
| 工作區 ID | `?o=<workspace-id>` 中的數值 |
| 工作區區域 | 例如 `us-east-2` |
| AWS 上的 Zerobus 伺服器端點 | `https://<workspace-id>.zerobus.<region>.cloud.databricks.com` |

**請在兩個 URL 中都包含 `https://`。** 工作區 URL 用於驗證服務主體；Zerobus 端點會接收記錄。兩者必須指向相同的工作區與區域。請勿複製其他工作區的 ID，也不要使用帳戶 ID。若為 Azure，請使用結尾為 `.azuredatabricks.net` 的端點。

## 3. 建立目的地資料表 {#3-create-the-destination-table}

使用與已部署閘道相同的 LiteLLM 版本產生資料表定義。請在閘道的容器中，或在具有相符套件版本的管理環境中執行此命令。或者，也可以使用下方完整資料表定義：

```bash
python - <<'PY'
from litellm.integrations.zerobus.row import create_table_sql

print(create_table_sql("my_catalog.my_schema.litellm_traces"))
PY
```

在 Databricks 中，開啟 **SQL Editor**，選取 SQL warehouse，貼上產生的陳述式，然後執行以建立受管理的 Delta 表。您也可以在 SQL notebook 儲存格中執行。開啟 **Catalog**，前往您的資料表，並確認其欄位與產生的定義相符。

![LiteLLM traces 資料表與欄位定義在 Databricks Catalog Explorer 中的畫面](/img/zerobus/databricks-table.png)

*使用 LiteLLM 產生的 schema 建立專用的 Delta 資料表。*

<details>
<summary>完整資料表定義</summary>

```sql
CREATE TABLE my_catalog.my_schema.litellm_traces (
  id STRING,
  trace_id STRING,
  session_id STRING,
  litellm_call_id STRING,
  call_type STRING,
  status STRING,
  model STRING,
  model_group STRING,
  model_id STRING,
  custom_llm_provider STRING,
  api_base STRING,
  stream BOOLEAN,
  cache_hit BOOLEAN,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  completion_start_time TIMESTAMP,
  response_time DOUBLE,
  prompt_tokens LONG,
  completion_tokens LONG,
  total_tokens LONG,
  response_cost DOUBLE,
  saved_cache_cost DOUBLE,
  api_key_hash STRING,
  api_key_alias STRING,
  team_id STRING,
  team_alias STRING,
  user_id STRING,
  org_id STRING,
  end_user STRING,
  requester_ip_address STRING,
  user_agent STRING,
  request_tags VARIANT,
  messages VARIANT,
  response VARIANT,
  error_str STRING,
  error_information VARIANT,
  metadata VARIANT,
  model_parameters VARIANT,
  hidden_params VARIANT,
  guardrail_information VARIANT,
  cost_breakdown VARIANT
);
```

</details>

如果資料表已存在，請在繼續之前將其 schema 與產生的 DDL 進行比較。巢狀欄位使用 `VARIANT`；使用這些欄位作為 `STRING` 建立的資料表不符合此 schema。`LONG` 和 `BIGINT` 是等價的 Databricks SQL 類型。

## 4. 建立服務主體並授予存取權 {#4-create-the-service-principal-and-grant-access}

在 Databricks 工作區中，開啟 **Settings → Identity and access**。在 **Service principals** 旁選取 **Manage**，然後選取 **Add service principal → Add new**。請為其命名一個具描述性的名稱，例如 `litellm-zerobus`。請參閱 [Databricks 服務主體設定](https://docs.databricks.com/aws/en/ingestion/zerobus-ingest#create-a-service-principal-and-grant-permissions)。

開啟服務主體的 **Secrets** 分頁並選取 **Generate secret**。選擇有效期間，並將 client ID 和 secret 複製到您的密鑰儲存區。client ID 是主體的 application ID；secret 只會顯示一次。此整合會請求 `all-apis` OAuth 範圍，並將其擷取權杖限制於下方的 catalog、schema 與資料表。請參閱 [Databricks OAuth secrets](https://docs.databricks.com/aws/en/dev-tools/auth/oauth-m2m#step-1-create-an-oauth-secret)。

以有權授予這些權限的主體執行下列 SQL。請以您複製的 client ID 取代 application ID 佔位符：

```sql
GRANT USE CATALOG ON CATALOG my_catalog
TO `<service-principal-application-id>`;

GRANT USE SCHEMA ON SCHEMA my_catalog.my_schema
TO `<service-principal-application-id>`;

GRANT SELECT, MODIFY ON TABLE my_catalog.my_schema.litellm_traces
TO `<service-principal-application-id>`;
```

請直接將這些權限授予服務主體。群組成員資格與廣泛的 `ALL PRIVILEGES` 授權，無法取代 LiteLLM 要求 Zerobus 權杖時所使用的明確授權。

在 **Catalog** 中，開啟目的地資料表的 **Permissions** 分頁，並確認該主體具有 `SELECT` 和 `MODIFY`。同時也請驗證 catalog 上的 `USE CATALOG` 以及 schema 上的 `USE SCHEMA`。

![Databricks 中目的地資料表上的服務主體權限](/img/zerobus/databricks-permissions.png)

*擷取主體需要對 catalog、schema 與資料表的明確存取權。*

## 5. 連接 LiteLLM Gateway {#5-connect-the-litellm-gateway}

選擇一種設定方式。YAML 會為成功與失敗的模型呼叫都啟用記錄。管理 UI 會新增成功回呼並記錄成功的呼叫；如果您也需要失敗呼叫的記錄，請使用 YAML。

### 選項 A：使用 YAML 設定 {#option-a-configure-with-yaml}

透過您平台的組態與密鑰管理系統，將下列環境變數加入您的閘道部署。請使所有閘道副本都能存取這些變數。請將 client secret 儲存為密鑰，並於執行階段注入。

| 閘道環境變數 | 值 |
| --- | --- |
| `ZEROBUS_WORKSPACE_URL` | `https://<your-workspace-host>` |
| `ZEROBUS_SERVER_ENDPOINT` | `https://<workspace-id>.zerobus.<region>.cloud.databricks.com` |
| `ZEROBUS_CLIENT_ID` | 服務主體的 application ID |
| `ZEROBUS_CLIENT_SECRET` | 服務主體的 OAuth secret，從您的密鑰管理工具注入 |
| `ZEROBUS_TABLE_NAME` | `my_catalog.my_schema.litellm_traces` |

將下列內容合併到您部署所使用的組態中。如果 `litellm_settings.callbacks` 已經包含項目，請將 `zerobus` 附加到該清單，並保留您既有的回呼與其他組態：

```yaml
litellm_settings:
  callbacks: ["zerobus"]
```

請使用部署的正常推出流程套用組態與密鑰變更，並確認閘道副本已恢復為健康狀態。

LiteLLM 會從每個 gateway 程序的環境中讀取連線值。只在用於送出請求的終端機中設定這些變數，並不會設定已部署的 gateway。缺少必要值會使回呼初始化失敗。驗證與資料表存取會在送出第一批資料時檢查，因此即使 rollout 成功，也請繼續完成驗證步驟。

### 選項 B：在 Admin UI 中設定 {#option-b-configure-in-the-admin-ui}

開啟您已部署的 Admin UI，例如 `https://litellm.example.com/ui`，並透過您組織已設定的驗證方法登入。您的部署必須已連接 PostgreSQL，且啟用 `general_settings.store_model_in_db: true`，才能載入透過 UI 儲存的設定。請參閱 [Admin UI 指南](https://docs.litellm.ai/docs/proxy/ui) 以取得管理員存取權與 SSO 設定。

開啟 **Settings → Logging & Alerts**，選取 **Add Callback**，然後選擇 **Databricks Zerobus**。填入以下欄位：

| 欄位 | 值 |
| --- | --- |
| **Workspace URL** | 第 2 步中的工作區基底 URL，包含 `https://` |
| **Zerobus Endpoint** | 同一工作區的 Zerobus URL，包含 `https://` |
| **Service Principal Client ID** | service principal 的應用程式 ID |
| **Service Principal Client Secret** | 第 4 步產生的 OAuth secret |
| **Table** | `my_catalog.my_schema.litellm_traces` |

![LiteLLM Admin UI 中的 Databricks Zerobus 設定表單](/img/zerobus/litellm-configure.png)

*輸入全部五個連線值。OAuth secret 會在表單中以遮蔽方式顯示。*

選取 **Add Callback**。確認 **Databricks Zerobus** 出現在 logging callbacks 清單中。儲存回呼即可完成整合設定；以下的請求與 SQL 查詢會驗證傳遞。

![LiteLLM 中已列出為已設定 logging callback 的 Databricks Zerobus](/img/zerobus/litellm-active.png)

## 6. 透過 LiteLLM 送出請求 {#6-send-a-request-through-litellm}

從可連線到您已部署 gateway 的用戶端，使用第 1 步的 base URL 與 virtual key 送出 chat completion。請在下方選擇 Python、JavaScript 或 cURL，並將 `your-model-alias` 替換為該金鑰已授權的既有 model alias。每個範例都會送出相同的請求並列印其回應 ID。

<Tabs>
<TabItem value="python" label="Python" default>

在您的用戶端環境中安裝 [OpenAI Python SDK](https://github.com/openai/openai-python)：

```bash
python3 -m pip install openai
```

將下列內容儲存為 `zerobus_request.py`：

```python title="zerobus_request.py"
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LITELLM_API_KEY"],
    base_url=f'{os.environ["LITELLM_BASE_URL"]}/v1',
)

response = client.chat.completions.create(
    model="your-model-alias",
    messages=[
        {"role": "user", "content": "Reply with: Zerobus integration verified."}
    ],
    user="zerobus-quickstart",
    extra_body={"metadata": {"tags": ["zerobus-quickstart"]}},
)

print("Response ID:", response.id)
print("Assistant:", response.choices[0].message.content)
```

從您設定 `LITELLM_BASE_URL` 和 `LITELLM_API_KEY` 的環境中執行它：

```bash
python3 zerobus_request.py
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

在您的 Node.js 專案中安裝 [OpenAI JavaScript SDK](https://github.com/openai/openai-node)：

```bash
npm install openai
```

將下列內容儲存為 `zerobus-request.mjs`：

```javascript title="zerobus-request.mjs"
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: `${process.env.LITELLM_BASE_URL}/v1`,
});

const response = await client.chat.completions.create({
  model: "your-model-alias",
  messages: [
    { role: "user", content: "Reply with: Zerobus integration verified." },
  ],
  user: "zerobus-quickstart",
  metadata: { tags: ["zerobus-quickstart"] },
});

console.log("Response ID:", response.id);
console.log("Assistant:", response.choices[0].message.content);
```

從您設定 `LITELLM_BASE_URL` 和 `LITELLM_API_KEY` 的環境中執行它：

```bash
node zerobus-request.mjs
```

</TabItem>
<TabItem value="curl" label="cURL">

此範例使用 cURL 送出請求，並使用 `jq` 列印回應 ID 與 assistant 訊息。請從您設定 `LITELLM_BASE_URL` 和 `LITELLM_API_KEY` 的環境中執行它：

```bash
curl --fail-with-body --silent --show-error \
  "${LITELLM_BASE_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model-alias",
    "messages": [
      {"role": "user", "content": "Reply with: Zerobus integration verified."}
    ],
    "user": "zerobus-quickstart",
    "metadata": {"tags": ["zerobus-quickstart"]}
  }' > zerobus-response.json

jq -r '"Response ID: \(.id)", "Assistant: \(.choices[0].message.content)"' \
  zerobus-response.json
```

</TabItem>
</Tabs>

儲存列印出的回應 ID。`user` 值可讓您在資料表的 `end_user` 欄中輕鬆找到這個請求；`metadata.tags` 會為之後的分析標記這個請求。

如果您的 gateway 有資料庫，請在 Admin UI 中開啟 **Logs** 並選取該請求以檢查其狀態、token 數量與成本。資料庫請求記錄與 Zerobus 傳遞是分開的；請在下一步驗證目的地資料表。

![LiteLLM 中的成功完成畫面，顯示請求識別、token 使用量與成本](/img/zerobus/litellm-request.png)

*此範例請求使用了 22 個 prompt tokens 與 10 個 completion tokens。您的模型與使用量可能不同。*

## 7. 在 Databricks 中驗證請求 {#7-verify-the-request-in-databricks}

在預設設定下，請至少等待 10 秒讓下一次 gateway flush 完成，接著再等待 Databricks 擷取與查詢可見性。僅有成功的模型回應並不能確認已傳遞到資料表。

在 Databricks SQL Editor 或 SQL notebook cell 中執行此查詢，並將回應 ID 佔位符替換為第 6 步傳回的精確值：

```sql
SELECT
  id,
  status,
  model,
  end_user,
  prompt_tokens,
  completion_tokens,
  total_tokens,
  response_cost,
  start_time
FROM my_catalog.my_schema.litellm_traces
WHERE id = '<response-id-from-step-6>'
ORDER BY start_time DESC;
```

結果應包含您的回應 ID、`status = 'success'`、`end_user = 'zerobus-quickstart'`，以及該模型呼叫的使用量。成本取決於模型設定的定價。如果沒有出現任何資料列，請在另一個 flush 間隔後重新執行查詢，並使用下方的疑難排解表檢查 gateway 記錄。

![Databricks SQL Editor 傳回已驗證的 LiteLLM 回應 ID，並顯示成功狀態、token 數量與成本。](/img/zerobus/databricks-verification.png)

*該查詢會傳回一筆成功的資料列，且 token 數量與 LiteLLM 中顯示的相同。*

若要找出所有 quickstart 請求：

```sql
SELECT id, status, model, end_user, total_tokens, response_cost, start_time
FROM my_catalog.my_schema.litellm_traces
WHERE end_user = 'zerobus-quickstart'
ORDER BY start_time DESC
LIMIT 20;
```

## 設定參考 {#configuration-reference}

`zerobus` 回呼在 `litellm_settings.zerobus_params` 下接受可選設定。連線參數會優先於對應的環境變數，並支援 `os.environ/VARIABLE_NAME` 參照。

```yaml
litellm_settings:
  callbacks: ["zerobus"]
  zerobus_params:
    workspace_url: os.environ/ZEROBUS_WORKSPACE_URL
    server_endpoint: os.environ/ZEROBUS_SERVER_ENDPOINT
    client_id: os.environ/ZEROBUS_CLIENT_ID
    client_secret: os.environ/ZEROBUS_CLIENT_SECRET
    table_name: os.environ/ZEROBUS_TABLE_NAME
    batch_size: 100
    flush_interval: 10
    turn_off_message_logging: true
```

| 參數 | 環境備援 / 預設值 | 說明 |
| --- | --- | --- |
| `workspace_url` | `ZEROBUS_WORKSPACE_URL` | 必填。用於 OAuth 的工作區基底 URL。 |
| `server_endpoint` | `ZEROBUS_SERVER_ENDPOINT` | 必填。完整的 Zerobus URL，包含 `https://`。 |
| `client_id` | `ZEROBUS_CLIENT_ID` | 必填。service principal 應用程式 ID。 |
| `client_secret` | `ZEROBUS_CLIENT_SECRET` | 必填。service principal OAuth secret。 |
| `table_name` | `ZEROBUS_TABLE_NAME` | 必填。完整限定的 `catalog.schema.table`。 |
| `batch_size` | `100` | 正整數。觸發提早 flush 的佇列大小。 |
| `flush_interval` | `10` | 正整數。定期 flush 之間的秒數。 |
| `turn_off_message_logging` | `false` | 將 prompt 與回應內容在佇列前進行遮罩。 |

`batch_size` 是 flush 觸發條件，不是請求大小上限。flush 會送出已排入佇列的列，因此積壓可能產生較大的批次。

## 資料與隱私 {#data-and-privacy}

每個已記錄事件都包含請求識別、狀態、模型、時間、token、成本與呼叫者歸因的純量欄位。巢狀值會使用 `VARIANT` 欄。團隊、金鑰與組織欄位取決於 virtual key 與請求內容；當缺少該內容時，這些欄位可能為 null。API key 欄位包含的是雜湊值，而不是原始金鑰。

預設情況下，記錄會包含 prompt 與回應內容。將 `zerobus_params.turn_off_message_logging: true` 設為遮罩這些內容，可同時處理成功與失敗事件，但仍保留營運欄位。此設定不會移除所有可能敏感的欄位：請依照您組織的記錄政策檢視 metadata、錯誤文字、使用者識別碼與用戶端資訊。將 OAuth secret 儲存在您部署的秘密管理系統中，並透過 Unity Catalog 控制對目的地的存取。

例如，依團隊與 model 匯總支出與使用量：

```sql
SELECT
  team_alias,
  model,
  COUNT(*) AS requests,
  SUM(total_tokens) AS tokens,
  SUM(response_cost) AS spend_usd
FROM my_catalog.my_schema.litellm_traces
WHERE start_time >= current_timestamp() - INTERVAL 1 DAY
  AND status = 'success'
GROUP BY team_alias, model
ORDER BY spend_usd DESC;
```

## 傳遞行為 {#delivery-behavior}

此整合會非同步送出記錄，並將其佇列保留在程序記憶體中。網路錯誤與 HTTP `408`、`429`、`500`、`502`、`503` 及 `504` 會保留該批次，供之後的 flush 使用。insert `401` 會捨棄快取的 token，並使用新的 token 重試該批次。其他不可重試的回應會丟棄被拒絕的批次並記錄原因。

若請求已被接受但其回應遺失，重試可能造成重複資料列。程序終止、永久拒絕或佇列溢位都可能導致記錄遺失。每個 logger 的佇列上限為 50,000 列，因此此回呼不提供持久傳遞保證。Zerobus 記錄錯誤會與模型回應分開處理。建置需要唯一事件的報表時，請監控 gateway 記錄失敗，並依您的請求識別碼去重。

LiteLLM 會自動取得 OAuth token，並在到期前更新。當輪替儲存在 gateway 程序環境中的憑證時，請更新已部署的 secret 並重新啟動受影響的程序。使用 Admin UI 時，請更新回呼的連線設定。

## 疑難排解 {#troubleshooting}

檢查您已部署的閘道容器或服務記錄中是否有 `zerobus:` 訊息以及 `CustomLogger` 批次 flush 訊息。如果需要更多詳細資訊，請暫時在閘道部署中將 `LITELLM_LOG=DEBUG` 設為 debug，並透過您的正常發布流程套用變更。完成整合診斷後，請還原先前的記錄等級，因為 debug 記錄可能包含請求詳細資訊。

| 症狀 | 應檢查項目 |
| --- | --- |
| 閘道無法初始化回呼 | 設定全部五個必要的連線值。請在端點中包含 `https://`，並使用三段式資料表名稱。 |
| `token request returned 401: invalid_authorization_details` | 直接將步驟 4 中的明確授權重新套用到應用程式 ID。確認資料表位於用來鑄造 token 的工作區中。 |
| OAuth 驗證失敗 | 檢查 client ID、密鑰值與到期時間、工作區存取權，以及該密鑰是否能請求 `all-apis` scope。 |
| `insert returned 400`，且本文為空 | 檢查端點的數字工作區 ID 與區域是否屬於 `ZEROBUS_WORKSPACE_URL`。錯誤的端點可能導致此回應。 |
| `Record decoder/encoder error` | 將目的地欄位與型別和正在執行的 LiteLLM 版本中的 `create_table_sql(...)` 進行比較，包括巢狀的 `VARIANT` 欄位。 |
| SQL Editor 回報 `INSUFFICIENT_PERMISSIONS` | 已登入的讀者需要 `USE CATALOG`、`USE SCHEMA` 和 `SELECT`。即使不同的瀏覽器使用者無法查詢資料表，擷取仍可能成功。 |
| 請求成功但沒有出現任何列 | 先允許一個 flush 間隔加上擷取時間，重新執行查詢，並檢查已部署閘道的 token 與插入錯誤。確認每個複本都具有整合設定，且查詢的資料表符合 `ZEROBUS_TABLE_NAME`。 |
| 測試請求回傳 `401` 或 `403` | 檢查虛擬金鑰是否屬於此 LiteLLM 部署、是否有效，以及是否已獲授權使用所請求的模型別名。 |
| 有成功結果但沒有失敗結果 | Admin UI 會註冊成功回呼。對於成功與失敗事件，請使用 `litellm_settings.callbacks: ["zerobus"]`。在 model-call 記錄前遭拒絕的失敗可能不會產生任何資料列。 |
| 重複重試或佇列溢位 | 檢查網路可達性與 Databricks 回應。先解決目的地錯誤，再讓記憶體內佇列達到其限制。 |

如需其他回呼，請參閱 [LiteLLM 記錄指南](https://docs.litellm.ai/docs/proxy/logging)；如需服務設定，請參閱 [Databricks Zerobus Ingest](https://docs.databricks.com/aws/en/ingestion/zerobus-ingest)。
