---
type: "Documentation page"
title: "Scrub Data"
description: "Scrub Logged Data Redact messages / mask PII before sending data to logging integrations (langfuse/etc.). See our Presidio PII Masking for reference. 1. Setup a custom callback..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/scrub_data.md"
tags: ["docs","documentation-page"]
source_path: "docs/observability/scrub_data.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/observability/scrub_data.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/observability/scrub_data.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# Scrub Logged Data

Redact messages / mask PII before sending data to logging integrations (langfuse/etc.).

See our [**Presidio PII Masking**](https://github.com/BerriAI/litellm/blob/a176feeacc5fdf504747978d82056eb84679c4be/litellm/proxy/hooks/presidio_pii_masking.py#L286) for reference.

1. Setup a custom callback 

```python
from litellm.integrations.custom_logger import CustomLogger

class MyCustomHandler(CustomLogger):
    async def async_logging_hook(
        self, kwargs: dict, result: Any, call_type: str
    ) -> Tuple[dict, Any]:
        """
        For masking logged request/response. Return a modified version of the request/result. 
        
        Called before `async_log_success_event`.
        """
        if (
            call_type == "completion" or call_type == "acompletion"
        ):  # /chat/completions requests
            messages: Optional[List] = kwargs.get("messages", None)

            kwargs["messages"] = [{"role": "user", "content": "MASK_THIS_ASYNC_VALUE"}]

        return kwargs, responses

    def logging_hook(
        self, kwargs: dict, result: Any, call_type: str
    ) -> Tuple[dict, Any]:
        """
        For masking logged request/response. Return a modified version of the request/result.

        Called before `log_success_event`.
        """
        if (
            call_type == "completion" or call_type == "acompletion"
        ):  # /chat/completions requests
            messages: Optional[List] = kwargs.get("messages", None)

            kwargs["messages"] = [{"role": "user", "content": "MASK_THIS_SYNC_VALUE"}]

        return kwargs, responses


customHandler = MyCustomHandler()
```


2. Connect custom handler to LiteLLM

```python
import litellm

litellm.callbacks = [customHandler]
```

3. Test it!

```python
# uv add langfuse 

import os
import litellm
from litellm import completion 

os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""
# Optional, defaults to https://cloud.langfuse.com
os.environ["LANGFUSE_HOST"] # optional
# LLM API Keys
os.environ['OPENAI_API_KEY']=""

litellm.callbacks = [customHandler]
litellm.success_callback = ["langfuse"]



## sync 
response = completion(model="gpt-3.5-turbo", messages=[{ "role": "user", "content": "Hi 👋 - i'm openai"}],
                              stream=True)
for chunk in response: 
    continue


## async
import asyncio 

def async completion():
    response = await acompletion(model="gpt-3.5-turbo", messages=[{ "role": "user", "content": "Hi 👋 - i'm openai"}],
                              stream=True)
    async for chunk in response: 
        continue
asyncio.run(completion())
```
````
