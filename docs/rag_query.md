# /rag/query {#ragquery}

RAG 查詢端點：**搜尋向量儲存 →（重新排序）→ LLM 完成**

| 功能 | 支援 |
|---------|-----------|
| 記錄 | 是 |
| 串流 | 是 |
| 重新排序 | 是（可選） |
| 支援的提供者 | `openai`, `bedrock`, `vertex_ai` |

## 快速開始 {#quick-start}

```bash showLineNumbers title="RAG Query with OpenAI"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "{{openai_small}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        "retrieval_config": {
            "vector_store_id": "vs_abc123",
            "custom_llm_provider": "openai",
            "top_k": 5
        }
    }'
```

## 運作方式 {#how-it-works}

RAG 查詢端點會執行以下步驟：

1. **擷取查詢**：從最後一則使用者訊息擷取查詢文字
2. **搜尋向量儲存**：在指定的向量儲存中搜尋相關內容
3. **重新排序（可選）**：使用重新排序模型對搜尋結果重新排序
4. **產生回應**：以擷取到的內容前置於訊息之前呼叫 LLM

## 回應 {#response}

回應遵循標準 OpenAI 聊天完成格式，並包含額外的搜尋中繼資料：

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1703123456,
  "model": "{{openai_small}}",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "LiteLLM is a unified interface for 100+ LLMs..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  },
  "_hidden_params": {
    "search_results": {...},
    "rerank_results": {...}
  }
}
```

## 搭配重新排序 {#with-reranking}

加入 `rerank` 設定以提升結果品質：

```bash showLineNumbers title="RAG Query with Reranking"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "{{openai_small}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        "retrieval_config": {
            "vector_store_id": "vs_abc123",
            "custom_llm_provider": "openai",
            "top_k": 10
        },
        "rerank": {
            "enabled": true,
            "model": "cohere/rerank-english-v3.0",
            "top_n": 3
        }
    }'
```

## 串流 {#streaming}

啟用串流以取得即時回應：

```bash showLineNumbers title="RAG Query with Streaming"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "{{openai_small}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        "retrieval_config": {
            "vector_store_id": "vs_abc123",
            "custom_llm_provider": "openai"
        },
        "stream": true
    }'
```

## 篩選檢索 {#filtering-retrieval}

設定 `retrieval_config.retrieval_filter` 以將搜尋範圍縮小到其中繼資料相符的區塊。此篩選條件會以 `filters` 引數傳遞給向量儲存，因此它會採用提供者接受的任何形式：Bedrock Knowledge Bases 接受其原生運算子（`equals`、`notEquals`、`andAll`、`orAll` 等；`andAll` 或 `orAll` 至少需要兩個子句）以及 OpenAI 比較格式（`{"key": ..., "value": ..., "operator": "eq"}`），而 OpenAI 向量儲存則接受其自己的篩選物件。`retrieval_config.filters` 可作為別名接受；當兩個鍵都設定時，`retrieval_filter` 會生效。若向量儲存拒絕該篩選條件，請求會以該儲存的狀態碼和訊息失敗

```bash showLineNumbers title="RAG Query with a Bedrock metadata filter"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "bedrock/us.anthropic.{{anthropic}}",
        "messages": [{"role": "user", "content": "How do I reset my password?"}],
        "retrieval_config": {
            "vector_store_id": "KNOWLEDGE_BASE_ID",
            "custom_llm_provider": "bedrock",
            "top_k": 5,
            "retrieval_filter": {
                "andAll": [
                    {"equals": {"key": "department", "value": "billing"}},
                    {"equals": {"key": "doc_type", "value": "manual"}}
                ]
            }
        }
    }'
```

## 請求參數 {#request-parameters}

### 頂層 {#top-level}

| 參數 | 型別 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `model` | string | Yes | 用於生成的 LLM 模型 |
| `messages` | array | Yes | 聊天訊息陣列（OpenAI 格式） |
| `retrieval_config` | object | Yes | 向量儲存搜尋設定 |
| `rerank` | object | No | 重新排序設定 |
| `stream` | boolean | No | 啟用串流（預設：`false`） |

### retrieval_config {#retrieval_config}

| 參數 | 類型 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `vector_store_id` | string | **required** | 要搜尋的向量儲存 ID |
| `custom_llm_provider` | string | `"openai"` | 向量儲存提供者 |
| `top_k` | integer | `10` | 要擷取的結果數量 |
| `retrieval_filter` | object | - | 轉送至向量儲存搜尋的中繼資料篩選條件（請參閱［篩選檢索］(#filtering-retrieval)） |
| `filters` | object | - | `retrieval_filter` 的別名；當兩者都設定時，`retrieval_filter` 會生效 |

### rerank {#rerank}

| 參數 | 型別 | 預設 | 說明 |
|-----------|------|---------|-------------|
| `enabled` | boolean | `false` | 啟用重新排序 |
| `model` | string | - | 重新排序模型（例如：`cohere/rerank-english-v3.0`） |
| `top_n` | integer | `5` | 重新排序後的結果數量 |

## 端到端範例 {#end-to-end-example}

### 1. 匯入文件 {#1-ingest-a-document}

首先，使用 [/rag/ingest](./rag_ingest.md) 端點匯入文件：

```bash showLineNumbers title="Step 1: Ingest"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"company_docs.txt\",
            \"content\": \"$(base64 -i company_docs.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"vector_store\": {
                \"custom_llm_provider\": \"openai\"
            }
        }
    }"
```

回應：
```json
{
  "id": "ingest_abc123",
  "status": "completed",
  "vector_store_id": "vs_xyz789",
  "file_id": "file-123"
}
```

### 2. 使用 RAG 查詢 {#2-query-with-rag}

現在查詢已匯入的文件：

```bash showLineNumbers title="Step 2: Query"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "{{openai_small}}",
        "messages": [
            {"role": "user", "content": "What products does the company offer?"}
        ],
        "retrieval_config": {
            "vector_store_id": "vs_xyz789",
            "custom_llm_provider": "openai",
            "top_k": 5
        }
    }'
```

回應：
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "{{openai_small}}",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Based on the company documents, the company offers..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

## 提供者範例 {#provider-examples}

### Bedrock {#bedrock}

```bash showLineNumbers title="RAG Query with Bedrock"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "bedrock/us.anthropic.{{anthropic}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        "retrieval_config": {
            "vector_store_id": "KNOWLEDGE_BASE_ID",
            "custom_llm_provider": "bedrock",
            "top_k": 5
        }
    }'
```

### Vertex AI {#vertex-ai}

```bash showLineNumbers title="RAG Query with Vertex AI"
curl -X POST "http://localhost:4000/v1/rag/query" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "vertex_ai/{{gemini_pro}}",
        "messages": [{"role": "user", "content": "What is LiteLLM?"}],
        "retrieval_config": {
            "vector_store_id": "your-corpus-id",
            "custom_llm_provider": "vertex_ai",
            "top_k": 5
        }
    }'
```

## Python SDK {#python-sdk}

```python showLineNumbers title="Using litellm.aquery()"
import litellm

response = await litellm.aquery(
    model="{{openai_small}}",
    messages=[{"role": "user", "content": "What is LiteLLM?"}],
    retrieval_config={
        "vector_store_id": "vs_abc123",
        "custom_llm_provider": "openai",
        "top_k": 5,
    },
    rerank={
        "enabled": True,
        "model": "cohere/rerank-english-v3.0",
        "top_n": 3,
    },
)

print(response.choices[0].message.content)
```
