# /vector_stores/\{vector_store_id\}/files {#vector_storesvector_store_idfiles}

向量儲存檔案代表位於向量儲存內的個別檔案。

| 功能 | 支援 |
|---------|-----------|
| 記錄 | ✅（完整請求/回應記錄） |
| 支援的提供者 | `openai` |

## 支援的操作 {#supported-operations}

| 操作 | 說明 | OpenAI Python Client | LiteLLM Proxy |
|-----------|-------------|----------------------|---------------|
| 建立向量儲存檔案 | 將檔案附加到向量儲存，可選擇覆寫分塊設定 | ✅ | ✅ |
| 列出向量儲存檔案 | 可分頁列出並可篩選 | ✅ | ✅ |
| 取得向量儲存檔案 | 擷取單一檔案的中繼資料 | ✅ | ✅ |
| 刪除向量儲存檔案 | 從儲存中移除檔案（檔案物件仍會保留） | ✅ | ✅ |
| 取得向量儲存檔案內容 | 串流處理後的分塊 | ❌ | ✅ |
| 更新向量儲存檔案屬性 | 修改自訂屬性 | ❌ | ✅ |

:::note
向量儲存支援目前**僅適用於 OpenAI 向量儲存與 OpenAI 上傳的檔案 ID**。
:::

## 建立向量儲存檔案 {#create-vector-store-file}

<code>POST http://localhost:4000/v1/vector_stores/&#123;vector_store_id&#125;/files</code>

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000",  # LiteLLM proxy or OpenAI base
    api_key="sk-1234"
)

vector_store_file = client.vector_stores.files.create(
    vector_store_id="vs_69172088a18c8191ab3e2621aa87d1ee",
    file_id="file-NDbEDJTfqVh7S4Ugi3CGYw",
    chunking_strategy={
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 800,
            "chunk_overlap_tokens": 400,
        },
    },
)

print(vector_store_file)
```

## 列出向量儲存檔案 {#list-vector-store-files}

<code>GET http://localhost:4000/v1/vector_stores/&#123;vector_store_id&#125;/files</code>

參數：

- `vector_store_id`（path，必填）
- `after` / `before`（query，選填）– 分頁游標
- `filter`（query，選填）– `in_progress`、`completed`、`failed`、`cancelled`
- `limit`（query，選填，預設 `20`，範圍 `1-100`）
- `order`（query，選填，預設 `desc`）

```python
vector_store_files = client.vector_stores.files.list(
    vector_store_id="vs_abc123"
)
print(vector_store_files)
```

## 取得向量儲存檔案 {#retrieve-vector-store-file}

<code>GET http://localhost:4000/v1/vector_stores/&#123;vector_store_id&#125;/files/&#123;file_id&#125;</code>

```python
vector_store_file = client.vector_stores.files.retrieve(
    vector_store_id="vs_abc123",
    file_id="file-abc123"
)
print(vector_store_file)
```

## 刪除向量儲存檔案 {#delete-vector-store-file}

<code>DELETE http://localhost:4000/v1/vector_stores/&#123;vector_store_id&#125;/files/&#123;file_id&#125;</code>

```python
deleted_vector_store_file = client.vector_stores.files.delete(
    vector_store_id="vs_abc123",
    file_id="file-abc123"
)
print(deleted_vector_store_file)
```

## 僅限 Proxy 的端點 {#proxy-only-endpoints}

當您需要原始內容分塊或屬性更新時，請直接呼叫 LiteLLM Proxy。

### 取得檔案內容 {#retrieve-file-content}

```bash
curl -X GET "http://localhost:4000/v1/vector_stores/\{vector_store_id\}/files/\{file_id\}/content" \
  -H "Authorization: Bearer sk-1234"
```

### 更新檔案屬性 {#update-file-attributes}

```bash
curl -X POST "http://localhost:4000/v1/vector_stores/\{vector_store_id\}/files/\{file_id\}" \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
        "attributes": {
          "category": "support-faq",
          "language": "en"
        }
      }'
```
