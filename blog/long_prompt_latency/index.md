---
slug: long-prompt-latency
title: "我們如何將長提示的首字回應時間縮短 94%"
date: 2026-10-03T09:00:00
authors:
  - yassin
image: ./cover.gif
description: "一個 44 萬 token 的基準測試，首字回應時間中位數從 553 毫秒降到 35 毫秒。我們在模型呼叫前移除了不必要的提示快取路由工作。"
tags: [performance, proxy, engineering, ai-gateway]
hide_table_of_contents: true
---

import { BenchmarkResults } from './diagrams';
import PromptLatencyHero from './PromptLatencyHero';

export const Hero = PromptLatencyHero;

![LiteLLM 的首字回應時間中位數在本機 44 萬 token、單一部署的基準測試中從 553 毫秒降至 35 毫秒，減少 94%](./cover.gif)

LiteLLM 一直在長對話中數算每一個 token，只為了回答一個是或否的路由問題。

移除這項不必要的工作後，在我們本機 44 萬 token 的基準測試中，首字回應時間中位數從 **553 毫秒降到 35 毫秒**：**降低 94%**。

{/* truncate */}

## 計算 440,000 個 token 以檢查 1,024 {#counting-440000-tokens-to-check-for-1024}

LiteLLM 的選用 `prompt_caching` 路由檢查，有助於讓請求留在可重用其快取提示的部署上。為了檢查提示是否達到部署的最小大小，通常是 1,024 個 token，系統會計算整段對話。

對於有數百輪對話與工具結果的程式開發工作階段，這可能代表在模型呼叫前就要花上數百毫秒的 Python 工作。

**我們會在只有一個健康部署時略過這項檢查。** 這時不需要做路由選擇，因此我們現在會完全略過可用性計數、前綴雜湊與快取固定查找。以下量測的就是這條路徑。

**在有多個部署時，計數會在答案已知後停止。** 可用性檢查會在第一則使計數達到所需最小值的訊息後停止。快取親和性與前綴雜湊仍會保留。其他使用 token 計數的用途，包括使用量計費，則不受影響。

## 553 毫秒 → 35 毫秒 {#553-ms--35-ms}

這項基準測試使用 Python 請求路徑、439,945 token 的對話、334 輪與 18 個工具、一個健康部署、Redis 回應快取，以及已啟用的 `prompt_caching` 檢查。測試提供者立即回應，將請求額外負擔與模型生成時間分離。

<BenchmarkResults />

每個結果都是在同一台本機上，經過一次預熱後，三次請求的中位數。`/v1/responses` 已經略過這項檢查，並維持大致平坦。未使用選用檢查的請求不受影響。[完整的基準測試樣本與設定](https://github.com/BerriAI/litellm/pull/44221)。

查看變更：[提示快取路由最佳化](https://github.com/BerriAI/litellm/pull/44221)。
