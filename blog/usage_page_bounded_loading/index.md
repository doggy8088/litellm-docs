---
slug: usage-page-bounded-loading
title: "我們如何將 LiteLLM Usage 頁面加速 120 倍"
date: 2026-09-30T09:00:00
authors:
  - yassin
description: "從六分鐘到 3.2 秒：將彙總移到 Postgres 如何讓 LiteLLM 的 Usage 頁面在我們的基準測試中大約快了 120 倍。"
tags: [performance, admin-ui, postgres, engineering, ai-gateway]
hide_table_of_contents: true
---

import { PerformanceResults, UsageDataFlow } from './diagrams';

本週，我們將 LiteLLM Usage 頁面大約加快了 120 倍。

在 5,000 個 API 金鑰的情況下，我們的 Usage 頁面顯示 30 天總計所花的時間**超過六分鐘**。我們重新設計了資料載入方式，並在我們的基準測試中將其縮短到**3.2 秒**。這大約是**快了 120 倍**。

{/* truncate */}

<PerformanceResults />

## 為什麼它很慢 {#why-it-was-slow}

瀏覽器會下載每個金鑰的每日使用量，每次 1,000 筆，然後在 JavaScript 中計算總計與排名。

金鑰越多、歷史資料越長，就代表更多請求、更多資料，以及瀏覽器中更多的工作。我們的 30 天測試在總計出現前，需要**315 次請求與 1.3 GB 的資料**。

## 我們做了哪些改變 {#what-we-changed}

**Postgres 現在負責彙總。**頁面接收的是計算好的總計與使用量明細，而不是下載每個金鑰的歷史資料再自行計算。

<UsageDataFlow />

總計仍然包含所選範圍內的**所有金鑰**。金鑰清單會隨著您捲動而每次載入 50 個金鑰，而單一金鑰的每日圖表則會在您展開時載入，因此瀏覽器不會一次持有每個金鑰的歷史資料。搜尋與 CSV 匯出也都在 Postgres 中執行，因此您仍然可以找出任何虛擬金鑰並匯出完整的使用量資料。

## 結果在更長的範圍下也站得住腳 {#the-results-hold-up-over-longer-ranges}

在 90 天的使用量情境下，從請求到總計顯示的時間從**約 34 分鐘降到 10 秒**。同樣的重新設計也涵蓋了 User、Agent、Team、Tag、Organization 與 Customer 的使用量檢視。

我們以相同的 Postgres 資料庫測試了兩種設計：**5,000 個 API 金鑰，以及跨越 91 天的 490 萬筆每日資料列**。兩者都使用正式環境的 UI 建置版本。新的時間是冷瀏覽器快取下五次執行的中位數；舊的時間則來自允許超過我們 90 秒截斷時間後仍繼續完成的執行。這些測量反映的是顯示出可見總計所需的時間。我們後來在另一台機器上，將最終程式碼與我們最初測量的版本並排重新執行，總計所需時間相差在 2% 以內。

![LiteLLM Usage 頁面 Key Activity 分頁，顯示 5,000 個金鑰完整的 30 天總計，金鑰清單載入於下方。](./after_usage_30d.png)

查看這些變更：[資料庫查詢](https://github.com/BerriAI/litellm/pull/43398)、[API 路由](https://github.com/BerriAI/litellm/pull/43408) 與 [Admin UI](https://github.com/BerriAI/litellm/pull/43409)。即使您的部署持續成長，我們也在讓您更快看出 LLM 花費流向何處。
