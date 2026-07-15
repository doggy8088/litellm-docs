---
type: "Documentation page"
title: "Finetuned Chat Gpt"
description: "Using Fine Tuned gpt 3.5 turbo LiteLLM allows you to call completion with your fine tuned gpt 3.5 turbo models If you're trying to create your custom fine tuned gpt 3.5 turbo mo..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/finetuned_chat_gpt.md"
tags: ["docs","documentation-page"]
source_path: "docs/tutorials/finetuned_chat_gpt.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/tutorials/finetuned_chat_gpt.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/finetuned_chat_gpt.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Using Fine-Tuned gpt-3.5-turbo
LiteLLM allows you to call `completion` with your fine-tuned gpt-3.5-turbo models
If you're trying to create your custom fine-tuned gpt-3.5-turbo model following along on this tutorial: https://platform.openai.com/docs/guides/fine-tuning/preparing-your-dataset

Once you've created your fine-tuned model, you can call it with `litellm.completion()` 

## Usage
```python
import os
from litellm import completion

# LiteLLM reads from your .env
os.environ["OPENAI_API_KEY"] = "your-api-key"

response = completion(
  model="ft:gpt-3.5-turbo:my-org:custom_suffix:id",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
)

print(response.choices[0].message)
```

## Usage - Setting OpenAI Organization ID
LiteLLM allows you to specify your OpenAI Organization when calling OpenAI LLMs. More details here: 
[setting Organization ID](https://docs.litellm.ai/docs/providers/openai#setting-organization-id-for-completion-calls)
This can be set in one of the following ways:
- Environment Variable `OPENAI_ORGANIZATION`
- Params to `litellm.completion(model=model, organization="your-organization-id")`
- Set as `litellm.organization="your-organization-id"`
```python
import os
from litellm import completion

# LiteLLM reads from your .env
os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENAI_ORGANIZATION"] = "your-org-id" # Optional

response = completion(
  model="ft:gpt-3.5-turbo:my-org:custom_suffix:id",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
)

print(response.choices[0].message)
```
````
