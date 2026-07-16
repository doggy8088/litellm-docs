import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure AI Foundry 代理程式 {#azure-ai-foundry-agents}

以 OpenAI Request/Response 格式呼叫 Azure AI Foundry 代理程式。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Azure AI Foundry Agents 提供代管的代理程式執行階段，可使用基礎模型、工具與程式碼解譯器執行 agentic 工作流程。 |
| LiteLLM 上的提供者路由 | `azure_ai/agents/{AGENT_ID}` |
| 提供者文件 | [Azure AI Foundry Agents ↗](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/quickstart) |

## 驗證 {#authentication}

Azure AI Foundry Agents 需要 **Azure AD 驗證**（不是 API 金鑰）。您可以使用以下方式進行驗證：

### 選項 1：服務主體（建議用於正式環境） {#option-1-service-principal-recommended-for-production}

設定以下環境變數：

```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

LiteLLM 會自動使用這些憑證取得 Azure AD 權杖。

### 選項 2：Azure AD 權杖（手動） {#option-2-azure-ad-token-manual}

透過 `api_key` 直接傳入權杖：

```bash
# Get token via Azure CLI
az account get-access-token --resource "https://ai.azure.com" --query accessToken -o tsv
```

### 所需的 Azure 角色 {#required-azure-role}

您的服務主體或使用者必須在 Azure AI Foundry 專案上具備 **Azure AI Developer** 或 **Azure AI User** 角色。

使用 Azure CLI 指派：
```bash
az role assignment create \
  --assignee-object-id "<service-principal-object-id>" \
  --assignee-principal-type "ServicePrincipal" \
  --role "Azure AI Developer" \
  --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<resource>"
```

或者透過 **Azure AI Foundry 入口網站** → 您的專案 → **Project users** → **+ New user** 新增。

## 快速入門 {#quick-start}

### LiteLLM 的模型格式 {#model-format-to-litellm}

若要透過 LiteLLM 呼叫 Azure AI Foundry Agent，請使用以下模型格式。

這裡的 `model=azure_ai/agents/` 會告訴 LiteLLM 呼叫 Azure AI Foundry Agent Service API。

```shell showLineNumbers title="Model Format to LiteLLM"
azure_ai/agents/{AGENT_ID}
```

**範例：**
- `azure_ai/agents/asst_abc123`

您可以在 Azure AI Foundry 入口網站的 Agents 下找到 Agent ID。

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic Agent Completion"
import litellm

# Make a completion request to your Azure AI Foundry Agent
# Uses AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET env vars for auth
response = litellm.completion(
    model="azure_ai/agents/asst_abc123",
    messages=[
        {
            "role": "user", 
            "content": "Explain machine learning in simple terms"
        }
    ],
    api_base="https://your-resource.services.ai.azure.com/api/projects/your-project",
)

print(response.choices[0].message.content)
print(f"Usage: {response.usage}")
```

```python showLineNumbers title="Streaming Agent Responses"
import litellm

# Stream responses from your Azure AI Foundry Agent
response = await litellm.acompletion(
    model="azure_ai/agents/asst_abc123",
    messages=[
        {
            "role": "user",
            "content": "What are the key principles of software architecture?"
        }
    ],
    api_base="https://your-resource.services.ai.azure.com/api/projects/your-project",
    stream=True,
)

async for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### LiteLLM Proxy {#litellm-proxy}

#### 1. 在 config.yaml 中設定您的模型 {#1-configure-your-model-in-configyaml}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml showLineNumbers title="LiteLLM Proxy Configuration"
model_list:
  - model_name: azure-agent-1
    litellm_params:
      model: azure_ai/agents/asst_abc123
      api_base: https://your-resource.services.ai.azure.com/api/projects/your-project
      # Service Principal auth (recommended)
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      client_secret: os.environ/AZURE_CLIENT_SECRET

  - model_name: azure-agent-math-tutor
    litellm_params:
      model: azure_ai/agents/asst_def456
      api_base: https://your-resource.services.ai.azure.com/api/projects/your-project
      # Or pass Azure AD token directly
      api_key: os.environ/AZURE_AD_TOKEN
```

</TabItem>
</Tabs>

#### 2. 啟動 LiteLLM Proxy {#2-start-the-litellm-proxy}

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml
```

#### 3. 向您的 Azure AI Foundry Agents 發出請求 {#3-make-requests-to-your-azure-ai-foundry-agents}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Basic Agent Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "azure-agent-1",
    "messages": [
      {
        "role": "user", 
        "content": "Summarize the main benefits of cloud computing"
      }
    ]
  }'
```

```bash showLineNumbers title="Streaming Agent Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "azure-agent-math-tutor",
    "messages": [
      {
        "role": "user",
        "content": "What is 25 * 4?"
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

# Make a completion request to your Azure AI Foundry Agent
response = client.chat.completions.create(
    model="azure-agent-1",
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

# Stream Agent responses
stream = client.chat.completions.create(
    model="azure-agent-math-tutor",
    messages=[
      {
        "role": "user",
        "content": "Explain the Pythagorean theorem"
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

## 環境變數 {#environment-variables}

| 變數 | 說明 |
|----------|-------------|
| `AZURE_TENANT_ID` | 用於 Service Principal 驗證的 Azure AD 租戶 ID |
| `AZURE_CLIENT_ID` | 您的 Service Principal 的應用程式（client）ID |
| `AZURE_CLIENT_SECRET` | 您的 Service Principal 的 client secret |

```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

## 對話延續（Thread 管理） {#conversation-continuity-thread-management}

Azure AI Foundry Agents 使用 threads 來維持對話內容。LiteLLM 會自動為您管理 threads，但您也可以傳入現有的 thread ID 以延續對話。

```python showLineNumbers title="Continuing a Conversation"
import litellm

# First message creates a new thread
response1 = await litellm.acompletion(
    model="azure_ai/agents/asst_abc123",
    messages=[{"role": "user", "content": "My name is Alice"}],
    api_base="https://your-resource.services.ai.azure.com/api/projects/your-project",
)

# Get the thread_id from the response
thread_id = response1._hidden_params.get("thread_id")

# Continue the conversation using the same thread
response2 = await litellm.acompletion(
    model="azure_ai/agents/asst_abc123",
    messages=[{"role": "user", "content": "What's my name?"}],
    api_base="https://your-resource.services.ai.azure.com/api/projects/your-project",
    thread_id=thread_id,  # Pass the thread_id to continue conversation
)

print(response2.choices[0].message.content)  # Should mention "Alice"
```

## 提供者特定參數 {#provider-specific-parameters}

Azure AI Foundry Agents 支援可傳入的額外參數，以自訂代理程式呼叫。

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Using Agent-specific parameters"
from litellm import completion

response = litellm.completion(
    model="azure_ai/agents/asst_abc123",
    messages=[
        {
            "role": "user",
            "content": "Analyze this data and provide insights",
        }
    ],
    api_base="https://your-resource.services.ai.azure.com/api/projects/your-project",
    thread_id="thread_abc123",  # Optional: Continue existing conversation
    instructions="Be concise and focus on key insights",  # Optional: Override agent instructions
)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml showLineNumbers title="LiteLLM Proxy Configuration with Parameters"
model_list:
  - model_name: azure-agent-analyst
    litellm_params:
      model: azure_ai/agents/asst_abc123
      api_base: https://your-resource.services.ai.azure.com/api/projects/your-project
      tenant_id: os.environ/AZURE_TENANT_ID
      client_id: os.environ/AZURE_CLIENT_ID
      client_secret: os.environ/AZURE_CLIENT_SECRET
      instructions: "Be concise and focus on key insights"
```

</TabItem>
</Tabs>

### 可用參數 {#available-parameters}

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `thread_id` | string | 可選的 thread ID，用於延續現有對話 |
| `instructions` | string | 可選的指示，用於覆寫此執行的代理程式預設指示 |

## LiteLLM A2A 閘道 {#litellm-a2a-gateway}

您也可以透過 LiteLLM 的 A2A（Agent-to-Agent）閘道 UI 連接到 Azure AI Foundry Agents。這提供了一種不需撰寫程式碼即可註冊與測試代理程式的視覺化方式。

### 1. 前往 Agents {#1-navigate-to-agents}

在側邊欄中，點擊 "Agents" 開啟代理程式管理頁面，然後點擊 "+ Add New Agent"。

![新增代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/f8efe335-a08a-4f2b-9f7f-de28e4d58b05/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=217,118)

### 2. 選取 Azure AI Foundry 代理程式類型 {#2-select-azure-ai-foundry-agent-type}

點擊 "A2A Standard" 查看可用的代理程式類型，然後選取 "Azure AI Foundry"。

![選取 A2A Standard](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/ede38044-3e18-43b9-afe3-b7513bf9963e/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=409,143)

![選取 Azure AI Foundry](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/33c396fc-a927-4b03-8ee2-ea04950b12c1/ascreenshot.jpeg?tl_px=0,86&br_px=2201,1317&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=433,277)

### 3. 設定代理程式 {#3-configure-the-agent}

填入以下欄位：

#### 代理程式名稱 {#agent-name}

輸入一個容易辨識的代理程式名稱 - 呼叫端將會看到此名稱作為可用的代理程式。

![輸入代理程式名稱](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/18c02804-7612-40c4-9ba4-3f1a4c0725d5/ascreenshot.jpeg?tl_px=0,0&br_px=2617,1463&force_format=jpeg&q=100&width=1120.0)

#### 代理程式 ID {#agent-id}

從您的 Azure AI Foundry 入口網站取得 Agent ID：

1. 前往 [https://ai.azure.com/](https://ai.azure.com/) 並點擊 "Agents"

![Azure 代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/5e29fc48-c0f7-4b6d-8313-2063d1240d15/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=39,187)

2. 複製您要新增的代理程式的 "ID"（例如，`asst_hbnoK9BOCcHhC3lC4MDroVGG`）

![複製 Agent ID](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/bf17dfec-a627-41c6-9121-3935e86d3700/ascreenshot.jpeg?tl_px=0,0&br_px=2618,1463&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=504,241)

3. 將 Agent ID 貼到 LiteLLM 中 - 這會告訴 LiteLLM 要在 Azure Foundry 上呼叫哪個代理程式

![貼上 Agent ID](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/45230c28-54f6-441c-9a20-4ef8b74076e2/ascreenshot.jpeg?tl_px=0,97&br_px=2617,1560&force_format=jpeg&q=100&width=1120.0)

#### Azure AI API 基底 {#azure-ai-api-base}

從 Azure AI Foundry 取得您的 API base URL：

1. 前往 [https://ai.azure.com/](https://ai.azure.com/) 並點擊 "Overview"
2. 在 libraries 下方選取 Microsoft Foundry
3. 取得您的 endpoint - 應該會像 `https://<domain>.services.ai.azure.com/api/projects/<project-name>`

![取得 API Base](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/60e2c735-4480-44b7-ab12-d69f4200b12c/ascreenshot.jpeg?tl_px=0,40&br_px=2618,1503&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=278,277)

4. 將 URL 貼到 LiteLLM 中

![貼上 API Base](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/e9c6f48e-7602-449a-9261-0df4a0a66876/ascreenshot.jpeg?tl_px=267,456&br_px=2468,1687&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=524,277)

#### 驗證 {#authentication-1}

新增用於驗證的 Azure AD 憑證：
- **Azure 租戶 ID**
- **Azure 用戶端 ID** 
- **Azure 用戶端密鑰**

![新增驗證](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/e5e2b636-cf2e-4283-a1cc-8d497d349243/ascreenshot.jpeg?tl_px=0,653&br_px=2201,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=339,405)

點擊 "Create Agent" 以儲存。

![建立代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/799a720a-639e-4217-a6f5-51687fc07611/ascreenshot.jpeg?tl_px=416,653&br_px=2618,1883&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=693,519)

### 4. 在 Playground 中測試 {#4-test-in-playground}

前往側邊欄中的 "Playground" 測試您的代理程式。

![前往 Playground](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/7da84247-db1c-4d55-9015-6e3d60ea63ce/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=63,106)

將端點類型更改為 `/v1/a2a/message/send`。

![選取 A2A 端點](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/733265a8-412d-4eac-bc19-03436d7846c4/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=286,234)

### 5. 選取您的代理程式並傳送訊息 {#5-select-your-agent-and-send-a-message}

從下拉選單中選取您的 Azure AI Foundry 代理程式並傳送測試訊息。

![選取代理程式](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/59a8e66e-6f82-42e3-ab48-78355464e6be/ascreenshot.jpeg?tl_px=0,28&br_px=2201,1259&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=269,277)

該代理程式會以其能力作為回應。現在您可以透過 A2A 協定與您的 Azure AI Foundry 代理程式互動。

![代理程式回應](https://ajeuwbhvhr.cloudimg.io/https://colony-recorder.s3.amazonaws.com/files/2025-12-14/a0aafb69-6c28-4977-8210-96f9de750cdf/ascreenshot.jpeg?tl_px=0,0&br_px=2201,1230&force_format=jpeg&q=100&width=1120.0&wat=1&wat_opacity=0.7&wat_gravity=northwest&wat_url=https://colony-recorder.s3.us-west-1.amazonaws.com/images/watermarks/FB923C_standard.png&wat_pad=487,272)

## 延伸閱讀 {#further-reading}

- [Azure AI Foundry Agents 文件](https://learn.microsoft.com/en-us/azure/ai-services/agents/)
- [Create Thread and Run API Reference](https://learn.microsoft.com/en-us/rest/api/aifoundry/aiagents/create-thread-and-run/create-thread-and-run)
- [A2A Agent Gateway](../a2a.md)
- [A2A Cost Tracking](../a2a_cost_tracking.md)
