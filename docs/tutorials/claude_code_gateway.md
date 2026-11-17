---
title: Claude Code SSO
toc_max_heading_level: 2
description: 使用 Claude apps gateway 登入、Lite CLI SSO，或透過 LiteLLM 的 Claude 訂閱來設定 Claude Code。
---

# Claude Code SSO {#claude-code-sso}

選擇 [Claude apps gateway 設定](#gateway-setup)、[Lite CLI SSO](#lite-cli-sso)，或 [透過閘道的 Claude 訂閱](#claude-subscription)。

## Claude apps gateway 設定 {#gateway-setup}

使用 [Claude apps gateway](https://code.claude.com/docs/en/claude-apps-gateway) 登入流程，由 LiteLLM 實作其閘道通訊協定。請求會從 Claude Code 直接送到 LiteLLM，由 LiteLLM 處理提供者憑證，並依使用者與團隊追蹤使用量。

<span id="1-turn-the-gateway-on" />

**先決條件：** Claude Code **v2.1.195 或更新版本**，以及已 [設定 Claude apps gateway SSO](./claude_code_gateway_reference.md#1-turn-the-gateway-on) 的 LiteLLM 閘道。請向您的管理員詢問閘道 URL。

### 1. 設定 Claude Code {#3-point-claude-code-at-the-proxy}

將以下內容加入 Claude Code 的 managed settings 檔案：

```json title="managed-settings.json"
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://litellm.internal.example.com/claude_code_gateway"
}
```

將主機名稱換成您閘道的內部主機名稱。URL 中請保留 `/claude_code_gateway`。

| 平台 | Managed settings 檔案 |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux / WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

這些設定必須位於 managed 檔案中。Claude Code 會忽略 `~/.claude/settings.json` 中的這些設定。

### 2. 登入 {#3-sign-in}

執行 `claude`，或在現有的工作階段中輸入 `/login`。信任您的閘道，在瀏覽器中完成 SSO，並確認終端機中顯示的代碼。Claude Code 接著會顯示 **Cloud gateway**。送出一個提示，並查看 LiteLLM **Logs**。

<span id="how-it-works" />
<span id="2-verify-from-the-command-line" />
<span id="session-lifetime-and-sign-out" />
<span id="4-push-managed-settings-from-the-proxy" />
<span id="5-telemetry" />
<span id="deployment-topologies" />
<span id="known-limits" />
<span id="related-docs" />

若需網路需求與部署選項，請參閱 [Claude 官方 gateway 指南](https://code.claude.com/docs/en/claude-apps-gateway)。[LiteLLM gateway 參考](./claude_code_gateway_reference.md) 涵蓋受管理的政策、工作階段存續時間與已知限制。

## Lite CLI SSO {#lite-cli-sso}

使用您組織的 SSO 登入 LiteLLM。推論使用閘道的提供者憑證，費用由您的組織承擔。不需要 Claude 訂閱。

**先決條件：** [具有已儲存登入設定的 Lite CLI 版本](https://github.com/BerriAI/litellm/pull/47385)，以及已 [啟用 CLI SSO](../proxy/cli_sso.md#prerequisites---start-litellm-proxy-with-beta-flag) 的閘道。

### 設定一次 {#configure-once}

將 base URL 換成您閘道的 URL。將 `claude_subscription` 設為 `false` 以選取由閘道付費的推論，即使您先前使用過訂閱模式也一樣。

```bash
lite config set base_url https://dev.gateway.litellm-sandbox.ai
lite config set pkce true
lite config set claude_subscription false
```

### 登入並啟動 {#sign-in-and-launch}

```bash
lite login      # only when you're not signed in; uses PKCE automatically
lite claude
```

在瀏覽器中完成您組織的 SSO。`lite claude` 會以您的 LiteLLM 憑證啟動 Claude Code。送出一個提示，並查看 LiteLLM **Logs**。

## 透過閘道的 Claude 訂閱 {#claude-subscription}

使用您自己的 Claude 訂閱進行推論，同時透過 LiteLLM 路由請求。您的 claude.ai 登入會保持有效。

**先決條件：** [具有已儲存登入設定的 Lite CLI 版本](https://github.com/BerriAI/litellm/pull/47385)，以及已設定 [CLI 登入](../proxy/cli_sso.md#prerequisites---start-litellm-proxy-with-beta-flag) 與 [Claude 訂閱路由](./claude_code_max_subscription.md#step-1-configure-litellm-proxy) 的閘道。

### 設定一次 {#configure-once-1}

將 base URL 換成您閘道的 URL。

```bash
lite config set base_url https://dev.gateway.litellm-sandbox.ai
lite config set pkce true
lite config set claude_subscription true
```

### 登入並啟動 {#sign-in-and-launch-1}

```bash
lite login      # only when you're not signed in; uses PKCE automatically
lite claude     # keeps your claude.ai login; no flags needed
```

在使用訂閱模式前，請從您的 Claude Code 設定中移除任何 `apiKeyHelper` 或靜態 API 憑證。

`lite login` 會讓您登入 LiteLLM。Claude Code 會保留它自己的訂閱登入；如有需要，請在出現提示時登入您的 Claude 帳戶。送出一個提示，並查看 LiteLLM **Logs**。
