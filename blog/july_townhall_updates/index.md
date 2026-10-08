---
slug: july-townhall-updates
title: "July Townhall Updates: 38 Security Fixes, 317 Bug Fixes, and Autorouter V2"
date: 2026-07-24T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "7 月 LiteLLM 線上大會回顧：38 項安全修補、317 項錯誤修正、140 個功能提交、全新的 Rust 閘道基準測試，以及 Autorouter V2 的推出。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

感謝所有參與我們 7 月線上大會的人。我們藉此分享本月的安全與穩定性工作，以及最新的產品更新：**38 項安全修補**、**317 項錯誤修正**、**140 個功能提交**，重點包括新的 Rust 基準測試與 Autorouter V2 的推出。

{/* truncate */}

## 安全 {#security}

**本月已推出 38 項安全修補**，其中包括兩個已永久封堵的重大漏洞。以下是它們的分布：

| 類別 | 修補數 | 佔比 |
|---|---|---|
| 秘密／憑證外洩防護 | 12 | 32% |
| 存取控制／權限提升 | 11 | 29% |
| 防護欄繞過 | 6 | 16% |
| SSRF／秘密外洩 | 5 | 13% |
| CVE／依賴項／供應鏈 | 4 | 11% |

我們會將安全修補回補到最近四個次要版本線，因此保持最新就是完整的防禦。請升級以持續受到保護。

### 我們如何審查每個 PR {#how-we-review-every-pr}

每個 pull request 在可合併前都會先經過安全檢查，每個版本在發布前也都會執行完整掃描。

- **Veria 掃描。** 每個 PR 都必須通過的檢查，建立在 Veria AI、zizmor 與 semgrep 之上。誤判會被標記，但不會阻擋。
- **依賴項掃描。** osv-scanner 會攔截每次 lockfile 變更，並在每晚執行，因此已知有 CVE 的依賴項無法發布。
- **映像掃描。** Grype 會檢查執行階段映像中的作業系統與函式庫 CVE，並在可修補的高風險／重大發現時使建置失敗。

### 我們會為安全回報付費 {#we-pay-for-security-reports}

漏洞賞金計畫已上線。

- **範圍：** LiteLLM 閘道與 SDK。
- **提交方式：** 透過 GitHub 上的私人漏洞回報提交。
- **處理方式：** 由維護者與 Veria Labs 安全團隊進行分流。
- [github.com/BerriAI/litellm/security](https://github.com/BerriAI/litellm/security)

### 安全下一步是什麼 {#whats-next-for-security}

我們正在擴大漏洞賞金計畫，強化我們在穩定性衝刺中持續發現的重複程式碼模式，並同步招募人力。這是一項結構性投資，而不是為期一個月的衝刺。

## 穩定性 {#stability}

我們成長得很快，也希望優先把錯誤控制好，避免它們累積起來。7 月我們推出了 **317 項錯誤修正**。

| 領域 | 修正數 |
|---|---|
| UI + Auth / SSO | 76 |
| MCP Gateway | 50 |
| Providers & Model Transforms | 48 |
| Cost, Budgets & Observability | 44 |
| Proxy Core & Resilience | 43 |
| Streaming / Realtime APIs | 36 |
| Other / SDK | 20 |

### 目標：本月底前達到 95% 的 E2E 覆蓋率 {#the-target-95-e2e-coverage-by-end-of-month}

我們把端到端測試視為一等公民。現在每一條新的客戶旅程都會隨附自己的 E2E 測試，並在儀表板上即時追蹤。本月的目標是再涵蓋大約 97 條客戶旅程，讓我們從 427 條已識別旅程中的 309 條提升到 406 條，約 95% 的覆蓋率。

### 這次推出了哪些類型的修正 {#what-kinds-of-fixes-shipped}

最受矚目的類別是計費、身分與 MCP。

- **計費準確性。** 我們修補了過去支出會漏掉的缺口。現在 Anthropic 與 Bedrock 上的快取與分級用量都會正確計價，預算會按正確排程重置，而在串流於請求中途中斷時，也能擷取到部分支出。
- **身分與存取。** 呼叫者身分現在會先解析成單一紀錄，因此團隊 ID 與支出歸因都能維持正確，而且 auth 在資料庫錯誤時也不會再失敗後開放。
- **MCP 可靠性。** 現在不論使用哪種 auth 方法，工具清單與呼叫都能一致運作，並支援每位使用者的憑證與正確的 OAuth token 重新整理。
- **資源洩漏。** 防護欄不再在每個請求都重新初始化，這解決了它們過去造成的 runner 洩漏、延遲尖峰與 OOM。
- **韌性。** 串流請求在中斷時可恢復成本，proxy 在 DB 連線中斷時會自我修復，而 OTEL 指標也不再讓 Splunk 超載。

### 即時追蹤我們的進度 {#watch-our-progress-live}

進度會公開追蹤在 [GitHub issue #30484](https://github.com/BerriAI/litellm/issues/30484)，目標是在 8 月 29 日版本發布前零回報回歸。

- **6 月。** 分流了 13 個錯誤，穩定性衝刺展開。根因分析開始。
- **7 月。** MCP 改進完成，推出 80+ 項修正，而 E2E 覆蓋率朝 95% 目標持續攀升。
- **8 月。** Fireworks、Cloudflare 與 Baseten 提供者加入 E2E 測試套件。負載測試門檻被加入穩定版發布，進度會與 8 月 29 日版本一起回報。

我們最新的穩定版在[這裡](https://docs.litellm.ai/release_notes/v1.93.0/v1-93-0)。

## 產品 {#product}

除了安全與穩定性工作外，我們也在 7 月推出了 **140 個功能提交**。

- **Rust：** pyo3 0.29、Python 3.14 支援、Mistral OCR 橋接，以及 Azure 上的 /v1/messages。
- **Token 與預算：** Headroom 可將 token 使用量降低 60-95%；預算備援會在上限時重新路由。
- **新模型：** Day 0 就支援 Claude Sonnet 5、Gemini 3.5 Flash 與 Muse Spark 1.1。

### 效能 {#performance}

我們一直在測試 LiteLLM，並以 [AIGatewayBench](https://github.com/BerriAI/ai-gateway-bench) 進行基準測試。這是相對於本機決定性 mock 的閘道額外負擔，每個端點在單一主機上執行 n=5000 次。

| 指標 | LiteLLM Rust | Bifrost | Portkey | LiteLLM Python v1 |
|---|---|---|---|---|
| 閘道額外負擔（p99 新增延遲） | 0.7 ms | 4.5 ms | 2.3 ms | 257.7 ms |
| 峰值記憶體占用 | 21.8 MB | 199.1 MB | 90.4 MB | 329.5 MB |
| 每 100 萬次請求的估計成本 | $0.000175 | $0.001008 | $0.001042 | $0.015354 |

_*額外負擔是同一端點上閘道 p99 減去直接到 mock 的 p99。成本是根據 4 vCPU / 16 GB 下量測到的 CPU 與峰值 RSS 所做的占用估算，不含 token 成本。_

Beta v0 現已可供測試。它今天已支援 Azure 的 /v1/messages 與所有 /ocr 提供者。請參閱[文件](https://docs.litellm.ai/docs/proxy/rust_gateway)。下一步是支援 Bedrock Invoke 的 /v1/messages，並支援所有已知的 Bedrock auth 方法：STS、keys 與 IAM。

這是逐步發布，一次只開放一條路由，每條都先在正式環境驗證後再開始下一條。我們的目標是在 12 月 1 日前完成全面發布。相同設定、相同資料庫、相同 API。您不需要做任何變更。

[開始使用。](https://docs.litellm.ai/docs/proxy/rust_gateway)

## 宣布 Autorouter V2 {#announcing-autorouter-v2}

Autorouter V2 會根據每個請求的難度將它路由到最適合的模型。共有四個複雜度層級，預設透過不需要訓練資料、也不需要 API 呼叫、且延遲低於 1 ms 的規則式評分來分類。

- **簡單。**「Hello」、「什麼是 Python？」、「謝謝。」
- **中等。**「說明 REST API 的運作方式」、「除錯這個錯誤。」
- **複雜。**「設計一個微服務架構」、「實作速率限制器。」
- **推理。**「一步一步思考...」、「分析優缺點...」

這個預設值是一個啟發式評分器，會衡量七個訊號：token 數量、是否包含程式碼、推理標記、技術詞彙、簡單指標、多步驟模式，以及問題複雜度。合併後的分數會決定層級（Simple < 0.15、Medium 0.15-0.35、Complex 0.35-0.60、Reasoning > 0.60 或 2+ 個推理標記）。V2 新增四種讓這項路由更聰明的方法：

1. **LLM 分類器。** 將啟發式規則替換為模型呼叫（例如 anthropic/claude-haiku-4-5，並可設定逾時）來選擇層級。如果分類器出錯、逾時或回傳無法解析的內容，它會自動回退到啟發式評分器。
2. **會學習的路由。** 自適應 bandit 模式會觀察每段對話實際如何發展：使用者是否需要改寫或修正模型、是否卡在重複自己或工具呼叫用盡、使用者看起來是否滿意。這些即時回饋會把未來的路由往真正有效的模型調整。品質與成本加權（我們建議 30/70）、可用模型池，以及層級距離懲罰都可設定。
3. **層級升級。** 當配置的關鍵字出現在使用者訊息中時，會將請求提升一個層級。比對是區分大小寫，因此像 LITELLM ESCALATE 這樣的片語只會在完全相同、全大寫的形式下觸發。
4. **語意關鍵字比對。** 關鍵字覆寫已可將包含特定詞彙的請求直接路由到某個層級（例如「invoice, refund, billing」會路由到 Medium）。語意比對則透過 embedding 模型與最低相似度分數加以延伸，以些許延遲換取不需要精確關鍵字命中的比對。

我們推出 Autorouter V2，就是想聽聽您的回饋。今天就試試看：

- [本機 CLI](https://docs.litellm.ai/docs/learn/autorouter_cli)
- [在 Proxy 上](https://docs.litellm.ai/docs/proxy/auto_routing)
- 告訴我們哪裡出問題：[GitHub Discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)，或在 Discord 上的 #litellm-autorouter。

## 接下來是什麼 {#whats-next}

再次感謝所有提問與回饋。我們會在這項工作推出時持續分享具體進展，尤其是在接近 8 月 29 日版本發佈時。

## 我們正在招募 {#were-hiring}

LiteLLM 是數千個團隊使用的開源閘道，可透過單一 API 執行每個模型，從新創公司到 Fortune 500。 我們行動迅速：本月就推出了 140 項功能與 300+ 個修正。

我們正在為核心閘道招募 Security Engineer。小團隊、巨大範圍、從第一天起就有真正的自主權。想加入，或認識很優秀的人嗎？請聯絡 recruiting@berri.ai。

感謝您使用 LiteLLM。**Krrish 與 Ishaan**

**有問題嗎？加入討論** [GitHub Discussion #34595](https://github.com/BerriAI/litellm/discussions/34595)
