---
slug: jev-auto-router-benchmark
title: "JEV 分類器：速度比 Haiku 快 5.43 倍，成本降低 96%"
date: 2026-09-20T10:15:00
authors:
  - moe
description: "在我們的 AI Gateway 基準測試中，JEV 依據中位延遲分類請求的速度比 Haiku 快 5.43 倍。探索設定、成本節省與方法。"
tags: [routing, complexity-router, engineering, ai-gateway]
hide_table_of_contents: true
---

*最後更新：2026 年 9 月 18 日*

Auto Router 在選定的模型能回應之前，必須先為分類付費。在我們的基準測試中，TypeSafe JEV 分類請求的速度**比 Haiku 快 5.43 倍**，比較的是分類器中位延遲：**126.81 ms 對 688.40 ms**。依登錄表定價的分類器成本**低 96.12%**，在標題中四捨五入為 96%

JEV 與我們基準測試中預期的層級相符率為 95.00%，Haiku 則為 73.75%。此結果取決於此處使用的提示、層級定義、指示與上下文。預期層級是以合成提示撰寫，未經獨立審查。此比較不代表一般分類準確度，亦不代表最終答案的品質

{/* truncate */}

## AI Gateway 必須為路由決策付費 {#the-ai-gateway-has-to-pay-for-the-routing-decision}

將問候語與複雜的除錯請求分類，可讓您把它們送往不同模型。通用 LLM 可以做出該決策，但在完成開始前，其網路往返、輸入 token 與結構化輸出會增加延遲與成本

我們將既有的 LLM 分類器路徑與 `classifier_type: jev` 進行比較，使用相同的撰寫層級評分標準與開場指示。JEV 使用 TypeSafe System One Choice 評估。它會回傳帶有信心與機率的層級選擇，而既有的 Auto Router 則從該層級中選擇一個模型。層級池、備援與完成路徑仍維持在同一個路由器中

我們測量的問題範圍很窄：每個分類器要多快、多便宜地重現我們為這些提示標註的標籤？我們沒有評分生成答案，也沒有建立一般性的 LLM 品質等同性

## 我們測量了什麼 {#what-we-measured}

基準測試於 **2026 年 9 月 18 日 UTC** 執行，`jev-latest` 先解析為 **`jev-1.13.0`**，接著固定。比較模型是 **`anthropic/claude-haiku-4-5-20251001`**。每個分類器都以相同的 80 個案例執行三次，因此每個分類器共有 240 次量測請求

| 指標 | JEV | Haiku |
| --- | ---: | ---: |
| 與作者標註的預期層級相符 | 228/240，95.00% | 177/240，73.75% |
| 分類器平均延遲 | 138.38 ms | 720.71 ms |
| 分類器 p50 延遲 | 126.81 ms | 688.40 ms |
| 分類器 p95 延遲 | 231.16 ms | 896.94 ms |
| 量測到的最大延遲 | 401.26 ms | 1,914.98 ms |
| 240 次請求的登錄表定價成本 | $0.007706664 | $0.198534 |
| HTTP 200 回應 | 240/240 | 240/240 |
| 提供者錯誤 / 逾時 / 備援決策 | 0 / 0 / 0 | 0 / 0 / 0 |

所有量測嘗試都成功，因此所有嘗試與成功請求的延遲統計數值相同。層級錯誤的請求仍會計入延遲與成本總計

### 我們如何計算快 5.43 倍 {#how-we-calculate-543x-as-fast}

標題比較的是**240 次 JEV 請求的中位數，與 240 次 Haiku 請求的中位數**。使用未四捨五入的量測值：

```text
p50 speed ratio = Haiku_p50 / JEV_p50
                = 688.395634 ms / 126.814470 ms
                = 5.43x
```

這是彙總統計量的比值，不是每個請求比值的平均。用相同的計算方式可得 **在 p95 下快 3.88 倍**（231.16 ms 對 896.94 ms），以及**以平均延遲計算快 5.21 倍**（138.38 ms 對 720.71 ms）。這些比值衡量的是分類時間，不是端到端完成速度或負載下的輸送量

| 比較 | 估計值 | 95% 群集自助法區間 |
| --- | ---: | --- |
| p50 速度比 | 5.43x | 5.20x 至 5.71x |
| p95 速度比 | 3.88x | 2.94x 至 4.78x |
| 登錄表定價的分類器成本節省 | 96.118% | 95.973% 至 96.266% |
| 預期層級符合率的配對差異 | 21.25 個百分點 | 12.92 至 30.42 個百分點 |

### 符合預期層級告訴我們什麼 {#what-matching-the-expected-tiers-tells-us}

符合率會計算與固定、作者撰寫的層級標籤完全相符的次數。JEV 的 95% 區間為 **90.00% 至 98.75%**，Haiku 的則為 **64.16% 至 82.92%**。標籤與提示都來自同一位作者，未經獨立標註或盲審

層級選擇取決於使用者的請求與分類器的指示。不同的請求組合、評分標準、層級邊界或對話歷史，都可能改變任一分類器的結果。我們測試的是一個固定配置，沒有獨立調整任一提示，也沒有量測其對替代指示的敏感度。符合這些標籤也不代表所選完成模型能妥善回應請求

兩個分類器彼此一致的次數為 **189/240 次，也就是 78.75%**，區間為 **69.58% 至 87.08%**。一致性不考慮任一分類器是否與作者標籤相符

| 作者撰寫的層級、每個案例 20 個、每個分類器 60 次請求 | JEV 符合率 [95% 區間] | Haiku 符合率 [95% 區間] | 分類器之間的一致性 |
| --- | --- | --- | ---: |
| SIMPLE | 60/60，100% [100%，100%] | 60/60，100% [100%，100%] | 100% |
| MEDIUM | 51/60，85% [70%，100%] | 23/60，38.33% [18.33%，60%] | 53.33% |
| COMPLEX | 57/60，95% [85%，100%] | 48/60，80% [60%，95%] | 85% |
| REASONING | 60/60，100% [100%，100%] | 46/60，76.67% [58.33%，93.33%] | 76.67% |

經驗區間 100% 至 100% 表示該抽樣子集中每個案例都相符。這不代表在未見過的提示上具有完美準確度。共有 **80 個獨立案例群集**，且重複次數彼此相關

JEV 一致地將四個案例分派到比作者標籤更低的層級：M07、M13 與 M15 從 MEDIUM 變為 SIMPLE，而 C10 則從 COMPLEX 變為 MEDIUM。Haiku 的不一致也都將層級往下調：37 筆 MEDIUM 觀察值變為 SIMPLE、12 筆 COMPLEX 變為 MEDIUM、14 筆 REASONING 變為 COMPLEX。最大的差異出現在主觀性的 MEDIUM 邊界

| 子集 | 每個分類器的案例 / 請求數 | JEV 符合率 | Haiku 符合率 | 分類器之間的一致性 |
| --- | --- | ---: | ---: | ---: |
| 短 | 40 / 120 | 97.50% | 73.33% | 75.83% |
| 長 | 16 / 48 | 87.50% | 62.50% | 75.00% |
| 後續追問 | 8 / 24 | 100% | 87.50% | 87.50% |
| 工具上下文 | 8 / 24 | 100% | 83.33% | 83.33% |
| 邊界模糊 | 8 / 24 | 87.50% | 75.00% | 87.50% |

邊界子集的符合率差異為 12.50 個百分點，且 **0 至 37.50 個百分點區間**包含 0。JEV 在長案例中的預期層級符合率低於短案例。這兩點在為您自己的評估選擇提示時都很重要

### 各層級延遲 {#per-tier-latency}

| 作者撰寫的層級 | JEV p50 | Haiku p50 | JEV p95 | Haiku p95 |
| --- | ---: | ---: | ---: | ---: |
| SIMPLE | 127.78 ms | 678.22 ms | 243.44 ms | 897.53 ms |
| MEDIUM | 128.15 ms | 690.80 ms | 215.59 ms | 844.70 ms |
| COMPLEX | 126.89 ms | 694.19 ms | 198.34 ms | 874.73 ms |
| REASONING | 120.78 ms | 696.01 ms | 231.68 ms | 1,001.60 ms |

完整的各層級與各重複次數延遲、成本、信賴區間、混淆矩陣與不一致情形，請見可下載的 `metrics.json`

## 成本節省止於分類器邊界 {#cost-savings-stop-at-the-classifier-boundary}

成本比較使用觀察到的 token 乘以已封存的 LiteLLM 登錄表價格。這是**分類器成本**，不包含完成模型、嵌入、暖機與評估裁判

| 量測用量與登錄表費率 | JEV | Haiku |
| --- | ---: | ---: |
| 輸入 token | 183,492 | 186,519 |
| 輸出 token | 12,897 | 2,403 |
| 每百萬 token 的輸入價格 | $0.042 | $1 |
| 每百萬 token 的輸出價格 | $0 | $5 |
| 每次分類的平均成本 | $0.0000321111 | $0.000827225 |

因此節省金額為 `100 * (1 - 0.007706664 / 0.198534) = 96.118%`。每個量測回應都已依封存登錄表獨立重新計價，且與分類器回報的成本一致。價格為此次執行所擷取的登錄表值。未檢查提供者發票、稅金、折扣與方案權益

修正後執行中被排除的解析與暖機請求在這些價格下成本為 $0.002478554。較早的一次設定解析請求則另行保留。它們是 240 次請求比較之外的額外負擔

## 在既有 Auto Router 中設定 JEV {#configure-jev-in-the-existing-auto-router}

在 proxy 的伺服器環境中佈建 `TYPESAFE_API_KEY`。`TYPESAFE_API_BASE` 為可選，且預設為 `https://api.typesafe.ai`。將提供者憑證保留在伺服器上，並讓用戶端以 LiteLLM 虛擬金鑰呼叫路由器

將此項目加入 `model_list` 既有的層級部署旁，並把層級值替換成您部署的模型名稱：

```yaml title="config.yaml"
- model_name: jev-router
  litellm_params:
    model: auto_router/complexity_router
    complexity_router_default_model: {{openai_large}}
    complexity_router_config:
      tiers:
        SIMPLE: {{openai_small}}
        MEDIUM: {{openai_large}}
        COMPLEX: {{anthropic}}
        REASONING: {{anthropic_large}}
      classifier_type: jev
      jev_classifier_config:
        model: jev-latest
        timeout_ms: 3000
        circuit_breaker_enabled: true
        circuit_breaker_cooldown_seconds: 30
      classifier_fallback: default_model
      classifier_context_window_size: 3
      classifier_context_budget_chars: 8000
      classifier_context_include_assistant_turns: false
```

這個部署範例使用內建的 tier 標準、三秒截止時間與 circuit breaker。它明確選擇 default-model 備援。該基準測試使用共享的自訂評分標準、十秒截止時間、assistant context，並停用 breaker，以比較每一次量測嘗試

在儀表板中，於 **Models + Endpoints** 下建立或編輯 Auto Router，然後在 **Classification Method** 下選取 **JEV Classifier**。表單會顯示 model、timeout、circuit breaker、context 與 fallback 設定。自訂 **JEV Instructions** 會取代內建 instructions，並遵循 Enterprise custom-classifier policy。[設定指南](/docs/auto_router/setup#jev-classifier-typesafe-ai)涵蓋完整的建立、測試與編輯流程

JEV 會在一個 System One `state` 中接收目前請求與 classifier context，並搭配一個 `questions.tier` Choice question。內建 tiers 使用隨附的 criteria。使用 `tier_definitions` 時，自訂 descriptions 會成為 Choice criteria。classifier context 的預算會限制前幾輪文字，而目前請求與擷取出的 system text 則位於其外

如同 LLM classifier，JEV 預設會傳送最多三輪先前使用者回合，且在 8,000 字元預算內。該歷史記錄會送往已設定的 TypeSafe endpoint。設定 `classifier_context_window_size: 0` 可省略它，包括在升級既有 JEV router 時

## 具生產等級 AI Gateway 中的失敗處理 {#failure-handling-in-a-production-grade-ai-gateway}

可靠的 AI Gateway 需要在 classifier 無法回應時有明確的路由。JEV 會在 timeout、HTTP failure、malformed response、unknown tier 或 open circuit 時使用既有 fallback。內建 tiers 預設為 heuristic fallback。設定 `classifier_fallback: default_model` 會使用已設定的 default，而自訂 tiers 可以選擇 `fallback_tier`

為了讓路由在 classifier timeout 下保持韌性，啟用的 circuit breaker 會在辨識到 timeout 後的 30 秒預設 cooldown 期間跳過 JEV 呼叫。之後的一個請求會探測復原情況。成功會將其關閉，而失敗會再次開始 cooldown。該狀態僅限於單一程序中的 router instance，因此不會在 workers 之間協調 provider 負載。closed 狀態下的非 timeout 錯誤會直接 fallback，而不會打開 circuit

所提供的即時 gateway 證據使用了真實的本機 proxy、PostgreSQL 與 provider calls。正常 completion 與 Test Routing 均成功。另一個 1 ms deadline 設定產生了成功的 completion，且記錄了 `default_model_fallback`。logs 並未保留 exception subtype，且沒有任何 JEV usage 回傳該次取消結果，因此 provider 是否收到或計費仍無法驗證

此 gateway 檢查中的所有下游 tier aliases 都使用相同的 Haiku model。這證明了 tier selection 與執行，但沒有衡量不同 completion models 帶來的品質或節省。streaming、tool-call completions、自訂 tier 名稱、所有 authorization roles 與 multi-worker accounting 都不在此證明範圍內

### Test Routing 可能會花錢 {#test-routing-can-spend-money}

Test Routing 會在 classification 後停止，不會向所選 model 傳送 completion。JEV classification 仍可能產生費用。Test Connection 另外會探測 model dependencies，並檢查 JEV 結果確實來自 JEV 而非 fallback

在所提供的 gateway 檢查中，Test Routing 保存了一筆 classifier row，費用為 **$0.000018186**。正常 completion 則保存了一筆 **$0.000018060** 的 classifier row 與一筆 **$0.000064000** 的下游 row。該 completion 的 routing metadata 帶有 classifier 成本以供歸因，但其支出仍是分開的

在會計上，請將已儲存的 row 支出只加總一次。再次加入 `routing_decision.classifier_cost` 會讓 classifier 被重複計算。成功的 JEV 決策會包含已解析的 classifier model、probabilities、confidence，以及可用時的 registry-priced cost。若缺少 usage 或 pricing，則 cost 為未知。即使一個可用的 HTTP response 之後驗證失敗，仍可能被記錄，因此在對帳 fallback 流量時，請檢查 classifier 支出 rows

JEV 以 `typesafe/<configured model>` 與 `evaluation` role 參與 dependency authorization。受限制的呼叫者需要能存取其所呼叫的 dependencies。團隊成員管理請求無法覆寫 provider key 或 base URL。精確設定與計費行為請參閱[設定參考](/docs/proxy/auto_routing#jev-classifier)

## 方法與重現 {#methodology-and-reproduction}

語料庫與協定已在 **22:18:53 UTC** 鎖定，早於 provider calls。量測呼叫大約在 **22:21:05 到 22:24:32 UTC** 之間執行。每個 tier 有 20 個案例，共 40 個短案例、16 個長案例、8 個後續案例、8 個 tool-context 案例與 8 個邊界案例。每個案例都有撰寫的理由說明

兩條正式 classifier 路徑都接收相同的撰寫評分標準與開場 instructions。SIMPLE 涵蓋查找與機械式工作，MEDIUM 涵蓋例行起草與本地化程式碼，COMPLEX 涵蓋耦合的技術工作，而 REASONING 涵蓋明確證明、具理由的最佳化，以及具有衝突目標的決策。它們的 wire formats 不同：LLM 路徑保留其信任邊界與 structured-output wrapper，而 JEV 使用 Choice question。兩者的 prompt 都未經獨立調校

| 設定 | 值 |
| --- | --- |
| 重複與順序 | 三次重複，每次以 seed 亂序，對每對案例交替採用 JEV-first 與 Haiku-first |
| Seed | `20260918` |
| 並行度 | `1` |
| 截止時間 | 兩個 classifier 皆為 `10000` ms |
| 重試 / circuit breaker | 零次重試 / 已停用 |
| 備援 tier | REASONING |
| Context | 三輪、總計 8,000 字元、每輪 4,000 字元，包含 assistant 回合 |
| 排除的設定 | 修正後執行中的一個 model-resolution call 與四對 warmup pairs |
| 抽樣設定 | 現有 classifier 預設值 |
| 快取 | 已停用 LiteLLM response caching，且未使用 provider prompt-cache directives |
| 時序 | 生產 `ComplexityRouter.aclassify` 附近的實際時間 |
| 不確定性 | 10,000 個 percentile-bootstrap 重新抽樣整個案例，保留兩個 classifier 與所有重複 |

對稱的 loopback HTTP relay 轉送了真實的 provider requests，並保留已去識別化的 request/response bodies，不含 authorization headers。時序包含本機 relay、client、network 與 provider work。Haiku 回報零 cache-read 與 cache-creation tokens。JEV 未揭露 cache usage，而 provider 內部快取未知。client 與 provider regions 也未知

分位數使用線性插值。bootstrap 會重新抽樣案例，將重複觀測保留在一起，而不是把 240 次呼叫視為獨立 prompts。這些區間描述的是此語料庫與執行結果。它們不涵蓋作者偏差、其他地區、持續負載、rate limits、cold starts 或其他帳戶

[下載凍結的原始結果與重現腳本](/benchmarks/jev-live-evidence-20260918.tar.gz)。壓縮檔包含 `cases.jsonl`、`protocol.json`、`attempts.jsonl`、已去識別化的 `wire.jsonl`、`metrics.json`、擷取的 registry、環境版本、gateway 證據、設定失敗與雜湊清單

```bash
curl -fL https://docs.litellm.ai/benchmarks/jev-live-evidence-20260918.tar.gz \
  -o jev-live-evidence-20260918.tar.gz
echo "c2653861ab4cf591e902d4d62d55078187e4c66ad5845b5cf5b023d5f427fd7f  jev-live-evidence-20260918.tar.gz" | sha256sum -c -
tar -xzf jev-live-evidence-20260918.tar.gz
cd jev-benchmark
sha256sum -c SHA256SUMS
python analyze.py
```

離線分析需要 Python 與 Pydantic，如壓縮檔中的環境記錄所列。其 README 提供鎖定倉儲的設定與重新發起付費 provider calls 的命令。請使用新的執行目錄，因為 runner 會拒絕覆寫歷史嘗試。未來的 `jev-latest` resolution 可能產生不同的 model，因此需要新的實驗與明確的 pricing-analysis 更新

量測的樹狀結構為 `9dce43d6a0562a4926c39b1bacf7e9a1feac1170`，由 base `1d91fc232d20a434a86323506a1303935b9c684f`、budget change `b9e5bb3abb0f2f0ddc06dcaf9edb63563cac2a2a` first，以及 integration `8e5f43f45897fc72612aac53a690fa573ce029cd` second 重建而成。這可識別受測組合，而不暗示已發布版本

| 凍結的構件 | SHA256 |
| --- | --- |
| 語料庫 | `dc85aa66fcab982a2af812a46c6bcd17e0e2a764c2e0c921fb811ce0ce4f31ce` |
| 協定 | `27d564fa022d29d8d9dd9c1a905fbf9a92695a138271f59d1174e7b7c49c4927` |
| Registry | `529638485889e5499ddb631f05a7fa58c7aaa25ebddfea8b5152d6eca77b1d2b` |

第一個 harness 設定結合了不相容的自訂 prompt 欄位，並在量測呼叫前停止。前兩個 gateway 設定也使用了無效或放錯位置的 fallback 設定。其證據另行保留，包括第一輪隱式選取的 MEDIUM 預設值。在呼叫開始後，沒有任何量測案例被移除或重新標記

## 重點整理 {#key-takeaways}

- 在這 80 個作者撰寫的案例中，JEV 依中位延遲的分類速度比 Haiku 快 5.43 倍，依 p95 則快 3.88 倍
- 在此 prompt 組與設定下，預期層級的匹配率為 95.00%，相較之下為 73.75%；分類器之間的一致率為 78.75%。未測量下游答案品質
- 依登錄檔定價的分類器成本降低了 96.118%。總應用程式成本與提供者帳單需要另外測量
- JEV 使用現有 Auto Router 的上下文、層級池與備援，並搭配程序內本地 timeout breaker 及分開的分類器支出記錄
- 在變更正式環境的路由政策之前，請先評估您自己的 prompts 與 completion 品質

## 常見問題 {#frequently-asked-questions}

### 這是否證明了 LLM 品質的分類？ {#does-this-establish-llm-quality-classification}

這證明了在此資料集上，與我們撰寫的標籤相比，其與這個 Haiku 設定的一致率更高。兩個分類器都依賴它們收到的請求、評分準則與上下文。這些標籤未經獨立審查，而且重複呼叫不會產生新的獨立案例。若要做更廣泛的品質主張，請以獨立審查的標籤評估具代表性的保留流量，比較指令變體，並使用 [shadow evaluation](/docs/auto_router/evaluate) 來評分最終答案

### 5.43x as fast 是什麼意思？ {#what-does-543x-as-fast-mean}

Haiku 的中位分類時間除以 JEV 的中位分類時間為 5.43：688.40 ms 對 126.81 ms。標題描述的是這個實際測得的分類速度比。它不代表端到端完成速度或負載下的吞吐量

### 如果 TypeSafe 無法使用會怎樣？ {#what-happens-if-typesafe-is-unavailable}

已設定的備援會選擇下一條路由路徑，而可識別的分類逾時會開啟本地 circuit breaker。所選的 completion 提供者仍必須成功。取消不代表上游請求未被計費

### JEV 在 LiteLLM OSS 或 Enterprise 中可用嗎？ {#is-jev-available-in-litellm-oss-or-enterprise}

內建 JEV 分類可在不需要 Enterprise 授權的情況下使用，且適用與內建 LLM 分類器相同的政策。自訂 JEV 指令與自訂層級定義使用現有的 Enterprise 自訂分類器能力。TypeSafe 提供者費用與 LiteLLM 授權分開計算

## 結論 {#conclusion}

在這項比較中，JEV 依中位延遲的分類速度比 Haiku 快 5.43 倍，且登錄檔定價成本更低，與作者撰寫的預期層級也更一致。對 Enterprise AI Gateway 部署與 OSS 部署皆然，下一步是測試真實 prompts、為產生的答案評分，並將備援流量納入支出核算。請從 [JEV 設定指南](/docs/auto_router/setup#jev-classifier-typesafe-ai) 與 [在您的流量上評估](/docs/auto_router/evaluate) 開始

## 推薦閱讀 {#recommended-reading}

- [JEV Auto Router 設定](https://docs.litellm.ai/docs/auto_router/setup#jev-classifier-typesafe-ai)
- [Auto Router 設定參考](https://docs.litellm.ai/docs/proxy/auto_routing#jev-classifier)
- [TypeSafe System One passthrough](https://docs.litellm.ai/docs/pass_through/typesafe)
