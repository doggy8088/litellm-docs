---
title: 語意快取
description: 針對相似但不相同的提示詞提供快取的 LLM 回應，以及在何種流量型態下會出問題。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 語意快取 {#semantic-caching}

語意快取會嵌入提示詞，並提供 cosine similarity
超過 `similarity_threshold` 的最近快取回應，因此可命中相似而非完全相同的提示詞。
LiteLLM 為此支援三種後端：Qdrant、Valkey 和 Redis。來自語意
快取的回應會帶有 `x-litellm-semantic-similarity` 標頭。

:::warning

語意快取是為單次提示詞而設計。對於多輪或 agentic 流量，它會
重播過時的回應。請先閱讀
[語意快取與多輪 Agentic 流量](#semantic-caching-and-multi-turn-agentic-traffic)
再為這些工作負載啟用。

:::

## Qdrant {#qdrant}

可藉由在 `config.yaml` 中加入 `cache` 鍵來啟用快取

### 步驟 1：將 `cache` 新增至 config.yaml {#step-1-add-cache-to-the-configyaml}

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
  - model_name: openai-embedding
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True, litellm defaults to using a redis cache
  cache_params:
    type: qdrant-semantic
    qdrant_semantic_cache_embedding_model: openai-embedding # the model should be defined on the model_list
    qdrant_collection_name: test_collection
    qdrant_quantization_config: binary
    qdrant_semantic_cache_vector_size: 1536 # vector size must match embedding model dimensionality
    similarity_threshold: 0.8 # similarity threshold for semantic cache
```

### 步驟 2：將 Qdrant 憑證新增至您的 .env {#step-2-add-qdrant-credentials-to-your-env}

```shell
QDRANT_API_KEY = "16rJUMBRx*************"
QDRANT_API_BASE = "https://5392d382-45*********.cloud.qdrant.io"
```

### 步驟 3：使用設定檔執行 proxy {#step-3-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

### 步驟 4. 測試 {#step-4-test-it}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**在啟用語意快取時，請預期在回應標頭中看到 `x-litellm-semantic-similarity`**

## Valkey {#valkey}

在執行 [valkey-search](https://github.com/valkey-io/valkey-search) 模組的 Valkey 執行個體上啟用語意快取，例如 AWS ElastiCache for Valkey。無需 RediSearch 和 RedisVL。

:::info[需求]

必須載入 `valkey-search` 模組（可使用 `MODULE LIST` / `FT._LIST` 檢查）。在 AWS ElastiCache 上，向量搜尋需要 **以節點為基礎的 Valkey 8.2+ 叢集**；支援且建議使用停用叢集模式的節點群組，而且由於僅不支援水平分片，因此主節點加讀取複本是可以的。ElastiCache **Serverless 不支援向量搜尋**。此處不支援多分片（已啟用叢集模式）的端點，因此請使用停用叢集模式的端點並垂直擴充。

:::

### 步驟 1：將 `cache` 新增至 config.yaml {#step-1-add-cache-to-the-configyaml-1}

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
  - model_name: openai-embedding
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

litellm_settings:
  set_verbose: True
  cache: True
  cache_params:
    type: valkey-semantic
    host: os.environ/VALKEY_HOST
    port: os.environ/VALKEY_PORT
    valkey_semantic_cache_embedding_model: openai-embedding # the model should be defined on the model_list
    valkey_semantic_cache_index_name: litellm_semantic_cache_index # optional
    similarity_threshold: 0.8 # similarity threshold for semantic cache
```

### 步驟 2：將 Valkey 憑證新增至您的 .env {#step-2-add-valkey-credentials-to-your-env}

```shell
VALKEY_HOST = "your-valkey-host"
VALKEY_PORT = "6379"
VALKEY_PASSWORD = "your-password" # omit for passwordless / IAM-auth clusters
```

對於啟用傳輸加密（TLS）的 ElastiCache，請在 `cache_params` 下加入 `ssl: true`，或將 `cache_params.redis_url` 設為 `rediss://` URL，而不是主機與連接埠。若要在本機執行 valkey-search，`docker run -d -p 6379:6379 valkey/valkey-bundle:8.1`。

### 步驟 3：使用設定檔執行 proxy {#step-3-run-proxy-with-config-1}

```shell
$ litellm --config /path/to/config.yaml
```

### 步驟 4. 測試 {#step-4-test-it-1}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**在啟用語意快取時，請預期在回應標頭中看到 `x-litellm-semantic-similarity`**

## Redis {#redis}

可藉由在 `config.yaml` 中加入 `cache` 鍵來啟用快取

### 步驟 1：將 `cache` 新增至 config.yaml {#step-1-add-cache-to-the-configyaml-2}

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
  - model_name: azure-embedding-model
    litellm_params:
      model: azure/azure-embedding-model
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
      api_version: "2023-07-01-preview"

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True
  cache_params:
    type: "redis-semantic"
    similarity_threshold: 0.8 # similarity threshold for semantic cache
    redis_semantic_cache_embedding_model: azure-embedding-model # set this to a model_name set in model_list
```

以與精確比對 Redis 快取相同的方式設定 Redis 憑證；請參閱
[Redis 和 Valkey](./caching_redis.md#connect-the-proxy-to-redis)。接著執行 proxy：

```shell
$ litellm --config /path/to/config.yaml
```

## 語意快取與多輪 Agentic 流量 {#semantic-caching-and-multi-turn-agentic-traffic}

語意快取（`redis-semantic`、`qdrant-semantic`、`valkey-semantic`）會嵌入整個 `messages` 陣列的文字內容（包含 system prompt），並提供 cosine similarity 超過 `similarity_threshold` 的最近快取回應。

這對單次提示詞很有效，但不適合多輪或 agentic 工作負載（coding agent、tool-calling 迴圈、每一輪都重新送出整段對話的任何用戶端）。每一輪新對話都是前一次請求再加上一小段附加增量，因此連續輪次的文字幾乎完全相同，其嵌入向量約為 0.99 相似。在任何實際可用的門檻下，每一輪都會命中前一輪的快取項目，而用戶端會重播過時的回應，通常會表現為代理程式一再重複相同的工具呼叫。提高 `similarity_threshold` 並不能可靠地解決這個問題。Assistant `tool_calls` 也不屬於嵌入文字的一部分，這使得連續的 agent 輪次更難區分。

建議是將語意快取保留給單次流量，並排除 agentic 流量。
最便宜的方式是在您的
代理程式使用之虛擬金鑰的中繼資料中設定 `"cache": {"no-cache": true}`，proxy 會將其套用到該金鑰上的每個請求，且無需用戶端變更；請參閱
[每金鑰快取控制](./caching_controls.md#per-key-cache-controls)。您也可以透過
[`mode: default_off`](./caching_controls.md#set-caching-default-off-opt-in-only) 讓所有人改為選擇使用快取，或讓用戶端
透過 [動態快取控制](./caching_controls.md#dynamic-cache-controls) 針對每個請求選擇不使用。

如果您仍然想要為 agentic 流量保留快取，請改用精確比對快取（`type: redis`）：
它以整個請求的雜湊值作為鍵，因此對對話的任何變更都會導致快取未命中，且不可能發生過時
重播。

:::note

快取只會在 `supported_call_types` 中列出的呼叫類型上執行。預設清單涵蓋 `/chat/completions`、`/completions`、`/embeddings`、`/audio/transcriptions`、`/rerank`、`/responses` 和 `/v1/messages`（Anthropic 格式），因此採用 Anthropic Messages API 的 agentic 用戶端與 OpenAI 格式用戶端一樣會命中語意快取。像 `/anthropic/v1/messages` 這類提供者直通路由則永遠不會經過快取

:::

## 語意快取與終端使用者隔離 {#semantic-caching-and-end-user-isolation}

語意快取鍵刻意不包含提示詞，因此將兩位呼叫者區隔開來的唯一因素是租戶範圍：虛擬金鑰、其 team 與其 organization。因此，單一虛擬金鑰背後的每位終端使用者預設都共用一個語意 bucket，而為其中一人產生的回應（包含工具呼叫）可能會提供給透過同一金鑰送出語意相似提示詞的另一人。

在 `cache_params` 下設定 `semantic_cache_scope: end_user`，也能按終端使用者隔離 bucket。終端使用者 id 是 proxy 針對該請求驗證的 id（`user_api_key_end_user_id`）：`x-litellm-customer-id` 標頭、已設定的 `user_header_name`，或請求的 `user` 欄位。它會同時從 `metadata` 和 `litellm_metadata` 讀取，因此 `/v1/chat/completions`、`/v1/responses` 和 `/v1/messages` 都會涵蓋在內。未攜帶終端使用者 id 的請求會回退到 key/team/org bucket，而不是落入共用的空 bucket。預設值 `key` 會維持目前的 key/team/org 範圍。

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis-semantic
    similarity_threshold: 0.8
    redis_semantic_cache_embedding_model: my-embedding-model
    semantic_cache_scope: end_user # key (default) | end_user
```

在 Admin UI 中，當快取類型為 `redis-semantic` 時，可於 Caching -> Cache Settings 下以「Semantic Cache Scope」設定相同選項。

## 語意快取與緩慢的 Embedding 端點 {#semantic-caching-and-a-slow-embedding-endpoint}

語意快取會在每次請求前嵌入提示詞，而該 embedding 呼叫會同步執行，因此請求在完成前無法送達 LLM。LiteLLM 將其上限設為 5 秒。超過期限後，查詢會被放棄，回應會帶有 `x-litellm-semantic-similarity: 0.0`，而請求會以快取未命中的方式繼續送往模型。若 embedding 端點無法連線或卡住，造成的代價因此只是幾秒鐘，而不會讓請求停擺。

如果您的 embedding 端點確實比這更慢，請提高期限，可透過在 `cache_params` 下為每個快取設定 `semantic_cache_embedding_timeout`，或使用 `SEMANTIC_CACHE_EMBEDDING_TIMEOUT_SECONDS` 環境變數全域設定。

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis-semantic
    similarity_threshold: 0.8
    redis_semantic_cache_embedding_model: my-embedding-model
    semantic_cache_embedding_timeout: 10.0
```

請注意，更高的期限代表當 embedding 端點停止回應時，每個請求都要等待更久，因此請讓它盡量接近端點的實際延遲。
