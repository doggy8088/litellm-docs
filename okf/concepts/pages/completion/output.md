---
type: "Standalone page"
title: "Output"
description: "Completion Function completion() Here's the exact json output you can expect from a litellm completion call:"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/src/pages/completion/output.md"
tags: ["pages","standalone-page"]
source_path: "src/pages/completion/output.md"
source_area: "pages"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`src/pages/completion/output.md`](https://github.com/BerriAI/litellm-docs/blob/main/src/pages/completion/output.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Completion Function - completion()
Here's the exact json output you can expect from a litellm `completion` call:

```python 
{'choices': [{'finish_reason': 'stop',
   'index': 0,
   'message': {'role': 'assistant',
    'content': " I'm doing well, thank you for asking. I am Claude, an AI assistant created by Anthropic."}}],
 'created': 1691429984.3852863,
 'model': 'claude-instant-1',
 'usage': {'prompt_tokens': 18, 'completion_tokens': 23, 'total_tokens': 41}}
```
````
