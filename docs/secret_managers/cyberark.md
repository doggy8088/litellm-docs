# CyberArk Conjur {#cyberark-conjur}

import Image from '@theme/IdealImage';

:::info

✨ **這是企業版功能**

[企業定價](https://www.litellm.ai/#pricing)

[請在這裡聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

| 功能 | 支援 | 說明 |
|---------|----------|-------------|
| 讀取密鑰 | ✅ | 讀取密鑰，例如 `OPENAI_API_KEY` |
| 寫入密鑰 | ✅ | 儲存密鑰，例如 `Virtual Keys` |
| 刪除密鑰 | ❌ | 必須透過政策更新移除密鑰 |

從 [CyberArk Conjur](https://www.cyberark.com/products/secrets-management/)（自架密鑰管理工具）讀取和寫入密鑰

**步驟 1.** 在您的環境中新增 CyberArk Conjur 詳細資訊

LiteLLM 支援兩種驗證方式：

1. API key 驗證 - `CYBERARK_API_KEY`（建議）
2. 憑證驗證 - `CYBERARK_CLIENT_CERT` 和 `CYBERARK_CLIENT_KEY`

```bash title="Environment Variables" showLineNumbers
CYBERARK_API_BASE="http://your-conjur-instance:8080"
CYBERARK_ACCOUNT="default"
CYBERARK_USERNAME="admin"

# Authentication via API key (recommended)
CYBERARK_API_KEY="your-api-key-here"

# OR - Authentication via certificate
CYBERARK_CLIENT_CERT="path/to/client.pem"
CYBERARK_CLIENT_KEY="path/to/client.key"

# OPTIONAL
CYBERARK_REFRESH_INTERVAL="300" # defaults to 300 seconds (5 minutes), frequency of token refresh
CYBERARK_SSL_VERIFY="true" # defaults to true, set to "false" to disable SSL verification (for self-signed certificates)
```

**步驟 2.** 新增至 proxy config.yaml

```yaml title="Proxy Config" showLineNumbers
general_settings:
  key_management_system: "cyberark"

  # [OPTIONAL SETTINGS]
  key_management_settings: 
    store_virtual_keys: true # OPTIONAL. Defaults to False, when True will store virtual keys in secret manager
    prefix_for_stored_virtual_keys: "litellm/" # OPTIONAL. If set, this prefix will be used for stored virtual keys in the secret manager
    access_mode: "read_and_write" # Literal["read_only", "write_only", "read_and_write"]
```

**步驟 3.** 啟動 + 測試 proxy

```bash title="Start Proxy" showLineNumbers
$ litellm --config /path/to/config.yaml
```

[快速測試 Proxy](../proxy/user_keys)

## 將 Virtual Key 寫入 CyberArk {#writing-virtual-keys-to-cyberark}

當您在 LiteLLM UI 中建立 virtual key 時，它會自動儲存在 CyberArk Conjur 中。

**步驟 1：** 在 LiteLLM Admin UI 中建立 virtual key

在這個範例中，我們建立一個名為 `litellm-cyber-ark-secret-key` 的 key：

<Image img={require('../../img/cyberark1.png')} alt="在 LiteLLM UI 中建立 virtual key" />

**步驟 2：** 驗證該密鑰是否存在於 CyberArk

您可以透過查詢 secrets API 來驗證 virtual key 已儲存在 CyberArk 中：

```bash title="Verify Secret in CyberArk" showLineNumbers
TOKEN=$(curl -s -X POST http://0.0.0.0:8080/authn/default/admin/authenticate \
  -d "your-api-key" | base64 | tr -d '\n')

curl -H "Authorization: Token token=\"$TOKEN\"" \
  "http://0.0.0.0:8080/resources/default/variable" | jq .
```

回應顯示 `litellm-cyber-ark-secret-key` 存在於 CyberArk 中：

<Image img={require('../../img/cyberark2.png')} alt="儲存在 CyberArk API 中的 virtual key" />

virtual key 會以完整路徑儲存：`default:variable:litellm/litellm-cyber-ark-secret-key`

## 運作方式 {#how-it-works}

**驗證**

CyberArk Conjur 使用兩步驟驗證流程：

1. LiteLLM 使用您的 API key 進行驗證以取得 session token
2. session token（經 base64 編碼）用於後續的 API 請求
3. token 會在約 8 分鐘後過期，因此 LiteLLM 會自動快取並重新整理它們

**讀取密鑰**

LiteLLM 使用下列 URL 格式從 CyberArk Conjur 讀取密鑰：

```
{CYBERARK_API_BASE}/secrets/{ACCOUNT}/variable/{SECRET_NAME}
```

例如，如果您有：
- `CYBERARK_API_BASE="http://conjur.example.com:8080"`
- `CYBERARK_ACCOUNT="default"`
- 密鑰名稱：`AZURE_API_KEY`

LiteLLM 會查詢：
```
http://conjur.example.com:8080/secrets/default/variable/AZURE_API_KEY
```

**寫入密鑰**

當在 LiteLLM 上建立 Virtual Key 時，會自動發生以下動作：

1. LiteLLM 建立一筆 policy 項目，在 Conjur 中定義該變數（若尚不存在）
2. LiteLLM 透過 Conjur API 設定密鑰值

LiteLLM 會將密鑰儲存在 `prefix_for_stored_virtual_keys` 路徑下（預設：`litellm/`）

例如，virtual key 會儲存為：`litellm/virtual-key-name`

**重要注意事項**

- 變數必須先在 Conjur policy 中定義，才能設定其值
- LiteLLM 在寫入新密鑰時會自動建立 policy 項目
- 含有斜線的密鑰名稱（例如：`litellm/key`）會自動進行 URL 編碼
- 預設會快取 session token 5 分鐘，以將 API 呼叫降到最低

## 疑難排解 {#troubleshooting}

如果您在 LiteLLM 整合上遇到問題，請先驗證您的 CyberArk Conjur 執行個體是否正常運作。直接針對您的 CyberArk 端點執行這些 curl 指令，以確認連線與驗證是否正常：

**步驟 1：驗證並取得 token**

將 `http://conjur.example.com:8080` 替換為您的 `CYBERARK_API_BASE`，並使用您的實際憑證：

```bash title="Authenticate" showLineNumbers
TOKEN=$(curl -s -X POST http://conjur.example.com:8080/authn/default/admin/authenticate \
  -d "your-api-key" | base64 | tr -d '\n')
```

**步驟 2：測試讀取密鑰**

```bash title="Read Secret" showLineNumbers
curl -H "Authorization: Token token=\"$TOKEN\"" \
  "http://conjur.example.com:8080/secrets/default/variable/test-secret"
```

**步驟 3：測試寫入密鑰**

```bash title="Write Secret" showLineNumbers
curl -X POST \
  -H "Authorization: Token token=\"$TOKEN\"" \
  --data "my-secret-value" \
  "http://conjur.example.com:8080/secrets/default/variable/test-secret"
```

如果這些指令能在您的 CyberArk 執行個體上成功執行，則代表 CyberArk 運作正常，問題出在您的 LiteLLM 設定。請檢查：
- 您的環境變數是否已正確設定
- `CYBERARK_API_BASE` URL 是否可從您的 LiteLLM 執行個體存取
- 您的 API key 或憑證在 CyberArk 中是否具有必要權限

### SSL 憑證錯誤 {#ssl-certificate-errors}

如果您遇到如下的 SSL 憑證驗證錯誤：

```
RuntimeError: Could not authenticate to CyberArk Conjur: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self-signed certificate in certificate chain
```

這通常發生在您的 CyberArk Conjur 執行個體使用自簽憑證時。您可以透過設定下列項目來停用 SSL 驗證：

```bash
CYBERARK_SSL_VERIFY="false"
```

:::warning
停用 SSL 驗證是不安全的，且僅應在使用自簽憑證的測試或開發環境中使用。對於正式環境，請正確設定您的憑證鏈，或使用搭配 `CYBERARK_CLIENT_CERT` 和 `CYBERARK_CLIENT_KEY` 的憑證式驗證。
:::

## 影片導覽 {#video-walkthrough}

這部影片示範如何使用 CyberArk Conjur 作為 LiteLLM 的密鑰管理工具。我們會在 LiteLLM Admin UI 中建立一個 virtual key，並驗證它是否存在於 CyberArk 中。接著我們會輪替密鑰並驗證它是否存在於 CyberArk 中。

<iframe width="840" height="500" src="https://www.loom.com/embed/e9892ae6cb9545d1b709b82e8695db91" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
