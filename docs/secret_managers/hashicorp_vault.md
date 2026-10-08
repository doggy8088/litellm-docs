import Image from '@theme/IdealImage';

# Hashicorp Vault {#hashicorp-vault}

<EnterpriseFeature />

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
HCP_VAULT_NAMESPACE="admin" # OPTIONAL. Vault Enterprise namespace for both login and secret operations
HCP_VAULT_LOGIN_NAMESPACE="admin" # OPTIONAL. Namespace for AppRole / TLS cert login only. Defaults to HCP_VAULT_NAMESPACE
HCP_VAULT_SECRET_NAMESPACE="admin/teams/team-a" # OPTIONAL. Namespace for secret reads and writes only. Defaults to HCP_VAULT_NAMESPACE

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

## 命名空間 {#namespaces}

在 Vault Enterprise 中，LiteLLM 會將命名空間送到兩個位置：作為 AppRole 或 TLS 憑證登入請求上的 `X-Vault-Namespace` 標頭，以及作為每個 secret 讀取、寫入、輪換與刪除之 URL 中的一個路徑區段。`HCP_VAULT_NAMESPACE` 會同時設定這兩者。當 LiteLLM 登入時使用的 role 所在命名空間與其管理的 secrets 不同時，可分別使用 `HCP_VAULT_LOGIN_NAMESPACE` 和 `HCP_VAULT_SECRET_NAMESPACE` 來單獨設定。未設定時，兩者都會回退到 `HCP_VAULT_NAMESPACE`，因此既有部署可維持不變。相同的三個設定也可在 Admin UI 的 Settings > Admin Settings > Hashicorp Vault 下找到，名稱分別是 Namespace、Login Namespace 與 Secret Namespace

例如，一個定義在最上層 `admin` 命名空間中、並可存取其下每個團隊命名空間的 AppRole，而團隊 virtual keys 與提供者 secrets 儲存在 `admin/teams/team-a` 下：

```bash
HCP_VAULT_ADDR="https://vault.example.com:8200"
HCP_VAULT_LOGIN_NAMESPACE="admin"
HCP_VAULT_SECRET_NAMESPACE="admin/teams/team-a"
HCP_VAULT_APPROLE_ROLE_ID="your-role-id"
HCP_VAULT_APPROLE_SECRET_ID="your-secret-id"
```

使用此設定時，登入請求會以 `POST https://vault.example.com:8200/v1/auth/approle/login` 搭配標頭 `X-Vault-Namespace: admin` 送出，而對 `OPENAI_API_KEY` 的讀取會以只有 `X-Vault-Token` 標頭的方式送往 `GET https://vault.example.com:8200/v1/admin/teams/team-a/secret/data/OPENAI_API_KEY`。Vault 會透過省略標頭來處理 root 命名空間，因此若要在 root 登入同時讀取團隊 secrets，請將 `HCP_VAULT_LOGIN_NAMESPACE` 和 `HCP_VAULT_NAMESPACE` 保持未設定，並只設定 `HCP_VAULT_SECRET_NAMESPACE`。secret 請求永遠不會攜帶命名空間標頭，因此 URL 是判定 secret 所屬命名空間的唯一依據。每個團隊的 `namespace` 覆寫（請參閱 [團隊專屬覆寫](#team-specific-overrides)）會替換該團隊金鑰的 `HCP_VAULT_SECRET_NAMESPACE`，且永遠不會影響登入

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
  "key": "sk-<virtual-key>"
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

- `namespace` – 在 secret URL 中覆寫 secret 命名空間（`HCP_VAULT_SECRET_NAMESPACE`，若未設定則為 `HCP_VAULT_NAMESPACE`）。登入一律使用登入命名空間。
- `mount` – 要使用的 KV 引擎掛載點（預設為 `secret`）。
- `path_prefix` – 掛載點與 secret 名稱之間的額外路徑區段。
- `data` – KV 負載中的欄位名稱（預設為 `key`）。

每當 LiteLLM 為該團隊儲存或刪除 virtual key 時，這些覆寫都會套用，因此您可以將每個團隊的憑證保留在各自的命名空間、mount 或欄位配置中，而無需變更全域 Vault 設定。
