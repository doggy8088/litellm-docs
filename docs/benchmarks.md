import Image from '@theme/IdealImage';

# 基準測試 {#benchmarks}

LiteLLM Gateway（Proxy Server）針對假的 OpenAI endpoint 進行的基準測試。

LiteLLM Gateway 在 1k RPS 下具有 **8ms P95 延遲**（請參閱 [此處](#4-instances) 的基準測試）

## 高吞吐量設定檔：50K 到 100K token 提示詞下達到 3,000 RPS {#high-throughput-profile-3000-rps-with-50k-to-100k-token-prompts}

大型提示詞會帶來與短篇聊天請求不同的閘道工作負載。Token 計數、預算檢查、支出追蹤與指標收集，都會在模型提供者呼叫之前或之後發生，並且在高請求量下可能成為瓶頸。

此基準測試比較了[高吞吐量部署設定檔](./proxy/high_throughput.md)與 `v1.101.0`。此設定檔結合了 Rust token 計數、共用資料庫連線、隔離的指標與支出處理，以及依流量自動擴縮。

:::info[夜間基準測試]
高吞吐量設定檔仍在開發中，並可於 nightly builds 中使用。這些結果使用的是完整設定檔可取得的最早版本。
:::

### 結果 {#results}

| 類別 | 指標 | 高吞吐量設定檔 | `v1.101.0` | 變化 |
|---|---|---:|---:|---:|
| 部署 | Gateway pods | 33 | 132 | 少 4 倍 |
|  | 每個 pod 的 worker 數 | 4 | 1 | |
|  | 總 worker 數 | 132 | 132 | 相同 |
| 吞吐量 | Requests/sec | 3.00K | 0.19K | 16x |
|  | Tokens/sec | 224.61M | 6.92M | 32x |
|  | 預估 tokens/30 天 | 582.20T | 17.94T | 32x |
| 可靠性 | HTTP 200 rate (Locust) | 100.00% | 92.07% | |
| 請求延遲 | p50 | 30.581 ms | 6.950 s | 227x |
|  | p95 | 54.029 ms | 27.451 s | 508x |
|  | p99 | 91.645 ms | 29.826 s | 325x |
| 首個 token 的時間 | p50 | 31.667 ms | 9.400 s | 297x |

此設定檔以 100% 的客戶可見成功率達到完整 3,000 RPS 目標。基準組穩定在接近 190 RPS，且 92.07% 的請求回傳成功回應。

### 測試設定 {#test-setup}

| 測試面向 | 設定 |
|---|---|
| 負載產生器 | 分散式 Locust，1 個 master 與 30 個 workers |
| 流量 | 3,000 名模擬使用者，每人每秒 1 個請求 |
| 請求混合 | 50K、75K 與 100K-token 提示詞，各佔相同比例 |
| 串流 | 50% 的請求 |
| 端點 | `/v1/chat/completions` 搭配 `max_tokens: 16` |
| 驗證 | 帶有預算的虛擬金鑰，因此會執行 admission token 計數與預算保留 |
| 模型 | 內建 mock model，且停用回應快取 |
| 網路路徑 | 公開 AWS Application Load Balancer |
| 用戶端逾時 | 60 秒 |
| 執行時間 | 高吞吐量設定檔：24m 22s。基準組：5m 7s。 |

此 mock model 移除了提供者成本與提供者延遲，同時保留閘道請求路徑的運作。測試仍包含驗證、預算、token 計數、支出追蹤與指標。

兩個部署都執行了 132 個閘道 worker，並請求了 528 GiB 記憶體。高吞吐量設定檔使用 33 個 pod、每個 pod 4 個 worker，並請求 132 vCPU。基準組使用 132 個 pod、每個 pod 1 個 worker，並請求 264 vCPU。

### 造成差異的因素 {#what-made-the-difference}

以下每項變更都先單獨量測，之後才測試完整設定檔。

| 變更 | 客戶影響 | 量測結果 |
|---|---|---|
| Rust admission token 計數 | 減少在分派前計算大型提示詞所耗費的 CPU。 | 50K / 75K / 100K 計數從 46 / 53 / 100 ms 降至 4.9 / 6.8 / 10.2 ms。 |
| 每個 pod 一個 PgBouncer | 避免資料庫連線隨著每個 worker 成倍增加。 | Postgres 在 11 到 29 個 pod 間維持 86 到 175 個連線，且沒有等待中的 PgBouncer client。 |
| 支出收集 sidecar | 將支出處理與推論 worker 分離。 | 在 700 RPS 時，p99 從 1.8 s 降至 830 ms。總計算量大致相同。 |
| 指標 sidecar | 將 Prometheus scrape 與推論 worker 分離。 | 在 700 RPS 時，sidecar 每個 pod 約使用 2 millicores。 |
| 更高的 CPU burst limit | 避免同一個 pod 中所有 worker 一起被 throttling。 | 在 700 RPS 時，p99 從 830 ms 降至 670 ms。 |
| Gateway keep-alive | 在擴縮期間維持 load balancer 連線有效。 | 在 200 RPS 測試中，ALB 產生的 502 回應從 15 個降至 0。 |
| RPS 與 TPS 自動擴縮 | 在 CPU 飽和前對流量做出反應。 | 在 200 使用者負載階梯後約 48 秒新增了一個副本。 |
| Admission token-count 重用 | 避免在 mock 測試中對相同的大型串流提示詞重複計數。 | 串流 mock 請求在約 30 ms 內完成，與非串流請求相當。 |

### 如何解讀指標 {#how-to-read-the-metrics}

- 每秒請求數、每秒 token 數、預估 token 數與請求延遲來自閘道的 Prometheus 指標。
- 首個 token 的時間來自 Locust，衡量從送出請求到收到第一個串流事件的時間。它包含請求上傳、load balancer 與閘道 admission 工作。
- HTTP 200 rate 來自 Locust，因為它包含從未到達閘道的失敗。

`v1.101.0` 執行有 5,118 個客戶可見失敗：4,546 個客戶逾時或連線中斷、457 個 HTTP 504 回應，以及 115 個 HTTP 502 回應。閘道沒有收到這些請求，因此其自身的成功指標顯示 100%，而 Locust 顯示 92.07%。

閱讀 Locust 吞吐量時請使用 `POST` 列。每個串流請求也會建立一列 `TTFT`，因此在啟用串流時，Locust 的 `Aggregated` 列所計數的項目會比真實請求更多。

### 基準範圍 {#benchmark-scope}

這是完整設定檔的前後比較，而不是單一變數測試。這些部署使用了不同的 pod 形狀，且執行時間也不同。上表中的個別效果來自 200 到 1,000 RPS 的獨立 A/B 測試。

內建 mock model 排除了提供者延遲。這些結果衡量的是此特定流量形狀下的閘道容量，不應被視為通用的生產規模配置指南。在選擇 worker 數、pod 資源與 HPA 目標之前，請先量測具代表性的工作負載。

以下各節使用在 4 CPU / 8 GB 機器上，對假 OpenAI 端點發出的短請求本文。它們無法直接與此大型提示詞基準測試相比。

## 用於測試的機器規格 {#machine-spec-used-for-testing}

每台部署 LiteLLM 的機器具有以下規格：

- 4 CPU
- 8GB RAM

## 設定 {#configuration}

- 資料庫：PostgreSQL。請參閱[資料庫容量規劃](./proxy/db_sizing.md)了解如何規劃您的配置
- Redis：未使用。建議在 production 中使用；請參閱[Redis 容量規劃](./proxy/redis_sizing.md)
- 負載產生器：Locust，1,000 名使用者，每次請求間有 0.5s 到 1s 的思考時間。在將這些數字與您自己的執行結果比較前，請參閱[Locust 設定](#locust-settings)。

### 2 個 LiteLLM Proxy 執行個體 {#2-instance-litellm-proxy}

在這些測試中，基準延遲特性是針對 fake-openai-endpoint 量測。

#### 效能指標 {#performance-metrics}

| **類型** | **名稱** | **中位數 (ms)** | **95%ile (ms)** | **99%ile (ms)** | **平均值 (ms)** | **目前 RPS** |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /chat/completions | 200 | 630 | 1200 | 262.46 | 1035.7 |
| Custom | LiteLLM Overhead Duration (ms) | 12 | 29 | 43 | 14.74 | 1035.7 |
|  | 彙總 | 100 | 430 | 930 | 138.6 | 2071.4 |

{/* <Image img={require('../img/1_instance_proxy.png')} /> */}

{/* ## **Horizontal Scaling - 10K RPS**

<Image img={require('../img/instances_vs_rps.png')} /> */}

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
      model: openai/{{openai_large}}
      api_key: "sk-fake-key"
      api_base: "https://api.openai.com"

litellm_settings:
  network_mock: true
  callbacks: []
  num_retries: 0
  request_timeout: 30

general_settings:
  master_key: "sk-<your-litellm-master-key>"
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

### 測試設定 {#test-setup-1}

| 類別 | 規格 |
|----------|---------------|
| **負載測試** | Locust：1,000 名使用者，思考時間 0.5s 到 1s，500 個 ramp-up |
| **系統** | 4 vCPU、8 GB RAM、4 個 worker、4 個 instance |
| **資料庫** | PostgreSQL（未使用 Redis） |

## 基礎架構建議 {#infrastructure-recommendations}

以上執行使用單一 PostgreSQL instance 且未使用 Redis，這是基準設定而非 production 設定。關於各請求率下的 instance 大小、決定部署是否能在擴增後存活的連線計算方式，以及在 AWS、Azure 和 GCP 上可直接使用的受管服務選擇，請參閱[資料庫容量規劃](./proxy/db_sizing.md)與[Redis 容量規劃](./proxy/redis_sizing.md)。若要了解配套的閘道端設定，請參閱[生產環境最佳實務](./proxy/prod.md)。

## Locust 設定 {#locust-settings}

- 1000 名使用者
- 500 名使用者 Ramp Up
- `wait_time = between(0.5, 1)`，因此每位使用者會在每次請求之間休息 0.5s 到 1s

### 為何在重現這些數字時，思考時間很重要 {#why-the-think-time-matters-when-you-reproduce-these-numbers}

Locust 使用者的時間不是在等待回應，就是在休息。若思考時間平均為 0.75s，且回應約為 110ms，則 1000 位使用者中的每一位大約每 0.86s 完成一個請求，因此此執行提供約 1160 RPS，並在任何瞬間維持大約 **130 個 in-flight 請求**。上面延遲欄位所描述的是這個 in-flight 深度，而不是使用者數。

沒有思考時間的 closed-loop client 測量的是不同的東西。1000 個並行 worker 在前一個請求一返回就送出下一個請求，會維持 **1000 個 in-flight 請求**，大約是這些執行 queue 深度的 8 倍。一旦閘道飽和，其吞吐量就會固定，而依 Little's Law，任何 client 觀察到的延遲就只是 `requests in flight / throughput`。因此，同一個部署、在相同 RPS 下，純粹因為 client 將 8 倍多的工作排入其中，所回報的延遲大約就是 8 倍。延遲與並行度並非獨立，缺少其中任一項，另一個數字都沒有意義。

若要與上方的表格比較，請保留 0.5 秒到 1 秒的思考時間，或將您用戶端的 in-flight 請求數維持在接近 130，並將其與延遲一併回報。也值得先回報 RPS：如果您的執行結果顯示比這些表格更高的 RPS 和更高的延遲，表示您的閘道比此基準測試更快，而您的用戶端只是排入更深的佇列。

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
        self.api_key = os.getenv('API_KEY', 'sk-<your-litellm-api-key>')
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

* 完全使用可用的 CPU 容量
* 強健的連線處理，以及初始暖機尖峰之後的低延遲

**缺點**

* 初始化期間與每次請求的記憶體使用量高

## 記錄回呼 {#logging-callbacks}

### [GCS Bucket 記錄](https://docs.litellm.ai/docs/observability/gcs_bucket_integration) {#gcs-bucket-logging}

使用 GCS Bucket 對延遲、RPS 相較於基本 Litellm Proxy **沒有影響**

| 指標 | 基本 Litellm Proxy | 啟用 GCS Bucket 記錄的 LiteLLM Proxy |
|--------|------------------------|---------------------|
| RPS | 1133.2 | 1137.3 |
| 中位延遲 (ms) | 140 | 138 |

### [LangSmith 記錄](https://docs.litellm.ai/docs/proxy/logging) {#langsmith-logging}

使用 LangSmith 對延遲、RPS 相較於基本 Litellm Proxy **沒有影響**

| 指標 | 基本 Litellm Proxy | 啟用 LangSmith 的 LiteLLM Proxy |
|--------|------------------------|---------------------|
| RPS | 1133.2 | 1135 |
| 中位延遲 (ms) | 140 | 132 |
