---
title: 整合
sidebar_label: 總覽
---

import NavigationCards from '@site/src/components/NavigationCards';

export const Logo = ({ src }) => (
  <img src={src} alt="" />
);

本節涵蓋可與 LiteLLM（Proxy 或 SDK）搭配使用的各種工具與服務整合。

---

## 可觀測性 {#observability}

使用可觀測性平台追蹤、除錯並分析 LLM 請求。

<NavigationCards
columns={3}
items={[
  {
    icon: <Logo src="/img/integrations/langfuse.png" />,
    title: "Langfuse",
    description: "LLM 可觀測性與分析。",
    to: "/docs/observability/langfuse_integration",
  },
  {
    icon: <Logo src="/img/integrations/datadog.png" />,
    title: "Datadog",
    description: "指標、追蹤與儀表板。",
    to: "/docs/observability/datadog",
  },
  {
    icon: <Logo src="/img/integrations/grafana.png" />,
    title: "Grafana Cloud",
    description: "LLM 追蹤、GenAI 指標與儀表板。",
    to: "/docs/observability/grafana_cloud",
  },
  {
    icon: <Logo src="/img/integrations/opentelemetry.png" />,
    title: "OpenTelemetry",
    description: "供應商中立的追蹤。",
    to: "/docs/observability/opentelemetry_integration",
  },
  {
    icon: <Logo src="/img/integrations/langsmith.png" />,
    title: "LangSmith",
    description: "LLM 偵錯與評估。",
    to: "/docs/observability/langsmith_integration",
  },
  {
    icon: <Logo src="/img/integrations/arize.png" />,
    title: "Arize / Phoenix",
    description: "ML 可觀測性與評估。",
    to: "/docs/observability/opentelemetry_v2",
  },
  {
    icon: <Logo src="/img/integrations/helicone.png" />,
    title: "Helicone",
    description: "LLM 請求記錄與分析。",
    to: "/docs/observability/helicone_integration",
  },
  {
    icon: <Logo src="/img/integrations/mlflow.png" />,
    title: "MLflow",
    description: "實驗追蹤。",
    to: "/docs/observability/mlflow",
  },
  {
    icon: <Logo src="/img/integrations/wandb.png" />,
    title: "Weights & Biases",
    description: "ML 實驗追蹤。",
    to: "/docs/observability/wandb_integration",
  },
  {
    icon: <Logo src="/img/integrations/posthog.png" />,
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
    icon: <Logo src="/img/integrations/prometheus.png" />,
    title: "Prometheus",
    description: "指標收集與監控。",
    to: "/docs/proxy/prometheus",
  },
  {
    icon: <Logo src="/img/integrations/pagerduty.png" />,
    title: "PagerDuty",
    description: "事件回應與警示。",
    to: "/docs/proxy/pagerduty",
  },
  {
    icon: <Logo src="/img/integrations/slack.png" />,
    title: "Alerting",
    description: "Slack、Teams 與 webhook 警示。",
    to: "/docs/proxy/alerting",
  },
  {
    icon: <Logo src="/img/integrations/pyroscope.png" />,
    title: "Pyroscope",
    description: "持續分析。",
    to: "/docs/proxy/pyroscope_profiling",
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
    icon: <Logo src="/img/integrations/lakera.png" />,
    title: "Lakera AI",
    description: "提示注入偵測。",
    to: "/docs/proxy/guardrails/lakera_ai",
  },
  {
    icon: <Logo src="/img/integrations/azure.png" />,
    title: "Azure Content Safety",
    description: "內容審核。",
    to: "/docs/proxy/guardrails/azure_content_guardrail",
  },
  {
    icon: <Logo src="/img/integrations/aws.png" />,
    title: "Bedrock Guardrails",
    description: "AWS Bedrock 安全性。",
    to: "/docs/proxy/guardrails/bedrock",
  },
  {
    icon: <Logo src="/img/integrations/openai.png" />,
    title: "OpenAI Moderation",
    description: "OpenAI 內容政策。",
    to: "/docs/proxy/guardrails/openai_moderation",
  },
  {
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "Secret Detection",
    description: "防止憑證外洩。",
    to: "/docs/proxy/guardrails/secret_detection",
  },
  {
    icon: <Logo src="/img/integrations/microsoft.png" />,
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
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "Guardrail Policies",
    description: "以政策為基礎的 guardrail 規則。",
    to: "/docs/proxy/guardrails/guardrail_policies",
  },
  {
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "Policy Flow Builder",
    description: "視覺化政策設定。",
    to: "/docs/proxy/guardrails/policy_flow_builder",
  },
  {
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "Policy Templates",
    description: "預先建立的政策範本。",
    to: "/docs/proxy/guardrails/policy_templates",
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
    icon: <Logo src="/img/integrations/openwebui.png" />,
    title: "OpenWebUI",
    description: "自架設的 ChatGPT 風格介面。",
    to: "/docs/tutorials/openweb_ui",
  },
  {
    icon: <Logo src="/img/integrations/anthropic.png" />,
    title: "Claude Code",
    description: "將 LiteLLM 與 Claude Code 搭配使用。",
    to: "/docs/tutorials/claude_responses_api",
  },
  {
    icon: <Logo src="/img/integrations/cursor.png" />,
    title: "Cursor",
    description: "AI 程式碼編輯器整合。",
    to: "/docs/tutorials/cursor_integration",
  },
  {
    icon: <Logo src="/img/integrations/github-copilot.png" />,
    title: "GitHub Copilot",
    description: "GitHub Copilot 整合。",
    to: "/docs/tutorials/github_copilot_integration",
  },
  {
    icon: <Logo src="/img/integrations/opencode.png" />,
    title: "OpenCode",
    description: "開源程式撰寫助理。",
    to: "/docs/tutorials/opencode_integration",
  },
  {
    icon: <Logo src="/img/integrations/retool.png" />,
    title: "Retool Assist",
    description: "Retool AI 助理。",
    to: "/docs/tutorials/retool_assist",
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
    icon: <Logo src="/img/integrations/openai.png" />,
    title: "OpenAI Agents SDK",
    description: "使用 OpenAI 的 SDK 建立代理程式。",
    to: "/docs/tutorials/openai_agents_sdk",
  },
  {
    icon: <Logo src="/img/integrations/anthropic.png" />,
    title: "Claude Agent SDK",
    description: "使用 Anthropic 的 SDK 建立代理程式。",
    to: "/docs/tutorials/claude_agent_sdk",
  },
  {
    icon: <Logo src="/img/integrations/google.png" />,
    title: "Google ADK",
    description: "Google Agent Development Kit。",
    to: "/docs/tutorials/google_adk",
  },
  {
    icon: <Logo src="/img/integrations/copilotkit.png" />,
    title: "CopilotKit",
    description: "應用程式內 AI 副駕。",
    to: "/docs/tutorials/copilotkit_sdk",
  },
  {
    icon: <Logo src="/img/integrations/letta.png" />,
    title: "Letta",
    description: "使用具持久記憶的狀態式 LLM 代理程式。",
    to: "/docs/integrations/letta",
  },
  {
    icon: <Logo src="/img/integrations/livekit.png" />,
    title: "LiveKit",
    description: "即時語音與視訊 AI 代理程式。",
    to: "/docs/tutorials/livekit_xai_realtime",
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
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "LiteLLM Prompt Management",
    description: "內建提示管理。",
    to: "/docs/proxy/litellm_prompt_management",
  },
  {
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "Custom Prompt Management",
    description: "使用您自己的提示儲存庫。",
    to: "/docs/proxy/custom_prompt_management",
  },
  {
    icon: <Logo src="/img/integrations/arize.png" />,
    title: "Arize Phoenix Prompts",
    description: "與 Phoenix 搭配的提示管理。",
    to: "/docs/proxy/arize_phoenix_prompts",
  },
]}
/>

---

## 使用 AI 代理程式管理 {#manage-with-ai-agents}

使用 AI 代理程式來管理您的 LiteLLM 部署：透過自然語言建立使用者、團隊、金鑰、模型等。

<NavigationCards
columns={1}
items={[
  {
    icon: <Logo src="/img/integrations/litellm.png" />,
    title: "LiteLLM Skills",
    description: "透過 Claude Code 管理 LiteLLM：使用自然語言指令建立金鑰、團隊、模型等。",
    to: "/docs/tutorials/claude_code_skills",
  },
]}
/>
