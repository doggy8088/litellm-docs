import Image from '@theme/IdealImage';

# MCP 疑難排解指南 {#mcp-troubleshooting-guide}

當 LiteLLM 作為 MCP 代理時，流量通常會流經 `Client → LiteLLM Proxy → MCP Server`，而啟用 OAuth 的設定則會新增一個授權伺服器以供中繼資料探索。

如需佈建步驟、傳輸選項與組態欄位，請參考 [mcp.md](./mcp.md)。

## 快速開始：用一個指令除錯 {#quick-start-debug-with-one-command}

除錯 MCP 問題最快的方法是啟用 **debug headers**。對您的 LiteLLM proxy 執行以下 curl，並檢查回應標頭：

```bash
curl -si -X POST http://localhost:4000/{your_mcp_server}/mcp \
  -H "Content-Type: application/json" \
  -H "x-litellm-api-key: Bearer sk-YOUR_KEY" \
  -H "x-litellm-mcp-debug: true" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  2>&1 | grep -i "x-mcp-debug"
```

這會回傳已遮罩的診斷標頭，清楚告訴您驗證過程中發生了什麼：

```
x-mcp-debug-inbound-auth: x-litellm-api-key=Bearer****1234
x-mcp-debug-oauth2-token: Bearer****ef01
x-mcp-debug-auth-resolution: oauth2-passthrough
x-mcp-debug-outbound-url: https://mcp.atlassian.com/v1/mcp
x-mcp-debug-server-auth-type: oauth2
```

如果您在 `x-mcp-debug-oauth2-token` 中看到 `SAME_AS_LITELLM_KEY`，表示您的 LiteLLM API 金鑰正在洩漏到 MCP 伺服器，而不是 OAuth2 token。請參閱 [除錯 OAuth](./mcp_oauth#debugging-oauth) 以取得修正方式與其他常見問題。

對於 Claude Code，請將除錯標頭加入您的 MCP 設定：

```bash
claude mcp add --transport http my_server http://localhost:4000/my_mcp/mcp \
  --header "x-litellm-api-key: Bearer sk-..." \
  --header "x-litellm-mcp-debug: true"
```

## 找出錯誤來源 {#locate-the-error-source}

在調整設定之前，先釐清失敗發生在哪裡，避免將不同跳轉點的症狀混在一起。

### LiteLLM UI / Playground 錯誤（LiteLLM → MCP） {#litellm-ui--playground-errors-litellm--mcp}
在 MCP 建立表單或 MCP Tool Testing Playground 中顯示的失敗，表示 LiteLLM proxy 無法連到 MCP 伺服器。常見原因包括組態錯誤（傳輸、標頭、憑證）、MCP／伺服器停機、網路／防火牆封鎖，或無法存取的 OAuth 中繼資料。

<Image
  img={require('../img/mcp_tool_testing_playground.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>

**動作**
- 同時擷取 LiteLLM proxy 記錄與 MCP 伺服器記錄（請參閱 [錯誤記錄範例](./mcp_troubleshoot#error-log-example-failed-mcp-call)），以檢查 request/response 配對與 stack trace。
- 在 LiteLLM 伺服器上，針對 MCP 端點執行 [`curl` smoke test](./mcp_troubleshoot#curl-smoke-test)，確認基本連線能力。

### 用戶端流量問題（Client → LiteLLM） {#client-traffic-issues-client--litellm}
如果只有實際用戶端請求失敗，請先確認 LiteLLM 是否曾到達 MCP 那一跳。

#### MCP 協定工作階段 {#mcp-protocol-sessions}
像 IDE 或代理程式 runtime 這類用戶端會直接與 LiteLLM 使用 MCP 協定通訊。

**動作**
- 檢查 LiteLLM 存取記錄（請參閱 [存取記錄範例](./mcp_troubleshoot#access-log-example-successful-mcp-call)），確認用戶端請求已到達 proxy，以及它所目標的 MCP 伺服器。
- 檢視 LiteLLM 錯誤記錄（請參閱 [錯誤記錄範例](./mcp_troubleshoot#error-log-example-failed-mcp-call)），找出在 MCP 呼叫開始前就阻擋請求的 TLS、驗證或路由錯誤。
- 使用 [MCP Inspector](./mcp_troubleshoot#mcp-inspector) 確認在失敗的用戶端之外，MCP 伺服器仍可連達。

#### 內嵌 MCP 呼叫的回應／補全 {#responsescompletions-with-embedded-mcp-calls}
在 `/responses` 或 `/chat/completions` 期間，LiteLLM 可能會在請求進行中觸發 MCP 工具呼叫。錯誤可能發生在 MCP 呼叫開始之前，或是在 MCP 回應之後。

**動作**
- 檢查 LiteLLM 請求記錄（請參閱 [存取記錄範例](./mcp_troubleshoot#access-log-example-successful-mcp-call)），看是否有記錄到 MCP 嘗試；如果沒有，問題出在 `Client → LiteLLM`。
- 使用 [MCP Inspector](./mcp_troubleshoot#mcp-inspector) 驗證 MCP 連線，確認伺服器會回應。
- 透過 LiteLLM Playground 重現相同的 MCP 呼叫，確認 LiteLLM 能獨立完成 MCP 那一跳。

<Image
  img={require('../img/mcp_playground.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

### OAuth 中繼資料探索 {#oauth-metadata-discovery}
LiteLLM 會依據 MCP 規格執行中繼資料探索（[第 2.3 節](https://modelcontextprotocol.info/specification/draft/basic/authorization/#23-server-metadata-discovery)）。啟用 OAuth 時，請確認授權伺服器公開了中繼資料 URL，且 LiteLLM 能夠擷取它。

**動作**
- 從 LiteLLM 主機使用 `curl <metadata_url>`（或類似工具），確認 discovery 文件可連達，且包含預期的 authorization/token 端點。
- 記錄精確的中繼資料 URL、請求的 scopes，以及任何靜態 client 憑證，以便支援人員在需要時重播 discovery 步驟。

## 除錯 OAuth {#debugging-oauth}

如需詳細的 OAuth2 除錯——包含 debug header 參考、常見錯誤設定與範例輸出——請參閱 [除錯 OAuth](./mcp_oauth#debugging-oauth)。

### MCP OAuth：Connect 回傳 `{"detail":"invalid_request"}` {#mcp-oauth-invalid-request}

**症狀。** 在 LiteLLM UI 中點擊 MCP OAuth 伺服器上的 **Connect** 會回傳：

```
HTTP/1.1 400 Bad Request
{"detail":"invalid_request"}
```

proxy 記錄（啟用詳細記錄時）會顯示類似 `MCP OAuth: rejecting redirect_uri ... as invalid_request. Computed proxy base=...` 的一行。

**原因。** `/v1/mcp/server/oauth/{server_id}/authorize` 端點會驗證瀏覽器提供的 `redirect_uri`（`https://llm.example.com/ui/mcp/oauth/callback`）是否與 proxy 自身的公開 origin 共享 scheme + host + port。在經由 TLS 終止 ingress（Kubernetes、ALB、nginx、Cloudflare 等）部署時，proxy 預設會解析為其內部位址（`http://<pod-ip>:4000`），因此 same-origin 檢查會拒絕。

**診斷。** 比較 proxy 宣告的 origin 與瀏覽器看到的內容：

```bash
curl -sS https://llm.example.com/.well-known/oauth-authorization-server | jq .issuer
```

`issuer` 的值應等於使用者在瀏覽器中輸入的 origin（`https://llm.example.com`）。如果它回傳的是內部主機名稱或 `http://...`，則表示 proxy 解析出的 origin 錯誤。

**修正方式**，依優先順序：

1. **設定 `PROXY_BASE_URL`**（建議）。操作者在帶外指定 proxy 的真實公開 origin，無需信任標頭：

   ```bash
   PROXY_BASE_URL=https://llm.example.com
   ```

   僅限完整 origin：scheme + host（若非預設埠則含 port），不含結尾斜線，不含 path。請參閱 [反向 proxy 與 ingress 組態](./mcp_oauth#reverse-proxy-and-ingress-configuration)。

2. **信任來自您的 ingress 的 `X-Forwarded-*`。** 在 `general_settings` 中同時設定兩個鍵值：

   ```yaml title="config.yaml" showLineNumbers
   general_settings:
     use_x_forwarded_for: true
     mcp_trusted_proxy_ranges:
       - "10.0.0.0/8"      # your ingress / load-balancer CIDR(s)
   ```

   單有 `use_x_forwarded_for` 還不夠——如果沒有 `mcp_trusted_proxy_ranges`，proxy 會拒絕採信 `X-Forwarded-*`，因為它無法區分受信任的反向 proxy 與直接攻擊者。請確認您的 ingress 會送出 `X-Forwarded-Proto`、`X-Forwarded-Host`，以及（在非預設埠上執行時）`X-Forwarded-Port`。

3. **修正 ingress。** 如果 ingress 正在移除或重寫 `X-Forwarded-*`，那麼任何 proxy 設定都無法解決——請在 ingress 層恢復這些標頭。

如果 `redirect_uri` 確實位於您可控制的姊妹網域上（例如，一個內部 web app 以 MCP proxy 的 OAuth client 身分註冊），請透過 `MCP_TRUSTED_REDIRECT_ORIGINS` 將其 origin 加入允許清單。請參閱 [允許其他第一方 redirect_uri origins](./mcp_oauth#allowing-additional-first-party-redirect_uri-origins)。

## 驗證連線能力 {#verify-connectivity}

在影響正式流量之前，先執行輕量驗證。

### MCP 檢查器 {#mcp-inspector}
當您需要在同一處測試 `Client → LiteLLM` 與 `Client → MCP` 通訊時，請使用 MCP Inspector；它能讓您輕鬆隔離失敗的跳轉點。

1. 在您的工作站上執行 `npx @modelcontextprotocol/inspector`。
2. 設定並連線：
   - **Transport Type:** 選擇用戶端使用的傳輸（LiteLLM 使用 Streamable HTTP）。
   - **URL:** 測試中的端點（對於 `Client → LiteLLM`，填入 LiteLLM MCP URL；對於 `Client → MCP`，填入 MCP 伺服器 URL）。
   - **Custom Headers:** 例如，`x-litellm-api-key: Bearer <LiteLLM API Key>`。
3. 開啟 **Tools** 分頁並點擊 **List Tools**，確認 MCP 別名會回應。

### `curl` 煙霧測試 {#curl-smoke-test}
在不便安裝 Inspector 的伺服器上，`curl` 很適合使用。它會重現 LiteLLM 原本會發出的 MCP 工具呼叫——請替換成測試系統的網域（LiteLLM 或 MCP 伺服器）。

```bash
curl -X POST https://your-target-domain.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

當目標是需要驗證的 LiteLLM 端點時，請加入 `-H "x-litellm-api-key: Bearer <LiteLLM API Key>"`。調整標頭或 payload 以針對其他 MCP 方法。若 `curl` 與 LiteLLM 的失敗情況一致，便可確認罪魁禍首是 MCP 伺服器或網路／OAuth 層。

## 檢視記錄 {#review-logs}

範圍明確的記錄能清楚顯示 LiteLLM 是否已到達 MCP 伺服器，以及接下來發生了什麼。

### 存取記錄範例（成功的 MCP 呼叫） {#access-log-example-successful-mcp-call}
```text
INFO:     127.0.0.1:57230 - "POST /everything/mcp HTTP/1.1" 200 OK
```

### 錯誤記錄範例（失敗的 MCP 呼叫） {#error-log-example-failed-mcp-call}
```text
07:22:00 - LiteLLM:ERROR: client.py:224 - MCP client list_tools failed - Error Type: ExceptionGroup, Error: unhandled errors in a TaskGroup (1 sub-exception), Server: http://localhost:3001/mcp, Transport: MCPTransport.http
  httpcore.ConnectError: All connection attempts failed
ERROR:LiteLLM:MCP client list_tools failed - Error Type: ExceptionGroup, Error: unhandled errors in a TaskGroup (1 sub-exception)...
  httpx.ConnectError: All connection attempts failed
```
