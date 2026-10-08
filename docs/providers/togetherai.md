import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Together AI {#together-ai}
LiteLLM 支援 Together AI 上的所有模型。 

## API 金鑰 {#api-keys}

```python 
import os 
os.environ["TOGETHERAI_API_KEY"] = "your-api-key"
```
## 範例用法 {#sample-usage}

```python
from litellm import completion 

os.environ["TOGETHERAI_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Write me a poem about the blue sky"}]

completion(model="together_ai/togethercomputer/Llama-2-7B-32K-Instruct", messages=messages)
```

## Together AI 模型 {#together-ai-models}
liteLLM 支援對 https://api.together.xyz/ 上的所有模型發出 `non-streaming` 和 `streaming` 請求

TogetherAI 使用範例 - 注意：liteLLM 支援 TogetherAI 上部署的所有模型

### Llama LLM - 聊天 {#llama-llms---chat}
| Model Name                        | Function Call                                                           | Required OS Variables              |
|-----------------------------------|-------------------------------------------------------------------------|------------------------------------|
| togethercomputer/llama-2-70b-chat | `completion('together_ai/togethercomputer/llama-2-70b-chat', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### Llama LLM - 語言 / 指令 {#llama-llms---language--instruct}
| Model Name                               | Function Call                                                                  | Required OS Variables              |
|------------------------------------------|--------------------------------------------------------------------------------|------------------------------------|
| togethercomputer/llama-2-70b             | `completion('together_ai/togethercomputer/llama-2-70b', messages)`             | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/LLaMA-2-7B-32K          | `completion('together_ai/togethercomputer/LLaMA-2-7B-32K', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/Llama-2-7B-32K-Instruct | `completion('together_ai/togethercomputer/Llama-2-7B-32K-Instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/llama-2-7b              | `completion('together_ai/togethercomputer/llama-2-7b', messages)`              | `os.environ['TOGETHERAI_API_KEY']` |

### Falcon LLM {#falcon-llms}
| Model Name                           | Function Call                                                              | Required OS Variables              |
|--------------------------------------|----------------------------------------------------------------------------|------------------------------------|
| togethercomputer/falcon-40b-instruct | `completion('together_ai/togethercomputer/falcon-40b-instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/falcon-7b-instruct  | `completion('together_ai/togethercomputer/falcon-7b-instruct', messages)`  | `os.environ['TOGETHERAI_API_KEY']` |

### Alpaca LLM {#alpaca-llms}
| Model Name                 | Function Call                                                    | Required OS Variables              |
|----------------------------|------------------------------------------------------------------|------------------------------------|
| togethercomputer/alpaca-7b | `completion('together_ai/togethercomputer/alpaca-7b', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### 其他聊天 LLM {#other-chat-llms}
| Model Name                   | Function Call                                                      | Required OS Variables              |
|------------------------------|--------------------------------------------------------------------|------------------------------------|
| HuggingFaceH4/starchat-alpha | `completion('together_ai/HuggingFaceH4/starchat-alpha', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### 程式碼 LLM {#code-llms}
| Model Name                              | Function Call                                                                 | Required OS Variables              |
|-----------------------------------------|-------------------------------------------------------------------------------|------------------------------------|
| togethercomputer/CodeLlama-34b          | `completion('together_ai/togethercomputer/CodeLlama-34b', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/CodeLlama-34b-Instruct | `completion('together_ai/togethercomputer/CodeLlama-34b-Instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/CodeLlama-34b-Python   | `completion('together_ai/togethercomputer/CodeLlama-34b-Python', messages)`   | `os.environ['TOGETHERAI_API_KEY']` |
| defog/sqlcoder                          | `completion('together_ai/defog/sqlcoder', messages)`                          | `os.environ['TOGETHERAI_API_KEY']` |
| NumbersStation/nsql-llama-2-7B          | `completion('together_ai/NumbersStation/nsql-llama-2-7B', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardCoder-15B-V1.0           | `completion('together_ai/WizardLM/WizardCoder-15B-V1.0', messages)`           | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardCoder-Python-34B-V1.0    | `completion('together_ai/WizardLM/WizardCoder-Python-34B-V1.0', messages)`    | `os.environ['TOGETHERAI_API_KEY']` |

### 語言 LLM {#language-llms}
| Model Name                          | Function Call                                                             | Required OS Variables              |
|-------------------------------------|---------------------------------------------------------------------------|------------------------------------|
| NousResearch/Nous-Hermes-Llama2-13b | `completion('together_ai/NousResearch/Nous-Hermes-Llama2-13b', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| Austism/chronos-hermes-13b          | `completion('together_ai/Austism/chronos-hermes-13b', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| upstage/SOLAR-0-70b-16bit           | `completion('together_ai/upstage/SOLAR-0-70b-16bit', messages)`           | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardLM-70B-V1.0          | `completion('together_ai/WizardLM/WizardLM-70B-V1.0', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |

## 提示範本 {#prompt-templates}

使用 Together AI 的聊天模型及其自己的 prompt 格式？

### 使用 Llama2 Instruct 模型 {#using-llama2-instruct-models}
如果您使用 Together AI 的 Llama2 變體（`model=togethercomputer/llama-2..-instruct`），LiteLLM 可以自動在 OpenAI prompt 格式與 TogetherAI 的 Llama2 格式（`[INST]..[/INST]`）之間轉換。 

```python
from litellm import completion 

# set env variable 
os.environ["TOGETHERAI_API_KEY"] = ""

messages = [{"role": "user", "content": "Write me a poem about the blue sky"}]

completion(model="together_ai/togethercomputer/Llama-2-7B-32K-Instruct", messages=messages)
```

### 使用其他模型 {#using-another-model}

您可以在 LiteLLM 上建立自訂 prompt 範本（我們也 [歡迎 PR](https://github.com/BerriAI/litellm) 將它們加入主倉庫 🤗）

讓我們為 `OpenAssistant/llama2-70b-oasst-sft-v10` 做一個！

可接受的範本格式是：[參考](https://huggingface.co/OpenAssistant/llama2-70b-oasst-sft-v10-)
```
"""
<|im_start|>system
{system_message}<|im_end|>
<|im_start|>user
{prompt}<|im_end|>
<|im_start|>assistant
"""
```

讓我們註冊自訂 prompt 範本：[實作程式碼](https://github.com/BerriAI/litellm/blob/64f3d3c56ef02ac5544983efc78293de31c1c201/litellm/llms/prompt_templates/factory.py#L77)
```python
import litellm 

litellm.register_prompt_template(
	    model="OpenAssistant/llama2-70b-oasst-sft-v10",
	    roles={
            "system": {
                "pre_message": "[<|im_start|>system",
                "post_message": "\n"
            },
            "user": {
                "pre_message": "<|im_start|>user",
                "post_message": "\n"
            }, 
            "assistant": {
                "pre_message": "<|im_start|>assistant",
                "post_message": "\n"
            }
        }
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
	    roles={
            "system": {
                "pre_message": "[<|im_start|>system",
                "post_message": "\n"
            },
            "user": {
                "pre_message": "<|im_start|>user",
                "post_message": "\n"
            }, 
            "assistant": {
                "pre_message": "<|im_start|>assistant",
                "post_message": "\n"
            }
        }
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


## 透過 `chat_template_kwargs` 進行推理控制 {#reasoning-controls-via-chat_template_kwargs}

Together 透過請求層級的 `chat_template_kwargs` 物件來引導其推理模型（[Together 文件](https://docs.together.ai/docs/deepseek-v3-1#hybrid-reasoning-model)）。LiteLLM 會在 SDK 與每個 proxy 端點（`/v1/chat/completions`、`/v1/messages`、`/v1/responses`）原封不動地傳遞它，包含串流，因此 Together 文件為您的模型所記載的任何 key 都可直接使用。Together 會在伺服器端驗證這些 keys，並靜默忽略模型不支援的項目。

### 切換混合模型上的思考 {#toggling-thinking-on-hybrid-models}

混合推理模型（例如 `Qwen/Qwen3.5-9B`）預設會思考；`{"thinking": false}` 會將其關閉。

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK 用法">

```python
from litellm import completion
import os

os.environ["TOGETHERAI_API_KEY"] = "your-api-key"

response = completion(
    model="together_ai/Qwen/Qwen3.5-9B",
    messages=[{"role": "user", "content": "What is 17*23? Answer with just the number."}],
    chat_template_kwargs={"thinking": False},
)
print(response.choices[0].message.content)  # direct answer, no reasoning_content
```
</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy 用法">

```bash
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3.5-9B",
    "messages": [{"role": "user", "content": "What is 17*23? Answer with just the number."}],
    "chat_template_kwargs": {"thinking": false}
  }'
```

</TabItem>
</Tabs>

### 跨回合保留思考 {#preserved-thinking-across-turns}

像 `zai-org/GLM-5.2` 這類模型會預設從 prompt 中清除前一輪的推理。傳送 `{"clear_thinking": false}` 可保留它，前提是您在重播每個 assistant 回合時，將其 `reasoning_content` 與其 `content` 一起原封不動地傳回。LiteLLM 會將重播的 `reasoning_content` 轉送給 Together，並從外送請求中移除自身的記錄欄位（`thinking_blocks`、`provider_specific_fields`），因此逐字重播 LiteLLM 回應物件是安全的。

```python
from litellm import completion
import os

os.environ["TOGETHERAI_API_KEY"] = "your-api-key"

first = completion(
    model="together_ai/zai-org/GLM-5.2",
    messages=[{"role": "user", "content": "Pick a secret two-digit number. Reply with only the sum of its digits."}],
)

followup = completion(
    model="together_ai/zai-org/GLM-5.2",
    messages=[
        {"role": "user", "content": "Pick a secret two-digit number. Reply with only the sum of its digits."},
        {
            "role": "assistant",
            "content": first.choices[0].message.content,
            "reasoning_content": first.choices[0].message.reasoning_content,
        },
        {"role": "user", "content": "What was the secret number? Reply with only the number."},
    ],
    chat_template_kwargs={"clear_thinking": False},
)
print(followup.choices[0].message.content)  # recalls the number from the replayed reasoning
```

指向 proxy 的 `/v1/messages` 端點的 Anthropic-SDK 用戶端，可透過重播 assistant 的 `thinking` 區塊，並在請求頂層傳入 `chat_template_kwargs: {"clear_thinking": false}`，來獲得相同的行為。

## 重新排序 {#rerank}

### 用量 {#usage}

<Tabs>
<TabItem value="sdk" label="LiteLLM SDK 用法">

```python
from litellm import rerank
import os

os.environ["TOGETHERAI_API_KEY"] = "sk-.."

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="together_ai/rerank-english-v3.0",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```
</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy 用法">

LiteLLM 提供一個與 cohere api 相容的 `/rerank` 端點，供 Rerank 呼叫使用。

**設定**

將以下內容新增至您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: Salesforce/Llama-Rank-V1
    litellm_params:
      model: together_ai/Salesforce/Llama-Rank-V1
      api_key: os.environ/TOGETHERAI_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

測試請求

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Salesforce/Llama-Rank-V1",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3
  }'
```

</TabItem>
</Tabs>
