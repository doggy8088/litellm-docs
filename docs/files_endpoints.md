import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';

# 提供者檔案端點 {#provider-files-endpoints}

檔案用於上傳文件，可搭配 Assistants、Fine-tuning 和 Batch API 等功能使用。

可用於直接呼叫提供者的 `/files` 端點，採用 OpenAI 格式。 

## 快速開始 {#quick-start}

- 上傳檔案
- 列出檔案
- 取得檔案資訊
- 刪除檔案
- 取得檔案內容

## 多帳戶支援（多個 OpenAI 金鑰） {#multi-account-support-multiple-openai-keys}

可透過指定一個參照您 `model_list` 中項目的 `model` 參數，為檔案與批次使用不同的 OpenAI API 金鑰。這種做法**不需要資料庫**，並可讓您將檔案/批次路由到不同的 OpenAI 帳戶。

### 運作方式 {#how-it-works}

1. 在 `model_list` 中使用不同的 API 金鑰定義模型
2. 建立檔案時傳入 `model` 參數
3. LiteLLM 回傳包含路由資訊的編碼 ID
4. 後續所有操作（取得、刪除、批次）都使用編碼 ID
5. 不需要再次指定模型 - 路由資訊已在 ID 中

### 設定 {#setup}

```yaml
model_list:
  # litellm OpenAI Account
  - model_name: "gpt-4o-litellm"
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_LITELLM_API_KEY
  
  # Free OpenAI Account
  - model_name: "gpt-4o-free"
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_FREE_API_KEY
```

### 使用範例 {#usage-example}

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",  # Your LiteLLM proxy key
    base_url="http://0.0.0.0:4000"
)

# Create file using litellm account
file_response = client.files.create(
    file=open("batch_data.jsonl", "rb"),
    purpose="batch",
    extra_body={"model": "gpt-4o-litellm"}  # Routes to litellm key
)
print(f"File ID: {file_response.id}")
# Returns encoded ID like: file-bGl0ZWxsbTpmaWxlLWFiYzEyMzttb2RlbCxncHQtNG8taWZvb2Q

# Create batch using the encoded file ID
# No need to specify model again - it's embedded in the file ID
batch_response = client.batches.create(
    input_file_id=file_response.id,  # Encoded ID
    endpoint="/v1/chat/completions",
    completion_window="24h"
)
print(f"Batch ID: {batch_response.id}")
# Returns encoded batch ID with routing info

# Retrieve batch - routing happens automatically
batch_status = client.batches.retrieve(batch_response.id)
print(f"Status: {batch_status.status}")

# List files for a specific account
files = client.files.list(
    extra_body={"model": "gpt-4o-free"}  # List free files
)

# List batches for a specific account
batches = client.batches.list(
    extra_query={"model": "gpt-4o-litellm"}  # List litellm batches
)
```

### 參數選項 {#parameter-options}

您可以透過以下方式傳入 `model` 參數：
- **請求本文**：`extra_body={"model": "gpt-4o-litellm"}`
- **查詢參數**：`?model=gpt-4o-litellm`
- **標頭**：`x-litellm-model: gpt-4o-litellm`

### 編碼 ID 的運作方式 {#how-encoded-ids-work}

- 當您使用 `model` 參數建立檔案/批次時，LiteLLM 會將模型名稱編碼進回傳的 ID 中
- 編碼後的 ID 會以 base64 編碼，看起來像：`file-bGl0ZWxsbTpmaWxlLWFiYzEyMzttb2RlbCxncHQtNG8taWZvb2Q`
- 當您在後續操作（取得、刪除、建立批次）中使用此 ID 時，LiteLLM 會自動：
  1. 解碼 ID
  2. 擷取模型名稱
  3. 查找認證資訊
  4. 將請求路由到正確的 OpenAI 帳戶
- 原始的提供者檔案/批次 ID 會在內部保留

### 優點 {#benefits}

✅ **不需要資料庫** - 所有路由資訊都儲存在 ID 中  
✅ **無狀態** - 可跨 proxy 重新啟動運作  
✅ **簡單** - 只要像平常一樣傳遞 ID 即可  
✅ **向後相容** - 現有的 `custom_llm_provider` 和 `files_settings` 仍可運作  
✅ **面向未來** - 與受管理的批次做法一致  

### 從 files_settings 移轉 {#migration-from-files_settings}

**舊做法（仍可運作）：**
```yaml
files_settings:
  - custom_llm_provider: openai
    api_key: os.environ/OPENAI_KEY
```

```python
# Had to specify provider on every call
client.files.create(..., extra_headers={"custom-llm-provider": "openai"})
client.files.retrieve(file_id, extra_headers={"custom-llm-provider": "openai"})
```

**新做法（建議）：**
```yaml
model_list:
  - model_name: "gpt-4o-account1"
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_KEY
```

```python
# Specify model once on create
file = client.files.create(..., extra_body={"model": "gpt-4o-account1"})

# Then just use the ID - routing is automatic
client.files.retrieve(file.id)  # No need to specify account
client.batches.create(input_file_id=file.id)  # Routes correctly
```

<Tabs>
<TabItem value="proxy" label="LiteLLM PROXY Server">

1. 設定 config.yaml

```
# for /files endpoints
files_settings:
  - custom_llm_provider: azure
    api_base: https://exampleopenaiendpoint-production.up.railway.app
    api_key: fake-key
    api_version: "2023-03-15-preview"
  - custom_llm_provider: openai
    api_key: os.environ/OPENAI_API_KEY
```

2. 啟動 LiteLLM PROXY Server

```bash
litellm --config /path/to/config.yaml

## RUNNING on http://0.0.0.0:4000
```

3. 使用 OpenAI 的 /files 端點

上傳檔案

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="http://0.0.0.0:4000/v1"
)

client.files.create(
    file=wav_data,
    purpose="user_data",
    extra_headers={"custom-llm-provider": "openai"}
)
```

列出檔案

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="http://0.0.0.0:4000/v1"
)

files = client.files.list(extra_headers={"custom-llm-provider": "openai"})
print("files=", files)
```

取得檔案資訊

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="http://0.0.0.0:4000/v1"
)

file = client.files.retrieve(file_id="file-abc123", extra_headers={"custom-llm-provider": "openai"})
print("file=", file)
```

刪除檔案

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="http://0.0.0.0:4000/v1"
)

response = client.files.delete(file_id="file-abc123", extra_headers={"custom-llm-provider": "openai"})
print("delete response=", response)
```

取得檔案內容

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="http://0.0.0.0:4000/v1"
)

content = client.files.content(file_id="file-abc123", extra_headers={"custom-llm-provider": "openai"})
print("content=", content)
```

</TabItem>
<TabItem value="sdk" label="SDK">

**上傳檔案**
```python
from litellm
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

file_obj = await litellm.acreate_file(
    file=open("mydata.jsonl", "rb"),
    purpose="fine-tune",
    custom_llm_provider="openai",
)
print("Response from creating file=", file_obj)
```

**列出檔案**
```python
files = await litellm.alist_files(
    custom_llm_provider="openai",
    limit=10
)
print("files=", files)
```

**取得檔案資訊**
```python
file = await litellm.aretrieve_file(
    file_id="file-abc123",
    custom_llm_provider="openai"
)
print("file=", file)
```

**刪除檔案**
```python
response = await litellm.adelete_file(
    file_id="file-abc123",
    custom_llm_provider="openai"
)
print("delete response=", response)
```

**取得檔案內容**
```python
content = await litellm.afile_content(
    file_id="file-abc123",
    custom_llm_provider="openai"
)
print("file content=", content)
```

**取得檔案內容（Bedrock）**
```python
# For Bedrock batch output files stored in S3
content = await litellm.afile_content(
    file_id="s3://bucket-name/path/to/file.jsonl",  # S3 URI or unified file ID
    custom_llm_provider="bedrock",
    aws_region_name="us-west-2"
)
print("file content=", content.text)
```

</TabItem>
</Tabs>

## **支援的提供者**： {#supported-providers}

### [OpenAI](#quick-start) {#openaiquick-start}

### [Azure OpenAI](./providers/azure#azure-batches-api) {#azure-openaiprovidersazureazure-batches-api}

### [Vertex AI](./providers/vertex#batch-apis) {#vertex-aiprovidersvertexbatch-apis}

### [Bedrock](./providers/bedrock_batches#4-retrieve-batch-results) {#bedrockprovidersbedrock_batches4-retrieve-batch-results}

### [Anthropic](./providers/anthropic#files-api) {#anthropicprovidersanthropicfiles-api}

:::note
Anthropic Files API 的用途與 OpenAI 的不同。它**不是**用於 Batches 或 Fine-tuning——而是用來一次上傳檔案，並在多則訊息中透過 `file_id` 參照它們，以避免重複上傳。檔案 API 操作是免費的 — 在 Messages 請求中使用的檔案內容會以輸入 token 計費。
:::

## [Swagger API 參考](https://litellm-api.up.railway.app/#/files) {#swagger-api-referencehttpslitellm-apiuprailwayappfiles}
