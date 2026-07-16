import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 批次處理 Completion() {#batching-completion}
LiteLLM 讓您可以：
* 將多個 completion 呼叫傳送至 1 個 model
* 將 1 個 completion 呼叫傳送至多個 model：傳回最快回應
* 將 1 個 completion 呼叫傳送至多個 model：傳回所有回應

:::info

想在 LiteLLM Proxy 上進行批次 completion 嗎？請前往：https://docs.litellm.ai/docs/proxy/user_keys#beta-batch-completions---pass-model-as-list

:::

## 將多個 completion 呼叫傳送至 1 個 model {#send-multiple-completion-calls-to-1-model}

在 batch_completion 方法中，您提供一個 `messages` 清單，其中每個子清單的 messages 都會傳遞給 `litellm.completion()`，讓您能在單一 API 呼叫中有效率地處理多個提示。

<a target="_blank" href="https://colab.research.google.com/github/BerriAI/litellm/blob/main/cookbook/LiteLLM_batch_completion.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="在 Colab 中開啟"/>
</a>

### 範例程式碼 {#example-code}
```python
import litellm
import os
from litellm import batch_completion

os.environ['ANTHROPIC_API_KEY'] = ""


responses = batch_completion(
    model="claude-2",
    messages = [
        [
            {
                "role": "user",
                "content": "good morning? "
            }
        ],
        [
            {
                "role": "user",
                "content": "what's the time? "
            }
        ]
    ]
)
```

## 將 1 個 completion 呼叫傳送至多個 model：傳回最快回應 {#send-1-completion-call-to-many-models-return-fastest-response}
這會對指定的 `models` 發出平行呼叫，並傳回第一個回應

請用這個方式來降低延遲

<Tabs>
<TabItem value="sdk" label="SDK">

### 範例程式碼 {#example-code-1}
```python
import litellm
import os
from litellm import batch_completion_models

os.environ['ANTHROPIC_API_KEY'] = ""
os.environ['OPENAI_API_KEY'] = ""
os.environ['COHERE_API_KEY'] = ""

response = batch_completion_models(
    models=["gpt-3.5-turbo", "claude-instant-1.2", "command-nightly"], 
    messages=[{"role": "user", "content": "Hey, how's it going"}]
)
print(result)
```


</TabItem>
<TabItem value="proxy" label="PROXY">

[如何設定 proxy 組態](#example-setup)

只要傳入以逗號分隔的 model 名稱字串，以及旗標 `fastest_response=True` 即可。

<Tabs>
<TabItem value="curl" label="curl">

```bash

curl -X POST 'http://localhost:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \ 
-D '{
    "model": "gpt-4o, groq-llama", # 👈 Comma-separated models
    "messages": [
      {
        "role": "user",
        "content": "What's the weather like in Boston today?"
      }
    ],
    "stream": true,
    "fastest_response": true # 👈 FLAG
}

'
```

</TabItem>
<TabItem value="openai" label="OpenAI SDK">

```python
import openai
client = openai.OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

# request sent to model set on litellm proxy, `litellm --model`
response = client.chat.completions.create(
    model="gpt-4o, groq-llama", # 👈 Comma-separated models
    messages = [
        {
            "role": "user",
            "content": "this is a test request, write a short poem"
        }
    ],
    extra_body={"fastest_response": true} # 👈 FLAG
)

print(response)
```

</TabItem>
</Tabs>

---

### 範例設定：  {#example-setup}

```yaml 
model_list: 
- model_name: groq-llama
  litellm_params:
    model: groq/llama3-8b-8192
    api_key: os.environ/GROQ_API_KEY
- model_name: gpt-4o
  litellm_params:
    model: gpt-4o
    api_key: os.environ/OPENAI_API_KEY
```

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

</TabItem>
</Tabs>

### 輸出 {#output}
傳回 OpenAI 格式中的第一個回應。會取消其他 LLM API 呼叫。 
```json
{
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": " I'm doing well, thanks for asking! I'm an AI assistant created by Anthropic to be helpful, harmless, and honest.",
        "role": "assistant",
        "logprobs": null
      }
    }
  ],
  "id": "chatcmpl-23273eed-e351-41be-a492-bafcf5cf3274",
  "created": 1695154628.2076092,
  "model": "command-nightly",
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 14,
    "total_tokens": 20
  }
}
```


## 將 1 個 completion 呼叫傳送至多個 model：傳回所有回應 {#send-1-completion-call-to-many-models-return-all-responses}
這會對指定的 models 發出平行呼叫，並傳回所有回應

請用這個方式來並行處理請求，並從多個 model 取得回應。

### 範例程式碼 {#example-code-2}
```python
import litellm
import os
from litellm import batch_completion_models_all_responses

os.environ['ANTHROPIC_API_KEY'] = ""
os.environ['OPENAI_API_KEY'] = ""
os.environ['COHERE_API_KEY'] = ""

responses = batch_completion_models_all_responses(
    models=["gpt-3.5-turbo", "claude-instant-1.2", "command-nightly"], 
    messages=[{"role": "user", "content": "Hey, how's it going"}]
)
print(responses)

```

### 輸出 {#output-1}

```json
[<ModelResponse chat.completion id=chatcmpl-e673ec8e-4e8f-4c9e-bf26-bf9fa7ee52b9 at 0x103a62160> JSON: {
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop_sequence",
      "index": 0,
      "message": {
        "content": " It's going well, thank you for asking! How about you?",
        "role": "assistant",
        "logprobs": null
      }
    }
  ],
  "id": "chatcmpl-e673ec8e-4e8f-4c9e-bf26-bf9fa7ee52b9",
  "created": 1695222060.917964,
  "model": "claude-instant-1.2",
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 9,
    "total_tokens": 23
  }
}, <ModelResponse chat.completion id=chatcmpl-ab6c5bd3-b5d9-4711-9697-e28d9fb8a53c at 0x103a62b60> JSON: {
  "object": "chat.completion",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": " It's going well, thank you for asking! How about you?",
        "role": "assistant",
        "logprobs": null
      }
    }
  ],
  "id": "chatcmpl-ab6c5bd3-b5d9-4711-9697-e28d9fb8a53c",
  "created": 1695222061.0445492,
  "model": "command-nightly",
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 14,
    "total_tokens": 20
  }
}, <OpenAIObject chat.completion id=chatcmpl-80szFnKHzCxObW0RqCMw1hWW1Icrq at 0x102dd6430> JSON: {
  "id": "chatcmpl-80szFnKHzCxObW0RqCMw1hWW1Icrq",
  "object": "chat.completion",
  "created": 1695222061,
  "model": "gpt-3.5-turbo-0613",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm an AI language model, so I don't have feelings, but I'm here to assist you with any questions or tasks you might have. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 39,
    "total_tokens": 52
  }
}]

```
