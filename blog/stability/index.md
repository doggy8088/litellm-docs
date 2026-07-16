---
slug: stability
title: "六月穩定性更新：我們正讓穩定性成為 LiteLLM 的一等公民"
date: 2026-06-15T10:00:00
authors:
  - ishaan-alt
  - varoon
description: ""
tags: []
hide_table_of_contents: false
---

在過去幾個月裡，我們聽到使用者回報更多錯誤與回歸問題。我們非常重視這些回饋，今天我們要 دقیق分享我們正在為此做些什麼。

我們正在為 LiteLLM 啟動一場穩定性衝刺，目標很明確：在 8 月 29 日下一次發佈前達成 0 個已回報回歸問題。這場衝刺有 2 個目標：

- 在核心功能中修復 20 個已回報錯誤 - [這裡](https://github.com/BerriAI/litellm/issues/30484)
- 解決 3 個核心元件中潛在錯誤的根本原因 - MCP、Gateway，以及 UI

## 我們正在降低哪一類錯誤？ {#what-class-of-bugs-are-we-driving-down}

在這次衝刺中，我們正在降低 3 類錯誤：

- **MCP 驗證：** View/List Tools 無法在我們所有支援的 MCP 驗證方法中穩定運作。
- **Gateway 驗證：** Team IDs 並未可靠地出現在每一個請求追蹤中。因此，有些請求與預算無法準確地追蹤到某個團隊。
- **UI 表單：** 如今當使用者在表單上按下儲存時，可能會意外清除表單上的其他欄位，跨越 keys、teams 和 users。

## MCP 驗證：在所有 MCP 驗證方法中保持一致的行為 {#mcp-authentication-consistent-behavior-across-all-mcp-authentication-methods}

解決方案：我們已確認，跨 MCP 的錯誤根本原因在於我們維護了 5 條不同的程式碼路徑，每種驗證方法各一條。為了解決這個問題並恢復連線可靠性，我們正在將其重構為單一程式碼路徑，以便在所有支援的驗證方法中解析 MCP 憑證。結果：不論您使用哪種驗證方法，工具列表與呼叫都能可靠運作。

## AI Gateway 驗證：花費永遠歸屬於正確的團隊 {#ai-gateway-authentication-spend-is-always-attributed-to-the-right-team}

解決方案：我們發現，驗證層會進行 5 次以上的資料庫查詢，以解析發出請求的確切金鑰、使用者、團隊與團隊成員。為了解決這個問題，我們只會解析一次呼叫者身分，並將其放入單一記錄中，供每一次檢查與記錄讀取。這將身分查詢次數大約減半，並且代表花費永遠會歸屬於發出請求的團隊。

## UI：編輯只會變更您觸碰到的內容 {#ui-edits-change-only-what-you-touched}

解決方案：UI 錯誤在表單儲存時的根本原因之一，是我們在前端與後端之間的資料形狀不一致。為了解決這個問題，我們正在重構，讓前端與後端型別 100% 同步，並從相同的唯一事實來源讀取。結果：一次儲存只會變更您編輯過的欄位，不會影響其他任何內容。

## 您會如何知道它已生效 {#how-youll-know-it-worked}

我們會在 8 月 29 日的發佈時回報每一項目前的進度。您不需要只憑我們的話來相信。

## 為什麼是現在 {#why-now}

我們成長得很快。而在一個複雜系統中的快速成長，意味著如果您不刻意地逐步清除錯誤，它們就會累積。這次衝刺就是我們刻意為之的行動。

我們也公開說明這件事，因為您有權知道正在修復什麼，以及何時修復。穩定性就是基礎設施。我們正以這樣的方式對待它。

## 想要我們修復什麼嗎？ {#want-us-to-fix-something}

上面每一項都來自真實的使用者回報。如果有影響您的錯誤不在這份清單上，請在 [GitHub issue](https://github.com/BerriAI/litellm/issues/30484) 留言。我們正在積極分流！
