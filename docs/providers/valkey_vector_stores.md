import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Valkey - 向量儲存 {#valkey---vector-store}

透過 LiteLLM 的統一向量儲存 API 搜尋您已在 [Valkey](https://valkey.io/) 中建立索引的文件，如此任何虛擬金鑰都能對您的資料儲存進行檢索，而無須持有您的 Valkey 憑證。

LiteLLM 只會從 Valkey 讀取；建立與載入索引仍由您負責。每次搜尋都會使用您註冊的模型將查詢轉為嵌入，對您的索引執行 KNN [`FT.SEARCH`](https://valkey.io/commands/ft.search/)，並回傳與其他每個提供者相同的 OpenAI 形狀結果，分數為 `1 - cosine distance`，因此數值越高代表越接近。

## 快速開始 {#quick-start}

您需要三樣東西：
1. 已載入 [valkey-search](https://valkey.io/topics/search/) 模組的 Valkey 伺服器
2. 一個嵌入模型（用來將您的文件轉為嵌入的那個）
3. 一個針對您文件的 [`FT` 索引](https://valkey.io/commands/ft.create/)

## 1. 在 Valkey 中開啟向量搜尋 {#1-turn-on-vector-search-in-valkey}

Valkey 本身只是鍵值儲存，對向量一無所知。向量搜尋來自 [valkey-search](https://github.com/valkey-io/valkey-search)，這是一個新增 `FT.*` 命令家族（[Valkey 文件](https://valkey.io/topics/search/)）的模組，而且必須載入到您的伺服器上。LiteLLM 不會為此新增任何 Python 相依套件：它使用閘道已隨附的 Redis 用戶端與該模組通訊。

在本機快速取得伺服器的方法是使用 [valkey-bundle](https://hub.docker.com/r/valkey/valkey-bundle) 映像，該映像已預先載入模組：

```bash showLineNumbers title="Local Valkey with vector search"
docker run -d -p 6379:6379 valkey/valkey-bundle:latest
```

託管的 [ElastiCache for Valkey](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-elasticache-vector-search/)（節點式叢集上的 Valkey 8.2）與 [MemoryDB](https://docs.aws.amazon.com/memorydb/latest/devguide/vector-search.html) 已經隨附該模組。叢集模式沒問題：LiteLLM 會將 `FT.SEARCH` 傳送到端點解析出的任一節點，而 valkey-search 本身會 [將查詢分散到各個分片並合併結果](https://valkey.io/topics/search/)。若是您自行架設的伺服器，請使用 [`valkey-server --loadmodule /path/to/libsearch.so`](https://github.com/valkey-io/valkey-search#load-the-module) 啟動。

如果缺少該模組，LiteLLM 仍可正常連線，但接下來每次搜尋都會失敗，因為伺服器會拒絕它從未聽過的命令：

```
litellm.APIConnectionError: unknown command 'FT.SEARCH', with args beginning with:
'my-search-index' '*=>[KNN 3 @embedding $vec AS vector_distance]' ...
```

## 2. 以 LiteLLM 讀取的方式儲存您的文件 {#2-store-your-documents-the-way-litellm-reads-them}

每份文件都是一個 Valkey [HASH](https://valkey.io/topics/hashes/)，包含一個文字欄位（預設為 `text`）與一個 FLOAT32 向量欄位（預設為 `embedding`），而針對這些鍵的 [`FT.CREATE`](https://valkey.io/commands/ft.create/) 索引就是 `FT.SEARCH` 查詢的依據。Valkey 雜湊沒有 schema，因此 LiteLLM 無法猜測哪個欄位是哪個；您註冊的名稱必須與資料一致。

```bash showLineNumbers title="Create the index"
FT.CREATE my-search-index ON HASH PREFIX 1 kb: \
  SCHEMA embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC COSINE
```

`DIM` 必須等於您的嵌入模型維度（`text-embedding-3-small` 為 1536）。請使用您稍後會在 LiteLLM 中註冊的相同模型，對文件進行嵌入並寫入：

```python showLineNumbers title="Load documents into the index"
import struct

import litellm
from redis import Redis

client = Redis(host="localhost", port=6379)

docs = {
    "kb:refunds": "Refunds are issued back to the original payment method and normally settle within five business days.",
    "kb:shipping": "Standard shipping takes three to five business days inside the continental United States.",
}

response = litellm.embedding(model="openai/text-embedding-3-small", input=list(docs.values()))

for (key, text), item in zip(docs.items(), response.data):
    embedding = item["embedding"]
    client.hset(key, mapping={"text": text, "embedding": struct.pack(f"<{len(embedding)}f", *embedding)})
```

不同的模型會悄悄回傳錯誤結果；不同的維度則會出現 `query vector blob size (N) does not match index's expected size (M)`。

## 3. 在 LiteLLM 中註冊索引 {#3-register-the-index-with-litellm}

註冊會告訴 LiteLLM 索引的位置以及哪個模型用來嵌入查詢；它不會在 Valkey 中建立任何東西。請先在 **Models** 底下新增嵌入模型，名稱使用提供者的模型（`text-embedding-3-small`），因為 LiteLLM 會重用該模型的憑證，但把它的名稱傳給提供者。

<Tabs>
<TabItem value="ui" label="管理 UI">

開啟 **Tools > Vector Stores**，前往 **Manage Vector Stores** 分頁，然後點擊 **+ Add Vector Store**。

<img src="/img/valkey_vs_manage_tab.png" alt="含有 Add Vector Store 按鈕的 Manage Vector Stores 分頁" />

選擇 **Valkey** 作為提供者。接著表單會說明其預期內容並顯示連線欄位。將您的 `FT` 索引名稱填入 Vector Store ID，輸入主機與連接埠，並選擇已產生索引中向量的嵌入模型。除非您的雜湊使用不同名稱，否則請維持 Text Field 與 Vector Field Name 不變。

<img src="/img/valkey_vs_add_modal.png" alt="已選取 Valkey 提供者且每個欄位都已填妥的 Add New Vector Store 視窗" />

點擊 **Create** 後，該儲存會出現在表格中，準備搜尋：

<img src="/img/valkey_vs_created_row.png" alt="列出新 Valkey 儲存的 Manage Vector Stores 表格" />

建立儲存不會測試連線。錯誤的主機、連接埠或索引名稱只會在第一次搜尋時回報，因此請立即從 [Test Vector Store 分頁](#4-test-the-store) 執行一次測試。

</TabItem>
<TabItem value="config" label="config.yaml">

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: openai/text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

vector_store_registry:
  - vector_store_name: support-knowledge-base
    litellm_params:
      vector_store_id: my-search-index
      custom_llm_provider: valkey
      valkey_host: my-valkey.example.com
      valkey_port: 6379
      valkey_password: os.environ/VALKEY_PASSWORD
      valkey_ssl: true
      litellm_embedding_model: openai/text-embedding-3-small
```

```bash
litellm --config /path/to/config.yaml
```

</TabItem>
<TabItem value="api" label="管理 API">

```bash showLineNumbers title="Register the index"
curl -X POST 'http://localhost:4000/vector_store/new' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "vector_store_id": "my-search-index",
    "custom_llm_provider": "valkey",
    "vector_store_name": "Support Knowledge Base",
    "litellm_params": {
      "valkey_host": "my-valkey.example.com",
      "valkey_port": 6379,
      "litellm_embedding_model": "openai/text-embedding-3-small"
    }
  }'
```

該儲存會寫入 LiteLLM 資料庫並立即可供搜尋，無須重新啟動。其餘管理 API 請參閱 [Managed Vector Stores](../vector_stores/managed_vector_stores.md)。

</TabItem>
</Tabs>

## 4. 測試儲存 {#4-test-the-store}

在 Admin UI 中，**Test Vector Store** 分頁會針對已註冊的儲存執行實際搜尋，並顯示每個命中的分數；這是確認連線、索引名稱與嵌入模型是否一致的最快方式：

<img src="/img/valkey_vs_test_results.png" alt="Test Vector Store 分頁顯示支援問題的六個排名結果" />

透過 HTTP 的相同搜尋：

```bash showLineNumbers title="Search the index"
curl -X POST 'http://localhost:4000/v1/vector_stores/my-search-index/search' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "how long does a refund take?", "max_num_results": 3}'
```

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "how long does a refund take?",
  "data": [
    {
      "score": 0.5899661779400001,
      "content": [
        {
          "text": "Refunds are issued back to the original payment method and normally settle within five business days. Contact support if the money has not arrived after that.",
          "type": "text"
        }
      ],
      "file_id": "kb:refunds",
      "filename": "kb:refunds"
    },
    {
      "score": 0.36476153135300005,
      "content": [
        {
          "text": "Every API key is limited to 600 requests per minute. Requests over the limit return HTTP 429 with a Retry-After header telling you how long to wait.",
          "type": "text"
        }
      ],
      "file_id": "kb:rate-limits",
      "filename": "kb:rate-limits"
    }
  ]
}
```

`file_id` 與 `filename` 是命中結果來自的 Valkey 鍵。`max_num_results` 預設為 10，且必須介於 1 到 50 之間。

從 SDK 使用時，請改為內嵌傳入連線設定，而不是註冊儲存：

```python showLineNumbers title="Search from the Python SDK"
import litellm

response = litellm.vector_stores.search(
    vector_store_id="my-search-index",
    query="how long does a refund take?",
    custom_llm_provider="valkey",
    valkey_host="my-valkey.example.com",
    litellm_embedding_model="openai/text-embedding-3-small",
    max_num_results=3,
)
```

`litellm.vector_stores.asearch` 是非同步對應版本。兩者都需要 `redis` 套件，而閘道已經安裝該套件；在純 SDK 環境中請執行 `pip install redis`。

一旦儲存已註冊，任何接受 vector store id 的 LiteLLM 功能都可使用它，包括透過 `tools: [{"type": "file_search", "vector_store_ids": ["my-search-index"]}]` 進行的 [`/chat/completions` 中的 RAG](../completion/knowledgebase.md)。

## 設定參考 {#settings-reference}

大多數此表格都可使用預設值。決定搜尋能否找到任何結果的是索引名稱、主機、嵌入模型，以及兩個欄位名稱。

| 設定 | UI 標籤 | 必填 | 要填入的內容 |
|---|---|---|---|
| `vector_store_id` | Vector Store ID | 是 | `FT` 索引的名稱，必須與您傳給 `FT.CREATE` 的內容完全一致。這不是自由格式標籤；未知名稱會以 `Index with name '...' not found in database 0` 失敗 |
| `valkey_host` | Valkey Host | 是 | 純主機名稱或 IP，不含 scheme 與連接埠，因此是 `my-valkey.example.com` 而不是 `redis://my-valkey.example.com:6379` |
| `valkey_port` | Valkey Port | 否 | 預設為 `6379`。只有當您的伺服器監聽其他位置時才變更 |
| `valkey_password` | Valkey Password | 否 | 僅在伺服器要求 AUTH 時需要。否則請留空 |
| `valkey_ssl` | Use TLS | 否 | 預設為 `false`。若是啟用傳輸中加密的 ElastiCache 或 MemoryDB 叢集，請設為 `true`，這會讓 LiteLLM 以 `rediss://` 連線 |
| `litellm_embedding_model` | Embedding Model | 是 | 與索引中向量相同的確切模型。不同模型會回傳看似合理但錯誤的結果，而不同維度則會報錯 |
| `valkey_text_field` | Text Field | 否 | 預設為 `text`。必須與存放可讀文字的雜湊欄位一致，否則每個結果都會回傳空內容 |
| `valkey_embedding_field` | Vector Field Name | 否 | 預設為 `embedding`。必須與您的索引建立在其上的欄位一致 |
| `litellm_embedding_config` | n/a | 否 | 嵌入請求的額外引數，例如 `api_key` 或 `api_base`。在閘道上通常可以省略，因為 LiteLLM 會從已註冊的模型解析這些設定 |

## 疑難排解 {#troubleshooting}

**`unknown command 'FT.SEARCH'`** 表示伺服器沒有向量搜尋。請執行 `valkey-cli FT._LIST`：有載入模組的伺服器會回應其索引，沒有載入的則會重複相同的未知命令錯誤。一般的 `valkey/valkey` 映像通常就是罪魁禍首。

**`query vector blob size (N) does not match index's expected size (M)`** 表示儲存上的嵌入模型回傳的維度數與建立索引時的維度數不同。這兩個數字都是位元組數，因此除以 4 即可看出正在比較的維度，接著不是註冊建立該索引的模型，就是以新的維度重建索引。

**結果回傳時文字為空白** 表示命中結果是真實的，但 `valkey_text_field` 指向的是您的雜湊沒有的欄位。請對其中一個回傳的鍵執行 `HGETALL`，並將欄位設定為承載正文的內容。

**`Connection refused`，或是搜尋卡住後失敗**，通常表示連接埠錯誤，或是安全性群組不允許閘道通過。LiteLLM 連線等待 5 秒、指令等待 30 秒，因此無法連上的主機會快速失敗，而不會卡住某個工作者。

**看起來隨機的排名** 指向嵌入模型。當查詢是由不同於文件所用的模型進行嵌入時，不會出現錯誤，因此請比較儲存所註冊的模型與您的資料擷取工作實際使用的模型。

## 不支援的 {#not-supported}

Valkey 向量儲存僅供搜尋。LiteLLM 無法建立索引（`POST /v1/vector_stores`）、上傳檔案，或對 Valkey 執行 `/rag/ingest`，這也是 Valkey 不會出現在 Admin UI 的 Create Vector Store 分頁中的原因；請自行使用 `FT.CREATE` 和 `HSET` 建立並填入索引。搜尋上的 `filters` 參數也尚未實作，傳入時會拋出錯誤，而不是被靜默忽略。

具有相同模組的 Valkey 伺服器也可以支援 LiteLLM 的 [語意快取](../proxy/caching_semantic.md)，這是一項具有自己索引的獨立功能，而 LiteLLM 會建立並寫入該索引。
