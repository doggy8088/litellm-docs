import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DeepInfra {#deepinfra}
https://deepinfra.com/

:::tip

**我們支援所有 DeepInfra 模型，只要在傳送 litellm 請求時將 `model=deepinfra/<any-model-on-deepinfra>` 設為前綴即可**

:::

## 目錄 {#table-of-contents}

- [API 金鑰](#api-key)
- [聊天模型](#chat-models)
- [重新排序端點](#rerank-endpoint)

## API 金鑰 {#api-key}
```python
# env variable
os.environ['DEEPINFRA_API_KEY']
```

## 使用範例 {#sample-usage}
```python
from litellm import completion
import os

os.environ['DEEPINFRA_API_KEY'] = ""
response = completion(
    model="deepinfra/meta-llama/Llama-2-70b-chat-hf", 
    messages=[{"role": "user", "content": "write code for saying hi from LiteLLM"}]
)
```

## 使用範例 - 串流 {#sample-usage---streaming}
```python
from litellm import completion
import os

os.environ['DEEPINFRA_API_KEY'] = ""
response = completion(
    model="deepinfra/meta-llama/Llama-2-70b-chat-hf", 
    messages=[{"role": "user", "content": "write code for saying hi from LiteLLM"}],
    stream=True
)

for chunk in response:
    print(chunk)
```

## 聊天模型 {#chat-models}
| 模型名稱       | 函式呼叫                        |
|------------------|--------------------------------------|
| meta-llama/Meta-Llama-3-8B-Instruct  | `completion(model="deepinfra/meta-llama/Meta-Llama-3-8B-Instruct", messages)` | 
| meta-llama/Meta-Llama-3-70B-Instruct  | `completion(model="deepinfra/meta-llama/Meta-Llama-3-70B-Instruct", messages)` | 
| meta-llama/Llama-2-70b-chat-hf  | `completion(model="deepinfra/meta-llama/Llama-2-70b-chat-hf", messages)` | 
| meta-llama/Llama-2-7b-chat-hf  | `completion(model="deepinfra/meta-llama/Llama-2-7b-chat-hf", messages)` | 
| meta-llama/Llama-2-13b-chat-hf | `completion(model="deepinfra/meta-llama/Llama-2-13b-chat-hf", messages)` | 
| codellama/CodeLlama-34b-Instruct-hf | `completion(model="deepinfra/codellama/CodeLlama-34b-Instruct-hf", messages)` |
| mistralai/Mistral-7B-Instruct-v0.1 | `completion(model="deepinfra/mistralai/Mistral-7B-Instruct-v0.1", messages)` | 
| jondurbin/airoboros-l2-70b-gpt4-1.4.1 | `completion(model="deepinfra/jondurbin/airoboros-l2-70b-gpt4-1.4.1", messages)` |

## 重新排序端點 {#rerank-endpoint}

LiteLLM 提供與 Cohere API 相容的 `/rerank` 端點，供 DeepInfra 重新排序模型使用。

### 支援的重新排序模型 {#supported-rerank-models}

| 模型名稱 | 說明 |
|------------|-------------|
| `deepinfra/Qwen/Qwen3-Reranker-0.6B` | 輕量級重新排序模型（0.6B 參數） |
| `deepinfra/Qwen/Qwen3-Reranker-4B` | 中型重新排序模型（4B 參數） |
| `deepinfra/Qwen/Qwen3-Reranker-8B` | 大型重新排序模型（8B 參數） |

### 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["DEEPINFRA_API_KEY"] = "your-api-key"

response = rerank(
    model="deepinfra/Qwen/Qwen3-Reranker-0.6B",
    query="What is the capital of France?",
    documents=[
        "Paris is the capital of France.",
        "London is the capital of the United Kingdom.",
        "Berlin is the capital of Germany.",
        "Madrid is the capital of Spain.",
        "Rome is the capital of Italy."
    ]
)
print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

1. 新增至 config.yaml
```yaml
model_list:
  - model_name: Qwen/Qwen3-Reranker-0.6B
    litellm_params:
      model: deepinfra/Qwen/Qwen3-Reranker-0.6B
      api_key: os.environ/DEEPINFRA_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000/
```

3. 測試它！ 

```bash 
curl -L -X POST 'http://0.0.0.0:4000/rerank' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "model": "Qwen/Qwen3-Reranker-0.6B",
    "query": "What is the capital of France?",
    "documents": [
        "Paris is the capital of France.",
        "London is the capital of the United Kingdom.",
        "Berlin is the capital of Germany.",
        "Madrid is the capital of Spain.",
        "Rome is the capital of Italy."
    ]
}'
```

</TabItem>
</Tabs>

### 支援的 Cohere 重新排序 API 參數 {#supported-cohere-rerank-api-params}

| 參數              | 類型        | 說明                                     |
| ------------------ | ----------- | ----------------------------------------------- |
| `query`            | `str`       | 用於對文件進行重新排序的查詢       |
| `documents`        | `list[str]` | 要重新排序的文件                         |

### 提供者特定參數 {#provider-specific-parameters}
請將任何 deepinfra 特定參數作為關鍵字引數傳遞給 rerank 函式，例如：

```
response = rerank(
    model="deepinfra/Qwen/Qwen3-Reranker-0.6B",
    query="What is the capital of France?",
    documents=[
        "Paris is the capital of France.",
        "London is the capital of the United Kingdom.",
        "Berlin is the capital of Germany.",
        "Madrid is the capital of Spain.",
        "Rome is the capital of Italy."
    ],
    my_custom_param="my_custom_value", # any other deepinfra specific parameters
)
```

### 回應格式 {#response-format}

```json
{
  "id": "request-id",
  "results": [
    {
      "index": 0,
      "relevance_score": 0.9975274205207825
    },
    {
      "index": 1,
      "relevance_score": 0.011687257327139378
    }
  ],
  "meta": {
    "billed_units": {
      "total_tokens": 427
    },
    "tokens": {
      "input_tokens": 427,
      "output_tokens": 0
    }
  }
}
```
