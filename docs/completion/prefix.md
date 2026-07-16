import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 前置助手訊息 {#pre-fix-assistant-messages}

支援：
- Deepseek
- Mistral
- Anthropic

```python
{
  "role": "assistant", 
  "content": "..", 
  ...
  "prefix": true # 👈 KEY CHANGE
}
```

## 快速開始  {#quick-start}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os 

os.environ["DEEPSEEK_API_KEY"] = ""

response = completion(
  model="deepseek/deepseek-chat",
  messages=[
    {"role": "user", "content": "Who won the world cup in 2022?"},
    {"role": "assistant", "content": "Argentina", "prefix": True}
  ]
)
print(response.choices[0].message.content)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_KEY" \
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [
      {
        "role": "user",
        "content": "Who won the world cup in 2022?"
      },
      {
        "role": "assistant", 
        "content": "Argentina", "prefix": true
      }
    ]
}'
```
</TabItem>
</Tabs>

**預期回應**

```bash
{
    "id": "3b66124d79a708e10c603496b363574c",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": " won the FIFA World Cup in 2022.",
                "role": "assistant",
                "tool_calls": null,
                "function_call": null
            }
        }
    ],
    "created": 1723323084,
    "model": "deepseek/deepseek-chat",
    "object": "chat.completion",
    "system_fingerprint": "fp_7e0991cad4",
    "usage": {
        "completion_tokens": 12,
        "prompt_tokens": 16,
        "total_tokens": 28,
    },
    "service_tier": null
}
```

## 檢查模型支援  {#check-model-support}

呼叫 `litellm.get_model_info` 以檢查某個模型/提供者是否支援 `prefix`。 

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import get_model_info

params = get_model_info(model="deepseek/deepseek-chat")

assert params["supports_assistant_prefill"] is True
```

</TabItem>
<TabItem value="proxy" label="PROXY">

呼叫 `/model/info` 端點以取得模型清單及其支援的參數。

```bash
curl -X GET 'http://0.0.0.0:4000/v1/model/info' \
-H 'Authorization: Bearer $LITELLM_KEY' \
```
</TabItem>
</Tabs>
