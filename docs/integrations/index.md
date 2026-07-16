---
title: 整合
sidebar_label: 總覽
---

import NavigationCards from '@site/src/components/NavigationCards';

本節涵蓋可與 LiteLLM（Proxy 或 SDK）搭配使用的各種工具與服務整合。

---

## 可觀測性 {#observability}

使用可觀測性平台追蹤、除錯並分析 LLM 請求。

<NavigationCards
columns={3}
items={[
  {
    icon: "🪢",
    title: "Langfuse",
    description: "LLM 可觀測性與分析。",
    to: "/docs/observability/langfuse_integration",
  },
  {
    icon: "🐶",
    title: "Datadog",
    description: "指標、追蹤與儀表板。",
    to: "/docs/observability/datadog",
  },
  {
    icon: "📡",
    title: "OpenTelemetry",
    description: "提供者中立的追蹤。",
    to: "/docs/observability/opentelemetry_integration",
  },
  {
    icon: "🔗",
    title: "LangSmith",
    description: "LLM 除錯與評估。",
    to: "/docs/observability/langsmith_integration",
  },
  {
    icon: "🔥",
    title: "Arize / Phoenix",
    description: "ML 可觀測性與評估。",
    to: "/docs/observability/opentelemetry_v2",
  },
  {
    icon: "🌀",
    title: "Helicone",
    description: "LLM 請求記錄與分析。",
    to: "/docs/observability/helicone_integration",
  },
  {
    icon: "📊",
    title: "MLflow",
    description: "實驗追蹤。",
    to: "/docs/observability/mlflow",
  },
  {
    icon: "🏋️",
    title: "Weights & Biases",
    description: "ML 實驗追蹤。",
    to: "/docs/observability/wandb_integration",
  },
  {
    icon: "📉",
    title: "PostHog",
    description: "產品分析。",
    to: "/docs/observability/posthog_integration",
  },
]}
/>

[查看所有可觀測性整合 →](/docs/integrations/observability_integrations)

---

## 告警與監控 {#alerting--monitoring}

設定告警、指標蒐集與基礎架構監控。

<NavigationCards
columns={2}
items={[
  {
    icon: "📈",
    title: "Prometheus",
    description: "指標蒐集與監控。",
    to: "../proxy/prometheus",
  },
  {
    icon: "🚨",
    title: "PagerDuty",
    description: "事件回應與告警。",
    to: "../proxy/pagerduty",
  },
  {
    icon: "🔔",
    title: "告警",
    description: "Slack、Teams 與 webhook 告警。",
    to: "../proxy/alerting",
  },
  {
    icon: "🔍",
    title: "Pyroscope",
    description: "持續效能剖析。",
    to: "../proxy/pyroscope_profiling",
  },
]}
/>

---

## 防護欄提供者 {#guardrail-providers}

為 LLM 請求新增安全性與內容過濾。

<NavigationCards
columns={3}
items={[
  {
    icon: "🛡️",
    title: "Lakera AI",
    description: "提示詞注入偵測。",
    to: "/docs/proxy/guardrails/lakera_ai",
  },
  {
    icon: "☁️",
    title: "Azure Content Safety",
    description: "內容審核。",
    to: "/docs/proxy/guardrails/azure_content_guardrail",
  },
  {
    icon: "🛏️",
    title: "Bedrock Guardrails",
    description: "AWS Bedrock 安全性。",
    to: "/docs/proxy/guardrails/bedrock",
  },
  {
    icon: "🤖",
    title: "OpenAI Moderation",
    description: "OpenAI 內容政策。",
    to: "/docs/proxy/guardrails/openai_moderation",
  },
  {
    icon: "🔐",
    title: "Secret Detection",
    description: "防止憑證外洩。",
    to: "/docs/proxy/guardrails/secret_detection",
  },
  {
    icon: "🕵️",
    title: "PII Masking",
    description: "遮罩敏感資料。",
    to: "/docs/proxy/guardrails/pii_masking_v2",
  },
]}
/>

[查看所有防護欄提供者 →](/docs/guardrail_providers)

---

## 政策 {#policies}

定義並強制執行跨 LLM 部署的使用政策。

<NavigationCards
columns={3}
items={[
  {
    icon: "📋",
    title: "Guardrail Policies",
    description: "基於政策的防護欄規則。",
    to: "../proxy/guardrails/guardrail_policies",
  },
  {
    icon: "🔀",
    title: "Policy Flow Builder",
    description: "視覺化政策設定。",
    to: "../proxy/guardrails/policy_flow_builder",
  },
  {
    icon: "📄",
    title: "Policy Templates",
    description: "預先建立的政策範本。",
    to: "../proxy/guardrails/policy_templates",
  },
]}
/>

---

## AI 工具 {#ai-tools}

將 LiteLLM 連接到 AI 驅動的程式碼與生產力工具。

<NavigationCards
columns={3}
items={[
  {
    icon: "💬",
    title: "OpenWebUI",
    description: "自架的 ChatGPT 風格介面。",
    to: "../tutorials/openweb_ui",
  },
  {
    icon: "🤖",
    title: "Claude Code",
    description: "將 LiteLLM 與 Claude Code 搭配使用。",
    to: "../tutorials/claude_responses_api",
  },
  {
    icon: "🖱️",
    title: "Cursor",
    description: "AI 程式碼編輯器整合。",
    to: "../tutorials/cursor_integration",
  },
  {
    icon: "🐙",
    title: "GitHub Copilot",
    description: "GitHub Copilot 整合。",
    to: "../tutorials/github_copilot_integration",
  },
  {
    icon: "💻",
    title: "OpenCode",
    description: "開源程式碼助理。",
    to: "../tutorials/opencode_integration",
  },
  {
    icon: "🔧",
    title: "Retool Assist",
    description: "Retool AI 助理。",
    to: "../tutorials/retool_assist",
  },
]}
/>

---

## 代理程式 SDK {#agent-sdks}

將 LiteLLM 與代理程式框架和 SDK 搭配使用。

<NavigationCards
columns={3}
items={[
  {
    icon: "🤖",
    title: "OpenAI Agents SDK",
    description: "使用 OpenAI 的 SDK 建立代理程式。",
    to: "../tutorials/openai_agents_sdk",
  },
  {
    icon: "🧠",
    title: "Claude Agent SDK",
    description: "使用 Anthropic 的 SDK 建立代理程式。",
    to: "../tutorials/claude_agent_sdk",
  },
  {
    icon: "🌐",
    title: "Google ADK",
    description: "Google Agent Development Kit。",
    to: "../tutorials/google_adk",
  },
  {
    icon: "🚀",
    title: "CopilotKit",
    description: "應用程式內 AI 副駕。",
    to: "../tutorials/copilotkit_sdk",
  },
  {
    icon: "🧬",
    title: "Letta",
    description: "使用具持久記憶的狀態式 LLM 代理程式建立。",
    to: "./letta",
  },
  {
    icon: "🎙️",
    title: "LiveKit",
    description: "即時語音與視訊 AI 代理程式。",
    to: "../tutorials/livekit_xai_realtime",
  },
]}
/>

---

## 提示詞管理 {#prompt-management}

管理、版本控制並部署提示詞。

<NavigationCards
columns={3}
items={[
  {
    icon: "📝",
    title: "LiteLLM Prompt Management",
    description: "內建提示詞管理。",
    to: "../proxy/litellm_prompt_management",
  },
  {
    icon: "🔌",
    title: "Custom Prompt Management",
    description: "使用您自己的提示詞儲存區。",
    to: "../proxy/custom_prompt_management",
  },
  {
    icon: "🔥",
    title: "Arize Phoenix Prompts",
    description: "使用 Phoenix 進行提示詞管理。",
    to: "../proxy/arize_phoenix_prompts",
  },
]}
/>

---

## 使用 AI 代理程式管理 {#manage-with-ai-agents}

使用 AI 代理程式管理您的 LiteLLM 部署 — 透過自然語言建立使用者、團隊、金鑰、模型等。

<NavigationCards
columns={1}
items={[
  {
    icon: "🤖",
    title: "LiteLLM Skills",
    description: "透過 Claude Code 管理 LiteLLM — 使用自然語言命令建立金鑰、團隊、模型等。",
    to: "../tutorials/claude_code_skills",
  },
]}
/>
