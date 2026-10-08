import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

# AWS ElastiCache IAM 驗證 {#aws-elasticache-iam-authentication}

使用 IAM 驗證將 LiteLLM 的 Redis 快取連接到 AWS ElastiCache（Redis OSS 或 Valkey），
讓設定檔、環境或祕密儲存中都不會存在任何 Redis 密碼

## 為什麼要使用它 {#why-use-it}

ElastiCache 和 Valkey 使用 Redis 協定，因此 LiteLLM 一直都能與它們通訊。
先前缺少的是驗證流程。使用 IAM 驗證時，用戶端會以短效 AWS
SigV4 權杖取代密碼，且 ElastiCache 會在每次
連線時依據您的 IAM 政策進行驗證

這帶來了靜態 Redis 密碼無法提供的四項優勢。存取權是由 IAM 而非共享祕密授予，因此只要
解除政策繫結即可撤銷，而不必輪換密碼並重新部署
每個複本。每次連線嘗試都可追溯到某個 IAM 主體。權杖本身
有效期為十五分鐘，且每次新連線都會重新簽署，因此洩漏的權杖幾乎毫無價值。
而且由於簽署憑證來自標準 AWS 憑證鏈，執行於 IRSA、EC2 執行個體設定檔或 ECS 任務角色之下的閘道都能自行取得已輪換的憑證，
無需重新啟動

在這項功能出現之前，啟用 IAM 驗證意味著要將 `redis-py` 的 Python 憑證提供者
物件交出去，而 YAML 設定無法表達這件事。維運人員必須修補 LiteLLM 或撰寫自訂
整合。現在只需要四個設定

## 需求 {#requirements}

快取必須啟用傳輸中加密。LiteLLM 在啟用 IAM 驗證但連線為明文時會拒絕啟動，而不是靜默降級，因此 `ssl: true` 是必要的。ElastiCache
Serverless 一律會加密傳輸中的資料；對於自行設計的叢集，您必須以
`--transit-encryption-enabled` 建立它

您還需要已安裝 `boto3`，其內含 `litellm[proxy]`，以及以 IAM 模式建立的 ElastiCache 使用者。ElastiCache
要求這類使用者的名稱與 id 必須相同

## 操作說明 {#walkthrough}

這會在 EKS 上設定一個 LiteLLM proxy，透過 IRSA 對 ElastiCache Serverless Valkey 快取進行驗證。
請在整個過程中以您自己的帳號 id、區域與名稱替換

### 1. 在 IAM 模式中建立一個 ElastiCache 使用者 {#1-create-an-elasticache-user-in-iam-mode}

使用者名稱與使用者 id 必須相符，而 access string 會控制 proxy 在
Redis 內可執行的操作。`on ~* +@all` 會授予整個 keyspace 的權限，這正是回應快取所預期的

```shell
aws elasticache create-user \
  --user-id litellm-cache \
  --user-name litellm-cache \
  --engine valkey \
  --authentication-mode Type=iam \
  --access-string "on ~* +@all"
```

### 2. 將使用者放入使用者群組並將其附加到快取 {#2-put-the-user-in-a-user-group-and-attach-it-to-the-cache}

每個使用者群組都需要一個名為 `default` 的成員。若您尚未為此引擎建立一個，
請建立一個停用的預留位置，讓實際存取走您的 IAM 使用者

```shell
aws elasticache create-user-group \
  --user-group-id litellm-cache-users \
  --engine valkey \
  --user-ids default-placeholder litellm-cache

aws elasticache create-serverless-cache \
  --serverless-cache-name litellm-cache \
  --engine valkey \
  --user-group-id litellm-cache-users \
  --security-group-ids sg-0123456789abcdef0 \
  --subnet-ids subnet-0123456789abcdef0 subnet-0fedcba9876543210
```

若要將群組附加到已存在的快取，請改用 `modify-serverless-cache --user-group-id`
或 `modify-replication-group --user-group-ids`

### 3. 將 `elasticache:Connect` 授權給 proxy 執行所用的角色 {#3-grant-elasticacheconnect-to-the-role-the-proxy-runs-as}

政策必須同時指定快取與使用者。只授予其中之一會在
連線時失敗並關閉

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "elasticache:Connect",
      "Resource": [
        "arn:aws:elasticache:us-east-1:123456789012:serverlesscache:litellm-cache",
        "arn:aws:elasticache:us-east-1:123456789012:user:litellm-cache"
      ]
    }
  ]
}
```

將該政策附加到您的服務帳號所假設的 IAM 角色，並註記服務帳號以便
Pod 取得它

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: litellm
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/litellm-proxy
```

對於自行設計的叢集，快取 ARN 為
`arn:aws:elasticache:<region>:<account>:replicationgroup:<replication-group-id>`

### 4. 將 LiteLLM 指向快取 {#4-point-litellm-at-the-cache}

對於 ElastiCache Serverless 與任何已啟用叢集模式的快取，請使用 `redis_startup_nodes`，因為兩者
都需要具備叢集感知能力的用戶端。`aws_iam_cache_name` 是快取的名稱，而不是其端點主機名稱，
因為被簽署的是該名稱

<Tabs>

<TabItem value="serverless" label="Serverless">

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    redis_startup_nodes:
      [{ "host": "litellm-cache-abc123.serverless.use1.cache.amazonaws.com", "port": 6379 }]
    ssl: true
    aws_iam_auth: true
    aws_iam_user_name: litellm-cache
    aws_iam_cache_name: litellm-cache
    aws_iam_region: us-east-1
    aws_iam_serverless: true
```

</TabItem>

<TabItem value="self-designed" label="自行設計的叢集">

對於已停用叢集模式的複寫群組，請將 `host` 指向主要端點，並讓
`aws_iam_serverless` 保持未設定。`aws_iam_cache_name` 是複寫群組 id

```yaml
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: master.litellm-cache.abc123.use1.cache.amazonaws.com
    port: 6379
    ssl: true
    aws_iam_auth: true
    aws_iam_user_name: litellm-cache
    aws_iam_cache_name: litellm-cache
    aws_iam_region: us-east-1
```

</TabItem>

<TabItem value="env" label="環境變數">

每個設定都有一個以 `REDIS_` 為前綴的環境變數對應項，當值來自
祕密管理系統或 Helm values 檔時，這會是更合適的選擇

```shell
REDIS_CLUSTER_NODES='[{"host": "litellm-cache-abc123.serverless.use1.cache.amazonaws.com", "port": 6379}]'
REDIS_SSL="True"
REDIS_AWS_IAM_AUTH="True"
REDIS_AWS_IAM_USER_NAME="litellm-cache"
REDIS_AWS_IAM_CACHE_NAME="litellm-cache"
REDIS_AWS_IAM_REGION="us-east-1"
REDIS_AWS_IAM_SERVERLESS="True"
```

</TabItem>

</Tabs>

### 5. 部署並驗證 {#5-roll-it-out-and-verify}

透過 proxy 對快取進行 ping。健康的回應表示 SigV4 權杖已簽署、已被
ElastiCache 接受，且寫入成功往返

```shell
curl -s -X GET 'http://localhost:4000/cache/ping' \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

```json
{
  "status": "healthy",
  "cache_type": "redis",
  "ping_response": true,
  "set_cache_response": "success"
}
```

接著以相同的 completion 送出兩次，確認快取確實正在提供流量。第二次
呼叫會回傳相同的 response id，且耗時只是一小部分

```shell
curl -s -X POST 'http://localhost:4000/v1/chat/completions' \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}], "temperature": 0}'
```

## 設定 {#settings}

| 設定 | 必要 | 說明 |
| --- | --- | --- |
| `aws_iam_auth` | 是 | 開啟 ElastiCache IAM 驗證。接受 bool 或 truthy 字串 |
| `aws_iam_user_name` | 是 | ElastiCache 使用者名稱，必須等於其使用者 id |
| `aws_iam_cache_name` | 是 | Serverless 快取名稱或複寫群組 id。這會被簽署，因此不是端點主機名稱 |
| `aws_iam_region` | 否 | 用於簽署的區域。會回退到 `AWS_REGION`，接著是 `AWS_DEFAULT_REGION` |
| `aws_iam_serverless` | 否 | 設定於 ElastiCache Serverless 快取。會將 `ResourceType=ServerlessCache` 加入已簽署的請求 |

`ssl: true` 也必須一併設定。LiteLLM 在啟用 IAM 驗證但
未使用 TLS，或缺少任何必要設定時，會在啟動時直接拋出錯誤，因此設定錯誤會立即顯示，而不是在
負載下演變成驗證失敗

## 注意事項 {#notes}

AWS 憑證會透過標準 boto3 鏈解析，因此 IRSA、執行個體設定檔、ECS 任務
角色、`AWS_PROFILE` 以及靜態金鑰都能在無需額外設定的情況下運作。LiteLLM 會保留已解析的
憑證物件，而不是其快照，這正是可輪換憑證
來源能在長時間執行的 proxy 中持續運作的原因

如果您同時設定 GCP IAM（`gcp_service_account`）或 Azure AD（`azure_redis_ad_token`）與 AWS
IAM，GCP 或 Azure 路徑會勝出，而 LiteLLM 會記錄警告。請只設定一個

提供您自己的 `credential_provider` 會覆寫上述全部內容，這仍是
LiteLLM 未建模之驗證流程的逃生出口

## 疑難排解 {#troubleshooting}

`AWS ElastiCache IAM Redis authentication requires TLS` 代表 `ssl: true` 不在
`cache_params` 中，或是您提供的 `url` 使用的是 `redis://` 架構，而不是 `rediss://`

`AWS ElastiCache IAM Redis authentication requires: <setting>` 會列出您遺漏的設定

Redis 回傳的 `invalid username-password pair or user is disabled` 代表權杖格式正確，但
AWS 拒絕了它。常見原因是與快取不相符的 `aws_iam_cache_name`、未加入與該快取相連使用者群組的使用者，或 IAM 政策缺少快取 ARN 或
使用者 ARN 其中之一

`Unable to resolve AWS credentials for ElastiCache IAM Redis authentication` 代表 boto3 鏈
沒有回傳任何內容，因此 Pod 未附加角色，或環境中沒有憑證

## 另請參閱 {#see-also}

關於 Redis 快取的其他所有內容，包括叢集拓樸、命名空間與 TLS，都在
[Redis and Valkey](./caching_redis.md)。關於 Memorystore，請參閱
[GCP Memorystore IAM Authentication](./gcp_memorystore_iam.md)；關於 Azure，請參閱
[Azure Redis Entra ID Authentication](./azure_redis_ad.md)
