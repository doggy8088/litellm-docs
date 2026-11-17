---
title: "使用 LiteLLM 的 Azure AI Search 向量儲存區"
sidebar_label: "Azure AI Search - Vector Store (Unified API)"
description: "透過 Python SDK 或 AI Gateway，使用 LiteLLM 的統一 API 搜尋 Azure AI Search 向量儲存區。設定 config.yaml、嵌入模型與索引。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure AI Search - 向量儲存庫（Unified API） {#azure-ai-search---vector-store-unified-api}

使用此功能可透過 LiteLLM 的統一 `/chat/completions` API **搜尋** Azure AI Search 向量儲存庫。

## 快速開始 {#quick-start}

您需要三項內容：
1. Azure AI Search 服務
2. 嵌入模型（將您的查詢轉換為向量）
3. 具有向量欄位的搜尋索引

## 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

### 基本搜尋 {#basic-search}

```python
from litellm import vector_stores
import os

# Set your credentials
os.environ["AZURE_SEARCH_API_KEY"] = "your-search-api-key"
os.environ["AZURE_AI_SEARCH_EMBEDDING_API_BASE"] = "your-embedding-endpoint"
os.environ["AZURE_AI_SEARCH_EMBEDDING_API_KEY"] = "your-embedding-api-key"

# Search the vector store
response = vector_stores.search(
    vector_store_id="my-vector-index",  # Your Azure AI Search index name
    query="What is the capital of France?",
    custom_llm_provider="azure_ai",
    azure_search_service_name="your-search-service",
    litellm_embedding_model="azure/text-embedding-3-large",
    litellm_embedding_config={
        "api_base": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_BASE"),
        "api_key": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_KEY"),
    },
    api_key=os.getenv("AZURE_SEARCH_API_KEY"),
)

print(response)
```

### 非同步搜尋 {#async-search}

```python
from litellm import vector_stores

response = await vector_stores.asearch(
    vector_store_id="my-vector-index",
    query="What is the capital of France?",
    custom_llm_provider="azure_ai",
    azure_search_service_name="your-search-service",
    litellm_embedding_model="azure/text-embedding-3-large",
    litellm_embedding_config={
        "api_base": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_BASE"),
        "api_key": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_KEY"),
    },
    api_key=os.getenv("AZURE_SEARCH_API_KEY"),
)

print(response)
```

### 進階選項 {#advanced-options}

```python
from litellm import vector_stores

response = vector_stores.search(
    vector_store_id="my-vector-index",
    query="What is the capital of France?",
    custom_llm_provider="azure_ai",
    azure_search_service_name="your-search-service",
    litellm_embedding_model="azure/text-embedding-3-large",
    litellm_embedding_config={
        "api_base": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_BASE"),
        "api_key": os.getenv("AZURE_AI_SEARCH_EMBEDDING_API_KEY"),
    },
    api_key=os.getenv("AZURE_SEARCH_API_KEY"),
    top_k=10,  # Number of results to return
    azure_search_vector_field="contentVector",  # Custom vector field name
)

print(response)
```

</TabItem>

<TabItem value="proxy" label="PROXY">

### 設定設定檔 {#setup-config}

#### 透過模型群組嵌入查詢 {#embed-queries-through-a-model-group}

<SinceVersion v="1.101.0" />

將 `litellm_embedding_model` 設為您 `model_list` 中的一個 `model_name`。如此一來，每次搜尋都會透過 LiteLLM 路由器來嵌入查詢，因此您為該模型群組設定的負載平衡、重試、冷卻與備援，會以套用於其 `/v1/embeddings` 呼叫的相同方式套用到搜尋查詢。您不需要設定 `litellm_embedding_config`；憑證會保留在各部署上。

```yaml
model_list:
  - model_name: query-embeddings
    litellm_params:
      model: azure/text-embedding-3-large
      api_base: https://my-eastus2-resource.openai.azure.com/
      api_key: os.environ/AZURE_EASTUS2_API_KEY
      api_version: "2024-10-21"
  - model_name: query-embeddings
    litellm_params:
      model: azure/text-embedding-3-large
      api_base: https://my-westus3-resource.openai.azure.com/
      api_key: os.environ/AZURE_WESTUS3_API_KEY
      api_version: "2024-10-21"

router_settings:
  num_retries: 2

vector_store_registry:
  - vector_store_name: "azure-ai-search-litellm-website-knowledgebase"
    litellm_params:
        vector_store_id: "my-vector-index"  # Your Azure AI Search index name
        custom_llm_provider: "azure_ai"
        azure_search_service_name: "your-search-service"  # or api_base: https://your-search-service.search.windows.net
        api_key: os.environ/AZURE_SEARCH_API_KEY
        litellm_embedding_model: "query-embeddings"  # model group from model_list
```

若某個部署失敗，路由器會改在群組中的另一個部署上重試查詢嵌入。若要容錯移轉至不同的模型群組，請將其加入 `router_settings.fallbacks`，例如 `fallbacks: [{"query-embeddings": ["query-embeddings-backup"]}]`。群組中以及任何備援群組中的每個部署，都必須使用與您索引中向量相同的嵌入模型與維度。

#### 單一嵌入部署 {#single-embedding-deployment}

您也可以讓向量儲存區直接指向單一嵌入部署，並在 `litellm_embedding_config` 中傳入其憑證。此形式不提供負載平衡或容錯移轉。

```yaml
vector_store_registry:
  - vector_store_name: "azure-ai-search-litellm-website-knowledgebase"
    litellm_params:
        vector_store_id: "my-vector-index"
        custom_llm_provider: "azure_ai"
        azure_search_service_name: "your-search-service"
        api_key: os.environ/AZURE_SEARCH_API_KEY
        litellm_embedding_model: "azure/text-embedding-3-large"
        litellm_embedding_config:
            api_base: https://my-eastus2-resource.openai.azure.com/
            api_key: os.environ/AZURE_API_KEY
            api_version: "2024-10-21"
```

### 啟動 Proxy {#start-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 透過 API 搜尋 {#search-via-api}

```bash
curl -X POST 'http://0.0.0.0:4000/v1/vector_stores/my-vector-index/search' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "query": "What is the capital of France?"
}'
```

</TabItem>
</Tabs>

## 必要參數 {#required-parameters}

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `vector_store_id` | string | 您的 Azure AI Search 索引名稱 |
| `custom_llm_provider` | string | 設為 `"azure_ai"` |
| `azure_search_service_name` | string | 您的 Azure AI Search 服務名稱 |
| `litellm_embedding_model` | string | 嵌入查詢的模型。在 Proxy 上，請使用您 `model_list` 中的模型群組名稱（例如，`"query-embeddings"`）或提供者模型（例如，`"azure/text-embedding-3-large"`） |
| `litellm_embedding_config` | dict | 嵌入模型的憑證（api_base、api_key、api_version）。當 `litellm_embedding_model` 為 Proxy 模型群組時不需要 |
| `api_key` | string | 您的 Azure AI Search API 金鑰 |

## 支援的功能 {#supported-features}

| 功能 | 狀態 | 備註 |
|---------|--------|-------|
| 記錄 | ✅ 支援 | 提供完整記錄支援 |
| 防護欄 | ❌ 尚未支援 | 目前向量儲存庫不支援防護欄 |
| 成本追蹤 | ✅ 支援 | 依 Azure 所述，成本為 $0 |
| 統一 API | ✅ 支援 | 透過與 OpenAI 相容的 `/v1/vector_stores/search` 端點呼叫 |
| Passthrough | ❌ 尚未支援 |  |

## 回應格式 {#response-format}

回應遵循標準的 LiteLLM 向量儲存庫格式：

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "What is the capital of France?",
  "data": [
    {
      "score": 0.95,
      "content": [
        {
          "text": "Paris is the capital of France...",
          "type": "text"
        }
      ],
      "file_id": "doc_123",
      "filename": "Document doc_123",
      "attributes": {
        "document_id": "doc_123"
      }
    }
  ]
}
```

## 運作方式 {#how-it-works}

當您搜尋時：

1. LiteLLM 使用您指定的嵌入模型將查詢轉換為向量
2. 它將向量傳送至 Azure AI Search
3. Azure AI Search 會在您的索引中找出最相似的文件
4. 結果會附帶相似度分數回傳

嵌入模型可以是 LiteLLM 支援的任何模型 - Azure OpenAI、OpenAI、Bedrock 等。

## 設定您的 Azure AI Search 索引 {#setting-up-your-azure-ai-search-index}

您的索引需要一個向量欄位。如下所示：

```json
{
  "name": "my-vector-index",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true
    },
    {
      "name": "content",
      "type": "Edm.String"
    },
    {
      "name": "contentVector",
      "type": "Collection(Edm.Single)",
      "searchable": true,
      "dimensions": 1536,
      "vectorSearchProfile": "myVectorProfile"
    }
  ]
}
```

向量維度必須與您的嵌入模型相符。例如：
- `text-embedding-3-large`：1536 維
- `text-embedding-3-small`：1536 維
- `text-embedding-ada-002`：1536 維

## 常見問題 {#common-issues}

**"無法為查詢產生嵌入"**

您的嵌入模型設定有誤。請檢查：
- 若 `litellm_embedding_model` 是模型群組，名稱是否與您 `model_list` 中的 `model_name` 相符；Proxy 無法辨識的名稱會被當作模型名稱傳送給提供者並失敗
- 否則，`litellm_embedding_config` 是否具有正確的 api_base 和 api_key
- 嵌入模型名稱是否正確
- 您的憑證是否可用

**"找不到索引"**

`vector_store_id` 不符合您搜尋服務中的任何索引。請檢查：
- 索引名稱是否正確
- 您是否使用正確的搜尋服務名稱

**"找不到欄位 'contentVector'"**

您的索引使用不同的向量欄位名稱。請透過 `azure_search_vector_field` 傳入。
