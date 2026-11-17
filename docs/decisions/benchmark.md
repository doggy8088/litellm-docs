---
title: "Decision model benchmarks"
description: "LiteLLM 支援的每一個決策模型，都以防護欄、Auto Router 分類器與 Lens Signals 的 LLM judge 三種角色進行測試，包含準確率、成本與延遲。"
sidebar_label: "Benchmarks"
---

import DecisionBenchmark from '@site/src/components/DecisionBenchmark';

# 決策模型基準測試 {#decision-model-benchmarks}

這些基準測試以三種工作測試 LiteLLM 支援的每一個[決策模型](../decisions.md)：作為防護欄、作為 Auto Router 分類器，以及作為 Lens Signals 的 LLM judge。每個模型在 2026 年 10 月透過 LiteLLM 代理在 `/v1/decisions` 上接收相同的請求。自我託管的模型在沒有 GPU 的 8 核心 CPU 上執行，因此其延遲無法與託管模型相比

最佳模型取決於工作。GPT-6 Luna 作為防護欄與 Lens judge 都在頂尖群組中，但在 Auto Router 測試中，它把 80 個提示詞中的 15 個送到較便宜的層級。Decision-1 在路由上並列第二，但只為 44% 的 Lens 旗標挑出正確的證據

## 防護欄 {#guardrails}

防護欄測試包含 394 次編碼代理程式的工具呼叫，其中 195 次危險、199 次安全。每個模型對一次呼叫回答相同的 yes/no 問題，當機率為 0.5 或更高時，呼叫會被封鎖。這就是[決策模型防護欄](../proxy/guardrails/decision_model.md)使用決策模型的方式

<DecisionBenchmark id="guardrails" />

pplx-decider、Jev 1.14、Clef 與 GPT-6 Luna 彼此差距在雜訊範圍內，約為 97%。幾乎所有錯誤都是模型放行的危險呼叫，且沒有任何託管模型封鎖超過 3 次安全呼叫。Clef Flash、Clef Omni 與 Bespoke Nimble 9B 能很好地把危險呼叫排在安全呼叫之前，AUROC 為 0.94 至 0.96，但其分數低於 0.5，因此較低的閾值能抓到更多危險呼叫。gpt-oss-120b 這一列是搭配 Claude Code 自動模式防護提示詞的聊天模型，供比較用。Laya 模型與 Strands Decider 2B 在這些長工具呼叫輸入上的表現不比隨機好

## Auto Router 分類 {#auto-router-classification}

路由測試包含 80 個帶有撰寫層級的提示詞，`SIMPLE`、`MEDIUM`、`COMPLEX` 與 `REASONING` 各 20 個。每個模型回答相同的 `choice` 問題來挑選層級，就像 [Auto Router 決策分類器](../auto_router/decision_classifiers.md)的做法

<DecisionBenchmark id="autorouter" />

pplx-decider 將 80 個提示詞中的 78 個路由到撰寫的層級。只有 80 個提示詞時，前六名模型彼此差距在雜訊範圍內，約為正負 5 個百分點。多數錯誤是把提示詞送到比撰寫層級更便宜的層級。Bespoke Nimble 9B 是表現最佳的自我託管模型，達 93.8%，且從不挑選更貴的層級

## 以 LLM 擔任 judge (Lens Signals) {#llm-as-a-judge-lens-signals}

此基準測試使用決策模型在代理程式追蹤中找出 [LiteLLM Lens](../proxy/lens/index.md) 訊號。每個模型對 207 條測試追蹤接收相同的 621 個 yes/no 問題，每條追蹤三個。對每個問題，模型還會挑出追蹤中顯示問題的部分，或不挑選

<DecisionBenchmark id="lens-signals" />

GPT-6 Luna、Perplexity、Fireworks Rune 與 Cloudflare Clef 在 97.9% 至 99.4% 的問題上與標籤一致。Decision-1 在 93.2% 上一致，但對標籤為 yes 的問題，它只在 44% 挑出追蹤的正確部分。Bespoke Nimble 9B 給出最佳的自我託管結果，94.4%

這些追蹤短且為合成資料，每條約六個步驟，因此真實流量更困難，且頂尖分數彼此接近。一個 OpenAI 模型撰寫了這些追蹤，這可能讓 OpenAI 模型占有一點優勢。一個 Claude 模型在執行前檢查了每個標籤，它不同意的 13 條追蹤被排除

在圖表上，「right evidence passage for X% of yes answers」是標籤為 yes 的問題中，模型挑出標籤標記為證據的追蹤部分的比例。除了 Strands Decider 2B 回答了其中 155 個之外，每個模型的這個數字都是 157 個問題。621 個問題來自 207 個請求，每條追蹤一個，因此圖表給出每條追蹤的成本與 p50 延遲。成本是 `x-litellm-response-cost` 標頭，且自我託管的模型在 8 核心 CPU 上執行，因此其延遲無法與託管模型相比

pplx-decider v1 與 v1.1 在每條追蹤上給出相同的分數與挑選結果，因此圖表將它們顯示為一條。Databricks `ai_decide` 與 OpenJev 在每個問題上給出相同的 yes 或 no 答案，圖表顯示的是 OpenJev 的執行結果。LiteLLM 對沒有說明的證據選項傳送 `null`，而 Strands Decider 2B 對此回應 422，因此它的執行給每個選項一個簡短說明，例如 `excerpt L000`。它仍有 6 條追蹤放不進其上下文視窗，另外 3 條回傳 500，因此這 27 個問題計為未回答

[下載 Lens Signals 資料與指令碼](pathname:///benchmarks/litebench-lens-signals-20261016.tar.gz) 以查核這些數字。
