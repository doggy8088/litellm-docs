# Mock Completion() 回應 - 節省測試成本 💰 {#mock-completion-responses---save-testing-costs-}

為了測試用途，您可以搭配 `completion()` 與 `mock_response` 來模擬呼叫 completion 端點。 

這會回傳一個具有預設回應的回應物件（串流情境也適用），而不會呼叫 LLM API。 

## 快速開始 {#quick-start}
```python
from litellm import completion 

model = "gpt-3.5-turbo"
messages = [{"role":"user", "content":"This is a test request"}]

completion(model=model, messages=messages, mock_response="It's simple to use and easy to get started")
```

## 串流 {#streaming}

```python
from litellm import completion 
model = "gpt-3.5-turbo"
messages = [{"role": "user", "content": "Hey, I'm a mock request"}]
response = completion(model=model, messages=messages, stream=True, mock_response="It's simple to use and easy to get started")
for chunk in response: 
    print(chunk) # {'choices': [{'delta': {'role': 'assistant', 'content': 'Thi'}, 'finish_reason': None}]}
    complete_response += chunk["choices"][0]["delta"]["content"]
```

## （非串流）模擬回應物件  {#non-streaming-mock-response-object}

```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "This is a mock request",
        "role": "assistant",
        "logprobs": null
      }
    }
  ],
  "created": 1694459929.4496052,
  "model": "MockResponse",
  "usage": {
    "prompt_tokens": null,
    "completion_tokens": null,
    "total_tokens": null
  }
}
```

## 使用 `completion` 與 `mock_response` 建立 pytest 函式 {#building-a-pytest-function-using-completion-with-mock_response}

```python
from litellm import completion
import pytest

def test_completion_openai():
    try:
        response = completion(
            model="gpt-3.5-turbo",
            messages=[{"role":"user", "content":"Why is LiteLLM amazing?"}],
            mock_response="LiteLLM is awesome"
        )
        # Add any assertions here to check the response
        print(response)
        assert(response['choices'][0]['message']['content'] == "LiteLLM is awesome")
    except Exception as e:
        pytest.fail(f"Error occurred: {e}")
```
