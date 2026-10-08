# MCP 每位使用者與每個金鑰的上游憑證 {#mcp-per-user-and-per-key-upstream-credentials}

先在 LiteLLM 中註冊一次 MCP 伺服器，接著讓使用者與服務帳戶以各自的上游憑證呼叫它。對於儲存在 LiteLLM 中的憑證，請為每個服務帳戶指定不同的機器使用者，並將其虛擬金鑰附加到該使用者

儲存的 BYOK 金鑰、每位使用者的 env vars，以及每位使用者的 OAuth 權杖都屬於 `(user_id, server_id)`，而不是屬於單一虛擬金鑰。**具有相同 `user_id` 的兩個金鑰會共用該伺服器的已儲存憑證。** 當服務帳戶需要不同的上游身分時，請使用不同的機器使用者。沒有原生的已儲存每金鑰或每團隊憑證覆寫

## 為服務帳戶儲存憑證 {#store-a-credential-for-a-service-account}

先註冊共用的 MCP 伺服器。下方範例假設有一個別名為 `github` 的 [BYOK 伺服器](#byok-servers-per-user-api-keys)。建立機器使用者，建立其可存取該伺服器的虛擬金鑰，然後使用新產生的金鑰儲存上游憑證

```bash
curl -X POST "http://localhost:4000/user/new" \
  -H "Authorization: Bearer sk-master" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "svc-ci-bot", "user_role": "internal_user", "auto_create_key": false}'

curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer sk-master" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "svc-ci-bot", "key_alias": "ci-bot", "object_permission": {"mcp_servers": ["github"]}}'

curl -X POST "http://localhost:4000/v1/mcp/server/{server_id}/user-credential" \
  -H "Authorization: Bearer sk-ci-bot-key" \
  -H "Content-Type: application/json" \
  -d '{"credential": "ghp_ci_bot_token"}'
```

將 `{server_id}` 替換為註冊 MCP 伺服器時傳回的 ID，並將 `sk-ci-bot-key` 替換為 `/key/generate` 傳回的金鑰。之後使用該金鑰所進行的工具呼叫，會使用機器使用者已儲存的上游憑證

對於 [每位使用者的 env vars](#per-user-env-vars) 或 [OAuth 權杖](#per-user-oauth)，請使用相同的機器使用者金鑰搭配對應的憑證端點。當 `oauth_identity_binding.mode` 為 `enforce` 時，無法直接提供 OAuth 權杖；請改完成閘道 OAuth 流程

**使用服務帳戶自己的金鑰進行佈建。** 寫入端點一律使用呼叫者的 `user_id`。管理員金鑰無法選擇其他使用者作為目的地。管理員可以列出 BYOK 憑證擁有者，並撤銷其他使用者的 BYOK 或 OAuth 憑證

沒有 `user_id` 的金鑰無法使用這些憑證儲存端點：它們會回傳 `400 User ID not found in token`。需要已儲存 BYOK 或互動式 OAuth 憑證的呼叫會失敗並回傳 `401`；缺少必要的每位使用者 env vars 會使工具呼叫失敗並回傳 `412`。若伺服器的驗證模式支援，客戶端提供的憑證是一種替代方案，但不會儲存在 LiteLLM 中

## 一覽選項 {#options-at-a-glance}

| 選項 | 由誰提供憑證 | 儲存位置 | 以何者為鍵 | 對沒有 `user_id` 的金鑰是否可用 |
|---|---|---|---|---|
| [每次請求標頭](#per-request-header-override) | 客戶端，每次請求都提供 | LiteLLM 中不會儲存 | 不適用 | 可以，於支援的驗證模式下 |
| [BYOK 伺服器](#byok-servers-per-user-api-keys) (`is_byok`) | 每位使用者，只需一次 | LiteLLM 資料庫，已加密 | `(user_id, server_id)` | 不行 |
| [每位使用者的 env vars](#per-user-env-vars) (`env_vars` 搭配 `scope: user`) | 每位使用者，只需一次 | LiteLLM 資料庫，已加密 | `(user_id, server_id)` | 不行 |
| [每位使用者的 OAuth](#per-user-oauth) (`auth_type: oauth2`、授權碼) | 每位使用者，透過 OAuth 流程 | LiteLLM 資料庫，已加密 | `(user_id, server_id)` | 不行 |
| [委派式 DCR 橋接](#dcr-bridge-client-held-oauth-credentials) (`oauth_delegate`、`dcr_bridge: true`) | 客戶端，透過 OAuth | 客戶端，作為封存權杖 | 瀏覽器使用者或已接受的金鑰雜湊 | 對以金鑰繫結的鑄造可用；瀏覽器登入則改為繫結使用者 |

請選擇與伺服器驗證模式相符的憑證來源。每次請求標頭不會普遍覆寫已儲存的憑證：互動式 OAuth、OBO 與 ID-JAG 會保留其已設定的憑證解析方式。即使客戶端送出驗證標頭，仍必須佈建所需的每位使用者 env vars

關於伺服器層級設定，請參閱 [MCP 非 OAuth 驗證](./mcp_authentication.md) 與 [MCP OAuth](./mcp_oauth.md)

## 每次請求標頭覆寫 {#per-request-header-override}

對於靜態憑證與 BYOK 伺服器，呼叫者可以使用 `x-mcp-{server_alias}-{header_name}` 在每次請求中提供其上游憑證。範例來說，`x-mcp-github-authorization: Bearer ghp_xxx` 會為 `github` 伺服器提供 `Authorization` 標頭。傳送 `Authorization` 時請包含 scheme；其他憑證類型則請使用上游所要求的標頭名稱，例如 `x-api-key`

這可以在支援的驗證模式下不需要 `user_id` 即可運作，但憑證會留在客戶端。它不會取代 `oauth2` 授權碼伺服器上的已儲存權杖，也不會略過 OBO/ID-JAG 權杖交換。它也不會略過缺少必要的每位使用者 env vars

請參閱 [標頭路由](./auth_overview.md#3-per-user-header-passthrough) 了解命名慣例，以及參考 [MCP 客戶端驗證](./mcp.md) 取得客戶端範例。對於 `true_passthrough` 與 `oauth_delegate`，請依照 [MCP OAuth Passthrough](./mcp_oauth_passthrough.md) 處理准入與上游權杖

## BYOK 伺服器（每位使用者的 API 金鑰） {#byok-servers-per-user-api-keys}

BYOK（bring your own key）伺服器沒有共用的上游憑證。每位使用者只需儲存自己的 API 金鑰一次，LiteLLM 便會在該使用者的工具呼叫中注入它

BYOK 是伺服器記錄上的一個旗標，在透過管理員 UI 或 [REST API](./mcp_rest_api.md) 建立或更新伺服器時設定。它不會從 `config.yaml` 讀取

```bash
curl -X POST "http://localhost:4000/v1/mcp/server" \
  -H "Authorization: Bearer sk-master" \
  -H "Content-Type: application/json" \
  -d '{
    "server_name": "github",
    "alias": "github",
    "url": "https://api.githubcopilot.com/mcp/",
    "transport": "http",
    "auth_type": "bearer_token",
    "is_byok": true
  }'
```

之後每位使用者都會儲存自己的金鑰。此端點會使用其 LiteLLM 金鑰驗證呼叫者，並將憑證儲存在該金鑰的 `user_id` 下

```bash
curl -X POST "http://localhost:4000/v1/mcp/server/{server_id}/user-credential" \
  -H "Authorization: Bearer sk-user-key" \
  -H "Content-Type: application/json" \
  -d '{"credential": "ghp_xxx"}'
```

若工具呼叫既沒有已儲存憑證，也沒有受支援的每次請求覆寫，便會以 `401` 失敗，並回傳一個 `byok_auth_required` 錯誤本文，內含伺服器名稱，以及一個 `WWW-Authenticate` 標頭，將支援 OAuth 的 MCP 客戶端導向 LiteLLM 內建的 BYOK 授權頁面（`/v1/mcp/oauth/authorize`），使用者可在那裡貼上自己的金鑰。不遵循 `WWW-Authenticate` 的客戶端可以直接呼叫上述端點，或使用管理員 UI

`DELETE /v1/mcp/server/{server_id}/user-credential` 會移除呼叫者的金鑰。Proxy 管理員可以傳入 `?user_id=` 來撤銷其他使用者的金鑰，而 `GET /v1/mcp/server/{server_id}/user-credentials` 會列出哪些使用者有已儲存的憑證（不會回傳任何密值）

## 每位使用者的 env vars {#per-user-env-vars}

[伺服器變數總覽](./mcp.md#server-variables) 介紹了共用與每位使用者的變數。對於需要在自訂標頭中提供憑證或需要多個值的伺服器，請使用每位使用者的 env vars。在伺服器上宣告變數，將每位使用者必須提供的那些標記為 `scope: user`，並在 `static_headers` 中使用 `${NAME}` 參照它們

```json
{
  "server_name": "internal-tools",
  "url": "https://tools.internal/mcp",
  "transport": "http",
  "auth_type": "none",
  "static_headers": {
    "X-Tenant-Token": "${TENANT_TOKEN}",
    "X-Region": "${REGION}"
  },
  "env_vars": [
    {"name": "TENANT_TOKEN", "scope": "user", "description": "Your tenant token"},
    {"name": "REGION", "scope": "global", "value": "us-east-1"}
  ]
}
```

使用者可以透過 `POST /v1/mcp/server/{server_id}/user-env-vars` 與 `{"values": {"TENANT_TOKEN": "..."}}` 的本文填入其值，透過 `GET /v1/mcp/server/{server_id}/user-env-vars` 查看尚缺少哪些值（值只寫不回顯，且絕不會回傳），並透過同一路徑上的 `DELETE` 將其清除。若工具呼叫參照了沒有已儲存值且沒有全域備援的 `scope: user` 變數，則會遭到拒絕並回傳 `412`，以及一個使用者可以開啟以填入的 `setup_url`

## 每位使用者的 OAuth {#per-user-oauth}

對於支援 OAuth 的上游，請使用 `auth_type: oauth2` 與授權碼授權類型註冊伺服器。LiteLLM 會執行瀏覽器流程，將每位使用者的存取與更新權杖以 `(user_id, server_id)` 加密儲存、負責更新，並在該使用者的呼叫中注入它們。設定方式請見 [MCP OAuth](./mcp_oauth.md)

可從 LiteLLM 之外取得的權杖可用 `POST /v1/mcp/server/{server_id}/oauth-user-credential` 與 `{"access_token": "...", "refresh_token": "...", "expires_in": 3600}` 的本文預先植入。對於其 `oauth_identity_binding.mode` 設為 `enforce` 的伺服器，此端點會關閉，因為它無法驗證該權杖屬於誰。`GET .../oauth-user-credential/status` 會回報呼叫者是否有權杖以及其到期時間，`GET /v1/mcp/user-credentials` 會列出呼叫者已連線的每一個伺服器，而 `DELETE .../oauth-user-credential` 會撤銷它（管理員可以傳入 `?user_id=`）

## DCR 橋接：客戶端持有的 OAuth 憑證 {#dcr-bridge-client-held-oauth-credentials}

對於 `true_passthrough` 和 `oauth_delegate` 伺服器，`dcr_bridge: true` 在閘道上代管 OAuth 註冊與登入。用戶端持有產生的憑證。在 `oauth_delegate` 上，密封的憑證會將上游權杖繫結到用於互動式登入的瀏覽器使用者，或在權杖請求以虛擬金鑰完成驗證時，繫結到被准許的金鑰雜湊。

僅 OAuth 的用戶端設定需要可正常運作的 LiteLLM 瀏覽器登入與互動式用戶端。以管理員身分登入會繫結該瀏覽器使用者，而不是另一個服務帳戶金鑰。以金鑰驗證的鑄造路徑接受一個啟用中的金鑰，且不需要 `user_id`，但仍需要上游 OAuth 授權碼交換，並將憑證保留在用戶端端。它不會為該金鑰提供儲存在閘道中的憑證覆寫。

請參閱 [閘道代管登入（DCR 橋接）](./mcp_oauth_passthrough.md#gateway-hosted-sign-in-dcr-bridge) 以了解設定與支援的用戶端。若要在由用戶端持有憑證的情況下進行完整的指令碼化委派，請使用文件中的雙標頭 `oauth_delegate` 流程，並停用 `dcr_bridge`。

## 不支援的項目 {#what-is-not-supported}

沒有儲存的逐金鑰或逐團隊標頭覆寫物件。金鑰與團隊透過存取清單（`object_permission.mcp_servers`）控制它們可以呼叫哪些 MCP 伺服器，而上游憑證則來自上述其中一種機制。若要使用儲存在閘道中的憑證，請為每個服務帳戶使用不同的機器使用者。沒有使用者時，請將憑證保留在用戶端端，並使用上游支援的轉送模式。DCR 橋接具有上述的互動式設定需求。
