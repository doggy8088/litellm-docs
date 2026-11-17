---
title: Database Sizing
description: 為 LiteLLM Proxy 規劃 Postgres 大小，涵蓋至 20K RPS，並提供雲端建議、連線預算與儲存估算。
---

# 資料庫規劃大小 {#database-sizing}

設定請參閱 [Production Best Practices](./prod.md)，資料庫內容請參閱 [What is stored in the DB](./db_info.md)。Redis 請以 [Redis 規劃大小](./redis_sizing.md) 規劃大小。[Gateway 基準測試](../benchmarks.md) 涵蓋 proxy 的吞吐量與延遲。

## 工作負載 {#what-the-proxy-asks-of-the-database}

Postgres 負責驗證讀取與記帳寫入。驗證使用來自 `LiteLLM_VerificationToken`、`LiteLLM_UserTable` 與 `LiteLLM_TeamTable` 的索引讀取。快取可減少重複讀取。

記帳會更新金鑰、使用者、團隊與組織的支出。每個請求的記錄會寫入 `LiteLLM_SpendLogs`。這些寫入決定了資料庫容量，因此請啟用[批次支出寫入](./prod.md#batch-spend-writes)，並在約 1K RPS 以上使用 [Redis 交易緩衝區](./prod.md#redis-transaction-buffer)。

## 依請求速率規劃大小 {#sizing-by-request-rate}

這些執行個體大小是規劃估算值。10K–20K 級距是以 5K 基準外推，假設記錄、批次處理與查詢組成不變。請以負載測試驗證。這些執行個體系列從 16 vCPU 直接跳到 32 vCPU，因此 10K–20K 使用同一級距。

儲存大小依保留期決定，連線數則依下方的工作程序池預算決定。[唯讀副本](./db_read_replica.md) 可以服務受支援的讀取流量，但無法消除主資料庫上的寫入競爭。

<span id="cloud-recommendations" />

### AWS RDS for PostgreSQL {#aws-rds-for-postgresql}

| 持續 RPS | 執行個體類型 | vCPU | RAM |
| --- | --- | --- | --- |
| 最高 1K | `db.m7g.xlarge` | 4 | 16 GiB |
| 1K 至 5K | `db.m7g.2xlarge` | 8 | 32 GiB |
| 5K 至 10K | `db.m7g.4xlarge` | 16 | 64 GiB |
| 10K 至 20K | `db.m7g.8xlarge` | 32 | 128 GiB |

請參閱 [RDS 執行個體規格](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Summary.html)。請使用 [gp3 儲存](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html#gp3-storage)、[Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html) 與 [Database Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html)。

### Google Cloud SQL for PostgreSQL {#google-cloud-sql-for-postgresql}

| 持續 RPS | 執行個體類型 (Enterprise Plus) | vCPU | RAM |
| --- | --- | --- | --- |
| 最高 1K | `db-perf-optimized-N-4` | 4 | 32 GB |
| 1K 至 5K | `db-perf-optimized-N-8` | 8 | 64 GB |
| 5K 至 10K | `db-perf-optimized-N-16` | 16 | 128 GB |
| 10K 至 20K | `db-perf-optimized-N-32` | 32 | 256 GB |

請參閱 [Cloud SQL 機器規格](https://docs.cloud.google.com/sql/docs/postgres/machine-series-overview#n2-machine-types)。請啟用區域高可用性與自動增加儲存空間。SSD 吞吐量同時取決於磁碟大小與 vCPU 上限。請查看[儲存上限](https://cloud.google.com/sql/docs/postgres/storage-options-overview)。

### Azure Database for PostgreSQL {#azure-database-for-postgresql}

| 持續 RPS | 執行個體類型 (General Purpose) | vCore | RAM |
| --- | --- | --- | --- |
| 最高 1K | `D4ds_v5` | 4 | 16 GiB |
| 1K 至 5K | `D8ds_v5` | 8 | 32 GiB |
| 5K 至 10K | `D16ds_v5` | 16 | 64 GiB |
| 10K 至 20K | `D32ds_v5` | 32 | 128 GiB |

請參閱 [Azure 運算選項](https://learn.microsoft.com/en-us/azure/postgresql/compute-storage/concepts-compute)。請使用 [Premium SSD v2](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-storage) 與[可用性區域備援高可用性](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-high-availability)。內建的 [PgBouncer](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-pgbouncer) 在連接埠 `6432` 提供連線池。

## 容量規劃 {#capacity-planning}

### 連線預算 {#connections-break-before-cpu-does}

連線池耗盡時，可能在 CPU 達到上限之前就出現 `FATAL: sorry, too many clients already`。對於直接連線到 Postgres 的工作程序，請同時計入自動擴展器的最大值，以及部署推出期間額外存活的執行個體：

```text
direct connections = database_connection_pool_limit × workers_per_instance × (maximum_instances + rollout_overlap)
```

在連線池上限為 10、每個執行個體一個工作程序、最多 100 個執行個體、另加 25 個推出期間執行個體的情況下，閘道可開啟 1,250 條連線。請為後端服務、遷移與操作人員保留容量。連線池請以[連線上限設定](./configs.md#configure-db-pool-limits--connection-timeouts) 設定。

當您啟用 [Helm 中的 `database.connectionPool`](./deploy/helm.md#valuesyaml-reference) 時，閘道工作程序會在每個 pod 內共用一個 PgBouncer 連線池。閘道的 Postgres 連線預算變為 `maxDbConnections × (maximum_pods + rollout_overlap)`。後端與遷移連線請分開計算，因為它們是直接連線。

| 雲端 | 連線上限 | 參考 |
| --- | --- | --- |
| AWS RDS and Aurora | 預設公式為 `LEAST({DBInstanceClassMemory/9531392}, 5000)`。請確認您執行個體的實際參數。 | [RDS 參數預設值](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.MaxConnections) |
| GCP Cloud SQL | 預設值依執行個體記憶體推導。調整大小後會自動變更，除非您自行設定該旗標。 | [Cloud SQL 旗標](https://cloud.google.com/sql/docs/postgres/flags#postgres-m) |
| Azure flexible server | `D4ds_v5` 允許 1,718 條總連線與 1,703 條應用程式連線。`D8ds_v5` 允許 3,437 條總連線與 3,422 條應用程式連線。 | [Azure 上限](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits#maximum-connections) |

若應用程式需求超過資料庫連線預算，請使用 RDS Proxy、Azure 內建的 PgBouncer 或其他連線池工具。對於連線池工作階段，請設定 [`database_disable_prepared_statements: true`](./configs.md#disable-server-side-prepared-statements)。

當交易等待共用的支出資料列時，連線也會持續忙碌。LiteLLM 將 `SPEND_ROLLUP_LOCK_TIMEOUT_MS`（預設 5,000 ms）套用到支出彙總交易。Postgres 會取消超過此等待時間的陳述式。LiteLLM 會將其資料列重新排入下一次排清，並釋放連線。若要檢查鎖定等待，請執行：

```sql
SELECT query, count(*)
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
GROUP BY query
```

### 儲存與寫入吞吐量 {#storage-and-write-throughput}

儲存量取決於請求記錄量與保留期。先以每個已記錄請求（不含提示）1–2 KB 估算，再測量實際的資料列與索引大小。`store_prompts_in_spend_logs` 可使其增加約 10 倍。

```text
log data bytes = logged requests per second × 86400 × retention days × bytes per request
```

| 持續記錄 RPS | 每日記錄資料量（每個請求 1–2 KB） |
| --- | --- |
| 10K | 0.864–1.728 TB |
| 15K | 1.296–2.592 TB |
| 20K | 1.728–3.456 TB |

這些十進位 TB 估算不含索引、WAL 與維護用的可用空間。請乘以保留天數並加上這些成本。

請以這些起點進行寫入測試，再增加儲存空間以涵蓋保留期。請在 10K、15K 與 20K 測量寫入延遲與 IOPS，因為批次處理會改變寫入速率。

| 持續 RPS | SSD 起始容量 | IOPS 起點 |
| --- | --- | --- |
| 最高 1K | 200 GB | 3,000 |
| 1K 至 5K | 500 GB | 5,000 |
| 5K 至 20K | 1 TB | 10,000 |

### 讓資料庫保持精簡 {#keep-the-database-small}

以 `proxy_batch_write_at: 60` 批次寫入支出。讓[錯誤記錄不寫入資料庫](./prod.md#keep-error-logs-out-of-the-database)，並設定[支出記錄保留期](./spend_logs_deletion.md)。若您不需要在 UI 中查看每個請求的資料列，請設定 `disable_spend_logs: True`，並將成本資料保留在您的記錄整合中。僅在需要提示歷史時才啟用 `store_prompts_in_spend_logs`，因為它也會增加閘道的記憶體用量。

## 監控要點 {#what-to-monitor}

請監控連線數相對於 `max_connections` 的使用情形、寫入延遲、鎖定等待與儲存增長。檢查 `litellm_in_memory_spend_update_queue_size` 與 `litellm_redis_spend_update_queue_size` 以了解排隊中的支出更新。使用 `litellm_pod_lock_manager_size` 檢查交易緩衝區排清鎖定。
