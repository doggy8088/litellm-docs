---
sidebar_label: 將身分對應到存取群組
---

# 將身分對應到存取群組 {#map-identities-to-access-groups}

<SinceVersion v="1.110.0" />

<EnterpriseFeature feature="JWT authentication" />

根據 JWT claims 授予[存取群組](./access_groups.md)。例如，任何 `groups` claim 包含 `Anthropic_Access` 的 token，都會取得 `claude-models` 存取群組中的模型。

規則會在每個請求時評估，絕不會儲存到金鑰上。符合多條規則的 token 會取得所有這些群組，並加入其現有的存取權中。規則絕不會移除存取權。

## 設定 {#setup}

完成[身分提供者設定](./token_auth.md)，然後在 UI 或 API 中建立存取群組，並加入每個群組應授予的模型。將規則加入 `general_settings`，放在您的 JWT 設定旁邊。

```yaml
general_settings:
  access_group_rules:
    - attribute: jwt_claims.groups
      contains: Anthropic_Access
      access_group: claude-models

    - attribute: jwt_claims.groups
      contains: Gemini_Access
      access_group: gemini-models

    - attribute: jwt_claims.groups
      contains: Codex_Access
      access_group: codex-models
```

Claim 值與群組名稱僅供說明。

## 規則欄位 {#rule-fields}

| 欄位 | 說明 |
|-------|-------------|
| `attribute` | 要檢查的點路徑。必須以 `jwt_claims`、`user_id` 或 `user_role` 開頭，例如 `jwt_claims.realm_access.roles`。 |
| `contains` | 當屬性是包含此值的清單時符合。 |
| `equals` | 當屬性等於此值時符合。`contains` 與 `equals` 只能設定其中一個。 |
| `access_group` | 現有存取群組的名稱。 |

缺少 claim 或未知的群組名稱不會授予任何東西。
