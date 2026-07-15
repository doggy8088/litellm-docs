---
type: "Documentation page"
title: "Logfire Integration"
description: "Logfire Logfire is open Source Observability & Analytics for LLM Apps Detailed production traces and a granular view on quality, cost and latency :::info We want to learn how we..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/logfire_integration.md"
tags: ["docs","documentation-page"]
source_path: "docs/observability/logfire_integration.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/observability/logfire_integration.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/logfire_integration.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Image from '@theme/IdealImage';

# Logfire

Logfire is open Source Observability & Analytics for LLM Apps
Detailed production traces and a granular view on quality, cost and latency

<Image img={require('../../img/logfire.png')} />

:::info
We want to learn how we can make the callbacks better! Meet the LiteLLM [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) or
join our [discord](https://discord.gg/wuPM9dRgDw)
:::

## Pre-Requisites

Ensure you have installed the following packages to use this integration

```shell
uv add litellm

uv add opentelemetry-api==1.25.0
uv add opentelemetry-sdk==1.25.0
uv add opentelemetry-exporter-otlp==1.25.0
```

## Quick Start

Get your Logfire token from [Logfire](https://logfire.pydantic.dev/)

```python
litellm.callbacks = ["logfire"]
```

```python
# uv add logfire
import litellm
import os

# from https://logfire.pydantic.dev/
os.environ["LOGFIRE_TOKEN"] = ""

# Optionally customize the base url
# from https://logfire.pydantic.dev/
os.environ["LOGFIRE_BASE_URL"] = ""

# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set logfire as a callback, litellm will send the data to logfire
litellm.success_callback = ["logfire"]

# openai call
response = litellm.completion(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hi 👋 - i'm openai"}
  ]
)
```

## Support & Talk to Founders

- [Schedule Demo 👋](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version)
- [Community Discord 💭](https://discord.gg/wuPM9dRgDw)
- Our emails ✉️ ishaan@berri.ai / krrish@berri.ai
````
