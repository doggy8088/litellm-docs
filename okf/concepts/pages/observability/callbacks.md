---
type: "Standalone page"
title: "Callbacks"
description: "Callbacks Use Callbacks to send Output Data to Posthog, Sentry etc liteLLM provides success callbacks and failure callbacks , making it easy for you to send data to a particular..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/src/pages/observability/callbacks.md"
tags: ["pages","standalone-page"]
source_path: "src/pages/observability/callbacks.md"
source_area: "pages"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`src/pages/observability/callbacks.md`](https://github.com/BerriAI/litellm-docs/blob/main/src/pages/observability/callbacks.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Callbacks

## Use Callbacks to send Output Data to Posthog, Sentry etc

liteLLM provides `success_callbacks` and `failure_callbacks`, making it easy for you to send data to a particular provider depending on the status of your responses.

liteLLM supports:

- [Lunary](https://lunary.ai/docs)
- [Helicone](https://docs.helicone.ai/introduction)
- [Sentry](https://docs.sentry.io/platforms/python/)
- [PostHog](https://posthog.com/docs/libraries/python)
- [Slack](https://slack.dev/bolt-python/concepts)

### Quick Start

```python
from litellm import completion

# set callbacks
litellm.success_callback=["posthog", "helicone", "lunary"]
litellm.failure_callback=["sentry", "lunary"]

## set env variables
os.environ['SENTRY_DSN'], os.environ['SENTRY_API_TRACE_RATE']= ""
os.environ['POSTHOG_API_KEY'], os.environ['POSTHOG_API_URL'] = "api-key", "api-url"
os.environ["HELICONE_API_KEY"] = ""

response = completion(model="gpt-3.5-turbo", messages=messages)
```
````
