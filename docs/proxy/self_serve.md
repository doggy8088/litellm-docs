import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 內部使用者自助服務 {#internal-user-self-serve}

## 允許使用者在 [Proxy UI](./ui.md) 上建立自己的金鑰。 {#allow-users-to-create-their-own-keys-on-proxy-uiuimd}

1. 將具有權限的使用者新增至 proxy 的團隊

<Tabs>
<TabItem value="ui" label="UI">

前往 `Internal Users` -> `+New User`

<Image img={require('../../img/add_internal_user.png')}  style={{ width: '800px', height: 'auto' }} />

</TabItem>
<TabItem value="api" label="API">

在 LiteLLM 中建立一個新的內部使用者，並將其指派角色 `internal_user`。

```bash
curl -X POST '<PROXY_BASE_URL>/user/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "user_email": "krrishdholakia@gmail.com",
    "user_role": "internal_user" # 👈 THIS ALLOWS USER TO CREATE/VIEW/DELETE THEIR OWN KEYS + SEE THEIR SPEND
}'
```

預期回應 

```bash
{
    "user_id": "e9d45c7c-b20b-4ff8-ae76-3f479a7b1d7d", 👈 USE IN STEP 2
    "user_email": "<YOUR_USERS_EMAIL>",
    "user_role": "internal_user",
    ...
}
```

以下是 LiteLLM 內部使用者可用的 UI 角色： 

管理員角色：
  - `proxy_admin`：平台管理員
  - `proxy_admin_viewer`：可登入、檢視所有金鑰、檢視所有支出。**不能**建立/刪除金鑰、加入新使用者。

內部使用者角色：
  - `internal_user`：可登入、檢視/建立/刪除自己的金鑰、檢視自己的支出。**不能**加入新使用者。
  - `internal_user_viewer`：可登入、檢視自己的金鑰、檢視自己的支出。**不能**建立/刪除金鑰、加入新使用者。

</TabItem>
</Tabs>

2. 與使用者分享邀請連結 

<Tabs>
<TabItem value="ui" label="UI">

將邀請連結複製給使用者 

<Image img={require('../../img/invitation_link.png')}  style={{ width: '800px', height: 'auto' }} />

</TabItem>
<TabItem value="api" label="API">

```bash
curl -X POST '<PROXY_BASE_URL>/invitation/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "user_id": "e9d45c7c-b20b..." # 👈 USER ID FROM STEP 1
}'
```

預期回應 

```bash
{
    "id": "a2f0918f-43b0-4770-a664-96ddd192966e",
    "user_id": "e9d45c7c-b20b..",
    "is_accepted": false,
    "accepted_at": null,
    "expires_at": "2024-06-13T00:02:16.454000Z", # 👈 VALID FOR 7d
    "created_at": "2024-06-06T00:02:16.454000Z",
    "created_by": "116544810872468347480",
    "updated_at": "2024-06-06T00:02:16.454000Z",
    "updated_by": "116544810872468347480"
}
```

邀請連結： 

```bash
http://0.0.0.0:4000/ui/onboarding?id=a2f0918f-43b0-4770-a664-96ddd192966e

# <YOUR_PROXY_BASE_URL>/ui/onboarding?id=<id>
```

</TabItem>
</Tabs>

:::info

使用 [電子郵件通知](./email.md) 將上線連結寄送給使用者 

:::

3. 使用者透過電子郵件 + 密碼驗證登入

<Image img={require('../../img/ui_clean_login.png')}  style={{ width: '500px', height: 'auto' }} />

:::info 

LiteLLM Enterprise：啟用 [SSO 登入](./ui.md#setup-ssoauth-for-ui)

:::

4. 使用者現在可以建立自己的金鑰

<Image img={require('../../img/ui_self_serve_create_key.png')}  style={{ width: '800px', height: 'auto' }} />

## 允許使用者檢視使用量、快取分析 {#allow-users-to-view-usage-caching-analytics}

1. 前往 Internal Users -> +Invite User

將其角色設定為 `Admin Viewer` - 這表示他們只能檢視使用量、快取分析

<Image img={require('../../img/ui_invite_user.png')}  style={{ width: '800px', height: 'auto' }} />
<br />

2. 與使用者分享邀請連結

<Image img={require('../../img/ui_invite_link.png')}  style={{ width: '800px', height: 'auto' }} />
<br />

3. 使用者透過電子郵件 + 密碼驗證登入

<Image img={require('../../img/ui_clean_login.png')}  style={{ width: '500px', height: 'auto' }} />
<br />

4. 使用者現在可以檢視使用量、快取分析

<Image img={require('../../img/ui_usage.png')}  style={{ width: '800px', height: 'auto' }} />

## 可用角色 {#available-roles}
以下是 LiteLLM 內部使用者可用的 UI 角色： 

**管理員角色：**
  - `proxy_admin`：平台管理員
  - `proxy_admin_viewer`：可登入、檢視所有金鑰、檢視所有支出。**不能**建立/刪除金鑰、加入新使用者。

**內部使用者角色：**
  - `internal_user`：可登入、檢視/建立/刪除自己的金鑰、檢視自己的支出。**不能**加入新使用者。
  - `internal_user_viewer`：可登入、檢視自己的金鑰、檢視自己的支出。**不能**建立/刪除金鑰、加入新使用者。

**團隊角色：**
  - `admin`：可將新成員加入團隊、可控制團隊權限、可新增僅限團隊的模型（適合用於讓團隊的微調模型完成上線）。
  - `user`：可登入、檢視自己的金鑰、檢視自己的支出。**不能**建立/刪除金鑰（可透過團隊權限控制）、加入新使用者。

## 自動將 SSO 使用者加入團隊 {#auto-add-sso-users-to-teams}

本節說明如何為 **Okta、Google SSO** 設定 SSO 自動加入

### Okta、Google SSO {#okta-google-sso}

1. 指定包含使用者所屬團隊 id 的 JWT 欄位。 

```yaml
general_settings:
  master_key: sk-1234
  litellm_jwtauth:
    team_ids_jwt_field: "groups" # 👈 CAN BE ANY FIELD
```

這是假設您的 SSO token 看起來像這樣。**如果您需要檢查 LiteLLM 從您的 SSO 提供者收到的 JWT 欄位，請依照這裡的說明操作 [這裡](#debugging-sso-jwt-fields)**

```
{
  ...,
  "groups": ["team_id_1", "team_id_2"]
}
```

2. 在 LiteLLM 上建立團隊 

```bash
curl -X POST '<PROXY_BASE_URL>/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "team_alias": "team_1",
    "team_id": "team_id_1" # 👈 MUST BE THE SAME AS THE SSO GROUP ID
}'
```

3. 測試 SSO 流程

這裡有一個關於 [其運作方式](https://www.loom.com/share/8959be458edf41fd85937452c29a33f3?sid=7ebd6d37-569a-4023-866e-e0cde67cb23e) 的導覽

### Microsoft Entra ID SSO 群組指派 {#microsoft-entra-id-sso-group-assignment}

請參閱這份 [使用 Microsoft Entra ID 自動將 sso 使用者新增至團隊的教學](https://docs.litellm.ai/docs/tutorials/msft_sso)

### 偵錯 SSO JWT 欄位  {#debugging-sso-jwt-fields}

[**前往這裡**](./admin_ui_sso.md#debugging-sso-jwt-fields)

## 進階 {#advanced}
### 設定自訂登出 URL {#setting-custom-logout-urls}

如果您希望使用者按一下登出時重新導向到特定 URL，請在您的 .env 中設定 `PROXY_LOGOUT_URL`

```
export PROXY_LOGOUT_URL="https://www.google.com"
```

<Image img={require('../../img/ui_logout.png')}  style={{ width: '400px', height: 'auto' }} />

### 為內部使用者設定預設最大預算  {#set-default-max-budget-for-internal-users}

在內部使用者註冊時，自動套用每位使用者的預算。預設情況下，系統會每 10 分鐘檢查一次表格，以便讓使用者重設。若要修改此設定，請 [參閱這裡](./users.md#reset-budgets)

```yaml
litellm_settings:
  max_internal_user_budget: 10
  internal_user_budget_duration: "1mo" # reset every month
```

這會在內部使用者註冊時，為其設定 10 美元的最大預算。 

您也可以在 UI 中以視覺化方式管理這些設定：

<Image img={require('../../img/default_user_settings_admin_ui.png')}  style={{ width: '700px', height: 'auto' }} />

此預算僅適用於該使用者建立的個人金鑰 - 在 UI 上可於 `Default Team` 下看到。 

<Image img={require('../../img/max_budget_for_internal_users.png')}  style={{ width: '500px', height: 'auto' }} />

此預算不適用於在非預設團隊下建立的金鑰。

### 為團隊設定最大預算 {#set-max-budget-for-teams}

[**前往這裡**](./team_budgets.md)

### 預設團隊 {#default-team}

<Tabs>
<TabItem value="ui" label="UI">

前往 `Internal Users` -> `Default User Settings`，並將預設團隊設定為您剛建立的團隊。 

我們也來將預設模型設定為 `no-default-models`。這表示使用者只能在團隊內建立金鑰。

<Image img={require('../../img/default_user_settings_with_default_team.png')}  style={{ width: '1000px', height: 'auto' }} />

</TabItem>
<TabItem value="yaml" label="YAML">

:::info
必須先建立團隊，才能將其設定為預設團隊。 
:::

```yaml
litellm_settings:
  default_internal_user_params:    # Default Params used when a new user signs in Via SSO
      user_role: "internal_user"     # one of "internal_user", "internal_user_viewer", 
      models: ["no-default-models"] # Optional[List[str]], optional): models to be used by the user
      teams: # Optional[List[NewUserRequestTeam]], optional): teams to be used by the user
        - team_id: "team_id_1" # Required[str]: team_id to be used by the user
          user_role: "user" # Optional[str], optional): Default role in the team. Values: "user" or "admin". Defaults to "user"
```

</TabItem>
</Tabs>

### 團隊成員預算 {#team-member-budgets}

為團隊成員設定最大預算。 

您可以在建立新團隊時設定，或透過更新現有團隊來設定。 

<Tabs>
<TabItem value="ui" label="UI">

<Image img={require('../../img/create_default_team.png')}  style={{ width: '600px', height: 'auto' }} />

</TabItem>
<TabItem value="api" label="API">

```bash
curl -X POST '<PROXY_BASE_URL>/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "team_alias": "team_1",
    "budget_duration": "10d",
    "team_member_budget": 10
}'
```

</TabItem>
</Tabs>

### 團隊成員速率限制 {#team-member-rate-limits}

為單一團隊成員設定預設 tpm/rpm 限制。 

您可以在建立新團隊時設定，或透過更新現有團隊來設定。 

<Tabs>
<TabItem value="ui" label="UI">

<Image img={require('../../img/create_team_member_rate_limits.png')}  style={{ width: '600px', height: 'auto' }} />

</TabItem>
<TabItem value="api" label="API">

```bash
curl -X POST '<PROXY_BASE_URL>/team/new' \
-H 'Authorization: Bearer <PROXY_MASTER_KEY>' \
-H 'Content-Type: application/json' \
-D '{
    "team_alias": "team_1",
    "team_member_rpm_limit": 100,
    "team_member_tpm_limit": 1000
}'
```

</TabItem>
</Tabs>

### 為新團隊設定預設參數 {#set-default-params-for-new-teams}

當您將 litellm 連接到您的 SSO 提供者時，litellm 可以自動建立團隊。請使用此功能為這些自動建立的團隊設定預設的 `models`、`max_budget`、`budget_duration`。 

**運作方式**

1. 當 litellm 從您的 SSO 提供者擷取 `groups` 時，它會檢查對應的 group_id 是否存在於 litellm 中，作為 `team_id`。 
2. 如果 team_id 不存在，litellm 會使用您設定的預設參數自動建立團隊。 
3. 如果 team_id 已存在，litellm 不會對該團隊套用任何設定。 

**使用方式**

```yaml showLineNumbers title="Default Params for new teams"
litellm_settings:
  default_team_params:             # Applied to all /team/new calls (including SSO auto-created teams) when the field is not explicitly set
    max_budget: 100                # Optional[float]: $100 budget for the team
    budget_duration: 30d           # Optional[str]: 30 days budget_duration for the team
    models: ["gpt-3.5-turbo"]      # Optional[List[str]]: models for the team (only applied to SSO auto-created teams)
    tpm_limit: 100000              # Optional[int]: tokens per minute limit
    rpm_limit: 1000                # Optional[int]: requests per minute limit
    team_member_permissions:       # Optional[List[str]]: permissions granted to non-admin team members
      - "/team/daily/activity"     # Allow members to view team usage
      - "/key/generate"            # Allow members to generate API keys
```


### 限制使用者建立個人金鑰  {#restrict-users-from-creating-personal-keys}

如果您只想讓使用者在特定團隊下建立金鑰，這會很有用。 

這也會防止使用者在測試金鑰聊天窗格中使用其 session token。 

👉 [**看這裡**](./virtual_keys.md#restricting-key-generation)

## **所有自助服務 / SSO 流程設定** {#all-settings-for-self-serve--sso-flow}

```yaml showLineNumbers title="All Settings for Self Serve / SSO Flow"
litellm_settings:
  max_internal_user_budget: 10        # max budget for internal users
  internal_user_budget_duration: "1mo" # reset every month

  default_internal_user_params:    # Default Params used when a new user signs in Via SSO
    user_role: "internal_user"     # one of "internal_user", "internal_user_viewer", "proxy_admin", "proxy_admin_viewer". New SSO users not in litellm will be created as this user
    max_budget: 100                # Optional[float], optional): $100 budget for a new SSO sign in user
    budget_duration: 30d           # Optional[str], optional): 30 days budget_duration for a new SSO sign in user
    models: ["gpt-3.5-turbo"]      # Optional[List[str]], optional): models to be used by a new SSO sign in user
    teams: # Optional[List[NewUserRequestTeam]], optional): teams to be used by the user
      - team_id: "team_id_1" # Required[str]: team_id to be used by the user
        max_budget_in_team: 100 # Optional[float], optional): $100 budget for the team. Defaults to None.
        user_role: "user" # Optional[str], optional): "user" or "admin". Defaults to "user"
  
  default_team_params:             # Applied to all /team/new calls (including SSO auto-created teams) when the field is not explicitly set
    max_budget: 100                # Optional[float]: $100 budget for the team
    budget_duration: 30d           # Optional[str]: 30 days budget_duration for the team
    models: ["gpt-3.5-turbo"]      # Optional[List[str]]: models for the team (only applied to SSO auto-created teams)
    tpm_limit: 100000              # Optional[int]: tokens per minute limit
    rpm_limit: 1000                # Optional[int]: requests per minute limit
    team_member_permissions:       # Optional[List[str]]: permissions granted to non-admin team members
      - "/team/daily/activity"


  upperbound_key_generate_params:    # Upperbound for /key/generate requests when self-serve flow is on
    max_budget: 100 # Optional[float], optional): upperbound of $100, for all /key/generate requests
    budget_duration: "10d" # Optional[str], optional): upperbound of 10 days for budget_duration values
    duration: "30d" # Optional[str], optional): upperbound of 30 days for all /key/generate requests
    max_parallel_requests: 1000 # (Optional[int], optional): Max number of requests that can be made in parallel. Defaults to None.
    tpm_limit: 1000 #(Optional[int], optional): Tpm limit. Defaults to None.
    rpm_limit: 1000 #(Optional[int], optional): Rpm limit. Defaults to None.

  key_generation_settings: # Restricts who can generate keys. [Further docs](./virtual_keys.md#restricting-key-generation)
    team_key_generation:
      allowed_team_member_roles: ["admin"]
    personal_key_generation: # maps to 'Default Team' on UI 
      allowed_user_roles: ["proxy_admin"]
```

## 進一步閱讀 {#further-reading}

- [為 AI 探索進行使用者上線](../tutorials/default_team_self_serve)
