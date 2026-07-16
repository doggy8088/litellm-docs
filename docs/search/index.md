# 總覽 {#overview}

| 功能 | 支援 |
|---------|-----------|
| 支援的提供者 | `perplexity`, `tavily`, `parallel_ai`, `exa_ai`, `brave`, `google_pse`, `dataforseo`, `firecrawl`, `searxng`, `linkup`, `duckduckgo`, `searchapi`, `serper`, `you_com`, `apiserpent` |
| 成本追蹤 | ✅ |
| 記錄 | ✅ |
| 負載平衡 | ❌ |

:::tip

LiteLLM 遵循 [Search API 的 Perplexity API 請求/回應](https://docs.perplexity.ai/api-reference/search-post)

:::

:::info

自 LiteLLM v1.78.7+ 起支援
:::

## **LiteLLM Python SDK 用法** {#litellm-python-sdk-usage}
### 快速開始  {#quick-start}

```python showLineNumbers title="Basic Search"
from litellm import search
import os

os.environ["PERPLEXITYAI_API_KEY"] = "pplx-..."

response = search(
    query="latest AI developments in 2024",
    search_provider="perplexity",
    max_results=5
)

# Access search results
for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

### 非同步用法  {#async-usage}

```python showLineNumbers title="Async Search"
from litellm import asearch
import os, asyncio

os.environ["PERPLEXITYAI_API_KEY"] = "pplx-..."

async def search_async(): 
    response = await asearch(
        query="machine learning research papers",
        search_provider="perplexity",
        max_results=10,
        search_domain_filter=["arxiv.org", "nature.com"]
    )
    
    # Access search results
    for result in response.results:
        print(f"{result.title}: {result.url}")
        print(f"Snippet: {result.snippet}")

asyncio.run(search_async())
```

### 選用參數 {#optional-parameters}

```python showLineNumbers title="Search with Options"
response = search(
    query="AI developments",
    search_provider="perplexity",
    # Unified parameters (work across all providers)
    max_results=10,                         # Maximum number of results (1-20)
    search_domain_filter=["arxiv.org"],     # Filter to specific domains
    country="US",                           # Country code filter
    max_tokens_per_page=1024                # Max tokens per page
)
```

## **LiteLLM AI Gateway 用法** {#litellm-ai-gateway-usage}

LiteLLM 提供與 Perplexity API 相容的 `/search` 端點供搜尋請求使用。

**設定**

將以下內容加入您的 litellm proxy config.yaml

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: perplexity-search
    litellm_params:
      search_provider: perplexity
      api_key: os.environ/PERPLEXITYAI_API_KEY
  
  - search_tool_name: tavily-search
    litellm_params:
      search_provider: tavily
      api_key: os.environ/TAVILY_API_KEY
```

啟動 litellm

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 測試請求 {#test-request}

**選項 1：URL 中的搜尋工具名稱（建議 - 保持 body 與 Perplexity 相容）**

```bash showLineNumbers title="cURL Request"
curl http://0.0.0.0:4000/v1/search/perplexity-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments 2024",
    "max_results": 5,
    "search_domain_filter": ["arxiv.org", "nature.com"],
    "country": "US"
  }'
```

**選項 2：body 中的搜尋工具名稱**

```bash showLineNumbers title="cURL Request with search_tool_name in body"
curl http://0.0.0.0:4000/v1/search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "search_tool_name": "perplexity-search",
    "query": "latest AI developments 2024",
    "max_results": 5
  }'
```

### 負載平衡 {#load-balancing}

設定多個搜尋提供者以進行自動負載平衡和備援：

```yaml showLineNumbers title="config.yaml with load balancing"
search_tools:
  - search_tool_name: my-search
    litellm_params:
      search_provider: perplexity
      api_key: os.environ/PERPLEXITYAI_API_KEY
  
  - search_tool_name: my-search
    litellm_params:
      search_provider: tavily
      api_key: os.environ/TAVILY_API_KEY
  
  - search_tool_name: my-search
    litellm_params:
      search_provider: exa_ai
      api_key: os.environ/EXA_API_KEY

  - search_tool_name: my-search
    litellm_params:
      search_provider: brave
      api_key: os.environ/BRAVE_API_KEY

router_settings:
  routing_strategy: simple-shuffle  # or 'least-busy', 'latency-based-routing'
```

使用負載平衡進行測試：

```bash
curl http://0.0.0.0:4000/v1/search/my-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI developments",
    "max_results": 10
  }'
```

## **請求/回應格式** {#requestresponse-format}

:::info

LiteLLM 遵循 **Perplexity Search API 規格**。 

請參閱 [Perplexity Search 官方文件](https://docs.perplexity.ai/api-reference/search-post) 以取得完整詳細資訊。

:::

### 請求範例 {#example-request}

```json showLineNumbers title="Search Request"
{
  "query": "latest AI developments 2024",
  "max_results": 10,
  "search_domain_filter": ["arxiv.org", "nature.com"],
  "country": "US",
  "max_tokens_per_page": 1024
}
```

### 請求參數 {#request-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `query` | string 或 array | 是 | 搜尋查詢。可以是單一字串或字串陣列 |
| `search_provider` | string | 是（SDK） | 要使用的搜尋提供者：`"perplexity"`、`"tavily"`、`"parallel_ai"`、`"exa_ai"`、`"brave"`、`"google_pse"`、`"dataforseo"`、`"firecrawl"`、`"searxng"`、`"linkup"`、`"duckduckgo"`、`"searchapi"`、`"serper"`，或 `"you_com"` 或 `"apiserpent"` |
| `search_tool_name` | string | 是（Proxy） | 在 `config.yaml` 中設定的搜尋工具名稱 |
| `max_results` | integer | 否 | 要回傳的最大結果數量（1-20）。預設：10 |
| `search_domain_filter` | array | 否 | 用於篩選結果的網域清單（最多 20 個網域） |
| `max_tokens_per_page` | integer | 否 | 每頁要處理的最大 token 數量。預設：1024 |
| `country` | string | 否 | 國家/地區代碼篩選器（例如：`"US"`、`"GB"`、`"DE"`） |

**查詢格式範例：**

```python
# Single query
query = "AI developments"

# Multiple queries
query = ["AI developments", "machine learning trends"]
```

### 回應格式 {#response-format}

回應遵循 Perplexity 的搜尋格式，結構如下：

```json showLineNumbers title="Search Response"
{
  "object": "search",
  "results": [
    {
      "title": "Latest Advances in Artificial Intelligence",
      "url": "https://arxiv.org/paper/example",
      "snippet": "This paper discusses recent developments in AI...",
      "date": "2024-01-15"
    },
    {
      "title": "Machine Learning Breakthroughs",
      "url": "https://nature.com/articles/ml-breakthrough",
      "snippet": "Researchers have achieved new milestones...",
      "date": "2024-01-10"
    }
  ]
}
```

#### 回應欄位 {#response-fields}

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `object` | string | 搜尋回應一律為 `"search"` |
| `results` | array | 搜尋結果清單 |
| `results[].title` | string | 搜尋結果標題 |
| `results[].url` | string | 搜尋結果 URL |
| `results[].snippet` | string | 結果中的文字片段 |
| `results[].date` | string | 選用的發佈或最後更新日期 |

## **支援的提供者** {#supported-providers}

| 提供者 | 環境變數 | `search_provider` 值 |
|----------|---------------------|------------------------|
| Perplexity AI | `PERPLEXITYAI_API_KEY` | `perplexity` |
| Tavily | `TAVILY_API_KEY` | `tavily` |
| Exa AI | `EXA_API_KEY` | `exa_ai` |
| Brave Search | `BRAVE_API_KEY` | `brave` |
| Parallel AI | `PARALLEL_AI_API_KEY` | `parallel_ai` |
| Google PSE | `GOOGLE_PSE_API_KEY`, `GOOGLE_PSE_ENGINE_ID` | `google_pse` |
| DataForSEO | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | `dataforseo` |
| Firecrawl | `FIRECRAWL_API_KEY` | `firecrawl` |
| SearXNG | `SEARXNG_API_BASE`（必填） | `searxng` |
| Linkup | `LINKUP_API_KEY` | `linkup` |
| Serper | `SERPER_API_KEY` | `serper` |
| DuckDuckGo | `DUCKDUCKGO_API_BASE` | `duckduckgo` |
| SearchAPI.io | `SEARCHAPI_API_KEY` | `searchapi` |
| You.com | `YOUCOM_API_KEY` *（選用 — 無金鑰免費方案可省略）* | `you_com` |
| APISerpent | `APISERPENT_API_KEY` | `apiserpent` |

請參閱各個提供者的文件，以取得詳細的設定說明與提供者專屬參數。
