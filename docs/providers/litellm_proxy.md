import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# LiteLLM Proxy（LLM 閘道） {#litellm-proxy-llm-gateway}

| 屬性 | 詳細資訊 |
|-------|-------|
| 說明 | LiteLLM Proxy 是一個與 OpenAI 相容的閘道，可讓您透過統一 API 與多個 LLM 提供者互動。只要在模型名稱前加上 `litellm_proxy/` 前綴，即可將您的請求路由ผ่าน proxy。 |
| LiteLLM 上的提供者路由 | `litellm_proxy/`（將此前綴加到模型名稱前，以將任何請求路由到 litellm_proxy - 例如 `litellm_proxy/your-model-name`） |
| 設定 LiteLLM Gateway | [LiteLLM Gateway ↗](../simple_proxy) |
| 支援的端點 |`/chat/completions`、`/completions`、`/embeddings`、`/audio/speech`、`/audio/transcriptions`、`/images`、`/images/edits`、`/rerank` |

## 必要變數 {#required-variables}

```python
os.environ["LITELLM_PROXY_API_KEY"] = "" # "sk-1234" your litellm proxy api key 
os.environ["LITELLM_PROXY_API_BASE"] = "" # "http://localhost:4000" your litellm proxy api base
```


## 使用方式（非串流） {#usage-non-streaming}
```python
import os 
import litellm
from litellm import completion

os.environ["LITELLM_PROXY_API_KEY"] = ""

# set custom api base to your proxy
# either set .env or litellm.api_base
# os.environ["LITELLM_PROXY_API_BASE"] = ""
litellm.api_base = "your-openai-proxy-url"


messages = [{ "content": "Hello, how are you?","role": "user"}]

# litellm proxy call
response = completion(model="litellm_proxy/your-model-name", messages)
```

## 使用方式 - 每個請求傳遞 `api_base`、`api_key` {#usage---passing-api_base-api_key-per-request}

如果您需要動態設定 api_base，請直接在 completions 中傳入即可 - completions(...,api_base="your-proxy-api-base")

```python
import os 
import litellm
from litellm import completion

os.environ["LITELLM_PROXY_API_KEY"] = ""

messages = [{ "content": "Hello, how are you?","role": "user"}]

# litellm proxy call
response = completion(
    model="litellm_proxy/your-model-name", 
    messages=messages, 
    api_base = "your-litellm-proxy-url",
    api_key = "your-litellm-proxy-api-key"
)
```
## 使用方式 - 串流 {#usage---streaming}

```python
import os 
import litellm
from litellm import completion

os.environ["LITELLM_PROXY_API_KEY"] = ""

messages = [{ "content": "Hello, how are you?","role": "user"}]

# openai call
response = completion(
    model="litellm_proxy/your-model-name", 
    messages=messages,
    api_base = "your-litellm-proxy-url", 
    stream=True
)

for chunk in response:
    print(chunk)
```

## 嵌入 {#embeddings}

```python
import litellm

response = litellm.embedding(
    model="litellm_proxy/your-embedding-model",
    input="Hello world",
    api_base="your-litellm-proxy-url",
    api_key="your-litellm-proxy-api-key"
)
```

## 影像生成 {#image-generation}

```python
import litellm

response = litellm.image_generation(
    model="litellm_proxy/dall-e-3",
    prompt="A beautiful sunset over mountains",
    api_base="your-litellm-proxy-url",
    api_key="your-litellm-proxy-api-key"
)
```

## 影像編輯 {#image-edit}

```python
import litellm

with open("your-image.png", "rb") as f:
    response = litellm.image_edit(
        model="litellm_proxy/gpt-image-1",
        prompt="Make this image a watercolor painting",
        image=[f],
        api_base="your-litellm-proxy-url",
        api_key="your-litellm-proxy-api-key",
    )
```

## 音訊轉錄 {#audio-transcription}

```python
import litellm

response = litellm.transcription(
    model="litellm_proxy/whisper-1",
    file="your-audio-file",
    api_base="your-litellm-proxy-url",
    api_key="your-litellm-proxy-api-key"
)
```

## 文字轉語音 {#text-to-speech}

```python
import litellm

response = litellm.speech(
    model="litellm_proxy/tts-1",
    input="Hello world",
    api_base="your-litellm-proxy-url",
    api_key="your-litellm-proxy-api-key"
)
``` 

## 重新排序 {#rerank}

```python
import litellm

import litellm

response = litellm.rerank(
    model="litellm_proxy/rerank-english-v2.0",
    query="What is machine learning?",
    documents=[
        "Machine learning is a field of study in artificial intelligence",
        "Biology is the study of living organisms"
    ],
    api_base="your-litellm-proxy-url",
    api_key="your-litellm-proxy-api-key"
)
```


## 與其他程式庫整合 {#integration-with-other-libraries}

LiteLLM Proxy 可與 Langchain、LlamaIndex、OpenAI JS、Anthropic SDK、Instructor 等順暢搭配使用。

[了解如何使用 LiteLLM proxy 搭配這些程式庫 →](../proxy/user_keys)

## 將所有 SDK 請求送至 LiteLLM Proxy {#send-all-sdk-requests-to-litellm-proxy}

:::info

需要 v1.72.1 或更高版本。

:::

當您從任何已使用 LiteLLM SDK 的程式庫／程式碼庫呼叫 LiteLLM Proxy 時，請使用此功能。

啟用這些旗標後，所有請求都會透過您的 LiteLLM proxy 路由，不論指定的模型為何。

啟用後，請求將使用 `LITELLM_PROXY_API_BASE` 作為驗證，並使用 `LITELLM_PROXY_API_KEY`。

### 選項 1：在程式碼中全域設定 {#option-1-set-globally-in-code}

```python
# Set the flag globally for all requests
litellm.use_litellm_proxy = True

response = litellm.completion(
    model="vertex_ai/gemini-2.0-flash-001",
    messages=[{"role": "user", "content": "Hello, how are you?"}]
)
```

### 選項 2：透過環境變數控制 {#option-2-control-via-environment-variable}

```python
# Control proxy usage through environment variable
os.environ["USE_LITELLM_PROXY"] = "True"

response = litellm.completion(
    model="vertex_ai/gemini-2.0-flash-001",
    messages=[{"role": "user", "content": "Hello, how are you?"}]
)
```

### 選項 3：每個請求設定 {#option-3-set-per-request}

```python
# Enable proxy for specific requests only
response = litellm.completion(
    model="vertex_ai/gemini-2.0-flash-001",
    messages=[{"role": "user", "content": "Hello, how are you?"}],
    use_litellm_proxy=True
)
```

## OAuth2/JWT 驗證 {#oauth2jwt-authentication}

如果您的 LiteLLM Proxy 需要 OAuth2/JWT 驗證（例如 Azure AD、Keycloak、Okta），SDK 可以自動為您取得並重新整理權杖。

```python
import litellm
from litellm.proxy_auth import AzureADCredential, ProxyAuthHandler

litellm.proxy_auth = ProxyAuthHandler(
    credential=AzureADCredential(),
    scope="api://my-litellm-proxy/.default"
)
litellm.api_base = "https://my-proxy.example.com"

response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

[進一步了解 SDK Proxy 驗證（OAuth2/JWT 自動更新） →](../proxy_auth)

## 傳送 `tags` 到 LiteLLM Proxy {#sending-tags-to-litellm-proxy}

標籤可讓您為 API 請求分類並追蹤，以進行監控、除錯與分析。您可以使用 `extra_body` 參數，將標籤以字串清單的形式傳送至 LiteLLM Proxy。

### 使用方式 {#usage}

在您的 completion 請求中，透過 `extra_body` 參數加入標籤即可傳送：

```python showLineNumbers title="Usage"
import litellm

response = litellm.completion(
    model="gpt-4",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    api_base="http://localhost:4000",
    api_key="sk-1234",
    extra_body={"tags": ["user:ishaan", "department:engineering", "priority:high"]}
)
```

### 非同步使用方式 {#async-usage}

```python showLineNumbers title="Async Usage"
import litellm

response = await litellm.acompletion(
    model="gpt-4",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    api_base="http://localhost:4000", 
    api_key="sk-1234",
    extra_body={"tags": ["user:ishaan", "department:engineering"]}
)
```
