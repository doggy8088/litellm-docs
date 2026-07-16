import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /generateContent {#generatecontent}

使用 LiteLLM 來呼叫 Google AI 的 generateContent 端點，以進行文字生成、多模態互動與串流回應。

## 概覽  {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ |  |
| 記錄 | ✅ | 適用於所有整合 |
| 終端使用者追蹤 | ✅ | |
| 串流 | ✅ | |
| 備援 | ✅ | 於受支援的模型之間 |
| 負載平衡 | ✅ | 於受支援的模型之間 |
| 中繼資料追蹤 | ✅ | 將 trace ID、metadata 傳遞給可觀測性回呼（例如 S3、Langfuse） |

## 使用方式  {#usage}
---

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本使用">

#### 非串流範例 {#non-streaming-example}
```python showLineNumbers title="Basic Text Generation"
from litellm.google_genai import agenerate_content
from google.genai.types import ContentDict, PartDict
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

contents = ContentDict(
    parts=[
        PartDict(text="Hello, can you tell me a short joke?")
    ],
    role="user",
)

response = await agenerate_content(
    contents=contents,
    model="gemini/gemini-2.0-flash",
    max_tokens=100,
)
print(response)
```

#### 串流範例 {#streaming-example}
```python showLineNumbers title="Streaming Text Generation"
from litellm.google_genai import agenerate_content_stream
from google.genai.types import ContentDict, PartDict
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

contents = ContentDict(
    parts=[
        PartDict(text="Write a long story about space exploration")
    ],
    role="user",
)

response = await agenerate_content_stream(
    contents=contents,
    model="gemini/gemini-2.0-flash",
    max_tokens=500,
)

async for chunk in response:
    print(chunk)
```

</TabItem>

<TabItem value="sync" label="同步使用">

#### 同步非串流範例 {#sync-non-streaming-example}
```python showLineNumbers title="Sync Text Generation"
from litellm.google_genai import generate_content
from google.genai.types import ContentDict, PartDict
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

contents = ContentDict(
    parts=[
        PartDict(text="Hello, can you tell me a short joke?")
    ],
    role="user",
)

response = generate_content(
    contents=contents,
    model="gemini/gemini-2.0-flash",
    max_tokens=100,
)
print(response)
```

#### 同步串流範例 {#sync-streaming-example}
```python showLineNumbers title="Sync Streaming Text Generation"
from litellm.google_genai import generate_content_stream
from google.genai.types import ContentDict, PartDict
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

contents = ContentDict(
    parts=[
        PartDict(text="Write a long story about space exploration")
    ],
    role="user",
)

response = generate_content_stream(
    contents=contents,
    model="gemini/gemini-2.0-flash",
    max_tokens=500,
)

for chunk in response:
    print(chunk)
```

</TabItem>
</Tabs>

### LiteLLM Proxy Server {#litellm-proxy-server}

1. 設定 config.yaml

```yaml
model_list:
    - model_name: gemini-flash
      litellm_params:
        model: gemini/gemini-2.0-flash
        api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

<Tabs>
<TabItem value="gemini-proxy" label="Google GenAI SDK">

```python showLineNumbers title="Google GenAI SDK with LiteLLM Proxy"
from google.genai import Client
import os

# Configure Google GenAI SDK to use LiteLLM proxy
os.environ["GOOGLE_GEMINI_BASE_URL"] = "http://localhost:4000"
os.environ["GEMINI_API_KEY"] = "sk-1234"

client = Client()

response = client.models.generate_content(
    model="gemini-flash",
    contents=[
        {
            "parts": [{"text": "Write a short story about AI"}],
            "role": "user"
        }
    ],
    config={"max_output_tokens": 100}
)
```


</TabItem>

<TabItem value="curl-proxy" label="curl">

#### 生成內容 {#generate-content}

```bash showLineNumbers title="generateContent via LiteLLM Proxy"
curl -L -X POST 'http://localhost:4000/v1beta/models/gemini-flash:generateContent' \
-H 'content-type: application/json' \
-H 'authorization: Bearer sk-1234' \
-d '{
  "contents": [
    {
      "parts": [
        {
          "text": "Write a short story about AI"
        }
      ],
      "role": "user"
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 100
  }
}'
```

#### 串流生成內容 {#stream-generate-content}

```bash showLineNumbers title="streamGenerateContent via LiteLLM Proxy"
curl -L -X POST 'http://localhost:4000/v1beta/models/gemini-flash:streamGenerateContent' \
-H 'content-type: application/json' \
-H 'authorization: Bearer sk-1234' \
-d '{
  "contents": [
    {
      "parts": [
        {
          "text": "Write a long story about space exploration"
        }
      ],
      "role": "user"
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 500
  }
}'
```

</TabItem>
</Tabs>

## 原生請求欄位 {#native-request-fields}

`generateContent` 端點可直接替代 Google 的 [Generative Language REST API](https://ai.google.dev/api/generate-content)，因此 Google 的 `GenerateContentRequest` 作為 `generationConfig` 同層級欄位所帶的頂層欄位，會原封不動轉送給 Google。這涵蓋 `safetySettings`、`toolConfig`、`cachedContent` 與 `labels`。請將它們直接以請求本文的頂層欄位送出，就像直接呼叫 Google 時一樣；不需要將它們包在 `extra_body` 中。若您同時傳入 `extra_body`，其中明確指定的值在衝突時會優先。

<Tabs>
<TabItem value="curl-native" label="curl">

```bash showLineNumbers title="Native top-level fields via LiteLLM Proxy"
curl -L -X POST 'http://localhost:4000/v1beta/models/gemini-flash:generateContent' \
-H 'content-type: application/json' \
-H 'authorization: Bearer sk-1234' \
-d '{
  "contents": [
    {
      "parts": [{"text": "Say hi"}],
      "role": "user"
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 100
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_NONE"
    }
  ],
  "toolConfig": {
    "functionCallingConfig": {"mode": "AUTO"}
  }
}'
```

</TabItem>

<TabItem value="sdk-native" label="LiteLLM Python SDK">

```python showLineNumbers title="Native top-level fields via LiteLLM Python SDK"
from litellm.google_genai import generate_content
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

response = generate_content(
    model="gemini/gemini-2.0-flash",
    contents=[{"role": "user", "parts": [{"text": "Say hi"}]}],
    safetySettings=[
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"}
    ],
    toolConfig={"functionCallingConfig": {"mode": "AUTO"}},
)
print(response)
```

</TabItem>
</Tabs>

## 相關內容  {#related}

- [將 LiteLLM 與 gemini-cli 搭配使用](../docs/tutorials/litellm_gemini_cli)
