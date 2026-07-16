import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Bedrock 匯入模型 {#bedrock-imported-models}

Bedrock 匯入模型（Deepseek、Deepseek R1、Qwen、OpenAI 相容模型）

### Deepseek R1 {#deepseek-r1}

這是一條獨立路由，因為聊天範本不同。

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/deepseek_r1/{model_arn}` |
| 提供者文件 | [Bedrock Imported Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html), [Deepseek Bedrock Imported Model](https://aws.amazon.com/blogs/machine-learning/deploy-deepseek-r1-distilled-llama-models-with-amazon-bedrock-custom-model-import/) |

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

response = completion(
    model="bedrock/deepseek_r1/arn:aws:bedrock:us-east-1:086734376398:imported-model/r4c4kewx2s0n",  # bedrock/deepseek_r1/{your-model-arn}
    messages=[{"role": "user", "content": "Tell me a joke"}],
)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml
model_list:
    - model_name: DeepSeek-R1-Distill-Llama-70B
      litellm_params:
        model: bedrock/deepseek_r1/arn:aws:bedrock:us-east-1:086734376398:imported-model/r4c4kewx2s0n

```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "DeepSeek-R1-Distill-Llama-70B", # 👈 the 'model_name' in config
            "messages": [
                {
                "role": "user",
                "content": "what llm are you"
                }
            ],
        }'
```

</TabItem>
</Tabs>

### Deepseek（非 R1） {#deepseek-not-r1}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/llama/{model_arn}` |
| 提供者文件 | [Bedrock Imported Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html), [Deepseek Bedrock Imported Model](https://aws.amazon.com/blogs/machine-learning/deploy-deepseek-r1-distilled-llama-models-with-amazon-bedrock-custom-model-import/) |

使用此路由可呼叫遵循 `llama` Invoke Request / Response 規格的 Bedrock 匯入模型

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

response = completion(
    model="bedrock/llama/arn:aws:bedrock:us-east-1:086734376398:imported-model/r4c4kewx2s0n",  # bedrock/llama/{your-model-arn}
    messages=[{"role": "user", "content": "Tell me a joke"}],
)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml
model_list:
    - model_name: DeepSeek-R1-Distill-Llama-70B
      litellm_params:
        model: bedrock/llama/arn:aws:bedrock:us-east-1:086734376398:imported-model/r4c4kewx2s0n

```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "DeepSeek-R1-Distill-Llama-70B", # 👈 the 'model_name' in config
            "messages": [
                {
                "role": "user",
                "content": "what llm are you"
                }
            ],
        }'
```

</TabItem>
</Tabs>

### Qwen3 匯入模型 {#qwen3-imported-models}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/qwen3/{model_arn}` |
| 提供者文件 | [Bedrock Imported Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html), [Qwen3 Models](https://aws.amazon.com/about-aws/whats-new/2025/09/qwen3-models-fully-managed-amazon-bedrock/) |

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

response = completion(
    model="bedrock/qwen3/arn:aws:bedrock:us-east-1:086734376398:imported-model/your-qwen3-model",  # bedrock/qwen3/{your-model-arn}
    messages=[{"role": "user", "content": "Tell me a joke"}],
    max_tokens=100,
    temperature=0.7
)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml
model_list:
    - model_name: Qwen3-32B
      litellm_params:
        model: bedrock/qwen3/arn:aws:bedrock:us-east-1:086734376398:imported-model/your-qwen3-model

```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "Qwen3-32B", # 👈 the 'model_name' in config
            "messages": [
                {
                "role": "user",
                "content": "what llm are you"
                }
            ],
        }'
```

</TabItem>
</Tabs>

### Qwen2 匯入模型 {#qwen2-imported-models}

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/qwen2/{model_arn}` |
| 提供者文件 | [Bedrock Imported Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html) |
| Note | Qwen2 與 Qwen3 架構大致相似。主要差異在回應格式：Qwen2 使用「text」欄位，而 Qwen3 使用「generation」欄位。 |

<Tabs>
<TabItem value="sdk" label="SDK">

```python
from litellm import completion
import os

response = completion(
    model="bedrock/qwen2/arn:aws:bedrock:us-east-1:086734376398:imported-model/your-qwen2-model",  # bedrock/qwen2/{your-model-arn}
    messages=[{"role": "user", "content": "Tell me a joke"}],
    max_tokens=100,
    temperature=0.7
)
```

</TabItem>

<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml
model_list:
    - model_name: Qwen2-72B
      litellm_params:
        model: bedrock/qwen2/arn:aws:bedrock:us-east-1:086734376398:imported-model/your-qwen2-model

```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "Qwen2-72B", # 👈 the 'model_name' in config
            "messages": [
                {
                "role": "user",
                "content": "what llm are you"
                }
            ],
        }'
```

</TabItem>
</Tabs>

### OpenAI 相容匯入模型（Qwen 2.5 VL 等） {#openai-compatible-imported-models-qwen-25-vl-etc}

使用此路由可處理遵循 **OpenAI Chat Completions API 規格** 的 Bedrock 匯入模型。這包括像 Qwen 2.5 VL 這類接受 OpenAI 格式訊息的模型，並支援 vision（圖片）、tool calling 及其他 OpenAI 功能。

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/openai/{model_arn}` |
| 提供者文件 | [Bedrock Imported Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-import-model.html) |
| Supported Features | Vision（圖片）、tool calling、串流、system 訊息 |

#### LiteLLMSDK 使用方式 {#litellmsdk-usage}

**基本使用**

```python
from litellm import completion

response = completion(
    model="bedrock/openai/arn:aws:bedrock:us-east-1:046319184608:imported-model/0m2lasirsp6z",  # bedrock/openai/{your-model-arn}
    messages=[{"role": "user", "content": "Tell me a joke"}],
    max_tokens=300,
    temperature=0.5
)
```

**搭配 Vision（圖片）**

```python
import base64
from litellm import completion

# Load and encode image
with open("image.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode("utf-8")

response = completion(
    model="bedrock/openai/arn:aws:bedrock:us-east-1:046319184608:imported-model/0m2lasirsp6z",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant that can analyze images."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                }
            ]
        }
    ],
    max_tokens=300,
    temperature=0.5
)
```

**比較多張圖片**

```python
import base64
from litellm import completion

# Load images
with open("image1.jpg", "rb") as f:
    image1_base64 = base64.b64encode(f.read()).decode("utf-8")
with open("image2.jpg", "rb") as f:
    image2_base64 = base64.b64encode(f.read()).decode("utf-8")

response = completion(
    model="bedrock/openai/arn:aws:bedrock:us-east-1:046319184608:imported-model/0m2lasirsp6z",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant that can analyze images."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Spot the difference between these two images?"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image1_base64}"}
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image2_base64}"}
                }
            ]
        }
    ],
    max_tokens=300,
    temperature=0.5
)
```

#### LiteLLM Proxy 使用方式（AI Gateway） {#litellm-proxy-usage-ai-gateway}

**1. 新增至設定**

```yaml
model_list:
    - model_name: qwen-25vl-72b
      litellm_params:
        model: bedrock/openai/arn:aws:bedrock:us-east-1:046319184608:imported-model/0m2lasirsp6z
```

**2. 啟動 proxy**

```bash
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

基本文字請求：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "qwen-25vl-72b",
            "messages": [
                {
                    "role": "user",
                    "content": "what llm are you"
                }
            ],
            "max_tokens": 300
        }'
```

搭配 vision（圖片）：

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
      --header 'Authorization: Bearer sk-1234' \
      --header 'Content-Type: application/json' \
      --data '{
            "model": "qwen-25vl-72b",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that can analyze images."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What is in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQSkZ..."}
                        }
                    ]
                }
            ],
            "max_tokens": 300,
            "temperature": 0.5
        }'
```

### Moonshot Kimi K2 Thinking {#moonshot-kimi-k2-thinking}

Moonshot AI 的 Kimi K2 Thinking 模型現已於 Amazon Bedrock 上提供。此模型具備進階推理能力，並可自動擷取推理內容。

| 屬性 | 詳細資訊 |
|----------|---------|
| 提供者路由 | `bedrock/moonshot.kimi-k2-thinking`, `bedrock/invoke/moonshot.kimi-k2-thinking` |
| 提供者文件 | [AWS Bedrock Moonshot Announcement ↗](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-bedrock-fully-managed-open-weight-models/) |
| 支援的參數 | `temperature`, `max_tokens`, `top_p`, `stream`, `tools`, `tool_choice` |
| Special Features | 推理內容擷取、tool calling |

#### 支援功能 {#supported-features}

- **推理內容擷取**：自動擷取 `<reasoning>` 標籤，並將其以 `reasoning_content` 回傳（類似 OpenAI 的 o1 模型）
- **Tool Calling**：完整支援 function/tool calling 與 tool 回應
- **Streaming**：支援串流與非串流回應
- **System Messages**：支援 system 訊息

#### 基本使用 {#basic-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python title="Moonshot Kimi K2 SDK Usage" showLineNumbers
from litellm import completion
import os

os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"  # or your preferred region

# Basic completion
response = completion(
    model="bedrock/moonshot.kimi-k2-thinking",  # or bedrock/invoke/moonshot.kimi-k2-thinking
    messages=[
        {"role": "user", "content": "What is 2+2? Think step by step."}
    ],
    temperature=0.7,
    max_tokens=200
)

print(response.choices[0].message.content)

# Access reasoning content if present
if response.choices[0].message.reasoning_content:
    print("Reasoning:", response.choices[0].message.reasoning_content)
```

</TabItem>
<TabItem value="proxy" label="Proxy">

**1. 新增至設定**

```yaml title="config.yaml" showLineNumbers
model_list:
  - model_name: kimi-k2
    litellm_params:
      model: bedrock/moonshot.kimi-k2-thinking
      aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
      aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
      aws_region_name: us-west-2
```

**2. 啟動 proxy**

```bash title="Start LiteLLM Proxy" showLineNumbers
litellm --config /path/to/config.yaml

# RUNNING at http://0.0.0.0:4000
```

**3. 測試它！**

```bash title="Test Kimi K2 via Proxy" showLineNumbers
curl --location 'http://0.0.0.0:4000/chat/completions' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "kimi-k2",
    "messages": [
      {
        "role": "user",
        "content": "What is 2+2? Think step by step."
      }
    ],
    "temperature": 0.7,
    "max_tokens": 200
  }'
```

</TabItem>
</Tabs>

#### Tool Calling 範例 {#tool-calling-example}

```python title="Kimi K2 with Tool Calling" showLineNumbers
from litellm import completion
import os

os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"

# Tool calling example
response = completion(
    model="bedrock/moonshot.kimi-k2-thinking",
    messages=[
        {"role": "user", "content": "What's the weather in Tokyo?"}
    ],
    tools=[
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
                            "description": "The city name"
                        }
                    },
                    "required": ["location"]
                }
            }
        }
    ]
)

if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    print(f"Tool called: {tool_call.function.name}")
    print(f"Arguments: {tool_call.function.arguments}")
```

#### 串流範例 {#streaming-example}

```python title="Kimi K2 Streaming" showLineNumbers
from litellm import completion
import os

os.environ["AWS_ACCESS_KEY_ID"] = "your-aws-access-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-aws-secret-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"

response = completion(
    model="bedrock/moonshot.kimi-k2-thinking",
    messages=[
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    stream=True,
    temperature=0.7
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
    
    # Check for reasoning content in streaming
    if hasattr(chunk.choices[0].delta, 'reasoning_content') and chunk.choices[0].delta.reasoning_content:
        print(f"\n[Reasoning: {chunk.choices[0].delta.reasoning_content}]")
```

#### 支援參數 {#supported-parameters}

| 參數 | 類型 | 說明 | Supported |
|-----------|------|-------------|-----------|
| `temperature` | float (0-1) | 控制輸出的隨機性 | ✅ |
| `max_tokens` | integer | 可生成的最大 token 數 | ✅ |
| `top_p` | float | 核心採樣參數 | ✅ |
| `stream` | boolean | 啟用串流回應 | ✅ |
| `tools` | array | tool/function 定義 | ✅ |
| `tool_choice` | string/object | tool 選擇規格 | ✅ |
| `stop` | array | 停止序列 | ❌（Bedrock 不支援） |
