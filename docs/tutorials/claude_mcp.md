import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Claude Code 搭配 MCP {#use-claude-code-with-mcps}

本教學示範如何透過 LiteLLM Proxy 將 MCP 伺服器連接到 Claude Code。關於端點、傳輸與憑證選擇，請參閱 [MCP 設定參考](../mcp_config_reference)

注意：LiteLLM 也支援 MCP 伺服器的 OAuth。[了解更多](https://docs.litellm.ai/docs/mcp#mcp-oauth)

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.loom.com/embed/e3721fc44e284c559dc4dca67ba7603a" frameBorder="0" allowFullScreen></iframe>

## 連接 MCP 伺服器 {#connecting-mcp-servers}

您可以透過 LiteLLM Proxy 將 MCP 伺服器連接到 Claude Code。

1. 將 MCP 伺服器加入您的 `config.yaml`

<Tabs>
<TabItem value="github" label="GitHub MCP">

在這個範例中，我們將把 Github MCP 伺服器加入我們的 `config.yaml`

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  github_mcp:
    url: "https://api.githubcopilot.com/mcp"
    transport: "http"
    auth_type: oauth2
    oauth2_flow: authorization_code
    client_id: os.environ/GITHUB_OAUTH_CLIENT_ID
    client_secret: os.environ/GITHUB_OAUTH_CLIENT_SECRET
```

</TabItem>
<TabItem value="atlassian" label="Atlassian MCP">

在這個範例中，我們將把 Atlassian MCP 伺服器加入我們的 `config.yaml`

```yaml title="config.yaml" showLineNumbers
mcp_servers:
  atlassian_mcp:
    url: "https://mcp.atlassian.com/v1/mcp"
    transport: "http"
    auth_type: oauth2
    oauth2_flow: authorization_code
```

</TabItem>
</Tabs>

:::important
`mcp_servers:` 下方的伺服器名稱（例如 `atlassian_mcp`、`github_mcp`）**必須與** Claude Code URL 路徑（`/<server_name>/mcp`）中使用的名稱相符。不一致將在 OAuth 期間導致 404 錯誤。
:::

2. 啟動 LiteLLM Proxy

由於 Claude Code 需要可公開存取的 URL 來進行 OAuth 回呼，請透過 ngrok 或類似工具公開您的 proxy。

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

```bash
# In a separate terminal — expose proxy for OAuth callbacks
ngrok http 4000
```

3. 將 MCP 伺服器加入 Claude Code

<Tabs>
<TabItem value="github" label="GitHub MCP">

```bash
claude mcp add --transport http litellm-github https://your-ngrok-url.ngrok-free.dev/github_mcp/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

</TabItem>
<TabItem value="atlassian" label="Atlassian MCP">

```bash
claude mcp add --transport http litellm-atlassian https://your-ngrok-url.ngrok-free.dev/atlassian_mcp/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

**參數說明：**

| 參數 | 說明 |
|-----------|-------------|
| `--transport http` | 為 MCP 連線使用 HTTP 傳輸 |
| `litellm-atlassian` | 這個 MCP 伺服器在 Claude Code 上的名稱——可以是您自行選擇的任何名稱 |
| `https://your-ngrok-url.ngrok-free.dev/atlassian_mcp/mcp` | LiteLLM proxy URL。格式：`<PROXY_URL>/<server_name_on_litellm>/mcp`。`atlassian_mcp` 部分**必須與** LiteLLM proxy 設定中 `mcp_servers:` 下的鍵相符 |
| `--header "x-litellm-api-key: Bearer $LITELLM_API_KEY"` | 您用於向 proxy 驗證的 LiteLLM 虛擬金鑰 |

您也可以直接將 MCP 伺服器加入您的 `~/.claude.json` 檔案，而不是使用 `claude mcp add`。[請參閱 Claude Code 文件](https://docs.anthropic.com/en/docs/claude-code/mcp)。

:::note
對於需要 OAuth 的 MCP 伺服器（例如 Atlassian），LiteLLM 虛擬金鑰請使用 `x-litellm-api-key`，而不是 `Authorization`。`Authorization` 標頭保留給 OAuth 流程使用。
:::

4. 透過 Claude Code 進行驗證

a. 啟動 Claude Code

```bash
claude
```

b. 開啟 MCP 選單

```bash
/mcp
```

c. 選取 MCP 伺服器（例如 `litellm-atlassian`）

d. 啟動 OAuth 流程

```bash
> 1. Authenticate
 2. Reconnect
 3. Disable
```

e. 完成後，您應該會看到這則成功訊息：

<img src={require('../../img/oauth_2_success.png').default} alt="OAuth 2.0 成功" style={{ width: '500px', height: 'auto' }} />

## 將 MCP 工具排除在上下文視窗之外（工具搜尋） {#keep-mcp-tools-out-of-the-context-window-tool-search}

Claude Code 通常會將 MCP 工具結構描述保留在上下文視窗之外，並透過其內建工具搜尋按需載入。該流程需要在每次請求中加入 `advanced-tool-use-2025-11-20` beta 標頭，並透過 API 來往返 `tool_reference` 區塊，因此自 Claude Code 2.1.70 起，當 `ANTHROPIC_BASE_URL` 指向任何非 Anthropic 第一方主機時，用戶端會自行關閉工具搜尋。這個決定是在用戶端於送出任何請求之前做出的，因此當 Claude Code 經由 LiteLLM 路由時，`/context` 會顯示每個 MCP 工具結構描述都被內嵌（即使只有幾百個工具，也會達到數萬個 token），而且也因此沒有任何代理層的設定能將其重新開啟。

LiteLLM 會在 `/v1/messages` 上原樣傳遞 beta 標頭、`defer_loading` 與 `tool_reference` 區塊（並將 beta 轉換為 Bedrock 和 Vertex AI 的名稱），因此修正必須在 Claude Code 端進行。工具搜尋由 `ENABLE_TOOL_SEARCH` **環境變數** 控制；必須在 Claude Code 的環境中將其設為 `true`。它沒有頂層設定鍵，因此在設定檔中單獨放一個 `"enableToolSearch": true` 不會產生任何作用。請告訴 Claude Code（2.1.72 或更新版本）保持工具搜尋開啟：

```bash
export ANTHROPIC_BASE_URL=http://0.0.0.0:4000
export ANTHROPIC_AUTH_TOKEN=sk-<your-litellm-api-key>
export ENABLE_TOOL_SEARCH=true
claude
```

我們建議將它持續寫入 `.claude/settings.json` 的 `env` 區塊下，放在專案的 `.claude/settings.json` 或您的使用者層級 `~/.claude/settings.json`（或受管理的設定檔，以涵蓋整個團隊）中，這樣每個工作階段都會自動載入，而不必記得 export：

```json
{
  "env": {
    "ENABLE_TOOL_SEARCH": "true"
  }
}
```

`/context` 會將 MCP 工具列為 0 tokens 的 `loaded on-demand`，而 Claude 則會在第一次需要工具結構描述時，透過 `ToolSearch` 載入。`ENABLE_TOOL_SEARCH=auto`（或 `auto:N`）只會在工具結構描述超過上下文視窗的 N% 後才延後。完整選項清單請參閱 [Claude Code 文件](https://code.claude.com/docs/en/mcp#configure-tool-search)。
