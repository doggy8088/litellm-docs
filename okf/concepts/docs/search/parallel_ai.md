---
type: "Documentation page"
title: "Parallel Ai"
description: "Parallel AI Search Get API Key: https://www.parallel.ai LiteLLM Python SDK LiteLLM AI Gateway 1. Setup config.yaml 2. Start the proxy 3. Test the search endpoint Provider specif..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/search/parallel_ai.md"
tags: ["docs","documentation-page"]
source_path: "docs/search/parallel_ai.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/search/parallel_ai.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/search/parallel_ai.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Parallel AI Search

**Get API Key:** [https://www.parallel.ai](https://www.parallel.ai)

## LiteLLM Python SDK

```python showLineNumbers title="Parallel AI Search"
import os
from litellm import search

os.environ["PARALLEL_AI_API_KEY"] = "..."

response = search(
    query="latest AI developments",
    search_provider="parallel_ai",
    max_results=5
)
```

## LiteLLM AI Gateway

### 1. Setup config.yaml

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: parallel-search
    litellm_params:
      search_provider: parallel_ai
      api_key: os.environ/PARALLEL_AI_API_KEY
```

### 2. Start the proxy

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. Test the search endpoint

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/parallel-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## Provider-specific Parameters

```python showLineNumbers title="Parallel AI Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["PARALLEL_AI_API_KEY"] = "..."

response = search(
    query="latest developments in quantum computing",
    search_provider="parallel_ai",
    max_results=5,
    # Parallel AI-specific parameters
    processor="pro",                 # 'base' or 'pro'
    max_chars_per_result=500         # Max characters per result
)
```
````
