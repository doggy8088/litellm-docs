---
type: "Documentation page"
title: "Petals"
description: "Petals Petals: https://github.com/bigscience workshop/petals Pre Requisites Ensure you have petals installed Usage Ensure you add petals/ as a prefix for all petals LLMs. This s..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/petals.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/petals.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/petals.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/petals.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Petals
Petals: https://github.com/bigscience-workshop/petals

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_Petals.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/>
</a>

## Pre-Requisites
Ensure you have `petals` installed
```shell
uv add git+https://github.com/bigscience-workshop/petals
```

## Usage
Ensure you add `petals/` as a prefix for all petals LLMs. This sets the custom_llm_provider to petals

```python
from litellm import completion

response = completion(
    model="petals/petals-team/StableBeluga2", 
    messages=[{ "content": "Hello, how are you?","role": "user"}]
)

print(response)
```

## Usage with Streaming

```python
response = completion(
    model="petals/petals-team/StableBeluga2", 
    messages=[{ "content": "Hello, how are you?","role": "user"}],
    stream=True
)

print(response)
for chunk in response:
  print(chunk)
```

### Model Details

| Model Name       | Function Call                              |
|------------------|--------------------------------------------|
| petals-team/StableBeluga | `completion('petals/petals-team/StableBeluga2', messages)` | 
| huggyllama/llama-65b | `completion('petals/huggyllama/llama-65b', messages)` |
````
