import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# /vector_stores - 建立向量儲存庫 {#vector_stores---create-vector-store}

建立可用於儲存與搜尋文件區塊的向量儲存庫，以支援檢索增強生成（RAG）用例。

## 概覽 {#overview}

| 功能 | 支援 | 備註 |
|---------|-----------|-------|
| 成本追蹤 | ✅ | 依每個向量儲存庫操作追蹤 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ✅ | |
| 支援 LLM 提供者（OpenAI `/vector_stores` API） | **OpenAI** | 跨提供者完整支援向量儲存庫 API |
| 支援 LLM 提供者（Passthrough API） | [**Azure AI**](/docs/providers/azure_ai/azure_ai_vector_stores_passthrough) | 跨提供者完整支援向量儲存庫 API |
| 支援 LLM 提供者（資料集管理） | [**RAGFlow**](/docs/providers/ragflow_vector_store.md) | 支援資料集建立與管理（不支援搜尋） |

此 proxy 也支援向量儲存庫的 **retrieve**、**list**、**update** 與 **delete**（OpenAI 相容）。請參閱 [Proxy 上的向量儲存庫管理與路由](#vector-store-management-and-routing-on-the-proxy) 以取得 `curl` 範例與提供者路由。

## 使用方式 {#usage}

### LiteLLM Python SDK {#litellm-python-sdk}

<Tabs>
<TabItem value="basic" label="基本用法">

#### 非同步範例 {#async-example}
```python showLineNumbers title="Create Vector Store - Basic"
import litellm

response = await litellm.vector_stores.acreate(
    name="My Document Store",
    file_ids=["file-abc123", "file-def456"]
)
print(response)
```

#### 同步範例 {#sync-example}
```python showLineNumbers title="Create Vector Store - Sync"
import litellm

response = litellm.vector_stores.create(
    name="My Document Store", 
    file_ids=["file-abc123", "file-def456"]
)
print(response)
```

</TabItem>

<TabItem value="advanced" label="進階設定">

#### 搭配到期與分塊策略 {#with-expiration-and-chunking-strategy}
```python showLineNumbers title="Create Vector Store - Advanced"
import litellm

response = await litellm.vector_stores.acreate(
    name="My Document Store",
    file_ids=["file-abc123", "file-def456"],
    expires_after={
        "anchor": "last_active_at",
        "days": 7
    },
    chunking_strategy={
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 800,
            "chunk_overlap_tokens": 400
        }
    },
    metadata={
        "project": "rag-system",
        "environment": "production"
    }
)
print(response)
```

</TabItem>

<TabItem value="openai-provider" label="OpenAI 提供者">

#### 明確使用 OpenAI 提供者 {#using-openai-provider-explicitly}
```python showLineNumbers title="Create Vector Store - OpenAI Provider"
import litellm
import os

# Set API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

response = await litellm.vector_stores.acreate(
    name="My Document Store",
    file_ids=["file-abc123", "file-def456"],
    custom_llm_provider="openai"
)
print(response)
```

</TabItem>
</Tabs>

### LiteLLM Proxy 伺服器 {#litellm-proxy-server}

<Tabs>
<TabItem value="proxy-setup" label="設定與使用">

1. 設定 config.yaml

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  # Vector store settings can be added here if needed
```

2. 啟動 proxy 

```bash
litellm --config /path/to/config.yaml
```

3. 使用 OpenAI SDK 測試！

```python showLineNumbers title="OpenAI SDK via LiteLLM Proxy"
from openai import OpenAI

# Point OpenAI SDK to LiteLLM proxy
client = OpenAI(
    base_url="http://0.0.0.0:4000",
    api_key="sk-1234",  # Your LiteLLM API key
)

vector_store = client.beta.vector_stores.create(
    name="My Document Store",
    file_ids=["file-abc123", "file-def456"]
)
print(vector_store)
```

</TabItem>

<TabItem value="curl-proxy" label="curl（建立）">

```bash showLineNumbers title="Create Vector Store via curl"
curl -L -X POST 'http://0.0.0.0:4000/v1/vector_stores' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-1234' \
-d '{
  "name": "My Document Store",
  "file_ids": ["file-abc123", "file-def456"],
  "expires_after": {
    "anchor": "last_active_at", 
    "days": 7
  },
  "chunking_strategy": {
    "type": "static",
    "static": {
      "max_chunk_size_tokens": 800,
      "chunk_overlap_tokens": 400
    }
  },
  "metadata": {
    "project": "rag-system",
    "environment": "production"
  }
}'
```

</TabItem>

<TabItem value="curl-management" label="curl（retrieve、list、update、delete）">

建立時使用相同的 base URL 與 API 金鑰。將 `vs_abc123` 替換為您的向量儲存庫 ID。

**擷取**

```bash
curl -L 'http://0.0.0.0:4000/v1/vector_stores/vs_abc123' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer sk-1234'
```

**List**（可選查詢參數：`after`、`before`、`limit`、`order`）

```bash
curl -L 'http://0.0.0.0:4000/v1/vector_stores?limit=20&order=desc' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer sk-1234'
```

**Update**（使用 `POST` JSON 主體）

```bash
curl -L -X POST 'http://0.0.0.0:4000/v1/vector_stores/vs_abc123' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-1234' \
  -d '{ "name": "Renamed store", "metadata": { "env": "staging" } }'
```

**刪除**

```bash
curl -L -X DELETE 'http://0.0.0.0:4000/v1/vector_stores/vs_abc123' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer sk-1234'
```

請參閱 [Proxy 上的向量儲存庫管理與路由](#vector-store-management-and-routing-on-the-proxy) 以取得提供者路由詳細資訊與 OpenAI API 參考。

</TabItem>
</Tabs>

### OpenAI SDK（獨立） {#openai-sdk-standalone}

<Tabs>
<TabItem value="openai-direct" label="直接使用 OpenAI">

```python showLineNumbers title="OpenAI SDK Direct"
from openai import OpenAI

client = OpenAI(api_key="your-openai-api-key")

vector_store = client.beta.vector_stores.create(
    name="My Document Store",
    file_ids=["file-abc123", "file-def456"]
)
print(vector_store)
```

</TabItem>
</Tabs>

## Proxy 上的向量儲存庫管理與路由 {#vector-store-management-and-routing-on-the-proxy}

除了 **create**（`POST /v1/vector_stores` 或 `/vector_stores`）之外，LiteLLM proxy 也提供相容 OpenAI 的 **retrieve**、**list**、**update** 與 **delete**。路徑可**有或沒有** `/v1` 前綴（例如 `/v1/vector_stores/...` 與 `/vector_stores/...`）。

關於 **search**，請參閱 [Search vector store](./search.md)。關於儲存庫上的 **files**，請參閱 [Vector store files](../vector_store_files.md)。

### 驗證 {#authentication}

請使用您的 LiteLLM proxy virtual key，搭配以下任一方式：

```bash
-H 'Authorization: Bearer sk-1234'
# or
-H 'x-litellm-api-key: sk-1234'
```

### 提供者路由 {#provider-routing}

LiteLLM 會自動根據請求內容選擇向量儲存庫提供者——不需要額外的查詢參數：

- **LiteLLM 管理的儲存庫** — 如果 `vector_store_id` 是 LiteLLM 管理的儲存庫，proxy 會從登錄資料中解析提供者（`litellm_params` 儲存在資料庫中）。
- **以模型為基礎的路由** — 如果請求包含與已設定的 deployment/model 群組相符的 `model`，認證會來自該 deployment。
- **SDK 預設值** — 如果上述都不適用，則會使用該次呼叫的 LiteLLM SDK 預設值（例如 `openai`）。

### OpenAI API 參考（管理操作） {#openai-api-reference-management-operations}

- [Retrieve vector store](https://platform.openai.com/docs/api-reference/vector-stores/retrieve)
- [List vector stores](https://platform.openai.com/docs/api-reference/vector-stores/list)
- [Modify vector store](https://platform.openai.com/docs/api-reference/vector-stores/modify) — 在 LiteLLM proxy 上，modify 會以 **`POST`** 搭配 JSON 主體執行 **`/v1/vector_stores/{vector_store_id}`**。
- [Delete vector store](https://platform.openai.com/docs/api-reference/vector-stores/delete)

## 請求格式 {#request-format}

請求主體遵循 OpenAI 的向量儲存庫 API 格式。

#### 請求主體範例 {#example-request-body}

```json
{
  "name": "My Document Store",
  "file_ids": ["file-abc123", "file-def456"],
  "expires_after": {
    "anchor": "last_active_at",
    "days": 7
  },
  "chunking_strategy": {
    "type": "static",
    "static": {
      "max_chunk_size_tokens": 800,
      "chunk_overlap_tokens": 400
    }
  },
  "metadata": {
    "project": "rag-system",
    "environment": "production"
  }
}
```

#### 可選欄位 {#optional-fields}
- **name**（字串）：向量儲存庫的名稱。
- **file_ids**（字串陣列）：向量儲存庫應使用的 File ID 清單。對可存取檔案的工具（例如 `file_search`）很有用。
- **expires_after**（物件）：向量儲存庫的到期政策。
  - **anchor**（字串）：到期政策開始生效的錨點時間戳記。支援的錨點：`last_active_at`。
  - **days**（整數）：從錨點時間起算，向量儲存庫將到期的天數。
- **chunking_strategy**（物件）：用於將檔案分塊的分塊策略。若未設定，將使用 `auto` 策略。
  - **type**（字串）：一律為 `static`。
  - **static**（物件）：靜態分塊策略。
    - **max_chunk_size_tokens**（整數）：每個區塊中的最大 token 數。預設值為 `800`。最小值為 `100`，最大值為 `4096`。
    - **chunk_overlap_tokens**（整數）：區塊之間重疊的 token 數。預設值為 `400`。
- **metadata**（物件）：可附加到物件上的 16 組鍵值對集合。這對於以結構化格式儲存物件的額外資訊很有用。鍵的最大長度為 64 個字元，值的最大長度為 512 個字元。

## 回應格式 {#response-format}

#### 回應範例 {#example-response}

```json
{
  "id": "vs_abc123",
  "object": "vector_store",
  "created_at": 1699061776,
  "name": "My Document Store",
  "bytes": 139920,
  "file_counts": {
    "in_progress": 0,
    "completed": 2,
    "failed": 0,
    "cancelled": 0,
    "total": 2
  },
  "status": "completed",
  "expires_after": {
    "anchor": "last_active_at",
    "days": 7
  },
  "expires_at": null,
  "last_active_at": 1699061776,
  "metadata": {
    "project": "rag-system",
    "environment": "production"
  }
}
```

#### 回應欄位 {#response-fields}

- **id**（字串）：可在 API 端點中參照的識別碼。
- **object**（字串）：物件類型，一律為 `vector_store`。
- **created_at**（整數）：建立向量儲存庫時的 Unix 時間戳記（以秒為單位）。
- **name**（字串）：向量儲存庫的名稱。
- **bytes**（整數）：向量儲存庫中檔案使用的總位元組數。
- **file_counts**（物件）：向量儲存庫的檔案數量。
  - **in_progress**（整數）：目前正在處理中的檔案數量。
  - **completed**（整數）：已成功處理的檔案數量。
  - **failed**（整數）：處理失敗的檔案數量。
  - **cancelled**（整數）：已取消的檔案數量。
  - **total**（整數）：檔案總數。
- **status**（字串）：向量儲存庫的狀態，可為 `expired`、`in_progress` 或 `completed`。`completed` 狀態表示向量儲存庫已可使用。
- **expires_after**（物件或 null）：向量儲存庫的到期政策。
- **expires_at**（整數或 null）：向量儲存庫到期時的 Unix 時間戳記（以秒為單位）。
- **last_active_at**（整數或 null）：向量儲存庫最後啟用時的 Unix 時間戳記（以秒為單位）。
- **metadata**（物件或 null）：可附加到物件上的 16 組鍵值對集合。

## 模擬回應測試 {#mock-response-testing}

為了測試，您可以使用模擬回應：

```python showLineNumbers title="Mock Response Example"
import litellm

# Mock response for testing
mock_response = {
    "id": "vs_mock123",
    "object": "vector_store", 
    "created_at": 1699061776,
    "name": "Mock Vector Store",
    "bytes": 0,
    "file_counts": {
        "in_progress": 0,
        "completed": 0,
        "failed": 0,
        "cancelled": 0,
        "total": 0
    },
    "status": "completed"
}

response = await litellm.vector_stores.acreate(
    name="Test Store",
    mock_response=mock_response
)
print(response)
```
