---
sidebar_label: OAuth 2.0 提供者設定
---

# OAuth 2.0 提供者設定 {#oauth-20-provider-setup}

<EnterpriseFeature feature="OAuth 2.0 authentication" />

將您的身分提供者的 token-info 或 introspection 端點連接到 LiteLLM，然後將其回應對應到 LiteLLM 使用者與團隊。

## 運作方式 {#how-it-works}

用戶端將提供者的存取權杖作為 bearer token 傳送。LiteLLM 會呼叫已設定的端點來檢查它，並識別呼叫端。

權杖可以是 JWT 或不透明權杖，也可以代表使用者或應用程式。對於公開簽署金鑰的提供者，請參閱[身分提供者設定](./token_auth.md)。若要設定 Admin UI 登入，請參閱 [OpenID Connect (OIDC) SSO](./admin_ui_sso.md) 或 [SAML SSO](./saml_sso.md)。

提供者驗證適用於 LLM API、info 與 Lens 路由。它不會取代管理路由上的管理驗證。

## 必要條件 {#prerequisites}

請使用已設定模型的可用 proxy；下方的測試使用 `my-model`。請取得 proxy 可以連線的 token-info 或 introspection 端點。若是 introspection，還需要取得允許 LiteLLM 呼叫該端點的用戶端憑證。

請選擇提供者的回應如何對應到 LiteLLM 使用者與團隊。請透過[存取管理](./access_management/overview.md) 設定他們的資源權限。

## 設定 {#usage}

### 步驟 1. 設定驗證端點 {#step-1-configure-the-validation-endpoint}

對於接受帶 bearer token 之 GET 請求的 token-info 端點，請設定其 URL。

```bash
export OAUTH_TOKEN_INFO_ENDPOINT="https://idp.example.com/token/info"
```

若是 introspection 端點，還需要設定 LiteLLM 用來向其驗證的用戶端憑證。

```bash
export OAUTH_TOKEN_INFO_ENDPOINT="https://idp.example.com/oauth2/introspect"
export OAUTH_CLIENT_ID="<introspection-client-id>"
export OAUTH_CLIENT_SECRET="<introspection-client-secret>"
```

當端點 URL 包含 `introspect` 且兩個用戶端憑證都已設定時，LiteLLM 會以 HTTP Basic 用戶端驗證，傳送包含 `token` 的 form-encoded POST。否則，它會傳送帶 `Authorization: Bearer <access-token>` 的 GET。請使用與所選請求格式相容的端點。

### 步驟 2. 對應提供者的回應 {#step-2-map-the-providers-response}

LiteLLM 會讀取這些頂層回應欄位。如果您的提供者使用不同的名稱，請變更環境變數。

| 環境變數 | 預設回應欄位 | 意義 |
| --- | --- | --- |
| `OAUTH_USER_ID_FIELD_NAME` | `sub` | LiteLLM 使用者 ID。 |
| `OAUTH_USER_ROLE_FIELD_NAME` | `role` | LiteLLM 角色，例如 `internal_user`。 |
| `OAUTH_USER_TEAM_ID_FIELD_NAME` | `team_id` | LiteLLM 團隊 ID。 |

例如，成功的回應可以包含下列欄位。Introspection 回應還應該回報權杖是否處於啟用狀態。

```json
{
  "active": true,
  "sub": "user-123",
  "role": "internal_user",
  "team_id": "engineering"
}
```

這些欄位會被直接讀取，不做巢狀 claim 或角色名稱轉換。請設定提供者回傳您打算使用的 LiteLLM ID 與角色。

### 步驟 3. 啟用提供者驗證 {#step-3-enable-oauth2-and-make-a-request}

將 OAuth2 驗證加入您現有的 proxy 設定。請保留您已設定的 `model_list`。

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_oauth2_auth: true
```

## 測試驗證 {#test-authentication}

從您的提供者取得存取權杖，然後呼叫 proxy 上已設定的模型。請將 `my-model` 換成它的 `model_name`。

```bash
export ACCESS_TOKEN="<provider-access-token>"

curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

請確認請求在使用有效權杖與預期身分時成功。提供者 HTTP 錯誤與未啟用的 introspection 回應會拒絕請求。

## 設定參考 {#configuration-reference}

### 合併提供者與 JWT 驗證 {#using-oauth2--jwt-together}

| 設定 | 傳送至提供者驗證的權杖 |
| --- | --- |
| 已啟用 OAuth2、已停用 JWT 驗證 | 涵蓋路由上的所有 bearer token。 |
| 已啟用 OAuth2 與 JWT 驗證 | 非 JWT 權杖，加上符合路由覆寫的 JWT。其他 JWT 使用 JWT 驗證。 |
| 已啟用 JWT 驗證、已停用 OAuth2 | 只有符合路由覆寫的 JWT。其他 JWT 使用 JWT 驗證。 |

### 將選定的 JWT 路由至您的提供者 {#route-jwt-shaped-machine-tokens-to-oauth2}

使用 `routing_overrides` 將選定的 JWT 形式權杖傳送至 OAuth2 端點。請依照上方步驟設定端點與回應欄位，並同時設定您的 [JWT 提供者設定](./token_auth.md)。

```yaml
general_settings:
  enable_jwt_auth: true
  enable_oauth2_auth: false
  litellm_jwtauth:
    routing_overrides:
      - iss: "https://machine-idp.example.com"
        client_id: "*LITELLM"
        scope: "App:LiteLLM"
        path: oauth2
```

此規則會將來自指定發行者、用戶端 ID 以 `LITELLM` 結尾，且具有 `App:LiteLLM` scope 的權杖路由至 OAuth2。如果非 JWT 權杖也應該使用提供者驗證，請同時設定 `enable_oauth2_auth: true`。

### 比對行為 {#matching-behavior}

| 規則 | 行為 |
| --- | --- |
| 支援的選取器 | `iss` 為必填。`client_id`、`scope` 與 `aud` 為選用。`path` 為 `oauth2`。 |
| 多個選取器 | 每個已設定的選取器都必須相符。缺少必要的 claim 會導致比對失敗。 |
| 多條規則 | 任何相符的規則都會選用 OAuth2。 |
| 字串或清單 | 每個選取器接受字串或清單。任何選取器值都可以與清單型 claim 中的任何值相符。 |
| 萬用字元 | `*` 與 `?` 使用區分大小寫的比對。非 scope 的萬用字元比對會拒絕包含空白的 claim 字串。 |
| Scope 字串 | 以空格分隔的 `scope` 會在比對前拆成個別 scope。`iss`、`aud` 與 `client_id` 字串永遠不會被拆分。 |
| 沒有相符規則 | 繼續使用標準 JWT 驗證。 |

例如，此規則接受任一發行者、任一用戶端 ID 與任一 audience。

```yaml
routing_overrides:
  - iss: ["https://machine-idp.example.com", "https://backup-idp.example.com"]
    client_id: ["LITELLM", "LITELLM_BACKUP"]
    aud: ["api://litellm", "api://fallback"]
    path: oauth2
```

請將 `routing_overrides` 放在 `general_settings.litellm_jwtauth` 下。路由只會讀取未驗證的 claims 來選擇驗證器。相符的規則並不會驗證呼叫端。已設定的提供者仍必須驗證權杖。

<a id="debugging"></a>

## 疑難排解 {#troubleshooting}

請檢查端點 URL、它需要的 HTTP 方法、用戶端憑證，以及已設定的回應欄位名稱。提供者 HTTP 錯誤與未啟用的 introspection 回應會拒絕請求。兩種驗證方法都啟用時，也請檢查 JWT 是否符合路由覆寫。

若要取得更多診斷資訊，請以 [`--detailed_debug`](./cli.md#--detailed_debug) 啟動 proxy。

## 相關指南 {#related-guides}

使用[身分提供者設定](./token_auth.md) 進行帶簽署金鑰的 JWT 驗證。使用 [OpenID Connect](./admin_ui_sso.md) 或 [SAML](./saml_sso.md) 設定瀏覽器登入，並透過[存取管理](./access_management/overview.md) 設定資源權限。
