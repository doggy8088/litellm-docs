# LiteLLM 自架設安全性與加密 FAQ {#litellm-self-hosted-security--encryption-faq}

## 傳輸中資料加密 {#data-in-transit-encryption}

### 產品是否會對傳輸中的資料加密？ {#does-the-product-encrypt-data-in-transit}

**是**，LiteLLM 使用 TLS/SSL 對傳輸中的資料加密。

### OSS 與 Enterprise 版本都可用嗎？ {#available-in-both-oss-and-enterprise}

**是**，TLS 加密在開源版與 Enterprise 版中都可用。

### 在呼叫用戶端與產品之間的傳輸中？ {#in-transit-between-the-calling-client-and-the-product}

**是**，可透過 SSL 憑證設定支援 HTTPS/TLS。

**設定：**
```bash
# CLI
litellm --ssl_keyfile_path /path/to/key.pem --ssl_certfile_path /path/to/cert.pem

# Environment Variables
export SSL_KEYFILE_PATH="/path/to/key.pem"
export SSL_CERTFILE_PATH="/path/to/cert.pem"
```

**文件參考：** `docs/my-website/docs/guides/security_settings.md`

### 在產品與 LLM 提供者之間的傳輸中？ {#in-transit-between-the-product-and-the-llm-providers}

**是**，與 LLM 提供者的所有連線預設都使用 TLS 加密。

**實作細節：**
- 使用 Python 的 `ssl.create_default_context()` 
- 搭配已啟用 SSL/TLS 的 HTTPX 與 aiohttp 函式庫
- 預設使用 certifi CA bundle 進行 SSL 驗證

**程式碼參考：** `litellm/llms/custom_httpx/http_handler.py`（第 43-105 行）

### 與 LLM 提供者的 TCP 工作階段是共用的嗎？ {#are-tcp-sessions-to-the-llm-providers-shared}

**是**，TCP 連線會被連線池化並重複使用。

**細節：**
- 預設已啟用連線池
- 預設：最多 1000 個並行連線，並啟用 keepalive
- 會維持對同一提供者的請求之間的工作階段
- 可降低 TLS 握手的額外負擔

**程式碼參考：** `litellm/llms/custom_httpx/http_handler.py`（第 704-712 行）

### 還是產品會針對同一個 LLM 提供者在每次連續呼叫時協商新的 TLS 工作階段？ {#or-does-the-product-negotiate-a-new-tls-session-with-the-same-llm-provider-for-every-sequential-call}

**否**，TLS 工作階段會透過連線池重複使用。每次請求不會都執行新的 TLS 握手。

### 它是如何加密的？ {#how-is-it-encrypted}

**TLS 1.2 與 TLS 1.3**

使用 Python 的預設 SSL context，支援 TLS 1.2 與 TLS 1.3。實際協商的版本取決於：
- Python 版本
- 系統 SSL 函式庫（通常是 OpenSSL）
- 伺服器能力

**實作：** `ssl.create_default_context()`，以 Python 撰寫

### 這些要如何加入產品的設定？ {#how-are-these-added-to-the-products-configuration}

#### x.509 憑證 {#x509-certificate}

**方法 1：CLI 引數**
```bash
litellm --ssl_certfile_path /path/to/certificate.pem
```

**方法 2：環境變數**
```bash
export SSL_CERTFILE_PATH="/path/to/certificate.pem"
```

#### 私密金鑰 {#private-key}

**方法 1：CLI 引數**
```bash
litellm --ssl_keyfile_path /path/to/private_key.pem
```

**方法 2：環境變數**
```bash
export SSL_KEYFILE_PATH="/path/to/private_key.pem"
```

#### 憑證束/憑證鏈 {#certificate-bundlechain}

**適用於用戶端到 proxy 的連線：**
使用標準 SSL 憑證設定，並將中繼憑證包含在 certfile 中。

**適用於 proxy 到 LLM 提供者的連線：**

**方法 1：Config YAML**
```yaml
litellm_settings:
  ssl_verify: "/path/to/ca_bundle.pem"
```

**方法 2：環境變數**
```bash
export SSL_CERT_FILE="/path/to/ca_bundle.pem"
```

**方法 3：用戶端憑證驗證**
```yaml
litellm_settings:
  ssl_certificate: "/path/to/client_certificate.pem"
```

或

```bash
export SSL_CERTIFICATE="/path/to/client_certificate.pem"
```

### 文件涵蓋範圍 {#documentation-coverage}

**主要文件：**
- `docs/my-website/docs/guides/security_settings.md` - SSL/TLS 設定指南

**其他參考：**
- `litellm/proxy/proxy_cli.py`（第 455-467 行）- CLI 選項
- `docs/my-website/docs/completion/http_handler_config.md` - 自訂 HTTP 處理器設定

---

## 靜態資料加密 {#data-at-rest-encryption}

### 產品是否會對靜態資料加密？ {#does-the-product-encrypt-data-at-rest}

**部分會**。只有特定敏感資料會在靜態儲存時加密。

### 哪些資料會以加密形式儲存？ {#what-data-is-stored-in-encrypted-form}

#### 已加密資料： {#encrypted-data}
1. **LLM API 金鑰** - `LiteLLM_ProxyModelTable.litellm_params` 中的模型憑證
2. **提供者憑證** - 儲存在 `LiteLLM_CredentialsTable.credential_values` 中
3. **設定機密** - `LiteLLM_Config` 表格中的敏感設定值
4. **虛擬金鑰** - 使用秘密管理器時（可選功能）

#### 未加密： {#not-encrypted}
1. **Spend Logs** - `LiteLLM_SpendLogs` 中的請求/回應資料
2. **Audit Logs** - `LiteLLM_AuditLog` 中的變更歷程
3. **使用者/團隊/組織資料** - 中繼資料與設定
4. **快取的 prompts 與 completions** - 快取資料以明文儲存

### 快取的 prompts 與 completions？ {#cached-prompts-and-completions}

**否**，快取的 prompts 與 completions **不會**加密。

快取後端（Redis、S3、本機磁碟）會以明文 JSON 儲存資料。

**程式碼參考：**
- `litellm/caching/redis_cache.py`
- `litellm/caching/s3_cache.py`
- `litellm/caching/caching.py`

### 設定資料？ {#configuration-data}

**部分加密**。

#### 會加密的內容： {#what-is-encrypted}
- 模型設定中的 LLM API 金鑰與憑證
- `LiteLLM_Config` 表格中的敏感值
- `LiteLLM_CredentialsTable` 中的憑證值

#### 不會加密的內容： {#what-is-not-encrypted}
- 模型名稱與別名
- 速率限制與預算設定
- 使用者/團隊/組織中繼資料
- 非敏感設定參數

**程式碼參考：** `litellm/proxy/management_endpoints/model_management_endpoints.py`（第 275-308 行）

### 記錄資料？ {#log-data}

**否**，記錄資料**不會**加密。

儲存在資料庫表格中的記錄資料是明文：
- `LiteLLM_SpendLogs` - 包含請求/回應資料、tokens、spend
- `LiteLLM_ErrorLogs` - 錯誤資訊
- `LiteLLM_AuditLog` - 變更的稽核軌跡

**注意：** 您可以停用記錄，以避免儲存敏感資料：

```yaml
general_settings:
  disable_spend_logs: True   # Disable writing spend logs to DB
  disable_error_logs: True   # Disable writing error logs to DB
```

**文件：** `docs/my-website/docs/proxy/db_info.md`（第 52-60 行）

### 儲存在哪裡？ {#where-is-it-stored}

#### 在 DB 裡嗎？ {#in-the-db}

**是**，加密資料儲存在 PostgreSQL 資料庫中。

**含加密資料的主要資料表：**
- `LiteLLM_ProxyModelTable` - 含加密 API 金鑰的模型設定
- `LiteLLM_CredentialsTable` - 憑證值
- `LiteLLM_Config` - 設定機密

**Schema 參考：** `schema.prisma`

#### 在檔案系統中嗎？ {#in-the-filesystem}

**否**，預設不會將加密資料儲存在檔案系統中。

**注意：** 如果使用磁碟快取（`disk_cache_dir`），快取資料會以未加密方式儲存。

#### 在其他地方嗎？ {#somewhere-else}

**可選：** 使用秘密管理器（AWS Secrets Manager、Azure Key Vault、HashiCorp Vault）時，加密資料可儲存在外部。

**設定：**
```yaml
general_settings:
  key_management_system: "aws_secret_manager"  # or "azure_key_vault", "hashicorp_vault"
```

**文件：** `docs/my-website/docs/secret.md`

### 它是如何加密的？ {#how-is-it-encrypted-1}

**演算法：** NaCl SecretBox（XSalsa20-Poly1305 AEAD）

**不是 AES-256** - LiteLLM 使用 NaCl（Networking and Cryptography Library），提供：
- XSalsa20 串流加密
- 用於驗證的 Poly1305 MAC
- 與 AES-256 等效的安全性

**金鑰衍生：**
1. 取用 `LITELLM_SALT_KEY`（若未設定 salt key，則使用 `LITELLM_MASTER_KEY`）
2. 以 SHA-256 雜湊以衍生 256 位元加密金鑰
3. 使用 NaCl SecretBox 進行經驗證加密

**程式碼參考：** `litellm/proxy/common_utils/encrypt_decrypt_utils.py`（第 69-112 行）

**實作：**
```python
import hashlib
import nacl.secret

# Derive 256-bit key from salt
hash_object = hashlib.sha256(signing_key.encode())
hash_bytes = hash_object.digest()

# Create SecretBox and encrypt
box = nacl.secret.SecretBox(hash_bytes)
encrypted = box.encrypt(value_bytes)
```

### 設定加密金鑰 {#setting-the-encryption-key}

**必要的環境變數：**
```bash
export LITELLM_SALT_KEY="your-strong-random-key-here"
```

**重要注意事項：**
- ⚠️ **必須在新增任何模型之前設定**
- ⚠️ **絕對不要變更此金鑰** - 加密資料將無法復原
- ⚠️ 使用強隨機金鑰（建議：https://1password.com/password-generator/）
- 若未設定，會回退至 `LITELLM_MASTER_KEY`

**文件：** `docs/my-website/docs/proxy/prod.md`（第 8 節，第 184-196 行）

### 文件涵蓋範圍 {#documentation-coverage-1}

**主要文件：**
- `docs/my-website/docs/proxy/prod.md`（第 8 節）- LITELLM_SALT_KEY 設定
- `docs/my-website/docs/secret.md` - 秘密管理系統
- `docs/my-website/docs/proxy/db_info.md` - 資料庫資訊

**其他參考：**
- `security.md` - 一般安全措施
- `docs/my-website/docs/data_security.md` - 資料隱私概覽
- `schema.prisma` - 含加密欄位的資料庫 Schema

---

## 安全功能摘要 {#summary-of-security-features}

### ✅ 開箱即用提供 {#-provided-out-of-the-box}

1. 用於用戶端到 proxy 連線的 **TLS/SSL 加密**
2. 用於 proxy 到 LLM 提供者連線的 **TLS 加密**（含連線池）
3. **LLM API 金鑰與憑證的加密儲存**
4. **支援 TLS 1.2 與 TLS 1.3**
5. **連線池** 以降低 TLS 握手額外負擔

### ⚠️ 重要限制 {#️-important-limitations}

1. **快取資料不會加密**（Redis、S3、磁碟快取）
2. **記錄資料不會加密**（spend logs、audit logs）
3. **記錄中的請求/回應 payload 不會加密**
4. **使用 NaCl SecretBox，不是 AES-256**（但安全性相當）
5. **TLS 版本未明確設定** - 使用 Python/系統預設值

### 🔧 組態需求 {#-configuration-requirements}

**適用於正式環境部署：**

1. **先設定 LITELLM_SALT_KEY**，再新增任何模型
2. **設定 SSL 憑證**，供 HTTPS 用戶端連線使用
3. **若記錄包含敏感資料，請考慮停用記錄**
4. **使用密鑰管理器**以提升安全性（選用）
5. **若使用自訂憑證，請設定 CA 套件**

---

## 快速上手安全檢查清單 {#quick-start-security-checklist}

```bash
# 1. Generate a strong salt key
export LITELLM_SALT_KEY="$(openssl rand -base64 32)"

# 2. Set up SSL certificates (for HTTPS)
export SSL_KEYFILE_PATH="/path/to/private_key.pem"
export SSL_CERTFILE_PATH="/path/to/certificate.pem"

# 3. Configure database
export DATABASE_URL="postgresql://user:password@host:port/dbname"

# 4. (Optional) Disable logs if they contain sensitive data
# Add to config.yaml:
# general_settings:
#   disable_spend_logs: True
#   disable_error_logs: True

# 5. Start LiteLLM Proxy
litellm --config config.yaml
```

---

## 其他資源 {#additional-resources}

- **LiteLLM 文件：** https://docs.litellm.ai/
- **安全設定指南：** https://docs.litellm.ai/docs/guides/security_settings
- **正式環境部署：** https://docs.litellm.ai/docs/proxy/prod
- **密鑰管理：** https://docs.litellm.ai/docs/secret

如有安全相關詢問：support@berri.ai
