# FriendliAI {#friendliai}

:::info
**我們支援所有 FriendliAI 模型，送出 completion 請求時只要將 `friendliai/` 作為前綴即可**
:::

| 屬性                     | 詳細資訊                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| 說明                     | 用於建置可供正式環境使用的複合式 AI 系統，速度最快且最有效率的推論引擎。 |
| LiteLLM 上的提供者路由  | `friendliai/`                                                                                   |
| 提供者文件               | [FriendliAI ↗](https://friendli.ai/docs/sdk/integrations/litellm)                               |
| 支援的 OpenAI 端點       | `/chat/completions`, `/completions`                                                             |

## API 金鑰 {#api-key}

```python
# env variable
os.environ['FRIENDLI_TOKEN']
```

## 範例用法 {#sample-usage}

```python
from litellm import completion
import os

os.environ['FRIENDLI_TOKEN'] = ""
response = completion(
    model="friendliai/meta-llama-3.1-8b-instruct",
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

os.environ['FRIENDLI_TOKEN'] = ""
response = completion(
    model="friendliai/meta-llama-3.1-8b-instruct",
    messages=[
       {"role": "user", "content": "hello from litellm"}
   ],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 支援的模型 {#supported-models}

我們支援所有 FriendliAI AI 模型，送出 completion 請求時只要將 `friendliai/` 作為前綴即可

| 模型名稱                  | 函式呼叫                                                          |
| ------------------------- | ---------------------------------------------------------------------- |
| meta-llama-3.1-8b-instruct  | `completion(model="friendliai/meta-llama-3.1-8b-instruct", messages)`  |
| meta-llama-3.1-70b-instruct | `completion(model="friendliai/meta-llama-3.1-70b-instruct", messages)` |
