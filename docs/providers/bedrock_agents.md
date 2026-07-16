import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock Agents {#bedrock-agents}

以 OpenAI 請求／回應格式呼叫 Bedrock Agents。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Amazon Bedrock Agents 使用基礎模型（FMs）、API 和資料的推理能力，將使用者請求拆解、蒐集相關資訊，並有效率地完成任務。 |
| LiteLLM 上的提供者路由 | `bedrock/agent/{AGENT_ID}/{ALIAS_ID}` |
| 提供者文件 | [AWS Bedrock Agents ↗](https://aws.amazon.com/bedrock/agents/) |

## 快速開始 {#quick-start}

### LiteLLM 的模型格式 {#model-format-to-litellm}

若要透過 LiteLLM 呼叫 bedrock agent，您需要使用以下模型格式來呼叫該 agent。

這裡的 `model=bedrock/agent/` 會告訴 LiteLLM 去呼叫 bedrock `InvokeAgent` API。

```shell showLineNumbers title="Model Format to LiteLLM"
bedrock/agent/{AGENT_ID}/{ALIAS_ID}
```

**範例：**
- `bedrock/agent/L1RT58GYRW/MFPSBCXYTW`
- `bedrock/agent/ABCD1234/LIVE`

您可以在 AWS Bedrock 主控台的 Agents 下找到這些 ID。

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic Agent Completion"
import litellm

# Make a completion request to your Bedrock Agent
response = litellm.completion(
    model="bedrock/agent/L1RT58GYRW/MFPSBCXYTW",  # agent/{AGENT_ID}/{ALIAS_ID}
    messages=[
        {
            "role": "user", 
            "content": "Hi, I need help with analyzing our Q3 sales data and generating a summary report"
        }
    ],
)

print(response.choices[0].message.content)
print(f"Response cost: ${response._hidden_params['response_cost']}")
```

```python showLineNumbers title="Streaming Agent Responses"
import litellm

# Stream responses from your Bedrock Agent
response = litellm.completion(
    model="bedrock/agent/L1RT58GYRW/MFPSBCXYTW",
    messages=[
        {
            "role": "user",
            "content": "Can you help me plan a marketing campaign and provide step-by-step execution details?"
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
  - model_name: bedrock-agent-1
    litellm_params:
      model: bedrock/agent/L1RT58GYRW/MFPSBCXYTW
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2

  - model_name: bedrock-agent-2  
    litellm_params:
      model: bedrock/agent/AGENT456/ALIAS789
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

#### 3. 向您的 Bedrock Agents 發出請求 {#3-make-requests-to-your-bedrock-agents}

<Tabs>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Basic Agent Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "bedrock-agent-1",
    "messages": [
      {
        "role": "user", 
        "content": "Analyze our customer data and suggest retention strategies"
      }
    ]
  }'
```

```bash showLineNumbers title="Streaming Agent Request"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "bedrock-agent-2",
    "messages": [
      {
        "role": "user",
        "content": "Create a comprehensive social media strategy for our new product"
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

# Make a completion request to your agent
response = client.chat.completions.create(
    model="bedrock-agent-1",
    messages=[
      {
        "role": "user",
        "content": "Help me prepare for the quarterly business review meeting"
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

# Stream agent responses
stream = client.chat.completions.create(
    model="bedrock-agent-2",
    messages=[
      {
        "role": "user",
        "content": "Walk me through launching a new feature beta program"
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

## 提供者特定參數 {#provider-specific-parameters}

任何非 openai 參數都會作為自訂參數傳遞給 agent。

<Tabs>
<TabItem value="sdk" label="SDK">

```python showLineNumbers title="Using custom parameters"
from litellm import completion

response = litellm.completion(
    model="bedrock/agent/L1RT58GYRW/MFPSBCXYTW",
    messages=[
        {
            "role": "user",
            "content": "Hi who is ishaan cto of litellm, tell me 10 things about him",
        }
    ],
    invocationId="my-test-invocation-id", # PROVIDER-SPECIFIC VALUE
)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

```yaml showLineNumbers title="LiteLLM Proxy Configuration"
model_list:
  - model_name: bedrock-agent-1
    litellm_params:
      model: bedrock/agent/L1RT58GYRW/MFPSBCXYTW
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
      invocationId: my-test-invocation-id
```

</TabItem>
</Tabs>

## 延伸閱讀 {#further-reading}

- [AWS Bedrock Agents 文件](https://aws.amazon.com/bedrock/agents/)
- [LiteLLM 驗證至 Bedrock](https://docs.litellm.ai/docs/providers/bedrock#boto3---authentication)
