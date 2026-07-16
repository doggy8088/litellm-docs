# APISerpent 搜尋 {#apiserpent-search}

**取得 API 金鑰：** [https://apiserpent.com](https://apiserpent.com)

[APISerpent](https://apiserpent.com) 是一個多引擎 SERP API（Google、Bing、Yahoo、DuckDuckGo），具有兩個端點，並可透過 `deep` 旗標選擇：

| 模式 | 端點 | `deep` | 結果 |
|---|---|---|---|
| **快速搜尋**（預設） | `https://apiserpent.com/api/search/quick` | `False` | `num` 1–100 |
| **深度搜尋** | `https://apiserpent.com/api/search` | `True` | `num` 10–100 |

兩種模式的計費皆為每 1k 次搜尋 $0.60。

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="APISerpent Search"
import os
from litellm import search

os.environ["APISERPENT_API_KEY"] = "your-api-key"

response = search(
    query="latest AI developments",
    search_provider="apiserpent",
    max_results=5
)

for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

### 深度搜尋 {#deep-search}

```python showLineNumbers title="APISerpent Deep Search"
from litellm import search

response = search(
    query="open source vector databases comparison",
    search_provider="apiserpent",
    deep=True,            # routes to /api/search
    max_results=20
)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-5
    litellm_params:
      model: gpt-5
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: apiserpent-search
    litellm_params:
      search_provider: apiserpent
      api_key: os.environ/APISERPENT_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/apiserpent-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 統一參數 {#unified-parameters}

APISerpent 支援標準的 Perplexity 統一規格參數：

```python showLineNumbers title="APISerpent Search with unified parameters"
from litellm import search

response = search(
    query="machine learning research",
    search_provider="apiserpent",
    max_results=10,                              # -> num (clamped to the endpoint range)
    search_domain_filter=["arxiv.org"],          # -> site: filters appended to the query
    country="US"                                 # -> country (lowercased)
)
```

| 統一規格參數 | 對應至 APISerpent 參數 |
|---|---|
| `max_results` | `num`（限制：快速搜尋 1–100、深度搜尋 10–100） |
| `search_domain_filter` | 附加至 `q` 的 `site:` 子句 |
| `country` | `country`（轉為小寫） |
| `max_tokens_per_page` | _忽略（無對應項）_ |

## 提供者特定參數 {#provider-specific-parameters}

可將任何 APISerpent 特定參數作為關鍵字引數傳遞：

```python showLineNumbers title="APISerpent Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["APISERPENT_API_KEY"] = "your-api-key"

response = search(
    query="elektroauto reichweite",
    search_provider="apiserpent",
    max_results=10,
    # APISerpent-specific parameters
    engine="bing",          # 'google' (default), 'bing', 'yahoo', or 'ddg'
    country="de",           # localized results
    language="de",          # 2-letter ISO language code
    freshness="d",          # time filter: 'h', 'd', '7d', 'w', 'm', 'y'
    safe="strict",          # SafeSearch: 'off', 'moderate', or 'strict'
    pages=2                 # pages to scrape (1-10)
)
```

| 參數 | 類型 | 說明 |
|---|---|---|
| `engine` | string | `google`（預設）、`bing`、`yahoo`、或 `ddg` |
| `country` | string | 本地化結果的國家代碼（預設 `us`） |
| `language` | string | 2 字母 ISO 語言代碼（例如 `en`、`es`、`de`） |
| `freshness` | string | 時間篩選器：`h`、`d`、`7d`、`w`、`m`、`y` |
| `safe` | string | SafeSearch：`off`、`moderate`、或 `strict` |
| `pages` | integer | 要抓取的頁數（1–10） |
| `format` | string | `full`（預設）或 `simple` |
| `pixel_position` | boolean | 包含像素座標（僅限付費方案） |

`num` 會被限制在其有效範圍內（快速搜尋 1–100、深度搜尋 10–100），且 `pages` 必須為 1–10；超出範圍的值會引發 `ValueError`。

## 回應說明 {#response-notes}

APISerpent 的完整格式回應會將結果巢狀放在 `results.organic` 下。LiteLLM adapter 會將每個自然結果的 `title`、`url` 和 `snippet` 對應到統一的 [`SearchResponse`](./index#response-format) 結構。
