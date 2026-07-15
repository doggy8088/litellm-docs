---
type: "Documentation page"
title: "Callbacks"
description: "Callbacks Use Callbacks to send Output Data to Posthog, Sentry etc liteLLM provides input callbacks , success callbacks and failure callbacks , making it easy for you to send da..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/callbacks.md"
tags: ["docs","documentation-page"]
source_path: "docs/observability/callbacks.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/observability/callbacks.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/callbacks.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Callbacks

## Use Callbacks to send Output Data to Posthog, Sentry etc

liteLLM provides `input_callbacks`, `success_callbacks` and `failure_callbacks`, making it easy for you to send data to a particular provider depending on the status of your responses.

:::tip
**New to LiteLLM Callbacks?**

- For proxy/server logging and observability, see the [Proxy Logging Guide](https://docs.litellm.ai/docs/proxy/logging).
- To write your own callback logic, see the [Custom Callbacks Guide](https://docs.litellm.ai/docs/observability/custom_callback).
:::


### Supported Callback Integrations

- [Lunary](https://lunary.ai/docs)
- [Langfuse](https://langfuse.com/docs)
- [LangSmith](https://www.langchain.com/langsmith)
- [Helicone](https://docs.helicone.ai/introduction)
- [Traceloop](https://traceloop.com/docs)
- [Athina](https://docs.athina.ai/)
- [Sentry](https://docs.sentry.io/platforms/python/)
- [PostHog](https://posthog.com/docs/libraries/python)
- [Slack](https://slack.dev/bolt-python/concepts)
- [Arize](https://docs.arize.com/)
- [PromptLayer](https://docs.promptlayer.com/)

This is **not** an extensive list. Please check the dropdown for all logging integrations.

### Related Cookbooks
Try out our cookbooks for code snippets and interactive demos:

- [Langfuse Callback Example (Colab)](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Langfuse.ipynb)
- [Lunary Callback Example (Colab)](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Lunary.ipynb)
- [Arize Callback Example (Colab)](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Arize.ipynb)
- [Proxy + Langfuse Callback Example (Colab)](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/logging_observability/LiteLLM_Proxy_Langfuse.ipynb)
- [PromptLayer Callback Example (Colab)](https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_PromptLayer.ipynb)

### Quick Start

```python
from litellm import completion

# set callbacks
litellm.input_callback=["sentry"] # for sentry breadcrumbing - logs the input being sent to the api
litellm.success_callback=["posthog", "helicone", "langfuse", "lunary", "athina"]
litellm.failure_callback=["sentry", "lunary", "langfuse"]

## set env variables
os.environ['LUNARY_PUBLIC_KEY'] = ""
os.environ['SENTRY_DSN'], os.environ['SENTRY_API_TRACE_RATE']= ""
os.environ['POSTHOG_API_KEY'], os.environ['POSTHOG_API_URL'] = "api-key", "api-url"
os.environ["HELICONE_API_KEY"] = ""
os.environ["TRACELOOP_API_KEY"] = ""
os.environ["LUNARY_PUBLIC_KEY"] = ""
os.environ["ATHINA_API_KEY"] = ""
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""
os.environ["LANGFUSE_HOST"] = ""

response = completion(model="gpt-3.5-turbo", messages=messages)
```
````
