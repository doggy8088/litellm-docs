---
title: "搭配 LiteLLM 使用 DeepSeek Search API：設定"
sidebar_label: "DeepSeek 搜尋"
description: "使用 DEEPSEEK_API_KEY 將 DeepSeek 網路搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，並提供完整頁面內容。"
---
# DeepSeek 搜尋 {#deepseek-search}

**取得 API 金鑰：** [https://platform.deepseek.com](https://platform.deepseek.com)

DeepSeek 的 Search API（`POST https://api.deepseek.com/v1/tools/search`）使用與 DeepSeek 聊天模型相同的 `DEEPSEEK_API_KEY`。價格與限制請參閱 [DeepSeek Search 文件](https://api-docs.deepseek.com/guides/search/)。

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="DeepSeek Search"
import os
from litellm import search

os.environ["DEEPSEEK_API_KEY"] = "sk-..."

response = search(
    query="latest AI developments",
    search_provider="deepseek",
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
  - search_tool_name: deepseek-search
    litellm_params:
      search_provider: deepseek
      api_key: os.environ/DEEPSEEK_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/deepseek-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 參數對應 {#parameter-mapping}

`max_results` 會對應到 DeepSeek 的 `count`，並被限制在其 1 到 50 的範圍內。`search_domain_filter` 會以 `site:` 運算子加入查詢（`site:github.com OR site:huggingface.co`）。`country` 與 `max_tokens_per_page` 在 DeepSeek 沒有對應項目，會被捨棄。

每個結果除了帶有標準的 `title`、`url`、`snippet` 與 `date` 之外，還會依回傳內容帶有 DeepSeek 的 `summary`、`content`、`rerank_score`、`site_name`、`site_icon` 與 `authority` 欄位。

## 提供者專屬參數 {#provider-specific-parameters}

```python showLineNumbers title="DeepSeek Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["DEEPSEEK_API_KEY"] = "sk-..."

response = search(
    query="DeepSeek V4 release",
    search_provider="deepseek",
    max_results=5,
    # DeepSeek-specific parameters
    need_content=True,                       # Fill result.content with the page text
    ori_question="When was DeepSeek V4 released?",  # Original user question, used for reranking
    localization="en-US"                     # Preferred result language and region
)
```
