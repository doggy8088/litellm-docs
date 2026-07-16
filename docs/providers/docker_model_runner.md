import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Docker Model Runner {#docker-model-runner}

## 概觀 {#overview}

| 屬性 | 詳細資料 |
|-------|-------|
| 說明 | Docker Model Runner 可讓您使用 Docker Desktop 在本機執行大型語言模型。 |
| LiteLLM 上的提供者路由 | `docker_model_runner/` |
| 提供者文件連結 | [Docker Model Runner ↗](https://docs.docker.com/ai/model-runner/) |
| 基礎 URL | `http://localhost:22088` |
| 支援的操作 | [`/chat/completions`](#sample-usage) |

<br />
<br />

https://docs.docker.com/ai/model-runner/

**我們支援所有 Docker Model Runner 模型，送出 completion 請求時只要將 `docker_model_runner/` 設為前綴即可**

## 快速開始 {#quick-start}

Docker Model Runner 是一項 Docker Desktop 功能，可讓您在本機執行 AI 模型。它在維持 OpenAI 相容性的同時，提供比其他本機解決方案更好的效能。

### 安裝 {#installation}

1. 安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 在 Docker Desktop 設定中啟用 Docker Model Runner
3. 透過 Docker Desktop 下載您偏好的模型

## 環境變數 {#environment-variables}

```python showLineNumbers title="Environment Variables"
os.environ["DOCKER_MODEL_RUNNER_API_BASE"] = "http://localhost:22088/engines/llama.cpp"  # Optional - defaults to this
os.environ["DOCKER_MODEL_RUNNER_API_KEY"] = "dummy-key"  # Optional - Docker Model Runner may not require auth for local instances
```

**注意：** 
- Docker Model Runner 通常在本機執行，可能不需要驗證。如果未提供金鑰，LiteLLM 預設會使用虛擬金鑰。
- API 基礎位址應包含 engine 路徑（例如，`/engines/llama.cpp`）

## API 基礎位址結構 {#api-base-structure}

Docker Model Runner 使用獨特的 URL 結構：

```
http://model-runner.docker.internal/engines/{engine}/v1/chat/completions
```

其中 `{engine}` 是您要使用的 engine（通常為 `llama.cpp`）。 

**重要：** 請在您的 `api_base` URL 中指定 engine，而不是在模型名稱中：
- ✅ 正確：`api_base="http://localhost:22088/engines/llama.cpp"`、`model="docker_model_runner/llama-3.1"`
- ❌ 錯誤：`api_base="http://localhost:22088"`、`model="docker_model_runner/llama.cpp/llama-3.1"`

## 使用方式 - LiteLLM Python SDK {#usage---litellm-python-sdk}

### 非串流 {#non-streaming}

```python showLineNumbers title="Docker Model Runner Non-streaming Completion"
import os
import litellm
from litellm import completion

# Specify the engine in the api_base URL
os.environ["DOCKER_MODEL_RUNNER_API_BASE"] = "http://localhost:22088/engines/llama.cpp"

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Docker Model Runner call
response = completion(
    model="docker_model_runner/llama-3.1", 
    messages=messages
)

print(response)
```

### 串流 {#streaming}

```python showLineNumbers title="Docker Model Runner Streaming Completion"
import os
import litellm
from litellm import completion

# Specify the engine in the api_base URL
os.environ["DOCKER_MODEL_RUNNER_API_BASE"] = "http://localhost:22088/engines/llama.cpp"

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Docker Model Runner call with streaming
response = completion(
    model="docker_model_runner/llama-3.1", 
    messages=messages,
    stream=True
)

for chunk in response:
    print(chunk)
```

### 自訂 API 基礎位址與 Engine {#custom-api-base-and-engine}

```python showLineNumbers title="Custom API Base with Different Engine"
import litellm
from litellm import completion

messages = [{"content": "Hello, how are you?", "role": "user"}]

# Specify the engine in the api_base URL
# Using a different host and engine
response = completion(
    model="docker_model_runner/llama-3.1",
    messages=messages,
    api_base="http://model-runner.docker.internal/engines/llama.cpp"
)

print(response)
```

### 使用不同的 Engine {#using-different-engines}

```python showLineNumbers title="Using a Different Engine"
import litellm
from litellm import completion

messages = [{"content": "Hello, how are you?", "role": "user"}]

# To use a different engine, specify it in the api_base
# For example, if Docker Model Runner supports other engines:
response = completion(
    model="docker_model_runner/mistral-7b",
    messages=messages,
    api_base="http://localhost:22088/engines/custom-engine"
)

print(response)
```

## 使用方式 - LiteLLM Proxy {#usage---litellm-proxy}

請將下列內容加入您的 LiteLLM Proxy 設定檔：

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: llama-3.1
    litellm_params:
      model: docker_model_runner/llama-3.1
      api_base: http://localhost:22088/engines/llama.cpp

  - model_name: mistral-7b
    litellm_params:
      model: docker_model_runner/mistral-7b
      api_base: http://localhost:22088/engines/llama.cpp
```

啟動您的 LiteLLM Proxy 伺服器：

```bash showLineNumbers title="Start LiteLLM Proxy"
litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="Docker Model Runner via Proxy - Non-streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Non-streaming response
response = client.chat.completions.create(
    model="llama-3.1",
    messages=[{"role": "user", "content": "hello from litellm"}]
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Docker Model Runner via Proxy - Streaming"
from openai import OpenAI

# Initialize client with your proxy URL
client = OpenAI(
    base_url="http://localhost:4000",  # Your proxy URL
    api_key="your-proxy-api-key"       # Your proxy API key
)

# Streaming response
response = client.chat.completions.create(
    model="llama-3.1",
    messages=[{"role": "user", "content": "hello from litellm"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

</TabItem>

<TabItem value="litellm-sdk" label="LiteLLM SDK">

```python showLineNumbers title="Docker Model Runner via Proxy - LiteLLM SDK"
import litellm

# Configure LiteLLM to use your proxy
response = litellm.completion(
    model="litellm_proxy/llama-3.1",
    messages=[{"role": "user", "content": "hello from litellm"}],
    api_base="http://localhost:4000",
    api_key="your-proxy-api-key"
)

print(response.choices[0].message.content)
```

```python showLineNumbers title="Docker Model Runner via Proxy - LiteLLM SDK Streaming"
import litellm

# Configure LiteLLM to use your proxy with streaming
response = litellm.completion(
    model="litellm_proxy/llama-3.1",
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

```bash showLineNumbers title="Docker Model Runner via Proxy - cURL"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "llama-3.1",
    "messages": [{"role": "user", "content": "hello from litellm"}]
  }'
```

```bash showLineNumbers title="Docker Model Runner via Proxy - cURL Streaming"
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-proxy-api-key" \
  -d '{
    "model": "llama-3.1",
    "messages": [{"role": "user", "content": "hello from litellm"}],
    "stream": true
  }'
```

</TabItem>
</Tabs>

如需關於使用 LiteLLM Proxy 的更詳細資訊，請參閱 [LiteLLM Proxy 文件](../providers/litellm_proxy)。

## API 參考 {#api-reference}

如需詳細的 API 資訊，請參閱 [Docker Model Runner API 參考](https://docs.docker.com/ai/model-runner/api-reference/)。
