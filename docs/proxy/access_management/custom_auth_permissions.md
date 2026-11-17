---
title: 自訂驗證權限
sidebar_label: 自訂驗證權限
description: 設定自訂驗證之後套用的授權檢查。
---

# 自訂驗證權限 {#custom-auth-permissions}

{/* keep-version-note */}

請在[設定自訂驗證處理常式](../custom_auth.md)之後使用本參考文件。處理常式會以 `UserAPIKeyAuth` 物件識別呼叫者；下列欄位與旗標決定 LiteLLM 強制執行哪些權限與限制。

## 強制執行的項目 {#what-gets-enforced}

| 目標 | 設定位置 | 需要的旗標 |
| --- | --- | --- |
| 金鑰 / 使用者 / 團隊 / 終端使用者速率限制 | 傳回的物件（`rpm_limit`、`team_tpm_limit`、…） | 無 |
| 依模型的速率限制，金鑰 / 團隊範圍 | 傳回物件上的 `metadata` / `team_metadata` | 無 |
| 依模型的速率限制，專案範圍 | 專案記錄（`model_tpm_limit` / `model_rpm_limit`） | `custom_auth_run_common_checks` |
| 團隊 / 使用者 / 專案預算 | 團隊 / 使用者 / 專案記錄 | `custom_auth_run_common_checks` |
| 團隊 / 使用者 / 專案模型允許清單 | 團隊 / 使用者 / 專案記錄 | `custom_auth_run_common_checks` |
| 終端使用者預算 | 終端使用者記錄 | `custom_auth_run_common_checks` 或 `enable_post_custom_auth_checks` |
| 金鑰模型允許清單（`models`） | 傳回的物件 | 兩個旗標都要 |
| 金鑰依模型預算（`model_max_budget`） | 傳回的物件 | `enable_post_custom_auth_checks` |
| 金鑰到期（`expires`） | 傳回的物件 | `enable_post_custom_auth_checks` |
| 金鑰純量預算（`max_budget` / `soft_budget`） | 不支援；請改用依範圍的預算 | 不適用 |

**注意：**旗標關閉時，專案的依模型限制放在物件的 `project_metadata` 上；但旗標開啟後，資料庫中的專案記錄會覆寫它，所以請在專案記錄上設定。（團隊的依模型限制透過 `team_metadata`，永遠放在物件上。）

範例請參閱[強制執行預算與模型存取](#enforce-budgets-and-model-access)與[金鑰層級的強制執行](#key-level-enforcement)。

## 傳回物件的控制項 {#returned-object-controls}

### 速率限制 {#rate-limits}

下列所有範圍都直接從傳回的物件強制執行，不需要旗標。

```python
def UserAPIKeyAuth(
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
): ...
```

:::note

依模型的速率限制從 `metadata`（金鑰）與 `team_metadata`（團隊）讀取，以模型名稱為鍵。模型鍵必須與請求的 `model` 字串完全相同，否則限制會被靜默略過。

`rpm_limit_per_model` / `tpm_limit_per_model` 雖然存在於物件上，但沒有作用；請改用 `metadata` / `team_metadata`，或專案記錄（見下文）。

:::

### 其他控制項 {#advanced}

```python
def UserAPIKeyAuth(
    max_parallel_requests: Optional[int] = None,      # Concurrent request limit
    allowed_model_region: Optional[AllowedModelRegion] = None,  # Geographic restrictions
    blocked: Optional[bool] = None,                   # Whether the key is blocked
    config: Dict = {},                                # Configuration settings
): ...
```

### 物件權限 {#object-permission-mcp-agents-etc}

```python
from litellm.proxy._types import LiteLLM_ObjectPermissionTable, UserAPIKeyAuth
from litellm.proxy.mcp_server.mcp_server_manager import (
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

設定 `custom_auth_run_common_checks: true`，即可在自訂驗證之外一併強制執行預算與模型存取：

```yaml
general_settings:
  custom_auth: custom_auth.user_api_key_auth
  custom_auth_run_common_checks: true
```

您的處理常式傳回 ID；預算與允許清單位於對應的資料庫記錄上（`/team/new`、`/user/new`、`/project/new`、`/customer/new` 或 UI），由 LiteLLM 載入並強制執行。

例如，一個設有預算與模型允許清單的團隊：

```bash
curl -X POST 'http://localhost:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "team_id": "eng-team",
    "max_budget": 100,
    "models": ["{{openai_small}}", "{{anthropic}}"]
  }'
```

```python
# ...then return that team_id from custom auth:
return UserAPIKeyAuth(api_key=api_key, team_id="eng-team")
```

若要設定專案的依模型速率限制，請在專案記錄上設定 `model_tpm_limit` / `model_rpm_limit`（以模型名稱為鍵），並傳回該 `project_id`：

```python
# On the project record (via /project/new or the UI):
#   model_tpm_limit = {"{{openai_large}}": 100000, "{{anthropic}}": 50000}
#   model_rpm_limit = {"{{openai_large}}": 100,    "{{anthropic}}": 200}
```

:::note

- 專案記錄的中繼資料會取代您在傳回物件上設定的任何 `project_metadata`，所以請在專案記錄上設定專案的依模型限制，不要設在物件上。
- 依模型的速率限制中，模型鍵必須與請求的 `model` 字串完全相同，否則限制會被靜默略過。

:::

### 金鑰的 `models` 與專案的 `models` {#key-models-vs-project-models}

這是兩個分開的控制項：

| 欄位 | 強制執行位置 | 事實來源 |
| --- | --- | --- |
| `UserAPIKeyAuth` 上的 `models` | 金鑰層級允許清單 | 您從自訂驗證傳回的值 |
| `UserAPIKeyAuth` 上的 `project_id` | 專案層級允許清單 | **LiteLLM 資料庫中專案記錄**上的 `models` |

空的 `models` 清單（`[]`）表示沒有限制。名稱必須與您設定中的模型群組相符（支援萬用字元）。請參閱[專案管理](../project_management.md)與[設定選項](/docs/proxy/config_settings#litellm_settings---reference)。

## 金鑰層級的強制執行 {#key-level-enforcement}

下列項目會從傳回的物件強制執行，但前提是同時設定了 `litellm.enable_post_custom_auth_checks: true`：

```yaml
general_settings:
  custom_auth: custom_auth.user_api_key_auth
  custom_auth_run_common_checks: true   # required for the key models allowlist

litellm_settings:
  enable_post_custom_auth_checks: true
```

```python
return UserAPIKeyAuth(
    api_key=api_key,
    models=["{{openai_small}}"],                                   # key model allowlist (needs both flags)
    model_max_budget={"{{openai_large}}": {"budget_limit": 100, "time_period": "30d"}},  # key per-model budget
)
```

當 `end_user_id` 有設定時，這條路徑也會強制執行終端使用者預算與依模型的終端使用者預算。若要拒絕已到期的憑證，請依[token 到期](../custom_auth.md#token-expiration)所述傳回其原始到期時間。
