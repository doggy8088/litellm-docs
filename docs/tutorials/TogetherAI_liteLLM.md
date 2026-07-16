# Llama2 Together AI 教學 {#llama2-together-ai-tutorial}
https://together.ai/

```python
!uv add litellm
```


```python
import os
from litellm import completion
os.environ["TOGETHERAI_API_KEY"] = "" #@param
user_message = "Hello, whats the weather in San Francisco??"
messages = [{ "content": user_message,"role": "user"}]
```

## 在 TogetherAI 上呼叫 Llama2 {#calling-llama2-on-togetherai}
https://api.together.xyz/playground/chat?model=togethercomputer%2Fllama-2-70b-chat

```python
model_name = "together_ai/togethercomputer/llama-2-70b-chat"
response = completion(model=model_name, messages=messages)
print(response)
```


```

    {'choices': [{'finish_reason': 'stop', 'index': 0, 'message': {'role': 'assistant', 'content': "\n\nI'm not able to provide real-time weather information. However, I can suggest"}}], 'created': 1691629657.9288375, 'model': 'togethercomputer/llama-2-70b-chat', 'usage': {'prompt_tokens': 9, 'completion_tokens': 17, 'total_tokens': 26}}
```


LiteLLM 也會處理 Together AI 的 Llama2 模型提示格式化，將您的訊息轉換為所需的 
`[INST] <your instruction> [/INST]` 格式。 

[實作程式碼](https://github.com/BerriAI/litellm/blob/64f3d3c56ef02ac5544983efc78293de31c1c201/litellm/llms/prompt_templates/factory.py#L17)

## 使用串流 {#with-streaming}

```python
response = completion(model=model_name, messages=messages, together_ai=True, stream=True)
print(response)
for chunk in response:
  print(chunk['choices'][0]['delta']) # same as openai format
```


## 搭配自訂提示樣板使用 Llama2 變體 {#use-llama2-variants-with-custom-prompt-templates}

在 TogetherAI 上使用需要自訂提示格式化的 Llama2 版本？ 

您可以建立自訂提示樣板。 

讓我們為 `OpenAssistant/llama2-70b-oasst-sft-v10` 製作一個！

可接受的樣板格式為：[參考](https://huggingface.co/OpenAssistant/llama2-70b-oasst-sft-v10)
```
"""
<|im_start|>system
{system_message}<|im_end|>
<|im_start|>user
{prompt}<|im_end|>
<|im_start|>assistant
"""
```

讓我們註冊自訂提示樣板：[實作程式碼](https://github.com/BerriAI/litellm/blob/64f3d3c56ef02ac5544983efc78293de31c1c201/litellm/llms/prompt_templates/factory.py#L77)
```python
import litellm 

litellm.register_prompt_template(
    model="OpenAssistant/llama2-70b-oasst-sft-v10",
    roles={"system":"<|im_start|>system", "assistant":"<|im_start|>assistant", "user":"<|im_start|>user"}, # tell LiteLLM how you want to map the openai messages to this model
    pre_message_sep= "\n",
    post_message_sep= "\n"
)
```

讓我們來使用它！ 

```python
from litellm import completion 

# set env variable 
os.environ["TOGETHERAI_API_KEY"] = ""

messages=[{"role":"user", "content": "Write me a poem about the blue sky"}]

completion(model="together_ai/OpenAssistant/llama2-70b-oasst-sft-v10", messages=messages)
```

**完整程式碼**

```python
import litellm 
from litellm import completion

# set env variable 
os.environ["TOGETHERAI_API_KEY"] = ""

litellm.register_prompt_template(
    model="OpenAssistant/llama2-70b-oasst-sft-v10",
    roles={"system":"<|im_start|>system", "assistant":"<|im_start|>assistant", "user":"<|im_start|>user"}, # tell LiteLLM how you want to map the openai messages to this model
    pre_message_sep= "\n",
    post_message_sep= "\n"
)

messages=[{"role":"user", "content": "Write me a poem about the blue sky"}]

response = completion(model="together_ai/OpenAssistant/llama2-70b-oasst-sft-v10", messages=messages)

print(response)
```

**輸出**
```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": ".\n\nThe sky is a canvas of blue,\nWith clouds that drift and move,",
        "role": "assistant",
        "logprobs": null
      }
    }
  ],
  "created": 1693941410.482018,
  "model": "OpenAssistant/llama2-70b-oasst-sft-v10",
  "usage": {
    "prompt_tokens": 7,
    "completion_tokens": 16,
    "total_tokens": 23
  },
  "litellm_call_id": "f21315db-afd6-4c1e-b43a-0b5682de4b06"
}
```
