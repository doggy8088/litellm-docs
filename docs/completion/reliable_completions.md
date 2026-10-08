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
            model="{{openai_small}}",
            messages=messages,
            num_retries=2
        )
```

## 備援（SDK） {#fallbacks-sdk}

:::info

[查看如何在 PROXY 上操作](../proxy/reliability.md)

:::

### Context Window 備援（SDK） {#context-window-fallbacks-sdk}

以下的 ids 僅供說明，並保留其 context window 大小：一個 4k model 備援到其 16k variant。

```python keep-model-ids
from litellm import completion

fallback_dict = {"gpt-3.5-turbo": "gpt-3.5-turbo-16k"}
messages = [{"content": "how does a court case get to the Supreme Court?" * 500, "role": "user"}]

completion(model="gpt-3.5-turbo", messages=messages, context_window_fallback_dict=fallback_dict)
```

### 備援 - 切換模型／API 金鑰／API Bases（SDK） {#fallbacks---switch-modelsapi-keysapi-bases-sdk}

LLM APIs 可能不穩定，帶有備援的 completion() 可確保您從請求中始終取得回應

#### 用法 {#usage}
若要搭配 `completion()` 使用備援模型，請在 `fallbacks` 參數中指定模型清單。

`fallbacks` list 會保留備援 models。LiteLLM 會先嘗試以 `model` 傳入的 primary model，並將其前置到 list 本身，因此您不需要在 `fallbacks` 中重複它。

#### 切換模型 {#switch-models}
```python
response = completion(model="bad-model", messages=messages, 
    fallbacks=["{{openai_small}}", "command-nightly"])
```

#### 切換 api keys/bases（例如 Azure deployment） {#switch-api-keysbases-eg-azure-deployment}
在同一個 Azure deployment 之間切換不同的金鑰，或也使用另一個 deployment。 

```python
api_key="bad-key"
response = completion(model="azure/{{openai_large}}", messages=messages, api_key=api_key,
    fallbacks=[{"api_key": "good-key-1"}, {"api_key": "good-key-2", "api_base": "good-api-base-2"}])
```

[查看此區段以取得實作細節](/docs/completion/reliable_completions#fallbacks)

## 實作細節（SDK） {#implementation-details-sdk}

### 備援 {#fallbacks}

#### 呼叫的回應 {#output-from-calls}
```
Completion with 'bad-model': got exception Unable to map your input to a model. Check your input - {'model': 'bad-model'



completion call {{openai_small}}
{
  "id": "chatcmpl-7qTmVRuO3m3gIBg4aTmAumV1TmQhB",
  "object": "chat.completion",
  "created": 1692741891,
  "model": "{{openai_small}}",
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

當您將 `fallbacks` 傳給 `completion` 時，LiteLLM 會建構嘗試清單 `[model] + fallbacks`，並依順序各呼叫每個項目一次。第一個回傳的 response 會被傳回；失敗的項目會被記錄，接著嘗試下一個。沒有時間預算、沒有對清單的重複迴圈，也沒有冷卻時間：一旦每個項目都失敗，`completion` 會 raise 一個帶有最後錯誤的 exception，並以 `All fallback attempts failed` 作為後綴。

備援項目可以是 model name 字串或 completion kwargs 的 dict。dict 項目會合併到這次呼叫中（例如不同的 `api_key` 或 `api_base`），並使用 primary `model`，除非該 dict 設定了自己的 `model` key。

成功的 response 會帶有 `x-litellm-attempted-fallbacks` header，內容為在它之前已嘗試的備援數量。

如果您需要針對失敗的 deployments 設定冷卻時間，或需要帶有 backoff 的 retries，請使用 [Router](../routing.md)，其會追蹤 deployment 健康狀態與冷卻期間；請參閱 [proxy reliability docs](../proxy/reliability.md)。
