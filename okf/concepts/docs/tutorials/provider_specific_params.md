---
type: "Documentation page"
title: "Provider Specific Params"
description: "Setting provider specific Params Goal: Set max tokens across OpenAI + Cohere 1. via completion LiteLLM will automatically translate max tokens to the naming convention followed..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/provider_specific_params.md"
tags: ["docs","documentation-page"]
source_path: "docs/tutorials/provider_specific_params.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/tutorials/provider_specific_params.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/provider_specific_params.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
### Setting provider-specific Params

Goal: Set max tokens across OpenAI + Cohere

**1. via completion**

LiteLLM will automatically translate max_tokens to the naming convention followed by that specific model provider.

```python
from litellm import completion
import os

## set ENV variables 
os.environ["OPENAI_API_KEY"] = "your-openai-key" 
os.environ["COHERE_API_KEY"] = "your-cohere-key" 

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(model="gpt-3.5-turbo", messages=messages, max_tokens=100)

# cohere call
response = completion(model="command-nightly", messages=messages, max_tokens=100)
print(response)
```

**2. via provider-specific config**

For every provider on LiteLLM, we've gotten their specific params (following their naming conventions, etc.). You can just set it for that provider by pulling up that provider via `litellm.<provider_name>Config`. 

All provider configs are typed and have docstrings, so you should see them autocompleted for you in VSCode with an explanation of what it means. 

Here's an example of setting max tokens through provider configs.
````
