---
title: Auto Router [附加元件]
sidebar_label: 總覽
description: 將每個請求路由到能夠良好回答它的最便宜模型。基準測試、設定、建議的組態、提示快取，以及如何在您自己的流量上評估路由器。
---

import NavigationCards from '@site/src/components/NavigationCards';
import AutoRouterDiagram from '@site/src/components/AutoRouterDiagram';

:::info[🚀 協助塑造 Auto-Router]

搶先取得存取權，直接與 LiteLLM 團隊合作，並透過您的生產流量影響路線圖。

<a className="button button--primary button--lg" href="https://calendar.app.google/i2e7qVEJphHi5S8UA">申請成為設計合作夥伴</a>

<br /><br />

已經在測試了嗎？請在 [discussion #32168](https://github.com/BerriAI/litellm/discussions/32168) 分享您的結果。

:::

<AutoRouterDiagram />

- **一鍵設定。** Configure 會自動檢查您的代理伺服器目前已提供的模型，並為您填入全部四個階層；無需選擇樣板。
- **用戶端只需一個模型名稱。** 閘道會分類每個請求並選擇模型。
- **每個階層皆可使用任何模型、任何提供者。** 單一模型、隨機池，或 Thompson 抽樣池。
- **分類器選擇。** 啟發式規則、LLM、透過 TypeSafe System One Choice 的 JEV、關鍵字規則，或自訂外掛
- **每個請求都會回報節省。** 相較於全前沿基準，在記錄中以及 Cost Optimization 中。
- **適用於代理程式。** 提示快取、上下文視窗升級、模態路由、任務中停滯升級，以及可選的工作階段固定。

## 結果 {#results}

| 結果 | 測量方式 | 了解更多 |
| --- | --- | --- |
| JEV：依分類延遲中位數比 Haiku 快 5.43 倍，且註冊表定價的分類器成本降低 96.12% | 80 個撰寫的合成案例，三次成對重複，在一個固定準則下，與撰寫的預期階層相符度為 95.00% 對 73.75% | [JEV 比較](/blog/jev-auto-router-benchmark) |
| Claude Opus-5 以低 27% 的成本達成解題率 | Terminal-Bench 2.0 的 21 任務子集，兩者皆完成 16/21 | [Terminal-Bench](/blog/auto-router-terminal-bench-benchmark) |
| Heuristic v2：在每個任務成本低 45% 的情況下，比 v1 多解出 27% 的任務 | 相同的 21 任務子集，未呼叫 LLM 分類器 | [Heuristic v2](/blog/heuristic-v2) |
| 以 87.3% 的前沿品質達成便宜 74.5% | RouterArena，8,399 個評分過的查詢 | [成本與品質](/blog/auto-router-cost-quality-benchmark) |
| 節省 51.1%，四個月內省下 $12,249 | 272,876 個生產請求，450+ 位使用者 | [生產案例研究](/blog/auto-router-production-savings) |
| 比只使用快取便宜 37% 到 69% | 包含實際閘道流量在內的五個資料集 | [提示快取](/blog/auto-router-prompt-caching-benchmark) |
| 在 88.1% 的回應上與目前模型相符或更勝一籌 | 對實際流量進行影子評估，143 個經判定的回合 | [影子評估](/blog/auto-router-shadow-evaluations) |

## 快速開始 {#quick-start}

- **儀表板：** Models + Endpoints、Add Model、Auto Router 分頁，輸入名稱，然後按一下 **Configure automatically** 或選擇樣板。檢閱階層、Test Routing，並儲存。
- **代理程式：** 告訴它 `run curl -fsSL https://docs.litellm.ai/skills/auto-router and follow the instructions`。
- **config.yaml：** 一個路由器項目，其階層命名同一檔案中的其他模型。

```yaml title="config.yaml" keep-model-ids
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

```shell
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{"model": "smart-router", "messages": [{"role": "user", "content": "What is 2+2?"}]}'
```

## 探索 {#explore}

使用 **OSS Classifier** 搭配代管 Jev 或自行代管 Nimble 和 Laya。[OSS 分類器指南](/docs/auto_router/decision_classifiers) 涵蓋設定、必要的閘道與儀表板建置，以及從現有 Jev 組態的遷移。請參閱 [分類器參考資料](/docs/proxy/auto_routing#jev-classifier) 以了解上下文、備援和計費。

<NavigationCards
columns={3}
items={[
  {
    title: "管理員設定",
    description: "使用儀表板預設、代理程式技能、config.yaml 或 CLI 建立 Auto Router。",
    to: "/docs/auto_router/setup",
  },
  {
    title: "使用者設定",
    description: "使用 lite configure 連接 Claude Code 或 Codex，並在 Claude Code 中查看即時工作階段節省。",
    to: "/docs/auto_router/user_setup",
  },
  {
    title: "建議的組態",
    description: "1M Context、Anthropic、OpenAI、Gemini 和 Lite 階梯，提供 config.yaml，以及基準測試與生產組態。",
    to: "/docs/auto_router/recommended_configurations",
  },
  {
    title: "公開基準測試",
    description: "Terminal-Bench 2.0、Heuristic v2、RouterArena、分類器上下文、生產案例研究，以及 Fusion。",
    to: "/docs/auto_router/benchmarks",
  },
  {
    title: "提示快取",
    description: "切換模型時會保持快取溫熱。已在五個資料集上測量。",
    to: "/docs/auto_router/prompt_caching",
  },
  {
    title: "在您的流量上評估",
    description: "切換前進行影子評估，切換後進行節省計算。",
    to: "/docs/auto_router/evaluate",
  },
  {
    title: "OTEL Telemetry",
    description: "在 Lens 或 OTLP 後端中追蹤所選組態、路由原因、分類器失敗與重試。",
    to: "/docs/auto_router/telemetry",
  },
  {
    title: "功能歷史",
    description: "Auto Router 功能在哪個版本推出，以及連結到穩定版 GitHub releases。",
    to: "/docs/auto_router/feature_history",
  },
  {
    title: "組態參考資料",
    description: "每一個 complexity_router_config 鍵，以及預設值。",
    to: "/docs/proxy/auto_routing",
  },
]}
/>

## 發行貼文 {#release-posts}

- [Harness-Aware Routing](/blog/auto-router-harness-aware-classification)：Claude Code 和 Codex 的上下文處理、加密的委派任務，以及分類器記錄
- [Mid-Task Stall Escalation](/blog/auto-router-stall-escalation)：當請求卡在重試迴圈中時，將其升到下一個階層
- [Auto Router v2](/blog/autorouter-v2)：一個用於複雜度、語意與自適應路由的路由器
- [1-click presets and Test Routing](/blog/auto-router-setup-and-testing)
- [Savings tab and per-request classifier cost](/blog/auto-router-spend-visibility)
- [Classifier context and usage benchmarks](/blog/auto-router-context-and-benchmarks)
- [Shadow evaluations](/blog/auto-router-shadow-evaluations)
- [Context-size and modality routing](/blog/auto-router-more-routing-configurations)
