---
slug: litellm-admin-mcp
title: "介紹 LiteAdmin MCP"
date: 2026-09-23T10:00:00
authors: [tin]
description: "讓您的代理程式擁有建立金鑰、新增模型及管理預算的工具，並搭配 LiteAdmin MCP 使用。透過同一個連接器，也可使用 LiteAdmin——我們的 Slack 管理代理程式。"
tags: [mcp, agents, ai-gateway]
hide_table_of_contents: true
image: ./hero.png
---

import ThemedImage from '@theme/ThemedImage';
import HeroLight from './hero.png';
import HeroDark from './hero-dark.png';

<ThemedImage
  alt="介紹 LiteAdmin MCP：您的 AI 工具組，用於閘道管理。Slack 版 LiteAdmin 建構於 LiteAdmin MCP。"
  sources={{
    light: typeof HeroLight === 'string' ? HeroLight : HeroLight.src.images.at(-1).path,
    dark: typeof HeroDark === 'string' ? HeroDark : HeroDark.src.images.at(-1).path,
  }}
  style={{width: '100%'}}
/>

一位工程師為新專案索取一組 API 金鑰。您需要為它選擇模型、設定預算，並將其指派給某個團隊。隨著使用量成長，您需要檢查支出並調整那些限制。

**LiteAdmin MCP** 讓您的代理程式透過閘道的管理 API 處理這些工作。將它連接到一個 MCP 用戶端或自訂代理程式。我們也用同一個連接器建立了 **LiteAdmin**——我們的 Slack 管理代理程式。

{/* truncate */}

## 將您的代理程式連接到您的閘道 {#connect-your-agent-to-your-gateway}

將 LiteAdmin MCP 連接到 Claude Code 或 Cursor 等用戶端，或連接到您自己的代理程式。您的用戶端提供對話與模型；連接器則使用您的管理憑證呼叫閘道的管理 API。

透過這項連線，您可以：

- **建立並管理虛擬金鑰：** 設定模型存取與支出上限。
- **新增模型部署：** 使用配置在您閘道上的憑證。
- **管理團隊與預算：** 更新團隊成員資格與預算。
- **檢視使用量：** 檢查支出與請求記錄。

此連接器包含 65 個經審核的管理操作，並會公開您閘道支援的那些操作。

## 為專案設定存取權限 {#set-up-access-for-a-project}

若要為 Engineering 設定專案，請詢問：

> 為 Engineering 建立一組每月預算為 100 美元的金鑰。

請包含該專案需要的模型，以及用來識別該金鑰的別名。代理程式可以查詢 Engineering，並依照您指定的限制建立金鑰。

專案開始運作後，請詢問其已記錄的支出。您可以更新該金鑰的預算或團隊的預算；請在您的請求中明確指定是哪一個。

若要新增模型部署，請提供其公開名稱、provider/model ID，以及憑證參照：

> 使用 openai/gpt-4.1 與現有的閘道憑證 openai-production 新增一個名為 support-chat 的模型。

請使用已儲存的憑證名稱，並避免在對話中暴露提供者 API 金鑰。您的閘道需要提供者存取權限，且需要設定資料庫來儲存模型。請先遵循 [模型設定需求](/docs/proxy/liteadmin_mcp#add-a-model-deployment)，然後在新增部署後測試推論。

## 選擇您的代理程式可使用的工具 {#choose-the-tools-your-agent-can-use}

使用您自己的 LiteLLM proxy-admin 憑證連線。您的閘道權限會套用到管理請求，且您可以將連接器限制為特定工具，或啟用唯讀模式。

請先從團隊與支出查詢開始，等您準備好進行變更時，再啟用金鑰建立。

## LiteAdmin：以 Admin MCP 建立的 Slack 代理程式 {#liteadmin-a-slack-agent-built-on-admin-mcp}

**LiteAdmin（LiteLLM 管理代理程式）** 使用相同的 MCP 伺服器，從 Slack 管理您的閘道。這個應用程式提供對話與登入；Admin MCP 提供閘道工具。

架設此代理程式、連接您的閘道，並選擇它使用的模型。此應用程式包含 MCP 連接器，且每次安裝都會將一個閘道連接到一個 Slack 工作區。

在 Slack 中開啟 **LiteLLM Admin**，傳送 **connect**，並依照私人連結使用您自己的管理帳號登入。您的部署可以使用 SSO，或在瀏覽器頁面中輸入個人管理金鑰。接著詢問：

> 顯示 Engineering 目前的支出與預算。

在檢查支出後，提出變更請求：

> 將 Engineering 的每月預算提高到 500 美元。

您之後可以在同一個 DM 中，從筆記型電腦或手機追問該團隊的金鑰或使用量。

## 開始使用 {#get-started}

這兩個專案都是開放原始碼。請選擇您要在哪裡工作：

- **LiteAdmin MCP：** 遵循 [MCP 設定指南](/docs/proxy/liteadmin_mcp) 來連接 Claude、Codex 或其他 MCP 用戶端。
- **LiteAdmin for Slack：** 遵循 [Slack 應用程式設定指南](/docs/proxy/liteadmin_slack) 以透過 Docker Compose 或 Render 進行部署。

連線完成後，試試 **「列出我的團隊及其目前預算。」**
