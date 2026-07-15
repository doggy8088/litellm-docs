---
type: "Documentation page"
title: "Image Variations"
description: "[BETA] Image Variations OpenAI's /image/variations endpoint is now supported. Quick Start Supported Providers OpenAI Topaz"
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/image_variations.md"
tags: ["docs","documentation-page"]
source_path: "docs/image_variations.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/image_variations.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/image_variations.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# [BETA] Image Variations

OpenAI's `/image/variations` endpoint is now supported.

## Quick Start

```python
from litellm import image_variation
import os 

# set env vars 
os.environ["OPENAI_API_KEY"] = ""
os.environ["TOPAZ_API_KEY"] = ""

# openai call
response = image_variation(
    model="dall-e-2", image=image_url
)

# topaz call
response = image_variation(
    model="topaz/Standard V2", image=image_url
)

print(response)
```

## Supported Providers

- OpenAI
- Topaz
````
