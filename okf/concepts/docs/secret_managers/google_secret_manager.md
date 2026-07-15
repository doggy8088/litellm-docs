---
type: "Documentation page"
title: "Google Secret Manager"
description: "Google Secret Manager :::info ✨ This is an Enterprise Feature Enterprise Pricing Contact us here to get a free trial ::: Support for Google Secret Manager 1. Save Google Secret..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/secret_managers/google_secret_manager.md"
tags: ["docs","documentation-page"]
source_path: "docs/secret_managers/google_secret_manager.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/secret_managers/google_secret_manager.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/secret_managers/google_secret_manager.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Google Secret Manager

:::info

✨ **This is an Enterprise Feature**

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[Contact us here to get a free trial](https://enterprise.litellm.ai/demo)

:::

Support for [Google Secret Manager](https://cloud.google.com/security/products/secret-manager)

1. Save Google Secret Manager details in your environment

```shell 
GOOGLE_SECRET_MANAGER_PROJECT_ID="your-project-id-on-gcp" # example: adroit-crow-413218
```

Optional Params

```shell
export GOOGLE_SECRET_MANAGER_REFRESH_INTERVAL = ""            # (int) defaults to 86400
export GOOGLE_SECRET_MANAGER_ALWAYS_READ_SECRET_MANAGER = ""  # (str) set to "true" if you want to always read from google secret manager without using in memory caching. NOT RECOMMENDED in PROD
```

2. Add to proxy config.yaml 
```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
      api_key: os.environ/OPENAI_API_KEY # this will be read from Google Secret Manager

general_settings:
  key_management_system: "google_secret_manager"
```

You can now test this by starting your proxy: 
```bash
litellm --config /path/to/config.yaml
```

[Quick Test Proxy](../proxy/quick_start#using-litellm-proxy---curl-request-openai-package-langchain-langchain-js)
````
