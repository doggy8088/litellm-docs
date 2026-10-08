import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 閘道驗證參考 {#gateway-auth-reference}

LiteLLM 提供兩個閘道介面，兩者共用大多數驗證與授權原語，但在幾個重要地方有所不同。本頁為並排參考：各個標頭的作用、兩個介面相同之處，以及不同之處。每個章節都會連結至專屬頁面以提供完整細節。

| 介面 | 端點 | 專屬文件 |
|---|---|---|
| **MCP Gateway** | `/mcp`, `/{server}/mcp`, `/toolset/{name}/mcp`, `/sse`, `/v1/mcp/...`, `/mcp-rest/...` | [MCP 總覽](./mcp) |
| **A2A Agent Gateway** | `/a2a/{agent_id}`, `/a2a/{agent_id}/message/send`, `/v1/agents/...` | [A2A 總覽](./a2a) |

---

## 1. 用戶端 → LiteLLM（驗證呼叫端） {#1-client--litellm-authenticating-the-caller}

兩個介面都接受相同的 LiteLLM Virtual Key 標頭與相同的識別標頭。唯一不同之處在於：MCP **ASGI** 路由（位於 `/mcp`, `/{name}/mcp`, `/toolset/{name}/mcp`, `/sse` 的可串流 MCP 端點）會略過標準 FastAPI 驗證相依性，不會解析供應商特定的驗證別名（`API-Key`, `x-api-key`, `x-goog-api-key`, `Ocp-Apim-Subscription-Key`）或 `x-litellm-tags`。MCP **REST/管理**路由（`/v1/mcp/...`, `/mcp-rest/...`）以及**所有** A2A 路由都接受完整標頭集合。

| 標頭 | 目的 | MCP ASGI | MCP REST + A2A |
|---|---|---|---|
| `x-litellm-api-key: Bearer sk-...` | 建議使用的 LiteLLM Virtual Key 標頭。當傳入的 `Authorization` 標頭可能帶有不同的 token（OAuth passthrough、OBO、A2A per-user forwarding）時，請一律使用。 | ✓ | ✓ |
| `Authorization: Bearer sk-...` | 標準備援。查找前會先去除 `Bearer ` 前綴。 | ✓ | ✓ |
| `API-Key`, `x-api-key`, `x-goog-api-key`, `Ocp-Apim-Subscription-Key` | 供應商特定別名（Azure、Anthropic、Google AI Studio、Azure APIM）。 | — | ✓ |
| `x-litellm-end-user-id` | 端使用者識別。在 key 之上疊加每位端使用者的預算、MCP 存取交集與稽核記錄條目。`x-litellm-customer-id` 是可接受的別名。 | ✓ | ✓ |
| `x-litellm-trace-id` | 跨請求關聯 ID。會回退至 `x-litellm-session-id` 或任何相符的 `x-<vendor>-session-id` 標頭。 | ✓ | ✓ |
| `x-litellm-session-id` | 工作階段分組。與 trace-id 使用相同的解析路徑，優先順序較低。 | ✓ | ✓ |
| `x-litellm-tags` | 以逗號分隔的標籤，用於 spend-log 標記與以標籤為基礎的路由。要求主體欄位 `tags` 具有優先權。 | —（MCP ASGI 上不會解析） | ✓ |
| `x-litellm-mcp-debug: true` | 回傳遮罩後的診斷回應標頭（`x-mcp-debug-*`）。請參閱 [MCP OAuth — 偵錯](./mcp_oauth#debugging-oauth)。 | ✓ | — |
| `x-mcp-servers` | 將請求範圍限定到特定 MCP 伺服器（以逗號分隔）。 | ✓ | — |

---

## 2. LiteLLM → 後端（驗證閘道對代理程式或 MCP 伺服器的身份） {#2-litellm--backend-authenticating-the-gateway-to-the-agent-or-mcp-server}

這是 MCP 與 A2A 差異最大的區域。MCP 在每個伺服器註冊上都有第一類的 `auth_type` 欄位。**A2A 完全沒有 `auth_type` 欄位**；傳出驗證模式是根據 `litellm_params` 中的內容推斷。

### MCP：`auth_type` 列舉 {#mcp-auth_type-enum}

MCP 伺服器的傳出 `Authorization` 標頭（或每個請求的 SigV4 簽章）由 `auth_type` 決定。完整表格請參閱 [MCP 總覽：新增 HTTP MCP 伺服器](./mcp#add-http-mcp-server)。

| `auth_type` | 機制 | 專屬文件 |
|---|---|---|
| `none` | 不加入驗證標頭 | — |
| `api_key` / `bearer_token` / `basic` / `authorization` / `token` | 靜態標頭，每次呼叫都會原樣傳送 | [MCP 總覽](./mcp) |
| `oauth2` | PKCE（互動式）或 M2M `client_credentials`。由 `oauth2_flow` 區分。 | [MCP OAuth](./mcp_oauth) |
| `oauth2_token_exchange` | RFC 8693 On-Behalf-Of（OBO）— 將呼叫者的 bearer token 交換為具範圍限制的 MCP token | [MCP OBO 驗證](./mcp_obo_auth) |
| `oauth2_id_jag` | 身分斷言授權授權類型：將使用者的身分 token（傳入或在 SSO 登入時擷取）進行雙段交換，以取得 MCP access token | [MCP ID-JAG 驗證](./mcp_id_jag) |
| `true_passthrough` | 不經 LiteLLM 受理。用戶端自己的 `Authorization` 會原樣轉送至上游 | [MCP OAuth Passthrough](./mcp_oauth_passthrough) |
| `oauth_delegate` | LiteLLM 先以 `x-litellm-api-key` 接受呼叫者，然後轉送用戶端在 `Authorization` 中送出的另一個上游 bearer。受理 key 絕不會被轉送 | [MCP OAuth Passthrough](./mcp_oauth_passthrough) |
| `aws_sigv4` | 使用專用的 MCP 端憑證鏈，對每個請求進行 SigV4 簽章 | [MCP AWS SigV4](./mcp_aws_sigv4) |

### A2A：從 `litellm_params` 推斷的驗證模式 {#a2a-auth-mode-inferred-from-litellm_params}

代理程式上沒有 `auth_type` 欄位。提供者處理常式會從 `litellm_params` 的內容中挑選驗證機制：

| 模式 | 觸發時機 | 傳送至後端 |
|---|---|---|
| **Bearer / JWT** | 已設定 `litellm_params.api_key` | `Authorization: Bearer <api_key>` |
| **SigV4**（僅限 AgentCore） | 未設定 `litellm_params.api_key` | 透過完整 AWS 憑證鏈進行每個請求的 SigV4。請參閱 [Bedrock AgentCore — A2A Gateway Authentication](./providers/bedrock_agentcore#a2a-gateway-authentication)。 |
| **提供者原生** | `litellm_params.custom_llm_provider` 符合非 Bedrock 提供者（Vertex AI Agent Engine、LangGraph、Azure AI Foundry、Pydantic AI） | 該提供者的正常驗證路徑 |

JWT 與 SigV4 的雙模式是 AgentCore 專屬。其他 A2A 提供者（Vertex、LangGraph、Azure Foundry）使用提供者自身的憑證慣例。請參閱 [Providers](./providers) 下相關的提供者頁面。

### 零信任附加元件（僅限 MCP） {#zero-trust-add-on-mcp-only}

如果 MCP 伺服器需要**以密碼學方式驗證**請求確實經由 LiteLLM，請在上層套用 [MCP JWT Signer](./mcp_zero_trust) 防護欄。它會使用短效 RS256 JWT 為每個傳出的工具呼叫簽章，並公開 MCP 伺服器可驗證的 JWKS 端點。這是防護欄（`guardrail: mcp_jwt_signer`, `mode: pre_mcp_call`），而不是 `auth_type`，且可與任何 `auth_type` 組合使用。

---

## 3. 每位使用者的標頭透傳 {#3-per-user-header-passthrough}

兩個介面都允許用戶端轉送要送往特定後端伺服器/代理程式的憑證，而不需要管理員預先設定。其慣例看起來對稱，但解析方式不同，因此複製貼上時請務必精確。

| 介面 | 前綴 | 解析規則 | 比對對象 | 範例 |
|---|---|---|---|---|
| **MCP** | `x-mcp-` | 格式：`x-mcp-{server_alias}-{header_name}` | 先比對伺服器的 `alias`，再比對 `server_name`（不區分大小寫） | `x-mcp-github-authorization: Bearer ghp_...` → 伺服器 `github`，標頭 `Authorization` |
| **A2A** | `x-a2a-` | 格式：`x-a2a-{agent_name_or_id}-{header_name}`；與代理程式的 UUID 與可讀名稱比對（兩者都會嘗試） | 代理程式的 UUID **以及** 可讀名稱（兩者都會嘗試） | `x-a2a-my-agent-x-api-key: secret` → 代理程式 `my-agent`，標頭 `x-api-key` |

兩個介面也都支援與使用者 passthrough 可組合的管理員控制替代方案：

| 機制 | MCP | A2A | 備註 |
|---|---|---|---|
| `static_headers: {K: V}` | ✓ | ✓ | 一律傳送。若 key 衝突，**優先於使用者 passthrough**。 |
| `extra_headers: [name, name, ...]` | ✓ | ✓ | 管理員允許清單中可原樣轉送的用戶端標頭名稱。 |
| `x-<surface>-<id>-<header>` 慣例 | ✓ (`x-mcp-`) | ✓ (`x-a2a-`) | 由用戶端驅動，不需要管理員設定。 |

完整機制請參閱 [MCP 總覽：轉送自訂標頭](./mcp#forwarding-custom-headers-to-mcp-servers) 與 [A2A Agent Authentication Headers](./a2a_agent_headers)。

---

## 4. 授權：RBAC 與存取群組 {#4-authorization-rbac-and-access-groups}

兩個介面都使用 `object_permission` 模型與交集式解析，但目前深度不同。MCP 會跨六層解析；A2A 則跨兩層。詳細流程圖與表格請見專屬頁面：

- [MCP 權限階層](./mcp_control#permission-hierarchy)
- [A2A 代理程式權限管理：運作方式](./a2a_agent_permissions#how-it-works)

| 層級 | MCP 欄位 | A2A 欄位 |
|---|---|---|
| **Key** | `object_permission.mcp_servers`, `object_permission.mcp_access_groups`, `object_permission.mcp_tool_permissions` | `object_permission.agents`, `object_permission.agent_access_groups` |
| **Team** | 相同 | 相同（優先繼承：如果 key 沒有清單，則繼承 team 的） |
| **End user** | 相同（透過 `x-litellm-end-user-id`） | — 今日尚未解析 |
| **Agent** | 相同（透過 `x-litellm-agent-id`） | — 不適用（agent 本身就是目標） |
| **Internal user** | 相同（請求經驗證為其的那位人類）；與執行中的結果取交集，因此只能縮小範圍 | — 今日尚未解析 |
| **Org** | 相同 — 作為**上限** | — 今日尚未解析 |

| 關注項目 | MCP | A2A |
|---|---|---|
| 每個 server / 每個 agent 的允許清單 | `object_permission.mcp_servers` | `object_permission.agents` |
| 存取群組（以標籤為基礎的授權） | `object_permission.mcp_access_groups` | `object_permission.agent_access_groups` |
| 每個 server 的工具層級允許清單 | `object_permission.mcp_tool_permissions: {server_id: [tool, ...]}` | n/a（工具位於 agent 內） |
| server 註冊允許清單（admin-static） | MCP server 上的 `allowed_tools` / `disallowed_tools` | n/a |
| 參數層級允許清單 | MCP server 上的 `allowed_params: {tool_name: [param, ...]}` | n/a |
| 拒絕行為 | `list_tools` 會過濾掉隱藏的 server；`call_tool` 會回傳錯誤 | `GET /v1/agents` 會過濾；`POST /a2a/{agent_id}` 會回傳 HTTP **403** |

---

## 5. Trace ID 與身分傳遞 {#5-trace-ids-and-identity-propagation}

`x-litellm-trace-id` 會在每次請求中**接受**，並在兩個介面上隨記錄傳遞。A2A 還有幾個特定額外項目：

| 設定 | 範圍 | 行為 |
|---|---|---|
| `require_trace_id_on_calls_to_agent: true` | 每個 agent，位於 agent 的 `litellm_params` 上 | 拒絕缺少 `x-litellm-trace-id`（或 `x-litellm-session-id` fallback）的進站 `/a2a/{agent_id}` 呼叫，並回傳 **HTTP 400**。請參閱 [A2A Overview — Trace ID enforcement](./a2a#trace-id-enforcement-optional-per-agent)。 |
| `require_trace_id_on_calls_by_agent: true` | 每個 agent，位於 agent 的 `litellm_params` 上 | 反向方向 — 當**由**該 agent 擁有的 key 發出出站呼叫時，要求該些呼叫帶有 trace ID。 |

**子 agent 身分傳遞。** 當 LiteLLM 在 A2A 呼叫的一部分中向下游發出請求時，會轉送 `X-LiteLLM-Trace-Id` 和 `X-LiteLLM-Agent-Id`，以維持追蹤連續性與支出歸屬。原始虛擬 key 與 end-user 身分**不會**自動轉送。請使用 `extra_headers` 或 `x-a2a-{agent_name_or_id}-{header}` 慣例來明確傳遞身分。請參閱 [A2A Overview: Sub-agent identity propagation](./a2a#sub-agent-identity-propagation)。

---

## 6. 閘道路徑上的防護欄 {#6-guardrails-on-the-gateway-path}

| 關注項目 | MCP | A2A |
|---|---|---|
| 請求前輸入防護欄（Presidio、Bedrock、Lakera、Aporia 等） | `mode: pre_mcp_call` | 標準聊天完成防護欄會套用到 agent 所發出的底層 LLM 呼叫 |
| 請求中介入 | `mode: during_mcp_call` | — |
| 零信任 JWT 簽章 | [`mcp_jwt_signer` 防護欄](./mcp_zero_trust) | —（目前不適用於 A2A） |
| 文件 | [MCP Guardrails](./mcp_guardrail)、[MCP Zero Trust](./mcp_zero_trust) | 標準 [guardrails 文件](/docs/proxy/guardrails/quick_start) 會透過 agent 的底層模型呼叫套用 |

---

## 7. 備忘表：各標頭的作用 {#7-cheatsheet-what-header-does-what}

為了方便複製貼上，以下是兩個介面中高頻使用的請求標頭：

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

若要深入了解，請沿著上方的交叉連結前往專屬頁面。
