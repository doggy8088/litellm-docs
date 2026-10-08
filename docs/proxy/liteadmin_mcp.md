---
title: LiteAdmin MCP
sidebar_label: 連接 Claude 或 Codex
description: 將 Claude Desktop、Claude Code 或 Codex 連接到您的 LiteLLM 閘道，使用 LiteAdmin MCP。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteAdmin MCP {#liteadmin-mcp}

使用 **LiteAdmin MCP**（[https://github.com/BerriAI/litellm-admin-mcp]）從 Claude、Codex 或其他 MCP 用戶端管理您的閘道。您可以請求代理程式執行：

- 建立與管理虛擬金鑰。
- 新增模型部署。
- 管理團隊、成員與預算。
- 檢查支出、活動與請求記錄。

您的用戶端會執行代理程式與模型。MCP 伺服器會使用您的個人管理憑證呼叫閘道的管理 API。連接後不會變更您用戶端的模型提供者設定。

若要在您的 Enterprise 部署中託管 MCP，請依照 [在 Enterprise 上部署 LiteAdmin MCP](./liteadmin_mcp_enterprise.md)，以使用統一與元件化的 Docker 映像檔。

若要在 Slack 中管理閘道，請依照 [LiteAdmin Slack 應用程式設定](./liteadmin_slack.md)，並選擇 Enterprise 或獨立部署。若要透過 LiteLLM 路由第三方 MCP 工具，請參閱獨立的 [MCP Gateway](../mcp.md) 指南。

## 開始之前 {#before-you-start}

您需要一個正在執行的 LiteLLM 閘道，以及屬於具有 [`proxy_admin` 角色](./access_control.md#global-proxy-roles) 使用者的個人 [虛擬金鑰](./virtual_keys.md)。連接器要求此角色適用於**所有工具，包括讀取**；`proxy_admin_viewer` 和團隊管理員帳戶無法使用它。

對於下方的本機用戶端設定，請在執行 MCP 用戶端的電腦上安裝 [uv](https://docs.astral.sh/uv/getting-started/installation/)。連接器需要 Python 3.12 或更新版本；uv 可以下載相容的直譯器。{/* keep-python-version */}

請先準備好以下值：

| 設定 | 值 |
| --- | --- |
| `LITELLM_BASE_URL` | 您的閘道 HTTPS origin，例如 `https://gateway.example.com`。可接受可選的 `/v1` 後綴。 |
| `LITELLM_API_KEY` | 您的個人 proxy-admin 金鑰。 |

執行連接器的電腦必須能存取您的閘道 `/openapi.json` 與管理 API。除本機迴環開發外，請使用 HTTPS。

## 連接您的用戶端 {#connect-your-client}

請在下方選擇您的用戶端，並將閘道 URL 與金鑰預留位置替換掉。包含金鑰的設定請保持私密，並避免納入版本控制。可用時請使用您用戶端的機密儲存。

<Tabs groupId="liteadmin-client">
<TabItem value="claude-desktop" label="Claude Desktop" default>

在 Claude Desktop 中開啟 **Settings → Developer → Edit Config**。將 `litellm-admin` 項目新增到 `mcpServers` 下方，並保留任何既有伺服器：

```json title="claude_desktop_config.json"
{
  "mcpServers": {
    "litellm-admin": {
      "command": "uvx",
      "args": [
        "--isolated",
        "--refresh-package",
        "litellm-admin-mcp",
        "--from",
        "git+https://github.com/BerriAI/litellm-admin-mcp.git@main",
        "litellm-admin-mcp"
      ],
      "env": {
        "LITELLM_BASE_URL": "https://gateway.example.com",
        "LITELLM_API_KEY": "<your-personal-proxy-admin-key>"
      }
    }
  }
}
```

關閉並重新開啟 Claude Desktop。在新的聊天中開啟 **+ → Connectors**，檢查 `litellm-admin` 及其工具。Developer 設定也會顯示連線狀態與記錄。

如果 Claude 找不到 `uvx`，請將 `"command": "uvx"` 替換為其絕對路徑。在 macOS 上執行 `which uvx`，或在 Windows 上執行 `where uvx` 以找出它。在 JSON 中，將 Windows 反斜線跳脫為 `\\`。

請參閱 [手動 Claude Desktop 設定指南](https://modelcontextprotocol.io/docs/develop/connect-local-servers) 以了解設定檔位置。

</TabItem>
<TabItem value="claude-code" label="Claude Code">

在您的終端機中執行：

```bash
claude mcp add --scope user --transport stdio litellm-admin \
  --env LITELLM_BASE_URL=https://gateway.example.com \
  --env LITELLM_API_KEY='<your-personal-proxy-admin-key>' \
  -- uvx --isolated --refresh-package litellm-admin-mcp \
  --from git+https://github.com/BerriAI/litellm-admin-mcp.git@main \
  litellm-admin-mcp
```

`--scope user` 選項可讓連線在您的專案之間可用，並將其儲存在您的私人 Claude 設定中。您的 shell 也可能會將此命令保留在歷史記錄中。

重新啟動 Claude Code，並執行 `/mcp` 來檢查連線。您也可以從終端機檢查：

```bash
claude mcp get litellm-admin
```

請參閱 [Claude Code 的 MCP 文件](https://code.claude.com/docs/en/mcp) 以了解設定範圍與用戶端疑難排解。

</TabItem>
<TabItem value="codex" label="Codex">

將此伺服器新增到您現有的 `~/.codex/config.toml`：

```toml title="~/.codex/config.toml"
[mcp_servers.litellm-admin]
command = "uvx"
args = [
  "--isolated",
  "--refresh-package", "litellm-admin-mcp",
  "--from", "git+https://github.com/BerriAI/litellm-admin-mcp.git@main",
  "litellm-admin-mcp"
]
startup_timeout_sec = 60

[mcp_servers.litellm-admin.env]
LITELLM_BASE_URL = "https://gateway.example.com"
LITELLM_API_KEY = "<your-personal-proxy-admin-key>"
```

本機 Codex 用戶端會在同一主機上共用此設定。重新啟動您的用戶端以載入伺服器。在 Codex CLI 中，執行 `/mcp` 以檢查作用中的連線與工具；`codex mcp list` 會列出已設定的伺服器。

若要在終端機使用，您可以將金鑰保留在此檔案之外：移除 `LITELLM_API_KEY` 指派，在上方伺服器表格中的 `.env` 表格之前新增 `env_vars = ["LITELLM_API_KEY"]`，並在啟動 `codex` 之前匯出該變數。桌面應用程式若要使用此選項，也必須能存取該環境變數。

請參閱 [官方 Codex MCP 文件](https://developers.openai.com/codex/mcp) 以了解支援的設定欄位。

</TabItem>
</Tabs>

這些範例會在用戶端每次啟動伺服器時檢查連接器的 GitHub `main` 分支。更新後請重新啟動連線。若要使用固定版本，請將 `@main` 替換為發行標籤或完整 commit SHA，並移除 `--refresh-package` 以及其後緊接的 `litellm-admin-mcp` 引數。

## 驗證連線 {#verify-the-connection}

先從讀取請求開始：

> 使用 LiteAdmin 列出我的團隊及其目前預算。

檢查用戶端是否呼叫了管理工具並從您的閘道回傳資料。如果您沒有任何團隊，空白的團隊清單也是有效結果。僅連接到 MCP 伺服器並不足以驗證閘道存取。

讀取成功後，您可以請求變更，例如：

- “為 Engineering 建立一個每月預算 $100 的金鑰。”
- “將 Engineering 團隊的每月預算更新為 $500。”

請使用符合您預期變更的名稱與限制。閘道會強制執行呼叫者的權限與功能授權。寫入逾時後，請在重試前檢查受影響的金鑰、團隊或模型。

### 新增模型部署 {#add-a-model-deployment}

您的閘道需要資料庫、`STORE_MODEL_IN_DB=True`，以及供 [模型管理](./model_management.md) 使用的提供者驗證。請在請求中包含公開模型名稱、精確的提供者/模型 ID，以及已儲存的憑證名稱或閘道環境變數參照。例如：

> 使用 openai/gpt-4.1 與現有的閘道憑證 openai-production 新增名為 support-chat 的模型。

請使用在您的部署中存在的提供者/模型 ID 與憑證。請將提供者 API 金鑰保留在聊天內容之外。新增閘道部署不會佈建提供者存取權，也不會測試推論。

## 限制可用工具 {#restrict-the-available-tools}

請在 MCP 伺服器的環境中設定這些變數，然後重新啟動連線：

| 變數 | 影響 |
| --- | --- |
| `LITELLM_ADMIN_READ_ONLY=true` | 只公開經過審核的讀取操作。仍需要 `proxy_admin` 身分。 |
| `LITELLM_ADMIN_TOOLS=list_keys,list_teams` | 將伺服器限制為這些標準工具名稱。 |

連接器會從您的閘道探索 schema，並公開其中可用的經審核操作。請使用 [操作目錄](https://github.com/BerriAI/litellm-admin-mcp/blob/main/src/litellm_admin_mcp/operations.json) 來尋找工具名稱。如果您同時設定兩種限制，只有兩者都允許的工具才會保留可用。

## 在 LiteLLM 內執行 LiteAdmin MCP {#run-liteadmin-mcp-inside-litellm}

請依照 [在 Enterprise 上部署 LiteAdmin MCP](./liteadmin_mcp_enterprise.md) 的說明，從統一的 LiteLLM 映像檔或元件化部署中的管理後端提供 `/admin/mcp`。該指南涵蓋啟用旗標、Enterprise 授權、入口路由、驗證、用戶端設定與驗證

### 內嵌工具與回應設定 {#embedded-tool-and-response-settings}

請參閱 [工具與回應設定](./liteadmin_mcp_enterprise.md#tool-and-response-settings) 以了解內嵌預設值、唯讀限制，以及回傳精簡結果所需的 worker

## 託管共享 MCP 端點 {#host-a-shared-mcp-endpoint}

當您想在伺服器上而不是每位使用者的電腦上執行連接器時，請使用 Streamable HTTP。先在該主機上安裝 uv，然後執行：

```bash
export LITELLM_BASE_URL=https://gateway.example.com
export LITELLM_MCP_PUBLIC_URL=https://admin-mcp.example.com
uvx --isolated --refresh-package litellm-admin-mcp \
  --from git+https://github.com/BerriAI/litellm-admin-mcp.git@main \
  litellm-admin-mcp --transport streamable-http --port 8080
```

在 `127.0.0.1:8080` 前面放置 HTTPS 反向代理，並從 `admin-mcp.example.com` 轉送到它。用戶端端點是 `https://admin-mcp.example.com/mcp`。將 `LITELLM_MCP_PUBLIC_URL` 設為該公開 origin，但不要包含 `/mcp` 路徑，以便連接器接受其 Host 與 Origin 標頭。

**請讓託管服務上的 `LITELLM_API_KEY` 保持未設定。** 每個用戶端都會傳送自己的個人 proxy-admin 金鑰。每個受信任的閘道請只執行一份安裝，並只連接到您營運且信任的連接器。

請使用以下任一替代方案設定您的用戶端，以取代本機設定：

<Tabs groupId="liteadmin-http-client">
<TabItem value="claude-code" label="Claude Code" default>

```bash
claude mcp add --scope user --transport http litellm-admin-remote \
  https://admin-mcp.example.com/mcp \
  --header 'Authorization: Bearer <your-personal-proxy-admin-key>'
```

重新啟動 Claude Code，然後執行 `/mcp` 以檢查連線。此命令會將標頭儲存在您的私人用戶端設定中；您的 shell 可能會將其保留在歷史紀錄裡。

</TabItem>
<TabItem value="codex" label="Codex">

```toml title="~/.codex/config.toml"
[mcp_servers.litellm-admin-remote]
url = "https://admin-mcp.example.com/mcp"
bearer_token_env_var = "LITELLM_API_KEY"
```

在 Codex 程序的環境中設定 `LITELLM_API_KEY`。對於 Codex CLI：

```bash
export LITELLM_API_KEY='<your-personal-proxy-admin-key>'
codex
```

執行 `/mcp` 以檢查連線。

</TabItem>
</Tabs>

此端點使用 bearer API-key 驗證。它不提供瀏覽器 OAuth 登入，因此 `codex mcp login` 和僅限 OAuth 的連接器表單不適用。請使用上方的本機設定給 Claude Desktop。

檢查 `/healthz` 以確認程序健康狀態，然後重複讀取請求以驗證閘道存取。程序健康狀態良好不代表其閘道 URL、憑證或管理 API 可正常運作。

## 疑難排解 {#troubleshooting}

| 現象 | 檢查項目 |
| --- | --- |
| 找不到 `uvx` | 安裝 uv，並在桌面用戶端中使用可執行檔的絕對路徑。 |
| 啟動逾時 | 讓第一個套件/Python 下載完成；檢查是否可存取 GitHub 與套件下載。必要時提高用戶端的啟動逾時。 |
| 未經授權或遭禁止 | 使用由 `proxy_admin` 擁有的有效個人金鑰。唯讀模式不會授予其他角色的存取權。 |
| 遺失工具或架構探索失敗 | 檢查對 `/openapi.json` 與閘道管理路由的存取。若作業 ID 已變更，請更新連接器。 |
| 模型建立失敗 | 檢查資料庫、`STORE_MODEL_IN_DB`、精確的提供者/模型 ID，以及閘道憑證。 |
| 托管連線遭拒 | 檢查 `/mcp` URL、bearer 標頭、HTTPS proxy，以及 `LITELLM_MCP_PUBLIC_URL`。 |
| 寫入逾時 | 在重試前檢查閘道狀態；連接器不會重試工具呼叫。 |

請參閱 [連接器儲存庫](https://github.com/BerriAI/litellm-admin-mcp) 以取得結果分頁、架構探索選項，以及 Docker 托管。
