import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# A2A 代理程式驗證標頭 {#a2a-agent-authentication-headers}

將驗證憑證（Bearer tokens、API 金鑰等）從用戶端轉送到後端 A2A 代理程式。

## 總覽 {#overview}

當 LiteLLM 將請求代理到後端 A2A 代理程式時，該代理程式可能需要自己的驗證標頭。提供這些標頭有三種方式：

| 方法 | 由誰設定 | 運作方式 |
|---|---|---|
| **靜態標頭** | 管理員（UI / API） | 一律傳送，不論用戶端請求為何 |
| **轉送用戶端標頭** | 管理員（UI / API） | 擷取自用戶端請求並轉送的標頭名稱 |
| **慣例式** | 用戶端（無需管理員設定） | 用戶端傳送 `x-a2a-{agent_name}-{header}` — 自動路由 |

三種方式可以組合使用。**靜態標頭在衝突時一律優先**。

---

## 方法 1 — 靜態標頭 {#method-1--static-headers}

由管理員設定的標頭，會一律傳送到後端代理程式。適用於伺服器對伺服器的 token 或內部憑證，且用戶端不應看到或覆寫。

<Tabs>
<TabItem value="ui" label="UI">

1. 在 LiteLLM 儀表板中前往 **Agents**。
2. 建立或編輯代理程式。
3. 開啟 **Authentication Headers** 面板。
4. 在 **Static Headers** 下方，點擊 **Add Static Header** 並填入標頭名稱和值。

</TabItem>
<TabItem value="api" label="REST API">

```bash
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "my-agent",
    "agent_card_params": { ... },
    "static_headers": {
      "Authorization": "Bearer internal-server-token",
      "X-Internal-Service": "litellm-proxy"
    }
  }'
```

若要更新既有代理程式：

```bash
curl -X PATCH http://localhost:4000/v1/agents/{agent_id} \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "static_headers": {
      "Authorization": "Bearer new-token"
    }
  }'
```

</TabItem>
</Tabs>

**用戶端呼叫 — 不需要特殊標頭：**

```bash
curl -X POST http://localhost:4000/a2a/my-agent \
  -H "Authorization: Bearer sk-client-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", "id": "1", "method": "message/send",
    "params": { "message": { "role": "user", "parts": [{"kind": "text", "text": "Hello"}], "messageId": "msg-1" } }
  }'
```

後端代理程式會收到 `Authorization: Bearer internal-server-token`，而用戶端從未得知其值。

---

## 方法 2 — 轉送用戶端標頭 {#method-2--forward-client-headers}

管理員指定一組標頭**名稱**。當用戶端送出的請求包含這些標頭時，LiteLLM 會擷取其值並轉送到後端代理程式。值由用戶端控制；管理員控制哪些標頭可以被轉送。

<Tabs>
<TabItem value="ui" label="UI">

1. 在 LiteLLM 儀表板中前往 **Agents**。
2. 建立或編輯代理程式。
3. 開啟 **Authentication Headers** 面板。
4. 在 **Forward Client Headers** 下方，輸入標頭名稱並按 **Enter**（例如 `x-api-key`、`Authorization`）。

</TabItem>
<TabItem value="api" label="REST API">

```bash
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "my-agent",
    "agent_card_params": { ... },
    "extra_headers": ["x-api-key", "x-user-token"]
  }'
```

</TabItem>
</Tabs>

**用戶端呼叫 — 包含要轉送的標頭：**

```bash
curl -X POST http://localhost:4000/a2a/my-agent \
  -H "Authorization: Bearer sk-client-key" \
  -H "x-api-key: user-secret-value" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

後端代理程式會收到 `x-api-key: user-secret-value`。

:::note
標頭名稱比對是**不分大小寫**的。如果用戶端送出 `X-API-Key`，而 `extra_headers` 列出 `x-api-key`，兩者會相符。
:::

---

## 方法 3 — 基於慣例的轉送 {#method-3--convention-based-forwarding}

用戶端可以使用下列命名慣例，將標頭轉送到特定代理程式，而無需任何管理員預先設定：

```
x-a2a-{agent_name_or_id}-{header_name}: value
```

LiteLLM 會自動解析這些標頭，並只將其路由到相符的代理程式。

**範例：**

| 用戶端送出的標頭 | 代理程式名稱/ID | 轉送後作為 |
|---|---|---|
| `x-a2a-my-agent-authorization: Bearer tok` | `my-agent` | `authorization: Bearer tok` |
| `x-a2a-my-agent-x-api-key: secret` | `my-agent` | `x-api-key: secret` |
| `x-a2a-abc123-authorization: Bearer tok` | agent ID `abc123` | `authorization: Bearer tok` |

```bash
curl -X POST http://localhost:4000/a2a/my-agent \
  -H "Authorization: Bearer sk-client-key" \
  -H "x-a2a-my-agent-authorization: Bearer agent-specific-token" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

同一請求中送出的 `x-a2a-other-agent-authorization` 標頭**不會**轉送到 `my-agent` — 它會被靜默忽略。

:::tip 同時比對代理程式名稱與代理程式 ID
人類可讀的名稱（例如 `my-agent`）以及 UUID（例如 `abc123-...`）都有效。請依用戶端方便性選用。
:::

---

## 合併優先順序 {#merge-precedence}

當多種方法提供相同的標頭名稱時，**靜態標頭優先**：

```
dynamic (forwarded/convention)  →  merged  ←  static (overlays, wins)
```

範例：

| 來源 | `Authorization` 值 |
|---|---|
| 用戶端送出（透過 `extra_headers` 或慣例） | `Bearer client-token` |
| 管理員設定的 `static_headers` | `Bearer server-token` |
| **後端代理程式實際收到的內容** | **`Bearer server-token`** |

這可確保由管理員控制的憑證不會被用戶端請求覆寫。

---

## 組合三種方法 {#combining-all-three-methods}

```bash
# Register agent with static + forwarded headers
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "my-agent",
    "agent_card_params": { ... },
    "static_headers": {
      "X-Internal-Token": "secret123"
    },
    "extra_headers": ["x-user-id"]
  }'

# Client call using all three mechanisms
curl -X POST http://localhost:4000/a2a/my-agent \
  -H "Authorization: Bearer sk-client-key" \
  -H "x-user-id: user-42" \
  -H "x-a2a-my-agent-x-request-id: req-abc" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

後端代理程式會收到：

```
X-Internal-Token: secret123          ← static header (always)
x-user-id: user-42                   ← forwarded (in extra_headers)
x-request-id: req-abc                ← convention-based (x-a2a-my-agent-*)
X-LiteLLM-Trace-Id: <uuid>           ← LiteLLM internal
X-LiteLLM-Agent-Id: <agent-id>       ← LiteLLM internal
```

---

## 標頭隔離 {#header-isolation}

每次代理程式呼叫都會使用隔離的 HTTP 連線。為代理程式 A 設定的標頭**絕不會**傳送給代理程式 B，即使兩個代理程式都在執行並同時接收請求也是如此。

---

## API 參考 {#api-reference}

### `POST /v1/agents` / `PATCH /v1/agents/{agent_id}` {#post-v1agents--patch-v1agentsagent_id}

| 欄位 | 型別 | 說明 |
|---|---|---|
| `static_headers` | `object` | `{"Header-Name": "value"}` — 一律轉送 |
| `extra_headers` | `string[]` | 要從用戶端請求擷取並轉送的標頭名稱 |

### 代理程式回應 {#agent-response}

這兩個欄位會以 `GET /v1/agents` 和 `GET /v1/agents/{agent_id}` 傳回：

```json
{
  "agent_id": "...",
  "agent_name": "my-agent",
  "static_headers": { "X-Internal-Token": "secret123" },
  "extra_headers": ["x-user-id"],
  ...
}
```

:::caution
`static_headers` 值會儲存在資料庫中並由 API 傳回。請像對待任何憑證一樣對待它們——如果您的 API 可公開存取，請勿將敏感且長效的 token 儲存在此處。請改用短效 token 或透過環境注入的密鑰。
:::
