# 檔案管理 {#file-management}

## `include` config.yaml 中的外部 YAML 檔案 {#include-external-yaml-files-in-a-configyaml}

您可以使用 `include` 將外部 YAML 檔案包含到 config.yaml 中。 

**快速上手用法：**

若要包含設定檔，請使用 `include`，可搭配單一檔案或檔案清單。 

`parent_config.yaml` 的內容：
```yaml
include:
  - model_config.yaml # 👈 Key change, will include the contents of model_config.yaml

litellm_settings:
  callbacks: ["prometheus"] 
```


`model_config.yaml` 的內容：
```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_base: https://exampleopenaiendpoint-production.up.railway.app/
  - model_name: fake-anthropic-endpoint
    litellm_params:
      model: anthropic/fake
      api_base: https://exampleanthropicendpoint-production.up.railway.app/

```

啟動 proxy server 

這會使用設定 `parent_config.yaml` 啟動 proxy server。由於使用了 `include` 指令，server 也會包含 `model_config.yaml` 的內容。
```
litellm --config parent_config.yaml --detailed_debug
```


## 使用 `include` 的範例 {#examples-using-include}

包含單一檔案：
```yaml
include:
  - model_config.yaml
```

包含多個檔案：
```yaml
include:
  - model_config.yaml
  - another_config.yaml
```
