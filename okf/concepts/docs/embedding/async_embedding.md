---
type: "Documentation page"
title: "Async Embedding"
description: "litellm.aembedding() LiteLLM provides an asynchronous version of the embedding function called aembedding Usage"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/embedding/async_embedding.md"
tags: ["docs","documentation-page"]
source_path: "docs/embedding/async_embedding.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/embedding/async_embedding.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/embedding/async_embedding.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# litellm.aembedding()

LiteLLM provides an asynchronous version of the `embedding` function called `aembedding`
### Usage
```python
from litellm import aembedding
import asyncio

async def test_get_response():
    response = await aembedding('text-embedding-ada-002', input=["good morning from litellm"])
    return response

response = asyncio.run(test_get_response())
print(response)
```
````
