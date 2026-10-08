import Image from '@theme/IdealImage';

# Claude Code 閘道（SSO 登入） {#claude-code-gateway-sso-sign-in}

讓開發者使用您的 SSO 提供者登入 Claude Code，而不是使用 API 金鑰。LiteLLM 提供與 Anthropic 自架 [Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway) 相同的閘道協定：Claude Code 的 `/login` 會開啟 **Cloud gateway** 畫面，開發者在瀏覽器中透過您的身分提供者登入，而之後的每個請求都會攜帶與該開發者的使用者與團隊綁定的 LiteLLM 權杖，因此支出、預算與記錄都會依個人歸屬，無需發放或輪替任何憑證

<EnterpriseFeature feature="SSO">自 v1.76.0 起，SSO 對最多 5 位使用者免費。超過後則需要企業授權。</EnterpriseFeature>

此流程適用於 LiteLLM 支援的任何 SSO 提供者（Google、Microsoft Entra ID、Okta，或透過通用用戶端的任何 OIDC 提供者）。它與 [Claude Code with Okta SSO (JWT Auth)](./claude_code_okta_sso) 不同，後者是由輔助腳本擷取 IdP 權杖，並由 Claude Code 將該權杖作為其 API 金鑰傳送：在這裡沒有需要散發的腳本，登入是 Claude Code 自身的流程，而且 proxy 可以將 [受管理設定](#4-push-managed-settings-from-the-proxy) 推送到每個已登入的用戶端。開發者機器上需要 Claude Code v2.1.195 或更新版本

## 運作方式 {#how-it-works}

Claude Code 會從受管理設定檔讀取閘道 URL，擷取閘道的 OAuth 探索文件，並只要求開發者一次信任該閘道。接著它會啟動 [OAuth 裝置授權](https://www.rfc-editor.org/rfc/rfc8628) 流程：終端機會顯示一組短代碼並在瀏覽器中開啟 LiteLLM 的 SSO 登入，開發者使用您的身分提供者登入並確認代碼，而持續輪詢權杖端點的 Claude Code 會接收 LiteLLM CLI 權杖與重新整理權杖。CLI 權杖是受限於開發者的使用者與團隊的 JWT，預設有效期為 24 小時，而 Claude Code 會在到期前使用重新整理權杖更新它，因此持續使用 Claude Code 的開發者不會被重新導向回瀏覽器（請參閱 [Session lifetime and sign-out](#session-lifetime-and-sign-out)）。Claude Code 會同時儲存兩者、使用 CLI 權杖擷取受管理設定，並以其作為 bearer token 將每個推論請求傳送至 `/claude_code_gateway/v1/messages`。在底層，該閘道重用了 proxy 現有的 [CLI SSO device flow](../proxy/cli_sso)，因此任何適用於 `lite login` 的功能（SSO 提供者、團隊成員資格、模型存取、預算）都適用於此處

## 1. 開啟閘道 {#1-turn-the-gateway-on}

在 `general_settings` 中啟用閘道。`anthropic/*` 萬用字元很重要：Claude Code 會自行要求模型名稱（目前版本為 `claude-opus-4-7`），因此 proxy 需要解析其送出的任何名稱，而其旁邊的命名別名則可讓您在團隊上授權時使用穩定名稱

```yaml
model_list:
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: "anthropic/*"
    litellm_params:
      model: "anthropic/*"
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  enable_claude_code_gateway: true
```

瀏覽器端是 proxy 的 SSO 登入，因此請依照 [SSO for Admin UI](../proxy/admin_ui_sso) 的說明設定您的 SSO 提供者，並將 `<proxy base url>/sso/callback` 註冊為重新導向 URI。對 Google 而言這是兩個變數；Microsoft、Okta 與通用 OIDC 在該頁面上有各自的一組設定

```bash
export GOOGLE_CLIENT_ID="<client id>"
export GOOGLE_CLIENT_SECRET="<client secret>"
export PROXY_BASE_URL="https://litellm.internal.example.com"
litellm --config config.yaml
```

`PROXY_BASE_URL` 是開發者存取的 origin。閘道會根據它建立探索文件、權杖端點與瀏覽器驗證 URL，因此在負載平衡器或 TLS 終止器後方，它必須指向對外公開的 origin，而不是 pod。Claude Code 只會向主機名稱解析為私有位址（RFC 1918、link-local、CGNAT `100.64.0.0/10`、IPv6 ULA `fc00::/7`，或 loopback）的閘道登入，因為受信任的閘道可以推送會在開發者機器上執行命令的設定。請將 proxy 放在 TLS 之後的內部主機名稱上；CLI 會在第一次連線時依主機名稱固定 TLS 憑證。如下方截圖所示，loopback 上的純 `http://` 可用於本機測試

有兩個可選設定可調整此流程。`LITELLM_CLI_JWT_EXPIRATION_HOURS` 可設定工作階段權杖在重新整理之間的存活時間（預設為 `24`）。Claude Code 會在到期前使用重新整理權杖更新工作階段權杖，因此開發者在該期限之後仍會維持登入狀態。當 14 天內沒有重新整理、重新整理遭拒，或開發者執行 `/logout` 時，工作階段便會結束（請參閱 [Session lifetime and sign-out](#session-lifetime-and-sign-out)）。請將其設為 `336` 或以下，因為存活時間長於 14 天重新整理權杖的工作階段權杖，其壽命會超過可用來更新它的權杖，而在其到期時開發者又會回到 `/login`。`allow_cli_sso_verification_uri_complete: true` 在 `general_settings` 下方可加入 `verification_uri_complete` 至裝置授權回應，這會將代碼放在 URL 中，因此支援它的用戶端會在已填入代碼的情況下開啟瀏覽器頁面。預設為關閉，因為輸入代碼正是把瀏覽器頁面與啟動登入的終端機連結起來的方式；請參閱 [Pre-fill the verification code](../proxy/cli_sso#pre-fill-the-verification-code)

當有超過一個 worker 或副本時，瀏覽器端與終端機的輪詢可能落在不同的程序上，而登入狀態則存在於 proxy 的 CLI SSO 快取中。哪些重新整理權杖已被使用或撤銷的記錄也存在於 proxy 的快取中，而從未看過該記錄的程序會接受另一個程序已經輪替或撤銷的重新整理權杖。請設定 Redis（環境中的 `REDIS_HOST`、`REDIS_PORT` 與 `REDIS_PASSWORD`，或 `general_settings.coordination_redis`），以便共用該快取，或只執行單一 worker。當 Redis 無法連線時，重新整理或登出會回應 `503 temporarily_unavailable`，而不是自行猜測，Claude Code 會繼續使用它現有的工作階段權杖，稍後再嘗試重新整理

## 2. 從命令列驗證 {#2-verify-from-the-command-line}

探索文件在未經驗證的情況下提供。`issuer` 是下一步要放入每位開發者受管理設定檔中的 URL

```bash
curl http://localhost:4000/claude_code_gateway/.well-known/oauth-authorization-server
```

```json
{
  "issuer": "http://localhost:4000/claude_code_gateway",
  "device_authorization_endpoint": "http://localhost:4000/claude_code_gateway/oauth/device_authorization",
  "token_endpoint": "http://localhost:4000/claude_code_gateway/oauth/token",
  "revocation_endpoint": "http://localhost:4000/claude_code_gateway/oauth/revoke",
  "grant_types_supported": ["urn:ietf:params:oauth:grant-type:device_code", "refresh_token"]
}
```

手動啟動裝置授權會顯示 Claude Code 在 `/login` 看到的內容：給開發者的代碼、瀏覽器 URL、十分鐘的時間窗，以及五秒的輪詢間隔

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/device_authorization
```

```json
{
  "device_code": "cli-tyQu2vOB-r2ynASXPqyOKDd0g_cr6NOm.mAVkxaITywoFfMB-_x87HqgyZ886Hz6luXiZw2qssVo",
  "user_code": "XPCA-X2K2",
  "verification_uri": "http://localhost:4000/sso/key/generate?source=litellm-cli&key=cli-tyQu2vOB-r2ynASXPqyOKDd0g_cr6NOm",
  "expires_in": 600,
  "interval": 5
}
```

在瀏覽器登入尚未完成前輪詢權杖端點會回應 `authorization_pending`，這正是 Claude Code 等待的結果

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:device_code \
  -d device_code="cli-tyQu2vOB-r2ynASXPqyOKDd0g_cr6NOm.mAVkxaITywoFfMB-_x87HqgyZ886Hz6luXiZw2qssVo"
```

```json
{"error": "authorization_pending"}
```

當開發者已在瀏覽器中核准代碼之後（下一節會示範該流程），同一次輪詢會回應工作階段權杖，旁邊還會帶有重新整理權杖，並以 `cache-control: no-store` 提供。`expires_in` 是 `LITELLM_CLI_JWT_EXPIRATION_HOURS`，單位為秒，而 `user_id` 與 `team_id` 則指定此工作階段所屬的使用者與團隊

```json
{
  "access_token": "litellm_login_<redacted>",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "llm_srefresh_e<redacted>",
  "user_id": "<the signed-in user id>",
  "team_id": "<the first team on the user record, or null when it has none>"
}
```

重新整理是對同一端點的 `refresh_token` 授權，且沒有 `client_id`，這正是 Claude Code 所送出的內容。回應具有相同的結構，包含新的工作階段權杖與新的重新整理權杖，而剛剛提供的重新整理權杖則已被使用完畢

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/token \
  -d grant_type=refresh_token \
  -d refresh_token="$REFRESH_TOKEN"
```

第二次提供、已被撤銷，或從未是重新整理權杖的值會回應 `400 invalid_grant`

```json
{
  "error": "invalid_grant",
  "error_description": "the refresh token was already used"
}
```

登出是在 `revocation_endpoint` 上進行的 [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009) 撤銷。`/logout` 會將工作階段權杖與重新整理權杖分別各送出一個請求到該處。撤銷重新整理權杖才是結束登入的動作；工作階段權杖是無狀態的，並會自行到期，因此對它的請求不會改變任何事情。無論端點是否辨識該權杖，回應都會是 `200` 並附帶 `{}`，所以呼叫兩次是安全的

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/revoke \
  -d token="$REFRESH_TOKEN" \
  -d token_type_hint=refresh_token
```

## 3. 將 Claude Code 指向 proxy {#3-point-claude-code-at-the-proxy}

只有當閘道 URL 來自受管理設定檔時，Claude Code 才會在閘道畫面上開啟 `/login`。這些金鑰在開發者自己的 `~/.claude/settings.json` 中會被忽略，因此請透過您的裝置管理工具部署此檔案，或直接寫入：macOS 上的 `/Library/Application Support/ClaudeCode/managed-settings.json`、Linux 與 WSL 上的 `/etc/claude-code/managed-settings.json`、Windows 上的 `C:\Program Files\ClaudeCode\managed-settings.json`

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://litellm.internal.example.com/claude_code_gateway"
}
```

網址是來自探索文件的 `issuer`，並帶有 `/claude_code_gateway` 路徑。如果開發人員的電腦將 HTTPS 經由公司代理伺服器轉送，請將 LiteLLM 主機加入 `NO_PROXY`，讓 CLI 直接連線到它；如果您的內部網路是由您擁有的公用 IPv4 位址空間編號，請將那些區段列入 `gatewayInternalNetworks` 管理設定（Claude Code v2.1.268 或更新版本）；這兩者都在 Anthropic 的 [gateway prerequisites](https://code.claude.com/docs/en/claude-apps-gateway#prerequisites) 中有說明

檔案就緒後，執行 `claude`（或在執行中的工作階段中執行 `/login`）。閘道畫面會顯示來自管理設定的網址

<Image img={require('../../img/claude_code_gateway/gateway_detected.png')} style={{ width: '800px', height: 'auto' }} />

首次連線時，Claude Code 會要求開發人員信任該閘道，因為受信任的閘道可以將設定推送到機器上。每個閘道主機只會詢問一次

<Image img={require('../../img/claude_code_gateway/trust_gateway.png')} style={{ width: '800px', height: 'auto' }} />

接著 Claude Code 會顯示驗證碼，並在代理伺服器的 SSO 登入頁面開啟瀏覽器。如果瀏覽器沒有開啟，開發人員請前往畫面上顯示的網址

<Image img={require('../../img/claude_code_gateway/device_code.png')} style={{ width: '800px', height: 'auto' }} />

瀏覽器會經過您的身分提供者（已登入該提供者的瀏覽器會直接進到下一頁而不會出現提示），然後要求輸入來自終端機的代碼

<Image img={require('../../img/claude_code_gateway/browser_verification_code.png')} style={{ width: '800px', height: 'auto' }} />

按下 Continue 後，瀏覽器會確認登入，終端機則會在下一次輪詢時接收

<Image img={require('../../img/claude_code_gateway/browser_login_complete.png')} style={{ width: '800px', height: 'auto' }} />

<Image img={require('../../img/claude_code_gateway/connected.png')} style={{ width: '800px', height: 'auto' }} />

之後 Claude Code 會繼續進行一般的首次執行提示（安全性說明與工作區信任），並進入提示畫面，在模型旁顯示 **Cloud gateway**。請求會使用開發人員的權杖送到代理伺服器上的 `POST /claude_code_gateway/v1/messages`，每一筆都會以該開發人員的使用者與團隊身分顯示在代理伺服器的記錄與支出中

<Image img={require('../../img/claude_code_gateway/signed_in_session.png')} style={{ width: '800px', height: 'auto' }} />

### 工作階段存續時間與登出 {#session-lifetime-and-sign-out}

Claude Code 會將工作階段權杖與更新權杖一併儲存。在工作階段權杖到期前五分鐘（預設為 24 小時），它會將更新權杖送到權杖端點，並儲存收到的新工作階段權杖與更新權杖，因此持續使用 Claude Code 的開發人員不會被帶回瀏覽器。每個更新權杖都是一次性使用，存續 14 天，而每次更新都會發出新的更新權杖，因此若 14 天內未更新，工作階段就會結束；當它持有的工作階段權杖到期後，Claude Code 會要求 `/login`。同一台機器上的兩個 Claude Code 終端機會共用儲存的憑證，但會各自更新，因此第二個嘗試更新者會帶出第一個已輪替過的更新權杖，因而遭到拒絕（代理伺服器存取記錄中的 `400`s on `/claude_code_gateway/oauth/token`）並改用第一個終端機儲存的憑證繼續執行

每次更新都會重新讀取 LiteLLM 中該開發人員的使用者記錄與團隊成員資格。若在 LiteLLM 中停用或刪除該使用者，或將其從發出該工作階段的團隊中移除，下一次更新將以 `400 invalid_grant` 拒絕，而 Claude Code 會在目前工作階段權杖到期後、於 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 內要求 `/login`。已刪除使用者對 `/claude_code_gateway/v1/messages` 的請求會在該工作階段權杖到期前立即回應 `401`。僅在身分提供者處撤銷開發人員的佈建，並不會結束進行中的工作階段，因為更新會檢查的是 LiteLLM 自身的使用者與團隊狀態，而不是身分提供者，因此該工作階段會持續更新，直到 14 天內未再更新。也請在 LiteLLM 中停用該使用者，才能更早結束

`/logout` 會將工作階段權杖與更新權杖送到 `POST /claude_code_gateway/oauth/revoke`，也就是探索文件中的 `revocation_endpoint`，然後移除已儲存的憑證。撤銷更新權杖會結束該登入，因為由它輪替出的每個更新權杖、無論持有者是誰，此後都會被拒絕。工作階段權杖本身是自包含的，不會被撤銷；它會保持有效直到過期為止

更新與撤銷需要 LiteLLM v1.106.0 或更新版本（最早在 `v1.106.0-rc.1` 中）。較早版本不會發出更新權杖，而且每次更新都會回應 `401`，因此 Claude Code 會在每次到期時再次要求 `/login`；在滾動升級期間，若由仍停留在前一版的複本提供更新，對該開發人員而言也會同樣如此一次

## 4. 從代理伺服器推送管理設定 {#4-push-managed-settings-from-the-proxy}

您放在 `claude_code_gateway_managed_settings` 底下的任何內容，都會原樣作為組織的管理設定提供給每一個透過閘道登入的用戶端。其值是 Claude Code 的 [managed settings](https://code.claude.com/docs/en/managed-settings) 文件，因此相同的鍵都可使用：`permissions`、`env`、hooks、allowed tools 等。Claude Code 會在啟動時擷取一次，之後每小時再擷取一次，而鎖定的鍵無法在本機覆寫

```yaml
general_settings:
  enable_claude_code_gateway: true
  claude_code_gateway_managed_settings:
    permissions:
      defaultMode: acceptEdits
    env:
      CLAUDE_CODE_ENABLE_TELEMETRY: "1"
      OTEL_METRICS_EXPORTER: otlp
      OTEL_LOGS_EXPORTER: otlp
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_EXPORTER_OTLP_ENDPOINT: https://litellm.internal.example.com/claude_code_gateway
```

端點是 `GET /claude_code_gateway/managed/settings`，以 CLI 權杖進行驗證（任何 LiteLLM 金鑰都可用於檢查它）。回應會將您的區塊包裝在 Claude Code 預期的 `{uuid, checksum, settings}` 封套中，其中兩個 id 都是 canonical JSON 的 SHA-256，而相同的值會以 `ETag` 的形式回傳。Claude Code 在每小時重新整理時會將它以 `If-None-Match` 送回，並持續收到 `304 Not Modified`，直到該區塊變更為止。當 `claude_code_gateway_managed_settings` 未設定時，端點會回應 `404`，CLI 會將其讀作「沒有管理原則」

```bash
curl -s http://localhost:4000/claude_code_gateway/managed/settings \
  -H "Authorization: Bearer $LITELLM_KEY"
```

```json
{
  "uuid": "sha256:c74c6a3f7f6bfda0c71ded0a60e3f1669b61f86f5ef603291fd39be2fea600a5",
  "checksum": "sha256:c74c6a3f7f6bfda0c71ded0a60e3f1669b61f86f5ef603291fd39be2fea600a5",
  "settings": {
    "permissions": {"defaultMode": "acceptEdits"},
    "env": {
      "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
      "OTEL_METRICS_EXPORTER": "otlp",
      "OTEL_LOGS_EXPORTER": "otlp",
      "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
      "OTEL_EXPORTER_OTLP_ENDPOINT": "https://litellm.internal.example.com/claude_code_gateway"
    }
  }
}
```

有些設定在首次套用時需要開發人員同意。遙測目的地就是其中之一：Claude Code 會顯示遙測將送往何處，並且只有在開發人員接受後才套用該區塊，因此請告知您的開發人員預期會看到此畫面

<Image img={require('../../img/claude_code_gateway/managed_settings_approval.png')} style={{ width: '800px', height: 'auto' }} />

## 5. 遙測 {#5-telemetry}

在透過 `/login` 登入的工作階段中，Claude Code 會將其 OpenTelemetry 匯出（OTLP over HTTP；gateway 工作階段不支援 gRPC）送往閘道，而不是送往本機設定的 `OTEL_EXPORTER_OTLP_ENDPOINT`，除非管理設定指定了另一個收集器。上方的 `env` 區塊會啟用匯出器並將其指向代理伺服器，而代理伺服器提供 `POST /claude_code_gateway/v1/metrics`、`/v1/logs` 與 `/v1/traces`，使用相同的權杖進行驗證，並回應 `200`。目前代理伺服器會接受這些匯出並將其捨棄；每筆請求的使用量、支出與記錄來自代理伺服器在 `/claude_code_gateway/v1/messages` 上的自身記錄，而不是來自 OTLP 串流。如果您已經收集 Claude Code 遙測，請在管理設定中將 `OTEL_EXPORTER_OTLP_ENDPOINT` 設為您的收集器

## 部署拓撲 {#deployment-topologies}

**Claude Code 到 LiteLLM。** 本頁的設定：開發人員透過 LiteLLM 登入，LiteLLM 持有提供者憑證，而代理伺服器的 [model access](../proxy/virtual_keys)、[budgets](../proxy/users)、[rate limits](../proxy/users) 與 [logging](../proxy/logging) 會依使用者與團隊套用。當 LiteLLM 已經是其他用戶端的閘道時，應選擇這個拓撲

**在負載平衡器後方的 Claude Code 到 LiteLLM。** 相同的設定搭配多個複本：`PROXY_BASE_URL` 會將負載平衡器的來源命名，使探索文件與瀏覽器網址將開發人員導向他們可存取的位址，TLS 在私有主機名稱上的負載平衡器終止，並且已設定 Redis，使裝置流程可在任何複本上完成。不需要黏著式工作階段

**Claude Code 到 Claude apps gateway 到 LiteLLM。** Anthropic 不提供代管的 gateway；[Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway) 是您自行執行的軟體。如果您已經在執行它（因為它有 IdP 群組政策，或因為 Claude Desktop 透過它連線），它可以作為 LiteLLM 的 `anthropic` upstream，其 `base_url` 是 proxy，而其 `api_key` 是 LiteLLM 虛擬金鑰。將 `forward_user_identity: true` 設定在該 upstream 上，Claude apps gateway 會在轉送的每個請求中加入 `x-litellm-end-user-id`（開發者的電子郵件）；LiteLLM 會將該標頭視為 [customer id](../proxy/customers)，無需任何額外設定，因此即使 proxy 只看見一把金鑰，支出仍會依開發者個別追蹤。對此類請求，LiteLLM 回傳的 `429` 會原樣交還給開發者，而不是故障轉移到另一個 upstream（Claude apps gateway v2.1.267 或更新版本），因此每位客戶的預算與速率限制都能維持。在這種拓撲中，登入與受管理設定屬於 Claude apps gateway，而 LiteLLM 上的 `enable_claude_code_gateway` 會保持關閉

```yaml
upstreams:
  - provider: anthropic
    base_url: https://litellm.internal.example.com
    auth:
      api_key: ${LITELLM_VIRTUAL_KEY}
    forward_user_identity: true
```

## 已知限制 {#known-limits}

撤銷只涵蓋 refresh token。session token 是自包含的，因此在 `/logout` 之後，開發者持有的 session token 仍會持續運作，直到 `LITELLM_CLI_JWT_EXPIRATION_HOURS`

被重放的 refresh token 只會被拒絕，且不會終止其他任何內容，因此在真正的 refresh token 之前先完成更新的副本，會讓它的鏈保持存活。真正的 Claude Code 在遭到該拒絕時會丟棄其 refresh token，這使得 `/logout` 沒有任何東西可撤銷，因此在 LiteLLM 中停用或刪除該使用者，或將其從團隊中移除，才會終止那條鏈

refresh token 由 MCP gateway 的 session 簽署金鑰簽署，這些金鑰會從 `master_key` 衍生，除非已設定 `general_settings.mcp_session_token_signing`。在無法載入該區塊的 proxy 上，登入仍會成功，但不會回傳 refresh token，且 proxy 會記錄該錯誤，因此開發者會回到每次到期都必須重新登入，直到問題修復為止

該 token 的範圍限定於開發者使用者記錄中的第一個團隊。屬於多個團隊的開發者在此流程中沒有團隊選擇器，會取得第一個團隊的模型與預算；`lite login` 提供該選擇器，以便開發者需要其他團隊的 token 時使用

此協定有兩個端點不提供服務：`GET /claude_code_gateway/v1/models` 與 `HEAD /claude_code_gateway/api/hello` 回應 `404`。登入、受管理設定與推論都不依賴它們。透過 `/v1/models` 的模型探索在 Claude Code 中是關閉的，除非已設定 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`；而在該端點未提供服務時，`/model` 選擇器會顯示 Claude Code 內建的清單，這就是為什麼 proxy 設定會保留 `anthropic/*` 萬用字元。團隊的模型清單仍然決定開發者可使用哪些模型

`enable_claude_code_gateway`、`claude_code_gateway_managed_settings` 與 `allow_cli_sso_verification_uri_complete` 只會從 `general_settings` 中的 `config.yaml` 讀取；它們不能從 Admin UI 或資料庫設定

Claude Code 會在 gateway 工作階段停用伺服器端 WebSearch，並使用 5 分鐘的 prompt cache TTL，而不是 1 小時的 TTL，因為它無法看見 gateway 路由到哪個 upstream。這兩者都是任何 gateway 的 Claude Code 行為，LiteLLM 也包含在內

## 相關文件 {#related-docs}

- [CLI SSO 驗證](../proxy/cli_sso)：gateway 重用的 device flow、token 存活時間，以及此 gateway 重用其 refresh token family 與撤銷機制的 PKCE 登入，還有原生用戶端合約
- [Admin UI 的 SSO](../proxy/admin_ui_sso)：在 proxy 上設定 Google、Microsoft、Okta 或通用 OIDC
- [使用 Okta SSO（JWT Auth）的 Claude Code](./claude_code_okta_sso)：`apiKeyHelper` 替代方案，其中 Claude Code 會直接傳送 IdP token
- [Claude Code 快速入門](./claude_responses_api)：使用 API 金鑰設定 Claude Code 與 LiteLLM 的基本範例
