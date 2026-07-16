# Vertex AI Search 資料儲存庫 {#vertex-ai-search-datastores}

透過 LiteLLM 呼叫 Vertex AI Discovery Engine Search API。

提供者文件：https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1/projects.locations.dataStores.servingConfigs/search

## 您可獲得的內容 {#what-you-get}

- 以 ID 參照 datastore。LiteLLM 會找出憑證。
- 每次請求都不需要 project/location。
- 憑證只需設定一次，到處都能用。
- 成本追蹤會自動運作。

## 快速開始 {#quick-start}

**步驟 1. 設定憑證**

```bash
export DEFAULT_VERTEXAI_PROJECT="your-project-id"
export DEFAULT_VERTEXAI_LOCATION="us-central1"
export DEFAULT_GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

**步驟 2. 啟動 proxy**

```bash
litellm
```

**步驟 3. 搜尋您的 datastore**

```bash
curl -X POST \
  "http://localhost:4000/vertex_ai/discovery/v1/projects/my-project/locations/global/collections/default_collection/dataStores/my-datastore/servingConfigs/default_config:search" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{
    "query": "How do I authenticate?",
    "pageSize": 10
  }'
```

## 受管理的向量儲存（建議） {#managed-vector-stores-recommended}

只需註冊一次 datastore。以 ID 參照它。

**在 config.yaml 中：**

```yaml
vector_store_registry:
  - vector_store_name: "vertex-ai-litellm-website-knowledgebase"
    litellm_params:
      vector_store_id: "my-datastore"
      custom_llm_provider: "vertex_ai/search_api"
      vertex_app_id: "test-litellm-app_1761094730750"
      vertex_project: "test-vector-store-db"
      vertex_location: "global"
      vector_store_description: "Vertex AI vector store for the Litellm website knowledgebase"
      vector_store_metadata:
        source: "https://www.litellm.com/docs"
```

**運作方式：**

LiteLLM 會在您的 URL 中看到 `dataStores/my-datastore`。它會查找向量儲存。自動使用正確的 project 和憑證。

## 端點 {#endpoint}

`{PROXY_BASE_URL}/vertex_ai/discovery/{endpoint:path}`

路由至 `https://discoveryengine.googleapis.com`

## 範例 {#examples}

### 基本搜尋 {#basic-search}

```bash
curl -X POST \
  "http://localhost:4000/vertex_ai/discovery/v1/projects/my-project/locations/global/collections/default_collection/dataStores/my-datastore/servingConfigs/default_config:search" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{
    "query": "pricing",
    "pageSize": 10
  }'
```

### 具有篩選條件的搜尋 {#search-with-filters}

```bash
curl -X POST \
  "http://localhost:4000/vertex_ai/discovery/v1/projects/my-project/locations/global/collections/default_collection/dataStores/my-datastore/servingConfigs/default_config:search" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-1234" \
  -d '{
    "query": "tutorials",
    "pageSize": 20,
    "filter": "category = \"beginner\"",
    "spellCorrectionSpec": {"mode": "AUTO"}
  }'
```

### Python {#python}

```python
import requests

url = "http://localhost:4000/vertex_ai/discovery/v1/projects/my-project/locations/global/collections/default_collection/dataStores/my-datastore/servingConfigs/default_config:search"

response = requests.post(url, 
    headers={
        "Content-Type": "application/json",
        "x-litellm-api-key": "Bearer sk-1234"
    },
    json={"query": "pricing", "pageSize": 10}
)

for result in response.json().get("results", []):
    data = result["document"]["derivedStructData"]
    print(f"{data['title']}: {data['link']}")
```

### 與 Chat Completion 搭配使用 {#use-with-chat-completion}

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "What is litellm?"}],
    "tools": [
        {
            "type": "file_search",
            "vector_store_ids": ["my-datastore"]
        }
    ]
  }'
```
