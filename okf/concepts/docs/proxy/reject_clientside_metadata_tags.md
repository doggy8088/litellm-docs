---
type: "Documentation page"
title: "Reject Clientside Metadata Tags"
description: "Reject Client Side Metadata Tags Overview The reject clientside metadata tags setting allows you to prevent users from passing client side metadata.tags in their API requests. T..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/reject_clientside_metadata_tags.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/reject_clientside_metadata_tags.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/reject_clientside_metadata_tags.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/reject_clientside_metadata_tags.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Reject Client-Side Metadata Tags

## Overview

The `reject_clientside_metadata_tags` setting allows you to prevent users from passing client-side `metadata.tags` in their API requests. This ensures that tags are only inherited from the API key metadata and cannot be overridden by users to potentially influence budget tracking or routing decisions.

## Use Case

This feature is particularly useful in multi-tenant scenarios where:
- You want to enforce strict budget tracking based on API key tags
- You want to prevent users from manipulating routing decisions by sending custom client-side tags
- You need to ensure consistent tag-based filtering and reporting

## Configuration

Add the following to your `config.yaml`:

```yaml
general_settings:
  reject_clientside_metadata_tags: true  # Default is false/null
```

## Behavior

### When `reject_clientside_metadata_tags: true`

**Rejected Request Example:**
```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {
      "tags": ["custom-tag"]  # This will be rejected
    }
  }'
```

**Error Response:**
```json
{
  "error": {
    "message": "Client-side 'metadata.tags' not allowed in request. 'reject_clientside_metadata_tags'=True. Tags can only be set via API key metadata.",
    "type": "bad_request_error",
    "param": "metadata.tags",
    "code": 400
  }
}
```

**Allowed Request Example:**
```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {
      "custom_field": "value"  # Other metadata fields are allowed
    }
  }'
```

### When `reject_clientside_metadata_tags: false` or not set

All requests are allowed, including those with client-side `metadata.tags`.

## Setting Tags via API Key

When `reject_clientside_metadata_tags` is enabled, tags should be set on the API key metadata:

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "tags": ["team-a", "production"]
    }
  }'
```

These tags will be automatically inherited by all requests made with that API key.

## Complete Example Configuration

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-1234
  database_url: "postgresql://user:password@localhost:5432/litellm"
  
  # Reject client-side tags
  reject_clientside_metadata_tags: true
  
  # Optional: Also enforce user parameter
  enforce_user_param: true
```

## Similar Features

- `enforce_user_param` - Requires all requests to include a 'user' parameter
- Tag-based routing - Use tags for intelligent request routing
- Budget tracking - Track spending per tag

## Notes

- This check only applies to LLM API routes (e.g., `/chat/completions`, `/embeddings`)
- Management endpoints (e.g., `/key/generate`) are not affected
- The check validates that client-side `metadata.tags` is not present in the request body
- Other metadata fields can still be passed in requests
- Tags set on API keys will still be applied to all requests
````
