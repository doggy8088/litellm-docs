---
type: "Documentation page"
title: "Image Handling"
description: "Image URL Handling Some LLM API's don't support url's for images, but do support base 64 strings. For those, LiteLLM will: 1. Detect a URL being passed 2. Check if the LLM API s..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/image_handling.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/image_handling.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/image_handling.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/image_handling.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Image URL Handling 

<Image img={require('../../img/image_handling.png')}  style={{ width: '900px', height: 'auto' }} />

Some LLM API's don't support url's for images, but do support base-64 strings. 

For those, LiteLLM will:

1. Detect a URL being passed
2. Check if the LLM API supports a URL
3. Else, will download the base64 
4. Send the provider a base64 string. 


LiteLLM also caches this result, in-memory to reduce latency for subsequent calls. 

The limit for an in-memory cache is 1MB.
````
