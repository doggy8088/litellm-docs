---
type: "Documentation page"
title: "Baseten"
description: "Baseten LiteLLM supports both Baseten Model APIs and dedicated deployments with automatic routing. API Types Model API (Default) URL : https://inference.baseten.co/v1 Format : b..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/baseten.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/baseten.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/baseten.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/baseten.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Baseten

LiteLLM supports both Baseten Model APIs and dedicated deployments with automatic routing.

## API Types

### Model API (Default)
- **URL**: `https://inference.baseten.co/v1`
- **Format**: `baseten/<model-name>` (e.g., `baseten/openai/gpt-oss-120b`)
- **Best for**: Quick access to popular models

### Dedicated Deployments
- **URL**: `https://model-{id}.api.baseten.co/environments/production/sync/v1`
- **Format**: `baseten/{8-digit-alphanumeric-code}` (e.g., `baseten/abcd1234`)
- **Best for**: Custom models, latency SLAs

:::tip
**Automatic Routing**: LiteLLM detects the type based on model format:
- 8-digit alphanumeric codes → Dedicated deployment
- All other formats → Model API
:::


## Quick Start

```python
import os
from litellm import completion

os.environ['BASETEN_API_KEY'] = "your-api-key"

# Model API (default)
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Dedicated deployment (8-digit ID)
response = completion(
    model="baseten/abcd1234",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## Examples

### Basic Usage
```python
# Model API
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    max_tokens=500,
    temperature=0.7
)

# Dedicated deployment
response = completion(
    model="baseten/abcd1234",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    max_tokens=500,
    temperature=0.7
)
```

### Streaming (Model API only)
```python
response = completion(
    model="baseten/openai/gpt-oss-120b",
    messages=[{"role": "user", "content": "Write a poem"}],
    stream=True,
    stream_options={"include_usage": True}
)

for chunk in response:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

## Usage with LiteLLM Proxy

1. **Config**:
```yaml
model_list:
  - model_name: baseten-model
    litellm_params:
      model: baseten/openai/gpt-oss-120b
      api_key: your-baseten-api-key
```

2. **Request**:
```python
import openai
client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="baseten-model",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
````
