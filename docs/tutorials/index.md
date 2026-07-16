---
title: 教學
sidebar_label: 概覽
---

import NavigationCards from '@site/src/components/NavigationCards';

**教學**是逐步引導，協助您將 LiteLLM 與外部工具、框架及服務整合——或建置完整的端到端工作流程。

> 在開始之前，需要協助選擇正確路徑嗎？請參閱 [學習 →](/docs/learn)

---

## 入門 {#getting-started}

<NavigationCards
columns={2}
items={[
  {
    icon: "⚡",
    title: "入門",
    description: "安裝、遊樂場、文字完成，以及模擬完成。",
    to: "/docs/tutorials/getting_started",
  },
]}
/>

---

## 整合 {#integrations}

<NavigationCards
columns={2}
items={[
  {
    icon: "🤖",
    title: "Agent SDK 與框架",
    description: "OpenAI Agents SDK、Claude Agent SDK、Google ADK、CopilotKit、Letta、LiveKit、Instructor。",
    to: "/docs/agent_sdks",
  },
  {
    icon: "🛠️",
    title: "AI 編碼工具",
    description: "Claude Code、Cursor、GitHub Copilot、Gemini CLI、OpenCode、Qwen Code、OpenAI Codex。",
    to: "/docs/ai_tools",
  },
  {
    icon: "🐍",
    title: "Python SDK",
    description: "Gradio、備援、特定提供者參數——不需要 proxy。",
    to: "/docs/tutorials/python_sdk",
  },
  {
    icon: "🔌",
    title: "提供者設定",
    description: "Azure OpenAI、HuggingFace、TogetherAI、本機模型，以及更多。",
    to: "/docs/tutorials/provider_tutorials",
  },
]}
/>

---

## 代理伺服器 {#proxy}

<NavigationCards
columns={2}
items={[
  {
    icon: "👥",
    title: "Proxy：管理與存取",
    description: "使用者與團隊管理、SSO、SCIM，以及路由規則。",
    to: "/docs/tutorials/proxy_admin_access",
  },
  {
    icon: "🛡️",
    title: "Proxy：功能與安全性",
    description: "提示快取、透傳 API、即時、防護欄，以及 PII 遮罩。",
    to: "/docs/tutorials/proxy_features_safety",
  },
]}
/>

---

## 可觀測性與評估 {#observability--evaluation}

<NavigationCards
columns={2}
items={[
  {
    icon: "🔍",
    title: "可觀測性與評估",
    description: "記錄到 Elasticsearch、基準測試，以及評估套件。",
    to: "/docs/tutorials/observability_evaluation",
  },
]}
/>
