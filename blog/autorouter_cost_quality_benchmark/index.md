---
slug: auto-router-cost-quality-benchmark
title: "以近乎前沿模型的品質，將 Claude Code 成本降低 75%"
date: 2026-07-27T10:00:00
authors:
  - tin
description: "針對四層 Auto Router 組態與全前沿基準的兩項獨立評估：8,619 個評分過的提示、14,000 則模擬真實對話，以及成本與品質數字實際取決於什麼。"
image: ./hero.png
keywords: [llm router benchmark, auto router, complexity router, llm cost savings, model routing, claude cost optimization, routerarena, litellm auto routing, cheaper llm inference]
tags: [routing, complexity-router, cost, benchmarks, engineering]
hide_table_of_contents: false
---

![介紹 LiteLLM Autorouter：以近乎前沿模型的品質節省 75% 成本](./hero.png)

自動路由承諾在不降低答案品質的前提下，讓帳單更小。我們以把每個請求都送往 `claude-opus-5` 的基準來衡量兩個面向：8,619 個評分過的提示，以及對 14,000 則真實對話的成本模擬。

{/* truncate */}

:::info[🚀 協助塑造 Auto-Router]

搶先取得使用權、直接與 LiteLLM 團隊合作，並以您的正式流量影響產品藍圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

<br /><br />

已在測試了嗎？請在 [discussion #32172](https://github.com/BerriAI/litellm/discussions/32172) 分享您的結果。

:::

## 結果 {#the-results}

- **在保留 97.1% 前沿品質的情況下便宜 40.4%**，基於 220 個提示，這些提示來自六個公開基準並透過即時 proxy 重播
- **在保留 87.3% 前沿品質的情況下便宜 74.5%**，基於 RouterArena 的完整 8,399 筆查詢集合
- **大約便宜 65%**，在模擬真實聊天與開發者流量中，因為大多數請求都很短

| 評估 | 樣本 | 相對於 Opus-5 保留的品質 | 相對於 Opus-5 的成本節省 | 路由組合（haiku/sonnet/opus） |
| --- | --- | --- | --- | --- |
| 即時 proxy，六個公開基準 | 220 個提示 | **97.1%**（Auto Router 91.8% 通過率，Opus-5 94.5%） | **40.4%**（Auto Router $10.47 / 1k，Opus-5 $17.57） | 27% / 70% / 3% |
| [RouterArena](https://github.com/RouteWorks/RouterArena) 完整集合，成對比較 | 8,399 個提示 | **87.3%**（Auto Router 68.6% 準確率，Opus-5 78.5%） | **74.5%**（Auto Router $2.15 / 1k，Opus-5 $8.45） | 79% / 17% / 4% |
| 模擬，一般消費者聊天（[WildChat-1M](https://huggingface.co/datasets/allenai/WildChat-1M)） | 12,000 則對話 | 未測量 | **64.9%** | 76% / 14% / 10% |
| 模擬，開發者聊天（[DevGPT](https://github.com/NAIST-SE/DevGPT)） | 2,056 則對話 | 未測量 | **65.4%** | 48% / 27% / 25% |
| 模擬，提示中含大量程式碼（[WildChat](https://huggingface.co/datasets/allenai/WildChat-1M) code-filtered） | 993 則對話 | 未測量 | **20.0%** | 13% / 34% / 53% |

## 測量方式 {#how-it-was-measured}

- **路由器分支：** 一個模型群組，四個層級。SIMPLE 到 `claude-haiku-4-5`，MEDIUM 到 `claude-sonnet-5`，COMPLEX 和 REASONING 都到 `claude-opus-5`，因為 Opus 5 本身就預設會思考。啟發式分類器，沒有關鍵字規則，沒有自適應採樣
- **基準分支：** 與上述相同的提示直接送往 `claude-opus-5`，這也是大多數團隊今天把工作負載指向單一前沿模型時的做法
- **成本節省：** 路由器花費相對於基準花費的差額。在即時 proxy 上，LiteLLM 會透過回應標頭回傳每個請求的成本；在其他測試路徑中，我們會依照每個請求實際使用的 token 進行定價
- **保留的品質：** 路由器相對於基準的通過率，以相同的評分器對兩個分支的相同提示進行評估

通過的定義如下：

| 資料集 | 如何判定通過 |
| --- | --- |
| [HumanEval](https://huggingface.co/datasets/openai/openai_humaneval), [MBPP](https://huggingface.co/datasets/google-research-datasets/mbpp) | 資料集本身的單元測試在子程序中執行；只有每一個官方 assert 都通過才算通過 |
| [GSM8K](https://huggingface.co/datasets/openai/gsm8k), [MATH-500](https://huggingface.co/datasets/HuggingFaceH4/MATH-500), [MMLU-Pro](https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro) | 標準答案比對：擷取出的最終數字、使用 SymPy 等價性回退的 LaTeX 正規化，以及最終答案字母 |
| [SWE-bench Lite](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite) | 由 LLM 作為裁判，將命名的檔案、函式與 diff 草圖與上游實際合併的 patch 進行比較 |
| [RouterArena](https://github.com/RouteWorks/RouterArena) | RouterArena 自有的評估器；約 74% 的查詢是以 `\boxed{X}` 字母比對的單選題，其餘則使用各資料集的評分器 |

:::note

SWE-bench Lite 是唯一由 LLM 作為裁判評分的片段；其他全部都以資料集本身的標準答案或測試套件進行檢查。每一個 SWE-bench 答案都被評判兩次，分別由 `claude-opus-5` 與 `gemini-3.6-flash` 評判，而且在較嚴格的裁判下，保留率仍達 96.6%。

:::

## 節省從哪裡來，以及代價是什麼 {#where-the-savings-come-from-and-what-they-cost}

| 資料集 | Auto Router 通過率 | Opus-5 通過率 | Auto Router $/1k | Opus-5 $/1k | 節省 |
| --- | --- | --- | --- | --- | --- |
| [GSM8K](https://huggingface.co/datasets/openai/gsm8k) | 98% (39/40) | 98% (39/40) | 1.08 | 5.68 | 81% |
| [HumanEval](https://huggingface.co/datasets/openai/openai_humaneval) | 100% (40/40) | 98% (39/40) | 2.85 | 8.16 | 65% |
| [MMLU-Pro](https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro) | 85% (34/40) | 88% (35/40) | 4.21 | 11.70 | 64% |
| [MATH-500](https://huggingface.co/datasets/HuggingFaceH4/MATH-500) | 90% (36/40) | 98% (39/40) | 5.70 | 13.16 | 57% |
| [MBPP](https://huggingface.co/datasets/google-research-datasets/mbpp) | 95% (38/40) | 98% (39/40) | 2.20 | 5.01 | 56% |
| [SWE-bench Lite](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite) | 75% (15/20) | 85% (17/20) | 83.08 | 105.83 | 21% |
| **混合** | **91.8%** | **94.5%** | **10.47** | **17.57** | **40%** |

拆分結果與直覺相反：

- **短而便宜的流量在幾乎沒有品質代價下省最多。** GSM8K 的結果與基準相同，但成本只有五分之一，而 HumanEval 的結果甚至比前沿基準多對了一個提示
- **倉庫層級的工作省得最少。** 這些提示足夠長，會主導絕對支出，而且分類器正確地拒絕將它們送到 Haiku
- **品質在兩個地方被犧牲。** MATH-500，Haiku 接手了 40 個提示中的 19 個，而該分支最後落後 3 個；以及 SWE-bench Lite

## Auto-routing 與提示快取 {#auto-routing-and-prompt-caching}

我們經常聽到一個問題：我是否必須在自動路由與提示快取之間二選一？

不用。Session affinity 已經能讓您把對話維持在其第一輪所選的模型上，因此該對話其餘部分的快取都能保留。其代價是第一輪之後每一輪的路由決策：一旦 session 被固定，單行後續提問就會停留在開場那輪所選到的模型上。縮小這個落差，就是下面第一項。

## 下一步 {#whats-next}

- **能在層級變更後仍保留的提示快取。** 目前 affinity 會將對話固定下來，因為切換模型就代表冷快取。我們正在測試背景更新器，讓每個層級上的前綴都保持溫熱，因此 session 可以移動而不必重複支付寫入成本
- **您可以檢視的路由決策。** 不只是顯示是哪個模型提供服務，而是呈現請求為何落在那個層級。相同的訊號也會回饋到分類器，因此它是根據真實流量而非基準持續改善

## 試用 {#try-it}

:::info

請用下面的組態自行嘗試，並在 [discussion #32172](https://github.com/BerriAI/litellm/discussions/32172) 上貼出任何回饋、問題，或來自您自身流量的數據。如果您想直接與我們一起做這件事，請 [申請成為設計夥伴](https://calendly.com/tin-berri/litellm-auto-router-design-partner)。

:::

```yaml title="config.yaml"
model_list:
  - model_name: claude-haiku-4-5           # $1 / $5 per 1M tokens
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-sonnet-5            # $3 / $15
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY
  - model_name: claude-opus-5              # $5 / $25
    litellm_params:
      model: anthropic/claude-opus-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-sonnet-5
          COMPLEX:   claude-opus-5
          REASONING: claude-opus-5
        classifier_type: heuristic         # local scoring, sub-millisecond, no API call
      complexity_router_default_model: claude-sonnet-5
```

將用戶端指向 `smart-router`，每個回應都會附帶 `x-litellm-model-name` 和 `x-litellm-response-cost`，這就是本研究所需的全部儀器化。完整參考資料，包括分類器與層級邊界調整選項，請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。
