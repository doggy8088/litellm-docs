---
title: 監控可觀測性
sidebar_label: 總覽
slug: observability_integrations
---

使用可觀測性平台追蹤、除錯並分析 LLM 請求。

import NavigationCards from '@site/src/components/NavigationCards';

export const Logo = ({ src }) => (
  <img src={src} alt="" />
);

## 可觀測性整合 {#observability-integrations}

<NavigationCards
columns={3}
items={[
  { icon: <Logo src="/img/integrations/langfuse.png" />, title: "Langfuse", description: "LLM 可觀測性與分析。", to: "/docs/observability/langfuse_integration" },
  { icon: <Logo src="/img/integrations/datadog.png" />, title: "Datadog", description: "指標、追蹤和儀表板。", to: "/docs/observability/datadog" },
  { icon: <Logo src="/img/integrations/grafana.png" />, title: "Grafana Cloud", description: "LLM 追蹤、GenAI 指標和儀表板。", to: "/docs/observability/grafana_cloud" },
  { icon: <Logo src="/img/integrations/opentelemetry.png" />, title: "OpenTelemetry", description: "供應商中立的追蹤。", to: "/docs/observability/opentelemetry_integration" },
  { icon: <Logo src="/img/integrations/langsmith.png" />, title: "LangSmith", description: "LLM 偵錯和評估。", to: "/docs/observability/langsmith_integration" },
  { icon: <Logo src="/img/integrations/arize.png" />, title: "Arize AX", description: "代管式 LLM 可觀測性和評估。", to: "/docs/observability/arize_integration" },
  { icon: <Logo src="/img/integrations/arize.png" />, title: "Arize Phoenix", description: "開源追蹤和評估。", to: "/docs/observability/phoenix_integration" },
  { icon: <Logo src="/img/integrations/helicone.png" />, title: "Helicone", description: "LLM 請求記錄和分析。", to: "/docs/observability/helicone_integration" },
  { icon: <Logo src="/img/integrations/mlflow.png" />, title: "MLflow", description: "實驗追蹤。", to: "/docs/observability/mlflow" },
  { icon: <Logo src="/img/integrations/wandb.png" />, title: "Weights & Biases", description: "ML 實驗追蹤。", to: "/docs/observability/wandb_integration" },
  { icon: <Logo src="/img/integrations/posthog.png" />, title: "PostHog", description: "產品分析。", to: "/docs/observability/posthog_integration" },
  { icon: <Logo src="/img/integrations/splunk.png" />, title: "Splunk Observability Cloud", description: "發送至 Splunk 的 OTLP 追蹤。", to: "/docs/observability/splunk_observability_cloud" },
  { icon: <Logo src="/img/integrations/signoz.png" />, title: "SigNoz", description: "具有每個團隊攝取金鑰的 OTLP 追蹤。", to: "/docs/observability/signoz" },
]}
/>

[查看所有可觀測性整合 →](/docs/observability/callbacks)
