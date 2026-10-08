import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Vertex Batch API {#vertex-batch-apis}

## 設定 {#setup}

在您的 config.yaml 中設定 Vertex 模型。`gcs_bucket_name` 是儲存批次預測檔案的 GCS bucket，這是 vertexai 用來儲存檔案的必要參數。較舊的 `bucket_name` litellm 參數仍受支援，並且會被視為與 `gcs_bucket_name` 相同。若兩者都設定在同一個部署上，`gcs_bucket_name` 會生效

```yaml showLineNumbers title="litellm-config.yaml"
model_list:
  - model_name: vertex-batch
    litellm_params:
      model: vertex_ai/{{gemini_flash}}
      vertex_project: my-project
      vertex_location: us-central1
      vertex_credentials: /path/to/service_account.json
      gcs_bucket_name: my-batch-bucket # required param for vertexai to store files
    model_info:
      mode: batch
```

當模型的 `litellm_params` 上未設定 `gcs_bucket_name`（或 `bucket_name`）與 `vertex_credentials` 時，LiteLLM 會回退使用這些環境變數。`GCS_BATCH_BUCKET_NAME` 存在的原因是，[`gcs_bucket` 記錄回呼](../observability/gcs_bucket_integration) 已經使用 `GCS_BUCKET_NAME` 作為寫入 LLM 請求記錄的 bucket，因此將 `GCS_BUCKET_NAME` 設為您的批次 bucket 也會把請求記錄送到那裡。批次檔案會先檢查 `GCS_BATCH_BUCKET_NAME`；當它未設定時，則使用 `GCS_BUCKET_NAME`

```bash
# GCS Bucket settings, used to store batch prediction files in
export GCS_BATCH_BUCKET_NAME="my-batch-bucket" # bucket for batch prediction files, takes precedence over GCS_BUCKET_NAME
export GCS_BUCKET_NAME="my-logging-bucket" # used for batch files only when GCS_BATCH_BUCKET_NAME is unset
export GCS_PATH_SERVICE_ACCOUNT="/path/to/service_account.json" # path to your service account json file

# Vertex /batch endpoint settings, used for LLM API requests
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service_account.json" # path to your service account json file
export VERTEXAI_LOCATION="us-central1" # can be any vertex location
export VERTEXAI_PROJECT="my-project" 
```

### 用法 {#usage}

請依照以下完整流程：建立 JSONL 檔案 → 上傳檔案 → 建立 batch → 擷取 batch 狀態 → 取得檔案內容

#### 1. 建立 batch 請求的 JSONL 檔案 {#1-create-a-jsonl-file-of-batch-requests}

LiteLLM 預期檔案需遵循 **[OpenAI 批次檔案格式](https://platform.openai.com/docs/guides/batch)**。

檔案中的每個 `body` 都應為 **OpenAI API 請求**。

建立一個名為 `batch_requests.jsonl` 的檔案，內容放入您的請求：
```jsonl
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "{{gemini_flash}}", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 10}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "{{gemini_flash}}", "messages": [{"role": "system", "content": "You are an unhelpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 10}}
```

#### 2. 上傳檔案 {#2-upload-the-file}

上傳您的 JSONL 檔案。對於 `vertex_ai`，檔案會儲存在部署的 `gcs_bucket_name`（或 `bucket_name`）中，並回退使用 `GCS_BATCH_BUCKET_NAME`，再來是 `GCS_BUCKET_NAME`。

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="upload_file.py"
from openai import OpenAI

oai_client = OpenAI(
    api_key="sk-<your-litellm-api-key>",               # litellm proxy API key
    base_url="http://localhost:4000" # litellm proxy base url
)

file_obj = oai_client.files.create(
    file=open("batch_requests.jsonl", "rb"),
    purpose="batch",
    extra_headers={"custom-llm-provider": "vertex_ai"}
)

print(f"File uploaded with ID: {file_obj.id}")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Upload File"
curl --request POST \
  --url http://localhost:4000/v1/files \
  --header 'Content-Type: multipart/form-data' \
  --header 'custom-llm-provider: vertex_ai' \
  --form purpose=batch \
  --form file=@batch_requests.jsonl
```

</TabItem>
</Tabs>

**預期回應：**

```json
{
    "id": "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd",
    "bytes": 416,
    "created_at": 1758303684,
    "filename": "litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd",
    "object": "file",
    "purpose": "batch",
    "status": "uploaded",
    "expires_at": null,
    "status_details": null
}
```

#### 3. 建立 batch {#3-create-a-batch}

使用已上傳的檔案 ID 建立 batch 工作。

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="create_batch.py"
batch_input_file_id = file_obj.id # from step 2
create_batch_response = oai_client.batches.create(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id=batch_input_file_id, # e.g. "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd"
    extra_headers={"custom-llm-provider": "vertex_ai"}
)

print(f"Batch created with ID: {create_batch_response.id}")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Create Batch Request"
curl --request POST \
  --url http://localhost:4000/v1/batches \
  --header 'Content-Type: application/json' \
  --header 'custom-llm-provider: vertex_ai' \
  --data '{         
    "input_file_id": "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
}'
```

</TabItem>
</Tabs>

**預期回應：**

```json
{
    "id": "7814463557919047680",
    "completion_window": "24hrs",
    "created_at": 1758328011,
    "endpoint": "",
    "input_file_id": "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd",
    "object": "batch",
    "status": "validating",
    "cancelled_at": null,
    "cancelling_at": null,
    "completed_at": null,
    "error_file_id": null,
    "errors": null,
    "expired_at": null,
    "expires_at": null,
    "failed_at": null,
    "finalizing_at": null,
    "in_progress_at": null,
    "metadata": null,
    "output_file_id": null,
    "request_counts": null,
    "usage": null
}
```

#### 4. 擷取 batch 狀態 {#4-retrieve-batch-status}

檢查您的批次工作狀態。批次會依序進入這些狀態：`validating` → `in_progress` → `completed`。`output_file_id` 會保持為 `null`，直到批次到達 `completed`。

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="retrieve_batch.py"
retrieved_batch = oai_client.batches.retrieve(
    batch_id=create_batch_response.id, # Created batch id, e.g. 7814463557919047680
    extra_headers={"custom-llm-provider": "vertex_ai"}
)

print(f"Batch status: {retrieved_batch.status}")
if retrieved_batch.status == "completed":
    print(f"Output file: {retrieved_batch.output_file_id}")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Retrieve Batch Status"
curl --request GET \
  --url 'http://localhost:4000/batches/7814463557919047680?provider=vertex_ai' \
  --header "Authorization: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

**預期回應（完成時）：**

```json
{
    "id": "7814463557919047680",
    "completion_window": "24hrs",
    "created_at": 1758328011,
    "endpoint": "",
    "input_file_id": "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/abc123-def4-5678-9012-34567890abcd",
    "object": "batch",
    "status": "completed",
    "cancelled_at": null,
    "cancelling_at": null,
    "completed_at": null,
    "error_file_id": null,
    "errors": null,
    "expired_at": null,
    "expires_at": null,
    "failed_at": null,
    "finalizing_at": null,
    "in_progress_at": null,
    "metadata": null,
    "output_file_id": "gs://my-batch-bucket/litellm-vertex-files/publishers/google/models/{{gemini_flash}}/prediction-model-2025-09-19T21:26:51.569037Z/predictions.jsonl",
    "request_counts": null,
    "usage": null
}
```

#### 5. 取得檔案內容 {#5-get-file-content}

batch 完成後，請使用 batch 回應中的 `output_file_id` 來擷取結果。

**重要：**在請求路徑中使用 `output_file_id` 時，必須先進行 URL 編碼。

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="get_file_content.py"
import urllib.parse
import json

output_file_id = retrieved_batch.output_file_id
# URL encode the file ID
encoded_file_id = urllib.parse.quote_plus(output_file_id)

# Get file content
file_content = oai_client.files.content(
    file_id=encoded_file_id,
    extra_headers={"custom-llm-provider": "vertex_ai"}
)

# Process the results
for line in file_content.text.strip().split('\n'):
    result = json.loads(line)
    print(f"Request: {result['request']}")
    print(f"Response: {result['response']}")
    print("---")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Get File Content"
# Note: The file ID must be URL encoded
curl --request GET \
  --url 'http://localhost:4000/files/gs%253A%252F%252Fmy-batch-bucket%252Flitellm-vertex-files%252Fpublishers%252Fgoogle%252Fmodels%252Fgemini-2.5-flash-lite%252Fprediction-model-2025-09-19T21%253A26%253A51.569037Z%252Fpredictions.jsonl/content?provider=vertex_ai' \
  --header "Authorization: Bearer $LITELLM_API_KEY"
```

</TabItem>
</Tabs>

**預期回應：**

回應包含 JSONL 格式，每一行一個結果：

```jsonl
{"status":"","processed_time":"2025-09-19T21:29:47.352+00:00","request":{"contents":[{"parts":[{"text":"Hello world!"}],"role":"user"}],"generationConfig":{"max_output_tokens":10},"system_instruction":{"parts":[{"text":"You are a helpful assistant."}]}},"response":{"candidates":[{"avgLogprobs":-0.48079710006713866,"content":{"parts":[{"text":"Hello there! It's nice to meet you"}],"role":"model"},"finishReason":"MAX_TOKENS"}],"createTime":"2025-09-19T21:29:47.484619Z","modelVersion":"{{gemini_flash}}","responseId":"S8vNaIvKHdvshMIP_aOtuAg","usageMetadata":{"candidatesTokenCount":10,"candidatesTokensDetails":[{"modality":"TEXT","tokenCount":10}],"promptTokenCount":9,"promptTokensDetails":[{"modality":"TEXT","tokenCount":9}],"totalTokenCount":19,"trafficType":"ON_DEMAND"}}}
{"status":"","processed_time":"2025-09-19T21:29:47.358+00:00","request":{"contents":[{"parts":[{"text":"Hello world!"}],"role":"user"}],"generationConfig":{"max_output_tokens":10},"system_instruction":{"parts":[{"text":"You are an unhelpful assistant."}]}},"response":{"candidates":[{"avgLogprobs":-0.6168075137668185,"content":{"parts":[{"text":"I am unable to assist with this request."}],"role":"model"},"finishReason":"STOP"}],"createTime":"2025-09-19T21:29:47.470889Z","modelVersion":"{{gemini_flash}}","responseId":"S8vNaOneHISShMIP28nA8QQ","usageMetadata":{"candidatesTokenCount":9,"candidatesTokensDetails":[{"modality":"TEXT","tokenCount":9}],"promptTokenCount":9,"promptTokensDetails":[{"modality":"TEXT","tokenCount":9}],"totalTokenCount":18,"trafficType":"ON_DEMAND"}}}
```

### 原生 Vertex JSONL 直通 {#native-vertex-jsonl-passthrough}

預設情況下，LiteLLM 在您上傳檔案時會將每一行 OpenAI 格式轉換為 Vertex `GenerateContent` 請求，並在您下載時將批次輸出再轉回 OpenAI chat completion 形式。在上傳時設定 `passthrough=true` 以略過這兩者：檔案會逐位元組原封不動地儲存在您的 GCS bucket 中，而批次輸出會以 Vertex 的原生格式回傳，包含 `groundingMetadata`。可用於轉換未涵蓋的 Vertex 功能，例如搭配 `excludeDomains` 的 `googleSearch` grounding，同時不需要向您的呼叫端提供 GCP 憑證。成本追蹤不變：LiteLLM 會從每一列原生輸出中讀取 `usageMetadata`，並以與線上 Gemini 請求相同的方式計費。

#### 1. 建立原生 JSONL 檔案 {#1-create-a-native-jsonl-file}

每一行都是一個 Vertex 批次預測請求，也就是具有 `request` 鍵的 JSON 物件：

```jsonl title="native_batch_requests.jsonl"
{"request": {"contents": [{"role": "user", "parts": [{"text": "What is the tallest building in the world?"}]}], "tools": [{"googleSearch": {"excludeDomains": ["example.com"]}}]}}
{"request": {"contents": [{"role": "user", "parts": [{"text": "Who won the last FIFA World Cup?"}]}], "tools": [{"googleSearch": {"excludeDomains": ["example.com"]}}]}}
```

#### 2. 使用 `passthrough=true` 上傳它 {#2-upload-it-with-passthroughtrue}

原生列不包含模型，因此請指定要執行批次的 Vertex 部署：`target_model_names`（受管理檔案，需要資料庫）或 `model` 查詢參數（不需要資料庫）。LiteLLM 會將物件儲存在該模型路徑下的 `litellm-vertex-files/passthrough/` 中，而批次輸出也會存放在旁邊，這就是下載步驟知道要原封不動回傳它的方式。

```yaml title="config.yaml"
model_list:
  - model_name: {{gemini_flash}}
    litellm_params:
      model: vertex_ai/{{gemini_flash}}
      vertex_project: my-project
      vertex_location: us-central1
      gcs_bucket_name: my-batch-bucket
```

<Tabs>
<TabItem value="python" label="Python">

```python showLineNumbers title="upload_native_file.py"
file_obj = oai_client.files.create(
    file=open("native_batch_requests.jsonl", "rb"),
    purpose="batch",
    extra_body={"target_model_names": "{{gemini_flash}}", "passthrough": True},
)

print(f"File uploaded with ID: {file_obj.id}")
```

</TabItem>
<TabItem value="curl" label="Curl">

```bash showLineNumbers title="Upload Native File"
curl --request POST \
  --url http://localhost:4000/v1/files \
  --header "Authorization: Bearer $LITELLM_API_KEY" \
  --form purpose=batch \
  --form target_model_names={{gemini_flash}} \
  --form passthrough=true \
  --form file=@native_batch_requests.jsonl
```

</TabItem>
<TabItem value="sdk" label="LiteLLM SDK">

```python showLineNumbers title="upload_native_file_sdk.py"
import litellm

file_obj = litellm.create_file(
    file=open("native_batch_requests.jsonl", "rb"),
    purpose="batch",
    custom_llm_provider="vertex_ai",
    model="vertex_ai/{{gemini_flash}}",
    passthrough=True,
)
```

</TabItem>
</Tabs>

建立批次、輪詢，並以下載輸出，如同上述步驟 3 到 5。輸出是原始 Vertex `predictions.jsonl`，因此每一行都包含 `request`、`status` 和 `response`，而在每一列有執行 grounding 的地方則會有 `candidates[].groundingMetadata`。

#### 直通會檢查什麼 {#what-passthrough-checks}

- `purpose` 必須是 `batch`，且指定的模型必須是該金鑰可使用的 `vertex_ai` 部署，否則上傳會以 400 錯誤拒絕並標示該欄位。
- 每一行都必須是具有 `request` 鍵的 JSON 物件。OpenAI 格式的行會被以 400 錯誤拒絕並標示該行，且不會上傳任何內容。
- 批次防護欄只支援 OpenAI 格式的列，因此當金鑰、團隊或請求已設定前置呼叫防護欄時，直通上傳會以 400 錯誤拒絕。

直通是逐次上傳套用。SDK 全域的 `litellm.disable_vertex_batch_output_transformation` 旗標仍會套用於每個 Vertex 批次輸出，但絕不會影響輸入端；`passthrough` 只會對您設定它的那個檔案同時涵蓋兩者。
