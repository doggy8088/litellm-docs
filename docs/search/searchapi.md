# SearchAPI.io（Google 搜尋） {#searchapiio-google-search}

請先透過 https://www.searchapi.io/. 建立免費 API 金鑰開始使用

SearchAPI.io 提供可透過簡單 API 存取 Google 搜尋結果的功能。它支援所有 Google 搜尋參數，包括地點、語言、時間篩選等。

如需所有支援參數的完整文件，請造訪 https://www.searchapi.io/docs/google.

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="SearchAPI.io Search"
import os
from litellm import search

os.environ["SEARCHAPI_API_KEY"] = "your-api-key"

response = search(
    query="latest AI developments",
    search_provider="searchapi",
    max_results=10
)

# Access search results
for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

### 搭配 SearchAPI.io 參數的進階用法 {#advanced-usage-with-searchapiio-parameters}

SearchAPI.io 支援許多 Google 搜尋專屬參數：

```python showLineNumbers title="Advanced SearchAPI.io Parameters"
import os
from litellm import search

os.environ["SEARCHAPI_API_KEY"] = "your-api-key"

response = search(
    query="machine learning research",
    search_provider="searchapi",
    max_results=10,
    # Unified parameters
    country="US",
    search_domain_filter=["arxiv.org", "nature.com"],
    # SearchAPI.io specific parameters
    gl="us",              # Country code
    hl="en",              # Interface language
    time_period="last_month",  # Time filter
    safe="active",        # SafeSearch
    device="desktop",     # Device type
    location="New York"   # Geographic location
)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: google-search
    litellm_params:
      search_provider: searchapi
      api_key: os.environ/SEARCHAPI_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/google-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 10,
    "country": "US"
  }'
```

## SearchAPI.io 專屬參數 {#searchapiio-specific-parameters}

SearchAPI.io 支援許多 Google 搜尋參數。以下是一些常用項目：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `gl` | string | 國家代碼（例如 'us'、'uk'、'de'） |
| `hl` | string | 介面語言（例如 'en'、'es'、'fr'） |
| `location` | string | 地理位置（例如 'New York'、'London'） |
| `device` | string | 裝置類型：'desktop'、'mobile'、'tablet' |
| `time_period` | string | 時間篩選：'last_hour'、'last_day'、'last_week'、'last_month'、'last_year' |
| `time_period_min` | string | 開始日期（MM/DD/YYYY） |
| `time_period_max` | string | 結束日期（MM/DD/YYYY） |
| `safe` | string | SafeSearch：'active' 或 'off' |
| `lr` | string | 語言限制（例如 'lang_en'、'lang_es'） |
| `cr` | string | 國家限制 |
| `page` | integer | 分頁的頁碼 |

### 具時間篩選的範例 {#example-with-time-filters}

```python showLineNumbers title="Search with Time Filter"
response = search(
    query="AI breakthroughs",
    search_provider="searchapi",
    max_results=10,
    time_period="last_month"
)
```

### 具自訂日期範圍的範例 {#example-with-custom-date-range}

```python showLineNumbers title="Search with Custom Date Range"
response = search(
    query="AI research papers",
    search_provider="searchapi",
    max_results=10,
    time_period_min="01/01/2024",
    time_period_max="03/01/2024"
)
```

### 具地點的範例 {#example-with-location}

```python showLineNumbers title="Search with Location"
response = search(
    query="AI conferences",
    search_provider="searchapi",
    max_results=10,
    location="San Francisco",
    gl="us"
)
```

## 回應格式 {#response-format}

SearchAPI.io 會以標準 LiteLLM 搜尋格式回傳結果：

```json
{
  "object": "search",
  "results": [
    {
      "title": "Latest AI Developments",
      "url": "https://example.com/ai-news",
      "snippet": "Recent breakthroughs in artificial intelligence...",
      "date": "2024-01-15"
    }
  ]
}
```

## 速率限制 {#rate-limits}

SearchAPI.io 依據您的方案提供不同的速率限制：
- 免費方案：每月 100 次請求
- 付費方案：提供更高限制

請至 https://www.searchapi.io/dashboard. 查看您目前的使用量

## 錯誤處理 {#error-handling}

```python showLineNumbers title="Error Handling"
from litellm import search
import os

os.environ["SEARCHAPI_API_KEY"] = "your-api-key"

try:
    response = search(
        query="test query",
        search_provider="searchapi",
        max_results=10
    )
    print(f"Found {len(response.results)} results")
except Exception as e:
    print(f"Search failed: {str(e)}")
```

## 其他資源 {#additional-resources}

- SearchAPI.io 文件：https://www.searchapi.io/docs
- API 儀表板：https://www.searchapi.io/dashboard
- 定價：https://www.searchapi.io/pricing
