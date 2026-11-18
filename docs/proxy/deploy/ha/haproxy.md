---
title: L7 proxy 與 LiteLLM
sidebar_label: L7 proxy 與 LiteLLM
description: 使用 L7 proxy 緩衝短暫的流量突增，並將請求路由到健康的 LiteLLM 副本。此範例使用 Kubernetes 上的 HAProxy。
toc_max_heading_level: 2
---

import HAProxyKubernetesArchitecture from '@site/src/components/HAProxyKubernetesArchitecture';

# L7 proxy 與 LiteLLM {#l7-proxy-with-litellm}

{/* keep-version-note */}

L7 proxy 會緩衝短暫的流量突增、限制並行請求，並將流量路由到健康的 LiteLLM 副本。此範例使用 **Kubernetes 上的 HAProxy**，搭配 LiteLLM 准入控制與 KEDA 自動擴展。**HAProxy 與 KEDA 都是可選的**；若現有的入口與自動擴展元件已提供以下控制，請重複使用它們。

<HAProxyKubernetesArchitecture />

## 容量規劃 {#capacity-planning}

在節點與可用性區域之間維持熱備援副本，並為故障的 Pod 與發佈突增保留餘裕。依並行請求、佇列中的承載與串流來調整記憶體大小；依最大副本數、工作者與遷移數量來編列資料庫連線。請參閱[規模與擴展](../sizing.md)、[連線限制](../../prod.md#bound-database-connections) 與 [GKE 與 Helm](../cloud/gcp.md#gke-with-helm)。

## 負載平衡 {#load-balancing}

LiteLLM 的准入佇列會保護每個工作者，但已排入佇列的請求會留在該工作者。HAProxy 在**請求到達 LiteLLM 之前**加入每 Pod 連線限制與短佇列，減輕突增期間工作者的壓力。若您現有的入口已提供同等的限制與緩衝，請重複使用它。

每個 HAProxy 副本擁有自己的佇列。位於其**未指派後端佇列**中的請求可以使用任何就緒的 Pod，包括新加入的 Pod；位於每伺服器佇列中的請求則已指派給該 Pod。

此範例假設使用 HTTP/1.1 用戶端，且每個 Pod 有一個工作者。請在入口終止 TLS，並將位址換成透過服務探索維護的 Pod IP。直接路由到 Pod：Kubernetes Service VIP 會隱藏個別 Pod 的容量。請依您的工作負載調整限制。

```text title="haproxy.cfg"
defaults
    mode http
    timeout connect 3s
    timeout check 3s
    timeout client 180s
    timeout server 180s
    timeout queue 2s

frontend gateway
    bind :8080
    maxconn 1024
    default_backend gateways

backend gateways
    balance leastconn
    option http-server-close
    option httpchk GET /health/readiness
    http-check expect status 200
    server pod1 10.0.0.11:4000 check maxconn 64 maxqueue 8
    server pod2 10.0.0.12:4000 check maxconn 64 maxqueue 8
```

每伺服器的 `maxconn` 會限制作用中的上游請求；`maxqueue` 會限制已指派的等候請求。前端的 `maxconn` 會限制已接受的用戶端連線，佇列逾時會回傳 `503`。用戶端／伺服器逾時衡量的是**閒置時間**，而非總持續時間。限制以每個 HAProxy 副本為單位；也請將作業系統監聽 backlog 納入考量。

## 准入控制 {#admission-control}

使用小型佇列啟用[每工作者准入控制](../../server_tuning.md#per-worker-admission-control)：

```yaml
general_settings:
  max_in_flight_requests_per_worker: 64
  max_queued_requests_per_worker: 8
  admission_queue_timeout_seconds: 1.0
```

佇列已滿或佇列逾時會回傳 `503` 與 `retry-after: 1`。用戶端應遵守該標頭，並使用有界的重試，搭配抖動與總期限。請協調[路由器重試](../../../routing.md)；避免重播部分串流，或副作用不確定的請求。

使用[共用 Redis](../../redis_requirements.md) 套用[金鑰與團隊速率限制](../../users.md)，以落實租戶配額。這些控制不會在工作者之間移動已排入佇列的請求，也無法取代准入限制。

## 自動擴展 {#autoscaling}

**以請求為基礎的自動擴展並不需要 KEDA。**它會將 Prometheus 查詢連接到 Kubernetes HPA，並代為管理 HPA。[搭配 Prometheus Adapter 的 HPA](../autoscaling.md#scale-on-requests-and-tokens-per-pod) 也支援以請求為基礎的擴展；若您已使用該設定，請保留它。

請同時依據 `litellm_admission_admitted_requests` 與 `litellm_admission_queued_requests` 以及 RPS 進行擴展。這兩個量測都不包含 HAProxy 佇列，且已完成請求的計數器會落後於長時間串流。也請監控佇列深度、拒絕數、CPU 與記憶體。

在此 KEDA 範例中，請先安裝 KEDA 與 Prometheus Operator，再合併以下 Helm 值，並保留現有的回呼。它以每個 Pod 48 個未完成請求為目標；請依您的工作者限制調整此值。

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
  hpa:
    enabled: false
  keda:
    enabled: true
    minReplicaCount: 4
    maxReplicaCount: 20
    pollingInterval: 15
    prometheus:
      serverAddress: http://prometheus-operated.monitoring.svc:9090
      targetRequestsPerSecond: "50"
    triggers:
      - type: prometheus
        metricType: AverageValue
        metadata:
          serverAddress: http://prometheus-operated.monitoring.svc:9090
          query: 'sum(litellm_admission_admitted_requests{namespace="litellm",job="litellm-gateway-metrics"}) + sum(litellm_admission_queued_requests{namespace="litellm",job="litellm-gateway-metrics"})'
          threshold: "48"
          ignoreNullValues: "false"
```

請設定您的命名空間、metrics Service 的 job 標籤、位址與閾值，並確認兩個量測都存在。`ignoreNullValues: "false"` 會將缺少結果視為錯誤；請為 metrics 失敗設定 [KEDA 備援](../autoscaling.md#keda-alternative)。

請維持熱備援容量：短佇列能吸收突增，但無法保證請求能等到新 Pod 啟動。當工作者被阻擋時，metrics sidecar 可能會提供停滯的計數器，因此除了抓取失敗外，也請監控外部健康探針與請求延遲。
