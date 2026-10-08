import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Atlassian MCP 伺服器 {#atlassian-mcp-server}

> 透過 LiteLLM MCP Gateway 連接 Atlassian 託管的遠端 MCP 伺服器，用於 Jira 問題、Confluence 頁面與 Compass 元件。

Atlassian 代管並更新此伺服器，因此您無需自行部署或執行任何內容。LiteLLM 增加集中式驗證、依金鑰與團隊的存取控制、每次工具呼叫的成本追蹤，以及跨您公開的每一個 MCP 伺服器的一致稽核軌跡。

## 何時應該使用此伺服器 {#when-should-you-use-this-server}

- 讓代理程式在不離開對話的情況下分流、建立或更新 Jira 問題
- 將 Confluence 頁面作為內容拉入，或將發現結果以新頁面寫回
- 透過 Compass 元件追蹤擁有者與依賴關係

## 主要功能 {#key-features}

- 一個伺服器涵蓋 Jira、Jira Service Management、Confluence、Bitbucket 與 Compass，因此一次註冊即可連接全部服務
- 由 Atlassian 透過 Streamable HTTP 託管；僅限 Cloud，不支援 Server 或 Data Center
- 動態用戶端註冊，因此 LiteLLM 會協商 OAuth 用戶端，且無需管理 client ID 或 secret

Atlassian 將此產品稱為 **Rovo MCP Server**，這也是其文件中要搜尋的名稱。

## 驗證 {#authentication}

- **方法：** 使用含使用者權杖的 OAuth 2.1，並遵循每位呼叫者現有的 Atlassian 權限。代理程式無法開啟其使用者本來就無法開啟的 Jira 專案或 Confluence 空間。
- **Atlassian 應用程式：** 無需建立。Atlassian 支援 [dynamic client registration](https://datatracker.ietf.org/doc/html/rfc7591)，且此伺服器向所有 Atlassian Cloud 客戶開放，無需另行註冊。
- **替代方案：** Atlassian 也提供 API token 驗證，但組織管理員必須先在 Atlassian Administration 中啟用。兩種方法的工具涵蓋範圍不同，因此如果缺少您預期的產品，請查看 Atlassian 的 supported-tools 頁面。

## 端點 {#endpoint}

**遠端 MCP 伺服器：**

```
https://mcp.atlassian.com/v1/mcp/authv2
```

Atlassian 文件說明 `authv2` 是供手動設定的用戶端使用，而 LiteLLM 正是如此。較舊的 `https://mcp.atlassian.com/v1/mcp` 形式仍然可用，且 Atlassian 的一鍵安裝程式仍會發放，因此您可能會在既有設定中看到它；新設定請優先使用 `authv2`。

***

## 透過 LiteLLM MCP Gateway 連接 {#connect-via-litellm-mcp-gateway}

:::warning[請不要填入用戶端憑證]
請勿在此伺服器上設定 `client_id`、`client_secret` 或 `token_url`。這些設定會將其切換為由所有呼叫者共用的 machine-to-machine 身分，因此 Jira 變更會被歸因於單一服務帳號，而不是提出請求的人。Atlassian 的動態註冊使它們變得不必要。
:::

### 步驟 1：在 LiteLLM 中註冊伺服器 {#step-1-register-the-server-in-litellm}

<Tabs>
<TabItem value="ui" label="LiteLLM UI">

前往 **MCP Servers**，點擊 **+ Add New MCP Server**，並設定：

| 欄位 | 值 |
|---|---|
| **Server Name** | `atlassian_mcp` |
| **Transport** | HTTP |
| **Server URL** | `https://mcp.atlassian.com/v1/mcp/authv2` |
| **Authentication** | OAuth |
| **OAuth flow type** | Interactive (PKCE) |
| **Client ID / Client Secret** | 留空 |

點擊 **Create MCP Server**，然後開啟伺服器的 **MCP Tools** 分頁以確認連線。第一次列出時會引導您前往 Atlassian 登入並選取網站。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  atlassian_mcp:
    url: "https://mcp.atlassian.com/v1/mcp/authv2"
    transport: "http"
    description: "Jira, Confluence, and Compass"
    auth_type: oauth2
    oauth2_flow: authorization_code
```

`oauth2_flow: authorization_code` 會選取每位使用者的互動式流程，且為必要；若 `auth_type: oauth2` 伺服器省略此項，proxy 將拒絕啟動。儲存 MCP 伺服器也需要 `store_model_in_db: true`，詳見 [Prerequisites](../mcp.md#prerequisites)。

</TabItem>
</Tabs>

### 步驟 2：設定 proxy 的公開原點 {#step-2-set-the-proxys-public-origin}

如果 LiteLLM 執行於 TLS 終止的 ingress 後方，請將 `PROXY_BASE_URL` 設為使用者在網址列中看到的原點，以便 OAuth 回呼通過驗證：

```bash
PROXY_BASE_URL=https://llm.example.com
```

當您點擊 **Connect** 時，若不符會顯示為帶有 `{"detail":"invalid_request"}` 的 `400 Bad Request`。完整規則請參閱 [Reverse proxy and ingress configuration](../mcp_oauth.md#reverse-proxy-and-ingress-configuration)。

### 步驟 3：從代理程式連接 {#step-3-connect-from-an-agent}

Gateway 會以 `http://localhost:4000/{server_name}/mcp` 提供每個伺服器，因此 `atlassian_mcp` 可透過 `http://localhost:4000/atlassian_mcp/mcp` 存取。

<Tabs>
<TabItem value="cursor" label="Claude Desktop / Cursor">

```json title="Claude Desktop / Cursor" showLineNumbers
{
  "mcpServers": {
    "atlassian": {
      "url": "http://localhost:4000/atlassian_mcp/mcp",
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
claude mcp add --transport http atlassian http://localhost:4000/atlassian_mcp/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

第一次呼叫會開啟瀏覽器以授權並選取網站。LiteLLM 會儲存該使用者的權杖，之後再更新它，因此後續工作階段會在不提示的情況下連線。

***

## 提供的工具 {#tools-provided}

:::info
Atlassian 會透過 `tools/list` 在執行階段發布其工具定義，因此名稱與欄位可能在未事先通知的情況下變更。LiteLLM UI 中的 **MCP Tools** 分頁是您網站所公開內容的唯一真實來源；它會列出即時工具，並讓您使用測試引數呼叫其中一項。上游細節請參閱 Atlassian 的 [MCP server documentation](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/)。
:::

| 產品 | 功能 |
|---|---|
| Jira | 問題搜尋、問題建立與更新、批次問題建立 |
| Confluence | 頁面讀取與摘要、頁面建立、空間導覽 |
| Compass | 元件建立、從 CSV 或 JSON 匯入批次元件與自訂欄位、相依性查詢 |
| Jira Service Management | 請求與佇列存取 |
| Bitbucket | 存放庫與拉取請求存取 |
| 跨產品 | 在產品間連結項目，例如將票證附加到頁面，或尋找與 Compass 元件相關的文件 |

LiteLLM 會在工具名稱前加上伺服器名稱，因此名為 `getJiraIssue` 的工具會以 `atlassian_mcp-getJiraIssue` 的形式提供給模型；請參閱 [工具命名](../mcp_rest_api.md#tool-naming)。此伺服器的工具範圍很大，因此啟用 [MCP Tool Search](../mcp_tool_search.md) 與 [semantic filtering](../mcp_semantic_filter.md) 值得這麼做，才能讓模型的工具清單維持在足夠精簡且可用的程度。

### 已知限制 {#known-limitations}

此伺服器處於 beta 階段，而 Atlassian 會套用依方案而異的每小時請求配額。批次作業帶有速率與格式限制，自訂 Jira 欄位可能需要手動設定，且某些用戶端僅部分支援。工作階段會繫結至單一網站，因此若使用者對錯誤的網站完成授權，必須中斷連線並重新連接伺服器，而不是在原地切換。

***

:::info[限制可使用者]
使用 `object_permission` 依金鑰或依團隊授權此伺服器，並使用 `mcp_rpm_limit` 依伺服器限制呼叫量，這兩者都在 [MCP Permission Management](../mcp_control.md) 中說明。這裡的每金鑰限制比多數伺服器更重要，因為 Atlassian 的 beta 配額是由整個網站共用，而單一失控的代理程式就可能將其耗盡。
:::

:::warning[將 LiteLLM 金鑰放入 `x-litellm-api-key`]
互動式 OAuth 需要將 `Authorization` 標頭留給上游權杖使用。若用戶端將 LiteLLM API 金鑰作為 `Authorization: Bearer sk-...` 傳送，OAuth 流程就不會執行，而且 LiteLLM 會將您的 LiteLLM 金鑰轉送給 Atlassian，而 Atlassian 會拒絕它。若要診斷，請加入 `x-litellm-mcp-debug: true` 並讀取回應標頭；正常的呼叫會回報 `x-mcp-debug-auth-resolution: oauth2-passthrough` 對應 `https://mcp.atlassian.com/v1/mcp/authv2`，而 `SAME_AS_LITELLM_KEY` 則確認了這種情況，`m2m-client-credentials` 表示已設定用戶端憑證，且所有呼叫者共用同一身分。請參閱 [Debugging OAuth](../mcp_oauth.md#debugging-oauth) 與 [MCP Troubleshooting Guide](../mcp_troubleshoot.md)。
:::
