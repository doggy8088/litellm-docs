import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# OpenID Connect (OIDC) SSO {#openid-connect-oidc-sso}

使用 OpenID Connect (OIDC) 登入 Admin UI；OIDC 是建立在 OAuth 2.0 之上的身分層。若是 SAML 提供者，請使用 [SAML SSO](./saml_sso.md)。

<EnterpriseFeature feature="SSO">從 v1.76.0 起，SSO 對最多 5 位使用者免費。超過此人數需要企業授權。</EnterpriseFeature>

## 運作方式 {#how-it-works}

Admin UI 會將使用者重新導向到您的身分提供者。登入後，LiteLLM 會在 `/sso/callback` 收到提供者的回應，識別使用者，並啟動他們的 UI 工作階段。角色、團隊成員資格與登入限制請在 [SSO 權限](./access_management/sso_permissions.md)中設定。

## 必要條件 {#prerequisites}

- 一個正在執行且具有主金鑰與資料庫連線的 LiteLLM proxy。
- 一個已向您的身分提供者註冊的應用程式，附有 client ID 與 secret。
- 公開的 proxy URL，包含 `https://`（本機開發則為 `http://`）。

<a id="step-3-set-proxy_base_url-in-your-env"></a>

設定 base URL，讓 LiteLLM 產生正確的 callback URL：

```bash
PROXY_BASE_URL="https://litellm.yourcompany.com"
```

## 設定 {#setup}

<a id="usage-google-microsoft-okta-etc"></a>

選擇您的提供者，並將 `<PROXY_BASE_URL>/sso/callback` 註冊為其登入重新導向 URI。

<Tabs>
<TabItem value="okta" label="Okta SSO">

#### 影片操作指南 {#video-walkthrough}

<iframe width="100%" height="415" src="https://www.loom.com/embed/cac5be90f2714ceaa95d7f89cf4ac548" frameBorder="0" allowFullScreen></iframe>

#### 步驟 1：在 Okta 中建立 OIDC 應用程式 {#step-1-create-an-oidc-application-in-okta}

在您的 Okta Admin Console 中，建立一個新的 **OIDC Web Application**。詳細說明請參閱 [Okta 的 OIDC 應用程式整合建立指南](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm)。

設定應用程式時：
- **Sign-in redirect URI**：`https://<your-proxy-base-url>/sso/callback`
- **Sign-out redirect URI**（選填）：`https://<your-proxy-base-url>`

<Image img={require('../../img/okta_redirect_uri.png')} />

建立應用程式後，從應用程式的 General 分頁複製您的 **Client ID** 與 **Client Secret**：

<Image img={require('../../img/okta_client_credentials.png')} />

#### 步驟 2：將使用者指派給應用程式 {#step-2-assign-users-to-the-application}

確保使用者已在 **Assignments** 分頁中被指派給該應用程式。若啟用了 Federation Broker Mode，您可能需要先將其停用，才能手動指派使用者。

#### 步驟 3：設定環境變數 {#step-3-set-environment-variables}

設定下列環境變數。兩個 Okta 授權伺服器之間唯一的差異是端點 URL：

**Org Authorization Server**（所有 Okta 方案皆可使用，不需要額外的 SKU）：
```bash
GENERIC_CLIENT_ID="<your-client-id>"
GENERIC_CLIENT_SECRET="<your-client-secret>"
GENERIC_AUTHORIZATION_ENDPOINT="https://<your-okta-domain>/oauth2/v1/authorize"
GENERIC_TOKEN_ENDPOINT="https://<your-okta-domain>/oauth2/v1/token"
GENERIC_USERINFO_ENDPOINT="https://<your-okta-domain>/oauth2/v1/userinfo"
PROXY_BASE_URL="https://<your-proxy-base-url>"
```

**Custom Authorization Server**（需要 Okta API Access Management SKU）：
```bash
GENERIC_CLIENT_ID="<your-client-id>"
GENERIC_CLIENT_SECRET="<your-client-secret>"
GENERIC_AUTHORIZATION_ENDPOINT="https://<your-okta-domain>/oauth2/default/v1/authorize"
GENERIC_TOKEN_ENDPOINT="https://<your-okta-domain>/oauth2/default/v1/token"
GENERIC_USERINFO_ENDPOINT="https://<your-okta-domain>/oauth2/default/v1/userinfo"
PROXY_BASE_URL="https://<your-proxy-base-url>"
```

:::tip
您可以在 `https://<your-okta-domain>/.well-known/openid-configuration` 找到所有 OAuth 端點
:::

#### 步驟 3a：設定存取政策（僅限 Custom Authorization Server）{#step-3a-configure-access-policy-custom-authorization-server-only} {#step-3a-configure-access-policy-custom-authorization-server-only}

若您使用的是 Custom Authorization Server，您必須設定 Access Policy。沒有它，使用者會收到 `no_matching_policy` 錯誤。若您使用的是 Org Authorization Server，請略過此步驟。

1. 前往 **Security** → **API**

<Image img={require('../../img/okta_security_api.png')} />

2. 選取 **default** 授權伺服器（或您的自訂伺服器）

<Image img={require('../../img/okta_authorization_server.png')} />

3. 按一下 **Access Policies** 分頁，建立一個指派給您的 LiteLLM 應用程式的新政策
4. 新增一條允許 **Authorization Code** 授權類型的規則

<Image img={require('../../img/okta_access_policies.png')} />

更多詳細資訊請參閱 [Okta 的 Access Policy 文件](https://help.okta.com/en-us/content/topics/security/api-access-management/access-policies.htm)。

state 與 PKCE 設定請參閱 [Okta 安全性設定](#step-4-configure-okta-security-settings)。

</TabItem>
<TabItem value="google" label="Google SSO">

- 在 [Google Cloud Console](https://console.cloud.google.com/)上建立新的 Oauth 2.0 Client

**您的 Proxy 上必要的 .env 變數**
```shell
# for Google SSO Login
GOOGLE_CLIENT_ID="<client-id>"
GOOGLE_CLIENT_SECRET="<client-secret>"
```

- 在 [Google Cloud Console](https://console.cloud.google.com/)上為您的 Oauth 2.0 Client 設定 Redirect URL
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    https://litellm-production-7002.up.railway.app/sso/callback
    ```

</TabItem>

<TabItem value="msft" label="Microsoft SSO">

- 在 [Azure 入口網站](https://portal.azure.com/)上建立新的 App Registration
- 為您的 App Registration 建立 client Secret

**您的 Proxy 上必要的 .env 變數**
```shell
MICROSOFT_CLIENT_ID="<client-id>"
MICROSOFT_CLIENT_SECRET="<client-secret>"
MICROSOFT_TENANT="<tenant-id>"
```

自訂端點請參閱 [Microsoft 端點覆寫](#microsoft-endpoint-overrides)。

- 在 [Azure 入口網站](https://portal.azure.com/)上為您的 App Registration 設定 Redirect URI
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    http://localhost:4000/sso/callback
    ```

若要從 Entra ID 指派 LiteLLM 角色，請依照[透過 Microsoft Entra ID 指派角色](./access_management/sso_permissions.md#manage-user-roles-via-azure-app-roles)。

非標準使用者欄位請參閱 [Microsoft 身分屬性](#microsoft-identity-attributes)。

</TabItem>

<TabItem value="Generic" label="Generic SSO Provider">

設定一個 OIDC 提供者，包含其 authorization、token 與 UserInfo 端點。

**您的 Proxy 上必要的 .env 變數**
```shell

GENERIC_CLIENT_ID="<client-id>"
GENERIC_CLIENT_SECRET="<client-secret>"
GENERIC_AUTHORIZATION_ENDPOINT="http://localhost:9090/auth"
GENERIC_TOKEN_ENDPOINT="http://localhost:9090/token"
GENERIC_USERINFO_ENDPOINT="http://localhost:9090/me"
```

使用[通用提供者選項](#generic-provider-options)設定穩定的使用者識別碼與任何額外的回應欄位。

- 若您的提供者需要，設定 Redirect URI
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    http://localhost:4000/sso/callback
    ```

</TabItem>

</Tabs>

## 測試登入 {#test-sign-in}

<a id="step-5-test-the-sso-flow"></a>
<a id="step-4-test-flow"></a>

1. 使用您現有的設定啟動或重新啟動 proxy：

   ```bash
   litellm --config /path/to/config.yaml
   ```

2. 開啟 `https://<your-proxy-base-url>/ui` 並按一下 **SSO**。
3. 使用已指派給身分提供者應用程式的使用者登入。確認您回到了 Admin UI。

<Image img={require('../../img/litellm_ui_3.gif')} />

## 設定參考 {#configuration-reference}

### 預設的登入、登出 URL {#default-login-logout-urls}

| 端點 | URL |
| --- | --- |
| 開始登入 | `<PROXY_BASE_URL>/sso/key/generate` |
| 登入 callback | `<PROXY_BASE_URL>/sso/callback` |
| 預設登出目的地 | `<PROXY_BASE_URL>` |

當您的提供者需要其他 URL 時，覆寫登出目的地：

```bash
PROXY_LOGOUT_URL="https://www.google.com"
```

### Okta 安全性設定 {#step-4-configure-okta-security-settings}

不要設定 `GENERIC_CLIENT_STATE`。LiteLLM 會為每次 UI 登入產生隨機的 state。在 `GENERIC_CLIENT_USE_PKCE=true` 的情況下，固定的 state 會讓同時發生的登入互相覆寫對方的 PKCE verifier 而失敗。

**PKCE (Proof Key for Code Exchange)。**若您的 Okta 應用程式設定為需要 PKCE，請透過以下設定啟用它：

```bash
GENERIC_CLIENT_USE_PKCE="true"
```

LiteLLM 會在 OAuth 流程中自動處理 PKCE 參數的產生與驗證。

### Microsoft 端點覆寫 {#microsoft-endpoint-overrides}

若您需要使用自訂的 Microsoft SSO 端點（例如用於自訂身分提供者、主權雲或 proxy），您可以覆寫預設端點：

```shell
MICROSOFT_AUTHORIZATION_ENDPOINT="https://your-custom-url.com/oauth2/v2.0/authorize"
MICROSOFT_TOKEN_ENDPOINT="https://your-custom-url.com/oauth2/v2.0/token"
MICROSOFT_USERINFO_ENDPOINT="https://your-custom-graph-api.com/v1.0/me"
```

若未設定這些值，會依您的 tenant 使用預設的 Microsoft 端點。

### Microsoft 身分屬性 {#microsoft-identity-attributes}

使用 [SSO 偵錯流程](#debugging-sso-jwt-fields)檢查您的提供者回應，然後覆寫任何非標準使用者欄位並重新啟動 proxy。

| 環境變數 | 說明 | 預設值 |
|---------------------|-------------|---------------|
| `MICROSOFT_USER_EMAIL_ATTRIBUTE` | 使用者電子郵件的欄位名稱 | `userPrincipalName` |
| `MICROSOFT_USER_DISPLAY_NAME_ATTRIBUTE` | 顯示名稱的欄位名稱 | `displayName` |
| `MICROSOFT_USER_ID_ATTRIBUTE` | 使用者 ID 的欄位名稱 | `id` |
| `MICROSOFT_USER_FIRST_NAME_ATTRIBUTE` | 名字的欄位名稱 | `givenName` |
| `MICROSOFT_USER_LAST_NAME_ATTRIBUTE` | 姓氏的欄位名稱 | `surname` |

### 通用提供者選項 {#generic-provider-options}

自訂從您的提供者讀取的使用者屬性與通訊協定設定：

```shell
GENERIC_USER_ID_ATTRIBUTE="sub"
GENERIC_USER_EMAIL_ATTRIBUTE="email"
GENERIC_USER_DISPLAY_NAME_ATTRIBUTE="display_name"
GENERIC_USER_FIRST_NAME_ATTRIBUTE="first_name"
GENERIC_USER_LAST_NAME_ATTRIBUTE="last_name"
GENERIC_USER_PROVIDER_ATTRIBUTE="provider"
GENERIC_USER_EXTRA_ATTRIBUTES="department,employee_id,manager" # comma-separated list of additional fields to extract from SSO response
GENERIC_INCLUDE_CLIENT_ID="false" # some providers enforce that the client_id is not in the body
GENERIC_SCOPE="openid profile email" # default scope openid is sometimes not enough to retrieve basic user info like first_name and last_name located in profile scope
```

設定 `GENERIC_INCLUDE_TOKEN_CLAIMS="true"`，即可在 UserInfo 回應不完整時，也從 ID token 與 access token 讀取使用者 claims。UserInfo claims 優先。

**選擇 `GENERIC_USER_ID_ATTRIBUTE`**

LiteLLM 會將此屬性的值儲存為使用者的身分，並在之後每次登入時以它查詢使用者，因此請將它指向您的提供者保證唯一且在帳號存續期間永不變更的 claim。`sub` 是用於此目的的標準 OIDC claim。使用者可以在自己的個人資料中編輯的 claims，例如 `preferred_username`、`email` 或 `name`，會在 LiteLLM 不知情的情況下變更，下一次登入就會被視為不同的人，擁有另一組金鑰、團隊與支出。當 `GENERIC_USER_ID_ATTRIBUTE` 未設定時，LiteLLM 會讀取 `preferred_username`，因此若您的提供者允許使用者變更該值，請明確設定它。

角色指派請參閱[通用 OIDC 角色對應](./access_management/sso_permissions.md#assign-roles-through-a-generic-oidc-provider)。

**擷取額外的 SSO 欄位**

使用 `GENERIC_USER_EXTRA_ATTRIBUTES` 從 SSO 提供者回應中擷取標準使用者屬性（id、email、name 等）之外的額外欄位。當您需要在[自訂 SSO 處理常式](./custom_sso.md)中存取組織專屬的自訂資料（例如部門、員工 ID、群組）時，這很有用。

```shell
# Comma-separated list of field names to extract
GENERIC_USER_EXTRA_ATTRIBUTES="department,employee_id,manager,groups"
```

在您的[自訂 SSO callback](./custom_sso.md#read-additional-provider-fields) 中，透過 `userIDPInfo.extra_fields` 讀取這些值。

**巢狀欄位路徑：**

巢狀欄位支援點記法：

```shell
GENERIC_USER_EXTRA_ATTRIBUTES="org_info.department,org_info.cost_center,metadata.employee_type"
```

## 疑難排解 {#troubleshooting}

### Redirect URI 錯誤 {#redirect-uri-errors}

<a id="the-redirect_uri-parameter-must-be-a-login-redirect-uri-in-the-client-app-settings-error"></a>
<a id="common-configuration-issues"></a>
<a id="missing-protocol-in-base-url"></a>
<a id="issue"></a>
<a id="solution"></a>

若提供者回報 `redirect_uri` 不是已註冊的登入 URI，請確認以下兩個設定相符：

- `PROXY_BASE_URL` 包含通訊協定，例如 `https://litellm.yourcompany.com`。
- 提供者註冊的 redirect URI 恰好是 `<PROXY_BASE_URL>/sso/callback`。

### Okta 錯誤 {#okta-errors}

| 錯誤 | 原因 | 解決方式 |
|-------|-------|----------|
| `redirect_uri` error | Redirect URI 未設定 | 在 Okta 中將 `<proxy_base_url>/sso/callback` 加入 Sign-in redirect URIs |
| `access_denied` | 使用者未被指派給應用程式 | 在 Assignments 分頁中指派使用者 |
| `no_matching_policy` | 缺少 Access Policy（僅限 Custom Authorization Server） | 在 Authorization Server 中建立 Access Policy（見步驟 3a） |


### 備援登入 {#fallback-login}

<a id="use-username-password-when-sso-is-on"></a>

在 SSO 啟用時，開啟 `/fallback/login` 即可使用使用者名稱與密碼登入。即使 `disable_env_credential_login` 已開啟，這對具有密碼的資料庫使用者也有效。請參閱[為 SSO 中斷保留緊急管理員帳號](./ui.md#keep-a-break-glass-admin-account-for-sso-outages)。

<Image img={require('../../img/fallback_login.png')} />

### 偵錯 SSO JWT 欄位 {#debugging-sso-jwt-fields}

1. 設定 `ENABLE_SSO_DEBUG="true"` 並重新啟動 proxy。此功能停用時，偵錯路由會傳回 404。
2. 在您的提供者處將 `<PROXY_BASE_URL>/sso/debug/callback` 註冊為額外的 redirect URI。
3. 開啟 `<PROXY_BASE_URL>/sso/debug/login` 並完成登入。
4. 在 **SSO Debug Information** 頁面上檢查傳回的欄位，完成後取消設定 `ENABLE_SSO_DEBUG`。

<Image img={require('../../img/debug_sso.png')} style={{ width: '500px', height: 'auto' }} />

## 相關指南 {#related-guides}

<a id="manage-sso-permissions"></a>
<a id="custom-branding-admin-ui"></a>
<a id="set-custom-logo"></a>
<a id="or-set-your-logo-directly-from-admin-ui"></a>
<a id="set-custom-color-theme"></a>

- [SSO 權限](./access_management/sso_permissions.md)：登入限制、角色、團隊成員資格與金鑰建立。
- [CLI 登入](./cli_sso.md)：從命令列用戶端登入。
- [自訂 SSO](./custom_sso.md)：自訂登入整合。
- [自訂 UI 品牌](./ui/ui_edit_logo.md)：標誌與 favicon。
