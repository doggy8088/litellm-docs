# 可靠性 - 重試、備援 {#reliability---retries-fallbacks}

LiteLLM 可透過 2 種方式防止請求失敗： 
- 重試
- 備援：Context Window + General

## 輔助工具 {#helper-utils}
LiteLLM 支援以下用於可靠性的函式：
* `litellm.longer_context_model_fallback_dict`：具有對應關係的字典，對應於那些有更大等效模型的模型  
* `num_retries`：使用 tenacity 重試
* `completion()` 搭配備援：在發生錯誤時，在模型／金鑰／API base 之間切換。 

## 重試失敗的請求 {#retry-failed-requests}

像這樣在 completion 中呼叫它 `completion(..num_retries=2)`。

以下簡單看看您可以如何使用它： 

```python 
from litellm import completion

user_message = "Hello, whats the weather in San Francisco??"
messages = [{"content": user_message, "role": "user"}]

# normal call 
response = completion(
            model="gpt-3.5-turbo",
            messages=messages,
            num_retries=2
        )
```

## 備援（SDK） {#fallbacks-sdk}

:::info

[查看如何在 PROXY 上操作](../proxy/reliability.md)

:::

### Context Window 備援（SDK） {#context-window-fallbacks-sdk}
```python 
from litellm import completion

fallback_dict = {"gpt-3.5-turbo": "gpt-3.5-turbo-16k"}
messages = [{"content": "how does a court case get to the Supreme Court?" * 500, "role": "user"}]

completion(model="gpt-3.5-turbo", messages=messages, context_window_fallback_dict=fallback_dict)
```

### 備援 - 切換模型／API 金鑰／API Bases（SDK） {#fallbacks---switch-modelsapi-keysapi-bases-sdk}

LLM APIs 可能不穩定，帶有備援的 completion() 可確保您從請求中始終取得回應

#### 用法 {#usage}
若要搭配 `completion()` 使用備援模型，請在 `fallbacks` 參數中指定模型清單。 

`fallbacks` 清單應包含您要使用的主要模型，接著是其他可在主要模型無法提供回應時作為備份使用的模型。

#### 切換模型 {#switch-models}
```python
response = completion(model="bad-model", messages=messages, 
    fallbacks=["gpt-3.5-turbo" "command-nightly"])
```

#### 切換 api keys/bases（例如 Azure deployment） {#switch-api-keysbases-eg-azure-deployment}
在同一個 Azure deployment 之間切換不同的金鑰，或也使用另一個 deployment。 

```python
api_key="bad-key"
response = completion(model="azure/gpt-4", messages=messages, api_key=api_key,
    fallbacks=[{"api_key": "good-key-1"}, {"api_key": "good-key-2", "api_base": "good-api-base-2"}])
```

[查看此區段以取得實作細節](#fallbacks-1)

## 實作細節（SDK） {#implementation-details-sdk}

### 備援 {#fallbacks}
#### 呼叫的回應 {#output-from-calls}
```
Completion with 'bad-model': got exception Unable to map your input to a model. Check your input - {'model': 'bad-model'



completion call gpt-3.5-turbo
{
  "id": "chatcmpl-7qTmVRuO3m3gIBg4aTmAumV1TmQhB",
  "object": "chat.completion",
  "created": 1692741891,
  "model": "gpt-3.5-turbo-0613",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I apologize, but as an AI, I do not have the capability to provide real-time weather updates. However, you can easily check the current weather in San Francisco by using a search engine or checking a weather website or app."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 16,
    "completion_tokens": 46,
    "total_tokens": 62
  }
}

```

#### 備援如何運作 {#how-does-fallbacks-work}

當您將 `fallbacks` 傳入 `completion` 時，它會先使用在 `completion(model=model)` 中指定為 `model` 的主要模型，進行第一次 `completion` 呼叫。如果主要模型失敗或發生錯誤，它會依指定順序自動嘗試 `fallbacks` 模型。這可確保即使主要模型無法使用，仍能取得回應。

#### Model Fallbacks 實作的關鍵元件： {#key-components-of-model-fallbacks-implementation}
* 依序遍歷 `fallbacks`
* 速率限制模型的冷卻時間

#### 依序遍歷 `fallbacks` {#looping-through-fallbacks}
允許每個請求有 `45seconds`。在這 45 秒內，此函式會嘗試呼叫設定為 `model` 的主要模型。若模型失敗，它會依序遍歷備份的 `fallbacks` 模型，並嘗試在此處設定的分配 `45s` 時間內取得回應： 
```python
while response == None and time.time() - start_time < 45:
        for model in fallbacks:
```

#### 速率限制模型的冷卻時間 {#cool-downs-for-rate-limited-models}
如果某次模型 API 呼叫導致錯誤，則允許其冷卻 `60s`
```python
except Exception as e:
  print(f"got exception {e} for model {model}")
  rate_limited_models.add(model)
  model_expiration_times[model] = (
      time.time() + 60
  )  # cool down this selected model
  pass
```

在進行 LLM API 呼叫之前，我們會檢查所選模型是否位於 `rate_limited_models` 中，若是則略過 API 呼叫
```python
if (
  model in rate_limited_models
):  # check if model is currently cooling down
  if (
      model_expiration_times.get(model)
      and time.time() >= model_expiration_times[model]
  ):
      rate_limited_models.remove(
          model
      )  # check if it's been 60s of cool down and remove model
  else:
      continue  # skip model

```

#### 具有備援的 completion() 完整程式碼 {#full-code-of-completion-with-fallbacks}
```python

    response = None
    rate_limited_models = set()
    model_expiration_times = {}
    start_time = time.time()
    fallbacks = [kwargs["model"]] + kwargs["fallbacks"]
    del kwargs["fallbacks"]  # remove fallbacks so it's not recursive

    while response == None and time.time() - start_time < 45:
        for model in fallbacks:
            # loop thru all models
            try:
                if (
                    model in rate_limited_models
                ):  # check if model is currently cooling down
                    if (
                        model_expiration_times.get(model)
                        and time.time() >= model_expiration_times[model]
                    ):
                        rate_limited_models.remove(
                            model
                        )  # check if it's been 60s of cool down and remove model
                    else:
                        continue  # skip model

                # delete model from kwargs if it exists
                if kwargs.get("model"):
                    del kwargs["model"]

                print("making completion call", model)
                response = litellm.completion(**kwargs, model=model)

                if response != None:
                    return response

            except Exception as e:
                print(f"got exception {e} for model {model}")
                rate_limited_models.add(model)
                model_expiration_times[model] = (
                    time.time() + 60
                )  # cool down this selected model
                pass
    return response
```
