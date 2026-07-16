# 自訂回呼 {#custom-callbacks}

:::info
**適用於 PROXY** [前往此處](../proxy/logging.md#custom-callback-class-async)
::: 

## 回呼類別 {#callback-class}
您可以建立自訂回呼類別，以精確地記錄 litellm 中發生的事件。 

```python
import litellm
from litellm.integrations.custom_logger import CustomLogger
from litellm import completion, acompletion

class MyCustomHandler(CustomLogger):
    def log_pre_api_call(self, model, messages, kwargs): 
        print(f"Pre-API Call")
    
    def log_post_api_call(self, kwargs, response_obj, start_time, end_time): 
        print(f"Post-API Call")
    

    def log_success_event(self, kwargs, response_obj, start_time, end_time): 
        print(f"On Success")

    def log_failure_event(self, kwargs, response_obj, start_time, end_time): 
        print(f"On Failure")
    
    #### ASYNC #### - for acompletion/aembeddings

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        print(f"On Async Success")

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print(f"On Async Failure")

customHandler = MyCustomHandler()

litellm.callbacks = [customHandler]

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

## 常見 Hook {#common-hooks}

- `async_log_success_event` - 記錄成功的 API 呼叫
- `async_log_failure_event` - 記錄失敗的 API 呼叫  
- `log_pre_api_call` - 在 API 呼叫前記錄
- `log_post_api_call` - 在 API 呼叫後記錄

**僅限 Proxy 的 hooks**（僅適用於 LiteLLM Proxy）：
- `async_post_call_success_hook` - 存取使用者資料 + 修改回應
- `async_pre_call_hook` - 在送出前修改請求

### 範例：在 async_post_call_success_hook 中修改回應 {#example-modifying-the-response-in-async_post_call_success_hook}

您可以使用 `async_post_call_success_hook` 在回應傳回給用戶端之前，為其新增自訂標頭或中繼資料。範例如下：

```python
async def async_post_call_success_hook(data, user_api_key_dict, response):
    # Add a custom header to the response
    additional_headers = getattr(response, "_hidden_params", {}).get("additional_headers", {}) or {}
    additional_headers["x-litellm-custom-header"] = "my-value"
    if not hasattr(response, "_hidden_params"):
        response._hidden_params = {}
    response._hidden_params["additional_headers"] = additional_headers
    return response
```

這可讓您將自訂中繼資料或標頭注入回應中，供下游消費者使用。您可以使用此模式將資訊傳遞給用戶端、Proxy 或可觀測性工具。

## 回呼函式 {#callback-functions}
如果您只想在特定事件（例如輸入時）記錄，則可以使用回呼函式。 

您可以設定在以下情況觸發的自訂回呼：
- `litellm.input_callback`   - 在執行 LLM API 請求前追蹤輸入/轉換後的輸入
- `litellm.success_callback` - 在執行 LLM API 請求後追蹤輸入/輸出
- `litellm.failure_callback` - 追蹤 litellm 呼叫的輸入/輸出 + 例外狀況

## 定義自訂回呼函式 {#defining-a-custom-callback-function}
建立一個接受特定引數的自訂回呼函式：

```python
def custom_callback(
    kwargs,                 # kwargs to completion
    completion_response,    # response from completion
    start_time, end_time    # start/end time
):
    # Your custom code here
    print("LITELLM: in custom callback function")
    print("kwargs", kwargs)
    print("completion_response", completion_response)
    print("start_time", start_time)
    print("end_time", end_time)
```

### 設定自訂回呼函式 {#setting-the-custom-callback-function}
```python
import litellm
litellm.success_callback = [custom_callback]
```

## 使用您的自訂回呼函式 {#using-your-custom-callback-function}

```python
import litellm
from litellm import completion

# Assign the custom callback function
litellm.success_callback = [custom_callback]

response = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": "Hi 👋 - i'm openai"
        }
    ]
)

print(response)

```

## 非同步回呼函式  {#async-callback-functions}

我們建議在非同步情境使用 Custom Logger 類別。

```python
from litellm.integrations.custom_logger import CustomLogger
from litellm import acompletion 

class MyCustomHandler(CustomLogger):
    #### ASYNC #### 
    


    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        print(f"On Async Success")

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print(f"On Async Failure")

import asyncio 
customHandler = MyCustomHandler()

litellm.callbacks = [customHandler]

def async completion():
    response = await acompletion(model="gpt-3.5-turbo", messages=[{ "role": "user", "content": "Hi 👋 - i'm openai"}],
                              stream=True)
    async for chunk in response: 
        continue
asyncio.run(completion())
```

**函式**

如果您只想傳入一個非同步函式來進行記錄。 

LiteLLM 目前僅支援用於非同步 completion/embedding 呼叫的非同步成功回呼函式。 

```python
import asyncio, litellm 

async def async_test_logging_fn(kwargs, completion_obj, start_time, end_time):
    print(f"On Async Success!")

async def test_chat_openai():
    try:
        # litellm.set_verbose = True
        litellm.success_callback = [async_test_logging_fn]
        response = await litellm.acompletion(model="gpt-3.5-turbo",
                              messages=[{
                                  "role": "user",
                                  "content": "Hi 👋 - i'm openai"
                              }],
                              stream=True)
        async for chunk in response: 
            continue
    except Exception as e:
        print(e)
        pytest.fail(f"An error occurred - {str(e)}")

asyncio.run(test_chat_openai())
```

## kwargs 中有哪些可用內容？ {#whats-available-in-kwargs}

kwargs 字典包含您 API 呼叫的所有詳細資訊。

:::info
如需完整的記錄負載規格，請參閱 [標準記錄負載規格](https://docs.litellm.ai/docs/proxy/logging_spec)。
:::

```python
def custom_callback(kwargs, completion_response, start_time, end_time):
    # Access common data
    model = kwargs.get("model")
    messages = kwargs.get("messages", [])
    cost = kwargs.get("response_cost", 0)
    cache_hit = kwargs.get("cache_hit", False)
    
    # Access metadata you passed in
    metadata = kwargs.get("litellm_params", {}).get("metadata", {})
```

**kwargs 中的關鍵欄位：**
- `model` - 模型名稱
- `messages` - 輸入訊息  
- `response_cost` - 計算成本
- `cache_hit` - 回應是否已被快取
- `litellm_params.metadata` - 您的自訂中繼資料

## 實用範例 {#practical-examples}

### 追蹤 API 成本 {#track-api-costs}
```python
def track_cost_callback(kwargs, completion_response, start_time, end_time):
    cost = kwargs["response_cost"] # litellm calculates this for you
    print(f"Request cost: ${cost}")

litellm.success_callback = [track_cost_callback]

response = completion(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hello"}])
```

### 記錄輸入到 LLM {#log-inputs-to-llms}
```python
def get_transformed_inputs(kwargs):
    params_to_model = kwargs["additional_args"]["complete_input_dict"]
    print("params to model", params_to_model)

litellm.input_callback = [get_transformed_inputs]

response = completion(model="claude-2", messages=[{"role": "user", "content": "Hello"}])
```

### 傳送至外部服務 {#send-to-external-service}
```python
import requests

def send_to_analytics(kwargs, completion_response, start_time, end_time):
    data = {
        "model": kwargs.get("model"),
        "cost": kwargs.get("response_cost", 0),
        "duration": (end_time - start_time).total_seconds()
    }
    requests.post("https://your-analytics.com/api", json=data)

litellm.success_callback = [send_to_analytics]
```

## 常見問題 {#common-issues}

### 未呼叫回呼 {#callback-not-called}
請確認您已：
1. 正確註冊回呼：`litellm.callbacks = [MyHandler()]`
2. 使用正確的 hook 名稱（檢查拼字）
3. 不要在函式庫模式中使用僅限 Proxy 的 hooks

### 效能問題   {#performance-issues}
- 對 I/O 作業使用非同步 hooks
- 不要在回呼函式中阻塞
- 正確處理例外狀況：

```python
class SafeHandler(CustomLogger):
    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        try:
            await external_service(response_obj)
        except Exception as e:
            print(f"Callback error: {e}")  # Log but don't break the flow
```
