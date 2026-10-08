# Nimble 搜尋 {#nimble-search}

**取得 API 金鑰：** [https://online.nimbleway.com/settings/api-keys](https://online.nimbleway.com/settings/api-keys)

:::info

支援自 LiteLLM v1.98.0+ 起
:::

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Nimble Search"
import os
from litellm import search

os.environ["NIMBLE_API_KEY"] = "..."

response = search(
    query="latest AI developments",
    search_provider="nimble",
    max_results=5
)
```

## LiteLLM AI 閘道 {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-5.6
    litellm_params:
      model: gpt-5.6
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: nimble-search
    litellm_params:
      search_provider: nimble
      api_key: os.environ/NIMBLE_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/nimble-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 供應商特定參數 {#provider-specific-parameters}

```python showLineNumbers title="Nimble Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["NIMBLE_API_KEY"] = "..."

response = search(
    query="latest tech news",
    search_provider="nimble",
    max_results=5,
    # Nimble-specific parameters
    focus="news",                    # 'serp', 'general', 'news', 'location', 'coding',
                                     # 'academic', 'geo', 'shopping', 'social'
    search_depth="deep",             # 'lite', 'fast', 'deep' ('fast' needs focus='general')
    time_range="week",               # 'hour', 'day', 'week', 'month', 'year'
    output_format="markdown"         # 'plain_text', 'markdown', 'simplified_html'
)
```

可透過統一的 `search_domain_filter` 來限制網域，其中 `-` 前綴會排除主機，或使用 Nimble 自身的 `include_domains` 和 `exclude_domains`；當兩者都提供時，後者會優先生效。請參閱 [Nimble Search API 參考文件](https://docs.nimbleway.com/api-reference/search/search)，以取得完整參數集合，包括 `content_type`、`start_date` 和 `end_date`。

將 `NIMBLE_API_BASE` 設為覆寫預設的 `https://sdk.nimbleway.com/v2` 端點。
