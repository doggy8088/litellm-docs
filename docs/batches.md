import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /batches {#batches}

涵蓋 Batches、Files

| 功能 | 支援 | 備註 | 
|-------|-------|-------|
| 支援的提供者 | OpenAI、Azure、Vertex、Bedrock、vLLM | - |
| ✨ 成本追蹤 | ✅ | 僅限 LiteLLM Enterprise |
| 記錄 | ✅ | 可跨所有記錄整合運作 |

## 快速入門 {#quick-start}

- 建立用於 Batch Completion 的檔案

- 建立 Batch 請求

- 列出 Batches

- 擷取特定的 Batch 與檔案內容

<Tabs>
<TabItem value="proxy" label="LiteLLM PROXY Server">

```bash
$ export OPENAI_API_KEY="sk-..."

$ litellm

# RUNNING on http://0.0.0.0:4000
```

**建立用於 Batch Completion 的檔案**

```shell
curl http://localhost:4000/v1/files \
    -H "Authorization: Bearer sk-1234" \
    -F purpose="batch" \
    -F file="@mydata.jsonl"
```

**建立 Batch 請求**

```bash
curl http://localhost:4000/v1/batches \
        -H "Authorization: Bearer sk-1234" \
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
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
```


**列出 Batches**

```bash
curl http://localhost:4000/v1/batches \
    -H "Authorization: Bearer sk-1234" \
    -H "Content-Type: application/json" \
```

</TabItem>
<TabItem value="sdk" label="SDK">

**建立用於 Batch Completion 的檔案**

```python
import litellm
import os 
import asyncio

os.environ["OPENAI_API_KEY"] = "sk-.."

file_name = "openai_batch_completions.jsonl"
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

## 多帳戶／基於模型的路由 {#multi-account--model-based-routing}

使用來自您的 `config.yaml` 中模型特定憑證，將 batch 作業路由到不同的提供者帳戶。這消除了對環境變數的需求，並可啟用多租戶 batch 處理。

### 運作方式 {#how-it-works}

**優先順序：**
1. **編碼的 Batch/File ID**（最高）- 模型資訊內嵌於 ID 中
2. **模型參數** - 透過標頭（`x-litellm-model`）、查詢參數，或請求本文
3. **自訂提供者**（備援）- 使用環境變數

### 組態 {#configuration}

```yaml
model_list:
  - model_name: gpt-4o-account-1
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-account-1-key
      api_base: https://api.openai.com/v1
  
  - model_name: gpt-4o-account-2
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-account-2-key
      api_base: https://api.openai.com/v1
  
  - model_name: azure-batches
    litellm_params:
      model: azure/gpt-4
      api_key: azure-key-123
      api_base: https://my-resource.openai.azure.com
      api_version: "2024-02-01"
```

### 使用範例 {#usage-examples}

#### 情境 1：帶有模型的編碼檔案 ID {#scenario-1-encoded-file-id-with-model}

當您上傳含有模型參數的檔案時，LiteLLM 會將模型資訊編碼到檔案 ID 中。所有後續作業都會自動使用那些憑證。

```bash
# Step 1: Upload file with model
curl http://localhost:4000/v1/files \
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234" \
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
  -H "Authorization: Bearer sk-1234"
```

**✅ 好處：**
- 無需在每個請求中都指定模型
- 檔案與 batch ID 會「記住」是由哪個帳戶建立
- 擷取、取消與檔案內容作業會自動路由

#### 情境 2：透過標頭／查詢參數提供模型 {#scenario-2-model-via-headerquery-parameter}

在 ID 中不編碼模型資訊，而是在每個請求中指定模型。

```bash
# Create batch with model header
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer sk-1234" \
  -H "x-litellm-model: gpt-4o-account-2" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# Or use query parameter
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-2" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'

# List batches for specific model
curl "http://localhost:4000/v1/batches?model=gpt-4o-account-2" \
  -H "Authorization: Bearer sk-1234"
```

**✅ 使用情境：**
- 一次性的 batch 作業
- 不同作業使用不同模型
- 對路由進行明確控制

#### 情境 3：環境變數（備援） {#scenario-3-environment-variables-fallback}

在未指定模型時，使用環境變數的傳統方式。

```bash
export OPENAI_API_KEY="sk-env-key"

curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer sk-1234" \
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

### 完整多帳戶範例 {#complete-multi-account-example}

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

### 使用 SDK 與模型路由 {#sdk-usage-with-model-routing}

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

編碼方式：
- ✅ 保留與 OpenAI 相容的前綴（`file-`、`batch_`）
- ✅ 對用戶端是透明的
- ✅ 無需額外參數即可啟用自動路由
- ✅ 可跨所有 batch 與 file 端點運作

### 支援的端點 {#supported-endpoints}

所有 batch 與 file 端點都支援以 model 為基礎的路由：

| 端點 | 方法 | Model 路由 |
|----------|--------|---------------|
| `/v1/files` | POST | ✅ 透過標頭/查詢/本文 |
| `/v1/files/{file_id}` | GET | ✅ 由編碼後的 ID + 標頭/查詢自動判定 |
| `/v1/files/{file_id}/content` | GET | ✅ 由編碼後的 ID + 標頭/查詢自動判定 |
| `/v1/files/{file_id}` | DELETE | ✅ 由編碼後的 ID 自動判定 |
| `/v1/batches` | POST | ✅ 由 file ID + 標頭/查詢/本文自動判定 |
| `/v1/batches` | GET | ✅ 透過標頭/查詢 |
| `/v1/batches/{batch_id}` | GET | ✅ 由編碼後的 ID 自動判定 |
| `/v1/batches/{batch_id}/cancel` | POST | ✅ 由編碼後的 ID 自動判定 |

## **支援的提供者**: {#supported-providers}
### [Azure OpenAI](./providers/azure#azure-batches-api) {#azure-openaiprovidersazureazure-batches-api}
### [OpenAI](#quick-start) {#openaiquick-start}
### [Vertex AI](./providers/vertex#batch-apis) {#vertex-aiprovidersvertexbatch-apis}
### [Bedrock](./providers/bedrock_batches) {#bedrockprovidersbedrock_batches}
### [vLLM](./providers/vllm_batches) {#vllmprovidersvllm_batches}

## Batches API 的成本追蹤如何運作 {#how-cost-tracking-for-batches-api-works}

LiteLLM 透過記錄兩個關鍵事件來追蹤 batch 處理成本：

| 事件類型 | 說明 | 記錄時間 |
|------------|-------------|------------------|
| `acreate_batch` | 初始 batch 建立 | 當 batch 請求被提交時 |
| `batch_success` | 最終用量與成本 | 當 batch 處理完成時 |

成本計算：

- LiteLLM 會輪詢 batch 狀態直到完成
- 完成後，會彙總輸出檔案中所有回應的用量與成本
- 總 `token` 與 `response_cost` 會反映所有 batch 回應的合併指標

## [Swagger API 參考](https://litellm-api.up.railway.app/#/batch) {#swagger-api-referencehttpslitellm-apiuprailwayappbatch}
