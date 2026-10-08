---
slug: auto-router-heuristic-tuning
title: "AutoRouter：為您的流量調校啟發式規則"
date: 2026-09-08T10:00:00
authors:
  - tin
description: "為特定工作負載調校 AutoRouter 的啟發式維度、提升分類準確度，並從您已在提供的模型設定分層。"
image: ./hero.png
keywords: [auto router, heuristic routing, dimension weights, model routing, llm benchmark, litellm]
tags: [routing, complexity-router, benchmarks, engineering, product]
hide_table_of_contents: false
---

![調校 AutoRouter Heuristic v1 維度以提升您流量的路由準確度](./hero.png)

Heuristic v1 會為七個提示信號評分，包括推理語言、程式碼、技術詞彙與提示長度。您可以針對路由器所處理的流量調校這些信號。

{/* truncate */}

:::info[🚀 協助塑造 Auto-Router]

與 LiteLLM 團隊一起在您的正式流量上測試啟發式調校，並影響產品路線圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

<br /><br />

在 [討論 #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享基準測試結果。

:::

我們在一組平衡的 240 個提示混合上測試了這個想法：

| 設定 | 準確率 |
| --- | ---: |
| 預設 Heuristic v1 | 90.8% |
| 依工作負載調校的 Heuristic v1 | **95.2%** |
| 全部 Opus | 94.9% |

- 調校後的設定將分類錯誤率從 **9.2% 降至 4.8%**，降低了 **48%**。
- 在這個基準測試上，它略優於全部 Opus 的參考結果。
- 模型梯隊與測試集保持不變，因此是調校啟發式維度帶來了變化。

有用的設定檔取決於您的流量。以程式碼為主的工作負載與客服問題會對不同的路由選擇有不同回報。

## 調校您的工作負載使用的信號 {#tune-the-signals-your-workload-uses}

您可以調校：

- 用於推理密集型提示的 `reasoningMarkers`、`multiStepPatterns` 與 `questionComplexity`。
- 用於程式碼與特定領域流量的 `codePresence` 與 `technicalTerms`。
- 用於提示長度與低複雜度線索的 `tokenCount` 與 `simpleIndicators`。
- 用於工作負載特定詞彙或結構的自訂維度。

為了進行有用的比較：

- 先從您流量中保留未見過的樣本開始。
- 保持模型梯隊與測試集不變。
- 一次只變更一個信號家族，並檢查哪些提示會改變梯隊。
- 比較準確率、延遲與梯隊分布。

[影子評估流程](/docs/auto_router/evaluate) 會在抽樣的正式流量上測試候選項目，而不改變您的使用者收到的回應。

## 從您已擁有的模型自動設定 {#auto-configure-from-models-you-already-have}

選取 **自動設定**。LiteLLM 會檢查您的 proxy 可存取的模型，並使用目前的家族預設，為每個路由梯隊挑選最佳可用模型。

- 每個梯隊都使用您現有部署中的一個模型。
- 設定會在您儲存前開啟供您審查。
- Anthropic Family 會在推理流量上使用 **Claude Fable 5.1 at high effort**。
- OpenAI Family 會在推理流量上使用 **GPT-6 Astra at xhigh effort**。

部署名稱不需要與目錄相符。AutoRouter 會識別每個部署背後的提供者模型。

![具有新的自動設定按鈕的新增 Auto Router 表單](./auto-configure-button.png)

## 以每 1,000 次輪次查看 LLM 分類器活動 {#see-llm-classifier-activity-per-1000-turns}

您現在可以將 LLM 分類器活動與已路由請求分開檢視：

- 將分類器活動標準化為每 1,000 次已路由輪次。
- 使用會話、輪次與梯隊分布來比較路由變更。
- 查看 LLM 分類器與其所路由的流量一起執行的頻率。

## 針對代理程式流量的更多控制 {#more-controls-for-agent-traffic}

近期 AutoRouter 的變更也涵蓋了長時間執行的代理程式會話：

- **低於 Simple 的 `NON_REASONING` 梯隊** 可處理工具結果轉送、確認與重新格式化工作。
- **來自所選梯隊的輸出限制** 會以所選模型的輸出上限取代呼叫端的上限。明確的每梯隊上限仍會優先生效。
- **分類器逾時保護** 會在逾時後開啟斷路器，並在冷卻期間使用已設定的備援。
- **跨提供者工具歷史** 讓 Messages API 在會話於 OpenAI 與 Anthropic 梯隊之間切換時，可重播 `tool_use` 歷史。

## 試用 AutoRouter {#try-the-autorouter}

:::info

開啟 **新增模型 → Auto Router** 並選取 **自動設定**。審查產生的梯隊，然後用您的流量測試它們。在 [討論 #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享結果，或 [申請成為設計夥伴](https://calendly.com/tin-berri/litellm-auto-router-design-partner) 與 LiteLLM 團隊合作。

:::

您也可以從檔案型設定開始：

```yaml title="config.yaml"
model_list:
  - model_name: claude-haiku-4-5
    litellm_params:
      model: anthropic/claude-haiku-4-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-sonnet-5
    litellm_params:
      model: anthropic/claude-sonnet-5
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-fable-5-1-high
    litellm_params:
      model: anthropic/claude-fable-5-1
      api_key: os.environ/ANTHROPIC_API_KEY
      reasoning_effort: high

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        classifier_type: heuristic
        tiers:
          SIMPLE: claude-haiku-4-5
          MEDIUM: claude-sonnet-5
          COMPLEX: claude-fable-5-1-high
          REASONING: claude-fable-5-1-high
      complexity_router_default_model: claude-sonnet-5
```

完整參考請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。
