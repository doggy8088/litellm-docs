import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Jina AI {#jina-ai}
https://jina.ai/embeddings/

支援的端點：
- /embeddings
- /rerank

## API 金鑰 {#api-key}
```python
# env variable
os.environ['JINA_AI_API_KEY']
```

## 範例用法 - Embedding {#sample-usage---embedding}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import embedding
import os

os.environ['JINA_AI_API_KEY'] = ""
response = embedding(
    model="jina_ai/jina-embeddings-v3",
    input=["good morning from litellm"],
)
print(response)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 新增至 config.yaml
```yaml
model_list:
  - model_name: embedding-model
    litellm_params:
      model: jina_ai/jina-embeddings-v3
      api_key: os.environ/JINA_AI_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000/
```

3. 測試它！ 

```bash 
curl -L -X POST 'http://0.0.0.0:4000/embeddings' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"input": ["hello world"], "model": "embedding-model"}'
```

</TabItem>
</Tabs>

## 範例用法 - Rerank {#sample-usage---rerank}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import rerank
import os

os.environ["JINA_AI_API_KEY"] = "sk-..."

query = "What is the capital of the United States?"
documents = [
    "Carson City is the capital city of the American state of Nevada.",
    "The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.",
    "Washington, D.C. is the capital of the United States.",
    "Capital punishment has existed in the United States since before it was a country.",
]

response = rerank(
    model="jina_ai/jina-reranker-v2-base-multilingual",
    query=query,
    documents=documents,
    top_n=3,
)
print(response)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

1. 新增至 config.yaml
```yaml
model_list:
  - model_name: rerank-model
    litellm_params:
      model: jina_ai/jina-reranker-v2-base-multilingual
      api_key: os.environ/JINA_AI_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```bash 
curl -L -X POST 'http://0.0.0.0:4000/rerank' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "model": "rerank-model",
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

## 支援的模型 {#supported-models}
此處列出的所有模型 https://jina.ai/embeddings/ 均受支援

## 支援的可選 rerank 參數 {#supported-optional-rerank-parameters}

支援所有 cohere rerank 參數。 

## 支援的可選 embeddings 參數 {#supported-optional-embeddings-parameters}

```
dimensions
```

## 提供者專屬參數 {#provider-specific-parameters}

將任何 jina ai 專屬參數作為關鍵字引數傳遞給 `embedding` 或 `rerank` 函式，例如

<Tabs>
<TabItem value="sdk" label="SDK">

```python
response = embedding(
    model="jina_ai/jina-embeddings-v3",
    input=["good morning from litellm"],
    dimensions=1536,
    my_custom_param="my_custom_value", # any other jina ai specific parameters
)
```
</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl -L -X POST 'http://0.0.0.0:4000/embeddings' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"input": ["good morning from litellm"], "model": "jina_ai/jina-embeddings-v3", "dimensions": 1536, "my_custom_param": "my_custom_value"}'
```

</TabItem>
</Tabs>
