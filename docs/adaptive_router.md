# [BETA] 自適應路由器 {#beta-adaptive-router}

:::info

Beta 功能。請在 [Discord](https://discord.gg/wuPM9dRgDw) 或 [Slack](https://join.slack.com/t/litellmossslack/shared_invite/zt-3o7nkuyfr-p_kbNJj8taRfXGgQI1~YyA) 分享回饋。

:::

**需求：**具備 Postgres 資料庫的 LiteLLM Proxy。品質估計會儲存在 Postgres 中，並在啟動時載入——沒有資料庫時，路由仍可運作，但在重新啟動後會忘記所有學到的內容。

您有一個便宜的模型和一個昂貴的模型。您希望在足夠好的時候使用便宜的模型，而在真正重要時使用昂貴的模型——而不必把規則硬編碼，最後花上數月調整。

Adaptive router 會自動完成這件事。它會追蹤每種類型的請求（程式碼、寫作、分析等）哪個模型表現最好，並據此進行路由，依照您控制的權重在品質與成本之間取得平衡。

## 快速開始 {#quick-start}

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
    model_info:
      input_cost_per_token: 0.0000025
      adaptive_router_preferences:
        quality_tier: 3        # 1=budget, 2=mid, 3=frontier
        strengths: ["code_generation", "analytical_reasoning"]

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
    model_info:
      input_cost_per_token: 0.00000015
      adaptive_router_preferences:
        quality_tier: 2
        strengths: ["factual_lookup"]

  - model_name: my-router
    litellm_params:
      model: auto_router/adaptive_router
      adaptive_router_config:
        available_models: ["gpt-4o", "gpt-4o-mini"]
        weights:
          quality: 0.7   # raise this if quality complaints; lower if bill too high
          cost: 0.3      # must sum to 1.0 with quality
```

透過將 `model` 設定為您的 adaptive router 名稱來將請求路由到它：

```bash
curl -X POST {{baseURL}}/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "my-router",
    "messages": [
      {"role": "user", "content": "build me a python script that parses CSV"},
      {"role": "assistant", "content": "Here is a script using csv.DictReader..."},
      {"role": "user", "content": "now add error handling for missing files"},
      {"role": "assistant", "content": "Wrap the open() call in a try/except FileNotFoundError..."},
      {"role": "user", "content": "perfect, that worked. thanks!"}
    ]
  }'
```

回應會包含一個標頭，告訴您實際選中了哪個模型：

```
x-litellm-adaptive-router-model: gpt-4o
```

上面範例中的「thanks!」回合會觸發滿意度訊號——這就是讓 bandit 更新的方式。

## 調整成本與品質的取捨 {#tuning-cost-vs-quality}

`weights` 是您的主要調整手段：

| 目標 | quality | cost |
|---|---|---|
| 將成本降到最低，品質居次 | 0.3 | 0.7 |
| 平衡 | 0.5 | 0.5 |
| 以品質優先（預設） | 0.7 | 0.3 |
| 品質不可妥協 | 0.9 | 0.1 |

路由器會隨時間學習。對於每個模型前約 10 個請求，它會依賴您宣告的層級。之後，真實效能資料就會接手。

## 為每個請求強制最低品質層級 {#force-a-minimum-quality-tier-per-request}

如果某個特定請求無論成本都需要 frontier model，請傳遞這個標頭：

```
x-litellm-min-quality-tier: 3
```

您也可以透過請求中繼資料傳遞 `min_quality_tier`，而不是使用標頭。

## 正在學習什麼 {#whats-being-learned}

路由器會將每個請求分類為 7 種類型之一，並分別追蹤每個模型在各類型上的表現。對事實查詢很強但在程式碼上表現不佳的模型，會贏得事實型請求、輸掉程式碼請求——即使它整體更便宜也是如此。

| 類型 | 範例 |
|---|---|
| `code_generation` | "write me a Python sort function" |
| `code_understanding` | "explain what this function does" |
| `technical_design` | "how should I design this API?" |
| `analytical_reasoning` | "calculate the probability that..." |
| `writing` | "draft an email to my team about..." |
| `factual_lookup` | "what is the capital of France?" |
| `general` | anything else |

[**查看分類器程式碼**](https://github.com/BerriAI/litellm/blob/litellm_adaptive_routing/litellm/router_strategy/adaptive_router/classifier.py)

學習訊號的靈感來自 [Signals: Trajectory Sampling and Triage for Agentic Interactions](https://arxiv.org/pdf/2604.00356)。

## 檢視目前狀態 {#inspect-the-current-state}

```
GET /adaptive_router/{router_name}/state
```

會回傳每個模型、每種請求類型的目前品質估計。這對理解為什麼某個模型會或不會被選中很有幫助。

```json
{
  "routers": [
    {
      "router_name": "smart-cheap-router",
      "available_models": ["fast", "smart"],
      "weights": { "quality": 0.7, "cost": 0.3 },
      "cells": [
        {
          "request_type": "analytical_reasoning",
          "model": "fast",
          "quality_mean": 0.5,
          "samples": 0
        },
        {
          "request_type": "analytical_reasoning",
          "model": "smart",
          "quality_mean": 0.95,
          "samples": 0
        }
      ]
    }
  ]
}
```

`quality_mean` 是關鍵數值——它是路由器目前對該模型處理該請求類型能力的估計。`samples` 計算的是有多少筆真實觀察資料推動了先驗（從 0 開始；冷啟動先驗品質不計入）。

## 已知限制 {#known-limitations}

- 延遲不計分——較慢的模型仍可能因品質 + 成本而勝出
- 訊號是基於 regex，且偏向英文——沒有 LLM 評審
- 每個 cell 的觀察上限硬性為 200 筆；尚未有衰減機制
- 一旦某個模型在某個 session 中被選中，該 session 中其他模型的回合不會對學習做出貢獻
