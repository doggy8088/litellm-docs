---
slug: autorouter-v2
title: "Auto Router v2：一個整合複雜度、語義與自適應路由的路由器"
date: 2026-07-13T12:00:00
authors:
  - krrish
description: "Auto Router v2 將 LiteLLM 的複雜度、語義與自適應路由器整合為單一路由器，搭配 LLM 分類器、關鍵字分層、多模型池與自適應 Thompson sampling。"
tags: [routing, complexity-router, semantic-router, adaptive, product]
hide_table_of_contents: false
---

:::info 可用性

Auto Router v2 隨 **v1.94.x** 釋出。最早的 dev 版本切版時間為 **2026-07-14 星期二**。建議與回饋： [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)。

:::

Auto Router v2 將複雜度、語義與自適應路由整合為單一 `auto_router/complexity_router`。現在只需一份設定即可涵蓋啟發式評分、LLM 分類、詞彙或語義關鍵字規則，以及以 Thompson sampling 抽樣的階層池。

這項推動來自社群。在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 中，使用者指出這三種路由策略都應該收斂成單一 Auto Router。使用可設定訊號與權重的單一路由器，能讓 API 保持簡潔，同時讓路由引擎在內部演進，而不是強迫您一開始就選定某種模式。

營運層面的另一半則來自 [discussion #32172](https://github.com/BerriAI/litellm/discussions/32172)：可預測性在可除錯性上勝過聰明作法。將能力類別對應到模型的固定、版本化映射，才能在事後回答「為什麼今天這個回應成本高了 4 倍」。

{/* truncate */}

## v2 新增了什麼 {#what-v2-adds}

| 功能                 | 先前                          | 之後                                                                                                                     |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 分類                 | 僅啟發式評分器                | 啟發式、LLM 分類器、詞彙或語義關鍵字規則 ([#32169](https://github.com/BerriAI/litellm/pull/32169), [#32859](https://github.com/BerriAI/litellm/pull/32859)) |
| 階層值               | 每個階層一個模型              | 單一模型、隨機選取池，或 Thompson 抽樣池 ([#32967](https://github.com/BerriAI/litellm/pull/32967), [#32947](https://github.com/BerriAI/litellm/pull/32947)) |
| 技術關鍵字           | 固定內建清單                  | `custom_technical_keywords` 附加而不替換 ([#32262](https://github.com/BerriAI/litellm/pull/32262))            |
| 決策記錄             | "keyword rule fired"            | `cause=literal_keyword_match \| semantic_keyword_match \| complexity_scorer` ([#32943](https://github.com/BerriAI/litellm/pull/32943)) |
| 別名 `litellm_params` | 靜默丟棄                      | 合併進傳出請求 ([#32974](https://github.com/BerriAI/litellm/pull/32974))                                    |
| 會話親和性           | 每一輪都重新分類               | 可選 `session_affinity`：將第一輪模型固定給該會話，略過重新分類 ([#33126](https://github.com/BerriAI/litellm/pull/33126)) |

## 一份設定，所有調整旋鈕 {#one-config-all-the-knobs}

```yaml
model_list:
  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      drop_params: true
      complexity_router_config:
        tiers:
          SIMPLE:    ["gpt-4o-mini", "claude-haiku-4-5"]   # random-pick pool
          MEDIUM:    gpt-4o                                 # single pin
          COMPLEX:   claude-sonnet-5
          REASONING: gpt-5.5

        # optional: LLM classifier instead of heuristic scorer
        classifier_type: llm
        classifier_llm_config:
          model: claude-haiku-4-5-20251001
          timeout_ms: 2000

        # optional: keyword rules, escalate to highest matched tier
        keyword_tier_rules:
          - keywords: ["hi", "hello", "thanks"]
            tier: SIMPLE
          - keywords: ["kubernetes", "k8s", "istio"]
            tier: REASONING
        semantic_keyword_matching: true
        embedding_model: voyage-3-5
        match_threshold: 0.5

        # optional: append to the built-in technical keyword list
        custom_technical_keywords: [kafka, redis, postgresql, udp, dns]

        # optional: Thompson-sample within the tier's pool
        adaptive: true

        # optional: pin a session to its first-turn model (preserves prompt cache)
        session_affinity: true
        session_affinity_ttl_seconds: 3600

      complexity_router_default_model: claude-sonnet-5
```

## 新元件說明 {#notes-on-the-new-pieces}

**LLM 分類器** 會經由同一個 `Router` 實例，因此憑證、預算與備援都會套用。逾時、內容為空或結構不符時，會退回啟發式評分器。

**關鍵字規則** 在評分器之前執行。多重命中會提升到最高階層（SIMPLE < MEDIUM < COMPLEX < REASONING），因此規則順序不會悄悄改變行為。語義比對使用 MAX 聚合（先前為 MEAN），因此單一強關鍵字命中不會被同階層的其他語句稀釋。

**Adaptive** 會將階層池轉為學習池。冷啟動請求只會在已分類的階層內抽樣，而不是直接收斂到最便宜的模型。回饋會歸因到實際服務前一輪的模型，即使這一輪無狀態路由選了不同的模型。

**Session affinity**（可選）會將某個會話的第一輪模型固定下來，並在後續輪次略過重新分類，因此該模型所對應的提供者端提示詞快取不會因為後續回合（例如「謝謝！」）原本會被分類到不同階層而失效 ([#33126](https://github.com/BerriAI/litellm/pull/33126))。TTL 預設為 3600s。`session_id` 來自請求中繼資料。

**Decision log** 會為每個請求輸出一行可 grep 的記錄：

```
ComplexityRouter: routing decision cause=complexity_scorer,      tier=SIMPLE,     score=-0.150, signals=['short (7 tokens)', 'simple (what is)'], routed_model=gpt-4o-mini
ComplexityRouter: routing decision cause=literal_keyword_match,  tier=REASONING,                                                                    routed_model=gpt-5.5
ComplexityRouter: routing decision cause=semantic_keyword_match, tier=REASONING,                                                                    routed_model=gpt-5.5
ComplexityRouter: routing decision cause=session_affinity_pin,                                                                                      routed_model=gpt-5.5
```

## 值得特別說明的修正 {#fixes-worth-calling-out}

`drop_params`、`cache_control_injection_points`，以及 auto router 別名本身設定的任何其他 `litellm_params`，過去在路由器選定階層時都會消失。現在它們會合併進傳出請求，而不會覆蓋呼叫端明確傳入的任何內容 ([#32974](https://github.com/BerriAI/litellm/pull/32974))。同一個 PR 也修正了一個 Anthropic `/v1/messages` 轉換為 Responses API `tool_choice` 結構的錯誤，該錯誤破壞了以 Bedrock 為基礎的複雜度路由器（由 @icsy7867 在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 回報）。

UI 現在有每個階層可用的 Test Connection ([#32950](https://github.com/BerriAI/litellm/pull/32950))，以及必填階層的內嵌驗證 ([#32978](https://github.com/BerriAI/litellm/pull/32978))。

## 試試看 {#try-it}

既有的複雜度路由器設定仍可正常運作。若要試用 v2，請在您現有的 `complexity_router_config` 中，為某個階層加入 `keyword_tier_rules`、`classifier_type: llm`、`adaptive: true`、`session_affinity: true`，或清單值。完整參考請見 [Auto Routing 文件頁面](/docs/proxy/auto_routing)。

## 接下來呢 {#whats-next}

**路由器外掛。** 來自 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)：一個管線，其中每個外掛都會接收路由上下文、擴充它，然後在 Auto Router 做出最終決定前將其傳遞下去。外掛不會取代路由器；它們會提供結構化訊號（分類、政策、候選項過濾器、分數），由 Auto Router 加以整合。

具體的端到端流程如下：

1. 使用者送出請求。
2. 語言外掛偵測到 `en`。
3. 領域分類器將其標記為 `coding`，信心值為 0.93。
4. 租戶政策將允許的提供者限制為 OpenAI 和 Anthropic。
5. 預算外掛移除超出該租戶成本上限的模型。
6. Auto Router 從已擴充的上下文中挑選最佳的剩餘模型。

設定草圖：

```yaml
router_settings:
  plugins:
    - name: language-detector
    - name: domain-classifier
      params:
        provider: openai/gpt-5-mini
    - name: budget-policy
      params:
        daily_limit: 100
    - name: tenant-policy
    - name: custom-python
      path: ./plugins/my_router.py
```

最初的工作已收錄於 [#32972](https://github.com/BerriAI/litellm/pull/32972)；接下來將支援 proxy 上的外掛，以及自訂外掛檔案。

**清單上也還有：**

- **備援鏈上的升級上限。** 針對每個請求設定升級次數上限，並在某個 key 沿著鏈條走了 N 次後加入冷卻時間，避免不良上游一路級聯成費用。
- **可歸因的決策。** 在每個回應上標記路由後的模型與路由表版本，並透過標準記錄整合匯出結構化決策追蹤（候選項、分數、備援、延遲）。

如果您在正式環境中執行 Auto Router 並遇到這些情況，請在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 留言。
