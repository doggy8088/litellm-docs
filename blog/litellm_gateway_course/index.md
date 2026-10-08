---
slug: litellm-gateway-course
title: "以引導式課程學習 LiteLLM 閘道"
date: 2026-09-28T10:00:00-07:00
authors: [moe]
description: "跟著一則請求走過 LiteLLM 閘道、Router 和 SDK。這是一門為部署閘道的團隊與進行程式碼變更的貢獻者設計的引導式課程。"
tags: [proxy, product]
hide_table_of_contents: true
image: ./hero.png
---

import ThemedImage from '@theme/ThemedImage';
import HeroLight from './hero.png';
import HeroDark from './hero-dark.png';

<ThemedImage
  alt="在 litellm.ai/course 學習 LiteLLM 閘道。跟著一則請求走過閘道存取檢查、Router 部署選擇，以及 SDK 提供者轉譯。"
  sources={{
    light: typeof HeroLight === 'string' ? HeroLight : HeroLight.src.images.at(-1).path,
    dark: typeof HeroDark === 'string' ? HeroDark : HeroDark.src.images.at(-1).path,
  }}
  style={{width: '100%'}}
/>

[LiteLLM 閘道課程](https://litellm.ai/course)會帶您了解閘道、Router 和 SDK 如何協同運作。我們為部署 LiteLLM 的開發者與平台團隊，以及想在開啟 pull request 前先了解程式碼的貢獻者所設計。

{/* truncate */}

## 從一則請求開始 {#start-with-one-request}

前幾個課程單元會跟著一個支援應用程式，該應用程式會向名為 `support-chat` 的模型送出問題。閘道會檢查呼叫者的存取權限。Router 會選擇一個部署。SDK 會將該呼叫轉換為提供者的格式。

後續課程單元會以同一個應用程式為基礎。您將新增存取規則、比較路由選擇、跟著重試與備援，並了解成本與記錄如何被記錄。

在[跟著一則請求](https://litellm.ai/course#/lesson/request-lifetime)中，您可以在允許的請求、遭拒絕的模型，以及被封鎖的回應之間切換。選取一種情境，查看哪些步驟會執行，以及請求在哪裡停止。

![已選取「回應被封鎖」的請求流程。提供者先產生回應，接著回應檢查會阻止傳遞。](./request-stops.png)

## 了解您執行的部署 {#understand-the-deployment-you-run}

對平台團隊而言，這些課程涵蓋日常決策：如何讓團隊存取模型、設定預算、選擇備援，以及調查失敗的請求。

作業章節會說明 gateway worker、Redis 與 PostgreSQL 如何協同運作。其他章節則涵蓋串流、快取、工具與代理程式。

在設定您的部署時，請搭配課程一起使用[正式文件指南](https://docs.litellm.ai/docs/proxy/prod)。

## 找出程式碼變更應該放在哪裡 {#find-where-a-code-change-belongs}

對貢獻者而言，這門課程能幫助您找出變更應該放在哪裡。格式錯誤的提供者請求指向 SDK adapter。非預期的部署選擇指向 Router。權限錯誤則從閘道的存取檢查開始。

課程單元包含 **Why this exists** 與 **Where the code lives** 區段。打開它們可閱讀某個行為存在的原因，並依照連結找到相關實作、文件或測試。

最後一章會追蹤一項變更如何在整個系統中流動，從儀表板欄位一路到權限、儲存的資料，以及 gateway worker 載入的設定。它會示範如何追蹤該行為並選擇要測試的內容。[貢獻指南](https://docs.litellm.ai/docs/extras/contributing_code)涵蓋儲存庫設定與 pull request 流程。

## 開始課程 {#take-the-course}

這門課程共有 15 章、83 個課程單元。請依序學習各單元，或使用側邊欄返回某個主題。您的進度會儲存在瀏覽器中。不需要登入。

**[開始 LiteLLM 閘道課程 →](https://litellm.ai/course)**
