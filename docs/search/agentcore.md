# Amazon Bedrock AgentCore 網頁搜尋 {#amazon-bedrock-agentcore-web-search}

[Amazon Bedrock AgentCore 上的網頁搜尋](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools-web-search.html) 是一個 AWS 托管的網頁索引，作為 AgentCore Gateway 上的 MCP 工具公開，因此搜尋流量會保留在 AWS 內部，並由 AWS 計費，而不是第三方搜尋 API

與其他搜尋提供者不同，這裡不需要註冊 API 金鑰。您建立一個帶有 `web-search` connector target 的 gateway，然後讓 LiteLLM 指向其 MCP endpoint

| | |
|---|---|
| 提供者 ID | `agentcore` |
| Gateway URL | `AGENTCORE_GATEWAY_URL`，或 `api_base` |
| 驗證（AWS_IAM gateway） | SigV4，來自明確提供的金鑰或標準 AWS credential chain |
| 驗證（CUSTOM_JWT gateway） | `AGENTCORE_GATEWAY_TOKEN`，或 `api_key` |
| 工具名稱覆寫 | `AGENTCORE_SEARCH_TOOL_NAME`，或 `tool_name` |
| MCP protocol version 覆寫 | `AGENTCORE_MCP_PROTOCOL_VERSION` |

gateway URL 看起來像 `https://<gateway-id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp`

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="AgentCore Web Search"
import os
from litellm import search

os.environ["AGENTCORE_GATEWAY_URL"] = "https://<gateway-id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp"
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-key"

response = search(
    query="latest AI developments",
    search_provider="agentcore",
    max_results=5
)

for result in response.results:
    print(f"{result.title}: {result.url}")
    print(f"Snippet: {result.snippet}\n")
```

省略 AWS 金鑰即可使用標準 credential chain（環境、shared profile、IRSA、instance role），或在每次呼叫時以 `aws_access_key_id`、`aws_secret_access_key`、`aws_session_token` 和 `aws_region_name` 傳入

對於 CUSTOM_JWT gateway，請改為傳入 OAuth2 bearer token，且不會使用 AWS credentials：

```python showLineNumbers title="AgentCore Web Search with a CUSTOM_JWT gateway"
response = search(
    query="latest AI developments",
    search_provider="agentcore",
    api_key=os.environ["AGENTCORE_GATEWAY_TOKEN"]
)
```

## LiteLLM AI Gateway {#litellm-ai-gateway}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers title="config.yaml"
search_tools:
  - search_tool_name: agentcore-search
    litellm_params:
      search_provider: agentcore
      api_base: https://<gateway-id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 測試搜尋端點 {#3-test-the-search-endpoint}

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/agentcore-search \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```

## Bedrock 的網頁搜尋攔截 {#web-search-interception-for-bedrock}

由於此提供者不需要第三方金鑰，因此它很自然地可作為 [網頁搜尋攔截](../completion/web_search) 的後端，透過搜尋提供者提供 Anthropic 原生的 `web_search` 工具（如 Claude Code 所使用）：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_region_name: us-east-1

search_tools:
  - search_tool_name: agentcore-search
    litellm_params:
      search_provider: agentcore
      api_base: https://<gateway-id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp

litellm_settings:
  callbacks: ["websearch_interception"]
  websearch_interception_params:
    enabled_providers: ["bedrock"]
    search_tool_name: agentcore-search
```

## 統一參數 {#unified-parameters}

| 統一規格參數 | 對應的 AgentCore 參數 |
|---|---|
| `max_results` | `maxResults` |
| `search_domain_filter` | _ignored（無對應項）_ |
| `country` | _ignored（無對應項）_ |
| `max_tokens_per_page` | _ignored（無對應項）_ |

AgentCore 將查詢上限設為 200 個字元，因此較長的查詢會被截斷

## 提供者特定參數 {#provider-specific-parameters}

| 參數 | 類型 | 說明 |
|---|---|---|
| `tool_name` | string | 要呼叫的 gateway 工具。預設為 `web-search-tool___WebSearch`，與 AWS 設定文件中使用的 target 名稱一致。只有當您的 connector target 名稱不同時才設定這個值。必須以 `___WebSearch` 結尾 |

## 備註 {#notes}

gateway 由 AWS 直接計費，因此 LiteLLM 會以零成本追蹤 `agentcore/search`

SigV4 簽署區域來自 gateway hostname。如果您用自訂 hostname 在前方代理 gateway，請將 `aws_region_name`（或 `AWS_REGION`，或 profile region）設為 gateway 的區域

`AGENTCORE_GATEWAY_TOKEN` 只會在請求目標為 `AGENTCORE_GATEWAY_URL` 中設定的 gateway 時傳送，因此呼叫端提供的 `api_base` 無法外洩它。credentials 也只會透過 https 傳遞：除非主機是 localhost，否則純 `http://` 的 gateway URL 會被拒絕

LiteLLM 會在每次請求中傳送 `MCP-Protocol-Version: 2025-03-26`，這是具有預設 `protocolConfiguration` 的 gateway 所接受的版本。如果您的 gateway 將 `supportedVersions` 鎖定為其他值，請將 `AGENTCORE_MCP_PROTOCOL_VERSION` 設為相符值，例如 `2025-06-18`
