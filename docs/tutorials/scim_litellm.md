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

> **注意：** 當使用者透過 SCIM 被停用配置時，LiteLLM 會封鎖該使用者擁有的所有虛擬金鑰，並將其從驗證快取中移除，立即撤銷存取權。這些金鑰會保留在資料庫中以維持支出歷史。請參閱 [停用與取消配置](#deactivation-and-deprovisioning)。

## 使用者屬性對應 {#user-attribute-mapping}

LiteLLM 會處理提交至 `POST /scim/v2/Users` 和 `PUT /scim/v2/Users/{id}` 的 SCIM 使用者資源中的以下屬性。此表未列出的屬性會被忽略。

| SCIM 屬性 | 儲存為 | 備註 |
|---|---|---|
| `userName` | `user_id` | 原樣儲存。若省略，LiteLLM 會產生隨機 UUID。 |
| `emails[0].value` | `user_email` | 只會處理第一筆電子郵件項目，無論其 `primary` 值為何。 |
| `name.givenName` | `user_alias` 和 `metadata.scim_metadata.givenName` | 用於衍生使用者別名；`displayName` 不會在 `POST` 或 `PUT` 期間使用。 |
| `name.familyName` | `metadata.scim_metadata.familyName` | 以 SCIM 中繼資料形式儲存。 |
| `groups[].value` | `teams` | 每個值都會視為既有的 LiteLLM `team_id`。 |
| `externalId` | `sso_user_id` | 僅儲存供 `PUT` 和 `PATCH` 使用。初始 `POST` 配置後，在首次更新之前會保持未設定狀態。 |
| `active` | `metadata.scim_active` | 僅套用於 `PUT` 和 `PATCH`。帶有 `POST` 的 `active: false` 請求仍會建立啟用中的使用者。 |
| `entitlements`, `roles` | `metadata.scim_entitlements`, `metadata.scim_roles` | 保留供後續讀取回應使用；這些值不會授予 LiteLLM 權限。 |
| `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User` | `metadata.scim_enterprise` | 保留供後續讀取回應使用。 |

`displayName` 不會由 `POST` 或 `PUT` 處理。針對 `displayName` 的 `PATCH` 操作會更新 `user_alias`，因此最終別名取決於最近一次適用的請求。

SCIM 的讀取與寫入表示不同。`GET /scim/v2/Users` 會從 `user_email` 建立 `userName` 和 `displayName`，而寫入操作則將 `userName` 儲存為 `user_id`。`externalId` 值不會包含在讀取回應中。為支援身分提供者查找工作流程，`userName eq` 篩選器會同時比對 `user_email` 與 `user_id`，讓像 Okta 之類的提供者能在套用生命週期更新之前，找到先前已配置的使用者。

## 配置已存在的使用者 {#provisioning-a-user-who-already-exists}

LiteLLM 依下列順序評估潛在衝突：

1. 如果 `userName` 與既有的 LiteLLM `user_id` 相符，`POST /scim/v2/Users` 會回傳 `409 Conflict`。接著身分提供者可以使用 `PUT` 或 `PATCH` 更新既有使用者。
2. 如果 `userName` 是新的，但 `emails[0].value` 與既有使用者相符，LiteLLM 會更新既有記錄而非建立重複項目。它會以傳入的 `userName` 取代 `user_id`，以提供的 `groups` 重新調整團隊成員資格，並取代 `user_email`、`user_alias`、`teams` 和 `metadata`。端點會回傳 `201`。既有金鑰、成員資格與支出歷史仍會與更新後的記錄關聯。若要避免這種以電子郵件為基礎的重新指派，請在身分提供者中設定穩定的 `userName`。

此行為與 `litellm_settings.scim_upsert_user` 無關。該設定僅在解析群組成員時適用。使用 `true` 預設值時，針對群組的 `PUT` 或 `PATCH` 請求會為 LiteLLM 尚未遇過的成員 ID 建立使用者。設定為 `false` 時，請求會回傳 `400`，且要求先建立使用者。此設定不會影響 `POST /Users` 中以電子郵件為基礎的比對。

## 指派代理閘道管理員角色 {#assigning-the-proxy-admin-role}

預設情況下，新配置的 SCIM 使用者會取得 `litellm_settings.default_internal_user_params.user_role` 中設定的角色。若未設定角色，LiteLLM 會指派 `internal_user_view_only`。既有使用者會保留其目前角色。

設定 `scim_admin_group`，透過 SCIM 群組成員資格管理全域角色：

```yaml title="config.yaml"
litellm_settings:
  scim_admin_group: "litellm-admins"
```

LiteLLM 會將此設定與每個群組的 `value` 和 `display` 名稱進行比對。符合的群組成員會取得 `proxy_admin` 角色；其他所有使用者都會取得上述預設角色。LiteLLM 會在每次 SCIM 寫入時評估此對應，因此從已設定的管理員群組中移除使用者會在下一次同步期間變更該使用者的角色。若未設定 `scim_admin_group`，SCIM 不會修改透過管理員 UI 或管理 API 指派的角色。

## 停用與取消配置 {#deactivation-and-deprovisioning}

當 `PUT` 或 `PATCH` 請求將 `active` 設為 `false` 時，LiteLLM 會封鎖該使用者擁有的每一把虛擬金鑰，並從驗證快取中移除對應憑證，立即撤銷存取權。LiteLLM 會記錄此次操作封鎖了哪些金鑰。若該使用者重新啟用，只有這些金鑰會被解除封鎖；由管理員個別封鎖的金鑰仍會維持封鎖狀態。省略 `active` 的 `PUT` 請求會保留使用者目前的啟用狀態。

`DELETE /scim/v2/Users/{id}` 會移除該使用者的團隊與組織成員資格，刪除相關邀請連結，封鎖該使用者的虛擬金鑰，並刪除使用者記錄。這些金鑰會保留在資料庫中以維持歷史支出資料。
