# MCP OBO 驗證 {#mcp-obo-auth}

OAuth 2.0 On-Behalf-Of（OBO）驗證讓 LiteLLM 可將使用者傳入的 bearer token 交換為一個具範圍限制的 token，且該 token 對特定 MCP server 有效。

在以下情況使用 OBO：

- 您的 MCP server 應該接收專為該 MCP server 簽發的 token。
- 您的身分識別提供者支援 [RFC 8693 OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)。
- 您希望 LiteLLM 不要將使用者的原始 token 直接轉送到 MCP server。

## 運作方式 {#how-it-works}

```mermaid
flowchart TD
    A[使用者或代理程式使用 bearer token 呼叫 LiteLLM] --> B[LiteLLM 識別目標 MCP server]
    B --> C{MCP server 的 auth_type 是 oauth2_token_exchange 嗎？}
    C -- 否 --> D[使用伺服器設定的驗證流程]
    C -- 是 --> E[LiteLLM 擷取呼叫端 bearer token 作為 subject token]
    E --> F[LiteLLM 向 IdP 發送 RFC 8693 token exchange 請求]
    F --> G[IdP 驗證 subject token、audience、client 與 scopes]
    G --> H[IdP 回傳適用於 MCP server 的具範圍限制 access token]
    H --> I[LiteLLM 依 subject token 和 MCP server 快取具範圍限制的 token]
    I --> J[LiteLLM 使用該具範圍限制的 bearer token 呼叫 MCP server]
    J --> K[MCP server 執行工具並回傳結果]
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

| 欄位 | 必填 | 說明 |
|-------|------|------|
| `auth_type` | 是 | 必須為 `oauth2_token_exchange`。 |
| `token_exchange_endpoint` | 是 | 接受 RFC 8693 token exchange 請求的身分識別提供者 endpoint。 |
| `client_id` | 是 | LiteLLM 呼叫 token exchange endpoint 時使用的 OAuth client 識別碼。 |
| `client_secret` | 是 | LiteLLM 呼叫 token exchange endpoint 時使用的 OAuth client secret。 |
| `audience` | 建議 | MCP server 的資源識別碼。LiteLLM 會將其作為 token exchange `audience` 傳送。 |
| `scopes` | 選用 | LiteLLM 為交換後的 token 請求的 scopes。LiteLLM 會將此清單串接成 OAuth `scope` 參數。 |
| `subject_token_type` | 選用 | RFC 8693 subject token type。預設為 `urn:ietf:params:oauth:token-type:access_token`。 |

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
    "model": "gpt-4o",
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

## 備援行為 {#fallback-behavior}

如果 OBO server 沒有傳入 subject token：

- 如果已設定 `client_id`、`client_secret` 和 `token_url`，LiteLLM 可以備援至 OAuth `client_credentials`。
- 否則，LiteLLM 會記錄警告並在不進行 token exchange 的情況下繼續。

對於嚴格的 OBO 部署，請設定用戶端，使每個請求都包含使用者 bearer token。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查 |
|---------|-------|
| MCP server 收到 LiteLLM key | 將 LiteLLM key 移至 `x-litellm-api-key`，並使用 `Authorization` 作為使用者 token。 |
| Token exchange endpoint 回傳 400 | 確認 `audience`、`scopes`、`client_id` 和 `subject_token_type` 與您的身分識別提供者設定相符。 |
| MCP server 沒有收到 `Authorization` header | 確認 MCP server 已設定 `auth_type: oauth2_token_exchange`，且傳入請求包含使用者 bearer token。 |
| 身分識別提供者在每個請求都被呼叫 | 確認身分識別提供者回傳 `expires_in`，且正在重用相同的使用者 token 與 MCP server。 |
