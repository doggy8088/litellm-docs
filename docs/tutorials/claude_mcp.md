import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 使用 Claude Code 搭配 MCP {#use-claude-code-with-mcps}

本教學示範如何透過 LiteLLM Proxy 將 MCP 伺服器連接到 Claude Code。

注意：LiteLLM 也支援 MCP 伺服器的 OAuth。[了解更多](https://docs.litellm.ai/docs/mcp#mcp-oauth)

## 示範 {#demo}

<iframe width="840" height="500" src="https://www.loom.com/embed/e3721fc44e284c559dc4dca67ba7603a" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

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
  --header "x-litellm-api-key: Bearer sk-1234"
```

</TabItem>
<TabItem value="atlassian" label="Atlassian MCP">

```bash
claude mcp add --transport http litellm-atlassian https://your-ngrok-url.ngrok-free.dev/atlassian_mcp/mcp \
  --header "x-litellm-api-key: Bearer sk-1234"
```

</TabItem>
</Tabs>

**參數說明：**

| 參數 | 說明 |
|-----------|-------------|
| `--transport http` | 為 MCP 連線使用 HTTP 傳輸 |
| `litellm-atlassian` | 這個 MCP 伺服器在 Claude Code 上的名稱——可以是您自行選擇的任何名稱 |
| `https://your-ngrok-url.ngrok-free.dev/atlassian_mcp/mcp` | LiteLLM proxy URL。格式：`<PROXY_URL>/<server_name_on_litellm>/mcp`。`atlassian_mcp` 部分**必須與** LiteLLM proxy 設定中 `mcp_servers:` 下的鍵相符 |
| `--header "x-litellm-api-key: Bearer sk-1234"` | 您用於向 proxy 驗證的 LiteLLM 虛擬金鑰 |

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
