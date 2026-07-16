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
liteLLM 支援對 https://api.together.xyz/ 上所有模型的 `non-streaming` 與 `streaming` 請求

TogetherAI 用法範例 - 注意：liteLLM 支援在 TogetherAI 上部署的所有模型

### Llama LLMs - 聊天 {#llama-llms---chat}
| 模型名稱                        | 函式呼叫                                                           | 必要的作業系統環境變數              |
|-----------------------------------|-------------------------------------------------------------------------|------------------------------------|
| togethercomputer/llama-2-70b-chat | `completion('together_ai/togethercomputer/llama-2-70b-chat', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### Llama LLMs - 語言 / Instruct {#llama-llms---language--instruct}
| 模型名稱                               | 函式呼叫                                                                  | 必要的作業系統環境變數              |
|------------------------------------------|--------------------------------------------------------------------------------|------------------------------------|
| togethercomputer/llama-2-70b             | `completion('together_ai/togethercomputer/llama-2-70b', messages)`             | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/LLaMA-2-7B-32K          | `completion('together_ai/togethercomputer/LLaMA-2-7B-32K', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/Llama-2-7B-32K-Instruct | `completion('together_ai/togethercomputer/Llama-2-7B-32K-Instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/llama-2-7b              | `completion('together_ai/togethercomputer/llama-2-7b', messages)`              | `os.environ['TOGETHERAI_API_KEY']` |

### Falcon LLMs {#falcon-llms}
| 模型名稱                           | 函式呼叫                                                              | 必要的作業系統環境變數              |
|--------------------------------------|----------------------------------------------------------------------------|------------------------------------|
| togethercomputer/falcon-40b-instruct | `completion('together_ai/togethercomputer/falcon-40b-instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/falcon-7b-instruct  | `completion('together_ai/togethercomputer/falcon-7b-instruct', messages)`  | `os.environ['TOGETHERAI_API_KEY']` |

### Alpaca LLMs {#alpaca-llms}
| 模型名稱                 | 函式呼叫                                                    | 必要的作業系統環境變數              |
|----------------------------|------------------------------------------------------------------|------------------------------------|
| togethercomputer/alpaca-7b | `completion('together_ai/togethercomputer/alpaca-7b', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### 其他聊天 LLMs {#other-chat-llms}
| 模型名稱                   | 函式呼叫                                                      | 必要的作業系統環境變數              |
|------------------------------|--------------------------------------------------------------------|------------------------------------|
| HuggingFaceH4/starchat-alpha | `completion('together_ai/HuggingFaceH4/starchat-alpha', messages)` | `os.environ['TOGETHERAI_API_KEY']` |

### 程式碼 LLMs {#code-llms}
| 模型名稱                              | 函式呼叫                                                                 | 必要的作業系統環境變數              |
|-----------------------------------------|-------------------------------------------------------------------------------|------------------------------------|
| togethercomputer/CodeLlama-34b          | `completion('together_ai/togethercomputer/CodeLlama-34b', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/CodeLlama-34b-Instruct | `completion('together_ai/togethercomputer/CodeLlama-34b-Instruct', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| togethercomputer/CodeLlama-34b-Python   | `completion('together_ai/togethercomputer/CodeLlama-34b-Python', messages)`   | `os.environ['TOGETHERAI_API_KEY']` |
| defog/sqlcoder                          | `completion('together_ai/defog/sqlcoder', messages)`                          | `os.environ['TOGETHERAI_API_KEY']` |
| NumbersStation/nsql-llama-2-7B          | `completion('together_ai/NumbersStation/nsql-llama-2-7B', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardCoder-15B-V1.0           | `completion('together_ai/WizardLM/WizardCoder-15B-V1.0', messages)`           | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardCoder-Python-34B-V1.0    | `completion('together_ai/WizardLM/WizardCoder-Python-34B-V1.0', messages)`    | `os.environ['TOGETHERAI_API_KEY']` |

### 語言 LLMs {#language-llms}
| 模型名稱                          | 函式呼叫                                                             | 必要的作業系統環境變數              |
|-------------------------------------|---------------------------------------------------------------------------|------------------------------------|
| NousResearch/Nous-Hermes-Llama2-13b | `completion('together_ai/NousResearch/Nous-Hermes-Llama2-13b', messages)` | `os.environ['TOGETHERAI_API_KEY']` |
| Austism/chronos-hermes-13b          | `completion('together_ai/Austism/chronos-hermes-13b', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |
| upstage/SOLAR-0-70b-16bit           | `completion('together_ai/upstage/SOLAR-0-70b-16bit', messages)`           | `os.environ['TOGETHERAI_API_KEY']` |
| WizardLM/WizardLM-70B-V1.0          | `completion('together_ai/WizardLM/WizardLM-70B-V1.0', messages)`          | `os.environ['TOGETHERAI_API_KEY']` |

## Prompt 範本 {#prompt-templates}

使用 Together AI 上具有自身提示格式的聊天模型？

### 使用 Llama2 Instruct 模型 {#using-llama2-instruct-models}
如果您正在使用 Together AI 的 Llama2 變體（`model=togethercomputer/llama-2..-instruct`），LiteLLM 可以自動在 OpenAI 提示格式與 TogetherAI 的 Llama2 格式（`[INST]..[/INST]`）之間進行轉換。 

```python
from litellm import completion 

# set env variable 
os.environ["TOGETHERAI_API_KEY"] = ""

messages = [{"role": "user", "content": "Write me a poem about the blue sky"}]

completion(model="together_ai/togethercomputer/Llama-2-7B-32K-Instruct", messages=messages)
```

### 使用另一個模型 {#using-another-model}

您可以在 LiteLLM 上建立自訂提示範本（我們也 [歡迎 PR](https://github.com/BerriAI/litellm) 將它們加入主要 repo 🤗）

讓我們為 `OpenAssistant/llama2-70b-oasst-sft-v10` 建立一個！

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

讓我們註冊我們的自訂提示範本：[實作程式碼](https://github.com/BerriAI/litellm/blob/64f3d3c56ef02ac5544983efc78293de31c1c201/litellm/llms/prompt_templates/factory.py#L77)
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

讓我們使用它！ 

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


## Rerank {#rerank}

### 用法 {#usage}

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

LiteLLM 提供一個與 cohere api 相容的 `/rerank` 端點，用於 Rerank 請求。

**設定**

將這個加入您的 litellm proxy config.yaml

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
  -H "Authorization: Bearer sk-1234" \
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
