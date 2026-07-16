---
slug: anthropic_advanced_features
title: "第 0 天支援：Claude 4.5 Opus（+進階功能）"
date: 2025-11-25T10:00:00
authors:
  - sameer
  - krrish
  - ishaan-alt
description: "LiteLLM 中 Claude Opus 4.5 與進階功能指南：Tool Search、Programmatic Tool Calling 與 Effort 參數。"
tags: [anthropic, claude, tool search, programmatic tool calling, effort, advanced features]
hide_table_of_contents: false
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

本指南涵蓋 Anthropic 的最新模型（Claude Opus 4.5）及其目前可在 LiteLLM 中使用的進階功能：Tool Search、Programmatic Tool Calling、Tool Input Examples 與 Effort 參數。

{/* truncate */}

---

| 功能 | 支援的模型 |
|---------|-----------------|
| Tool Search | Claude Opus 4.5, Sonnet 4.5 |
| Programmatic Tool Calling | Claude Opus 4.5, Sonnet 4.5 |
| Input Examples | Claude Opus 4.5, Sonnet 4.5 |
| Effort 參數 | 僅 Claude Opus 4.5 |

支援的提供者：[Anthropic](../../docs/providers/anthropic)、[Bedrock](../../docs/providers/bedrock)、[Vertex AI](../../docs/providers/vertex_partner#vertex-ai---anthropic-claude)、[Azure AI](../../docs/providers/azure_ai)。

## 使用 {#usage}

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import os
from litellm import completion

# set env - [OPTIONAL] replace with your anthropic key
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

messages = [{"role": "user", "content": "Hey! how's it going?"}]

## OPENAI /chat/completions API format
response = completion(model="claude-opus-4-5-20251101", messages=messages)
print(response)

```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-4 ### RECEIVED MODEL NAME ###
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: claude-opus-4-5-20251101 ### MODEL NAME sent to `litellm.completion()` ###
      api_key: "os.environ/ANTHROPIC_API_KEY" # does os.getenv("ANTHROPIC_API_KEY")
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試！**

<Tabs>
<TabItem value="curl" label="OpenAI Chat Completions">
```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="anthropic" label="Anthropic /v1/messages API">
```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "max_tokens": 1024,
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
</Tabs>
</TabItem>
</Tabs>

## 使用 - Bedrock {#usage---bedrock}

:::info

LiteLLM 使用 boto3 函式庫與 Bedrock 進行驗證。

如需更多與 Bedrock 驗證的方式，請參閱 [Bedrock 文件](../../docs/providers/bedrock#authentication)。

:::

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import os
from litellm import completion

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = ""

## OPENAI /chat/completions API format
response = completion(
  model="bedrock/us.anthropic.claude-opus-4-5-20251101-v1:0",
  messages=[{ "content": "Hello, how are you?","role": "user"}]
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-4 ### RECEIVED MODEL NAME ###
    litellm_params: # all params accepted by litellm.completion() - https://docs.litellm.ai/docs/completion/input
      model: bedrock/us.anthropic.claude-opus-4-5-20251101-v1:0 ### MODEL NAME sent to `litellm.completion()` ###
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: os.environ/AWS_REGION_NAME
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試！**

<Tabs>
<TabItem value="curl" label="OpenAI Chat Completions">
```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="anthropic" label="Anthropic /v1/messages API">
```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "max_tokens": 1024,
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="invoke" label="Bedrock /invoke API">
```bash
curl --location 'http://0.0.0.0:4000/bedrock/model/claude-4/invoke' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "max_tokens": 1024,
      "messages": [{"role": "user", "content": "Hello, how are you?"}]
    }'
```
</TabItem>
<TabItem value="converse" label="Bedrock /converse API">
```bash
curl --location 'http://0.0.0.0:4000/bedrock/model/claude-4/converse' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "messages": [{"role": "user", "content": "Hello, how are you?"}]
    }'
```
</TabItem>
</Tabs>
</TabItem>
</Tabs>

## 使用 - Vertex AI {#usage---vertex-ai}

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
from litellm import completion
import json 

## GET CREDENTIALS 
## RUN ## 
# !gcloud auth application-default login - run this to add vertex credentials to your env
## OR ## 
file_path = 'path/to/vertex_ai_service_account.json'

# Load the JSON file
with open(file_path, 'r') as file:
    vertex_credentials = json.load(file)

# Convert to JSON string
vertex_credentials_json = json.dumps(vertex_credentials)

## COMPLETION CALL 
response = completion(
  model="vertex_ai/claude-opus-4-5@20251101",
  messages=[{ "content": "Hello, how are you?","role": "user"}],
  vertex_credentials=vertex_credentials_json,
  vertex_project="your-project-id",
  vertex_location="us-east5"
)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定 config.yaml**

```yaml
model_list:
  - model_name: claude-4 ### RECEIVED MODEL NAME ###
    litellm_params:
        model: vertex_ai/claude-opus-4-5@20251101
        vertex_credentials: "/path/to/service_account.json"
        vertex_project: "your-project-id"
        vertex_location: "us-east5"
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml
```

**3. 測試！**

<Tabs>
<TabItem value="curl" label="OpenAI Chat Completions">
```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
<TabItem value="anthropic" label="Anthropic /v1/messages API">
```bash
curl --location 'http://0.0.0.0:4000/v1/messages' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "max_tokens": 1024,
      "messages": [
        {
          "role": "user",
          "content": "what llm are you"
        }
      ]
    }
'
```
</TabItem>
</Tabs>
</TabItem>
</Tabs>

## 使用 - Azure Anthropic（Azure Foundry Claude） {#usage---azure-anthropic-azure-foundry-claude}

LiteLLM 會透過 `azure_ai/` 提供者將 Azure Claude 部署導向，讓 Azure Foundry 上的 Claude Opus 模型可繼續使用 Tool Search、Effort、串流以及其餘進階功能組合。將 `AZURE_AI_API_BASE` 指向 `https://<resource>.services.ai.azure.com/anthropic`（LiteLLM 會自動附加 `/v1/messages`），並使用 `AZURE_AI_API_KEY` 或 Azure AD 權杖進行驗證。

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import os
from litellm import completion

# Configure Azure credentials
os.environ["AZURE_AI_API_KEY"] = "your-azure-ai-api-key"
os.environ["AZURE_AI_API_BASE"] = "https://my-resource.services.ai.azure.com/anthropic"

response = completion(
    model="azure_ai/claude-opus-4-1",
    messages=[{"role": "user", "content": "Explain how Azure Anthropic hosts Claude Opus differently from the public Anthropic API."}],
    max_tokens=1200,
    temperature=0.7,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

**1. 設定環境變數**

```bash
export AZURE_AI_API_KEY="your-azure-ai-api-key"
export AZURE_AI_API_BASE="https://my-resource.services.ai.azure.com/anthropic"
```

**2. 設定 proxy**

```yaml
model_list:
  - model_name: claude-4-azure
    litellm_params:
      model: azure_ai/claude-opus-4-1
      api_key: os.environ/AZURE_AI_API_KEY
      api_base: os.environ/AZURE_AI_API_BASE
```

**3. 啟動 LiteLLM**

```bash
litellm --config /path/to/config.yaml
```

**4. 測試 Azure Claude 路由**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer $LITELLM_KEY' \
  --data '{
    "model": "claude-4-azure",
    "messages": [
      {
        "role": "user",
        "content": "How do I use Claude Opus 4 via Azure Anthropic in LiteLLM?"
      }
    ],
    "max_tokens": 1024
  }'
```

</TabItem>
</Tabs>

## 工具搜尋 {#tool-search}

這可讓 Claude 透過按需動態載入工具，而不是一開始就將所有工具載入到 context window 中，進而支援數千個工具。

### 使用範例 {#usage-example}

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import litellm
import os

# Configure your API key
os.environ["ANTHROPIC_API_KEY"] = "your-api-key"

# Define your tools with defer_loading
tools = [
    # Tool search tool (regex variant)
    {
        "type": "tool_search_tool_regex_20251119",
        "name": "tool_search_tool_regex"
    },
    # Deferred tools - loaded on-demand
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location. Returns temperature and conditions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit"
                    }
                },
                "required": ["location"]
            }
        },
        "defer_loading": True  # Load on-demand
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search through files in the workspace using keywords",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "file_types": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["query"]
            }
        },
        "defer_loading": True
    },
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Execute SQL queries against the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string"}
                },
                "required": ["sql"]
            }
        },
        "defer_loading": True
    }
]

# Make a request - Claude will search for and use relevant tools
response = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{
        "role": "user",
        "content": "What's the weather like in San Francisco?"
    }],
    tools=tools
)

print("Claude's response:", response.choices[0].message.content)
print("Tool calls:", response.choices[0].message.tool_calls)

# Check tool search usage
if hasattr(response.usage, 'server_tool_use'):
    print(f"Tool searches performed: {response.usage.server_tool_use.tool_search_requests}")
```
</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-4
    litellm_params:
      model: anthropic/claude-opus-4-5-20251101
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試！

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [{
        "role": "user",
        "content": "What's the weather like in San Francisco?"
       }],
       "tools": [
        # Tool search tool (regex variant)
        {
            "type": "tool_search_tool_regex_20251119",
            "name": "tool_search_tool_regex"
        },
        # Deferred tools - loaded on-demand
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather in a given location. Returns temperature and conditions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "Temperature unit"
                        }
                    },
                    "required": ["location"]
                }
            },
            "defer_loading": True  # Load on-demand
        },
        {
            "type": "function",
            "function": {
                "name": "search_files",
                "description": "Search through files in the workspace using keywords",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "file_types": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["query"]
                }
            },
            "defer_loading": True
        },
        {
            "type": "function",
            "function": {
                "name": "query_database",
                "description": "Execute SQL queries against the database",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sql": {"type": "string"}
                    },
                    "required": ["sql"]
                }
            },
            "defer_loading": True
        }
    ]
}
'
```
</TabItem>
</Tabs>

### BM25 變體（自然語言搜尋） {#bm25-variant-natural-language-search}

針對自然語言查詢，而非 regex 模式：

```python
tools = [
    {
        "type": "tool_search_tool_bm25_20251119",  # Natural language variant
        "name": "tool_search_tool_bm25"
    },
    # ... your deferred tools
]
```

---

## 程式化工具呼叫 {#programmatic-tool-calling}

Programmatic tool calling 讓 Claude 能撰寫程式碼，以程式化方式呼叫您的工具。[深入了解](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import litellm
import json

# Define tools that can be called programmatically
tools = [
    # Code execution tool (required for programmatic calling)
    {
        "type": "code_execution_20250825",
        "name": "code_execution"
    },
    # Tool that can be called from code
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Execute a SQL query against the sales database. Returns a list of rows as JSON objects.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "SQL query to execute"
                    }
                },
                "required": ["sql"]
            }
        },
        "allowed_callers": ["code_execution_20250825"]  # Enable programmatic calling
    }
]

# First request
response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{
        "role": "user",
        "content": "Query sales data for West, East, and Central regions, then tell me which had the highest revenue"
    }],
    tools=tools
)

print("Claude's response:", response.choices[0].message)

# Handle tool calls
messages = [
    {"role": "user", "content": "Query sales data for West, East, and Central regions, then tell me which had the highest revenue"},
    {"role": "assistant", "content": response.choices[0].message.content, "tool_calls": response.choices[0].message.tool_calls}
]

# Process each tool call
for tool_call in response.choices[0].message.tool_calls:
    # Check if it's a programmatic call
    if hasattr(tool_call, 'caller') and tool_call.caller:
        print(f"Programmatic call to {tool_call.function.name}")
        print(f"Called from: {tool_call.caller}")
    
    # Simulate tool execution
    if tool_call.function.name == "query_database":
        args = json.loads(tool_call.function.arguments)
        # Simulate database query
        result = json.dumps([
            {"region": "West", "revenue": 150000},
            {"region": "East", "revenue": 180000},
            {"region": "Central", "revenue": 120000}
        ])
        
        messages.append({
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_call.id,
                "content": result
            }]
        })

# Get final response
final_response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=messages,
    tools=tools
)

print("\nFinal answer:", final_response.choices[0].message.content)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-4
    litellm_params:
      model: anthropic/claude-opus-4-5-20251101
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試！

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [{
        "role": "user",
        "content": "Query sales data for West, East, and Central regions, then tell me which had the highest revenue"
      }],
      "tools": [
        # Code execution tool (required for programmatic calling)
        {
            "type": "code_execution_20250825",
            "name": "code_execution"
        },
        # Tool that can be called from code
        {
            "type": "function",
            "function": {
                "name": "query_database",
                "description": "Execute a SQL query against the sales database. Returns a list of rows as JSON objects.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "sql": {
                            "type": "string",
                            "description": "SQL query to execute"
                        }
                    },
                    "required": ["sql"]
                }
            },
            "allowed_callers": ["code_execution_20250825"]  # Enable programmatic calling
        }
    ]
}
'
```
</TabItem>
</Tabs>

---

## 工具輸入範例 {#tool-input-examples}

您現在可以提供 Claude 如何使用工具的範例。[深入了解](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-input-examples)

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import litellm

tools = [
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a new calendar event with attendees and reminders",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "start_time": {
                        "type": "string",
                        "description": "ISO 8601 format: YYYY-MM-DDTHH:MM:SS"
                    },
                    "duration_minutes": {"type": "integer"},
                    "attendees": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string"},
                                "optional": {"type": "boolean"}
                            }
                        }
                    },
                    "reminders": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "minutes_before": {"type": "integer"},
                                "method": {"type": "string", "enum": ["email", "popup"]}
                            }
                        }
                    }
                },
                "required": ["title", "start_time", "duration_minutes"]
            }
        },
        # Provide concrete examples
        "input_examples": [
            {
                "title": "Team Standup",
                "start_time": "2025-01-15T09:00:00",
                "duration_minutes": 30,
                "attendees": [
                    {"email": "alice@company.com", "optional": False},
                    {"email": "bob@company.com", "optional": False}
                ],
                "reminders": [
                    {"minutes_before": 15, "method": "popup"}
                ]
            },
            {
                "title": "Lunch Break",
                "start_time": "2025-01-15T12:00:00",
                "duration_minutes": 60
                # Demonstrates optional fields can be omitted
            }
        ]
    }
]

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[{
        "role": "user",
        "content": "Schedule a team meeting for tomorrow at 2pm for 45 minutes with john@company.com and sarah@company.com"
    }],
    tools=tools
)

print("Tool call:", response.choices[0].message.tool_calls[0].function.arguments)
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-4
    litellm_params:
      model: anthropic/claude-opus-4-5-20251101
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試！

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [{
        "role": "user",
        "content": "Schedule a team meeting for tomorrow at 2pm for 45 minutes with john@company.com and sarah@company.com"
      }],
      "tools": [
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a new calendar event with attendees and reminders",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "start_time": {
                        "type": "string",
                        "description": "ISO 8601 format: YYYY-MM-DDTHH:MM:SS"
                    },
                    "duration_minutes": {"type": "integer"},
                    "attendees": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string"},
                                "optional": {"type": "boolean"}
                            }
                        }
                    },
                    "reminders": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "minutes_before": {"type": "integer"},
                                "method": {"type": "string", "enum": ["email", "popup"]}
                            }
                        }
                    }
                },
                "required": ["title", "start_time", "duration_minutes"]
            }
        },
        # Provide concrete examples
        "input_examples": [
            {
                "title": "Team Standup",
                "start_time": "2025-01-15T09:00:00",
                "duration_minutes": 30,
                "attendees": [
                    {"email": "alice@company.com", "optional": False},
                    {"email": "bob@company.com", "optional": False}
                ],
                "reminders": [
                    {"minutes_before": 15, "method": "popup"}
                ]
            },
            {
                "title": "Lunch Break",
                "start_time": "2025-01-15T12:00:00",
                "duration_minutes": 60
                # Demonstrates optional fields can be omitted
            }
        ]
    }
]
}
'
```
</TabItem>
</Tabs>

---

## Effort 參數：控制 Token 使用量 {#effort-parameter}

使用 `reasoning_effort` 參數控制 Claude 在回應中投入多少 effort。這可讓您在回應完整度與 token 效率之間取得取捨。

:::info
LiteLLM 會自動將 `reasoning_effort` 對應到 Anthropic 的 `output_config` 格式，並為 Claude Opus 4.5 加上所需的 `effort-2025-11-24` beta 標頭。
:::

`reasoning_effort` 參數的可能值：`"high"`、`"medium"`、`"low"`。

### 使用範例 {#usage-example-1}

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python
import litellm

message = "Analyze the trade-offs between microservices and monolithic architectures"

# High effort (default) - Maximum capability
response_high = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{"role": "user", "content": message}],
    reasoning_effort="high"
)

print("High effort response:")
print(response_high.choices[0].message.content)
print(f"Tokens used: {response_high.usage.completion_tokens}\n")

# Medium effort - Balanced approach
response_medium = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{"role": "user", "content": message}],
    reasoning_effort="medium"
)

print("Medium effort response:")
print(response_medium.choices[0].message.content)
print(f"Tokens used: {response_medium.usage.completion_tokens}\n")

# Low effort - Maximum efficiency
response_low = litellm.completion(
    model="anthropic/claude-opus-4-5-20251101",
    messages=[{"role": "user", "content": message}],
    reasoning_effort="low"
)

print("Low effort response:")
print(response_low.choices[0].message.content)
print(f"Tokens used: {response_low.usage.completion_tokens}\n")

# Compare token usage
print("Token Comparison:")
print(f"High:   {response_high.usage.completion_tokens} tokens")
print(f"Medium: {response_medium.usage.completion_tokens} tokens")
print(f"Low:    {response_low.usage.completion_tokens} tokens")
```

</TabItem>
<TabItem value="proxy" label="LiteLLM Proxy">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: claude-4
    litellm_params:
      model: anthropic/claude-opus-4-5-20251101
      api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy

```bash
litellm --config /path/to/config.yaml
```

3. 測試！

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $LITELLM_KEY' \
--data ' {
      "model": "claude-4",
      "messages": [{
        "role": "user",
        "content": "Analyze the trade-offs between microservices and monolithic architectures"
      }],
      "reasoning_effort": "high"
    }
'
```
</TabItem>
</Tabs>
