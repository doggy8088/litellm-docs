---
slug: august-townhall-updates
title: "八月 Townhall 更新：安全性、穩定性與產品"
date: 2026-08-27T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "八月 LiteLLM town hall 摘要：79 項安全修補、375 項 bug 修復、142 個功能 commit、新任安全總監、公開狀態儀表板，以及來自 production 的 Auto-Router 結果。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

感謝所有參加我們八月 town hall 的人。我們在會中分享了本月的安全性與穩定性工作，以及最新的產品更新：**79 項安全修補**、**375 項 bug 修復**、**142 個功能 commit**、新任安全總監、公開狀態儀表板，以及來自 production 的 Auto-Router 結果。

{/* truncate */}

## 安全性 {#security}

### 本月已推出 79 項安全修補 {#79-security-fixes-shipped-this-month}

它們分布如下：

| 類別                                              | 修補數 | 佔比 |
| --------------------------------------------------- | ----- | ----- |
| 存取控制 / authz 強化                              | 25    | 32%   |
| 憑證 / secret / PII 強化                           | 23    | 29%   |
| 一般強化（不安全的對外請求、UI 角色管制）          | 21    | 27%   |
| 配額 / 預算 / rate-limit 強化                      | 10    | 13%   |

我們會將安全修補回補到最近四個 minor release 線。如果您使用的是一個月以前的版本，建議升級到較新的版本。目前的 release 是 v1.99。

我們也宣布 Oliver Jensen 已加入擔任安全總監；他最近的職位是 Regrello 的 CISO。

### 安全性接下來會做什麼 {#whats-next-for-security}

我們正在擴大 bug bounty 計畫，並透過穩定性衝刺來強化重複出現的程式碼模式。

## 穩定性 {#stability}

八月我們推出了 **375 項 bug 修復**。

| 領域                          | 修復數 |
| ----------------------------- | ----- |
| 其他 / SDK                   | 118   |
| Proxy Core 與韌性             | 88    |
| UI + Auth / SSO               | 66    |
| 成本、預算與可觀測性          | 34    |
| 提供者與模型轉換              | 29    |
| 串流 / Realtime APIs          | 22    |
| MCP Gateway                   | 18    |

### status.litellm.ai 已上線 {#statuslitellmai-is-live}

為了提高透明度，我們推出了公開儀表板，顯示每個 release 實際執行了哪些測試。您可以開啟任何近期的 release，查看哪些測試通過、深入查看像是配額管理或 Claude Code 之類的特定領域，並瀏覽完整的執行歷史。範例來說，在 1.98.0rc1 release 中，有 104 個 Claude Code 測試執行，且在發布前全部通過。

![status.litellm.ai 顯示 1.99.0rc1 release 中執行的 677 個測試全部通過，並依模組分類](./status-dashboard.png)

可在 [status.litellm.ai](https://status.litellm.ai/) 即時追蹤。如果您對我們如何提升 release 透明度有任何回饋，請告訴我們。

### 這次推出了哪些類型的修復 {#what-kinds-of-fixes-shipped}

- **成本追蹤與預算。** 支出日誌在高負載下能記錄每一筆項目，預算重設會如期生效，而隨著價格變動導入，成本對照表仍能維持準確。
- **Batches API。** 多 pod 輪詢會讓每個 batch 僅計費一次，passthrough batch 的成本歸屬正確，而格式不正確的 batch 上傳會在執行前被攔截。
- **MCP 憑證衛生。** 18 項 MCP 範圍內修復。工具呼叫會使用每個呼叫者自己的憑證，而 OAuth 工作階段會在整個任務期間保持有效。
- **AI gateway auth。** 計費與身分資料維持同步。成本對照表會反映目前定價，支出紀錄可在流量尖峰期間持續保存，而預算會在續約與多團隊分拆情境下正確執行。
- **防護欄遮罩。** PII 與 PCI 會在支出日誌、偵錯日誌與僅記錄回應中持續保持遮罩。涵蓋資料可能離開系統的每條路徑。

在高負載下的支出追蹤是投入最多的一個領域，未來幾個月也會持續受到關注。

### 目標：九月達到 80% 的 E2E 覆蓋率 {#the-target-80-e2e-coverage-in-september}

目前跨端點的端對端覆蓋率為 70%。九月的目標是在維持目前 bug 修復速度的同時，達到 80%。

這項工作的大部分，是找出真實客戶使用情境並將其納入 E2E suite。如果您認為我們的測試漏掉了某個情境，歡迎告訴我們。

## 產品 {#product}

本月有 **142 個功能 commit**。

### 深色模式已上線 {#dark-mode-is-here}

儀表板已推出深色模式。您可以選擇深色、淺色，或跟隨系統設定。

![LiteLLM 用量儀表板的深色模式，顯示專案支出、用量指標與每日支出](./dark-mode.png)

儀表板現在已遷移到一套共用元件系統。navbar、playground、guardrails、usage、cost tracking、models 和 endpoints、team 和 user 介面、記錄詳情抽屜，以及 AI Hub，全都已遷移到 shadcn。

兩位工程師在不到一個月內完成了這項工作，同時也進行他們的穩定性工作。因此，UI 看起來與一個月前明顯不同。

### 在一小時內支援 Day 0 model {#day-0-model-support-in-under-an-hour}

在過去一個半月裡，我們已將新 model 的上市時間從一天縮短到一小時內。

- **Gemini 3.7 Flash**（Google）在一小時內推出。
- **Grok 4.6**（xAI）也以類似的時間線推出。

這兩者都在 8 月 13 日、也就是各自提供者發表當天上線，並於 8 月 22 日的 v1.98.0 穩定版 release 中推出。

開發者會在最新 model 上線當天就提出需求，而我們正努力把這件事縮短到一小時內。

### Auto-Router：production 中節省 51% 成本 {#auto-router-51-cost-savings-in-production}

一位設計合作夥伴在 4 月 15 日到 8 月 9 日之間，針對 450+ 名使用者部署 Auto-Router，涵蓋 272,876 次請求與 70.8 億個 token。支出為 $12,249，相較於 $23,985 的全旗艦 baseline，減少 51.1%，且沒有明顯的品質影響。隨著 tier map 依真實流量調校，節省比例從 5 月的 42.9% 上升到 8 月的 60.7%。95% 的請求完全不需要旗艦 tier。

### 分類器變得更聰明了 {#the-classifier-got-smarter}

Auto-Router 現在會讀取對話的最後 N 輪。這項變更讓指涉性後續追問的 **路由準確率提升 5.6 倍**，且沒有可測得的延遲成本。這是直接來自社群回饋的成果。

![LiteLLM Auto-Router V2 在複雜情境下的路由準確率，當分類器讀取對話最後三輪時準確度高出 5.6 倍](./autorouter-classifier.png)

### 自動路由與提示快取堆疊 {#auto-routing-and-prompt-caching-stack}

我們聽到最常見的疑慮是，自動路由是否會破壞提示快取，因為快取本身就能帶來實際節省。

不會。兩者可以堆疊。在我們的基準測試中，路由加快取比只用快取便宜大約 50%。

原因在於 TTL。提示快取項目至少會保留五分鐘，而路由器切換 model 的頻率很高，因此您通常會在那個時間窗內回到某個 model，當時它的快取仍是熱的。命中仍然會發生。[完整說明](https://docs.litellm.ai/blog/auto-router-prompt-caching-benchmark)。

### AT&T 將 AI 成本降低 56% {#att-cut-ai-costs-56}

AT&T 表示，在採用 LiteLLM model 路由後，其 coding 與其他進階 AI 任務的成本降低了 56%，品質下降 2%。開源 model 目前處理了他們 40% 的員工查詢，他們計畫將此提高到 60-70%。由 [PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/att-slashes-ai-costs-by-adopting-model-routers-and-open-source/) 報導。

### Auto-Router 基準測試 {#auto-router-benchmarks}

本月發布了四項基準測試，各自對應自己的 baseline。

- **Claude Code coding 任務。** 成本降低 40.4%，品質達到頂級 model 的 97.1%。
- **RouterArena。** 在更廣泛、且由獨立評分的提示集上，成本降低 74.5%，品質達到 87.3%。
- **提示快取。** 與快取堆疊後，路由器在成本上最多比只用快取低 69%。
- **Terminal-Bench 2.0。** 在真實代理程式任務上，解題率與頂級 model 相同，成本低 27%。

### Auto-Router 還推出了什麼 {#what-else-shipped-on-auto-router}

- **一鍵部署範本。** 選擇 model 家族，而不是手動設定 tier。選擇 Anthropic 或 OpenAI，簡單、中等、複雜與推理 tier 會預先填入。當提供者新增 model 時，我們會更新設定，您就不需要自己調整了。如果您需要，自訂設定仍然可以使用。

  ![新增 Auto Router 對話框，列出 Anthropic Family、OpenAI Family 與 Lite 範本，並顯示是否符合您的部署](./autorouter-templates.png)

- **Auto-Router 儀表板。** 在成本最佳化下新增的用量分頁，顯示每個 session 的節省、每個 session 的輪次、session 長度，以及快取命中分析。您可以並排比較多個 auto-router。

![Auto-Router 在成本最佳化下的使用分頁，顯示總估計節省、每個工作階段平均節省，以及依區段劃分的提示快取命中率](./autorouter-dashboard.png)

- **Shadow evaluations。** 採用上的最大阻礙，是希望先在正式環境中觀察路由器的表現，再決定是否全面推出。現在，您可以透過路由器抽樣某個金鑰流量的一定比例，為測試設定支出預算，並選擇您自己的評判模型。在我們的執行中，路由器在 75% 的工作階段中與目前模型相當或更好。

  ![Shadow eval 結果顯示，路由器在 75% 的已評分回應中與目前模型相當或更好，並依比較的模型與提示難度細分](./shadow-evals.png)

### 試用 Auto-Router {#try-auto-router}

- **本機 CLI：** [docs.litellm.ai/docs/learn/autorouter_cli](https://docs.litellm.ai/docs/learn/autorouter_cli)
- **在 proxy 上：** [docs.litellm.ai/docs/proxy/auto_routing](https://docs.litellm.ai/docs/proxy/auto_routing)
- **加入討論：** [GitHub Discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)，已釘選在我們的 repo 中。那裡的社群正在積極形塑 road map。

## 來自現場的問題 {#questions-from-the-audience}

**模型價格如何更新，資料來源又是什麼？**
`model_prices_and_context_window.json` 是權威來源。我們有自動化機制，當提供者變更定價時會提醒團隊。每個項目的抓取來源會有所不同，因為各提供者發布這些資訊的位置不同。當像 OpenAI 這類提供者宣布變更時，我們會先更新該提供者，然後再檢查其他提供者各自的頁面，之後才向外傳播，這樣就不會在 Azure 顯示 Azure 其實尚未套用的折扣。

**如果某個使用者送出的流量遠多於另一個使用者，是否有公平分配機制？**
有。動態請求限制目前支援每位使用者的門檻與配額。

**SSO 免費支援最多五位使用者。這是指送出請求的使用者，還是登入的使用者？**
是已建立的使用者帳號數量，以內部 users table 的列數計算。單一金鑰送出大量請求，不會計入其中。

**在執行 shadow eval 之前，是否需要先設定 Auto-Router？**
目前是的。先建立路由器只是多一個步驟，而 model-family template 讓這件事很快就能完成。直接從 shadow eval 進到選擇 family、略過建立 router，是我們目前尚未實作但合理的流程。如果您想試試看並提供回饋，我們會納入考量。

**成本降低的數字是如何計算的？**
您在建立 router 時，會選擇一個要拿來作為基準的目標模型。預設情況下，我們會使用您方案中最昂貴的模型。

**你們有在清理 GitHub issue 和 PR backlog 嗎？**
坦白說，我們需要更好地投入資源在 open source 上。我們正在招募專責維護 repo 的工程師，預計在未來兩到三週會有更多進展可以分享。

## 接下來呢 {#whats-next}

再次感謝所有提問與回饋。隨著這項工作陸續上線，我們會持續分享具體進展，特別是 9 月的涵蓋率目標。

我們也在考慮邀請客戶參與未來的 town hall，分享他們自己的設定。如果這對您有幫助，歡迎告訴我們。

## 我們正在招募 {#were-hiring}

LiteLLM 是數千個團隊使用的開源 gateway，讓他們能透過單一 API 執行所有模型，從新創公司到 Fortune 500 都在使用。我們進展很快：光是這個月就推出了 142 個功能與 375 個修正。

我們正在核心 gateway 各面向招募人才，包括 Oliver 正在建立的安全團隊，以及專責的開源維護團隊。小團隊、龐大範疇、從第一天就有真正的主導權。想加入，或知道有很棒的人選嗎？請聯絡我們：[recruiting@berri.ai](mailto:recruiting@berri.ai)。

如需支援，請聯絡我們：[support@berri.ai](mailto:support@berri.ai)，或是若有產品回饋，請聯絡 [product@berri.ai](mailto:product@berri.ai)。

感謝您使用 LiteLLM。**Krrish & Ishaan**
