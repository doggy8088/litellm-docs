# Bedrock（boto3）SDK {#bedrock-boto3-sdk}

Bedrock 的透傳端點 - 直接呼叫提供者特定端點，使用原生格式（不進行轉換）。

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 適用於 `/invoke` 和 `/converse` 端點 |
| 負載平衡 | ✅ | 您可以在多個部署之間對 `/invoke`、`/converse` 路由進行負載平衡| 記錄 | ✅ | 可在所有整合中運作 |
| 終端使用者追蹤 | ❌ | [如果您需要，請告訴我們](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html) |
| 串流 | ✅ | |

只要將 `https://bedrock-runtime.{aws_region_name}.amazonaws.com` 直接替換為 `LITELLM_PROXY_BASE_URL/bedrock`

## 總覽 {#overview}

LiteLLM 支援兩種呼叫 Bedrock 端點的方式：

### 1. **使用 config.yaml**（建議用於模型端點） {#1-using-configyaml-recommended-for-model-endpoints}

在 `config.yaml` 中定義您的 Bedrock 模型，並以名稱參照它們。Proxy 會處理驗證與路由。

**適用於**：`/converse`、`/converse-stream`、`/invoke`、`/invoke-with-response-stream`

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
```

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-bedrock-model/converse' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{"contents": [{"text": {"text": "Hello"}}], "source": "INPUT"}'
```

支援 **所有** Bedrock 端點（包含串流）。

[**查看所有 Bedrock 端點**](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

## 快速開始 {#quick-start}

讓我們呼叫 Bedrock [`/converse` 端點](../proxy/virtual_keys.md#setup)

1. 建立一個含有您的 Bedrock 模型的 `config.yaml` 檔案

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
      model: bedrock/us.anthropic.{{anthropic}}
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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

#### `/converse-stream` 上的 post_call 防護欄 {#post_call-guardrails-on-converse-stream}

設在呼叫者金鑰上的 `post_call` 防護欄會在 `/converse-stream` 輸出串流的同時掃描它，方式與掃描 `/v1/chat/completions` 串流相同：

- 使用 `streaming_buffer_until_moderated: false`（多數防護欄的預設值）時，代理會在 Bedrock 送出 frame 時即轉送，並每隔 `streaming_sampling_rate` 個 frame（預設 5）掃描一次文字，也會在結尾掃描。文字會在防護欄給出判定之前到達用戶端，且不會套用遮罩。每次掃描都會暫停串流，直到防護欄回應，因此緩慢的防護欄會拉長冗長回答的時間（使用 Bedrock 防護欄時，一段 700 字的回答約需 50 秒，而非 12 秒）；加入 `streaming_end_of_stream_only: true`，即可改為只在結尾掃描一次。
- 使用 `streaming_buffer_until_moderated: true`（[Bedrock 防護欄](../proxy/guardrails/bedrock#streaming) 的預設值）時，代理會保留串流直到掃描完成，然後按內容區塊套用遮罩後送出。
- 在第一個 frame 之後發生的封鎖，會以 AWS `validationException` 事件結束串流，AWS SDK 會將其擲出為帶有防護欄訊息的 `EventStreamError`。在第一個 frame 之前發生的封鎖則回傳 HTTP 錯誤。
- 使用自己的 hook 而非 `apply_guardrail` 掃描回應的防護欄（例如未設定 `use_v2: true` 的 Noma 防護欄）、設定了 `mask_response_content: true` 的防護欄、設定了 `streaming_buffer_release_on_scan: true` 的保留型防護欄、設定了 `run_in_parallel: true` 的 post_call 防護欄，以及 post_call 原則管線，仍會保留整個串流並只掃描一次。對於 Noma，請設定 `use_v2: true`，以便在串流到達時即進行掃描。

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
      model: bedrock/us.anthropic.{{anthropic}}
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
  
  # Second deployment - us-east-1 (load balanced)
  - model_name: my-claude-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
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
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
os.environ['AWS_BEARER_TOKEN_BEDROCK'] = "sk-<your-litellm-api-key>"  # your litellm proxy api key

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

### config.yaml 模型上的 Bedrock 防護欄 {#bedrock-guardrails-on-configyaml-models}

<SinceVersion v="1.108.0" />

`config.yaml` 中模型（或在 UI 中新增的模型）上的 `guardrailConfig` 也適用於這些透傳路由，方式與在 `/v1/chat/completions` 上相同。

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
      aws_region_name: us-west-2
      custom_llm_provider: bedrock
```

| 路由 | 代理如何送出防護欄 |
|-------|-----------------------------------|
| `/converse` | 請求 body 中的 `guardrailConfig` |
| `/converse-stream` | 請求 body 中的 `guardrailConfig`，若您有設定，還包括 `streamProcessingMode` |
| `/invoke`、`/invoke-with-response-stream` | `X-Amzn-Bedrock-GuardrailIdentifier`、`X-Amzn-Bedrock-GuardrailVersion` 與 `X-Amzn-Bedrock-Trace` 標頭 |

模型的防護欄會取代呼叫者在 body 或標頭中送出的任何防護欄，因此呼叫者無法將其關閉，也無法改用其他防護欄。在負載平衡下，每個請求會使用為其提供服務的部署所屬的防護欄。

當 Bedrock 封鎖請求時，`/converse` 會回傳 `stopReason: guardrail_intervened`，`/invoke` 則回傳 `amazon-bedrock-guardrailAction: INTERVENED`，兩者都會帶有您的封鎖訊息，並在啟用 `trace` 時附上防護欄追蹤。

`/invoke` 路由只接受 `guardrailIdentifier`、`guardrailVersion` 與 `trace`。若模型的 `guardrailConfig` 缺少 `guardrailVersion`，或指定了不存在的防護欄，這些路由會回傳 400，與 `/v1/chat/completions` 相同。

透傳會將請求 body 原封不動地送給 Bedrock，因此 Bedrock 會檢查其中的每則訊息。若要讓 Bedrock 只檢查 Converse 請求的一部分，請將該部分包裝在 `guardContent` 區塊中，詳見[選擇性評估內容](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-converse-api.html)。

### 從 Bedrock 請求中繼資料取得 Session ID {#session-id-from-bedrock-request-metadata}

<SinceVersion v="1.109.0" />

Bedrock 用戶端可以用[請求中繼資料](https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-request-metadata.html)為每次呼叫加上標籤，在 `/converse` 與 `/converse-stream` 上以 `requestMetadata` body 欄位送出，或在 `/invoke` 與 `/invoke-with-response-stream` 上以 `X-Amzn-Bedrock-Request-Metadata` JSON 標頭送出。當該中繼資料含有 `sessionId`、`threadId` 或 `conversationId` 鍵時，代理會使用其值作為該次呼叫的 LiteLLM session ID，因此送出相同值的呼叫會在支出記錄中共用同一個 session。這些鍵會依該順序檢查，並使用第一個非空字串值（原樣使用）。同一請求上的 `x-litellm-session-id` 或 `x-litellm-trace-id` 標頭優先於此。

使用上方的 `bedrock_runtime` 用戶端：

```python showLineNumbers
response = bedrock_runtime.converse(
    modelId='my-claude-model',  # Your model_name from config.yaml
    messages=[{"role": "user", "content": [{"text": "Hello, how are you?"}]}],
    requestMetadata={"threadId": "thread-abc-123"},
)
```

## 範例 {#examples}

在 `http://0.0.0.0:4000/bedrock` 之後的任何內容都會被視為提供者特定路由，並相應處理。

重點變更： 

| **原始端點**                                | **替換為**                  |
|------------------------------------------------------|-----------------------------------|
| `https://bedrock-runtime.{aws_region_name}.amazonaws.com`          | `http://0.0.0.0:4000/bedrock`（`AWS4-HMAC-SHA256..`）      |
| `Bearer anything`                                 | `Bearer LITELLM_VIRTUAL_KEY`（若 Proxy 上已設定 Virtual Keys，請使用 `config.yaml`）                    |

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
- [以 DB 設定 proxy](https://python.langchain.com/docs/integrations/chat/bedrock/)

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
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{}'
```

預期回應 

```bash showLineNumbers
{
    ...
    "key": "sk-<virtual-key>"
}
```

3. 測試它！ 

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/cohere.command-r-v1:0/converse' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
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
os.environ["AWS_BEARER_TOKEN_BEDROCK"] = "sk-<your-litellm-api-key>"  # your litellm proxy api key

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

您可以將 [LangChain AWS SDK](http://0.0.0.0:4000) 與 LiteLLM Proxy 搭配使用，以獲得成本追蹤、負載平衡及其他 LiteLLM 功能。

### 快速開始 {#quick-start-1}

**1. 安裝 LangChain AWS**：

```bash showLineNumbers
uv add langchain-aws
```

**2. 設定 LiteLLM Proxy**：

建立一個 `stream()`：

```yaml showLineNumbers
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/us.anthropic.{{anthropic}}
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
API_KEY = "Bearer sk-<your-litellm-api-key>"

# Initialize ChatBedrockConverse pointing to LiteLLM proxy
llm = ChatBedrockConverse(
    model_id="us.anthropic.{{anthropic}}",
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
API_KEY = "Bearer sk-<your-litellm-api-key>"

def get_llm() -> ChatBedrockConverse:
    """Initialize LLM pointing to LiteLLM proxy"""
    llm = ChatBedrockConverse(
        model_id="us.anthropic.{{anthropic}}",
        base_model_id="anthropic.{{anthropic}}",
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
| 串流 | ✅ | 使用 `UnknownOperationException` 方法 |
| 文件處理 | ✅ | PDF、圖片等 |
| 引用 | ✅ | 在文件設定中啟用 |
| 工具使用 | ✅ | 支援函式呼叫 |
| 多模態 | ✅ | 文字 + 圖片 + 文件 |

### 疑難排解 {#troubleshooting}

**問題**：`http://localhost:4000/bedrock` 錯誤

**解決方法**：請確保您使用正確的端點 URL 格式：
- ✅ 正確：`http://localhost:4000/bedrock/v2`
- ❌ 錯誤：https://github.com/BerriAI/litellm/issues/new

**問題**：驗證錯誤

**解決方法**：請確認您的 API 金鑰格式正確：
```python
aws_access_key_id="Bearer sk-<your-litellm-api-key>"  # Include "Bearer " prefix
```
