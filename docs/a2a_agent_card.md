# A2A 代理卡 {#a2a-agent-card}

LiteLLM 可以代理 [A2A 相容代理程式](https://a2a-protocol.org/latest/specification/)，透過 LiteLLM 搭配虛擬金鑰、團隊範圍、可觀測性，以及統一的代理卡，將它們提供給您的用戶端。

本頁文件說明 LiteLLM 目前支援哪些 A2A 代理卡欄位、呼叫流程如何運作，以及透過 `/a2a/{agent_id}/.well-known/agent.json` 提供的代理卡代理版本會是什麼樣子。

如需提供者特定設定，請參閱：

- [註冊 LangGraph Platform 代理程式](./providers/langgraph#register-a-langgraph-platform-agent)

## 代理卡支援 {#agent-card-support}

下列欄位與 A2A v1.0 規格（[§4.4 代理程式探索物件](https://a2a-protocol.org/latest/specification/)）相對應。✅ 表示該欄位存在於 LiteLLM 提供給用戶端的代理卡中；❌ 表示該欄位不存在。

### AgentCard（§4.4.1） {#agentcard-441}

| 欄位 | 支援 |
|---|---|
| `protocolVersion` | ✅ |
| `name` | ✅ |
| `description` | ✅ |
| `supportedInterfaces` | ✅ |
| `provider` | ✅ |
| `version` | ✅ |
| `documentationUrl` | ✅ |
| `capabilities` | ✅ |
| `securitySchemes` | ✅ |
| `securityRequirements` | ✅ |
| `defaultInputModes` | ✅ |
| `defaultOutputModes` | ✅ |
| `skills` | ✅ |
| `signatures` | ❌ |
| `iconUrl` | ✅ |

### AgentProvider（§4.4.2） {#agentprovider-442}

| 欄位 | 支援 |
|---|---|
| `url` | ✅ |
| `organization` | ✅ |

### AgentCapabilities（§4.4.3） {#agentcapabilities-443}

| 欄位 | 支援 |
|---|---|
| `streaming` | ✅ |
| `pushNotifications` | ❌ |
| `extensions` | ❌ |
| `extendedAgentCard` | ❌ |

### AgentExtension（§4.4.4） {#agentextension-444}

| 欄位 | 支援 |
|---|---|
| `uri` | ❌ |
| `description` | ❌ |
| `required` | ❌ |
| `params` | ❌ |

### AgentSkill（§4.4.5） {#agentskill-445}

| 欄位 | 支援 |
|---|---|
| `id` | ✅ |
| `name` | ✅ |
| `description` | ✅ |
| `tags` | ✅ |
| `examples` | ✅ |
| `inputModes` | ✅ |
| `outputModes` | ✅ |
| `securityRequirements` | ❌ |

### AgentInterface（§4.4.6） {#agentinterface-446}

| 欄位 | 支援 |
|---|---|
| `url` | ✅ |
| `protocolBinding` | ✅ |
| `tenant` | ❌ |
| `protocolVersion` | ✅ |

### AgentCardSignature（§4.4.7） {#agentcardsignature-447}

| 欄位 | 支援 |
|---|---|
| `protected` | ❌ |
| `signature` | ❌ |
| `header` | ❌ |

## A2A 在 LiteLLM 上如何運作 {#how-a2a-on-litellm-works}

當您在 LiteLLM 中註冊 A2A 代理程式時：

1. 您提供基礎 URL（以及對某些提供者而言，還要提供 assistant 識別碼）。
2. LiteLLM 會從代理程式的 `/.well-known/agent-card.json`（或提供者特定的對應位置）擷取上游代理卡。
3. 您在 LiteLLM UI 中檢閱解析後的卡片，選擇要公開哪些技能與欄位，並為用戶端選擇一個 **Protocol Version**（`1.0` 或 `0.3`）。
4. LiteLLM 會儲存整理後的卡片，並在以下位置提供：

    ```
    GET /a2a/{agent_id}/.well-known/agent.json
    ```

5. 用戶端在以下位置呼叫代理程式：

    ```
    POST /a2a/{agent_id}
    ```

    使用 A2A JSON-RPC 2.0（請參閱下方的[支援的 A2A 方法](#supported-a2a-methods)）。

## 協定版本控制 {#protocol-versioning}

LiteLLM 會將上游代理程式回應轉換為每個代理程式上固定的 `protocolVersion`。無論上游代理程式原生使用哪種版本，用戶端都只會看到您選擇的版本。

| `protocolVersion` | 提供給用戶端 |
|-------------------|-------------------|
| `"1.0"`（新卡片預設） | Protobuf JSON 封包 — `result.message`，串流 `statusUpdate` / `artifactUpdate` |
| `"0.3"` | 舊版 `kind`-區分的 JSON — `result.kind == "message"` |

您可以在代理卡 UI 中設定此項目，或在註冊時於 `agent_card_params` 中設定。不支援的值會以 HTTP 400 拒絕。

Completion-bridge 代理程式（LangGraph、Bedrock AgentCore 等）不需要額外的提供者設定 — 只有當您的用戶端期望特定的 wire format 時，才需要固定 `protocolVersion`。

當 `protocolVersion` 未固定時，請參閱[協定版本控制](./a2a#protocol-versioning)以了解用戶端協商。

## 支援的 A2A 方法 {#supported-a2a-methods}

下列所有方法都可在 `POST /a2a/{agent_id}` 上接受（以及 `POST /a2a/{agent_id}/message/send` 於 `message/send`）。LiteLLM 也接受來自 A2A SDK 的 PascalCase 別名（例如 `GetTask` → `tasks/get`）。

| 方法 | 支援 | LiteLLM 如何處理 |
|---|---|---|
| `message/send` | ✅ | 透過 LiteLLM A2A SDK 路由（`asend_message`）— 記錄、防護欄、成本追蹤 |
| `message/stream` | ✅ | 透過 LiteLLM 串流處理器路由 — NDJSON/SSE 回應 |
| `tasks/get` | ✅ | JSON-RPC 轉送至代理程式的 `agent_card_params.url` |
| `tasks/list` | ✅ | JSON-RPC 轉送至上游 |
| `tasks/cancel` | ✅ | JSON-RPC 轉送至上游 |
| `tasks/resubscribe` | ✅ | JSON-RPC 轉送至上游（串流/SSE） |
| `tasks/pushNotificationConfig/set` | ✅ | JSON-RPC 轉送至上游 |
| `tasks/pushNotificationConfig/get` | ✅ | JSON-RPC 轉送至上游 |
| `tasks/pushNotificationConfig/list` | ✅ | JSON-RPC 轉送至上游 |
| `tasks/pushNotificationConfig/delete` | ✅ | JSON-RPC 轉送至上游 |
| `agent/getAuthenticatedExtendedCard` | ✅ | JSON-RPC 轉送至上游；`result.url` 重新寫入為代理 |

### PascalCase 別名（SDK） {#pascalcase-aliases-sdk}

| SDK / 別名名稱 | Wire method |
|---|---|
| `SendMessage` | `message/send` |
| `SendStreamingMessage` | `message/stream` |
| `GetTask` | `tasks/get` |
| `ListTasks` | `tasks/list` |
| `CancelTask` | `tasks/cancel` |
| `SubscribeToTask` | `tasks/resubscribe` |
| `CreateTaskPushNotificationConfig` | `tasks/pushNotificationConfig/set` |
| `GetTaskPushNotificationConfig` | `tasks/pushNotificationConfig/get` |
| `ListTaskPushNotificationConfigs` | `tasks/pushNotificationConfig/list` |
| `DeleteTaskPushNotificationConfig` | `tasks/pushNotificationConfig/delete` |
| `GetExtendedAgentCard` | `agent/getAuthenticatedExtendedCard` |

### 要求 {#requirements}

- **Task 和 push-notification 方法** 需要 `agent_card_params.url` 指向真實的 A2A JSON-RPC 伺服器。LiteLLM 會原封不動轉送請求主體（除了驗證標頭）。
- **僅限 Completion-bridge 代理程式**（例如具有 `custom_llm_provider` 且沒有 `url` 的 LangGraph/Bedrock AgentCore）只支援 `message/send` 和 `message/stream`。若未設定上游 URL，Task API 會傳回錯誤。
- **僅限 `message/send` / `message/stream`：** LiteLLM 可能會從 `params` 中移除 LiteLLM 特定鍵（例如 `guardrails`）。Task method `params` 會原樣轉送，因此像 `id` 這類 A2A 欄位會被保留。

### 範例：兩步驟 task 流程 {#example-two-step-task-flow}

```bash title="1. Send a message (0.3 wire format — pin protocolVersion: 0.3)"
curl -X POST "http://localhost:4000/a2a/my-agent" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "r1",
    "method": "message/send",
    "params": {
      "message": {
        "kind": "message",
        "role": "user",
        "messageId": "m1",
        "parts": [{"kind": "text", "text": "Hello"}]
      }
    }
  }'
```

將回應中的 `result.id` 作為 task id 使用：

```bash title="2. Poll task status"
curl -X POST "http://localhost:4000/a2a/my-agent" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "r2",
    "method": "tasks/get",
    "params": {"id": "<task-id-from-step-1>"}
  }'
```

---

## 技能路由 {#skill-routing}

用戶端可在訊息中繼資料中包含 `skillId` 來呼叫特定技能：

```json
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "method": "message/send",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "user",
      "parts": [{"kind": "text", "text": "..."}],
      "metadata": {"skillId": "triage_ticket"}
    }
  }
}
```

LiteLLM 會將整個訊息封包（包括中繼資料）原封不動地轉送給上游代理程式。上游代理程式負責讀取 `skillId` 並在內部進行路由。

## 編輯代理卡 {#editing-the-agent-card}

您可以從 LiteLLM UI 中的代理程式詳細頁面編輯支援的欄位。使用 **從上游重新同步** 按鈕來取得自註冊以來上游代理程式新增的技能或能力；它會顯示差異，並讓您選擇性接受變更。

## 相關文件 {#related-documentation}

- [註冊 LangGraph Platform 代理程式](./providers/langgraph#register-a-langgraph-platform-agent)
- [A2A 協定規格（v1.0）](https://a2a-protocol.org/latest/specification/)
