---
title: 搭配 SSO 的 Codex Desktop
sidebar_label: SSO
---

import CodexSSOAuth from './_codex_sso_auth.mdx';

# 使用 SSO 將 ChatGPT Desktop 中的 Codex 連接到 LiteLLM {#connect-codex-in-chatgpt-desktop-to-litellm-with-sso}

ChatGPT Desktop 中的 Codex 讀取與 [Codex CLI](./codex_cli_sso.md) 相同的 `~/.codex/config.toml`，並執行相同的驗證輔助程式。應用程式導覽設定、模型選取與 MCP 設定請參閱[桌面版設定指南](./codex_chatgpt_desktop.md)。

這些設定會設定應用程式中 Codex 的部分。一般 ChatGPT 聊天不會由 `~/.codex/config.toml` 設定，也不會經由 LiteLLM。

## 設定 SSO 驗證 {#configure-sso-authentication}

<CodexSSOAuth />

桌面應用程式可能不會繼承您在終端機中匯出的變數。請使用上方所示 `lite` 的絕對路徑。以 `auth` 命令取代 `env_key` 後，模型提供者可以略過 `~/.codex/.env` 中的 `LITELLM_API_KEY` 項目。[桌面版 MCP 設定](./codex_chatgpt_desktop.md#mcp-setup) 仍使用它自己的 bearer token 環境變數。

變更設定後，請重新啟動應用程式。

## 下一步 {#next-steps}

應用程式設定請參閱[桌面版設定指南](./codex_chatgpt_desktop.md)，模型探索與服務等級請參閱 [Codex CLI 設定指南](./codex_cli.md#model-catalog-and-service-tiers)。
