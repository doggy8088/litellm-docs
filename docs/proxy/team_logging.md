import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 依團隊/金鑰的記錄 {#teamkey-based-logging}

## 概覽 {#overview}

允許每個金鑰/團隊使用各自的 Langfuse 專案／自訂回呼。這可讓記錄與合規需求具備更細緻的控制。

**範例使用情境：**
```showLineNumbers title="Team Based Logging"
Team 1 -> Logs to Langfuse Project 1 
Team 2 -> Logs to Langfuse Project 2
Team 3 -> Disabled Logging (for GDPR compliance)
```

## 支援的記錄整合 {#supported-logging-integrations}
- `langfuse`
- `gcs_bucket`
- `langsmith`
- `arize`

## [BETA] 團隊記錄 {#beta-team-logging}

<EnterpriseFeature />

### UI 使用方式 {#ui-usage}

1. 建立具有記錄設定的團隊

建立一個名為「AI Agents」的團隊
<Image 
  img={require('../../img/team_logging1.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

2. 為團隊建立一個金鑰

我們將為團隊「AI Agents」建立一個金鑰。團隊記錄設定將套用於為該團隊建立的所有金鑰。

<Image 
  img={require('../../img/team_logging2.png')}
  style={{width: '80%', display: 'block', margin: '2rem auto', border: '1px solid #E5E7EB'}}
/>

<br />

3. 發出測試 LLM API 請求 

使用新金鑰發出測試 LLM API 請求，我們預期會在步驟 1 中設定的記錄提供者上看到記錄。

<Image 
  img={require('../../img/team_logging3.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

4. 在您的記錄提供者上檢查記錄 

前往您已設定的記錄提供者，並確認是否已收到步驟 2 的記錄。

<Image 
  img={require('../../img/team_logging4.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

### API 使用方式 {#api-usage}

#### 誰可以呼叫這些 {#who-can-call-these}

代理程式管理員、該團隊所屬組織的組織管理員，以及團隊本身的管理員，都可以列出、設定和移除該團隊的回呼。其他所有人都會收到 `403`，而某個團隊的管理員不能讀取其他團隊的回呼。

`POST /team/{team_id}/disable_logging` 是例外：它仍然只限代理程式管理員。想要關閉某個整合的團隊管理員會使用 `DELETE /team/{team_id}/callback/{callback_name}`。

### 為每個團隊設定回呼 {#set-callbacks-per-team}

#### 1. 為團隊設定回呼  {#1-set-callback-for-team}

我們向 `POST /team/{team_id}/callback` 發出請求，以新增回呼到

```shell
curl -X POST 'http:/localhost:4000/team/dbe2f686-a686-4896-864a-4c3924458709/callback' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "callback_name": "langfuse",
  "callback_type": "success",
  "callback_vars": {
    "langfuse_public_key": "pk", 
    "langfuse_secret_key": "sk_", 
    "langfuse_host": "https://cloud.langfuse.com"
    }
  
}'
```

##### 支援的值 {#supported-values}

| 欄位 | 支援的值 | 備註 |
|-------|------------------|-------|
| `callback_name` | `"langfuse"`, `"gcs_bucket"`| 目前僅支援 `"langfuse"`、`"gcs_bucket"` |
| `callback_type` | `"success"`, `"failure"`, `"success_and_failure"` | |
| `callback_vars` | | 回呼設定的 dict |
| &nbsp;&nbsp;&nbsp;&nbsp;`langfuse_public_key` | string | Langfuse 必填 |
| &nbsp;&nbsp;&nbsp;&nbsp;`langfuse_secret_key` | string | Langfuse 必填 |
| &nbsp;&nbsp;&nbsp;&nbsp;`langfuse_host` | string | Langfuse 選填（預設為 https://cloud.langfuse.com |
| &nbsp;&nbsp;&nbsp;&nbsp;`gcs_bucket_name` | string | GCS Bucket 必填。您的 GCS bucket 名稱 |
| &nbsp;&nbsp;&nbsp;&nbsp;`gcs_path_service_account` | string | GCS Bucket 必填。您的服務帳戶 json 路徑 |

#### 2. 為團隊建立金鑰 {#2-create-key-for-team}

為團隊 `dbe2f686-a686-4896-864a-4c3924458709` 建立的所有金鑰，都會記錄到 [步驟 1. 為團隊設定回呼](#1-set-callback-for-team) 中指定的 langfuse 專案

```shell
curl --location 'http://0.0.0.0:4000/key/generate' \
    --header "Authorization: Bearer $LITELLM_API_KEY" \
    --header 'Content-Type: application/json' \
    --data '{
        "team_id": "dbe2f686-a686-4896-864a-4c3924458709"
}'
```

#### 3. 為團隊發出 `/chat/completion` 請求 {#3-make-chatcompletion-request-for-team}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-KbUuE0WNptC0jXapyMmLBA" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ]
}'
```

預期會記錄到 [步驟 1. 為團隊設定回呼](#1-set-callback-for-team) 中指定的 langfuse 專案

### 停用團隊的記錄 {#disable-logging-for-a-team}

若要停用特定團隊的記錄，您可以使用以下端點：

`POST /team/{team_id}/disable_logging`

此端點會移除指定團隊的所有成功與失敗回呼，實際上等同停用記錄。若要移除單一整合並保留團隊的其他回呼繼續執行，請改用下方文件所述的 `DELETE /team/{team_id}/callback/{callback_name}`。

#### 步驟 1. 停用團隊的記錄 {#step-1-disable-logging-for-team}

```shell
curl -X POST 'http://localhost:4000/team/YOUR_TEAM_ID/disable_logging' \
    -H 'Authorization: Bearer YOUR_API_KEY'
```
將 YOUR_TEAM_ID 替換為實際的團隊 ID

**回應**
成功的請求會回傳類似以下的回應：
```json
{
    "status": "success",
    "message": "Logging disabled for team YOUR_TEAM_ID",
    "data": {
        "team_id": "YOUR_TEAM_ID",
        "success_callbacks": [],
        "failure_callbacks": []
    }
}
```

#### 步驟 2. 測試它 - `/chat/completions` {#step-2-test-it---chatcompletions}

使用為團隊 = `team_id` 所建立的金鑰 - 您應該不會在已設定的成功回呼（例如 Langfuse）上看到任何記錄

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-KbUuE0WNptC0jXapyMmLBA" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "Hello, Claude gm!"}
    ]
}'
```

#### 除錯 / 疑難排解 {#debugging--troubleshooting}

- 使用 `GET /team/{team_id}/callback` 檢查團隊的有效回呼

用這個來檢查團隊=`team_id` 目前啟用了哪些成功/失敗回呼

```shell
curl -X GET 'http://localhost:4000/team/dbe2f686-a686-4896-864a-4c3924458709/callback' \
        -H "Authorization: Bearer $LITELLM_API_KEY"
```

### 從團隊移除單一回呼 {#remove-a-single-callback-from-a-team}

若要在保留團隊其他回呼持續執行的同時，取消註冊一個整合，請使用：

`DELETE /team/{team_id}/callback/{callback_name}`

在該 `callback_name` 底下註冊的每個項目都會被移除，涵蓋所有回呼類型，因此同時註冊於 `success` 和 `failure` 的整合，只需一次呼叫即可取消註冊。回應會列出仍然保留的回呼，而團隊尚未註冊的 `callback_name` 會回傳 `404`，且不會改變任何內容

### 團隊記錄端點 {#team-logging-endpoints}

- [`POST /team/{team_id}/callback` 將成功／失敗回呼新增至團隊](https://docs.litellm.ai/api-reference/#/team%20management/add_team_callbacks_team__team_id__callback_post)
- [`GET /team/{team_id}/callback` - 取得團隊的成功／失敗回呼與變數](https://docs.litellm.ai/api-reference/#/team%20management/get_team_callbacks_team__team_id__callback_get)
- [`DELETE /team/{team_id}/callback/{callback_name}` - 從團隊移除單一回呼](https://docs.litellm.ai/api-reference/#/team%20management/delete_team_callback_team__team_id__callback__callback_name__delete)
- [`POST /team/{team_id}/disable_logging` - 移除團隊中的每個回呼](https://docs.litellm.ai/api-reference/#/team%20management/disable_team_logging_team__team_id__disable_logging_post)

## 團隊記錄 - `config.yaml` {#team-logging---configyaml}

開啟/關閉特定團隊 ID 的記錄與快取。

這一節僅限團隊範圍：`litellm_settings.default_team_settings` 會為屬於某個團隊 ID 的每個金鑰設定回呼。沒有 `config.yaml` 可用來宣告個別虛擬金鑰；每個金鑰的回呼是透過 `/key/generate` 或 `/key/update` API 提供，詳見 [以金鑰為基礎的記錄](#beta-key-based-logging)。

由於 `config.yaml` 是受信任、由操作者控制的設定，因此這裡支援 `os.environ/...` 參照，並會在啟動時從 proxy 的環境中解析。相同的參照若透過管理 API 傳入則會被拒絕（請參見 [API 提供之回呼的機密處理](#secret-handling-for-api-provisioned-callbacks)）。

**範例：**

這個設定會依團隊 ID 將 langfuse 記錄傳送到 2 個不同的 langfuse 專案

```yaml
litellm_settings:
  default_team_settings: 
    - team_id: "dbe2f686-a686-4896-864a-4c3924458709"
      success_callback: ["langfuse"]
      langfuse_public_key: os.environ/LANGFUSE_PUB_KEY_1 # Project 1
      langfuse_secret: os.environ/LANGFUSE_PRIVATE_KEY_1 # Project 1
    - team_id: "06ed1e01-3fa7-4b9e-95bc-f2e59b74f3a8"
      success_callback: ["langfuse"]
      langfuse_public_key: os.environ/LANGFUSE_PUB_KEY_2 # Project 2
      langfuse_secret: os.environ/LANGFUSE_SECRET_2 # Project 2
```

現在，當您為這個 team-id [產生金鑰](./virtual_keys.md) 時

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{"team_id": "06ed1e01-3fa7-4b9e-95bc-f2e59b74f3a8"}'
```

所有使用這些金鑰發出的請求，都會將資料記錄到其團隊專屬的記錄。

## [BETA] 依金鑰的記錄  {#beta-key-based-logging}

使用 `/key/generate` 或 `/key/update` 端點，為特定金鑰新增記錄回呼。

<EnterpriseFeature />

**依金鑰記錄的運作方式：**

- 如果 **Key 沒有設定回呼**，將使用 config.yaml 檔案中指定的預設回呼
- 如果 **Key 已設定回呼**，將使用金鑰中指定的回呼

### UI 使用方式  {#ui-usage-1}

1. 建立具有記錄設定的金鑰

在建立金鑰時，您可以為該金鑰設定特定的記錄設定。這些記錄設定將用於使用此金鑰發出的所有請求。

<Image 
  img={require('../../img/key_logging.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>
<br />

2. 發出測試 LLM API 請求 

使用新金鑰發出測試 LLM API 請求，我們預期會在步驟 1 中設定的記錄提供者上看到記錄。

<Image 
  img={require('../../img/key_logging2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

3. 在您的記錄提供者上檢查記錄 

前往您已設定的記錄提供者，並確認是否已收到步驟 2 的記錄。

<Image 
  img={require('../../img/key_logging_arize.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

<br />

### API 使用方式 {#api-usage-1}

<Tabs>
<TabItem label="Langfuse" value="langfuse">

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "logging": [{
            "callback_name": "langfuse", # "otel", "gcs_bucket"
            "callback_type": "success", # "success", "failure", "success_and_failure"
            "callback_vars": {
                "langfuse_public_key": "pk-lf-...", # pass the resolved value, not an os.environ/ reference
                "langfuse_secret_key": "sk-lf-...", # pass the resolved value, not an os.environ/ reference
                "langfuse_host": "https://cloud.langfuse.com"
            }
        }]
    }
}'

```

每個金鑰都可以指向不同的 Langfuse 專案：為每個專案產生一個金鑰，並在 `callback_vars` 中傳入該專案的憑證。

#### API 提供之回呼的機密處理 {#secret-handling-for-api-provisioned-callbacks}

API 提供的 `callback_vars` 中的 `os.environ/...` 參照會被拒絕（自 v1.84 起）。若從請求主體解析環境參照，任何具備金鑰管理存取權的呼叫者都能從 proxy 的環境中讀取任意機密，因此請求會改以驗證錯誤失敗。請在請求中傳入已解析的機密值；LiteLLM 會使用 proxy 的 salt key 將 `callback_vars` 憑證靜態加密保存。若您希望 proxy 從自己的環境中解析憑證，請在受信任的 `config.yaml` 中設定該回呼（全域設定於 `litellm_settings`，或透過 [`default_team_settings`](#team-logging---configyaml) 逐團隊設定）。

<iframe width="840" height="500" src="https://www.youtube.com/embed/8iF0Hvwk0YU" frameBorder="0" allowFullScreen></iframe>

</TabItem>
<TabItem label="GCS Bucket" value="gcs_bucket">

1. 建立虛擬金鑰，以記錄到特定的 GCS Bucket

在您的環境中設定 `GCS_SERVICE_ACCOUNT` 為服務帳戶 json 的路徑
  ```bash
  export GCS_SERVICE_ACCOUNT=/path/to/service-account.json # GCS_SERVICE_ACCOUNT=/Users/ishaanjaffer/Downloads/adroit-crow-413218-a956eef1a2a8.json
  ```

  ```bash
  curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
      "metadata": {
          "logging": [{
              "callback_name": "gcs_bucket", # "otel", "gcs_bucket"
              "callback_type": "success", # "success", "failure", "success_and_failure"
              "callback_vars": {
                  "gcs_bucket_name": "my-gcs-bucket", # Name of your GCS Bucket to log to
                  "gcs_path_service_account": "/path/to/service-account.json" # path to the service account json, not an os.environ/ reference
              }
          }]
      }
  }'

  ```

2. 測試它 - `/chat/completions` 請求

使用步驟 3 的虛擬金鑰發出 `/chat/completions` 請求

在成功請求時，您應該會在 GCS Bucket 上看到您的記錄

```shell
  curl -i http://localhost:4000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk-Fxq5XSyWKeXDKfPdqXZhPg" \
    -d '{
      "model": "fake-openai-endpoint",
      "messages": [
        {"role": "user", "content": "Hello, Claude"}
      ],
      "user": "hello",
    }'
  ```

</TabItem>

<TabItem label="Langsmith" value="langsmith">

1. 建立虛擬金鑰，以記錄到特定的 Langsmith 專案

```bash
  curl -X POST 'http://0.0.0.0:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
      "metadata": {
          "logging": [{
              "callback_name": "langsmith", # "otel", "gcs_bucket"
              "callback_type": "success", # "success", "failure", "success_and_failure"
              "callback_vars": {
                  "langsmith_api_key": "lsv2_pt_...", # resolved Langsmith API key, not an os.environ/ reference
                  "langsmith_project": "pr-brief-resemblance-72", # project name on langsmith
                  "langsmith_base_url": "https://api.smith.langchain.com"
              }
          }]
      }
  }'

  ```

2. 測試它 - `/chat/completions` 請求

使用步驟 3 的虛擬金鑰發出 `/chat/completions` 請求

在成功請求時，您應該會在您的 Langsmith 專案上看到您的記錄

```shell
  curl -i http://localhost:4000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk-Fxq5XSyWKeXDKfPdqXZhPg" \
    -d '{
      "model": "fake-openai-endpoint",
      "messages": [
        {"role": "user", "content": "Hello, Claude"}
      ],
      "user": "hello",
    }'
  ```

</TabItem>
</Tabs>

---

透過在[此處提交問題單](https://github.com/BerriAI/litellm/issues)，協助我們改善此功能

### 檢查金鑰回呼是否已正確設定 `/key/health` {#check-if-key-callbacks-are-configured-correctly-keyhealth}

使用該金鑰呼叫 `/key/health`，以檢查回呼設定是否已正確設定

將金鑰放在請求標頭中

```bash
curl -X POST "http://localhost:4000/key/health" \
  -H "Authorization: Bearer <your-key>" \
  -H "Content-Type: application/json"
```

<Tabs>
<TabItem label="金鑰設定正確時的回應" value="Response when key is configured correctly">

回呼記錄設定正確時的回應：

當記錄回呼已正確設定時，金鑰即為 **healthy**。

```json
{
  "key": "healthy",
  "logging_callbacks": {
    "callbacks": [
      "gcs_bucket"
    ],
    "status": "healthy",
    "details": "No logger exceptions triggered, system is healthy. Manually check if logs were sent to ['gcs_bucket']"
  }
}
```

</TabItem>

<TabItem label="金鑰設定不正確時的回應" value="Response when key is configured incorrectly">

當記錄回呼未正確設定時的回應

當記錄回呼未正確設定時，金鑰即為 **unhealthy**。

```json
{
  "key": "unhealthy",
  "logging_callbacks": {
    "callbacks": [
      "gcs_bucket"
    ],
    "status": "unhealthy",
    "details": "Logger exceptions triggered, system is unhealthy: Failed to load vertex credentials. Check to see if credentials containing partial/invalid information."
  }
}
```

</TabItem>
</Tabs>

### 停用/啟用訊息遮罩 {#disableenable-message-redaction}

當您已全域停用時，可使用此功能為特定金鑰啟用 prompt 記錄

全域停用 prompt 記錄（訊息遮罩）的 example config.yaml
```yaml
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
litellm_settings:
  callbacks: ["datadog"]
  turn_off_message_logging: True # 👈 Globally logging prompt / response is disabled
```

**為金鑰啟用 prompt 記錄**

將您要啟用 prompt 記錄的金鑰之 `turn_off_message_logging` 設為 `false`。這會覆寫全域的 `turn_off_message_logging` 設定。

```shell
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "metadata": {
        "logging": [{
            "callback_name": "datadog",
            "callback_vars": {
                "turn_off_message_logging": false # 👈 Enable prompt logging
            }
        }]
    }
}'
```

來自 `/key/generate` 的回應

```json
{
    "key_alias": null,
    "key": "sk-9v6I-jf9-eYtg_PwM8OKgQ",
    "metadata": {
        "logging": [
            {
                "callback_name": "datadog",
                "callback_vars": {
                    "turn_off_message_logging": false
                }
            }
        ]
    },
    "token_id": "a53a33db8c3cf832ceb28565dbb034f19f0acd69ee7f03b7bf6752f9f804081e"
}
```

將金鑰用於 `/chat/completions` 請求

此金鑰會將 prompt 記錄到請求中指定的回呼

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-9v6I-jf9-eYtg_PwM8OKgQ" \
  -d '{
    "model": "{{openai_large}}",
    "messages": [
      {"role": "user", "content": "hi my name is ishaan what key alias is this"}
    ]
  }'
```
