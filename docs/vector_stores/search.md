import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /vector_stores/search - 搜尋向量儲存 {#vector_storessearch---search-vector-store}

依據查詢與檔案屬性篩選條件搜尋向量儲存中相關的區塊。這對檢索增強生成（RAG）使用案例很有幫助。

## 概覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 依每次搜尋操作追蹤 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 最終使用者追蹤 | ✅ | |
| 支援 LLM 提供者 | **OpenAI、Azure OpenAI、Bedrock、Vertex RAG Engine、Azure AI、Milvus、Gemini** | 跨提供者完整支援向量儲存 API |

如需透過 HTTP 進行 **retrieve、list、update 與 delete**（包含 `custom_llm_provider` / `model` 路由），請參閱[建立向量儲存](./create.md#vector-store-management-and-routing-on-the-proxy)。

## 用法 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

#### 非串流範例 {#non-streaming-example}
```python showLineNumbers title="Search Vector Store - Basic"
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="vs_abc123",
    query="What is the capital of France?"
)
print(response)
```

#### 同步範例 {#synchronous-example}
```python showLineNumbers title="Search Vector Store - Sync"
import litellm

response = litellm.vector_stores.search(
    vector_store_id="vs_abc123",
    query="What is the capital of France?"
)
print(response)
```

</TabItem>

<TabItem value="advanced" label="進階設定">

#### 使用篩選與排序選項 {#with-filters-and-ranking-options}
```python showLineNumbers title="Search Vector Store - Advanced"
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="vs_abc123",
    query="What is the capital of France?",
    filters={
        "file_ids": ["file-abc123", "file-def456"]
    },
    max_num_results=5,
    ranking_options={
        "score_threshold": 0.7
    },
    rewrite_query=True
)
print(response)
```

</TabItem>

<TabItem value="multiple-queries" label="多重查詢">

#### 使用多個查詢進行搜尋 {#searching-with-multiple-queries}
```python showLineNumbers title="Search Vector Store - Multiple Queries"
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="vs_abc123",
    query=[
        "What is the capital of France?",
        "What is the population of Paris?"
    ],
    max_num_results=10
)
print(response)
```

</TabItem>

<TabItem value="openai-provider" label="OpenAI 提供者">

#### 明確使用 OpenAI 提供者 {#using-openai-provider-explicitly}
```python showLineNumbers title="Search Vector Store - OpenAI Provider"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

response = await litellm.vector_stores.asearch(
    vector_store_id="vs_abc123",
    query="What is the capital of France?",
    custom_llm_provider="openai"
)
print(response)
```

</TabItem>

<TabItem value="azure-ai-provider" label="Azure AI 提供者">

#### 使用 Azure AI Search {#using-azure-ai-search}
```python showLineNumbers title="Search Vector Store - Azure AI Provider"
import litellm
import os

# Set credentials
os.environ["AZURE_SEARCH_API_KEY"] = "your-search-api-key"

response = await litellm.vector_stores.asearch(
    vector_store_id="my-vector-index",
    query="What is the capital of France?",
    custom_llm_provider="azure_ai",
    azure_search_service_name="your-search-service",
    litellm_embedding_model="azure/text-embedding-3-large",
    litellm_embedding_config={
        "api_base": "your-embedding-endpoint",
        "api_key": "your-embedding-api-key",
    },
    api_key=os.getenv("AZURE_SEARCH_API_KEY"),
)
print(response)
```

[請參閱完整的 Azure AI 向量儲存文件](../providers/azure_ai_vector_stores.md)

</TabItem>

<TabItem value="milvus-provider" label="Milvus 提供者">

#### 使用 Milvus {#using-milvus}
```python showLineNumbers title="Search Vector Store - Milvus Provider"
import litellm
import os

# Set credentials
os.environ["MILVUS_API_KEY"] = "your-milvus-api-key"
os.environ["MILVUS_API_BASE"] = "https://your-milvus-instance.milvus.io"

response = await litellm.vector_stores.asearch(
    vector_store_id="my-collection-name",
    query="What is the capital of France?",
    custom_llm_provider="milvus",
    litellm_embedding_model="azure/text-embedding-3-large",
    litellm_embedding_config={
        "api_base": "your-embedding-endpoint",
        "api_key": "your-embedding-api-key",
    },
    milvus_text_field="book_intro",
    api_key=os.getenv("MILVUS_API_KEY"),
)
print(response)
```

[請參閱完整的 Milvus 向量儲存文件](../providers/milvus_vector_stores.md)

</TabItem>

<TabItem value="gemini-provider" label="Gemini 提供者">

#### 使用 Gemini File Search {#using-gemini-file-search}
```python showLineNumbers title="Search Vector Store - Gemini Provider"
import litellm
import os

# Set credentials
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

response = await litellm.vector_stores.asearch(
    vector_store_id="fileSearchStores/your-store-id",
    query="What is the capital of France?",
    custom_llm_provider="gemini",
    max_num_results=5
)
print(response)
```

**搭配中繼資料篩選：**
```python showLineNumbers title="Search with Metadata Filter"
response = await litellm.vector_stores.asearch(
    vector_store_id="fileSearchStores/your-store-id",
    query="What is LiteLLM?",
    custom_llm_provider="gemini",
    filters={"author": "John Doe", "category": "documentation"},
    max_num_results=5
)
print(response)
```

[請參閱完整的 Gemini File Search 文件](../providers/gemini_file_search.md)

</TabItem>
</Tabs>

### LiteLLM Proxy Server {#litellm-proxy-server}

<Tabs>
<TabItem value="proxy-setup" label="設定與用法">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  # Vector store settings can be added here if needed
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 使用 OpenAI SDK 測試它！

```python showLineNumbers title="OpenAI SDK via LiteLLM Proxy"
from openai import OpenAI

# Point OpenAI SDK to LiteLLM proxy
client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",  # Your LiteLLM API key
)

search_results = client.beta.vector_stores.search(
    vector_store_id="vs_abc123",
    query="What is the capital of France?",
    max_num_results=5
)
print(search_results)
```

</TabItem>

<TabItem value="curl-proxy" label="curl">

```bash showLineNumbers title="Search Vector Store via curl"
curl -L -X POST 'http://0.0.0.0:4000/v1/vector_stores/vs_abc123/search' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "query": "What is the capital of France?",
  "filters": {
    "file_ids": ["file-abc123", "file-def456"]
  },
  "max_num_results": 5,
  "ranking_options": {
    "score_threshold": 0.7
  },
  "rewrite_query": true
}'
```

</TabItem>
</Tabs>

## 設定向量儲存 {#setting-up-vector-stores}

若要使用向量儲存搜尋，請在 `vector_store_registry` 中設定您的向量儲存。請參閱[向量儲存設定指南](../completion/knowledgebase.md)以了解：

- 提供者特定設定（Bedrock、OpenAI、Azure、Vertex AI、PG Vector）
- Python SDK 與 Proxy 設定範例  
- 驗證與憑證管理

## 在 Chat Completions 中使用向量儲存 {#using-vector-stores-with-chat-completions}

在 chat completion 請求中傳入 `vector_store_ids`，即可自動擷取相關脈絡。請參閱[在 Chat Completions 中使用向量儲存](../completion/knowledgebase.md#2-make-a-request-with-vector_store_ids-parameter)以了解實作細節。
