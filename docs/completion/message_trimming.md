# 修剪輸入訊息 {#trimming-input-messages}
**使用 litellm.trim_messages() 確保訊息不會超過模型的 token 限制或指定的 `max_tokens`**

## 用法  {#usage}
```python
from litellm import completion
from litellm.utils import trim_messages

response = completion(
    model=model, 
    messages=trim_messages(messages, model) # trim_messages ensures tokens(messages) < max_tokens(model)
) 
```

## 用法 - 設定 max_tokens {#usage---set-max_tokens}
```python
from litellm import completion
from litellm.utils import trim_messages

response = completion(
    model=model, 
    messages=trim_messages(messages, model, max_tokens=10), # trim_messages ensures tokens(messages) < max_tokens
) 
```

## 參數 {#parameters}

此函式使用下列參數：

- `messages`:[必要] 這應該是一個輸入訊息的清單 

- `model`:[選用] 這是所使用的 LiteLLM 模型。此參數為選用，因為您也可以改為指定 `max_tokens` 參數。

- `max_tokens`:[選用] 這是一個 int，手動設定訊息的上限

- `trim_ratio`:[選用] 這代表修剪後要使用的 token 目標比例。其預設值為 0.75，這表示訊息將被修剪以使用約 75%
