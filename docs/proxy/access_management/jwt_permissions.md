---
title: JWT 權限
description: 為使用 JWT 驗證的呼叫者設定團隊模型存取、路由、角色與 scope。
---

# JWT 權限 {#jwt-permissions}

{/* keep-version-note */}

設定以 JWT 驗證的使用者與團隊可以在 LiteLLM 中做什麼。請先[驗證 token](../token_auth.md)並[對應其身分 claims](../jwt_user_team_auth.md)。將 proxy 連接到其資料庫，並設定下文使用的模型；這些範例使用 `my-model` 與 `my-embedding-model`。

<EnterpriseFeature feature="JWT-based Auth" />

這些設定適用於標準的 JWT 授權流程。若 JWT 連結到[虛擬金鑰](../jwt_key_mapping.md)，請在連結的金鑰上設定持續性的權限。標準的 JWT 角色與 scope 檢查會在備援路徑上執行，或在自動建立對應之前執行。

## 透過團隊授予模型存取權 {#control-model-access-with-teams}

建立一個 LiteLLM 團隊，其 `team_id` 與 token 的 `groups` claim 中的某個值相符。讓該團隊可以存取您設定的模型。

```bash
curl 'http://localhost:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "team_id": "engineering",
    "team_alias": "Engineering",
    "models": ["my-model"]
  }'
```

對您的提供者可以指派的每個團隊重複此步驟。JWT 中的團隊 ID 必須與 LiteLLM 團隊 ID 相符；兩個系統顯示相同名稱並不足夠。

除了[使用者與團隊 claim 對應](../jwt_user_team_auth.md)之外，再啟用以團隊為基礎的模型檢查：

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups"
    user_id_upsert: true
    enforce_team_based_model_access: true
```

`enforce_team_based_model_access` 要求必須有一個已解析的團隊授予所請求模型的存取權。若沒有明確選取團隊，LiteLLM 會選取第一個可以存取該模型的已宣告團隊。若沒有任何團隊授予該模型，請求會被拒絕。呼叫者團隊的解析方式請參閱[團隊選取](../jwt_user_team_auth.md#select-team-via-request-header)與[資料庫成員資格](../jwt_user_team_auth.md#use-database-team-memberships)。

若要在 Admin UI 中管理相同的授權，請參閱 [LLM 存取](./llm.md#give-a-team-access)。MCP 與代理程式資源請使用 [MCP 存取](./mcp.md)與[代理程式存取](./agents.md)。

## 從電子郵件網域建立使用者 {#upsert-users--allowed-email-domains}

若要將自動建立使用者限制在單一電子郵件網域，請加上電子郵件對應與網域檢查：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    user_email_jwt_field: "email"
    user_allowed_email_domain: "example.com"
    user_id_upsert: true
```

沒有 `user_allowed_email_domain` 時，此流程不會限制使用者的電子郵件網域。請在建立使用者之外，同時保持您的團隊或虛擬金鑰授權政策設定。

## 授予管理員存取權 {#set-accepted-jwt-scope-names}

預設的管理員 scope 是 `litellm_proxy_admin`。請設定您的提供者，只將該 scope 授予 proxy 管理員，或變更可接受的 scope：

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    admin_jwt_scope: "litellm-proxy-admin"
```

token 的 `scope` claim 可以是空格分隔的字串或清單。管理員 token 預設可以存取管理、支出與資訊路由。若要變更這些權限，請使用[允許的路由](#allowed-routes)。

```bash
curl 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"models": ["my-model"]}'
```

## 封鎖團隊 {#block-teams}

管理員不需要變更身分提供者即可封鎖團隊：

```bash
curl 'http://localhost:4000/team/block' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "engineering"}'
```

使用 `/team/unblock` 並傳入相同的請求內容即可還原存取權。

## 允許的路由 {#allowed-routes}

`admin_allowed_routes` 與 `team_allowed_routes` 接受具名路由群組、精確路徑，或以 `*` 結尾的前綴。

| 設定 | 預設存取 |
| --- | --- |
| `admin_allowed_routes` | 管理、支出追蹤、全域支出追蹤與資訊路由。 |
| `team_allowed_routes` | OpenAI 相容、資訊與 MCP 路由，外加 `/v1/messages`、`/v1/messages/count_tokens` 與 RAG 擷取/查詢路由。 |
| `public_allowed_routes` | `public_routes` 群組。 |

設定路由清單會取代其預設值。請包含呼叫者仍然需要的每個群組或路徑。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    team_id_jwt_field: "team_id"
    team_allowed_routes:
      - "openai_routes"
      - "info_routes"
      - "mcp_routes"
      - "anthropic_routes"
      - "/internal-models/*"
```

這裡的 `anthropic_routes` 包含比預設允許的兩個訊息路由更多的 Anthropic 端點。`/internal-models/*` 符合該前綴底下的路徑，但不符合單獨的 `/internal-models` 路徑。只支援結尾的 `*`。

其他路由群組包括 `google_routes`、`mapped_pass_through_routes`、`management_routes` 與 `spend_tracking_routes`。完整且最新的路由清單請參閱[原始碼中的 `LiteLLMRoutes`](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/_types.py)。

## 將提供者角色對應到權限（beta） {#beta-control-access-with-oidc-roles}

將提供者角色對應到 LiteLLM 角色，並使用 `role_permissions` 限制其模型與端點。設定 `enforce_rbac: true` 以強制執行這些權限。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    object_id_jwt_field: "oid"
    roles_jwt_field: "roles"
    role_mappings:
      - role: "litellm.api.consumer"
        internal_role: "team"
    enforce_rbac: true
  role_permissions:
    - role: "team"
      models: ["my-model"]
      routes: ["/v1/chat/completions"]
```

在此範例中，帶有 `roles: ["litellm.api.consumer"]` 的 token 會被視為團隊，`oid` 提供其團隊 ID。請在 LiteLLM 中佈建該團隊，或明確啟用 `team_id_upsert` 來建立它。角色對應不會取代 token 驗證或資料庫佈建。

支援的內部角色為 `team`、`internal_user` 與 `proxy_admin`。當角色決定同一個 claim 識別的是團隊還是使用者時，請使用 `object_id_jwt_field`。當這些身分有各自的 claim 時，請使用 `user_id_jwt_field` 與 `team_id_jwt_field`。此功能目前為 beta。

## 使用 scope 限制模型（beta） {#beta-control-model-access-with-scopes}

使用 `scope_mappings` 讓 token scope 可以存取特定的已設定模型名稱。設定 `enforce_scope_based_access: true` 以強制執行此對應。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    team_id_jwt_field: "client_id"
    scope_mappings:
      - scope: "litellm.api.consumer"
        models: ["my-model"]
      - scope: "litellm.api.embedding"
        models: ["my-embedding-model"]
    enforce_scope_based_access: true
    enforce_rbac: true
```

在發出請求之前，先建立由 `client_id` 識別的團隊，或設定團隊 upsert。token 的 `scope` 可以是清單或空格分隔的字串。帶有兩個 scope 的 token 可以呼叫任一模型，但仍受其其他存取檢查約束。模型名稱必須與 `model_list` 完全相符；此對應不會展開萬用字元模型名稱。此功能目前為 beta。

## 同步使用者角色與團隊（beta） {#beta-sync-user-roles-and-teams-with-idp}

啟用 `sync_user_role_and_teams`，即可在 JWT 驗證期間同步使用者的資料庫角色與團隊成員資格。在 token 中指派團隊 ID 之前，請先建立團隊。

```yaml
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: "sub"
    team_ids_jwt_field: "groups"
    roles_jwt_field: "roles"
    user_id_upsert: true
    sync_user_role_and_teams: true
    jwt_litellm_role_map:
      - jwt_role: "AI_ADMIN_*"
        litellm_role: "proxy_admin"
      - jwt_role: "AI_USER"
        litellm_role: "internal_user"
      - jwt_role: "AI_VIEWER"
        litellm_role: "internal_user_viewer"
```

`jwt_litellm_role_map` 接受提供者角色名稱的萬用字元模式。它會更新儲存的使用者角色；[`role_mappings`](#beta-control-access-with-oidc-roles) 則是為請求授權對應角色。

團隊同步會加入 JWT 中的成員資格，並移除 JWT 中沒有的成員資格。設定 `fallback_to_db_teams: true` 時，沒有團隊 claim 的 token 會保留資料庫中的成員資格；否則空的團隊清單可能會移除現有的成員資格。同步需要資料庫存取，並在驗證期間執行。此功能目前為 beta。

## 已註冊代理程式的政策 {#registered-agent-policies}

當已驗證的 JWT[識別出已註冊的代理程式](../jwt_auth_reference.md#bind-jwts-to-registered-agents)時，LiteLLM 會套用該代理程式的 trace ID 要求、MCP 限制與支出歸屬。請在代理程式上設定這些政策。例如：

```yaml
agents:
  - agent_name: research-agent-client-id
    agent_card_params:
      name: research-agent
      url: http://localhost:9999/a2a
      version: "1.0.0"
    litellm_params:
      require_trace_id_on_calls_by_agent: true
```

若 JWT 的已設定代理程式 claim 解析為 `research-agent-client-id`，就必須傳送 `x-litellm-trace-id`；否則其呼叫會傳回 `400`。若 JWT 解析為現有的虛擬金鑰對應，則改由該金鑰的 `agent_id` 決定呼叫者代理程式。

若要控制呼叫者可以呼叫哪些已註冊代理程式，請使用[代理程式存取](./agents.md)。

## 虛擬金鑰對應 {#virtual-key-mappings}

只有 proxy 管理員可以建立、更新或刪除對應。proxy 管理員與管理員檢視者可以列出並檢視它們。

對應存在後，LiteLLM 會驗證 JWT 並使用連結金鑰的權限。標準的 JWT 角色、scope、自訂驗證與電子郵件網域政策，會在使用備援路徑時或自動建立對應之前執行。持續性的權限請透過[存取管理](./overview.md)維護。

身分與金鑰的關係請透過[對應生命週期操作](../jwt_key_mapping.md#managing-mappings)管理。

## 疑難排解 {#troubleshooting}

若團隊或模型存取被拒絕，請檢查 claim 對應、現有的團隊 ID 或別名、所選團隊的模型授權，以及任何 `x-litellm-team-id` 選取項目。有效的 token 仍然需要有所請求資源與路由的權限。

簽章、發行者、對象或簽署金鑰的錯誤，請參閱 [JWT 疑難排解](../jwt_auth_reference.md#troubleshooting)。
