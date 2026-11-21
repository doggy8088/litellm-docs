# 基準測試 {#benchmarks}

LiteLLM 閘道的效能測試結果。

## 高吞吐量效能測試結果 {#high-throughput-profile-3000-rps-with-50k-to-100k-token-prompts}

**每分鐘 135 億 token（TPM）。**

| 指標 | 結果 |
|---|---:|
| 每秒請求數 | 3,000 |
| 用戶端 HTTP 200 比率 | 100.00% |
| 閘道請求延遲，p50 | 30.581 ms |
| 閘道請求延遲，p95 | 54.029 ms |
| 閘道請求延遲，p99 | 91.645 ms |
| 用戶端首 token 時間，p50 | 31.667 ms |

### 測試方法 {#methodology}

| 設定項目 | 設定 |
|---|---|
| 部署 | 33 個閘道 pod；每個 pod 請求 4 個 worker、4 vCPU 與 16 GiB 記憶體 |
| 流量 | 分散式 Locust，30 個負載產生器 worker；3,000 位使用者，每人每秒一個請求 |
| 請求 | `/v1/chat/completions`；50K、75K 與 100K token 的提示各占相等比例；50% 串流；`max_tokens: 16` |
| 模型與網路 | 程序內 mock 模型；公開 AWS Application Load Balancer；用戶端逾時 60 秒 |
| 設定 | [高吞吐量 Helm 設定值](./proxy/high_throughput.md)；PostgreSQL 與 Redis；虛擬金鑰預算、token 計數、支出追蹤與指標；回應快取已停用 |
| 持續時間 | 24 分 22 秒 |
| 量測 | Prometheus：吞吐量與閘道延遲。Locust：用戶端成功率與首 token 時間，包含上傳與負載平衡器時間 |

## Realtime API 效能測試結果 {#realtime-api-benchmarks}

**每秒 1,207 個請求。**

| 指標 | 結果 |
|---|---:|
| 端到端延遲，p50 | 59 ms |
| 端到端延遲，p95 | 67 ms |
| 端到端延遲，p99 | 99 ms |
| 平均端到端延遲 | 63 ms |

### 測試方法 {#methodology-1}

| 設定項目 | 設定 |
|---|---|
| 部署 | 4 個閘道執行個體；每個執行個體 4 個 worker、4 vCPU 與 8 GB RAM |
| 流量 | Locust；1,000 位使用者，請求之間暫停 0.5 到 1 秒 |
| 請求 | 透過持久 WebSocket 的 `/v1/realtime`；以隨機 ID 要求兩句話故事的文字請求 |
| 模型與網路 | Mock 即時端點 |
| 設定 | PostgreSQL；Redis 已停用 |
| 持續時間 | 未記錄 |
| 量測 | [Locust 腳本](https://gist.github.com/AlexsanderHamir/73b83ada21d9b84d4fe09665cf1745f5)：每秒請求數，以及量測至 `response.done` 的延遲，必要時包含連線建立 |

## 短提示聊天效能測試結果 {#short-prompt-chat-performance-test-results}

**四個執行個體下每秒 1,170 個請求，閘道額外負擔 p95 為 8 ms。**

| 指標 | 2 個執行個體 | 4 個執行個體 |
|---|---:|---:|
| 每秒請求數 | 1,035.7 | 1,170 |
| 請求延遲，p50 | 200 ms | 100 ms |
| 請求延遲，p95 | 630 ms | 150 ms |
| 請求延遲，p99 | 1,200 ms | 240 ms |
| 平均請求延遲 | 262.46 ms | 111.73 ms |
| 閘道額外負擔，p50 | 12 ms | 2 ms |
| 閘道額外負擔，p95 | 29 ms | 8 ms |
| 閘道額外負擔，p99 | 43 ms | 13 ms |
| 平均閘道額外負擔 | 14.74 ms | 3.32 ms |

### 測試方法 {#methodology-2}

| 設定項目 | 設定 |
|---|---|
| 部署 | 2 或 4 個執行個體；每個執行個體 4 vCPU 與 8 GB RAM。4 執行個體測試每個執行個體使用 4 個 worker；2 執行個體的 worker 數量未記錄 |
| 流量 | Locust；1,000 位使用者，請求之間暫停 0.5 到 1 秒 |
| 請求 | `/chat/completions`；[4 執行個體腳本](https://gist.github.com/AlexsanderHamir/42c33d7a4dc7a57f56a78b560dee3a42) 傳送帶有隨機 ID 的文字，重複 150 次。2 執行個體的 payload 未記錄 |
| 模型與網路 | Mock OpenAI 端點 |
| 設定 | PostgreSQL；Redis 已停用 |
| 持續時間 | 未記錄 |
| 量測 | Locust：請求吞吐量與完整請求延遲。閘道額外負擔：`x-litellm-overhead-duration-ms` 回應標頭 |

## 記錄回呼效能測試結果 {#logging-callbacks}

| 設定 | 每秒請求數 | 請求延遲中位數 |
|---|---:|---:|
| 基礎 proxy | 1,133.2 | 140 ms |
| GCS bucket 記錄 | 1,137.3 | 138 ms |
| LangSmith 記錄 | 1,135 | 132 ms |

### 測試方法 {#methodology-3}

| 設定項目 | 設定 |
|---|---|
| 部署 | 未記錄 |
| 流量 | 未記錄 |
| 請求 | 未記錄 |
| 模型與網路 | 未記錄 |
| 設定 | 基礎 proxy 與 [GCS bucket 記錄](./observability/gcs_bucket_integration.md) 及 [LangSmith 記錄](./observability/langsmith_integration.md) 的比較 |
| 持續時間 | 未記錄 |
| 量測 | 每秒請求數與請求延遲中位數 |

## 依 pod 基準測試 {#per-pod-streaming-benchmarks}

在這個短回應工作負載下，為保留延遲餘裕，請以每個四 worker pod 在 AWS c7a.2xlarge 上約 **100 個合併 RPS** 來規劃。同一 pod 與節點上的三次執行共完成 **134,992 個量測請求，零失敗**，其中 80% 為一般流量、20% 為串流流量。

| 每個 pod 的合併 RPS | 一般額外負擔 p99 | 串流額外負擔 p99 |
|---|---:|---:|
| 100 | 47 ms | 45 ms |
| 150 | 91 ms | 93 ms |
| 200 | 651 ms | 645 ms |

在 150 RPS 時，p99 額外負擔接近 100 ms 目標；在 200 RPS 時超過目標。在 100 RPS 時，p99 首 token 時間為 264 ms，包含 mock 提供者的 200 ms 延遲。

### 測試方法 {#methodology-4}

| 設定項目 | 設定 |
|---|---|
| 版本與機器 | LiteLLM v1.110.0；2026 年 11 月 20 日（UTC）；專用 c7a.2xlarge 節點，8 vCPU 與 16 GiB RAM，AWS EKS `us-west-1a` |
| Pod | 三次執行使用同一 pod 與節點；四個 worker；閘道請求 4 vCPU 與 8 GiB RAM，上限為 8 vCPU 與 8 GiB；collector 與 metrics sidecar |
| 驗證 | 所有負載請求使用同一組已儲存的 LiteLLM 虛擬金鑰；master key 僅在測試前用來建立它 |
| 工作負載 | 80% 一般／20% 串流；小型不重複提示，`max_tokens: 64`；另一個網路 mock 等待 200 ms 後回傳 37 個內容 chunk，串流時每 15 ms 一個 |
| 負載與持續時間 | 叢集內 Locust FastHttpUser；100、150 與 200 RPS；每次執行 60 秒暖機與 5 分鐘量測。pacing 開始後啟動偏移仍有效；以 100 ms 區間檢查送達的請求；驗證完整串流 |
| 量測 | 閘道額外負擔使用 `x-litellm-overhead-duration-ms` 回應標頭，不包含完整串流持續時間 |
| 服務與範圍 | PostgreSQL、Redis 與 mock 提供者在同一可用區的另一個節點上；已啟用 PgBouncer、collector、提示儲存、支出追蹤與 Prometheus。直接走 Kubernetes Service 流量 |
