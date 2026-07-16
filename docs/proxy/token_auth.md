import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 基於 JWT 的 OIDC 驗證  {#oidc---jwt-based-auth}

使用 JWT 來對閘道中的管理員 / 使用者 / 專案進行驗證。

:::info

✨ 基於 JWT 的驗證  只在 LiteLLM Enterprise 中提供

[企業定價](https://www.litellm.ai/#pricing)

[請在此聯絡我們以取得免費試用](https://enterprise.litellm.ai/demo)

:::

:::tip JWT → 虛擬金鑰對應

想要每位使用者的模型限制、支出上限與速率限制，而不必分發 API 金鑰嗎？請參閱 **[JWT → 虛擬金鑰對應](./jwt_key_mapping.md)** — 針對已通過 JWT 驗證使用者的企業級細粒度存取控制（例如 Claude Code + SSO）。

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
  master_key: sk-1234
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
curl --location ' 'https://demo.duendesoftware.com/connect/token'' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id={CLIENT_ID}' \ # 👈 project id
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

在您的環境中設定 `JWT_PUBLIC_KEY_URL`，其值為以逗號分隔的 OIDC 提供者 URL 清單。

```bash
export JWT_PUBLIC_KEY_URL="https://demo.duendesoftware.com/.well-known/openid-configuration/jwks,https://accounts.google.com/.well-known/openid-configuration/jwks"
```

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
    team_alias_jwt_field: "kubernetes\.io.namespace"
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
    "models": ["gpt-4", "claude-sonnet-4-20250514"]
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
  "model": "gpt-4",
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
    team_alias_jwt_field: "kubernetes\.io.namespace"
    user_id_upsert: true
```

如此一來，namespace `production` 中的 pods 會自動與具有 `team_alias: production` 的 team 建立關聯。

### 設定可接受的 JWT scope 名稱  {#set-accepted-jwt-scope-names}

變更 JWT 'scopes' 中的字串，讓 litellm 評估使用者是否具有管理員存取權。

```yaml
general_settings:
  master_key: sk-1234
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
```

### 追蹤終端使用者 / 內部使用者 / Team / Org {#tracking-end-users--internal-users--team--org}

設定 jwt 權杖中的欄位，該欄位對應到 litellm 使用者 / team / org。

**注意：**所有 JWT 欄位都支援點號表示法以存取巢狀 claims（例如，`"user.sub"`、`"resource_access.client.roles"`）。

```yaml
general_settings:
  master_key: sk-1234
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
  master_key: sk-1234
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

```bash
curl -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <your-jwt-token>' \
-H 'x-litellm-team-id: team_id_2' \
-d '{
  "model": "gpt-4",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**驗證：**
- 標頭中的 team ID 必須存在於 JWT 的 `team_ids_jwt_field` 清單中，或符合 `team_id_jwt_field`
- 如果指定了無效的 team，將回傳 403 錯誤
- 如果未提供標頭，LiteLLM 會自動選擇第一個具有所請求模型存取權的 team

### 當 JWT claims 無法解析時，回退至資料庫中的 team {#fall-back-to-db-team-when-jwt-claims-dont-resolve}

預設情況下，當設定了 `team_id_jwt_field` 或 `team_ids_jwt_field`，且 JWT 攜帶的 claim 值**不**對應到任何 LiteLLM team 時，LiteLLM 會回傳錯誤 — 這個 claim 會被視為權威來源。

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
  master_key: sk-1234
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
  master_key: sk-1234
  enable_jwt_auth: True
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
    admin_allowed_routes: ["/v1/embeddings"]
```

**團隊路由**
```yaml
general_settings:
  master_key: sk-1234
  enable_jwt_auth: True
  litellm_jwtauth:
    ...
    team_id_jwt_field: "litellm-team" # 👈 Set field in the JWT token that stores the team ID
    team_allowed_routes: ["/v1/chat/completions"] # 👈 Set accepted routes
```

### 讓團隊可使用其他提供者路由 {#allowing-other-provider-routes-for-teams}

若要讓團隊 JWT token 存取 Anthropic 風格的端點，例如 `/v1/messages`，請在您的 `litellm_jwtauth` 設定中更新 `team_allowed_routes`。`team_allowed_routes` 支援下列值：

- 來自 `LiteLLMRoutes` 的命名路由群組（例如 `openai_routes`、`anthropic_routes`、`info_routes`、`mapped_pass_through_routes`）。

以下是您可使用的路由群組快速參考，以及各群組的代表性範例路由。如果需要完整清單，請參閱 `litellm/proxy/_types.py` 中的 `LiteLLMRoutes` enum 作為權威清單。

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
- `team_allowed_routes`（預設）：`openai_routes`、`info_routes` 
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


### 快取 Public Keys  {#caching-public-keys}

控制 public keys 的快取時間長度（以秒為單位）。

```yaml
general_settings:
  master_key: sk-1234
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
  master_key: sk-1234
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
  master_key: sk-1234
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

    Client->>LiteLLM: 以 Bearer token 發出請求
    Note over LiteLLM: 檢查 UserInfo 快取
    
    LiteLLM->>IdP: GET /userinfo（若未快取）<br/>Authorization: Bearer {token}
    IdP-->>LiteLLM: 使用者資料（sub、email、roles）
    
    Note over LiteLLM: 快取回應（TTL: 5 分鐘）<br/>擷取 user_id、email、roles<br/>執行 RBAC 檢查
    
    LiteLLM-->>Client: 已授權/已拒絕
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

- 當所有已設定的選擇器都與對應的 token 聲明相符時，規則即視為命中（AND 語意）。
- 支援的選擇器：`iss`（必填）、`client_id`（選填）、`scope`（選填）、`aud`（選填）。
- 選擇器值可以是單一字串或字串清單（聲明必須至少符合其中一個項目，依照下列規則）。
- **萬用字元：** 選擇器可使用 shell 風格的 `*` 和 `?`。比對是**區分大小寫**的——請使用與您的 IdP 在 JWT 聲明中發出的相同大小寫。
- **將 `scope` 聲明視為以空格分隔的字串：** OAuth/OIDC 常會將 `scope` 以單一字串傳送（例如 `openid profile App:LiteLLM`）。LiteLLM 只在比對 `scope` 選擇器時才會分割該字串，因此像 `App:LiteLLM` 這樣的設定值可以匹配。**`iss`、`aud` 和 `client_id` 絕不會以空格分割**；會使用完整的聲明字串（路由僅使用未驗證的聲明進行路徑選擇；最終驗證仍會驗證 token）。
- 如果沒有規則命中，LiteLLM 會繼續進行標準 JWT 驗證。

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

- `team_ids_jwt_field`：包含 team IDs 的欄位（以清單形式）。**支援點記法**（例如，`"groups"`、`"teams.ids"`）。
- `user_email_jwt_field`：包含 user email 的欄位。**支援點記法**（例如，`"email"`、`"user.email"`）。
- `end_user_id_jwt_field`：包含用於成本追蹤的 end-user ID 的欄位。**支援點記法**（例如，`"customer_id"`、`"customer.id"`）。

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

### [架構圖（控制模型存取）](./jwt_auth_arch) {#architecture-diagram-control-model-accessjwt_auth_arch}

## [BETA] 使用 Scopes 控制模型存取 {#beta-control-model-access-with-scopes}

控制 JWT 可以存取哪些模型。設定 `enforce_scope_based_access: true` 以強制執行以 scope 為基礎的存取控制。

### 1. 使用 scope 對應設定 config.yaml。 {#1-setup-configyaml-with-scope-mappings}

```yaml
model_list:
  - model_name: anthropic-claude
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: gpt-3.5-turbo-testing
    litellm_params:
      model: gpt-3.5-turbo
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
  "model": "claude-sonnet-4-20250514",
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

當 JWT 進來時，LiteLLM 會在對應表中查找已設定的聲明（例如 `email`、`sub`）。如果存在對應，該請求會被視為是隨對應的虛擬金鑰一起送達 —— 所有虛擬金鑰功能都會套用。

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

**建立對應** — 將 JWT 聲明值連結到既有的虛擬金鑰：

```bash
curl -X POST http://localhost:4000/jwt/key/mapping/new \
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234"
```

**取得特定對應：**

```bash
curl "http://localhost:4000/jwt/key/mapping/info?id=<mapping-id>" \
  -H "Authorization: Bearer sk-1234"
```

**更新對應：**

```bash
curl -X POST http://localhost:4000/jwt/key/mapping/update \
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"id": "<mapping-id>"}'
```

### 運作方式 {#how-it-works-1}

1. 請求攜帶 JWT bearer token 抵達
2. LiteLLM 驗證 JWT 簽章
3. 擷取已設定的 claim（例如 `email` → `user@example.com`）
4. 在 `LiteLLM_JWTKeyMapping` 表中查詢該 claim 值
5. 如果存在對應，請求會如同使用對應的虛擬金鑰一樣繼續進行——預算、速率限制、模型存取與支出追蹤都會套用
6. 如果不存在對應，則回退至標準 JWT 驗證（團隊層級控制）

### 錯誤代碼 {#error-codes}

| 代碼 | 含義 |
|------|---------|
| 409 | 重複對應 — 該 claim 名稱 + 值的對應已存在 |
| 400 | 提供的金鑰與現有虛擬金鑰不符 |
| 404 | 找不到對應（用於更新/刪除/資訊） |
| 403 | 非管理員使用者嘗試執行對應操作 |

## 所有 JWT 參數 {#all-jwt-params}

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/b204f0c01c703317d812a1553363ab0cb989d5b6/litellm/proxy/_types.py#L95)
