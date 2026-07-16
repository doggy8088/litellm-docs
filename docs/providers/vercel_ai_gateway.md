import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vercel AI Gateway {#vercel-ai-gateway}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | Vercel AI Gateway 提供透過單一端點存取多個 AI 提供者的統一介面，內建快取、速率限制與分析。 |
| LiteLLM 上的提供者路由 | `vercel_ai_gateway/` |
| 提供者文件連結 | [Vercel AI Gateway 文件 ↗](https://vercel.com/docs/ai-gateway) |
| 基礎 URL | `https://ai-gateway.vercel.sh/v1` |
| 支援的操作 | `/chat/completions`, `/embeddings`, `/models` |

<br />
<br />

https://vercel.com/docs/ai-gateway

**我們支援透過 Vercel AI Gateway 可用的所有模型，只要在送出 completion 請求時將 `vercel_ai_gateway/` 設為前綴即可**

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["VERCEL_AI_GATEWAY_API_KEY"] = ""  # your Vercel AI Gateway API key
# OR
os.environ["VERCEL_OIDC_TOKEN"] = ""  # your Vercel OIDC token for authentication
```

## 選用變數 {#optional-variables}

```python showLineNumbers title="Environment Variables"
os.environ["VERCEL_SITE_URL"] = ""  # your site url
# OR
os.environ["VERCEL_APP_NAME"] = ""  # your app name
```

註：請參閱 [Vercel AI Gateway 文件](https://vercel.com/docs/ai-gateway#using-the-ai-gateway-with-an-api-key) 以取得金鑰的操作說明。

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Vercel AI Gateway Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["VERCEL_AI_GATEWAY_API_KEY"] = "your-api-key"

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Vercel AI Gateway call
response = completion(
    model="vercel_ai_gateway/openai/gpt-4o", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Vercel AI Gateway Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["VERCEL_AI_GATEWAY_API_KEY"] = "your-api-key"

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Vercel AI Gateway call with streaming
response = completion(
    model="vercel_ai_gateway/openai/gpt-4o",
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 嵌入向量 {#embeddings}

```python showLineNumbers title="Vercel AI Gateway Embeddings"
import os
from litellm import embedding

os.environ["VERCEL_AI_GATEWAY_API_KEY"] = "your-api-key"

# Vercel AI Gateway embedding call
response = embedding(
    model="vercel_ai_gateway/openai/text-embedding-3-small",
    input="Hello world"
)

print(response.data[0]["embedding"][:5])  # Print first 5 dimensions
```

您也可以指定 `dimensions` 參數：

```python showLineNumbers title="Vercel AI Gateway Embeddings with Dimensions"
response = embedding(
    model="vercel_ai_gateway/openai/text-embedding-3-small",
    input=["Hello world", "Goodbye world"],
    dimensions=768
)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請將下列內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4o-gateway
    litellm_params:
      model: vercel_ai_gateway/openai/gpt-4o
      api_key: os.environ/VERCEL_AI_GATEWAY_API_KEY

  - model_name: claude-4-sonnet-gateway
    litellm_params:
      model: vercel_ai_gateway/anthropic/claude-4-sonnet
      api_key: os.environ/VERCEL_AI_GATEWAY_API_KEY

  - model_name: text-embedding-3-small-gateway
    litellm_params:
      model: vercel_ai_gateway/openai/text-embedding-3-small
      api_key: os.environ/VERCEL_AI_GATEWAY_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Vercel AI Gateway via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="gpt-4o-gateway",
    messages=[{"role": "user", "content": "Hello, how are you?"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Vercel AI Gateway via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="gpt-4o-gateway",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Vercel AI Gateway via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/gpt-4o-gateway",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Vercel AI Gateway via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/gpt-4o-gateway",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
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

```bash showLineNumbers title="Vercel AI Gateway via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "gpt-4o-gateway",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

```bash showLineNumbers title="Vercel AI Gateway via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "gpt-4o-gateway",
    "messages": [{"role": "user", "content": "Hello, how are you?"}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需關於使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。

## 其他資源 {#additional-resources}

- [Vercel AI Gateway 文件](https://vercel.com/docs/ai-gateway)
