# Instructor {#instructor}

將 LiteLLM 與 [jxnl 的 instructor 函式庫](https://github.com/jxnl/instructor) 結合，以取得更穩健的結構化輸出。輸出會自動驗證為 Pydantic 類型，且驗證錯誤會回傳給模型，以提高重試時成功回應的機會。

## 用法（同步） {#usage-sync}

```python
import instructor
from litellm import completion
from pydantic import BaseModel


client = instructor.from_litellm(completion)


class User(BaseModel):
    name: str
    age: int


def extract_user(text: str):
    return client.chat.completions.create(
        model="gpt-4o-mini",
        response_model=User,
        messages=[
            {"role": "user", "content": text},
        ],
        max_retries=3,
    )

user = extract_user("Jason is 25 years old")

assert isinstance(user, User)
assert user.name == "Jason"
assert user.age == 25
print(f"{user=}")
```

## 用法（非同步） {#usage-async}

```python
import asyncio

import instructor
from litellm import acompletion
from pydantic import BaseModel


client = instructor.from_litellm(acompletion)


class User(BaseModel):
    name: str
    age: int


async def extract(text: str) -> User:
    return await client.chat.completions.create(
        model="gpt-4o-mini",
        response_model=User,
        messages=[
            {"role": "user", "content": text},
        ],
        max_retries=3,
    )

user = asyncio.run(extract("Alice is 30 years old"))

assert isinstance(user, User)
assert user.name == "Alice"
assert user.age == 30
print(f"{user=}")
```
