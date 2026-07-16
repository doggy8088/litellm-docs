import Image from '@theme/IdealImage';

# Hashicorp Vault {#hashicorp-vault}

:::info

✨ **這是一項企業版功能**

[企業版定價](https://www.litellm.ai/#pricing)

[在此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

| 功能 | 支援 | 說明 |
|---------|----------|-------------|
| 讀取密鑰 | ✅ | 讀取密鑰，例如 `OPENAI_API_KEY` |
| 寫入密鑰 | ✅ | 儲存密鑰，例如 `Virtual Keys` |
| Hashicorp Vault 的驗證方法 | ✅ | AppRole、TLS Certificate、Token |

從 [Hashicorp Vault](https://developer.hashicorp.com/vault/docs/secrets/kv/kv-v2) 讀取密鑰

**步驟 1.** 在您的環境中新增 Hashicorp Vault 詳細資訊

LiteLLM 支援三種驗證方法：

1. AppRole 驗證（建議）- `HCP_VAULT_APPROLE_ROLE_ID` 和 `HCP_VAULT_APPROLE_SECRET_ID`
2. TLS 憑證驗證 - `HCP_VAULT_CLIENT_CERT` 和 `HCP_VAULT_CLIENT_KEY`
3. Token 驗證 - `HCP_VAULT_TOKEN`

```bash
HCP_VAULT_ADDR="https://test-cluster-public-vault-0f98180c.e98296b2.z1.hashicorp.cloud:8200"
HCP_VAULT_NAMESPACE="admin"

# Authentication via AppRole (recommended)
HCP_VAULT_APPROLE_ROLE_ID="your-role-id"
HCP_VAULT_APPROLE_SECRET_ID="your-secret-id"
HCP_VAULT_APPROLE_MOUNT_PATH="approle" # OPTIONAL. defaults to "approle"

# OR - Authentication via TLS cert
HCP_VAULT_CLIENT_CERT="path/to/client.pem"
HCP_VAULT_CLIENT_KEY="path/to/client.key"

# OR - Authentication via token
HCP_VAULT_TOKEN="hvs.CAESIG52gL6ljBSdmq*****"


# OPTIONAL
HCP_VAULT_REFRESH_INTERVAL="86400" # defaults to 86400, frequency of cache refresh for Hashicorp Vault
HCP_VAULT_MOUNT_NAME="secret" # OPTIONAL. defaults to "secret", set this if your KV engine is mounted elsewhere
HCP_VAULT_PATH_PREFIX="litellm" # OPTIONAL. defaults to None, set this if your secrets live under a custom prefix like secret/data/litellm/OPENAI_API_KEY
```

**步驟 2.** 新增到 proxy config.yaml

```yaml
general_settings:
  key_management_system: "hashicorp_vault"

  # [OPTIONAL SETTINGS]
  key_management_settings: 
    store_virtual_keys: true # OPTIONAL. Defaults to False, when True will store virtual keys in secret manager
    prefix_for_stored_virtual_keys: "litellm/" # OPTIONAL. If set, this prefix will be used for stored virtual keys in the secret manager
    access_mode: "read_and_write" # Literal["read_only", "write_only", "read_and_write"]
```

**步驟 3.** 啟動 + 測試 proxy

```
$ litellm --config /path/to/config.yaml
```

[快速測試 Proxy](../proxy/user_keys)

## 驗證方法 {#authentication-methods}

LiteLLM 支援 Hashicorp Vault 的三種驗證方法，優先順序如下：

1. **AppRole** - 適用於正式環境應用程式的建議選項
2. **TLS Certificate** - 用於基於憑證的驗證
3. **Token** - 直接 token 驗證

### 1. AppRole 驗證 {#1-approle-authentication}

設定 AppRole 驗證：

1. 在 Vault 中啟用 AppRole auth：
```bash
vault auth enable approle
```

2. 為 LiteLLM 建立 policy 與 role：
```bash
# Create a policy file (litellm-policy.hcl)
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Apply the policy
vault policy write litellm-policy litellm-policy.hcl

# Create an AppRole
vault write auth/approle/role/litellm \
    token_policies="litellm-policy" \
    token_ttl=32d \
    token_max_ttl=32d
```

3. 取得您的 Role ID 和 Secret ID：
```bash
# Get Role ID
vault read auth/approle/role/litellm/role-id

# Generate Secret ID
vault write -f auth/approle/role/litellm/secret-id
```

4. 設定環境變數：
```bash
export HCP_VAULT_APPROLE_ROLE_ID="your-role-id"
export HCP_VAULT_APPROLE_SECRET_ID="your-secret-id"
```

### 2. TLS 憑證驗證 {#2-tls-certificate-authentication}

TLS Certificate 驗證使用用戶端憑證與 Vault 進行 mutual TLS 驗證。

**環境變數：**
```bash
export HCP_VAULT_CLIENT_CERT="path/to/client.pem"
export HCP_VAULT_CLIENT_KEY="path/to/client.key"
export HCP_VAULT_CERT_ROLE="your-cert-role"  # Optional
```

**運作方式：**
- LiteLLM 使用用戶端憑證和金鑰進行 mutual TLS 驗證
- Vault 驗證憑證並簽發暫時 token
- token 會在租期期間快取

### 3. Token 驗證 {#3-token-authentication}

直接 token 驗證使用靜態 Vault token。

**環境變數：**
```bash
export HCP_VAULT_TOKEN="hvs.CAESIG52gL6ljBSdmq*****"
```

## 運作方式 {#how-it-works}

**讀取密鑰**

LiteLLM 使用以下 URL 格式，從 Hashicorp Vault 的 KV v2 引擎讀取密鑰：
```
{VAULT_ADDR}/v1/{NAMESPACE}/{MOUNT_NAME}/data/{PATH_PREFIX}/{SECRET_NAME}
```

範例，若您有：
- `HCP_VAULT_ADDR="https://vault.example.com:8200"`
- `HCP_VAULT_NAMESPACE="admin"`
- `HCP_VAULT_MOUNT_NAME="secret"`
- `HCP_VAULT_PATH_PREFIX="litellm"`
- 密鑰名稱：`AZURE_API_KEY`

LiteLLM 會查找：
```
https://vault.example.com:8200/v1/admin/secret/data/litellm/AZURE_API_KEY
```

### 預期的密鑰格式 {#expected-secret-format}

LiteLLM 預期所有密鑰都儲存為 JSON 物件，並包含一個 `key` 欄位來存放密鑰值。

範例，對於 `AZURE_API_KEY`，密鑰應儲存為：

```json
{
  "key": "sk-1234"
}
```

<Image img={require('../../img/hcorp.png')} />

**寫入密鑰**

當在 LiteLLM 上建立 / 刪除 Virtual Key 時，LiteLLM 會自動在 Hashicorp Vault 中建立 / 刪除對應的密鑰。

- 可透過 LiteLLM Admin UI 或 API 在 LiteLLM 上建立 Virtual Key

<Image img={require('../../img/hcorp_create_virtual_key.png')} />

- 在 Hashicorp Vault 中檢查密鑰

LiteLLM 會將密鑰儲存在 `prefix_for_stored_virtual_keys` 路徑下（預設：`litellm/`）

<Image img={require('../../img/hcorp_virtual_key.png')} />

### 團隊專屬覆寫 {#team-specific-overrides}

執行 LiteLLM proxy 時，您可以依團隊覆寫 Vault 位置。在儀表板中使用 [團隊層級密鑰管理器設定](./overview.md#team-level-secret-manager-settings) 流程，並設定如下所示的面板：

<Image img={require('../../img/secret_manager_hashicorp_vault_settings.png')} />

JSON payload 請使用以下結構：

```json
{
  "namespace": "teams/team-a",
  "mount": "kv-prod",
  "path_prefix": "virtual-keys",
  "data": "password"
}
```

- `namespace` – 覆寫 `X-Vault-Namespace` 標頭。
- `mount` – 要使用哪個 KV engine mount（預設為 `secret`）。
- `path_prefix` – mount 與密鑰名稱之間的額外路徑段。
- `data` – KV payload 內的欄位名稱（預設為 `key`）。

每當 LiteLLM 為該團隊儲存或刪除 virtual key 時，這些覆寫都會套用，因此您可以將每個團隊的憑證保留在各自的命名空間、mount 或欄位配置中，而無需變更全域 Vault 設定。
