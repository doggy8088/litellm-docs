import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /vector_stores/search - 搜尋向量儲存 {#vector_storessearch---search-vector-store}

依據查詢與檔案屬性篩選條件搜尋向量儲存中相關的區塊。這對檢索增強生成（RAG）使用案例很有幫助。

## 概覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 依每次搜尋作業追蹤 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 終端使用者追蹤 | ✅ | |
| 支援 LLM 提供者 | **OpenAI, Azure OpenAI, Bedrock, Vertex RAG Engine, Azure AI, Milvus, Valkey, Gemini** | 跨提供者完整支援 vector stores API |

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

<TabItem value="mongodb-provider" label="MongoDB Provider (BETA)">

#### 使用 MongoDB（BETA） {#using-mongodb-beta}

搜尋 Atlas 上既有的 MongoDB Vector Search 索引，或自我管理的部署。安裝 `litellm[mongodb]`，接著設定 `MONGODB_CONNECTION_STRING` 以及您的 embedding 提供者憑證。請以您的索引、集合欄位，以及用來為文件建立 embedding 的模型取代預留位置。

```python showLineNumbers title="Search Vector Store - MongoDB Provider (BETA)"
import os

import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="<index-name>",  # Exact MongoDB Vector Search index name
    query="<question-about-your-documents>",
    custom_llm_provider="mongodb",
    mongodb_connection_string=os.environ["MONGODB_CONNECTION_STRING"],
    mongodb_database="<database-name>",
    mongodb_collection="<collection-name>",
    mongodb_text_field="<text-field>",
    mongodb_embedding_field="<vector-field>",
    litellm_embedding_model="<provider>/<embedding-model>",
    max_num_results=3,
)
print(response)
```

embedding 模型必須與儲存向量所使用的模型相符。此 BETA 整合僅支援搜尋；不支援索引建立、資料擷取、篩選條件、排序選項與查詢改寫。

[MongoDB 設定與參考](../providers/mongodb_vector_stores.md) · [範例文件範例](../tutorials/mongodb_vector_search.md)

</TabItem>

<TabItem value="valkey-provider" label="Valkey Provider">

#### 使用 Valkey {#using-valkey}
```python showLineNumbers title="Search Vector Store - Valkey Provider"
import litellm

response = await litellm.vector_stores.asearch(
    vector_store_id="my-search-index",  # name of the FT index in Valkey
    query="What is the capital of France?",
    custom_llm_provider="valkey",
    valkey_host="my-valkey.example.com",
    valkey_port=6379,
    litellm_embedding_model="openai/text-embedding-3-small",
    max_num_results=3,
)
print(response)
```

[查看完整的 Valkey vector store 文件](../providers/valkey_vector_stores.md)

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
  - model_name: {{openai_large}}
    litellm_params:
      model: openai/{{openai_large}}
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
    api_key="sk-<your-litellm-api-key>",  # Your LiteLLM API key
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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

<TabItem value="vertex-search-proxy" label="Vertex AI Search">

使用提供者 `vertex_ai/search_api` 將資料儲存或搜尋應用程式註冊為 [受管理的 vector store](./managed_vector_stores.md)。原生 Discovery Engine 搜尋欄位放在 `extra_body` 中。

使用基於版面配置分塊的資料儲存預設會回傳整份文件的片段。請要求回傳 chunk 結果，讓每個命中都帶有對應段落：

```bash showLineNumbers title="Search a chunked data store"
curl -L -X POST 'http://0.0.0.0:4000/v1/vector_stores/my-datastore_1234567890/search' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "query": "annual pass refund window",
  "max_num_results": 5,
  "extra_body": {
    "contentSearchSpec": {"searchResultMode": "CHUNKS"}
  }
}'
```

每個結果的 `content[0].text` 是 chunk 文字，`file_id` 和 `filename` 是來源文件的 URI 與標題，而當儲存區提供時，`attributes` 會帶有 `document_id`、`chunk_id`、`pageSpan`，以及該文件的 `structData`。

Enterprise 等級的搜尋應用程式也可以回傳擷取式片段或答案。它們在 `content[0].text` 中優先於片段（先片段，後答案）：

```bash showLineNumbers title="Search with extractive content"
curl -L -X POST 'http://0.0.0.0:4000/v1/vector_stores/my-search-app/search' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "query": "how does billing work",
  "extra_body": {
    "contentSearchSpec": {
      "extractiveContentSpec": {"maxExtractiveSegmentCount": 1, "maxExtractiveAnswerCount": 1}
    }
  }
}'
```

結構化資料儲存會將每筆記錄回傳於 `attributes.structData` 之下。

</TabItem>
</Tabs>

## 設定向量儲存 {#setting-up-vector-stores}

若要搜尋已存在於某個提供者上的儲存區，請先透過 `config.yaml`、`POST /vector_store/new`，或 Admin UI 將其註冊至 LiteLLM；請參閱 [受管理的 Vector Stores](./managed_vector_stores.md)。關於提供者特定的設定，請參閱 [Vector Store 設定指南](../completion/knowledgebase.md)：

- 提供者特定設定（Bedrock、OpenAI、Azure、Vertex AI、PG Vector）
- Python SDK 與 Proxy 設定範例  
- 驗證與憑證管理

## 在 Chat Completions 中使用向量儲存 {#using-vector-stores-with-chat-completions}

在 chat completion 請求中傳入 `vector_store_ids`，即可自動擷取相關脈絡。請參閱[在 Chat Completions 中使用向量儲存](../completion/knowledgebase.md#2-make-a-request-with-vector_store_ids-parameter)以了解實作細節。
