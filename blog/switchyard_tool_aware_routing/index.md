---
slug: switchyard-tool-aware-routing
title: "使用 NVIDIA NeMo Switchyard 為程式設計代理程式進行工具感知模型路由"
date: 2026-11-06T09:00:00
authors: [joshua]
description: "LiteLLM 現在會依工具執行歷史引導每個程式設計代理程式工作階段，讓例行工作留在高效率模型上，並在軌跡變得困難時升級至能力更強的模型。"
tags: [engineering, routing]
hide_table_of_contents: true
---

import { RoutingFlow, ConfigureRouter, SessionTimeline } from './diagrams';

LiteLLM 現在將 NVIDIA NeMo Switchyard 的 stage router 作為 auto-router 策略之一隨附提供。Switchyard 依代理程式的工具軌跡進行路由，而不是依提示：它呼叫過哪些工具、如何失敗，以及它正在收斂還是在重試同一個步驟。每個回合都會被引導至該工作階段在任務當下所需的模型。

程式設計代理程式的成本曲線並不均勻。任務的大部分是探索與漸進式編輯，高效率模型就能處理得很好。昂貴的區段集中在失敗周圍，代理程式必須診斷錯誤、修正作法並驗證修正。Switchyard 讓模型花費與這樣的曲線一致，涵蓋 Chat Completions、Anthropic Messages 與 Responses，因此 Claude Code、Codex 與以 SDK 為基礎的代理程式無需變更用戶端即可採用。

{/* truncate */}

## 依工具軌跡引導工作階段 {#steer-the-session-by-its-tool-trajectory}

以提示為基礎的路由對代理程式並不適用，因為使用者訊息幾乎無法透露難度的訊號。像「continue」這樣的後續指令，在測試通過之後與第三次修正失敗之後看起來完全一樣。差異存在於工具結果之中。

Switchyard 會從工作階段近期的工具歷史對每個回合進行分類。失敗會依嚴重程度加權，從非零結束碼到嚴重錯誤。重複的相同失敗與上下文壓縮會強制升級。失敗後出現通過的測試執行會被識別為恢復。所得分數會將該回合對應至高效率模型或能力更強的模型。

<RoutingFlow />

**每個路由決策都可以追溯到產生它的軌跡。** 當工具訊號無法下定論時，Switchyard 可以交由裁判判斷，可以是 LLM 裁判，也可以是像 TypeSafe Jev 這樣的決策模型。裁判只會針對這些回合被呼叫，因此有把握的決策不會增加延遲或成本。

## 設定一次，服務所有代理程式 API {#configure-once-serve-every-agent-api}

Switchyard 是 Add Auto Router 表單中的一等策略，與 Heuristics、LLM 和 Decisions Model 並列。一個 router 需要一個能力更強的模型、一個高效率模型，以及選擇性的裁判。

<ConfigureRouter />

**單一 router 名稱即可服務 Claude Code、Codex 與 OpenAI SDK 代理程式。** 三種 API 之間的請求轉換在 proxy 中完成，因此無論哪個用戶端呼叫，路由行為都相同。等效的設定只需幾行 YAML。

```yaml
model_list:
  - model_name: claude-haiku
    litellm_params: {model: anthropic/claude-haiku-5-5, api_key: os.environ/ANTHROPIC_API_KEY}
  - model_name: claude-opus
    litellm_params: {model: anthropic/claude-opus-5-5, api_key: os.environ/ANTHROPIC_API_KEY}
  - model_name: switchyard-route
    litellm_params:
      model: auto_router/switchyard
      switchyard_router_config:
        models: {capable: claude-opus, efficient: claude-haiku}
```

Claude Code 只要指向 proxy 並以 router 名稱作為其模型即可連線。

```bash
ANTHROPIC_BASE_URL=http://localhost:4000 ANTHROPIC_AUTH_TOKEN=$LITELLM_API_KEY ANTHROPIC_MODEL=switchyard-route claude
```

## 軌跡感知路由以工作階段為單位 {#trajectory-aware-routing-treats-the-session-as-the-unit}

逐請求路由對代理程式有結構性的盲點。解決一次失敗需要跨越多個回合：閱讀錯誤、修正程式碼、重新執行測試。逐請求 router 會孤立地評估這些回合，而第一個乾淨的中間結果就足以在修正途中把工作階段降回高效率模型。

Switchyard 會維護工作階段的狀態。失敗訊號會在近期工具結果的滾動視窗上評估，因此嚴重的失敗在代理程式處理期間會持續計入。升級會讓後續回合保留在能力更強的模型上。當軌跡穩定下來、工作回到例行狀態時，工作階段會再降回來。

<SessionTimeline />

視窗大小與信心閾值都可以設定。自訂工具詞彙可擴充內建分類，因此內部或 MCP 工具可以宣告為 observe、mutate、plan 或 new，並貢獻相同的訊號。

**工作階段狀態彼此隔離，且每個決策都可稽核。** LiteLLM 會將工作階段狀態限定在擁有它的 API 金鑰範圍內，因此一個呼叫者無法影響另一個呼叫者的路由。每個決策都會連同所選模型與其背後的證據記錄在支出記錄中，讓您可以依工作階段分析成本與品質，並與其餘支出資料對照。

<div className="cost-launch-note">
<p><strong>現已提供</strong></p>
<p>Switchyard 現已作為 LiteLLM 的 auto-router 策略提供。請參閱 <a href="/docs/proxy/auto_routing">auto routing 文件</a> 開始使用。我們正與 Switchyard 團隊合作開發更多功能，請告訴我們您的代理程式接下來需要什麼。</p>
</div>
