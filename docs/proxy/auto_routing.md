import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 自動路由 {#auto-routing}

一個用於複雜度、語意與自適應路由的單一路由器。以啟發式、LLM 分類器，或詞彙／語意關鍵字規則來分類每個請求，然後將其路由到固定模型、隨機池，或依層級使用 Thompson 抽樣的池。

:::info 可用性

隨 **v1.94.x** 發布。最早的開發版釋出時間為 **2026-07-14 星期二**。建議與回饋：[discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)。

:::

## 何時使用 {#when-to-use}

| 功能         | 語意自動路由器（已棄用） | 自動路由（本頁）                                                           |
| ------------ | ------------------------ | -------------------------------------------------------------------------- |
| 分類器       | 對語句進行 embedding 比對 | 啟發式、LLM 分類器，或詞彙／語意關鍵字規則                                 |
| 層級值       | 單一模型                 | 單一模型、隨機池，或自適應（Thompson 抽樣）池                               |
| 延遲         | ~100-500ms（embedding 呼叫） | 次毫秒級（啟發式／關鍵字）或一次小型分類器呼叫（LLM）                       |
| 工作階段固定 | 否                       | 可選 `session_affinity`，以請求中繼資料的 `session_id` 為鍵 |
| 記錄         | 無路由原因訊號           | 每次決策都有 `cause=` 標記（scorer、literal、semantic、session_pin、LLM） |
| 最適合       | 基於意圖的路由           | 成本／品質分層、混合規則＋分類器設定、prompt cache 固定 |

[語意自動路由器](./auto_routing_semantic.md) 已棄用，但既有設定仍可運作。

## 快速開始（Proxy） {#quick-start-proxy}

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params: {model: openai/gpt-4o-mini, api_key: os.environ/OPENAI_API_KEY}
  - model_name: gpt-4o
    litellm_params: {model: openai/gpt-4o, api_key: os.environ/OPENAI_API_KEY}
  - model_name: claude-sonnet-5
    litellm_params: {model: anthropic/claude-sonnet-5, api_key: os.environ/ANTHROPIC_API_KEY}
  - model_name: gpt-5.5
    litellm_params: {model: openai/gpt-5.5, api_key: os.environ/OPENAI_API_KEY}

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    gpt-4o-mini
          MEDIUM:    gpt-4o
          COMPLEX:   claude-sonnet-5
          REASONING: gpt-5.5
      complexity_router_default_model: gpt-4o
```

像其他模型一樣呼叫它：

```shell
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{"model": "smart-router", "messages": [{"role": "user", "content": "What is 2+2?"}]}'
```

## 完整設定 {#full-config}

v2 暴露的所有設定旋鈕。除了 `tiers` 外，`complexity_router_config` 上的所有欄位皆為可選。

```yaml
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

      # LLM classifier instead of the heuristic scorer
      classifier_type: llm
      classifier_llm_config:
        model: claude-haiku-4-5-20251001
        timeout_ms: 2000

      # Keyword rules, run before the scorer, escalate to the highest matched tier
      keyword_tier_rules:
        - keywords: ["hi", "hello", "thanks"]
          tier: SIMPLE
        - keywords: ["kubernetes", "k8s", "istio"]
          tier: REASONING
      semantic_keyword_matching: true
      embedding_model: voyage-3-5
      match_threshold: 0.5

      # Append to the built-in technical keyword list
      custom_technical_keywords: [kafka, redis, postgresql, udp, dns]

      # Thompson-sample within the tier's pool
      adaptive: true

      # Pin a session to its first-turn model to preserve prompt cache
      session_affinity: true
      session_affinity_ttl_seconds: 3600

      # Tune heuristic scorer boundaries and weights (all optional)
      tier_boundaries:
        simple_medium:     0.15
        medium_complex:    0.35
        complex_reasoning: 0.60
      token_thresholds:
        simple:  15
        complex: 400
      dimension_weights:
        tokenCount:        0.10
        codePresence:      0.30
        reasoningMarkers:  0.25
        technicalTerms:    0.25
        simpleIndicators:  0.05
        multiStepPatterns: 0.03
        questionComplexity: 0.02

    complexity_router_default_model: claude-sonnet-5
```

## 分類 {#classification}

三種方式可選取層級。選一種即可；如果 LLM 分類器發生錯誤，或沒有任何關鍵字規則符合，路由器會回退到啟發式評分器。

**啟發式評分器（預設）。** 零 API 呼叫，次毫秒級。針對七個維度為每個請求評分，並將分數對應到某個層級。

| 維度               | 偵測內容                                      |
| ------------------ | ------------------------------------------- |
| tokenCount         | 短（&lt;15）或長（&gt;400）提示詞              |
| codePresence       | "function"、"class"、"api"、"database" 等    |
| reasoningMarkers   | "step by step"、"think through"、"analyze"    |
| technicalTerms     | "architecture"、"distributed"、"encryption"   |
| simpleIndicators   | "what is"、"define"、問候語                  |
| multiStepPatterns  | "first...then"、編號步驟                    |
| questionComplexity | 多個問號                                     |

兩個或以上的 reasoning markers 會自動路由到 `REASONING`，不受加權分數影響。

**LLM 分類器。** 使用小型快速模型（Haiku、gpt-4o-mini，或您指向的任何模型）搭配結構化輸出。會透過相同的 `Router` 執行個體，因此憑證、預算與備援都會套用。逾時、內容為空，或 schema 不符時會回退到啟發式評分器。

```yaml
classifier_type: llm
classifier_llm_config:
  model: claude-haiku-4-5-20251001
  timeout_ms: 2000
```

**關鍵字規則。** 決定性短路。匹配到關鍵字，就進入該層級。當多條規則同時符合時，路由會升級到最高層級（`SIMPLE < MEDIUM < COMPLEX < REASONING`），因此規則順序不會悄悄改變行為。

啟用 `semantic_keyword_matching` 可透過 embeddings 匹配轉述。語意評分使用 MAX 聚合，因此某層級中單一關鍵字的強烈匹配不會被該層級其他語句稀釋。查詢 embeddings 會帶上呼叫端的請求中繼資料，因此其費用會歸屬到原始金鑰。embedding 失敗時，路由器會回退到評分器。

```yaml
keyword_tier_rules:
  - keywords: ["hi", "hello", "thanks"]
    tier: SIMPLE
  - keywords: ["kubernetes", "k8s", "istio"]
    tier: REASONING
semantic_keyword_matching: true
embedding_model: voyage-3-5
match_threshold: 0.5
```

## 層級池 {#tier-pools}

層級值可以是單一模型名稱或清單。

- **單一字串：** 將該層級固定到單一模型。
- **清單：** 路由器會對每個請求隨機挑選（均勻分布），概念與 simple-shuffle 相同。空池會在設定載入時直接報錯，而不是落回 `default_model`。
- **清單 + `adaptive: true`：** 在池中進行 Thompson 抽樣。冷啟動請求只會在已分類的層級內抽樣，因此成本權重不會讓初始流量全都集中到最便宜的模型。多個層級都配置到的模型會使用其與已分類層級之間的最小距離。後續回合的回饋會歸因到實際提供前一個回應的模型。

## 工作階段親和性 {#session-affinity}

可選用。會將工作階段的首輪模型固定，並在後續回合略過重新分類，因此若追蹤到該模型的提供者端 prompt cache 以該模型為鍵，後續追問（「謝謝！」）若原本會被分類到其他層級，也不會讓快取失效。

```yaml
session_affinity: true
session_affinity_ttl_seconds: 3600
```

`session_id` 會從請求中繼資料讀取。當 `adaptive: true` 也有設定時，即使是固定的回合，也會為 adaptive bandit 的所選模型中繼資料鍵加上標記，讓獎勵回饋能繼續運作。

## 自訂技術關鍵字 {#custom-technical-keywords}

內建的技術關鍵字清單很通用；它包含 "tcp"，但不包含 "udp"、"api" 但不包含 "kafka" 或 "postgresql"。`custom_technical_keywords` 會附加到內建清單，而不是取代它。

```yaml
custom_technical_keywords: [kafka, redis, postgresql, mongodb, udp, dns, ssl, ssh]
```

## 決策記錄 {#decision-log}

每個路由決策都會輸出一行可供 grep 搜尋的紀錄，標明其原因。`cause=` 可依決策類型在您的記錄管線中被 grep 搜尋。

```
ComplexityRouter: routing decision cause=complexity_scorer,      tier=SIMPLE,     score=-0.150, signals=['short (7 tokens)', 'simple (what is)'], routed_model=gpt-4o-mini
ComplexityRouter: routing decision cause=literal_keyword_match,  tier=REASONING,                                                                    routed_model=gpt-5.5
ComplexityRouter: routing decision cause=semantic_keyword_match, tier=REASONING,                                                                    routed_model=gpt-5.5
ComplexityRouter: routing decision cause=llm_classifier,         tier=COMPLEX,    score=1.000, signals=['llm-classifier:COMPLEX'],                  routed_model=claude-sonnet-5
ComplexityRouter: routing decision cause=session_affinity_pin,                                                                                      routed_model=gpt-5.5
```

## 路由器上的別名 `litellm_params` {#alias-litellm_params-on-the-router}

當路由器選出某個層級時，設定在 auto router deployment 本身上的 `drop_params`、`cache_control_injection_points`，以及任何其他 `litellm_params` 都會合併到傳出的請求中。呼叫端在請求中明確傳入的值會優先於別名預設值。

```yaml
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    drop_params: true
    cache_control_injection_points:
      - location: message
        role: system
    complexity_router_config: {...}
```

## Python SDK {#python-sdk}

```python
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "gpt-4o-mini",   "litellm_params": {"model": "gpt-4o-mini"}},
        {"model_name": "gpt-4o",        "litellm_params": {"model": "gpt-4o"}},
        {"model_name": "claude-sonnet", "litellm_params": {"model": "claude-sonnet-4-20250514"}},
        {"model_name": "o1-preview",    "litellm_params": {"model": "o1-preview"}},
        {
            "model_name": "smart-router",
            "litellm_params": {
                "model": "auto_router/complexity_router",
                "complexity_router_config": {
                    "tiers": {
                        "SIMPLE":    "gpt-4o-mini",
                        "MEDIUM":    "gpt-4o",
                        "COMPLEX":   "claude-sonnet",
                        "REASONING": "o1-preview",
                    },
                    "session_affinity": True,
                },
                "complexity_router_default_model": "gpt-4o",
            },
        },
    ],
)

response = await router.acompletion(
    model="smart-router",
    messages=[{"role": "user", "content": "What is 2+2?"}],
)
```

## UI {#ui}

Models + Endpoints > Add Model > Auto Router 分頁。Router Type 預設為 "Auto-Router v2 [Recommended]"。設定四個層級模型群組，可選擇啟用 Semantic Keyword Matching、LLM Classifier 或 Adaptive，然後按一下 **Test Connection**。Test Connection 會對每個不同的層級模型群組執行最小 `/v1/chat/completions` 或 `/v1/embeddings`，因此綠色列表示該層級確實可達，紅色列則顯示實際的提供者錯誤。

層級與分類器下拉選單會排除 embedding 模式的模型；語意 embedding 下拉選單只會列出 embedding 模式的模型。提交時四個層級皆為必填；缺少的層級會在同一列中標示。

## 另請參閱 {#see-also}

- 公告文章：[Auto Router v2: one router for complexity, semantic, and adaptive routing](/blog/autorouter-v2)
- 舊版語意路由器：[Semantic Auto Router (deprecated)](./auto_routing_semantic.md)
