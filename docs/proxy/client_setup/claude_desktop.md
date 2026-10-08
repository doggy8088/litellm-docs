---
title: Claude Desktop (GUI)
sidebar_label: Claude Desktop (GUI)
---

import Image from '@theme/IdealImage';

# 將 Claude Desktop 連接到 LiteLLM {#connect-claude-desktop-to-litellm}

[Claude Desktop](https://claude.ai/download) 在第三方推理下，會將 Cowork、Chat 和 Code 工作階段中的每一次模型呼叫都送到您指定的閘道，並透過同一個閘道連線到 MCP 伺服器。本頁是最快的路徑：單一裝置、靜態虛擬金鑰、從應用程式內完成設定。若要透過您的身分提供者進行單一登入、模型選擇器規則，以及將設定推送到整個機群，請參閱 [Claude Desktop（Cowork）](../../tutorials/claude_desktop_cowork.md)。

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---|---|
| 推理提供者 | **Gateway** |
| Gateway 基礎 URL | `<LITELLM_PROXY_BASE_URL>`（例如 `http://localhost:4000`） |
| Gateway API key | 您的 LiteLLM [虛擬金鑰](../virtual_keys.md)，驗證方案 **Bearer** |
| MCP 端點 | `<LITELLM_PROXY_BASE_URL>/mcp`，或單一伺服器使用 `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp` |
| MCP 驗證標頭 | `x-litellm-api-key: Bearer <virtual key>` |

## LLM 設定 {#llm-setup}

### 1. 啟用開發者模式 {#1-enable-developer-mode}

在 Claude Desktop 中，開啟 **Help -> Troubleshooting -> Enable Developer Mode**。

<Image img={require('../../../img/client_setup/claude_desktop_01_enable_developer_mode.jpeg')} />

### 2. 開啟設定第三方推理 {#2-open-configure-third-party-inference}

開啟 Claude 選單，點選 **Developer**，然後點選 **Configure Third-Party Inference...**

<Image img={require('../../../img/client_setup/claude_desktop_02_developer_menu.jpeg')} />

<Image img={require('../../../img/client_setup/claude_desktop_03_configure_third_party.jpeg')} />

### 3. 輸入您的閘道 URL 和虛擬金鑰 {#3-enter-your-gateway-url-and-virtual-key}

在 **Connection** 區段中，將 **Inference provider** 設為 **Gateway**，在 **Gateway base URL** 輸入您的 LiteLLM proxy URL，並在 **Gateway API key** 輸入您的虛擬金鑰，並將 **Gateway auth scheme** 保持為 **bearer**（LiteLLM 也接受 `x-api-key`）。點選 **Apply Changes**（較舊版本中稱為 **Apply locally**）。

<Image img={require('../../../img/client_setup/claude_desktop_04_gateway_url_and_key.jpeg')} />

如果您還沒有虛擬金鑰，請從 Admin UI 的 **Virtual Keys -> + Create New Key** 建立。將其範圍限定為 Claude 模型，並給予 `max_budget`；使用同一金鑰的所有人都會共用該預算。

<Image img={require('../../../img/client_setup/claude_desktop_05_create_virtual_key.jpeg')} />

### 4. 驗證 {#4-verify}

重新啟動 Claude Desktop。模型選擇器是由您閘道上的 `GET /v1/models` 建立，並保留包含 `claude` 或 `anthropic` 的 `model_name` 值，因此請相應命名您的部署。開始一個工作，然後在 Admin UI 的 **Logs** 或 **Usage** 中確認該請求，並以您的虛擬金鑰為歸屬。

<Image img={require('../../../img/client_setup/claude_desktop_06_verify_usage.jpeg')} />

## MCP 設定 {#mcp-setup}

以下 MCP 螢幕截圖使用的是 Linux 上的 Claude Desktop 2.2553.13 與本機示範閘道。選單標籤可能因應用程式版本而異。

### 1. 新增閘道連接器 {#1-add-the-gateway-connector}

開啟 **Configure Third-Party Inference** 並找到 **Connectors**。新增一個名為 `litellm` 的伺服器，選取 **Streamable HTTP**，並輸入 `http://localhost:4000/mcp` 作為 URL。將基礎 URL 替換為您的閘道位址。此端點會公開您的金鑰可存取的伺服器。

將標頭 `x-litellm-api-key` 設為 `Bearer <your virtual key>`。依照 [總覽](./overview.md#the-values-you-will-reuse-everywhere) 所述，授予該金鑰對該 MCP 伺服器的存取權。在匯出的設定中，這是 `managedMcpServers` 中的一個項目：

```json
[
  {
    "name": "litellm",
    "transport": "http",
    "url": "http://localhost:4000/mcp",
    "headers": {"x-litellm-api-key": "Bearer sk-<your-virtual-key>"}
  }
]
```

### 2. 測試連線 {#2-test-the-connection}

點選 **Sign in & test**（在某些版本中稱為 **Test this connection**）。Claude 會使用您輸入的 URL 和憑證執行 MCP 初始化與工具探索，然後顯示探索到的工具或連線錯誤。在儲存設定之前，請確認這些工具屬於預期的伺服器。

<Image img={require('../../../img/client_setup/claude_desktop_02_mcp_connector_connected_tools.png')} alt="Claude 連接器設定顯示 LiteLLM MCP URL、示範金鑰，以及三個探索到的工具" />

在此欄位中使用您自己的虛擬金鑰。Claude 可能會將靜態驗證標頭標記為類似憑證。對於受管理的部署，[進階指南](../../tutorials/claude_desktop_cowork.md#mcp-servers-through-the-litellm-mcp-gateway) 會說明一個憑證協助工具。

### 3. 在 Cowork 中驗證 {#3-verify-in-cowork}

套用設定並重新啟動 Claude Desktop。開始一個使用連接器中唯讀工具的 Cowork 工作，在提示時核准它，並確認該工具有回傳結果。工具使用 `<server>-<tool>` 命名慣例。

<Image img={require('../../../img/client_setup/claude_cowork_04_mcp_tool_result.png')} alt="Claude Cowork 透過 LiteLLM 連接器顯示唯讀 DeepWiki 工具結果" />

若要選擇單一伺服器，改用 `/<server_name>/mcp`。[MCP 設定參考資料](../../mcp_config_reference.md) 說明了端點選擇、伺服器篩選與驗證。

Claude Desktop 內建的連接器（`github`、`microsoft365`、`websearch`）會在應用程式內針對那些供應商的 API 執行，且不會經過 LiteLLM；只有 `url` 項目才會。對於需要使用者自身上游登入的伺服器，請在每個伺服器的 URL 上設定 `"oauth": true`，並讓 LiteLLM 執行流程；請參閱 [MCP OAuth passthrough](../../mcp_oauth_passthrough.md)。[完整指南](../../tutorials/claude_desktop_cowork.md#mcp-servers-through-the-litellm-mcp-gateway) 說明了適用於單一登入機群與每個工具政策的 `headersHelper`。

## 下一步 {#next-steps}

[Claude Desktop（Cowork）](../../tutorials/claude_desktop_cowork.md) 了解 SSO、模型選擇器規則、機群推送與疑難排解；[使用 Claude Code 與 Claude Desktop 的自動路由器](../../tutorials/claude_code_autorouter.md)；[MCP 閘道參考資料](../../mcp.md)。
