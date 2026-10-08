# 托管快取 - api.litellm.ai（已移除） {#hosted-cache---apilitellmai-removed}

由 api.litellm.ai 支援的托管快取已從 LiteLLM 中移除。`"hosted"` 不是有效的 `Cache(type=...)` 值，傳入它會使快取失去後端，因此下一個 `completion()` 請求會引發 `AttributeError: 'Cache' object has no attribute 'cache'`

請改用下列支援的後端之一：`local`（預設，記憶體中）、`redis`、`redis-semantic`、`valkey-semantic`、`qdrant-semantic`、`s3`、`gcs`、`azure-blob` 或 `disk`。請參閱 [快取 - 記憶體中、Redis、s3、gcs、Redis 語意快取、磁碟](./all_caches.md) 以了解各自的設定方式。以下範例使用預設的記憶體中快取

## 快速開始使用 - Completion {#quick-start-usage---completion}
```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
litellm.cache = Cache() # in-memory cache

# Make completion calls
response1 = completion(
    model="{{openai_small}}", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)

response2 = completion(
    model="{{openai_small}}", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)
# response1 == response2, response 1 is cached
```

## 使用方式 - Embedding() {#usage---embedding}

```python
import time
import litellm
from litellm import completion, embedding
from litellm.caching.caching import Cache
litellm.cache = Cache()

start_time = time.time()
embedding1 = embedding(model="text-embedding-ada-002", input=["hello from litellm"*5], caching=True)
end_time = time.time()
print(f"Embedding 1 response time: {end_time - start_time} seconds")

start_time = time.time()
embedding2 = embedding(model="text-embedding-ada-002", input=["hello from litellm"*5], caching=True)
end_time = time.time()
print(f"Embedding 2 response time: {end_time - start_time} seconds")
```

## 串流快取  {#caching-with-streaming}
LiteLLM 可以為您快取串流回應

### 使用方式 {#usage}
```python
import litellm
import time
from litellm import completion
from litellm.caching.caching import Cache

litellm.cache = Cache()

# Make completion calls
response1 = completion(
    model="{{openai_small}}", 
    messages=[{"role": "user", "content": "Tell me a joke."}], 
    stream=True,
    caching=True)
for chunk in response1:
    print(chunk)

time.sleep(1) # cache is updated asynchronously

response2 = completion(
    model="{{openai_small}}", 
    messages=[{"role": "user", "content": "Tell me a joke."}], 
    stream=True,
    caching=True)
for chunk in response2:
    print(chunk)
```
