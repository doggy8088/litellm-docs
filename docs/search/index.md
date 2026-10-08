# 總覽 {#overview}

| 功能 | 支援 | 
|---------|-----------|
| 支援的提供者 | `perplexity`, `tavily`, `parallel_ai`, `exa_ai`, `brave`, `google_pse`, `dataforseo`, `firecrawl`, `searxng`, `linkup`, `duckduckgo`, `searchapi`, `serper`, `you_com`, `apiserpent`, `agentcore`, `nimble`, `bing_grounding` |
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

若要使用 [Parallel AI Search](./parallel_ai.md)，請設定 `PARALLEL_API_KEY` 並傳入 `search_provider="parallel_ai"`。

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
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
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

  - search_tool_name: parallel-search
    litellm_params:
      search_provider: parallel_ai
      api_key: os.environ/PARALLEL_API_KEY
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "search_tool_name": "perplexity-search",
    "query": "latest AI developments 2024",
    "max_results": 5
  }'
```

### 負載平衡 {#load-balancing}

讓多個搜尋工具使用相同的 `search_tool_name` 以在它們之間進行負載平衡。每個請求會隨機選取一個符合條件的工具。`router_settings.routing_strategy` 不適用於搜尋工具，因此像 `least-busy` 或 `latency-based-routing` 這類策略，對哪個提供者提供搜尋請求沒有影響

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
```

使用負載平衡進行測試：

```bash
curl http://0.0.0.0:4000/v1/search/my-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI developments",
    "max_results": 10
  }'
```

### 限制搜尋工具存取 {#restrict-search-tool-access}

在 key 或 team 的 `object_permission` 底下設定 `search_tools`，以限制其可呼叫的搜尋工具。允許清單適用於 `/search`、`/v1/search`、`/search/{search_tool_name}`、網頁搜尋攔截、搜尋工具之間的路由備援，以及 `/search_tools/list`

```bash showLineNumbers title="Grant a team one search tool"
curl http://0.0.0.0:4000/team/new \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "team_alias": "research",
    "object_permission": {"search_tools": ["tavily-search"]}
  }'
```

預設情況下，空白或缺少的 `search_tools` 清單會允許所有搜尋工具。若要讓所有搜尋工具都採取 opt-in，請開啟 `search_tool_deny_by_default`：

```yaml showLineNumbers title="config.yaml"
general_settings:
  search_tool_deny_by_default: true
```

此設定預設為 `false`。啟用後，請求的搜尋工具必須列在請求所解析到之每個身分的 `object_permission.search_tools` 中

| 呼叫端 | 需要的授權 |
|---|---|
| 沒有 team 的虛擬 key | 該 key |
| 有 team 的虛擬 key | 該 key 及其 team |
| 沒有虛擬 key 的 team 成員（JWT 或 `lite login` session） | 請求所解析到的 team |
| 沒有虛擬 key 或 team 的使用者 | 該使用者 |

缺少權限記錄、`null` 清單，以及空白清單都不會授予任何權限。只有當請求沒有虛擬 key 也沒有 team 時，使用者的個人授權才會生效，因此它們永遠不會擴大或縮小 key 或 team 的請求。如果某個 key 指定了無法載入的 team，請求會遭拒絕，而不是被視為沒有 team 的 key。被拒絕的請求會在呼叫任何搜尋提供者之前回傳 `403`，並附帶 `key_search_tool_access_denied`、`team_search_tool_access_denied` 或 `user_search_tool_access_denied`，而 `/search_tools/list` 只會回傳呼叫端可呼叫的工具

對於 team key，請在兩個物件上都授予該工具：

```bash showLineNumbers title="Team and key both grant the search tool"
curl -X POST 'http://localhost:4000/team/new' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_alias": "research", "object_permission": {"search_tools": ["tavily-search"]}}'

curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"team_id": "<team_id from above>", "object_permission": {"search_tools": ["tavily-search"]}}'
```

master key 和 dashboard 登入 session 不受限制。使用自己的虛擬 key 呼叫的 proxy 管理員會像其他任何 key 一樣受到限制。若沒有註冊的搜尋工具，對網頁搜尋攔截的處理會停止為每個受限呼叫端回退到預設提供者，因為沒有可供授權清單列出的工具名稱。現有的空白清單 key 和 team 只要此設定一開啟就會失去搜尋存取權

將旗標改回 `false` 會恢復先前的行為，也就是空白或未設定的清單表示不受限制。若非空白的 `search_tools` 清單沒有包含所要求的工具，仍會遭到拒絕

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
| `search_provider` | string | 是（SDK） | 要使用的搜尋提供者：`"perplexity"`、`"tavily"`、`"parallel_ai"`、`"exa_ai"`、`"brave"`、`"google_pse"`、`"dataforseo"`、`"firecrawl"`、`"searxng"`、`"linkup"`、`"duckduckgo"`、`"searchapi"`、`"serper"`，或 `"you_com"` 或 `"apiserpent"` 或 `"agentcore"` 或 `"bing_grounding"` |
| `search_tool_name` | string | 是（Proxy） | 在 `config.yaml` 中設定的搜尋工具名稱 |
| `max_results` | integer | 否 | 要回傳的最大結果數量（1-20）。預設值：10 |
| `search_domain_filter` | array | 否 | 用於篩選結果的網域清單（最多 20 個網域） |
| `max_tokens_per_page` | integer | 否 | 每頁要處理的最大 token 數。預設值：1024 |
| `country` | string | 否 | 國家代碼篩選器（例如 `"US"`、`"GB"`、`"DE"`） |

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
| Bedrock AgentCore | `AGENTCORE_GATEWAY_URL`（必填）、AWS 憑證或 `AGENTCORE_GATEWAY_TOKEN` | `agentcore` |
| Nimble | `NIMBLE_API_KEY` | `nimble` |
| Grounding with Bing (Microsoft Foundry) | `BING_GROUNDING_PROJECT_ENDPOINT`、`BING_GROUNDING_MODEL`（必填）、`api_key` 或 `BING_GROUNDING_TOKEN` 或 azure-identity | `bing_grounding` |

請參閱各個提供者的文件，以取得詳細的設定說明與提供者專屬參數。
