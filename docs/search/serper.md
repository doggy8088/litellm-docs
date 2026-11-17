---
title: "搭配 LiteLLM 使用 Serper Google Search API：設定"
sidebar_label: "Serper 搜尋"
description: "將 Serper 的 Google 結果加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，並可使用國家、語言與時間篩選。"
---
# Serper 搜尋 {#serper-search}

[Serper](https://serper.dev) 是 Google Search 結果的 API；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI 閘道上的 `/v1/search` 端點來提供它。

**取得 API 金鑰：** [https://serper.dev](https://serper.dev)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Serper Search"
import os
from litellm import search

os.environ["SERPER_API_KEY"] = "your-api-key"

response = search(
    query="latest AI developments",
    search_provider="serper",
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
  - search_tool_name: serper-search
    litellm_params:
      search_provider: serper
      api_key: os.environ/SERPER_API_KEY
```

### 2. 啟動代理伺服器 {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/serper-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 提供者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="Serper Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["SERPER_API_KEY"] = "your-api-key"

response = search(
    query="latest tech news",
    search_provider="serper",
    max_results=10,
    # Serper-specific parameters
    gl="us",                    # Country/geolocation code
    hl="en",                    # Language code
    autocorrect=False,          # Disable autocorrect
    tbs="qdr:d",               # Time filter: past day ('qdr:h' hour, 'qdr:w' week, 'qdr:m' month)
    page=2                      # Page number
)
```
