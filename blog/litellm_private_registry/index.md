---
slug: litellm-private-registry
title: "推出 LiteLLM Private Registry"
date: 2026-10-27T10:00:00
authors:
  - oliver
  - krrish
  - ishaan
description: "LiteLLM 致力於提供一個 private registry，讓最嚴重的安全漏洞能在公開發布之前搶先取得修復。"
tags: [security]
hide_table_of_contents: false
image: /img/blog/litellm_private_registry/header.png
---

![LiteLLM Private Registry：為最嚴重的漏洞提供私下修復](/img/blog/litellm_private_registry/header.png)

我們致力於持續改善 LiteLLM 的安全性，無論是對我們的開源社群還是企業客戶。

有了 AI agents，公開發布安全修補可能會在使用者有時間升級之前，就給攻擊者一份利用該漏洞的即時藍圖。

為了解決這個問題，我們將在未來幾週推出 LiteLLM Private Registry。對於最嚴重的漏洞，我們會先私下發布修復，讓組織有時間在修補與安全公告公開之前完成升級。

 **我們對開源的承諾維持不變。** 所有安全修復都會持續公開發布。

{/* truncate */}

我們最近試行了這個做法，架設了一個臨時的 private registry，在公開揭露之前先將一個重大漏洞的修復提供給我們的企業客戶。試行很成功：客戶取得了修補後的建置，並有合理的時間升級，威脅行為者在此之前還沒有製作攻擊所需的資訊。

在執行過程中我們學到了很多，並且致力於讓 private registry 成為我們保護 LiteLLM 客戶方式的常設部分。本文涵蓋我們做了什麼、學到了什麼，以及接下來會如何。

## 我們為什麼建立它 {#why-we-built-it}

過去幾個月，開源產品的威脅態勢快速改變。AI 能力的提升，實際上讓任何包含安全修復的公開開源版本都變成事實上的漏洞揭露。任何人都可以將模型指向我們發布的修補差異，提示它找出已修復的漏洞。我們現在的運作假設是：攻擊流量過去跟著公告走，現在跟著版本發布走。

10 月 6 日，我們完成了一個 LiteLLM 重大漏洞的修復，該漏洞只影響使用企業授權執行的部署。未經驗證的攻擊者若能透過 HTTP 接觸 proxy，就能提升為 proxy 管理員。在某些設定中，proxy 管理員可以在主機上執行任意程式碼，因此對那些部署來說，影響是遠端程式碼執行。

該漏洞僅限於企業部署，這創造了一個測試 private registry 構想的機會。

## 試行如何運作 {#how-the-pilot-worked}

10 月 6 日，我們架設了一個私有的套件 registry，並開始將修補後的 LiteLLM 版本發布到上面。我們嘗試通知每一家企業，並分配了拉取修復版本的憑證。在整個禁運期間，我們持續將新版本同時發布到 private registry 與我們的公開管道，讓透過 registry 升級的客戶能跟上新版本與錯誤修復。

禁運於今天 10 月 27 日結束。修補版本（`v1.103.10`、 `v1.104.8`、`v1.105.6`、`v1.106.5`）已發布到 PyPI、GHCR 與 Docker Hub，公開公告為 [GHSA-w4c7-34wj-hqm8](https://github.com/BerriAI/litellm/security/advisories/GHSA-w4c7-34wj-hqm8)。

## 我們學到了什麼 {#what-we-learned}

這是我們第一次嘗試營運 private registry，過程中學到了寶貴的經驗。其中三點特別值得討論：

**發布工程的沉重負擔。** 禁運期間的每個版本與錯誤修復 backport 都必須建置、測試並發布兩次：一次給公開管道，一次給 private registry。禁運期間正好遇上我們大幅增加 backport 發布的時期，這意味著有三週的時間，發布工程大部分的時間都只花在實作與測試 backports 上。這在緊急情況下可行，但長期而言無法持續。

**需要一個穩定的 v2。** 我們的首要任務是盡快將修復送到客戶手中，這反映在映像交付方面的一些選擇上。它們沒有為長期資源奠定正確的基礎。因此，我們在這次試行中使用的 registry 將被淘汰，換成一個從一開始就依我們現在已知的使用方式設計的 registry。

**主動溝通與協助至關重要。** 建立 registry 並發布到上面，結果是最簡單的部分。確保每位受影響的客戶都知道修復存在、知道如何取得，並且確實已經套用，才是我們遇到困難的地方，也是禁運比預期多了一週的原因。這個問題附屬於 private registry 的實作，但它確實凸顯了這個問題，而且是我們必須解決的。

:::tip 下一步
LiteLLM 致力於建立一個常設的 private registry。在未來幾週，我們會詳細說明這個流程如何運作。除了納入我們的企業客戶之外，我們也在評估如何透過這個 registry 支援 OSS 使用者。

如果您對此有任何回饋，歡迎在[這個 GitHub discussion](https://github.com/BerriAI/litellm/discussions/48643) 中提出。
:::

## 公告 {#the-advisory}

這個漏洞的公開安全公告已在 GitHub 上發布為 [GHSA-w4c7-34wj-hqm8](https://github.com/BerriAI/litellm/security/advisories/GHSA-w4c7-34wj-hqm8)。

如果您以企業授權執行 LiteLLM 且尚未升級，請立即升級。如果您是企業客戶，但在禁運期間沒有收到通知，我們希望聽到您的消息，以便彌補這個缺口：請寫信到 security@berri.ai。

如果您希望收到未來安全版本的通知，可以訂閱我們的安全郵件清單，其連結位於 LiteLLM repository 的 SECURITY.md 中。
