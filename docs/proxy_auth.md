import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SDK 代理驗證（OAuth2/JWT 自動重新整理） {#sdk-proxy-authentication-oauth2jwt-auto-refresh}

在使用需要 JWT 驗證的 LiteLLM Proxy 搭配 LiteLLM Python SDK 時，自動取得並重新整理 OAuth2/JWT 權杖。

## 概覽 {#overview}

當您的 LiteLLM Proxy 受到 OAuth2/OIDC 提供者（Azure AD、Keycloak、Okta、Auth0 等）保護時，您的 SDK 用戶端需要在每次請求時都具備有效的 JWT 權杖。與其手動管理權杖生命週期，`litellm.proxy_auth` 會自動處理這些工作：

- 從您的身分提供者取得權杖
- 快取權杖以避免不必要的請求
- 在權杖過期前重新整理（60 秒緩衝）
- 將 `Authorization: Bearer <token>` 標頭注入每個請求

## 快速開始 {#quick-start}

### Azure AD {#azure-ad}

<Tabs>
<TabItem value="default" label="DefaultAzureCredential">

使用 [DefaultAzureCredential](https://learn.microsoft.com/en-us/python/api/azure-identity/azure.identity.defaultazurecredential) 鏈結（環境變數、受控身分、Azure CLI 等）：

```python
import litellm
from litellm.proxy_auth import AzureADCredential, ProxyAuthHandler

# One-time setup
litellm.proxy_auth = ProxyAuthHandler(
    credential=AzureADCredential(),  # uses DefaultAzureCredential
    scope="api://my-litellm-proxy/.default"
)
litellm.api_base = "https://my-proxy.example.com"

# All requests now include Authorization headers automatically
response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

</TabItem>
<TabItem value="client-secret" label="ClientSecretCredential">

使用特定的 Azure AD 應用程式註冊：

```python
import litellm
from azure.identity import ClientSecretCredential
from litellm.proxy_auth import AzureADCredential, ProxyAuthHandler

azure_cred = ClientSecretCredential(
    tenant_id="your-tenant-id",
    client_id="your-client-id",
    client_secret="your-client-secret"
)

litellm.proxy_auth = ProxyAuthHandler(
    credential=AzureADCredential(credential=azure_cred),
    scope="api://my-litellm-proxy/.default"
)
litellm.api_base = "https://my-proxy.example.com"

response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

</TabItem>
</Tabs>

**必要套件：** `uv add azure-identity`

### 通用 OAuth2（Okta、Auth0、Keycloak 等） {#generic-oauth2-okta-auth0-keycloak-etc}

可與任何支援 `client_credentials` 授權類型的 OAuth2 提供者搭配使用：

```python
import litellm
from litellm.proxy_auth import GenericOAuth2Credential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=GenericOAuth2Credential(
        client_id="your-client-id",
        client_secret="your-client-secret",
        token_url="https://your-idp.example.com/oauth2/token"
    ),
    scope="litellm_proxy_api"
)
litellm.api_base = "https://my-proxy.example.com"

response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 自訂憑證提供者 {#custom-credential-provider}

實作 `TokenCredential` 通訊協定即可使用任何驗證機制：

```python
import time
import litellm
from litellm.proxy_auth import AccessToken, ProxyAuthHandler

class MyCustomCredential:
    """Any class with a get_token(scope) -> AccessToken method works."""

    def get_token(self, scope: str) -> AccessToken:
        # Your custom logic to obtain a token
        token = my_auth_system.get_jwt(scope=scope)
        return AccessToken(
            token=token,
            expires_on=int(time.time()) + 3600
        )

litellm.proxy_auth = ProxyAuthHandler(
    credential=MyCustomCredential(),
    scope="my-scope"
)
```

## 支援的端點 {#supported-endpoints}

會自動注入驗證標頭於：

| 端點 | 功能 |
|----------|----------|
| 聊天補全 | `litellm.completion()` / `litellm.acompletion()` |
| 嵌入 | `litellm.embedding()` / `litellm.aembedding()` |

## 運作方式 {#how-it-works}

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Your    │     │  ProxyAuthHandler │     │   Identity   │     │  LiteLLM     │
│  Code    │────▶│  (token cache)   │────▶│   Provider   │     │  Proxy       │
│          │     │                  │◀────│  (Azure AD,  │     │              │
│          │     │                  │     │   Okta, etc) │     │              │
│          │     └────────┬─────────┘     └──────────────┘     │              │
│          │              │ Authorization: Bearer <token>      │              │
│          │──────────────┼───────────────────────────────────▶│              │
│          │◀─────────────┼────────────────────────────────────│              │
└──────────┘              │                                    └──────────────┘
```

1. 您在啟動時一次設定 `litellm.proxy_auth`
2. 每次 SDK 呼叫（`completion()`、`embedding()`）時，處理器會檢查其快取的權杖
3. 如果權杖遺失或在 60 秒內過期，便會向您的身分提供者要求新的權杖
4. `Authorization: Bearer <token>` 標頭會注入到請求中
5. 如果取得權杖失敗，系統會記錄警告，且請求會在沒有驗證標頭的情況下繼續

## API 參考 {#api-reference}

### ProxyAuthHandler {#proxyauthhandler}

管理權杖生命週期的主要處理器。

```python
from litellm.proxy_auth import ProxyAuthHandler

handler = ProxyAuthHandler(
    credential=<TokenCredential>,  # required - credential provider
    scope="<oauth2-scope>"         # required - OAuth2 scope to request
)
```

| 參數 | 型別 | 必要 | 說明 |
|-----------|------|----------|-------------|
| `credential` | `TokenCredential` | 是 | 憑證提供者（AzureADCredential、GenericOAuth2Credential，或自訂） |
| `scope` | `str` | 是 | 要為其請求權杖的 OAuth2 範圍 |

**方法：**

| 方法 | 回傳 | 說明 |
|--------|---------|-------------|
| `get_token()` | `AccessToken` | 取得有效權杖，必要時重新整理 |
| `get_auth_headers()` | `dict` | 取得 `{"Authorization": "Bearer <token>"}` 標頭 |

### AzureADCredential {#azureadcredential}

以延遲初始化包裝任何 `azure-identity` 憑證。

```python
from litellm.proxy_auth import AzureADCredential

# Uses DefaultAzureCredential (recommended)
cred = AzureADCredential()

# Or wrap a specific azure-identity credential
from azure.identity import ManagedIdentityCredential
cred = AzureADCredential(credential=ManagedIdentityCredential())
```

| 參數 | 型別 | 必要 | 說明 |
|-----------|------|----------|-------------|
| `credential` | Azure `TokenCredential` | 否 | azure-identity 憑證。若為 `None`，則使用 `DefaultAzureCredential` |

### GenericOAuth2Credential {#genericoauth2credential}

適用於任何提供者的標準 OAuth2 用戶端憑證流程。

```python
from litellm.proxy_auth import GenericOAuth2Credential

cred = GenericOAuth2Credential(
    client_id="your-client-id",
    client_secret="your-client-secret",
    token_url="https://your-idp.com/oauth2/token"
)
```

| 參數 | 型別 | 必要 | 說明 |
|-----------|------|----------|-------------|
| `client_id` | `str` | 是 | OAuth2 用戶端 ID |
| `client_secret` | `str` | 是 | OAuth2 用戶端密鑰 |
| `token_url` | `str` | 是 | 權杖端點 URL |

### AccessToken {#accesstoken}

代表 OAuth2 存取權杖的資料類別。

```python
from litellm.proxy_auth import AccessToken

token = AccessToken(
    token="eyJhbG...",     # JWT string
    expires_on=1234567890  # Unix timestamp
)
```

### TokenCredential Protocol {#tokencredential-protocol}

任何實作此通訊協定的類別都可用作憑證提供者：

```python
from litellm.proxy_auth import AccessToken

class MyCredential:
    def get_token(self, scope: str) -> AccessToken:
        ...
```

## 各提供者專屬範例 {#provider-specific-examples}

### Keycloak {#keycloak}

```python
from litellm.proxy_auth import GenericOAuth2Credential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=GenericOAuth2Credential(
        client_id="litellm-client",
        client_secret="your-keycloak-client-secret",
        token_url="https://keycloak.example.com/realms/your-realm/protocol/openid-connect/token"
    ),
    scope="openid"
)
```

### Okta {#okta}

```python
from litellm.proxy_auth import GenericOAuth2Credential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=GenericOAuth2Credential(
        client_id="your-okta-client-id",
        client_secret="your-okta-client-secret",
        token_url="https://your-org.okta.com/oauth2/default/v1/token"
    ),
    scope="litellm_api"
)
```

### Auth0 {#auth0}

```python
from litellm.proxy_auth import GenericOAuth2Credential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=GenericOAuth2Credential(
        client_id="your-auth0-client-id",
        client_secret="your-auth0-client-secret",
        token_url="https://your-tenant.auth0.com/oauth/token"
    ),
    scope="https://my-proxy.example.com/api"
)
```

### 搭配受控身分的 Azure AD {#azure-ad-with-managed-identity}

```python
from azure.identity import ManagedIdentityCredential
from litellm.proxy_auth import AzureADCredential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=AzureADCredential(
        credential=ManagedIdentityCredential()
    ),
    scope="api://my-litellm-proxy/.default"
)
```

## 與 `use_litellm_proxy` 結合 {#combining-with-use_litellm_proxy}

您可以將 `proxy_auth` 與 [`use_litellm_proxy`](./providers/litellm_proxy#send-all-sdk-requests-to-litellm-proxy) 一起使用，將所有 SDK 請求透過已驗證的代理路由：

```python
import os
import litellm
from litellm.proxy_auth import AzureADCredential, ProxyAuthHandler

# Route all requests through the proxy
os.environ["LITELLM_PROXY_API_BASE"] = "https://my-proxy.example.com"
litellm.use_litellm_proxy = True

# Authenticate with OAuth2/JWT
litellm.proxy_auth = ProxyAuthHandler(
    credential=AzureADCredential(),
    scope="api://my-litellm-proxy/.default"
)

# This request goes through the proxy with automatic JWT auth
response = litellm.completion(
    model="vertex_ai/gemini-2.0-flash-001",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
