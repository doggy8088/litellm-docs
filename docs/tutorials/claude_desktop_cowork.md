---
title: Claude Desktop & Cowork SSO
hide_table_of_contents: true
description: 設定 Claude Desktop 與 Cowork，透過第三方推論與 SSO 使用 LiteLLM。
---

# Claude Desktop & Cowork SSO {#claude-desktop--cowork-sso}

使用相同的第三方推論設定，將 Claude Desktop 與 Cowork 連接到您的 LiteLLM 閘道。

## 設定第三方推論 {#option-a-single-sign-on-with-your-identity-provider}

您的閘道必須已為您的身分提供者設定 [JWT 驗證](../proxy/token_auth.md)。請向您的管理員取得閘道 URL、OIDC client ID 與 issuer URL。

1. 在 Claude Desktop 中，開啟 **Help > Troubleshooting > Enable Developer Mode**，再開啟 **Developer > Configure Third-Party Inference**。
2. 在 **Connection** 中輸入以下設定：

   | 設定 | 值 |
   |---|---|
   | 推論提供者 | **Gateway** |
   | 閘道 base URL | 您的 LiteLLM 閘道 URL |
   | 憑證類型 | **Interactive sign-in** |
   | 閘道 SSO IdP (OIDC) | 您的 **Client ID** 與 **Issuer URL** |

3. 按一下 **Apply Changes**，再按 **Sign in to your organization** 並完成 SSO。
4. 開始一段對話或 Cowork 任務。確認該請求出現在 LiteLLM **Logs** 中、位於您的使用者之下。

身分提供者註冊、其他欄位與部署細節，請參閱 Claude 官方的[應用程式內設定指南](https://claude.com/docs/third-party/claude-desktop/in-app-configuration)與[閘道 SSO 指南](https://claude.com/docs/third-party/claude-desktop/gateway#single-sign-on-with-your-identity-provider)。若需要將設定散布到多部裝置，請使用 **Export**。

<span id="option-b-static-virtual-key" />

如需 API 金鑰驗證，請使用[虛擬金鑰](../proxy/client_setup/claude_desktop.md)。
