---
slug: lens-cli
title: "介紹 Lens CLI：評估您代理程式的模型與 harness"
date: 2026-11-21
authors: [ishaan]
description: "在您自己的任務上評估模型、harness 與自訂代理程式。使用 Lens CLI 比較結果，並重複使用閘道中的資料集。"
image: /img/lens/cli/launch.webp
tags: [lens, engineering]
hide_table_of_contents: true
custom_hero: true
draft: false
---

import LaunchHero, {GetStartedCta, PreviewNote, ReportFigure} from './Launch';

<LaunchHero />

<GetStartedCta />

以前，您必須自行撰寫評估迴圈、建立暫存工作區，再把結果彙整到試算表。接著換一個模型或 harness，就得把整套工作重做一次。

**針對某項任務，您應該使用哪個模型與 harness？**Lens CLI 讓您透過代理程式執行相同的任務，並在同一個終端機報告中比較結果。

這是為**正在建置代理程式的開發者**而設，協助您針對使用者需要完成的工作，評估模型、harness 與自己的代理程式程式碼。

<PreviewNote />

{/* truncate */}

<ReportFigure src="/img/lens/cli/results.webp" alt="真實的 Lens CLI 報告，在 24 項法律問答範例任務上，對 12 種模型與 harness 設定進行排名。">
真實儲存的執行記錄：24 項合成法律問答任務、三種 harness、四個模型。CLI 輸出以 Xnapper 框起；模型成本為依 token 用量估算。
</ReportFigure>

## 選擇您的代理程式與任務 {#choose-your-agents-and-tasks}

請選擇具代表性的任務，以及何謂正確結果。請將內建 harness（例如工具迴圈或 Codex）與您自己的代理程式程式碼一併比較。在不同設定之間保持相同的任務與評分方式。

[教學](/docs/proxy/lens/cli)提供完整的設定，可連接您的代理程式並記錄其答案、成本與工具呼叫。

**您的閘道上已有資料集了嗎？**請開啟 **Lens > Datasets**，選取一個資料集版本，然後點選 **Export JSONL**。教學會將該快照轉換為 CLI 的任務格式，同時保留對話與預期答案。

## 執行 CLI {#run-the-cli}

安裝預覽版 CLI，並將教學檔案放入專案目錄後，執行：

```bash
lens run tasks.csv --config evals.py --trials 2
```

CLI 會針對您的設定執行任務集。請觀察進度，再閱讀完成的報告。若使用匯出的閘道資料集，請使用教學轉換後的檔案：

```bash
lens run gateway-tasks.csv --config evals.py --trials 2
```

## 閱讀報告並選擇下一步變更 {#read-the-report-and-choose-your-next-change}

請先看建議與結果表格。比較通過率與成本，再使用 **Cost vs quality** 圖表，查看不同模型與 harness 選擇之間的取捨。

<ReportFigure src="/img/lens/cli/cost-quality.webp" alt="真實的 Lens CLI 圖表，針對相同的 12 種模型與 harness 設定，比較估計總成本與通過率。">
位置愈高、愈靠左，代表在更低的估計成本下通過更多案例。
</ReportFigure>

在這次執行中，Claude Agent SDK 搭配 `gpt-5.4-mini` 通過了全部 24 個案例。同一模型透過 OpenAI Agents 通過 22 個，透過 Deep Agents 通過 23 個。結果取決於這些任務及其評分器，因此在選擇預設值之前，請先評估您自己的工作負載。

<ReportFigure src="/img/lens/cli/failures.webp" alt="真實的 Lens CLI 報告將錯誤答案、工具誤用與執行錯誤分開呈現，下方附有工具呼叫次數。">
請先檢查錯誤答案、工具誤用與錯誤，再決定要變更什麼。
</ReportFigure>

請利用失敗來選擇下一步變更，然後再次執行相同的案例。

請經由支援 Lens 的閘道執行，然後開啟 **Lens > Traces** 檢查擷取的模型呼叫。[為您的代理程式加入檢測](/docs/proxy/lens/first-trace)，以納入工具步驟。

<ReportFigure src="/img/lens/overview-traces.webp" alt="Lens Traces UI 顯示擷取的代理程式執行記錄，包含輸入、持續時間、成本與發現。">
以範例資料呈現的 Lens UI，與上述 CLI 執行無關。
</ReportFigure>

<GetStartedCta />
