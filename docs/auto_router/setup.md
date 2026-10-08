---
title: Admin Setup
sidebar_label: Admin Setup
description: 透過儀表板、代理程式技能、config.yaml、模型管理 API 或 lite autoroute 建立並設定 Auto Router。
---

import NavigationCards from '@site/src/components/NavigationCards';

使用以下方法之一為您的團隊建立 Auto Router。若要將您的程式碼代理程式連接到既有的 router，請依照 [使用者設定](/docs/auto_router/user_setup) 操作。

設定完成後，[自訂您的分類器](./optimize_classifier.md) 會說明每個分類設定，並提供儀表板截圖，以及 heuristic/LLM 鏈、提示、上下文與自架分類器的對應 YAML。

共有五種方式。全部都會建立相同的 `auto_router/complexity_router` 部署。

<NavigationCards
columns={5}
items={[
  { title: "新增 Auto Router", description: "Models + Endpoints → Auto Router，接著測試並儲存。", to: "#add-an-auto-router-models--endpoints--auto-router" },
  { title: "代理程式技能", description: "只要在您的程式碼代理程式加一行。", to: "#agent-skill" },
  { title: "config.yaml", description: "在 model_list 中加入一筆 router 項目。", to: "#configyaml" },
  { title: "模型管理 API", description: "POST /model/new，供 CI/CD 使用。", to: "#model-management-api" },
  { title: "lite autoroute", description: "在本機試用，不必碰觸 proxy。", to: "#lite-autoroute" },
]}
/>

## 新增 Auto Router (Models + Endpoints → Auto Router) {#add-an-auto-router-models--endpoints--auto-router}

![Models + Endpoints 中的新增 Auto Router 對話框，含自動設定與範本選項](../../blog/autorouter_setup_and_testing/auto-setup.png)

- 在 LiteLLM Dashboard 中，前往 **Models + Endpoints** 並開啟 **Auto Router** 分頁。新增一個 Auto Router 模型，或啟用並設定既有模型。
- 輸入 Auto Router 名稱，然後選擇 **Configure automatically** 或選取一個範本。檢視產生的 tiers、測試路由，然後儲存。
- **Configure automatically** 會檢查您的 proxy 已提供哪些模型，為全部四個複雜度 tier 選出最佳可用模型，並自動為您填入表單。
- 範本：1M Context、Anthropic Family、OpenAI Family、Gemini Family、Lite。每個範本都會從您的 proxy 已提供的模型填入全部四個 tier。
- 若某個範本的模型尚未部署，該範本會呈現灰色，並列出缺少的名稱。
- **Test Routing** 會透過分類器送出一則提示，並顯示它會選擇的模型。此操作不會建立任何內容，也不會呼叫所選模型。
- **Test Connection** 會針對每個 tier 模型群組執行最小請求。綠色代表使用您的憑證可連線。
- **Detailed Configuration** 包含其餘設定：關鍵字規則、LLM 分類器與提示、升級關鍵字、自適應池。

範本對應的 config.yaml： [建議設定](/docs/auto_router/recommended_configurations)。發布文章：[AutoRouter: 1 Click Deploy](/blog/auto-router-setup-and-testing)。

## 代理程式技能 {#agent-skill}

```
run curl -fsSL https://docs.litellm.ai/skills/auto-router and follow the instructions
```

- 讀取您的 proxy 已提供的模型。
- 會詢問 router 名稱以及每個 tier 的模型。
- 在寫入任何內容之前，會先說明它假設的預設值。

## config.yaml {#configyaml}

```yaml title="config.yaml"
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

- tiers 會在同一個檔案中為其他 `model_name` 項目命名，因此每個 tier 都是 proxy 已知的部署。
- `complexity_router_default_model` 會在 router 無法決定時提供服務。
- 沒有 `classifier_type` 代表 heuristic scorer：免費，且不會增加延遲。
- 使用小型模型的 `classifier_type: llm` 能以每次請求幾分之一美分的成本提升 agent 流量的準確度。請參閱 [基準測試](/docs/auto_router/benchmarks)。
- 其餘所有內容（關鍵字規則、tier pools、session affinity、scorer 調校）：[設定參考](/docs/proxy/auto_routing)。

## JEV 分類器 (TypeSafe AI) {#jev-classifier-typesafe-ai}

本節使用已發布建置版本支援的 Jev 設定與儀表板標籤。新的 **OSS Classifier** 設定需要 [backend #43626](https://github.com/BerriAI/litellm/pull/43626)，而其儀表板需要 [UI #43768](https://github.com/BerriAI/litellm/pull/43768)。請參閱 [OSS classifiers](/docs/auto_router/decision_classifiers) 了解託管 Jev、自架 Nimble 和 Laya，以及 [從現有名稱遷移](/docs/auto_router/decision_classifiers#migrate-an-existing-jev-or-nimble-router)。新的 backend 仍可接受以下設定。

`classifier_type: jev` 使用 TypeSafe System One Choice evaluation，在現有的 Auto Router 中選出某個 tier。LiteLLM 會將分類器輸入傳送到 `POST /v1/systemone` 作為 `state`，並附上一個 `questions.tier` 問題，其準則描述已設定的 tiers。所選 tier 的模型會提供 completion

### 設定伺服器金鑰 {#set-the-server-key}

透過您的部署密鑰管理系統，在 proxy 程序中佈建 `TYPESAFE_API_KEY`。儀表板不需要提供者金鑰。用戶端會繼續使用 LiteLLM 虛擬金鑰

```bash
export TYPESAFE_API_BASE="https://api.typesafe.ai"
litellm --config config.yaml
```

`TYPESAFE_API_BASE` 為選用，預設為 `https://api.typesafe.ai`。若省略 `jev_classifier_config.api_key` 和 `api_base`，則會使用這些伺服器設定。缺少 TypeSafe 金鑰會阻止 JEV 初始化。明確的 `api_base` 需要明確的 `api_key`，因此設定覆寫不能將伺服器的環境金鑰重新導向到其他主機。使用管理 API 的團隊成員無法設定這兩個欄位

### 在儀表板中建立或編輯 {#create-or-edit-in-the-dashboard}

在 **Models + Endpoints** 中，開啟 **Auto Router** 並新增一個 router，或編輯既有 router。設定其 tier 模型，然後在 Detailed Configuration 的 **Classification Method** 下選擇 **JEV Classifier**

設定 **JEV Model**（預設為 `jev-latest`）與 **JEV Timeout (ms)**（預設為 `3000`）。檢視 circuit breaker、classifier fallback、**Context Window Size**、**Context Character Budget**，以及 assistant-turn 設定。企業版使用者可以用 **JEV Instructions** 取代內建 rubic，或還原內建指示

JEV 使用與 LLM classifier 相同的歷史預設值：在 8,000 字元的前次對話預算內，最多三個先前的使用者回合，不包含 assistant 回合。這段歷史會傳送到已設定的 TypeSafe endpoint，其可與您的 completion provider 不同。將 **Context Window Size** 設為 `0` 可省略歷史；目前的 ask 和所選系統文字仍會傳送

將既有的 JEV router 升級到 [儀表板與上下文整合](https://github.com/BerriAI/litellm/pull/41886) 時，省略這些設定會啟用那些預設值。若 router 應繼續不傳送前一段對話，請在升級前設定 `classifier_context_window_size: 0`

**Test Routing** 會對您的輸入進行分類，而不建立 router 或呼叫所選 completion 模型。它可能會產生一次付費的 JEV 請求，而語意關鍵字比對也可能會產生一次付費的 embedding 請求。**Test Connection** 會檢查已設定的模型相依性，並進行單獨的 JEV 分類探測。若路由使用了備援，即使所選 completion 模型可連線，其 JEV 結果也會回報錯誤。這些探測可能會產生提供者費用

儲存 router，並透過一般 completion API 呼叫其模型名稱。重新開啟編輯表單以變更分類器設定。若要調查某次決策，請在 routing-decision 卡片中檢視其原因與分類器中繼資料，而不是假設完成成功就代表 JEV 已回應

### 在 YAML 中設定 {#configure-in-yaml}

將此 router 項目與 tier deployments 一同新增到您的 `model_list` 中。tier 值與預設模型必須命名為 proxy 上已設定的部署

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

此範例明確選擇 `default_model` 備援。隨附的 `classifier_fallback` 預設值是 `heuristic`。前次對話字元預算不會限制目前的 ask 或 system 文字，因此請將分類器輸入與 completion 模型的 context window 分開檢視

內建 JEV 分類使用與內建 LLM classifier 相同的授權政策。自訂 `instructions` 和 `tier_definitions` 使用既有的 Enterprise 自訂分類器能力。JEV 也支援 `enable_non_reasoning_tier`

請參閱 [JEV 參考](/docs/proxy/auto_routing#jev-classifier) 了解預設值、上下文、復原、授權與帳務，[量測比較](/blog/jev-auto-router-benchmark) 了解品質與成本範圍，以及 [TypeSafe pass-through](/docs/pass_through/typesafe) 以直接呼叫 System One

## 模型管理 API {#model-management-api}

適用於 CI/CD 或指令碼時，請使用 `POST /model/new` 建立相同的部署。請先啟用 `store_model_in_db`；Auto Routers 是模型部署，因此沒有單獨的 `/auto_router/new` 端點。此範例使用 [Anthropic Family 預設](/docs/auto_router/recommended_configurations#anthropic-family)；請先建立所引用的模型部署。

```bash
curl -X POST "http://localhost:4000/model/new" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "claude-auto",
    "litellm_params": {
      "model": "auto_router/complexity_router",
      "complexity_router_config": {
        "tiers": {
          "SIMPLE": "claude-haiku-4-5",
          "MEDIUM": "{{anthropic}}",
          "COMPLEX": "{{anthropic_large}}",
          "REASONING": "claude-opus-5-high"
        },
        "classifier_type": "heuristic",
        "escalation_keywords": ["LITELLM ESCALATE"],
        "session_affinity": false
      },
      "complexity_router_default_model": "{{anthropic}}"
    }
  }'
```

回應包含 `model_id`。將其與 `PATCH /model/{model_id}/update` 搭配使用以進行部分變更，並透過其 `model_name` 呼叫路由器。使用 `POST /auto_router/validate_complexity_router_config` 儲存前驗證複雜度組態。請參閱 [模型管理](/docs/proxy/model_management) 以了解部署 CRUD，並參閱 [組態參考](/docs/proxy/auto_routing) 以查看完整的路由器負載。

## lite autoroute {#lite-autoroute}

- 建立一個臨時的本機代理，將每個請求轉送到您的實際代理。
- 在該工作階段中，透過它路由 Claude Code 流量。沒有任何流量會繞過實際代理，而且其組態不會受到影響。
- 指南：[lite autoroute](/docs/learn/autorouter_cli)。

## Claude Code 和 Claude Desktop {#claude-code-and-claude-desktop}

- Claude Code 會從 `/v1/models` 填入其模型選擇器，並僅保留名稱包含 `claude` 或 `anthropic` 的項目。請相應地命名路由器，或直接設定 `ANTHROPIC_MODEL`。
- 在 Claude for Teams 或 Enterprise 上，確切的路由器名稱必須位於組織允許清單中。此檢查在用戶端執行，因此遭拒的路由器不會在閘道記錄中留下任何內容。
- 在您於 `model_info` 中宣告之前，路由器不會顯示任何 context window，而 Claude Code 會套用其自己的預設值，無論如何皆然。雙方皆可參閱：[context window](/docs/proxy/auto_routing#context-window)。
- 教學：[使用 Claude Code 和 Claude Desktop 的 Auto Router](/docs/tutorials/claude_code_autorouter)。
