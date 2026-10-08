# MCP ID-JAG Auth (Okta) {#mcp-id-jag-auth-okta}

ID-JAG（Identity Assertion Authorization Grant，[draft-ietf-oauth-identity-assertion-authz-grant](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)）可讓 LiteLLM 取得一個 MCP 伺服器的 access token，而該伺服器的授權伺服器與使用者的 identity provider 不同。Okta 將此功能作為 [AI agent token exchange](https://developer.okta.com/docs/guides/ai-agent-token-exchange/-/main/) 提供。

在以下情況使用 ID-JAG：

- MCP 伺服器信任一個 resource authorization server（例如 Okta custom authorization server），而它與驗證您使用者身分的 org authorization server 是分開的。
- 您希望由 identity provider 的管理員政策，而不是互動式同意畫面，來決定 gateway 是否可代表使用者呼叫 MCP。這就是它能用於 headless agents 的原因。
- 您希望 gateway 取得的存取權限以使用者為範圍、可稽核，並且可由 identity provider 撤銷。

ID-JAG 與 [OBO token exchange](./mcp_obo_auth) 不同：OBO 是在單一 authorization server 上進行一次 RFC 8693 交換，而 ID-JAG 則是跨兩個 authorization servers 的兩段流程。

## 運作方式 {#how-it-works}

```mermaid
flowchart TD
    A[使用者登入，client 取得 Okta id_token] --> B[Client 使用 id_token 呼叫 LiteLLM]
    B --> C{MCP server auth_type 是否為 oauth2_id_jag?}
    C -- 否 --> D[使用伺服器已設定的 auth flow]
    C -- 是 --> E[第 1 段：LiteLLM 向 org authorization server POST RFC 8693 token exchange，requested_token_type=id-jag]
    E --> F[Org authorization server 套用管理員政策並回傳已簽署的 ID-JAG assertion]
    F --> G[第 2 段：LiteLLM 以 ID-JAG 向 resource authorization server POST RFC 7523 jwt-bearer grant]
    G --> H[Resource authorization server 驗證 ID-JAG 並回傳 access token]
    H --> I[LiteLLM 依 subject token 與 MCP server 快取 access token]
    I --> J[LiteLLM 使用 access token 呼叫 MCP server]
    J --> K[MCP server 執行工具並回傳結果]
```

簡而言之：

1. client 使用使用者的 `id_token` 向 LiteLLM 發送請求。
2. LiteLLM 會將該 `id_token` 作為 RFC 8693 `subject_token`，並在 org authorization server（`token_exchange_endpoint`）將其交換為 ID-JAG assertion。
3. LiteLLM 透過 RFC 7523 `jwt-bearer` grant，將 ID-JAG 提交給 resource authorization server（`id_jag_resource_token_endpoint`），並取得 MCP access token。
4. LiteLLM 只將 access token 傳給 MCP server。
5. LiteLLM 會快取 access token，直到其過期，因此同一使用者的重複呼叫可避免兩次 authorization-server 往返。

LiteLLM 使用 private-key-JWT `client_assertion`（RFC 7523）向兩個 authorization servers 驗證身分，這也是 Okta 的要求。當未設定 private key 時，它會退回使用 `client_secret`。

## 設定 Okta {#set-up-okta}

ID-JAG 需要 **Okta for AI Agents** 訂閱。高階步驟如下：

1. 將 LiteLLM gateway 註冊為 OAuth app（agent）。將其設定為 `private_key_jwt` client authentication，並以上傳 public key 作為 JWKS，同時將相對應的 private key 保留給 LiteLLM。請記下 `kid`。
2. 確認 org authorization server token endpoint，也就是 `https://<your-org>.okta.com/oauth2/v1/token`。這是第 1 段的 `token_exchange_endpoint`。
3. 設定 MCP 所信任的 resource（custom）authorization server，其 token endpoint 為 `https://<your-org>.okta.com/oauth2/<custom-as-id>/v1/token`。這是第 2 段的 `id_jag_resource_token_endpoint`。其 issuer identifier 是第 1 段的 `audience`。
4. 設定跨應用程式 access policy，授權 gateway app 為該 resource 取得 ID-JAG，包括它可請求的 scopes。

請參閱 Okta 的 [AI agent token exchange guide](https://developer.okta.com/docs/guides/ai-agent-token-exchange/-/main/) 以取得逐步點選式設定。

## 為 ID-JAG 設定 MCP Server {#configure-an-mcp-server-for-id-jag}

在 MCP server 上設定 `auth_type: oauth2_id_jag`。

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  internal_tools:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: oauth2_id_jag

    # Org authorization server token endpoint (leg 1: token exchange -> ID-JAG)
    token_exchange_endpoint: "https://your-org.okta.com/oauth2/v1/token"

    # Resource (custom) authorization server token endpoint (leg 2: jwt-bearer -> access token)
    id_jag_resource_token_endpoint: "https://your-org.okta.com/oauth2/<custom-as-id>/v1/token"

    # Gateway app registered with Okta
    client_id: "<okta-agent-client-id>"

    # Private-key-JWT client authentication (RFC 7523). Okta requires this.
    client_private_key: |
      -----BEGIN PRIVATE KEY-----
      ...
      -----END PRIVATE KEY-----
    client_private_key_id: "<jwks-kid>"
    client_assertion_signing_alg: "RS256"

    # Resource authorization server identifier; sent as the leg-1 audience
    audience: "https://your-org.okta.com/oauth2/<custom-as-id>"

    # Optional RFC 8707 resource indicator for leg 1
    id_jag_resource: "https://mcp.example.com/"

    # Optional scopes requested for the access token
    scopes:
      - "mcp.tools.read"
      - "mcp.tools.execute"
```

### 設定欄位 {#config-fields}

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| `auth_type` | 是 | 必須為 `oauth2_id_jag`。 |
| `token_exchange_endpoint` | 是 | 第 1 段的 org authorization server token endpoint（RFC 8693 token exchange）。 |
| `id_jag_resource_token_endpoint` | 是 | 第 2 段的 resource authorization server token endpoint（RFC 7523 jwt-bearer grant）。 |
| `client_id` | 是 | authorization servers 上 gateway app 的 OAuth client identifier。 |
| `client_private_key` | 建議 | LiteLLM 用來簽署 `client_assertion` 的 PEM private key。Okta 必填。 |
| `client_private_key_id` | 選用 | 在 `client_assertion` JWT header 中以 `kid` 顯示的 key id。 |
| `client_assertion_signing_alg` | 選用 | `client_assertion` 的 signing algorithm。預設為 `RS256`。 |
| `client_secret` | 選用 | 僅在未設定 `client_private_key` 時作為備援。 |
| `audience` | 建議 | Resource authorization server identifier。LiteLLM 會將此作為第 1 段的 `audience` 傳送。 |
| `id_jag_resource` | 選用 | 第 1 段傳送的 RFC 8707 resource indicator。 |
| `scopes` | 選用 | LiteLLM 請求的 scopes。會合併成 OAuth `scope` 參數。 |
| `subject_token_type` | 選用 | 第 1 段的 subject token type。ID-JAG 預設為 `urn:ietf:params:oauth:token-type:id_token`。 |

## 兩段流程 {#the-two-legs}

### 第 1 段：交換 ID-JAG {#leg-1-token-exchange-for-an-id-jag}

對於每一組未快取的 subject token 與 MCP server 配對，LiteLLM 會向 `token_exchange_endpoint` POST RFC 8693 token exchange：

```http
POST /oauth2/v1/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&requested_token_type=urn:ietf:params:oauth:token-type:id-jag
&subject_token=<user-id-token>
&subject_token_type=urn:ietf:params:oauth:token-type:id_token
&audience=https://your-org.okta.com/oauth2/<custom-as-id>
&resource=https://mcp.example.com/
&scope=mcp.tools.read mcp.tools.execute
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=<signed-jwt>
```

org authorization server 會套用其管理員政策並回傳 ID-JAG assertion：

```json
{
  "issued_token_type": "urn:ietf:params:oauth:token-type:id-jag",
  "access_token": "<id-jag-jwt>",
  "token_type": "N_A",
  "expires_in": 300
}
```

ID-JAG 是一個帶有 `typ: oauth-id-jag+jwt` 的簽署 JWT，其 `aud` 為 resource authorization server。

### 第 2 段：用 jwt-bearer 取得 access token {#leg-2-jwt-bearer-for-the-access-token}

LiteLLM 透過 RFC 7523 grant 將 ID-JAG 提交給 `id_jag_resource_token_endpoint`：

```http
POST /oauth2/<custom-as-id>/v1/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=<id-jag-jwt>
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=<signed-jwt>
```

resource authorization server 會驗證 ID-JAG 並回傳 access token：

```json
{
  "access_token": "access-token-for-mcp-server",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

接著 LiteLLM 會使用以下內容呼叫 MCP server：

```http
Authorization: Bearer access-token-for-mcp-server
```

## 呼叫 ID-JAG MCP Server {#calling-an-id-jag-mcp-server}

第 1 段需要一個身分 token 來做 assertion。LiteLLM 會從兩個位置擇一取得。若請求在 `Authorization` 中攜帶使用者的 `id_token`，該 token 就是 subject。否則，LiteLLM 會使用其在使用者透過 LiteLLM SSO 登入時為已驗證使用者擷取的 identity assertion，這也是為何僅持有 LiteLLM virtual key 的 agent 能夠以該 key 所屬的使用者身分存取 MCP server。使用者永遠是 virtual key 所對應的那位；沒有任何請求欄位可以選擇要在上游 assert 哪個身分。

當您自行傳送 `id_token` 時，請將 LiteLLM key 放在 `x-litellm-api-key`，並將 `Authorization` 保留給使用者 token：

```bash title="Direct MCP call" showLineNumbers
curl -X POST "https://litellm.example.com/internal_tools/mcp" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer <litellm-api-key>" \
  -H "Authorization: Bearer <user-okta-id-token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

:::tip
如果 MCP client 只能送出一個 `Authorization` header，請將 `x-litellm-api-key` 用於 LiteLLM key，並將 `Authorization` 保留給使用者的 `id_token`。LiteLLM 需要 `id_token` 作為第 1 段的 `subject_token`。
:::

### 只使用 virtual key 的儲存來源 subject {#store-sourced-subject-with-a-virtual-key-only}

若沒有 `Authorization` header，只要任何已透過 LiteLLM SSO 登入至少一次且其 assertion 尚未過期的使用者，皆可使用相同呼叫：

```bash title="Virtual key only" showLineNumbers
curl -X POST "https://litellm.example.com/internal_tools/mcp" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer <litellm-api-key>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Assertion 讀取會依程序快取 `MCP_SSO_ASSERTION_CACHE_TTL_SECONDS`（預設 60），因此某個 pod 上新的 SSO 登入會在一個 TTL 內對其他 pod 可見。

## 連線時的憑證錯誤 {#credential-errors-at-connect-time}

在像 `/internal_tools/mcp` 或 `/mcp/internal_tools` 這類單一伺服器路由上，LiteLLM 會在開啟 MCP session 之前先解析 ID-JAG 憑證，因此失敗會以 client 可處理的 HTTP 狀態回傳，而不是以看似沒有 tools 的 session 呈現。這適用於儲存來源流程（沒有 `Authorization` header），也正是在這裡，以下失敗會在呼叫任何 authorization server 之前被判定。

| 狀態 | 含義 | 修正方式 |
|--------|---------|---------------|
| `412 Precondition Failed` | 此使用者沒有儲存身分斷言，或已儲存的斷言已過期。回應主體會說明是哪一種。 | 使用者透過 LiteLLM SSO 登入，讓閘道擷取最新的斷言。 |
| `503 Service Unavailable` | 斷言儲存區（LiteLLM 資料庫）無法連線。 | 使用者端無需處理；請檢查資料庫連線。 |

412 是帶有 JSON 主體的純狀態碼，不是 OAuth 挑戰。沒有 `WWW-Authenticate` 標頭，因為用戶端無法透過擷取授權伺服器中繼資料並重試來解析它；只有 LiteLLM SSO 登入才能修正。

```bash
$ curl -s -i -X POST https://litellm.example.com/mcp/internal_tools \
    -H "x-litellm-api-key: Bearer <litellm-api-key>" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
HTTP/1.1 412 Precondition Failed
content-type: application/json

{"detail":"precondition required: ID-JAG requires an IdP identity assertion for this user and none is stored. Sign in through LiteLLM SSO so the gateway captures one."}
```

同一路由上的 `tools/call` 會回傳相同的 412，而不是回報工具不存在。

在同時服務多個伺服器的彙總 `/mcp` 路由上，某一個伺服器的憑證失敗不得導致整個連線失敗，因此會改為逐一伺服器回報。`tools/list` 成功時，失敗的伺服器不會提供任何工具，而原因會出現在回應的 `_meta` 中：

```json
{"_meta":{"litellm.ai/server_outcomes":{"internal_tools":{"status":"internal","http_status":412}}},"tools":[]}
```

如果您看到這種形式，並且想直接取得狀態與訊息，請呼叫單一伺服器路由上的伺服器。

已知限制：當請求帶有 `Authorization` bearer 時，`tools/list` 目前仍會從已儲存的斷言解析主體，而 `tools/call` 則使用 bearer。因此，若呼叫端具有有效的 `id_token` 但沒有已儲存的斷言，便會取得上方那個帶有 `_meta` 的空清單 412，而不是連線時狀態；而且該請求不會執行 pre-flight，因此無法拒絕工具呼叫本來會接受的憑證。透過 LiteLLM SSO 登入一次即可移除這種不一致。

## 快取行為 {#caching-behavior}

LiteLLM 會依主體 token 與 MCP 伺服器 ID 快取第二階段存取 token，因此兩位不同使用者會取得各自獨立的 token，而同一位使用者對同一個 MCP 伺服器的重複呼叫，則會重用快取的 token，直到其到期為止。快取 TTL 以第二階段 `expires_in` 減去 LiteLLM 的 OAuth 到期緩衝時間為基礎。若 `expires_in` 缺失或無效，LiteLLM 會使用預設的 OAuth token 快取 TTL。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查項目 |
|---------|-------|
| MCP 伺服器收到 LiteLLM 金鑰 | 將 LiteLLM 金鑰移到 `x-litellm-api-key`，並使用 `Authorization` 作為使用者 `id_token`。 |
| 連線時出現 `412 Precondition Failed` | 此使用者沒有已儲存的 SSO 斷言，或已過期。請使用者透過 LiteLLM SSO 登入，然後重試。請參閱[連線時的憑證錯誤](#credential-errors-at-connect-time)。 |
| 連線時出現 `503 Service Unavailable` | 斷言儲存區無法連線。請檢查 LiteLLM 資料庫連線。 |
| `tools/list` 不會回傳任何工具，且 `_meta` 顯示 `http_status: 412` | 您使用的是彙總 `/mcp` 路由。請呼叫單一伺服器路由以直接取得狀態與訊息。 |
| 第 1 階段回傳 400 或 403 | 確認跨應用程式存取政策已授權閘道應用程式對應資源與 scope，且 `audience` 與資源授權伺服器識別碼相符。 |
| 第 1 階段回傳 401 | 確認 `client_id`、`client_private_key` 與 `client_private_key_id` 符合閘道應用程式已註冊的 JWKS。 |
| 第 2 階段拒絕斷言 | 確認 `id_jag_resource_token_endpoint` 指向信任組織授權伺服器的資源授權伺服器，且其時鐘與 ID-JAG `exp` 一致。 |
| 授權伺服器在每次請求時都會被呼叫 | 確認第 2 階段回傳 `expires_in`，且使用的是相同的使用者 `id_token` 與 MCP 伺服器。 |
