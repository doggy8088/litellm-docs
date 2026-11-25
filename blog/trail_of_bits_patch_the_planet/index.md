---
slug: trail-of-bits-patch-the-planet
title: "Trail of Bits 協助強化了 LiteLLM，修復即將推出"
date: 2026-11-23T14:00:00
authors:
  - oliver
description: "Trail of Bits 透過 Patch the Planet 計畫參與了 LiteLLM 的工作。以下是未來幾週即將推出的內容、修復的發布方式，以及您該做的事。"
tags: [security]
hide_table_of_contents: false
---

我們很高興分享，LiteLLM 獲選參與 [Patch the Planet](https://trailofbits.com/patch-the-planet/)，這是由 [Trail of Bits](https://www.trailofbits.com/) 與 OpenAI 合作舉辦的開源安全強化計畫。此次合作現已結束，在未來三到四週內，我們將陸續推出一系列安全性修復，並發布對應的安全公告。

Trail of Bits 在我們的程式碼庫中工作，找出並分類弱點，並提出修復補丁。他們的工作涵蓋自行發現的問題，以及獨立安全研究人員回報的問題。

修復將在未來幾天內開始推出。大多數會隨公開版本推出，並附上安全公告。最嚴重的弱點會先在禁運期間發布到我們的私人登錄庫。


{/* truncate */}

## 近況 {#whats-happening}

今年以來，我們大幅增加了對 LiteLLM 安全態勢的投入。我們建立了專責的安全領導團隊，並持續擴編安全團隊。我們把大量心力放在程式碼庫周邊的領域：發布管線、身分與存取、內部政策與程序，以及監控與偵測。我們與 HackerOne 合作，推出代管的弱點揭露計畫。我們建立了私人登錄庫，讓高風險弱點可以在禁運期間發布。我們現在也提供 LiteLLM 的 LTS 版本，讓修復弱點不必連帶引入新功能。

我們增加的安全投入也延伸到程式碼庫本身，而 Patch the Planet 正是為此而來。

Trail of Bits 是當今最受尊敬的安全研究公司之一。他們與 OpenAI 合作推動 Patch the Planet 計畫，結合前沿模型驅動的 AI 弱點探索，以及經驗豐富的安全研究人員，由後者重現、驗證、排定優先順序並為發現的問題提出修復。LiteLLM 很榮幸獲選參與這項計畫，與 SQLite、Python、Go、WordPress、curl、rsync 等知名開源專案並列。我們與 Trail of Bits 的合作經驗非常正面，我也強烈鼓勵開源專案的維護者申請參加。


## 如何看待公告數量 {#contextualizing-advisory-counts}

在未來幾週內，由於這項工作，我們發布的安全公告將比以往任何同期都多。

公告數量反映軟體受到多仔細的檢視，以及維護者多坦率地回報發現。世界上一些最堅固的軟體持續不斷地發布公告：Linux 核心每年發布數千個 CVE，Google Chrome 則有數百個。Trail of Bits 對 LiteLLM 進行了非常仔細的檢視，我們會為每個值得發布公告的修復發布公告。

每份發布的公告都代表產品中移除了一個弱點。接下來的大量公告會讓我們處於明顯更好的狀態。


## 修復的發布方式 {#how-the-fixes-will-ship}

大多數修復會隨一般公開版本與修補程式推出。修復發布時，我們會在 [公告動態](https://github.com/BerriAI/litellm/security/advisories) 上發布 GitHub Security Advisory，並申請 CVE。第一批應該會在未來幾天內推出。

最嚴重弱點的修復會先在禁運期間發布到 [LiteLLM Private Registry](/blog/litellm-private-registry-access)，公開版本與公告則在兩週後推出。


## 您該做的事 {#what-you-should-do}

如果您從我們的公開登錄庫拉取映像，請確認您使用的是受支援的版本。修復會發布到我們 [受支援的版本線](/docs/enterprise/version_support)。為了最順利升級，我們建議使用 LTS 版本，也就是 v1.108.x 系列。

如果您透過私人登錄庫收到禁運期間的修復，請使用 LTS 系列或最新的穩定版本。考量這些修復的規模與範圍，禁運期間的建置只會在這兩條版本線提供；其他受支援的版本會在每次修復公開發布時收到。揭露通知會列出已修補的版本。我們也會依需求提供修補程式本身。

我們也建議您訂閱 [Security Announcements 郵件清單](https://security.litellm.ai/mailinglist/)，不過請注意，此清單僅保留給緊急或重大事項使用，不能取代我們的公告動態。此清單的郵件來自 `security@berri.ai`，請把該地址加入垃圾郵件篩選器的允許清單。

如果您對這項工作或隨之發布的任何公告有疑問，請聯絡 security@berri.ai。
