import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Agent Gateway（A2A Protocol）- 總覽 {#agent-gateway-a2a-protocol---overview}

在 LiteLLM AI Gateway 中新增 A2A Agents，以 A2A Protocol 呼叫 agents，並在 LiteLLM Logs 中追蹤 request/response 記錄。管理哪些 Teams、Keys 可以存取哪些已上線的 Agents。

<Image 
  img={require('../img/a2a_gateway.png')}
  style={{width: '80%', display: 'block', margin: '0', borderRadius: '8px'}}
/>

<br />
<br />

| 功能 | 支援 | 
|---------|-----------|
| 支援的 Agent 提供者 | A2A, Vertex AI Agent Engine, LangGraph, Azure AI Foundry, Bedrock AgentCore, Pydantic AI |
| 記錄 | ✅ |
| 負載平衡 | ✅ |
| 串流 | ✅ |
| [Iteration Budgets](a2a_iteration_budgets) | ✅ |

:::tip

LiteLLM 依循 [A2A (Agent-to-Agent) Protocol](https://github.com/google/A2A) 來呼叫 agents。

:::

## 新增您的 Agent {#adding-your-agent}

### 新增 A2A Agents {#add-a2a-agents}

您可以透過 LiteLLM Admin UI 新增相容於 A2A 的 agents。

1. 前往 **Agents** 分頁
2. 點擊 **Add Agent**
3. 輸入 agent 名稱（例如 `ij-local`）以及您的 A2A agent URL
4. 選擇 **Protocol Version**（`1.0` 或 `0.3`）- LiteLLM 提供給該 agent 用戶端的線路格式

<Image 
  img={require('../img/add_agent_1.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

URL 應為您的 A2A agent 的呼叫 URL（例如 `http://localhost:10001`）。

透過 API 或設定註冊時，請在 `agent_card_params` 中設定 `protocolVersion`：

```yaml title="config.yaml"
agents:
  - agent_name: my-agent
    agent_card_params:
      name: "My Agent"
      url: "http://localhost:10001"
      protocolVersion: "1.0"  # or "0.3"
```


### 新增 Azure AI Foundry Agents {#add-azure-ai-foundry-agents}

請參考 [這份指南，將您的 azure ai foundry agent 新增至 LiteLLM Agent Gateway](./providers/azure_ai_agents#litellm-a2a-gateway)

### 新增 Vertex AI Agent Engine {#add-vertex-ai-agent-engine}

請參考 [這份指南，將您的 Vertex AI Agent Engine 新增至 LiteLLM Agent Gateway](./providers/vertex_ai_agent_engine)

### 新增 Bedrock AgentCore Agents {#add-bedrock-agentcore-agents}

請參考 [這份指南，將您的 bedrock agentcore agent 新增至 LiteLLM Agent Gateway](./providers/bedrock_agentcore#litellm-a2a-gateway)

### 新增 LangGraph Agents {#add-langgraph-agents}

請參考 [這份指南以註冊 LangGraph agent 並設定其 agent card](./providers/langgraph#register-a-langgraph-platform-agent)

### 新增 Pydantic AI Agents {#add-pydantic-ai-agents}

請參考 [這份指南，將您的 pydantic ai agent 新增至 LiteLLM Agent Gateway](./providers/pydantic_ai_agent#litellm-a2a-gateway)

## Protocol 版本控管 {#protocol-versioning}

LiteLLM proxy 會使用 **a2a-sdk 1.x** 路由 A2A agents，並可依每個 agent 對用戶端提供 **A2A 0.3** 或 **1.0** 的線路格式。上游 agents 可能使用任一版本；LiteLLM 會將 `message/send`、`message/stream` 以及延伸 card 的回應正規化為您鎖定的版本。

| 版本 | 線路格式 | 範例 send result |
|---------|------------|---------------------|
| **0.3** | 依 `kind` 區分的物件（`message`、`task`、`status-update`、…） | `{"kind": "message", "role": "user", "parts": [{"kind": "text", "text": "..."}]}` |
| **1.0** | Protobuf JSON envelopes（`message`、`task`、`statusUpdate`、`artifactUpdate`） | `{"message": {"role": "ROLE_USER", "parts": [{"text": "..."}]}}` |

### 鎖定版本 {#pinning-a-version}

在註冊 agent 時，將 `agent_card_params.protocolVersion` 設為 `"0.3"` 或 `"1.0"`（UI 下拉選單或 API）。LiteLLM 會在代理的 agent card 上提供該版本，並將上游回應轉換為相符格式。

僅接受 `"0.3"` 和 `"1.0"`；其他值在註冊時會回傳 HTTP 400。

### 當 `protocolVersion` 未被鎖定時 {#when-protocolversion-is-not-pinned}

如果 agent 沒有鎖定版本，LiteLLM 會根據用戶端請求推斷提供的版本：

| 用戶端訊號 | 提供的版本 |
|---------------|----------------|
| JSON-RPC method `SendMessage` 或 `SendStreamingMessage` | `1.0` |
| Request header `a2a-version: 1.x` | `1.0` |
| 否則（例如沒有 header 的 `message/send`） | `0.3` |

:::tip 一律鎖定 `protocolVersion`

代理的 agent card 在未設定時預設為 `1.0`，但未帶 `a2a-version` header 的舊版 `message/send` 呼叫者會收到 **0.3** 形式的回應。請明確鎖定 `protocolVersion`，以確保您的 card 與回應永遠一致。

:::

Task methods（`tasks/get`、`tasks/list`、…）會原封不動轉送至上游 agent。版本轉換僅適用於 LiteLLM 整合的 messaging 路徑。

### 相依性 {#dependency}

LiteLLM proxy A2A 路由需要 **a2a-sdk >= 1.1.0**（包含於 `proxy` / `proxy-dev` 相依群組中）。如果您從自己的程式碼呼叫 agents，請安裝相對應的 SDK 版本：

```bash
pip install "a2a-sdk>=1.1.0,<2.0"
```

## 呼叫您的 Agents {#invoking-your-agents}

請參考 [呼叫 A2A Agents](./a2a_invoking_agents) 指南，了解如何使用以下方式呼叫您的 agents：
- **A2A SDK** - 原生 A2A protocol，完整支援 tasks 和 artifacts
- **OpenAI SDK** - 熟悉的 `/chat/completions` 介面，搭配 `a2a/` model prefix

## 追蹤 Agent 記錄 {#tracking-agent-logs}

呼叫 agent 後，您可以在 LiteLLM 的 **Logs** 分頁查看 request 記錄。

記錄會顯示：
- 傳送給 agent 與從 agent 收到的 **Request/Response content**
- 進行追蹤的 **User、Key、Team** 資訊，顯示是哪個人發出的 request
- **延遲與成本** 指標

<Image 
  img={require('../img/agent2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>

## 轉送 LiteLLM Context Headers {#forwarding-litellm-context-headers}

當 LiteLLM 呼叫您的 A2A agent 時，會傳送特殊 headers 以啟用：
- **Trace Grouping**：來自同一次 agent 執行的所有 LLM calls 會顯示在同一條 trace 下
- **Agent Spend Tracking**：成本會歸屬到特定的 agent

| 標頭 | 用途 |
|--------|---------|
| `X-LiteLLM-Trace-Id` | 將所有 LLM calls 連結到同一個執行流程 |
| `X-LiteLLM-Agent-Id` | 將費用歸屬給正確的 agent |

若要啟用這些功能，您的 A2A server 必須將這些 headers **轉送** 到其回呼至 LiteLLM 的任何 LLM calls。

### 實作步驟 {#implementation-steps}

**步驟 1：從傳入的 A2A request 擷取 headers**
```python def get_litellm_headers(request) -> dict:
    """Extract X-LiteLLM-* headers from incoming A2A request."""
    all_headers = request.call_context.state.get('headers', {})
    return {
        k: v for k, v in all_headers.items() 
        if k.lower().startswith('x-litellm-')
    }
```

**步驟 2：將 headers 轉送至您的 LLM calls**
在回呼至 LiteLLM 時傳入已擷取的 headers：
<Tabs>
<TabItem value="openai" label="OpenAI SDK" default>

```python from openai import OpenAI

headers = get_litellm_headers(request)

client = OpenAI(
    api_key="sk-your-litellm-key",
    base_url="http://localhost:4000",
    default_headers=headers,  # Forward headers
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```
</TabItem>

<TabItem value="langchain" label="LangChain">

```python
from langchain_openai import ChatOpenAI

headers = get_litellm_headers(request)

llm = ChatOpenAI(
    model="gpt-4o",
    openai_api_key="sk-your-litellm-key",
    base_url="http://localhost:4000",
    default_headers=headers,  # Forward headers
)
```
</TabItem>
<TabItem value="litellm" label="LiteLLM SDK">

```python
import litellm

headers = get_litellm_headers(request)

response = litellm.completion(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    api_base="http://localhost:4000",
    extra_headers=headers,  # Forward headers
)
```
</TabItem>
<TabItem value="requests" label="HTTP (requests/httpx)">

```python
import httpx

headers = get_litellm_headers(request)
headers["Authorization"] = "Bearer sk-your-litellm-key"

response = httpx.post(
    "http://localhost:4000/v1/chat/completions",
    headers=headers,
    json={"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}
)
```
</TabItem>
</Tabs>

### 結果 {#result}

啟用 header 轉送後，您會看到：

**Langfuse 中的 Trace Grouping：**

<Image
  img={require('../img/a2a_trace_grouping.png')}
  style={{width: '80%', display: 'block', margin: '0', borderRadius: '8px'}}
/>

**Agent 支出歸因：**

<Image
  img={require('../img/a2a_agent_spend.png')}
  style={{width: '80%', display: 'block', margin: '0', borderRadius: '8px'}}
/>

## API 參考 {#api-reference}

### 端點 {#endpoints}

| 端點 | 方法 | 用途 |
|----------|--------|---------|
| `POST /a2a/{agent_id}` | JSON-RPC 2.0 | **主要** — 所有 A2A methods（見下表） |
| `POST /a2a/{agent_id}/message/send` | JSON-RPC | 僅 `message/send` 的別名 |
| `POST /v1/a2a/{agent_id}/message/send` | JSON-RPC | 僅 `message/send` 的別名 |
| `GET /a2a/{agent_id}/.well-known/agent.json` | Agent card | 探索（在 `url` 欄位中提供 proxy URL） |
| `GET /a2a/{agent_id}/.well-known/agent-card.json` | Agent card | 探索（標準路徑） |

`{agent_id}` 可能是 agent UUID 或已註冊的 agent 名稱。

### 支援的 JSON-RPC methods {#supported-json-rpc-methods}

請將這些任一 method 傳送至 `POST /a2a/{agent_id}` 的 `method` 欄位：

| 方法 | 說明 |
|--------|-------------|
| `message/send` | 傳送訊息；回傳 `task` 或 `message`（LiteLLM 整合路徑） |
| `message/stream` | 串流變體（NDJSON/SSE） |
| `tasks/get` | 依 `params.id` 取得任務狀態 |
| `tasks/list` | 列出任務（可選 `params.contextId`） |
| `tasks/cancel` | 依 `params.id` 取消任務 |
| `tasks/resubscribe` | 訂閱任務更新（串流） |
| `tasks/pushNotificationConfig/set` | 註冊推播通知設定 |
| `tasks/pushNotificationConfig/get` | 取得推播設定 |
| `tasks/pushNotificationConfig/list` | 列出某任務的推播設定 |
| `tasks/pushNotificationConfig/delete` | 刪除推播設定 |
| `agent/getAuthenticatedExtendedCard` | 擴充代理程式卡片 |

**路由：** `message/send` 和 `message/stream` 會透過 LiteLLM 的 A2A 用戶端（記錄、防護欄、花費）。所有其他方法都會轉送至 `agent_card_params.url` 中的上游 URL。任務 API 需要該 URL；僅支援 completion bridge 的代理程式只支援訊息方法。

請參閱 [支援的 A2A 方法](./a2a_agent_card#supported-a2a-methods) 以查看範例、別名與限制。

### 驗證 {#authentication}

請在兩個標頭其中之一中包含您的 LiteLLM Virtual Key — 當傳入的 `Authorization` 標頭可能攜帶要傳送給後端代理程式的權杖時，建議使用 `x-litellm-api-key`（例如，使用 [依慣例的透傳](./a2a_agent_headers#method-3--convention-based-forwarding) 來轉送呼叫者的身分）。

```
Authorization: Bearer sk-your-litellm-key
# or
x-litellm-api-key: Bearer sk-your-litellm-key
```

#### 每個代理程式的權限檢查 {#per-agent-permission-check}

在虛擬金鑰通過驗證後，LiteLLM 會檢查呼叫的金鑰（及其團隊）是否允許呼叫所請求的代理程式。如果不允許，回應為 HTTP 403。完整的交集模型與存取群組請參閱 [代理程式權限管理](./a2a_agent_permissions)。

#### Trace ID 強制（選用，每個代理程式） {#trace-id-enforcement-optional-per-agent}

代理程式可以要求每個傳入請求都帶有 trace ID，以便進行跨系統稽核串接。請在代理程式的 `litellm_params` 中設定 `require_trace_id_on_calls_to_agent: true`。設定後，缺少 `x-litellm-trace-id`（或 `x-litellm-session-id`）的請求會以 HTTP 400 拒絕。

```bash title="Register an agent that requires inbound trace IDs" showLineNumbers
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "audit-critical-agent",
    "agent_card_params": { ... },
    "litellm_params": {
      "require_trace_id_on_calls_to_agent": true
    }
  }'
```

相反方向——強制由代理程式擁有的金鑰所發出的 **outbound** 呼叫必須帶有 trace ID——則由同一個 `litellm_params` 區塊中的 `require_trace_id_on_calls_by_agent` 控制。

#### 子代理程式身分傳遞 {#sub-agent-identity-propagation}

當後端代理程式本身呼叫 LiteLLM（用於 chat completions 或呼叫子代理程式）時，LiteLLM 會轉送兩個標頭以維持 trace 的連續性：

- `X-LiteLLM-Trace-Id` — 將鏈中的所有呼叫連結到單一 trace
- `X-LiteLLM-Agent-Id` — 將花費歸屬給原始代理程式

呼叫者的 **virtual key** 與 **end-user ID** 不會自動轉送。若下游代理程式需要使用者身分，請透過 [`extra_headers` 或 `x-a2a-{agent_name_or_id}-{header}` 慣例](./a2a_agent_headers) 明確傳遞。

### 請求格式 {#request-format}

LiteLLM 遵循 [A2A JSON-RPC 2.0 規格](https://github.com/google/A2A)。訊息本文結構取決於代理程式固定的 `protocolVersion`（若未固定，則取決於上方的用戶端訊號）。

<Tabs>
<TabItem value="v03" label="0.3 wire format" default>

```json title="Request Body (0.3)"
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [{"kind": "text", "text": "Your message here"}],
      "messageId": "unique-message-id"
    }
  }
}
```

</TabItem>
<TabItem value="v10" label="1.0 wire format">

請使用 [a2a-sdk 1.x 用戶端](./a2a_invoking_agents#a2a-sdk)（建議）或在代理程式固定為 `1.0` 時，傳送帶有 PascalCase 方法／`a2a-version: 1.0` 標頭的 JSON-RPC。

```json title="Request Body (1.0 SDK — protobuf types)"
// Build with a2a.types.Message, Part, Role, then wrap in SendMessageRequest
```

</TabItem>
</Tabs>

### 回應格式 {#response-format}

<Tabs>
<TabItem value="resp03" label="0.3 response" default>

```json title="Response (0.3 task result)"
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "kind": "task",
    "id": "task-id",
    "contextId": "context-id",
    "status": {"state": "completed", "timestamp": "2025-01-01T00:00:00Z"},
    "artifacts": [
      {
        "artifactId": "artifact-id",
        "name": "response",
        "parts": [{"kind": "text", "text": "Agent response here"}]
      }
    ]
  }
}
```

</TabItem>
<TabItem value="resp10" label="1.0 response">

```json title="Response (1.0 message envelope)"
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "message": {
      "role": "ROLE_AGENT",
      "messageId": "msg-abc",
      "parts": [{"text": "Agent response here"}]
    }
  }
}
```

串流事件會使用 `statusUpdate` / `artifactUpdate` 鍵，而非 `kind: "status-update"`。

</TabItem>
</Tabs>

代理程式 JSON-RPC 錯誤會以與請求相同的 `id`（若可能）回傳在 `error` 欄位中。在 `message/send` 回傳 `submitted` 任務後，請使用 `tasks/get` 輪詢長時間執行的工作。

### 範例：`tasks/get` {#example-tasksget}

```bash title="Poll task after message/send"
curl -X POST "http://localhost:4000/a2a/my-agent" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-2",
    "method": "tasks/get",
    "params": {"id": "task-id-from-send-response"}
  }'
```

## 代理程式登錄 {#agent-registry}

想建立一個中央登錄，讓您的團隊可以發現公司內有哪些可用的代理程式嗎？

請使用 [AI Hub](./proxy/ai_hub) 讓代理程式在整個組織內公開且可被發現。這可讓開發者瀏覽可用的代理程式，而不需要重新建置它們。
