import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# vLLM - 批次 + 檔案 API {#vllm---batch--files-api}

vLLM 的 OpenAI 相容伺服器提供 `/v1/chat/completions`、`/v1/completions`、`/v1/embeddings` 和 `/v1/responses`，但沒有 `/v1/files` 或 `/v1/batches` 路由。LiteLLM 彌補了這個缺口：對於伺服器沒有 Files API 的 `hosted_vllm` 部署，proxy 會自行儲存批次輸入，將每一行送入該部署執行，並提供批次狀態與輸出檔案，因此 OpenAI Batch API 可在 vLLM 上不變地運作

| 功能 | 支援 |
|---------|-----------|
| `/v1/files` | ✅ 由 LiteLLM 儲存 |
| `/v1/batches` | ✅ 由 LiteLLM 執行 |
| 成本追蹤 | ✅ 每一行都會計費到建立該批次的金鑰 |

此流程在 proxy 上執行，且需要資料庫（`DATABASE_URL`），因為輸入檔案、批次狀態與結果檔案都存放在那裡

## 當 LiteLLM 自行執行批次時 {#when-litellm-runs-the-batch-itself}

LiteLLM 會按請求決定。當某個部署的 `litellm_params.model` 以 `hosted_vllm/` 開頭，且其伺服器上的 `GET {api_base}/files` 回應 404 時，該部署即符合條件。其他所有部署，以及伺服器確實實作 Files API 的 `hosted_vllm` 部署（例如 vLLM production-stack router），都維持透傳行為：上傳與批次會轉送到伺服器，並由伺服器執行批次

將 `api_base` 指向伺服器的 `/v1` root，讓探測命中正確路由

## 快速開始 {#quick-start}

### 1. 設定 config.yaml {#1-setup-configyaml}

```yaml
model_list:
  - model_name: my-vllm-model
    litellm_params:
      model: hosted_vllm/Qwen/Qwen2.5-0.5B-Instruct
      api_base: http://localhost:8000/v1  # your vLLM server
      api_key: os.environ/HOSTED_VLLM_API_KEY  # only if your server checks one

general_settings:
  database_url: os.environ/DATABASE_URL
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 建立批次檔 {#3-create-batch-file}

每一行都遵循 OpenAI batch 輸入格式。LiteLLM 會以批次的部署名稱取代 `body.model`，因此您在那裡填入的內容不會改變由哪個伺服器執行該行

```jsonl
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "my-vllm-model", "messages": [{"role": "user", "content": "Hello!"}]}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "my-vllm-model", "messages": [{"role": "user", "content": "How are you?"}]}}
```

每一行都必須指定相同的 `url`，而且必須與您提供給批次的 `endpoint` 相符。`stream: true` 行、重複的 `custom_id`，以及未知的頂層欄位，會在上傳時遭到拒絕並回傳 400，且錯誤訊息會指出該行

### 4. 上傳檔案並建立批次 {#4-upload-file--create-batch}

:::tip[模型路由]
上傳時必須指定部署，可透過 `x-litellm-model` 標頭、`?model=` 查詢參數，或 `target_model_names` 表單欄位。請使用 `purpose=batch`：若以其他用途上傳到 LiteLLM 會執行批次的部署，會回應 400，因為沒有伺服器可保存該檔案。回傳的檔案 id 是一個很長的 base64 id，不是 OpenAI 風格的 `file-...` id；其上的批次操作會自動路由到同一個部署
:::

<Tabs>
<TabItem value="curl" label="cURL">

**上傳檔案**

```bash
curl http://localhost:4000/v1/files \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "x-litellm-model: my-vllm-model" \
  -F purpose="batch" \
  -F file="@batch_requests.jsonl"
```

**建立批次**

```bash
curl http://localhost:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "<file id from the upload>",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```

**檢查批次狀態**

```bash
curl http://localhost:4000/v1/batches/<batch id> \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**下載結果**

```bash
curl http://localhost:4000/v1/files/<output_file_id>/content \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

</TabItem>
<TabItem value="python" label="OpenAI SDK">

```python
import os
import time

from openai import OpenAI

client = OpenAI(api_key=os.environ["LITELLM_API_KEY"], base_url="http://localhost:4000/v1")

input_file = client.files.create(
    file=open("batch_requests.jsonl", "rb"),
    purpose="batch",
    extra_headers={"x-litellm-model": "my-vllm-model"},
)

batch = client.batches.create(
    input_file_id=input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
)

while batch.status not in ("completed", "failed", "cancelled", "expired"):
    time.sleep(5)
    batch = client.batches.retrieve(batch.id)

if batch.output_file_id:
    print(client.files.content(batch.output_file_id).text)
if batch.error_file_id:
    print(client.files.content(batch.error_file_id).text)
```

</TabItem>
</Tabs>

## 支援的作業 {#supported-operations}

| 操作 | 端點 | 方法 |
|-----------|----------|--------|
| 上傳檔案 | `/v1/files` | POST |
| 取回檔案 | `/v1/files/{file_id}` | GET |
| 刪除檔案 | `/v1/files/{file_id}` | DELETE |
| 取得檔案內容 | `/v1/files/{file_id}/content` | GET |
| 建立批次 | `/v1/batches` | POST |
| 列出批次 | `/v1/batches` | GET |
| 取回批次 | `/v1/batches/{batch_id}` | GET |
| 取消批次 | `/v1/batches/{batch_id}/cancel` | POST |

批次 `endpoint` 可為 `/v1/chat/completions`、`/v1/completions`、`/v1/embeddings` 或 `/v1/responses`

## 批次如何執行 {#how-a-batch-runs}

批次會先建立為 `validating`，在接收建立請求的 proxy 副本執行各行時變為 `in_progress`，之後在寫入結果檔案時變為 `finalizing`，最後以 `completed` 結束。伺服器拒絕的各行會連同伺服器的狀態碼一起寫入錯誤檔案，而批次仍會完成。取消會將批次標記為 `cancelling`，讓正在處理中的那一行完成，並以 `cancelled` 結束，同時保留已完成各行的輸出。24 小時 `completion_window` 也以相同方式強制執行：在其關閉時仍未完成的一行會被截斷，並以 `batch_expired` 寫入錯誤檔案，而批次會以 `expired` 結束，並保留準時完成各行的輸出

結果會以 OpenAI 的批次輸出格式回傳：`output_file_id` 保留每個成功請求一行，`error_file_id` 保留每個失敗請求一行。這兩者都只會提供給建立該批次的金鑰

每一行都會透過 router 以自己的請求計費，並在花費記錄上帶有建立用金鑰、團隊與標籤，價格以部署上設定的為準。沒有設定價格的部署，其各行花費會記錄為 0

如果執行批次的副本重新啟動，則在其最後一次進度寫入後超過三分鐘的下一次擷取時，該批次會被標記為 `failed`，並帶有 `runner_lost` 錯誤。請重新提交

## 設定 {#settings}

| 設定 | 預設值 | 說明 |
|---------|-----------|-------------|
| `LITELLM_EXECUTED_BATCH_CONCURRENCY` | `4` | 一個批次中有多少行會並行執行 |
| `general_settings.allow_client_side_credentials` | `false` | 批次各行遵循與即時請求相同的規則：若某一行的本文帶有 `api_base`、`api_key`，或其他用戶端憑證欄位，除非此項為 `true` 或該部署在 `configurable_clientside_auth_params` 中列出該欄位，否則上傳時會被拒絕 |

批次各行會略過 proxy 的請求前防護欄，與提供者執行的批次相同

## 相關內容 {#related}

- [vLLM 提供者總覽](./vllm)
- [批次 API 總覽](../batches)
- [檔案 API](../files_endpoints)
