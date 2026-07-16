import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# MCP 總覽 {#mcp-overview}

LiteLLM Proxy 提供一個 MCP 閘道，讓您能為所有 MCP 工具使用固定端點，並依 API 金鑰、團隊來控管 MCP 存取。 

<Image 
  img={require('../img/mcp_2.png')}
  style={{width: '100%', display: 'block', margin: '2rem auto'}}
/>
<p style={{textAlign: 'left', color: '#666'}}>
  LiteLLM MCP 架構：使用所有 LiteLLM 支援的模型搭配 MCP 工具
</p>

## 總覽 {#overview}
| 功能 | 說明 |
|---------|-------------|
| MCP Operations | • 列出工具<br/>• 呼叫工具 <br/>• 提示詞 <br/>• 資源 |
| Direct REST API | [`/mcp-rest/tools/list` 與 `/mcp-rest/tools/call`](./mcp_rest_api.md) — 不需 LLM 即可用 curl 呼叫工具 |
| Supported MCP Transports | • Streamable HTTP<br/>• SSE<br/>• 標準輸入/輸出 (stdio) |
| LiteLLM Permission Management | • 依 API 金鑰<br/>• 依團隊<br/>• 依組織 |

:::caution MCP protocol update
從 LiteLLM v1.80.18 開始，LiteLLM MCP 協定版本為 `2025-11-25`。<br/> 
LiteLLM 會透過在每個工具名稱前加上其 MCP 伺服器名稱來為多個 MCP 伺服器命名空間，因此新建立的伺服器現在必須使用符合 SEP-986 的名稱——不符合規範的名稱將無法再新增。現有仍違反 SEP-986 的伺服器目前只會發出警告，但未來 MCP 端的推出可能會完全封鎖這些名稱，因此建議您在 MCP 強制限制使其無法使用之前，主動更新任何舊版伺服器名稱。
:::

## 新增您的 MCP {#adding-your-mcp}

### 前置需求 {#prerequisites}

若要將 MCP 伺服器儲存在資料庫中，您需要啟用資料庫儲存：

**環境變數：**
```bash
export STORE_MODEL_IN_DB=True
```

**或在 config.yaml 中：**
```yaml
general_settings:
  store_model_in_db: true
```

#### 細粒度資料庫儲存控制 {#fine-grained-database-storage-control}

預設情況下，當 `store_model_in_db` 為 `true` 時，所有物件類型（models、MCP、guardrails、vector stores 等）都會儲存在資料庫中。如果您只想儲存特定物件類型，請使用 `supported_db_objects` 設定。

**範例：只將 MCP 伺服器儲存在資料庫中**

```yaml title="config.yaml" showLineNumbers
general_settings:
  store_model_in_db: true
  supported_db_objects: ["mcp"]  # Only store MCP servers in DB

model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx
```

**查看所有可用的物件類型：** [Config Settings - supported_db_objects](./proxy/config_settings.md#general_settings---reference)

如果未設定 `supported_db_objects`，所有物件類型都會從資料庫載入（預設行為）。

若要診斷設定後的連線問題，請參閱 [MCP 疑難排解指南](./mcp_troubleshoot.md)。

<Tabs>
<TabItem value="ui" label="LiteLLM UI">

在 LiteLLM UI 中，前往「MCP Servers」，然後點選「Add New MCP Server」。

在此表單中，您應輸入 MCP Server URL 與要使用的傳輸方式。

LiteLLM 支援下列 MCP 傳輸：
- Streamable HTTP
- SSE (Server-Sent Events)
- 標準輸入/輸出 (stdio)

<Image 
  img={require('../img/add_mcp.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>
<br/>

### 新增 HTTP MCP Server {#add-http-mcp-server}

此影片示範如何在 LiteLLM UI 中新增與使用 HTTP MCP server，並在 Cursor IDE 中使用它。

<iframe width="840" height="500" src="https://www.loom.com/embed/e2aebce78e8d46beafeb4bacdde31f14" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

<br/>
<br/>

### 新增 SSE MCP Server {#add-sse-mcp-server}

此影片示範如何在 LiteLLM UI 中新增與使用 SSE MCP server，並在 Cursor IDE 中使用它。

<iframe width="840" height="500" src="https://www.loom.com/embed/07e04e27f5e74475b9cf8ef8247d2c3e" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

<br/>
<br/>

### 新增 STDIO MCP Server {#add-stdio-mcp-server}

對於 stdio MCP 伺服器，請將「Standard Input/Output (stdio)」選為傳輸類型，並以 JSON 格式提供 stdio 設定：

<Image 
  img={require('../img/add_stdio_mcp.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>
<br/>

### OAuth 設定與覆寫 {#oauth-configuration--overrides}

LiteLLM 預設會嘗試 [OAuth 2.0 Authorization Server Discovery](https://datatracker.ietf.org/doc/html/rfc8414)。當您在 UI 中建立 MCP 伺服器並設定 `Authentication: OAuth` 時，LiteLLM 會定位提供者中繼資料、動態註冊用戶端，並以 PKCE 為基礎執行授權，而您無需提供任何額外細節。

**需要時可自訂 OAuth 流程：**

<Image 
  img={require('../img/mcp_oauth.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

- **提供明確的用戶端憑證** – 如果 MCP 提供者不支援動態用戶端註冊，或您希望自行管理用戶端，請填入 `client_id`、`client_secret`，以及所需的 `scopes`。
- **覆寫探索 URL** – 在某些環境中，LiteLLM 可能無法連線到提供者的中繼資料端點。請使用可選的 `authorization_url`、`token_url` 與 `registration_url` 欄位，將 LiteLLM 直接指向正確的端點。

<br/>

### AWS SigV4 驗證 {#aws-sigv4-authentication}

對於託管於 [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html) 的 MCP 伺服器，請將驗證類型選為 **AWS SigV4**。LiteLLM 會使用您的 AWS 憑證，並透過 [Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html) 為每個外送的 MCP 請求簽章。

<Image
  img={require('../img/mcp_aws_sigv4_ui.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

填入您的 AWS 區域、服務名稱（預設為 `bedrock-agentcore`），並可選擇填入您的 AWS access key 與 secret。若省略憑證，LiteLLM 會回退到 boto3 憑證鏈（IAM roles、環境變數等）。

[**查看完整 SigV4 設定指南**](./mcp_aws_sigv4.md)

<br/>

### 靜態標頭 {#static-headers}

有時您的 MCP 伺服器需要每個請求都帶有特定標頭。可能是 API key，也可能是伺服器所預期的自訂標頭。與其設定驗證，不如直接設定它們。

<Image 
  img={require('../img/static_headers.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

這些標頭會隨每個請求送到伺服器。就是這樣。

**何時使用此功能：**
- 您的伺服器需要不符合標準驗證模式的自訂標頭
- 您希望完全掌控實際送出的標頭內容
- 您正在除錯，且需要在不變更驗證設定的情況下快速新增標頭

### 伺服器變數 {#server-variables}

將憑證儲存在伺服器上，並透過 `${VAR_NAME}` 在靜態標頭或驗證中引用它們（例如 `${DB_PROTOCOL}://${CORP_USERNAME}:${CORP_PASSWORD}@${DB_HOSTNAME}`）。將每個變數的範圍設為 **Instance**（共享）或 **Per-user**（每位使用者各自提供自己的值）。

<iframe width="840" height="500" src="https://www.loom.com/embed/12878e2be19140069170c3a270b50d1c" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

**何時使用此功能：**
- 每位使用者都需要使用自己的靜態憑證連線
- 您希望在不同使用者之間重複使用某些共享資訊（例如 DB url）

</TabItem>

<TabItem value="config" label="config.yaml">

直接在您的 `config.yaml` 檔案中新增 MCP 伺服器：

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx

litellm_settings:
  # MCP Aliases - Map aliases to server names for easier tool access
  mcp_aliases:
    "github": "github_mcp_server"
    "zapier": "zapier_mcp_server"
    "deepwiki": "deepwiki_mcp_server"

mcp_servers:
  # HTTP Streamable Server
  deepwiki_mcp:
    url: "https://mcp.deepwiki.com/mcp"
  # SSE Server
  zapier_mcp:
    url: "https://actions.zapier.com/mcp/sk-akxxxxx/sse"
  
  # Standard Input/Output (stdio) Server - CircleCI Example
  circleci_mcp:
    transport: "stdio"
    command: "npx"
    args: ["-y", "@circleci/mcp-server-circleci"]
    env:
      CIRCLECI_TOKEN: "your-circleci-token"
      CIRCLECI_BASE_URL: "https://circleci.com"
  
  # Full configuration with all optional fields
  my_http_server:
    url: "https://my-mcp-server.com/mcp"
    transport: "http"
    description: "My custom MCP server"
    auth_type: "api_key"
    auth_value: "abc123"
```

**設定選項：**
- **Server Name**：為您的 MCP 伺服器使用任何具描述性的名稱（例如 `zapier_mcp`、`deepwiki_mcp`、`circleci_mcp`）
- **Alias**：此名稱將預先填入伺服器名稱，並以 "_" 取代空格；否則可將其編輯為工具名稱中的前綴
- **URL**：您的 MCP 伺服器端點 URL（HTTP/SSE 傳輸必填）
- **Transport**：可選的傳輸類型（預設為 `sse`）
  - `sse` - SSE (Server-Sent Events) 傳輸
  - `http` - Streamable HTTP 傳輸
  - `stdio` - 標準輸入/輸出傳輸
- **Command**：執行 stdio 傳輸的命令（stdio 必填）
- **allow_all_keys**：設為 `true`，即可讓所有 LiteLLM API 金鑰都能使用此伺服器，即使該金鑰/團隊未在其 MCP 權限中列出此伺服器。
- **Args**：要傳給命令的引數陣列（stdio 可選）
- **Env**：為 stdio 程序設定的環境變數（stdio 可選）
- **Description**：伺服器的可選描述
- **Auth Type**：可選的驗證類型。支援值：

| 值 | 傳送的標頭（受管 SSE/HTTP 傳輸） |
  |-------|-------------|
  | `none` | 未新增驗證標頭 |
  | `api_key` | `X-API-Key: <auth_value>` |
  | `bearer_token` | `Authorization: Bearer <auth_value>` |
  | `basic` | `Authorization: Basic <auth_value>` |
  | `authorization` | `Authorization: <auth_value>`（逐字，無前綴） |
  | `token` | `Authorization: token <auth_value>`（GitHub 風格） |
  | `oauth2` | `Authorization: Bearer <resolved_token>` — PKCE 或 M2M `client_credentials`。請參閱 [MCP OAuth](./mcp_oauth.md) |
  | `oauth2_token_exchange` | `Authorization: Bearer <exchanged_token>` — RFC 8693 On-Behalf-Of。請參閱 [MCP OBO Auth](./mcp_obo_auth.md) |
  | `aws_sigv4` | 每次請求的 AWS SigV4 簽章。請參閱 [MCP AWS SigV4](./mcp_aws_sigv4.md) |

  注意：上方的標頭表格描述的是受管 SSE/HTTP 傳輸路徑。OpenAPI 工具路徑會對 `auth_type: api_key` 傳送 `Authorization: ApiKey <value>` 而不是 `X-API-Key`；已棄用的 `x-mcp-auth` broadcast 標頭也使用 `ApiKey` 形式。

- **額外標頭**：可選的額外標頭名稱清單，應從用戶端轉送至 MCP 伺服器
- **靜態標頭**：要包含於每次傳送至 MCP 伺服器請求中的可選標頭鍵/值配對對映。
- **規格版本**：可選的 MCP 規格版本（預設為 `2025-06-18`）

各種驗證類型的範例：

```yaml title="MCP auth examples (config.yaml)" showLineNumbers
mcp_servers:
  api_key_example:
    url: "https://my-mcp-server.com/mcp"
    auth_type: "api_key"
    auth_value: "abc123"        # headers={"X-API-Key": "abc123"}

  # NEW – OAuth 2.0 Client Credentials (v1.77.5)
  oauth2_example:
    url: "https://my-mcp-server.com/mcp"
    auth_type: "oauth2"         # 👈 KEY CHANGE
    authorization_url: "https://my-mcp-server.com/oauth/authorize" # optional override
    token_url: "https://my-mcp-server.com/oauth/token"             # optional override
    registration_url: "https://my-mcp-server.com/oauth/register"   # optional override
    client_id: os.environ/OAUTH_CLIENT_ID
    client_secret: os.environ/OAUTH_CLIENT_SECRET
    scopes: ["tool.read", "tool.write"] # optional override

  bearer_example:
    url: "https://my-mcp-server.com/mcp"
    auth_type: "bearer_token"
    auth_value: "abc123"        # headers={"Authorization": "Bearer abc123"}

  basic_example:
    url: "https://my-mcp-server.com/mcp"
    auth_type: "basic"
    auth_value: "dXNlcjpwYXNz"  # headers={"Authorization": "Basic dXNlcjpwYXNz"}

  custom_auth_example:
    url: "https://my-mcp-server.com/mcp"
    auth_type: "authorization"
    auth_value: "Token example123"  # headers={"Authorization": "Token example123"}

  # AWS SigV4 for Bedrock AgentCore MCP servers
  agentcore_mcp:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_role_name: os.environ/AWS_ROLE_ARN          # optional — IAM role to assume
    aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID  # optional — falls back to IAM role
    aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    aws_region_name: us-east-1
    aws_service_name: bedrock-agentcore

  # Example with extra headers forwarding
  github_mcp:
    url: "https://api.githubcopilot.com/mcp"
    auth_type: "bearer_token"
    auth_value: "ghp_example_token"
    extra_headers: ["custom_key", "x-custom-header"]  # These headers will be forwarded from client

  # Example with static headers
  my_mcp_server:
    url: "https://my-mcp-server.com/mcp"
    static_headers: # These headers will be requested to the MCP server
      X-API-Key: "abc123"
      X-Custom-Header: "some-value"
```

### MCP 逐步導覽 {#mcp-walkthroughs}

- **Strands (STDIO)** – [觀看教學](https://screen.studio/share/ruv4D73F)

> 從 UI 新增

```json title="strands-mcp" showLineNumbers
{
  "mcpServers": {
    "strands-agents": {
      "command": "uvx",
      "args": ["strands-agents-mcp-server"],
      "env": {
        "FASTMCP_LOG_LEVEL": "INFO"
      },
      "disabled": false,
      "autoApprove": ["search_docs", "fetch_doc"]
    }
  }
}
```

> config.yml

```yaml title="config.yml – strands MCP" showLineNumbers
mcp_servers:
  strands_mcp:
    transport: "stdio"
    command: "uvx"
    args: ["strands-agents-mcp-server"]
    env:
      FASTMCP_LOG_LEVEL: "INFO"
```


### MCP 別名 {#mcp-aliases}

您可以在 `litellm_settings` 區段中為您的 MCP 伺服器定義別名。這可讓您：

1. **將友善名稱對應至伺服器名稱**：使用較短、更容易記憶的別名
2. **覆寫伺服器別名**：如果某個伺服器未定義別名，系統會使用 `mcp_aliases` 中第一個符合的別名
3. **確保唯一性**：每個伺服器只會使用第一個別名，避免衝突

**範例：**
```yaml
litellm_settings:
  mcp_aliases:
    "github": "github_mcp_server"      # Maps "github" alias to "github_mcp_server"
    "zapier": "zapier_mcp_server"      # Maps "zapier" alias to "zapier_mcp_server"
    "docs": "deepwiki_mcp_server"      # Maps "docs" alias to "deepwiki_mcp_server"
    "github_alt": "github_mcp_server"  # This will be ignored since "github" already maps to this server
```

**優點：**
- **簡化工具存取**：使用 `github_create_issue` 取代 `github_mcp_server_create_issue`
- **一致的命名**：在您的組織中標準化別名模式
- **輕鬆遷移**：變更伺服器名稱而不破壞既有的工具參照

</TabItem>
</Tabs>

## 將 OpenAPI 規格轉換為 MCP 伺服器 {#converting-openapi-specs-to-mcp-servers}

LiteLLM 可以將 OpenAPI 規格轉換為 MCP 伺服器，將任何 REST API 以 MCP 工具形式暴露，而無需撰寫自訂伺服器程式碼。

請參閱 **[從 OpenAPI 規格產生 MCP 的指南](./mcp_openapi.md)** 以取得完整設定、使用範例，以及如何覆寫工具名稱與描述。

## MCP OAuth {#mcp-oauth}

LiteLLM 支援 MCP 伺服器的 OAuth 2.0——同時支援面向使用者用戶端的互動式（PKCE）流程，以及供後端服務使用的機器對機器（M2M）`client_credentials`。

請參閱 **[MCP OAuth 指南](./mcp_oauth.md)** 以取得設定說明、序列圖與測試伺服器。

<details>
<summary>詳細 OAuth 參考資料（按一下展開）</summary>

LiteLLM v 1.77.6 新增了對 MCP 伺服器 OAuth 2.0 Client Credentials 的支援。

您可以在 `config.yaml` 中設定，或直接從 LiteLLM UI（MCP Servers → Authentication → OAuth）進行設定。每個 `auth_type: oauth2` 伺服器都必須透過 `oauth2_flow` 宣告其流程：互動式瀏覽器登入使用 `authorization_code`（如下所示），而機器對機器權杖則使用 `client_credentials`。

```yaml
mcp_servers:
  github_mcp:
    url: "https://api.githubcopilot.com/mcp"
    auth_type: oauth2
    oauth2_flow: authorization_code
    client_id: os.environ/GITHUB_OAUTH_CLIENT_ID
    client_secret: os.environ/GITHUB_OAUTH_CLIENT_SECRET
```

[**請參閱 Claude Code 教學**](./tutorials/claude_responses_api#connecting-mcp-servers)

### 運作方式 {#how-it-works}

```mermaid
sequenceDiagram
    participant Browser as 使用者代理程式（瀏覽器）
    participant Client as 用戶端
    participant LiteLLM as LiteLLM Proxy
    participant MCP as MCP 伺服器（資源伺服器）
    participant Auth as 授權伺服器

    Note over Client,LiteLLM: 步驟 1 – 資源探索
    Client->>LiteLLM: GET /.well-known/oauth-protected-resource/{mcp_server_name}/mcp
    LiteLLM->>Client: 回傳資源中繼資料

    Note over Client,LiteLLM: 步驟 2 – 授權伺服器探索
    Client->>LiteLLM: GET /.well-known/oauth-authorization-server/{mcp_server_name}
    LiteLLM->>Client: 回傳授權伺服器中繼資料

    Note over Client,Auth: 步驟 3 – 動態用戶端註冊
    Client->>LiteLLM: POST /{mcp_server_name}/register
    LiteLLM->>Auth: 轉送註冊請求
    Auth->>LiteLLM: 發出用戶端憑證
    LiteLLM->>Client: 回傳用戶端憑證

    Note over Client,Browser: 步驟 4 – 使用者授權（PKCE）
    Client->>Browser: 開啟授權 URL + code_challenge + resource
    Browser->>Auth: 授權請求
    Note over Auth: 使用者授權
    Auth->>Browser: 以授權碼重新導向
    Browser->>LiteLLM: 透過 code 呼叫 LiteLLM 的回呼
    LiteLLM->>Browser: 以授權碼重新導向回傳
    Browser->>Client: 透過授權碼回呼

    Note over Client,Auth: 步驟 5 – 權杖交換
    Client->>LiteLLM: 權杖請求 + code_verifier + resource
    LiteLLM->>Auth: 轉送權杖請求
    Auth->>LiteLLM: 存取（以及重新整理）權杖
    LiteLLM->>Client: 回傳權杖

    Note over Client,MCP: 步驟 6 – 已驗證的 MCP 呼叫
    Client->>LiteLLM: 夾帶存取權杖 + LiteLLM API 金鑰的 MCP 請求
    LiteLLM->>MCP: 夾帶 Bearer 權杖的 MCP 請求
    MCP-->>LiteLLM: MCP 回應
    LiteLLM-->>Client: 回傳 MCP 回應
```

**參與者**

- **Client** – 具備 MCP 能力的 AI 代理程式（例如 Claude Code、Cursor，或其他 IDE/代理程式），代表使用者啟動 OAuth 探索、授權與工具呼叫。
- **LiteLLM Proxy** – 在保護已儲存憑證的同時，處理所有 OAuth 探索、註冊、權杖交換與 MCP 流量。
- **Authorization Server** – 透過動態用戶端註冊、PKCE 授權與權杖端點發行 OAuth 2.0 權杖。
- **MCP Server (Resource Server)** – 接收 LiteLLM 已驗證 JSON-RPC 請求的受保護 MCP 端點。
- **User-Agent (Browser)** – 暫時參與，以便最終使用者在授權步驟中授予同意。

**流程步驟**

1. **資源探索**：用戶端從 LiteLLM 的 `.well-known/oauth-protected-resource` 端點擷取 MCP 資源中繼資料，以了解權限範圍與能力。
2. **授權伺服器探索**：用戶端透過 LiteLLM 的 `.well-known/oauth-authorization-server` 端點取得 OAuth 伺服器中繼資料（權杖端點、授權端點、支援的 PKCE 方法）。
3. **動態用戶端註冊**：用戶端透過 LiteLLM 註冊，LiteLLM 再將請求轉送至授權伺服器（RFC 7591）。如果提供者不支援動態註冊，您可以在 LiteLLM 中預先儲存 `client_id`/`client_secret`（例如 GitHub MCP），流程會以相同方式進行。
4. **使用者授權**：用戶端啟動瀏覽器工作階段（含 code challenge 與 resource 提示）。使用者核准存取後，授權伺服器會經由 LiteLLM 將 code 傳回給用戶端。
5. **權杖交換**：用戶端以授權碼、code verifier 與 resource 呼叫 LiteLLM。LiteLLM 與授權伺服器交換這些資訊，並回傳所發出的存取/重新整理權杖。
6. **MCP 呼叫**：在持有有效權杖時，用戶端將 MCP JSON-RPC 請求（加上 LiteLLM API 金鑰）送至 LiteLLM，LiteLLM 再將其轉送至 MCP 伺服器並轉遞工具回應。

另請參閱官方 [MCP 授權流程](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization#authorization-flow-steps) 以取得更多參考資料。

</details>

## 將自訂標頭轉送至 MCP 伺服器 {#forwarding-custom-headers-to-mcp-servers}

LiteLLM 支援使用 `extra_headers` 設定參數，將額外的自訂標頭從 MCP 用戶端轉送至後端 MCP 伺服器。這可讓您傳遞 MCP 伺服器所需的自訂驗證權杖、API 金鑰或其他標頭。

**組態**

<Tabs>
<TabItem value="config" label="config.yaml">
在 MCP 伺服器組態中設定 `extra_headers`，以指定應轉送哪些標頭名稱：

```yaml title="config.yaml with extra_headers" showLineNumbers
mcp_servers:
  github_mcp:
    url: "https://api.githubcopilot.com/mcp"
    auth_type: "bearer_token"
    auth_value: "ghp_default_token"
    extra_headers: ["custom_key", "x-custom-header", "Authorization"]
    description: "GitHub MCP server with custom header forwarding"
```
</TabItem>
<TabItem value="clientside" label="在用戶端動態設定">

當您要讓使用者存取 [一組 MCP 伺服器](#grouping-mcps-access-groups) 時，請使用此方式。

**格式：** `x-mcp-{server_alias}-{header_name}: value`

這可讓您對不同的 MCP 伺服器使用不同的驗證方式。

**範例：**
- `x-mcp-github-authorization: Bearer ghp_xxxxxxxxx` - 使用 Bearer token 的 GitHub MCP server
- `x-mcp-zapier-x-api-key: sk-xxxxxxxxx` - 使用 API key 的 Zapier MCP server
- `x-mcp-deepwiki-authorization: Basic base64_encoded_creds` - 使用 Basic auth 的 DeepWiki MCP server

```python title="Python Client with Server-Specific Auth" showLineNumbers
from fastmcp import Client
import asyncio

# Standard MCP configuration with multiple servers
config = {
    "mcpServers": {
        "mcp_group": {
            "url": "http://localhost:4000/mcp/",
            "headers": {
                "x-mcp-servers": "dev_group", # assume this gives access to github, zapier and deepwiki
                "x-litellm-api-key": "Bearer sk-1234",
                "x-mcp-github-authorization": "Bearer gho_token", 
                "x-mcp-zapier-x-api-key": "sk-xxxxxxxxx",
                "x-mcp-deepwiki-authorization": "Basic base64_encoded_creds",
                "custom_key": "value"
            }
        }
    }
}

# Create a client that connects to all servers
client = Client(config)


async def main():
    async with client:
        tools = await client.list_tools()
        print(f"Available tools: {tools}")

        # call mcp 
        await client.call_tool(
            name="github_mcp-search_issues",
            arguments={'query': 'created:>2024-01-01', 'sort': 'created', 'order': 'desc', 'perPage': 30}
        )

if __name__ == "__main__":
    asyncio.run(main())

```


**優點：**
- **特定伺服器驗證**：每個 MCP server 可使用不同的驗證方法
- **更好的安全性**：不需要在所有 server 之間共享相同的驗證 token
- **彈性的標頭名稱**：支援不同的驗證標頭類型（authorization、x-api-key 等）
- **清楚的分離**：每個 server 的驗證都能明確識別

</TabItem>
</Tabs>

#### 用戶端使用 {#client-usage}

從 MCP 用戶端連線時，請加入與 `extra_headers` 設定相符的自訂標頭：

<Tabs>
<TabItem value="fastmcp" label="Python FastMCP">

```python title="FastMCP Client with Custom Headers" showLineNumbers
from fastmcp import Client
import asyncio

# MCP client configuration with custom headers
config = {
    "mcpServers": {
        "github": {
            "url": "http://localhost:4000/github_mcp/mcp",
            "headers": {
                "x-litellm-api-key": "Bearer sk-1234",
                "Authorization": "Bearer gho_token", 
                "custom_key": "custom_value",
                "x-custom-header": "additional_data"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {tools}")
        
        # Call a tool if available
        if tools:
            result = await client.call_tool(tools[0].name, {})
            print(f"Tool result: {result}")

# Run the client
asyncio.run(main())
```

</TabItem>

<TabItem value="cursor" label="Cursor IDE">

```json title="Cursor MCP Configuration with Custom Headers" showLineNumbers
{
  "mcpServers": {
    "GitHub": {
      "url": "http://localhost:4000/github_mcp/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY",
        "Authorization": "Bearer $GITHUB_TOKEN",
        "custom_key": "custom_value",
        "x-custom-header": "additional_data"
      }
    }
  }
}
```

</TabItem>

<TabItem value="http" label="HTTP Client">

```bash title="cURL with Custom Headers" showLineNumbers
curl --location 'http://localhost:4000/github_mcp/mcp' \
--header 'Content-Type: application/json' \
--header 'x-litellm-api-key: Bearer sk-1234' \
--header 'Authorization: Bearer gho_token' \
--header 'custom_key: custom_value' \
--header 'x-custom-header: additional_data' \
--data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
}'
```

</TabItem>
</Tabs>

#### 運作方式 {#how-it-works-1}

1. **設定**：在您的 MCP server 設定中定義 `extra_headers`，並填入您要轉送的標頭名稱
2. **用戶端標頭**：在您的 MCP 用戶端請求中包含對應的標頭
3. **標頭轉送**：LiteLLM 會自動將符合的標頭轉送到後端 MCP server
4. **驗證**：後端 MCP server 會同時接收已設定的驗證標頭與自訂標頭

### 將請求標頭傳遞到 STDIO 環境變數 {#passing-request-headers-to-stdio-env-vars}

如果您的 stdio MCP server 需要每次請求的憑證，您可以將用戶端請求中的 HTTP 標頭直接對應到啟動的 stdio 程序環境中。請使用 `${X-HEADER_NAME}` 語法在 env 值中引用標頭名稱。LiteLLM 會從傳入請求中讀取該標頭，並在啟動命令前設定 env var。

```json title="Forward X-GITHUB_PERSONAL_ACCESS_TOKEN header to stdio env" showLineNumbers
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${X-GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

在此範例中，當用戶端以 `X-GITHUB_PERSONAL_ACCESS_TOKEN` 標頭發出請求時，proxy 會將該值以 `GITHUB_PERSONAL_ACCESS_TOKEN` 環境變數的形式轉送到 stdio 程序。

## 控制最終使用者的 MCP 存取 {#control-mcp-access-for-end-users}

控制您的 AI 應用程式最終使用者可以存取哪些 MCP server（例如，內部聊天 UI 的使用者）。將客戶 ID 傳入 `x-litellm-end-user-id` 標頭，以便：
- 強制執行物件權限（限制可存取的 MCP server）
- 套用客戶專屬預算
- 追蹤每位客戶的支出

**FastMCP 用戶端範例：**

```python title="Track customer spend with x-litellm-end-user-id" showLineNumbers
from fastmcp import Client
import asyncio

# MCP client configuration with customer tracking
config = {
    "mcpServers": {
        "github": {
            "url": "http://localhost:4000/github_mcp/mcp",
            "headers": {
                "x-litellm-api-key": "Bearer sk-1234",
                "x-litellm-end-user-id": "customer_123",  # 👈 CUSTOMER ID
                "Authorization": "Bearer gho_token"
            }
        }
    }
}

client = Client(config)

async def main():
    async with client:
        # All MCP calls will be tracked under customer_123
        tools = await client.list_tools()
        result = await client.call_tool(tools[0].name, {})
        print(f"Tool result: {result}")

asyncio.run(main())
```

**Cursor IDE 範例：**

```json title="Cursor config with customer tracking" showLineNumbers
{
  "mcpServers": {
    "GitHub": {
      "url": "http://localhost:4000/github_mcp/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY",
        "x-litellm-end-user-id": "customer_123"
      }
    }
  }
}
```

**會發生什麼：**
- 會強制執行客戶專屬的物件權限（只能存取允許的 MCP server）
- 會套用客戶預算
- 所有工具呼叫都會以 `customer_123` 進行追蹤

[深入了解客戶管理 →](./proxy/customers)

## 呼叫 Proxy 的 /v1/responses 端點 {#calling-the-proxys-v1responses-endpoint}

當您呼叫 LiteLLM Proxy 的 `/v1/responses` 端點來使用 MCP 工具時，**一律請在 tools 陣列中使用 `server_url: "litellm_proxy"`**。這會告訴 proxy 使用其已設定的 MCP servers。

:::important 不要使用完整的 proxy URL
如果請求已經送到 proxy，使用 `server_url: "https://your-proxy.com/mcp"` 是不正確的。proxy 需要文字值 `litellm_proxy`，才能路由到其已設定的 MCP servers。
:::

```bash title="Correct: Using litellm_proxy" showLineNumbers
curl --location 'https://your-proxy.com/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
    "model": "gpt-4",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never"
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

### 將自訂標頭傳送到 MCP servers {#sending-custom-headers-to-mcp-servers}

若要將自訂標頭（例如 API 金鑰、驗證 token）傳遞給特定的 MCP server，請使用以下任一方式：

**選項 1：請求標頭** – 將 `x-mcp-{server_alias}-{header_name}` 加入您的請求標頭。proxy 會將這些標頭轉送到對應的 MCP server。

```bash
# Send Authorization header to the "weather2" MCP server
--header 'x-mcp-weather2-authorization: Bearer your-token'

# Send custom header to the "github" MCP server  
--header 'x-mcp-github-x-api-key: your-api-key'
```

**選項 2：tool config 中的標頭** – 在工具定義中包含 `headers` 物件。這些會與請求標頭合併。

```json
{
    "type": "mcp",
    "server_label": "litellm",
    "server_url": "litellm_proxy",
    "require_approval": "never",
    "headers": {
        "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
        "x-mcp-servers": "Zapier_MCP,dev-group",
        "x-mcp-weather2-authorization": "Bearer your-weather-api-token"
    }
}
```

## 使用具備用戶端端憑證的 MCP {#using-your-mcp-with-client-side-credentials}

如果您想將用戶端端的驗證 token 傳給 LiteLLM，再由 LiteLLM 傳給您的 MCP 進行驗證，就使用這個方式。

### 新的特定伺服器驗證標頭（建議） {#new-server-specific-auth-headers-recommended}

您可以使用格式為 `x-mcp-{server_alias}-{header_name}` 的特定伺服器標頭來指定 MCP 驗證 token。這可讓您對不同的 MCP server 使用不同的驗證方式。

**優點：**
- **特定伺服器驗證**：每個 MCP server 可使用不同的驗證方法
- **更好的安全性**：不需要在所有 server 之間共享相同的驗證 token
- **彈性的標頭名稱**：支援不同的驗證標頭類型（authorization、x-api-key 等）
- **清楚的分離**：每個 server 的驗證都能明確識別

### 舊版驗證標頭（已棄用） {#legacy-auth-header-deprecated}

您也可以使用 `x-mcp-auth` 標頭來指定 MCP 驗證 token。這會轉送到所有 MCP server，且已改以特定伺服器標頭為建議做法。

<Tabs>
<TabItem value="openai" label="OpenAI API">

#### 透過 OpenAI Responses API 以特定伺服器驗證連線 {#connect-via-openai-responses-api-with-server-specific-auth}

使用 OpenAI Responses API，並包含特定伺服器驗證標頭：

```bash title="cURL Example with Server-Specific Auth" showLineNumbers
curl --location 'https://api.openai.com/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-github-authorization": "Bearer YOUR_GITHUB_TOKEN",
                "x-mcp-zapier-x-api-key": "YOUR_ZAPIER_API_KEY"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

#### 透過 OpenAI Responses API 以舊版驗證連線 {#connect-via-openai-responses-api-with-legacy-auth}

使用 OpenAI Responses API，並為您的 MCP server 驗證包含 `x-mcp-auth` 標頭：

```bash title="cURL Example with Legacy MCP Auth" showLineNumbers
curl --location 'https://api.openai.com/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-auth": YOUR_MCP_AUTH_TOKEN
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

</TabItem>

<TabItem value="litellm" label="LiteLLM Proxy">

#### 透過 LiteLLM Proxy Responses API 以特定伺服器驗證連線 {#connect-via-litellm-proxy-responses-api-with-server-specific-auth}

當您呼叫 LiteLLM Proxy 以透過特定伺服器驗證對 `/v1/responses` 端點進行 LLM API 請求時，請使用此方式：

```bash title="cURL Example with Server-Specific Auth" showLineNumbers
curl --location '<your-litellm-proxy-base-url>/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-github-authorization": "Bearer YOUR_GITHUB_TOKEN",
                "x-mcp-zapier-x-api-key": "YOUR_ZAPIER_API_KEY"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

#### 透過 LiteLLM Proxy Responses API 以舊版驗證連線 {#connect-via-litellm-proxy-responses-api-with-legacy-auth}

當您呼叫 LiteLLM Proxy 以透過 MCP 驗證對 `/v1/responses` 端點進行 LLM API 請求時，請使用此方式：

```bash title="cURL Example with Legacy MCP Auth" showLineNumbers
curl --location '<your-litellm-proxy-base-url>/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-auth": "YOUR_MCP_AUTH_TOKEN"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

</TabItem>

<TabItem value="cursor" label="Cursor IDE">

#### 透過 Cursor IDE 以特定伺服器驗證連線 {#connect-via-cursor-ide-with-server-specific-auth}

直接從 Cursor IDE 搭配 LiteLLM MCP 使用工具，並包含特定伺服器驗證：

**設定說明：**

1. **開啟 Cursor 設定**：使用 `⇧+⌘+J`（Mac）或 `Ctrl+Shift+J`（Windows/Linux）
2. **前往 MCP Tools**：進入「MCP Tools」分頁並點擊「New MCP Server」
3. **新增設定**：複製並貼上以下 JSON 設定，然後使用 `Cmd+S` 或 `Ctrl+S` 儲存

```json title="Cursor MCP Configuration with Server-Specific Auth" showLineNumbers
{
  "mcpServers": {
    "LiteLLM": {
      "url": "litellm_proxy",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY",
        "x-mcp-github-authorization": "Bearer $GITHUB_TOKEN",
        "x-mcp-zapier-x-api-key": "$ZAPIER_API_KEY"
      }
    }
  }
}
```

#### 透過 Cursor IDE 以舊版驗證連線 {#connect-via-cursor-ide-with-legacy-auth}

直接從 Cursor IDE 搭配 LiteLLM MCP 使用工具，並包含您的 MCP 驗證 token：

**設定說明：**

1. **開啟 Cursor 設定**：使用 `⇧+⌘+J`（Mac）或 `Ctrl+Shift+J`（Windows/Linux）
2. **前往 MCP Tools**：進入「MCP Tools」分頁並點擊「New MCP Server」
3. **新增設定**：複製並貼上以下 JSON 設定，然後使用 `Cmd+S` 或 `Ctrl+S` 儲存

```json title="Cursor MCP Configuration with Legacy Auth" showLineNumbers
{
  "mcpServers": {
    "LiteLLM": {
      "url": "litellm_proxy",
      "headers": {
        "x-litellm-api-key": "Bearer $LITELLM_API_KEY",
        "x-mcp-auth": "$MCP_AUTH_TOKEN"
      }
    }
  }
}
```

</TabItem>

<TabItem value="http" label="Streamable HTTP">

#### 透過 Streamable HTTP Transport 以特定伺服器驗證連線 {#connect-via-streamable-http-transport-with-server-specific-auth}

使用 HTTP transport 連線到 LiteLLM MCP，並採用特定伺服器驗證：

**Server URL：**
```text showLineNumbers
litellm_proxy
```

**標頭：**
```text showLineNumbers
x-litellm-api-key: Bearer YOUR_LITELLM_API_KEY
x-mcp-github-authorization: Bearer YOUR_GITHUB_TOKEN
x-mcp-zapier-x-api-key: YOUR_ZAPIER_API_KEY
```

#### 透過 Streamable HTTP Transport 以舊版驗證連線 {#connect-via-streamable-http-transport-with-legacy-auth}

使用 HTTP transport 連線到 LiteLLM MCP，並採用 MCP 驗證：

**Server URL：**
```text showLineNumbers
litellm_proxy
```

**標頭：**
```text showLineNumbers
x-litellm-api-key: Bearer YOUR_LITELLM_API_KEY
x-mcp-auth: Bearer YOUR_MCP_AUTH_TOKEN
```

此 URL 可與任何支援 HTTP transport 的 MCP 用戶端搭配使用。`x-mcp-auth` 標頭會被轉送到您的 MCP server 進行驗證。

</TabItem>

<TabItem value="fastmcp" label="Python FastMCP">

#### 透過 Python FastMCP 用戶端以特定伺服器驗證連線 {#connect-via-python-fastmcp-client-with-server-specific-auth}

使用 Python FastMCP 用戶端連線到您的 LiteLLM MCP server，並採用特定伺服器驗證：

```python title="Python FastMCP Example with Server-Specific Auth" showLineNumbers
import asyncio
import json

from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport

# Create the transport with your LiteLLM MCP server URL and server-specific auth headers
server_url = "litellm_proxy"
transport = StreamableHttpTransport(
    server_url,
    headers={
        "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
        "x-mcp-github-authorization": "Bearer YOUR_GITHUB_TOKEN",
        "x-mcp-zapier-x-api-key": "YOUR_ZAPIER_API_KEY"
    }
)

# Initialize the client with the transport
client = Client(transport=transport)


async def main():
    # Connection is established here
    print("Connecting to LiteLLM MCP server with server-specific authentication...")
    async with client:
        print(f"Client connected: {client.is_connected()}")

        # Make MCP calls within the context
        print("Fetching available tools...")
        tools = await client.list_tools()

        print(f"Available tools: {json.dumps([t.name for t in tools], indent=2)}")
        
        # Example: Call a tool (replace 'tool_name' with an actual tool name)
        if tools:
            tool_name = tools[0].name
            print(f"Calling tool: {tool_name}")
            
            # Call the tool with appropriate arguments
            result = await client.call_tool(tool_name, arguments={})
            print(f"Tool result: {result}")


# Run the example
if __name__ == "__main__":
    asyncio.run(main())
```

#### 透過 Python FastMCP 用戶端以舊版驗證連線 {#connect-via-python-fastmcp-client-with-legacy-auth}

使用 Python FastMCP 用戶端連線到您的 LiteLLM MCP server，並採用 MCP 驗證：

```python title="Python FastMCP Example with Legacy MCP Auth" showLineNumbers
import asyncio
import json

from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport

# Create the transport with your LiteLLM MCP server URL and auth headers
server_url = "litellm_proxy"
transport = StreamableHttpTransport(
    server_url,
    headers={
        "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
        "x-mcp-auth": "Bearer YOUR_MCP_AUTH_TOKEN"
    }
)

# Initialize the client with the transport
client = Client(transport=transport)


async def main():
    # Connection is established here
    print("Connecting to LiteLLM MCP server with authentication...")
    async with client:
        print(f"Client connected: {client.is_connected()}")

        # Make MCP calls within the context
        print("Fetching available tools...")
        tools = await client.list_tools()

        print(f"Available tools: {json.dumps([t.name for t in tools], indent=2)}")
        
        # Example: Call a tool (replace 'tool_name' with an actual tool name)
        if tools:
            tool_name = tools[0].name
            print(f"Calling tool: {tool_name}")
            
            # Call the tool with appropriate arguments
            result = await client.call_tool(tool_name, arguments={})
            print(f"Tool result: {result}")


# Run the example
if __name__ == "__main__":
    asyncio.run(main())
```

</TabItem>
</Tabs>

### 自訂 MCP 驗證標頭名稱 {#customize-the-mcp-auth-header-name}

預設情況下，LiteLLM 會使用 `x-mcp-auth` 將您的憑證傳遞給 MCP server。您可以透過以下方式之一變更此標頭名稱：
1. 設定 `LITELLM_MCP_CLIENT_SIDE_AUTH_HEADER_NAME` 環境變數

```bash title="Environment Variable" showLineNumbers
export LITELLM_MCP_CLIENT_SIDE_AUTH_HEADER_NAME="authorization"
```


2. 在 config.yaml 檔案的一般設定中設定 `mcp_client_side_auth_header_name`

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-xxxxxxx

general_settings:
  mcp_client_side_auth_header_name: "authorization"
```

#### 使用授權標頭 {#using-the-authorization-header}

在此範例中，`authorization` 標頭將會傳遞給 MCP 伺服器進行驗證。

```bash title="cURL with authorization header" showLineNumbers
curl --location '<your-litellm-proxy-base-url>/v1/responses' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
    "model": "gpt-4o",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "authorization": "Bearer sk-zapier-token-123"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'
```

## 使用 MCP 工具搭配 `/chat/completions` {#use-mcp-tools-with-chatcompletions}

:::tip 適用於所有提供者
此流程是**與提供者無關**的：相同的 MCP 工具定義可適用於 LiteLLM 後方的_每一個_ LLM 後端（OpenAI、Azure OpenAI、Anthropic、Amazon Bedrock、Vertex、自架部署等）。
:::

LiteLLM Proxy 也支援在傳統的 `/v1/chat/completions` 端點上使用感知 MCP 的工具。直接在 `tools` 陣列中提供 MCP 工具定義，LiteLLM 就會擷取並將 MCP 伺服器的工具轉換為與 OpenAI 相容的函式呼叫。當 `require_approval` 設為 `"never"` 時，proxy 會自動執行回傳的工具呼叫，並在回傳助理回應前將結果回饋給模型。

```bash title="Chat Completions with MCP Tools" showLineNumbers
curl --location '<your-litellm-proxy-base-url>/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $LITELLM_API_KEY" \
--data '{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Summarize the latest open PR."}
  ],
  "tools": [
    {
      "type": "mcp",
      "server_url": "litellm_proxy/github/mcp",
      "server_label": "github_mcp",
      "require_approval": "never"
    }
  ]
}'
```

如果您省略 `require_approval`，或將其設為任何非 `"never"` 的值，MCP 工具呼叫就會回傳給用戶端，讓您可以手動檢閱並執行它們，這與上游 OpenAI 行為一致。

## LiteLLM Proxy - MCP Gateway 導覽 {#litellm-proxy---walk-through-mcp-gateway}
LiteLLM 提供 MCP Gateway，讓管理員可將所有 MCP 伺服器加入 LiteLLM。搭配 MCP 使用 LiteLLM Proxy 的主要優點如下：

1. 為所有 MCP 工具使用固定端點
2. 依金鑰、團隊或使用者進行 MCP 權限管理

這段影片示範如何將 MCP 伺服器上線到 LiteLLM Proxy、使用它，以及設定存取控制。

<iframe width="840" height="500" src="https://www.loom.com/embed/f7aa8d217879430987f3e64291757bfc" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## LiteLLM Python SDK MCP 橋接 {#litellm-python-sdk-mcp-bridge}

LiteLLM Python SDK 可作為 MCP 橋接，讓所有 LiteLLM 支援的模型都能使用 MCP 工具。LiteLLM 提供以下使用 MCP 的功能

- **列出** 可用的 MCP 工具：OpenAI 用戶端可以檢視所有可用的 MCP 工具
  - `litellm.experimental_mcp_client.load_mcp_tools` 以列出所有可用的 MCP 工具
- **呼叫** MCP 工具：OpenAI 用戶端可以呼叫 MCP 工具
  - `litellm.experimental_mcp_client.call_openai_tool` 以在 MCP 伺服器上呼叫 OpenAI 工具

### 1. 列出可用的 MCP 工具 {#1-list-available-mcp-tools}

在此範例中，我們將使用 `litellm.experimental_mcp_client.load_mcp_tools` 來列出任何 MCP 伺服器上的所有可用 MCP 工具。這個方法可用兩種方式：

- `format="mcp"` - （預設）回傳 MCP 工具
  - 回傳：`mcp.types.Tool`
- `format="openai"` - 將 MCP 工具回傳為與 OpenAI API 相容的工具。可用於 OpenAI 端點。
  - 回傳：`openai.types.chat.ChatCompletionToolParam`

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python title="MCP Client List Tools" showLineNumbers
# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os
import litellm
from litellm import experimental_mcp_client


server_params = StdioServerParameters(
    command="python3",
    # Make sure to update to the full absolute path to your mcp_server.py file
    args=["./mcp_server.py"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize the connection
        await session.initialize()

        # Get tools
        tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")
        print("MCP TOOLS: ", tools)

        messages = [{"role": "user", "content": "what's (3 + 5)"}]
        llm_response = await litellm.acompletion(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            messages=messages,
            tools=tools,
        )
        print("LLM RESPONSE: ", json.dumps(llm_response, indent=4, default=str))
```

</TabItem>

<TabItem value="openai" label="OpenAI SDK + LiteLLM Proxy">

在此範例中，我們將逐步說明如何使用指向 LiteLLM proxy 的 OpenAI SDK 來呼叫 MCP 工具。這裡的關鍵差異是我們使用 OpenAI SDK 來發出 LLM API 請求

```python title="MCP Client List Tools" showLineNumbers
# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os
from openai import OpenAI
from litellm import experimental_mcp_client

server_params = StdioServerParameters(
    command="python3",
    # Make sure to update to the full absolute path to your mcp_server.py file
    args=["./mcp_server.py"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize the connection
        await session.initialize()

        # Get tools using litellm mcp client
        tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")
        print("MCP TOOLS: ", tools)

        # Use OpenAI SDK pointed to LiteLLM proxy
        client = OpenAI(
            api_key="your-api-key",  # Your LiteLLM proxy API key
            base_url="http://localhost:4000"  # Your LiteLLM proxy URL
        )

        messages = [{"role": "user", "content": "what's (3 + 5)"}]
        llm_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools
        )
        print("LLM RESPONSE: ", llm_response)
```
</TabItem>
</Tabs>

### 2. 列出並呼叫 MCP 工具 {#2-list-and-call-mcp-tools}

在此範例中，我們將使用 
- `litellm.experimental_mcp_client.load_mcp_tools` 來列出任何 MCP 伺服器上的所有可用 MCP 工具
- `litellm.experimental_mcp_client.call_openai_tool` 來在 MCP 伺服器上呼叫 OpenAI 工具

第一個 llm 回應會回傳 OpenAI 工具清單。我們從 LLM 回應中取出第一個工具呼叫，並將其傳遞給 `litellm.experimental_mcp_client.call_openai_tool`，以在 MCP 伺服器上呼叫該工具。

#### `litellm.experimental_mcp_client.call_openai_tool` 的運作方式 {#how-litellmexperimental_mcp_clientcall_openai_tool-works}

- 接受來自 LLM 回應的 OpenAI 工具呼叫
- 將 OpenAI 工具呼叫轉換為 MCP 工具
- 在 MCP 伺服器上呼叫 MCP 工具
- 回傳 MCP 工具呼叫的結果

<Tabs>
<TabItem value="sdk" label="LiteLLM Python SDK">

```python title="MCP Client List and Call Tools" showLineNumbers
# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os
import litellm
from litellm import experimental_mcp_client


server_params = StdioServerParameters(
    command="python3",
    # Make sure to update to the full absolute path to your mcp_server.py file
    args=["./mcp_server.py"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize the connection
        await session.initialize()

        # Get tools
        tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")
        print("MCP TOOLS: ", tools)

        messages = [{"role": "user", "content": "what's (3 + 5)"}]
        llm_response = await litellm.acompletion(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            messages=messages,
            tools=tools,
        )
        print("LLM RESPONSE: ", json.dumps(llm_response, indent=4, default=str))

        openai_tool = llm_response["choices"][0]["message"]["tool_calls"][0]
        # Call the tool using MCP client
        call_result = await experimental_mcp_client.call_openai_tool(
            session=session,
            openai_tool=openai_tool,
        )
        print("MCP TOOL CALL RESULT: ", call_result)

        # send the tool result to the LLM
        messages.append(llm_response["choices"][0]["message"])
        messages.append(
            {
                "role": "tool",
                "content": str(call_result.content[0].text),
                "tool_call_id": openai_tool["id"],
            }
        )
        print("final messages with tool result: ", messages)
        llm_response = await litellm.acompletion(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            messages=messages,
            tools=tools,
        )
        print(
            "FINAL LLM RESPONSE: ", json.dumps(llm_response, indent=4, default=str)
        )
```

</TabItem>
<TabItem value="proxy" label="OpenAI SDK + LiteLLM Proxy">

在此範例中，我們將逐步說明如何使用指向 LiteLLM proxy 的 OpenAI SDK 來呼叫 MCP 工具。這裡的關鍵差異是我們使用 OpenAI SDK 來發出 LLM API 請求

```python title="MCP Client with OpenAI SDK" showLineNumbers
# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os
from openai import OpenAI
from litellm import experimental_mcp_client

server_params = StdioServerParameters(
    command="python3",
    # Make sure to update to the full absolute path to your mcp_server.py file
    args=["./mcp_server.py"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize the connection
        await session.initialize()

        # Get tools using litellm mcp client
        tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")
        print("MCP TOOLS: ", tools)

        # Use OpenAI SDK pointed to LiteLLM proxy
        client = OpenAI(
            api_key="your-api-key",  # Your LiteLLM proxy API key
            base_url="http://localhost:8000"  # Your LiteLLM proxy URL
        )

        messages = [{"role": "user", "content": "what's (3 + 5)"}]
        llm_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools
        )
        print("LLM RESPONSE: ", llm_response)

        # Get the first tool call
        tool_call = llm_response.choices[0].message.tool_calls[0]
        
        # Call the tool using MCP client
        call_result = await experimental_mcp_client.call_openai_tool(
            session=session,
            openai_tool=tool_call.model_dump(),
        )
        print("MCP TOOL CALL RESULT: ", call_result)

        # Send the tool result back to the LLM
        messages.append(llm_response.choices[0].message.model_dump())
        messages.append({
            "role": "tool",
            "content": str(call_result.content[0].text),
            "tool_call_id": tool_call.id,
        })

        final_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools
        )
        print("FINAL RESPONSE: ", final_response)
```

</TabItem>
</Tabs>

## 常見問題 {#faq}

**問：如何在 LiteLLM 後方的 MCP 伺服器上使用 OAuth2 client_credentials（機器對機器）？**

LiteLLM 支援對 `client_credentials` 授權類型進行自動權杖管理。在您的 MCP 伺服器上設定 `client_id`、`client_secret` 和 `token_url`，LiteLLM 就會自動擷取、快取並更新權杖。設定說明請參閱 [MCP OAuth M2M 指南](./mcp_oauth.md#machine-to-machine-m2m-auth)。

**問：我從 LiteLLM UI 擷取 OAuth 權杖時，它儲存在哪裡？**

UI 只會在 `sessionStorage` 中保留暫時狀態，以便 OAuth 重新導向流程可以完成；權杖不會持久化儲存在伺服器或資料庫中。

**問：我看到 MCP 連線錯誤——我應該檢查什麼？**

請逐步參考 [MCP 疑難排解指南](./mcp_troubleshoot.md) 進行隔離（Client → LiteLLM 與 LiteLLM → MCP）、記錄範例，以及使用 MCP Inspector 和 `curl` 等驗證方法。
