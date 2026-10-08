# MCP 伺服器使用 {#mcp-server-usage}

> 透過 LiteLLM MCP 閘道連接熱門第三方 MCP 伺服器的設定指南。

每份指南都涵蓋伺服器的端點、LiteLLM 所需的驗證、如何註冊，以及如何從代理程式存取其工具。無論供應商為何，閘道對每台伺服器都一視同仁：所有用戶端共用單一端點、依金鑰／團隊／組織進行權限控管、依工具請求進行成本追蹤，以及單一稽核軌跡。

關於共用端點、傳輸與驗證規則，請參閱 [MCP 設定參考](../mcp_config_reference)

## 伺服器 {#servers}

| 伺服器 | 端點 | 驗證 | 涵蓋內容 |
|---|---|---|---|
| [Slack](./slack.md) | `https://mcp.slack.com/mcp` | OAuth 2.1、您自己的 Slack 應用程式 | 搜尋、頻道與討論串讀取、訊息、畫布 |
| [Atlassian](./atlassian.md) | `https://mcp.atlassian.com/v1/mcp/authv2` | OAuth 2.1、動態註冊 | Jira、Confluence、Compass、Jira Service Management、Bitbucket |
| [Linear](./linear.md) | `https://mcp.linear.app/mcp` | OAuth 2.1、動態註冊 | 問題、專案、週期、文件、留言 |
| [Microsoft 365](./microsoft_365.md) | 自架 `http://localhost:3000/mcp` ([ms-365-mcp-server](https://github.com/Softeria/ms-365-mcp-server)) | OAuth 2.0、您自己的 Entra ID 應用程式 | Outlook 郵件與行事曆、OneDrive、SharePoint、Teams、Planner、To Do、OneNote、Excel |

任何其他遠端 MCP 伺服器都遵循相同形式：將 `url` 指向其端點，並從 [MCP 概覽](../mcp.md) 的驗證表中選擇相符的 `auth_type`。

## 這些指南的前提 {#what-these-guides-assume}

Slack、Atlassian 與 Linear 由其供應商代管並使用 Streamable HTTP，因此無需自行安裝或執行任何項目。Microsoft 365 是您在 proxy 旁執行的開放原始碼伺服器，其指南會涵蓋這部分。這四者都透過互動式 OAuth 進行每位使用者的驗證，也就是每位呼叫者只需透過瀏覽器登入一次，而工具請求會帶著該使用者自己的權限，而非共用的服務身分。儲存 MCP 伺服器需要 proxy 上的 `store_model_in_db: true`，相關內容請參閱 [Prerequisites](../mcp.md#prerequisites)。

```yaml title="config.yaml" showLineNumbers
general_settings:
  store_model_in_db: true
```

:::warning[將 LiteLLM 金鑰放在 `x-litellm-api-key`]
互動式 OAuth 需要將 `Authorization` 標頭保留給上游權杖使用。如果用戶端將 LiteLLM API 金鑰作為 `Authorization: Bearer sk-...` 傳送，OAuth 流程就永遠不會執行，而且 proxy 會將您的 LiteLLM 金鑰轉送給上游伺服器，導致其拒絕。這是所有四個伺服器最常見的失敗原因。請參閱 [OAuth 偵錯](../mcp_oauth.md#debugging-oauth)。
:::

## 相關頁面 {#related-pages}

用戶端端的模式請見 [使用您的 MCP](../mcp_usage.md)，依金鑰與團隊的存取控制請見 [MCP 權限管理](../mcp_control.md)，OAuth 流程請見 [MCP OAuth](../mcp_oauth.md)，依工具支出請見 [MCP 成本追蹤](../mcp_cost.md)，連線失敗請見 [MCP 疑難排解指南](../mcp_troubleshoot.md)。
