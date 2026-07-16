import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Moonshot AI {#moonshot-ai}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Moonshot AI 提供大型語言模型，包括 moonshot-v1 系列和 kimi 模型。 |
| LiteLLM 上的提供者路由 | `moonshot/` |
| 提供者文件連結 | [Moonshot AI ↗](https://platform.moonshot.ai/) |
| Base URL | `https://api.moonshot.ai/` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

https://platform.moonshot.ai/

**我們支援所有 Moonshot AI 模型，只要在送出 completion 請求時將 `moonshot/` 設為前綴即可**

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["MOONSHOT_API_KEY"] = ""  # your Moonshot AI API key
```

**注意：**

Moonshot AI 提供兩個不同的 API 端點：全球端點與中國專用端點。
- 全球 API Base URL: `https://api.moonshot.ai/v1`（這是目前實作的端點）
- 中國 API Base URL: `https://api.moonshot.cn/v1`

您可以用以下方式覆寫 base url：

```
os.environ["MOONSHOT_API_BASE"] = "https://api.moonshot.cn/v1"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Moonshot Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["MOONSHOT_API_KEY"] = ""  # your Moonshot AI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Moonshot call
response = completion(
    model="moonshot/moonshot-v1-8k", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Moonshot Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["MOONSHOT_API_KEY"] = ""  # your Moonshot AI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Moonshot call with streaming
response = completion(
    model="moonshot/moonshot-v1-8k", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

將以下內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: moonshot-v1-8k
    litellm_params:
      model: moonshot/moonshot-v1-8k
      api_key: os.environ/MOONSHOT_API_KEY

  - model_name: moonshot-v1-32k
    litellm_params:
      model: moonshot/moonshot-v1-32k
      api_key: os.environ/MOONSHOT_API_KEY

  - model_name: moonshot-v1-128k
    litellm_params:
      model: moonshot/moonshot-v1-128k
      api_key: os.environ/MOONSHOT_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Moonshot via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="moonshot-v1-8k",
    messages=[{"role": "user", "content": "hello from litellm"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Moonshot via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="moonshot-v1-8k",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Moonshot via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/moonshot-v1-8k",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Moonshot via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/moonshot-v1-8k",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key",
    stream=True
)

for chunk in response:
    if hasattr(chunk.choices[0], 'delta') and chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Moonshot via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="Moonshot via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [{"role": "user", "content": "hello from litellm"}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需更詳細的 LiteLLM Proxy 使用資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。

## 圖片 / 視覺支援 {#image--vision-support}

Moonshot 視覺模型（`kimi-k2.5`、`kimi-latest`、`moonshot-v1-*-vision-preview` 等）接受標準 OpenAI content array，並支援 `image_url` blocks。

LiteLLM 會自動偵測您的訊息何時包含圖片，並保留 content array，讓圖片 payload 能送達 Moonshot API。對於純文字請求，content 會依 Moonshot 文字模型的需求攤平成一般字串。

```python showLineNumbers title="Moonshot Vision Example"
import os
import litellm

os.environ["MOONSHOT_API_KEY"] = ""

response = litellm.completion(
    model="moonshot/kimi-k2.5",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this image?"},
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/image.png"},
                },
            ],
        }
    ],
)

print(response.choices[0].message.content)
```

## Moonshot AI 限制與 LiteLLM 處理方式 {#moonshot-ai-limitations--litellm-handling}

LiteLLM 會自動處理以下 [Moonshot AI 限制](https://platform.moonshot.ai/docs/guide/migrating-from-openai-to-kimi#about-api-compatibility)，以提供無縫的 OpenAI 相容性：

### Temperature 範圍限制 {#temperature-range-limitation}
**限制**：Moonshot AI 只支援 temperature 範圍 [0, 1]（相較於 OpenAI 的 [0, 2]）  
**LiteLLM 處理方式**：自動將任何大於 1 的 temperature 限制為 1

### Temperature + 多重輸出限制   {#temperature--multiple-outputs-limitation}
**限制**：如果 temperature < 0.3 且 n > 1，Moonshot AI 會拋出例外  
**LiteLLM 處理方式**：在偵測到此條件時，自動將 temperature 設為 0.3

### 不支援 Tool Choice「Required」 {#tool-choice-required-not-supported}
**限制**：Moonshot AI 不支援 `tool_choice="required"`  
**LiteLLM 處理方式**：透過以下方式轉換：
- 新增訊息："Please select a tool to handle the current issue."
- 從請求中移除 `tool_choice` 參數
