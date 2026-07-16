# 輸出  {#output}

## 格式 {#format}
以下是您可以從所有模型的所有 litellm `completion` 呼叫預期取得的確切 json 輸出與型別

```python 
{
  'choices': [
    {
      'finish_reason': str,     # String: 'stop'
      'index': int,             # Integer: 0
      'message': {              # Dictionary [str, str]
        'role': str,            # String: 'assistant'
        'content': str          # String: "default message"
      }
    }
  ],
  'created': str,               # String: None
  'model': str,                 # String: None
  'usage': {                    # Dictionary [str, int]
    'prompt_tokens': int,       # Integer
    'completion_tokens': int,   # Integer
    'total_tokens': int         # Integer
  }
}

```

您可以像 OpenAI 允許的方式一樣，將回應作為字典或類別物件來存取
```python
print(response.choices[0].message.content)
print(response['choices'][0]['message']['content'])
```

以下是範例回應的樣子 
```python
{
  'choices': [
     {
        'finish_reason': 'stop',
        'index': 0,
        'message': {
           'role': 'assistant',
            'content': " I'm doing well, thank you for asking. I am Claude, an AI assistant created by Anthropic."
        }
      }
    ],
 'created': 1691429984.3852863,
 'model': 'claude-instant-1',
 'usage': {'prompt_tokens': 18, 'completion_tokens': 23, 'total_tokens': 41}
}
```

## 原生結束原因 {#native-finish-reason}

LiteLLM 會將所有特定提供者的 `finish_reason` 值對應為相容 OpenAI 的值（`stop`、`length`、`tool_calls`、`function_call`、`content_filter`）。當原始提供者值與對應後的值不同時，會保留在 `provider_specific_fields["native_finish_reason"]` 中。

這對需要區分不同停止條件的代理程式迴圈很有用（例如，Gemini 的 `MALFORMED_FUNCTION_CALL` 與一般的 `stop`）。

```python
response = completion(model="gemini/gemini-2.0-flash", messages=messages)

choice = response.choices[0]
print(choice.finish_reason)  # "stop" (OpenAI-compatible)

# Access the original provider value when it differs:
if hasattr(choice, "provider_specific_fields") and choice.provider_specific_fields:
    native = choice.provider_specific_fields.get("native_finish_reason")
    if native == "MALFORMED_FUNCTION_CALL":
        # Handle malformed function call differently from a normal stop
        pass
```

當提供者已經回傳相容 OpenAI 的值（例如，`stop`）時，`native_finish_reason` 不會被設定。

## 其他屬性 {#additional-attributes}

您也可以存取像延遲時間這類資訊。 

```python
from litellm import completion
import os
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages=[{"role": "user", "content": "Hey!"}]

response = completion(model="claude-2", messages=messages)

print(response.response_ms) # 616.25# 616.25
```
