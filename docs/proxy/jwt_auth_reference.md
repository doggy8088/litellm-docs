# JWT 設定參考 {#jwt-configuration-reference}

{/* keep-version-note */}

在[連接您的身分提供者](./token_auth.md)之後使用本參考。將已驗證的 claims 對應到[使用者與團隊](./jwt_user_team_auth.md) 或[現有的虛擬金鑰](./jwt_key_mapping.md)。在[存取管理](./access_management/jwt_permissions.md)中設定資源與路由權限。

<EnterpriseFeature feature="JWT-based Auth" />

## 多個身分提供者 {#multiple-oidc-providers}

### 依 issuer 的設定 {#per-issuer-claim-mapping}

當您信任多個提供者，或需要為每個提供者設定不同的 claim 對應時，請設定 `litellm_jwtauth.issuers`。LiteLLM 會將 token 的 `iss` 與某個項目比對，然後使用該項目驗證其簽章、issuer 與 audience。

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_upsert: true
    issuers:
      - issuer: "https://keycloak.example.com/realms/my-realm"
        audience: "litellm-proxy"
        user_id_jwt_field: "sub"
        user_email_jwt_field: "email"
        team_ids_jwt_field: "groups"
      - issuer: "https://workloads.example.com"
        jwks_url: "https://workloads.example.com/.well-known/jwks.json"
        audience: "litellm-proxy"
        team_id_jwt_field: "sub"
```

第一個提供者的 `sub` 識別使用者；第二個提供者的 `sub` 識別團隊。請連同這些對應一起設定[解析出的身分的權限](./access_management/jwt_permissions.md)。

| 欄位 | 行為 |
| --- | --- |
| `issuer` | 必填。預期的確切 `iss` 值，包括其 scheme 與結尾斜線。 |
| `audience` | 預期的 audience。除非設定 `disable_audience_validation: true`，否則必填。 |
| `disable_audience_validation` | 明確略過 audience 檢查。不能與 `audience` 並用。 |
| `jwks_url` | 選用的 JWKS URL。否則 LiteLLM 會讀取 issuer 的 OIDC 探索文件，並遵循 `jwks_uri`。 |
| Claim 對應 | `user_id_jwt_field`、`user_email_jwt_field`、`team_id_jwt_field`、`team_ids_jwt_field`、`org_id_jwt_field` 與 `end_user_id_jwt_field` 會覆寫此 issuer 的全域對應設定。 |

Issuer 項目中省略的對應會備援到全域 `litellm_jwtauth` 設定。當某個 claim 在不同提供者間有不同含義時，請將對應移入 issuer 項目中。

:::important

`issuers` 是路由設定，不是允許清單。未比對到的 `iss` 會備援到全域的 `JWT_PUBLIC_KEY_URL`、`JWT_ISSUER` 與 `JWT_AUDIENCE` 路徑，其中 `litellm_jwtauth.public_key_url` 與 `litellm_jwtauth.audience` 在設定時會取代其環境變數。如果只有設定的 issuers 應該進行驗證，請將兩個金鑰 URL 設定都保持未設定。

:::

### 共用 JWKS 清單 {#shared-jwks-list}

`JWT_PUBLIC_KEY_URL` 也接受以逗號分隔的 JWKS 或探索 URL：

```bash
export JWT_PUBLIC_KEY_URL="https://provider-a.example.com/.well-known/openid-configuration,https://provider-b.example.com/.well-known/jwks.json"
```

此路徑會依序搜尋 URL，並使用第一把與 token 標頭的 `kid` 相符的金鑰。`iss` claim 不會選取提供者。所有提供者共用相同的 claim 對應，以及單一的全域 `JWT_ISSUER` 與 `JWT_AUDIENCE` 值。如果兩個提供者發布相同的 `kid`，第一把相符的金鑰會被採用，即使它屬於錯誤的提供者。

當您需要驗證不同的 issuers 或 audiences 時，請優先使用依 issuer 的設定。

### 受支援的 token {#provider-compatibility}

LiteLLM 接受使用 RS256/384/512、PS256/384/512、ES256/384/512 與 EdDSA 的非對稱簽章。HMAC 演算法（`HS*`）會被拒絕。提供者必須以 JWKS 形式發布其金鑰，直接發布或透過 OIDC 探索。

Token 的 `kid` 會在 JWKS 中選取一把金鑰。沒有 `kid` 的 token 可以比對恰好包含一把金鑰的金鑰集。LiteLLM 驗證簽章與到期時間，若有 `nbf` 與 `iat` 也會一併驗證。全域 issuer 與 audience 檢查只有在其環境變數設定時才會啟用；依 issuer 的項目需要 audience 或明確的退出選項。

## 金鑰快取與提供者中斷 {#caching-public-keys}

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    public_key_ttl: 600
    public_key_stale_ttl: 3600
```

JWKS 與探索回應會快取 `public_key_ttl` 秒；有設定時使用 Redis，否則使用程序內快取。缺少的 `kid` 不會在該 TTL 到期前重新整理金鑰。

對於 DNS、TLS 或逾時等傳輸失敗，LiteLLM 最多重試三次，然後將中斷快取 30 秒。它可以使用先前成功的回應，直到其年限超過 `public_key_ttl + public_key_stale_ttl`。否則驗證會以 `503` 失敗。設定 `public_key_stale_ttl: 0`，可在中斷期間一般快取一到期就拒絕請求。

非 200 回應與無效的回應主體不會使用重試或過期金鑰，並會導致 `401`。提供者失敗也會停止共用 JWKS 清單的搜尋；LiteLLM 不會在該錯誤後繼續搜尋後面的 URL。

## Claim 對應 {#tracking-end-users--internal-users--team--org}

以下所有設定都放在 `general_settings.litellm_jwtauth` 之下。身分 claim 欄位預設為未設定。路徑支援點符號的巢狀 claims，例如 `user.email`。Claim 名稱中的字面點請跳脫，例如 `'kubernetes\.io.namespace'`。

| 設定 | 將 claim 對應到 |
| --- | --- |
| `user_id_jwt_field` | LiteLLM 使用者 ID，例如 `sub`。 |
| `user_email_jwt_field` | 使用者的電子郵件，例如 `email`。 |
| `team_id_jwt_field` | 一個 LiteLLM 團隊 ID。沒有隱含的 `client_id` 對應。 |
| `team_ids_jwt_field` | LiteLLM 團隊 ID 清單，例如 `groups`。 |
| `team_alias_jwt_field` | 現有團隊的唯一 `team_alias`。 |
| `org_id_jwt_field` | LiteLLM 組織 ID。 |
| `org_alias_jwt_field` | 現有組織的唯一 `organization_alias`。 |
| `end_user_id_jwt_field` | 用於客戶支出歸屬的最終使用者 ID。已驗證的 claim 優先於請求標頭或主體中提供的客戶 ID。 |
| `customer_org_alias_jwt_field`, `customer_member_id_jwt_field`, `customer_team_id_jwt_field` | 客戶管理的組織別名、成員 ID，以及選用的客戶團隊選擇。全域與每個 issuer 皆可使用。當其中任一欄位已對應時，JWT 請求會忽略客戶標頭。請參閱[透過 JWT claims 的客戶身分](./customer_management/jwt-customer-identity.md)。 |
| `agent_id_jwt_field` | 已註冊代理程式的 ID 或名稱。請參閱[已註冊的代理程式](#bind-jwts-to-registered-agents)。 |

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "user.id"
    user_email_jwt_field: "user.email"
    team_id_jwt_field: "tenant.team_id"
    org_id_jwt_field: "organization.id"
    end_user_id_jwt_field: "customer.id"
```

使用[使用者與團隊佈建設定](./jwt_user_team_auth.md#2-map-the-claims)控制是否建立缺少的使用者記錄。`team_id_upsert: true` 可以建立缺少的團隊；當管理員必須在授予存取權之前定義團隊政策時，請將它保持停用。JWT 最終使用者追蹤請參閱[舊版客戶 ID 優先順序](./legacy_end_users.md#1-make-llm-api-call-w-customer-id)，或參閱[客戶管理](./customers.md)以了解自 v1.111 起建議的支出追蹤設定。

若 JWT 識別的是應用程式而非客戶，請參閱[如何同時傳送 JWT 與客戶標頭](./customer_management/jwt-customer-identity.md#app-jwt-customer-headers)。

## 加入自訂驗證 {#custom-jwt-validate}

`custom_validate` 會接收已驗證的 claims。擲出例外以拒絕 token，回傳 `True` 以接受它。

```python title="custom_validate.py"
from typing import Any, Literal


def validate_tenant(token: dict[str, Any]) -> Literal[True]:
    if token.get("tenant_id") != "my-tenant":
        raise ValueError("Invalid JWT tenant")
    return True
```

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    custom_validate: custom_validate.validate_tenant
```

讓該模組與您的設定一起供 proxy 使用。自訂驗證是額外的檢查；簽章、issuer 與 audience 驗證仍屬於共用設定。

## 驗證 Kubernetes 工作負載 {#kubernetes-serviceaccount-authentication}

使用投射的 Kubernetes ServiceAccount token 作為 bearer token。您的 proxy 必須能夠擷取叢集 issuer 的 OIDC 探索文件與 JWKS。

### 1. 信任叢集 issuer {#1-trust-the-cluster-issuer}

從您的叢集設定取得 issuer URL，然後以該確切的 issuer 與專用的 audience 設定 LiteLLM：

```bash
export JWT_PUBLIC_KEY_URL="https://your-cluster-issuer/.well-known/openid-configuration"
export JWT_ISSUER="https://your-cluster-issuer"
export JWT_AUDIENCE="litellm-proxy"
```

將 token 的命名空間對應到 LiteLLM 團隊別名：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    team_alias_jwt_field: 'kubernetes\.io.namespace'
```

### 2. 解析命名空間的團隊 {#2-resolve-the-namespaces-team}

`my-app` 命名空間必須與現有 LiteLLM 團隊的 `team_alias` 相符。在測試之前，請[建立團隊並指派其模型存取權](./access_management/llm.md#give-a-team-access)。使用 `my-app` 作為其別名，並包含已設定的 `my-model` 模型。API 設定與團隊強制設定請參閱 [JWT 團隊權限](./access_management/jwt_permissions.md#control-model-access-with-teams)。

### 3. 掛載具有相符 audience 的 token {#3-mount-a-token-with-the-matching-audience}

在現有的 `my-app` 命名空間中建立 ServiceAccount 與 Pod。將 `your-application-image` 換成您的工作負載映像。

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: llm-client
  namespace: my-app
---
apiVersion: v1
kind: Pod
metadata:
  name: llm-client
  namespace: my-app
spec:
  serviceAccountName: llm-client
  containers:
    - name: app
      image: your-application-image
      volumeMounts:
        - name: litellm-token
          mountPath: /var/run/secrets/litellm
          readOnly: true
  volumes:
    - name: litellm-token
      projected:
        sources:
          - serviceAccountToken:
              path: token
              audience: litellm-proxy
              expirationSeconds: 3600
```

Kubernetes 會輪替投射的 token。傳送請求時請讀取掛載的檔案，讓應用程式使用目前的 token。叢集需求與輪替行為請參閱 [Kubernetes ServiceAccount token 投射](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#serviceaccount-token-volume-projection)。

### 4. 從 pod 呼叫 LiteLLM {#4-call-litellm-from-the-pod}

將 proxy 主機名稱換成您部署的位址：

```bash
curl 'http://litellm:4000/v1/chat/completions' \
  -H "Authorization: Bearer $(cat /var/run/secrets/litellm/token)" \
  -H 'Content-Type: application/json' \
  -d '{"model":"my-model","messages":[{"role":"user","content":"Hello"}]}'
```

若也要將個別 ServiceAccount 作為使用者追蹤，請加入 `user_id_jwt_field: "sub"` 與 `user_id_upsert: true`。ServiceAccount 主體的形式為 `system:serviceaccount:my-app:llm-client`。

## 將 JWT 綁定到已註冊的代理程式 {#bind-jwts-to-registered-agents}

設定 `agent_id_jwt_field`，以從已驗證的 claim 識別[已註冊的代理程式](../a2a.md#adding-your-agent)。LiteLLM 會先以 `agent_id` 查找該值，然後以 `agent_name` 查找。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    agent_id_jwt_field: "agent_client_id"
    team_id_jwt_field: "team"
```

存在的 claim 若與任何已註冊的代理程式都不相符，會以 `403` 拒絕，包括管理員 token。缺少 claim 時，一般的驗證流程維持不變。解析後，呼叫者會使用該代理程式的[政策與支出歸屬](./access_management/jwt_permissions.md#registered-agent-policies)。

選擇僅由應被視為代理程式的呼叫者攜帶的 claim。例如，Microsoft Entra ID 的 `azp` claim 也可能出現在委派的使用者 token 上；對應它也會綁定或拒絕這些使用者。

當 JWT 解析為現有的[虛擬金鑰對應](./jwt_key_mapping.md) 時，會套用對應金鑰的 `agent_id`，且不會參考 `agent_id_jwt_field`。

## 疑難排解 {#troubleshooting}

診斷被拒絕的請求時，使用 `--detailed_debug` 檢查 `JWT Auth:` 記錄項目。

| 錯誤或症狀 | 檢查 |
| --- | --- |
| `No matching public key found` | 確認 token 的 `kid` 出現在提供者的 JWKS 中。金鑰輪替後，快取的金鑰集可能會保留到 `public_key_ttl` 到期為止。沒有 `kid` 的 token 需要單一金鑰的 JWKS。 |
| `Signature verification failed`（多個提供者時） | 檢查各提供者之間是否有重複的 `kid` 值。使用依 issuer 的設定來限定金鑰查找範圍。 |
| `Invalid issuer` | 將確切的 `iss` 值與 `JWT_ISSUER` 或相符的 issuer 項目比較。 |
| `Audience doesn't match` 或缺少 `aud` | 讓提供者發出設定的 audience，並驗證相符的 `JWT_AUDIENCE` 或依 issuer 的 `audience`。 |
| 演算法不被允許 | 使用受支援的非對稱演算法之一，例如 RS256。 |
| 探索文件沒有 `jwks_uri` | 提供真實的探索 URL，或路徑不包含 `/.well-known/openid-configuration` 的 JWKS URL。 |
| `Missing JWT Public Key URL` | Token 與任何 issuer 項目都不相符，且未設定全域 JWKS URL。請加入預期的 issuer。 |
| JWKS 端點無法到達時的 `503` | 檢查 proxy 到提供者的出口連線，以及設定的快取/過期金鑰視窗。 |
| 團隊或模型存取被拒絕 | 請參閱 [JWT 權限疑難排解](./access_management/jwt_permissions.md#troubleshooting)。 |

<a id="all-jwt-params"></a>

完整的設定結構描述請參閱[原始碼中的 `LiteLLM_JWTAuth`](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/_types.py)。
