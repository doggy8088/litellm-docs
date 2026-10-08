# 串流回應與非同步完成 {#streaming-responses--async-completion}

- [串流回應](#streaming-responses)
- [非同步完成](#async-completion)

## 串流回應 {#streaming-responses}
LiteLLM 支援將模型回應以串流方式傳回，只要將 `stream=True` 作為 completion 函式的參數傳入即可
### 用法 {#usage}
```python
response = completion(model="gpt-3.5-turbo", messages=messages, stream=True)
for chunk in response:
    print(chunk['choices'][0]['delta'])

```

## 非同步完成 {#async-completion}
使用 LiteLLM 進行非同步完成
LiteLLM 提供名為 `acompletion` 的 completion 函式非同步版本
### 用法 {#usage-1}
```
from litellm import acompletion
import asyncio

async def test_get_response():
    user_message = "Hello, how are you?"
    messages = [{"content": user_message, "role": "user"}]
    response = await acompletion(model="gpt-3.5-turbo", messages=messages)
    return response

response = asyncio.run(test_get_response())
print(response)

```

## 串流 Token 用量  {#streaming-token-usage}

適用於所有提供者。運作方式與 openai 相同。

`stream_options={"include_usage": True}`

如果有設定，在 data: [DONE] 訊息之前會額外串流一個 chunk。此 chunk 上的 usage 欄位會顯示整個請求的 token 用量統計，而 choices 欄位一律會是空陣列。所有其他 chunk 也會包含 usage 欄位，但其值為 null。

### SDK {#sdk}
```python 
from litellm import completion 
import os

os.environ["OPENAI_API_KEY"] = "" 

response = completion(model="gpt-3.5-turbo", messages=messages, stream=True, stream_options={"include_usage": True})
for chunk in response:
    print(chunk['choices'][0]['delta'])
```

### PROXY {#proxy}

```bash 
curl https://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "stream": true,
    "stream_options": {"include_usage": true}
  }'

```
