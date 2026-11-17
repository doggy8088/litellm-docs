---
title: "Brave Search API 與 LiteLLM：Python 與 Gateway"
sidebar_label: "Brave Search"
description: "將 Brave 網頁搜尋加入 LiteLLM：設定 BRAVE_API_KEY，在 Python SDK 中呼叫 search() 或在 AI Gateway 上呼叫 /v1/search，並在 config.yaml 中註冊。"
---
# Brave 搜尋 {#brave-search}

[Brave Search API](https://brave.com/search/api/) 會從 Brave 自家的獨立搜尋索引回傳網頁結果；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI Gateway 上的 `/v1/search` 端點來提供它。

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
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "query": "Brave browser features", "max_results": 5 }'
```
