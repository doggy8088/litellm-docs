# MCP 設定參考 {#mcp-configuration-reference}

這是連接到 LiteLLM 的 MCP Gateway 時的權威決策參考：要使用哪個端點、要設定哪種傳輸，以及兩層驗證如何配合。設定步驟與供應者特定需求請參閱連結的指南。

端點範例使用 `http://localhost:4000` 作為 proxy 基底 URL；請替換為您自己的。將 `LITELLM_API_KEY` 設為可存取所選 MCP 伺服器的金鑰。依 URL 或標頭選取伺服器只會縮小既有存取範圍；不會授予存取權。關於金鑰與團隊設定，請參閱 [MCP 存取授權](./mcp_grant_access)。

## 協定版本 {#protocol-version}

Gateway 與上游 MCP 伺服器會在 `initialize` 期間協商協定版本。LiteLLM v1.101.0（`18243cd7`）鎖定 MCP SDK 1.28.1；該版本上的 gateway 初始化協商出 `2025-11-25`。LiteLLM v1.103.0-rc.1（`ccf5e8c9`）鎖定 SDK 2.2.0。單靠 SDK 鎖定或協商版本，並不能保證支援每一項可選的協定能力；請檢查您所使用端點回傳的 `capabilities`。

目前沒有受支援的每伺服器 `spec_version` 設定欄位。舊式的委派驗證探索探測會送出 `2025-06-18`；該探測與用戶端及上游 SDK 協商是分開的。

## 兩層驗證 {#two-layers-of-authentication}

Gateway 與上游驗證是分開設定的。請將它們的憑證分開保存。

1. **Gateway 驗證（用戶端到 LiteLLM）。** 您的 LiteLLM 虛擬金鑰。請在 `x-litellm-api-key` 標頭中傳送（`x-litellm-api-key: Bearer <key>`）。`Authorization: Bearer sk-...` 也可用，但對 MCP 流量而言，建議使用 `x-litellm-api-key`，以便讓 `Authorization` 標頭保留給 OAuth 權杖與上游憑證。當傳送獨立的上游 bearer token 時，請使用專用標頭。
2. **上游驗證（LiteLLM 到 MCP 伺服器）。** 可透過 `auth_type`（靜態金鑰、OAuth、SigV4 等）針對每台伺服器設定，或由用戶端透過 `x-mcp-{server_alias}-{header_name}` 標頭按請求提供。請參閱 [上游驗證矩陣](#upstream-auth-matrix)。

如果您看到您的 LiteLLM 金鑰被送到上游 MCP 伺服器（debug 標頭顯示 `SAME_AS_LITELLM_KEY`），表示您已將 LiteLLM 金鑰放在會將 `Authorization` 上游轉送的伺服器之 `Authorization` 中。請將其移到 `x-litellm-api-key`。請參閱 [OAuth 除錯](./mcp_oauth#debugging-oauth)。

## 端點矩陣 {#endpoint-matrix}

| 端點 | 協定 | 適用情況 | 必要標頭 | 伺服器範圍 | 預期回應 |
|----------|----------|----------|------------------|--------------|-------------------|
| `/mcp` | MCP JSON-RPC（可串流 HTTP） | 直接的 MCP 用戶端（Claude Desktop/Code、Cursor、MCP Inspector、FastMCP）應該看到該金鑰可存取的每一台伺服器 | `x-litellm-api-key: Bearer sk-...`；可選 `x-mcp-servers: <name1>,<group1>` 以縮小集合 | 該金鑰/團隊被允許使用的所有伺服器，可選擇以 `x-mcp-servers` 縮小範圍 | MCP `initialize` / `tools/list` / `tools/call` JSON-RPC 回應；工具名稱會以前綴加上伺服器別名（例如 `github_mcp-search_issues`） |
| `/{server_name}/mcp` | MCP JSON-RPC（可串流 HTTP） | 直接的 MCP 用戶端應該剛好看到一台伺服器（或以逗號分隔的清單 `/{name1,name2}/mcp`） | `x-litellm-api-key: Bearer sk-...` | 僅限所命名的伺服器、toolset，或存取群組 | 相同的 JSON-RPC 回應，但僅限於該伺服器 |
| `/toolset/{toolset_name}/mcp` | MCP JSON-RPC（可串流 HTTP） | 直接的 MCP 用戶端應該只看到 [toolset](./mcp_toolsets) 中的工具 | `x-litellm-api-key: Bearer sk-...` | 所命名的 toolset | 相同的 JSON-RPC 回應，但僅限於該 toolset |
| 位於 `tools` 內的 `server_url: "litellm_proxy"` | LLM API（`/v1/responses` 或 `/v1/chat/completions`） | LLM 應在完成請求期間探索並執行 MCP 工具。`litellm_proxy` 是字面上的 sentinel，絕不是 URL | LLM 請求上的 `Authorization: Bearer sk-...`；每台伺服器的上游憑證則透過 `x-mcp-...` 標頭或工具的 `headers` 物件提供 | 所有允許的伺服器，或使用 `litellm_proxy/mcp/<server_alias>` 指定伺服器或 toolset | 回應 / Chat Completions 輸出；`require_approval: "never"` 會啟用模型所選工具的執行 |
| `GET /v1/mcp/server` | REST | 列出已設定的伺服器並擷取真實的 `server_id` / `server_name` | `Authorization: Bearer sk-...` 或 `x-litellm-api-key: sk-...` | 該金鑰可見的所有伺服器 | 伺服器物件的 JSON 陣列 |
| `GET /mcp-rest/tools/list` | REST | 在沒有 LLM 或 MCP 用戶端的情況下，透過純 HTTP 列出工具 | 同上 | 所有可存取的伺服器，或一台帶有 `?server_id=` 的伺服器 | JSON 物件，包含 `tools`、`error` 與 `message`；請參閱 [MCP REST API](./mcp_rest_api) |
| `POST /mcp-rest/tools/call` | REST | 透過純 HTTP 執行一個已知工具 | 同上，外加 `Content-Type: application/json` | 由必要的 `server_id` body 欄位所命名的伺服器 | JSON 工具結果；有關錯誤形狀請參閱 [MCP REST API](./mcp_rest_api) |

一句話的選擇規則：會說 MCP 的用戶端連到 `/mcp`（所有允許的伺服器）或 `/{server_name}/mcp`（單一伺服器）；在 `/v1/responses` 或 `/v1/chat/completions` 內由 LLM 驅動的工具使用則使用字面上的 `server_url: "litellm_proxy"`；而沒有 MCP 用戶端的腳本式 HTTP 呼叫則使用 `/mcp-rest/*`。

在傳送到 LiteLLM 的 LLM API 的請求中使用 `litellm_proxy`。可接受的聚合形式 `litellm_proxy/mcp` 目的相同；新的範例請統一使用 `litellm_proxy`。對於單一伺服器或 toolset，請使用 `litellm_proxy/mcp/<name>`。這些選擇器不是網路 URL。直接呼叫託管的 LLM API 時，請改提供可連線的 `https://<proxy-host>/mcp` URL。

一個最小的直接用戶端請求，可作為冒煙測試：

```bash
curl -s -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

預期：一個 JSON-RPC `result`，其 `tools` 陣列包含該金鑰可存取之可達伺服器的加前綴工具名稱。當上游沒有回傳工具時，請在 `result._meta` 中檢查各伺服器結果。`401` 表示 gateway 憑證錯誤；`/{server_name}/mcp` 上的 `404` 表示伺服器名稱、toolset 或存取群組不存在。

## 傳輸矩陣 {#transport-matrix}

`transport` 說明 LiteLLM 如何連線到上游 MCP 伺服器。無論上游傳輸方式為何，用戶端一律透過可串流 HTTP 連到 LiteLLM。

當 `transport` 在 `config.yaml` 中省略時，載入器預設為 `http`（可串流 HTTP）。管理 API 的 create/update 請求模型預設為 `sse`。請在兩個進入點都明確設定 `transport`，以避免依賴不同的預設值。

```yaml title="config.yaml: the three transports side by side" showLineNumbers
mcp_servers:
  # Streamable HTTP (default): url required
  deepwiki_mcp:
    url: "https://mcp.deepwiki.com/mcp"
    transport: "http"

  # SSE: url required, transport must be set explicitly
  legacy_mcp:
    url: "https://your-sse-server.example.com/sse"
    transport: "sse"

  # stdio: command required, url unused; LiteLLM launches the process
  everything_mcp:
    transport: "stdio"
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-everything@2026.8.31"]
```

| 傳輸方式 | 必要欄位 | 使用時機 | 預期行為 |
|-----------|-----------------|-------------|-------------------|
| `http`（YAML 預設） | `url` | 任何現代遠端 MCP 伺服器；這是 MCP 可串流 HTTP 傳輸 | LiteLLM 以 POST 傳送 JSON-RPC 到 `url`，並串流回應 |
| `sse` | `url`、`transport: "sse"` | 只公開 SSE 端點的舊式伺服器 | LiteLLM 對 `url` 開啟 SSE 串流 |
| `stdio` | `transport: "stdio"`、`command`；可選 `args`、`env` | 在 proxy 主機上作為子程序啟動的本機 MCP 伺服器 | LiteLLM 會啟動 `command`，並透過 stdin/stdout 以 MCP 通訊。每次請求的標頭可透過 `${X-HEADER-NAME}` 語法映射到 `env`；請參閱 [標頭到環境變數轉送](./mcp#passing-request-headers-to-stdio-env-vars) |

請將 SSE URL 替換為正在執行的舊式 SSE 伺服器。stdio 範例需要 proxy 主機上安裝 Node.js 與 `npx`，並會啟動鎖定版本的示範伺服器；這是一個連通性檢查。生產環境請使用您自己的伺服器命令。

在 UI（MCP Servers、Add New MCP Server）中，這三種傳輸方式同樣顯示為 Streamable HTTP、SSE 與 Standard Input/Output（stdio），而 stdio 設定會以 JSON 貼上。

## 上游驗證矩陣 {#upstream-auth-matrix}

`auth_type` 用來指定 LiteLLM 如何對上游 MCP 伺服器進行驗證。下方的 YAML 會設定上游憑證。用戶端仍會另外對閘道進行驗證。請替換範例端點、註冊所需的 OAuth 用戶端，並在啟動前於 proxy 環境中設定每個參照到的密鑰

```yaml title="config.yaml: upstream auth side by side" showLineNumbers
mcp_servers:
  # 1. none: server needs no credentials
  open_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "none"

  # 2. Static API key: sent as X-API-Key
  api_key_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "api_key"
    auth_value: os.environ/MCP_API_KEY          # -> X-API-Key: <value>

  # 3. Static bearer token: sent as Authorization: Bearer
  bearer_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "bearer_token"
    auth_value: os.environ/MCP_BEARER_TOKEN     # -> Authorization: Bearer <value>

  # 4. Interactive OAuth (PKCE): each user signs in via browser
  oauth_interactive_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "oauth2"
    oauth2_flow: "authorization_code"
    client_id: os.environ/OAUTH_CLIENT_ID
    client_secret: os.environ/OAUTH_CLIENT_SECRET

  # 5. M2M OAuth (client_credentials): LiteLLM fetches and refreshes the token
  oauth_m2m_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "oauth2"
    oauth2_flow: "client_credentials"
    client_id: os.environ/M2M_CLIENT_ID
    client_secret: os.environ/M2M_CLIENT_SECRET
    token_url: "https://auth.example.com/oauth/token"
    scopes: ["tool.read", "tool.write"]

  # 6. OBO / delegated (RFC 8693 token exchange): user's token exchanged per request
  obo_server:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "oauth2_token_exchange"
    token_exchange_endpoint: "https://auth.example.com/oauth/token"
    client_id: os.environ/OBO_CLIENT_ID
    client_secret: os.environ/OBO_CLIENT_SECRET
    audience: "https://mcp.example.com"
```

| `auth_type` | LiteLLM 傳送至上游的標頭 | 憑證來源 | 適用情境 | 設定指南 |
|-------------|-------------------------------|-------------------|----------|-----------|
| `none`（或省略） | 不會從 `auth_type` 產生任何驗證標頭 | 不適用 | 開放或受網路保護的伺服器 | |
| `api_key` | `X-API-Key: <auth_value>` | `auth_value` | 伺服器預期使用金鑰標頭 | |
| `bearer_token` | `Authorization: Bearer <auth_value>` | `auth_value` | 伺服器預期使用靜態 bearer token | |
| `basic` | `Authorization: Basic <base64(auth_value)>` | `auth_value` 作為原始 `username:password` | 伺服器使用 HTTP Basic | |
| `authorization` | `Authorization: <auth_value>` 原樣 | `auth_value` | 伺服器需要非標準 scheme | |
| `token` | `Authorization: token <auth_value>` | `auth_value` | GitHub 風格的 token scheme | |
| `oauth2` + `oauth2_flow: authorization_code` | `Authorization: Bearer <per-user token>` | 每位使用者進行互動式 PKCE 登入 | 人類使用者必須個別同意 | [MCP OAuth](./mcp_oauth#interactive-oauth-pkce) |
| `oauth2` + `oauth2_flow: client_credentials` | `Authorization: Bearer <M2M token>` | LiteLLM 取得、快取、重新整理 | 後端服務，沒有人工介入 | [MCP OAuth M2M](./mcp_oauth#machine-to-machine-m2m-auth) |
| `oauth2_token_exchange` | `Authorization: Bearer <exchanged token>` | 呼叫端 token 透過 RFC 8693 或 Entra OBO 設定檔交換 | 代表用戶 / 委派存取 | [MCP OBO Auth](./mcp_obo_auth) |
| `oauth2_id_jag` | `Authorization: Bearer <ID-JAG assertion-derived token>` | Okta ID-JAG 兩段式交換 | Okta AI 代理程式 token 交換 | [MCP ID-JAG](./mcp_id_jag) |
| `true_passthrough` / `oauth_delegate` | 呼叫端自身的 token，原封不動轉送 | 用戶端請求 | 上游必須看到未被修改的終端使用者 token | [MCP OAuth Passthrough](./mcp_oauth_passthrough) |
| `aws_sigv4` | 每次請求的 SigV4 簽章 | AWS 憑證或 boto3 鏈 | AWS Bedrock AgentCore 伺服器 | [MCP AWS SigV4](./mcp_aws_sigv4) |

`auth_type: oauth2` 需要明確的 `oauth2_flow`；缺少或無效的值會使 YAML 無法啟動。請對於每位使用者同意使用 `authorization_code`，或對服務身分使用 `client_credentials`。只有在上游支援動態用戶端註冊時，才可省略互動式用戶端 ID/secret；請參閱 [互動式設定與重新導向](./mcp_oauth#interactive-oauth-pkce)

若要在不同標頭上使用 token，請將 [`upstream_token_header`](./mcp_oauth#sending-the-token-on-a-different-header) 與 `static_headers` 一併使用。對於 Microsoft Entra ID，請遵循既有的 [`token_exchange_profile: entra_obo` 指南](./mcp_obo_auth#microsoft-entra-id-azure-ad)。閘道准入、上游 token 交換，以及伺服器存取授權是彼此獨立的需求

完整的靜態憑證輸入請參閱 [非 OAuth 驗證](./mcp_authentication)。標頭欄位描述的是受管理的 SSE/HTTP 傳輸路徑。OpenAPI-tool 路徑會為 `auth_type: api_key` 輸出 `Authorization: ApiKey <value>`，而不是 `X-API-Key`

另外兩種傳送上游憑證且不涉及 `auth_type` 的方式：

- **靜態標頭**：在伺服器設定中的 `static_headers: {X-API-Key: "...", X-Custom: "..."}` 會將固定標頭附加到每一個上游請求
- **用戶端提供的每伺服器標頭**：用戶端傳送 `x-mcp-{server_alias}-{header_name}`（例如 `x-mcp-github_mcp-authorization: Bearer gho_...`），而 LiteLLM 只會將 `{header_name}` 轉送到該伺服器。這是支援的用戶端端憑證機制

### 已棄用：`x-mcp-auth` {#deprecated-x-mcp-auth}

全域 `x-mcp-auth` 標頭（在該請求中將一組憑證廣播給每一個 MCP 伺服器）已棄用。請改用每伺服器形式 `x-mcp-{server_alias}-{header_name}`，以便將每一組憑證限定於單一伺服器。`x-mcp-auth` 目前仍可運作（其標頭名稱可透過 `mcp_client_side_auth_header_name` 在 `general_settings` 或 `LITELLM_MCP_CLIENT_SIDE_AUTH_HEADER_NAME` 環境變數中重新命名），但新的設定不應使用它

## 常見用戶端設定 {#common-client-configs}

對於 Cursor，請使用網路 URL，並讓憑證標頭與已設定的 `github_mcp` 別名相符。請替換金鑰與 token 佔位符。對於 Claude Code，請使用 [CLI 設定指南](./tutorials/claude_mcp)

```json title="Cursor mcpServers entry" showLineNumbers
{
  "mcpServers": {
    "github": {
      "url": "http://localhost:4000/github_mcp/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer sk-<your-virtual-key>",
        "x-mcp-github_mcp-authorization": "Bearer gho_your_token"
      }
    }
  }
}
```

在 proxy 的 Responses API 上使用由 LLM 驅動的工具（請注意 `server_url` 是字面字串 `litellm_proxy`）：

```bash title="Responses API with MCP tools" showLineNumbers
curl -s http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "{{openai_large}}",
    "input": "Run available tools",
    "tools": [{
      "type": "mcp",
      "server_label": "litellm",
      "server_url": "litellm_proxy",
      "require_approval": "never",
      "headers": {"x-mcp-github_mcp-authorization": "Bearer gho_your_token"}
    }],
    "tool_choice": "required"
  }'
```

腳本化 REST 呼叫可以重複使用上方 HTTP 範例中的 `deepwiki_mcp`。先探索伺服器與工具，然後再呼叫它。如果您的伺服器名稱或別名不同，請使用回傳的 `server_id`

```bash title="MCP REST API" showLineNumbers
curl -sS http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -sS 'http://localhost:4000/mcp-rest/tools/list?server_id=deepwiki_mcp' \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -sS -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"server_id":"deepwiki_mcp","name":"read_wiki_structure","arguments":{"repoName":"BerriAI/litellm"}}'
```

預期會有一個包含儲存庫 wiki 結構的工具回傳結果。省略 `server_id` 會回傳 `400 missing_parameter`，即使工具名稱有前綴也是如此。沒有引數的工具請使用 `{}`；不要傳入 `null`

## 相關文件 {#related-docs}

- [MCP 總覽](./mcp)：透過 UI 或 config.yaml 新增伺服器，完整欄位參考
- [使用您的 MCP](./mcp_usage)：Responses API、Cursor 與 SDK 逐步教學
- [MCP REST API](./mcp_rest_api)：`/mcp-rest/*` 請求/回應細節與錯誤形狀
- [MCP 權限管理](./mcp_control)：`allowed_tools` / `disallowed_tools`、每個金鑰的工具權限，以及釘選伺服器的工具清單、描述與輸入結構描述（`pinned_tools`、`POST` / `DELETE /v1/mcp/server/{server_id}/pin`）
- [MCP 防護欄](./mcp_guardrail)：針對工具引數以及探索時上游工具描述的 `pre_mcp_call` 防護欄
- [MCP OAuth](./mcp_oauth)、[MCP OBO Auth](./mcp_obo_auth)、[MCP OAuth Passthrough](./mcp_oauth_passthrough)、[MCP AWS SigV4](./mcp_aws_sigv4)
- [MCP 疑難排解](./mcp_troubleshoot)：偵錯標頭與逐跳隔離
