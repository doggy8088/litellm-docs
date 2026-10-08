---
title: "[Beta] Auto Routing"
sidebar_label: "[Beta] Auto Routing"
---

import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 【Beta】自動路由 {#beta-auto-routing}

一個用於複雜度、語意與自適應路由的路由器。可使用 heuristics、LLM 分類器、透過 TypeSafe System One Choice 的 JEV、詞彙／語意關鍵字規則，或您自己的分類器外掛來分類每個請求，然後依各層級路由到釘選模型、隨機池，或 Thompson 抽樣池

:::info[可用性]

Auto routing 目前為 **beta**，因此設定鍵與預設值在版本之間仍可能變更。將於 **v1.94.x** 推出。最早的開發版本預計於 **2026-07-14 星期二** 發佈。建議與回饋：[@discussion #32168](https://github.com/BerriAI/litellm/discussions/32168)。

:::

## 何時使用 {#when-to-use}

| 功能 | Semantic Auto Router（已棄用） | Auto Routing（本頁） |
| ------------ | --------------------------------- | -------------------------------------------------------------------------- |
| 分類器 | 對語句進行 embedding 比對 | heuristics、LLM 分類器、JEV、詞彙／語意關鍵字規則，或您自己的外掛 |
| 層級值 | 一個模型 | 一個模型、隨機池，或自適應（Thompson 抽樣）池 |
| 延遲 | 約 100-500ms（embedding 呼叫） | 次毫秒（heuristic／關鍵字）或一次小型分類器呼叫（LLM） |
| 工作階段釘選 | 否 | 可選 `session_affinity`（預設關閉），以 `session_id` 中繼資料為鍵 |
| 記錄 | 無路由原因訊號 | 每個決策都有 `cause=` 標記（scorer、literal、semantic、session_pin、LLM、plugin） |
| 最適合 | 以意圖為基礎的路由 | 成本／品質分層、混合規則 + 分類器設定、prompt-cache 釘選 |

[語意自動路由器](./auto_routing_semantic.md) 已棄用，但仍可用於既有設定。

## 快速上手（Proxy） {#quick-start-proxy}

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params: {model: openai/{{openai_small}}, api_key: os.environ/OPENAI_API_KEY}
  - model_name: {{openai_large}}
    litellm_params: {model: openai/{{openai_large}}, api_key: os.environ/OPENAI_API_KEY}
  - model_name: {{anthropic}}
    litellm_params: {model: anthropic/{{anthropic}}, api_key: os.environ/ANTHROPIC_API_KEY}
  - model_name: {{anthropic_large}}
    litellm_params: {model: anthropic/{{anthropic_large}}, api_key: os.environ/ANTHROPIC_API_KEY}

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE:    {{openai_small}}
          MEDIUM:    {{openai_large}}
          COMPLEX:   {{anthropic}}
          REASONING: {{anthropic_large}}
      complexity_router_default_model: {{openai_large}}
```

像任何其他模型一樣呼叫它：

```shell
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{"model": "smart-router", "messages": [{"role": "user", "content": "What is 2+2?"}]}'
```

## 與您的代理程式一同設定 {#set-it-up-with-your-agent}

若要開始，請告訴您的代理程式：

```
run curl -fsSL https://docs.litellm.ai/skills/auto-router and follow the instructions
```

它會讀取您的 proxy 已提供的模型，詢問您希望路由器如何命名，以及每個層級應由哪個模型提供服務，並在寫入任何內容之前先指出它所假設的預設值。

## 完整設定 {#full-config}

v2 暴露的每個旋鈕。除了 `tiers` 之外，`complexity_router_config` 上的所有欄位都是選用的。

```yaml
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    drop_params: true
    complexity_router_config:
      tiers:
        SIMPLE:    ["{{openai_small}}", "{{gemini_flash}}"]   # random-pick pool
        MEDIUM:    {{openai_large}}                                 # single pin
        COMPLEX:   {{anthropic}}
        REASONING: {{anthropic_large}}

      # Optional display names; omit to keep SIMPLE/MEDIUM/COMPLEX/REASONING everywhere
      # tier_labels:
      #   SIMPLE: Cheap

      # LLM classifier instead of the heuristic scorer
      classifier_type: llm
      classifier_llm_config:
        model: {{anthropic}}
        timeout_ms: 2000
        # system_prompt: <your rubric>         # replaces the built-in rubric entirely; omit for the default
      classifier_fallback: heuristic           # default; or default_model
      # Prior conversation the classifier sees (LLM or JEV)
      classifier_context_window_size: 3          # default 3; 0 disables
      classifier_context_budget_chars: 8000     # default 8000
      # classifier_context_per_turn_chars: 200  # optional per-turn cap; unset by default
      classifier_context_include_assistant_turns: false   # default false

      # Or hand the tier decision to your own code (config file only)
      # classifier_type: custom
      # classifier_plugin: classifiers.tier_by_team   # dotted path to an async classify(context)
      # classifier_plugin_timeout_ms: 3000            # default

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

      # Marker pair whose blocks are stripped before classification
      reminder_markers: ["<system-reminder>", "</system-reminder>"]   # default

      # Escalate a prompt that provably does not fit the decided tier, before dispatch
      enable_context_window_escalation: false   # default; set true to opt in
      context_window_escalation_buffer: 0.95   # default; prompt must fit within this fraction of the window

      # Send image-bearing requests to a tier that can see them
      modality_routing: false   # default; set true to opt in

      # Classify new user asks only, carrying the decision through continuation turns
      classification_mode: every_request   # default; or user_turn

      # Thompson-sample within the tier's pool
      adaptive: true

      # Pin a session to its first-turn model to preserve prompt cache
      session_affinity: false   # default; set true to pin
      session_affinity_ttl_seconds: 3600

      # Return the model the router picked in the response body `model` field
      # instead of restamping it back to the alias the client called
      return_raw_model_name: false   # default

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

    complexity_router_default_model: {{anthropic}}

    # Compression guardrail per hop; a guardrail name, or `none`. Both unset (the
    # default) keeps whatever compression the key, team, or request already applies
    # on both hops
    # auto_router_routing_compression: headroom-compression
    # auto_router_model_compression: none
```

## 分類 {#classification}

選擇一個分類器，並可在分類前套用選用的關鍵字規則。除非另有設定，LLM、JEV 或自訂分類器失敗時會回退到 heuristic scorer

**Heuristic scorer（預設）。** 零 API 呼叫，次毫秒。針對七個維度為每個請求評分，並將分數對應到某個層級。

| 維度 | 偵測內容 |
| ------------------ | ----------------------------------------------- |
| tokenCount | 短（&lt;15）或長（&gt;400）提示 |
| codePresence | "function"、"class"、"api"、"database" 等 |
| reasoningMarkers | "step by step"、"think through"、"analyze" |
| technicalTerms | "architecture"、"distributed"、"encryption" |
| simpleIndicators | "what is"、"define"、問候語 |
| multiStepPatterns | "first...then"、編號步驟 |
| questionComplexity | 多個問號 |

兩個或以上的 reasoning markers 會自動路由到 `REASONING`，不受加權分數影響。

**LLM 分類器。** 使用小型快速模型（gpt-5.6-luna、Claude Sonnet 5，或您指定的任何模型）並搭配結構化輸出。會經由相同的 `Router` 實例，因此認證、預算與備援都會套用。逾時、內容為空，或 schema 不符時會回退到 heuristic scorer，或回退到帶有 `classifier_fallback: default_model` 的 `complexity_router_default_model`，這正是分類器在評分非複雜度內容時所需要的，因為複雜度分數會產生與其分類法無關的層級。

```yaml
classifier_type: llm
classifier_llm_config:
  model: {{anthropic}}
  timeout_ms: 2000
```

### JEV 分類器 {#jev-classifier}

這份參考文件保留了發行版建置所支援的欄位名稱。包含 [backend #43626](https://github.com/BerriAI/litellm/pull/43626) 的建置也接受帶有 `opensource_classifier_config.provider: jev` 的 `classifier_type: oss_classifier`；以下設定會套用於 `opensource_classifier_config` 內。既有名稱仍然可接受。請參閱 [OSS 分類器指南](/docs/auto_router/decision_classifiers) 以了解遷移方式，以及 Jev、Nimble 與 Laya 提供者設定。

以 `jev_classifier_config` 設定 `classifier_type: jev`，即可使用 [TypeSafe System One](/docs/pass_through/typesafe)。它會向 `POST /v1/systemone` 傳送一個 `questions.tier` Choice 問題，並將分類輸入放在 `state`、層級說明放在 `criteria`。回傳的 choice 會選取既有的層級池。請參閱 [設定與儀表板說明](/docs/auto_router/setup#jev-classifier-typesafe-ai)

```yaml
classifier_type: jev
jev_classifier_config:
  model: jev-latest
  timeout_ms: 3000
  circuit_breaker_enabled: true
  circuit_breaker_cooldown_seconds: 30
classifier_fallback: heuristic
classifier_context_window_size: 3
classifier_context_budget_chars: 8000
classifier_context_include_assistant_turns: false
```

| `jev_classifier_config` 欄位 | 預設值 | 行為 |
| --- | --- | --- |
| `model` | `jev-latest` | TypeSafe 模型識別碼，不含 `typesafe/` 前綴。固定版本以進行可重現的評估 |
| `api_key` | `null` | 若未提供，則從伺服器讀取 `TYPESAFE_API_KEY` |
| `api_base` | `null` | 先讀取 `TYPESAFE_API_BASE`，再回退到 `https://api.typesafe.ai`。明確值需要明確的 `api_key` |
| `timeout_ms` | `3000` | 分類的截止時間，至少 1 ms |
| `instructions` | `null` | 取代內建的問題指示。略過即可保留預設值。空字串會被拒絕 |
| `circuit_breaker_enabled` | `true` | 為此路由器實例啟用程序本地的 timeout breaker |
| `circuit_breaker_cooldown_seconds` | `30` | 進入一次復原探測前所需的正向冷卻時間 |

#### 傳送至 JEV 的上下文 {#context-sent-to-jev}

JEV 與 LLM 分類器共用分類器上下文建構器。`classifier_context_window_size` 預設為前三個使用者回合。`classifier_context_budget_chars` 預設為 8,000 個字元的前回合文字，且會先取最新的回合。`classifier_context_per_turn_chars` 是可選的正向上限，沒有預設上限。`classifier_context_include_assistant_turns: true` 會包含 assistant 文字，並讓視窗計算兩個角色

預設情況下，前回合會傳送到已設定的 TypeSafe 端點，即使完成回應是由其他提供者提供。除非啟用，否則會排除 assistant 回合。升級到 [context integration](https://github.com/BerriAI/litellm/pull/41886) 時，既有的 JEV 路由器會取得這項歷史記錄行為。請在升級前設定 `classifier_context_window_size: 0`，以避免先前對話進入 JEV 請求

這些界限涵蓋前回合文字。當前請求與擷取出的 system 文字不在此預算內，引用回合周圍的編號也不在內。已識別的 Claude Code 請求會省略其 harness system 文字。視窗大小為 `0` 會停用前回合上下文，而低於 `120` 的字元預算會抑制該區塊。增加上下文會改變傳送給 TypeSafe 的內容，並可能改變分類成本與層級選擇

#### 備援與復原 {#fallback-and-recovery}

逾時、HTTP 失敗、格式不正確的回應、缺少或未知的 choice，以及開啟中的 circuit 會使用既有的分類器備援。對於內建層級，`classifier_fallback: heuristic` 是預設值。`classifier_fallback: default_model` 會將請求送往 `litellm_params.complexity_router_default_model`。針對自訂層級，已設定的 `fallback_tier` 具有優先權

breaker 會在辨識到的分類逾時時開啟。在其冷卻期間，請求會使用備援，而不會再進行另一個 JEV 呼叫。冷卻結束後，會由一個請求測試復原，而其他請求則繼續使用備援。成功的探測會關閉 breaker，而失敗的探測會重新開啟它。已關閉時的一般非逾時失敗會直接使用備援，不會開啟 breaker。此狀態屬於單一程序中的單一路由器實例，且不會在 workers 之間共享

分類器截止時間會限制等待分類的時間。它不保證已取消的提供者請求從未被接收或計費，而備援完成仍可能在其自己的提供者端失敗

#### 自訂、授權與認證 {#customization-licensing-and-authorization}

內建 JEV 分類可在沒有 Enterprise 授權的情況下使用，且與內建 LLM 分類器適用相同政策。替換 `instructions` 或定義 `tier_definitions` 會使用現有的 Enterprise 自訂分類器能力。使用 `tier_definitions` 時，每個描述都會成為對應的 Choice 準則。JEV 也支援一般的 `enable_non_reasoning_tier` 設定

依賴授權會將 JEV 識別為 `typesafe/<configured model>`，角色為 `evaluation`，以及路由器的 tier、預設和 embedding 依賴。受限金鑰與團隊成員需要能存取其可呼叫的依賴。團隊成員管理寫入無法提供 `api_key` 或 `api_base`，即使使用者可以編輯路由器也一樣。選擇 JEV 不會授予額外的模型或管理權限

#### 測試路由與計費 {#test-routing-and-accounting}

`POST /auto_router/test_routing` 會在不向所選 tier 傳送 completion 的情況下進行分類。JEV 呼叫仍可能產生提供者支出，語意 embedding 呼叫也是如此。請求的 `default_model` 欄位會為此預覽選擇預設值。**Test Connection** 也會探測 JEV 與已設定的模型依賴，因此可能同時產生分類器與 completion 費用

Test Routing 會在分類前檢查其可呼叫模型的存取權，並強制執行虛擬金鑰預算上限。團隊與成員政策也會透過管理路由授權套用。預覽不會繞過這些檢查，因為它會略過下游 completion

成功的 JEV 決策在可計價時會記錄 `cause: jev_classifier`、`classifier_model: typesafe/<model>`、`classifier_probabilities`、`classifier_confidence` 與 `classifier_cost`。模型是 TypeSafe 回傳的版本；如果回應省略了它，則使用已設定的模型。機率描述的是 TypeSafe 的選擇，而不是獨立量測的正確性

JEV 使用情況會以一筆獨立的分類器呼叫記錄，並帶有來源請求的身分中繼資料。傳回的輸入/輸出 token 會依模型登錄表定價。缺少用量或定價會使成本無法得知。即使其選擇稍後驗證失敗，只要 HTTP 回應具有可用用量，仍可被記錄；但備援決策不保證有 `classifier_cost` 值。在對帳支出時，請同時檢查獨立的分類器列以及父 completion

對於成功的分類，回報的 Auto Router 節省會扣除 `classifier_cost`。在加總已包含分類器呼叫的支出列時，不要再次加入該中繼資料。請參閱 [評估與節省對帳](/docs/auto_router/evaluate#evaluate-jev-on-your-own-prompts) 與 [benchmark 的成本範圍](/blog/jev-auto-router-benchmark)

### 關鍵字規則 {#keyword-rules}

確定性的短路。匹配關鍵字，就進入該 tier。當多個規則都匹配時，路由會升級到最高 tier（`SIMPLE < MEDIUM < COMPLEX < REASONING`），因此規則順序不會在不知不覺間改變行為

啟用 `semantic_keyword_matching` 可透過 embeddings 匹配意義相近的改寫。語意評分使用 MAX 彙總，因此某個 tier 中一個關鍵字的強匹配不會被該 tier 的其他語句稀釋。查詢 embedding 會攜帶呼叫者的請求中繼資料，因此其支出會歸屬於來源金鑰。若 embedding 失敗，路由器會回退至評分器。

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

**自訂分類器外掛程式。** 您自己的程式碼決定 tier。請設定 `classifier_type: custom`，並將 `classifier_plugin` 指向一個具有非同步 `classify(context)` 的物件之點記法路徑，其解析方式與路由 [`plugins`](../routing_plugins.md) 相同。當 tier 根本不是對提示詞的判斷時，就適合使用它：依團隊或租戶方案路由、依您所擁有服務中的旗標路由，或依任何您能以 Python 表達的規則路由。

:::info

自訂分類器外掛程式隨 **v1.99.x** 一併推出（[PR #37249](https://github.com/BerriAI/litellm/pull/37249)）。僅限設定檔：如同 `plugins`，`classifier_plugin` 無法透過模型管理 API 或 UI 設定，因為活的物件不會透過 HTTP 傳輸。

:::

```yaml title="config.yaml"
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    complexity_router_config:
      classifier_type: custom
      classifier_plugin: classifiers.tier_by_team   # dotted path, resolved next to this config file
      classifier_plugin_timeout_ms: 3000            # default
      tiers:
        SIMPLE:    {{openai_small}}
        REASONING: {{openai_large}}
    complexity_router_default_model: {{openai_small}}
```

```python title="classifiers.py"
from litellm.types.router import RoutingContext


class TierByTeam:
    async def classify(self, context: RoutingContext) -> str | None:
        team = context.metadata.get("user_api_key_team_alias")
        if team == "research":
            return "REASONING"
        if team == "support":
            return "SIMPLE"
        return None   # decline, and let classifier_fallback decide


tier_by_team = TierByTeam()
```

`context` 與路由外掛程式接收的是相同的 `RoutingContext`：`raw_messages`、`structured_messages`（已正規化為 OpenAI chat 格式）、`metadata` 與 `candidate_models`。呼叫者身分會隨著 `metadata` 一起傳遞，因此 `user_api_key_team_id`、`user_api_key_team_alias` 與 `user_api_key_user_id` 無需您自己做任何接線即可讀取。這裡的 `candidate_models` 是每個 tier 模型的資訊快照，而不是路由外掛程式所過濾的縮小表面：您回傳的 tier 會選取模型池，因此修改清單不會有作用。

回傳一個 tier 的名稱：內建 tier（`SIMPLE`、`MEDIUM`、`COMPLEX`、`REASONING`），或其 `tier_labels` 顯示名稱。回傳 `None` 表示拒絕。

其他任何情況都會被視為可用性而非政策，並且會完全以 LLM 分類器相同的方式回退。`None`、擲出例外、呼叫耗時超過 `classifier_plugin_timeout_ms`、路由器無法辨識的 tier 名稱，以及未設定模型的 tier，都會將請求交給 `classifier_fallback`：預設為啟發式評分器，或 `default_model`。當外掛程式當機時，路由會降級；它永遠不會使請求失敗。

設定錯誤會在啟動時顯示，而不是在第一次被分類的請求上才出現。`classifier_plugin` 若其 `classify` 缺失或不是 `async`，會連同設定鍵名稱一併被拒絕；`classifier_type: custom` 若沒有外掛程式會擲出例外，而設定在任何其他 `classifier_type` 下的外掛程式也會擲出例外，因為它永遠不會執行。

路由器上的其他一切仍然適用。`keyword_tier_rules` 會在外掛程式之前短路，升級關鍵字仍會將它回傳的 tier 升級，`adaptive: true` 仍會在該 tier 的模型池內進行 Thompson 抽樣，而 `session_affinity: true` 仍會將工作階段固定到其首輪模型。`classifier_context_*` 設定僅適用於 LLM 分類器；外掛程式會直接取得訊息，並自行決定要讀取多少內容。

### 會被分類的內容 {#what-gets-classified}

請求不會被當作一個 blob 來分類。路由器會從訊息列表中擷取**最後一個真正的人類請求**與**最新的系統提示詞**，而目前請求的評分路徑會讀取這些字串，而非原始 payload。分類器的 context window 也可以加入先前回合與軌跡估計，如下所述。這在 agent harness 下最重要，因為單一回合會以龐大的共用 system 前綴、大量工具結果，以及一行請求進來

擷取會從最新的訊息開始向前走，並回傳仍含有人類文字的第一個 user 回合。內容會只保留 `type == "text"` 區塊，因此其內容完全是工具輸出的回合會被壓平成空字串並略過，而不是被接受為請求；在 Messages 表面上，工具結果會以非文字 `tool_result` 區塊附著在 user 回合上，而在 chat completions 中，它們位於 `tool` role 上，該 role 從不會被讀取。完整的 `<system-reminder>` ... `</system-reminder>` 區塊會在文字使用前被移除，而圍繞它們撰寫的請求仍會保留。標記比對是字面且不分大小寫，未關閉的開頭標籤不算區塊且會維持原樣，而 `reminder_markers` 會為以不同方式標示提醒的 harness 代入另一組標記。當所有 user 回合都只有接線內容時，就根本沒有請求，請求會被送往 `complexity_router_default_model`，而不是讓 harness 注入的文字決定 tier。在設定了 `plugins` 的路由器上，它會改走 `MEDIUM` 模型池，因此預設模型永遠無法繞過外掛程式管線

其結果正是資深讀者通常會認為缺少的那一點：「修正這個 typo」與「重構 auth 子系統」各自會根據自己的請求進行評分，而不是因為它們共用 40k token 的 system 前綴與提醒區塊而被迫進入同一個 tier

被剝離過的 human ask 是唯一會傳到 `keyword_tier_rules`、語義關鍵字比對、升級關鍵字，以及 heuristic scorer 的 reasoning-marker 維度的文字。system prompt 會另外擷取，且**不會**移除 reminder；它會餵給 heuristic scorer 的 code、technical 與 simple 維度，並會被引用到 LLM classifier payload 中。reasoning markers 刻意只讀 human ask，也正是這點阻止了一個 `You are an expert engineer. Always think step by step.` system prompt 把 session 中的每個請求都固定到 `REASONING`。升級關鍵字的範圍更窄：它們只讀最新 user turn 的剝離後文字，所以一次 escalate 請求不會在後續每個 tool turn 上再次觸發

強制 `REASONING` 的 heuristic override 在兩個或以上 reasoning markers 時是 scorer 的一部分，所以當 `classifier_type` 是 `heuristic`，以及在 classifier 呼叫失敗後的 scorer fallback 中都會套用。在 LLM classifier 路徑上，classifier 回傳的 tier 會原樣使用

已棄用的 [semantic auto router](./auto_routing_semantic.md) 合約要薄得多。它只取最新的 user message，並回傳該訊息平坦化後的內容，沒有 reminder stripping、沒有 system prompt、也沒有 skipping，所以最新一輪如果只含 tool-result 區塊，會產生空字串並以此嵌入。它實際嵌入的內容會在呼叫 `auto_router_embedding_model` 之前截斷為前 `auto_router_max_input_chars` 個字元（預設 2000，保留開頭），因為被截斷的 prompt 仍然能路由，而過長的則會出錯。在 agent harness 下，這看起來就像是在一輪的開頭進行路由，這也是資深讀者通常會以為 complexity router 也具備的設計

### 分類器上下文視窗 {#classifier-context-window}

:::info

context-window 支援隨 **v1.96.x** 一起推出（[PR #35185](https://github.com/BerriAI/litellm/pull/35185)）；同版也加入了視窗中的 assistant turns（[PR #35471](https://github.com/BerriAI/litellm/pull/35471)）。在較早版本中，classifier 只會看到目前訊息，而這些 key 會被靜默忽略。

:::

預設情況下，LLM 與 JEV classifier 最多會收到前 3 個 user turn，且受限於 8,000 字元的前序 turn 預算。像「now do the same for the streaming path」這樣的後續內容，就能針對其所指涉的內容來評分。`classifier_context_per_turn_chars` 可選擇在總預算套用前先限制每個 turn 的長度，且預設未設定

預設只有包含人類撰寫文字的 turn 會算進視窗。tool 輸出永遠不符合資格（Messages surface 上的 `tool_result` blocks、chat completions 上的 `tool` role），完整的 reminder 區塊會在該 turn 被考慮前先被剝離（預設為 `<system-reminder>` ... `</system-reminder>`，另一組帶有 `reminder_markers`），而剝離後若 turn 變成空白，會被跳過而不是佔用一個名額。設定 `classifier_context_include_assistant_turns` 以同時包含 assistant turns；請參見下方的 [context window 中的 assistant turns](#assistant-turns-in-the-context-window)。其文字等於正在分類的 ask 的 turn 會被排除，因此該 ask 絕不會被引用兩次。前序 turns 會依最舊到最新送出並標記為 `[1]`、`[2]`、`[3]`，而在字元限制處被截斷的 turn 會在尾端加上 `...`，讓 classifier 能辨識它已被裁切。只要存在前序對話，也會一併包含單一深度行（`Conversation so far: ~N tokens across the request`）。那個 trajectory 計數是對請求上每則訊息文字內容所做的每個 token 約 4 個字元的粗略估算，不是 tokenizer 計數，也不限於視窗內的 turns，因此它較像是深度訊號，而不是可計費數字

在 LLM 路徑上，system role 會承載操作者的評分準則，而呼叫端提供的 context 則會引用在 user turn 中。JEV 會將此分類 context 作為 `state`，並把指示放在 Choice question 上。LLM 路徑上的三輪對話會產生：

```
system: <rubric, operator-authored, identical on every request>

user:   Caller system prompt, quoted as task context:
        <the caller's own system prompt>

        Recent conversation (context only, do not classify these):
        [1] add a health check endpoint
        [2] now wire it into the readiness probe

        Conversation so far: ~1240 tokens across the request

        Classify this message:
        now do the same for the streaming path
```

設定 `classifier_context_window_size: 0` 可停用前序 turn context 與深度行。目前的 ask 與擷取出的 system 文字仍然不計入前序 turn 預算，唯獨辨識出的 Claude Code harness system 文字會被省略。若相關 context 被截斷，請提高 `classifier_context_budget_chars` 或明確的每 turn 上限。這些 context 控制也適用於 JEV。keyword 比對仍然會讀 human ask，而 heuristic scorer 不使用這個前序 turn 視窗

請注意，`session_affinity` 會在 session 的第一個 turn 之後跳過重新分類，因此在啟用它的 router 上，context window 只會在第一輪發揮作用，或是在沒有可由 metadata 解析出 `session_id` 的請求上發揮作用。它預設為關閉，因此預設每個 turn 都會被分類，而視窗會貫穿整個過程。

### 上下文視窗中的助理回合 {#assistant-turns-in-the-context-window}

`classifier_context_include_assistant_turns` 預設為關閉，並會把模型自身的回覆納入視窗。它是為了這種對話而存在：難度是由 assistant 而不是 user 說明的情況。assistant 回答「here is the plan, it is complex, should I execute?」，user 回答「yes」，而只看 user turns 時，router 會評分「yes」這個字並選擇最便宜的 tier。啟用後，classifier 會評分目前訊息所核准的工作，並以其延續的對話脈絡來判定。

```yaml
classifier_type: llm
classifier_llm_config:
  model: {{anthropic}}
classifier_context_include_assistant_turns: true
classifier_context_window_size: 3
classifier_context_per_turn_chars: 200
```

啟用它會改變 `classifier_context_window_size` 的計算方式：計算的是對話中兩種角色合計的最後 N 個 turns，而不是最後 N 個 user turns，因此如果一段很多話的互動仍應包含數個 user ask，請相應調整預算。只有在啟用此功能時，turn 才會在 payload 中以角色標示，這可保持每個既有 deployment 的 prompt 不變。assistant 回覆與 user turns 共用 `classifier_context_per_turn_chars`，因此若回覆在說明難度的那一段之前就被截斷，請提高此值。

它預設關閉有兩個原因：啟用後會在已部署的 router 上改變 tier 決策，進而影響支出；而且 assistant 文字會成為傳送到 classifier deployment 的全新 egress，該 deployment 可能與被路由的模型屬於不同提供者。assistant 文字只會進入 classifier payload，其他內容不會；`keyword_tier_rules`、升級關鍵字、heuristic scorer 與語義比對仍然只讀 human ask，因此 assistant 就算把升級關鍵字回音回來，也無法決定 tier。

## 層級集區 {#tier-pools}

tier 值可以是單一 model 名稱或清單。

- **單一字串：** 將 tier 固定到某一個 model。
- **清單：** router 會對每個請求隨機選取（均勻），概念與 simple-shuffle 相同。空的 pool 會在設定載入時直接報錯，而不是落到 `default_model`。
- **清單 + `adaptive: true`：** 在整個 pool 中使用 Thompson sampling。冷啟動請求只會在被分類的 tier 內取樣，因此成本權重不會把初始流量完全壓到最便宜的 model 上。跨多個 tier 設定的 models，會使用它們相對於被分類 tier 的最小距離。後續 turn 的回饋會歸因回實際提供前一個回應的 model。

## 工作階段黏著性 {#session-affinity}

預設關閉：每個 turn 都會依自身條件獨立分類，因此每個 turn 都會落到對它而言足夠且最便宜的 tier。

設定 `session_affinity: true` 可將 session 的第一個 turn model 鎖定，並在後續 turns 跳過重新分類。啟用它有兩個好處。以該 model 為鍵的提供者端 prompt cache，當原本會在 follow-up（「thanks!」）時分類到不同 tier 時，就不會再被失效。另一方面，多輪 session 會維持在單一 model 上，避免當某個 model 產生的對話歷史（例如 Anthropic 的 `thinking` block）在之後的 turn 被重播到另一個 model 時發生提供者錯誤。

代價是整個 session 都會繼承第一輪的 tier。若一段對話一開始是高難度問題，之後接著簡單 follow-up，這些 follow-up 仍會持續按昂貴 tier 計費。

```yaml
session_affinity: true          # default false; set true to pin a session to its first-turn model
session_affinity_ttl_seconds: 3600
```

`session_id` 會從 request metadata 讀取；當沒有可解析出的 `session_id` 時，無論此項設定為何，router 都會照常將每個 turn 分類。當 `adaptive: true` 也有設定時，被鎖定的 turn 仍會寫入 adaptive bandit 所選模型的 metadata key，讓獎勵回饋持續運作。當路由 `plugins` 已設定時，`session_affinity` 會被忽略，因此 session 中途的政策變更仍會套用到後續 turns，而不會因為快取的鎖定而被跳過。那是專指路由 `plugins`；一個 `classifier_plugin` 會在被分類的那些 turns 上選擇 tier，並保留鎖定不變。

:::info[預設值已變更]

`session_affinity` 原本預設為 `true`。在該變更之前建立的路由器沒有儲存 `session_affinity` 金鑰，因此它們會沿用新的 `false` 預設值，並開始重新分類每一回合。將 `session_affinity: true` 加到任何應該維持固定指派的路由器上。

:::

### 工作階段黏著性固定模型名稱 {#session-affinity-pins-the-model-name}

複雜度路由器儲存的固定值是它路由到的**模型名稱**，會依 `complexity_router_session_affinity:v1:<router name>:<key hash>:<session_id>` 快取，用於 `session_affinity_ttl_seconds`。TTL 會在快取命中時重新整理，而升級請求可以將固定值升上一個層級。之後，部署選擇會像往常一樣在該名稱底下執行。如果該層級條目命名的是一個跨多個部署分發的模型群組（兩個 Bedrock 區域、Vertex 加上第一方 Anthropic API、兩個 Azure 資源），該會話仍會停留在同一個模型上，並且仍會分散到那些部署上，而每個提供者端前綴快取只會看到該會話一部分的回合。在編碼代理程式工作負載上，由於快取前綴佔請求的大部分，這就是讀取一個熱前綴與再次寫入它之間的差異

`DeploymentAffinityCheck` 是完成這件事的部分。它固定的是一個具體的部署 id（`model_info.id`），而不是模型名稱，且它正是為這種隱式提示詞快取情境而存在。它是 Router 的一個前置請求檢查，獨立於路由器別名上的任何設定啟用，並且有兩個值得分開理解的旗標：

| `optional_pre_call_checks` 條目 | 依據以下項目固定部署 |
| ------------------------------- | ---------------------- |
| `deployment_affinity`           | 呼叫者的金鑰雜湊（`metadata.user_api_key_hash`） |
| `session_affinity`              | 來自請求中繼資料的 `session_id` |
| `responses_api_deployment_check` | `previous_response_id`，其優先於上述兩者 |

`session_affinity` 字串在 `optional_pre_call_checks` 中，與 `session_affinity` 內的 `complexity_router_config` 是不同的設定，儘管名稱相同。前者在 Router 前置請求檢查下固定一個部署 id；後者固定一個模型名稱並略過重新分類。兩者對代理程式工作負載都很值得設定。`deployment_affinity_ttl_seconds`（預設為 `3600`）是部署固定值的 TTL，且它位於 `router_settings` 中，而不是路由器別名上

建議的編碼代理程式工作負載形態：固定會話的層級及其背後的部署：

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
  - model_name: {{anthropic}}
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
  # same tier, second deployment: this is the fan-out a model-name pin cannot hold
  - model_name: {{anthropic}}
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_region_name: us-east-1
  - model_name: {{anthropic_large}}
    litellm_params:
      model: anthropic/{{anthropic_large}}
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-auto
    litellm_params:
      model: auto_router/complexity_router
      cache_control_injection_points:
        - location: message
          role: system
      complexity_router_config:
        tiers:
          SIMPLE:    {{openai_small}}
          MEDIUM:    {{anthropic}}
          COMPLEX:   {{anthropic}}
          REASONING: {{anthropic_large}}
        session_affinity: true
        session_affinity_ttl_seconds: 3600
      complexity_router_default_model: {{anthropic}}

router_settings:
  optional_pre_call_checks: ["deployment_affinity", "session_affinity", "prompt_caching"]
  deployment_affinity_ttl_seconds: 3600
```

第三個條目，`prompt_caching`，會啟用 `PromptCachingDeploymentCheck`，其依據的是前綴而非會話：在一次成功的 completion 之後，它會記錄服務該提示詞的部署，並以可快取前綴（直到並包含最後一個 `cache_control` 檢查點為止的所有內容）作為索引，然後將下一個帶有相同前綴的請求送回同一個部署。它只會在提示詞通過模型的最小可快取 token 數時才會查看，並且有助於那些不送出 `session_id` 且沒有穩定金鑰的呼叫者，因此它是補充這兩個親和性固定值，而不是取代其中任何一個

## 自訂技術關鍵字 {#custom-technical-keywords}

內建的技術關鍵字清單是通用的；它包含「tcp」，但不包含「udp」、「api」但不包含「kafka」或「postgresql」。`custom_technical_keywords` 會附加到內建清單，而不是取代它。

```yaml
custom_technical_keywords: [kafka, redis, postgresql, mongodb, udp, dns, ssl, ssh]
```

## 決策記錄 {#decision-log}

每個路由決策都會輸出一行可 grep 的記錄，說明其原因。`cause=` 可以依決策類型在您的記錄管線中以 grep 搜尋。

```
ComplexityRouter: routing decision cause=complexity_scorer,      tier=SIMPLE,     score=-0.150, signals=['short (7 tokens)', 'simple (what is)'], routed_model={{openai_small}}
ComplexityRouter: routing decision cause=literal_keyword_match,  tier=REASONING,                                                                    routed_model={{openai_large}}
ComplexityRouter: routing decision cause=semantic_keyword_match, tier=REASONING,                                                                    routed_model={{openai_large}}
ComplexityRouter: routing decision cause=llm_classifier,         tier=COMPLEX,    score=1.000, signals=['llm-classifier:COMPLEX'],                  routed_model={{anthropic}}
ComplexityRouter: routing decision cause=classifier_plugin,      tier=REASONING,  score=n/a,   signals=['classifier-plugin:REASONING'],             routed_model={{openai_large}}
ComplexityRouter: routing decision cause=session_affinity_pin,                                                                                      routed_model={{openai_large}}
```

## 從回應讀取所選模型 {#reading-the-picked-model-from-the-response}

預設情況下，回應本文的 `model` 欄位會維持您呼叫時使用的別名（`smart-router`），符合 OpenAI 慣例：用戶端會收到它所要求的模型名稱，而實際回應的層級只能透過 [`x-litellm-model-id` 回應標頭](./response_headers.md#litellm-specific-headers) 取得。無法讀取回應標頭的用戶端，包括框架包裝器以及只能看到串流區塊的串流消費者，都需要本文中的值。

在路由器上設定 `return_raw_model_name` 即可把它放到那裡。之後，proxy 會跳過重新覆寫，並將已解析的模型保留在 `model` 中，無論是非串流回應還是每個串流區塊：

```yaml
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    complexity_router_config:
      tiers:
        SIMPLE:    {{openai_small}}
        REASONING: {{openai_large}}
      return_raw_model_name: true   # default false
```

UI 中 auto router 分頁上的同一個切換項目，名稱是「Return raw model name」。

非串流：

```json
{
  "id": "chatcmpl-abc123",
  "model": "{{openai_large}}",
  "choices": [{"...": "..."}]
}
```

串流時，會套用到每個 SSE 區塊，而不只是第一個或最後一個：

```
data: {"id":"chatcmpl-abc123","model":"{{openai_large}}","choices":[{"delta":{"content":"The"},"...":"..."}]}

data: {"id":"chatcmpl-abc123","model":"{{openai_large}}","choices":[{"delta":{"content":" sum"},"...":"..."}]}
```

由於 `model` 是標準的 OpenAI 回應欄位，因此每個 SDK 和框架都已經會將它傳遞到應用程式程式碼；不需要讀取原始區塊。在 LangChain 中，串流時它會以 `response_metadata.model_name` 的形式出現在最後一個區塊上。

一旦啟用這個旗標，就會有兩件事改變。呼叫者不再拿回自己送出的別名，而有些用戶端會對此做斷言。而且該值會是部署回報的已解析模型，因此像 `hosted_vllm/my-model` 這樣的提供者前綴識別碼，會原封不動送到用戶端，而不是 [決策記錄](#decision-log) 列印為 `routed_model=` 的 `model_list` `model_name`。

:::info[沒有專用的本文欄位]

v1.99 發行候選版曾短暫包含一個獨立的 `router_model_name` 本文欄位，用於此用途（[PR #37725](https://github.com/BerriAI/litellm/pull/37725)），並以 LangChain 呼叫者為設計考量。但它從未真正傳遞到他們那裡：`@langchain/openai` 建構會根據固定的金鑰允許清單建立 `additional_kwargs` 和 `response_metadata`，並在區塊頂層與 `delta` 內部都捨棄未知欄位，因此在 proxy 端放置命名空間金鑰都不可能奏效。該欄位在穩定版發行前已移除，改為使用 `return_raw_model_name`，其會落在 LangChain 會轉傳的 `model` 欄位中。

:::

## 回報的節省 {#reported-savings}

每個自動路由的請求都會記錄一項與反事實比較的節省量：若沒有路由器，流量原本會在哪一個模型上執行，扣除路由決策本身的成本後

```text
savings = cost(baseline model, this request)
        - cost(the model the router picked, this request)
        - cost(the classifier call that routed it)
```

- **基準值是推導出來的，不是設定的。** 沒有路由器時，一個部署必須選擇一個能處理它將看到的最困難請求的模型，因此基準值就是路由器設定的最困難層級中最昂貴的模型。最困難是指 *已設定*，因此只定義 `SIMPLE` 和 `MEDIUM` 的路由器，會以其實際能選到的最佳項目作為衡量基準。命名為模型池的層級會貢獻其中每一個模型，而自定義層級標籤不帶嚴重程度順序，因此在那裡每個層級中的每個模型都會競爭
- **「最昂貴」由成本決定，而不是由費率決定**，因為每輸出 token 更貴的模型，可能每個快取 token 反而更便宜。候選項會透過相同的引擎，以固定參考請求（20k 提示詞 tokens：19k 快取讀取與 1k 快取寫入，加上 1k completion）計價一次，該引擎也用於節省量。無法計價的候選項會被排除，若沒有任何項目可計價，驅動程式會回報零。排序會釘選在每個路由器執行個體上，因此它不會走在每請求路徑上
- **只有一側是反事實。** 該請求實際花費多少，是從成本計算器記錄回來的結果讀取，而不是重新推導；基準值從未執行過，因此它會以相同基礎透過同一個引擎計價。該數字是輸入加上輸出成本，因此把內建工具成本、折扣與利潤排除在比較之外
- **結果可為負。** 切換模型會讓新模型維持冷態，而當因此產生的快取建立費用大於較便宜的費率時，數字就會變成負值，儀表板也會顯示如此
- **分類器本身的費用會計入節省量**（v1.100 及之後）。LLM 分類器會將其在路由決策上的呼叫成本記錄為 `classifier_cost`，而回報的數值會扣除它，因此該數字是路由在支付決策成本之後所賺到的量。由啟發式自行做出的決策不會記錄任何費用，且那裡不會扣除任何東西
- **零節省會保留兩項成本。** 對於支援的原生 Anthropic 請求，完整觀察到的使用情況會建立相等的模型成本，而已記錄的會話則已使用完全相同、以相同價格計算的基準部署，包括重疊請求。當請求可計費時，兩項成本都維持非零。已記錄的分類器費用仍會計入節省量。在路由分歧之後，要回到相同模型需要快取歷史證據；僅靠模型身份無法建立零節省。缺少定價或證據會產生不可用的估算

### 快取前綴歷史與到期 {#the-baseline-is-priced-with-a-warm-cache}

對於受支援的原生 Anthropic `/v1/messages` 請求，基準快取讀取需要在請求開始時可用、且在五分鐘或一小時 TTL 內仍然存在的相符前綴。已知已過期的前綴會以寫入計費。由較便宜模型處理的請求也會推進假設性的基準歷史。單獨的 assistant 訊息本身不會建立快取命中

請使用穩定的 session ID、已設定的 proxy 資料庫，以及已啟用的支出記錄。帳務會在推論之後執行，並依請求開始順序重放已記錄的觀測值。較晚的觀測值可能會暫時撤回受影響的估算，直到請求、session 與每日總計完成修正。實際的已計費支出會在整個過程中持續記錄

基準 token 計數需要與已提供服務的請求相同的 endpoint 和 API key。相容 Anthropic 的閘道必須為每個必要的前綴支援原生計數，包括沒有訊息的 system 或 tools。缺少或逾時的計數會產生未知估算；本機 tokenizer 或虛構訊息無法建立快取命中

此比較會將已記錄的 prompts、輸出用量與請求時間固定不變。它不會預測其他模型回應、提供者淘汰或未記錄的流量。舊版 session 不會僅因其已記錄歷史不可用，就變成新的、與基準完全相同的 session。非作用中的 session 歷史會依據 session 保留政策被清除，而重用已退役的 session ID 不會建立另一個初始估算

某些 Claude Code beta 標頭與 `context_management` 形狀在模型化的快取帳務中仍不受支援。初始的基準完全相同請求仍可使用完整的已觀測用量。切換模型後的支援情況取決於實際的請求形狀與可用的前綴計數

### 估算涵蓋範圍 {#estimate-coverage}

儀表板會比較相同估算 turns 上的基準與路由成本，包括節省為數字零的 turns。它會顯示有多少 turns 具有估算，以及總實際支出。未知與待處理的 turns 不會計入任何一側的比較成本，而其實際支出仍會保留在總計中。當涵蓋範圍部分不足時，既有的 session-status 用戶端不會收到基準總計

例如，一個花費 $0.10 的基準完全相同請求，其基準成本為 $0.10、路由模型成本為 $0.10，而模型節省為 $0。如果下一個 turn 的快取歷史不可用，則其已計費支出仍會被記錄，但會從節省比較的兩側排除

### 顯示位置 {#where-it-shows-up}

- **用量**，依各提供者自身的形狀標準化：Anthropic 表面上的 `cache_read_input_tokens` 與 `cache_creation_input_tokens`、OpenAI 相容表面上的 `prompt_tokens_details.cached_tokens`，以及 DeepSeek 的 `prompt_cache_hit_tokens`
- **每日彙總**：`cache_read_input_tokens` 與 `cache_creation_input_tokens` 欄位，以及 `autorouter_savings_spend`，位於 `LiteLLM_DailyUserSpend`、`LiteLLM_DailyTeamSpend`、`LiteLLM_DailyTagSpend`、`LiteLLM_DailyOrganizationSpend`、`LiteLLM_DailyEndUserSpend` 和 `LiteLLM_DailyAgentSpend` 上
- **API**：`GET /user/daily/activity` 會在 `metrics` 下回傳它們，並在回應中繼資料中提供 `total_autorouter_savings_spend`
- **UI**：**Cost Optimization** 頁面會讀取該 endpoint，其中該數值標示為「Auto-router savings」。其 Auto-Router Benchmarks 分頁會將每個 turn 的 `classifier_cost` 納入該 turn 的支出，因此那裡的節省百分比是相對於完整基準成本量測的淨節省

:::note

`LiteLLM_SpendLogs` 沒有 cache-token 或 savings 欄位，因此無法在那裡查詢拆分；上方的每日彙總可以。承載該拆分的用量確實會隨列中的 `metadata` 一起位於 `usage_object` 之下，而每日節省寫入器正是讀回這些資料以重建 `Usage`。其 `cache_hit` 與 `cache_key` 欄位無關，它們描述的是 LiteLLM 自己的回應快取，而不是提供者端的提示快取。路由本身會以中繼資料中的 `routing_decision` 持久保存：`routed_model`、`cause` 與 `conversation_continuing` 一律如此，當已決定 tier 時則為 `tier`，當 LLM 分類器執行時則為 `classifier_cost`，以及其所解析到的部署旁的衍生基準。淨值會以 `autorouter_savings` 的形式標記在該中繼資料上。版本化的 `autorouter_savings_estimate` 會記錄比較身分、來源、狀態、原因以及兩個比較成本。讀者會使用已記錄的估算及其涵蓋範圍

:::

## 閘道路由器上的別名 `litellm_params` {#alias-litellm_params-on-the-router}

`drop_params`、`cache_control_injection_points`，以及設定在 auto router 部署本身上的任何其他 `litellm_params`，在 router 選取 tier 時都會合併到對外請求中。呼叫端在請求上明確傳入的值會優先於別名預設值。

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

## 壓縮 {#compression}

從 v1.101.0 起，auto router 可為路由請求所經過的兩個 hop 各自指定一個壓縮防護欄：決定 tier 的 classifier 呼叫，以及路由到的模型呼叫。這兩個欄位都位於 marker 的 `litellm_params`，旁邊是 `complexity_router_default_model`，可接受 [Headroom](./headroom.md) 或 [Compresr](./guardrails/compresr.md) 防護欄的名稱，並接受不區分大小寫的 `none`，表示該 hop 完全不應壓縮。

```yaml title="config.yaml"
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    complexity_router_config: {...}
    auto_router_routing_compression: headroom-compression
    auto_router_model_compression: none
```

兩者都不設定時，會保留目前每個既有 router 的行為：單一壓縮流程，不論是 key、team 或請求先前選定的哪一個，都會同時餵給兩個 hop。設定任一欄位則會使 router 對其所服務的請求擁有主導權，其他所有壓縮防護欄都會被抑制，包括標記為 `default_on` 的，以及呼叫端在請求本文中指定的防護欄。同一個 proxy 上的其他一般部署不受影響。若兩個 hop 指定相同的防護欄，則只會執行一次並重用結果，而不是將同一段文字壓縮兩次。

若名稱無法解析為作用中的壓縮防護欄，會在 proxy 記錄中產生警告，並使該 hop 不經壓縮，而非導致請求失敗。來自可解析防護欄的錯誤仍會依該防護欄的設定方式運作，因此若壓縮服務無法連線且設定為 fail closed，則仍會在任何提供者呼叫之前使請求失敗。

在推出此功能前，有兩件事值得注意。只有在執行 LLM 分類器時，壓縮 routing hop 才能節省 token，因為只有該分類器會將文字送到模型；heuristic scorer 會在本機讀取文字，因此不會產生成本，而已棄用的 semantic router 只會嵌入最後一則 user 訊息，壓縮不會影響它。當兩個 hop 指定不同的防護欄時，會先壓縮 model hop，因此 classifier 讀到的是 model 壓縮後的文字，而不是原始文字。Routing 會刻意讀取即時訊息：唯一可用的未壓縮副本是 pre-call 防護欄執行前取出的那一份，而將其交給壓縮服務會把 masking 防護欄自身的輸入送到第三方。

## 上下文視窗 {#context-window}

auto router 項目是 marker，而不是可呼叫的模型，因此本身不帶有 provider 中繼資料，也不會宣告 context window，直到您明確指定為止。此數值不是由 tier 模型推導而來：不是它們之間的最小值，不是最大值，也不是 `complexity_router_default_model` 的 window。tiers 保留的是 proxy 會在請求時解析的模型名稱，而 model-info 流程中的任何東西都不會走訪該清單。在您指定 window 之前，`GET /v1/models` 會完全省略 router 的 `max_input_tokens` 與 `max_output_tokens`，而 `/model_group/info` 會對兩者都回報 `null`。

請在 router 項目的 `model_info` 中宣告它：

```yaml title="config.yaml"
- model_name: smart-router
  litellm_params:
    model: auto_router/complexity_router
    complexity_router_config:
      tiers:
        SIMPLE:    {{openai_small}}
        REASONING: {{openai_large}}
    complexity_router_default_model: {{openai_large}}
  model_info:
    max_input_tokens: 200000
    max_output_tokens: 64000
```

之後這兩個值會出現在 `/v1/models`、`/model/info` 與 `/model_group/info` 上，這正是用戶端與 LiteLLM UI 會讀取的內容。它們僅供參考。沒有任何機制會依據 router 項目上宣告的 window 對請求進行門檻控制、升級或拒絕，因此請選擇一個能如實向呼叫端描述 router 的數字；請求可能落到的最小 window 是保守選擇，而最大值則是樂觀選擇。

在一個 `model_name` 同時前置 router marker 與一般部署的情況下，`/model_group/info` 會回報該群組中最大的 `max_input_tokens`，而不是最小值，因為 model-group 中繼資料是依各 deployment 的最大值彙總。

:::info[Router 項目的成本欄位讀取為零]

`/model_group/info` 會將 `input_cost_per_token` 和 `output_cost_per_token` 報告為 `0.0`，作為自動路由器，且其 `providers` 會作為空字串，因為策略別名上的自訂定價會刻意排除在成本對應表之外。支出仍會根據提供請求的階層模型進行追蹤，因此這些零值只是此中繼資料檢視中的落差，而不是未追蹤的用量。

:::

### 什麼會強制套用此視窗 {#what-enforces-the-window}

路由會先解析。路由器先選出一個階層，標記會從候選池中移除，而之後的一切都會成為套用到所選模型的標準模型群組行為：部署選擇、冷卻時間、標籤路由，以及針對該部署自身 `max_input_tokens` 的上下文視窗請求前檢查。因此，強制執行取決於 `router_settings.enable_pre_call_checks: true`，以及是否已為階層部署宣告或可解析出一個視窗，從不取決於路由器項目。請參閱 [上下文視窗備援](./reliability.md#context-window-fallbacks-pre-call-checks--fallbacks)。

`context_window_fallbacks` 會先依路由器選定的階層、再依用戶端第二個呼叫的名稱來解析，因此以 `smart-router` 或該階層自身的模型群組為鍵的鏈都會被遵循。

`auto_router_max_input_chars` 與這些都無關。它會截斷傳給與語意路由器上路由相符的嵌入模型的文字，預設為 2000 個字元。

### 上下文視窗升級 {#context-window-escalation}

從 v1.101.0 開始，複雜度路由器可在派發前檢查所決定的階層是否能容納提示，若明確無法容納，便將請求移走。此功能預設為關閉，因此省略該鍵的路由器會僅依複雜度派發；設定 `enable_context_window_escalation: true` 即可將其開啟。

```yaml title="config.yaml"
complexity_router_config:
  enable_context_window_escalation: true   # default false
  context_window_escalation_buffer: 0.95   # default
```

此估算涵蓋整個提示足跡，包括最上層的 `system` 區塊、Responses API `instructions`，以及序列化的工具定義，這些在 coding-agent 流量中承載了大部分負載。當數量落在其宣告視窗的 `context_window_escalation_buffer` 之內時，某個階層模型即符合條件，因此預設會保留 5% 的餘裕，而不是拿接近上限的提示去賭。若只有部分階層模型符合，該階層會保留請求，而選擇會縮小到那些模型；若沒有任何模型符合，請求會移到持有明確可容納模型的下一個較高階層。

未知視窗在兩個方向都會被忽略。沒有可解析視窗的模型群組永遠不會被升離，因為無法證明它不符合，也永遠不會被升到，因為同樣無法證明它符合。只要某個群組的任一部署缺少視窗，該群組就會被視為未證明，因為群組的安全性只和其中最小的成員一樣高。當任何地方都無法明確符合時，已分類的階層維持不變且請求照常派發，因此升階絕不會自行觸發，也絕不會改派到 `complexity_router_default_model`。

視窗升階會在每個階層部署上讀取 `model_info.max_input_tokens`，並回退到模型成本對應表。在路由器項目上宣告視窗在此無效。升階後的決策會將 `context_escalated` 與分類器最初選取的階層一起記錄，而且它們絕不會被工作階段固定，因此當工作階段如此運作時，路由也會隨之回落。

這兩個鍵都必須放在 `complexity_router_config` 之內。直接在 `litellm_params` 下方更上層設定任一鍵，會在載入時以及管理端點寫入時遭到拒絕，而不是被悄悄忽略。

## 努力階梯 {#effort-ladders}

切換模型並不是路由器唯一能往上爬升的軸。推理努力度會以相同的每個權杠成本改變請求所花費的輸出 token 數，而切換模型則會改變請求中每個 token 的費率，因此在便宜模型上提升努力度，往往是更便宜的下一步，而且值得在階層梯子伸手去拿前沿模型之前先耗盡。

表達這件事不需要任何新內容。為每一級宣告一個 `model_list` 項目，除了其 `litellm_params` 中的推理參數外，其餘皆相同，並將各階層指向那些名稱。當路由器回傳某個階層的模型名稱時，該名稱會解析為其部署，而該部署自身的 `litellm_params` 會合併到外送請求中，且呼叫端明確送出的任何內容都會勝出。因此，設定了 `reasoning_effort` 的用戶端會保留其值，而其他所有人都會取得該級別。

```yaml
model_list:
  - model_name: {{openai_small}}-low
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      reasoning_effort: low

  # same model and the same per-token rate as the rung above, more thinking
  - model_name: {{openai_small}}-high
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      reasoning_effort: high
  - model_name: {{openai_small}}-xhigh
    litellm_params:
      model: openai/{{openai_small}}
      api_key: os.environ/OPENAI_API_KEY
      reasoning_effort: xhigh

  # top rung: a different rate on every token
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      drop_params: true
      complexity_router_config:
        tiers:
          SIMPLE:    {{openai_small}}-low
          MEDIUM:    {{openai_small}}-high
          COMPLEX:   {{openai_small}}-xhigh
          REASONING: {{openai_large}}
      complexity_router_default_model: {{openai_small}}-high
```

Anthropic 系列的級別會以相同方式使用 `thinking`，因為它是一般的 `litellm_params` 鍵：

```yaml
  - model_name: claude-sonnet-5-thinking
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
      thinking: {type: enabled, budget_tokens: 8192}
```

努力等級是每個模型的能力，因此請確認模型支援您要求的級別：`gpt-5-mini` 會拒絕 `xhigh`，而 `gpt-5.4-mini` 則接受它，若在路由器別名上設定 `drop_params: true`，會把該拒絕變成一個悄然被丟棄的參數，讀起來就像一個什麼都沒改變的階梯。還有兩件事要記住。成本追蹤會依其底層模型為每個級別定價，因此這種方式建構的階梯在支出上會顯示為同一個模型有多個努力等級，而不是多個獨立模型。而 `session_affinity` 會固定該級別的 `model_name`；快取命中時 TTL 會重新整理，而升階請求可能把固定點往上移一個階層，而不是讓它維持在硬性固定期間鎖定

## Python SDK {#python-sdk}

```python
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "{{openai_small}}",   "litellm_params": {"model": "{{openai_small}}"}},
        {"model_name": "{{openai_large}}",        "litellm_params": {"model": "{{openai_large}}"}},
        {"model_name": "claude-sonnet", "litellm_params": {"model": "{{anthropic}}"}},
        {"model_name": "claude-opus",   "litellm_params": {"model": "{{anthropic_large}}"}},
        {
            "model_name": "smart-router",
            "litellm_params": {
                "model": "auto_router/complexity_router",
                "complexity_router_config": {
                    "tiers": {
                        "SIMPLE":    "{{openai_small}}",
                        "MEDIUM":    "{{openai_large}}",
                        "COMPLEX":   "claude-sonnet",
                        "REASONING": "claude-opus",
                    },
                    "session_affinity": True,
                },
                "complexity_router_default_model": "{{openai_large}}",
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

Models + Endpoints > Add Model > Auto Router 分頁。輸入路由器名稱，然後按一下 **自動設定**，讓 LiteLLM 檢查您的 proxy 已提供的模型，為所有四個複雜度階層選出最佳可用模型，並為您填入表單。儲存之前請先檢視產生的階層。您也可以使用 **Template** 下拉式選單，選取其中一個內建範本來預填四個階層，或使用 **Custom Configuration** 自行填入。此 proxy 未提供其模型的範本會以灰色顯示，並標示缺少的名稱，因此任何可選項目都適用。其他所有設定都位於 **Detailed Configuration** 下方，預設為收合狀態，並以一行摘要說明目前包含的階層；展開後即可設定階層模型群組、階層顯示名稱、Semantic Keyword Matching、LLM Classifier、升階關鍵字，或 Adaptive。

**Test Routing** 會在不建立路由器或呼叫所選 completion 模型的情況下，將輸入通過表單的分類器。LLM 與 JEV 分類器呼叫，以及語意嵌入呼叫，都可能產生支出。**Test Connection** 會探測已設定的模型相依性，對於 JEV，則另外檢查分類是否成功。請參閱 [JEV Test Routing 與計費](#test-routing-and-accounting)

階層與分類器下拉式選單會排除嵌入模式模型；語意嵌入下拉式選單只列出嵌入模式模型。提交時四個階層都為必填；缺少的階層會在欄位內標示。

選擇 **LLM Classifier** 會顯示其模型、逾時與提示編輯器。**JEV Classifier** 會顯示 JEV 模型、逾時、斷路器與指示。兩者都會顯示分類器備援、**Context Window Size**、**Context Character Budget** 與 **Include Assistant Turns**。請參閱 [JEV 儀表板設定](/docs/auto_router/setup#create-or-edit-in-the-dashboard) 以了解建立與編輯流程

**Advanced > Session Affinity** 會保留工作階段固定，關閉以符合設定預設值。建立分頁與編輯對話框都會明確寫入該值，因此在 UI 中建立的路由器會記錄自身實際行為，而不是繼承預設值碰巧是什麼。

**Advanced > Compression** 會為路由決策選取壓縮防護欄，接著要嘛在模型呼叫中重用它，要嘛採用不同的防護欄，`None` 也包括在內。將路由器編輯回 *not configured* 不會清除已儲存的政策，因為模型更新會合併其收到的欄位，且永遠不會刪除鍵，因此在對話框中將這兩個步驟都選為 **None**，才是關閉壓縮的方式。舊版語意自動路由器（`auto_router/<name>`）可透過 `config.yaml` 與模型管理 API 接受這兩個欄位，但目前尚未在 UI 中提供控制項。

## Claude Code 與 Claude Desktop {#claude-code-and-claude-desktop}

有兩件事決定一個路由器是否會出現在 Claude 用戶端中，而其中只有一件與名稱有關：

1. **閘道模型探索只會挑出包含 `claude` 或 `anthropic` 的 `model_name`。** 這就是 Claude Code 在從 `/v1/models` 填入 `/model` 選擇器時套用的整個篩選條件；像 `smart-router` 這樣的名稱根本不會被自動探索。如果您直接將 `ANTHROPIC_MODEL` 或 `ANTHROPIC_CUSTOM_MODEL_OPTION` 指向它，它仍然可以正常運作，因為這樣會完全略過探索及其篩選條件。
2. **在 Claude for Teams 或 Enterprise 上，名稱必須位於組織的 `availableModels` 白名單中。** 任何不在白名單中的項目都會在 Claude Desktop 選擇器中顯示為灰色，並且在 CLI 啟動時被替換為 `restricted by your organization's settings`，不論該名稱看起來是否像 Anthropic。

白名單檢查是在用戶端執行，因此被排除的路由器不會在 LiteLLM 記錄中留下任何可供說明的資訊。請參閱 [Claude Code 與 Claude Desktop 的自動路由器](../tutorials/claude_code_autorouter.md)。

## 另請參閱 {#see-also}

- 公告文章：[Auto Router v2: one router for complexity, semantic, and adaptive routing](/blog/autorouter-v2)
- 本機 Claude Code 預覽：[lite autoroute](../learn/autorouter_cli.md)
- 舊版語意路由器：[Semantic Auto Router（已棄用）](./auto_routing_semantic.md)
