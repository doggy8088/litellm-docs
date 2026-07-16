# 拒絕用戶端 metadata 標籤 {#reject-client-side-metadata-tags}

## 概覽 {#overview}

`reject_clientside_metadata_tags` 設定可讓您防止使用者在其 API 請求中傳遞用戶端 `metadata.tags`。這可確保標籤只會從 API 金鑰 metadata 繼承，且使用者無法覆寫這些標籤，以免可能影響預算追蹤或路由決策。

## 使用情境 {#use-case}

此功能在多租戶情境中特別有用，因為：
- 您希望根據 API 金鑰標籤強制執行嚴格的預算追蹤
- 您希望防止使用者透過傳送自訂的用戶端標籤來操控路由決策
- 您需要確保一致的基於標籤的篩選與報表

## 設定 {#configuration}

將以下內容加入您的 `config.yaml`：

```yaml
general_settings:
  reject_clientside_metadata_tags: true  # Default is false/null
```

## 行為 {#behavior}

### 當 `reject_clientside_metadata_tags: true` {#when-reject_clientside_metadata_tags-true}

**被拒絕的請求範例：**
```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {
      "tags": ["custom-tag"]  # This will be rejected
    }
  }'
```

**錯誤回應：**
```json
{
  "error": {
    "message": "Client-side 'metadata.tags' not allowed in request. 'reject_clientside_metadata_tags'=True. Tags can only be set via API key metadata.",
    "type": "bad_request_error",
    "param": "metadata.tags",
    "code": 400
  }
}
```

**允許的請求範例：**
```bash
curl -X POST http://localhost:4000/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "metadata": {
      "custom_field": "value"  # Other metadata fields are allowed
    }
  }'
```

### 當 `reject_clientside_metadata_tags: false` 或未設定 {#when-reject_clientside_metadata_tags-false-or-not-set}

所有請求都允許，包括帶有用戶端 `metadata.tags` 的請求。

## 透過 API 金鑰設定標籤 {#setting-tags-via-api-key}

當 `reject_clientside_metadata_tags` 已啟用時，應將標籤設定在 API 金鑰 metadata 上：

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer sk-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "tags": ["team-a", "production"]
    }
  }'
```

這些標籤會自動由使用該 API 金鑰的所有請求繼承。

## 完整範例設定 {#complete-example-configuration}

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

general_settings:
  master_key: sk-1234
  database_url: "postgresql://user:password@localhost:5432/litellm"
  
  # Reject client-side tags
  reject_clientside_metadata_tags: true
  
  # Optional: Also enforce user parameter
  enforce_user_param: true
```

## 相似功能 {#similar-features}

- `enforce_user_param` - 要求所有請求都必須包含 'user' 參數
- 基於標籤的路由 - 使用標籤進行智慧型請求路由
- 預算追蹤 - 依每個標籤追蹤支出

## 注意事項 {#notes}

- 此檢查僅適用於 LLM API 路由（例如，`/chat/completions`、`/embeddings`）
- 管理端點（例如，`/key/generate`）不受影響
- 此檢查會驗證請求本文中是否不存在用戶端 `metadata.tags`
- 其他 metadata 欄位仍可在請求中傳遞
- 在 API 金鑰上設定的標籤仍會套用至所有請求
