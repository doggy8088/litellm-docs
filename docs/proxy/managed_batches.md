# [BETA] 使用 LiteLLM Managed Files 搭配 Batches {#beta-litellm-managed-files-with-batches}

<EnterpriseFeature free />

| 功能 | 支援 | 備註 |
| --- | --- | --- |
| Proxy | ✅ |  |
| SDK | ❌ | 需要用於儲存檔案 ID 的 Postgres DB |
| 適用於所有 [Batch 提供者](../batches#supported-providers) | ✅ |  |

## 概觀 {#overview}

可用於：

- 在多個 Azure Batch 部署之間進行負載平衡
- 依 key/user/team 控制 batch 模型存取（與 chat completion 模型相同）

## （Proxy 管理員）使用方式 {#proxy-admin-usage}

讓開發者可存取 Batch 模型。

### 1. 設定 config.yaml {#1-setup-configyaml}

- 為每個模型指定 `mode: batch`，讓開發者知道這是 batch 模型。
- 視需要略過特定 batch 提供者或模型的 batch 輸入檔案預先讀取（適用於自訂 vLLM batch 部署上的大型檔案）。

```yaml showLineNumbers title="litellm-config.yaml"
model_list:
  - model_name: "gpt-4o-batch"
    litellm_params:
      model: azure/gpt-4o-mini-general-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
    model_info:
      mode: batch # metadata, tells developers this is a batch model

  - model_name: "gpt-4o-batch"
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      mode: batch # metadata, tells developers this is a batch model

  - model_name: vertex-batch
    litellm_params:
      model: vertex_ai/gemini-3.5-flash
      vertex_project: <vertex-project>
      vertex_location: global
      vertex_credentials: /path/to/credentials
      gcs_bucket_name: litellm-batch-api-bucket # required param for vertexai to store files
    model_info:
      mode: batch


general_settings:
  # Optional: do not charge batch input files against TPM/RPM
  # disable_batch_input_file_rate_limiting: true

  # Optional: apply this behavior only to selected providers
  skip_batch_input_file_rate_limiting_for_providers:
    - hosted_vllm

litellm_settings:
  # Optional: require target_model_names on POST /v1/files (blocks classic file uploads)
  # require_managed_files: true
```

預設情況下，LiteLLM 會在提交前讀取每個 batch 輸入檔案，並將其 token 數與記錄數計入呼叫者的 TPM 與 RPM 限制。這可能會為大型檔案增加延遲。只有在 batch 提交不需要納入 TPM 或 RPM 計算時，才使用上述設定。若要以待處理的 batch 工作量，而非每分鐘視窗來管理 batch 提交，請參閱 [Enqueued-token limits](../batches#enqueued-token-limits)。如需詳細資訊與限制，請參閱 [Batches API 的速率限制運作方式](../batches#how-rate-limiting-for-batches-api-works)。

### 2. 建立 Virtual Key {#2-create-virtual-key}

```bash
curl -L -X POST 'https://${PROXY_BASE_URL}/key/generate' \
-H 'Authorization: Bearer ${PROXY_API_KEY}' \
-H 'Content-Type: application/json' \
-d '{"models": ["gpt-4o-batch"]}'
```

傳回的虛擬金鑰會授予對 batch 模型的存取權（請參閱 [開發者使用方式](#developer-usage)）。

## （開發者）使用方式 {#developer-usage}

建立 LiteLLM 代管檔案，並對其執行 batch 操作。以下步驟示範使用 curl 的原始 HTTP 呼叫；若要以 OpenAI Python SDK 進行相同工作流程，請參閱 [Batch 生命週期](#batch-lifecycle)。

### 1. 建立 request.jsonl  {#1-create-requestjsonl}

每一行中的 `model` 必須是來自 `/model_group/info` 且帶有 `mode: batch` 的模型名稱。

```json showLineNumbers title="request.jsonl"
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-batch", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-batch", "messages": [{"role": "system", "content": "You are an unhelpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
```

LiteLLM 會將模型名稱轉換為 Azure 部署專屬的值（例如 `gpt-4o-mini-general-deployment`）。

### 2. 上傳檔案  {#2-upload-file}

`target_model_names` 會啟用 LiteLLM 代管檔案與請求驗證。它必須與 request.jsonl 中的 `model` 相符。上傳會回傳一個檔案物件；其 `id` 是步驟 3 的 `input_file_id`。

```bash showLineNumbers
export LITELLM_BASE_URL="http://0.0.0.0:4000"
export LITELLM_API_KEY="sk-<your-litellm-api-key>"

curl -s "${LITELLM_BASE_URL}/v1/files" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}" \
  -F purpose="batch" \
  -F file="@./request.jsonl" \
  -F target_model_names="gpt-4o-batch"
```

**檔案會寫入哪裡？**

檔案會寫入所有符合 `target_model_names` 的部署（此處：`gpt-4o-mini-general-deployment` 與 `gpt-4o-mini-special-deployment`）。這可讓步驟 3 在這些部署之間進行負載平衡。

### 3. 建立 + 取得 batch {#3-create--retrieve-the-batch}

`input_file_id` 是步驟 2 中的檔案 `id`。建立呼叫會回傳一個 batch 物件；其 `status` 會依照 [Batch 生命週期](#batch-lifecycle) 中說明的狀態前進。

```bash showLineNumbers
# Create the batch
curl -s "${LITELLM_BASE_URL}/v1/batches" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h",
    "metadata": {"description": "Test batch job"}
  }'

# Retrieve the batch, using the id the create call returned
export BATCH_ID="batch_abc123"

curl -s "${LITELLM_BASE_URL}/v1/batches/${BATCH_ID}" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}"
```

### 4. 取得 Batch 內容  {#4-retrieve-batch-content}

當 batch 的 `status` 為 `completed` 時，會在 batch 上設定 `output_file_id`。內容為每行一個 JSON 結果，並以 request.jsonl 中的 `custom_id` 作為鍵。

```bash showLineNumbers
OUTPUT_FILE_ID=$(curl -s "${LITELLM_BASE_URL}/v1/batches/${BATCH_ID}" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}" | jq -r '.output_file_id')

curl -s "${LITELLM_BASE_URL}/v1/files/${OUTPUT_FILE_ID}/content" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}"
```

### 5. 列出 batches {#5-list-batches}

傳回由呼叫中的 key、user 或 team 擁有的 managed batches，依最新排序。`limit` 必須介於 0 到 100 之間，預設為 20；請使用 `after` 分頁。managed batches 不支援 `provider` 與 `target_model_names` 篩選器，並會回傳 `400`。

```bash showLineNumbers
curl -s "${LITELLM_BASE_URL}/v1/batches?limit=10" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}"
```

### 6. 取消 batch {#6-cancel-a-batch}

取消呼叫會回傳帶有 `status: "cancelling"` 的 batch。

```bash showLineNumbers
curl -s -X POST "${LITELLM_BASE_URL}/v1/batches/${BATCH_ID}/cancel" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}"
```

## Batch 生命週期 {#batch-lifecycle}

batch 的 `status` 會依序經過 `validating` → `in_progress` → `finalizing` → `completed`。其他終止狀態為 `failed`（驗證失敗）、`expired`（completion window 已過），以及 `cancelled`（在取消呼叫之後，會先回報 `cancelling`）。

下方腳本使用 OpenAI Python SDK 執行完整生命週期：上傳輸入檔案、建立 batch、輪詢直到終止狀態，然後下載輸出檔案（若沒有輸出，則下載錯誤檔案）。

```python showLineNumbers title="create_batch.py"
import json
import time
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",       # your LiteLLM proxy URL
    api_key="sk-<your-litellm-api-key>",  # your LiteLLM virtual key
)

# 1. Upload the input file (request.jsonl from Developer Usage Step 1)
batch_input_file = client.files.create(
    file=open("./request.jsonl", "rb"),
    purpose="batch",
    extra_body={"target_model_names": "gpt-4o-batch"},
)
print(f"file id: {batch_input_file.id}")

# 2. Create the batch
batch = client.batches.create(
    input_file_id=batch_input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"description": "Test batch job"},
)
print(f"batch id: {batch.id}, status: {batch.status}")

# 3. Poll until the batch reaches a terminal status
terminal_statuses = {"completed", "failed", "expired", "cancelled"}
while batch.status not in terminal_statuses:
    time.sleep(30)
    batch = client.batches.retrieve(batch.id)
    print(f"status: {batch.status}")

# 4. Download the results: output file, or error file when there is no output
result_file_id = batch.output_file_id or batch.error_file_id

if result_file_id:
    file_response = client.files.content(result_file_id)
    with open("batch_output.jsonl", "w") as output_file:
        for line in file_response.text.strip().split("\n"):
            json.dump(json.loads(line), output_file)
            output_file.write("\n")
    print(f"results written to batch_output.jsonl")
```

若要在 batch 完成前取消它，請呼叫 `client.batches.cancel(batch.id)`：其狀態會變成 `cancelling`，接著是 `cancelled`。

## 可觀測性 {#observability}

一旦 managed batch 達到 `completed`，proxy 的 batch 成本輪詢器會下載其輸出檔案、為每一行定價，並為整個 batch 寫入一筆 spend log 資料列。該資料列是 `/spend/logs` 與 Logs 頁面所讀取的內容，也是每個請求的結果計數、推理 token 總數，以及 batch 成本所在之處

輪詢器以計時器執行，因此資料列會在 batch 結束後過一段時間才出現，而不是在完成的當下。`proxy_batch_polling_interval` 在 `general_settings`（或 `PROXY_BATCH_POLLING_INTERVAL` 環境變數）中設定基礎間隔（單位為秒），預設為 `3600`，而輪詢器會再額外加入最多 30 秒的抖動。在測試時，將它設為像 `30` 這樣的小值

### Spend log 欄位 {#spend-log-fields}

batch 的成本資料列具有 `call_type: "aretrieve_batch"` 與 `request_id` 的 `<batch id>_batch_cost`，其中 `<batch id>` 是傳回的 `POST /v1/batches`：

```bash showLineNumbers
curl -s "http://0.0.0.0:4000/spend/logs?request_id=${BATCH_ID}_batch_cost" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json showLineNumbers title="batch cost row (trimmed)"
{
  "request_id": "bGl0ZWxsbV9wcm94eTttb2RlbF9pZDo3YjJl..._batch_cost",
  "session_id": "bGl0ZWxsbV9wcm94eTttb2RlbF9pZDo3YjJl...",
  "call_type": "aretrieve_batch",
  "model": "gemini-2.5-flash",
  "model_group": "gemini-batch",
  "spend": 0.0003221,
  "prompt_tokens": 14,
  "completion_tokens": 256,
  "total_tokens": 270,
  "status": "success",
  "metadata": {
    "batch_models": ["gemini-2.5-flash"],
    "batch_successful_requests": 2,
    "batch_failed_requests": 1,
    "cost_breakdown": {
      "input_cost": 0.0000021,
      "output_cost": 0.00032,
      "total_cost": 0.0003221,
      "tool_usage_cost": 0.0
    },
    "usage_object": {
      "prompt_tokens": 14,
      "completion_tokens": 256,
      "total_tokens": 270,
      "completion_tokens_details": {"text_tokens": 32, "reasoning_tokens": 224}
    }
  }
}
```

| 欄位 | 內容 |
| --- | --- |
| `request_id` | 附加 `_batch_cost` 的 batch id |
| `session_id` | batch id，與 create 資料列共用，因此兩者會群組成一個 trace |
| `spend` | 整個 batch 的成本，只計入成功的行 |
| `prompt_tokens`, `completion_tokens`, `total_tokens` | 以每個成功的行加總 |
| `metadata.batch_successful_requests` | 提供者成功回應的請求 |
| `metadata.batch_failed_requests` | 它拒絕的請求，來自輸出檔案與錯誤檔案 |
| `metadata.batch_models` | batch 執行所用的模型 |
| `metadata.usage_object.completion_tokens_details.reasoning_tokens` | 針對成功的行加總的推理 token |
| `metadata.cost_breakdown` | `spend` 背後的輸入與輸出成本拆分 |

`/spend/logs/v2` 會以分頁方式回傳相同欄位，且是處理單次查詢以外任何情況時應使用的端點。即使您傳入 `request_id`，它仍需要 `start_date` 與 `end_date`，因此上方的純 `/spend/logs?request_id=` 呼叫仍是取得單一 batch 資料列的較短方式

### 在 Logs 頁面 {#on-the-logs-page}

在輪詢器執行後，開啟 [http://localhost:4000/ui/?page=logs](http://localhost:4000/ui/?page=logs)。batch 的 create 資料列與其成本資料列共用同一個 session，因此該頁面會將它們顯示為單一群組資料列，帶有 batch 的總成本與 token，並在 Type 欄位中以 **Batch** 徽章取代一般的 LLM 徽章。Status 欄位會顯示結果：當所有請求都成功時顯示綠色 **Success** 徽章；當部分請求失敗時顯示琥珀色 **N/M succeeded** 徽章，其中 `N` 是成功數量，而 `M` 是總數，因此 `2/3 succeeded` 表示三個請求中有一個失敗。Request ID 欄位會在一個小的 `batch cost` 標籤下方顯示 batch id 本身，而不是原始 `<batch id>_batch_cost` 字串，因此它與您從 `POST /v1/batches` 取得的 id 相符

點擊該列以開啟抽屜。**Batch Results** 卡片會列出 batch id、成功與失敗請求數（當失敗數不為零時，失敗數會以紅色標示），以及 batch 執行的模型。當 batch 有彙總任何推理 token 時，**Metrics** 會顯示 **Reasoning Tokens** 資料列，而 **Cost Breakdown** 則會顯示該列成本背後的輸入與輸出拆分

### 讀取部分失敗的 batch {#reading-a-partially-failed-batch}

batch 一旦在提供者端完成執行，就會達到 `completed`，不論其中每個請求是否成功，因此單看狀態無法得知失敗情況。要看成本資料列上的計數，這些計數會與 batch 本身的 `request_counts` 對應一致：

```bash showLineNumbers
# what the provider reports
curl -s "http://0.0.0.0:4000/v1/batches/${BATCH_ID}" \
  -H "Authorization: Bearer $LITELLM_API_KEY" | jq '.status, .request_counts'
# "completed"
# {"completed": 2, "failed": 1, "total": 3}

# what the spend log recorded
curl -s "http://0.0.0.0:4000/spend/logs?request_id=${BATCH_ID}_batch_cost" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  | jq '.[0].metadata | {batch_successful_requests, batch_failed_requests}'
# {"batch_successful_requests": 2, "batch_failed_requests": 1}
```

若要查看失敗請求失敗的原因，請下載 batch 的錯誤檔案。檔案中每一行對應一個被拒絕的請求，並以您在輸入檔案中設定的 `custom_id` 作為鍵：

```bash showLineNumbers
ERROR_FILE_ID=$(curl -s "http://0.0.0.0:4000/v1/batches/${BATCH_ID}" \
  -H "Authorization: Bearer $LITELLM_API_KEY" | jq -r '.error_file_id')

curl -s "http://0.0.0.0:4000/v1/files/${ERROR_FILE_ID}/content" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

失敗的請求不會產生成本，因此 `spend` 只涵蓋成功的列，而一個有一半失敗的批次，其成本大約是您預算的一半。提供者已接受但 LiteLLM 無法計價的請求，仍會計為成功，並以 `$0` 計費，這樣計數就能與提供者自身的數字對得上。所有請求都失敗的批次根本不會有輸出檔，而其成本列會記錄 `$0`、0 個成功請求，以及從錯誤檔讀取的失敗數。Anthropic 和 Bedrock 的 extended thinking 批次不會逐列回報 reasoning tokens，因此即使模型有在思考，`reasoning_tokens` 對它們仍會缺失。兩個計數無法加總為提供者總數的唯一情況，是某個輸出列不是有效 JSON；該列會在警告後被略過，且不會計入任何一個計數

## 常見問題 {#faq}

### 我的檔案會寫到哪裡？ {#where-are-my-files-written}

當指定 `target_model_names` 時，檔案會寫入所有符合它的部署。不需要額外基礎架構。

### 批次是否可能先建立在一個部署上（例如 eastus-01），但之後的擷取卻路由到不同的部署（例如 eastus2-01）？ {#could-the-batch-be-created-on-one-deployment-eg-eastus-01-but-a-subsequent-retrieve-be-routed-to-a-different-deployment-eg-eastus2-01}

不會。LiteLLM 會在初始批次建立時於各部署之間進行負載平衡。回傳的 batch id 會編碼所使用的部署，因此 retrieve、cancel 和 file content 呼叫都會黏著到該部署。
