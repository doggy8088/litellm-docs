import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Manus {#manus}

透過 LiteLLM 相容於 OpenAI 的 Responses API 使用 Manus AI 代理程式。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | Manus 是一個 AI 代理程式平台，適用於複雜推理任務、文件分析，以及具備非同步任務執行的多步驟工作流程。 |
| LiteLLM 上的提供者路由 | `manus/{agent_profile}` |
| 支援的操作 | `/responses`（Responses API）、`/files`（Files API） |
| 提供者文件 | [Manus API ↗](https://open.manus.im/docs/openai-compatibility) |

## 模型格式 {#model-format}

```shell
manus/{agent_profile}
```

**範例：**
- `manus/manus-1.6` - 通用代理程式
- `manus/manus-1.6-lite` - 適用於簡單任務的輕量型代理程式
- `manus/manus-1.6-max` - 適用於複雜分析的進階代理程式

## LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Basic Usage"
import litellm
import os
import time

# Set API key
os.environ["MANUS_API_KEY"] = "your-manus-api-key"

# Create task
response = litellm.responses(
    model="manus/manus-1.6",
    input="What's the capital of France?",
)

print(f"Task ID: {response.id}")
print(f"Status: {response.status}")  # "running"

# Poll until complete
task_id = response.id
while response.status == "running":
    time.sleep(5)
    response = litellm.get_response(
        response_id=task_id,
        custom_llm_provider="manus",
    )
    print(f"Status: {response.status}")

# Get results
if response.status == "completed":
    for message in response.output:
        if message.role == "assistant":
            print(message.content[0].text)
```

## LiteLLM AI Gateway {#litellm-ai-gateway}

### 設定 {#setup}

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: manus-agent
    litellm_params:
      model: manus/manus-1.6
      api_key: os.environ/MANUS_API_KEY
```

```bash title="Start Proxy"
litellm --config config.yaml
```

### 使用方式 {#usage}

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Create Task"
# Create task
curl -X POST http://localhost:4000/responses \
  -H "Authorization: Bearer your-proxy-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "manus-agent",
    "input": "What is the capital of France?"
  }'

# Response
{
  "id": "task_abc123",
  "status": "running",
  "metadata": {
    "task_url": "https://manus.im/app/task_abc123"
  }
}
```

```bash showLineNumbers title="Poll for Completion"
# Check status (repeat until status is "completed")
curl http://localhost:4000/responses/task_abc123 \
  -H "Authorization: Bearer your-proxy-key"

# When completed
{
  "id": "task_abc123",
  "status": "completed",
  "output": [
    {
      "role": "user",
      "content": [{"text": "What is the capital of France?"}]
    },
    {
      "role": "assistant",
      "content": [{"text": "The capital of France is Paris."}]
    }
  ]
}
```

</TabItem>
<TabItem value="openai" label="OpenAI SDK">

```python showLineNumbers title="Create Task and Poll"
import openai
import time

client = openai.OpenAI(
    base_url="http://localhost:4000",
    api_key="your-proxy-key"
)

# Create task
response = client.responses.create(
    model="manus-agent",
    input="What is the capital of France?"
)

print(f"Task ID: {response.id}")
print(f"Status: {response.status}")  # "running"

# Poll until complete
task_id = response.id
while response.status == "running":
    time.sleep(5)
    response = client.responses.retrieve(response_id=task_id)
    print(f"Status: {response.status}")

# Get results
if response.status == "completed":
    for message in response.output:
        if message.role == "assistant":
            print(message.content[0].text)
```

</TabItem>
</Tabs>

## 運作方式 {#how-it-works}

Manus 以**非同步代理程式 API**運作：

1. **建立任務**：當您呼叫 `litellm.responses()` 時，Manus 會建立一個任務並立即回傳 `status: "running"`
2. **任務執行**：代理程式在背景中處理您的請求
3. **輪詢完成狀態**：您必須持續呼叫 `litellm.get_response()` 或 `client.responses.retrieve()`，直到狀態變更為 `"completed"`
4. **取得結果**：完成後，`output` 欄位會包含完整對話

**任務狀態：**
- `running` - 代理程式正在積極處理
- `pending` - 代理程式正在等待輸入
- `completed` - 任務已成功完成
- `error` - 任務失敗

:::tip Production Usage
對於正式環境應用程式，請改用 [webhooks](https://open.manus.im/docs/webhooks) 來接收任務完成通知，而非輪詢。
:::

## 支援的參數 {#supported-parameters}

| 參數 | 支援 | 備註 |
|-----------|-----------|-------|
| `input` | ✅ | 文字、圖片或結構化內容 |
| `stream` | ✅ | 假串流（任務以非同步方式執行） |
| `max_output_tokens` | ✅ | 限制回應長度 |
| `previous_response_id` | ✅ | 用於多輪對話 |

## Files API {#files-api}

Manus 支援用於文件分析與處理的檔案上傳。檔案可以先上傳，再於 Responses API 呼叫中參照。

### LiteLLM Python SDK {#litellm-python-sdk-1}

```python showLineNumbers title="Upload, Use, Retrieve, and Delete Files"
import litellm
import os

# Set API key
os.environ["MANUS_API_KEY"] = "your-manus-api-key"

# Upload file
file_content = b"This is a document for analysis."
created_file = await litellm.acreate_file(
    file=("document.txt", file_content),
    purpose="assistants",
    custom_llm_provider="manus",
)
print(f"Uploaded file: {created_file.id}")

# Use file with Responses API
response = await litellm.aresponses(
    model="manus/manus-1.6",
    input=[
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Summarize this document."},
                {"type": "input_file", "file_id": created_file.id},
            ],
        },
    ],
    extra_body={"task_mode": "agent", "agent_profile": "manus-1.6-agent"},
)
print(f"Response: {response.id}")

# Retrieve file
retrieved_file = await litellm.afile_retrieve(
    file_id=created_file.id,
    custom_llm_provider="manus",
)
print(f"File details: {retrieved_file.filename}, {retrieved_file.bytes} bytes")

# Delete file
deleted_file = await litellm.afile_delete(
    file_id=created_file.id,
    custom_llm_provider="manus",
)
print(f"Deleted: {deleted_file.deleted}")
```

### LiteLLM AI Gateway {#litellm-ai-gateway-1}

<Tabs>
<TabItem value="curl" label="cURL">

```bash showLineNumbers title="Upload File"
# Upload file
curl -X POST http://localhost:4000/v1/files \
  -H "Authorization: Bearer your-proxy-key" \
  -F "file=@document.txt" \
  -F "purpose=assistants" \
  -F "custom_llm_provider=manus"

# Response
{
  "id": "file_abc123",
  "object": "file",
  "bytes": 1024,
  "created_at": 1234567890,
  "filename": "document.txt",
  "purpose": "assistants",
  "status": "uploaded"
}
```

```bash showLineNumbers title="Use File with Responses API"
# Create response with file
curl -X POST http://localhost:4000/responses \
  -H "Authorization: Bearer your-proxy-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "manus-agent",
    "input": [
      {
        "role": "user",
        "content": [
          {"type": "input_text", "text": "Summarize this document."},
          {"type": "input_file", "file_id": "file_abc123"}
        ]
      }
    ]
  }'
```

```bash showLineNumbers title="Retrieve File"
# Get file details
curl http://localhost:4000/v1/files/file_abc123 \
  -H "Authorization: Bearer your-proxy-key"

# Response
{
  "id": "file_abc123",
  "object": "file",
  "bytes": 1024,
  "created_at": 1234567890,
  "filename": "document.txt",
  "purpose": "assistants",
  "status": "uploaded"
}
```

```bash showLineNumbers title="Delete File"
# Delete file
curl -X DELETE http://localhost:4000/v1/files/file_abc123 \
  -H "Authorization: Bearer your-proxy-key"

# Response
{
  "id": "file_abc123",
  "object": "file",
  "deleted": true
}
```

</TabItem>
<TabItem value="openai" label="OpenAI SDK">

```python showLineNumbers title="Upload, Use, Retrieve, and Delete Files"
import openai

client = openai.OpenAI(
    base_url="http://localhost:4000",
    api_key="your-proxy-key"
)

# Upload file
with open("document.txt", "rb") as f:
    created_file = client.files.create(
        file=f,
        purpose="assistants",
        extra_body={"custom_llm_provider": "manus"}
    )
print(f"Uploaded file: {created_file.id}")

# Use file with Responses API
response = client.responses.create(
    model="manus-agent",
    input=[
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Summarize this document."},
                {"type": "input_file", "file_id": created_file.id}
            ]
        }
    ]
)
print(f"Response: {response.id}")

# Retrieve file
retrieved_file = client.files.retrieve(created_file.id)
print(f"File: {retrieved_file.filename}, {retrieved_file.bytes} bytes")

# Delete file
deleted_file = client.files.delete(created_file.id)
print(f"Deleted: {deleted_file.deleted}")
```

</TabItem>
</Tabs>

## 相關文件 {#related-documentation}

- [LiteLLM Responses API](/docs/response_api)
- [LiteLLM Files API](/docs/proxy/litellm_managed_files)
- [Manus OpenAI Compatibility](https://open.manus.im/docs/openai-compatibility)
