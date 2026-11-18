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
| **何時使用** | 幾乎所有部署都建議使用，特別是 Kubernetes 中每個 pod 一個 worker 的情境。 | 當您在**單一容器中執行多個 worker**，並希望由 Gunicorn 來監督它們時選擇。Gunicorn 會忽略 `--keepalive_timeout`，因此請避免在會重複使用連線的負載平衡器後方使用它（請參閱 [Keepalive timeout](#keepalive-timeout)）。 |
| **worker 回收** | Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)。 | Gunicorn 的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)。兩者在目前每次回收時都會丟棄請求（請參閱 [回收 worker](#recycle-workers)）。 |
| **程序監督** | Uvicorn 內建的多程序管理器。 | Gunicorn 的 [arbiter](https://gunicorn.org/design/#arbiter)，會在 worker 結束時一次重啟一個。 |

:::tip[建議]

在 Kubernetes 上，請**每個 pod 執行一個 Uvicorn worker**，並**水平**（更多 pod）而非垂直（每個 pod 更多 worker）擴展。每個 pod 一個程序可讓負載下的延遲更可預測、讓 Horizontal Pod Autoscaler 能準確使用 [production checklist 中的門檻](./prod.md#autoscaling)，並使滾動重啟成為無中斷，因為 Kubernetes 一次只會排空一個 pod。只有在您必須將多個 worker 打包進單一容器時，才改用 Gunicorn。

:::

### 回收 worker {#recycle-workers}

如果您在持續負載下觀察到記憶體逐漸增加，可以在固定請求數之後回收每個 worker，以限制記憶體使用量。請將此視為提高記憶體上限或新增複本之後的最後手段，因為目前每次回收都會丟棄請求（請參閱下方警告）。`--max_requests_before_restart` 對應到 Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)（預設伺服器）以及 Gunicorn 在 `--run_gunicorn` 下的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)。可透過 CLI 旗標或環境變數設定：

```shell
# CLI
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "2", "--max_requests_before_restart", "10000", "--max_requests_before_restart_jitter", "1000"]

# or ENV (for deployment manifests / containers)
export MAX_REQUESTS_BEFORE_RESTART=10000
```

:::danger[回收會丟棄請求]

回收在兩種伺服器上都不是無中斷的。當 worker 達到其上限時，它會一次關閉所有閒置的 keep-alive 連線。會重複使用到 LiteLLM 連線的反向 proxy 或負載平衡器（Traefik、使用 upstream `keepalive` 的 nginx、Cloud Run、大多數雲端負載平衡器）可能在此時將請求送進其中一條連線，並向用戶端回傳 `502`。在穩定負載下，worker 持有的幾乎每條連線都會遺失一個請求，因此每次回收都會在 proxy 上表現為一陣 5xx 爆發，而在相同負載下關閉回收則完全不會發生。切換到 `--run_gunicorn` 也沒有幫助，因為 Gunicorn 的回收會以相同方式失敗。

從 v1.108.0 起，回收還會取消在回收開始後仍在執行 `GRACEFUL_SHUTDOWN_TIMEOUT` 秒（預設 30）的任何請求。以此方式被切斷的非串流呼叫會得到 `500`，而串流會在中途停止，沒有 `[DONE]` 也沒有錯誤，因此用戶端可能將被切斷的回答誤認為完整回答。LLM 呼叫通常執行超過 30 秒。

如果您仍然需要回收，請設定較高的上限讓回收很少發生，加入 jitter，並將 `GRACEFUL_SHUTDOWN_TIMEOUT` 提高到高於您最長的請求（`request_timeout`），讓長呼叫可以完成。同一個變數也會限制 `SIGTERM` 時的排空，因此請讓 `terminationGracePeriodSeconds` 高於它。這些設定都無法阻止已關閉 keep-alive 連線造成的 `502`。

:::

:::warning

只有在兩個以上 worker 時才使用 `--max_requests_before_restart`。在 `--num_workers 1` 時，沒有其他 worker 可以繼續提供服務，因此達到上限會讓整個 pod 停止服務：Uvicorn 會以結束碼 0 退出程序並重新啟動容器，而 Gunicorn 在替代 worker 啟動完成前不接受任何連線。當旗標與單一 worker 一起設定時，proxy 會在啟動時印出警告。每個 HTTP 請求都計入上限，包括健康探針，因此每 15 秒兩個探針一天就用掉 11,520 個請求。在每個 pod 一個 worker 的情況下，請改依賴 Kubernetes 替換 pod。

:::

當多個 worker 同時啟動並承載相似的流量時，它們幾乎會在同一時間達到請求門檻並同步回收，一次降掉一大塊容量。加入 `--max_requests_before_restart_jitter`，即可將每個 worker 的門檻按 `[0, jitter]` 內的隨機量偏移，讓重啟錯開而非同步。它對應到 Uvicorn 的 [`limit_max_requests_jitter`](https://uvicorn.dev/settings/#resource-limits)（需要 `uvicorn>=0.41.0`）以及 Gunicorn 的 [`max_requests_jitter`](https://gunicorn.org/reference/settings/#max_requests_jitter)，且在沒有 `--max_requests_before_restart` 時不會產生任何效果。

```shell
# Stagger recycling so workers don't all restart at once
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--max_requests_before_restart", "10000", "--max_requests_before_restart_jitter", "1000"]
```

### 讓重啟保持無中斷 {#keep-restarts-hitless}

當進行中的請求在程序結束前完成時，重啟就是「無中斷」的，因此不會有任何用戶端看到連線中斷。生產環境中有兩種情況很重要：

**worker 回收（來自 `--max_requests_before_restart`）。** 目前回收不是無中斷的，無論 worker 數量多少都一樣。被回收的 worker 會停止接受新連線並排空它正在服務的請求，但它會一次關閉其閒置的 keep-alive 連線，因此前方的 keep-alive proxy 對送進這些連線的請求會回傳 `502`，而且從 v1.108.0 起，它會取消在 `GRACEFUL_SHUTDOWN_TIMEOUT`（預設 30s）後仍在執行的請求。請參閱 [回收 worker](#recycle-workers)。在每個 pod 一個 worker 的情況下，回收還會讓該 pod 停止服務，而不是降低其容量，因此絕不要在該情境使用 `--max_requests_before_restart`。

**滾動部署與 pod 重啟（Kubernetes）。** 請在編排層讓重啟保持無中斷，而不是只依賴伺服器本身：

- 使用 [`RollingUpdate`](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment) 策略（Deployment 預設值），讓新 pod 在舊 pod 終止前先變成 Ready。
- 在 `/health/readiness` 上保留 [readiness probe](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)，使 Kubernetes 只將流量送往可提供服務的 pod，並在終止開始時立刻停止路由到該 pod。
- 將 [`terminationGracePeriodSeconds`](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) 設為明顯高於您預期最長請求時間（LiteLLM 的 request timeout 預設為 600s；請參閱 [recommended config](./prod.md#set-a-request-timeout)）。在終止時，Kubernetes 會送出 `SIGTERM`，而 Uvicorn 與 Gunicorn 都會在結束前透過排空進行中的請求來[優雅地](https://uvicorn.dev/deployment/)關閉。從 v1.108.0 起，該排空最多等待 `GRACEFUL_SHUTDOWN_TIMEOUT`（預設 30s），之後會取消仍在執行的請求，因此請將它提高到能涵蓋您最長的請求，並讓 `terminationGracePeriodSeconds` 保持高於它。
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
          env:
            - name: GRACEFUL_SHUTDOWN_TIMEOUT
              value: "600"    # drain long requests on SIGTERM; keep below terminationGracePeriodSeconds
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 4000
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

## 事件迴圈 {#event-loop}

<SinceVersion v="1.109.0" />

在 Linux 與 macOS 上，proxy 會在 [uvloop](https://github.com/MagicStack/uvloop) 上執行 Uvicorn。如果 worker 在事件迴圈內崩潰，例如 native backtrace 中出現 uvloop 的 segmentation fault（結束碼 139），請設定 `LITELLM_EVENT_LOOP=asyncio` 改在 asyncio 上執行，並觀察崩潰是否停止。

```shell
docker run -e LITELLM_EVENT_LOOP=asyncio docker.litellm.ai/berriai/litellm:latest \
    --config /app/config.yaml \
    --port 4000
```

此變數僅適用於預設的 Uvicorn 伺服器，且 `UVICORN_LOOP` 不會有效果，因為 proxy 會自行將迴圈傳給 Uvicorn。`--run_hypercorn` 本來就執行在 asyncio 上。`--run_gunicorn` 啟動的 Uvicorn worker 只要有安裝 uvloop 就會選用它，而 `--run_granian` 使用自己的迴圈選擇，因此兩者都會忽略 `LITELLM_EVENT_LOOP`。此變數首次隨 v1.109.0 提供，而 v1.108.x 版本一律使用 uvloop。

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

<SinceVersion v="1.103.0" />

上述伺服器旗標只影響從您的用戶端到 LiteLLM 的這一跳。LiteLLM 到 LLM 提供者的呼叫預設使用 HTTP/1.1，因為預設的 aiohttp transport 沒有 HTTP/2 client。唯一的例外是 [Vertex AI Search 向量儲存搜尋](#vertex-ai-search-vector-stores)。這涵蓋透過 LiteLLM 自有 HTTP 用戶端進行的呼叫。LiteLLM 透過提供者 SDK 進行的呼叫，例如透過 gRPC 的 `google-cloud-aiplatform` 與 Vertex AI speech 用戶端，或 Bedrock realtime 的 AWS CRT 用戶端，會使用該 SDK 選擇的協定，`http2` 不會改變它。請在 `litellm_settings` 下設定 `http2: true`（或 `LITELLM_HTTP2` 環境變數），讓 LiteLLM 透過 TLS 與提供者協商 HTTP/2；不透過 ALPN 提供 `h2` 的上游會自動回退到 HTTP/1.1，而純 `http://` 的上游則會維持在 HTTP/1.1。

```yaml
litellm_settings:
  http2: true
```

啟用此功能會讓提供者流量改走 httpx，而不是 aiohttp；aiohttp 是因為其較高的 HTTP/1.1 吞吐量才被選為預設。請先在開啟旗標的情況下進行負載測試，再全面啟用。若您透過 `litellm.client_session` 或 `litellm.aclient_session` 自行傳入用戶端，則會原樣使用，不會切換為 HTTP/2。`aiohttp_openai/` 提供者上的部署一律使用 aiohttp 並維持在 HTTP/1.1；若對此類請求開啟該旗標，LiteLLM 會記錄警告。在 `http2` 為 true 時，透過 LiteLLM HTTP 用戶端、同時在多個執行緒中執行的同步呼叫會共用一條 HTTP/2 連線且可能失敗，因此並行呼叫請使用非同步方法。

### Vertex AI Search 向量儲存 {#vertex-ai-search-vector-stores}

<SinceVersion v="1.109.0" />

在 `vertex_ai/search_api` 向量儲存上的搜尋預設會協商 HTTP/2，無論是透過 proxy 或透過 SDK 中的 `litellm.vector_stores.asearch`，因此一波搜尋會在每個 worker 間共用少數幾條 Google 連線，而不是每次搜尋都開啟一條連線。同步的 `litellm.vector_stores.search` 會維持在 HTTP/1.1，除非 `http2` 為 true。在 `http2` 為 true 時，同時從多個執行緒送出的同步搜尋會像任何其他同步呼叫一樣可能失敗，因此並行搜尋請使用 `asearch`。

在預設設定下（`http2` 未設定且 aiohttp transport 開啟），這些搜尋會走 httpx，但保留部分 aiohttp 連線池設定。LiteLLM 會為每 100 個進行中的搜尋多開一條連線，上限為 `AIOHTTP_CONNECTOR_LIMIT` 每 100 條一條（無條件進位），在預設值 1000 時即 10 條連線，而 `AIOHTTP_CONNECTOR_LIMIT=0` 會移除上限。每條連線一次最多執行 100 個搜尋，超過該上限後，新搜尋會在 LiteLLM 內等待已開啟連線上的空位。該等待沒有逾時，且搜尋自身的 `timeout` 不會將其計入。因此這裡的限制是連線上限，而不是進行中搜尋的上限，限制為 50 時，一條連線上仍可同時執行最多 100 個搜尋。`AIOHTTP_KEEPALIVE_TIMEOUT` 與 `DISABLE_AIOHTTP_TRUST_ENV` 也適用，而 `AIOHTTP_CONNECTOR_LIMIT_PER_HOST`、`AIOHTTP_TTL_DNS_CACHE` 與 `AIOHTTP_SO_KEEPALIVE` 設定則不適用。

在 `http2` 為 true 或 `DISABLE_AIOHTTP_TRANSPORT=True` 時，這些搜尋會與 httpx 上的其他每個提供者一樣，使用 httpx 預設連線池限制，因此所有 `AIOHTTP_*` 設定都不適用，且同一個 worker 中的搜尋會共用一條連線；因此進行中的搜尋超過 100 個後，其餘的會在 LiteLLM 內等待空位，且該等待沒有逾時。

如果 Google 在某條連線上有搜尋進行中時，以 HTTP/2 GOAWAY 關閉該連線，LiteLLM 會將該搜尋重試一次，並記錄 `Vector store search connection was closed by an HTTP/2 GOAWAY, retrying once`。Google 可能已經執行了第一次嘗試，因此該搜尋可能被計為兩次查詢。

若要讓這些搜尋維持在 HTTP/1.1，請在 `litellm_settings` 下設定 `http2: false`、設定 `LITELLM_HTTP2=False`（`0`、`no` 與 `off` 也有效），或在 SDK 中設定 `litellm.http2 = False`。這會為透過 LiteLLM HTTP 用戶端的每個提供者呼叫關閉 HTTP/2，包括 Vertex AI Search。設定或環境變數中若有一方為 true，會優先於另一方的 false，因此在設定 `http2: false` 之前，請先移除 `LITELLM_HTTP2=True`。

```yaml
litellm_settings:
  http2: false
```

在 SDK 中，將自己的 `ssl.SSLContext` 作為 `ssl_verify` 傳入的搜尋，在 `http2` 未設定時會維持在 HTTP/1.1，因此 LiteLLM 不會更動該 context 上的 ALPN 協定。在 `http2` 為 true 時，LiteLLM 會將該 context 設為提供 `h2`。

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

使用 Granian 啟用 TLS 時，需要同時設定 `--ssl_certfile_path` 與 `--ssl_keyfile_path`。Granian 不支援：`--max_requests_before_restart` 以及 `--ciphers`（僅限 Hypercorn）。請參閱 [CLI server backend options](/docs/proxy/cli#server-backend-options)。

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

在 `/v1/messages` 以及 [Anthropic Messages 路由上的錯誤](/docs/proxy/error_reference#errors-on-the-anthropic-messages-routes)所列的其他路由上，同樣的拒絕會保留其狀態與 `retry-after` 標頭，改用 Anthropic 的錯誤主體。<SinceVersion v="1.110.0" />

```
HTTP/1.1 503 Service Unavailable
retry-after: 1

{"type":"error","error":{"type":"overloaded_error","message":"Worker at capacity: 64 in-flight, 64 queued requests. Retry later."}}
```

插槽會在整個回應期間被保留，因此串流 completion 會被視為一個 in-flight request，直到最後一個區塊送出為止，而用戶端中斷連線（排隊中或 in flight）會立即釋放插槽。探針與指標路徑（`/health/liveliness`、`/health/liveness`、`/health/readiness`、`/health/readiness/details`、`/health/backlog`、`/health/drain`、`/metrics`）會繞過此閘門，因此過載的工作程序仍會快速回應其 liveness probe，而卡住的程序則不會。拒絕會在驗證之前發生，因此在 spend logs 中不會歸屬到某個金鑰。這些限制會在第一個請求時讀取，且需要重新啟動才能變更。

此上限是每個工作程序程序各自適用，且在 uvicorn 和 Granian 上的運作方式相同。以 `--num_workers 4` 和 `max_in_flight_requests_per_worker: 64` 啟動的 pod 最多可接受 256 個並行請求，而 N 個複本的部署可接受其 N 倍，因此應根據您量測到的每個工作程序吞吐量來設定，而不是依據部署總量。這非常適合搭配 HPA：已經飽和的複本會以 `503` 拒絕負載，而不是在新複本啟動期間累積延遲。它與 `global_max_parallel_requests` 相輔相成，後者是透過 Redis 協調的整體部署層級限制：使用全域限制來界定對您的提供者的總負載，並使用每工作程序限制來確保任何單一事件迴圈不會在不依賴 Redis 的情況下被淹沒。

可使用 `/health/backlog`（欄位 `in_flight_requests`、`admitted_requests`、`queued_requests`、`rejected_requests`）或 Prometheus 指標 `litellm_admission_admitted_requests`、`litellm_admission_queued_requests` 和 `litellm_admission_rejected_requests_total{reason="queue_full"|"queue_timeout"}` 進行監控；請參閱 [Pod 健康指標](/docs/proxy/prometheus#pod-health-metrics)。持續出現 `queue_timeout` 拒絕表示工作程序已達容量上限，需要更多複本；`queue_full` 拒絕表示尖峰到達的速度快於佇列可吸收的速度，因此請增加佇列大小或新增容量。

## 請求標頭緩衝區大小 {#request-header-buffer-size}

當 Uvicorn 選用 h11 時，預設伺服器與 `--run_gunicorn` 會為不完整的 HTTP 標頭使用 16 KiB 緩衝區。請以位元組為單位設定 [`--max_request_header_size`](./cli#--max_request_header_size) 或 `MAX_REQUEST_HEADER_SIZE`，以允許上游閘道加入的較大標頭。

```shell
litellm --config config.yaml --max_request_header_size 131072
```

這可讓標頭區塊不完整時最多累積 128 KiB。設定此值會保留 Uvicorn 的自動 parser 選擇。Uvicorn 通常在有安裝 httptools 時選用它，而 httptools 會忽略此設定。所設定的緩衝區在選用 h11 時適用。此設定不適用於 Hypercorn 或 Granian。在 h11 的預設緩衝區下，大型標頭可能會依其在讀取間被切分的方式，間歇性地回傳 `400 Invalid HTTP request received.`。請參閱 [Uvicorn 的 incomplete-event 緩衝區設定及其 16384 位元組預設值](https://uvicorn.dev/settings/#implementation)。

## Keepalive timeout {#keepalive-timeout}

預設為 5 秒；在請求之間，連線必須在此期間內收到新資料，否則將會中斷連線。
在會保持與 LiteLLM 的閒置連線開啟以供重用的反向 proxy 或負載平衡器後方，請將 LiteLLM 的 keep-alive 設得比該 proxy 對上游連線的閒置逾時更長。否則 LiteLLM 會關閉一條 proxy 仍認為開啟中的連線，proxy 將請求送進該連線，用戶端就會得到 `502`。Traefik 預設會保持後端閒置連線 90 秒（`idleConnTimeout`），而 nginx 使用 upstream `keepalive_timeout`（預設 60 秒），因此 `--keepalive_timeout 95` 可涵蓋這兩個預設值。如果您更改過這些值，或您的負載平衡器使用更長的閒置逾時，請再相應提高。

`--run_gunicorn` 會忽略 `--keepalive_timeout` 與 `KEEPALIVE_TIMEOUT`，其 worker 會保持 Gunicorn 的 2 秒 keep-alive，因此在會重複使用連線的負載平衡器後方，請改執行預設的 Uvicorn 伺服器。


```shell
docker run docker.litellm.ai/berriai/litellm:latest \
    --keepalive_timeout 95
```

或將 `KEEPALIVE_TIMEOUT=95` 設為環境變數。

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
