---
title: 生產部署
description: LiteLLM 在 AWS、GCP、Azure 或任何 Kubernetes 叢集上的生產部署指南，包含 Helm chart 與官方 Terraform 模組。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';
import { CloudArchitectureSelector } from '@site/src/components/CloudArchitecture';

# 生產部署 {#production-deployment}

適用於 AWS、Google Cloud、Azure 或任何 Kubernetes 叢集的生產部署指南。若要在單一機器上進行首次部署，請從 [快速入門](./docker_quick_start.md) 開始；本頁接續其後。

有兩條支援的路徑。如果您使用 Kubernetes，請在 EKS、GKE 或 AKS 上 [使用 Helm 部署](#deploy-with-helm)；各雲端上的安裝方式相同，只有資料儲存與 ingress 不同。如果您未使用 Kubernetes，AWS 與 GCP 有可建置整個堆疊的 [官方 Terraform 模組](#deploy-with-terraform-aws-and-gcp)；Azure 沒有 Terraform 模組，因此在那裡支援的路徑是使用 Helm 的 AKS。

## 架構 {#architecture}

<CloudArchitectureSelector />

LiteLLM 提供兩種部署模式：

- **單體式**：一個 `litellm` 映像檔同時提供 LLM 流量、管理 API 與 UI。這是 `litellm-helm` chart 的執行方式，也是最容易操作的方式。
- **微服務**：一個 `gateway`（LLM 流量，port 4000）、`backend`（管理 API 與 UI 後端，port 4001）以及 `ui`（port 3000），各自獨立部署與擴展。這是元件化 `litellm` chart 與兩個 Terraform 模組的執行方式；完整參考請見 [chart 值](https://github.com/BerriAI/litellm/blob/main/helm/litellm/values.yaml)。

支援基礎架構在任一模式下都相同：

| 元件 | 用途 | 備註 |
|---|---|---|
| LiteLLM 服務 | 一個 proxy 部署（單體式）或 gateway + backend + ui（微服務） | 無狀態；在負載平衡器後方執行 2 個以上副本 |
| PostgreSQL | 金鑰、團隊、使用者、花費記錄、設定 | proxy 的驗證與追蹤功能所必需 |
| Redis | 速率限制、路由器狀態、跨執行個體快取 | 當您執行超過一個執行個體時就需要 |
| migrations 工作 | 對 Postgres 套用結構描述遷移 | 每次升級執行一次；proxy 執行個體設定 `DISABLE_SCHEMA_UPDATE=true` |

## 核心設定 {#core-configuration}

```bash
DATABASE_URL="postgresql://user:password@host:5432/litellm"
LITELLM_MASTER_KEY="sk-..."   # admin key for the proxy
LITELLM_SALT_KEY="sk-..."     # encrypts provider credentials stored in the DB. Set once, never change it
DISABLE_SCHEMA_UPDATE="true"  # proxy instances never run migrations; the migrations job does
STORE_MODEL_IN_DB="True"      # manage models from the Admin UI instead of config files
```

`LITELLM_SALT_KEY` 在您新增模型之後無法輪替：它會加密儲存在資料庫中的提供者憑證，而變更它會使這些憑證無法讀取。請產生強度高的隨機值，並將兩個金鑰都存放在雲端的密鑰管理服務中。

官方映像檔發佈於 `ghcr.io/berriai`，並鏡像至 `docker.litellm.ai/berriai`。單體式部署（包括使用 Postgres 的部署）請使用 `ghcr.io/berriai/litellm`，因為它封裝了 Prisma 工具鏈，並請固定版本標籤，而不要使用 `latest` 或可移動的標籤，這樣回復才具可預測性。所有映像檔都經過簽署；驗證方式與非 root 版本請參閱 [Docker Image Security Guide](./docker_image_security.md)。

## 佈建資料儲存 {#provision-the-data-stores}

Helm 路徑需要一個 PostgreSQL 資料庫，以及一個可從您的叢集連線的 Redis。請使用受管服務：

<Tabs>
<TabItem value="aws" label="AWS">

在與您的 EKS 叢集相同的 VPC 中佈建 [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html) 與 [ElastiCache Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)，並設定安全性群組允許叢集節點透過 5432 與 6379 埠連線。

</TabItem>
<TabItem value="gcp" label="Google Cloud">

在您的 GKE 叢集所使用的 VPC 上，使用私有 IP 佈建 [Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres) 與 [Memorystore Redis](https://cloud.google.com/memorystore/docs/redis)（Cloud SQL 需要 [Private Services Access](https://cloud.google.com/vpc/docs/private-services-access)）。以下方的端點請使用這些執行個體的私有 IP。

</TabItem>
<TabItem value="azure" label="Azure">

```bash
az group create --name litellm-prod --location eastus

az aks create --resource-group litellm-prod --name litellm-aks \
  --node-count 3 --enable-managed-identity

az postgres flexible-server create --resource-group litellm-prod \
  --name litellm-db --database-name litellm \
  --tier GeneralPurpose --sku-name Standard_D2ds_v5

az redis create --resource-group litellm-prod --name litellm-redis \
  --location eastus --sku Standard --vm-size c1
```

文件：[AKS](https://learn.microsoft.com/en-us/azure/aks/what-is-aks)、[Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview)、[Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview)。Azure Cache for Redis 透過 6380 埠提供 TLS，且 TLS 透過 URL scheme 啟用：請將 `redis_host` 與 `redis_port` 改為在 `router_settings` 下設定 `redis_url: "rediss://:<access-key>@litellm-redis.redis.cache.windows.net:6380"`（`rediss://` scheme 會開啟 TLS）。

</TabItem>
</Tabs>

## 使用 Helm 部署 {#deploy-with-helm}

首先建立兩個 chart 都會使用的 secrets：

```bash
kubectl create secret generic litellm-masterkey \
  --from-literal=masterkey="sk-$(openssl rand -hex 24)"

kubectl create secret generic litellm-db \
  --from-literal=username=litellm \
  --from-literal=password="<database-password>"

kubectl create secret generic litellm-env \
  --from-literal=LITELLM_SALT_KEY="sk-$(openssl rand -hex 24)" \
  --from-literal=REDIS_PASSWORD="<redis-password>" \
  --from-literal=OPENAI_API_KEY="<provider-key>"
```

接著選擇一種部署模式：

<Tabs>
<TabItem value="monolith" label="Monolithic (litellm-helm)">

```yaml title="values.yaml"
replicaCount: 3

image:
  repository: ghcr.io/berriai/litellm
  tag: "v1.90.2"          # pin your version

masterkeySecretName: litellm-masterkey
masterkeySecretKey: masterkey

db:
  useExisting: true
  deployStandalone: false
  endpoint: "<postgres-endpoint>"
  database: litellm
  secret:
    name: litellm-db
    usernameKey: username
    passwordKey: password

environmentSecrets:
  - litellm-env

proxy_config:
  model_list:
    - model_name: {{openai_large}}
      litellm_params:
        model: openai/{{openai_large}}
        api_key: os.environ/OPENAI_API_KEY
  router_settings:
    redis_host: "<redis-endpoint>"
    redis_port: 6379
    redis_password: os.environ/REDIS_PASSWORD
```

```bash
helm install litellm oci://ghcr.io/berriai/litellm-helm -f values.yaml
```

該 chart 位於 [`helm/litellm-helm`](https://github.com/BerriAI/litellm/tree/main/helm/litellm-helm)；已發佈的 chart 版本採用 LiteLLM 發行版號（例如 `1.90.2`），而 `helm show values oci://ghcr.io/berriai/litellm-helm` 列出所有調整選項。除了上述值之外，它還支援 [自動擴展](#autoscaling)（`autoscaling.*` 或 `keda.*`）、PodDisruptionBudgets（`pdb.*`）、Prometheus ServiceMonitor（`serviceMonitor.*`）、讀取副本路由（`db.readReplicaUrl`，請參閱 [Database Read Replica](./db_read_replica.md)）、關機時優雅排空（`lifecycle`）、供 migrations 工作使用的 ArgoCD 或 Helm hooks（`migrationJob.hooks.*`，請參閱 [Helm PreSync hooks](./prod.md#run-migrations-from-the-helm-presync-hook)），以及透過 `metricsServer.*` 設定的可選 [專用 Prometheus metrics 監聽器](./prometheus.md#isolate-prometheus-scraping-from-inference-traffic)。

</TabItem>
<TabItem value="micro" label="Microservices (litellm)">

```yaml title="values.yaml"
masterKey:
  secretName: litellm-masterkey
  secretKey: masterkey

database:
  writer:
    host: "<postgres-endpoint>"
    port: 5432
    dbname: litellm
    passwordSecret:
      name: litellm-db
      usernameKey: username
      passwordKey: password
  # optional: add database.reader to route reads to a replica

redis:
  host: "<redis-endpoint>"
  port: 6379
  passwordSecret:
    name: litellm-env
    passwordKey: REDIS_PASSWORD

# one host fronting gateway, backend, and ui
ingress:
  enabled: true
  className: "<alb | gce | azure-application-gateway | nginx>"
  # alb (default) or nginx. ingress-nginx's admission webhook rejects the chart's
  # dotted paths (/favicon.ico, /eu.assemblyai) unless this is nginx
  controller: alb
  host: llm.example.com
  # optional: routes the chart does not ship a rule for, e.g. a passthrough
  # prefix added after this chart version or a custom
  # general_settings.pass_through_endpoints path. Additive: every built-in
  # UI, gateway, and backend path is still rendered
  extraPaths:
    - path: /watsonx
      pathType: Prefix     # default; Exact and ImplementationSpecific also work
      service: gateway     # default; backend and ui also work
```

```bash
helm upgrade --install litellm \
  oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.89.2 \
  -f values.yaml
```

這會將 `gateway`、`backend` 與 `ui` 以獨立服務部署。您可以在不擴充管理 API 或 Admin UI 的情況下，獨立擴展 gateway 以處理推理流量。該 chart 需要外部 Postgres 與 Redis，並支援資料庫讀取副本、IAM 資料庫驗證、Redis Cluster、每個元件的探針，以及每個元件的自動擴展。

請將 chart 鎖定至 `1.89.0` 或更新版本。每個元件的映像檔標籤預設為 chart 版本。每個選項請參閱 [chart 值](https://github.com/BerriAI/litellm/blob/main/helm/litellm/values.yaml)，擴展設定請參閱 [自動擴展](#autoscaling)，gateway metrics sidecar 請參閱 [Prometheus metrics 隔離](./prometheus.md#isolate-prometheus-scraping-from-inference-traffic)。

[高吞吐量部署設定檔](./high_throughput.md) 會加入共用資料庫連線、隔離的花費處理，以及 RPS/TPS 自動擴展。此設定檔目前可在 nightly builds 中使用。

</TabItem>
</Tabs>

兩個 chart 都會自動執行 migrations 工作，並讓 proxy pod 保持 `DISABLE_SCHEMA_UPDATE=true`。透過您雲端的 ingress 來公開服務：EKS 使用 [AWS Load Balancer Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)，GKE 使用 [GKE Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)，AKS 使用 [Application Gateway Ingress (AGIC)](https://learn.microsoft.com/en-us/azure/application-gateway/ingress-controller-overview)，並在 `/health/readiness` 上進行健康檢查，接著將 DNS 記錄指向產生的負載平衡器。就機密資料而言，請優先使用您雲端的密鑰管理服務，而非一般 Kubernetes secrets（例如 AKS 上的 [Key Vault CSI driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)）；chart 會使用您掛載的任何 secret。

### 自動擴展 {#autoscaling}

兩個 chart 都可自行擴展，而且兩者預設都將 autoscaling 設為關閉或保守。關於應設定的門檻，以及為何不以記憶體作為其中之一，請參閱 [生產檢查清單中的自動擴展](./prod.md#autoscaling)。

`litellm-helm` 提供兩種互斥機制。`autoscaling.*` 會產生標準的 HorizontalPodAutoscaler，而 `keda.*` 則會產生一個 KEDA `ScaledObject`，用於依佇列深度、Prometheus 查詢或 KEDA 可讀取的其他任何來源進行擴展。兩者都啟用時只會產生 HPA，因此請擇一。

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
  # targetMemoryUtilizationPercentage and behavior are also accepted

keda:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  pollingInterval: 30   # seconds between trigger evaluations
  cooldownPeriod: 300   # seconds of quiet before scaling back to minReplicas
  triggers: []          # required; a ScaledObject with no triggers will not scale
```

`keda.triggers` 預設為空白，且沒有可用的預設值，因此請自行提供 trigger；chart 的 `values.yaml` 內含一個已註解的 Prometheus 範例。`keda.fallback`、`keda.behavior` 與 `keda.restoreToOriginalReplicaCount` 會原樣傳遞，用於控制 metric 來源無法使用時會發生什麼事，以及在一次擴展事件後副本如何穩定。

元件化圖表會在 `gateway.hpa`、`backend.hpa` 和 `ui.hpa` 下，分別獨立擴展每個元件。閘道與後端會自動擴縮，但 UI 不會；其上限會依各元件流量型態設定：閘道預設為 `maxReplicas: 10`，在 CPU 70% 與記憶體 80% 時觸發，後端預設為 `maxReplicas: 4`，在 CPU 70% 時觸發，而 UI 預設為 `maxReplicas: 3`，在 CPU 80% 與 `enabled: false` 時觸發。通常只要提高閘道的上限就夠了，因為它是唯一會看到 LLM 流量的元件。

無論您使用哪種機制，請將最大值設定在資料庫能夠提供的範圍內。連線池是每個 worker 各自獨立，因此副本上限也等同於 Postgres 連線上限；`litellm-helm` 預設 `maxReplicas` 為 100，在預設 10 的池上限下，滿載擴展時大約需要 1000 條連線。請參閱[界定資料庫連線上限](./prod.md#bound-database-connections)。

#### 依每個 Pod 的請求與 token 數量擴展 {#scale-on-requests-and-tokens-per-pod}

CPU 會落後於 LLM 流量：一個正在串流四十個回應的 Pod，大多時間都在等待提供者，因此 CPU 仍然很低，但容量已經耗盡。這兩個圖表都可以依代理程式已匯出的兩個計數器進行擴展，`litellm_proxy_total_requests_metric_total` 與 `litellm_total_tokens_metric_total`，其表示方式為每個 Pod 的每秒請求數（RPS）與每秒 token 數（TPS），也就是常見的負載表示方式（1k rps、75M tok/s）。這些目標是可選用的，預設為空，因此在您設定其中一個之前不會有任何變化，而且它們與 CPU 和記憶體目標並列：HPA 會採用要求副本數最多的那個指標。`averageValue` 是 Kubernetes 數值，因此 `"6M"` 與 `"6000000"` 代表相同的每秒 token 數。

```yaml
# litellm-helm
autoscaling:
  enabled: true
  targetRequestsPerSecond: "90"
  targetTokensPerSecond: "6M"
metricsServer:
  enabled: true
serviceMonitor:
  enabled: true

# componentized chart
gateway:
  metricsServer:
    enabled: true
  serviceMonitor:
    enabled: true
  hpa:
    targetRequestsPerSecond: "90"
    targetTokensPerSecond: "6M"
```

每個目標都會產生一個 `autoscaling/v2` `Pods` 指標，`litellm_requests_per_second` 或 `litellm_tokens_per_second`，並設定 `AverageValue` 目標。Kubernetes 無法自行讀取 Prometheus，因此必須先具備兩件事。圖表的 ServiceMonitor（Prometheus Operator）會各自抓取每個 Pod，讓每個樣本都帶有 `pod` 標籤。啟用專用 metrics listener 與其搭配使用（元件化圖表上為 `gateway.metricsServer.enabled`，`metricsServer.enabled` 上為 `litellm-helm`）：主要連接埠會在虛擬金鑰驗證之後提供 `/metrics/`，並對未驗證的 scrape 回應 401，因此元件化圖表若沒有它就會拒絕產生 ServiceMonitor。接著 [Prometheus Adapter](https://github.com/kubernetes-sigs/prometheus-adapter) 必須在 `custom.metrics.k8s.io` 上，以 Pod 分組提供這兩個名稱。`rate()` 已經會回傳每秒值，因此不需要 `* 60`：

```yaml
rules:
  - seriesQuery: 'litellm_proxy_total_requests_metric_total{namespace!="",pod!=""}'
    resources: { overrides: { namespace: { resource: namespace }, pod: { resource: pod } } }
    name: { as: litellm_requests_per_second }
    metricsQuery: sum(rate(<<.Series>>{<<.LabelMatchers>>}[1m])) by (<<.GroupBy>>)
  - seriesQuery: 'litellm_total_tokens_metric_total{namespace!="",pod!=""}'
    resources: { overrides: { namespace: { resource: namespace }, pod: { resource: pod } } }
    name: { as: litellm_tokens_per_second }
    metricsQuery: sum(rate(<<.Series>>{<<.LabelMatchers>>}[1m])) by (<<.GroupBy>>)
```

單位只是固定倍率，並不會讓 HPA 反應得更快。真正造成延遲的是 adapter 規則中的 `rate()` 視窗、scrape 間隔，以及 HPA 同步週期（預設為 15 秒）。請將視窗維持在 `[1m]`，並將 ServiceMonitor 間隔維持在圖表預設的 15 秒或更快，讓視窗中始終至少有四個樣本：在流量階躍之後，訊號會在下一次 scrape 時移動，並在 60 秒後達到完整值，而 `[2m]` 視窗此時仍只到一半。

這兩個計數器都會依模型、金鑰與團隊標籤拆分，因此 `sum by (pod)` 會把一個 Pod 的序列收斂成單一數值。`kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/<ns>/pods/*/litellm_tokens_per_second` 顯示 HPA 看到的內容。範例：10 個閘道 Pod 共承載 1,000 rps，平均每個 Pod 為 100 rps，目標為 90，因此 HPA 會要求 `ceil(10 * 100 / 90) = 12` 個副本。token 指標則做同樣的運算：10 個 Pod 共同處理每秒 70,000,000 個 token，平均每個 Pod 為 7,000,000 TPS，目標為 6,000,000，因此 `ceil(10 * 7000000 / 6000000) = 12`。

token 是在回應完成時才計數，因此長時間串流只會在完成後才以 TPS 顯示。RPS 會先反應，TPS 會隨後跟上，這對擴展是沒問題的，但也表示長時間串流的突發流量在執行期間會被低估。若您的流量主要是數分鐘的串流，請勿只設定 TPS 目標。

在 `litellm-helm` 上，這些相同的訊號可透過 KEDA 使用，且不需要 adapter。`keda.prometheus.requestsPerSecond` 與 `keda.prometheus.tokensPerSecond` 是單一副本應承載的負載，而每個都會在 `sum(rate(<counter>{namespace="<release namespace>",job="<release>-metrics"}[1m]))` 上新增 Prometheus trigger，並由發佈命名空間與圖表 ServiceMonitor 產生的 `job` 標籤進行選取。KEDA 會將整個發佈範圍的速率除以每副本門檻來決定副本數，因此在相同流量下結果會與 HPA 路徑一致。請將 `keda.pollingInterval` 維持在 15 秒或更低，原因與上方的 scrape 間隔相同。

```yaml
keda:
  enabled: true
  prometheus:
    serverAddress: http://prometheus-operated.monitoring.svc:9090
    requestsPerSecond: "90"
    tokensPerSecond: "6000000"
metricsServer:
  enabled: true
serviceMonitor:
  enabled: true
```

在 AWS ECS 上，Terraform 模組會接受相同的每秒輸入值，`gateway_target_requests_per_second` 在 `ALBRequestCountPerTarget` 上，以及在您將 token 計數器發布到 CloudWatch 之後的 `gateway_target_tokens_per_second`，並自行進行轉換，因為 ALB 會發布每分鐘計數。CloudWatch target tracking 會以 60 秒週期彙總每個指標，且沒有週期設定，因此 ECS 無論單位為何都會以約一分鐘的節奏反應；[module README](https://github.com/BerriAI/litellm/blob/main/terraform/litellm/aws/README.md#scaling-the-gateway-on-requests-and-tokens) 說明了這兩種政策。Cloud Run 依請求並行數進行擴展，且沒有自訂指標輸入，因此在 GKE 之外沒有 TPS 路徑。

### 不使用 Helm 的 Kubernetes {#kubernetes-without-helm}

如果您管理原始 manifest，等效的部署是：用於 `config.yaml` 的 ConfigMap、用於金鑰的 Secret、帶有健康檢查探針的 Deployment，以及 Service。

<details>
<summary>完整 manifest（ConfigMap、Secret、Deployment、Service）</summary>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config-file
data:
  config.yaml: |
      model_list:
        - model_name: {{openai_large}}
          litellm_params:
            model: openai/{{openai_large}}
            api_key: os.environ/OPENAI_API_KEY
---
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: litellm-secrets
data:
  OPENAI_API_KEY: bWVvd19pbV9hX2NhdA== # your api key in base64
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-deployment
  labels:
    app: litellm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: litellm
  template:
    metadata:
      labels:
        app: litellm
    spec:
      containers:
      - name: litellm
        image: docker.litellm.ai/berriai/litellm:v1.90.2 # pin a version, do not use :latest
        args:
          - "--config"
          - "/app/proxy_server_config.yaml"
        ports:
        - containerPort: 4000
        volumeMounts:
        - name: config-volume
          mountPath: /app/proxy_server_config.yaml
          subPath: config.yaml
        envFrom:
        - secretRef:
            name: litellm-secrets
        livenessProbe:
          httpGet:
            path: /health/liveliness
            port: 4000
          initialDelaySeconds: 120
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 4000
          initialDelaySeconds: 120
          periodSeconds: 15
      volumes:
        - name: config-volume
          configMap:
            name: litellm-config-file
---
apiVersion: v1
kind: Service
metadata:
  name: litellm-service
spec:
  selector:
    app: litellm
  ports:
    - protocol: TCP
      port: 4000
      targetPort: 4000
  type: NodePort
```

</details>

要連接資料庫，請將 `DATABASE_URL` 與 `LITELLM_MASTER_KEY` 加入 Secret；manifest 中其他內容都不需要變更，因為映像檔已經內建 Prisma 工具鏈。

## 使用 Terraform（AWS 與 GCP）部署 {#deploy-with-terraform-aws-and-gcp}

官方模組會部署完整的微服務堆疊（網路、資料庫、Redis、物件儲存、秘密、運算、負載平衡器，以及在服務啟動前執行的 migration job），並已發佈到 Terraform Registry：

- [`BerriAI/litellm/aws`](https://registry.terraform.io/modules/BerriAI/litellm/aws/latest)
- [`BerriAI/litellm/google`](https://registry.terraform.io/modules/BerriAI/litellm/google/latest)

<Tabs>
<TabItem value="aws" label="AWS (ECS Fargate)">

預設會佈建一個包含公有與私有子網路的 VPC、一個 Aurora PostgreSQL 叢集（writer 加 reader、IAM 資料庫驗證）、ElastiCache Redis（Multi-AZ、加密）、一個 S3 bucket、Secrets Manager 項目、一個 Application Load Balancer，以及 ECS Fargate 服務。網路以及兩個資料儲存系統都可以選擇不使用，因此您可以重用帳戶中既有的資源；請見下方。

```hcl title="main.tf"
module "litellm" {
  source  = "BerriAI/litellm/aws"
  version = "~> 1.90"

  region = "us-east-1"
  azs    = ["us-east-1a", "us-east-1b"]
  tenant = "acme"
  env    = "prod"

  ui_password         = var.ui_password
  litellm_license     = var.litellm_license      # optional, omit for open source
  acm_certificate_arn = var.acm_certificate_arn  # TLS is required by default

  proxy_config = {
    model_list = [{
      model_name = "{{openai_large}}"
      litellm_params = {
        model   = "openai/{{openai_large}}"
        api_key = "os.environ/OPENAI_API_KEY"
      }
    }]
  }
  gateway_extra_secrets = {
    OPENAI_API_KEY = var.openai_key_secret_arn
  }
}
```

在您套用之前：請先在 [AWS Certificate Manager](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html) 中佈建 TLS 憑證（除非您明確設定 `allow_plaintext_alb = true`，否則模組會拒絕明文 ALB），並先在 [Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) 中建立任何提供者金鑰秘密，因為 `gateway_extra_secrets` 會使用它們的 ARN。套用之後，請將 DNS 記錄指向 ALB hostname。

如果您沒有提供 master key，模組會自動將其產生到 Secrets Manager。應用程式會使用短效 IAM token 連線到 Aurora，因此其 `DATABASE_URL` 不包含密碼（資料庫 master password 本身會產生到 Secrets Manager，且永遠不會接觸到應用程式）。每個資源都會以 `<tenant>-litellm-<env>` 命名，而模組沒有宣告任何 provider，因此您可以將其 `for_each`，讓每個租戶執行一個堆疊。

**自備 VPC、資料庫或 Redis。** 網路與兩個資料儲存系統都各自可選，因此您可以部署到帳戶中既有的基礎架構。當您的防護欄只允許工作負載位於預先核准的 VPC 內，或是由另一個團隊負責您預期要使用的 Postgres 與 Redis 時，就應採用這條路徑。只設定您想要重用的部分；任何維持預設值的項目仍會為您建立。

```hcl title="main.tf"
module "litellm" {
  source  = "BerriAI/litellm/aws"
  version = "~> 1.90"

  region = "us-east-1"
  tenant = "acme"
  env    = "prod"

  # Existing networking. Drop `azs` when you set these: no VPC, subnets,
  # route tables, internet gateway, or NAT gateway are created.
  vpc_id             = "vpc-0123456789abcdef0"
  public_subnet_ids  = ["subnet-aaa", "subnet-bbb"]  # ALB, 2+ AZs
  private_subnet_ids = ["subnet-ccc", "subnet-ddd"]  # tasks and data stores, 2+ AZs

  # Existing data stores. Each URL is stored in Secrets Manager and reaches
  # the containers as DATABASE_URL / REDIS_URL.
  create_database = false
  database_url    = var.database_url
  create_redis    = false
  redis_url       = var.redis_url

  # Attach a group your database already allows, alongside the module's own.
  additional_task_security_group_ids = ["sg-0123456789abcdef0"]
}
```

您既有的儲存系統必須接受來自 task 的流量。模組一律會建立自己的 task security group，並將其回報為 `task_security_group_id` 輸出，因此請允許該群組對資料庫與 Redis 的入站存取，或者傳入他們已經允許通過 `additional_task_security_group_ids` 的群組。您提供的私有子網路也需要自己的出站路由，透過 NAT gateway 或 VPC endpoints，因為在此模式下模組不會自行建立任何 routing。它會從那些子網路存取 Secrets Manager、提取容器映像檔，並呼叫 LLM 提供者。

當此模組仍會建立 Aurora 或 ElastiCache 時，請至少提供位於兩個可用區域的私有子網，因為這兩者的子網群組都需要如此。只有在您已將兩者都關閉時，單一私有子網才會被接受。

在 `false` 留下一個空白 URL 的 `create_*`，會讓叢集在完全不包含該元件的情況下執行。沒有資料庫，就沒有金鑰管理、支出追蹤或 UI 持久化，因此驗證會退回只使用 master key。沒有 Redis 時，速率限制、預算和路由冷卻時間會以每個閘道程序為單位計算，而不是跨叢集計算，而且此模組預設會執行兩個閘道任務並自動擴展至十個，因此分散在這些程序上的呼叫者會各自收到每個程序的完整額度。當您設定這種組合時，規劃會發出警告。若您需要在沒有 Redis 的情況下讓每個金鑰限制仍有意義，請透過 `gateway_autoscaling_enabled = false`、`gateway_desired_count = 1` 和 `gateway_num_workers = 1` 將閘道限制為單一程序。

遺失或不一致的輸入會在 `terraform plan` 期間失敗，而不是在 apply 到一半時才失敗，因此若在未提供子網 ID 的情況下設定 `vpc_id`，或在未設定 `vpc_id` 的情況下移除 `azs`，系統會在任何資源建立之前先告知您。

</TabItem>
<TabItem value="gcp" label="Google Cloud (Cloud Run)">

部署 VPC，包含 Private Services Access、Cloud SQL PostgreSQL（主資料庫加上讀取複本）、具有 TLS 的 Memorystore Redis、GCS bucket、Secret Manager 項目、Cloud Run 服務，以及搭配無伺服器 NEG 的全域 HTTPS load balancer。

```hcl title="main.tf"
module "litellm" {
  source  = "BerriAI/litellm/google"
  version = "~> 1.90"

  project_id = "my-project"
  region     = "us-central1"
  tenant     = "acme"
  env        = "prod"

  ui_password     = var.ui_password
  litellm_license = var.litellm_license  # optional

  # Cloud Run cannot pull from ghcr.io. Point this at an Artifact Registry
  # remote repository backed by ghcr.io, or mirror the images.
  image_registry = "us-central1-docker.pkg.dev/my-project/ghcr-remote/berriai"

  lb_domains = ["llm.example.com"]

  proxy_config = {
    model_list = [{
      model_name = "{{gemini_pro}}"
      litellm_params = { model = "vertex_ai/{{gemini_pro}}" }
    }]
  }
}
```

三個 GCP 特有的注意事項。第一，務必覆寫 `image_registry`：其預設值是 `ghcr.io/berriai`，而 Cloud Run 無法從該處提取，因此 apply 會成功，但服務會在映像檔提取時失敗。請將其指向可代理 `ghcr.io` 的 [Artifact Registry 遠端儲存庫](https://cloud.google.com/artifact-registry/docs/repositories/remote-overview)。第二，資料庫使用透過 Secret Manager 的密碼驗證，而非 IAM 驗證；LiteLLM 的 IAM token 支援是 AWS RDS 專用。第三，請在 apply 之後建立指向 load balancer IP 的 `lb_domains` DNS 記錄；在網域解析到該 IP 之前，[Google 管理的憑證](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs) 不會完成佈建。

</TabItem>
</Tabs>

AWS 模組可以使用 `gateway_metrics_port` 在專用的 ECS sidecar 中執行 Prometheus 收集，並以 `gateway_metrics_scrape_cidrs` 限制存取；請參閱[將 Prometheus scraping 與推論流量隔離](./prometheus.md#isolate-prometheus-scraping-from-inference-traffic)。

若要在叢集啟動後，將 LiteLLM 資源（金鑰、團隊、模型）以程式碼方式管理，請使用 [terraform-provider-litellm](https://github.com/BerriAI/terraform-provider-litellm)。

## 其他平台 {#other-platforms}

<Tabs>
<TabItem value="render" label="Render">

部署到 [Render](https://render.com/)：

<iframe width="840" height="500" src="https://www.loom.com/embed/805964b3c8384b41be180a61442389a3" frameBorder="0" allowFullScreen></iframe>

</TabItem>
<TabItem value="railway" label="Railway">

部署到 [Railway](https://railway.app)：按一下按鈕，然後在 Railway 環境變數中設定 `PORT=4000`。

[![在 Railway 上部署](https://railway.app/button.svg)](https://railway.app/template/S7P9sn?referralCode=t3ukrU)

</TabItem>
</Tabs>

## 驗證部署 {#verify-the-deployment}

確認 proxy 已啟動且可連線到其資料庫：

```bash
curl -s https://llm.example.com/health/readiness
```

接著在 `https://llm.example.com/ui` 開啟 Admin UI，使用您的 master key 登入，新增模型、建立虛擬金鑰，並傳送 Playground 訊息；回應證明請求已完整經過 load balancer、proxy、資料庫與提供者憑證。 [Quickstart](./docker_quick_start.md#2-log-in-to-the-admin-ui) 會以截圖逐步說明上述每個點選步驟；在正式部署上的流程完全相同。

## 後續步驟 {#next-steps}

請使用 [production checklist](./prod.md) 設定 worker、資源、Redis、優雅降級與伺服器調校。請使用 [Docker Image Security Guide](./docker_image_security.md) 驗證映像檔。使用 [Multi-Region Deployment](./multi_region.md) 新增區域。對於高於 1,000 RPS 的工作負載，請啟用 [Redis transaction buffer](./prod.md#redis-transaction-buffer) 並評估 [high-throughput deployment profile](./high_throughput.md)。
