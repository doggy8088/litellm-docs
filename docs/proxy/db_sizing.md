---
title: Database Sizing
description: 如何為 LiteLLM Proxy 規劃 Postgres 大小，並提供 AWS、Azure 與 GCP 的執行個體建議。
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 資料庫規劃大小 {#database-sizing}

本頁說明 LiteLLM Proxy 後方的 Postgres 執行個體大小規劃；只要您使用虛擬金鑰或用量追蹤，就需要它。以下數值以 [gateway 基準測試](../benchmarks.md) 為基礎，該測試是在 4 vCPU / 8GB 的 gateway 執行個體上執行，並延伸到 AWS、Azure 與 GCP 的代管產品。Redis 的大小規劃則另見 [Redis 規劃大小](./redis_sizing.md)。與此大小規劃相關的設定旋鈕，請參閱 [Production Best Practices](./prod.md)；實際儲存在資料庫中的內容，請參閱 [What is stored in the DB](./db_info.md)。

## Proxy 對資料庫的需求 {#what-the-proxy-asks-of-the-database}

Postgres 同時位於驗證路徑與計量路徑上，而這兩種負載型態非常不同。驗證是在每個請求上，針對 `LiteLLM_VerificationToken`、`LiteLLM_UserTable` 與 `LiteLLM_TeamTable` 進行少量已建立索引的定點讀取，而且有快取，因此在穩態下幾乎不會對資料庫造成負擔。計量則是昂貴的一半：花費必須回寫到 key、user、team 與 org 資料列，而且每個請求的記錄資料列會落到 `LiteLLM_SpendLogs`。決定您需要哪種執行個體的是這條寫入路徑，而不是讀取路徑；這也是為什麼 [批次寫入花費](./prod.md#batch-spend-writes) 以及（大約超過 1000 RPS 時）[Redis transaction buffer](./prod.md#redis-transaction-buffer) 對資料庫大小規劃的影響，比原始請求量更大。

## 依請求率規劃大小 {#sizing-by-request-rate}

以上述寫入路徑為基準規劃大小。儲存空間主要受 `LiteLLM_SpendLogs` 支配，因此取決於保留期限而非吞吐量；若不含 prompts，每個已記錄請求預估約 1 到 2 KB；若啟用 `store_prompts_in_spend_logs`，則約為其 10 倍。

| 持續 RPS | vCPU | RAM | 儲存空間 | 需要的連線數 |
|---------------|------|-----|---------|--------------------|
| 最多 1K | 4 | 16GB | 200GB SSD，3000+ IOPS | 100 到 200 |
| 1K 到 5K | 8 | 32GB | 500GB SSD，5000+ IOPS | 200 到 500 |
| 5K+ | 16+ | 64GB | 1TB+ SSD，10000+ IOPS | 500+，外加一個 [read replica](./db_read_replica.md) |

## 連線會先耗盡，不是 CPU {#connections-break-before-cpu-does}

您最可能遇到的失敗是 `FATAL: sorry, too many clients already`，而不是資料庫 CPU 飽和。LiteLLM 的連線池上限是按每個 worker process 計算，因此您的總需求是 `database_connection_pool_limit × workers_per_instance × instances`，而真正重要的執行個體數是 autoscaler 的 `maxReplicas`，不是目前的 replica 數量。若某個 deployment 有 `maxReplicas: 100`，且使用預設 10 的 pool limit，就會需要 1000 條連線，這已超過多數代管 Postgres 執行個體在預設設定下可接受的數量。請使用 [設定參考中的除法](./configs.md#configure-db-pool-limits--connection-timeouts) 來設定 pool，並將 `maxReplicas` 上限設在資料庫實際能提供的數值。

各雲端都會根據執行個體記憶體來決定預設的 `max_connections`，因此在您調整大小時，上限也會跟著變動：

| 雲端 | 預設 `max_connections` | 參考 |
|-------|---------------------------|-----------|
| AWS RDS 與 Aurora | `LEAST({DBInstanceClassMemory/9531392}, 5000)`，因此在 8GB 時約 860、在 32GB 時約 3600 | [RDS 參數預設值](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.MaxConnections) |
| Azure Database for PostgreSQL flexible server | 依產品名稱固定，16GB（D4ds_v5）為 1,718、32GB（D8ds_v5）為 3,437，服務會保留 15 條 | [Azure 限制](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits#maximum-connections) |
| Google Cloud SQL | 依執行個體記憶體推導，除非您鎖定旗標，否則在調整大小時會自動變更 | [Cloud SQL 旗標](https://cloud.google.com/sql/docs/postgres/flags#postgres-m) |

當許多 pod 等待同一筆資料列時，連線也會耗盡。每個 pod 會將花費匯總到共用的每日資料列（`LiteLLM_DailyUserSpend`、`LiteLLM_DailyToolSpend`、`LiteLLM_DailyModelUsage`），而某個 pod 若在等待另一個 pod 正在更新的資料列，就會在等待期間持有其連線池連線。Proxy 會在每次彙總交易（`SPEND_ROLLUP_LOCK_TIMEOUT_MS`，預設 5000）中，透過 `lock_timeout` 來限制這段等待：等待超過時間的 statement 會在套用前被 Postgres 取消，其資料列會重新排入下一次 flush，而連線則回到 pool。若您懷疑是這個問題，在事故期間查看 `SELECT query, count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' GROUP BY query`，即可知道等待中的請求卡在誰後面。

如果您需要的應用程式連線數比執行個體可提供的更多，請在前面加上 pooler（RDS Proxy、Azure flexible server 內建的 PgBouncer，或您自建的 pooler），並設定 [`database_disable_prepared_statements: true`](./configs.md#disable-server-side-prepared-statements)，讓 Prisma 停止在 pooled sessions 之間重複使用 server-side prepared statements。

## 雲端建議 {#cloud-recommendations}

<Tabs>
<TabItem value="aws" label="AWS">

請在 Graviton 通用型規格上使用 RDS for PostgreSQL，1K RPS 以內使用 `db.m7g.large`，1K 到 5K 使用 `db.m7g.xlarge`，超過則使用 `db.m7g.2xlarge` 或更大；完整清單請見 [DB instance classes](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html)。儲存空間請選 gp3，任何大小都提供 [3000 IOPS 與 125 MiB/s 的基準值](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html#gp3-storage)，而當 Postgres volume 超過 400 GiB 時，會提升到 12,000 IOPS 與 500 MiB/s，因此上表中的 500GB 列不只買到容量，也買到吞吐量。正式環境請使用 [Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)，並啟用 [Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)，如此花費寫入的熱點便會以等待事件呈現，而不是不明延遲。

若您想要 reader endpoint，則改用 Aurora PostgreSQL：它可直接與 LiteLLM 的 [read replica routing](./db_read_replica.md) 搭配，這是突破 5K RPS 那一列最乾淨的方法。Aurora 的 `max_connections` 預設值使用與 RDS 相同的記憶體公式。

</TabItem>
<TabItem value="azure" label="Azure">

請在 General Purpose tier 上使用 Azure Database for PostgreSQL flexible server，1K RPS 以內使用 `D4ds_v5`（4 vCore、16GB），1K 到 5K 使用 `D8ds_v5`（8 vCore、32GB）；若工作集不再能放入快取，則升級到 Memory Optimized `E8ds_v5` 或更大；[compute options](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-compute) 列出所有產品名稱。正式環境請避免使用 Burstable tier，因為一旦 credits 用盡，花費寫入路徑就會停滯。請使用 [Premium SSD v2 storage](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-storage)，讓 IOPS 可獨立於磁碟大小配置，並開啟 [zone-redundant high availability](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-high-availability)。[內建 PgBouncer](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-pgbouncer) 是處理上方連線上限的最簡單方式；啟用它，將 `DATABASE_URL` 指向 6432 埠，並設定 `database_disable_prepared_statements: true`。

</TabItem>
<TabItem value="gcp" label="GCP">

請在 Enterprise Plus 版本、使用 N2 機器類型的 Cloud SQL for PostgreSQL 上，1K RPS 以內使用 4 vCPU / 16GB，1K 到 5K 使用 8 vCPU / 32GB；[instance settings reference](https://cloud.google.com/sql/docs/postgres/instance-settings) 會說明機器系列，[editions comparison](https://cloud.google.com/sql/docs/postgres/editions-intro) 則說明 Enterprise Plus 新增的功能，包括 data cache 與亞秒級 planned failover。請注意，Cloud SQL 上的 SSD IOPS 會隨 vCPU 數量與磁碟大小一起擴展（每 GB 30 個讀取 IOPS 與 30 個寫入 IOPS，並受 [per-vCPU limits](https://cloud.google.com/sql/docs/postgres/storage-options-overview) 上限約束），因此大型機器搭配小磁碟會形成吞吐量上限，且無法靠旗標突破。請啟用區域高可用性與自動增加儲存空間。

</TabItem>
</Tabs>

## 讓資料庫保持精簡 {#keep-the-database-small}

當寫入路徑做得更少時，大小規劃成本就更低。請用 `proxy_batch_write_at: 60` 批次寫入花費、將 [錯誤記錄排除在資料庫之外](./prod.md#keep-error-logs-out-of-the-database)，並設定 [spend log retention period](./spend_logs_deletion.md)，讓 `LiteLLM_SpendLogs` 不會無限制成長；那個資料表正是儲存空間通常比 CPU 更早需要調整的原因。若您根本不需要 UI 中的每請求資料列，`disable_spend_logs: True` 會移除最高量的插入作業，而您的記錄整合仍會保留成本資料。只有在刻意需要時才啟用 `store_prompts_in_spend_logs`，因為它會同時放大資料列大小與 gateway pod 的記憶體下限。

## 要監控什麼 {#what-to-monitor}

請監看 `max_connections` 的連線數，而不只是使用率，因為那才是會導致硬性失敗的上限。在 LiteLLM 端，實用的 Prometheus 訊號是 `litellm_in_memory_spend_update_queue_size` 和 `litellm_redis_spend_update_queue_size`，用於尚未寫入而是排入佇列的支出更新，以及 `litellm_pod_lock_manager_size`，用於目前哪個 pod 持有交易緩衝區 flush 鎖。持續單調成長的佇列深度表示資料庫無法跟上寫入路徑，這就是需要調整大小或啟用緩衝區的訊號。
