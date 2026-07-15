---
type: "Documentation page"
title: "Ip Address"
description: "✨ IP Address Filtering :::info You need a LiteLLM License to unlock this feature. Grab time, to get one today! ::: Restrict which IP's can call the proxy endpoints. Expected Res..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/ip_address.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/ip_address.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/ip_address.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/ip_address.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown

# ✨ IP Address Filtering

:::info

You need a LiteLLM License to unlock this feature. [Grab time](https://enterprise.litellm.ai/demo), to get one today!

:::

Restrict which IP's can call the proxy endpoints.

```yaml
general_settings:
  allowed_ips: ["192.168.1.1"]
```

**Expected Response** (if IP not listed)

```bash
{
    "error": {
        "message": "Access forbidden: IP address not allowed.",
        "type": "auth_error",
        "param": "None",
        "code": 403
    }
}
```
````
