# MCP OBO 驗證 {#mcp-obo-auth}

OAuth 2.0 On-Behalf-Of（OBO）驗證讓 LiteLLM 可將使用者傳入的 bearer token 交換為一個具範圍限制的 token，且該 token 對特定 MCP server 有效。

在以下情況使用 OBO：

- 您的 MCP 伺服器應該接收一個專門為該 MCP 伺服器簽發的權杖。
- 您的身分提供者支援 [RFC 8693 OAuth 2.0 權杖交換](https://datatracker.ietf.org/doc/html/rfc8693)，或是 Microsoft Entra ID，而 LiteLLM 原生支援它（請參閱下方的 [Microsoft Entra ID](#microsoft-entra-id-azure-ad)）。
- 您希望 LiteLLM 不要將使用者的原始權杖直接轉送到 MCP 伺服器。

## 運作方式 {#how-it-works}

```mermaid
flowchart TD
    A[User or agent calls LiteLLM with a bearer token] --> B[LiteLLM identifies the target MCP server]
    B --> C{MCP server auth_type is oauth2_token_exchange?}
    C -- No --> D[Use the server's configured auth flow]
    C -- Yes --> E[LiteLLM extracts the caller bearer token as the subject token]
    E --> F[LiteLLM POSTs an RFC 8693 token exchange request to the IdP]
    F --> G[IdP validates the subject token, audience, client, and scopes]
    G --> H[IdP returns a scoped access token for the MCP server]
    H --> I[LiteLLM caches the scoped token per subject token and MCP server]
    I --> J[LiteLLM calls the MCP server with the scoped bearer token]
    J --> K[MCP server executes the tool and returns the result]
```

簡單來說：

1. 用戶端以 bearer token 向 LiteLLM 發送請求。
2. LiteLLM 將該 bearer token 作為 RFC 8693 `subject_token`。
3. LiteLLM 在您的身分識別提供者的 token exchange endpoint 進行交換。
4. LiteLLM 只將交換後、具範圍限制的 token 轉送給 MCP server。
5. LiteLLM 會快取交換後的 token 直到其過期，因此重複呼叫可避免再次往返身分識別提供者。

## 將 MCP Server 設定為 OBO {#configure-an-mcp-server-for-obo}

在 MCP server 上設定 `auth_type: oauth2_token_exchange`。

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  internal_tools:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: oauth2_token_exchange

    # OAuth 2.0 Token Exchange endpoint on your identity provider
    token_exchange_endpoint: "https://idp.example.com/oauth2/token"

    # Token exchange client registered with your identity provider
    client_id: "<idp-client-id>"
    client_secret: "<idp-client-secret>"

    # Optional but recommended: restrict the exchanged token to this MCP server
    audience: "api://internal-tools-mcp"
    scopes:
      - "mcp.tools.read"
      - "mcp.tools.execute"

    # Optional. Defaults to access_token.
    subject_token_type: "urn:ietf:params:oauth:token-type:access_token"
```

### 設定欄位 {#config-fields}

| 欄位 | 必要 | 說明 |
|-------|----------|-------------|
| `auth_type` | 是 | 必須是 `oauth2_token_exchange`。 |
| `token_exchange_endpoint` | 是 | 接受 RFC 8693 權杖交換請求的身分提供者端點。 |
| `client_id` | 是 | LiteLLM 在呼叫權杖交換端點時使用的 OAuth 用戶端識別碼。 |
| `client_secret` | 是 | LiteLLM 在呼叫權杖交換端點時使用的 OAuth 用戶端密鑰。 |
| `audience` | 建議 | MCP 伺服器的資源識別碼。LiteLLM 會將其作為權杖交換 `audience` 傳送。 |
| `scopes` | 選用 | LiteLLM 為交換後的權杖請求的範圍。LiteLLM 會將清單連接成 OAuth `scope` 參數。 |
| `subject_token_type` | 選用 | RFC 8693 subject token type。預設為 `urn:ietf:params:oauth:token-type:access_token`。 |
| `upstream_token_header` | 選用 | 上游哪個標頭承載交換後的權杖。預設為 `Authorization`。請參閱 [將權杖傳送到不同的標頭](#sending-the-exchanged-token-on-a-different-header)。 |
| `token_exchange_profile` | 選用 | 交換的線路協定。`rfc8693`（預設）使用標準的 token-exchange grant；`entra_obo` 使用 Microsoft Entra ID 的 On-Behalf-Of flow。請參閱 [Microsoft Entra ID](#microsoft-entra-id-azure-ad)。 |

### 將交換後的權杖傳送到不同的標頭 {#sending-the-exchanged-token-on-a-different-header}

預設情況下，交換後的權杖會以 `Authorization: Bearer <token>` 傳出。當 MCP 伺服器位於會從私有標頭讀取自身憑證的 API 閘道後方，而閘道後方的伺服器仍然期望在 `Authorization` 上收到自己的 bearer 時，這兩個憑證都必須走同一個請求。

將 `upstream_token_header` 設定為交換後的權杖應使用的標頭名稱。之後 `static_headers` 之下的內容都會保持不變，因此共用憑證仍可送達閘道後方的伺服器。

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  my_mcp_server:
    url: "https://gateway.example.com/mcp"
    auth_type: oauth2_token_exchange
    token_exchange_endpoint: "https://idp.example.com/token"
    client_id: os.environ/MCP_CLIENT_ID
    client_secret: os.environ/MCP_CLIENT_SECRET
    audience: "api://esb"
    upstream_token_header: "esb-oauth"
    static_headers:
      Authorization: "Bearer os.environ/UPSTREAM_MCP_TOKEN"
```

接著每個上游請求都會同時帶上兩者，而交換後的權杖會限定於呼叫的使用者：

```
esb-oauth: Bearer <token exchanged for this user>
Authorization: Bearer <the shared token you configured>
```

交換後的權杖仍會依使用者快取，因此短效權杖不代表每個請求都要交換。將 `upstream_token_header` 保持未設定可維持預設行為。

如果上游的重新導向跨越來源，客製化標頭會被捨棄而不會被轉送，這與 HTTP 用戶端捨棄 `Authorization` 的方式相同。合法跨來源重新導向的上游將不會在第二次跳轉時看到該憑證。

## Token Exchange 請求 {#token-exchange-request}

對於每個未快取的 subject token 與 MCP server 組合，LiteLLM 會向 `token_exchange_endpoint` 發送如下的 form-encoded 請求：

```http
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<caller-bearer-token>
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&client_id=<idp-client-id>
&client_secret=<idp-client-secret>
&audience=api://internal-tools-mcp
&scope=mcp.tools.read mcp.tools.execute
```

您的身分識別提供者應回傳一個 access token：

```json
{
  "access_token": "scoped-token-for-mcp-server",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

接著 LiteLLM 會使用以下方式呼叫 MCP server：

```http
Authorization: Bearer scoped-token-for-mcp-server
```

## Microsoft Entra ID (Azure AD) {#microsoft-entra-id-azure-ad}

Microsoft Entra ID 不實作上方的 RFC 8693 權杖交換授權。其 On-Behalf-Of flow 改用 RFC 7523 `jwt-bearer` 授權：呼叫端的權杖以 `assertion` 而非 `subject_token` 的形式傳入，沒有 `audience` 參數，而是由僅限 Microsoft 的 `requested_token_use=on_behalf_of` 擴充將該授權轉換為委派，而不是單純的 jwt-bearer 交換。LiteLLM 將 Entra 視為第一級設定檔，因此指向 Entra 是設定變更，而不是不同的整合：設定 `token_exchange_profile: entra_obo`，LiteLLM 就會建立 jwt-bearer 格式而非 RFC 8693 格式。

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  internal_tools:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: oauth2_token_exchange
    token_exchange_profile: entra_obo

    # Your Entra tenant's v2.0 token endpoint
    token_exchange_endpoint: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token"

    # App registration LiteLLM uses to call the token endpoint. The caller's
    # token must have been issued with this client_id as its `aud`.
    client_id: "<entra-app-client-id>"
    client_secret: "<entra-app-client-secret>"

    # Entra has no audience parameter, so the target resource goes in scope
    # as <app-id-uri>/.default
    scopes:
      - "api://internal-tools-mcp/.default"
```

`audience` 和 `subject_token_type` 在 `entra_obo` 中不使用：Entra 沒有 audience 參數（目標資源會改放在 `scope` 中），而 jwt-bearer 授權不會檢查 subject token type。

對於每一組未快取的呼叫端權杖與 MCP 伺服器配對，LiteLLM 會傳送：

```http
POST /<tenant-id>/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=<caller-bearer-token>
&scope=api://internal-tools-mcp/.default
&requested_token_use=on_behalf_of
&client_id=<entra-app-client-id>
&client_secret=<entra-app-client-secret>
```

Entra 回傳與上方相同的存取權杖回應格式，而 LiteLLM 會以相同方式快取並轉送交換後的權杖，不論設定檔為何。

:::note
呼叫端的權杖必須是為 LiteLLM 的應用程式註冊所簽發，而不是其他 Entra 應用程式。如果您的測試工具是向不同的應用程式註冊進行驗證，請先讓它為此應用程式的範圍請求一個權杖，然後再將該權杖傳送給 LiteLLM。
:::

## 呼叫 OBO MCP Server {#calling-an-obo-mcp-server}

傳入請求必須包含使用者的 bearer token，讓 LiteLLM 有可供交換的 `subject_token`。

對於直接 MCP 呼叫，請將 LiteLLM key 保留在 `x-litellm-api-key` 中，並將 `Authorization` 留給使用者 token：

```bash title="Direct MCP call" showLineNumbers
curl -X POST "https://litellm.example.com/internal_tools/mcp" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer <litellm-api-key>" \
  -H "Authorization: Bearer <user-token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

對於 Responses API，請將 MCP tool headers 與 LiteLLM key 分開，並與使用者 token 分離傳遞：

```bash title="Responses API with MCP OBO" showLineNumbers
curl -X POST "https://litellm.example.com/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <litellm-api-key>" \
  -d '{
    "model": "{{openai_large}}",
    "input": "List the available internal tools",
    "tools": [
      {
        "type": "mcp",
        "server_label": "internal_tools",
        "server_url": "https://litellm.example.com/internal_tools/mcp",
        "require_approval": "never",
        "headers": {
          "x-litellm-api-key": "Bearer <litellm-api-key>",
          "Authorization": "Bearer <user-token>"
        }
      }
    ]
  }'
```

:::tip
如果 MCP client 只能傳送一個 `Authorization` header，請將 LiteLLM key 放在 `x-litellm-api-key`，並將 `Authorization` 保留給使用者的 token。LiteLLM 需要使用者 token 作為 OBO `subject_token`。
:::

## 快取行為 {#caching-behavior}

LiteLLM 會依下列條件快取交換後的 tokens：

- subject token
- MCP server ID

這表示兩個不同的使用者會取得各自獨立的交換後 tokens，而同一位使用者對同一個 MCP server 的重複呼叫，會重用快取的 token，直到其過期。

快取 TTL 以 `expires_in` 減去 LiteLLM 的 OAuth 到期緩衝區為基準。若 `expires_in` 遺失或無效，LiteLLM 會使用預設的 OAuth token cache TTL。

## 沒有 Subject Token 的請求 {#requests-without-a-subject-token}

如果對 `oauth2_token_exchange` 伺服器的請求沒有使用者 bearer 權杖，LiteLLM 會以 `401 Unauthorized` 和 `WWW-Authenticate: Bearer resource_metadata="/.well-known/oauth-protected-resource/mcp/<server_name>", error="invalid_token", error_description="Missing or invalid subject token; authenticate with the IdP and retry"` 拒絕它。不會退回到 OAuth `client_credentials`，而且在沒有交換後權杖的情況下，該請求絕不會被轉送到 MCP 伺服器。

如果您也需要對同一個 MCP 伺服器進行機器對機器存取，請另外註冊一個伺服器項目，並設定 `auth_type: oauth2` 和 `client_id`、`client_secret` 與 `token_url`。在該項目上設定 `oauth2_flow: client_credentials`；該代理程式會拒絕在沒有明確 `oauth2_flow` 的情況下啟動 `oauth2` 伺服器。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查 |
|---------|-------|
| MCP server 收到 LiteLLM key | 將 LiteLLM key 移至 `x-litellm-api-key`，並使用 `Authorization` 作為使用者 token。 |
| Token exchange endpoint 回傳 400 | 確認 `audience`、`scopes`、`client_id` 和 `subject_token_type` 與您的身分識別提供者設定相符。 |
| MCP server 沒有收到 `Authorization` header | 確認 MCP server 已設定 `auth_type: oauth2_token_exchange`，且傳入請求包含使用者 bearer token。 |
| 身分識別提供者在每個請求都被呼叫 | 確認身分識別提供者回傳 `expires_in`，且正在重用相同的使用者 token 與 MCP server。 |
