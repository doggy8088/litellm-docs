---
type: "Documentation page"
title: "Config Management"
description: "File Management include external YAML files in a config.yaml You can use include to include external YAML files in a config.yaml. Quick Start Usage: To include a config file, us..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/config_management.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/config_management.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/config_management.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/config_management.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# File Management

## `include` external YAML files in a config.yaml 

You can use `include` to include external YAML files in a config.yaml. 

**Quick Start Usage:**

To include a config file, use `include` with either a single file or a list of files. 

Contents of `parent_config.yaml`:
```yaml
include:
  - model_config.yaml # 👈 Key change, will include the contents of model_config.yaml

litellm_settings:
  callbacks: ["prometheus"] 
```


Contents of `model_config.yaml`:
```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
  - model_name: fake-anthropic-endpoint
    litellm_params:
      model: anthropic/fake
      api_base: https://exampleanthropicendpoint-production.up.railway.app/

```

Start proxy server 

This will start the proxy server with config `parent_config.yaml`. Since the `include` directive is used, the server will also include the contents of `model_config.yaml`.
```
litellm --config parent_config.yaml --detailed_debug
```





## Examples using `include`

Include a single file:
```yaml
include:
  - model_config.yaml
```

Include multiple files:
```yaml
include:
  - model_config.yaml
  - another_config.yaml
```
````
