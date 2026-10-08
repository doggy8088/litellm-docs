---
title: Redis 與 Valkey 快取
description: LiteLLM proxy 的 Redis 快取之憑證、命名空間、ACL 使用者、叢集與 sentinel 拓撲，以及 TLS。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Redis 與 Valkey 快取 {#redis-and-valkey-cache}

Redis 是 LiteLLM 的預設快取，也是唯一可在 workers 與 replicas 之間共享的快取。Valkey、AWS
ElastiCache 與 GCP Memorystore 都使用 Redis 協定，因此本頁內容也都適用於
它們。

## 將 proxy 連線至 Redis {#connect-the-proxy-to-redis}

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

請在您的作業系統環境中設定 `REDIS_URL` 或 `REDIS_HOST`，即可啟用快取。

  ```shell
  REDIS_URL = ""        # REDIS_URL='redis://username:password@hostname:port/database'
  ## OR ## 
  REDIS_HOST = ""       # REDIS_HOST='redis-18841.c274.us-east-1-3.ec2.cloud.redislabs.com'
  REDIS_PORT = ""       # REDIS_PORT='18841'
  REDIS_PASSWORD = ""   # REDIS_PASSWORD='liteLlmIsAmazing'
  REDIS_USERNAME = ""   # REDIS_USERNAME='my-redis-username' [OPTIONAL] if your redis server requires a username
  REDIS_SSL = "True"    # REDIS_SSL='True' to enable SSL by default is False
  ```

### 額外的 Redis kwargs {#additional-redis-kwargs}

:::info
使用 `REDIS_*` 環境變數來設定所有 Redis 用戶端程式庫參數。這是切換 Redis 設定的建議機制，因為它會自動將環境變數對應到 Redis client kwargs。
:::

您可以透過在作業系統環境中儲存變數加值，來傳入任何額外的 redis.Redis 參數，如下所示：

```shell
REDIS_<redis-kwarg-name> = ""
```

例如：
```shell
REDIS_SSL = "True"
REDIS_SSL_CERT_REQS = "None" 
REDIS_MAX_CONNECTIONS = "20"
```

變數名稱是 `REDIS_` 加上大寫的 kwarg 名稱，因此池大小是 `REDIS_MAX_CONNECTIONS`。沒有 `REDIS_CONNECTION_POOL_KWARGS` 這個變數；設定它不會有任何作用

:::warning
**注意**：對於非字串型別的 Redis 參數（例如整數、布林值或複雜物件），請避免使用 `REDIS_*` 環境變數，因為它們可能會在 Redis 用戶端初始化期間失敗。請改為在您的 router 設定中使用 `cache_kwargs` 來設定這類參數。
:::

[**查看它如何從環境中讀取**](https://github.com/BerriAI/litellm/blob/4d7ff1b33b9991dcf38d821266290631d9bcd2dd/litellm/_redis.py#L40)

接著執行 proxy：

```shell
$ litellm --config /path/to/config.yaml
```

## 命名空間 {#namespace}

如果您想為金鑰建立某個資料夾，可以設定 namespace，如下所示：

```yaml
litellm_settings:
  cache: true
  cache_params: # set cache params for redis
    type: redis
    namespace: "litellm.caching.caching"
```

而金鑰會像這樣儲存：

```
litellm.caching.caching:<hash>
```

## 受限制的 ACL 使用者（Redis 7+ / Valkey） {#restricted-acl-users-redis-7--valkey}

如果您的安全政策要求 proxy 以最小權限使用者而非 `default` 連線，請設定 namespace（如上），並授予該使用者該 namespace 的 key pattern 與 channel pattern，以及它所需的命令：

```bash
ACL SETUSER litellm-proxy on '>your-password' '~litellm:*' '&litellm:*' +@all
```

將 `litellm` 替換為您的 namespace。設定 namespace 後，proxy 寫入的每個 key 都會位於 `<namespace>:` 底下，因此 `~<namespace>:*` 便可涵蓋全部。若未設定 namespace，proxy 的 keys 會有各式各樣的名稱，因此沒有實際可行的 key pattern 可供 ACL 限定範圍

channel 授權也很重要：Redis 7+ 與 Valkey 會以 `resetchannels` 建立 ACL 使用者，這會拒絕所有 pub/sub channels。proxy 會訂閱 channels 以進行 config 同步與 auth 快取失效處理，若沒有 `&<namespace>:*`（或未設定 namespace 時的 `&litellm_proxy.*`），您的 logs 會每隔幾秒重複顯示 `No permissions to access a channel; reconnecting in 5s`，而 config 變更只會在定期重新載入時傳播

在 ACL 範圍設定上，還有另外兩件事需要知道：

- `general_settings.coordination_redis` 區塊（用來將 coordination 指向與您的 response cache 不同的 Redis）也接受 `namespace`，因此其使用者也可以用同樣方式限制範圍
- 當 coordination Redis 僅透過 `REDIS_HOST` / `REDIS_PORT` 環境變數設定（沒有 `cache_params` redis 區塊）時，它無法帶有 namespace，因此其 keys 不會加上前綴，而連線使用者需要未限定範圍的 key 授權

如果您在 proxy logs 中看到 `No permissions to access a key`，而 spend tracking 反覆記錄 `Restoring N transaction sets to in-memory queues`，表示連線使用者的 ACL 少了上述其中一項授權。在沒有 [namespace 分隔符修正](https://github.com/BerriAI/litellm/pull/38403) 的 proxy 版本上，內部 keys 若其字面名稱以 namespace 字串開頭（例如 namespace `litellm` 下的 `litellm_spend_update_buffer`）會寫到 namespace 之外，因此即使權限已設定仍會被拒絕；如果您在 Redis `ACL LOG` 中看到被拒絕的 keys 沒有前綴，請升級

## Redis 叢集 {#redis-cluster}

可透過在 `cache_params` 下於 `config.yaml` 的 `redis_startup_nodes` 中設定，或使用 `REDIS_CLUSTER_NODES` 環境變數（一個 `{"host": ..., "port": ...}` 物件的 JSON 清單），將 proxy 指向 Redis Cluster。兩者擇一即可。

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

您可以在 .env 中設定 `REDIS_CLUSTER_NODES`，以在 .env 中設定 redis cluster

**範例 `REDIS_CLUSTER_NODES`** 值

```
REDIS_CLUSTER_NODES = "[{"host": "127.0.0.1", "port": "7001"}, {"host": "127.0.0.1", "port": "7003"}, {"host": "127.0.0.1", "port": "7004"}, {"host": "127.0.0.1", "port": "7005"}, {"host": "127.0.0.1", "port": "7006"}, {"host": "127.0.0.1", "port": "7007"}]"
```

:::note

用於在 .env 中設定 redis cluster nodes 的 python 示範腳本：

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

## Redis Sentinel {#redis-sentinel}

可透過在 `cache_params` 的 `config.yaml` 中設定 `service_name` 與 `sentinel_nodes`，或使用 `REDIS_SENTINEL_NODES`、`REDIS_SERVICE_NAME` 與 `REDIS_SENTINEL_PASSWORD` 環境變數，將 proxy 指向 Redis Sentinel deployment。

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

您可以在 .env 中設定 `REDIS_SENTINEL_NODES`，以在 .env 中設定 redis sentinel

**範例 `REDIS_SENTINEL_NODES`** 值

```env
REDIS_SENTINEL_NODES='[["localhost", 26379]]'
REDIS_SERVICE_NAME = "mymaster"
REDIS_SENTINEL_PASSWORD = "password"
```

:::note

用於在 .env 中設定 redis cluster nodes 的 python 示範腳本：

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

## TTL {#ttl}

```yaml
litellm_settings:
  cache: true
  cache_params: # set cache params for redis
    type: redis
    ttl: 600 # will be cached on redis for 600s
    # default_in_memory_ttl: Optional[float], default is None. time in seconds.
    # default_in_redis_ttl: Optional[float], default is None. time in seconds.
```

## SSL {#ssl}

只要在您的 .env 中設定 `REDIS_SSL="True"`，LiteLLM 就會讀取它。

```env
REDIS_SSL="True"
```

若要快速測試，您也可以使用 REDIS_URL，例如：

```
REDIS_URL="rediss://.."
```

但我們**不**建議在正式環境中使用 REDIS_URL。我們注意到
相較於使用 redis_host、port 等設定，前者與後者之間有效能差異。

## IAM 驗證 {#iam-authentication}

兩大主要受管 Redis 產品都能以短效期的簽署 token 來驗證 proxy，
而不是使用密碼，因此在您的設定或 secrets 儲存庫中不會存在任何 Redis 密碼。請參閱
[AW S ElastiCache IAM Authentication](./elasticache_iam.md) 了解 ElastiCache 與 Valkey，並參閱
[GCP Memorystore IAM Authentication](./gcp_memorystore_iam.md) 了解 Memorystore。

## Redis max_connections {#redis-max_connections}

您可以在 Redis 的 `cache_params` 中設定 `max_connections` 參數。這會直接傳遞給 Redis client，並控制池中同時連線數的上限。如果您看到像 `No connection available` 這樣的錯誤，請嘗試提高此值：

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    max_connections: 100
```

`cache_params` 只會調整 response cache client 的大小。proxy 還可以持有另外兩個 Redis client，每個都有自己的 pool：來自 `general_settings.coordination_redis` 的 coordination Redis（spend tracking、跨 pod rate limits、pod locks）以及來自 `router_settings.redis_host` / `redis_port` / `redis_password` 的 router Redis。請在那些區塊內設定 `max_connections` 來調整它們的大小；`coordination_redis` 會將任何額外 key 傳遞給 Redis client，而 `router_settings.cache_kwargs` 也會對 router client 做同樣的事：

```yaml
general_settings:
  coordination_redis:
    host: os.environ/REDIS_HOST
    port: 6379
    max_connections: 100

router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: 6379
  cache_kwargs:
    max_connections: 100
```

若關閉 response caching 且沒有 `coordination_redis` 區塊，coordination client 會僅根據 `REDIS_*` 環境變數建立，因此 `REDIS_MAX_CONNECTIONS` 是調整其 pool 的方式

## Redis socket_timeout {#redis-socket_timeout}

proxy cache client 在每個 Redis 命令上最多等待 `socket_timeout` 秒，超過後就會引發逾時。預設為 **5.0 s**，由 `RedisCache.__init__` 在 `litellm/caching/redis_cache.py` 中設定。請用 `cache_params.socket_timeout` 設定；其值會原樣傳遞給 Redis client，並適用於所有拓撲（單機、`REDIS_URL`、叢集與 Sentinel）：

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    socket_timeout: 1.0 # seconds per Redis command, default 5.0
```

coordination 與 router clients 各自有自己的 5.0 s 預設值，並從各自的區塊讀取相同的 key。spend tracking 或 rate limiting 在負載下記錄到的 `Timeout reading from <host>:6379` 來自 coordination client，因此應在那裡提高 `socket_timeout`，而不是在 `cache_params` 中：

```yaml
general_settings:
  coordination_redis:
    host: os.environ/REDIS_HOST
    port: 6379
    socket_timeout: 10.0

router_settings:
  redis_host: os.environ/REDIS_HOST
  redis_port: 6379
  cache_kwargs:
    socket_timeout: 10.0
```

`REDIS_SOCKET_TIMEOUT` 環境變數（預設 `0.1`）不會變更快取用戶端的逾時設定。LiteLLM 只會將它套用到未明確設定 `socket_timeout` 的 Redis 用戶端，而目前這只會出現在 `litellm/_redis.py` 的 Sentinel 連線路徑中。proxy 的快取用戶端一律會傳入自己的 `socket_timeout`（5.0 秒預設值或您的 `cache_params` 值），而呼叫端的 kwarg 會優先於 `REDIS_*` 環境對應，因此在設定 `REDIS_SOCKET_TIMEOUT` 時，快取用戶端仍會以 5.0 秒執行。協調與路由用戶端也是以相同方式建立，因此也適用相同情況。當快取用戶端也透過 Sentinel 連線時，情況亦然，因為在 Sentinel 預設值原本會套用之前，它的 kwarg 就已經存在。唯一的例外是 `socket_timeout: null` 中的 `cache_params`，它會移除該 kwarg，並讓 `REDIS_SOCKET_TIMEOUT` 通過

## 虛擬金鑰驗證快取（Redis） {#virtual-key-authentication-cache-redis}

當 proxy 驗證 **virtual key**（客戶 API 金鑰）時，結果會被快取，因此不會在每次請求時都查詢資料庫。預設情況下，該快取**只存在於每個 worker process** 中，因此在部署後，新 pod 或額外的 Uvicorn worker 會各自暖機自己的快取，在快取暖機前可能觸發更多 DB 讀取。

設定 `litellm_settings.enable_redis_auth_cache: true`，即可將 virtual key 驗證資料鏡像到與 `litellm_settings.cache` / `cache_params` 下所設定的**相同 Redis 實例**。如此一來，workers 與 replicas 就能在整個叢集中共用已快取的驗證項目。

**需求**

- `litellm_settings.cache` 必須是 **`true`**（proxy 的 Redis 會在快取設定期間初始化）。請參閱 [所有設定](./config_settings)。
- `cache_params.type` 必須是 **`redis`**（或依您的快取設定使用 Redis Cluster）；驗證快取會附加到該 Redis 用戶端。請參閱 [支援的 `cache_params`](./caching_settings.md#supported-cache_params-on-proxy-configyaml)。
- 可選擇設定 **`general_settings.user_api_key_cache_ttl`**（秒）：啟用 Redis 驗證快取時，TTL 會同時套用到記憶體層與 Redis 層，因此過期的金鑰會一致地逾時。

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

啟動記錄會區分這兩種模式：在設定 `enable_redis_auth_cache: true` 時，您應該會看到一則訊息，指出 virtual key 查詢會在 workers 之間共用。

:::

### 金鑰物件的快取 TTL {#cache-ttl-for-the-key-object}

設定記憶體快取儲存金鑰物件的時間長度（可避免 DB 請求）

```yaml
general_settings:
  user_api_key_cache_ttl: <your-number> #time in seconds
```

預設此值設為 60 秒。

### 金鑰物件的快取容量 {#cache-capacity-for-the-key-object}

記憶體層預設每個 worker 可保留 200 個項目，由 virtual keys、teams、users、end users 和 memberships 共用。當活躍金鑰數量超過此數時，項目會在請求之間被逐出，而每次驗證查詢都會落回 DB。請提高上限以符合您的金鑰數量：

```yaml
general_settings:
  user_api_key_cache_max_size: 5000 # entries per worker, must be a positive integer
```

同一個設定旋鈕也可在執行時透過 Admin UI 的 Settings > Router Settings > General 編輯，或透過 `POST /config/field/update`；執行中的快取會在下一次設定重新載入時重新調整大小，無需重新啟動。於 `config.yaml` 中設定的值會優先於 DB 值
