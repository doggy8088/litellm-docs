---
sidebar_label: 將身分對應到虛擬金鑰
---

# 將身分對應到虛擬金鑰 {#map-identities-to-virtual-keys}

<EnterpriseFeature feature="JWT authentication" />

讓用戶端使用身分提供者的 JWT 進行驗證，取代靜態的 LiteLLM 憑證。將穩定的 JWT claim 對應到現有的[虛擬金鑰](./virtual_keys.md)，然後將 JWT 作為 bearer token 傳送。

## 運作方式 {#how-it-works}

LiteLLM 使用您設定的簽章金鑰、issuer 與 audience 驗證 JWT，然後查找設定的 claim。相符的對應會識別出用於授權與用量追蹤的虛擬金鑰。透過[存取管理](./access_management/overview.md)設定該金鑰的權限。

如果沒有對應存在，`unregistered_jwt_client_behavior` 會決定要拒絕請求、使用標準 JWT 授權、建立金鑰，還是連結現有的金鑰。

## 先決條件 {#prerequisites}

完成[身分提供者設定](./token_auth.md)，並將您的 proxy 連接到資料庫。準備一把現有的虛擬金鑰，並具有呼叫者所需的 [LLM](./access_management/llm.md)、[MCP](./access_management/mcp.md) 或[代理程式](./access_management/agents.md)存取權。金鑰的建立與設定請參閱[虛擬金鑰](./virtual_keys.md)。

下方的測試請求使用名為 `my-model` 的已設定模型，該金鑰可以存取它。

選擇可識別呼叫者的穩定 claim。對人員使用 `sub`，對工作負載使用提供者的應用程式識別碼。共用的應用程式 `client_id` 無法區分個別使用者。

對應的管理需要 [proxy 管理員或管理員檢視者，視操作而定](./access_management/jwt_permissions.md#virtual-key-mappings)。

## 設定 {#setup}

<a id="step-1-configure-the-jwt-claim-to-map-on"></a>

### 1. 設定對應 claim {#step-1-configure-the-claim-and-unmapped-client-policy}

將這些設定加入您現有的 proxy 設定中。此範例要求管理員逐一註冊每個對應。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: sub
    virtual_key_claim_field: sub
    unregistered_jwt_client_behavior: reject
```

### 2. 註冊對應 {#step-2-register-a-mapping}

以呼叫者的 claim 值註冊現有的金鑰。claim 名稱必須與 `virtual_key_claim_field` 相符，值必須與呼叫者的 JWT 相符。

```bash
curl -X POST 'http://localhost:4000/jwt/key/mapping/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "jwt_claim_name": "sub",
    "jwt_claim_value": "user-123",
    "key": "<existing-virtual-key>",
    "description": "user-123"
  }'
```

建立對應並不會建立或變更金鑰。

#### 以金鑰的雜湊代替明文金鑰進行對應 {#map-with-the-keys-hash-instead-of-the-plaintext-key}

<SinceVersion v="1.104.0" />

如果您不再持有明文金鑰，請將其 SHA-256 雜湊作為 `token` 傳入。使用 `/key/generate` 回傳的 `token`，或 `/key/list` 回傳的金鑰雜湊。`key` 與 `token` 只能傳送其中一個；將雜湊作為 `key` 傳送會再次對它進行雜湊，並回傳 `The provided key does not match an existing virtual key.`

```bash
curl -X POST 'http://localhost:4000/jwt/key/mapping/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "jwt_claim_name": "sub",
    "jwt_claim_value": "user-123",
    "token": "<64-character lowercase hex key hash>",
    "description": "user-123"
  }'
```

## 測試驗證 {#test-authentication}

<a id="step-3-test-it"></a>

向您的身分提供者取得 `sub: user-123` 的 JWT，並將它作為 bearer token 傳送。

```bash
export JWT_TOKEN="<identity-provider-jwt>"

curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

該請求使用連結金鑰的現有權限。在儀表板或透過 `/key/info` 檢視其用量。

## 設定參考 {#configuration-reference}

### 對應 claim 與快取 {#mapping-claim-and-cache}

`virtual_key_claim_field` 支援巢狀 claim，例如 `user.sub`。它先前的名稱 `jwt_client_id_field` 仍可作為別名使用。`virtual_key_mapping_cache_ttl` 設定對應快取的存活時間（以秒為單位），預設為 `300`。

| `unregistered_jwt_client_behavior` | 沒有對應存在時 |
| --- | --- |
| `fallback_team_mapping` | 使用標準 JWT 授權。這是預設值。 |
| `reject` | 回傳 403。 |
| `auto_register` | 在 JWT 授權後建立虛擬金鑰與對應。可選擇先嘗試現有的金鑰。 |
| `link_only` | 連結符合資格的現有使用者金鑰，或回傳 403。絕不建立金鑰。 |

在 `reject`、`auto_register` 與 `link_only` 模式中，缺少 claim 也會回傳 403。

### 自動建立對應 {#create-mappings-automatically}

設定 `unregistered_jwt_client_behavior: auto_register`，即可在未對應身分的第一個請求時建立金鑰與對應。使用[身分 claim 設定](./jwt_auth_reference.md#tracking-end-users--internal-users--team--org)設定您希望新金鑰繼承的使用者、團隊與組織 claim。

在建立任何東西之前，LiteLLM 會執行 JWT 授權，包括設定的角色與 scope 檢查、`custom_validate` 以及電子郵件網域限制。新金鑰會繼承解析出的身分。當管理員必須在金鑰的第一個請求之前設定它時，請使用手動對應；請參閱[存取管理](./access_management/overview.md)。

設定 `auto_register_map_existing_key: true`，會先重複使用符合資格的使用者金鑰，只有在沒有符合資格的金鑰時才建立新金鑰。若要重複使用，`virtual_key_claim_field` 必須與 `user_id_jwt_field` 或 `user_email_jwt_field` 相符。需要資料庫連線。未對應的 proxy 管理員 JWT 會直接通過驗證，不建立對應。

### 連結到現有金鑰 {#link-to-existing-keys}

<SinceVersion v="1.109.0" />

當管理員預先佈建金鑰時，請使用 `link_only`。第一個獲授權的請求會將身分連結到其最新且符合資格的金鑰。如果沒有金鑰符合資格，LiteLLM 會回傳 403，並附上 `JWT Key Mapping: No eligible existing virtual key for this identity. Access denied.`

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: sub
    virtual_key_claim_field: sub
    user_id_upsert: false
    unregistered_jwt_client_behavior: link_only
```

對應 claim 必須與 `user_id_jwt_field` 或 `user_email_jwt_field` 相符，且資料庫必須已連線。此模式絕不建立金鑰。`user_id_upsert: true` 仍可建立使用者，因此如果使用者必須預先存在，請將它保持為 `false`。未對應的 proxy 管理員 JWT 會直接通過驗證，不連結金鑰。

#### 選取哪一把現有金鑰 {#which-existing-key-is-selected}

對於 `link_only` 與 `auto_register_map_existing_key`，金鑰必須屬於解析出的使用者與團隊；當 JWT 沒有解析出團隊時，金鑰必須沒有團隊。金鑰必須永不過期、未被封鎖，且不得為 Admin UI 工作階段金鑰或自動註冊的金鑰。最新且符合資格的金鑰會被選取。後續請求會保留該對應，即使之後建立了更新的金鑰。

`allowed_routes` 不影響選取。在啟用自動連結之前，請檢視現有金鑰的權限，包括它授予的任何管理路由權限。

### 多個身分提供者 {#multiple-identity-providers}

在[依 issuer 的設定](./jwt_auth_reference.md#per-issuer-claim-mapping)中使用 `litellm_jwtauth.issuers` 設定與 issuer 綁定的驗證，然後在每個對應上將 `jwt_issuer` 設為相應的已設定 issuer。issuer 專屬的 `virtual_key_claim_field` 與 `unregistered_jwt_client_behavior` 設定可以覆寫全域值。

```json
{
  "jwt_issuer": "https://idp.example.com",
  "jwt_claim_name": "sub",
  "jwt_claim_value": "user-123",
  "key": "<existing-virtual-key>"
}
```

LiteLLM 會先查找 issuer 範圍的對應，然後備援到沒有 `jwt_issuer` 的全域對應。全域對應在各提供者之間共用相同的 claim 命名空間。使用 issuer 範圍的對應，可區分來自不同提供者的相同 claim 值。

### 管理對應 {#managing-mappings}

對應的回應包含 `id`、claim 名稱與值、issuer、說明、啟用旗標以及稽核中繼資料。它們絕不會回傳連結的金鑰或其雜湊。金鑰本身請透過[虛擬金鑰](./virtual_keys.md)管理。

| 操作 | 端點 | 輸入 |
| --- | --- | --- |
| 清單 | `GET /jwt/key/mapping/list` | `page` 與 `size` 查詢參數 |
| 檢視 | `GET /jwt/key/mapping/info` | `id` 查詢參數 |
| 更新 | `POST /jwt/key/mapping/update` | JSON `id` 加上 `key` 或 `token`、`description`、`is_active` 或 `jwt_issuer` |
| 刪除 | `POST /jwt/key/mapping/delete` | JSON `id` |

例如，先列出對應以找到 ID，然後將該對應指向替代金鑰。

```bash
curl 'http://localhost:4000/jwt/key/mapping/list?page=1&size=50' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"

curl -X POST 'http://localhost:4000/jwt/key/mapping/update' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"id": "<mapping-id>", "key": "<replacement-key>"}'
```

每個操作允許的角色，請參閱[對應管理權限](./access_management/jwt_permissions.md#virtual-key-mappings)。

## 疑難排解 {#troubleshooting}

<a id="error-codes"></a>

| 代碼 | 含義 |
| --- | --- |
| 400 | 金鑰識別碼無效或找不到金鑰。 |
| 403 | 未對應的身分被政策拒絕、沒有符合資格的現有金鑰，或對應管理權限不足。 |
| 404 | 找不到對應。 |
| 409 | 該 issuer、claim 名稱與 claim 值已有對應存在。 |

簽章、issuer、audience 或簽章金鑰錯誤，請參閱 [JWT 疑難排解](./jwt_auth_reference.md#troubleshooting)。如果對應的憑證被接受，但其資源請求被拒絕，請在[存取管理](./access_management/overview.md)中檢查連結金鑰的權限。

## 相關指南 {#related-guides}

使用[身分提供者設定](./token_auth.md)設定 token 驗證，或使用[將身分對應到使用者與團隊](./jwt_user_team_auth.md)直接解析呼叫者。請參閱[虛擬金鑰](./virtual_keys.md)管理連結的憑證，並參閱 [JWT 權限](./access_management/jwt_permissions.md#virtual-key-mappings)瞭解對應管理的角色與政策行為。

Claude Code 用戶端設定請參閱[使用身分提供者 token](./client_setup/claude_code.md#use-an-identity-provider-token)。
