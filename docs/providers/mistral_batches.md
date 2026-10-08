# Mistral AI 批次 API {#mistral-ai-batch-api}

LiteLLM 會將與 OpenAI 相容的 `/v1/files` 和 `/v1/batches` 端點路由至 Mistral 的 [Files](https://docs.mistral.ai/api/#tag/files) 與 [Batch](https://docs.mistral.ai/api/#tag/batch) API。Mistral 批次工作會針對輸入檔案的每一行執行一次模型，因此模型只會在檔案上傳或批次請求時選取一次，而不是逐行選取。此工作可目標指向 `/v1/chat/completions` 或 `/v1/ocr`，而批次中的 OCR 頁面則依 Mistral 的批次費率計費。

| 功能 | 支援 |
|---------|-----------|
| 上傳、擷取、列出、刪除檔案 | ✅ |
| 下載檔案內容 | ✅ |
| 建立與擷取批次 | ✅ |
| 列出與取消批次 | 尚未支援 |
| 批次 OCR 成本追蹤 | ✅ 每頁，請參閱 [批次 OCR 成本追蹤](#batch-ocr-cost-tracking) |

## 1. 將 Mistral 模型新增至 config.yaml {#1-add-a-mistral-model-to-configyaml}

```yaml
model_list:
  - model_name: mistral-ocr
    litellm_params:
      model: mistral/mistral-ocr-latest
      api_key: os.environ/MISTRAL_API_KEY
```

## 2. 上傳批次輸入檔案 {#2-upload-the-batch-input-file}

每一行都是一個 OpenAI 批次請求。對於 OCR，`url` 是 `/v1/ocr`，而 `body` 是一個 Mistral OCR 請求：

```json
{"custom_id": "doc-0", "method": "POST", "url": "/v1/ocr", "body": {"document": {"type": "document_url", "document_url": "https://arxiv.org/pdf/2201.04234"}}}
{"custom_id": "doc-1", "method": "POST", "url": "/v1/ocr", "body": {"document": {"type": "document_url", "document_url": "https://arxiv.org/pdf/2201.04234"}}}
```

上傳時傳入 `model`，如此 LiteLLM 便會使用該部署的憑證傳送檔案，並將模型編碼進回傳的檔案 ID。之後任何帶有此 ID 的呼叫都會重用它。

```bash
curl http://0.0.0.0:4000/v1/files \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -F purpose="batch" \
  -F model="mistral-ocr" \
  -F file="@ocr_batch_input.jsonl"
```

Mistral 接受 `batch`、`fine-tune` 和 `ocr` 用途。LiteLLM 會將 `user_data` 對應到 `ocr`，而任何其他用途（`assistants`、`vision`、`evals`）都會因為 Mistral 沒有對應項目而以 400 拒絕。

## 3. 建立批次 {#3-create-the-batch}

`endpoint` 對 OCR 工作是 `/v1/ocr`，對聊天工作則是 `/v1/chat/completions`。`model` 會從已編碼的檔案 ID 讀取，因此再次傳送是可選的。

```bash
curl http://0.0.0.0:4000/v1/batches \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-bGl0ZWxsbTo1YTJm...",
    "endpoint": "/v1/ocr",
    "completion_window": "24h",
    "model": "mistral-ocr"
  }'
```

Mistral 沒有 `completion_window`；此值會被接受並回傳為 `24h`。

## 4. 查詢批次狀態並下載輸出 {#4-poll-the-batch-and-download-the-output}

```bash
curl http://0.0.0.0:4000/v1/batches/batch_bGl0ZWxsbTo1YzU4... \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

Mistral 的工作狀態對應到 OpenAI 的狀態：`QUEUED` -> `validating`、`RUNNING` -> `in_progress`、`SUCCESS` -> `completed`、`FAILED` -> `failed`、`TIMEOUT_EXCEEDED` -> `expired`、`CANCELLATION_REQUESTED` -> `cancelling`、`CANCELLED` -> `cancelled`。狀態變為 `completed` 後，下載 `output_file_id`：

```bash
curl http://0.0.0.0:4000/v1/files/file-bGl0ZWxsbToyNjE0.../content \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

每一個輸出行都會在 `response.body` 下攜帶 OCR 回應，包括 `usage_info.pages_processed`。

## 列出檔案 {#listing-files}

LiteLLM 已編碼的檔案 ID 會攜帶其自身的路由資訊，但單純的列表沒有可供路由的 ID，因此請在請求中指定提供者名稱：

```bash
curl "http://0.0.0.0:4000/v1/files?provider=mistral&purpose=batch" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

OCR 檔案會以 `purpose=user_data` 讀回，而由其他 Mistral 產品建立、其用途不被上傳端點接受的檔案（`playground`、`audio` 及其他類似項目）也會以 `user_data` 讀回，因此未過濾的列表不會因此失敗。

## 批次 OCR 成本追蹤 {#batch-ocr-cost-tracking}

當目標指向 `/v1/ocr` 的批次完成時，LiteLLM 會從輸出檔案的每一行讀取 `usage_info.pages_processed` 和 `usage_info.pages_processed_annotation`，並以模型的批次費率對每一頁計費。費率來自 [模型成本對照表](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)：

| 鍵 | 用途 |
|-----|----------|
| `ocr_cost_per_page_batches` | 批次中的 OCR 頁面 |
| `annotation_cost_per_page_batches` | 批次中的註解頁面 |
| `ocr_cost_per_page` | 同步 `/v1/ocr` 呼叫，以及未設定批次費率時的備援 |
| `annotation_cost_per_page` | 同步註解頁面，以及未設定批次費率時的備援 |

`mistral/mistral-ocr-latest` 的批次費率是同步每頁費率的一半，與 Mistral 50% 的批次折扣相符。若要以不同費率計費，請在部署的 `model_info` 上設定這些鍵，這會覆蓋該部署的成本對照表：

```yaml
model_list:
  - model_name: mistral-ocr
    litellm_params:
      model: mistral/mistral-ocr-latest
      api_key: os.environ/MISTRAL_API_KEY
    model_info:
      ocr_cost_per_page_batches: 0.002
      annotation_cost_per_page_batches: 0.0025
```

支出會在第一次擷取完成的批次時記錄在建立它的金鑰上，位於帶有 `_batch_cost` 後綴的批次 ID 底下，並會顯示在 `/spend/logs` 路由與 Admin UI Logs 頁面上。
