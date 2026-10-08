# Token 使用 {#token-usage}
預設情況下，LiteLLM 會在所有 completion 請求中回傳 token 使用量（[請見此處](https://litellm.readthedocs.io/en/latest/output/)）

不過，我們也提供 3 個公開的輔助函式，用來計算跨提供者的 token 使用量：

- `token_counter`：這會回傳給定輸入的 token 數量 - 它會根據模型使用 tokenizer，若沒有可用的模型專屬 tokenizer，則預設使用 tiktoken。 

- `cost_per_token`：這會回傳 prompt（輸入）與 completion（輸出）token 的成本（以 USD 計）。它使用我們的 model_cost 對照表，該對照表可在 `__init__.py` 找到，也可作為 [社群資源](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 使用。

- `completion_cost`：這會回傳給定 LLM API 呼叫的總成本（以 USD 計）。它結合 `token_counter` 與 `cost_per_token`，以回傳該查詢的成本（同時計入輸入與輸出的成本）。 

## 範例用法  {#example-usage}

1. `token_counter`

```python
from litellm import token_counter

messages = [{"role": "user", "content": "Hey, how's it going"}]
print(token_counter(model="gpt-3.5-turbo", messages=messages))
```

2. `cost_per_token`

```python
from litellm import cost_per_token

prompt_tokens =  5
completion_tokens = 10
prompt_tokens_cost_usd_dollar, completion_tokens_cost_usd_dollar = cost_per_token(model="gpt-3.5-turbo", prompt_tokens=prompt_tokens, completion_tokens=completion_tokens)

print(prompt_tokens_cost_usd_dollar, completion_tokens_cost_usd_dollar)
```

3. `completion_cost`

```python
from litellm import completion_cost

prompt = "Hey, how's it going"
completion = "Hi, I'm gpt - I am doing well"
cost_of_query = completion_cost(model="gpt-3.5-turbo", prompt=prompt, completion=completion))

print(cost_of_query)
```
