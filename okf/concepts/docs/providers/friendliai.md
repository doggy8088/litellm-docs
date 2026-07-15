---
type: "Documentation page"
title: "Friendliai"
description: "FriendliAI :::info We support ALL FriendliAI models, just set friendliai/ as a prefix when sending completion requests ::: | Property | Details | | | | | Description | The faste..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/friendliai.md"
tags: ["docs","documentation-page"]
source_path: "docs/providers/friendliai.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/providers/friendliai.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/providers/friendliai.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# FriendliAI

:::info
**We support ALL FriendliAI models, just set `friendliai/` as a prefix when sending completion requests**
:::

| Property                   | Details                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Description                | The fastest and most efficient inference engine to build production-ready, compound AI systems. |
| Provider Route on LiteLLM  | `friendliai/`                                                                                   |
| Provider Doc               | [FriendliAI ↗](https://friendli.ai/docs/sdk/integrations/litellm)                               |
| Supported OpenAI Endpoints | `/chat/completions`, `/completions`                                                             |

## API Key

```python
# env variable
os.environ['FRIENDLI_TOKEN']
```

## Sample Usage

```python
from litellm import completion
import os

os.environ['FRIENDLI_TOKEN'] = ""
response = completion(
    model="friendliai/meta-llama-3.1-8b-instruct",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## Sample Usage - Streaming

```python
from litellm import completion
import os

os.environ['FRIENDLI_TOKEN'] = ""
response = completion(
    model="friendliai/meta-llama-3.1-8b-instruct",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## Supported Models

We support ALL FriendliAI AI models, just set `friendliai/` as a prefix when sending completion requests

| Model Name                  | Function Call                                                          |
| --------------------------- | ---------------------------------------------------------------------- |
| meta-llama-3.1-8b-instruct  | `completion(model="friendliai/meta-llama-3.1-8b-instruct", messages)`  |
| meta-llama-3.1-70b-instruct | `completion(model="friendliai/meta-llama-3.1-70b-instruct", messages)` |
````
