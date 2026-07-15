---
type: "Documentation page"
title: "Credential Usage Tracking"
description: "Credential Usage Tracking When a model is attached to a reusable credential, LiteLLM automatically injects the credential name as a tag on every request that uses that model. Th..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/credential_usage_tracking.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/credential_usage_tracking.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/credential_usage_tracking.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/credential_usage_tracking.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Credential Usage Tracking

When a model is attached to a [reusable credential](./ui_credentials.md), LiteLLM automatically injects the credential name as a tag on every request that uses that model. This means credential-level spend and usage are tracked with zero extra configuration.

## How It Works

When you attach a model to a reusable credential via `litellm_credential_name`, each request routed through that model is tagged `Credential: <name>` (for example, `Credential: xAI`). This tag flows into `DailyTagSpend` and appears in the **Tag** view on the Usage page, where you can filter spend and usage by credential.

If a model has no credential attached, behavior is unchanged—no credential tag is added.

## Viewing Credential Usage

In the Admin UI, go to **Usage → Tag** and look for tags with the `Credential: ` prefix. These represent aggregated spend and token usage across all requests that used that credential.

## Related Documentation

- [Adding LLM Credentials](./ui_credentials.md) - How to create and attach reusable credentials to models
- [Tag Budgets](./tag_budgets.md) - Setting spend limits on tags
- [Tag Routing](./tag_routing.md) - Routing requests based on tags
````
