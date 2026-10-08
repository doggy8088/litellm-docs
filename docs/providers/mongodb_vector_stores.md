import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB - 向量儲存（BETA） {#mongodb---vector-store-beta}

:::warning[BETA]
MongoDB 向量儲存整合是一項 **BETA** 功能。它支援透過可選的 [LiteLLM MongoDB sidecar](https://github.com/BerriAI/litellm-mongodb) 搜尋現有的 MongoDB Vector Search 索引。請在將集合、索引與嵌入文件連接到 LiteLLM 之前先準備好它們。
:::

將 MongoDB Atlas 或自我管理的 MongoDB 部署中的文件作為聊天補全的上下文。LiteLLM 會將使用者的查詢做嵌入、搜尋您的索引，並把擷取到的文字傳給您的聊天模型。您也可以直接搜尋來擷取文件與相似度分數，而不產生答案。

- 透過 Admin UI、組態檔或管理 API [連接您的索引](#connect-your-index)。
- 使用 curl 或 OpenAI Python SDK [在聊天補全中使用 MongoDB](#use-mongodb-in-chat-completions)。
- [依照實作範例](../tutorials/mongodb_vector_search.md) 使用 Atlas 中原始的虛構政策文件。

## 開始之前 {#before-you-begin}

您需要：

- **已啟用 Vector Search 的 MongoDB 部署。** 對於自我管理的部署，請遵循 MongoDB 的 [deployment guide](https://www.mongodb.com/docs/search/self-managed/current/) 與 [version compatibility requirements](https://www.mongodb.com/docs/search/self-managed/current/deployment/compatibility-requirements/)。沒有 Vector Search 的 MongoDB 伺服器無法提供這些查詢服務。
- **已填入資料的集合與可查詢的 Vector Search 索引。** 文件必須同時包含可讀文字與已儲存的嵌入。如果您需要建立索引，請參閱 MongoDB 的 [Vector Search index guide](https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/)。
- **可從 sidecar 存取的連線字串。** 資料庫使用者需要權限來搜尋集合並列出其搜尋索引。請在資料庫的網路規則中允許 sidecar 主機通過。
- **用於文件的嵌入模型。** 查詢嵌入必須使用與已儲存向量相同的模型與輸出維度。使用具有相同維度的不同模型可能會傳回無關結果而不會出錯。

請正常安裝 LiteLLM。MongoDB 驅動程式只會在獨立的 sidecar 中執行：

```bash
pip install 'litellm[proxy]'
```

若要直接使用 Python SDK，請安裝 `litellm`、部署 sidecar，然後依照 [Search with the Python SDK](#search-with-the-python-sdk) 操作。SDK 與標準 LiteLLM 映像都不需要 PyMongo。LiteLLM 不會自動啟動或安裝 sidecar。

:::note[RC 組態變更]
如果您曾在 `v1.101.0-rc.1` 中使用 MongoDB，請將 `mongodb_connection_string` 移至 sidecar 的 `MONGODB_CONNECTION_STRING` 環境變數。在 LiteLLM 註冊中，將其替換為 `api_base` 與 `api_key`。既有的 MongoDB 資料與索引會保持不變；應用程式搜尋與聊天請求也保持不變。此整合仍為 BETA。
:::

### 選擇您的模型 {#choose-your-models}

對於 proxy 請求，請使用已設定的 LiteLLM proxy。透過 UI 或管理 API 的註冊也需要 proxy 資料庫。請在 Admin UI 的 **Models** 下，或在您現有的 `model_list` 組態中新增您的模型：

| 模型 | 用途 | 要求 |
|---|---|---|
| 嵌入模型 | 將每個搜尋查詢轉換為向量 | 必須與用來嵌入集合的模型與維度相符。 |
| 聊天模型 | 根據擷取的文字產生答案 | LiteLLM 支援的聊天模型。僅在聊天補全時需要。 |

在每個模型部署上設定憑證與任何特定提供者設定。MongoDB 不要求使用 OpenAI：請選擇與您已儲存向量相符的嵌入提供者，以及您想使用的聊天提供者。[範例文件](../tutorials/mongodb_vector_search.md) 顯示了一個使用 OpenAI 的設定。

## 部署 sidecar {#deploy-the-sidecar}

每個 MongoDB 連線字串執行一個 sidecar。多個 LiteLLM 註冊可使用該 sidecar 存取其 MongoDB 使用者可存取的資料庫、集合與索引。sidecar 執行官方 MongoDB 驅動程式；LiteLLM 會持續透過您設定的模型產生查詢嵌入，並照常路由聊天請求。

在 sidecar 的部署密鑰中設定 `MONGODB_CONNECTION_STRING` 與強式 `MONGODB_SIDECAR_API_KEY`。將相同的 sidecar 金鑰提供給 LiteLLM。請將 MongoDB 憑證與 TLS 檔案保留在 sidecar 環境中。

<Tabs>
<TabItem value="docker" label="Docker">

適用於在同一主機上執行的 LiteLLM proxy 或 SDK：

```bash
docker run --rm --name mongodb-sidecar \
  -p 127.0.0.1:8080:8080 \
  -e MONGODB_CONNECTION_STRING \
  -e MONGODB_SIDECAR_API_KEY \
  ghcr.io/berriai/litellm-mongodb:v0.1.0-beta.1
```

將 `http://127.0.0.1:8080` 作為 Sidecar URL。請固定發行標籤或 digest。此映像支援 Linux amd64 與 arm64，並以使用者 `10001:10001` 執行。

</TabItem>
<TabItem value="compose" label="Docker Compose">

將此可選服務新增到執行 LiteLLM 的 Compose 專案：

```yaml
services:
  mongodb-sidecar:
    image: ghcr.io/berriai/litellm-mongodb:v0.1.0-beta.1
    network_mode: service:litellm
    depends_on:
      litellm:
        condition: service_started
        restart: true
    environment:
      MONGODB_CONNECTION_STRING: ${MONGODB_CONNECTION_STRING:?required}
      MONGODB_SIDECAR_API_KEY: ${MONGODB_SIDECAR_API_KEY:?required}
    restart: unless-stopped
```

請使用 Docker Compose 2.17 或更新版本。在 `network_mode` 與 `depends_on` 中將 `litellm` 替換為您現有 LiteLLM 服務的名稱，並將 `MONGODB_SIDECAR_API_KEY` 傳遞給該服務。共享網路命名空間可讓 LiteLLM 將 `http://127.0.0.1:8080` 作為 `api_base`。此部署中的 sidecar 不需要主機埠。若為獨立網路命名空間，請改以 HTTPS 暴露 sidecar。

透過 Compose 重新啟動 LiteLLM，讓 sidecar 也一併重新啟動並加入其網路命名空間：

```bash
docker compose restart litellm
```

在變更 LiteLLM 映像或容器組態後，請同時重新建立兩個服務：

```bash
docker compose up -d --force-recreate litellm mongodb-sidecar
```

此相依性的 `restart: true` 僅適用於 Compose 操作；Docker 的自動重新啟動政策與直接的 `docker restart` 不會重新啟動相依服務。如果 LiteLLM 在 Compose 之外重新啟動，請在 LiteLLM 啟動後執行 `docker compose restart mongodb-sidecar`。否則 sidecar 可能仍連接到先前的網路命名空間，導致 MongoDB 搜尋失敗。當服務需要獨立的重新啟動與復原時，請使用獨立的 HTTPS 部署。請參閱 Docker 的 [dependency restart behavior](https://docs.docker.com/reference/compose-file/services/#depends_on)。

</TabItem>
<TabItem value="helm" label="Kubernetes / Helm">

在 LiteLLM 命名空間中建立名為 `mongodb-sidecar` 的 Kubernetes Secret，並包含鍵 `connection-string` 與 `api-key`。對於 LiteLLM `litellm-helm` chart，透過其既有的 `extraContainers` 設定新增 sidecar：

```yaml title="values-mongodb.yaml"
extraEnvVars:
  - name: MONGODB_SIDECAR_API_KEY
    valueFrom:
      secretKeyRef:
        name: mongodb-sidecar
        key: api-key
extraContainers:
  - name: mongodb-sidecar
    image: ghcr.io/berriai/litellm-mongodb:v0.1.0-beta.1
    ports:
      - name: mongodb-http
        containerPort: 8080
    env:
      - name: MONGODB_CONNECTION_STRING
        valueFrom:
          secretKeyRef:
            name: mongodb-sidecar
            key: connection-string
      - name: MONGODB_SIDECAR_API_KEY
        valueFrom:
          secretKeyRef:
            name: mongodb-sidecar
            key: api-key
    securityContext:
      runAsNonRoot: true
      runAsUser: 10001
      runAsGroup: 10001
      allowPrivilegeEscalation: false
      capabilities:
        drop: [ALL]
    livenessProbe:
      httpGet:
        path: /health/liveness
        port: mongodb-http
    startupProbe:
      httpGet:
        path: /health/liveness
        port: mongodb-http
      failureThreshold: 30
      periodSeconds: 2
```

將這些值與您現有的 chart 組態合併，並保留任何既有的額外環境變數與容器。將 MongoDB 註冊的 `api_base` 設為 `http://127.0.0.1:8080`；同一 Pod 中的容器會共享網路。不需要額外的 Service 或強制性的 chart 相依性。

監控 `/health/readiness` 以確認 MongoDB 連線。若 LiteLLM Pod 中的某個容器設定 MongoDB readiness probe，MongoDB 發生中斷時會使整個 Pod 自服務中移除，進而影響其他提供者。若 MongoDB 需要獨立的就緒性、擴展性或可用性，請使用獨立的 sidecar Deployment 與 Service。

</TabItem>
</Tabs>

每個密鑰也可改為以唯讀方式掛載，並透過 `MONGODB_CONNECTION_STRING_FILE` 或 `MONGODB_SIDECAR_API_KEY_FILE` 參照。請只設定值或其檔案變數其中之一，切勿兩者都設定。檔案必須可由容器使用者 10001 讀取。對於 MongoDB TLS，請在 URI 中加入如 `tlsCAFile` 或 `tlsCertificateKeyFile` 等選項，並將檔案掛載到 sidecar 內這些路徑。預設仍會啟用憑證驗證。

LiteLLM 對遠端 sidecar 需要 HTTPS。只有在兩個程序共用主機或網路命名空間時，才接受像 `127.0.0.1` 或 `[::1]` 這類文字形式的 loopback IP 所使用的 HTTP。這可避免 sidecar bearer key 與查詢資料經過未加密的網路跳點。對於獨立的 sidecar 主機或 Deployment，請使用具有 LiteLLM 信任憑證的 HTTPS 反向代理；`api_base` 可包含 proxy 的路徑前置字元，但不能包含 `/v1`。請將服務的 HTTP 埠保留在該 proxy 後方，不對外公開。

請檢查 HTTP 程序的 `/health/liveness` 與有界 MongoDB ping 的 `/health/readiness`。關於逾時、連線池與版本，請參閱 [sidecar operations guide](https://github.com/BerriAI/litellm-mongodb#operations)。

## 連接您的索引 {#connect-your-index}

先註冊既有索引一次，之後在請求中以 ID 參照它。請將尖括號中的所有值替換為您部署中的值。

| 值 | 在哪裡找到 |
|---|---|
| `<index-name>` | 您的 MongoDB Vector Search 索引的確切名稱。這會成為 LiteLLM 的 `vector_store_id`。 |
| `<database-name>` / `<collection-name>` | 包含您文件的資料庫與集合。 |
| `<vector-field>` | 索引定義中的向量 `path`。 |
| `<text-field>` | 包含可讀文字的文件欄位，例如 `text` 或 `metadata.body`。 |
| `<embedding-model-name>` | 在您的 LiteLLM proxy 上註冊的 embedding 模型名稱。 |
| `<chat-model-name>` | 在您的 LiteLLM proxy 上註冊的聊天模型名稱。 |

索引在搜尋前必須是 **READY** 且可查詢。註冊的顯示名稱與其 ID 無關。儲存註冊不會建立索引、匯入文件，或驗證連線是否可用。

請選擇一種註冊方式：

<Tabs>
<TabItem value="ui" label="管理介面">

1. 開啟 **Tools > Vector Stores**，選取 **Manage Vector Stores**，然後按一下 **+ Add Vector Store**。
2. 將 **MongoDB (BETA)** 選為提供者。此連接器也支援搭配 Vector Search 的自我管理 MongoDB。
3. 將確切的索引名稱輸入為 **Vector Store ID**，然後填入 **Sidecar URL**、**Sidecar API Key**、**Database** 和 **Collection**。
4. 選取已註冊的 **Embedding Model**。將 **Vector Field Name** 和 **Text Field** 設為您集合中的欄位。將 **Candidates Considered** 保持空白以使用預設值。
5. 按一下 **Create**，然後使用 **Test Vector Store** 搜尋您確定存在於文件中的內容。檢查傳回的文字以驗證連線與欄位對應。

請使用 **Manage Vector Stores** 進行註冊。獨立的 **Create Vector Store** 流程會在提供者上建立新的 store，且不支援 MongoDB。

</TabItem>
<TabItem value="config" label="config.yaml">

將 `MONGODB_SIDECAR_API_KEY` 設定到 proxy 的環境中，值為 sidecar 上設定的金鑰。使用 proxy 程序可連線的 Sidecar URL。

將此註冊加到您現有的 proxy 設定中，並保留您的 `model_list` 與驗證設定：

```yaml showLineNumbers title="config.yaml"
vector_store_registry:
  - vector_store_name: "<display-name>"
    litellm_params:
      vector_store_id: "<index-name>"
      custom_llm_provider: mongodb
      api_base: http://127.0.0.1:8080
      api_key: os.environ/MONGODB_SIDECAR_API_KEY
      mongodb_database: "<database-name>"
      mongodb_collection: "<collection-name>"
      mongodb_text_field: "<text-field>"
      mongodb_embedding_field: "<vector-field>"
      litellm_embedding_model: "<embedding-model-name>"
```

使用更新後的設定啟動或重新啟動 proxy：

```bash
litellm --config config.yaml --port 4000
```

環境變數必須可供正在執行的 proxy 程序使用。對於 Docker，請透過 `--env-file` 或 `-e` 傳入；主機的 `.env` 檔案不會自動在容器內可用。

</TabItem>
<TabItem value="api" label="管理 API">

在已設定資料庫的 proxy 上，將 `LITELLM_API_KEY` 設為具有管理 vector stores 權限的 LiteLLM 金鑰。必要時請替換 proxy URL：

```bash showLineNumbers title="Register an existing MongoDB index"
curl -X POST 'http://localhost:4000/vector_store/new' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "vector_store_id": "<index-name>",
    "custom_llm_provider": "mongodb",
    "vector_store_name": "<display-name>",
    "litellm_params": {
      "api_base": "http://127.0.0.1:8080",
      "api_key": "<sidecar-api-key>",
      "mongodb_database": "<database-name>",
      "mongodb_collection": "<collection-name>",
      "mongodb_text_field": "<text-field>",
      "mongodb_embedding_field": "<vector-field>",
      "litellm_embedding_model": "<embedding-model-name>"
    }
  }'
```

此註冊會儲存在 LiteLLM 資料庫中。請參閱 [受管理的向量儲存](../vector_stores/managed_vector_stores.md) 了解管理與存取控制。

</TabItem>
</Tabs>

:::note[首次透過 UI 或管理 API 註冊]
如果 proxy 啟動時沒有任何已註冊的 vector stores，在聊天擷取就緒前，直接搜尋可能已可運作。請等待 proxy 的資料庫同步完成，或在儲存第一個 store 後重新啟動，再於聊天 completions 中使用 `file_search`。在啟動時透過 `config.yaml` 載入 store 可避免這個初始延遲。
:::

## 在聊天 completions 中使用 MongoDB {#use-mongodb-in-chat-completions}

使用帶有引用您已註冊索引 ID 的 `file_search` tool 呼叫 `/v1/chat/completions`。LiteLLM 會擷取上下文，並在同一個請求中呼叫您的聊天模型。

將 `LITELLM_API_KEY` 設為具有聊天模型與已註冊 vector store 存取權的 LiteLLM 金鑰。請以您自己的值取代下方的 proxy URL、模型名稱、索引名稱與問題。

<Tabs>
<TabItem value="chat-curl" label="curl">

```bash showLineNumbers title="Chat with your MongoDB documents"
curl -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "<chat-model-name>",
    "messages": [
      {
        "role": "system",
        "content": "Answer using the provided context. If the context does not contain the answer, say you do not know."
      },
      {
        "role": "user",
        "content": "<question-about-your-documents>"
      }
    ],
    "tools": [
      {
        "type": "file_search",
        "vector_store_ids": ["<index-name>"]
      }
    ]
  }'
```

</TabItem>
<TabItem value="chat-python" label="OpenAI Python SDK">

將用戶端指向您的 LiteLLM proxy，並透過 `extra_body` 傳遞 LiteLLM 的 `file_search` tool：

```python showLineNumbers title="Chat completions through LiteLLM"
import os

from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000/v1",
    api_key=os.environ["LITELLM_API_KEY"],
)

response = client.chat.completions.create(
    model="<chat-model-name>",
    messages=[
        {
            "role": "system",
            "content": "Answer using the provided context. If the context does not contain the answer, say you do not know.",
        },
        {"role": "user", "content": "<question-about-your-documents>"},
    ],
    extra_body={
        "tools": [{"type": "file_search", "vector_store_ids": ["<index-name>"]}]
    },
)

message = response.model_dump()["choices"][0]["message"]
print(message["content"])

# Inspect the documents retrieved for this answer.
for page in (message.get("provider_specific_fields") or {}).get("search_results", []):
    for result in page["data"]:
        print(result["file_id"], result["score"], result["content"])
```

</TabItem>
</Tabs>

LiteLLM 會使用 store 設定的 embedding 模型為最後一則使用者訊息建立嵌入，執行 MongoDB 的 `$vectorSearch` 聚合，並將擷取的文字加入對話。接著聊天模型會以 `choices[0].message.content` 產生答案。

此端點上的 `file_search` 由 LiteLLM 在呼叫聊天模型前處理。您的應用程式不需要執行 tool call 或傳送獨立的搜尋請求。請在 `vector_store_ids` 中使用確切的索引名稱，而不是註冊的顯示名稱。

### 驗證擷取 {#verify-retrieval}

成功的擷取會在 `choices[0].message.provider_specific_fields.search_results` 中回傳其文件。檢查其文字與分數，以確認答案具有相關的來源資料。請參閱 [存取搜尋結果](../completion/knowledgebase.md#accessing-search-results-citations) 以查看更多範例。

單靠成功的聊天回應並不能證明 MongoDB 擷取已運作：即使擷取失敗，聊天仍可能完成。如果缺少來源，請執行 [直接搜尋](#search-the-index-directly) 以獨立診斷連線。

## 直接搜尋索引 {#search-the-index-directly}

當您想在不產生聊天回應的情況下擷取文件時，請使用直接搜尋。將 `LITELLM_API_KEY` 設為具有已註冊 store 存取權的 LiteLLM 金鑰。

```bash showLineNumbers title="Search through the proxy"
curl -X POST 'http://localhost:4000/v1/vector_stores/<index-name>/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "<question-about-your-documents>",
    "max_num_results": 3
  }'
```

結果會出現在回應的 `data` 陣列中：

| 回應欄位 | 意義 |
|---|---|
| `content` | 從您設定的 `mongodb_text_field` 讀取的文字。 |
| `file_id` / `filename` | 轉換為字串的 MongoDB 文件 `_id`。 |
| `score` | MongoDB 的 `vectorSearchScore`。數值越高表示結果越相似；分數不是答案信心百分比。 |

`max_num_results` 預設為 `10`，並接受從 `1` 到 `50` 的值。請使用與已知文件相關的查詢來檢查搜尋品質。請參閱 [sample-document 教學](../tutorials/mongodb_vector_search.md#test-search) 取得具體查詢與預期結果。

## 使用 Python SDK 搜尋 {#search-with-the-python-sdk}

將 sidecar 設定直接傳遞給 `litellm.vector_stores.search`；不需要 proxy 註冊。將 `MONGODB_SIDECAR_API_KEY` 與您的 embedding 提供者憑證設定在 SDK 程序的環境中。MongoDB URI 應放在獨立部署的 sidecar 中。

```python showLineNumbers title="Search without a proxy"
import os

import litellm

response = litellm.vector_stores.search(
    vector_store_id="<index-name>",
    query="<question-about-your-documents>",
    custom_llm_provider="mongodb",
    api_base="http://127.0.0.1:8080",
    api_key=os.environ["MONGODB_SIDECAR_API_KEY"],
    mongodb_database="<database-name>",
    mongodb_collection="<collection-name>",
    mongodb_text_field="<text-field>",
    mongodb_embedding_field="<vector-field>",
    litellm_embedding_model="<provider>/<embedding-model>",
    max_num_results=3,
)

print(response)
```

對於非同步用法，請以相同參數呼叫 `await litellm.vector_stores.asearch(...)`。在直接 SDK 呼叫中，使用提供者的 embedding 模型名稱。在 proxy 上，使用已註冊的 embedding 模型名稱。

## 設定參考 {#settings-reference}

請將這些值放在已註冊 store 的 `litellm_params` 中，或在直接 SDK 搜尋中作為關鍵字引數傳入。

| 設定 | 必要 | 說明 |
|---|---|---|
| `vector_store_id` | 是 | MongoDB Vector Search 索引的確切名稱。 |
| `custom_llm_provider` | 是 | 設為 `mongodb`。 |
| `api_base` | 是 | Sidecar 的 HTTPS origin 或反向代理路徑前綴。僅對字面上的 loopback IP 支援 HTTP。請勿附加 `/v1`。 |
| `api_key` | 是 | Sidecar bearer 金鑰。也可透過 LiteLLM 環境中的 `MONGODB_SIDECAR_API_KEY` 提供。 |
| `mongodb_database` | 是 | 包含該集合的資料庫。即使 URI 中包含資料庫名稱也仍為必填。 |
| `mongodb_collection` | 是 | 包含文件與向量的集合。 |
| `litellm_embedding_model` | 是 | 用於嵌入查詢的模型。必須與儲存向量所使用的模型相符。 |
| `mongodb_embedding_field` | 否 | 由索引涵蓋的向量欄位。預設為 `embedding`。 |
| `mongodb_text_field` | 否 | 包含可讀文字的欄位。預設為 `text`；支援例如 `metadata.body` 的 dotted path。 |
| `mongodb_num_candidates` | 否 | 在回傳前考慮的候選數量。預設為 `max(100, 10 * max_num_results)`。明確值至少必須為 `max_num_results`，最多為 `10000`。較高的值可提升召回率，但會增加延遲。 |
| `litellm_embedding_config` | 否 | 額外的 embedding 呼叫引數，例如 `dimensions`、`api_key` 或 `api_base`。在 proxy 上，盡可能在 embedding 模型 deployment 上設定這些值。 |

搜尋 `query` 必須非空，且長度不得超過 32,000 個字元。字串清單會以空格串接後，作為單一查詢嵌入。

## 疑難排解 {#troubleshooting}

| 症狀 | 檢查項目 |
|---|---|
| 舊版設定要求 `pymongo` 或 `mongodb_connection_string` | 使用包含 BETA sidecar adapter 的 LiteLLM 版本、部署 sidecar，並設定 `api_base` 和 `api_key`。 |
| HTTP 401: sidecar 驗證失敗 | 將 LiteLLM 的 `api_key` 與 sidecar 的 `MONGODB_SIDECAR_API_KEY` 一致。這與您的 MongoDB 密碼和 LiteLLM client key 無關。 |
| HTTP 400: 缺少索引或索引不可查詢 | 檢查正確的資料庫、collection 和 index 名稱。等待索引變為 READY 並可查詢。 |
| HTTP 400: 維度不符或向量欄位未建立索引 | 將查詢嵌入模型和維度與您的文件一致，並將 `mongodb_embedding_field` 與索引的 `path` 一致。 |
| HTTP 400: 匹配的文件都沒有 text 欄位 | 將 `mongodb_text_field` 設為包含可讀文字的欄位，包括巢狀欄位時的點號路徑。 |
| HTTP 400: 憑證遭拒 | 檢查 sidecar 的 URI 憑證、authentication database，以及 database user 的權限。 |
| Atlas 回報 `bad auth : authentication failed`（code `8000`） | 驗證已儲存連線字串中的 database user 密碼與叢集。這是在索引搜尋前發生的驗證失敗。database user 與您的 Atlas 網站登入分開；請參閱 [Atlas 連線疑難排解](https://www.mongodb.com/docs/atlas/troubleshoot-connection/#authentication-to-the-cluster-failed)。 |
| sidecar 啟動失敗：URI 無效或缺少 secret | 檢查 sidecar 環境與 secret-file 掛載。對 URI 憑證中的特殊字元進行百分比編碼；例如，`p@ss/word` 會變成 `p%40ss%2Fword`。 |
| 無法讀取 TLS 檔案 | 確保 `tlsCAFile` 和 `tlsCertificateKeyFile` 指向 sidecar process 可讀取的檔案。在容器中，請使用 sidecar 容器內的路徑。 |
| HTTP 408: 部署或查詢逾時 | 檢查主機名稱解析與連線。若在 Atlas 上，請檢查 IP access list 與叢集是否已暫停。若在自行管理的部署上，請檢查主機、連接埠與防火牆。 |
| HTTP 503: 連線中斷或遭拒 | 檢查 sidecar 是否正在執行且其 URL 可連線，然後檢查 MongoDB 連線性與 TLS 設定。在節點重新啟動或 replica set failover 後重試。 |
| 在註冊第一個 store 後，chat 回傳 `Invalid value: 'file_search'` | 在重試前，等待資料庫同步或重新啟動 proxy 以載入註冊。確認 `vector_store_ids` 包含已註冊的 index ID。 |

逾時與連線中斷會回傳可重試錯誤（`408` 和 `503`）。連線恢復後，搜尋可以在不重新啟動 LiteLLM 的情況下繼續。

## BETA 限制 {#beta-limitations}

- **僅限搜尋：** 在 LiteLLM 外部建立 collection 和 index、產生文件嵌入，並匯入文件。MongoDB 不支援 LiteLLM 的 vector store 建立、檔案管理或 `/rag/ingest` APIs。
- **不支援搜尋篩選或查詢重寫：** `filters`、`ranking_options` 和 `rewrite_query` 會被拒絕，包括 `rewrite_query: false`。也不支援並會拒絕提供者特定的 `mongodb_filter`。
- **不會透過 MongoDB 自動嵌入：** 設定 `litellm_embedding_model`；不會使用 MongoDB 的自動嵌入整合。
- **第一次註冊可能需要一段時間才會反映到 chat 請求：** 當執行中的 proxy 尚未有 vector store registry 時，第一次 UI 或 API 註冊需要資料庫同步或重新啟動，之後 `file_search` 才能在 chat completions 中運作。
