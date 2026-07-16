import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# RAGFlow 向量儲存 {#ragflow-vector-stores}

Litellm 支援在 Ragflow 中建立與管理用於文件處理與知識庫管理的資料集。

| 屬性 | 詳細資訊 |
|----------|---------|
| 說明 | RAGFlow 資料集可用於 RAG 應用程式的文件處理、分塊與知識庫管理。 |
| LiteLLM 上的提供者路由 | `ragflow` 位於 litellm vector_store_registry 中 |
| 提供者文件 | [RAGFlow API 文件 ↗](https://ragflow.io/docs) |
| 支援的操作 | 資料集管理（建立、列出、更新、刪除） |
| 搜尋/檢索 | ❌ 不支援（僅限管理） |

## 快速開始 {#quick-start}

### LiteLLM Python SDK {#litellm-python-sdk}

```python showLineNumbers title="Example using LiteLLM Python SDK"
import os
import litellm

# Set RAGFlow credentials
os.environ["RAGFLOW_API_KEY"] = "your-ragflow-api-key"
os.environ["RAGFLOW_API_BASE"] = "http://localhost:9380"  # Optional, defaults to localhost:9380

# Create a RAGFlow dataset
response = litellm.vector_stores.create(
    name="my-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "description": "My knowledge base dataset",
        "embedding_model": "BAAI/bge-large-zh-v1.5@BAAI",
        "chunk_method": "naive"
    }
)

print(f"Created dataset ID: {response.id}")
print(f"Dataset name: {response.name}")
```

### LiteLLM 代理閘道 {#litellm-proxy}

#### 1. 設定您的 vector_store_registry {#1-configure-your-vector_store_registry}

<Tabs>
<TabItem value="config-yaml" label="config.yaml">

```yaml
model_list:
  - model_name: gpt-4o-mini
    litellm_params:
      model: gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

vector_store_registry:
  - vector_store_name: "ragflow-knowledge-base"
    litellm_params:
      vector_store_id: "your-dataset-id"
      custom_llm_provider: "ragflow"
      api_key: os.environ/RAGFLOW_API_KEY
      api_base: os.environ/RAGFLOW_API_BASE  # Optional
      vector_store_description: "RAGFlow dataset for knowledge base"
      vector_store_metadata:
        source: "Company documentation"
```

</TabItem>

<TabItem value="litellm-ui" label="LiteLLM UI">

在 LiteLLM UI 中，前往 Experimental > Vector Stores > Create Vector Store。在此頁面上，您可以建立具有名稱、向量儲存 ID 與認證的向量儲存。

<Image 
  img={require('../../img/kb_2.png')}
  style={{width: '50%'}}
/>

</TabItem>
</Tabs>

#### 2. 透過 Proxy 建立資料集 {#2-create-a-dataset-via-proxy}

<Tabs>
<TabItem value="curl" label="Curl">

```bash
curl http://localhost:4000/v1/vector_stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "name": "my-ragflow-dataset",
    "custom_llm_provider": "ragflow",
    "metadata": {
      "description": "Test dataset",
      "chunk_method": "naive"
    }
  }'
```

</TabItem>

<TabItem value="openai-sdk" label="OpenAI Python SDK">

```python
from openai import OpenAI

# Initialize client with your LiteLLM proxy URL
client = OpenAI(
    base_url="http://localhost:4000",
    api_key="your-litellm-api-key"
)

# Create a RAGFlow dataset
response = client.vector_stores.create(
    name="my-ragflow-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "description": "Test dataset",
        "chunk_method": "naive"
    }
)

print(f"Created dataset: {response.id}")
```

</TabItem>
</Tabs>

## 設定 {#configuration}

### 環境變數 {#environment-variables}

RAGFlow 向量儲存支援透過環境變數進行設定：

- `RAGFLOW_API_KEY` - 您的 RAGFlow API 金鑰（必填）
- `RAGFLOW_API_BASE` - RAGFlow API 基礎 URL（選用，預設為 `http://localhost:9380`）

### 參數 {#parameters}

您也可以透過 `litellm_params` 傳入這些參數：

- `api_key` - RAGFlow API 金鑰（會覆寫 `RAGFLOW_API_KEY` 環境變數）
- `api_base` - RAGFlow API 基礎 URL（會覆寫 `RAGFLOW_API_BASE` 環境變數）

## 資料集建立選項 {#dataset-creation-options}

### 基本資料集建立 {#basic-dataset-creation}

```python
response = litellm.vector_stores.create(
    name="basic-dataset",
    custom_llm_provider="ragflow"
)
```

### 具備分塊方法的資料集 {#dataset-with-chunk-method}

RAGFlow 支援多種適用於不同文件類型的分塊方法：

<Tabs>
<TabItem value="naive" label="Naive (General)">

```python
response = litellm.vector_stores.create(
    name="general-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "chunk_method": "naive",
        "parser_config": {
            "chunk_token_num": 512,
            "delimiter": "\n",
            "html4excel": False,
            "layout_recognize": "DeepDOC"
        }
    }
)
```

</TabItem>

<TabItem value="book" label="Book">

```python
response = litellm.vector_stores.create(
    name="book-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "chunk_method": "book",
        "parser_config": {
            "raptor": {
                "use_raptor": False
            }
        }
    }
)
```

</TabItem>

<TabItem value="qa" label="Q&A">

```python
response = litellm.vector_stores.create(
    name="qa-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "chunk_method": "qa",
        "parser_config": {
            "raptor": {
                "use_raptor": False
            }
        }
    }
)
```

</TabItem>

<TabItem value="paper" label="Paper">

```python
response = litellm.vector_stores.create(
    name="paper-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "chunk_method": "paper",
        "parser_config": {
            "raptor": {
                "use_raptor": False
            }
        }
    }
)
```

</TabItem>
</Tabs>

### 具備擷取管線的資料集 {#dataset-with-ingestion-pipeline}

您可以使用擷取管線，而不是使用分塊方法：

```python
response = litellm.vector_stores.create(
    name="pipeline-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "parse_type": 2,  # Number of parsers in your pipeline
        "pipeline_id": "d0bebe30ae2211f0970942010a8e0005"  # 32-character hex ID
    }
)
```

**注意**：`chunk_method` 與 `pipeline_id` 互斥。請擇一使用。

### 進階解析器設定 {#advanced-parser-configuration}

```python
response = litellm.vector_stores.create(
    name="advanced-dataset",
    custom_llm_provider="ragflow",
    metadata={
        "chunk_method": "naive",
        "description": "Advanced dataset with custom parser config",
        "embedding_model": "BAAI/bge-large-zh-v1.5@BAAI",
        "permission": "me",  # or "team"
        "parser_config": {
            "chunk_token_num": 1024,
            "delimiter": "\n!?;。；！？",
            "html4excel": True,
            "layout_recognize": "DeepDOC",
            "auto_keywords": 5,
            "auto_questions": 3,
            "task_page_size": 12,
            "raptor": {
                "use_raptor": True
            },
            "graphrag": {
                "use_graphrag": False
            }
        }
    }
)
```

## 支援的分塊方法 {#supported-chunk-methods}

RAGFlow 支援以下分塊方法：

- `naive` - 通用（預設）
- `book` - 適用於書籍文件
- `email` - 適用於電子郵件文件
- `laws` - 適用於法律文件
- `manual` - 手動分塊
- `one` - 單一分塊
- `paper` - 適用於學術論文
- `picture` - 適用於圖片文件
- `presentation` - 適用於簡報文件
- `qa` - Q&A 格式
- `table` - 適用於表格文件
- `tag` - 基於標籤的分塊

## RAGFlow 特定參數 {#ragflow-specific-parameters}

所有 RAGFlow 特定參數都應透過 `metadata` 欄位傳入：

| 參數 | 類型 | 說明 |
|-----------|------|-------------|
| `avatar` | string | avatar 的 Base64 編碼（最多 65535 字元） |
| `description` | string | 資料集的簡短說明（最多 65535 字元） |
| `embedding_model` | string | 嵌入模型名稱（例如，"BAAI/bge-large-zh-v1.5@BAAI"） |
| `permission` | string | 存取權限："me"（預設）或 "team" |
| `chunk_method` | string | 分塊方法（請參閱上方支援的方法） |
| `parser_config` | object | 解析器設定（依 chunk_method 而異） |
| `parse_type` | int | 管線中的解析器數量（與 pipeline_id 一起必填） |
| `pipeline_id` | string | 32 字元十六進位 pipeline ID（與 parse_type 一起必填） |

## 錯誤處理 {#error-handling}

RAGFlow 會以下列格式回傳錯誤回應：

```json
{
    "code": 101,
    "message": "Dataset name 'my-dataset' already exists"
}
```

LiteLLM 會自動將這些對應為適當的例外狀況：

- `code != 0` → 引發含錯誤訊息的例外狀況
- 缺少必要欄位 → 引發 `ValueError`
- 互斥參數 → 引發 `ValueError`

## 限制 {#limitations}

- **搜尋/檢索**：RAGFlow 向量儲存僅支援資料集管理。不支援搜尋操作，且會引發 `NotImplementedError`。
- **列出/更新/刪除**：這些操作尚未透過標準向量儲存 API 實作。請直接使用 RAGFlow 的原生 API 端點。

## 延伸閱讀 {#further-reading}

向量儲存：
- [向量儲存建立](../vector_stores/create.md)
- [在 Completions 中使用向量儲存](../completion/knowledgebase.md)
- [向量儲存註冊表](../completion/knowledgebase.md#vectorstoreregistry)
