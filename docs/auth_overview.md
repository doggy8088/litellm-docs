import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 閘道驗證參考 {#gateway-auth-reference}

LiteLLM 提供兩個閘道介面，它們共用大多數驗證與授權原語，但在幾個重要之處有所不同。本頁是並列參考：哪些標頭負責什麼、兩個介面在哪些地方是對稱的、哪些地方不是。每個章節都連結到專門頁面以深入說明。

| 介面 | 端點 | 專用文件 |
|---|---|---|
| **MCP Gateway** | `/mcp`, `/{server}/mcp`, `/toolset/{name}/mcp`, `/sse`, `/v1/mcp/...`, `/mcp-rest/...` | [MCP 總覽](./mcp) |
| **A2A Agent Gateway** | `/a2a/{agent_id}`, `/a2a/{agent_id}/message/send`, `/v1/agents/...` | [A2A 總覽](./a2a) |

---

## 1. 用戶端 → LiteLLM（驗證呼叫端） {#1-client--litellm-authenticating-the-caller}

兩個介面都接受相同的 LiteLLM Virtual Key 標頭與相同的識別標頭。它們唯一分歧之處：MCP **ASGI** 路由（位於 `/mcp`, `/{name}/mcp`, `/toolset/{name}/mcp`, `/sse` 的可串流 MCP 端點）會略過標準 FastAPI 驗證依賴，且不會解析提供者特定的驗證別名（`API-Key`, `x-api-key`, `x-goog-api-key`, `Ocp-Apim-Subscription-Key`）或 `x-litellm-tags`。MCP **REST/管理** 路由（`/v1/mcp/...`, `/mcp-rest/...`）以及 **所有** A2A 路由都接受完整標頭集合。

| 標頭 | 用途 | MCP ASGI | MCP REST + A2A |
|---|---|---|---|
| `x-litellm-api-key: Bearer sk-...` | 首選的 LiteLLM Virtual Key 標頭。當傳入的 `Authorization` 標頭可能帶有不同 token（OAuth 透傳、OBO、A2A 每位使用者轉送）時請使用。 | ✓ | ✓ |
| `Authorization: Bearer sk-...` | 標準備用。查詢前會移除 `Bearer ` 前綴。 | ✓ | ✓ |
| `API-Key`, `x-api-key`, `x-goog-api-key`, `Ocp-Apim-Subscription-Key` | 提供者特定別名（Azure、Anthropic、Google AI Studio、Azure APIM）。 | — | ✓ |
| `x-litellm-end-user-id` | 端使用者識別。在金鑰之上套用每位使用者預算、MCP 存取交集與稽核記錄項目。`x-litellm-customer-id` 是可接受的別名。 | ✓ | ✓ |
| `x-litellm-trace-id` | 跨請求關聯 ID。回退至 `x-litellm-session-id` 或任何相符的 `x-<vendor>-session-id` 標頭。 | ✓ | ✓ |
| `x-litellm-session-id` | 工作階段分組。與 trace-id 使用相同的解析路徑，優先順序較低。 | ✓ | ✓ |
| `x-litellm-tags` | 以逗號分隔的標籤，用於支出記錄標記與基於標籤的路由。本文欄位 `tags` 具有優先權。 | —（MCP ASGI 不會解析） | ✓ |
| `x-litellm-mcp-debug: true` | 傳回遮罩後的診斷回應標頭（`x-mcp-debug-*`）。請參閱 [MCP OAuth — 除錯](./mcp_oauth#debugging-oauth)。 | ✓ | — |
| `x-mcp-servers` | 將請求範圍限定到特定 MCP 伺服器（以逗號分隔）。 | ✓ | — |

---

## 2. LiteLLM → 後端（驗證閘道到代理程式或 MCP 伺服器） {#2-litellm--backend-authenticating-the-gateway-to-the-agent-or-mcp-server}

這一節是 MCP 與 A2A 分歧最大的地方。MCP 在每個伺服器註冊上都有第一級的 `auth_type` 欄位。**A2A 完全沒有 `auth_type` 欄位**——外送驗證模式會根據 `litellm_params` 中的內容推斷。

### MCP — `auth_type` 列舉 {#mcp--auth_type-enum}

九個值。MCP 伺服器的外送 `Authorization` 標頭（或逐請求 SigV4 簽章）由 `auth_type` 決定。完整表格請參閱 [MCP 總覽 — 新增 HTTP MCP 伺服器](./mcp#add-http-mcp-server)。

| `auth_type` | 機制 | 專用文件 |
|---|---|---|
| `none` | 不新增驗證標頭 | — |
| `api_key` / `bearer_token` / `basic` / `authorization` / `token` | 靜態標頭，每次呼叫都原樣送出 | [MCP 總覽](./mcp) |
| `oauth2` | PKCE（互動式）或 M2M `client_credentials`。由 `oauth2_flow` 區分。 | [MCP OAuth](./mcp_oauth) |
| `oauth2_token_exchange` | RFC 8693 代表使用者（OBO）— 將呼叫端的 bearer token 交換為具範圍的 MCP token | [MCP OBO 驗證](./mcp_obo_auth) |
| `aws_sigv4` | 使用專用 MCP 端憑證鏈進行逐請求 SigV4 簽章 | [MCP AWS SigV4](./mcp_aws_sigv4) |

### A2A — 由 `litellm_params` 推斷驗證模式 {#a2a--auth-mode-inferred-from-litellm_params}

agent 上沒有 `auth_type` 欄位。提供者處理器會根據 `litellm_params` 的內容挑選驗證機制：

| 模式 | 何時觸發 | 傳送到後端 |
|---|---|---|
| **Bearer / JWT** | `litellm_params.api_key` 已設定 | `Authorization: Bearer <api_key>` |
| **SigV4**（僅 AgentCore） | `litellm_params.api_key` 未設定 | 透過完整 AWS 憑證鏈進行逐請求 SigV4。請參閱 [Bedrock AgentCore — A2A Gateway Authentication](./providers/bedrock_agentcore#a2a-gateway-authentication)。 |
| **提供者原生** | `litellm_params.custom_llm_provider` 符合非 Bedrock 提供者（Vertex AI Agent Engine、LangGraph、Azure AI Foundry、Pydantic AI） | 該提供者的標準驗證路徑 |

雙重 JWT 與 SigV4 模式是 AgentCore 專屬。其他 A2A 提供者（Vertex、LangGraph、Azure Foundry）使用提供者自身的憑證慣例——請參閱 [Providers](./providers) 下相關提供者頁面。

### 零信任附加元件（僅 MCP） {#zero-trust-add-on-mcp-only}

如果 MCP 伺服器需要**以密碼學方式驗證**請求確實經由 LiteLLM，請在上層套用 [MCP JWT Signer](./mcp_zero_trust) 防護欄。它會以短效 RS256 JWT 簽署每個外送工具呼叫，並發布 MCP 伺服器可驗證的 JWKS 端點。這是防護欄（`guardrail: mcp_jwt_signer`, `mode: pre_mcp_call`），不是 `auth_type`——它可與任何 `auth_type` 組合使用。

---

## 3. 每位使用者標頭透傳 {#3-per-user-header-passthrough}

兩個介面都允許用戶端轉送要送往特定後端伺服器/代理程式的憑證，無須預先設定管理員設定。這些慣例看似對稱，但解析方式不同——複製貼上時務必精確。

| 介面 | 前綴 | 解析規則 | 比對對象 | 範例 |
|---|---|---|---|---|
| **MCP** | `x-mcp-` | 格式：`x-mcp-{server_alias}-{header_name}` | 伺服器的 `alias`，然後是 `server_name`（不區分大小寫） | `x-mcp-github-authorization: Bearer ghp_...` → 伺服器 `github`，標頭 `Authorization` |
| **A2A** | `x-a2a-` | 格式：`x-a2a-{agent_name_or_id}-{header_name}`；與 agent 的 UUID 與可讀名稱比對（兩者都會嘗試） | agent 的 UUID **以及** 可讀名稱（兩者都會嘗試） | `x-a2a-my-agent-x-api-key: secret` → agent `my-agent`，標頭 `x-api-key` |

兩個介面也都支援由管理員控制、可與使用者透傳組合的替代方式：

| 機制 | MCP | A2A | 備註 |
|---|---|---|---|
| `static_headers: {K: V}` | ✓ | ✓ | 一律傳送。若金鑰衝突，**優先於使用者透傳**。 |
| `extra_headers: [name, name, ...]` | ✓ | ✓ | 管理員允許清單中的用戶端標頭名稱，會原樣轉送。 |
| `x-<surface>-<id>-<header>` 慣例 | ✓ (`x-mcp-`) | ✓ (`x-a2a-`) | 由用戶端驅動，無需管理員設定。 |

完整機制請參閱 [MCP 總覽 — 轉送自訂標頭](./mcp#forwarding-custom-headers-to-mcp-servers) 與 [A2A Agent Authentication Headers](./a2a_agent_headers)。

---

## 4. 授權 — RBAC 與存取群組 {#4-authorization--rbac-and-access-groups}

兩個介面都使用 `object_permission` 模型與交集式解析，但目前深度不同。MCP 會跨五個層級解析；A2A 則跨兩個層級。詳細流程圖與表格請見專門頁面：

- [MCP 權限階層](./mcp_control#permission-hierarchy)
- [A2A Agent 權限管理 — 運作方式](./a2a_agent_permissions#how-it-works)

| 層級 | MCP 欄位 | A2A 欄位 |
|---|---|---|
| **金鑰** | `object_permission.mcp_servers`、`object_permission.mcp_access_groups`、`object_permission.mcp_tool_permissions` | `object_permission.agents`、`object_permission.agent_access_groups` |
| **團隊** | 相同 | 相同（優先繼承：如果金鑰沒有清單，則繼承團隊的清單） |
| **終端使用者** | 相同（透過 `x-litellm-end-user-id`） | — 目前不會解析 |
| **代理程式** | 相同（透過 `x-litellm-agent-id`） | — 不適用（代理程式就是目標） |
| **組織** | 相同 — 充當**上限** | — 目前不會解析 |

| 關注點 | MCP | A2A |
|---|---|---|
| 每個伺服器 / 每個代理程式允許清單 | `object_permission.mcp_servers` | `object_permission.agents` |
| 存取群組（以標籤為基礎的授權） | `object_permission.mcp_access_groups` | `object_permission.agent_access_groups` |
| 每個伺服器工具層級允許清單 | `object_permission.mcp_tool_permissions: {server_id: [tool, ...]}` | 不適用（工具位於代理程式內部） |
| 伺服器註冊允許清單（admin-static） | MCP 伺服器上的 `allowed_tools` / `disallowed_tools` | 不適用 |
| 參數層級允許清單 | MCP 伺服器上的 `allowed_params: {tool_name: [param, ...]}` | 不適用 |
| 拒絕行為 | `list_tools` 會過濾隱藏伺服器；`call_tool` 會回傳錯誤 | `GET /v1/agents` 會過濾；`POST /a2a/{agent_id}` 會回傳 HTTP **403** |

---

## 5. 追蹤 ID 與身分傳遞 {#5-trace-ids-and-identity-propagation}

`x-litellm-trace-id` 會在每個請求中**接受**，並在兩個介面上的記錄中傳遞。A2A 還有幾個特有的額外項目：

| 設定 | 範圍 | 行為 |
|---|---|---|
| `require_trace_id_on_calls_to_agent: true` | 每個代理程式，在代理程式的 `litellm_params` 上 | 拒絕缺少 `x-litellm-trace-id`（或 `x-litellm-session-id` 後備）之傳入 `/a2a/{agent_id}` 呼叫，並回傳 **HTTP 400**。請參閱 [A2A Overview — Trace ID enforcement](./a2a#trace-id-enforcement-optional-per-agent)。 |
| `require_trace_id_on_calls_by_agent: true` | 每個代理程式，在代理程式的 `litellm_params` 上 | 反向方向 — 當**由**該代理程式擁有的金鑰發出外送請求時，要求這些請求帶有追蹤 ID。 |

**子代理程式身分傳遞** — 當 LiteLLM 在 A2A 呼叫中作為下游請求的一部分進行派送時，會轉送 `X-LiteLLM-Trace-Id` 和 `X-LiteLLM-Agent-Id`，以維持追蹤連續性與支出歸屬。原始虛擬金鑰與終端使用者身分**不會**自動轉送。請使用 `extra_headers` 或 `x-a2a-{agent_name_or_id}-{header}` 慣例明確傳遞身分。請參閱 [A2A Overview — Sub-agent identity propagation](./a2a#sub-agent-identity-propagation)。

---

## 6. 閘道路徑上的防護欄 {#6-guardrails-on-the-gateway-path}

| 關注點 | MCP | A2A |
|---|---|---|
| 呼叫前輸入防護欄（Presidio、Bedrock、Lakera、Aporia 等） | `mode: pre_mcp_call` | 標準 chat-completion 防護欄適用於代理程式所發出的底層 LLM 請求 |
| 呼叫期間介入 | `mode: during_mcp_call` | — |
| 零信任 JWT 簽署 | [`mcp_jwt_signer` 防護欄](./mcp_zero_trust) | —（目前不適用於 A2A） |
| 文件 | [MCP Guardrails](./mcp_guardrail)、[MCP Zero Trust](./mcp_zero_trust) | 標準 [guardrails 文件](./proxy/guardrails) 會透過代理程式的底層模型請求套用 |

---

## 7. 速查表 — 哪個標頭負責什麼 {#7-cheatsheet--what-header-does-what}

為了方便直接複製貼上，以下是跨兩個介面的高頻請求標頭：

```http
# Always (LiteLLM-side auth and identification)
x-litellm-api-key: Bearer sk-...
# or
Authorization: Bearer sk-...

x-litellm-end-user-id: user-42
x-litellm-trace-id: 8f4a-2b1c-d3e5-...

# MCP — server scoping / per-user passthrough
x-mcp-servers: github,zapier
x-mcp-github-authorization: Bearer ghp_<user-token>     # user passthrough to github_mcp
x-litellm-mcp-debug: true                                # diagnostic response headers

# A2A — per-user passthrough
x-a2a-my-agent-authorization: Bearer <user-token>        # caller's token to my-agent
x-a2a-my-agent-x-api-key: <user-key>                     # additional per-agent header
```

如需深入了解，請依照上方連結前往專屬頁面。
