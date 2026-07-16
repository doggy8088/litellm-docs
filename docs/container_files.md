---
id: container_files
title: /containers/files
---

# 容器檔案 API {#container-files-api}

管理 Code Interpreter 容器中的檔案。當 code interpreter 產生輸出（圖表、CSV、圖片等）時，檔案會自動建立。

:::tip
想了解如何使用 Code Interpreter 嗎？請參閱 [Code Interpreter 指南](/docs/guides/code_interpreter)。
:::

| 功能 | 支援 |
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅ |
| 支援的提供者 | `openai` |

## 端點 {#endpoints}

| 端點 | 方法 | 描述 |
|----------|--------|-------------|
| `/v1/containers/{container_id}/files` | POST | 上傳檔案至容器 |
| `/v1/containers/{container_id}/files` | GET | 列出容器中的檔案 |
| `/v1/containers/{container_id}/files/{file_id}` | GET | 取得檔案中繼資料 |
| `/v1/containers/{container_id}/files/{file_id}/content` | GET | 下載檔案內容 |
| `/v1/containers/{container_id}/files/{file_id}` | DELETE | 刪除檔案 |

## LiteLLM Python SDK {#litellm-python-sdk}

### 上傳容器檔案 {#upload-container-file}

直接上傳檔案到容器工作階段。當 `/chat/completions` 或 `/responses` 將檔案傳送到容器，但輸入檔案類型僅限於 PDF 時，這會很有用。這個端點可讓您處理其他檔案類型，例如 CSV、Excel、Python 指令碼等。

```python showLineNumbers title="upload_container_file.py"
from litellm import upload_container_file

# Upload a CSV file
file = upload_container_file(
    container_id="cntr_123...",
    file=("data.csv", open("data.csv", "rb").read(), "text/csv"),
    custom_llm_provider="openai"
)

print(f"Uploaded: {file.id}")
print(f"Path: {file.path}")
```

**非同步：**

```python showLineNumbers title="aupload_container_file.py"
from litellm import aupload_container_file

file = await aupload_container_file(
    container_id="cntr_123...",
    file=("script.py", b"print('hello world')", "text/x-python"),
    custom_llm_provider="openai"
)
```

**支援的檔案格式：**
- CSV (`.csv`)
- Excel (`.xlsx`)
- Python 指令碼 (`.py`)
- JSON (`.json`)
- Markdown (`.md`)
- 文字檔 (`.txt`)
- 還有更多...

### 列出容器檔案 {#list-container-files}

```python showLineNumbers title="list_container_files.py"
from litellm import list_container_files

files = list_container_files(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)

for file in files.data:
    print(f"  - {file.id}: {file.filename}")
```

**非同步：**

```python showLineNumbers title="alist_container_files.py"
from litellm import alist_container_files

files = await alist_container_files(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)
```

### 取得容器檔案 {#retrieve-container-file}

```python showLineNumbers title="retrieve_container_file.py"
from litellm import retrieve_container_file

file = retrieve_container_file(
    container_id="cntr_123...",
    file_id="cfile_456...",
    custom_llm_provider="openai"
)

print(f"File: {file.filename}")
print(f"Size: {file.bytes} bytes")
```

### 下載檔案內容 {#download-file-content}

```python showLineNumbers title="retrieve_container_file_content.py"
from litellm import retrieve_container_file_content

content = retrieve_container_file_content(
    container_id="cntr_123...",
    file_id="cfile_456...",
    custom_llm_provider="openai"
)

# content is raw bytes
with open("output.png", "wb") as f:
    f.write(content)
```

### 刪除容器檔案 {#delete-container-file}

```python showLineNumbers title="delete_container_file.py"
from litellm import delete_container_file

result = delete_container_file(
    container_id="cntr_123...",
    file_id="cfile_456...",
    custom_llm_provider="openai"
)

print(f"Deleted: {result.deleted}")
```

## LiteLLM AI Gateway（Proxy） {#litellm-ai-gateway-proxy}

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

### 上傳檔案 {#upload-file}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="upload_file.py"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

file = client.containers.files.create(
    container_id="cntr_123...",
    file=open("data.csv", "rb")
)

print(f"Uploaded: {file.id}")
print(f"Path: {file.path}")
```

</TabItem>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="upload_file.sh"
curl "http://localhost:4000/v1/containers/cntr_123.../files" \
    -H "Authorization: Bearer sk-1234" \
    -F file="@data.csv"
```

</TabItem>
</Tabs>

### 列出檔案 {#list-files}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="list_files.py"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

files = client.containers.files.list(
    container_id="cntr_123..."
)

for file in files.data:
    print(f"  - {file.id}: {file.filename}")
```

</TabItem>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="list_files.sh"
curl "http://localhost:4000/v1/containers/cntr_123.../files" \
    -H "Authorization: Bearer sk-1234"
```

</TabItem>
</Tabs>

### 取得檔案中繼資料 {#retrieve-file-metadata}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="retrieve_file.py"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

file = client.containers.files.retrieve(
    container_id="cntr_123...",
    file_id="cfile_456..."
)

print(f"File: {file.filename}")
print(f"Size: {file.bytes} bytes")
```

</TabItem>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="retrieve_file.sh"
curl "http://localhost:4000/v1/containers/cntr_123.../files/cfile_456..." \
    -H "Authorization: Bearer sk-1234"
```

</TabItem>
</Tabs>

### 下載檔案內容 {#download-file-content-1}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="download_content.py"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

content = client.containers.files.content(
    container_id="cntr_123...",
    file_id="cfile_456..."
)

with open("output.png", "wb") as f:
    f.write(content.read())
```

</TabItem>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="download_content.sh"
curl "http://localhost:4000/v1/containers/cntr_123.../files/cfile_456.../content" \
    -H "Authorization: Bearer sk-1234" \
    --output downloaded_file.png
```

</TabItem>
</Tabs>

### 刪除檔案 {#delete-file}

<Tabs>
<TabItem value="openai-sdk" label="OpenAI SDK">

```python showLineNumbers title="delete_file.py"
from openai import OpenAI

client = OpenAI(
    api_key="sk-1234",
    base_url="http://localhost:4000"
)

result = client.containers.files.delete(
    container_id="cntr_123...",
    file_id="cfile_456..."
)

print(f"Deleted: {result.deleted}")
```

</TabItem>
<TabItem value="curl" label="curl">

```bash showLineNumbers title="delete_file.sh"
curl -X DELETE "http://localhost:4000/v1/containers/cntr_123.../files/cfile_456..." \
    -H "Authorization: Bearer sk-1234"
```

</TabItem>
</Tabs>

## 參數 {#parameters}

### 上傳檔案 {#upload-file-1}

| 參數 | 類型 | 必填 | 描述 |
|-----------|------|----------|-------------|
| `container_id` | string | Yes | 容器 ID |
| `file` | FileTypes | Yes | 要上傳的檔案。可以是 (filename, content, content_type) 的 tuple、類檔案物件或 bytes |

### 列出檔案 {#list-files-1}

| 參數 | 類型 | 必填 | 描述 |
|-----------|------|----------|-------------|
| `container_id` | string | Yes | 容器 ID |
| `after` | string | No | 分頁游標 |
| `limit` | integer | No | 要回傳的項目數（1-100，預設：20） |
| `order` | string | No | 排序順序：`asc` 或 `desc` |

### 取得/刪除檔案 {#retrievedelete-file}

| 參數 | 類型 | 必填 | 描述 |
|-----------|------|----------|-------------|
| `container_id` | string | Yes | 容器 ID |
| `file_id` | string | Yes | 檔案 ID |

## 回應物件 {#response-objects}

### ContainerFileObject {#containerfileobject}

```json showLineNumbers title="ContainerFileObject"
{
  "id": "cfile_456...",
  "object": "container.file",
  "container_id": "cntr_123...",
  "bytes": 12345,
  "created_at": 1234567890,
  "filename": "chart.png",
  "path": "/mnt/data/chart.png",
  "source": "code_interpreter"
}
```

### ContainerFileListResponse {#containerfilelistresponse}

```json showLineNumbers title="ContainerFileListResponse"
{
  "object": "list",
  "data": [...],
  "first_id": "cfile_456...",
  "last_id": "cfile_789...",
  "has_more": false
}
```

### DeleteContainerFileResponse {#deletecontainerfileresponse}

```json showLineNumbers title="DeleteContainerFileResponse"
{
  "id": "cfile_456...",
  "object": "container.file.deleted",
  "deleted": true
}
```

## 支援的提供者 {#supported-providers}

| 提供者 | 狀態 |
|----------|--------|
| OpenAI | ✅ 支援 |

## 相關 {#related}

- [Containers API](/docs/containers) - 管理容器
- [Code Interpreter 指南](/docs/guides/code_interpreter) - 在 LiteLLM 中使用 Code Interpreter
