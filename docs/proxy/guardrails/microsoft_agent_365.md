import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Microsoft Agent 365 防護欄 {#microsoft-agent-365-guardrail}

在 LiteLLM 執行之前，將每個 MCP 工具請求送至 [Microsoft Agent 365](https://learn.microsoft.com/en-us/agent-365/overview) 評估 API。Microsoft Defender 會回傳允許或封鎖，而該請求會在 Microsoft 端以已登入使用者的身分記錄

## 支援的模式 {#supported-modes}

| Mode | 功能 |
|------|-------------|
| `pre_mcp_call` | 在執行前以 Defender 評估工具名稱、引數和伺服器。若回傳封鎖判定則封鎖 |

此防護欄只會套用於 MCP 工具請求。聊天完成與其他 LLM 路由不受影響

## 運作方式 {#how-it-works}

Agent 365 會在已登入使用者的情境下進行評估，因此每個受保護的工具請求都需要該使用者的 Entra 存取權杖，且其受眾需為您的 gateway app registration，並放在 `Authorization` 標頭中。此防護欄會透過 On-Behalf-Of (OBO) 交換，取得委派的 Agent 365 權杖，並以該使用者身分進行評估。沒有服務或代理程式身分模式：沒有使用者權杖的請求會得到 HTTP 401

LiteLLM 金鑰則是透過 `x-litellm-api-key` 分開傳遞。在已經透過 [JWT auth](/docs/proxy/token_auth) 接受 Entra 權杖的 proxy 上，Entra 權杖同時也是 LiteLLM 憑證

每個工具請求

1. LiteLLM  प्रवेश：金鑰或 JWT 檢查，接著檢查該金鑰的 MCP 伺服器與工具權限。無效憑證會在此以一般的 401 或 403 失敗
2. 防護欄從 `Authorization` 讀取 Entra 權杖。缺少時：HTTP 401。在每個伺服器的 `/mcp` 路由上，401 會附帶登入挑戰，請參閱 [Browser sign-in](#browser-sign-in-from-the-mcp-client)
3. OBO 交換，並以權杖生命週期為快取期間
4. 待處理的請求送往 Agent 365：工具名稱、引數、伺服器名稱、`conversationId`，以及伺服器有發布時的工具描述與輸入結構描述。使用者提示絕不會被送出
5. 允許並附帶 `defender.status: Evaluated`：LiteLLM 執行該工具。封鎖：HTTP 400，含 Defender 訊息與關聯 ID，且完全不會連到 MCP 伺服器。已允許但未評估（`Skipped`、`FailedOpen`）：視為未掃描，`unreachable_fallback` 決定（預設封鎖）

此防護欄只能附加到其 `Authorization` 標頭會保留在 gateway 的 MCP 伺服器：`auth_type` `none`、`api_key`、`bearer_token`、`basic`、`authorization`、`token`、`aws_sigv4`（且在 `extra_headers` 中沒有 `Authorization` 項目），以及 `oauth2_token_exchange`，在這些情況下相同的 Entra 權杖就是 LiteLLM 交換上游所用的權杖。在 `oauth2`、`oauth2_id_jag`、`oauth_delegate` 和 `true_passthrough` 伺服器上，該標頭已經攜帶上游或 gateway 的 OAuth 權杖，因此防護欄永遠看不到使用者權杖，並會以 401 拒絕每個請求。請在那些伺服器上關閉它，或將它們移到 `oauth2_token_exchange`。在 `extra_headers` 下轉送像 `x-api-key` 這類用戶端金鑰標頭沒有問題，它會透過自己的標頭傳遞

## 必要條件 {#prerequisites}

由租戶管理員進行一次性的 Entra 設定

1. 請您的 Microsoft Agent 365 聯絡人為您的租戶完成上線。在那之前，評估端點會回傳 `409 BAPForbiddenTenantAccess`
2. 在 **Microsoft Entra ID > App registrations** 下註冊 gateway app，設定為 single tenant，且不要 redirect URI。記錄 client id 與 tenant id，並在 **Certificates & secrets** 下建立 client secret。這些就是防護欄的 `client_id`、`tenant_id` 和 `client_secret`
3. 在 **Expose an API** 下，將 Application ID URI 設為 `api://<client_id>`，並新增名為 `access_as_user` 的 scope。這就是您的 MCP 用戶端所請求的 scope
4. 同樣在 **Expose an API** 下，預先授權每個使用者會從中呼叫的應用程式之 client id。若要在終端機測試，請預先授權 Azure CLI（Microsoft 的公開 app id `04b07795-8ddb-461a-bbee-02f9e1bf7b46`）
5. 在 **API permissions > Add a permission > APIs my organization uses** 下，新增 **Agent Tools** API（Microsoft 的公開 app id `ea9ffc3e-8a23-4a7d-836d-234d7c7565c1`）、delegated permission `ThreatProtection.Evaluate.All`，並授予 admin consent。它必須是 delegated，而不是 application：application permission 會鑄造出 Agent 365 會拒絕的權杖

在動手設定 LiteLLM 之前先檢查設定

```bash
az login --tenant <tenant_id>
az account get-access-token --tenant <tenant_id> --resource api://<gateway_client_id>
```

解碼該權杖，並確認 `aud` 是 `api://<gateway_client_id>`，且 `scp` 包含 `access_as_user`。那就是您的 MCP 用戶端送出的權杖

## 快速開始 {#quick-start}

### 1. 在 `config.yaml` 中定義防護欄 {#1-define-the-guardrail-in-configyaml}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

guardrails:
  - guardrail_name: agent365-mcp
    litellm_params:
      guardrail: agent_365
      mode: pre_mcp_call
      default_on: true
      tenant_id: os.environ/AGENT365_TENANT_ID
      client_id: os.environ/AGENT365_CLIENT_ID
      client_secret: os.environ/AGENT365_CLIENT_SECRET

mcp_servers:
  deepwiki:
    transport: "http"
    url: "https://mcp.deepwiki.com/mcp"
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
export AGENT365_TENANT_ID="<your Entra tenant id>"
export AGENT365_CLIENT_ID="<gateway app client id>"
export AGENT365_CLIENT_SECRET="<gateway app client secret>"

litellm --config config.yaml
```

### 3. 呼叫 MCP 工具 {#3-call-an-mcp-tool}

```bash
export LITELLM_API_KEY="sk-<your-virtual-key>"
TOKEN=$(az account get-access-token --tenant <tenant_id> --resource api://<gateway_client_id> --query accessToken -o tsv)
curl -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "<server_id from /mcp-rest/tools/list>",
    "name": "read_wiki_structure",
    "arguments": {"repoName": "BerriAI/litellm"}
  }'
```

允許的請求會回傳工具結果。被封鎖的請求會回傳 HTTP 400

```json
{
  "error": "Blocked by Microsoft Defender",
  "message": "Invocation of 'ask_question' is blocked by Microsoft Threat Detection policies configured by your administrator.",
  "tool": "ask_question",
  "correlation_id": "<id to look the call up on the Microsoft side>"
}
```

每個已評估的請求都會在 Admin UI 的 **Logs** 下產生一列（[UI logs](/docs/proxy/ui_logs)），包含防護欄名稱、延遲與判定結果。在 `/mcp` 傳輸上的封鎖請求會顯示為 `guardrail_intervened`。在 `/mcp-rest/tools/call` 上遭拒絕或封鎖的請求目前沒有 Logs 列（[litellm#40555](https://github.com/BerriAI/litellm/issues/40555)）

## 呼叫端情境 {#caller-scenarios}

使用者權杖如何進入請求

### A. 具有 Entra JWT auth 的 proxy 上的應用程式 {#a-applications-on-a-proxy-with-entra-jwt-auth}

搭配 `enable_jwt_auth` 與以 Entra 為簽發者（[OIDC JWT auth](/docs/proxy/token_auth)），應用程式的 Entra bearer 同時是 LiteLLM 憑證與 OBO 主體。不需要 `x-litellm-api-key`。該權杖必須是為 gateway app（`aud` `api://<gateway_client_id>`、`scp` 且帶有 `access_as_user`）所核發；用於 Microsoft Graph 或其他 API 的權杖會在 JWT admission 失敗

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: oid
    user_email_jwt_field: email
    user_id_upsert: true
    team_id_default: entra-users
```

```bash
export JWT_PUBLIC_KEY_URL="https://login.microsoftonline.com/<tenant_id>/discovery/keys"
export JWT_AUDIENCE="api://<gateway_client_id>"
export JWT_ISSUER="https://sts.windows.net/<tenant_id>/"
```

`team_id_default` 是 MCP 權限由 JWT 呼叫端繼承的團隊。若應用程式發出 v2 權杖，請將 `https://login.microsoftonline.com/<tenant_id>/v2.0` 用作簽發者

### B. 會將使用者登入的 MCP 用戶端（Claude Code、VS Code、Cursor） {#b-mcp-clients-that-sign-the-user-in-claude-code-vs-code-cursor}

使用者以只有 LiteLLM 金鑰的方式向 LiteLLM 的 per-server MCP URL 註冊。第一次請求會收到帶有 [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) 挑戰的 401，用戶端會開啟 Microsoft 登入頁面，之後便會自行附加並更新 Entra 權杖。設定請參閱 [Browser sign-in](#browser-sign-in-from-the-mcp-client)；用戶端端的機制請參閱 [MCP OAuth](/docs/mcp_oauth)

### C. 自行鑄造權杖的自訂用戶端 {#c-custom-clients-that-mint-the-token-themselves}

沒有 MCP OAuth 支援的指令碼會使用 MSAL 或 Azure CLI（在必要條件步驟 4 中已預先授權）取得 gateway 受眾權杖，並將其與 LiteLLM 金鑰一起送出，完全如同快速開始所示。用戶端負責更新；Entra 存取權杖的有效期約一小時。相同的標頭可用於 `/mcp` 傳輸與 `claude mcp add ... -H "Authorization: Bearer $TOKEN"`。REST 外觀介面請參閱 [MCP REST API](/docs/mcp_rest_api)

### D. 只有 LiteLLM 金鑰 {#d-litellm-key-only}

先由 LiteLLM 通過，接著被防護欄以 HTTP 401 拒絕，且不執行任何工具

```json
{"detail": {"error": "Agent 365 guardrail rejected the tool call", "message": "Tool call 'read_wiki_structure' was blocked because the caller did not present an Entra bearer token; the Agent 365 guardrail authorizes tool calls On-Behalf-Of the signed-in user.", "tool": "read_wiki_structure", "guardrail_name": "agent365-mcp", "guardrail_mode": "pre_mcp_call"}}
```

在每個伺服器的 `/mcp` 路由上，同樣的 401 會帶著登入挑戰，因此具備能力的用戶端會啟動情境 B。該拒絕只適用於防護欄所涵蓋的伺服器；該金鑰仍可在未受保護的伺服器與所有 LLM 路由上運作

### 兩層授權 {#two-layers-of-authorization}

LiteLLM 決定哪些金鑰、使用者與團隊可進入哪些伺服器與工具（[MCP permission management](/docs/mcp_control)）。工具在上游系統內可以做什麼，則由 LiteLLM 所提供的憑證在上游端決定。使用共享 API 金鑰時，上游會看到服務身分；若要讓它看到已登入使用者，請使用 `auth_type: oauth2_token_exchange`（[MCP OBO auth](/docs/mcp_obo_auth)）或每位使用者的 OAuth（[MCP OAuth](/docs/mcp_oauth)）。防護欄無論如何都會評估該請求

## 設定參數 {#configuration-parameters}

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `tenant_id` | 是 | Entra 租戶 id。若無則回退至 `AGENT365_TENANT_ID` |
| `client_id` | 是 | 閘道應用程式註冊的用戶端 id。若無則回退至 `AGENT365_CLIENT_ID` |
| `client_secret` | 是 | 該應用程式的用戶端密鑰。也接受 `api_key`。若無則回退至 `AGENT365_CLIENT_SECRET` |
| `timeout` | 否 | 每個 token 交換與評估請求的秒數。預設為 10 |
| `unreachable_fallback` | 否 | 當 Agent 365 或 Entra 無法連線、Entra 拒絕閘道自身的憑證、或 Defender 未進行評估時會發生什麼事。`fail_closed`（預設）會以 HTTP 503 阻擋。`fail_open` 會讓請求在未掃描的情況下通過，並以錯誤等級記錄。封鎖、拒絕、節流與呼叫端側失敗一律會阻擋 |

除此之外沒有其他可指向的內容。評估會送往 `https://agent365.svc.cloud.microsoft`，OBO 交換會送往 `https://login.microsoftonline.com` 並為 Microsoft 的 Agent Tools 應用程式簽發 token，而每次評估所回報的代理程式身分是呼叫者的 key 別名。舊版 `api_base`、`resource_app_id` 與 `agent_id` 在 config.yaml 中的鍵會被忽略

## 失敗行為 {#failure-behavior}

預設情況下，guardrail 採取 fail-closed：當無法詢問 Agent 365 時，請求會以 HTTP 503 被阻擋，且永遠不會連到 MCP 伺服器。guardrail 位於每次工具呼叫的請求路徑上，因此偏好可用性勝過覆蓋範圍的租戶會以 `unreachable_fallback: fail_open` 明確啟用，接著請求會照常執行並被記錄為未掃描

| 情況 | 結果 |
|-----------|--------|
| Defender 擋下 | HTTP 400，附帶 Defender 訊息與關聯 id。永遠阻擋 |
| Agent 365 拒絕請求（408/429 以外的 4xx） | HTTP 400。永遠阻擋 |
| 允許但 Defender 未進行評估（`Skipped`、`FailedOpen`） | `fail_closed`（預設）：HTTP 503。`fail_open`：允許，記錄為未掃描 |
| 沒有 Entra token，或 Entra 拒絕呼叫者的 token（`invalid_grant`、過期、audience 錯誤、缺少同意、斷言格式錯誤） | HTTP 401，並標示 guardrail 名稱。永遠阻擋。在每個伺服器的 `/mcp` 路由上，回應會帶有 `WWW-Authenticate` challenge，讓用戶端使用者登入 |
| Entra 拒絕閘道的憑證（`invalid_client`、`unauthorized_client`、`invalid_scope`、`invalid_resource`） | `fail_closed`（預設）：HTTP 503，並標示需要檢查的設定。`fail_open`：允許，記錄為未掃描。永遠不會是 401，因此用戶端不會重新提示 |
| Agent 365 或 Entra 回傳 408 或 429 | HTTP 503，記錄為 Throttled。永遠阻擋 |
| Agent 365 或 Entra 無法連線、逾時、5xx 或無法解析的判定 | `fail_closed`（預設）：HTTP 503。`fail_open`：允許，記錄為未掃描 |

### 觀察 fail-open 請求 {#watching-fail-open-calls}

使用 `fail_open` 時，每次未掃描而放行的請求都會以錯誤等級記錄原因，並在其 Logs 列與 OpenTelemetry span 上顯示 `Unscanned` 判定與 `guardrail_failed_to_respond`。請在 Logs 頁面上依該狀態篩選；若持續出現這些列，表示 Agent 365 沒有在評估您的工具請求

## 對話分組 {#conversation-grouping}

Agent 365 會依 `conversationId` 分組評估。當傳輸有 `Mcp-Session-Id` 時，guardrail 會送出該值，因此同一個 MCP 工作階段中的所有請求都會落在同一個 Defender 對話中。無狀態請求（`/mcp-rest/tools/call`，或沒有工作階段的可串流請求）會使用 LiteLLM 的 request id 作為該請求的識別碼，也就是 Logs 列所顯示的相同 id

## 從 MCP 用戶端進行瀏覽器登入 {#browser-sign-in-from-the-mcp-client}

在每個伺服器的 `/<server>/mcp` 與 `/mcp/<server>` 路由上，沒有 Entra token 的請求會收到 HTTP 401，以及指向該伺服器 RFC 9728 中繼資料的 `WWW-Authenticate: Bearer resource_metadata="..."`，其中會將您的租戶列為授權伺服器並列出要請求的 scope。實作 MCP 授權的用戶端（Claude Code、VS Code、Cursor）會開啟瀏覽器、讓使用者登入、快取並更新 token，然後重試。`x-litellm-api-key` 標頭仍會帶著 LiteLLM key。聚合的 `/mcp` 路由與 REST facade 不會發出 challenge，因此請以各自的 URL 註冊每個受保護伺服器

當伺服器與閘道保持 `Authorization` 時（見運作方式），且套用到呼叫者的 Agent 365 guardrail 具有 `default_on: true` 時，就會出現 challenge。只套用在 key、team 或 policy 上的 guardrail 仍會在每次請求中強制執行，但在連線時不會 challenge，因為匿名中繼資料無法判斷用戶端即將使用哪個 key 的 guardrail。過期或 audience 錯誤的 token 會得到相同的 challenge，因此用戶端會再次登入。沒有被授權存取該伺服器的 key 會先得到一般的 403

公告的 scope 會是伺服器的 `scopes`（若有設定），否則為 `api://<client_id>/access_as_user`。Entra 要求 scope 必須屬於用戶端聲稱正在呼叫的資源，因此對於公開 URL，請以該 URL 命名 scope，並在閘道應用程式上將該 URL 加為 Application ID URI，並在其下方使用 `access_as_user`

```yaml
mcp_servers:
  deepwiki:
    transport: http
    url: https://mcp.deepwiki.com/mcp
    scopes:
      - https://litellm.example.com/deepwiki/mcp/access_as_user
```

Entra 沒有動態用戶端註冊，因此用戶端需要已註冊的 client id：新增一個 **Mobile and desktop applications** 平台（在閘道應用程式上或另一個公開用戶端上），使用用戶端所用的 loopback redirect，並依前置條件步驟 4 預先授權該 scope。接著在沒有 `Authorization` 標頭的情況下註冊伺服器

```json
{
  "mcpServers": {
    "deepwiki": {
      "type": "http",
      "url": "https://litellm.example.com/deepwiki/mcp",
      "headers": {"x-litellm-api-key": "Bearer sk-<your-virtual-key>"},
      "oauth": {"clientId": "<public client id>", "callbackPort": 51001}
    }
  }
}
```

第一次呼叫時，Claude Code 會開啟瀏覽器，使用者登入，然後請求繼續。請讓用戶端的伺服器 URL、Application ID URI 與 scope 保持同一形式：中繼資料的 `resource` 會等於用戶端使用的 URL，而 TypeScript SDK 用戶端會在登入前檢查這一點。若要查看原始 challenge

```bash
curl -i -X POST https://litellm.example.com/deepwiki/mcp \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

```text
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://litellm.example.com/.well-known/oauth-protected-resource/deepwiki/mcp", error="invalid_token", error_description="Missing or invalid subject token; authenticate with the IdP and retry"
```

```bash
curl -s https://litellm.example.com/.well-known/oauth-protected-resource/deepwiki/mcp
```

```json
{
  "authorization_servers": ["https://login.microsoftonline.com/<tenant_id>/v2.0"],
  "resource": "https://litellm.example.com/deepwiki/mcp",
  "scopes_supported": ["https://litellm.example.com/deepwiki/mcp/access_as_user"]
}
```
