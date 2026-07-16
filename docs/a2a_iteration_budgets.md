import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 代理程式迭代預算 {#agent-iteration-budgets}

透過每個工作階段的迭代與預算上限，控制代理程式迴圈失控的成本。

## 總覽 {#overview}

當代理程式執行代理程式迴圈時，可能會進行無限制的 LLM 請求，造成非預期成本。LiteLLM 提供兩項控制：

| 控制 | 說明 |
|---------|-------------|
| **最大迭代次數** | 每個工作階段的 LLM 請求次數硬性上限 |
| **每個工作階段的最大預算** | 每個工作階段的美元上限（由 `x-litellm-trace-id` 識別） |

這兩項控制都需要 `session_id`（透過 `x-litellm-trace-id` 標頭或 `metadata.session_id` 傳送），以便追蹤工作階段內的請求。

## Trace-ID 強制 {#trace-id-enforcement}

LiteLLM 支援兩個獨立的 trace-id 標記，並在代理程式上於 `litellm_params` 中設定：

| 標記 | 說明 |
|------|-------------|
| `require_trace_id_on_calls_to_agent` | 要求呼叫此代理程式的呼叫端包含 `x-litellm-trace-id`。當代理程式只能作為具有追蹤內容的子代理程式被呼叫時使用。若缺少則回傳 **400**。 |
| `require_trace_id_on_calls_by_agent` | 要求此代理程式**透過其虛擬金鑰**所發出的所有 LLM/MCP 請求都包含 `x-litellm-trace-id`。這可啟用 `max_iterations` 與 `max_budget_per_session` 追蹤。若缺少則回傳 **400**。 |

## 透過 UI 設定 {#configuring-via-ui}

在 LiteLLM 管理員 UI 中建立代理程式時：

1. 前往 **Agents** 分頁並點選 **Add Agent**
2. 在 **Agent Settings** 步驟中，展開 **Tracing** 區段
3. 開啟 **Require x-litellm-trace-id on calls BY this agent** 以啟用工作階段追蹤
4. 設定 **Max Iterations** 以限制每個工作階段的 LLM 請求次數
5. 設定 **Max Budget Per Session ($)** 以限制每個工作階段的支出

trace-id 標記會儲存在代理程式的 `litellm_params` 上。預算控制（`max_iterations`、`max_budget_per_session`）則儲存在虛擬金鑰的中繼資料中。

## 透過 API 設定 {#configuring-via-api}

在代理程式本身上設定 trace-id 強制：

```bash
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent with budget controls",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "litellm_params": {
      "require_trace_id_on_calls_to_agent": true,
      "require_trace_id_on_calls_by_agent": true
    }
  }'
```

預算控制是設定在代理程式的 `litellm_params` 上（不是個別金鑰），因此會套用到該代理程式的所有金鑰：

```bash
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent with budget controls",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "litellm_params": {
      "require_trace_id_on_calls_by_agent": true,
      "max_iterations": 25,
      "max_budget_per_session": 5.00
    }
  }'
```

## 運作方式 {#how-it-works}

### 工作階段追蹤 {#session-tracking}

呼叫端可透過以下任一方式包含 `session_id` 來識別其工作階段：
- **標頭**：`x-litellm-trace-id: my-session-123`
- **中繼資料**：`{"metadata": {"session_id": "my-session-123"}}`

### 最大迭代次數 {#max-iterations}

當在代理程式 `litellm_params` 中設定 `max_iterations` 時：
- 每次針對某個工作階段的 LLM 請求都會使計數器加 1
- 當計數器超過 `max_iterations` 時，請求會收到 **429 Too Many Requests**
- 計數器預設會在 1 小時後過期（可透過 `LITELLM_MAX_ITERATIONS_TTL` 環境變數設定）

### 每個工作階段的最大預算 {#max-budget-per-session}

當在代理程式 `litellm_params` 中設定 `max_budget_per_session` 時：
- 每次成功的 LLM 請求後，該回應成本會累計到工作階段
- 每次請求前，都會檢查累計支出是否超過預算
- 當支出超過預算時，請求會收到 **429 Too Many Requests**
- 工作階段支出計數器預設會在 1 小時後過期（可透過 `LITELLM_MAX_BUDGET_PER_SESSION_TTL` 環境變數設定）

## 範例 {#example}

建立一個最多 25 次迭代且預算上限為 5 美元的代理程式：

<Tabs>
<TabItem value="ui" label="透過 UI">

1. 前往 **Agents** → **Add Agent**
2. 設定您的代理程式（名稱、模型等）
3. 在 **Agent Settings** 中，展開 **Tracing** 區段
4. 開啟 **Require x-litellm-trace-id on calls BY this agent**
5. 將 **Max Iterations** 設為 `25`
6. 將 **Max Budget Per Session** 設為 `5.00`
7. 接著為代理程式建立新的金鑰
8. 點選 **Create Agent**

</TabItem>
<TabItem value="api" label="透過 API">

```bash
# 1. Create the agent with trace-id enforcement
curl -X POST 'http://localhost:4000/v1/agents' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_name": "my-research-agent",
    "agent_card_params": {
      "name": "my-research-agent",
      "description": "A research agent with budget controls",
      "url": "http://my-agent:8080",
      "version": "1.0.0"
    },
    "litellm_params": {
      "require_trace_id_on_calls_by_agent": true
    }
  }'

# 2. Create a key for the agent
curl -X POST 'http://localhost:4000/key/generate' \
  -H 'Authorization: Bearer sk-1234' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "<agent_id_from_step_1>",
    "key_alias": "my-research-agent-key"
  }'
```

</TabItem>
</Tabs>

### 使用工作階段追蹤進行請求 {#making-calls-with-session-tracking}

```bash
curl -X POST 'http://localhost:4000/chat/completions' \
  -H 'Authorization: Bearer sk-agent-key-xxx' \
  -H 'x-litellm-trace-id: session-abc-123' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

在此工作階段內使用 25 次請求或支出 5 美元之後，後續請求將收到：

```json
{
  "error": {
    "message": "Session budget exceeded for session session-abc-123. Current spend: $5.0032, max_budget_per_session: $5.00.",
    "type": "budget_exceeded",
    "code": 429
  }
}
```

## 環境變數 {#environment-variables}

| 變數 | 預設值 | 說明 |
|----------|---------|-------------|
| `LITELLM_MAX_ITERATIONS_TTL` | `3600`（1 小時） | 工作階段迭代計數器的 TTL（秒） |
| `LITELLM_MAX_BUDGET_PER_SESSION_TTL` | `3600`（1 小時） | 工作階段預算計數器的 TTL（秒） |
