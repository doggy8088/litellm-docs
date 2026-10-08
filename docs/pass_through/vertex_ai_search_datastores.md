# Vertex AI Search 資料儲存庫（透傳） {#vertex-ai-search-datastores-pass-through}

透過 LiteLLM 呼叫 Vertex AI Discovery Engine Search API，使用 Google 原生的請求與回應格式。

提供者文件：https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1/projects.locations.dataStores.servingConfigs/search

:::tip[想要改用統一 API？]
本頁面是透過 proxy 直接存取原始 Google API。若您想透過相容 OpenAI 的 `POST /v1/vector_stores/{id}/search` endpoint 查詢 datastore，或在 `/chat/completions` 中將其用於 RAG，請將其註冊為 [受管理的向量儲存庫](../vector_stores/managed_vector_stores.md)（提供者 `vertex_ai/search_api`）。
:::

## 您將獲得什麼 {#what-you-get}

- Discovery Engine API 的完整介面，保持不變。
- 在 proxy 上設定一次憑證，即可在各處使用。
- 如果 URL 中的 datastore id 已註冊為 [受管理的向量儲存庫](../vector_stores/managed_vector_stores.md)，LiteLLM 會自動從註冊資訊中解析其 project 與憑證。

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
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -d '{
    "query": "How do I authenticate?",
    "pageSize": 10
  }'
```

## 端點 {#endpoint}

`{PROXY_BASE_URL}/vertex_ai/discovery/{endpoint:path}`

路由至 `https://discoveryengine.googleapis.com`

## 範例 {#examples}

### 使用篩選條件搜尋 {#search-with-filters}

```bash
curl -X POST \
  "http://localhost:4000/vertex_ai/discovery/v1/projects/my-project/locations/global/collections/default_collection/dataStores/my-datastore/servingConfigs/default_config:search" \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
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
        "x-litellm-api-key": "Bearer sk-<your-litellm-api-key>"
    },
    json={"query": "pricing", "pageSize": 10}
)

for result in response.json().get("results", []):
    data = result["document"]["derivedStructData"]
    print(f"{data['title']}: {data['link']}")
```
