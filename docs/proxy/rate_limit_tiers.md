# ✨ 預算 / 限流層級 {#-budget--rate-limit-tiers}

定義具有速率限制的層級。將它們指派給金鑰。

使用這個來控管大量金鑰的存取與預算。

<EnterpriseFeature />

## 1. 建立預算 {#1-create-a-budget}

```bash
curl -L -X POST 'http://0.0.0.0:4000/budget/new' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "budget_id": "my-test-tier",
    "rpm_limit": 0
}'
```

## 2. 將預算指派給金鑰 {#2-assign-budget-to-a-key}

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H "Authorization: Bearer $LITELLM_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "budget_id": "my-test-tier"
}'
```

預期回應：

```json
{
    "key": "sk-...",
    "budget_id": "my-test-tier",
    "litellm_budget_table": {
        "budget_id": "my-test-tier",
        "rpm_limit": 0
    }
}
```

## 3. 檢查金鑰上是否已強制執行預算 {#3-check-if-budget-is-enforced-on-key}

```bash
# Authorization: 👈 KEY from step 2.
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-...' \
-d '{
    "model": "<REPLACE_WITH_MODEL_NAME_FROM_CONFIG.YAML>",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan"}
    ]
}'
```

## [API 參考](https://docs.litellm.ai/api-reference/#/budget%20management) {#api-reference}
