---
title: Server Tuning
description: LiteLLM Proxy 容器的選用深度調校；替代 ASGI 伺服器、worker 迴圈回收、無中斷重啟、TLS、keepalive，以及從物件儲存載入設定。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 伺服器調校 {#server-tuning}

只有在預設值不夠用時才來看這一頁。大多數部署都應該每個 pod 執行一個 Uvicorn worker 並水平擴展，如 [production checklist](./prod.md#sizing-and-workers) 所述。以下選項適用於您將多個 worker 打包進同一個容器、在 proxy 端終止 TLS、提供 HTTP/2，或無法在主機上掛載設定檔時。每個旗標請參閱 [CLI reference](./cli.md)。

## Uvicorn 與 Gunicorn {#uvicorn-vs-gunicorn}

LiteLLM Proxy 預設執行於 [Uvicorn](https://uvicorn.dev/)。改用 `--run_gunicorn` 則會啟動 [Gunicorn](https://gunicorn.org/) 作為程序管理器，監督 [Uvicorn worker processes](https://uvicorn.dev/deployment/#gunicorn)（`uvicorn.workers.UvicornWorker`）。在這兩種情況下，應用程式程式碼仍然執行在 Uvicorn 上；差別在於由哪個程序管理並回收 worker。

| | Uvicorn（預設） | Gunicorn（`--run_gunicorn`） |
|---|---|---|
| **何時使用** | 幾乎所有部署都建議使用，特別是 Kubernetes 中每個 pod 一個 worker 的情境。 | 當您在**單一容器中執行多個 worker**，並希望有成熟的程序管理器來監督與回收它們時選擇。 |
| **worker 回收** | Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)。 | Gunicorn 的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)，這是 Gunicorn 多年來提供、經實戰驗證的機制。 |
| **程序監督** | Uvicorn 內建的多程序管理器。 | Gunicorn 的 [arbiter](https://gunicorn.org/design/#arbiter)，會在 worker 結束時一次重啟一個。 |

:::tip[建議]

在 Kubernetes 上，請**每個 pod 執行一個 Uvicorn worker**，並**水平**（更多 pod）而非垂直（每個 pod 更多 worker）擴展。每個 pod 一個程序可讓負載下的延遲更可預測、讓 Horizontal Pod Autoscaler 能準確使用 [production checklist 中的門檻](./prod.md#autoscaling)，並使滾動重啟成為無中斷，因為 Kubernetes 一次只會排空一個 pod。只有在您必須將多個 worker 打包進單一容器時，才改用 Gunicorn。

:::

### 回收 worker {#recycle-workers}

如果您在持續負載下觀察到記憶體逐漸增加，可在固定請求數之後回收每個 worker，以限制記憶體使用量。`--max_requests_before_restart` 對應到 Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)（預設伺服器）以及 Gunicorn 在 `--run_gunicorn` 下的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)。可透過 CLI 旗標或環境變數設定：

```shell
# CLI
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "1", "--max_requests_before_restart", "10000"]

# or ENV (for deployment manifests / containers)
export MAX_REQUESTS_BEFORE_RESTART=10000
```

:::tip

當您在**單一容器中執行多個 worker**且依賴 `--max_requests_before_restart` 時，請優先選用 `--run_gunicorn`。Gunicorn 的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests) 回收比 Uvicorn 的更成熟，而且其 [arbiter](https://gunicorn.org/design/#arbiter) 會一次重啟一個 worker，因此當某個 worker 被替換時，pod 仍可持續提供流量。

:::

```shell
# Multiple workers in one container, with Gunicorn-managed recycling
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000"]
```

當多個 worker 同時啟動並承載相似的流量時，它們幾乎會在同一時間達到請求門檻並同步回收，一次降掉一大塊容量。加入 `--max_requests_before_restart_jitter`，即可將每個 worker 的門檻按 `[0, jitter]` 內的隨機量偏移，讓重啟錯開而非同步。它對應到 Uvicorn 的 [`limit_max_requests_jitter`](https://uvicorn.dev/settings/#resource-limits)（需要 `uvicorn>=0.41.0`）以及 Gunicorn 的 [`max_requests_jitter`](https://gunicorn.org/reference/settings/#max_requests_jitter)，且在沒有 `--max_requests_before_restart` 時不會產生任何效果。

```shell
# Stagger recycling so workers don't all restart at once
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000", "--max_requests_before_restart_jitter", "1000"]
```

### 讓重啟保持無中斷 {#keep-restarts-hitless}

當進行中的請求在程序結束前完成時，重啟就是「無中斷」的，因此不會有任何用戶端看到連線中斷。生產環境中有兩種情況很重要：

**worker 回收（來自 `--max_requests_before_restart`）。** 兩種伺服器都會停止在被回收的 worker 上接受新連線，讓未完成的請求在它退出前排空，接著啟動替代 worker。Gunicorn 另外還保證在其 [`graceful_timeout`](https://gunicorn.org/reference/settings/#graceful_timeout)（預設 30s）內，進行中的請求都可完成，適用於 [`SIGTERM`](https://gunicorn.org/signals/)。在每個 pod 一個 worker 的情況下，回收會短暫降低該 pod 的容量，這就是為什麼我們建議水平擴展，讓負載平衡器可以繞過它。

**滾動部署與 pod 重啟（Kubernetes）。** 請在編排層讓重啟保持無中斷，而不是只依賴伺服器本身：

- 使用 [`RollingUpdate`](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment) 策略（Deployment 預設值），讓新 pod 在舊 pod 終止前先變成 Ready。
- 在 `/health/readiness` 上保留 [readiness probe](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)，使 Kubernetes 只將流量送往可提供服務的 pod，並在終止開始時立刻停止路由到該 pod。
- 將 [`terminationGracePeriodSeconds`](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) 設為明顯高於您預期最長請求時間（LiteLLM 的 request timeout 預設為 600s；請參閱 [recommended config](./prod.md#set-a-request-timeout)）。在終止時，Kubernetes 會送出 `SIGTERM`，而 Uvicorn 與 Gunicorn 都會在結束前透過排空進行中的請求來[優雅地](https://uvicorn.dev/deployment/)關閉。
- 視需要加入一個小型的 [`preStop` hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks)（例如 `sleep 5`），給負載平衡器時間在伺服器開始關閉前將該 pod 取消註冊，消除流量仍可能到達正在終止的 pod 的短暫窗口。

```yaml title="Kubernetes Deployment snippet for hitless rolling restarts"
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0   # never drop below desired replica count
      maxSurge: 1         # add one new pod at a time
  template:
    spec:
      terminationGracePeriodSeconds: 620   # > your longest request (request_timeout: 600)
      containers:
        - name: litellm
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 4000
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

## 在 proxy 端的 TLS {#tls-at-the-proxy}

若要由 proxy 本身終止 TLS（而非您的負載平衡器），請傳入金鑰與憑證路徑：

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --ssl_keyfile_path ssl_test/keyfile.key \
    --ssl_certfile_path ssl_test/certfile.crt
```

## 使用 Hypercorn 的 HTTP/2 {#http2-with-hypercorn}

若要提供 HTTP/2，請建立安裝了 hypercorn 的映像檔，並傳入 `--run_hypercorn`：

```shell
FROM docker.litellm.ai/berriai/litellm:latest
WORKDIR /app
COPY config.yaml .
RUN chmod +x ./docker/entrypoint.sh
EXPOSE 4000/tcp
RUN uv add hypercorn
CMD ["--port", "4000", "--config", "config.yaml"]
```

```shell
docker run \
    -v $(pwd)/proxy_config.yaml:/app/config.yaml \
    -p 4000:4000 \
    -e DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname> \
    -e LITELLM_MASTER_KEY="sk-<paste-a-long-random-key>" \
    your_custom_docker_image \
    --config /app/config.yaml \
    --run_hypercorn
```

## 對提供者的外送 HTTP/2 {#outbound-http2-to-providers}

自 v1.103.0 起可用。

上述伺服器旗標只影響從您的用戶端到 LiteLLM 的這一跳。LiteLLM 到 LLM 提供者的呼叫預設使用 HTTP/1.1，因為預設的 aiohttp transport 沒有 HTTP/2 client。請在 `litellm_settings` 下設定 `http2: true`（或 `LITELLM_HTTP2` 環境變數），讓 LiteLLM 透過 TLS 與提供者協商 HTTP/2；不透過 ALPN 提供 `h2` 的上游會自動回退到 HTTP/1.1，而純 `http://` 的上游則會維持在 HTTP/1.1。

```yaml
litellm_settings:
  http2: true
```

啟用此功能會讓提供者流量改走 httpx，而不是 aiohttp；aiohttp 是因為其較高的 HTTP/1.1 吞吐量才被選為預設。請先在開啟旗標的情況下進行負載測試，再全面啟用。若您透過 `litellm.client_session` 或 `litellm.aclient_session` 自行傳入用戶端，則會原樣使用，不會切換為 HTTP/2。`aiohttp_openai/` 提供者上的部署一律使用 aiohttp 並維持在 HTTP/1.1；若對此類請求開啟該旗標，LiteLLM 會記錄警告。

## Granian ASGI 伺服器 [Beta] {#granian-asgi-server-beta}

:::info[Beta 功能]
`--run_granian` 屬於**beta**。Uvicorn 仍是預設伺服器。當您需要更高的 gateway 吞吐量，或在使用 uvicorn 時於負載下看到不穩定現象，請嘗試 Granian；問題請回報到 [GitHub](https://github.com/BerriAI/litellm/issues)。
:::

[Granian](https://github.com/emmett-framework/granian) 是一個以 Rust 為後端的 ASGI 伺服器。在 LiteLLM 基準測試中，與相同 worker 數量的 uvicorn 相比，它提升了 10 到 20 RPS，在持續負載下延遲更穩定，且錯誤率更低（請參閱 [PR #26027](https://github.com/BerriAI/litellm/pull/26027)）。請使用 `--num_workers` 來擴展吞吐量。

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml \
    --port 4000 \
    --run_granian \
    --num_workers 4
```

使用 Granian 啟用 TLS 時，需要同時設定 `--ssl_certfile_path` 與 `--ssl_keyfile_path`。Granian 不支援：`--max_requests_before_restart`（請改用 Gunicorn 進行每請求 worker 回收）以及 `--ciphers`（僅限 Hypercorn）。請參閱 [CLI server backend options](/docs/proxy/cli#server-backend-options)。

## 每個 worker 的接納控制 {#per-worker-admission-control}

處於飽和狀態的工作程序仍會持續接受連線，因此在負載尖峰期間，呼叫端會在沒有超載訊號的情況下等待數秒，而 liveness probe（也在同一個迴圈上執行）會變慢到足以讓 Kubernetes 重新啟動 pod，並將負載推到剩餘的複本上。Admission control 會對每個工作程序處理的工作量設下硬性上限，並把超出的部分轉成明確、快速的 `503`，讓用戶端可以重試。

```yaml
general_settings:
  max_in_flight_requests_per_worker: 64   # requests being processed at once, per worker process
  max_queued_requests_per_worker: 64      # requests waiting for a slot; defaults to the in-flight cap
  admission_queue_timeout_seconds: 1.0    # a queued request is rejected after waiting this long
```

此功能會保持關閉，直到設定 `max_in_flight_requests_per_worker`。當請求到達且工作程序有可用插槽時，就會立即執行。否則它會在佇列中等待，直到有插槽釋放或逾時到期。如果佇列已滿，或等待逾時，用戶端會收到：

```
HTTP/1.1 503 Service Unavailable
retry-after: 1

{"error":{"message":"Worker at capacity: 64 in-flight, 64 queued requests. Retry later.","type":"overloaded_error","code":"503"}}
```

插槽會在整個回應期間被保留，因此串流 completion 會被視為一個 in-flight request，直到最後一個區塊送出為止，而用戶端中斷連線（排隊中或 in flight）會立即釋放插槽。探針與指標路徑（`/health/liveliness`、`/health/liveness`、`/health/readiness`、`/health/readiness/details`、`/health/backlog`、`/health/drain`、`/metrics`）會繞過此閘門，因此過載的工作程序仍會快速回應其 liveness probe，而卡住的程序則不會。拒絕會在驗證之前發生，因此在 spend logs 中不會歸屬到某個金鑰。這些限制會在第一個請求時讀取，且需要重新啟動才能變更。

此上限是每個工作程序程序各自適用，且在 uvicorn 和 Granian 上的運作方式相同。以 `--num_workers 4` 和 `max_in_flight_requests_per_worker: 64` 啟動的 pod 最多可接受 256 個並行請求，而 N 個複本的部署可接受其 N 倍，因此應根據您量測到的每個工作程序吞吐量來設定，而不是依據部署總量。這非常適合搭配 HPA：已經飽和的複本會以 `503` 拒絕負載，而不是在新複本啟動期間累積延遲。它與 `global_max_parallel_requests` 相輔相成，後者是透過 Redis 協調的整體部署層級限制：使用全域限制來界定對您的提供者的總負載，並使用每工作程序限制來確保任何單一事件迴圈不會在不依賴 Redis 的情況下被淹沒。

可使用 `/health/backlog`（欄位 `in_flight_requests`、`admitted_requests`、`queued_requests`、`rejected_requests`）或 Prometheus 指標 `litellm_admission_admitted_requests`、`litellm_admission_queued_requests` 和 `litellm_admission_rejected_requests_total{reason="queue_full"|"queue_timeout"}` 進行監控；請參閱 [Pod 健康指標](/docs/proxy/prometheus#pod-health-metrics)。持續出現 `queue_timeout` 拒絕表示工作程序已達容量上限，需要更多複本；`queue_full` 拒絕表示尖峰到達的速度快於佇列可吸收的速度，因此請增加佇列大小或新增容量。

## Keepalive timeout {#keepalive-timeout}

預設為 5 秒；在請求之間，連線必須在此期間內收到新資料，否則將會中斷連線。

```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --keepalive_timeout 75
```

或將 `KEEPALIVE_TIMEOUT=75` 設為環境變數。

## 從 S3 或 GCS 載入 config.yaml {#load-configyaml-from-s3-or-gcs}

如果無法在部署服務（AWS Fargate、Railway 等）上掛載設定檔，請使用此方式。LiteLLM 會在啟動時從儲存貯體讀取 `config.yaml`。

<Tabs>
<TabItem value="gcs" label="GCS Bucket">

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_TYPE="gcs" \
   -e LITELLM_CONFIG_BUCKET_NAME="litellm-proxy" \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="proxy_config.yaml" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm:latest
```

</TabItem>
<TabItem value="s3" label="s3">

```shell
docker run --name litellm-proxy \
   -e DATABASE_URL=<database_url> \
   -e LITELLM_CONFIG_BUCKET_NAME="litellm-proxy" \
   -e LITELLM_CONFIG_BUCKET_OBJECT_KEY="litellm_proxy_config.yaml" \
   -p 4000:4000 \
   docker.litellm.ai/berriai/litellm:latest
```

</TabItem>
</Tabs>

## 停用載入即時模型價格 {#disable-pulling-live-model-prices}

若您看到較長的冷啟動，或有網路輸出限制，請將 `LITELLM_LOCAL_MODEL_COST_MAP="True"` 設為使用內建的 [模型價格檔案](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)，而不是在啟動時擷取。
