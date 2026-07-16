import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# HuggingFace Rerank {#huggingface-rerank}

HuggingFace Rerank 讓您可以使用託管在 Hugging Face 基礎架構上的 reranking 模型，或使用自訂端點，根據文件與查詢的相關性重新排序文件。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | HuggingFace Rerank 可使用託管在 Hugging Face 基礎架構上的模型或自訂端點，對文件進行語意 reranking。 |
| LiteLLM 上的提供者路由 | 模型名稱中的 `huggingface/` |
| 提供者文件 | [Hugging Face Hub ↗](https://huggingface.co/models?pipeline_tag=sentence-similarity) |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Example using LiteLLM Python SDK"
import litellm
import os

# Set your HuggingFace token
os.environ["HF_TOKEN"] = "hf_xxxxxx"

# Basic rerank usage
response = litellm.rerank(
    model="huggingface/BAAI/bge-reranker-base",
    query="What is the capital of the United States?",
    documents=[
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country.",
    ],
    top_n=3,
)

print(response)
```

### 自訂端點用法 {#custom-endpoint-usage}

```python showLineNumbers title="Using custom HuggingFace endpoint"
import litellm

response = litellm.rerank(
    model="huggingface/BAAI/bge-reranker-base",
    query="hello",
    documents=["hello", "world"],
    top_n=2,
    api_base="https://my-custom-hf-endpoint.com",
    api_key="test_api_key",
)

print(response)
```

### 非同步用法 {#async-usage}

```python showLineNumbers title="Async rerank example"
import litellm
import asyncio
import os

os.environ["HF_TOKEN"] = "hf_xxxxxx"

async def async_rerank_example():
    response = await litellm.arerank(
        model="huggingface/BAAI/bge-reranker-base",
        query="What is the capital of the United States?",
        documents=[
            "Carson City is the capital city of the American state of Nevada.",
            "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
            "Washington, D.C. is the capital of the United States.",
            "Capital punishment has existed in the United States since before it was a country.",
        ],
        top_n=3,
    )
    print(response)

asyncio.run(async_rerank_example())
```

## LiteLLM Proxy {#litellm-proxy}

### 1. 在 config.yaml 中設定您的模型 {#1-configure-your-model-in-configyaml}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml
model_list:
  - model_name: bge-reranker-base
    litellm_params:
      model: huggingface/BAAI/bge-reranker-base
      api_key: os.environ/HF_TOKEN
  - model_name: bge-reranker-large  
    litellm_params:
      model: huggingface/BAAI/bge-reranker-large
      api_key: os.environ/HF_TOKEN
  - model_name: custom-reranker
    litellm_params:
      model: huggingface/BAAI/bge-reranker-base
      api_base: https://my-custom-hf-endpoint.com
      api_key: your-custom-api-key
```

</TabItem>
</Tabs>

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
export HF_TOKEN="hf_xxxxxx"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 發出 rerank 請求 {#3-make-rerank-requests}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/rerank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "bge-reranker-base",
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

<TabItem value="python-sdk" label="Python SDK">

```python
import litellm

# Initialize with your LiteLLM proxy URL
response = litellm.rerank(
    model="bge-reranker-base",
    query="What is the capital of the United States?",
    documents=[
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country.",
    ],
    top_n=3,
    api_base="http://localhost:4000",
    api_key="your-litellm-api-key"
)

print(response)
```

</TabItem>

<TabItem value="requests" label="使用 requests 函式庫">

```python
import requests

url = "http://localhost:4000/rerank"
headers = {
    "Authorization": "Bearer your-litellm-api-key",
    "Content-Type": "application/json"
}

data = {
    "model": "bge-reranker-base",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "top_n": 3
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

</TabItem>
</Tabs>

## 設定選項 {#configuration-options}

### 驗證 {#authentication}

#### 使用 HuggingFace Token（Serverless） {#using-huggingface-token-serverless}
```python
import os
os.environ["HF_TOKEN"] = "hf_xxxxxx"

# Or pass directly
litellm.rerank(
    model="huggingface/BAAI/bge-reranker-base",
    api_key="hf_xxxxxx",
    # ... other params
)
```

#### 使用自訂端點 {#using-custom-endpoint}
```python
litellm.rerank(
    model="huggingface/BAAI/bge-reranker-base",
    api_base="https://your-custom-endpoint.com",
    api_key="your-custom-key",
    # ... other params
)
```


## 回應格式 {#response-format}

回應遵循標準 rerank API 格式：

```json
{
  "results": [
    {
      "index": 3,
      "relevance_score": 0.999071
    },
    {
      "index": 4,
      "relevance_score": 0.7867867
    },
    {
      "index": 0,
      "relevance_score": 0.32713068
    }
  ],
  "id": "07734bd2-2473-4f07-94e1-0d9f0e6843cf",
  "meta": {
    "api_version": {
      "version": "2",
      "is_experimental": false
    },
    "billed_units": {
      "search_units": 1
    }
  }
}
```
