# 模擬 Completion 回應 - 節省測試成本 {#mock-completion-responses---save-testing-costs}

想要在不呼叫 LLM API 的情況下測試發送 LLM Completion 請求嗎？  
將 `mock_response` 傳給 `litellm.completion`，litellm 就會直接回傳回應，而不需要呼叫 LLM API 並花費 $$ 

## 使用 `completion()` 搭配 `mock_response` {#using-completion-with-mock_response}

```python
from litellm import completion 

model = "gpt-3.5-turbo"
messages = [{"role":"user", "content":"Why is LiteLLM amazing?"}]

completion(model=model, messages=messages, mock_response="It's simple to use and easy to get started")
```

## 使用 `completion` 建立 pytest 函式 {#building-a-pytest-function-using-completion}

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
        print(response['choices'][0]['finish_reason'])
    except Exception as e:
        pytest.fail(f"Error occurred: {e}")
```
