# LiteLLM - 本機快取 {#litellm---local-caching}

## 啟用時的 `completion()` 與 `embedding()` 呼叫快取 {#caching-completion-and-embedding-calls-when-switched-on}

liteLLM 實作精確匹配快取，並支援以下快取：
* 記憶體內快取 [預設]
* Redis 本機快取
* Redis 主機式快取

## 快速上手使用 - Completion {#quick-start-usage---completion}
快取 - cache
快取中的鍵是 `model`，以下範例將會命中快取
```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
litellm.cache = Cache()

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}]
    caching=True
)
response2 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)

# response1 == response2, response 1 is cached
```

## 自訂鍵值對  {#custom-key-value-pairs}
將自訂鍵值對加入您的快取。 

```python 
from litellm.caching.caching import Cache
cache = Cache()

cache.add_cache(cache_key="test-key", result="1234")

cache.get_cache(cache_key="test-key")
```

## 串流快取  {#caching-with-streaming}
LiteLLM 可以為您快取串流回應

### 使用方式 {#usage}
```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
litellm.cache = Cache()

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}], 
    stream=True,
    caching=True)
for chunk in response1:
    print(chunk)
response2 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}], 
    stream=True,
    caching=True)
for chunk in response2:
    print(chunk)
```

## 使用方式 - Embedding() {#usage---embedding}
1. 快取 - cache
快取中的鍵是 `model`，以下範例將會命中快取
```python
import time
import litellm
from litellm import embedding
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
