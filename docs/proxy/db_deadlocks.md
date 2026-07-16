import Image from '@theme/IdealImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 高可用性設定（解決 DB 死鎖） {#high-availability-setup-resolve-db-deadlocks}

:::tip 生產環境必備

此設定對於每秒處理 1000+ 請求的生產部署是**必需的**。若未設定 Redis，您可能會遇到 PostgreSQL 連線耗盡（`FATAL: sorry, too many clients already`）。

:::

請使用此設定來解決高流量下可能遇到的任何資料庫死鎖

## 問題的原因是什麼？ {#what-causes-the-problem}

LiteLLM 會將 `UPDATE` 與 `UPSERT` 查詢寫入資料庫。當使用 10+ 個 LiteLLM 執行個體時，這些查詢可能會造成死鎖，因為每個執行個體都可能同時嘗試更新相同的 `user_id`、`team_id`、`key` 等。 

## 高可用性設定如何解決問題 {#how-the-high-availability-setup-fixes-the-problem}
- 所有執行個體都會寫入 Redis 佇列，而不是資料庫。 
- 單一執行個體會取得資料庫鎖定，並將 Redis 佇列清空到資料庫。 

## 運作方式  {#how-it-works}

### 階段 1. 每個執行個體將更新寫入 redis {#stage-1-each-instance-writes-updates-to-redis}

每個執行個體都會彙總某個 key、使用者、團隊等的支出更新，並將更新寫入 Redis 佇列。 

<Image img={require('../../img/deadlock_fix_1.png')}  style={{ width: '900px', height: 'auto' }} />
<p style={{textAlign: 'left', color: '#666'}}>
每個執行個體都會將更新寫入 redis
</p>

### 階段 2. 單一執行個體將 Redis 佇列清空到資料庫 {#stage-2-a-single-instance-flushes-the-redis-queue-to-the-db}

單一執行個體會取得資料庫鎖定，並將 Redis 佇列中的所有元素清空到資料庫。 

- 1 個執行個體會嘗試取得資料庫更新工作的鎖定
- 鎖定狀態會儲存在 Redis 中
- 如果執行個體取得了寫入資料庫的鎖定
    - 它會從 Redis 讀取所有更新
    - 將所有更新彙整成 1 個交易
    - 將更新寫入資料庫
    - 釋放鎖定
- 注意：同一時間只有 1 個執行個體可以取得鎖定，這會限制同時能寫入資料庫的執行個體數量

<Image img={require('../../img/deadlock_fix_2.png')}  style={{ width: '900px', height: 'auto' }} />
<p style={{textAlign: 'left', color: '#666'}}>
單一執行個體將 Redis 佇列清空到資料庫
</p>

## 使用方式 {#usage}

### 必要元件 {#required-components}

- Redis
- Postgres

### 在 LiteLLM 設定中進行設定 {#setup-on-litellm-config}

您可以在您的 `proxy_config.yaml` 檔案的 `general_settings` 區段中設定 `use_redis_transaction_buffer: true` 來啟用 Redis 緩衝區。 

注意：此設定需要 litellm 連線到一個 redis 執行個體。 

```yaml showLineNumbers title="litellm proxy_config.yaml"
general_settings:
  use_redis_transaction_buffer: true

litellm_settings:
  cache: True
  cache_params:
    type: redis
    supported_call_types: [] # Optional: Set cache for proxy, but not on the actual llm api call
```

## 監控 {#monitoring}

LiteLLM 會發出以下 prometheus 指標，用於監控記憶體內緩衝區與 Redis 緩衝區的健康狀態。 

| 指標名稱                                         | 說明                                                                 | 儲存類型 |
|-----------------------------------------------------|-----------------------------------------------------------------------------|--------------|
| `litellm_pod_lock_manager_size`                     | 表示哪個 pod 持有寫入資料庫更新的鎖定。         | Redis    |
| `litellm_in_memory_daily_spend_update_queue_size`   | 記憶體內每日支出更新佇列中的項目數量。這些是每個使用者的彙總支出記錄。                 | 記憶體內    |
| `litellm_redis_daily_spend_update_queue_size`       | Redis 每日支出更新佇列中的項目數量。這些是每個使用者的彙總支出記錄。                    | Redis        |
| `litellm_in_memory_spend_update_queue_size`         | key、使用者、團隊、團隊成員等的記憶體內彙總支出值。| 記憶體內    |
| `litellm_redis_spend_update_queue_size`             | key、使用者、團隊等的 Redis 彙總支出值。                  | Redis        |

## 疑難排解：Redis 連線錯誤 {#troubleshooting-redis-connection-errors}

您可能會看到如下錯誤：

```
LiteLLM Redis Caching: async async_increment() - Got exception from REDIS No connection available., Writing value=21
LiteLLM Redis Caching: async set_cache_pipeline() - Got exception from REDIS No connection available., Writing value=None
```
 
這表示所有可用的 Redis 連線都已在使用中，而 LiteLLM 無法從連線池取得新的連線。這可能會在高負載或大量並發代理程式請求時發生。

**解決方案：**

- 在 `proxy_config.yaml` 中的 Redis 設定區段提高 `max_connections` 參數，以允許更多同時連線。例如：

```yaml
litellm_settings:
  cache: True
  cache_params:
    type: redis
    max_connections: 100  # Increase as needed for your traffic
```

請依據您預期的並發量與 Redis 伺服器容量調整此值。
