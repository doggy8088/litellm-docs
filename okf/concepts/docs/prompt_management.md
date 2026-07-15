---
type: "Documentation page"
title: "Prompt Management with Responses API"
description: "Prompt Management with Responses API Use LiteLLM Prompt Management with /v1/responses by passing prompt id and optional prompt variables . Basic Usage Multi turn Follow up in in..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/prompt_management.md"
tags: ["docs","documentation-page"]
source_path: "docs/prompt_management.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: ["title"]
---
# Source document

This concept mirrors [`docs/prompt_management.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/prompt_management.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
---
title: Prompt Management with Responses API
---

# Prompt Management with Responses API

Use LiteLLM Prompt Management with `/v1/responses` by passing `prompt_id` and optional `prompt_variables`.

## Basic Usage

```bash
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt_id": "my-responses-prompt",
    "prompt_variables": {"topic": "large language models"},
    "input": []
  }'
```

## Multi-turn Follow-up in `input`

To send follow-up turns in one request, pass message history in `input`.

```bash
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt_id": "my-responses-prompt",
    "prompt_variables": {"topic": "large language models"},
    "input": [
      {"role": "user", "content": "Topic is LLMs. Start short."},
      {"role": "assistant", "content": "Sure, go ahead."},
      {"role": "user", "content": "Now give me 3 bullets and include pricing caveat."}
    ]
  }'
```

## Notes

- Prompt template messages are merged with your `input` messages.
- Prompt variable substitution applies to prompt message content.
- Tool call payload fields are not substituted by prompt variables.
- For follow-ups with `previous_response_id`, include `prompt_id` again if you want prompt management applied on that turn.
````
