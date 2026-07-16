import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# MCP - AWS SigV4 驗證 {#mcp---aws-sigv4-auth}

使用 AWS SigV4 驗證將 LiteLLM 連線到託管於 [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html) 的 MCP 伺服器。

## 為什麼選用 SigV4？ {#why-sigv4}

AWS 服務會使用 [Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html) 驗證請求——這是一種逐請求簽署協定，會將請求本文納入加密簽章中。這與靜態標頭驗證類型（`api_key`、`bearer_token` 等）本質上不同，後者會在每個請求中傳送相同的標頭。

LiteLLM 的 `aws_sigv4` 驗證類型會自動處理這件事：每個送出的 MCP 請求在傳送前都會使用您的 AWS 憑證進行簽署。

## 快速入門 {#quick-start}

<Tabs>
<TabItem value="ui" label="LiteLLM UI">

1. 前往 **MCP Servers** 並點擊 **Add New MCP Server**
2. 將傳輸設定為 **Streamable HTTP**
3. 選取 **AWS SigV4** 作為驗證類型
4. 填入您的 AWS 憑證：

<Image
  img={require('../img/mcp_aws_sigv4_ui.png')}
  style={{width: '80%', display: 'block', margin: '0'}}
/>

<br/>

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| **AWS Region** | 是 | 用於 SigV4 簽署的 AWS 區域（例如，`us-east-1`） |
| **AWS Service Name** | 否 | 預設為 `bedrock-agentcore` |
| **AWS Access Key ID** | 否 | 若留白，會回退至 boto3 憑證鏈 |
| **AWS Secret Access Key** | 否 | 如果提供了 Access Key ID，則為必填 |
| **AWS Session Token** | 否 | 僅在暫時性 STS 憑證時需要 |
| **AWS Role ARN** | 否 | 用於 STS AssumeRole 的 IAM role ARN（例如，`arn:aws:iam::123456789012:role/MyRole`）。如果設定，LiteLLM 會在簽署前先 assume 此角色 |
| **AWS Session Name** | 否 | AssumeRole 呼叫的 session 名稱——會顯示在 CloudTrail 中。若省略則自動產生 |

建立後，LiteLLM 會使用 SigV4 對每個送出的 MCP 請求進行簽署。伺服器的工具會自動顯示在 MCP Tools 清單中。

**編輯憑證：** 編輯既有的 SigV4 伺服器時，請將憑證欄位留空以保留目前值。只有您填入的欄位會被更新。

</TabItem>
<TabItem value="config" label="config.yaml">

### 1. 設定 AWS 憑證 {#1-set-aws-credentials}

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION_NAME="us-east-1"
```

### 2. 將您的 AgentCore MCP 伺服器加入 config.yaml {#2-add-your-agentcore-mcp-server-to-configyaml}

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

mcp_servers:
  my_agentcore_mcp:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_role_name: os.environ/AWS_ROLE_ARN          # IAM role to assume (recommended)
    aws_session_name: "litellm-prod"                 # optional — for CloudTrail auditing
    aws_region_name: "us-east-1"
    aws_service_name: "bedrock-agentcore"
```

:::info URL 編碼

AgentCore runtime ARN 必須在 `url` 欄位中進行 URL 編碼。範例：

```
arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/my-mcp-server
```

會變成：

```
arn%3Aaws%3Abedrock-agentcore%3Aus-east-1%3A123456789012%3Aruntime%2Fmy-mcp-server
```

:::

### 3. 啟動 proxy {#3-start-the-proxy}

```bash
litellm --config config.yaml
```

</TabItem>
</Tabs>

## 使用 MCP 工具 {#use-the-mcp-tools}

設定完成後，您的 AgentCore MCP 工具會像任何其他 MCP 伺服器一樣透過 LiteLLM 提供：

```bash title="List available tools"
curl http://localhost:4000/mcp-rest/tools/list \
  -H "Authorization: Bearer sk-1234"
```

```bash title="Call a tool"
curl http://localhost:4000/mcp-rest/tools/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "server_id": "my_agentcore_mcp",
    "name": "my_agentcore_mcp-your_tool_name",
    "arguments": {"key": "value"}
  }'
```

請參閱 [MCP REST API](./mcp_rest_api.md) 以了解工具命名、`server_id` 格式，以及常見錯誤。

## 設定參考 {#config-reference}

| 欄位 | 必填 | 說明 |
|-------|----------|-------------|
| `url` | 是 | AgentCore MCP 伺服器 URL（含 URL 編碼的 ARN） |
| `transport` | 是 | 必須為 `"http"` |
| `auth_type` | 是 | 必須為 `"aws_sigv4"` |
| `aws_access_key_id` | 否 | AWS access key。支援 `os.environ/VAR_NAME`。若省略則回退至 boto3 憑證鏈 |
| `aws_secret_access_key` | 否 | AWS secret key。支援 `os.environ/VAR_NAME`。若省略則回退至 boto3 憑證鏈 |
| `aws_region_name` | 是 | AWS 區域（例如，`us-east-1`） |
| `aws_service_name` | 否 | 用於簽署的 AWS 服務名稱。預設為 `bedrock-agentcore` |
| `aws_session_token` | 否 | 用於暫時性憑證的 AWS session token。支援 `os.environ/VAR_NAME` |
| `aws_role_name` | 否 | STS AssumeRole 的 IAM role ARN。支援 `os.environ/VAR_NAME`。設定後，LiteLLM 會先呼叫 `sts:AssumeRole` 取得暫時性憑證，再進行簽署 |
| `aws_session_name` | 否 | AssumeRole 呼叫的 session 名稱（會顯示在 CloudTrail 中）。若省略則自動產生。支援 `os.environ/VAR_NAME` |

## 運作方式 {#how-it-works}

LiteLLM 使用一個 `httpx.Auth` 子類別（`MCPSigV4Auth`），並掛接到 HTTP 請求生命週期：

1. 對於每個送出的 MCP 請求，驗證處理器會計算請求本文的 SHA-256 雜湊值
2. 它會使用您的 AWS 憑證、請求 URL、標頭和本文雜湊值建立 SigV4 簽章
3. 已簽署的 `Authorization` 和 `x-amz-date` 標頭會加入請求中
4. AWS 驗證簽章並處理 MCP 請求

這一切都會透明地發生——不需要手動管理 token。

## 使用暫時性憑證（STS） {#using-temporary-credentials-sts}

如果您使用 AWS STS 暫時性憑證（例如來自 IAM role 或 SSO），請包含 session token：

```yaml title="config.yaml with STS credentials" showLineNumbers
mcp_servers:
  my_agentcore_mcp:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
    aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    aws_session_token: os.environ/AWS_SESSION_TOKEN
    aws_region_name: "us-east-1"
    aws_service_name: "bedrock-agentcore"
```

## 使用 IAM role 假設（AssumeRole） {#using-iam-role-assumption-assumerole}

對於 LiteLLM 執行個體透過 IAM role 進行驗證的正式環境（例如 EKS pod role、EC2 instance profile），您可以設定 `aws_role_name`，讓 LiteLLM 在簽署 MCP 請求前先呼叫 `sts:AssumeRole`：

```yaml title="config.yaml with AssumeRole" showLineNumbers
mcp_servers:
  my_agentcore_mcp:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_role_name: "arn:aws:iam::123456789012:role/BedrockAgentCoreRole"
    aws_session_name: "litellm-prod"    # optional
    aws_region_name: "us-east-1"
    aws_service_name: "bedrock-agentcore"
```

LiteLLM 會使用環境中的憑證（pod role、instance profile，或 env vars）呼叫 `sts:AssumeRole`，然後使用被假設角色的暫時性憑證簽署 MCP 請求。

您也可以將 `aws_role_name` 與明確的 access key 結合使用——此時這些金鑰會作為 AssumeRole 呼叫的來源身分：

```yaml title="config.yaml with AssumeRole + explicit source keys" showLineNumbers
mcp_servers:
  my_agentcore_mcp:
    url: "https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/<url-encoded-ARN>/invocations"
    transport: "http"
    auth_type: "aws_sigv4"
    aws_role_name: os.environ/AWS_ROLE_ARN
    aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
    aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
    aws_region_name: "us-east-1"
```

:::tip
對於大多數 Kubernetes 部署，您只需要 `aws_role_name` 和 `aws_region_name`——pod 的 IAM role 會自動提供來源憑證。
:::

## 疑難排解 {#troubleshooting}

### AWS 回傳 403 Forbidden {#403-forbidden-from-aws}

- 確認您的 AWS 憑證有效且未過期
- 檢查 `aws_region_name` 是否與 AgentCore URL 中的區域相符
- 確認 `aws_service_name` 已設定為 `bedrock-agentcore`
- 如果使用 STS 憑證，請確認 `aws_session_token` 已設定且未過期

### AssumeRole 存取遭拒 {#assumerole-accessdenied}

如果在使用 `aws_role_name` 時收到 `AccessDenied`：

- 確認 role ARN 正確
- 檢查目標 role 上的信任政策是否允許您的來源身分 assume 它
- 如果在 EKS 上執行，請確認 pod 的 service account 已使用正確的 IAM role 註解
- 檢查 CloudTrail 中失敗的 `sts:AssumeRole` 呼叫，以查看確切錯誤

### 啟動時的健康檢查錯誤 {#health-check-errors-on-startup}

已使用 SigV4 驗證的 MCP 伺服器會在 proxy 啟動時略過標準健康檢查。這是預期行為——當工具被呼叫時，proxy 仍會正確簽署請求。

### 「botocore not found」錯誤 {#botocore-not-found-error}

安裝 `botocore` 套件：

```bash
uv add botocore
```

`botocore` 會用於 SigV4 憑證處理，且在使用 `aws_sigv4` 驗證時為必要套件。
