# Bedrock（boto3）SDK {#bedrock-boto3-sdk}

Bedrock 的透傳端點 - 直接呼叫提供者特定端點，使用原生格式（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 適用於 `/invoke` 和 `/converse` 端點 |
| 負載平衡 | ✅ | 您可以在多個部署之間對 `/invoke`、`/converse` 路由進行負載平衡| 記錄 | ✅ | 可在所有整合中運作 |
| 終端使用者追蹤 | ❌ | [如果您需要，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ✅ | |

只要將 `https://bedrock-runtime.{aws_region_name}.amazonaws.com` 直接替換為 `LITELLM_PROXY_BASE_URL/bedrock` 🚀

## 總覽 {#overview}

LiteLLM 支援兩種呼叫 Bedrock 端點的方式：

### 1. **使用 config.yaml**（建議用於模型端點） {#1-using-configyaml-recommended-for-model-endpoints}

在 `config.yaml` 中定義您的 Bedrock 模型，並以名稱參照它們。Proxy 會處理驗證與路由。

**適用於**：`/converse`、`/converse-stream`、`/invoke`、`/invoke-with-response-stream`

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
```

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-bedrock-model/converse' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"messages": [{"role": "user", "content": [{"text": "Hello"}]}]}'
```

### 2. **直接透傳**（適用於非模型端點） {#2-direct-passthrough-for-non-model-endpoints}

透過環境變數設定 AWS 憑證，並直接呼叫 Bedrock 端點。

**適用於**：Guardrails、Knowledge Bases、Agents，以及其他非模型端點

```bash showLineNumbers
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_REGION_NAME="us-west-2"
```

```bash showLineNumbers
curl "http://0.0.0.0:4000/bedrock/guardrail/my-guardrail-id/version/1/apply" \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{"contents": [{"text": {"text": "Hello"}}], "source": "INPUT"}'
```

支援 **所有** Bedrock 端點（包含串流）。

[**查看所有 Bedrock 端點**](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

## 快速開始 {#quick-start}

讓我們呼叫 Bedrock [`/converse` 端點](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

1. 建立一個含有您的 Bedrock 模型的 `config.yaml` 檔案

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
```

設定您的 AWS 憑證：

```bash showLineNumbers
export AWS_ACCESS_KEY_ID=""  # Access key
export AWS_SECRET_ACCESS_KEY="" # Secret access key
```

2. 啟動 LiteLLM Proxy 

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

3. 測試它！ 

讓我們使用 config 中的模型名稱呼叫 Bedrock converse 端點：

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-bedrock-model/converse' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": [{"text": "Hello, how are you?"}]
        }
    ],
    "inferenceConfig": {
        "maxTokens": 100
    }
}'
```

## 使用 config.yaml 設定 {#setup-with-configyaml}

使用 config.yaml 定義 Bedrock 模型，並透過透傳端點使用它們。

### 1. 在 config.yaml 中定義模型 {#1-define-models-in-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: my-claude-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
  
  - model_name: my-cohere-model
    litellm_params:
      model: bedrock/cohere.command-r-v1:0
      aws_region_name: us-east-1
      custom_llm_provider: bedrock
```

### 2. 使用設定啟動 proxy {#2-start-proxy-with-config}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 呼叫 Bedrock Converse 端點 {#3-call-bedrock-converse-endpoint}

在 URL 路徑中使用 config 中的 `model_name`：

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-claude-model/converse' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": [{"text": "Hello, how are you?"}]
        }
    ],
    "inferenceConfig": {
        "temperature": 0.5,
        "maxTokens": 100
    }
}'
```

### 4. 呼叫 Bedrock Converse Stream 端點 {#4-call-bedrock-converse-stream-endpoint}

對於串流回應，請使用 `/converse-stream` 端點：

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-claude-model/converse-stream' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
        {
            "role": "user",
            "content": [{"text": "Tell me a short story"}]
        }
    ],
    "inferenceConfig": {
        "temperature": 0.7,
        "maxTokens": 200
    }
}'
```

### 使用 config.yaml 支援的 Bedrock 端點 {#supported-bedrock-endpoints-with-configyaml}

使用 config.yaml 中的模型時，您可以呼叫任何 Bedrock 端點：

| 端點 | 說明 | 範例 |
|----------|-------------|---------|
| `/model/{model_name}/converse` | Converse API | `http://0.0.0.0:4000/bedrock/model/my-claude-model/converse` |
| `/model/{model_name}/converse-stream` | 串流 Converse | `http://0.0.0.0:4000/bedrock/model/my-claude-model/converse-stream` |
| `/model/{model_name}/invoke` | 舊版 Invoke API | `http://0.0.0.0:4000/bedrock/model/my-claude-model/invoke` |
| `/model/{model_name}/invoke-with-response-stream` | 舊版串流 | `http://0.0.0.0:4000/bedrock/model/my-claude-model/invoke-with-response-stream` |

Proxy 會自動將 `model_name` 解析為您在 `config.yaml` 中設定的實際 Bedrock 模型 ID 與區域。

### 跨多個部署的負載平衡 {#load-balancing-across-multiple-deployments}

以相同的 `model_name` 定義多個 Bedrock 部署，以啟用自動負載平衡。

#### 1. 在 config.yaml 中定義多個部署 {#1-define-multiple-deployments-in-configyaml}

```yaml showLineNumbers
model_list:
  # First deployment - us-west-2
  - model_name: my-claude-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
  
  # Second deployment - us-east-1 (load balanced)
  - model_name: my-claude-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-east-1
      custom_llm_provider: bedrock
```

#### 2. 使用設定啟動 proxy {#2-start-proxy-with-config-1}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

#### 3. 呼叫端點 - 請求會自動進行負載平衡 {#3-call-the-endpoint---requests-are-automatically-load-balanced}

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-claude-model/invoke' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "max_tokens": 100,
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ],
    "anthropic_version": "bedrock-2023-05-31"
}'
```

Proxy 會自動在 `us-west-2` 與 `us-east-1` 部署之間分配請求。這適用於所有 Bedrock 端點：`/invoke`、`/invoke-with-response-stream`、`/converse`，以及 `/converse-stream`。

#### 搭配負載平衡使用 boto3 SDK {#using-boto3-sdk-with-load-balancing}

您也可以使用 boto3 SDK 呼叫經過負載平衡的端點：

```python showLineNumbers
import boto3
import json
import os

# Set dummy AWS credentials (required by boto3, but not used by LiteLLM proxy)
os.environ['AWS_ACCESS_KEY_ID'] = 'dummy'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'dummy'
os.environ['AWS_BEARER_TOKEN_BEDROCK'] = "sk-1234"  # your litellm proxy api key

# Point boto3 to the LiteLLM proxy
bedrock_runtime = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-west-2',
    endpoint_url='http://0.0.0.0:4000/bedrock'
)

# Call the load-balanced model
response = bedrock_runtime.invoke_model(
    modelId='my-claude-model',  # Your model_name from config.yaml
    contentType='application/json',
    accept='application/json',
    body=json.dumps({
        "max_tokens": 100,
        "messages": [
            {
                "role": "user",
                "content": "Hello, how are you?"
            }
        ],
        "anthropic_version": "bedrock-2023-05-31"
    })
)

# Parse response
response_body = json.loads(response['body'].read())
print(response_body['content'][0]['text'])
```

Proxy 會自動在所有已設定的部署之間對您的 boto3 請求進行負載平衡。

## 範例 {#examples}

在 `http://0.0.0.0:4000/bedrock` 之後的任何內容都會被視為提供者特定路由，並相應處理。

重點變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://bedrock-runtime.{aws_region_name}.amazonaws.com`          | `http://0.0.0.0:4000/bedrock`（`LITELLM_PROXY_BASE_URL="http://0.0.0.0:4000"`）      |
| `AWS4-HMAC-SHA256..`                                 | `Bearer anything`（若 Proxy 上已設定 Virtual Keys，請使用 `Bearer LITELLM_VIRTUAL_KEY`）                    |

### **範例 1：Converse API** {#example-1-converse-api}

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call}

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/cohere.command-r-v1:0/converse' \
-H 'Authorization: Bearer sk-anything' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
         {"role": "user",
        "content": [{"text": "Hello"}]
    }
    ]
}'
```

#### 直接 Bedrock API 呼叫  {#direct-bedrock-api-call}

```bash showLineNumbers
curl -X POST 'https://bedrock-runtime.us-west-2.amazonaws.com/model/cohere.command-r-v1:0/converse' \
-H 'Authorization: AWS4-HMAC-SHA256..' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
         {"role": "user",
        "content": [{"text": "Hello"}]
    }
    ]
}'
```

### **範例 2：套用 Guardrail** {#example-2-apply-guardrail}

**設定**：為直接透傳設定 AWS 憑證

```bash showLineNumbers
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION_NAME="us-west-2"
```

啟動 proxy：

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

#### LiteLLM Proxy 呼叫  {#litellm-proxy-call-1}

```bash showLineNumbers
curl "http://0.0.0.0:4000/bedrock/guardrail/guardrailIdentifier/version/guardrailVersion/apply" \
    -H 'Authorization: Bearer sk-anything' \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{"text": {"text": "Hello world"}}],
      "source": "INPUT"
       }'
```

#### 直接 Bedrock API 呼叫 {#direct-bedrock-api-call-1}

```bash showLineNumbers
curl "https://bedrock-runtime.us-west-2.amazonaws.com/guardrail/guardrailIdentifier/version/guardrailVersion/apply" \
    -H 'Authorization: AWS4-HMAC-SHA256..' \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{"text": {"text": "Hello world"}}],
      "source": "INPUT"
       }'
```

### **範例 3：查詢 Knowledge Base** {#example-3-query-knowledge-base}

**設定**：為直接透傳設定 AWS 憑證

```bash showLineNumbers
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION_NAME="us-west-2"
```

啟動 proxy：

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

#### LiteLLM Proxy 呼叫 {#litellm-proxy-call-2}

```bash showLineNumbers
curl -X POST "http://0.0.0.0:4000/bedrock/knowledgebases/{knowledgeBaseId}/retrieve" \
-H 'Authorization: Bearer sk-anything' \
-H 'Content-Type: application/json' \
-d '{
    "nextToken": "string",
    "retrievalConfiguration": { 
        "vectorSearchConfiguration": { 
          "filter": { ... },
          "numberOfResults": number,
          "overrideSearchType": "string"
        }
    },
    "retrievalQuery": { 
        "text": "string"
    }
}'
```

#### 直接 Bedrock API 呼叫  {#direct-bedrock-api-call-2}

```bash showLineNumbers
curl -X POST "https://bedrock-agent-runtime.us-west-2.amazonaws.com/knowledgebases/{knowledgeBaseId}/retrieve" \
-H 'Authorization: AWS4-HMAC-SHA256..' \
-H 'Content-Type: application/json' \
-d '{
    "nextToken": "string",
    "retrievalConfiguration": { 
        "vectorSearchConfiguration": { 
          "filter": { ... },
          "numberOfResults": number,
          "overrideSearchType": "string"
        }
    },
    "retrievalQuery": { 
        "text": "string"
    }
}'
```


## 進階 - 搭配 Virtual Keys 使用  {#advanced---use-with-virtual-keys}

先決條件
- [以 DB 設定 proxy](../proxy/virtual_keys.md#setup)

使用此方法可避免將原始 AWS 金鑰提供給開發人員，但仍讓他們能使用 AWS Bedrock 端點。

### 使用方式 {#usage}

1. 設定環境

```bash showLineNumbers
export DATABASE_URL=""
export LITELLM_MASTER_KEY=""
export AWS_ACCESS_KEY_ID=""  # Access key
export AWS_SECRET_ACCESS_KEY="" # Secret access key
export AWS_REGION_NAME="" # us-east-1, us-east-2, us-west-1, us-west-2
```

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

2. 產生 virtual key 

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應 

```bash showLineNumbers
{
    ...
    "key": "sk-1234ewknldferwedojwojw"
}
```

3. 測試它！ 

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/cohere.command-r-v1:0/converse' \
-H 'Authorization: Bearer sk-1234ewknldferwedojwojw' \
-H 'Content-Type: application/json' \
-d '{
    "messages": [
         {"role": "user",
        "content": [{"text": "Hello"}]
    }
    ]
}'
```

## 進階 - Bedrock Agents  {#advanced---bedrock-agents}

透過 LiteLLM proxy 呼叫 Bedrock Agents

**設定**：在您的 LiteLLM proxy server 上設定 AWS 憑證

```bash showLineNumbers
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION_NAME="us-west-2"
```

啟動 proxy：

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

**Python 使用方式**：

```python showLineNumbers
import os 
import boto3

# Set dummy AWS credentials (required by boto3, but not used by LiteLLM proxy)
os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"
os.environ["AWS_BEARER_TOKEN_BEDROCK"] = "sk-1234"  # your litellm proxy api key

# Create the client
runtime_client = boto3.client(
    service_name="bedrock-agent-runtime", 
    region_name="us-west-2", 
    endpoint_url="http://0.0.0.0:4000/bedrock"
)

response = runtime_client.invoke_agent(
    agentId="L1RT58GYRW",
    agentAliasId="MFPSBCXYTW",
    sessionId="12345",
    inputText="Who do you know?"
)

completion = ""

for event in response.get("completion"):
    chunk = event["chunk"]
    completion += chunk["bytes"].decode()

print(completion)
```

## 搭配 LiteLLM 使用 LangChain AWS SDK {#using-langchain-aws-sdk-with-litellm}

您可以將 [LangChain AWS SDK](https://python.langchain.com/docs/integrations/chat/bedrock/) 與 LiteLLM Proxy 搭配使用，以獲得成本追蹤、負載平衡及其他 LiteLLM 功能。

### 快速開始 {#quick-start-1}

**1. 安裝 LangChain AWS**：

```bash showLineNumbers
uv add langchain-aws
```

**2. 設定 LiteLLM Proxy**：

建立一個 `config.yaml`：

```yaml showLineNumbers
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.claude-3-7-sonnet-20250219-v1:0
      aws_region_name: us-east-1
      custom_llm_provider: bedrock
```

啟動 proxy：

```bash showLineNumbers
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"

litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

**3. 搭配 LiteLLM 使用 LangChain**：

```python showLineNumbers
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage

# Your LiteLLM API key
API_KEY = "Bearer sk-1234"

# Initialize ChatBedrockConverse pointing to LiteLLM proxy
llm = ChatBedrockConverse(
    model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    endpoint_url="http://localhost:4000/bedrock",
    region_name="us-east-1",
    aws_access_key_id=API_KEY,
    aws_secret_access_key="bedrock"  # Any non-empty value works
)

# Invoke the model
messages = [HumanMessage(content="Hello, how are you?")]
response = llm.invoke(messages)

print(response.content)
```

### 進階範例：含引用的 PDF 文件處理 {#advanced-example-pdf-document-processing-with-citations}

LangChain AWS SDK 支援 Bedrock 的文件處理功能。以下是如何將它與 LiteLLM 搭配使用：

```python showLineNumbers
import os
import json
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage

# Your LiteLLM API key
API_KEY = "Bearer sk-1234"

def get_llm() -> ChatBedrockConverse:
    """Initialize LLM pointing to LiteLLM proxy"""
    llm = ChatBedrockConverse(
        model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        base_model_id="anthropic.claude-3-7-sonnet-20250219-v1:0",
        endpoint_url="http://localhost:4000/bedrock",
        region_name="us-east-1",
        aws_access_key_id=API_KEY,
        aws_secret_access_key="bedrock"
    )
    return llm

if __name__ == "__main__":
    # Initialize the LLM
    llm = get_llm()
    
    # Read PDF file as bytes (Converse API requires raw bytes)
    with open("your-document.pdf", "rb") as file:
        file_bytes = file.read()
    
    # Prepare messages with document attachment
    messages = [
        HumanMessage(content=[
            {"text": "What is the policy number in this document?"},
            {
                "document": {
                    "format": "pdf",
                    "name": "PolicyDocument",
                    "source": {"bytes": file_bytes},
                    "citations": {"enabled": True}
                }
            }
        ])
    ]
    
    # Invoke the LLM
    response = llm.invoke(messages)
    
    # Print response with citations
    print(json.dumps(response.content, indent=4))
```

### 支援的 LangChain 功能 {#supported-langchain-features}

所有 LangChain AWS 功能都可與 LiteLLM 搭配使用：

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 文字生成 | ✅ | 完整支援 |
| 串流 | ✅ | 使用 `stream()` 方法 |
| 文件處理 | ✅ | PDF、圖片等 |
| 引用 | ✅ | 在文件設定中啟用 |
| 工具使用 | ✅ | 支援函式呼叫 |
| 多模態 | ✅ | 文字 + 圖片 + 文件 |

### 疑難排解 {#troubleshooting}

**問題**：`UnknownOperationException` 錯誤

**解決方法**：請確保您使用正確的端點 URL 格式：
- ✅ 正確：`http://localhost:4000/bedrock`
- ❌ 錯誤：`http://localhost:4000/bedrock/v2`

**問題**：驗證錯誤

**解決方法**：請確認您的 API 金鑰格式正確：
```python
aws_access_key_id="Bearer sk-1234"  # Include "Bearer " prefix
```
