# /converse {#converse}

透過 LiteLLM Proxy 呼叫 Bedrock 的 `/converse` 端點。

| 功能 | 支援 |
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅ |
| 串流 | ✅ 透過 `/converse-stream` |
| 負載平衡 | ✅ |

## 快速開始 {#quick-start}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml showLineNumbers
model_list:
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID  # reads from environment
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      custom_llm_provider: bedrock
```

在您的環境中設定 AWS 憑證：

```bash showLineNumbers
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 2. 啟動 Proxy {#2-start-proxy}

```bash showLineNumbers
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. 呼叫 /converse 端點 {#3-call-converse-endpoint}

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
        "temperature": 0.5,
        "maxTokens": 100
    }
}'
```

## 串流 {#streaming}

對於串流回應，請使用 `/converse-stream`：

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/bedrock/model/my-bedrock-model/converse-stream' \
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

## 負載平衡 {#load-balancing}

定義多個具有相同 `model_name` 的部署，以便自動負載平衡：

```yaml showLineNumbers
model_list:
  # Deployment 1 - us-west-2
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-west-2
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      custom_llm_provider: bedrock
  
  # Deployment 2 - us-east-1
  - model_name: my-bedrock-model
    litellm_params:
      model: bedrock/us.anthropic.claude-3-5-sonnet-20240620-v1:0
      aws_region_name: us-east-1
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      custom_llm_provider: bedrock
```

Proxy 會自動將請求分散到兩個區域。

## 使用 boto3 SDK {#using-boto3-sdk}

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

response = bedrock_runtime.converse(
    modelId='my-bedrock-model',  # Your model_name from config.yaml
    messages=[
        {
            "role": "user",
            "content": [{"text": "Hello, how are you?"}]
        }
    ],
    inferenceConfig={
        "temperature": 0.5,
        "maxTokens": 100
    }
)

print(response['output']['message']['content'][0]['text'])
```

## 更多資訊 {#more-info}

如需包含防護欄、知識庫和代理程式的完整文件，請參閱：
- [完整 Bedrock Passthrough 文件](./pass_through/bedrock)
