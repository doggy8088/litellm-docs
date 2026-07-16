---
slug: june-townhall-updates
title: "6 月 Townhall 更新：94 個 Bug 修正、OCR + Realtime 已採用 Rust，以及零回歸承諾"
date: 2026-06-26T12:00:00
authors:
  - krrish
  - ishaan-alt
description: "June LiteLLM town hall 的回顧，涵蓋安全性強化、我們的零回歸承諾、78 個功能提交，以及 gateway 逐步遷移到 Rust。"
tags: [townhall, security, reliability, product]
hide_table_of_contents: false
---

import Image from '@theme/IdealImage';

<Image
  img={require('../../img/june_townhall_updates_banner.png')}
  style={{width: '100%', height: 'auto', display: 'block', borderRadius: '12px'}}
/>

感謝所有參加我們 6 月 town hall 的人。

三個數字概括了這個月：**24 個安全性修正**、**94 個 bug 修正**，以及**78 個功能提交**。以下各節將逐一拆解，並說明我們對零已回報回歸的公開承諾，以及 LiteLLM gateway 逐步遷移到 Rust 的進程。

{/* truncate */}

## 安全性更新 {#security-updates}

### 過去 4 週：以數字來看 {#last-4-weeks-by-the-numbers}

| 指標 | 數量 |
|---|---|
| 已修補的漏洞 | **24** |

### Bug bounty — 現已上線 {#bug-bounty--now-live}

我們會為安全性回報付費。

- **範圍** — LiteLLM gateway 和 SDK。
- **提交方式**：透過 [GitHub 上的私人漏洞回報](https://github.com/BerriAI/litellm/security)。
- **分流處理**：由維護者與 Veria Labs 安全團隊負責。

### 每個 PR 都會進行自動化審查 {#automated-review-on-every-pr}

每個 PR 都會經過安全性檢查。請留意 **Veria scan** — 這是每個 PR 的必要檢查，建立於 Veria AI + zizmor + semgrep 之上。誤判會被標記，但不會阻擋。

### 安全性的下一步 {#whats-next-for-security}

- 加大對 bug bounty 計畫的投入。
- 在穩定性衝刺期間改善程式碼模式。

## 穩定性更新 {#stability-updates}

### 承諾：到 8 月 29 日前達成零已回報回歸 {#the-commitment-zero-reported-regressions-by-august-29th}

目標：

- 關閉核心功能中的 20 個已回報 bug。
- 修正 3 個高影響元件的根本原因。
- 隨 8 月 29 日版本一併發布公開進度報告。

### 已完成 94 個 bug 修正 {#94-bug-fixes-done}

修正分布於五個領域：

- Proxy 核心與韌性 — 22 項修正
- UI + Auth / SSO — 22 項修正
- 成本、預算與可觀測性 — 21 項修正
- MCP Gateway — 15 項修正
- Streaming / Realtime APIs — 14 項修正

**這些修正涵蓋哪些類型：**

- **計費準確性。** 補上了支出漏掉的缺口 — 現在會強制執行 virtual-key 限制，而且 Anthropic 和 Bedrock 上的快取與分層使用量也已正確計價。
- **身分與存取。** 呼叫端身分現在只會解析一次成單一紀錄，因此 team IDs 與支出歸因能保持正確，而在資料庫錯誤時認證也不再失敗開放。
- **MCP 可靠性。** 工具現在會在每一種認證方法下以一致方式列出與呼叫，並具備每位使用者的憑證與正確的 OAuth token refresh。
- **資源洩漏。** guardrails 不再會在每次請求時重新初始化，消除了它們造成的 runner 洩漏、延遲尖峰與 OOM。
- **韌性。** Streaming 請求在中斷時會恢復成本，proxy 在資料庫連線中斷時可自我修復，而 OTEL 指標也不再讓 Splunk 負荷過重。

**根本原因，而不只是症狀：**

- **MCP 認證** — 5 條獨立程式路徑，每種認證方法各一條，導致工具列出與呼叫不一致。修正：單一統一程式路徑可跨所有認證方法解析憑證。
- **AI gateway 認證** — 每個請求需要 5 次以上的資料庫查詢來解析 key/user/team 身分。修正：呼叫端身分只解析一次成單一紀錄 — 查詢次數大約減半。
- **UI 表單** — 儲存表單時可能覆寫無關欄位。修正：前端與後端型別 100% 由共享來源同步，因此儲存時只會變更已編輯欄位。

### 公開時程 {#public-timeline}

Bug 分流處理已在 [GitHub issue #30484](https://github.com/BerriAI/litellm/issues/30484) 開放且持續進行。

- **現在** — 核心功能中有 20 個 bug 待處理。分流處理進行中。
- **7 月** — MCP 認證統一為單一程式路徑。AI gateway 的身分查詢減半。
- **8 月** — UI 表單型別端到端同步。儲存時不再默默覆寫欄位。
- **8 月 29 日** — 公開進度報告隨版本發布。零回歸目標日期。

## 產品更新 {#product-updates}

### 6 月的 78 個功能提交 {#78-feature-commits-in-june}

**Rust**

- Rust workspace · Mistral OCR bridge
- OpenAI Realtime translation layer

**Sandbox API**

- E2B + OpenSandbox
- Unified code execution API

**新模型/提供者**

- TinyFish · Fal.ai · Fireworks AI
- Cloudflare Workers AI · MAI-Image-2.5

### 效能：將 LiteLLM 移至 Rust {#performance-moving-litellm-to-rust}

我們正在將 LiteLLM gateway 遷移到 Rust，而初期數據已經說明了這項選擇：

| 指標 | Rust gateway | LiteLLM (Python) | 改善 |
|---|---|---|---|
| 每次請求額外負擔 | 0.05ms | 7.5ms | 約低 150 倍 |
| 負載下的吞吐量 | 6,782 req/s | 453 req/s | 15 倍 |
| 負載下的峰值記憶體 | 32MB | 359MB | 輕 11 倍 |

*每次請求額外負擔是在 10 個並行用戶端、相對於本機模擬 upstream 測得；吞吐量與記憶體則是在 50 個並行用戶端的持續負載下測得。重現用的 harness 已檢入。*

**遷移方式：** 分階段 rollout，逐步從純 Python SDK + FastAPI proxy，轉為由 Python 透過 PyO3 驅動 Rust transforms，再到以純 Rust 處理 hot path 的 FastAPI 外殼，最後到全 Rust 的 async server（axum）。

**漸進式 rollout** — 一次一條路由，在進入下一條之前先於 production 驗證。相同的設定、資料庫與 API：您無需變更任何內容。

- **8 月 15 日** — OCR routes：先 Mistral，再全部 OCR。
- **9 月 1 日** — `/messages`，然後 `/chat/completions`。
- **9 月 15 日** — 路由器：負載平衡、備援、重試、冷卻。
- **12 月 1 日** — 完整伺服器：FastAPI 輕量外殼，接著是純 Rust（axum）。

### 宣布我們的版本政策 {#announcing-our-version-policy}

從現在起，我們只會維護最近的四個穩定次要版本。此政策將於**下週一，6 月 29 日**生效。我們的重點是確保最新產品供應項目的穩定性 — 請將我們的 [Release Notes](https://docs.litellm.ai/release_notes) 加入書籤以掌握最新資訊。

## 接下來 {#whats-next}

再次感謝所有提問與回饋。隨著這些工作逐步交付，我們會持續分享具體進度更新 — 特別是在接近 8 月 29 日零回歸里程碑時。

## 招募 {#hiring}

我們目前積極招募多個職位 — 如果您有興趣，請[在此](https://jobs.ashbyhq.com/litellm)申請！

感謝您使用 LiteLLM - Krrish 與 Ishaan
