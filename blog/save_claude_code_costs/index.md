---
slug: save-claude-code-costs-with-litellm
title: "透過 LiteLLM 降低 Claude Code 成本的 5 種方式"
date: 2026-07-04T10:00:00
authors:
  - krrish
description: "平台管理員可在 LiteLLM proxy 上採取的實用槓桿，用來降低 Claude Code 支出，而無需要求開發者做任何變更。"
image: ./title_card.png
tags: [claude-code, cost, budgets, headroom, mcp, prompt-caching]
hide_table_of_contents: false
---

![使用 LiteLLM 節省 Claude Code 成本的 5 種方式](./title_card.png)

Claude Code 是現代工程組織中最重度消耗輸入 token 的工具之一。冗長的工具迴圈、龐大的檔案讀取，以及包含數百個工具的 MCP 目錄，會讓每個請求都推到 context window 的頂端，而帳單也隨之攀升。

如果 Claude Code 已經透過 `ANTHROPIC_BASE_URL` 指向 LiteLLM proxy，平台管理員可以透過五個槓桿來降低成本。這些方法都不需要在用戶端做任何變更。

{/* truncate */}

## 1. 預算視窗 + 預算備援 {#1-budget-windows--budget-fallbacks}

虛擬金鑰上的兩個旋鈕。

**預算視窗** 會限制金鑰在滾動時間區間內可花費的金額。設定 `max_budget`（美元）與 `budget_duration`（"24h"、"7d"、"30d" 等）。LiteLLM 會在每個視窗結束時自動重設計數器。您也可以疊加視窗，例如每天 10 美元且每月 100 美元，這樣某個糟糕的下午就不會燒掉整個月的預算：

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

**預算備援** 決定當某個模型的預算耗盡後會發生什麼。不要在開發者的終端機直接報錯，而是為每個模型附加 `model_max_budget` 與一條 `budget_fallbacks` 鏈，指定要重新路由到哪些更便宜的模型。請求會無聲地降級到仍在自身預算內的第一個備援：

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

一旦開發者在一天內把 Opus 花掉 20 美元，後續的 Opus 請求就會無聲地重新路由到 Sonnet；如果 Sonnet 也用完了，Haiku 就會接手。沒有 `model_max_budget` 項目的備援模型會被視為無上限。

**→ 了解更多：** [預算視窗](../../docs/proxy/users#set-multiple-budget-windows-on-a-key) · [預算備援](../../docs/proxy/budget_fallbacks)

## 2. 自動提示快取  {#2-automatic-prompt-caching}

Claude 的提示快取讀取一次快取命中的成本，大約只有全新輸入 token 的 10%，但前提是請求要用 `cache_control` 標記正確的訊息。LiteLLM 會為您注入這個標記：將 `cache_control_injection_points` 指向 system 訊息（或倒數第二個 user 回合），透過 proxy 的每一次 Claude Code 呼叫都會自動帶上這個 checkpoint，完全不需要修改用戶端。

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

若要在所有請求中自動注入這項設定，請這樣做 

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

將 'prompt_caching' 作為 pre call check 開啟，表示如果您執行同一個 Claude 模型的多個部署，LiteLLM 會智慧地路由到最初用於該請求的模型部署。 

**→ 了解更多：** [自動注入提示快取 checkpoint](../../docs/tutorials/prompt_caching) · [Claude Code - 提示快取路由](../../docs/tutorials/claude_code_prompt_cache_routing)

## 3. 提示壓縮（Headroom） {#3-prompt-compression-headroom}

提示快取會裁掉靜態前綴；Headroom 則會裁掉動態中段。工具輸出、檔案讀取、資料庫傾印，以及 RAG payload 會在送到模型之前被重寫成壓縮格式，而如果模型實際上需要原始位元組，則會透過 `retrieve_headroom` 工具呼叫按需擷取。據報的節省幅度，在 Claude Code 流量中可壓縮部分可達 60-95%。

Headroom 以 sidecar container 的形式在 LiteLLM 旁邊執行。將它註冊為 `pre_call` 防護欄，然後切換 `default_on: true`，或將它附加到每位開發者的虛擬金鑰。

```yaml title="config.yaml"
guardrails:
  - guardrail_name: headroom-compression
    litellm_params:
      guardrail: headroom
      mode: pre_call
      api_base: https://your-headroom-service
      default_on: true
```

開發者仍然會匯出 `ANTHROPIC_BASE_URL` 並執行 `claude`；他們唯一注意到的變化，是支出紀錄上的數字變小了。

**→ 了解更多：** [Headroom 防護欄設定指南](../../docs/proxy/headroom)

## 4. 延後 MCP 工具 {#4-defer-mcp-tools}

一個連接到五六個 MCP 伺服器的 Claude Code 工作階段，很容易顯示出幾百個工具，而這些工具 schema 會在每一次 `tools/list` 呼叫時一併送出。對於每回合只使用兩三個工具的工作負載來說，這完全就是輸入 token 的額外開銷。

在虛擬金鑰上開啟 `mcp_tool_search_enabled`，LiteLLM 就會把完整目錄替換成兩個虛擬工具：`mcp_tool_search` 與 `mcp_tool_call`。模型會依關鍵字搜尋，取得排序後的比對結果，然後呼叫它要的那一個。工具列舉的 token 成本會從數百個 schema 縮減為兩個。

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

排序是依據 `name + description` 的 token 重疊，因此不需要執行 embedding 依賴。存取範圍不會擴大；搜尋只會回傳該金鑰原本就允許呼叫的工具。

**→ 了解更多：** [MCP 工具搜尋](../../docs/mcp_tool_search)

## 5. 自動路由 {#5-auto-routing}

將每個請求送往能處理它的最小模型，讓便宜的請求永遠不會碰到昂貴模型。LiteLLM 提供三種形式：Semantic（embedding 比對）、Complexity（規則式、零外部呼叫）以及 Adaptive（從即時流量學習，beta）。

Complexity router 是最容易設定的。將 Claude Code 指向 `smart-router`，它就會將每個請求分類到不同等級：

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

**→ 了解更多：** [Complexity Router](../../docs/proxy/auto_routing#complexity-router) · [Semantic 自動路由](../../docs/proxy/auto_routing) · [Adaptive Router](../../docs/adaptive_router)

## 疊加這些槓桿 {#stacking-the-levers}

這五項功能可以組合使用。無論您還做了什麼，基於預算的備援都會限制總支出。提示快取 checkpoint 與 Headroom 壓縮會在請求到達模型之前，各自削去不同部分的負載。MCP 工具搜尋會在每一回合的前端削減工具 schema 的開銷。自動路由會將每個請求送往能處理它的最小模型。把它們一起開啟，原本同樣的 Claude Code 工作負載就能以過去一小部分的輸入 token 執行，而且不需要碰任何開發者的機器。

## 幫助我們讓這件事更好 {#help-us-make-this-better}

我們正在積極投資整個堆疊的成本最佳化。如果您對自動路由、更好的快取啟發式、更智慧的預算政策，或任何其他想法有建議，歡迎到 [litellm#32172](https://github.com/BerriAI/litellm/discussions/32172) 一起討論。
