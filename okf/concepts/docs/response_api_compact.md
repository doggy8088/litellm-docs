---
type: "Documentation page"
title: "Response Api Compact"
description: "/responses/compact Compress conversation history using OpenAI's /responses/compact endpoint. | Feature | Supported | | | | | Supported LiteLLM Versions | 1.72.0+ | | Supported P..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/response_api_compact.md"
tags: ["docs","documentation-page"]
source_path: "docs/response_api_compact.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/response_api_compact.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/response_api_compact.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /responses/compact

Compress conversation history using OpenAI's `/responses/compact` endpoint.

| Feature | Supported |
|---------|-----------|
| Supported LiteLLM Versions | 1.72.0+ |
| Supported Providers | `openai` |

## Usage

### LiteLLM Python SDK

```python showLineNumbers title="Compact Response"
import litellm

response = litellm.compact_responses(
    model="openai/gpt-4o",
    input=[{"role": "user", "content": "Hello, how are you?"}],
    instructions="Be helpful",
    previous_response_id="resp_abc123"  # optional
)

print(response.id)
print(response.object)  # "response.compaction"
print(response.output)
```

### LiteLLM Proxy

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Compact Request"
curl http://localhost:4000/v1/responses/compact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "openai/gpt-4o",
    "input": [{"role": "user", "content": "Hello"}],
    "instructions": "Be helpful"
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Compact with OpenAI SDK"
import httpx

response = httpx.post(
    "http://localhost:4000/v1/responses/compact",
    headers={"Authorization": "Bearer sk-1234"},
    json={
        "model": "openai/gpt-4o",
        "input": [{"role": "user", "content": "Hello"}],
        "instructions": "Be helpful"
    }
)

print(response.json())
```

</TabItem>
</Tabs>

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model to use for compaction |
| `input` | string or array | Yes | Input messages to compact |
| `instructions` | string | No | System instructions |
| `previous_response_id` | string | No | ID of previous response to continue from |

## Response Format

```json
{
  "id": "resp_abc123",
  "object": "response.compaction",
  "created_at": 1734366691,
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [...]
    },
    {
      "type": "compaction",
      "encrypted_content": "..."
    }
  ],
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "total_tokens": 150
  }
}
```
````
