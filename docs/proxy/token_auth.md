# 身分提供者設定 {#identity-provider-setup}

連接您的身分提供者，讓用戶端可以使用其 JWT 存取 token 呼叫 LiteLLM。

<EnterpriseFeature feature="JWT-based Auth" />

## 運作方式 {#how-it-works}

LiteLLM 會使用提供者的簽署金鑰驗證 token 的簽章、發行者與對象，然後將其宣告對應到使用者、團隊或 Virtual Key。此 token 可以識別使用者、應用程式，或如 Kubernetes pod 等工作負載。

如果您的提供者需要 token-info 或內省端點，請使用 [OAuth 2.0 提供者設定](./oauth2.md)。若是 Admin UI 登入，請使用 [OpenID Connect (OIDC) SSO](./admin_ui_sso.md) 或 [SAML SSO](./saml_sso.md)。

## 必要條件 {#prerequisites}

請使用已設定好模型與資料庫且可運作的 proxy。取得提供者的 JWKS 或 OIDC 探索 URL，並將其設定為針對 LiteLLM 的對象發行 token。下方測試使用一個名為 `my-model` 的已設定模型。

<a id="choose-a-flow"></a>

選擇 token 識別呼叫者的方式：

| 您想做的事 | 指南 |
| --- | --- |
| 從 token 宣告識別使用者與團隊 | [將身分對應到使用者與團隊](./jwt_user_team_auth.md) |
| 將 JWT 呼叫者解析為 Virtual Key | [將身分對應到 Virtual Key](./jwt_key_mapping.md) |
| 使用 Kubernetes ServiceAccount token 驗證 pod | [驗證 Kubernetes 工作負載](./jwt_auth_reference.md#kubernetes-serviceaccount-authentication) |

在進行宣告對應流程之前，請先完成下方的提供者設定。請在[存取管理](./access_management/overview.md)中設定對應身分的權限。

<a id="connect-your-identity-provider"></a>

## 設定 {#usage}

### 1. 設定提供者、發行者與對象 {#1-set-the-provider-issuer-and-audience}

使用提供者的 JWKS 端點或其 OIDC 探索 URL。探索 URL 以 `/.well-known/openid-configuration` 結尾；LiteLLM 會依其 `jwks_uri` 取得簽署金鑰。

```bash
export JWT_PUBLIC_KEY_URL="https://keycloak.example.com/realms/my-realm/.well-known/openid-configuration"
export JWT_ISSUER="https://keycloak.example.com/realms/my-realm"
export JWT_AUDIENCE="litellm-proxy"
```

`JWT_ISSUER` 必須與 token 的 `iss` 宣告完全相符。`JWT_AUDIENCE` 必須與 token 的 `aud` 宣告相符，或在 `aud` 為清單時與其中一個值相符。請將您的身分提供者設定為針對該對象發行存取 token。

您也可以改在 `config.yaml` 中、於 `litellm_jwtauth` 下設定簽署金鑰與對象 <SinceVersion v="1.112.0" />。在其中設定的每個值優先於其環境變數，且可以是 `os.environ/` 參照。任一值為空，或是參照到未設定變數的 `os.environ/` 參照時，代理會拒絕啟動。

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    public_key_url: https://login.microsoftonline.com/<tenant_id>/discovery/v2.0/keys
    audience: <client_id>
```

:::important

當 `JWT_ISSUER` 未設定，或 `JWT_AUDIENCE` 與 `litellm_jwtauth.audience` 皆未設定時，發行者與對象驗證會分別停用。請兩者都設定，讓僅有有效簽章不足以驗證為其他應用程式發行的 token。

:::

若有多個身分提供者，請使用[依發行者設定](./jwt_auth_reference.md#per-issuer-claim-mapping)，為每個提供者設定專屬的簽署金鑰、對象與宣告對應。

### 2. 啟用 JWT 驗證 {#2-enable-jwt-authentication}

將 `enable_jwt_auth` 加入您的 proxy 設定。請保留您現有的模型與資料庫設定。

```yaml title="config.yaml"
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  enable_jwt_auth: true
```

### 3. 對應身分 {#3-map-the-identity}

設定[使用者與團隊宣告](./jwt_user_team_auth.md)或 [Virtual Key 對應](./jwt_key_mapping.md)。在測試之前，請先完成對應身分的[存取設定](./access_management/overview.md)。

<a id="3-send-the-access-token"></a>

## 測試驗證 {#test-authentication}

完成您選擇的流程後，從您的身分提供者或工作負載平台取得 token，並將其作為 bearer token 傳送。OAuth 應用程式使用提供者支援的授權類型：委派存取使用使用者登入流程，機器對機器存取使用 client credentials。Kubernetes 工作負載使用其投影的 ServiceAccount token。

```bash
curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "my-model",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

請將 `my-model` 換成您的 proxy 設定中呼叫者可存取的模型名稱。

<a id="configuration-and-troubleshooting"></a>

## 設定參考 {#configuration-reference}

| 設定 | 用途 |
| --- | --- |
| `JWT_PUBLIC_KEY_URL` | 提供者的 JWKS 端點或 OIDC 探索 URL。 |
| `JWT_ISSUER` | 預期的 `iss` 宣告。未設定時會停用發行者檢查。 |
| `JWT_AUDIENCE` | 預期的 `aud` 宣告或其其中一個值。未設定時會停用對象檢查。 |
| `general_settings.litellm_jwtauth.public_key_url` | 與 `JWT_PUBLIC_KEY_URL` 相同，兩者皆設定時會改用此值。 |
| `general_settings.litellm_jwtauth.audience` | 與 `JWT_AUDIENCE` 相同，兩者皆設定時會改用此值。 |
| `general_settings.enable_jwt_auth` | 啟用 JWT 驗證。 |

多個提供者、支援的 token、身分宣告對應與金鑰快取，請參閱 [JWT 設定參考](./jwt_auth_reference.md)。

## 疑難排解 {#troubleshooting}

簽章、發行者、對象或簽署金鑰錯誤，請使用 [JWT 疑難排解](./jwt_auth_reference.md#troubleshooting)。請確認提供者發行的是預期的 token，且 proxy 可以取得其簽署金鑰。

如果 token 解析為預期的身分，但資源請求遭到拒絕，請檢查 [JWT 權限](./access_management/jwt_permissions.md#troubleshooting)。

## 相關指南 {#related-guides}

<a id="jwt-to-virtual-key-mapping"></a>
<a id="beta-jwt-to-virtual-key-mapping"></a>

JWT 到 virtual key 的設定與管理現已移至[將身分對應到 Virtual Key](./jwt_key_mapping.md)。

<a id="oidc-userinfo-endpoint"></a>
<a id="route-jwt-shaped-machine-tokens-to-oauth2"></a>

Token-info 端點、內省與機器 token 的路由，請參閱 [OAuth 2.0 提供者設定](./oauth2.md)。
