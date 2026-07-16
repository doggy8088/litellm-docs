import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# 快取 {#caching}

:::note

關於 OpenAI/Anthropic Prompt Caching，請前往 [這裡](../completion/prompt_caching.md)

:::

快取 LLM 回應。LiteLLM 的快取系統會儲存並重用 LLM 回應，以節省成本並降低延遲。當您兩次送出相同的請求時，系統會回傳快取的回應，而不是再次呼叫 LLM API。

### 支援的快取 {#supported-caches}

- 記憶體快取
- 磁碟快取
- Redis 快取
- Qdrant 語意快取
- Redis 語意快取
- Valkey 語意快取
- S3 Bucket 快取
- GCS Bucket 快取

## 虛擬金鑰驗證快取（Redis） {#virtual-key-authentication-cache-redis}

當 proxy 驗證 **virtual key**（客戶 API 金鑰）時，結果會被快取，這樣就不必在每次請求時查詢資料庫。預設情況下，該快取**只存在於每個 worker process 中**——因此在部署之後，新 pod 或額外的 Uvicorn workers 會各自預熱自己的快取，並可能在快取預熱完成前觸發更多 DB 讀取。

設定 `litellm_settings.enable_redis_auth_cache: true`，即可將 virtual-key 驗證資料鏡像到在 `litellm_settings.cache` / `cache_params` 下設定的**同一個 Redis instance**。接著，workers 與 replicas 就能在整個叢集之間共享已快取的驗證項目。

**需求**

- `litellm_settings.cache` 必須是 **`true`**（proxy 的 Redis 會在快取設定期間初始化）。請參閱 [所有設定](./config_settings)。
- `cache_params.type` 必須是 **`redis`**（或依您的快取設定使用 Redis Cluster）；驗證快取會附加到該 Redis client。請參閱 [支援的 `cache_params`](#supported-cache_params-on-proxy-configyaml)。
- 可選擇設定 **`general_settings.user_api_key_cache_ttl`**（秒）：當啟用 Redis 驗證快取時，TTL 會同時套用於記憶體與 Redis 兩層，因此過期金鑰會一致地失效。

範例：

```yaml
litellm_settings:
  cache: true
  enable_redis_auth_cache: true
  cache_params:
    type: redis
    host: os.environ/REDIS_HOST
    port: 6379

general_settings:
  user_api_key_cache_ttl: 300 # optional; seconds
```

:::tip

啟動記錄會區分這兩種模式：使用 `enable_redis_auth_cache: true` 時，您應該會看到一則訊息，表示 virtual-key 查詢會在 workers 之間共享。

:::

## 快速開始 {#quick-start}

<Tabs>

<TabItem value="redis" label="redis 快取">

可透過在 `config.yaml` 中加入 `cache` 鍵來啟用快取

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True, litellm defaults to using a redis cache
```

#### [選用] 步驟 1.5：加入 redis 命名空間、預設 ttl {#optional-step-15-add-redis-namespaces-default-ttl}

#### 命名空間 {#namespace}

如果您想為金鑰建立某個資料夾，可以這樣設定命名空間：

```yaml
litellm_settings:
  cache: true
  cache_params: # set cache params for redis
    type: redis
    namespace: "litellm.caching.caching"
```

金鑰會像這樣儲存：

```
litellm.caching.caching:<hash>
```

#### Redis 叢集 {#redis-cluster}

<Tabs>

<TabItem value="redis-cluster-config" label="在 config.yaml 中設定">

```yaml
model_list:
  - model_name: "*"
    litellm_params:
      model: "*"

litellm_settings:
  cache: True
  cache_params:
    type: redis
    redis_startup_nodes: [{ "host": "127.0.0.1", "port": "7001" }]
```

</TabItem>

<TabItem value="redis-env" label="在 .env 中設定">

您可以在 .env 中透過設定 `REDIS_CLUSTER_NODES` 來設定 redis cluster

**`REDIS_CLUSTER_NODES`** 範例值

```
REDIS_CLUSTER_NODES = "[{"host": "127.0.0.1", "port": "7001"}, {"host": "127.0.0.1", "port": "7003"}, {"host": "127.0.0.1", "port": "7004"}, {"host": "127.0.0.1", "port": "7005"}, {"host": "127.0.0.1", "port": "7006"}, {"host": "127.0.0.1", "port": "7007"}]"
```

:::note

在 .env 中設定 redis cluster 節點的 python 範例腳本：

```python
# List of startup nodes
startup_nodes = [
    {"host": "127.0.0.1", "port": "7001"},
    {"host": "127.0.0.1", "port": "7003"},
    {"host": "127.0.0.1", "port": "7004"},
    {"host": "127.0.0.1", "port": "7005"},
    {"host": "127.0.0.1", "port": "7006"},
    {"host": "127.0.0.1", "port": "7007"},
]

# set startup nodes in environment variables
os.environ["REDIS_CLUSTER_NODES"] = json.dumps(startup_nodes)
print("REDIS_CLUSTER_NODES", os.environ["REDIS_CLUSTER_NODES"])
```

:::

</TabItem>

</Tabs>

#### Redis Sentinel {#redis-sentinel}

<Tabs>

<TabItem value="redis-sentinel-config" label="在 config.yaml 中設定">

```yaml
model_list:
  - model_name: "*"
    litellm_params:
      model: "*"

litellm_settings:
  cache: true
  cache_params:
    type: "redis"
    service_name: "mymaster"
    sentinel_nodes: [["localhost", 26379]]
    sentinel_password: "password" # [OPTIONAL]
```

</TabItem>

<TabItem value="redis-env" label="在 .env 中設定">

您可以在 .env 中透過設定 `REDIS_SENTINEL_NODES` 來設定 redis sentinel

**`REDIS_SENTINEL_NODES`** 範例值

```env
REDIS_SENTINEL_NODES='[["localhost", 26379]]'
REDIS_SERVICE_NAME = "mymaster"
REDIS_SENTINEL_PASSWORD = "password"
```

:::note

在 .env 中設定 redis cluster 節點的 python 範例腳本：

```python
# List of startup nodes
sentinel_nodes = [["localhost", 26379]]

# set startup nodes in environment variables
os.environ["REDIS_SENTINEL_NODES"] = json.dumps(sentinel_nodes)
print("REDIS_SENTINEL_NODES", os.environ["REDIS_SENTINEL_NODES"])
```

:::

</TabItem>

</Tabs>

#### TTL {#ttl}

```yaml
litellm_settings:
  cache: true
  cache_params: # set cache params for redis
    type: redis
    ttl: 600 # will be cached on redis for 600s
    # default_in_memory_ttl: Optional[float], default is None. time in seconds.
    # default_in_redis_ttl: Optional[float], default is None. time in seconds.
```

#### SSL {#ssl}

只要在您的 .env 中設定 `REDIS_SSL="True"`，LiteLLM 就會讀取這個設定。

```env
REDIS_SSL="True"
```

若要快速測試，您也可以使用 REDIS_URL，例如：

```
REDIS_URL="rediss://.."
```

但我們**不**建議在正式環境使用 REDIS_URL。我們注意到使用它與使用 redis_host、port 等設定之間有效能差異。

#### GCP IAM 驗證 {#gcp-iam-authentication}

若要使用具備 IAM 驗證的 GCP Memorystore Redis，請安裝所需相依套件：

:::info 目前只有透過 GCP 才支援 redis 的 IAM 驗證，且目前僅支援 Redis Clusters。
:::

```shell
uv add google-cloud-iam
```

<Tabs>

<TabItem value="gcp-iam-config" label="在 config.yaml 中設定">

適用於具 GCP IAM 的 Redis Cluster：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    redis_startup_nodes:
      [{ "host": "10.128.0.2", "port": 6379 }, { "host": "10.128.0.2", "port": 11008 }]
    gcp_service_account: "projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com"
    ssl: true
    ssl_cert_reqs: null
    ssl_check_hostname: false
```

</TabItem>

<TabItem value="gcp-iam-env" label="在 .env 中設定">

您可以在 .env 中設定 GCP IAM Redis 驗證：

適用於 Redis Cluster：

```env
REDIS_CLUSTER_NODES='[{"host": "10.128.0.2", "port": 6379}, {"host": "10.128.0.2", "port": 11008}]'
REDIS_GCP_SERVICE_ACCOUNT="projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com"
REDIS_GCP_SSL_CA_CERTS="./server-ca.pem"
REDIS_SSL="True"
REDIS_SSL_CERT_REQS="None"
REDIS_SSL_CHECK_HOSTNAME="False"
```

**GCP 驗證設定**

請確保您的 GCP 認證已設定：

```shell
# Option 1: Service account key file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Option 2: If running on GCP compute instance with service account attached
# No additional setup needed
```

</TabItem>

</Tabs> 
#### 步驟 2：將 Redis 憑證加入 .env {#step-2-add-redis-credentials-to-env}
在您的作業系統環境中設定 `REDIS_URL` 或 `REDIS_HOST`，以啟用快取。

  ```shell
  REDIS_URL = ""        # REDIS_URL='redis://username:password@hostname:port/database'
  ## OR ## 
  REDIS_HOST = ""       # REDIS_HOST='redis-18841.c274.us-east-1-3.ec2.cloud.redislabs.com'
  REDIS_PORT = ""       # REDIS_PORT='18841'
  REDIS_PASSWORD = ""   # REDIS_PASSWORD='liteLlmIsAmazing'
  REDIS_USERNAME = ""   # REDIS_USERNAME='my-redis-username' [OPTIONAL] if your redis server requires a username
  REDIS_SSL = "True"    # REDIS_SSL='True' to enable SSL by default is False
  ```

**其他 kwargs**  
:::info
使用 `REDIS_*` 環境變數來設定所有 Redis client library 參數。這是切換 Redis 設定的建議方式，因為它會自動將環境變數對應到 Redis client kwargs。
:::

您可以透過在作業系統環境中儲存變數和值，來傳入任何額外的 redis.Redis 引數，如下所示：

```shell
REDIS_<redis-kwarg-name> = ""
```

例如：
```shell
REDIS_SSL = "True"
REDIS_SSL_CERT_REQS = "None" 
REDIS_CONNECTION_POOL_KWARGS = '{"max_connections": 20}'
```

:::warning
**注意**：對於非字串型別的 Redis 參數（例如整數、布林值或複雜物件），請避免使用 `REDIS_*` 環境變數，因為在 Redis client 初始化期間可能會失敗。對於這類參數，請改用您路由器設定中的 `cache_kwargs`。
:::

[**查看它如何從環境讀取**](https://github.com/BerriAI/litellm/blob/4d7ff1b33b9991dcf38d821266290631d9bcd2dd/litellm/_redis.py#L40)

#### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="qdrant-semantic" label="Qdrant 語意快取">

可透過在 `config.yaml` 中加入 `cache` 鍵來啟用快取

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-1}

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

#### 步驟 2：將 Qdrant 憑證加入您的 .env {#step-2-add-qdrant-credentials-to-your-env}

```shell
QDRANT_API_KEY = "16rJUMBRx*************"
QDRANT_API_BASE = "https://5392d382-45*********.cloud.qdrant.io"
```

#### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config-1}

```shell
$ litellm --config /path/to/config.yaml
```

#### 步驟 4. 測試它 {#step-4-test-it}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**在語意快取為
1 時，預期在回應標頭中看到 `x-litellm-semantic-similarity`**

</TabItem>

<TabItem value="valkey-semantic" label="Valkey 語意快取">

在執行 [valkey-search](https://github.com/valkey-io/valkey-search) 模組的 Valkey instance 上進行語意快取，例如 AWS ElastiCache for Valkey。不需要 RediSearch 和 RedisVL。

:::info 需求

必須載入 `valkey-search` 模組（可透過 `MODULE LIST` / `FT._LIST` 檢查）。在 AWS ElastiCache 上，向量搜尋需要**以節點為基礎的 Valkey 8.2+ 叢集**；支援且建議使用 cluster-mode-disabled 的 node group，且具有 read replicas 的 primary 也可以，因為只是不支援水平分片。ElastiCache **Serverless 不支援向量搜尋**。此處不支援多 shard（cluster-mode-enabled）端點，因此請使用 cluster-mode-disabled 端點並垂直擴充。

:::

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-2}

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

#### 步驟 2：將 Valkey 憑證加入您的 .env {#step-2-add-valkey-credentials-to-your-env}

```shell
VALKEY_HOST = "your-valkey-host"
VALKEY_PORT = "6379"
VALKEY_PASSWORD = "your-password" # omit for passwordless / IAM-auth clusters
```

若使用具傳輸中加密（TLS）的 ElastiCache，請在 `cache_params` 下加入 `ssl: true`，或將 `cache_params.redis_url` 設為 `rediss://` URL，而不是 host 和 port。若要在本機執行 valkey-search，`docker run -d -p 6379:6379 valkey/valkey-bundle:8.1`。

#### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config-2}

```shell
$ litellm --config /path/to/config.yaml
```

#### 步驟 4. 測試它 {#step-4-test-it-1}

```shell
curl -i http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "fake-openai-endpoint",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**在語意快取為
1 時，預期在回應標頭中看到 `x-litellm-semantic-similarity`**

</TabItem>

<TabItem value="s3" label="s3 快取">

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-3}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True
  cache_params: # set cache params for s3
    type: s3
    s3_bucket_name: cache-bucket-litellm # AWS Bucket Name for S3
    s3_region_name: us-west-2 # AWS Region Name for S3
    s3_aws_access_key_id: os.environ/AWS_ACCESS_KEY_ID # us os.environ/<variable name> to pass environment variables. This is AWS Access Key ID for S3
    s3_aws_secret_access_key: os.environ/AWS_SECRET_ACCESS_KEY # AWS Secret Access Key for S3
    s3_endpoint_url: https://s3.amazonaws.com # [OPTIONAL] S3 endpoint URL, if you want to use Backblaze/cloudflare s3 buckets
```

#### 步驟 2：使用 config 執行 proxy {#step-2-run-proxy-with-config}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="gcs" label="gcs 快取">

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-4}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True
  cache_params: # set cache params for gcs
    type: gcs
    gcs_bucket_name: cache-bucket-litellm # GCS Bucket Name for caching
    gcs_path_service_account: os.environ/GCS_PATH_SERVICE_ACCOUNT # use os.environ/<variable name> to pass environment variables. This is the path to your GCS service account JSON file
    gcs_path: cache/ # [OPTIONAL] GCS path prefix for cache objects
```

#### 步驟 2：將 GCS 憑證加入 .env {#step-2-add-gcs-credentials-to-env}

在您的 .env 檔案中設定 GCS 環境變數：

```shell
GCS_BUCKET_NAME="your-gcs-bucket-name"
GCS_PATH_SERVICE_ACCOUNT="/path/to/service-account.json"
```

#### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config-3}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="redis-sem" label="redis 語意快取">

可透過在 `config.yaml` 中加入 `cache` 鍵來啟用快取

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-5}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
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

#### 步驟 2：將 Redis 憑證加入 .env {#step-2-add-redis-credentials-to-env-1}

在您的作業系統環境中設定 `REDIS_URL` 或 `REDIS_HOST`，以啟用快取。

```shell
REDIS_URL = ""        # REDIS_URL='redis://username:password@hostname:port/database'
## OR ##
REDIS_HOST = ""       # REDIS_HOST='redis-18841.c274.us-east-1-3.ec2.cloud.redislabs.com'
REDIS_PORT = ""       # REDIS_PORT='18841'
REDIS_PASSWORD = ""   # REDIS_PASSWORD='liteLlmIsAmazing'
```

**其他 kwargs**  
您可以透過在作業系統
環境中儲存變數加上值，傳入任何額外的 redis.Redis 引數，如下所示：

```shell
REDIS_<redis-kwarg-name> = ""
```

#### 步驟 3：使用 config 執行 proxy {#step-3-run-proxy-with-config-4}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="local" label="記憶體內快取">

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-6}

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: local
```

#### 步驟 2：使用 config 執行 proxy {#step-2-run-proxy-with-config-1}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

<TabItem value="disk" label="磁碟快取">

#### 步驟 1：將 `cache` 加入 config.yaml {#step-1-add-cache-to-the-configyaml-7}

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: disk
    disk_cache_dir: /tmp/litellm-cache # OPTIONAL, default to ./.litellm_cache
```

#### 步驟 2：使用 config 執行 proxy {#step-2-run-proxy-with-config-2}

```shell
$ litellm --config /path/to/config.yaml
```

</TabItem>

</Tabs>

## 使用方式 {#usage}

### 基本 {#basic}

<Tabs>
<TabItem value="chat_completions" label="/chat/completions">

兩次送出相同的請求：

```shell
curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "gpt-3.5-turbo",
     "messages": [{"role": "user", "content": "write a poem about litellm!"}],
     "temperature": 0.7
   }'

curl http://0.0.0.0:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "gpt-3.5-turbo",
     "messages": [{"role": "user", "content": "write a poem about litellm!"}],
     "temperature": 0.7
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

### 動態快取控制 {#dynamic-cache-controls}

| 參數   | 類型             | 說明                                                                       |
| ----------- | ---------------- | --------------------------------------------------------------------------------- |
| `ttl`       | _選用(int)_  | 會依使用者定義的時間長度（以秒為單位）快取回應          |
| `s-maxage`  | _選用(int)_  | 只會接受落在使用者定義範圍內（以秒為單位）的快取回應 |
| `no-cache`  | _選用(bool)_ | 不會將回應儲存在快取中。                                             |
| `no-store`  | _選用(bool)_ | 不會快取回應                                                       |
| `namespace` | _選用(str)_  | 會在使用者定義的命名空間下快取回應                            |

每個快取參數都可針對每個請求進行控制。以下是各參數的範例：

### `ttl` {#ttl-1}

設定回應要快取多久（以秒為單位）。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-3.5-turbo",
    extra_body={
        "cache": {
            "ttl": 300  # Cache response for 5 minutes
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"ttl": 300},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `s-maxage` {#s-maxage}

只接受在指定年齡範圍內（以秒為單位）的快取回應。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-3.5-turbo",
    extra_body={
        "cache": {
            "s-maxage": 600  # Only use cache if less than 10 minutes old
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"s-maxage": 600},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `no-cache` {#no-cache}

強制取得新的回應，略過快取。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-3.5-turbo",
    extra_body={
        "cache": {
            "no-cache": True  # Skip cache check, get fresh response
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"no-cache": true},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `no-store` {#no-store}

不會將回應儲存在快取中。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-3.5-turbo",
    extra_body={
        "cache": {
            "no-store": True  # Don't cache this response
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"no-store": true},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

### `namespace` {#namespace-1}

將回應儲存在特定的快取命名空間下。

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://0.0.0.0:4000"
)

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello"}],
    model="gpt-3.5-turbo",
    extra_body={
        "cache": {
            "namespace": "my-custom-namespace"  # Store in custom namespace
        }
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"namespace": "my-custom-namespace"},
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

</TabItem>
</Tabs>

## 設定 proxy 的快取，但不在實際的 llm api 請求上啟用 {#set-cache-for-proxy-but-not-on-the-actual-llm-api-call}

如果您只想啟用像是速率限制與跨多個
實例的負載平衡等功能，請使用此項。

設定 `supported_call_types: []` 以停用實際 api 請求上的快取。

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    supported_call_types: []
```

## 快取除錯 - `/cache/ping` {#debugging-caching---cacheping}

LiteLLM Proxy 提供一個 `/cache/ping` 端點，用來測試快取是否如預期運作

**使用方式**

```shell
curl --location 'http://0.0.0.0:4000/cache/ping'  -H "Authorization: Bearer sk-1234"
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

## 進階 {#advanced}

### 控制快取啟用的請求類型 - （`/chat/completion`、`/embeddings` 等） {#control-call-types-caching-is-on-for---chatcompletion-embeddings-etc}

預設情況下，所有請求類型都會啟用快取。您可以透過在 `cache_params` 中設定 `supported_call_types`，來控制哪些請求類型啟用快取。

**快取只會對 `supported_call_types` 中指定的請求類型啟用**

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    supported_call_types:
      ["acompletion", "atext_completion", "aembedding", "atranscription"]
      # /chat/completions, /completions, /embeddings, /audio/transcriptions
```

### 在 config.yaml 上設定快取參數 {#set-cache-params-on-configyaml}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
  - model_name: text-embedding-ada-002
    litellm_params:
      model: text-embedding-ada-002

litellm_settings:
  set_verbose: True
  cache: True # set cache responses to True, litellm defaults to using a redis cache
  cache_params: # cache_params are optional
    type: "redis" # The type of cache to initialize. Can be "local", "redis", "s3", or "gcs". Defaults to "local".
    host: "localhost" # The host address for the Redis cache. Required if type is "redis".
    port: 6379 # The port number for the Redis cache. Required if type is "redis".
    password: "your_password" # The password for the Redis cache. Required if type is "redis".

    # Optional configurations
    supported_call_types:
      ["acompletion", "atext_completion", "aembedding", "atranscription"]
      # /chat/completions, /completions, /embeddings, /audio/transcriptions
```

### 刪除快取鍵 - `/cache/delete` {#deleting-cache-keys---cachedelete}

若要刪除快取鍵，請向 `/cache/delete` 發送包含您要刪除之 `keys` 的請求

範例

```shell
curl -X POST "http://0.0.0.0:4000/cache/delete" \
  -H "Authorization: Bearer sk-1234" \
  -d '{"keys": ["586bf3f3c1bf5aecb55bd9996494d3bbc69eb58397163add6d49537762a7548d", "key2"]}'
```

```shell
# {"status":"success"}
```

#### 檢視回應中的快取鍵 {#viewing-cache-keys-from-responses}

您可以在回應標頭中查看 cache_key，在命中快取時，快取鍵會以 `x-litellm-cache-key` 回應標頭的形式傳送

```shell
curl -i --location 'http://0.0.0.0:4000/chat/completions' \
    --header 'Authorization: Bearer sk-1234' \
    --header 'Content-Type: application/json' \
    --data '{
    "model": "gpt-3.5-turbo",
    "user": "ishan",
    "messages": [
        {
        "role": "user",
        "content": "what is litellm"
        }
    ],
}'
```

來自 litellm proxy 的回應

```json
date: Thu, 04 Apr 2024 17:37:21 GMT
content-type: application/json
x-litellm-cache-key: 586bf3f3c1bf5aecb55bd9996494d3bbc69eb58397163add6d49537762a7548d

{
    "id": "chatcmpl-9ALJTzsBlXR9zTxPvzfFFtFbFtG6T",
    "choices": [
        {
            "finish_reason": "stop",
            "index": 0,
            "message": {
                "content": "I'm sorr.."
                "role": "assistant"
            }
        }
    ],
    "created": 1712252235,
}

```

### **將快取預設關閉 - 僅在選用時啟用 ** {#set-caching-default-off---opt-in-only-}

1. **將 `mode: default_off` 設為快取**

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

# default off mode
litellm_settings:
  set_verbose: True
  cache: True
  cache_params:
    mode: default_off # 👈 Key change cache is default_off
```

2. **在快取預設關閉時選用啟用快取**

<Tabs>
<TabItem value="openai" label="OpenAI Python SDK">

```python
import os
from openai import OpenAI

client = OpenAI(api_key=<litellm-api-key>, base_url="http://0.0.0.0:4000")

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say this is a test",
        }
    ],
    model="gpt-3.5-turbo",
    extra_body = {        # OpenAI python accepts extra args in extra_body
        "cache": {"use-cache": True}
    }
)
```

</TabItem>

<TabItem value="curl" label="curl">

```shell
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-3.5-turbo",
    "cache": {"use-cache": True}
    "messages": [
      {"role": "user", "content": "Say this is a test"}
    ]
  }'
```

</TabItem>

</Tabs>

## Redis 最大連線數 {#redis-max_connections}

您可以在 Redis 的 `cache_params` 中設定 `max_connections` 參數。這會直接傳遞給 Redis 用戶端，並控制連線池中的最大同時連線數。如果您看到像 `No connection available` 這樣的錯誤，請嘗試增加這個值：

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    max_connections: 100
```

## proxy config.yaml 上支援的 `cache_params` {#supported-cache_params-on-proxy-configyaml}

```yaml
cache_params:
  # ttl
  ttl: Optional[float]
  default_in_memory_ttl: Optional[float]
  default_in_redis_ttl: Optional[float]
  max_connections: Optional[Int]

  # Type of cache (options: "local", "redis", "s3", "gcs")
  type: s3

  # List of litellm call types to cache for
  # Options: "completion", "acompletion", "embedding", "aembedding"
  supported_call_types:
    ["acompletion", "atext_completion", "aembedding", "atranscription"]
    # /chat/completions, /completions, /embeddings, /audio/transcriptions

  # Redis cache parameters
  host: localhost # Redis server hostname or IP address
  port: "6379" # Redis server port (as a string)
  password: secret_password # Redis server password
  namespace: Optional[str] = None,

  # GCP IAM Authentication for Redis
  gcp_service_account: "projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com" # GCP service account for IAM authentication
  gcp_ssl_ca_certs: "./server-ca.pem" # Path to SSL CA certificate file for GCP Memorystore Redis
  ssl: true # Enable SSL for secure connections
  ssl_cert_reqs: null # Set to null for self-signed certificates
  ssl_check_hostname: false # Set to false for self-signed certificates

  # S3 cache parameters
  s3_bucket_name: your_s3_bucket_name # Name of the S3 bucket
  s3_region_name: us-west-2 # AWS region of the S3 bucket
  s3_api_version: 2006-03-01 # AWS S3 API version
  s3_use_ssl: true # Use SSL for S3 connections (options: true, false)
  s3_verify: true # SSL certificate verification for S3 connections (options: true, false)
  s3_endpoint_url: https://s3.amazonaws.com # S3 endpoint URL
  s3_aws_access_key_id: your_access_key # AWS Access Key ID for S3
  s3_aws_secret_access_key: your_secret_key # AWS Secret Access Key for S3
  s3_aws_session_token: your_session_token # AWS Session Token for temporary credentials

  # GCS cache parameters
  gcs_bucket_name: your_gcs_bucket_name # Name of the GCS bucket
  gcs_path_service_account: /path/to/service-account.json # Path to GCS service account JSON file
  gcs_path: cache/ # [OPTIONAL] GCS path prefix for cache objects
```

## 供應者專屬選用參數快取 {#provider-specific-optional-parameters-caching}

預設情況下，LiteLLM 只會在快取鍵中包含標準 OpenAI 參數。不過，某些提供者（例如 Vertex AI）會使用會影響輸出但未納入標準快取鍵生成的額外參數。

### 啟用提供者專屬參數快取 {#enable-provider-specific-parameter-caching}

將此設定加入您的 `config.yaml`，以將提供者專屬的選用參數納入快取鍵：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: "redis"
  enable_caching_on_provider_specific_optional_params: True  # Include provider-specific params in cache keys
```
## 進階 - 使用者 api key 快取 ttl {#advanced---user-api-key-cache-ttl}

設定記憶體內快取儲存金鑰物件的時間長度（可避免 db 請求）

```yaml
general_settings:
  user_api_key_cache_ttl: <your-number> #time in seconds
```

預設此值為 60 秒。
