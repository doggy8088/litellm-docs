---
slug: litellm-roi-calculator
title: "LiteLLM ROI 計算器介紹"
date: 2026-09-26T10:00:00-07:00
authors: [moe]
description: "比較每位工程師的 LiteLLM 閘道支出與其已合併拉取請求的預估工時。開源且可自行代管。"
tags: [cost, product, announcement]
hide_table_of_contents: true
image: ./overview.png
---

![LiteLLM ROI 計算器總覽：$258 的已配對閘道支出，相較於 78 個預估工程時數，或每個預估工時 $3.31，上方列出已合併的拉取請求。](./overview.png)

您的閘道會告訴您團隊在 AI 上花了多少錢。它不會告訴您這些支出產生了什麼。

**[LiteLLM ROI 計算器](https://github.com/BerriAI/litellm-roi-calculator) 會比較閘道支出與團隊交付的工程工作。**它會從 LiteLLM 讀取每位使用者的支出、使用您選擇的模型估算每個已合併拉取請求的工時，並依電子郵件配對對象。結果只會得到一個數字：每個預估工程時數的支出。

{/* truncate */}

## 連接您的閘道與 GitHub {#connect-your-gateway-and-github}

只要一個指令即可在本機執行：

```bash
git clone https://github.com/BerriAI/litellm-roi-calculator.git
cd litellm-roi-calculator
uv run litellm-roi
```

應用程式會在 `http://localhost:8787` 開啟。無需資料庫伺服器、Node 安裝或前端建置。

設定分三步驟：

- **閘道：** 輸入您的閘道 URL，以及可讀取使用者與支出的管理員或唯讀管理員金鑰。
- **GitHub：** 點擊 **Connect GitHub**。GitHub 會引導您建立唯讀 App 並選擇其儲存庫。無需複製 client ID 或 secret。
- **模型與排程：** 從您的閘道選擇一個模型。像 GPT Luna 或 Claude Haiku 這類小型模型表現良好。

![已選取兩個範例儲存庫的儲存庫選擇器](./setup-repositories.png)

## 估算每個已合併的拉取請求 {#estimate-every-merged-pull-request}

對於每個已合併的 PR，模型會回答一個問題：

> 請估算若沒有 AI 協助，工程師完成這個拉取請求中的工作需要多少小時。請簡要說明您的估算。

模型會看到 PR 說明、檔案變更數量與 commit 中繼資料。程式碼補丁絕不會傳送。temperature 固定為 0，且您可以在 **Settings** 中編輯提示、回補視窗與更新間隔。

![包含模型、七天回補與 24 小時更新間隔的估算器設定](./setup-estimator.png)

點擊 **Start backfill** 後，應用程式會匯入支出與 PR，然後一次最多估算三個 PR。之後會依您的排程重新整理。未變更的 PR 會重用其快取估算，因此您只需為新的或已變更的工作付出估算成本。

![回補進度顯示已完成的匯入階段、PR 數量、經過時間與預估剩餘時間](./backfill.png)

## 閱讀報告 {#read-the-report}

- **總覽：** 已配對支出除以預估工時。點擊任何 PR 可查看其估算與模型推理。
- **人員：** 每位工程師的支出與預估工時。當某人的 GitHub 電子郵件與其閘道電子郵件不同時，請使用 **Match email**。
- **計算詳細資料：** 顯示已配對多少支出，以及排除了哪些項目。

在上方的範例報告中，$258 的已配對支出 ÷ 78 個預估工時 = **每個預估工時 $3.31**。這些是工程工作的估算，而不是實際工作時數或節省時數。每個人的支出涵蓋其全部閘道使用量，而不是歸因於特定 PR 的成本。

## 為您的團隊代管 {#host-it-for-your-team}

此儲存庫包含一個帶有持久磁碟的單一共享執行個體 Render blueprint。它沒有內建的儀表板登入，因此在分享公司資料前，請將其置於您的代管提供者的存取控制或 SSO proxy 之後。金鑰會保留在伺服器上，而 PR 中繼資料只會透過您自己的閘道傳送到您所選擇的模型。

## 開始使用 {#get-started}

ROI 計算器以 Apache 2.0 釋出為開源。複製 [BerriAI/litellm-roi-calculator](https://github.com/BerriAI/litellm-roi-calculator)、依照 README，或 [無需憑證即可探索示範](https://github.com/BerriAI/litellm-roi-calculator/blob/main/docs/running.md)。

請用您團隊上週的 PR 試試看，並 [告訴我們您的發現](https://github.com/BerriAI/litellm-roi-calculator/issues)。
