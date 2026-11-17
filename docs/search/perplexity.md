---
title: "搭配 LiteLLM 使用 Perplexity Search API：設定"
sidebar_label: "Perplexity AI 搜尋"
description: "將 Perplexity 網路搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，並使用 PERPLEXITYAI_API_KEY 與 max_results。"
---
# Perplexity AI 搜尋 {#perplexity-ai-search}

[Perplexity Search API](https://docs.perplexity.ai/api-reference/search-post) 會從 Perplexity 的搜尋索引回傳經排名的網路結果；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI 閘道上的 `/v1/search` 端點來提供它。

**取得 API 金鑰：** [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Perplexity Search"
import os
from litellm import search

os.environ["PERPLEXITYAI_API_KEY"] = "pplx-..."

response = search(
    query="latest AI developments",
    search_provider="perplexity",
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
  - search_tool_name: perplexity-search
    litellm_params:
      search_provider: perplexity
      api_key: os.environ/PERPLEXITYAI_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/perplexity-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```
