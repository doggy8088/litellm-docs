---
title: 自動擴展
description: 使用 HPA 依每秒請求數、每秒 token 數、CPU 與記憶體擴展 LiteLLM 閘道 pod。
toc_max_heading_level: 2
---

# 自動擴展 {#autoscaling}

{/* keep-version-note */}

使用每秒請求數 (RPS) 與每秒 token 數 (TPS)，搭配 CPU 與記憶體使用率來擴展 LiteLLM。當請求等待模型提供者時，CPU 使用率可能保持很低，因此 RPS 與 TPS 提供了有用的負載訊號。

在 [Helm 值](./helm.md) 中設定 `gateway.hpa`。它在分離服務模式下擴展閘道，在單一服務模式下擴展完整的 proxy。

## HPA 指標 {#scale-on-requests-and-tokens-per-pod}

| 指標 | 測量內容 |
| --- | --- |
| RPS | 每個 pod 每秒完成的請求數 |
| TPS | 每個 pod 每秒的輸入與輸出 token 數 |
| CPU | CPU 使用量占 pod CPU requests 的百分比 |
| Memory | 記憶體使用量占 pod 記憶體 requests 的百分比 |

為 CPU 與記憶體指標安裝 Kubernetes Metrics Server。為 RPS 與 TPS 安裝 Prometheus Operator 與 Prometheus Adapter。Adapter 必須在 `custom.metrics.k8s.io` 上公開每個閘道 pod 的這兩個速率。

### Helm 值 {#helm-values}

在 `values.yaml` 中啟用指標並設定每個 pod 的 HPA 目標。目標請依您以自己的模型與流量組成所做的負載測試來選擇。

```yaml title="values.yaml"
gateway:
  config:
    proxy_config:
      litellm_settings:
        callbacks: [prometheus]
  metricsServer:
    enabled: true
  serviceMonitor:
    enabled: true
    interval: 15s
  hpa:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
    targetRequestsPerSecond: "50"
    targetTokensPerSecond: "100000"
    behavior:
      scaleDown:
        stabilizationWindowSeconds: 300
```

設定容器資源 requests，讓 Kubernetes 可以計算使用率。合併這些值時，保留您的模型設定與現有的回呼。若您的 Prometheus 執行個體需要以標籤選取 ServiceMonitor，請加入 `gateway.serviceMonitor.labels`。讓 metrics Service 保持私有。

### Prometheus Adapter {#prometheus-adapter}

將這些規則加入 [Prometheus Adapter 的設定](https://github.com/kubernetes-sigs/prometheus-adapter/blob/master/docs/config.md)。這是 adapter 的 `config.yaml`，與 LiteLLM 的 Helm 值是分開的：

```yaml title="Prometheus Adapter config.yaml"
rules:
  - seriesQuery: 'litellm_proxy_total_requests_metric_total{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace: {resource: namespace}
        pod: {resource: pod}
    name: {as: litellm_requests_per_second}
    metricsQuery: sum(rate(<<.Series>>{<<.LabelMatchers>>}[1m])) by (<<.GroupBy>>)
  - seriesQuery: 'litellm_total_tokens_metric_total{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace: {resource: namespace}
        pod: {resource: pod}
    name: {as: litellm_tokens_per_second}
    metricsQuery: sum(rate(<<.Series>>{<<.LabelMatchers>>}[1m])) by (<<.GroupBy>>)
```

保留 `namespace` 與 `pod` 抓取標籤，且每個 pod 只抓取一次。`rate()` 回傳每秒速率。

### 選擇目標 {#choose-targets}

HPA 使用要求最多副本的指標。例如，五個 pod 共 400 RPS 等於每個 pod 80 RPS。目標 50 會要求八個副本。TPS、CPU 或記憶體可能要求更多。

LiteLLM 在請求完成時更新其請求與 token 計數器。長時間串流會延遲這些訊號，因此請保留備用副本。以短請求與長請求測試擴展。指標詳情請參閱 [Prometheus 指標](../prometheus.md)。

## KEDA 替代方案 {#keda-alternative}

此 chart 在兩種部署模式下都支援 `gateway.keda`。安裝 KEDA 並停用 `gateway.hpa`。Prometheus 觸發器直接向 Prometheus 查詢整個 Helm 發佈的速率，並為每個副本設定目標。CPU 與記憶體需要 Metrics Server。

```yaml
gateway:
  config:
    proxy_config:
      litellm_settings:
        callbacks: [prometheus]
  metricsServer:
    enabled: true
  serviceMonitor:
    enabled: true
    interval: 15s
  hpa:
    enabled: false
  keda:
    enabled: true
    minReplicaCount: 2
    maxReplicaCount: 10
    pollingInterval: 15
    cooldownPeriod: 300
    triggers:
      - type: cpu
        metricType: Utilization
        metadata:
          value: "70"
      - type: memory
        metricType: Utilization
        metadata:
          value: "80"
    prometheus:
      serverAddress: http://prometheus-operated.monitoring.svc:9090
      targetRequestsPerSecond: "50"
      targetTokensPerSecond: "100000"
```

替換 Prometheus 位址與閾值。產生的查詢會選取 metrics Service 的 `job` 與發佈命名空間。在您的抓取設定中保留這些標籤。將自訂觸發器放在 `gateway.keda.triggers` 下。在 `gateway.keda.fallback` 下設定備援行為，在 `gateway.keda.advanced.horizontalPodAutoscalerConfig.behavior` 下設定 HPA 行為覆寫。

## 驗證擴展 {#verify-scaling}

套用這些值之後，檢查自動擴展器，並以您一般的流量組成測試：

```bash
kubectl -n litellm get hpa
kubectl -n litellm describe hpa
kubectl get --raw '/apis/custom.metrics.k8s.io/v1beta1/namespaces/litellm/pods/*/litellm_requests_per_second'
kubectl get --raw '/apis/custom.metrics.k8s.io/v1beta1/namespaces/litellm/pods/*/litellm_tokens_per_second'
```

對於 HPA 設定，確認兩個自訂指標都為每個閘道 pod 回傳目前的值。對於 KEDA，執行 `kubectl -n litellm get scaledobjects` 並檢查 KEDA 建立的 HPA。

確認自動擴展器在負載下會增加副本。檢查請求成功，且進行中的串流在副本停止之前完成。

在選擇閾值之前，使用[大小規劃與擴展](./sizing.md) 測量容量。對於 ECS 或 Cloud Run，使用 [Terraform 指南](./terraform.md) 中的擴展設定。

## 副本上限與 chart 預設值 {#replica-limits-and-chart-defaults}

將 `maxReplicas` 設為符合您的叢集容量與 PostgreSQL 連線預算。每個工作程序都有自己的連線池，除非您啟用 `database.connectionPool`。該連線池限制每個閘道 pod 的連線數。為後端 pod、遷移與滾動更新保留連線。請參閱[資料庫連線上限](../prod.md#bound-database-connections)。

| 元件 | 預設啟用 HPA | 預設副本範圍 | 預設目標 |
| --- | --- | --- | --- |
| 閘道或單體 | 是 | 1–10 | 70% CPU、80% 記憶體 |
| 後端 | 是 | 1–4 | 70% CPU |
| UI | 否 | 啟用時 1–3 | 80% CPU |

CPU 與記憶體目標以容器資源 requests 的百分比表示使用率。

若要固定閘道副本數，請同時停用 `gateway.hpa.enabled` 與 `gateway.keda.enabled`。然後設定 `gateway.replicaCount`。後端與 UI 使用各自的 `hpa.enabled` 與 `replicaCount` 欄位。所有設定請參閱 [Helm 值參考](./helm.md#valuesyaml-reference)。
