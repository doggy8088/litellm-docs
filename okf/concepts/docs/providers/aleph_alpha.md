---
type: "Documentation page"
title: "Aleph Alpha"
description: "Aleph Alpha LiteLLM supports all models from Aleph Alpha. Like AI21 and Cohere, you can use these models without a waitlist. API KEYS Aleph Alpha Models https://www.aleph alpha...."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/aleph_alpha.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/aleph_alpha.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/aleph_alpha.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/aleph_alpha.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Aleph Alpha

LiteLLM supports all models from [Aleph Alpha](https://www.aleph-alpha.com/). 

Like AI21 and Cohere, you can use these models without a waitlist. 

### API KEYS
```python
import os
os.environ["ALEPHALPHA_API_KEY"] = ""
```

### Aleph Alpha Models
https://www.aleph-alpha.com/

| Model Name       | Function Call                                  | Required OS Variables              |
|------------------|--------------------------------------------|------------------------------------|
| luminous-base       | `completion(model='luminous-base', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-base-control       | `completion(model='luminous-base-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended       | `completion(model='luminous-extended', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-extended-control       | `completion(model='luminous-extended-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme     | `completion(model='luminous-supreme', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
| luminous-supreme-control     | `completion(model='luminous-supreme-control', messages=messages)`         | `os.environ['ALEPHALPHA_API_KEY']`     |
````
