# 規則 {#rules}

使用這個來根據 llm api call 的輸入或輸出使請求失敗。 

```python
import litellm 
import os 

# set env vars 
os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENROUTER_API_KEY"] = "your-api-key"

def my_custom_rule(input): # receives the model response 
    if "i don't think i can answer" in input: # trigger fallback if the model refuses to answer 
        return False 
    return True 

litellm.post_call_rules = [my_custom_rule] # have these be functions that can be called to fail a call

response = litellm.completion(model="gpt-3.5-turbo", messages=[{"role": "user", 
"content": "Hey, how's it going?"}], fallbacks=["openrouter/gryphe/mythomax-l2-13b"])
```

## 可用端點  {#available-endpoints}

* `litellm.pre_call_rules = []` - 一個函式列表，在進行 api call 之前會逐一迭代。每個函式都應回傳 True（允許呼叫）或 False（使呼叫失敗）。

* `litellm.post_call_rules = []` - 一個函式列表，在進行 api call 之前會逐一迭代。每個函式都應回傳 True（允許呼叫）或 False（使呼叫失敗）。

## 規則的預期格式 {#expected-format-of-rule}

```python
def my_custom_rule(input: str) -> bool: # receives the model response 
    if "i don't think i can answer" in input: # trigger fallback if the model refuses to answer 
        return False 
    return True 
```

#### 輸入 {#inputs}
* `input`: *str*：使用者輸入或 llm 回應。 

#### 輸出 {#outputs}
* `bool`: 回傳 True（允許呼叫）或 False（使呼叫失敗）

## 規則範例 {#example-rules}

### 範例 1：如果使用者輸入過長則使請求失敗 {#example-1-fail-if-user-input-is-too-long}

```python
import litellm 
import os 

# set env vars 
os.environ["OPENAI_API_KEY"] = "your-api-key"

def my_custom_rule(input): # receives the model response 
    if len(input) > 10: # fail call if too long
        return False 
    return True 

litellm.pre_call_rules = [my_custom_rule] # have these be functions that can be called to fail a call

response = litellm.completion(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hey, how's it going?"}])
```

### 範例 2：如果 llm 拒絕回答，則備援到未過濾模型 {#example-2-fallback-to-uncensored-model-if-llm-refuses-to-answer}

```python
import litellm 
import os 

# set env vars 
os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENROUTER_API_KEY"] = "your-api-key"

def my_custom_rule(input): # receives the model response 
    if "i don't think i can answer" in input: # trigger fallback if the model refuses to answer 
        return False 
    return True 

litellm.post_call_rules = [my_custom_rule] # have these be functions that can be called to fail a call

response = litellm.completion(model="gpt-3.5-turbo", messages=[{"role": "user", 
"content": "Hey, how's it going?"}], fallbacks=["openrouter/gryphe/mythomax-l2-13b"])
```
