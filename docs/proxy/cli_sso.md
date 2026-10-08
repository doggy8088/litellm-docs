# CLI 驗證 {#cli-authentication}

使用 litellm cli 驗證至 LiteLLM Gateway。如果您想讓大量開發者可自行存取 LiteLLM Gateway，這非常適合。

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.loom.com/embed/87c5d243cde642ff942783024ff037e3" frameBorder="0" allowFullScreen></iframe>

## 使用方式  {#usage}

### 必要條件 - 以 Beta 標記啟動 LiteLLM Proxy {#prerequisites---start-litellm-proxy-with-beta-flag}

:::warning[Beta 功能 - 必要]

CLI SSO 驗證目前處於 beta 階段。啟動您的 LiteLLM Proxy 時，您必須設定這個環境變數：

```bash
export EXPERIMENTAL_UI_LOGIN="True"
litellm --config config.yaml
```

或者將其加入您的 proxy 啟動命令：

```bash
EXPERIMENTAL_UI_LOGIN="True" litellm --config config.yaml
```

:::

### 設定 {#configuration}

#### JWT 權杖到期時間 {#jwt-token-expiration}

預設情況下，CLI 驗證權杖會在 **24 小時**後過期。您可以在啟動 LiteLLM Proxy 時，透過設定 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 環境變數來自訂這個到期時間：

```bash
# Set CLI JWT tokens to expire after 48 hours
export LITELLM_CLI_JWT_EXPIRATION_HOURS=48
export EXPERIMENTAL_UI_LOGIN="True"
litellm --config config.yaml
```

或者使用單一命令：

```bash
LITELLM_CLI_JWT_EXPIRATION_HOURS=48 EXPERIMENTAL_UI_LOGIN="True" litellm --config config.yaml
```

**範例：**
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=12` - 權杖在 12 小時後過期
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=168` - 權杖在 7 天（168 小時）後過期
- `LITELLM_CLI_JWT_EXPIRATION_HOURS=720` - 權杖在 30 天（720 小時）後過期

:::note[實驗性 UI 工作階段]
當啟用 `EXPERIMENTAL_UI_LOGIN` 時，**瀏覽器 UI 登入**工作階段會使用固定的 10 分鐘到期時間（不可設定）。`LITELLM_UI_SESSION_DURATION` 僅適用於非實驗性流程。
:::

:::tip
您可以使用以下方式檢查目前權杖的年齡與到期狀態：
```bash
lite whoami
```
:::

#### 預先填入驗證碼 {#pre-fill-the-verification-code}

預設情況下，完成 `lite login` 的瀏覽器頁面會要求您輸入終端機列印出的驗證碼。若要讓 `lite login` 開啟該頁面時已經填入驗證碼，讓您只需確認後按一下 Continue，請在 proxy 上設定：

```yaml
general_settings:
  allow_cli_sso_verification_uri_complete: true
```

此旗標預設為關閉，因為手動輸入驗證碼正是將瀏覽器頁面與啟動登入的終端機連結起來的方式。啟用此旗標後，請在確認前仍檢查預先填入的驗證碼是否與終端機列印出的相符。較舊的 `lite` 版本無論如何都會在未填入驗證碼的情況下開啟頁面，因此也請一併升級 CLI

如果該瀏覽器已登入您的 SSO 提供者，而且您想完全跳過驗證碼，請改執行 `lite login --pkce`：按一下 Approve 即可，終端機會列印 `Login successful!`。請參閱 [使用 PKCE 的瀏覽器登入](#browser-sign-in-with-pkce)

#### 歸因中繼資料（OIDC claim） {#attribution-metadata-oidc-claims}

將允許清單中的 OIDC claim 對應到 LiteLLM 使用者的 `metadata`，並在 `/sso/cli/poll` 中以 `attribution_metadata` 傳回給 CLI。這適用於穩定的歸因欄位（例如僱用類型或成本中心），而無需在用戶端解析大型群組清單。

在啟動前於 **proxy** 上設定：

```bash
export CLI_SSO_CLAIM_MAP="employment_type->acme_employment_type,org_info.department->department"
export GENERIC_USER_EXTRA_ATTRIBUTES="employment_type,org_info.department"
```

`CLI_SSO_CLAIM_MAP` 與 `LITELLM_CLI_SSO_CLAIM_MAP` 等效。格式：以逗號分隔的 `source_claim->metadata_key` 鍵值對。目的地上的可選 `metadata.` 前綴會被移除；值會儲存在使用者的 `metadata` JSON 欄位中。

| 部分 | 意義 |
|------|---------|
| `source_claim` | OIDC claim 路徑（點號表示法），包含來自 `GENERIC_USER_EXTRA_ATTRIBUTES` 的欄位 |
| `metadata_key` | LiteLLM 使用者 `metadata` 下的鍵（支援透過點號的巢狀鍵） |

僅會保留並傳回非機密純量值（`string`、`int`、`float`、`bool`）。清單、物件，以及包含如 `token` 或 `secret` 之類片段的目的地鍵會被丟棄。

範例輪詢回應（SSO 完成後）：

```json
{
  "status": "ready",
  "key": "eyJ...",
  "user_id": "user@company.com",
  "attribution_metadata": {
    "acme_employment_type": "full_time",
    "department": "Engineering"
  }
}
```

**沒有真實 IdP 的本機測試：** 從 LiteLLM repo 執行 `python scripts/mock_oidc_server_for_cli_sso.py`，將 Generic SSO 環境變數指向 `http://127.0.0.1:8765`，然後執行 `python scripts/test_cli_sso_claims_e2e.py`。

### 步驟 {#steps}

1. **安裝 CLI**

`lite` 用戶端是一個輕量的筆電安裝：它會連到 LiteLLM proxy，並透過它執行您的 coding agents，且不會載入 proxy server runtime。這個單行安裝程式只需要 `curl`；當 [uv](https://github.com/astral-sh/uv) 不存在時，它會引導安裝，並讓 uv 為您佈建相容的 Python：

```shell
   curl -fsSL https://raw.githubusercontent.com/BerriAI/litellm/main/scripts/install-cli.sh | sh
   ```

   已經有 uv，並且想自行操作嗎？直接安裝套件：

   ```shell
   uv tool install 'litellm[cli]'
   ```

   以上任一方式都會提供您 `lite` 指令。從 `litellm[proxy]` 安裝的 proxy 伺服器也會隨附它，但那個額外版本缺少 `keyring`，因此其憑證會儲存在檔案中，而不是您的作業系統 keychain。請先在終端機輸入它：

```shell
   lite
   ```

2. **設定環境變數**

在您的本機上，設定 proxy URL：

```bash
   export LITELLM_PROXY_URL=http://localhost:4000
   ```

   （請替換為您的實際 proxy URL）

3. **登入**

```shell
   lite login
   ```

   這會開啟瀏覽器視窗進行驗證。如果您已將 LiteLLM Proxy 連接到您的 SSO 提供者，您應該可以使用您的 SSO 憑證登入。登入後，您可以使用 CLI 向 LiteLLM Gateway 發出請求。

   瀏覽器頁面會要求輸入終端機列印出的驗證碼。若要略過輸入，可讓 proxy [預先填入驗證碼](#pre-fill-the-verification-code)，或在瀏覽器已持有您的 SSO 工作階段時，改用 [`lite login --pkce`](#browser-sign-in-with-pkce)，這完全不需要驗證碼

   憑證會進入您的作業系統 keychain，而 `lite login` 會列印其存放位置。在沒有 keychain 的機器上，則會退回到具有僅擁有者權限的 `~/.litellm/token.json`。如需詳細資訊，以及如何關閉 keychain 儲存，請參閱 [`lite login` 憑證](./management_cli.md#the-lite-login-credential)

4. **發出測試請求以檢視模型**

```shell
   lite models list
   ```

   這會列出所有可供您使用的模型。

## 使用 PKCE 的瀏覽器登入 {#browser-sign-in-with-pkce}

`lite login --pkce` 會透過您的系統瀏覽器，使用 OAuth 2.0 authorization code 與 PKCE（S256）讓您登入。CLI 充當 public client：它會向 proxy 註冊自己，監聽作業系統指派的 loopback 埠，且從不持有 client secret。proxy 登入頁面與您的 SSO 提供者負責驗證，而 CLI 只會看到最終產生的憑證

```shell
export LITELLM_PROXY_URL=https://litellm.example.com
lite login --pkce
```

```text
Opening browser to: https://litellm.example.com/authorize?response_type=code&client_id=llm_dcrc_...&redirect_uri=http%3A%2F%2F127.0.0.1%3A57485%2Fcallback&state=...&code_challenge=...&code_challenge_method=S256&resource=https%3A%2F%2Flitellm.example.com
Approve the sign-in in your browser. Waiting...

Login successful!
JWT Token: R46gzIdke6PgQZUiGctb...
Credential stored in your OS keychain.
You can now use the CLI without specifying --api-key
```

在瀏覽器中，如果您沒有工作階段，會先開啟 proxy 登入頁面（若 proxy 已連線到您的身分提供者則顯示 SSO，否則顯示使用者名稱與密碼）。登入後，瀏覽器會回到同意頁面。該頁面會列出 CLI 的 loopback 位址，例如 `http://127.0.0.1:57485`，顯示您目前登入的使用者，並讓您選擇要將請求歸屬到的團隊。屬於團隊的使用者必須選擇一個，規則與 `lite login` 相同。按一下 Approve。瀏覽器會顯示「已登入 LiteLLM。您可以關閉此視窗並返回終端機。」而終端機會列印 `Login successful!`

傳統的 `lite login` 流程與虛擬 API 金鑰仍可正常使用，且不會改變。`--pkce` 需要一個提供 `/.well-known/litellm-cli-auth` 的 proxy；在較舊的 proxy 上，指令會以一則說明訊息停止執行

### 已儲存的憑證 {#the-stored-credential}

key 與 refresh token 都會存入您的作業系統 keychain，也就是 `lite login` 存放 key 的地方，而記錄的其餘部分會存入 `~/.litellm/token.json`（模式 `0600`）。除了 `base_url`、`user_id` 與 `user_role` 欄位以外，`lite login` 寫入的 `--pkce` 記錄也包含 `expires_at`、`client_id`、`token_endpoint`、`revocation_endpoint`、`resource` 與 `team_id`，這些都無法單獨讓任何人取得 key。在沒有可用 keychain 的機器上，key 與 refresh token 會退回到同一個檔案，而 `lite login` 也會說明這一點；只要是這種情況，請將 `~/.litellm/token.json` 視為敏感資訊，因為任何能讀取它的人都可以用 refresh token 交換出可用的 key。使用較早 `lite` 進行的 `--pkce` 登入，會讓其 refresh token 留在檔案中，直到下一次 `lite` 指令讀取它並將其移入 keychain 為止

key 會在 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 後到期（預設為 24 小時，請參閱 [JWT Token Expiration](#jwt-token-expiration)）。到期時您不需要再次登入：下一個需要該 key 的 `lite` 指令會使用 refresh token 進行更新並儲存新的配對。每次更新都會輪替 refresh token，而已使用過的 refresh token 會被拒絕

### 從其他工具使用該憑證 {#use-the-credential-from-other-tools}

`lite auth print-token` 只會將目前的 key 輸出到 stdout，除此之外沒有其他輸出（診斷訊息會送到 stderr）。當 key 即將到期時，它會先更新 key，因此呼叫它的工具永遠能取得可用的 key

Claude Code 可以將它作為 [`apiKeyHelper`](https://code.claude.com/docs/en/settings) 執行。`lite login --pkce --config-claude` 會在 `~/.claude/settings.json` 中將 `env.ANTHROPIC_BASE_URL` 設為 proxy，並將 `env.ANTHROPIC_AUTH_TOKEN` 設為此登入的 key，同時保留您的其他設定不變。key 到期後請重新執行此指令。若要讓 Claude Code 在每次更新時呼叫 `lite auth print-token`，請依下列方式手動設定 `apiKeyHelper`：

```json title="~/.claude/settings.json"
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://litellm.example.com"
  },
  "apiKeyHelper": "/absolute/path/to/lite --base-url https://litellm.example.com auth print-token"
}
```

對於 OpenCode，或任何其他相容 OpenAI 的 client，請將 client 指向 `<proxy>/v1`，並透過環境變數傳遞 key：

```shell
LITELLM_PROXY_KEY=$(lite auth print-token) opencode
```

```json title="opencode.json"
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "litellm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LiteLLM proxy",
      "options": {
        "baseURL": "https://litellm.example.com/v1",
        "apiKey": "{env:LITELLM_PROXY_KEY}"
      },
      "models": {
        "gpt-5.4-mini": { "name": "gpt-5.4-mini" }
      }
    }
  },
  "model": "litellm/gpt-5.4-mini"
}
```

使用此 key 發出的請求會歸屬於您的使用者與您選擇的團隊，因此它們會在記錄頁面上以您的名稱顯示，並會計入您的使用者與團隊預算

### 登出 {#log-out}

```shell
lite logout
```

`lite logout` 會將 refresh token 傳送到 proxy 的 `POST /revoke` 端點，然後清除兩個儲存位置，也就是 keychain 項目與 `~/.litellm/token.json`。從那一刻起，refresh token 就失效了。key 本身無法撤銷；它會在 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 內自行到期

再次登入，無論是使用 `lite login --pkce` 或傳統的 `lite login`，都會對其取代的記錄做同樣的處理：先儲存新的憑證，然後撤銷先前登入的 refresh token，因此一旦您再次登入，較舊的 `token.json` 副本就無法再更新。如果因為無法連線到 proxy 而無法完成該撤銷，登入仍會成功並明確告知

管理員無法從儀表板撤銷 `--pkce` 登入；只有持有人自己的 `lite logout` 會縮短 refresh token 的有效期。每次更新都會重新從 proxy 讀取使用者，因此停用該使用者或將其從團隊移除，會使下一次更新失敗，而 key 會在 `LITELLM_CLI_JWT_EXPIRATION_HOURS` 內用盡。當更新遭拒時，`lite auth print-token` 與其他所有 `lite` 指令都會在 stderr 列印 proxy 提供的原因，而且一旦 key 已經用盡，它們會提示您再次執行 `lite login --pkce`

### 多個 worker 或複本 {#several-workers-or-replicas}

refresh token 的單次使用、防重放偵測，以及 `POST /revoke` 都會在 proxy 已設定 Redis 快取時，透過該快取強制執行；無論是使用 Redis `cache_params` 或 `general_settings.coordination_redis` 的 `litellm_settings.cache`，當 Redis 無法連線時都會採取封閉失敗：此時到達的 refresh 或 `POST /revoke` 會回應 `503 temporarily_unavailable`，CLI 會保留現有的 key 並在下次指令時再試一次，而 `lite logout` 會保留您的登入記錄、以 1 結束，並要求您稍後再執行一次，因此 refresh token 仍會被撤銷。若沒有 Redis，每個 worker 都會保留自己的記錄，因此在具有多個 worker 或複本的 proxy 上，已撤銷或已使用過的 refresh token 仍可能被未曾看過它的 worker 接受。請執行單一 worker 或設定 Redis

## 原生 client 合約 {#native-client-contract}

任何語言撰寫的 CLI 都可以從同一份 discovery 文件執行相同的登入流程，而無需讀取 LiteLLM 原始碼。典型情況是以 Go 撰寫的啟動器先讓使用者登入，然後使用該金鑰啟動 OpenCode。此合約有版本：在信任文件其餘部分之前，請先檢查 `contract_version`。新增欄位不會提升版本；只有會改變意義或消失的欄位才會

### Discovery 文件 {#discovery-document}

```shell
curl https://litellm.example.com/.well-known/litellm-cli-auth
```

```json
{
  "contract_version": 1,
  "issuer": "https://litellm.example.com",
  "authorization_endpoint": "https://litellm.example.com/authorize",
  "token_endpoint": "https://litellm.example.com/token",
  "registration_endpoint": "https://litellm.example.com/register",
  "revocation_endpoint": "https://litellm.example.com/revoke",
  "resource": "https://litellm.example.com",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none"],
  "revocation_endpoint_auth_methods_supported": ["none"]
}
```

`resource` 是 proxy origin。請在 authorize 與 token 請求中，將它作為 RFC 8707 `resource` 參數傳送。該參數用於要求 proxy API 憑證，而不是 MCP session；若沒有它，相同的 authorize 請求會走 MCP connect 路徑，而其鑄造的 token 會在 `/v1/*` 被拒絕

這些 URL 會根據請求的 base URL 建立。在 load balancer 或 reverse proxy 後方，請在 proxy 上將 `PROXY_BASE_URL` 設為其公開 origin，讓 `issuer`、各端點以及 `resource` 都指向使用者實際到達的位址。`lite login --pkce` 會依照 [RFC 8414 section 3.3](https://www.rfc-editor.org/rfc/rfc8414#section-3.3) 的要求檢查這一點：當 `issuer` 與使用者輸入的 `--base-url` 不同時，它會停止並顯示一則訊息，指出要傳入作為 `--base-url` 的 issuer，因此兩者必須一致

### 步驟 {#steps-1}

1. 取得上述 discovery 文件，並確認 `contract_version` 為 `1`，且 `code_challenge_methods_supported` 包含 `S256`。在向任何端點送出內容之前，也請確認 `issuer` 與您取得文件的位址相符（相同的 scheme、host、port 與 path，不分大小寫且忽略尾端斜線），並確認每個端點與 `resource` 都位於相同的 origin。請在不跟隨 redirects 的情況下，向註冊、token 與撤銷端點送出請求：否則 `307` 或 `308` 會把 code 與 verifier，或 refresh token，重送到 `Location` 指向的任何位置

2. 註冊公開用戶端。於 `127.0.0.1` 上啟動監聽器，使用由作業系統指派的連接埠，並將該位址註冊為 redirect URI。保留回傳的 `client_id`；這裡沒有 secret

   ```shell
   curl -X POST https://litellm.example.com/register \
     -H 'content-type: application/json' \
     -d '{
       "client_name": "my-cli",
       "redirect_uris": ["http://127.0.0.1:53187/callback"],
       "token_endpoint_auth_method": "none",
       "grant_types": ["authorization_code", "refresh_token"],
       "response_types": ["code"]
     }'
   ```

   ```json
   {
     "client_id": "llm_dcrc_lq411b6QkPmfxjW...",
     "token_endpoint_auth_method": "none",
     "redirect_uris": ["http://127.0.0.1:53187/callback"]
   }
   ```

3. 產生 PKCE code verifier（43 到 128 個字元）及其 S256 code challenge，外加一個隨機 `state`，並在 authorization 端點開啟系統瀏覽器

   ```text
   https://litellm.example.com/authorize
     ?response_type=code
     &client_id=llm_dcrc_lq411b6QkPmfxjW...
     &redirect_uri=http://127.0.0.1:53187/callback
     &state=<random>
     &code_challenge=<S256 challenge>
     &code_challenge_method=S256
     &resource=https://litellm.example.com
   ```

   若沒有 proxy session，瀏覽器會被導向登入頁面，之後再返回此 URL。若有 session，consent 頁面會立即顯示。使用者選取 team 並按一下 Approve

4. 在 loopback 監聽器上接收 code。瀏覽器會抵達 `http://127.0.0.1:53187/callback?code=<code>&state=<state>`。在使用 code 之前，請確認 `state` 與先前傳送的相同。若使用者按了 Deny，回呼中會帶有 `error` 與 `error_description`，而不是 `code`

5. 以 code 交換憑證。請求使用 form-encoded，且沒有 client secret；`code_verifier` 可證明該 client 就是啟動此流程的那個

   ```shell
   curl -X POST https://litellm.example.com/token \
     -d grant_type=authorization_code \
     -d code=<code> \
     -d redirect_uri=http://127.0.0.1:53187/callback \
     -d client_id=llm_dcrc_lq411b6QkPmfxjW... \
     -d code_verifier=<verifier> \
     -d resource=https://litellm.example.com
   ```

   ```json
   {
     "access_token": "LneZuxEFqvemEwK6lRzgg6BN...",
     "token_type": "Bearer",
     "expires_in": 86400,
     "refresh_token": "llm_srefresh_eyJhbGciOiJ...",
     "user_id": "user@example.com",
     "team_id": "a0a759e9-6234-4c75-bbad-b535f6c9e80e"
   }
   ```

   authorization code 只能使用一次。再次傳送會回傳帶有 `{"error": "invalid_grant", "error_description": "the authorization code was already used"}` 的 `400`

6. 在 proxy 的 LLM 路由上將 `access_token` 作為 Bearer token 使用：`/v1/chat/completions`、`/v1/responses`、`/v1/messages`、`/v1/models`，以及其餘路由。費用會歸屬於 token 回應中的使用者與 team

   ```shell
   curl https://litellm.example.com/v1/chat/completions \
     -H "Authorization: Bearer LneZuxEFqvemEwK6lRzgg6BN..." \
     -H 'content-type: application/json' \
     -d '{"model": "gpt-5.4-mini", "messages": [{"role": "user", "content": "Say hi in three words."}]}'
   ```

7. 在 `expires_in` 用完之前更新憑證。回應的格式與步驟 5 相同，並會帶回新的 refresh token。舊的 refresh token 若再次使用，將以 `400 invalid_grant` 被拒絕，因此在使用新的 access token 之前，請先儲存新的配對

   ```shell
   curl -X POST https://litellm.example.com/token \
     -d grant_type=refresh_token \
     -d refresh_token=llm_srefresh_eyJhbGciOiJ... \
     -d client_id=llm_dcrc_lq411b6QkPmfxjW... \
     -d resource=https://litellm.example.com
   ```

8. 在登出時撤銷 refresh token（[RFC 7009](https://www.rfc-editor.org/rfc/rfc7009)），且當使用者再次登入、您替換任何憑證時，也要撤銷該憑證的 refresh token。只有 refresh token 可被撤銷；access token 會自行到期。即使是伺服器已不再識別的 token，端點也會以 `200` 搭配 `{}` 回應，因此可安全重複呼叫多次

```shell
   curl -X POST https://litellm.example.com/revoke \
     -d token=llm_srefresh_eyJhbGciOiJ... \
     -d client_id=llm_dcrc_lq411b6QkPmfxjW...
   ```

### 安全規則 {#security-rules}

原生 proxy API 授權會重新導向至 loopback 位址（`127.0.0.1`、`::1` 或 `localhost`）。託管的 HTTPS 回呼需要獨立的 [hosted app grant](#hosted-app-sign-in) 以及精確的 operator allowlisting；僅有 client registration 並不足以授權。authorization code 只能使用一次，且會綁定 client 與 PKCE verifier。`lite` 絕不會跟隨來自註冊、token 或撤銷端點的 redirect；若收到 `3xx` 回應，命令會停止並顯示指出其所指向位置的訊息，因此 code 與 verifier 或 refresh token 只會抵達其 discovery 文件所檢查之 origin。consent 頁面以 `Cache-Control: no-store` 與 `Content-Security-Policy: frame-ancestors 'none'` 提供，因此無法嵌入另一個頁面。伺服器絕不會代替使用者選擇 team：team 來自 consent 頁面，在每次 token exchange 與 refresh 時都會再次檢查 membership，而若在使用者仍有可選擇的有效 team 時，提交未指定 team 的 grant 會以 `400 invalid_grant` 與描述 `this user belongs to a team; sign in again and pick the team for this credential` 被拒絕

device authorization grant、embedded browsers，以及 resource owner password credentials grant 都不支援

## Hosted app 登入 {#hosted-app-sign-in}

Hosted application 可透過相同的 authorization-code 與 S256 PKCE 流程重用閘道已設定的 Google、Okta 或其他 SSO 提供者。請以 gateway URL 設定應用程式，並在閘道上註冊其精確的 HTTPS callback。請使用其 `/.well-known/litellm-cli-auth` discovery 文件宣告所需 hosted scope 的 gateway release

| 要求的 scope | Gateway callback 設定 | 存取權 |
| --- | --- | --- |
| `proxy:read` | `LITELLM_PROXY_API_OAUTH_REDIRECT_URIS` | 使用者目前權限範圍內的模型清單與彙總使用量報告 |
| `proxy:admin` | `LITELLM_PROXY_API_OAUTH_ADMIN_REDIRECT_URIS` | 現有的管理員操作與模型呼叫，受目前 `proxy_admin` 權限與 gateway 限制約束 |

對於管理員應用程式，請在閘道上設定：

```shell
export LITELLM_PROXY_API_OAUTH_ADMIN_REDIRECT_URIS=https://admin.example.com/oauth/callback
```

這兩個設定都接受以逗號分隔的精確 HTTPS URI。萬用字元、查詢字串與 fragment 會被拒絕。admin callback 可要求任一 scope；reporting callback 不能要求 admin 存取權。省略 `scope` 會請求 `proxy:read`。註冊 callback 絕不會提升使用者權限或略過其同意

discovery 文件保留 `contract_version: 1` 並新增 `hosted_app`。其 `scopes_supported` 列出目前啟用的 hosted scopes，`access_token_ttl` 為 300 秒，而 `refresh_token_ttl` 為 86400 秒。用戶端會檢查這些功能，驗證 `issuer` 與 `resource` 是否符合其設定的 gateway，並使用已探索到的 registration、authorization、token 與 revocation 端點。進行授權時請送出 `resource=<gateway origin>` 與所選的 `scope`。Hosted token 會包含 `scope`、`user_id`、`access_token`、`refresh_token`、`expires_in` 與 `refresh_expires_in`

Hosted grant 需要資料庫與共享 Redis。gateway 會在使用時檢查目前使用者、所選 team、callback 信任以及適用的模型、預算與速率限制。自訂驗證與 exclusive external-auth 模式不會簽發 hosted grant。失去 `proxy_admin` 角色的管理員也會失去 hosted admin 存取權

Access token 會在五分鐘內過期。Refresh token 會輪替，且無法將同意延長超過 24 小時；重複使用已用完的 refresh token 會撤銷該 grant。成功的 refresh 會保留仍未過期、且已在進行中的工作所使用的 access token。在已探索到的 revocation 端點撤銷 access 或 refresh token，會使整個 grant 在所有 gateway worker 間失效

用戶端會在靜態儲存時加密 refresh token，將其綁定至閘道與使用者，序列化更新，並在送出前保留更新嘗試記錄。不確定的更新需要重新登入，而不是重播 refresh 或執行管理員操作。中斷連線會立即移除本機存取權，並在閘道暫時無法使用時重試閘道撤銷。

在升級標準閘道部署時，請保留閘道 URL、回呼設定、簽署設定以及共用的 Redis 狀態。應用程式會從該 URL 探索通訊協定能力；它不依賴於獨立的後端映像版本固定。
