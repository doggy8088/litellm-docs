# ✨ SSO 登入事件 Hook {#-event-hooks-for-sso-login}

:::info
✨ SSO 最多可免費供 5 位使用者使用。超過後需要企業授權。[在此開始使用 Enterprise](https://www.litellm.ai/enterprise)
:::

## 總覽 {#overview}

LiteLLM 會根據您的驗證設定，提供兩種不同的 SSO hook：

| Hook 類型 | 何時使用 | 功能 |
|-----------|-------------|--------------|
| **自訂 UI SSO 登入處理器** | 您在 LiteLLM 前方使用 OAuth proxy（oauth2-proxy、Gatekeeper、Vouch 等） | 從 request headers 解析使用者資訊，並將使用者登入 UI |
| **自訂 SSO 處理器** | 您使用直接 SSO 提供者（Google、Microsoft、SAML），並且想要在驗證後執行自訂邏輯 | 在標準 OAuth 流程後執行自訂程式碼，以設定使用者權限/團隊 |

**快速決策指南：**
- ✅ **使用自訂 UI SSO 登入處理器**：如果使用者驗證發生在 LiteLLM 之外（透過 headers）
- ✅ **使用自訂 SSO 處理器**：如果您希望 LiteLLM 處理 OAuth 流程，然後再執行自訂邏輯

---

## 選項 1：自訂 UI SSO 登入處理器 {#option-1-custom-ui-sso-sign-in-handler}

當您在 **LiteLLM 前方有一個 OAuth proxy**，而該 proxy 已經完成使用者驗證，並透過 request headers 傳遞使用者資訊時，請使用此方式。

### 運作方式 {#how-it-works}
- 使用者進入 Admin UI  
- 👉 **會呼叫您的自訂 SSO 登入處理器來解析 request headers 並回傳使用者資訊**
- LiteLLM 已從您的自訂處理器取得使用者資訊
- 使用者登入 UI

### 使用方式 {#usage}

#### 1. 建立自訂 UI SSO 處理器檔案 {#1-create-a-custom-ui-sso-handler-file}

此處理器會解析 request headers，並以 OpenID 物件回傳使用者資訊：

```python
from fastapi import Request
from fastapi_sso.sso.base import OpenID
from litellm.integrations.custom_sso_handler import CustomSSOLoginHandler


class MyCustomSSOLoginHandler(CustomSSOLoginHandler):
    """
    Custom handler for parsing OAuth proxy headers
    
    Use this when you have an OAuth proxy (like oauth2-proxy, Vouch, etc.) 
    in front of LiteLLM that adds user info to request headers
    """
    async def handle_custom_ui_sso_sign_in(
        self,
        request: Request,
    ) -> OpenID:
        # Parse headers from your OAuth proxy
        request_headers = dict(request.headers)
        
        # Extract user info from headers (adjust header names for your proxy)
        user_id = request_headers.get("x-forwarded-user") or request_headers.get("x-user")
        user_email = request_headers.get("x-forwarded-email") or request_headers.get("x-email")
        user_name = request_headers.get("x-forwarded-preferred-username") or request_headers.get("x-preferred-username")
        
        # Return OpenID object with user information
        return OpenID(
            id=user_id or "unknown",
            email=user_email or "unknown@example.com", 
            first_name=user_name or "Unknown",
            last_name="User",
            display_name=user_name or "Unknown User",
            picture=None,
            provider="oauth-proxy",
        )

# Create an instance to be used by LiteLLM
custom_ui_sso_sign_in_handler = MyCustomSSOLoginHandler()
```

#### 2. 在 config.yaml 中設定 {#2-configure-in-configyaml}

```yaml
model_list: 
  - model_name: "openai-model"
    litellm_params: 
      model: "gpt-3.5-turbo"

general_settings:
  custom_ui_sso_sign_in_handler: custom_sso_handler.custom_ui_sso_sign_in_handler

litellm_settings:
  drop_params: True
  set_verbose: True
```

#### 3. 啟動 proxy {#3-start-the-proxy}
```shell
$ litellm --config /path/to/config.yaml 
```

#### 4. 前往 Admin UI {#4-navigate-to-the-admin-ui}

當使用者嘗試前往 LiteLLM Admin UI 時，請求會被路由到您的自訂 UI SSO 登入處理器。 

---

## 選項 2：自訂 SSO 處理器（驗證後） {#option-2-custom-sso-handler-post-authentication}

如果您想在使用者使用標準 SSO 提供者（Google、Microsoft 等）登入 LiteLLM UI 後執行自己的程式碼，請使用此方式。

### 運作方式 {#how-it-works-1}
- 使用者進入 Admin UI
- LiteLLM 將使用者重新導向至您的 SSO 提供者（Google、Microsoft 等）
- 您的 SSO 提供者將使用者重新導向回 LiteLLM  
- LiteLLM 已從您的 IDP 取得使用者資訊
- 👉 **會呼叫您的自訂 SSO 處理器，並回傳 SSOUserDefinedValues 型別的物件**
- 使用者登入 UI

### 使用方式 {#usage-1}

#### 1. 建立自訂 SSO 處理器檔案 {#1-create-a-custom-sso-handler-file}

請確保回應型別符合 `SSOUserDefinedValues` pydantic 物件。這會用於將使用者登入 Admin UI：

```python
from fastapi_sso.sso.base import OpenID

from litellm.proxy._types import LitellmUserRoles, SSOUserDefinedValues
from litellm.proxy import proxy_server

# These imports are available if you need to create users or manage team membership:
# from litellm.proxy.management_endpoints.internal_user_endpoints import new_user
# from litellm.proxy.management_endpoints.team_endpoints import add_new_member


async def custom_sso_handler(userIDPInfo: OpenID) -> SSOUserDefinedValues:
    try:
        print("inside custom sso handler")  # noqa
        print(f"userIDPInfo: {userIDPInfo}")  # noqa

        if userIDPInfo.id is None:
            raise ValueError(
                f"No ID found for user. userIDPInfo.id is None {userIDPInfo}"
            )
        
        #################################################
        # Access extra fields from SSO provider (requires GENERIC_USER_EXTRA_ATTRIBUTES env var)
        # Example: Set GENERIC_USER_EXTRA_ATTRIBUTES="department,employee_id,groups"
        extra_fields = getattr(userIDPInfo, 'extra_fields', None) or {}
        user_department = extra_fields.get("department")
        employee_id = extra_fields.get("employee_id")
        user_groups = extra_fields.get("groups", [])
        
        print(f"User department: {user_department}")  # noqa
        print(f"Employee ID: {employee_id}")  # noqa
        print(f"User groups: {user_groups}")  # noqa
        #################################################

        #################################################
        # Run your custom code / logic here
        # check if user exists in litellm proxy DB
        if proxy_server.prisma_client is not None:
            _user_info = await proxy_server.prisma_client.get_data(user_id=userIDPInfo.id)
            print("_user_info from litellm DB ", _user_info)  # noqa
        #################################################

        return SSOUserDefinedValues(
            models=[],                                      # models user has access to
            user_id=userIDPInfo.id,                         # user id to use in the LiteLLM DB
            user_email=userIDPInfo.email,                   # user email to use in the LiteLLM DB
            user_role=LitellmUserRoles.INTERNAL_USER.value, # role to use for the user 
            max_budget=0.01,                                # Max budget for this UI login Session
            budget_duration="1d",                           # Duration of the budget for this UI login Session, 1d, 2d, 30d ...
        )
    except Exception as e:
        raise Exception("Failed custom auth")
```

#### 2. 在 config.yaml 中設定 {#2-configure-in-configyaml-1}

將檔案路徑傳入 config.yaml。 

例如，如果它們都在同一個目錄中 - `./config.yaml` 和 `./custom_sso.py`，如下所示：

```yaml 
model_list: 
  - model_name: "openai-model"
    litellm_params: 
      model: "gpt-3.5-turbo"

general_settings:
  custom_sso: custom_sso.custom_sso_handler

litellm_settings:
  drop_params: True
  set_verbose: True
```

#### 3. 啟動 proxy {#3-start-the-proxy-1}
```shell
$ litellm --config /path/to/config.yaml 
```
