---
title: SSO 權限
description: 控制 LiteLLM 中的 SSO 登入、使用者角色、團隊成員資格與金鑰建立。
---

import Image from '@theme/IdealImage';

# SSO 權限 {#sso-permissions}

{/* keep-version-note */}

請先設定 [SSO 登入](../admin_ui_sso.md)，再使用這些設定控制誰可以使用 Admin UI 以及他們可以管理什麼。每個角色提供的權限請參閱[角色與團隊成員權限](../access_control.md)。

## 依電子郵件網域限制登入 {#restrict-email-subdomains-w-sso}

若只允許來自 `berri.ai` 的 SSO 登入，請設定：

```bash
export ALLOWED_EMAIL_DOMAINS="berri.ai"
```

LiteLLM 會在允許登入之前，檢查您的 SSO 提供者傳回的電子郵件。

## 限制 UI 存取 {#restrict-ui-access}

只允許 `proxy_admin` 與 `proxy_admin_viewer` 使用者登入 Admin UI：

**步驟 1. 設定 `admin_only` 存取**

```yaml
general_settings:
  ui_access_mode: "admin_only"
```

**步驟 2. 邀請僅供檢視的使用者**

<Image img={require('../../../img/admin_ui_viewer.png')} />

## 設定 proxy 管理員 {#set-proxy-admin}

SSO 使用者的 `user_id` 來自身分提供者。從 UI 複製該 ID 並將其設為 `PROXY_ADMIN_ID`，即可讓該使用者擁有 `proxy_admin` 角色。

### 步驟 1：從 UI 複製您的 ID {#step-1-copy-your-id-from-the-ui}

<Image img={require('../../../img/litellm_ui_copy_id.png')} />

### 步驟 2：在 .env 中將其設為 PROXY_ADMIN_ID {#step-2-set-it-in-your-env-as-the-proxy_admin_id}

```env
export PROXY_ADMIN_ID="116544810872468347480"
```

這會將 `LiteLLM_UserTable` 中的使用者角色更新為 `proxy_admin`。

若日後要變更管理員，請透過 `/user/update` 或 **Internal Users** 頁面更新使用者角色。

### 步驟 3：檢視所有 proxy 金鑰 {#step-3-see-all-proxy-keys}

<Image img={require('../../../img/litellm_ui_admin.png')} />

:::info

若新的管理員看不到所有金鑰，請登出再重新登入，以重新整理快取的 token。

:::

## 透過 Microsoft Entra ID 指派角色 {#manage-user-roles-via-azure-app-roles}

在 Microsoft Entra ID 中定義 App Roles。LiteLLM 會在每位使用者登入時讀取指派給他們的角色。

### 步驟 1：在 Azure App Registration 上建立 App Roles {#step-1-create-app-roles-on-azure-app-registration}

1. 在 [Azure 入口網站](https://portal.azure.com/)中開啟您的 App Registration。
2. 前往 **App roles** > **Create app role**
3. 使用其中一個[支援的 LiteLLM 角色](../access_control.md#global-proxy-roles)設定 app role：
   - **Display name**：Admin Viewer（或您偏好的顯示名稱）
   - **Value**：`proxy_admin_viewer`（必須與其中一個 LiteLLM 角色值完全相符）
4. 按一下 **Apply** 儲存角色
5. 對您要使用的每個 LiteLLM 角色重複此步驟


支援的值為 `proxy_admin`、`proxy_admin_viewer`、`internal_user` 與 `internal_user_viewer`。指派角色之前，請先參閱[角色權限](../access_control.md#global-proxy-roles)。

<Image img={require('../../../img/app_roles.png')} style={{ width: '900px', height: 'auto' }} />

---

### 步驟 2：將使用者指派給 App Roles {#step-2-assign-users-to-app-roles}

1. 在 [Azure 入口網站](https://portal.azure.com/)中開啟 **Enterprise Applications**。
2. 選取您的 LiteLLM 應用程式
3. 前往 **Users and groups** > **Add user/group**
4. 選取使用者
5. 在 **Select a role** 底下選擇您建立的 app role（例如 `proxy_admin_viewer`）
6. 按一下 **Assign** 儲存

<Image img={require('../../../img/app_role2.png')} style={{ width: '900px', height: 'auto' }} />

---

### 步驟 3：登入並驗證 {#step-3-sign-in-and-verify}

1. 透過 SSO 登入 LiteLLM UI
2. LiteLLM 會自動從 JWT token 中擷取 app role
3. 使用者會被指派對應的角色（您可以在 UI 中檢查使用者個人資料下拉選單來驗證）

<Image img={require('../../../img/app_role3.png')} style={{ width: '900px', height: 'auto' }} />

**注意：**來自 Entra ID 的角色會優先於 LiteLLM 資料庫中的任何現有角色。這確保您的 SSO 提供者是使用者角色的權威來源。

## 透過通用 OIDC 提供者指派角色 {#assign-roles-through-a-generic-oidc-provider}

將 `GENERIC_USER_ROLE_ATTRIBUTE` 設為包含使用者 LiteLLM 角色的屬性。支援 `claims.role` 或 `attributes.litellm_role` 這類巢狀路徑。

```bash
GENERIC_USER_ROLE_ATTRIBUTE="claims.role"
```

支援的值為 `proxy_admin`、`proxy_admin_viewer`、`internal_user` 與 `internal_user_viewer`。指派角色之前，請先參閱[角色權限](../access_control.md#global-proxy-roles)。

## 透過 SAML 指派角色與團隊 {#assign-roles-and-teams-through-saml}

[設定 SAML 登入](../saml_sso.md)之後，將 LiteLLM 角色與團隊 ID 包含在 SAML 斷言中。LiteLLM 可辨識這些常見的屬性名稱；若您的 IdP 使用其他名稱，請覆寫它們：

| 環境變數 | 預設候選值 | 意義 |
| --- | --- | --- |
| `SAML_ATTRIBUTE_ROLE` | `role`、`roles`、`litellm_role` | 對應到 LiteLLM 使用者角色的屬性。 |
| `SAML_ATTRIBUTE_TEAM_IDS` | `teams`、`team_ids`、`groups` | 對應到 LiteLLM 團隊 ID 的屬性。 |

```bash
SAML_ATTRIBUTE_ROLE="role"
SAML_ATTRIBUTE_TEAM_IDS="teams"
```

角色值必須是 `proxy_admin`、`proxy_admin_viewer`、`internal_user` 或 `internal_user_viewer`。

- **Okta：**新增一個名為 `role` 的自訂屬性或 Group Attribute Statement，其值為支援的 LiteLLM 角色值。
- **Microsoft Entra ID：**新增一個名為 `role` 的自訂 claim，其來源為 App Role 或目錄屬性。

## 使用自訂 SSO 處理常式指派角色 {#assign-roles-with-a-custom-sso-handler}

若要在登入後自訂角色指派，請使用[自訂 SSO 處理常式](../custom_sso.md#option-2-custom-sso-handler-post-authentication)。傳回 `user_role=None` 會保留儲存的 LiteLLM 角色；明確的角色會在每次登入時覆寫它。

## 將 SSO 使用者加入團隊 {#auto-add-sso-users-to-teams-oidc}

對於 OIDC 提供者（Okta、Google、Generic SSO），您可以將身分提供者傳回的 token 中的某個 claim 帶入使用者的 `team_ids`。每次 SSO 登入時，LiteLLM 都會讀取該 claim，並將使用者加入每個相符團隊成為成員。

### 步驟 1：讓 LiteLLM 指向包含團隊 ID 的 claim {#step-1-point-litellm-at-the-claim-containing-the-team-ids}

```yaml showLineNumbers title="config.yaml"
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  litellm_jwtauth:
    team_ids_jwt_field: "groups" # any claim; dot notation works for nested claims, e.g. "resource_access.myapp.groups"
```

這假設您的提供者傳回的 token 如下所示：

```json
{
  "groups": ["team_id_1", "team_id_2"]
}
```

若您不確定提供者傳送了什麼，請使用 [SSO 偵錯流程](../admin_ui_sso.md#debugging-sso-jwt-fields)檢查收到的 claims。

### 步驟 2：在 LiteLLM 上建立團隊 {#step-2-create-the-teams-on-litellm}

claim 值必須與 LiteLLM 上已存在團隊的 `team_id` 相符。團隊不會從 OIDC claims 自動建立，沒有相符團隊的 claim 值會被略過。

```bash showLineNumbers title="Create team with team_id matching the SSO group value"
curl -X POST '<PROXY_BASE_URL>/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-d '{
    "team_alias": "team_1",
    "team_id": "team_id_1"
}'
```

### 步驟 3：測試 SSO 流程 {#step-3-test-the-sso-flow}

透過 SSO 登入，並在 UI（Internal Users 頁面）上驗證使用者的團隊成員資格。這裡有一支[影片操作指南](https://www.loom.com/share/8959be458edf41fd85937452c29a33f3?sid=7ebd6d37-569a-4023-866e-e0cde67cb23e)。

有些提供者只在 access token 中包含 groups claim，不包含在 userinfo 回應中。在這種情況下，請透過 `ui_access_mode` 設定該 claim，它也會解碼 access token。請注意，這種形式還會額外將 UI 登入限制為給定群組的成員：

```yaml showLineNumbers title="config.yaml"
general_settings:
  ui_access_mode:
    type: "restricted_sso_group"
    restricted_sso_group: "<group required for UI access>"
    sso_group_jwt_field: "groups"
```

對於 Microsoft Entra ID，群組成員資格改從 Microsoft Graph API 讀取；請依照[本教學](../../tutorials/msft_sso.md)。對於 SAML，團隊 ID 來自斷言屬性；請參閱 [SAML 角色與團隊](#assign-roles-and-teams-through-saml)。

## 限制個人金鑰建立 {#restrict-personal-key-creation}

若要將個人金鑰的建立限制為僅 proxy 管理員，請在 `config.yaml` 中設定 `key_generation_settings`。個人金鑰沒有團隊。LiteLLM 會在 `/key/generate` 上強制執行此限制，因此 Admin UI 與直接 API 呼叫都適用。

```yaml
litellm_settings:
  key_generation_settings:
    personal_key_generation:
      allowed_user_roles: ["proxy_admin"]
```

所有選項請參閱[限制金鑰產生](../virtual_keys.md#restricting-key-generation)。
