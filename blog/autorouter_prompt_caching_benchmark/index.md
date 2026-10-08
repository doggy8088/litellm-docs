---
slug: auto-router-prompt-caching-benchmark
title: "Prompt 快取可與 Auto Router 搭配使用"
date: 2026-07-31T10:00:00
authors:
  - tin
image: ./hero.png
description: "對 auto-routing 最常見的疑慮是，切換模型會丟失您的 prompt 快取。我們在五個資料集上進行了測量，其中包括使用提供者自身快取計費的真實閘道流量，而答案是否定的。"
keywords: [prompt caching, auto router, llm cost savings, model routing, cache warming, anthropic prompt cache, litellm auto routing, prefix cache]
tags: [routing, complexity-router, caching, cost, benchmarks, engineering]
hide_table_of_contents: false
---

![Auto-Router 與 Prompt 快取：跨五個資料集測量](./hero.png)

**是的，您可以在 Auto-Routing 中使用 prompt 快取。** 兩者是相輔相成，而非彼此抵消。我們在五個資料集上進行了測量，其中兩個會回報提供者的快取實際做了什麼。

{/* truncate */}

:::info[🚀 協助塑造 Auto-Router]

搶先取得使用權，直接與 LiteLLM 團隊合作，並以您的正式環境流量影響產品藍圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計夥伴</a>

<br /><br />

已經在測試了嗎？請在 [討論串 #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享您的結果。

:::

## 結果 {#the-results}

- **Auto-routing 不會破壞 prompt 快取。** 在我們測量的每個資料集上，兩者都是相輔相成
- **比僅在單一模型上快取便宜 37% 到 69%**
- **真正的失敗模式正好相反。** 在關閉快取的情況下執行 router，成本大約會比對單一固定模型做快取 **高 4 倍**

| 評估 | 樣本 | Router + 快取，相較於僅快取 |
| --- | --- | --- |
| 模擬，一般聊天 ([WildChat-1M](https://huggingface.co/datasets/allenai/WildChat-1M)) | 30,769 個多輪對話 | **便宜 68.7%** |
| 模擬，開發者聊天 ([DevGPT](https://github.com/NAIST-SE/DevGPT)) | 1,011 個對話 | **便宜 46%** |
| 真實代理程式軌跡，提供者快取計費 | 95 個工作階段，8,174 次 API 呼叫 | **便宜 37.4%** |
| [TwinRouterBench](https://github.com/CommonstackAI/TwinRouterBench) 靜態軌道 | 81 個多步驟實例 | **便宜 44% 到 50%** |

## 測量方式 {#how-it-was-measured}

- **Router 分支：** 一個模型群組，四個層級。SIMPLE 到 `claude-haiku-4-5`，MEDIUM 到 `claude-sonnet-5`，COMPLEX 和 REASONING 到 `claude-opus-5`
- **基準分支：** 每個請求都送往單一前沿模型，並啟用 prompt 快取；這是最強、最貼近實務的基準，而不是冷啟動價格的稻草人
- **快取行為：** 從閘道支出記錄與代理程式軌跡上的 `usage.cache_read_input_tokens` 和 `cache_creation_input_tokens` 讀取；其餘三個分支則以模型化方式處理
- **輪次分類：** 一個 window function 依工作階段與模型分區，將每一輪標記為停留在某模型、首次造訪某層級，或回到先前已使用過的模型

## 為什麼 auto-routing 不會破壞 prompt 快取 {#why-auto-routing-doesnt-break-prompt-caching}

**當工作階段切回先前使用過的模型時，有 99.3% 的時間該模型的快取仍是熱的。** router 會在快取過期前很久就回來，因此切換並不等於逐出。

我們在來自實際 LiteLLM 閘道流量的 **4,684 次真實切回** 上測量了這點。

| 提供者快取狀態 | 熱快取的模型回切比例 |
| --- | --- |
| 5 分鐘 TTL 時仍為熱的 | **97.4%** |
| 1 小時 TTL 時仍為熱的 | **99.3%** |
| 已超過 TTL、也就是切換可能造成影響的那些 | **2.6% / 0.7%** |

## 我們嘗試了背景快取暖機器。但不值得 {#we-tried-a-background-cache-warmer-it-wasnt-worth-it}

如果切換真的會讓快取閒置，一個重新播放工作階段前綴的背景更新器會是解法。我們先為它建立了測量方式。

**只有 4% 的快取失敗可由背景快取暖機器避免。** 其餘不是發生在快取仍有效時，就是發生在模型閒置太久、維持熱快取的成本高於它所避免的寫入成本之後。

| 流量 | 典型前綴 | 暖機對總成本的影響 |
| --- | --- | --- |
| 一般聊天 | ~1,700 tokens | **貴 0.10%** |
| 代理程式軌跡，間隔數小時 | 大型 | **貴 0.63%** |
| 我們的閘道，agentic | ~190,000 tokens | **便宜 0.9%** |

暖機的效益大約只有正負兩個百分點：對於具有大型穩定前綴的長工作階段而言是一項窄幅優化，而不是攸關部署是否能節省成本的關鍵。

## 在您自己的流量上查看 {#see-it-on-your-own-traffic}

Auto-Router Benchmarks 分頁現在會根據提供者自身的使用量 payload，逐個 router 報告 prompt 快取行為：

- **命中率**，依輪次是停留在某模型、首次造訪某層級，或回到先前使用過的模型來拆分
- **過期未命中占比**，將回切未命中縮小到那些其層級已超過 TTL 而閒置的情況
- **可由暖機挽回的比例**，所有未命中中可由更新器避免的部分
- **暖機成本與淨估計**，以美元計算
- **涵蓋率**，因此若因關閉 response logging 而導致命中率偏低，也不會被解讀為冷快取

```
GET /auto_router/benchmarks?start_date=2026-07-01&end_date=2026-07-31
```

## 試試看 {#try-it}

:::info

將用戶端指向啟用 prompt 快取的 auto-router，然後將 Auto-Router Benchmarks 分頁與您自己的流量進行比對。請在 [討論串 #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享數字或問題。若要直接與我們一起進行這項工作，請 [申請成為設計夥伴](https://calendly.com/tin-berri/litellm-auto-router-design-partner)。

:::

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
  - model_name: claude-opus-5
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
        classifier_type: heuristic
      complexity_router_default_model: claude-sonnet-5
```

每個回應都會帶有 `x-litellm-model-name` 與 `x-litellm-response-cost`，而提供者的快取 token 計數則會出現在支出記錄中。完整參考資訊請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。
