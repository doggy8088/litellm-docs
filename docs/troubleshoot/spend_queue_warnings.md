# 支出更新佇列已滿警告 {#spend-update-queue-full-warnings}

## 總覽 {#overview}

當內部支出追蹤佇列達到容量上限時，在高流量的 LiteLLM proxy 部署中會出現「Spend update queue is full」警告。這是一種保護機制，用於防止流量尖峰期間發生記憶體問題。

## 警告訊息 {#warning-message}

```
WARNING:litellm.proxy.db.db_transaction_queue.spend_update_queue:Spend update queue is full. Aggregating entries to prevent memory issues.
```

## 根本原因 {#root-cause}

支出更新佇列的預設最大大小為 10,000 個項目（`MAX_SIZE_IN_MEMORY_QUEUE=10000`）。當達到此限制時：

1. 新的支出追蹤項目會被彙總，而不是逐一排入佇列
2. 這可避免記憶體耗盡，但可能會稍微延遲支出更新
3. 這個警告表示您的部署處理請求的速度快於資料庫可處理支出更新的速度

## 解決方案 {#solutions}

### 1. 增加佇列大小 {#1-increase-queue-size}

將 `MAX_SIZE_IN_MEMORY_QUEUE` 環境變數設為更高的值：

```bash
MAX_SIZE_IN_MEMORY_QUEUE=50000
```

**取捨：**
較大的佇列會將更多項目儲存在記憶體中 - 對於大型佇列，至少配置 8GB RAM
- 建議用於具有穩定高流量的部署

### 2. 水平擴展 {#2-horizontal-scaling}

部署多個具有負載平衡的 proxy 執行個體。這會將支出追蹤負載分散到多個佇列上，減少任何單一執行個體的支出更新佇列壓力。

## 相關設定 {#related-configuration}

```yaml
# Environment variables
MAX_SIZE_IN_MEMORY_QUEUE: 10000  # Default queue size
```
