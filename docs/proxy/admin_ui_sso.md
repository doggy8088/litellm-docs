import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ✨ 管理 UI 的 SSO {#-sso-for-admin-ui}

:::info
自 v1.76.0 起，SSO 對最多 5 位使用者免費。
:::

:::info

✨ SSO 適用於 LiteLLM Enterprise

[Enterprise 定價](https://www.litellm.ai/#pricing)

[取得免費 7 天試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

### 用法（Google、Microsoft、Okta 等） {#usage-google-microsoft-okta-etc}

<Tabs>
<TabItem value="okta" label="Okta SSO">

### 影片導覽 {#video-walkthrough}

<iframe width="100%" height="415" src="https://www.loom.com/embed/cac5be90f2714ceaa95d7f89cf4ac548" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

#### 步驟 1：在 Okta 中建立 OIDC 應用程式 {#step-1-create-an-oidc-application-in-okta}

在您的 Okta 管理主控台中，建立新的 **OIDC Web Application**。如需詳細操作說明，請參閱 [Okta 關於建立 OIDC app integrations 的指南](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm)。

設定應用程式時：
- **登入重新導向 URI**：`https://<your-proxy-base-url>/sso/callback`
- **登出重新導向 URI**（選用）：`https://<your-proxy-base-url>`

<Image img={require('../../img/okta_redirect_uri.png')} />

建立 app 後，請從應用程式的 General 分頁複製您的 **Client ID** 和 **Client Secret**：

<Image img={require('../../img/okta_client_credentials.png')} />

#### 步驟 2：將使用者指派給應用程式 {#step-2-assign-users-to-the-application}

請確認使用者已在 **Assignments** 分頁中指派到 app。如果已啟用 Federation Broker Mode，您可能需要先停用它，才能手動指派使用者。

#### 步驟 3：設定環境變數 {#step-3-set-environment-variables}

設定下列環境變數。兩個 Okta authorization server 之間唯一的差異在於端點 URL：

**Org Authorization Server**（適用於所有 Okta 方案，無需額外 SKU）：
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

#### 步驟 3a：設定 Access Policy（僅限 Custom Authorization Server） {#step-3a-configure-access-policy-custom-authorization-server-only}

如果您使用的是 Custom Authorization Server，則必須設定 Access Policy。若未設定，使用者將會收到 `no_matching_policy` 錯誤。如果您使用的是 Org Authorization Server，請略過此步驟。

1. 前往 **Security** → **API**

<Image img={require('../../img/okta_security_api.png')} />

2. 選取 **default** authorization server（或您的自訂 server）

<Image img={require('../../img/okta_authorization_server.png')} />

3. 點擊 **Access Policies** 分頁，建立一個指派給您的 LiteLLM app 的新 policy
4. 新增一條允許 **Authorization Code** grant type 的規則

<Image img={require('../../img/okta_access_policies.png')} />

更多詳細資訊請參閱 [Okta 的 Access Policy 文件](https://help.okta.com/en-us/content/topics/security/api-access-management/access-policies.htm)。

#### 步驟 4：設定 Okta 安全性設定 {#step-4-configure-okta-security-settings}

建議為 Okta 使用 **GENERIC_CLIENT_STATE** 以防止 CSRF 攻擊：

```bash
GENERIC_CLIENT_STATE="random-string"
```

**PKCE（Proof Key for Code Exchange）** — 如果您的 Okta 應用程式設定為需要 PKCE，請透過設定以下項目啟用：

```bash
GENERIC_CLIENT_USE_PKCE="true"
```

LiteLLM 會在 OAuth flow 期間自動處理 PKCE 參數的產生與驗證。

#### 步驟 5：測試 SSO flow {#step-5-test-the-sso-flow}

1. 啟動您的 LiteLLM proxy
2. 前往 `https://<your-proxy-base-url>/ui`
3. 點擊 SSO 登入按鈕
4. 使用 Okta 驗證，並確認您已重新導向回 LiteLLM

#### 疑難排解 {#troubleshooting}

| 錯誤 | 原因 | 解決方法 |
|-------|-------|----------|
| `redirect_uri` error | 未設定 Redirect URI | 在 Okta 的 Sign-in redirect URIs 中新增 `<proxy_base_url>/sso/callback` |
| `access_denied` | 使用者未指派給 app | 在 Assignments 分頁中指派該使用者 |
| `no_matching_policy` | 缺少 Access Policy（僅限 Custom Authorization Server） | 在 Authorization Server 中建立 Access Policy（請參閱步驟 3a） |

</TabItem>
<TabItem value="google" label="Google SSO">

- 在 https://console.cloud.google.com/ 上建立新的 Oauth 2.0 Client 

**您的 Proxy 上需要的 .env 變數**
```shell
# for Google SSO Login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- 在 https://console.cloud.google.com/ 上的 Oauth 2.0 Client 設定 Redirect URL 
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    https://litellm-production-7002.up.railway.app/sso/callback
    ```

</TabItem>

<TabItem value="msft" label="Microsoft SSO">

- 在 https://portal.azure.com/ 上建立新的 App Registration
- 為您的 App Registration 建立 client Secret

**您的 Proxy 上需要的 .env 變數**
```shell
MICROSOFT_CLIENT_ID="84583a4d-"
MICROSOFT_CLIENT_SECRET="nbk8Q~"
MICROSOFT_TENANT="5a39737"
```

**選用：自訂 Microsoft SSO 端點**

如果您需要使用自訂 Microsoft SSO 端點（例如自訂識別提供者、主權雲端或 proxy），您可以覆寫預設端點：

```shell
MICROSOFT_AUTHORIZATION_ENDPOINT="https://your-custom-url.com/oauth2/v2.0/authorize"
MICROSOFT_TOKEN_ENDPOINT="https://your-custom-url.com/oauth2/v2.0/token"
MICROSOFT_USERINFO_ENDPOINT="https://your-custom-graph-api.com/v1.0/me"
```

如果未設定這些值，則會依據您的 tenant 使用預設 Microsoft 端點。

- 在 https://portal.azure.com/ 上的 App Registration 設定 Redirect URI
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    http://localhost:4000/sso/callback
    ```

**使用 App Roles 設定使用者權限**

您可以直接從 Entra ID 使用 App Roles 指派使用者角色。LiteLLM 會自動從 JWT token 中讀取 app roles，並將對應的角色指派給使用者。

支援的角色：
- `proxy_admin` - 平台管理員
- `proxy_admin_viewer` - 可登入、檢視所有金鑰、檢視所有花費（唯讀）
- `internal_user` - 一般使用者。可登入、檢視花費，並依據 team-member 權限檢視／建立／刪除自己的金鑰。

設定 app roles：
1. 前往 https://portal.azure.com/ 的 App Registration
2. 進入「App roles」並建立新的 app role
3. 使用上述其中一個支援的角色名稱（例如 `proxy_admin`）
4. 在您的 Enterprise Application 中將使用者指派到這些角色
5. 使用者透過 SSO 登入時，LiteLLM 會自動指派對應的角色

**進階：自訂使用者屬性對應**

對於某些 Microsoft Entra ID 設定，您可能需要覆寫預設的使用者屬性欄位名稱。當您的組織在 SSO 回應中使用自訂 claims 或非標準屬性名稱時，這會很有用。

**步驟 1：除錯 SSO 回應**

首先，使用 [SSO 除錯路由](#debugging-sso-jwt-fields) 檢查您的 Microsoft SSO 提供者回傳的 JWT 欄位。

1. 在您的 Azure App Registration 中新增 `/sso/debug/callback` 作為重新導向 URL
2. 前往 `https://<proxy_base_url>/sso/debug/login`
3. 完成 SSO flow 以查看回傳的使用者屬性

**步驟 2：識別欄位屬性名稱**

從除錯回應中，識別 email、顯示名稱、使用者 ID、名字與姓氏所使用的欄位名稱。

**步驟 3：設定環境變數**

透過設定以下環境變數覆寫預設屬性名稱：

| 環境變數 | 說明 | 預設值 |
|---------------------|-------------|---------------|
| `MICROSOFT_USER_EMAIL_ATTRIBUTE` | 使用者 email 的欄位名稱 | `userPrincipalName` |
| `MICROSOFT_USER_DISPLAY_NAME_ATTRIBUTE` | 顯示名稱的欄位名稱 | `displayName` |
| `MICROSOFT_USER_ID_ATTRIBUTE` | 使用者 ID 的欄位名稱 | `id` |
| `MICROSOFT_USER_FIRST_NAME_ATTRIBUTE` | 名字的欄位名稱 | `givenName` |
| `MICROSOFT_USER_LAST_NAME_ATTRIBUTE` | 姓氏的欄位名稱 | `surname` |

**步驟 4：重新啟動 Proxy**

設定環境變數後，重新啟動 proxy：

```bash
litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="Generic" label="Generic SSO Provider">

可快速建立近乎無需程式碼即可支援任何 OAuth 提供者的通用 OAuth client

**您的 Proxy 上需要的 .env 變數**
```shell

GENERIC_CLIENT_ID = "******"
GENERIC_CLIENT_SECRET = "G*******"
GENERIC_AUTHORIZATION_ENDPOINT = "http://localhost:9090/auth"
GENERIC_TOKEN_ENDPOINT = "http://localhost:9090/token"
GENERIC_USERINFO_ENDPOINT = "http://localhost:9090/me"
```

**選用 .env 變數**
下列項目可用於在與通用 OAuth 提供者互動時自訂屬性名稱。我們會從 SSO Provider 結果中讀取這些屬性

```shell
GENERIC_USER_ID_ATTRIBUTE = "given_name"
GENERIC_USER_EMAIL_ATTRIBUTE = "family_name"
GENERIC_USER_DISPLAY_NAME_ATTRIBUTE = "display_name"
GENERIC_USER_FIRST_NAME_ATTRIBUTE = "first_name"
GENERIC_USER_LAST_NAME_ATTRIBUTE = "last_name"
GENERIC_USER_ROLE_ATTRIBUTE = "given_role"
GENERIC_USER_PROVIDER_ATTRIBUTE = "provider"
GENERIC_USER_EXTRA_ATTRIBUTES = "department,employee_id,manager" # comma-separated list of additional fields to extract from SSO response
GENERIC_CLIENT_STATE = "some-state" # if the provider needs a state parameter
GENERIC_INCLUDE_CLIENT_ID = "false" # some providers enforce that the client_id is not in the body
GENERIC_SCOPE = "openid profile email" # default scope openid is sometimes not enough to retrieve basic user info like first_name and last_name located in profile scope
```

**透過 SSO 指派使用者角色**

使用 `GENERIC_USER_ROLE_ATTRIBUTE` 指定 SSO token 中哪個屬性包含使用者的角色。角色值必須是下列 LiteLLM 支援角色之一：

- `proxy_admin` - 平台管理員
- `proxy_admin_viewer` - 可登入、檢視所有金鑰、檢視所有花費（唯讀）
- `internal_user` - 可登入、檢視／建立／刪除自己的金鑰、檢視自己的花費
- `internal_user_view_only` - 可登入、檢視自己的金鑰、檢視自己的花費

支援巢狀屬性路徑（例如 `claims.role` 或 `attributes.litellm_role`）。

**擷取額外的 SSO 欄位**

使用 `GENERIC_USER_EXTRA_ATTRIBUTES` 來從 SSO 提供者回應中擷取標準使用者屬性（id、email、name 等）以外的其他欄位。當您需要在您的 [自訂 SSO 處理器](./custom_sso.md) 中存取自訂的組織特定資料（例如 department、employee ID、groups）時，這會很有用。

對於 **CLI SSO**，您可以將相同（或其他）的 claims 對應到使用者 `metadata`，並透過 `CLI_SSO_CLAIM_MAP` 將純量回傳給 CLI — 請參閱 [CLI Authentication](./cli_sso.md#attribution-metadata-oidc-claims)。

```shell
# Comma-separated list of field names to extract
GENERIC_USER_EXTRA_ATTRIBUTES="department,employee_id,manager,groups"
```

**在自訂 SSO 處理器中存取額外欄位：**

```python
from litellm.proxy.management_endpoints.types import CustomOpenID

async def custom_sso_handler(userIDPInfo: CustomOpenID):
    # Access the extra fields
    extra_fields = getattr(userIDPInfo, 'extra_fields', None) or {}
    
    user_department = extra_fields.get("department")
    employee_id = extra_fields.get("employee_id")
    user_groups = extra_fields.get("groups", [])
    
    # Use these fields for custom logic (e.g., team assignment, access control)
    # ...
```

**巢狀欄位路徑：**

支援巢狀欄位的點記法：

```shell
GENERIC_USER_EXTRA_ATTRIBUTES="org_info.department,org_info.cost_center,metadata.employee_type"
```

- 如果您的提供者需要，請設定 Redirect URI
    - 設定 redirect url = `<your proxy base url>/sso/callback`
    ```shell
    http://localhost:4000/sso/callback
    ```

</TabItem>

</Tabs>

### 預設登入、登出 URL {#default-login-logout-urls}

某些 SSO 提供者需要特定的登入與登出 redirect url。您可以輸入以下值。

- Login: `<your-proxy-base-url>/sso/key/generate`
- Logout: `<your-proxy-base-url>`

以下是要在 proxy 上設定登出 url 的環境變數
```bash
PROXY_LOGOUT_URL="https://www.google.com"
```

#### 步驟 3. 在您的 .env 中設定 `PROXY_BASE_URL` {#step-3-set-proxy_base_url-in-your-env}

請將此設定於您的 .env（如此 proxy 才能設定正確的 redirect url）
```shell
PROXY_BASE_URL=https://litellm-api.up.railway.app
```

#### 步驟 4. 測試流程 {#step-4-test-flow}
<Image img={require('../../img/litellm_ui_3.gif')} />

### 限制 SSO 下的電子郵件子網域 {#restrict-email-subdomains-w-sso}

如果您使用 SSO，並且只想允許具有特定子網域的使用者——例如（@berri.ai 電子郵件帳號）——存取 UI，請這樣做：

```bash
export ALLOWED_EMAIL_DOMAINS="berri.ai"
```

這會先檢查從 SSO 收到的使用者 email 是否包含此網域，然後才允許存取。

### 設定 Proxy Admin {#set-proxy-admin}

在啟用 SSO 時設定 Proxy Admin。啟用 SSO 後，使用者的 `user_id` 會從 SSO 提供者取得。若要設定 Proxy Admin，您需要從 UI 複製 `user_id`，並將它設定到您的 `.env` 中，作為 `PROXY_ADMIN_ID`。

#### 步驟 1：從 UI 複製您的 ID  {#step-1-copy-your-id-from-the-ui}

<Image img={require('../../img/litellm_ui_copy_id.png')} />

#### 步驟 2：在您的 .env 中將其設定為 PROXY_ADMIN_ID  {#step-2-set-it-in-your-env-as-the-proxy_admin_id}

```env
export PROXY_ADMIN_ID="116544810872468347480"
```

這會將 `LiteLLM_UserTable` 中的使用者角色更新為 `proxy_admin`。 

如果您打算變更此 ID，請透過 API `/user/update` 或 UI（Internal Users 頁面）更新使用者角色。 

#### 步驟 3：查看所有 proxy keys {#step-3-see-all-proxy-keys}

<Image img={require('../../img/litellm_ui_admin.png')} />

:::info

如果您沒有看到所有 keys，這可能是因為快取的 token。只要重新登入即可恢復正常。

:::

### 在 Admin UI 上停用 `Default Team` {#disable-default-team-on-admin-ui}

如果您想在 Admin UI 上隱藏 Default Team，請使用這個設定

將套用以下邏輯
- 如果已指派 team，則不顯示 `Default Team`
- 如果未指派 team，則應該顯示 `Default Team`

在您的 litellm config.yaml 中設定 `default_team_disabled: true`

```yaml
general_settings:
  master_key: sk-1234
  default_team_disabled: true # OR you can set env var PROXY_DEFAULT_TEAM_DISABLED="true"
```

### 在 SSO 開啟時使用 Username、Password {#use-username-password-when-sso-is-on}

如果您需要在 SSO 開啟時透過 username/password 存取 UI，請前往 `/fallback/login`。此路由將允許您使用 username/password 憑證登入。

### 限制 UI 存取 {#restrict-ui-access}

您可以將 UI 存取限制為僅管理員——包含您（proxy_admin）以及您授予僅檢視存取權的人（proxy_admin_viewer），以查看 global spend。

**步驟 1. 設定 'admin_only' 存取**
```yaml
general_settings:
    ui_access_mode: "admin_only"
```

**步驟 2. 邀請僅檢視使用者**

<Image img={require('../../img/admin_ui_viewer.png')} />

### 自訂品牌 Admin UI {#custom-branding-admin-ui}

在 LiteLLM Admin UI 上使用您公司的自訂品牌識別
我們允許您：
- 自訂 UI Logo
- 自訂 UI 色彩配置
<Image img={require('../../img/litellm_custom_ai.png')} />

#### 設定自訂 Logo {#set-custom-logo}
我們允許您傳入本機圖片或您的圖片之 http/https url

在您的 env 中設定 `UI_LOGO_PATH`。我們建議使用託管圖片，這樣設定與設定 / 除錯會容易很多

託管圖片的設定範例
```shell
UI_LOGO_PATH="https://litellm-logo-aws-marketplace.s3.us-west-2.amazonaws.com/berriai-logo-github.png"
```

本機圖片的設定範例（在您的容器內）
```shell
UI_LOGO_PATH="ui_images/logo.jpg"
```

#### 或直接從 Admin UI 設定您的 logo： {#or-set-your-logo-directly-from-admin-ui}
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  <Image img={require('../../img/admin_settings_ui_theme.png')} />
  <Image img={require('../../img/admin_settings_ui_theme_logo.png')} />
</div>

#### 設定自訂色彩主題 {#set-custom-color-theme}
- 前往 [/enterprise/enterprise_ui](https://github.com/BerriAI/litellm/blob/main/enterprise/enterprise_ui/_enterprise_colors.json)
- 在 `enterprise_ui` 目錄中，將 `_enterprise_colors.json` 重新命名為 `enterprise_colors.json`
- 在 `enterprise_colors.json` 中設定您公司的自訂色彩配置
`enterprise_colors.json` 的內容範例 
將您的顏色設定為以下任一顏色：https://www.tremor.so/docs/layout/color-palette#default-colors
```json
{
    "brand": {
      "DEFAULT": "teal",
      "faint": "teal",
      "muted": "teal",
      "subtle": "teal",
      "emphasis": "teal",
      "inverted": "teal"
    }
}

```
- 部署 LiteLLM Proxy Server

## 疑難排解 {#troubleshooting-1}

### "The 'redirect_uri' parameter must be a Login redirect URI in the client app settings" 錯誤 {#the-redirect_uri-parameter-must-be-a-login-redirect-uri-in-the-client-app-settings-error}

當 redirect URI 設定不正確時，這個錯誤常見於 Okta 和其他 SSO 提供者。

#### 問題 {#issue}
```
Your request resulted in an error. The 'redirect_uri' parameter must be a Login redirect URI in the client app settings
```

#### 解決方案 {#solution}

**1. 確認您已在 .env 中設定 PROXY_BASE_URL 且包含 protocol**

請確認您的 `PROXY_BASE_URL` 包含完整的 URL 與 protocol（`http://` 或 `https://`）：

```bash
# ✅ Correct - includes https://
PROXY_BASE_URL=https://litellm.platform.com

# ✅ Correct - includes http://
PROXY_BASE_URL=http://litellm.platform.com

# ❌ Incorrect - missing protocol
PROXY_BASE_URL=litellm.platform.com
```

**2. 針對 Okta，請確認已設定 `GENERIC_CLIENT_STATE`，且如有需要已設定 PKCE**

請參閱 [Okta SSO — 步驟 4：設定 Okta 安全性設定](#step-4-configure-okta-security-settings) 以了解 `GENERIC_CLIENT_STATE` 與 PKCE 設定的詳細資訊。

### 常見設定問題 {#common-configuration-issues}

#### Base URL 中缺少 Protocol {#missing-protocol-in-base-url}
```bash
# This will cause redirect_uri errors
PROXY_BASE_URL=mydomain.com

# Fix: Add the protocol
PROXY_BASE_URL=https://mydomain.com
```

### 備援登入 {#fallback-login}

如果您需要在 SSO 開啟時透過 username/password 存取 UI，請前往 `/fallback/login`。此路由將允許您使用 username/password 憑證登入。

<Image img={require('../../img/fallback_login.png')} />

### 偵錯 SSO JWT 欄位  {#debugging-sso-jwt-fields}

如果您需要檢查 LiteLLM 從您的 SSO 提供者收到的 JWT 欄位，請依照以下說明。本指南將帶您設定一個 debug callback，以便在 SSO 流程期間檢視 JWT 資料。

<Image img={require('../../img/debug_sso.png')}  style={{ width: '500px', height: 'auto' }} />
<br />

1. 在您的 SSO 提供者中新增 `/sso/debug/callback` 作為 redirect URL 

  在您的 SSO 提供者設定中，新增以下 URL 作為新的 redirect（callback）URL：

  ```bash showLineNumbers title="Redirect URL"
  http://<proxy_base_url>/sso/debug/callback
  ```


2. 在瀏覽器中前往 debug 登入頁面 

    在您的瀏覽器中前往以下 URL：

    ```bash showLineNumbers title="URL to navigate to"
    https://<proxy_base_url>/sso/debug/login
    ```

    這將啟動標準的 SSO 流程。您將被重新導向至 SSO 提供者的登入畫面，並在成功驗證後，被重新導向回 LiteLLM 的 debug callback 路由。

3. 檢視 JWT 欄位 

重新導向後，您應該會看到名為 "SSO Debug Information" 的頁面。此頁面會顯示從您的 SSO 提供者收到的 JWT 欄位（如上圖所示）

## 進階 {#advanced}

### 透過 Azure App Roles 管理使用者角色 {#manage-user-roles-via-azure-app-roles}

在 Azure Entra ID 中定義使用者權限，以集中管理角色。使用者登入時，LiteLLM 會根據您的 Azure 設定自動指派角色——不需要在 LiteLLM 中手動管理角色。

#### 步驟 1：在 Azure App Registration 上建立 App Roles {#step-1-create-app-roles-on-azure-app-registration}

1. 前往您在 https://portal.azure.com/ 上的 App Registration
2. 前往 **App roles** > **Create app role**
3. 使用 [支援的 LiteLLM 角色](./access_control.md#global-proxy-roles) 之一來設定 app role：
   - **Display name**：Admin Viewer（或您偏好的顯示名稱）
   - **Value**：`proxy_admin_viewer`（必須與其中一個 LiteLLM role value 完全一致）
4. 點擊 **Apply** 以儲存角色
5. 對您要使用的每個 LiteLLM 角色重複上述步驟

**支援的 LiteLLM role values**（請參閱 [完整角色文件](./access_control.md#global-proxy-roles)）：
- `proxy_admin` - 完整管理員存取權
- `proxy_admin_viewer` - 唯讀管理員存取權
- `internal_user` - 可建立／檢視／刪除自己的 keys
- `internal_user_viewer` - 可檢視自己的 keys（唯讀）

<Image img={require('../../img/app_roles.png')} style={{ width: '900px', height: 'auto' }} />

---

#### 步驟 2：將使用者指派給應用程式角色 {#step-2-assign-users-to-app-roles}

1. 前往 https://portal.azure.com/ 的 **Enterprise Applications**
2. 選取您的 LiteLLM 應用程式
3. 前往 **Users and groups** > **Add user/group**
4. 選取使用者
5. 在 **Select a role** 下，選擇您建立的應用程式角色（例如，`proxy_admin_viewer`）
6. 點擊 **Assign** 以儲存

<Image img={require('../../img/app_role2.png')} style={{ width: '900px', height: 'auto' }} />

---

#### 步驟 3：登入並驗證 {#step-3-sign-in-and-verify}

1. 透過 SSO 登入 LiteLLM UI
2. LiteLLM 會自動從 JWT token 擷取應用程式角色
3. 使用者將被指派對應的角色（您可以在 UI 中透過檢查使用者個人資料下拉選單來驗證）

<Image img={require('../../img/app_role3.png')} style={{ width: '900px', height: 'auto' }} />

**注意：** 來自 Entra ID 的角色將優先於 LiteLLM 資料庫中的任何現有角色。這可確保您的 SSO 提供者是使用者角色的權威來源。
