---
title: "透過 LiteLLM 使用 Amazon OpenSearch 向量儲存庫"
sidebar_label: "Amazon OpenSearch - 向量儲存庫"
description: "透過 LiteLLM 的向量儲存庫 API 搜尋 Amazon OpenSearch Serverless 集合與 OpenSearch Service 網域，支援篩選條件、混合搜尋，以及依金鑰區分的索引 pass-through。"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Amazon OpenSearch - 向量儲存庫 {#amazon-opensearch---vector-store}

透過 LiteLLM 統一的向量儲存庫 API，搜尋 [Amazon OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html) 集合與 [Amazon OpenSearch Service](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html) 網域中的 k-NN 索引。之後任何虛擬金鑰都能對索引執行檢索，而無需持有 AWS 憑證，因為 LiteLLM 會使用您在儲存庫上註冊的身分，以 AWS SigV4 簽署每一個 OpenSearch 請求。

每次搜尋會使用您註冊的模型將查詢轉為向量，對您的索引執行 [k-NN 查詢](https://docs.opensearch.org/latest/query-dsl/specialized/k-nn/)，並回傳與其他提供者相同的 OpenAI 格式結果。除了搜尋之外，管理員還可以透過 [`/opensearch` pass-through](#pass-through-with-per-key-index-permissions) 將索引開放給開發人員使用，並依金鑰或團隊設定讀取與寫入權限。

向量儲存庫搜尋於 <SinceVersion v="1.109.0" /> 提供。[篩選條件](#filters)、[混合搜尋](#hybrid-search)與 [pass-through](#pass-through-with-per-key-index-permissions)於 <SinceVersion v="1.111.0" /> 提供。

## 快速入門 {#quick-start}

您需要三樣東西：
1. 一個 OpenSearch Serverless 向量搜尋集合或一個 OpenSearch Service 網域，其中已有您文件的 k-NN 索引
2. 一個 LiteLLM 可用來簽署的身分，且該身分獲准讀取該索引
3. 一個嵌入模型（也就是將您的文件轉為向量的那個模型）

## 1. 建立 k-NN 索引 {#1-create-the-k-nn-index}

LiteLLM 搜尋的是您已有的索引。它不會建立索引或上傳文件。每份文件需要一個文字欄位（預設為 `text`）與一個 `knn_vector` 欄位（預設為 `embedding`），其他任何頂層字串、數字或布林欄位都會出現在結果的 `attributes` 中。

```json showLineNumbers title="PUT /support-docs"
{
  "settings": {"index": {"knn": true}},
  "mappings": {
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {"name": "hnsw", "engine": "faiss", "space_type": "l2"}
      },
      "text": {"type": "text"},
      "filename": {"type": "keyword"},
      "category": {"type": "keyword"},
      "year": {"type": "integer"}
    }
  }
}
```

`dimension` 必須等於您嵌入模型的維度（`text-embedding-3-small` 為 1536），且文件必須使用您在 LiteLLM 註冊的同一個模型來嵌入。如果您打算使用[篩選條件](#filters)，請使用 Faiss 引擎（OpenSearch 2.9 或更新版本）或 Lucene 引擎（OpenSearch 2.4 或更新版本），因為 nmslib 索引無法在 k-NN 查詢內篩選。

## 2. 讓 LiteLLM 的 AWS 身分讀取索引 {#2-let-litellms-aws-identity-read-the-index}

LiteLLM 會使用儲存在儲存庫上設定的 AWS 身分來簽署請求：存取金鑰、要擔任的 IAM 角色、具名設定檔，或者，如果以上皆未設定，則使用 LiteLLM 執行所在機器的預設 AWS 憑證鏈（環境變數、EKS Pod 身分、IRSA 或執行個體設定檔）。要簽署的服務由端點決定，因此 Serverless 集合簽署為 `aoss`，網域則簽署為 `es`。

<Tabs>
<TabItem value="serverless" label="OpenSearch Serverless">

該身分需要在其 IAM 政策中具備 `aoss:APIAccessAll`，且集合的[資料存取政策](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-data-access.html)必須授予它索引權限。搜尋需要 `aoss:ReadDocument`。[篩選條件](#filters)還需要 `aoss:DescribeIndex`，因為 LiteLLM 會在執行篩選搜尋前讀取索引對應。[pass-through](#pass-through-with-per-key-index-permissions)寫入時需要 `aoss:WriteDocument`。

```json showLineNumbers title="Data access policy"
[
  {
    "Rules": [
      {
        "ResourceType": "index",
        "Resource": ["index/my-collection/support-docs"],
        "Permission": ["aoss:ReadDocument", "aoss:DescribeIndex"]
      }
    ],
    "Principal": ["arn:aws:iam::123456789012:role/litellm-opensearch"]
  }
]
```

</TabItem>
<TabItem value="domain" label="OpenSearch Service domain">

網域的存取政策，或其細粒度存取控制角色對應，必須允許該身分。搜尋會傳送 `POST /<index>/_search`，因此需要 `es:ESHttpPost`。[篩選條件](#filters)還需要 `es:ESHttpGet` 來讀取索引對應。[pass-through](#pass-through-with-per-key-index-permissions)讀取時還需要 `es:ESHttpGet` 與 `es:ESHttpHead`，寫入時需要 `es:ESHttpPut` 與 `es:ESHttpDelete`。

```json showLineNumbers title="Domain access policy"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::123456789012:role/litellm-opensearch"},
      "Action": ["es:ESHttpPost", "es:ESHttpGet"],
      "Resource": "arn:aws:es:us-east-1:123456789012:domain/my-domain/support-docs/*"
    }
  ]
}
```

</TabItem>
</Tabs>

## 3. 在 LiteLLM 註冊索引 {#3-register-the-index-with-litellm}

註冊會告訴 LiteLLM 索引的位置、要如何簽署，以及要用哪個模型來嵌入查詢。它不會在 OpenSearch 中建立任何東西。請先在**模型**下方新增嵌入模型。

`api_base` 是集合或網域端點，路徑中不含索引。LiteLLM 接受 AWS 發出的各種端點形式：

| 端點 | `api_base` 範例 | 簽署對象 |
|---|---|---|
| Serverless 集合 | `https://abc123.us-east-1.aoss.amazonaws.com` | `aoss` |
| Serverless 集合，雙堆疊 | `https://abc123.aoss.us-east-1.on.aws` | `aoss` |
| Serverless 集合，FIPS | `https://abc123.us-east-1.aoss-fips.amazonaws.com` | `aoss` |
| 網域 | `https://search-my-domain-abc123.us-east-1.es.amazonaws.com` | `es` |
| 網域，雙堆疊 | `https://search-my-domain-abc123.aos.us-east-1.on.aws` | `es` |
| VPC 端點或自訂網域 | `https://search.example.com` | `es` |

簽署區域取自端點。如果是 VPC 端點或自訂網域這類不帶區域的端點，請設定 `aws_region_name`，否則 LiteLLM 會依序改用 `AWS_REGION`、再改用 `AWS_REGION_NAME`、最後改用 `us-west-2`。Serverless 的每帳戶端點（`https://123456789012.aoss.us-east-1.on.aws`）會回應 400，因此請改用集合端點。

<Tabs>
<TabItem value="ui" label="管理介面">

開啟**工具 > 向量儲存庫**，前往**管理向量儲存庫**分頁，然後按一下 **+ 新增向量儲存庫**。將提供者選為 **Amazon OpenSearch**。

輸入**向量儲存庫 ID**、**OpenSearch 端點**，以及產生索引中向量的**嵌入模型**。當 OpenSearch 索引名稱與向量儲存庫 ID 不同時，請設定**索引名稱**；當您的文件未使用 `embedding` 與 `text` 時，請設定**向量欄位名稱**與**文字欄位**。除非端點是 VPC 端點或自訂網域，否則請將 **AWS 區域**留空。在**現有憑證**下方，選擇已儲存的 AWS 憑證，或留空以使用 LiteLLM 執行時的身分。

建立儲存庫不會測試連線。端點、索引或權限有誤時，要到第一次搜尋才會發現，因此請立即從**測試向量儲存庫**分頁執行一次搜尋。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

vector_store_registry:
  - vector_store_name: support-docs
    litellm_params:
      vector_store_id: support-docs
      custom_llm_provider: opensearch
      api_base: https://abc123.us-east-1.aoss.amazonaws.com
      opensearch_index_name: support-docs
      litellm_embedding_model: text-embedding-3-small
      aws_role_name: arn:aws:iam::123456789012:role/litellm-opensearch
      aws_session_name: litellm-opensearch
```

```bash
litellm --config /path/to/config.yaml
```

請移除 `aws_*` 這些行，改用 LiteLLM 執行時的身分來簽署，例如 EKS Pod 身分。

</TabItem>
<TabItem value="api" label="管理 API">

```bash showLineNumbers title="Register the index"
curl -X POST 'http://localhost:4000/vector_store/new' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "vector_store_id": "support-docs",
    "custom_llm_provider": "opensearch",
    "vector_store_name": "support-docs",
    "litellm_params": {
      "api_base": "https://abc123.us-east-1.aoss.amazonaws.com",
      "opensearch_index_name": "support-docs",
      "litellm_embedding_model": "text-embedding-3-small"
    }
  }'
```

儲存庫會寫入 LiteLLM 資料庫，並可立即搜尋，無需重新啟動。管理 API 的其餘部分請參閱[受管理的向量儲存庫](../vector_stores/managed_vector_stores.md)。

</TabItem>
</Tabs>

## 4. 搜尋儲存庫 {#4-search-the-store}

```bash showLineNumbers title="Search the index"
curl -X POST 'http://localhost:4000/v1/vector_stores/support-docs/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "How many days a year am I allowed to work from another country, and which form do I file?", "max_num_results": 3}'
```

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "How many days a year am I allowed to work from another country, and which form do I file?",
  "data": [
    {
      "score": 0.58097684,
      "content": [
        {
          "type": "text",
          "text": "Remote work abroad policy (HR-112, revision 7): Employees may work from a country other than their home country for at most 37 calendar days per year. Requests must be filed in the Wanderdesk form at least 14 days before travel and approved by both the direct manager and the People Ops team. Days spent in transit count toward the limit."
        }
      ],
      "file_id": "1%3A0%3A1bpUh6EBHM3B89oa2RE2",
      "filename": "hr-remote-work-policy.md",
      "attributes": {"filename": "hr-remote-work-policy.md", "category": "hr"}
    },
    {
      "score": 0.42477226,
      "content": [
        {
          "type": "text",
          "text": "Office access policy (FAC-017): The office is open from 07:00 to 21:00 on weekdays. Weekend access requires a badge exception filed 48 hours in advance. Guests must be registered at the front desk kiosk and escorted at all times."
        }
      ],
      "file_id": "1%3A0%3A1rpUh6EBHM3B89oa2RE3",
      "filename": "facilities-office-access.md",
      "attributes": {"filename": "facilities-office-access.md", "category": "facilities"}
    },
    {
      "score": 0.41095334,
      "content": [
        {
          "type": "text",
          "text": "Travel expense policy (FIN-204): Hotel stays are reimbursed up to 240 USD per night in tier-1 cities and 165 USD elsewhere. Receipts must be uploaded to the Ledgerline portal within 30 days of the trip ending, and late receipts are reimbursed only with VP approval."
        }
      ],
      "file_id": "1%3A0%3A17pUh6EBHM3B89oa2RE3",
      "filename": "finance-expense-policy.md",
      "attributes": {"filename": "finance-expense-policy.md", "category": "finance"}
    }
  ]
}
```

`file_id` 是文件的 `_id`，`filename` 是其 `filename` 欄位，`attributes` 則包含其他頂層字串、數字與布林欄位，不含文字與向量欄位。`score` 是 OpenSearch 的 `_score` 原值，因此分數越高越相近，但其量尺取決於索引的空間類型。`max_num_results` 預設為 10，且必須介於 1 到 50 之間。

若從 SDK 使用，請改為內嵌傳入儲存庫設定，而非註冊儲存庫：

```python showLineNumbers title="Search from the Python SDK"
import litellm

response = litellm.vector_stores.search(
    vector_store_id="support-docs",
    query="How many days a year am I allowed to work from another country?",
    custom_llm_provider="opensearch",
    api_base="https://abc123.us-east-1.aoss.amazonaws.com",
    litellm_embedding_model="openai/text-embedding-3-small",
    aws_role_name="arn:aws:iam::123456789012:role/litellm-opensearch",
    max_num_results=3,
)
```

`litellm.vector_stores.asearch` 是對應的非同步版本。儲存庫註冊完成後，任何接受向量儲存庫 ID 的 LiteLLM 功能都可以使用它，包括透過 `tools: [{"type": "file_search", "vector_store_ids": ["support-docs"]}]` 在 [`/chat/completions` 中使用 RAG](../completion/knowledgebase.md)。

## 篩選條件 {#filters}

<SinceVersion v="1.111.0" />

搜尋接受 OpenAI 的[屬性篩選條件](https://platform.openai.com/docs/api-reference/vector-stores/search#vector_stores_search-filters)。LiteLLM 會將 `eq` 與 `ne` 轉為 OpenSearch 的 `term` 查詢，將 `in` 與 `nin` 轉為 `terms`，將 `gt`、`gte`、`lt` 與 `lte` 轉為 `range`，將 `and` 與 `or` 轉為 `bool`，然後將結果以[高效篩選條件](https://docs.opensearch.org/latest/vector-search/filter-search-knn/efficient-knn-filtering/)的形式放入 k-NN 查詢中，因此搜尋在篩選後仍會回傳 `max_num_results` 筆結果。

```bash showLineNumbers title="Search this year's HR documents"
curl -X POST 'http://localhost:4000/v1/vector_stores/support-docs/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "How many days a year am I allowed to work from another country, and which form do I file?",
    "max_num_results": 3,
    "filters": {"type": "and", "filters": [
      {"type": "eq", "key": "category", "value": "hr"},
      {"type": "gte", "key": "year", "value": 2026}
    ]}
  }'
```

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "How many days a year am I allowed to work from another country, and which form do I file?",
  "data": [
    {
      "score": 1.6387603,
      "content": [{"type": "text", "text": "Remote work abroad policy (HR-112, revision 7): Employees may work from a country other than their home country for at most 37 calendar days per year. ..."}],
      "file_id": "1%3A0%3AI9ImyaEBTirLA3wtlZjc",
      "filename": "hr-remote-work-policy.md",
      "attributes": {"filename": "hr-remote-work-policy.md", "year": 2026, "category": "hr"}
    }
  ]
}
```

篩選條件會精確比對值，因此在每次篩選搜尋前，LiteLLM 會讀取索引對應（`GET /<index>/_mapping`）來找出可以比對的欄位。字串篩選條件需要一個不帶正規化器的 `keyword` 欄位，或文字欄位上的 `keyword` 子欄位，也就是 OpenSearch 動態對應建立的 `<field>.keyword`。LiteLLM 接著會代您查詢該子欄位。純文字欄位、對字串欄位做數字範圍比對，或 `nested` 對應內的欄位，會回應 400 並說明原因，因為在這些位置查詢會無聲地遺漏或過度比對。

讀取對應需要在 Serverless 上具備 `aoss:DescribeIndex`，或在網域上具備 `es:ESHttpGet`。若無該權限，篩選搜尋會回應 403 並指出缺少的權限。使用 nmslib 引擎的索引，或 OpenSearch 2.4 以前的版本，無法在 k-NN 查詢內篩選，會回應 400。開啟 [`drop_params`](../completion/drop_params.md) 時，這兩種情況都會改為不帶篩選條件重新搜尋，而非失敗，因此結果會以未篩選的狀態回傳。

## 混合搜尋 {#hybrid-search}

<SinceVersion v="1.111.0" />

混合搜尋會在文字欄位上執行 BM25 關鍵字 `match`，與 k-NN 查詢並列，並合併兩者的排名，因此像事件編號或產品代碼這類精確詞彙，即使其向量並非最接近，也會排在最前面。除非透過[具備正規化處理器的搜尋管線](https://docs.opensearch.org/latest/search-plugins/search-pipelines/normalization-processor/)來合併，否則 OpenSearch 回傳的混合分數會落在不同的量尺上，因此請先建立一個搜尋管線：

```json showLineNumbers title="PUT /_search/pipeline/support-docs-hybrid"
{
  "phase_results_processors": [
    {
      "normalization-processor": {
        "normalization": {"technique": "min_max"},
        "combination": {"technique": "arithmetic_mean", "parameters": {"weights": [0.3, 0.7]}}
      }
    }
  ]
}
```

權重會依查詢順序套用，先是關鍵字、再是向量。接著在儲存庫註冊時開啟混合搜尋，或在管理介面中使用**混合搜尋**與**搜尋管線**欄位：

```yaml showLineNumbers title="config.yaml"
vector_store_registry:
  - vector_store_name: support-docs
    litellm_params:
      vector_store_id: support-docs
      custom_llm_provider: opensearch
      api_base: https://abc123.us-east-1.aoss.amazonaws.com
      litellm_embedding_model: text-embedding-3-small
      opensearch_hybrid_search: true
      opensearch_search_pipeline: support-docs-hybrid
```

搜尋本身無需更改。LiteLLM 會將管線以 `search_pipeline` 查詢參數傳送，且篩選條件會同時套用到關鍵字查詢與向量查詢。設定 `opensearch_hybrid_search` 卻未設定 `opensearch_search_pipeline` 時，會回應 400，或在 `drop_params` 下執行一般的 k-NN 搜尋。儲存庫的 `opensearch_search_pipeline` 也會套用在其一般的 k-NN 搜尋上，因此您可以設定管線而不開啟混合搜尋，以套用其他搜尋處理器。

`opensearch_index_name`、`opensearch_search_pipeline` 與 `opensearch_hybrid_search` 只能來自儲存庫註冊。搜尋請求或設定其中任一項的 `/v1/rag/query` 呼叫會回應 400，因此金鑰持有者無法將搜尋指向另一個索引，或更改其排名方式。

## 依金鑰設定索引權限的 pass-through {#pass-through-with-per-key-index-permissions}

<SinceVersion v="1.111.0" />

`/opensearch` pass-through 可讓開發人員使用自己的 LiteLLM 金鑰直接呼叫索引上的 OpenSearch API，同時由 LiteLLM 檢查每個金鑰對該索引可執行的操作，並以儲存庫的 AWS 身分簽署呼叫。當應用程式需要原生 OpenSearch 查詢，或必須寫入文件時（例如載入 LiteLLM 稍後要搜尋的索引的擷取任務），請使用它。它的運作方式與 [Azure AI Search pass-through](./azure_ai/azure_ai_vector_stores_passthrough.md) 相同，且需要一個具備資料庫的 proxy。

### 1. 註冊索引 {#1-register-the-index}

請依[步驟 3](#3-register-the-index-with-litellm)註冊儲存庫，然後使用 `POST /v1/indexes` 為 OpenSearch 索引指定一個 LiteLLM 索引名稱，只有 proxy 管理員可以呼叫此端點。`index_name` 是開發人員在路徑中使用的名稱，`vector_store_index` 是真正的 OpenSearch 索引，`vector_store_name` 則是儲存庫的名稱。

```bash showLineNumbers title="Register an index"
curl -X POST 'http://localhost:4000/v1/indexes' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "index_name": "docs",
    "litellm_params": {
      "vector_store_index": "support-docs",
      "vector_store_name": "support-docs"
    }
  }'
```

儲存庫的 `vector_store_name` 必須是唯一的，否則 pass-through 會回應 400，因為它無法判斷該索引位於哪個儲存庫上。

### 2. 授權金鑰或團隊存取 {#2-grant-keys-or-teams-access}

在金鑰或團隊上設定 `allowed_vector_store_indexes`。每個項目會指定一個 LiteLLM 索引及其權限：`read`、`write`，或兩者。只有 proxy 管理員可以設定它，因為它會授與索引的存取權。

```bash showLineNumbers title="A read-only key and a read/write key"
curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"allowed_vector_store_indexes": [{"index_name": "docs", "index_permissions": ["read"]}]}'

curl -X POST 'http://localhost:4000/key/generate' \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"allowed_vector_store_indexes": [{"index_name": "docs", "index_permissions": ["read", "write"]}]}'
```

`/team/new` 與 `/team/update` 接受相同的欄位；只要金鑰或其團隊其中一方具備權限，金鑰就能通過檢查。如果儲存庫屬於某個團隊，金鑰還需要具備該儲存庫本身的存取權，就像搜尋它時一樣。

### 3. 呼叫索引 {#3-call-the-index}

請將 OpenSearch API 呼叫傳送至 `/opensearch/<index_name>/<api>`，並以 LiteLLM 金鑰作為 bearer 權杖。LiteLLM 會換入真正的索引名稱、簽署請求，並原樣回傳 OpenSearch 的回應，因此回應中的 `_index` 會顯示真正的索引。

```bash showLineNumbers title="Search, then write"
curl -X POST 'http://localhost:4000/opensearch/docs/_search' \
  -H "Authorization: Bearer $READ_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"match": {"text": "refunds"}}, "_source": ["text"]}'

curl -X POST 'http://localhost:4000/opensearch/docs/_doc' \
  -H "Authorization: Bearer $READ_WRITE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"text": "Exchanges are free within 30 days."}'
```

唯讀金鑰可取得搜尋結果；若以同一把金鑰執行相同的 `_doc` 寫入，會回應 403，訊息為 `User does not have permission to call vector store endpoint docs. Ask your administrator to add the necessary permissions to your API key/Team.` 將 [opensearch-py](https://docs.opensearch.org/latest/clients/python-low-level/) 用戶端指向 pass-through 時，運作方式相同：

```python showLineNumbers title="opensearch-py through LiteLLM"
from opensearchpy import OpenSearch, helpers

def client(key: str) -> OpenSearch:
    return OpenSearch(hosts=["http://localhost:4000/opensearch"], headers={"Authorization": f"Bearer {key}"})

writer = client(READ_WRITE_KEY)
writer.index(index="docs", body={"text": "Exchanges are free within 30 days."})
helpers.bulk(writer, [{"_index": "docs", "_source": {"text": "Returns need a receipt."}}], index="docs")

reader = client(READ_KEY)
reader.search(index="docs", body={"query": {"match": {"text": "refunds"}}, "_source": ["text"]})
```

### 搜尋備援 {#search-fallbacks}

若要設定備援搜尋叢集，請在 YAML 中[定義向量儲存庫備援](../completion/knowledgebase.md#define-vector-store-fallbacks)。統一搜尋與原生 `GET`/`POST /opensearch/{name}/_search` 都支援備援。原生備援必須使用相同的提供者／API 類型與實體索引名稱；寫入不會進行備援切換。

### 各權限允許的操作 {#what-each-permission-allows}

| 權限 | 方法 | API |
|---|---|---|
| `read` | `GET`、`HEAD` | `/<index>` |
| `read` | `GET`、`POST` | `_search`、`_count`、`_mget` |
| `read` | `GET`、`HEAD` | `_doc/<id>`、`_source/<id>` |
| `read` | `GET`、`POST` | `_explain/<id>` |
| `read` | `GET` | `_mapping` |
| `write` | `POST` | `_doc` |
| `write` | `PUT`、`POST`、`DELETE` | `_doc/<id>` |
| `write` | `PUT`、`POST` | `_create/<id>` |
| `write` | `POST` | `_update/<id>` |
| `write` | `POST`、`PUT` | `_bulk` |
| `write` | `POST` | `_delete_by_query`、`_update_by_query` |

其他所有索引 API，例如建立或刪除索引，或變更其對應或設定，僅開放給 proxy 管理員。

同時會讀取文件的寫入操作也需要 `read` 權限，因此僅具備寫入權限的金鑰會在 `_delete_by_query`、`_update_by_query`、帶有 `_source` 或 `script` 的 `_update` 或大量更新、`_source` 出現在大量操作中繼資料時，以及寫入操作上的 `_source` 查詢參數，收到 403。

### pass-through 會拒絕的請求 {#what-the-pass-through-refuses}

金鑰的存取範圍僅限於 URL 路徑中的索引，因此任何可能觸及另一個索引的請求，LiteLLM 都會回應 400。這包括查詢或 `_mget` 內文中任何位置的 `index`、`_index`、`indices`、`indexed_shape`、`wrapper` 與 `search_pipeline`（這排除了對其他索引的詞彙查詢與形狀查詢），以及 `pipeline`、`source` 與 `source_content_type` 查詢參數。在 `_bulk` 內文中，每個操作必須是 `index`、`create`、`update` 或 `delete`，`_index` 必須與路徑中的索引相符，且操作中繼資料中的 `index`、`indices` 與 `pipeline` 會回應 400。

內文必須是 `application/json` 或 `application/x-ndjson`，且為 UTF-8 編碼。其他任何內容類型都會回應 400。

## 設定參考 {#settings-reference}

| 設定 | 介面標籤 | 必填 | 填寫內容 |
|---|---|---|---|
| `vector_store_id` | 向量儲存庫 ID | 是 | 用戶端用來搜尋的 ID。除非設定了 `opensearch_index_name`，否則它也是 OpenSearch 索引名稱 |
| `api_base` | OpenSearch 端點 | 是 | 集合或網域端點，路徑中不含索引。請參閱[端點表格](#3-register-the-index-with-litellm) |
| `litellm_embedding_model` | 嵌入模型 | 是 | 產生索引中向量的模型。使用不同的模型會回傳看似合理但錯誤的結果，使用不同維度的模型則會出錯 |
| `opensearch_index_name` | 索引名稱 | 否 | 當與 `vector_store_id` 不同時，要搜尋的 OpenSearch 索引 |
| `opensearch_embedding_field` | 向量欄位名稱 | 否 | 預設為 `embedding`。查詢所針對的 `knn_vector` 欄位 |
| `opensearch_text_field` | 文字欄位 | 否 | 預設為 `text`。作為每筆結果內容回傳的欄位，也是混合搜尋用來比對關鍵字的欄位 |
| `opensearch_search_pipeline` | 搜尋管線 | 否 | 每次搜尋都要經過的搜尋管線。混合搜尋的必填項目 |
| `opensearch_hybrid_search` | 混合搜尋 | 否 | `true` 表示合併關鍵字與向量排名。需要 `opensearch_search_pipeline` |
| `aws_region_name` | AWS 區域 | 否 | 僅適用於端點中不帶區域的情況，例如 VPC 端點或自訂網域 |
| `aws_access_key_id`、`aws_secret_access_key`、`aws_session_token` | 現有憑證 | 否 | 靜態 AWS 憑證 |
| `aws_role_name`、`aws_session_name`、`aws_external_id`、`aws_sts_endpoint` | 現有憑證 | 否 | LiteLLM 在簽署前擔任的 IAM 角色 |
| `aws_web_identity_token` | 現有憑證 | 否 | 用來擔任 `aws_role_name` 的 Web 身分權杖 |
| `aws_profile_name` | 現有憑證 | 否 | AWS 設定檔中的具名設定檔 |

若未設定任何 AWS 設定，LiteLLM 會使用其執行所在機器的預設 AWS 憑證鏈。任何其他 `opensearch_*` 設定都會回應 400。

## 疑難排解 {#troubleshooting}

**要求您設定 AWS 憑證的 401** 表示 LiteLLM 找不到可用的 AWS 身分。請在儲存庫上設定存取金鑰、`aws_role_name` 或 `aws_profile_name`，或以具備 AWS 身分的方式執行 LiteLLM。

**來自 OpenSearch 的 403** 表示簽署正確，但該身分未獲允許進入。在 Serverless 上，請檢查集合的資料存取政策是否列出該身分，並授予索引 `aoss:ReadDocument`。在網域上，請檢查存取政策，以及啟用細粒度存取控制時的角色對應。

**僅在篩選搜尋時出現的 403** 表示該身分無法讀取索引對應。請在 Serverless 上授予 `aoss:DescribeIndex`，或在網域上授予 `es:ESHttpGet`，或開啟 `drop_params` 以不帶篩選條件搜尋。

**表示儲存庫不支援 `api_key` 的 400** 表示註冊時設定了 `api_key`。OpenSearch 儲存庫一律以 SigV4 簽署，因此請將其移除。

**結果的文字為空** 表示搜尋結果是真實的，但 `opensearch_text_field` 指定的欄位在您的文件中並不存在。請將其設為存放內文的那個欄位。

**表示篩選條件無法精確比對欄位的 400** 表示該欄位對應為文字且沒有 `keyword` 子欄位，或其上的每個關鍵字對應都有正規化器。請新增一個 `keyword` 子欄位並重新建立索引，或改用其他欄位篩選。

## 不支援的功能 {#not-supported}

OpenSearch 向量儲存庫僅支援搜尋。`/v1/vector_stores` 上的建立、列出、取得、更新與刪除都會回應 400，且不會向 OpenSearch 傳送任何內容，因此刪除儲存庫永遠不會動到索引，LiteLLM 也無法上傳檔案或對 OpenSearch 執行 `/rag/ingest`。請在 OpenSearch 中建立並載入索引，或透過 [pass-through](#pass-through-with-per-key-index-permissions) 載入。搜尋也會對 `ranking_options` 與 `rewrite_query` 回應 400（在 `drop_params` 下會將其捨棄），並一律對 `extra_body` 回應 400，因為將呼叫端 JSON 合併進查詢中，會讓任何金鑰持有者執行任意查詢。
