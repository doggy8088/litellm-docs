import Image from '@theme/IdealImage';

# 基準測試 {#benchmarks}

LiteLLM Gateway（Proxy Server）針對假的 OpenAI endpoint 進行的基準測試。

LiteLLM Gateway 在 1k RPS 下具有 **8ms P95 延遲**（請參閱 [此處](#4-instances) 的基準測試）

## 用於測試的機器規格 {#machine-spec-used-for-testing}

每台部署 LiteLLM 的機器具有以下規格：

- 4 CPU
- 8GB RAM

## 設定 {#configuration}

- Database：PostgreSQL
- Redis：未使用

### 2 個 LiteLLM Proxy 執行個體 {#2-instance-litellm-proxy}

在這些測試中，基準延遲特性是針對 fake-openai-endpoint 量測。

#### 效能指標 {#performance-metrics}

| **類型** | **名稱** | **中位數 (ms)** | **95%ile (ms)** | **99%ile (ms)** | **平均值 (ms)** | **目前 RPS** |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /chat/completions | 200 | 630 | 1200 | 262.46 | 1035.7 |
| Custom | LiteLLM Overhead Duration (ms) | 12 | 29 | 43 | 14.74 | 1035.7 |
|  | 彙總 | 100 | 430 | 930 | 138.6 | 2071.4 |

<!-- <Image img={require('../img/1_instance_proxy.png')} /> -->

<!-- ## **Horizontal Scaling - 10K RPS**

<Image img={require('../img/instances_vs_rps.png')} /> -->

### 4 個執行個體 {#4-instances}

| **類型** | **名稱** | **中位數 (ms)** | **95%ile (ms)** | **99%ile (ms)** | **平均值 (ms)** | **目前 RPS** |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /chat/completions | 100 | 150 | 240 | 111.73 | 1170 |
| Custom | LiteLLM Overhead Duration (ms) | 2 | 8 | 13 | 3.32 | 1170 |
|  | 彙總 | 77 | 130 | 180 | 57.53 | 2340 |

#### 主要發現 {#key-findings}
- 從 2 個 LiteLLM 執行個體加倍到 4 個時，中位延遲減半：200 ms → 100 ms。
- 高百分位延遲顯著下降：P95 630 ms → 150 ms，P99 1,200 ms → 240 ms。
- 將 workers 設為與 CPU 數量相同可獲得最佳效能。

## 使用網路模擬設定基準測試 {#setting-up-benchmarking-with-network-mock}

測量 proxy 開銷最快的方法是使用 `network_mock` 模式。這會在 httpx transport 層攔截對外請求並回傳預先準備好的回應，不需要設定模擬提供者。 

**1. 建立 proxy 設定：**

```yaml
model_list:
  - model_name: db-openai-endpoint
    litellm_params:
      model: openai/gpt-4o
      api_key: "sk-fake-key"
      api_base: "https://api.openai.com"

litellm_settings:
  network_mock: true
  callbacks: []
  num_retries: 0
  request_timeout: 30

general_settings:
  master_key: "sk-1234"
```

**2. 啟動 proxy：**

```bash
litellm --config benchmark_config.yaml --port 4000 --num_workers 8
```

**3. 執行基準測試腳本：**

```bash
python scripts/benchmark_mock.py --requests 2000 --max-concurrent 200 --runs 3
```

在 [此處](https://github.com/BerriAI/litellm/blob/main/scripts/benchmark_mock.py) 取得基準測試腳本

這可量測熱路徑上的純 proxy 開銷，不含任何到真實或假的提供者之網路延遲。

## 設定假的 OpenAI Endpoint {#setting-up-a-fake-openai-endpoint}

若要進行負載測試與基準測試，您可以使用假的 OpenAI proxy server。LiteLLM 提供：

1. **代管 endpoint**：使用我們免費代管的假 endpoint：`https://exampleopenaiendpoint-production.up.railway.app/`
2. **自架**：使用 [github.com/BerriAI/example_openai_endpoint](https://github.com/BerriAI/example_openai_endpoint) 設定您自己的假 OpenAI proxy server

使用此設定進行測試：

```yaml
model_list:
  - model_name: "fake-openai-endpoint"
    litellm_params:
      model: openai/any
      api_base: https://exampleopenaiendpoint-production.up.railway.app/  # or your self-hosted endpoint
      api_key: "test"
```

## `/realtime` API 基準測試 {#realtime-api-benchmarks}

針對 `/realtime` endpoint 的端到端延遲基準測試，測試對象為假的即時 endpoint。

### 效能指標 {#performance-metrics-1}

| 指標          | 數值      |
| --------------- | ---------- |
| 中位延遲  | 59 ms      |
| p95 延遲     | 67 ms      |
| p99 延遲     | 99 ms      |
| 平均延遲 | 63 ms      |
| RPS             | 1,207      |

### 測試設定 {#test-setup}

| 類別 | 規格 |
|----------|---------------|
| **負載測試** | Locust：1,000 個同時使用者，500 個漸增 |
| **系統** | 4 vCPU、8 GB RAM、4 個 workers、4 個執行個體 |
| **Database** | PostgreSQL（未使用 Redis） |

## 基礎架構建議 {#infrastructure-recommendations}

根據基準測試結果與 API gateway 部署的業界標準所建議的規格。

### PostgreSQL {#postgresql}

認證、金鑰管理與使用量追蹤所需。

| 工作負載 | CPU | RAM | 儲存空間 | 連線數 |
|----------|-----|-----|---------|-------------|
| 1-2K RPS | 4-8 cores | 16GB | 200GB SSD（3000+ IOPS） | 100-200 |
| 2-5K RPS | 8 cores | 16-32GB | 500GB SSD（5000+ IOPS） | 200-500 |
| 5K+ RPS | 16+ cores | 32-64GB | 1TB+ SSD（10000+ IOPS） | 500+ |

**設定：** 將 `proxy_batch_write_at: 60` 設為批次寫入並降低 DB 負載。總連線數 = pool 上限 × 執行個體數。

### Redis（建議） {#redis-recommended}

本基準測試未使用 Redis，但在正式環境中可帶來顯著效益：將 DB 負載降低 60-80%。

| 工作負載 | CPU | RAM |
|----------|-----|-----|
| 1-2K RPS | 2-4 cores | 8GB |
| 2-5K RPS | 4 cores | 16GB |
| 5K+ RPS | 8+ cores | 32GB+ |

**需求：** Redis 7.0+、已啟用 AOF persistence、`allkeys-lru` eviction policy。

**設定：**
```yaml
router_settings:
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

:::tip
請使用 `redis_host`、`redis_port` 與 `redis_password`，不要使用 `redis_url`，可獲得約 80 RPS 更佳效能。
:::

**擴充：** DB 連線數會隨執行個體數線性成長。超過 5K RPS 時可考慮 PostgreSQL read replica。

請參閱 [正式環境設定](./proxy/prod) 以了解詳細最佳做法。

## Locust 設定 {#locust-settings}

- 1000 Users
- 500 user Ramp Up

## 如何測量 LiteLLM Overhead {#how-to-measure-litellm-overhead}

來自 litellm 的所有回應都會包含 `x-litellm-overhead-duration-ms` 標頭，這是 LiteLLM Proxy 額外加入的延遲開銷，單位為毫秒。

如果您想在 locust 上測量這項數值，可以使用以下程式碼：

```python showLineNumbers title="Locust Code for measuring LiteLLM Overhead"
import os
import uuid
from locust import HttpUser, task, between, events

# Custom metric to track LiteLLM overhead duration
overhead_durations = []

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, context, exception, start_time, url, **kwargs):
    if response and hasattr(response, 'headers'):
        overhead_duration = response.headers.get('x-litellm-overhead-duration-ms')
        if overhead_duration:
            try:
                duration_ms = float(overhead_duration)
                overhead_durations.append(duration_ms)
                # Report as custom metric
                events.request.fire(
                    request_type="Custom",
                    name="LiteLLM Overhead Duration (ms)",
                    response_time=duration_ms,
                    response_length=0,
                )
            except (ValueError, TypeError):
                pass

class MyUser(HttpUser):
    wait_time = between(0.5, 1)  # Random wait time between requests

    def on_start(self):
        self.api_key = os.getenv('API_KEY', 'sk-1234567890')
        self.client.headers.update({'Authorization': f'Bearer {self.api_key}'})

    @task
    def litellm_completion(self):
        # no cache hits with this
        payload = {
            "model": "db-openai-endpoint",
            "messages": [{"role": "user", "content": f"{uuid.uuid4()} This is a test there will be no cache hits and we'll fill up the context" * 150}],
            "user": "my-new-end-user-1"
        }
        response = self.client.post("chat/completions", json=payload)
        
        if response.status_code != 200:
            # log the errors in error.txt
            with open("error.txt", "a") as error_log:
                error_log.write(response.text + "\n")
```


## LiteLLM 與 Portkey 效能比較 {#litellm-vs-portkey-performance-comparison}

**測試設定**：每個執行個體 4 CPU、8 GB RAM｜負載：1k 同時使用者、500 個漸增
**版本：** Portkey **v1.14.0**｜LiteLLM **v1.79.1-stable**  
**測試時間：** 5 分鐘  

### 多執行個體（4×）效能 {#multi-instance-4-performance}

| 指標              | Portkey（無 DB） | LiteLLM（有 DB） | 備註        |
| ------------------- | --------------- | ----------------- | -------------- |
| **總請求數**  | 293,796         | 312,405           | LiteLLM 較高 |
| **失敗請求數** | 0               | 0                 | 相同           |
| **中位延遲**  | 100 ms          | 100 ms            | 相同           |
| **p95 延遲**     | 230 ms          | 150 ms            | LiteLLM 較低  |
| **p99 延遲**     | 500 ms          | 240 ms            | LiteLLM 較低  |
| **平均延遲** | 123 ms          | 111 ms            | LiteLLM 較低  |
| **目前 RPS**     | 1,170.9         | 1,170             | 相同           |

*延遲指標越低越好；請求數與 RPS 越高越好。*

### 技術洞見 {#technical-insights}

**Portkey**

**優點**

* 記憶體占用低
* 延遲穩定，尖峰最小

**缺點**

* CPU 使用率約封頂在 ~40%，顯示未充分利用可用運算資源
* 曾發生三次 I/O timeout 當機

**LiteLLM**

**優點**

* 充分利用可用 CPU 容量
* 在初始暖機尖峰後，連線處理能力強且延遲低

**缺點**

* 初始化期間與每次請求的記憶體使用量高

## 記錄回呼 {#logging-callbacks}

### [GCS Bucket 記錄](https://docs.litellm.ai/docs/observability/gcs_bucket_integration) {#gcs-bucket-logginghttpsdocslitellmaidocsobservabilitygcs_bucket_integration}

使用 GCS Bucket 對延遲、RPS 相較於基本 Litellm Proxy **沒有影響**

| 指標 | 基本 Litellm Proxy | 啟用 GCS Bucket 記錄的 LiteLLM Proxy |
|--------|------------------------|---------------------|
| RPS | 1133.2 | 1137.3 |
| 中位延遲 (ms) | 140 | 138 |

### [LangSmith 記錄](https://docs.litellm.ai/docs/proxy/logging) {#langsmith-logginghttpsdocslitellmaidocsproxylogging}

使用 LangSmith 對延遲、RPS 相較於基本 Litellm Proxy **沒有影響**

| 指標 | 基本 Litellm Proxy | 啟用 LangSmith 的 LiteLLM Proxy |
|--------|------------------------|---------------------|
| RPS | 1133.2 | 1135 |
| 中位延遲 (ms) | 140 | 132 |
