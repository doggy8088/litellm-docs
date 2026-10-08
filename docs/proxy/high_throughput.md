# 為高吞吐量工作負載進行擴展 {#scale-for-high-throughput-workloads}

大型提示會在請求到達模型提供者之前，讓閘道承擔相當多的工作。驗證、預算檢查、token 計數、支出追蹤、指標收集，以及資料庫連線都可能與請求處理相互競爭。

此部署設定檔會將這些工作分離，並依請求量與 token 量來擴展閘道。在我們的大型提示基準測試中，使用 33 個閘道 Pod，仍可在 50K 到 100K token 的提示下維持每秒 3,000 個請求。測試設定與結果請參閱[完整基準測試](../benchmarks.md#high-throughput-profile-3000-rps-with-50k-to-100k-token-prompts)。

:::warning[開發預覽版]
高吞吐量部署設定檔仍在開發中，僅可在 nightly builds 中使用。以下安裝範例會固定到最早可用的版本。請使用最新 nightly 進行評估，並在正式上線前於非生產環境中驗證。
:::

## 何時使用此設定檔 {#when-to-use-this-profile}

當您的部署具有下列一項或多項特性時，請使用此設定檔：

- 每秒數千個請求
- 含有數萬個 token 的提示
- 每個 Pod 有多個閘道 worker
- 嚴格的資料庫連線限制
- 長時間執行的串流請求

若是新的部署，請先從[使用 Helm 部署](./deploy.md)與[生產環境檢查清單](./prod.md)開始。待您完成具備外部 Postgres 與 Redis 的元件化部署後，再套用此設定檔。

## 部署的運作方式 {#how-the-deployment-works}

元件化 chart 會獨立執行閘道、管理後端、Admin UI 與資料庫遷移。只有閘道會處理推論流量，因此各部分都能擴展，而不會連帶增加其他元件的負載。

此設定檔會從六個面向調整閘道：

| 設定 | 功能 |
|---|---|
| `gateway.numWorkers` | 在每個閘道 Pod 中執行四個請求 worker。 |
| `database.connectionPool` | 在同一個 Pod 的所有 worker 之間共用一個小型 PgBouncer pool。 |
| `LITELLM_RUST=1` | 將大型提示的 token 計數移到 Rust 快速路徑。 |
| `gateway.metricsServer` and `gateway.collector` | 將指標抓取與支出處理移出請求 worker。 |
| `gateway.hpa` | 依每秒請求數、每秒 token 數、CPU 與記憶體進行擴展。 |
| Keep-alive 與 rollout 設定 | 在閒置期間、擴展與升級時保護長時間執行的請求。 |

上述所有設定皆為選用。升級 chart 不會自動啟用此設定檔。

## 部署此設定檔 {#deploy-the-profile}

請先建立資料庫與 master-key Secrets。接著將下列 values 加入您現有的元件化部署中。

```yaml title="values.yaml"
fullnameOverride: litellm

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
  connectionPool:
    enabled: true
    maxDbConnections: 8
    maxClientConn: 1000

redis:
  host: "<redis-endpoint>"
  port: 6379
  passwordSecret:
    name: litellm-env
    passwordKey: REDIS_PASSWORD

gateway:
  numWorkers: 4
  logLevel: ERROR
  extraEnv:
    - name: LITELLM_RUST
      value: "1"
    - name: KEEPALIVE_TIMEOUT
      value: "75"

  metricsServer:
    enabled: true
  serviceMonitor:
    enabled: true
  collector:
    enabled: true

  resources:
    requests:
      cpu: "4"
      memory: 16Gi
    limits:
      cpu: "16"
      memory: 16Gi

  hpa:
    enabled: true
    minReplicas: 2
    maxReplicas: 200
    targetCPUUtilizationPercentage: 60
    targetMemoryUtilizationPercentage: 80
    targetRequestsPerSecond: "83"
    targetTokensPerSecond: "6.25M"
    behavior:
      scaleUp:
        stabilizationWindowSeconds: 0
        policies:
          - type: Percent
            value: 100
            periodSeconds: 15
          - type: Pods
            value: 20
            periodSeconds: 15
      scaleDown:
        stabilizationWindowSeconds: 300
        policies:
          - type: Percent
            value: 25
            periodSeconds: 60

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 25%
  lifecycle:
    preStop:
      exec:
        command: ["sh", "-c", "sleep 10"]
  terminationGracePeriodSeconds: 620
  startupProbe:
    httpGet: { path: /health/readiness, port: http }
    failureThreshold: 30
    periodSeconds: 10
  pdb:
    enabled: true
    maxUnavailable: 10%

  config:
    general_settings:
      proxy_batch_write_at: 60
      use_redis_transaction_buffer: true
      allow_requests_on_db_unavailable: true
    litellm_settings:
      callbacks:
        - prometheus
      request_timeout: 600
      json_logs: true
```

安裝包含完整設定檔的最早 nightly：

```bash
helm upgrade --install litellm \
  oci://ghcr.io/berriai/litellm/chart/litellm \
  --version 1.102.0-dev.2 \
  -f values.yaml
```

依照[使用 Helm 部署](./deploy.md#deploy-with-helm)中的說明，加入您的 `model_list`、ingress、資料庫唯讀複本，以及其他環境專屬 values。`fullnameOverride: litellm` 會為下方驗證命令使用的資源提供簡短名稱。

## 在不阻塞請求的情況下計算大型提示 {#count-large-prompts-without-blocking-requests}

在請求送往模型提供者之前，預算強制會先計算提示 token。對於 50K 到 100K token 的提示，這可能成為閘道請求路徑中最大的 CPU 成本。

將 `LITELLM_RUST=1` 設為使用 Rust token 計數快速路徑。在測試中，50K、75K 與 100K token 請求主體的 token 計數，從 46、53 與 100 ms 降至 4.9、6.8 與 10.2 ms。這是此設定檔中單一幅度最大的改善。

Rust 路徑預設為關閉。請只在確認 Rust 擴充功能已載入您的閘道映像之後再啟用。

## 以足夠的 CPU 頭room 執行四個 worker {#run-four-workers-with-cpu-headroom}

該基準測試在每個 Pod 中使用四個閘道 worker，搭配 4 vCPU 請求與 16 vCPU 上限。這可讓排程保持可預測，同時讓 worker 與 Rust tokenizer 執行緒利用短暫的 CPU 突發而不會使整個 Pod 降速。

在 700 RPS 時，即使平均 CPU 低於上限，4 vCPU 上限仍會造成 throttling。將上限提高到 16 後，throttling 消失，且 p99 延遲從 830 ms 降至 670 ms。每個 Pod 使用八個 worker 並未改善延遲，卻多用了 50% 的記憶體，因此四個 worker 是此流量型態經測試後的起始值。

在變更 worker 數量之前，請先衡量您自己的工作負載。提供者延遲、提示大小、串流持續時間，以及已啟用的 callback 都會影響最合適的值。

## 在 worker 之間共用資料庫連線 {#share-database-connections-across-workers}

若沒有 PgBouncer，每個閘道 worker 都會開啟自己的 Prisma 連線池。因此，增加 worker 或 Pod 可能會迅速倍增資料庫連線數。

`database.connectionPool.enabled` 會在每個閘道 Pod 中啟動一個 PgBouncer pool。該 Pod 中所有 worker 都共用同一個上游連線配額。在 1,000 RPS 測試中，Postgres 在 11 到 29 個 Pod 之間維持 86 到 175 個連線，而 PgBouncer 中沒有等待中的 client。

請先使用 chart 預設值：每個 Pod 20 個上游連線。該基準測試使用 8，因為該工作負載沒有佇列。請根據您的資料庫限制、閘道 replica 數量，以及觀察到的 PgBouncer 等待時間來選擇數值。

## 將背景工作移出請求 worker {#move-background-work-out-of-request-workers}

兩個 sidecar 可將作業工作與推論流量分離：

- `gateway.metricsServer` 在 port 4001 提供 Prometheus 指標，因此抓取不會進入請求 worker。
- `gateway.collector` 在回應之後處理支出計算、支出記錄、計數器與預算對帳。

此 collector 在測試中改善了尾端延遲。在 700 RPS 時，p99 從 1.8 秒降至 830 ms。總計算量大致相同，因為工作被移至 sidecar。請將此視為請求隔離，而非計算量減少。

指標 port 不使用 virtual-key 驗證。請勿將其暴露於公開 ingress。使用 Prometheus Operator 時，請啟用 `gateway.serviceMonitor`。

## 依請求與 token 進行擴展 {#scale-on-requests-and-tokens}

單靠 CPU 對大量請求的突增反應可能過慢。高吞吐量設定檔可讓 HorizontalPodAutoscaler 同時使用四個訊號：

- 每個 Pod 的每秒請求數
- 每個 Pod 的每秒 token 數
- 閘道 CPU
- 閘道記憶體

HPA 會跟隨需要最多 replica 的那個訊號。在測試中，請求速率指標在負載開始後約 48 秒觸發擴展。

RPS 與 TPS 目標需要一個 Prometheus Adapter，透過 Kubernetes custom metrics API 提供 `litellm_requests_per_second` 與 `litellm_tokens_per_second`。精確的 adapter 規則記載於[依每個 Pod 的請求與 token 進行擴展](./deploy.md#scale-on-requests-and-tokens-per-pod)。

如果您沒有執行 Prometheus Adapter，請移除 `targetRequestsPerSecond` 與 `targetTokensPerSecond`。HPA 仍會依 CPU 與記憶體進行擴展。

請從已量測的 Pod 中選擇 RPS 與 TPS 目標。範例值已為基準測試工作負載預留餘裕，但它們不是通用上限。

## 在擴展期間讓長請求持續存活 {#keep-long-requests-alive-during-scaling}

將 `KEEPALIVE_TIMEOUT` 設為高於負載平衡器的閒置逾時。範例使用 75 秒，適用於閒置逾時為 60 秒的 AWS Application Load Balancer。這可防止閘道在負載平衡器預期關閉之前先行關閉連線。

rollout 設定可讓長請求有時間完成：

- `maxUnavailable: 0` 在升級期間維持既有容量。
- `preStop` 的延遲可讓負載平衡器有時間停止送出新請求。
- `terminationGracePeriodSeconds` 長於已設定的請求逾時。
- PodDisruptionBudget 會限制同時發生的 Pod 中斷。

請將這些值與您允許的最長請求，以及負載平衡器的取消註冊行為相互對應。

startup probe 會讓新的四 worker Pod 有時間在 Kubernetes 套用 liveness 檢查之前先完成載入。`allow_requests_on_db_unavailable: true` 可避免暫時性較慢的資料庫健康檢查，在擴展過程中將原本可正常使用的 Pod 移除。請判斷此可用性取捨是否符合您的資料庫故障政策。

## 驗證部署 {#verify-the-deployment}

每個閘道 Pod 應包含閘道、指標與 collector 容器：

```bash
kubectl -n <namespace> get pods -l app.kubernetes.io/component=gateway \
  -o custom-columns=POD:.metadata.name,CONTAINERS:.spec.containers[*].name
```

確認 worker、連線池、Rust 與 keep-alive 設定：

```bash
kubectl -n <namespace> exec deploy/litellm-gateway -c gateway -- \
  env | grep -E 'NUM_WORKERS|LITELLM_PGBOUNCER|LITELLM_RUST|KEEPALIVE'

kubectl -n <namespace> exec deploy/litellm-gateway -c gateway -- \
  python -c "import litellm.rust_bridge._native; print('rust ok')"
```

確認 Prometheus 指標與 Kubernetes custom metrics API 可用：

```bash
kubectl -n <namespace> port-forward svc/litellm-gateway-metrics 4001:4001 &
curl -s localhost:4001/metrics/ | grep -c '^litellm_'

kubectl get --raw \
  /apis/custom.metrics.k8s.io/v1beta1/namespaces/<namespace>/pods/*/litellm_requests_per_second

kubectl get --raw \
  /apis/custom.metrics.k8s.io/v1beta1/namespaces/<namespace>/pods/*/litellm_tokens_per_second

kubectl -n <namespace> describe hpa litellm-gateway
```

HPA 輸出應列出 RPS、TPS、CPU 與記憶體。rollout 剛完成後，新 Pod 可能會暫時回報 `FailedGetPodsMetric`，直到其第一個請求建立指標序列為止。

## 基準測試結果 {#benchmark-results}

[基準測試報告](../benchmarks.md#high-throughput-profile-3000-rps-with-50k-to-100k-token-prompts) 記錄了此設定檔背後的測試條件、前後結果、用戶端可見的失敗，以及一次只變更一個變數的測量。
