# 自訂驗證 {#custom-auth}

使用 Python handler 驗證 API 請求，該 handler 會驗證您應用程式的憑證，並傳回呼叫者的 LiteLLM 身分。

## 運作方式 {#how-it-works}

LiteLLM 會將 FastAPI `Request` 與 bearer 憑證傳給您的 async handler。驗證憑證後傳回 `UserAPIKeyAuth`，或擲出例外以拒絕它。傳回的身分會提供用量歸屬以及任何已設定的授權檢查。

:::warning[自訂驗證的強制執行]

傳回 `UserAPIKeyAuth` 並不會啟用每一項授權檢查。設定在該物件上的速率限制會直接套用；預算與模型存取需要額外的旗標。請使用 [自訂驗證權限](./access_management/custom_auth_permissions.md) 設定它們。

:::

## 前置條件 {#prerequisites}

先準備一個可運作的 proxy 與一個已設定的模型；範例使用 `my-model`。將您的 Python 模組放在 `config.yaml` 旁邊，或放在 proxy 的 Python import path 上。將範例使用的憑證儲存在 proxy 的 `CUSTOM_AUTH_TOKEN` 環境變數中。

對於既有的驗證服務，請將範例的憑證比對替換為該服務的驗證，並傳回其已驗證的身分。

<a id="usage"></a>

## 設定 {#setup}

### 1. 撰寫 handler {#1-create-a-custom-auth-file}

將它儲存為 `custom_auth.py`。此範例驗證一個應用程式的憑證，並將其識別為 `integration-client`。

```python title="custom_auth.py"
import os
from secrets import compare_digest

from fastapi import Request
from litellm.proxy._types import ProxyException, UserAPIKeyAuth


async def user_api_key_auth(request: Request, api_key: str) -> UserAPIKeyAuth:
    expected_token = os.environ["CUSTOM_AUTH_TOKEN"]
    if not expected_token or not api_key or not compare_digest(api_key, expected_token):
        raise ProxyException(
            message="Invalid credential",
            type="authentication_error",
            param="api_key",
            code=401,
        )
    return UserAPIKeyAuth(api_key=api_key, user_id="integration-client")
```

### 2. 設定 proxy {#2-pass-the-filepath-relative-to-the-configyaml}

將模組與函式名稱加入您既有的設定中。請保留您的模型與資料庫設定。

```yaml title="config.yaml"
general_settings:
  custom_auth: custom_auth.user_api_key_auth
```

### 3. 啟動 proxy {#3-start-the-proxy}

```bash
litellm --config config.yaml
```

## 測試驗證 {#test-authentication}

在您的用戶端環境中將 `CUSTOM_AUTH_TOKEN` 設為相同憑證，然後將它作為 bearer token 傳送：

```bash
curl 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $CUSTOM_AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"model":"my-model","messages":[{"role":"user","content":"Hello"}]}'
```

有效的憑證會通過驗證。再以不正確的憑證重複一次；範例會傳回 `401`。如果有效的呼叫者被拒絕使用某個模型或超過限制，請[另外檢查授權](./access_management/custom_auth_permissions.md)。

## 設定參考 {#configuration-reference}

### 呼叫者身分 {#userapikeyauth-fields-reference}

<a id="identity"></a>

傳回 LiteLLM 用於用量歸屬的身分欄位。當 `custom_auth_run_common_checks: true` 時，`*_id` 欄位也會識別所載入的資料庫記錄。

| 欄位 | 意義 |
| --- | --- |
| `api_key` | 呼叫者憑證；LiteLLM 會將它雜湊以供內部使用。 |
| `token` | 供內部使用的雜湊權杖。 |
| `key_alias` | 憑證的顯示名稱。 |
| `user_id`、`user_email` | 已驗證的呼叫者身分。 |
| `user_role` | LiteLLM 角色；請參閱[角色與權限](./access_management/custom_auth_permissions.md)。 |
| `team_id`、`org_id`、`end_user_id` | 請求的團隊、組織與終端使用者身分。 |

模型權限、預算與速率限制欄位請使用 [自訂驗證權限](./access_management/custom_auth_permissions.md)。

### 權杖到期 {#token-expiration}

以 `expires` 傳回憑證的原始到期時間，並啟用到期檢查：

```yaml
litellm_settings:
  enable_post_custom_auth_checks: true
```

此 helper 接受從您的憑證驗證器取得的到期時間：

```python
from datetime import datetime
from litellm.proxy._types import UserAPIKeyAuth


def authentication_result(api_key: str, expires_at: datetime) -> UserAPIKeyAuth:
    return UserAPIKeyAuth(api_key=api_key, expires=expires_at)
```

請使用帶有時區資訊的到期時間。在每個請求時以目前時間重新計算，會不斷延長憑證的生命週期。

### 同時接受 Virtual Keys 與自訂憑證 {#support-litellm-virtual-keys--custom-auth}

<a id="usage-1"></a>

<SinceVersion v="1.72.2" />

<EnterpriseFeature feature="Using Custom Auth with LiteLLM Virtual Keys" />

設定 `mode: auto` 可先嘗試自訂 handler，並在它擲出一般例外時備援到正常的 Virtual Key 驗證。`ProxyException` 是明確的拒絕，不會觸發備援。

Handler 也可以在驗證外部憑證後傳回既有的 Virtual Key 字串。LiteLLM 接著會透過其正常路徑驗證該金鑰：

```python title="custom_auth_auto.py"
import os
from secrets import compare_digest

from fastapi import Request


async def user_api_key_auth(request: Request, api_key: str) -> str:
    expected_token = os.environ["CUSTOM_AUTH_TOKEN"]
    if not expected_token:
        raise ValueError("Custom credential is not configured")
    if api_key and compare_digest(api_key, expected_token):
        return os.environ["LITELLM_VIRTUAL_KEY"]
    raise ValueError("Credential not handled by custom auth")
```

在 proxy 上將 `LITELLM_VIRTUAL_KEY` 設為既有的金鑰，然後設定 handler：

```yaml
general_settings:
  custom_auth: custom_auth_auto.user_api_key_auth
  custom_auth_settings:
    mode: auto
```

以外部憑證與既有的 Virtual Key 測試。兩者都應通過驗證。兩條路徑都不接受的憑證會被拒絕。

| 模式 | 行為 |
| --- | --- |
| `on` | 執行自訂 handler。在未設定 `custom_auth_settings` 而設定了自訂驗證時，這也是其行為。 |
| `off` | 略過自訂 handler，使用正常驗證。 |
| `auto` | 嘗試自訂 handler；一般例外會備援到正常驗證。`ProxyException` 會被向上傳播。 |

### 傳回特定錯誤 {#bubble-up-custom-exceptions}

如設定範例所示，擲出帶有回應訊息與 HTTP 代碼的 `ProxyException`。讓它從 handler 向上傳播。攔截它並擲出一般例外會丟棄預期的回應，並可能在 `auto` 模式下啟用備援。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查 |
| --- | --- |
| Handler 無法匯入 | 確認檔案名稱、函式名稱、import path 與掛載的檔案與 `general_settings.custom_auth` 相符。 |
| 每個憑證都被拒絕 | 確認驗證器的設定與祕密存在於 proxy 處理程序中。 |
| Virtual Key 在備援前就被拒絕 | 在 `auto` 模式下，對於自訂 handler 不處理的憑證，請擲出一般例外。`ProxyException` 保留給明確拒絕。 |
| 自訂錯誤詳細資訊消失 | 移除會攔截所有例外並取代 `ProxyException` 的 handler。 |
| 已到期的憑證仍可使用 | 傳回其原始 `expires` 值，並啟用 `enable_post_custom_auth_checks`。 |
| 預算或模型限制未套用 | 檢查[自訂驗證強制執行旗標](./access_management/custom_auth_permissions.md#what-gets-enforced)。 |

## 相關指南 {#related-guides}

授權請使用 [自訂驗證權限](./access_management/custom_auth_permissions.md)，憑證管理請使用 [Virtual Keys](./virtual_keys.md)，瀏覽器登入回呼請使用[自訂 SSO hooks](./custom_sso.md)。
