---
slug: agents-are-the-new-llms
title: "統一的代理程式控制平面"
date: 2026-06-10T09:00:00
authors:
- krrish
description: "AI 閘道正往上層移動：從路由模型請求，走向路由代理程式工作。"
tags: [ideas, harnesses, ai-gateway, agents]
hide_table_of_contents: true
---

import { StackComparison, ConvergenceHero } from './diagrams';

<ConvergenceHero />

*最後更新：2026 年 6 月*

代理程式基礎架構已經開始分成三層：模型、harnesses，以及 runtime。我們認為第四層即將出現：統一的代理程式控制平面。這將能從一個地方呼叫存在於不同代理程式 runtime 中的代理程式。

原因在於，公司不會把每個代理程式都執行在同一個 runtime 上。程式碼代理程式可能會執行在 Bedrock AgentCore 或 Claude Managed Agents 上。資料代理程式可能會在 Elastic、Databricks，或 Snowflake 內執行。內部工作流程代理程式可能會執行在自建基礎架構上。控制平面之所以浮現，是因為公司希望有一個地方可以使用所有這些代理程式，不論它們是在何處建置或執行。

但只有登錄系統還不夠。任何人都可以建立一份代理程式清單。

更難的問題是呼叫。代理程式 runtime 會暴露類似的基本元素——代理程式、session、事件、工具——但它們不是透過相同的 API 暴露這些元素。所以如果您想要一個地方真正使用這些代理程式，而不只是列出它們，控制平面就必須管理代理程式 runtime、排程、記憶體，以及 session。

這和 LiteLLM 在模型上看到的模式相同。公司不只需要模型目錄，他們需要一個介面來呼叫它們。唯一的變化是，現在的基本元素是代理程式 session，而不是模型請求。

## 未來的堆疊 {#the-stack-of-the-future}

<StackComparison />

重要的轉變是，閘道不再只是路由模型請求。它正在路由代理程式工作。

有了 LLM，堆疊變成了：

* **模型：** GPT、Claude、Gemini、Llama
* **推論提供者：** OpenAI、Anthropic、Bedrock、Vertex、Azure、vLLM
* **閘道：** 路由、備援、記錄、支出追蹤、驗證、計費
* **應用程式：** copilot、工作流程、內部工具、產品

有了代理程式，我們認為堆疊會變成：

* **模型：** Claude、GPT、Gemini、開源模型
* **harnesses：** Claude Code、Codex、OpenCode、Hermes、DeepAgents
* **代理程式 runtime：** Claude Managed Agents、Bedrock AgentCore、Gemini Enterprise Agent Platform、自架 runtime
* **代理程式控制平面：** 多 runtime 平台，讓團隊管理代理程式 runtime、排程、記憶體，以及 session。
* **應用程式：** 程式碼代理程式、支援代理程式、資料代理程式、安全代理程式

## 為什麼公司會需要這個 {#why-companies-will-need-this}

在 LiteLLM，我們已經看到團隊在多個代理程式 runtime 之間協作。有些人正在 Claude Managed Agents 上開發，其他人則在 N8N 或 Cursor 上。

這種碎片化使得在這些平台上建立的代理程式很難被共享，也讓每個人都能受益於到目前為止所做的工作變得困難。

只要讓代理程式存在於一個地方，所有人都可以利用這些代理程式——即使 PR Babysitter Agent 是寫在 Claude Managed Agents 上，而不是每個人都能直接存取。

這就是控制平面問題。

這也是我們認為 AI 閘道會往上層移動的原因。閘道一開始是管理模型請求。但當代理程式成為 AI 的主流使用案例時，閘道也必須管理代理程式 session。

## 我們正在打造什麼 {#what-we-are-building}

[LiteLLM Agent Platform](https://github.com/LiteLLM-Labs/litellm-agent-platform) 是我們在這個方向上的實驗。

LiteLLM Agent Platform 是一個以 Rust 為基礎的 AI 閘道與代理程式控制平面。目標是讓團隊能跨多個 runtime 註冊、呼叫、觀察並治理代理程式。

我們先從程式碼代理程式開始，因為需求非常明顯。它們是長時間執行、有狀態、工具密集，而且成本高到需要真正的基礎架構。

我們已經看到早期使用者對這種模式有共鳴。有些公司希望 LAP 作為不同團隊在不同 runtime 上建立的代理程式的中央控制平面。範例來說，一個團隊可能會在 Elastic 的 runtime 上建立一個代理程式來分析 Kibana 記錄，但公司可能希望透過共用閘道在內部公開這個代理程式。

這是我們認為即將到來的架構：模型變得可互換，harnesses 變得專門化，runtime 變得受管理，而閘道則成為代理程式工作的控制平面。

如果這和您看到的情況一致，我們很希望收到對 LiteLLM Agent Platform 的回饋：

https://github.com/LiteLLM-Labs/litellm-agent-platform

## 常見問題 {#frequently-asked-questions}

### LiteLLM 會打造第二個產品嗎？ {#is-litellm-building-a-second-product}

不會。LAP 是一個實驗性專案。目標是快速學習，並隨著時間把合適的部分帶回 LiteLLM。

### LAP 已可用於正式環境嗎？ {#is-lap-production-ready}

不行。LAP 仍處於 pre-v0。隨著我們和早期使用者及貢獻者合作，API 可能會變動。

如果您想要貢獻，請提出 issue 或加入我們的 Discord：

https://discord.gg/Nkxw3rm3EE
