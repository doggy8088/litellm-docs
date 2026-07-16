# /rag/ingest {#ragingest}

一站式文件匯入管線：**上傳 → 分塊 → 嵌入 → 向量儲存**

| 功能 | 支援 |
|---------|-----------|
| 記錄 | 是 |
| 支援的提供者 | `openai`, `bedrock`, `vertex_ai`, `gemini`, `s3_vectors` |

:::tip
匯入文件後，使用 [/rag/query](./rag_query.md) 來搜尋並使用您匯入的內容生成回應。
:::

## 快速開始 {#quick-start}

### OpenAI {#openai}

```bash showLineNumbers title="Ingest to OpenAI vector store"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"vector_store\": {
                \"custom_llm_provider\": \"openai\"
            }
        }
    }"
```

### Bedrock {#bedrock}

```bash showLineNumbers title="Ingest to Bedrock Knowledge Base"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"vector_store\": {
                \"custom_llm_provider\": \"bedrock\"
            }
        }
    }"
```

### Vertex AI RAG Engine {#vertex-ai-rag-engine}

```bash showLineNumbers title="Ingest to Vertex AI RAG Corpus"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"vector_store\": {
                \"custom_llm_provider\": \"vertex_ai\",
                \"vector_store_id\": \"your-corpus-id\",
                \"gcs_bucket\": \"your-gcs-bucket\"
            }
        }
    }"
```

### AWS S3 Vectors {#aws-s3-vectors}

```bash showLineNumbers title="Ingest to S3 Vectors"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"embedding\": {
                \"model\": \"text-embedding-3-small\"
            },
            \"vector_store\": {
                \"custom_llm_provider\": \"s3_vectors\",
                \"vector_bucket_name\": \"my-embeddings\",
                \"aws_region_name\": \"us-west-2\"
            }
        }
    }"
```

## 回應 {#response}

```json
{
  "id": "ingest_abc123",
  "status": "completed",
  "vector_store_id": "vs_xyz789",
  "file_id": "file_123"
}
```

## 使用 RAG 查詢 {#query-with-rag}

匯入後，使用 [/rag/query](./rag_query.md) 端點來搜尋並生成 LLM 回應：

```bash showLineNumbers title="RAG Query"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "What is the main topic?"}],
        "retrieval_config": {
            "vector_store_id": "vs_xyz789",
            "custom_llm_provider": "openai",
            "top_k": 5
        }
    }'
```

這會：
1. 在向量儲存中搜尋相關上下文
2. 將上下文加入您的訊息前
3. 生成 LLM 回應

### 直接向量儲存搜尋 {#direct-vector-store-search}

或者，直接使用 `/vector_stores/{vector_store_id}/search` 搜尋向量儲存：

```bash showLineNumbers title="Search the vector store"
curl -X POST "http://localhost:4000/v1/vector_stores/vs_xyz789/search" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "What is the main topic?",
        "max_num_results": 5
    }'
```

## 端到端範例 {#end-to-end-example}

### OpenAI {#openai-1}

#### 1. 匯入文件 {#1-ingest-document}

```bash showLineNumbers title="Step 1: Ingest"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"test_document.txt\",
            \"content\": \"$(base64 -i test_document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"name\": \"test-basic-ingest\",
            \"vector_store\": {
                \"custom_llm_provider\": \"openai\"
            }
        }
    }"
```

回應：
```json
{
  "id": "ingest_d834f544-fc5e-4751-902d-fb0bcc183b85",
  "status": "completed",
  "vector_store_id": "vs_692658d337c4819183f2ad8488d12fc9",
  "file_id": "file-M2pJJiWH56cfUP4Fe7rJay"
}
```

#### 2. 查詢 {#2-query}

```bash showLineNumbers title="Step 2: Query"
curl -X POST "http://localhost:4000/v1/vector_stores/vs_692658d337c4819183f2ad8488d12fc9/search" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "What is LiteLLM?",
        "custom_llm_provider": "openai"
    }'
```

回應：
```json
{
  "object": "vector_store.search_results.page",
  "search_query": ["What is LiteLLM?"],
  "data": [
    {
      "file_id": "file-M2pJJiWH56cfUP4Fe7rJay",
      "filename": "test_document.txt",
      "score": 0.4004629778869299,
      "attributes": {},
      "content": [
        {
          "type": "text",
          "text": "Test document abc123 for RAG ingestion.\nThis is a sample document to test the RAG ingest API.\nLiteLLM provides a unified interface for vector stores."
        }
      ]
    }
  ],
  "has_more": false,
  "next_page": null
}
```

## 請求參數 {#request-parameters}

### 頂層 {#top-level}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `file` | object | 必須提供 file/file_url/file_id 其中之一 | Base64 編碼的檔案 |
| `file.filename` | string | 是 | 含副檔名的檔名 |
| `file.content` | string | 是 | Base64 編碼的內容 |
| `file.content_type` | string | 是 | MIME 類型（例如，`text/plain`） |
| `file_url` | string | 必須提供 file/file_url/file_id 其中之一 | 要從中擷取檔案的 URL |
| `file_id` | string | 必須提供 file/file_url/file_id 其中之一 | 現有的檔案 ID |
| `ingest_options` | object | 是 | 管線組態 |

### ingest_options {#ingest_options}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `vector_store` | object | 是 | 向量儲存組態 |
| `name` | string | 否 | 用於記錄的管線名稱 |

### vector_store (OpenAI) {#vector_store-openai}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `custom_llm_provider` | string | - | `"openai"` |
| `vector_store_id` | string | auto-create | 現有的向量儲存 ID |

### vector_store (Bedrock) {#vector_store-bedrock}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `custom_llm_provider` | string | - | `"bedrock"` |
| `vector_store_id` | string | auto-create | 現有的 Knowledge Base ID |
| `wait_for_ingestion` | boolean | `false` | 等待索引完成 |
| `ingestion_timeout` | integer | `300` | 等待時的逾時秒數 |
| `s3_bucket` | string | auto-create | 文件用的 S3 儲存貯體 |
| `s3_prefix` | string | `"data/"` | S3 金鑰前綴 |
| `embedding_model` | string | `amazon.titan-embed-text-v2:0` | Bedrock 嵌入模型 |
| `aws_region_name` | string | `us-west-2` | AWS 區域 |

:::info Bedrock 自動建立
當未提供 `vector_store_id` 時，LiteLLM 會自動建立：
- 文件儲存用 S3 儲存貯體
- OpenSearch Serverless collection
- 具備必要權限的 IAM role
- Bedrock Knowledge Base
- Data Source
:::

### vector_store (Vertex AI) {#vector_store-vertex-ai}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `custom_llm_provider` | string | - | `"vertex_ai"` |
| `vector_store_id` | string | **必填** | RAG corpus ID |
| `gcs_bucket` | string | **必填** | 用於檔案上傳的 GCS 儲存貯體 |
| `vertex_project` | string | env `VERTEXAI_PROJECT` | GCP 專案 ID |
| `vertex_location` | string | `us-central1` | GCP 區域 |
| `vertex_credentials` | string | ADC | 憑證 JSON 的路徑 |
| `wait_for_import` | boolean | `true` | 等待匯入完成 |
| `import_timeout` | integer | `600` | 等待時的逾時秒數 |

:::info Vertex AI 必要條件
1. 在 Vertex AI 主控台或透過 API 建立 RAG corpus
2. 建立用於檔案上傳的 GCS 儲存貯體
3. 透過 `gcloud auth application-default login` 驗證
4. 安裝：`uv add 'google-cloud-aiplatform>=1.60.0'`
:::

### vector_store (AWS S3 Vectors) {#vector_store-aws-s3-vectors}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `custom_llm_provider` | string | - | `"s3_vectors"` |
| `vector_bucket_name` | string | **必填** | S3 向量儲存貯體名稱 |
| `index_name` | string | auto-create | 向量索引名稱 |
| `dimension` | integer | auto-detect | 向量維度（由嵌入模型自動偵測） |
| `distance_metric` | string | `cosine` | 距離度量：`cosine` 或 `euclidean` |
| `non_filterable_metadata_keys` | array | `["source_text"]` | 排除於篩選之外的中繼資料鍵 |
| `aws_region_name` | string | `us-west-2` | AWS 區域 |
| `aws_access_key_id` | string | env | AWS 存取金鑰 |
| `aws_secret_access_key` | string | env | AWS 私密金鑰 |

:::info S3 Vectors 自動建立
當未提供 `index_name` 時，LiteLLM 會自動建立：
- S3 向量儲存貯體（如果不存在）
- 會從您的嵌入模型自動偵測維度的向量索引

**維度自動偵測**：向量維度會透過對您指定的模型發出測試嵌入請求，自動偵測。無需手動指定維度！

**支援的嵌入模型**：可搭配任何 LiteLLM 支援的嵌入模型（OpenAI、Cohere、Bedrock、Azure 等）
:::

**使用自動偵測的範例：**
```json
{
  "embedding": {
    "model": "text-embedding-3-small"  // Dimension auto-detected as 1536
  },
  "vector_store": {
    "custom_llm_provider": "s3_vectors",
    "vector_bucket_name": "my-embeddings"
  }
}
```

**使用自訂嵌入提供者的範例：**
```json
{
  "embedding": {
    "model": "cohere/embed-english-v3.0"  // Dimension auto-detected as 1024
  },
  "vector_store": {
    "custom_llm_provider": "s3_vectors",
    "vector_bucket_name": "my-embeddings",
    "distance_metric": "cosine"
  }
}
```

## 輸入範例 {#input-examples}

### 檔案（Base64） {#file-base64}

```json title="Request body"
{
  "file": {
    "filename": "document.txt",
    "content": "<base64-encoded-content>",
    "content_type": "text/plain"
  },
  "ingest_options": {
    "vector_store": {"custom_llm_provider": "openai"}
  }
}
```

### 檔案 URL {#file-url}

```bash showLineNumbers title="Ingest from URL"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d '{
        "file_url": "https://example.com/document.pdf",
        "ingest_options": {"vector_store": {"custom_llm_provider": "openai"}}
    }'
```

## 分塊策略 {#chunking-strategy}

控制文件在嵌入前如何拆分為區塊。在 `ingest_options` 中指定 `chunking_strategy`。

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `chunk_size` | integer | `1000` | 每個區塊的最大大小 |
| `chunk_overlap` | integer | `200` | 相鄰區塊之間的重疊 |

### Vertex AI RAG Engine {#vertex-ai-rag-engine-1}

Vertex AI RAG Engine 支援透過 `chunking_strategy` 參數進行自訂分塊。區塊會在匯入期間於伺服器端處理。

```bash showLineNumbers title="Vertex AI with custom chunking"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"chunking_strategy\": {
                \"chunk_size\": 500,
                \"chunk_overlap\": 100
            },
            \"vector_store\": {
                \"custom_llm_provider\": \"vertex_ai\",
                \"vector_store_id\": \"your-corpus-id\",
                \"gcs_bucket\": \"your-gcs-bucket\"
            }
        }
    }"
```
