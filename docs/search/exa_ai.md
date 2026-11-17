---
title: "搭配 LiteLLM 使用 Exa AI Search API：Python 與閘道"
sidebar_label: "Exa AI 搜尋"
description: "將 Exa AI 搜尋加入 LiteLLM：在 Python SDK 中呼叫 search()，或在 AI 閘道上使用 /v1/search，支援神經或關鍵字搜尋與結果 highlights。"
---
# Exa AI 搜尋 {#exa-ai-search}

[Exa](https://exa.ai) 是為 AI 應用程式打造的搜尋引擎，支援神經（以嵌入為基礎）與關鍵字搜尋；LiteLLM 透過 Python SDK 中的單一 `search()` 呼叫，以及 AI 閘道上的 `/v1/search` 端點來提供它。

**取得 API 金鑰：** [https://exa.ai](https://exa.ai)

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Exa AI Search"
import os
from litellm import search

os.environ["EXA_API_KEY"] = "exa-..."

response = search(
    query="latest AI developments",
    search_provider="exa_ai",
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
  - search_tool_name: exa-search
    litellm_params:
      search_provider: exa_ai
      api_key: os.environ/EXA_API_KEY
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/exa-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## 提供者特定參數 {#provider-specific-parameters}

```python showLineNumbers title="Exa AI Search with Provider-specific Parameters"
import os
from litellm import search

os.environ["EXA_API_KEY"] = "exa-..."

response = search(
    query="AI research papers",
    search_provider="exa_ai",
    max_results=10,
    search_domain_filter=["arxiv.org"],
    # Exa-specific parameters
    type="neural",                   # 'neural', 'keyword', or 'auto'
    contents={"text": True},         # Request text content
    use_autoprompt=True              # Enable Exa's autoprompt
)
```

## Exa 回應欄位 {#exa-response-fields}

Exa 結果帶有與其他每個搜尋提供者相同的 `title`、`url`、`snippet` 與 `date` 欄位。除此之外，只要 Exa 有回傳，每個結果都會保留 Exa 的 `highlights`、`highlight_scores` 與 `score`，而回應會將 Exa 傳送的每個頂層欄位（`results` 除外，例如 `requestId`、`searchTime` 與 `costDollars`）保留在 `provider_metadata` 之下。若 Exa 傳送的結果沒有這些欄位，該結果會保留樸素的形狀。

| 欄位 | 位置 | 出現時機 |
|-------|-------|--------------|
| `results[].highlights` | 每個結果 | 您請求 `contents.highlights` 時 |
| `results[].highlight_scores` | 每個結果 | Exa 為 highlights 評分時 |
| `results[].score` | 每個結果 | 您使用 `type="neural"` 時 |
| `provider_metadata` | 回應 | 每個 Exa 回應 |

`highlights` 是 Exa 從頁面中挑選、與您的查詢最相符的句子。當您請求 highlights 而不請求 text 時，`snippet` 就是這些 highlights 連接起來的內容。`provider_metadata.costDollars` 是 Exa 為該次呼叫收取的費用，因此您可以將它與 LiteLLM 在 `x-litellm-response-cost` 與支出記錄中追蹤的成本核對。

```python showLineNumbers title="Exa AI Search with highlights"
import os
from litellm import search

os.environ["EXA_API_KEY"] = "exa-..."

response = search(
    query="regional bank net interest margin outlook",
    search_provider="exa_ai",
    max_results=2,
    type="neural",
    contents={"highlights": {"numSentences": 1}},
)

for result in response.results:
    print(result.score, result.highlights)

print(response.provider_metadata["costDollars"])
```

```bash showLineNumbers title="Same request through the AI Gateway"
curl http://0.0.0.0:4000/v1/search/exa-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "regional bank net interest margin outlook",
    "max_results": 2,
    "type": "neural",
    "contents": {"highlights": {"numSentences": 1}}
  }'
```

```json title="Response"
{
  "object": "search",
  "results": [
    {
      "title": "Q2 earnings: net interest margin up 1 basis point",
      "url": "https://example.com/q2-earnings",
      "snippet": "Net interest income grew $9.3 million linked quarter.",
      "date": "2026-08-31T15:00:25.000Z",
      "last_updated": null,
      "highlights": ["Net interest income grew $9.3 million linked quarter."],
      "score": 0.42
    }
  ],
  "provider_metadata": {
    "requestId": "1c8916cb62f8d5a7d6ea19515a26d5dc",
    "resolvedSearchType": "neural",
    "searchTime": 6.5,
    "costDollars": {"total": 0.004, "search": {"neural": 0.004}}
  }
}
```

網路搜尋攔截只會將每個結果的標題、URL 與片段傳給模型，因此這些額外欄位永遠不會進入模型的上下文。
