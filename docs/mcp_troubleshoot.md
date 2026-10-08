import Image from '@theme/IdealImage';

# MCP 疑難排解指南 {#mcp-troubleshooting-guide}

當 LiteLLM 作為 MCP 閘道運作時，流量會 `Client -> LiteLLM Proxy -> MCP Server`，而啟用 OAuth 的設定會加入一個授權伺服器以供中繼資料探索。本頁是一份從症狀到修復的操作手冊：執行一個診斷，將症狀與矩陣中的項目對照，然後沿著該列找到修復方式。如果您仍需要升級處理，請收集 [支援套件](#support-bundle)，這樣之後就沒有人需要重新拼湊背景資訊

關於佈建步驟與設定欄位，請參考 [mcp.md](./mcp.md)。關於選擇端點、傳輸與驗證模式，請參閱 [MCP 設定參考](./mcp_config_reference)

## 五分鐘初步排查 {#locate-the-error-source}

本頁上的每個命令都使用快速入門慣例：proxy 位於 `http://localhost:4000`、LiteLLM 金鑰位於 `x-litellm-api-key`，以及像 `deepwiki` 這樣的伺服器別名，來源為 `mcp_servers` 中的 `config.yaml`。請替換成您自己的主機、金鑰與別名

步驟 1：針對失敗伺服器的指定端點執行下方診斷。它會保留 HTTP 狀態、回應標頭與內容，這些就是您所需的全部證據。不要把它透過 `grep` 傳遞，否則您會丟失識別該層級的部分

```bash
curl -sS -D - -X POST http://localhost:4000/deepwiki/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-mcp-debug: true" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

步驟 2：讀取 HTTP 狀態列與內容，然後在矩陣中找到您的那一列。狀態可告訴您所在層級：401/403/404/405/406 來自 LiteLLM，發生在上游呼叫之前（Client -> LiteLLM）；而一個 `200` 若其內容回報 `"status": "unreachable"` 或空的工具清單，則表示 LiteLLM 已回應，但上游跳轉失敗（LiteLLM -> MCP Server）

步驟 3：透過 `x-mcp-debug-*` 回應標頭（由 `x-litellm-mcp-debug: true` 啟用，請參閱 [除錯標頭](#debug-headers)）以及對應的 proxy 記錄行確認該層級，然後套用該列中的修復方式

一個健康的控制回應如下。請先取得一個，因為有可工作的基準，下面每一個失敗才具有可解讀性：

```text
HTTP/1.1 200 OK
content-type: text/event-stream

event: message
data: {"jsonrpc":"2.0","id":1,"result":{"_meta":{"litellm.ai/server_outcomes":{"deepwiki":{"status":"ok","tool_count":3}}},"tools":[{"name":"deepwiki-ask_question",...}]}}
```

## 症狀矩陣 {#symptom-matrix}

| 症狀 | 可能層級 | 診斷 | 預期證據 | 修復 | 升級時請提供 |
|---|---|---|---|---|---|
| `401` `Authentication Error, Malformed API Key` | Client -> LiteLLM | 不帶/帶有金鑰標頭的診斷 curl | `{"detail":"Authentication Error, Malformed API Key passed in. Ensure Key has 'Bearer ' prefix."}` | 傳送 `x-litellm-api-key: Bearer <key>`，包含前綴 | 完整狀態 + 內容，[套件](#support-bundle) |
| `401` 無效或已過期的金鑰 | Client -> LiteLLM | 診斷 curl；檢查 `x-mcp-debug-inbound-auth` | 401 內容命名該金鑰；除錯標頭顯示 proxy 看到的遮罩後金鑰 | 使用有效的虛擬金鑰或主金鑰；若已過期則重新產生 | 遮罩後的金鑰 ID、金鑰建立時間 |
| `403` 金鑰有效但未獲允許 | LiteLLM auth/routing | 針對指定端點的診斷 curl | 403 內容指出 team/key 的 MCP 權限 | 授予該金鑰/team 存取此伺服器或 [存取群組](./mcp_control.md) 的權限 | 金鑰/team 設定子集 |
| `404` `MCP server, toolset, or access group '<alias>' not found` | LiteLLM auth/routing | 對 `/<alias>/mcp` 執行診斷 curl | 內容中明確指出別名的 404 | 修正別名，使其與 `mcp_servers` 中的 `config.yaml` 一致，或新增該伺服器 | `mcp_servers` 設定子集 |
| `404` `{"detail":"Not Found"}` | Client -> LiteLLM | 將網址與 `/<alias>/mcp` 比對 | 純 FastAPI 404，未命名任何別名 | 新增缺少的 `/mcp` 後綴或修正路徑 | 使用的精確網址 |
| `405` `Method Not Allowed` | Client -> LiteLLM | `curl -sS -D - -X PUT ...` 可重現此問題 | `allow: GET, POST, DELETE` 標頭加上 JSON-RPC 錯誤內容 | 對 JSON-RPC 呼叫使用 POST；該端點使用可串流 HTTP，不是僅限 SSE 或 WebSocket | 方法 + 傳輸用戶端設定 |
| `406` `Not Acceptable` | Client -> LiteLLM | 不帶 `Accept` 標頭的診斷 curl | `Client must accept both application/json and text/event-stream` | 傳送 `Accept: application/json, text/event-stream` | 用戶端 HTTP 設定 |
| 在 UI OAuth Connect 上的 `400`：`{"detail":"invalid_request"}` | LiteLLM auth/routing | 請參閱 [OAuth redirect_uri 被拒絕](#mcp-oauth-invalid-request) | 記錄行 `MCP OAuth: rejecting redirect_uri ...` | 設定 `PROXY_BASE_URL` 或信任 `X-Forwarded-*` | `.well-known` issuer 輸出 |
| OAuth 流程將 LiteLLM 金鑰傳給上游 | LiteLLM auth/routing | 診斷 curl，讀取 `x-mcp-debug-oauth2-token` | 標頭中的 `SAME_AS_LITELLM_KEY` | 將 LiteLLM 金鑰移到 `x-litellm-api-key`，使 `Authorization` 保持空白以供上游 token 使用，請參閱 [OAuth 除錯](./mcp_oauth#debugging-oauth) | 除錯標頭 |
| 用戶端無法註冊（DCR）或探索失敗 | LiteLLM auth/routing | `curl -sS http://localhost:4000/.well-known/oauth-authorization-server` | 含有 `authorization_endpoint` 與 `token_endpoint` 的 JSON | 驗證中繼資料可從用戶端存取；請查看 [OAuth 文件](./mcp_oauth) 以了解支援的授權類型 | 中繼資料 JSON、用戶端錯誤原文 |
| `200` 但 `"status": "unreachable"`、工具清單為空 | LiteLLM -> MCP Server | 診斷 curl + 針對別名的 proxy 記錄 grep | 記錄：`httpx.ConnectError: All connection attempts failed`（網路）或 `CERTIFICATE_VERIFY_FAILED`（TLS） | 修正上游網址、網路路徑、防火牆，或伺服器的憑證 | proxy 記錄行 + MCP-server 記錄 |
| `200` 但在彙總 `/mcp` 中工具清單為空 | LiteLLM -> MCP Server | 讀取內容中的 `litellm.ai/server_outcomes` | 每個伺服器的 `status` 會顯示哪個上游失敗、哪個傳回工具 | 修正失敗的伺服器；彙總會吸收每個伺服器的失敗，而不是讓整個清單失敗 | `server_outcomes` 物件 |
| 工具呼叫失敗：`Tool '<name>' not found` | Client -> LiteLLM | 使用來自 `tools/list` 的精確名稱執行 `tools/call` | `{"content":[{"type":"text","text":"Error: Tool 'nonexistent_tool' not found"}],"isError":true}` | 在彙總與已命名端點上都使用帶前綴的名稱（`deepwiki-ask_question`） | `tools/list` 輸出 |
| `/v1/responses` 或 `/v1/chat/completions` 忽略 MCP 工具 | LiteLLM auth/routing | 將 `server_label` 與您的設定別名比對 | 成功時會顯示 `mcp_tools_fetched` 與 `tool_execution_results` 輸出項目；錯誤的標籤會產生沒有工具項目的純文字回應 | 將 `server_label` 設為精確別名，並將 `server_url` 設為 `litellm_proxy` | 完整請求內容（已遮罩）+ 回應 |
| 請求中途逾時 | LiteLLM -> MCP Server | 計時診斷 curl；檢查 MCP-server 記錄 | Curl 卡住後出錯；proxy 記錄顯示逾時 | 提高用戶端逾時，檢查上游延遲與網路路徑 | 兩側時間戳記、拓撲 |

## 端點與 Session {#endpoints-and-sessions}

LiteLLM 提供一個彙總端點，以及每個伺服器一個已命名端點。`POST /mcp` 會列出您的金鑰可存取之所有伺服器的工具，且每個工具都會以前綴其伺服器別名（`deepwiki-ask_question`）表示，並在 `_meta` 中提供每個伺服器的 `litellm.ai/server_outcomes` 報告。`POST /<alias>/mcp` 會將呼叫範圍限定為單一伺服器，這是初步排查的正確目標，因為彙總回應可能會讓一個失敗伺服器被其他健康伺服器掩蓋

這些端點使用 MCP 可串流 HTTP。即使是單一 JSON-RPC 呼叫，回應也會以 `text/event-stream` 幀到達，這就是為什麼 `Accept` 標頭必須允許這兩種內容類型。純 `tools/list` 與 `tools/call` 請求在沒有先前 `initialize` 握手的情況下也能運作，因此 curl 初步排查不需要 Session 設定。執行 `initialize` 的 MCP 用戶端會取得一個 Session；如果用戶端在列出工具之前就失敗，請擷取其第一個 HTTP 交換，因為傳輸不相符（405）與缺少 `Accept` 標頭（406）都發生在第一次請求上

## 已驗證的失敗模式 {#verified-failure-modes}

以下每個回應都在啟用快速入門設定與一個 `deepwiki` 伺服器的正常運作 proxy 上擷取，另外也為網路與 TLS 相關列刻意使用了損壞的伺服器

### 401 與 403：驗證 {#auth-failures}

缺少或格式錯誤的金鑰：

```text
HTTP/1.1 401 Unauthorized
{"detail":"Authentication Error, Malformed API Key passed in. Ensure Key has `Bearer ` prefix."}
```

未知或已過期的金鑰也會回傳 401，內容會命名被拒絕的金鑰：

```text
HTTP/1.1 401 Unauthorized
{"detail":"Authentication Error, Invalid proxy server token passed. Received API Key = sk-..., Key Hash (Token) =2ab06c... Unable to find token in cache or `LiteLLM_VerificationTokenTable`"}
```

403 表示該金鑰已通過驗證，但缺少該伺服器的 MCP 權限；請修正金鑰/team 的 [權限指派](./mcp_control.md)，而不是憑證

### 404：伺服器或路由 {#server-route-404}

未知別名，LiteLLM 路由已拒絕它：

```text
HTTP/1.1 404 Not Found
{"detail":"MCP server, toolset, or access group 'nosuchserver' not found"}
```

路徑錯誤（缺少 `/mcp` 後綴），請求從未到達 MCP 路由：

```text
HTTP/1.1 404 Not Found
{"detail":"Not Found"}
```

這兩個回應看起來相似，但意義不同：第一個是設定／別名問題，第二個是 URL 問題

### 405 和 406：傳輸或端點不匹配 {#transport-mismatch}

非 JSON-RPC 方法（例如 PUT）會以 405 回應，並列出允許的方法：

```text
HTTP/1.1 405 Method Not Allowed
allow: GET, POST, DELETE
{"jsonrpc":"2.0","id":"server-error","error":{"code":-32600,"message":"Method Not Allowed"}}
```

省略 `Accept` 標頭會返回 406：

```text
HTTP/1.1 406 Not Acceptable
{"jsonrpc":"2.0","id":"server-error","error":{"code":-32600,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"}}
```

兩者都表示用戶端的傳輸設定有問題，而不是上游伺服器有問題。對該端點使用 GET 會開啟可串流的 HTTP 事件串流（您會看到 `: ping` keepalive），這是預期行為，不是錯誤

### OAuth 探索、DCR 與重新導向 {#oauth-issues}

在除錯任何用戶端流程之前，請先確認 proxy 已發佈 OAuth 中繼資料：

```bash
curl -sS http://localhost:4000/.well-known/oauth-authorization-server
```

```text
{"issuer":"http://localhost:4000","authorization_endpoint":"http://localhost:4000/v1/mcp/oauth/authorize","token_endpoint":"http://localhost:4000/v1/mcp/oauth/token","response_types_supported":["code"],"grant_types_supported":["authorization_code"],"code_challenge_methods_supported":["S256"]}
```

`issuer` 必須與使用者在瀏覽器中輸入的來源相符。如果它顯示的是 ingress 後方的內部主機名稱，請參閱下方的 redirect_uri 章節。對於權杖流程除錯，`SAME_AS_LITELLM_KEY` 在 `x-mcp-debug-oauth2-token` 中表示 LiteLLM 金鑰正洩漏到上游，而不是 OAuth 權杖；請參閱 [除錯 OAuth](./mcp_oauth#debugging-oauth)

#### MCP OAuth：Connect 回傳 `{"detail":"invalid_request"}` {#mcp-oauth-invalid-request}

**症狀。** 在 LiteLLM UI 中點擊 MCP OAuth 伺服器上的 **Connect** 會回傳：

```text
HTTP/1.1 400 Bad Request
{"detail":"invalid_request"}
```

proxy 記錄（啟用詳細記錄時）會顯示類似 `MCP OAuth: rejecting redirect_uri ... as invalid_request. Computed proxy base=...` 的一行

**原因。** `/v1/mcp/server/oauth/{server_id}/authorize` 端點會驗證瀏覽器提供的 `redirect_uri`（`https://llm.example.com/ui/mcp/oauth/callback`）是否與 proxy 自身的公開來源具有相同的 scheme + host + port。位於 TLS 終止 ingress（Kubernetes、ALB、nginx、Cloudflare 等）後方時，proxy 預設會解析到其內部位址（`http://<pod-ip>:4000`），因此相同來源檢查會拒絕

**診斷。** 比較 proxy 宣告的 origin 與瀏覽器看到的內容：

```bash
curl -sS https://llm.example.com/.well-known/oauth-authorization-server | jq .issuer
```

`issuer` 的值應等於使用者在瀏覽器中輸入的來源（`https://llm.example.com`）。如果它回傳的是內部主機名稱或 `http://...`，表示 proxy 解析出的來源有誤

**修正方式**，依優先順序：

1. **設定 `PROXY_BASE_URL`**（建議）。操作者在帶外指定 proxy 的真實公開 origin，無需信任標頭：

   ```bash
   PROXY_BASE_URL=https://llm.example.com
   ```

   只要完整來源：scheme + host（非預設埠才含 port），不要有結尾斜線，也不要有路徑。請參閱 [反向 proxy 與 ingress 設定](./mcp_oauth#reverse-proxy-and-ingress-configuration)

2. **信任來自您的 ingress 的 `X-Forwarded-*`。** 在 `general_settings` 中同時設定兩個鍵值：

   ```yaml title="config.yaml" showLineNumbers
   general_settings:
     use_x_forwarded_for: true
     mcp_trusted_proxy_ranges:
       - "10.0.0.0/8"      # your ingress / load-balancer CIDR(s)
   ```

   單靠 `use_x_forwarded_for` 還不夠。如果沒有 `mcp_trusted_proxy_ranges`，proxy 會拒絕採用 `X-Forwarded-*`，因為它無法分辨受信任的反向 proxy 與直接攻擊者。請確認您的 ingress 會送出 `X-Forwarded-Proto`、`X-Forwarded-Host`，以及（在非預設埠上執行時）`X-Forwarded-Port`

3. **修正 ingress。** 如果 ingress 正在移除或重寫 `X-Forwarded-*`，任何 proxy 設定都無法解決；請在 ingress 層恢復這些標頭

對於位於不同網域上的已核准 OAuth 用戶端，例如內部 Web 應用程式，請將回呼主機加入 `MCP_TRUSTED_REDIRECT_ORIGINS`。請參閱 [允許額外的 first-party redirect_uri 來源](./mcp_oauth#allowing-additional-first-party-redirect_uri-origins)。

對於預先註冊的 OAuth 應用程式，請參閱 [靜態 OAuth 用戶端的重新導向 URL](./mcp_oauth#static-client-redirect-urls)，以了解 IdP 回呼設定、MCP 用戶端回呼需求與驗證錯誤。

對於 Dynamic Client Registration 失敗，請收集用戶端的錯誤回應以及上方顯示的授權伺服器中繼資料。中繼資料會列出支援的授權類型。

### 網路、TLS 與逾時 {#network-tls-timeouts}

無法連線的上游不會以 gateway 502 顯示。具名端點會回傳 200，內容為空的工具清單與每個伺服器的狀態：

```text
HTTP/1.1 200 OK
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"_meta":{"litellm.ai/server_outcomes":{"brokenserver":{"status":"unreachable"}}},"tools":[]}}
```

proxy 記錄會指出是哪一類失敗。連線遭拒或 DNS：

```text
09:00:34 - LiteLLM:WARNING: mcp_server_manager.py - Error listing tools from brokenserver: All connection attempts failed
httpx.ConnectError: All connection attempts failed
```

TLS 失敗（憑證過期或不受信任）：

```text
09:01:40 - LiteLLM:WARNING: mcp_server_manager.py - Error listing tools from tlsbroken: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: certificate has expired (_ssl.c:1000)
```

對於逾時，請計時診斷用的 curl，並比較 proxy 與 MCP-server 記錄中的時間戳，以找出是哪一端卡住

### 空白工具清單與工具命名 {#empty-tools}

在彙總的 `/mcp` 端點上，單一故障伺服器不會使請求失敗。健康的伺服器仍會回傳工具，而 `litellm.ai/server_outcomes` 會分別報告每個伺服器：

```text
data: {"jsonrpc":"2.0","id":1,"result":{"_meta":{"litellm.ai/server_outcomes":{"deepwiki":{"status":"ok","tool_count":3},"brokenserver":{"status":"unreachable"}}},"tools":[{"name":"deepwiki-ask_question",...}]}}
```

如果整個清單都是空的，請檢查 `server_outcomes` 以查看每個伺服器的失敗狀態，不要猜測。工具名稱會以前綴附加伺服器別名，因此請呼叫 `deepwiki-ask_question`，而不是 `ask_question`。呼叫未加前綴或錯誤的名稱，會在工具結果內失敗，而不是在 HTTP 層失敗：

```text
HTTP/1.1 200 OK
data: {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"Error: Tool 'nonexistent_tool' not found"}],"isError":true}}
```

### 回應與 Chat Completions 失敗 {#responsescompletions-with-embedded-mcp-calls}

在 `/v1/responses` 或 `/v1/chat/completions` 期間，當請求包含帶有 `server_url: "litellm_proxy"` 的 MCP 工具時，LiteLLM 會在請求中途執行 MCP 工具呼叫。正常的請求會在輸出項目中明確顯示 MCP 跳轉：

```bash
curl -sS http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "input": "List the top-level wiki pages for BerriAI/litellm",
    "tools": [{"type": "mcp", "server_label": "deepwiki", "server_url": "litellm_proxy", "require_approval": "never"}]
  }'
```

成功時會在 assistant 訊息旁包含 `mcp_tools_fetched` 與 `tool_execution_results` 項目。如果 `server_label` 不符合任何已設定的別名，請求仍會回傳 200，但那些項目會消失，而模型會在沒有工具的情況下回答；這種無聲降級就是要找的症狀。`/v1/chat/completions` 搭配相同的 `tools` 陣列時也是如此。如果工具項目存在，但工具結果包含錯誤，請跳到該錯誤的對應列（未知工具名稱、上游無法連線），因為內嵌呼叫會經過與直接 curl 相同的 MCP 路徑

## 除錯標頭 {#debug-headers}

在任何 MCP 請求中加入 `x-litellm-mcp-debug: true`，即可取得已遮罩的診斷回應標頭：

```text
x-mcp-debug-inbound-auth: x-litellm-api-key=Bearer****1234
x-mcp-debug-oauth2-token: (none)
x-mcp-debug-auth-resolution: no-auth
x-mcp-debug-outbound-url: https://mcp.deepwiki.com/mcp
x-mcp-debug-server-auth-type: (none)
```

`x-mcp-debug-auth-resolution` 會告訴您 LiteLLM 如何解析外送驗證：`oauth2-passthrough`、`m2m-client-credentials`、`per-request-header`、`static-token`，或 `no-auth`。`x-mcp-debug-outbound-url` 會確認 proxy 實際呼叫了哪個上游。值會被遮罩，因此這些標頭可安全地包含在支援套件中

對於 Claude Code，請將除錯標頭加入您的 MCP 設定：

```bash
claude mcp add --transport http my_server http://localhost:4000/deepwiki/mcp \
  --header "x-litellm-api-key: Bearer sk-..." \
  --header "x-litellm-mcp-debug: true"
```

## 驗證連線能力 {#verify-connectivity}

### MCP Inspector {#mcp-inspector}

當您需要在同一處測試 `Client -> LiteLLM` 與 `Client -> MCP` 通訊時，請使用 MCP Inspector；它能讓您輕鬆隔離失敗的跳轉

1. 在您的工作站上執行 `npx @modelcontextprotocol/inspector`。
2. 設定並連線：
   - **Transport Type:** 選擇用戶端使用的傳輸（LiteLLM 使用 Streamable HTTP）。
   - **URL:** 測試中的端點（對於 `Client -> LiteLLM`，填入 LiteLLM MCP URL；對於 `Client -> MCP`，填入 MCP 伺服器 URL）。
   - **Custom Headers:** 例如，`x-litellm-api-key: Bearer <LiteLLM API Key>`。
3. 開啟 **Tools** 分頁並點擊 **List Tools**，確認 MCP 別名會回應。

### `curl` 煙霧測試 {#curl-smoke-test}

`curl` 非常適合無法安裝 Inspector 的伺服器。它會重現 LiteLLM 原本會發出的 MCP 工具呼叫；請將其替換為受測系統（LiteLLM 或 MCP server）的網域

```bash
curl -sS -D - -X POST https://your-target-domain.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

當目標是需要驗證的 LiteLLM 端點時，請加入 `-H "x-litellm-api-key: Bearer <LiteLLM API Key>"`。`curl` 與 LiteLLM 之間若出現相符的失敗，表示問題出在 MCP server 或網路／OAuth 層。直接從 LiteLLM 主機測試 MCP server 可判定網路路徑是否可用

### LiteLLM UI / Playground {#litellm-ui--playground}

在 MCP 建立表單或 MCP Tool Testing Playground 內顯示的失敗，表示 LiteLLM proxy 無法連到 MCP server。常見原因包括設定錯誤（傳輸、標頭、憑證）、MCP/server 停機、網路／防火牆封鎖，或無法存取的 OAuth 中繼資料。在 Playground 中重現用戶端失敗，可確認問題出在 LiteLLM -> MCP 跳轉，而不是用戶端

<Image
  img={require('../img/mcp_tool_testing_playground.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

## 檢視記錄 {#review-logs}

良好範圍的記錄可清楚顯示 LiteLLM 是否到達 MCP server，以及接下來發生了什麼

### 成功的 MCP 呼叫之 Access Log 範例 {#access-log-example-successful-mcp-call}

```text
INFO:     127.0.0.1:57230 - "POST /deepwiki/mcp HTTP/1.1" 200 OK
```

### 失敗的 MCP 呼叫之 Error Log 範例 {#error-log-example-failed-mcp-call}

```text
07:22:00 - LiteLLM:ERROR: client.py:224 - MCP client list_tools failed - Error Type: ExceptionGroup, Error: unhandled errors in a TaskGroup (1 sub-exception), Server: http://localhost:3001/mcp, Transport: MCPTransport.http
  httpcore.ConnectError: All connection attempts failed
ERROR:LiteLLM:MCP client list_tools failed - Error Type: ExceptionGroup, Error: unhandled errors in a TaskGroup (1 sub-exception)...
  httpx.ConnectError: All connection attempts failed
```

## 支援套件 {#support-bundle}

如果矩陣未能解決問題，請一次收集以下所有內容。完整的套件可取代支援人員重建您的設定時所需的探索呼叫

1. LiteLLM 版本：`curl -sS http://localhost:4000/health/readiness` 輸出或圖片標籤。
2. 設定子集：`mcp_servers` 區塊以及任何涉及 MCP 或轉送的 `general_settings` 鍵，並移除密鑰。
3. 失敗請求的確切內容：完整的 curl 指令，並將金鑰遮罩（`sk-****1234`）。
4. 來自診斷 curl 的 HTTP 狀態列、回應標頭與本文（`-D -` 輸出，未經過濾）。
5. 來自啟用 `x-mcp-debug-*` 的執行結果之 `x-litellm-mcp-debug: true` 標頭（已遮罩）。
6. 涵蓋失敗請求的 LiteLLM proxy 記錄，若可能，請以 `--detailed_debug` 開始。
7. 同一時間範圍內的 MCP-server 記錄。
8. 拓撲：用戶端、LiteLLM、ingress/load balancer 與 MCP server 分別在哪裡執行，以及 TLS 在何處終止。
9. 每個擷取請求的時間戳記（含時區），以便對應記錄。

請勿分享：原始 LiteLLM virtual keys 或 master key、上游 API 金鑰或 `mcp_servers` 驗證設定中的靜態 token、OAuth client secrets、未遮罩的 `Authorization` 標頭值，或 `.env` 內容。這些已遮罩的除錯標頭存在的目的，就是讓您不必貼出任何即時憑證
