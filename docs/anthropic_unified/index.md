import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import SinceVersion from '@site/src/components/SinceVersion';

# /v1/messages {#v1messages}

使用 LiteLLM 以 Anthropic `v1/messages` 格式呼叫您所有的 LLM API。

## 概覽  {#overview}

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 成本追蹤 | ✅ | 可與所有支援的模型搭配使用 |
| 記錄 | ✅ | 可跨所有整合使用 |
| 終端使用者追蹤 | ✅ | |
| 串流 | ✅ | |
| 備援 | ✅ | 可在支援的模型之間運作 |
| 負載平衡 | ✅ | 可在支援的模型之間運作 |
| 防護欄 | ✅ | 適用於輸入與輸出文字。在串流輸出時，防護欄可封鎖回應，但像遮罩這類文字重寫只適用於非串流回應 |
| 支援的提供者 | **所有 LiteLLM 支援的提供者** | `openai`, `anthropic`, `bedrock`, `vertex_ai`, `gemini`, `azure`, `azure_ai`, 等。 |

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
    model="anthropic/{{anthropic}}",
    max_tokens=100,
)
```

#### 串流範例 {#streaming-example}
```python showLineNumbers title="Anthropic Streaming Example using LiteLLM Python SDK"
import litellm
response = await litellm.anthropic.messages.acreate(
    messages=[{"role": "user", "content": "Hello, can you tell me a short joke?"}],
    api_key=api_key,
    model="anthropic/{{anthropic}}",
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
    model="openai/{{openai_large}}",
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
    model="openai/{{openai_large}}",
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
    model="gemini/{{gemini_flash}}",
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
    model="gemini/{{gemini_flash}}",
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
    model="vertex_ai/{{gemini_flash}}",
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
    model="vertex_ai/{{gemini_flash}}",
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
    model="bedrock/us.anthropic.{{anthropic}}",
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
    model="bedrock/us.anthropic.{{anthropic}}",
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
  "model": "{{anthropic}}",
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
        model: {{anthropic}}
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
    api_key="sk-<your-litellm-api-key>",
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
        model: openai/{{openai_large}}
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
    api_key="sk-<your-litellm-api-key>",
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
        model: gemini/{{gemini_flash}}
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
    api_key="sk-<your-litellm-api-key>",
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
        model: vertex_ai/{{gemini_flash}}
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
    api_key="sk-<your-litellm-api-key>",
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
        model: bedrock/us.anthropic.{{anthropic}}
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
    api_key="sk-<your-litellm-api-key>",
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
-H "x-api-key: $LITELLM_API_KEY" \
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

## Message threads（beta）{#message-threads-beta} {#message-threads-beta}

Anthropic 的 [message threads](https://platform.claude.com/docs/en/build-with-claude/message-threads) 會在每一輪之間將對話保留在 Anthropic 的伺服器上。第一個請求會以完整的 prompt 建立 thread，之後每個請求只需傳送新訊息加上前一個回應的 `id`，因此模型能更快開始回答，您也不必再為重送歷史紀錄付費。 <SinceVersion v="1.111.0" />

LiteLLM 會在原生 Anthropic 部署（`anthropic/`、Microsoft Foundry 的 `azure_ai/` Claude 部署，以及 Claude Platform on AWS 的 `bedrock/claude_platform/` 部署）上轉送 `thread` body 欄位，為您加上 `message-threads-2026-08-12` beta 標頭，並原樣回傳回應的 `id`，因此用戶端從 proxy 取得的 id 就是它後續接續時所用的 id。串流的運作方式相同。

以完整的 prompt 建立 thread：

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
  -H "x-api-key: $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-5-5",
    "max_tokens": 1024,
    "system": "You are a terse assistant.",
    "messages": [{"role": "user", "content": "My name is Ada."}],
    "thread": {"type": "create"}
  }'
```

接續時只需傳送新訊息，以及您剛取得的回應 `id`。continue 請求不得帶有 `system` 或 `tools`，因為 thread 已儲存這些內容：

```bash
curl -X POST http://0.0.0.0:4000/v1/messages \
  -H "x-api-key: $LITELLM_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-5-5",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "What is my name?"}],
    "thread": {"type": "continue", "previous_message_id": "msg_01XFDUDYJgAACzvnptvVoYEL"}
  }'
```

Anthropic SDK 的 thread helpers（Python 與 TypeScript SDK 中的 `client.beta.messages.threads`）透過 proxy 運作的方式，與直接對 Anthropic 呼叫時相同。當 Anthropic 無法接續某個 thread 時，它會回傳 404，並將 `error.details.error_code` 設為 `thread_not_found`，proxy 會轉送該狀態與代碼，因此 helper 重播完整對話的機制能繼續運作。

在不具備原生 thread 支援的部署上，也就是每個會被轉換的提供者（例如 `openai/`、Bedrock 與 Vertex AI），以及任何其 `model_info.supported_endpoints` 將 `/v1/messages` 轉送到 OpenAI 相容伺服器的部署，create 請求會在任何上游呼叫之前就收到 400，並將 `error.details.error_code` 設為 `thread_unsupported_request`，這與 Anthropic 對無法建立 thread 的請求所給的回覆相同。以 `unsupported_request_behavior="continue_unthreaded"` 建立的 SDK thread helpers，接著會在不使用 thread 的情況下傳送對話。開啟 `drop_params` 時，LiteLLM 則會改為在不含 thread 的情況下處理該 create 請求，並記錄一則警告：

```yaml
litellm_settings:
  drop_params: true
```

在這類部署上的 continue 請求，一律會在任何上游呼叫之前收到 404 `thread_not_found`，因此 SDK thread helpers 會重播完整對話，而不是得到一個忽略先前輪次的回答。

proxy 上的每個 key 都共用部署的 Anthropic 憑證，因此 LiteLLM 會將每個 thread 回應的 `id` 綁定到收到它的虛擬金鑰；當請求沒有 key 時，則綁定到已登入的使用者、團隊、終端使用者、組織與 agent。來自另一個 key 的 continue 在每條路由上都會收到 404 `thread_not_found`，SDK helper 會以完整對話開啟一個新的 thread。在 `/v1/messages`、`/v1/chat/completions` 與 `/v1/responses` 上，若 continue 所指名的 `id` 是這個 proxy 從未在 thread 中回傳過的，也會收到相同的 404，因此在 proxy 之外或在轉送路由上開啟的 thread 無法在這裡接續。只有在 `/v1/messages` 上開啟的 thread 會被綁定，所以像 `/anthropic/v1/messages` 這類以部署憑證轉送請求的轉送路由，會原樣轉送 proxy 從未綁定過的 `id`。第一個收到某個 `id` 的 key 會保留它，因此即使回應快取命中、將相同的 `id` 回傳給另一個 key，也不會把 thread 交出去。綁定會持續一小時，比 Anthropic 保留閒置 thread 的時間更長。

若有多個 proxy worker 或 pod，請為 proxy 設定 Redis，讓每個 worker 都能看到這些綁定。否則，送達另一個 worker 的 continue 會收到 404，SDK helper 會重播對話。只要設定 Redis 環境變數即可：

```bash
export REDIS_HOST=redis.internal
export REDIS_PORT=6379
export REDIS_PASSWORD=<your-redis-password>
litellm --config config.yaml --num_workers 4
```

擁有多個部署的 model group 可能會將 continue 送到一個其 Anthropic 憑證看不到該 thread 的部署，該部署會回覆 404 `thread_not_found`，使 SDK helper 重播對話。請開啟 deployment affinity，讓每個 key 持續送達為其建立 thread 的部署：

```yaml
router_settings:
  optional_pre_call_checks: ["deployment_affinity"]
```

`anthropic-beta` 值的集合是 thread 的固定欄位之一，若某一輪的集合與 create 請求不同，Anthropic 會以 `thread_fingerprint_mismatch` 拒絕該輪。create 請求仍會取得 LiteLLM 依其 `tools` 與 `messages` 加上的 beta 標頭，例如 advisor tool 的標頭。proxy 會將 create 所送出的完整集合連同 thread 綁定一併儲存，並將它加到 `/v1/messages`、`/v1/chat/completions` 與 `/v1/responses` 上的每個 continue 請求，使 continue 與其 create 相符，您無需自行送出這些標頭。當您不透過 proxy、直接呼叫 LiteLLM Python SDK 時，沒有任何東西會儲存該集合，因此請在每個 continue 請求上自行送出 create 的 beta 標頭。

## 請求格式 {#request-format}
---

請求主體將採用 Anthropic messages API 格式。**litellm 遵循此端點的 Anthropic messages 規格。**

#### 請求主體範例 {#example-request-body}

```json
{
  "model": "{{anthropic}}",
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
  模型識別碼（例如，`"{{anthropic}}"`）。
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
  包含有關此請求的其他中繼資料（例如，`user_id` 作為不透明識別碼）。
- **stop_sequences** (array of strings):  
  自訂字串序列，當在生成的文字中遇到時，會使模型停止。
- **stream** (boolean):  
  表示是否使用伺服器推送事件來串流回應。
- **system** (string or array):  
  提供脈絡或特定指示給模型的系統提示。
- **temperature** (number):  
  控制模型回應的隨機性。有效範圍：`0 < temperature < 1`。
- **thinking** (object):
  啟用延伸思考的設定。若啟用，包含：
  - **budget_tokens** (integer):
    至少 1024 個 token（且小於 `max_tokens`）。
  - **type** (enum):
    例如，`"enabled"`。
  - **summary** (string, optional):
    啟用思考區塊的摘要樣式。可能的值：`"auto"`、`"concise"`、`"detailed"`、`"disabled"`。
    當路由至非 Anthropic 提供者（例如 `openai/{{openai_large}}`）時，`summary` 值會被保留並轉送至下游 API。
- **tool_choice** (object):  
  指示模型應如何使用任何提供的工具。
- **tools** (array of objects):  
  模型可用工具的定義。每個工具包含：
  - **name** (string):  
    工具名稱。
  - **description** (string):  
    工具的詳細說明。
  - **input_schema** (object):  
    描述該工具預期輸入格式的 JSON schema。
- **top_k** (integer):  
  限制抽樣至前 K 個選項。
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
  "model": "{{anthropic}}",
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
