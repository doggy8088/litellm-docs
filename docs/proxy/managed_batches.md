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

以下批次模型使用 gpt-5.4-mini，OpenAI 與 Azure Global Batch 都支援。

```yaml showLineNumbers title="litellm-config.yaml" keep-model-ids
model_list:
  - model_name: "gpt-5.4-mini-batch"
    litellm_params:
      model: azure/gpt-5.4-mini-general-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
    model_info:
      mode: batch # metadata, tells developers this is a batch model

  - model_name: "gpt-5.4-mini-batch"
    litellm_params:
      model: openai/gpt-5.4-mini
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
  master_key: os.environ/LITELLM_MASTER_KEY

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

```bash keep-model-ids
curl -L -X POST 'https://${PROXY_BASE_URL}/key/generate' \
-H 'Authorization: Bearer ${PROXY_API_KEY}' \
-H 'Content-Type: application/json' \
-d '{"models": ["gpt-5.4-mini-batch"]}'
```

傳回的虛擬金鑰會授予對 batch 模型的存取權（請參閱 [開發者使用方式](#developer-usage)）。

## （開發者）使用方式 {#developer-usage}

建立 LiteLLM 代管檔案，並對其執行 batch 操作。以下步驟示範使用 curl 的原始 HTTP 呼叫；若要以 OpenAI Python SDK 進行相同工作流程，請參閱 [Batch 生命週期](#batch-lifecycle)。

### 1. 建立 request.jsonl  {#1-create-requestjsonl}

每一行中的 `model` 必須是來自 `/model_group/info` 且帶有 `mode: batch` 的模型名稱。

```json showLineNumbers title="request.jsonl" keep-model-ids
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-5.4-mini-batch", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello world!"}],"max_completion_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-5.4-mini-batch", "messages": [{"role": "system", "content": "You are an unhelpful assistant."},{"role": "user", "content": "Hello world!"}],"max_completion_tokens": 1000}}
```

LiteLLM 會將模型名稱轉換為 Azure 部署專屬的值（例如 `gpt-5.4-mini-general-deployment`）。

### 2. 上傳檔案  {#2-upload-file}

`target_model_names` 會啟用 LiteLLM 代管檔案與請求驗證。它必須與 request.jsonl 中的 `model` 相符。上傳會回傳一個檔案物件；其 `id` 是步驟 3 的 `input_file_id`。

```bash showLineNumbers keep-model-ids
export LITELLM_BASE_URL="http://0.0.0.0:4000"
export LITELLM_API_KEY="sk-<your-litellm-api-key>"

curl -s "${LITELLM_BASE_URL}/v1/files" \
  -H "Authorization: Bearer ${LITELLM_API_KEY}" \
  -F purpose="batch" \
  -F file="@./request.jsonl" \
  -F target_model_names="gpt-5.4-mini-batch"
```

**檔案會寫入哪裡？**

檔案會寫入所有符合 `target_model_names` 的部署（此處：Azure `gpt-5.4-mini-general-deployment` 與 OpenAI `gpt-5.4-mini`）。這讓步驟 3 能在這些部署之間進行負載平衡。

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

## 存取控制 {#access-control}

每個受管理批次與檔案都屬於建立它的使用者、團隊與金鑰，LiteLLM 會在每個批次與檔案端點上檢查該所有權。共用一個 proxy 的租戶無法看到或碰觸彼此的批次工作或結果。

| 呼叫者 | 可擷取、取消、列出與下載 |
|--------|------------------------------------------|
| Proxy 管理員 | 每個批次與檔案 |
| 建立該批次的使用者 | 是 |
| 同一團隊的另一把金鑰或使用者 | 是 |
| 不同團隊的金鑰或使用者 | 否 |

沒有存取權的呼叫者會從 `GET /v1/batches/{batch_id}`、`POST /v1/batches/{batch_id}/cancel`、`GET /v1/files/{file_id}` 與 `GET /v1/files/{file_id}/content` 收到 `403`，當 `input_file_id` 屬於其他人時，也會從 `POST /v1/batches` 收到 `403`。`GET /v1/batches` 只回傳呼叫者可存取的批次，因此另一團隊的金鑰會得到空清單。批次的輸出與錯誤檔案與該批次有相同的所有者與團隊，因此相同規則涵蓋其結果（請參閱[輸出與錯誤檔案](#output-and-error-files)）。

有團隊但沒有使用者的金鑰可抵達其團隊的每個批次。既沒有使用者也沒有團隊的金鑰只能抵達它建立的批次。

若還要將每個團隊的批次資料保存在各自的儲存空間中，請在每個團隊的中繼資料中以 `allowed_s3_buckets` 列出其 bucket，並讓呼叫者在上傳與建立批次時指名其 bucket，或給每個團隊一個有自己 bucket 的批次模型。兩種設定方式請參閱 [Bedrock Batches](../providers/bedrock_batches#how-do-i-keep-each-teams-batch-data-in-its-own-bucket)。

## Batch 生命週期 {#batch-lifecycle}

batch 的 `status` 會依序經過 `validating` → `in_progress` → `finalizing` → `completed`。其他終止狀態為 `failed`（驗證失敗）、`expired`（completion window 已過），以及 `cancelled`（在取消呼叫之後，會先回報 `cancelling`）。

下方腳本使用 OpenAI Python SDK 執行完整生命週期：上傳輸入檔案、建立 batch、輪詢直到終止狀態，然後下載輸出檔案（若沒有輸出，則下載錯誤檔案）。

```python showLineNumbers title="create_batch.py" keep-model-ids
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
    extra_body={"target_model_names": "gpt-5.4-mini-batch"},
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

## 輸出與錯誤檔案 {#output-and-error-files}

當受管理批次完成時，提供者會建立一個輸出檔案，若有任何請求失敗，還會建立一個錯誤檔案。LiteLLM 會為每一個儲存一列受管理檔案，其所有者與團隊與該批次相同，因此它們會像上傳的檔案一樣出現在檔案端點中，並遵循相同的存取規則。

- `GET /v1/files` 列出輸入、輸出與錯誤檔案。
- `GET /v1/files?purpose=batch` 只列出輸入檔案。
- `GET /v1/files?purpose=batch_output` 列出輸出與錯誤檔案。

### 檔案詳細資訊 {#file-details}

當 LiteLLM 首次儲存一列輸出或錯誤檔案時，它會向提供者詢問該檔案的詳細資訊，例如其大小與建立時間。每次查詢會對逾時、連線錯誤、429 與 5xx 回應重試最多 3 次，並在總計 10 秒後放棄。

若提供者仍未回應，LiteLLM 會改為儲存一個基本項目，其 `purpose: "batch_output"`、`status: "processed"` 與 `bytes: 0`（若背景 poller 已下載該檔案以計算成本，則為實際大小）。該檔案可立即被列出與下載。

LiteLLM 會在稍後以下一個 `GET /v1/files/{file_id}` 呼叫，或在該項目至少 60 秒舊後的下一次批次擷取、取消或 poller 執行時，將基本項目換成提供者的詳細資訊。只有檔案詳細資訊會改變：所有者、團隊與提供者對應維持不變，且在擷取其詳細資訊期間被刪除的檔案會保持刪除。已有提供者詳細資訊的列永遠不會再次被擷取。

### 哪些端點會呼叫提供者 {#which-endpoints-call-the-provider}

| 端點 | 向提供者詢問檔案詳細資訊 | 儲存或變更檔案列 | 若提供者查詢失敗 |
| --- | --- | --- | --- |
| `GET /v1/files` | 否 | 否 | 不適用 |
| `GET /v1/files/{file_id}` | 僅限基本項目，或沒有已儲存詳細資訊的較舊列 | 以提供者的詳細資訊更新基本項目 | 回傳基本項目。沒有已儲存詳細資訊的較舊列會回傳錯誤 |
| `GET /v1/files/{file_id}/content` | 否，它會下載內容 | 否 | 回傳錯誤 |
| `DELETE /v1/files/{file_id}` | 否，它會要求提供者刪除檔案 | 刪除該列 | 回傳錯誤並保留該列 |
| `GET /v1/batches` | 否 | 為尚無列的輸出或錯誤檔案儲存基本項目 | 不適用 |
| `GET /v1/batches/{batch_id}` | 針對沒有列的輸出或錯誤檔案，或至少 60 秒舊的基本項目 | 儲存該列，或更新基本項目 | 儲存或保留基本項目，且仍回傳該批次 |
| `POST /v1/batches/{batch_id}/cancel` | 與批次擷取相同 | 與批次擷取相同 | 與批次擷取相同 |

追蹤批次成本的背景 poller 行為與批次擷取相同。當 `GET /v1/files` 或 `GET /v1/batches` 以提供者或模型呼叫時，清單會直接來自該提供者，而不是資料庫。

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

### 儲存每一行的請求與回應 {#storing-every-lines-request-and-response}

成本列彙總整個批次，而提供者會在一段時間後刪除批次檔案。若要保留每個請求及其答案，請在 `batch_line_item_callbacks` 下列出 bucket。一旦 poller 為某批次計費，它會將該批次的記錄寫入該處列出的每個 bucket，格式為 JSONL part 物件，每行一筆記錄

```yaml showLineNumbers title="config.yaml"
litellm_settings:
  batch_line_item_callbacks: ["s3_v2", "gcs_bucket"]
  s3_callback_params:          # read by s3_v2, same keys as the s3 logging callback
    s3_bucket_name: my-batch-logs
    s3_region_name: us-east-2
    s3_path: litellm           # optional prefix
```

`gcs_bucket` 會從環境讀取 `GCS_BUCKET_NAME` 與 `GCS_PATH_SERVICE_ACCOUNT`，與 [GCS 記錄回呼](./logging#google-cloud-storage-buckets) 相同，且與該回呼一樣需要 enterprise 授權。在此列出 bucket 不會開啟對它的請求記錄，而 `success_callback` 也不會開啟批次行項目。這兩個設定彼此獨立

批次的 part 位於該批次完成的那一天（UTC）之下，並以您從 `POST /v1/batches` 取回的批次 id 為名，id 中的任何 `/` 都會被換成 `_`。Vertex AI 不回報完成時間，因此 Vertex AI 批次的 part 與其記錄的 `finished_at` 會使用該批次建立的時間：

| Bucket | Part 物件 |
| --- | --- |
| S3 | `<s3_path>/batch_line_items/<YYYY-MM-DD>/<batch id>/part-00000.jsonl`, `part-00001.jsonl`, ... |
| GCS | `batch_line_items/<YYYY-MM-DD>/<batch id>/part-00000.jsonl`, `part-00001.jsonl`, ... |

當一個 part 中的原始請求與結果行達到 16 MB 時，該 part 就會關閉（`BATCH_LINE_ITEMS_MAX_PART_BYTES` 可變更此值），下一筆記錄會開始新的 part。大多數批次都放得進 `part-00000.jsonl`。記錄依提供者輸出檔案的順序，接著是其錯誤檔案，因此依序讀取 part 就是依該順序讀取批次

part 的每一行是一筆記錄：

```json showLineNumbers title="one record (pretty-printed, trimmed)"
{
  "batch_id": "bGl0ZWxsbV9wcm94eTttb2RlbF9pZDpjZDky...",
  "custom_id": "request-1",
  "status": "success",
  "request": {
    "custom_id": "request-1",
    "method": "POST",
    "url": "/v1/chat/completions",
    "body": {
      "model": "gpt-5.4-nano",
      "messages": [
        {"role": "system", "content": "Answer in one word"},
        {"role": "user", "content": "Is the sky blue?"}
      ]
    }
  },
  "response": {
    "id": "batch_req_6acdfc86d8548190b47c54904f2f5727",
    "custom_id": "request-1",
    "response": {
      "status_code": 200,
      "body": {
        "id": "chatcmpl-EYTHQP5vBYthXQpZJLgGTmNbLjwdq",
        "object": "chat.completion",
        "choices": [
          {"index": 0, "message": {"role": "assistant", "content": "Yes"}, "finish_reason": "stop"}
        ],
        "usage": {"prompt_tokens": 19, "completion_tokens": 5, "total_tokens": 24}
      }
    },
    "error": null
  },
  "usage": {"prompt_tokens": 19, "completion_tokens": 5, "total_tokens": 24},
  "response_cost": 5.025e-06,
  "model": "gpt-5.4-nano",
  "custom_llm_provider": "openai",
  "metadata": {
    "user_api_key_hash": "d6f6bc353e745199f3f1aa285952f2dc...",
    "user_api_key_alias": "batch-jobs",
    "user_api_key_team_id": null,
    "user_api_key_team_alias": null,
    "user_api_key_user_id": "key:d6f6bc353e745199f3f1aa285952f2dc...",
    "user_api_key_org_id": null
  }
}
```

| 欄位 | 內容 |
| --- | --- |
| `batch_id` | 您從 `POST /v1/batches` 取回的批次 id |
| `custom_id` | 您輸入檔案中的 `custom_id`，或 Bedrock 的 `recordId` |
| `status` | 提供者回應請求時為 `success`，拒絕時為 `failure` |
| `request` | 提供者持有的您的輸入行：OpenAI、Azure 與 Mistral 為您上傳的那一行，Bedrock 為帶有 `recordId` 與 `modelInput` 的轉換後行，Vertex AI 為帶有 `request` 的轉換後行，其標籤中帶有您的 `custom_id` |
| `response` | 提供者的輸出或錯誤行，完全照提供者寫入的樣子 |
| `usage` | 該行的 token，失敗的行為 `null` |
| `response_cost` | 該行以部署批次費率計算的成本，失敗的行為 `0`。一個批次的記錄總和等於成本列的 `spend` |
| `model`, `custom_llm_provider` | 該批次執行所在的部署 |
| `metadata` | 建立該批次的金鑰、團隊、使用者與組織。`user_api_key_hash` 是 SHA-256 雜湊：虛擬金鑰的雜湊，或對於沒有虛擬金鑰建立的批次（例如以 OAuth2 token），為其替代儲存內容的雜湊，因此 bucket 永遠不會持有可用的憑證 |

幾件需要知道的事：

- 只有受管理批次才有記錄，也就是以 `target_model_names` 上傳的檔案建立的批次，因為 poller 只為那些計費
- 每行都失敗的批次仍會得到其 part，裡面是其錯誤行
- 對於沒有輸入檔案的 Anthropic、其 `input` 清單被拆成每個項目一列的 Vertex AI embeddings 行，以及輸入檔案無法再被讀取時，`request` 為 `null`
- 其列不帶 `custom_id` 的 Vertex AI 行會顯示 `unknown`，如同批次的輸出檔案（或對於以 Vertex AI 自己的列格式上傳的批次，完全沒有 `custom_id`），並得到 `request` `null`，因此您給了 `custom_id` `unknown` 的 Vertex AI 行也會得到 `request` `null`
- 當錯誤檔案無法再被讀取時，part 會略過失敗的行並記錄一則警告，因此每行都失敗的批次接著就得不到 part
- 當建立該批次的金鑰或團隊在其記錄設定中關閉了訊息記錄、當 `litellm.turn_off_message_logging` 開啟，或當該金鑰或團隊已不存在時，`request` 與 `response` 都是 `null`，其他每個欄位則保留
- 沒有虛擬金鑰建立的批次，例如以 JWT、內建 OAuth2 token 或 master key，會遵循其團隊的記錄設定與 `litellm.turn_off_message_logging`
- 從 Admin UI 工作階段建立的批次，或在自訂驗證下以 `sk-` 憑證（包括自訂驗證開啟時的 master key）或在沒有 master key 的 proxy 上建立的批次，會得到 `request` 與 `response` `null`，因為 litellm 找不到它記錄的金鑰或團隊。以恰好 64 個十六進位字元的 OAuth2 token 建立的批次也是如此，它看起來像虛擬金鑰的雜湊
- 批次的 part 會在背景寫入：當為該批次計費並將其標記為完成的 poller 執行處理完它找到的其他每個批次後，每個 proxy worker 一次寫一個批次，一個批次內一次寫一個 part，因此為各行計價或緩慢、無法連線的 bucket 都不會拖住計費。已計費批次的輸出檔案會在輪到它時再次下載，因此等待輪到的批次不會將其任何檔案留在記憶體中。若屆時輸出檔案無法再被讀取，或該批次的模型已從 proxy 移除，則不會寫入任何 part，並會記錄一則指名該批次的錯誤。當 bucket 回應 403、429、500 或 503，或連線失敗或逾時，`s3_v2` 會嘗試寫入最多 3 次，每次嘗試在 `S3_UPLOAD_ATTEMPT_TIMEOUT_SECONDS`（預設 30）後中止，與請求記錄相同，而 `gcs_bucket` 嘗試一次。當 bucket 在未回應的情況下關閉連線，共用的 HTTP 用戶端會立即再次送出該 part，如同對請求記錄一樣。仍失敗的 part 寫入會被記錄為一則指名該批次與該 part 的錯誤，且永遠不會在之後重試，該批次的其他 part 仍會被寫入，且該批次保持已計費。`s3_v2` 透過與您的請求記錄相同的 S3 logger 寫入 part，因此失敗的 part 寫入會計入其 `S3Logger` 回呼失敗指標，一個 part 的重試會計入其每次 flush 的重試警告，且在 `s3_adaptive_concurrency` 開啟時，受節流的 part 寫入會降低共用上傳上限，但永遠不低於 `s3_max_concurrent_uploads`。part 寫入不會等待該上限，因此一個 worker 可以有一個 PUT 超過它
- Part 是 UTF-8，非 ASCII 文字保持原樣。持有來自提供者的未配對代理位元組（surrogate）跳脫（例如孤立的 `\ud83d`）的行沒有 UTF-8 形式，因此僅該行會以其非 ASCII 字元被跳脫的方式寫入
- 有多個 proxy 實例時，已過期、已取消或全部失敗的批次的 part 可能由多個實例寫入。名稱相同，因此 bucket 每個 part 只保留一份
- 在 proxy 關閉時仍在等待寫入的批次不會被寫入，而在關閉時正在寫入的批次可能只留下其最初的 part。當一個 worker 上有 50 個批次（`MAX_OBJECTS_PER_POLL_CYCLE`）正在等待或寫入時，下一個批次的記錄會被略過並記錄一則錯誤
- 寫入批次的 part 會在成本列讀取之後，第二次從提供者讀取其輸出與錯誤檔案，以及其輸入檔案（除非主體被捨棄）。這些讀取是檔案內容呼叫，因此您的請求記錄回呼會像記錄其他呼叫一樣記錄它們
- 寫入 part 會像成本列當初計價一樣，再次為每一行計價，因此計價對每行做的任何事都會再發生一次，例如當 `key_management_system` 讀取密鑰時的密鑰管理器查詢，或 Vertex AI 批次每行的 INFO 記錄行。檢查建立金鑰或團隊的記錄設定也會每個批次查詢一次其密鑰參照
- `s3_use_team_prefix`、`s3_use_key_prefix`、`s3_log_prompts_only` 與 `s3_strip_base64_files` 不適用於這些 part
- 當批次被寫入時，worker 會持有其輸入、輸出與錯誤檔案，加上正在建立與送出的 part 的記錄，因此請為您最大批次的檔案加上數倍 part 大小來規劃記憶體。為 HTTPS bucket 加密 part 會在 worker 的事件迴圈上執行，因此大的 part 會短暫拖慢該 worker 正在服務的請求。在 proxy 關閉時仍在計價的 part 會讓關閉多花幾秒鐘

## 常見問題 {#faq}

### 我的檔案會寫到哪裡？ {#where-are-my-files-written}

當指定 `target_model_names` 時，檔案會寫入所有符合它的部署。不需要額外基礎架構。

### 批次是否可能先建立在一個部署上（例如 eastus-01），但之後的擷取卻路由到不同的部署（例如 eastus2-01）？ {#could-the-batch-be-created-on-one-deployment-eg-eastus-01-but-a-subsequent-retrieve-be-routed-to-a-different-deployment-eg-eastus2-01}

不會。LiteLLM 會在初始批次建立時於各部署之間進行負載平衡。回傳的 batch id 會編碼所使用的部署，因此 retrieve、cancel 和 file content 呼叫都會黏著到該部署。
