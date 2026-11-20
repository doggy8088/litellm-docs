---
title: "在 LiteLLM 中使用 Anthropic 工具搜尋"
sidebar_label: "工具搜尋"
description: "透過 LiteLLM 使用 Claude 工具搜尋，從大型目錄依需求載入工具，在 Chat Completions、Messages 與 Responses 上提供 regex 與 BM25 變體。"
---

# 工具搜尋 {#tool-search}

工具搜尋可讓 Claude 依需求從大型工具目錄（10,000+ 工具）中動態探索並載入工具。Claude 不會一開始就將所有工具定義載入到內容視窗中，而是會搜尋您的工具目錄，僅載入所需的工具。

## 支援的提供者 {#supported-providers}

| 提供者 | Chat Completions API | Messages API | [Responses API](#responses-api) |
|----------|---------------------|--------------|---------------|
| **Anthropic API** | ✅ | ✅ | ✅ |
| **Azure Anthropic**（Microsoft Foundry） | ✅ | ✅ | ✅ |
| **Google Cloud Vertex AI** | ✅ | ✅ | ✅ |
| **Amazon Bedrock** | ✅（僅限 Invoke API，Claude 4.5 及更新版本） | ✅（僅限 Invoke API，Claude 4.5 及更新版本） | ✅（僅限 Invoke API，Claude 4.5 及更新版本） |

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

在 Amazon Bedrock 上，兩種變體都可透過 Invoke API（`bedrock/invoke/` 模型）運作，而非 Converse。在 [PR #52959](https://github.com/BerriAI/litellm/pull/52959) 之前，LiteLLM 會從 Bedrock Chat Completions 請求中捨棄 BM25 工具，因此如果 Bedrock 上的 Claude 用 BM25 找不到您延遲載入的工具，請升級。

---

## Chat Completions API {#chat-completions-api}

### SDK 使用方式 {#sdk-usage}

#### Regex 工具搜尋基本範例 {#basic-example-with-regex-tool-search}

```python showLineNumbers title="Basic Tool Search Example"
import litellm

response = litellm.completion(
    model="anthropic/{{anthropic}}",
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
    model="anthropic/{{anthropic}}",
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
    model="azure_anthropic/{{anthropic}}",
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
    model="vertex_ai/{{anthropic}}",
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

#### Bedrock 範例 {#bedrock-example}

```python showLineNumbers title="Bedrock Tool Search (Invoke)"
import litellm

response = litellm.completion(
    model="bedrock/invoke/global.anthropic.{{anthropic_large}}",
    messages=[
        {"role": "user", "content": "Where is my parcel? The tracking number is 1Z999AA10123456784."}
    ],
    tools=[
        {
            "type": "tool_search_tool_bm25_20251119",
            "name": "tool_search_tool_bm25"
        },
        {
            "type": "function",
            "function": {
                "name": "lookup_package_tracking",
                "description": "Look up the delivery status of a parcel by tracking number",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "tracking_number": {"type": "string"}
                    },
                    "required": ["tracking_number"]
                }
            },
            "defer_loading": True
        }
    ]
)
```

#### 串流支援 {#streaming-support}

```python showLineNumbers title="Streaming with Tool Search"
import litellm

response = litellm.completion(
    model="anthropic/{{anthropic}}",
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
      model: anthropic/{{anthropic}}
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
    model="anthropic/{{anthropic}}",
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
    model="azure_anthropic/{{anthropic}}",
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
    model="vertex_ai/{{anthropic}}",
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
    model="bedrock/invoke/global.anthropic.{{anthropic_large}}",
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
    model="anthropic/{{anthropic}}",
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
      model: anthropic/{{anthropic}}
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

## Responses API {#responses-api}

從 v1.107.0 起，OpenAI Responses API 呼叫者可以將 OpenAI 的 `tool_search` 工具傳送至 `/v1/responses` 上的 Claude 模型。LiteLLM 會改傳送 Claude 的 Anthropic regex 工具搜尋工具，並將 Claude 的搜尋結果以 `tool_search_call` 輸出項目回傳，讓同一個請求同時適用於 OpenAI 與 Claude 模型。

帶有 `"execution": "server"` 或未設定 `execution` 的 `{"type": "tool_search"}` 工具會變成 `tool_search_tool_regex_20251119`。函式工具會保留 `defer_loading`，`namespace` 工具的成員工具亦然。Claude 的搜尋結果會以 `tool_search_call` 項目的形式回傳，排在它所觸發的 `function_call` 之前。它的 `call_id` 是 Anthropic 的 `srvtoolu_` id，`id` 是 `tsc_` 加上該 id，`arguments` 是存放 Claude 搜尋模式的物件，`execution` 則是 `server`。串流回應會將它以 `response.output_item.added` 與 `response.output_item.done` 事件傳送，搜尋模式會出現在 `done` 事件中。

後續輪次可以將 `tool_search_call` 作為輸入項目，連同其餘輸出一起傳回；當 proxy [儲存工作階段](../response_api.md#session-management) 時，也可以使用 `previous_response_id`。LiteLLM 傳送給 Claude 的請求不會包含該搜尋呼叫，因此 Claude 只會看到函式呼叫及其輸出，而不會看到找到這些工具的搜尋過程；它的回答可能會表示自己未經搜尋就直接呼叫了某個工具。

此功能適用於 LiteLLM 會建立 Anthropic 請求的路由（Anthropic、Azure Anthropic、Vertex AI 與 Bedrock Invoke），前提是模型在成本對照表中的條目具有 `supports_tool_search`，涵蓋 Claude 4.5 及更新版本。在其他所有路由（包括 Bedrock Converse）上，LiteLLM 會丟棄 `tool_search` 工具、記錄一則警告，並在不帶 `defer_loading` 的情況下傳送函式工具。

OpenAI 工具搜尋有兩個部分不會被轉換。LiteLLM 會丟棄帶有 `"execution": "client"` 的 `tool_search` 工具；在 Claude 路由上，它會保留其他工具的 `defer_loading`，因此當請求中的所有工具都被延遲載入時，Anthropic 會回傳 400（`All tools cannot be deferred.`）。LiteLLM 也不會回傳 `tool_search_output` 項目。OpenAI 會在該項目中填入搜尋所載入工具的定義，而呼叫者本來就已持有這些定義。

### AI 閘道使用方式 {#ai-gateway-usage-2}

#### Proxy 設定 {#proxy-configuration-2}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/{{anthropic}}
      api_key: os.environ/ANTHROPIC_API_KEY
```

#### 用戶端請求 {#client-request-2}

此請求中的每個函式工具都設定了 `defer_loading`，因此 Claude 必須搜尋它需要的工具。

```bash showLineNumbers title="tool_search on a Claude model through /v1/responses"
curl http://0.0.0.0:4000/v1/responses \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet",
    "input": "What is the weather in Paris right now? Use the right tool.",
    "tools": [
      {"type": "tool_search", "execution": "server"},
      {"type": "function", "name": "get_weather", "description": "Get the current weather for a city", "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}, "defer_loading": true},
      {"type": "function", "name": "get_stock_price", "description": "Get the current stock price for a ticker", "parameters": {"type": "object", "properties": {"ticker": {"type": "string"}}, "required": ["ticker"]}, "defer_loading": true},
      {"type": "function", "name": "send_email", "description": "Send an email to a recipient", "parameters": {"type": "object", "properties": {"to": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "body"]}, "defer_loading": true}
    ]
  }'
```

回應的 `output` 陣列先包含搜尋呼叫，接著是函式呼叫：

```json showLineNumbers title="Response output"
[
  {
    "id": "tsc_srvtoolu_01F8hTt8WqVTUttskjushEVj",
    "arguments": {"pattern": "weather|forecast|temperature"},
    "call_id": "srvtoolu_01F8hTt8WqVTUttskjushEVj",
    "execution": "server",
    "status": "completed",
    "type": "tool_search_call"
  },
  {
    "arguments": "{\"city\": \"Paris\"}",
    "call_id": "toolu_01K24WmFy7Wp67qTowYf2cw3",
    "name": "get_weather",
    "type": "function_call",
    "id": "fc_toolu_01K24WmFy7Wp67qTowYf2cw3",
    "namespace": null,
    "status": "completed"
  }
]
```

使用 OpenAI Python SDK 時，後續輪次會將第一個回應的輸出連同函式結果一起傳回：

```python showLineNumbers title="tool_search on a Claude model with the OpenAI SDK"
from openai import OpenAI

client = OpenAI(api_key="your-litellm-proxy-key", base_url="http://0.0.0.0:4000")

tools = [
    {"type": "tool_search"},
    {
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather for a city",
        "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
        "defer_loading": True,
    },
    {
        "type": "function",
        "name": "send_email",
        "description": "Send an email to a recipient",
        "parameters": {
            "type": "object",
            "properties": {"to": {"type": "string"}, "body": {"type": "string"}},
            "required": ["to", "body"],
        },
        "defer_loading": True,
    },
]

question = [{"role": "user", "content": "What is the weather in Paris right now? Use the right tool."}]
response = client.responses.create(model="claude-sonnet", input=question, tools=tools)

for item in response.output:
    if item.type == "tool_search_call":
        print(f"Searched with {item.arguments}")
    elif item.type == "function_call":
        print(f"Called {item.name}({item.arguments})")

weather_call = next(item for item in response.output if item.type == "function_call")
follow_up = client.responses.create(
    model="claude-sonnet",
    input=[
        *question,
        *response.output,
        {"type": "function_call_output", "call_id": weather_call.call_id, "output": '{"temp_c": 18, "condition": "cloudy"}'},
    ],
    tools=tools,
)
print(follow_up.output_text)
```

---

## 其他資源 {#additional-resources}

- [Anthropic 工具搜尋文件](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/tool-search)
- [LiteLLM 工具呼叫指南](https://docs.litellm.ai/docs/completion/function_call)
