# Brave 搜尋 {#brave-search}

先透過 https://brave.com/search/api/. 建立免費 API 金鑰開始使用

如需 Brave Search API 支援的其他參數文件，請造訪 https://api-dashboard.search.brave.com/api-reference/web/search/post.

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Brave Search"
import os
from litellm import search

os.environ["BRAVE_API_KEY"] = "BSATzx..."

response = search(
    query="Brave browser features",
    search_provider="brave",
    max_results=5
)
```

## LiteLLM AI Gateway {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: brave-search
    litellm_params:
      search_provider: brave
      api_key: os.environ/BRAVE_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/brave-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{ "query": "Brave browser features", "max_results": 5 }'
```
