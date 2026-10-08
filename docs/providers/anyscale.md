# Anyscale {#anyscale}
https://app.endpoints.anyscale.com/

## API 金鑰 {#api-key}
```python
# env variable
os.environ['ANYSCALE_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['ANYSCALE_API_KEY'] = ""
response = completion(
    model="anyscale/mistralai/Mistral-7B-Instruct-v0.1", 
    messages=messages
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['ANYSCALE_API_KEY'] = ""
response = completion(
    model="anyscale/mistralai/Mistral-7B-Instruct-v0.1", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```


## 支援的模型 {#supported-models}
此處列出的所有模型 https://app.endpoints.anyscale.com/ 都受到支援。我們持續維護模型清單、定價、token 視窗等資訊。[此處](https://github.com/BerriAI/litellm/blob/31fbb095c2c365ef30caf132265fe12cff0ef153/model_prices_and_context_window.json#L957)。

| 模型名稱               | 函式呼叫                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| llama2-7b-chat | `completion(model="anyscale/meta-llama/Llama-2-7b-chat-hf", messages)` | 
| llama-2-13b-chat | `completion(model="anyscale/meta-llama/Llama-2-13b-chat-hf", messages)` | 
| llama-2-70b-chat | `completion(model="anyscale/meta-llama/Llama-2-70b-chat-hf", messages)` | 
| mistral-7b-instruct | `completion(model="anyscale/mistralai/Mistral-7B-Instruct-v0.1", messages)` | 
| CodeLlama-34b-Instruct | `completion(model="anyscale/codellama/CodeLlama-34b-Instruct-hf", messages)` |
