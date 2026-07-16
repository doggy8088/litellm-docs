import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock - Writer Palmyra {#bedrock---writer-palmyra}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Amazon Bedrock 上的 Writer Palmyra X5 與 X4 基礎模型，提供進階推理、工具呼叫與文件處理功能 |
| LiteLLM 上的提供者路由 | `bedrock/` |
| 支援的操作 | `/chat/completions` |
| 提供者文件連結 | [AWS Bedrock 上的 Writer ↗](https://aws.amazon.com/bedrock/writer/) |

## 快速開始 {#quick-start}

### LiteLLM SDK {#litellm-sdk}

```python showLineNumbers title="SDK Usage"
import litellm
import os

os.environ["AWS_ACCESS_KEY_ID"] = ""
os.environ["AWS_SECRET_ACCESS_KEY"] = ""
os.environ["AWS_REGION_NAME"] = "us-west-2"

response = litellm.completion(
    model="bedrock/us.writer.palmyra-x5-v1:0",
    messages=[{"role": "user", "content": "Hello, how are you?"}]
)

print(response.choices[0].message.content)
```

### LiteLLM Proxy {#litellm-proxy}

**1. 設定 config.yaml**

```yaml showLineNumbers title="proxy_config.yaml"
model_list:
  - model_name: writer-palmyra-x5
    litellm_params:
      model: bedrock/us.writer.palmyra-x5-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
```

**2. 啟動 proxy**

```bash showLineNumbers title="Start Proxy"
litellm --config config.yaml
```

**3. 呼叫 proxy**

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="curl Request"
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "writer-palmyra-x5",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000/v1"
)

response = client.chat.completions.create(
    model="writer-palmyra-x5",
    messages=[{"role": "user", "content": "Hello, how are you?"}]
)

print(response.choices[0].message.content)
```

</TabItem>
</Tabs>

## 工具呼叫 {#tool-calling}

Writer Palmyra 模型支援多步驟工具呼叫，適用於複雜工作流程。

### LiteLLM SDK {#litellm-sdk-1}

```python showLineNumbers title="Tool Calling - SDK"
import litellm

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = litellm.completion(
    model="bedrock/us.writer.palmyra-x5-v1:0",
    messages=[{"role": "user", "content": "What's the weather in Boston?"}],
    tools=tools
)
```

### LiteLLM Proxy {#litellm-proxy-1}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="Tool Calling - curl"
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "writer-palmyra-x5",
    "messages": [{"role": "user", "content": "What'\''s the weather in Boston?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string", "description": "The city and state"}
          },
          "required": ["location"]
        }
      }
    }]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Tool Calling - OpenAI SDK"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000/v1"
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="writer-palmyra-x5",
    messages=[{"role": "user", "content": "What's the weather in Boston?"}],
    tools=tools
)
```

</TabItem>
</Tabs>

## 文件輸入 {#document-input}

Writer Palmyra 模型支援文件輸入，包括 PDF。

### LiteLLM SDK {#litellm-sdk-2}

```python showLineNumbers title="PDF Document Input - SDK"
import litellm
import base64

# Read and encode PDF
with open("document.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode("utf-8")

response = litellm.completion(
    model="bedrock/us.writer.palmyra-x5-v1:0",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:application/pdf;base64,{pdf_base64}"
                    }
                },
                {
                    "type": "text",
                    "text": "Summarize this document"
                }
            ]
        }
    ]
)
```

### LiteLLM Proxy {#litellm-proxy-2}

<Tabs>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="PDF Document Input - curl"
# First, base64 encode your PDF
PDF_BASE64=$(base64 -i document.pdf)

curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "writer-palmyra-x5",
    "messages": [{
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {"url": "data:application/pdf;base64,'$PDF_BASE64'"}
        },
        {
          "type": "text",
          "text": "Summarize this document"
        }
      ]
    }]
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="PDF Document Input - OpenAI SDK"
from openai import OpenAI
import base64

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000/v1"
)

# Read and encode PDF
with open("document.pdf", "rb") as f:
    pdf_base64 = base64.b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="writer-palmyra-x5",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:application/pdf;base64,{pdf_base64}"
                    }
                },
                {
                    "type": "text",
                    "text": "Summarize this document"
                }
            ]
        }
    ]
)
```

</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

| 模型 ID | 上下文視窗 | 輸入成本（每 1K tokens） | 輸出成本（每 1K tokens） |
|----------|---------------|---------------------------|----------------------------|
| `bedrock/us.writer.palmyra-x5-v1:0` | 1M tokens | $0.0006 | $0.006 |
| `bedrock/us.writer.palmyra-x4-v1:0` | 128K tokens | $0.0025 | $0.010 |
| `bedrock/writer.palmyra-x5-v1:0` | 1M tokens | $0.0006 | $0.006 |
| `bedrock/writer.palmyra-x4-v1:0` | 128K tokens | $0.0025 | $0.010 |

:::info 跨區域推理
`us.writer.*` 模型 ID 使用跨區域推理設定檔。請將這些用於正式工作負載。
:::
