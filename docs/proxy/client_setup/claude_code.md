---
title: Claude Code (CLI)
sidebar_label: Claude Code (CLI)
---

import Image from '@theme/IdealImage';

# 將 Claude Code 連接到 LiteLLM {#connect-claude-code-to-litellm}

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 會與 Anthropic Messages API 通訊。LiteLLM 在 `/v1/messages` 提供該格式，因此兩個環境變數可將 Claude Code 指向閘道，讓它能使用您設定中的任何模型，而不只限於 Anthropic 的模型。

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---|---|
| `ANTHROPIC_BASE_URL` | `<LITELLM_PROXY_BASE_URL>`（例如 `http://localhost:4000`） |
| `ANTHROPIC_AUTH_TOKEN` | 您的 LiteLLM [虛擬金鑰](../virtual_keys.md) |
| `ANTHROPIC_MODEL` | 來自您設定的一個 `model_name` |
| MCP 端點 | `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp` |
| MCP 驗證標頭 | `x-litellm-api-key: Bearer <virtual key>` |

## LLM 設定 {#llm-setup}

### 1. 將 Claude Code 指向閘道 {#1-point-claude-code-at-the-gateway}

匯出 base URL、您的虛擬金鑰和模型，然後啟動 Claude Code：

```bash
export LITELLM_API_KEY="sk-<your-virtual-key>"
export ANTHROPIC_BASE_URL="http://localhost:4000"
export ANTHROPIC_AUTH_TOKEN="$LITELLM_API_KEY"
export ANTHROPIC_MODEL="{{anthropic}}"

claude
```

Claude Code 會將每個請求送到 LiteLLM 的 `/v1/messages` 端點，並使用您的虛擬金鑰作為 bearer token。若要永久生效，請將這些 export 加入您的 shell 設定檔（`~/.zshrc`、`~/.bashrc`）或 Claude Code 的 `settings.json` 的 `env` 區塊中。如果您的 shell 也設定了 `ANTHROPIC_API_KEY`，請在此工作階段中將其取消設定，以免 Claude Code 傳送它而不是虛擬金鑰。

### 2. 選擇模型 {#2-pick-a-model}

Claude Code 會送出所選取的任何模型 ID，因此該 ID 必須存在於您閘道上的一個 `model_name`。`ANTHROPIC_MODEL` 會將預設值固定為您的其中一個名稱。工作階段內的 `/model` 選擇器仍會列出 Anthropic 自己的 ID（例如 `claude-haiku-4-5-20251001`），因此選擇那些項目會導致 `Invalid model name passed in`，除非您的設定也定義了完全相同的名稱；您可以將那些名稱加入 `model_list`，或是持續透過 `ANTHROPIC_MODEL` 切換模型。[將 Claude Code 路由到非 Anthropic 模型](../../tutorials/claude_non_anthropic_models.md) 說明如何將 Sonnet、Opus 和 Haiku 層級對應到任何提供者。

### 3. 驗證 {#3-verify}

傳送一個提示。在此，Claude Code 2.1 正透過本機閘道回應，並將 `ANTHROPIC_MODEL` 設為來自 `model_list` 的模型：

<Image img={require('../../../img/client_setup/claude_code_llm.png')} />

接著在 Admin UI 的 **Logs** 或 **Usage** 中確認流量，且其歸屬為您的虛擬金鑰與您選擇的模型。

## 不使用靜態金鑰登入 {#sign-in-without-a-static-key}

[Claude Code Gateway SSO](../../tutorials/claude_code_gateway.md) 是原生裝置登入選項，建議用於大規模部署，且不需要每位使用者各自的金鑰。您也可以在 [`lite auth print-token`](../cli_sso.md#use-the-credential-from-other-tools) 之後將其作為 [`lite login --pkce`](../cli_sso.md#browser-sign-in-with-pkce) 的 `apiKeyHelper` 使用，或使用 [IdP JWT helper](../../tutorials/claude_code_okta_sso.md)

`lite login --pkce --config-claude` 會將此登入的金鑰寫入 `~/.claude/settings.json`，並設為 `env.ANTHROPIC_AUTH_TOKEN`；請在金鑰過期後重新執行，或設定 `apiKeyHelper`，讓 Claude Code 自行取得新的 token

如果使用者的 team 或 key 限制了模型，Claude Code 的預設模型名稱必須在該清單中，或將 `ANTHROPIC_MODEL` 設為允許的別名。否則請求會以 `403 The requested model '...' is not available for this API key` 失敗

## MCP 設定 {#mcp-setup}

使用 `claude mcp add` 在 Claude Code 中公開您的 LiteLLM [MCP 閘道](../../mcp.md) 工具。URL 為 `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp`，其中 `<server_name>` 對應您閘道設定中 `mcp_servers:` 底下的一個金鑰，而虛擬金鑰則放在 `x-litellm-api-key` 標頭中：

```bash
claude mcp add --transport http litellm-tools \
  http://localhost:4000/my_mcp_server/mcp \
  --header "x-litellm-api-key: Bearer $LITELLM_API_KEY"
```

| 部分 | 含義 |
|---|---|
| `litellm-tools` | Claude Code 內此伺服器的名稱；可任意選擇 |
| `http://localhost:4000/my_mcp_server/mcp` | `<PROXY_URL>/<server_name>/mcp`；`my_mcp_server` 必須與閘道上 `mcp_servers:` 底下的金鑰相符 |
| `--header "x-litellm-api-key: Bearer $LITELLM_API_KEY"` | 您的虛擬金鑰，用於向閘道驗證您的身分 |

該金鑰需要可存取 `my_mcp_server`（請參閱[概覽](./overview.md#the-values-you-will-reuse-everywhere)）；否則閘道會以 `The key is not allowed to access the requested MCP servers` 拒絕連線。啟動 Claude Code 並執行 `/mcp`：伺服器會顯示為已連線，並列出其工具，且工具名稱以前綴伺服器名稱（`my_mcp_server-read_wiki_structure`）顯示。

<Image img={require('../../../img/client_setup/claude_code_mcp.png')} />

對於位於上游 OAuth 後方的伺服器（例如代管的 GitHub 或 Atlassian MCP），請將 LiteLLM 金鑰保留在 `x-litellm-api-key`，並讓 LiteLLM 執行 OAuth 流程；請參閱[MCP OAuth](../../mcp_oauth.md)。

## 下一步 {#next-steps}

透過預算、提示快取和備援來[降低 Claude Code 成本](../../tutorials/claude_code_cut_costs.md)，[使用您自己的 Anthropic 金鑰](../../tutorials/claude_code_byok.md)，[將 Claude Code 路由到非 Anthropic 模型](../../tutorials/claude_non_anthropic_models.md)，或查看[Claude Code 相容性矩陣](../../claude_code_compatibility.md)。
