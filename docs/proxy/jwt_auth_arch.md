import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 OIDC（Azure AD/Keycloak/etc.）控管模型存取 {#control-model-access-with-oidc-azure-adkeycloaketc}

:::info

✨ JWT Auth 僅適用於 LiteLLM Enterprise

[企業價格](https://www.litellm.ai/#pricing)

[取得 7 天免費試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

<Image img={require('../../img/control_model_access_jwt.png')} style={{ width: '100%', maxWidth: '4000px' }} />

## 範例 Token  {#example-token}

<Tabs>
<TabItem value="Azure AD">

```bash
{
  "sub": "1234567890",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "roles": ["basic_user"] # 👈 ROLE
}
```
</TabItem>
<TabItem value="Keycloak">

```bash
{
  "sub": "1234567890",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "resource_access": {
    "litellm-test-client-id": {
      "roles": ["basic_user"] # 👈 ROLE
    }
  }
}
```
</TabItem>
</Tabs>

## Proxy 設定 {#proxy-configuration}

<Tabs>
<TabItem value="Azure AD">

```yaml
general_settings:
  enable_jwt_auth: True 
  litellm_jwtauth:
    user_roles_jwt_field: "roles" # the field in the JWT that contains the roles 
    user_allowed_roles: ["basic_user"] # roles that map to an 'internal_user' role on LiteLLM 
    enforce_rbac: true # if true, will check if the user has the correct role to access the model
  
  role_permissions: # control what models are allowed for each role
    - role: internal_user
      models: ["anthropic-claude"]

model_list:
    - model: anthropic-claude
      litellm_params:
        model: claude-3-5-haiku-20241022
    - model: openai-gpt-4o
      litellm_params:
        model: gpt-4o
```

</TabItem>
<TabItem value="Keycloak">

```yaml
general_settings:
  enable_jwt_auth: True 
  litellm_jwtauth:
    user_roles_jwt_field: "resource_access.litellm-test-client-id.roles" # the field in the JWT that contains the roles
    user_allowed_roles: ["basic_user"] # roles that map to an 'internal_user' role on LiteLLM 
    enforce_rbac: true # if true, will check if the user has the correct role to access the model
  
  role_permissions: # control what models are allowed for each role
    - role: internal_user
      models: ["anthropic-claude"]

model_list:
    - model: anthropic-claude
      litellm_params:
        model: claude-3-5-haiku-20241022
    - model: openai-gpt-4o
      litellm_params:
        model: gpt-4o
```

</TabItem>
</Tabs>

## 運作方式 {#how-it-works}

1. 指定 JWT_PUBLIC_KEY_URL - 這是您的 OpenID 提供者的公開金鑰端點。對於 Azure AD，為 `https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys`。對於 Keycloak，為 `{keycloak_base_url}/realms/{your-realm}/protocol/openid-connect/certs`。

1. 將 JWT 角色對應至 LiteLLM 角色 - 透過 `user_roles_jwt_field` 和 `user_allowed_roles` 完成
    -  目前僅支援 `internal_user` 進行角色對應。 
2. 指定模型存取： 
    - `role_permissions`：控管每個角色可允許使用的模型。 
        - `role`：用來控管存取權的 LiteLLM 角色。允許的角色 = ["internal_user", "proxy_admin", "team"]
        - `models`：該角色允許存取的模型清單。 
    - `model_list`：proxy 上的父層模型清單。[了解更多](./configs.md#llm-configs-model_list)

3. 模型檢查：proxy 會對接收到的 JWT 執行驗證檢查。[程式碼](https://github.com/BerriAI/litellm/blob/3a4f5b23b5025b87b6d969f2485cc9bc741f9ba6/litellm/proxy/auth/user_api_key_auth.py#L284)
