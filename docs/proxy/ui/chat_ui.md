---
title: 聊天介面
description: 在您的 LiteLLM 閘道上與模型聊天、使用 MCP 工具，並在管理員介面中的單一頁面查看您自己的金鑰、記錄與用量。
---

import Image from '@theme/IdealImage';

# 聊天介面 {#chat-ui}

聊天介面是 LiteLLM 管理員介面中的聊天頁面，位於 `/ui/chat`。代理程式管理員會為閘道啟用它。之後，任何可以登入管理員介面的使用者都可以使用它。使用者可以向其有存取權的模型傳送訊息，並使用 MCP 伺服器的工具。

來自聊天介面的每個請求都會經過閘道。LiteLLM 會將相同的模型存取、預算與記錄套用到這些請求，與 API 請求相同。

:::info Beta

聊天介面是一項 beta 功能。其頁面與控制項可能會在新版本中變更。聊天介面可用於 v1.92.0 及更新版本。

:::

## 啟用聊天介面 {#enable-the-chat-ui}

聊天介面預設為關閉。代理程式管理員必須將其啟用。

1. 以代理程式管理員身分登入管理員介面。
2. 前往 **Settings** > **Admin Settings**。
3. 點擊 **UI Settings** 分頁。
4. 將 **[BETA] Enable Chat page** 設為開啟。頁面會重新整理。

<Image
  img={require('../../../img/chat_ui_enable.png')}
  dark={require('../../../img/chat_ui_enable_dark.png')}
  alt="管理員設定頁面，已將 [BETA] Enable Chat page 開關開啟並標示"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

當聊天介面開啟時，管理員介面頂端的檢視切換器會顯示 **Chat**。選取 **Chat** 以開啟聊天介面。您也可以前往 `PROXY_BASE_URL/ui/chat`。

<Image
  img={require('../../../img/chat_ui_switcher.png')}
  dark={require('../../../img/chat_ui_switcher_dark.png')}
  alt="具有 AI Gateway 與 Chat 選項的檢視切換器"
  style={{width: '100%', maxWidth: '640px', display: 'block', margin: '1.5rem 0'}}
/>

當聊天介面關閉時，檢視切換器會將 **Chat** 顯示為不可用。若使用者前往 `/ui/chat`，管理員介面會開啟儀表板。

若要在不使用管理員介面的情況下變更此值，請使用代理程式管理員金鑰傳送此請求：

```bash
curl -X PATCH "$PROXY_BASE_URL/update/ui_settings" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"enable_chat_ui": true}'
```

LiteLLM 會將此值保存在資料庫中。閘道必須有 `DATABASE_URL`。

## 傳送訊息 {#send-a-message}

1. 點擊 **New Chat**。
2. 在訊息方塊下方的模型清單中選取一個模型。
3. 輸入您的訊息。
4. 點擊 **Send**，或按 Enter。

<Image
  img={require('../../../img/chat_ui_new_chat.png')}
  dark={require('../../../img/chat_ui_new_chat_dark.png')}
  alt="聊天介面中的新聊天，包含訊息方塊與模型清單"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

模型清單只會顯示您的使用者可以使用的模型。在搜尋方塊中輸入以尋找模型。

<Image
  img={require('../../../img/chat_ui_model_picker.png')}
  dark={require('../../../img/chat_ui_model_picker_dark.png')}
  alt="已展開的模型清單與搜尋方塊"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

聊天介面會在模型傳送回應時顯示該回應。每則回應下方，聊天介面會顯示此請求的下列指標：

- **TTFT**：第一個 token 的時間
- **Total Latency**：完整回應所需時間
- **In**、**Out** 與 **Total**：輸入 token、輸出 token，以及這些 token 的總和
- **Cost**：請求成本

<Image
  img={require('../../../img/chat_ui_conversation.png')}
  dark={require('../../../img/chat_ui_conversation_dark.png')}
  alt="一個聊天回應以及回應下方的請求指標"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

### 聊天記錄 {#chat-history}

聊天介面會將您的聊天儲存在瀏覽器的本機儲存空間中。閘道不會保留這些聊天。**Recents** 清單會顯示您的聊天。每個聊天的標題是其第一則訊息的開頭。

您的瀏覽器最多會保留 100 則聊天。當您再開始一則聊天時，聊天介面會刪除變更最舊的聊天。來自一個瀏覽器的聊天不會顯示在不同的瀏覽器或不同的電腦上。如果您清除瀏覽器資料，瀏覽器就會刪除您的聊天。

閘道會在記錄中記錄每個請求。請參閱 [查看您的記錄](#see-your-logs)。

## 在聊天中使用 MCP 工具 {#use-mcp-tools-in-a-chat}

聊天介面可以將 MCP 伺服器的工具提供給模型。

1. 點擊模型清單旁的 **+**。
2. 對於您將使用的每個 MCP 伺服器，將開關設為開啟。
3. 傳送您的訊息。

<Image
  img={require('../../../img/chat_ui_mcp_picker.png')}
  dark={require('../../../img/chat_ui_mcp_picker_dark.png')}
  alt="MCP 伺服器清單，每個伺服器各有一個開關"
  style={{width: '100%', maxWidth: '720px', display: 'block', margin: '1.5rem 0'}}
/>

之後模型就可以呼叫您所選擇之伺服器的工具。清單只會顯示您的登入可存取的 MCP 伺服器。若要讓使用者可存取 MCP 伺服器，請參閱 [授予 MCP 伺服器存取權](../../mcp_grant_access.md)。

## 使用 OAuth 連線至 MCP 伺服器 {#connect-to-an-mcp-server-with-oauth}

某些 MCP 伺服器必須為每位使用者登入一次。對於這些伺服器，LiteLLM 會為每位使用者保留一個 OAuth 權杖。

1. 點擊 **Integrations**。
2. 找到 MCP 伺服器。必須登入的伺服器會顯示 **Connect** 按鈕。
3. 點擊 **Connect**。
4. 在提供者的頁面上登入。

<Image
  img={require('../../../img/chat_ui_integrations.png')}
  dark={require('../../../img/chat_ui_integrations_dark.png')}
  alt="Integrations 頁面，顯示一個 MCP 伺服器與一個具有 Connect 按鈕的 OAuth 伺服器"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

**All** 分頁會顯示您的登入可存取的所有 MCP 伺服器。每個伺服器都會顯示其工具數量。**Connected** 分頁會顯示已啟用供您聊天使用的伺服器。

**Credentials** 頁面會顯示您的 OAuth 連線。若要移除連線，請點擊其所在列上的刪除圖示（**Revoke connection**）。

若要為 MCP 伺服器顯示 **Connect** 按鈕，代理程式管理員會在伺服器上設定 `auth_type: oauth2` 與 `oauth2_flow: authorization_code`：

```yaml title="config.yaml"
mcp_servers:
  github:
    url: https://api.githubcopilot.com/mcp/
    transport: http
    auth_type: oauth2
    oauth2_flow: authorization_code
    description: Issues, pull requests, and code search
```

:::warning

在每個具有 `auth_type: oauth2` 的 MCP 伺服器上設定 `oauth2_flow`。如果缺少 `oauth2_flow`，閘道就不會啟動。

:::

如需完整的 OAuth 設定，請參閱 [MCP OAuth](../../mcp_oauth.md)。

## 查看您的 API 金鑰 {#see-your-api-keys}

**API Keys** 頁面會顯示您使用者的虛擬金鑰。對於每個金鑰，頁面會顯示花費、預算、到期日與建立日期。

在 LiteLLM Enterprise 中，每個金鑰也有一個 **Rotate** 按鈕。**Rotate** 會為該金鑰產生新的密鑰值。

<Image
  img={require('../../../img/chat_ui_api_keys.png')}
  dark={require('../../../img/chat_ui_api_keys_dark.png')}
  alt="API Keys 頁面，包含兩個虛擬金鑰"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

## 查看您的記錄 {#see-your-logs}

**Logs** 頁面只會顯示您使用者的請求。每列會顯示時間、模型、狀態、token、持續時間與成本。點擊 **24h**、**7d** 或 **30d** 以變更時間範圍。

點擊一列可查看請求詳細資訊。詳細資訊會顯示請求主體與回應主體。若要保留這些主體，請在 `general_settings` 中設定 `store_prompts_in_spend_logs: true`。

<Image
  img={require('../../../img/chat_ui_logs.png')}
  dark={require('../../../img/chat_ui_logs_dark.png')}
  alt="Logs 頁面，顯示三個成功的請求"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

## 查看您的用量 {#see-your-usage}

**Usage** 頁面會顯示您的總花費、API 請求數、token 數量與成功率。點擊 **7d**、**30d** 或 **90d** 以變更時間範圍。

<Image
  img={require('../../../img/chat_ui_usage.png')}
  dark={require('../../../img/chat_ui_usage_dark.png')}
  alt="Usage 頁面，顯示花費、請求、token 與成功率"
  style={{width: '100%', display: 'block', margin: '1.5rem 0'}}
/>

## Chat UI 請求的花費 {#spend-for-chat-ui-requests}

聊天介面會使用使用者的登入工作階段傳送每個請求。LiteLLM 會將該請求的花費記錄在該使用者名下。這些花費不會計入使用者的虛擬金鑰。

## Chat UI 與 Playground {#chat-ui-and-playground}

管理員介面也有一個 **Playground** 頁面。使用 Playground 來對模型進行測試，並並排比較最多 3 個模型。聊天介面可保留聊天記錄、連線至 MCP 伺服器，並顯示您的金鑰、記錄與用量。

如需更多資訊，請參閱 [Model Compare Playground UI](../model_compare_ui.md)、[MCP Overview](../../mcp.md) 與 [Admin UI](../ui.md)。
