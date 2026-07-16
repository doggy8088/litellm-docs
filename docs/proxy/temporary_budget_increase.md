# ✨ 暫時增加預算 {#-temporary-budget-increase}

為 LiteLLM Virtual Key 設定暫時增加的預算。如果您被要求暫時提高某個 key 的預算，請使用此功能。

| 階層 | 支援 | 
|-----------|-----------|
| LiteLLM Virtual Key | ✅ |
| 使用者 | ❌ |
| 團隊 | ❌ |
| 組織 | ❌ |

:::note

✨ 暫時增加預算是 LiteLLM Enterprise 功能。

[Enterprise 定價](https://www.litellm.ai/#pricing)

[取得 7 天免費試用金鑰](https://www.litellm.ai/enterprise#trial)

:::

1. 使用預算建立 LiteLLM Virtual Key

```bash
curl -L -X POST 'http://localhost:4000/key/generate' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer LITELLM_MASTER_KEY' \
-d '{
    "max_budget": 0.0000001
}'
```

預期回應：

```json
{
    "key": "sk-your-new-key"
}
```

2. 以暫時增加的預算更新 key

```bash
curl -L -X POST 'http://localhost:4000/key/update' \
-H 'Authorization: Bearer LITELLM_MASTER_KEY' \
-H 'Content-Type: application/json' \
-d '{
    "key": "sk-your-new-key",
    "temp_budget_increase": 100, 
    "temp_budget_expiry": "2025-01-15"
}'
```

3. 測試它！ 

```bash
curl -L -X POST 'http://localhost:4000/chat/completions' \
-H 'Authorization: Bearer sk-your-new-key' \
-H 'Content-Type: application/json' \
-d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello, world!"}]
}'
```

預期回應標頭：

```
x-litellm-key-max-budget: 100.0000001
```
