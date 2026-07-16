import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# PublicAI {#publicai}

## 總覽 {#overview}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | PublicAI 提供大型語言模型，包括 swiss-ai apertus 模型等關鍵模型。 |
| LiteLLM 提供者路由 | `publicai/` |
| 提供者文件連結 | [PublicAI ↗](https://platform.publicai.co/) |
| Base URL | `https://platform.publicai.co/` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

https://platform.publicai.co/

**我們支援所有 PublicAI 模型，只要在送出 completion 請求時將 `publicai/` 設為前綴即可**

## 必要變數 {#required-variables}

```python showLineNumbers title="Environment Variables"
os.environ["PUBLICAI_API_KEY"] = ""  # your PublicAI API key
```

您可以使用以下方式覆寫 base url：

```
os.environ["PUBLICAI_API_BASE"] = "https://platform.publicai.co/v1"
```

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="PublicAI Non-streaming Completion"
import os
import litellm
from litellm import completion

os.environ["PUBLICAI_API_KEY"] = ""  # your PublicAI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# PublicAI call
response = completion(
    model="publicai/swiss-ai/apertus-8b-instruct", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="PublicAI Streaming Completion"
import os
import litellm
from litellm import completion

os.environ["PUBLICAI_API_KEY"] = ""  # your PublicAI API key

messages = [{"content": "Hello, how are you?", "role": "user"}]

# PublicAI call with streaming
response = completion(
    model="publicai/swiss-ai/apertus-8b-instruct", 
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
  - model_name: swiss-ai-apertus-8b
    litellm_params:
      model: publicai/swiss-ai/apertus-8b-instruct
      api_key: os.environ/PUBLICAI_API_KEY

  - model_name: swiss-ai-apertus-70b
    litellm_params:
      model: publicai/swiss-ai/apertus-70b-instruct
      api_key: os.environ/PUBLICAI_API_KEY
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="PublicAI via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="swiss-ai-apertus-8b",
    messages=[{"role": "user", "content": "hello from litellm"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="PublicAI via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="swiss-ai-apertus-8b",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="PublicAI via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/swiss-ai-apertus-8b",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="PublicAI via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/swiss-ai-apertus-8b",
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

```bash showLineNumbers title="PublicAI via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "swiss-ai-apertus-8b",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="PublicAI via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "swiss-ai-apertus-8b",
    "messages": [{"role": "user", "content": "hello from litellm"}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需有關使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。
