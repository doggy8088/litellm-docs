---
type: "Documentation page"
title: "Wandb Integration"
description: "Weights & Biases :::tip This is community maintained, Please make an issue if you run into a bug https://github.com/BerriAI/litellm ::: Weights & Biases helps AI developers buil..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/wandb_integration.md"
tags: ["docs","documentation-page"]
source_path: "docs/observability/wandb_integration.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/observability/wandb_integration.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/wandb_integration.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Image from '@theme/IdealImage';

# Weights & Biases


:::tip

This is community maintained, Please make an issue if you run into a bug
https://github.com/BerriAI/litellm

:::


Weights & Biases helps AI developers build better models faster https://wandb.ai

<Image img={require('../../img/wandb.png')} />

:::info
We want to learn how we can make the callbacks better! Meet the LiteLLM [founders](https://calendly.com/d/4mp-gd3-k5k/berriai-1-1-onboarding-litellm-hosted-version) or
join our [discord](https://discord.gg/wuPM9dRgDw)
::: 

## Pre-Requisites
Ensure you have run `uv add wandb` for this integration
```shell
uv add wandb litellm
```

## Quick Start
Use just 2 lines of code, to instantly log your responses **across all providers** with Weights & Biases

```python
litellm.success_callback = ["wandb"]
```
```python
# uv add wandb 
import litellm
import os

os.environ["WANDB_API_KEY"] = ""
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

# set wandb as a callback, litellm will send the data to Weights & Biases
litellm.success_callback = ["wandb"] 
 
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
