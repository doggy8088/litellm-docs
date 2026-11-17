---
title: "LiteLLM MCP 的 Microsoft Agent 365 防護欄"
sidebar_label: "Microsoft Agent 365 防護欄"
description: "將 LiteLLM AI 閘道發出的每個 MCP 工具呼叫送往 Microsoft Agent 365，讓 Microsoft Defender 允許或封鎖該呼叫，並以使用者身分加以記錄。"
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# Microsoft Agent 365 防護欄 {#microsoft-agent-365-guardrail}

在 LiteLLM 執行之前，將每個 MCP 工具呼叫送至 [Microsoft Agent 365](https://learn.microsoft.com/en-us/agent-365/overview) 評估 API。Microsoft Defender 會回傳允許或封鎖，而該呼叫會在 Microsoft 端以已登入使用者的身分記錄

<Image img={require('../../../img/agent365_guardrail_flow.png')} style={{ width: '100%', maxWidth: '4000px' }} alt="一個 MCP 工具呼叫從用戶端送往 LiteLLM MCP 閘道，閘道以 On-Behalf-Of 方式交換使用者的 Entra 權杖，向 Microsoft Agent 365 與 Defender 詢問判定，接著在 MCP 伺服器上執行該工具或將其封鎖，並在請求記錄中記錄防護欄狀態" />

## 支援的模式 {#supported-modes}

| 模式 | 功能 |
|------|-------------|
| `pre_mcp_call` | 在執行前以 Defender 評估工具名稱、引數和伺服器。若回傳封鎖判定則封鎖 |

此防護欄只會套用於 MCP 工具呼叫。聊天完成與其他 LLM 路由不受影響

## 運作方式 {#how-it-works}

Agent 365 會在已登入使用者的情境下進行評估，因此每個受保護的工具呼叫都需要該使用者的 Entra 存取權杖，且其受眾需為您的 gateway app registration，並放在 `Authorization` 標頭中。此防護欄會透過 On-Behalf-Of (OBO) 交換，取得委派的 Agent 365 權杖，並以該使用者身分進行評估。沒有服務或代理程式身分模式：沒有使用者權杖的呼叫會被拒絕

LiteLLM 金鑰則是透過 `x-litellm-api-key` 分開傳遞。在已經透過 [JWT auth](/docs/proxy/token_auth) 接受 Entra 權杖的 proxy 上，Entra 權杖同時也是 LiteLLM 憑證

每個工具呼叫

1. LiteLLM 准入：金鑰或 JWT 檢查，接著檢查該金鑰的 MCP 伺服器與工具權限。無效憑證會在此以一般的 401 或 403 失敗
2. 防護欄從 `Authorization` 讀取 Entra 權杖。缺少或不是 JWT：該呼叫會被拒絕
3. OBO 交換，並以權杖生命週期為快取期間
4. 待處理的呼叫送往 Agent 365：工具名稱、引數、伺服器名稱、`conversationId`、當 LiteLLM 已從先前列出該伺服器的工具時取得的工具描述與輸入結構描述，以及金鑰有別名時以呼叫者的金鑰別名作為代理程式 id。使用者提示絕不會被送出
5. 允許並附帶 `defender.status: Evaluated`：LiteLLM 執行該工具。封鎖：該呼叫會被拒絕，附帶 Defender 訊息與關聯 ID，且完全不會連到 MCP 伺服器。已允許但未評估（`Skipped`、`FailedOpen`）：視為未掃描，`unreachable_fallback` 決定（預設封鎖）

拒絕如何傳達給用戶端取決於路由。`/mcp-rest/tools/call` 會以 [失敗行為](#failure-behavior) 中的 HTTP 狀態與完整 JSON 主體回覆。在 `/mcp` 傳輸上，HTTP 回應為 200，工具結果帶有 `isError: true` 且只有簡短的錯誤，例如 `Error: Blocked by Microsoft Defender`。完整主體（包含 Defender 訊息與關聯 id）位於該呼叫 [Logs 列](#logs) 的錯誤詳細資訊中

### MCP 伺服器驗證類型 {#mcp-server-auth-types}

防護欄不會檢查伺服器的 `auth_type`。它一律從用戶端的 `Authorization` 標頭取得使用者權杖，因此請選擇能讓該標頭保留在閘道的驗證類型

| `auth_type` | 搭配防護欄的行為 |
|-------------|--------------------|
| `none`, `api_key`, `bearer_token`, `basic`, `authorization`, `token`, `aws_sigv4`, `oauth2` with `oauth2_flow: client_credentials` | 可運作。上游取得的是伺服器自身的憑證，絕不會是使用者的 Entra 權杖。不要在 `extra_headers` 下列出 `Authorization`；轉送其他用戶端標頭（例如 `x-api-key`）沒有問題 |
| `oauth2_token_exchange` | 可運作。同一個 Entra 權杖就是 LiteLLM 交換上游所用的主體權杖（[MCP OBO auth](/docs/mcp_obo_auth)） |
| `true_passthrough`, `Authorization` under `extra_headers` | 會像其他伺服器一樣被評估與封鎖，但使用者的 Entra 權杖也會在每個請求（包含工具清單）中被轉送到上游。使用 JWT 驗證時，該權杖同時也是使用者的 LiteLLM 憑證。請避免使用這些類型 |
| `oauth_delegate`, or `oauth2` with `delegate_auth_to_upstream: true` and any flow other than `client_credentials` | 當呼叫在 `x-litellm-api-key` 中帶有 LiteLLM 金鑰時，與 `true_passthrough` 相同：Entra 權杖會被轉送到上游。對於僅使用 JWT 的呼叫端，LiteLLM 會將其移除，因此上游完全不會取得憑證。請避免 |
| `oauth2` with `oauth2_flow: authorization_code` | LiteLLM 會將使用者為該伺服器儲存的 OAuth 權杖送往上游，取代用戶端的 `Authorization`，因此 Entra 權杖可以留在 `Authorization` 中。該憑證儲存在呼叫者的 LiteLLM `user_id` 之下，因此虛擬金鑰需要有一個（[MCP OAuth](/docs/mcp_oauth)）。在使用者擁有已儲存的憑證之前，呼叫會在防護欄執行前就失敗：`/mcp` 對 `initialize` 回覆 401，`/mcp-rest/tools/call` 回覆 500 `Tool ... not found` |
| `oauth2_id_jag` | 工具清單使用使用者已儲存的 SSO 斷言；若沒有，清單會以 412 失敗，且呼叫會在防護欄執行前以 `Tool ... not found`（REST 500）失敗。若有，防護欄會進行評估，接著 `Authorization` 中的 Entra 權杖會取代 SSO 斷言成為 ID-JAG 主體，除非有設定 `subject_token_type`，否則會以 `id_token` 形式送出。除非身分提供者接受該權杖，否則交換會失敗，用戶端會在評估後收到 503。請在這些伺服器上關閉防護欄，或將它們移到 `oauth2_token_exchange` |

## 必要條件 {#prerequisites}

由租戶管理員進行一次性的 Entra 設定

1. 請您的 Microsoft Agent 365 聯絡人為您的租戶完成上線。在那之前，評估端點會回傳 `409 BAPForbiddenTenantAccess`
2. 在 **Microsoft Entra ID > App registrations** 下註冊 gateway app，設定為 single tenant，且不要 redirect URI。記錄 client id 與 tenant id，並在 **Certificates & secrets** 下建立 client secret。這些就是防護欄的 `client_id`、`tenant_id` 和 `client_secret`
3. 在 **Expose an API** 下，將 Application ID URI 設為 `api://<client_id>`，並新增名為 `access_as_user` 的 scope。這就是您的 MCP 用戶端所請求的 scope
4. 同樣在 **Expose an API** 下，預先授權每個使用者會從中呼叫的應用程式之 client id。若要在終端機測試，請預先授權 Azure CLI（Microsoft 的公開 app id `04b07795-8ddb-461a-bbee-02f9e1bf7b46`）
5. 在 **API permissions > Add a permission > APIs my organization uses** 下，新增 **Agent Tools** API（Microsoft 的公開 app id `ea9ffc3e-8a23-4a7d-836d-234d7c7565c1`）、delegated permission `ThreatProtection.Evaluate.All`，並授予 admin consent。它必須是 delegated，而不是 application：application permission 會鑄造出 Agent 365 會拒絕的權杖

在動手設定 LiteLLM 之前先檢查設定

```bash
az login --tenant <tenant_id>
az account get-access-token --tenant <tenant_id> --resource api://<gateway_client_id>
```

解碼該權杖，並確認 `aud` 是 `api://<gateway_client_id>`，且 `scp` 包含 `access_as_user`。那就是您的 MCP 用戶端送出的權杖

## 快速開始 {#quick-start}

### 1. 在 `config.yaml` 中定義防護欄 {#1-define-the-guardrail-in-configyaml}

步驟 3 的虛擬金鑰需要資料庫

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL

guardrails:
  - guardrail_name: agent365-mcp
    litellm_params:
      guardrail: agent_365
      mode: pre_mcp_call
      default_on: true
      tenant_id: os.environ/AGENT365_TENANT_ID
      client_id: os.environ/AGENT365_CLIENT_ID
      client_secret: os.environ/AGENT365_CLIENT_SECRET

mcp_servers:
  deepwiki:
    transport: "http"
    url: "https://mcp.deepwiki.com/mcp"
```

### 2. 啟動 proxy {#2-start-the-proxy}

```bash
export AGENT365_TENANT_ID="<your Entra tenant id>"
export AGENT365_CLIENT_ID="<gateway app client id>"
export AGENT365_CLIENT_SECRET="<gateway app client secret>"
export LITELLM_MASTER_KEY="sk-<your-master-key>"
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>"

litellm --config config.yaml
```

### 3. 為 MCP 伺服器建立金鑰 {#3-create-a-key-for-the-mcp-server}

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key_alias": "my-agent", "object_permission": {"mcp_servers": ["deepwiki"]}}'
```

`key_alias` 是 Agent 365 在每次評估時記錄的代理程式 id

### 4. 呼叫 MCP 工具 {#4-call-an-mcp-tool}

```bash
export LITELLM_API_KEY="<key from step 3>"
TOKEN=$(az account get-access-token --tenant <tenant_id> --resource api://<gateway_client_id> --query accessToken -o tsv)
curl -X POST http://localhost:4000/mcp-rest/tools/call \
  -H "x-litellm-api-key: Bearer $LITELLM_API_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "deepwiki",
    "name": "read_wiki_structure",
    "arguments": {"repoName": "BerriAI/litellm"}
  }'
```

允許的呼叫會回傳工具結果。被封鎖的呼叫會回傳 HTTP 400

```json
{
  "detail": {
    "error": "Blocked by Microsoft Defender",
    "message": "Invocation of 'read_wiki_structure' is blocked by Microsoft Threat Detection policies configured by your administrator.",
    "tool": "read_wiki_structure",
    "correlation_id": "<id to look the call up on the Microsoft side>",
    "guardrail_name": "agent365-mcp",
    "guardrail_mode": "pre_mcp_call"
  }
}
```

## 記錄 {#logs}

每個受防護的工具呼叫，無論允許、封鎖或拒絕，在 `/mcp` 與 `/mcp-rest/tools/call` 上都會在 Admin UI 的 **Logs** 下產生一列（[UI logs](/docs/proxy/ui_logs)）。該列一律顯示防護欄名稱、模式與狀態。它會顯示 Agent 365 呼叫所花的時間，但當 Agent 365 未被呼叫、未回覆（無法連線或逾時），或回覆 5xx 或無法解析的主體時除外。狀態對於允許的呼叫是 `success`，對於 Defender 封鎖、被拒絕的呼叫端或被 Agent 365 拒絕的請求是 `guardrail_intervened`，而當 Agent 365 或 Entra 無法被詢問、節流該呼叫、回傳 5xx 或無法解析的回覆、拒絕閘道自身的憑證，或 Defender 未進行評估時，則是 `guardrail_failed_to_respond`。被拒絕呼叫的錯誤詳細資訊帶有完整的錯誤主體，包括封鎖的 Defender 訊息與關聯 id

該列上防護欄的回應，包含判定（`Allow`、`Block`、`Rejected`、`Throttled`、`Unavailable`、`Unscanned`）、Defender 狀態、關聯 id、延遲與失敗原因，只有在 `store_prompts_in_spend_logs` 開啟時才會儲存。未開啟時，回應會顯示為 `REDACTED_BY_LITELM`

```yaml
general_settings:
  store_prompts_in_spend_logs: true
```

## 呼叫端情境 {#caller-scenarios}

使用者權杖如何進入請求

### A. 具有 Entra JWT auth 的 proxy 上的應用程式 {#a-applications-on-a-proxy-with-entra-jwt-auth}

搭配 `enable_jwt_auth` 與以 Entra 為簽發者（[OIDC JWT auth](/docs/proxy/token_auth)），應用程式的 Entra bearer 同時是 LiteLLM 憑證與 OBO 主體。不需要 `x-litellm-api-key`。該權杖必須是為 gateway app（`aud` `api://<gateway_client_id>`、`scp` 且帶有 `access_as_user`）所核發；用於 Microsoft Graph 或其他 API 的權杖會在 JWT 准入時失敗

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
  enable_jwt_auth: true
  litellm_jwtauth:
    user_id_jwt_field: oid
    user_email_jwt_field: email
    user_id_upsert: true
    team_id_default: entra-users
```

```bash
export JWT_PUBLIC_KEY_URL="https://login.microsoftonline.com/<tenant_id>/discovery/keys"
export JWT_AUDIENCE="api://<gateway_client_id>"
export JWT_ISSUER="https://sts.windows.net/<tenant_id>/"
```

`team_id_default` 是 MCP 權限由 JWT 呼叫端繼承的團隊。請在第一次呼叫前建立它並授予 MCP 伺服器的存取權，否則每個呼叫都會得到 HTTP 404 `Team doesn't exist in db`

```bash
curl -X POST http://localhost:4000/team/new \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"team_id": "entra-users", "team_alias": "entra-users", "object_permission": {"mcp_servers": ["<server_id>"]}}'
```

從 `GET /v1/mcp/server` 取得 `<server_id>`。若應用程式發出 v2 權杖，請將 `https://login.microsoftonline.com/<tenant_id>/v2.0` 用作簽發者。這些呼叫端沒有虛擬金鑰，因此其評估不會帶有代理程式 id

### B. 自行鑄造權杖的用戶端 {#b-clients-that-mint-the-token-themselves}

指令碼，或帶有靜態標頭的 MCP 用戶端，會使用 MSAL 或 Azure CLI（在必要條件步驟 4 中已預先授權）取得 gateway 受眾權杖，並將其與 LiteLLM 金鑰一起送出，完全如同快速開始所示。用戶端負責更新；Entra 存取權杖的有效期約一小時。相同的標頭可用於 `/mcp` 傳輸與 `claude mcp add ... -H "Authorization: Bearer $TOKEN"`。REST 外觀介面請參閱 [MCP REST API](/docs/mcp_rest_api)

防護欄不會送出登入挑戰，因此只有 LiteLLM 金鑰的呼叫會被拒絕，直到用戶端自行附加 Entra 權杖為止。`/mcp-rest/tools/call` 回覆 401，`/mcp` 則回傳 `isError` 工具結果，請參閱 [失敗行為](#failure-behavior)

### 兩層授權 {#two-layers-of-authorization}

LiteLLM 決定哪些金鑰、使用者與團隊可進入哪些伺服器與工具（[MCP permission management](/docs/mcp_control)）。工具在上游系統內可以做什麼，則由 LiteLLM 所提供的憑證在上游端決定。使用共享 API 金鑰時，上游會看到服務身分；若要讓它看到已登入使用者，請使用 `auth_type: oauth2_token_exchange`（[MCP OBO auth](/docs/mcp_obo_auth)）。防護欄無論如何都會評估該呼叫

## 設定參數 {#configuration-parameters}

| 參數 | 必填 | 描述 |
|-----------|----------|-------------|
| `tenant_id` | 是 | Entra 租戶 id。若無則回退至 `AGENT365_TENANT_ID` |
| `client_id` | 是 | 閘道應用程式註冊的用戶端 id。若無則回退至 `AGENT365_CLIENT_ID` |
| `client_secret` | 是 | 該應用程式的用戶端密鑰。也接受 `api_key`。若無則回退至 `AGENT365_CLIENT_SECRET` |
| `timeout` | 否 | 每個 token 交換與評估請求的秒數。預設為 10 |
| `unreachable_fallback` | 否 | 當 Agent 365 或 Entra 無法連線、Entra 拒絕閘道自身的憑證、或 Defender 未進行評估時會發生什麼事。`fail_closed`（預設）會以 HTTP 503 阻擋。`fail_open` 會讓呼叫在未掃描的情況下通過，並以錯誤等級記錄。封鎖、拒絕、節流與呼叫端側失敗一律會阻擋 |

除此之外沒有其他可指向的內容。評估會送往 `https://agent365.svc.cloud.microsoft`，OBO 交換會送往 `https://login.microsoftonline.com` 並為 Microsoft 的 Agent Tools 應用程式簽發 token，而評估所回報的代理程式 id 是呼叫者的金鑰別名。舊版 `api_base`、`resource_app_id` 與 `agent_id` 在 config.yaml 中的鍵會被忽略，並在啟動時發出警告

## 失敗行為 {#failure-behavior}

預設情況下，防護欄採取 fail-closed：當無法詢問 Agent 365 時，呼叫會被阻擋，且永遠不會連到 MCP 伺服器。防護欄位於每次工具呼叫的請求路徑上，因此偏好可用性勝過覆蓋範圍的租戶會以 `unreachable_fallback: fail_open` 明確啟用，接著呼叫會照常執行並被記錄為未掃描

以下狀態碼是 `/mcp-rest/tools/call` 回傳的結果。在 `/mcp` 傳輸上，每個拒絕都是帶有 `error` 文字且 `isError` 的工具結果，請參閱 [運作方式](#how-it-works)

| 情況 | Fail closed | Fail open |
|-----------|-------------|-----------|
| Defender 封鎖 | 400 | 400 |
| Agent 365 拒絕請求（408 與 429 以外的 4xx） | 400 | 400 |
| 呼叫端未送出 Entra 權杖，或 Entra 拒絕它 | 401 | 401 |
| Agent 365 或 Entra 節流（408 或 429） | 503 | 503 |
| Entra 拒絕閘道自身的憑證 | 503 | 允許，未掃描 |
| Agent 365 或 Entra 無法連線、逾時、5xx 或無法解析的回覆 | 503 | 允許，未掃描 |
| Defender 未進行評估（`Skipped` 或 `FailedOpen`） | 503 | 允許，未掃描 |

`error` 欄位可以區分這些拒絕。Defender 封鎖是 `Blocked by Microsoft Defender`，並帶有 Defender 訊息與關聯 id。Agent 365 拒絕是 `Agent 365 rejected the tool evaluation request`，被拒絕的呼叫端是 `Agent 365 guardrail rejected the tool call`，而每個 503 都是 `Agent 365 guardrail could not authorize the tool call`，原因在 `message` 中

當權杖缺少或不是 JWT，或 Entra 對 OBO 交換回覆 `invalid_grant`（過期、受眾錯誤、缺少同意），或對於格式錯誤的權杖回覆 `invalid_client` 時，呼叫端會被拒絕。訊息只會指出該錯誤碼，完整的 `AADSTS` 描述位於 Logs 列的錯誤詳細資訊中。閘道自身的憑證會以 `invalid_client`、`unauthorized_client`、`invalid_scope` 或 `invalid_resource` 被拒絕，而 503 訊息會指出需要檢查的設定。這種情況永遠不會是 401，因此用戶端不會要求使用者再次登入

### 觀察 fail-open 呼叫 {#watching-fail-open-calls}

使用 `fail_open` 時，每次未掃描而放行的呼叫都會以錯誤等級記錄原因。其 Logs 列的請求狀態為 Success，防護欄狀態為 `guardrail_failed_to_respond`，其 OpenTelemetry 防護欄 span 也帶有相同的 `guardrail_status`。Logs 頁面上的 Status 篩選只區分 Success 與 Failure，因此請在 **Guardrails Monitor** 下開啟該防護欄，並在其記錄清單中選取 **Flagged**，這樣會在最近 50 次呼叫中保留 `guardrail_failed_to_respond` 的列（提高 **Sample** 可看到超過 10 筆）；若那裡持續出現這些列，表示 Agent 365 沒有在評估您的工具呼叫。Fail-closed 的拒絕與被節流的呼叫也會被標記，因此請檢查判定（`Unscanned`、`Unavailable` 或 `Throttled`）或請求狀態（拒絕為 Failure）來區分它們。Span 一律帶有判定；在 Logs 列上則需要 `store_prompts_in_spend_logs`

## 對話分組 {#conversation-grouping}

Agent 365 會依 `conversationId` 分組評估。當傳輸有 `Mcp-Session-Id` 時，防護欄會送出該值，因此同一個 MCP 工作階段中的所有呼叫都會落在同一個 Defender 對話中。無狀態呼叫（`/mcp-rest/tools/call`，或沒有工作階段的可串流呼叫）會使用 LiteLLM 的 request id 作為該呼叫的識別碼，也就是 Logs 列所顯示的相同 id
