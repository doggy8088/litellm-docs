---
title: Redis 大小配置
description: 如何為 LiteLLM Proxy 規劃 Redis 大小，並提供 AWS、Azure 與 GCP 的執行個體建議。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Redis 大小配置 {#redis-sizing}

本頁說明 LiteLLM Proxy 後方的 Redis 執行個體大小，當您有超過一個閘道執行個體時，就應立即執行。Postgres 的大小配置則會在 [資料庫大小配置](./db_sizing.md) 中另外說明。關於如何將 Redis 連接到 proxy，請參閱 [Production Best Practices](./prod.md#redis) 的 Redis 章節以及 [快取設定](./caching_redis.md)。

## Proxy 對 Redis 的需求 {#what-the-proxy-asks-of-redis}

Redis 保存速率限制計數器、路由器與冷卻狀態、回應快取，以及在 `use_redis_transaction_buffer` 開啟時的花費更新佇列。這些全都是生命週期很短的即時狀態，而非持久歷史，因此 Redis 的特性是小且對延遲敏感，而不是大：即使在高流量下，幾 GB 的工作集也很常見。請把 RAM 視為您選擇要快取內容的預留空間，而不是請求速率的函數，並把 vCPU 數量視為決定吞吐量的因素，因為單一 Redis 處理程序是單執行緒，而 TLS 終止會與同一核心上的命令執行競爭。

沒有 Redis 時，每個執行個體會各自套用速率限制，而快取命中只會保留在處理該請求的執行個體本機，因此十個 pod 的叢集套用的限制大約是您設定值的十倍。

## 依請求速率配置大小 {#sizing-by-request-rate}

| 持續 RPS | vCPU | RAM |
|---------------|------|-----|
| 最多 1K | 2 | 8GB |
| 1K 到 5K | 4 | 16GB |
| 5K 以上 | 8+ | 32GB+ |

請執行 Redis 7.0 或更新版本。請將大小配置到在正常運作期間不會發生清除，並優先增加容量，而不是依賴清除策略：速率限制計數器與排隊中的花費更新都是即時記帳狀態，因此在壓力下發生清除的執行個體，損失的是花費更新並重設限制視窗，而不只是快取命中。若您使用 transaction buffer，也請啟用持久化，這樣在發生 failover 時，不會把已排隊但尚未刷入 Postgres 的花費更新丟掉。

當流量超過約 1000 RPS 或 10 個執行個體時，buffer 才是避免 Postgres 成為瓶頸的關鍵，這使得 Redis 成為記帳路徑的一部分，而非可選快取；請參閱 [Redis transaction buffer](./prod.md#redis-transaction-buffer)。如果您在負載下看到 `Got exception from REDIS No connection available`，請先在 `cache_params` 中提高 `max_connections`，再考慮更大的執行個體，因為該錯誤是用戶端連線池耗盡，而不是伺服器飽和。

## 雲端建議 {#cloud-recommendations}

<Tabs>
<TabItem value="aws" label="AWS">

請使用 ElastiCache 搭配 Valkey 或 Redis OSS 引擎，版本 7.x 或更新，並使用 Graviton 節點；`cache.m7g.large`（6.38 GiB）可支援到 1K RPS，而 `cache.m7g.xlarge`（12.93 GiB）則適用於更高流量；[支援的節點類型](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/CacheNodes.SupportedTypes.html) 清單列出的是每個節點可用記憶體，低於名義上的執行個體記憶體，因此請依該欄位而非執行個體名稱來規劃大小。生產環境請執行 [Multi-AZ with automatic failover](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/AutoFailover.html)。如果單一節點已不敷使用，請優先選擇叢集模式並搭配 LiteLLM 的 [Redis Cluster 設定](./caching_redis.md#redis-cluster)，而不是改用更大的節點，因為分片會把計數器 keyspace 分散到多個處理程序，而不是全部堆到單一處理程序上。ElastiCache Serverless 適合純快取，但不適合 [valkey-search 上的語意快取](./caching_semantic.md#valkey)，後者需要以節點為基礎的叢集。

</TabItem>
<TabItem value="azure" label="Azure">

請使用 [Azure Managed Redis](https://learn.microsoft.com/en-us/azure/redis/overview) 的 Balanced 級別，該級別的記憶體與 vCPU 比為 4:1，而且與 Azure Cache for Redis 不同，能為單一執行個體提供超過一個 vCPU：`B5`（6GB、2 vCPU）已足夠只處理計數器與路由器狀態，`B10`（12GB、4 vCPU）是在快取回應之後較安全的預設值，而 `B20`（24GB、8 vCPU）足以涵蓋 5K RPS 那一列。請參閱 [級別與 SKU 表](https://learn.microsoft.com/en-us/azure/redis/how-to-scale#performance-tiers) 以取得完整清單，若瓶頸在吞吐量而非容量，則可考慮 Compute Optimized。若使用較舊的 Azure Cache for Redis，請使用 Premium 級別（`P1` 及以上），而非 Standard，因為 Basic 與 Standard 都是在單一 vCPU 上執行。請啟用可用性區域備援，並在使用 transaction buffer 時啟用資料持久化。

</TabItem>
<TabItem value="gcp" label="GCP">

請使用 [Memorystore for Redis Cluster](https://cloud.google.com/memorystore/docs/cluster/cluster-node-specification)，其容量是節點類型乘以 shard 數量，而不是單一執行個體大小。`redis-standard-small`（每個節點 5.2GB 可寫）在 3 個 shard 時是一個合理的下限，`redis-highmem-medium`（10.4GB 可寫）在 3 個 shard 時可涵蓋 1K 到 5K 的那一列，而再往上則應增加 shard，而不是提高節點類型，這也是 Google 自己的價格效能指引，因為 Redis 在單一節點上的效能不會隨 vCPU 線性擴展。請略過 `redis-shared-core-nano`，它的效能會變動且沒有 SLA。請使用 [Redis Cluster 設定](./caching_redis.md#redis-cluster) 將 LiteLLM 指向該叢集。

</TabItem>
</Tabs>

## 監控項目 {#what-to-monitor}

請監看記憶體使用量相對於 `maxmemory` 的比例以及清除計數器，因為在這裡清除代表的是默默的正確性損失，而不是快取命中率問題。在 LiteLLM 端，有用的 Prometheus 訊號是 `litellm_redis_spend_update_queue_size` 與 `litellm_in_memory_spend_update_queue_size`，它們代表排隊中而非已寫入的花費更新，以及 `litellm_pod_lock_manager_size`，它指出目前是哪個 pod 持有 transaction buffer flush lock。用戶端連線數也很重要：每種受管理服務都有每個執行個體大小的連線上限，而 gateway 會為每個 worker 開啟連線池。
