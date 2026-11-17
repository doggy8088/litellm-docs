---
title: Auto Router [附加元件]
sidebar_label: 總覽
keywords: [autorouter, auto router]
description: 使用 prompt 複雜度或您自己的規則，為每個請求選擇模型。在 Python 中開始，或在 LiteLLM gateway 中設定 Auto Router。
---

import NavigationCards from '@site/src/components/NavigationCards';
import AutoRouterDiagram from '@site/src/components/AutoRouterDiagram';

Auto Router 會為送往您 LiteLLM gateway 的每個請求選擇由哪個模型處理。您的應用程式只呼叫一個模型名稱；路由器會依 prompt 或您的路由規則，從您設定的模型中挑選。例如，您可以將簡單問題送給較便宜的模型，將較困難的任務送給較強的模型。

要將路由建置到 Python 應用程式或 agent 中嗎？請使用 [Autorouter SDK](/docs/autorouter_sdk)。

<AutoRouterDiagram />

每個階層的模型由您選擇。對於每個請求，路由器會挑選一個階層，並從中選出一個模型。

## 在儀表板中設定 {#set-up-in-the-dashboard}

您需要一個已設定好模型、且您有權限新增模型的 LiteLLM gateway。若您還沒有 gateway，請先從 [gateway 快速入門](/docs/proxy/quick_start) 開始。

1. 開啟 **Models + Endpoints**，再開啟 **Auto Router** 分頁，新增一個路由器。
2. 為它命名，例如 `smart-router`。按一下 **Configure automatically**，以您已部署的模型填入各階層，然後檢閱所選內容。
3. 以您應用程式的一個 prompt 使用 **Test Routing**，檢查它選出的階層與模型。這會測試路由決策而不呼叫所選模型；但 LLM 分類器仍可能產生費用。
4. 按一下 **Add Auto Router** 加以儲存。在您應用程式送往 gateway 的請求中，將 `smart-router` 用作 `model`。

所選模型會產生回答。在切換流量之前，先試幾個您應用程式的任務，將回答與成本與您目前的模型比較。

如需 YAML、API 或 CLI 設定，請參閱 [管理員設定](/docs/auto_router/setup)。若要從 Claude Code 或 Codex 使用路由器，請依照 [使用者設定](/docs/auto_router/user_setup)。

若要改變路由器選擇模型的方式，請參閱 [自訂您的分類器](/docs/auto_router/optimize_classifier)。您也可以[連接決策模型](/docs/auto_router/decision_classifiers)，包括 Jev、Nimble、Laya 或 Databricks `ai_decide`。

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

## 設定與評估 {#configure-and-evaluate}

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
    description: "設定 prompt 快取，並比較請求切換模型時的成本。",
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
