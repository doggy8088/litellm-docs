---
description: "使用 completion() 搭配模型備援（failover），讓失敗的提供者自動切換到備用模型，以取得可靠的回應。"
keywords: [fallbacks, failover, provider failover, model failover, reliability, backup model, completion]
---

# 使用 completion() 搭配備援（Failover）以提升可靠性 {#using-completion-with-fallbacks-failover-for-reliability}

本教學示範如何將 `completion()` 函式與模型備援（也稱為 failover）搭配使用，以提升可靠性。LLM API 可能不穩定；搭配備援的 `completion()` 會在主要模型失敗時依序嘗試備用模型，並且只會在所有模型都嘗試過後才拋出例外

## 為虛擬金鑰設定備援 {#set-up-fallbacks-for-a-virtual-key}

<iframe width="840" height="500" src="https://www.loom.com/embed/35539129dd104313aff40eb1cd255778" frameBorder="0" allowFullScreen></iframe>

## 使用方式  {#usage}
若要在 `completion()` 中使用備援模型，請在 `fallbacks` 參數中指定模型清單。

`fallbacks` 清單會依順序保存要嘗試的備用模型，前提是作為 `model` 傳入的主要模型無法提供回應。主要模型會自動先嘗試，因此不需要在清單中重複列出。

```python
response = completion(model="bad-model", fallbacks=["{{openai_small}}", "command-nightly"], messages=messages)
```

`fallbacks` 中的項目也可以是會覆寫此次嘗試之 litellm 參數的字典，例如 `{"model": "{{openai_small}}", "api_key": "sk-..."}`。

## `completion_with_fallbacks()` 的運作方式 {#how-does-completion_with_fallbacks-work}

當設定 `fallbacks`（或已設定 `litellm.model_fallbacks`）時，`completion()` 會將呼叫交給 `completion_with_fallbacks()`，由其執行 `async_completion_with_fallbacks()`。它會對 `[model] + fallbacks` 進行一次依序的單次掃描，每個模型只呼叫一次。會回傳第一個非 `None` 的回應，並設定 `x-litellm-attempted-fallbacks` 標頭為在成功模型之前嘗試過的備援數量（若主要模型成功則為 0）。如果每次嘗試都失敗，則會拋出包含最新錯誤以及訊息 `All fallback attempts failed` 的例外。此機制沒有時間視窗、沒有重試迴圈，也沒有每個模型的冷卻時間；每個模型都只會嘗試一次。

### 請求的輸出 {#output-from-calls}
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

### 實作核心 {#core-of-the-implementation}
```python
fallbacks = [original_model] + nested_kwargs.pop("fallbacks", [])

for attempted_fallbacks, fallback in enumerate(fallbacks):
    try:
        completion_kwargs = safe_deep_copy(base_kwargs)
        if isinstance(fallback, dict):
            fallback_config = safe_deep_copy(dict(fallback))
            model = fallback_config.pop("model", original_model)
            completion_kwargs.update(fallback_config)
        else:
            model = fallback

        response = await litellm.acompletion(**completion_kwargs, model=model)
        if response is not None:
            return add_fallback_headers_to_response(
                response=response, attempted_fallbacks=attempted_fallbacks
            )
    except Exception as e:
        most_recent_exception_str = str(e)
        continue

raise Exception(f"{most_recent_exception_str}. All fallback attempts failed. ...")
```

完整實作請參見 `litellm/litellm_core_utils/fallback_utils.py`。
