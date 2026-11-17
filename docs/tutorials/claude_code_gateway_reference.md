---
title: Claude Code 閘道參考
sidebar_label: 閘道參考
displayed_sidebar: tutorialSidebar
---

import Image from '@theme/IdealImage';

# Claude Code 閘道參考 {#claude-code-gateway-reference}

請先從 [Claude Code SSO 設定](./claude_code_gateway.md) 開始，選擇並設定登入流程。

讓開發者以您的 SSO 提供者登入 Claude Code，不必使用 API 金鑰。LiteLLM 提供與 Anthropic 自行託管的 [Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway) 相同的閘道通訊協定：Claude Code 的 `/login` 會開啟 **Cloud gateway** 畫面，開發者在瀏覽器中透過您的身分提供者登入，之後的每個請求都帶有與該開發者的使用者和團隊綁定的 LiteLLM 權杖，因此支出、預算與記錄都按個人歸因，無需核發或輪替任何東西

<EnterpriseFeature feature="SSO">自 v1.76.0 起，SSO 對最多 5 位使用者免費。超過此數，需要企業授權。</EnterpriseFeature>

此流程可搭配 LiteLLM 支援的任何 SSO 提供者（Google、Microsoft Entra ID、Okta，或透過通用用戶端的任何 OIDC 提供者）。它與 [Claude Code 搭配 Okta SSO (JWT Auth)](./claude_code_okta_sso) 不同，後者由輔助腳本取得 IdP 權杖，Claude Code 再將該權杖作為其 API 金鑰傳送：在此流程中沒有要散布的腳本，登入是 Claude Code 本身的功能，且 proxy 可以將[受管理設定](#4-push-managed-settings-from-the-proxy)推送給每個已登入的用戶端。開發者的電腦需要 Claude Code v2.1.195 或更新版本

## 運作方式 {#how-it-works}

Claude Code 從受管理設定檔讀取閘道 URL，取得閘道的 OAuth 探索文件，並要求開發者信任該閘道一次。接著它啟動 [OAuth 裝置授權](https://www.rfc-editor.org/rfc/rfc8628)流程：終端機顯示一組短代碼，並在 LiteLLM 的 SSO 登入頁面開啟瀏覽器，開發者以您的身分提供者登入，若屬於多個團隊則選取一個團隊 <SinceVersion v="1.109.0" />，並確認代碼，而一直在輪詢權杖端點的 Claude Code 會收到 LiteLLM CLI 權杖與刷新權杖。CLI 權杖是範圍限定於開發者的使用者與團隊的 JWT，預設有效 24 小時，Claude Code 會在它過期前以刷新權杖更新它，因此持續使用 Claude Code 的開發者不會被送回瀏覽器（請參閱[工作階段存續時間與登出](#session-lifetime-and-sign-out)）。Claude Code 儲存這兩個權杖，以 CLI 權杖取得受管理設定，並將每個推論請求以它作為 bearer token 傳送到 `/claude_code_gateway/v1/messages`。在底層，閘道重複使用 proxy 既有的 [CLI SSO 裝置流程](../proxy/cli_sso)，因此適用於 `lite login` 的一切（SSO 提供者、團隊成員資格、模型存取權、預算）在此都適用

## 1. 開啟閘道 {#1-turn-the-gateway-on}

在 `general_settings` 中啟用閘道。`anthropic/*` 萬用字元很重要：Claude Code 會自行要求模型名稱（目前版本是 `claude-opus-4-7`），因此 proxy 需要能解析它傳送的任何名稱，而在它旁邊放一個具名別名，可讓您有一個穩定的名稱可授權給團隊

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

瀏覽器這一端是 proxy 的 SSO 登入，因此請依照 [SSO for Admin UI](../proxy/admin_ui_sso) 的說明設定您的 SSO 提供者，並將 `<proxy base url>/sso/callback` 註冊為重新導向 URI。Google 需要兩個變數；Microsoft、Okta 與通用 OIDC 在該頁面上有各自的一組設定

```bash
export GOOGLE_CLIENT_ID="<client id>"
export GOOGLE_CLIENT_SECRET="<client secret>"
export PROXY_BASE_URL="https://litellm.internal.example.com"
litellm --config config.yaml
```

`PROXY_BASE_URL` 是開發者連接的來源。閘道以它建立探索文件、權杖端點與瀏覽器驗證 URL，因此在負載平衡器或 TLS 終結器後面時，它必須指出對外公開的來源，而不是 pod。Claude Code 只會登入主機名稱解析到私人位址（RFC 1918、link-local、CGNAT `100.64.0.0/10`、IPv6 ULA `fc00::/7` 或 loopback）的閘道，因為受信任的閘道可以推送會在開發者電腦上執行指令的設定。請將 proxy 放在 TLS 後面的內部主機名稱上；CLI 會在首次連接時依主機名稱釘選 TLS 憑證。如下方螢幕截圖所示，loopback 上的純 `http://` 可用於本機測試

有兩個選填設定可調整此流程。`LITELLM_CLI_JWT_EXPIRATION_HOURS` 設定工作階段權杖在兩次更新之間的存續時間（預設 `24`）。Claude Code 會在工作階段權杖過期前以刷新權杖更新它，因此開發者可以保持登入超過該存續時間。工作階段會在 14 天沒有更新、更新遭到拒絕，或開發者執行 `/logout` 時結束（請參閱[工作階段存續時間與登出](#session-lifetime-and-sign-out)）。請將它保持在 `336` 或以下，因為存續時間比 14 天刷新權杖更長的工作階段權杖，會比用來更新它的權杖活得更久，而開發者在它過期時就得回到 `/login`。在 `general_settings` 下設定 `allow_cli_sso_verification_uri_complete: true` 會將 `verification_uri_complete` 加入裝置授權回應，它將代碼放在 URL 中，讓支援它的用戶端開啟瀏覽器頁面時代碼已經填好。它預設關閉，因為輸入代碼正是將瀏覽器頁面與啟動登入的終端機綁定的方式；請參閱[預先填入驗證碼](../proxy/cli_sso#pre-fill-the-verification-code)

若有多個 worker 或 replica，瀏覽器這一端與終端機的輪詢可能落在不同的處理程序上，而登入狀態存放在 proxy 的 CLI SSO 快取中。哪些刷新權杖已被使用或撤銷的記錄也存放在 proxy 的快取中，從未看過該記錄的處理程序會接受另一個處理程序已經輪替或撤銷的刷新權杖。請設定 Redis（環境中的 `REDIS_HOST`、`REDIS_PORT` 與 `REDIS_PASSWORD`，或 `general_settings.coordination_redis`）讓該快取共用，或只執行單一 worker。Redis 無法連接時，更新或登出會回應 `503 temporarily_unavailable` 而不是猜測，Claude Code 會繼續使用它持有的工作階段權杖，稍後再更新

## 2. 從命令列驗證 {#2-verify-from-the-command-line}

探索文件不需要驗證即可取得。`issuer` 是下一步要放入每位開發者的受管理設定檔的 URL

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

手動啟動一次裝置授權，可以看到 Claude Code 在 `/login` 看到的內容：給開發者的代碼、瀏覽器 URL、十分鐘的時限與五秒的輪詢間隔

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

在瀏覽器登入完成前輪詢權杖端點會得到 `authorization_pending`，這正是 Claude Code 正在等待的回應

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:device_code \
  -d device_code="cli-tyQu2vOB-r2ynASXPqyOKDd0g_cr6NOm.mAVkxaITywoFfMB-_x87HqgyZ886Hz6luXiZw2qssVo"
```

```json
{"error": "authorization_pending"}
```

開發者在瀏覽器中核准代碼後（下一節會展示這一端），同樣的輪詢會回傳工作階段權杖，並在旁邊附上刷新權杖，以 `cache-control: no-store` 提供。`expires_in` 是以秒為單位的 `LITELLM_CLI_JWT_EXPIRATION_HOURS`，而 `user_id` 與 `team_id` 指出工作階段範圍所屬的使用者與團隊

```json
{
  "access_token": "litellm_login_<redacted>",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "llm_srefresh_e<redacted>",
  "user_id": "<the signed-in user id>",
  "team_id": "<the team the session is issued for, or null when the user has none>"
}
```

更新是在同一個端點上使用 `refresh_token` 授權類型，不帶 `client_id`，這正是 Claude Code 傳送的方式。回應的形狀相同，帶有新的工作階段權杖與新的刷新權杖，而剛出示的刷新權杖就此用完

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/token \
  -d grant_type=refresh_token \
  -d refresh_token="$REFRESH_TOKEN"
```

第二次出示的刷新權杖、已被撤銷的刷新權杖，或從來不是刷新權杖的值，都會得到 `400 invalid_grant`

```json
{
  "error": "invalid_grant",
  "error_description": "the refresh token was already used"
}
```

登出是在 `revocation_endpoint` 上進行 [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009) 撤銷。`/logout` 將工作階段權杖與刷新權杖各以一個請求傳送到那裡。撤銷刷新權杖才是結束登入的動作；工作階段權杖是無狀態的，會自行過期，因此它的請求不會改變任何東西。此端點無論是否認識該權杖，都會以 `{}` 回應 `200`，因此呼叫兩次是安全的

```bash
curl -X POST http://localhost:4000/claude_code_gateway/oauth/revoke \
  -d token="$REFRESH_TOKEN" \
  -d token_type_hint=refresh_token
```

## 3. 將 Claude Code 指向 proxy {#3-point-claude-code-at-the-proxy}

Claude Code 只有在閘道 URL 來自受管理設定檔時，才會在閘道畫面上開啟 `/login`。這些鍵在開發者自己的 `~/.claude/settings.json` 中會被忽略，因此請透過您的裝置管理工具部署此檔案，或直接寫入：macOS 上是 `/Library/Application Support/ClaudeCode/managed-settings.json`，Linux 與 WSL 上是 `/etc/claude-code/managed-settings.json`，Windows 上是 `C:\Program Files\ClaudeCode\managed-settings.json`

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://litellm.internal.example.com/claude_code_gateway"
}
```

此 URL 是探索文件中的 `issuer`，帶有 `/claude_code_gateway` 路徑。若開發者的電腦透過公司 proxy 路由 HTTPS，請將 LiteLLM 主機加入 `NO_PROXY`，讓 CLI 直接連接它；若您的內部網路使用您擁有的公開 IPv4 空間編號，請將這些區塊列在 `gatewayInternalNetworks` 受管理設定中（Claude Code v2.1.268 或更新版本）；這兩點在 Anthropic 的[閘道前置條件](https://code.claude.com/docs/en/claude-apps-gateway#prerequisites)中都有說明

檔案就位後，執行 `claude`（或在執行中的工作階段執行 `/login`）。閘道畫面會顯示來自受管理設定的 URL

<Image img={require('../../img/claude_code_gateway/gateway_detected.png')} style={{ width: '800px', height: 'auto' }} />

首次連接時，Claude Code 會要求開發者信任該閘道，因為受信任的閘道可以將設定推送到電腦上。每個閘道主機只會詢問一次

<Image img={require('../../img/claude_code_gateway/trust_gateway.png')} style={{ width: '800px', height: 'auto' }} />

接著 Claude Code 會顯示驗證碼，並在 proxy 的 SSO 登入頁面開啟瀏覽器。若瀏覽器沒有開啟，開發者可造訪顯示的 URL

<Image img={require('../../img/claude_code_gateway/device_code.png')} style={{ width: '800px', height: 'auto' }} />

瀏覽器會經過您的身分提供者（已經登入該提供者的瀏覽器會直接進入下一頁，不會出現提示），然後要求輸入終端機上的代碼

<Image img={require('../../img/claude_code_gateway/browser_verification_code.png')} style={{ width: '800px', height: 'auto' }} />

在同一個頁面上，屬於多個團隊的開發者可選取工作階段的團隊 <SinceVersion v="1.109.0" />。**Attribute requests to team** 下拉選單一開始是 **Choose a team**，頁面在開發者選取之前不會送出。每個選項顯示團隊的別名，若團隊沒有別名則顯示團隊 id，當開發者的兩個團隊顯示相同名稱時，會在括號中加上團隊 id。工作階段權杖是為所選的團隊核發的，因此工作階段會取得該團隊的模型與預算，其支出歸入該團隊，且每次更新都保持不變。只屬於一個團隊的開發者會看到「Requests are attributed to team」以及該團隊的名稱，而不是下拉選單；不屬於任何團隊的開發者兩者都不會看到，並取得沒有團隊的工作階段

<Image img={require('../../img/claude_code_gateway/browser_team_choice.png')} style={{ width: '800px', height: 'auto' }} />

proxy 會將所選團隊與登入時為開發者讀取的團隊核對，一次在頁面送出時，一次在 Claude Code 收集權杖時。送出時指名不在其中的團隊（下拉選單永遠不會提供）會得到 `400 {"detail":"Choose one of the teams you belong to"}`。若所選團隊已不在其中，因為開發者已被移出該團隊、又在同一個連結上重新登入，會從權杖端點得到 `400 invalid_grant` 以及「The team picked at sign-in is no longer one of your teams; sign in again」，開發者需再次執行 `/login`

較舊的版本不顯示下拉選單，會為 proxy 最先讀到的開發者團隊核發工作階段，而那不一定是其使用者記錄上的第一個團隊。在滾動升級期間，由仍在較舊版本的 replica 啟動的登入，或由它提供頁面或 **Continue** 的登入，無論開發者選了什麼，都會得到同樣的團隊。只回應 Claude Code 權杖輪詢的較舊版本 replica 會保留所選團隊。工作階段在更新時會保持其團隊，因此在較舊版本登入的工作階段在升級後仍留在該團隊。Claude Code 不會顯示工作階段取得了哪個團隊，因此屬於多個團隊、且在升級前或升級期間登入的開發者，要在每個 replica 都到 1.109.0 或更新版本後，再執行一次 `/login`

按下 Continue 後，瀏覽器會確認登入，終端機在下一次輪詢時取得它

<Image img={require('../../img/claude_code_gateway/browser_login_complete.png')} style={{ width: '800px', height: 'auto' }} />

<Image img={require('../../img/claude_code_gateway/connected.png')} style={{ width: '800px', height: 'auto' }} />

從這裡開始，Claude Code 會繼續其慣常的首次執行提示（安全注意事項與工作區信任），然後進入提示畫面，在模型旁邊顯示 **Cloud gateway**。請求以開發者的權杖送到 proxy 上的 `POST /claude_code_gateway/v1/messages`，每一個都會出現在 proxy 的記錄與支出中，位於該開發者的使用者與團隊之下

<Image img={require('../../img/claude_code_gateway/signed_in_session.png')} style={{ width: '800px', height: 'auto' }} />

### 工作階段存續時間與登出 {#session-lifetime-and-sign-out}

Claude Code 將工作階段權杖與刷新權杖儲存在一起。在工作階段權杖過期前五分鐘（預設 24 小時），它會將刷新權杖傳送到權杖端點，並儲存回傳的新工作階段權杖與刷新權杖，因此持續使用 Claude Code 的開發者不會被送回瀏覽器。每個刷新權杖只能使用一次，存續 14 天，且每次更新都會核發新的，因此工作階段會在 14 天沒有更新後結束，Claude Code 會在它持有的工作階段權杖過期後要求 `/login`。同一台電腦上的兩個 Claude Code 終端機共用儲存的憑證，但各自更新，因此第二個更新的會出示第一個已經輪替過的刷新權杖，遭到拒絕（proxy 的存取記錄中在 `/claude_code_gateway/oauth/token` 上出現一或多個 `400`），並繼續使用第一個終端機儲存的憑證

每次更新都會重新讀取開發者在 LiteLLM 中的使用者記錄與團隊成員資格。在 LiteLLM 中停用或刪除該使用者，或將他們移出工作階段核發所屬的團隊，會以 `400 invalid_grant` 拒絕下一次更新，Claude Code 會在目前的工作階段權杖於 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 內過期後要求 `/login`。已刪除使用者的請求送到 `/claude_code_gateway/v1/messages` 會立即得到 `401`，在該工作階段權杖過期之前就會。僅在身分提供者處取消開發者的佈建，不會結束進行中的工作階段，因為更新檢查的是 LiteLLM 自己的使用者與團隊狀態，而不是身分提供者，因此該工作階段會持續更新，直到 14 天沒有更新為止。若要更早結束，也請在 LiteLLM 中停用該使用者

`/logout` 將工作階段權杖與刷新權杖傳送到 `POST /claude_code_gateway/oauth/revoke`，也就是探索文件中的 `revocation_endpoint`，然後移除儲存的憑證。撤銷刷新權杖會結束該次登入，因為從它輪替出的每個刷新權杖，無論由誰持有，從那時起都會遭到拒絕。工作階段權杖本身是自足的，不會被撤銷；它會保持有效直到過期

更新與撤銷可運作 <SinceVersion v="1.106.0" />，最早出現在 `v1.106.0-rc.1`。較舊的版本不核發刷新權杖，對每次刷新都以 `401` 回應，因此 Claude Code 在每次過期時都會再次要求 `/login`；在滾動升級期間，由仍在前一版本的 replica 處理的更新，也會對該開發者發生一次同樣的情況

## 4. 從 proxy 推送受管理設定 {#4-push-managed-settings-from-the-proxy}

您放在 `claude_code_gateway_managed_settings` 下的任何內容，都會原封不動地作為組織的受管理設定，提供給每個透過閘道登入的用戶端。此值是一份 Claude Code [受管理設定](https://code.claude.com/docs/en/managed-settings)文件，因此相同的鍵都適用：`permissions`、`env`、hooks、允許的工具等等。Claude Code 會在啟動時取得它，之後每小時再取得一次，被鎖定的鍵無法在本機覆寫

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

此端點是 `GET /claude_code_gateway/managed/settings`，以 CLI 權杖驗證（任何 LiteLLM 金鑰都可用來檢查它）。回應將您的區塊包裝在 Claude Code 預期的 `{uuid, checksum, settings}` 信封中，其中兩個 id 都是正規化 JSON 的 SHA-256，相同的值也會以 `ETag` 回傳。Claude Code 在每小時更新時將它以 `If-None-Match` 送回，在區塊變更前都會得到 `304 Not Modified`。當 `claude_code_gateway_managed_settings` 未設定時，端點會回應 `404`，CLI 將它解讀為「沒有受管理政策」

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

有些設定在首次套用時需要開發者核准。遙測目的地是其中之一：Claude Code 會顯示遙測將送往何處，只有在開發者接受後才套用該區塊，因此請告訴您的開發者預期會看到這個畫面

<Image img={require('../../img/claude_code_gateway/managed_settings_approval.png')} style={{ width: '800px', height: 'auto' }} />

## 5. 遙測 {#5-telemetry}

在透過 `/login` 登入的工作階段中，Claude Code 會將其 OpenTelemetry 匯出（透過 HTTP 的 OTLP；閘道工作階段不支援 gRPC）傳送到閘道，而不是本機設定的 `OTEL_EXPORTER_OTLP_ENDPOINT`，除非受管理設定指名了另一個收集器。上方的 `env` 區塊開啟匯出器並將它們指向 proxy，proxy 提供 `POST /claude_code_gateway/v1/metrics`、`/v1/logs` 與 `/v1/traces`，以相同的權杖驗證，並回應 `200`。目前 proxy 接受這些匯出並將它們丟棄；每個請求的使用量、支出與記錄來自 proxy 在 `/claude_code_gateway/v1/messages` 上自己的記錄，而不是 OTLP 串流。若您已經在收集 Claude Code 遙測，請改在受管理設定中將 `OTEL_EXPORTER_OTLP_ENDPOINT` 設為您的收集器

## 部署拓撲 {#deployment-topologies}

**Claude Code 到 LiteLLM。** 本頁的設定：開發者透過 LiteLLM 登入，LiteLLM 持有提供者憑證，proxy 的[模型存取權](../proxy/virtual_keys)、[預算](../proxy/users)、[速率限制](../proxy/users)與[記錄](../proxy/logging)按使用者與團隊套用。當 LiteLLM 已經是您其他用戶端的閘道時，應選擇此拓撲

**Claude Code 到負載平衡器後面的 LiteLLM。** 相同的設定，但有多個 replica：`PROXY_BASE_URL` 指名平衡器的來源，讓探索文件與瀏覽器 URL 將開發者指向他們能連接的位址，TLS 在平衡器上以私人主機名稱終結，並設定 Redis，讓裝置流程能在任何 replica 上完成。不需要黏性工作階段

**Claude Code 到 Claude apps gateway 再到 LiteLLM。** Anthropic 不提供託管閘道；[Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway) 是您自行執行的軟體。若您已經在執行它（為了它的 IdP 群組政策，或因為 Claude Desktop 透過它連接），它可以作為 LiteLLM 前面的 `anthropic` 上游，其 `base_url` 是 proxy，`api_key` 是 LiteLLM 虛擬金鑰。在該上游設定 `forward_user_identity: true`，Claude apps gateway 就會在它轉送的每個請求中加入 `x-litellm-end-user-id`（開發者的電子郵件）；LiteLLM 會將該標頭讀作[客戶 id](../proxy/customers)，無需任何額外設定，因此即使 proxy 只看到一把金鑰，支出仍按開發者追蹤。LiteLLM 對這類請求回傳的 `429` 會原封不動地回傳給開發者，而不是容錯移轉到另一個上游（Claude apps gateway v2.1.267 或更新版本），因此每位客戶的預算與速率限制得以維持。在此拓撲中，登入與受管理設定屬於 Claude apps gateway，而 LiteLLM 上的 `enable_claude_code_gateway` 保持關閉

```yaml
upstreams:
  - provider: anthropic
    base_url: https://litellm.internal.example.com
    auth:
      api_key: ${LITELLM_VIRTUAL_KEY}
    forward_user_identity: true
```

## 已知限制 {#known-limits}

撤銷只涵蓋刷新權杖。工作階段權杖是自足的，因此在 `/logout` 之後，開發者持有的工作階段權杖會持續運作直到過期，在 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 之內

被重放的刷新權杖本身會遭到拒絕，且不會結束其他任何東西，因此在真正的刷新權杖之前先更新的刷新權杖副本，會讓它的鏈保持存活。真正的 Claude Code 在遭到該拒絕時會丟棄它的刷新權杖，讓 `/logout` 沒有東西可撤銷，因此在 LiteLLM 中停用或刪除該使用者，或將他們移出團隊，才是結束該鏈的方法

刷新權杖以 MCP 閘道的工作階段簽署金鑰簽署，該金鑰由 `master_key` 衍生，除非有設定 `general_settings.mcp_session_token_signing`。在無法載入該區塊的 proxy 上，登入仍會成功，但不回傳刷新權杖，proxy 會記錄該錯誤，因此在修復之前，開發者在每次過期時都得重新登入

工作階段會留在它核發所屬的團隊，每次更新都保持該團隊。想要另一個團隊模型的開發者可再次執行 `/login`，並在登入頁面上選取它 <SinceVersion v="1.109.0" />。較舊的版本無法在 Claude Code 中選取另一個團隊，若開發者需要另一個團隊的權杖，`lite login` 提供團隊選取器

此通訊協定有兩個端點未提供：`GET /claude_code_gateway/v1/models` 與 `HEAD /claude_code_gateway/api/hello` 會回應 `404`。登入、受管理設定與推論都不依賴它們。透過 `/v1/models` 的模型探索在 Claude Code 中是關閉的，除非設定 `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`；在端點未提供的情況下，`/model` 選取器會顯示 Claude Code 的內建清單，這就是 proxy 設定保留 `anthropic/*` 萬用字元的原因。團隊的模型清單仍然決定開發者可以使用其中哪些模型

`enable_claude_code_gateway`、`claude_code_gateway_managed_settings` 與 `allow_cli_sso_verification_uri_complete` 只能從 `config.yaml` 的 `general_settings` 讀取；無法從管理 UI 或資料庫設定

Claude Code 在閘道工作階段停用伺服器端 WebSearch，並使用 5 分鐘的提示快取 TTL 而不是 1 小時的，因為它看不到閘道路由到哪個上游。這兩者都是 Claude Code 對任何閘道（包括 LiteLLM）的行為

## 相關文件 {#related-docs}

- [CLI SSO 驗證](../proxy/cli_sso)：閘道重複使用的裝置流程、權杖存續時間、此閘道重複使用其刷新權杖家族與撤銷的 PKCE 登入，以及原生用戶端契約
- [SSO for Admin UI](../proxy/admin_ui_sso)：在 proxy 上設定 Google、Microsoft、Okta 或通用 OIDC
- [Claude Code 搭配 Okta SSO (JWT Auth)](./claude_code_okta_sso)：`apiKeyHelper` 替代方案，由 Claude Code 自行傳送 IdP 權杖
- [Claude Code 快速入門](./claude_responses_api)：使用 API 金鑰的 Claude Code 與 LiteLLM 基本設定
