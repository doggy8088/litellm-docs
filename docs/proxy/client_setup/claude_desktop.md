---
title: 使用虛擬金鑰的 Claude Desktop & Cowork
---

import Image from '@theme/IdealImage';

# 使用虛擬金鑰將 Claude Desktop & Cowork 連接到 LiteLLM {#connect-claude-desktop--cowork-to-litellm-with-a-virtual-key}

Claude Desktop 與 Cowork 使用相同的閘道設定。本指南使用 LiteLLM 虛擬金鑰來設定它們；此連線也適用於 Code 工作階段，以及啟用時的 Chat。共用的用戶端設定請參閱 [Claude 的第三方部署總覽](https://claude.com/docs/third-party/claude-desktop/overview) 與[官方閘道設定指南](https://claude.com/docs/third-party/claude-desktop/gateway#configure-the-app)。若要使用身分提供者登入，請使用 [Desktop & Cowork SSO](../../tutorials/claude_desktop_cowork.md)。

## 虛擬金鑰操作導覽 {#virtual-key-walkthrough}

<iframe
  title="Claude Desktop & Cowork 虛擬金鑰設定"
  src="https://www.loom.com/embed/adb864c1f7c74de3bfc9584ca6d32080"
  frameBorder="0"
  allowFullScreen
  style={{ width: '100%', aspectRatio: '16/9', maxWidth: '900px', marginBottom: '20px' }}
></iframe>

## 快速參考 {#quick-reference}

| 設定 | 值 |
|---|---|
| 推理提供者 | **Gateway** |
| 憑證種類 | **Static API key** |
| Gateway 基礎 URL | `<LITELLM_PROXY_BASE_URL>`（例如 `http://localhost:4000`） |
| Gateway API key | 您的 LiteLLM [虛擬金鑰](../virtual_keys.md)，驗證方案 **Bearer** |
| MCP 端點 | `<LITELLM_PROXY_BASE_URL>/mcp`，或單一伺服器使用 `<LITELLM_PROXY_BASE_URL>/<server_name>/mcp` |
| MCP 驗證標頭 | `x-litellm-api-key: Bearer <virtual key>` |

## LLM 設定 {#llm-setup}

### 1. 啟用開發者模式 {#1-enable-developer-mode}

透過啟用 **Help -> Troubleshooting -> Enable Developer Mode**，開啟 [Claude 的應用程式內設定視窗](https://claude.com/docs/third-party/claude-desktop/in-app-configuration)。

<Image img={require('../../../img/client_setup/claude_desktop_01_enable_developer_mode.jpeg')} />

### 2. 開啟設定第三方推理 {#2-open-configure-third-party-inference}

開啟 Claude 選單，點選 **Developer**，然後點選 **Configure Third-Party Inference...**

<Image img={require('../../../img/client_setup/claude_desktop_02_developer_menu.jpeg')} />

<Image img={require('../../../img/client_setup/claude_desktop_03_configure_third_party.jpeg')} />

### 3. 輸入您的閘道 URL 和虛擬金鑰 {#3-enter-your-gateway-url-and-virtual-key}

在 **Connection** 區段中，將 **Inference provider** 設為 **Gateway**，並將 **Credential kind** 設為 **Static API key**，在 **Gateway base URL** 輸入您的 LiteLLM proxy URL，並在 **Gateway API key** 輸入您的虛擬金鑰，並將 **Gateway auth scheme** 保持為 **bearer**（LiteLLM 也接受 `x-api-key`）。點選 **Apply Changes**（較舊版本中稱為 **Apply locally**）。

<Image img={require('../../../img/client_setup/claude_desktop_04_gateway_url_and_key.jpeg')} />

如果您還沒有虛擬金鑰，請從 Admin UI 的 **Virtual Keys -> + Create New Key** 建立。將其範圍限定為 Claude 模型，並給予 `max_budget`；使用同一金鑰的所有人都會共用該預算。

<Image img={require('../../../img/client_setup/claude_desktop_05_create_virtual_key.jpeg')} />

### 4. 驗證 {#4-verify}

重新啟動 Claude Desktop。模型選擇器是由您閘道上的 `GET /v1/models` 建立，並保留包含 `claude` 或 `anthropic` 的 `model_name` 值，因此請相應命名您的部署。開始一個工作，然後在 Admin UI 的 **Logs** 或 **Usage** 中確認該請求，並以您的虛擬金鑰為歸屬。

<Image img={require('../../../img/client_setup/claude_desktop_06_verify_usage.jpeg')} />

## 受管理設定 {#managed-configuration}

使用設定視窗中的 **Export**，為您的機群建立一份設定檔。閘道設定為 `inferenceProvider: gateway`、`inferenceCredentialKind: static`、`inferenceGatewayBaseUrl` 與 `inferenceGatewayApiKey`，以及 `inferenceGatewayAuthScheme: bearer`（若您選取該方案，則為 `x-api-key`）。各平台專屬的受管理設定請參閱 [Claude 的設定參考資料](https://claude.com/docs/third-party/claude-desktop/configuration)。

使用同一把金鑰的裝置會共用其模型權限與預算。更新受管理的設定檔即可輪替該金鑰。請求會以該金鑰顯示在 **Logs** 與 **Usage** 中。

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

在此欄位中使用您自己的虛擬金鑰。Claude 可能會將靜態驗證標頭標記為類似憑證。若要輪替憑證，請參閱 Claude 的 [MCP 標頭協助工具指南](https://claude.com/docs/third-party/claude-desktop/extensions#short-lived-credentials-with-a-headers-helper)。

### 3. 在 Cowork 中驗證 {#3-verify-in-cowork}

套用設定並重新啟動 Claude Desktop。開始一個使用連接器中唯讀工具的 Cowork 工作，在提示時核准它，並確認該工具有回傳結果。工具使用 `<server>-<tool>` 命名慣例。

<Image img={require('../../../img/client_setup/claude_cowork_04_mcp_tool_result.png')} alt="Claude Cowork 透過 LiteLLM 連接器顯示唯讀 DeepWiki 工具結果" />

若要選擇單一伺服器，改用 `/<server_name>/mcp`。[MCP 設定參考資料](../../mcp_config_reference.md) 說明了端點選擇、伺服器篩選與驗證。

Claude Desktop 內建的連接器（`github`、`microsoft365`、`websearch`）會在應用程式內針對那些供應商的 API 執行，且不會經過 LiteLLM；只有 `url` 項目才會。對於需要使用者自身上游登入的伺服器，請在每個伺服器的 URL 上設定 `"oauth": true`，並讓 LiteLLM 執行流程；請參閱 [MCP OAuth passthrough](../../mcp_oauth_passthrough.md)。Claude 的 [MCP 設定指南](https://claude.com/docs/third-party/claude-desktop/extensions) 說明了 `headersHelper`、OAuth 與每個工具的政策。

## 下一步 {#next-steps}

[Desktop & Cowork SSO](../../tutorials/claude_desktop_cowork.md) 了解身分提供者登入；[使用 Claude Code 與 Claude Desktop 的自動路由器](../../tutorials/claude_code_autorouter.md)；[MCP 閘道參考資料](../../mcp.md)。
