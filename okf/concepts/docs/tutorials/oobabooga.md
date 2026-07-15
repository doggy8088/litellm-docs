---
type: "Documentation page"
title: "Oobabooga"
description: "Oobabooga Text Web API Tutorial Install + Import LiteLLM Call your oobabooga model Remember to set your api base See your response Credits to Shuai Shao, for this tutorial."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/oobabooga.md"
tags: ["docs","documentation-page"]
source_path: "docs/tutorials/oobabooga.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/tutorials/oobabooga.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/tutorials/oobabooga.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Oobabooga Text Web API Tutorial

### Install + Import LiteLLM 
```python 
!uv add litellm
from litellm import completion 
import os
```

### Call your oobabooga model
Remember to set your api_base
```python
response = completion(
  model="oobabooga/WizardCoder-Python-7B-V1.0-GPTQ",
  messages=[{ "content": "can you write a binary tree traversal preorder","role": "user"}], 
  api_base="http://localhost:5000",
  max_tokens=4000
)
```

### See your response 
```python 
print(response)
```

Credits to [Shuai Shao](https://www.linkedin.com/in/shuai-sh/), for this tutorial.
````
