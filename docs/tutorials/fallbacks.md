---
description: "使用 completion() 搭配模型備援（failover），讓失敗的提供者自動切換到備用模型，以取得可靠的回應。"
keywords: [fallbacks, failover, provider failover, model failover, reliability, backup model, completion]
---

# 使用 completion() 搭配備援（Failover）以提升可靠性 {#using-completion-with-fallbacks-failover-for-reliability}

本教學示範如何使用 `completion()` 函式搭配模型備援（也稱為 failover）來確保可靠性。LLM API 可能不穩定，搭配備援的 completion() 可確保您的請求總是能取得回應

## 為虛擬金鑰設定備援 {#set-up-fallbacks-for-a-virtual-key}

<iframe width="840" height="500" src="https://www.loom.com/embed/35539129dd104313aff40eb1cd255778" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## 使用方式  {#usage}
若要在 `completion()` 中使用備援模型，請在 `fallbacks` 參數中指定模型清單。 

`fallbacks` 清單應包含您要使用的主要模型，接著再加入可在主要模型無法提供回應時作為備援的其他模型。

```python
response = completion(model="bad-model", fallbacks=["gpt-3.5-turbo" "command-nightly"], messages=messages)
```

## `completion_with_fallbacks()` 的運作方式 {#how-does-completion_with_fallbacks-work}

`completion_with_fallbacks()` 函式會以在 `completion(model=model)` 中指定為 `model` 的主要模型嘗試進行 completion 請求。若主要模型失敗或發生錯誤，系統會依指定順序自動嘗試 `fallbacks` 模型。這可確保即使主要模型無法使用，也能取得回應。

### 請求的輸出 {#output-from-calls}
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

### Model Fallbacks 實作的主要元件： {#key-components-of-model-fallbacks-implementation}
* 透過 `fallbacks` 進行迴圈
* 針對受速率限制的模型進行冷卻時間

#### 透過 `fallbacks` 進行迴圈 {#looping-through-fallbacks}
允許每個請求有 `45seconds`。在這 45 秒內，此函式會嘗試呼叫設定為 `model` 的主要模型。若模型失敗，則會依序循環呼叫備用的 `fallbacks` 模型，並嘗試在此處設定的分配 `45s` 時間內取得回應： 
```python
while response == None and time.time() - start_time < 45:
        for model in fallbacks:
```

#### 針對受速率限制的模型進行冷卻時間 {#cool-downs-for-rate-limited-models}
如果模型 API 請求導致錯誤，請讓它冷卻 `60s`
```python
except Exception as e:
  print(f"got exception {e} for model {model}")
  rate_limited_models.add(model)
  model_expiration_times[model] = (
      time.time() + 60
  )  # cool down this selected model
  pass
```

在發出 LLM API 請求之前，我們會檢查所選模型是否處於 `rate_limited_models`，若是，則略過發出 API 請求
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

#### 含備援的 completion() 完整程式碼 {#full-code-of-completion-with-fallbacks}
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
