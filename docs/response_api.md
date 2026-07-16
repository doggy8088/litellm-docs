import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /responses {#responses}

LiteLLM 提供了一個符合 [OpenAI 的 `/responses` API](https://platform.openai.com/docs/api-reference/responses) 規格的端點

當提供者不支援該端點時，對 /chat/completions 的請求可自動橋接至此。模型的預設 `mode` 會決定橋接方式。（請參閱 `model_prices_and_context_window`） 

| 功能 | 支援 | 備註 |
|---------|-----------|--------|
| 成本追蹤 | ✅ | 適用於所有受支援的模型 |
| 記錄 | ✅ | 適用於所有整合 |
| 端使用者追蹤 | ✅ | |
| 串流 | ✅ | |
| WebSocket 模式 | ✅ | 為所有提供者提供更低延遲的持久連線 |
| 影像生成串流 | ✅ | 具部分影像（1-3）的漸進式影像生成 |
| 備援 | ✅ | 可在受支援模型之間運作 |
| 負載平衡 | ✅ | 可在受支援模型之間運作 |
| 防護欄 | ✅ | 套用於輸入與輸出文字（僅限非串流） |
| 支援的操作 | 建立回應、取得回應、刪除回應 | |
| 支援的 LiteLLM 版本 | 1.63.8+ | |
| 支援的 LLM 提供者 | **所有 LiteLLM 支援的提供者** | `openai`、`anthropic`、`bedrock`、`vertex_ai`、`gemini`、`azure`、`azure_ai` 等。 |

## 用法 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="openai" label="OpenAI">

#### 非串流 {#non-streaming}
```python showLineNumbers title="OpenAI Non-streaming Response"
import litellm

# Non-streaming response
response = litellm.responses(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### 回應格式（OpenAI Responses API 格式） {#response-format-openai-responses-api-format}

```json
{
    "id": "resp_abc123",
    "object": "response",
    "created_at": 1734366691,
    "status": "completed",
    "model": "o1-pro-2025-01-30",
    "output": [
        {
            "type": "message",
            "id": "msg_abc123",
            "status": "completed",
            "role": "assistant",
            "content": [
                {
                    "type": "output_text",
                    "text": "Once upon a time, a little unicorn named Stardust lived in a magical meadow where flowers sang lullabies. One night, she discovered that her horn could paint dreams across the sky, and she spent the evening creating the most beautiful aurora for all the forest creatures to enjoy. As the animals drifted off to sleep beneath her shimmering lights, Stardust curled up on a cloud of moonbeams, happy to have shared her magic with her friends.",
                    "annotations": []
                }
            ]
        }
    ],
    "usage": {
        "input_tokens": 18,
        "output_tokens": 98,
        "total_tokens": 116
    }
}
```

#### 串流 {#streaming}
```python showLineNumbers title="OpenAI Streaming Response"
import litellm

# Streaming response
response = litellm.responses(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

#### 含串流的圖片生成 {#image-generation-with-streaming}
```python showLineNumbers title="OpenAI Streaming Image Generation"
import litellm
import base64

# Streaming image generation with partial images
stream = litellm.responses(
    model="gpt-4.1",  # Use an actual image generation model
    input="Generate a gorgeous image of a river made of white owl feathers",
    stream=True,
    tools=[{"type": "image_generation", "partial_images": 2}],

)

for event in stream:
    if event.type == "response.image_generation_call.partial_image":
        idx = event.partial_image_index
        image_base64 = event.partial_image_b64
        image_bytes = base64.b64decode(image_base64)
        with open(f"river{idx}.png", "wb") as f:
            f.write(image_bytes)
```

#### 圖片生成（非串流） {#image-generation-non-streaming}

支援影像生成的模型可進行影像生成。生成的影像會以 `output` 陣列搭配 `type: "image_generation_call"` 回傳。

**Gemini（Google AI Studio）：**
```python showLineNumbers title="Gemini Image Generation"
import litellm
import base64

# Gemini image generation models don't require tools parameter
response = litellm.responses(
    model="gemini/gemini-2.5-flash-image",
    input="Generate a cute cat playing with yarn"
)

# Access generated images from output
for item in response.output:
    if item.type == "image_generation_call":
        # item.result contains pure base64 (no data: prefix)
        image_bytes = base64.b64decode(item.result)

        # Save the image
        with open(f"generated_{item.id}.png", "wb") as f:
            f.write(image_bytes)

print(f"Image saved: generated_{response.output[0].id}.png")
```

**OpenAI：**
```python showLineNumbers title="OpenAI Image Generation"
import litellm
import base64

# OpenAI models require tools parameter for image generation
response = litellm.responses(
    model="openai/gpt-4o",
    input="Generate a futuristic city at sunset",
    tools=[{"type": "image_generation"}]
)

# Access generated images from output
for item in response.output:
    if item.type == "image_generation_call":
        image_bytes = base64.b64decode(item.result)
        with open(f"generated_{item.id}.png", "wb") as f:
            f.write(image_bytes)
```

**回應格式：**

當影像生成成功時，回應包含：

```json
{
  "id": "resp_abc123",
  "status": "completed",
  "output": [
    {
      "type": "image_generation_call",
      "id": "resp_abc123_img_0",
      "status": "completed",
      "result": "iVBORw0KGgo..."  // Pure base64 string (no data: prefix)
    }
  ]
}
```

**支援的模型：**

| 提供者 | 模型 | 需要 `tools` 參數 |
|----------|--------|---------------------------|
| Google AI Studio | `gemini/gemini-2.5-flash-image` | ❌ 否 |
| Vertex AI | `vertex_ai/gemini-2.5-flash-image-preview` | ❌ 否 |
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3` | ✅ 是 |
| AWS Bedrock | Stability AI、Amazon Nova Canvas models | 依模型而定 |
| Fal AI | Various image generation models | 檢查模型文件 |

**注意：** `result` 欄位包含純 base64 編碼的影像資料，不含 `data:image/png;base64,` 前綴。您必須先使用 `base64.b64decode()` 解碼後再儲存。

#### GET 一個回應 {#get-a-response}
```python showLineNumbers title="Get Response by ID"
import litellm

# First, create a response
response = litellm.responses(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

# Get the response ID
response_id = response.id

# Retrieve the response by ID
retrieved_response = litellm.get_responses(
    response_id=response_id
)

print(retrieved_response)

# For async usage
# retrieved_response = await litellm.aget_responses(response_id=response_id)
```

#### CANCEL 一個回應 {#cancel-a-response}
如果提供者支援，您可以取消進行中的回應：

```python showLineNumbers title="Cancel Response by ID"
import litellm

# First, create a response
response = litellm.responses(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

# Get the response ID
response_id = response.id

# Cancel the response by ID
cancel_response = litellm.cancel_responses(
    response_id=response_id
)

print(cancel_response)

# For async usage
# cancel_response = await litellm.acancel_responses(response_id=response_id)
```


**REST API：**
```bash
curl -X POST http://localhost:4000/v1/responses/response_id/cancel \
    -H "Authorization: Bearer sk-1234"
```

這會嘗試取消具有指定 ID 的進行中回應。
**注意：** 並非所有提供者都支援回應取消。若不支援，將會引發錯誤。

#### DELETE 一個回應 {#delete-a-response}
```python showLineNumbers title="Delete Response by ID"
import litellm

# First, create a response
response = litellm.responses(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

# Get the response ID
response_id = response.id

# Delete the response by ID
delete_response = litellm.delete_responses(
    response_id=response_id
)

print(delete_response)

# For async usage
# delete_response = await litellm.adelete_responses(response_id=response_id)
```

</TabItem>

<TabItem value="anthropic" label="Anthropic">

#### 非串流 {#non-streaming-1}
```python showLineNumbers title="Anthropic Non-streaming Response"
import litellm
import os

# Set API key
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key"

# Non-streaming response
response = litellm.responses(
    model="anthropic/claude-3-5-sonnet-20240620",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### 串流 {#streaming-1}
```python showLineNumbers title="Anthropic Streaming Response"
import litellm
import os

# Set API key
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key"

# Streaming response
response = litellm.responses(
    model="anthropic/claude-3-5-sonnet-20240620",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="vertex" label="Vertex AI">

#### 非串流 {#non-streaming-2}
```python showLineNumbers title="Vertex AI Non-streaming Response"
import litellm
import os

# Set credentials - Vertex AI uses application default credentials
# Run 'gcloud auth application-default login' to authenticate
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

# Non-streaming response
response = litellm.responses(
    model="vertex_ai/gemini-1.5-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### 串流 {#streaming-2}
```python showLineNumbers title="Vertex AI Streaming Response"
import litellm
import os

# Set credentials - Vertex AI uses application default credentials
# Run 'gcloud auth application-default login' to authenticate
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

# Streaming response
response = litellm.responses(
    model="vertex_ai/gemini-1.5-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="bedrock" label="AWS Bedrock">

#### 非串流 {#non-streaming-3}
```python showLineNumbers title="AWS Bedrock Non-streaming Response"
import litellm
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key-id"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-access-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"  # or your AWS region

# Non-streaming response
response = litellm.responses(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### 串流 {#streaming-3}
```python showLineNumbers title="AWS Bedrock Streaming Response"
import litellm
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key-id"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-access-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"  # or your AWS region

# Streaming response
response = litellm.responses(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="gemini" label="Google AI Studio">

#### 非串流 {#non-streaming-4}
```python showLineNumbers title="Google AI Studio Non-streaming Response"
import litellm
import os

# Set API key for Google AI Studio
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

# Non-streaming response
response = litellm.responses(
    model="gemini/gemini-1.5-flash",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### 串流 {#streaming-4}
```python showLineNumbers title="Google AI Studio Streaming Response"
import litellm
import os

# Set API key for Google AI Studio
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

# Streaming response
response = litellm.responses(
    model="gemini/gemini-1.5-flash",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>
</Tabs>

### 搭配 OpenAI SDK 的 LiteLLM Proxy {#litellm-proxy-with-openai-sdk}

首先，設定並啟動您的 LiteLLM proxy 伺服器。

```bash title="Start LiteLLM Proxy Server"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai" label="OpenAI">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="OpenAI Proxy Configuration"
model_list:
  - model_name: openai/o1-pro
    litellm_params:
      model: openai/o1-pro
      api_key: os.environ/OPENAI_API_KEY
```

#### 非串流 {#non-streaming-5}
```python showLineNumbers title="OpenAI Proxy Non-streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-5}
```python showLineNumbers title="OpenAI Proxy Streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

#### 含串流的圖片生成 {#image-generation-with-streaming-1}
```python showLineNumbers title="OpenAI Proxy Streaming Image Generation"
from openai import OpenAI
import base64

client = OpenAI(api_key="sk-1234", base_url="http://localhost:4000")

stream = client.responses.create(
    model="gpt-4.1",
    input="Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
    stream=True,
    tools=[{"type": "image_generation", "partial_images": 2}],
)


for event in stream:
    print(f"event: {event}")
    if event.type == "response.image_generation_call.partial_image":
        idx = event.partial_image_index
        image_base64 = event.partial_image_b64
        image_bytes = base64.b64decode(image_base64)
        with open(f"river{idx}.png", "wb") as f:
            f.write(image_bytes)

```

#### GET 一個回應 {#get-a-response-1}
```python showLineNumbers title="Get Response by ID with OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# First, create a response
response = client.responses.create(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn."
)

# Get the response ID
response_id = response.id

# Retrieve the response by ID
retrieved_response = client.responses.retrieve(response_id)

print(retrieved_response)
```

#### DELETE 一個回應 {#delete-a-response-1}
```python showLineNumbers title="Delete Response by ID with OpenAI SDK"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# First, create a response
response = client.responses.create(
    model="openai/o1-pro",
    input="Tell me a three sentence bedtime story about a unicorn."
)

# Get the response ID
response_id = response.id

# Delete the response by ID
delete_response = client.responses.delete(response_id)

print(delete_response)
```

</TabItem>

<TabItem value="anthropic" label="Anthropic">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="Anthropic Proxy Configuration"
model_list:
  - model_name: anthropic/claude-3-5-sonnet-20240620
    litellm_params:
      model: anthropic/claude-3-5-sonnet-20240620
      api_key: os.environ/ANTHROPIC_API_KEY
```

#### 非串流 {#non-streaming-6}
```python showLineNumbers title="Anthropic Proxy Non-streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="anthropic/claude-3-5-sonnet-20240620",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-6}
```python showLineNumbers title="Anthropic Proxy Streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="anthropic/claude-3-5-sonnet-20240620",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="vertex" label="Vertex AI">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="Vertex AI Proxy Configuration"
model_list:
  - model_name: vertex_ai/gemini-1.5-pro
    litellm_params:
      model: vertex_ai/gemini-1.5-pro
      vertex_project: your-gcp-project-id
      vertex_location: us-central1
```

#### 非串流 {#non-streaming-7}
```python showLineNumbers title="Vertex AI Proxy Non-streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="vertex_ai/gemini-1.5-pro",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-7}
```python showLineNumbers title="Vertex AI Proxy Streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="vertex_ai/gemini-1.5-pro",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="bedrock" label="AWS Bedrock">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="AWS Bedrock Proxy Configuration"
model_list:
  - model_name: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
    litellm_params:
      model: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
```

#### 非串流 {#non-streaming-8}
```python showLineNumbers title="AWS Bedrock Proxy Non-streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-8}
```python showLineNumbers title="AWS Bedrock Proxy Streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>

<TabItem value="gemini" label="Google AI Studio">

首先，將以下內容加入您的 litellm proxy config.yaml：
```yaml showLineNumbers title="Google AI Studio Proxy Configuration"
model_list:
  - model_name: gemini/gemini-1.5-flash
    litellm_params:
      model: gemini/gemini-1.5-flash
      api_key: os.environ/GEMINI_API_KEY
```

#### 非串流 {#non-streaming-9}
```python showLineNumbers title="Google AI Studio Proxy Non-streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Non-streaming response
response = client.responses.create(
    model="gemini/gemini-1.5-flash",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response)
```

#### 串流 {#streaming-9}
```python showLineNumbers title="Google AI Studio Proxy Streaming Response"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-api-key"             # Your proxy API key
)

# Streaming response
response = client.responses.create(
    model="gemini/gemini-1.5-flash",
    input="Tell me a three sentence bedtime story about a unicorn.",
    stream=True
)

for event in response:
    print(event)
```

</TabItem>
</Tabs>

## WebSocket 模式 {#websocket-mode}

Responses API 支援 **WebSocket 模式**，可提供更低延遲、持久連線，非常適合 agentic workflows。WebSocket 模式可搭配 **所有 LiteLLM 提供者** 使用，而不僅限於原生支援 WebSocket 的提供者。

### 架構 {#architecture}

LiteLLM 提供兩種 WebSocket 模式：

1. **原生 WebSocket**：直接 `wss://` 連線至支援的提供者（OpenAI、Azure）
2. **受管理的 WebSocket**：對其他所有提供者（Anthropic、Gemini、Bedrock 等）透過 WebSocket 進行 HTTP 串流

系統會根據提供者能力自動選擇適當的模式。

### 用法 {#usage-1}

<Tabs>
<TabItem value="python" label="Python (websocket-client)">

```python showLineNumbers title="WebSocket with Python"
import json
from websocket import create_connection  # uv add websocket-client

# Connect to LiteLLM proxy WebSocket endpoint
ws = create_connection(
    "ws://localhost:4000/v1/responses?model=gemini-2.5-flash",
    header=["Authorization: Bearer sk-1234"]
)

try:
    # Send initial message
    ws.send(json.dumps({
        "type": "response.create",
        "model": "gemini-2.5-flash",
        "store": True,
        "input": [{
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": "My favorite color is blue."}]
        }]
    }))
    
    # Collect response events
    response_id = None
    while True:
        event = json.loads(ws.recv())
        print(f"Event: {event['type']}")
        
        if event["type"] == "response.completed":
            response_id = event["response"]["id"]
            break
        elif event["type"] == "response.output_text.delta":
            print(f"Text: {event.get('delta', '')}", end="", flush=True)
    
    print(f"\nResponse ID: {response_id}")
    
    # Send follow-up with previous_response_id for multi-turn
    ws.send(json.dumps({
        "type": "response.create",
        "model": "gemini-2.5-flash",
        "previous_response_id": response_id,
        "input": [{
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": "What is my favorite color?"}]
        }]
    }))
    
    # Collect follow-up response
    while True:
        event = json.loads(ws.recv())
        if event["type"] == "response.completed":
            break
        elif event["type"] == "response.output_text.delta":
            print(event.get("delta", ""), end="", flush=True)
            
finally:
    ws.close()
```

</TabItem>
<TabItem value="javascript" label="JavaScript (ws)">

```javascript showLineNumbers title="WebSocket with JavaScript"
const WebSocket = require('ws'); // npm install ws

const ws = new WebSocket(
    'ws://localhost:4000/v1/responses?model=gemini-2.5-flash',
    {
        headers: {
            'Authorization': 'Bearer sk-1234'
        }
    }
);

ws.on('open', () => {
    // Send initial message
    ws.send(JSON.stringify({
        type: 'response.create',
        model: 'gemini-2.5-flash',
        store: true,
        input: [{
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'My favorite color is blue.' }]
        }]
    }));
});

let responseId = null;

ws.on('message', (data) => {
    const event = JSON.parse(data.toString());
    console.log(`Event: ${event.type}`);
    
    if (event.type === 'response.completed') {
        responseId = event.response.id;
        console.log(`Response ID: ${responseId}`);
        
        // Send follow-up
        ws.send(JSON.stringify({
            type: 'response.create',
            model: 'gemini-2.5-flash',
            previous_response_id: responseId,
            input: [{
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: 'What is my favorite color?' }]
            }]
        }));
    } else if (event.type === 'response.output_text.delta') {
        process.stdout.write(event.delta || '');
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});
```

</TabItem>
<TabItem value="curl" label="curl (websocat)">

```bash showLineNumbers title="WebSocket with websocat"
# Install websocat: brew install websocat (macOS) or cargo install websocat

# Connect to WebSocket endpoint
websocat "ws://localhost:4000/v1/responses?model=gemini-2.5-flash" \
  -H="Authorization: Bearer sk-1234"

# Then send JSON events (paste and press Enter):
{"type":"response.create","model":"gemini-2.5-flash","input":[{"type":"message","role":"user","content":[{"type":"input_text","text":"Hello!"}]}]}

# You'll receive streaming events back:
# {"type":"response.created",...}
# {"type":"response.in_progress",...}
# {"type":"response.output_text.delta","delta":"Hello",...}
# {"type":"response.completed",...}
```

</TabItem>
</Tabs>

### 事件類型 {#event-types}

WebSocket 連線會接收以 JSON 格式表示的伺服器推送事件（SSE）：

| 事件類型 | 說明 |
|------------|-------------|
| `response.created` | 回應生成已開始 |
| `response.in_progress` | 正在生成回應 |
| `response.output_item.added` | 已新增新的輸出項目（訊息、工具呼叫等） |
| `response.output_text.delta` | 增量文字片段 |
| `response.output_text.done` | 文字輸出已完成 |
| `response.content_part.done` | 內容部分已完成 |
| `response.output_item.done` | 輸出項目已完成 |
| `response.completed` | 完整回應已成功完成 |
| `response.failed` | 回應生成失敗 |
| `response.incomplete` | 回應不完整（例如，已達到最大 token 數） |
| `error` | 發生錯誤 |

### 多輪對話 {#multi-turn-conversations}

使用 `previous_response_id` 來在多個 WebSocket 訊息之間維持對話上下文：

```python showLineNumbers title="Multi-turn WebSocket Conversation"
# Turn 1
ws.send(json.dumps({
    "type": "response.create",
    "model": "gemini-2.5-flash",
    "store": True,  # Required for multi-turn
    "input": [{"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Hello"}]}]
}))

# ... collect events and get response_id from response.completed event ...

# Turn 2 - reference previous response
ws.send(json.dumps({
    "type": "response.create",
    "model": "gemini-2.5-flash",
    "previous_response_id": response_id,  # Links to previous turn
    "input": [{"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Continue"}]}]
}))
```

### 提供者支援 {#provider-support}

| 提供者 | WebSocket 模式 | 備註 |
|----------|----------------|-------|
| OpenAI | 原生 | 直接 `wss://` 連線至 OpenAI |
| Azure OpenAI | 原生 | 直接 `wss://` 連線至 Azure |
| Anthropic | 受管理 | 透過 WebSocket 進行 HTTP 串流 |
| Google AI Studio (Gemini) | 受管理 | 透過 WebSocket 進行 HTTP 串流 |
| Vertex AI | 受管理 | 透過 WebSocket 進行 HTTP 串流 |
| AWS Bedrock | 受管理 | 透過 WebSocket 進行 HTTP 串流 |
| 所有其他提供者 | 受管理 | 透過 WebSocket 進行 HTTP 串流 |

**注意**：原生與受管理模式都提供相同的事件串流格式。對用戶端而言，差異是透明的。

### 組態 {#configuration}

不需要任何特殊設定。透過 WebSocket 通訊協定（`ws://` 或 `wss://`）存取時，WebSocket 模式會在 `/v1/responses` 端點自動可用。

對於 LiteLLM Proxy，請確保您的模型已正常設定：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gemini-2.5-flash
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GEMINI_API_KEY
  
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

這兩個模型都會自動在 `ws://localhost:4000/v1/responses` 支援 WebSocket 模式。

## Response ID 安全性 {#response-id-security}

預設情況下，LiteLLM Proxy 會防止使用者存取其他使用者的 response IDs。

這是透過將回應 ID 與使用者 ID 加密來完成，讓使用者只能存取自己的回應 ID。

嘗試存取他人的回應 ID 會回傳 403：

```json
{
  "error": {
    "message": "Forbidden. The response id is not associated with the user, who this key belongs to.",
    "code": 403
  }
}
```

若要停用此功能，請設定 `disable_responses_id_security: true`：

```yaml
general_settings:
  disable_responses_id_security: true
```

這允許任何使用者存取任何回應 ID。

## 支援的 Responses API 參數 {#supported-responses-api-parameters}

| 提供者 | 支援的參數 |
|----------|---------------------|
| `openai` | [支援所有 Responses API 參數](https://github.com/BerriAI/litellm/blob/7c3df984da8e4dff9201e4c5353fdc7a2b441831/litellm/llms/openai/responses/transformation.py#L23) |
| `azure` | [支援所有 Responses API 參數](https://github.com/BerriAI/litellm/blob/7c3df984da8e4dff9201e4c5353fdc7a2b441831/litellm/llms/openai/responses/transformation.py#L23) |
| `anthropic` | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |
| `bedrock` | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |
| `gemini` | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |
| `vertex_ai` | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |
| `azure_ai` | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |
| 所有其他 llm api providers | [請見此處的支援參數](https://github.com/BerriAI/litellm/blob/f39d9178868662746f159d5ef642c7f34f9bfe5f/litellm/responses/litellm_completion_transformation/transformation.py#L57) |

## 搭配工作階段連續性的負載平衡。 {#load-balancing-with-session-continuity}

當使用 Responses API 搭配同一模型的多個部署（例如，多個 Azure OpenAI endpoints）時，LiteLLM 會提供 session continuity。這可確保使用 `previous_response_id` 的後續請求會被路由到產生原始回應的相同部署。

#### 使用範例 {#example-usage}

<Tabs>
<TabItem value="python-sdk" label="Python SDK">

```python showLineNumbers title="Python SDK with Session Continuity"
import litellm

# Set up router with multiple deployments of the same model
router = litellm.Router(
    model_list=[
        {
            "model_name": "azure-gpt4-turbo",
            "litellm_params": {
                "model": "azure/gpt-4-turbo",
                "api_key": "your-api-key-1",
                "api_version": "2024-06-01",
                "api_base": "https://endpoint1.openai.azure.com",
            },
        },
        {
            "model_name": "azure-gpt4-turbo",
            "litellm_params": {
                "model": "azure/gpt-4-turbo",
                "api_key": "your-api-key-2",
                "api_version": "2024-06-01",
                "api_base": "https://endpoint2.openai.azure.com",
            },
        },
    ],
    # `responses_api_deployment_check` ensures Requests with `previous_response_id`
    # are routed to the same deployment. `deployment_affinity` adds sticky sessions
    # for requests without `previous_response_id` (useful for implicit caching).
    # `session_affinity` adds sticky sessions based on `session_id` metadata.
    optional_pre_call_checks=["responses_api_deployment_check", "deployment_affinity", "session_affinity"],
    # Optional (default is 3600 seconds / 1 hour)
    deployment_affinity_ttl_seconds=3600,
)

# Initial request
response = await router.aresponses(
    model="azure-gpt4-turbo",
    input="Hello, who are you?",
    truncation="auto",
)

# Store the response ID
response_id = response.id

# Follow-up request - will be automatically routed to the same deployment
follow_up = await router.aresponses(
    model="azure-gpt4-turbo",
    input="Tell me more about yourself",
    truncation="auto",
    previous_response_id=response_id  # This ensures routing to the same deployment
)
```

</TabItem>
<TabItem value="proxy-server" label="Proxy Server">

#### 1. 在 proxy config.yaml 上設定工作階段連續性 {#1-setup-session-continuity-on-proxy-configyaml}

若要在您的 LiteLLM proxy 中啟用 Responses API 的 session continuity，請在您的 proxy config.yaml 中設定 `optional_pre_call_checks`。

- `responses_api_deployment_check`：當提供 `previous_response_id` 時的高優先順序路由
- `encrypted_content_affinity`：**[建議]** 針對加密項目的具內容感知路由（例如，`rs_...` reasoning items）（**需要 LiteLLM >= 1.82.3**）
- `session_affinity`：依據 session id 的黏性工作階段（優先於 `deployment_affinity`）
- `deployment_affinity`：依據 user key 的黏性工作階段（即使沒有 `previous_response_id` 也適用）

:::tip 建議：使用 `encrypted_content_affinity`
若要將 Responses API 透過**不同 API 金鑰**的部署進行負載平衡，請改用 `encrypted_content_affinity`，不要使用 `deployment_affinity`。它只會將包含加密內容的請求固定到同一部署，避免降低配額，同時防止 `invalid_encrypted_content` 錯誤。（需要 LiteLLM >= 1.82.3。）
:::

備註：
- 使用者金鑰親和性會以 `metadata.user_api_key_hash`（API 金鑰雜湊）為鍵。OpenAI `user` 請求參數是終端使用者識別碼，且刻意不會用於部署親和性。
- Session-ID 親和性會以 `metadata.session_id` 為鍵。對於代理請求，可透過 `x-litellm-session-id` 或 `x-litellm-trace-id` HTTP 標頭傳入（兩者可互換，用於呼叫鏈結）。對於 Python SDK 請求，您可以在請求引數中透過 `litellm_metadata={"session_id": "value"}` 傳入。
- `user_api_key_hash` 已經是 SHA-256，並會直接原樣使用（不會再次雜湊）。
- 親和性會以穩定的模型識別碼（model-map 鍵，例如 `model_map_information.model_map_key`）為範圍，因此模型別名會對應到相同的黏性區塊。
- 對應 TTL 由 `deployment_affinity_ttl_seconds` 控制（在 Router 初始化／proxy 啟動時設定）。

```yaml showLineNumbers title="config.yaml with Session Continuity"
model_list:
  - model_name: azure-gpt4-turbo
    litellm_params:
      model: azure/gpt-4-turbo
      api_key: your-api-key-1
      api_version: 2024-06-01
      api_base: https://endpoint1.openai.azure.com
  - model_name: azure-gpt4-turbo
    litellm_params:
      model: azure/gpt-4-turbo
      api_key: your-api-key-2
      api_version: 2024-06-01
      api_base: https://endpoint2.openai.azure.com

router_settings:
  optional_pre_call_checks:
    - responses_api_deployment_check
    - session_affinity
    - deployment_affinity
  # Optional (default is 3600 seconds / 1 hour)
  deployment_affinity_ttl_seconds: 3600
```

#### 2. 使用 OpenAI Python SDK 向 LiteLLM Proxy 發出請求 {#2-use-the-openai-python-sdk-to-make-requests-to-litellm-proxy}

```python showLineNumbers title="OpenAI Client with Proxy Server"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-api-key"
)

# Initial request
response = client.responses.create(
    model="azure-gpt4-turbo",
    input="Hello, who are you?"
)

response_id = response.id

# Follow-up request - will be automatically routed to the same deployment
follow_up = client.responses.create(
    model="azure-gpt4-turbo",
    input="Tell me more about yourself",
    previous_response_id=response_id  # This ensures routing to the same deployment
)
```

</TabItem>
</Tabs>

## 加密內容親和性（多區域負載平衡） {#encrypted-content-affinity-multi-region-load-balancing}

當將 Responses API 的負載平衡跨部署且使用**不同的 API 金鑰**時（例如不同的 Azure 區域或 OpenAI 組織），加密的內容項目（例如 `rs_...` 推理項目）只能由建立它們的 API 金鑰解密。

### 問題 {#the-problem}

```json
{
  "error": {
    "message": "The encrypted content for item rs_0d09d6e56879e76500699d6feee41c8197bd268aae76141f87 could not be verified. Reason: Encrypted content organization_id did not match the target organization.",
    "type": "invalid_request_error",
    "code": "invalid_encrypted_content"
  }
}
```

當以下情況發生時，會出現此錯誤：
1. 初始請求送到 Deployment A（API Key 1）→ 產生加密項目 `rs_xyz`
2. 具有 `rs_xyz` 的後續請求在輸入中被負載平衡到 Deployment B（API Key 2）
3. Deployment B 無法解密由 Deployment A 建立的內容 → **請求失敗**

### 解決方案：`encrypted_content_affinity` {#the-solution-encrypted_content_affinity}

`encrypted_content_affinity` 呼叫前檢查會將包含加密項目的後續請求路由到原始部署，**僅在必要時**

**主要優點：**
- ✅ **不會降低配額**：不同於 `deployment_affinity`，只會固定含有加密項目的請求
- ✅ **繞過速率限制**：當加密內容需要特定部署時，會繞過 RPM/TPM 限制（否則該請求在任何其他部署上都會失敗）
- ✅ **不需要 `previous_response_id`**：透過將 `model_id` 直接編碼進項目 ID 來運作
- ✅ **不需要快取**：`model_id` 會即時解碼——不需要 Redis 依賴，也不需要管理 TTL
- ✅ **全域安全**：可對所有模型啟用；非 Responses API 呼叫（chat、embeddings）不受影響

### 運作方式 {#how-it-works}

1. **編碼階段**（在回應時）：
   - 對於每個包含 `encrypted_content` 的輸出項目，LiteLLM 會重寫該項目 ID，以嵌入原始的 `model_id`：`rs_xyz` → `encitem_{base64("litellm:model_id:{model_id};item_id:rs_xyz")}`
   - 在將請求轉送到上游提供者之前，會先還原原始項目 ID

2. **路由階段**（請求之前）：
   - 掃描請求 `input` 中是否有 `encitem_` 前綴的 ID
   - 如果找到 → 解碼 `model_id`，固定到來源部署，略過速率限制
   - 如果沒有編碼項目 → 正常負載平衡

### 組態 {#configuration-1}

<Tabs>
<TabItem value="sdk" label="Python SDK">

```python
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "gpt-5.1-codex",
            "litellm_params": {
                "model": "openai/gpt-5.1-codex",
                "api_key": "org-1-api-key",  # Different API key
            },
            "model_info": {"id": "deployment-us-east"},
        },
        {
            "model_name": "gpt-5.1-codex",
            "litellm_params": {
                "model": "openai/gpt-5.1-codex",
                "api_key": "org-2-api-key",  # Different API key
            },
            "model_info": {"id": "deployment-eu-west"},
        },
    ],
    optional_pre_call_checks=["encrypted_content_affinity"],
)

# Initial request - routes to any deployment
response1 = await router.aresponses(
    model="gpt-5.1-codex",
    input="Explain quantum computing",
)

# Follow-up with encrypted items - automatically routes to same deployment
response2 = await router.aresponses(
    model="gpt-5.1-codex",
    input=response1.output,  # Contains encrypted items from response1
)
```

</TabItem>
<TabItem value="proxy" label="Proxy Server">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-5.1-codex
    litellm_params:
      model: azure/gpt-5.1-codex
      api_base: https://eastus.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_EASTUS
      rpm: 600
      tpm: 100000
    model_info:
      id: "gpt-5.1-codex-eastus"

  - model_name: gpt-5.1-codex
    litellm_params:
      model: azure/gpt-5.1-codex
      api_base: https://westeurope.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_WESTEUROPE
      rpm: 600
      tpm: 100000
    model_info:
      id: "gpt-5.1-codex-westeurope"

router_settings:
  routing_strategy: usage-based-routing-v2
  enable_pre_call_checks: true
  optional_pre_call_checks:
    - encrypted_content_affinity
```

**啟動 proxy：**
```bash
litellm --config config.yaml
```

</TabItem>
</Tabs>

### 何時使用各種親和性類型 {#when-to-use-each-affinity-type}

| Affinity 類型 | 使用情境 | 範圍 | 配額影響 |
|---------------|----------|-------|--------------|
| **`encrypted_content_affinity`** | **[推薦]** 具有不同 API 金鑰的多區域 Responses API | 僅限有追蹤加密項目的請求 | ✅ 無（精準固定） |
| `responses_api_deployment_check` | 當 `previous_response_id` 可用時 | 具有 `previous_response_id` 的請求 | ✅ 無 |
| `session_affinity` | 以工作階段為基礎的應用程式 | 所有具有相同 `session_id` 的請求 | ⚠️ 會依工作階段數量降低配額 |
| `deployment_affinity` | 簡單的黏著式工作階段 | 來自相同 API 金鑰的所有請求 | ❌ 會依使用者數量降低配額 |

## 按模型群組的親和性組態 {#per-model-group-affinity-configuration}

預設情況下，`optional_pre_call_checks` 會全域套用到所有模型群組。當您希望每個模型群組有不同的 affinity 行為時，請使用 `model_group_affinity_config`——例如，只為跨提供者（Azure + Bedrock）分散的模型啟用黏著性，同時讓單一提供者群組自由進行負載平衡。

未列出的群組會回退至全域 `optional_pre_call_checks` 設定。

<Tabs>
<TabItem value="python-sdk" label="Python SDK">

```python
router = litellm.Router(
    model_list=[
        {
            "model_name": "gpt-4",
            "litellm_params": {"model": "azure/gpt-4", "api_key": "...", "api_base": "https://endpoint1.openai.azure.com"},
        },
        {
            "model_name": "gpt-4",
            "litellm_params": {"model": "bedrock/anthropic.claude-v2", "aws_region_name": "us-east-1"},
        },
        {
            "model_name": "text-embedding-ada-002",
            "litellm_params": {"model": "azure/text-embedding-ada-002", "api_key": "...", "api_base": "https://endpoint1.openai.azure.com"},
        },
        {
            "model_name": "text-embedding-ada-002",
            "litellm_params": {"model": "azure/text-embedding-ada-002", "api_key": "...", "api_base": "https://endpoint2.openai.azure.com"},
        },
    ],
    # gpt-4: cross-provider (Azure + Bedrock) — enable deployment affinity
    # text-embedding-ada-002: same provider — no affinity, let it load balance freely
    model_group_affinity_config={
        "gpt-4": ["deployment_affinity", "responses_api_deployment_check"],
    },
)
```

</TabItem>
<TabItem value="proxy-server" label="Proxy Server">

```yaml title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4
      api_key: os.environ/AZURE_API_KEY_1
      api_base: https://endpoint1.openai.azure.com

  - model_name: gpt-4
    litellm_params:
      model: bedrock/anthropic.claude-v2
      aws_region_name: us-east-1

  - model_name: text-embedding-ada-002
    litellm_params:
      model: azure/text-embedding-ada-002
      api_key: os.environ/AZURE_API_KEY_1
      api_base: https://endpoint1.openai.azure.com

  - model_name: text-embedding-ada-002
    litellm_params:
      model: azure/text-embedding-ada-002
      api_key: os.environ/AZURE_API_KEY_2
      api_base: https://endpoint2.openai.azure.com

router_settings:
  # gpt-4: cross-provider — enable stickiness
  # text-embedding-ada-002: not listed — load balances freely
  model_group_affinity_config:
    "gpt-4":
      - deployment_affinity
      - responses_api_deployment_check
```

</TabItem>
</Tabs>

**支援的值：** `deployment_affinity`, `responses_api_deployment_check`, `session_affinity`

## 呼叫非 Responses API 端點（`/responses` 到 `/chat/completions` 橋接） {#calling-non-responses-api-endpoints-responses-to-chatcompletions-bridge}

LiteLLM 允許您透過與 LiteLLM 的 `/chat/completions` 端點的橋接來呼叫非 Responses API 模型。這對於呼叫 Anthropic、Gemini，甚至非 Responses API 的 OpenAI 模型都很有用。

#### Python SDK 用法 {#python-sdk-usage}

```python showLineNumbers title="SDK Usage"
import litellm
import os

# Set API key
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key"

# Non-streaming response
response = litellm.responses(
    model="anthropic/claude-3-5-sonnet-20240620",
    input="Tell me a three sentence bedtime story about a unicorn.",
    max_output_tokens=100
)

print(response)
```

#### LiteLLM Proxy 用法 {#litellm-proxy-usage}

**設定設定：**

```yaml showLineNumbers title="Example Configuration"
model_list:
- model_name: anthropic-model
  litellm_params:
    model: anthropic/claude-3-5-sonnet-20240620
    api_key: os.environ/ANTHROPIC_API_KEY
```

**啟動 Proxy：**

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**發送請求：**

```bash showLineNumbers title="non-Responses API Model Request"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "anthropic-model",
    "input": "who is Michael Jordan"
  }'
```


### 針對具有自訂 `api_base` 的 `openai/` 模型的 opt-in 橋接 {#opt-in-bridge-for-openai-models-with-custom-api_base}

如果您透過帶有自訂 `api_base` 的 `openai/` 前綴，使用**相容 OpenAI 的第三方提供者**（例如 llama.cpp、vLLM、LM Studio），LiteLLM 通常會將 `/responses` 請求直接轉送到該端點。如果提供者僅支援 `/chat/completions`，請求就會失敗。

請使用以下任一方式強制啟用 `/responses` → `/chat/completions` 橋接：

1. **`use_chat_completions_api: true`** — 表示 LiteLLM 會呼叫提供者的 chat-completions API。
2. **`openai/chat_completions/<model_name>`** — 與 chat completions 上的 `responses/` 模式相同：模型 id 編碼了路由選擇。

#### Python SDK 用法 {#python-sdk-usage-1}

```python showLineNumbers title="Force bridge for custom openai/ endpoint (flag)"
import litellm

response = litellm.responses(
    model="openai/my-custom-model",
    input="Hello!",
    api_base="http://localhost:8080",
    api_key="fake-key",
    use_chat_completions_api=True,
)

print(response)
```

或者將其編碼在模型 id 中：

```python showLineNumbers title="Force bridge via openai/chat_completions/ model prefix"
import litellm

response = litellm.responses(
    model="openai/chat_completions/my-custom-model",
    input="Hello!",
    api_base="http://localhost:8080",
    api_key="fake-key",
)

print(response)
```

#### LiteLLM Proxy 用法 {#litellm-proxy-usage-1}

**設定組態：**

```yaml showLineNumbers title="config.yaml — bridge for custom openai/ endpoint"
model_list:
- model_name: my-local-model
  litellm_params:
    model: openai/my-custom-model
    api_base: http://localhost:8080/v1
    api_key: fake-key
    use_chat_completions_api: true
```

或者設定 `model: openai/chat_completions/my-custom-model`，而不是使用旗標。

**啟動 Proxy：**

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

**發出請求：**

```bash showLineNumbers title="Request via bridge"
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "my-local-model",
    "input": "Hello!"
  }'
```

當連接將 `/responses` 端點硬編碼的用戶端（例如帶有 `wire_api = "responses"` 的 OpenAI Codex CLI）到只公開 `/chat/completions` 的本機或第三方 OpenAI 相容提供者時，這特別有用。

## 伺服器端壓縮 {#server-side-compaction}

對於長時間執行的對話，您可以啟用 **伺服器端壓縮**，如此一來當渲染後的上下文大小超過門檻時，伺服器會自動即時執行壓縮並發出一個壓縮項目——不需要另外呼叫 `POST /v1/responses/compact`。

在使用 `openai` 或 `azure` 提供者時，OpenAI Responses API 支援此功能。請以壓縮項目傳入 `context_management`，以及 `compact_threshold`（token 數；最少 1000）。當上下文超過門檻時，伺服器會即時壓縮並繼續。可使用 `previous_response_id` 或將輸出項目附加到下一個輸入陣列來串接輪次。詳情請參閱 [OpenAI 壓縮指南](https://developers.openai.com/api/docs/guides/compaction)。

> **注意：** 您可以透過 LiteLLM 在 responses API 中，將 openai `context_management` 格式與 Anthropic 模型搭配使用。LiteLLM 會自動為 Anthropic 轉換此格式，並代您處理上下文管理。

若要明確控制壓縮何時執行，請改用獨立的 compact 端點（`POST /v1/responses/compact`）。

### Python SDK {#python-sdk}

```python showLineNumbers title="Server-side compaction with LiteLLM Python SDK"
import litellm

# Non-streaming: enable compaction when context exceeds 200k tokens
response = litellm.responses(
    model="openai/gpt-4o",
    input="Your conversation input...",
    context_management=[{"type": "compaction", "compact_threshold": 200000}],
    max_output_tokens=1024,
)
print(response)

# Streaming: same context_management, compaction runs in-stream if threshold is crossed
stream = litellm.responses(
    model="openai/gpt-4o",
    input="Your conversation input...",
    context_management=[{"type": "compaction", "compact_threshold": 200000}],
    stream=True,
)
for event in stream:
    print(event)
```

### LiteLLM Proxy（AI Gateway） {#litellm-proxy-ai-gateway}

使用 OpenAI SDK，將您的 Proxy 設為 `base_url`，或使用 curl 呼叫 Proxy。Proxy 會將 `context_management` 轉送給提供者。

**OpenAI Python SDK（proxy 作為 base_url）：**

```python showLineNumbers title="Server-side compaction via LiteLLM Proxy"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # LiteLLM Proxy (AI Gateway)
    api_key="your-proxy-api-key",
)

response = client.responses.create(
    model="openai/gpt-4o",
    input="Your conversation input...",
    context_management=[{"type": "compaction", "compact_threshold": 200000}],
    max_output_tokens=1024,
)
print(response)
```

**curl（proxy）：**

```bash title="Server-side compaction via curl to LiteLLM Proxy"
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "openai/gpt-4o",
    "input": "Your conversation input...",
    "context_management": [{"type": "compaction", "compact_threshold": 200000}],
    "max_output_tokens": 1024
  }'
```

## Shell 工具 {#shell-tool}

**Shell 工具**可讓模型在託管容器或本機執行環境（OpenAI Responses API）中執行命令。您傳入 `tools=[{"type": "shell", "environment": {...}}]`；`environment` 物件會設定執行環境（例如用於自動佈建容器的 `type: "container_auto"`）。完整選項請參閱 [OpenAI Shell 工具指南](https://developers.openai.com/api/docs/guides/tools-shell)。

在使用支援 Shell 工具的 `openai` 或 `azure` 提供者與模型時支援。

### Python SDK {#python-sdk-1}

```python showLineNumbers title="Shell tool with LiteLLM Python SDK"
import litellm

response = litellm.responses(
    model="openai/gpt-5.2",
    input="List files in /mnt/data and run python --version.",
    tools=[{"type": "shell", "environment": {"type": "container_auto"}}],
    tool_choice="auto",
    max_output_tokens=1024,
)
```

### LiteLLM Proxy（AI Gateway） {#litellm-proxy-ai-gateway-1}

使用 OpenAI SDK，將您的 proxy 作為 `base_url`，或使用 curl 呼叫 proxy。proxy 會將 `tools`（包括 `type: "shell"`）轉送至提供者。

**OpenAI Python SDK（proxy 作為 base_url）：**

```python showLineNumbers title="Shell tool via LiteLLM Proxy"
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-proxy-api-key",
)

response = client.responses.create(
    model="openai/gpt-5.2",
    input="List files in /mnt/data.",
    tools=[{"type": "shell", "environment": {"type": "container_auto"}}],
    tool_choice="auto",
    max_output_tokens=1024,
)
```

**curl：**

```bash title="Shell tool via curl to LiteLLM Proxy"
curl -X POST "http://localhost:4000/v1/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "openai/gpt-5.2",
    "input": "List files in /mnt/data.",
    "tools": [{"type": "shell", "environment": {"type": "container_auto"}}],
    "tool_choice": "auto",
    "max_output_tokens": 1024
  }'
```

## 檔案搜尋（向量儲存） {#file-search-vector-stores}

如需完整的 `file_search` 用法（原生 + 模擬備援）、SDK/Proxy 範例、架構圖，以及 Q&A，請參閱：

- [`File Search in the Responses API — E2E Testing Guide`](/docs/tutorials/file_search_responses_api)

## 工作階段管理 {#session-management}

LiteLLM Proxy 支援所有受支援模型的工作階段管理。這可讓您在 LiteLLM Proxy 中儲存並擷取對話歷史（狀態）。

#### 用法 {#usage-2}

1. 啟用在資料庫中儲存請求 / 回應內容

在您的 proxy config.yaml 中設定 `store_prompts_in_cold_storage: true`。啟用後，LiteLLM 會將請求和回應內容儲存在您指定的 s3 bucket 中。

```yaml showLineNumbers title="config.yaml with Session Continuity"
litellm_settings:
  callbacks: ["s3_v2"]
  cold_storage_custom_logger: s3_v2
  s3_callback_params: # learn more https://docs.litellm.ai/docs/proxy/logging#s3-buckets
    s3_bucket_name: litellm-logs   # AWS Bucket Name for S3
    s3_region_name: us-west-2      

general_settings:
  store_prompts_in_cold_storage: true
  store_prompts_in_spend_logs: true
```

2. 以沒有 `previous_response_id` 的方式送出請求 1（新工作階段）

透過送出不指定前一個回應 ID 的請求，開始新的對話。

<Tabs>
<TabItem value="curl" label="Curl">

```curl
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "anthropic/claude-3-5-sonnet-latest",
    "input": "who is Michael Jordan"
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize the client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

# Make initial request to start a new conversation
response = client.responses.create(
    model="anthropic/claude-3-5-sonnet-latest",
    input="who is Michael Jordan"
)

print(response.id)  # Store this ID for future requests in same session
print(response.output[0].content[0].text)
```

</TabItem>
</Tabs>

回應：

```json
{
  "id":"resp_123abc",
  "model":"claude-3-5-sonnet-20241022",
  "output":[{
    "type":"message",
    "content":[{
      "type":"output_text",
      "text":"Michael Jordan is widely considered one of the greatest basketball players of all time. He played for the Chicago Bulls (1984-1993, 1995-1998) and Washington Wizards (2001-2003), winning 6 NBA Championships with the Bulls."
    }]
  }]
}
```

3. 以 `previous_response_id` 送出請求 2（同一工作階段）

透過參照前一個回應 ID 來延續對話，以維持對話脈絡。

<Tabs>
<TabItem value="curl" label="Curl">

```curl
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "anthropic/claude-3-5-sonnet-latest",
    "input": "can you tell me more about him",
    "previous_response_id": "resp_123abc"
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize the client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

# Make follow-up request in the same conversation session
follow_up_response = client.responses.create(
    model="anthropic/claude-3-5-sonnet-latest",
    input="can you tell me more about him",
    previous_response_id="resp_123abc"  # ID from the previous response
)

print(follow_up_response.output[0].content[0].text)
```

</TabItem>
</Tabs>

回應：

```json
{
  "id":"resp_456def",
  "model":"claude-3-5-sonnet-20241022",
  "output":[{
    "type":"message",
    "content":[{
      "type":"output_text",
      "text":"Michael Jordan was born February 17, 1963. He attended University of North Carolina before being drafted 3rd overall by the Bulls in 1984. Beyond basketball, he built the Air Jordan brand with Nike and later became owner of the Charlotte Hornets."
    }]
  }]
}
```

4. 以沒有 `previous_response_id` 的方式送出請求 3（新工作階段）

在不參照先前脈絡的情況下開始全新的對話，以示範工作階段之間如何不維持脈絡。

<Tabs>
<TabItem value="curl" label="Curl">

```curl
curl http://localhost:4000/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "anthropic/claude-3-5-sonnet-latest",
    "input": "can you tell me more about him"
  }'
```

</TabItem>
<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize the client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="sk-1234"
)

# Make a new request without previous context
new_session_response = client.responses.create(
    model="anthropic/claude-3-5-sonnet-latest",
    input="can you tell me more about him"
    # No previous_response_id means this starts a new conversation
)

print(new_session_response.output[0].content[0].text)
```

</TabItem>
</Tabs>

回應：

```json
{
  "id":"resp_789ghi",
  "model":"claude-3-5-sonnet-20241022",
  "output":[{
    "type":"message",
    "content":[{
      "type":"output_text",
      "text":"I don't see who you're referring to in our conversation. Could you let me know which person you'd like to learn more about?"
    }]
  }]
}
```
