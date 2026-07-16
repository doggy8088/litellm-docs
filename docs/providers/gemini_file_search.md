import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Gemini 檔案搜尋 {#gemini-file-search}

使用 Google Gemini 的檔案搜尋搭配 LiteLLM 進行檢索增強生成（RAG）。

Gemini File Search 會匯入、分塊並建立資料索引，以便根據使用者提示詞快速檢索相關資訊。接著，這些資訊會作為上下文提供給模型，以獲得更準確且更相關的回答。

[官方 Gemini File Search 文件](https://ai.google.dev/gemini-api/docs/file-search)

## 功能 {#features}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ❌ | 尚未實作成本計算 |
| 記錄 | ✅ | 完整請求/回應記錄 |
| RAG 擷取 API | ✅ | 上傳 → 分塊 → 嵌入 → 儲存 |
| 向量儲存區搜尋 | ✅ | 使用中繼資料篩選條件搜尋 |
| 自訂分塊 | ✅ | 設定分塊大小與重疊 |
| 中繼資料篩選 | ✅ | 依自訂中繼資料篩選 |
| 引用 | ✅ | 從 grounding 中繼資料擷取 |

## 快速開始 {#quick-start}

### 設定 {#setup}

設定您的 Gemini API 金鑰：

```bash
export GEMINI_API_KEY="your-api-key"
# or
export GOOGLE_API_KEY="your-api-key"
```

### 基本 RAG 擷取 {#basic-rag-ingest}

<Tabs>
<TabItem value="python" label="Python SDK">

```python
import litellm

# Ingest a document
response = await litellm.aingest(
    ingest_options={
        "name": "my-document-store",
        "vector_store": {
            "custom_llm_provider": "gemini"
        }
    },
    file_data=("document.txt", b"Your document content", "text/plain")
)

print(f"Vector Store ID: {response['vector_store_id']}")
print(f"File ID: {response['file_id']}")
```

</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy">

```bash
curl -X POST "http://localhost:4000/v1/rag/ingest" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "file": {
      "filename": "document.txt",
      "content": "'$(base64 -i document.txt)'",
      "content_type": "text/plain"
    },
    "ingest_options": {
      "name": "my-document-store",
      "vector_store": {
        "custom_llm_provider": "gemini"
      }
    }
  }'
```

</TabItem>
</Tabs>

### 搜尋向量儲存區 {#search-vector-store}

<Tabs>
<TabItem value="python" label="Python SDK">

```python
import litellm

# Search the vector store
response = await litellm.vector_stores.asearch(
    vector_store_id="fileSearchStores/your-store-id",
    query="What is the main topic?",
    custom_llm_provider="gemini",
    max_num_results=5
)

for result in response["data"]:
    print(f"Score: {result.get('score')}")
    print(f"Content: {result['content'][0]['text']}")
```

</TabItem>

<TabItem value="proxy" label="LiteLLM Proxy">

```bash
curl -X POST "http://localhost:4000/v1/vector_stores/fileSearchStores/your-store-id/search" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the main topic?",
    "custom_llm_provider": "gemini",
    "max_num_results": 5
  }'
```

</TabItem>
</Tabs>

## 進階功能 {#advanced-features}

### 自訂分塊設定 {#custom-chunking-configuration}

控制文件如何被切分成分塊：

```python
import litellm

response = await litellm.aingest(
    ingest_options={
        "name": "custom-chunking-store",
        "vector_store": {
            "custom_llm_provider": "gemini"
        },
        "chunking_strategy": {
            "white_space_config": {
                "max_tokens_per_chunk": 200,
                "max_overlap_tokens": 20
            }
        }
    },
    file_data=("document.txt", document_content, "text/plain")
)
```

**分塊參數：**
- `max_tokens_per_chunk`：每個分塊的最大 token 數（預設：800，最小：100，最大：4096）
- `max_overlap_tokens`：分塊之間的重疊（預設：400）

### 中繼資料篩選 {#metadata-filtering}

將自訂中繼資料附加到檔案並篩選搜尋：

#### 在擷取期間附加中繼資料 {#attach-metadata-during-ingest}

```python
import litellm

response = await litellm.aingest(
    ingest_options={
        "name": "metadata-store",
        "vector_store": {
            "custom_llm_provider": "gemini",
            "custom_metadata": [
                {"key": "author", "string_value": "John Doe"},
                {"key": "year", "numeric_value": 2024},
                {"key": "category", "string_value": "documentation"}
            ]
        }
    },
    file_data=("document.txt", document_content, "text/plain")
)
```

#### 使用中繼資料篩選條件搜尋 {#search-with-metadata-filter}

```python
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="fileSearchStores/your-store-id",
    query="What is LiteLLM?",
    custom_llm_provider="gemini",
    filters={"author": "John Doe", "category": "documentation"}
)
```

**篩選語法：**
- 簡單相等：`{"key": "value"}`
- Gemini 轉換為：`key="value"`
- 可用 AND 組合多個篩選條件

### 使用既有向量儲存區 {#using-existing-vector-store}

擷取到既有的 File Search 儲存區：

```python
import litellm

# First, create a store
create_response = await litellm.vector_stores.acreate(
    name="My Persistent Store",
    custom_llm_provider="gemini"
)
store_id = create_response["id"]

# Then ingest multiple documents into it
for doc in documents:
    await litellm.aingest(
        ingest_options={
            "vector_store": {
                "custom_llm_provider": "gemini",
                "vector_store_id": store_id  # Reuse existing store
            }
        },
        file_data=(doc["name"], doc["content"], doc["type"])
    )
```

### 引用擷取 {#citation-extraction}

Gemini 會提供包含引用的 grounding 中繼資料：

```python
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="fileSearchStores/your-store-id",
    query="Explain the concept",
    custom_llm_provider="gemini"
)

for result in response["data"]:
    # Access citation information
    if "attributes" in result:
        print(f"URI: {result['attributes'].get('uri')}")
        print(f"Title: {result['attributes'].get('title')}")
    
    # Content with relevance score
    print(f"Score: {result.get('score')}")
    print(f"Text: {result['content'][0]['text']}")
```

## 完整範例 {#complete-example}

端到端工作流程：

```python
import litellm

# 1. Create a File Search store
store_response = await litellm.vector_stores.acreate(
    name="Knowledge Base",
    custom_llm_provider="gemini"
)
store_id = store_response["id"]
print(f"Created store: {store_id}")

# 2. Ingest documents with custom chunking and metadata
documents = [
    {
        "name": "intro.txt",
        "content": b"Introduction to LiteLLM...",
        "metadata": [
            {"key": "section", "string_value": "intro"},
            {"key": "priority", "numeric_value": 1}
        ]
    },
    {
        "name": "advanced.txt",
        "content": b"Advanced features...",
        "metadata": [
            {"key": "section", "string_value": "advanced"},
            {"key": "priority", "numeric_value": 2}
        ]
    }
]

for doc in documents:
    ingest_response = await litellm.aingest(
        ingest_options={
            "name": f"ingest-{doc['name']}",
            "vector_store": {
                "custom_llm_provider": "gemini",
                "vector_store_id": store_id,
                "custom_metadata": doc["metadata"]
            },
            "chunking_strategy": {
                "white_space_config": {
                    "max_tokens_per_chunk": 300,
                    "max_overlap_tokens": 50
                }
            }
        },
        file_data=(doc["name"], doc["content"], "text/plain")
    )
    print(f"Ingested: {doc['name']}")

# 3. Search with filters
search_response = await litellm.vector_stores.asearch(
    vector_store_id=store_id,
    query="How do I get started?",
    custom_llm_provider="gemini",
    filters={"section": "intro"},
    max_num_results=3
)

# 4. Process results
for i, result in enumerate(search_response["data"]):
    print(f"\nResult {i+1}:")
    print(f"  Score: {result.get('score')}")
    print(f"  File: {result.get('filename')}")
    print(f"  Content: {result['content'][0]['text'][:100]}...")
```

## 支援的檔案類型 {#supported-file-types}

Gemini File Search 支援多種檔案格式：

### 文件 {#documents}
- PDF (`application/pdf`)
- Microsoft Word (`.docx`, `.doc`)
- Microsoft Excel (`.xlsx`, `.xls`)
- Microsoft PowerPoint (`.pptx`)
- OpenDocument 格式 (`.odt`, `.ods`, `.odp`)

### 文字檔 {#text-files}
- 純文字 (`text/plain`)
- Markdown (`text/markdown`)
- HTML (`text/html`)
- CSV (`text/csv`)
- JSON (`application/json`)
- XML (`application/xml`)

### 程式碼檔 {#code-files}
- Python、JavaScript、TypeScript、Java、C/C++、Go、Rust 等。
- 支援大多數常見程式語言

請參閱 [Gemini 支援的完整檔案類型清單](https://ai.google.dev/gemini-api/docs/file-search#supported-file-types)。

## 定價 {#pricing}

- **索引**：每 100 萬 token $0.15（嵌入定價）
- **儲存**：免費
- **查詢嵌入**：免費
- **擷取的 token**：依一般上下文 token 計費

## 支援的模型 {#supported-models}

File Search 可搭配：
- `gemini-3-pro-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`（以及預覽版本）
- `gemini-2.5-flash-lite`（以及預覽版本）

## 疑難排解 {#troubleshooting}

### 驗證錯誤 {#authentication-errors}

```python
# Ensure API key is set
import os
os.environ["GEMINI_API_KEY"] = "your-api-key"

# Or pass explicitly
response = await litellm.aingest(
    ingest_options={
        "vector_store": {
            "custom_llm_provider": "gemini",
            "api_key": "your-api-key"
        }
    },
    file_data=(...)
)
```

### 找不到儲存區 {#store-not-found}

請確保您使用完整的儲存區名稱格式：
- ✅ `fileSearchStores/abc123`
- ❌ `abc123`

### 大型檔案 {#large-files}

對於大於 100MB 的檔案，請在擷取前先將其分割成較小的分塊。

### 索引速度緩慢 {#slow-indexing}

擷取後，Gemini 可能需要一些時間來為文件建立索引。搜尋前請等待幾秒：

```python
import time

# After ingest
await litellm.aingest(...)

# Wait for indexing
time.sleep(5)

# Then search
await litellm.vector_stores.asearch(...)
```

## 相關資源 {#related-resources}

- [Gemini File Search 官方文件](https://ai.google.dev/gemini-api/docs/file-search)
- [LiteLLM RAG 擷取 API](/docs/rag_ingest)
- [LiteLLM 向量儲存區搜尋](/docs/vector_stores/search)
- [在 Chat 中使用向量儲存區](/docs/completion/knowledgebase)
