---
title: 快取
description: 在 LiteLLM proxy 上快取 LLM 回應，以降低支出與延遲。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快取 {#caching}

:::note

關於 OpenAI/Anthropic Prompt Caching，請前往 [這裡](../completion/prompt_caching.md)

:::

快取 LLM 回應。LiteLLM 的快取系統會儲存並重用 LLM 回應，以節省成本並降低延遲。當您兩次送出相同的請求時，系統會回傳快取的回應，而不是再次呼叫 LLM API。

## 支援的快取 {#supported-caches}

| 快取 | `cache_params.type` | 設定 |
| --- | --- | --- |
| Redis、Valkey、ElastiCache、Memorystore | `redis` | [Redis 與 Valkey](./caching_redis.md) |
| Redis 語意快取 | `redis-semantic` | [語意快取](./caching_semantic.md) |
| Valkey 語意快取 | `valkey-semantic` | [語意快取](./caching_semantic.md) |
| Qdrant 語意快取 | `qdrant-semantic` | [語意快取](./caching_semantic.md) |
| S3 儲存貯體 | `s3` | [S3 與 GCS](./caching_object_storage.md) |
| GCS 儲存貯體 | `gcs` | [S3 與 GCS](./caching_object_storage.md) |
| 記憶體中 | `local` | [下方](#in-memory-and-disk-caches) |
| 磁碟 | `disk` | [下方](#in-memory-and-disk-caches) |

Redis 是超過單一 worker 時的正確預設選擇。記憶體中快取存在於單一 worker 程序內，因此執行四個 workers 的 proxy 會保有四個彼此獨立的快取，命中率大約會隨 worker 數量而下降。其餘 Redis 帶來的好處，請參閱 [需要 Redis 的項目](./redis_requirements.md)。

完全匹配快取（`redis`、`s3`、`gcs`、`local`、`disk`）會以整個請求的雜湊作為鍵，因此對對話的任何變更都會造成未命中。語意快取會為提示詞建立嵌入，並提供相似度門檻以上最接近的匹配結果，這適合單輪提示詞，但在 agent 流量上很容易出問題；在啟用之前，請先閱讀 [語意快取](./caching_semantic.md)。

## 快速開始 {#quick-start}

### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml}

只要將 `cache` key 加到 `config.yaml` 即可啟用快取

```yaml
model_list:
  - model_name: {{openai_small}}
    litellm_params:
      model: {{openai_small}}
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True, litellm defaults to using a redis cache
```

### 步驟 2：將 Redis 憑證加入 .env {#step-2-add-redis-credentials-to-env}

```shell
REDIS_URL = ""        # REDIS_URL='redis://username:password@hostname:port/database'
## OR ##
REDIS_HOST = ""       # REDIS_HOST='redis-18841.c274.us-east-1-3.ec2.cloud.redislabs.com'
REDIS_PORT = ""       # REDIS_PORT='18841'
REDIS_PASSWORD = ""   # REDIS_PASSWORD='liteLlmIsAmazing'
```

關於命名空間、ACL 使用者、叢集與 Sentinel 拓撲、TLS、IAM 驗證，以及完整的
`REDIS_*` 環境變數清單，請參閱 [Redis 與 Valkey](./caching_redis.md)。快取用戶端的每個命令逾時為
`cache_params.socket_timeout`（預設 5 秒），不是 `REDIS_SOCKET_TIMEOUT`；
請參閱 [Redis socket_timeout](./caching_redis.md#redis-socket_timeout)。

### 步驟 3：使用設定啟動 proxy {#step-3-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

### 步驟 4：測試它 {#step-4-test-it}

<Tabs>
<TabItem value="chat_completions" label="/chat/completions">

兩次送出相同的請求：

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "{{openai_small}}",
     "messages": [{"role": "user", "content": "write a poem about litellm!"}],
     "temperature": 0.7
   }'

curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "{{openai_small}}",
     "messages": [{"role": "user", "content": "write a poem about litellm!"}],
     "temperature": 0.7
   }'
```

</TabItem>
<TabItem value="responses" label="/v1/responses">

兩次送出相同的請求：

```shell
curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
     "model": "{{openai_small}}",
     "input": "write a poem about litellm!"
   }'

curl http://0.0.0.0:4000/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
     "model": "{{openai_small}}",
     "input": "write a poem about litellm!"
   }'
```

</TabItem>
<TabItem value="embeddings" label="/embeddings">

兩次送出相同的請求：

```shell
curl --location 'http://0.0.0.0:4000/embeddings' \
  --header 'Content-Type: application/json' \
  --data ' {
  "model": "text-embedding-ada-002",
  "input": ["write a litellm poem"]
  }'

curl --location 'http://0.0.0.0:4000/embeddings' \
  --header 'Content-Type: application/json' \
  --data ' {
  "model": "text-embedding-ada-002",
  "input": ["write a litellm poem"]
  }'
```

</TabItem>
</Tabs>

第二個回應會從快取提供。它會帶有 `x-litellm-cache-key` 回應標頭，
您可以將其提供給 [`/cache/delete`](./caching_controls.md#deleting-cache-keys---cachedelete)。

在 `cache: True` 且沒有 `supported_call_types` 的情況下，快取會對 `/chat/completions`、
`/completions`、`/embeddings`、`/audio/transcriptions`、`/rerank`、`/v1/responses` 和
`/v1/messages` 啟用。若要將其限制於其中部分，請參閱
[支援的呼叫類型](./caching_controls.md#control-call-types-caching-is-on-for---chatcompletion-embeddings-etc)。

在 `/v1/responses` 上，完全匹配快取會以請求本文作為鍵，因此帶有
`previous_response_id` 的請求會與將對話內嵌的請求使用不同的鍵，而多輪對話的每一輪都會是自己的項目。

## 記憶體中與磁碟快取 {#in-memory-and-disk-caches}

兩者都不需要外部基礎架構，而且兩者都不會在 workers 或 replicas 之間共享，因此請將它們用於本機開發，而非正式環境。

<Tabs>
<TabItem value="local" label="In Memory Cache">

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: local
```

</TabItem>
<TabItem value="disk" label="Disk Cache">

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: disk
    disk_cache_dir: /tmp/litellm-cache # OPTIONAL, default to ./.litellm_cache
```

</TabItem>
</Tabs>

## 快取除錯 - `/cache/ping` {#debugging-caching---cacheping}

LiteLLM Proxy 提供一個 `/cache/ping` 端點，用來測試快取是否如預期運作

**使用方式**

```shell
curl --location 'http://0.0.0.0:4000/cache/ping'  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**預期回應 - 當快取正常時**

```shell
{
    "status": "healthy",
    "cache_type": "redis",
    "ping_response": true,
    "set_cache_response": "success",
    "litellm_cache_params": {
        "supported_call_types": "['completion', 'acompletion', 'embedding', 'aembedding', 'atranscription', 'transcription']",
        "type": "redis",
        "namespace": "None"
    },
    "redis_cache_params": {
        "redis_client": "Redis<ConnectionPool<Connection<host=redis-16337.c322.us-east-1-2.ec2.cloud.redislabs.com,port=16337,db=0>>>",
        "redis_kwargs": "{'url': 'redis://:******@redis-16337.c322.us-east-1-2.ec2.cloud.redislabs.com:16337'}",
        "async_redis_conn_pool": "BlockingConnectionPool<Connection<host=redis-16337.c322.us-east-1-2.ec2.cloud.redislabs.com,port=16337,db=0>>",
        "redis_version": "7.2.0"
    }
}
```

## 下一步 {#next-steps}

您可以透過 [快取控制](./caching_controls.md) 調整哪些內容會被快取以及快取多久，透過 [`cache_params` 參考資料](./caching_settings.md) 查詢任何設定，或從上方表格設定特定後端。
