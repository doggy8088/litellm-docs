import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Linear MCP 伺服器 {#linear-mcp-server}

> 透過 LiteLLM MCP Gateway 連接 Linear 的代管遠端 MCP 伺服器，以處理議題、專案、週期與留言。

Linear 會集中代管並管理此伺服器，因此您無需自行部署或執行任何內容。LiteLLM 提供集中式驗證、依金鑰與團隊的存取控制、每次工具呼叫的成本追蹤，以及您公開的每個 MCP 伺服器共用的一份稽核軌跡。

## 何時應該使用此伺服器 {#when-should-you-use-this-server}

- 讓代理程式在工作的討論處直接建立、分流或更新議題
- 在規劃或估算前，將目前的週期與專案狀態帶入作為內容
- 讓程式編寫代理程式取得其正在實作的票券，接著回覆進度留言

## 主要功能 {#key-features}

- 專用的唯讀端點，因此您可以提供 Linear 內容，而不授予建立或編輯任何內容的能力
- 由 Linear 透過 Streamable HTTP 代管；較舊的 SSE 端點僅作為已淘汰的備援保留
- 用於 OAuth 的動態用戶端註冊，加上供沒有真人可登入的後端代理程式使用的 API 金鑰路徑

## 驗證 {#authentication}

- **方法：** 使用具使用者 token 的 OAuth 2.1，並遵守每位呼叫者既有的 Linear 權限。Linear 支援 [動態用戶端註冊](https://datatracker.ietf.org/doc/html/rfc7591)，因此不需要管理 client ID 或 secret。
- **替代方案：** 以 bearer token 方式傳送的 Linear API 金鑰。這是一個共用身分，而非每位使用者各自一個，因此請將它保留給唯讀內容來源與無人值守的後端代理程式。

## 端點 {#endpoint}

**遠端 MCP 伺服器：**

```
https://mcp.linear.app/mcp
```

**唯讀：**

```
https://mcp.linear.app/mcp/readonly
```

Linear 也提供 `https://mcp.linear.app/sse` 作為不支援 Streamable HTTP 的用戶端的已淘汰備援。新設定請使用 `/mcp` 端點。

***

## 透過 LiteLLM MCP Gateway 連接 {#connect-via-litellm-mcp-gateway}

:::warning[請勿留下用戶端憑證]
請勿在 OAuth 伺服器上設定 `client_id`、`client_secret` 或 `token_url`。這會把它切換為每位呼叫者共用的機器對機器身分，因此議題會由同一個服務帳號建立，而不是由提出請求的人建立。Linear 的動態註冊讓它們變得不必要。如果您真的想要共用身分，請使用下方的 API 金鑰分頁，因為那裡明確說明了這點。
:::

### 步驟 1：在 LiteLLM 中註冊伺服器 {#step-1-register-the-server-in-litellm}

<Tabs>
<TabItem value="ui" label="LiteLLM UI">

前往 **MCP Servers**，點選 **+ Add New MCP Server**，並設定：

| 欄位 | 值 |
|---|---|
| **Server Name** | `linear_mcp` |
| **Transport** | HTTP |
| **Server URL** | `https://mcp.linear.app/mcp` |
| **Authentication** | OAuth |
| **OAuth flow type** | Interactive (PKCE) |
| **Client ID / Client Secret** | 留空 |

點選 **Create MCP Server**，接著開啟該伺服器的 **MCP Tools** 分頁以確認連線。第一次列出會帶您完成 Linear 登入。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  linear_mcp:
    url: "https://mcp.linear.app/mcp"
    transport: "http"
    description: "Linear issues, projects, and cycles"
    auth_type: oauth2
    oauth2_flow: authorization_code
```

`oauth2_flow: authorization_code` 會選擇互動式、每位使用者一份的流程，且為必要項目；如果 `auth_type: oauth2` 伺服器省略它，proxy 會拒絕啟動。儲存 MCP 伺服器也需要 `store_model_in_db: true`，相關內容見 [必要條件](../mcp.md#prerequisites)。

</TabItem>
<TabItem value="api-key" label="config.yaml (API key)">

若要使用共用的唯讀內容來源，或是讓沒有真人完成瀏覽器登入的後端代理程式進行驗證，請改用 Linear API 金鑰。請在 Linear 的 **Settings > Security & access > Personal API keys** 中建立，並只啟用 Read 權限，然後搭配唯讀端點使用：

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  linear_readonly:
    url: "https://mcp.linear.app/mcp/readonly"
    transport: "http"
    description: "Linear, read-only"
    auth_type: bearer_token
    auth_value: os.environ/LINEAR_API_KEY
```

所有呼叫者都會共用這個身分，因此工具呼叫會歸屬於金鑰擁有者，而非終端使用者。凡是面向使用者或會寫入的情況，請優先使用 OAuth。

</TabItem>
</Tabs>

### 步驟 2：設定 proxy 的公開來源 {#step-2-set-the-proxys-public-origin}

如果 LiteLLM 執行在 TLS 終止的 ingress 後方，請將 `PROXY_BASE_URL` 設為使用者在網址列中看到的來源，以便 OAuth callback 驗證通過：

```bash
PROXY_BASE_URL=https://llm.example.com
```

當您點選 **Connect** 時，不符會顯示為帶有 `{"detail":"invalid_request"}` 的 `400 Bad Request`。完整規則請見 [反向 proxy 與 ingress 設定](../mcp_oauth.md#reverse-proxy-and-ingress-configuration)。

### 步驟 3：從代理程式連接 {#step-3-connect-from-an-agent}

Gateway 會在 `http://localhost:4000/{server_name}/mcp` 提供每個伺服器，因此 `linear_mcp` 可透過 `http://localhost:4000/linear_mcp/mcp` 存取。

<Tabs>
<TabItem value="cursor" label="Claude Desktop / Cursor">

```json title="Claude Desktop / Cursor" showLineNumbers
{
  "mcpServers": {
    "linear": {
      "url": "http://localhost:4000/linear_mcp/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer sk-<your-litellm-api-key>"
      }
    }
  }
}
```

</TabItem>
<TabItem value="claude-code" label="Claude Code">

```bash showLineNumbers
claude mcp add --transport http linear http://localhost:4000/linear_mcp/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

第一次請求會開啟瀏覽器進行 Linear 登入。LiteLLM 會儲存該使用者的 token，並在之後更新，因此後續工作階段連線時不會再出現提示。

***

## 提供的工具 {#tools-provided}

:::info
Linear 會在執行時透過 `tools/list` 公布其工具定義，因此名稱與欄位可能在未通知的情況下變更。LiteLLM UI 中的 **MCP Tools** 分頁是您工作區所公開內容的唯一依據；它會列出即時工具，並讓您以測試參數呼叫其中一個。上游細節請參閱 Linear 的 [MCP 文件](https://linear.app/docs/mcp)。
:::

| 領域 | 工具 |
|---|---|
| Issues | `get_issue`, `list_issues`, `create_issue`, `update_issue`, `list_my_issues` |
| Issue metadata | `list_issue_statuses`, `get_issue_status`, `list_issue_labels` |
| Projects | `list_projects`, `get_project`, `create_project`, `update_project` |
| Comments | `list_comments`, `create_comment` |
| Documents | `get_document`, `list_documents` |
| Cycles | `list_cycles` |
| Teams | `list_teams` |

寫入僅限於 issues、projects 與 comments；documents、cycles、teams、statuses 與 labels 則為唯讀。LiteLLM 會以伺服器名稱作為工具名稱前綴，因此 `create_issue` 會以 `linear_mcp-create_issue` 的形式暴露給模型；請參閱 [工具命名](../mcp_rest_api.md#tool-naming)。

### 無寫入的讀取 {#reads-without-writes}

唯讀端點是只授予讀取權限最乾淨的方式，也是預設首選。在標準端點上，您也可以在同意時拒絕寫入 scope，或在設定中排除寫入工具來達成相同結果。請先對照您實際的工具清單確認名稱，因為一個已不再符合真實工具的 `disallowed_tools` 項目會失敗但不會發出警告，並讓該工具仍可被呼叫：

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  linear_mcp:
    url: "https://mcp.linear.app/mcp"
    transport: "http"
    auth_type: oauth2
    oauth2_flow: authorization_code
    disallowed_tools: ["create_issue", "update_issue", "create_project", "update_project", "create_comment"]
```

***

:::info[限制誰可以使用它]
透過 `object_permission` 依金鑰或依團隊授予伺服器存取權，並以 `mcp_rpm_limit` 限制每個伺服器的呼叫量，兩者皆見於 [MCP 權限管理](../mcp_control.md)。
:::

:::warning[將 LiteLLM 金鑰放在 `x-litellm-api-key`]
互動式 OAuth 需要讓 `Authorization` 標頭空出來供上游 token 使用。如果用戶端將 LiteLLM API 金鑰作為 `Authorization: Bearer sk-...` 傳送，OAuth 流程就不會執行，LiteLLM 也會把您的 LiteLLM 金鑰轉送給 Linear，而 Linear 會拒絕它。若要診斷，請加入 `x-litellm-mcp-debug: true` 並讀取回應標頭：`SAME_AS_LITELLM_KEY` 可確認這種情況，而 `m2m-client-credentials` 表示已設定用戶端憑證，且所有呼叫者共用同一個身分。請參閱 [OAuth 偵錯](../mcp_oauth.md#debugging-oauth) 與 [MCP 疑難排解指南](../mcp_troubleshoot.md)。
:::

已授權的工作階段會綁定到單一 Linear 工作區，且僅重新連線不會切換它，因此需要第二個工作區的使用者必須將它註冊為另一個獨立的 MCP 伺服器項目。
