# [BETA] 使用 LiteLLM Managed Files 搭配 Batches {#beta-litellm-managed-files-with-batches}

:::info

這是一項免費的 LiteLLM Enterprise 功能。

可透過 `litellm[proxy]` 套件或任何 `litellm` docker 映像檔取得。

:::

| 功能 | 說明 | 備註 |
| --- | --- | --- |
| Proxy | ✅ |  |
| SDK | ❌ | 需要 postgres DB 來儲存 file ids |
| 可跨所有 [Batch 提供者](../batches#supported-providers) 使用 | ✅ |  |

## 概觀 {#overview}

可用於：

- 在多個 Azure Batch deployment 之間進行負載平衡
- 依 key/user/team 控制 batch model 存取權（與 chat completion models 相同）

## （Proxy 管理員）使用方式 {#proxy-admin-usage}

以下說明如何讓開發者存取您的 Batch models。

### 1. 設定 config.yaml {#1-setup-configyaml}

- 為每個 model 指定 `mode: batch`：讓開發者知道這是一個 batch model。
- 可選擇針對特定 batch providers/models 跳過 batch input files 的預先讀取（對自訂 vLLM batch deployments 上的大型檔案很有用）。

```yaml showLineNumbers title="litellm_config.yaml"
model_list:
  - model_name: "gpt-4o-batch"
    litellm_params:
      model: azure/gpt-4o-mini-general-deployment
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
    model_info: 
      mode: batch # 👈 SPECIFY MODE AS BATCH, to tell user this is a batch model
  - model_name: "gpt-4o-batch"
    litellm_params:
      model: azure/gpt-4o-mini-special-deployment
      api_base: os.environ/AZURE_API_BASE_2
      api_key: os.environ/AZURE_API_KEY_2
    model_info: 
      mode: batch # 👈 SPECIFY MODE AS BATCH, to tell user this is a batch model

general_settings:
  # Optional: disable batch input-file pre-read globally
  # disable_batch_input_file_rate_limiting: true

  # Optional: skip only for selected providers (example: custom vLLM)
  skip_batch_input_file_rate_limiting_for_providers:
    - hosted_vllm

  # Optional: skip only for selected model names / prefixes
  # skip_batch_input_file_rate_limiting_for_models:
  #   - my-vllm-batch-model

litellm_settings:
  # Optional: require target_model_names on POST /v1/files (blocks classic file uploads)
  # require_managed_files: true

```

### 2. 建立 Virtual Key {#2-create-virtual-key}

```bash showLineNumbers title="create_virtual_key.sh"
curl -L -X POST 'https://{PROXY_BASE_URL}/key/generate' \
-H 'Authorization: Bearer ${PROXY_API_KEY}' \
-H 'Content-Type: application/json' \
-d '{"models": ["gpt-4o-batch"]}'
```


現在您可以使用 virtual key 存取 batch models（請參閱開發者流程）。

## （開發者）使用方式 {#developer-usage}

以下說明如何建立 LiteLLM managed file，並使用該檔案執行 Batch CRUD 操作。 

### 1. 建立 request.jsonl  {#1-create-requestjsonl}

- 透過 `/model_group/info` 查看可用模型
- 使用 `mode: batch` 查看所有模型
- 在 .jsonl 中將 `model` 設定為來自 `/model_group/info` 的 model

```json showLineNumbers title="request.jsonl"
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-batch", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4o-batch", "messages": [{"role": "system", "content": "You are an unhelpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
```

預期結果：

- LiteLLM 會將其轉換為 azure deployment 的特定值（例如 `gpt-4o-mini-general-deployment`）

### 2. 上傳檔案  {#2-upload-file}

指定 `target_model_names: "<model-name>"` 以啟用 LiteLLM managed files 與請求驗證。

model-name 應與 request.jsonl 中的 model-name 相同

```python showLineNumbers title="create_batch.py"
from openai import OpenAI

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

# Upload file
batch_input_file = client.files.create(
    file=open("./request.jsonl", "rb"), # {"model": "gpt-4o-batch"} <-> {"model": "gpt-4o-mini-special-deployment"}
    purpose="batch",
    extra_body={"target_model_names": "gpt-4o-batch"}
)
print(batch_input_file)
```


**檔案會寫入哪裡？**：

會寫入所有 gpt-4o-batch deployments（gpt-4o-mini-general-deployment、gpt-4o-mini-special-deployment）。這可在步驟 3 中對所有 gpt-4o-batch deployments 啟用負載平衡。

### 3. 建立 + 取得 batch {#3-create--retrieve-the-batch}

```python showLineNumbers title="create_batch.py"
...
# Create batch
batch = client.batches.create( 
    input_file_id=batch_input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"description": "Test batch job"},
)
print(batch)

# Retrieve batch

batch_response = client.batches.retrieve(
    batch_id
)
status = batch_response.status
```

您也可以針對每個請求跳過 input-file 預先讀取：

```python showLineNumbers title="create_batch.py"
batch = client.batches.create(
    input_file_id=batch_input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"skip_batch_input_file_rate_limiting": True},
)
```

### 4. 取得 Batch 內容  {#4-retrieve-batch-content}

```python showLineNumbers title="create_batch.py"
...

file_id = batch_response.output_file_id

file_response = client.files.content(file_id)
print(file_response.text)
```

### 5. 列出 batches {#5-list-batches}

```python showLineNumbers title="create_batch.py"
...

client.batches.list(limit=10, extra_query={"target_model_names": "gpt-4o-batch"})
```

### [即將推出] 取消 batch {#coming-soon-cancel-a-batch}

```python showLineNumbers title="create_batch.py"
...

client.batches.cancel(batch_id)
```


## E2E 範例 {#e2e-example}

```python showLineNumbers title="create_batch.py"
import json
from pathlib import Path
from openai import OpenAI

"""
litellm yaml: 

model_list:
    - model_name: gpt-4o-batch
      litellm_params:
        model: azure/gpt-4o-my-special-deployment
        api_key: ..
        api_base: .. 

---
request.jsonl: 
{
    {
        ...,
        "body":{"model": "gpt-4o-batch", ...}}
    }
}
"""

client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",
)

# Upload file
batch_input_file = client.files.create(
    file=open("./request.jsonl", "rb"),
    purpose="batch",
    extra_body={"target_model_names": "gpt-4o-batch"}
)
print(batch_input_file) 


# Create batch
batch = client.batches.create( # UPDATE BATCH ID TO FILE ID 
    input_file_id=batch_input_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h",
    metadata={"description": "Test batch job"},
)
print(batch)
batch_id = batch.id

# Retrieve batch

batch_response = client.batches.retrieve( # LOG VIRTUAL MODEL NAME
    batch_id
)
status = batch_response.status

print(f"status: {status}, output_file_id: {batch_response.output_file_id}")

# Download file
output_file_id = batch_response.output_file_id
print(f"output_file_id: {output_file_id}")
if not output_file_id:
    output_file_id = batch_response.error_file_id

if output_file_id:
    file_response = client.files.content(
        output_file_id
    )
    raw_responses = file_response.text.strip().split("\n")

    with open(
        Path.cwd().parent / "unified_batch_output.json", "w"
    ) as output_file:
        for raw_response in raw_responses:
            json.dump(json.loads(raw_response), output_file)
            output_file.write("\n")
## List Batch

list_batch_response = client.batches.list( # LOG VIRTUAL MODEL NAME
    extra_query={"target_model_names": "gpt-4o-batch"}
)

## Cancel Batch

batch_response = client.batches.cancel( # LOG VIRTUAL MODEL NAME
    batch_id
)
status = batch_response.status

print(f"status: {status}")
```

## 常見問題 {#faq}

### 我的檔案會寫到哪裡？ {#where-are-my-files-written}

當指定 `target_model_names` 時，檔案會寫入所有符合 `target_model_names` 的 deployments。

不需要額外的基礎架構。

## batch 可以先建立於 eastus-01 deployment，但之後對 batch 的 get 會被路由到（不同的）eastus2-01 deployment 嗎？ {#could-the-batch-be-created-at-the-eastus-01-deployment-but-a-subsequent-get-of-the-batch-could-be-routed-to-a-different-eastus2-01-deployment-}

**A.** 您可以在初始建立 batch 時，於多個 models 之間進行負載平衡。建立完成後，我們會回傳一個 file id，其中編碼了所使用的 model deployment，因此它具有黏性，且只會將任何 get/delete 請求送到該 deployment。
