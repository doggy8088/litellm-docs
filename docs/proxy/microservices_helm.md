# 微服務 Helm {#microservices-helm}

將 LiteLLM 作為**三個可獨立擴充的服務**執行 — 一個用於 LLM
流量的 `gateway`、一個用於管理/UI API 的 `backend`，以及一個靜態的 `ui` — 再加上一個
一次性的 `migrations` Job。

![參考架構：Amazon EKS 上的 LiteLLM — 在一個 ALB Ingress 後方的 gateway、backend 與 ui，搭配 Aurora Postgres、ElastiCache Redis、S3/CloudWatch，以及 Secrets Manager](/img/blog/componentized_deployment/eks_topline.png)

關於拆分 proxy 的動機（為何緩慢的 control-plane 查詢否則可能會回收提供推論服務的 pods），請參閱部落格文章
[*One Slow Dashboard Query Shouldn't Take Down Your LLM Traffic*](/blog/componentized-deployment)。

## 元件 {#components}

| 元件 | Port | 範圍 |
|---|---|---|
| **gateway** | 4000 | LLM data plane — `/chat/completions`, `/v1/messages`, embeddings, audio, batches, passthroughs, `/health`, `/metrics` |
| **backend** | 4001 | 管理/UI API — keys, users, teams, orgs, SSO, audit logs, **spend & usage analytics** |
| **ui** | 3000 | Next.js dashboard，由 nginx 提供的靜態匯出 |
| **migrations** | Job | `prisma migrate deploy`，作為 pre-install/pre-upgrade Helm hook 只執行一次 |

每個元件都有自己的 Deployment、Service、liveness/readiness
probes，以及 HorizontalPodAutoscaler — 某一個元件上的故障或流量暴增都會
被侷限在該範圍內。

## 先決條件 {#prerequisites}

- 一個 Kubernetes 叢集與 Helm 3.8+（支援 OCI registry）。
- 一個外部 Postgres database（寫入端點；可選的讀取複本）。
- 可選：Redis 用於快取 / rate limiting。

## 安裝 {#install}

### 步驟 1 — 建立 Secret {#step-1--create-the-secrets}

敏感值只會透過 Secret 參照傳遞 — 請先建立它們：

```bash
kubectl create namespace litellm

kubectl -n litellm create secret generic litellm-master-key-secret \
  --from-literal=master-key="sk-..."

kubectl -n litellm create secret generic litellm-writer-secret \
  --from-literal=username=litellm --from-literal=password="..."

# Only if you use a read replica (see "Separate read and write databases")
kubectl -n litellm create secret generic litellm-reader-secret \
  --from-literal=username=litellm --from-literal=password="..."
```

### 步驟 2 — 最小 `values.yaml` {#step-2--minimal-valuesyaml}

```yaml
masterKey:
  secretName: litellm-master-key-secret
  secretKey: master-key

database:
  writer:
    host: litellm-pg-rw.litellm.svc
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-writer-secret
      usernameKey: username
      passwordKey: password

# Optional: front all three services behind one host
ingress:
  enabled: true
  className: alb
  host: aigateway.example.com
```

### 步驟 3 — 從 OCI registry 安裝 {#step-3--install-from-the-oci-registry}

此 chart 已發佈到 GitHub Container Registry：
[`ghcr.io/berriai/litellm/chart/litellm`](https://github.com/BerriAI/litellm/pkgs/container/litellm%2Fchart%2Flitellm)。

```bash
helm upgrade --install litellm \
  oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.86.0-dev \
  -n litellm \
  -f values.yaml
```

此 chart 會先以 pre-install/pre-upgrade hook Job 執行 `prisma migrate deploy`，
接著啟動 `gateway`、`backend` 與 `ui` Deployments。搭配
`ingress.enabled=true` 時，單一主機會前置處理三者：data-plane 前綴 → 
`gateway`、UI assets → `ui`、catch-all → `backend`。

## 設定 {#configuration}

### 分離讀取與寫入資料庫 {#separate-read-and-write-databases}

將大量分析讀取從 writer 分流出去，只需設定 `database.reader`
區塊。設定 `reader.host` 以啟用；留空則每個查詢都會送往
writer。未設定的 reader 欄位會回退為 writer 的值。

```yaml
database:
  # Writer — all writes (spend logs, tokens, config) land here
  writer:
    host: litellm-pg-rw.litellm.svc
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-writer-secret
      usernameKey: username
      passwordKey: password

  # Reader — read-heavy ops (find_*, count, group_by, raw reads)
  reader:
    host: litellm-pg-ro.litellm.svc
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-reader-secret
      usernameKey: username
      passwordKey: password
```

此 chart 會在 proxy 啟動前，根據這些
片段組合 `DATABASE_URL` 與 `DATABASE_URL_READ_REPLICA`。請參閱
[Database Read Replica](/docs/proxy/db_read_replica) 了解讀取如何被路由。

**RDS / Aurora IAM auth** — 在 `database.writer` 上設定 `useIAMAuth: true`（並且
可選地設定 `database.reader`），以鑄造短效 IAM token，而不是
參照密碼 Secret：

```yaml
database:
  writer:
    host: litellm.cluster-xxxx.us-east-1.rds.amazonaws.com
    dbname: litellm
    useIAMAuth: true
  reader:
    host: litellm.cluster-ro-xxxx.us-east-1.rds.amazonaws.com
    useIAMAuth: true     # requires database.writer.useIAMAuth: true
serviceAccount:
  create: true
  name: litellm
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/litellm-db
```

### Redis {#redis}

將 `redis.host` 留空即可停用。若為 Redis
Cluster 模式（例如 ElastiCache Cluster），請設定 `redis.cluster: true` — 此 chart 會從 `host`/`port` 產生 `REDIS_CLUSTER_NODES`
作為 seed，然後用戶端會從
`CLUSTER SLOTS` 探索其餘節點。

```yaml
redis:
  cluster: true
  host: litellm-redis.litellm.svc
  port: 6379
  passwordSecret:
    name: litellm-redis-secret   # leave empty for auth-less Redis
    passwordKey: password
```

### 每個元件的擴充與探針 {#per-component-scaling-and-probes}

`gateway`、`backend`、`ui` 各自接受 `image`、`resources`、
`livenessProbe`、`readinessProbe`、`hpa`、`extraEnv`、`envConfigMaps`、
`envSecrets`、`logLevel`、`nodeSelector`、`tolerations`，以及 `affinity`。
`gateway` 另外還接受 `numWorkers`（每個 pod 的 uvicorn workers，預設為
`1`）以及 `config.proxy_config`（會渲染成 ConfigMap 並掛載於
`/app/config/config.yaml`）。

預設值會依各自的負載特性為每個範圍配置容量：

```yaml
gateway:
  numWorkers: 1
  hpa: { enabled: true, minReplicas: 1, maxReplicas: 10,
         targetCPUUtilizationPercentage: 70, targetMemoryUtilizationPercentage: 80 }

backend:
  hpa: { enabled: true, minReplicas: 1, maxReplicas: 4,
         targetCPUUtilizationPercentage: 70 }

ui:
  hpa: { enabled: false, minReplicas: 1, maxReplicas: 3 }
```

### 遷移 Job {#migrations-job}

預設啟用。以專用的 `litellm-migrations`
image 對 writer database 執行 `prisma migrate deploy`，作為 Helm pre-install/pre-upgrade hook。若您的流程在外部執行 migrations，請將其停用：

```yaml
migrationJob:
  enabled: true
  backoffLimit: 4
  ttlSecondsAfterFinished: 120
  # The v2 resolver is used by default. To opt back into v1:
  extraEnv:
    - name: USE_V2_MIGRATION_RESOLVER
      value: "false"
```

### Ingress {#ingress}

啟用後，會將三個 Services 串接到單一 L7 entrypoint 後方（當
透過網路提供靜態 UI 時必須啟用）：

```yaml
ingress:
  enabled: true
  className: alb
  host: aigateway.example.com
  annotations: {}
  tls: []
```

此 chart 會將 UI paths 路由到 `ui` pods，將 data-plane prefixes 路由到 `gateway`，
並將 catch-all（`/key/*`、`/user/*`、`/spend/*`、…）路由到 `backend`。
