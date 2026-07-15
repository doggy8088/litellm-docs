---
type: "Documentation page"
title: "Observability"
description: "Track, debug, and analyze LLM calls with observability platforms. Observability Integrations View all observability integrations →"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/integrations/observability_index.md"
tags: ["docs","documentation-page"]
source_path: "docs/integrations/observability_index.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: ["title","sidebar_label","slug"]
---
# Source document

This concept mirrors [`docs/integrations/observability_index.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/integrations/observability_index.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
---
title: Observability
sidebar_label: Overview
slug: observability_integrations
---

Track, debug, and analyze LLM calls with observability platforms.

import NavigationCards from '@site/src/components/NavigationCards';

## Observability Integrations

<NavigationCards
columns={3}
items={[
  { icon: "🪢", title: "Langfuse", description: "LLM observability and analytics.", to: "/docs/observability/langfuse_integration" },
  { icon: "🐶", title: "Datadog", description: "Metrics, traces, and dashboards.", to: "/docs/observability/datadog" },
  { icon: "📡", title: "OpenTelemetry", description: "Vendor-neutral tracing.", to: "/docs/observability/opentelemetry_integration" },
  { icon: "🔗", title: "LangSmith", description: "LLM debugging and evaluation.", to: "/docs/observability/langsmith_integration" },
  { icon: "🔥", title: "Arize / Phoenix", description: "ML observability and evaluation.", to: "/docs/observability/opentelemetry_v2" },
  { icon: "🌀", title: "Helicone", description: "LLM request logging and analytics.", to: "/docs/observability/helicone_integration" },
  { icon: "📊", title: "MLflow", description: "Experiment tracking.", to: "/docs/observability/mlflow" },
  { icon: "🏋️", title: "Weights & Biases", description: "ML experiment tracking.", to: "/docs/observability/wandb_integration" },
  { icon: "📉", title: "PostHog", description: "Product analytics.", to: "/docs/observability/posthog_integration" },
  { icon: "🔭", title: "Splunk Observability Cloud", description: "OTLP traces to Splunk.", to: "/docs/observability/splunk_observability_cloud" },
]}
/>

[View all observability integrations →](/docs/observability/callbacks)
````
