# 向量儲存庫 - 總覽 {#vector-stores---overview}

LiteLLM 有三種不同的方式可與向量儲存庫搭配運作。它們是彼此獨立的 API，且各自有不同的端點，了解您需要哪一種可省去很多混淆：

1. **LiteLLM 代管向量儲存庫**：您已在提供者上有一個向量儲存庫（例如 Bedrock Knowledge Base、Vertex AI Search datastore、Azure AI Search index，...）。您只要在 LiteLLM 註冊一次，LiteLLM 就會儲存提供者、憑證和 id 對應。之後代理伺服器上的每個金鑰都能透過一個相容 OpenAI 的端點查詢它，或將其附加到 `/chat/completions` 和 `/v1/responses` 請求以進行 RAG。註冊可在 `config.yaml`、透過 [管理 API](./managed_vector_stores.md)（`POST /vector_store/new`），或在管理員 UI 中完成。

2. **相容 OpenAI 的向量儲存庫 API**：透過 LiteLLM 使用 OpenAI API 形式，在提供者本身上建立並管理向量儲存庫。`POST /v1/vector_stores` 會在上游建立新的儲存庫，`/v1/vector_stores/{id}/files` 會管理其檔案，而 `/rag/ingest` 會將上傳、分塊、嵌入與建立儲存庫包裝成一次呼叫。

3. **透傳提供者 API**：透過代理伺服器呼叫提供者的原生 API（原生請求與回應格式），例如 `/vertex_ai/discovery/...` 或 `/bedrock/knowledgebases/...`。當您需要統一 API 未公開的提供者功能時，請使用此方式。

:::info[術語]
LiteLLM 中的 **代管向量儲存庫** 是一種*註冊*，不是新的儲存庫：LiteLLM 會儲存儲存庫位於哪個提供者，以及如何向其驗證，因此請求可以透過 id 來參照它。提供者端不會建立任何新內容。較舊的文件會將此概念稱為「知識庫」；兩者是相同的東西。
:::

## 我需要哪個端點？ {#which-endpoint-do-i-need}

| 您想要 | 使用 | 文件 |
|---|---|---|
| 透過單一統一 API 查詢現有的提供者儲存庫 | 先註冊，然後 `POST /v1/vector_stores/{id}/search` | [代管向量儲存庫](./managed_vector_stores.md) |
| 在 `/chat/completions` 中為模型提供 RAG 內容 | 搭配已註冊的儲存庫使用 `tools: [{"type": "file_search", "vector_store_ids": [...]}]` | [搭配 Chat Completions 使用向量儲存庫](../completion/knowledgebase.md) |
| 在 `/v1/responses` 上使用 `file_search` | 已註冊的儲存庫 + `file_search` 工具 | [File Search 教學](../tutorials/file_search_responses_api.md) |
| 在提供者上建立全新的儲存庫 | `POST /v1/vector_stores` | [建立](./create.md) |
| 一次上傳、分塊、嵌入並儲存文件 | `POST /rag/ingest` | [RAG 擷取](../rag_ingest.md) |
| 一次完成搜尋加重排序加完成 | `POST /rag/query` | [RAG 查詢](../rag_query.md) |
| 管理儲存庫內的檔案 | `/v1/vector_stores/{id}/files` | [檔案](../vector_store_files.md) |
| 直接呼叫提供者的原生 API | 透傳路由 | [Vertex AI Search](../pass_through/vertex_ai_search_datastores.md)、[Azure AI（透傳）](../providers/azure_ai/azure_ai_vector_stores_passthrough.md) |

請注意兩個名稱相似的建立端點。`POST /v1/vector_stores`（複數）會在提供者上建立新的儲存庫。`POST /vector_store/new`（單數）則會在 LiteLLM 中註冊一個**既有**的儲存庫。完整的管理 API 請參見 [代管向量儲存庫](./managed_vector_stores.md)。

## 提供者支援 {#provider-support}

統一端點的支援情況會因提供者而異。`Search` 為 `POST /v1/vector_stores/{id}/search`；`Create` 為 `POST /v1/vector_stores`。

| 提供者 (`custom_llm_provider`) | 搜尋 | 建立 | 備註 |
|---|---|---|---|
| `openai` | 是 | 是 | 也支援 [files API](../vector_store_files.md) |
| `azure`（Azure OpenAI） | 是 | 是 | |
| `bedrock`（Knowledge Bases） | 是 | 否 | [設定](../providers/bedrock_vector_store.md) |
| `vertex_ai`（RAG Engine） | 是 | 是 | |
| `vertex_ai/search_api`（Vertex AI Search） | 是 | 否 | 將 datastore 註冊為 [代管向量儲存庫](./managed_vector_stores.md) |
| `azure_ai`（Azure AI Search） | 是 | 否 | [設定](../providers/azure_ai_vector_stores.md) |
| `gemini`（File Search） | 是 | 是 | [設定](../providers/gemini_file_search.md) |
| `milvus` | 是 | 否 | 搜尋既有 collection，[設定](../providers/milvus_vector_stores.md) |
| `mongodb`（BETA） | 是 | 否 | 搜尋 Atlas 或自我管理部署上的既有 MongoDB Vector Search 索引。[設定](../providers/mongodb_vector_stores.md)、[chat completions](../providers/mongodb_vector_stores.md#use-mongodb-in-chat-completions)、[完整範例](../tutorials/mongodb_vector_search.md) |
| `pg_vector` | 是 | 是 | 需要 [litellm-pgvector](../completion/knowledgebase.md) 連接器 |
| `s3_vectors` | 是 | 否 | 透過 [/rag/ingest](../rag_ingest.md) 建立，[設定](../providers/s3_vectors.md) |
| `valkey` | 是 | 否 | 搜尋既有 valkey-search 索引，[設定](../providers/valkey_vector_stores.md) |
| `ragflow` | 否 | 是 | 僅限資料集管理，[設定](../providers/ragflow_vector_store.md) |

Retrieve、list、update 和 delete（`GET`/`POST`/`DELETE /v1/vector_stores/{id}`）會原封不動地轉送 OpenAI 的請求形式，因此請將它們與公開 OpenAI 形式向量儲存庫 API 的提供者（OpenAI、Azure OpenAI）一起使用。路由細節請參見 [建立](./create.md#vector-store-management-and-routing-on-the-proxy)。
