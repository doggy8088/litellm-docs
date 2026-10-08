# litellm.aembedding() {#litellmaembedding}

LiteLLM 提供名為 `aembedding` 的 `embedding` 函式非同步版本
### 使用方式 {#usage}
```python
from litellm import aembedding
import asyncio

async def test_get_response():
    response = await aembedding('text-embedding-ada-002', input=["good morning from litellm"])
    return response

response = asyncio.run(test_get_response())
print(response)
```
