---
title: Codex (ChatGPT Desktop)
sidebar_label: Codex (ChatGPT Desktop)
---

import Image from '@theme/IdealImage';

# 將 ChatGPT Desktop 中的 Codex 連接到 LiteLLM {#connect-codex-in-chatgpt-desktop-to-litellm}

在 [ChatGPT 桌面應用程式](https://openai.com/chatgpt/download/) 中選取 **Codex**。它讀取與 [Codex CLI](./codex_cli.md) 相同的 `~/.codex/config.toml`，因此桌面版與 CLI 可以共用一個 LiteLLM 連線。

這些設定會設定應用程式中 Codex 的部分，該部分會讀取 `~/.codex/config.toml`。應用程式中的一般 ChatGPT 聊天不會由該檔案設定，也不會經由 LiteLLM

相同的 `model_catalog_json` 設定也適用於此應用程式；請參閱 [自訂別名的模型中繼資料](./codex_cli.md#model-metadata-for-custom-aliases)

這些指示會設定 Codex 的本機模型提供者與 MCP 伺服器。截圖顯示的是 Linux 上的 ChatGPT Desktop 26.917.51856；選單標籤可能因應用程式版本而異。若有提示，請先完成應用程式的導覽設定，再選取 Codex。

<Image img={require('../../../img/client_setup/codex_desktop_01_mode_switcher_chatgpt_codex.png')} alt="已選取 Codex 的 ChatGPT Desktop 模式切換器" />

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---|---|
| 設定檔 | `~/.codex/config.toml`（與 CLI 共用） |
| `base_url` | `<LITELLM_PROXY_BASE_URL>/v1`（例如 `http://localhost:4000/v1`） |
| 提供者金鑰 | 您的 LiteLLM [虛擬金鑰](../virtual_keys.md)，從 `env_key` 中命名的環境變數讀取，或使用 `lite auth print-token` 命令（請參閱 [Codex CLI SSO](./codex_cli.md#sign-in-with-litellm-sso)） |
| MCP 端點 | `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp` |
| MCP 驗證 | 相同的虛擬金鑰，從 `bearer_token_env_var` 中命名的環境變數讀取 |

## LLM 設定 {#llm-setup}

### 1. 將 LiteLLM 新增為模型提供者 {#1-add-litellm-as-a-model-provider}

開啟 **Settings -> Configuration -> Open config.toml**，或直接編輯 `~/.codex/config.toml`，並新增一個指向您閘道 Responses API 端點的提供者區塊。這與 [CLI 設定](./codex_cli.md#llm-setup) 完全相同：

```toml title="~/.codex/config.toml"
model = "{{anthropic}}"
model_provider = "litellm"

[model_providers.litellm]
name = "LiteLLM"
base_url = "http://localhost:4000/v1"
env_key = "LITELLM_API_KEY"
wire_api = "responses"
```

將 `{{anthropic}}` 替換為在您的閘道上設定的模型名稱。

<Image img={require('../../../img/client_setup/codex_desktop_03_settings_configuration_open_config_toml.png')} alt="顯示 Open config.toml 連結的 Codex Configuration 設定" />

桌面應用程式可能不會繼承您在終端機中匯出的環境變數。請在啟動應用程式之前，將您的 LiteLLM 虛擬金鑰新增至 `~/.codex/.env`：

```dotenv title="~/.codex/.env"
LITELLM_API_KEY=sk-<your-virtual-key>
```

將預留位置替換為您的虛擬金鑰，將此檔案保密，並在變更後重新啟動應用程式。現有使用 `launchctl setenv LITELLM_API_KEY <your-key>` 的 macOS 設定可以繼續透過該方式提供此變數。

您可以透過使用 [`auth` 命令](./codex_cli.md#sign-in-with-litellm-sso) 取代 `env_key` 來略過 `.env`，因為應用程式會執行相同的輔助程式

### 2. 在 ChatGPT Desktop 中啟動 Codex {#2-launch-codex-in-chatgpt-desktop}

開啟 ChatGPT 桌面應用程式，並在模式切換器中選取 **Codex**。Codex 會從 `config.toml` 讀取 `litellm` 提供者，並使用 `LITELLM_API_KEY` 來進行閘道請求。開始一個新任務。

### 3. 驗證 {#3-verify}

執行一個任務，然後在 **Logs** 或 **Usage** 下方檢查 Admin UI；該請求應歸屬於您的虛擬金鑰。

若要使用不同的閘道模型，請在 `config.toml` 中更新 `model`，然後開始一個新任務。

## MCP 設定 {#mcp-setup}

### 1. 設定閘道伺服器 {#1-configure-the-gateway-server}

MCP 是在相同的 `~/.codex/config.toml` 中設定，因此 [CLI 的 MCP 設定](./codex_cli.md#mcp-setup) 可直接套用且不需變更。新增：

```toml title="~/.codex/config.toml"
[mcp_servers.litellm]
url = "http://localhost:4000/my_mcp_server/mcp"
bearer_token_env_var = "LITELLM_API_KEY"
```

其中 `my_mcp_server` 符合您閘道設定中 `mcp_servers:` 底下的一個金鑰，且該金鑰可存取該伺服器。`LITELLM_API_KEY` 必須如上所述可供應用程式使用。在變更設定或 `.env` 檔案後，請重新啟動 ChatGPT Desktop。

您可以在擷取的版本中，於 **Settings -> Plugins -> MCPs** 下檢視此項目。**Add MCP server** 表單也接受上方顯示的 URL 與 **Bearer token env var**。

<Image img={require('../../../img/client_setup/codex_desktop_06_mcp_server_form_url_bearer_env.png')} alt="Codex MCP 伺服器表單，顯示 LiteLLM 伺服器 URL 與 LITELLM_API_KEY bearer token 環境變數" />

截圖使用名為 `deepwiki` 的閘道伺服器；請以您註冊的伺服器名稱替換。

### 2. 在應用程式中驗證連線 {#2-verify-the-connection-in-the-app}

開啟 **Settings -> Plugins -> MCPs**，並確認 `litellm` 已啟用。某些版本會將此清單直接顯示在 **Settings -> MCP servers** 下方。

<Image img={require('../../../img/client_setup/codex_desktop_04_settings_plugins_mcp_servers_list.png')} alt="Codex MCP 設定列出已啟用的 LiteLLM 伺服器" />

開始一個會呼叫您伺服器上唯讀工具的任務，若有提示請核准，並確認它有回傳結果。

<Image img={require('../../../img/client_setup/codex_desktop_09_mcp_tool_result.png')} alt="Codex 顯示透過 LiteLLM 傳回的 DeepWiki 工具結果" />

請參閱 [MCP 設定參考](../../mcp_config_reference.md) 以了解端點與驗證選項。

## 下一步 {#next-steps}

[Codex CLI](./codex_cli.md) 會共用此設定檔。另請參閱 [LiteLLM 虛擬金鑰](../virtual_keys.md) 與 [MCP 閘道參考](../../mcp.md)。
