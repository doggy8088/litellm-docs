# Featherless AI {#featherless-ai}
https://featherless.ai/

:::tip

**我們支援所有 Featherless AI 模型，只要在傳送 litellm 請求時，將 `model=featherless_ai/<any-model-on-featherless>` 設為前綴即可。如需完整的支援模型清單，請造訪 https://featherless.ai/models **

:::

## API 金鑰 {#api-key}
```python
# env variable
os.environ['FEATHERLESS_AI_API_KEY']
```

## 範例用法 {#sample-usage}
```python
from litellm import completion
import os

os.environ['FEATHERLESS_AI_API_KEY'] = ""
response = completion(
    model="featherless_ai/featherless-ai/Qwerky-72B", 
    messages=[{"role": "user", "content": "write code for saying hi from LiteLLM"}]
)
```

## 範例用法 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['FEATHERLESS_AI_API_KEY'] = ""
response = completion(
    model="featherless_ai/featherless-ai/Qwerky-72B", 
    messages=[{"role": "user", "content": "write code for saying hi from LiteLLM"}],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 聊天模型 {#chat-models}
| 模型名稱                                 | 函式呼叫                                                                                  |
|---------------------------------------------|-----------------------------------------------------------------------------------------------|
| featherless-ai/Qwerky-72B                   | `completion(model="featherless_ai/featherless-ai/Qwerky-72B", messages)`                      |
| featherless-ai/Qwerky-QwQ-32B               | `completion(model="featherless_ai/featherless-ai/Qwerky-QwQ-32B", messages)`                  |
| Qwen/Qwen2.5-72B-Instruct                   | `completion(model="featherless_ai/Qwen/Qwen2.5-72B-Instruct", messages)`                      |
| all-hands/openhands-lm-32b-v0.1             | `completion(model="featherless_ai/all-hands/openhands-lm-32b-v0.1", messages)`                |
| Qwen/Qwen2.5-Coder-32B-Instruct             | `completion(model="featherless_ai/Qwen/Qwen2.5-Coder-32B-Instruct", messages)`                |
| deepseek-ai/DeepSeek-V3-0324                | `completion(model="featherless_ai/deepseek-ai/DeepSeek-V3-0324", messages)`                   |
| mistralai/Mistral-Small-24B-Instruct-2501   | `completion(model="featherless_ai/mistralai/Mistral-Small-24B-Instruct-2501", messages)`      |
| mistralai/Mistral-Nemo-Instruct-2407        | `completion(model="featherless_ai/mistralai/Mistral-Nemo-Instruct-2407", messages)`           |
| ProdeusUnity/Stellar-Odyssey-12b-v0.0       | `completion(model="featherless_ai/ProdeusUnity/Stellar-Odyssey-12b-v0.0", messages)`          |
