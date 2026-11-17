# SSO 登入的事件掛鉤 {#event-hooks-for-sso-login}

使用 Python 回呼，從上游驗證 proxy 讀取已驗證的身分，或自訂 SSO 登入後回傳的身分。

<EnterpriseFeature feature="SSO">SSO 在 5 位使用者以內免費。超過此數量需要企業授權。用於上游驗證 proxy 的自訂 UI 登入掛鉤需要 Enterprise。</EnterpriseFeature>

<a id="overview"></a>

## 運作方式 {#how-it-works}

請選擇與驗證發生位置相符的掛鉤：

| 掛鉤 | 執行時機 | 回傳值 |
| --- | --- | --- |
| `custom_ui_sso_sign_in_handler` | 上游驗證 proxy 已驗證使用者；掛鉤會讀取其身分標頭。 | `OpenID` |
| `custom_sso` | LiteLLM 已完成其提供者登入流程；回呼會收到提供者的使用者資訊。 | `SSOUserDefinedValues` |

LiteLLM 會使用回傳的身分完成登入。請透過 [SSO 權限](./access_management/sso_permissions.md) 設定角色、團隊成員資格與限制。

## 前置條件 {#prerequisites}

請使用已設定 Admin UI、資料庫與 master key 的可用 LiteLLM 部署。請將 handler 模組放在 `config.yaml` 旁邊，或放在 proxy 的 Python 匯入路徑上。

對於上游 proxy 掛鉤，請設定 proxy 驗證請求、移除用戶端提供的身分標頭，並設定其自身已驗證的值。請將對 LiteLLM 的直接存取限制為僅能透過該 proxy。請將 `general_settings.trusted_proxy_ranges` 設定為其直接對等端 IP 或 CIDR；LiteLLM 會拒絕來自不受信任對等端的標頭式登入。

對於登入後回呼，請先設定 [OpenID Connect](./admin_ui_sso.md) 或 [SAML](./saml_sso.md)，並驗證一次正常登入。

## 設定 {#setup}

### 從驗證 proxy 讀取身分標頭 {#option-1-custom-ui-sso-sign-in-handler}

<a id="usage"></a>
<a id="1-create-a-custom-ui-sso-handler-file"></a>

將此檔案儲存為 `custom_ui_sso.py`。請調整標頭名稱以符合您的驗證 proxy。身分缺失時請予以拒絕，不要指派共用的佔位使用者。

```python title="custom_ui_sso.py"
from fastapi import HTTPException, Request
from fastapi_sso.sso.base import OpenID
from litellm.integrations.custom_sso_handler import CustomSSOLoginHandler


class HeaderIdentityHandler(CustomSSOLoginHandler):
    async def handle_custom_ui_sso_sign_in(self, request: Request) -> OpenID:
        user_id = request.headers.get("x-forwarded-user") or request.headers.get("x-user")
        email = request.headers.get("x-forwarded-email") or request.headers.get("x-email")
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Missing authenticated identity")
        display_name = (
            request.headers.get("x-forwarded-preferred-username")
            or request.headers.get("x-preferred-username")
            or user_id
        )
        return OpenID(
            id=user_id,
            email=email,
            display_name=display_name,
            provider="oauth-proxy",
        )


custom_ui_sso_sign_in_handler = HeaderIdentityHandler()
```

<a id="2-configure-in-configyaml"></a>

將 handler 實例加入您現有的設定。請將範例位址替換為您的驗證 proxy 的直接對等端位址：

```yaml title="config.yaml"
general_settings:
  custom_ui_sso_sign_in_handler: custom_ui_sso.custom_ui_sso_sign_in_handler
  trusted_proxy_ranges: ["10.0.0.10/32"]
```

### 在提供者登入後自訂身分 {#option-2-custom-sso-handler-post-authentication}

<a id="how-it-works-1"></a>
<a id="usage-1"></a>
<a id="1-create-a-custom-sso-handler-file"></a>

將此檔案儲存為 `custom_sso.py`。回呼會在登入後收到提供者的使用者資訊，並回傳 LiteLLM 應使用的穩定使用者 ID 與電子郵件。

```python title="custom_sso.py"
from fastapi_sso.sso.base import OpenID
from litellm.proxy._types import SSOUserDefinedValues


async def custom_sso_handler(userIDPInfo: OpenID) -> SSOUserDefinedValues:
    if not userIDPInfo.id:
        raise ValueError("The identity provider returned no user ID")
    return SSOUserDefinedValues(
        user_id=userIDPInfo.id,
        user_email=userIDPInfo.email,
        user_role=None,
    )
```

`user_role=None` 會保留已儲存的 LiteLLM 角色；新使用者預設為 `internal_user_viewer`。明確指定的角色會在每次登入時覆寫它。請在 [SSO 權限](./access_management/sso_permissions.md) 中設定角色指派。

<a id="2-configure-in-configyaml-1"></a>

將回呼加入包含您的提供者設定的同一個設定檔：

```yaml title="config.yaml"
general_settings:
  custom_sso: custom_sso.custom_sso_handler
```

<a id="3-start-the-proxy"></a>
<a id="3-start-the-proxy-1"></a>

設定任一掛鉤後，請重新啟動 proxy：

```bash
litellm --config config.yaml
```

## 測試登入 {#test-sign-in}

<a id="4-navigate-to-the-admin-ui"></a>

對於上游 proxy 掛鉤，請透過驗證 proxy 開啟 Admin UI，並使用測試帳號登入。確認 LiteLLM 顯示該帳號。來自受信任 proxy 但缺少身分標頭的請求，應被範例 handler 拒絕；來自不受信任對等端的直接請求也應失敗。

對於登入後回呼，請開啟新的瀏覽器工作階段，透過您設定的提供者登入，並確認預期的帳號在 LiteLLM 中開啟。再次登入，檢查穩定的使用者 ID 是否解析到同一個帳號。

## 設定參考 {#configuration-reference}

| 設定或回呼 | 契約 |
| --- | --- |
| `general_settings.custom_ui_sso_sign_in_handler` | 指向 `CustomSSOLoginHandler` 實例的模組路徑。 |
| `handle_custom_ui_sso_sign_in(request)` | 從受信任請求回傳 `OpenID` 身分的非同步方法。 |
| `general_settings.trusted_proxy_ranges` | 允許提供身分標頭的直接對等端 IP 或 CIDR。 |
| `general_settings.custom_sso` | 指向接收提供者使用者資訊之非同步函式的模組路徑。 |
| `SSOUserDefinedValues` | 提供 `user_id`、`user_email` 與可選的覆寫值。權限欄位請參閱 [SSO 權限](./access_management/sso_permissions.md)。 |

### 讀取額外的提供者欄位 {#read-additional-provider-fields}

對於 generic 提供者，請將 `GENERIC_USER_EXTRA_ATTRIBUTES` 設定為您的回呼需要的欄位。它們可透過 `getattr(userIDPInfo, "extra_fields", None) or {}` 取得。設定方式請參閱 [OIDC 提供者欄位對應](./admin_ui_sso.md)。

使用回傳的身分進行驗證。使用者與團隊的生命週期操作，請參閱[身分佈建](./identity_provisioning.md)。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查 |
| --- | --- |
| 無法匯入 handler | 確認模組路徑與掛載的 Python 檔案。標頭掛鉤指向一個實例；`custom_sso` 指向一個函式。 |
| 標頭登入回報不受信任的 proxy | 為直接連到 LiteLLM 的對等端設定 `trusted_proxy_ranges`，並確認請求確實經過該 proxy。 |
| 標頭登入回報缺少身分 | 確認驗證 proxy 在驗證使用者後有設定預期的標頭。 |
| `user_custom_sso must be a coroutine function` | 使用 `async def` 定義登入後回呼。 |
| 重複登入建立了不同的使用者 | 回傳穩定且非空的提供者 ID，不要使用會變動的電子郵件或顯示名稱。 |
| 登入後角色或團隊不正確 | 檢查 [SSO 權限](./access_management/sso_permissions.md) 與回呼中的任何明確覆寫。 |

## 相關指南 {#related-guides}

透過 [OpenID Connect](./admin_ui_sso.md) 或 [SAML](./saml_sso.md) 設定提供者。存取政策請使用 [SSO 權限](./access_management/sso_permissions.md)，使用者生命週期管理請使用[身分佈建](./identity_provisioning.md)，API 請求 handler 請使用 [Custom Auth](./custom_auth.md)。
