import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Infinity {#infinity}

| 屬性                  | 詳細資訊                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 說明               | Infinity 是一個高吞吐量、低延遲的 REST API，用於提供 text-embeddings、reranking models 和 clip |
| LiteLLM 提供者路由 | `infinity/`                                                                                                |
| 支援的操作      | `/rerank`, `/embeddings`                                                                                   |
| 提供者文件連結      | [Infinity ↗](https://github.com/michaelfeil/infinity)                                                      |

## **使用方式 - LiteLLM Python SDK** {#usage---litellm-python-sdk}

```python
from litellm import rerank, embedding
import os

os.environ["INFINITY_API_BASE"] = "http://localhost:8080"

response = rerank(
    model="infinity/rerank",
    query="What is the capital of France?",
    documents=["Paris", "London", "Berlin", "Madrid"],
)
```

## **使用方式 - LiteLLM Proxy** {#usage---litellm-proxy}

LiteLLM 提供與 cohere api 相容的 `/rerank` 端點，用於 Rerank 請求。

**設定**

將以下內容新增至您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: custom-infinity-rerank
    litellm_params:
      model: infinity/rerank
      api_base: https://localhost:8080
      api_key: os.environ/INFINITY_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

## 測試請求： {#test-request}

### 重新排序 {#rerank}

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "custom-infinity-rerank",
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

#### 支援的 Cohere Rerank API 參數 {#supported-cohere-rerank-api-params}

| Param              | 類型        | 說明                                     |
| ------------------ | ----------- | ----------------------------------------------- |
| `query`            | `str`       | 要據以重新排序文件的查詢               |
| `documents`        | `list[str]` | 要重新排序的文件                         |
| `top_n`            | `int`       | 要回傳的文件數量                           |
| `return_documents` | `bool`      | 是否在回應中回傳文件 |

### 使用方式 - 回傳文件 {#usage---return-documents}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = rerank(
    model="infinity/rerank",
    query="What is the capital of France?",
    documents=["Paris", "London", "Berlin", "Madrid"],
    return_documents=True,
)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "custom-infinity-rerank",
    "query": "What is the capital of France?",
    "documents": [
        "Paris",
        "London",
        "Berlin",
        "Madrid"
    ],
    "return_documents": True,
  }'
```

</TabItem>
</Tabs>

## 傳遞提供者專屬參數 {#pass-provider-specific-params}

任何未對應的參數都會原樣傳遞給提供者。

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["INFINITY_API_BASE"] = "http://localhost:8080"

response = rerank(
    model="infinity/rerank",
    query="What is the capital of France?",
    documents=["Paris", "London", "Berlin", "Madrid"],
    raw_scores=True, # 👈 PROVIDER-SPECIFIC PARAM
)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: custom-infinity-rerank
    litellm_params:
      model: infinity/rerank
      api_base: https://localhost:8080
      raw_scores: True # 👈 EITHER SET PROVIDER-SPECIFIC PARAMS HERE OR IN REQUEST BODY
```

2. 啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 進行測試！

```bash
curl http://0.0.0.0:4000/rerank \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "custom-infinity-rerank",
    "query": "What is the capital of the United States?",
    "documents": [
        "Carson City is the capital city of the American state of Nevada.",
        "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
        "Washington, D.C. is the capital of the United States.",
        "Capital punishment has existed in the United States since before it was a country."
    ],
    "raw_scores": True # 👈 PROVIDER-SPECIFIC PARAM
  }'
```

</TabItem>

</Tabs>

## 嵌入 {#embeddings}

LiteLLM 提供與 OpenAI api 相容的 `/embeddings` 端點，用於 embedding 請求。

**設定**

將以下內容新增至您的 litellm proxy config.yaml

```yaml
model_list:
  - model_name: custom-infinity-embedding
    litellm_params:
      model: infinity/provider/custom-embedding-v1
      api_base: http://localhost:8080
      api_key: os.environ/INFINITY_API_KEY
```

### 測試請求： {#test-request-1}

```bash
curl http://0.0.0.0:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "custom-infinity-embedding",
    "input": ["hello"]
  }'
```

#### 支援的 Embedding API 參數 {#supported-embedding-api-params}

| Param             | 類型        | 說明                                                 |
| ----------------- | ----------- | ----------------------------------------------------------- |
| `model`           | `str`       | 要使用的 embedding 模型                              |
| `input`           | `list[str]` | 要為其產生 embeddings 的文字輸入                  |
| `encoding_format` | `str`       | 回傳 embeddings 的格式（例如「float」、「base64」） |
| `modality`        | `str`       | 輸入類型（例如「text」、「image」、「audio」）           |

### 使用方式 - 基本範例 {#usage---basic-examples}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os

os.environ["INFINITY_API_BASE"] = "http://localhost:8080"

response = embedding(
    model="infinity/bge-small",
    input=["good morning from litellm"]
)

print(response.data[0]['embedding'])
```

</TabItem>

<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "custom-infinity-embedding",
    "input": ["hello"]
  }'
```

</TabItem>
</Tabs>

### 使用方式 - OpenAI Client {#usage---openai-client}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from openai import OpenAI

client = OpenAI(
  api_key="<LITELLM_MASTER_KEY>",
  base_url="<LITELLM_URL>"
)

response = client.embeddings.create(
  model="bge-small",
  input=["The food was delicious and the waiter..."],
  encoding_format="float"
)

print(response.data[0].embedding)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

```bash
curl http://0.0.0.0:4000/embeddings \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bge-small",
    "input": ["The food was delicious and the waiter..."],
    "encoding_format": "float"
  }'
```

</TabItem>

</Tabs>
