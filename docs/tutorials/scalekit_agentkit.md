# Scalekit 搭配 LiteLLM {#scalekit-with-litellm}

為您以 LiteLLM 驅動的代理程式加入已驗證的工具請求。[@Scalekit](https://docs.scalekit.com/agentkit/overview/) 會管理 100+ 第三方應用程式（Gmail、GitHub、Slack、Salesforce 等）的 OAuth 流程、權杖儲存與 API 執行——您的代理程式可在執行時挑選工具，而 LiteLLM 會將模型請求路由至任何提供者。

## 總覽 {#overview}

- 從 Scalekit 取得以使用者範圍限定的工具定義，並將它們作為函式 schema 傳遞給 `litellm.completion()`
- 自由切換模型——相同的工具定義可跨 OpenAI、Anthropic、Bedrock、Vertex AI，以及 LiteLLM 支援的所有其他提供者使用
- 透過 Scalekit 執行工具請求——不需要為每個第三方應用程式管理 API 金鑰、端點或驗證標頭

## 先決條件 {#prerequisites}

- Python 3.9+
- 一個已設定連線的 [Scalekit 帳戶](https://app.scalekit.com)（本教學使用 Gmail）
- 至少一個 LLM 提供者的 API 金鑰，或一個正在執行的 LiteLLM proxy
- 來自 Dashboard → **Developers** → **API Credentials** 的 Scalekit API 憑證（`SCALEKIT_CLIENT_ID`、`SCALEKIT_CLIENT_SECRET`、`SCALEKIT_ENV_URL`）

## 1. 安裝相依套件 {#1-install-dependencies}

```bash
pip install litellm scalekit-sdk-python
```

## 2. 初始化用戶端 {#2-initialize-clients}

```python showLineNumbers title="setup.py"
import os
import json
import litellm
import scalekit.client
from google.protobuf.json_format import MessageToDict  # installed with scalekit-sdk-python

scalekit_client = scalekit.client.ScalekitClient(
    client_id=os.getenv("SCALEKIT_CLIENT_ID"),
    client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
    env_url=os.getenv("SCALEKIT_ENV_URL"),
)
actions = scalekit_client.actions
```

## 3. 授權使用者 {#3-authorize-a-user}

建立已連線帳戶並完成 OAuth 流程。帳戶狀態一旦變為 `ACTIVE`，Scalekit 就可以代表使用者執行工具。

```python showLineNumbers title="authorize.py"
connection_name = os.getenv("GMAIL_CONNECTION_NAME", "gmail")

response = actions.get_or_create_connected_account(
    connection_name=connection_name,
    identifier="user_123",  # your app's user ID
)
connected_account = response.connected_account

if connected_account.status != "ACTIVE":
    link = actions.get_authorization_link(
        connection_name=connection_name,
        identifier="user_123",
    )
    print("Authorize Gmail:", link.link)
    input("Press Enter after completing authorization...")
```

## 4. 取得範圍限定的工具 {#4-fetch-scoped-tools}

`list_scoped_tools` 只會回傳這個特定使用者被授權可呼叫的工具。將它們轉換為 OpenAI 的函式呼叫格式——LiteLLM 會對所有提供者正規化為相同格式。

```python showLineNumbers title="fetch_tools.py"
scoped_response, _ = actions.tools.list_scoped_tools(
    identifier="user_123",
    filter={"connection_names": [connection_name]},
    page_size=100,
)

# Convert to OpenAI function-calling format (used by litellm for all providers)
llm_tools = [
    {
        "type": "function",
        "function": {
            "name": MessageToDict(t.tool).get("definition", {}).get("name"),
            "description": MessageToDict(t.tool).get("definition", {}).get("description", ""),
            "parameters": MessageToDict(t.tool).get("definition", {}).get("input_schema", {}),
        },
    }
    for t in scoped_response.tools
]
```

## 5. 執行代理程式迴圈 {#5-run-the-agent-loop}

使用工具定義呼叫 `litellm.completion()`。當模型回傳工具請求時，透過 Scalekit 執行它們並將結果回饋。變更 `model` 參數即可切換提供者——不需要其他程式碼變更。

```python showLineNumbers title="agent_loop.py"
messages = [{"role": "user", "content": "Fetch my last 5 unread emails and summarize them"}]

while True:
    response = litellm.completion(
        model="anthropic/claude-sonnet-4-20250514",  # swap to any litellm-supported model
        tools=llm_tools,
        messages=messages,
    )
    message = response.choices[0].message

    if not message.tool_calls:
        print(message.content)
        break

    # Append assistant message with tool calls
    messages.append(message)

    # Execute each tool call through Scalekit
    for tc in message.tool_calls:
        result = actions.execute_tool(
            tool_name=tc.function.name,
            identifier="user_123",
            tool_input=json.loads(tc.function.arguments),
        )
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": str(result.data),
        })
```

## 6. 完整可運作範例 {#6-complete-working-example}

完整的端到端腳本——直接複製並執行：

```python showLineNumbers title="scalekit_agent.py"
import os
import json
import litellm
import scalekit.client
from google.protobuf.json_format import MessageToDict

# --- Configuration ---
MODEL = os.getenv("MODEL", "anthropic/claude-sonnet-4-20250514")
CONNECTION_NAME = os.getenv("GMAIL_CONNECTION_NAME", "gmail")
USER_ID = "user_123"

# --- Initialize ---
scalekit_client = scalekit.client.ScalekitClient(
    client_id=os.getenv("SCALEKIT_CLIENT_ID"),
    client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
    env_url=os.getenv("SCALEKIT_ENV_URL"),
)
actions = scalekit_client.actions

# --- Authorize user ---
response = actions.get_or_create_connected_account(
    connection_name=CONNECTION_NAME,
    identifier=USER_ID,
)
if response.connected_account.status != "ACTIVE":
    link = actions.get_authorization_link(
        connection_name=CONNECTION_NAME,
        identifier=USER_ID,
    )
    print("Authorize Gmail:", link.link)
    input("Press Enter after completing authorization...")

# --- Fetch tools ---
scoped_response, _ = actions.tools.list_scoped_tools(
    identifier=USER_ID,
    filter={"connection_names": [CONNECTION_NAME]},
    page_size=100,
)
llm_tools = [
    {
        "type": "function",
        "function": {
            "name": MessageToDict(t.tool).get("definition", {}).get("name"),
            "description": MessageToDict(t.tool).get("definition", {}).get("description", ""),
            "parameters": MessageToDict(t.tool).get("definition", {}).get("input_schema", {}),
        },
    }
    for t in scoped_response.tools
]
print(f"Loaded {len(llm_tools)} tools for {CONNECTION_NAME}")

# --- Agent loop ---
messages = [{"role": "user", "content": "Fetch my last 5 unread emails and summarize them"}]

while True:
    response = litellm.completion(model=MODEL, tools=llm_tools, messages=messages)
    message = response.choices[0].message

    if not message.tool_calls:
        print(message.content)
        break

    messages.append(message)
    for tc in message.tool_calls:
        print(f"  Calling tool: {tc.function.name}")
        result = actions.execute_tool(
            tool_name=tc.function.name,
            identifier=USER_ID,
            tool_input=json.loads(tc.function.arguments),
        )
        messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": str(result.data),
        })
```

透過變更 `MODEL` 環境變數來切換模型：

```bash
# OpenAI
MODEL=gpt-4o python scalekit_agent.py

# Anthropic
MODEL=anthropic/claude-sonnet-4-20250514 python scalekit_agent.py

# AWS Bedrock
MODEL=bedrock/us.anthropic.claude-sonnet-4-20250514-v1:0 python scalekit_agent.py

# Via LiteLLM Proxy
OPENAI_API_BASE=http://localhost:4000 OPENAI_API_KEY=sk-1234 MODEL=claude-sonnet-4 python scalekit_agent.py
```

## 透過 LiteLLM Proxy 路由以進行成本追蹤與速率限制 {#route-through-litellm-proxy-for-cost-tracking-and-rate-limits}

如果您正在執行 LiteLLM proxy，請將您的代理程式指向它，以進行集中式模型管理、成本追蹤與速率限制。代理程式程式碼保持不變——設定 proxy URL：

```python showLineNumbers title="proxy_agent.py"
import litellm

# Point litellm at your proxy
response = litellm.completion(
    model="claude-sonnet-4",                          # model name from your proxy config
    api_base="http://localhost:4000",                  # proxy URL
    api_key="sk-1234",                                 # proxy virtual key
    tools=llm_tools,
    messages=messages,
)
```

或者使用環境變數，這樣就不需要變更程式碼：

```bash
export OPENAI_API_BASE="http://localhost:4000"
export OPENAI_API_KEY="sk-1234"
python scalekit_agent.py
```

## 端到端範例：收件匣分流代理程式 {#end-to-end-example-inbox-triage-agent}

若要查看結合 Scalekit 工具執行與透過 LiteLLM 進行逐階段模型路由的生產風格範例，請參閱 [litellm-agentkit-inbox-triage](https://github.com/scalekit-developers/litellm-agentkit-inbox-triage)。它示範了：

- 以不同模型輪詢 Gmail，並在各個流程階段分類討論串
- 使用關鍵字規則與 LLM 平手判定，路由至 GitHub 倉庫
- 透過 Scalekit 工具呼叫迴圈搜尋相關的 GitHub issues
- 在建立 issues 或傳送回覆之前通知 Slack，並等待人工核准

## 疑難排解 {#troubleshooting}

| 問題 | 解決方案 |
|-------|----------|
| `execute_tool` 回傳 "connection not found" | `connection_name` 必須與 Dashboard → **AgentKit** → **Connections** 中的精確標籤完全一致（包含大小寫）。請使用環境變數，而不要硬編碼。 |
| 已連線帳戶停留在 `PENDING` | 使用者尚未完成 OAuth 流程。請重新產生授權連結，並讓對方在瀏覽器中開啟。 |
| 模型回傳文字而不是工具請求 | 並非所有模型都支援函式呼叫。請使用支援的模型（GPT-4o、Claude Sonnet/Opus、Gemini Pro）。查看 [支援的提供者](../providers/)。 |
| `litellm.completion()` 發生驗證錯誤 | 請確認您的 LLM 提供者 API 金鑰已設定（`OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 等），或確認您的 proxy URL 與金鑰正確無誤。 |

## 相關資源 {#related-resources}

- [Scalekit 文件](https://docs.scalekit.com/agentkit/overview/) — 完整文件
- [內建工具參考](https://docs.scalekit.com/agentkit/tools/scalekit-optimized-tools/) — 跨 100+ 連接器的工具呼叫
- [支援的連接器](https://docs.scalekit.com/agentkit/connectors/) — Gmail、GitHub、Slack、Salesforce 等
- [LiteLLM Proxy 快速入門](../proxy/quick_start) — 設定集中式模型路由
- [LiteLLM Function Calling](../completion/function_call) — 函式呼叫文件
