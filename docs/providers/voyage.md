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
| voyage-3.5              | `embedding(model="voyage/voyage-3.5", input)`              | 
| voyage-3.5-lite         | `embedding(model="voyage/voyage-3.5-lite", input)`         | 
| voyage-3-large          | `embedding(model="voyage/voyage-3-large", input)`          | 
| voyage-3                | `embedding(model="voyage/voyage-3", input)`                | 
| voyage-3-lite           | `embedding(model="voyage/voyage-3-lite", input)`           | 
| voyage-code-3           | `embedding(model="voyage/voyage-code-3", input)`           | 
| voyage-finance-2        | `embedding(model="voyage/voyage-finance-2", input)`        | 
| voyage-law-2            | `embedding(model="voyage/voyage-law-2", input)`            | 
| voyage-code-2           | `embedding(model="voyage/voyage-code-2", input)`           | 
| voyage-multilingual-2   | `embedding(model="voyage/voyage-multilingual-2	", input)`  | 
| voyage-large-2-instruct | `embedding(model="voyage/voyage-large-2-instruct", input)` | 
| voyage-large-2          | `embedding(model="voyage/voyage-large-2", input)`          |
| voyage-2                | `embedding(model="voyage/voyage-2", input)`                | 
| voyage-lite-02-instruct | `embedding(model="voyage/voyage-lite-02-instruct", input)` | 
| voyage-01               | `embedding(model="voyage/voyage-01", input)`               | 
| voyage-lite-01          | `embedding(model="voyage/voyage-lite-01", input)`          |
| voyage-lite-01-instruct | `embedding(model="voyage/voyage-lite-01-instruct", input)` |

## 情境式 Embedding（voyage-context-3） {#contextual-embeddings-voyage-context-3}

VoyageAI 的 `voyage-context-3` 模型提供具情境的區塊 embeddings，其中每個區塊都會在了解其周圍文件內容的情況下進行 embedding。與標準、無情境感知的 embeddings 相比，這可大幅提升檢索品質。

### 主要優點 {#key-benefits}
- 區塊能理解其在整份文件中的位置與角色
- 長文件的檢索準確度更高（比競爭對手高出 7-23%）
- 對含糊引用與跨區塊相依性的處理更好
- 可無縫直接替換 RAG 管線中的標準 embeddings

### 用法 {#usage}

情境式 embeddings 需要**巢狀輸入格式**，其中每個內層清單代表來自單一文件的區塊：

```python
from litellm import embedding
import os

os.environ['VOYAGE_API_KEY'] = "your-api-key"

# Single document with multiple chunks
response = embedding(
    model="voyage/voyage-context-3",
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
    model="voyage/voyage-context-3",
    input=[
        ["Paris is the capital of France.", "It is known for the Eiffel Tower."],
        ["Tokyo is the capital of Japan.", "It is a major economic hub."]
    ]
)
print(f"Processed {len(response.data)} documents")
```

### 規格 {#specifications}
- 模型：`voyage-context-3`
- 內容長度：每份文件 32,000 個 token
- 輸出維度：256、512、1024（預設）或 2048
- 每次請求最多輸入：1,000
- token 總數上限：120,000
- 區塊數上限：16,000
- 定價：每百萬 token 0.18 美元

### 何時使用情境式 Embeddings {#when-to-use-contextual-embeddings}

**在以下情況使用 `voyage-context-3`：**
- 處理拆分成多個區塊的長文件
- 文件結構與流程很重要
- 各區段之間的引用很重要
- 您需要保留文件階層

**在以下情況使用標準模型（voyage-3.5、voyage-3-large）：**
- 將彼此獨立的文字片段進行 embedding
- 處理短查詢
- 文件內容脈絡不相關
- 您需要更快／更便宜的處理

## 模型選擇指南 {#model-selection-guide}

| 模型 | 最適合 | 內容長度 | 每百萬 Token 價格 |
|-------|----------|----------------|----------------|
| voyage-3.5 | 通用、多語言 | 32K | $0.06 |
| voyage-3.5-lite | 對延遲敏感的應用程式 | 32K | $0.02 |
| voyage-3-large | 整體品質最佳 | 32K | $0.18 |
| voyage-code-3 | 程式碼檢索與搜尋 | 32K | $0.18 |
| voyage-finance-2 | 金融文件 | 32K | $0.12 |
| voyage-law-2 | 法律文件 | 16K | $0.12 |
| voyage-context-3 | 情境式文件 embeddings | 32K | $0.18 |

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
  -H "Authorization: Bearer sk-1234" \
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
