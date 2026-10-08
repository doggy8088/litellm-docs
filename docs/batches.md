import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /batches {#batches}

涵蓋 Batch、Files

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 支援的提供者 | OpenAI、Azure、Vertex、Bedrock、Mistral、vLLM、xAI | - |
| ✨ 成本追蹤 | ✅ | 僅限 LiteLLM Enterprise |
| 記錄 | ✅ | 可跨所有記錄整合運作 |

在您的 proxy 上設定的防護欄會在批次輸入檔上傳時套用到檔案內的記錄。請參閱 [Batch API 防護欄](./proxy/guardrails/batch_guardrails)

## 快速入門 {#quick-start}

- 為 Batch Completion 建立檔案

- 建立 Batch 請求

- 列出 Batches

- 擷取特定的 Batch 與檔案內容

**建立批次輸入檔案**

每一行都是 [OpenAI 批次檔案格式](https://platform.openai.com/docs/guides/batch) 中的一個請求。每一行都需要 `custom_id`、`method`、`url`、以及 `body`：

```json showLineNumbers title="mydata.jsonl"
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello world!"}], "max_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o", "messages": [{"role": "system", "content": "You are an unhelpful assistant."}, {"role": "user", "content": "Hello world!"}], "max_tokens": 1000}}
```

<Tabs>
<TabItem value="proxy" label="LiteLLM PROXY Server">

**設定 config.yaml 並啟動 proxy**

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

```bash
$ export OPENAI_API_KEY="sk-..."

$ litellm --config config.yaml

# RUNNING on http://0.0.0.0:4000
```

**為 Batch Completion 建立檔案**

```shell
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -F purpose="batch" \
    -F file="@mydata.jsonl"
```

**建立 Batch 請求**

```bash
curl http://localhost:4000/v1/batches \
        -H "Authorization: Bearer $LITELLM_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "input_file_id": "file-abc123",
            "endpoint": "/v1/chat/completions",
            "completion_window": "24h"
    }'
```

**擷取特定的 Batch**

```bash
curl http://localhost:4000/v1/batches/batch_abc123 \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
```


**列出 Batches**

```bash
curl http://localhost:4000/v1/batches \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
```

</TabItem>
<TabItem value="sdk" label="SDK">

**為 Batch Completion 建立檔案**

```python
import litellm
import os 
import asyncio

os.environ["OPENAI_API_KEY"] = "sk-.."

file_name = "mydata.jsonl"
_current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(_current_dir, file_name)
file_obj = await litellm.acreate_file(
    file=open(file_path, "rb"),
    purpose="batch",
    custom_llm_provider="openai",
)
print("Response from creating file=", file_obj)
```

**建立 Batch 請求**

```python
import litellm
import os 
import asyncio

create_batch_response = await litellm.acreate_batch(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id=batch_input_file_id,
    custom_llm_provider="openai",
    metadata={"key1": "value1", "key2": "value2"},
)

print("response from litellm.create_batch=", create_batch_response)
```

**擷取特定的 Batch 與檔案內容**

```python
# Maximum wait time before we give up
MAX_WAIT_TIME = 300  

# Time to wait between each status check
POLL_INTERVAL = 5

#Time waited till now 
waited = 0

# Wait for the batch to finish processing before trying to retrieve output
# This loop checks the batch status every few seconds (polling)

while True:
    retrieved_batch = await litellm.aretrieve_batch(
        batch_id=create_batch_response.id,
        custom_llm_provider="openai"
    )
    
    status = retrieved_batch.status
    print(f"⏳ Batch status: {status}")
    
    if status == "completed" and retrieved_batch.output_file_id:
        print("✅ Batch complete. Output file ID:", retrieved_batch.output_file_id)
        break
    elif status in ["failed", "cancelled", "expired"]:
        raise RuntimeError(f"❌ Batch failed with status: {status}")
    
    await asyncio.sleep(POLL_INTERVAL)
    waited += POLL_INTERVAL
    if waited > MAX_WAIT_TIME:
        raise TimeoutError("❌ Timed out waiting for batch to complete.")

print("retrieved batch=", retrieved_batch)
# just assert that we retrieved a non None batch

assert retrieved_batch.id == create_batch_response.id

# try to get file content for our original file

file_content = await litellm.afile_content(
    file_id=batch_input_file_id, custom_llm_provider="openai"
)

print("file content = ", file_content)
```

**列出 Batches**

```python
list_batches_response = litellm.list_batches(custom_llm_provider="openai", limit=2)
print("list_batches_response=", list_batches_response)
```

</TabItem>

</Tabs>

## 多帳號 / 基於模型的路由 {#multi-account--model-based-routing}

使用您 `config.yaml` 中模型專屬的憑證，將批次操作路由到不同的提供者帳戶。這樣可免除使用環境變數的需要，並支援多租戶批次處理。

### 運作方式 {#how-it-works}

**優先順序：**
1. **編碼的 Batch/File ID**（最高）- 模型資訊內嵌於 ID 中
2. **Model 參數** - 透過標頭（`x-litellm-model`）、查詢參數，或請求本文
3. **自訂提供者**（備援）- 使用環境變數

### 組態 {#configuration}

```yaml
model_list:
  - model_name: gpt-4o-account-1
    litellm_params:
      model: openai/{{openai_large}}
      api_key: sk-account-1-key
      api_base: https://api.openai.com/v1
  
  - model_name: gpt-4o-account-2
    litellm_params:
      model: openai/{{openai_large}}
      api_key: sk-account-2-key
      api_base: https://api.openai.com/v1
  
  - model_name: azure-batches
    litellm_params:
      model: azure/{{openai_large}}
      api_key: azure-key-123
      api_base: https://my-resource.openai.azure.com
      api_version: "2024-02-01"
```

### 使用範例 {#usage-examples}

#### 情境 1：含模型的編碼檔案 ID {#scenario-1-encoded-file-id-with-model}

當您上傳帶有 model 參數的檔案時，LiteLLM 會將模型資訊編碼到檔案 ID 中。之後所有操作都會自動使用那些憑證。

```bash
# Step 1: Upload file with model
curl http://localhost:4000/v1/files \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-model: gpt-4o-account-1" \
  -F purpose="batch" \
  -F file="@batch.jsonl"

# Response includes encoded file ID:
# {
#   "id": "file-bGl0ZWxsbTpmaWxlLUxkaUwzaVYxNGZRVlpYcU5KVEdkSjk7bW9kZWwsZ3B0LTRvLWFjY291bnQtMQ",
#   ...
# }

# Step 2: Create batch - automatically routes to gpt-4o-account-1
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-bGl0ZWxsbTpmaWxlLUxkaUwzaVYxNGZRVlpYcU5KVEdkSjk7bW9kZWwsZ3B0LTRvLWFjY291bnQtMQ",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# Batch ID is also encoded with model:
# {
#   "id": "batch_bGl0ZWxsbTpiYXRjaF82OTIwM2IzNjg0MDQ4MTkwYTA3ODQ5NDY3YTFjMDJkYTttb2RlbCxncHQtNG8tYWNjb3VudC0x",
#   "input_file_id": "file-bGl0ZWxsbTpmaWxlLUxkaUwzaVYxNGZRVlpYcU5KVEdkSjk7bW9kZWwsZ3B0LTRvLWFjY291bnQtMQ",
#   ...
# }

# Step 3: Retrieve batch - automatically routes to gpt-4o-account-1
curl http://localhost:4000/v1/batches/batch_bGl0ZWxsbTpiYXRjaF82OTIwM2IzNjg0MDQ4MTkwYTA3ODQ5NDY3YTFjMDJkYTttb2RlbCxncHQtNG8tYWNjb3VudC0x \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**✅ 好處：**
- 無需在每次請求時指定 model
- 檔案與 batch ID 會「記住」是由哪個帳戶建立
- 在擷取、取消，以及檔案內容操作時自動路由

#### 情境 2：透過標頭/查詢參數指定模型 {#scenario-2-model-via-headerquery-parameter}

在 ID 中不編碼模型資訊，而是在每次請求中指定 model。

```bash
# Create batch with model header
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-model: gpt-4o-account-2" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# Or use query parameter
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-2" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# List batches for specific model
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-2" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**✅ 使用情境：**
- 一次性的批次操作
- 不同操作使用不同模型
- 明確控制路由

#### 情境 3：環境變數（備援） {#scenario-3-environment-variables-fallback}

在未指定 model 時，使用環境變數的傳統作法。

```bash
export OPENAI_API_KEY="sk-env-key"

curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```

**✅ 使用情境：**
- 向後相容
- 簡單的單一帳戶設定
- 快速原型開發

### 完整的多帳號範例 {#complete-multi-account-example}

```bash
# Upload file to Account 1
FILE_1=$(curl -s http://localhost:4000/v1/files \
  -H "x-litellm-model: gpt-4o-account-1" \
  -F purpose="batch" \
  -F file="@batch1.jsonl" | jq -r '.id')

# Upload file to Account 2
FILE_2=$(curl -s http://localhost:4000/v1/files \
  -H "x-litellm-model: gpt-4o-account-2" \
  -F purpose="batch" \
  -F file="@batch2.jsonl" | jq -r '.id')

# Create batch on Account 1 (auto-routed via encoded file ID)
BATCH_1=$(curl -s http://localhost:4000/v1/batches \
  -d "{\"input_file_id\": \"$FILE_1\", \"endpoint\": \"/v1/chat/completions\", \"completion_window\": \"24h\"}" | jq -r '.id')

# Create batch on Account 2 (auto-routed via encoded file ID)
BATCH_2=$(curl -s http://localhost:4000/v1/batches \
  -d "{\"input_file_id\": \"$FILE_2\", \"endpoint\": \"/v1/chat/completions\", \"completion_window\": \"24h\"}" | jq -r '.id')

# Retrieve both batches (auto-routed to correct accounts)
curl http://localhost:4000/v1/batches/$BATCH_1
curl http://localhost:4000/v1/batches/$BATCH_2

# List batches per account
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-1"
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-2"
```

### 使用模型路由的 SDK 用法 {#sdk-usage-with-model-routing}

```python
import litellm
import asyncio

# Upload file with model routing
file_obj = await litellm.acreate_file(
    file=open("batch.jsonl", "rb"),
    purpose="batch",
    model="gpt-4o-account-1",  # Route to specific account
)

print(f"File ID: {file_obj.id}")
# File ID is encoded with model info

# Create batch - automatically uses gpt-4o-account-1 credentials
batch = await litellm.acreate_batch(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id=file_obj.id,  # Model info embedded in ID
)

print(f"Batch ID: {batch.id}")
# Batch ID is also encoded

# Retrieve batch - automatically routes to correct account
retrieved = await litellm.aretrieve_batch(
    batch_id=batch.id,  # Model info embedded in ID
)

print(f"Batch status: {retrieved.status}")

# Or explicitly specify model
batch2 = await litellm.acreate_batch(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id="file-regular-id",
    model="gpt-4o-account-2",  # Explicit routing
)
```

### ID 編碼如何運作 {#how-id-encoding-works}

LiteLLM 使用 base64 將模型資訊編碼到檔案與 batch ID 中：

```
Original:  file-abc123
Encoded:   file-bGl0ZWxsbTpmaWxlLWFiYzEyMzttb2RlbCxncHQtNG8tdGVzdA
           └─┬─┘ └──────────────────┬──────────────────────┘
          prefix      base64(litellm:file-abc123;model,gpt-4o-test)

Original:  batch_xyz789
Encoded:   batch_bGl0ZWxsbTpiYXRjaF94eXo3ODk7bW9kZWwsZ3B0LTRvLXRlc3Q
           └──┬──┘ └──────────────────┬──────────────────────┘
           prefix       base64(litellm:batch_xyz789;model,gpt-4o-test)
```

此編碼：
- ✅ 保留與 OpenAI 相容的前綴（`file-`、`batch_`）
- ✅ 對用戶端而言是透明的
- ✅ 無需額外參數即可啟用自動路由
- ✅ 可跨所有 batch 與檔案端點運作

### 支援的端點 {#supported-endpoints}

所有 batch 與檔案端點都支援以 model 為基礎的路由：

| 端點 | 方法 | Model 路由 |
|----------|--------|---------------|
| `/v1/files` | POST | ✅ 透過標頭/查詢/本文 |
| `/v1/files/{file_id}` | GET | ✅ 自編碼 ID + 標頭/查詢 自動取得 |
| `/v1/files/{file_id}/content` | GET | ✅ 自編碼 ID + 標頭/查詢 自動取得 |
| `/v1/files/{file_id}` | DELETE | ✅ 自編碼 ID 自動取得 |
| `/v1/batches` | POST | ✅ 自檔案 ID + 標頭/查詢/本文 自動取得 |
| `/v1/batches` | GET | ✅ 透過標頭/查詢 |
| `/v1/batches/{batch_id}` | GET | ✅ 自編碼 ID 自動取得 |
| `/v1/batches/{batch_id}/cancel` | POST | ✅ 自編碼 ID 自動取得 |

## 支援的提供者 {#supported-providers}

LiteLLM 支援下列提供者原生的 batch API：

| 提供者 | 文件 |
| --- | --- |
| Azure OpenAI | [Azure OpenAI batches](./providers/azure#azure-batches-api) |
| OpenAI | [快速入門](#quick-start) |
| Google Vertex AI | [Vertex AI batch APIs](/docs/providers/vertex_batch) |
| Amazon Bedrock | [Amazon Bedrock batch inference](./providers/bedrock_batches) |
| Mistral AI | [Mistral AI Batch API](./providers/mistral_batches) |
| vLLM | [vLLM batches](./providers/vllm_batches)，當伺服器沒有 Files API 時由 LiteLLM 執行 |
| xAI | [xAI Batch API](./providers/xai_batches) |

Amazon Bedrock 是支援的 AWS batch inference 整合。

## 批次輸入檔案驗證 {#batch-input-file-validation}

LiteLLM 會在上傳時驗證批次輸入檔案。當用戶端上傳檔案到 `POST /v1/files` 並使用 `purpose="batch"` 時，LiteLLM 會在本機檢查檔案，並在任何內容轉送給提供者之前拒絕無效檔案。驗證會在每個 `/v1/files` 路由路徑上執行，包括透過 `files_settings` 設定的提供者路由上傳，以及使用 `target_model_names` 的 [LiteLLM 代管檔案](./proxy/managed_batches) 上傳

拒絕會使用 OpenAI 錯誤格式，也就是一個含有 `error`、`message`、`type`、以及 `param` 欄位的 `code` 物件，因此既有的 OpenAI SDK 錯誤處理可維持不變

### 限制批次輸入檔案大小 {#limit-the-batch-input-file-size}

在 `general_settings` 下設定 `max_batch_file_size_mb`，可限制批次輸入檔案的大小。此值為 MB 的整數。若未設定，則不套用大小上限

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  max_batch_file_size_mb: 10
```

超過上限的 `purpose="batch"` 上傳會以 HTTP `413` 拒絕：

```json
{
  "error": {
    "message": "Batch input file is 12.0 MB, which exceeds the configured max_batch_file_size_mb of 10 MB. The file was not forwarded to the provider.",
    "type": "invalid_request_error",
    "param": "file",
    "code": "413"
  }
}
```

`max_batch_file_size_mb` 僅適用於批次輸入檔案上傳。這與 `max_request_size_mb` 不同，後者適用於每一條 proxy 路由

### 限制批次檔案中的記錄數量 {#limit-the-number-of-records-in-a-batch-file}

在 `general_settings` 下設定 `max_batch_file_records`，可限制單一批次輸入檔案可包含多少請求行。空白行不計入。若未設定，則不套用記錄上限

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  max_batch_file_records: 1000
```

超過上限記錄數的 `purpose="batch"` 上傳會以 HTTP `413` 拒絕，而且檔案不會轉送給提供者：

```json
{
  "error": {
    "message": "Batch input file has more than 1000 records, which exceeds the max_batch_file_records of 1000 set in general_settings. The file was not forwarded to the provider.",
    "type": "invalid_request_error",
    "param": "file",
    "code": "413"
  }
}
```

`general_settings` 值適用於每個金鑰。proxy 管理員可以透過該金鑰中繼資料的 `max_batch_file_records` 為某個金鑰設定不同的上限，也可以在團隊的中繼資料中為整個團隊新增上限。當金鑰與其所屬團隊都設定上限時，會套用較低者，而訊息會指出設定位置

### 內容驗證 {#content-validation}

LiteLLM 一律會驗證 `purpose="batch"` 上傳內容。不需設定任何選項。檔名必須以 `.jsonl` 結尾，且比對時不分大小寫。檔案必須至少包含一行非空白行。每一行非空白行都必須是有效 JSON。每一行都必須是 JSON 物件。每個物件都必須包含 `custom_id`、`method`、`url`、以及 `body` 金鑰

若檔案未通過任一檢查，會以 HTTP `400` 和 `"type": "invalid_request_error"` 拒絕。`param` 欄位會指出有問題的欄位：若副檔名錯誤、檔案為空、某一行不是有效 JSON，或某一行不是 JSON 物件，則為 `file`。若某一行缺少必要金鑰，`param` 會是缺少的金鑰，例如 `method`。`message` 在相關情況下會包含以 1 為起始的行號。行號會計算檔案中的每一行，包括空白行

### 提供者批次限制 {#provider-batch-limits}

每個提供者都會強制執行其自身對批次輸入檔案的限制。請用它們來決定 `max_batch_file_size_mb` 的值

| 提供者 | 最大輸入檔案大小 | 最大請求數 |
|----------|---------------------|--------------|
| [OpenAI](https://developers.openai.com/api/docs/guides/batch) | 200 MB | 每個 batch 50,000 筆 |
| [Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/batch) | 200 MB | 每個檔案 100,000 筆 |
| [Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini) | 1 GB | 每個 job 200,000 筆 |
| [Amazon Bedrock](https://docs.aws.amazon.com/general/latest/gr/bedrock.html) | 每個檔案 1 GB | 請參閱 AWS 服務配額 |

Azure OpenAI 在提供自有 Blob Storage 時，將其檔案上限提高到 1 GB。Vertex AI 的上限適用於 Cloud Storage 輸入。Amazon Bedrock 也會限制總工作大小，對於多數模型上限為 5 GB。請將 `max_batch_file_size_mb` 設為您路由批次流量到的提供者中最小限制值以下或等於該值

## 批次上傳與下載限制 {#batch-upload-and-download-limits}

有兩項設定會限制呼叫者可上傳批次輸入檔案與下載檔案內容的頻率。除非設定，否則兩者都為關閉狀態

| 設定 | 計算項目 | 視窗 |
| --- | --- | --- |
| `max_batch_file_uploads_per_day` | 具 `purpose="batch"` 的 `POST /v1/files` 上傳 | UTC 日 |
| `max_file_downloads_per_minute` | 單一檔案的 `GET /v1/files/{file_id}/content` 呼叫 | 一分鐘 |

```yaml
general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  max_batch_file_uploads_per_day: 50
  max_file_downloads_per_minute: 10
```

超過任一限制的請求都會被拒絕，並回傳 HTTP `429` 與 `Retry-After` 標頭，該標頭提供距離視窗重設還剩幾秒。對於上傳而言，重設時間為 UTC 00:00。訊息會指出限制名稱、其值，以及設定位置：

```json
{
  "error": {
    "message": "Download limit reached for file file-abc123: max_file_downloads_per_minute is 10 for this key (set in general_settings). Retry in 18 seconds.",
    "type": "rate_limit_error",
    "param": null,
    "code": "429"
  }
}
```

下載限制是逐檔案計算，因此在某一檔案上觸及限制的呼叫者，仍可下載其他檔案。它涵蓋每個檔案 ID，不論是批次輸入、輸出或錯誤檔案

### 為每個金鑰或團隊設定限制 {#setting-limits-per-key-or-team}

`general_settings` 值是一個預設值，每個金鑰都會各自計入。沒有虛擬金鑰的 JWT 呼叫者則改以其使用者 ID 計算。代理程式管理員可以在某個金鑰的 metadata 中設定相同名稱，藉此變更該金鑰的限制，並以此取代該金鑰的預設值：

```bash
curl -X POST 'http://localhost:4000/key/update' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"key": "sk-...", "metadata": {"max_file_downloads_per_minute": 2}}'
```

在團隊的 metadata 中設定該名稱，會新增第二個限制，由該團隊中的每個金鑰共同分享。當兩者都適用時，請求必須同時符合兩者，而被其中一個拒絕的請求不會消耗另一個的配額

只有代理程式管理員可以在金鑰或團隊 metadata 中設定、變更或清除 `max_batch_file_records`、`max_batch_file_uploads_per_day` 與 `max_file_downloads_per_minute`，包括傳送至 `POST /user/new` 的 metadata。來自其他角色、嘗試變更這些設定的請求都會被 `403` 拒絕。`/config/update` 會拒絕非正整數的值

### 哪些項目會計入限制 {#what-counts-against-the-limits}

未通過批次輸入檔案驗證的上傳（格式錯誤、記錄過多、檔案過大）不會計入。通過驗證的上傳即使之後被防護欄或提供者拒絕，也仍會計入；而下載即使提供者對其返回錯誤，也仍會計入

在已設定 Redis 的情況下，計數會在每個 proxy 執行個體與 worker 之間共享。未設定 Redis 時，每個 worker 程序都會保有自己的計數，因此呼叫者最多可達到限額乘以 worker 數量的次數，而且在 proxy 重新啟動時計數會重設。每個 worker 最多會保留 20,000 個存活中的計數器（每個呼叫者與視窗各一個，以及下載時每個檔案 ID 各一個），而當存活數量超過此上限時，最接近到期的那一個會被捨棄，因此該呼叫者會較早開始新的視窗

這些限制適用於上方的 `/v1/files` 路由，包括 `/files` 與 `/{provider}/v1/files`。提供者直通路由不會被計入

## Batches API 的速率限制如何運作 {#how-rate-limiting-for-batches-api-works}

批次速率限制會在用戶端呼叫 `POST /v1/batches` 時強制執行，而不是在輸入檔案上傳時。

1. 用戶端使用 `POST /v1/files` 上傳 JSONL 輸入檔案。此上傳不會消耗批次 TPM 或 RPM 配額。
2. 當用戶端建立批次時，LiteLLM 會下載並評估所參照的輸入檔案。
3. LiteLLM 會以原子方式將完整檔案與每個適用限制進行檢查。
4. 若任何限制會被超過，LiteLLM 會回傳 `429`，且不會將批次提交給提供者。否則，它會記錄用量並建立提供者批次。

這使 LiteLLM 能在提供者處理之前先接受或拒絕該批次。

### LiteLLM 計算哪些項目 {#what-litellm-counts}

| 限制 | 批次計費 |
| --- | --- |
| RPM | 每筆 JSONL 記錄計為一個請求。 |
| TPM | 每筆記錄的 `body.messages`、`body.prompt` 或 `body.input` 中找到的輸入 token。 |
| 專案 ITPM | 相同的輸入 token 數量，依每筆記錄的 `body.model` 分組。 |
| 專案 OTPM | 每筆記錄的輸出 token 預留量，依 `body.model` 分組。LiteLLM 在存在時會使用 `max_tokens`、`max_completion_tokens` 或 `max_output_tokens`，並且會計入 `n` 或 `best_of`。embedding 記錄不會預留任何輸出 token。若未設定輸出上限，LiteLLM 會使用 v3 limiter 內建的估算值，且不會超過最小適用的 OTPM 限制。 |

如果 LiteLLM 無法對單一記錄進行 tokenization，會改用基於序列化後記錄大小的保守估算。格式錯誤的 JSONL 行仍會計為一個請求。

:::important

`LITELLM_TPM_TOKEN_RESERVATION_ENABLED` 不會控制批次速率限制。該變數控制的是即時請求（例如 chat completions）的請求前預留。除非啟用下方其中一個批次專用的略過設定，否則 `POST /v1/batches` 一律使用此處所述的批次輸入檔案 limiter。

:::

### 已排入佇列的 token 限制 {#enqueued-token-limits}

每分鐘視窗不適合批次：批次可能執行數小時，但其整個輸入檔案會在提交時一次計入單一分鐘。若要改以未完成批次工作量來管理批次提交，請在金鑰或團隊 metadata 中設定已排隊 token 配額：

```bash
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"metadata": {"batch_enqueued_token_limit": 100000}}'
```

`batch_enqueued_token_limit` 也可在團隊 metadata 中使用。當金鑰與其所屬團隊都設定了此項時，批次必須同時符合兩者的配額。

只有代理程式管理員可以設定或變更 `batch_enqueued_token_limit`。其他角色對金鑰與團隊提出、嘗試寫入此值的請求，會被 `403` 拒絕。

當金鑰或團隊具有已排隊 token 限制時，批次提交只會受該配額管理：

1. 當用戶端建立批次時，LiteLLM 會將檔案的估算 token（輸入 token 加上每筆記錄的輸出上限）預留於該配額中。
2. 如果批次無法納入，LiteLLM 會回傳 `429`，指出已排隊 token 限制名稱，且不會將批次提交給提供者。
3. 當 LiteLLM 提供的回應顯示批次處於終態（已完成、失敗、已過期或已取消）時，會退還該預留。輪詢 `GET /v1/batches/{batch_id}` 與使用 `POST /v1/batches/{batch_id}/cancel` 取消都符合條件。
4. 批次提交不會被計入每分鐘 TPM 與 RPM 視窗，因此即使某個批次的記錄數超過金鑰的 RPM，只要符合配額仍會被接受。

即時流量，例如 chat completions，不受影響：它們仍然會一如既往地消耗金鑰的 TPM 與 RPM 限制。

有兩個需要注意的細節：

- `disable_batch_input_file_rate_limiting` 與 `skip_batch_input_file_rate_limiting_for_providers` 具有優先權。當它們適用時，LiteLLM 不會進行已排隊 token 計算。
- 對於 LiteLLM 從未觀察到終態的批次預留（例如，只曾直接對提供者輪詢的批次），會在 8 天後過期。

### 作業行為 {#operational-behavior}

| 行為 | 營運影響 |
| --- | --- |
| 計費是以提交的檔案為基礎 | 批次 TPM 與 RPM 計數器不會與提供者的最終用量進行對帳。最終成本追蹤是獨立的。 |
| 完整檔案無法下載或評估 | LiteLLM 會記錄錯誤，並提交該批次而不將其計入 TPM 或 RPM。若您的部署需要嚴格的速率限制強制執行，請監控這些錯誤。 |
| 未設定適用的速率限制 | LiteLLM 會提交批次，而不下載該檔案進行速率限制計費。 |
| API 金鑰具有模型 allowlist | LiteLLM 會讀取檔案，並在提交前驗證每個 `body.model`。 |

### 略過輸入檔案預先讀取 {#skipping-the-input-file-pre-read}

讀取大型 JSONL 檔案可能會增加批次提交延遲。如果您不需要在提交時將批次計入 TPM 或 RPM，請設定以下其中一項：

```yaml
general_settings:
  # Apply to all batch submissions
  disable_batch_input_file_rate_limiting: true

  # Or apply only to batches routed to selected providers
  skip_batch_input_file_rate_limiting_for_providers:
    - bedrock
```

特定提供者的選項會使用所選路由上設定的提供者。它不會使用用戶端提供的 `custom_llm_provider` 值。

對於具有模型 allowlist 的 API 金鑰，LiteLLM 仍然必須讀取檔案以驗證每個 `body.model` 值。在此情況下，上述設定會略過 TPM 與 RPM 計數器更新，但不會略過檔案下載或模型驗證。

不支援以下選項：

- `skip_batch_input_file_rate_limiting_for_models` 會保留以供相容性使用，但沒有作用。當其被設定時，LiteLLM 會在啟動時記錄警告。
- 請求 metadata 中的 `skip_batch_input_file_rate_limiting` 標記會被忽略。

請使用上述全域或特定提供者設定，在伺服器層級管理此行為。

## Batches API 的成本追蹤如何運作 {#how-cost-tracking-for-batches-api-works}

✨ **Enterprise：** 自動化批次成本追蹤需要 LiteLLM Enterprise 授權。

對於受管理的批次，LiteLLM 會在背景監控提供者工作。當工作到達終止狀態時，LiteLLM 會：

1. 下載提供者的輸出檔案。
2. 讀取每筆成功的輸出記錄。
3. 彙總這些記錄中的提示、完成與總 token 用量。
4. 使用部署所設定的批次定價計算每筆記錄的成本。
5. 將合併後的用量與成本，記錄到建立該批次的使用者、金鑰、團隊與請求標籤。

失敗的輸出記錄會從彙總中排除。若批次因為每筆記錄都失敗而沒有輸出檔案，LiteLLM 會記錄零用量與零成本。

初始提交與完成後的彙總會分開記錄。完成後的彙總會透過標準支出追蹤，以 `aretrieve_batch` 記錄發出，因此可供 Admin UI 與已設定的記錄回呼使用。

批次成本追蹤不會變更在提交時保留的 TPM 或 RPM 計數器。這些計數器仍然是以上述的輸入檔案計算為基礎。

## [Swagger API 參考](https://docs.litellm.ai/api-reference/#/batch) {#swagger-api-reference}
