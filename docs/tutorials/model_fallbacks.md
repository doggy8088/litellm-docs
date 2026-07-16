---
description: "在 OpenAI、Anthropic 與 Azure 之間實作模型備援（提供者失敗轉移），讓失敗的提供者自動切換到備援。"
keywords: [fallbacks, failover, provider failover, model failover, OpenAI, Anthropic, Azure, reliability]
---

# 模型備援（提供者失敗轉移）搭配 LiteLLM {#model-fallbacks-provider-failover-w-litellm}

以下說明如何使用 LiteLLM 在 3 個 LLM 提供者（OpenAI、Anthropic、Azure）之間實作模型備援（提供者失敗轉移）。 

## 1. 安裝 LiteLLM {#1-install-litellm}
```python 
!uv add litellm
```

## 2. 基本備援程式碼  {#2-basic-fallbacks-code}
```python 
import litellm
from litellm import embedding, completion

# set ENV variables
os.environ["OPENAI_API_KEY"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

model_fallback_list = ["claude-instant-1", "gpt-3.5-turbo", "chatgpt-test"]

user_message = "Hello, how are you?"
messages = [{ "content": user_message,"role": "user"}]

for model in model_fallback_list:
  try:
      response = completion(model=model, messages=messages)
  except Exception as e:
      print(f"error occurred: {traceback.format_exc()}")
```

## 3. Context Window 例外狀況  {#3-context-window-exceptions}
LiteLLM 針對 Context Window Exceeded 錯誤提供了 InvalidRequestError 類別的子類別（[文件](https://docs.litellm.ai/docs/exception_mapping)）。

根據 context window 例外狀況實作模型備援。 

LiteLLM 也提供了 `get_max_tokens()` 函式，您可以用它來識別已超出 context window 限制的情況。 

```python 
import litellm
from litellm import completion, ContextWindowExceededError, get_max_tokens

# set ENV variables
os.environ["OPENAI_API_KEY"] = ""
os.environ["COHERE_API_KEY"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["AZURE_API_KEY"] = ""
os.environ["AZURE_API_BASE"] = ""
os.environ["AZURE_API_VERSION"] = ""

context_window_fallback_list = [{"model":"gpt-3.5-turbo-16k", "max_tokens": 16385}, {"model":"gpt-4-32k", "max_tokens": 32768}, {"model": "claude-instant-1", "max_tokens":100000}]

user_message = "Hello, how are you?"
messages = [{ "content": user_message,"role": "user"}]

initial_model = "command-nightly"
try:
    response = completion(model=initial_model, messages=messages)
except ContextWindowExceededError as e:
    model_max_tokens = get_max_tokens(model)
    for model in context_window_fallback_list:
        if model_max_tokens < model["max_tokens"]
        try:
            response = completion(model=model["model"], messages=messages)
            return response
        except ContextWindowExceededError as e:
            model_max_tokens = get_max_tokens(model["model"])
            continue

print(response)
```
