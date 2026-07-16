# You.com 搜尋 {#youcom-search}

**取得 API 金鑰（選用，用於更高的速率限制）：** [https://you.com/docs](https://you.com/docs)

You.com 提供兩種方案：

| 模式 | 端點 | 驗證 | 限制 |
|---|---|---|---|
| **無金鑰免費方案**（預設） | `https://api.you.com/v1/agents/search` | 無 | 受 IP 節流，約每天 100 次查詢 |
| **有金鑰方案** | `https://ydc-index.io/v1/search` | `X-API-Key` | 更高的速率限制 |

如果未設定 `YOUCOM_API_KEY`，適配器會自動使用無金鑰端點 — 開始使用無需註冊。

## LiteLLM Python SDK {#litellm-python-sdk}

### 無金鑰（零設定） {#keyless-zero-config}

```python showLineNumbers title="You.com Search - keyless"
from litellm import search

response = search(
    query="latest AI developments",
    search_provider="you_com",
    max_results=5
)

for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

### 使用 API 金鑰（更高限制） {#with-api-key-higher-limits}

```python showLineNumbers title="You.com Search - keyed"
import os
from litellm import search

os.environ["YOUCOM_API_KEY"] = "sk-..."

response = search(
    query="latest AI developments",
    search_provider="you_com",
    max_results=5
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
  - search_tool_name: you-com-search
    litellm_params:
      search_provider: you_com
      # api_key optional - omit to use the keyless free tier
      api_key: os.environ/YOUCOM_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/you-com-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 統一參數 {#unified-parameters}

You.com 支援標準的 Perplexity 統一規格參數：

```python showLineNumbers title="You.com Search with unified parameters"
from litellm import search

response = search(
    query="machine learning research",
    search_provider="you_com",
    max_results=10,                              # -> count
    search_domain_filter=["arxiv.org"],          # -> include_domains
    country="US"                                 # -> country (lowercased)
)
```

| 統一規格參數 | 對應到 You.com 參數 |
|---|---|
| `max_results` | `count` |
| `search_domain_filter` | `include_domains` |
| `country` | `country`（轉為小寫） |
| `max_tokens_per_page` | _忽略（無對應項）_ |

## 提供者專屬參數 {#provider-specific-parameters}

您可以將任何 You.com 專屬參數作為關鍵字引數傳入；無法辨識的參數會轉送到上游請求本文：

```python showLineNumbers title="You.com Search with provider-specific parameters"
from litellm import search

response = search(
    query="AI breakthroughs",
    search_provider="you_com",
    # You.com-specific parameters (passed through verbatim)
    freshness="week",                            # 'day', 'week', 'month', 'year', or date range
    exclude_domains=["example.com"],
    language="en"
)
```

## 回應注意事項 {#response-notes}

You.com 的 API 會回傳分成 `web` 和 `news` 陣列的結果。LiteLLM 適配器會將兩者攤平成單一有序的 `results` 清單（先網頁，再新聞），使回應符合統一的 [`SearchResponse`](./index#response-format) 格式。

針對每個結果：
- `snippet` 會優先採用上游 `snippets` 陣列中的第一個項目；備援為 `description`。
- `date` 會從上游 `page_age` 填入（ISO 8601 datetime）。
