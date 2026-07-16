import Image from '@theme/IdealImage';


# LiteLLM 的 SCIM {#scim-with-litellm}

✨ **企業版**：SCIM 支援需要進階授權。

可讓身分識別提供者（Okta、Azure AD、OneLogin 等）在 LiteLLM 上自動化使用者與團隊（群組）的佈建、更新與取消佈建。

本教學將逐步引導您將您的 IDP 連接到 LiteLLM SCIM 端點。

### SCIM 支援的 SSO 提供者 {#supported-sso-providers-for-scim}
以下是可用於連接 LiteLLM SCIM 端點的支援 SSO 提供者清單。
- Microsoft Entra ID (Azure AD)
- Okta
- Google Workspace
- OneLogin
- Keycloak
- Auth0

## 1. 取得您的 SCIM Tenant URL 與 Bearer Token {#1-get-your-scim-tenant-url-and-bearer-token}

在 LiteLLM 中，前往 Settings > Admin Settings > SCIM。您會在此頁面建立一個 SCIM Token，這可讓您的 IDP 對 litellm `/scim` 端點進行驗證。

<Image img={require('../../img/scim_2.png')}  style={{ width: '800px', height: 'auto' }} />

## 2. 將您的 IDP 連接到 LiteLLM SCIM 端點 {#2-connect-your-idp-to-litellm-scim-endpoints}

在您的 IDP 提供者中，前往您的 SSO 應用程式，並選擇 `Provisioning` > `New provisioning configuration`。

在此頁面中，貼上您的 litellm scim tenant url 與 bearer token。

貼上後，點擊 `Test Connection`，以確保您的 IDP 能對 LiteLLM SCIM 端點進行驗證。

<Image img={require('../../img/scim_4.png')}  style={{ width: '800px', height: 'auto' }} />

## 3. 測試 SCIM 連線 {#3-test-scim-connection}

### 3.1 將群組指派給您的 LiteLLM 企業版應用程式 {#31-assign-the-group-to-your-litellm-enterprise-app}

在您的 IDP 入口網站中，前往 `Enterprise Applications` > 選取您的 litellm 應用程式 

<Image img={require('../../img/msft_enterprise_app.png')}  style={{ width: '800px', height: 'auto' }} />

<br />
<br />

選取您的 litellm 應用程式後，點擊 `Users and Groups` > `Add user/group` 

<Image img={require('../../img/msft_enterprise_assign_group.png')}  style={{ width: '800px', height: 'auto' }} />

<br />

現在選取您在步驟 1.1 建立的群組，並將其新增至 LiteLLM 企業版應用程式。此時我們已將 `Production LLM Evals Group` 新增至 LiteLLM 企業版應用程式。下一步是讓 LiteLLM 在有新使用者登入時，自動在 LiteLLM DB 中建立 `Production LLM Evals Group`。

<Image img={require('../../img/msft_enterprise_select_group.png')}  style={{ width: '800px', height: 'auto' }} />

### 3.2 透過 SSO 登入 LiteLLM UI {#32-sign-in-to-litellm-ui-via-sso}

透過 SSO 登入 LiteLLM UI。您應該會被重新導向至 Entra ID SSO 頁面。此 SSO 登入流程會觸發 LiteLLM 從 Azure Entra ID 取得最新的群組與成員。

<Image img={require('../../img/msft_sso_sign_in.png')}  style={{ width: '800px', height: 'auto' }} />

### 3.3 在 LiteLLM UI 中檢查新團隊 {#33-check-the-new-team-on-litellm-ui}

在 LiteLLM UI 中，前往 `Teams`，您應該會看到新團隊 `Production LLM Evals Group` 已在 LiteLLM 中自動建立。 

<Image img={require('../../img/msft_auto_team.png')}  style={{ width: '900px', height: 'auto' }} />

> **注意：** 當使用者透過 SCIM 從您的組織中移除時，與該使用者相關聯的所有 API 金鑰與存取權杖都會自動從 LiteLLM 刪除。這可確保被移除的使用者立即且安全地失去所有存取權限。
