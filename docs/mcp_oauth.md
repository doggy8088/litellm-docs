# MCP OAuth {#mcp-oauth}

LiteLLM 支援 MCP 伺服器的幾種 OAuth 2.0 模式。每個 `auth_type: oauth2` 伺服器在 `config.yaml` 中都必須透過 `oauth2_flow` 宣告其流程；轉送模式本身是各自的 `auth_type` 值，詳見 [MCP OAuth 轉送](./mcp_oauth_passthrough.md)：

| 流程 | `oauth2_flow` | 使用情境 | 運作方式 |
|------|---------------|----------|--------------|
| **互動式（PKCE）** | `authorization_code` | 面向使用者的應用程式（Claude Code、Cursor） | 以瀏覽器為基礎的同意流程、每位使用者各自的權杖 |
| **機器對機器（M2M）** | `client_credentials` | 後端服務、CI/CD、自動化代理程式 | `client_credentials` 授權，代理管理的權杖 |
| **代為（OBO）** | n/a（使用 `auth_type: oauth2_token_exchange`） | 具使用者脈絡的工具呼叫，呼叫受保護的 MCP 伺服器 | LiteLLM 將呼叫者權杖交換為具範圍限定的 MCP 權杖。請參閱 [MCP OBO 驗證](./mcp_obo_auth.md)。 |
| **轉送（透明）** | n/a（使用 `auth_type: true_passthrough`） | 用戶端已持有上游權杖；LiteLLM 不另外加入任何驗證 | 原樣轉送用戶端的 `Authorization`，不經 LiteLLM 准入。 [請參閱 MCP OAuth 轉送](./mcp_oauth_passthrough.md) |
| **委派的上游 OAuth** | n/a（使用 `auth_type: oauth_delegate`） | LiteLLM 准入呼叫者；上游負責工具授權 | LiteLLM 准入加上另一個轉送的上游 bearer，同時保留費用與速率限制。 [請參閱 MCP OAuth 轉送](./mcp_oauth_passthrough.md) |

互動式流程中的每位使用者權杖都會儲存在呼叫該金鑰的 `user_id` 底下。關於這與服務帳戶金鑰如何互動，以及非 OAuth 的每位使用者選項（每次請求標頭、BYOK 金鑰、每位使用者環境變數），請參閱 [每位使用者與每把金鑰的上游憑證](./mcp_per_user_auth.md)。

## 互動式 OAuth（PKCE） {#interactive-oauth-pkce}

對於面向使用者的 MCP 用戶端（Claude Code、Cursor），LiteLLM 支援完整的帶有 PKCE 的 OAuth 2.0 授權碼流程。

### 設定 {#setup}

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  github_mcp:
    url: "https://api.githubcopilot.com/mcp"
    auth_type: oauth2
    oauth2_flow: authorization_code
    client_id: os.environ/GITHUB_OAUTH_CLIENT_ID
    client_secret: os.environ/GITHUB_OAUTH_CLIENT_SECRET
```

[**請參閱 Claude Code 教學**](/docs/tutorials/claude_responses_api)

### 運作方式 {#how-it-works}

```mermaid
sequenceDiagram
    participant Browser as User-Agent (Browser)
    participant Client as Client
    participant LiteLLM as LiteLLM Proxy
    participant MCP as MCP Server (Resource Server)
    participant Auth as Authorization Server

    Note over Client,LiteLLM: Step 1 – Resource discovery
    Client->>LiteLLM: GET /.well-known/oauth-protected-resource/{mcp_server_name}/mcp
    LiteLLM->>Client: Return resource metadata

    Note over Client,LiteLLM: Step 2 – Authorization server discovery
    Client->>LiteLLM: GET /.well-known/oauth-authorization-server/{mcp_server_name}
    LiteLLM->>Client: Return authorization server metadata

    Note over Client,Auth: Step 3 – Dynamic client registration
    Client->>LiteLLM: POST /{mcp_server_name}/register
    LiteLLM->>Auth: Forward registration request
    Auth->>LiteLLM: Issue client credentials
    LiteLLM->>Client: Return client credentials

    Note over Client,Browser: Step 4 – User authorization (PKCE)
    Client->>Browser: Open authorization URL + code_challenge + resource
    Browser->>Auth: Authorization request
    Note over Auth: User authorizes
    Auth->>Browser: Redirect with authorization code
    Browser->>LiteLLM: Callback to LiteLLM with code
    LiteLLM->>Browser: Redirect back with authorization code
    Browser->>Client: Callback with authorization code

    Note over Client,Auth: Step 5 – Token exchange
    Client->>LiteLLM: Token request + code_verifier + resource
    LiteLLM->>Auth: Forward token request
    Auth->>LiteLLM: Access (and refresh) token
    LiteLLM->>Client: Return tokens

    Note over Client,MCP: Step 6 – Authenticated MCP call
    Client->>LiteLLM: MCP request with access token + LiteLLM API key
    LiteLLM->>MCP: MCP request with Bearer token
    MCP-->>LiteLLM: MCP response
    LiteLLM-->>Client: Return MCP response
```

**參與者**

- **Client** -- 啟動 OAuth 探索、授權與工具呼叫、代表使用者操作的具備 MCP 功能的 AI 代理程式（例如 Claude Code、Cursor，或其他 IDE/代理程式）。
- **LiteLLM Proxy** -- 在保護已儲存憑證的同時，處理所有 OAuth 探索、註冊、token 交換與 MCP 流量。
- **Authorization Server** -- 透過動態用戶端註冊、PKCE 授權與 token 端點發出 OAuth 2.0 token。
- **MCP Server (Resource Server)** -- 接收 LiteLLM 已驗證 JSON-RPC 請求的受保護 MCP 端點。
- **User-Agent (Browser)** -- 暫時參與其中，讓最終使用者可在授權步驟中授予同意。

**流程步驟**

1. **資源探索**：用戶端會從 LiteLLM 的 `.well-known/oauth-protected-resource` 端點擷取 MCP 資源中繼資料，以了解範圍與功能。
2. **授權伺服器探索**：用戶端透過 LiteLLM 的 `.well-known/oauth-authorization-server` 端點取得 OAuth 伺服器中繼資料（token 端點、authorization 端點、支援的 PKCE 方法）。
3. **動態用戶端註冊**：用戶端透過 LiteLLM 註冊，而 LiteLLM 會將請求轉送至授權伺服器（RFC 7591）。如果提供者不支援動態註冊，您可以在 LiteLLM 中預先儲存 `client_id`/`client_secret`（例如 GitHub MCP），流程會以相同方式進行。
4. **使用者授權**：用戶端啟動瀏覽器工作階段（含 code challenge 與 resource hints）。使用者核准存取後，授權伺服器會透過 LiteLLM 將 code 傳回給用戶端。
5. **Token 交換**：用戶端以 authorization code、code verifier 與 resource 呼叫 LiteLLM。LiteLLM 會與授權伺服器交換這些資訊，並傳回已核發的 access/refresh tokens。
6. **MCP 呼叫**：有了有效 token 後，用戶端會將 MCP JSON-RPC 請求（以及 LiteLLM API key）送至 LiteLLM，LiteLLM 再將其轉送至 MCP server，並轉遞工具回應。

如需其他參考，請參閱官方 [MCP Authorization Flow](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization#authorization-flow-steps)。

### 靜態 OAuth 用戶端的重新導向 URL {#static-client-redirect-urls}

當上游身分識別提供者（IdP）要求應用程式事先註冊時，請使用靜態 OAuth 用戶端。在 LiteLLM MCP 伺服器項目中設定應用程式的 `client_id` 與 `client_secret`。這支援不提供動態用戶端註冊（RFC 7591）的提供者。

授權流程使用兩個回呼 URL：

| 回呼 | 用途 | 設定 |
|----------|---------|---------------|
| LiteLLM 回呼 | 接收來自上游 IdP 的授權回應。 | 在 IdP 應用程式的 **Redirect URI** 或 **Callback URL** 欄位中註冊 `<proxy origin>/callback`。 |
| MCP 用戶端回呼 | 將來自 LiteLLM 的授權回應返回給 MCP 用戶端。 | 用戶端會將此 URL 作為 `redirect_uri` 提供給 `/{mcp_server_name}/authorize`。當下方驗證規則需要時，請在 LiteLLM 中設定額外受信任的回呼。 |

範例來說，位於 `https://llm.example.com` 的代理程式會使用 `https://llm.example.com/callback` 作為其 IdP 回呼。桌面用戶端的本機回呼，例如 `http://localhost:33418/callback`，是提供給 LiteLLM 的，不需要在上游 IdP 中註冊。

#### 設定上游 OAuth 應用程式 {#configure-the-upstream-oauth-application}

將 `PROXY_BASE_URL` 設為代理程式的公開 origin，並向 IdP 註冊對應的 `/callback` URL：

```bash
export PROXY_BASE_URL=https://llm.example.com
# IdP callback URL: https://llm.example.com/callback
```

LiteLLM 會依序從 `PROXY_BASE_URL`、受信任的 `X-Forwarded-*` 標頭，或傳入的請求 URL 解析其公開 origin。關於標頭信任需求，請參閱 [反向代理與 ingress 設定](#reverse-proxy-and-ingress-configuration)。

將應用程式的憑證與 OAuth 端點加入 MCP 伺服器設定：

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  jira_mcp:
    url: https://mcp.example.com/mcp
    auth_type: oauth2
    oauth2_flow: authorization_code
    client_id: os.environ/JIRA_OAUTH_CLIENT_ID
    client_secret: os.environ/JIRA_OAUTH_CLIENT_SECRET
    authorization_url: https://idp.example.com/oauth2/authorize
    token_url: https://idp.example.com/oauth2/token
    scopes:
      - read:jira-work
```

請以您的提供者對應值取代範例伺服器 URL、OAuth 端點與範圍。當上游 MCP 伺服器發布 LiteLLM 可探索的 OAuth 中繼資料時，`authorization_url` 與 `token_url` 為選用。明確設定的端點會優先於衝突的已探索端點。

當上游伺服器完全未發布任何 OAuth 中繼資料時（例如 [ms-365-mcp-server](./mcp_servers/microsoft_365.md) 後方的 Microsoft Graph），請加入 `per_server_oauth_discovery: true`，讓 LiteLLM 自行發布 `/{mcp_server_name}/mcp` 的探索文件，並以自己的 `/{mcp_server_name}/authorize` 與 `/{mcp_server_name}/token` 端點作為上方提供者 URL 的前端。此設定僅在 `auth_type: oauth2`、`oauth2_flow: authorization_code` 且沒有 `delegate_auth_to_upstream` 時才接受。

對於靜態用戶端，LiteLLM 會在本機處理 `POST /{mcp_server_name}/register`。它會將 MCP 伺服器名稱回傳為 `client_id`、`dummy` 回傳為 `client_secret`，以及用戶端提交的 `redirect_uris`。LiteLLM 會使用已設定的上游憑證進行授權與權杖交換。

#### 識別 MCP 用戶端的回呼 URL {#identify-the-mcp-clients-callback-url}

從用戶端的 `redirect_uris` 欄位（位於 `POST /{mcp_server_name}/register`）或其在 `redirect_uri` 中的 `GET /{mcp_server_name}/authorize` 參數取得回呼 URL。回呼路徑與連接埠可能因用戶端版本與部署而異。

若發生 origin 不符，`HTTP 400` 回應會在 `detail.redirect_uri` 中包含提交的 URL。代理程式也會在警告層級將被拒絕的值記錄為 `MCP OAuth: rejecting redirect_uri '<value>'`。

以下範例總結常見的回呼設定：

| 用戶端或回呼類型 | 回呼範例 | LiteLLM 設定 |
|-------------------------|------------------|-----------------------|
| Cursor | `cursor://anysphere.cursor-mcp/oauth/callback` | 已包含在內建的受信任回呼中。 |
| 使用 loopback listener 的桌面或命令列用戶端 | `http://localhost:33418/callback` | loopback 回呼可接受任何連接埠。 |
| 網頁版 VS Code | `https://vscode.dev/redirect` 或 `https://insiders.vscode.dev/redirect` | 將 `vscode.dev,insiders.vscode.dev` 加入 `MCP_TRUSTED_REDIRECT_ORIGINS`。 |
| 位於不同 origin 的 Web 應用程式 | `https://app.example.com/oauth/callback` | 將 `app.example.com` 加入 `MCP_TRUSTED_REDIRECT_ORIGINS`。 |
| 使用自訂 URI scheme 的原生用戶端 | `myclient://auth/callback` | 將回呼 URI 加入 `MCP_TRUSTED_NATIVE_REDIRECT_URIS`。 |
| LiteLLM Admin UI | `<proxy origin>/ui/mcp/oauth/callback` | 當代理程式解析後的公開 origin 與 UI origin 相符時可接受。 |

對於需要額外受信任回呼的用戶端，請在代理程式部署中設定適用的環境變數：

```bash
# Trusted HTTPS client hosts, with optional ports or wildcard subdomains.
export MCP_TRUSTED_REDIRECT_ORIGINS='app.example.com,*.tools.example.com'

# Trusted native client callback URIs.
export MCP_TRUSTED_NATIVE_REDIRECT_URIS='myclient://auth/callback'
```

`MCP_TRUSTED_REDIRECT_ORIGINS` 接受以逗號分隔的主機或 `host:port` 項目清單。`MCP_TRUSTED_NATIVE_REDIRECT_URIS` 接受以逗號分隔的原生回呼 URI 清單。請包含回呼路徑；`myclient://auth/callback` 與 `myclient://auth/callback/` 是不同的項目。

#### 重新導向 URI 驗證 {#redirect-uri-validation}

針對每個伺服器的靜態 OAuth，`/{mcp_server_name}/authorize` 會依這些規則驗證回呼：

| 回呼類型 | 要求 |
|---------------|--------------|
| 受信任的原生回呼 | 與內建的 Cursor 回呼或 `MCP_TRUSTED_NATIVE_REDIRECT_URIS` 中的項目相符。 |
| Loopback | 使用 HTTP 或 HTTPS，且主機為 `localhost`、`127.0.0.0/8` 中的位址，或 `::1`。任何連接埠與路徑都可接受。 |
| 相同 origin | 使用與代理程式解析後公開 origin 相同的通訊協定、主機與連接埠。預設連接埠會被標準化。 |
| 額外受信任 origin | 使用 HTTPS，且主機或 `host:port` 列在 `MCP_TRUSTED_REDIRECT_ORIGINS` 中。像 `*.tools.example.com` 這類萬用字元會比對子網域，包括 `a.tools.example.com`，但不包含 `tools.example.com` 本身。 |

回呼 URL 必須包含主機，且不得包含片段（`#...`）、內嵌憑證（`user:pass@host`），或主機中的反斜線。自訂 URI scheme 需要受信任的原生回呼項目。原生回呼 URI 不得包含查詢字串。HTTP 與 HTTPS 回呼可以包含查詢字串，LiteLLM 在重新導向至用戶端時會予以保留。

#### 疑難排解回呼錯誤 {#troubleshoot-callback-errors}

當 LiteLLM 拒絕每個伺服器的回呼時，會回傳 `HTTP 400`，並將 `detail.error` 設為 `invalid_request`。`detail.error_description` 會指出驗證失敗原因。部分回應也會包含 `detail.hint` 與設定指引；origin 不符的回應則會包含 `detail.redirect_uri`。

| 錯誤或症狀 | 解決方式 |
|------------------|------------|
| 上游 IdP 回報重新導向 URI 不符。 | 請確認 IdP 應用程式註冊的回呼為 `<proxy origin>/callback`，且 LiteLLM 解析出的公開原始來源符合預期。 |
| LiteLLM 拒絕來自代理伺服器公開原始來源的回呼。 | 設定 `PROXY_BASE_URL` 或設定受信任的轉送標頭。請參閱 [反向代理與入口配置](#reverse-proxy-and-ingress-configuration)。 |
| LiteLLM 拒絕來自不同原始來源的 HTTPS 回呼。 | 將已核准的用戶端主機（如適用，請包含其連接埠）加入 `MCP_TRUSTED_REDIRECT_ORIGINS`。 |
| LiteLLM 拒絕自訂 URI scheme。 | 將用戶端的回呼 URI 加入 `MCP_TRUSTED_NATIVE_REDIRECT_URIS`。 |
| LiteLLM 回報回呼包含 URL 片段。 | 設定用戶端使用不含片段的回呼 URL。 |

例如，原始來源不符的回應會包含以下欄位：

```json title="Origin mismatch response (selected fields)"
{
  "detail": {
    "error": "invalid_request",
    "error_description": "redirect_uri origin (https://app.example.com) does not match the proxy origin. host/port: redirect_uri 'app.example.com' does not match the proxy origin",
    "redirect_uri": "https://app.example.com/oauth/callback"
  }
}
```

#### 閘道動態用戶端註冊 {#gateway-dynamic-client-registration}

彙總的 `/mcp` 端點透過 `POST /register`、`GET /authorize` 和 `POST /token` 使用閘道層級註冊。每次註冊接受一到四個 `redirect_uris`，每個 URI 最多 256 個字元。

對於此流程，提供給 `/authorize` 的 `redirect_uri` 必須與已註冊值完全相符。未註冊的值會回傳 `HTTP 400`，並附帶以下最上層 JSON 欄位：

```json
{
  "error": "invalid_request",
  "error_description": "redirect_uri is not registered for this client"
}
```

每台伺服器的靜態註冊會回傳預留憑證，且不會儲存特定於用戶端的回呼允許清單。其授權端點會套用上方所述的每台伺服器驗證規則。

#### 驗證配置 {#verify-the-configuration}

使用以下請求來驗證探索、靜態註冊與授權重新導向。範例使用一個在 `http://localhost:4000` 上監聽、搭配 `PROXY_BASE_URL=https://llm.example.com`，以及上述 `jira_mcp` 配置的代理。

擷取授權伺服器中繼資料：

```bash
curl -sS http://localhost:4000/.well-known/oauth-authorization-server/jira_mcp | jq .issuer
# "https://llm.example.com/jira_mcp"
```

發行者的原始來源是 `https://llm.example.com`，因此 IdP 回呼 URL 為 `https://llm.example.com/callback`。

驗證靜態註冊回應：

```bash
curl -sS -X POST http://localhost:4000/jira_mcp/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"my-mcp-client","redirect_uris":["http://localhost:33418/callback"]}'
# {"client_id":"jira_mcp","client_secret":"dummy","redirect_uris":["http://localhost:33418/callback"]}
```

使用迴圈回呼請求授權：

```bash
curl -sS -o /dev/null -D - --get http://localhost:4000/jira_mcp/authorize \
  --data-urlencode 'response_type=code' \
  --data-urlencode 'client_id=jira_mcp' \
  --data-urlencode 'redirect_uri=http://localhost:33418/callback' \
  --data-urlencode 'state=example-state' \
  --data-urlencode 'code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' \
  --data-urlencode 'code_challenge_method=S256'
```

預期回應為 `HTTP 307 Temporary Redirect`。其 `Location` 標頭指向上游授權端點，並包含已設定的上游 `client_id` 以及 URL 編碼後的 `redirect_uri=https://llm.example.com/callback`。

若要驗證額外受信任的原始來源，請使用 `redirect_uri=https://app.example.com/oauth/callback` 重複授權請求。若沒有相符的 `MCP_TRUSTED_REDIRECT_ORIGINS` 項目，預期回應為 `HTTP 400`。設定 `MCP_TRUSTED_REDIRECT_ORIGINS=app.example.com`，重新啟動代理，然後重複該請求；預期回應為 `HTTP 307`。

### 反向代理與 ingress 設定 {#reverse-proxy-and-ingress-configuration}

如果 LiteLLM 執行於 TLS 終止型 ingress（Kubernetes、ALB、nginx、Cloudflare 等）之後，proxy 需要知道其公開 origin，才能讓 OAuth `authorize` 端點比較瀏覽器提供的 `redirect_uri`（例如 `https://llm.example.com/ui/mcp/oauth/callback`）與其自身的 scheme + host + port。如果 proxy 解析到其內部位址（`http://<pod-ip>:4000`），相同來源檢查就會失敗，而 MCP server 頁面上的 **Connect** 按鈕會回傳 `400 Bad Request` 與 `{"detail":"invalid_request"}`。

最簡單且建議的修正方式，是將 `PROXY_BASE_URL` 設為使用者在網址列中看到的精確 origin：

```bash
PROXY_BASE_URL=https://llm.example.com
```

此值規則：

- 只能是完整 origin：scheme + host（+ 若非預設則含 port）。
- 不可有結尾斜線，也不可包含 path 元件。
- 必須與網址列完全一致。`https://llm.example.com` 與 `https://llm.example.com:443` 會被視為相同的 origin（預設 port 會被正規化移除），但 `https://llm.example.com` 不會與執行於 `https://llm.example.com:8443` 的瀏覽器相符。

當設定了 `PROXY_BASE_URL` 時，LiteLLM 會直接使用它，並略過下方所述的 `X-Forwarded-*` 信任路徑。

#### Origin 解析順序 {#origin-resolution-order}

對於 MCP OAuth 端點，LiteLLM 會依下列順序解析 proxy 的公開 origin：

1. **`PROXY_BASE_URL` env var** — 若設定且為有效的 `http(s)` URL，則會原樣使用。無效值會被忽略並記錄警告。
2. **`X-Forwarded-Proto` / `X-Forwarded-Host` / `X-Forwarded-Port`** — 僅在 **同時** [`use_x_forwarded_for`](./proxy/config_settings#general_settings---reference) 為 `true` **且** 請求對等端的 IP 落在 [`mcp_trusted_proxy_ranges`](./proxy/config_settings#general_settings---reference) 內時才會接受。若在未設定 `use_x_forwarded_for` 的情況下啟用 `mcp_trusted_proxy_ranges`，則這些標頭不會被信任（因為無法區分受信任的反向 proxy 與直接攻擊者）。
3. **`request.base_url`** — FastAPI 在請求上看到的字面 URL。對於經由 ingress 的部署，這通常是 `http://<internal-host>:4000`，且不會與瀏覽器 origin 相符。

如果您無法或不想設定 `PROXY_BASE_URL`，請明確設定 X-Forwarded 路徑：

```yaml title="config.yaml" showLineNumbers
general_settings:
  use_x_forwarded_for: true
  mcp_trusted_proxy_ranges:
    - "10.0.0.0/8"      # your ingress / load-balancer CIDR(s)
```

並確認您的 ingress 會送出 `X-Forwarded-Proto`、`X-Forwarded-Host`，以及（若非預設）`X-Forwarded-Port`。請參閱 [MCP OAuth 疑難排解](./mcp_troubleshoot#mcp-oauth-invalid-request) 取得診斷用 curl。

#### 允許其他第一方 redirect_uri origin {#allowing-additional-first-party-redirect_uri-origins}

如果第一方 OAuth client 位於姊妹網域（例如，`app.example.com` 上的內部 web app，向 `llm.example.com` 上的 MCP proxy 註冊），請設定 `MCP_TRUSTED_REDIRECT_ORIGINS`，以將其 origin 加入允許清單，除了 proxy 自身的 origin 之外：

```bash
MCP_TRUSTED_REDIRECT_ORIGINS=app.example.com,*.tools.example.com
```

- 以逗號分隔的 `host` 或 `host:port` 項目清單。
- 僅限 HTTPS。允許清單路徑會拒絕任何非 `https` 的 `redirect_uri`。
- `*.suffix` 項目會比對任何嚴格更深一層的 `suffix` 子網域（`*.tools.example.com` 會比對 `a.tools.example.com`，但不會比對 `tools.example.com`）。
- Loopback（`localhost`、`127.0.0.0/8`、`::1`）無論此設定為何一律接受。

這適用於您可控的第一方 OAuth 用戶端。對於標準的入口案例，請優先使用 `PROXY_BASE_URL`。

#### 為什麼會存在同源檢查 {#why-the-same-origin-check-exists}

MCP 代理的 `/v1/mcp/server/oauth/<server_id>/authorize` 端點會驗證呼叫者的 `redirect_uri` 是否與代理本身的公開原始來源共享 scheme + host + port（或與上述其中一個迴圈回呼／允許清單項目相符）。此檢查的目的在於防止攻擊者以釣魚方式誘導已登入的管理員點擊一個連結，將授權碼經由攻擊者控制的主機轉送，進而影響像 GitHub 或 Slack 這類受上游 OAuth 保護的 MCP 伺服器。相同來源（加上明確的營運允許清單）是與用於原生 MCP 用戶端的僅限迴圈回呼規則在威脅模型上同等安全的做法。

`PROXY_BASE_URL` 是入口部署的正確逃逸閥，因為營運者是透過帶外方式宣告代理程式的真實公開來源，而不是要求代理程式從攻擊者可能可設定的標頭推斷。此檢查本身不會放寬。

## 機器對機器（M2M）驗證 {#machine-to-machine-m2m-auth}

LiteLLM 會使用 `client_credentials` 授權，自動擷取、快取並重新整理 OAuth2 權杖。無需手動管理權杖。

### 設定 {#setup-1}

您可以透過 LiteLLM UI 或 `config.yaml` 設定 M2M OAuth。

### UI 設定 {#ui-setup}

前往 **MCP Servers** 頁面並點擊 **+ Add New MCP Server**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/d1f1e89c-a789-4975-8846-b15d9821984a/ascreenshot_630800e00a2e4b598baabfc25efbabd3_text_export.jpeg)

輸入您的伺服器名稱，並將傳輸類型選為 **HTTP**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/2008c9d6-6093-4121-beab-1e52c71376aa/ascreenshot_516ffd6c7b524465a253a56048c3d228_text_export.jpeg)

貼上 MCP 伺服器 URL。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/b0ee8b7d-6de8-492b-8962-287987feec29/ascreenshot_b3efca82078a4c6bb1453c58161909f9_text_export.jpeg)

在 **Authentication** 下選擇 **OAuth**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/e1597814-ff8e-40b9-9d7b-864dcdbe0910/ascreenshot_2097612712264d8f9e553f7ca9175fb0_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/f6ea5694-f28a-4bc3-9c9a-bb79f199bd65/ascreenshot_9be839f55b1b4f96bfe24030ba2c7f8d_text_export.jpeg)

選擇 **Machine-to-Machine (M2M)** 作為 OAuth 流程類型。這是使用 `client_credentials` 授權的伺服器對伺服器驗證，且不需要瀏覽器互動。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/9853310c-1d86-4628-bad1-7a391eca0e4d/ascreenshot_f302a286fa264fdd8d56db53b8f9395c_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/df64dc65-ef86-475d-adaf-12e227d5e873/ascreenshot_9e2f41d43a76435f918a00b52ffcc639_text_export.jpeg)

填入您的 OAuth 提供者提供的 **Client ID** 與 **Client Secret**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/0de5a7bd-9898-4fc7-8843-b23dd5aac47f/ascreenshot_b9087aaa81a14b5b9c199929efc4a563_text_export.jpeg)

輸入 **Token URL**，也就是 LiteLLM 將用來透過 `client_credentials` 擷取存取權杖的端點。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/0aea70f1-558c-4dca-91bc-1175fe1ddc89/ascreenshot_b3fcf8a1287e4e2d9a3d67c4a29f7bff_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/e842ef09-1fd7-47a6-909b-252d389f0abc/ascreenshot_2a87dad3624847e7ac370591d1d1aedd_text_export.jpeg)

向下捲動並檢查伺服器 URL 與所有欄位，然後按一下 **Create MCP Server**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/0857712b-4b53-40f8-8c1f-a4c72edaa644/ascreenshot_47be3fcd5de64ed391f70c1fb74a8bfc_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/9d961765-955f-4905-a3dc-1a446aa3b2cc/ascreenshot_43fd39d014224564bc6b35aced1fb6d3_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/3825d5fa-8fd1-4e71-b090-77ff0259c3f6/ascreenshot_2509a7ebd9bf421eb0e82f2553566745_text_export.jpeg)

建立完成後，開啟伺服器並前往 **MCP Tools** 分頁，以確認 LiteLLM 可以連線並列出可用工具。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/8107e27b-5072-4675-8fd6-89b47692b1bd/ascreenshot_f774bc76138f430d808fb4482ebfcdca_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/ce94bb7b-c81b-4396-9939-178efb2cdfce/ascreenshot_28b838ab6ae34c76858454555c4c1d79_text_export.jpeg)

選取一個工具（例如 **echo**）來測試。填入所需參數，然後按一下 **Call Tool**。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/c459c1d3-ec29-4211-9c28-37fbe7783bbc/ascreenshot_e9b138b3c2cc4440bb1a6f42ac7ae861_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/5438ac60-e0ac-4a79-bf6f-5594f160d3b5/ascreenshot_9133a17d26204c46bce497e74685c483_text_export.jpeg)

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/a8f6821b-3982-4b4d-9b25-70c8aff5ac31/ascreenshot_28d474d0e62545a482cff6128527883a_text_export.jpeg)

LiteLLM 會在幕後自動擷取 OAuth token 並呼叫工具。結果確認 M2M OAuth 流程已端對端正常運作。

![](https://colony-recorder.s3.amazonaws.com/files/2026-02-10/c3924549-a949-48d1-ac67-ab4c30475859/ascreenshot_8f6eca9d717f45478d50a881bd244bb3_text_export.jpeg)

### Config.yaml 設定 {#configyaml-setup}

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  my_mcp_server:
    url: "https://my-mcp-server.com/mcp"
    auth_type: oauth2
    oauth2_flow: client_credentials
    client_id: os.environ/MCP_CLIENT_ID
    client_secret: os.environ/MCP_CLIENT_SECRET
    token_url: "https://auth.example.com/oauth/token"
    scopes: ["mcp:read", "mcp:write"]  # optional
```

### 將權杖送到不同的標頭 {#sending-the-token-on-a-different-header}

預設情況下，LiteLLM 解析出的權杖會以 `Authorization: Bearer <token>` 送出，這也是
幾乎所有 MCP 伺服器所預期的。某些部署會將 MCP 伺服器置於 API 閘道之後，該閘道會
從私有標頭讀取自己的憑證，而閘道後方的伺服器仍希望自己的 bearer 置於 `Authorization`。
這就需要在同一個請求中帶上兩組憑證。

設定 `upstream_token_header` 來指定已解析權杖應使用的標頭。您在 `static_headers`
下設定的任何內容都會保持不變，因此第二組憑證會原封不動地送到閘道後方的伺服器。

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  my_mcp_server:
    url: "https://my-mcp-server.com/mcp"
    auth_type: oauth2
    oauth2_flow: client_credentials
    client_id: os.environ/MCP_CLIENT_ID
    client_secret: os.environ/MCP_CLIENT_SECRET
    token_url: "https://auth.example.com/oauth/token"
    upstream_token_header: "esb-oauth"
    static_headers:
      Authorization: "Bearer os.environ/UPSTREAM_MCP_TOKEN"
```

之後每個送往 MCP 伺服器的請求都會同時帶有：

```
esb-oauth: Bearer <the token LiteLLM minted>
Authorization: Bearer <the token you configured>
```

若不設定 `upstream_token_header`，則會維持預設值，因此既有伺服器不受影響。該值必須是有效的 HTTP 標頭名稱；若格式錯誤，代理會拒絕啟動，而管理 API 會以 400 拒絕。

在 UI 中，相同設定是 MCP 伺服器表單 OAuth 區段中的 **Token Header** 欄位，且它同樣適用於互動式流程、權杖交換模式以及 M2M。

### 運作方式 {#how-it-works-1}

1. 在第一次 MCP 請求時，LiteLLM 會 POST 到 `token_url`，並帶上 `grant_type=client_credentials`
2. 存取 token 會以 TTL = `expires_in - 60s` 快取於記憶體中
3. 後續請求會重用已快取的 token
4. 當 token 到期時，LiteLLM 會自動擷取新的 token

```mermaid
sequenceDiagram
    participant Client as Client
    participant LiteLLM as LiteLLM Proxy
    participant Auth as Authorization Server
    participant MCP as MCP Server

    Client->>LiteLLM: MCP request + LiteLLM API key
    LiteLLM->>Auth: POST /oauth/token (client_credentials)
    Auth->>LiteLLM: access_token (expires_in: 3600)
    LiteLLM->>MCP: MCP request + Bearer token
    MCP-->>LiteLLM: MCP response
    LiteLLM-->>Client: MCP response

    Note over LiteLLM: Token cached for subsequent requests
    Client->>LiteLLM: Next MCP request
    LiteLLM->>MCP: MCP request + cached Bearer token
    MCP-->>LiteLLM: MCP response
    LiteLLM-->>Client: MCP response
```

### 使用 Mock Server 測試 {#test-with-mock-server}

使用 [BerriAI/mock-oauth2-mcp-server](https://github.com/BerriAI/mock-oauth2-mcp-server) 進行本機測試：

```bash title="Terminal 1 - Start mock server" showLineNumbers
uv add fastapi uvicorn
python mock_oauth2_mcp_server.py  # starts on :8765
```

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  test_oauth2:
    url: "http://localhost:8765/mcp"
    auth_type: oauth2
    oauth2_flow: client_credentials
    client_id: "test-client"
    client_secret: "test-secret"
    token_url: "http://localhost:8765/oauth/token"
```

```bash title="Terminal 2 - Start proxy and test" showLineNumbers
litellm --config config.yaml --port 4000

# See MCP REST API guide for full examples (server_id, tool naming, common errors)
# https://docs.litellm.ai/docs/mcp_rest_api

curl http://localhost:4000/mcp-rest/tools/list \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl http://localhost:4000/mcp-rest/tools/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "server_id": "test_oauth2",
    "name": "echo",
    "arguments": {"message": "hello"}
  }'
```

### 設定參考 {#config-reference}

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| `auth_type` | 是 | 必須為 `oauth2`。對於 RFC 8693 On-Behalf-Of，請改用 `oauth2_token_exchange`——請參閱 [MCP OBO Auth](./mcp_obo_auth.md)。 |
| `oauth2_flow` | 是 | 流程選擇器。為 `"client_credentials"`（M2M）或 `"authorization_code"`（互動式 PKCE，包含 `delegate_auth_to_upstream`）之一。對於 `auth_type: oauth2` 伺服器，在 `config.yaml` 中必填；如果缺少或無效，proxy 會拒絕啟動。透過 UI 建立的伺服器會從 OAuth 流程類型選擇器取得此值。只有在此欄位存在之前建立的舊版資料庫列，才會在請求時根據欄位形狀回退推斷；設定項目永遠不會被推斷。 |
| `client_id` | M2M 必填，互動式選填 | OAuth2 client ID。`client_credentials` 時必填。對於互動式流程，如果上游支援，可透過位於 `POST /{server_name}/register` 的 Dynamic Client Registration（RFC 7591）取得。支援 `os.environ/VAR_NAME`。 |
| `client_secret` | M2M 必填，互動式選填 | OAuth2 client secret。適用性與 `client_id` 相同。支援 `os.environ/VAR_NAME`。 |
| `token_url` | M2M 必填，互動式選填 | Token endpoint URL。LiteLLM 會對此發送 POST，用於 `client_credentials` 以及授權碼交換。 |
| `authorization_url` | 僅互動式 | 上游授權端點。存在時，LiteLLM 會將伺服器視為互動式 PKCE，並將 `GET /{server_name}/authorize` 代理到此 URL。 |
| `registration_url` | 選填 | 上游 Dynamic Client Registration 端點（RFC 7591）。存在時，`POST /{server_name}/register` 會代理到此 URL。 |
| `scopes` | 否 | 要請求的 scope 清單。對於 M2M，會合併成 token 請求中的 `scope` 參數。對於互動式，則在 authorize 請求中轉送。 |
| `token_validation` | 否 | 在 `/token` 交換之後，針對 OAuth token 回應檢查的鍵值規則字典。任何規則不符都會以 `token_validation_failed` 失敗。可用於斷言像 `{"team.enterprise_id": "T12345"}` 之類的 tenant claim。 |
| `token_storage_ttl_seconds` | 否 | 覆寫每位使用者 token 快取（互動式流程）的 TTL。若未設定，LiteLLM 會使用 token 回應中的 `expires_in - buffer`。 |

## OAuth 除錯 {#debugging-oauth}

當 LiteLLM proxy 遠端代管，且無法存取伺服器記錄時，請啟用**除錯標頭**，以在 HTTP 回應中取得已遮蔽的驗證診斷資訊。

### 啟用除錯模式 {#enable-debug-mode}

將 `x-litellm-mcp-debug: true` 標頭加入您的 MCP client 請求。

**Claude Code：**

```bash
claude mcp add --transport http litellm_proxy http://proxy.example.com/atlassian_mcp/mcp \
  --header "x-litellm-api-key: Bearer sk-..." \
  --header "x-litellm-mcp-debug: true"
```

**curl：**

```bash
curl -X POST http://localhost:4000/atlassian_mcp/mcp \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-..." \
  -H "x-litellm-mcp-debug: true" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### 讀取除錯回應標頭 {#reading-the-debug-response-headers}

回應包含以下標頭（所有敏感值均已遮罩）：

| 標頭 | 說明 |
|--------|-------------|
| `x-mcp-debug-inbound-auth` | 顯示有哪些傳入的驗證標頭存在。 |
| `x-mcp-debug-oauth2-token` | OAuth2 權杖（已遮罩）。如果 LiteLLM 金鑰外洩，會顯示 `SAME_AS_LITELLM_KEY`。 |
| `x-mcp-debug-auth-resolution` | 使用了哪種驗證方法：`oauth2-passthrough`、`m2m-client-credentials`、`per-request-header`、`static-token`，或 `no-auth`。 |
| `x-mcp-debug-outbound-url` | 上游 MCP 伺服器 URL。 |
| `x-mcp-debug-server-auth-type` | 伺服器上設定的 `auth_type`。 |

**範例，健康的 OAuth2 passthrough：**

```
x-mcp-debug-inbound-auth: x-litellm-api-key=Bearer****1234; authorization=Bearer****ef01
x-mcp-debug-oauth2-token: Bearer****ef01
x-mcp-debug-auth-resolution: oauth2-passthrough
x-mcp-debug-outbound-url: https://mcp.atlassian.com/v1/mcp
x-mcp-debug-server-auth-type: oauth2
```

**範例，LiteLLM 金鑰外洩（設定錯誤）：**

```
x-mcp-debug-inbound-auth: authorization=Bearer****1234
x-mcp-debug-oauth2-token: Bearer****1234 (SAME_AS_LITELLM_KEY - likely misconfigured)
x-mcp-debug-auth-resolution: oauth2-passthrough
x-mcp-debug-outbound-url: https://mcp.atlassian.com/v1/mcp
x-mcp-debug-server-auth-type: oauth2
```

### 常見問題 {#common-issues}

#### LiteLLM API 金鑰洩漏到 MCP 伺服器 {#litellm-api-key-leaking-to-the-mcp-server}

**症狀：** `x-mcp-debug-oauth2-token` 顯示 `SAME_AS_LITELLM_KEY`。

`Authorization` 標頭帶的是 LiteLLM API 金鑰，而不是 OAuth2 權杖。由於用戶端已經設定了 `Authorization` 標頭，OAuth2 流程根本沒有執行。

**修正：** 將 LiteLLM 金鑰移到 `x-litellm-api-key`：

```bash
# WRONG — blocks OAuth2 discovery
claude mcp add --transport http my_server http://proxy/server/mcp \
    --header "Authorization: Bearer sk-..."

# CORRECT — LiteLLM key in dedicated header, Authorization free for OAuth2
claude mcp add --transport http my_server http://proxy/server/mcp \
    --header "x-litellm-api-key: Bearer sk-..."
```

#### 未存在 OAuth2 token {#no-oauth2-token-present}

**症狀：** `x-mcp-debug-oauth2-token` 顯示 `(none)`，而 `x-mcp-debug-auth-resolution` 顯示 `no-auth`。

請確認：
1. `Authorization` 標頭**未**作為用戶端設定中的靜態標頭設定。
2. LiteLLM 設定中的 MCP 伺服器具有 `auth_type: oauth2`。
3. `.well-known/oauth-protected-resource` 端點會回傳有效的中繼資料。

#### 使用 M2M token 代替使用者 token {#m2m-token-used-instead-of-user-token}

**症狀：** `x-mcp-debug-auth-resolution` 顯示 `m2m-client-credentials`。

伺服器已設定 `client_id`/`client_secret`/`token_url`，因此 LiteLLM 取得的是機器對機器的權杖，而不是使用每位使用者的 OAuth2 權杖。若要使用每位使用者的權杖，請從伺服器設定中移除用戶端憑證。

## Passthrough 與委派式上游 OAuth {#passthrough-and-delegated-upstream-oauth}

對於用戶端已經直接向上游自身的 OAuth 發行者完成驗證的伺服器，LiteLLM 可以轉送用戶端的上游權杖，而不是自行管理權杖。透明的 `auth_type: true_passthrough` 模式、 admission-gated 的 `auth_type: oauth_delegate` 模式，以及舊版 `delegate_auth_to_upstream` 旗標，皆收錄於 [MCP OAuth Passthrough](./mcp_oauth_passthrough.md)。該頁面也說明了供 OpenCode、Claude Code、Cursor 和 Claude Desktop 等僅支援 OAuth 的用戶端使用的 `dcr_bridge` 旗標，其中閘道負責註冊與登入，讓用戶端可透過單一 OAuth 流程連線。
