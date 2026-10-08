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
  - model_name: {{openai_large}}
    litellm_params:
      model: {{openai_large}}
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
  -H "Authorization: Bearer $LITELLM_API_KEY" \
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

## Web Search Interception {#web-search-interception}

當 Parallel AI 搜尋工具支援 [web search interception](../integrations/websearch_interception.md) 時，被攔截的 `litellm_web_search` 工具可選的 `objective` 與 `search_queries` 欄位會以 `objective` 和 `search_queries` 的形式轉送至 Parallel 的 v1 Search API，因此模型的一次工具呼叫會同時以多個關鍵字角度進行搜尋。Parallel AI 是目前唯一會接收這種更豐富結構的搜尋提供者；其他所有提供者都只會收到工具呼叫的單一 `query`。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY

search_tools:
  - search_tool_name: parallel-search
    litellm_params:
      search_provider: parallel_ai
      api_key: os.environ/PARALLEL_AI_API_KEY
      max_results: 5

litellm_settings:
  callbacks: ["websearch_interception"]
  websearch_interception_params:
    enabled_providers: ["anthropic"]
    search_tool_name: parallel-search
```

```bash showLineNumbers title="Request"
curl http://0.0.0.0:4000/v1/messages \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "What is the latest stable Node.js release and what changed in it?"}],
    "tools": [{"type": "web_search_20250305", "name": "web_search"}]
  }'
```

模型會看到 [三欄位 schema](../integrations/websearch_interception.md#the-search-tool-the-model-sees)，通常會將三者都填入。LiteLLM 接著會將模型的 `objective` 以及最多五個 `search_queries` 傳送給 Parallel；超過第五個的查詢會在請求送出前被捨棄，符合 Parallel 的上限。

```json title="Outbound Parallel AI request"
{
  "objective": "Find the most current stable Node.js release version and what changes were included in that release",
  "search_queries": ["latest stable Node.js release", "Node.js newest version changelog", "current Node.js LTS release"],
  "mode": "basic",
  "advanced_settings": {"max_results": 5}
}
```

當模型只填入 `query`，或您以單一 `query` 字串呼叫 `/v1/search/parallel-search` 時，該字串會同時以一個元素的 `search_queries` 清單和 `objective` 送出。直接搜尋呼叫中的 `query` 字串清單也會以相同方式對應到 `search_queries`，並且只有在您提供 `objective` 時才會一併傳入。搜尋工具的 `litellm_params` 中設定的 `objective` 會保留在每次請求中，而模型的會被捨棄。
