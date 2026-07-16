import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Azure Anthropic（透過 Azure Foundry 使用 Claude） {#azure-anthropic-claude-via-azure-foundry}

LiteLLM 支援透過 Microsoft Azure Foundry 部署的 Claude 模型，包括 Claude Sonnet 4.5、Claude Haiku 4.5 和 Claude Opus 4.1。

## 可用模型 {#available-models}

Azure Foundry 支援以下 Claude 模型：

- `claude-sonnet-4-5` - Anthropic 最強大的模型，適合建立真實世界代理程式並處理複雜、長期的任務
- `claude-haiku-4-5` - 兼具接近前沿的效能、合適的速度與成本，適用於高流量使用情境
- `claude-opus-4-1` - 程式碼撰寫領域的業界領導者，能在長時間執行的任務中提供持續效能

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | 透過 Microsoft Azure Foundry 部署的 Claude 模型。使用與 Anthropic Messages API 相同的 API，但採用 Azure 驗證。 |
| LiteLLM 上的提供者路由 | `azure_ai/`（將此前綴加到 Claude 模型名稱前方 - 例如 `azure_ai/claude-sonnet-4-5`） |
| 提供者文件 | [Azure Foundry Claude Models ↗](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-claude) |
| API 端點 | `https://<resource-name>.services.ai.azure.com/anthropic/v1/messages` |
| 支援的端點 | `/chat/completions`, `/anthropic/v1/messages`|

## 主要功能 {#key-features}

- **延伸思考**：針對複雜任務提供增強的推理能力
- **圖片與文字輸入**：強大的視覺能力，可分析圖表、技術圖解與報告
- **程式碼生成**：進階思考搭配程式碼生成、分析與除錯（Claude Sonnet 4.5 與 Claude Opus 4.1）
- **與 Anthropic 相同的 API**：所有請求/回應轉換都與主要 Anthropic 提供者完全相同

## 驗證 {#authentication}

Azure Anthropic 支援兩種驗證方式：

1. **API Key**：使用 `api-key` 標頭
2. **Azure AD Token**：使用 `Authorization: Bearer <token>` 標頭（Microsoft Entra ID）

## API 金鑰與設定 {#api-keys-and-configuration}

```python
import os

# Option 1: API Key authentication
os.environ["AZURE_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_API_BASE"] = "https://<resource-name>.services.ai.azure.com/anthropic"

# Option 2: Azure AD Token authentication
os.environ["AZURE_AD_TOKEN"] = "your-azure-ad-token"
os.environ["AZURE_API_BASE"] = "https://<resource-name>.services.ai.azure.com/anthropic"

# Optional: Azure AD Token Provider (for automatic token refresh)
os.environ["AZURE_TENANT_ID"] = "your-tenant-id"
os.environ["AZURE_CLIENT_ID"] = "your-client-id"
os.environ["AZURE_CLIENT_SECRET"] = "your-client-secret"
os.environ["AZURE_SCOPE"] = "https://cognitiveservices.azure.com/.default"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 基本完成 {#basic-completion}

```python
from litellm import completion

# Set environment variables
os.environ["AZURE_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_API_BASE"] = "https://<resource-name>.services.ai.azure.com/anthropic"

# Make a completion request
response = completion(
    model="azure_ai/claude-sonnet-4-5",
    messages=[
        {"role": "user", "content": "What are 3 things to visit in Seattle?"}
    ],
    max_tokens=1000,
    temperature=0.7,
)

print(response)
```

### 使用 API Key 參數完成 {#completion-with-api-key-parameter}

```python
import litellm

response = litellm.completion(
    model="azure_ai/claude-sonnet-4-5",
    api_base="https://<resource-name>.services.ai.azure.com/anthropic",
    api_key="your-azure-api-key",
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    max_tokens=1000,
)
```

### 使用 Azure AD Token 完成 {#completion-with-azure-ad-token}

```python
import litellm

response = litellm.completion(
    model="azure_ai/claude-sonnet-4-5",
    api_base="https://<resource-name>.services.ai.azure.com/anthropic",
    azure_ad_token="your-azure-ad-token",
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    max_tokens=1000,
)
```

### 串流 {#streaming}

```python
from litellm import completion

response = completion(
    model="azure_ai/claude-sonnet-4-5",
    messages=[
        {"role": "user", "content": "Write a short story"}
    ],
    stream=True,
    max_tokens=1000,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### 工具呼叫 {#tool-calling}

```python
from litellm import completion

response = completion(
    model="azure_ai/claude-sonnet-4-5",
    messages=[
        {"role": "user", "content": "What's the weather in Seattle?"}
    ],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather in a given location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g. San Francisco, CA"
                        }
                    },
                    "required": ["location"]
                }
            }
        }
    ],
    tool_choice="auto",
    max_tokens=1000,
)

print(response)
```

## 使用方式 - LiteLLM Proxy Server {#usage---litellm-proxy-server}

### 1. 將金鑰儲存在您的環境中 {#1-save-key-in-your-environment}

```bash
export AZURE_API_KEY="your-azure-api-key"
export AZURE_API_BASE="https://<resource-name>.services.ai.azure.com/anthropic"
```

### 2. 設定 proxy {#2-configure-the-proxy}

```yaml
model_list:
  - model_name: claude-sonnet-4-5
    litellm_params:
      model: azure_ai/claude-sonnet-4-5
      api_base: https://<resource-name>.services.ai.azure.com/anthropic
      api_key: os.environ/AZURE_API_KEY
```

### 3. 測試 {#3-test-it}

<Tabs>
<TabItem value="curl" label="curl">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "claude-sonnet-4-5",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ],
    "max_tokens": 1000
}'
```

</TabItem>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="anything",
    base_url="http://0.0.0.0:4000"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    max_tokens=1000
)

print(response)
```

</TabItem>
</Tabs>

## Messages API {#messages-api}

Azure Anthropic 也支援原生 Anthropic Messages API。端點結構與 Anthropic 的 `/v1/messages` API 相同。

### 使用 Anthropic SDK {#using-anthropic-sdk}

```python
from anthropic import Anthropic

client = Anthropic(
    api_key="your-azure-api-key",
    base_url="https://<resource-name>.services.ai.azure.com/anthropic"
)

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1000,
    messages=[
        {"role": "user", "content": "Hello, world"}
    ]
)

print(response)
```

### 使用 LiteLLM Proxy {#using-litellm-proxy}

```bash
curl --request POST \
  --url http://0.0.0.0:4000/anthropic/v1/messages \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --header "Authorization: bearer sk-anything" \
  --data '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
        {"role": "user", "content": "Hello, world"}
    ]
}'
```

## 支援的 OpenAI 參數 {#supported-openai-parameters}

Azure Anthropic 支援與主要 Anthropic 提供者相同的參數：

```
"stream",
"stop",
"temperature",
"top_p",
"max_tokens",
"max_completion_tokens",
"tools",
"tool_choice",
"extra_headers",
"parallel_tool_calls",
"response_format",
"user",
"thinking",
"reasoning_effort"
```

:::info

Azure Anthropic API 需要傳入 `max_tokens`。當未提供 `max_tokens` 時，LiteLLM 會自動傳入 `max_tokens=4096`。

:::

## 與標準 Anthropic 提供者的差異 {#differences-from-standard-anthropic-provider}

Azure Anthropic 與標準 Anthropic 提供者之間唯一的差異是驗證：

- **標準 Anthropic**：使用 `x-api-key` 標頭
- **Azure Anthropic**：使用 `api-key` 標頭，或使用 `Authorization: Bearer <token>` 進行 Azure AD 驗證

其他所有請求/回應轉換、工具呼叫、串流與功能支援都相同。

## API Base URL 格式 {#api-base-url-format}

API base URL 應遵循以下格式：

```
https://<resource-name>.services.ai.azure.com/anthropic
```

若 URL 中尚未包含，LiteLLM 會自動附加 `/v1/messages`。

## 範例：完整設定 {#example-full-configuration}

```python
import os
from litellm import completion

# Configure Azure Anthropic
os.environ["AZURE_API_KEY"] = "your-azure-api-key"
os.environ["AZURE_API_BASE"] = "https://my-resource.services.ai.azure.com/anthropic"

# Make a request
response = completion(
    model="azure_ai/claude-sonnet-4-5",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    max_tokens=1000,
    temperature=0.7,
    stream=False,
)

print(response.choices[0].message.content)
```

## 疑難排解 {#troubleshooting}

### 缺少 API Base 錯誤 {#missing-api-base-error}

如果您看到關於缺少 API base 的錯誤，請確認您已設定：

```python
os.environ["AZURE_API_BASE"] = "https://<resource-name>.services.ai.azure.com/anthropic"
```

或者直接傳入：

```python
response = completion(
    model="azure_ai/claude-sonnet-4-5",
    api_base="https://<resource-name>.services.ai.azure.com/anthropic",
    # ...
)
```

### 驗證錯誤 {#authentication-errors}

- **API Key**：請確認已設定 `AZURE_API_KEY`，或作為 `api_key` 參數傳入
- **Azure AD Token**：請確認已設定 `AZURE_AD_TOKEN`，或作為 `azure_ad_token` 參數傳入
- **Token Provider**：若要自動重新整理 token，請設定 `AZURE_TENANT_ID`、`AZURE_CLIENT_ID` 和 `AZURE_CLIENT_SECRET`

## 相關文件 {#related-documentation}

- [Anthropic 提供者文件](../anthropic.md) - 用於標準 Anthropic API 用法
- [Azure OpenAI 文件](./azure.md) - 用於 Azure OpenAI 模型
- [Azure 驗證指南](../../secret_managers/azure_key_vault.md) - 用於 Azure AD token 設定
