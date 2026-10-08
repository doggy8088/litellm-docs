import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Galadriel {#galadriel}
https://docs.galadriel.com/api-reference/chat-completion-API

LiteLLM 支援 Galadriel 上的所有模型。

## API 金鑰 {#api-key}
```python
import os 
os.environ['GALADRIEL_API_KEY'] = "your-api-key"
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['GALADRIEL_API_KEY'] = ""
response = completion(
    model="galadriel/llama3.1", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
)
print(response)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['GALADRIEL_API_KEY'] = ""
response = completion(
    model="galadriel/llama3.1", 
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```


## 支援的模型 {#supported-models}
### 無伺服器端點 {#serverless-endpoints}
我們支援所有 Galadriel AI 模型，只要在傳送 completion 請求時將 `galadriel/` 設為前綴即可

我們同時支援完整模型名稱與簡化名稱比對。 

您可以使用完整名稱或簡化版本指定模型名稱，例如 `llama3.1:70b` 

| 模型名稱                                               | 簡化名稱                  | 函式呼叫                                           |
| ------------------------------------------------------ | -------------------------------- | ------------------------------------------------------- |
| neuralmagic/Meta-Llama-3.1-8B-Instruct-FP8               | llama3.1 or llama3.1:8b          | `completion(model="galadriel/llama3.1", messages)`      |
| neuralmagic/Meta-Llama-3.1-70B-Instruct-quantized.w4a16  | llama3.1:70b                     | `completion(model="galadriel/llama3.1:70b", messages)`  |
| neuralmagic/Meta-Llama-3.1-405B-Instruct-quantized.w4a16 | llama3.1:405b                    | `completion(model="galadriel/llama3.1:405b", messages)` |
| neuralmagic/Mistral-Nemo-Instruct-2407-quantized.w4a16   | mistral-nemo or mistral-nemo:12b | `completion(model="galadriel/mistral-nemo", messages)`  |
