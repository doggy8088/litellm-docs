---
title: 教學
sidebar_label: 總覽
---

import NavigationCards from '@site/src/components/NavigationCards';

**教學**會以步驟說明如何將 LiteLLM 與外部工具、框架及服務整合，或建立完整的端到端工作流程。

> 開始前需要協助選擇適合的路徑嗎？請參閱[學習 LiteLLM →](/docs/learn)

* * *

## 開始使用

<NavigationCards
columns={2}
items={[
  {
    icon: "⚡",
    title: "開始使用",
    description: "安裝、Playground、文字完成與模擬完成。",
    to: "/docs/tutorials/getting_started",
  },
]}
/>

* * *

## 整合

<NavigationCards
columns={2}
items={[
  {
    icon: "🤖",
    title: "代理程式 SDK 與框架",
    description: "OpenAI Agents SDK、Claude Agent SDK、Google ADK、CopilotKit、Letta、LiveKit 與 Instructor。",
    to: "/docs/agent_sdks",
  },
  {
    icon: "🛠️",
    title: "AI 程式開發工具",
    description: "Claude Code、Cursor、GitHub Copilot、Gemini CLI、OpenCode、Qwen Code 與 OpenAI Codex。",
    to: "/docs/ai_tools",
  },
  {
    icon: "🐍",
    title: "Python SDK",
    description: "Gradio、備援與提供者專用參數，不需要 Proxy。",
    to: "/docs/tutorials/python_sdk",
  },
  {
    icon: "🔌",
    title: "提供者設定",
    description: "Azure OpenAI、HuggingFace、TogetherAI、本機模型等服務。",
    to: "/docs/tutorials/provider_tutorials",
  },
]}
/>

* * *

## Proxy

<NavigationCards
columns={2}
items={[
  {
    icon: "👥",
    title: "Proxy：管理與存取",
    description: "使用者與團隊管理、SSO、SCIM 及路由規則。",
    to: "/docs/tutorials/proxy_admin_access",
  },
  {
    icon: "🛡️",
    title: "Proxy：功能與安全性",
    description: "提示快取、直通 API、即時功能、防護欄與個人識別資訊遮罩。",
    to: "/docs/tutorials/proxy_features_safety",
  },
]}
/>

* * *

## 可觀測性與評估

<NavigationCards
columns={2}
items={[
  {
    icon: "🔍",
    title: "可觀測性與評估",
    description: "Elasticsearch 記錄、基準測試與評估套件。",
    to: "/docs/tutorials/observability_evaluation",
  },
]}
/>
