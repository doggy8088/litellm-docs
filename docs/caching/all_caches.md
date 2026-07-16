import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 快取 - 記憶體內、Redis、s3、gcs、Redis 語意快取、磁碟 {#caching---in-memory-redis-s3-gcs-redis-semantic-cache-disk}

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/main/litellm/caching/caching.py)

:::info

- Proxy Server 的文件在這裡：[快取 Proxy Server](https://docs.litellm.ai/docs/proxy/caching)

- OpenAI/Anthropic Prompt Caching 請前往 [這裡](../completion/prompt_caching.md)

:::

## 初始化快取 - 記憶體內、Redis、s3 Bucket、gcs Bucket、Redis 語意、磁碟快取、Qdrant 語意 {#initialize-cache---in-memory-redis-s3-bucket-gcs-bucket-redis-semantic-disk-cache-qdrant-semantic}

<Tabs>

<TabItem value="redis" label="redis-cache">

安裝 redis
```shell
uv add redis
```

託管版本中，您可以在這裡設定您自己的 Redis DB：https://redis.io/try-free/

**基本 Redis 快取**

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

litellm.cache = Cache(type="redis", host=<host>, port=<port>, password=<password>)

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)
response2 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)

# response1 == response2, response 1 is cached
```

**GCP IAM Redis 驗證**

適用於使用 IAM 驗證的 GCP Memorystore Redis：

```shell
uv add google-cloud-iam
```

```python
import litellm
from litellm import completion
# For Redis Cluster with GCP IAM
from litellm.caching.redis_cluster_cache import RedisClusterCache

litellm.cache = RedisClusterCache(
    startup_nodes=[
        {"host": "10.128.0.2", "port": 6379},
        {"host": "10.128.0.2", "port": 11008},
    ],
    gcp_service_account="projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com",
    ssl=True,
    ssl_cert_reqs=None,
    ssl_check_hostname=False,
)

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)
response2 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)

# response1 == response2, response 1 is cached
```

**GCP IAM Redis 的環境變數**

您也可以將這些設定為環境變數：

```shell
export REDIS_HOST="10.128.0.2"
export REDIS_PORT="6379"
export REDIS_GCP_SERVICE_ACCOUNT="projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com"
export REDIS_SSL="False"
```

接著只要初始化：

```python
litellm.cache = Cache(type="redis")
```

:::info
請使用 `REDIS_*` 環境變數作為設定所有 Redis 用戶端程式庫參數的主要機制。此方法會自動將環境變數對應到 Redis 用戶端 kwargs，且是切換 Redis 設定的建議方式。
:::

:::warning
如果您需要傳入非字串的 Redis 參數（整數、布林值、複雜物件），請避免使用 `REDIS_*` 環境變數，因為它們在 Redis 用戶端初始化期間可能會失敗。請改為直接將它們作為 kwargs 傳入 `Cache()` 建構子。
:::

</TabItem>

<TabItem value="gcs" label="gcs-cache">

設定環境變數

```shell
GCS_BUCKET_NAME="my-cache-bucket"
GCS_PATH_SERVICE_ACCOUNT="/path/to/service_account.json"
```

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

litellm.cache = Cache(type="gcs", gcs_bucket_name="my-cache-bucket", gcs_path_service_account="/path/to/service_account.json")

response1 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)
response2 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)

# response1 == response2, response 1 is cached
```

</TabItem>

<TabItem value="s3" label="s3-cache">

安裝 boto3
```shell
uv add boto3
```

設定 AWS 環境變數

```shell
AWS_ACCESS_KEY_ID = "AKI*******"
AWS_SECRET_ACCESS_KEY = "WOl*****"
```

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

# pass s3-bucket name
litellm.cache = Cache(type="s3", s3_bucket_name="cache-bucket-litellm", s3_region_name="us-west-2")

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}]
)
response2 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}]
)

# response1 == response2, response 1 is cached
```

</TabItem>

<TabItem value="azureblob" label="azure-blob-cache">

安裝 azure-storage-blob 和 azure-identity
```shell
uv add azure-storage-blob azure-identity
```

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
from azure.identity import DefaultAzureCredential

# pass Azure Blob Storage account URL and container name
litellm.cache = Cache(type="azure-blob", azure_account_url="https://example.blob.core.windows.net", azure_blob_container="litellm")

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)
response2 = completion(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Tell me a joke."}]
)

# response1 == response2, response 1 is cached
```

</TabItem>

<TabItem value="redis-sem" label="redis-semantic cache">

安裝 redisvl 用戶端
```shell
uv add redisvl==0.4.1
```

託管版本中，您可以在這裡設定您自己的 Redis DB：https://redis.io/try-free/

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

random_number = random.randint(
    1, 100000
)  # add a random number to ensure it's always adding / reading from cache

print("testing semantic caching")
litellm.cache = Cache(
    type="redis-semantic",
    host=os.environ["REDIS_HOST"],
    port=os.environ["REDIS_PORT"],
    password=os.environ["REDIS_PASSWORD"],
    similarity_threshold=0.8, # similarity threshold for cache hits, 0 == no similarity, 1 = exact matches, 0.5 == 50% similarity
    ttl=120,
    redis_semantic_cache_embedding_model="text-embedding-ada-002", # this model is passed to litellm.embedding(), any litellm.embedding() model is supported here
)
response1 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response1: {response1}")

random_number = random.randint(1, 100000)

response2 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response2: {response1}")
assert response1.id == response2.id
# response1 == response2, response 1 is cached
```

</TabItem>

<TabItem value="qdrant-sem" label="qdrant-semantic cache">

您可以依照這裡的說明設定您自己的雲端 Qdrant 叢集：https://qdrant.tech/documentation/quickstart-cloud/

若要在本機設定 Qdrant 叢集，請依照：https://qdrant.tech/documentation/quickstart/
```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

random_number = random.randint(
    1, 100000
)  # add a random number to ensure it's always adding / reading from cache

print("testing semantic caching")
litellm.cache = Cache(
    type="qdrant-semantic",
    qdrant_api_base=os.environ["QDRANT_API_BASE"], 
    qdrant_api_key=os.environ["QDRANT_API_KEY"],
    qdrant_collection_name="your_collection_name", # any name of your collection
    similarity_threshold=0.7, # similarity threshold for cache hits, 0 == no similarity, 1 = exact matches, 0.5 == 50% similarity
    qdrant_quantization_config ="binary", # can be one of 'binary', 'product' or 'scalar' quantizations that is supported by qdrant
    qdrant_semantic_cache_embedding_model="text-embedding-ada-002", # this model is passed to litellm.embedding(), any litellm.embedding() model is supported here
    qdrant_semantic_cache_vector_size=1536, # vector size for the embedding model, must match the dimensionality of the embedding model used
)

response1 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response1: {response1}")

random_number = random.randint(1, 100000)

response2 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response2: {response2}")
assert response1.id == response2.id
# response1 == response2, response 1 is cached
```

</TabItem>

<TabItem value="valkey-sem" label="valkey-semantic cache">

當您的向量儲存是執行 [valkey-search](https://github.com/valkey-io/valkey-search) 模組的 Valkey 執行個體時請使用，例如 [AWS ElastiCache for Valkey](https://aws.amazon.com/elasticache/)。不需要 RediSearch 和 RedisVL；LiteLLM 會直接透過 Redis 協定驅動 valkey-search。

:::info Requirements

伺服器上必須已載入 `valkey-search` 模組（執行 `MODULE LIST` 並查看是否有 `search`，或 `FT._LIST`）。在 AWS ElastiCache 上，向量搜尋可用於**基於節點的 Valkey 8.2+ 叢集**；支援 cluster-mode-disabled 的節點群組，且是建議的目標，而具有讀取複本的主要節點也可以，因為只有水平分片不受支援。ElastiCache **Serverless 不支援向量搜尋**，因此 serverless 端點在此無法使用。此後端不支援多分片（cluster-mode-enabled）端點，因為非同步用戶端無法跨分片路由 `FT.*` 搜尋命令；請改為垂直擴充。

:::

若要在本機執行具備 valkey-search 的 Valkey 執行個體，`valkey/valkey-bundle` 映像檔已隨附該模組：

```shell
docker run -d -p 6379:6379 valkey/valkey-bundle:8.1
```

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

random_number = random.randint(
    1, 100000
)  # add a random number to ensure it's always adding / reading from cache

print("testing semantic caching")
litellm.cache = Cache(
    type="valkey-semantic",
    host=os.environ["VALKEY_HOST"],
    port=os.environ["VALKEY_PORT"],
    password=os.environ.get("VALKEY_PASSWORD"),  # omit for passwordless / IAM-auth clusters
    similarity_threshold=0.8, # similarity threshold for cache hits, 0 == no similarity, 1 = exact matches, 0.5 == 50% similarity
    ttl=120,
    valkey_semantic_cache_embedding_model="text-embedding-ada-002", # this model is passed to litellm.embedding(), any litellm.embedding() model is supported here
    valkey_semantic_cache_index_name="litellm_semantic_cache_index", # optional, defaults to litellm_semantic_cache_index
)
response1 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response1: {response1}")

random_number = random.randint(1, 100000)

response2 = completion(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "user",
            "content": f"write a one sentence poem about: {random_number}",
        }
    ],
    max_tokens=20,
)
print(f"response2: {response2}")
assert response1.id == response2.id
# response1 == response2, response 1 is cached
```

`VALKEY_HOST`、`VALKEY_PORT` 和 `VALKEY_PASSWORD` 會在未設定時回退為 `REDIS_HOST`、`REDIS_PORT` 和 `REDIS_PASSWORD`。對於啟用傳輸中加密（TLS）的 ElastiCache，請同時傳入 `ssl=True` 與 host 和 port，或傳入完整的 `redis_url="rediss://..."`。

</TabItem>

<TabItem value="in-mem" label="in memory cache">

### 快速入門 {#quick-start}

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
litellm.cache = Cache()

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)
response2 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)

# response1 == response2, response 1 is cached

```

</TabItem>

<TabItem value="disk" label="disk cache">

### 快速入門 {#quick-start-1}

安裝 disk caching 額外套件：

```shell
uv add "litellm[caching]"
```

接著您可以如下使用磁碟快取。

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache
litellm.cache = Cache(type="disk")

# Make completion calls
response1 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)
response2 = completion(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content": "Tell me a joke."}],
    caching=True
)

# response1 == response2, response 1 is cached

```

如果您將程式碼執行兩次，response1 將會使用第一次執行時儲存在快取檔案中的快取。

</TabItem>

</Tabs>

## 針對每次 LiteLLM 請求切換快取開啟 / 關閉  {#switch-cache-on--off-per-litellm-call}

LiteLLM 支援 4 種快取控制：

- `no-cache`：*Optional(bool)* 當 `True` 時，不會回傳快取回應，而是呼叫實際端點。 
- `no-store`：*Optional(bool)* 當 `True` 時，不會快取回應。 
- `ttl`：*Optional(int)* - 會將回應快取使用者自訂的時間長度（以秒為單位）。
- `s-maxage`：*Optional(int)* 只會接受在使用者自訂範圍內（以秒為單位）的快取回應。

[如果您需要更多，請告訴我們](https://github.com/BerriAI/litellm/issues/1218)
<Tabs>
<TabItem value="no-cache" label="No-Cache">

使用範例 `no-cache` - 當 `True` 時，不會回傳快取回應

```python
response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "user",
                "content": "hello who are you"
            }
        ],
        cache={"no-cache": True},
    )
```

</TabItem>

<TabItem value="no-store" label="No-Store">

使用範例 `no-store` - 當 `True` 時，不會快取回應。 

```python
response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "user",
                "content": "hello who are you"
            }
        ],
        cache={"no-store": True},
    )
```

</TabItem>

<TabItem value="ttl" label="ttl">
使用範例 `ttl` - 將回應快取 10 秒

```python
response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "user",
                "content": "hello who are you"
            }
        ],
        cache={"ttl": 10},
    )
```

</TabItem>

<TabItem value="s-maxage" label="s-maxage">
使用範例 `s-maxage` - 只會接受快取回應 60 秒

```python
response = litellm.completion(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "user",
                "content": "hello who are you"
            }
        ],
        cache={"s-maxage": 60},
    )
```

</TabItem>

</Tabs>

## 快取 Context Manager - 啟用、停用、更新快取 {#cache-context-manager---enable-disable-update-cache}
使用 context manager 以輕鬆啟用、停用與更新 litellm cache 

### 啟用快取 {#enabling-cache}

快速入門啟用
```python
litellm.enable_cache()
```

進階參數

```python
litellm.enable_cache(
    type: Optional[Literal["local", "redis", "s3", "gcs", "disk"]] = "local",
    host: Optional[str] = None,
    port: Optional[str] = None,
    password: Optional[str] = None,
    supported_call_types: Optional[
        List[Literal["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"]]
    ] = ["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"],
    **kwargs,
)
```

### 停用快取 {#disabling-cache}

關閉快取 
```python
litellm.disable_cache()
```

### 更新快取參數（Redis Host、Port 等） {#updating-cache-params-redis-host-port-etc}

更新快取參數

```python
litellm.update_cache(
    type: Optional[Literal["local", "redis", "s3", "gcs", "disk"]] = "local",
    host: Optional[str] = None,
    port: Optional[str] = None,
    password: Optional[str] = None,
    supported_call_types: Optional[
        List[Literal["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"]]
    ] = ["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"],
    **kwargs,
)
```

## 自訂快取金鑰： {#custom-cache-keys}
定義函式以回傳快取金鑰
```python
# this function takes in *args, **kwargs and returns the key you want to use for caching
def custom_get_cache_key(*args, **kwargs):
    # return key to use for your cache:
    key = kwargs.get("model", "") + str(kwargs.get("messages", "")) + str(kwargs.get("temperature", "")) + str(kwargs.get("logit_bias", ""))
    print("key for cache", key)
    return key

```

將您的函式設為 litellm.cache.get_cache_key
```python
from litellm.caching.caching import Cache

cache = Cache(type="redis", host=os.environ['REDIS_HOST'], port=os.environ['REDIS_PORT'], password=os.environ['REDIS_PASSWORD'])

cache.get_cache_key = custom_get_cache_key # set get_cache_key function for your cache

litellm.cache = cache # set litellm.cache to your cache 

```
## 如何撰寫自訂 add/get cache 函式 {#how-to-write-custom-addget-cache-functions}
### 1. 初始化快取  {#1-init-cache}
```python
from litellm.caching.caching import Cache
cache = Cache()
``` 

### 2. 定義自訂 add/get cache 函式  {#2-define-custom-addget-cache-functions}
```python
def add_cache(self, result, *args, **kwargs):
  your logic
  
def get_cache(self, *args, **kwargs):
  your logic
```

### 3. 將 cache add/get 函式指向您的 add/get 函式  {#3-point-cache-addget-functions-to-your-addget-functions}
```python
cache.add_cache = add_cache
cache.get_cache = get_cache
```

## 快取初始化參數 {#cache-initialization-parameters}

```python
def __init__(
    self,
    type: Optional[Literal["local", "redis", "redis-semantic", "valkey-semantic", "s3", "gcs", "disk"]] = "local",
    supported_call_types: Optional[
        List[Literal["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"]]
    ] = ["completion", "acompletion", "embedding", "aembedding", "atranscription", "transcription"],
    ttl: Optional[float] = None,
    default_in_memory_ttl: Optional[float] = None,

    # redis cache params
    host: Optional[str] = None,
    port: Optional[str] = None,
    password: Optional[str] = None,
    namespace: Optional[str] = None,
    default_in_redis_ttl: Optional[float] = None,
    redis_flush_size=None,
    
    # GCP IAM Redis authentication params
    gcp_service_account: Optional[str] = None,
    gcp_ssl_ca_certs: Optional[str] = None,
    ssl: Optional[bool] = None,
    ssl_cert_reqs: Optional[Union[str, None]] = None,
    ssl_check_hostname: Optional[bool] = None,

    # redis semantic cache params
    similarity_threshold: Optional[float] = None,
    redis_semantic_cache_embedding_model: str = "text-embedding-ada-002",
    redis_semantic_cache_index_name: Optional[str] = None,

    # valkey semantic cache params (valkey-search module, e.g. ElastiCache for Valkey)
    valkey_semantic_cache_embedding_model: str = "text-embedding-ada-002",
    valkey_semantic_cache_index_name: Optional[str] = None,

    # s3 Bucket, boto3 configuration
    s3_bucket_name: Optional[str] = None,
    s3_region_name: Optional[str] = None,
    s3_api_version: Optional[str] = None,
    s3_path: Optional[str] = None, # if you wish to save to a specific path
    s3_use_ssl: Optional[bool] = True,
    s3_verify: Optional[Union[bool, str]] = None,
    s3_endpoint_url: Optional[str] = None,
    s3_aws_access_key_id: Optional[str] = None,
    s3_aws_secret_access_key: Optional[str] = None,
    s3_aws_session_token: Optional[str] = None,
    s3_config: Optional[Any] = None,

    # disk cache params
    disk_cache_dir=None,

    # qdrant cache params
    qdrant_api_base: Optional[str] = None,
    qdrant_api_key: Optional[str] = None,
    qdrant_collection_name: Optional[str] = None,
    qdrant_quantization_config: Optional[str] = None,
    qdrant_semantic_cache_embedding_model="text-embedding-ada-002",

    qdrant_semantic_cache_vector_size: Optional[int] = None,
    **kwargs
):
```

## 記錄  {#logging}

快取命中會以 `kwarg["cache_hit"]` 的形式記錄在成功事件中。 

以下是存取它的範例： 

  ```python
  import litellm
from litellm.integrations.custom_logger import CustomLogger
from litellm import completion, acompletion, Cache

# create custom callback for success_events
class MyCustomHandler(CustomLogger):
    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time): 
        print(f"On Success")
        print(f"Value of Cache hit: {kwargs['cache_hit']"})

async def test_async_completion_azure_caching():
    # set custom callback
    customHandler_caching = MyCustomHandler()
    litellm.callbacks = [customHandler_caching]

    # init cache 
    litellm.cache = Cache(type="redis", host=os.environ['REDIS_HOST'], port=os.environ['REDIS_PORT'], password=os.environ['REDIS_PASSWORD'])
    unique_time = time.time()
    response1 = await litellm.acompletion(model="azure/chatgpt-v-2",
                            messages=[{
                                "role": "user",
                                "content": f"Hi 👋 - i'm async azure {unique_time}"
                            }],
                            caching=True)
    await asyncio.sleep(1)
    print(f"customHandler_caching.states pre-cache hit: {customHandler_caching.states}")
    response2 = await litellm.acompletion(model="azure/chatgpt-v-2",
                            messages=[{
                                "role": "user",
                                "content": f"Hi 👋 - i'm async azure {unique_time}"
                            }],
                            caching=True)
    await asyncio.sleep(1) # success callbacks are done in parallel
  ```
