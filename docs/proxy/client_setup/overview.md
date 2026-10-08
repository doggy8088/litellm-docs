---
title: 用戶端設定
sidebar_label: 總覽
---

import Image from '@theme/IdealImage';

# 將用戶端連線至 LiteLLM {#connect-a-client-to-litellm}

當您的 LiteLLM 閘道執行中時，程式開發工具或聊天應用程式就可以將模型流量透過它進行路由。每個用戶端會根據不同情況，以虛擬金鑰或登入權杖進行驗證，而本節中的每個頁面都會逐步說明其設定

**LLM 路由**會將用戶端的模型流量指向 LiteLLM。用戶端維持其原本的介面，但每個請求都會經過閘道，因此您可透過單一 API 介面存取 100+ 個模型，並同時獲得支出追蹤、預算與防護欄。請從您的設定中設置閘道基礎 URL 與 `model_name`，然後使用該用戶端支援的憑證

**MCP** 會將用戶端連線到 LiteLLM 的 [MCP 閘道](../../mcp.md)，讓其可呼叫您在那裡公開的工具。用戶端透過 MCP 端點連到 LiteLLM，並以虛擬金鑰進行驗證；LiteLLM 會將請求分發到您註冊的上游 MCP 伺服器，並在過程中套用存取控制、成本追蹤與防護欄。

## 每個用戶端支援哪些功能 {#what-each-client-supports}

| 用戶端 | 介面 | LLM 路由 | MCP |
|---|---|---|---|
| [Claude Code](./claude_code.md) | CLI | 是 | 是 |
| [Claude Desktop](./claude_desktop.md) | GUI | 是 | 是 |
| [Codex (CLI)](./codex_cli.md) | CLI | 是，透過 `/v1/responses` | 是 |
| [Codex (ChatGPT Desktop)](./codex_chatgpt_desktop.md) | GUI | 是，透過 `/v1/responses` | 是 |
| 一般 ChatGPT 對話（ChatGPT Desktop） | GUI | 否，它們會保持在您的 ChatGPT 工作區中 | 此處未涵蓋 |

## 兩種憑證，兩次跳轉 {#two-credentials-two-hops}

透過 LiteLLM 的請求會經過兩次驗證。用戶端以虛擬金鑰或登入權杖向 LiteLLM 驗證，這會識別使用者與團隊，並決定適用哪些模型、預算與防護欄。接著 LiteLLM 會使用其自身 `model_list` 中的憑證呼叫提供者，因此開發人員從不需要持有 OpenAI 或 Anthropic 金鑰，而他們個人的 Claude 或 ChatGPT 訂閱也不會被使用

對使用者自身訂閱進行計費是一個獨立、可選的設定：[Claude Code Max](../../tutorials/claude_code_max_subscription.md) 與 [BYOK](../../tutorials/claude_code_byok.md) 會將使用者的 Anthropic 憑證向上游轉送，而 [ChatGPT 訂閱提供者](../../providers/chatgpt.md) 會透過代理程式上的 ChatGPT 登入來路由模型

## 選擇使用者的登入方式 {#choose-how-users-sign-in}

| 用戶端 | 靜態金鑰 | 登入，不需手動發行長效金鑰 | 授權 | 一鍵設定 |
|---|---|---|---|---|
| Claude Code | `ANTHROPIC_AUTH_TOKEN` 中的虛擬金鑰 | [Claude Code Gateway](../../tutorials/claude_code_gateway.md) 裝置登入、將 [`lite auth print-token`](../cli_sso.md) 作為 `apiKeyHelper`，或使用 [IdP JWT 輔助工具](../../tutorials/claude_code_okta_sso.md) | 透過 IdP 的 Gateway 裝置登入與 `lite login`：最多 5 位 SSO 使用者免費，超過則需 Enterprise。IdP JWT 輔助工具：Enterprise | `lite configure claude` |
| Claude Desktop | Gateway API 金鑰 | [互動式 OIDC](../../tutorials/claude_desktop_cowork.md) | Enterprise（JWT 驗證） | 無 |
| Codex CLI | 透過 `env_key` 的虛擬金鑰 | [將 `lite auth print-token` 作為提供者 `auth` 指令](./codex_cli.md#sign-in-with-litellm-sso) | 透過 IdP 的 `lite login`：最多 5 位 SSO 使用者免費，超過則需 Enterprise | `lite configure codex` |
| ChatGPT Desktop 中的 Codex | 透過 `env_key` 與 `~/.codex/.env` 的虛擬金鑰 | 相同的 `auth` 指令，因為應用程式會讀取相同的 `config.toml` | 透過 IdP 的 `lite login`：最多 5 位 SSO 使用者免費，超過則需 Enterprise | 與 Codex CLI 相同 |

每種登入流程都會使用與使用者 LiteLLM 身分與團隊相關聯的短效權杖。這些流程移除了管理員原本必須發行、分發與輪替的長效虛擬金鑰

對於大規模部署，每種登入路徑都需要 Enterprise 授權。透過身分提供者的 SSO 在 5 位使用者以內免費，而 JWT 驗證在任何規模都屬於 Enterprise。未授權的代理程式會以 `403 JWT Auth is an enterprise only feature` 拒絕 JWT 驗證。請參閱 [Enterprise](../../enterprise.md)

[`lite configure`](../../auto_router/user_setup.md) 會將提供的憑證寫入用戶端的設定檔。對於 Codex，它會以純文字 `Authorization: Bearer` 標頭的形式寫入 `config.toml`，位於 `http_headers` 下，且不含 `env_key`，因此當長效金鑰不應存放在磁碟上時，請使用上方的登入選項

## 功能取捨 {#feature-tradeoffs}

| 用戶端 | 與 LiteLLM 的通訊協定 | 最適合 | 主要限制 |
|---|---|---|---|
| Claude Code | Anthropic Messages、`/v1/messages` | Anthropic、Bedrock、Vertex AI 或 Azure Foundry 上的 Claude 模型 | 其他提供者會被轉譯，而各提供者的功能支援請見 [相容性矩陣](../../claude_code_compatibility.md)。Claude Code 在閘道工作階段中會關閉伺服器端 WebSearch，且提示快取 TTL 為 5 分鐘（[已知限制](../../tutorials/claude_code_gateway.md#known-limits)）。模型允許清單必須包含 Claude Code 傳送的模型名稱 |
| Claude Desktop | Anthropic Messages、`/v1/messages`，以及來自 `/v1/models` 的模型 | Claude 模型 | 模型的 `model_name` 必須包含 `claude` 或 `anthropic` 才會出現在選擇器中。非 Claude 模型需要 `drop_params: true`，而 Claude for Teams 或 Enterprise 組織必須將閘道模型名稱加入允許清單（[選擇器中的模型](../../tutorials/claude_desktop_cowork.md#models-in-the-picker)） |
| 一般 ChatGPT 對話 | 未路由 | 不適用 | 它們會保持在您的 ChatGPT 工作區中，因此 LiteLLM 不會追蹤或管理它們 |
| Codex（CLI 與桌面版） | OpenAI Responses、`/v1/responses` | OpenAI 模型，原生使用 Responses API | 自訂 `model_name` 需要一筆 [模型目錄項目](./codex_cli.md#model-metadata-for-custom-aliases)；若沒有，Codex 會使用一般模型中繼資料。在測試中，shell 工具呼叫與後續回合在 OpenAI 路徑與轉譯後的 Anthropic 路徑上都可正常運作，而 Codex 網頁搜尋也可在 Anthropic 路徑上執行。現在尚未有 Codex 相容性矩陣，因此在部署前請先確認您路徑上的其他功能 |

## 您將在各處重複使用的值 {#the-values-you-will-reuse-everywhere}

請從管理員 UI 的 **Virtual Keys -> + Create New Key**，或使用 `POST /key/generate` 建立虛擬金鑰。

<Image img={require('../../../img/client_setup/claude_desktop_05_create_virtual_key.jpeg')} />

| 值 | 來源 | 範例 |
|---|---|---|
| 閘道基礎 URL | 您的代理程式監聽的位置 | `http://localhost:4000` |
| 虛擬金鑰 | 管理員 UI：**Virtual Keys -> + Create New Key**，或 `POST /key/generate` | `sk-<your-virtual-key>` |
| 模型名稱 | 您設定檔中 `model_list` 底下的一個 `model_name` | `{{anthropic}}` |
| MCP 端點 | 所有該金鑰可見的伺服器使用 `<base URL>/mcp`，或單一伺服器使用 `<base URL>/<server_name>/mcp` | `http://localhost:4000/my_mcp_server/mcp` |
| MCP 驗證標頭 | 作為 bearer token 的您的虛擬金鑰，位於 `Authorization` 或 `x-litellm-api-key` | `Authorization: Bearer sk-<your-virtual-key>` |

LiteLLM 在 MCP 端點上接受虛擬金鑰，格式可為 `Authorization: Bearer <key>` 或 `x-litellm-api-key: Bearer <key>`。設定 bearer token 選項時，請使用您的虛擬金鑰；用戶端會將其放在 `Authorization` 中傳送。設定自訂標頭時，建議使用 `x-litellm-api-key`，如此可保留 `Authorization` 供上游伺服器自身的 OAuth token 使用。端點與標頭的選擇請參閱 [MCP 設定參考](../../mcp_config_reference.md)。

:::info 授予該金鑰存取 MCP 伺服器

虛擬金鑰只能看見已授權給它的 MCP 伺服器。若未授權，閘道會回應 `The key is not allowed to access the requested MCP servers: my_mcp_server`。請透過 `"object_permission": {"mcp_servers": ["my_mcp_server"]}` 在 `POST /key/generate`、其團隊，或使用 `allow_all_keys: true` 將伺服器設為公開來授予該金鑰存取權。詳細內容請見 [MCP 存取控制](../../mcp_control.md)。

:::

如果您目前還沒有執行中的閘道，請先從 [部署閘道 -> 快速入門](../docker_quick_start.md) 開始，然後回到這裡連線您的用戶端。
