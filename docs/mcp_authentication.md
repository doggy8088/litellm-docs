# MCP 非 OAuth 驗證 {#mcp-non-oauth-authentication}

本頁涵蓋不使用 OAuth 流程的上游 MCP 驗證，包括無驗證、固定憑證與 AWS SigV4。關於 OAuth 設定，請參閱 [MCP OAuth](./mcp_oauth.md)、[MCP OAuth Passthrough](./mcp_oauth_passthrough.md)，或 [MCP On-Behalf-Of Auth](./mcp_obo_auth.md)。

LiteLLM 會為 MCP 請求處理兩個獨立的驗證跳轉：

- **Client to LiteLLM：** MCP 用戶端證明其可以使用 LiteLLM 閘道，通常會使用 LiteLLM API 金鑰。
- **LiteLLM to the upstream MCP server：** LiteLLM 依據該伺服器的 `auth_type` 對所選上游進行驗證。

MCP server 上的 `auth_type` 控制第二個跳轉。用於閘道准入的 LiteLLM API 金鑰不會複製到上游 server。若要讓個別使用者或 service-account 金鑰在共用 server 上使用其自己的上游憑證，而不是使用儲存在該 server 上的憑證，請參閱 [Per-User and Per-Key Upstream Credentials](./mcp_per_user_auth.md)。

:::note[傳輸範圍]

本頁的 wire 範例涵蓋使用 SSE 或 Streamable HTTP 的遠端 MCP server。[OpenAPI-generated MCP tools](./mcp_openapi.md) 具有獨立的 auth-header 處理。

:::

## 選擇非 OAuth 驗證類型 {#choose-a-non-oauth-auth-type}

對於固定的非 OAuth 憑證，請選擇與上游 server 所需標頭相符的類型：

| `auth_type` | 您提供的內容 | 預設傳送到上游的憑證 | 使用情境 |
|---|---|---|---|
| `none` | 無 | 無憑證 | 上游允許匿名請求，或依賴網路層級的存取控制 |
| `api_key` | API key 值 | `X-API-Key: <auth_value>` | 上游預期有 `X-API-Key` 標頭 |
| `bearer_token` | 只有 Token | `Authorization: Bearer <auth_value>` | 固定的 bearer token、personal access token 或 service token |
| `basic` | 原始 `username:password` | `Authorization: Basic <base64(username:password)>` | HTTP Basic 驗證 |
| `token` | 只有 Token | `Authorization: token <auth_value>` | 明確使用 GitHub 風格 `token` 機制的上游 |
| `authorization` | 完整標頭值，包括其機制 | `Authorization: <auth_value>` | 自訂授權機制；可在設定與 API 中使用 |
| `aws_sigv4` | AWS 憑證或 IAM role | 每個請求都產生新的 AWS SigV4 簽章 | AWS Bedrock AgentCore MCP server |

## 用戶端傳送的內容 {#what-the-client-sends}

靜態上游憑證會儲存在 MCP server 設定中。用戶端不會在每次工具請求時傳送上游使用者名稱、密碼或 API key。

例如，無論上游 server 使用 `none`、`basic` 或 `api_key`，用戶端都可以送出相同的請求：

```http title="Client to LiteLLM"
POST /inventory/mcp HTTP/1.1
Host: litellm.example.com
x-litellm-api-key: Bearer sk-litellm
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

LiteLLM 會驗證用戶端、選取 `inventory` MCP server，並根據該 server 的 `auth_type` 建構上游請求。以下各節會顯示產生的上游憑證。

用戶端確實會為 `true_passthrough` 與 `oauth_delegate` 提供上游 token。請參閱 [MCP OAuth Passthrough](./mcp_oauth_passthrough.md)。

## 非 OAuth 驗證類型 {#non-oauth-auth-types}

### None {#none}

`auth_type: none` 表示驗證解析器不會提供任何上游憑證。

- **行為：** LiteLLM 不會為此驗證類型新增 `Authorization`、`X-API-Key` 或其他憑證標頭。
- **適用情境：** 上游 MCP 端點不需要應用程式憑證。常見範例是公開的 MCP server 或受網路原則保護的私有端點。
- **不適用情境：** 上游需要 Basic Auth、API key、bearer token，或呼叫端擁有的 token。

```yaml title="config.yaml"
mcp_servers:
  public_inventory:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "none"
```

上游請求不會由 LiteLLM 加入任何驗證憑證：

```http title="LiteLLM to upstream"
POST /mcp HTTP/1.1
Host: mcp.example.com
Content-Type: application/json
```

:::warning[請勿將憑證放在 URL 中]

當 `auth_type` 為 `none` 時，像 `https://username:password@mcp.example.com/mcp` 這樣的 URL 會被拒絕。LiteLLM 不會從 URL userinfo 推斷 Basic Auth。請從 URL 中移除憑證，改為設定 [`auth_type: basic`](#basic-auth)。

:::

### Basic Auth {#basic-auth}

`auth_type: basic` 會將原始使用者名稱與密碼轉換為標準的 HTTP Basic 標頭。

- **驗證值：** 請輸入 `username:password`。不要進行 base64 編碼，也不要加上 `Basic` 前綴。
- **行為：** LiteLLM 會將完整值進行 base64 編碼，加入 `Basic` 機制，並在每次上游請求中傳送相同的服務憑證。
- **適用情境：** 上游文件要求 HTTP Basic 驗證。

```yaml title="config.yaml"
mcp_servers:
  inventory:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "basic"
    auth_value: os.environ/MCP_BASIC_AUTH # value: username:password
```

對於 `MCP_BASIC_AUTH=username:password`，LiteLLM 會傳送：

```http title="LiteLLM to upstream"
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

使用者名稱與密碼應放在 `auth_value` 中，而不是放在 server URL 中。

### API key {#api-key}

`auth_type: api_key` 會在 `X-API-Key` 中傳送單一固定金鑰。

- **驗證值：** 請只輸入金鑰值。
- **行為：** LiteLLM 會在每次上游請求中傳送相同的金鑰。
- **適用情境：** 上游文件要求 `X-API-Key`。

```yaml title="config.yaml"
mcp_servers:
  inventory:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "api_key"
    auth_value: os.environ/INVENTORY_API_KEY
```

```http title="LiteLLM to upstream"
X-API-Key: <INVENTORY_API_KEY>
```

如果上游預期不同的標頭名稱，請使用 [`static_headers`](#custom-and-forwarded-headers) 或設定 `upstream_token_header`。

### Bearer token {#bearer-token}

`auth_type: bearer_token` 會將 `Bearer` 機制加到固定 token 上。

- **驗證值：** 請只輸入 token。不要加上 `Bearer` 前綴。
- **行為：** LiteLLM 會在每次上游請求中傳送 `Authorization: Bearer <token>`。
- **適用情境：** 上游接受固定的 bearer token，例如 service token 或 personal access token。若 token 必須由呼叫端簽發、重新整理、交換或提供，請參閱 [MCP OAuth](./mcp_oauth.md)。

```yaml title="config.yaml"
mcp_servers:
  inventory:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "bearer_token"
    auth_value: os.environ/INVENTORY_TOKEN
```

```http title="LiteLLM to upstream"
Authorization: Bearer <INVENTORY_TOKEN>
```

### Token {#token}

`auth_type: token` 使用小寫的 `token` 授權機制。

- **驗證值：** 請只輸入 token。不要加上 `token` 前綴。
- **行為：** LiteLLM 會傳送 `Authorization: token <token>`。
- **適用情境：** 上游明確記載使用此機制。標準 bearer 驗證請使用 `bearer_token`。

```yaml title="config.yaml"
mcp_servers:
  legacy_service:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "token"
    auth_value: os.environ/LEGACY_SERVICE_TOKEN
```

```http title="LiteLLM to upstream"
Authorization: token <LEGACY_SERVICE_TOKEN>
```

### Authorization {#authorization}

`auth_type: authorization` 會將驗證值原樣傳送到 `Authorization` 標頭中。

- **驗證值：** 請輸入完整值，包括機制或前綴。
- **行為：** LiteLLM 不會新增、移除或變更該機制。
- **適用情境：** 上游使用其他靜態類型未涵蓋的授權機制。此值可在 `config.yaml` 與 server API 中使用，但目前未列於 Admin UI 下拉選單中。

```yaml title="config.yaml"
mcp_servers:
  custom_scheme:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "authorization"
    auth_value: os.environ/CUSTOM_AUTH_HEADER # value: Custom <token>
```

```http title="LiteLLM to upstream"
Authorization: Custom <CUSTOM_AUTH_TOKEN>
```

### AWS SigV4 {#aws-sigv4}

`auth_type: aws_sigv4` 會使用 AWS Signature Version 4 為每個請求簽章，而不是附加單一固定 token。

- **行為：** LiteLLM 會對每個請求進行雜湊與簽章，然後加入 AWS 所需產生的 `Authorization`、`x-amz-date` 以及暫時性憑證標頭。
- **適用情境：** 上游是 AWS Bedrock AgentCore MCP server。
- **憑證來源：** 使用明確的 AWS 憑證、boto3 憑證鏈，或 LiteLLM 可以 assume 的 IAM role。

```yaml title="config.yaml"
mcp_servers:
  agentcore:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_role_name: os.environ/AWS_ROLE_ARN
    aws_region_name: "us-east-1"
    aws_service_name: "bedrock-agentcore"
```

設定與疑難排解請參閱 [MCP AWS SigV4 Auth](./mcp_aws_sigv4.md)。

## 自訂與轉發標頭 {#custom-and-forwarded-headers}

有些上游需要自訂標頭名稱或多個固定標頭。這些設定與 `auth_type` 分開：

- **`static_headers`：** LiteLLM 會將設定的值加入每次上游請求中。可用於自訂靜態憑證、租戶識別碼或次要閘道憑證。
- **`extra_headers`：** LiteLLM 只會將目前用戶端請求中指定的標頭複製到上游。可用於由用戶端擁有的、與請求相關的內容。

```yaml title="config.yaml"
mcp_servers:
  custom_headers:
    url: "https://mcp.example.com/mcp"
    transport: "http"
    auth_type: "none"
    static_headers:
      X-Custom-Auth: os.environ/MCP_CUSTOM_AUTH
    extra_headers:
      - X-Tenant-ID
```

在此範例中，`none` 解析器仍然不會提供任何憑證。因為 `X-Custom-Auth` 是在 `static_headers` 中另外宣告的，所以它會存在。

對於 `Authorization` 中由呼叫端持有的 OAuth bearer，請改用 `true_passthrough` 或 `oauth_delegate`，不要將其視為一般的額外標頭。
