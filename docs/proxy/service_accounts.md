import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 服務帳戶 {#service-accounts}

如果您想建立不屬於特定使用者、而是為正式環境專案建立的 Virtual Keys，請使用此功能

為什麼要使用服務帳戶金鑰？
  - 防止使用者被刪除時，金鑰也被刪除。
  - 對金鑰套用團隊限制，而不是團隊成員限制。

## 服務帳戶與一般金鑰 {#service-account-vs-regular-keys}

| 功能 | 一般金鑰 | 服務帳戶金鑰 |
|---------|------------|-------------------|
| `user_id` | 選填 | 一律 `null` |
| `team_id` | 選填 | 必填 |
| 套用的限制 | 使用者 + 團隊限制 | 僅團隊限制 |
| 使用者被刪除時，金鑰也會被刪除嗎？ | 是 | 否 — 會保留 |
| 中的 `service_account_id` metadata | 未設定 | 一旦設定即不可變更 |
| `team_member_key_duration` | 繼承 | 不繼承 |

## 預算與限制 {#budgets--limits}

服務帳戶金鑰會在**團隊層級**套用預算與速率限制——不是按使用者或按金鑰成員。

- 在金鑰本身上設定 `max_budget`、`tpm_limit`、`rpm_limit`，或從團隊繼承。
- `team_member_key_duration`（一項控制團隊成員金鑰有效期長度的企業功能）不適用於服務帳戶金鑰。

## 使用方式 {#usage}

使用 `/key/service-account/generate` 端點來產生服務帳戶金鑰。

```bash
curl -L -X POST 'http://localhost:4000/key/service-account/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "my-unique-team"
}'
```

### `service_account_id` 欄位 {#service_account_id-field}

您可以選擇在 `metadata` 中提供 `service_account_id`，為金鑰提供穩定、可供人類閱讀的識別碼：

```bash
curl -L -X POST 'http://localhost:4000/key/service-account/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "team_id": "my-unique-team",
    "metadata": {
        "service_account_id": "my-ci-pipeline"
    }
}'
```

**不可變更規則** — 一旦設定 `service_account_id`，就無法變更：

| 操作 | 結果 |
|-----------|--------|
| 以不同值覆寫 | `400` 錯誤 |
| 明確設定為 `null` | `400` 錯誤 |
| 傳送 `metadata: null`（會將其清除） | `400` 錯誤 |
| 更新時完全省略 `metadata` | 安全 — 既有值會保留 |
| 重新傳送相同值 | 允許（無操作） |

## 範例 - 針對所有服務帳戶請求要求 `user` 參數 {#example---require-user-param-for-all-service-account-requests}

### 1. 為服務帳戶設定設定 {#1-set-settings-for-service-accounts}

如果您想建立只適用於服務帳戶金鑰的設定，請設定 `service_account_settings`

```yaml
general_settings:
    service_account_settings: 
        enforced_params: ["user"] # this means the "user" param is enforced for all requests made through any service account keys
```

### 2. 在 LiteLLM Proxy Admin UI 建立服務帳戶金鑰 {#2-create-service-account-key-on-litellm-proxy-admin-ui}

<Image img={require('../../img/create_service_account.png')} />

### 3. 測試服務帳戶金鑰  {#3-test-service-account-key}

<Tabs>

<TabItem value="Unsuccessful call" label="Unsuccessful call">

```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer <sk-your-service-account>' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "hello"
        }
    ]
}'
```

預期回應

```json
{
  "error": {
    "message": "BadRequest please pass param=user in request body. This is a required param for service account",
    "type": "bad_request_error",
    "param": "user",
    "code": "400"
  }
}
```

</TabItem>

<TabItem value="Successful call" label="Successful call">

```shell
curl --location 'http://localhost:4000/chat/completions' \
    --header 'Authorization: Bearer <sk-your-service-account>' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "hello"
        }
    ],
    "user": "test-user"
}'
```

預期回應

```json
{
  "id": "chatcmpl-ad9595c7e3784a6783b469218d92d95c",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "\n\nHello there, how may I assist you today?",
        "role": "assistant",
        "tool_calls": null,
        "function_call": null
      }
    }
  ],
  "created": 1677652288,
  "model": "gpt-3.5-turbo-0125",
  "object": "chat.completion",
  "system_fingerprint": "fp_44709d6fcb",
  "usage": {
    "completion_tokens": 12,
    "prompt_tokens": 9,
    "total_tokens": 21,
    "completion_tokens_details": null
  },
  "service_tier": null
}
```

</TabItem>

</Tabs>
