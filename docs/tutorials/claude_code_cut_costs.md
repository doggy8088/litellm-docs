# Claude Code - 降低成本 {#claude-code---cut-costs}

Claude Code 是現代工程組織中最重度消耗輸入 token 的工具之一。冗長的工具迴圈、大型檔案讀取，以及擁有數百個工具的 MCP 目錄，會讓每個請求都推向內容視窗的上限，而帳單也會隨之攀升。

如果 Claude Code 已經指向 LiteLLM proxy（透過 `ANTHROPIC_BASE_URL`），平台管理員可以透過五個槓桿來降低成本。這些都不需要變更用戶端。

## 1. 預算視窗 + 預算備援 {#1-budget-windows--budget-fallbacks}

虛擬金鑰上的兩個設定。

**預算視窗** 會限制金鑰在滾動時間區間內可花費的金額。設定 `max_budget`（美元）以及 `budget_duration`（"24h"、"7d"、"30d" 等）。LiteLLM 會在每個視窗結束時自動重設計數器。您也可以疊加視窗，例如每天 $10 且每月 $100，這樣某個糟糕的午後就不會把整個月的預算燒光：

```bash
curl 'http://0.0.0.0:4000/key/generate' \
  --header 'Authorization: Bearer <your-master-key>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "budget_limits": [
      {"budget_duration": "24h", "max_budget": 10},
      {"budget_duration": "30d", "max_budget": 100}
    ]
  }'
```

**預算備援** 決定當某個模型的預算耗盡後會發生什麼事。不要在開發者的終端機上直接報錯，而是為每個模型附加 `model_max_budget`，並設定一條命名較便宜模型的 `budget_fallbacks` 鏈以重新路由。請求會悄悄降級到第一個仍在自身預算內的備援：

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model_max_budget": {
      "claude-opus-4-8":   {"budget_limit": 20.0, "time_period": "1d"},
      "claude-sonnet-5":   {"budget_limit": 10.0, "time_period": "1d"},
      "claude-haiku-4-5":  {"budget_limit": 5.0,  "time_period": "1d"}
    },
    "budget_fallbacks": {
      "claude-opus-4-8":  ["claude-sonnet-5", "claude-haiku-4-5"],
      "claude-sonnet-5":  ["claude-haiku-4-5"]
    }
  }'
```

一旦開發者在一天內把 Opus 花了 $20，後續的 Opus 請求就會悄悄重新路由到 Sonnet；如果 Sonnet 也用完了，Haiku 會接手。沒有 `model_max_budget` 條目的備援模型會被視為無上限。

深入了解：[預算視窗](../proxy/users#set-multiple-budget-windows-on-a-key) 與 [預算備援](../proxy/budget_fallbacks)。

## 2. 自動提示快取 {#2-automatic-prompt-caching}

Claude 的提示快取在命中時，費用約為新輸入 token 的 10%，但前提是請求要用 `cache_control` 標記正確的訊息。LiteLLM 會替您注入這個標記：將 `cache_control_injection_points` 指向系統訊息（或倒數第二個使用者回合），透過 proxy 的每次 Claude Code 呼叫都會自動帶上該 checkpoint，完全不需要修改用戶端。

```yaml title="config.yaml"
model_list:
  - model_name: claude-sonnet-4-5
    litellm_params:
      model: anthropic/claude-sonnet-4-5
      api_key: os.environ/ANTHROPIC_API_KEY
      cache_control_injection_points:
        - location: message
          role: system

router_settings:
  optional_pre_call_checks: ["prompt_caching"]
```

若要在所有請求中自動注入，請使用以下設定：

```yaml title="config.yaml"
model_list:
  - model_name: claude-sonnet-4.5-20250929
    litellm_params:
      model: vertex_ai/claude-sonnet-4-5@20250929
      # ...

router_settings:
  default_litellm_params:
    cache_control_injection_points:
      - location: message
        role: system
  optional_pre_call_checks: ["prompt_caching"]
```

啟用 'prompt_caching' 作為 pre call check 時，表示如果您執行同一個 Claude 模型的多個部署，LiteLLM 會智慧地將路由導向最初用於該請求的模型部署。

深入了解：[自動注入提示快取 checkpoint](./prompt_caching) 與 [Claude Code - 提示快取路由](./claude_code_prompt_cache_routing)。

## 3. 提示壓縮（Headroom） {#3-prompt-compression-headroom}

提示快取會裁剪靜態前綴；Headroom 會裁剪動態中段。工具輸出、檔案讀取、資料庫傾印，以及 RAG 負載，在送達模型之前都會被重寫成壓縮格式；如果模型真的需要原始位元組，則可透過 `retrieve_headroom` 工具呼叫按需擷取。據報在 Claude Code 流量可壓縮部分的節省幅度可達 60-95%。

Headroom 以 sidecar container 的形式與 LiteLLM 併行執行。將其註冊為 `pre_call` 防護欄，並切換 `default_on: true`，或將其附加到每位開發者的虛擬金鑰。

```yaml title="config.yaml"
guardrails:
  - guardrail_name: headroom-compression
    litellm_params:
      guardrail: headroom
      mode: pre_call
      api_base: https://your-headroom-service
      default_on: true
```

開發者仍然會匯出 `ANTHROPIC_BASE_URL` 並執行 `claude`；他們唯一注意到的，是 spend log 上的數字變小了。

深入了解：[Headroom 防護欄設定指南](../proxy/headroom)。

## 4. 延後 MCP 工具 {#4-defer-mcp-tools}

連接到五六個 MCP server 的 Claude Code session，很容易就會顯示出幾百個工具，而這些工具 schema 會在每一次 `tools/list` 呼叫中全數送出。對於每回合只會用到兩三個工具的工作負載來說，這完全是輸入 token 的額外負擔。

在虛擬金鑰上啟用 `mcp_tool_search_enabled`，LiteLLM 就會以兩個虛擬工具 `mcp_tool_search` 與 `mcp_tool_call` 取代完整目錄。模型會依關鍵字搜尋，取得排序後的結果，然後呼叫它想要的工具。工具列出的 token 成本會從數百個 schema 縮減為兩個。

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "object_permission": {
      "mcp_tool_search_enabled": true,
      "mcp_servers": ["github", "slack", "linear", "jira"]
    }
  }'
```

排序是基於 `name + description` 的 token-overlap，因此不需要執行 embedding 依賴。存取範圍不會擴大；搜尋只會回傳該金鑰原本就被允許呼叫的工具。

深入了解：[MCP 工具搜尋](../mcp_tool_search)。

## 5. 自動路由 {#5-auto-routing}

將每個請求送往能處理它的最小模型，這樣便宜的請求就不會碰到昂貴的模型。LiteLLM 提供三種版本：Semantic（embedding 比對）、Complexity（規則式、零外部呼叫）以及 Adaptive（從即時流量學習，beta）。

Complexity router 是最快設定好的。將 Claude Code 指向 `smart-router`，它會把每個請求分類到不同層級：

```yaml title="config.yaml"
model_list:
  # Target models
  - model_name: gpt-4o-mini
    litellm_params:
      model: gpt-4o-mini

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o

  - model_name: claude-sonnet
    litellm_params:
      model: claude-sonnet-4-20250514

  - model_name: o1-preview
    litellm_params:
      model: o1-preview

  # Complexity router
  - model_name: smart-router
    litellm_params:
      model: auto_router/complexity_router
      complexity_router_config:
        tiers:
          SIMPLE: gpt-4o-mini
          MEDIUM: gpt-4o
          COMPLEX: claude-sonnet
          REASONING: o1-preview
      complexity_router_default_model: gpt-4o
```

深入了解：[Complexity Router](../proxy/auto_routing#complexity-router)、[Semantic Auto Routing](../proxy/auto_routing) 與 [Adaptive Router](../adaptive_router)。

## 疊加這些槓桿 {#stacking-the-levers}

這五個功能可以組合使用。基於預算的備援可不受其他作法影響地限制總支出。提示快取 checkpoints 與 Headroom 壓縮會在請求負載送進模型前，各自削減不同部分。MCP 工具搜尋則會在每回合一開始減少工具 schema 的額外負擔。自動路由會把每個請求送往能處理它的最小模型。一起啟用後，同樣的 Claude Code 工作負載所消耗的輸入 token 只剩先前的一小部分，而且完全不需要動到任何開發者的電腦。

## 協助我們讓這件事更好 {#help-us-make-this-better}

我們正積極投資整個技術堆疊的成本最佳化。如果您有想法，無論是自動路由、更好的快取啟發式、更聰明的預算政策，或任何內容，歡迎到 [litellm#32172](https://github.com/BerriAI/litellm/discussions/32172) 參與討論。
