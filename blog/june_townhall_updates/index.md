---
slug: june-townhall-updates
title: "6 月 Townhall 更新：94 個 Bug 修正、OCR + Realtime 改用 Rust，以及零回歸承諾"
date: 2026-06-26T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "June LiteLLM town hall 的回顧，涵蓋安全加強、零回歸承諾、78 項功能提交，以及閘道逐步遷移至 Rust。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

<Image
  img={require('../../img/june_townhall_updates_banner.png')}
  style={{width: '100%', height: 'auto', display: 'block', borderRadius: '12px'}}
/>

感謝所有參加我們 June town hall 的人。

這個月有三個數字最能代表：**24 項安全修正**、**94 個 Bug 修正**，以及 **78 項功能提交**。以下各節將逐一說明，並介紹我們對零已回報回歸的公開承諾，以及 LiteLLM 閘道逐步遷移至 Rust 的進展。

{/* truncate */}

## 安全性更新 {#security-updates}

### 過去 4 週：數據一覽 {#last-4-weeks-by-the-numbers}

| 指標 | 數量 |
|---|---|
| 已修補漏洞 | **24** |

### Bug 獎勵計畫：現已上線 {#bug-bounty-now-live}

我們會為安全回報付費。

- **範圍** — LiteLLM 閘道與 SDK。
- **提交** 請透過 [GitHub 私人漏洞回報](https://github.com/BerriAI/litellm/security)。
- **分流處理** 由維護者與 Veria Labs 安全團隊負責。

### 每個 PR 都進行自動化審查 {#automated-review-on-every-pr}

每個 PR 都會經過安全檢查。請留意 **Veria scan**；這是每個 PR 的必要檢查，建立於 Veria AI + zizmor + semgrep 之上。誤判會被標記，但不會阻擋合併。

### 安全性的下一步 {#whats-next-for-security}

- 在 bug bounty 計畫上投入更多資源。
- 在穩定性衝刺期間改善程式碼模式。

## 穩定性更新 {#stability-updates}

### 承諾：在 8 月 29 日前零回報回歸問題 {#the-commitment-zero-reported-regressions-by-august-29th}

目標：

- 修復核心功能中 20 個已回報的 bug。
- 修正 3 個高影響力元件的根本原因。
- 在 8 月 29 日版本釋出時一併發佈公開進度報告。

### 已完成 94 項錯誤修正 {#94-bug-fixes-done}

修正項目橫跨五個領域：

- Proxy core & resilience：22 項修正
- UI + Auth / SSO：22 項修正
- Cost, Budgets & Observability：21 項修正
- MCP Gateway：15 項修正
- Streaming / Realtime APIs：14 項修正

**這些修正屬於哪些類型：**

- **計費準確性。** 修補了支出漏算的缺口：現在會強制執行虛擬金鑰限制，且 Anthropic 與 Bedrock 上的快取與分層用量會正確計價。
- **身分與存取。** 呼叫端身分現在只會解析一次並寫入單一記錄，因此團隊 ID 與支出歸屬保持正確，且認證在 DB 錯誤時不再 fail open。
- **MCP 可靠性。** 工具現在會在每種驗證方式下都一致地列出與呼叫，並支援每位使用者的憑證與正確的 OAuth token 重新整理。
- **資源洩漏。** guardrail 不再會在每次請求時重新初始化，因而消除了其造成的 runner 洩漏、延遲尖峰與 OOM。
- **韌性。** 串流請求在中斷時會恢復成本，proxy 在 DB 連線中斷時會自我修復，且 OTEL 指標不再使 Splunk 負載過高。

**根本原因，而不只是症狀：**

- **MCP 驗證** — 5 條彼此獨立的程式路徑，每種驗證方式各一條，導致工具列出與呼叫不一致。修正：單一整合的程式路徑會在所有驗證方式間解析憑證。
- **AI gateway 驗證**：每個請求需要 5 次以上 DB 查詢來解析 key/user/team 身分。修正：呼叫端身分只解析一次並寫入單一記錄，將查詢次數大致減半。
- **UI 表單** — 儲存表單可能覆寫無關欄位。修正：前端與後端型別完全與共享來源保持同步，因此儲存時只會變更已編輯的欄位。

### 公開時程表 {#public-timeline}

Bug 分流處理已在 [GitHub issue #30484](https://github.com/BerriAI/litellm/issues/30484) 上開放且持續進行中。

- **現在** — 核心中有 20 個 bug 待處理。分流中。
- **7 月** — MCP 驗證整合為單一程式路徑。AI gateway 身分查詢減半。
- **8 月** — UI 表單型別端到端同步。儲存時不再靜默覆寫欄位。
- **8 月 29 日** — 公開進度報告與版本一併發佈。零回歸目標日期。

## 產品更新 {#product-updates}

### 6 月完成 78 項功能提交 {#78-feature-commits-in-june}

**Rust**

- Rust workspace · Mistral OCR bridge
- OpenAI Realtime translation layer

**Sandbox API**

- E2B + OpenSandbox
- Unified code execution API

**新模型／提供者**

- TinyFish · Fal.ai · Fireworks AI
- Cloudflare Workers AI · MAI-Image-2.5

### 效能：將 LiteLLM 遷移至 Rust {#performance-moving-litellm-to-rust}

我們正在將 LiteLLM 閘道遷移到 Rust，而早期數據已說明其必要性：

| 指標 | Rust gateway | LiteLLM (Python) | 改善 |
|---|---|---|---|
| 每次請求開銷 | 0.05ms | 7.5ms | 約低 150 倍 |
| 負載下吞吐量 | 6,782 req/s | 453 req/s | 15 倍 |
| 負載下峰值記憶體 | 32MB | 359MB | 輕 11 倍 |

*每次請求開銷是在 10 個並行用戶端對比本機 mock upstream 下量測；吞吐量與記憶體則是在 50 個並行用戶端的持續負載下量測。重現用的 harness 已提交。*

**遷移方式如下：** 分階段推出，從純 Python SDK + FastAPI proxy，逐步過渡到由 Python 透過 PyO3 驅動 Rust transforms，再到具有純 Rust 熱路徑的 FastAPI 外殼，最後到全 Rust async server（axum）。

**逐步推出**，一次一條路由，在生產環境中先驗證再進入下一步。同樣的設定、資料庫與 API：您無需變更任何內容。

- **8 月 15 日** — OCR 路由：先 Mistral，再全部 OCR。
- **9 月 1 日** — `/messages`，接著 `/chat/completions`。
- **9 月 15 日** — 路由器：負載平衡、備援、重試、冷卻。
- **12 月 1 日** — 完整伺服器：FastAPI 薄外殼，之後是純 Rust（axum）。

### 宣布我們的版本政策 {#announcing-our-version-policy}

未來，我們將只維護最近四個穩定的次要版本。此變更自 **下週一，6 月 29 日** 起生效。我們的重點是確保最新產品供應的穩定性；請將我們的 [Release Notes](https://docs.litellm.ai/release_notes) 加入書籤以便隨時掌握最新資訊。

## 接下來的工作 {#whats-next}

再次感謝大家提出的所有問題與回饋。我們會在這些工作陸續推出時持續分享具體進度更新，尤其是接近 8 月 29 日零回歸里程碑之際。

## 招募中 {#hiring}

我們目前正在多個職位積極招募中。如果您有興趣，請在[這裡](https://jobs.ashbyhq.com/litellm)申請！

感謝您使用 LiteLLM - Krrish 與 Ishaan
