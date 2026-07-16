# Completion Token Usage 與成本 {#completion-token-usage--cost}
預設情況下，LiteLLM 會在所有 completion 請求中回傳 token 用量（[請見此處](https://litellm.readthedocs.io/en/latest/output/))

LiteLLM 會在所有呼叫中回傳 `response_cost`。 

```python
from litellm import completion 

response = litellm.completion(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hey, how's it going?"}],
            mock_response="Hello world",
        )

print(response._hidden_params["response_cost"])
```

LiteLLM 也提供一些輔助函式：

- `encode`：這會使用模型專屬的 tokenizer 對傳入的文字進行編碼。[**跳至程式碼**](#1-encode)

- `decode`：這會使用模型專屬的 tokenizer 對傳入的 tokens 進行解碼。[**跳至程式碼**](#2-decode)

- `token_counter`：這會回傳給定輸入的 token 數量 - 它會使用基於模型的 tokenizer，若沒有可用的模型專屬 tokenizer，則預設使用 tiktoken。[**跳至程式碼**](#3-token_counter)

- `create_pretrained_tokenizer` 和 `create_tokenizer`：LiteLLM 為 OpenAI、Cohere、Anthropic、Llama2 和 Llama3 模型提供預設 tokenizer 支援。如果您使用的是不同的模型，可以建立自訂 tokenizer，並將其作為 `custom_tokenizer` 傳入 `encode`、`decode` 和 `token_counter` 方法。[**跳至程式碼**](#4-create_pretrained_tokenizer-and-create_tokenizer)

- `cost_per_token`：這會回傳提示詞（輸入）與 completion（輸出）tokens 的成本（以 USD 計）。使用來自 `api.litellm.ai` 的即時清單。[**跳至程式碼**](#5-cost_per_token)

- `completion_cost`：這會回傳給定 LLM API 呼叫的總成本（以 USD 計）。它會結合 `token_counter` 和 `cost_per_token`，回傳該查詢的成本（同時計入輸入與輸出成本）。[**跳至程式碼**](#6-completion_cost)

- `get_max_tokens`：這會回傳給定模型允許的最大 token 數量。[**跳至程式碼**](#7-get_max_tokens)

- `model_cost`：這會回傳所有模型的字典，包含其 max_tokens、input_cost_per_token 和 output_cost_per_token。它使用下方所示的 `api.litellm.ai` 呼叫。[**跳至程式碼**](#8-model_cost)

- `register_model`：這會在 model cost 字典中註冊新的模型／覆寫既有模型（及其定價細節）。[**跳至程式碼**](#9-register_model)

- `api.litellm.ai`：所有[支援的模型](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)的即時 token + 價格計數。[**跳至程式碼**](#10-apilitellmai)

📣 [這是一份由社群維護的清單](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)。歡迎貢獻！❤️

## 範例用法  {#example-usage}

### 1. `encode` {#1-encode}
Encoding 具有 anthropic、cohere、llama2 和 openai 的模型專屬 tokenizer。如果傳入不支援的模型，則會預設使用 tiktoken（openai 的 tokenizer）。

```python
from litellm import encode, decode

sample_text = "Hellö World, this is my input string!"
# openai encoding + decoding
openai_tokens = encode(model="gpt-3.5-turbo", text=sample_text)
print(openai_tokens)
```

### 2. `decode` {#2-decode}

支援 anthropic、cohere、llama2 和 openai 的解碼。

```python
from litellm import encode, decode

sample_text = "Hellö World, this is my input string!"
# openai encoding + decoding
openai_tokens = encode(model="gpt-3.5-turbo", text=sample_text)
openai_text = decode(model="gpt-3.5-turbo", tokens=openai_tokens)
print(openai_text)
```

### 3. `token_counter` {#3-token_counter}

```python
from litellm import token_counter

messages = [{"user": "role", "content": "Hey, how's it going"}]
print(token_counter(model="gpt-3.5-turbo", messages=messages))
```

### 4. `create_pretrained_tokenizer` 和 `create_tokenizer` {#4-create_pretrained_tokenizer-and-create_tokenizer}

```python
from litellm import create_pretrained_tokenizer, create_tokenizer

# get tokenizer from huggingface repo
custom_tokenizer_1 = create_pretrained_tokenizer("Xenova/llama-3-tokenizer")

# use tokenizer from json file
with open("tokenizer.json") as f:
    json_data = json.load(f)

json_str = json.dumps(json_data)

custom_tokenizer_2 = create_tokenizer(json_str)
```

### 5. `cost_per_token` {#5-cost_per_token}

```python
from litellm import cost_per_token

prompt_tokens =  5
completion_tokens = 10
prompt_tokens_cost_usd_dollar, completion_tokens_cost_usd_dollar = cost_per_token(model="gpt-3.5-turbo", prompt_tokens=prompt_tokens, completion_tokens=completion_tokens)

print(prompt_tokens_cost_usd_dollar, completion_tokens_cost_usd_dollar)
```

### 6. `completion_cost` {#6-completion_cost}

* 輸入：接受 `litellm.completion()` 回應 **或** prompt + completion 字串
* 輸出：回傳 `float` 該次 `completion` 呼叫的成本

**litellm.completion()**
```python
from litellm import completion, completion_cost

response = completion(
            model="bedrock/anthropic.claude-v2",
            messages=messages,
            request_timeout=200,
        )
# pass your response from completion to completion_cost
cost = completion_cost(completion_response=response)
formatted_string = f"${float(cost):.10f}"
print(formatted_string)
```

**提示詞 + 完成字串**
```python
from litellm import completion_cost
cost = completion_cost(model="bedrock/anthropic.claude-v2", prompt="Hey!", completion="How's it going?")
formatted_string = f"${float(cost):.10f}"
print(formatted_string)
```
### 7. `get_max_tokens` {#7-get_max_tokens}

輸入：接受模型名稱 - 例如 gpt-3.5-turbo（如需完整清單，請呼叫 litellm.model_list）。
輸出：回傳給定模型允許的最大 token 數量

```python 
from litellm import get_max_tokens 

model = "gpt-3.5-turbo"

print(get_max_tokens(model)) # Output: 4097
```

### 8. `model_cost` {#8-model_cost}

* 輸出：回傳一個 dict 物件，包含[社群維護清單](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)上所有模型的 max_tokens、input_cost_per_token、output_cost_per_token

```python 
from litellm import model_cost 

print(model_cost) # {'gpt-3.5-turbo': {'max_tokens': 4000, 'input_cost_per_token': 1.5e-06, 'output_cost_per_token': 2e-06}, ...}
```

### 9. `register_model` {#9-register_model}

* 輸入：提供模型 cost 字典或託管 JSON blob 的 URL 其一
* 輸出：回傳更新後的 model_cost 字典 + 以模型詳細資料更新 litellm.model_cost。  

**字典**
```python
import litellm

litellm.register_model({
        "gpt-4": {
        "max_tokens": 8192, 
        "input_cost_per_token": 0.00002, 
        "output_cost_per_token": 0.00006, 
        "litellm_provider": "openai", 
        "mode": "chat"
    },
})
```

**JSON blob 的 URL**
```python
import litellm

litellm.register_model(model_cost=
"https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json")
```

**不要抓取託管的 model_cost_map**  
如果您有防火牆，並且只想使用 model cost map 的本機副本，可以像這樣做：
```bash
export LITELLM_LOCAL_MODEL_COST_MAP="True"
```

注意：這表示您需要升級才能取得更新後的定價與較新的模型。
