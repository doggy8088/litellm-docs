# [已棄用] 基於區域的路由 {#deprecated-region-based-routing}

:::info

此功能已棄用，請改用 [基於標籤的路由](./tag_routing.md)

:::

將特定客戶路由到僅限 eu 的模型。

透過為客戶指定 'allowed_model_region'，LiteLLM 會過濾掉模型群組中不在允許區域（例如 'eu'）內的任何模型。

[**查看程式碼**](https://github.com/BerriAI/litellm/blob/5eb12e30cc5faa73799ebc7e48fc86ebf449c879/litellm/router.py#L2938)

### 1. 建立具有區域指定的客戶 {#1-create-customer-with-region-specification}

請為此使用 litellm 的 'end-user' 物件。 

可透過在 OpenAI chat completion/embedding 請求中將 'user' 參數傳遞給 litellm 來追蹤／識別終端使用者。

```bash
curl -X POST --location 'http://0.0.0.0:4000/end_user/new' \
--header 'Authorization: Bearer sk-1234' \
--header 'Content-Type: application/json' \
--data '{
    "user_id" : "ishaan-jaff-45",
    "allowed_model_region": "eu", # 👈 SPECIFY ALLOWED REGION='eu'
}'
```

### 2. 將 eu 模型加入模型群組  {#2-add-eu-models-to-model-group}

將 eu 模型加入模型群組。使用 'region_name' 參數指定每個模型的區域。

支援的區域為 'eu' 和 'us'。

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/gpt-35-turbo # 👈 EU azure model
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: os.environ/AZURE_EUROPE_API_KEY
      region_name: "eu"
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: azure/chatgpt-v-2
      api_base: https://openai-gpt-4-test-v-1.openai.azure.com/
      api_version: "2023-05-15"
      api_key: os.environ/AZURE_API_KEY
      region_name: "us"

router_settings:
  enable_pre_call_checks: true # 👈 IMPORTANT
```

啟動 proxy

```yaml
litellm --config /path/to/config.yaml
```

### 3. 測試它！ {#3-test-it}

對 proxy 發出一個簡單的 chat completions 請求。在回應標頭中，您應該會看到傳回的 api base。 

```bash
curl -X POST --location 'http://localhost:4000/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-1234' \
--data '{
    "model": "gpt-3.5-turbo", 
    "messages": [
        {
        "role": "user",
        "content": "what is the meaning of the universe? 1234"
    }],
    "user": "ishaan-jaff-45" # 👈 USER ID
}
'
```

回應標頭中的預期 API Base 

```
x-litellm-api-base: "https://my-endpoint-europe-berri-992.openai.azure.com/"
x-litellm-model-region: "eu" # 👈 CONFIRMS REGION-BASED ROUTING WORKED
```

### 常見問題  {#faq}

**如果該區域沒有可用模型，會發生什麼事？**

由於路由器會過濾掉不在指定區域內的模型，如果該區域沒有任何可用模型，它會將錯誤回傳給使用者。
