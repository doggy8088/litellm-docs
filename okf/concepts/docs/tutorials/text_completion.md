---
type: "Documentation page"
title: "Text Completion"
description: "Using Text Completion Format with Completion() If your prefer interfacing with the OpenAI Text Completion format this tutorial covers how to use LiteLLM in this format Using Lit..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/text_completion.md"
tags: ["docs","documentation-page"]
source_path: "docs/tutorials/text_completion.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/tutorials/text_completion.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/text_completion.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Using Text Completion Format - with Completion()

If your prefer interfacing with the OpenAI Text Completion format this tutorial covers how to use LiteLLM in this format
```python
response = openai.Completion.create(
    model="text-davinci-003",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

## Using LiteLLM in the Text Completion format
### With gpt-3.5-turbo
```python
from litellm import text_completion
response = text_completion(
    model="gpt-3.5-turbo",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### With text-davinci-003
```python
response = text_completion(
    model="text-davinci-003",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```

### With llama2
```python
response = text_completion(
    model="togethercomputer/llama-2-70b-chat",
    prompt='Write a tagline for a traditional bavarian tavern',
    temperature=0,
    max_tokens=100)
```
````
