import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# 使用您的 MCP {#using-your-mcp}

本文說明如何將 LiteLLM 作為 MCP 閘道使用。您可以了解如何搭配 Responses API、Cursor IDE 和 OpenAI SDK 使用。

### 在 LiteLLM UI 上使用  {#use-on-litellm-ui}

請依照此逐步示範，將您的 MCP 用於 LiteLLM UI

<iframe width="840" height="500" src="https://www.loom.com/embed/57e0763267254bc79dbe6658d0b8758c" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

### 搭配 Responses API 使用 {#use-with-responses-api}

將 `http://localhost:4000` 替換為您的 LiteLLM Proxy base URL。

使用 LiteLLM Proxy 搭配 Responses API 的示範影片：[點此觀看示範影片](https://www.loom.com/share/34587e618c5c47c0b0d67b4e4d02718f?sid=2caf3d45-ead4-4490-bcc1-8d6dd6041c02)

<Tabs>
<TabItem value="curl" label="cURL">

```bash title="cURL Example" showLineNumbers
curl --location 'http://localhost:4000/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer sk-1234" \
--data '{
    "model": "gpt-5",
    "input": [
    {
      "role": "user",
      "content": "give me TLDR of what BerriAI/litellm repo is about",
      "type": "message"
    }
  ],
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never"
        }
    ],
    "stream": true,
    "tool_choice": "required"
}'
```

</TabItem>
<TabItem value="python" label="Python SDK">

```python title="Python SDK Example" showLineNumbers
"""
Use LiteLLM Proxy MCP Gateway to call MCP tools.

When using LiteLLM Proxy, you can use the same MCP tools across all your LLM providers.
"""
import openai

client = openai.OpenAI(
    api_key="sk-1234", # paste your litellm proxy api key here
    base_url="http://localhost:4000" # paste your litellm proxy base url here
)
print("Making API request to Responses API with MCP tools")

response = client.responses.create(
    model="gpt-5",
    input=[
        {
            "role": "user",
            "content": "give me TLDR of what BerriAI/litellm repo is about",
            "type": "message"
        }
    ],
    tools=[
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never"
        }
    ],
    stream=True,
    tool_choice="required"
)

for chunk in response:
    print("response chunk: ", chunk)
```

</TabItem>
</Tabs>

#### 指定 MCP 工具 {#specifying-mcp-tools}

您可以使用 `allowed_tools` 參數來指定可用的 MCP 工具。這可讓您限制對 MCP 伺服器中特定工具的存取。

若要在使用 LiteLLM MCP 閘道時取得允許的工具清單，您可以前往 LiteLLM UI 中的 MCP Servers > MCP Tools > 點選該 Tool > Copy Tool Name。

<Tabs>
<TabItem value="curl" label="cURL">

```bash title="cURL Example with allowed_tools" showLineNumbers
curl --location 'http://localhost:4000/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer sk-1234" \
--data '{
    "model": "gpt-5",
    "input": [
    {
      "role": "user",
      "content": "give me TLDR of what BerriAI/litellm repo is about",
      "type": "message"
    }
  ],
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy/mcp",
            "require_approval": "never",
            "allowed_tools": ["GitMCP-fetch_litellm_documentation"]
        }
    ],
    "stream": true,
    "tool_choice": "required"
}'
```

</TabItem>
<TabItem value="python" label="Python SDK">

```python title="Python SDK Example with allowed_tools" showLineNumbers
import openai

client = openai.OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

response = client.responses.create(
    model="gpt-5",
    input=[
        {
            "role": "user",
            "content": "give me TLDR of what BerriAI/litellm repo is about",
            "type": "message"
        }
    ],
    tools=[
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy/mcp",
            "require_approval": "never",
            "allowed_tools": ["GitMCP-fetch_litellm_documentation"]
        }
    ],
    stream=True,
    tool_choice="required"
)

print(response)
```

</TabItem>
</Tabs>

### 搭配 Cursor IDE 使用 {#use-with-cursor-ide}

直接從 Cursor IDE 搭配 LiteLLM MCP 使用工具：

**設定說明：**

1. **開啟 Cursor Settings**：使用 `⇧+⌘+J`（Mac）或 `Ctrl+Shift+J`（Windows/Linux）
2. **前往 MCP Tools**：進入「MCP Tools」分頁，然後點選「New MCP Server」
3. **新增設定**：複製並貼上以下 JSON 設定，接著使用 `Cmd+S` 或 `Ctrl+S` 儲存

```json title="Basic Cursor MCP Configuration" showLineNumbers
{
  "mcpServers": {
    "LiteLLM": {
      "url": "litellm_proxy",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY"
      }
    }
  }
}
```

#### server_url="litellm_proxy" 時的運作方式 {#how-it-works-when-server_urllitellm_proxy}

當 server_url="litellm_proxy" 時，LiteLLM 會將非 MCP 提供者橋接到您的 MCP 工具。

- 工具探索：LiteLLM 會取得 MCP 工具，並將其轉換為與 OpenAI 相容的定義
- LLM 呼叫：工具會隨著您的輸入傳送給 LLM；LLM 會選擇要呼叫哪些工具
- 工具執行：LiteLLM 會自動解析引數、將請求路由到 MCP 伺服器、執行工具，並擷取結果
- 回應整合：工具結果會傳回 LLM，以產生最終回應
- 輸出：結合 LLM 推理與工具執行結果的完整回應

這可讓任何 LiteLLM 支援的提供者都能使用 MCP 工具，不受原生 MCP 支援與否限制。

#### require_approval: "never" 的自動執行 {#auto-execution-for-require_approval-never}

設定 require_approval: "never" 會觸發自動工具執行，並在單一 API 請求中傳回最終回應，不需額外使用者互動。
