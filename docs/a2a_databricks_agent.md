import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Databricks Agents {#databricks-agents}

將 Databricks ResponsesAgent 註冊為 LiteLLM 代理程式，並透過 `/a2a/<agent>` 呼叫它，或在 `/v1/chat/completions`、`/v1/responses` 與 `/v1/messages` 上以 `model: a2a/<agent>` 呼叫。

| 功能 | 是否支援 |
|---|---|
| 代理程式類型 | `databricks_agent` |
| Model Serving endpoints | ✅ |
| Databricks Apps | ✅ |
| 串流 | ✅ |
| 驗證 | Personal access token、OAuth M2M service principal |

## 運作方式 {#how-it-works}

Databricks ResponsesAgent 使用 OpenAI Responses API 的形狀。LiteLLM 會將 chat 訊息攤平為 Responses `input` 項目，送給代理程式，再將代理程式的 `output` 對應回 chat completion 或 A2A 訊息。工具呼叫保留在代理程式內部，因此不會進行任何對應。

## 端點 URL {#endpoint-urls}

`api_base` 可採用以下任一形狀。只有在 URL 尚未指名端點時，端點名稱才放在 `model` 中。

| `api_base` | `model` | LiteLLM 實際呼叫 |
|---|---|---|
| `https://<workspace>` 或 `https://<workspace>/serving-endpoints` | 必填 | `https://<workspace>/serving-endpoints/<model>/invocations` |
| `https://<workspace>/serving-endpoints/<endpoint>` | 忽略 | `https://<workspace>/serving-endpoints/<endpoint>/invocations` |
| `https://<workspace>/serving-endpoints/<endpoint>/invocations` | 忽略 | 按給定的 URL |
| `https://<workspace>/serving-endpoints/responses` | 必填，作為主體的 `model` 送出 | 按給定的 URL |
| `https://<app>.databricksapps.com` | 忽略 | `https://<app>.databricksapps.com/responses` |
| `https://<app>.databricksapps.com/<path>` | 忽略 | 按給定的 URL |

沒有 `model` 的 workspace 或 unified URL 會在進行任何呼叫之前就回應 400。

## 驗證 {#authentication}

代理程式自身的憑證優先於用戶端的 `Authorization` 標頭。順序為：鑄造的 OAuth token、代理程式的 `api_key`（personal access token）、由 `DATABRICKS_CLIENT_ID` 與 `DATABRICKS_CLIENT_SECRET` 環境變數鑄造的 OAuth M2M token，然後是 `DATABRICKS_API_KEY` 環境變數。只有當代理程式以上皆無時，才會使用用戶端的 `Authorization` 標頭。

### OAuth M2M（建議） {#oauth-m2m-recommended}

Databricks Apps 只接受 OAuth token，OAuth M2M 也是 Model Serving 在生產環境的建議驗證方式。請在代理程式上設定 service principal 的 `client_id` 與 `client_secret`。對於 Model Serving，`workspace_url` 預設為 `api_base` 的來源。Databricks App 主機永遠不是 token 端點，因此 App 代理程式必須設定 `workspace_url`，而且 client secret 永遠不會送到 App 主機。

鑄造的 token 會快取到即將到期之前，並在下一次呼叫時刷新。

### Personal access token {#personal-access-token}

將 `api_key` 設為 PAT，或在 proxy 的環境中設定 `DATABRICKS_API_KEY`。Databricks Apps 會拒絕 PAT。

### 環境 service principal {#environment-service-principal}

當 proxy 的環境設定了 `DATABRICKS_CLIENT_ID` 與 `DATABRICKS_CLIENT_SECRET` 時，沒有 `api_key` 的 `databricks_agent` 會從它們鑄造 OAuth M2M token，方式與 `databricks` 模型提供者相同，即使同時也設定了 `DATABRICKS_API_KEY` 亦然。token 會依 workspace 快取到即將到期之前。token 端點在有設定時為 `DATABRICKS_HOST` workspace，否則為 `api_base` 的來源。App `api_base` 若沒有 `DATABRICKS_HOST`，會回應 400 並指名 `DATABRICKS_HOST`。

## 註冊代理程式 {#register-the-agent}

<Tabs>
<TabItem value="ui" label="UI">

1. 在 LiteLLM 儀表板中前往 **Agentic** > **Agents**。
2. 點擊 **Add New Agent** 並選擇 **Databricks Agent**。
3. 輸入代理程式名稱、`api_base`，以及在 URL 尚未指名端點時輸入 `model`（serving endpoint 名稱）。
4. 填入 personal access token，或 service principal 的 `client_id`、`client_secret`，若為 App 還要填 `workspace_url`。
5. 儲存代理程式。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml title="config.yaml"
agents:
  - agent_name: dbx-serving
    agent_card_params:
      name: "Databricks ResponsesAgent on Model Serving"
    litellm_params:
      custom_llm_provider: databricks_agent
      model: my-responses-agent
      api_base: https://adb-1234567890123456.7.azuredatabricks.net
      client_id: os.environ/DATABRICKS_CLIENT_ID
      client_secret: os.environ/DATABRICKS_CLIENT_SECRET

  - agent_name: dbx-app
    agent_card_params:
      name: "Databricks App ResponsesAgent"
    litellm_params:
      custom_llm_provider: databricks_agent
      api_base: https://my-agent-app-1234567890123456.7.azure.databricksapps.com
      client_id: os.environ/DATABRICKS_CLIENT_ID
      client_secret: os.environ/DATABRICKS_CLIENT_SECRET
      workspace_url: https://adb-1234567890123456.7.azuredatabricks.net
```

</TabItem>
<TabItem value="api" label="REST API">

```bash
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "dbx-serving",
    "agent_card_params": {"name": "Databricks ResponsesAgent on Model Serving"},
    "litellm_params": {
      "custom_llm_provider": "databricks_agent",
      "model": "my-responses-agent",
      "api_base": "https://adb-1234567890123456.7.azuredatabricks.net",
      "api_key": "os.environ/DATABRICKS_API_KEY"
    }
  }'
```

</TabItem>
</Tabs>

## 呼叫代理程式 {#call-the-agent}

<Tabs>
<TabItem value="chat" label="Chat completions">

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-client-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "a2a/dbx-serving",
    "messages": [{"role": "user", "content": "Reply with exactly: pong"}],
    "custom_inputs": {"tenant": "t-1"}
  }'
```

`stream: true` 會將代理程式的 `output_text` 增量以 chat chunks 串流。`/v1/responses` 與 `/v1/messages` 接受相同的 `model: a2a/<agent>`。

</TabItem>
<TabItem value="a2a" label="A2A">

```bash
curl http://localhost:4000/a2a/dbx-serving \
  -H "Authorization: Bearer sk-client-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "messageId": "1",
        "parts": [{"kind": "text", "text": "Reply with exactly: pong"}]
      }
    }
  }'
```

`message/stream` 會串流一個 task、一個 working 狀態、一個帶有回覆的 artifact，以及一個 completed 狀態。

</TabItem>
</Tabs>

## 請求參數 {#request-parameters}

`custom_inputs`、`context`、`databricks_options`、`temperature`、`top_p` 與 `user` 會按原樣傳給代理程式，`max_tokens` 或 `max_completion_tokens` 會以 `max_output_tokens` 送出。其他 OpenAI 參數會回應 400，除非設定了 `drop_params`，在此情況下它們會被丟棄。

當代理程式本身設定了 `custom_inputs` 或 `extra_body` 時，代理程式的鍵會逐鍵勝過呼叫者的鍵，呼叫者的其他鍵仍會送達代理程式。呼叫者的 `extra_body` 無法設定 `model` 或 `input`，它們會回應 400，除非設定了 `drop_params`。用戶端的 `X-LiteLLM-*` 標頭永遠不會轉送給代理程式。

訊息以文字送出。影像、檔案與音訊內容部分、assistant 的 `tool_calls`，以及 `tool` 或 `function` 訊息會回應 400 並指名它們。在 `drop_params` 下它們會被丟棄，而什麼都不剩的訊息會從請求中省略。

代理程式的 `custom_outputs`（若有）會在 chat 訊息的 `provider_specific_fields` 下回傳。沒有 `usage` 的回覆會在本機計算其 tokens。

## 相關 {#related}

- [Invoking A2A Agents](a2a_invoking_agents)
- [A2A Agent Authentication Headers](a2a_agent_headers)
- [Databricks model provider](/docs/providers/databricks)
