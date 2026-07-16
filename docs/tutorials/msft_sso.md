import Image from '@theme/IdealImage';

# Microsoft SSO：使用 LiteLLM 同步群組、成員 {#microsoft-sso-sync-groups-members-with-litellm}

使用 LiteLLM Teams 同步 Microsoft SSO 群組、成員。 

<Image img={require('../../img/litellm_entra_id.png')}  style={{ width: '800px', height: 'auto' }} />

<br />
<br />

## 先決條件 {#prerequisites}

- 具備管理權限的 Azure Entra ID 帳戶
- 已在您的 Azure 入口網站中設定好的 LiteLLM Enterprise App
- 可存取 Microsoft Entra ID（Azure AD）

## 本教學概覽 {#overview-of-this-tutorial}

1. 在 LiteLLM Teams 上自動建立 Entra ID 群組
2. 同步 Entra ID 團隊成員資格
3. 為 LiteLLM 上自動建立的新團隊與使用者設定預設參數

## 1. 在 LiteLLM Teams 上自動建立 Entra ID 群組  {#1-auto-create-entra-id-groups-on-litellm-teams}

在這一步中，我們的目標是：當 Azure Entra ID 中的 LiteLLM Enterprise App 新增了群組時，讓 LiteLLM 自動在 LiteLLM DB 中建立一個新團隊。

### 1.1 在 Entra ID 中建立新群組 {#11-create-a-new-group-in-entra-id}

前往 [您的 Azure 入口網站](https://portal.azure.com/) > 群組 > 新增群組。建立一個新群組。 

<Image img={require('../../img/entra_create_team.png')}  style={{ width: '800px', height: 'auto' }} />

### 1.2 將群組指派給您的 LiteLLM Enterprise App {#12-assign-the-group-to-your-litellm-enterprise-app}

在您的 Azure 入口網站中，前往 `Enterprise Applications` > 選取您的 litellm app 

<Image img={require('../../img/msft_enterprise_app.png')}  style={{ width: '800px', height: 'auto' }} />

<br />
<br />

選取您的 litellm app 後，點擊 `Users and Groups` > `Add user/group` 

<Image img={require('../../img/msft_enterprise_assign_group.png')}  style={{ width: '800px', height: 'auto' }} />

<br />

現在選取您在步驟 1.1 建立的群組，並將其新增至 LiteLLM Enterprise App。此時我們已將 `Production LLM Evals Group` 新增至 LiteLLM Enterprise App。接下來的步驟是讓 LiteLLM 在新使用者登入時，自動在 LiteLLM DB 中建立 `Production LLM Evals Group`。

<Image img={require('../../img/msft_enterprise_select_group.png')}  style={{ width: '800px', height: 'auto' }} />

### 1.3 透過 SSO 登入 LiteLLM UI {#13-sign-in-to-litellm-ui-via-sso}

透過 SSO 登入 LiteLLM UI。您應該會被重新導向至 Entra ID SSO 頁面。這個 SSO 登入流程會觸發 LiteLLM 從 Azure Entra ID 取得最新的群組與成員。

<Image img={require('../../img/msft_sso_sign_in.png')}  style={{ width: '800px', height: 'auto' }} />

### 1.4 在 LiteLLM UI 上查看新團隊 {#14-check-the-new-team-on-litellm-ui}

在 LiteLLM UI 中，前往 `Teams`，您應該會看到新團隊 `Production LLM Evals Group` 已由 LiteLLM 自動建立。 

<Image img={require('../../img/msft_auto_team.png')}  style={{ width: '900px', height: 'auto' }} />

#### 這是如何運作的 {#how-this-works}

當 SSO 使用者登入 LiteLLM 時：
- LiteLLM 會自動擷取 LiteLLM Enterprise App 底下的群組
- 它會找出指派給 LiteLLM Enterprise App 的 Production LLM Evals Group
- LiteLLM 會檢查這個群組的 ID 是否存在於 LiteLLM Teams Table 中
- 由於該 ID 不存在，LiteLLM 會自動建立一個新團隊，包含：
  - 名稱：Production LLM Evals Group
  - ID：與 Entra ID 群組的 ID 相同

## 2. 同步 Entra ID 團隊成員資格 {#2-sync-entra-id-team-memberships}

在這一步中，當 Entra ID 中的 `Production LLM Evals` 群組新增使用者時，LiteLLM 會自動將使用者加入 LiteLLM DB 中的 `Production LLM Evals` 團隊。

### 2.1 前往 Entra ID 中的 `Production LLM Evals` 群組 {#21-navigate-to-the-production-llm-evals-group-in-entra-id}

前往 Entra ID 中的 `Production LLM Evals` 群組。

<Image img={require('../../img/msft_member_1.png')}  style={{ width: '800px', height: 'auto' }} />

### 2.2 在 Entra ID 中將成員加入群組 {#22-add-a-member-to-the-group-in-entra-id}

選取 `Members` > `Add members`

在這個階段，您應該加入您想要新增至 `Production LLM Evals` 團隊的使用者。

<Image img={require('../../img/msft_member_2.png')}  style={{ width: '800px', height: 'auto' }} />

### 2.3 以新使用者身分登入 LiteLLM UI {#23-sign-in-as-the-new-user-on-litellm-ui}

以新使用者身分登入 LiteLLM UI。您應該會被重新導向至 Entra ID SSO 頁面。這個 SSO 登入流程會觸發 LiteLLM 從 Azure Entra ID 取得最新的群組與成員。在這個步驟中，LiteLLM 會將其團隊、團隊成員與 Entra ID 中可用的內容進行同步

<Image img={require('../../img/msft_sso_sign_in.png')}  style={{ width: '800px', height: 'auto' }} />

### 2.4 在 LiteLLM UI 上查看團隊成員資格 {#24-check-the-team-membership-on-litellm-ui}

在 LiteLLM UI 中，前往 `Teams`，您應該會看到新團隊 `Production LLM Evals Group`。由於您現在是 Entra ID 中 `Production LLM Evals Group` 的成員，因此您應該會在 LiteLLM UI 上看到新團隊 `Production LLM Evals Group`。

<Image img={require('../../img/msft_member_3.png')}  style={{ width: '900px', height: 'auto' }} />

### 2.5 Azure 政府雲端（GCC High） {#25-azure-government-cloud-gcc-high}

預設情況下，LiteLLM 會從商業版 Microsoft Graph 端點 `https://graph.microsoft.com/v1.0` 同步群組成員資格。Azure Government Cloud GCC High 會從不同的主機提供 Graph，因此請設定 `MICROSOFT_GRAPH_ENDPOINT`，將 LiteLLM 指向主權雲端端點。

```bash showLineNumbers title="GCC High Graph endpoint"
export MICROSOFT_GRAPH_ENDPOINT="https://graph.microsoft.us/v1.0"
```

未設定時，LiteLLM 會使用 `https://graph.microsoft.com/v1.0`，因此商業雲端部署不需要變更。此端點會在 SSO 登入期間用於 `/me/memberOf` 群組查詢，以及 Enterprise Application service principal 群組查詢。您可能也會想透過 `MICROSOFT_AUTHORIZATION_ENDPOINT`、`MICROSOFT_TOKEN_ENDPOINT` 和 `MICROSOFT_USERINFO_ENDPOINT` 來覆寫 GCC High 的授權、權杖與 userinfo 端點。

## 3. 為 LiteLLM 上自動建立的新團隊設定預設參數 {#3-set-default-params-for-new-teams-auto-created-on-litellm}

由於當 Azure Entra ID 中的 LiteLLM Enterprise App 新增群組時，litellm 會自動在 LiteLLM DB 中建立新團隊，因此我們可以為新建立的團隊設定預設參數。 

這可讓您為新建立的團隊設定預設預算、模型等。 

### 3.1 在 litellm 上設定 `default_team_params`  {#31-set-default_team_params-on-litellm}

前往您的 litellm 設定檔並設定下列參數 

```yaml showLineNumbers title="litellm config with default_team_params"
litellm_settings:
  default_team_params:             # Applied to all /team/new calls (including SSO auto-created teams) when the field is not explicitly set
    max_budget: 100                # Optional[float]: $100 budget for the team
    budget_duration: 30d           # Optional[str]: 30 days budget_duration for the team
    models: ["gpt-3.5-turbo"]      # Optional[List[str]]: models for the team (only applied to SSO auto-created teams)
    team_member_permissions:       # Optional[List[str]]: permissions granted to non-admin team members
      - "/team/daily/activity"     # Allow members to view team usage
```

### 3.2 在 LiteLLM 上自動建立新團隊 {#32-auto-create-a-new-team-on-litellm}

- 在這一步中，您應該在 Azure Entra ID 的 LiteLLM Enterprise App 新增一個新群組（就像我們在步驟 1.1 所做的）。我們將在 Azure Entra ID 中稱這個群組為 `Default LiteLLM Prod Team`。
- 使用您的設定啟動 litellm proxy server
- 透過 SSO 登入 LiteLLM UI
- 前往 `Teams`，您應該會看到新團隊 `Default LiteLLM Prod Team` 已由 LiteLLM 自動建立
- 請注意，LiteLLM 會為這個新團隊設定預設參數。 

<Image img={require('../../img/msft_default_settings.png')}  style={{ width: '900px', height: 'auto' }} />

## 4. 使用 Entra ID App Roles 進行使用者權限設定 {#4-using-entra-id-app-roles-for-user-permissions}

您可以直接使用 App Roles 從 Entra ID 指派使用者角色。LiteLLM 會在 SSO 登入期間自動從 JWT token 讀取 app role，並將對應的角色指派給使用者。

### 4.1 支援的角色 {#41-supported-roles}

LiteLLM 支援以下 app roles（不區分大小寫）：

- `proxy_admin` - 整個 LiteLLM 平台的管理員
- `proxy_admin_viewer` - 唯讀管理員存取權（可檢視所有金鑰與支出）
- `org_admin` - 特定組織的管理員（可在其組織內建立團隊與使用者）
- `internal_user` - 標準使用者（可建立/檢視/刪除自己的金鑰，並檢視自己的支出）

### 4.2 在 Entra ID 中建立 App Roles {#42-create-app-roles-in-entra-id}

1. 前往 https://portal.azure.com/ 上的 App Registration
2. 前往 **App roles** > **Create app role**

3. 設定 app role：
   - **Display name**: Proxy Admin（或您偏好的顯示名稱）
   - **Value**: `proxy_admin`（使用上述其中一個支援的角色值）
   - **Description**: LiteLLM proxy 的管理員存取權
   - **Allowed member types**: Users/Groups

4. 點擊 **Apply** 以儲存角色

### 4.3 將使用者指派給 App Roles {#43-assign-users-to-app-roles}

1. 前往 https://portal.azure.com/ 上的 **Enterprise Applications**
2. 選取您的 LiteLLM 應用程式
3. 前往 **Users and groups** > **Add user/group**
4. 選取使用者並將其指派給您建立的其中一個 app role

### 4.4 測試角色指派 {#44-test-the-role-assignment}

1. 以已指派 app role 的使用者身分透過 SSO 登入 LiteLLM UI
2. LiteLLM 會自動從 JWT token 中擷取 app role
3. 該使用者會在資料庫中被指派對應的 LiteLLM 角色
4. 使用者的權限會反映其被指派的角色

**運作方式：**
- 當使用者透過 Microsoft SSO 登入時，LiteLLM 會從 JWT `id_token` 中擷取 `roles` 聲明
- 如果任何角色符合有效的 LiteLLM 角色（不區分大小寫），就會將該角色指派給使用者
- 如果存在多個角色，LiteLLM 會使用找到的第一個有效角色
- 此角色指派會保留在 LiteLLM 資料庫中，並決定使用者的存取層級

## 影片逐步說明 {#video-walkthrough}

此內容說明如何設定 sso 自動新增以支援 **Microsoft Entra ID**

請跟著這段影片了解如何使用 Microsoft Entra ID 設定此功能

<iframe width="840" height="500" src="https://www.loom.com/embed/ea711323aa9a496d84a01fd7b2a12f54?sid=c53e238c-5bfd-4135-b8fb-b5b1a08632cf" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
