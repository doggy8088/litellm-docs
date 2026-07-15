---
type: "Standalone page"
title: "Stream"
description: "Streaming Responses & Async Completion Streaming Responses Async Completion Streaming Responses LiteLLM supports streaming the model response back by passing stream=True as an a..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/src/pages/stream.md"
tags: ["pages","standalone-page"]
source_path: "src/pages/stream.md"
source_area: "pages"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`src/pages/stream.md`](https://github.com/BerriAI/litellm-docs/blob/main/src/pages/stream.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Streaming Responses & Async Completion

- [Streaming Responses](#streaming-responses)
- [Async Completion](#async-completion)

## Streaming Responses
LiteLLM supports streaming the model response back by passing `stream=True` as an argument to the completion function
### Usage
```python
response = completion(model="gpt-3.5-turbo", messages=messages, stream=True)
for chunk in response:
    print(chunk['choices'][0]['delta'])

```

## Async Completion
Asynchronous Completion with LiteLLM
LiteLLM provides an asynchronous version of the completion function called `acompletion`
### Usage
```
from litellm import acompletion
import asyncio

async def test_get_response():
    user_message = "Hello, how are you?"
    messages = [{"content": user_message, "role": "user"}]
    response = await acompletion(model="gpt-3.5-turbo", messages=messages)
    return response

response = asyncio.run(test_get_response())
print(response)

```

## Streaming Token Usage 

Supported across all providers. Works the same as openai. 

`stream_options={"include_usage": True}`

If set, an additional chunk will be streamed before the data: [DONE] message. The usage field on this chunk shows the token usage statistics for the entire request, and the choices field will always be an empty array. All other chunks will also include a usage field, but with a null value.

### SDK 
```python 
from litellm import completion 
import os

os.environ["OPENAI_API_KEY"] = "" 

response = completion(model="gpt-3.5-turbo", messages=messages, stream=True, stream_options={"include_usage": True})
for chunk in response:
    print(chunk['choices'][0]['delta'])
```

### PROXY

```bash 
curl https://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "stream": true,
    "stream_options": {"include_usage": true}
  }'

```
````
