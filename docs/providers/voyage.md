# Voyage AI {#voyage-ai}
https://docs.voyageai.com/embeddings/

## API 金鑰 {#api-key}
```python
# env variable
os.environ['VOYAGE_API_KEY']
```

## 範例用法 - Embedding {#sample-usage---embedding}
```python
from litellm import embedding
import os

os.environ['VOYAGE_API_KEY'] = ""
response = embedding(
    model="voyage/voyage-3.5",
    input=["good morning from litellm"],
)
print(response)
```

## 支援的參數 {#supported-parameters}

VoyageAI embeddings 支援以下可選參數：

- `input_type`：指定用於檢索最佳化的輸入類型
  - `"query"`：用於搜尋查詢
  - `"document"`：用於要建立索引的文件
- `dimensions`：輸出 embedding 維度（256、512、1024 或 2048）
- `encoding_format`：輸出格式（`"float"`、`"int8"`、`"uint8"`、`"binary"`、`"ubinary"`）
- `truncation`：是否將超過最大 token 數的輸入截斷（預設：`True`）

### 含參數的範例 {#example-with-parameters}

```python
from litellm import embedding
import os

os.environ['VOYAGE_API_KEY'] = "your-api-key"

# Embedding with custom dimensions and input type
response = embedding(
    model="voyage/voyage-3.5",
    input=["Your text here"],
    dimensions=512,
    input_type="document"
)
print(f"Embedding dimensions: {len(response.data[0]['embedding'])}")
```

## 支援的模型 {#supported-models}
此處列出的所有模型 https://docs.voyageai.com/embeddings/#models-and-specifics 都支援

| 模型名稱              | 函式呼叫                                              |
|-------------------------|------------------------------------------------------------|
| voyage-4-large          | `embedding(model="voyage/voyage-4-large", input)`          |
| voyage-4                | `embedding(model="voyage/voyage-4", input)`                |
| voyage-4-lite           | `embedding(model="voyage/voyage-4-lite", input)`           |
| voyage-code-4           | `embedding(model="voyage/voyage-code-4", input)`           |
| voyage-context-4        | `embedding(model="voyage/voyage-context-4", input)`        |
| voyage-context-3        | `embedding(model="voyage/voyage-context-3", input)`        |
| voyage-3.5              | `embedding(model="voyage/voyage-3.5", input)`              | 
| voyage-3.5-lite         | `embedding(model="voyage/voyage-3.5-lite", input)`         | 
| voyage-3-large          | `embedding(model="voyage/voyage-3-large", input)`          | 
| voyage-3                | `embedding(model="voyage/voyage-3", input)`                | 
| voyage-3-lite           | `embedding(model="voyage/voyage-3-lite", input)`           | 
| voyage-code-3           | `embedding(model="voyage/voyage-code-3", input)`           | 
| voyage-finance-2        | `embedding(model="voyage/voyage-finance-2", input)`        | 
| voyage-law-2            | `embedding(model="voyage/voyage-law-2", input)`            | 
| voyage-code-2           | `embedding(model="voyage/voyage-code-2", input)`           | 
| voyage-multilingual-2   | `embedding(model="voyage/voyage-multilingual-2", input)`   | 
| voyage-large-2-instruct | `embedding(model="voyage/voyage-large-2-instruct", input)` | 
| voyage-large-2          | `embedding(model="voyage/voyage-large-2", input)`          |
| voyage-2                | `embedding(model="voyage/voyage-2", input)`                | 
| voyage-lite-02-instruct | `embedding(model="voyage/voyage-lite-02-instruct", input)` | 
| voyage-01               | `embedding(model="voyage/voyage-01", input)`               | 
| voyage-lite-01          | `embedding(model="voyage/voyage-lite-01", input)`          |
| voyage-lite-01-instruct | `embedding(model="voyage/voyage-lite-01-instruct", input)` |

## 情境式嵌入（voyage-context-4, voyage-context-3） {#contextual-embeddings-voyage-context-4-voyage-context-3}

Voyage 的 `voyage-context-4` 和 `voyage-context-3` 模型會產生具情境化的區塊嵌入：每個區塊都會在知道其來源整份文件的情況下進行嵌入，因此在長文件上的擷取效果比只單獨嵌入區塊更好。LiteLLM 會將名稱中包含 `context` 的任何 Voyage 模型送至 Voyage 的 `/v1/contextualizedembeddings` 端點，因此相同的 `embedding()` 呼叫與 `/v1/embeddings` 代理路由都可運作；只有輸入與回應形狀與一般模型不同

### 輸入形狀 {#input-shapes}

平坦的字串清單，或單一字串，會將每個字串作為各自的文件進行嵌入。LiteLLM 會連同 `enable_auto_chunking: true`、`chunk_size: 32000` 與 `input_type: "document"` 一併轉送，因此最多 32,000 token 的字串會作為一個嵌入傳回，而更長的字串會在 Voyage 端被切分成最多 32,000 token 的區塊。傳送 `input_type: "query"` 會跳過這些預設值，並將每個字串作為搜尋查詢進行嵌入。您自行傳入的任何 `input_type`、`chunk_size` 或 `enable_auto_chunking` 都會取代預設值

```python
from litellm import embedding
import os

os.environ['VOYAGE_API_KEY'] = "your-api-key"

# Each string is embedded as its own document
response = embedding(
    model="voyage/voyage-context-4",
    input=["The quick brown fox", "jumps over the lazy dog"],
)
print(f"Documents embedded: {len(response.data)}")

# Search queries
response = embedding(
    model="voyage/voyage-context-4",
    input=["what does the fox do", "who is lazy"],
    input_type="query",
)
```

巢狀清單是預先切塊的形式：每個內層清單是一份您已經切成區塊的文件，而 LiteLLM 會保持原樣轉送

```python
# Single document with multiple chunks
response = embedding(
    model="voyage/voyage-context-4",
    input=[
        [
            "Chapter 1: Introduction to AI",
            "This chapter covers the basics of artificial intelligence.",
            "We will explore machine learning and deep learning."
        ]
    ]
)
print(f"Number of chunk groups: {len(response.data)}")

# Multiple documents
response = embedding(
    model="voyage/voyage-context-4",
    input=[
        ["Paris is the capital of France.", "It is known for the Eiffel Tower."],
        ["Tokyo is the capital of Japan.", "It is a major economic hub."]
    ]
)
print(f"Processed {len(response.data)} documents")
```

### 回應形狀 {#response-shape}

回應會保留 Voyage 的巢狀版面：`data` 對應每個輸入各有一個項目，而該項目的 `data` 則包含每個區塊的一個嵌入。`response.data[0]["data"][0]["embedding"]` 是第一個輸入的第一個區塊；在平坦輸入與預設區塊大小下，這就是整個字串

### LiteLLM Proxy {#litellm-proxy}

將模型加入 `config.yaml`：

```yaml
model_list:
  - model_name: voyage-context-4
    litellm_params:
      model: voyage/voyage-context-4
      api_key: os.environ/VOYAGE_API_KEY
```

平坦清單，每個字串一份文件：

```bash
curl http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "voyage-context-4",
    "input": ["The quick brown fox", "jumps over the lazy dog"]
  }'
```

平坦清單作為搜尋查詢：

```bash
curl http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "voyage-context-4",
    "input": ["what does the fox do", "who is lazy"],
    "input_type": "query"
  }'
```

巢狀清單，每份文件已切分為區塊：

```bash
curl http://localhost:4000/v1/embeddings \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "voyage-context-4",
    "input": [["The quick brown fox", "jumps over the lazy dog"]]
  }'
```

### 規格 {#specifications}

| 模型 | 最適合 | Context 長度 | 價格/百萬 Tokens |
|-------|----------|----------------|----------------|
| voyage-context-4 | 每個區塊 32,000 token；每個請求 120,000 token、1,000 個輸入、16,000 個區塊 | 256、512、1024（預設）、2048 | $0.12 |
| voyage-context-3 | 每個區塊 32,000 token；每個請求 120,000 token、1,000 個輸入、16,000 個區塊 | 256、512、1024（預設）、2048 | $0.18 |

限制以 Voyage 的為準，來自 [https://docs.voyageai.com/docs/contextualized-chunk-embeddings](https://docs.voyageai.com/docs/contextualized-chunk-embeddings)，而每個請求的 token 總數會計算呼叫中的每個區塊

### 何時使用情境式嵌入 {#when-to-use-contextual-embeddings}

當您將長文件切成區塊，且周遭文件應該影響每個區塊的嵌入時，請選用 `voyage-context-4`，因為結構、章節參照以及跨區塊依賴都很重要。對於彼此獨立的文字片段與短查詢，則請選用 `voyage-4-large`、`voyage-4` 或 `voyage-4-lite`；在這些情況下，文件情境無助於提升效果，而標準模型更便宜且更快

## 模型選擇指南 {#model-selection-guide}

| 模型 | 最適合用於 | Context 長度 | 價格/百萬 Tokens |
|-------|----------|----------------|----------------|
| voyage-4-large | 整體最佳且多語言品質最佳 | 32K | $0.12 |
| voyage-4 | 通用、多語言 | 32K | $0.06 |
| voyage-4-lite | 對延遲敏感的應用程式 | 32K | $0.02 |
| voyage-code-4 | 程式碼擷取與編碼代理程式 | 32K | $0.12 |
| voyage-context-4 | 情境式文件嵌入 | 每個區塊 32K，每個請求 120K | $0.12 |
| voyage-3.5 | 通用、多語言 | 32K | $0.06 |
| voyage-3.5-lite | 對延遲敏感的應用程式 | 32K | $0.02 |
| voyage-3-large | 整體品質最佳 | 32K | $0.18 |
| voyage-code-3 | 程式碼擷取與搜尋 | 32K | $0.18 |
| voyage-finance-2 | 金融文件 | 32K | $0.12 |
| voyage-law-2 | 法律文件 | 16K | $0.12 |
| voyage-context-3 | 情境式文件嵌入 | 每個區塊 32K，每個請求 120K | $0.18 |

## 重新排序 {#rerank}

Voyage AI 提供 reranking 模型，會根據文件與查詢的相關性重新排序文件，以提升搜尋相關性。

### 快速開始 {#quick-start}

```python
from litellm import rerank
import os

os.environ["VOYAGE_API_KEY"] = "your-api-key"

response = rerank(
    model="voyage/rerank-2.5",
    query="What is the capital of France?",
    documents=[
        "Paris is the capital of France.",
        "London is the capital of England.",
        "Berlin is the capital of Germany.",
    ],
    top_n=3,
)

print(response)
```

### 非同步用法 {#async-usage}

```python
from litellm import arerank
import os
import asyncio

os.environ["VOYAGE_API_KEY"] = "your-api-key"

async def main():
    response = await arerank(
        model="voyage/rerank-2.5-lite",
        query="Best programming language for beginners?",
        documents=[
            "Python is great for beginners due to simple syntax.",
            "JavaScript runs in browsers and is versatile.",
            "Rust has a steep learning curve but is very safe.",
        ],
        top_n=2,
    )
    print(response)

asyncio.run(main())
```

### LiteLLM Proxy 用法 {#litellm-proxy-usage}

新增到您的 `config.yaml`：

```yaml
model_list:
  - model_name: rerank-2.5
    litellm_params:
      model: voyage/rerank-2.5
      api_key: os.environ/VOYAGE_API_KEY
  - model_name: rerank-2.5-lite
    litellm_params:
      model: voyage/rerank-2.5-lite
      api_key: os.environ/VOYAGE_API_KEY
```

使用 curl 測試：

```bash
curl http://localhost:4000/rerank \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "rerank-2.5",
    "query": "What is the capital of France?",
    "documents": [
        "Paris is the capital of France.",
        "London is the capital of England.",
        "Berlin is the capital of Germany."
    ],
    "top_n": 3
  }'
```

### 支援的 Rerank 模型 {#supported-rerank-models}

| 模型 | 內容長度 | 說明 | 每百萬 Token 價格 |
|-------|----------------|-------------|----------------|
| rerank-2.5 | 32K | 品質最佳、多語言、遵循指令 | $0.05 |
| rerank-2.5-lite | 32K | 針對延遲與成本最佳化 | $0.02 |
| rerank-2 | 16K | 舊版模型 | $0.05 |
| rerank-2-lite | 8K | 舊版模型、更快 | $0.02 |

### 支援的參數 {#supported-parameters-1}

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `model` | string | 模型名稱（例如，`voyage/rerank-2.5`） |
| `query` | string | 搜尋查詢 |
| `documents` | list | 要重新排序的文件清單 |
| `top_n` | int | 要回傳的前幾個結果數量 |
| `return_documents` | bool | 是否在回應中包含文件文字 |
