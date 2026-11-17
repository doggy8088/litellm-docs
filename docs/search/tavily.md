---
title: "搭配 LiteLLM 使用 Tavily Search API：Python 與閘道"
sidebar_label: "Tavily 搜尋"
description: "將 Tavily 網路搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，支援 topic、search_depth 與原始頁面內容。"
---
# Tavily 搜尋 {#tavily-search}

[Tavily](https://tavily.com) 是為 AI 代理程式與 LLM 應用程式打造的網路搜尋 API；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI 閘道上的 `/v1/search` 端點來提供它。

**取得 API 金鑰：** [https://tavily.com](https://tavily.com)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Tavily Search"
import os
from litellm import search

os.environ["TAVILY_API_KEY"] = "tvly-..."

response = search(
    query="latest AI developments",
    search_provider="tavily",
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
  - search_tool_name: tavily-search
    litellm_params:
      search_provider: tavily
      api_key: os.environ/TAVILY_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/tavily-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 提供者專屬參數 {#provider-specific-parameters}

```python showLineNumbers title="Tavily Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["TAVILY_API_KEY"] = "tvly-..."

response = search(
    query="latest tech news",
    search_provider="tavily",
    max_results=5,
    # Tavily-specific parameters
    topic="news",                    # 'general', 'news', 'finance'
    search_depth="advanced",         # 'basic', 'advanced'
    include_answer=True,             # Include AI-generated answer
    include_raw_content="markdown",  # Full page content, also accepts True or "text"
    include_images=True,
    include_favicon=True
)
```

## 回應 {#response}

Tavily 回應保留標準的 `title`、`url` 與 `snippet` 欄位。`snippet` 仍是 Tavily 的 `content`，而 `raw_content` 則包含以 `include_raw_content` 請求的完整頁面內容。結果欄位 `raw_content`、`score` 與 `favicon` 會在 Tavily 回傳它們時被包含在內。

```json title="Tavily search response"
{
  "object": "search",
  "results": [
    {
      "title": "Example article",
      "url": "https://example.com/article",
      "snippet": "A short excerpt from the article.",
      "date": null,
      "last_updated": null,
      "raw_content": "# Example article\n\nFull page content.",
      "score": 0.95,
      "favicon": "https://example.com/favicon.ico"
    }
  ],
  "provider_metadata": {
    "query": "latest tech news",
    "answer": "An answer based on the search results.",
    "images": ["https://example.com/image.png"],
    "request_id": "example-request-id",
    "response_time": 0.8
  }
}
```

`provider_metadata` 會保留除了 `results` 之外的每個頂層 Tavily 欄位。視請求與 Tavily 的回應而定，這包括 `answer`、`images`、`request_id`、`response_time` 與 `usage`。請求 `include_answer`、`include_images` 或 `include_favicon` 即可要求 Tavily 提供這些選用值。相同的回應對應同時適用於 Python SDK 與閘道搜尋端點。

## 成本 {#cost}

LiteLLM 會依據 [model cost map](/docs/proxy/model_cost_map) 為每次 Tavily 搜尋計價。以 `search_depth: "advanced"` 傳送的搜尋會以 `tavily/search-advanced` 項目計費，這與 Tavily 對它收取的 2 點額度相符；而以任何其他深度（或未指定深度）傳送的搜尋則以 `tavily/search` 計費。此規則適用於 SDK、proxy 上的每個 `/search` 路由，以及 proxy 為[網路搜尋攔截](/docs/integrations/websearch_interception)執行的網路搜尋。

若要為每種深度都以您自己的費率計費，請在搜尋工具上設定 `input_cost_per_query`，如 [Custom Per-Query Pricing](/docs/search#custom-per-query-pricing) 所述。您以 `litellm.register_model` 為 `tavily/search` 註冊的價格，會持續套用到進階搜尋，直到您也註冊 `tavily/search-advanced` 為止。
