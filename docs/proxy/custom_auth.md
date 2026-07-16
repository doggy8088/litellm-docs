# 自訂驗證  {#custom-auth}

您現在可以覆寫預設的 api key 驗證。

:::warning 使用自訂驗證的強制執行

預設情況下，自訂驗證只會強制執行您在回傳物件上設定的速率限制。預算與模型存取需要旗標。下表顯示每個控制項要在哪裡設定，以及需要哪些旗標。

:::

## 會被強制執行的項目 {#what-gets-enforced}

| 目標 | 設定位置 | 需要的旗標 |
| --- | --- | --- |
| key / user / team / end-user 速率限制 | 回傳物件（`rpm_limit`、`team_tpm_limit`、…） | 無 |
| 每個模型的速率限制，key / team 範圍 | 回傳物件上的 `metadata` / `team_metadata` | 無 |
| 每個模型的速率限制，project 範圍 | project 記錄（`model_tpm_limit` / `model_rpm_limit`） | `custom_auth_run_common_checks` |
| team / user / project 預算 | team / user / project 記錄 | `custom_auth_run_common_checks` |
| team / user / project 模型允許清單 | team / user / project 記錄 | `custom_auth_run_common_checks` |
| end-user 預算 | end-user 記錄 | `custom_auth_run_common_checks` 或 `enable_post_custom_auth_checks` |
| key 模型允許清單（`models`） | 回傳物件 | 兩個旗標都要 |
| key 每個模型的預算（`model_max_budget`） | 回傳物件 | `enable_post_custom_auth_checks` |
| key 到期（`expires`） | 回傳物件 | `enable_post_custom_auth_checks` |
| key 純量預算（`max_budget` / `soft_budget`） | 不支援；請使用每個範圍的預算 | 不適用 |

**附註：** project 的每個模型限制在關閉旗標時會放在物件的 `project_metadata` 上，但一旦旗標開啟，DB 的 project 記錄會覆寫它，所以請在那裡設定。（透過 `team_metadata` 的 team 每個模型設定則一律保留在物件上。）

請參閱 [強制執行預算與模型存取](#enforce-budgets-and-model-access) 與 [key 層級強制執行](#key-level-enforcement) 以查看範例。

## 使用方式 {#usage}

#### 1. 建立自訂驗證檔案。  {#1-create-a-custom-auth-file}

請確認回應型別符合 `UserAPIKeyAuth` pydantic 物件。這會用於記錄該使用者 key 的使用量。

```python
from fastapi import Request
from litellm.proxy._types import UserAPIKeyAuth

async def user_api_key_auth(request: Request, api_key: str) -> UserAPIKeyAuth: 
    try: 
        modified_master_key = "sk-my-master-key"
        if api_key == modified_master_key:
            return UserAPIKeyAuth(api_key=api_key)
        raise Exception
    except: 
        raise Exception
```

#### 2. 傳入檔案路徑（相對於 config.yaml） {#2-pass-the-filepath-relative-to-the-configyaml}

將檔案路徑傳給 config.yaml 

例如，如果兩者都在同一個目錄中 - `./config.yaml` 和 `./custom_auth.py`，會長這樣：
```yaml 
model_list: 
  - model_name: "openai-model"
    litellm_params: 
      model: "gpt-3.5-turbo"

litellm_settings:
  drop_params: True
  set_verbose: True

general_settings:
  custom_auth: custom_auth.user_api_key_auth
```

[**實作程式碼**](https://github.com/BerriAI/litellm/blob/caf2a6b279ddbe89ebd1d8f4499f65715d684851/litellm/proxy/utils.py#L122)

#### 3. 啟動 proxy {#3-start-the-proxy}
```shell
$ litellm --config /path/to/config.yaml 
```

## UserAPIKeyAuth 欄位參考 {#userapikeyauth-fields-reference}

這些欄位會直接從回傳物件讀取，並在不需要旗標的情況下強制執行。預算與模型存取則會在旗標後方強制執行（見下方）。

### 身分 {#identity}

請求屬於誰。`*_id` 欄位也會告訴 LiteLLM 在 `custom_auth_run_common_checks: true` 時要載入哪些 DB 記錄。

```python
UserAPIKeyAuth(
    api_key: Optional[str] = None,                    # The API key (will be hashed automatically)
    token: Optional[str] = None,                      # Hashed token for internal use
    key_alias: Optional[str] = None,                  # Key alias for identification
    user_id: Optional[str] = None,                    # User identifier (also used to load the user record)
    user_email: Optional[str] = None,                 # User email address
    user_role: Optional[LitellmUserRoles] = None,     # User role (PROXY_ADMIN, INTERNAL_USER, etc.)
    team_id: Optional[str] = None,                    # Team identifier (also used to load the team record)
    org_id: Optional[str] = None,                     # Organization identifier (also used to load the org record)
    end_user_id: Optional[str] = None,                # End-user identifier (also used to load the end-user record)
)
```

### 速率限制 {#rate-limits}

下方所有範圍都會直接從回傳物件強制執行，不需要旗標。

```python
UserAPIKeyAuth(
    # Key
    tpm_limit: Optional[int] = None,
    rpm_limit: Optional[int] = None,
    # User
    user_tpm_limit: Optional[int] = None,
    user_rpm_limit: Optional[int] = None,
    # Team
    team_tpm_limit: Optional[int] = None,
    team_rpm_limit: Optional[int] = None,
    # Per team-member
    team_member_tpm_limit: Optional[int] = None,
    team_member_rpm_limit: Optional[int] = None,
    # Per end-user
    end_user_tpm_limit: Optional[int] = None,
    end_user_rpm_limit: Optional[int] = None,
    # Per-model (key / team scoped)
    metadata: Dict = {},          # e.g. {"model_tpm_limit": {...}, "model_rpm_limit": {...}}
    team_metadata: Optional[Dict] = None,  # same keys, team scoped
)
```

:::note

每個模型的速率限制是從 `metadata`（key）與 `team_metadata`（team）讀取，並以模型名稱作為索引。模型 key 必須與請求的 `model` 字串完全相同，否則會靜默略過該限制。

`rpm_limit_per_model` / `tpm_limit_per_model` 存在於物件上，但不會生效；請改用 `metadata` / `team_metadata`，或使用 project 記錄（見下方）。

:::

### 進階 {#advanced}

```python
UserAPIKeyAuth(
    max_parallel_requests: Optional[int] = None,      # Concurrent request limit
    allowed_model_region: Optional[AllowedModelRegion] = None,  # Geographic restrictions
    blocked: Optional[bool] = None,                   # Whether the key is blocked
    config: Dict = {},                                # Configuration settings
)
```

### 物件權限（MCP、agent 等） {#object-permission-mcp-agents-etc}

```python
from litellm.proxy._experimental.mcp_server.mcp_server_manager import (
    global_mcp_server_manager,
)

def _server_id(name: str) -> str:
    server = global_mcp_server_manager.get_mcp_server_by_name(name)
    if not server:
        raise ValueError(f"Unknown MCP server '{name}'")
    return server.server_id

object_permission = LiteLLM_ObjectPermissionTable(
    mcp_servers=[_server_id("deepwiki"), _server_id("everything")], # MCP servers this key is allowed to use
    mcp_tool_permissions={"deepwiki": ["search", "read_doc"]},      # optional per-server tool allow-list
)

UserAPIKeyAuth(
    object_permission=object_permission,
)
```

## 強制執行預算與模型存取 {#enforce-budgets-and-model-access}

設定 `custom_auth_run_common_checks: true` 以在自訂驗證之外一併強制執行預算與模型存取：

```yaml
general_settings:
  custom_auth: custom_auth.user_api_key_auth
  custom_auth_run_common_checks: true
```

您的處理常式會回傳這些 ID；預算與允許清單會存在對應的 DB 記錄（`/team/new`、`/user/new`、`/project/new`、`/customer/new`，或 UI）上，LiteLLM 會載入並強制執行。

例如，一個具有預算與模型允許清單的 team：

```bash
curl -X POST 'http://0.0.0.0:4000/team/new' \
  -H 'Authorization: Bearer sk-master-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "team_id": "eng-team",
    "max_budget": 100,
    "models": ["gpt-4o-mini", "claude-3-haiku"]
  }'
```

```python
# ...then return that team_id from custom auth:
return UserAPIKeyAuth(api_key=api_key, team_id="eng-team")
```

若要設定 project 的每個模型速率限制，請在 project 記錄上設定 `model_tpm_limit` / `model_rpm_limit`（以模型名稱作為索引），並回傳該 `project_id`：

```python
# On the project record (via /project/new or the UI):
#   model_tpm_limit = {"gpt-4o": 100000, "claude-3-haiku": 50000}
#   model_rpm_limit = {"gpt-4o": 100,    "claude-3-haiku": 200}
```

:::note

- project 記錄的 metadata 會取代您在回傳物件上設定的任何 `project_metadata`，因此請將 project 的每個模型限制設定在 project 記錄上，而不是物件上。
- 對於每個模型的速率限制，模型 key 必須與請求的 `model` 字串完全相同，否則會靜默略過該限制。這正是 Expedia 當時的實際失敗模式。

:::

### Key `models` 與 project `models` {#key-models-vs-project-models}

這些是不同的控制項：

| 欄位 | 強制執行位置 | 真實來源 |
| --- | --- | --- |
| `models` 於 `UserAPIKeyAuth` 上 | key 層級允許清單 | 您從自訂驗證回傳的值 |
| `project_id` 於 `UserAPIKeyAuth` 上 | project 層級允許清單 | LiteLLM 的 **DB 中 project 記錄** 上的 `models` |

空的 `models` 清單（`[]`）表示不限制。名稱必須與您設定中的 model group 完全一致（支援萬用字元）。請參閱 [Project Management](./project_management) 與 [Config Settings](./config_settings#all-settings)。

## Key 層級強制執行 {#key-level-enforcement}

以下項目會根據回傳物件強制執行，但只有在 `litellm.enable_post_custom_auth_checks: true` 也設定時才會生效：

```yaml
general_settings:
  custom_auth: custom_auth.user_api_key_auth
  custom_auth_run_common_checks: true   # required for the key models allowlist

litellm_settings:
  enable_post_custom_auth_checks: true
```

```python
from datetime import datetime, timedelta, timezone

return UserAPIKeyAuth(
    api_key=api_key,
    models=["gpt-4o-mini"],                                   # key model allowlist (needs both flags)
    model_max_budget={"gpt-4o": {"budget_limit": 100, "time_period": "30d"}},  # key per-model budget
    expires=datetime.now(timezone.utc) + timedelta(days=30),  # key expiry
)
```

當 `end_user_id` 已設定時，這條路徑也會強制執行 end-user 預算與每個模型的 end-user 預算。

## ✨ 支援 LiteLLM Virtual Keys + 自訂驗證 {#-support-litellm-virtual-keys--custom-auth}

自 v1.72.2+ 起支援

:::info 

✨ 支援 Custom Auth + LiteLLM Virtual Keys 是 LiteLLM Enterprise 的功能

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[取得 7 天免費試用 key](https://www.litellm.ai/enterprise#trial)
:::

### 使用方式 {#usage-1}

1. 設定自訂驗證檔案

```python
"""
Example custom auth function.

This will allow all keys starting with "my-custom-key" to pass through.
"""
from typing import Union

from fastapi import Request

from litellm.proxy._types import UserAPIKeyAuth


async def user_api_key_auth(
    request: Request, api_key: str
) -> Union[UserAPIKeyAuth, str]:
    try:
        if api_key.startswith("my-custom-key"):
            return "sk-P1zJMdsqCPNN54alZd_ETw"
        else:
            raise Exception("Invalid API key")
    except Exception:
        raise Exception("Invalid API key")

```

2. 設定 config.yaml

Key 變更集 `mode: auto`。這會同時檢查 litellm api key 驗證 + 自訂驗證。

```yaml
model_list: 
  - model_name: "openai-model"
    litellm_params: 
      model: "gpt-3.5-turbo"
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  custom_auth: custom_auth_auto.user_api_key_auth
  custom_auth_settings:
    mode: "auto" # can be 'on', 'off', 'auto' - 'auto' checks both litellm api key auth + custom auth
```

流程：
1. 先檢查自訂驗證
2. 如果自訂驗證失敗，則檢查 litellm api key 驗證
3. 如果兩者都失敗，回傳 401

3. 測試它！

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-P1zJMdsqCPNN54alZd_ETw' \
-d '{
    "model": "openai-model",
    "messages": [
          {
            "role": "user",
            "content": "Hey! My name is John"
          }
        ]
}'
```


#### 向上拋出自訂例外 {#bubble-up-custom-exceptions}

如果您想要向上拋出自訂例外，可以透過擲出 `ProxyException` 來達成。

```python
"""
Example custom auth function.

This will allow all keys starting with "my-custom-key" to pass through.
"""

from typing import Union

from fastapi import Request

from litellm.proxy._types import UserAPIKeyAuth, ProxyException


async def user_api_key_auth(
    request: Request, api_key: str
) -> Union[UserAPIKeyAuth, str]:
    try:
        if api_key.startswith("my-custom-key"):
            return "sk-P1zJMdsqCPNN54alZd_ETw"
        if api_key == "invalid-api-key":
            # raise a custom exception back to the client
            raise ProxyException(
                message="Invalid API key",
                type="invalid_request_error",
                param="api_key",
                code=401,
            )
        else:
            raise Exception("Invalid API key")
    except Exception:
        raise Exception("Invalid API key")

```
