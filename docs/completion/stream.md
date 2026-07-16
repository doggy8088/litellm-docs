import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 串流 + 非同步 {#streaming--async}

| 功能 | LiteLLM SDK | LiteLLM Proxy |
|---------|-------------|---------------|
| 串流 | ✅ [從這裡開始](#streaming-responses) | ✅ [從這裡開始](../proxy/user_keys#streaming) |
| 非同步 | ✅ [從這裡開始](#async-completion) | ✅ [從這裡開始](../proxy/user_keys#streaming) |
| 非同步串流 | ✅ [從這裡開始](#async-streaming) | ✅ [從這裡開始](../proxy/user_keys#streaming) |

## 串流回應 {#streaming-responses}
LiteLLM 支援透過將 `stream=True` 作為 completion 函式的引數來串流傳回模型回應
### 用法 {#usage}
```python
from litellm import completion
messages = [{"role": "user", "content": "Hey, how's it going?"}]
response = completion(model="gpt-3.5-turbo", messages=messages, stream=True)
for part in response:
    print(part.choices[0].delta.content or "")
```

### 輔助函式 {#helper-function}

LiteLLM 也提供一個輔助函式，可從 chunks 清單重建完整的串流回應。 

```python
from litellm import completion
messages = [{"role": "user", "content": "Hey, how's it going?"}]
response = completion(model="gpt-3.5-turbo", messages=messages, stream=True)

for chunk in response: 
    chunks.append(chunk)

print(litellm.stream_chunk_builder(chunks, messages=messages))
```

## 非同步 Completion {#async-completion}
使用 LiteLLM 的非同步 Completion。LiteLLM 提供一個稱為 `acompletion` 的 completion 函式非同步版本
### 用法 {#usage-1}
```python
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

## 非同步串流 {#async-streaming}
我們已在傳回的串流物件中實作 `__anext__()` 函式。這使得可以對串流物件進行非同步迭代。 

### 用法 {#usage-2}
以下是將它與 openai 搭配使用的範例。
```python
from litellm import acompletion
import asyncio, os, traceback

async def completion_call():
    try:
        print("test acompletion + streaming")
        response = await acompletion(
            model="gpt-3.5-turbo", 
            messages=[{"content": "Hello, how are you?", "role": "user"}], 
            stream=True
        )
        print(f"response: {response}")
        async for chunk in response:
            print(chunk)
    except:
        print(f"error occurred: {traceback.format_exc()}")
        pass

asyncio.run(completion_call())
```

## 錯誤處理 - 無限迴圈 {#error-handling---infinite-loops}

有時模型可能會進入無限迴圈，並持續重複相同的 chunks - [例如 issue](https://github.com/BerriAI/litellm/issues/5158)

可用以下方式中斷： 

```python
litellm.REPEATED_STREAMING_CHUNK_LIMIT = 100 # # catch if model starts looping the same chunk while streaming. Uses high default to prevent false positives.
```

LiteLLM 透過檢查某個 chunk 是否重複了 'n' 次（預設為 100）來處理這種錯誤。如果超過該限制，將會拋出 `litellm.InternalServerError`，以便觸發重試邏輯。 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import litellm 
import os 

litellm.set_verbose = False
loop_amount = litellm.REPEATED_STREAMING_CHUNK_LIMIT + 1
chunks = [
    litellm.ModelResponse(**{
    "id": "chatcmpl-123",
    "object": "chat.completion.chunk",
    "created": 1694268190,
    "model": "gpt-3.5-turbo-0125",
    "system_fingerprint": "fp_44709d6fcb",
    "choices": [
        {"index": 0, "delta": {"content": "How are you?"}, "finish_reason": "stop"}
    ],
}, stream=True)
] * loop_amount
completion_stream = litellm.ModelResponseListIterator(model_responses=chunks)

response = litellm.CustomStreamWrapper(
    completion_stream=completion_stream,
    model="gpt-3.5-turbo",
    custom_llm_provider="cached_response",
    logging_obj=litellm.Logging(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hey"}],
        stream=True,
        call_type="completion",
        start_time=time.time(),
        litellm_call_id="12345",
        function_id="1245",
    ),
)

for chunk in response:
    continue # expect to raise InternalServerError 
```

</TabItem>
<TabItem value="proxy" label="PROXY">

請在 Proxy 的 config.yaml 中定義這項設定。 

```yaml
litellm_settings:
    REPEATED_STREAMING_CHUNK_LIMIT: 100 # this overrides the litellm default
```

Proxy 使用 litellm SDK。若要驗證這是否可運作，請試試看 'SDK' 程式碼片段。 

</TabItem>
</Tabs>
