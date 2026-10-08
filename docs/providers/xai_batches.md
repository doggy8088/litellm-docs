# xAI Batch API {#xai-batch-api}

LiteLLM 會將相容於 OpenAI 的 `/v1/files` 與 `/v1/batches` 端點路由到 xAI 的 [Files](https://docs.x.ai/developers/files/managing-files) 與 [Batch](https://docs.x.ai/developers/advanced-api-usage/batch-api) API。xAI 以較低費率計費批次請求，這些請求不計入速率限制，而且多數批次會在最佳努力基礎下於 24 小時內完成。並非每個 xAI 模型都接受批次請求，因此在選擇模型前請先查看 xAI 的模型清單

| 功能 | 支援 |
|---------|-----------|
| 上傳、擷取、列出、刪除檔案 | ✅ |
| 下載批次結果 | ✅ |
| 建立、擷取、列出、取消批次 | ✅ |
| 成本追蹤 | ✅ 每行，請參見 [成本追蹤](#cost-tracking) |
| Python SDK | ✅ `custom_llm_provider="xai"` |

## 1. 將 xAI 加入 config.yaml {#1-add-xai-to-configyaml}

`files_settings` 保存 `/v1/files` 與 `/v1/batches` 的憑證。`model_list` 項目是批次中各行執行所在的地方，也是費用計價的依據：

```yaml
model_list:
  - model_name: grok-4.3
    litellm_params:
      model: xai/grok-4.3
      api_key: os.environ/XAI_API_KEY

files_settings:
  - custom_llm_provider: xai
    api_key: os.environ/XAI_API_KEY
```

## 2. 上傳批次輸入檔 {#2-upload-the-batch-input-file}

每一行都是一個 OpenAI 批次請求。檔案會原樣送到 xAI，因此 `model` 內的 `body` 是 xAI 模型名稱，而 `url` 會為該行選定 xAI 端點，因此同一個檔案可以混合 chat completions、responses、image 和 video 請求：

```json
{"custom_id": "req-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "grok-4.3", "messages": [{"role": "user", "content": "What is the capital of France?"}], "max_tokens": 40}}
{"custom_id": "req-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "grok-4.3", "messages": [{"role": "user", "content": "How many legs does a spider have?"}], "max_tokens": 40}}
```

單純上傳不包含任何可供路由的資訊，因此請在請求上標明提供者：

```bash
curl "http://0.0.0.0:4000/v1/files?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -F purpose="batch" \
  -F file="@batch_input.jsonl"
```

xAI 不會儲存 purpose，因此每個 xAI 檔案讀回時都會是 `purpose: batch`

## 3. 建立批次 {#3-create-the-batch}

```bash
curl "http://0.0.0.0:4000/v1/batches?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "<file id from step 2>",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```

xAI 會依據每一行自己的 `url` 進行路由，因此 `endpoint` 會被回傳而不是送出，而 `completion_window` 一律讀取為 `24h`

## 4. 輪詢批次並下載結果 {#4-poll-the-batch-and-download-the-results}

```bash
curl "http://0.0.0.0:4000/v1/batches/<batch id>?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

xAI 回報的是請求計數器而不是狀態，因此 LiteLLM 會據此推導：`validating` 表示 xAI 尚未計算任何請求，`in_progress` 表示仍有部分請求待處理，`completed` 表示已無待處理請求，`cancelled` 表示您已取消，`failed` 表示 xAI 已取消（驗證失敗的輸入檔會落在這裡，xAI 的訊息在 `errors` 下方）。`created_at`、`expires_at` 和 `cancelled_at` 會以日為解析度回傳，因為 xAI 儲存這些日期時沒有時間資訊

xAI 沒有輸出檔：結果是直接從批次本身讀取，因此 `output_file_id` 就是批次 id。透過檔案內容路由下載：

```bash
curl "http://0.0.0.0:4000/v1/files/<batch id>/content?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

回應是 OpenAI batch output JSONL，每個請求一行，結果在 `response.body` 下，失敗則在 `error` 下。xAI 以每頁 1000 筆提供結果，LiteLLM 會逐頁讀取並在回應前串接，因此大型批次在下載時會佔用記憶體。圖片和影片結果帶有媒體 URL，而 xAI 會在一小時後使其失效，因此請立即擷取

## 列出、取消與刪除 {#listing-cancelling-and-deleting}

```bash
curl "http://0.0.0.0:4000/v1/files?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl "http://0.0.0.0:4000/v1/batches" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -X POST "http://0.0.0.0:4000/v1/batches/<batch id>/cancel?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY"

curl -X DELETE "http://0.0.0.0:4000/v1/files/<file id>?provider=xai" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

檔案清單會遍歷 xAI 回傳的每一頁，而批次清單則從 `files_settings` 取得提供者。已刪除或已過期的檔案讀回時會是 404

## Python SDK {#python-sdk}

環境中的 `XAI_API_KEY` 即可：

```python
import litellm

with open("batch_input.jsonl", "rb") as fh:
    uploaded = litellm.create_file(file=fh, purpose="batch", custom_llm_provider="xai")

batch = litellm.create_batch(
    input_file_id=uploaded.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    custom_llm_provider="xai",
)

batch = litellm.retrieve_batch(batch_id=batch.id, custom_llm_provider="xai")
if batch.status == "completed":
    results = litellm.file_content(file_id=batch.output_file_id, custom_llm_provider="xai")
    print(results.text)
```

`litellm.list_batches(custom_llm_provider="xai")` 與 `litellm.cancel_batch(batch_id=..., custom_llm_provider="xai")` 會涵蓋其餘部分

## 成本追蹤 {#cost-tracking}

當擷取已完成的 xAI 批次時，LiteLLM 會讀取每一筆結果行上的用量，將 xAI 的推理 tokens 依照其處理同步 xAI 呼叫的方式併入 completion tokens，並依據 [model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 中模型的批次費率逐行計費：`input_cost_per_token_batches`、`output_cost_per_token_batches` 與 `cache_read_input_token_cost_batches`，以及那些價格在超過 200k context tokens 後會提高的模型之 `_above_200k_tokens` 變體。xAI 也會在每一行回報 `cost_in_usd_ticks`（每美元一百億 ticks），可作為 LiteLLM 記錄支出時的方便交叉核對

支出會在第一次擷取已完成批次時記錄，記錄在建立該批次的金鑰上，位於帶有 `_batch_cost` 後綴的批次 id 之下，並會顯示在 `/spend/logs` 路由與 Admin UI Logs 頁面上
