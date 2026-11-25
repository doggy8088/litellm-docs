# eu/jev {#eujev}

<SinceVersion v="1.109.0" />

[eu/jev](https://eu-jev.com/docs) 決策 API 的透傳端點。eu/jev 代管於歐盟，並在位於德國的伺服器上執行 System One 推論，提示與回應會在該處處理且不被儲存，因此您送出的資料會留在德國。它回傳的是有型別的決策（選項、分數，或是是否的機率），而不是文字，且它接受與 [TypeSafe](../decisions.md#v1systemone) 相同的 System One 請求 body。

| 功能 | 支援 | 備註 |
|-------|-------|-------|
| 成本追蹤 | ✅ | 根據回應 `usage` 與模型註冊表定價 |
| 記錄 | ✅ | 可跨所有整合運作 |
| 終端使用者追蹤 | ❌ | [如果您需要這個功能，請告訴我們](https://github.com/BerriAI/litellm/issues/new) |
| 串流 | ❌ | eu/jev API 不提供 |

只要將 `https://eu-jev.com` 替換為 `LITELLM_PROXY_BASE_URL/eu_jev`。只有 `POST /eu_jev/v1/systemone` 會被轉送，其他 eu/jev 路徑會回應 404。

LiteLLM 會從代理環境中加入 eu/jev API 金鑰，因此用戶端只需要一個 LiteLLM 虛擬金鑰。若未設定 eu/jev 金鑰，該路由會回應 503。透傳的 `custom_body` 欄位會被以 400 拒絕，因此 eu/jev 永遠會收到虛擬金鑰受檢時的那份 body。

## 快速開始 {#quick-start}

1. 在 proxy 環境中設定 eu/jev API 金鑰。

```bash showLineNumbers
export EU_JEV_API_KEY=""
# optional, defaults to https://eu-jev.com
export EU_JEV_API_BASE="https://eu-jev.com"
```

2. 啟動 proxy。

```bash showLineNumbers
litellm

# RUNNING on http://0.0.0.0:4000
```

3. 透過 proxy 向 eu/jev 提出問題。

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/eu_jev/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "eu-jeff-latest",
  "state": "I was charged twice. Can I get a refund?",
  "questions": {
    "team": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoices, and refunds",
        "support": "Technical issues and bugs"
      }
    }
  }
}'
```

回應是 eu/jev 原生、未經變更的內容：

```json
{
  "model": "eu-jeff-1.0.0",
  "answers": {
    "team": {
      "type": "choice",
      "choice": "billing",
      "confidence": 0.9,
      "probabilities": {"billing": 0.95, "support": 0.05}
    }
  },
  "usage": {"input_tokens": 64, "output_tokens": 0},
  "meta": {
    "request_id": "8febf2e9-1643-4446-a7cf-7fc3bcf2b391",
    "mode": "live",
    "latency_ms": 180,
    "cost_eur": "0.000002368"
  }
}
```

一個請求帶有一個 `state`，可以是最多 100,000 個字元的字串，或是 JSON 物件或陣列，以及一到八個具名的 `questions`。每個問題可以是 2 到 64 個選項之間的 `choice`、回傳答案為「是」的機率的 `noul`，或是在 2 到 10 個有序層級上的 `score`。`eu-jeff-latest` 會跟隨目前的發行版本，而 `eu-jeff-1.0.0` 則將其釘選。[請參閱 eu/jev API 參考文件](https://eu-jev.com/docs)。

## 虛擬金鑰與速率限制 {#virtual-keys-and-rate-limits}

虛擬金鑰需要有 `eu_jev/<model>` 的存取權，例如 `eu_jev/eu-jeff-latest` 或 `eu_jev/*`。沒有 `model` 的請求，以及舊名稱 `jeff-latest` 與 `jeff-1.0.0`，都會計為 `eu_jev/eu-jeff-latest`。金鑰上的 `model_rpm_limit` 會套用到同一個名稱。

若金鑰只列出像 `eu-jev` 這樣的代理模型名稱，或其存取群組不含 `eu_jev/eu-jeff-latest`，它在 `/eu_jev/v1/systemone` 上會收到 403。請同時給予它 `eu_jev/eu-jeff-latest`，或如下方所示，透過 `/v1/systemone` 呼叫代理模型。

## Config 與管理介面模型 {#config-and-admin-ui-models}

eu/jev 同時也是一個 [decisions](../decisions.md) 提供者，因此來自 config 或管理介面 Add Model 分頁的模型，會在 `POST /v1/systemone` 上回應，並以 OpenAI 格式在 `POST /v1/decisions` 上回應。

```yaml showLineNumbers
model_list:
  - model_name: eu-jev
    litellm_params:
      model: eu_jev/eu-jeff-latest
      api_key: os.environ/EU_JEV_API_KEY
```

```bash showLineNumbers
curl -X POST 'http://0.0.0.0:4000/v1/systemone' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
  "model": "eu-jev",
  "state": "I was charged twice. Can I get a refund?",
  "questions": {
    "team": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoices, and refunds",
        "support": "Technical issues and bugs"
      }
    }
  }
}'
```

當一個全代理範圍的模型（不是為團隊新增的模型）也設定了 `use_in_pass_through: true` 時，`/eu_jev/v1/systemone` 會使用它的 `api_key`，以及有設定時的 `api_base`，而不是 `EU_JEV_API_KEY` 與 `EU_JEV_API_BASE`。團隊的模型永遠不會提供這些值。

## 成本追蹤 {#cost-tracking}

支出會使用回應中的 `usage.input_tokens` 與 `usage.output_tokens`，以及 LiteLLM 模型註冊表中的 `eu_jev/<model>` 項目（`eu-jeff-1.0.0`、`eu-jeff-latest`）。eu/jev 只對輸入 token 計費，因此輸出 token 免費。請求會以 eu/jev 回報的版本化模型記錄，例如 `eu_jev/eu-jeff-1.0.0`，即使該請求使用的是 `eu-jeff-latest` 別名。

LiteLLM 會依註冊表價格記入支出。回應中的 `meta.cost_eur` 是 eu/jev 自己以歐元計的費用，會原樣透傳。
