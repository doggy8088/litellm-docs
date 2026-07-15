---
type: "Documentation page"
title: "Rules"
description: "Post Call Rules Use this to fail a request based on the output of an llm api call. Quick Start Step 1: Create a file (e.g. post call rules.py) Step 2. Point it to your proxy Ste..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/rules.md"
tags: ["docs","documentation-page"]
source_path: "docs/proxy/rules.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/proxy/rules.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/rules.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Post-Call Rules 

Use this to fail a request based on the output of an llm api call.

## Quick Start

### Step 1: Create a file (e.g. post_call_rules.py)

```python
def my_custom_rule(input): # receives the model response 
    if len(input) < 5: 
      return {
            "decision": False,
            "message": "This violates LiteLLM Proxy Rules. Response too short"
      }
    return {"decision": True}   # message not required since, request will pass
```

### Step 2. Point it to your proxy

```python
litellm_settings:
  post_call_rules: post_call_rules.my_custom_rule
```

### Step 3. Start + test your proxy

```bash
$ litellm /path/to/config.yaml
```

```bash
curl --location 'http://0.0.0.0:4000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
  "model": "gpt-3.5-turbo",
  "messages": [{"role":"user","content":"What llm are you?"}],
  "temperature": 0.7,
  "max_tokens": 10,
}'
```
---

This will now check if a response is > len 5, and if it fails, it'll retry a call 3 times before failing.

### Response that fail the rule

This is the response from LiteLLM Proxy on failing a rule

```json
{
  "error":
    {
      "message":"This violates LiteLLM Proxy Rules. Response too short",
      "type":null,
      "param":null,
      "code":500
    }
}   
```
````
