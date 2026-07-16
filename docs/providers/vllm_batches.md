import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# vLLM - 批次 + 檔案 API {#vllm---batch--files-api}

LiteLLM 支援 vLLM 的批次與檔案 API，可非同步處理大量請求。

| 功能 | 支援 |
|---------|-----------|
| `/v1/files` | ✅ |
| `/v1/batches` | ✅ |
| 成本追蹤 | ✅ |

## 快速開始 {#quick-start}

### 1. 設定 config.yaml {#1-setup-configyaml}

在 `config.yaml` 中定義您的 vLLM 模型。LiteLLM 會使用模型名稱將批次請求路由到正確的 vLLM 伺服器。

```yaml
model_list:
  - model_name: my-vllm-model
    litellm_params:
      model: hosted_vllm/meta-llama/Llama-2-7b-chat-hf
      api_base: http://localhost:8000  # your vLLM server
```

### 2. 啟動 LiteLLM Proxy {#2-start-litellm-proxy}

```bash
litellm --config /path/to/config.yaml
```

### 3. 建立批次檔 {#3-create-batch-file}

建立一個包含批次請求的 JSONL 檔案：

```jsonl
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "my-vllm-model", "messages": [{"role": "user", "content": "Hello!"}]}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "my-vllm-model", "messages": [{"role": "user", "content": "How are you?"}]}}
```

### 4. 上傳檔案並建立批次 {#4-upload-file--create-batch}

:::tip 模型路由
LiteLLM 需要知道要使用哪個模型（也就是哪一台 vLLM 伺服器）來執行批次作業。上傳檔案時，請使用 `x-litellm-model` 標頭指定模型。LiteLLM 會將此模型資訊編碼到檔案 ID 中，因此後續的批次作業會自動路由到正確的伺服器。

請參閱 [多帳戶 / 基於模型的路由](../batches#multi-account--model-based-routing) 以了解更多詳細資訊。
:::

<Tabs>
<TabItem value="curl" label="cURL">

**上傳檔案**

```bash
curl http://localhost:4000/v1/files \
  -H "Authorization: Bearer sk-1234" \
  -H "x-litellm-model: my-vllm-model" \
  -F purpose="batch" \
  -F file="@batch_requests.jsonl"
```

**建立批次**

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

**檢查批次狀態**

```bash
curl http://localhost:4000/v1/batches/batch_abc123 \
  -H "Authorization: Bearer sk-1234"
```

</TabItem>
<TabItem value="python" label="Python SDK">

```python
import litellm
import asyncio

async def run_vllm_batch():
    # Upload file
    file_obj = await litellm.acreate_file(
        file=open("batch_requests.jsonl", "rb"),
        purpose="batch",
        custom_llm_provider="hosted_vllm",
    )
    print(f"File uploaded: {file_obj.id}")

    # Create batch
    batch = await litellm.acreate_batch(
        completion_window="24h",
        endpoint="/v1/chat/completions",
        input_file_id=file_obj.id,
        custom_llm_provider="hosted_vllm",
    )
    print(f"Batch created: {batch.id}")

    # Poll for completion
    while True:
        batch_status = await litellm.aretrieve_batch(
            batch_id=batch.id,
            custom_llm_provider="hosted_vllm",
        )
        print(f"Status: {batch_status.status}")
        
        if batch_status.status == "completed":
            break
        elif batch_status.status in ["failed", "cancelled"]:
            raise Exception(f"Batch failed: {batch_status.status}")
        
        await asyncio.sleep(5)

    # Get results
    if batch_status.output_file_id:
        results = await litellm.afile_content(
            file_id=batch_status.output_file_id,
            custom_llm_provider="hosted_vllm",
        )
        print(f"Results: {results}")

asyncio.run(run_vllm_batch())
```

</TabItem>
</Tabs>

## 支援的作業 {#supported-operations}

| 作業 | 端點 | 方法 |
|-----------|----------|--------|
| 上傳檔案 | `/v1/files` | POST |
| 列出檔案 | `/v1/files` | GET |
| 擷取檔案 | `/v1/files/{file_id}` | GET |
| 刪除檔案 | `/v1/files/{file_id}` | DELETE |
| 取得檔案內容 | `/v1/files/{file_id}/content` | GET |
| 建立批次 | `/v1/batches` | POST |
| 列出批次 | `/v1/batches` | GET |
| 擷取批次 | `/v1/batches/{batch_id}` | GET |
| 取消批次 | `/v1/batches/{batch_id}/cancel` | POST |

## 環境變數 {#environment-variables}

```bash
# Set vLLM server endpoint
export HOSTED_VLLM_API_BASE="http://localhost:8000"

# Optional: API key if your vLLM server requires authentication
export HOSTED_VLLM_API_KEY="your-api-key"
```

## 模型路由如何運作 {#how-model-routing-works}

當您使用 `x-litellm-model: my-vllm-model` 上傳檔案時，LiteLLM 會：

1. 將模型名稱編碼到回傳的檔案 ID 中
2. 使用此編碼後的模型資訊，自動將後續批次作業路由到正確的 vLLM 伺服器
3. 在建立批次或擷取結果時，不需要再次指定模型

這可實現多租戶批次處理，讓不同團隊透過相同的 LiteLLM Proxy 使用不同的 vLLM 部署。

**深入了解：** [多帳戶 / 基於模型的路由](../batches#multi-account--model-based-routing)

## 相關內容 {#related}

- [vLLM 提供者總覽](./vllm)
- [批次 API 總覽](../batches)
- [檔案 API](../files_endpoints)
