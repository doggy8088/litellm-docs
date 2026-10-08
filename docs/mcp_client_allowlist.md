import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 允許列出 MCP 用戶端應用程式 {#allowlisting-mcp-client-applications}

使用允許清單來限制 MCP 閘道存取已核准的用戶端應用程式，例如 Claude Code、Cursor 或內部 CLI。LiteLLM 會在驗證後檢查用戶端身分，若不允許則回傳 HTTP 403。

此允許清單適用於整個閘道。既有的 [MCP 伺服器權限](./mcp_control.md) 仍適用於已允許的用戶端。

## 設定用戶端身分 {#configure-the-client-identity}

在已設定 [JWT 驗證](./proxy/token_auth.md) 的情況下，將 `mcp_client_id_jwt_field` 設為識別用戶端應用程式的 access-token claim：

| 身分提供者或 token 格式 | Client ID claim |
| --- | --- |
| [Okta](https://developer.okta.com/docs/api/openapi/okta-oauth/guides/overview/) | `cid` |
| [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference), v2 tokens | `azp` |
| Microsoft Entra ID, v1 tokens | `appid` |
| [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html) access tokens | `client_id` |

例如，將 claim 設定加入您的 JWT 設定並重新啟動 proxy：

```yaml title="config.yaml"
general_settings:
  enable_jwt_auth: true
  litellm_jwtauth:
    mcp_client_id_jwt_field: azp
```

巢狀 claim 支援點號表示法。當此設定已配置時，JWT 呼叫端必須具有相符的 claim；請求標頭無法覆寫遺失或未列出的 claim。

## 新增允許的用戶端 {#add-allowed-clients}

每個項目有兩個欄位：

| 欄位 | 用途 |
| --- | --- |
| `alias` | 在 Admin UI 與閘道記錄中的顯示名稱。 |
| `value` | 來自 token 的 Client ID。比對為完全相符且區分大小寫。 |

以下範例使用 `antigravity-cli` 與 `claude-code` 作為範例 client IDs。請使用您的身分提供者核發的值。

<Tabs>
<TabItem value="ui" label="Admin UI" default>

開啟 **MCP Servers → Network Settings → Allowed Clients**。

<Image
  img={require('../img/mcp_client_allowlist_ui_empty.png')}
  alt="MCP Network Settings 中的 Allowed Clients 區段"
  style={{width: '100%', display: 'block', margin: '0'}}
/>

按一下 **Add client**，輸入 **Alias** 與 **Value**，然後按一下 **Add**。對每個已核准的應用程式重複此步驟，並按一下 **Save**。若僅使用 JWT 存取，請將 **Client Identity Header** 保持空白。

<details>
<summary>編輯或移除用戶端</summary>

按一下用戶端卡片，編輯其欄位，按一下 **Done**，然後按一下 **Save**。若要移除，選取 **Remove client**，然後按一下 **Save**。

<Image
  img={require('../img/mcp_client_allowlist_ui_edit_dialog.png')}
  alt="含有 alias、value 與 Remove client 控制項的用戶端對話框"
  style={{width: '420px', maxWidth: '100%', display: 'block', margin: '0'}}
/>

</details>

</TabItem>
<TabItem value="config" label="config.yaml">

將 `mcp_allowed_clients` 新增到 `general_settings` 下方，然後重新啟動 proxy：

```yaml title="config.yaml"
general_settings:
  mcp_allowed_clients:
    - alias: Antigravity CLI
      value: antigravity-cli
    - alias: Claude Code
      value: claude-code
```

</TabItem>
<TabItem value="api" label="API">

```bash
curl "$LITELLM_PROXY_URL/config/field/update" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "field_name": "mcp_allowed_clients",
    "field_value": [
      {"alias": "Antigravity CLI", "value": "antigravity-cli"},
      {"alias": "Claude Code", "value": "claude-code"}
    ],
    "config_type": "general_settings"
  }'
```

</TabItem>
</Tabs>

在 `config.yaml` 中定義的設定具有優先權，且無法透過 Admin UI 或 API 變更。UI 與 API 更新會儲存在資料庫中。使用 Admin UI 或 API 時，請啟用 `store_model_in_db: true`，如此所有 worker 都會載入並重新整理資料庫設定。

## 驗證存取 {#verify-access}

使用有效的存取 token 為已允許的用戶端呼叫 [MCP REST API](./mcp_rest_api.md)：

```bash
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
  "$LITELLM_PROXY_URL/mcp-rest/tools/list" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

請使用未列出的用戶端以及其 token 未包含已設定 claim 的用戶端之有效 token 再重複一次。

| Token | 預期結果 |
| --- | --- |
| Client claim 符合已允許的 `value` | HTTP 200 |
| Client claim 未列出或遺失 | HTTP 403 |

遭拒絕的請求會記錄為 `Rejected MCP request from a disallowed client application: ...`。通過用戶端檢查不代表可存取其他 MCP 伺服器或工具。

## 選用的標頭身分 {#optional-header-identity}

對於不使用 JWT 驗證的呼叫端，請在 Admin UI 中設定 **Client Identity Header** 並按一下 **Save**，或將其新增到您的設定並重新啟動 proxy：

```yaml title="config.yaml"
general_settings:
  mcp_client_id_header: x-mcp-client
```

<Image
  img={require('../img/mcp_client_allowlist_ui_saved.png')}
  alt="已儲存的用戶端項目，含選用的 x-mcp-client 身分標頭"
  style={{width: '100%', display: 'block', margin: '0'}}
/>

請求的 `x-mcp-client` 值必須與已允許用戶端的 `value` 相符。當 `mcp_client_id_jwt_field` 未設定時，也會使用標頭身分。若已設定該 JWT 設定，JWT 呼叫端就無法退回使用標頭。

:::warning[由用戶端提供的身分]

用戶端可以變更標頭值。請使用 JWT 用戶端 claim 來取得受信任的應用程式身分。

:::

## 範圍與預設值 {#scope-and-defaults}

此檢查涵蓋 `/mcp`、`/mcp/sse`、`/mcp-rest/tools/list` 與 `/mcp-rest/tools/call`。

| `mcp_allowed_clients` | 行為 |
| --- | --- |
| 未設定或 `null` | 停用用戶端篩選。 |
| 有效且非空的清單 | 僅符合的用戶端身分可通過。 |
| `[]` 或無效清單 | 受允許清單約束的請求會被拒絕。項目必須包含非空的 `alias` 與 `value` 字串。 |

Dashboard 工作階段 token 不受此限制，包括在 dashboard 外使用時。其生命週期由 `LITELLM_UI_SESSION_DURATION` 控制（預設為 24 小時）。Admin UI 連線測試路由也不受限制。

## 移除或修復允許清單 {#remove-or-repair-the-allowlist}

若要在 Admin UI 中停用用戶端篩選，請移除所有用戶端卡片並按一下 **Save**。這會刪除該設定。改為透過 API 或設定儲存 `[]`，則會拒絕受允許清單約束的用戶端。

若要透過 API 移除資料庫中儲存的允許清單：

```bash
curl "$LITELLM_PROXY_URL/config/field/delete" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"field_name": "mcp_allowed_clients", "config_type": "general_settings"}'
```

空白或無效的已儲存清單會顯示警告。新增有效的用戶端項目並儲存，可恢復受限制的存取；或在沒有任何項目的情況下儲存，以停用篩選。

<Image
  img={require('../img/mcp_client_allowlist_ui_deny_all.png')}
  alt="警告：已儲存的允許清單會拒絕用戶端存取"
  style={{width: '100%', display: 'block', margin: '0'}}
/>
