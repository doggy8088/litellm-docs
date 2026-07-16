import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Image from '@theme/IdealImage';

# ⚡ 生產環境最佳實務 {#-best-practices-for-production}

## 1. 使用這個 config.yaml {#1-use-this-configyaml}
在生產環境中使用這個 config.yaml（搭配您自己的 LLM）

```yaml
model_list:
  - model_name: fake-openai-endpoint
    litellm_params:
      model: openai/fake
      api_key: fake-key
      api_base: https://exampleopenaiendpoint-production.up.railway.app/

general_settings:
  master_key: sk-1234      # enter your own master key, ensure it starts with 'sk-'
  alerting: ["slack"]      # Setup slack alerting - get alerts on LLM exceptions, Budget Alerts, Slow LLM Responses
  proxy_batch_write_at: 60 # Batch write spend updates every 60s
  database_connection_pool_limit: 10 # connection pool limit per worker process. Total connections = limit × workers × instances. Calculate: MAX_DB_CONNECTIONS / (instances × workers). Default: 10.

  # OPTIONAL Best Practices
  disable_error_logs: True # turn off writing LLM Exceptions to DB
  allow_requests_on_db_unavailable: True # Only USE when running LiteLLM on your VPC. Allow requests to still be processed even if the DB is unavailable. We recommend doing this if you're running LiteLLM on VPC that cannot be accessed from the public internet.

litellm_settings:
  request_timeout: 600    # raise Timeout error if call takes longer than 600 seconds. Default value is 6000seconds if not set
  set_verbose: False      # Switch off Debug Logging, ensure your logs do not have any debugging on
  json_logs: true         # Get debug logs in json format
```
:::warning 多個執行個體

如果執行多個 LiteLLM 執行個體（例如 Kubernetes Pod），請記得每個執行個體都會放大您的總連線數。範例：3 個執行個體 × 4 個 worker × 10 個連線 = 總共 120 個連線。

:::

在您的環境變數中設定 slack webhook url
```shell
export SLACK_WEBHOOK_URL="example-slack-webhook-url"
```

關閉 FASTAPI 的預設資訊記錄
```bash
export LITELLM_LOG="ERROR"
```

:::info

需要協助或想要專屬支援嗎？可在[這裡](https://enterprise.litellm.ai/demo)與創辦人聯絡。

:::

## 2. 建議的機器規格 {#2-recommended-machine-specifications}

為了在生產環境中達到最佳效能，我們建議以下資源設定。

**1. 記憶體 `requests` 和 `limits`**

```yaml
resources:
  requests:
    cpu: "1" # should be 1*num_workers
    memory: "4Gi" # should be 4*num_workers
  limits:
    cpu: "1"
    memory: "4Gi"
```

**2. HPA 閾值**

```yaml
targetCPUUtilizationPercentage: 60
targetMemoryUtilizationPercentage: 80
```


## 3. 選擇您的伺服器：Uvicorn vs. Gunicorn {#3-choose-your-server-uvicorn-vs-gunicorn}

LiteLLM Proxy 預設在 [Uvicorn](https://uvicorn.dev/) 上執行。改為傳入 `--run_gunicorn` 時，會啟動 [Gunicorn](https://gunicorn.org/) 作為程序管理器，監督 [Uvicorn worker 程序](https://uvicorn.dev/deployment/#gunicorn)（`uvicorn.workers.UvicornWorker`）。在這兩種情況下，您的應用程式程式碼仍然在 Uvicorn 上執行；差別在於由哪個程序來管理並回收 worker。

| | Uvicorn（預設） | Gunicorn (`--run_gunicorn`) |
|---|---|---|
| **何時使用** | 幾乎所有部署都建議使用，尤其是 Kubernetes 中每個 Pod 一個 worker 的情境。 | 當您在**單一容器中執行多個 worker**，並希望有成熟的程序管理器來監督與回收它們時選用。 |
| **worker 回收** | Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)。 | Gunicorn 的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)，這是 Gunicorn 多年來提供、經過實戰驗證的機制。 |
| **程序監督** | Uvicorn 內建的多程序管理器。 | Gunicorn 的 [arbiter](https://gunicorn.org/design/#arbiter)，會在 worker 退出時一次重啟一個。 |

:::tip 建議

在 Kubernetes 上，請採用**每個 Pod 一個 Uvicorn worker**，並**水平**擴充（增加 Pod 數量），而不是**垂直**擴充（增加每個 Pod 的 worker 數量）。每個 Pod 一個程序可在負載下維持可預測的延遲，讓 Horizontal Pod Autoscaler 能準確使用[上方的閾值](#2-recommended-machine-specifications)，並且因為 Kubernetes 一次只會排空一個 Pod，讓滾動重部署做到不中斷。只有在您必須把多個 worker 塞進單一容器時，才使用 Gunicorn。

:::

### 3a. 建議：每個 Pod 一個 Uvicorn worker {#3a-recommended-one-uvicorn-worker-per-pod}

這是預設伺服器，因此您只需要設定 `--num_workers 1`（預設值已經是 `1`）：

```shell
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "1"]
```

### 3b. 使用 `--max_requests_before_restart` 回收 worker {#3b-recycle-workers-with---max_requests_before_restart}

如果您在持續負載下觀察到記憶體逐漸增加，請在固定請求數之後回收每個 worker，以限制記憶體用量。`--max_requests_before_restart` 對應到 Uvicorn 的 [`limit_max_requests`](https://uvicorn.dev/settings/#resource-limits)（預設伺服器），以及 Gunicorn 在 `--run_gunicorn` 下的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests)。可透過 CLI 旗標或環境變數設定：

```shell
# CLI
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "1", "--max_requests_before_restart", "10000"]

# or ENV (for deployment manifests / containers)
export MAX_REQUESTS_BEFORE_RESTART=10000
```

:::tip

當您在**單一容器中執行多個 worker**並依賴 `--max_requests_before_restart` 時，請優先選用 `--run_gunicorn`。Gunicorn 的 [`max_requests`](https://gunicorn.org/reference/settings/#max_requests) 回收機制比 Uvicorn 更成熟，而且它的 [arbiter](https://gunicorn.org/design/#arbiter) 會一次重啟一個 worker，因此在替換 worker 時，Pod 仍可持續提供流量。

:::

```shell
# Multiple workers in one container, with Gunicorn-managed recycling
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000"]
```

當多個 worker 同時啟動並承接相近的流量時，它們幾乎會在同一時間達到請求門檻並同步回收，一次掉失一大塊容量。加入 `--max_requests_before_restart_jitter`，以隨機方式在 `[0, jitter]` 內為每個 worker 的門檻加入偏移，讓重啟錯開而不是同步。這會對應到 Uvicorn 的 [`limit_max_requests_jitter`](https://uvicorn.dev/settings/#resource-limits)（需要 `uvicorn>=0.41.0`）以及 Gunicorn 的 [`max_requests_jitter`](https://gunicorn.org/reference/settings/#max_requests_jitter)，且在沒有 `--max_requests_before_restart` 時不會產生效果。

```shell
# Stagger recycling so workers don't all restart at once
CMD ["--port", "4000", "--config", "./proxy_server_config.yaml", "--num_workers", "4", "--run_gunicorn", "--max_requests_before_restart", "10000", "--max_requests_before_restart_jitter", "1000"]
```

### 3c. 讓重啟做到不中斷 {#3c-keep-restarts-hitless}

當進行中的請求會在程序結束前完成，讓沒有任何用戶端看到連線中斷時，重啟就是「不中斷」的。生產環境中有兩種情況很重要：

**worker 回收（來自 `--max_requests_before_restart`）。** 兩種伺服器都會在被回收的 worker 上停止接受新連線，並讓尚未完成的請求在它退出前排空，接著啟動替代 worker。Gunicorn 另外還可保證在其 [`graceful_timeout`](https://gunicorn.org/reference/settings/#graceful_timeout)（預設為 30s）內的進行中請求會在 [`SIGTERM`](https://gunicorn.org/signals/) 上完成。當每個 Pod 一個 worker 時，回收會暫時降低該 Pod 的容量，因此我們建議採用水平擴充，讓負載平衡器可以繞開它。

**滾動部署與 Pod 重啟（Kubernetes）。** 請在協調層讓重啟做到不中斷，而不是只依賴伺服器本身：

- 使用 [`RollingUpdate`](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment) 策略（Deployment 預設值），讓新 Pod 在舊 Pod 終止前先變成 Ready。
- 在 `/health/readiness` 上保留 [readiness probe](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)，讓 Kubernetes 只會把流量送到能夠服務的 Pod，並在終止開始時立即停止路由到該 Pod。
- 將 [`terminationGracePeriodSeconds`](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) 設定為明顯大於您預期最長的請求時間（LiteLLM 的請求逾時預設為 600s；請參閱[第 1 節](#1-use-this-configyaml)）。在終止時，Kubernetes 會送出 `SIGTERM`，而 Uvicorn 和 Gunicorn 都會在退出前透過排空進行中的請求來[優雅地](https://uvicorn.dev/deployment/)關閉。
- 也可以加上一個小型的 [`preStop` hook](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks)（例如 `sleep 5`），讓負載平衡器有時間在伺服器開始關閉之前將 Pod 從註冊中移除，消除流量仍可能送達正在終止 Pod 的短暫空窗。

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


## 4. 使用 Redis 的 'port'、'host'、'password'。不要使用 'redis_url' {#4-use-redis-porthost-password-not-redis_url}

如果您決定使用 Redis，請不要使用 'redis_url'。我們建議使用 Redis 的 port、host 與 password 參數。 

`redis_url`會慢 80 RPS

這仍然是我們正在調查的事項。請在[這裡](https://github.com/BerriAI/litellm/issues/3188)追蹤進度

### Redis 版本需求 {#redis-version-requirement}

| 元件 | 最低版本 |
|-----------|-----------------|
| Redis     | 7.0+            |

生產環境建議這樣做：

```yaml
router_settings:
  routing_strategy: simple-shuffle # (default) - recommended for best performance
  # redis_url: "os.environ/REDIS_URL"
  redis_host: os.environ/REDIS_HOST
  redis_port: os.environ/REDIS_PORT
  redis_password: os.environ/REDIS_PASSWORD

litellm_settings:
  cache: True
  cache_params:
    type: redis
    host: os.environ/REDIS_HOST
    port: os.environ/REDIS_PORT
    password: os.environ/REDIS_PASSWORD
```

> **警告**
**不建議在生產環境使用基於使用量的路由，因為會影響效能。** 在高流量情境下，請使用 `simple-shuffle`（預設）以獲得最佳效能。

## 5. 停用 'load_dotenv' {#5-disable-load_dotenv}

設定 `export LITELLM_MODE="PRODUCTION"`

這會停用 load_dotenv() 功能，而該功能會自動從本機的 `.env` 載入您的環境憑證。 

## 6. 如果在 VPC 上執行 LiteLLM，請優雅處理資料庫不可用的情況 {#6-if-running-litellm-on-vpc-gracefully-handle-db-unavailability}

當 LiteLLM 執行於 VPC 上（且無法從公開網際網路存取）時，您可以啟用優雅降級，讓即使資料庫暫時不可用，請求處理仍可繼續。

**警告：只有在您於 VPC 上執行 LiteLLM，且無法從公開網際網路存取時才這麼做。**

#### 設定 {#configuration}

```yaml showLineNumbers title="litellm config.yaml"
general_settings:
  allow_requests_on_db_unavailable: True
```

#### 預期行為 {#expected-behavior}

當 `allow_requests_on_db_unavailable` 設定為 `true` 時，LiteLLM 會依下列方式處理錯誤：

| 錯誤類型 | 預期行為 | 詳細資訊 |
|---------------|-------------------|----------------|
| Prisma 錯誤 | ✅ 請求將被允許 | 涵蓋像是 DB 連線重設，或透過 Prisma（LiteLLM 使用的 ORM）從 DB 產生的拒絕。 |
| Httpx 錯誤 | ✅ 請求將被允許 | 當資料庫無法連線時發生，即使 DB 異常，請求仍可繼續。 |
| Pod 啟動行為 | ✅ Pod 仍會啟動 | 即使資料庫關閉或無法連線，LiteLLM Pods 仍會啟動，確保部署有更高的正常運作時間保證。 |
| 健康狀態/就緒檢查 | ✅ 一律回傳 200 OK | /health/readiness 端點會回傳 200 OK 狀態，確保即使資料庫無法使用，pods 仍保持可運作。 |
| LiteLLM 預算錯誤或模型錯誤 | ❌ 請求將被封鎖 | 當 DB 可連線，但驗證 token 無效、沒有存取權限，或超出預算限制時觸發。 |

[更多關於資料庫用途的資訊請見此處](db_info)

## 7. 使用 Helm PreSync Hook 進行資料庫遷移 [BETA] {#7-use-helm-presync-hook-for-database-migrations-beta}

為了確保只有一個服務管理資料庫遷移，請使用我們的 [Helm PreSync Hook for Database Migrations](https://github.com/BerriAI/litellm/blob/main/deploy/charts/litellm-helm/templates/migrations-job.yaml)。這可確保遷移在 `helm upgrade` 或 `helm install` 期間處理，而 LiteLLM pods 則明確停用遷移。

1. **Helm PreSync Hook**：
   - Helm PreSync hook 在 chart 中設定為於部署期間執行資料庫遷移。
   - 這個 hook 會始終設定 `DISABLE_SCHEMA_UPDATE=false`，確保遷移可靠執行。
  
  要在 ArgoCD 上為 `values.yaml` 設定的參考設定

  ```yaml
  db:
    useExisting: true # use existing Postgres DB
    url: postgresql://ishaanjaffer0324:... # url of existing Postgres DB
  ```

2. **LiteLLM Pods**：
   - 在 LiteLLM pod 設定中設定 `DISABLE_SCHEMA_UPDATE=true`，以防止它們執行遷移。
   
   LiteLLM pod 的範例設定：
   ```yaml
   env:
     - name: DISABLE_SCHEMA_UPDATE
       value: "true"
   ```


## 8. 設定 LiteLLM Salt Key  {#8-set-litellm-salt-key}

如果您計劃使用 DB，請設定 salt key 來加密/解密 DB 中的變數。 

在新增模型後，請不要變更此設定。它用於加密 / 解密您的 LLM API 金鑰憑證

我們建議使用 - https://1password.com/password-generator/ 密碼產生器來取得 litellm salt key 的隨機雜湊值。

```bash
export LITELLM_SALT_KEY="sk-1234"
```

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/036a6821d588bd36d170713dcf5a72791a694178/litellm/proxy/common_utils/encrypt_decrypt_utils.py#L15)

## 9. 使用 `prisma migrate deploy` {#9-use-prisma-migrate-deploy}

請使用此功能來處理 production 中跨 LiteLLM 版本的 db 遷移

<Tabs>
<TabItem value="env" label="ENV">

```bash
USE_PRISMA_MIGRATE="True"
```

</TabItem>

<TabItem value="cli" label="CLI">

```bash
litellm
```

</TabItem>
</Tabs>

優點：

migrate deploy 指令：

- **不會** 在已套用的 migration 自 migration history 中缺失時發出警告
- **不會** 偵測 drift（production 資料庫結構描述與 migration history 結尾狀態不同，例如因 hotfix 造成）
- **不會** 重設資料庫或產生構件（例如 Prisma Client）
- **不會** 依賴 shadow database

### LiteLLM 在 production 中如何處理 DB migrations？ {#how-does-litellm-handle-db-migrations-in-production}

1. 會將新的 migration 檔案寫入我們的 `litellm-proxy-extras` 套件。 [查看全部](https://github.com/BerriAI/litellm/tree/main/litellm-proxy-extras/litellm_proxy_extras/migrations)

2. 核心 litellm pip 套件會更新，以指向新的 `litellm-proxy-extras` 套件。這可確保舊版 LiteLLM 會繼續使用舊的 migrations。 [查看程式碼](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/pyproject.toml#L58)

3. 當您升級到新版 LiteLLM 時，migration 檔案會套用到資料庫。 [查看程式碼](https://github.com/BerriAI/litellm/blob/52b35cd8093b9ad833987b24f494586a1e923209/litellm-proxy-extras/litellm_proxy_extras/utils.py#L42)

### 唯讀檔案系統 {#read-only-file-system}

在 Kubernetes 中以 `readOnlyRootFilesystem: true` 執行 LiteLLM 是安全最佳實務，可防止容器程序寫入 root 檔案系統。LiteLLM 完全支援此設定。

#### 權限錯誤快速修正 {#quick-fix-for-permission-errors}

如果您看到 `Permission denied` 錯誤，表示 LiteLLM pod 是以唯讀檔案系統執行。LiteLLM 需要可寫入的目錄，用於：
- **資料庫遷移**：設定 `LITELLM_MIGRATION_DIR="/path/to/writable/directory"`
- **管理 UI**：設定 `LITELLM_UI_PATH="/path/to/writable/directory"`
- **UI 資產/標誌**：設定 `LITELLM_ASSETS_PATH="/path/to/writable/directory"`

#### 完整的唯讀檔案系統設定（Kubernetes） {#complete-read-only-filesystem-setup-kubernetes}

對於具有增強安全性的 production deployments，請使用此設定：

**選項 1：使用 EmptyDir Volumes 搭配 InitContainer（建議）**

此方法會在 pod 啟動時，將 Docker 映像中的預先建置 UI 複製到可寫入的 emptyDir volumes。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-proxy
spec:
  template:
    spec:
      initContainers:
        - name: setup-ui
          image: ghcr.io/berriai/litellm:latest
          command:
            - sh
            - -c
            - |
              cp -r /var/lib/litellm/ui/* /app/var/litellm/ui/ && \
              cp -r /var/lib/litellm/assets/* /app/var/litellm/assets/
          volumeMounts:
            - name: ui-volume
              mountPath: /app/var/litellm/ui
            - name: assets-volume
              mountPath: /app/var/litellm/assets

      containers:
        - name: litellm
          image: ghcr.io/berriai/litellm:latest
          env:
            - name: LITELLM_NON_ROOT
              value: "true"
            - name: LITELLM_UI_PATH
              value: "/app/var/litellm/ui"
            - name: LITELLM_ASSETS_PATH
              value: "/app/var/litellm/assets"
            - name: LITELLM_MIGRATION_DIR
              value: "/app/migrations"
            - name: PRISMA_BINARY_CACHE_DIR
              value: "/app/cache/prisma-python/binaries"
            - name: XDG_CACHE_HOME
              value: "/app/cache"
          securityContext:
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 101
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: config
              mountPath: /app/config.yaml
              subPath: config.yaml
              readOnly: true
            - name: ui-volume
              mountPath: /app/var/litellm/ui
            - name: assets-volume
              mountPath: /app/var/litellm/assets
            - name: cache
              mountPath: /app/cache
            - name: migrations
              mountPath: /app/migrations

      volumes:
        - name: config
          configMap:
            name: litellm-config
        - name: ui-volume
          emptyDir:
            sizeLimit: 100Mi
        - name: assets-volume
          emptyDir:
            sizeLimit: 10Mi
        - name: cache
          emptyDir:
            sizeLimit: 500Mi
        - name: migrations
          emptyDir:
            sizeLimit: 64Mi
```

**選項 2：不使用 UI（僅 API 的部署）**

如果您不需要管理 UI，可以使用最小化設定執行：

```yaml
env:
  - name: LITELLM_NON_ROOT
    value: "true"
  - name: LITELLM_MIGRATION_DIR
    value: "/app/migrations"
securityContext:
  readOnlyRootFilesystem: true
```

proxy 會針對 UI 記錄警告，但 API 端點會正常運作。

#### 唯讀檔案系統的環境變數 {#environment-variables-for-read-only-filesystems}

| 變數 | 用途 | 預設值 |
|----------|---------|---------|
| `LITELLM_UI_PATH` | 管理 UI 目錄 | `/var/lib/litellm/ui` (Docker) |
| `LITELLM_ASSETS_PATH` | UI 資產/標誌 | `/var/lib/litellm/assets` (Docker) |
| `LITELLM_MIGRATION_DIR` | 資料庫遷移 | 套件目錄 |
| `PRISMA_BINARY_CACHE_DIR` | Prisma 二進位快取 | 系統預設值 |
| `XDG_CACHE_HOME` | 一般快取目錄 | 系統預設值 |

#### 重要注意事項 {#important-notes}

1. **Migrations**：一律將 `LITELLM_MIGRATION_DIR` 設定為可寫入的 emptyDir 路徑
2. **Prisma Cache**：將 `PRISMA_BINARY_CACHE_DIR` 和 `XDG_CACHE_HOME` 設定為可寫入路徑
3. **Server Root Path**：如果使用自訂的 `server_root_path`，您必須在 Dockerfile 中預先處理 UI 檔案，因為 proxy 無法在執行時以唯讀檔案系統修改檔案
4. **自動偵測**：如果 UI 包含 `.litellm_ui_ready` 標記檔案（由官方 Docker 映像建立），系統會自動將其偵測為 pre-restructured

## 額外內容 {#extras}
### Production 中的預期效能 {#expected-performance-in-production}

請在[這裡](../benchmarks#performance-metrics)查看基準測試

### 驗證 Debugging logs 已關閉 {#verifying-debugging-logs-are-off}

您應該只會在 proxy server 的記錄中看到以下詳細程度
```shell
# INFO:     192.168.2.205:11774 - "POST /chat/completions HTTP/1.1" 200 OK
# INFO:     192.168.2.205:34717 - "POST /chat/completions HTTP/1.1" 200 OK
# INFO:     192.168.2.205:29734 - "POST /chat/completions HTTP/1.1" 200 OK
```
