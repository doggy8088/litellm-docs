# 工具搜尋 {#tool-search}

工具搜尋可讓 Claude 依需求從大型工具目錄（10,000+ 工具）中動態探索並載入工具。Claude 不會一開始就將所有工具定義載入到內容視窗中，而是會搜尋您的工具目錄，僅載入所需的工具。

## 支援的提供者 {#supported-providers}

| 提供者 | Chat Completions API | Messages API |
|----------|---------------------|--------------|
| **Anthropic API** | ✅ | ✅ |
| **Azure Anthropic**（Microsoft Foundry） | ✅ | ✅ |
| **Google Cloud Vertex AI** | ✅ | ✅ |
| **Amazon Bedrock** | ✅（僅 Invoke API，僅 Opus 4.5） | ✅（僅 Invoke API，僅 Opus 4.5） |

## 優點 {#benefits}

- **內容效率**：避免工具定義大量消耗內容視窗
- **更佳的工具選擇**：Claude 的工具選擇準確度在超過 30-50 個工具時會下降。工具搜尋即使面對數千個工具也能維持準確度
- **依需求載入**：只有在 Claude 需要時才會載入工具

## 工具搜尋變體 {#tool-search-variants}

LiteLLM 支援兩種工具搜尋變體：

### 1. Regex 工具搜尋 (`tool_search_tool_regex_20251119`) {#1-regex-tool-search-tool_search_tool_regex_20251119}

Claude 會建構 regex 模式來搜尋工具。最適合精確模式比對（更快）。

### 2. BM25 工具搜尋 (`tool_search_tool_bm25_20251119`) {#2-bm25-tool-search-tool_search_tool_bm25_20251119}

Claude 使用自然語言查詢透過 BM25 演算法搜尋工具。最適合自然語言語意搜尋。

**注意**：Bedrock 不支援 BM25 變體。

---

## Chat Completions API {#chat-completions-api}

### SDK 使用方式 {#sdk-usage}

#### Regex 工具搜尋基本範例 {#basic-example-with-regex-tool-search}

```python showLineNumbers title="Basic Tool Search Example"
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[
        {"role": "user", "content": "What is the weather in San Francisco?"}
    ],
    tools=[
        # Tool search tool (regex variant)
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        # Deferred tool - will be loaded on-demand
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the weather at a specific location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"},
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"]
                        }
                    },
                    "required": ["location"]
                }
            },
            "defer_loading": True  # Mark for deferred loading
        }
    ]
)

print(response.choices[0].message.content)
```

#### BM25 工具搜尋範例 {#bm25-tool-search-example}

```python showLineNumbers title="BM25 Tool Search"
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[
        {"role": "user", "content": "Search for Python files containing 'authentication'"}
    ],
    tools=[
        # Tool search tool (BM25 variant)
        {
            "type": "tool_search_tool_bm25_20251119",
            "name": "tool_search_tool_bm25"
        },
        # Deferred tools...
        {
            "type": "function",
            "function": {
                "name": "search_codebase",
                "description": "Search through codebase files by content and filename",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "file_pattern": {"type": "string"}
                    },
                    "required": ["query"]
                }
            },
            "defer_loading": True
        }
    ]
)
```

#### Azure Anthropic 範例 {#azure-anthropic-example}

```python showLineNumbers title="Azure Anthropic Tool Search"
import litellm

response = litellm.completion(
    model="azure_anthropic/claude-sonnet-4-5",
    api_base="https://<your-resource>.services.ai.azure.com/anthropic",
    api_key="your-azure-api-key",
    messages=[
        {"role": "user", "content": "What's the weather like?"}
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current weather",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"}
                    },
                    "required": ["location"]
                }
            },
            "defer_loading": True
        }
    ]
)
```

#### Vertex AI 範例 {#vertex-ai-example}

```python showLineNumbers title="Vertex AI Tool Search"
import litellm

response = litellm.completion(
    model="vertex_ai/claude-sonnet-4-5",
    vertex_project="your-project-id",
    vertex_location="us-central1",
    messages=[
        {"role": "user", "content": "Search my documents"}
    ],
    tools=[
        {
            "type": "tool_search_tool_bm25_20251119",
            "name": "tool_search_tool_bm25"
        },
        # Your deferred tools...
    ]
)
```

#### 串流支援 {#streaming-support}

```python showLineNumbers title="Streaming with Tool Search"
import litellm

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[
        {"role": "user", "content": "Get the weather"}
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather information",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"}
                    },
                    "required": ["location"]
                }
            },
            "defer_loading": True
        }
    ],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### AI Gateway 使用方式 {#ai-gateway-usage}

透過 LiteLLM proxy，工具搜尋會自動運作。

#### Proxy 設定 {#proxy-configuration}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20250929
      api_key: os.environ/ANTHROPIC_API_KEY
```

#### 用戶端請求 {#client-request}

```python showLineNumbers title="Client Request via Proxy"
from anthropic import Anthropic

client = Anthropic(
    api_key="your-litellm-proxy-key",
    base_url="http://0.0.0.0:4000"
)

response = client.messages.create(
    model="claude-sonnet",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What's the weather?"}
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_weather",
            "description": "Get weather information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            },
            "defer_loading": True
        }
    ]
)
```

---

## Messages API {#messages-api}

Messages API 透過 `litellm.anthropic.messages` 介面提供原生 Anthropic 風格的工具搜尋支援。

### SDK 使用方式 {#sdk-usage-1}

#### 基本範例 {#basic-example}

```python showLineNumbers title="Messages API - Basic Tool Search"
import litellm

response = await litellm.anthropic.messages.acreate(
    model="anthropic/claude-sonnet-4-20250514",
    messages=[
        {
            "role": "user",
            "content": "What's the weather in San Francisco?"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_weather",
            "description": "Get the current weather for a location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    }
                },
                "required": ["location"]
            },
            "defer_loading": True
        }
    ],
    max_tokens=1024,
    extra_headers={"anthropic-beta": "advanced-tool-use-2025-11-20"}
)

print(response)
```

#### Azure Anthropic Messages 範例 {#azure-anthropic-messages-example}

```python showLineNumbers title="Azure Anthropic Messages API"
import litellm

response = await litellm.anthropic.messages.acreate(
    model="azure_anthropic/claude-sonnet-4-20250514",
    messages=[
        {
            "role": "user",
            "content": "What's the stock price of Apple?"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_stock_price",
            "description": "Get the current stock price for a ticker symbol",
            "input_schema": {
                "type": "object",
                "properties": {
                    "ticker": {
                        "type": "string",
                        "description": "The stock ticker symbol, e.g. AAPL"
                    }
                },
                "required": ["ticker"]
            },
            "defer_loading": True
        }
    ],
    max_tokens=1024,
    extra_headers={"anthropic-beta": "advanced-tool-use-2025-11-20"}
)
```

#### Vertex AI Messages 範例 {#vertex-ai-messages-example}

```python showLineNumbers title="Vertex AI Messages API"
import litellm

response = await litellm.anthropic.messages.acreate(
    model="vertex_ai/claude-sonnet-4@20250514",
    messages=[
        {
            "role": "user",
            "content": "Search the web for information about AI"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_bm25_20251119",
            "name": "tool_search_tool_bm25"
        },
        {
            "name": "search_web",
            "description": "Search the web for information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    }
                },
                "required": ["query"]
            },
            "defer_loading": True
        }
    ],
    max_tokens=1024,
    extra_headers={"anthropic-beta": "tool-search-tool-2025-10-19"}
)
```

#### Bedrock Messages 範例 {#bedrock-messages-example}

```python showLineNumbers title="Bedrock Messages API (Invoke)"
import litellm

response = await litellm.anthropic.messages.acreate(
    model="bedrock/invoke/anthropic.claude-opus-4-20250514-v1:0",
    messages=[
        {
            "role": "user",
            "content": "What's the weather?"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_weather",
            "description": "Get weather information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            },
            "defer_loading": True
        }
    ],
    max_tokens=1024,
    extra_headers={"anthropic-beta": "tool-search-tool-2025-10-19"}
)
```

#### 串流支援 {#streaming-support-1}

```python showLineNumbers title="Messages API - Streaming"
import litellm
import json

response = await litellm.anthropic.messages.acreate(
    model="anthropic/claude-sonnet-4-20250514",
    messages=[
        {
            "role": "user",
            "content": "What's the weather in Tokyo?"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_weather",
            "description": "Get weather information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            },
            "defer_loading": True
        }
    ],
    max_tokens=1024,
    stream=True,
    extra_headers={"anthropic-beta": "advanced-tool-use-2025-11-20"}
)

async for chunk in response:
    if isinstance(chunk, bytes):
        chunk_str = chunk.decode("utf-8")
        for line in chunk_str.split("\n"):
            if line.startswith("data: "):
                try:
                    json_data = json.loads(line[6:])
                    print(json_data)
                except json.JSONDecodeError:
                    pass
```

### AI Gateway 使用方式 {#ai-gateway-usage-1}

設定 proxy 使用 Messages API 端點。

#### Proxy 設定 {#proxy-configuration-1}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet-messages
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
```

#### 用戶端請求 {#client-request-1}

```python showLineNumbers title="Client Request via Proxy (Messages API)"
from anthropic import Anthropic

client = Anthropic(
    api_key="your-litellm-proxy-key",
    base_url="http://0.0.0.0:4000"
)

response = client.messages.create(
    model="claude-sonnet-messages",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "What's the weather?"
        }
    ],
    tools=[
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        {
            "name": "get_weather",
            "description": "Get weather information",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            },
            "defer_loading": True
        }
    ],
    extra_headers={"anthropic-beta": "advanced-tool-use-2025-11-20"}
)

print(response)
```

---

## 其他資源 {#additional-resources}

- [Anthropic 工具搜尋文件](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/tool-search)
- [LiteLLM 工具呼叫指南](https://docs.litellm.ai/docs/completion/function_call)
