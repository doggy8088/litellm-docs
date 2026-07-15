---
type: "Documentation page"
title: "Local Caching"
description: "LiteLLM Local Caching Caching completion() and embedding() calls when switched on liteLLM implements exact match caching and supports the following Caching: In Memory Caching [D..."
resource: "https://github.com/BerriAI/litellm-docs/blob/main/docs/caching/local_caching.md"
tags: ["docs","documentation-page"]
source_path: "docs/caching/local_caching.md"
source_area: "docs"
source_revision: "038c9caf294fea449d24d6a787f9eaf7e3ca882f"
source_frontmatter_keys: []
---
# Source document

This concept mirrors [`docs/caching/local_caching.md`](https://github.com/BerriAI/litellm-docs/blob/main/docs/caching/local_caching.md) from Git revision `038c9caf294fea449d24d6a787f9eaf7e3ca882f`.

The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.

## Original content

````markdown
# LiteLLM - Local Caching

## Caching `completion()` and `embedding()` calls when switched on

liteLLM implements exact match caching and supports the following Caching:
* In-Memory Caching [Default]
* Redis Caching Local
* Redis Caching Hosted

## Quick Start Usage - Completion
Caching - cache
Keys in the cache are `model`, the following example will lead to a cache hit
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

## Custom Key-Value Pairs 
Add custom key-value pairs to your cache. 

```python 
from litellm.caching.caching import Cache
cache = Cache()

cache.add_cache(cache_key="test-key", result="1234")

cache.get_cache(cache_key="test-key")
```

## Caching with Streaming 
LiteLLM can cache your streamed responses for you

### Usage
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

## Usage - Embedding()
1. Caching - cache
Keys in the cache are `model`, the following example will lead to a cache hit
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
````
