import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Microsoft 365 MCP server {#microsoft-365-mcp-server}

> 透過 Microsoft Graph 存取 Outlook 郵件與行事曆、OneDrive 與 SharePoint 檔案，以及 Teams，且每次工具呼叫都會在已登入使用者自己的 Entra ID 帳戶下執行。

Microsoft Graph 是 Microsoft 365 背後的 API，而開放原始碼 [ms-365-mcp-server](https://github.com/Softeria/ms-365-mcp-server) 透過 MCP 將其公開。您將該伺服器與 proxy 並排，透過 Streamable HTTP 執行；它不會登入任何人，而是使用請求上帶來的任何 bearer token 呼叫 Graph，LiteLLM 則提供該 token：它會為每位使用者執行 Entra ID 登入，將產生的 Graph token 儲存在對應的 LiteLLM 使用者下，並將其附加到每次工具呼叫。此過程不涉及共享信箱憑證或租用戶範圍的應用程式密鑰。LiteLLM 增加了集中式驗證、依金鑰與團隊進行的存取控制、每次工具呼叫的成本追蹤，以及涵蓋您公開的每個 MCP 伺服器的單一稽核軌跡。

該伺服器僅將 MCP 請求轉換為 Graph 請求。登入、同意、token 儲存與重新整理都發生在 LiteLLM 與 Entra ID 之間，因此更換伺服器不會改變使用者的驗證方式：任何以其收到的 `Authorization: Bearer` token 呼叫 Graph 的 MCP 伺服器，都能搭配相同的 LiteLLM 組態與不同的 `url` 運作。

## 您何時應該使用此伺服器 {#when-should-you-use-this-server}

- 讓代理程式取得使用者自己的收件匣與行事曆：收到什麼、已排定什麼、以及誰有空，而不需共享服務信箱
- 在回答前先擷取 SharePoint 與 OneDrive 文件作為檢索步驟，且僅限於該人已可開啟的內容
- 在同一個伺服器上讀取與發佈 Teams 聊天與頻道、管理 Planner 與 To Do 工作，並查詢 Excel 表格與 OneNote 頁面

## 主要功能 {#key-features}

- 透過 Entra ID 的每位使用者驗證：每位呼叫者都會在瀏覽器中同意一次，且每次工具呼叫都會攜帶其委派的 Graph 權限，因此代理程式看到的內容與使用者完全一致
- 工具範圍遵循應用程式註冊上的委派權限，因此唯讀部署與完整讀寫部署可使用相同伺服器，但範圍不同
- 涵蓋郵件、行事曆、聯絡人、OneDrive、SharePoint、Teams、Planner、To Do、OneNote、Excel、使用者與群組的 300+ 個工具，外加 `search-query` 與 `graph-batch`，以處理 Graph 公開的任何其他內容
- 以 Streamable HTTP 自我代管，因此 Graph 流量會保留在您的網路內

## 驗證 {#authentication}

- **方法：** 透過 Microsoft Entra ID 進行具 PKCE 的 OAuth 2.0 授權碼流程。Entra 不支援動態用戶端註冊，因此您需要註冊一個應用程式，並提供 LiteLLM 其 client ID 與 secret。接著 LiteLLM 會為該伺服器發布 OAuth 探索文件，將 MCP 用戶端指向位於 Entra 前方、LiteLLM 自己的登入端點（如下方 `per_server_oauth_discovery: true`）。
- **應用程式註冊：** 請在 [Microsoft Entra admin center](https://entra.microsoft.com) 的 **App registrations** 下建立一個。您將新增 Web redirect URI、client secret，以及委派的 Microsoft Graph 權限。
- **同意：** 每位使用者在首次登入時核准委派權限。若租用戶限制使用者自行同意，則需要管理員在應用程式註冊的 **API permissions** 頁面上一次性授予同意。

### 透過 Okta 或其他識別提供者進行單一登入 {#single-sign-on-through-okta-or-another-identity-provider}

Microsoft Graph 只接受 Entra ID 核發的 access token，因此無論是 Okta token，或是您 LiteLLM 單一登入取得的憑證，都不能取代 Graph token，LiteLLM 也不會將其中一個轉換成另一個。可沿用的是登入本身。當您的 Microsoft 365 租用戶將驗證聯邦到 Okta 或其他識別提供者時，LiteLLM 啟動的 Entra 登入會像任何其他 Microsoft 365 登入一樣重新導向到那裡，因此使用者會看到慣用的 SSO 頁面，而 Entra 會在他們返回後核發 Graph token。每位使用者只需執行一次；之後 LiteLLM 會重新整理該 token。

此設定中還會出現另外三種 LiteLLM 驗證模式，但都無法取代上述流程。[代表方 token 交換](../mcp_obo_auth.md) 會交換用戶端已提供給 LiteLLM 的 Entra ID token，因此只適用於使用者以 Entra ID token 驗證到 LiteLLM，而不是透過 Okta 的情況。[ID-JAG](../mcp_id_jag.md) 會從 Okta 授權伺服器取得 token，但 Graph 不信任該伺服器。[OAuth passthrough](../mcp_oauth_passthrough.md) 會原封不動地轉送用戶端的 bearer token 並不做交換，因此用戶端仍必須自行取得 Graph token。

## 端點 {#endpoint}

**自我代管 MCP 伺服器**（organization mode，埠 3000 上的 Streamable HTTP）：

```bash
npx -y @softeria/ms-365-mcp-server --http 3000 --org-mode
```

接著伺服器會監聽於 `http://localhost:3000/mcp`。`--http` 讓它在每次請求時接收 bearer token，也就是 LiteLLM 轉送的那個，而不是自行登入；它只會檢查 token 是否存在且尚未過期，其餘部分則交給 Graph。`--org-mode` 會加入工作與學校工具（Teams、SharePoint、共享信箱）及其權限。新增 `--read-only` 可移除所有寫入工具，或新增 `--enabled-tools <regex>` 以公開子集合，並在生產環境中鎖定版本（`@softeria/ms-365-mcp-server@<version>`），因為工具清單會在各版本之間變動。請僅讓 proxy 可連線至該埠。

***

## 透過 LiteLLM MCP Gateway 連線 {#connect-via-litellm-mcp-gateway}

:::info
Microsoft 365 是需要明確用戶端憑證的伺服器之一。LiteLLM 通常會透過動態註冊處理 OAuth client 設定，如 [Atlassian](./atlassian.md) 與 [Linear](./linear.md) 伺服器所示，但 Entra ID 需要您自己的應用程式註冊，這點與 [Slack](./slack.md) 相同。
:::

### 步驟 1：註冊 Entra ID 應用程式 {#step-1-register-an-entra-id-app}

1. 在 [Microsoft Entra admin center](https://entra.microsoft.com) 中，開啟 **App registrations** 並按一下 **New registration**。
2. 命名它（例如 `LiteLLM MCP gateway - Microsoft 365`），並維持 **Accounts in this organizational directory only**，除非其他租用戶的使用者也應可登入。
3. 在 **Redirect URI** 下，選擇 **Web** 平台並輸入 `{PROXY_BASE_URL}/callback`：

   ```
   https://llm.example.com/callback
   ```

4. 將 `https://llm.example.com` 替換為使用者在網址列中看到的來源。這是 LiteLLM 傳送給 Entra 的 `redirect_uri` 值，因此若不一致，流程會在 Microsoft 登入頁面以 `AADSTS50011` 失敗。若 LiteLLM 位於 ingress 之後，請參閱 [Reverse proxy and ingress configuration](../mcp_oauth.md#reverse-proxy-and-ingress-configuration)。
5. 在 **Certificates & secrets** 下建立 client secret，並立即複製其 **Value**；該值只會顯示一次。
6. 在 **API permissions** 下，按一下 **Add a permission**，選取 **Microsoft Graph**，接著選取 **Delegated permissions**，然後新增您想要的功能所需 scopes，並與 [Tools provided](#tools-provided) 中的表格對應。唯讀部署是 `openid`、`offline_access`、`User.Read`、`Mail.Read`、`Calendars.Read`、`Files.Read.All` 與 `Sites.Read.All`。`offline_access` 可讓 LiteLLM 重新整理 token，因此請保留它。
7. 若您的租用戶封鎖使用者自行同意，請按一下 **Grant admin consent**。
8. 從 **Overview** 複製 **Application (client) ID** 與 **Directory (tenant) ID**。

### 步驟 2：執行 Graph MCP 伺服器 {#step-2-run-the-graph-mcp-server}

將伺服器啟動在 proxy 主機上，或啟動在只有 proxy 可連線的機器上。`--http` 會讓它使用 LiteLLM 轉送的 token，而不是提示其自己的登入；`--org-mode` 則會開啟工作與學校工具：

```bash
npx -y @softeria/ms-365-mcp-server --http 3000 --org-mode
```

### 步驟 3：在 LiteLLM 中註冊伺服器 {#step-3-register-the-server-in-litellm}

<Tabs>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  microsoft_365:
    url: "http://localhost:3000/mcp"
    transport: "http"
    description: "Outlook mail and calendar, OneDrive and SharePoint files, and Teams through Microsoft Graph"
    auth_type: oauth2
    oauth2_flow: authorization_code
    per_server_oauth_discovery: true
    client_id: os.environ/M365_ENTRA_CLIENT_ID
    client_secret: os.environ/M365_ENTRA_CLIENT_SECRET
    authorization_url: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize"
    token_url: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token"
    scopes:
      - openid
      - offline_access
      - User.Read
      - Mail.Read
      - Calendars.Read
      - Files.Read.All
      - Sites.Read.All
```

`oauth2_flow: authorization_code` 會選擇每位使用者的互動式流程，且為必要；若 `auth_type: oauth2` 伺服器省略它，代理程式將拒絕啟動。`per_server_oauth_discovery: true` 讓 LiteLLM 為 `/microsoft_365/mcp` 本身發佈 OAuth 探索文件，並以其自己的 `/microsoft_365/authorize` 與 `/microsoft_365/token` 端點作為上述 Entra URL 的前置。若沒有它，伺服器的受保護資源中繼資料會將 MCP 用戶端導向閘道共用的 `/mcp` 授權伺服器，該伺服器會將使用者登入 LiteLLM 而不是 Entra，因此瀏覽器最後會停在「連線無法繼續」頁面，且永遠不會儲存任何 Graph token。儲存 MCP 伺服器也需要 `store_model_in_db: true`，詳見 [Prerequisites](../mcp.md#prerequisites)。

</TabItem>
<TabItem value="ui" label="LiteLLM UI">

請前往 **MCP Servers**，點選 **+ Add New MCP Server**，並設定：

| 欄位 | 值 |
|---|---|
| **Server Name** | `microsoft_365` |
| **Transport** | HTTP |
| **Server URL** | `http://localhost:3000/mcp` |
| **Authentication** | OAuth |
| **OAuth flow type** | Interactive (PKCE) |
| **Client ID / Client Secret** | From Step 1 |
| **Authorization URL** | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize` |
| **Token URL** | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token` |
| **Scopes** | 第 1 步中的委派權限 |

點選 **Create MCP Server**。此表單尚未提供 `per_server_oauth_discovery` 欄位，因此請透過管理 API，使用伺服器頁面上顯示的 `server_id` 將其開啟：

```bash showLineNumbers
curl -X PUT http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"server_id": "<server_id>", "per_server_oauth_discovery": true}'
```

接著開啟伺服器的 **MCP Tools** 分頁，確認 LiteLLM 可以列出 Graph 工具。首次列出時會觸發瀏覽器登入。

</TabItem>
</Tabs>

### 第 4 步：設定代理程式的公開 origin {#step-4-set-the-proxys-public-origin}

LiteLLM 會根據其公開 origin 建立送往 Entra 的 `redirect_uri`。請將 `PROXY_BASE_URL` 設定為您在第 1 步註冊的 origin，使兩者一致：

```bash
export PROXY_BASE_URL=https://llm.example.com
```

### 第 5 步：授與使用者伺服器存取權限 {#step-5-give-users-access-to-the-server}

LiteLLM 會將每個 Entra token 儲存到 key 背後的 LiteLLM 使用者帳戶，因此該 key 或其 team 需要在 `object_permission.mcp_servers` 中擁有此伺服器，且該 key 背後必須有一位使用者。沒有這些條件的 key 仍可完成登入，但沒有地方儲存 token，因此下一次工作階段會再次登入，而代理程式記錄會顯示 `OAuth credential storage not authorized`。請參閱 [MCP Permission Management](../mcp_control.md)。透過 SSO 登入 LiteLLM 的使用者已經擁有 LiteLLM 使用者帳戶，因此只要將伺服器授與其身分提供者群組對應到的 team 即可。

### 第 6 步：從代理程式連線 {#step-6-connect-from-an-agent}

閘道會在 `http://localhost:4000/{server_name}/mcp` 提供每個伺服器，因此 `microsoft_365` 可透過 `http://localhost:4000/microsoft_365/mcp` 存取。

<Tabs>
<TabItem value="claude-code" label="Claude Code">

```bash showLineNumbers
claude mcp add --transport http microsoft_365 http://localhost:4000/microsoft_365/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

在 Claude Code 內部執行 `/mcp` 會顯示伺服器並啟動 Entra 登入。Claude Code 會快取其向閘道註冊的 OAuth 用戶端，因此如果您在新增伺服器後開啟 `per_server_oauth_discovery`，請先移除它再重新新增。

透過 SSO 登入 LiteLLM 的使用者沒有可貼上的 `sk-` key。完成 `lite login`（[CLI authentication](../proxy/cli_sso.md)）之後，讓 Claude Code 使用 `headersHelper` 自行擷取該標頭，此命令的輸出會將標頭以 JSON 形式輸出：

```json title=".mcp.json" showLineNumbers
{
  "mcpServers": {
    "microsoft_365": {
      "type": "http",
      "url": "http://localhost:4000/microsoft_365/mcp",
      "headersHelper": "printf '{\"x-litellm-api-key\": \"Bearer %s\"}' \"$(lite auth print-token)\""
    }
  }
}
```

接著進行的 Microsoft 登入會儲存到 SSO 建立的 LiteLLM 使用者帳戶，因此同一位使用者可在不同 key 與不同工作階段之間保有其 Graph token。

</TabItem>
<TabItem value="claude-desktop" label="Claude Desktop">

Claude Desktop 在第三方推論上的 MCP 伺服器是透過 **Configure Third-Party Inference** > **Connectors** 新增，並會匯出為一個 `managedMcpServers` 項目。請將它指向每個伺服器的路徑，並設定 `"oauth": true`，使 Claude Desktop 在 LiteLLM 回應 401 時執行 Microsoft 登入：

```json title="managedMcpServers" showLineNumbers
[
  {
    "name": "microsoft_365",
    "transport": "http",
    "url": "http://localhost:4000/mcp/microsoft_365",
    "headers": {"x-litellm-api-key": "Bearer sk-<your-litellm-api-key>"},
    "oauth": true
  }
]
```

透過 SSO 登入的部署會將 `headers` 取代為 `headersHelper`，詳見 [Claude Desktop (Cowork)](../tutorials/claude_desktop_cowork.md#mcp-servers-through-the-litellm-mcp-gateway)。Claude Desktop 內建的 Microsoft 365 連接器會直接呼叫 Microsoft，完全不經過 LiteLLM，因此不會享有上述任何存取控制或記錄；請改用 `url` 項目。

</TabItem>
<TabItem value="cursor" label="Cursor">

```json title="Cursor" showLineNumbers
{
  "mcpServers": {
    "microsoft_365": {
      "url": "http://localhost:4000/microsoft_365/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer sk-<your-litellm-api-key>"
      }
    }
  }
}
```

</TabItem>
</Tabs>

第一次呼叫會在 Microsoft 登入頁面開啟瀏覽器，接著是列出第 1 步委派權限的同意畫面。LiteLLM 會儲存該使用者的 token，之後再行更新，因此後續工作階段可在不提示的情況下連線。`GET /v1/mcp/server/{server_id}/oauth-user-credential/status` 會顯示呼叫使用者是否有已儲存的 token 及其到期時間，而 `DELETE /v1/mcp/server/{server_id}/oauth-user-credential` 會使其失效。

***

## 提供的工具 {#tools-provided}

:::info
此伺服器會在執行期間透過 `tools/list` 發佈其工具定義，因此名稱與欄位會在不同版本之間變動（版本 0.155.0 在 organization 模式下列出 337 個工具）。LiteLLM UI 中的 **MCP Tools** 分頁是您租戶公開內容的權威來源；它會列出即時工具並讓您用測試引數呼叫其中一個。`npx -y @softeria/ms-365-mcp-server --list-permissions --org-mode` 會列印完整工具清單背後的 Graph 權限集合，而加入 `--read-only` 會列印唯讀集合。
:::

| 區域 | 工具（範例） | 委派權限 |
|---|---|---|
| 郵件 | `list-mail-messages`、`get-mail-message`、`list-mail-folders`、`list-mail-folder-messages`、`send-mail`、`forward-mail-message` | `Mail.Read` 用於讀取，`Mail.ReadWrite` 與 `Mail.Send` 用於寫入 |
| 行事曆 | `list-calendars`、`get-calendar-view`、`list-calendar-events`、`find-meeting-times`、`create-calendar-event` | `Calendars.Read` 用於讀取，`Calendars.ReadWrite` 用於寫入 |
| OneDrive | `list-drives`、`get-drive-root-item`、`list-folder-files`、`get-drive-item`、`upload-file-content`、`create-drive-item-share-link` | `Files.Read.All` 用於讀取，`Files.ReadWrite` 用於寫入 |
| SharePoint | `search-sharepoint-sites`、`get-sharepoint-site`、`list-sharepoint-site-drives`、`list-sharepoint-site-items`、`list-sharepoint-site-lists`、`get-sharepoint-site-list` | `Sites.Read.All` 用於讀取，`Sites.ReadWrite.All` 用於寫入 |
| Teams | `list-joined-teams`、`list-team-channels`、`list-channel-messages`、`list-chats`、`list-chat-messages`、`send-channel-message`、`send-chat-message` | `Team.ReadBasic.All`、`Channel.ReadBasic.All`、`ChannelMessage.Read.All`、`Chat.Read` 用於讀取；`ChannelMessage.Send`、`Chat.ReadWrite` 用於寫入 |
| Planner 和 To Do | `list-planner-tasks`、`list-todo-task-lists`、`list-todo-tasks`、`create-planner-task`、`create-todo-task` | `Tasks.Read` 用於讀取，`Tasks.ReadWrite` 用於寫入 |
| OneNote 和 Excel | `list-onenote-notebooks`、`list-onenote-pages`、`get-onenote-page-content`、`list-excel-worksheets`、`list-excel-tables`、`get-excel-range` | `Notes.Read` 和 `Files.Read.All` 用於讀取，`Notes.ReadWrite` 和 `Files.ReadWrite` 用於寫入 |
| 人員和目錄 | `get-current-user`、`list-users`、`get-user-manager`、`list-outlook-contacts`、`list-groups`、`list-group-members` | `User.Read`、`User.Read.All`、`Contacts.Read`、`Group.Read.All`、`GroupMember.Read.All` |
| 跨服務 | `search-query`（跨郵件、檔案、網站與人員的 Graph 搜尋）、`graph-batch`（在一次往返中執行多個 Graph 呼叫） | 依搜尋或批次資源所需而定 |

每個工具對代理程式而言都會成為 `microsoft_365-<tool>`（請參閱 [Tool naming](../mcp_rest_api.md#tool-naming)）。三百個工具對大多數代理程式而言在單一上下文中都太多，因此請將伺服器與 [Tool Search](../mcp_tool_search.md) 或 [Semantic Filter](../mcp_semantic_filter.md) 搭配使用，或以 `--enabled-tools` 執行伺服器。

### 已知限制 {#known-limitations}

伺服器會使用收到的任何未過期 bearer token 呼叫 Graph，並提供其自身的登入端點，因此只能透過 proxy 存取。當某位使用者的 OneDrive 從未被佈建時（他們尚未在網頁上開啟 OneDrive 或 Office）；OneDrive 工具會回傳 `itemNotFound`；SharePoint 文件庫不受影響。`search-query` 和 `search-sharepoint-sites` 採用 Graph 搜尋（KQL）語法，因此純粹的 `*` 會被拒絕。在使用者已同意之後，若要在 app registration 中新增權限，需要重新同意：使用 `DELETE /v1/mcp/server/{server_id}/oauth-user-credential` 撤銷已儲存的憑證，然後再次登入。Entra 存取 token 大約可維持一小時；LiteLLM 會使用 `offline_access` refresh token 來刷新它們，因此若不包含該 scope，便會每小時跳出一次登入提示。

***

:::info[限制可使用者]
透過 `object_permission` 依每個 key 或每個團隊授予伺服器存取權，並透過 `mcp_rpm_limit` 限制每台伺服器的呼叫量，這兩者都已在 [MCP 權限管理](../mcp_control.md) 中說明。Graph 會套用其自身的每位使用者節流，因此失控的代理程式會先讓該使用者自己的 Outlook 和 Teams 用戶端變慢，而不會影響其他人。
:::

:::warning[將 LiteLLM key 放在 `x-litellm-api-key` 中]
互動式 OAuth 需要讓 `Authorization` 標頭保持空出，以便給上游 token 使用。如果用戶端將 LiteLLM API key 作為 `Authorization: Bearer sk-...` 傳送，OAuth 流程就永遠不會執行，而 LiteLLM 會將您的 LiteLLM key 轉送給 Graph 伺服器，Graph 伺服器再將其傳給 Microsoft，而 Graph 會以 `InvalidAuthenticationToken` 拒絕。請參閱 [偵錯 OAuth](../mcp_oauth.md#debugging-oauth) 以及 [MCP 疑難排解指南](../mcp_troubleshoot.md)。
:::
