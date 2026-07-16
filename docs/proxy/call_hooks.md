import Image from '@theme/IdealImage';

# 修改／拒絕傳入請求 {#modify--reject-incoming-requests}

- 在對 LLM API 發出請求之前修改資料
- 在對 LLM API 發出請求之前／在回傳回應之前拒絕資料
- 強制所有 openai 端點呼叫都必須帶有 'user' 參數

:::tip
**了解回呼掛鉤？** 請查看我們的 [回呼指南](../observability/callbacks.md)，了解像 `async_pre_call_hook` 這類 proxy 專用掛鉤與像 `async_log_success_event` 這類一般記錄掛鉤之間的差異。
:::

## 我該使用哪個掛鉤？ {#which-hook-should-i-use}

| 掛鉤 | 使用情境 | 執行時間 |
|------|----------|--------------|
| `async_pre_call_hook` | 在送出給模型之前修改傳入請求 | 在發出 LLM API 請求之前 |
| `async_moderation_hook` | 以平行方式在 LLM API 請求的同時執行輸入檢查 | 與 LLM API 請求同時進行 |
| `async_post_call_success_hook` | 修改傳出回應（非串流） | 在成功的 LLM API 請求之後，針對非串流回應 |
| `async_post_call_failure_hook` | 轉換傳送給用戶端的錯誤回應 | 在失敗的 LLM API 請求之後 |
| `async_post_call_streaming_hook` | 修改傳出回應（串流） | 在成功的 LLM API 請求之後，針對串流回應 |
| `async_post_call_response_headers_hook` | 注入自訂 HTTP 回應標頭 | 在 LLM API 請求之後（成功與失敗皆適用） |

請參閱我們的 [平行請求速率限制器](https://github.com/BerriAI/litellm/blob/main/litellm/proxy/hooks/parallel_request_limiter.py) 完整範例

## 快速開始 {#quick-start}

1. 在您的自訂處理器中新增一個 `async_pre_call_hook` 函式

這個函式會在 litellm completion 呼叫即將發出之前被呼叫，並允許您修改傳入 litellm 呼叫的資料 [**查看程式碼**](https://github.com/BerriAI/litellm/blob/589a6ca863000ba8e92c897ba0f776796e7a5904/litellm/proxy/proxy_server.py#L1000)

```python
from litellm.integrations.custom_logger import CustomLogger
import litellm
from litellm.proxy.proxy_server import UserAPIKeyAuth, DualCache
from litellm.types.utils import ModelResponseStream
from typing import Any, AsyncGenerator, Optional, Literal

# This file includes the custom callbacks for LiteLLM Proxy
# Once defined, these can be passed in proxy_config.yaml
class MyCustomHandler(CustomLogger): # https://docs.litellm.ai/docs/observability/custom_callback#callback-class
    # Class variables or attributes
    def __init__(self):
        pass

    #### CALL HOOKS - proxy only #### 

    async def async_pre_call_hook(self, user_api_key_dict: UserAPIKeyAuth, cache: DualCache, data: dict, call_type: Literal[
            "completion",
            "text_completion",
            "embeddings",
            "image_generation",
            "moderation",
            "audio_transcription",
        ]): 
        data["model"] = "my-new-model"
        return data 

    async def async_post_call_failure_hook(
        self, 
        request_data: dict,
        original_exception: Exception, 
        user_api_key_dict: UserAPIKeyAuth,
        traceback_str: Optional[str] = None,
    ) -> Optional[HTTPException]:
        """
        Transform error responses sent to clients.
        
        Return an HTTPException to replace the original error with a user-friendly message.
        Return None to use the original exception.
        
        Example:
            if isinstance(original_exception, litellm.ContextWindowExceededError):
                return HTTPException(
                    status_code=400,
                    detail="Your prompt is too long. Please reduce the length and try again."
                )
            return None  # Use original exception
        """
        pass

    async def async_post_call_success_hook(
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        response,
    ):
        pass

    async def async_moderation_hook( # call made in parallel to llm api call
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        call_type: Literal["completion", "embeddings", "image_generation", "moderation", "audio_transcription"],
    ):
        pass

    async def async_post_call_streaming_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        response: str,
    ):
        pass

    async def async_post_call_streaming_iterator_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        response: Any,
        request_data: dict,
    ) -> AsyncGenerator[ModelResponseStream, None]:
        """
        Passes the entire stream to the guardrail

        This is useful for plugins that need to see the entire stream.
        """
        async for item in response:
            yield item

    async def async_post_call_response_headers_hook(
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        response: Any,
        request_headers: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, str]]:
        """
        Inject custom headers into HTTP response (runs for both success and failure).
        """
        return {"x-custom-header": "custom-value"}

proxy_handler_instance = MyCustomHandler()
```

2. 將此檔案加入您的 proxy 設定

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo

litellm_settings:
  callbacks: custom_callbacks.proxy_handler_instance # sets litellm.callbacks = [proxy_handler_instance]
```

3. 啟動伺服器 + 測試請求

```shell
$ litellm /path/to/config.yaml
```
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --data ' {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "good morning good sir"
        }
    ],
    "user": "ishaan-app",
    "temperature": 0.2
    }'
```


## [BETA] *全新* async_moderation_hook  {#beta-new-async_moderation_hook}

平行於實際的 LLM API 呼叫執行審核檢查。 

在您的自訂處理器中新增一個 `async_moderation_hook` 函式

- 目前僅支援 `/chat/completion` 呼叫。 
- 此函式會與實際的 LLM API 呼叫平行執行。 
- 如果您的 `async_moderation_hook` 拋出 Exception，我們會將其回傳給使用者。 

:::info

未來我們可能需要更新函式 schema，以支援多個端點（例如接受 call_type）。在嘗試此功能時，請留意這一點

:::

請參閱我們的 [Llama Guard 內容審核掛鉤](https://github.com/BerriAI/litellm/blob/main/enterprise/enterprise_hooks/llm_guard.py) 完整範例

```python
from litellm.integrations.custom_logger import CustomLogger
import litellm
from fastapi import HTTPException

# This file includes the custom callbacks for LiteLLM Proxy
# Once defined, these can be passed in proxy_config.yaml
class MyCustomHandler(CustomLogger): # https://docs.litellm.ai/docs/observability/custom_callback#callback-class
    # Class variables or attributes
    def __init__(self):
        pass

    #### ASYNC #### 
    
    async def async_log_pre_api_call(self, model, messages, kwargs):
        pass

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        pass

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        pass

    #### CALL HOOKS - proxy only #### 

    async def async_pre_call_hook(self, user_api_key_dict: UserAPIKeyAuth, cache: DualCache, data: dict, call_type: Literal["completion", "embeddings"]):
        data["model"] = "my-new-model"
        return data 
    
    async def async_moderation_hook( ### 👈 KEY CHANGE ###
        self,
        data: dict,
    ):
        messages = data["messages"]
        print(messages)
        if messages[0]["content"] == "hello world": 
            raise HTTPException(
                    status_code=400, detail={"error": "Violated content safety policy"}
                )

proxy_handler_instance = MyCustomHandler()
```


2. 將此檔案加入您的 proxy 設定

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo

litellm_settings:
  callbacks: custom_callbacks.proxy_handler_instance # sets litellm.callbacks = [proxy_handler_instance]
```

3. 啟動伺服器 + 測試請求

```shell
$ litellm /path/to/config.yaml
```
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --data ' {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "Hello world"
        }
    ],
    }'
```

## 進階 - 強制 'user' 參數  {#advanced---enforce-user-param}

將 `enforce_user_param` 設為 true，以要求所有對 openai 端點的呼叫都必須帶有 'user' 參數。 

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/4777921a31c4c70e4d87b927cb233b6a09cd8b51/litellm/proxy/auth/auth_checks.py#L72)

```yaml
general_settings:
  enforce_user_param: True
```

**結果**

<Image img={require('../../img/end_user_enforcement.png')}/>

## 進階 - 將拒絕訊息作為回應返回  {#advanced---return-rejected-message-as-response}

對於 chat completions 與 text completion 呼叫，您可以將拒絕訊息作為使用者回應返回。 

做法是回傳一個字串。LiteLLM 會負責依據端點以及是否為串流／非串流，以正確格式返回回應。

對於非 chat/text completion 端點，此回應會以 400 狀態碼例外返回。 

### 1. 建立自訂處理器  {#1-create-custom-handler}

```python
from litellm.integrations.custom_logger import CustomLogger
import litellm
from litellm.utils import get_formatted_prompt

# This file includes the custom callbacks for LiteLLM Proxy
# Once defined, these can be passed in proxy_config.yaml
class MyCustomHandler(CustomLogger):
    def __init__(self):
        pass

    #### CALL HOOKS - proxy only #### 

    async def async_pre_call_hook(self, user_api_key_dict: UserAPIKeyAuth, cache: DualCache, data: dict, call_type: Literal[
            "completion",
            "text_completion",
            "embeddings",
            "image_generation",
            "moderation",
            "audio_transcription",
        ]) -> Optional[dict, str, Exception]: 
        formatted_prompt = get_formatted_prompt(data=data, call_type=call_type)

        if "Hello world" in formatted_prompt:
            return "This is an invalid response"

        return data 

proxy_handler_instance = MyCustomHandler()
```

### 2. 更新 config.yaml  {#2-update-configyaml}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo

litellm_settings:
  callbacks: custom_callbacks.proxy_handler_instance # sets litellm.callbacks = [proxy_handler_instance]
```


### 3. 測試它！ {#3-test-it}

```shell
$ litellm /path/to/config.yaml
```
```shell
curl --location 'http://0.0.0.0:4000/chat/completions' \
    --data ' {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
        "role": "user",
        "content": "Hello world"
        }
    ],
    }'
```

**預期回應**

```
{
    "id": "chatcmpl-d00bbede-2d90-4618-bf7b-11a1c23cf360",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "This is an invalid response.", # 👈 REJECTED RESPONSE
                "role": "assistant"
            }
        }
    ],
    "created": 1716234198,
    "model": null,
    "object": "chat.completion",
    "system_fingerprint": null,
    "usage": {}
}
```

## 進階 - 轉換錯誤回應 {#advanced---transform-error-responses}

使用 `async_post_call_failure_hook` 將技術性的 API 錯誤轉換為對使用者友善的訊息。回傳一個 `HTTPException` 以取代原始錯誤，或回傳 `None` 以使用原始例外。

```python
from litellm.integrations.custom_logger import CustomLogger
from fastapi import HTTPException
from typing import Optional
import litellm

class MyErrorTransformer(CustomLogger):
    async def async_post_call_failure_hook(
        self,
        request_data: dict,
        original_exception: Exception,
        user_api_key_dict: UserAPIKeyAuth,
        traceback_str: Optional[str] = None,
    ) -> Optional[HTTPException]:
        if isinstance(original_exception, litellm.ContextWindowExceededError):
            return HTTPException(
                status_code=400,
                detail="Your prompt is too long. Please reduce the length and try again."
            )
        if isinstance(original_exception, litellm.RateLimitError):
            return HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again in a moment."
            )
        return None  # Use original exception

proxy_handler_instance = MyErrorTransformer()
```

**結果：** 用戶端會收到 `"Your prompt is too long..."`，而不是 `"ContextWindowExceededError: Prompt exceeds context window"`。

## 進階 - 注入自訂 HTTP 回應標頭 {#advanced---inject-custom-http-response-headers}

使用 `async_post_call_response_headers_hook` 將自訂 HTTP 標頭注入回應中。此掛鉤會在 **成功與失敗** 的 LLM API 呼叫時執行。

```python
from litellm.integrations.custom_logger import CustomLogger
from litellm.proxy.proxy_server import UserAPIKeyAuth
from typing import Any, Dict, Optional

class CustomHeaderLogger(CustomLogger):
    def __init__(self):
        super().__init__()

    async def async_post_call_response_headers_hook(
        self,
        data: dict,
        user_api_key_dict: UserAPIKeyAuth,
        response: Any,
        request_headers: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, str]]:
        """
        Inject custom headers into all responses (success and failure).
        """
        return {"x-custom-header": "custom-value"}

proxy_handler_instance = CustomHeaderLogger()
```
