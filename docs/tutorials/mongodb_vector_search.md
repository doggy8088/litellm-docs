# 在 MongoDB 中與範例文件聊天（BETA） {#chat-with-sample-documents-in-mongodb-beta}

建立三份虛構的政策文件，將它們索引到 MongoDB Atlas，在 LiteLLM Admin UI 中測試語意搜尋，並在聊天完成中使用結果。下方的範例文字是為本教學撰寫，並不描述真實的公司政策。

:::warning[BETA]
MongoDB 向量儲存是 LiteLLM 中的 **BETA** 功能。此整合會搜尋現有的 MongoDB 索引。本教學會先使用 MongoDB Python 驅動程式準備文件，然後再將索引註冊到 LiteLLM。一般設定與限制請參閱[integration guide](../providers/mongodb_vector_stores.md)。
:::

## 開始之前 {#before-you-begin}

您需要：

- 具備 Vector Search 與額外搜尋索引容量的 Atlas 叢集、允許建立並讀取示範集合的資料庫使用者，以及建立索引的權限。
- 連線字串，以及您的設定腳本與 MongoDB sidecar 都可存取該叢集的網路權限。
- 已執行的 LiteLLM proxy，安裝了 `litellm[proxy]`、已為已儲存的註冊項目設定好資料庫，並可存取 Admin UI。
- 用於此範例中的嵌入與聊天模型的 OpenAI API 金鑰。若文件與查詢嵌入都使用相同模型與維度，也可以使用其他提供者。

## 將模型加入 LiteLLM {#add-the-models-to-litellm}

在 LiteLLM Admin UI 的 **Models** 下，使用您的 OpenAI API 金鑰新增這些部署，或重用 proxy 上已存在的對等部署：

| 用途 | 提供者 | 提供者模型 | 在 proxy 上的名稱 |
|---|---|---|---|
| 嵌入文件與搜尋查詢 | OpenAI | `text-embedding-3-small` | `text-embedding-3-small` |
| 產生聊天回覆 | OpenAI | `gpt-4o-mini` | `gpt-4o-mini` |

對於設定檔，LiteLLM 模型識別碼為 `openai/text-embedding-3-small` 與 `openai/gpt-4o-mini`。請在嵌入部署上設定 `model_info.mode: embedding`，讓 UI 將其識別為嵌入模型。此範例請使用嵌入模型預設的 **1536 維度**。

## 準備範例文件 {#prepare-the-sample-documents}

在獨立的設定環境中安裝相依套件。PyMongo 用來準備範例資料；它不是 LiteLLM proxy 或 SDK 的相依套件：

```bash
python -m venv .venv-mongodb-setup
source .venv-mongodb-setup/bin/activate
pip install openai pymongo
```

將 `MONGODB_CONNECTION_STRING` 設為您叢集的完整 URI，並將 `LITELLM_API_KEY` 設為有權存取嵌入模型的 LiteLLM 金鑰。如果您的 proxy 使用不同位址，請設定 `LITELLM_BASE_URL`：

```bash
export MONGODB_CONNECTION_STRING='mongodb+srv://<database-user>:<password>@<cluster-hostname>/'
export LITELLM_API_KEY='<litellm-api-key>'
export LITELLM_BASE_URL='http://localhost:4000/v1'
```

請使用資料庫使用者的憑證，這些憑證與您的 Atlas 網站登入不同。請對使用者名稱與密碼中的特殊字元進行百分比編碼。

將此儲存為 `prepare_documents.py`，並使用 `python prepare_documents.py` 執行。它會透過 proxy 的 embeddings API 對原始範例文字進行嵌入，並使用 PyMongo 插入文件。如果示範集合已存在，它會停止，因此不會覆寫現有資料。

```python title="prepare_documents.py"
import os

from openai import OpenAI
from pymongo import MongoClient

samples = [
    {
        "_id": "projector-booking",
        "text": "For this fictional demo, projectors may be reserved for 45 minutes. Include reservation code DEMO-7321 with every projector booking.",
    },
    {
        "_id": "desk-reservation",
        "text": "For this fictional demo, standing desks can be reserved for two hours. Cancel a desk reservation at least 15 minutes before it starts.",
    },
    {
        "_id": "visitor-badges",
        "text": "For this fictional demo, visitors collect badges at the welcome desk. Return each badge before leaving the building.",
    },
]

with MongoClient(os.environ["MONGODB_CONNECTION_STRING"]) as mongo:
    database = mongo["litellm_docs_demo"]
    if "policies" in database.list_collection_names():
        raise RuntimeError("Demo collection already exists. Use a fresh database for this tutorial.")

    with OpenAI(
        base_url=os.environ.get("LITELLM_BASE_URL", "http://localhost:4000/v1"),
        api_key=os.environ["LITELLM_API_KEY"],
    ) as client:
        embeddings = client.embeddings.create(
            model="text-embedding-3-small",
            input=[document["text"] for document in samples],
        )

    for item in embeddings.data:
        samples[item.index]["embedding"] = item.embedding

    collection = database.create_collection("policies")
    collection.insert_many(samples)
    print("Inserted three sample documents into litellm_docs_demo.policies.")
```

文件插入是由設定腳本在 LiteLLM 的向量儲存 API 之外完成的。LiteLLM 的 MongoDB 整合不支援 `/rag/ingest` 或向量儲存檔案上傳。

## 準備 Atlas 索引 {#prepare-the-atlas-index}

在 Atlas 中，於 `litellm_docs_demo.policies` 上建立名為 `litellm_demo_policy_idx` 的 **Vector Search** 索引，並使用此定義：

```json title="Vector Search index definition"
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

請等待其成為 **READY** 且可查詢。如果您變更資料庫、集合或索引名稱，請在後續步驟中一律使用那些值。

## 部署 MongoDB sidecar {#deploy-the-mongodb-sidecar}

請依照 Docker、Compose 或 Kubernetes 的[sidecar deployment guide](../providers/mongodb_vector_stores.md#deploy-the-sidecar)。將 sidecar 的 `MONGODB_CONNECTION_STRING` 設為設定腳本使用的 URI，並將 `MONGODB_SIDECAR_API_KEY` 設為與 LiteLLM 共用的強式密鑰。URI 與任何 MongoDB TLS 檔案都保留在 sidecar 中。

對於在 Docker 主機上執行的 proxy，請使用 `http://127.0.0.1:8080` 作為 Sidecar URL。Compose 範例會共用 LiteLLM 的網路命名空間，並使用相同的 loopback URL。遠端 sidecar 需要 HTTPS。請在註冊索引之前，確認 sidecar 的 `/health/readiness` 端點回傳 HTTP 200。

## 在 Admin UI 中註冊索引 {#register-the-index-in-the-admin-ui}

開啟 **Tools > Vector Stores > Manage Vector Stores > + Add Vector Store**，然後輸入：

| UI 欄位 | 值 |
|---|---|
| Provider | MongoDB (BETA) |
| Vector Store Name | `MongoDB Demo Policies` |
| Vector Store ID | `litellm_demo_policy_idx` |
| Sidecar URL | 您的 LiteLLM proxy 可連線到的 sidecar 位址。 |
| Sidecar API Key | sidecar 的 `MONGODB_SIDECAR_API_KEY` 值。 |
| Database | `litellm_docs_demo` |
| Collection | `policies` |
| Embedding Model | `text-embedding-3-small` |
| Vector Field Name | `embedding` |
| Text Field | `text` |
| Candidates Considered | 保持空白。 |

按一下 **Create**。如果此索引已在您的 proxy 上註冊，請在下一步選取現有的註冊項目。請將查詢嵌入模型保持與設定腳本中使用的模型相同；聊天模型可以獨立變更。

## 測試搜尋 {#test-search}

在 **Test Vector Store** 中，選取 **MongoDB Demo Policies** 並執行：

```text
How long can I book a projector, and which reservation code should I use?
```

請找出 ID 為 `projector-booking` 的文件。其文字應包含 **45 minutes** 與 **DEMO-7321**。展開結果以檢視擷取的文字。相似度分數可能會有所不同。

您也可以透過 API 執行相同搜尋。請使用有權存取此儲存區的 LiteLLM 金鑰；如果您的 proxy 使用不同位址，請取代 `http://localhost:4000`：

```bash
curl -X POST 'http://localhost:4000/v1/vector_stores/litellm_demo_policy_idx/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "How long can I book a projector, and which reservation code should I use?",
    "max_num_results": 3
  }'
```

這會同時檢查連線、查詢嵌入、索引與回傳文字。請使用關於範例文件的問題來評估相關性。

## 在聊天完成中使用這些文件 {#use-the-documents-in-a-chat-completion}

如果這是執行中 proxy 註冊的第一個向量儲存，請等待 proxy 的資料庫同步，或在測試聊天之前重新啟動它。請參閱[first-registration note](../providers/mongodb_vector_stores.md#connect-your-index)。

請使用可存取儲存區與聊天模型的 LiteLLM 金鑰：

```bash
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "system",
        "content": "Use the provided demo policies to answer the question. If there is no relevant context, say you do not know."
      },
      {
        "role": "user",
        "content": "How long can I book a projector, and which reservation code should I use?"
      }
    ],
    "tools": [
      {
        "type": "file_search",
        "vector_store_ids": ["litellm_demo_policy_idx"]
      }
    ]
  }'
```

請驗證回應的兩個部分：

- `choices[0].message.content` 回答 **45 minutes** 與 **DEMO-7321**。
- `choices[0].message.provider_specific_fields.search_results` 包含 `projector-booking` 文件及其文字。

成功的聊天回應本身無法證明檢索已成功。請檢查來源結果，以確認 MongoDB 提供了上下文。一般聊天指南[general chat guide](../providers/mongodb_vector_stores.md#use-mongodb-in-chat-completions)包含一個會列印這些結果的 Python 範例。

若要套用到您自己的集合，請使用[MongoDB integration guide](../providers/mongodb_vector_stores.md#connect-your-index)替換資料庫、集合、索引、欄位名稱與嵌入模型。
