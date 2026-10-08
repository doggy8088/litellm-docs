# /rerank {#rerank}

:::tip

LiteLLM 遵循 [rerank API 的 cohere API 請求 / 回應](https://cohere.com/rerank)

:::

## 概觀 {#overview}

| 功能 | 支援                                                                                           | 備註 |
|---------|-----------------------------------------------------------------------------------------------------|-------|
| 成本追蹤 | ✅                                                                                                   | 適用於所有支援的模型 |
| 記錄 | ✅                                                                                                   | 適用於所有整合 |
| 終端使用者追蹤 | ✅                                                                                                   | |
| 備援 | ✅                                                                                                   | 可在支援的模型之間運作 |
| 負載平衡 | ✅                                                                                                   | 可在支援的模型之間運作 |
| 防護欄 | ✅                                                                                                   | 僅套用於輸入查詢（不包含文件） |
| 支援的提供者 | Cohere, Together AI, Azure AI, DeepInfra, Nvidia NIM, Infinity, Fireworks AI, Voyage AI, watsonx.ai | |

## **LiteLLM Python SDK 用法** {#litellm-python-sdk-usage}

### 快速開始  {#quick-start}

```python
from litellm import rerank
import os

os.environ["COHERE_API_KEY"] = "sk-.."

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="cohere/rerank-english-v3.0",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```

### 非同步用法  {#async-usage}

```python
from litellm import arerank
import os, asyncio

os.environ["COHERE_API_KEY"] = "sk-.."

async def test_async_rerank(): 
    query = "What is the capital of the United States?"
    documents = [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country.",
    ]

    response = await arerank(
        model="cohere/rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=3,
    )
    print(response)

asyncio.run(test_async_rerank())
```

## **LiteLLM Proxy 用法** {#litellm-proxy-usage}

LiteLLM 提供與 cohere API 相容的 `/rerank` 端點供 Rerank 呼叫使用。

**設定**

將以下內容新增至您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: Salesforce/Llama-Rank-V1
    litellm_params:
      model: together_ai/Salesforce/Llama-Rank-V1
      api_key: os.environ/TOGETHERAI_API_KEY
  - model_name: rerank-english-v3.0
    litellm_params:
      model: cohere/rerank-english-v3.0
      api_key: os.environ/COHERE_API_KEY
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
    "model": "rerank-english-v3.0",
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

## **支援的提供者** {#supported-providers}

#### ⚡️請參閱 [models.litellm.ai](https://models.litellm.ai/) 上所有支援的模型與提供者 {#️see-all-supported-models-and-providers-at-modelslitellmai}

| 提供者                 | 使用方式連結                                        |
|--------------------------|------------------------------------------------------|
| Cohere (v1 + v2 clients) | [使用方式](#quick-start)                                |
| Together AI              | [使用方式](../docs/providers/togetherai)                |  
| Azure AI                 | [使用方式](../docs/providers/azure_ai#rerank-endpoint)  |  
| Jina AI                  | [使用方式](../docs/providers/jina_ai)                   |  
| AWS Bedrock              | [使用方式](../docs/providers/bedrock#rerank-api)        |  
| HuggingFace              | [使用方式](../docs/providers/huggingface_rerank)        |  
| Infinity                 | [使用方式](../docs/providers/infinity)                  |  
| vLLM                     | [使用方式](/docs/providers/vllm#rerank)      |
| DeepInfra                | [使用方式](../docs/providers/deepinfra#rerank-endpoint) |
| Vertex AI                | [使用方式](../docs/providers/vertex#rerank-api)         |
| Fireworks AI             | [使用方式](/docs/providers/fireworks_ai#rerank) |
| Voyage AI                | [使用方式](../docs/providers/voyage#rerank)             |  
| IBM watsonx.ai           | [使用方式](../docs/providers/watsonx/rerank)            |
