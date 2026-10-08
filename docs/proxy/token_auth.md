import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 基於 JWT 的 OIDC 驗證  {#oidc---jwt-based-auth}

使用 JWT 來對閘道中的管理員 / 使用者 / 專案進行驗證。

<EnterpriseFeature feature="JWT-based Auth" />

:::tip[JWT → 虛擬金鑰對應]

想要每位使用者的模型限制、花費上限與速率限制，而不必分發 API 金鑰嗎？請參閱 **[JWT → Virtual Key Mapping](./jwt_key_mapping.md)**，以了解適用於 JWT 驗證使用者的精細存取控制（例如 Claude Code + SSO）。

:::

## 使用方式 {#usage}

### 步驟 1. 設定閘道 {#step-1-setup-proxy}

- `JWT_PUBLIC_KEY_URL`：這是您 OpenID 提供者的公開金鑰端點。通常是 `{openid-provider-base-url}/.well-known/openid-configuration/jwks`。對於 Keycloak，則是 `{keycloak_base_url}/realms/{your-realm}/protocol/openid-connect/certs`。
- `JWT_AUDIENCE`：這是用於解碼 JWT 的受眾。如果未設定，解碼步驟將不會驗證受眾。 

```bash
export JWT_PUBLIC_KEY_URL="" # "https://demo.duendesoftware.com/.well-known/openid-configuration/jwks"
```

- 在您的設定中加入 `enable_jwt_auth`。這會告訴閘道檢查某個權杖是否為 JWT 權杖。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True

model_list:
- model_name: azure-gpt-3.5 
  litellm_params:
      model: azure/<your-deployment-name>
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"
```

### 步驟 2. 建立具 scope 的 JWT  {#step-2-create-jwt-with-scopes}

<Tabs>
<TabItem value="admin" label="admin">

在您的 OpenID 提供者（例如 Keycloak）中建立名為 `litellm_proxy_admin` 的用戶端 scope。

在產生 JWT 時，授予您的使用者 `litellm_proxy_admin` scope。 

```bash
curl --location ' 'https://demo.duendesoftware.com/connect/token'' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id={CLIENT_ID}' \
--data-urlencode 'client_secret={CLIENT_SECRET}' \
--data-urlencode 'username=test-{USERNAME}' \
--data-urlencode 'password={USER_PASSWORD}' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'scope=litellm_proxy_admin' # 👈 grant this scope
```
</TabItem>
<TabItem value="project" label="project">

在您的 OpenID 提供者（例如 Keycloak）中為您的專案建立 JWT。

```bash
# client_id: 👈 project id
curl --location ' 'https://demo.duendesoftware.com/connect/token'' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id={CLIENT_ID}' \
--data-urlencode 'client_secret={CLIENT_SECRET}' \
--data-urlencode 'grant_type=client_credential' \
```

</TabItem>
</Tabs>

### 步驟 3. 測試您的 JWT  {#step-3-test-your-jwt}

<Tabs>
<TabItem value="key" label="/key/generate">

```bash
curl --location '{proxy_base_url}/key/generate' \
--header 'Authorization: Bearer eyJhbGciOiJSUzI1NiI...' \
--header 'Content-Type: application/json' \
--data '{}'
```
</TabItem>
<TabItem value="llm_call" label="/chat/completions">

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJSUzI1...' \
--data '{"model": "azure-gpt-3.5", "messages": [ { "role": "user", "content": "What's the weather like in Boston today?" } ]}'
```

</TabItem>
</Tabs>

## 進階 {#advanced}

### 多個 OIDC 提供者 {#multiple-oidc-providers}

如果您希望 LiteLLM 根據多個 OIDC 提供者（例如 Google Cloud、GitHub Auth）驗證您的 JWT，請使用此功能。

在您的環境中設定 `JWT_PUBLIC_KEY_URL`，值為以逗號分隔的 OIDC 提供者 URL 清單。每個項目可以是 JWKS URL 或 OIDC discovery URL（`.../.well-known/openid-configuration`）；LiteLLM 會擷取 discovery 文件並追蹤其 `jwks_uri`

```bash
export JWT_PUBLIC_KEY_URL="https://demo.duendesoftware.com/.well-known/openid-configuration,https://accounts.google.com/.well-known/openid-configuration"
```

這會以一組共用的 claim 對應，驗證來自每個列出提供者的 token。若您的提供者對某個給定 claim 的內容定義不同，請改用按 issuer 的 claim 對應

#### Token 如何驗證 {#how-a-token-is-validated}

LiteLLM 會從未驗證的 JWT 標頭讀取 `kid`，並依序走訪 `JWT_PUBLIC_KEY_URL` 清單。對每個 URL，它會載入該提供者的金鑰集合，並尋找其 `kid` 等於 token 的金鑰。第一個符合者會勝出，搜尋便在此停止；若沒有任何列出的提供者發布該 `kid`，請求會以 401（`No matching public key found`）被拒絕。此路徑中 `iss` claim 不參與金鑰集合的選擇，因此僅由 `kid` 決定要嘗試哪個提供者的金鑰

沒有 `kid` 標頭的 token，只有在金鑰集合恰好包含一把金鑰時才會符合。若 JWKS 中有多把金鑰，則會被拒絕，因此會輪替金鑰的提供者必須在標頭中放入 `kid`

選定金鑰後，會用它驗證簽章，並檢查 `exp`（若存在，另加 `nbf` 與 `iat`）。可接受的演算法為 RS256/384/512、PS256/384/512、ES256/384/512 與 EdDSA；以 HMAC 簽署的 token（`HS*`）一律會被拒絕。金鑰材料會從 JWK 的 `kty`、`n`、`e`、`x`、`y` 和 `crv` 成員讀取，因此 RSA、EC 與 OKP 金鑰都可使用，而 `x5c` 憑證鏈會被忽略

只有在您要求時，才會驗證 `aud` 和 `iss`。`JWT_AUDIENCE` 會設定預期的 audience（其 `aud` 為清單的 token，若包含該值則通過），而 `JWT_ISSUER` 會設定預期的 `iss`。兩者都是清單中每個 URL 共用的單一值，因此在有多個提供者時，`JWT_ISSUER` 只能接受其中之一；若設定需要為多個提供者驗證 `iss`，必須使用 [per-issuer configuration](#per-issuer-claim-mapping)。兩者都不設定時，任何由清單中任一提供者簽署的 token 都會被接受，不論它是為哪個應用程式簽發，而 proxy 會在首次使用時記錄警告說明此事

#### 快取與失敗行為 {#caching-and-failure-behavior}

每個金鑰集合（以及每個 discovery 文件）都會快取在 proxy 的驗證快取中；若已設定則使用 Redis，否則使用程序內記憶體，快取時間為 `litellm_jwtauth.public_key_ttl` 秒（預設 600）。`kid` miss 在 TTL 內不會觸發重新擷取，因此若 token 是由提供者剛輪替進去的金鑰簽署，會在快取副本過期前被拒絕

當擷取在傳輸層失敗（DNS、連線、TLS、逾時）時，LiteLLM 會以短暫退避最多重試三次，然後將該中斷狀態記住 30 秒，避免並發請求一窩蜂打到失效端點。若該金鑰集合存在最後一次已知正常的副本，且其時間新於 `public_key_ttl + public_key_stale_ttl`（預設 600 + 3600 秒），系統會提供該副本並記錄警告。否則請求會以 503（`the identity provider's JWKS endpoint is temporarily unreachable`）失敗，且不會嘗試清單中的其餘 URL，即使其中之一持有相符的金鑰。將 `public_key_stale_ttl: 0` 設為在快取副本過期時立即 fail closed。非 200 回應或無法解析的內容既不會重試，也不會提供過期副本；它會以 401 使請求失敗，並且停止清單遍歷

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    public_key_ttl: 600
    public_key_stale_ttl: 3600
```

#### 按 issuer 的 claim 對應 {#per-issuer-claim-mapping}

當同一個 claim 會因為是哪個提供者簽發 token 而有不同意義時，請使用 `litellm_jwtauth.issuers`。常見情況是：一個提供者把 team ID 放在 `sub`，另一個則把 user ID 放在那裡，因此單一全域 `team_id_jwt_field: "sub"` 無法同時適用兩者

每個項目都會依據 token 的 `iss` claim 進行比對，並帶有各自的 JWKS URL、audience 與 claim 對應

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    admin_jwt_scope: "litellm_proxy_admin"
    issuers:
      - issuer: "https://accounts.google.com"
        audience: "my-gcp-audience"
        team_id_jwt_field: "sub"

      - issuer: "https://keycloak.example.com/realms/my-realm"
        jwks_url: "https://keycloak.example.com/realms/my-realm/protocol/openid-connect/certs"
        audience: "my-keycloak-audience"
        user_id_jwt_field: "sub"
        user_email_jwt_field: "email"
```

使用此設定時，來自 `accounts.google.com` 的 token 會將 `sub` 解析為 team ID，而來自 Keycloak 的 token 則會將相同的 `sub` 解析為 user ID

##### 按 issuer 的欄位 {#per-issuer-fields}

| 欄位 | 必要 | 說明 |
| --- | --- | --- |
| `issuer` | 是 | 預期的 `iss` claim 值。比對時採用完全相同的字串比較 |
| `audience` | 是，除非已設定 `disable_audience_validation` | 此 issuer 的 token 預期 `aud` |
| `disable_audience_validation` | 是，除非已設定 `audience` | 對此 issuer 略過 audience 驗證。同時設定此項與 `audience` 會被拒絕 |
| `jwks_url` | 否 | 此 issuer 的 JWKS 端點。預設為讀取 `<issuer>/.well-known/openid-configuration` 並追蹤其 `jwks_uri` |
| `team_id_jwt_field` | 否 | 要讀取為 team ID 的 claim 路徑 |
| `team_ids_jwt_field` | 否 | 要讀取為 team ID 清單的 claim 路徑 |
| `user_id_jwt_field` | 否 | 要讀取為 user ID 的 claim 路徑 |
| `user_email_jwt_field` | 否 | 要讀取為 user email 的 claim 路徑 |
| `org_id_jwt_field` | 否 | 要讀取為 organization ID 的 claim 路徑 |
| `end_user_id_jwt_field` | 否 | 要讀取為 end-user ID 的 claim 路徑 |

Claim 路徑支援巢狀 claim 的點記號表示法，例如 `resource_access.my-client.team`

##### 需要知道的事項 {#things-to-know}

每個 issuer 都必須設定 `audience` 或 `disable_audience_validation: true` 其中之一。否則 LiteLLM 會在啟動時拒絕此設定，因此由另一個與您的提供者共用簽署金鑰的應用程式所簽發的 token，無法向您的 proxy 驗證

您未在 issuer 項目中填寫的 claim 對應，會回退到頂層 `litellm_jwtauth` 設定。若您保留全域 `team_id_jwt_field: "sub"`，並新增一個只對 `user_id_jwt_field: "sub"` 進行對應的 issuer，該 issuer 的 token 仍會從 `sub` 讀取 team ID。請將所有 claim 對應移入 `issuers` 以避免此情況

`issuers` 是加法式路由，而非 allow-list。其 `iss` 不符合任何項目的 token 會落回全域 `JWT_PUBLIC_KEY_URL` 與 `JWT_AUDIENCE` 路徑，因此若您只想接受列出的 issuers，請將這些設定留空

比對只針對 `iss`。`kid` 標頭仍會在相符 issuer 的 JWKS 內選擇簽署金鑰

#### 建議的多提供者設定 {#recommended-multi-provider-setup}

若有多個提供者，即使 claim 對應相同，也建議使用 `litellm_jwtauth.issuers`，而非共用清單。`issuers` 項目會將金鑰查找範圍限定於該 issuer 自己的 JWKS，並逐一依提供者驗證 `iss` 與 `aud`，這是共用清單無法做到的。請將 `JWT_PUBLIC_KEY_URL` 保持未設定，讓其 `iss` 未列出的 token 被拒絕（401，`Missing JWT Public Key URL`），而不是落入未限定範圍的路徑。上述的金鑰快取與過期副本回退行為，會以相同方式套用到每個 issuer 的 JWKS

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    user_email_jwt_field: "email"
    issuers:
      - issuer: "https://keycloak.example.com/realms/my-realm"
        audience: "litellm-proxy"

      - issuer: "https://sts.example-cloud.com"
        jwks_url: "https://sts.example-cloud.com/.well-known/jwks.json"
        audience: "litellm-proxy"
```

#### 提供者相容性 {#provider-compatibility}

LiteLLM 不會針對任何身分提供者做特殊處理。只要某個簽發者使用上方列出的其中一種演算法簽署 token、以 JWKS 公開其公鑰（直接公開，或透過包含 `jwks_uri` 的 OIDC discovery 文件）、設定一個出現在該 JWKS 中的 `kid` 標頭，並且簽發一個穩定的 `iss` 值再加上您設定的 audience，就都可以正常運作。本頁展示的 Keycloak 與 Kubernetes 簽發者就是用這種方式公開金鑰；對於其他任何簽發者，請先用解碼後的範例 token 與該提供者的 JWKS 檢查這四點，再決定是否依賴它。

#### 疑難排解 {#troubleshooting}

使用 `--detailed_debug` 執行 proxy，查看說明每個拒絕原因的 `JWT Auth:` 記錄行。

| 症狀 | 原因 | 修正 |
| --- | --- | --- |
| 401 `No matching public key found. keys=[...], kid=...` | 列出的 JWKS 都不包含 token 的 `kid`，或 token 沒有 `kid` 而 JWKS 有多把金鑰 | 確認 token 標頭中的 `kid` 出現在其中一份 JWKS 文件中。如果提供者剛輪替金鑰，請等待 `public_key_ttl`，或重新啟動 proxy |
| 在 `JWT_PUBLIC_KEY_URL` 中有多個提供者時出現 401 `Validation fails: Signature verification failed` | 兩個提供者公開了相同的 `kid`；共享清單會挑選具有它的第一個 URL，並用錯誤的金鑰進行驗證 | 請使用 `litellm_jwtauth.issuers`，讓查找範圍限定在 token 的簽發者 |
| 401 `Validation fails: Invalid issuer` | `iss` 不等於 `JWT_ISSUER`（共享路徑），或不等於比對到的 `issuers[].issuer` | 請從解碼後的 token 原樣複製 `iss`；尾端斜線以及 `http` 與 `https` 都很重要 |
| 401 `Validation fails: Audience doesn't match` 或 `Token is missing the "aud" claim` | `aud` 不包含 `JWT_AUDIENCE` / `issuers[].audience`，或 token 沒有 `aud` | 設定您的提供者實際簽發的 audience（通常是 client ID），或在該簽發者無法簽發時設定 `disable_audience_validation: true` |
| 401 `Validation fails: The specified alg value is not allowed` | Token 是使用 HMAC 簽署，或使用了上方清單以外的演算法 | 將提供者設定為使用 RS256 或其他非對稱演算法簽署 |
| 401 `OIDC discovery document at ... does not contain a 'jwks_uri' field` | 該 URL 包含 `.well-known/openid-configuration`，因此被視為 discovery 文件，但它回傳的是 JWKS | 將 `JWT_PUBLIC_KEY_URL` 指向 discovery 文件本身，或指向路徑不包含該片段的 JWKS URL |
| 503 `the identity provider's JWKS endpoint is temporarily unreachable` | 無法連上 JWKS 或 discovery URL，且沒有可用的舊版快取 | 檢查 proxy 到提供者的對外連線。提高 `public_key_stale_ttl` 以撐過較長的中斷 |
| 401 `Missing JWT Public Key URL from environment` | `iss` 未匹配任何 `issuers` 項目，且未設定 `JWT_PUBLIC_KEY_URL` | 將該簽發者加入 `issuers`，或在應接受未列出簽發者時設定 `JWT_PUBLIC_KEY_URL` |

### Kubernetes ServiceAccount 驗證 {#kubernetes-serviceaccount-authentication}

使用 Kubernetes ServiceAccount 權杖來驗證叢集中執行的工作負載。當您希望 pod 使用其原生 Kubernetes 身分向 LiteLLM 進行驗證時，這很有用。

#### 先決條件 {#prerequisites}

1. 您的 Kubernetes 叢集必須啟用 ServiceAccount 權杖投影（Kubernetes 1.20+ 預設啟用）
2. 您叢集的 OIDC issuer 必須可存取（對 EKS、GKE、AKS 而言這是自動的）

#### 步驟 1：設定 OIDC Discovery URL {#step-1-configure-the-oidc-discovery-url}

將 `JWT_PUBLIC_KEY_URL` 設定為您叢集的 OIDC discovery 端點：

<Tabs>
<TabItem value="eks" label="Amazon EKS">

```bash
# Get your EKS OIDC issuer URL
aws eks describe-cluster --name <cluster-name> --query "cluster.identity.oidc.issuer" --output text

# Set the JWKS URL (append /keys to the issuer URL)
export JWT_PUBLIC_KEY_URL="https://oidc.eks.<region>.amazonaws.com/id/<id>/keys"
```

</TabItem>
<TabItem value="gke" label="Google GKE">

```bash
# GKE uses Google's OIDC provider
export JWT_PUBLIC_KEY_URL="https://container.googleapis.com/v1/projects/<project>/locations/<location>/clusters/<cluster>/jwks"
```

</TabItem>
<TabItem value="aks" label="Azure AKS">

```bash
# Get your AKS OIDC issuer URL
az aks show --name <cluster-name> --resource-group <resource-group> --query "oidcIssuerProfile.issuerUrl" -o tsv

# Set the JWKS URL
export JWT_PUBLIC_KEY_URL="<issuer-url>/openid/v1/jwks"
```

</TabItem>
<TabItem value="self-managed" label="Self-Managed">

```bash
# For self-managed clusters, check your API server's --service-account-issuer flag
# The JWKS endpoint is typically at:
export JWT_PUBLIC_KEY_URL="https://<api-server>/openid/v1/jwks"
```

</TabItem>
</Tabs>

#### 步驟 2：設定 LiteLLM {#step-2-configure-litellm}

設定 LiteLLM 以從 Kubernetes ServiceAccount 權杖中擷取身分資訊：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:  
    # Use namespace as team identifier (resolves via team_alias in DB)
    team_alias_jwt_field: 'kubernetes\.io.namespace'
```

#### 步驟 3：建立 ServiceAccount 並設定 Pod {#step-3-create-serviceaccount-and-configure-pod}

建立一個關聯秘密的 ServiceAccount，並將您的 pod 設定為使用該權杖：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-llm-client
  namespace: my-app
---
apiVersion: v1
kind: Secret
metadata:
  name: my-llm-client-token
  namespace: my-app
  annotations:
    kubernetes.io/service-account.name: my-llm-client
type: kubernetes.io/service-account-token
---
apiVersion: v1
kind: Pod
metadata:
  name: llm-client-pod
  namespace: my-app
spec:
  serviceAccountName: my-llm-client
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: LITELLM_TOKEN
      valueFrom:
        secretKeyRef:
          name: my-llm-client-token
          key: token
```

在 LiteLLM 中設定預期的受眾：

```bash
export JWT_AUDIENCE="https://kubernetes.default.svc"
```

#### 步驟 4：為 Namespace 建立 Team {#step-4-create-team-for-namespace}

在 LiteLLM 中建立一個與 namespace 相符的 team（使用 `team_alias`）：

```bash
curl -X POST 'http://0.0.0.0:4000/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-d '{
    "team_alias": "my-app",
    "team_id": "my-app",
    "models": ["{{openai_large}}", "{{anthropic}}"]
}'
```

#### 步驟 5：使用權杖 {#step-5-use-the-token}

從 pod 內部，權杖可在 `LITELLM_TOKEN` 環境變數中取得：

```bash
# Make a request to LiteLLM using the env var
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_TOKEN" \
-d '{
  "model": "{{openai_large}}",
  "messages": [{"role": "user", "content": "Hello!"}]
}'
```

#### 範例：ServiceAccount 權杖結構 {#example-serviceaccount-token-structure}

Kubernetes ServiceAccount 權杖看起來如下：

```json
{
  "aud": ["litellm-proxy"],
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "https://oidc.eks.us-west-2.amazonaws.com/id/EXAMPLE",
  "kubernetes.io": {
    "namespace": "my-app",
    "pod": {
      "name": "llm-client-pod",
      "uid": "pod-uid"
    },
    "serviceaccount": {
      "name": "my-llm-client",
      "uid": "sa-uid"
    }
  },
  "nbf": 1234567890,
  "sub": "system:serviceaccount:my-app:my-llm-client"
}
```

#### 進階：使用名稱解析將 Namespace 對應至 Team {#advanced-map-namespace-to-team-using-name-resolution}

使用 `team_alias_jwt_field` 可自動將 namespaces 解析為 teams：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    # Map the namespace to team_alias in the database
    team_alias_jwt_field: 'kubernetes\.io.namespace'
    user_id_upsert: true
```

如此一來，namespace `production` 中的 pods 會自動與具有 `team_alias: production` 的 team 建立關聯。

### 設定可接受的 JWT scope 名稱  {#set-accepted-jwt-scope-names}

變更 JWT 'scopes' 中的字串，讓 litellm 評估使用者是否具有管理員存取權。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
```

### 追蹤終端使用者 / 內部使用者 / Team / Org {#tracking-end-users--internal-users--team--org}

設定 jwt 權杖中的欄位，該欄位對應到 litellm 使用者 / team / org。

**注意：**所有 JWT 欄位都支援點號表示法以存取巢狀 claims（例如，`"user.sub"`、`"resource_access.client.roles"`）。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
    team_id_jwt_field: "client_id" # 👈 CAN BE ANY FIELD (supports dot notation for nested claims)
    user_id_jwt_field: "sub" # 👈 CAN BE ANY FIELD (supports dot notation for nested claims)
    org_id_jwt_field: "org_id" # 👈 CAN BE ANY FIELD (supports dot notation for nested claims)
    end_user_id_jwt_field: "customer_id" # 👈 CAN BE ANY FIELD (supports dot notation for nested claims)
```

預期的 JWT（扁平結構）： 

```json
{
  "client_id": "my-unique-team",
  "sub": "my-unique-user",
  "org_id": "my-unique-org"
}
```

**或使用點號表示法的巢狀結構：**

```json
{
  "user": {
    "sub": "my-unique-user",
    "email": "user@example.com"
  },
  "tenant": {
    "team_id": "my-unique-team"
  },
  "organization": {
    "id": "my-unique-org"
  }
}
```

**巢狀範例的設定：**

```yaml
litellm_jwtauth:
  user_id_jwt_field: "user.sub"
  user_email_jwt_field: "user.email"
  team_id_jwt_field: "tenant.team_id"
  org_id_jwt_field: "organization.id"
```

現在 litellm 會在每次呼叫時，自動更新資料庫中該使用者/team/org 的支出。

### 以名稱（別名）而非 ID 解析 {#resolve-by-name-alias-instead-of-id}

有時您的 JWT 權杖會包含人類可讀的名稱，而不是資料庫 ID。LiteLLM 可以透過在資料庫中查找，將這些名稱解析為 ID。

**使用情境：**您的 IDP 在 JWT 中提供 team/org 名稱，但 LiteLLM 進行支出追蹤與存取控制時，需要實際的資料庫 ID。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    # Name-based fields (resolved via database lookup)
    team_alias_jwt_field: "team_alias"       # Resolves team by team_alias in DB
    org_alias_jwt_field: "org_alias"         # Resolves org by organization_alias in DB
```

**預期的 JWT：**

```json
{
  "sub": "user-123",
  "team_alias": "engineering-team",
  "org_alias": "acme-corp"
}
```

**運作方式：**

1. LiteLLM 從已設定的 JWT 欄位擷取名稱
2. 依據別名欄位在資料庫中查找該實體：
   - Teams：`team_alias` 欄位於 `LiteLLM_TeamTable`
   - Organizations：`organization_alias` 欄位於 `LiteLLM_OrganizationTable`
3. 使用解析後的 ID 進行支出追蹤與存取控制

**優先順序：**ID 欄位一律優先於名稱欄位。如果 `team_id_jwt_field` 與 `team_alias_jwt_field` 都已設定，且兩者的值都存在於 JWT 中，則會使用 ID。

```yaml
# Example: ID takes precedence
litellm_jwtauth:
  team_id_jwt_field: "team_id"        # Used if present in JWT
  team_alias_jwt_field: "team_alias"   # Fallback if team_id not present
```

**巢狀欄位：**名稱欄位也支援點號表示法以處理巢狀 claims：

```yaml
litellm_jwtauth:
  team_alias_jwt_field: "organization.team.name"
  org_alias_jwt_field: "company.name"
```

**重要注意事項：**
- 該實體（team/org）必須已存在於資料庫中，且具有相符的別名
- 別名應保持唯一 - 如果多個實體共享相同別名，將回傳錯誤
- 名稱解析需要額外的資料庫查找，因此直接使用 ID 的效能會略佳

### JWT 範圍 {#jwt-scopes}

以下是 JWT 驗證權杖上的 scopes 樣式

**可以是清單**
```
scope: ["litellm-proxy-admin",...]
```

**可以是以空白分隔的字串**
```
scope: "litellm-proxy-admin ..."
```

### 使用 Teams 控制模型存取 {#control-model-access-with-teams}

1. 指定包含使用者所屬 team ids 的 JWT 欄位。 

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups" 
    user_id_upsert: true # add user_id to the db if they don't exist
    enforce_team_based_model_access: true # don't allow users to access models unless the team has access
```

這是假設您的權杖看起來如下：
```
{
  ...,
  "sub": "my-unique-user",
  "groups": ["team_id_1", "team_id_2"]
}
```

2. 在 LiteLLM 上建立 teams 

```bash
curl -X POST '<PROXY_BASE_URL>/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "team_alias": "team_1",
    "team_id": "team_id_1" # 👈 MUST BE THE SAME AS THE SSO GROUP ID
}'
```

3. 測試流程

UI 的 SSO：[**查看逐步說明**](https://www.loom.com/share/8959be458edf41fd85937452c29a33f3?sid=7ebd6d37-569a-4023-866e-e0cde67cb23e)

API 的 OIDC 驗證：[**查看逐步說明**](https://www.loom.com/share/00fe2deab59a426183a46b1e2b522200?sid=4ed6d497-ead6-47f9-80c0-ca1c4b6b4814)

### 流程 {#flow}

- 驗證使用者 id 是否存在於資料庫中（LiteLLM_UserTable）
- 驗證任一 group 是否存在於資料庫中（LiteLLM_TeamTable）
- 驗證任一 group 是否擁有模型存取權
- 若所有檢查都通過，則允許該請求

### 透過請求標頭選擇 Team {#select-team-via-request-header}

當 JWT 權杖包含多個 teams（透過 `team_ids_jwt_field`）時，您可以透過傳遞 `x-litellm-team-id` 標頭，明確選擇要用於某個請求的 team。

此標頭可接受團隊的 `team_id` 或其 `team_alias`。LiteLLM 會先將該值與 JWT 授予的團隊 id 比對；若不屬於其中之一，LiteLLM 會以該別名查找團隊，且只有在該團隊的 id 也是 JWT 授予的其中之一時才接受。無論哪種情況，請求都會以 canonical 的 `team_id` 執行，因此預算、模型存取、速率限制、支出記錄，以及資料庫中的 `team_id` 欄位都會顯示 id，而不會顯示別名。傳送 id 可略過別名查找。

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <your-jwt-token>' \
-H 'x-litellm-team-id: team_id_2' \
-d '{
  "model": "{{openai_large}}",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

同一個請求若改用 `team_id_2` 的別名（設定於 `/team/new` 的 `team_alias`）也會解析為同一個團隊：

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <your-jwt-token>' \
-H 'x-litellm-team-id: team_2' \
-d '{
  "model": "{{openai_large}}",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**驗證：**
- 該值必須是 JWT 的 `team_ids_jwt_field` 清單中的團隊 id（或 `team_id_jwt_field` 值），或其中某個團隊的別名
- 若該值既不是團隊 id 也不是別名，包括 JWT 未授予之團隊的別名，會回傳 403，訊息會說明該值未匹配任何 team id 或 team alias，並列出 JWT 允許的 team id
- 多個團隊共用的別名永遠不會被解析；若要透過別名選擇團隊，請保持別名唯一
- 如果未提供標頭，LiteLLM 會自動選取第一個可存取所請求模型的團隊

使用 `fallback_to_db_teams: true` 且 JWT 不包含 team claim 時，標頭會改為依據資料庫中使用者的團隊成員資格來檢查，而不是依據 JWT，且別名同樣可接受：該值必須是使用者所屬團隊的 id 或別名，否則請求會以 403 被拒絕。

### 當 JWT claims 無法解析時，回退至資料庫中的 team {#fall-back-to-db-team-when-jwt-claims-dont-resolve}

預設情況下，當已設定 `team_id_jwt_field` 或 `team_ids_jwt_field`，且 JWT 帶有一個**不**會對應到任何 LiteLLM 團隊的 claim 值時，LiteLLM 會拋出錯誤：此 claim 會被視為具有權威性。

對於 IdP 團隊 claim 為**建議性**的部署（例如 `groups` claim 位於與 LiteLLM `team_id`s 不同命名空間中的機器 token），可選擇啟用備援：如果已設定的 claim 存在但無法解析，LiteLLM 會改以使用者的單一 LiteLLM 團隊為準（當使用者在資料庫中恰好屬於一個團隊時）。

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups"
    team_claim_fallback: true # 👈 opt in
```

**行為：**

| 觸發條件 | 預設（`team_claim_fallback: false`） | 可選啟用（`team_claim_fallback: true`） |
|---|---|---|
| `team_id` claim 解析為真實團隊 | 200 / 使用團隊 | 200 / 使用團隊 |
| `team_id` claim 存在，但資料庫中找不到團隊 | raise | defer → 備援至使用者的單一資料庫團隊 |
| `team_alias` claim 解析 | 200 / 使用團隊 | 200 / 使用團隊 |
| `groups` claim 解析且團隊授權模型 | 200 | 200 |
| `groups` claim 解析但團隊缺少模型 | 403（保留） | 403（保留） |
| `groups` claim 存在，但沒有任何一個能解析為真實團隊 | 403 | defer → 備援至使用者的單一資料庫團隊 |
| 完全沒有 claim（單一團隊備援基準） | 200 / 備援 | 200 / 備援 |

**安全範圍：** 只有在使用者在資料庫中恰好屬於一個 LiteLLM 團隊時，才會觸發備援；非 404 錯誤（例如 `"No DB Connected"`）一律會向外傳遞。如果您的 IdP 團隊 claims 是授權的權威來源，請維持預設（`false`）。

### 自訂 JWT 驗證 {#custom-jwt-validate}

如果您需要額外方式驗證 token 是否對 LiteLLM Proxy 有效，可使用自訂邏輯驗證 JWT Token。

#### 1. 設定自訂驗證函式 {#1-setup-custom-validate-function}

```python
from typing import Literal

def my_custom_validate(token: str) -> Literal[True]:
  """
  Only allow tokens with tenant-id == "my-unique-tenant", and claims == ["proxy-admin"]
  """
  allowed_tenants = ["my-unique-tenant"]
  allowed_claims = ["proxy-admin"]

  if token["tenant_id"] not in allowed_tenants:
    raise Exception("Invalid JWT token")
  if token["claims"] not in allowed_claims:
    raise Exception("Invalid JWT token")
  return True
```

#### 2. 設定 config.yaml {#2-setup-configyaml}

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_id_jwt_field: "tenant_id"
    user_id_upsert: True
    custom_validate: custom_validate.my_custom_validate # 👈 custom validate function
```

#### 3. 測試流程 {#3-test-the-flow}

**預期 JWT**

```
{
  "sub": "my-unique-user",
  "tenant_id": "INVALID_TENANT",
  "claims": ["proxy-admin"]
}
```

**預期回應**

```
{
  "error": "Invalid JWT token"
}
```

### 允許的路由  {#allowed-routes}

透過設定檔設定 JWT 可存取的路由。

預設情況下： 

- 管理員：只能存取管理路由（`/team/*`、`/key/*`、`/user/*`）
- 團隊：只能存取 openai 路由（`/chat/completions` 等）+ 資訊路由（`/*/info`）

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/b204f0c01c703317d812a1553363ab0cb989d5b6/litellm/proxy/_types.py#L95)

**管理員路由**
```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
    admin_allowed_routes: ["/v1/embeddings"]
```

**團隊路由**
```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    # ...
    team_id_jwt_field: "litellm-team" # 👈 Set field in the JWT token that stores the team ID
    team_allowed_routes: ["/v1/chat/completions"] # 👈 Set accepted routes
```

### 讓團隊可使用其他提供者路由 {#allowing-other-provider-routes-for-teams}

團隊 JWT 已可預設呼叫 `/v1/messages` 和 `/v1/messages/count_tokens`。若要讓團隊 JWT token 存取 `anthropic_routes` 中其他 Anthropic 風格的端點，請更新您 `litellm_jwtauth` 組態中的 `team_allowed_routes`。`team_allowed_routes` 支援以下值：

- 來自 `LiteLLMRoutes` 的具名路由群組（例如 `openai_routes`、`anthropic_routes`、`info_routes`、`mapped_pass_through_routes`）。
- 精確路由，例如 `/v1/messages`。
- 以 `*` 結尾的路由前綴，例如 `/internal-models/*`，可比對該前綴下的每一條路由。

以下是您可使用的路由群組快速參考，以及各群組的代表性範例路由。如果需要完整清單，請參閱 `LiteLLMRoutes` 中的 `litellm/proxy/_types.py` enum 作為權威清單。

| 路由群組 | 內容 | 代表性路由 |
|-------------|------------------|-----------------------|
| `openai_routes` | OpenAI 相容的 REST 端點（chat、completion、embeddings、images、responses、models 等） | `/v1/chat/completions`、`/v1/completions`、`/v1/embeddings`、`/v1/images/generations`、`/v1/models` |
| `anthropic_routes` | Anthropic 風格端點（`/v1/messages` 與相關端點） | `/v1/messages`、`/v1/messages/count_tokens`、`/v1/skills` |
| `mapped_pass_through_routes` | 提供者專屬的轉發路由前綴（例如透過 `/anthropic` 轉發時的 Anthropic）。搭配 `mapped_pass_through_routes` 使用，以進行提供者萬用字元對應 | `/anthropic/*`、`/vertex-ai/*`、`/bedrock/*` |
| `passthrough_routes_wildcard` | 提供者的萬用字元對應（例如 `/anthropic/*`）- 供 proxy 使用的預先計算萬用字元清單 | `/anthropic/*`、`/vllm/*` |
| `google_routes` | Google 專屬（例如 Vertex / Batching 端點） | `/v1beta/models/{model_name}:generateContent` |
| `mcp_routes` | 內部 MCP 管理端點 | `/mcp/tools`、`/mcp/tools/call` |
| `info_routes` | UI 使用的唯讀與資訊端點 | `/key/info`、`/team/info`、`/v1/models` |
| `management_routes` | 僅限管理員的管理端點（建立/更新/刪除 user/team/model） | `/team/new`、`/key/generate`、`/model/new` |
| `spend_tracking_routes` | 預算/支出相關端點 | `/spend/logs`、`/spend/keys`、`/spend/users` |
| `public_routes` | 公開與未驗證端點 | `/`、`/routes`、`/.well-known/litellm-ui-config` |

注意：`llm_api_routes` 是 OpenAI、Anthropic、Google、轉發與其他 LLM 路由（`openai_routes + anthropic_routes + google_routes + mapped_pass_through_routes + passthrough_routes_wildcard + apply_guardrail_routes + mcp_routes + litellm_native_routes`）的聯集。

預設值（若您未在 `litellm_jwtauth` 中覆寫，proxy 會使用的值）：

- `admin_jwt_scope`：`litellm_proxy_admin`
- `admin_allowed_routes`（預設）：`management_routes`、`spend_tracking_routes`、`global_spend_tracking_routes`、`info_routes` 
- `team_allowed_routes`（預設）：`openai_routes`、`info_routes`、`mcp_routes`、`/v1/messages`、`/v1/messages/count_tokens`。設定 `team_allowed_routes` 會取代此清單，因此如果團隊仍需要 `mcp_routes` 和 `/v1/messages` 路由，請將它們加回來
- `public_allowed_routes`（預設）：`public_routes`

範例：允許團隊 JWT 呼叫 Anthropic `/v1/messages`（可透過路由群組或明確路由字串）：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    team_ids_jwt_field: "team_ids"
    team_allowed_routes: ["openai_routes", "info_routes", "anthropic_routes"]
```

或者只選擇性允許精確的 Anthropic message 端點：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    team_ids_jwt_field: "team_ids"
    team_allowed_routes: ["/v1/messages", "info_routes"]
```

如果您註冊了共用同一前綴的 passthrough 端點，請一次以尾端 `*` 授權該前綴，這樣之後新增的路由就能涵蓋到，而不需要再修改設定。`admin_allowed_routes` 支援相同的模式。

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    team_ids_jwt_field: "team_ids"
    team_allowed_routes: ["openai_routes", "info_routes", "/internal-models/*"]
```

只有尾端 `*` 會被視為萬用字元，且它會比對前綴下方的路由，因此 `/internal-models/*` 會涵蓋 `/internal-models/anthropic/v1/messages`，但不包含裸的 `/internal-models` 路由。

### 快取 Public Keys  {#caching-public-keys}

控制 public keys 的快取時間長度（以秒為單位）。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
    admin_allowed_routes: ["/v1/embeddings"]
    public_key_ttl: 600 # 👈 KEY CHANGE
```

### 自訂 JWT 欄位  {#custom-jwt-field}

設定 team_id 所在的自訂欄位。預設會檢查 'client_id' 欄位。 

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    team_id_jwt_field: "client_id" # 👈 KEY CHANGE
```

### 封鎖團隊  {#block-teams}

若要封鎖某個 team id 的所有請求，請使用 `/team/block`

**封鎖團隊**

```bash
curl --location 'http://0.0.0.0:4000/team/block' \
--header 'Authorization: Bearer <admin-token>' \
--header 'Content-Type: application/json' \
--data '{
    "team_id": "litellm-test-client-id-new" # 👈 set team id
}'
```

**解除封鎖團隊**

```bash
curl --location 'http://0.0.0.0:4000/team/unblock' \
--header 'Authorization: Bearer <admin-token>' \
--header 'Content-Type: application/json' \
--data '{
    "team_id": "litellm-test-client-id-new" # 👈 set team id
}'
```

### Upsert 使用者 + 允許的電子郵件網域  {#upsert-users--allowed-email-domains}

允許屬於特定電子郵件網域的使用者自動存取 proxy。

**注意：** `user_allowed_email_domain` 為選填。若未指定，所有使用者都將被允許，不論其電子郵件網域為何。
 
```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: True
  litellm_jwtauth:
    user_email_jwt_field: "email" # 👈 checks 'email' field in jwt payload
    user_allowed_email_domain: "my-co.com" # 👈 OPTIONAL - allows user@my-co.com to call proxy
    user_id_upsert: true # 👈 upserts the user to db, if valid email but not in db
```

## OIDC UserInfo 端點 {#oidc-userinfo-endpoint}

當您的 JWT/access token 不包含可識別使用者的資訊時，請使用此功能。LiteLLM 會呼叫您的身分提供者的 UserInfo 端點以擷取使用者詳細資料。

### 何時使用 {#when-to-use}

- 您的 JWT 是不透明的（非自包含）或缺少使用者 claims
- 您需要從身分提供者取得最新的使用者資訊
- 您的 access tokens 不包含 email、roles 或其他識別資料

### 設定 {#configuration}

```yaml title="config.yaml" showLineNumbers
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    # Enable OIDC UserInfo endpoint
    oidc_userinfo_enabled: true
    oidc_userinfo_endpoint: "https://your-idp.com/oauth2/userinfo"
    oidc_userinfo_cache_ttl: 300  # Cache for 5 minutes (default: 300)
    
    # Map fields from UserInfo response
    user_id_jwt_field: "sub"
    user_email_jwt_field: "email"
    user_roles_jwt_field: "roles"
```

### 流程圖 {#flow-diagram}

```mermaid
sequenceDiagram
    participant Client
    participant LiteLLM
    participant IdP as Identity Provider

    Client->>LiteLLM: Request with Bearer token
    Note over LiteLLM: Check cache for UserInfo
    
    LiteLLM->>IdP: GET /userinfo (if not cached)<br/>Authorization: Bearer {token}
    IdP-->>LiteLLM: User data (sub, email, roles)
    
    Note over LiteLLM: Cache response (TTL: 5min)<br/>Extract user_id, email, roles<br/>Perform RBAC checks
    
    LiteLLM-->>Client: Authorized/Denied
```

### 範例：Azure AD {#example-azure-ad}

```yaml title="config.yaml" showLineNumbers
litellm_jwtauth:
  oidc_userinfo_enabled: true
  oidc_userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo"
  user_id_jwt_field: "sub"
  user_email_jwt_field: "email"
```

### 範例：Keycloak {#example-keycloak}

```yaml title="config.yaml" showLineNumbers
litellm_jwtauth:
  oidc_userinfo_enabled: true
  oidc_userinfo_endpoint: "https://keycloak.example.com/realms/your-realm/protocol/openid-connect/userinfo"
  user_id_jwt_field: "sub"
  user_roles_jwt_field: "resource_access.your-client.roles"
```

## 將 JWT 形狀的機器 tokens 路由至 OAuth2 {#route-jwt-shaped-machine-tokens-to-oauth2}

在以下情況使用：
- `enable_jwt_auth: true` 進行標準 JWT 驗證
- 機器 tokens 為 JWT 形狀，且應根據 claims 路由至 OAuth2

`routing_overrides` 支援兩種運作模式：
- **選擇性模式**：設定 `enable_oauth2_auth: false`，只將符合條件的 JWT 傳送至 LLM + 資訊路由上的 OAuth2
- **全域模式**：設定 `enable_oauth2_auth: true`，也在 LLM + 資訊路由上啟用 OAuth2

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  enable_oauth2_auth: false
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    routing_overrides:
      - iss: "machine-issuer.example.com"
        client_id: "MID_LITELLM"
        path: "oauth2"
```

### 比對行為 {#matching-behavior}

- 當**所有**已設定的選擇器都與對應的 token claim 相符時，規則即成立（AND 語意）。
- 支援的選擇器：`iss`（必填）、`client_id`（選填）、`scope`（選填）、`aud`（選填）。
- 選擇器值可以是單一字串或字串清單（claim 至少必須符合其中一項，並依下列規則比對）。
- **萬用字元：** 選擇器可使用 shell 風格的 `*` 與 `?`。比對是**區分大小寫**的，因此請使用與您的 IdP 在 JWT claim 中輸出的相同大小寫。
- **`scope` claim 作為以空格分隔的字串：** OAuth/OIDC 常會將 `scope` 以單一字串傳送（例如 `openid profile App:LiteLLM`）。LiteLLM 只有在比對 `scope` 選擇器時才會將該字串拆分，因此像 `App:LiteLLM` 這樣的設定值可以比對成功。**`iss`、`aud` 和 `client_id` 絕不會以空格拆分**；會使用完整的 claim 字串（路由只使用未驗證的 claim 進行路徑選擇；最終驗證仍會驗證 token）。
- 如果沒有任何規則匹配，LiteLLM 會繼續進行標準 JWT 驗證。

### 範例：`scope` 與萬用字元 `client_id` {#example-scope-and-wildcard-client_id}

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  enable_oauth2_auth: false
  litellm_jwtauth:
    routing_overrides:
      - iss: "machine-issuer.example.com"
        scope: "App:LiteLLM"
        client_id: "*MID_LITELLM"
        path: "oauth2"
```

### 清單式覆寫範例 {#list-based-override-example}

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  enable_oauth2_auth: false
  litellm_jwtauth:
    routing_overrides:
      - iss: ["machine-issuer.example.com", "backup-issuer.example.com"]
        client_id: ["MID_LITELLM", "MID_BACKUP"]
        aud: ["api://litellm", "api://fallback"]
        path: "oauth2"
```

## [BETA] 使用 OIDC 角色控管存取 {#beta-control-access-with-oidc-roles}

允許具備支援角色的 JWT token 存取 proxy。

讓使用者與團隊可以存取 proxy，而不需要將他們加入資料庫。

非常重要，請設定 `enforce_rbac: true` 以確保 RBAC 系統已啟用。

**注意：** 這項功能目前為 beta，可能會在未經通知的情況下變更。

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    object_id_jwt_field: "oid" # can be either user / team, inferred from the role mapping
    roles_jwt_field: "roles"
    role_mappings:
      - role: litellm.api.consumer
        internal_role: "team"
    enforce_rbac: true # 👈 VERY IMPORTANT

  role_permissions: # default model + endpoint permissions for a role. 
    - role: team
      models: ["anthropic-claude"]
      routes: ["/v1/chat/completions"]

environment_variables:
  JWT_AUDIENCE: "api://LiteLLM_Proxy" # ensures audience is validated
```

- `object_id_jwt_field`：JWT token 中包含 object id 的欄位。此 id 可以是 user id 或 team id。請使用此欄位取代 `user_id_jwt_field` 和 `team_id_jwt_field`。若同一欄位可能同時是兩者。**支援點記法** 以處理巢狀聲明（例如，`"profile.object_id"`）。

- `roles_jwt_field`：JWT token 中包含 roles 的欄位。此欄位是一個使用者所擁有角色的清單。**支援點記法** 用於巢狀欄位 - 例如，`resource_access.litellm-test-client-id.roles`。

**其他 JWT 欄位設定選項：**

- `team_ids_jwt_field`：包含團隊 ID 的欄位（以清單形式）。**支援點記法**（例如 `"groups"`、`"teams.ids"`）。
- `user_email_jwt_field`：包含使用者電子郵件的欄位。**支援點記法**（例如 `"email"`、`"user.email"`）。
- `end_user_id_jwt_field`：包含用於成本追蹤的終端使用者 ID 的欄位。**支援點記法**（例如 `"customer_id"`、`"customer.id"`）。當設定此項時，來自已驗證 JWT claim 的終端使用者 ID 會優先於任何請求提供的值（例如標頭 `x-litellm-end-user-id` 或本文欄位 `metadata.user_id`；請參閱［customer ID 優先順序］(customers#1-make-llm-api-call-w-customer-id)）。

- `role_mappings`：角色對應清單。將 JWT token 中收到的角色對應到 LiteLLM 的內部角色。

- `JWT_AUDIENCE`：JWT token 的 audience。這用於驗證 JWT token 的 audience。透過環境變數設定。

### Token 範例  {#example-token}

```bash
{
  "aud": "api://LiteLLM_Proxy",
  "oid": "eec236bd-0135-4b28-9354-8fc4032d543e",
  "roles": ["litellm.api.consumer"] 
}
```

### 角色對應規格  {#role-mapping-spec}

- `role`：JWT token 中預期的角色。 
- `internal_role`：LiteLLM 上將用於控制存取的內部角色。 

支援的內部角色：
- `team`：將使用 Team 物件進行 RBAC 花費追蹤。請用於追蹤某個「使用情境」的花費。 
- `internal_user`：將使用 User 物件進行 RBAC 花費追蹤。請用於追蹤某個「個別使用者」的花費。
- `proxy_admin`：將使用 Proxy admin 進行 RBAC 花費追蹤。請用於授予 token 管理員存取權限。

### [架構圖（控制模型存取）](./jwt_auth_arch) {#architecture-diagram-control-model-access}

## [BETA] 使用 Scopes 控制模型存取 {#beta-control-model-access-with-scopes}

控制 JWT 可以存取哪些模型。設定 `enforce_scope_based_access: true` 以強制執行以 scope 為基礎的存取控制。

### 1. 使用 scope 對應設定 config.yaml。 {#1-setup-configyaml-with-scope-mappings}

```yaml
model_list:
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt-3.5-turbo-testing
    litellm_params:
      model: {{openai_small}}
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    team_id_jwt_field: "client_id" # 👈 set the field in the JWT token that contains the team id
    team_id_upsert: true # 👈 upsert the team to db, if team id is not found in db
    scope_mappings:
      - scope: litellm.api.consumer
        models: ["anthropic-claude"]
      - scope: litellm.api.gpt_3_5_turbo
        models: ["gpt-3.5-turbo-testing"]
    enforce_scope_based_access: true # 👈 enforce scope-based access control
    enforce_rbac: true # 👈 enforces only a Team/User/ProxyAdmin can access the proxy.
```

#### Scope 對應規格  {#scope-mapping-spec}

- `scope`：JWT token 要使用的 scope。
- `models`：JWT token 可以存取的模型。值為 `model_name` 中的 `model_list`。注意：目前不支援萬用字元路由。

### 2. 建立具有正確 scopes 的 JWT。 {#2-create-a-jwt-with-the-correct-scopes}

預期的 Token：

```bash
{
  "scope": ["litellm.api.consumer", "litellm.api.gpt_3_5_turbo"] # can be a list or a space-separated string
}
```

### 3. 測試流程。 {#3-test-the-flow-1}

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGci...' \
-d '{
  "model": "gpt-3.5-turbo-testing",
  "messages": [
    {
      "role": "user",
      "content": "Hey, how'\''s it going 1234?"
    }
  ]
}'
```

## [BETA] 與 IDP 同步使用者角色與團隊 {#beta-sync-user-roles-and-teams-with-idp}

將您的 Identity Provider（IDP）中的使用者角色與團隊成員資格自動同步到 LiteLLM 的資料庫。這可確保 LiteLLM 中的使用者權限與團隊成員資格與您的 IDP 保持同步。

**注意：** 這項功能目前為 beta，可能會在未經通知的情況下變更。

### 使用情境 {#use-cases}

- **角色同步**：當使用者在您的 IDP 中變更角色時，自動更新 LiteLLM 中的使用者角色
- **團隊成員資格同步**：讓您的 IDP 與 LiteLLM 之間的團隊成員資格保持同步
- **集中式存取管理**：透過您的 IDP 管理所有使用者權限，同時維持 LiteLLM 功能

### 設定 {#setup}

#### 1. 設定 JWT 角色對應 {#1-configure-jwt-role-mapping}

將 JWT token 中的角色對應到 LiteLLM 使用者角色：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups"
    roles_jwt_field: "roles"
    user_id_upsert: true
    sync_user_role_and_teams: true # 👈 Enable sync functionality
    jwt_litellm_role_map: # 👈 Map JWT roles to LiteLLM roles
      - jwt_role: "ADMIN"
        litellm_role: "proxy_admin"
      - jwt_role: "USER"
        litellm_role: "internal_user"
      - jwt_role: "VIEWER"
        litellm_role: "internal_user"
```

#### 2. JWT 角色對應規格 {#2-jwt-role-mapping-spec}

- `jwt_role`：JWT token 中顯示的角色名稱。支援使用 `fnmatch` 的萬用字元樣式（例如，`"ADMIN_*"` 可匹配 `"ADMIN_READ"`、`"ADMIN_WRITE"` 等）
- `litellm_role`：對應的 LiteLLM 使用者角色

**支援的 LiteLLM 角色：**
- `proxy_admin`：完整管理存取權
- `internal_user`：標準使用者存取權
- `internal_user_view_only`：唯讀存取權

#### 3. JWT Token 範例 {#3-example-jwt-token}

```json
{
  "sub": "user-123",
  "roles": ["ADMIN"],
  "groups": ["team-alpha", "team-beta"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 運作方式 {#how-it-works}

當使用者帶著 JWT token 發出請求時：

1. **角色同步**： 
   - LiteLLM 會檢查 JWT 中使用者的角色是否與資料庫中的角色一致
   - 如果不同，使用者角色會在 LiteLLM 的資料庫中更新
   - 使用 `jwt_litellm_role_map` 將 JWT 角色轉換為 LiteLLM 角色

2. **團隊成員資格同步**：
   - 比對 JWT token 中的團隊成員資格與 LiteLLM 中該使用者目前的團隊
   - 將使用者加入 JWT 中出現的新團隊
   - 將使用者從 JWT 中未出現的團隊移除

3. **資料庫更新**：
   - 更新會在驗證程序期間自動進行
   - 不需要手動介入

### 設定選項 {#configuration-options}

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    # Required fields
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups"
    roles_jwt_field: "roles"
    
    # Sync configuration
    sync_user_role_and_teams: true
    user_id_upsert: true
    
    # Role mapping
    jwt_litellm_role_map:
      - jwt_role: "AI_ADMIN_*"  # Wildcard pattern
        litellm_role: "proxy_admin"
      - jwt_role: "AI_USER"
        litellm_role: "internal_user"
```

### 重要注意事項 {#important-notes}

- **效能**：同步操作會在驗證期間進行，可能會增加些微延遲
- **資料庫存取**：需要資料庫存取權才能更新使用者與團隊
- **團隊建立**：JWT token 中提到的團隊必須先存在於 LiteLLM 中，之後同步才能將使用者指派給它們
- **萬用字元支援**：JWT 角色樣式支援使用 `fnmatch` 的萬用字元比對

### 測試同步功能 {#testing-the-sync-feature}

1. **建立一個初始角色的測試使用者**：

```bash
curl -X POST 'http://0.0.0.0:4000/user/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-d '{
    "user_id": "user-123",
    "user_role": "internal_user"
}'
```

2. **發出一個包含不同角色的 JWT 請求**：

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <JWT_WITH_ADMIN_ROLE>' \
-d '{
  "model": "{{anthropic}}",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

3. **驗證角色已更新**：

```bash
curl -X GET 'http://0.0.0.0:4000/user/info?user_id=user-123' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>'
```

## [BETA] JWT 到虛擬金鑰對應 {#beta-jwt-to-virtual-key-mapping}

將 JWT 身分對應到 LiteLLM 虛擬金鑰，讓使用 JWT 驗證的使用者獲得按使用者區分的預算、速率限制、模型存取控制與花費追蹤。

當 JWT 傳入時，LiteLLM 會在對應表中查找已設定的 claim（例如 `email`、`sub`）。如果存在對應，則該請求會被視為是透過相應的虛擬金鑰送達，且所有虛擬金鑰功能都會套用。

### 設定 {#setup-1}

將 `virtual_key_claim_field` 加入您的 JWT 驗證設定：

```yaml
general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    virtual_key_claim_field: "email"         # JWT claim to look up (supports dot notation)
    virtual_key_mapping_cache_ttl: 300       # Cache TTL in seconds (default: 300)
```

### 管理對應 {#managing-mappings}

所有端點都需要管理員驗證（`Authorization: Bearer <master_key>`）。

**建立對應。** 將 JWT claim 值連結到現有的虛擬金鑰：

```bash
curl -X POST http://localhost:4000/jwt/key/mapping/new \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jwt_claim_name": "email",
    "jwt_claim_value": "user@example.com",
    "key": "sk-virtual-key-from-key-generate"
  }'
```

**列出對應**（分頁）：

```bash
curl http://localhost:4000/jwt/key/mapping/list?page=1&size=50 \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**取得特定對應：**

```bash
curl "http://localhost:4000/jwt/key/mapping/info?id=<mapping-id>" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**更新對應：**

```bash
curl -X POST http://localhost:4000/jwt/key/mapping/update \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<mapping-id>",
    "description": "Updated description",
    "is_active": true
  }'
```

**刪除對應：**

```bash
curl -X POST http://localhost:4000/jwt/key/mapping/delete \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<mapping-id>"}'
```

### 運作方式 {#how-it-works-1}

1. 請求攜帶 JWT bearer token 抵達
2. LiteLLM 驗證 JWT 簽章
3. 擷取已設定的 claim（例如 `email` → `user@example.com`）
4. 在 `LiteLLM_JWTKeyMapping` 表中查找 claim 值
5. 如果存在對應，則請求會如同使用已對應的虛擬金鑰般繼續處理，因此預算、速率限制、模型存取與支出追蹤都會套用
6. 如果沒有對應，則回退到標準 JWT 驗證（團隊層級控制）

### 錯誤代碼 {#error-codes}

| 代碼 | 含義 |
|------|---------|
| 409 | 重複對應 — 該 claim 名稱 + 值的對應已存在 |
| 400 | 提供的金鑰與現有虛擬金鑰不符 |
| 404 | 找不到對應（用於更新/刪除/資訊） |
| 403 | 非管理員使用者嘗試執行對應操作 |

## 將 JWT 綁定到已註冊的代理程式 {#bind-jwts-to-registered-agents}

在您的身分識別提供者中佈建代理程式身分（例如，每個代理程式對應一個 Microsoft Entra ID app registration），並讓 LiteLLM 對該代理程式所呈現的每個 JWT 強制執行其政策。當設定 `agent_id_jwt_field` 時，LiteLLM 會從已驗證的 token 讀取該 claim，將其與已註冊的代理程式比對（先依 `agent_id`，再依 `agent_name`），並將 `agent_id` 設定在已驗證身分上。原本已適用於綁定代理程式的虛擬金鑰的一切，也會同樣適用於 JWT 呼叫端：`require_trace_id_on_calls_by_agent`、每個代理程式的 MCP server 與工具限制，以及 `agent_id` 支出歸屬。

### 設定 {#setup-2}

請以您的身分識別提供者會傳送的名稱註冊該代理程式。對於 Entra app token 而言，那就是 client id，Entra 會將其放在 `azp` claim（v2 tokens）或 `appid`（v1 tokens）中。

```yaml
agents:
  - agent_name: 2f5c9b1e-6a4d-4c8e-9f0b-7d1a3e5c9b21   # Entra client id of the agent's app registration
    agent_card_params:
      name: research-agent
      url: http://localhost:9999/a2a
      version: "1.0.0"
    litellm_params:
      require_trace_id_on_calls_by_agent: true

general_settings:
  enable_jwt_auth: True
  litellm_jwtauth:
    agent_id_jwt_field: "azp"   # supports dot notation for nested claims
    team_id_jwt_field: "team"
    user_id_jwt_field: "sub"
```

### 行為 {#behavior}

其 claim 與已註冊代理程式相符的 token，會綁定到該代理程式並繼承其限制，因此在上述設定下，沒有 `x-litellm-trace-id` 的呼叫會以 `400` 被拒絕。其 claim 與任何已註冊代理程式都不相符的 token，會以 `403` 被拒絕，而不會回退為未綁定的身分，這與未知的 `team_id_jwt_field` 值被拒絕的方式相同；這也適用於 admin 範圍的 token。完全不帶該 claim 的 token，則會如同以往一樣完成驗證。當 `agent_id_jwt_field` 未設定時，不會有任何變更。

任何帶有已設定 claim 的 token 都會被視為代理程式。Entra 也會將 `azp` 放在 delegated（user）tokens 上，因此如果人類與代理程式為同一個 audience 取得 token，`azp` 也會綁定或拒絕人類呼叫者。在那種設定下，請將 `agent_id_jwt_field` 指向只有代理程式 token 才會帶有的 claim，例如 optional claim，或透過代理程式 app registrations 上的 claims mapping policy 新增的自訂 claim，並讓 `azp` 保留給所有 JWT 呼叫端皆為代理程式的 proxy。

如果該 token 也透過［JWT-to-Virtual-Key Mapping］(#beta-jwt-to-virtual-key-mapping) 對應到虛擬金鑰，則會使用對應金鑰自身的 `agent_id`，且該請求不會查詢 `agent_id_jwt_field`。

## 所有 JWT 參數 {#all-jwt-params}

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/b204f0c01c703317d812a1553363ab0cb989d5b6/litellm/proxy/_types.py#L95)
