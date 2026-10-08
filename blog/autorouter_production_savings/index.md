---
slug: auto-router-production-savings
title: "線上正式部署回報 51% 成本節省"
date: 2026-08-10T10:00:00
authors:
  - tin
description: "一位 LiteLLM 客戶將 Auto Router 推廣到正式環境中的 450+ 位使用者，並分享了四個月的數據：272,876 次請求、7.08 億個 tokens，以及相較於全旗艦基準節省的 $12,249。"
image: ./hero.png
keywords: [auto router, llm cost savings, model routing, complexity router, production llm costs, litellm auto routing, llm gateway, cheaper llm inference]
tags: [routing, complexity-router, cost, case-study, engineering]
hide_table_of_contents: false
---

您可以預期從第一天起使用 Auto Router 大約可減少 40% 的成本，隨著 tier maps 的調整還會更多。我們的一位正式環境使用者分享了他的統計數據，展示在大規模下會是什麼樣子。

他們將 Auto-Router 部署到 dev、staging 和 prod 執行個體中的 450+ 位使用者，並節省了 **$12,249，涵蓋 270k+ 次請求**。

![正式流量記錄到使用 Auto-Router 可節省 51% 成本](./hero.png)

{/* truncate */}

:::info[🚀 協助塑造 Auto-Router]

取得搶先存取、直接與 LiteLLM 團隊合作，並用您的正式流量影響產品藍圖。

<a className="button button--primary button--lg" href="https://calendly.com/tin-berri/litellm-auto-router-design-partner">申請成為設計合作夥伴</a>

:::

## 主要發現 {#key-findings}

- **帳單減半。** 在原本會花費 $23,985 的旗艦模型支出中節省了 $12,249，減少 51.1%
- **95% 的請求從未需要旗艦層級。** 綜合成本為每 100 萬 tokens $1.66，而旗艦模型為每 100 萬 $3.39
- **節省率持續上升**，從第一個完整月份的 42.9% 提升到 8 月的 60.7%，因為團隊調整了 tier maps
- **他們的應用程式沒有任何變更。** 使用者仍然呼叫同一個模型名稱，而路由器自行挑選層級

| | |
| --- | --- |
| 經由 auto-routers 的請求 | 272,876 |
| Tokens | 7.08 B |
| 不同的終端使用者 | 450+ |
| 期間 | 2026-04-15 至 2026-08-09 |
| **實際支出** | **$11,736** |
| 若每個請求都送到最高層級的成本 | $23,985 |
| **節省** | **$12,249 (51.1%)** |

95% 這個數字就是整個核心論點。每二十個請求中有十九個不需要最大模型，而且沒有人需要手動決定。

## 三個路由器，三個模型家族 {#three-routers-three-model-families}

Auto-Router 可跨 Anthropic、Gemini 和 GPT 運作，因此他們為每個模型家族各跑一個複雜度路由器，並讓使用者選擇家族而不是模型。

主要發現：

- 絕對節省最多的是最繁忙、也最昂貴的路由器
- GPT 家族（`gpt-auto-latest`）在旗艦層與便宜層之間記錄到最大的相對節省

| 路由器 | 請求 | 支出 | 節省 | 節省率 |
| --- | --- | --- | --- | --- |
| `claude-auto-latest` | 109,675 | $8,997 | $7,951 | **46.9%** |
| `gemini-auto-latest` | 90,294 | $1,327 | $1,280 | **49.1%** |
| `gpt-auto-latest` | 72,906 | $1,412 | $3,019 | **68.1%** |

## 每個月都更好 {#it-got-better-every-month}

隨著 tier maps 越來越成熟，節省率仍在持續上升。

| 月份 | 節省 | 節省率 |
| --- | --- | --- |
| 2026-05 | $2,282 | 42.9% |
| 2026-06 | $3,274 | 50.0% |
| 2026-07 | $4,917 | 53.7% |
| 2026-08（截至 9 日） | $1,769 | **60.7%** |

- 第一個月就已回收 43%，這就是安裝後即可放著運作的數字
- 到第四個月時已達到 **60.7%**
- 差異來自調整。隨著團隊逐漸了解哪些提示屬於哪個層級，他們便調整了 maps

第一天的價值是真實存在的，而且會持續累積。

## 這是如何測量的 {#how-it-was-measured}

這是正式環境流量，而不是精心挑選的基準測試。450+ 位真實使用者，包含 dev 和 staging 在內的每個環境，以及所有因此而來的雜亂流量，持續四個月而非短短一個下午，而且完全沒有任何提示詞篩選；使用者輸入什麼，就路由什麼。

測量方法和數字一樣重要，所以完整說明如下。

- 數字直接來自 **`LiteLLM_SpendLogs`**，沒有抽樣，也沒有估算
- 每一列都記錄所請求的 `model_group`、路由器 **實際** 提供的模型，以及完整的 token 分拆：新輸入、快取讀取、快取寫入、輸出
- 對於每個請求，都會以該路由器的 **REASONING 層級模型** 重新計價相同的 tokens，並使用相同的快取讀寫拆分
- 這個重新計價就是反事實，也就是「如果我們一直都呼叫旗艦模型會怎樣」
- 價格來自 **相同載入的 LiteLLM 成本對照表**，而這份對照表產生了實際支出，因此兩邊都是可直接比較的 USD 列表價格
- 在這段期間內旗艦價格沒有變動（opus $5/$25、gemini pro $2/$12、gpt flagship 每 100 萬 $5/$30），因此基準不需要任何隨時間變動的假設

有兩點注意事項需要和這個數字一起看：

1. **這是模型，不是 A/B 測試。** 它假設旗艦模型會輸出相同數量的輸出 tokens。旗艦模型通常會輸出更多，因為有 reasoning tokens，所以 51% 是保守下限，而不是上限
2. **價格是來自成本對照表的 USD 列表價格**，不是客戶的實際帳單金額

## 設定 {#the-config}

以下是他們部署的架構，每個模型家族一個路由器：

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

  - model_name: claude-auto-latest
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    claude-haiku-4-5
          MEDIUM:    claude-haiku-4-5
          COMPLEX:   claude-sonnet-5
          REASONING: claude-opus-5
      complexity_router_default_model: claude-haiku-4-5
```

請注意，SIMPLE 和 MEDIUM 都指向最便宜的模型，而不是再加倍指向旗艦模型，這也就是 95% 低於旗艦模型占比的主要來源。旗艦模型仍保留給 REASONING 層級，而這也是反事實計價所對照的層級。

將用戶端指向 `claude-auto-latest`，每個回應都會帶有 `x-litellm-model-name` 和 `x-litellm-response-cost`，這正是本研究所採用的同一套儀器化方式。包含分類器與層級邊界設定的完整參考資料，請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。

## 試試看 {#try-it}

:::info

將代理程式指向 auto router，並在您的實際工作負載上與目前的單一模型比較。請在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享數據或問題。如要直接與我們一起進行，請 [申請成為設計合作夥伴](https://calendly.com/tin-berri/litellm-auto-router-design-partner)。

:::
