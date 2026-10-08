# /containers {#containers}

管理 OpenAI 和 Azure OpenAI 程式碼解譯器容器（工作階段），以便在隔離環境中執行程式碼。

:::tip
想了解如何使用 Code Interpreter？請參閱 [Code Interpreter 指南](/docs/guides/code_interpreter)。
:::

| 功能 | 支援 | 
|---------|-----------|
| 成本追蹤 | ✅ |
| 記錄 | ✅（完整請求/回應記錄） |
| 負載平衡 | ✅ |
| 代理伺服器支援 | ✅ 與虛擬金鑰的完整代理整合 |
| 支出管理 | ✅ 預算追蹤與速率限制 |
| 支援的提供者 | `openai`, `azure` |

:::tip

containers 提供 code interpreter sessions 的隔離執行環境。您可以建立、列出、擷取與刪除 containers。

:::

## **LiteLLM Python SDK 用法** {#litellm-python-sdk-usage}

### 快速開始 {#quick-start}

**建立 Container**

```python
import litellm
import os 

# setup env
os.environ["OPENAI_API_KEY"] = "sk-.."

container = litellm.create_container(
    name="My Code Interpreter Container",
    custom_llm_provider="openai",
    expires_after={
        "anchor": "last_active_at",
        "minutes": 20
    }
)

print(f"Container ID: {container.id}")
print(f"Container Name: {container.name}")
```

### 非同步用法 {#async-usage}

```python
from litellm import acreate_container
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

container = await acreate_container(
    name="My Code Interpreter Container",
    custom_llm_provider="openai",
    expires_after={
        "anchor": "last_active_at",
        "minutes": 20
    }
)

print(f"Container ID: {container.id}")
print(f"Container Name: {container.name}")
```

### 列出 Containers {#list-containers}

```python
from litellm import list_containers
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

containers = list_containers(
    custom_llm_provider="openai",
    limit=20,
    order="desc"
)

print(f"Found {len(containers.data)} containers")
for container in containers.data:
    print(f"  - {container.id}: {container.name}")
```

**非同步用法：**

```python
from litellm import alist_containers

containers = await alist_containers(
    custom_llm_provider="openai",
    limit=20,
    order="desc"
)

print(f"Found {len(containers.data)} containers")
for container in containers.data:
    print(f"  - {container.id}: {container.name}")
```

### 擷取 Container {#retrieve-a-container}

```python
from litellm import retrieve_container
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

container = retrieve_container(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)

print(f"Container: {container.name}")
print(f"Status: {container.status}")
print(f"Created: {container.created_at}")
```

**非同步用法：**

```python
from litellm import aretrieve_container

container = await aretrieve_container(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)

print(f"Container: {container.name}")
print(f"Status: {container.status}")
print(f"Created: {container.created_at}")
```

### 刪除 Container {#delete-a-container}

```python
from litellm import delete_container
import os 

os.environ["OPENAI_API_KEY"] = "sk-.."

result = delete_container(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)

print(f"Deleted: {result.deleted}")
print(f"Container ID: {result.id}")
```

**非同步用法：**

```python
from litellm import adelete_container

result = await adelete_container(
    container_id="cntr_123...",
    custom_llm_provider="openai"
)

print(f"Deleted: {result.deleted}")
print(f"Container ID: {result.id}")
```

## **LiteLLM Proxy 用法** {#litellm-proxy-usage}

LiteLLM 提供與 OpenAI API 相容的 container 端點，用於管理 code interpreter sessions：

- `/v1/containers` - 建立與列出 containers
- `/v1/containers/{container_id}` - 擷取與刪除 containers

**設定**

```bash
$ export OPENAI_API_KEY="sk-..."

$ litellm

# RUNNING on http://0.0.0.0:4000
```

OpenAI 金鑰也可以放在 `model_list` 中，而不是環境變數。請在建立內容中傳入該部署的 `model`，或在 list 上以 `model` 查詢參數傳入，代理便會以該部署的 `api_key` 和 `api_base` 呼叫 OpenAI。擷取、刪除與容器檔案呼叫不需要 `model`：路由建立回傳的 ID 已編碼該部署，因此可自行路由

```yaml
model_list:
  - model_name: gpt-5.6
    litellm_params:
      model: openai/gpt-5.6
      api_key: os.environ/OPENAI_API_KEY_TEAM_A
```

```bash
$ litellm --config config.yaml
```

**自訂提供者規格**

您可以用多種方式指定自訂 LLM 提供者（優先順序）：
1. 標頭：`-H "custom-llm-provider: openai"`
2. 查詢參數：`?custom_llm_provider=openai`
3. 請求本文：`{"custom_llm_provider": "openai", ...}`
4. 若未指定，預設為 "openai"

**建立 Container**

```bash
# Default provider (openai)
curl -X POST "http://localhost:4000/v1/containers" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "My Container",
        "expires_after": {
            "anchor": "last_active_at",
            "minutes": 20
        }
    }'
```

```bash
# Via header
curl -X POST "http://localhost:4000/v1/containers" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "custom-llm-provider: openai" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "My Container"
    }'
```

```bash
# Via query parameter
curl -X POST "http://localhost:4000/v1/containers?custom_llm_provider=openai" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "My Container"
    }'
```

```bash
# With model_list credentials: name the deployment
curl -X POST "http://localhost:4000/v1/containers" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "My Container",
        "model": "gpt-5.6"
    }'
```

**列出容器**

```bash
curl "http://localhost:4000/v1/containers?limit=20&order=desc" \
    -H "Authorization: Bearer $LITELLM_API_KEY"
```

```bash
# With model_list credentials: name the deployment
curl "http://localhost:4000/v1/containers?model=gpt-5.6&limit=20&order=desc" \
    -H "Authorization: Bearer $LITELLM_API_KEY"
```

**擷取容器**

```bash
curl "http://localhost:4000/v1/containers/cntr_123..." \
    -H "Authorization: Bearer $LITELLM_API_KEY"
```

**刪除 Container**

```bash
curl -X DELETE "http://localhost:4000/v1/containers/cntr_123..." \
    -H "Authorization: Bearer $LITELLM_API_KEY"
```

## **在 LiteLLM Proxy 中使用 OpenAI Client** {#using-openai-client-with-litellm-proxy}

您可以使用標準的 OpenAI Python 客戶端與 LiteLLM 的容器端點互動。這提供了熟悉的介面，同時保留 LiteLLM 的代理功能。

### 設定 {#setup}

首先，將您的 OpenAI client 設定為指向您的 LiteLLM proxy：

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-<your-litellm-api-key>",  # Your LiteLLM proxy key
    base_url="http://localhost:4000"  # LiteLLM proxy URL
)
```

### 建立 Container {#create-a-container}

```python
container = client.containers.create(
    name="test-container",
    expires_after={
        "anchor": "last_active_at",
        "minutes": 20
    },
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Container ID: {container.id}")
print(f"Container Name: {container.name}")
print(f"Created at: {container.created_at}")
```

使用 `model_list` 憑證時，請在 `extra_body` 中命名部署：

```python
container = client.containers.create(
    name="test-container",
    extra_body={"model": "gpt-5.6"}
)
```

### 列出 Containers {#list-containers-1}

```python
containers = client.containers.list(
    limit=20,
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Found {len(containers.data)} containers")
for container in containers.data:
    print(f"  - {container.id}: {container.name}")
```

使用 `model_list` 憑證時，請在 `extra_query` 中命名部署，因為 list 是 GET：

```python
containers = client.containers.list(
    limit=20,
    extra_query={"model": "gpt-5.6"}
)
```

### 擷取 Container {#retrieve-a-container-1}

```python
container = client.containers.retrieve(
    container_id="cntr_6901d28b3c8881908b702815828a5bde0380b3408aeae8c7",
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Container: {container.name}")
print(f"Status: {container.status}")
print(f"Last active: {container.last_active_at}")
```

### 刪除 Container {#delete-a-container-1}

```python
result = client.containers.delete(
    container_id="cntr_6901d28b3c8881908b702815828a5bde0380b3408aeae8c7",
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Deleted: {result.deleted}")
print(f"Container ID: {result.id}")
```

### 完整工作流程範例 {#complete-workflow-example}

以下是一個展示完整 container 管理工作流程的完整範例：

```python
from openai import OpenAI

# Initialize client
client = OpenAI(
    api_key="sk-<your-litellm-api-key>",
    base_url="http://localhost:4000"
)

# 1. Create a container
print("Creating container...")
container = client.containers.create(
    name="My Code Interpreter Session",
    expires_after={
        "anchor": "last_active_at",
        "minutes": 20
    },
    extra_body={"custom_llm_provider": "openai"}
)

container_id = container.id
print(f"Container created. ID: {container_id}")

# 2. List all containers
print("\nListing containers...")
containers = client.containers.list(
    extra_body={"custom_llm_provider": "openai"}
)

for c in containers.data:
    print(f"  - {c.id}: {c.name} (Status: {c.status})")

# 3. Retrieve specific container
print(f"\nRetrieving container {container_id}...")
retrieved = client.containers.retrieve(
    container_id=container_id,
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Container: {retrieved.name}")
print(f"Status: {retrieved.status}")
print(f"Last active: {retrieved.last_active_at}")

# 4. Delete container
print(f"\nDeleting container {container_id}...")
result = client.containers.delete(
    container_id=container_id,
    extra_body={"custom_llm_provider": "openai"}
)

print(f"Deleted: {result.deleted}")
```

## Container 參數 {#container-parameters}

### 建立 Container 參數 {#create-container-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `name` | string | 是 | container 的名稱 |
| `expires_after` | object | 否 | container 到期設定 |
| `expires_after.anchor` | string | 否 | 到期的錨點（例如 "last_active_at"） |
| `expires_after.minutes` | integer | 否 | 從錨點算起到到期的分鐘數 |
| `file_ids` | array | 否 | 要包含在 container 中的檔案 ID 清單 |
| `custom_llm_provider` | string | 否 | 要使用的 LLM 提供者（預設："openai"） |

### 列出 Container 參數 {#list-container-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `after` | string | 否 | 分頁游標 |
| `limit` | integer | 否 | 要回傳的項目數量（1-100，預設：20） |
| `order` | string | 否 | 排序順序："asc" 或 "desc"（預設："desc"） |
| `custom_llm_provider` | string | 否 | 要使用的 LLM 提供者（預設："openai"） |

### 擷取/刪除 Container 參數 {#retrievedelete-container-parameters}

| 參數 | 類型 | 必填 | 說明 |
|-----------|------|----------|-------------|
| `container_id` | string | 是 | 要擷取/刪除的 container ID |
| `custom_llm_provider` | string | 否 | 要使用的 LLM 提供者（預設："openai"） |

## 回應物件 {#response-objects}

### 容器物件 {#containerobject}

```json
{
  "id": "cntr_123...",
  "object": "container",
  "created_at": 1234567890,
  "name": "My Container",
  "status": "active",
  "last_active_at": 1234567890,
  "expires_at": 1234569090,
  "file_ids": []
}
```

### 容器清單回應 {#containerlistresponse}

```json
{
  "object": "list",
  "data": [
    {
      "id": "cntr_123...",
      "object": "container",
      "created_at": 1234567890,
      "name": "My Container",
      "status": "active"
    }
  ],
  "first_id": "cntr_123...",
  "last_id": "cntr_456...",
  "has_more": false
}
```

### 刪除容器結果 {#deletecontainerresult}

```json
{
  "id": "cntr_123...",
  "object": "container.deleted",
  "deleted": true
}
```

## **支援的提供者** {#supported-providers}

| 提供者    | 支援狀態 | 備註 |
|-------------|----------------|-------|
| OpenAI      | ✅ 支援   | 完整支援所有容器作業 |
| Azure OpenAI | ✅ 支援  | 設定 `custom_llm_provider="azure"`。請求會帶著 `api-key` 標頭送至 `{api_base}/openai/v1/containers` |

對於 Azure OpenAI，請將資源端點傳入 `api_base`，將金鑰傳入 `api_key`，或設定 `AZURE_API_BASE` 和 `AZURE_API_KEY`

```python
container = litellm.create_container(
    name="My Code Interpreter Container",
    custom_llm_provider="azure",
    api_base="https://<your-resource>.openai.azure.com",
    api_key=os.environ["AZURE_API_KEY"],
)
```

在代理上，傳送 `-H "custom-llm-provider: azure"` 以使用 `AZURE_API_BASE` 和 `AZURE_API_KEY` 環境變數，或在 `model_list` 中傳入一個 `azure/` 部署的 `model`，以使用該部署的 `api_base` 和 `api_key`

## 相關內容 {#related}

- [Container Files API](/docs/container_files) - 管理 containers 內的檔案
- [Code Interpreter 指南](/docs/guides/code_interpreter) - 在 LiteLLM 中使用 Code Interpreter
