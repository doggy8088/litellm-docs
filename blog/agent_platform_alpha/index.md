---
slug: agent-platform-alpha
title: "LiteLLM 受管代理程式平台 — Alpha 現已開放公開預覽"
date: 2026-05-08T10:00:00
authors:
  - krrish
  - ishaan-alt
description: "在 LiteLLM Gateway 上啟動受沙箱隔離的代理程式工作階段 — 一個用於受管代理程式的控制平面，現已進入公開預覽。"
tags: [product, agents]
hide_table_of_contents: false
---

我們正在推出 **LiteLLM Managed Agents Platform** —— 一個簡單、可自行架設的基礎架構平台，用於在正式環境中執行多個代理程式。

{/* truncate */}

![LiteLLM 代管代理程式平台 Alpha](/img/litellm_agent_platform_alpha.png)

使用它的主要好處是它會管理：
- 不同團隊／情境的不同沙箱
- 在 pod 重新啟動／升級之間的工作階段管理

我們打造這個平台，是因為我們想要一個受管代理程式解決方案，但必須是完全自我託管。我們很高興能將它開源，並讓每個人都能使用。

**Repo:** [github.com/BerriAI/litellm-agent-platform](https://github.com/BerriAI/litellm-agent-platform)

如果您有任何問題或回饋，請提交 issue。
