import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 自訂 API Server（自訂格式） {#custom-api-server-custom-format}

透過 LiteLLM 呼叫您的自訂 torch-serve / 內部 LLM API

:::info

- 如需呼叫 openai-compatible 端點，請[前往此處](./openai_compatible.md)
- 如需在 proxy 上修改傳入/傳出請求，請[前往此處](../proxy/call_hooks.md)
:::

支援的路由：
- `/v1/chat/completions` -> `litellm.acompletion`
- `/v1/completions` -> `litellm.atext_completion`
- `/v1/embeddings` -> `litellm.aembedding`
- `/v1/images/generations` -> `litellm.aimage_generation`
- `/v1/images/edits` -> `litellm.aimage_edit`

- `/v1/messages` -> `litellm.acompletion`

## 快速開始  {#quick-start}

```python showLineNumbers
import litellm
from litellm import CustomLLM, completion, get_llm_provider


class MyCustomLLM(CustomLLM):
    def completion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

my_custom_llm = MyCustomLLM()

litellm.custom_provider_map = [ # 👈 KEY STEP - REGISTER HANDLER
        {"provider": "my-custom-llm", "custom_handler": my_custom_llm}
    ]

resp = completion(
        model="my-custom-llm/my-fake-model",
        messages=[{"role": "user", "content": "Hello world!"}],
    )

assert resp.choices[0].message.content == "Hi!"
```

## OpenAI Proxy 用法 {#openai-proxy-usage}

1. 設定您的 `custom_handler.py` 檔案 

```python
import litellm
from litellm import CustomLLM, completion, get_llm_provider


class MyCustomLLM(CustomLLM):
    def completion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

    async def acompletion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore


my_custom_llm = MyCustomLLM()
```

2. 加入到 `config.yaml` 

在下方設定中，我們傳入

python_filename: `custom_handler.py`
custom_handler_instance_name: `my_custom_llm`。這在步驟 1 中已定義

custom_handler: `custom_handler.my_custom_llm`

```yaml
model_list:
  - model_name: "test-model"             
    litellm_params:
      model: "openai/text-embedding-ada-002"
  - model_name: "my-custom-model"
    litellm_params:
      model: "my-custom-llm/my-model"

litellm_settings:
  custom_provider_map:
  - {"provider": "my-custom-llm", "custom_handler": custom_handler.my_custom_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "my-custom-model",
    "messages": [{"role": "user", "content": "Say \"this is a test\" in JSON!"}],
}'
```

預期回應

```
{
    "id": "chatcmpl-06f1b9cd-08bc-43f7-9814-a69173921216",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "Hi!",
                "role": "assistant",
                "tool_calls": null,
                "function_call": null
            }
        }
    ],
    "created": 1721955063,
    "model": "gpt-3.5-turbo",
    "object": "chat.completion",
    "system_fingerprint": null,
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20,
        "total_tokens": 30
    }
}
```

## 新增串流支援  {#add-streaming-support}

這裡有一個簡單範例，示範如何在 completion + streaming 兩種情境下回傳 unix epoch 秒數。 

感謝 [@Eloy Lafuente](https://github.com/stronk7) 提供這個程式碼範例。

```python
import time
from typing import Iterator, AsyncIterator
from litellm.types.utils import GenericStreamingChunk, ModelResponse
from litellm import CustomLLM, completion, acompletion

class UnixTimeLLM(CustomLLM):
    def completion(self, *args, **kwargs) -> ModelResponse:
        return completion(
            model="test/unixtime",
            mock_response=str(int(time.time())),
        )  # type: ignore

    async def acompletion(self, *args, **kwargs) -> ModelResponse:
        return await acompletion(
            model="test/unixtime",
            mock_response=str(int(time.time())),
        )  # type: ignore

    def streaming(self, *args, **kwargs) -> Iterator[GenericStreamingChunk]:
        generic_streaming_chunk: GenericStreamingChunk = {
            "finish_reason": "stop",
            "index": 0,
            "is_finished": True,
            "text": str(int(time.time())),
            "tool_use": None,
            "usage": {"completion_tokens": 0, "prompt_tokens": 0, "total_tokens": 0},
        }
        return generic_streaming_chunk # type: ignore

    async def astreaming(self, *args, **kwargs) -> AsyncIterator[GenericStreamingChunk]:
        generic_streaming_chunk: GenericStreamingChunk = {
            "finish_reason": "stop",
            "index": 0,
            "is_finished": True,
            "text": str(int(time.time())),
            "tool_use": None,
            "usage": {"completion_tokens": 0, "prompt_tokens": 0, "total_tokens": 0},
        }
        yield generic_streaming_chunk # type: ignore

unixtime = UnixTimeLLM()
```

## 圖片生成 {#image-generation}

1. 設定您的 `custom_handler.py` 檔案 
```python
import litellm
from litellm import CustomLLM
from litellm.types.utils import ImageResponse, ImageObject


class MyCustomLLM(CustomLLM):
    async def aimage_generation(self, model: str, prompt: str, model_response: ImageResponse, optional_params: dict, logging_obj: Any, timeout: Optional[Union[float, httpx.Timeout]] = None, client: Optional[AsyncHTTPHandler] = None,) -> ImageResponse:
        return ImageResponse(
            created=int(time.time()),
            data=[ImageObject(url="https://example.com/image.png")],
        )

my_custom_llm = MyCustomLLM()
```


2. 加入到 `config.yaml` 

在下方設定中，我們傳入

python_filename: `custom_handler.py`
custom_handler_instance_name: `my_custom_llm`。這在步驟 1 中已定義

custom_handler: `custom_handler.my_custom_llm`

```yaml
model_list:
  - model_name: "test-model"             
    litellm_params:
      model: "openai/text-embedding-ada-002"
  - model_name: "my-custom-model"
    litellm_params:
      model: "my-custom-llm/my-model"

litellm_settings:
  custom_provider_map:
  - {"provider": "my-custom-llm", "custom_handler": custom_handler.my_custom_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -X POST 'http://0.0.0.0:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "my-custom-model",
    "prompt": "A cute baby sea otter",
}'
```

預期回應

```
{
    "created": 1721955063,
    "data": [{"url": "https://example.com/image.png"}],
}
```

## 圖片編輯 {#image-edit}

1. 設定您的 `custom_handler.py` 檔案
```python
import litellm
from litellm import CustomLLM
from litellm.types.utils import ImageResponse, ImageObject
import time

class MyCustomLLM(CustomLLM):
    async def aimage_edit(
        self,
        model: str,
        image: Any,
        prompt: str,
        model_response: ImageResponse,
        api_key: Optional[str],
        api_base: Optional[str],
        optional_params: dict,
        logging_obj: Any,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
        client: Optional[AsyncHTTPHandler] = None,
    ) -> ImageResponse:
        # Your custom image edit logic here
        # e.g., call Stability AI, Black Forest Labs, etc.
        return ImageResponse(
            created=int(time.time()),
            data=[ImageObject(url="https://example.com/edited-image.png")],
        )

my_custom_llm = MyCustomLLM()
```


2. 加入到 `config.yaml`

在下方設定中，我們傳入

python_filename: `custom_handler.py`
custom_handler_instance_name: `my_custom_llm`。這在步驟 1 中已定義

custom_handler: `custom_handler.my_custom_llm`

```yaml
model_list:
  - model_name: "my-custom-image-edit-model"
    litellm_params:
      model: "my-custom-llm/my-model"

litellm_settings:
  custom_provider_map:
  - {"provider": "my-custom-llm", "custom_handler": custom_handler.my_custom_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/v1/images/edits' \
-H 'Authorization: Bearer sk-1234' \
-F 'model=my-custom-image-edit-model' \
-F 'image=@/path/to/image.png' \
-F 'prompt=Make the sky blue'
```

預期回應

```
{
    "created": 1721955063,
    "data": [{"url": "https://example.com/edited-image.png"}],
}
```

## Anthropic `/v1/messages` {#anthropic-v1messages}

- 為 .acompletion 撰寫整合
- litellm 會將其轉換為 /v1/messages

1. 設定您的 `custom_handler.py` 檔案 

```python
import litellm
from litellm import CustomLLM, completion, get_llm_provider


class MyCustomLLM(CustomLLM):
    async def acompletion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore


my_custom_llm = MyCustomLLM()
```

2. 加入到 `config.yaml` 

在下方設定中，我們傳入

python_filename: `custom_handler.py`
custom_handler_instance_name: `my_custom_llm`。這在步驟 1 中已定義

custom_handler: `custom_handler.my_custom_llm`

```yaml
model_list:
  - model_name: "test-model"             
    litellm_params:
      model: "openai/text-embedding-ada-002"
  - model_name: "my-custom-model"
    litellm_params:
      model: "my-custom-llm/my-model"

litellm_settings:
  custom_provider_map:
  - {"provider": "my-custom-llm", "custom_handler": custom_handler.my_custom_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/messages' \
-H 'anthropic-version: 2023-06-01' \
-H 'content-type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
   "model": "my-custom-model",
     "max_tokens": 1024,
     "messages": [{
         "role": "user",
         "content": [
         {
             "type": "text",
             "text": "What are the key findings in this document 12?"
         }]
     }]
}'
```

預期回應

```json
{
    "id": "chatcmpl-Bm4qEp4h4vCe7Zi4Gud1MAxTWgibO",
    "type": "message",
    "role": "assistant",
    "model": "gpt-3.5-turbo-0125",
    "stop_sequence": null,
    "usage": {
        "input_tokens": 18,
        "output_tokens": 44
    },
    "content": [
        {
            "type": "text",
            "text": "Without the specific document being provided, it is not possible to determine the key findings within it. If you can provide the content or a summary of document 12, I would be happy to help identify the key findings."
        }
    ],
    "stop_reason": "end_turn"
}
```


## 其他參數 {#additional-parameters}

其他參數會透過 `optional_params` 鍵傳入 `completion` 或 `image_generation` 函式中。

以下是設定方式： 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm
from litellm import CustomLLM, completion, get_llm_provider


class MyCustomLLM(CustomLLM):
    def completion(self, *args, **kwargs) -> litellm.ModelResponse:
        assert kwargs["optional_params"] == {"my_custom_param": "my-custom-param"} # 👈 CHECK HERE
        return litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

my_custom_llm = MyCustomLLM()

litellm.custom_provider_map = [ # 👈 KEY STEP - REGISTER HANDLER
        {"provider": "my-custom-llm", "custom_handler": my_custom_llm}
    ]

resp = completion(model="my-custom-llm/my-model", my_custom_param="my-custom-param")
```

</TabItem>
<TabItem value="proxy" label="Proxy">

1. 設定您的 `custom_handler.py` 檔案 
```python
import litellm
from litellm import CustomLLM
from litellm.types.utils import ImageResponse, ImageObject


class MyCustomLLM(CustomLLM):
    async def aimage_generation(self, model: str, prompt: str, model_response: ImageResponse, optional_params: dict, logging_obj: Any, timeout: Optional[Union[float, httpx.Timeout]] = None, client: Optional[AsyncHTTPHandler] = None,) -> ImageResponse:
        assert optional_params == {"my_custom_param": "my-custom-param"} # 👈 CHECK HERE
        return ImageResponse(
            created=int(time.time()),
            data=[ImageObject(url="https://example.com/image.png")],
        )

my_custom_llm = MyCustomLLM()
```


2. 加入到 `config.yaml` 

在下方設定中，我們傳入

python_filename: `custom_handler.py`
custom_handler_instance_name: `my_custom_llm`。這在步驟 1 中已定義

custom_handler: `custom_handler.my_custom_llm`

```yaml
model_list:
  - model_name: "test-model"             
    litellm_params:
      model: "openai/text-embedding-ada-002"
  - model_name: "my-custom-model"
    litellm_params:
      model: "my-custom-llm/my-model"
      my_custom_param: "my-custom-param" # 👈 CUSTOM PARAM

litellm_settings:
  custom_provider_map:
  - {"provider": "my-custom-llm", "custom_handler": custom_handler.my_custom_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash
curl -X POST 'http://0.0.0.0:4000/v1/images/generations' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
    "model": "my-custom-model",
    "prompt": "A cute baby sea otter",
}'
```

</TabItem>
</Tabs>

## 自訂 Handler 規格 {#custom-handler-spec}

```python
from litellm.types.utils import GenericStreamingChunk, ModelResponse, ImageResponse
from typing import Iterator, AsyncIterator, Any, Optional, Union
from litellm.llms.base import BaseLLM

class CustomLLMError(Exception):  # use this for all your exceptions
    def __init__(
        self,
        status_code,
        message,
    ):
        self.status_code = status_code
        self.message = message
        super().__init__(
            self.message
        )  # Call the base class constructor with the parameters it needs

class CustomLLM(BaseLLM):
    def __init__(self) -> None:
        super().__init__()

    def completion(self, *args, **kwargs) -> ModelResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    def streaming(self, *args, **kwargs) -> Iterator[GenericStreamingChunk]:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    async def acompletion(self, *args, **kwargs) -> ModelResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    async def astreaming(self, *args, **kwargs) -> AsyncIterator[GenericStreamingChunk]:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    def image_generation(
        self,
        model: str,
        prompt: str,
        model_response: ImageResponse,
        optional_params: dict,
        logging_obj: Any,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
        client: Optional[HTTPHandler] = None,
    ) -> ImageResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    async def aimage_generation(
        self,
        model: str,
        prompt: str,
        model_response: ImageResponse,
        optional_params: dict,
        logging_obj: Any,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
        client: Optional[AsyncHTTPHandler] = None,
    ) -> ImageResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    def image_edit(
        self,
        model: str,
        image: Any,
        prompt: str,
        model_response: ImageResponse,
        api_key: Optional[str],
        api_base: Optional[str],
        optional_params: dict,
        logging_obj: Any,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
        client: Optional[HTTPHandler] = None,
    ) -> ImageResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    async def aimage_edit(
        self,
        model: str,
        image: Any,
        prompt: str,
        model_response: ImageResponse,
        api_key: Optional[str],
        api_base: Optional[str],
        optional_params: dict,
        logging_obj: Any,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
        client: Optional[AsyncHTTPHandler] = None,
    ) -> ImageResponse:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")
```
