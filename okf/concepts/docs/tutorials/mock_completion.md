---
type: "Documentation page"
title: "Mock Completion"
description: "Mock Completion Responses Save Testing Costs Trying to test making LLM Completion calls without calling the LLM APIs ? Pass mock response to litellm.completion and litellm will..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/mock_completion.md"
tags: ["docs","documentation-page"]
source_path: "docs/tutorials/mock_completion.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/tutorials/mock_completion.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/mock_completion.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Mock Completion Responses - Save Testing Costs

Trying to test making LLM Completion calls without calling the LLM APIs ? 
Pass `mock_response` to `litellm.completion` and litellm will directly return the response without neededing the call the LLM API and spend $$ 

## Using `completion()` with `mock_response`

```python
from litellm import completion 

model = "gpt-3.5-turbo"
messages = [{"role":"user", "content":"Why is LiteLLM amazing?"}]

completion(model=model, messages=messages, mock_response="It's simple to use and easy to get started")
```

## Building a pytest function using `completion`

```python
from litellm import completion
import pytest

def test_completion_openai():
    try:
        response = completion(
            model="gpt-3.5-turbo",
            messages=[{"role":"user", "content":"Why is LiteLLM amazing?"}],
            mock_response="LiteLLM is awesome"
        )
        # Add any assertions here to check the response
        print(response)
        print(response['choices'][0]['finish_reason'])
    except Exception as e:
        pytest.fail(f"Error occurred: {e}")
```
````
