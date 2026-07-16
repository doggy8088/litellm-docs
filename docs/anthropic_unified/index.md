import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /v1/messages {#v1messages}

使用 LiteLLM 以 Anthropic `v1/messages` 格式呼叫您所有的 LLM API。

## 概覽  {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 可與所有支援的模型搭配運作 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 最終使用者追蹤 | ✅ | |
| 串流 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 防護欄 | ✅ | 套用於輸入與輸出文字（僅限非串流） |
| 支援的提供者 | **所有 LiteLLM 支援的提供者** | `openai`、`anthropic`、`bedrock`、`vertex_ai`、`gemini`、`azure`、`azure_ai` 等。 |

## 用法  {#usage}
---

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="anthropic" label="Anthropic">

#### 非串流範例 {#non-streaming-example}
```python showLineNumbers title="Anthropic Example using LiteLLM Python SDK"
import litellm
response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    api_key=api_key,
    model="anthropic/claude-3-haiku-20240307",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example}
```python showLineNumbers title="Anthropic Streaming Example using LiteLLM Python SDK"
import litellm
response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    api_key=api_key,
    model="anthropic/claude-3-haiku-20240307",
    max_tokens=100,
    stream=True,
)
async for chunk in response:
    print(chunk)
```

</TabItem>

<TabItem value="openai" label="OpenAI">

#### 非串流範例 {#non-streaming-example-1}
```python showLineNumbers title="OpenAI Example using LiteLLM Python SDK"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="openai/gpt-4",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example-1}
```python showLineNumbers title="OpenAI Streaming Example using LiteLLM Python SDK"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="openai/gpt-4",
    max_tokens=100,
    stream=True,
)
async for chunk in response:
    print(chunk)
```

</TabItem>

<TabItem value="gemini" label="Google AI Studio">

#### 非串流範例 {#non-streaming-example-2}
```python showLineNumbers title="Google Gemini Example using LiteLLM Python SDK"
import litellm
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="gemini/gemini-2.0-flash-exp",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example-2}
```python showLineNumbers title="Google Gemini Streaming Example using LiteLLM Python SDK"
import litellm
import os

# Set API key
os.environ["GEMINI_API_KEY"] = "your-gemini-api-key"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="gemini/gemini-2.0-flash-exp",
    max_tokens=100,
    stream=True,
)
async for chunk in response:
    print(chunk)
```

</TabItem>

<TabItem value="vertex" label="Vertex AI">

#### 非串流範例 {#non-streaming-example-3}
```python showLineNumbers title="Vertex AI Example using LiteLLM Python SDK"
import litellm
import os

# Set credentials - Vertex AI uses application default credentials
# Run 'gcloud auth application-default login' to authenticate
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="vertex_ai/gemini-2.0-flash-exp",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example-3}
```python showLineNumbers title="Vertex AI Streaming Example using LiteLLM Python SDK"
import litellm
import os

# Set credentials - Vertex AI uses application default credentials
# Run 'gcloud auth application-default login' to authenticate
os.environ["VERTEXAI_PROJECT"] = "your-gcp-project-id"
os.environ["VERTEXAI_LOCATION"] = "us-central1"

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="vertex_ai/gemini-2.0-flash-exp",
    max_tokens=100,
    stream=True,
)
async for chunk in response:
    print(chunk)
```

</TabItem>

<TabItem value="bedrock" label="AWS Bedrock">

#### 非串流範例 {#non-streaming-example-4}
```python showLineNumbers title="AWS Bedrock Example using LiteLLM Python SDK"
import litellm
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key-id"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-access-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"  # or your AWS region

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example-4}
```python showLineNumbers title="AWS Bedrock Streaming Example using LiteLLM Python SDK"
import litellm
import os

# Set AWS credentials
os.environ["AWS_ACCESS_KEY_ID"] = "your-access-key-id"
os.environ["AWS_SECRET_ACCESS_KEY"] = "your-secret-access-key"
os.environ["AWS_REGION_NAME"] = "us-west-2"  # or your AWS region

response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="bedrock/anthropic.claude-3-sonnet-20240229-v1:0",
    max_tokens=100,
    stream=True,
)
async for chunk in response:
    print(chunk)
```

</TabItem>
</Tabs>

範例回應：
```json
{
  "content": [
    {
      "text": "Hi! this is a very short joke",
      "type": "text"
    }
  ],
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "model": "claude-3-7-sonnet-20250219",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "input_tokens": 2095,
    "output_tokens": 503,
    "cache_creation_input_tokens": 2095,
    "cache_read_input_tokens": 0
  }
}
```

### LiteLLM Proxy 伺服器 {#litellm-proxy-server}

<Tabs>
<TabItem value="anthropic-proxy" label="Anthropic">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: anthropic-claude
      litellm_params:
        model: claude-3-7-sonnet-latest
        api_key: os.environ/ANTHROPIC_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python showLineNumbers title="Anthropic Example using LiteLLM Proxy Server"
import anthropic

# point anthropic sdk to litellm proxy 
client = anthropic.Anthropic(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

response = client.messages.create(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="anthropic-claude",
    max_tokens=100,
)
```

</TabItem>

<TabItem value="openai-proxy" label="OpenAI">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: openai-gpt4
      litellm_params:
        model: openai/gpt-4
        api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python showLineNumbers title="OpenAI Example using LiteLLM Proxy Server"
import anthropic

# point anthropic sdk to litellm proxy 
client = anthropic.Anthropic(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

response = client.messages.create(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="openai-gpt4",
    max_tokens=100,
)
```

</TabItem>

<TabItem value="gemini-proxy" label="Google AI Studio">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: gemini-2-flash
      litellm_params:
        model: gemini/gemini-2.0-flash-exp
        api_key: os.environ/GEMINI_API_KEY
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python showLineNumbers title="Google Gemini Example using LiteLLM Proxy Server"
import anthropic

# point anthropic sdk to litellm proxy 
client = anthropic.Anthropic(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

response = client.messages.create(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="gemini-2-flash",
    max_tokens=100,
)
```

</TabItem>

<TabItem value="vertex-proxy" label="Vertex AI">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: vertex-gemini
      litellm_params:
        model: vertex_ai/gemini-2.0-flash-exp
        vertex_project: your-gcp-project-id
        vertex_location: us-central1
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python showLineNumbers title="Vertex AI Example using LiteLLM Proxy Server"
import anthropic

# point anthropic sdk to litellm proxy 
client = anthropic.Anthropic(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

response = client.messages.create(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="vertex-gemini",
    max_tokens=100,
)
```

</TabItem>

<TabItem value="bedrock-proxy" label="AWS Bedrock">

1. 設定 config.yaml

```yaml
model_list:
    - model_name: bedrock-claude
      litellm_params:
        model: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
        aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID
        aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY
        aws_region_name: us-west-2
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 測試它！ 

```python showLineNumbers title="AWS Bedrock Example using LiteLLM Proxy Server"
import anthropic

# point anthropic sdk to litellm proxy 
client = anthropic.Anthropic(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

response = client.messages.create(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    model="bedrock-claude",
    max_tokens=100,
)
```

</TabItem>

<TabItem value="curl-proxy" label="curl">

```bash showLineNumbers title="Example using LiteLLM Proxy Server"
curl -L -X POST 'http://0.0.0.0:4000/v1/messages' \
-H 'content-type: application/json' \
-H 'x-api-key: $LITELLM_API_KEY' \
-H 'anthropic-version: 2023-06-01' \
-d '{
  "model": "anthropic-claude",
  "messages": [
    {
      "role": "user",
      "content": "Hello, can you tell me a short joke?"
    }
  ],
  "max_tokens": 100
}'
```

</TabItem>
</Tabs>

## 請求格式 {#request-format}
---

請求主體將採用 Anthropic messages API 格式。**litellm 遵循此端點的 Anthropic messages 規格。**

#### 請求主體範例 {#example-request-body}

```json
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, world"
    }
  ]
}
```

#### 必要欄位 {#required-fields}
- **model** (string):  
  模型識別碼（例如，`"claude-3-7-sonnet-20250219"`）。
- **max_tokens** (integer):  
  在停止前要生成的最大 token 數量。  
  _注意：模型可能會在達到此限制前停止；值必須大於 1。_
- **messages** (array of objects):  
  依序排列的對話輪次清單。  
  每個 message 物件必須包含：
  - **role** (enum: `"user"` 或 `"assistant"`):  
    指定該訊息的說話者。
  - **content** (string or array of content blocks):  
    構成該訊息的文字或內容區塊（例如，包含具有 `type` 的物件陣列，例如 `"text"`）。  
    _範例對應：_
    ```json
    {"role": "user", "content": "Hello, Claude"}
    ```
    等同於：
    ```json
    {"role": "user", "content": [{"type": "text", "text": "Hello, Claude"}]}
    ```

#### 選用欄位 {#optional-fields}
- **metadata** (object):  
  包含關於此請求的額外中繼資料（例如，將 `user_id` 作為不透明識別碼）。
- **stop_sequences** (array of strings):  
  自訂序列；當在生成的文字中遇到時，會使模型停止。
- **stream** (boolean):  
  指示是否使用伺服器推送事件串流回應。
- **system** (string or array):  
  提供上下文或特定指示給模型的系統提示。
- **temperature** (number):  
  控制模型回應的隨機性。有效範圍：`0 < temperature < 1`。
- **thinking** (object):
  啟用延伸思考的設定。若啟用，包含：
  - **budget_tokens** (integer):
    至少 1024 個 token（且少於 `max_tokens`）。
  - **type** (enum):
    例如，`"enabled"`。
  - **summary** (string, optional):
    啟用 thinking 區塊的摘要樣式。可能的值：`"auto"`、`"concise"`、`"detailed"`、`"disabled"`。
    當路由至非 Anthropic 提供者（例如，`openai/gpt-5.1`）時，`summary` 值會被保留並轉送至下游 API。
- **tool_choice** (object):  
  指示模型應如何使用任何提供的工具。
- **tools** (array of objects):  
  提供給模型可用工具的定義。每個工具包含：
  - **name** (string):  
    工具名稱。
  - **description** (string):  
    工具的詳細說明。
  - **input_schema** (object):  
    描述該工具預期輸入格式的 JSON schema。
- **top_k** (integer):  
  將取樣限制為前 K 個選項。
- **top_p** (number):  
  啟用 nucleus sampling，並設定累積機率截斷點。有效範圍：`0 < top_p < 1`。

## 回應格式 {#response-format}
---

回應將採用 Anthropic messages API 格式。

#### 回應範例 {#example-response}

```json
{
  "content": [
    {
      "text": "Hi! My name is Claude.",
      "type": "text"
    }
  ],
  "id": "msg_013Zva2CMHLNnXjNJJKqJ2EF",
  "model": "claude-3-7-sonnet-20250219",
  "role": "assistant",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "type": "message",
  "usage": {
    "input_tokens": 2095,
    "output_tokens": 503,
    "cache_creation_input_tokens": 2095,
    "cache_read_input_tokens": 0
  }
}
```

#### 回應欄位 {#response-fields}

- **content** (array of objects):  
  包含模型生成的內容區塊。每個區塊包含：
  - **type** (string):  
    指示內容類型（例如，`"text"`、`"tool_use"`、`"thinking"` 或 `"redacted_thinking"`）。
  - **text** (string):  
    模型生成的文字。  
    _注意：最大長度為 5,000,000 個字元。_
  - **citations** (array of objects or `null`):  
    提供引用詳細資訊的選用欄位。每個引用包含：
    - **cited_text** (string):  
      被引用的摘錄。
    - **document_index** (integer):  
      參照被引用文件的索引。
    - **document_title** (string or `null`):  
      被引用文件的標題。
    - **start_char_index** (integer):  
      引用的起始字元索引。
    - **end_char_index** (integer):  
      引用的結束字元索引。
    - **type** (string):  
      通常為 `"char_location"`。

- **id** (string):  
  回應訊息的唯一識別碼。  
  _注意：ID 的格式與長度可能會隨時間變更。_

- **model** (string):  
  指定產生回應的模型。

- **role** (string):  
  指示生成訊息的角色。對於回應，這永遠是 `"assistant"`。

- **stop_reason** (string):  
  說明模型為何停止生成文字。可能的值包括：
  - `"end_turn"`：模型已達到自然停止點。
  - `"max_tokens"`：因為已達到最大 token 限制而停止生成。
  - `"stop_sequence"`：遇到自訂停止序列。
  - `"tool_use"`：模型呼叫了一個或多個工具。

- **stop_sequence** (string or `null`):  
  包含導致生成停止的特定停止序列（若適用）；否則為 `null`。

- **type** (string):  
  表示回應物件的類型，且一律為 `"message"`。

- **usage**（物件）：  
  提供用於計費與速率限制的 token 使用量詳細資訊。包括：
  - **input_tokens**（整數）：  
    已處理的輸入 token 總數。
  - **output_tokens**（整數）：  
    已產生的輸出 token 總數。
  - **cache_creation_input_tokens**（整數或 `null`）：  
    用於建立快取項目的 token 數量。
  - **cache_read_input_tokens**（整數或 `null`）：  
    從快取讀取的 token 數量。
