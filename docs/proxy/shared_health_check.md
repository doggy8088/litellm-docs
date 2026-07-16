# 跨 Pod 共用 Health Check 狀態 {#shared-health-check-state-across-pods}

此功能可讓多個 LiteLLM proxy pod 之間協調 health check，以避免重複 health check 並降低成本。

## 概覽 {#overview}

當執行多個 LiteLLM proxy pod（例如在 Kubernetes 中）時，每個 pod 通常會對每個模型執行各自獨立的 health check。這可能會導致：

- **跨 pod 重複 health check**
- **高成本模型（例如 Gemini 2.5-pro）的成本增加**
- **多餘的監控/記錄雜訊**
- **資源使用效率低落**

共用 health check 狀態功能可透過以下方式解決此問題：

- **使用 Redis 協調 health check**
- **以可設定的 TTL 快取結果**
- **使用分散式鎖定**，確保同一時間只有一個 pod 執行 health check
- **允許其他 pod** 讀取快取結果，而不是執行多餘的檢查

## 運作方式 {#how-it-works}

### 1. 取得鎖定 {#1-lock-acquisition}
當 pod 需要執行 health check 時：
- 它會嘗試取得 Redis 鎖定
- 若成功，便執行 health check
- 若失敗，則短暫等待並檢查快取結果

### 2. 結果快取 {#2-result-caching}
執行 health check 後：
- 結果會以可設定的 TTL 快取於 Redis 中
- 其他 pod 可以讀取這些快取結果
- 快取包含時間戳記與 pod ID 以供追蹤

### 3. 備援行為 {#3-fallback-behavior}
如果 Redis 無法使用或快取已過期：
- pod 會改為在本機執行 health check
- 系統會持續正常運作

## 設定 {#configuration}

### 啟用共用 Health Check {#enable-shared-health-check}

加入至您的 `proxy_config.yaml`：

```yaml
general_settings:
  # Enable background health checks (required)
  background_health_checks: true
  
  # Enable shared health check state across pods
  use_shared_health_check: true
  
  # Health check interval (seconds)
  health_check_interval: 300  # 5 minutes

# Redis configuration (required for shared health check)
litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: your-redis-host
    port: 6379
    password: your-redis-password
```

### 環境變數 {#environment-variables}

您也可以使用環境變數進行設定：

```bash
# Enable shared health check
export USE_SHARED_HEALTH_CHECK=true

# Health check TTL (seconds)
export DEFAULT_SHARED_HEALTH_CHECK_TTL=300

# Lock TTL (seconds)
export DEFAULT_SHARED_HEALTH_CHECK_LOCK_TTL=60
```

## 需求 {#requirements}

- **Redis**：共用狀態協調所需
- **背景 Health Checks**：必須啟用（`background_health_checks: true`）
- **多個 Pods**：在 2 個以上 proxy 執行個體時最有幫助

## API 端點 {#api-endpoints}

### 檢查共用 Health Check 狀態 {#check-shared-health-check-status}

```bash
GET /health/shared-status
```

回傳關於共用 health check 協調的資訊：

```json
{
  "shared_health_check_enabled": true,
  "status": {
    "pod_id": "pod_1703123456789",
    "redis_available": true,
    "lock_ttl": 60,
    "cache_ttl": 300,
    "lock_owner": "pod_1703123456788",
    "lock_in_progress": true,
    "cache_available": true,
    "cache_age_seconds": 45.2,
    "last_checked_by": "pod_1703123456788"
  }
}
```

## 監控 {#monitoring}

### Health Check 狀態 {#health-check-status}

監控共用 health check 狀態以確保正確協調：

```bash
curl -H "Authorization: Bearer your-api-key" \
  http://your-proxy-host/health/shared-status
```

### 記錄 {#logs}

請留意以下記錄訊息：

```
INFO: Initialized shared health check manager
INFO: Pod pod_123 acquired health check lock
INFO: Pod pod_123 released health check lock
INFO: Cached health check results for 5 healthy and 0 unhealthy endpoints
DEBUG: Using cached health check results
```

## 疑難排解 {#troubleshooting}

### 常見問題 {#common-issues}

#### 1. 共用 Health Check 未正常運作 {#1-shared-health-check-not-working}

**症狀**：每個 pod 仍然各自執行獨立的 health check

**解決方案**：
- 驗證 Redis 已設定且可存取
- 檢查 `use_shared_health_check: true` 是否已設定
- 確認 `background_health_checks: true` 已啟用
- 檢查記錄中的 Redis 連線狀態

#### 2. Redis 連線問題 {#2-redis-connection-issues}

**症狀**：health check 會回退為本機執行

**解決方案**：
- 驗證 Redis 主機、埠與認證資訊
- 檢查 pod 與 Redis 之間的網路連線
- 監控 Redis 伺服器記錄中的錯誤

#### 3. 鎖定未釋放 {#3-lock-not-released}

**症狀**：某個 pod 無限期持有鎖定

**解決方案**：
- 鎖定具有自動 TTL（預設 60 秒）
- 檢查 pod 記錄中的鎖定釋放訊息
- 驗證 Redis TTL 設定

### 除錯模式 {#debug-mode}

啟用除錯記錄以查看詳細協調資訊：

```yaml
general_settings:
  set_verbose: true
```

## 效能影響 {#performance-impact}

### 優點 {#benefits}

- **減少 API 請求**：每個時間間隔只有一個 pod 執行 health check
- **降低成本**：對高成本模型尤其明顯
- **更佳的資源利用**：跨 pod 的重複工作更少
- **更乾淨的監控**：記錄與指標中的雜訊降低

### 額外負擔 {#overhead}

- **Redis 操作**：鎖定/快取操作的額外負擔極小
- **網路延遲**：Redis 通訊造成的些微延遲
- **記憶體用量**：額外記憶體用量可忽略不計

## 最佳做法 {#best-practices}

### 1. Redis 設定 {#1-redis-configuration}

- 使用啟用持久化的 Redis
- 設定適當的記憶體限制
- 建立 Redis 監控與警示

### 2. TTL 設定 {#2-ttl-settings}

- 將 `health_check_interval` 設為您想要的檢查頻率
- 除非有特定需求，否則使用預設 TTL 值
- 為高成本模型考慮模型專屬逾時

### 3. 監控 {#3-monitoring}

- 監控共用 health check 狀態端點
- 為 Redis 連線問題設定警示
- 追蹤 health check 成本與頻率

### 4. 擴充 {#4-scaling}

- 此功能可搭配任意數量的 pod 使用
- pod 越多 = 協調效益越好
- 高可用性情境可考慮 Redis 叢集

## 範例設定 {#example-configuration}

### 完整範例 {#complete-example}

```yaml
# proxy_config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY
    model_info:
      health_check_timeout: 30  # 30 second timeout for health checks

general_settings:
  # Enable background health checks
  background_health_checks: true
  
  # Enable shared health check coordination
  use_shared_health_check: true
  
  # Health check interval (5 minutes)
  health_check_interval: 300
  
  # Health check details
  health_check_details: true

litellm_settings:
  # Redis configuration
  cache: true
  cache_params:
    type: redis
    host: redis-cluster.example.com
    port: 6379
    password: os.environ/REDIS_PASSWORD
    ssl: true
```

### Kubernetes 範例 {#kubernetes-example}

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-proxy
spec:
  replicas: 3  # Multiple pods for coordination
  template:
    spec:
      containers:
      - name: litellm-proxy
        image: docker.litellm.ai/berriai/litellm:latest
        env:
        - name: USE_SHARED_HEALTH_CHECK
          value: "true"
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
```

## 遷移 {#migration}

### 從獨立 Health Checks 遷移 {#from-independent-health-checks}

1. **啟用 Redis**：確保 Redis 已設定且可存取
2. **啟用背景 Health Checks**：設定 `background_health_checks: true`
3. **啟用共用 Health Check**：設定 `use_shared_health_check: true`
4. **部署**：更新您的 proxy 設定
5. **監控**：檢查 `/health/shared-status` 端點

### 回復 {#rollback}

若要停用共用 health check：

```yaml
general_settings:
  use_shared_health_check: false
  # background_health_checks can remain true for independent checks
```

## 相關功能 {#related-features}

- [背景 Health Checks](./health.md#background-health-checks)
- [Redis 快取](./caching.md)
- [高可用性設定](./db_deadlocks.md)
- [Health Check 端點](./health.md#health-endpoints)
