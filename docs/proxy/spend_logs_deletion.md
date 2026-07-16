# ✨ Spend Logs 的最大保留期限 {#-maximum-retention-period-for-spend-logs}

這會說明如何設定 spend logs 的最大保留期限。這有助於透過自動刪除舊記錄來管理資料庫大小。

:::info

✨ 這適用於 LiteLLM Enterprise

[Enterprise 定價](https://www.litellm.ai/#pricing)

[取得免費 7 天試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

### 需求 {#requirements}

- **Postgres**（用於記錄儲存）
- **Redis** *(選用)* — 只有在您執行多個 proxy instance 並希望啟用分散式鎖定時才需要

## 用法 {#usage}

### 設定 {#setup}

將以下內容加入您的 `proxy_config.yaml` 中的 `general_settings`：

```yaml title="proxy_config.yaml"
general_settings:
  maximum_spend_logs_retention_period: "7d"  # Keep logs for 7 days

  # Optional: set how frequently cleanup should run - default is daily
  maximum_spend_logs_retention_interval: "1d"  # Run cleanup daily

  # Optional: set exact time for cleanup (Cron syntax)
  maximum_spend_logs_cleanup_cron: "0 4 * * *" # Run at 04:00 AM daily

litellm_settings:
  cache: true
  cache_params:
    type: redis
```

### 設定選項 {#configuration-options}

#### `maximum_spend_logs_retention_period`（必填） {#maximum_spend_logs_retention_period-required}

記錄在刪除前應保留多久。支援的格式：

- `"7d"` – 7 天
- `"24h"` – 24 小時
- `"60m"` – 60 分鐘
- `"3600s"` – 3600 秒

#### `maximum_spend_logs_retention_interval`（選填） {#maximum_spend_logs_retention_interval-optional}

清理工作應多久執行一次。使用與上述相同的格式。若未設定，且只有在 `maximum_spend_logs_retention_period` 有設定時，清理將每 24 小時執行一次。

#### `maximum_spend_logs_cleanup_cron`（選填） {#maximum_spend_logs_cleanup_cron-optional}

使用標準 cron 語法排程清理。這會優先於 `maximum_spend_logs_retention_interval`。

範例：
- `"0 4 * * *"` – 每日早上 04:00 執行
- `"0 0 * * 0"` – 每週日午夜執行
- `"*/30 * * * *"` – 每 30 分鐘執行一次

## 運作方式 {#how-it-works}

### 步驟 1. 取得鎖定（使用 Redis 為選用） {#step-1-lock-acquisition-optional-with-redis}

如果啟用 Redis，LiteLLM 會使用它來確保一次只有一個 instance 執行清理。

- 如果取得鎖定：
  - 此 instance 會繼續清理
  - 其他 instance 會略過
- 如果沒有鎖定：
  - 清理仍會執行（適用於單一節點設定）

![Spend log 刪除的運作方式](../../img/spend_log_deletion_working.png)  
*Spend log 刪除的運作方式*

### 步驟 2. 批次刪除 {#step-2-batch-deletion}

一旦清理開始：

- 會使用已設定的保留期限計算截止日期
- 以批次刪除早於截止日期的記錄（預設大小 `1000`）
- 在批次之間加入短暫延遲，以避免資料庫過載

### 預設設定： {#default-settings}
- **批次大小**：1000 筆記錄（可透過 `SPEND_LOG_CLEANUP_BATCH_SIZE` 設定）
- **每次執行的最大批次數**：500
- **每次執行的最大刪除數**：500,000 筆記錄

您可以使用環境變數變更清理參數：

```bash
SPEND_LOG_RUN_LOOPS=200
# optional: change batch size from the default 1000
SPEND_LOG_CLEANUP_BATCH_SIZE=2000
```

這將允許在一次執行中最多刪除 200,000 筆記錄。

![舊記錄的批次刪除](../../img/spend_log_deletion_multi_pod.jpg)  
*舊記錄的批次刪除*

## 高流量部署的分區 {#partitioning-for-high-volume-deployments}

在高請求量（每天數百萬列）的情況下，透過 `DELETE` 進行保留會變成問題。刪除列不會將磁碟空間還給作業系統；它會留下 dead tuples（「tombstones」），之後必須由 autovacuum 回收。當寫入速度超過 autovacuum 時，即使邏輯列數有上限，資料表在磁碟上的大小仍會持續成長，而 `LiteLLM_SpendLogs` 一個月內就可能達到數百 GB。

解法是在 `startTime` 上使用原生 Postgres 範圍分區。有了分區資料表，保留會透過 `DROP TABLE` 丟棄整個分區，這是即時的中繼資料操作，可立即釋放磁碟，不會有 tombstones，也不需要 vacuum。當 LiteLLM 偵測到 `LiteLLM_SpendLogs` 已分區時，相同的清理工作會自動從批次刪除切換為刪除過期分區，並且會在每次執行時預先建立即將到來的分區，讓寫入總是有可落地的分區。

這是選擇性啟用。預設 schema 不會分區，因此現有部署不會受到影響，直到您將資料表轉換為止。

### 轉換資料表 {#converting-the-table}

無法直接對已填充的資料表進行分區，因此轉換會先將現有資料表改名移開，然後建立新的分區資料表。分區鍵必須是主鍵的一部分，因此主鍵會變成複合 `("request_id", "startTime")`；LiteLLM 的 spend-log 寫入路徑使用 `INSERT ... ON CONFLICT DO NOTHING`，這與此相容。

在您的資料庫上執行 [`db_scripts/partition_spend_logs.sql`](https://github.com/BerriAI/litellm/blob/main/db_scripts/partition_spend_logs.sql) 中的 runbook（請先在 staging 副本上測試並先備份）。它會建立分區 parent、複合主鍵、`startTime` 索引，以及一個 `DEFAULT` 分區，作為任何超出範圍列的安全網。

轉換完成後，請如上所示設定保留期限，清理工作就會替您管理分區。

### 調校 {#tuning}

| 環境變數 | 預設值 | 說明 |
| --- | --- | --- |
| `SPEND_LOG_PARTITION_INTERVAL` | `day` | 分區粒度：`day`、`week` 或 `month`。高流量資料表請使用 `day`，以便精確保留且單一分區維持可管理。 |
| `SPEND_LOG_PARTITION_PRECREATE_AHEAD` | `7` | 每次清理執行要預先建立多少個未來分區。 |

只有在整個時間範圍都早於保留截止點時，分區才會被刪除，因此實際保留時間會向上取整到分區粒度。
