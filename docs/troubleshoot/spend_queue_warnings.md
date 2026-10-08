# 支出更新佇列已滿警告 {#spend-update-queue-full-warnings}

## 總覽 {#overview}

當內部支出追蹤佇列達到容量上限時，在高流量的 LiteLLM proxy 部署中會出現「Spend update queue is full」警告。這是一種保護機制，用於防止流量尖峰期間發生記憶體問題。

## 警告訊息 {#warning-message}

```
LiteLLM Proxy:WARNING: spend_update_queue.py - Spend update queue is full. Aggregating all entries in queue to concatenate entries.
```

## 根本原因 {#root-cause}

支出更新佇列是記憶體中的 `asyncio.Queue`，上限為 `LITELLM_ASYNCIO_QUEUE_MAXSIZE` 個項目（預設為 `1000`）。當佇列達到 `MAX_SIZE_IN_MEMORY_QUEUE` 個項目時，會更早觸發彙總，這預設為 `LITELLM_ASYNCIO_QUEUE_MAXSIZE` 的 80%（使用預設值時為 `800`）。當達到此閾值時：

1. 新的支出追蹤項目會被彙總，而不是逐一排入佇列
2. 這可避免記憶體耗盡，但可能會稍微延遲支出更新
3. 這個警告表示您的部署處理請求的速度快於資料庫可處理支出更新的速度

## 解決方案 {#solutions}

### 1. 增加佇列大小 {#1-increase-queue-size}

提高 `LITELLM_ASYNCIO_QUEUE_MAXSIZE`，這會設定實際的佇列容量。`MAX_SIZE_IN_MEMORY_QUEUE` 會以 80% 跟隨它，除非您明確設定；在那種情況下，請將其保持低於 `LITELLM_ASYNCIO_QUEUE_MAXSIZE`：

```bash
LITELLM_ASYNCIO_QUEUE_MAXSIZE=62500
MAX_SIZE_IN_MEMORY_QUEUE=50000  # optional, defaults to 80% of LITELLM_ASYNCIO_QUEUE_MAXSIZE
```

僅提高 `MAX_SIZE_IN_MEMORY_QUEUE` 不會擴大佇列。如果它大於或等於 `LITELLM_ASYNCIO_QUEUE_MAXSIZE`，proxy 會在啟動時記錄 `Misconfigured queue thresholds`，彙總永遠不會執行，且當佇列持有 `LITELLM_ASYNCIO_QUEUE_MAXSIZE` 個項目時，支出更新會被阻擋

`LITELLM_ASYNCIO_QUEUE_MAXSIZE` 也會限制其他支出更新佇列（每日與窗口支出）以及 GCS bucket 記錄佇列，因此提高它也會提高它們的容量

**取捨：**
較大的佇列會在記憶體中儲存更多項目 - 大型佇列至少配置 8GB RAM
- 建議用於具有持續高流量的部署

### 2. 水平擴展 {#2-horizontal-scaling}

部署多個具有負載平衡的 proxy 執行個體。這會將支出追蹤負載分散到多個佇列上，減少任何單一執行個體的支出更新佇列壓力。

## 相關設定 {#related-configuration}

```yaml
# Environment variables
LITELLM_ASYNCIO_QUEUE_MAXSIZE: 1000  # Default queue capacity
MAX_SIZE_IN_MEMORY_QUEUE: 800        # Default aggregation threshold (80% of LITELLM_ASYNCIO_QUEUE_MAXSIZE)
```
