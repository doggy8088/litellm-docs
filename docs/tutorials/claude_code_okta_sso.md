# Claude Code 與 Okta SSO（JWT 驗證） {#claude-code-with-okta-sso-jwt-auth}

透過 LiteLLM，使用每位開發者的 Okta 身分來路由 Claude Code。Claude Code 會在每個請求中傳送開發者自己的 Okta access token，LiteLLM 會針對您的 Okta 授權伺服器驗證它，並在首次請求時自動建立使用者，而使用量、支出與記錄都會歸屬於該使用者。無需發放每位使用者的 API 金鑰，也不需要手動佈建，因此此設定對 10 位開發者或 10,000 位開發者都同樣適用。

<EnterpriseFeature feature="JWT authentication" />

本指南使用 Okta，但任何發出 JWT access token 的 OIDC 提供者（例如 Azure AD、Keycloak、Auth0 等）都可用相同方式運作；只有 issuer URLs 與應用程式設定不同。

## 運作方式 {#how-it-works}

開發者第一次使用 Claude Code 時，一個小型 `apiKeyHelper` 腳本會開啟 Okta 登入頁面。之後一切都會靜默進行：該腳本會提供快取的 token，並在背景重新整理，Claude Code 會將該 token 作為其 API 金鑰傳送，而 LiteLLM 會針對 Okta 公開的 JWKS 金鑰驗證 token 簽章。因為已啟用 `user_id_upsert`，LiteLLM 會在首次請求時根據 token 的 `sub` 與 `email` claim 建立內部使用者記錄，因此無需管理員發放任何內容即可立即開始進行每位使用者的支出追蹤。

## 1. 建立 Okta 應用程式 {#1-create-an-okta-app}

在 Okta Admin Console 中，為 Claude Code 建立一個 **OIDC Native Application**：

1. **Applications > Create App Integration**，選擇 **OIDC** 與 **Native Application**。
2. 在 **Grant type** 下，啟用 **Device Authorization**（最適合 CLI 工具；不需要 client secret，也不需要 localhost redirect）以及 **Refresh Token**。
3. 將此應用程式指派給應該具有存取權的 Okta 群組。
4. 記下 **Client ID**。

Token 必須來自 **custom authorization server**（例如內建的、名為 `default` 的伺服器），而不是 org authorization server，因為只有 custom authorization server 的 access token 才是您可以透過 JWKS endpoint 驗證的 JWT。於 **Security > API > Authorization Servers** 下，確認 `default` 伺服器存在，並記下兩個值：

- JWKS URL：`https://<your-okta-domain>/oauth2/default/v1/keys`
- Audience：`api://default`（或您的伺服器設定的 audience 值）

來自 custom authorization server 的 access token 預設包含 `sub`。若也要在 access token 中取得使用者的 email，請在 **Security > API > Authorization Servers > default > Claims** 下新增一個 claim：名稱 `email`、包含於 **Access Token**、值 `user.email`。

## 2. 設定 LiteLLM {#2-configure-litellm}

在您的 proxy 設定中啟用 JWT 驗證：

```yaml
model_list:
  - model_name: {{anthropic_large}}
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    user_email_jwt_field: "email"
    user_id_upsert: true
```

設定環境變數。使用者 upsert 會寫入資料庫，因此需要 `DATABASE_URL`：

```bash
export JWT_PUBLIC_KEY_URL="https://<your-okta-domain>/oauth2/default/v1/keys"
export JWT_AUDIENCE="api://default"
export DATABASE_URL="postgresql://..."
export LITELLM_LICENSE="<your-enterprise-license>"
export ANTHROPIC_API_KEY="sk-ant-..."
export LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>"
```

啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

:::tip

若要限制僅能存取您的公司網域，請在 `litellm_jwtauth` 下加入 `user_allowed_email_domain: "yourcompany.com"`。所有可用的 claim 對應與存取控制，請參閱 [JWT-based Auth](../proxy/token_auth)。

:::

## 3. 使用 token 驗證 {#3-verify-with-a-token}

取得您自己的 Okta 使用者的 access token，例如先執行第 4 步的輔助腳本一次，然後用它呼叫 proxy：

```bash
export OKTA_TOKEN="<your-okta-access-token>"

curl -X POST http://0.0.0.0:4000/v1/messages \
  -H "Authorization: Bearer $OKTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{anthropic}}",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

若回應成功，表示該 token 已通過 Okta 的 JWKS 驗證。開啟 **Internal Users** 下的 Admin UI，您會看到一個由 token 的 `sub` claim 建立的使用者，而這次請求的支出已經歸屬於該使用者。

## 4. 設定 Claude Code {#4-configure-claude-code}

Claude Code 透過 [`apiKeyHelper`](https://code.claude.com/docs/en/settings) 支援動態憑證：它會執行一個腳本來取得新的 API 金鑰，而不是使用靜態金鑰。將以下內容儲存為 `~/.claude/okta-token.sh`（請填入您的 Okta 網域與第 1 步的 Client ID）：

```bash
#!/usr/bin/env bash
set -euo pipefail

OKTA_DOMAIN="https://<your-okta-domain>"
AUTH_SERVER="default"
CLIENT_ID="<okta-app-client-id>"
SCOPES="openid profile email offline_access"
CACHE="$HOME/.claude/okta_token.json"

token_url="$OKTA_DOMAIN/oauth2/$AUTH_SERVER/v1/token"
now=$(date +%s)

if [ -f "$CACHE" ]; then
  if [ "$now" -lt "$(( $(jq -r '.expires_at // 0' "$CACHE") - 60 ))" ]; then
    jq -r '.access_token' "$CACHE"
    exit 0
  fi
  refresh=$(jq -r '.refresh_token // empty' "$CACHE")
  if [ -n "$refresh" ]; then
    if resp=$(curl -sf "$token_url" \
        -d grant_type=refresh_token \
        -d client_id="$CLIENT_ID" \
        -d refresh_token="$refresh" \
        -d scope="$SCOPES"); then
      echo "$resp" | jq --argjson now "$now" '. + {expires_at: ($now + .expires_in)}' > "$CACHE"
      chmod 600 "$CACHE"
      jq -r '.access_token' "$CACHE"
      exit 0
    fi
  fi
fi

device=$(curl -sf "$OKTA_DOMAIN/oauth2/$AUTH_SERVER/v1/device/authorize" \
  -d client_id="$CLIENT_ID" \
  -d scope="$SCOPES")
echo "Sign in with Okta: $(echo "$device" | jq -r '.verification_uri_complete')" >&2
device_code=$(echo "$device" | jq -r '.device_code')
interval=$(echo "$device" | jq -r '.interval // 5')

while true; do
  sleep "$interval"
  resp=$(curl -s "$token_url" \
    -d grant_type=urn:ietf:params:oauth:grant-type:device_code \
    -d client_id="$CLIENT_ID" \
    -d device_code="$device_code")
  if echo "$resp" | jq -e '.access_token' > /dev/null; then
    echo "$resp" | jq --argjson now "$(date +%s)" '. + {expires_at: ($now + .expires_in)}' > "$CACHE"
    chmod 600 "$CACHE"
    jq -r '.access_token' "$CACHE"
    exit 0
  fi
  err=$(echo "$resp" | jq -r '.error // empty')
  if [ "$err" != "authorization_pending" ] && [ "$err" != "slow_down" ]; then
    echo "Okta sign-in failed: $resp" >&2
    exit 1
  fi
done
```

此腳本只會將 access token 輸出到 stdout，而這正是 `apiKeyHelper` 所要求的；登入提示會輸出到 stderr。使用 `chmod +x ~/.claude/okta-token.sh` 使其可執行。

接著在 `~/.claude/settings.json` 中，將 Claude Code 指向 LiteLLM：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://litellm.yourcompany.com",
    "CLAUDE_CODE_API_KEY_HELPER_TTL_MS": "3300000"
  },
  "apiKeyHelper": "~/.claude/okta-token.sh"
}
```

`CLAUDE_CODE_API_KEY_HELPER_TTL_MS` 會控制 Claude Code 快取輔助程式輸出的時間長度；請將其設為略低於您的 Okta access token 存活時間（Okta 預設為 1 小時，因此此處為 55 分鐘）。首次啟動時，開發者會在瀏覽器中完成一次 Okta 登入，而之後每個請求都會自動帶上其身分。

## 5. 在您的組織中展開 {#5-roll-out-to-your-org}

上述內容都不需要逐一為使用者進行管理作業，因此展開只需要透過您的裝置管理工具分發兩個檔案：輔助腳本與 Claude Code 設定。若要集中強制套用這些設定，而不是依賴每位開發者的 `~/.claude/settings.json`，請將它們部署為 [managed settings](https://code.claude.com/docs/en/settings)（macOS 上為 `/Library/Application Support/ClaudeCode/managed-settings.json`，Linux 上為 `/etc/claude-code/managed-settings.json`），其優先順序較高且無法在本機覆寫。

## 選用：團隊、預算與每位使用者的金鑰 {#optional-teams-budgets-and-per-user-keys}

基本流程運作後，通常會有兩項延伸需求。若要將支出歸屬到團隊，請在您的 Okta access token 中加入 `groups` claim，並使用 `team_ids_jwt_field: "groups"` 將其對應；群組值必須與 LiteLLM 團隊 ID 相符，您可以透過 [SCIM](../tutorials/scim_litellm) 從 Okta 同步，或手動建立。若要讓每位開發者擁有自己的預算、速率限制與模型存取權，而非共用團隊設定，請搭配 `unregistered_jwt_client_behavior: "auto_register"` 使用 [JWT to Virtual Key Mapping](../proxy/jwt_key_mapping)，它會在使用者首次請求時為其佈建一把虛擬金鑰。

## 相關文件 {#related-docs}

- [JWT-based Auth](../proxy/token_auth)：所有 `litellm_jwtauth` 選項
- [JWT to Virtual Key Mapping](../proxy/jwt_key_mapping)：每位使用者的金鑰、預算與模型存取權
- [Provisioning identities and issuing keys](../proxy/identity_provisioning)：JWT 驗證、SCIM 與金鑰自動註冊如何整合
- [Claude Code Gateway (SSO sign-in)](./claude_code_gateway)：開發者透過 proxy 的 SSO 使用 `/login` 登入，無需輔助腳本
- [Claude Code Quickstart](./claude_responses_api)：Claude Code 與 LiteLLM 的基本設定
