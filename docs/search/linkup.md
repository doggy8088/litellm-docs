---
title: "搭配 LiteLLM 使用 Linkup Search API：Python 與閘道"
sidebar_label: "Linkup 搜尋"
description: "將 Linkup 網路搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，支援深度搜尋、附來源的答案與日期篩選。"
---
# Linkup 搜尋 {#linkup-search}

[Linkup](https://linkup.so) 是網路搜尋 API，可為 AI 應用程式回傳搜尋結果或附來源的答案；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI 閘道上的 `/v1/search` 端點來提供它。

**取得 API 金鑰：** [https://linkup.so](https://linkup.so)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Linkup Search"
import os
from litellm import search

os.environ["LINKUP_API_KEY"] = "..."

response = search(
    query="latest AI developments",
    search_provider="linkup",
    max_results=5
)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: linkup-search
    litellm_params:
      search_provider: linkup
      api_key: os.environ/LINKUP_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/linkup-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## Provider-specific 參數 {#provider-specific-parameters}

```python showLineNumbers title="Linkup Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["LINKUP_API_KEY"] = "..."

response = search(
    query="machine learning research",
    search_provider="linkup",
    max_results=10,
    # Linkup-specific parameters
    depth="deep",                      # "standard" (faster) or "deep" (more comprehensive)
    outputType="searchResults",        # "searchResults", "sourcedAnswer", or "structured"
    includeSources=True,               # Include sources in response
    includeImages=True,                # Include images in results
    fromDate="2024-01-01",             # Start date filter (YYYY-MM-DD)
    toDate="2024-12-31",               # End date filter (YYYY-MM-DD)
    includeDomains=["arxiv.org", "nature.com"],  # Domains to search (max 100)
    excludeDomains=["wikipedia.com"],  # Domains to exclude
    includeInlineCitations=True,       # Include inline citations in sourcedAnswer
)
```

## 功能 {#features}

Linkup 提供強大的網頁搜尋與內容擷取能力：

### 搜尋深度 {#search-depth}
控制您搜尋的精確度與速度：
- `standard` - 回傳結果較快
- `deep` - 耗時較長，但回傳更完整的結果

### 輸出類型 {#output-types}
選擇結果的格式：
- `searchResults` - 回傳包含 URL 與內容的搜尋結果清單
- `sourcedAnswer` - 回傳附帶來源的 AI 生成答案
- `structured` - 以自訂 JSON schema 格式回傳結果

### 日期篩選 {#date-filtering}
依日期範圍篩選結果：
```python
response = search(
    query="AI developments",
    search_provider="linkup",
    fromDate="2024-06-01",
    toDate="2024-12-31"
)
```

### 網域篩選 {#domain-filtering}
包含或排除特定網域：
```python
response = search(
    query="research papers",
    search_provider="linkup",
    includeDomains=["arxiv.org", "nature.com", "ieee.org"],
    excludeDomains=["wikipedia.com"]
)
```

### 結構化輸出 {#structured-output}
以自訂 JSON schema 格式取得結果：
```python
response = search(
    query="Microsoft 2024 revenue",
    search_provider="linkup",
    outputType="structured",
    structuredOutputSchema='{"type": "object", "properties": {"revenue": {"type": "string"}, "year": {"type": "string"}}}'
)
```

## 成本 {#cost}

LiteLLM 會依據 [model cost map](/docs/proxy/model_cost_map) 為每次 Linkup 搜尋計價。以 `depth: "deep"` 傳送的搜尋會以 `linkup/search-deep` 項目計費，而 `standard` 搜尋（或未指定 `depth` 的搜尋）則以 `linkup/search` 計費。此規則適用於 SDK、proxy 上的每個 `/search` 路由，以及 proxy 為[網路搜尋攔截](/docs/integrations/websearch_interception)執行的網路搜尋。

若要為兩種深度都以您自己的費率計費，請在搜尋工具上設定 `input_cost_per_query`，如 [Custom Per-Query Pricing](/docs/search#custom-per-query-pricing) 所述。您以 `litellm.register_model` 為 `linkup/search` 註冊的價格，會持續套用到深度搜尋，直到您也註冊 `linkup/search-deep` 為止。

## 回應格式 {#response-format}

Linkup 會以以下格式回傳結果：

```json
{
  "results": [
    {
      "type": "text",
      "name": "Microsoft 2024 Annual Report",
      "url": "https://www.microsoft.com/investor/reports/ar24/index.html",
      "content": "Highlights from fiscal year 2024..."
    }
  ]
}
```

LiteLLM 會將其轉換為標準的 `SearchResponse` 格式：
- `results[].name` → `SearchResult.title`
- `results[].url` → `SearchResult.url`
- `results[].content` → `SearchResult.snippet`
