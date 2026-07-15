---
type: "Documentation page"
title: "Moderation"
description: "litellm.moderation() LiteLLM supports the moderation endpoint for OpenAI Usage"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/embedding/moderation.md"
tags: ["docs","documentation-page"]
source_path: "docs/embedding/moderation.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/embedding/moderation.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/embedding/moderation.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# litellm.moderation()
LiteLLM supports the moderation endpoint for OpenAI

## Usage
```python
import os
from litellm import moderation
os.environ['OPENAI_API_KEY'] = ""
response = moderation(input="i'm ishaan cto of litellm")   
```
````
