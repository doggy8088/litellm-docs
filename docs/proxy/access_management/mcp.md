---
title: MCP 存取
description: 管理團隊與應用程式的 MCP 伺服器與工具存取。
---

# MCP 存取 {#mcp-access}

{/* keep-version-note */}

以 [proxy 管理員](../access_control.md#global-proxy-roles)身分登入，並[註冊您的 MCP 伺服器](../../mcp#adding-your-mcp)。

## 讓團隊取得存取權 {#give-a-team-access}

開啟 **Teams**，選取團隊，再開啟 **Settings → Edit Settings**。在 **MCP Servers / Access Groups** 底下選取團隊需要的伺服器。關閉團隊不得使用的工具，然後按一下 **Save Changes**。

若是新團隊，請使用 **Create Team → MCP Settings → Allowed MCP Servers**。

## 讓應用程式取得存取權 {#give-an-application-access}

開啟 **Virtual Keys → + Create New Key**。選擇團隊並為金鑰命名。展開 **MCP Settings**，然後在 **Allowed MCP Servers** 底下選取應用程式的伺服器。關閉不需要的工具並按一下 **Create Key**。正式環境的應用程式請使用[服務帳號金鑰](../service_accounts.md#usage)。

[![MCP Settings，已選取一個伺服器並啟用或停用個別工具](../../../img/mcp_grant_key_tools.png)](../../../img/mcp_grant_key_tools.png "開啟全尺寸截圖")

直接選取伺服器時，金鑰與團隊都必須允許該伺服器。[存取群組](../access_groups.md#4-attach-the-access-group-to-a-key)可以授予額外的伺服器。

預設情況下，未選取任何 MCP 項目的金鑰會繼承其團隊的存取權。您可以[要求每個金鑰定義自己的 MCP 存取](../../mcp_control#require-keys-to-define-their-own-mcp-access)。

## 透過 IdP 管理存取 {#manage-access-through-your-idp}

[使用 SCIM 同步團隊並指派 MCP 權限](../../mcp_grant_access.md#grant-mcp-access-through-scim-provisioned-teams)。應用程式可以透過 [JWT 金鑰對應](../jwt_key_mapping.md)使用 IdP token 進行驗證。

## 測試存取 {#test-access}

將 `LITELLM_PROXY_URL` 設為您的閘道 URL，並將 `LITELLM_API_KEY` 設為應用程式的靜態 API 憑證或對應的 JWT。列出其允許的工具：

```bash
curl "$LITELLM_PROXY_URL/mcp-rest/tools/list" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

檢查傳回的工具，然後[連接您的 MCP 用戶端](../../mcp_usage)。

## 變更或移除存取權 {#change-or-remove-access}

開啟金鑰的 **Settings → Edit Settings**，更新 **MCP Servers / Access Groups** 與其工具選取項目，然後儲存。若要封鎖該金鑰的所有 MCP 存取，請選擇 **No MCP Servers**。清除選取項目可以還原繼承的存取權。

[API 範例](../../mcp_grant_access) · [MCP 權限規則](../../mcp_control)
