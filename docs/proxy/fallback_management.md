# [New] 備援管理端點 {#new-fallback-management-endpoints}

專門用於將模型備援與一般組態分開管理的端點。

## 概覽 {#overview}

這些端點可讓您設定、擷取與刪除備援模型，而不需修改整個代理伺服器組態。相較於使用 `/config/update` 端點，這提供了更乾淨且更安全的備援管理方式。

## 前置條件 {#prerequisites}

- 必須啟用資料庫儲存：請在您的環境中設定 `STORE_MODEL_IN_DB=True`
- 在設定備援之前，模型必須已存在於路由器中

## 端點 {#endpoints}

### POST /fallback {#post-fallback}

為特定模型建立或更新備援。

**請求本文：**
```json
{
  "model": "{{openai_small}}",
  "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
  "fallback_type": "general"
}
```

**參數：**
- `model`（string，必填）：要為其設定備援的主要模型名稱
- `fallback_models`（string 陣列，必填）：依優先順序排列的備援模型名稱清單
- `fallback_type`（string，選填）：備援類型。選項：
  - `"general"`（預設）：適用於任何錯誤的標準備援
  - `"context_window"`：適用於超出內容視窗錯誤的備援
  - `"content_policy"`：適用於內容政策違規的備援

**回應：**
```json
{
  "model": "{{openai_small}}",
  "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
  "fallback_type": "general",
  "message": "Fallback configuration created successfully"
}
```

**使用 cURL 的範例：**
```bash
curl -X POST "http://localhost:4000/fallback" \
  -H "Authorization: Bearer $LITELLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{openai_small}}",
    "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
    "fallback_type": "general"
  }'
```

**使用 Python 的範例：**
```python
import requests

response = requests.post(
    "http://localhost:4000/fallback",
    headers={
        "Authorization": "Bearer sk-<your-litellm-api-key>",
        "Content-Type": "application/json"
    },
    json={
        "model": "{{openai_small}}",
        "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
        "fallback_type": "general"
    }
)

print(response.json())
```

### GET /fallback/\{model\} {#get-fallbackmodel}

取得特定模型的備援組態。

**參數：**
- `model`（path parameter，必填）：要取得備援的模型名稱
- `fallback_type`（query parameter，選填）：要擷取的備援類型（預設："general"）

**回應：**
```json
{
  "model": "{{openai_small}}",
  "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
  "fallback_type": "general"
}
```

**使用 cURL 的範例：**
```bash
curl -X GET "http://localhost:4000/fallback/{{openai_small}}?fallback_type=general" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**使用 Python 的範例：**
```python
import requests

response = requests.get(
    "http://localhost:4000/fallback/{{openai_small}}",
    headers={"Authorization": "Bearer sk-<your-litellm-api-key>"},
    params={"fallback_type": "general"}
)

print(response.json())
```

### DELETE /fallback/\{model\} {#delete-fallbackmodel}

刪除特定模型的備援組態。

**參數：**
- `model`（path parameter，必填）：要刪除備援的模型名稱
- `fallback_type`（query parameter，選填）：要刪除的備援類型（預設："general"）

**回應：**
```json
{
  "model": "{{openai_small}}",
  "fallback_type": "general",
  "message": "Fallback configuration deleted successfully"
}
```

**使用 cURL 的範例：**
```bash
curl -X DELETE "http://localhost:4000/fallback/{{openai_small}}?fallback_type=general" \
  -H "Authorization: Bearer $LITELLM_API_KEY"
```

**使用 Python 的範例：**
```python
import requests

response = requests.delete(
    "http://localhost:4000/fallback/{{openai_small}}",
    headers={"Authorization": "Bearer sk-<your-litellm-api-key>"},
    params={"fallback_type": "general"}
)

print(response.json())
```

### 測試備援 {#test-fallback}

:::warning[已棄用於 Proxy 請求]
自 LiteLLM Proxy v1.85.0 起，`mock_testing_fallbacks` 會從傳入的 Proxy 請求中被移除，且不會產生任何效果。它目前僅支援在測試中對直接的 `litellm.Router` 呼叫。
:::

若要透過 Proxy 驗證備援，請在非正式環境中讓主要部署無法使用，然後送出一般請求：

```bash
curl -X POST 'http://0.0.0.0:4000/chat/completions' \
-H 'Content-Type: application/json' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-d '{
  "model": "{{openai_small}}",
  "messages": [
    {
      "role": "user",
      "content": "ping"
    }
  ]
}
'
```

## 驗證 {#validation}

這些端點會執行以下驗證：

1. **模型存在性**：驗證主要模型是否存在於路由器中
2. **備援模型存在性**：確保所有備援模型都存在於路由器中
3. **不可自我備援**：防止模型成為自己的備援
4. **不得重複**：確保備援清單中沒有重複的模型
5. **已啟用資料庫**：需要設定 `STORE_MODEL_IN_DB=True`

## 錯誤回應 {#error-responses}

### 400 錯誤的請求 {#400-bad-request}
```json
{
  "detail": {
    "error": "Invalid fallback models: ['non-existent-model']",
    "available_models": ["{{openai_small}}", "{{openai_large}}", "{{anthropic}}"]
  }
}
```

### 404 找不到 {#404-not-found}
```json
{
  "detail": {
    "error": "Model '{{openai_small}}' not found in router",
    "available_models": ["{{openai_large}}", "{{anthropic}}"]
  }
}
```

### 500 內部伺服器錯誤 {#500-internal-server-error}
```json
{
  "detail": {
    "error": "Router not initialized"
  }
}
```

## 備援類型說明 {#fallback-types-explained}

### 一般備援 {#general-fallbacks}
用於模型呼叫期間發生的任何類型錯誤。這是最常見的備援類型。

**使用情境：** 當模型無法使用、受到速率限制，或回傳錯誤時。

```json
{
  "model": "{{openai_small}}",
  "fallback_models": ["{{openai_large}}", "{{anthropic}}"],
  "fallback_type": "general"
}
```

### 內容視窗備援 {#context-window-fallbacks}
當發生超出內容視窗錯誤時會特別觸發。

**使用情境：**當輸入對主要模型來說過長時，備援到具有更大上下文視窗的模型。以下 ids 僅供說明，並保留其上下文視窗大小。

```json keep-model-ids
{
  "model": "gpt-3.5-turbo",
  "fallback_models": ["gpt-4-32k", "claude-3-opus"],
  "fallback_type": "context_window"
}
```

### 內容政策備援 {#content-policy-fallbacks}
當發生內容政策違規時會特別觸發。

**使用情境：** 當主要模型因安全篩選而拒絕內容時，備援到具有不同內容政策的模型。

```json
{
  "model": "{{openai_large}}",
  "fallback_models": ["{{anthropic}}"],
  "fallback_type": "content_policy"
}
```

## 相較於 /config/update 的優點 {#benefits-over-configupdate}

1. **安全性**：只會修改備援設定，不會意外變更其他設定
2. **簡潔性**：專注的 API，驗證訊息清楚
3. **細粒度**：可依模型與類型管理備援
4. **驗證**：在套用前檢查設定是否有效
5. **清晰性**：錯誤訊息清楚，並列出可用模型

## 注意事項 {#notes}

- 備援會在已設定的重試次數失敗後觸發
- 備援會依據 `fallback_models` 中指定的順序嘗試
- 嘗試的備援最大數量由路由器的 `max_fallbacks` 設定控制
- 變更會立即生效並持久化到資料庫

## 預算備援 {#budget-fallbacks}

- [預算備援](./budget_fallbacks)：當每個金鑰的 `model_max_budget` 超出時，將請求重新路由到其他模型，而不是回傳 `budget_exceeded`。
