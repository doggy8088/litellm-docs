---
slug: hex-litellm-roi
title: "使用 Hex 分析 LiteLLM 成本，再設定預算與路由"
date: 2026-10-30T09:00:00
authors:
  - ishaan
description: "將 Hex 連接到 LiteLLM 的 Postgres 資料，匯入成本儀表板，再使用 LiteLLM UI 設定預算或變更模型路由。"
tags: [observability, cost tracking, ai-gateway]
hide_table_of_contents: true
custom_hero: true
---

import { HexPage, TemplateDownloads, SpendDataFlow } from './diagrams';

<HexPage>

LiteLLM 將 AI 成本記錄在 Postgres 中，並維護每日支出總計。Hex 連接到該資料庫並讀取總計。使用儀表板找出成本增加的原因，再開啟 LiteLLM 變更路由或設定預算。

## 1. 將 Hex 連接到您的 LiteLLM Postgres 資料庫 {#1-connect-hex-to-your-litellm-postgres-database}

在 Hex 中，開啟 **Settings → Data sources → + Connection → Postgres**。為您的 LiteLLM gateway 使用的資料庫加入一個唯讀連線。

<SpendDataFlow />

範本讀取兩個既有的資料表：用於成本與使用量的 **LiteLLM_DailyTeamSpend**，以及用於團隊顯示名稱的 **LiteLLM_TeamTable**。它會依日、團隊與模型將結果分組。請給予讀取者那些報告欄位的存取權。它不需要您的金鑰表、prompts 或 responses。

[連線細節與 SQL 權限](/docs/observability/hex#connect-postgres)。

## 2. 加入範本並檢視您的成本 {#2-add-the-template-and-inspect-your-costs}

先開啟 [即時 Hex 示範](https://app.hex.tech/01a18e4b-6e94-7328-831c-e5ab0e2e00e7/app/LiteLLM-AI-cost-and-ROI-demo-034p688gOAllaldLw72Oat/latest)。您可以不登入就進行篩選。其紀錄是合成的。

若要使用您自己的資料，請下載下方的 Postgres 範本。在 **Hex Home** 中，點擊 **+ → Upload project**，然後在對話框中點擊 **Upload** 並選擇 `.hex.yaml` 檔案。在 **Source** SQL 儲存格上選擇您的 Postgres 連線，然後 **Run all**。

![用於上傳 YAML 專案的 Hex 對話框](/img/hex/import-project.png)

<div id="get-the-template" />

<TemplateDownloads />

依團隊篩選。比較記錄的支出、請求量與每千次請求的成本，然後開啟 **Models and cost changes**。在示範中，Legal 團隊的文件審查工作負載切換了模型，單位成本上升 80%。

## 3. 在 LiteLLM 中採取行動 {#3-take-an-action-in-litellm}

使用 Hex 調查增加的原因。透過您的 LiteLLM gateway 套用變更。

| 您的決定 | 在 LiteLLM UI 中 |
| --- | --- |
| 嘗試較便宜的模型 | 開啟 **Teams → your team → Settings → Edit Settings → Model Aliases**。變更您的應用程式已經在呼叫的別名背後的模型，然後儲存。先在您的工作負載上評估候選模型。 |
| 依請求複雜度路由 | 開啟 **Models + Endpoints → Auto Router → Add Auto Router**。為每個層級選擇模型，測試路由與連線，然後儲存。設定您的應用程式或團隊別名來呼叫該 router。 |
| 設定支出上限 | 開啟 **Teams → your team → Settings → Edit Settings**。設定 **Max Budget (USD)** 與 **Reset Budget**，然後儲存。 |

例如，在 LiteLLM 中選擇 **Legal**，將 **Max Budget (USD)** 設為 **1000**，並將 **Reset Budget** 設為 **monthly**（30 天）。這會限制新的支出；它不會變更已記錄的成本。

![在 LiteLLM 團隊設定中設定 Legal 的預算](/img/hex/litellm-budget-edit.png)

*目前的 LiteLLM UI，使用合成的本機 gateway 資料。*

儲存後，檢查團隊的預算狀態。然後在 LiteLLM 更新其每日總計後重新整理 Hex，以比較下一個完整期間。如果您希望報告依排程重新整理，請設定 Hex 排程執行。

![儲存後的 Legal 預算狀態](/img/hex/litellm-budget-saved.png)

[Auto Router 設定](/docs/auto_router/setup) · [團隊預算](/docs/proxy/team_budgets)

</HexPage>

{/* truncate */}
