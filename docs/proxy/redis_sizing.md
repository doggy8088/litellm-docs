---
title: Redis 大小配置
description: 為 LiteLLM Proxy 規劃 Redis 大小，涵蓋最高 20K RPS，並提供雲端建議、shard 容量與記憶體指引。
---

# Redis 大小配置 {#redis-sizing}

設定方式請參閱 [production 中的 Redis](./prod.md#redis) 與 [快取設定](./caching_redis.md)。Postgres 的大小配置請參閱 [資料庫大小配置](./db_sizing.md)。

## 工作負載 {#what-the-proxy-asks-of-redis}

Redis 儲存速率限制計數器、router 與冷卻狀態，以及快取的回應。啟用 `use_redis_transaction_buffer` 時，它也會保存花費更新，直到 LiteLLM 將它們寫入 Postgres。

記憶體取決於您啟用的功能、快取保留時間與回應大小。吞吐量取決於命令量與每個 shard 的容量。為單一節點增加 vCPU 並不保證吞吐量成比例提升。[Google 建議在需要更高吞吐量時增加 shard](https://docs.cloud.google.com/memorystore/docs/cluster/cluster-node-specification)。

若沒有共享的 Redis state，每個 gateway 都會各自套用其速率限制並保留自己的快取。限制可能會在各執行個體之間倍增。

## 依請求速率配置大小 {#sizing-by-request-rate}

<span id="cloud-recommendations" />

請將這些設定用作負載測試的起點。AWS 與 GCP 表格假設單一主要 shard 可支援 2,500 LiteLLM RPS，並保留突發流量的容量。這是範例假設，而非基準測試。請在啟用您的功能後測量每種節點類型，並以 `primary shards = ceil(target RPS / measured RPS per primary)` 計算。

請測試完整叢集，因為 key 分布與共享計數器可能限制擴展。記憶體總量不含保留的額外開銷與 replica 副本。

### AWS ElastiCache {#aws-elasticache}

| 目標 RPS | 節點類型 | 主要 shard 數 | 可用主要記憶體 |
| --- | --- | --- | --- |
| 最多 1K | `cache.m7g.xlarge` | 1 | 約 9.70 GiB |
| 1K 到 5K | `cache.m7g.xlarge` | 2 | 約 19.40 GiB |
| 5K 到 10K | `cache.m7g.xlarge` | 4 | 約 38.79 GiB |
| 10K 到 15K | `cache.m7g.xlarge` | 6 | 約 58.19 GiB |
| 15K 到 20K | `cache.m7g.xlarge` | 8 | 約 77.58 GiB |

每個[節點](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/CacheNodes.SupportedTypes.html)在預設的 [25% 記憶體保留](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/redis-memory-management.html)之前有 12.93 GiB。請為每個主要節點新增一個 replica，並啟用 [Multi-AZ 與自動 failover](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/AutoFailover.html)。多個 shard 請使用 [Redis Cluster 設定](./caching_redis.md#redis-cluster)。

ElastiCache Serverless 支援回應快取。[Valkey 語意快取](./caching_semantic.md#valkey) 需要具備 search 模組的節點式叢集。

### Google Cloud Memorystore for Redis Cluster {#google-cloud-memorystore-for-redis-cluster}

| 目標 RPS | 節點類型 | 主要 shard 數 | 可用主要記憶體 |
| --- | --- | --- | --- |
| 最多 1K | `redis-highmem-medium` | 1 | 10.4 GB |
| 1K 到 5K | `redis-highmem-medium` | 2 | 20.8 GB |
| 5K 到 10K | `redis-highmem-medium` | 4 | 41.6 GB |
| 10K 到 15K | `redis-highmem-medium` | 6 | 62.4 GB |
| 15K 到 20K | `redis-highmem-medium` | 8 | 83.2 GB |

每個[節點](https://docs.cloud.google.com/memorystore/docs/cluster/cluster-node-specification)在扣除保留的額外開銷後，有 2 vCPU 與 10.4 GB 可寫記憶體。請使用 [Redis Cluster 設定](./caching_redis.md#redis-cluster)、[多可用區放置，以及每個主要節點一個 replica](https://docs.cloud.google.com/memorystore/docs/cluster/create-instances)。

### Azure Managed Redis {#azure-managed-redis}

這些 SKU 是記憶體容量的起點。Azure 會管理每個 SKU 的 shard 數量。在選定 SKU 之前，請先以負載測試驗證吞吐量。

| 目標 RPS | Balanced SKU | 記憶體 | 可用記憶體 |
| --- | --- | --- | --- |
| 最多 1K | `B10` | 12 GB | 約 9.6 GB |
| 1K 到 5K | `B20` | 24 GB | 約 19.2 GB |
| 5K 到 10K | `B50` | 60 GB | 約 48 GB |
| 10K 到 20K | `B100` | 120 GB | 約 96 GB |

這些 [SKU 大小](https://azure.microsoft.com/en-us/pricing/details/managed-redis/)顯示的是 Azure [20% 保留](https://learn.microsoft.com/en-us/azure/redis/plan-tiers-and-capacity#reserved-memory)之後的可用記憶體。如果記憶體仍有餘裕但吞吐量限制了容量，請測試相同後綴的 Compute Optimized SKU，例如以 `X50` 取代 `B50`。

請啟用[高可用性](https://learn.microsoft.com/en-us/azure/redis/overview#high-availability)。在支援可用區的區域中，Azure 會將節點分散到各可用區。

## 容量規劃 {#capacity-planning}

### 功能容量 {#feature-capacity}

請執行 Redis 7.0 或更新版本。請為計數器、router state、快取的回應與排隊中的花費更新保留記憶體。回應快取會隨回應大小與保留時間成長，因此不能只以 RPS 決定記憶體需求。

請避免在正常運作期間發生清除。清除可能會移除速率限制計數器或排隊中的花費更新，也會移除快取的回應。若您使用 transaction buffer，請設定受支援的持久化，並測試 failover 期間排隊更新的復原。

當流量超過約 1K RPS 或 10 個 gateway 執行個體時，請使用 [Redis transaction buffer](./prod.md#redis-transaction-buffer) 以降低 Postgres 的寫入壓力。請將佇列的尖峰大小納入 Redis 記憶體預算。

### 連線預算 {#connection-budgets}

每個 gateway worker 都會開啟一個 Redis 連線池。將連線池大小與受管理服務的連線上限比較時，請把 gateway 執行個體的最大數量納入考量。

如果您看到 `Got exception from REDIS No connection available`，請先檢查用戶端連線池，再調整 Redis 大小。當連線池對工作負載而言太小時，請在 `cache_params` 中提高 `max_connections`。

## 監控項目 {#what-to-monitor}

請監看記憶體使用量相對於 `maxmemory` 的比例、清除、命令延遲與連線數。請檢查 `litellm_redis_spend_update_queue_size` 與 `litellm_in_memory_spend_update_queue_size` 以了解排隊中的花費更新。請使用 `litellm_pod_lock_manager_size` 檢查目前是哪個 pod 持有 transaction buffer flush lock。
