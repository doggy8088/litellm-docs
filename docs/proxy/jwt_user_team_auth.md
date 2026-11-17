# 將身分對應到使用者與團隊 {#map-identities-to-users-and-teams}

{/* keep-version-note */}

使用已驗證的 JWT claims 來識別使用者及其 LiteLLM 團隊。LiteLLM 會將請求歸屬到解析出的使用者與團隊。

<EnterpriseFeature feature="JWT-based Auth" />

## 運作方式 {#how-it-works}

LiteLLM 驗證 JWT，讀取設定的身分 claims，並將它們解析為 LiteLLM 使用者與團隊記錄。Claim 值必須與記錄的 ID 相符，除非您設定了別名對應。LiteLLM 使用解析出的身分進行用量歸屬與權限檢查。

## 先決條件 {#prerequisites}

開始之前，請[連接您的身分提供者](./token_auth.md#usage)，並將 proxy 連接到其資料庫。[佈建團隊及其模型存取權](./access_management/llm.md#give-a-team-access)，然後在測試之前設定 [JWT 團隊權限](./access_management/jwt_permissions.md#control-model-access-with-teams)。下方的請求使用名為 `my-model` 的已設定模型。

## 設定 {#setup}

### 1. 對應團隊身分 {#control-model-access-with-teams}

此範例預期您的身分提供者發出這些 claims：

```json
{
  "iss": "https://keycloak.example.com/realms/my-realm",
  "aud": "litellm-proxy",
  "sub": "user-123",
  "email": "user@example.com",
  "groups": ["engineering"]
}
```

這是範例酬載，不是已簽署的 token。請向您的提供者取得實際的存取 token。

Token 的 `groups` claim 中的 `engineering` 值必須與現有的 LiteLLM `team_id` 相符。請檢查您的提供者可指派的每個團隊；在兩個系統中顯示相同名稱並不足夠。如果您的提供者發出的是團隊名稱，請使用[別名對應](#resolve-by-name-alias-instead-of-id)。

### 2. 對應 claims {#2-map-the-claims}

將這些設定合併到您現有的 proxy 設定中：

```yaml title="config.yaml"
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    user_email_jwt_field: "email"
    team_ids_jwt_field: "groups"
    user_id_upsert: true
```

`user_id_upsert` 會在首次使用時建立使用者記錄。如果管理員預先佈建每位使用者，請將它保持停用。將這些身分欄位與先決條件中的[團隊強制設定](./access_management/jwt_permissions.md#control-model-access-with-teams)合併。

對於包含一個團隊 ID 的 token，請使用 `team_id_jwt_field: "team_id"` 而非 `team_ids_jwt_field`。沒有預設的團隊 claim；請設定您的提供者實際發出的欄位。

## 測試驗證 {#test-authentication}

<a id="3-make-a-request"></a>

取得具有上述 claims 的存取 token，並將它傳送到閘道：

```bash
export ACCESS_TOKEN="<identity-provider-access-token>"

curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

LiteLLM 驗證 token 並解析使用者與團隊。透過上方設定的[團隊權限](./access_management/jwt_permissions.md#control-model-access-with-teams)，它會為 `my-model` 選取一個團隊，並檢查該團隊的存取權。

## 設定參考 {#configuration-reference}

### 為請求選取團隊 {#select-team-via-request-header}

當使用者屬於多個團隊時，傳送 `x-litellm-team-id` 以選擇要套用哪個團隊的權限與用量歸屬：

```bash
curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'x-litellm-team-id: engineering' \
  -H 'Content-Type: application/json' \
  -d '{"model":"my-model","messages":[{"role":"user","content":"Hello"}]}'
```

此標頭接受團隊 ID 或唯一的 `team_alias`。預設情況下，它必須識別出 JWT 授予的團隊；否則 LiteLLM 會回傳 `403`。用量與政策檢查使用解析出的團隊 ID。沒有此標頭時，LiteLLM 會選取第一個可存取所請求模型的已宣告團隊。

使用 `fallback_to_db_teams: true` 時，此標頭也可以選取使用者在資料庫中屬於的任何團隊，即使 JWT 帶有團隊 claims。在啟用此行為之前，請參閱[資料庫團隊備援](#use-database-team-memberships)。

### 使用團隊或組織名稱 {#resolve-by-name-alias-instead-of-id}

如果您的提供者發出的是名稱而非資料庫 ID，請對應別名 claim：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_alias_jwt_field: "team_name"
    org_alias_jwt_field: "organization.name"
    user_id_upsert: true
```

LiteLLM 以團隊的 `team_alias` 查找 `team_name`，並以組織的 `organization_alias` 查找 `organization.name`。這些記錄必須已存在，且其別名必須唯一。如果 ID claim 與別名 claim 都包含值，則 ID 優先。

所有 claim 路徑都支援巢狀物件的點符號。Claim 名稱中的字面點請以 `\.` 跳脫；例如 `'kubernetes\.io.namespace'` 讀取 `kubernetes.io` claim 內的 `namespace`。

### 使用資料庫團隊成員資格 {#use-database-team-memberships}

選擇與您的團隊指派來源相符的設定：

| 設定 | 套用時機 | 結果 |
| --- | --- | --- |
| `fallback_to_db_teams: true` | JWT 不包含團隊 claims | 解析使用者現有的資料庫團隊。請求標頭也可以選取資料庫團隊成員資格，包括 JWT 具有團隊 claims 時。需要 `user_id_upsert: true`。 |
| `team_claim_fallback: true` | 已設定的團隊 claim 存在，但其值都無法解析為 LiteLLM 團隊 | 只有當使用者在資料庫中恰好有一個團隊時才備援。 |

兩個設定預設都為 `false`。能解析但缺少模型存取權的團隊仍會導致拒絕；`team_claim_fallback` 不會略過該檢查。如果沒有提供團隊 claim，現有的單一團隊備援可以使用使用者唯一的資料庫團隊，無需啟用 `team_claim_fallback`。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    user_id_upsert: true
    fallback_to_db_teams: true
```

<a id="fall-back-to-db-team-when-jwt-claims-dont-resolve"></a>

只有當身分提供者的團隊 claims 僅供參考時，才使用 `team_claim_fallback`。當這些 claims 是團隊存取權的權威來源時，請將它保持停用。

## 疑難排解 {#troubleshooting}

| 問題 | 要檢查的項目 |
| --- | --- |
| 簽章、issuer、audience 或簽章金鑰錯誤 | 檢查 [JWT token 驗證](./jwt_auth_reference.md#troubleshooting)。 |
| 使用者或團隊無法解析 | 將設定的 claim 路徑與值與資料庫記錄對應。只有當提供者發出名稱而非 ID 時，才使用別名設定。 |
| 團隊選取標頭回傳 `403` | 選取 token 授予的團隊，或在啟用資料庫備援時選取現有的資料庫成員資格。 |
| Token 被接受，但模型請求被拒絕 | 在 [JWT 權限](./access_management/jwt_permissions.md#troubleshooting) 中檢查解析出的團隊的授權與路由政策。 |

## 相關指南 {#related-guides}

[JWT 設定參考](./jwt_auth_reference.md) 涵蓋[最終使用者與組織追蹤](./jwt_auth_reference.md#tracking-end-users--internal-users--team--org) 與[已註冊的代理程式身分](./jwt_auth_reference.md#bind-jwts-to-registered-agents)。若要以現有虛擬金鑰的身分進行驗證，請[將 JWT claim 對應到金鑰](./jwt_key_mapping.md)。

在 [JWT 權限](./access_management/jwt_permissions.md) 中設定[電子郵件網域限制](./access_management/jwt_permissions.md#upsert-users--allowed-email-domains)、管理員存取、角色、scopes、路由、成員資格同步與團隊封鎖。
