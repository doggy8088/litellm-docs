import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock AgentCore {#bedrock-agentcore}

以 OpenAI 的請求/回應格式呼叫 Bedrock AgentCore。

| 屬性 | 詳細資訊 |
|----------|---------|
| 描述 | Amazon Bedrock AgentCore 提供對受託管 agent runtime 的直接存取，可使用 foundation models 執行 agentic workflows。 |
| LiteLLM 上的提供者路由 | `bedrock/agentcore/{AGENT_RUNTIME_ARN}` |
| 提供者文件 | [AWS Bedrock AgentCore ↗](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agentcore_InvokeAgentRuntime.html) |

:::info

此文件適用於 **AgentCore Agents**（agent runtimes）。如果您想將 AgentCore MCP servers 與 LiteLLM 一起使用，請參閱 [MCP AWS SigV4 Auth](https://docs.litellm.ai/docs/mcp_aws_sigv4) 指南以取得設定說明。

:::

## 快速開始 {#quick-start}

### 模型格式到 LiteLLM {#model-format-to-litellm}

若要透過 LiteLLM 呼叫 bedrock agent runtime，請使用以下模型格式。

此處的 `model=bedrock/agentcore/` 會告訴 LiteLLM 呼叫 bedrock `InvokeAgentRuntime` API。

```shell showLineNumbers title="Model Format to LiteLLM"
bedrock/agentcore/{AGENT_RUNTIME_ARN}
```

**範例：**
- `bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime`

您可以在 AWS Bedrock 主控台的 AgentCore 下找到 Agent Runtime ARN。

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic AgentCore Completion"
import litellm

# Make a completion request to your AgentCore runtime
response = litellm.completion(
    model="bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime",
    messages=[
        {
            "role": "user", 
            "content": "Explain machine learning in simple terms"
        }
    ],
)

print(response.choices[0].message.content)
print(f"Usage: {response.usage}")
```

```python showLineNumbers title="Streaming AgentCore Responses"
import litellm

# Stream responses from your AgentCore runtime
response = litellm.completion(
    model="bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime",
    messages=[
        {
            "role": "user",
            "content": "What are the key principles of software architecture?"
        }
    ],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 在 config.yaml 中設定您的模型 {#1-configure-your-model-in-configyaml}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml showLineNumbers title="LiteLLM Proxy Configuration"
model_list:
  - model_name: agentcore-runtime-1
    litellm_params:
      model: bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2

  - model_name: agentcore-runtime-2
    litellm_params:
      model: bedrock/agentcore/arn:aws:bedrock-agentcore:us-east-1:987654321098:runtime/production-runtime
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-east-1
```

</TabItem>
</Tabs>

#### 2. 啟動 LiteLLM Proxy {#2-start-the-litellm-proxy}

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

#### 3. 向您的 AgentCore runtimes 發出請求 {#3-make-requests-to-your-agentcore-runtimes}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Basic AgentCore Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "agentcore-runtime-1",
    "messages": [
      {
        "role": "user", 
        "content": "Summarize the main benefits of cloud computing"
      }
    ]
  }'
```

```bash showLineNumbers title="Streaming AgentCore Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "agentcore-runtime-2",
    "messages": [
      {
        "role": "user",
        "content": "Explain the differences between SQL and NoSQL databases"
      }
    ],
    "stream": true
  }'
```

</TabItem>

<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python showLineNumbers title="Using OpenAI SDK with LiteLLM Proxy"
from openai import OpenAI

# Initialize client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

# Make a completion request to your AgentCore runtime
response = client.chat.completions.create(
    model="agentcore-runtime-1",
    messages=[
      {
        "role": "user",
        "content": "What are best practices for API design?"
      }
    ]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Streaming with OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000", 
    api_key="your-litellm-api-key"
)

# Stream AgentCore responses
stream = client.chat.completions.create(
    model="agentcore-runtime-2",
    messages=[
      {
        "role": "user",
        "content": "Describe the microservices architecture pattern"
      }
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>
</Tabs>

## 提供者專屬參數 {#provider-specific-parameters}

AgentCore 支援可傳入的額外參數，用於自訂 runtime 呼叫。

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Using AgentCore-specific parameters"
from litellm import completion

response = litellm.completion(
    model="bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime",
    messages=[
        {
            "role": "user",
            "content": "Analyze this data and provide insights",
        }
    ],
    qualifier="production",  # PROVIDER-SPECIFIC: Runtime qualifier/version
    runtimeSessionId="session-abc-123",  # PROVIDER-SPECIFIC: Custom session ID
)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml showLineNumbers title="LiteLLM Proxy Configuration with Parameters"
model_list:
  - model_name: agentcore-runtime-prod
    litellm_params:
      model: bedrock/agentcore/arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/my-agent-runtime
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
      qualifier: production
```

</TabItem>
</Tabs>

### 可用參數 {#available-parameters}

| 參數 | 型別 | 說明 |
|-----------|------|-------------|
| `qualifier` | string | 選用的 runtime qualifier/version，用於呼叫 agent runtime 的特定版本 |
| `runtimeSessionId` | string | 選用的自訂 session ID（必須為 33 個字元以上）。如果未提供，LiteLLM 會自動產生一個 |

## LiteLLM A2A Gateway {#litellm-a2a-gateway}

將 Bedrock AgentCore runtime 以一等 A2A agent 的形式註冊到 LiteLLM [Agent Gateway](../a2a) 上。這會提供每個 agent 的 RBAC、存取群組、trace-ID 強制執行，以及 `x-a2a-{agent_name_or_id}-{header}` per-user passthrough 慣例——與其他任何 A2A 提供者的介面相同。

此路徑與上方的 chat-completions 呼叫不同。請依據您的用戶端選擇其一：

| 您要透過... 呼叫 AgentCore | 使用此路徑 |
|---|---|
| `/v1/chat/completions` 搭配 `model: bedrock/agentcore/<ARN>` | Chat completions（上方已涵蓋） |
| `POST /a2a/{agent_id}` 搭配 A2A JSON-RPC 2.0（`message/send` 或 `message/stream`） | A2A Gateway（本節） |

### 1. 註冊 agent {#1-register-the-agent}

<Tabs>
<TabItem value="ui" label="UI">

1. 前往 **Agents** → **Add Agent**。
2. 將 **Bedrock AgentCore** 選為提供者。
3. 將 AgentCore Runtime ARN 貼為 agent URL。
4. 設定 AWS credentials（或留空以使用 proxy 的 ambient credential chain——請參閱下方的 [Authentication](#a2a-gateway-authentication)）。

</TabItem>
<TabItem value="api" label="REST API">

```bash showLineNumbers
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "my-agentcore-runtime",
    "agent_card_params": {
      "name": "my-agentcore-runtime",
      "description": "Internal research agent",
      "url": "bedrock/agentcore/arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/my-runtime"
    },
    "litellm_params": {
      "custom_llm_provider": "bedrock",
      "aws_role_name": "arn:aws:iam::123456789012:role/LiteLLMAgentCoreInvoker",
      "aws_region_name": "us-east-1"
    }
  }'
```

</TabItem>
</Tabs>

### 2. 透過 A2A 呼叫 {#2-invoke-via-a2a}

```bash showLineNumbers
curl -X POST http://localhost:4000/a2a/my-agentcore-runtime/message/send \
  -H "x-litellm-api-key: Bearer sk-client-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "Summarize the latest clinical trial results"}],
        "messageId": "msg-1"
      }
    }
  }'
```

### 驗證 {#a2a-gateway-authentication}

AgentCore A2A 路徑支援**兩種不同的對外驗證模式**，會根據 `litellm_params` 中的內容自動選擇：

| 模式 | 觸發時機 | 傳送給 AgentCore 的內容 |
|---|---|---|
| **Bearer / JWT** | 已設定 `litellm_params.api_key`（任何值） | `Authorization: Bearer <api_key>`——完全略過 SigV4 |
| **SigV4** | 未設定 `litellm_params.api_key` | 使用完整 AWS credential chain（如下）進行每次請求的 SigV4 簽章 |

#### SigV4 憑證解析 {#sigv4-credential-resolution}

當 SigV4 模式啟用時，憑證會依下列優先順序解析：

1. **`aws_web_identity_token` + `aws_role_name` + `aws_session_name`** → `sts:AssumeRoleWithWebIdentity`。跨帳戶 IRSA 路徑。
2. **僅 `aws_role_name`** → `sts:AssumeRole`。proxy 的 ambient credentials（instance profile、IRSA、環境變數）為來源身分。若省略，session name 會自動產生。
3. **`aws_profile_name`** → 透過 boto3 profile loader（`~/.aws/credentials`）解析。
4. **`aws_access_key_id` + `aws_secret_access_key` + `aws_session_token`** → 明確的暫時性憑證。
5. **`aws_access_key_id` + `aws_secret_access_key` + `aws_region_name`** → 明確的長期憑證。三者都必須設定；若沒有 `aws_region_name`，此分支會被略過。
6. **未設定任何憑證** → boto3 預設鏈（環境變數、透過 `AWS_WEB_IDENTITY_TOKEN_FILE` + `AWS_ROLE_ARN` 的 IRSA、instance metadata）。

`litellm_params` 上可辨識的 SigV4 欄位：

| 欄位 | 說明 |
|---|---|
| `aws_role_name` | 要透過 STS assume 的 IAM role ARN |
| `aws_session_name` | AssumeRole 呼叫的 session name（若省略則自動產生） |
| `aws_external_id` | 傳遞給 `sts:AssumeRole` 的 ExternalId，用於跨帳戶信任政策 |
| `aws_web_identity_token` | 供 `AssumeRoleWithWebIdentity` 使用的 OIDC token（可明確設定或透過 `AWS_WEB_IDENTITY_TOKEN_FILE` env 設定） |
| `aws_profile_name` | AWS CLI profile name |
| `aws_sts_endpoint` | 自訂 STS endpoint（VPC endpoints、FIPS endpoints） |
| `aws_access_key_id` / `aws_secret_access_key` / `aws_session_token` | 明確的憑證 |
| `aws_region_name` | AWS region。若省略，會從 `agent_card_params.url` 中的 runtime ARN 偵測。 |

#### EKS 上的 IRSA {#irsa-on-eks}

對於使用 [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) 的 Kubernetes 部署，不需要明確的憑證設定——boto3 的預設鏈會自動從 pod 環境中取得 `AWS_WEB_IDENTITY_TOKEN_FILE` 和 `AWS_ROLE_ARN`。

如果您希望呼叫時再 assume **第二個** role（例如：將 pod 的身分與 agent 呼叫身分分開，以利 CloudTrail 歸因），請將 IRSA 與 `aws_role_name` 結合使用：

```bash showLineNumbers
curl -X POST http://localhost:4000/v1/agents \
  -H "Authorization: Bearer sk-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "production-runtime",
    "agent_card_params": {
      "name": "production-runtime",
      "url": "bedrock/agentcore/arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/prod"
    },
    "litellm_params": {
      "custom_llm_provider": "bedrock",
      "aws_role_name": "arn:aws:iam::123456789012:role/AgentCoreInvocationRole",
      "aws_session_name": "litellm-prod"
    }
  }'
```

proxy pod 的 IRSA role 會作為 AssumeRole 呼叫的來源身分；assumed role 的 CloudTrail 項目會反映 agent 呼叫。

### 每位使用者的標頭透傳 {#per-user-header-passthrough}

標準的 A2A 標頭轉送機制同樣適用——完整參考請見 [A2A Agent Authentication Headers](../a2a_agent_headers)。這三種方法都可與 AgentCore 搭配使用：

- **`static_headers`** — 一律傳送至 AgentCore（例如自訂 `X-Tenant-Id`）
- **`extra_headers`** — 由管理員設定的允許轉送 client headers 清單
- **`x-a2a-{agent_name_or_id}-{header}` 慣例** — 不需管理設定、由呼叫端驅動的轉送

請注意，`litellm_params` 所處理的 SigV4 / Bearer auth 與上方的 agent-level 標頭轉送是**分開**的。auth headers 會由 AWS signer 逐次請求計算；使用者透傳標頭則會在簽章後併入請求。

### RBAC 與 trace IDs {#rbac-and-trace-ids}

所有標準 A2A 控制項都適用：
- **每個 agent 的 RBAC** — [Agent Permission Management](../a2a_agent_permissions)。當呼叫的 key/team 未獲授權使用該 AgentCore agent 時，會回傳 HTTP 403。
- **存取群組** — 在 LiteLLM 儀表板中為 agent 加上一個或多個存取群組，然後透過 `object_permission.agent_access_groups` 將該群組授予 team 或 key。請參閱 [Agent Access Groups](../a2a_agent_permissions#agent-access-groups)。
- **Trace ID 強制執行** — 在 `litellm_params` 上設定 `require_trace_id_on_calls_to_agent: true`，以要求每次進入的呼叫都必須有 `x-litellm-trace-id`。請參閱 [A2A Overview — Trace ID enforcement](../a2a#trace-id-enforcement-optional-per-agent)。

## 延伸閱讀 {#further-reading}

- [AWS Bedrock AgentCore 文件](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agentcore_InvokeAgentRuntime.html)
- [LiteLLM 驗證至 Bedrock](https://docs.litellm.ai/docs/providers/bedrock#boto3---authentication)
- [LiteLLM A2A 閘道總覽](../a2a)
- [A2A 代理程式驗證標頭](../a2a_agent_headers)
- [A2A 代理程式權限管理](../a2a_agent_permissions)
- [MCP AWS SigV4](../mcp_aws_sigv4) — 用於 AgentCore 主機代管的 MCP 伺服器路徑（與代理程式執行階段路徑分開）
