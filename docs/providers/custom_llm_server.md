---
title: "LiteLLM 中的自訂 LLM 伺服器處理器"
sidebar_label: "自訂 API 伺服器 (自訂格式)"
description: "透過 LiteLLM 以自訂處理器類別呼叫您自己的模型 API：聊天、串流、圖片生成、影片與 /v1/messages，並在 config.yaml 中接線設定。"
---

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
- `/v1beta/models/{model}:generateContent` -> `litellm.agenerate_content`

- `/v1/messages` -> `litellm.acompletion`

## 快速開始  {#quick-start}

```python showLineNumbers
import litellm
from litellm import CustomLLM, completion, get_llm_provider


class MyCustomLLM(CustomLLM):
    def completion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="{{openai_small}}",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

my_custom_llm = MyCustomLLM()

litellm.custom_provider_map = [ # KEY STEP - REGISTER HANDLER
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
            model="{{openai_small}}",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

    async def acompletion(self, *args, **kwargs) -> litellm.ModelResponse:
        return litellm.completion(
            model="{{openai_small}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
    "model": "{{openai_small}}",
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
    async def aimage_generation(self, model: str, prompt: str, model_response: ImageResponse, api_key: Optional[str], api_base: Optional[str], optional_params: dict, logging_obj: Any, timeout: Optional[Union[float, httpx.Timeout]] = None, client: Optional[AsyncHTTPHandler] = None,) -> ImageResponse:
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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

## 影片生成 {#video-generation}

影片工作是非同步的，因此自訂影片提供者不是 `CustomLLM` 處理器。它是 `BaseVideoConfig` 的子類別，描述您的後端的 HTTP 請求與回覆，並由 LiteLLM 共用的 HTTP 用戶端送出。呼叫者會立即從 `POST /v1/videos` 取得工作 id，並輪詢 `GET /v1/videos/{id}` 直到工作完成，因此影片渲染期間不需要保持任何連線開啟。

1. 設定您的 `custom_video.py` 檔案

建立、狀態與內容路由會呼叫上方的方法。底部的 list、remix 與 delete 方法在 `BaseVideoConfig` 上同樣是抽象方法，因此必須存在；當您的後端沒有這類呼叫時，可以拋出 `NotImplementedError`。

```python
import httpx
from litellm.llms.base_llm.videos.transformation import BaseVideoConfig
from litellm.types.videos.main import VideoObject
from litellm.types.videos.utils import encode_video_id_with_provider, extract_original_video_id


class MyVideoConfig(BaseVideoConfig):
    def get_supported_openai_params(self, model):
        return ["seconds"]

    def map_openai_params(self, video_create_optional_params, model, drop_params):
        return {k: v for k, v in video_create_optional_params.items() if k == "seconds"}

    def validate_environment(self, headers, model, api_key=None, litellm_params=None):
        key = (litellm_params.api_key if litellm_params is not None else None) or api_key or ""
        return {**headers, "X-Api-Key": key}

    def get_complete_url(self, model, api_base, litellm_params):
        return f"{api_base.rstrip('/')}/jobs"

    def transform_video_create_request(self, model, prompt, api_base, video_create_optional_request_params, litellm_params, headers):
        body = {"model": model, "prompt": prompt, "seconds": video_create_optional_request_params.get("seconds")}
        return body, [], api_base  # (json body, files, url)

    def transform_video_create_response(self, model, raw_response, logging_obj, custom_llm_provider=None, request_data=None):
        job = raw_response.json()
        video_id = encode_video_id_with_provider(job["job_id"], custom_llm_provider, model)
        return VideoObject(id=video_id, object="video", status="queued", created_at=0, model=model)

    def transform_video_status_retrieve_request(self, video_id, api_base, litellm_params, headers):
        return f"{api_base}/{extract_original_video_id(video_id)}", {}  # empty body means GET

    def transform_video_status_retrieve_response(self, raw_response, logging_obj, custom_llm_provider=None, client=None):
        job = raw_response.json()
        status = "completed" if job["state"] == "done" else "in_progress"
        return VideoObject(id=encode_video_id_with_provider(job["job_id"], custom_llm_provider), object="video", status=status, created_at=0)

    def transform_video_content_request(self, video_id, api_base, litellm_params, headers, variant=None):
        return f"{api_base}/{extract_original_video_id(video_id)}/file", {}

    def transform_video_content_response(self, raw_response, logging_obj, client=None):
        return raw_response.content

    # The list, remix and delete methods are abstract too. Raise when your backend has no such call.
    def transform_video_list_request(self, api_base, litellm_params, headers, after=None, limit=None, order=None, extra_query=None):
        return api_base, {}

    def transform_video_list_response(self, raw_response, logging_obj, custom_llm_provider=None):
        return raw_response.json()

    def transform_video_remix_request(self, video_id, prompt, api_base, litellm_params, headers, extra_body=None):
        raise NotImplementedError("remix is not supported")

    def transform_video_remix_response(self, raw_response, logging_obj, custom_llm_provider=None):
        raise NotImplementedError("remix is not supported")

    def transform_video_delete_request(self, video_id, api_base, litellm_params, headers):
        raise NotImplementedError("delete is not supported")

    def transform_video_delete_response(self, raw_response, logging_obj):
        raise NotImplementedError("delete is not supported")


my_video_config = MyVideoConfig()
```

2. 加入到 `config.yaml`

在 `model` 中 `/` 之前的提供者名稱，就是您在 `custom_provider_map` 中註冊的名稱。部署上的 `api_base` 與 `api_key` 會透過 `get_complete_url` 與 `validate_environment` 傳入您的設定。

```yaml
model_list:
  - model_name: "my-video-model"
    litellm_params:
      model: "my-video-provider/seedance-1"
      api_base: "https://video.internal.example.com"
      api_key: os.environ/MY_VIDEO_API_KEY

litellm_settings:
  custom_provider_map:
  - {"provider": "my-video-provider", "custom_handler": custom_video.my_video_config}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/v1/videos' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{"model": "my-video-model", "prompt": "A cute baby sea otter", "seconds": "8"}'
```

預期回應

```
{"id": "video_bGl0ZWxs...", "object": "video", "status": "queued", "model": "seedance-1", ...}
```

此 id 帶有您的提供者名稱，因此狀態與內容路由能找到您的設定，呼叫者無需說明是哪個提供者。

```bash
curl 'http://0.0.0.0:4000/v1/videos/video_bGl0ZWxs...' -H "Authorization: Bearer $LITELLM_API_KEY"
curl 'http://0.0.0.0:4000/v1/videos/video_bGl0ZWxs.../content' -H "Authorization: Bearer $LITELLM_API_KEY" --output video.mp4
```

以 `CustomLLM` 處理器註冊的提供者沒有影片方法，因此對它發出的影片請求會回傳 `400 video generation is not supported for <provider>`。

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
            model="{{openai_small}}",
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
    "model": "{{openai_small}}",
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


## Google GenAI `generateContent` {#google-genai-generatecontent}

<SinceVersion v="1.111.0" />

自訂提供者以兩種方式之一提供 `/v1beta/models/{model}:generateContent`。

當處理器覆寫 `agenerate_content` (同步 SDK 呼叫則為 `generate_content`) 時，LiteLLM 會將原生請求傳給它。該 hook 會取得 `contents`、完整的 `generationConfig` (作為 `config`)，以及呼叫者送出的 `tools`，其他請求欄位如 `systemInstruction` 則位於 `optional_params` 中。它回傳 Gemini 的 `GenerateContentResponse`，可以是 dict 或 google-genai SDK 物件，呼叫者會以 Gemini 的 camelCase JSON 形式取回，支出則依其 `usageMetadata` 計算。此方式適用於圖片模型，以及任何需要 `imageConfig` 或 `responseModalities` 等原生設定的情況。

當處理器只有聊天 hooks 時，LiteLLM 會將請求轉換為聊天補全，並將回覆轉換回來。該路徑會傳送文字、圖片、工具、`temperature`、`maxOutputTokens`、`topP`、`stopSequences` 與 JSON 回應 schema。任何其他 `generationConfig` 鍵都會回應 `400`，除非部署設定了 `drop_params: true`。例外是 `responseModalities: ["TEXT"]` 與 `candidateCount: 1`，聊天回覆已能滿足這兩者。

串流 (`:streamGenerateContent`) 一律透過聊天 hooks，因此需要 `streaming` 或 `astreaming`。沒有這些方法的處理器會在呼叫任何東西之前回應 `500`，而該部署仍可繼續服務其其他請求。

1. 設定您的 `custom_handler.py` 檔案

```python
import os

import httpx
from litellm import CustomLLM

GEMINI = "https://generativelanguage.googleapis.com/v1beta"


class MyImageLLM(CustomLLM):
    async def agenerate_content(self, model, contents, config, tools, optional_params, **kwargs):
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{GEMINI}/models/{model}:generateContent",
                headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
                json={"contents": contents, "generationConfig": config or {}},
            )
        response.raise_for_status()
        return response.json()


my_image_llm = MyImageLLM()
```

2. 加入到 `config.yaml`

在部署上設定價格以便追蹤支出，因為 LiteLLM 沒有自訂提供者模型的價格。

```yaml
model_list:
  - model_name: my-image-model
    litellm_params:
      model: my-image-llm/gemini-3.1-flash-image
      input_cost_per_token: 0.0000005
      output_cost_per_token: 0.00003

litellm_settings:
  custom_provider_map:
  - {"provider": "my-image-llm", "custom_handler": custom_handler.my_image_llm}
```

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！

```bash
curl -X POST 'http://0.0.0.0:4000/v1beta/models/my-image-model:generateContent' \
-H 'content-type: application/json' \
-H "x-goog-api-key: $LITELLM_API_KEY" \
-d '{
    "contents": [{"role": "user", "parts": [{"text": "A red apple on a white table"}]}],
    "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}}
}'
```

預期回應，圖片位元組已縮短

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "image/jpeg",
              "data": "/9j/4AAQSkZJRgAB..."
            },
            "thoughtSignature": "ErjWMgq01jIBaRR9..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 1536,
    "totalTokenCount": 1544,
    "candidatesTokensDetails": [{"modality": "IMAGE", "tokenCount": 1120}]
  },
  "modelVersion": "gemini-3.1-flash-image"
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
        assert kwargs["optional_params"] == {"my_custom_param": "my-custom-param"} # CHECK HERE
        return litellm.completion(
            model="{{openai_small}}",
            messages=[{"role": "user", "content": "Hello world"}],
            mock_response="Hi!",
        )  # type: ignore

my_custom_llm = MyCustomLLM()

litellm.custom_provider_map = [ # KEY STEP - REGISTER HANDLER
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
    async def aimage_generation(self, model: str, prompt: str, model_response: ImageResponse, api_key: Optional[str], api_base: Optional[str], optional_params: dict, logging_obj: Any, timeout: Optional[Union[float, httpx.Timeout]] = None, client: Optional[AsyncHTTPHandler] = None,) -> ImageResponse:
        assert optional_params == {"my_custom_param": "my-custom-param"} # CHECK HERE
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
      my_custom_param: "my-custom-param" # CUSTOM PARAM

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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
from typing import Iterator, AsyncIterator, Any, Mapping, Optional, Union

from litellm.types.google_genai.main import GenerateContentResponse
from litellm.types.router import GenericLiteLLMParams
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
        api_key: Optional[str],
        api_base: Optional[str],
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
        api_key: Optional[str],
        api_base: Optional[str],
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

    def generate_content(
        self,
        model: str,
        contents: object,
        config: Optional[Mapping[str, object]],
        tools: Optional[object],
        litellm_params: GenericLiteLLMParams,
        logging_obj: Any,
        optional_params: Mapping[str, object],
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
    ) -> Union[GenerateContentResponse, Mapping[str, object]]:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")

    async def agenerate_content(
        self,
        model: str,
        contents: object,
        config: Optional[Mapping[str, object]],
        tools: Optional[object],
        litellm_params: GenericLiteLLMParams,
        logging_obj: Any,
        optional_params: Mapping[str, object],
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        timeout: Optional[Union[float, httpx.Timeout]] = None,
    ) -> Union[GenerateContentResponse, Mapping[str, object]]:
        raise CustomLLMError(status_code=500, message="Not implemented yet!")
```
