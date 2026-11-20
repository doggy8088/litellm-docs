---
slug: litellm-database-course
title: "透過引導式課程，了解 LiteLLM 資料庫"
date: 2026-11-19T13:00:00-08:00
authors: [moe]
description: "每個資料表、它的用途，以及它被加入的原因。透過以程式碼與變更歷史為基礎的引導式課程，了解 LiteLLM 資料庫的運作方式。"
tags: [proxy, database]
hide_table_of_contents: true
image: ./hero.png
---

import ThemedImage from '@theme/ThemedImage';
import HeroLight from './hero.png';
import HeroDark from './hero-dark.png';

export function Hero() {
  return <ThemedImage
    alt="了解 LiteLLM 資料庫。每個資料表、它的用途，以及它被加入的原因。16 章共 69 課。"
    sources={{
      light: typeof HeroLight === 'string' ? HeroLight : HeroLight.src.images.at(-1).path,
      dark: typeof HeroDark === 'string' ? HeroDark : HeroDark.src.images.at(-1).path,
    }}
    style={{width: '100%'}}
  />;
}

[LiteLLM 資料庫課程](https://www.litellm.ai/course)會逐一介紹每個資料表、它的用途，以及它被加入的原因。我們為從事 LiteLLM 開發的開發者，以及任何想了解部署背後資料庫的人，打造了這門課程。

{/* truncate */}

## 追蹤請求背後的資料 {#follow-the-data-behind-a-request}

前幾課從一個名為 Search 的團隊開始。管理員為該團隊建立一把虛擬金鑰，其應用程式傳送了一筆花費兩美分的請求。請追蹤那些賦予金鑰存取權、套用預算、記錄請求並更新花費的資料列。

後面的章節涵蓋使用者、模型、MCP 伺服器、防護欄與代理程式。您將看到哪些資料表存放了它們的設定，以及這些資料表如何與閘道的其他部分連結。

## 了解每個資料表存在的理由 {#understand-why-each-table-exists}

課程會逐一介紹檢視過的結構描述中的每個資料表與欄位，並附上程式碼連結，以及加入它們的 PR 或提交。請先閱讀某個欄位的用途，再開啟原始變更，了解它解決了什麼問題。

例如，金鑰的 `spend` 會在每個預算週期重設。`total_spend` 欄位則保留其累計花費。課程會說明這兩者，並連結到引入這個獨立計數器的 PR。

您可以從第一個金鑰資料表開始，追蹤資料庫一路演變至今日所用的結構描述，也可以直接跳到您在程式碼中遇到的資料表。

## 開始上課 {#take-the-course}

課程共有 16 章、69 課，每章結束後都有測驗，完成後可獲得結業證書。您的學習進度會儲存在瀏覽器中。無需登入。

開啟 [LiteLLM Academy](https://www.litellm.ai/course)，選擇 **Database course**。如果您想先了解請求的傳遞路徑，同一個課程庫中也有 [gateway course](/blog/litellm-gateway-course)。
