import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 預算備援 {#budget-fallbacks}

:::info

自 `v1.92.x` 起可用。

:::

當金鑰的 [`model_max_budget`](./users#-virtual-key-model-specific) 超過時，將請求重新導向到備援模型，而不是回傳 `budget_exceeded` 錯誤。

預設情況下，`model_max_budget` 會在金鑰對某個模型的支出超過上限後封鎖請求。`budget_fallbacks` 讓您可直接在金鑰上為每個模型設定備援鏈，因此請求會悄悄重新導向到第一個仍有預算的備援。支出會歸屬於備援模型，而不是已耗盡的模型。

這是虛擬金鑰設定；不需要對 `config.yaml` 或路由器層級的備援做任何變更。

## 何時觸發 {#when-it-triggers}

當下列條件皆成立時，會套用備援：

金鑰已為所請求的模型設定 `model_max_budget`，且該模型的累積支出已超過其 `budget_limit`。金鑰也在所請求的模型上於 `budget_fallbacks` 中有一筆項目。會選擇鏈中第一個本身仍在預算內的備援（因為它沒有 `model_max_budget` 項目，或其上限尚未達到）；如果每個備援都超出預算，則會拋出原始的 `BudgetExceededError`。

路由器層級的備援（`fallbacks: [{model: [...]}]` 中的 `config.yaml`）不受影響，並且會在下游提供者錯誤時繼續運作。`budget_fallbacks` 僅適用於驗證層中的每個金鑰 `model_max_budget` 檢查。

## 快速開始 {#quick-start}

### 1. 建立一個具有每模型預算與備援鏈的金鑰 {#1-generate-a-key-with-a-per-model-budget-and-a-fallback-chain}

```bash
curl 'http://0.0.0.0:4000/key/generate' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{
    "model_max_budget": {
      "anthropic-haiku-4-5": {"budget_limit": 0.01, "time_period": "1d"}
    },
    "budget_fallbacks": {
      "anthropic-haiku-4-5": ["gpt-5.5"]
    }
  }'
```

`budget_fallbacks` 是一個以主要模型名稱為鍵的 `Dict[str, List[str]]`。其值是該模型的有序備援鏈。

### 2. 傳送請求 {#2-send-a-request}

照常將用戶端指向主要模型：

```bash
curl 'http://0.0.0.0:4000/v1/chat/completions' \
  --header 'Authorization: Bearer <sk-generated-key>' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "anthropic-haiku-4-5",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

只要金鑰仍在其 `anthropic-haiku-4-5` 上限之下，請求就會在 `anthropic-haiku-4-5` 上執行。一旦超過上限，後續請求就會透明地由 `gpt-5.5` 提供服務，而不會向呼叫端顯示任何 `budget_exceeded` 錯誤。

### 3. 確認重新導向 {#3-confirm-the-reroute}

`/spend/logs?api_key=<sk-generated-key>` 會將備援後的用量歸屬於 `gpt-5.5`（包括部署與 `model_group`），因此成本追蹤、標記與每模型預算仍可保持準確。

## 串聯備援 {#chained-fallbacks}

清單中的每個項目都會依序嘗試；第一個仍在自身 `model_max_budget` 內的備援會勝出。這表示您可以定義一條分層鏈，依序降級到越來越便宜或上限更高的模型：

```bash
curl 'http://0.0.0.0:4000/key/generate' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{
    "model_max_budget": {
      "gpt-5":         {"budget_limit": 5.0,  "time_period": "1d"},
      "gpt-5-mini":    {"budget_limit": 2.0,  "time_period": "1d"},
      "gpt-5-nano":    {"budget_limit": 1.0,  "time_period": "1d"}
    },
    "budget_fallbacks": {
      "gpt-5": ["gpt-5-mini", "gpt-5-nano"]
    }
  }'
```

對 `gpt-5` 的請求會停留在 `gpt-5`，直到它用完每日 $5，接著切換到 `gpt-5-mini`，直到該金鑰達到每日 $2，再切換到 `gpt-5-nano`。如果 `gpt-5-nano` 也超過其每日 $1 上限，請求最後會回傳 `budget_exceeded`。

在 `model_max_budget` 中不存在的備援，會從預算檢查的角度被視為無上限，且只要到達就一定會被選取。

## 更新既有金鑰 {#updating-an-existing-key}

使用 `/key/update` 來變更備援鏈，而不必重新產生金鑰：

```bash
curl 'http://0.0.0.0:4000/key/update' \
  --header 'Authorization: Bearer sk-1234' \
  --header 'Content-Type: application/json' \
  --data '{
    "key": "sk-generated-key",
    "budget_fallbacks": {"anthropic-haiku-4-5": ["gpt-5.5", "gpt-5-nano"]}
  }'
```

## 相關 {#related}

[虛擬金鑰 model_max_budget](./users#-virtual-key-model-specific)、[備援管理端點](./fallback_management)、[可靠性與備援](./reliability)。
