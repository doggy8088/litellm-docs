import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Slack MCP 伺服器 {#slack-mcp-server}

> 透過 LiteLLM MCP Gateway 連接 Slack 託管的 MCP 伺服器，以進行工作區搜尋、頻道讀取與訊息傳送。

Slack 代管並維護此伺服器，因此您不需要自行部署或執行任何內容。LiteLLM 會新增集中式驗證、依金鑰與團隊劃分的存取控制、每次工具呼叫的成本追蹤，以及您公開的每個 MCP 伺服器共用的一條稽核軌跡。

## 何時應該使用此伺服器 {#when-should-you-use-this-server}

- 提供代理程式工作區脈絡：某個頻道中決定了什麼、誰說的，以及何時說的
- 讓代理程式將更新、摘要或警示貼到 Slack，而不只是用聊天回覆
- 在回答前先跨訊息、檔案與畫布搜尋，作為檢索步驟

## 主要功能 {#key-features}

- 工具介面取決於您授予的 OAuth scope，因此唯讀部署與完整讀寫部署會使用同一個伺服器，但授權不同
- 由 Slack 透過 Streamable HTTP 託管；無需本機程序，也不用輪替 bot token
- 每位使用者各自驗證，因此每次工具呼叫都以登入者身分執行，且只能看到其在 Slack 中原本就可見的內容

## 驗證 {#authentication}

- **方法：** 使用使用者 token 的 OAuth 2.1。Slack 不支援動態用戶端註冊，因此您需要建立一個 Slack app，並將其 client credentials 提供給 LiteLLM。
- **Slack app：** 請前往 [api.slack.com/apps](https://api.slack.com/apps) 建立。您將設定 redirect URL、加入 user token scopes，並啟用 Model Context Protocol 切換。Slack 只允許在 internal apps 與 directory-published apps 上使用 MCP，因此您在自己的 workspace 中建立的 app 也符合資格。

## 端點 {#endpoint}

**遠端 MCP 伺服器：**

```
https://mcp.slack.com/mcp
```

***

## 透過 LiteLLM MCP Gateway 連接 {#connect-via-litellm-mcp-gateway}

:::info
Slack 是需要明確 client credentials 的伺服器之一。LiteLLM 通常會透過動態註冊為您處理 OAuth client 設定，就像 [Atlassian](./atlassian.md) 和 [Linear](./linear.md) 伺服器一樣，但 Slack 需要您自己的 app。
:::

### 步驟 1：建立 Slack OAuth app {#step-1-create-a-slack-oauth-app}

1. 前往 [api.slack.com/apps](https://api.slack.com/apps)，點選 **Create New App**，再點選 **From scratch**，並選取代理程式應可存取的 workspace。
2. 開啟 **OAuth & Permissions**。
3. 在 **Redirect URLs** 下方加入 `{PROXY_BASE_URL}/callback`，然後點選 **Save URLs**：

   ```
   https://llm.example.com/callback
   ```

4. 將 `https://llm.example.com` 替換為使用者在網址列中看到的 origin。這是 LiteLLM 向上游傳送的 `redirect_uri` 值，因此若不一致，流程會在 Slack 的同意畫面失敗。若 LiteLLM 位於 ingress 後方，請參閱 [Reverse proxy and ingress configuration](../mcp_oauth.md#reverse-proxy-and-ingress-configuration)。
5. 在 **User Token Scopes** 下方，加入您所需功能的 scopes，並對照 [Tools provided](#oauth-scopes-by-capability) 中的表格。建議先以唯讀方式廣泛部署，然後再為您信任的團隊新增寫入 scopes。
6. 從 **Basic Information** 複製 **Client ID** 與 **Client Secret**。

### 步驟 2：啟用 MCP（Agents & AI Apps） {#step-2-enable-mcp-agents--ai-apps}

:::warning
MCP 端點位於 **Agents & AI Apps** 底下的每個 app 切換開關之後。若您將其關閉，OAuth 仍會成功，但工具清單會回傳空白或 403，這看起來像是 LiteLLM 權限問題，但其實不是。
:::

1. 在 app 設定中，開啟 **Agents & AI Apps**。
2. 啟用 **Model Context Protocol**。
3. 將 app 安裝或重新安裝到 workspace，讓新 scopes 生效。

### 步驟 3：在 LiteLLM 中註冊伺服器 {#step-3-register-the-server-in-litellm}

<Tabs>
<TabItem value="ui" label="LiteLLM UI">

前往 **MCP Servers**，點選 **+ Add New MCP Server**，並設定：

| 欄位 | 值 |
|---|---|
| **Server Name** | `slack_mcp` |
| **Transport** | HTTP |
| **Server URL** | `https://mcp.slack.com/mcp` |
| **Authentication** | OAuth |
| **OAuth flow type** | Interactive (PKCE) |
| **Client ID / Client Secret** | 來自步驟 1 |

點選 **Create MCP Server**，然後開啟伺服器的 **MCP Tools** 分頁，以確認 LiteLLM 可以列出 Slack 的工具。首次列出時會觸發瀏覽器登入。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  slack_mcp:
    url: "https://mcp.slack.com/mcp"
    transport: "http"
    description: "Slack workspace search, channels, and messaging"
    auth_type: oauth2
    oauth2_flow: authorization_code
    client_id: os.environ/SLACK_OAUTH_CLIENT_ID
    client_secret: os.environ/SLACK_OAUTH_CLIENT_SECRET
```

`oauth2_flow: authorization_code` 會選擇互動式的每位使用者流程，而且是必要的；若某個 `auth_type: oauth2` 伺服器省略它，proxy 會拒絕啟動。儲存 MCP 伺服器也需要 `store_model_in_db: true`，詳見 [Prerequisites](../mcp.md#prerequisites)。

</TabItem>
</Tabs>

### 步驟 4：從代理程式連接 {#step-4-connect-from-an-agent}

Gateway 會將每個伺服器提供在 `http://localhost:4000/{server_name}/mcp`，因此 `slack_mcp` 可透過 `http://localhost:4000/slack_mcp/mcp` 存取。

<Tabs>
<TabItem value="cursor" label="Claude Desktop / Cursor">

```json title="Claude Desktop / Cursor" showLineNumbers
{
  "mcpServers": {
    "slack": {
      "url": "http://localhost:4000/slack_mcp/mcp",
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
claude mcp add --transport http slack http://localhost:4000/slack_mcp/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

第一次呼叫會開啟瀏覽器進行 Slack 登入。LiteLLM 會儲存該使用者的 token，之後再重新整理，因此後續工作階段可在不需提示的情況下連線。

***

## 提供的工具 {#tools-provided}

:::info
Slack 會在執行階段透過 `tools/list` 公布其工具定義，因此名稱與欄位可能會在未經通知下變更。LiteLLM UI 中的 **MCP Tools** 分頁是您工作區所公開內容的唯一依據；它會列出即時工具，並讓您以測試引數呼叫其中之一。上游細節請參閱 Slack 的 [Slack MCP server overview](https://docs.slack.dev/ai/slack-mcp-server)。
:::

| 領域 | 工具 |
|---|---|
| 搜尋 | `search_public`, `search_public_and_private`, `search_channels`, `search_users` |
| 讀取 | `read_channel`, `read_thread`, `read_user_profile` |
| 訊息傳送 | `send_message`, `send_message_draft`, `schedule_message` |
| 畫布 | `create_canvas`, `read_canvas`, `update_canvas` |

Canvas 工具需要付費的 Slack 方案。LiteLLM 會在工具名稱前加上伺服器名稱，因此 `search_public` 會以 `slack_mcp-search_public` 的形式提供給模型；請參閱 [Tool naming](../mcp_rest_api.md#tool-naming)。

### 依功能劃分的 OAuth scopes {#oauth-scopes-by-capability}

| 功能 | User token scopes（範例） |
|---|---|
| 搜尋訊息與檔案 | `search:read` |
| 讀取公開頻道 | `channels:read`, `channels:history` |
| 讀取私人頻道 | `groups:read`, `groups:history` |
| 讀取直接訊息 | `im:history` |
| 發佈訊息 | `chat:write` |
| 解析使用者個人資料 | `users:read` |
| 讀取檔案 | `files:read` |

Slack 在 [OAuth scopes](https://api.slack.com/scopes) 中說明完整清單。速率限制會依工具套用，與對應 Web API 方法的等級一致，並疊加在您於 LiteLLM 中設定的任何限制之上。

***

:::info[限制可使用者]
透過 `object_permission` 依金鑰或依團隊授予伺服器存取權，並透過 `mcp_rpm_limit` 限制每個伺服器的呼叫量，兩者皆見於 [MCP Permission Management](../mcp_control.md)。授予對該對象而言可行的最小 scope 集合；只需要摘要頻道的金鑰，不需要 `chat:write`。
:::

:::warning[將 LiteLLM 金鑰放在 `x-litellm-api-key`]
互動式 OAuth 需要將 `Authorization` header 留給上游 token。若用戶端將 LiteLLM API 金鑰以 `Authorization: Bearer sk-...` 形式送出，OAuth 流程就不會執行，而 LiteLLM 會把您的 LiteLLM 金鑰轉送給 Slack，進而遭到拒絕。若要診斷，請加入 `x-litellm-mcp-debug: true` 並讀取回應標頭：`SAME_AS_LITELLM_KEY` 可確認此情況，而 `m2m-client-credentials` 表示已設定 `token_url`，且每位呼叫者共用同一身分。請參閱 [Debugging OAuth](../mcp_oauth.md#debugging-oauth) 與 [MCP Troubleshooting Guide](../mcp_troubleshoot.md)。
:::
