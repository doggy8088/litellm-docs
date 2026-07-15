---
type: "Documentation page"
title: "Topaz"
description: "Topaz | Property | Details | | | | | Description | Professional grade photo and video editing powered by AI. | | Provider Route on LiteLLM | topaz/ | | Provider Doc | Topaz ↗ |..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/topaz.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/topaz.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/topaz.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/topaz.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Topaz

| Property | Details |
|-------|-------|
| Description | Professional-grade photo and video editing powered by AI. |
| Provider Route on LiteLLM | `topaz/` |
| Provider Doc | [Topaz ↗](https://www.topazlabs.com/enhance-api) |
| API Endpoint for Provider | https://api.topazlabs.com |
| Supported OpenAI Endpoints | `/image/variations` |


## Quick Start

```python
from litellm import image_variation
import os 

os.environ["TOPAZ_API_KEY"] = ""
response = image_variation(
    model="topaz/Standard V2", image=image_url
)
```

## Supported OpenAI Params

- `response_format`
- `size` (widthxheight)
````
