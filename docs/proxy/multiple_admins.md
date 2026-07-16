import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';


# ✨ 稽核記錄 {#-audit-logs}

<Image 
  img={require('../../img/release_notes/ui_audit_log.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

身為 Proxy 管理員，您可以檢查某個實體（金鑰、團隊、使用者、模型）是否以及何時被建立、更新、刪除或重新產生，以及是誰執行了該動作。這對於稽核與法規遵循很有用。

LiteLLM 會追蹤以下實體與動作的變更：

- **實體：** 金鑰、團隊、使用者、模型
- **動作：** 建立、更新、刪除、重新產生

:::tip

需要 Enterprise License，請與我們聯繫 [這裡](https://enterprise.litellm.ai/demo)

:::

## 用法 {#usage}

### 1. 開啟稽核記錄 {#1-switch-on-audit-logs}
將 `store_audit_logs` 加到您的 litellm config.yaml，然後啟動 proxy
```shell
litellm_settings:
  store_audit_logs: true
```

### 2. 對某個實體進行變更 {#2-make-a-change-to-an-entity}

在此範例中，我們將刪除一個金鑰。

```shell
curl -X POST 'http://0.0.0.0:4000/key/delete' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'Content-Type: application/json' \
    -d '{
        "key": "d5265fc73296c8fea819b4525590c99beab8c707e465afdf60dab57e1fa145e4"
    }'
```

### 3. 在 LiteLLM UI 上檢視稽核記錄 {#3-view-the-audit-log-on-litellm-ui}

在 LiteLLM UI 中，前往 Logs -> Audit Logs。您應該會看到該金鑰刪除的稽核記錄。

<Image 
  img={require('../../img/key_delete.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

## 將稽核記錄匯出到外部儲存體 {#export-audit-logs-to-external-storage}

除了將稽核記錄儲存在資料庫中之外，您也可以將其匯出到外部儲存後端（例如 S3）。記錄會批次處理並非同步上傳，因此不會阻塞您的 proxy 請求。

### S3 範例 {#s3-example}

將 `audit_log_callbacks` 和 `s3_callback_params` 加到您的 `litellm_settings`：

```yaml
litellm_settings:
  store_audit_logs: true
  audit_log_callbacks: ["s3_v2"]
  s3_callback_params:
    s3_bucket_name: my-audit-logs-bucket     # AWS Bucket Name
    s3_region_name: us-west-2                # AWS Region
    s3_aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
    s3_aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    s3_path: litellm-audit                   # [OPTIONAL] prefix path in the bucket
```

稽核記錄會以 JSON 檔案寫入至：

```
s3://<bucket>/audit_logs/<YYYY-MM-DD>/<HH-MM-SS>_<audit-log-id>.json
# or, when s3_path is set:
s3://<bucket>/<s3_path>/audit_logs/<YYYY-MM-DD>/<HH-MM-SS>_<audit-log-id>.json
```

:::info

`store_audit_logs: true` 與 `audit_log_callbacks` 都必須設定。如果未啟用 `store_audit_logs`，回呼將不會觸發。

:::

### 將稽核記錄傳送到不同的 S3 儲存桶 {#send-audit-logs-to-a-separate-s3-bucket}

如果您也透過 `callbacks: ["s3_v2"]` 將一般請求/回應記錄傳送到 S3，預設情況下兩個串流會共用 `s3_callback_params` 並落在同一個儲存桶中。若要將稽核記錄傳送到不同的儲存桶（例如僅供法遵使用、具有更嚴格存取控制或更長保留期限的儲存桶），請新增一個 `s3_audit_callback_params` 區塊。它接受與 `s3_callback_params` 相同的欄位，且只適用於稽核記錄。

```yaml
litellm_settings:
  store_audit_logs: true
  callbacks: ["s3_v2"]                       # normal request logs
  audit_log_callbacks: ["s3_v2"]             # audit logs

  s3_callback_params:                        # used for normal logs
    s3_bucket_name: my-llm-logs-bucket
    s3_region_name: us-west-2
    s3_aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
    s3_aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    s3_path: litellm-logs

  s3_audit_callback_params:                  # used for audit logs only
    s3_bucket_name: my-audit-logs-bucket
    s3_region_name: us-east-1                # different region OK
    s3_aws_access_key_id: os.environ/AWS_AUDIT_ACCESS_KEY_ID  # different creds OK
    s3_aws_secret_access_key: os.environ/AWS_AUDIT_SECRET_ACCESS_KEY
    s3_path: litellm-audit
```

## 進階 {#advanced}

### 對使用者的屬性管理變更 {#attribute-management-changes-to-users}

代表使用者呼叫管理端點。（在將 proxy 連接到您的開發平台時很有用）。

## 1. 在請求標頭中設定 `LiteLLM-Changed-By` {#1-set-litellm-changed-by-in-request-headers}

在呼叫管理端點時，請在請求標頭中設定 'user_id'。[檢視完整清單](https://litellm-api.up.railway.app/#/team%20management)。

- 使用 master key 更新 Team 預算。
- 屬性變更為 'krrish@berri.ai'。

**👉 關鍵變更：** 傳遞 `-H 'LiteLLM-Changed-By: krrish@berri.ai'`

```shell
curl -X POST 'http://0.0.0.0:4000/team/update' \
    -H 'Authorization: Bearer sk-1234' \
    -H 'LiteLLM-Changed-By: krrish@berri.ai' \
    -H 'Content-Type: application/json' \
    -d '{
        "team_id" : "8bf18b11-7f52-4717-8e1f-7c65f9d01e52",
        "max_budget": 2000
    }'
```

## 2. 產生的稽核記錄 {#2-emitted-audit-log}

```bash
{
   "id": "bd136c28-edd0-4cb6-b963-f35464cf6f5a",
   "updated_at": "2024-06-08 23:41:14.793",
   "changed_by": "krrish@berri.ai", # 👈 CHANGED BY
   "changed_by_api_key": "example-api-key-123",
   "action": "updated",
   "table_name": "LiteLLM_TeamTable",
   "object_id": "8bf18b11-7f52-4717-8e1f-7c65f9d01e52",
   "before_value": {
     "spend": 0,
     "max_budget": 0,
   },
   "updated_values": {
     "team_id": "8bf18b11-7f52-4717-8e1f-7c65f9d01e52",
     "max_budget": 2000 # 👈 CHANGED TO
   },
 }
```

## 稽核記錄的 API 規格 {#api-spec-of-audit-log}

### `id` {#id}
- **型別：** `String`
- **說明：** 這是每個稽核記錄項目的唯一識別碼。預設會自動產生為 UUID（Universally Unique Identifier）。

### `updated_at` {#updated_at}
- **型別：** `DateTime`
- **說明：** 此欄位儲存稽核記錄項目建立或更新時的時間戳記。預設會自動設為目前的日期與時間。

### `changed_by` {#changed_by}
- **型別：** `String`
- **說明：** 執行被稽核動作的 `user_id`。如果傳入 `LiteLLM-Changed-By` 標頭，則 `changed_by=<value passed for LiteLLM-Changed-By header>`

### `changed_by_api_key` {#changed_by_api_key}
- **型別：** `String`
- **說明：** 此欄位儲存用來執行被稽核動作的雜湊 API 金鑰。若留白，預設為空字串。

### `action` {#action}
- **型別：** `String`
- **說明：** 執行的動作類型。為 "create"、"update" 或 "delete" 其中之一。

### `table_name` {#table_name}
- **型別：** `String`
- **說明：** 此欄位儲存受被稽核動作影響的資料表名稱。可為下列值之一：`LiteLLM_TeamTable`、`LiteLLM_UserTable`、`LiteLLM_VerificationToken`

### `object_id` {#object_id}
- **型別：** `String`
- **說明：** 此欄位儲存受被稽核動作影響的物件 ID。可以是 key ID、team ID、user ID

### `before_value` {#before_value}
- **型別：** `Json?`
- **說明：** 此欄位儲存執行被稽核動作前該資料列的值。此欄位為選用，可為 null。

### `updated_values` {#updated_values}
- **型別：** `Json?`
- **說明：** 此欄位儲存執行被稽核動作後已更新的資料列值
