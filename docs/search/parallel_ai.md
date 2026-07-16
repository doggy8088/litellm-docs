# 平行 AI 搜尋 {#parallel-ai-search}

**取得 API 金鑰：** [https://www.parallel.ai](https://www.parallel.ai)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Parallel AI Search"
import os
from litellm import search

os.environ["PARALLEL_AI_API_KEY"] = "..."

response = search(
    query="latest AI developments",
    search_provider="parallel_ai",
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
  - search_tool_name: parallel-search
    litellm_params:
      search_provider: parallel_ai
      api_key: os.environ/PARALLEL_AI_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/parallel-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 提供者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="Parallel AI Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["PARALLEL_AI_API_KEY"] = "..."

response = search(
    query="latest developments in quantum computing",
    search_provider="parallel_ai",
    max_results=5,
    # Parallel AI-specific parameters
    processor="pro",                 # 'base' or 'pro'
    max_chars_per_result=500         # Max characters per result
)
```
