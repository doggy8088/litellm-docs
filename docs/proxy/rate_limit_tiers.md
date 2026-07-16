# ✨ 預算 / 限流層級 {#-budget--rate-limit-tiers}

定義具有速率限制的層級。將它們指派給金鑰。

使用這個來控管大量金鑰的存取與預算。

:::info 

這是 LiteLLM Enterprise 功能。

取得 7 天免費試用 + 與我們聯絡 [這裡](https://litellm.ai/#trial)。

查看價格 [這裡](https://litellm.ai/#pricing)。

:::

## 1. 建立預算 {#1-create-a-budget}

```bash
curl -L -X POST 'http://0.0.0.0:4000/budget/new' \
-H 'Authorization: Bearer sk-1234' \
-H 'Content-Type: application/json' \
-d '{
    "budget_id": "my-test-tier",
    "rpm_limit": 0
}'
```

## 2. 將預算指派給金鑰 {#2-assign-budget-to-a-key}

```bash
curl -L -X POST 'http://0.0.0.0:4000/key/generate' \
-H 'Authorization: Bearer sk-1234' \
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
curl -L -X POST 'http://0.0.0.0:4000/v1/chat/completions' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer sk-...' \ # 👈 KEY from step 2.
-d '{
    "model": "<REPLACE_WITH_MODEL_NAME_FROM_CONFIG.YAML>",
    "messages": [
      {"role": "user", "content": "hi my email is ishaan"}
    ]
}'
```


## [API 參考](https://litellm-api.up.railway.app/#/budget%20management) {#api-referencehttpslitellm-apiuprailwayappbudget20management}
