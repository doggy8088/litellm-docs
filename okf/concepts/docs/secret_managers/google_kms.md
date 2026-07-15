---
type: "Documentation page"
title: "Google Kms"
description: "Google Key Management Service :::info ✨ This is an Enterprise Feature Enterprise Pricing Contact us here to get a free trial ::: Use encrypted keys from Google KMS on the proxy..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/secret_managers/google_kms.md"
tags: ["docs","documentation-page"]
source_path: "docs/secret_managers/google_kms.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/secret_managers/google_kms.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/secret_managers/google_kms.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Google Key Management Service

:::info

✨ **This is an Enterprise Feature**

[Enterprise Pricing](https://www.litellm.ai/#pricing)

[Contact us here to get a free trial](https://enterprise.litellm.ai/demo)

:::

Use encrypted keys from Google KMS on the proxy

Step 1. Add keys to env 
```
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
export GOOGLE_KMS_RESOURCE_NAME="projects/*/locations/*/keyRings/*/cryptoKeys/*"
export PROXY_DATABASE_URL_ENCRYPTED=b'\n$\x00D\xac\xb4/\x8e\xc...'
```

Step 2: Update Config

```yaml
general_settings:
  key_management_system: "google_kms"
  database_url: "os.environ/PROXY_DATABASE_URL_ENCRYPTED"
  master_key: sk-1234
```

Step 3: Start + test proxy

```
$ litellm --config /path/to/config.yaml
```

And in another terminal
```
$ litellm --test 
```

[Quick Test Proxy](../proxy/user_keys)
````
