---
type: "Documentation page"
title: "Langfuse"
description: "Langfuse SDK Pass through endpoints for Langfuse call langfuse endpoints with LiteLLM Virtual Key. Just replace https://us.cloud.langfuse.com with LITELLM PROXY BASE URL/langfus..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/pass_through/langfuse.md"
tags: ["docs","documentation-page"]
source_path: "docs/pass_through/langfuse.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/pass_through/langfuse.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/pass_through/langfuse.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Langfuse SDK

Pass-through endpoints for Langfuse - call langfuse endpoints with LiteLLM Virtual Key.

Just replace `https://us.cloud.langfuse.com` with `LITELLM_PROXY_BASE_URL/langfuse` 🚀

#### **Example Usage**
```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="LITELLM_VIRTUAL_KEY",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```

Supports **ALL** Langfuse Endpoints.

[**See All Langfuse Endpoints**](https://api.reference.langfuse.com/)

## Quick Start

Let's log a trace to Langfuse.

1. Add Langfuse Public/Private keys to environment

```bash
export LANGFUSE_PUBLIC_KEY=""
export LANGFUSE_PRIVATE_KEY=""
```

2. Start LiteLLM Proxy 

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

3. Test it! 

Let's log a trace to Langfuse! 

```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="anything",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```


## Advanced - Use with Virtual Keys 

Pre-requisites
- [Setup proxy with DB](../proxy/virtual_keys.md#setup)

Use this, to avoid giving developers the raw Google AI Studio key, but still letting them use Google AI Studio endpoints.

### Usage

1. Setup environment

```bash
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export LANGFUSE_PUBLIC_KEY=""
export LANGFUSE_PRIVATE_KEY=""
```

```bash
litellm

# RUNNING on http://0.0.0.0:4000
```

2. Generate virtual key 

```bash
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

Expected Response 

```bash
{
    ...
    "key": "sk-1234ewknldferwedojwojw"
}
```

3. Test it! 


```python
from langfuse import Langfuse

langfuse = Langfuse(
    host="http://localhost:4000/langfuse", # your litellm proxy endpoint
    public_key="anything",        # no key required since this is a pass through
    secret_key="sk-1234ewknldferwedojwojw",        # no key required since this is a pass through
)

print("sending langfuse trace request")
trace = langfuse.trace(name="test-trace-litellm-proxy-passthrough")
print("flushing langfuse request")
langfuse.flush()

print("flushed langfuse request")
```

## [Advanced - Log to separate langfuse projects (by key/team)](../proxy/team_logging.md)
````
