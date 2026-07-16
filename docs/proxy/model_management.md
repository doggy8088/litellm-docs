import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 模型管理 {#model-management}
新增模型 + 不重新啟動 proxy 即可取得模型資訊。

## 在 Config.yaml  {#in-configyaml}

```yaml
model_list:
  - model_name: text-davinci-003
    litellm_params: 
      model: "text-completion-openai/text-davinci-003"
    model_info: 
      metadata: "here's additional metadata on the model" # returned via GET /model/info
```

## 取得模型資訊 - `/model/info` {#get-model-information---modelinfo}

取得 `/model/info` 端點中列出的每個模型的詳細資訊，包括來自 `config.yaml` 檔案的說明，以及從您設定的 model_info 和 [litellm model cost map](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) 擷取的其他模型資訊（例如最大 token 數、每個輸入 token 的成本等）。基於安全考量，API 金鑰等敏感細節會被排除。

:::tip 同步模型資料
透過[從 GitHub 同步模型](sync_models_github.md)來保持模型定價資料為最新。
:::

<Tabs
  defaultValue="curl"
  values={[
    { label: 'cURL', value: 'curl', },
  ]}>
  <TabItem value="curl">

```bash
curl -X GET "http://0.0.0.0:4000/model/info" \
     -H "accept: application/json" \
```
  </TabItem>
</Tabs>

## 新增模型 {#add-a-new-model}

透過 `/model/new` API 將新模型加入 proxy，以便在不重新啟動 proxy 的情況下新增模型。

<Tabs>
<TabItem value="API">

```bash
curl -X POST "http://0.0.0.0:4000/model/new" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -d '{ "model_name": "azure-gpt-turbo", "litellm_params": {"model": "azure/gpt-3.5-turbo", "api_key": "os.environ/AZURE_API_KEY", "api_base": "my-azure-api-base"} }'
```
</TabItem>
<TabItem value="Yaml">

```yaml
model_list:
  - model_name: gpt-3.5-turbo ### RECEIVED MODEL NAME ### `openai.chat.completions.create(model="gpt-3.5-turbo",...)`
    litellm_params: # all params accepted by litellm.completion() - https://github.com/BerriAI/litellm/blob/9b46ec05b02d36d6e4fb5c32321e51e7f56e4a6e/litellm/types/router.py#L297
      model: azure/gpt-turbo-small-eu ### MODEL NAME sent to `litellm.completion()` ###
      api_base: https://my-endpoint-europe-berri-992.openai.azure.com/
      api_key: "os.environ/AZURE_API_KEY_EU" # does os.getenv("AZURE_API_KEY_EU")
      rpm: 6      # [OPTIONAL] Rate limit for this deployment: in requests per minute (rpm)
    model_info: 
      my_custom_key: my_custom_value # additional model metadata
```

</TabItem>
</Tabs>

### 模型參數結構 {#model-parameters-structure}

新增模型時，您的 JSON payload 應符合下列結構：

- `model_name`：新模型的名稱（必填）。
- `litellm_params`：包含 Litellm 設定專用參數的字典（必填）。
- `model_info`：提供模型額外資訊的選用字典。

以下是如何構造您的 `ModelParams` 的範例：

```json
{
  "model_name": "my_awesome_model",
  "litellm_params": {
    "some_parameter": "some_value",
    "another_parameter": "another_value"
  },
  "model_info": {
    "author": "Your Name",
    "version": "1.0",
    "description": "A brief description of the model."
  }
}
```
---

請留意，由於這兩個端點都處於 [BETA]，您可能需要前往 API 說明中連結的相關 GitHub issues 以查看更新或提供意見：

- 取得模型資訊：[Issue #933](https://github.com/BerriAI/litellm/issues/933)
- 新增模型：[Issue #964](https://github.com/BerriAI/litellm/issues/964)

對 beta 端點的意見回饋非常有價值，並有助於改善所有使用者的 API。

## 新增額外模型資訊  {#add-additional-model-information}

如果您希望能新增模型的顯示名稱、說明與標籤，只要使用 `model_info:` 

```yaml
model_list:
  - model_name: "gpt-4"
    litellm_params:
      model: "gpt-4"
      api_key: "os.environ/OPENAI_API_KEY"
    model_info: # 👈 KEY CHANGE
      my_custom_key: "my_custom_value"
```

### 使用方式 {#usage}

1. 將額外資訊新增至模型 

```yaml
model_list:
  - model_name: "gpt-4"
    litellm_params:
      model: "gpt-4"
      api_key: "os.environ/OPENAI_API_KEY"
    model_info: # 👈 KEY CHANGE
      my_custom_key: "my_custom_value"
```

2. 使用 `/model/info` 呼叫 

使用具有模型存取權限的金鑰 `gpt-4`。

```bash
curl -L -X GET 'http://0.0.0.0:4000/v1/model/info' \
-H 'Authorization: Bearer LITELLM_KEY' \
```

3. **預期回應**

傳回的 `model_info = Your custom model_info + (if exists) LITELLM MODEL INFO`

[**LiteLLM 模型資訊如何被找到**](https://github.com/BerriAI/litellm/blob/9b46ec05b02d36d6e4fb5c32321e51e7f56e4a6e/litellm/proxy/proxy_server.py#L7460) 

[告訴我們這可以如何改進！](https://github.com/BerriAI/litellm/issues)

```bash
{
    "data": [
        {
            "model_name": "gpt-4",
            "litellm_params": {
                "model": "gpt-4"
            },
            "model_info": {
                "id": "e889baacd17f591cce4c63639275ba5e8dc60765d6c553e6ee5a504b19e50ddc",
                "db_model": false,
                "my_custom_key": "my_custom_value", # 👈 CUSTOM INFO
                "key": "gpt-4", # 👈 KEY in LiteLLM MODEL INFO/COST MAP - https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json
                "max_tokens": 4096,
                "max_input_tokens": 8192,
                "max_output_tokens": 4096,
                "input_cost_per_token": 3e-05,
                "input_cost_per_character": null,
                "input_cost_per_token_above_128k_tokens": null,
                "output_cost_per_token": 6e-05,
                "output_cost_per_character": null,
                "output_cost_per_token_above_128k_tokens": null,
                "output_cost_per_character_above_128k_tokens": null,
                "output_vector_size": null,
                "litellm_provider": "openai",
                "mode": "chat"
            }
        },
    ]
}
```
