---
title: 身分驗證
sidebar_label: 總覽
description: 選擇使用者與應用程式向 LiteLLM 進行身分驗證的方式。
---

# 身分驗證 {#authentication}

{/* keep-version-note */}

身分驗證可識別呼叫 LiteLLM 或登入 Admin UI 的使用者或應用程式。

該身分可以使用與管理的內容，請在 [Access Management](./access_management/overview.md) 中設定。

## 選擇流程 {#choose-a-flow}

| 流程 | 使用時機 | 指南 |
| --- | --- | --- |
| Virtual Keys | 使用 LiteLLM 憑證呼叫閘道。 | [使用 Virtual Key](./api_key_auth.md) |
| 單一登入 | 使用您組織的身分提供者登入。 | [OIDC](./admin_ui_sso.md)、[SAML](./saml_sso.md) |
| 身分對應 | 將身分提供者的 token 連結到 LiteLLM 身分。 | [使用者與團隊](./jwt_user_team_auth.md)、[Virtual Keys](./jwt_key_mapping.md) |
| ID-JAG | 讓應用程式跨服務代表已登入的使用者行事。 | [ID-JAG](./id_jag/overview.md) |
| Custom Auth | 使用您自己的處理常式驗證呼叫者。 | [Custom Auth](./custom_auth.md) |
| 用戶端憑證 | 在您的 ingress 要求用戶端憑證，然後使用 LiteLLM 金鑰授權請求。 | [使用 mTLS 的用戶端驗證](./deploy/mtls.md) |

使用 [Identity-Aware Proxy](./deploy/iap/overview.md) 在流量抵達 LiteLLM 之前檢查員工或工作負載身分。LiteLLM 接著會套用其自身的身分驗證與權限。

## 單一登入 {#single-sign-on}

使用建立在 OAuth 2.0 之上的身分層 [OpenID Connect (OIDC)](./admin_ui_sso.md) 登入 Admin UI。當您的組織使用 SAML 登入時，[SAML](./saml_sso.md) 是另一種選擇。

## 身分對應 {#identity-mapping}

應用程式可以直接將身分提供者的 JWT 傳送至 LiteLLM。LiteLLM 會驗證 token，然後將其宣告對應到[使用者與團隊](./jwt_user_team_auth.md)或既有的 [Virtual Key](./jwt_key_mapping.md)。

對於機器對機器請求，請對應能識別應用程式或工作負載的宣告。

## 委派身分 {#delegated-identity}

[ID-JAG](./id_jag/overview.md) 連結代表已登入使用者行事的應用程式。當另一個應用程式需要為該使用者呼叫 LiteLLM，或 LiteLLM 需要為他們呼叫 MCP 伺服器時，請使用它。

身分提供者與目標服務的授權伺服器都必須支援 ID-JAG。
