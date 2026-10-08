import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# AWS S3 Vectors {#aws-s3-vectors}

使用 [Amazon S3 Vectors](https://aws.amazon.com/s3/features/vectors/) 作為 LiteLLM 統一向量儲存與 RAG 端點背後的向量儲存。LiteLLM 直接以 SigV4 簽署的請求呼叫 S3 Vectors REST API；向量操作本身不需要 boto3 用戶端。

| Property | Details |
|----------|---------|
| LiteLLM 上的提供者路由 | `s3_vectors` |
| 支援的端點 | `POST /v1/vector_stores/{id}/search`、`POST /rag/ingest`、`POST /rag/query`、`file_search`，適用於 `/chat/completions` 與 `/v1/responses` |
| 不支援 | `POST /v1/vector_stores`（OpenAI 形狀的 create）。請使用 `/rag/ingest`，其會自動建立向量 bucket 與 index |
| 向量儲存 id 格式 | `<vector_bucket_name>:<index_name>` |
| 提供者文件 | [Amazon S3 Vectors ↗](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors.html) |

## 運作方式 {#how-it-works}

`/rag/ingest` 會接收文件、切分文件片段、使用任何 LiteLLM embedding 模型產生 embeddings，然後將向量寫入 S3 向量 bucket（`PutVectors`）中的 index。若 bucket 與 index 不存在，會自動建立。其結果儲存會在其他地方以 `bucket_name:index_name` 表示：`/v1/vector_stores/{id}/search` 會使用已設定的 embedding 模型為您的查詢產生 embeddings，並針對該 index 執行 `QueryVectors`，而同一個 id 也可在 `file_search` 工具中於 `/chat/completions` 和 `/v1/responses` 使用。

在 proxy 上，成功的 ingest 也會在 LiteLLM 資料庫中註冊該儲存（請見下方的[追蹤與存取控制](#how-ingested-files-are-tracked)），因此它會顯示在 Admin UI 中，並且可依 id 搜尋，而不需要任何逐請求的 AWS 設定。

## 快速開始 {#quick-start}

### 1. 設定 config.yaml {#1-setup-configyaml}

您需要一個 embedding 模型用於 ingest 與搜尋。AWS 憑證來自環境（或任何其他支援的方法，請參見[憑證](#credentials)）。

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY
```

```bash showLineNumbers title="Environment"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION_NAME="us-west-2"

litellm --config config.yaml
```

### 2. Ingest 文件 {#2-ingest-a-document}

在 `vector_store` 區塊中傳入 `custom_llm_provider: "s3_vectors"`。此處設定 `aws_region_name` 與 `embedding_model` 很重要：`vector_store` 區塊中的每個鍵都會持久化到該儲存的註冊資訊，因此之後針對已註冊儲存的搜尋會自動重用它們。

```bash showLineNumbers title="Ingest into S3 Vectors"
curl -X POST "http://localhost:4000/v1/rag/ingest" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"file\": {
            \"filename\": \"document.txt\",
            \"content\": \"$(base64 -i document.txt)\",
            \"content_type\": \"text/plain\"
        },
        \"ingest_options\": {
            \"embedding\": {\"model\": \"text-embedding-3-small\"},
            \"vector_store\": {
                \"custom_llm_provider\": \"s3_vectors\",
                \"vector_bucket_name\": \"my-embeddings\",
                \"aws_region_name\": \"us-west-2\",
                \"embedding_model\": \"text-embedding-3-small\"
            }
        }
    }"
```

```json title="Response"
{
  "id": "ingest_abc123",
  "status": "completed",
  "vector_store_id": "my-embeddings:litellm-index-a1b2c3d4",
  "file_id": "document.txt"
}
```

當未指定 `index_name` 時，LiteLLM 會產生一個（`litellm-index-<id>`）。傳入明確的 `index_name` 可讓您在多次請求間持續 ingest 到同一個 index。完整的 ingest 選項清單請見 [RAG Ingest 參考](../rag_ingest.md#vector_store-aws-s3-vectors)。

:::warning[保持 embedding 模型一致]
index 維度會在建立時根據 ingest 的 embedding 模型固定（自動偵測，例如 `text-embedding-3-small` 為 1536）。搜尋時必須使用相同維度的模型為查詢產生 embeddings。請在 `vector_store` 區塊中（如上所示）或在註冊項目上設定 `embedding_model`；如果任何地方都未設定，搜尋會退回到 `text-embedding-3-small`。
:::

### 3. 搜尋儲存 {#3-search-the-store}

```bash showLineNumbers title="Search"
curl -X POST "http://localhost:4000/v1/vector_stores/my-embeddings:litellm-index-a1b2c3d4/search" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query": "What does the document say about pricing?", "max_num_results": 5}'
```

```json title="Response"
{
  "object": "vector_store.search_results.page",
  "search_query": "What does the document say about pricing?",
  "data": [
    {
      "score": 0.87,
      "content": [{"text": "Pricing is based on ...", "type": "text"}],
      "file_id": "s3-vectors-chunk-0",
      "filename": "document.txt",
      "attributes": {"source_text": "Pricing is based on ...", "chunk_index": "0", "filename": "document.txt"}
    }
  ]
}
```

`max_num_results` 對應到 S3 Vectors `topK`（預設 5）。結果會從 LiteLLM 在 ingest 時寫入的 `source_text` 中繼資料鍵讀取；由其他工具寫入 index、但沒有該鍵的向量會被略過。

### 4. 在 chat completions 中將其用於 RAG {#4-use-it-for-rag-in-chat-completions}

```bash showLineNumbers title="file_search tool"
curl -X POST "http://localhost:4000/v1/chat/completions" \
    -H "Authorization: Bearer $LITELLM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "{{openai_large}}",
        "messages": [{"role": "user", "content": "Summarize our pricing policy"}],
        "tools": [{"type": "file_search", "vector_store_ids": ["my-embeddings:litellm-index-a1b2c3d4"]}]
    }'
```

`/rag/query`（一次呼叫完成搜尋加回應）可使用相同的儲存 id，請參見 [RAG Query](../rag_query.md)。

## 註冊既有 index {#register-an-existing-index}

如果向量 bucket 與 index 已經存在（由先前的 ingest、其他工具或 Terraform 建立），請在 [向量儲存登錄](../vector_stores/managed_vector_stores.md) 中註冊它們，這樣 proxy 上的每個金鑰都可以搜尋它們：

```yaml showLineNumbers title="config.yaml"
vector_store_registry:
  - vector_store_name: "product-docs"
    litellm_params:
      vector_store_id: "my-embeddings:my-index"
      custom_llm_provider: "s3_vectors"
      aws_region_name: "us-west-2"
      embedding_model: "text-embedding-3-small"
```

`aws_region_name` 是搜尋所必需的。`embedding_model` 應與建立該 index 時使用的模型相符。除了 `bucket:index` id 之外，您也可以在 `litellm_params` 中設定 `vector_bucket_name`，並使用純 index 名稱作為 `vector_store_id`。一旦註冊，指定該儲存 id 的 `/rag/ingest` 請求也會落到該 index 中，並從註冊資訊而非請求取得提供者、區域、憑證與 embedding 模型。

## 設定參考 {#configuration-reference}

搜尋端 `litellm_params`（登錄項目，或從 ingest 自動持久化）：

| 參數 | 必填 | 說明 |
|-----------|----------|-------------|
| `custom_llm_provider` | 是 | `"s3_vectors"` |
| `vector_store_id` | 是 | `bucket:index`，若設定了 `vector_bucket_name` 則可為純 index 名稱 |
| `aws_region_name` | 是 | 向量 bucket 的區域 |
| `embedding_model` | 否 | 用於為搜尋請求產生 embeddings 的模型。預設 `text-embedding-3-small` |
| `vector_bucket_name` | 否 | 讓 `vector_store_id` 可為裸 index 名稱 |
| `aws_access_key_id`、`aws_secret_access_key`、`aws_session_token`、`aws_role_name`、`aws_session_name`、`aws_profile_name`、`aws_web_identity_token` | 否 | 明確的 AWS 憑證，請參見[憑證](#credentials) |
| `litellm_credential_name` | 否 | 從 `credential_list` 參照已命名的憑證 |

Ingest 端選項（`ingest_options` 的 `vector_store` 區塊）記載於 [RAG Ingest 參考](../rag_ingest.md#vector_store-aws-s3-vectors)：`vector_store_id`（現有 index 作為 `bucket:index`，或在設定了 `vector_bucket_name` 時使用純 index 名稱）、`vector_bucket_name`（除非 `vector_store_id` 帶有 bucket，否則必填）、`index_name`、`dimension`、`distance_metric`（`cosine`、預設值，或 `euclidean`）、`non_filterable_metadata_keys`（預設 `["source_text"]`），以及相同的 AWS 憑證參數。

## 區域、端點與加密 {#region-endpoint-and-encryption}

LiteLLM 一律呼叫區域性的 S3 Vectors 端點 `https://s3vectors.<aws_region_name>.api.aws`。此提供者沒有 `api_base` 覆寫。對於 ingest，區域會先從請求中的 `aws_region_name` 解析，接著是 `AWS_REGION_NAME` 與 `AWS_REGION` 環境變數，最後退回到 `us-west-2`。對於搜尋，`aws_region_name` 必須存在於註冊項目或持久化的 ingest 參數中。

自動建立的向量 bucket 使用 S3 Vectors 預設的伺服器端加密（SSE-S3）。LiteLLM 不會在 `CreateVectorBucket` 上傳入加密設定，因此若要使用 SSE-KMS，請自行以您的 KMS key 建立向量 bucket，並讓 LiteLLM 指向它；存在性檢查會看到該 bucket 並略過建立。bucket 名稱遵循 S3 規則：至少 3 個字元，且僅可使用小寫字母、數字、連字號與句點。

## 憑證 {#credentials}

驗證會重用 LiteLLM 的標準 AWS 憑證解析（與 Bedrock 相同的 `BaseAWSLLM` 鏈）。順序如下：註冊項目或 ingest 請求上的明確 `aws_*` 參數、透過 `litellm_credential_name` 的已命名憑證、環境變數（`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`）、`aws_profile_name`、透過 `aws_role_name` 與 `aws_session_name` 的 STS 角色假設、web identity token（EKS 上的 IRSA），最後是預設的 boto3 鏈（instance profile、ECS task role）。各方法的詳細資訊請參見 [Bedrock 驗證](./bedrock.md#boto3---authentication)。

### IAM 權限 {#iam-permissions}

| 動作 | 需要用於 |
|--------|-----------|
| `s3vectors:QueryVectors` | 搜尋、`/rag/query`、`file_search` |
| `s3vectors:PutVectors` | `/rag/ingest` |
| `s3vectors:GetVectorBucket` | `/rag/ingest` 存在性檢查 |
| `s3vectors:CreateVectorBucket` | `/rag/ingest` 自動建立 |
| `s3vectors:GetIndex` | `/rag/ingest` 存在性檢查 |
| `s3vectors:CreateIndex` | `/rag/ingest` 自動建立 |

若已預先建立 bucket 與 index，最小化 ingest 政策為 `GetVectorBucket`、`GetIndex` 和 `PutVectors`；僅限搜尋的憑證只需要 `QueryVectors`。閘道也需要嵌入模型所需的任何憑證（上方快速入門中的 OpenAI 金鑰，或 `bedrock/amazon.titan-embed-text-v2:0` 以維持在 AWS 內部）。

## 匯入的檔案如何被追蹤 {#how-ingested-files-are-tracked}

在連接資料庫的閘道上，`/rag/ingest` 會將新的儲存區儲存到 `LiteLLM_ManagedVectorStoresTable`，並帶有呼叫金鑰的 `team_id` 與 `user_id`，將其加入記憶體中的登錄，並在儲存區的 `ingested_files` 中繼資料中記錄每個已匯入的檔案（檔名或 URL、時間戳記）。再次匯入到相同的 bucket 與 index 時，會附加到該檔案清單，而不是建立新的項目。之後該儲存區會出現在 Admin UI 的 Vector Stores 下方，且存取遵循標準的 [vector store 權限模型](../vector_stores/managed_vector_stores.md)：在金鑰或團隊上設定 `object_permission.vector_stores`，以控制其請求可參照哪些儲存區 id。

原始檔案位元組不會儲存在 S3 或 LiteLLM 資料庫中；只會保留分塊文字（在向量中繼資料中作為 `source_text`）與檔案中繼資料。

## 是否有「預設 vector store」設定？ {#is-there-a-default-vector-store-setting}

沒有。LiteLLM 目前沒有整個代理程式共用的預設 vector store 提供者。當 `/rag/ingest` 的 `custom_llm_provider: "openai"` 區塊省略提供者時，預設會使用 `vector_store`，因此任何應該寫入 S3 Vectors 的匯入請求都必須明確傳入 `custom_llm_provider: "s3_vectors"`，除非其 `vector_store_id` 指定了登錄或資料庫中的某個儲存區：此時提供者、區域、憑證與嵌入模型都來自該註冊，請求只需要 id。匯入之後，其他任何地方都不需要再選擇提供者：搜尋、`/rag/query` 與 `file_search` 都透過 id 來存取該儲存區，而持久化的註冊則保留提供者與 AWS 設定。

## S3 可以作為 /v1/files 的預設儲存嗎？ {#can-s3-be-the-default-storage-for-v1files}

目前還不行。`/v1/files` 上傳會送往目標 LLM 提供者（OpenAI、Azure、Bedrock、Vertex），而 `target_storage` 上傳參數唯一的替代儲存後端是 `azure_storage`（Azure Blob Storage）；沒有 S3 儲存後端。確實存在兩條與 S3 相鄰的路徑：為 [Bedrock batches](./bedrock_batches.md) 上傳的檔案會透過模型的 `s3_bucket_name` 參數暫存到您的 S3 bucket 中；而在本頁的 RAG 流程中，根本不需要檔案儲存，因為 `/rag/ingest` 可直接接受內嵌檔案（multipart 或 base64）、作為 `file_url`，或作為現有的提供者 `file_id`。

## 驗證 {#validation}

完成匯入後，請端到端確認流程：匯入回應包含 `"status": "completed"` 與 `vector_store_id`；對該 id 的搜尋會在 `data[].content` 中回傳您的文件文字；Admin UI 會在 Vector Stores 下方列出該儲存區；而在 AWS 主控台中，向量 bucket 與 index 會出現在設定區域內的 Amazon S3 > Vector buckets 下方。若搜尋回傳空的 `data` 陣列，請檢查查詢嵌入模型是否與匯入模型一致（S3 Vectors 會拒絕維度不符），以及向量是否帶有 `source_text` 中繼資料。
