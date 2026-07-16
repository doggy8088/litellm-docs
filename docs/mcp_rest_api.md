import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MCP REST API {#mcp-rest-api}

透過 HTTP **直接**呼叫 MCP 工具的指南。

當您已經知道要執行哪個工具時，請使用此方式。若是由 LLM 驅動的工具使用，請參閱 [使用您的 MCP](./mcp_usage.md)。

**基礎 URL：** `http://localhost:4000`（請替換為您的 LiteLLM proxy URL）

**驗證：** 每個請求都需使用 LiteLLM API 金鑰：

```bash
-H "Authorization: Bearer sk-1234"
# or
-H "x-litellm-api-key: sk-1234"
```

---

## 端點 {#endpoints}

| 方法 | 路徑 | 用途 |
|--------|------|---------|
| `GET` | `/v1/mcp/server` | 列出 MCP 伺服器（取得 `server_id` / `server_name`） |
| `GET` | `/mcp-rest/tools/list` | 列出工具（所有伺服器，或單一伺服器） |
| `POST` | `/mcp-rest/tools/call` | 執行工具 |

這些路由與 Claude Desktop 和 Cursor 使用的 JSON-RPC MCP 傳輸 `/mcp` 或 `/{server_name}/mcp` 是分開的。

---

## 工具命名 {#tool-naming}

LiteLLM 會註冊來自多個 MCP 伺服器的工具。請求中的工具名稱遵循以下兩種格式之一：

| 格式 | 使用時機 | 範例 |
|---------|-------------|---------|
| **帶前綴** | 全域工具清單，或自包含的工具 id | `places_api-getPlaces` |
| **不帶前綴 + `server_id`** | 每個伺服器的工具清單 | `server_id: places_api`, `name: getPlaces` |

**前綴格式：** `{server_prefix}{separator}{upstream_tool_name}`

- 預設 **分隔符號** 是 `-`（連字號）。
- 可在 proxy 上以環境變數 `MCP_TOOL_PREFIX_SEPARATOR` 覆寫。
- 使用 `LITELLM_USE_SHORT_MCP_TOOL_PREFIX=true` 時，前綴會是 3 字元的 id，而不是伺服器名稱（與 `{prefix}{separator}{tool}` 的形狀相同）。

proxy 會以不帶前綴的工具名稱（例如 `getPlaces`）呼叫**上游** MCP 伺服器，而不是完整的帶前綴字串。

---

## 1. 列出 MCP 伺服器 {#1-list-mcp-servers}

```bash
curl -s http://localhost:4000/v1/mcp/server \
  -H "Authorization: Bearer sk-1234" | jq .
```

在後續呼叫中使用回應中的 `server_id` 或 `server_name`。兩者都可在 `/mcp-rest/*` 中作為 `server_id` 使用。

---

## 2. 列出工具 {#2-list-tools}

### 所有伺服器 {#all-servers}

```bash
curl -s http://localhost:4000/mcp-rest/tools/list \
  -H "Authorization: Bearer sk-1234" | jq .
```

工具 `name` 值通常是**不帶前綴**的（例如 `getPlaces`），並以 `mcp_info.server_name` 指示伺服器。對於 `tools/call`，可使用以下任一方式：

- 使用**帶前綴**的 `name`：`places_api-getPlaces`，或  
- 使用**不帶前綴**的 `name` + **`server_id`**：`getPlaces` + `places_api`。

### 單一伺服器（建議用於探索） {#one-server-recommended-for-discovery}

`server_id` 接受 UUID、`server_name` 或別名。

```bash
curl -s "http://localhost:4000/mcp-rest/tools/list?server_id=places_api" \
  -H "Authorization: Bearer sk-1234" | jq .
```

回傳**不帶前綴**的上游名稱（例如 `getPlaces`、`ping`）。

---

## 3. 呼叫工具 {#3-call-a-tool}

### 請求主體 {#request-body}

| 欄位 | 必填 | 類型 | 說明 |
|-------|----------|------|-------------|
| `server_id` | 是 | string | UUID、`server_name` 或別名 |
| `name` | 是 | string | 帶前綴或不帶前綴的工具名稱（見上文） |
| `arguments` | 建議 | object | 工具參數；若無則使用 `{}`。若省略，proxy 會將其視為 `{}`。請勿傳入 `null`。 |

可選的 JSON-RPC 欄位（`jsonrpc`、`method`、`id`）會被 REST handler 忽略；您可以為了用戶端相容性而包含它們。

### 可行：帶前綴名稱 + 伺服器 UUID {#works-prefixed-name--server-uuid}

```bash
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "17a4490465f74d3696caf12b30220166",
    "name": "places_api-getPlaces",
    "arguments": {}
  }' | jq .
```

### 可行：不帶前綴名稱 + 伺服器名稱 {#works-unprefixed-name--server-name}

```bash
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "places_api",
    "name": "getPlaces",
    "arguments": { "query": "coffee" }
  }' | jq .
```

### 可行：`x-litellm-api-key` 標頭 {#works-x-litellm-api-key-header}

```bash
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "x-litellm-api-key: sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "order_status_mcp",
    "name": "order_status_mcp-order_status",
    "arguments": { "orderId": "ord1234" }
  }' | jq .
```

---

## 不可行的情況 {#what-does-not-work}

### 缺少 `server_id` {#missing-server_id}

```bash
# 400 missing_parameter
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{ "name": "places_api-getPlaces", "arguments": {} }'
```

### `arguments: null` {#arguments-null}

```bash
# 500 — arguments must be a JSON object, not null
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "places_api",
    "name": "places_api-getPlaces",
    "arguments": null
  }'
```

**修正：** 使用 `"arguments": {}`，或完全省略該欄位。

### 工具名稱中的分隔符號錯誤（底線而非連字號） {#wrong-separator-in-tool-name-underscore-instead-of-hyphen}

預設分隔符號是 `-`，而不是 `_`。

```bash
# Tool not found or wrong routing
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "places_api",
    "name": "places_api_getPlaces",
    "arguments": {}
  }'
```

**修正：** 使用 `places_api-getPlaces`，或設定 `MCP_TOOL_PREFIX_SEPARATOR` 以符合您的命名慣例。

### 工具屬於不同於 `server_id` 的伺服器 {#tool-belongs-to-a-different-server-than-server_id}

```bash
# 403 tool_server_mismatch
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "order_status_mcp",
    "name": "places_api-getPlaces",
    "arguments": {}
  }'
```

回應：

```json
{
  "detail": {
    "error": "tool_server_mismatch",
    "message": "Tool 'places_api-getPlaces' belongs to MCP server 'places_api' but request specified server_id for 'order_status_mcp'."
  }
}
```

### 無效或未知的 `server_id` {#invalid-or-unknown-server_id}

```bash
# 404 server_not_found (unknown name/uuid)
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "serverid1",
    "name": "some-tool",
    "arguments": {}
  }'
```

```bash
# 403 access_denied (server exists but key cannot access it)
```

### 來自客戶範例的預留位置伺服器 ids {#placeholder-server-ids-from-customer-examples}

像 `"serverid1"` / `"serverid2"` 這樣的字串並不有效，除非您已建立具有那些精確 ids 的伺服器。執行 `GET /v1/mcp/server` 並複製真實的 `server_id`，或使用 `server_name`。

---

## 快速參考 {#quick-reference}

<Tabs>
<TabItem value="list" label="列出工具">

```bash
# All servers
curl -s http://localhost:4000/mcp-rest/tools/list \
  -H "Authorization: Bearer sk-1234"

# One server
curl -s "http://localhost:4000/mcp-rest/tools/list?server_id=MY_SERVER" \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="call" label="呼叫工具">

```bash
curl -s -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "MY_SERVER",
    "name": "MY_SERVER-tool_name",
    "arguments": {}
  }'
```

</TabItem>
</Tabs>

---

## 相關文件 {#related-docs}

- [使用您的 MCP](./mcp_usage.md) — Responses API、Cursor、OpenAI SDK（LLM 驅動的 MCP）
- [MCP 概覽](./mcp.md) — Gateway 設定與 JSON-RPC `/mcp` 路由
- [MCP OAuth](./mcp_oauth.md) — 受 OAuth 保護的 MCP 伺服器
- [MCP Zero Trust](./mcp_zero_trust.md) — 上游 MCP 伺服器的 JWT 簽章
- [MCP 疑難排解](./mcp_troubleshoot.md) — 連線與驗證問題
