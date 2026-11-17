# 擴展至每月 100T+ token {#scale-for-100t-tokens-per-month}

基準測試吞吐量：**每分鐘 135 億個 token（TPM）**。[查看結果](../benchmarks.md#high-throughput-profile-3000-rps-with-50k-to-100k-token-prompts)。

## 需求 {#requirements}

- 元件化模式的 [LiteLLM Helm chart](./deploy/helm.md)。
- 外部 PostgreSQL 與 Redis。
- Kubernetes 1.30+ 與 Metrics Server，用於 CPU 與記憶體自動擴展。
- Prometheus Operator，透過 ServiceMonitor 抓取每個 pod。
- Prometheus Adapter，搭配 [RPS 與 TPS 規則](./deploy/autoscaling.md#scale-on-requests-and-tokens-per-pod)，用於請求與 token 自動擴展。

## 設定閘道 {#configure-the-gateway}

### 1. 設定 HPA {#1-configure-hpa}

**使用 RPS 與 TPS 目標隨流量擴展，並搭配 CPU 與記憶體目標因應資源使用。** HPA 會採用要求最多副本的指標。此範例的目標是每個 pod 每秒 83 個請求與 625 萬個 token。

```yaml
gateway:
  hpa:
    enabled: true # Default: true
    minReplicas: 2 # Default: 1
    maxReplicas: 200 # Default: 10
    targetRequestsPerSecond: "83" # Default: ""
    targetTokensPerSecond: "6.25M" # Default: ""
    targetCPUUtilizationPercentage: 60 # Default: 70
    targetMemoryUtilizationPercentage: 80 # Default: 80
    behavior: # Default: {}
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
```

設定 [Prometheus Adapter 規則](./deploy/autoscaling.md#scale-on-requests-and-tokens-per-pod)，將這些指標公開給 Kubernetes。token 指標在回應完成時更新，因此串流流量請同時使用請求與 token 目標。

### 2. 設定工作程序與資源 {#2-set-workers-and-resources}

每個 pod 執行四個工作程序。請求 4 個 vCPU 與 16 GiB 記憶體，並設定 16 個 vCPU 的上限以應付突發流量。

```yaml
gateway:
  numWorkers: 4 # Default: 1
  logLevel: ERROR # Default: INFO
  resources:
    requests:
      cpu: "4" # Default: "1"
      memory: 16Gi # Default: 4Gi
    limits:
      cpu: "16" # Default: "2"
      memory: 16Gi # Default: 4Gi
```

### 3. 共用資料庫連線 {#3-share-database-connections}

啟用 PgBouncer，讓每個 pod 中的工作程序與 collector 共用八個 PostgreSQL 連線。請依您的資料庫連線上限與最大副本數來決定此連線池的大小。

```yaml
database:
  connectionPool:
    enabled: true # Default: false
    maxDbConnections: 8 # Default: 20
    maxClientConn: 1000 # Default: 1000
```

### 4. 在 sidecar 中執行指標與支出處理 {#4-run-metrics-and-spend-processing-in-sidecars}

啟用 metrics server 與 spend collector。將 `prometheus` 加入您的 callbacks，並使用 Redis 緩衝支出更新以進行批次寫入。

```yaml
gateway:
  metricsServer:
    enabled: true # Default: false
  serviceMonitor:
    enabled: true # Default: false
  collector:
    enabled: true # Default: false
  config:
    proxy_config: # Default: {}
      general_settings:
        proxy_batch_write_at: 60
        use_redis_transaction_buffer: true
      litellm_settings:
        callbacks:
          - prometheus
        json_logs: true
```

將 `gateway.serviceMonitor.labels` 設定為與您的 Prometheus 執行個體的 ServiceMonitor selector 相符。

### 5. 設定連線與關機逾時 {#5-set-connection-and-shutdown-timeouts}

將 `KEEPALIVE_TIMEOUT` 加入 `gateway.extraEnv`，其值須高於您的負載平衡器的閒置逾時。這些設定允許每個請求 600 秒、關機 620 秒，其中包含 10 秒的連線排空延遲。

```yaml
gateway:
  extraEnv: # Default: []
    - name: KEEPALIVE_TIMEOUT
      value: "75"
  config:
    proxy_config: # Default: {}
      litellm_settings:
        request_timeout: 600
  terminationGracePeriodSeconds: 620 # Default: "" (Kubernetes uses 30s)
  lifecycle: # Default: {}
    preStop:
      exec:
        command: ["sh", "-c", "sleep 10"]
  strategy: # Default: {}
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 25%
  startupProbe: # Default: {}
    httpGet: { path: /health/readiness, port: http }
    failureThreshold: 30
    periodSeconds: 10
  pdb:
    enabled: true # Default: false
    maxUnavailable: 10% # Default: ""
```
