# 清理已記錄資料 {#scrub-logged-data}

在將資料傳送至記錄整合（langfuse/etc.）之前，先將訊息去識別化／遮罩 PII。

請參考我們的 [**Presidio PII 遮罩**](https://github.com/BerriAI/litellm/blob/a176feeacc5fdf504747978d82056eb84679c4be/litellm/proxy/hooks/presidio_pii_masking.py#L286)。

1. 設定自訂回呼 

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


2. 將自訂處理器連接到 LiteLLM

```python
import litellm

litellm.callbacks = [customHandler]
```

3. 測試它！

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
