import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Amazon Nova {#amazon-nova}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Amazon Nova 是一系列由 Amazon 建立的基礎模型，提供前沿智慧與業界領先的價格效能。 |
| LiteLLM 提供者路由 | `amazon_nova/` |
| 提供者文件 | [Amazon Nova ↗](https://docs.aws.amazon.com/nova/latest/userguide/what-is-nova.html) |
| 支援的 OpenAI 端點 | `/chat/completions`, `v1/responses` |
| 其他支援的端點 | `v1/messages`, `/generateContent` | 

## 驗證 {#authentication}

Amazon Nova 使用 API 金鑰驗證。您可以從 [Amazon Nova developer console ↗](https://nova.amazon.com/dev/documentation) 取得您的 API 金鑰。

```bash
export AMAZON_NOVA_API_KEY="your-api-key"
```

## 用法 {#usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

# Set your API key
os.environ["AMAZON_NOVA_API_KEY"] = "your-api-key"

response = completion(
    model="amazon_nova/nova-micro-v1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello, how are you?"}
    ]
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: amazon-nova-micro
    litellm_params:
      model: amazon_nova/nova-micro-v1
      api_key: os.environ/AMAZON_NOVA_API_KEY
```
### 2. 啟動 proxy {#2-start-the-proxy}
```bash
litellm --config /path/to/config.yaml
```

### 3. 測試它 {#3-test-it}

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "amazon-nova-micro",
    "messages": [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ]
}'
```

</TabItem>
</Tabs>

## 支援的模型 {#supported-models}

| 模型名稱 | 用法 | 上下文視窗 |
|------------|-------|----------------|
| Nova Micro | `completion(model="amazon_nova/nova-micro-v1", messages=messages)` | 128K tokens |
| Nova Lite | `completion(model="amazon_nova/nova-lite-v1", messages=messages)` | 300K tokens |
| Nova Pro | `completion(model="amazon_nova/nova-pro-v1", messages=messages)` | 300K tokens |
| Nova Premier | `completion(model="amazon_nova/nova-premier-v1", messages=messages)` | 1M tokens |

## 用法 - 串流 {#usage---streaming}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AMAZON_NOVA_API_KEY"] = "your-api-key"

response = completion(
    model="amazon_nova/nova-micro-v1",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Tell me about machine learning"}
    ],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "amazon-nova-micro",
    "messages": [
        {
            "role": "user",
            "content": "Tell me about machine learning"
        }
    ],
    "stream": true
}'
```

</TabItem>
</Tabs>

## 用法 - 函式呼叫 / 工具使用 {#usage---function-calling--tool-usage}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AMAZON_NOVA_API_KEY"] = "your-api-key"

tools = [
    {
        "type": "function",
        "function": {
            "name": "getCurrentWeather",
            "description": "Get the current weather in a given city",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City and country e.g. San Francisco, CA"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = completion(
    model="amazon_nova/nova-micro-v1",
    messages=[
        {"role": "user", "content": "What's the weather like in San Francisco?"}
    ],
    tools=tools
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "amazon-nova-micro",
    "messages": [
        {
            "role": "user",
            "content": "What'\''s the weather like in San Francisco?"
        }
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "getCurrentWeather",
                "description": "Get the current weather in a given city",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and country e.g. San Francisco, CA"
                        }
                    },
                    "required": ["location"]
                }
            }
        }
    ]
}'
```

</TabItem>
</Tabs>

## 設定 temperature、top_p 等 {#set-temperature-top_p-etc}

<Tabs>
<TabItem value="sdk" label="SDK">

```python
import os
from litellm import completion

os.environ["AMAZON_NOVA_API_KEY"] = "your-api-key"

response = completion(
    model="amazon_nova/nova-pro-v1",
    messages=[
        {"role": "user", "content": "Write a creative story"}
    ],
    temperature=0.8,
    max_tokens=500,
    top_p=0.9
)

print(response)
```

</TabItem>
<TabItem value="proxy" label="PROXY">

**在 yaml 中設定**

```yaml
model_list:
  - model_name: amazon-nova-pro
    litellm_params:
      model: amazon_nova/nova-pro-v1
      temperature: 0.8
      max_tokens: 500
      top_p: 0.9
```
**在請求中設定**
```bash
curl --location 'http://0.0.0.0:4000/chat/completions' \
--header 'Content-Type: application/json' \
--data '{
    "model": "amazon-nova-pro",
    "messages": [
        {
            "role": "user",
            "content": "Write a creative story"
        }
    ],
    "temperature": 0.8,
    "max_tokens": 500,
    "top_p": 0.9
}'
```

</TabItem>
</Tabs>

## 模型比較 {#model-comparison}

| 模型 | 適用情境 | 速度 | 成本 | 上下文 |
|-------|----------|-------|------|---------|
| **Nova Micro** | 簡單任務、高吞吐量 | 最快 | 最低 | 128K |
| **Nova Lite** | 平衡效能 | 快 | 低 | 300K |
| **Nova Pro** | 複雜推理 | 中等 | 中等 | 300K |
| **Nova Premier** | 最先進的任務 | 較慢 | 較高 | 1M |

## 錯誤處理 {#error-handling}

常見錯誤代碼及其意義：

- `401 Unauthorized`: 無效的 API 金鑰
- `429 Too Many Requests`: 已超過速率限制
- `400 Bad Request`: 無效的請求格式
- `500 Internal Server Error`: 服務暫時無法使用
