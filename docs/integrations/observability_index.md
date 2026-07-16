---
title: 監控可觀測性
sidebar_label: 總覽
slug: observability_integrations
---

使用可觀測性平台追蹤、除錯並分析 LLM 請求。

import NavigationCards from '@site/src/components/NavigationCards';

## 可觀測性整合 {#observability-integrations}

<NavigationCards
columns={3}
items={[
  { icon: "🪢", title: "Langfuse", description: "LLM 可觀測性與分析。", to: "/docs/observability/langfuse_integration" },
  { icon: "🐶", title: "Datadog", description: "指標、追蹤與儀表板。", to: "/docs/observability/datadog" },
  { icon: "📡", title: "OpenTelemetry", description: "提供者中立的追蹤。", to: "/docs/observability/opentelemetry_integration" },
  { icon: "🔗", title: "LangSmith", description: "LLM 除錯與評估。", to: "/docs/observability/langsmith_integration" },
  { icon: "🔥", title: "Arize / Phoenix", description: "ML 可觀測性與評估。", to: "/docs/observability/opentelemetry_v2" },
  { icon: "🌀", title: "Helicone", description: "LLM 請求記錄與分析。", to: "/docs/observability/helicone_integration" },
  { icon: "📊", title: "MLflow", description: "實驗追蹤。", to: "/docs/observability/mlflow" },
  { icon: "🏋️", title: "Weights & Biases", description: "ML 實驗追蹤。", to: "/docs/observability/wandb_integration" },
  { icon: "📉", title: "PostHog", description: "產品分析。", to: "/docs/observability/posthog_integration" },
  { icon: "🔭", title: "Splunk Observability Cloud", description: "將 OTLP 追蹤傳送至 Splunk。", to: "/docs/observability/splunk_observability_cloud" },
]}
/>

[查看所有可觀測性整合 →](/docs/observability/callbacks)
