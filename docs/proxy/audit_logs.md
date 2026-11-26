import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';


# 稽核記錄 {#audit-logs}

<Image 
  img={require('../../img/release_notes/ui_audit_log.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>


身為 Proxy Admin，您可以查看某個實體（金鑰、團隊、使用者、模型、防護欄）是否以及何時被建立、更新、刪除或重新產生，以及由誰執行該動作。這對稽核與合規很有用。

LiteLLM 會追蹤以下實體與動作的變更：

- **實體：** Keys、Teams、Users、Models、Guardrails
- **動作：** Create、Update、Delete、Regenerate

<EnterpriseFeature />

## 使用方式 {#usage}

### 1. 開啟稽核記錄 {#1-switch-on-audit-logs} 
使用 Enterprise 授權時，稽核記錄預設開啟，因此不需要任何設定。若想明確設定，請在您的 litellm config.yaml 中加入 `store_audit_logs`，然後啟動 proxy。沒有 Enterprise 授權時，無論此設定為何，proxy 都不會寫入稽核記錄
```shell
litellm_settings:
  store_audit_logs: true
```

若要在 Enterprise 授權下關閉稽核記錄，請明確將其設為 `false`，它會優先於預設值。`LITELLM_STORE_AUDIT_LOGS` 的作用與設定相同，且會在設定未指定 `store_audit_logs` 時讀取

```shell
litellm_settings:
  store_audit_logs: false
```

### 2. 對實體進行變更 {#2-make-a-change-to-an-entity}

在此範例中，我們將刪除一個金鑰。

```shell
curl -X POST 'http://0.0.0.0:4000/key/delete' \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
        "key": "d5265fc73296c8fea819b4525590c99beab8c707e465afdf60dab57e1fa145e4"
    }'
```

### 3. 在 LiteLLM UI 上查看稽核記錄 {#3-view-the-audit-log-on-litellm-ui}

在 LiteLLM UI 上，前往 Logs -> Audit Logs。您應該會看到金鑰刪除的稽核記錄。

<Image 
  img={require('../../img/key_delete.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>


## 稽核記錄寫入失敗時 <SinceVersion v="1.113.0" /> {#when-an-audit-log-write-fails-sinceversion-v11130-}

即使資料庫無法儲存稽核記錄，對金鑰、團隊、使用者、模型或其他受稽核物件的變更仍會成功。Proxy 會記錄一則警告，然後在背景重試寫入，最長 30 秒。若仍無法儲存該筆記錄，Proxy 會將其記錄為錯誤並附上物件名稱，同時計入 `litellm_callback_logging_failures_metric`（`callback_name="audit_log_database"`），以便您針對遺失的稽核記錄發出警示：

```yaml
groups:
  - name: litellm-audit
    rules:
      - alert: AuditLogEntriesLost
        expr: increase(litellm_callback_logging_failures_metric_total{callback_name="audit_log_database"}[5m]) > 0
```

若資料庫停機超過重試期間，只要過去 5 分鐘內有任何記錄遺失，此規則就會觸發，而 Proxy 記錄中會針對每一筆顯示 `Failed Creating audit log for <action> <table> <object id>`。

## 將稽核記錄匯出至外部儲存 {#export-audit-logs-to-external-storage}

除了將稽核記錄儲存在資料庫中，您也可以將其匯出至外部儲存後端（例如 S3）。記錄會批次處理並以非同步方式上傳，因此不會阻擋您的 proxy 請求。

### S3 範例 {#s3-example}

在您的 `litellm_settings` 中加入 `audit_log_callbacks` 與 `s3_callback_params`：

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

稽核記錄會以 JSON 檔案寫入：

```
s3://<bucket>/audit_logs/<YYYY-MM-DD>/<HH-MM-SS>_<audit-log-id>.json
# or, when s3_path is set:
s3://<bucket>/<s3_path>/audit_logs/<YYYY-MM-DD>/<HH-MM-SS>_<audit-log-id>.json
```

:::info

只有在 Enterprise 授權下啟用稽核記錄時，`audit_log_callbacks` 才會觸發；除非 `store_audit_logs` 設為 `false`，或它未設定且 `LITELLM_STORE_AUDIT_LOGS` 為 `false`，否則預設為啟用。

:::

### 將稽核記錄傳送至獨立的 S3 Bucket {#send-audit-logs-to-a-separate-s3-bucket}

若您也透過 `callbacks: ["s3_v2"]` 將一般的請求/回應記錄傳送至 S3，預設情況下兩個串流會共享 `s3_callback_params` 並落在同一個 bucket。若要將稽核記錄傳送至不同的 bucket（例如存取控制更嚴格或保留期更長的僅合規用 bucket），請加入 `s3_audit_callback_params` 區塊。它接受與 `s3_callback_params` 相同的欄位，且僅適用於稽核記錄。

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

### 將管理變更歸屬給使用者 {#attribute-management-changes-to-users}

代表使用者呼叫管理端點，並讓稽核記錄將變更歸屬給他們，而不是呼叫金鑰的 `user_id`。（將 proxy 連接到您的開發平台時很有用）。

:::warning[自 v1.84.0 起，該標頭需要先選擇啟用]

在 v1.84.0 之前，`LiteLLM-Changed-By` 標頭是無條件被接受的，這讓任何呼叫者都能重寫稽核歸屬。自 v1.84.0 起，除非呼叫金鑰或其團隊在其 metadata 中有 `allow_litellm_changed_by_header: true`，否則 proxy 會忽略該標頭；沒有選擇啟用時，`changed_by` 會回退為呼叫金鑰的 `user_id`。主金鑰無法選擇啟用，因為它沒有已儲存的 metadata，因此請使用管理員 Virtual Key 傳送該標頭

:::

#### 1. 允許您的管理員金鑰設定該標頭 {#1-allow-your-admin-key-to-set-the-header}

在將傳送該標頭的管理員 Virtual Key 的 metadata 中設定 `allow_litellm_changed_by_header: true`。改為設定在金鑰的團隊 metadata 上，會讓該團隊上的每個金鑰都選擇啟用

```shell
curl -X POST 'http://0.0.0.0:4000/key/update' \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
        "key": "sk-my-admin-key",
        "metadata": {"allow_litellm_changed_by_header": true}
    }'
```

#### 2. 在請求標頭中設定 `LiteLLM-Changed-By` {#2-set-litellm-changed-by-in-request-headers}

呼叫管理端點時，在請求標頭中設定 'user_id'。[查看完整清單](https://docs.litellm.ai/api-reference/#tag/team~20management)。

- 使用已選擇啟用的管理員金鑰更新團隊預算。 
- 將變更歸屬給 'krrish@berri.ai'。 

**關鍵變更：** 傳入 `-H 'LiteLLM-Changed-By: krrish@berri.ai'`

```shell
curl -X POST 'http://0.0.0.0:4000/team/update' \
    -H 'Authorization: Bearer sk-my-admin-key' \
    -H 'LiteLLM-Changed-By: krrish@berri.ai' \
    -H 'Content-Type: application/json' \
    -d '{
        "team_id" : "8bf18b11-7f52-4717-8e1f-7c65f9d01e52",
        "max_budget": 2000
    }'
```

#### 3. 發出的稽核記錄 {#3-emitted-audit-log} 

```bash
{
   "id": "bd136c28-edd0-4cb6-b963-f35464cf6f5a",
   "updated_at": "2024-06-08 23:41:14.793",
   "changed_by": "krrish@berri.ai", # CHANGED BY
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
     "max_budget": 2000 # CHANGED TO
   },
 }
```

## 稽核記錄的 API 規格 {#api-spec-of-audit-log} 


### `id` {#id}
- **類型：** `String`
- **說明：** 這是每個稽核記錄條目的唯一識別碼。預設會自動產生為 UUID（Universally Unique Identifier）。

### `updated_at` {#updated_at}
- **類型：** `DateTime`
- **說明：** 此欄位儲存稽核記錄條目建立或更新的時間戳記。預設會自動設為目前的日期與時間。

### `changed_by` {#changed_by}
- **類型：** `String`
- **說明：** 執行受稽核動作的 `user_id`。若傳入 `LiteLLM-Changed-By` 標頭，且呼叫金鑰或其團隊在其 metadata 中有 `allow_litellm_changed_by_header: true`，則 `changed_by=<為 LiteLLM-Changed-By 標頭傳入的值>`

### `changed_by_api_key` {#changed_by_api_key}
- **類型：** `String`
- **說明：** 此欄位儲存用來執行受稽核動作的已雜湊 API 金鑰。若留空，預設為空字串。

### `action` {#action}
- **類型：** `String`
- **說明：** 所執行動作的類型。「create」、「update」或「delete」之一。

### `table_name` {#table_name}
- **類型：** `String`
- **說明：** 此欄位儲存受稽核動作影響的資料表名稱。它可以是以下值之一：`LiteLLM_TeamTable`、`LiteLLM_UserTable`、`LiteLLM_VerificationToken`、`LiteLLM_GuardrailsTable`


### `object_id` {#object_id}
- **類型：** `String`
- **說明：** 此欄位儲存受稽核動作影響的物件 ID。它可以是金鑰 ID、團隊 ID、使用者 ID

### `before_value` {#before_value}
- **類型：** `Json?`
- **說明：** 此欄位儲存執行受稽核動作前該列的值。它是選用的，可以為 null。

### `updated_values` {#updated_values}
- **類型：** `Json?`
- **說明：** 此欄位儲存執行受稽核動作後該列被更新的值