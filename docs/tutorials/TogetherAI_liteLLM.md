# Llama Together AI 教學 {#llama-together-ai-tutorial}
https://together.ai/

```bash
uv add litellm
```

```python
import os
from litellm import completion
os.environ["TOGETHERAI_API_KEY"] = "" #@param
user_message = "Hello, whats the weather in San Francisco??"
messages = [{ "content": user_message,"role": "user"}]
```

## 在 TogetherAI 上呼叫 Llama {#calling-llama-on-togetherai}
https://api.together.xyz/playground/chat?model=meta-llama%2FLlama-3.3-70B-Instruct-Turbo

```python
model_name = "together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo"
response = completion(model=model_name, messages=messages)
print(response)
```

```
ModelResponse(id='p37X6YS-4YNCb4-a42452fa9a16e22a', created=1790615034, model='meta-llama/Llama-3.3-70B-Instruct-Turbo', object='chat.completion', choices=[Choices(finish_reason='stop', index=0, message=Message(content="San Francisco! The weather in San Francisco is known for being quite unique and unpredictable...", role='assistant'))], usage=Usage(completion_tokens=20, prompt_tokens=44, total_tokens=64))
```

LiteLLM 會將您的 OpenAI 格式 `messages` 陣列原封不動地傳送到 Together AI 的 `/v1/chat/completions` 端點，並由 Together AI 在伺服器端套用該模型的聊天範本。LiteLLM 不會將訊息重寫為 `[INST] ... [/INST]` 提示，且以 `litellm.register_prompt_template` 註冊的範本不會套用到 `together_ai/` 聊天模型

[實作程式碼](https://github.com/BerriAI/litellm/blob/main/litellm/llms/together_ai/chat/transformation.py)

## 使用串流 {#with-streaming}

```python
response = completion(model=model_name, messages=messages, stream=True)
print(response)
for chunk in response:
  print(chunk['choices'][0]['delta']) # same as openai format
```
