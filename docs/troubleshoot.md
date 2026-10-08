# 停機故障排除 {#outage-troubleshooting}

當 LiteLLM 節點當機時，請使用此頁面：pod 重新啟動或出現 OOMKilled、負載平衡器將目標標記為不健康，或整個部署中的請求逾時。我們調查的大多數停機事件，最後都歸因於容量設定（每個 worker 的 CPU 或記憶體）、workers 同時重啟，或某個依賴項（資料庫、Redis、上游提供者）阻塞了 event loop。這些狀況只有從部署端才能看見，因此支援需要以下資訊，才能提供根本原因，而不是一連串後續問題。

在提交工單前，請先蒐集此清單中的所有項目。請從您分享的每個檔案中刪除 API 金鑰、資料庫密碼與其他機密。

## 要提供的內容 {#what-to-send}

| 資訊 | 我們需要它的原因 | 如何蒐集 |
|-------------|----------------|-------------------|
| Kubernetes 事件 | 顯示重新啟動、`OOMKilled`、失敗的 liveness 或 readiness probe、驅逐與排程失敗，並附時間戳記 | `kubectl get events` 與 `kubectl describe pod`，請參閱[Kubernetes 事件](#kubernetes-events) |
| `values.yaml` | 副本數量、資源請求與限制、probe 設定、自動調整、worker 數量，以及 pod 實際執行時使用的環境變數 | `helm get values <release>`，請參閱[values.yaml](#valuesyaml) |
| `config.yaml` | 代理程式載入的模型清單、路由設定、快取與資料庫設定、回呼，以及一般設定 | 從執行中的 pod 內讀取，請參閱[config.yaml](#configyaml) |
| 節點類型 | pod 所執行的機器類別，以便與 pod 的請求內容進行比對 | `kubectl describe node`，請參閱[節點類型](#node-type) |
| CPU | 每個 pod 的 CPU 請求與限制，以及事故期間的 CPU 使用量，並與[sizing recommendation](./proxy/prod.md#machine-specifications)比較 | `kubectl top pod`與您的 metrics 儀表板，請參閱[CPU 與記憶體](#cpu-and-memory) |
| 記憶體 | 每個 pod 的記憶體請求與限制，以及事故期間的記憶體使用量；一個`OOMKilled` pod 就是記憶體問題，無論日誌說了什麼 | `kubectl top pod`與您的 metrics 儀表板，請參閱[CPU 與記憶體](#cpu-and-memory) |
| RPS | 部署當機時的每秒請求數與正常基準，讓我們能將 CPU 與記憶體數字對照負載 | Prometheus 或負載平衡器 metrics，請參閱[RPS](#rps) |

除了上述內容之外，還請提供 LiteLLM 版本（映像標籤，或來自 `GET /health/readiness/details` 的 `litellm_version`）、事故的 UTC 時間線、您那邊看到的「當機」樣貌（負載平衡器回傳 5xx、probe 失敗、重新啟動、逾時）、是否所有副本同時失敗或依序失敗、資料庫與 Redis 是否同時健康，以及前幾天內的任何變更（版本升級、新模型、流量增加、`values.yaml` 或 `config.yaml` 的變更）。

## Kubernetes 事件 {#kubernetes-events}

事件會記錄 Kubernetes 對 pod 做了什麼以及原因，而且大約一小時後就會過期，因此請在事故發生後盡快蒐集。

```shell
kubectl get events -n <namespace> --sort-by=.lastTimestamp
kubectl describe pod -n <namespace> <pod-name>
```

請提供這兩個指令的完整輸出。在 `describe` 輸出中，`Last State`、`Reason`、`Exit Code` 與 `Restart Count` 欄位會告訴我們容器是否為`OOMKilled`（exit code 137）、是否自行結束（`Error`），或是因為 probe 失敗而被終止。底部的 `Events` 區段會顯示 probe 失敗以及映像、排程或磁碟區問題。如果 pod 已被替換，請針對新 pod 執行相同指令，並附上前一個容器的日誌：

```shell
kubectl logs -n <namespace> <pod-name> --previous
```

如果事件已經過期，或容器執行環境不再保留前一個容器的日誌，請改提供 pod 重新啟動與終止歷史，以及來自您叢集的記錄或監控系統的 pod 日誌。

## values.yaml {#valuesyaml}

請提供發行版實際執行時使用的 values，而不是您儲存庫中的檔案，因為兩者可能會不同步。

```shell
helm get values <release-name> -n <namespace>
```

如果您尚未覆寫 `resources`、`replicaCount` 或 probe 設定，請加入 `--all` 以包含 chart 預設值；我們需要知道這些值最終會解析成什麼。如果您使用的是原始 manifest 或 Kustomize，而不是 Helm，請提供渲染後的 `Deployment`（`kubectl get deployment -n <namespace> <name> -o yaml`）以及 `HorizontalPodAutoscaler`（如果有的話）。

## config.yaml {#configyaml}

Helm chart 會將來自 `values.yaml` 的 `proxy_config` 渲染成 ConfigMap，並掛載到 `/etc/litellm/config.yaml`。請從執行中的 pod 讀取，以便我們看到代理程式載入的設定，包括任何環境變數替換：

```shell
kubectl exec -n <namespace> <pod-name> -- cat /etc/litellm/config.yaml
```

如果 pod 正在反覆當機，而 `exec` 因 `container not found` 而失敗，請改讀取 ConfigMap：

```shell
kubectl get configmap -n <namespace> <release-name>-config -o yaml
```

送出前請將 `api_key`、`database_url`、`master_key` 以及任何其他機密遮蔽。另外也請提供容器執行時會影響容量的環境變數：`NUM_WORKERS`、`MAX_REQUESTS_BEFORE_RESTART`、`MAX_REQUESTS_BEFORE_RESTART_JITTER`、`DATABASE_CONNECTION_POOL_LIMIT`、`DATABASE_CONNECTION_TIMEOUT`、`REDIS_HOST`，以及 `LITELLM_MODE`。

## 節點類型 {#node-type}

節點類型是 LiteLLM pod 所排程到的 Kubernetes 節點之 instance 類別或機器規格。雲端提供者會為每個節點加上標籤，而 `describe node` 也會顯示該節點已有多少資源分配給其他 pod：

```shell
kubectl get pod -n <namespace> <pod-name> -o wide
kubectl get node <node-name> -o jsonpath='{.metadata.labels.node\.kubernetes\.io/instance-type}{"\n"}'
kubectl describe node <node-name>
```

請提供 instance type（例如 `m6i.2xlarge` 或 `n2-standard-8`）以及 `describe node` 中的 `Capacity`、`Allocatable` 與 `Allocated resources` 區段。如果您是在裸機或 VM 上執行，請改提供該機器的 vCPU 數量與記憶體。若節點過度超額配置，即使 pod 自己的限制看起來正確，也會讓 LiteLLM 降速。

## CPU 與記憶體 {#cpu-and-memory}

每一項我們都需要兩件事：pod 被允許使用的內容（requests 與 limits），以及它在事故期間實際使用了多少。

```shell
kubectl get pod -n <namespace> <pod-name> -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'
kubectl top pod -n <namespace>
```

`kubectl top` 需要在叢集中安裝 metrics-server，且只會顯示目前使用量，因此也請從 Prometheus、CloudWatch、Datadog，或您使用的其他工具，匯出事故前一小時到恢復後的每個 pod CPU 與記憶體圖表或表格。在 Prometheus 中，依 pod 篩選的 `container_cpu_usage_seconds_total` 與 `container_memory_working_set_bytes` 是正確的序列。請將每個 pod 的 worker 數量與數字一併註明：[production guide](./proxy/prod.md#machine-specifications) 建議每個 worker 使用 1 vCPU 與 4Gi 記憶體，而在 1 vCPU 與 4Gi 上執行四個 workers 的 pod 即使每個 worker 看起來都已正確設定，仍然屬於容量不足。

## RPS {#rps}

每秒請求數可告訴我們部署是因為正常負載還是突發尖峰而崩潰。如果您已啟用[Prometheus metrics](./proxy/prometheus.md)，請查詢事故期間的 proxy request counter：

```promql
sum(rate(litellm_proxy_total_requests_metric_total[1m]))
sum by (pod) (rate(litellm_proxy_total_requests_metric_total[1m]))
```

如果您沒有抓取 LiteLLM metrics，請使用其前方負載平衡器或 ingress 的請求計數（例如 CloudWatch 中的 ALB `RequestCount` metric）。請提供事故期間的峰值 RPS、事故前一小時的 RPS 與典型基準，以及處理該流量的副本數量，以便我們算出每個 pod 與每個 worker 的 RPS。

## 不使用 Kubernetes 的部署 {#deployments-without-kubernetes}

對於 Docker Compose 或 VM 上的單一容器，這些資訊都來自 Docker 與主機：

```shell
docker inspect <container-name> --format '{{.State.Status}} {{.State.OOMKilled}} {{.State.ExitCode}} {{.RestartCount}} {{.HostConfig.NanoCpus}} {{.HostConfig.Memory}}'
docker logs --since 1h <container-name>
docker stats --no-stream <container-name>
nproc && free -h
```

請以您的 `docker-compose.yaml`（或 `docker run` 指令）取代 `values.yaml`，以及您掛載到容器中的 `config.yaml`，另外提供 VM 的 instance type 或 vCPU 與記憶體，以及位於容器前方的任何負載平衡器所提供的 RPS。

## 我們首先查看的內容 {#what-we-look-at-first}

了解哪些支援會先檢查，能讓您在等待時先自行檢查。尺寸過小的 pod 是最常見的原因：請將 CPU 和記憶體限制，以及 worker 數量，與 [機器規格](./proxy/prod.md#machine-specifications) 進行比較。若有多個 pod 大約在同一時間重新啟動，且沒有 OOMKill，請檢查 `MAX_REQUESTS_BEFORE_RESTART` 是否在未加上 [jitter](./proxy/server_tuning.md#recycle-workers) 的情況下設定，這會使同時啟動的 workers 也同時回收。若在程序仍持續執行時 readiness probe 失敗，請檢查資料庫：當設定的資料庫無法連線時，`GET /health/readiness` 會回傳 503，請參閱 [健康狀態端點](./proxy/health.md#probe-endpoints)。若請求逾時但 CPU 仍偏低，請在記錄中尋找 Redis 或資料庫逾時，並檢查 [正式環境設定](./proxy/prod.md) 中的連線限制與請求逾時。

## 支援 {#support}

請將蒐集到的資訊透過 [Slack](https://www.litellm.ai/support)、[Discord](https://discord.gg/wuPM9dRgDw)，或寄送電子郵件至 [ishaan@berri.ai](mailto:ishaan@berri.ai) 和 [krrish@berri.ai](mailto:krrish@berri.ai) 與 LiteLLM 團隊分享。如果您已經有我們的支援頻道，請直接貼在那裡。
