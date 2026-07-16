# 模型別名 {#model-alias}

您顯示給終端使用者的模型名稱，可能與您傳遞給 LiteLLM 的名稱不同——例如，前端顯示 `GPT-3.5`，而後端呼叫 `gpt-3.5-turbo-16k`。

LiteLLM 透過讓您傳入模型別名對應來簡化這件事。

# 預期格式 {#expected-format}

```python
litellm.model_alias_map = {
    # a dictionary containing a mapping of the alias string to the actual litellm model name string
    "model_alias": "litellm_model_name"
}
```

# 用法 {#usage}

### 相關程式碼 {#relevant-code}
```python
model_alias_map = {
    "GPT-3.5": "gpt-3.5-turbo-16k",
    "llama2": "replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf"
}

litellm.model_alias_map = model_alias_map
```

### 完整程式碼 {#complete-code}
```python
import litellm 
from litellm import completion 


## set ENV variables
os.environ["OPENAI_API_KEY"] = "openai key"
os.environ["REPLICATE_API_KEY"] = "cohere key"

## set model alias map
model_alias_map = {
    "GPT-3.5": "gpt-3.5-turbo-16k",
    "llama2": "replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca12251a30609463dcfd4cd76703f22e96cdf"
}

litellm.model_alias_map = model_alias_map

messages = [{ "content": "Hello, how are you?","role": "user"}]

# call "gpt-3.5-turbo-16k"
response = completion(model="GPT-3.5", messages=messages)

# call replicate/llama-2-70b-chat:2796ee9483c3fd7aa2e171d38f4ca1...
response = completion("llama2", messages)
```
